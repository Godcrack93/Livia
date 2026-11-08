/* Sprunkinhos — motor de áudio. Tudo é sintetizado com Web Audio, no mesmo tom e andamento. */
(function () {
  'use strict';
  const BPM = 118, STEP = 60 / BPM / 4, SWING = 0.12, TONIC = 64, LOOK = 0.14;
  // dia: Mi maior · noite (Lua): Mi menor · terror: Mi menor harmônica (o acorde de Si vira maior e soa dramático)
  const SCALES = { day: [0, 2, 4, 5, 7, 9, 11], night: [0, 2, 3, 5, 7, 8, 10], horror: [0, 2, 3, 5, 7, 8, 11] };
  const PROG = [0, 4, 5, 3]; // I – V – vi – IV (Mi maior); à noite vira i – v – VI – iv (Mi menor)
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function d2m(deg, mode) {
    const sc = SCALES[mode] || SCALES.day;
    const o = Math.floor(deg / 7), i = ((deg % 7) + 7) % 7;
    return TONIC + 12 * o + sc[i];
  }
  // formantes aproximados (freq, ganho, Q) de vozes infantis
  const VOW = {
    a: [[850, 1, 5], [1250, 0.55, 8], [2900, 0.25, 10]],
    e: [[520, 1, 5], [1950, 0.45, 9], [2800, 0.3, 10]],
    i: [[320, 1, 5], [2350, 0.5, 10], [3100, 0.35, 10]],
    o: [[540, 1, 5], [900, 0.6, 8], [2800, 0.2, 10]],
    u: [[360, 1, 5], [820, 0.4, 8], [2700, 0.12, 10]],
  };

  class Engine {
    constructor(ctx) {
      this.ctx = ctx || null;
      this.voices = new Map();
      this.vis = [];
      this.log = [];
      this.mode = 'day'; this.pendingMode = 'day';
      this.horror = false; this.pendingHorror = false; this.amb = null;
      this.step = 0; this.nextTime = 0; this.jingle = -1;
      if (ctx) this.build();
    }
    ok() { return !!this.ctx; }
    init() {
      if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* opcional */ }
      try { this.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { this.ctx = new AC(); }
      this.build();
      this.ctx.resume();
      this.nextTime = this.ctx.currentTime + 0.06;
      this.startClock();
    }
    build() {
      const c = this.ctx;
      const n = c.sampleRate * 2, nb = c.createBuffer(1, n, c.sampleRate), nd = nb.getChannelData(0);
      for (let i = 0; i < n; i++) nd[i] = Math.random() * 2 - 1;
      this.noiseBuf = nb;
      this.bus = c.createGain();
      this.tone = this.f('lowpass', 18000, 0.5);
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
      const lim = c.createDynamicsCompressor();
      lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.1;
      this.master = c.createGain(); this.master.gain.value = 0.9;
      this.bus.connect(this.tone); this.tone.connect(comp); comp.connect(lim); lim.connect(this.master); this.master.connect(c.destination);
      // reverb
      this.revIn = c.createGain();
      const conv = c.createConvolver(); conv.buffer = this.makeIR(2.6);
      this.revOut = c.createGain(); this.revOut.gain.value = 0.85;
      this.revIn.connect(conv); conv.connect(this.revOut); this.revOut.connect(this.bus);
      // delay pingue-pongue em colcheia pontuada
      this.dlyIn = c.createGain();
      const dl = c.createDelay(2), dr = c.createDelay(2);
      dl.delayTime.value = STEP * 3; dr.delayTime.value = STEP * 3;
      const fb = c.createGain(); fb.gain.value = 0.38;
      const dlp = this.f('lowpass', 3200), dhp = this.f('highpass', 300);
      this.dlyIn.connect(dhp); dhp.connect(dl); dl.connect(dr); dr.connect(dlp); dlp.connect(fb); fb.connect(dl);
      const pl = this.panner(-0.65), pr = this.panner(0.65), dOut = c.createGain(); dOut.gain.value = 0.7;
      dl.connect(pl); pl.connect(dOut); dr.connect(pr); pr.connect(dOut); dOut.connect(this.bus);
    }
    panner(v) {
      const c = this.ctx;
      if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = v; return p; }
      return c.createGain();
    }
    makeIR(sec) {
      const c = this.ctx, sr = c.sampleRate, n = Math.floor(sr * sec), b = c.createBuffer(2, n, sr), pre = Math.floor(sr * 0.012);
      for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch); let lp = 0;
        for (let i = 0; i < n; i++) {
          const x = i / n; lp += (Math.random() * 2 - 1 - lp) * (0.18 + 0.6 * (1 - x));
          d[i] = i < pre ? 0 : lp * Math.pow(1 - x, 2.4);
        }
      }
      return b;
    }

    // ---------- relógio ----------
    startClock() {
      const tick = () => this.tick();
      // Reserva: mantém o ritmo mesmo se o worker não carregar (ex.: página aberta direto do disco). tick() pode ser chamado de sobra.
      this.timer = setInterval(tick, 30);
      try {
        const src = 'let t=null;onmessage=e=>{clearInterval(t);if(e.data)t=setInterval(()=>postMessage(1),25)};';
        this.worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
        this.worker.onmessage = tick; this.worker.postMessage(1);
      } catch (e) { /* o intervalo de reserva já cobre */ }
    }
    tick() {
      const c = this.ctx; if (!c || c.state !== 'running') return;
      const now = c.currentTime;
      if (this.nextTime < now - 0.08) { const miss = Math.ceil((now - this.nextTime) / STEP); this.step += miss; this.nextTime += miss * STEP; }
      while (this.nextTime < now + LOOK) {
        this.scheduleStep(this.step, this.nextTime);
        this.log.push([this.step, this.nextTime]); if (this.log.length > 48) this.log.shift();
        this.nextTime += STEP; this.step++;
      }
    }
    now() {
      const c = this.ctx; if (!c) return 0;
      const lat = Math.min(0.25, (c.outputLatency || 0) + (c.baseLatency || 0));
      return c.currentTime - lat;
    }
    posAt(t) {
      const L = this.log; if (!L.length) return 0;
      let e = L[0];
      for (let i = L.length - 1; i >= 0; i--) if (L[i][1] <= t) { e = L[i]; break; }
      return e[0] + (t - e[1]) / STEP;
    }
    timeOfStep(s) { return this.nextTime + (s - this.step) * STEP; }
    m(deg) { return d2m(deg, this.horror ? 'horror' : this.mode); }

    scheduleStep(s, t) {
      if (s % 16 === 0 && this.pendingMode !== this.mode) {
        this.mode = this.pendingMode; this.vis.push({ t, kind: 'mode', mode: this.mode }); this.modeFx(t);
      }
      if (s % 4 === 0 && this.pendingHorror !== this.horror) {
        this.horror = this.pendingHorror; this.vis.push({ t, kind: 'horror', on: this.horror }); this.horrorFx(t);
      }
      if (s % 4 === 0) this.vis.push({ t, kind: 'beat', s });
      const sw = (s % 2) ? SWING * STEP : 0;
      const MU = window.SPR_MUSIC, H = this.horror;
      let anySolo = false;
      for (const v of this.voices.values()) if (v.solo) { anySolo = true; break; }
      for (const v of this.voices.values()) {
        if (s < v.start || v.muted || (anySolo && !v.solo)) continue;
        const P = (H && MU.PATH[v.id]) || MU.PAT[v.id], play = (H && MU.PLAYH[v.id]) || MU.PLAY[v.id];
        if (!P) continue;
        const evs = P.steps[((s % P.len) + P.len) % P.len];
        for (let i = 0; i < evs.length; i++) play(this, v, evs[i], t + sw + (evs[i].o || 0) * STEP, s);
      }
      if (this.jingle === s) { this.jingle = -1; this.playJingle(t, s); }
    }

    // ---------- vozes (personagens no palco) ----------
    add(id, pan) {
      const c = this.ctx, mx = this.mixOf(id);
      const ch = { in: c.createGain(), g: c.createGain(), p: this.panner(pan || 0), rev: c.createGain(), dly: c.createGain() };
      ch.in.gain.value = mx.vol; ch.rev.gain.value = mx.rev; ch.dly.gain.value = mx.dly;
      ch.in.connect(ch.g); ch.g.connect(ch.p); ch.p.connect(this.bus);
      ch.g.connect(ch.rev); ch.rev.connect(this.revIn); ch.g.connect(ch.dly); ch.dly.connect(this.dlyIn);
      let start;
      if (this.voices.size === 0) { this.step = 0; start = 0; } // palco vazio: a música começa do compasso 1
      else { const q = id === 'lua' ? 16 : 4; start = Math.ceil(this.step / q) * q; }
      const v = { id, ch, start, muted: false, solo: false };
      this.voices.set(id, v);
      if (id === 'lua') this.pendingMode = 'night';
      this.refreshGains();
      return this.timeOfStep(start);
    }
    remove(id) {
      const v = this.voices.get(id); if (!v) return;
      this.voices.delete(id);
      const t = this.ctx.currentTime, g = v.ch.g.gain;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + 0.08);
      setTimeout(() => { try { ['in', 'g', 'p', 'rev', 'dly'].forEach(k => v.ch[k].disconnect()); } catch (e) { /* já desconectado */ } }, 1500);
      if (id === 'lua') this.pendingMode = 'day';
      this.refreshGains();
    }
    setPan(id, pan) { const v = this.voices.get(id); if (v && v.ch.p.pan) v.ch.p.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.05); }
    setMute(id, on) { const v = this.voices.get(id); if (v) { v.muted = on; this.refreshGains(); } }
    setSolo(id, on) { const v = this.voices.get(id); if (v) { v.solo = on; this.refreshGains(); } }
    refreshGains() {
      const t = this.ctx.currentTime; let anySolo = false;
      for (const v of this.voices.values()) if (v.solo) anySolo = true;
      for (const v of this.voices.values()) {
        const on = !v.muted && (!anySolo || v.solo), g = v.ch.g.gain;
        g.cancelScheduledValues(t); g.setTargetAtTime(on ? 1 : 0, t, 0.03);
      }
    }
    modeFx(t) {
      if (this.horror) return;
      const n = this.mode === 'night';
      this.revOut.gain.setTargetAtTime(n ? 1.35 : 0.85, t, 0.4);
      this.tone.frequency.setTargetAtTime(n ? 6500 : 18000, t, 0.3);
    }

    // ---------- modo terror ----------
    mixOf(id) {
      const MU = window.SPR_MUSIC;
      return (this.horror && MU.MIXH[id]) || MU.MIX[id] || { vol: 0.6, rev: 0.1, dly: 0 };
    }
    setHorror(on) { this.pendingHorror = !!on; }
    horrorFx(t) {
      const h = this.horror, n = this.mode === 'night';
      this.revOut.gain.setTargetAtTime(h ? 1.6 : n ? 1.35 : 0.85, t, 0.4);
      this.tone.frequency.setTargetAtTime(h ? 9000 : n ? 6500 : 18000, t, 0.3);
      for (const v of this.voices.values()) {
        const mx = this.mixOf(v.id);
        v.ch.in.gain.setTargetAtTime(mx.vol, t, 0.05); v.ch.rev.gain.setTargetAtTime(mx.rev, t, 0.05); v.ch.dly.gain.setTargetAtTime(mx.dly, t, 0.05);
      }
      if (h) this.ambStart(t); else this.ambStop(t);
    }
    // ambiente sombrio: zumbido grave em Mi e Si + vento
    ambStart(t) {
      if (this.amb) return;
      const c = this.ctx, out = this.g(0);
      out.connect(this.bus); out.connect(this.revIn);
      out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(1, t + 2.5);
      const lp = this.f('lowpass', 320, 2); lp.connect(out);
      const nodes = [[40, -7], [40, 7], [47, 0]].map(([m, det]) => {
        const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m) * Math.pow(2, det / 1200);
        const g = this.g(0.045); o.connect(g); g.connect(lp); o.start(t); return o;
      });
      const lfo = c.createOscillator(); lfo.frequency.value = 0.07; const lg = this.g(160); lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t);
      const n = c.createBufferSource(); n.buffer = this.noiseBuf; n.loop = true;
      const bp = this.f('bandpass', 700, 1.2), ng = this.g(0.05); n.connect(bp); bp.connect(ng); ng.connect(out); n.start(t);
      const lfo2 = c.createOscillator(); lfo2.frequency.value = 0.11; const lg2 = this.g(450); lfo2.connect(lg2); lg2.connect(bp.frequency); lfo2.start(t);
      this.amb = { out, nodes: nodes.concat([lfo, n, lfo2]) };
    }
    ambStop(t) {
      const a = this.amb; if (!a) return;
      this.amb = null;
      a.out.gain.cancelScheduledValues(t); a.out.gain.setValueAtTime(a.out.gain.value, t); a.out.gain.linearRampToValueAtTime(0, t + 1.2);
      a.nodes.forEach(x => x.stop(t + 1.3));
    }
    thunder(big) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime + 0.01, dur = big ? 3 : 2.2;
      const n = this.nz(t, dur), lp = this.f('lowpass', 1600, 0.8), g = this.g(), p = g.gain;
      lp.frequency.setValueAtTime(2400, t); lp.frequency.exponentialRampToValueAtTime(140, t + dur);
      p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(big ? 0.9 : 0.55, t + 0.03); p.exponentialRampToValueAtTime(big ? 0.35 : 0.2, t + 0.4); p.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(lp); lp.connect(g); g.connect(this.bus); g.connect(this.revIn);
      const o = this.o('sine', 55, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.5);
      const og = this.g(); this.perc(og, t, big ? 0.6 : 0.35, 1.6, 0.05); o.connect(og); og.connect(this.bus); o.start(t); o.stop(t + 1.8);
    }
    whisper() {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime + 0.02, dur = 1.5;
      const n = this.nz(t, dur), b1 = this.f('bandpass', 2600, 6), b2 = this.f('bandpass', 1100, 5), g = this.g(), pan = this.panner(Math.random() * 1.6 - 0.8);
      b1.frequency.setValueAtTime(3200, t); b1.frequency.linearRampToValueAtTime(1800, t + dur);
      b2.frequency.setValueAtTime(700, t); b2.frequency.linearRampToValueAtTime(1300, t + dur * 0.6);
      const p = g.gain; p.setValueAtTime(0, t); p.linearRampToValueAtTime(0.4, t + 0.25); p.setValueAtTime(0.4, t + dur * 0.6); p.linearRampToValueAtTime(0, t + dur);
      n.connect(b1); n.connect(b2); b1.connect(g); b2.connect(g); g.connect(pan); pan.connect(this.bus); g.connect(this.revIn);
      const o = this.o('sine', 48, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.2);
      const og = this.g(); this.perc(og, t, 0.5, 1.3, 0.02); o.connect(og); og.connect(this.bus); o.start(t); o.stop(t + 1.4);
    }
    pause() { if (this.ctx) this.ctx.suspend(); }
    resume() { if (this.ctx) this.ctx.resume(); }
    requestJingle() { if (this.ctx) this.jingle = Math.ceil(this.step / 16) * 16; }

    // ---------- blocos básicos ----------
    o(type, f, t) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); return o; }
    g(v) { const g = this.ctx.createGain(); g.gain.value = v == null ? 0 : v; return g; }
    f(type, freq, Q) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = freq; if (Q != null) b.Q.value = Q; return b; }
    nz(t, dur) {
      const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
      if (dur > 1.9) { s.loop = true; s.start(t); s.stop(t + dur + 0.02); }
      else s.start(t, Math.random() * Math.max(0, 1.95 - dur), dur + 0.02);
      return s;
    }
    perc(g, t, peak, dec, att) {
      const p = g.gain; att = att || 0.002;
      p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + att); p.exponentialRampToValueAtTime(0.0001, t + att + dec);
    }
    show(id, t, dur, v, shape, kind) { this.vis.push({ t, id, dur, v, shape, kind: kind || 'note' }); }

    // ---------- percussão ----------
    kick(out, t, v) {
      const o = this.o('sine', 165, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.14);
      const g = this.g(); this.perc(g, t, v, 0.42); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.5);
      const o2 = this.o('triangle', 330, t); o2.frequency.exponentialRampToValueAtTime(90, t + 0.08);
      const g2 = this.g(); this.perc(g2, t, v * 0.3, 0.09); o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 0.12);
      const n = this.nz(t, 0.03), hp = this.f('highpass', 2800), g3 = this.g(); this.perc(g3, t, v * 0.25, 0.02);
      n.connect(hp); hp.connect(g3); g3.connect(out);
    }
    snare(out, t, v) {
      const n = this.nz(t, 0.25), hp = this.f('highpass', 1000), bp = this.f('bandpass', 2600, 0.6), g = this.g();
      this.perc(g, t, v * 0.65, 0.19); n.connect(hp); hp.connect(bp); bp.connect(g); g.connect(out);
      const o = this.o('triangle', 230, t); o.frequency.exponentialRampToValueAtTime(165, t + 0.07);
      const g2 = this.g(); this.perc(g2, t, v * 0.5, 0.09); o.connect(g2); g2.connect(out); o.start(t); o.stop(t + 0.12);
    }
    hat(out, t, v, open) {
      const dec = open ? 0.3 : 0.05, mixG = this.g(0.8);
      [2, 3, 4.16, 5.43, 6.79, 8.21].forEach(r => { const o = this.o('square', 40 * r, t); o.connect(mixG); o.start(t); o.stop(t + dec + 0.05); });
      const bp = this.f('bandpass', 10000, 0.8), hp = this.f('highpass', 7000), g = this.g();
      this.perc(g, t, v * 0.9, dec); mixG.connect(bp); bp.connect(hp); hp.connect(g); g.connect(out);
      const n = this.nz(t, dec + 0.05), hp2 = this.f('highpass', 8000), g2 = this.g();
      this.perc(g2, t, v * 0.45, dec * 0.8); n.connect(hp2); hp2.connect(g2); g2.connect(out);
    }
    clap(out, t, v) {
      const n = this.nz(t, 0.3), hp = this.f('highpass', 700), bp = this.f('bandpass', 1350, 1.1), g = this.g(), p = g.gain;
      p.setValueAtTime(0.0001, t);
      [0, 0.011, 0.022].forEach(d => { p.setValueAtTime(v * 0.9, t + d); p.exponentialRampToValueAtTime(v * 0.12, t + d + 0.009); });
      p.setValueAtTime(v * 0.75, t + 0.032); p.exponentialRampToValueAtTime(0.0001, t + 0.24);
      n.connect(hp); hp.connect(bp); bp.connect(g); g.connect(out);
    }
    shaker(out, t, v) {
      const n = this.nz(t, 0.12), bp = this.f('bandpass', 6500, 1.2), hp = this.f('highpass', 4200), g = this.g(), p = g.gain;
      p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(v * 0.4, t + 0.018); p.exponentialRampToValueAtTime(0.0001, t + 0.09);
      n.connect(bp); bp.connect(hp); hp.connect(g); g.connect(out);
    }
    bbKick(out, t, v) {
      const o = this.o('sine', 125, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.1);
      const g = this.g(); this.perc(g, t, v * 0.9, 0.22); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.26);
      const n = this.nz(t, 0.05), lp = this.f('lowpass', 900), g2 = this.g(); this.perc(g2, t, v * 0.45, 0.035);
      n.connect(lp); lp.connect(g2); g2.connect(out);
    }
    bbTs(out, t, v) {
      const n = this.nz(t, 0.14), hp = this.f('highpass', 5200), bp = this.f('bandpass', 8000, 0.7), g = this.g(), p = g.gain;
      p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(v * 0.55, t + 0.005); p.exponentialRampToValueAtTime(0.0001, t + 0.11);
      n.connect(hp); hp.connect(bp); bp.connect(g); g.connect(out);
    }
    bbPf(out, t, v) {
      const n = this.nz(t, 0.22), bp = this.f('bandpass', 1700, 0.8), hp = this.f('highpass', 450), g = this.g();
      this.perc(g, t, v * 0.8, 0.17, 0.004); n.connect(bp); bp.connect(hp); hp.connect(g); g.connect(out);
      const o = this.o('sine', 200, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.05);
      const g2 = this.g(); this.perc(g2, t, v * 0.35, 0.06); o.connect(g2); g2.connect(out); o.start(t); o.stop(t + 0.08);
    }
    bbK(out, t, v) {
      const n = this.nz(t, 0.05), bp = this.f('bandpass', 3000, 3.5), g = this.g();
      this.perc(g, t, v * 0.9, 0.035); n.connect(bp); bp.connect(g); g.connect(out);
      const o = this.o('sine', 1500, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.02);
      const g2 = this.g(); this.perc(g2, t, v * 0.18, 0.02); o.connect(g2); g2.connect(out); o.start(t); o.stop(t + 0.04);
    }
    bongo(out, t, v, hi) {
      const f = mtof(hi ? 64 : 59), o = this.o('sine', f * 1.35, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.018);
      const g = this.g(); this.perc(g, t, v * 0.8, hi ? 0.14 : 0.21); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.25);
      const n = this.nz(t, 0.03), bp = this.f('bandpass', 2200, 2), g2 = this.g(); this.perc(g2, t, v * 0.25, 0.018);
      n.connect(bp); bp.connect(g2); g2.connect(out);
    }
    cowbell(out, t, v) {
      const m = this.g(0.5);
      [mtof(71), mtof(78)].forEach(f => { const o = this.o('square', f, t); o.connect(m); o.start(t); o.stop(t + 0.4); });
      const bp = this.f('bandpass', 900, 1.4), g = this.g(), p = g.gain;
      p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(v * 0.35, t + 0.002); p.exponentialRampToValueAtTime(v * 0.1, t + 0.05); p.exponentialRampToValueAtTime(0.0001, t + 0.35);
      m.connect(bp); bp.connect(g); g.connect(out);
    }

    // ---------- efeitos ----------
    zap(out, t, v, midi) {
      const f = mtof(midi), o = this.o('square', f * 6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.15);
      const lp = this.f('lowpass', 3800, 2), g = this.g(); this.perc(g, t, v * 0.3, 0.2);
      o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + 0.24);
    }
    boing(out, t, v, midi) {
      const f = mtof(midi), o = this.o('triangle', f, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.6);
      const l = this.o('sine', 14, t), lg = this.g(); lg.gain.setValueAtTime(f * 0.3, t); lg.gain.exponentialRampToValueAtTime(f * 0.01, t + 0.6);
      l.connect(lg); lg.connect(o.frequency);
      const g = this.g(); this.perc(g, t, v * 0.55, 0.7); o.connect(g); g.connect(out);
      o.start(t); o.stop(t + 0.75); l.start(t); l.stop(t + 0.75);
    }
    bloop(out, t, v, midi) {
      const f = mtof(midi), o = this.o('sine', f * 0.6, t); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.09);
      const g = this.g(); this.perc(g, t, v * 0.5, 0.13); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.16);
    }
    scratch(out, t, v, dir, len) {
      const dur = Math.max(0.06, len * STEP * 0.92), N = 48, fc = new Float32Array(N), ac = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const x = i / (N - 1), a = Math.sin(Math.PI * x);
        fc[i] = 210 * (dir === 'f' ? 0.4 + 1.7 * a * (0.55 + 0.45 * x) : 0.4 + 1.3 * a * (1 - 0.35 * x));
        ac[i] = Math.pow(a, 0.7) * v * 0.5;
      }
      const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fc[0];
      o.frequency.setValueCurveAtTime(fc, t, dur);
      const sum = this.g(1);
      [[750, 5, 3], [1200, 7, 1.8], [2600, 8, 0.9]].forEach(([fr, q, a]) => { const b = this.f('bandpass', fr, q), gg = this.g(a); o.connect(b); b.connect(gg); gg.connect(sum); });
      const n = this.nz(t, dur), nb = this.f('bandpass', 1800, 1), ng = this.g(0.25); n.connect(nb); nb.connect(ng); ng.connect(sum);
      const g = this.g(0); g.gain.setValueCurveAtTime(ac, t, dur);
      sum.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
    }
    sparkle(out, t, v, midi) {
      [[0, midi + 12, 0.5], [0.035, midi, 1]].forEach(([dt, m, a]) => {
        const f = mtof(m), tt = t + dt, o = this.o('triangle', f, tt), g = this.g();
        this.perc(g, tt, v * 0.22 * a, 0.45); o.connect(g); g.connect(out); o.start(tt); o.stop(tt + 0.5);
        const o2 = this.o('sine', f * 2, tt), g2 = this.g(); this.perc(g2, tt, v * 0.06 * a, 0.18);
        o2.connect(g2); g2.connect(out); o2.start(tt); o2.stop(tt + 0.22);
      });
    }
    bleep(out, t, v, midi, len) {
      const f = mtof(midi), dur = Math.max(0.05, len * STEP * 0.7), o = this.o('square', f * 1.08, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.025);
      const bp = this.f('bandpass', 1900, 0.8), g = this.g(), p = g.gain;
      p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(v * 0.3, t + 0.004); p.setValueAtTime(v * 0.3, t + dur); p.exponentialRampToValueAtTime(0.0001, t + dur + 0.03);
      o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
    }

    // ---------- melodias ----------
    bass(out, t, v, midi, len) {
      const f = mtof(midi), dur = len * STEP * 0.9, dk = Math.min(0.12, dur * 0.6);
      const o1 = this.o('sawtooth', f, t), o2 = this.o('square', f * 0.997, t), sub = this.o('sine', f, t);
      const lp = this.f('lowpass', 400, 5);
      lp.frequency.setValueAtTime(380, t); lp.frequency.exponentialRampToValueAtTime(1500 + 900 * v, t + 0.012); lp.frequency.exponentialRampToValueAtTime(480, t + 0.22);
      const m1 = this.g(0.42), m2 = this.g(0.28), ms = this.g(0.55), g = this.g(), p = g.gain;
      p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(v * 0.6, t + 0.005); p.exponentialRampToValueAtTime(v * 0.42, t + dk);
      p.setValueAtTime(v * 0.42, t + dur); p.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
      o1.connect(m1); m1.connect(lp); o2.connect(m2); m2.connect(lp); lp.connect(g); sub.connect(ms); ms.connect(g); g.connect(out);
      [o1, o2, sub].forEach(o => { o.start(t); o.stop(t + dur + 0.08); });
    }
    ep(out, t, v, midi, len) {
      const f = mtof(midi), dur = Math.max(0.1, len * STEP);
      const car = this.o('sine', f, t), mod = this.o('sine', f, t), mg = this.g();
      mg.gain.setValueAtTime(f * 1.8 * v, t); mg.gain.exponentialRampToValueAtTime(f * 0.2, t + 0.4);
      mod.connect(mg); mg.connect(car.frequency);
      const tine = this.o('sine', f * 4, t), tg = this.g(); this.perc(tg, t, v * 0.05, 0.07);
      const g = this.g(), p = g.gain;
      p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(v * 0.24, t + 0.004); p.exponentialRampToValueAtTime(v * 0.13, t + Math.min(0.25, dur * 0.8));
      p.setTargetAtTime(0.0001, t + dur, 0.07);
      car.connect(g); g.connect(out); tine.connect(tg); tg.connect(out);
      [car, mod].forEach(o => { o.start(t); o.stop(t + dur + 0.5); }); tine.start(t); tine.stop(t + 0.1);
    }
    pluck(out, t, v, midi) {
      const f = mtof(midi), o = this.o('square', f, t), o2 = this.o('triangle', f * 1.004, t);
      const lp = this.f('lowpass', 5000, 3); lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(900, t + 0.13);
      const g = this.g(), m = this.g(0.5); this.perc(g, t, v * 0.2, 0.2);
      o.connect(m); o2.connect(m); m.connect(lp); lp.connect(g); g.connect(out);
      [o, o2].forEach(x => { x.start(t); x.stop(t + 0.25); });
    }
    bell(out, t, v, midi) {
      const f = mtof(midi);
      [[1, 1, 1.5], [2.76, 0.34, 0.5], [5.4, 0.12, 0.25], [8.93, 0.05, 0.12]].forEach(([r, a, d]) => {
        const o = this.o('sine', f * r, t), g = this.g(); this.perc(g, t, v * 0.22 * a, d);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.05);
      });
    }
    flute(out, t, v, midi, len, op) {
      op = op || {};
      const f = mtof(midi), dur = Math.max(0.12, len * STEP * 0.95);
      const o = this.o('sine', f * 0.985, t); o.frequency.linearRampToValueAtTime(f, t + 0.06);
      const o2 = this.o('triangle', f, t), g2 = this.g(0.22);
      if (op.droop) {
        const ds = t + Math.max(0.08, dur * 0.7), fe = f * Math.pow(2, -op.droop / 12);
        [o, o2].forEach(x => { x.frequency.setValueAtTime(f, ds); x.frequency.exponentialRampToValueAtTime(fe, t + dur); });
      }
      const l = this.o('sine', op.vibRate || 5.2, t), lg = this.g(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.007 * (op.vib || 1), t + Math.min(0.35, dur));
      l.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
      const n = this.nz(t, dur), nb = this.f('bandpass', f * 2, 1.6), ng = this.g(), br = op.breath || 1;
      ng.gain.setValueAtTime(v * 0.05 * br, t); ng.gain.exponentialRampToValueAtTime(v * 0.012 * br, t + 0.2); n.connect(nb); nb.connect(ng);
      const g = this.g(), p = g.gain;
      p.setValueAtTime(0, t); p.linearRampToValueAtTime(v * 0.28, t + 0.05); p.setValueAtTime(v * 0.28, t + dur); p.linearRampToValueAtTime(0, t + dur + 0.07);
      o.connect(g); o2.connect(g2); g2.connect(g); ng.connect(g); g.connect(out);
      [o, o2, l].forEach(x => { x.start(t); x.stop(t + dur + 0.1); });
    }
    theremin(out, t, v, midi, len, prevMidi, op) {
      if (op && op.trem) {
        const tr = this.g(1 - op.trem / 2), tl = this.o('sine', 7, t), tlg = this.g(op.trem / 2), d = len * STEP + 0.3;
        tl.connect(tlg); tlg.connect(tr.gain); tr.connect(out); tl.start(t); tl.stop(t + d);
        out = tr;
      }
      const f = mtof(midi), fp = prevMidi ? mtof(prevMidi) : f * 0.94, dur = len * STEP * 0.95;
      const o = this.o('sine', fp, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.16);
      const o2 = this.o('triangle', fp * 2, t); o2.frequency.exponentialRampToValueAtTime(f * 2, t + 0.16);
      const l = this.o('sine', 6.2, t), lg = this.g(), lg2 = this.g(2);
      lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.016, t + 0.3);
      l.connect(lg); lg.connect(o.frequency); lg.connect(lg2); lg2.connect(o2.frequency);
      const g = this.g(), g2 = this.g(0.06), p = g.gain;
      p.setValueAtTime(0, t); p.linearRampToValueAtTime(v * 0.3, t + 0.09); p.setValueAtTime(v * 0.3, t + dur); p.linearRampToValueAtTime(0, t + dur + 0.2);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(out);
      [o, o2, l].forEach(x => { x.start(t); x.stop(t + dur + 0.25); });
    }

    // ---------- vozes (síntese de formantes) ----------
    voice(out, t, v, midi, len, op) {
      op = op || {};
      const f = mtof(midi), dur = Math.max(0.06, len * STEP * (op.gate || 0.9)), rel = op.rel || 0.07, att = op.att || 0.02;
      const src = this.g(1), oscs = [];
      const mk = det => {
        const fd = f * Math.pow(2, det / 1200);
        const o = this.o('sawtooth', op.scoop ? fd * Math.pow(2, -op.scoop / 12) : fd, t);
        if (op.scoop) o.frequency.exponentialRampToValueAtTime(fd, t + 0.07);
        if (op.droop) {
          const ds = t + Math.max(0.075, dur * 0.65);
          if (ds < t + dur) { o.frequency.setValueAtTime(fd, ds); o.frequency.exponentialRampToValueAtTime(fd * Math.pow(2, -op.droop / 12), t + dur); }
        }
        o.connect(src); oscs.push(o);
      };
      mk(0); if (op.det) mk(op.det);
      const l = this.o('sine', op.vibRate || 5.6, t), lg = this.g();
      lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.009 * (op.vib == null ? 1 : op.vib), t + Math.min(0.35, dur));
      l.connect(lg); oscs.forEach(o => lg.connect(o.frequency));
      const V1 = VOW[op.from || op.vow || 'a'], V2 = VOW[op.vow || 'a'], V3 = op.to ? VOW[op.to] : null, morph = op.morph || 0.06;
      const sum = this.g(1);
      for (let k = 0; k < 3; k++) {
        const b = this.f('bandpass', V1[k][0], V1[k][2]);
        if (op.from) { b.frequency.setValueAtTime(V1[k][0], t); b.frequency.linearRampToValueAtTime(V2[k][0], t + morph); }
        if (V3) { b.frequency.setValueAtTime(V2[k][0], t + Math.max(morph, dur * 0.5)); b.frequency.linearRampToValueAtTime(V3[k][0], t + dur); }
        const gg = this.g(V2[k][1] * Math.pow(op.bright || 1, k) * 3.2);
        src.connect(b); b.connect(gg); gg.connect(sum);
      }
      const dp = this.f('lowpass', 900), dg = this.g(op.body == null ? 0.12 : op.body); src.connect(dp); dp.connect(dg); dg.connect(sum);
      const lpm = this.f('lowpass', 6000, 0.7);
      if (op.end === 'm') { lpm.frequency.setValueAtTime(6000, t + dur * 0.5); lpm.frequency.exponentialRampToValueAtTime(600, t + dur * 0.7); }
      const g = this.g(), p = g.gain, lvl = v * 0.5;
      p.setValueAtTime(0, t); p.linearRampToValueAtTime(lvl, t + att);
      if (op.end === 'm') { p.setValueAtTime(lvl, t + dur * 0.55); p.linearRampToValueAtTime(lvl * 0.35, t + dur * 0.7); }
      p.setValueAtTime(op.end === 'm' ? lvl * 0.35 : lvl, t + dur); p.linearRampToValueAtTime(0, t + dur + rel);
      sum.connect(lpm); lpm.connect(g); g.connect(out);
      if (op.cons) {
        const n = this.nz(t, 0.03), nb = this.f(op.cons === 't' ? 'highpass' : 'bandpass', op.cons === 't' ? 4000 : 2800, 1), ng = this.g();
        this.perc(ng, t, v * 0.18, 0.016); n.connect(nb); nb.connect(ng); ng.connect(out);
      }
      oscs.forEach(o => { o.start(t); o.stop(t + dur + rel + 0.05); }); l.start(t); l.stop(t + dur + rel + 0.05);
    }
    choir(out, t, v, midis, len, op) {
      op = op || {};
      const dur = len * STEP, src = this.g(1), oscs = [], l = this.o('sine', 5.1, t), det = op.det || 8;
      const V1 = VOW[op.from || 'u'], V2 = VOW[op.to || 'o'];
      midis.forEach(m => {
        const f = mtof(m), lg = this.g(f * 0.004); l.connect(lg);
        [-det, det].forEach(dt => { const o = this.o('sawtooth', f * Math.pow(2, dt / 1200), t); o.connect(src); lg.connect(o.frequency); oscs.push(o); });
      });
      const sum = this.g(1);
      for (let k = 0; k < 3; k++) {
        const b = this.f('bandpass', V1[k][0], V1[k][2]);
        b.frequency.setValueAtTime(V1[k][0], t); b.frequency.linearRampToValueAtTime(V2[k][0], t + dur * 0.8);
        const gg = this.g(V1[k][1] * 2.6); src.connect(b); b.connect(gg); gg.connect(sum);
      }
      const g = this.g(), p = g.gain, lvl = v * 0.32 * (op.lvl || 1);
      p.setValueAtTime(0, t); p.linearRampToValueAtTime(lvl, t + 0.22); p.setValueAtTime(lvl, t + dur - 0.12); p.linearRampToValueAtTime(0, t + dur + 0.25);
      sum.connect(g); g.connect(out);
      oscs.forEach(o => { o.start(t); o.stop(t + dur + 0.3); }); l.start(t); l.stop(t + dur + 0.3);
    }

    // ---------- instrumentos do modo terror ----------
    heart(out, t, v) { // tum-tum de coração
      [[0, 1], [0.2, 0.62]].forEach(([dt, a]) => {
        const tt = t + dt, o = this.o('sine', 70, tt); o.frequency.exponentialRampToValueAtTime(38, tt + 0.16);
        const g = this.g(); this.perc(g, tt, v * a, 0.32, 0.006); o.connect(g); g.connect(out); o.start(tt); o.stop(tt + 0.4);
        const n = this.nz(tt, 0.06), lp = this.f('lowpass', 260), g2 = this.g(); this.perc(g2, tt, v * a * 0.6, 0.05);
        n.connect(lp); lp.connect(g2); g2.connect(out);
      });
    }
    slam(out, t, v) { // porta batendo
      const n = this.nz(t, 0.5), lp = this.f('lowpass', 1400, 0.7), g = this.g(); this.perc(g, t, v * 0.9, 0.35, 0.003);
      n.connect(lp); lp.connect(g); g.connect(out);
      const o = this.o('triangle', 110, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
      const g2 = this.g(); this.perc(g2, t, v * 0.5, 0.18); o.connect(g2); g2.connect(out); o.start(t); o.stop(t + 0.25);
    }
    clockTick(out, t, v, hi) { // tique-taque de relógio
      const o = this.o('square', hi ? 2300 : 1700, t), bp = this.f('bandpass', hi ? 2300 : 1700, 6), g = this.g(); this.perc(g, t, v * 0.5, 0.035);
      o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + 0.06);
      const o2 = this.o('sine', hi ? 900 : 700, t), g2 = this.g(); this.perc(g2, t, v * 0.25, 0.05); o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 0.08);
    }
    chime(out, t, v) {
      [[1, 1, 1.2], [2.41, 0.5, 0.8], [3.83, 0.3, 0.5], [5.2, 0.15, 0.3]].forEach(([r, a, d]) => {
        const o = this.o('sine', 1046 * r, t), g = this.g(); this.perc(g, t, v * 0.12 * a, d); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.05);
      });
    }
    growl(out, t, v) { // bumbo vocal rosnado
      const o = this.o('sine', 95, t); o.frequency.exponentialRampToValueAtTime(36, t + 0.14);
      const g = this.g(); this.perc(g, t, v * 0.9, 0.3); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.35);
      const s = this.o('sawtooth', 58, t), am = this.o('square', 32, t), amg = this.g(0.5), gg = this.g(0.5), lp = this.f('lowpass', 420, 2), g2 = this.g();
      am.connect(amg); amg.connect(gg.gain); s.connect(gg); gg.connect(lp); lp.connect(g2); this.perc(g2, t, v * 0.35, 0.22, 0.01); g2.connect(out);
      [s, am].forEach(x => { x.start(t); x.stop(t + 0.3); });
    }
    breath(out, t, v) { // "hhhh"
      const n = this.nz(t, 0.3), bp = this.f('bandpass', 1500, 1.4), g = this.g(), p = g.gain;
      p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(v * 0.45, t + 0.06); p.exponentialRampToValueAtTime(0.0001, t + 0.28);
      n.connect(bp); bp.connect(g); g.connect(out);
    }
    snarl(out, t, v) {
      const n = this.nz(t, 0.25), bp = this.f('bandpass', 700, 1.5), am = this.o('square', 38, t), amg = this.g(0.5), gg = this.g(0.5), g = this.g();
      am.connect(amg); amg.connect(gg.gain); n.connect(bp); bp.connect(gg); gg.connect(g); this.perc(g, t, v * 0.9, 0.2, 0.005); g.connect(out);
      am.start(t); am.stop(t + 0.25);
    }
    knock(out, t, v) {
      const o = this.o('sine', 190, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.05);
      const g = this.g(); this.perc(g, t, v * 0.7, 0.09); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.12);
      const n = this.nz(t, 0.04), bp = this.f('bandpass', 1100, 3), g2 = this.g(); this.perc(g2, t, v * 0.4, 0.03); n.connect(bp); bp.connect(g2); g2.connect(out);
    }
    rattle(out, t, v) { // chocalho de ossinhos
      for (let i = 0; i < 4; i++) {
        const tt = t + i * 0.018 + Math.random() * 0.006, n = this.nz(tt, 0.02), bp = this.f('bandpass', 2400 + Math.random() * 1200, 4), g = this.g();
        this.perc(g, tt, v * (0.5 - i * 0.08), 0.015); n.connect(bp); bp.connect(g); g.connect(out);
      }
    }
    tom(out, t, v, hi) {
      const f = mtof(hi ? 52 : 47), o = this.o('sine', f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
      const g = this.g(); this.perc(g, t, v * 0.85, hi ? 0.35 : 0.5); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.6);
      const n = this.nz(t, 0.05), lp = this.f('lowpass', 900), g2 = this.g(); this.perc(g2, t, v * 0.3, 0.04); n.connect(lp); lp.connect(g2); g2.connect(out);
    }
    clank(out, t, v) { // corrente / metal
      const m = this.g(0.33);
      [330, 523, 811].forEach(f => { const o = this.o('square', f, t); o.connect(m); o.start(t); o.stop(t + 0.7); });
      const bp = this.f('bandpass', 1200, 2.5), g = this.g(); this.perc(g, t, v * 0.35, 0.6); m.connect(bp); bp.connect(g); g.connect(out);
    }
    ghost(out, t, v, midi) { // "uuuuu" de fantasma descendo
      const f = mtof(midi), dur = 0.55, o = this.o('sine', f * 2, t); o.frequency.exponentialRampToValueAtTime(f, t + dur);
      const l = this.o('sine', 7, t), lg = this.g(f * 0.02); l.connect(lg); lg.connect(o.frequency);
      const g = this.g(), p = g.gain; p.setValueAtTime(0, t); p.linearRampToValueAtTime(v * 0.22, t + 0.08); p.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.15); l.start(t); l.stop(t + dur + 0.15);
    }
    creak(out, t, v, dur) { // porta rangendo
      const N = 64, fc = new Float32Array(N); let f = 180;
      for (let i = 0; i < N; i++) { f += (Math.random() - 0.45) * 60; f = Math.max(120, Math.min(520, f)); fc[i] = f; }
      const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fc[0]; o.frequency.setValueCurveAtTime(fc, t, dur);
      const bp = this.f('bandpass', 1500, 2.5), bp2 = this.f('bandpass', 3100, 4), g = this.g(), p = g.gain;
      p.setValueAtTime(0, t); p.linearRampToValueAtTime(v * 0.5, t + dur * 0.15); p.setValueAtTime(v * 0.5, t + dur * 0.8); p.linearRampToValueAtTime(0, t + dur);
      o.connect(bp); o.connect(bp2); bp.connect(g); bp2.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
    }
    swell(out, t, v, dir, len) { // sopro ao contrário
      const dur = Math.max(0.1, len * STEP * 0.95), n = this.nz(t, dur), bp = this.f('bandpass', 600, 2), o = this.o('sawtooth', 110, t), ob = this.f('bandpass', 900, 6), g = this.g(), p = g.gain;
      bp.frequency.setValueAtTime(dir === 'f' ? 400 : 2400, t); bp.frequency.exponentialRampToValueAtTime(dir === 'f' ? 2400 : 400, t + dur);
      o.frequency.setValueAtTime(dir === 'f' ? 90 : 180, t); o.frequency.exponentialRampToValueAtTime(dir === 'f' ? 180 : 90, t + dur);
      p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(v * 0.9, t + dur * 0.92); p.linearRampToValueAtTime(0, t + dur);
      n.connect(bp); bp.connect(g); o.connect(ob); ob.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
    }
    musicBox(out, t, v, midi) { // caixinha de música um pouco desafinada
      const f = mtof(midi) * 0.994;
      [[1, 1, 1.4], [3.01, 0.22, 0.4], [5.98, 0.08, 0.15]].forEach(([r, a, d]) => {
        const o = this.o('sine', f * r, t), g = this.g(); this.perc(g, t, v * 0.2 * a, d); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.05);
      });
    }
    glitch(out, t, v, midi, len) { // robô com defeito
      const f = mtof(midi), dur = Math.max(0.06, len * STEP * 0.8), o = this.o('square', f, t);
      for (let i = 1; i < 5; i++) o.frequency.setValueAtTime(f * [1, 1.5, 0.75, 2, 1.335, 0.5][(Math.random() * 6) | 0], t + (dur * i) / 5);
      const bp = this.f('bandpass', 1500, 1.2), g = this.g(), p = g.gain;
      p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(v * 0.28, t + 0.004); p.setValueAtTime(v * 0.28, t + dur); p.exponentialRampToValueAtTime(0.0001, t + dur + 0.02);
      o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.04);
    }
    distCurve() {
      if (this._dc) return this._dc;
      const n = 1024, c = new Float32Array(n);
      for (let i = 0; i < n; i++) c[i] = Math.tanh(((i / (n - 1)) * 2 - 1) * 3);
      return (this._dc = c);
    }
    dbass(out, t, v, midi, len) { // baixo distorcido
      const f = mtof(midi), dur = len * STEP * 0.95;
      const o = this.o('sawtooth', f, t), o2 = this.o('sawtooth', f * 1.006, t), sub = this.o('sine', f, t);
      const sh = this.ctx.createWaveShaper(); sh.curve = this.distCurve();
      const pre = this.g(1.6), lp = this.f('lowpass', 900, 3); lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(420, t + 0.3);
      const g = this.g(), p = g.gain, sg = this.g(0.5);
      p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(v * 0.38, t + 0.01); p.setValueAtTime(v * 0.38, t + dur); p.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
      o.connect(pre); o2.connect(pre); pre.connect(sh); sh.connect(lp); lp.connect(g); sub.connect(sg); sg.connect(g); g.connect(out);
      [o, o2, sub].forEach(x => { x.start(t); x.stop(t + dur + 0.1); });
    }
    organ(out, t, v, midis, len) { // órgão de igreja assombrada
      const dur = len * STEP, sum = this.g(1), oscs = [];
      midis.forEach(m => {
        const f = mtof(m);
        [[1, 1], [2, 0.55], [3, 0.3], [4, 0.22], [6, 0.1]].forEach(([r, a]) => {
          const o = this.o('sine', f * r * (1 + (Math.random() - 0.5) * 0.002), t), g = this.g(a); o.connect(g); g.connect(sum); oscs.push(o);
        });
      });
      const trem = this.o('sine', 5.5, t), tg = this.g(0.12), amp = this.g(0.88); trem.connect(tg); tg.connect(amp.gain); oscs.push(trem);
      const g = this.g(), p = g.gain;
      p.setValueAtTime(0, t); p.linearRampToValueAtTime(v * 0.09, t + 0.12); p.setValueAtTime(v * 0.09, t + dur - 0.1); p.linearRampToValueAtTime(0, t + dur + 0.35);
      sum.connect(amp); amp.connect(g); g.connect(out);
      oscs.forEach(o => { o.start(t); o.stop(t + dur + 0.4); });
    }
    toll(out, t, v, midi) { // sino de igreja, grave e longo
      const f = mtof(midi);
      [[0.5, 0.5, 4], [1, 1, 3.2], [1.19, 0.45, 2.4], [1.5, 0.3, 2], [2, 0.32, 1.6], [2.66, 0.18, 1.1], [3.02, 0.1, 0.8]].forEach(([r, a, d]) => {
        const o = this.o('sine', f * r, t), g = this.g(); this.perc(g, t, v * 0.18 * a, d, 0.004); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.05);
      });
    }

    // ---------- sons da interface ----------
    pop() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + 0.005, o = this.o('sine', mtof(76), t); o.frequency.exponentialRampToValueAtTime(mtof(88), t + 0.07);
      const g = this.g(); this.perc(g, t, 0.14, 0.13); o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.16);
    }
    poof() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + 0.005, n = this.nz(t, 0.3), bp = this.f('bandpass', 1800, 1.2), g = this.g();
      bp.frequency.setValueAtTime(1800, t); bp.frequency.exponentialRampToValueAtTime(300, t + 0.25);
      this.perc(g, t, 0.16, 0.24, 0.01); n.connect(bp); bp.connect(g); g.connect(this.bus);
    }
    playJingle(t, s) {
      const r = PROG[Math.floor((s % 64) / 16)];
      [r, r + 2, r + 4, r + 7, r + 9, r + 11, r + 14].forEach((d, i) => this.bell(this.bus, t + i * STEP * 0.5, 0.6, d2m(d, this.mode) + 12));
      const n = this.nz(t, 1.6), hp = this.f('highpass', 5000), g = this.g();
      this.perc(g, t, 0.1, 1.5, 0.01); n.connect(hp); hp.connect(g); g.connect(this.bus); g.connect(this.revIn);
    }
  }

  // Renderização offline (para conferir volumes sem tocar em tempo real)
  Engine.renderOffline = async function (ids, bars, mode, horror) {
    const sr = 44100, len = Math.ceil((bars * 16 * STEP + 2) * sr);
    const ctx = new OfflineAudioContext(2, len, sr), e = new Engine(ctx);
    if (mode) { e.mode = mode; e.pendingMode = mode; }
    if (horror) { e.horror = true; e.pendingHorror = true; }
    ids.forEach(id => e.add(id, 0));
    e.nextTime = 0.05;
    for (let s = 0; s < bars * 16; s++) { e.scheduleStep(s, e.nextTime); e.nextTime += STEP; }
    return ctx.startRendering();
  };
  Engine.stats = function (buf) {
    let peak = 0, sum = 0, n = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++) { const x = d[i]; if (x !== x) return { nan: true }; const a = Math.abs(x); if (a > peak) peak = a; sum += x * x; n++; }
    }
    const rms = Math.sqrt(sum / n);
    return { peak: +peak.toFixed(3), rmsDb: +(20 * Math.log10(rms + 1e-9)).toFixed(1) };
  };

  window.SprEngine = Engine;
  window.SPR_AUDIO = { BPM, STEP, TONIC, PROG, SCALES, d2m, mtof };
})();
