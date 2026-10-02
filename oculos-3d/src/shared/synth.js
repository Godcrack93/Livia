// Motor de som simples (Web Audio): tons, ruído, acordes e um agendador de música.
export function midi(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export function createSynth() {
  const s = {
    ctx: null,
    sfx: null,
    music: null,
    noiseBuf: null,
    enabled: true,
  };
  let out = null;
  let scheduler = null;

  s.unlock = function unlock() {
    if (!s.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      s.ctx = new AC();
      const comp = s.ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4;
      out = s.ctx.createGain();
      out.gain.value = s.enabled ? 0.9 : 0;
      s.sfx = s.ctx.createGain();
      s.music = s.ctx.createGain();
      s.music.gain.value = 0.45;
      s.sfx.connect(comp);
      s.music.connect(comp);
      comp.connect(out);
      out.connect(s.ctx.destination);
      s.noiseBuf = s.ctx.createBuffer(1, s.ctx.sampleRate, s.ctx.sampleRate);
      const ch = s.noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      setInterval(() => scheduler?.(), 25);
      s.onReady?.();
    }
    if (s.ctx.state === "suspended") void s.ctx.resume();
  };

  s.setEnabled = function setEnabled(value) {
    s.enabled = value;
    if (out) out.gain.setTargetAtTime(value ? 0.9 : 0, s.ctx.currentTime, 0.05);
  };

  s.ready = function ready() {
    return s.ctx && s.enabled;
  };

  s.setScheduler = function setScheduler(fn) {
    scheduler = fn;
  };

  function dest(pan, to) {
    if (to) return to;
    if (!pan || !s.ctx.createStereoPanner) return s.sfx;
    const p = s.ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    p.connect(s.sfx);
    return p;
  }

  s.tone = function tone(when, freq, dur, gain, type = "sine", { pan = 0, slide = 0, to = null, attack = 0.008 } = {}) {
    const osc = s.ctx.createOscillator();
    const g = s.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g).connect(dest(pan, to));
    osc.start(when);
    osc.stop(when + dur + 0.05);
  };

  s.noise = function noise(when, dur, gain, { type = "highpass", freq = 2000, sweep = 0, q = 0.7, pan = 0, to = null } = {}) {
    const src = s.ctx.createBufferSource();
    src.buffer = s.noiseBuf;
    const f = s.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, when);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, when + dur);
    f.Q.value = q;
    const g = s.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f).connect(g).connect(dest(pan, to));
    src.start(when, Math.random() * 0.5);
    src.stop(when + dur + 0.05);
  };

  s.pad = function pad(freqs, t, dur, { gain = 0.02, cutoff = 1100, type = "triangle", to = null } = {}) {
    for (const f of freqs) {
      for (const detune of [-5, 5]) {
        const osc = s.ctx.createOscillator();
        const g = s.ctx.createGain();
        const lp = s.ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = cutoff;
        osc.type = type;
        osc.frequency.value = f;
        osc.detune.value = detune;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain, t + 0.35);
        g.gain.setValueAtTime(gain, t + Math.max(0.36, dur - 0.3));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
        osc.connect(lp).connect(g).connect(to ?? s.music);
        osc.start(t);
        osc.stop(t + dur + 0.3);
      }
    }
  };

  return s;
}
