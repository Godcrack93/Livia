import { createSynth, midi } from "../shared/synth.js";
import { T } from "./physics.js";

// Músicas por mundo. Para uma música nova: um objeto aqui e o nome em setMusic().
const SONGS = {
  mapa: {
    bpm: 84,
    chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
    bass: [48, 43, 45, 41],
    arp: [0, 1, 2, 1],
    lead: "sine",
    octave: 12,
    calm: true,
  },
  jardim: {
    bpm: 92,
    chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
    bass: [48, 43, 45, 41],
    arp: [0, 1, 2, 1, 0, 2, 1, 3],
    lead: "sine",
    octave: 12,
    shaker: true,
  },
  gelo: {
    bpm: 80,
    chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]],
    bass: [45, 41, 48, 43],
    arp: [0, 2, 1, 3, 2, 1, 0, 2],
    lead: "sine",
    octave: 24,
    bell: true,
  },
  doces: {
    bpm: 108,
    chords: [[53, 57, 60], [50, 53, 57], [58, 62, 65], [60, 64, 67]],
    bass: [41, 38, 46, 48],
    arp: [0, 1, 2, 3, 2, 1, 0, 1],
    lead: "triangle",
    octave: 12,
    bounce: true,
    shaker: true,
  },
  castelo: {
    bpm: 84,
    chords: [[50, 53, 57], [58, 62, 65], [53, 57, 60], [60, 64, 67]],
    bass: [38, 46, 41, 48],
    arp: [0, 1, 2, 3, 2, 1, 2, 3],
    lead: "triangle",
    octave: 12,
    bell: true,
    big: true,
  },
  festa: {
    bpm: 120,
    chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]],
    bass: [48, 53, 55, 48],
    arp: [0, 1, 2, 3, 2, 1, 2, 3],
    lead: "square",
    octave: 12,
    drums: true,
    big: true,
  },
};

