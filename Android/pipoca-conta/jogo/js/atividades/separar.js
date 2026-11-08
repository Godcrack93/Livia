/* Pipoca Conta — atividade "separar" (PROJETO.md 5.3): retirar cubinhos até ficar N (subtração).
   Uma torre de T cubinhos (padrão de 5 em 5) fica na tabuinha e a placa do alvo N (0 ≤ N < T) à direita. A torre
   não tem plaquinha de número: quem conta é a criança (o padrão de 5 em 5 ajuda).
   Tirar: tocar na torre tira o cubinho de cima (ele pula para a pilhinha, na esteira ao lado) OU arrastar a alça
   grande ao lado da torre para baixo, até a altura certa, e soltar: os cubinhos de cima pulam todos de uma vez.
   Devolver: tocar na pilhinha devolve o último que saiu. Um movimento por vez: toques durante o pulo são ignorados.
   confirmar: false → acerta ao ficar com N; parou com mais → "Ficaram seis. Tire mais!" (não é erro); ficou com
   menos (só dá com a alça) → erro descritivo pela moldura. confirmar: true → botão Pronto (✓): a Pipoca conta o que
   ficou; mais que N → "Ficaram seis. Tire mais!"; menos → erro descritivo ("Ficaram dois. Precisamos de três.").
   Acerto: lousinha com a conta (7 − 3 = 4) e "Eram sete, tiramos três, ficaram quatro!".
   dezena: true (T de 11 a 19): a dezena (com fitinha) fica à esquerda e as unidades à direita. Rodadas alternadas:
   "tirar a dezena inteira" (N = T − 10: tocar na dezena, que sai inteira com t.separarDezena(); "Quatorze menos
   dez... ficaram quatro!") e "tirar só unidades" (N de 10 a T − 1). A dezena tirada volta inteira (tocar nela).
   demo (1ª rodada): a mãozinha toca na torre (ou na dezena) e uma cópia do cubinho (ou da dezena) pula para a
   pilhinha; a torre de verdade não muda. "Quer parar?": a contagem e a ajuda seguram e repetem o número cortado.
   data-teste: torre, dezena, alca, pilha, dezena-fora, pronto, placa.
   params: { totalMin, totalMax, rodadas, demo, confirmar, dezena } */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  const LADO = 64;                      // lado do cubinho (o mesmo do PC.Torre)
  const CHAO = 800;                     // base das torres (PC.layout.chao)
  const MEIA = 42;                      // de 11 a 19, cada pilha fica 42 px ao lado do centro da base (PC.Torre)
  const BX = 655;                       // centro da base da torre (a coluna fica fora do balão da Pipoca, que vai até x 570)
  const PX = 1110;                      // centro da esteira da pilhinha
  const AREA_TOPO = 150, AREA_BASE = 890;          // áreas de toque: colunas inteiras, de logo abaixo do HUD até o chão
  const ALTURA_AREA = AREA_BASE - AREA_TOPO;
  const PLACA = { x: 1440, y: 270 };               // placa do alvo
  const PRONTO = { x: 1450, y: 705, lado: 170 };   // botão Pronto (redondo, verde, ✓)
  const LOUSA = { x: 1400, y: 478 };               // lousinha da conta (aparece no acerto)
  const ALCA_L = 150;                              // área de toque da alça (quadrada)
  const PEGADOR = { dx: 23, l: 104, a: 96 };       // desenho da alça dentro da área de toque
  const memorias = new WeakMap();                  // por estação jogada: o objeto params é o mesmo em todas as rodadas

  const SVG_PEGADOR = `<svg viewBox="0 0 104 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="6" y="5" width="92" height="66" rx="24" fill="#FF9F43" stroke="#3A2A5A" stroke-width="5"/>
    <rect x="18" y="12" width="44" height="9" rx="4.5" fill="#FFD3A3"/>
    <path d="M30 31 H 74 M30 41 H 74 M30 51 H 74" stroke="#3A2A5A" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M38 77 L 52 93 L 66 77 Z" fill="#3A2A5A" stroke="#3A2A5A" stroke-width="3" stroke-linejoin="round"/>
  </svg>`;

  const CSS = `
    .pc-separar { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
    .pc-separar-area { position: absolute; z-index: 8; border-radius: 44px; cursor: pointer; }
    .pc-separar-alca-toque { position: absolute; z-index: 9; border-radius: 44px; cursor: grab; }
    .pc-separar-base { position: absolute; z-index: 1; height: 28px; border-radius: 14px; border: 4px solid #3A2A5A;
      box-shadow: 0 6px 0 rgba(58, 42, 90, .18); }
    .pc-separar-tabua { background: linear-gradient(180deg, #D7A766 0%, #B98546 60%, #9C6D38 100%); }
    .pc-separar-esteira { background: repeating-linear-gradient(90deg, #F7E2AE 0 16px, #E8C67F 16px 30px); }
    .pc-separar-trilho { position: absolute; z-index: 4; border-radius: 9px; background: rgba(255, 255, 255, .78);
      border: 4px solid rgba(58, 42, 90, .5); }
    .pc-separar-alca { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 7; pointer-events: none;
      transition: transform .22s ease-out; }
    .pc-separar-alca.pegando { transition: none; }
    .pc-separar-braco { position: absolute; border-radius: 6px; background: #FF9F43; border: 3px solid #3A2A5A; }
    .pc-separar-pegador { position: absolute; transform-origin: 50% 0; transition: transform .12s; }
    .pc-separar-pegador svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .pc-separar-alca.pegando .pc-separar-pegador { transform: scale(1.08); }
    .pc-separar-selecao { position: absolute; z-index: 6; border-radius: 16px; border: 5px dashed #E86A00;
      background: rgba(255, 255, 255, .42); pointer-events: none; }
    .pc-separar-oculto { visibility: hidden; }
    .pc-separar-apagado { opacity: .3; transition: opacity .2s; }
    .pc-separar-voa { z-index: 20; pointer-events: none; }
    .pc-separar .pc-separar-dezena-voa { z-index: 20; pointer-events: none; }
    .pc-separar-pos { position: absolute; width: 0; height: 0; pointer-events: none; }
    .pc-separar-placa { z-index: 3; }
    .pc-separar-placa .placa-numero { left: 0; top: 0; transform: translate(-50%, -50%); pointer-events: auto; cursor: pointer; }
    .pc-separar .pc-separar-pronto { position: absolute; z-index: 9; width: ${PRONTO.lado}px; height: ${PRONTO.lado}px;
      box-shadow: 0 10px 0 #3A2A5A; }
    .pc-separar .pc-separar-pronto svg { width: 112px; height: 112px; }
    .pc-separar .pc-separar-pronto.apertado { transform: translateY(8px); box-shadow: 0 2px 0 #3A2A5A; }
    .pc-separar-lousa-pos { z-index: 10; }
    .pc-separar-lousa { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); display: flex; align-items: center;
      gap: 12px; padding: 10px 26px 14px; white-space: nowrap; background: #2F5D50; border: 10px solid #B98546; border-radius: 26px;
      box-shadow: 0 0 0 4px #3A2A5A, 0 10px 0 4px rgba(58, 42, 90, .22); color: #F4F1E8; font: 700 66px/1 var(--fonte); }
    .pc-separar-sinal { color: #CFE3D8; }
    .pc-separar-resultado { color: #FFE27A; }
  `;

  // ---------------------------------------------------------------- utilidades
  const inteiro = (v, padrao) => { const n = Math.round(Number(v)); return isFinite(n) ? n : padrao; };
  const faixa = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const ext = n => PC.voz.extenso(n);
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);
  /** Cor do cubinho i no padrão de 5 em 5 (o mesmo do PC.Torre): 1–5 roxo, 6–10 dourado, e de novo de 11 a 20. */
  const corCinco = i => ((i % 10) < 5 ? PC.cores.cincoA : PC.cores.cincoB);
  /** "ficaram seis", "ficou um", "não ficou nenhum" (cubinho é masculino). */
  function ficaram(n) {
    if (n === 0) return 'não ficou nenhum';
    if (n === 1) return 'ficou um';
    return 'ficaram ' + ext(n);
  }
  /** O alvo, dito no fim da frase: "Precisamos de três." (no zero: "Tire todos!"). */
  const pedido = n => (n === 0 ? 'Tire todos!' : `Precisamos de ${ext(n)}.`);
  /** De 16 a 19, com estrutura: "dez e mais sete... dezessete" (PROJETO.md 6.1). */
  const totalFalado = n => (n >= 16 && n <= 19 ? PC.voz.dezEMais(n) : ext(n));

  // ---------------------------------------------------------------- gerador
  function memoriaDe(params) {
    let m = memorias.get(params);
    if (!m) { m = { usados: [], ultimoT: null, zero: false }; memorias.set(params, m); }
    return m;
  }

  /** Escolhe um par [T, N] sem repetir um par já usado e, se der, com um total diferente do da rodada anterior. */
  function escolherPar(cands, mem) {
    let c = cands.filter(p => mem.usados.indexOf(p[0] + ':' + p[1]) < 0);
    if (!c.length) c = cands;
    const outroTotal = c.filter(p => p[0] !== mem.ultimoT);
    if (outroTotal.length) c = outroTotal;
    const totais = c.map(p => p[0]).filter((t, i, a) => a.indexOf(t) === i);
    const t = U.escolher(totais);                         // cada total com a mesma chance; depois o alvo
    const par = U.escolher(c.filter(p => p[0] === t));
    mem.usados.push(par[0] + ':' + par[1]);
    mem.ultimoT = par[0];
    return par;
  }

  /**
   * Sorteia o total T, o alvo N e o tipo da rodada.
   * Sem dezena: T entre totalMin e totalMax (até 10), N de 1 a T − 1 (com torres de 6 ou mais, tira pelo menos 2);
   * uma vez por estação, fora da primeira rodada, pode sair N = 0 ("tire todos").
   * Com dezena: T de 11 a 19; rodadas pares tiram a dezena inteira (N = T − 10), ímpares tiram só unidades (N ≥ 10).
   */
  function sortearRodada(params, indice, mem) {
    if (params.dezena) {
      const min = U.limitar(inteiro(params.totalMin, 11), 11, 19);
      const max = U.limitar(inteiro(params.totalMax, 19), min, 19);
      const tipo = indice % 2 === 0 ? 'dezena' : 'unidades';
      let cands = [];
      faixa(min, max).forEach(t => {
        if (tipo === 'dezena') cands.push([t, t - 10]);
        else faixa(10, t - 1).forEach(n => cands.push([t, n]));
      });
      if (tipo === 'unidades') { const bons = cands.filter(p => p[0] - p[1] >= 2); if (bons.length) cands = bons; }
      const par = escolherPar(cands, mem);
      return { T: par[0], N: par[1], tipo };
    }
    const min = U.limitar(inteiro(params.totalMin, 3), 2, 10);
    const max = U.limitar(inteiro(params.totalMax, min), min, 10);
    if (indice > 0 && !mem.zero && U.aleatorio(1, 5) === 1) {
      mem.zero = true;
      let ts = faixa(min, max).filter(t => t !== mem.ultimoT);
      if (!ts.length) ts = faixa(min, max);
      const t = U.escolher(ts);
      mem.usados.push(t + ':0');
      mem.ultimoT = t;
      return { T: t, N: 0, tipo: 'simples' };
    }
    let cands = [];
    faixa(min, max).forEach(t => faixa(1, t - 1).forEach(n => cands.push([t, n])));
    const bons = cands.filter(p => p[0] < 6 || p[0] - p[1] >= 2);
    if (bons.length) cands = bons;
    const par = escolherPar(cands, mem);
    return { T: par[0], N: par[1], tipo: 'simples' };
  }

  // ---------------------------------------------------------------- a rodada
  function rodada(ctx) {
    U.estilo('separar', CSS);
    const params = ctx.params || {};
    const { T, N, tipo } = sortearRodada(params, ctx.indice, memoriaDe(params));
    const confirmar = !!params.confirmar;
    const dezenaModo = !!params.dezena;

    let destruido = false, resolvida = false, finalizado = false;
    let animando = false, verificando = false, ajudando = false, interagiu = false;
    let animacao = Promise.resolve();      // termina quando o movimento atual termina
    let blocoNaPilha = false;              // os 10 de baixo da pilhinha são a dezena que saiu inteira
    let corte = null;                      // arraste da alça em andamento: { col, k }
    let statusAC = null, ajudaAC = null, verifAC = null, demoAC = null, lousaEl = null;
    let pausas = 0;                        // quantas vezes o "Quer parar?" abriu (a contagem repete o número cortado)
    const voando = new Set();              // elementos em voo (o resolver e o destruir limpam)
    const desligares = [];

    const camada = U.el('div', { class: 'pc-separar' });
    ctx.palco.appendChild(camada);
    const podeAgir = () => !destruido && !resolvida && !ctx.sinal.aborted;
    const livre = () => podeAgir() && !animando && !verificando;
    const pausada = () => !!(ctx.pausada && ctx.pausada());
    /** O relógio de inatividade da moldura pausa enquanto algo pula, confere, ajuda ou demonstra (PROJETO.md 6.2). */
    function sincronizarOcupado() {
      if (destruido || ctx.sinal.aborted) return;
      ctx.ocupado(animando || verificando || ajudando || !!demoAC || resolvida);
    }
    function marcarAnimando(v) { animando = v; sincronizarOcupado(); }

    // ------------------------------------------------------------ cenário da rodada: tabuinha, esteira e torres
    const tabua = U.el('div', { class: 'pc-separar-base pc-separar-tabua', style: { left: (BX - 110) + 'px', top: (CHAO - 2) + 'px', width: '220px' } });
    const esteira = U.el('div', { class: 'pc-separar-base pc-separar-esteira', style: { left: (PX - 100) + 'px', top: (CHAO - 2) + 'px', width: '200px' } });
    camada.append(tabua, esteira);
    const principal = new PC.Torre({ x: BX, y: CHAO, n: T, placa: false });     // padrão de 5 em 5, sem número
    const pilha = new PC.Torre({ x: PX, y: CHAO, cores: [], placa: false });    // cada cubinho guarda a sua cor
    camada.append(principal.el, pilha.el);

    // alça: trilho (o caminho), braço (passa pela torre na altura do corte) e pegador (pendurado logo abaixo)
    const selecao = U.el('div', { class: 'pc-separar-selecao', hidden: true });
    const trilho = U.el('div', { class: 'pc-separar-trilho' });
    const braco = U.el('div', { class: 'pc-separar-braco' });
    const pegador = U.el('div', { class: 'pc-separar-pegador', html: SVG_PEGADOR });
    const alca = U.el('div', { class: 'pc-separar-alca' }, braco, pegador);
    camada.append(selecao, trilho, alca);

    // áreas de toque (transparentes, com folga): a coluna inteira de cada coisa
    const area = (teste, rotulo) => {
      const e = U.el('div', { class: 'pc-separar-area', teste, role: 'button', 'aria-label': rotulo });
      camada.appendChild(e);
      return e;
    };
    const areaTorre = area('torre', 'Torre: toque para tirar um cubinho');
    const areaDezena = area('dezena', 'Dezena: toque para tirar a dezena inteira');
    const areaPilha = area('pilha', 'Pilhinha: toque para devolver um cubinho');
    const areaBloco = area('dezena-fora', 'Dezena tirada: toque para devolver a dezena');
    const alcaToque = U.el('div', { class: 'pc-separar-alca-toque', teste: 'alca', role: 'button', 'aria-label': 'Alça: arraste para baixo para tirar vários' });
    camada.appendChild(alcaToque);

    // placa do alvo (algarismo e pontinhos); tocar nela repete a instrução
    const placa = PC.ui.placaNumero(N);
    placa.dataset.teste = 'placa';
    const placaPos = U.el('div', { class: 'pc-separar-pos pc-separar-placa', style: { left: PLACA.x + 'px', top: PLACA.y + 'px' } }, placa);
    camada.appendChild(placaPos);
    PC.aoTocar(placa, () => instrucao(), { som: false });
    const pulsar = el => U.animar(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.14)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 560, easing: 'ease-out' });
    const pulsarPlaca = () => pulsar(placaPos);

    // botão Pronto (só com confirmar)
    let bPronto = null;
    if (confirmar) {
      bPronto = PC.ui.botaoIcone('pronto', 'Pronto', () => aoPronto(), { cor: 'verde' });
      bPronto.classList.add('pc-separar-pronto');
      bPronto.dataset.teste = 'pronto';
      Object.assign(bPronto.style, { left: (PRONTO.x - PRONTO.lado / 2) + 'px', top: (PRONTO.y - PRONTO.lado / 2) + 'px' });
      camada.appendChild(bPronto);
    }

    // ------------------------------------------------------------ geometria
    /**
     * A coluna em que o toque e a alça agem: a pilha única (até 10) ou a das unidades (de 11 a 19).
     * x0 = lado esquerdo da área de toque da alça (o pegador fica à direita da tabuinha, mesmo com um cubinho só).
     */
    function colunaCorte() {
      const n = principal.n, dupla = n >= 11, h = dupla ? n - 10 : n, cx = dupla ? BX + MEIA : BX;
      return { dupla, h, cx, esq: cx - LADO / 2, topo: CHAO - h * LADO, x0: dupla ? BX + 151 : BX + 90 };
    }
    const caixa = (el, x, y, l, a) => Object.assign(el.style, { left: x + 'px', top: y + 'px', width: l + 'px', height: a + 'px' });
    const soltosNaPilha = () => pilha.n - (blocoNaPilha ? 10 : 0);
    const centroTopo = col => ({ x: col.cx, y: col.topo + LADO / 2 });
    const centroDezena = () => ({ x: BX - MEIA, y: CHAO - 5 * LADO });
    const centroBloco = () => ({ x: pilha.n >= 11 ? PX - MEIA : PX, y: CHAO - 5 * LADO });
    function centroSoltos() {
      const r = pilha.retanguloCubo(pilha.n - 1);
      return { x: r.x + r.l / 2, y: r.y + r.a / 2 };
    }

    /** Recoloca as áreas de toque e a alça depois de qualquer mudança nas torres. */
    function atualizarAreas() {
      const col = colunaCorte();
      if (col.dupla) caixa(areaTorre, BX, AREA_TOPO, 150, ALTURA_AREA);
      else caixa(areaTorre, BX - 102, AREA_TOPO, col.x0 - (BX - 102), ALTURA_AREA);     // até a alça
      areaDezena.hidden = !col.dupla;
      if (col.dupla) caixa(areaDezena, BX - 160, AREA_TOPO, 159, ALTURA_AREA);
      const pDupla = pilha.n >= 11;
      areaBloco.hidden = !blocoNaPilha;
      if (blocoNaPilha) {
        if (pDupla) { caixa(areaBloco, PX - 141, AREA_TOPO, 140, ALTURA_AREA); caixa(areaPilha, PX, AREA_TOPO, 140, ALTURA_AREA); }
        else caixa(areaBloco, PX - 80, AREA_TOPO, 160, ALTURA_AREA);
        areaPilha.hidden = !pDupla;
      } else {
        areaPilha.hidden = false;
        if (pDupla) caixa(areaPilha, PX - 141, AREA_TOPO, 281, ALTURA_AREA);
        else caixa(areaPilha, PX - 80, AREA_TOPO, 160, ALTURA_AREA);
      }
      if (!corte) posicionarAlca(col);
    }

    /** Põe a alça na altura y (padrão: em cima da coluna de corte). Some quando não há o que tirar ou no acerto. */
    function posicionarAlca(col, y) {
      const vazia = col.h <= 0 || resolvida;
      alca.hidden = vazia; trilho.hidden = vazia; alcaToque.hidden = vazia;
      if (vazia) return;
      const corteY = y == null ? col.topo : y;
      caixa(trilho, col.x0 + ALCA_L / 2 - 9, col.topo - 8, 18, CHAO + 10 - (col.topo - 8));
      alca.style.left = col.x0 + 'px';
      alca.style.transform = `translateY(${corteY}px)`;
      caixa(braco, col.esq - 8 - col.x0, -6, (col.x0 + PEGADOR.dx + 12) - (col.esq - 8), 12);
      caixa(pegador, PEGADOR.dx, 4, PEGADOR.l, PEGADOR.a);
      if (!corte) {
        const topoToque = col.topo - 26;
        caixa(alcaToque, col.x0, topoToque, ALCA_L, Math.min(ALCA_L, AREA_BASE + 5 - topoToque));
      }
    }

    /**
     * Quanto o corte anda para cada px do dedo. A criança pega o pegador, que fica abaixo da linha do corte; com
     * ganho 1, levar o pegador até a tabuinha ainda deixaria o último cubinho. O ganho faz o dedo na altura da
     * tabuinha (y0 = onde o dedo pegou) levar a linha até o chão: tira todos.
     */
    const ganho = (col, y0) => U.limitar((CHAO - col.topo) / Math.max(LADO, CHAO - y0), 1, 1.7);
    /** Durante o arraste da alça: moldura tracejada nos cubinhos que vão sair (de k até o topo da coluna). */
    function marcarCorte(col, k) {
      if (k >= col.h) { selecao.hidden = true; return; }
      selecao.hidden = false;
      const topo = col.topo - 22, fundo = CHAO - k * LADO + 6;
      caixa(selecao, col.esq - 10, topo, LADO + 20, fundo - topo);
    }

    // ------------------------------------------------------------ voos (só transform e opacity)
    /** Cubinho solto que voa por cima de tudo, com a mesma pintura do cubinho de verdade. */
    function fantasma(cor, r) {
      const c = String(cor).split('|')[0];
      const g = U.el('div', { class: 'cubo pc-separar-voa', style: { left: r.x + 'px', top: r.y + 'px' } });
      g.style.setProperty('--c', c);
      g.style.setProperty('--c-claro', U.tom(c, 0.45));
      g.style.setProperty('--c-escuro', U.tom(c, -0.18));
      camada.appendChild(g);
      voando.add(g);
      return g;
    }
    /** Pulo em arco de (0, 0) até (dx, dy). Devolve Promise (nunca rejeita). */
    function voar(el, dx, dy, { ms = 340, atraso = 0, arco = 90 } = {}) {
      const q = [];
      for (let i = 0; i <= 10; i++) {
        const s = i / 10;
        q.push({ transform: `translate(${(dx * s).toFixed(1)}px, ${(dy * s - arco * 4 * s * (1 - s)).toFixed(1)}px)` });
      }
      return U.animar(el, q, { duration: ms, delay: atraso, easing: 'ease-in-out', fill: 'both' });
    }
    /** A torre mudou de uma pilha para duas (ou o contrário): desliza de onde estava (dx) até o lugar novo. */
    const deslizar = (t, dx) => U.animar(t.el, [{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0px)' }], { duration: 260, easing: 'ease-out' });
    /** Esconde cubinhos (e a fitinha da dezena deles) até o voo chegar. */
    function ocultar(t, indices) {
      indices.forEach(i => { if (t.cubos[i]) t.cubos[i].classList.add('pc-separar-oculto'); });
      (t.fitas || []).forEach((f, d) => { if (indices.some(i => Math.floor(i / 10) === d)) f.classList.add('pc-separar-oculto'); });
    }
    const mostrarCubo = (t, i) => { if (t.cubos[i]) t.cubos[i].classList.remove('pc-separar-oculto'); };
    const mostrarTudo = t => t.el.querySelectorAll('.pc-separar-oculto').forEach(e => e.classList.remove('pc-separar-oculto'));
    const tremer = el => U.animar(el, [{ transform: 'translateX(0px)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(9px)' },
      { transform: 'translateX(-5px)' }, { transform: 'translateX(0px)' }], { duration: 380 });
    function pulsarPilha() {
      const q = [{ transform: 'scale(1)' }, { transform: 'scale(1.08)', offset: 0.4 }, { transform: 'scale(1)' }];
      U.animar(pilha.el, q, { duration: 520, iterations: 2 });
      U.animar(esteira, q, { duration: 520, iterations: 2 });
    }

    // ------------------------------------------------------------ movimentos (o modelo muda na hora; o voo é só desenho)
    /** Tira qtd cubinhos de cima da coluna de corte: pulam um atrás do outro (o de cima primeiro) para a pilhinha. */
    function tirar(qtd, motivo) {
      const col = colunaCorte();
      qtd = Math.min(qtd, col.h);
      if (qtd <= 0 || !livre()) return;
      marcarAnimando(true);
      const n0 = principal.n, p0 = pilha.n;
      const saidas = [];
      for (let j = 0; j < qtd; j++) { const i = n0 - 1 - j; saidas.push({ cor: principal.corDe(i), r: principal.retanguloCubo(i) }); }
      principal.remover(qtd);
      if (n0 >= 11 && principal.n <= 10) deslizar(principal, -MEIA);       // a dezena volta para o meio da tabuinha
      saidas.forEach(s => pilha.adicionar(s.cor, { animar: false }));
      if (p0 < 11 && pilha.n >= 11) deslizar(pilha, MEIA);
      ocultar(pilha, saidas.map((s, j) => p0 + j));
      atualizarAreas();
      PC.som.separar();
      const voos = saidas.map((s, j) => {
        const destino = pilha.retanguloCubo(p0 + j), g = fantasma(s.cor, s.r);
        return voar(g, destino.x - s.r.x, destino.y - s.r.y, { atraso: j * 75 }).then(() => {
          g.remove(); voando.delete(g);
          mostrarCubo(pilha, p0 + j);
          if (!destruido) PC.som.soltar();
        });
      });
      animacao = Promise.all(voos).then(() => {
        mostrarTudo(pilha);
        marcarAnimando(false);
        depoisDeMudar(motivo);
      });
    }

    /** Devolve à torre o último cubinho solto que saiu (o de cima da pilhinha). */
    function devolverUm() {
      if (soltosNaPilha() <= 0 || !livre()) return;
      marcarAnimando(true);
      const iP = pilha.n - 1, de = pilha.retanguloCubo(iP);
      const pDupla0 = pilha.n >= 11, nDupla0 = principal.n >= 11;
      pilha.remover(1);
      if (pDupla0 && pilha.n <= 10) deslizar(pilha, -MEIA);
      principal.adicionar(null, { animar: false });
      if (!nDupla0 && principal.n >= 11) deslizar(principal, MEIA);     // a dezena vai para a esquerda
      const iM = principal.n - 1;
      ocultar(principal, [iM]);
      atualizarAreas();
      PC.som.pegar();
      const para = principal.retanguloCubo(iM), g = fantasma(principal.corDe(iM), de);
      animacao = voar(g, para.x - de.x, para.y - de.y).then(() => {
        g.remove(); voando.delete(g);
        mostrarTudo(principal);
        if (!destruido) PC.som.encaixar();
        marcarAnimando(false);
        depoisDeMudar('devolveu');
      });
    }

    /** Tira a dezena inteira: sai de uma vez com t.separarDezena() e vai para a esteira (embaixo dos soltos). */
    function tirarDezena() {
      if (!livre() || principal.n < 11 || principal.n > 19) return;
      marcarAnimando(true);
      const nova = principal.separarDezena();
      if (!nova) { marcarAnimando(false); return; }
      deslizar(principal, MEIA);                     // as unidades deslizam para o meio da tabuinha
      nova.el.classList.add('pc-separar-dezena-voa');
      voando.add(nova.el);
      const soltos = pilha.cores.slice();
      pilha.definir(nova.cores.concat(soltos));
      blocoNaPilha = true;
      if (soltos.length) deslizar(pilha, -MEIA);
      ocultar(pilha, faixa(0, 9));
      atualizarAreas();
      PC.som.separar();
      const destinoX = pilha.n >= 11 ? PX - MEIA : PX;
      animacao = voar(nova.el, destinoX - nova.x, 0, { ms: 520, arco: 40 }).then(() => {
        nova.destruir(); voando.delete(nova.el);
        mostrarTudo(pilha);
        if (!destruido) PC.som.soltar();
        marcarAnimando(false);
        depoisDeMudar('dezena');
      });
    }

    /** Devolve a dezena que saiu, inteira, para a torre (ela volta a ser a pilha da esquerda). */
    function devolverDezena() {
      if (!livre() || !blocoNaPilha || pilha.n < 10 || principal.n + 10 > 19) return;
      marcarAnimando(true);
      const pDupla0 = pilha.n >= 11, deX = pDupla0 ? PX - MEIA : PX;
      pilha.definir(pilha.cores.slice(10));
      blocoNaPilha = false;
      if (pDupla0) deslizar(pilha, MEIA);
      const m = principal.n;
      principal.adicionarVarios(10, { animar: false });
      if (m > 0) deslizar(principal, -MEIA);
      ocultar(principal, faixa(0, 9));
      atualizarAreas();
      const voo = new PC.Torre({ x: deX, y: CHAO, n: 10, placa: false });
      voo.el.classList.add('pc-separar-dezena-voa');
      camada.appendChild(voo.el);
      voando.add(voo.el);
      PC.som.pegar();
      const paraX = principal.n >= 11 ? BX - MEIA : BX;
      animacao = voar(voo.el, paraX - deX, 0, { ms: 520, arco: 40 }).then(() => {
        voo.destruir(); voando.delete(voo.el);
        mostrarTudo(principal);
        if (!destruido) PC.som.encaixar();
        marcarAnimando(false);
        depoisDeMudar('devolveu');
      });
    }

    // ------------------------------------------------------------ toques
    function tocarTorre() {
      if (!livre()) return;
      if (colunaCorte().h <= 0) { tremer(tabua); return; }
      tirar(1, 'toque');
    }
    function tocarPilha() {
      if (!livre()) return;
      if (soltosNaPilha() <= 0) { tremer(esteira); return; }
      devolverUm();
    }
    // arrastar em cima de uma coluna vale como toque (dedo que escorrega não se perde); gesto cancelado (outro dedo,
    // "Quer parar?", fim da rodada) não mexe em nada
    const ligar = (el, fn) => desligares.push(PC.arrastar(el, {
      podeComecar: () => livre(), aoTocar: () => fn(), aoSoltar: () => fn(), aoCancelar: () => {},
    }));
    ligar(areaTorre, tocarTorre);
    ligar(areaDezena, tirarDezena);
    ligar(areaPilha, tocarPilha);
    ligar(areaBloco, devolverDezena);

    // alça: arrastar para baixo marca os cubinhos de cima; ao soltar, eles saem todos. Tocar nela tira um.
    function encerrarCorte() {
      corte = null;
      alca.classList.remove('pegando');
      selecao.hidden = true;
      if (!destruido) posicionarAlca(colunaCorte());
    }
    desligares.push(PC.arrastar(alcaToque, {
      podeComecar: () => livre() && colunaCorte().h > 0,
      aoTocar: () => tocarTorre(),
      aoComecar: p => {
        const col = colunaCorte();
        corte = { col, k: col.h, g: ganho(col, p.inicio.y) };
        alca.classList.add('pegando');
        PC.som.pegar();
      },
      aoMover: p => {
        if (!corte) return;
        const col = corte.col, y = U.limitar(col.topo + p.dy * corte.g, col.topo, CHAO);
        alca.style.transform = `translateY(${y}px)`;
        const k = U.limitar(Math.round((CHAO - y) / LADO), 0, col.h);
        if (k !== corte.k) { corte.k = k; marcarCorte(col, k); PC.som.clique(); }
      },
      aoSoltar: () => {
        const c = corte;
        encerrarCorte();
        if (!c) return;
        const qtd = c.col.h - c.k;
        if (qtd > 0 && livre()) tirar(qtd, 'corte');
        else if (podeAgir()) PC.som.soltar();
      },
      aoCancelar: () => encerrarCorte(),
    }));

    // qualquer toque da criança cancela a fala de "como está" que ia sair, a ajuda em andamento e a demonstração
    const offToque = PC.on('toque', () => { interagiu = true; cancelarStatus(); cancelarAjuda(); pararDemo(); });
    // "Quer parar?": o recado pendente e a demonstração saem; a contagem e a ajuda seguram até a criança continuar
    const offPausa = PC.on('atividade:pausa', () => {
      if (destruido) return;
      pausas++;
      cancelarStatus();
      pararDemo();
    });

    // ------------------------------------------------------------ falas e contagem (seguram durante o "Quer parar?")
    function cancelarStatus() { if (statusAC) { statusAC.abort(); statusAC = null; } }
    function cancelarAjuda() { if (ajudaAC) ajudaAC.abort(); }
    function pararDemo() { if (demoAC) demoAC.abort(); }

    /** Espera o "Quer parar?" fechar. Rejeita com AbortError se o sinal abortar. */
    async function esperarRetomada(sinal) {
      while (pausada()) await U.esperar(120, sinal);
      if (sinal.aborted) throw U.abortado();
    }
    /** Fala da Pipoca que desiste se o sinal abortou (a ajuda foi interrompida) e espera o "Quer parar?" fechar. */
    async function falarCom(sinal, texto, opcoes) {
      await esperarRetomada(sinal);
      await ctx.falar(texto, opcoes);
      if (sinal.aborted) throw U.abortado();
    }
    /**
     * Conta em voz alta de `de` até `ate`, como PC.voz.contar (no masculino, em ordem, sem pular número), mas cada
     * número espera o "Quer parar?" fechar e o número cortado pela pergunta é dito de novo.
     */
    async function contar(ate, { de = 1, intervalo = 600, aCada = null, sinal }) {
      let i = 0;
      for (let v = de; v <= ate;) {
        await esperarRetomada(sinal);
        const p0 = pausas;
        if (aCada) { try { aCada(i, v); } catch (e) { console.error(e); } }
        PC.som.contar(i + 1);
        const fala = PC.voz.falar(ext(v));
        await Promise.all([U.esperar(intervalo, sinal), Promise.race([fala, U.esperar(PC.voz.TETO_NUMERO, sinal)])]);
        if (pausas !== p0) continue;          // a pergunta cortou este número: repete depois
        v++; i++;
      }
    }

    // ------------------------------------------------------------ depois de cada movimento
    /** Sem botão Pronto: se a criança para com a torre ainda diferente de N, a Pipoca diz como está. */
    function agendarStatus(ms) {
      cancelarStatus();
      const ac = new AbortController();
      statusAC = ac;
      U.esperar(ms, ac.signal).then(() => {
        if (statusAC !== ac) return;
        statusAC = null;
        if (!livre() || ajudando || pausada() || PC.arrastar.ativo()) return;
        const r = principal.n;
        if (r === N) return;
        const fala = r > N ? `${maiuscula(ficaram(r))}. Tire mais!` : `${maiuscula(ficaram(r))}. ${pedido(N)}`;
        ctx.falar(fala, { mostrar: r > N ? r : N }).catch(() => {});
      }, () => {});
    }

    function depoisDeMudar(motivo) {
      if (!podeAgir() || confirmar) return;
      const r = principal.n;
      if (r === N) { sucesso(false); return; }
      if (r < N && motivo !== 'devolveu') { errar(); return; }
      agendarStatus(motivo === 'corte' ? 350 : 1600);
    }

    /** Ficou com menos que N: retorno descritivo e neutro pela moldura; a pilhinha pulsa (é dali que se devolve). */
    function errar() {
      const r = principal.n, porUm = N - r === 1;
      ctx.errou({ fala: `${porUm ? 'Quase! ' : ''}${maiuscula(ficaram(r))}. ${pedido(N)}`, quase: porUm, mostrar: N });
      pulsarPilha();
    }

    // ------------------------------------------------------------ contar, conferir e acertar
    /** A Pipoca conta o que ficou na torre, acendendo cada cubinho. Com dezena: "dez" (a dezena toda) e segue. */
    async function contarRestantes(sinal) {
      const r = principal.n;
      if (r <= 0) return;
      PC.ui.pipoca.pose('aponta');
      try {
        if (dezenaModo && r >= 10) {
          await contar(r, {
            de: 10, intervalo: 500, sinal,
            aCada: (i, v) => { if (i === 0) faixa(0, 9).forEach(k => principal.destacar(k)); else principal.destacar(v - 1); },
          });
        } else {
          await contar(r, { intervalo: 450, sinal, aCada: i => principal.destacar(i) });
        }
      } finally {
        // rodada encerrada (acerto ou saída): quem cuida da pose agora é a moldura (ex.: "feliz" na comemoração)
        if (!destruido && !ctx.sinal.aborted) PC.ui.pipoca.pose('normal');
      }
    }

    /** Botão Pronto: espera o pulo acabar, conta o que ficou e confere. */
    async function aoPronto() {
      if (!podeAgir() || verificando) return;
      cancelarStatus(); cancelarAjuda(); pararDemo();
      verificando = true;
      ctx.ocupado(true);
      const ac = new AbortController();
      verifAC = ac;
      const aoAbortar = () => ac.abort();
      ctx.sinal.addEventListener('abort', aoAbortar, { once: true });
      try {
        await animacao;
        if (ac.signal.aborted || !podeAgir()) return;
        const r = principal.n;
        if (r === T) { await falarCom(ac.signal, `A torre ainda tem ${ext(T)}. ${pedido(N)}`, { mostrar: N }); return; }
        await contarRestantes(ac.signal);
        if (ac.signal.aborted || !podeAgir()) return;
        if (r === N) { await sucesso(true); return; }
        if (r > N) { await falarCom(ac.signal, `${maiuscula(ficaram(r))}. Tire mais!`, { mostrar: r }); return; }
        errar();
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ctx.sinal.removeEventListener('abort', aoAbortar);
        if (verifAC === ac) verifAC = null;
        if (!resolvida && !destruido && !ctx.sinal.aborted) { verificando = false; sincronizarOcupado(); }
      }
    }

    function fraseAcerto() {
      if (tipo === 'dezena') return `${maiuscula(ext(T))} menos dez... ${ficaram(N)}!`;
      return `Eram ${ext(T)}, tiramos ${ext(T - N)}, ${ficaram(N)}!`;
    }

    /** Lousinha com a conta: T − tirados = N (o resultado em amarelo). */
    function mostrarLousa(instantaneo) {
      if (lousaEl) return;
      const s = (t, c) => U.el('span', { class: c, text: t });
      const quadro = U.el('div', { class: 'pc-separar-lousa', 'aria-label': `${T} menos ${T - N} igual a ${N}` },
        s(String(T), 'pc-separar-num'), s('−', 'pc-separar-sinal'), s(String(T - N), 'pc-separar-num'),
        s('=', 'pc-separar-sinal'), s(String(N), 'pc-separar-num pc-separar-resultado'));
      lousaEl = U.el('div', { class: 'pc-separar-pos pc-separar-lousa-pos', style: { left: LOUSA.x + 'px', top: LOUSA.y + 'px' } }, quadro);
      camada.appendChild(lousaEl);
      if (!instantaneo) U.animar(lousaEl, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 340, easing: 'cubic-bezier(.3, 1.5, .5, 1)' });
    }

    /** Ficou com N: (conta, se ainda não contou), mostra a conta, fala "Eram sete, tiramos três..." e termina. */
    async function sucesso(jaContou) {
      if (!podeAgir()) return;
      resolvida = true;
      ctx.ocupado(true);
      cancelarStatus(); cancelarAjuda(); pararDemo();
      posicionarAlca(colunaCorte());                 // a alça some
      try {
        if (!jaContou) await contarRestantes(ctx.sinal);
        mostrarLousa(false);
        pulsarPlaca();
        await ctx.falar(fraseAcerto(), { mostrar: N });
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
      finalizar();
    }
    function finalizar() {
      if (finalizado || destruido) return;
      finalizado = true;
      ctx.acertou();
    }

    // ------------------------------------------------------------ instrução, demonstração, ajuda e gesto certo
    function textoInstrucao() {
      if (principal.n === T && pilha.n === 0) {
        const alvo = N === 0 ? 'Tire todos os cubinhos!' : `Tire cubinhos até ${N === 1 ? 'ficar um' : 'ficarem ' + ext(N)}!`;
        return `A torre tem ${totalFalado(T)}. ${alvo}`;
      }
      const alvo = N === 0 ? 'Tire todos os cubinhos!' : `A torre precisa ficar com ${ext(N)}!`;
      return alvo + (confirmar ? ' Depois, toque no botão verde!' : '');
    }
    function instrucao() {
      // conferindo, ajudando ou acertando, a Pipoca já está contando: a instrução não fala por cima
      if (!podeAgir() || verificando || ajudando) return Promise.resolve();
      pulsarPlaca();
      return ctx.falar(textoInstrucao(), { mostrar: N }).catch(() => {});
    }

    /** Cubinhos da torre de verdade ficam clarinhos enquanto a cópia da demonstração "sai" (sim) ou voltam (não). */
    function apagar(indices, sim) {
      if (!sim) { principal.el.querySelectorAll('.pc-separar-apagado').forEach(e => e.classList.remove('pc-separar-apagado')); return; }
      indices.forEach(i => { if (principal.cubos[i]) principal.cubos[i].classList.add('pc-separar-apagado'); });
      if (indices.length >= 10 && principal.fitas && principal.fitas[0]) principal.fitas[0].classList.add('pc-separar-apagado');
    }
    /**
     * Demonstração (1ª rodada com demo): a mãozinha toca na torre (na rodada da dezena, na dezena) e uma cópia do
     * cubinho de cima (ou da dezena inteira) pula para a pilhinha, enquanto o de verdade fica clarinho; depois a cópia
     * some e a torre volta como estava. Duas vezes; qualquer toque da criança (ou o "Quer parar?") encerra na hora.
     */
    async function demonstrar() {
      const ac = new AbortController();
      demoAC = ac;
      const aoAbortar = () => ac.abort();
      ctx.sinal.addEventListener('abort', aoAbortar, { once: true });
      let copia = null, mao = null;
      const desfazer = () => {
        if (copia) { copia.remove(); voando.delete(copia); copia = null; }
        apagar(null, false);
      };
      ctx.ocupado(true);
      try {
        const col = colunaCorte();
        const naDezena = tipo === 'dezena' && col.dupla;
        ctx.falar(naDezena ? 'Toque na dezena: ela sai inteira!' : 'Toque na torre para tirar um cubinho!').catch(() => {});
        for (let vez = 0; vez < 2; vez++) {
          if (ac.signal.aborted || !livre() || PC.arrastar.ativo()) return;
          mao = ctx.dica(naDezena ? centroDezena() : centroTopo(col), null, { vezes: 1 });
          await U.esperar(560, ac.signal);              // o dedo da mãozinha encosta (PC.ui.dica aperta perto de 45%)
          let voo;
          if (naDezena) {
            const t = new PC.Torre({ x: BX - MEIA, y: CHAO, n: 10, placa: false });
            t.el.classList.add('pc-separar-dezena-voa');
            copia = t.el;
            camada.appendChild(copia);
            voando.add(copia);
            apagar(faixa(0, 9), true);
            voo = voar(copia, PX - (BX - MEIA), 0, { ms: 520, arco: 40 });
          } else {
            const i = principal.n - 1, r = principal.retanguloCubo(i), d = pilha.retanguloCubo(pilha.n);
            copia = fantasma(principal.corDe(i), r);
            apagar([i], true);
            voo = voar(copia, d.x - r.x, d.y - r.y);
          }
          PC.som.separar();
          await Promise.race([voo, U.esperar(1500, ac.signal)]);
          if (ac.signal.aborted) return;
          PC.som.soltar();
          await U.esperar(800, ac.signal);
          U.animar(copia, [{ opacity: 1 }, { opacity: 0 }], { duration: 280, fill: 'forwards' });
          await U.esperar(300, ac.signal);
          desfazer();
          await U.esperar(400, ac.signal);
        }
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ctx.sinal.removeEventListener('abort', aoAbortar);
        desfazer();
        if (ac.signal.aborted && mao && mao.parar) mao.parar();
        if (demoAC === ac) demoAC = null;
        sincronizarOcupado();
      }
    }

    /** Ajuda que ensina (2º erro seguido): a Pipoca conta o que ficou e compara com o alvo. */
    async function ajudar(nivel) {
      if (nivel >= 3 || !livre() || ajudando) return;
      const ac = new AbortController();
      const aoAbortar = () => ac.abort();
      ctx.sinal.addEventListener('abort', aoAbortar, { once: true });
      ajudaAC = ac; ajudando = true;
      ctx.ocupado(true);
      pararDemo();
      try {
        await esperarRetomada(ac.signal);
        const r = principal.n;
        await contarRestantes(ac.signal);
        if (ac.signal.aborted) return;
        let fala;
        if (r === N) {
          fala = `${maiuscula(ficaram(r))}!` + (confirmar ? ' Toque no botão verde!' : '');
          if (bPronto) pulsar(bPronto);
        } else if (r < N) {
          fala = `${maiuscula(ficaram(r))}. ${pedido(N)} Toque na pilhinha para devolver!`;
          pulsarPilha();
        } else if (tipo === 'dezena' && principal.n >= 11 && principal.n - 10 === N) {
          // as unidades já são o alvo: falta tirar a dezena inteira
          fala = `${maiuscula(ficaram(r))}. ${pedido(N)} Toque na dezena!`;
        } else {
          fala = `${maiuscula(ficaram(r))}. ${pedido(N)}` + (N === 0 ? '' : ' Tire mais!');
        }
        await falarCom(ac.signal, fala, { mostrar: N });
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ctx.sinal.removeEventListener('abort', aoAbortar);
        if (ajudaAC === ac) ajudaAC = null;
        ajudando = false;
        sincronizarOcupado();
      }
    }

    /** Tirar qtd da coluna de corte: com Pronto e 2 ou mais, a alça (de uma vez); senão, tocar na torre. */
    function gestoCorte(col, qtd) {
      if (confirmar && qtd >= 2) {
        const de = { x: col.x0 + ALCA_L / 2, y: col.topo + 50 };
        return { tipo: 'arrastar', de, para: { x: de.x, y: Math.round(de.y + qtd * LADO / ganho(col, de.y)) } };
      }
      return { tipo: 'tocar', em: centroTopo(col) };
    }
    /** O gesto certo no estado atual (px virtuais). */
    function proximoGesto() {
      if (!podeAgir() || verificando) return null;
      const r = principal.n;
      if (r === N) return confirmar ? { tipo: 'tocar', em: { x: PRONTO.x, y: PRONTO.y } } : null;
      if (r < N) {
        if (blocoNaPilha && (r + 10 <= N || soltosNaPilha() <= 0)) return { tipo: 'tocar', em: centroBloco() };
        return soltosNaPilha() > 0 ? { tipo: 'tocar', em: centroSoltos() } : null;
      }
      const col = colunaCorte();
      // rodada da dezena com a torre igual à dezena sozinha: devolve unidades para depois tirar a dezena inteira
      if (tipo === 'dezena' && r === 10 && soltosNaPilha() > 0) return { tipo: 'tocar', em: centroSoltos() };
      if (col.dupla && N < 10) {
        // falta tirar a dezena: primeiro as unidades certas, depois a dezena inteira
        if (col.h === N) return { tipo: 'tocar', em: centroDezena() };
        if (col.h < N) return soltosNaPilha() > 0 ? { tipo: 'tocar', em: centroSoltos() } : { tipo: 'tocar', em: centroDezena() };
        return gestoCorte(col, col.h - N);
      }
      return gestoCorte(col, r - N);
    }

    function estado() {
      return {
        total: T, alvo: N, tipo, confirmar, restantes: principal.n, naPilha: pilha.n, soltos: soltosNaPilha(), blocoNaPilha,
        dezenaNaTorre: principal.n >= 11, animando, verificando, ajudando, demo: !!demoAC, resolvida,
        ocupado: animando || verificando || ajudando || resolvida || !!corte,
        lousa: lousaEl ? lousaEl.textContent : '',
      };
    }

    // ------------------------------------------------------------ testes e limpeza
    /** Para os voos na hora e mostra tudo onde já está no modelo. */
    function concluirVoos() {
      voando.forEach(el => { el.getAnimations().forEach(a => a.cancel()); el.remove(); });
      voando.clear();
      [principal, pilha].forEach(t => { t.el.getAnimations().forEach(a => a.cancel()); mostrarTudo(t); });
      apagar(null, false);
    }
    /** Testes: deixa a torre com N na hora (a pilhinha com o resto) e termina a rodada com um único ctx.acertou(). */
    function resolver() {
      if (destruido || finalizado) return;
      if (!resolvida) {
        resolvida = true;
        cancelarStatus(); cancelarAjuda(); pararDemo();
        if (verifAC) verifAC.abort();
        try {
          PC.arrastar.cancelarTodos();
          concluirVoos();
          principal.definir(faixa(0, N - 1).map(corCinco));
          if (tipo === 'dezena') { pilha.definir(faixa(0, 9).map(corCinco)); blocoNaPilha = true; }
          else { const t = []; for (let i = T - 1; i >= N; i--) t.push(corCinco(i)); pilha.definir(t); blocoNaPilha = false; }
          atualizarAreas();
          mostrarLousa(true);
        } catch (e) { console.error(e); }
      } else if (!lousaEl) {
        try { mostrarLousa(true); } catch (e) { console.error(e); }
      }
      finalizar();
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      cancelarStatus(); cancelarAjuda(); pararDemo();
      if (verifAC) verifAC.abort();
      offToque(); offPausa();
      desligares.forEach(d => { try { d(); } catch (e) { console.error(e); } });
      voando.clear();
      camada.remove();
    }

    // ------------------------------------------------------------ início
    atualizarAreas();
    U.animar(principal.el, [{ transform: 'translateY(60px)', opacity: 0 }, { transform: 'translateY(0px)', opacity: 1 }],
      { duration: 380, easing: 'cubic-bezier(.3, 1.4, .5, 1)' });
    U.animar(placaPos, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 420, delay: 160, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' });
    (async () => {
      try {
        await ctx.esperar(300);
        await instrucao();
        // demonstração (1ª rodada com demo): a mãozinha toca e uma cópia do cubinho (ou da dezena) pula para a pilhinha
        if (ctx.demo && !interagiu && livre() && !PC.arrastar.ativo()) await demonstrar();
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    })();

    return { instrucao, proximoGesto, ajudar, resolver, estado, destruir };
  }

  PC.atividades.registrar('separar', {
    titulo: 'Separar cubinhos',
    icone: 'separar',
    cenario: 'prado',
    totalRodadas: params => U.limitar(inteiro(params && params.rodadas, 3), 1, 10),
    rodada,
  });
})();
