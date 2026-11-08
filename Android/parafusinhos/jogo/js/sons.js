// Sons do Parafusinhos: tudo sintetizado na hora com WebAudio (nenhum arquivo de áudio).
(function (P) {
  'use strict';

  const VOLUME_GERAL = 0.6;
  // Dó, mi, sol: cada furo da caixinha sobe uma nota, e a caixa cheia vira um arpejo.
  const NOTAS_POUSO = [1046.5, 1318.5, 1568];
  const QUASE_ZERO = 0.0001; // rampas exponenciais não podem chegar a 0

  let ctx = null;        // AudioContext, criado no primeiro gesto do usuário
  let geral = null;      // ganho geral (0 quando o som está desligado)
  let entrada = null;    // onde todos os sons se somam
  let ruido = null;      // 1 s de ruído branco, reaproveitado pelos chiados
  let ativo = true;
  let suspenso = false;  // aplicativo em segundo plano

  // Fora do aplicativo, o navegador só deixa o áudio começar depois de um gesto. Criar o
  // contexto antes disso gera aviso no console e o deixa mudo, então esperamos.
  function podeComecar() {
    if (globalThis.ParafusinhosAndroid) return true;
    const ativacao = globalThis.navigator && globalThis.navigator.userActivation;
    return !ativacao || ativacao.hasBeenActive;
  }

  function criarContexto() {
    const Contexto = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Contexto) return false;
    try {
      ctx = new Contexto();
    } catch (e) {
      return false; // sem áudio: o jogo segue mudo
    }
    entrada = ctx.createGain();
    geral = ctx.createGain();
    geral.gain.value = ativo ? VOLUME_GERAL : 0;
    const protecao = criarProtecao();
    entrada.connect(geral);
    geral.connect(protecao);
    protecao.connect(ctx.destination);

    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const amostras = ruido.getChannelData(0);
    for (let i = 0; i < amostras.length; i++) amostras[i] = Math.random() * 2 - 1;
    return true;
  }

  // Proteção contra estouro quando vários sons se somam (cascata de caixas): é transparente
  // até 0,6 e só arredonda acima disso. Um compressor achataria o ataque dos sons curtos.
  function criarProtecao() {
    const protecao = ctx.createWaveShaper();
    const curva = new Float32Array(1025);
    for (let i = 0; i < curva.length; i++) {
      const x = (i / (curva.length - 1)) * 2 - 1;
      const a = Math.abs(x);
      curva[i] = a <= 0.6 ? x : Math.sign(x) * (0.6 + 0.4 * Math.tanh((a - 0.6) / 0.4));
    }
    protecao.curve = curva;
    return protecao;
  }

  function desbloquear() {
    if (!ativo) return; // som desligado: nem cria o contexto
    if (!ctx && (!podeComecar() || !criarContexto())) return;
    suspenso = false; // um gesto do usuário significa que o jogo está na frente
    if (ctx.state === 'suspended') ctx.resume().catch(ignorar);
  }

  // Com o som desligado o contexto fica suspenso (economiza bateria). A espera deixa o
  // clique do próprio interruptor terminar sem estalo.
  function suspenderSeMudo() {
    if (!ativo && ctx && ctx.state === 'running') ctx.suspend().catch(ignorar);
  }

  function ignorar() {
    // promessas de resume/suspend recusadas: não há o que fazer, o jogo segue mudo
  }

  // ---------- Peças de síntese ----------

  // Envelope de percussão: sobe em `ataque` s até `pico` e morre exponencialmente até `fim` s.
  function envelope(param, t, pico, ataque, fim) {
    param.setValueAtTime(QUASE_ZERO, t);
    param.exponentialRampToValueAtTime(pico, t + ataque);
    param.exponentialRampToValueAtTime(QUASE_ZERO, t + fim);
  }

  // Oscilador com envelope. o = { tipo, freq, ate?, glide?, pico, ataque?, fim, passaBaixa? }
  function tom(destino, t, o) {
    const osc = ctx.createOscillator();
    osc.type = o.tipo || 'sine';
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.ate) osc.frequency.exponentialRampToValueAtTime(o.ate, t + (o.glide || o.fim));
    const ganho = ctx.createGain();
    envelope(ganho.gain, t, o.pico, o.ataque || 0.003, o.fim);
    if (o.passaBaixa) {
      const filtro = ctx.createBiquadFilter();
      filtro.type = 'lowpass';
      filtro.frequency.value = o.passaBaixa;
      osc.connect(filtro);
      filtro.connect(ganho);
    } else {
      osc.connect(ganho);
    }
    ganho.connect(destino);
    osc.start(t);
    osc.stop(t + o.fim + 0.02);
  }

  // Ruído filtrado com envelope. o = { freq, ate?, q?, pico, ataque?, fim }
  function chiado(destino, t, o) {
    const fonte = ctx.createBufferSource();
    fonte.buffer = ruido;
    fonte.loop = true;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.Q.value = o.q || 1;
    filtro.frequency.setValueAtTime(o.freq, t);
    if (o.ate) filtro.frequency.exponentialRampToValueAtTime(o.ate, t + o.fim);
    const ganho = ctx.createGain();
    envelope(ganho.gain, t, o.pico, o.ataque || 0.002, o.fim);
    fonte.connect(filtro);
    filtro.connect(ganho);
    ganho.connect(destino);
    // Cada clique lê um trecho diferente do ruído, para não soarem idênticos.
    fonte.start(t, Math.random());
    fonte.stop(t + o.fim + 0.02);
  }

  // Sino: parciais que somem mais depressa quanto mais agudas, como um carrilhão.
  function sino(destino, t, freq, pico, fim) {
    tom(destino, t, { freq, pico, ataque: 0.002, fim });
    tom(destino, t, { freq: freq * 2, pico: pico * 0.36, ataque: 0.002, fim: fim * 0.6 });
    tom(destino, t, { freq: freq * 3.01, pico: pico * 0.15, ataque: 0.002, fim: fim * 0.4 });
    tom(destino, t, { freq: freq * 4.2, pico: pico * 0.07, ataque: 0.001, fim: fim * 0.25 });
  }

  // ---------- Os sons do jogo ----------

  const SONS = {
    // Catraca do parafuso girando: 4 cliques secos, cada um mais agudo, em 110 ms.
    tirar(d, t) {
      for (let i = 0; i < 4; i++) {
        chiado(d, t + i * 0.034, { freq: 1500 * Math.pow(1.24, i), q: 5, pico: 1.1 + i * 0.12, ataque: 0.0015, fim: 0.03 });
      }
    },

    // Plim do parafuso no furo da caixinha; opcoes.furo (0, 1, 2) escolhe a nota.
    pouso(d, t, op) {
      const furo = Math.max(0, Math.min(2, Math.round(op.furo) || 0));
      const f = NOTAS_POUSO[furo];
      tom(d, t, { freq: f * 1.025, ate: f, glide: 0.025, pico: 0.36, ataque: 0.003, fim: 0.32 });
      tom(d, t, { tipo: 'triangle', freq: f / 2, pico: 0.15, ataque: 0.002, fim: 0.1 });
    },

    // Toque de madeira: o parafuso foi para a bandeja.
    bandeja(d, t) {
      tom(d, t, { tipo: 'triangle', freq: 420, ate: 360, pico: 0.42, ataque: 0.002, fim: 0.07, passaBaixa: 1600 });
      chiado(d, t, { freq: 1800, q: 1.4, pico: 0.24, ataque: 0.001, fim: 0.02 });
    },

    // Caixa completa: sino em sol e logo depois em dó.
    completa(d, t) {
      sino(d, t, 783.99, 0.34, 0.42);
      sino(d, t + 0.075, 1046.5, 0.31, 0.375);
    },

    // Placa caindo: vento descendo (900 → 250 Hz) e um baque grave e macio.
    cai(d, t) {
      chiado(d, t, { freq: 900, ate: 250, q: 1.2, pico: 0.8, ataque: 0.07, fim: 0.3 });
      tom(d, t + 0.02, { freq: 90, ate: 58, pico: 0.5, ataque: 0.005, fim: 0.16 });
    },

    // Parafuso preso: zumbido grave duplo, baixinho.
    bloqueado(d, t) {
      for (let i = 0; i < 2; i++) {
        tom(d, t + i * 0.085, { tipo: 'square', freq: 140, ate: 110, pico: 0.13, ataque: 0.006, fim: 0.06, passaBaixa: 900 });
      }
    },

    // Vitória: arpejo dó–mi–sol–dó e um brilhinho agudo.
    vitoria(d, t) {
      const notas = [523.25, 659.25, 783.99, 1046.5];
      for (let i = 0; i < notas.length; i++) {
        const ultima = i === notas.length - 1;
        tom(d, t + i * 0.1, { freq: notas[i], pico: 0.34, ataque: 0.004, fim: ultima ? 0.9 : 0.34 });
        tom(d, t + i * 0.1, { tipo: 'triangle', freq: notas[i], pico: 0.1, ataque: 0.003, fim: ultima ? 0.4 : 0.15 });
      }
      const brilho = [2093, 2637, 3136, 2349, 3520, 4186];
      for (let i = 0; i < brilho.length; i++) {
        tom(d, t + 0.38 + i * 0.055, { freq: brilho[i], pico: 0.09 - i * 0.01, ataque: 0.002, fim: 0.14 });
      }
    },

    // Clique curtinho de botão.
    botao(d, t) {
      tom(d, t, { freq: 1700, ate: 1100, pico: 0.12, ataque: 0.001, fim: 0.035 });
      chiado(d, t, { freq: 4200, q: 2, pico: 0.2, ataque: 0.0008, fim: 0.012 });
    },

    // Bolha subindo: ganhou o espaço extra.
    extra(d, t) {
      tom(d, t, { freq: 280, ate: 900, glide: 0.16, pico: 0.4, ataque: 0.012, fim: 0.24 });
      tom(d, t, { tipo: 'triangle', freq: 560, ate: 1800, glide: 0.16, pico: 0.07, ataque: 0.012, fim: 0.18 });
      tom(d, t + 0.15, { freq: 1568, pico: 0.12, ataque: 0.003, fim: 0.22 });
    },
  };

  P.Sons = {
    // nome: tirar | pouso | bandeja | completa | cai | bloqueado | vitoria | botao | extra.
    // opcoes: { furo } para pouso; { volume } (0..1) para qualquer som. Devolve true se tocou.
    tocar(nome, opcoes) {
      const som = SONS[nome];
      if (!som || !ativo || suspenso || !ctx || ctx.state === 'closed') return false;
      const op = opcoes || {};
      let destino = entrada;
      if (typeof op.volume === 'number' && op.volume !== 1) {
        destino = ctx.createGain();
        destino.gain.value = Math.max(0, Math.min(1, op.volume));
        destino.connect(entrada);
      }
      // Uma folguinha de 5 ms para o envelope começar sempre do zero (sem estalo).
      som(destino, ctx.currentTime + 0.005, op);
      return true;
    },

    definirAtivo(sim) {
      ativo = !!sim;
      if (ativo) desbloquear(); // o toque no interruptor já vale como gesto
      if (!ctx) return; // sem gesto ainda: o contexto nasce no primeiro toque
      geral.gain.setTargetAtTime(ativo ? VOLUME_GERAL : 0, ctx.currentTime, 0.02);
      if (!ativo) setTimeout(suspenderSeMudo, 250);
    },

    desbloquear,

    suspender() {
      suspenso = true;
      if (ctx && ctx.state === 'running') ctx.suspend().catch(ignorar);
    },

    retomar() {
      suspenso = false;
      if (ativo && ctx && ctx.state === 'suspended') ctx.resume().catch(ignorar);
    },
  };

  // Rede de segurança: o primeiro gesto libera o áudio mesmo que ninguém chame desbloquear().
  // No toque, o navegador só considera gesto o pointerup/touchend, por isso ouvimos os dois.
  const GESTOS = ['pointerdown', 'pointerup', 'touchend', 'keydown'];
  function aoGesto() {
    desbloquear();
    if (ctx && ctx.state === 'running') {
      for (const g of GESTOS) globalThis.removeEventListener(g, aoGesto, true);
    }
  }
  if (globalThis.addEventListener) {
    for (const g of GESTOS) globalThis.addEventListener(g, aoGesto, { capture: true, passive: true });
  }
})(globalThis.Parafusinhos = globalThis.Parafusinhos || {});