export function createAudio() {
  const s = createSynth();
  let song = null;
  let nextStep = 0;
  let step = 0;
  let roll = null;

  s.onReady = () => {
    const src = s.ctx.createBufferSource();
    src.buffer = s.noiseBuf;
    src.loop = true;
    const band = s.ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 400;
    band.Q.value = 1.4;
    const low = s.ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 1400;
    const gain = s.ctx.createGain();
    gain.gain.value = 0;
    src.connect(band).connect(low).connect(gain).connect(s.sfx);
    src.start();
    roll = { band, gain };
  };

  function rolling(speed, surface, active) {
    if (!roll) return;
    const t = s.ctx.currentTime;
    let g = active ? Math.min(0.22, speed * 0.3) : 0;
    let f = 260 + speed * 520;
    if (surface === T.ICE) {
      f *= 2.2;
      g *= 0.55;
    } else if (surface === T.MUD) {
      f *= 0.5;
      g *= 1.2;
    }
    roll.gain.gain.setTargetAtTime(s.enabled ? g : 0, t, 0.05);
    roll.band.frequency.setTargetAtTime(f, t, 0.05);
  }

  function play(fn) {
    if (!s.ready()) return;
    fn(s.ctx.currentTime);
  }

  // Para um som novo: uma função aqui e o nome no objeto retornado.
  const sounds = {
    thud: (speed) =>
      play((t) => {
        const g = Math.min(0.35, speed * 0.4);
        s.noise(t, 0.08, g, { type: "lowpass", freq: 700, sweep: 120 });
        s.tone(t, 150, 0.09, g * 0.8, "sine", { slide: 70 });
      }),
    boing: () =>
      play((t) => {
        s.tone(t, 220, 0.22, 0.16, "sine", { slide: 760 });
        s.tone(t + 0.02, 440, 0.18, 0.05, "triangle", { slide: 1200 });
      }),
    star: (n) =>
      play((t) => {
        const base = [1046.5, 1174.66, 1318.51, 1567.98][Math.min(n, 3)];
        s.tone(t, base, 0.25, 0.09, "sine");
        s.tone(t + 0.07, base * 1.5, 0.35, 0.07, "sine");
        s.tone(t + 0.14, base * 2, 0.45, 0.05, "sine");
        s.noise(t, 0.3, 0.04, { freq: 7000 });
      }),
    key: () =>
      play((t) => {
        [1318.5, 1568, 2093, 2637].forEach((f, i) => s.tone(t + i * 0.06, f, 0.3, 0.06, "triangle"));
      }),
    door: () =>
      play((t) => {
        s.noise(t, 0.7, 0.14, { type: "lowpass", freq: 500, sweep: 120 });
        s.tone(t, 110, 0.6, 0.12, "triangle", { slide: 55 });
        [523.25, 659.25, 783.99].forEach((f, i) => s.tone(t + 0.4 + i * 0.08, f, 0.3, 0.05, "sine"));
      }),
    check: () =>
      play((t) => {
        s.tone(t, 784, 0.5, 0.1, "triangle");
        s.tone(t + 0.12, 1046.5, 0.6, 0.08, "triangle");
      }),
    portal: () =>
      play((t) => {
        s.noise(t, 0.5, 0.12, { type: "bandpass", freq: 300, sweep: 4000, q: 3 });
        s.tone(t, 300, 0.45, 0.08, "sine", { slide: 1600 });
      }),
    fall: () =>
      play((t) => {
        s.tone(t, 900, 0.7, 0.12, "sine", { slide: 140 });
        s.noise(t + 0.1, 0.5, 0.05, { type: "bandpass", freq: 1500, sweep: 200, q: 2 });
      }),
    heart: () =>
      play((t) => {
        s.tone(t, 523.25, 0.2, 0.08, "triangle");
        s.tone(t + 0.2, 392, 0.35, 0.08, "triangle");
      }),
    fail: () =>
      play((t) => {
        [523.25, 493.88, 466.16, 440].forEach((f, i) => s.tone(t + i * 0.22, f, i === 3 ? 0.6 : 0.2, 0.07, "triangle"));
      }),
    drop: () =>
      play((t) => {
        s.tone(t, 600, 0.12, 0.08, "sine", { slide: 300 });
        s.noise(t + 0.08, 0.06, 0.08, { type: "lowpass", freq: 900 });
      }),
    go: () =>
      play((t) => {
        [523.25, 659.25, 783.99, 1046.5].forEach((f) => s.tone(t, f, 0.5, 0.05, "triangle"));
        s.noise(t, 0.35, 0.05, { type: "bandpass", freq: 900, sweep: 5000 });
      }),
    win: () =>
      play((t) => {
        const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
        notes.forEach((f, i) => s.tone(t + i * 0.1, f, i === notes.length - 1 ? 0.9 : 0.16, 0.07, "square"));
        s.noise(t, 0.6, 0.05, { type: "bandpass", freq: 600, sweep: 6000 });
      }),
    ding: (i) =>
      play((t) => {
        const f = [783.99, 987.77, 1174.66][i % 3];
        s.tone(t, f, 0.7, 0.12, "triangle");
        s.tone(t, f * 2, 0.4, 0.04, "sine");
        s.noise(t, 0.25, 0.04, { freq: 6000 });
      }),
    select: () =>
      play((t) => {
        s.tone(t, 659.25, 0.12, 0.08, "triangle");
        s.tone(t + 0.08, 987.77, 0.25, 0.08, "triangle");
      }),
    nope: () =>
      play((t) => {
        s.tone(t, 220, 0.15, 0.08, "square", { slide: 180 });
        s.tone(t + 0.16, 196, 0.2, 0.08, "square", { slide: 160 });
      }),
    hover: () => play((t) => s.tone(t, 1046.5, 0.08, 0.03, "sine")),
    boom: () =>
      play((t) => {
        s.noise(t, 0.6, 0.12, { type: "lowpass", freq: 600, sweep: 80 });
        s.noise(t + 0.05, 0.8, 0.04, { freq: 5000 });
      }),
    finale: () =>
      play((t) => {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093];
        notes.forEach((f, i) => {
          s.tone(t + i * 0.12, f, 0.5, 0.06, "square");
          s.tone(t + i * 0.12, f / 2, 0.5, 0.05, "triangle");
        });
        [523.25, 659.25, 783.99, 1046.5].forEach((f) => s.tone(t + 0.95, f, 1.8, 0.05, "triangle"));
        s.noise(t + 0.9, 1.2, 0.08, { type: "bandpass", freq: 400, sweep: 7000, q: 1.2 });
      }),
  };

  function setMusic(name) {
    const next = name === "off" ? null : SONGS[name] ?? null;
    if (next === song) return;
    if (s.ctx && !song && next) {
      nextStep = s.ctx.currentTime + 0.08;
      step = 0;
    }
    song = next;
  }

  function playStep(k, t) {
    const sp = song;
    const eighth = 60 / sp.bpm / 2;
    const bar = Math.floor(k / 8) % sp.chords.length;
    const beat = k % 8;
    const chord = sp.chords[bar].map(midi);
    const m = s.music;
    if (beat === 0) s.pad(chord, t, eighth * 8, { gain: sp.big ? 0.026 : 0.02, to: m });
    if (sp.bounce ? beat % 2 === 1 : beat % 4 === 0) {
      s.tone(t, midi(sp.bass[bar]), eighth * (sp.bounce ? 0.9 : 1.8), 0.09, "triangle", { to: m });
    }
    if (!sp.calm || beat % 2 === 0) {
      const idx = sp.arp[beat % sp.arp.length];
      const f = idx === 3 ? chord[0] * 2 : chord[idx];
      const lift = Math.pow(2, sp.octave / 12);
      s.tone(t, f * lift, sp.bell ? 0.9 : 0.4, sp.lead === "square" ? 0.025 : 0.045, sp.lead, { to: m });
      if (sp.bell) s.tone(t, f * lift * 2, 0.5, 0.012, "sine", { to: m });
    }
    if (sp.shaker && beat % 2 === 1) s.noise(t, 0.04, 0.02, { freq: 7000, to: m });
    if (sp.drums) {
      if (beat % 4 === 0) s.tone(t, 130, 0.16, 0.18, "sine", { slide: 45, to: m });
      if (beat % 4 === 2) s.noise(t, 0.12, 0.07, { type: "bandpass", freq: 1800, to: m });
      s.noise(t, 0.04, beat % 2 ? 0.04 : 0.025, { freq: 7000, to: m });
    }
  }

  s.setScheduler(() => {
    if (!song || !s.enabled || s.ctx.state !== "running") return;
    if (nextStep < s.ctx.currentTime - 0.5) nextStep = s.ctx.currentTime + 0.05;
    const eighth = 60 / song.bpm / 2;
    while (nextStep < s.ctx.currentTime + 0.15) {
      playStep(step, nextStep);
      step++;
      nextStep += eighth;
    }
  });

  return {
    unlock: s.unlock,
    setEnabled: s.setEnabled,
    setMusic,
    rolling,
    ...sounds,
    get enabled() {
      return s.enabled;
    },
  };
}
