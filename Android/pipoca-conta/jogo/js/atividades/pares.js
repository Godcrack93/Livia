/* Pipoca Aprende — atividade "pares" (PROJETO.md 5.8 e 5.13): pares de letras, maiúscula e minúscula.
   Um galho atravessa o alto da tela com ninhos de gravetos, fofos; de cada ninho pende uma plaquinha de madeira com a
   letra MAIÚSCULA. Embaixo, no chão, ovinhos de cores pastel com a letra minúscula (Fredoka 700: o "a" e o "g" já são
   de forma escolar), em ordem embaralhada. A cor dos ovinhos é sorteada e nunca indica a resposta.
   Jogar: arrastar o ovinho até o ninho da mesma letra OU tocar no ovinho (ele sobe, iluminado, e a Pipoca diz o nome
   dele) e depois no ninho. Certo: o ovinho encaixa no ninho com um pulinho, "Bê grande e bê pequeno!" e ctx.avancou().
   Errado: o ovinho volta para o chão e a moldura fala o retorno "Esse é o dê pequeno." (ctx.errou). Soltar longe dos
   ninhos (ou num ninho já ocupado) só devolve o ovinho, sem contar erro. Todos os pares: os ovinhos balançam nos
   ninhos e ctx.acertou(). Tocar num ninho sem ovinho escolhido: a plaquinha balança e a Pipoca diz "Bê grande.".
   Sorteio: params.pares letras de params.letras, de preferência ainda não usadas na estação; na 1ª rodada nunca duas
   letras "espelhadas" (b, d, p, q) juntas. Os ovinhos nunca ficam na mesma ordem dos ninhos.
   Ajuda (2º erro seguido): o ninho certo do próximo ovinho (o escolhido, o do último erro ou o primeiro que falta)
   brilha, o ovinho pula e a Pipoca diz "O bê pequeno vai no ninho do bê grande!". 3º erro e inatividade: mãozinha
   com proximoGesto(). Demonstração (1ª rodada com demo): a mãozinha leva uma cópia clarinha de um ovinho até o ninho.
   Testes no navegador: PC.debug.telaOcupada fica verdadeiro enquanto um ovinho voa, a ajuda fala ou a demonstração roda.
   params: { letras: [...], pares: 2 | 3 | 4, rodadas, demo } */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;
  const T = '#3A2A5A';

  // ---------------------------------------------------------------- medidas (palco virtual 1600×900)
  const GALHO_Y = 336;                       // linha de cima do galho, onde os ninhos se apoiam
  const NINHO_L = 240, NINHO_A = 120;        // desenho do ninho (viewBox 0 0 240 120)
  const NINHO_TOPO = GALHO_Y + 12 - 118;     // o fundo da cesta (y 118 no desenho) afunda um pouco no galho
  const PLACA_L = 160, PLACA_A = 156;        // plaquinha pendurada (cordinhas + tábua)
  const PLACA_TOPO = GALHO_Y + 14;
  const PLACA_CY = PLACA_TOPO + 92;          // centro da tábua (onde fica a letra)
  const ALVO_TOPO = 172, ALVO_BASE = 512;    // área de toque/soltura de cada ninho (ninho + plaquinha)
  const OVO_L = 120, OVO_A = 150;            // desenho do ovinho (viewBox 0 0 120 150)
  const OVO_TOQUE_L = 172, OVO_TOQUE_A = 206;
  const OVO_Y = 690;                         // centro dos ovinhos no chão
  const ESCALA_NINHO = 0.92;                 // o ovinho fica um pouco menor dentro do ninho
  const ASSENTO_Y = GALHO_Y - 24 - OVO_A * ESCALA_NINHO / 2;  // centro do ovinho sentado no ninho (a letra fica acima da borda)
  const ERGUER = 20;                         // quanto o ovinho escolhido (toque) sobe
  const ACEITA = 70, ACEITA_BAIXO = 24;      // "ímã": aceita a soltura até esta distância da área do ninho (menos por baixo)
  const NINHOS_X = { 2: [830, 1190], 3: [700, 1010, 1320], 4: [650, 910, 1170, 1430] };
  const OVOS_X = { 2: [760, 1140], 3: [640, 940, 1240], 4: [540, 810, 1080, 1350] };
  const VOGAIS = ['A', 'E', 'I', 'O', 'U'];
  const ESPELHADAS = ['B', 'D', 'P', 'Q'];   // não aparecem duas juntas na 1ª rodada (b/d, p/q, b/p, d/q)
  const PASTEIS = ['#FFD3DF', '#CBE8FF', '#D5F2C4', '#FFF0B0', '#E4D8FF', '#FFDDC4', '#C9F1EA'];
  const memorias = new WeakMap();            // por estação jogada (o objeto params é o mesmo em todas as rodadas)

  const CSS = `
    .pc-pares { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
    .pc-pares-galho { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; pointer-events: none; z-index: 0; overflow: visible; }
    .pc-pares-luz { position: absolute; z-index: 1; width: 276px; height: 344px; margin: 0 0 0 -138px; border-radius: 70px;
      background: rgba(255, 240, 150, .85); border: 7px solid #FFC93C; opacity: 0; pointer-events: none; transition: opacity .15s; }
    .pc-pares-luz.ima { opacity: 1; background: rgba(255, 226, 110, .9); border-color: #fff; }
    .pc-pares-luz.ajuda { opacity: 1; animation: pcParesBrilho 1s ease-in-out infinite; }
    @keyframes pcParesBrilho { 50% { opacity: .45; } }
    .pc-pares-ninho-fundo, .pc-pares-ninho-frente { position: absolute; width: ${NINHO_L}px; height: ${NINHO_A}px; overflow: visible; pointer-events: none; }
    .pc-pares-ninho-fundo { z-index: 1; }
    .pc-pares-ninho-frente { z-index: 3; }
    .pc-pares-placa { position: absolute; z-index: 3; width: ${PLACA_L}px; height: ${PLACA_A}px; pointer-events: none; transform-origin: 50% 0; }
    .pc-pares-placa svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
    .pc-pares-placa-letra { position: absolute; left: 0; right: 0; top: 38px; height: 108px; display: grid; place-items: center;
      padding-top: 6px; font: 700 94px/1 var(--fonte); color: ${T}; }
    .pc-pares-alvo { position: absolute; z-index: 4; border-radius: 40px; cursor: pointer; }
    .pc-pares-ovo { position: absolute; z-index: 2; width: ${OVO_TOQUE_L}px; height: ${OVO_TOQUE_A}px;
      margin: ${-OVO_TOQUE_A / 2}px 0 0 ${-OVO_TOQUE_L / 2}px; border-radius: 50%; cursor: pointer; }
    .pc-pares-ovo.no-ninho { pointer-events: none; }
    .pc-pares-ovo.arrastando, .pc-pares-ovo.voando { z-index: 20; }
    .pc-pares-sombra { position: absolute; left: ${(OVO_TOQUE_L - 112) / 2}px; top: ${(OVO_TOQUE_A + OVO_A) / 2 - 16}px; width: 112px; height: 26px;
      border-radius: 50%; background: rgba(58, 42, 90, .2); pointer-events: none; transition: opacity .15s; }
    .pc-pares-ovo.arrastando .pc-pares-sombra, .pc-pares-ovo.voando .pc-pares-sombra, .pc-pares-ovo.no-ninho .pc-pares-sombra { opacity: 0; }
    .pc-pares-ergue { position: absolute; left: ${(OVO_TOQUE_L - OVO_L) / 2}px; top: ${(OVO_TOQUE_A - OVO_A) / 2}px; width: ${OVO_L}px; height: ${OVO_A}px;
      transition: transform .16s ease-out; }
    .pc-pares-ovo.sel .pc-pares-ergue { transform: translateY(-${ERGUER}px); }
    .pc-pares-anel { position: absolute; left: -22px; top: -18px; right: -22px; bottom: -18px; border-radius: 50%;
      background: rgba(255, 255, 255, .75); border: 7px solid #FFC93C; box-shadow: 0 0 0 4px ${T}; opacity: 0; transition: opacity .15s; }
    .pc-pares-ovo.sel .pc-pares-anel { opacity: 1; animation: pcParesBrilho 1.1s ease-in-out infinite; }
    .pc-pares-corpo { position: absolute; left: 0; top: 0; width: 100%; height: 100%; transform-origin: 50% 92%; }
    .pc-pares-giro { position: absolute; left: 0; top: 0; width: 100%; height: 100%; transform-origin: 50% 60%; transition: transform .25s ease-out; }
    .pc-pares-giro svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
    .pc-pares-ovo-letra { position: absolute; left: 0; right: 0; top: 34px; height: 104px; display: grid; place-items: center;
      font: 700 90px/1 var(--fonte); color: ${T}; }
    .pc-pares-copia { position: absolute; left: 0; top: 0; z-index: 19; width: ${OVO_L}px; height: ${OVO_A}px; margin: ${-OVO_A / 2}px 0 0 ${-OVO_L / 2}px;
      opacity: 0; pointer-events: none; }
    .pc-pares-copia svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
    .pc-pares-fichas { display: flex; align-items: center; gap: 16px; }
    .pc-pares-ficha-placa { display: grid; place-items: center; width: 86px; height: 78px; padding-top: 5px; border-radius: 14px;
      background: #E9B877; border: 4px solid ${T}; box-shadow: inset 0 -6px 0 #C98A55; font: 700 60px/1 var(--fonte); color: ${T}; }
    .pc-pares-ficha-ovo { display: grid; place-items: center; width: 66px; height: 82px; padding-top: 4px; border: 4px solid ${T};
      border-radius: 50% 50% 50% 50% / 58% 58% 42% 42%; font: 700 54px/1 var(--fonte); color: ${T}; }
  `;

  // ---------------------------------------------------------------- utilidades
  const inteiro = (v, padrao) => { const n = Math.round(Number(v)); return isFinite(n) ? n : padrao; };
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);
  const nomeLetra = L => PC.palavras.falaLetra(L);                 // 'B' -> 'bê'
  const minuscula = L => String(L).toLowerCase();

  // ---------------------------------------------------------------- falas (todas as frases da atividade)
  const FALA = {
    instrucao: 'Leve cada ovinho para o ninho da mesma letra!',
    acerto: L => `${maiuscula(nomeLetra(L))} grande e ${nomeLetra(L)} pequeno!`,      // "Bê grande e bê pequeno!"
    erro: L => `Esse é o ${nomeLetra(L)} pequeno.`,                                   // "Esse é o dê pequeno."
    ovo: L => `${maiuscula(nomeLetra(L))} pequeno.`,                                  // tocar no ovinho
    ninho: L => `${maiuscula(nomeLetra(L))} grande.`,                                 // tocar no ninho sem ovinho escolhido
    ajuda: L => `O ${nomeLetra(L)} pequeno vai no ninho do ${nomeLetra(L)} grande!`,
  };

  // ---------------------------------------------------------------- sorteio
  function memoriaDe(params) {
    let m = memorias.get(params);
    if (!m) { m = { usadas: [], ultima: '' }; memorias.set(params, m); }
    return m;
  }

  function listaDeLetras(params) {
    const fonte = Array.isArray(params.letras) && params.letras.length ? params.letras : VOGAIS;
    const r = [];
    fonte.forEach(l => { const L = String(l).trim().toUpperCase().charAt(0); if (/[A-Z]/.test(L) && r.indexOf(L) < 0) r.push(L); });
    return r.length >= 2 ? r : VOGAIS.slice();
  }

  /** Letras da rodada: de preferência ainda não usadas na estação; na 1ª rodada, nunca duas "espelhadas" juntas. */
  function sortearLetras(params, indice, mem) {
    const lista = listaDeLetras(params);
    const k = U.limitar(inteiro(params.pares, 3), 2, Math.min(4, lista.length));
    let livres = lista.filter(L => mem.usadas.indexOf(L) < 0);
    if (livres.length === 0) { mem.usadas = []; livres = lista.slice(); }
    let escolha = null;
    for (let t = 0; t < 120; t++) {
      const usadas = lista.filter(L => livres.indexOf(L) < 0);
      const c = U.embaralhar(livres).concat(U.embaralhar(usadas)).slice(0, k);
      if (indice === 0 && c.filter(L => ESPELHADAS.indexOf(L) >= 0).length > 1) continue;
      if (c.slice().sort().join() === mem.ultima && t < 60) continue;
      escolha = c;
      break;
    }
    if (!escolha) escolha = U.embaralhar(lista).slice(0, k);
    escolha.forEach(L => { if (mem.usadas.indexOf(L) < 0) mem.usadas.push(L); });
    mem.ultima = escolha.slice().sort().join();
    return escolha;
  }

  /** Ordem dos ovinhos no chão: nunca a mesma dos ninhos (e, com 3 ou mais, no máximo um embaixo do seu ninho). */
  function ordemDosOvos(k) {
    const base = []; for (let i = 0; i < k; i++) base.push(i);
    let melhor = null;
    for (let t = 0; t < 60; t++) {
      const o = U.embaralhar(base);
      const fixos = o.filter((v, i) => v === i).length;
      if (fixos === 0) return o;
      if (fixos <= 1 && k >= 3 && !melhor) melhor = o;
    }
    return melhor || base.map((v, i) => base[(i + 1) % k]);
  }

  // ---------------------------------------------------------------- desenhos (SVG próprios, contorno #3A2A5A, sem filtros)
  /** Galho que atravessa o alto da tela, saindo da borda direita, com folhinhas. */
  function svgGalho(x0) {
    const y = GALHO_Y, folha = (x, yy, giro, cor) =>
      `<path transform="translate(${x} ${yy}) rotate(${giro})" d="M0 0 C 10 -16 34 -20 50 -8 C 36 6 14 10 0 0 Z" fill="${cor}" stroke="${T}" stroke-width="4" stroke-linejoin="round"/>` +
      `<path transform="translate(${x} ${yy}) rotate(${giro})" d="M4 -1 C 18 -6 32 -8 44 -7" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>`;
    return `<svg class="pc-pares-galho" viewBox="0 0 1600 900" width="1600" height="900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M${x0} ${y + 16} C ${x0 + 40} ${y + 2}, ${x0 + 140} ${y}, ${x0 + 300} ${y + 4} C 900 ${y + 10}, 1200 ${y - 2}, 2600 ${y - 14}
        L 2600 ${y + 28} C 1200 ${y + 32}, 900 ${y + 36}, ${x0 + 300} ${y + 30} C ${x0 + 140} ${y + 27}, ${x0 + 50} ${y + 26}, ${x0} ${y + 16} Z"
        fill="#9A6338" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M${x0 + 60} ${y + 12} C ${x0 + 200} ${y + 9}, 900 ${y + 16}, 1640 ${y + 4}" fill="none" stroke="#C08A57" stroke-width="5" stroke-linecap="round" opacity=".8"/>
      <path d="M${x0 + 120} ${y + 22} q 40 4 80 0 M${x0 + 520} ${y + 24} q 50 4 100 0 M1300 ${y + 22} q 40 4 80 0" fill="none" stroke="#7A4A26" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M${x0 + 30} ${y + 14} C ${x0 + 6} ${y - 8}, ${x0 - 4} ${y - 22}, ${x0 - 12} ${y - 34}" fill="none" stroke="${T}" stroke-width="11" stroke-linecap="round"/>
      <path d="M${x0 + 30} ${y + 14} C ${x0 + 6} ${y - 8}, ${x0 - 4} ${y - 22}, ${x0 - 12} ${y - 34}" fill="none" stroke="#9A6338" stroke-width="5" stroke-linecap="round"/>
      ${folha(x0 - 12, y - 34, -120, '#5CC84A')}${folha(x0 - 10, y - 32, -40, '#4E9E33')}${folha(x0 + 6, y + 22, 150, '#5CC84A')}
      ${folha(1560, y + 30, 120, '#4E9E33')}${folha(1530, y - 4, -70, '#5CC84A')}
    </svg>`;
  }

  /** Parte de trás do ninho (fica atrás dos ovinhos): a boca da cesta e o fundo fofinho. */
  function svgNinhoFundo() {
    return `<svg viewBox="0 0 ${NINHO_L} ${NINHO_A}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="120" cy="52" rx="110" ry="36" fill="#8A5A30" stroke="${T}" stroke-width="5"/>
      <path d="M22 46 C 50 22 190 22 218 46" fill="none" stroke="#B98249" stroke-width="7" stroke-linecap="round"/>
      <path d="M40 38 C 80 26 160 26 200 38" fill="none" stroke="#D6A160" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="120" cy="60" rx="90" ry="23" fill="#5E3A1E"/>
      <path d="M52 62 q 14 -10 28 0 q 14 -10 28 0 q 14 -10 28 0 q 14 -10 28 0 q 14 -10 28 0" fill="none" stroke="#F4E2C8" stroke-width="6" stroke-linecap="round" opacity=".55"/>
    </svg>`;
  }

  /** Parte da frente do ninho (fica na frente dos ovinhos): a borda fofa de gravetos trançados. */
  function svgNinhoFrente() {
    // borda de cima ondulada (fofa): bolinhas de palha ao longo da boca do ninho
    let fofo = '';
    for (let i = 0; i <= 10; i++) {
      const s = i / 10, x = 14 + 212 * s, y = 56 + 30 * Math.sin(Math.PI * s);
      fofo += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 2 ? 13 : 15}"/>`;
    }
    return `<svg viewBox="0 0 ${NINHO_L} ${NINHO_A}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g fill="#B07A43" stroke="${T}" stroke-width="5">${fofo}</g>
      <path d="M4 56 C 4 104, 60 118, 120 118 C 180 118, 236 104, 236 56 C 220 80, 176 90, 120 90 C 64 90, 20 80, 4 56 Z"
        fill="#B07A43" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>
      <g fill="#B07A43">${fofo}</g>
      <g fill="none" stroke-linecap="round">
        <path d="M18 70 C 60 100, 150 108, 222 74" stroke="#D9A35B" stroke-width="6"/>
        <path d="M26 88 C 80 110, 170 110, 214 90" stroke="#8A5A30" stroke-width="5"/>
        <path d="M14 60 C 70 92, 170 96, 228 62" stroke="#8A5A30" stroke-width="4"/>
        <path d="M40 100 C 90 92, 150 94, 200 104" stroke="#E7BE7A" stroke-width="4"/>
        <path d="M60 80 l 30 22 M120 92 l 26 -18 M170 84 l 24 20 M84 104 l 22 -16" stroke="#7A4A26" stroke-width="3.5"/>
      </g>
      <path d="M0 64 l -14 -10 M240 62 l 16 -12 M30 106 l -14 8 M214 104 l 16 6" stroke="${T}" stroke-width="9" stroke-linecap="round"/>
      <path d="M0 64 l -14 -10 M240 62 l 16 -12 M30 106 l -14 8 M214 104 l 16 6" stroke="#B07A43" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M44 74 C 60 84, 80 90, 100 92" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>
    </svg>`;
  }

  /** Plaquinha de madeira pendurada por duas cordinhas (a letra vai por cima, em HTML). */
  function svgPlaca() {
    return `<svg viewBox="0 0 ${PLACA_L} ${PLACA_A}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M44 0 L 50 40 M116 0 L 110 40" stroke="${T}" stroke-width="8" stroke-linecap="round"/>
      <path d="M44 0 L 50 40 M116 0 L 110 40" stroke="#E8D3A8" stroke-width="3.5" stroke-linecap="round"/>
      <rect x="6" y="36" width="148" height="114" rx="20" fill="#E9B877" stroke="${T}" stroke-width="5"/>
      <path d="M14 136 C 50 142, 110 142, 146 134" fill="none" stroke="#C98A55" stroke-width="7" stroke-linecap="round"/>
      <path d="M20 58 C 40 54, 56 60, 72 56 M96 128 C 112 124, 126 130, 140 126" fill="none" stroke="#D29A5F" stroke-width="3" stroke-linecap="round"/>
      <circle cx="50" cy="48" r="5" fill="#8A5A30" stroke="${T}" stroke-width="2.5"/>
      <circle cx="110" cy="48" r="5" fill="#8A5A30" stroke="${T}" stroke-width="2.5"/>
      <rect x="18" y="64" width="12" height="40" rx="6" fill="#fff" opacity=".35"/>
    </svg>`;
  }

  /** Ovinho (viewBox 0 0 120 150): cor pastel, pintinhas e brilho. */
  function svgOvo(cor) {
    const pinta = U.tom(cor, -0.12);
    return `<svg viewBox="0 0 ${OVO_L} ${OVO_A}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M60 5 C 96 5 115 66 115 96 C 115 127 92 145 60 145 C 28 145 5 127 5 96 C 5 66 24 5 60 5 Z" fill="${cor}" stroke="${T}" stroke-width="5"/>
      <g fill="${pinta}"><circle cx="86" cy="40" r="5"/><circle cx="98" cy="62" r="3.5"/><circle cx="24" cy="112" r="4"/><circle cx="96" cy="118" r="4.5"/><circle cx="20" cy="74" r="3"/></g>
      <ellipse cx="36" cy="40" rx="9" ry="17" transform="rotate(22 36 40)" fill="#fff" opacity=".7"/>
      <circle cx="28" cy="66" r="4" fill="#fff" opacity=".7"/>
    </svg>`;
  }

  /** Fichinhas para o balão: a plaquinha (maiúscula) e/ou o ovinho (minúscula). */
  function fichas(L, { placa = true, ovo = true, cor = '#FFF0B0' } = {}) {
    const caixa = U.el('div', { class: 'pc-pares-fichas', 'aria-hidden': 'true' });
    if (placa) caixa.appendChild(U.el('span', { class: 'pc-pares-ficha-placa', text: L }));
    if (ovo) caixa.appendChild(U.el('span', { class: 'pc-pares-ficha-ovo', text: minuscula(L), style: { background: cor } }));
    return caixa;
  }

  // ---------------------------------------------------------------- a rodada
  function rodada(ctx) {
    U.estilo('pares', CSS);
    const params = ctx.params || {};
    const letras = sortearLetras(params, ctx.indice || 0, memoriaDe(params));
    const k = letras.length;
    const ordem = ordemDosOvos(k);                     // ordem[i] = índice do ninho do ovinho na posição i do chão
    const cores = U.embaralhar(PASTEIS).slice(0, k);
    const xsNinho = NINHOS_X[k], xsOvo = OVOS_X[k];

    let destruido = false, resolvida = false, voando = 0, ajudando = false, interagiu = false, terminando = false;
    let sel = null, ima = null, foco = null, ajudaNinho = null, demoAC = null, erros = 0;
    const desligares = [];

    const raiz = U.el('div', { class: 'pc-pares' });
    raiz.innerHTML = svgGalho(xsNinho[0] - 190);
    ctx.palco.appendChild(raiz);

    const podeAgir = () => !destruido && !resolvida && !terminando && !ctx.sinal.aborted && voando === 0;

    // ------------------------------------------------------------ ninhos
    const ninhos = letras.map((L, i) => {
      const x = xsNinho[i];
      const luz = U.el('div', { class: 'pc-pares-luz', style: { left: x + 'px', top: (ALVO_TOPO + 2) + 'px' } });
      const fundo = U.el('div', { class: 'pc-pares-ninho-fundo', html: svgNinhoFundo(), style: { left: (x - NINHO_L / 2) + 'px', top: NINHO_TOPO + 'px' } });
      const frente = U.el('div', { class: 'pc-pares-ninho-frente', html: svgNinhoFrente(), style: { left: (x - NINHO_L / 2) + 'px', top: NINHO_TOPO + 'px' } });
      const placa = U.el('div', { class: 'pc-pares-placa', html: svgPlaca(), style: { left: (x - PLACA_L / 2) + 'px', top: PLACA_TOPO + 'px' } });
      placa.appendChild(U.el('span', { class: 'pc-pares-placa-letra', text: L }));
      const larg = Math.min(250, (xsNinho[1] ? xsNinho[1] - xsNinho[0] : 300) - 10);
      const alvo = U.el('div', {
        class: 'pc-pares-alvo', teste: 'ninho-' + i, role: 'button', 'aria-label': 'Ninho da letra ' + L,
        style: { left: (x - larg / 2) + 'px', top: ALVO_TOPO + 'px', width: larg + 'px', height: (ALVO_BASE - ALVO_TOPO) + 'px' },
      });
      raiz.append(luz, fundo, frente, placa, alvo);
      const n = { i, L, x, luz, fundo, frente, placa, alvo, larg, ovo: null };
      PC.aoTocar(alvo, () => tocarNinho(n), { som: false });
      // entrada: os ninhos e as plaquinhas aparecem um depois do outro
      const atraso = 60 + i * 110;
      [fundo, frente].forEach(e => U.animar(e, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: atraso, fill: 'backwards' }));
      U.animar(placa, [{ transform: 'rotate(-14deg)', opacity: 0 }, { transform: 'rotate(8deg)', opacity: 1, offset: 0.55 }, { transform: 'rotate(0deg)', opacity: 1 }],
        { duration: 620, delay: atraso + 120, easing: 'ease-out', fill: 'backwards' });
      return n;
    });
    const assento = n => ({ x: n.x, y: ASSENTO_Y });

    // ------------------------------------------------------------ ovinhos
    const ovos = ordem.map((iNinho, pos) => {
      const L = letras[iNinho], cor = cores[pos];
      const casa = { x: xsOvo[pos], y: OVO_Y + U.aleatorio(-10, 10) };
      const giro = U.aleatorio(-4, 4);
      const el = U.el('div', {
        class: 'pc-pares-ovo', teste: 'ovo-' + pos, role: 'button', 'aria-label': 'Ovinho da letra ' + minuscula(L),
        dataset: { letra: L }, style: { left: casa.x + 'px', top: casa.y + 'px' },
      });
      const ergue = U.el('div', { class: 'pc-pares-ergue' });
      const corpo = U.el('div', { class: 'pc-pares-corpo' });
      const giroEl = U.el('div', { class: 'pc-pares-giro', html: svgOvo(cor), style: { transform: `rotate(${giro}deg)` } });
      giroEl.appendChild(U.el('span', { class: 'pc-pares-ovo-letra', text: minuscula(L) }));
      corpo.appendChild(giroEl);
      ergue.append(U.el('div', { class: 'pc-pares-anel' }), corpo);
      el.append(U.el('div', { class: 'pc-pares-sombra' }), ergue);
      raiz.appendChild(el);
      const o = { pos, L, cor, casa, giro, el, corpo, giroEl, ninho: ninhos[iNinho], colocado: false, arr: null };
      desligares.push(PC.arrastar(el, {
        podeComecar: () => podeAgir() && !o.colocado,
        aoTocar: () => tocarOvo(o),
        aoComecar: () => comecarArraste(o),
        aoMover: p => moverArraste(o, p),
        aoSoltar: p => soltarArraste(o, p),
        aoCancelar: () => cancelarArraste(o),
      }));
      U.animar(corpo, [{ transform: 'translateY(60px) scale(.4)', opacity: 0 }, { transform: 'translateY(0px) scale(1)', opacity: 1 }],
        { duration: 420, delay: 300 + pos * 110, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' });
      return o;
    });
    const restantes = () => ovos.filter(o => !o.colocado);
    /** O ovinho que a ajuda e a mãozinha mostram: o escolhido, o do último erro ou o primeiro (da esquerda) que falta. */
    const proximoOvo = () => (sel && !sel.colocado ? sel : (foco && !foco.colocado ? foco : restantes()[0] || null));

    // ------------------------------------------------------------ destaques
    function selecionar(o) { desselecionar(); sel = o; o.el.classList.add('sel'); }
    function desselecionar() { if (sel) sel.el.classList.remove('sel'); sel = null; }
    function marcarIma(n) {
      if (ima === n) return;
      if (ima) ima.luz.classList.remove('ima');
      ima = n;
      if (ima) ima.luz.classList.add('ima');
    }
    function marcarAjuda(n) {
      if (ajudaNinho) ajudaNinho.luz.classList.remove('ajuda');
      ajudaNinho = n;
      if (n) n.luz.classList.add('ajuda');
    }
    const balancarPlaca = n => U.animar(n.placa, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(7deg)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(0deg)' }], { duration: 560, easing: 'ease-in-out' });
    const pulinho = (o, altura = 22) => U.animar(o.corpo, [
      { transform: 'translateY(0px) scale(1, 1)' }, { transform: 'translateY(0px) scale(1.08, .9)', offset: 0.15 },
      { transform: `translateY(${-altura}px) scale(.95, 1.06)`, offset: 0.5 }, { transform: 'translateY(0px) scale(1.06, .93)', offset: 0.85 },
      { transform: 'translateY(0px) scale(1, 1)' }], { duration: 460, easing: 'ease-out' });

    // ------------------------------------------------------------ voo (só transform)
    function voar(o, de, para, { ms = 380, arco = null, easing = 'ease-in-out' } = {}) {
      o.el.getAnimations().forEach(a => a.cancel());
      o.el.style.left = para.x + 'px';
      o.el.style.top = para.y + 'px';
      o.el.style.transform = '';
      const dx = de.x - para.x, dy = de.y - para.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return Promise.resolve();
      const h = arco != null ? arco : Math.min(90, 20 + Math.hypot(dx, dy) * 0.12);
      const q = [];
      for (let i = 0; i <= 8; i++) {
        const s = i / 8;
        q.push({ transform: `translate(${(dx * (1 - s)).toFixed(1)}px, ${(dy * (1 - s) - h * 4 * s * (1 - s)).toFixed(1)}px)` });
      }
      return U.animar(o.el, q, { duration: ms, easing });
    }

    // ------------------------------------------------------------ toque
    function tocarOvo(o) {
      if (!podeAgir() || o.colocado) return;
      pararDemo();
      if (sel === o) { desselecionar(); PC.som.soltar(); return; }
      selecionar(o);
      PC.som.pegar();
      ctx.falar(FALA.ovo(o.L), { mostrar: fichas(o.L, { placa: false, cor: o.cor }) }).catch(() => {});
    }
    function tocarNinho(n) {
      if (!podeAgir() || PC.arrastar.ativo()) return;
      pararDemo();
      if (sel) {
        const o = sel;
        desselecionar();
        tentar(o, n, { x: o.casa.x, y: o.casa.y - ERGUER });
        return;
      }
      balancarPlaca(n);
      ctx.falar(FALA.ninho(n.L), { mostrar: fichas(n.L, { ovo: false }) }).catch(() => {});
    }

    // ------------------------------------------------------------ arraste
    /** O ninho vazio mais perto do ovinho (centro em p), se ele estiver dentro da área do ninho ou a até ACEITA dela. */
    function ninhoEm(p) {
      let melhor = null, dist = Infinity;
      for (const n of ninhos) {
        if (n.ovo) continue;
        const ddx = Math.max(0, Math.abs(p.x - n.x) - n.larg / 2);
        const ddy = Math.max(0, ALVO_TOPO - p.y, (p.y - ALVO_BASE) * ACEITA / ACEITA_BAIXO);
        const d = Math.hypot(ddx, ddy) + Math.abs(p.x - n.x) * 0.01;   // empate: o de centro mais perto
        if (d < dist) { dist = d; melhor = n; }
      }
      return melhor && dist <= ACEITA ? melhor : null;
    }
    function comecarArraste(o) {
      if (!podeAgir() || o.colocado) return;
      pararDemo();
      desselecionar();
      o.el.getAnimations().forEach(a => a.cancel());
      o.arr = { dx: 0, dy: 0 };
      o.el.classList.add('arrastando');
      o.el.style.willChange = 'transform';
      PC.som.pegar();
    }
    function moverArraste(o, p) {
      if (!o.arr) return;
      o.arr.dx = p.dx; o.arr.dy = p.dy;
      o.el.style.transform = `translate(${p.dx}px, ${p.dy}px)`;
      marcarIma(ninhoEm({ x: o.casa.x + p.dx, y: o.casa.y + p.dy }));
    }
    function encerrarArraste(o) {
      o.arr = null;
      marcarIma(null);
      o.el.classList.remove('arrastando');
      o.el.style.willChange = '';
    }
    function soltarArraste(o, p) {
      if (!o.arr) return;
      const de = { x: o.casa.x + p.dx, y: o.casa.y + p.dy };
      encerrarArraste(o);
      const n = ninhoEm(de);
      if (n && podeAgir()) { tentar(o, n, de); return; }
      // soltou longe dos ninhos: volta para o chão, sem contar como erro
      if (!destruido && !resolvida) { PC.som.soltar(); voltarParaCasa(o, de); }
    }
    function cancelarArraste(o) {
      if (!o.arr) return;
      const de = { x: o.casa.x + o.arr.dx, y: o.casa.y + o.arr.dy };
      encerrarArraste(o);
      if (destruido) return;
      if (resolvida || ctx.sinal.aborted) { o.el.style.transform = ''; return; }
      voltarParaCasa(o, de);
    }
    async function voltarParaCasa(o, de) {
      voando++;
      o.el.classList.add('voando');
      try { await voar(o, de, o.casa, { ms: 320, arco: 0, easing: 'ease-out' }); } finally {
        voando = Math.max(0, voando - 1);
        if (!o.colocado) o.el.classList.remove('voando');
      }
    }

    // ------------------------------------------------------------ conferir
    async function tentar(o, n, de) {
      if (!podeAgir() || o.colocado || n.ovo) return;
      if (n === o.ninho) { colocar(o, n, de); return; }
      // errado: o ovinho balança na frente do ninho e volta para o chão; a moldura fala o retorno
      erros++;
      foco = o;
      marcarAjuda(null);
      voando++;
      ctx.ocupado(true);
      o.el.classList.add('voando');
      try {
        const perto = { x: n.x, y: ASSENTO_Y - 30 };   // por cima do ninho, sem cobrir a plaquinha
        await voar(o, de, perto, { ms: 220, arco: 10 });
        if (destruido || ctx.sinal.aborted) return;
        await U.animar(o.corpo, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(0deg)' }],
          { duration: 380, easing: 'ease-in-out' });
        if (destruido || ctx.sinal.aborted) return;
        ctx.errou({ fala: FALA.erro(o.L), mostrar: fichas(o.L, { placa: false, cor: o.cor }) });
        PC.som.soltar();
        await voar(o, perto, o.casa, { ms: 420 });
      } finally {
        voando = Math.max(0, voando - 1);
        if (!destruido) {
          o.el.classList.remove('voando');
          if (!resolvida && !terminando && !ctx.sinal.aborted) ctx.ocupado(false);
        }
      }
    }

    function assentar(o, n) {
      o.colocado = true;
      n.ovo = o;
      o.el.classList.add('no-ninho');
      o.el.classList.remove('sel', 'voando', 'arrastando');
      o.el.removeAttribute('data-teste');
      o.el.removeAttribute('role');
      o.el.style.left = n.x + 'px';
      o.el.style.top = ASSENTO_Y + 'px';
      o.el.style.transform = '';
      o.giroEl.style.transform = `scale(${ESCALA_NINHO})`;
      if (ajudaNinho === n) marcarAjuda(null);
      if (foco === o) foco = null;
    }

    async function colocar(o, n, de) {
      voando++;
      ctx.ocupado(true);
      o.el.classList.add('voando');
      o.giroEl.style.transform = `scale(${ESCALA_NINHO})`;
      let ultimo = false;
      try {
        await voar(o, de, assento(n), { ms: 360 });
        if (destruido || ctx.sinal.aborted || o.colocado) return;
        assentar(o, n);
        PC.som.encaixar();
        pulinho(o, 26);
        balancarPlaca(n);
        ctx.avancou();
        ultimo = restantes().length === 0;
        if (ultimo) terminando = true;
      } finally {
        voando = Math.max(0, voando - 1);
        if (!destruido && !ultimo && !resolvida && !ctx.sinal.aborted) ctx.ocupado(false);
      }
      try {
        const fala = ctx.falar(FALA.acerto(o.L), { mostrar: fichas(o.L, { cor: o.cor }) });
        if (ultimo) { await fala; await terminar(); }
        else fala.catch(() => {});
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    }

    /** Todos os pares: os ovinhos balançam nos ninhos e a rodada acaba. */
    async function terminar() {
      if (destruido || resolvida || ctx.sinal.aborted) return;
      ctx.ocupado(true);
      const giros = ninhos.map((n, i) => n.ovo ? U.animar(n.ovo.corpo, [
        { transform: 'rotate(0deg)' }, { transform: 'rotate(-10deg)', offset: 0.2 }, { transform: 'rotate(9deg)', offset: 0.45 },
        { transform: 'rotate(-6deg)', offset: 0.7 }, { transform: 'rotate(0deg)' }], { duration: 760, delay: i * 90, easing: 'ease-in-out' }) : null);
      await Promise.all(giros);
      await ctx.esperar(150);
      if (destruido || resolvida) return;
      resolvida = true;
      ctx.acertou();
    }

    // ------------------------------------------------------------ instrução, demonstração e ajuda
    /** curta: começo das rodadas seguintes: os ninhos balançam, sem a frase (a criança acabou de ouvir). */
    function instrucao(curta) {
      if (destruido || resolvida || terminando || ctx.sinal.aborted || ajudando) return Promise.resolve();
      ninhos.forEach((n, i) => { if (!n.ovo) setTimeout(() => { if (!destruido) balancarPlaca(n); }, U.duracao(i * 120)); });
      if (curta === true) return Promise.resolve();
      return ctx.falar(FALA.instrucao).catch(() => {});
    }

    function proximoGesto() {
      if (!podeAgir()) return null;
      if (sel && !sel.colocado) return { tipo: 'tocar', em: { x: sel.ninho.x, y: (ALVO_TOPO + ALVO_BASE) / 2 } };
      const o = proximoOvo();
      if (!o) return null;
      return { tipo: 'arrastar', de: { x: o.casa.x, y: o.casa.y }, para: assento(o.ninho) };
    }

    /** Demonstração (1ª rodada com demo): a mãozinha leva uma cópia clarinha de um ovinho até o ninho certo (uma vez). */
    async function demonstrar() {
      const ac = new AbortController();
      demoAC = ac;
      let copia = null;
      ctx.ocupado(true);
      try {
        if (interagiu || !podeAgir() || sel || PC.arrastar.ativo()) return;
        const g = proximoGesto();
        if (!g || g.tipo !== 'arrastar') return;
        const o = proximoOvo();
        copia = U.el('div', { class: 'pc-pares-copia', html: svgOvo(o.cor) });
        copia.appendChild(U.el('span', { class: 'pc-pares-ovo-letra', text: minuscula(o.L) }));
        raiz.appendChild(copia);
        const mao = ctx.dica(g.de, g.para, { vezes: 1 });
        const quadro = (pt, op, offset) => ({ transform: `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px)`, opacity: op, offset });
        const anima = U.animar(copia, [quadro(g.de, 0, 0), quadro(g.de, 0, 0.16), quadro(g.de, 0.75, 0.22), quadro(g.para, 0.75, 0.78),
          quadro(g.para, 0.75, 0.88), quadro(g.para, 0, 1)], { duration: 1900, easing: 'ease-in-out', fill: 'forwards' });
        try {
          await Promise.race([anima, new Promise((ok, falha) => {
            if (ac.signal.aborted) falha(U.abortado());
            ac.signal.addEventListener('abort', () => falha(U.abortado()), { once: true });
          })]);
        } catch (e) {
          if (mao && mao.parar) mao.parar();
          throw e;
        }
        await U.esperar(200, ac.signal);
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        if (copia) copia.remove();
        if (demoAC === ac) demoAC = null;
        if (!destruido && !ctx.sinal.aborted && voando === 0 && !ajudando && !terminando) ctx.ocupado(false);
      }
    }
    function pararDemo() { if (demoAC) demoAC.abort(); }

    /** Ajuda que ensina (2º erro seguido): o ninho certo do próximo ovinho brilha, o ovinho pula e a Pipoca fala a letra. */
    async function ajudar(nivel) {
      if (nivel >= 3 || destruido || resolvida || terminando || ctx.sinal.aborted || ajudando) return;
      const o = proximoOvo();
      if (!o) return;
      ajudando = true;
      ctx.ocupado(true);
      pararDemo();
      marcarAjuda(o.ninho);
      balancarPlaca(o.ninho);
      pulinho(o, 30);
      PC.ui.pipoca.pose('aponta');
      try {
        await ctx.falar(FALA.ajuda(o.L), { mostrar: fichas(o.L, { cor: o.cor }) });
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ajudando = false;
        if (!destruido && !ctx.sinal.aborted) {
          PC.ui.pipoca.pose('normal');
          if (voando === 0 && !terminando) ctx.ocupado(false);
        }
      }
    }

    // qualquer toque encerra a demonstração
    const offToque = PC.on('toque', () => { interagiu = true; pararDemo(); });
    const offPausa = PC.on('atividade:pausa', () => { if (!destruido) pararDemo(); });

    // testes no navegador: {"esperar": "ocioso"} espera os voos, a ajuda e a demonstração
    let ocupadaDbg = null;
    if (!PC.modoApp && PC.debug) {
      ocupadaDbg = () => !destruido && !resolvida && !ctx.sinal.aborted && (voando > 0 || ajudando || terminando || !!demoAC);
      PC.debug.telaOcupada = ocupadaDbg;
    }

    /** Testes: põe todos os ovinhos nos ninhos na hora e termina a rodada (um único ctx.acertou()). */
    function resolver() {
      if (destruido || resolvida) return;
      resolvida = true;
      pararDemo();
      try {
        PC.arrastar.cancelarTodos();
        desselecionar(); marcarIma(null); marcarAjuda(null);
        ovos.forEach(o => { if (!o.colocado) { o.el.getAnimations().forEach(a => a.cancel()); assentar(o, o.ninho); } });
      } catch (e) { console.error(e); }
      ctx.acertou();
    }

    function estado() {
      return {
        letras: letras.slice(),
        ninhos: ninhos.map(n => ({ letra: n.L, x: n.x, ovo: n.ovo ? minuscula(n.ovo.L) : null })),
        ovos: ovos.map(o => ({ letra: minuscula(o.L), x: o.casa.x, colocado: o.colocado, ninho: o.ninho.i })),
        selecionado: sel ? sel.pos : -1, foco: foco ? foco.pos : -1, ajuda: ajudaNinho ? ajudaNinho.i : -1,
        colocados: ovos.filter(o => o.colocado).length, erros, voando, ajudando, terminando, resolvida,
      };
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      pararDemo();
      offToque(); offPausa();
      if (ocupadaDbg && PC.debug && PC.debug.telaOcupada === ocupadaDbg) PC.debug.telaOcupada = null;
      desligares.forEach(d => { try { d(); } catch (e) { console.error(e); } });
      raiz.remove();
    }

    // início: instrução e, na primeira rodada com demo, a mãozinha mostra o gesto com uma cópia do ovinho
    (async () => {
      try {
        await ctx.esperar(700);
        await instrucao(!ctx.primeiraDaVez);
        if (ctx.demo && !interagiu) await demonstrar();
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    })();

    return { instrucao, proximoGesto, ajudar, resolver, estado, destruir };
  }

  PC.atividades.registrar('pares', {
    titulo: 'Pares de letras',
    icone: 'pares',
    cenario: 'floresta',
    totalRodadas: params => U.limitar(inteiro(params && params.rodadas, 2), 1, 10),
    rodada,
  });

  // ---------------------------------------------------------------- medalhão do mapa: um ninho com "A" e um ovinho "a"
  if (PC.arte && PC.arte.registrarMedalhao) {
    PC.arte.registrarMedalhao('pares', {
      fundo: ['#E6F6DC', '#B9E59A', '#94D373'],
      cena(p) {
        const F = `font-family="Fredoka, 'Baloo 2', sans-serif" font-weight="700"`;
        const lista = p && Array.isArray(p.letras) && p.letras.length ? p.letras : VOGAIS;
        const L = String(lista[0]).toUpperCase().charAt(0) || 'A';
        const brilho = (x, y, r) => `<path d="M${x} ${y - r} Q ${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y} Q ${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r} Q ${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y} Q ${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r} Z" fill="#FFC93C"/>`;
        return '' +
          // galho
          `<path d="M-4 34 C 30 30 70 33 104 28 L 104 36 C 70 41 30 38 -4 42 Z" fill="#9A6338" stroke="${T}" stroke-width="2.2" stroke-linejoin="round"/>` +
          `<path d="M86 30 c 4 -6 10 -8 15 -7 c -3 6 -9 9 -15 7 Z" fill="#5CC84A" stroke="${T}" stroke-width="1.8"/>` +
          // ninho (fundo, frente fofa)
          `<ellipse cx="36" cy="25" rx="21" ry="7" fill="#8A5A30" stroke="${T}" stroke-width="2.2"/>` +
          `<ellipse cx="36" cy="26.5" rx="16" ry="4" fill="#5E3A1E"/>` +
          `<path d="M14 25 C 14 36 24 40 36 40 C 48 40 58 36 58 25 C 54 30 46 32 36 32 C 26 32 18 30 14 25 Z" fill="#B07A43" stroke="${T}" stroke-width="2.2" stroke-linejoin="round"/>` +
          `<path d="M18 31 C 28 37 44 37 54 31" fill="none" stroke="#D9A35B" stroke-width="1.8" stroke-linecap="round"/>` +
          // plaquinha pendurada com a maiúscula
          `<path d="M28 39 L 29 47 M44 39 L 43 47" stroke="${T}" stroke-width="1.8" stroke-linecap="round"/>` +
          `<rect x="20" y="46" width="32" height="27" rx="6" fill="#E9B877" stroke="${T}" stroke-width="2.4"/>` +
          `<text x="36" y="67.5" text-anchor="middle" font-size="22" ${F} fill="${T}">${L}</text>` +
          // ovinho com a minúscula, no chão, e o caminho até o ninho
          `<path d="M62 70 Q 58 50 48 38" fill="none" stroke="${T}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="0.1 5"/>` +
          `<path d="M76 56 C 86 56 91 72 91 79 C 91 88 85 93 76 93 C 67 93 61 88 61 79 C 61 72 66 56 76 56 Z" fill="#FFD3DF" stroke="${T}" stroke-width="2.4"/>` +
          `<ellipse cx="69.5" cy="66" rx="2.4" ry="4.6" transform="rotate(22 69.5 66)" fill="#fff" opacity=".75"/>` +
          `<text x="76" y="86" text-anchor="middle" font-size="22" ${F} fill="${T}">${L.toLowerCase()}</text>` +
          brilho(86, 14, 4.5);
      },
    });
  }
})();
