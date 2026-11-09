/* Pipoca Aprende — atividade "tambor": Tambor das sílabas (PROJETO.md 5.8 e 5.9).
   Cena: a figura da palavra num cartão branco no alto, abaixo dela uma fileira de 5 bolinhas vazias e, no chão, um
   tamborzinho grande de madeira com pele de couro (x ≈ 880). O botão Pronto fica em x ≈ 1400, y ≈ 700.
   A criança bate no tambor um toque para cada pedaço (sílaba) da palavra: cada toque acende a próxima bolinha (o
   tambor pula, a pele faz uma ondinha e soa o "tum"). Tocar numa bolinha acesa apaga a última (desfazer). Tocar na
   figura: a Pipoca fala a palavra de novo.
   Pronto: a Pipoca bate junto, devagar, falando as sílabas ("bá… ná… ná…") e marcando as bolinhas uma por uma (verde =
   conferida, vermelhinha tracejada = faltou, apagada = sobrou). Certo → "Banana!" e a rodada acaba. Errado → retorno
   pela moldura: "Banana tem três pedaços: bá, ná, ná."
   demo (1ª rodada): depois da instrução, a mãozinha bate no tambor uma vez por sílaba (a Pipoca fala cada sílaba),
   depois mostra que tocar na bolinha apaga ("Para apagar, toque na bolinha.") e libera: "Agora é sua vez!".
   Ajuda (2º erro seguido): a Pipoca fala a palavra bem devagar, sílaba por sílaba, sem bater ("bá… ná… ná… Banana!").
   Sorteio: palavras do PC.palavras com params.silabas [min, max] (com bichos: só os bichos do álbum), sem repetir na
   mesma estação; a quantidade de sílabas varia de uma rodada para outra.
   params: { silabas: [min, max], bichos, rodadas, demo } */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  // ---------------------------------------------------------------- medidas (px do palco virtual 1600×900)
  const MAX_TOQUES = 5;                                     // bolinhas da fileira
  const CX = 895;                                           // eixo da cena (cartão, bolinhas e tambor)
  const CARTAO = { x: CX - 115, y: 150, l: 230, a: 230 };   // cartão da figura
  const VAGA_L = 126, VAGA_A = 140, FILA_Y = 455;           // cada bolinha: área de toque 126×140, centro em FILA_Y
  const FILA_X0 = CX - (MAX_TOQUES * VAGA_L) / 2;           // 565: começa logo à direita da zona do balão
  const TAMBOR = { x: CX - 200, y: 515, l: 400, a: 290 };   // desenho do tambor (viewBox 0 0 400 290)
  const TAMBOR_TOQUE = { x: CX - 225, y: 530, l: 450, a: 345 };
  const PELE = { x: CX, y: TAMBOR.y + 62 };                 // centro da pele (onde a mãozinha bate)
  const BOTAO = { x: 1400, y: 700 };                        // Pronto
  const T = '#3A2A5A';

  const CSS = `
    .pc-tambor { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
    .pc-tambor-cartao { position: absolute; left: ${CARTAO.x}px; top: ${CARTAO.y}px; width: ${CARTAO.l}px; height: ${CARTAO.a}px;
      box-sizing: border-box; border-radius: 38px; background: #fff; border: 6px solid ${T}; box-shadow: 0 10px 0 rgba(58, 42, 90, .22);
      display: grid; place-items: center; z-index: 5; cursor: pointer; }
    .pc-tambor-cartao .fig { width: 196px; height: 196px; pointer-events: none; }
    .pc-tambor-cartao .fig svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .pc-tambor-trilho { position: absolute; left: ${FILA_X0 - 10}px; top: ${FILA_Y - 62}px; width: ${MAX_TOQUES * VAGA_L + 20}px; height: 124px;
      box-sizing: border-box; border-radius: 62px; background: rgba(255, 248, 230, .62); border: 5px solid rgba(58, 42, 90, .28); z-index: 3; pointer-events: none; }
    .pc-tambor-vaga { position: absolute; top: ${FILA_Y - VAGA_A / 2}px; width: ${VAGA_L}px; height: ${VAGA_A}px; display: grid; place-items: center;
      z-index: 6; cursor: pointer; }
    .pc-tambor-bola { position: relative; width: 92px; height: 92px; box-sizing: border-box; border-radius: 50%;
      border: 5px dashed rgba(58, 42, 90, .55); background: rgba(255, 255, 255, .55); transition: background-color .15s, border-color .15s, opacity .25s, box-shadow .2s; }
    .pc-tambor-vaga.acesa .pc-tambor-bola { border: 5px solid ${T}; background: #FFC93C; box-shadow: 0 6px 0 rgba(58, 42, 90, .25); }
    .pc-tambor-vaga.acesa .pc-tambor-bola::after { content: ''; position: absolute; left: 17px; top: 13px; width: 28px; height: 16px; border-radius: 50%;
      background: #fff; opacity: .7; transform: rotate(-28deg); }
    .pc-tambor-vaga.confere .pc-tambor-bola { box-shadow: 0 0 0 9px #5CC84A, 0 0 0 13px ${T}; }
    .pc-tambor-vaga.falta .pc-tambor-bola { border: 5px dashed #E9604F; background: rgba(255, 186, 176, .85); }
    .pc-tambor-vaga.sobra .pc-tambor-bola { opacity: .35; }
    .pc-tambor-desenho { position: absolute; left: ${TAMBOR.x}px; top: ${TAMBOR.y}px; width: ${TAMBOR.l}px; height: ${TAMBOR.a}px;
      pointer-events: none; transform-origin: 50% 97%; z-index: 4; }
    .pc-tambor-desenho svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .pc-tambor-toque { position: absolute; left: ${TAMBOR_TOQUE.x}px; top: ${TAMBOR_TOQUE.y}px; width: ${TAMBOR_TOQUE.l}px; height: ${TAMBOR_TOQUE.a}px;
      border-radius: 70px; z-index: 7; cursor: pointer; }
    .pc-tambor-ondinha { position: absolute; left: ${PELE.x - 90}px; top: ${PELE.y - 24}px; width: 180px; height: 48px; box-sizing: border-box;
      border-radius: 50%; border: 6px solid #fff; z-index: 5; pointer-events: none; opacity: 0; }
    .pc-tambor-som { position: absolute; top: ${PELE.y - 70}px; width: 70px; height: 110px; z-index: 5; pointer-events: none; opacity: 0; }
    .pc-tambor-som svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .pc-tambor-botao { position: absolute; left: ${BOTAO.x - 230}px; top: ${BOTAO.y - 90}px; width: 460px; height: 180px; z-index: 8;
      display: flex; align-items: center; justify-content: center; pointer-events: none; }
    .pc-tambor-botao .botao-grande { pointer-events: auto; height: 140px; }
    .pc-tambor-botao .botao-grande[disabled] { opacity: .5; }
    .pc-tambor-silaba { flex: none; min-width: 96px; padding: 4px 16px 8px; box-sizing: border-box; border-radius: 20px; background: #FFF8E6;
      border: 4px solid ${T}; font: 700 64px/1 Fredoka, sans-serif; color: ${T}; text-align: center; }
  `;

  // ---------------------------------------------------------------- utilidades
  const inteiro = (v, padrao) => { const n = Math.round(Number(v)); return isFinite(n) ? n : padrao; };
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);
  const pedacos = n => PC.voz.quantidade(n, 'pedaço', 'pedaços');
  const totalRodadas = params => U.limitar(inteiro(params && params.rodadas, 4), 1, 10);

  /** A janela "Quer parar?" da moldura está aberta? */
  function pausado(ctx) {
    if (ctx && typeof ctx.pausada === 'function') return !!ctx.pausada();
    const r = PC.telas && PC.telas.raizAtual && PC.telas.raizAtual();
    return !!(r && r.querySelector('.pc-moldura-pausa'));
  }

  // ---------------------------------------------------------------- sorteio (sem repetir na mesma estação)
  const memorias = new WeakMap();
  function memoriaDe(params) {
    let m = memorias.get(params);
    if (!m) { m = { usadas: new Set(), saco: [], ultimaQtd: null }; memorias.set(params, m); }
    return m;
  }
  function faixaSilabas(params) {
    const s = Array.isArray(params.silabas) ? params.silabas : [1, 4];
    const min = U.limitar(inteiro(s[0], 1), 1, MAX_TOQUES - 1);
    const max = U.limitar(inteiro(s[1], min), min, MAX_TOQUES - 1);   // sempre sobra uma bolinha a mais
    return [min, max];
  }
  /** Sorteia a palavra da rodada: a quantidade de sílabas sai de um "saco" (varia entre rodadas), a palavra não repete. */
  function sortear(params, mem) {
    const faixa = faixaSilabas(params);
    let lista = PC.palavras.filtrar({ silabas: faixa, bichos: params.bichos ? true : undefined });
    if (!lista.length) lista = PC.palavras.filtrar({ silabas: faixa });
    if (!lista.length) lista = PC.palavras.filtrar({ silabas: [1, MAX_TOQUES - 1] });
    const livres = lista.filter(p => !mem.usadas.has(p.id));
    if (!livres.length) { mem.usadas.clear(); livres.push(...lista); }
    const qtds = [];
    livres.forEach(p => { if (qtds.indexOf(p.silabas.length) < 0) qtds.push(p.silabas.length); });
    mem.saco = mem.saco.filter(q => qtds.indexOf(q) >= 0);
    if (!mem.saco.length) {
      mem.saco = U.embaralhar(qtds);
      // nunca a mesma quantidade duas rodadas seguidas (quando der)
      if (mem.saco.length > 1 && mem.saco[0] === mem.ultimaQtd) mem.saco.push(mem.saco.shift());
    }
    const qtd = mem.saco.shift();
    const candidatas = livres.filter(p => p.silabas.length === qtd);
    const p = U.escolher(candidatas.length ? candidatas : livres);
    mem.usadas.add(p.id);
    mem.ultimaQtd = p.silabas.length;
    return p;
  }

  // ---------------------------------------------------------------- desenho do tambor (SVG próprio; viewBox 0 0 400 290)
  // Corpo de madeira (tábuas), dois aros vermelhos, corda dourada em zigue-zague com nozinhos e a pele de couro em cima.
  function desenhoTambor() {
    const madeira = '#D99A5B', madeiraEsc = '#B87A3E', aro = '#E8434D', corda = '#FFC93C', pele = '#F6E3BC';
    const yAroCima = x => 92 + 44 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 200) / 170, 2)));
    const yAroBaixo = x => 222 + 36 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 200) / 159, 2)));
    let tabuas = '';
    [[92, 104], [146, 152], [200, 200], [254, 248], [308, 296]].forEach(([xc, xb]) => {
      tabuas += `<path d="M${xc} ${yAroCima(xc) - 4} L ${xb} ${yAroBaixo(xb) + 4}" stroke="${madeiraEsc}" stroke-width="4" stroke-linecap="round"/>`;
    });
    // corda: de cima para baixo, alternando
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const x = 52 + i * 49.3;
      pts.push(i % 2 === 0 ? [x, yAroCima(x) + 2] : [x, yAroBaixo(x) - 2]);
    }
    const caminho = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ');
    const nos = pts.filter((_, i) => i % 2 === 0).map(p => `<circle cx="${p[0].toFixed(1)}" cy="${(p[1] + 1).toFixed(1)}" r="8" fill="#FFF0C4" stroke="${T}" stroke-width="4"/>`).join('') +
      pts.filter((_, i) => i % 2 === 1).map(p => `<circle cx="${p[0].toFixed(1)}" cy="${(p[1] - 1).toFixed(1)}" r="8" fill="#FFF0C4" stroke="${T}" stroke-width="4"/>`).join('');
    return `<svg viewBox="0 0 400 290" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<ellipse cx="200" cy="281" rx="182" ry="12" fill="rgba(58,42,90,.2)"/>` +
      // corpo
      `<path d="M28 62 L44 248 A156 36 0 0 0 356 248 L372 62 Z" fill="${madeira}" stroke="${T}" stroke-width="6" stroke-linejoin="round"/>` +
      tabuas +
      `<path d="M58 112 L 70 226" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".32"/>` +
      // aro de baixo
      `<path d="M41 222 A159 36 0 0 0 359 222 L356 248 A156 36 0 0 1 44 248 Z" fill="${aro}" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M60 240 A150 32 0 0 0 150 262" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>` +
      // corda
      `<path d="${caminho}" fill="none" stroke="${T}" stroke-width="13" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<path d="${caminho}" fill="none" stroke="${corda}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>` +
      // aro de cima
      `<path d="M28 62 A172 44 0 0 0 372 62 L370 92 A170 44 0 0 1 30 92 Z" fill="${aro}" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M48 92 A160 40 0 0 0 140 124" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>` +
      nos +
      // pele de couro
      `<ellipse cx="200" cy="62" rx="172" ry="44" fill="${pele}" stroke="${T}" stroke-width="6"/>` +
      `<ellipse cx="200" cy="64" rx="146" ry="34" fill="none" stroke="#E4C48C" stroke-width="4"/>` +
      `<ellipse cx="200" cy="66" rx="52" ry="12" fill="#EED4A4"/>` +
      `<path d="M78 46 Q 120 30 176 28" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".7"/>` +
      `</svg>`;
  }
  /** Risquinhos de som que saem dos lados do tambor (lado: -1 esquerda, 1 direita). */
  function desenhoSom(lado) {
    const d = lado > 0 ? 'M14 20 Q 40 55 14 90 M38 8 Q 72 55 38 102' : 'M56 20 Q 30 55 56 90 M32 8 Q -2 55 32 102';
    return `<svg viewBox="0 0 70 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<path d="${d}" fill="none" stroke="${T}" stroke-width="12" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="#FFC93C" stroke-width="6" stroke-linecap="round"/></svg>`;
  }

  // ======================================================================== uma rodada
  function rodada(ctx) {
    U.estilo('tambor', CSS);
    const params = ctx.params || {};
    const palavra = sortear(params, memoriaDe(params));
    const silabas = palavra.silabas.slice();
    const k = silabas.length;
    const nome = PC.palavras.nome(palavra);
    const Nome = maiuscula(nome);
    const falaSil = silabas.map(s => PC.palavras.falaSilaba(s));

    let destruido = false, resolvida = false, contando = false, liberado = !ctx.demo;
    let n = 0;                    // bolinhas acesas (toques da criança)
    let ajudaAC = null, ocupacoes = 0, marcado = false;
    const dicas = new Set();

    // ------------------------------------------------------------ cena
    const camada = U.el('div', { class: 'pc-tambor' });
    ctx.palco.appendChild(camada);

    const cartao = U.el('div', { class: 'pc-tambor-cartao', 'aria-label': nome }, U.el('div', { class: 'fig', html: PC.palavras.desenho(palavra) }));
    cartao.dataset.teste = 'figura';
    const trilho = U.el('div', { class: 'pc-tambor-trilho' });
    const vagas = [];
    for (let i = 0; i < MAX_TOQUES; i++) {
      const v = U.el('div', { class: 'pc-tambor-vaga', style: { left: (FILA_X0 + i * VAGA_L) + 'px' } }, U.el('div', { class: 'pc-tambor-bola' }));
      v.dataset.teste = 'bolinha-' + i;
      vagas.push(v);
    }
    const tamborEl = U.el('div', { class: 'pc-tambor-desenho', html: desenhoTambor() });
    const tamborToque = U.el('div', { class: 'pc-tambor-toque', 'aria-label': 'Tambor' });
    tamborToque.dataset.teste = 'tambor';
    const ondinha = U.el('div', { class: 'pc-tambor-ondinha' });
    const somEsq = U.el('div', { class: 'pc-tambor-som', style: { left: (TAMBOR.x - 70) + 'px' }, html: desenhoSom(-1) });
    const somDir = U.el('div', { class: 'pc-tambor-som', style: { left: (TAMBOR.x + TAMBOR.l) + 'px' }, html: desenhoSom(1) });
    const bPronto = PC.ui.botaoGrande('Pronto', () => aoPronto(), { icone: 'check', cor: '#5CC84A' });
    bPronto.dataset.teste = 'pronto';
    const caixaPronto = U.el('div', { class: 'pc-tambor-botao' }, bPronto);
    caixaPronto.hidden = true;
    camada.append(cartao, trilho, ...vagas, tamborEl, ondinha, somEsq, somDir, tamborToque, caixaPronto);

    // ------------------------------------------------------------ peças de apoio
    function ocupar(v) { ocupacoes = Math.max(0, ocupacoes + (v ? 1 : -1)); if (!ctx.sinal.aborted) ctx.ocupado(ocupacoes > 0); }
    function pose(nomePose) { if (!destruido && !ctx.sinal.aborted) PC.ui.pipoca.pose(nomePose); }
    async function semPausa() { while (pausado(ctx)) await ctx.esperar(150); }
    function pulsar(el, escala = 1.1, ms = 420) {
      if (el) U.animar(el, [{ transform: 'scale(1)' }, { transform: `scale(${escala})`, offset: 0.4 }, { transform: 'scale(1)' }], { duration: ms, easing: 'ease-out' });
    }
    const podeAgir = () => !destruido && !resolvida && !contando && liberado && !ctx.sinal.aborted;
    const centroVaga = i => ({ x: FILA_X0 + i * VAGA_L + VAGA_L / 2, y: FILA_Y });
    function centroDe(el) { const r = PC.palco.retangulo(el); return { x: r.cx, y: r.cy }; }
    /** Mãozinha de demonstração (some sozinha). */
    function mao(em) {
      const d = PC.ui.dica(em, null, { vezes: 1, raiz: ctx.palco });
      dicas.add(d);
      return d;
    }
    /** O balão mostra a sílaba escrita numa plaquinha creme, ao lado do texto. */
    const plaquinha = s => U.el('div', { class: 'pc-tambor-silaba', text: s });

    /** Atualiza as bolinhas e o botão Pronto. */
    function atualizar() {
      vagas.forEach((v, i) => v.classList.toggle('acesa', i < n));
      const ver = n > 0 && !resolvida && liberado;
      if (ver && caixaPronto.hidden) {
        caixaPronto.hidden = false;
        U.animar(bPronto, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.3, 1.6, .5, 1)' });
      } else if (!ver) caixaPronto.hidden = true;
      bPronto.disabled = contando || resolvida || !liberado;
    }
    /** Tira as marcas da conferência (verde, falta, sobra). */
    function limparMarcas() {
      if (!marcado) return;
      marcado = false;
      vagas.forEach(v => v.classList.remove('confere', 'falta', 'sobra'));
    }
    function limparAjudas() {
      if (ajudaAC) ajudaAC.abort();
      limparMarcas();
    }

    /** O tambor pula, a pele faz uma ondinha, os risquinhos de som saem dos lados e soa o "tum". */
    function tum() {
      PC.som.encaixar();
      U.animar(tamborEl, [
        { transform: 'translateY(0) scale(1, 1)' },
        { transform: 'translateY(4px) scale(1.05, .9)', offset: 0.2 },
        { transform: 'translateY(-20px) scale(.97, 1.04)', offset: 0.55 },
        { transform: 'translateY(0) scale(1, 1)' },
      ], { duration: 380, easing: 'ease-out' });
      U.animar(ondinha, [{ opacity: 0.95, transform: 'scale(.35)' }, { opacity: 0, transform: 'scale(1.6)' }], { duration: 420, easing: 'ease-out' });
      U.animar(somEsq, [{ opacity: 0, transform: 'translateX(20px)' }, { opacity: 1, transform: 'translateX(0)', offset: 0.3 }, { opacity: 0, transform: 'translateX(-24px)' }], { duration: 460, easing: 'ease-out' });
      U.animar(somDir, [{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'translateX(0)', offset: 0.3 }, { opacity: 0, transform: 'translateX(24px)' }], { duration: 460, easing: 'ease-out' });
    }
    function acender(i) {
      atualizar();
      const b = vagas[i] && vagas[i].firstChild;
      if (b) U.animar(b, [{ transform: 'scale(.6)' }, { transform: 'scale(1.18)', offset: 0.5 }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
    }
    function tremerFila() {
      U.animar(trilho, [{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(0)' }], { duration: 320 });
    }

    // ------------------------------------------------------------ toques da criança
    function bater() {
      if (!podeAgir()) return;
      limparMarcas();
      if (n >= MAX_TOQUES) { tum(); tremerFila(); return; }
      n++;
      tum();
      acender(n - 1);
    }
    function desfazer(i) {
      if (!podeAgir() || i >= n) return;
      limparMarcas();
      n--;
      PC.som.soltar();
      atualizar();
      const b = vagas[n] && vagas[n].firstChild;
      if (b) U.animar(b, [{ transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
    }
    function tocarFigura() {
      if (destruido || resolvida || contando || ctx.sinal.aborted || ajudaAC) return;
      pulsar(cartao, 1.06);
      ctx.falar(Nome + '!').catch(() => {});
    }

    // ------------------------------------------------------------ Pronto: a Pipoca bate junto e confere
    async function aoPronto() {
      if (!podeAgir() || !n) return;
      contando = true;
      ocupar(true);
      limparAjudas();
      atualizar();
      const tocados = n;
      try {
        pose('aponta');
        marcado = true;
        for (let i = 0; i < k; i++) {
          await semPausa();
          tum();
          const v = vagas[i];
          if (v) { v.classList.add(i < tocados ? 'confere' : 'falta'); pulsar(v.firstChild, 1.15, 360); }
          await Promise.all([ctx.falar(falaSil[i], { mostrar: plaquinha(silabas[i]) }), ctx.esperar(650)]);
          await ctx.esperar(220);
        }
        for (let i = k; i < tocados; i++) vagas[i].classList.add('sobra');
        if (tocados === k) {
          pulsar(cartao, 1.08, 520);
          if (k > 1) await ctx.falar(Nome + '!');          // de um pedaço só, a sílaba já foi a palavra
          await semPausa();
          resolvida = true;
          pose('normal');
          ctx.acertou();
          return;
        }
        pose('normal');
        contando = false;
        ocupar(false);
        atualizar();
        ctx.errou({ fala: `${Nome} tem ${pedacos(k)}: ${falaSil.join(', ')}.` });
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
        if (!destruido && !resolvida && contando) { contando = false; ocupar(false); atualizar(); }
      }
    }

    // ------------------------------------------------------------ ajuda (2º erro seguido): a palavra bem devagar
    async function ajudar(nivel) {
      if (nivel >= 3 || !podeAgir() || ajudaAC) return;
      const ac = new AbortController();
      const aoSair = () => ac.abort();
      ctx.sinal.addEventListener('abort', aoSair, { once: true });
      ac.signal.addEventListener('abort', () => { if (!destruido && !ctx.sinal.aborted) PC.ui.pipoca.calar(); }, { once: true });
      ajudaAC = ac;
      ocupar(true);
      const falar = async (texto, op) => {
        if (ac.signal.aborted) throw U.abortado();
        await ctx.falar(texto, op);
        if (ac.signal.aborted) throw U.abortado();
      };
      try {
        pose('fala');
        for (let i = 0; i < k; i++) {
          pulsar(cartao, 1.05, 500);
          await falar(falaSil[i], { mostrar: plaquinha(silabas[i]) });
          await ctx.esperar(450);
          if (ac.signal.aborted) throw U.abortado();
        }
        if (k > 1) { pulsar(cartao, 1.08, 520); await falar(Nome + '!'); }
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ctx.sinal.removeEventListener('abort', aoSair);
        if (ajudaAC === ac) ajudaAC = null;
        ocupar(false);
        if (!destruido && !ctx.sinal.aborted && !contando) pose('normal');
      }
    }

    // ------------------------------------------------------------ instrução e demonstração
    function instrucao(curta) {
      if (destruido || resolvida || contando || ctx.sinal.aborted) return Promise.resolve();
      if (ajudaAC) ajudaAC.abort();
      pulsar(cartao, 1.06);
      // nas rodadas seguintes a criança já sabe o que fazer: só o nome da figura
      return ctx.falar(curta ? Nome + '!' : `Bata no tambor: um toque para cada pedaço. ${Nome}!`).catch(() => {});
    }

    /**
     * Demonstração (1ª rodada com demo): a mãozinha bate no tambor uma vez por sílaba (a Pipoca fala cada uma e as
     * bolinhas acendem), depois toca nas bolinhas para apagar e libera a criança. Durante a demonstração os toques
     * da criança não mudam nada.
     */
    async function demonstrar() {
      ocupar(true);
      try {
        await instrucao();
        pose('aponta');
        for (let i = 0; i < k; i++) {
          await semPausa();
          mao(PELE);
          await ctx.esperar(560);                 // o momento em que a mãozinha encosta
          n++; tum(); acender(n - 1);
          await Promise.all([ctx.falar(falaSil[i], { mostrar: plaquinha(silabas[i]) }), ctx.esperar(900)]);
        }
        await ctx.esperar(300);
        let primeira = true;
        while (n > 0) {
          await semPausa();
          const fala = primeira ? ctx.falar('Para apagar, toque na bolinha.') : null;
          primeira = false;
          mao(centroVaga(n - 1));
          await ctx.esperar(560);
          n--; PC.som.soltar(); atualizar();
          await Promise.all([fala, ctx.esperar(800)]);
        }
        pose('normal');
        await ctx.falar('Agora é sua vez!');
      } finally {
        n = 0;
        if (!destruido) { liberado = true; atualizar(); }
        ocupar(false);
      }
    }

    // ------------------------------------------------------------ gesto certo, resolver, estado
    function proximoGesto() {
      if (destruido || resolvida || contando || !liberado) return null;
      if (n < k) return { tipo: 'tocar', em: { x: CX, y: PELE.y + 40 } };
      if (n > k) return { tipo: 'tocar', em: centroVaga(n - 1) };
      if (!caixaPronto.hidden) return { tipo: 'tocar', em: centroDe(bPronto) };
      return null;
    }

    /** Testes: a fileira fica certa na hora e a rodada termina (um único ctx.acertou()). */
    function resolver() {
      if (destruido || resolvida) return;
      resolvida = true;
      limparAjudas();
      n = k;
      try { atualizar(); } catch (e) { console.error(e); }
      ctx.acertou();
    }

    function estado() {
      return {
        palavra: palavra.texto, silabas: silabas.slice(), alvo: k, n, liberado, contando, resolvida,
        ajudando: !!ajudaAC, pronto: !caixaPronto.hidden, bichos: !!params.bichos,
        livre: podeAgir() && !PC.toquesBloqueados(),
      };
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      if (ajudaAC) ajudaAC.abort();
      offToque();
      dicas.forEach(d => { try { d.parar(); } catch (e) { /* já parou */ } });
      dicas.clear();
      camada.remove();
    }

    // ------------------------------------------------------------ ligações
    const offToque = PC.on('toque', () => { if (!contando) limparAjudas(); });
    PC.aoTocar(tamborToque, () => bater(), { intervalo: 110, som: false });
    vagas.forEach((v, i) => PC.aoTocar(v, () => desfazer(i), { intervalo: 200, som: false }));
    PC.aoTocar(cartao, () => tocarFigura(), { som: false });
    atualizar();

    // início: instrução (e, na 1ª rodada com demo, a demonstração antes de liberar)
    (async () => {
      try {
        await ctx.esperar(300);
        if (ctx.demo) await demonstrar();
        else instrucao(!ctx.primeiraDaVez);
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        if (!destruido) { liberado = true; atualizar(); }
      }
    })();

    return { instrucao, proximoGesto, ajudar, resolver, estado, destruir };
  }

  PC.atividades.registrar('tambor', {
    titulo: 'Tambor das sílabas',
    icone: 'tambor',
    cenario: 'prado',
    totalRodadas,
    rodada,
  });

  // ---------------------------------------------------------------- medalhão do mapa: tamborzinho e bolinhas
  if (PC.arte && PC.arte.registrarMedalhao) {
    PC.arte.registrarMedalhao('tambor', {
      fundo: ['#FFEBD6', '#B9E59A', '#94D373'],
      cena(p) {
        const M = PC.arte.pecasMedalhao || {};
        const C = M.T || T;
        const qtd = p && Array.isArray(p.silabas) ? U.limitar(inteiro(p.silabas[1], 3), 2, 4) : 3;
        const acesas = Math.max(1, qtd - 1);
        // bolinhas: uma por pedaço, a última ainda apagada
        const passo = 17, x0 = 50 - ((qtd - 1) * passo) / 2;
        let bolas = '';
        for (let i = 0; i < qtd; i++) {
          const x = x0 + i * passo;
          bolas += i < acesas
            ? `<circle cx="${x}" cy="23" r="6.8" fill="#FFC93C" stroke="${C}" stroke-width="2.2"/><ellipse cx="${x - 2.2}" cy="20.6" rx="2.4" ry="1.4" fill="#fff" opacity=".75"/>`
            : `<circle cx="${x}" cy="23" r="6.8" fill="#fff" fill-opacity=".7" stroke="${C}" stroke-width="2" stroke-dasharray="2.6 2.2"/>`;
        }
        const yC = x => 57 + 8 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 50) / 27, 2)));
        const yB = x => 80 + 6 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 50) / 25, 2)));
        const zig = [[29, yC(29)], [39, yB(39)], [50, yC(50)], [61, yB(61)], [71, yC(71)]];
        const zz = 'M' + zig.map(q => q[0] + ' ' + q[1].toFixed(1)).join(' L ');
        return bolas +
          `<ellipse cx="50" cy="90" rx="30" ry="3" fill="rgba(58,42,90,.2)"/>` +
          `<path d="M22 50 L25 84 A25 6 0 0 0 75 84 L78 50 Z" fill="#D99A5B" stroke="${C}" stroke-width="2.4" stroke-linejoin="round"/>` +
          `<path d="M24 79 A26 6 0 0 0 76 79 L75 85 A25 6 0 0 1 25 85 Z" fill="#E8434D" stroke="${C}" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="${zz}" fill="none" stroke="${C}" stroke-width="4.4" stroke-linejoin="round" stroke-linecap="round"/>` +
          `<path d="${zz}" fill="none" stroke="#FFC93C" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
          `<path d="M22 50 A28 8 0 0 0 78 50 L77.6 56 A27.6 8 0 0 1 22.4 56 Z" fill="#E8434D" stroke="${C}" stroke-width="2" stroke-linejoin="round"/>` +
          `<ellipse cx="50" cy="50" rx="28" ry="8" fill="#F6E3BC" stroke="${C}" stroke-width="2.4"/>` +
          `<path d="M31 47 Q 38 44 47 43.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".75"/>` +
          // baquetinha batendo
          `<path d="M86 30 L 58 46" stroke="${C}" stroke-width="5.4" stroke-linecap="round"/>` +
          `<path d="M86 30 L 58 46" stroke="#C98A55" stroke-width="2.6" stroke-linecap="round"/>` +
          `<circle cx="57" cy="46.5" r="4.4" fill="#FF7A6B" stroke="${C}" stroke-width="2"/>` +
          // risquinhos de som
          `<path d="M13 44 Q 9 52 13 60 M84 54 Q 88 60 84 67" fill="none" stroke="${C}" stroke-width="2.2" stroke-linecap="round"/>` +
          (M.brilho ? M.brilho(88, 16, 4.5, '#fff') : '');
      },
    });
  }
})();
