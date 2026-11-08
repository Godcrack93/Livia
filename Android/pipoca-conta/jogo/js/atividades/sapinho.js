/* Pipoca Aprende — atividade "sapinho" (PROJETO.md 5.5): sequências na reta numérica.
   Uma lagoa (desenhada por cima do cenário, dentro do palco) com uma fileira EM LINHA RETA de vitórias-régias, os
   números crescendo para a direita. O sapinho Pulo (verde-limão, bochechas rosadas) anda folha por folha e a voz diz
   o número de cada folha em que ele pousa. A próxima folha vazia mostra "?" e três bolhas de número boiam na água
   (balançam sem girar). Acertou: o número vai para a folha e o Pulo pula para ela (PC.som.pulo). Errou: a bolha afunda
   (sai de jogo) e a Pipoca dá um retorno com conteúdo ("Esse é o sete. Vamos contar: cinco, seis...?").
   Contagem regressiva (passo −1): as folhas continuam crescendo para a direita; o Pulo começa à direita (no 10) e pula
   para a esquerda até o 0. De 2 em 2: embaixo de cada folha, os pares acumulados (pares de pontinhos). barras: embaixo
   de cada folha, barras de dez iguais à dezena da Torre (a folha 30 mostra três barras).
   Gerador: as duas primeiras folhas (na ordem do Pulo) e a última sempre visíveis; até a estação 14, nunca duas lacunas
   seguidas; bolhas erradas nunca negativas nem repetidas, de preferência o erro típico (passo 1: n−1 e n+1; passo −1:
   o número de contar para frente; passo 2: n−1 e n+1; passo 10: n−9 e n+10).
   Perguntas com antes / depois / entre (e às vezes um ordinal: "O Pulo está na terceira folha."). De 2 em 2 e de 10 em
   10 toda pergunta lembra a regra ("De dois em dois!"); na contagem para trás, "depois" segue a contagem ("Para trás!
   Qual vem depois do sete?") e não há "antes" (ambíguo ali). O balão mostra fichinhas com os números da pergunta.
   Ajuda (2º erro seguido): o Pulo volta duas folhas e conta até a lacuna. Mãozinha: tocar a bolha certa.
   Demonstração (1ª rodada com demo): depois da pergunta, a mãozinha mostra a bolha certa ("Toque na bolha certa!").
   Com o "Quer parar?" aberto, o Pulo espera parado e a voz não conta por cima da pergunta da moldura.
   Testes no navegador: estado() descreve a rodada; PC.debug.telaOcupada fica verdadeiro enquanto o Pulo anda, conta ou
   ajuda (o {"esperar": "ocioso"} do testador espera); a bolha que sai de jogo perde o data-teste.
   params: { inicio, passo, quantidade (4 a 11 folhas), lacunas, rodadas, demo, barras, seguidas (só testes) } */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  // ---------------------------------------------------------------- medidas (palco virtual 1600×900)
  const FOLHA_Y_PADRAO = 296;           // centro das vitórias-régias (a fileira é uma linha reta)
  const FOLHA_Y_APOIO = 282;            // com pares ou barras embaixo das folhas, a fileira sobe um pouco (o balão não cobre)
  const CUBINHO_BARRA = 8, BARRA_A = 10 * CUBINHO_BARRA + 4;   // barra de dez: dez cubinhos de 8 px + contorno
  const FILA_X0 = 150, FILA_X1 = 1450;  // centros da primeira e da última folha com a fileira cheia (11 folhas)
  const ESPACO_MAX = 210;               // com poucas folhas, elas ficam maiores, mas não espalhadas demais
  const BOLHA_Y = 678;                  // centro das bolhas de número (na água, longe da Pipoca e do balão)
  const BOLHAS_X = [745, 1015, 1285];
  const BOLHA_D = 150;                  // diâmetro do desenho da bolha
  const BOLHA_TOQUE = 178;              // área de toque da bolha (maior que o desenho)
  const PULO_VB = { l: 150, a: 130, pe: 118 };   // viewBox do desenho do Pulo e a altura dos pés nele
  const memorias = new WeakMap();       // por estação jogada (o objeto params é o mesmo em todas as rodadas dela)
  let uid = 0;

  const CSS = `
    .pc-sapinho { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
    .pc-sapinho-lagoa { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; pointer-events: none; overflow: visible; }
    .pc-sapinho-cam { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; pointer-events: none; }
    .pc-sapinho-folha { position: absolute; width: 0; height: 0; }
    .pc-sapinho-folha-svg { position: absolute; display: block; overflow: visible; transform-origin: 50% 45%; }
    .pc-sapinho-onda { position: absolute; border-radius: 50%; border: 5px solid rgba(255, 255, 255, .85); pointer-events: none; }
    .pc-sapinho-num { position: absolute; width: 0; height: 0; pointer-events: none; }
    .pc-sapinho-num.vazio { display: none; }
    .pc-sapinho-num-txt { position: relative; display: block; transform-origin: 50% 50%; padding-top: .06em;
      font-family: var(--fonte); font-weight: 700; line-height: 1; color: #3A2A5A; white-space: nowrap; text-align: center; }
    .pc-sapinho-num-pos { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); }
    .pc-sapinho-num.interroga .pc-sapinho-num-txt { display: grid; place-items: center; width: 1.24em; height: 1.24em; padding-top: .04em;
      border-radius: 50%; background: rgba(255, 255, 255, .94); border: 5px dashed #3A2A5A; color: #FF6B5B;
      animation: pcSapinhoPergunta 1.3s ease-in-out infinite; }
    @keyframes pcSapinhoPergunta { 50% { transform: scale(1.1); } }
    .pc-sapinho-pulo { position: absolute; left: 0; top: 0; pointer-events: none; }
    .pc-sapinho-pulo-vira { width: 100%; height: 100%; }
    .pc-sapinho-pulo.esquerda .pc-sapinho-pulo-vira { transform: scaleX(-1); }
    .pc-sapinho-pulo svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .pc-sapinho-pisca { animation: pcSapinhoPisca 4.4s infinite; transform-box: fill-box; transform-origin: center; }
    @keyframes pcSapinhoPisca { 0%, 91%, 100% { transform: scaleY(1); } 94% { transform: scaleY(.12); } }
    .pc-sapinho-apoio { position: absolute; transform: translateX(-50%); display: flex; align-items: flex-end; gap: 2px;
      padding: 6px 5px; border-radius: 14px; background: rgba(255, 255, 255, .42); }
    .pc-sapinho-apoio-pares { display: grid; gap: 5px 4px; padding: 6px 7px; }
    .pc-sapinho-barra { position: relative; display: block; width: 11px; height: ${BARRA_A}px; border: 2px solid #3A2A5A; border-radius: 3px;
      background: repeating-linear-gradient(0deg, transparent 0 ${CUBINHO_BARRA - 1.4}px, #3A2A5A ${CUBINHO_BARRA - 1.4}px ${CUBINHO_BARRA}px),
        linear-gradient(0deg, #9B7BFF 0 50%, #FFC93C 50% 100%); }
    .pc-sapinho-barra::after { content: ''; position: absolute; left: -5px; right: -5px; top: 50%; height: 7px; margin-top: -4px;
      border-radius: 3px; background: #FFC93C; border: 2px solid #3A2A5A; }
    .pc-sapinho-barra.unidades { background: repeating-linear-gradient(0deg, transparent 0 ${CUBINHO_BARRA - 1.4}px, #3A2A5A ${CUBINHO_BARRA - 1.4}px ${CUBINHO_BARRA}px),
        linear-gradient(0deg, #9B7BFF 0 ${5 * CUBINHO_BARRA}px, #FFC93C ${5 * CUBINHO_BARRA}px); }
    .pc-sapinho-barra.unidades::after { display: none; }
    .pc-sapinho-par { position: relative; display: block; width: 22px; height: 40px; border-radius: 11px; background: #fff; border: 2px solid #3A2A5A; }
    .pc-sapinho-par::before, .pc-sapinho-par::after { content: ''; position: absolute; left: 2px; width: 14px; height: 14px; border-radius: 50%;
      background: #9B7BFF; border: 2px solid #3A2A5A; box-sizing: border-box; }
    .pc-sapinho-par::before { top: 3px; }
    .pc-sapinho-par::after { bottom: 3px; }
    .pc-sapinho-par.b::before, .pc-sapinho-par.b::after { background: #FFC93C; }
    .pc-sapinho-par.um::after { display: none; }
    .pc-sapinho-bolha { position: absolute; width: ${BOLHA_TOQUE}px; height: ${BOLHA_TOQUE}px; margin: ${-BOLHA_TOQUE / 2}px 0 0 ${-BOLHA_TOQUE / 2}px;
      border-radius: 50%; pointer-events: auto; cursor: pointer; touch-action: manipulation; }
    .pc-sapinho-bolha.fora { pointer-events: none; }
    .pc-sapinho-bolha-entra { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
    .pc-sapinho-bolha-boia { position: absolute; left: ${(BOLHA_TOQUE - BOLHA_D) / 2}px; top: ${(BOLHA_TOQUE - BOLHA_D) / 2}px;
      width: ${BOLHA_D}px; height: ${BOLHA_D}px; animation: pcSapinhoBoia 2.5s ease-in-out infinite alternate; }
    .pc-sapinho-bolha.fora .pc-sapinho-bolha-boia { animation-play-state: paused; }
    .pc-sapinho-bolha-boia svg { position: absolute; left: 0; top: 0; width: ${BOLHA_D}px; height: ${BOLHA_D}px; overflow: visible; }
    .pc-sapinho-bolha-num { position: absolute; left: 0; top: 0; width: ${BOLHA_D}px; height: ${BOLHA_D}px; display: grid; place-items: center;
      font-family: var(--fonte); font-weight: 700; line-height: 1; color: #3A2A5A; padding-top: 6px; }
    .pc-sapinho-bolha-onda { position: absolute; left: ${(BOLHA_TOQUE - BOLHA_D) / 2 - 6}px; top: ${(BOLHA_TOQUE + BOLHA_D) / 2 - 30}px;
      width: ${BOLHA_D + 12}px; height: 40px; border-radius: 50%; border: 5px solid rgba(255, 255, 255, .8);
      animation: pcSapinhoOnda 2.5s ease-in-out infinite alternate; }
    @keyframes pcSapinhoBoia { from { transform: translateY(-9px); } to { transform: translateY(7px); } }
    @keyframes pcSapinhoOnda { from { transform: scale(.88); opacity: .5; } to { transform: scale(1.04); opacity: .95; } }
    .pc-sapinho-fichas { display: flex; align-items: center; gap: 8px; }
    .pc-sapinho-ficha { display: grid; place-items: center; min-width: 72px; height: 72px; padding: 3px 10px 0; border-radius: 36px;
      background: #8DD763; border: 4px solid #3A2A5A; font: 700 52px/1 var(--fonte); color: #3A2A5A; white-space: nowrap; }
    .pc-sapinho-ficha.vazia { background: #fff; border-style: dashed; color: #FF6B5B; }
    /* com três fichas, um pouco menores: o balão fica com até 3 linhas e não cobre os pares/barras das primeiras folhas */
    .pc-sapinho-fichas.tres .pc-sapinho-ficha { min-width: 65px; height: 65px; border-radius: 33px; font-size: 45px; }
  `;

  // ---------------------------------------------------------------- utilidades
  const inteiro = (v, padrao) => { const n = Math.round(Number(v)); return isFinite(n) ? n : padrao; };
  const ext = n => PC.voz.extenso(n);
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);
  const ORDINAIS = ['primeira', 'segunda', 'terceira', 'quarta', 'quinta', 'sexta', 'sétima', 'oitava', 'nona', 'décima'];

  let regua = null;
  /** Largura do texto em Fredoka 700 com 1 px de fonte (a fonte já foi carregada quando a atividade começa). */
  function larguraEm(texto) {
    try {
      if (!regua) regua = document.createElement('canvas').getContext('2d');
      regua.font = '700 100px Fredoka';
      const l = regua.measureText(String(texto)).width / 100;
      if (l > 0.2) return l;
    } catch (e) { /* segue com a estimativa */ }
    return String(texto).length * 0.58;
  }

  // ---------------------------------------------------------------- gerador
  /** Valores da fileira na ordem em que o Pulo anda (no passo −1, do maior para o menor). */
  function montarSequencia(params) {
    let passo = inteiro(params.passo, 1);
    if (!passo) passo = 1;
    passo = U.limitar(passo, -10, 10);
    let inicio = Math.max(0, inteiro(params.inicio, passo > 0 ? 1 : 10));
    let n = U.limitar(inteiro(params.quantidade, 5), 4, 11);
    if (passo < 0) {
      n = Math.min(n, Math.floor(inicio / -passo) + 1);          // nunca passa do zero
      if (n < 4) { n = 4; inicio = -passo * 3; }
    }
    const valores = [];
    for (let i = 0; i < n; i++) valores.push(inicio + i * passo);
    return { valores, passo, n };
  }

  function memoriaDe(params) {
    let m = memorias.get(params);
    if (!m) { m = { lacunas: '' }; memorias.set(params, m); }
    return m;
  }

  /** Até a 14ª estação de números (estação 27 da trilha intercalada), nunca duas lacunas seguidas (PROJETO.md 5.5).
     Sem estação (teste), segue as primeiras estações. */
  function permiteSeguidas(params) {
    if (typeof params.seguidas === 'boolean') return params.seguidas;
    let estacao = null;
    try { const p = PC.telas.params(); estacao = p && p.estacao; } catch (e) { estacao = null; }
    return Number(estacao) > 27;
  }

  /** Índices (na ordem do Pulo) das lacunas: nunca as duas primeiras folhas nem a última. */
  function sortearLacunas(n, pedidas, seguidas, mem) {
    const livres = [];
    for (let i = 2; i <= n - 2; i++) livres.push(i);
    let k = U.limitar(pedidas, 1, Math.max(1, livres.length));
    if (!seguidas) k = Math.min(k, Math.ceil(livres.length / 2));
    let escolha = null;
    for (let t = 0; t < 80; t++) {
      const c = U.embaralhar(livres).slice(0, k).sort((a, b) => a - b);
      if (!seguidas && c.some((v, j) => j > 0 && v - c[j - 1] === 1)) continue;
      escolha = c;
      if (c.join() !== mem.lacunas) break;                      // diferente da rodada anterior, quando der
    }
    if (!escolha) { escolha = []; for (let i = 2; i <= n - 2 && escolha.length < k; i += 2) escolha.push(i); }
    mem.lacunas = escolha.join();
    return escolha;
  }

  /** Duas bolhas erradas: o erro típico de cada passo; nunca negativas, nunca repetidas, nunca a certa. */
  function distratores(certo, passo) {
    const p = Math.abs(passo);
    let pref;
    if (passo === 1 || passo === 2) pref = [certo - 1, certo + 1, certo + 2, certo - 2, certo + 3];
    else if (passo === -1) pref = [certo + 2, certo - 1, certo + 1, certo + 3, certo - 2];
    else if (passo === 10) pref = [certo - 9, certo + 10, certo + 1, certo - 10, certo - 1];
    else if (passo > 0) pref = [certo - passo + 1, certo + passo, certo + 1, certo - 1, certo + 2];   // contar de um em um a partir do Pulo
    else pref = [certo + 2 * p, certo - p, certo + 1, certo - 1, certo + p];                       // contar para frente a partir do Pulo
    const r = [];
    const pode = v => v >= 0 && v !== certo && r.indexOf(v) < 0;
    for (const v of pref) { if (r.length < 2 && pode(v)) r.push(v); }
    for (let d = 1; r.length < 2 && d < 50; d++) for (const v of [certo + d, certo - d]) if (r.length < 2 && pode(v)) r.push(v);
    return r;
  }

  // ---------------------------------------------------------------- desenhos (SVG próprios, contorno #3A2A5A, sem filtros)
  // Lagoa: a água cobre quase todo o palco; a margem de baixo à esquerda é terra firme (ali fica a Pipoca).
  const AGUA = 'M96 236 C 300 216, 560 228, 800 221 C 1040 214, 1300 224, 1500 234 C 1556 240, 1574 284, 1568 352 ' +
    'L 1563 700 C 1560 780, 1528 826, 1440 832 C 1200 842, 900 836, 660 838 C 560 838, 482 830, 432 806 ' +
    'C 372 776, 342 708, 292 666 C 242 624, 152 612, 94 574 C 46 542, 36 472, 40 400 L 46 302 C 50 260, 66 240, 96 236 Z';

  function taboas(x, y, e, virar) {
    return `<g transform="translate(${x} ${y}) scale(${virar ? -e : e} ${e})">
      <path d="M-6 0 C -10 -40 -26 -70 -46 -92 M10 0 C 14 -34 26 -62 42 -80" fill="none" stroke="#5DAA3F" stroke-width="7" stroke-linecap="round"/>
      <path d="M0 0 V -130 M-18 0 V -100 M18 0 V -112" stroke="#4E9E33" stroke-width="5" stroke-linecap="round"/>
      <g fill="#8A5A34"><rect x="-7" y="-120" width="14" height="40" rx="7"/><rect x="-25" y="-92" width="13" height="32" rx="6.5"/><rect x="12" y="-104" width="13" height="34" rx="6.5"/></g></g>`;
  }

  function svgLagoa() {
    const id = 'pc-sapinho-agua-' + (++uid);
    const brilhos = [[178, 470], [1500, 520], [560, 560], [1150, 560], [1420, 790], [880, 806]]
      .map(([x, y]) => `M${x - 34} ${y} h 68`).join(' ');
    return `<svg class="pc-sapinho-lagoa" viewBox="0 0 1600 900" width="1600" height="900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#93DDF3"/><stop offset=".55" stop-color="#6CCBEB"/><stop offset="1" stop-color="#4AB4DE"/></linearGradient></defs>
      <path d="${AGUA}" fill="#E3D9A6" stroke="#E3D9A6" stroke-width="38" stroke-linejoin="round"/>
      <path d="${AGUA}" fill="none" stroke="#9ED37F" stroke-width="12" stroke-linejoin="round" stroke-dasharray="2 26" stroke-linecap="round"/>
      <path d="${AGUA}" fill="url(#${id})" stroke="#3E9FCB" stroke-width="6" stroke-linejoin="round"/>
      <path d="M120 252 C 330 234, 560 244, 800 238 C 1040 232, 1300 240, 1480 250" fill="none" stroke="#C9F1FB" stroke-width="10" stroke-linecap="round" opacity=".8"/>
      <path d="${brilhos}" stroke="#E9FBFF" stroke-width="7" stroke-linecap="round" opacity=".75"/>
      <g fill="#B9B3CC" stroke="#8F88A6" stroke-width="3"><ellipse cx="1528" cy="846" rx="28" ry="13"/><ellipse cx="1494" cy="856" rx="16" ry="9"/><ellipse cx="66" cy="238" rx="22" ry="11"/></g>
      ${taboas(1560, 254, .9, true)}${taboas(52, 292, .8, false)}${taboas(1580, 826, 1, true)}
    </svg>`;
  }

  /** Vitória-régia vista de lado: a borda levantada (avermelhada por fora) e a parte chata com veios. */
  function svgFolha(R, ry, aba) {
    const m = 10, w = 2 * R + 2 * m, h = 2 * ry + aba + 2 * m + 10;
    const x0 = -R - m, y0 = -ry - m;
    const cy = (aba * 0.45).toFixed(1), rxi = R - aba, ryi = (ry - aba * 0.8).toFixed(1);
    let veios = '';
    for (let i = 0; i < 10; i++) {
      const a = (i + 0.5) * Math.PI / 5;
      veios += `M${(Math.cos(a) * rxi * 0.25).toFixed(1)} ${(aba * 0.45 + Math.sin(a) * (ry - aba) * 0.25).toFixed(1)} ` +
        `L ${(Math.cos(a) * (rxi - 5)).toFixed(1)} ${(aba * 0.45 + Math.sin(a) * (ry - aba * 0.8 - 4)).toFixed(1)} `;
    }
    return `<svg class="pc-sapinho-folha-svg" width="${w}" height="${h}" viewBox="${x0} ${y0} ${w} ${h}" style="left:${x0}px;top:${y0}px" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="0" cy="${aba + 8}" rx="${R + 6}" ry="${ry + 3}" fill="#23799F" opacity=".28"/>
      <ellipse cx="0" cy="${aba}" rx="${R}" ry="${ry}" fill="#B55A5A" stroke="#3A2A5A" stroke-width="4"/>
      <ellipse cx="0" cy="0" rx="${R}" ry="${ry}" fill="#5BB244" stroke="#3A2A5A" stroke-width="4"/>
      <ellipse cx="0" cy="${cy}" rx="${rxi}" ry="${ryi}" fill="#90D865"/>
      <path d="${veios}" stroke="#78C651" stroke-width="3" stroke-linecap="round" fill="none"/>
      <ellipse cx="${(-R * 0.42).toFixed(1)}" cy="${(-ry * 0.28).toFixed(1)}" rx="${(R * 0.2).toFixed(1)}" ry="${(ry * 0.13).toFixed(1)}" fill="#fff" opacity=".3"/>
    </svg>`;
  }

  /** O Pulo: sapinho verde-limão de bochechas rosadas, sentado, virado para a direita (viewBox 0 0 150 130). */
  function svgPulo() {
    const T = '#3A2A5A', V = '#A8E061', VE = '#8CCB45', B = '#EAF8B6', R = '#FF8FC2';
    return `<svg viewBox="0 0 ${PULO_VB.l} ${PULO_VB.a}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="76" cy="121" rx="56" ry="7" fill="${T}" opacity=".16"/>
      <ellipse cx="34" cy="96" rx="24" ry="17" transform="rotate(-30 34 96)" fill="${VE}" stroke="${T}" stroke-width="5"/>
      <ellipse cx="118" cy="96" rx="24" ry="17" transform="rotate(30 118 96)" fill="${VE}" stroke="${T}" stroke-width="5"/>
      <path d="M6 117 C 12 106, 34 105, 48 113 C 42 121, 16 123, 6 117 Z" fill="${VE}" stroke="${T}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M146 117 C 140 106, 118 105, 104 113 C 110 121, 136 123, 146 117 Z" fill="${VE}" stroke="${T}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M27 86 C 25 58, 47 46, 76 46 C 105 46, 127 58, 125 86 C 123 108, 103 117, 76 117 C 49 117, 29 108, 27 86 Z" fill="${V}" stroke="${T}" stroke-width="5"/>
      <ellipse cx="80" cy="101" rx="28" ry="13" fill="${B}"/>
      <path d="M62 98 V 114 M98 98 V 114" stroke="${T}" stroke-width="14" stroke-linecap="round"/>
      <path d="M62 98 V 114 M98 98 V 114" stroke="${V}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="56" cy="43" r="18" fill="${V}" stroke="${T}" stroke-width="5"/>
      <circle cx="104" cy="43" r="18" fill="${V}" stroke="${T}" stroke-width="5"/>
      <g class="pc-sapinho-pisca">
        <circle cx="58" cy="43" r="11" fill="#fff"/><circle cx="106" cy="43" r="11" fill="#fff"/>
        <circle cx="62" cy="44" r="6.5" fill="${T}"/><circle cx="110" cy="44" r="6.5" fill="${T}"/>
        <circle cx="64" cy="41" r="2.3" fill="#fff"/><circle cx="112" cy="41" r="2.3" fill="#fff"/>
      </g>
      <circle cx="76" cy="66" r="2.6" fill="${T}"/><circle cx="88" cy="66" r="2.6" fill="${T}"/>
      <ellipse cx="46" cy="80" rx="9.5" ry="6" fill="${R}"/><ellipse cx="114" cy="80" rx="9.5" ry="6" fill="${R}"/>
      <path d="M58 77 Q 82 97 106 77" fill="none" stroke="${T}" stroke-width="4.5" stroke-linecap="round"/>
    </svg>`;
  }

  /** Bolha de água (sem gradiente: círculo claro, meia-lua de sombra e brilho). viewBox -80 -80 160 160. */
  function svgBolha() {
    return `<svg viewBox="-80 -80 160 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle r="72" fill="#E6F9FF" stroke="#3A2A5A" stroke-width="5"/>
      <path d="M 62 -24 A 66 66 0 0 1 -24 62 Q 46 52 62 -24 Z" fill="#B3E8F7"/>
      <ellipse cx="-30" cy="-38" rx="21" ry="11" transform="rotate(-38 -30 -38)" fill="#fff"/>
      <circle cx="-52" cy="-10" r="5.5" fill="#fff"/>
    </svg>`;
  }

  /** Fileira de fichinhas para o balão da Pipoca ("4 ?", "6 ? 8"): o que a criança que não lê vai olhar. */
  function fichas(lista) {
    const caixa = U.el('div', { class: 'pc-sapinho-fichas' + (lista.length >= 3 ? ' tres' : ''), 'aria-hidden': 'true' });
    lista.forEach(v => caixa.appendChild(U.el('span', { class: 'pc-sapinho-ficha' + (v === '?' ? ' vazia' : ''), text: String(v) })));
    return caixa;
  }

  // ---------------------------------------------------------------- a rodada
  function rodada(ctx) {
    U.estilo('sapinho', CSS);
    const params = ctx.params || {};
    const { valores, passo, n } = montarSequencia(params);
    const seguidas = permiteSeguidas(params);
    const lacunas = sortearLacunas(n, inteiro(params.lacunas, 1), seguidas, memoriaDe(params));
    const P = Math.abs(passo);
    const frente = passo > 0 ? 'direita' : 'esquerda';
    const comPares = !params.barras && P === 2;                 // de 2 em 2: pares acumulados embaixo das folhas
    const comBarras = !!params.barras;                          // de 10 em 10: barras de dez embaixo das folhas

    // geometria da fileira
    const FOLHA_Y = comPares || comBarras ? FOLHA_Y_APOIO : FOLHA_Y_PADRAO;
    const esp = Math.min(ESPACO_MAX, (FILA_X1 - FILA_X0) / (n - 1));
    const x0 = 800 - esp * (n - 1) / 2;
    const R = Math.round(U.limitar(esp / 2 - 5, 52, 84));
    const RY = Math.round(R * 0.66), ABA = Math.max(7, Math.round(R * 0.14));
    const maiorEm = Math.max.apply(null, valores.map(v => larguraEm(v)));
    // algarismo nunca menor que PC.layout.numeroMinimo (64): a criança precisa ler o número de cada folha
    const FONTE = Math.round(Math.max(PC.layout.numeroMinimo || 64, Math.min(U.limitar(R * 1.15, 64, 86), (2 * R - 22) / maiorEm)));
    const NUM_DY = Math.round(RY * 0.22);                       // o número fica na parte da frente da folha
    const PE_DY = Math.round(R * 0.42);                         // o Pulo pisa na parte de trás (os pés não cobrem o número)
    const APOIO_Y = FOLHA_Y + RY + ABA + 7;
    const PW = Math.round(U.limitar(R * 1.8, 104, 140)), PH = Math.round(PW * PULO_VB.a / PULO_VB.l), PFY = PH * PULO_VB.pe / PULO_VB.a;
    const posDe = i => (passo > 0 ? i : n - 1 - i);             // índice da folha na fila (da esquerda para a direita)
    const xDe = i => x0 + posDe(i) * esp;
    const pe = i => ({ x: xDe(i), y: FOLHA_Y - PE_DY });

    let destruido = false, resolvida = false, interagiu = false;
    let fase = 'inicio';             // inicio | andando | pergunta | retorno | ajuda | conferindo | fim
    let puloEm = 0, geracaoMov = 0;
    let lacunaAtual = -1, certoAtual = null, pergunta = null, bolhas = [], respondidas = 0, erros = 0;
    let espera = null, ajudaAC = null, timerRetorno = null;
    const timers = [];

    // ------------------------------------------------------------ camadas
    const raiz = U.el('div', { class: 'pc-sapinho' });
    raiz.innerHTML = svgLagoa();
    const camada = nome => { const c = U.el('div', { class: 'pc-sapinho-cam pc-sapinho-cam-' + nome }); raiz.appendChild(c); return c; };
    const camApoios = camada('apoios'), camOndas = camada('ondas'), camFolhas = camada('folhas');
    const camPulo = camada('pulo'), camNumeros = camada('numeros'), camBolhas = camada('bolhas');
    ctx.palco.appendChild(raiz);

    // ------------------------------------------------------------ folhas, números e apoios
    function criarApoio(v, x) {
      let el = null;
      if (comBarras) {
        const dez = Math.floor(v / 10), uni = v % 10;
        if (v <= 0 || dez > 10) return null;
        el = U.el('div', { class: 'pc-sapinho-apoio pc-sapinho-apoio-barras' });
        for (let k = 0; k < dez; k++) el.appendChild(U.el('i', { class: 'pc-sapinho-barra' }));
        if (uni) el.appendChild(U.el('i', { class: 'pc-sapinho-barra unidades', style: { height: (uni * CUBINHO_BARRA + 4) + 'px' } }));
      } else if (comPares) {
        const pares = Math.floor(v / 2), sobra = v % 2, total = pares + sobra;
        if (v <= 0 || total > 10) return null;
        el = U.el('div', { class: 'pc-sapinho-apoio pc-sapinho-apoio-pares', style: { gridTemplateColumns: `repeat(${Math.min(5, total)}, 22px)` } });
        for (let k = 0; k < total; k++) el.appendChild(U.el('i', { class: 'pc-sapinho-par' + (k >= 5 ? ' b' : '') + (k >= pares ? ' um' : '') }));
      }
      if (!el) return null;
      el.style.left = x + 'px';
      el.style.top = APOIO_Y + 'px';
      camApoios.appendChild(el);
      // fileira cheia: o apoio mais largo (dez barras, dez pares) encolhe um pouco para não encostar no vizinho
      const largura = el.offsetWidth, cabe = esp - 8;
      if (largura > cabe) {
        el.style.transformOrigin = '50% 0';
        el.style.transform = `translateX(-50%) scale(${(cabe / largura).toFixed(3)})`;
      }
      return el;
    }

    const folhas = valores.map((v, i) => {
      const x = xDe(i), lacuna = lacunas.indexOf(i) >= 0;
      const el = U.el('div', { class: 'pc-sapinho-folha', style: { left: x + 'px', top: FOLHA_Y + 'px' } });
      el.innerHTML = svgFolha(R, RY, ABA);
      camFolhas.appendChild(el);
      const num = U.el('div', { class: 'pc-sapinho-num' + (lacuna ? ' vazio' : ''), style: { left: x + 'px', top: (FOLHA_Y + NUM_DY) + 'px' } });
      const pos = U.el('div', { class: 'pc-sapinho-num-pos' });
      const txt = U.el('span', { class: 'pc-sapinho-num-txt', text: lacuna ? '' : String(v), style: { fontSize: FONTE + 'px' } });
      pos.appendChild(txt); num.appendChild(pos); camNumeros.appendChild(num);
      const apoio = criarApoio(v, x);
      // entrada: as folhas aparecem da esquerda para a direita
      const atraso = 40 + posDe(i) * 45;
      U.animar(el, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 380, delay: atraso, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' });
      U.animar(num, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: atraso + 200, fill: 'backwards' });
      if (apoio) U.animar(apoio, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: atraso + 260, fill: 'backwards' });
      return { i, v, x, el, svg: el.firstElementChild, num, txt, apoio, lacuna };
    });

    // ------------------------------------------------------------ o Pulo
    const puloEl = U.el('div', { class: 'pc-sapinho-pulo', style: { width: PW + 'px', height: PH + 'px', transformOrigin: `${PW / 2}px ${PFY.toFixed(1)}px`, visibility: 'hidden' } });
    puloEl.appendChild(U.el('div', { class: 'pc-sapinho-pulo-vira', html: svgPulo() }));
    camPulo.appendChild(puloEl);
    const tr = (x, y, sx, sy) => `translate(${(x - PW / 2).toFixed(1)}px, ${(y - PFY).toFixed(1)}px) scale(${sx || 1}, ${sy || 1})`;

    function virar(lado) { puloEl.classList.toggle('esquerda', lado === 'esquerda'); }
    /** Cancela qualquer pulo em andamento e deixa o Pulo parado na folha puloEm. */
    function pararPulo() {
      geracaoMov++;
      puloEl.getAnimations().forEach(a => a.cancel());
      const p = pe(puloEm);
      puloEl.style.transform = tr(p.x, p.y);
    }
    function onda(x, y, largura) {
      const w = largura, h = Math.round(w * 0.62);
      const o = U.el('div', { class: 'pc-sapinho-onda', style: { left: (x - w / 2) + 'px', top: (y - h / 2) + 'px', width: w + 'px', height: h + 'px' } });
      camOndas.appendChild(o);
      U.animar(o, [{ transform: 'scale(.86)', opacity: 0.9 }, { transform: 'scale(1.3)', opacity: 0 }], { duration: 720, easing: 'ease-out', fill: 'forwards' }).then(() => o.remove());
    }
    /** A folha afunda um pouquinho e faz uma onda quando o Pulo pousa. */
    function pousar(i) {
      const f = folhas[i];
      U.animar(f.svg, [{ transform: 'translateY(0px) scale(1, 1)' }, { transform: 'translateY(5px) scale(1.03, .93)', offset: 0.35 }, { transform: 'translateY(0px) scale(1, 1)' }], { duration: 380, easing: 'ease-out' });
      onda(f.x, FOLHA_Y + ABA, 2 * R + 24);
    }
    /** Um pulo do Pulo até a folha i (pode voltar). Rejeita com AbortError se for interrompido. */
    async function pular(i, { ms = 430, altura = 62, sinal = ctx.sinal, som = null } = {}) {
      const de = pe(puloEm), para = pe(i), minha = ++geracaoMov;
      if (para.x !== de.x) virar(para.x < de.x ? 'esquerda' : 'direita');
      if (som === 'pulo') PC.som.pulo();
      puloEm = i;
      const q = [{ offset: 0, transform: tr(de.x, de.y) }, { offset: 0.14, transform: tr(de.x, de.y, 1.12, 0.86) }];
      for (let k = 1; k <= 7; k++) {
        const s = k / 8;
        q.push({ offset: 0.14 + 0.72 * s, transform: tr(de.x + (para.x - de.x) * s, de.y + (para.y - de.y) * s - altura * 4 * s * (1 - s), 0.95, 1.07) });
      }
      q.push({ offset: 0.88, transform: tr(para.x, para.y, 1.12, 0.88) }, { offset: 1, transform: tr(para.x, para.y) });
      puloEl.style.transform = tr(para.x, para.y);
      await U.animar(puloEl, q, { duration: ms, easing: 'linear' });
      if (minha !== geracaoMov || destruido || (sinal && sinal.aborted)) throw U.abortado();
      pousar(i);
    }
    /** O Pulo cai do alto na primeira folha. */
    async function entrar() {
      const p = pe(0);
      virar(frente);
      puloEl.style.transform = tr(p.x, p.y);
      puloEl.style.visibility = '';
      PC.som.pulo();
      await U.animar(puloEl, [
        { offset: 0, transform: tr(p.x, p.y - 190, 0.92, 1.1), opacity: 0 },
        { offset: 0.5, transform: tr(p.x, p.y - 70, 0.95, 1.06), opacity: 1 },
        { offset: 0.82, transform: tr(p.x, p.y, 1.16, 0.84), opacity: 1 },
        { offset: 1, transform: tr(p.x, p.y), opacity: 1 },
      ], { duration: 560, easing: 'ease-in' });
      if (destruido || ctx.sinal.aborted) throw U.abortado();
      pousar(0);
    }

    // ------------------------------------------------------------ números nas folhas
    const nota = v => Math.max(1, P >= 10 ? Math.round(v / P) : v + 1);
    function destacarNumero(i) {
      U.animar(folhas[i].txt, [{ transform: 'scale(1)' }, { transform: 'scale(1.28)', offset: 0.35 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
    }
    /**
     * Quem conta é a Pipoca (só ela fala; o Pulo só pula): enquanto a voz diz o número da folha, a boca dela mexe, sem
     * balão. Não desliga a boca se ela estiver no meio de uma fala de verdade (PC.ui.pipoca.dizer).
     */
    function bocaDaPipoca(liga) {
      const host = PC.ui.pipoca.elemento;
      if (!host || (!liga && PC.ui.pipoca.falando())) return;
      host.classList.toggle('falando', !!liga);
    }
    /** A voz diz o número da folha i (o número da folha pulsa). Com o "Quer parar?" aberto, espera: não fala por cima. */
    async function dizerNumero(i, sinal) {
      sinal = sinal || ctx.sinal;
      await semPausa(sinal);
      if (sinal.aborted || destruido) throw U.abortado();
      destacarNumero(i);
      PC.som.contar(nota(valores[i]));
      bocaDaPipoca(true);
      const fala = PC.voz.falar(ext(valores[i]));
      try {
        await Promise.all([U.esperar(360, sinal), Promise.race([fala, U.esperar(PC.voz.TETO_NUMERO)])]);
      } finally {
        bocaDaPipoca(false);
      }
      if (sinal.aborted || destruido) throw U.abortado();
    }
    function mostrarInterrogacao(g) {
      const f = folhas[g];
      f.num.classList.remove('vazio');
      f.num.classList.add('interroga');
      f.txt.textContent = '?';
      U.animar(f.txt, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.3, 1.6, .5, 1)' });
    }
    function pulsarInterrogacao() {
      const f = folhas[lacunaAtual];
      if (f && f.num.classList.contains('interroga')) U.animar(f.txt, [{ transform: 'scale(1)' }, { transform: 'scale(1.3)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 520, easing: 'ease-out' });
    }
    function preencher(g, instantaneo) {
      const f = folhas[g];
      f.lacuna = false;
      f.num.classList.remove('vazio', 'interroga');
      f.txt.textContent = String(f.v);
      if (!instantaneo) U.animar(f.txt, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.3)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, easing: 'ease-out' });
    }

    // ------------------------------------------------------------ bolhas
    function criarBolhas(certo, erradas) {
      const vals = U.embaralhar([certo].concat(erradas));
      const maior = Math.max.apply(null, vals.map(larguraEm));
      const fonte = Math.round(Math.min(82, 112 / maior));
      bolhas = vals.map((v, k) => {
        const x = BOLHAS_X[k], y = BOLHA_Y;
        const el = U.el('div', {
          class: 'pc-sapinho-bolha', teste: 'bolha-' + k, role: 'button', 'aria-label': 'Número ' + v,
          dataset: { valor: String(v), certa: v === certo ? '1' : '0' }, style: { left: x + 'px', top: y + 'px' },
        });
        // a área de toque (el) fica parada desde o começo; só o desenho (entra > boia) se mexe
        const entra = U.el('div', { class: 'pc-sapinho-bolha-entra' });
        const boia = U.el('div', { class: 'pc-sapinho-bolha-boia', style: { animationDelay: (-k * 0.8) + 's' } });
        boia.innerHTML = svgBolha();
        boia.appendChild(U.el('span', { class: 'pc-sapinho-bolha-num', text: String(v), style: { fontSize: fonte + 'px' } }));
        entra.append(U.el('div', { class: 'pc-sapinho-bolha-onda', style: { animationDelay: (-k * 0.8) + 's' } }), boia);
        el.appendChild(entra);
        camBolhas.appendChild(el);
        const b = { valor: v, el, x, y, ativa: true };
        PC.aoTocar(el, () => tocarBolha(b), { som: false });
        U.animar(entra, [{ transform: 'translateY(70px) scale(.3)', opacity: 0 }, { transform: 'translateY(0px) scale(1)', opacity: 1 }],
          { duration: 440, delay: 60 + k * 120, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' });
        return b;
      });
      PC.som.bolha();
    }
    /** A bolha sai de jogo: não recebe mais toque e deixa de ser um alvo (sem data-teste). */
    function tirarDeJogo(b) {
      b.ativa = false;
      b.el.classList.add('fora');
      b.el.removeAttribute('data-teste');
      b.el.removeAttribute('role');
    }
    /** A bolha afunda e sai de jogo (suave = some sem ser erro). */
    function afundar(b, suave) {
      tirarDeJogo(b);
      U.animar(b.el, [{ transform: 'translateY(0px) scale(1)', opacity: 1 }, { transform: `translateY(${suave ? 34 : 90}px) scale(${suave ? 0.7 : 0.45})`, opacity: 0 }],
        { duration: suave ? 380 : 720, easing: 'ease-in', fill: 'forwards' }).then(() => b.el.remove());
      if (!suave) onda(b.x, b.y + 50, 170);
    }
    /** A bolha certa voa até a folha da lacuna. */
    async function voarParaFolha(b, g) {
      tirarDeJogo(b);
      b.el.style.zIndex = '5';
      const dx = xDe(g) - b.x, dy = FOLHA_Y + NUM_DY - b.y;
      await U.animar(b.el, [
        { transform: 'translate(0px, 0px) scale(1)' },
        { transform: `translate(${(dx * 0.5).toFixed(1)}px, ${(dy * 0.5 - 70).toFixed(1)}px) scale(.8)`, offset: 0.5 },
        { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(.5)` },
      ], { duration: 520, easing: 'ease-in-out', fill: 'forwards' });
      b.el.remove();
    }
    const bolhaCerta = () => bolhas.find(b => b.ativa && b.valor === certoAtual) || null;

    // ------------------------------------------------------------ falas
    function textoAbertura() {
      const primeira = ctx.indice === 0 ? 'Este é o Pulo! ' : '';
      const ini = valores[0], fim = valores[n - 1];
      if (passo < 0) return `${primeira}Agora para trás, do ${ext(ini)} até o ${ext(fim)}!`;
      if (P === 1 && ini <= 1) return primeira ? 'Este é o Pulo! Vamos contar com ele!' : 'Vamos contar com o Pulo!';
      if (P === 1) return `${primeira}Vamos contar do ${ext(ini)} até o ${ext(fim)}!`;
      return `${primeira}Agora de ${ext(P)} em ${ext(P)}!`;
    }

    /**
     * Monta a pergunta da lacuna g (antes / depois / entre, as palavras da BNCC para a sequência, e às vezes um ordinal).
     * De 2 em 2 e de 10 em 10, toda pergunta lembra a regra ("De dois em dois!"): sem ela, o cinco também "vem depois
     * do quatro". Na contagem para trás, "depois" segue a ordem da contagem e vem sempre com "para trás"; não há
     * "antes", que ali fica ambíguo (o oito veio antes do sete na contagem, mas na reta o seis vem antes do sete).
     */
    function perguntaPara(g, primeira) {
      const c = valores[g - 1];                                  // a folha onde o Pulo está
      const temProx = g + 1 < n && !folhas[g + 1].lacuna;
      const prox = temProx ? valores[g + 1] : null;              // a folha depois da lacuna, na ordem do Pulo
      const deP = P > 1 ? `De ${ext(P)} em ${ext(P)}! ` : '';
      let tipos;
      if (passo > 0) tipos = ['depois', 'depois'].concat(temProx && P === 1 ? ['entre', 'entre'] : []).concat(temProx ? ['antes'] : []);
      else tipos = ['depois', 'depois'].concat(temProx && P === 1 ? ['entre'] : []);
      const tipo = primeira && ctx.indice === 0 ? tipos[0] : U.escolher(tipos);
      const E = primeira ? '' : 'E ', Q = primeira ? 'Qual' : 'qual';
      let texto, lista;
      if (tipo === 'entre') {
        const a = Math.min(c, prox), b = Math.max(c, prox);
        texto = `${E}${Q} fica entre o ${ext(a)} e o ${ext(b)}?`;
        lista = [a, '?', b];
      } else if (tipo === 'antes') {
        texto = P === 1 ? `${E}${Q} número vem antes do ${ext(prox)}?` : `${deP}Qual vem antes do ${ext(prox)}?`;
        const seguinte = g + 2 < n && !folhas[g + 2].lacuna ? valores[g + 2] : null;
        lista = P > 1 && seguinte != null ? ['?', prox, seguinte] : ['?', prox];
      } else if (passo < 0) {
        // contagem para trás: o "?" fica à esquerda do Pulo e as fichas seguem a ordem das folhas (crescendo para a direita)
        texto = primeira ? `Contando para trás! Qual vem depois do ${ext(c)}?` : `Para trás! Qual vem depois do ${ext(c)}?`;
        if (P > 1) texto = `De ${ext(P)} em ${ext(P)} para trás! Qual vem depois do ${ext(c)}?`;
        lista = ['?', c, valores[g - 2]];
      } else {
        texto = P === 1 ? `${E}${Q} número vem depois do ${ext(c)}?` : `${deP}Qual vem depois do ${ext(c)}?`;
        lista = P === 1 ? [c, '?'] : [valores[g - 2], c, '?'];
        // às vezes com ordinal: "O Pulo está na terceira folha." Só de um em um começando no um: aí a terceira folha é a
        // do três. Na fileira do dez ao vinte, "a oitava folha" seria a do dezessete e confundiria a criança.
        if (P === 1 && valores[0] === 1 && g - 1 < ORDINAIS.length && U.aleatorio(1, 100) <= 35) {
          texto = `O Pulo está na ${ORDINAIS[g - 1]} folha. ` + texto.replace(/^E qual/, 'Qual');
        }
      }
      return { tipo, texto, fichas: lista };
    }

    function falarPergunta() {
      if (!pergunta || destruido || ctx.sinal.aborted) return Promise.resolve();
      pulsarInterrogacao();
      PC.ui.pipoca.pose('aponta');
      return ctx.falar(pergunta.texto, { mostrar: fichas(pergunta.fichas) }).then(() => {
        if (!destruido && !ctx.sinal.aborted && !PC.ui.pipoca.falando()) PC.ui.pipoca.pose('normal');
      }, () => {});
    }

    /** Repete a pergunta (botão ouvir, toque na Pipoca, 7 s parada). Enquanto o Pulo anda e conta, não interrompe. */
    function instrucao() {
      if (destruido || resolvida || ctx.sinal.aborted || fase !== 'pergunta') return Promise.resolve();
      return falarPergunta();
    }

    /** Retorno descritivo do erro: diz o número escolhido e reconta as duas folhas antes da lacuna, com a regra. */
    function textoErro(errado, g) {
      const certo = valores[g], d = Math.abs(errado - certo);
      const quase = d === 1;                                    // "Quase!" só quando errou por um (PROJETO.md 5)
      let contar = 'Vamos contar';
      if (P > 1) contar = `De ${ext(P)} em ${ext(P)}`;
      if (passo < 0) contar = P > 1 ? contar + ', para trás' : 'Vamos contar para trás';
      return { fala: `${quase ? 'Quase! ' : ''}Esse é o ${ext(errado)}. ${contar}: ${ext(valores[g - 2])}, ${ext(valores[g - 1])}...?`, quase };
    }

    // ------------------------------------------------------------ fluxo
    /** O "Quer parar?" da moldura está aberto? (enquanto estiver, o Pulo não pula nem conta) */
    const pausado = () => {
      if (typeof ctx.pausada === 'function') return !!ctx.pausada();
      const t = ctx.palco.closest('.tela');
      return !!(t && t.querySelector('.pc-moldura-pausa'));
    };
    async function semPausa(sinal) { while (pausado()) await U.esperar(200, sinal || ctx.sinal); }

    async function andarAte(alvo) {
      while (puloEm < alvo) {
        await semPausa();
        await pular(puloEm + 1);
        await dizerNumero(puloEm);
      }
    }

    function novaEspera() {
      let ok, falha;
      const promessa = new Promise((a, b) => { ok = a; falha = b; });
      const ab = () => falha(U.abortado());
      if (ctx.sinal.aborted) ab(); else ctx.sinal.addEventListener('abort', ab, { once: true });
      return { promessa, resolver() { ctx.sinal.removeEventListener('abort', ab); ok(); } };
    }

    async function perguntarLacuna(k) {
      await semPausa();
      const g = lacunas[k];
      lacunaAtual = g;
      certoAtual = valores[g];
      pergunta = perguntaPara(g, k === 0);
      mostrarInterrogacao(g);
      criarBolhas(certoAtual, distratores(certoAtual, passo));
      espera = novaEspera();
      fase = 'pergunta';
      interagiu = false;
      ctx.ocupado(false);
      await semPausa();
      if (fase === 'pergunta') await falarPergunta();
      // demonstração (1ª rodada com demo): a mãozinha mostra uma vez o toque na bolha certa e a Pipoca explica
      if (ctx.demo && k === 0 && !interagiu && fase === 'pergunta' && !destruido && !ctx.sinal.aborted) {
        const b = bolhaCerta();
        if (b) {
          ctx.dica({ x: b.x, y: b.y }, null);
          await ctx.falar('Toque na bolha certa!');
        }
      }
      await espera.promessa;
    }

    function tocarBolha(b) {
      if (destruido || resolvida || ctx.sinal.aborted || !b.ativa) return;
      if (fase === 'ajuda') interromperAjuda();
      if (fase !== 'pergunta') return;              // só o primeiro toque vale até o retorno terminar
      interagiu = true;
      if (b.valor === certoAtual) acertar(b);
      else errar(b);
    }

    async function acertar(b) {
      fase = 'conferindo';
      ctx.ocupado(true);
      const g = lacunaAtual;
      PC.ui.pipoca.calar();
      PC.ui.pipoca.pose('normal');
      bolhas.forEach(o => { if (o !== b && o.ativa) afundar(o, true); });
      try {
        await voarParaFolha(b, g);
        if (destruido || ctx.sinal.aborted) return;
        preencher(g);
        PC.som.bolha();
        await ctx.esperar(140);
        await semPausa();
        await pular(g, { som: 'pulo', altura: 84, ms: 560 });
        respondidas++;
        ctx.avancou();
        destacarNumero(g);
        PC.som.contar(nota(valores[g]));
        // de 1 em 1, o 16 a 19 vem com a estrutura (PROJETO.md 6.1): "Dez e mais sete... dezessete!"
        const v = valores[g], dito = P === 1 && v >= 16 && v <= 19 ? PC.voz.dezEMais(v) : ext(v);
        await ctx.falar(maiuscula(dito) + '!', { mostrar: v });
        if (espera) espera.resolver();
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    }

    function errar(b) {
      fase = 'retorno';
      ctx.ocupado(true);
      erros++;
      afundar(b, false);
      const r = textoErro(b.valor, lacunaAtual);
      ctx.errou({ fala: r.fala, quase: r.quase, mostrar: b.valor });
      // só o primeiro toque vale até o retorno terminar: libera quando a Pipoca acabar de falar
      clearInterval(timerRetorno);
      const t0 = performance.now();
      timerRetorno = setInterval(() => {
        if (destruido || resolvida || ctx.sinal.aborted) { clearInterval(timerRetorno); timerRetorno = null; return; }
        if (PC.ui.pipoca.falando() && performance.now() - t0 < 9000) return;
        clearInterval(timerRetorno); timerRetorno = null;
        if (fase === 'retorno') { fase = 'pergunta'; ctx.ocupado(false); }
      }, 100);
    }

    /** Ajuda que ensina (2º erro seguido): o Pulo volta duas folhas e conta até a lacuna; depois a pergunta volta. */
    async function ajudar(nivel) {
      if (nivel >= 3 || destruido || resolvida || ctx.sinal.aborted) return;
      if (fase !== 'pergunta' && fase !== 'retorno') return;
      const alvo = lacunaAtual - 1, volta = Math.max(0, alvo - 2);
      if (volta >= alvo || puloEm !== alvo) return;
      clearInterval(timerRetorno); timerRetorno = null;
      fase = 'ajuda';
      ctx.ocupado(true);
      const ac = new AbortController();
      ajudaAC = ac;
      const ab = () => ac.abort();
      ctx.sinal.addEventListener('abort', ab, { once: true });
      try {
        PC.ui.pipoca.pose('aponta');
        for (let i = alvo - 1; i >= volta; i--) {
          await semPausa(ac.signal);
          await pular(i, { ms: 300, altura: 40, sinal: ac.signal });
        }
        virar(frente);
        await U.esperar(280, ac.signal);
        await dizerNumero(volta, ac.signal);
        for (let i = volta + 1; i <= alvo; i++) {
          await semPausa(ac.signal);
          await pular(i, { sinal: ac.signal });
          await dizerNumero(i, ac.signal);
        }
        if (ac.signal.aborted || destruido) return;
        fase = 'pergunta';
        ctx.ocupado(false);
        await falarPergunta();
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ctx.sinal.removeEventListener('abort', ab);
        if (ajudaAC === ac) ajudaAC = null;
      }
    }
    /** A criança tocou numa bolha durante a ajuda: o Pulo volta na hora para a folha antes da lacuna. */
    function interromperAjuda() {
      if (ajudaAC) ajudaAC.abort();
      ajudaAC = null;
      puloEm = lacunaAtual - 1;
      pararPulo();
      virar(frente);
      fase = 'pergunta';
      ctx.ocupado(false);
    }

    async function festejar() {
      const p = pe(puloEm);
      PC.som.pulo();
      folhas.forEach((f, i) => timers.push(setTimeout(() => { if (!destruido) destacarNumero(i); }, U.duracao(80 + posDe(i) * 55))));
      await U.animar(puloEl, [
        { offset: 0, transform: tr(p.x, p.y) }, { offset: 0.15, transform: tr(p.x, p.y, 1.14, 0.86) },
        { offset: 0.5, transform: tr(p.x, p.y - 90, 0.94, 1.08) }, { offset: 0.85, transform: tr(p.x, p.y, 1.12, 0.88) },
        { offset: 1, transform: tr(p.x, p.y) },
      ], { duration: 600, easing: 'ease-in-out' });
      if (destruido || ctx.sinal.aborted) throw U.abortado();
      pousar(puloEm);
      await ctx.esperar(250);
    }

    const offToque = PC.on('toque', () => { interagiu = true; });

    // testes no navegador: {"esperar": "ocioso"} também espera o Pulo andar, contar e ajudar (PC.debug.telaOcupada)
    let ocupadaDbg = null;
    if (!PC.modoApp && PC.debug) {
      ocupadaDbg = () => !destruido && !resolvida && !ctx.sinal.aborted && fase !== 'pergunta';
      PC.debug.telaOcupada = ocupadaDbg;
    }

    (async () => {
      try {
        ctx.ocupado(true);
        await ctx.esperar(300);
        await entrar();
        await semPausa();
        await ctx.falar(textoAbertura());
        fase = 'andando';
        await dizerNumero(0);
        for (let k = 0; k < lacunas.length; k++) {
          fase = 'andando';
          ctx.ocupado(true);
          await andarAte(lacunas[k] - 1);
          await perguntarLacuna(k);
        }
        fase = 'andando';
        ctx.ocupado(true);
        pergunta = null;
        await andarAte(n - 1);
        await festejar();
        fase = 'fim';
        resolvida = true;
        ctx.acertou();
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    })();

    // ------------------------------------------------------------ controle (moldura e testes)
    function proximoGesto() {
      if (destruido || resolvida || ctx.sinal.aborted) return null;
      if (fase !== 'pergunta' && fase !== 'retorno' && fase !== 'ajuda') return null;
      const b = bolhaCerta();
      return b ? { tipo: 'tocar', em: { x: b.x, y: b.y } } : null;
    }

    /** Testes: completa todas as lacunas na hora e termina a rodada (um único ctx.acertou()). */
    function resolver() {
      if (destruido || resolvida) return;
      resolvida = true;
      fase = 'fim';
      if (ajudaAC) ajudaAC.abort();
      clearInterval(timerRetorno); timerRetorno = null;
      try {
        lacunas.forEach(g => { if (folhas[g].lacuna || folhas[g].num.classList.contains('interroga')) preencher(g, true); });
        bolhas.forEach(b => { tirarDeJogo(b); b.el.remove(); });
        bolhas = [];
        puloEm = n - 1;
        pararPulo();
        virar(frente);
        puloEl.style.visibility = '';
      } catch (e) { console.error(e); }
      ctx.acertou();
    }

    function estado() {
      return {
        fase, passo, valores: valores.slice(), lacunas: lacunas.slice(), seguidas, respondidas, erros,
        lacuna: lacunaAtual, certo: certoAtual, pulo: puloEm, pergunta: pergunta ? pergunta.texto : '',
        bolhas: bolhas.map(b => ({ valor: b.valor, ativa: b.ativa })),
        folhas: folhas.map(f => (f.num.classList.contains('interroga') ? '?' : (f.lacuna ? '' : f.v))),
      };
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      if (ajudaAC) ajudaAC.abort();
      clearInterval(timerRetorno);
      timers.forEach(t => clearTimeout(t));
      offToque();
      if (ocupadaDbg && PC.debug && PC.debug.telaOcupada === ocupadaDbg) PC.debug.telaOcupada = null;
      bocaDaPipoca(false);
      geracaoMov++;
      try { puloEl.getAnimations().forEach(a => a.cancel()); } catch (e) { /* ok */ }
      raiz.remove();
    }

    return { instrucao, proximoGesto, ajudar, resolver, estado, destruir };
  }

  PC.atividades.registrar('sapinho', {
    titulo: 'Sapinho Pulo',
    icone: 'sapinho',
    cenario: 'lagoa',
    totalRodadas: params => U.limitar(inteiro(params && params.rodadas, 2), 1, 10),
    rodada,
  });
})();
