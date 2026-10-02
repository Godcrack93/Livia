// Escala pentatônica de Dó: qualquer sequência de estouros soa como melodia junto da música.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];
const CHORDS = [
  [261.63, 329.63, 392.0],
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
  [196.0, 246.94, 293.66],
];
const BASS = [130.81, 110.0, 87.31, 98.0];
const ARP = [0, 1, 2, 1, 0, 2, 1, 3];
const BPM = 100;
const EIGHTH = 60 / BPM / 2;

export function createAudio() {
  let ctx = null;
  let out = null;
  let sfx = null;
  let music = null;
  let noiseBuf = null;
  let enabled = true;
  let mode = "off";
  let nextStep = 0;
  let step = 0;

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4;
      out = ctx.createGain();
      out.gain.value = enabled ? 0.9 : 0;
      sfx = ctx.createGain();
      music = ctx.createGain();
      music.gain.value = 0.5;
      sfx.connect(comp);
      music.connect(comp);
      comp.connect(out);
      out.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      setInterval(schedule, 25);
    }
    if (ctx.state === "suspended") void ctx.resume();
  }

  function setEnabled(value) {
    enabled = value;
    if (out) out.gain.setTargetAtTime(value ? 0.9 : 0, ctx.currentTime, 0.05);
  }

  function dest(pan) {
    if (!pan || !ctx.createStereoPanner) return sfx;
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    p.connect(sfx);
    return p;
  }

  function tone(when, freq, dur, gain, type = "sine", { pan = 0, slide = 0, to = null, attack = 0.008 } = {}) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g).connect(to ?? dest(pan));
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  function noise(when, dur, gain, { type = "highpass", freq = 2000, sweep = 0, q = 0.7, pan = 0, to = null } = {}) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, when);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, when + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f).connect(g).connect(to ?? dest(pan));
    src.start(when, Math.random() * 0.5);
    src.stop(when + dur + 0.05);
  }

  function ready() {
    return ctx && enabled;
  }

  // Para um som novo: uma função aqui e o nome no objeto retornado.
  function pop(index, pan = 0) {
    popNote(PENTA[Math.min(index, PENTA.length - 1)], pan);
  }

  function popNote(freq, pan = 0) {
    if (!ready()) return;
    const t = ctx.currentTime;
    noise(t, 0.045, 0.3, { freq: 3200, pan });
    tone(t, 1150, 0.07, 0.28, "sine", { slide: 240, pan });
    note(freq, pan);
  }

  // Só a parte musical do estouro: vai junto dos sons especiais (dourada, gigante...) para a melodia não falhar.
  function note(freq, pan = 0) {
    if (!ready()) return;
    const t = ctx.currentTime;
    tone(t + 0.01, freq, 0.5, 0.11, "triangle", { pan });
    tone(t + 0.01, freq * 2, 0.28, 0.035, "sine", { pan });
  }

  function boing(pan = 0) {
    if (!ready()) return;
    const t = ctx.currentTime;
    tone(t, 300, 0.25, 0.12, "sine", { slide: 140, pan });
    tone(t + 0.12, 220, 0.25, 0.08, "sine", { slide: 320, pan });
  }

  function newFriend(pan = 0) {
    if (!ready()) return;
    const t = ctx.currentTime;
    [783.99, 1046.5, 1318.51, 1567.98, 2093].forEach((f, i) =>
      tone(t + 0.25 + i * 0.07, f, 0.3, 0.06, "triangle", { pan }),
    );
    noise(t + 0.25, 0.5, 0.05, { freq: 6500, pan });
  }

  // Voz do navegador (contar os números). Fica quieta se o som estiver desligado.
  function say(text) {
    if (!enabled || !window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pt-BR";
      u.rate = 1.1;
      u.pitch = 1.3;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      // Sem síntese de voz: só as notas.
    }
  }

  function bigPop(pan = 0) {
    if (!ready()) return;
    const t = ctx.currentTime;
    noise(t, 0.18, 0.4, { type: "lowpass", freq: 1400, sweep: 200, pan });
    tone(t, 480, 0.3, 0.32, "sine", { slide: 80, pan });
    tone(t + 0.05, 196, 0.5, 0.1, "triangle", { slide: 392, pan });
  }

  function gold(pan = 0) {
    if (!ready()) return;
    const t = ctx.currentTime;
    [1046.5, 1318.5, 1568, 2093, 2637, 3136].forEach((f, i) => tone(t + i * 0.045, f, 0.35, 0.07, "sine", { pan }));
    noise(t, 0.6, 0.06, { freq: 7000, pan });
  }

  function rainbow() {
    if (!ready()) return;
    const t = ctx.currentTime;
    PENTA.forEach((f, i) => tone(t + i * 0.035, f, 0.3, 0.06, "triangle"));
    noise(t, 0.7, 0.08, { type: "bandpass", freq: 600, sweep: 6000, q: 2 });
  }

  function friend(pan = 0) {
    if (!ready()) return;
    const t = ctx.currentTime;
    tone(t + 0.05, 620, 0.13, 0.05, "square", { slide: 930, pan });
    tone(t + 0.19, 820, 0.22, 0.05, "square", { slide: 1380, pan });
    tone(t + 0.19, 1640, 0.25, 0.03, "sine", { slide: 2400, pan });
  }

  function star(pan = 0) {
    if (!ready()) return;
    const t = ctx.currentTime;
    tone(t + 0.04, 1568, 0.25, 0.07, "sine", { pan });
    tone(t + 0.11, 2093, 0.35, 0.06, "sine", { pan });
    tone(t + 0.18, 2637, 0.4, 0.04, "sine", { pan });
  }

  function puff(pan = 0) {
    if (!ready()) return;
    const t = ctx.currentTime;
    noise(t, 0.32, 0.12, { type: "lowpass", freq: 900, sweep: 180, pan });
    tone(t, 220, 0.18, 0.04, "sine", { slide: 140, pan });
  }

  function combo(level) {
    if (!ready()) return;
    const t = ctx.currentTime;
    const base = level > 2 ? 1.5 : level > 1 ? 1.25 : 1;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(t + i * 0.07, f * base, i === 3 ? 0.5 : 0.14, 0.07, "triangle"),
    );
    tone(t + 0.21, 1046.5 * base * 2, 0.5, 0.025, "sine");
  }

  function beep(final = false) {
    if (!ready()) return;
    const t = ctx.currentTime;
    if (final) {
      [523.25, 659.25, 783.99, 1046.5].forEach((f) => tone(t, f, 0.6, 0.06, "triangle"));
      noise(t, 0.4, 0.06, { type: "bandpass", freq: 800, sweep: 5000 });
    } else {
      tone(t, 784, 0.22, 0.12, "sine");
      tone(t, 1568, 0.12, 0.03, "sine");
    }
  }

  function tick() {
    if (!ready()) return;
    tone(ctx.currentTime, 1500, 0.06, 0.07, "triangle");
  }

  function festa() {
    if (!ready()) return;
    const t = ctx.currentTime;
    noise(t, 1.0, 0.1, { type: "bandpass", freq: 300, sweep: 5000, q: 1.5 });
    [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(t + 0.15 + i * 0.06, f, 0.3, 0.07, "square"));
  }

  function timeUp() {
    if (!ready()) return;
    const t = ctx.currentTime;
    tone(t, 1300, 0.55, 0.08, "sine", { slide: 420 });
    tone(t + 0.6, 784, 0.25, 0.08, "triangle");
    tone(t + 0.85, 523.25, 0.5, 0.08, "triangle");
  }

  function ding(index) {
    if (!ready()) return;
    const t = ctx.currentTime;
    const f = [783.99, 987.77, 1174.66][index % 3];
    tone(t, f, 0.7, 0.12, "triangle");
    tone(t, f * 2, 0.4, 0.04, "sine");
    noise(t, 0.25, 0.04, { freq: 6000 });
  }

  function record() {
    if (!ready()) return;
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => tone(t + i * 0.11, f, i === notes.length - 1 ? 0.9 : 0.16, 0.08, "square"));
  }

  function hover() {
    if (!ready()) return;
    tone(ctx.currentTime, 1046.5, 0.08, 0.03, "sine");
  }

  function boom() {
    if (!ready()) return;
    const t = ctx.currentTime;
    noise(t, 0.6, 0.12, { type: "lowpass", freq: 600, sweep: 80 });
    noise(t + 0.05, 0.8, 0.04, { freq: 5000 });
  }

  function setMusic(next) {
    if (next === mode) return;
    if (ctx && mode === "off" && next !== "off") {
      nextStep = ctx.currentTime + 0.08;
      step = 0;
    }
    mode = next;
  }

  function pad(chord, t, dur, to) {
    for (const f of chord) {
      for (const detune of [-4, 4]) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 1100;
        osc.type = "triangle";
        osc.frequency.value = f;
        osc.detune.value = detune;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.022, t + 0.35);
        g.gain.setValueAtTime(0.022, t + dur - 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
        osc.connect(lp).connect(g).connect(to);
        osc.start(t);
        osc.stop(t + dur + 0.3);
      }
    }
  }

  function playStep(s, t) {
    const bar = Math.floor(s / 8) % 4;
    const beat = s % 8;
    const chord = CHORDS[bar];
    const party = mode === "festa";
    const calm = mode === "title" || mode === "fim";
    if (beat === 0) pad(chord, t, EIGHTH * 8, music);
    if (mode === "fim") return;
    if (party ? beat % 2 === 0 : beat % 4 === 0) tone(t, BASS[bar], EIGHTH * 1.8, 0.09, "triangle", { to: music });
    if (!calm || beat % 2 === 0) {
      const idx = ARP[beat];
      const f = idx === 3 ? chord[0] * 4 : chord[idx] * 2;
      tone(t, f, 0.45, 0.045, "sine", { to: music });
      tone(t, f * 2, 0.2, 0.012, "triangle", { to: music });
    }
    if (mode === "play" && beat % 2 === 1) noise(t, 0.05, 0.025, { freq: 7000, to: music });
    if (party) {
      noise(t, 0.05, beat % 2 ? 0.05 : 0.03, { freq: 6500, to: music });
      if (beat % 2 === 0) tone(t, 130, 0.16, 0.18, "sine", { slide: 45, to: music });
    }
  }

  function schedule() {
    if (!ctx || mode === "off" || !enabled || ctx.state !== "running") return;
    if (nextStep < ctx.currentTime - 0.5) nextStep = ctx.currentTime + 0.05;
    while (nextStep < ctx.currentTime + 0.15) {
      playStep(step, nextStep);
      step++;
      nextStep += EIGHTH;
    }
  }

  return {
    unlock,
    setEnabled,
    setMusic,
    pop,
    popNote,
    note,
    boing,
    newFriend,
    say,
    bigPop,
    gold,
    rainbow,
    friend,
    star,
    puff,
    combo,
    beep,
    tick,
    festa,
    timeUp,
    ding,
    record,
    hover,
    boom,
    get enabled() {
      return enabled;
    },
  };
}
