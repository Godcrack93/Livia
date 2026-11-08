/* Sprunkinhos — partituras. Graus da escala (0 = Mi). Loop de 4 compassos: I – V – vi – IV.
   Como tudo é escrito em graus, a Lua troca o modo para menor e as mesmas melodias continuam combinando. */
(function () {
  'use strict';
  const { PROG, STEP } = window.SPR_AUDIO;
  const inWin = (d, lo) => { while (d < lo) d += 7; while (d >= lo + 7) d -= 7; return d; };
  const chord = bar => { const r = PROG[bar % 4]; return [r, r + 2, r + 4]; };
  const pat = len => ({ len, steps: Array.from({ length: len }, () => []) });
  const add = (p, s, ev) => { const i = Math.floor(s + 1e-9); ev.o = s - i; p.steps[i % p.len].push(ev); return ev; };
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const PAT = {};

  // ---------------- BATIDAS ----------------
  { const p = pat(64);
    for (let b = 0; b < 4; b++) {
      const o = b * 16;
      add(p, o, { k: 'kick', v: 1 }); add(p, o + 10, { k: 'kick', v: 0.9 }); if (b % 2) add(p, o + 7, { k: 'kick', v: 0.7 });
      add(p, o + 4, { k: 'snare', v: 1 }); add(p, o + 12, { k: 'snare', v: 1 });
    }
    add(p, 62, { k: 'snare', v: 0.45 }); add(p, 63, { k: 'snare', v: 0.7 });
    PAT.bumbo = p; }

  { const p = pat(64);
    for (let b = 0; b < 4; b++) for (let i = 0; i < 16; i++) {
      const s = b * 16 + i;
      if (b === 3 && i >= 12) continue;
      if (b === 1 && i === 15) continue;
      if (b === 1 && i === 14) { add(p, s, { k: 'open', v: 0.7 }); continue; }
      add(p, s, { k: 'hat', v: i % 4 === 2 ? 0.85 : i % 2 === 0 ? 0.55 : 0.3 });
    }
    for (let j = 0; j < 8; j++) add(p, 60 + j * 0.5, { k: 'hat', v: 0.3 + j * 0.07 });
    PAT.chiado = p; }

  { const p = pat(64), base = [[0, 'bb', 1], [2, 'ts', 0.5], [4, 'pf', 0.9], [6, 'ts', 0.45], [8, 'bb', 0.8], [10, 'bb', 0.7], [12, 'pf', 0.9], [14, 'ts', 0.5]];
    for (let b = 0; b < 4; b++) base.forEach(([s, k, v]) => add(p, b * 16 + s, { k, v }));
    add(p, 23, { k: 'ts', v: 0.3 }); add(p, 55, { k: 'kk', v: 0.4 }); add(p, 61, { k: 'kk', v: 0.55 }); add(p, 63, { k: 'kk', v: 0.75 });
    PAT.boquinha = p; }

  { const p = pat(64);
    for (let b = 0; b < 4; b++) {
      add(p, b * 16 + 4, { k: 'clap', v: 0.95 }); add(p, b * 16 + 12, { k: 'clap', v: 0.95 });
      [2, 6, 10, 14].forEach(s => add(p, b * 16 + s, { k: 'shk', v: 0.4 }));
    }
    add(p, 31, { k: 'clap', v: 0.5 }); add(p, 59, { k: 'clap', v: 0.5 }); add(p, 62, { k: 'clap', v: 0.6 }); add(p, 63, { k: 'clap', v: 0.8 });
    PAT.palminha = p; }

  { const p = pat(64), base = [[0, 'lo', 1], [3, 'hi', 0.7], [6, 'hi', 0.8], [8, 'lo', 0.85], [10, 'hi', 0.6], [11, 'hi', 0.7], [14, 'lo', 0.8]];
    for (let b = 0; b < 4; b++) base.forEach(([s, k, v]) => add(p, b * 16 + s, { k, v }));
    [0, 16, 26, 32, 48, 58, 60, 62].forEach((s, i) => add(p, s, { k: 'bell', v: i % 3 === 0 ? 0.7 : 0.5 }));
    PAT.bongo = p; }

  // ---------------- EFEITOS ----------------
  { const p = pat(64);
    [[6, 0], [14, 1], [30, 2], [38, 0], [46, 2], [60, 0], [61, 1], [62, 2]].forEach(([s, ci]) => add(p, s, { deg: chord(Math.floor(s / 16))[ci] + 7, v: 0.8 }));
    PAT.zip = p; }

  { const p = pat(64);
    [[6, 7], [10, 9], [38, 7], [42, 11]].forEach(([s, dd]) => add(p, s, { k: 'bloop', deg: chord(Math.floor(s / 16))[0] + dd, v: 0.8 }));
    add(p, 28, { k: 'boing', deg: chord(1)[0] - 7, v: 1 }); add(p, 56, { k: 'boing', deg: chord(3)[0] - 7, v: 1 });
    add(p, 62, { k: 'bloop', deg: chord(3)[2] + 7, v: 0.7 });
    PAT.mola = p; }

  { const p = pat(64);
    [[14, 'f', 1], [28, 'f', 1], [29, 'b', 1], [30, 'f', 2], [46, 'f', 1], [56, 'f', 1], [57, 'b', 1], [58, 'f', 1], [59, 'b', 1], [60, 'f', 2], [62, 'b', 1], [63, 'f', 1]]
      .forEach(([s, dir, len]) => add(p, s, { dir, len, v: 0.85 }));
    PAT.risco = p; }

  { const p = pat(64), cand = [1, 3, 5, 6, 9, 11, 13, 14];
    for (let b = 0; b < 4; b++) {
      const c = cand.slice();
      for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
      c.slice(0, 4).forEach(s => add(p, b * 16 + s, { deg: chord(b)[Math.floor(rnd() * 3)] + 14, v: 0.5 + rnd() * 0.4 }));
    }
    PAT.estrelinha = p; }

  { const p = pat(64), c0 = chord(0), c1 = chord(1), c2 = chord(2), c3 = chord(3);
    [c0[0], c0[1], c0[2], c0[0] + 7].forEach((d, i) => add(p, 12 + i, { deg: d + 7, v: 0.8, len: 1 }));
    add(p, 22, { deg: c1[2] + 7, v: 0.7, len: 1 }); add(p, 23, { deg: c1[0] + 14, v: 0.8, len: 1 });
    [c2[0] + 7, c2[2], c2[1], c2[0]].forEach((d, i) => add(p, 44 + i, { deg: d + 7, v: 0.8, len: 1 }));
    [c3[0], c3[2], c3[1], c3[2]].forEach((d, i) => add(p, 56 + i, { deg: d + 7, v: 0.75, len: 0.6 }));
    add(p, 62, { deg: c3[0], v: 0.9, len: 2 });
    PAT.robo = p; }

  // ---------------- MELODIAS ----------------
  { const p = pat(64);
    for (let b = 0; b < 4; b++) {
      const R = inWin(PROG[b], 0) - 14;
      [[0, 0, 3, 1], [3, 7, 1, 0.55], [6, 0, 2, 0.85], [10, 0, 2, 0.9], [12, 4, 2, 0.75], [14, 2, 2, 0.8]]
        .forEach(([s, d, len, v]) => add(p, b * 16 + s, { deg: R + d, len, v }));
    }
    PAT.grave = p; }

  { const p = pat(64);
    for (let b = 0; b < 4; b++) {
      const vo = chord(b).map(d => inWin(d, -3)).sort((a, c) => a - c);
      [[2, 0.75], [6, 0.62], [10, 0.75], [14, 0.6]].forEach(([s, v]) => add(p, b * 16 + s, { degs: vo, len: 1.6, v }));
    }
    PAT.tecla = p; }

  { const p = pat(64), seq = [0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 4, 3];
    for (let b = 0; b < 4; b++) {
      const t3 = chord(b).map(d => inWin(d, 1)).sort((a, c) => a - c), T = [...t3, ...t3.map(d => d + 7)];
      seq.forEach((ix, i) => add(p, b * 16 + i, { deg: T[ix], v: i % 4 === 0 ? 0.9 : 0.6 }));
    }
    PAT.pisca = p; }

  { const p = pat(64);
    [[0, 4, 2], [2, 2, 2], [4, 4, 2], [6, 5, 2], [8, 4, 4], [12, 2, 4],
     [16, 4, 2], [18, 6, 2], [20, 8, 4], [24, 7, 2], [26, 6, 2], [28, 4, 4],
     [32, 5, 2], [34, 7, 2], [36, 9, 4], [40, 8, 2], [42, 7, 2], [44, 5, 4],
     [48, 7, 2], [50, 5, 2], [52, 3, 4], [56, 5, 2], [58, 4, 2]].forEach(([s, d, len]) => add(p, s, { deg: d + 7, len, v: 0.85 }));
    PAT.sininho = p; }

  { const p = pat(64);
    [[0, 2, 6], [6, 4, 2], [8, 2, 8], [16, 1, 6], [22, 2, 2], [24, 1, 4], [28, -1, 4],
     [32, 0, 6], [38, 2, 2], [40, 0, 8], [48, -2, 6], [54, -3, 2], [56, 0, 4], [60, 1, 4]].forEach(([s, d, len]) => add(p, s, { deg: d + 7, len, v: 0.8 }));
    PAT.flautinha = p; }

  // ---------------- VOZES ----------------
  { const p = pat(64);
    for (let b = 0; b < 4; b++) add(p, b * 16, { degs: chord(b).map(d => inWin(d, -6)).sort((a, c) => a - c), len: 16, v: 0.8 });
    PAT.nuvem = p; }

  { const p = pat(64);
    for (let b = 0; b < 4; b++) {
      const R = inWin(PROG[b], -11);
      [[0, 0, 3.5, 'dum', 1], [6, 0, 1.5, 'du', 0.75], [8, 4, 3.5, 'dum', 0.9], [12, 7, 1.5, 'dum', 0.8], [14, 4, 1.5, 'du', 0.7]]
        .forEach(([s, d, len, syl, v]) => add(p, b * 16 + s, { deg: R + d, len, syl, v }));
    }
    PAT.dudu = p; }

  { const p = pat(128);
    const A = [[0, 4, 3], [3, 4, 1], [4, 5, 2], [6, 4, 2], [8, 2, 6], [16, 1, 3], [19, 1, 1], [20, 2, 2], [22, 1, 2], [24, -1, 6],
      [32, 5, 3], [35, 5, 1], [36, 6, 2], [38, 5, 2], [40, 2, 6], [48, 5, 3], [51, 5, 1], [52, 4, 2], [54, 3, 2], [56, 2, 4], [60, 1, 4]];
    const B = [[64, 2, 2], [66, 4, 2], [68, 5, 2], [70, 4, 2], [72, 7, 6], [80, 6, 3], [83, 6, 1], [84, 5, 2], [86, 4, 2], [88, 4, 4], [92, 5, 2], [94, 6, 2],
      [96, 7, 3], [99, 6, 1], [100, 5, 2], [102, 4, 2], [104, 2, 6], [112, 3, 3], [115, 2, 1], [116, 1, 2], [118, 2, 2], [120, 0, 8]];
    A.concat(B).forEach(([s, d, len]) => add(p, s, { deg: d, len, v: len >= 4 ? 0.9 : 0.8 }));
    PAT.lala = p; }

  { const p = pat(64);
    for (let b = 0; b < 4; b++) {
      const pair = chord(b).map(d => inWin(d, -8)).sort((a, c) => a - c).slice(1);
      const rh = b % 2 === 0 ? [[2, 1.5, 0.7], [6, 1.5, 0.65], [10, 4, 0.85]] : [[2, 1.5, 0.7], [6, 1.5, 0.65], [8, 1, 0.6], [10, 1.5, 0.7], [12, 3, 0.85]];
      rh.forEach(([s, len, v]) => add(p, b * 16 + s, { degs: pair, len, v }));
    }
    PAT.ua = p; }

  { const p = pat(64);
    [[12, 4], [13, 2], [14, 4], [15, 7], [24, 6], [25, 8], [26, 6], [27, 4], [28, 8, 2], [30, 6, 2],
     [44, 5], [45, 2], [46, 5], [47, 7], [56, 7], [57, 5], [58, 3], [59, 5], [60, 7, 2], [62, 4, 2]].forEach(([s, d, len]) => add(p, s, { deg: d, len: len || 1, v: 0.75 }));
    PAT.tiriri = p; }

  { const p = pat(64), mel = [[0, 4, 6], [6, 7, 10], [16, 8, 8], [24, 6, 8], [32, 7, 8], [40, 9, 8], [48, 7, 6], [54, 5, 6], [60, 6, 4]];
    mel.forEach(([s, d, len], i) => add(p, s, { deg: d, len, v: 0.85, prev: mel[(i + mel.length - 1) % mel.length][1] }));
    PAT.lua = p; }

  // ---------------- como cada personagem toca ----------------
  const PLAY = {
    bumbo(e, v, ev, t) {
      if (ev.k === 'kick') { e.kick(v.ch.in, t, ev.v); e.show(v.id, t, 0.14, ev.v, 'o', 'kick'); }
      else { e.snare(v.ch.in, t, ev.v); e.show(v.id, t, 0.12, ev.v, 'a', 'hit'); }
    },
    chiado(e, v, ev, t) { e.hat(v.ch.in, t, ev.v, ev.k === 'open'); if (ev.v > 0.5) e.show(v.id, t, ev.k === 'open' ? 0.22 : 0.07, ev.v, 'i', 'hit'); },
    boquinha(e, v, ev, t) {
      e[{ bb: 'bbKick', ts: 'bbTs', pf: 'bbPf', kk: 'bbK' }[ev.k]](v.ch.in, t, ev.v);
      e.show(v.id, t, 0.1, ev.v, ev.k === 'bb' ? 'o' : ev.k === 'pf' ? 'u' : 'i', ev.k === 'bb' ? 'kick' : 'hit');
    },
    palminha(e, v, ev, t) {
      if (ev.k === 'clap') { e.clap(v.ch.in, t, ev.v); e.show(v.id, t, 0.12, ev.v, 'a', 'clap'); }
      else e.shaker(v.ch.in, t, ev.v);
    },
    bongo(e, v, ev, t) {
      if (ev.k === 'bell') e.cowbell(v.ch.in, t, ev.v); else e.bongo(v.ch.in, t, ev.v, ev.k === 'hi');
      e.show(v.id, t, 0.1, ev.v, 'o', 'hit');
    },
    zip(e, v, ev, t) { e.zap(v.ch.in, t, ev.v, e.m(ev.deg)); e.show(v.id, t, 0.16, ev.v, 'o', 'fx'); },
    mola(e, v, ev, t) {
      const m = e.m(ev.deg);
      if (ev.k === 'boing') { e.boing(v.ch.in, t, ev.v, m); e.show(v.id, t, 0.6, ev.v, 'o', 'boing'); }
      else { e.bloop(v.ch.in, t, ev.v, m); e.show(v.id, t, 0.1, ev.v, 'u', 'fx'); }
    },
    risco(e, v, ev, t) { e.scratch(v.ch.in, t, ev.v, ev.dir, ev.len); e.show(v.id, t, ev.len * STEP, ev.v, 'a', 'fx'); },
    estrelinha(e, v, ev, t) { e.sparkle(v.ch.in, t, ev.v, e.m(ev.deg)); e.show(v.id, t, 0.15, ev.v, 'o', 'fx'); },
    robo(e, v, ev, t) { e.bleep(v.ch.in, t, ev.v, e.m(ev.deg), ev.len || 1); e.show(v.id, t, (ev.len || 1) * STEP * 0.8, ev.v, 'a', 'fx'); },
    grave(e, v, ev, t) { e.bass(v.ch.in, t, ev.v, e.m(ev.deg), ev.len); e.show(v.id, t, ev.len * STEP * 0.8, ev.v * 0.8, 'o', 'note'); },
    tecla(e, v, ev, t) { ev.degs.forEach(d => e.ep(v.ch.in, t, ev.v, e.m(d), ev.len)); e.show(v.id, t, ev.len * STEP, ev.v, 'a', 'note'); },
    pisca(e, v, ev, t) { e.pluck(v.ch.in, t, ev.v, e.m(ev.deg)); e.show(v.id, t, 0.09, ev.v, 'o', ev.v > 0.8 ? 'note' : 'tick'); },
    sininho(e, v, ev, t) { e.bell(v.ch.in, t, ev.v, e.m(ev.deg)); e.show(v.id, t, ev.len * STEP * 0.7, ev.v, 'o', 'note'); },
    flautinha(e, v, ev, t) { e.flute(v.ch.in, t, ev.v, e.m(ev.deg), ev.len); e.show(v.id, t, ev.len * STEP, ev.v, 'u', ev.len >= 6 ? 'long' : 'note'); },
    nuvem(e, v, ev, t) { e.choir(v.ch.in, t, ev.v, ev.degs.map(d => e.m(d)), ev.len); e.show(v.id, t, ev.len * STEP - 0.1, 0.8, 'u', 'long'); },
    dudu(e, v, ev, t) {
      e.voice(v.ch.in, t, ev.v, e.m(ev.deg), ev.len, { vow: 'u', from: 'o', morph: 0.05, end: ev.syl === 'dum' ? 'm' : null, cons: 'd', vib: 0.6, gate: 0.85, body: 0.25 });
      e.show(v.id, t, ev.len * STEP * 0.8, ev.v, 'u', 'note');
    },
    lala(e, v, ev, t) {
      e.voice(v.ch.in, t, ev.v, e.m(ev.deg), ev.len, { vow: 'a', from: 'e', morph: 0.05, scoop: 0.6, vib: ev.len >= 4 ? 1.2 : 0.4, det: 6, gate: 0.88 });
      e.show(v.id, t, ev.len * STEP * 0.85, ev.v, 'a', ev.len >= 4 ? 'long' : 'note');
    },
    ua(e, v, ev, t) {
      ev.degs.forEach(d => e.voice(v.ch.in, t, ev.v * 0.8, e.m(d), ev.len, { vow: 'a', from: 'u', morph: 0.13, scoop: 1, vib: ev.len >= 3 ? 1.1 : 0.3, gate: 0.85, bright: 1.1, body: 0.2 }));
      e.show(v.id, t, ev.len * STEP * 0.8, ev.v, 'a', ev.len >= 3 ? 'long' : 'note');
    },
    tiriri(e, v, ev, t) {
      e.voice(v.ch.in, t, ev.v, e.m(ev.deg), ev.len, { vow: 'i', from: 'e', morph: 0.03, cons: 't', vib: 0.5, vibRate: 7.5, gate: 0.7, scoop: 0.5, att: 0.008, body: 0.45, bright: 1.2 });
      e.show(v.id, t, ev.len * STEP * 0.6, ev.v, 'i', 'note');
    },
    lua(e, v, ev, t) { e.theremin(v.ch.in, t, ev.v, e.m(ev.deg), ev.len, e.m(ev.prev)); e.show(v.id, t, ev.len * STEP, ev.v, 'u', 'long'); },
  };

  // volume e envios (reverb, delay) de cada personagem
  const MIX = {
    bumbo: { vol: 0.95, rev: 0.04, dly: 0 }, chiado: { vol: 0.7, rev: 0.03, dly: 0.06 }, boquinha: { vol: 0.85, rev: 0.08, dly: 0 },
    palminha: { vol: 1.0, rev: 0.2, dly: 0 }, bongo: { vol: 0.6, rev: 0.12, dly: 0.05 },
    zip: { vol: 0.85, rev: 0.15, dly: 0.25 }, mola: { vol: 0.75, rev: 0.15, dly: 0.1 }, risco: { vol: 0.6, rev: 0.1, dly: 0.12 },
    estrelinha: { vol: 0.85, rev: 0.35, dly: 0.45 }, robo: { vol: 0.7, rev: 0.12, dly: 0.3 },
    grave: { vol: 0.75, rev: 0, dly: 0 }, tecla: { vol: 0.65, rev: 0.2, dly: 0.08 }, pisca: { vol: 0.95, rev: 0.15, dly: 0.35 },
    sininho: { vol: 0.85, rev: 0.28, dly: 0.22 }, flautinha: { vol: 0.6, rev: 0.3, dly: 0.12 },
    nuvem: { vol: 0.45, rev: 0.45, dly: 0.08 }, dudu: { vol: 0.7, rev: 0.12, dly: 0 }, lala: { vol: 0.6, rev: 0.25, dly: 0.12 },
    ua: { vol: 0.6, rev: 0.2, dly: 0.1 }, tiriri: { vol: 0.65, rev: 0.2, dly: 0.2 }, lua: { vol: 0.5, rev: 0.5, dly: 0.3 },
  };

  // ================= MODO TERROR =================
  // Mesmo andamento e mesmos acordes; a escala vira Mi menor harmônica e os timbres ficam sombrios.
  const PATH = {};
  { const p = pat(64); // coração e porta batendo
    for (let b = 0; b < 4; b++) {
      add(p, b * 16, { k: 'heart', v: 1 }); add(p, b * 16 + 8, { k: 'heart', v: 0.85 });
      add(p, b * 16 + 4, { k: 'slam', v: 0.8 }); add(p, b * 16 + 12, { k: 'slam', v: 0.95 });
    }
    PATH.bumbo = p; }
  { const p = pat(64); // relógio
    for (let s = 0; s < 64; s += 2) add(p, s, { k: 'tick', hi: s % 4 === 0, v: s % 4 === 0 ? 0.9 : 0.6 });
    [0, 32].forEach(s => add(p, s, { k: 'chime', v: 0.8 }));
    PATH.chiado = p; }
  { const p = pat(64); // baixo lento e ameaçador
    for (let b = 0; b < 4; b++) {
      const R = inWin(PROG[b], 0) - 14;
      [[0, 0, 6, 1], [8, 0, 3, 0.85], [11, 0, 1, 0.7], [12, 4, 2, 0.8], [14, 2, 2, 0.75]].forEach(([s, d, len, v]) => add(p, b * 16 + s, { deg: R + d, len, v }));
    }
    PATH.grave = p; }
  { const p = pat(64); // órgão: um acorde longo por compasso
    for (let b = 0; b < 4; b++) add(p, b * 16, { degs: chord(b).map(d => inWin(d, -3)).sort((a, c) => a - c), len: 16, v: 0.85 });
    PATH.tecla = p; }
  { const p = pat(64), seq = [0, 1, 2, 3, 2, 1, 2, 1]; // caixinha de música em colcheias
    for (let b = 0; b < 4; b++) {
      const t3 = chord(b).map(d => inWin(d, 1)).sort((a, c) => a - c), T = [...t3, t3[0] + 7];
      seq.forEach((ix, i) => add(p, b * 16 + i * 2, { deg: T[ix], v: i % 4 === 0 ? 0.9 : 0.65 }));
    }
    PATH.pisca = p; }
  { const p = pat(64); // sino fúnebre
    for (let b = 0; b < 4; b++) {
      const R = inWin(PROG[b], -7);
      add(p, b * 16, { deg: R, v: 1 });
      if (b % 2) add(p, b * 16 + 8, { deg: R + 4, v: 0.7 });
    }
    PATH.sininho = p; }

  const PLAYH = {
    bumbo(e, v, ev, t) {
      if (ev.k === 'heart') { e.heart(v.ch.in, t, ev.v); e.show(v.id, t, 0.3, ev.v, 'o', 'kick'); }
      else { e.slam(v.ch.in, t, ev.v); e.show(v.id, t, 0.15, ev.v, 'a', 'hit'); }
    },
    chiado(e, v, ev, t) {
      if (ev.k === 'chime') e.chime(v.ch.in, t, ev.v); else e.clockTick(v.ch.in, t, ev.v, ev.hi);
      if (ev.hi || ev.k === 'chime') e.show(v.id, t, 0.08, ev.v, 'i', 'hit');
    },
    boquinha(e, v, ev, t) {
      e[{ bb: 'growl', ts: 'breath', pf: 'snarl', kk: 'knock' }[ev.k]](v.ch.in, t, ev.v);
      e.show(v.id, t, ev.k === 'ts' ? 0.2 : 0.12, ev.v, ev.k === 'bb' ? 'o' : 'a', ev.k === 'bb' ? 'kick' : 'hit');
    },
    palminha(e, v, ev, t) {
      if (ev.k === 'clap') { e.clap(v.ch.in, t, ev.v); e.show(v.id, t, 0.12, ev.v, 'a', 'clap'); }
      else e.rattle(v.ch.in, t, ev.v);
    },
    bongo(e, v, ev, t) {
      if (ev.k === 'bell') e.clank(v.ch.in, t, ev.v); else e.tom(v.ch.in, t, ev.v, ev.k === 'hi');
      e.show(v.id, t, 0.12, ev.v, 'o', 'hit');
    },
    zip(e, v, ev, t) { e.ghost(v.ch.in, t, ev.v, e.m(ev.deg)); e.show(v.id, t, 0.5, ev.v, 'o', 'fx'); },
    mola(e, v, ev, t) {
      const long = ev.k === 'boing';
      e.creak(v.ch.in, t, ev.v, long ? 0.9 : 0.25); e.show(v.id, t, long ? 0.8 : 0.2, ev.v, 'o', long ? 'boing' : 'fx');
    },
    risco(e, v, ev, t) { e.swell(v.ch.in, t, ev.v, ev.dir, ev.len); e.show(v.id, t, ev.len * STEP, ev.v, 'o', 'fx'); },
    estrelinha(e, v, ev, t) { e.musicBox(v.ch.in, t, ev.v, e.m(ev.deg - 7)); e.show(v.id, t, 0.15, ev.v, 'o', 'fx'); },
    robo(e, v, ev, t) { e.glitch(v.ch.in, t, ev.v, e.m(ev.deg), ev.len || 1); e.show(v.id, t, (ev.len || 1) * STEP * 0.8, ev.v, 'a', 'fx'); },
    grave(e, v, ev, t) { e.dbass(v.ch.in, t, ev.v, e.m(ev.deg), ev.len); e.show(v.id, t, ev.len * STEP * 0.8, ev.v, 'o', 'note'); },
    tecla(e, v, ev, t) { e.organ(v.ch.in, t, ev.v, ev.degs.map(d => e.m(d)), ev.len); e.show(v.id, t, ev.len * STEP - 0.1, ev.v, 'o', 'long'); },
    pisca(e, v, ev, t) { e.musicBox(v.ch.in, t, ev.v, e.m(ev.deg)); e.show(v.id, t, 0.1, ev.v, 'o', ev.v > 0.8 ? 'note' : 'tick'); },
    sininho(e, v, ev, t) { e.toll(v.ch.in, t, ev.v, e.m(ev.deg)); e.show(v.id, t, 0.6, ev.v, 'o', 'long'); },
    flautinha(e, v, ev, t) {
      e.flute(v.ch.in, t, ev.v, e.m(ev.deg), ev.len, { vib: 2.4, vibRate: 6, droop: ev.len >= 4 ? 0.8 : 0, breath: 2 });
      e.show(v.id, t, ev.len * STEP, ev.v, 'u', ev.len >= 6 ? 'long' : 'note');
    },
    nuvem(e, v, ev, t) {
      const ms = ev.degs.map(d => e.m(d)); ms.unshift(ms[0] - 12);
      e.choir(v.ch.in, t, ev.v, ms, ev.len, { from: 'a', to: 'o', det: 16, lvl: 0.85 });
      e.show(v.id, t, ev.len * STEP - 0.1, 0.8, 'o', 'long');
    },
    dudu(e, v, ev, t) {
      e.voice(v.ch.in, t, ev.v, e.m(ev.deg) - 12, ev.len, { vow: 'u', from: 'o', morph: 0.08, end: 'm', cons: 'd', vib: 0.4, gate: 0.95, body: 0.4 });
      e.show(v.id, t, ev.len * STEP * 0.8, ev.v, 'o', 'note');
    },
    lala(e, v, ev, t) { // a mesma canção de ninar, desafinada e arrastada
      e.voice(v.ch.in, t, ev.v, e.m(ev.deg), ev.len, { vow: 'a', from: 'e', morph: 0.05, scoop: 0.3, vib: 1.6, vibRate: 4.2, det: 14, gate: 0.9, droop: ev.len >= 4 ? 0.6 : 0 });
      e.show(v.id, t, ev.len * STEP * 0.85, ev.v, 'a', ev.len >= 4 ? 'long' : 'note');
    },
    ua(e, v, ev, t) { // gemido de fantasma
      ev.degs.forEach(d => e.voice(v.ch.in, t, ev.v * 0.8, e.m(d), ev.len * 1.4, { vow: 'o', from: 'u', morph: 0.25, scoop: 3, droop: 2, vib: 1.4, vibRate: 4.5, gate: 0.9, body: 0.3 }));
      e.show(v.id, t, ev.len * STEP, ev.v, 'o', 'long');
    },
    tiriri(e, v, ev, t) { // risadinha "hi-hi-hi"
      e.voice(v.ch.in, t, ev.v, e.m(ev.deg) + 12, ev.len, { vow: 'i', from: 'e', morph: 0.02, cons: 'h', droop: 3, vib: 0, gate: 0.75, att: 0.005, body: 0.3, bright: 1.3 });
      e.show(v.id, t, ev.len * STEP * 0.6, ev.v, 'i', 'note');
    },
    lua(e, v, ev, t) { e.theremin(v.ch.in, t, ev.v, e.m(ev.deg) - 12, ev.len, e.m(ev.prev) - 12, { trem: 0.35 }); e.show(v.id, t, ev.len * STEP, ev.v, 'u', 'long'); },
  };

  const MIXH = {
    bumbo: { vol: 1.0, rev: 0.25, dly: 0 }, chiado: { vol: 0.8, rev: 0.2, dly: 0.15 }, boquinha: { vol: 0.9, rev: 0.15, dly: 0 },
    palminha: { vol: 1.0, rev: 0.5, dly: 0.1 }, bongo: { vol: 0.5, rev: 0.3, dly: 0.1 },
    zip: { vol: 0.9, rev: 0.5, dly: 0.3 }, mola: { vol: 0.55, rev: 0.4, dly: 0.1 }, risco: { vol: 1.0, rev: 0.35, dly: 0.2 },
    estrelinha: { vol: 0.9, rev: 0.55, dly: 0.35 }, robo: { vol: 0.6, rev: 0.25, dly: 0.25 },
    grave: { vol: 0.62, rev: 0.05, dly: 0 }, tecla: { vol: 0.7, rev: 0.45, dly: 0.05 }, pisca: { vol: 0.9, rev: 0.4, dly: 0.3 },
    sininho: { vol: 0.8, rev: 0.6, dly: 0.1 }, flautinha: { vol: 0.6, rev: 0.5, dly: 0.2 },
    nuvem: { vol: 0.45, rev: 0.6, dly: 0.1 }, dudu: { vol: 0.75, rev: 0.25, dly: 0 }, lala: { vol: 0.6, rev: 0.45, dly: 0.2 },
    ua: { vol: 0.5, rev: 0.5, dly: 0.15 }, tiriri: { vol: 0.5, rev: 0.45, dly: 0.25 }, lua: { vol: 0.6, rev: 0.6, dly: 0.3 },
  };

  window.SPR_MUSIC = { PAT, PLAY, MIX, PATH, PLAYH, MIXH };
})();
