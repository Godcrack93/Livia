import * as THREE from "three";
import { createSynth, midi } from "../shared/synth.js";
import { TAU, rand } from "../shared/util.js";

// Pentatônica de Lá menor: POFs seguidos viram melodia e nunca soam errado.
const PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93].map(midi);
// Caixinha de música em Lá menor (o Sol# dá o ar de mistério). null = pausa.
const BOX = [
  69, null, 72, 76, 74, null, 72, 71, 69, null, 64, null, 65, 68, 69, null,
  69, null, 72, 76, 79, 77, 76, 74, 72, null, 71, 68, 69, null, null, null,
];
const BASS = [45, 45, 52, 45, 41, 41, 48, 41, 45, 45, 52, 45, 40, 40, 44, 40];
const DAWN = [72, 76, 79, 84, 79, 76, 74, 77, 81, 77, 74, 71, 72, 76, 79, 76];
const DAWN_PADS = [
  [48, 52, 55],
  [53, 57, 60],
  [55, 59, 62],
  [48, 52, 55],
];
const BPM = 76;
const STEP = 60 / BPM / 2;
const GHOST_SPOTS = 9;
const fwd = new THREE.Vector3();
const up = new THREE.Vector3();
const tmp = new THREE.Vector3();

export function createAudio() {
  const s = createSynth();
  let ambient = null;
  let wind = null;
  let windSrc = null;
  let ambientMode = "off";
  let musicMode = "off";
  let tension = 0;
  let detune = 0;
  let creaks = false;
  let nextStep = 0;
  let step = 0;
  let nextWind = 0;
  let nextFrog = 0;
  let nextCreak = 0;
  const spots = [];
  const crickets = [];
  let frogSpot = null;
  let creakSpot = null;
  let owlSpot = null;
  let voice = null;

  function ready() {
    return s.ctx && s.enabled;
  }

  // Ponto de som no espaço. "HRTF" dá frente e trás no fone; "equalpower" é mais leve (só para o ambiente).
  function makeSpot(model, bus) {
    const input = s.ctx.createGain();
    const lp = s.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 16000;
    lp.Q.value = 0.5;
    const panner = s.ctx.createPanner();
    panner.panningModel = model;
    panner.distanceModel = "inverse";
    panner.refDistance = 1.4;
    panner.rolloffFactor = 1.1;
    panner.maxDistance = 60;
    input.connect(lp).connect(panner).connect(bus);
    return { input, lp, panner, busy: false, freeAt: 0 };
  }

  function place(sp, pos, behind = 0) {
    if (!sp || !s.ctx) return;
    const p = sp.panner;
    if (p.positionX) {
      p.positionX.value = pos.x;
      p.positionY.value = pos.y;
      p.positionZ.value = pos.z;
    } else p.setPosition(pos.x, pos.y, pos.z);
    // Atrás fica abafado (16 kHz na frente, ~1,6 kHz bem atrás): exagera de propósito o que a cabeça já faz.
    const cut = 16000 * Math.pow(0.1, Math.max(0, Math.min(1, behind)));
    if (Math.abs(cut - (sp.cut ?? 0)) < cut * 0.04) return;
    sp.cut = cut;
    sp.lp.frequency.setTargetAtTime(cut, s.ctx.currentTime, 0.06);
  }

  function spot() {
    if (!s.ctx) return null;
    const now = s.ctx.currentTime;
    let sp = spots.find((x) => !x.busy && now >= x.freeAt);
    if (!sp && spots.length < GHOST_SPOTS) {
      sp = makeSpot("HRTF", s.sfx);
      spots.push(sp);
    }
    if (!sp) return null;
    sp.busy = true;
    return sp;
  }

  // O ponto só volta para a fila depois que o último som dele acabou de soar.
  function release(sp, tail = 1.6) {
    if (!sp || !s.ctx) return;
    sp.busy = false;
    sp.freeAt = s.ctx.currentTime + tail;
  }

  // Som avulso numa posição (cesta, folhas do alarme falso...): pega um ponto, toca e devolve.
  function at(pos, behind, play) {
    const sp = spot();
    if (!sp) return;
    place(sp, pos, behind);
    play(sp);
    release(sp, 2);
  }

  function listen(head) {
    if (!s.ctx) return;
    const l = s.ctx.listener;
    fwd.set(0, 0, -1).applyQuaternion(head.quaternion);
    up.set(0, 1, 0).applyQuaternion(head.quaternion);
    const p = head.position;
    if (l.positionX) {
      l.positionX.value = p.x;
      l.positionY.value = p.y;
      l.positionZ.value = p.z;
      l.forwardX.value = fwd.x;
      l.forwardY.value = fwd.y;
      l.forwardZ.value = fwd.z;
      l.upX.value = up.x;
      l.upY.value = up.y;
      l.upZ.value = up.z;
    } else {
      l.setPosition(p.x, p.y, p.z);
      l.setOrientation(fwd.x, fwd.y, fwd.z, up.x, up.y, up.z);
    }
  }

  function tone(when, freq, dur, gain, type, to, opts = {}) {
    s.tone(when, freq, dur, gain, type, { ...opts, to });
  }

  function noise(when, dur, gain, to, opts = {}) {
    s.noise(when, dur, gain, { ...opts, to });
  }

  // Ruído comprido em loop (o buffer do sintetizador tem só 1 segundo).
  function longNoise(when, dur, gain, to, { type = "lowpass", freq = 400, sweep = 0, q = 0.7, attack = 0.3 } = {}) {
    const src = s.ctx.createBufferSource();
    src.buffer = s.noiseBuf;
    src.loop = true;
    const f = s.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, when);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, when + dur);
    f.Q.value = q;
    const g = s.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f).connect(g).connect(to);
    src.start(when, Math.random() * 0.5);
    src.stop(when + dur + 0.05);
  }

  // Dente-de-serra filtrado: soa como uma vogal "u" (o "BUUU" e o ronco).
  function vowel(when, f0, f1, dur, gain, cutoff, to, attack = 0.04) {
    const osc = s.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(f0, when);
    osc.frequency.exponentialRampToValueAtTime(f1, when + dur);
    const lp = s.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = cutoff;
    lp.Q.value = 2.2;
    const g = s.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + attack);
    g.gain.setValueAtTime(gain, when + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(lp).connect(g).connect(to);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  // ----- vozes dos fantasminhas (todas saem do ponto de som de cada um) -----

  function hum(sp, pitch = 1) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    const f = 440 * pitch;
    tone(t, f, 0.55, 0.07, "sine", sp.input, { slide: f * 1.19, attack: 0.14 });
    tone(t + 0.5, f * 1.19, 0.7, 0.06, "sine", sp.input, { slide: f * 0.92, attack: 0.1 });
  }

  function boing(sp) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    tone(t, 250, 0.22, 0.08, "sine", sp.input, { slide: 520 });
    tone(t + 0.1, 520, 0.2, 0.04, "sine", sp.input, { slide: 300 });
  }

  function giggle(sp, excite = 0) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    const n = 3 + Math.round(excite * 3);
    const base = 900 + excite * 420;
    for (let i = 0; i < n; i++) {
      tone(t + i * 0.075, base * (1 - i * 0.035) * rand(0.97, 1.03), 0.065, 0.055, "triangle", sp.input);
    }
  }

  function rustle(sp, gain = 0.07) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      noise(t + i * rand(0.07, 0.11), 0.07, gain, sp.input, { type: "bandpass", freq: rand(1800, 3400), q: 0.9 });
    }
  }

  // Cochicho "hihihi" bem perto do ouvido: é onde o som 3D arrepia de verdade.
  function whisper(sp) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      noise(t + i * 0.12, 0.09, 0.09, sp.input, { type: "bandpass", freq: rand(3600, 5200), q: 4 });
    }
  }

  function shy(sp) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    tone(t, 1175, 0.07, 0.05, "triangle", sp.input);
    tone(t + 0.09, 1047, 0.07, 0.045, "triangle", sp.input);
    tone(t + 0.2, 784, 0.2, 0.04, "sine", sp.input, { slide: 988 });
  }

  function whoosh(sp, gain = 0.06) {
    if (!ready() || !sp) return;
    longNoise(s.ctx.currentTime, 0.85, gain, sp.input, { freq: 280, sweep: 900, attack: 0.35 });
  }

  function snore(sp) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    vowel(t, 72, 62, 1.1, 0.07, 380, sp.input, 0.35);
    longNoise(t, 1.1, 0.05, sp.input, { freq: 220, sweep: 520, attack: 0.4 });
    tone(t + 1.25, 640, 1.1, 0.035, "sine", sp.input, { slide: 300, attack: 0.25 });
  }

  function plim(sp) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    tone(t, 1318.5, 0.5, 0.05, "sine", sp.input);
    tone(t, 1975.5, 0.35, 0.022, "sine", sp.input);
  }

  function poof(sp, combo = 0) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    noise(t, 0.05, 0.25, sp.input, { freq: 3000 });
    tone(t, 1150, 0.08, 0.2, "sine", sp.input, { slide: 240 });
    const f = PENTA[Math.min(combo, PENTA.length - 1)];
    tone(t + 0.01, f, 0.55, 0.11, "triangle", sp.input);
    tone(t + 0.01, f * 2, 0.3, 0.035, "sine", sp.input);
    tone(t + 0.12, 2637, 0.3, 0.025, "sine", sp.input);
  }

  function buu(sp, strong = false) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    noise(t, 0.35, strong ? 0.13 : 0.09, sp.input, { type: "bandpass", freq: 500, sweep: 2400, q: 1.2 });
    vowel(t + 0.04, 215, 150, 0.6, strong ? 0.3 : 0.2, 950, sp.input, 0.03);
  }

  function laugh(sp) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    [720, 660, 610, 570].forEach((f, i) => {
      tone(t + i * 0.11, f, 0.09, 0.06, "triangle", sp.input, { slide: f * 0.85 });
      noise(t + i * 0.11, 0.06, 0.025, sp.input, { type: "bandpass", freq: 1500, q: 1 });
    });
  }

  function nham(sp) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    tone(t, 520, 0.08, 0.05, "square", sp.input, { slide: 400 });
    tone(t + 0.13, 600, 0.1, 0.05, "square", sp.input, { slide: 420 });
  }

  function croak(sp) {
    if (!ready() || !sp) return;
    const t = s.ctx.currentTime;
    tone(t, 150, 0.13, 0.09, "triangle", sp.input, { slide: 110 });
    tone(t + 0.17, 160, 0.15, 0.08, "triangle", sp.input, { slide: 115 });
  }

  // ----- sons sem posição -----

  function heartbeat(strength = 1) {
    if (!ready()) return;
    const t = s.ctx.currentTime;
    tone(t, 58, 0.16, 0.11 * strength, "sine", s.sfx, { attack: 0.01 });
    tone(t, 116, 0.07, 0.025 * strength, "sine", s.sfx);
    tone(t + 0.22, 52, 0.18, 0.08 * strength, "sine", s.sfx, { attack: 0.01 });
  }

  function back() {
    if (!ready()) return;
    const t = s.ctx.currentTime;
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(t + i * 0.07, f, 0.3, 0.06, "triangle", s.sfx));
  }

  function flare() {
    if (!ready()) return;
    const t = s.ctx.currentTime;
    tone(t, 1568, 0.35, 0.03, "sine", s.sfx);
    tone(t + 0.06, 2349, 0.3, 0.02, "sine", s.sfx);
  }

  function click() {
    if (!ready()) return;
    const t = s.ctx.currentTime;
    noise(t, 0.025, 0.12, s.sfx, { freq: 2500 });
    tone(t, 900, 0.05, 0.05, "square", s.sfx, { slide: 500 });
  }

  // Lanterna falhando: chiado curto.
  function fizzle() {
    if (!ready()) return;
    const t = s.ctx.currentTime;
    for (let i = 0; i < 3; i++) noise(t + i * 0.18, 0.08, 0.06, s.sfx, { type: "bandpass", freq: 1200, q: 3 });
    tone(t, 110, 0.5, 0.025, "square", s.sfx, { slide: 70 });
  }

  function hover() {
    if (!ready()) return;
    tone(s.ctx.currentTime, 1046.5, 0.08, 0.03, "sine", s.sfx);
  }

  function select() {
    if (!ready()) return;
    const t = s.ctx.currentTime;
    noise(t, 0.12, 0.2, s.sfx, { type: "lowpass", freq: 1400, sweep: 250 });
    tone(t, 784, 0.25, 0.08, "triangle", s.sfx);
    tone(t + 0.08, 1175, 0.3, 0.06, "triangle", s.sfx);
  }

  function dawn() {
    if (!ready()) return;
    const t = s.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(t + i * 0.09, f, 0.9, 0.05, "triangle", s.sfx));
  }

  function star(index) {
    if (!ready()) return;
    const t = s.ctx.currentTime;
    const f = [783.99, 987.77, 1174.66][index % 3];
    tone(t, f, 0.7, 0.1, "triangle", s.sfx);
    tone(t, f * 2, 0.4, 0.03, "sine", s.sfx);
  }

  function hoot() {
    if (!ready() || !owlSpot) return;
    const t = s.ctx.currentTime;
    tone(t, 392, 0.32, 0.08, "sine", owlSpot.input, { slide: 349, attack: 0.04 });
    tone(t + 0.42, 370, 0.5, 0.07, "sine", owlSpot.input, { slide: 330, attack: 0.05 });
  }

  function setOwl(pos) {
    if (!s.ctx) return;
    owlSpot ??= makeSpot("HRTF", s.sfx);
    place(owlSpot, pos, 0);
  }

  // A coruja fala com a voz do navegador. Devolve quanto tempo (mais ou menos) a fala dura.
  function say(text) {
    if (!s.enabled || !window.speechSynthesis) return 0;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pt-BR";
      voice ??= window.speechSynthesis.getVoices().find((v) => v.lang?.replace("_", "-").startsWith("pt-BR")) ?? null;
      if (voice) u.voice = voice;
      u.rate = 1.02;
      u.pitch = 1.25;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      // Sem síntese de voz: a coruja só pia.
    }
    return 0.4 + text.length * 0.065;
  }

  function quiet() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Nada para calar.
    }
  }

  // ----- ambiente da floresta -----

  function buildAmbient() {
    ambient = s.ctx.createGain();
    ambient.gain.value = 0;
    ambient.connect(s.sfx);
    for (const a of [0.6, 2.7, 4.6]) {
      const sp = makeSpot("equalpower", ambient);
      const r = rand(9, 11);
      place(sp, tmp.set(-Math.sin(a) * r, 0.3, -Math.cos(a) * r), 0);
      crickets.push({ sp, next: 0 });
    }
    frogSpot = makeSpot("equalpower", ambient);
    place(frogSpot, tmp.set(Math.sin(3.6) * 8, 0.1, Math.cos(3.6) * 8), 0);
    creakSpot = makeSpot("equalpower", ambient);
  }

  function setAmbient(mode, { creak = false } = {}) {
    creaks = creak;
    if (!s.ctx) {
      ambientMode = mode;
      return;
    }
    if (!ambient) buildAmbient();
    const t = s.ctx.currentTime;
    if (mode !== "off" && !windSrc) {
      windSrc = s.ctx.createBufferSource();
      windSrc.buffer = s.noiseBuf;
      windSrc.loop = true;
      const lp = s.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 380;
      wind = s.ctx.createGain();
      wind.gain.value = 0.0001;
      windSrc.connect(lp).connect(wind).connect(ambient);
      windSrc.start();
    }
    if (mode === "off" && windSrc) {
      windSrc.stop(t + 1.2);
      windSrc = null;
      wind = null;
    }
    ambient.gain.setTargetAtTime(mode === "off" ? 0 : 1, t, mode === "off" ? 0.25 : 0.6);
    ambientMode = mode;
  }

  // "A floresta prende a respiração": o ambiente some antes de algo especial.
  function hush(on) {
    if (!ambient || !s.ctx || ambientMode === "off") return;
    ambient.gain.setTargetAtTime(on ? 0.0001 : 1, s.ctx.currentTime, on ? 0.45 : 0.9);
  }

  function ambientStep(now) {
    if (ambientMode === "off" || !ambient) return;
    if (wind && now >= nextWind) {
      nextWind = now + rand(2.5, 4.5);
      wind.gain.setTargetAtTime(ambientMode === "dawn" ? 0.008 : rand(0.012, 0.034), now, 1.2);
    }
    for (const c of crickets) {
      if (now < c.next) continue;
      if (ambientMode === "dawn") {
        // Passarinhos no lugar dos grilos.
        c.next = now + rand(0.5, 1.6);
        const f = rand(2400, 3200);
        for (let i = 0; i < 3; i++) {
          tone(now + i * 0.08, f * (1 + i * 0.12), 0.07, 0.03, "sine", c.sp.input, { slide: f * (1.2 + i * 0.1) });
        }
        continue;
      }
      c.next = now + rand(0.8, 1.7);
      const f = rand(4300, 5000);
      const n = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) tone(now + i * 0.055, f, 0.032, 0.02, "sine", c.sp.input, { attack: 0.004 });
    }
    if (ambientMode === "night" && now >= nextFrog) {
      nextFrog = now + rand(4, 8);
      croak(frogSpot);
    }
    if (ambientMode === "night" && creaks && now >= nextCreak) {
      nextCreak = now + rand(9, 16);
      const a = rand(0, TAU);
      const r = rand(8, 13);
      place(creakSpot, tmp.set(-Math.sin(a) * r, 2.5, -Math.cos(a) * r), 0);
      vowel(now, 96, 78, 0.75, 0.035, 700, creakSpot.input, 0.2);
    }
  }

  // ----- música -----

  function bell(t, m, gain) {
    const cents = detune ? rand(-detune, detune) : 0;
    const f = midi(m) * Math.pow(2, cents / 1200);
    tone(t, f, 0.9, gain, "triangle", s.music, { attack: 0.004 });
    tone(t, f * 2.01, 0.45, gain * 0.35, "sine", s.music);
    tone(t, f * 3, 0.2, gain * 0.12, "sine", s.music);
  }

  function playStep(i, t) {
    if (musicMode === "dawn") {
      if (i % 16 === 0) {
        const chord = DAWN_PADS[Math.floor(i / 16) % DAWN_PADS.length].map(midi);
        s.pad(chord, t, STEP * 16, { gain: 0.016, cutoff: 1300, to: s.music });
      }
      if (i % 2 === 0) bell(t, DAWN[(i / 2) % DAWN.length], 0.04);
      return;
    }
    const n = BOX[i % BOX.length];
    const night = musicMode === "night";
    if (n !== null && (!night || i % 2 === 0 || tension > 0.35)) bell(t, n, night ? 0.035 + tension * 0.02 : 0.045);
    if (night && tension > 0.2 && i % 2 === 0) {
      tone(t, midi(BASS[(i / 2) % BASS.length]), 0.16, 0.05 * Math.min(1, tension * 1.4), "triangle", s.music);
    }
    if (night && tension > 0.65 && i % 4 === 2) noise(t, 0.04, 0.02, s.music, { freq: 6500 });
    if (!night && i % 32 === 0) s.pad([midi(45), midi(52)], t, STEP * 32, { gain: 0.01, cutoff: 600, to: s.music });
  }

  function schedule() {
    if (!s.ctx || s.ctx.state !== "running" || !s.enabled) return;
    const now = s.ctx.currentTime;
    ambientStep(now);
    if (musicMode === "off") return;
    if (nextStep < now - 0.5) nextStep = now + 0.05;
    while (nextStep < now + 0.15) {
      playStep(step, nextStep);
      step++;
      nextStep += musicMode === "dawn" ? STEP * 1.25 : STEP;
    }
  }
  s.setScheduler(schedule);

  function setMusic(mode) {
    if (mode === musicMode) return;
    if (s.ctx && mode !== "off") {
      nextStep = s.ctx.currentTime + 0.1;
      step = 0;
    }
    musicMode = mode;
  }

  function stopAll() {
    setMusic("off");
    setAmbient("off");
    quiet();
    tension = 0;
    for (const sp of spots) release(sp, 0.5);
  }

  return {
    unlock: s.unlock,
    setEnabled(value) {
      s.setEnabled(value);
      if (!value) quiet();
    },
    get enabled() {
      return s.enabled;
    },
    listen,
    spot,
    release,
    place,
    at,
    hum,
    boing,
    giggle,
    rustle,
    whisper,
    shy,
    whoosh,
    snore,
    plim,
    poof,
    buu,
    laugh,
    nham,
    croak,
    heartbeat,
    back,
    flare,
    click,
    fizzle,
    hover,
    select,
    dawn,
    star,
    hoot,
    setOwl,
    say,
    quiet,
    setAmbient,
    hush,
    setMusic,
    setTension(value) {
      tension = Math.max(0, Math.min(1, value));
    },
    setDetune(cents) {
      detune = cents;
    },
    stopAll,
  };
}
