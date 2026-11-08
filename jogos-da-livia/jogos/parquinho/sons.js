/* Parquinho Sprunki — efeitos sonoros, todos sintetizados com Web Audio */
(function () {
  'use strict';
  let ctx = null, out = null, nb = null, muted = false;
  const last = {};

  function init() {
    if (ctx) { if (ctx.state !== 'running') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* opcional */ }
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    out = ctx.createGain(); out.gain.value = muted ? 0 : 0.8;
    out.connect(comp); comp.connect(ctx.destination);
    nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    ctx.resume();
  }
  // evita que o mesmo som se amontoe (ex.: metralhadora com vários Sprunkis)
  function ok(name, gap) {
    if (!ctx || muted || ctx.state !== 'running') return false;
    const t = ctx.currentTime; if (last[name] && t - last[name] < gap) return false;
    last[name] = t; return true;
  }
  const T = () => ctx.currentTime + 0.005;
  function tone(type, f0, f1, dur, vol, t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, t, type, f0, f1, q) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = nb; f.type = type || 'lowpass'; f.frequency.setValueAtTime(f0 || 2000, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q || 0.8;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.4, dur + 0.05);
  }

  const S = {
    pop() { if (!ok('pop', 0.04)) return; tone('sine', 520, 1040, 0.12, 0.25, T()); },
    place(mat) {
      if (!ok('place', 0.035)) return; const t = T();
      if (mat === 'vidro') { tone('sine', 2100, 1900, 0.15, 0.12, t); tone('sine', 3150, 3000, 0.1, 0.06, t); }
      else if (mat === 'madeira') { tone('triangle', 330, 240, 0.08, 0.3, t); noise(0.04, 0.15, t, 'bandpass', 1200); }
      else if (mat === 'pedra' || mat === 'tijolo') { noise(0.07, 0.3, t, 'bandpass', mat === 'pedra' ? 2200 : 1400, 0, 1.2); tone('sine', 160, 110, 0.06, 0.2, t); }
      else { noise(0.09, 0.3, t, 'lowpass', 700); tone('sine', 120, 80, 0.07, 0.2, t); }
    },
    shatter() {
      if (!ok('shatter', 0.06)) return; const t = T();
      noise(0.35, 0.35, t, 'highpass', 3000);
      for (let i = 0; i < 6; i++) tone('sine', 1800 + Math.random() * 2500, 0, 0.12 + Math.random() * 0.15, 0.06, t + i * 0.025);
    },
    pistol() { if (!ok('pistol', 0.05)) return; const t = T(); noise(0.16, 0.5, t, 'lowpass', 3500, 400); tone('sine', 150, 50, 0.12, 0.45, t); },
    mg() { if (!ok('mg', 0.05)) return; const t = T(); noise(0.08, 0.32, t, 'lowpass', 4000, 600); tone('sine', 130, 60, 0.06, 0.3, t); },
    bow() { if (!ok('bow', 0.08)) return; const t = T(); tone('triangle', 190, 120, 0.18, 0.35, t); noise(0.12, 0.12, t, 'bandpass', 2500, 900, 1.5); },
    thunk() { if (!ok('thunk', 0.05)) return; const t = T(); tone('sine', 260, 120, 0.08, 0.3, t); noise(0.05, 0.15, t, 'bandpass', 1000); },
    ric() { if (!ok('ric', 0.06)) return; tone('sine', 2400, 1200, 0.09, 0.07, T()); },
    whoosh() { if (!ok('whoosh', 0.1)) return; noise(0.22, 0.25, T(), 'bandpass', 600, 2200, 1.4); },
    bonk() { if (!ok('bonk', 0.08)) return; const t = T(); tone('square', 680, 260, 0.14, 0.16, t); tone('sine', 220, 90, 0.18, 0.4, t); },
    hit() { if (!ok('hit', 0.05)) return; const t = T(); tone('square', 420, 180, 0.07, 0.1, t); },
    claw() { if (!ok('claw', 0.08)) return; noise(0.14, 0.3, T(), 'bandpass', 3000, 1200, 2); },
    ouch() { if (!ok('ouch', 0.12)) return; const t = T(); tone('triangle', 900, 1300, 0.07, 0.15, t); tone('triangle', 1250, 700, 0.12, 0.15, t + 0.07); },
    alert() { if (!ok('alert', 0.2)) return; tone('sine', 1200, 1700, 0.09, 0.12, T()); },
    hi() { if (!ok('hi', 0.15)) return; const t = T(); tone('triangle', 700, 1000, 0.08, 0.15, t); tone('triangle', 1000, 1400, 0.1, 0.15, t + 0.09); },
    growl() {
      if (!ok('growl', 1.5)) return; const t = T(), d = 0.7;
      const o = ctx.createOscillator(), am = ctx.createOscillator(), amg = ctx.createGain(), vg = ctx.createGain(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(75, t); o.frequency.linearRampToValueAtTime(58, t + d);
      am.type = 'square'; am.frequency.value = 28; amg.gain.value = 0.5; vg.gain.value = 0.5; am.connect(amg); amg.connect(vg.gain);
      lp.type = 'lowpass'; lp.frequency.value = 520;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(vg); vg.connect(lp); lp.connect(g); g.connect(out);
      o.start(t); o.stop(t + d + 0.05); am.start(t); am.stop(t + d + 0.05);
    },
    infect() {
      if (!ok('infect', 0.25)) return; const t = T();
      [0, 3, 7].forEach((st, i) => tone('triangle', 392 * Math.pow(2, st / 12), 392 * Math.pow(2, (st - 12) / 12), 0.7, 0.1, t + i * 0.03));
      noise(0.6, 0.2, t, 'bandpass', 2000, 300, 1);
    },
    cure() { if (!ok('cure', 0.2)) return; const t = T(); [0, 4, 7, 12, 16].forEach((st, i) => tone('sine', 660 * Math.pow(2, st / 12), 0, 0.28, 0.13, t + i * 0.06)); },
    thud() { if (!ok('thud', 0.06)) return; const t = T(); tone('sine', 110, 50, 0.16, 0.45, t); noise(0.08, 0.2, t, 'lowpass', 500); },
    grab() { if (!ok('grab', 0.05)) return; tone('sine', 700, 900, 0.06, 0.12, T()); },
    pick() { if (!ok('pick', 0.05)) return; const t = T(); tone('square', 900, 0, 0.04, 0.07, t); tone('square', 1350, 0, 0.05, 0.07, t + 0.05); },
    erase() { if (!ok('erase', 0.05)) return; noise(0.18, 0.25, T(), 'bandpass', 1600, 300, 1.2); },
  };

  window.Som = Object.assign({
    init,
    setMuted(m) { muted = !!m; if (out) out.gain.value = muted ? 0 : 0.8; },
    isMuted: () => muted,
  }, S);
})();
