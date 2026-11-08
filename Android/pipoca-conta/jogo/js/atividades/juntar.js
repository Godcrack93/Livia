/* Pipoca Aprende — atividade "juntar" (PROJETO.md 5.2): compor N juntando duas torres prontas (soma).
   Torres prontas no chão (2 a 4), cada uma com cor + estampa sorteadas (PC.cores.sortearTorres) e a plaquinha presa
   na base; a placa do alvo fica à direita. A criança junta duas torres arrastando uma sobre a outra OU tocando numa
   (ela sobe e fica iluminada) e depois na outra. A área de toque de cada torre é a coluna inteira, com folga.
   Ao juntar, as partes mantêm cor e estampa, a lousinha mostra a conta ("3 + 2 = 5") e a Pipoca fala
   "Três mais dois... cinco!" (a plaquinha da torre juntada só reaparece junto com o total). Deu N: "Três e dois fazem
   cinco!" (no alvo 10: "Três e sete são amigos do dez!" e um quadro de 10 em duas cores) e a rodada acaba. Não deu:
   retorno descritivo pela moldura (ctx.errou) e, 1,2 s depois, as torres se separam e voltam ao lugar.
   Ajudas: 2º erro → "contar a partir do maior" com lugares vazios em cima da maior torre do par certo; 3º erro e
   inatividade → mãozinha com proximoGesto(). Se a moldura pedir ajuda enquanto as torres ainda se separam (voz curta
   ou muda) ou com o "Quer parar?" aberto, ela fica guardada e roda quando der; o "Quer parar?" também interrompe a
   ajuda em andamento (ela recomeça quando a criança continua). Demonstração (demo): a mãozinha leva uma cópia
   clarinha da torre menor do par até em cima da maior (uma passada; tocar numa torre encerra; o relógio de
   inatividade da moldura só volta a correr quando ela acaba).
   Testes no navegador: PC.debug.telaOcupada avisa o {"esperar": "ocioso"} enquanto há junção, separação, ajuda ou
   demonstração.
   Gerador: sempre existe um par que dá N; toda torre tem menos de N; as que sobram têm valores próximos dos certos,
   diferentes entre si, e não formam outro par que dê N (com alvo pequeno e muitas torres, repete um valor antes de
   aceitar outro par); com 2 torres, as duas dão N (tutorial).
   params: { alvoMin, alvoMax (até 10), torres: 2|3|4, rodadas, demo, pontos (pontinhos na placa do alvo; padrão true) } */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  const LADO = 64;                 // lado do cubinho (o mesmo do PC.Torre)
  const ERGUER = 22;               // quanto a torre escolhida (toque) sobe
  const COLUNA_TOPO = 150;         // a área de toque de cada torre vai de logo abaixo do HUD...
  const COLUNA_BASE = 890;         // ...até embaixo da plaquinha da base
  const DIREITA_X = 1385;          // coluna da direita: placa do alvo, lousinha e quadro de 10 (folga da borda no 4:3)
  const PLACA_Y = 285, LOUSA_Y = 505, QUADRO_Y = 695;
  const LIMITE_TORRES = 1196;      // nenhuma torre (nem a de dezena + unidades) passa daqui para a direita
  const MEIA_DUPLA = 42;           // com mais de 10 cubinhos, cada pilha fica 42 px ao lado do centro da base
  // centros das torres: a da esquerda fica fora do balão da Pipoca (x < 580) e a da direita antes da lousinha
  const POSICOES = { 2: [700, 1000], 3: [630, 870, 1110], 4: [616, 790, 964, 1138] };
  const LARGURAS = { 2: 220, 3: 200, 4: 172 };          // largura da coluna de toque (sempre ≥ 140)
  const memorias = new WeakMap();  // por estação jogada: o objeto params é o mesmo em todas as rodadas dela

  const CSS = `
    .pc-juntar { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
    .pc-juntar-coluna { position: absolute; z-index: 2; border-radius: 48px; cursor: pointer; }
    .pc-juntar-torre { pointer-events: none; }
    .pc-juntar-torre.pc-juntar-erguida { transform: translateY(-${ERGUER}px); transition: transform .16s ease-out; }
    .pc-juntar-luz { position: absolute; z-index: -1; border-radius: 28px; opacity: 0; pointer-events: none;
      background: rgba(255, 255, 255, .75); border: 7px solid #FFC93C; box-shadow: 0 0 0 4px #3A2A5A; transition: opacity .15s; }
    .pc-juntar-sel > .pc-juntar-luz { opacity: 1; animation: pcJuntarBrilho 1.1s ease-in-out infinite; }
    .pc-juntar-ima > .pc-juntar-luz { opacity: 1; animation: none; background: rgba(255, 214, 80, .75); border-color: #fff; }
    .pc-juntar-ajuda > .pc-juntar-luz { opacity: 1; animation: none; background: rgba(255, 255, 255, .6); border-color: #2EC4B6; }
    @keyframes pcJuntarBrilho { 50% { opacity: .6; } }
    .pc-juntar .torre.pc-juntar-voando { z-index: 25; }
    .pc-juntar .torre.pc-juntar-demo { z-index: 24; opacity: 0; pointer-events: none; }
    .pc-juntar-voando .torre-placa, .pc-juntar-somando .torre-placa { visibility: hidden; }
    .pc-juntar-pos { position: absolute; width: 0; height: 0; pointer-events: none; }
    .pc-juntar-placa { z-index: 3; }
    .pc-juntar-placa .placa-numero { left: 0; top: 0; transform: translate(-50%, -50%); }
    .pc-juntar-lousa-pos, .pc-juntar-quadro-pos { z-index: 6; }
    .pc-juntar-lousa { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 14px;
      padding: 12px 28px 26px; white-space: nowrap; background: #2F5D50; border: 10px solid #B98546; border-radius: 26px;
      box-shadow: 0 0 0 4px #3A2A5A, 0 10px 0 4px rgba(58, 42, 90, .22); color: #F4F1E8; font: 700 72px/1 var(--fonte); }
    .pc-juntar-parcela { position: relative; }
    .pc-juntar-giz { position: absolute; left: -6px; right: -6px; bottom: -16px; height: 14px; border-radius: 8px; border: 3px solid rgba(20, 40, 34, .55); }
    .pc-juntar-sinal { color: #CFE3D8; }
    .pc-juntar-total { display: inline-block; min-width: 64px; text-align: center; }
    .pc-juntar-total.vazio { height: 72px; border: 5px dashed rgba(244, 241, 232, .75); border-radius: 14px; }
    .pc-juntar-total.certo { color: #FFE27A; }
    .pc-juntar-quadro { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); display: grid; grid-template-columns: repeat(5, 58px);
      gap: 8px; padding: 14px; background: #FFF8EC; border: 5px solid #3A2A5A; border-radius: 24px; box-shadow: 0 8px 0 rgba(58, 42, 90, .22); }
    .pc-juntar-casa { width: 58px; height: 58px; border-radius: 12px; border: 4px solid #3A2A5A; background: #fff; display: grid; place-items: center; }
    .pc-juntar-ficha { display: block; width: 40px; height: 40px; border-radius: 50%; border: 4px solid #3A2A5A; }
    .pc-juntar-fantasma { position: absolute; width: 64px; height: 64px; border-radius: 12px; border: 5px dashed rgba(58, 42, 90, .8); z-index: 6;
      background: rgba(255, 255, 255, .3); pointer-events: none; }
    .pc-juntar-fantasma.acesa { background: #fff; border-color: #3A2A5A; box-shadow: 0 0 0 6px rgba(255, 255, 255, .6); }
  `;

  // ---------------------------------------------------------------- utilidades
  const inteiro = (v, padrao) => { const n = Math.round(Number(v)); return isFinite(n) ? n : padrao; };
  const faixa = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const ext = n => PC.voz.extenso(n);
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);

  function claro(cor) {
    const m = /^#?([0-9a-f]{6})$/i.exec(cor || '');
    if (!m) return false;
    const n = parseInt(m[1], 16);
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 160;
  }

  /** Fundo CSS com a mesma pintura da torre ('#cor' ou '#cor|estampa'): para a fichinha do quadro de 10 e o risco de giz. */
  function fundoDe(pintura) {
    const [cor, estampa] = String(pintura).split('|');
    const tinta = claro(cor) ? 'rgba(58, 42, 90, .36)' : 'rgba(255, 255, 255, .62)';
    if (estampa === 'listras') return `repeating-linear-gradient(135deg, ${tinta} 0 6px, transparent 6px 13px), ${cor}`;
    if (estampa === 'bolinhas') return `radial-gradient(circle, ${tinta} 3.5px, transparent 4.5px) 0 0 / 13px 13px, ${cor}`;
    if (estampa === 'xadrez') return `conic-gradient(${tinta} 25%, transparent 0 50%, ${tinta} 0 75%, transparent 0) 0 0 / 14px 14px, ${cor}`;
    return cor;
  }

  // ---------------------------------------------------------------- gerador
  function memoriaDe(params) {
    let m = memorias.get(params);
    if (!m) { m = { alvo: null, pares: [] }; memorias.set(params, m); }
    return m;
  }

  /**
   * Completa o par certo até k torres. Nível 2: cada torre a mais tem valor próximo de um dos certos (até 2 de
   * distância), diferente das outras, e não forma com nenhuma outra um par que dê n (um único par certo).
   * Nível 1: o mesmo, mas pode repetir valor (alvos pequenos com muitas torres). Nível 0: qualquer valor menor que n.
   */
  function completar(par, n, k, nivel) {
    const vals = par.slice();
    while (vals.length < k) {
      const cands = [];
      for (let d = 1; d < n; d++) {
        if (nivel >= 2 && vals.indexOf(d) >= 0) continue;
        if (nivel >= 1) {
          if (vals.some(x => x + d === n)) continue;
          if (!par.some(p => Math.abs(p - d) <= 2)) continue;
        }
        cands.push(d);
      }
      if (!cands.length) return null;
      vals.push(U.escolher(cands));
    }
    return vals;
  }

  /** Sorteia o alvo e as torres de uma rodada, sem repetir o alvo nem o par da rodada anterior quando der. */
  function sortearRodada(params, mem) {
    const min = U.limitar(inteiro(params.alvoMin, 3), 2, 10);
    const max = U.limitar(inteiro(params.alvoMax, min), min, 10);
    const k = U.limitar(inteiro(params.torres, 2), 2, 4);
    let alvos = faixa(min, max);
    if (alvos.length > 1) alvos = alvos.filter(n => n !== mem.alvo);
    const n = U.escolher(alvos);
    mem.alvo = n;
    const todos = faixa(1, Math.floor(n / 2)).map(a => [a, n - a]);
    let livres = todos.filter(p => mem.pares.indexOf(n + ':' + p[0]) < 0);
    if (!livres.length) { mem.pares = mem.pares.filter(s => s.split(':')[0] !== String(n)); livres = todos; }
    let escolha = null;
    for (const nivel of [2, 1, 0]) {
      for (const p of U.embaralhar(livres)) {
        const vals = completar(p, n, k, nivel);
        if (vals) { escolha = { par: p, vals }; break; }
      }
      if (escolha) break;
    }
    mem.pares.push(n + ':' + escolha.par[0]);
    // posições sorteadas; guarda onde ficou o par certo
    const ordem = U.embaralhar(faixa(0, k - 1));
    return { n, k, valores: ordem.map(i => escolha.vals[i]), par: [ordem.indexOf(0), ordem.indexOf(1)] };
  }

  // ---------------------------------------------------------------- a rodada
  function rodada(ctx) {
    U.estilo('juntar', CSS);
    const CHAO = PC.layout.chao;
    const params = ctx.params || {};
    const { n: N, k, valores, par } = sortearRodada(params, memoriaDe(params));
    const pinturas = U.embaralhar(PC.cores.sortearTorres(k));
    const xs = POSICOES[k], largura = LARGURAS[k];

    let destruido = false, resolvida = false, juntando = false, ajudando = false, interagiu = false;
    let sel = null, ima = null, ajudaAC = null, fantasmas = [], lousa = null, demoAC = null;
    // ajuda que ficou para depois: pedida enquanto as torres ainda se separavam (com voz curta ou muda o retorno acaba
    // antes) ou interrompida pelo "Quer parar?". 2 = ajuda que ensina, 3 = mãozinha. Roda quando der.
    let ajudaAdiada = 0;
    // muda quando resolver() refaz a cena no meio de uma junção: a junção antiga para onde estiver
    let geracao = 0;
    const desligares = [];

    const camada = U.el('div', { class: 'pc-juntar' });
    ctx.palco.appendChild(camada);

    const podeAgir = () => !destruido && !resolvida && !juntando && !ctx.sinal.aborted;

    // ------------------------------------------------------------ torres
    /** Cria (ou recria) o desenho da torre de um registro. A luz de destaque fica dentro da torre, atrás dos cubinhos. */
    function criarTorre(reg, x, y, cores) {
      const t = new PC.Torre({ x, y, cores });
      t.el.classList.add('pc-juntar-torre');
      reg.luz = U.el('div', { class: 'pc-juntar-luz' });
      t.el.insertBefore(reg.luz, t.el.firstChild);
      camada.appendChild(t.el);
      reg.t = t;
      ajustarLuz(reg);
      return t;
    }
    function ajustarLuz(reg) {
      const t = reg.t;
      if (!t || !reg.luz) return;
      const r = t.retangulo(), folga = 16;
      Object.assign(reg.luz.style, {
        left: (r.x - t.x - folga) + 'px', top: (r.y - t.y - folga - 14) + 'px',
        width: (r.l + 2 * folga) + 'px', height: (t.y - r.y + folga + 14 + 92) + 'px',
      });
    }
    /** Centro (virtual) da parte desenhada da torre, na posição de casa. */
    const centroTorre = reg => ({ x: reg.casa.x, y: reg.casa.y - Math.max(1, reg.valor) * LADO / 2 });

    /** Leva a torre de "de" até "para" (base) num arco; anima só transform. Devolve Promise (nunca rejeita). */
    function voar(t, de, para, { ms = 420, arco = null, easing = 'ease-in-out' } = {}) {
      t.el.getAnimations().forEach(a => a.cancel());
      t.mover(para.x, para.y);
      t.el.style.transform = '';
      const dx = de.x - para.x, dy = de.y - para.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return Promise.resolve();
      const h = arco != null ? arco : Math.min(110, 30 + Math.abs(dx) * 0.18);
      const quadros = [];
      for (let i = 0; i <= 8; i++) {
        const s = i / 8;
        quadros.push({ transform: `translate(${(dx * (1 - s)).toFixed(1)}px, ${(dy * (1 - s) - h * 4 * s * (1 - s)).toFixed(1)}px)` });
      }
      return U.animar(t.el, quadros, { duration: ms, easing });
    }
    /** Desliza a torre na horizontal até x (só transform). */
    function deslizar(t, x) {
      const de = t.x;
      t.mover(x, t.y);
      return U.animar(t.el, [{ transform: `translateX(${de - x}px)` }, { transform: 'translateX(0px)' }], { duration: 260, easing: 'ease-out' });
    }

    const regs = valores.map((valor, i) => {
      const reg = { i, valor, pintura: pinturas[i], casa: { x: xs[i], y: CHAO }, t: null, luz: null, arr: null, coluna: null };
      reg.coluna = U.el('div', {
        class: 'pc-juntar-coluna', teste: 'torre-' + i, role: 'button',
        'aria-label': 'Torre de ' + PC.voz.quantidade(valor, 'cubinho', 'cubinhos'),
        style: { left: (reg.casa.x - largura / 2) + 'px', top: COLUNA_TOPO + 'px', width: largura + 'px', height: (COLUNA_BASE - COLUNA_TOPO) + 'px' },
      });
      camada.appendChild(reg.coluna);
      criarTorre(reg, reg.casa.x, reg.casa.y, Array(valor).fill(reg.pintura));
      desligares.push(PC.arrastar(reg.coluna, {
        podeComecar: () => podeAgir() && !!reg.t,
        aoTocar: () => tocar(reg),
        aoComecar: () => comecarArraste(reg),
        aoMover: p => moverArraste(reg, p),
        aoSoltar: p => soltarArraste(reg, p),
        aoCancelar: () => cancelarArraste(reg),
      }));
      return reg;
    });

    // placa do alvo (algarismo e pontinhos)
    const placaPos = U.el('div', { class: 'pc-juntar-pos pc-juntar-placa', style: { left: DIREITA_X + 'px', top: PLACA_Y + 'px' } },
      PC.ui.placaNumero(N, { pontos: params.pontos !== false }));
    camada.appendChild(placaPos);
    const pulsarPlaca = () => U.animar(placaPos, [{ transform: 'scale(1)' }, { transform: 'scale(1.14)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 560, easing: 'ease-out' });

    // entrada: as torres sobem do chão, a placa aparece
    regs.forEach((reg, i) => U.animar(reg.t.el, [{ transform: 'translateY(70px)', opacity: 0 }, { transform: 'translateY(0px)', opacity: 1 }],
      { duration: 380, delay: 60 + i * 90, easing: 'cubic-bezier(.3, 1.4, .5, 1)', fill: 'backwards' }));
    U.animar(placaPos, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 420, delay: 160, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' });

    // ------------------------------------------------------------ destaque, ímã e ajuda visual
    function selecionar(reg) { sel = reg; reg.t.el.classList.add('pc-juntar-sel', 'pc-juntar-erguida'); }
    function desselecionar() {
      if (sel && sel.t) sel.t.el.classList.remove('pc-juntar-sel', 'pc-juntar-erguida');
      sel = null;
    }
    function marcarIma(reg) {
      if (ima === reg) return;
      if (ima && ima.t) ima.t.el.classList.remove('pc-juntar-ima');
      ima = reg;
      if (ima && ima.t) ima.t.el.classList.add('pc-juntar-ima');
    }
    function removerFantasmas() { fantasmas.forEach(f => f.remove()); fantasmas = []; }
    function mostrarFantasmas(reg, qtd) {
      removerFantasmas();
      for (let i = 0; i < qtd; i++) {
        const f = U.el('div', { class: 'pc-juntar-fantasma', style: { left: (reg.casa.x - LADO / 2) + 'px', top: (reg.casa.y - (reg.valor + i + 1) * LADO) + 'px' } });
        camada.appendChild(f);
        fantasmas.push(f);
        U.animar(f, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 220, delay: i * 60, fill: 'backwards' });
      }
    }
    // qualquer toque da criança encerra a demonstração e a ajuda e apaga os lugares vazios
    const offToque = PC.on('toque', () => {
      interagiu = true;
      pararDemo();
      if (ajudaAC) ajudaAC.abort();
      removerFantasmas();
    });
    // "Quer parar?": a ajuda que está rodando para na hora (a contagem não fala por cima da pergunta) e volta quando
    // a criança continuar; enquanto ela roda, a instrução repetida pela moldura não fala por cima dela.
    const offPausa = PC.on('atividade:pausa', () => {
      if (destruido) return;
      if (ajudaAC && !ajudaAC.signal.aborted) { ajudaAdiada = Math.max(ajudaAdiada, 2); ajudaAC.abort(); }
      pararDemo();
      removerFantasmas();
    });
    const offContinua = PC.on('atividade:continua', () => { if (!destruido && !juntando) rodarAjudaAdiada(); });

    // ------------------------------------------------------------ lousinha e quadro de 10
    function mostrarLousa(a, b, pA, pB) {
      esconderLousa(true);
      const parcela = (v, p) => U.el('span', { class: 'pc-juntar-parcela' }, String(v), U.el('i', { class: 'pc-juntar-giz', style: { background: fundoDe(p) } }));
      const total = U.el('span', { class: 'pc-juntar-total vazio' });
      const quadroL = U.el('div', { class: 'pc-juntar-lousa', 'aria-hidden': 'true' },
        parcela(a, pA), U.el('span', { class: 'pc-juntar-sinal', text: '+' }), parcela(b, pB), U.el('span', { class: 'pc-juntar-sinal', text: '=' }), total);
      const pos = U.el('div', { class: 'pc-juntar-pos pc-juntar-lousa-pos', style: { left: DIREITA_X + 'px', top: LOUSA_Y + 'px' } }, quadroL);
      camada.appendChild(pos);
      U.animar(pos, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.3, 1.5, .5, 1)' });
      lousa = { pos, total };
    }
    /** Mostra o total na lousinha e, ao mesmo tempo, a plaquinha da torre juntada (escondida enquanto a voz soma). */
    function revelarTotal(s, certo, reg) {
      if (reg && reg.t) {
        reg.t.el.classList.remove('pc-juntar-somando');
        const placa = reg.t.el.querySelector('.torre-placa');
        if (placa) { placa.classList.remove('pulsa'); void placa.offsetWidth; placa.classList.add('pulsa'); }
      }
      if (!lousa) return;
      lousa.total.textContent = String(s);
      lousa.total.classList.remove('vazio');
      lousa.total.classList.toggle('certo', !!certo);
      U.animar(lousa.total, [{ transform: 'scale(.3)' }, { transform: 'scale(1.25)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 380 });
    }
    function esconderLousa(agora) {
      const l = lousa;
      lousa = null;
      if (!l) return Promise.resolve();
      if (agora) { l.pos.remove(); return Promise.resolve(); }
      return U.animar(l.pos, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.8)' }], { duration: 220, fill: 'forwards' }).then(() => l.pos.remove());
    }
    /** Quadro de 10 com fichinhas de duas pinturas (as das duas torres): a do primeiro, b do segundo. */
    function mostrarQuadro(a, b, pA, pB, instantaneo) {
      const grade = U.el('div', { class: 'pc-juntar-quadro', 'aria-hidden': 'true' });
      const fichas = [];
      for (let i = 0; i < 10; i++) {
        const f = U.el('i', { class: 'pc-juntar-ficha', style: { background: fundoDe(i < a ? pA : pB) } });
        if (i >= a + b) f.style.visibility = 'hidden';
        grade.appendChild(U.el('div', { class: 'pc-juntar-casa' }, f));
        fichas.push(f);
      }
      camada.appendChild(U.el('div', { class: 'pc-juntar-pos pc-juntar-quadro-pos', style: { left: DIREITA_X + 'px', top: QUADRO_Y + 'px' } }, grade));
      if (instantaneo) return;
      U.animar(grade, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      fichas.forEach((f, i) => U.animar(f, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }],
        { duration: 260, delay: 80 + i * 70, easing: 'cubic-bezier(.3, 1.6, .5, 1)', fill: 'backwards' }));
    }

    // ------------------------------------------------------------ toque e arraste
    function tocar(reg) {
      if (!podeAgir() || !reg.t) return;
      if (sel === reg) { desselecionar(); PC.som.soltar(); return; }
      if (sel) {
        const b = sel, de = { x: b.casa.x, y: b.casa.y - ERGUER };
        desselecionar();
        juntar(b, reg, de);
        return;
      }
      selecionar(reg);
      PC.som.pegar();
    }

    /** A torre mais perto (na horizontal) de onde a arrastada está, se não for ela mesma e estiver perto ("ímã"). */
    function alvoDoArraste(reg, dx) {
      const x = reg.casa.x + dx;
      let melhor = null, dist = Infinity;
      for (const r of regs) { const d = Math.abs(r.casa.x - x); if (d < dist) { dist = d; melhor = r; } }
      if (!melhor || melhor === reg || !melhor.t || dist > 150) return null;
      return melhor;
    }
    function comecarArraste(reg) {
      if (!podeAgir() || !reg.t) return;
      desselecionar();
      reg.t.el.getAnimations().forEach(a => a.cancel());
      reg.arr = { dx: 0, dy: 0 };
      reg.t.el.classList.add('arrastando');
      reg.t.el.style.willChange = 'transform';
      PC.som.pegar();
    }
    function moverArraste(reg, p) {
      if (!reg.arr || !reg.t) return;
      reg.arr.dx = p.dx; reg.arr.dy = p.dy;
      reg.t.el.style.transform = `translate(${p.dx}px, ${p.dy}px)`;
      marcarIma(alvoDoArraste(reg, p.dx));
    }
    function encerrarArraste(reg) {
      reg.arr = null;
      marcarIma(null);
      if (reg.t) { reg.t.el.classList.remove('arrastando'); reg.t.el.style.willChange = ''; }
    }
    function soltarArraste(reg, p) {
      if (!reg.arr || !reg.t) return;
      const de = { x: reg.casa.x + p.dx, y: reg.casa.y + p.dy };
      const alvo = alvoDoArraste(reg, p.dx);
      encerrarArraste(reg);
      if (alvo && podeAgir()) { juntar(reg, alvo, de); return; }
      // soltou longe de outra torre: volta para o lugar, sem contar como erro
      if (podeAgir()) PC.som.soltar();
      voar(reg.t, de, reg.casa, { ms: 300, arco: 0, easing: 'ease-out' });
    }
    function cancelarArraste(reg) {
      if (!reg.arr || !reg.t) return;
      const de = { x: reg.casa.x + reg.arr.dx, y: reg.casa.y + reg.arr.dy };
      encerrarArraste(reg);
      if (destruido) return;
      if (resolvida || ctx.sinal.aborted) { reg.t.el.style.transform = ''; return; }
      voar(reg.t, de, reg.casa, { ms: 300, arco: 0, easing: 'ease-out' });
    }

    // ------------------------------------------------------------ juntar, conferir e separar
    /** Põe a torre de regB em cima da de regA ("de" = onde regB está agora), mostra a conta e confere. */
    async function juntar(regB, regA, de) {
      if (!podeAgir() || !regA.t || !regB.t || regA === regB) return;
      juntando = true;
      ctx.ocupado(true);
      pararDemo();
      desselecionar(); marcarIma(null); removerFantasmas();
      if (ajudaAC) ajudaAC.abort();
      const a = regA.valor, b = regB.valor, s = a + b, certo = s === N;
      const minha = geracao;
      // a rodada acabou ou resolver() refez a cena: esta junção para onde estiver
      const parou = () => destruido || ctx.sinal.aborted || minha !== geracao;
      let xFinal = regA.casa.x;
      try {
        regB.t.el.classList.add('pc-juntar-voando');
        if (s <= 10) {
          // uma pilha só: a de cima pousa exatamente no topo da de baixo
          await voar(regB.t, de, { x: regA.casa.x, y: regA.casa.y - a * LADO });
          if (parou()) return;
          regA.t.juntar(regB.t, { animar: false });
        } else {
          // mais de 10: dezena (com fitinha) à esquerda e unidades à direita; a pilha de baixo fica onde estava
          xFinal = Math.min(regA.casa.x + MEIA_DUPLA, LIMITE_TORRES - LADO - 10);
          const voos = [voar(regB.t, de, { x: xFinal + MEIA_DUPLA, y: regA.casa.y })];
          if (xFinal - MEIA_DUPLA !== regA.casa.x) voos.push(deslizar(regA.t, xFinal - MEIA_DUPLA));
          await Promise.all(voos);
          if (parou()) return;
          regA.t.mover(xFinal, regA.casa.y);
          regA.t.juntar(regB.t, { animar: true });
        }
        regB.t = null;
        PC.som.encaixar();
        ajustarLuz(regA);
        // a plaquinha da torre juntada só aparece junto com o total ("... cinco!"), para não adiantar a resposta
        regA.t.el.classList.add('pc-juntar-somando');
        mostrarLousa(a, b, regA.pintura, regB.pintura);
        await ctx.falar(`${maiuscula(ext(a))} mais ${ext(b)}...`);
        await ctx.esperar(0);                 // se o "Quer parar?" cortou a fala, o total só aparece depois dele
        if (parou()) return;
        revelarTotal(s, certo, regA);
        // 16 a 19 com estrutura (PROJETO.md 6.1): "Dez e mais sete... dezessete!" (a torre mostra dezena e unidades)
        await ctx.falar(maiuscula(s >= 16 && s <= 19 ? PC.voz.dezEMais(s) : ext(s)) + '!');
        if (parou()) return;
        if (certo) {
          resolvida = true;
          pulsarPlaca();
          if (N === 10) {
            mostrarQuadro(a, b, regA.pintura, regB.pintura);
            await ctx.falar(`${maiuscula(ext(a))} e ${ext(b)} são amigos do dez!`);
          } else {
            await ctx.falar(`${maiuscula(ext(a))} e ${ext(b)} fazem ${ext(N)}!`);
          }
          if (parou()) return;
          ctx.acertou();
          return;
        }
        // o retorno da moldura não espera o "Quer parar?": segura aqui até a criança continuar
        await ctx.esperar(0);
        if (parou()) return;
        const porUm = Math.abs(s - N) === 1;
        ctx.errou({ fala: (porUm ? 'Quase! ' : '') + `Deu ${ext(s)}. Precisamos de ${ext(N)}.`, quase: porUm, mostrar: N });
        await ctx.esperar(1200);
        if (parou()) return;
        await separar(regA, regB, xFinal);
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        if (minha === geracao) {
          if (regA.t) regA.t.el.classList.remove('pc-juntar-somando');
          if (!resolvida && !destruido && !ctx.sinal.aborted) {
            juntando = false;
            ctx.ocupado(false);
            rodarAjudaAdiada();
          }
        }
      }
    }

    /** Desfaz uma junção errada: a parte de cima pula fora e as duas torres voltam ao lugar. */
    async function separar(regA, regB, xFinal) {
      if (destruido || ctx.sinal.aborted || !regA.t) return;
      const a = regA.valor, b = regB.valor;
      esconderLousa();
      const coresB = regA.t.remover(b);
      let de;
      if (a + b <= 10) de = { x: regA.casa.x, y: regA.casa.y - a * LADO };
      else {
        de = { x: xFinal + MEIA_DUPLA, y: regA.casa.y };                  // onde estava a pilha das unidades
        const xDez = xFinal - MEIA_DUPLA;
        regA.t.mover(regA.casa.x, regA.casa.y);                            // volta a ser uma pilha só, no lugar
        if (xDez !== regA.casa.x) {
          U.animar(regA.t.el, [{ transform: `translateX(${xDez - regA.casa.x}px)` }, { transform: 'translateX(0px)' }], { duration: 300, easing: 'ease-out' });
        }
      }
      ajustarLuz(regA);
      criarTorre(regB, de.x, de.y, coresB);
      regB.t.el.classList.add('pc-juntar-voando');
      PC.som.separar();
      await voar(regB.t, de, regB.casa, { ms: 460 });
      if (regB.t) regB.t.el.classList.remove('pc-juntar-voando');
    }

    // ------------------------------------------------------------ instrução, demonstração e ajudas
    const textoInstrucao = k === 2 ? `Junte as torres para fazer ${ext(N)}!` : `Junte duas torres para fazer ${ext(N)}!`;
    function instrucao() {
      if (destruido || resolvida || juntando || ctx.sinal.aborted) return Promise.resolve();
      if (ajudaAC && !ajudaAC.signal.aborted) return Promise.resolve();   // a ajuda está falando: não fala por cima
      pulsarPlaca();
      return ctx.falar(textoInstrucao, { mostrar: N }).catch(() => {});
    }

    /** O gesto certo agora: tocar na parceira da torre escolhida (se ela for do par certo) ou arrastar a menor do par até a maior. */
    function proximoGesto() {
      if (!podeAgir()) return null;
      const p = regs[par[0]], q = regs[par[1]];
      if (!p.t || !q.t) return null;
      if (sel === p || sel === q) return { tipo: 'tocar', em: centroTorre(sel === p ? q : p) };
      const mover = p.valor <= q.valor ? p : q, base = mover === p ? q : p;
      // do meio da menor até onde fica o meio dela quando ela está encaixada em cima da maior
      return { tipo: 'arrastar', de: centroTorre(mover), para: { x: base.casa.x, y: base.casa.y - base.valor * LADO - mover.valor * LADO / 2 } };
    }

    /**
     * Demonstração (1ª rodada com demo): a mãozinha leva uma cópia clarinha da torre menor do par até em cima da
     * maior (uma vez, como manda o PROJETO.md 5). A cópia não tem plaquinha e some no fim; tocar numa torre encerra.
     */
    async function demonstrar() {
      const ac = new AbortController();
      demoAC = ac;
      let copia = null, mao = null;
      ctx.ocupado(true);                                // o relógio de inatividade não corre enquanto a Pipoca mostra
      try {
        for (let vez = 0; vez < 1; vez++) {           // PROJETO.md 5: a Pipoca demonstra UMA vez
          if (ac.signal.aborted || interagiu || !podeAgir() || sel || PC.arrastar.ativo()) return;
          const g = proximoGesto();
          if (!g || g.tipo !== 'arrastar') return;
          const p = regs[par[0]], q = regs[par[1]];
          const mover = p.valor <= q.valor ? p : q, meio = mover.valor * LADO / 2;   // o mesmo par de proximoGesto()
          copia = new PC.Torre({ x: 0, y: 0, cores: Array(mover.valor).fill(mover.pintura), placa: false });
          copia.el.classList.add('pc-juntar-demo');
          camada.appendChild(copia.el);
          mao = ctx.dica(g.de, g.para, { vezes: 1 });
          // os mesmos tempos e a mesma curva da mãozinha (PC.ui.dica): a cópia anda junto com ela
          const quadro = (pt, opacidade, offset) => ({ transform: `translate(${pt.x.toFixed(1)}px, ${(pt.y + meio).toFixed(1)}px)`, opacity: opacidade, offset });
          await Promise.race([
            U.animar(copia.el, [quadro(g.de, 0, 0), quadro(g.de, 0, 0.16), quadro(g.de, 0.8, 0.22), quadro(g.para, 0.8, 0.78),
              quadro(g.para, 0.8, 0.88), quadro(g.para, 0, 1)], { duration: 1900, easing: 'ease-in-out', fill: 'forwards' }),
            U.esperar(2600, ac.signal),
          ]);
          copia.destruir(); copia = null;
          await U.esperar(300, ac.signal);
        }
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        if (copia) copia.destruir();
        if (ac.signal.aborted && mao && mao.parar) mao.parar();
        if (demoAC === ac) demoAC = null;
        // se a criança já começou a juntar (ou a ajuda está falando), quem libera o relógio é a junção ou a ajuda
        if (!destruido && !ctx.sinal.aborted && !juntando && !ajudando) ctx.ocupado(false);
      }
    }
    function pararDemo() { if (demoAC) demoAC.abort(); }

    /** O "Quer parar?" da moldura está aberto? */
    const pausada = () => !!(ctx.pausada && ctx.pausada());
    /** Fala da ajuda: segura enquanto o "Quer parar?" estiver aberto e desiste se a ajuda foi interrompida. */
    async function falarNaAjuda(sinal, texto, opcoes) {
      await ctx.esperar(0);
      if (sinal.aborted) throw U.abortado();
      await ctx.falar(texto, opcoes);
      if (sinal.aborted) throw U.abortado();
    }

    /**
     * Ajuda que ensina (2º erro seguido): "contar a partir do maior". A maior torre do par certo acende,
     * "Esta torre tem três.", aparecem os lugares vazios em cima dela e a Pipoca conta "três, quatro, cinco",
     * acendendo cada lugar; "Faltam dois!". Quem acha a torre de dois é a criança.
     */
    async function ajudar(nivel) {
      if (nivel >= 3 || destruido || resolvida || ctx.sinal.aborted || ajudando) return;
      // as torres ainda estão se separando (o retorno falado acabou antes) ou o "Quer parar?" está aberto:
      // a ajuda roda assim que elas voltarem ao lugar ou a criança continuar
      if (juntando || pausada()) { ajudaAdiada = Math.max(ajudaAdiada, 2); return; }
      if (PC.arrastar.ativo()) return;                 // a criança já está levando uma torre: não atrapalha
      const p = regs[par[0]], q = regs[par[1]];
      const base = p.valor >= q.valor ? p : q, falta = N - base.valor;
      if (!base.t || falta < 1) return;
      const ac = new AbortController();
      const aoAbortar = () => ac.abort();
      ctx.sinal.addEventListener('abort', aoAbortar, { once: true });
      ajudaAC = ac; ajudando = true;
      ctx.ocupado(true);
      pararDemo();
      desselecionar();
      base.t.el.classList.add('pc-juntar-ajuda');
      PC.ui.pipoca.pose('aponta');
      try {
        await falarNaAjuda(ac.signal, 'Esta torre tem ' + ext(base.valor) + '.', { mostrar: base.valor });
        mostrarFantasmas(base, falta);
        await U.esperar(350, ac.signal);
        await PC.voz.contar(N, {
          de: base.valor, intervalo: 500, sinal: ac.signal,
          aCada: i => {
            if (i === 0) { if (base.t) U.animar(base.t.el, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 320); return; }
            const f = fantasmas[i - 1];
            if (f) { f.classList.add('acesa'); U.animar(f, [{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], 300); }
          },
        });
        await falarNaAjuda(ac.signal, (falta === 1 ? 'Falta ' : 'Faltam ') + ext(falta) + '!', { mostrar: falta });
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ctx.sinal.removeEventListener('abort', aoAbortar);
        if (ajudaAC === ac) ajudaAC = null;
        ajudando = false;
        if (base.t) base.t.el.classList.remove('pc-juntar-ajuda');
        if (!destruido && !ctx.sinal.aborted) { PC.ui.pipoca.pose('normal'); if (!juntando) ctx.ocupado(false); }
      }
    }

    /** Roda a ajuda que ficou para depois (separação ou "Quer parar?"): 2 = ajuda que ensina; 3 = mãozinha com o gesto certo. */
    function rodarAjudaAdiada() {
      if (ajudaAdiada && pausada()) return;            // continua guardada: roda quando a criança continuar
      const nivel = ajudaAdiada;
      ajudaAdiada = 0;
      if (!nivel || !podeAgir()) return;
      if (nivel >= 3) {
        const g = proximoGesto();
        if (g && g.tipo === 'arrastar') ctx.dica(g.de, g.para);
        else if (g && g.tipo === 'tocar') ctx.dica(g.em, null);
        return;
      }
      ajudar(nivel).catch(() => {});
    }
    // A moldura chama esta função quando proximoGesto() não tem gesto para a mãozinha (3º erro com as torres ainda
    // se separando): a mãozinha fica para quando elas voltarem ao lugar.
    if (ctx.quandoPrecisarDeDica) ctx.quandoPrecisarDeDica(() => { if (juntando && !resolvida) ajudaAdiada = 3; return null; });

    // testes no navegador: {"esperar": "ocioso"} também espera a junção, a separação, a ajuda e a demonstração
    // (PC.debug.telaOcupada; nunca existe dentro do app)
    let ocupadaDbg = null;
    if (!PC.modoApp && PC.debug) {
      ocupadaDbg = () => !destruido && !resolvida && !ctx.sinal.aborted && (juntando || ajudando || !!demoAC);
      PC.debug.telaOcupada = ocupadaDbg;
    }

    /** Testes: junta o par certo na hora e termina a rodada (um único ctx.acertou()). */
    function resolver() {
      if (destruido || resolvida) return;
      resolvida = true;
      if (ajudaAC) ajudaAC.abort();
      pararDemo();
      try {
        PC.arrastar.cancelarTodos();
        desselecionar(); marcarIma(null); removerFantasmas();
        if (juntando) {
          // no meio de uma junção: ela para onde estiver e as torres voltam inteiras para o lugar antes
          geracao++;
          juntando = false;
          esconderLousa(true);
          camada.querySelectorAll('.pc-juntar-quadro-pos').forEach(e => e.remove());
          regs.forEach(r => { if (r.t) r.t.destruir(); r.t = null; });
          regs.forEach(r => criarTorre(r, r.casa.x, r.casa.y, Array(r.valor).fill(r.pintura)));
        }
        const p = regs[par[0]], q = regs[par[1]];
        const base = p.valor >= q.valor ? p : q, topo = base === p ? q : p;
        if (base.t && topo.t) {
          base.t.juntar(topo.t, { animar: false });
          topo.t = null;
          ajustarLuz(base);
          mostrarLousa(base.valor, topo.valor, base.pintura, topo.pintura);
          revelarTotal(N, true);
          if (N === 10) mostrarQuadro(base.valor, topo.valor, base.pintura, topo.pintura, true);
        }
      } catch (e) { console.error(e); }
      ctx.acertou();
    }

    function estado() {
      const pares = [], erradas = [];
      for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) (valores[i] + valores[j] === N ? pares : erradas).push([i, j]);
      return {
        alvo: N, torres: k, valores: valores.slice(), alturas: regs.map(r => (r.t ? r.t.n : 0)),
        par: par.slice(), pares, erradas, selecionada: sel ? sel.i : -1,
        juntando, resolvida, ajudando, ajudaAdiada, fantasmas: fantasmas.length,
        lousa: lousa ? lousa.pos.textContent : '',
      };
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      if (ajudaAC) ajudaAC.abort();
      pararDemo();
      offToque(); offPausa(); offContinua();
      if (ocupadaDbg && PC.debug && PC.debug.telaOcupada === ocupadaDbg) PC.debug.telaOcupada = null;
      desligares.forEach(d => { try { d(); } catch (e) { console.error(e); } });
      camada.remove();
    }

    // início: instrução e, na primeira rodada com demo, a mãozinha mostra o gesto levando uma cópia da torre
    (async () => {
      try {
        await ctx.esperar(300);
        await instrucao();
        if (ctx.demo) await demonstrar();
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    })();

    return { instrucao, proximoGesto, ajudar, resolver, estado, destruir };
  }

  PC.atividades.registrar('juntar', {
    titulo: 'Juntar torres',
    icone: 'juntar',
    cenario: 'prado',
    totalRodadas: params => U.limitar(inteiro(params && params.rodadas, 3), 1, 10),
    rodada,
  });
})();
