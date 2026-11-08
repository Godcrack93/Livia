/* Pipoca Conta — efeitos sonoros sintetizados com Web Audio (nenhum arquivo de som).
   PC.som.iniciar() precisa ser chamado num toque (o app chama no primeiro toque da tela). */
(function () {
  'use strict';
  const PC = window.PC;
  let ctx = null, saida = null, ruido = null, ligado = true;
  const ultimo = {};

  function iniciar() {
    if (ctx) { if (ctx.state !== 'running') ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4;
    saida = ctx.createGain(); saida.gain.value = ligado ? 0.7 : 0;
    saida.connect(comp); comp.connect(ctx.destination);
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    ctx.resume().catch(() => {});
  }

  function pode(nome, intervalo) {
    if (!ctx || !ligado || ctx.state !== 'running') return false;
    const t = ctx.currentTime;
    if (ultimo[nome] && t - ultimo[nome] < intervalo) return false;
    ultimo[nome] = t;
    return true;
  }
  const T = () => ctx.currentTime + 0.005;

  function tom(tipo, f0, f1, dur, vol, t, ataque) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (ataque || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(saida);
    o.start(t); o.stop(t + dur + 0.03);
  }
  function chiado(dur, vol, t, tipo, f0, f1, q) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruido; f.type = tipo || 'lowpass';
    f.frequency.setValueAtTime(f0 || 2000, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    f.Q.value = q || 0.8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(saida);
    s.start(t, Math.random() * 0.5, dur + 0.05);
  }
  // escala pentatônica maior a partir de dó 5: cada número soa uma nota mais alta
  const PENTA = [0, 2, 4, 7, 9];
  function notaContagem(n) {
    const i = Math.max(0, n - 1), oit = Math.floor(i / 5), grau = PENTA[i % 5] + 12 * oit;
    return 523.25 * Math.pow(2, Math.min(grau, 36) / 12);
  }
  const nota = semitons => 523.25 * Math.pow(2, semitons / 12);

  const S = {
    clique() { if (!pode('clique', 0.04)) return; tom('sine', 880, 1320, 0.06, 0.18, T()); },
    pegar() { if (!pode('pegar', 0.05)) return; tom('sine', 520, 820, 0.09, 0.2, T()); },
    encaixar() {
      if (!pode('encaixar', 0.04)) return; const t = T();
      chiado(0.04, 0.25, t, 'bandpass', 2600, 0, 1.4); tom('triangle', 330, 190, 0.08, 0.32, t);
    },
    soltar() { if (!pode('soltar', 0.05)) return; tom('sine', 420, 250, 0.11, 0.22, T()); },
    separar() { if (!pode('separar', 0.06)) return; const t = T(); tom('sine', 950, 380, 0.13, 0.28, t); chiado(0.06, 0.15, t, 'highpass', 2500); },
    contar(n) { if (!pode('contar', 0.03)) return; const t = T(), f = notaContagem(n || 1); tom('triangle', f, f, 0.2, 0.26, t); tom('sine', f * 2, f * 2, 0.12, 0.06, t); },
    acerto() {
      if (!pode('acerto', 0.2)) return; const t = T();
      [0, 4, 7, 12].forEach((s, i) => tom('triangle', nota(s), nota(s), 0.22, 0.22, t + i * 0.085));
      [19, 24].forEach((s, i) => tom('sine', nota(s), nota(s), 0.18, 0.06, t + 0.3 + i * 0.06));
    },
    quase() { if (!pode('quase', 0.3)) return; const t = T(); tom('sine', nota(-5), nota(-5), 0.18, 0.16, t); tom('sine', nota(-8), nota(-8), 0.26, 0.14, t + 0.16); },
    moeda() { if (!pode('moeda', 0.05)) return; const t = T(); tom('square', 988, 988, 0.07, 0.09, t); tom('square', 1319, 1319, 0.3, 0.08, t + 0.07); },
    pulo() {
      if (!pode('pulo', 0.1)) return; const t = T();
      const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(720, t + 0.18);
      lfo.frequency.value = 18; lg.gain.value = 40; lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g); g.connect(saida); o.start(t); o.stop(t + 0.32); lfo.start(t); lfo.stop(t + 0.32);
    },
    piu() { if (!pode('piu', 0.08)) return; const t = T(); tom('sine', 2100, 2700, 0.06, 0.12, t); tom('sine', 2700, 1900, 0.08, 0.1, t + 0.06); },
    figurinha() {
      if (!pode('figurinha', 0.3)) return; const t = T();
      [0, 4, 7, 11, 12, 16].forEach((s, i) => tom('triangle', nota(s), nota(s), 0.3, 0.16, t + i * 0.07));
      chiado(0.5, 0.06, t + 0.2, 'highpass', 5000);
    },
    festa() {
      if (!pode('festa', 0.5)) return; const t = T();
      const mel = [0, 4, 7, 12, 7, 12, 16, 19];
      mel.forEach((s, i) => tom('triangle', nota(s), nota(s), 0.24, 0.18, t + i * 0.11));
      [0, 4, 7].forEach(s => tom('sine', nota(s - 12), nota(s - 12), 0.9, 0.08, t + 0.88));
      for (let i = 0; i < 8; i++) chiado(0.05, 0.08, t + 0.1 + i * 0.12, 'highpass', 4000 + Math.random() * 3000);
    },
    pagina() { if (!pode('pagina', 0.1)) return; chiado(0.22, 0.18, T(), 'bandpass', 600, 2400, 1.2); },
    bolha() { if (!pode('bolha', 0.05)) return; tom('sine', 300, 900, 0.1, 0.2, T()); },
  };

  PC.som = Object.assign({
    iniciar,
    get ligado() { return ligado; },
    set ligado(v) { ligado = !!v; if (saida) saida.gain.value = ligado ? 0.7 : 0; },
    pausar() { if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); },
    retomar() { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); },
  }, S);
})();
