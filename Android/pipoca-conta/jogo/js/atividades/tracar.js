/* Pipoca Aprende — atividade "tracar": escrever os algarismos de 0 a 10 numa lousa (PROJETO.md 5.7).
   A lousa (moldura de madeira e verde-lousa) mostra o algarismo grande no MESMO desenho da Fredoka (a fonte do jogo):
   o corpo do algarismo bem clarinho, pontinhos de giz no meio do traço, setinhas no sentido de escrever e a bolinha
   verde onde o dedo começa. Arrastar o dedo pinta de giz; é preciso passar pelos pontos de controle em ordem (o giz
   só avança um pouquinho à frente de onde já chegou); a tolerância é medida em dp (≈ 1 cm para cada lado).
   Levantar o dedo não apaga: a bolinha verde fica no último ponto alcançado e a criança continua dali. Sair do
   caminho só para de pintar. Soltar pertinho do fim (o pedaço escondido embaixo da bolinha) completa o traço; terminar
   um traço sem levantar o dedo também vale: o giz volta a pintar quando o dedo chega na bolinha do traço seguinte.
   No fim, o número brilha, a Pipoca diz o número e aparecem N estrelinhas num quadro de 10, contadas; no 0:
   "Zero! Nenhuma estrelinha." (quadro vazio). O 10 é traçado como 1 e depois 0.
   Erros (ctx.errou, com desenho no balão): arrastar um bom pedaço começando longe da bolinha, ou sair da bolinha
   para o lado contrário da setinha. Risquinho curto e escorregão não contam.
   params: { digitos: [...] (0 a 10; uma rodada por algarismo), demo }.
   Modo letra (estações de português): params: { letras: ['A', 'E'], demo }: a mesma lousa com a letra de forma
   maiúscula (Fredoka 700), traços na ordem da escola (de cima para baixo, da esquerda para a direita). No fim a letra
   brilha, vai para a esquerda, a figura de uma palavra do banco que começa com ela aparece num cartão branco ao lado
   e a Pipoca diz "Á! Á de arara!" (sem estrelinhas). */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  // ================================================================ dados: os traços de cada algarismo
  // Desenho da Fredoka 600 (a mesma fonte das plaquinhas do jogo), conferido sobre a fonte desenhada no navegador:
  // cada ponto fica no meio do traço da letra. Unidades: milésimos de "em" (fonte de 1000 px); x a partir da caneta
  // (começo do algarismo) e y a partir da linha de base, negativo para cima.
  //   avanco    largura do algarismo na fonte (centraliza e junta o 1 e o 0 do 10)
  //   tracos    um por risco, na ordem de escrever; tracos.length = número de traços. Sempre de cima para baixo.
  //     p         pontos de controle, em ordem: a criança passa por eles; p[0] é o início (a bolinha verde)
  //     q         índices de p onde o traço faz quina (muda de direção de uma vez, sem curva)
  //     f         traço fechado (termina onde começou: 0 e 8)
  //     sentido   para onde o dedo sai do início
  //     fala      o que a Pipoca diz quando este traço começa (do 2º traço em diante)
  const ALGARISMOS = {
    0: { avanco: 572, tracos: [
      // como a letra O: começa no alto e vai para a esquerda
      { sentido: 'esquerda', f: true, p: [[284, -623], [214, -609], [150, -555], [110, -450], [100, -340], [111, -225], [151, -126], [210, -74], [284, -58], [362, -73], [421, -124], [457, -210], [471, -340], [457, -470], [420, -555], [357, -609]] },
    ] },
    1: { avanco: 383, tracos: [
      // a bandeirinha sobe até o alto e o traço desce reto
      { sentido: 'cima', q: [2], p: [[88, -466], [190, -548], [270, -614], [272, -350], [272, -75]] },
    ] },
    2: { avanco: 577, tracos: [
      { sentido: 'cima', q: [12], p: [[102, -441], [119, -530], [169, -591], [271, -622], [367, -603], [434, -538], [454, -452], [433, -369], [378, -302], [284, -233], [190, -163], [130, -110], [100, -71], [290, -70], [472, -70]] },
    ] },
    3: { avanco: 572, tracos: [
      // duas barriguinhas; no meio, o traço vai até a pontinha e volta
      { sentido: 'direita', q: [8], p: [[128, -536], [180, -596], [281, -626], [370, -611], [437, -551], [450, -468], [401, -399], [331, -364], [295, -363], [331, -362], [395, -337], [449, -280], [470, -206], [451, -137], [401, -88], [279, -57], [189, -78], [98, -184]] },
    ] },
    4: { avanco: 549, tracos: [
      // 4 aberto: desce e vai para o lado; depois o risco de cima para baixo
      { sentido: 'baixo', q: [2], p: [[190, -630], [143, -460], [92, -268], [270, -268], [437, -268]] },
      { sentido: 'baixo', fala: 'Agora o outro risquinho!', p: [[437, -630], [437, -350], [437, -75]] },
    ] },
    5: { avanco: 501, tracos: [
      // desce, faz a barriga; depois o chapéu
      { sentido: 'baixo', q: [2], p: [[148, -612], [130, -500], [127, -372], [247, -375], [332, -347], [385, -283], [399, -215], [385, -149], [333, -86], [241, -58], [158, -72], [88, -123]] },
      { sentido: 'direita', fala: 'Agora o chapéu do cinco!', p: [[148, -617], [270, -617], [390, -617]] },
    ] },
    6: { avanco: 526, tracos: [
      { sentido: 'esquerda', p: [[412, -622], [351, -611], [257, -580], [175, -512], [118, -402], [109, -290], [110, -178], [156, -91], [264, -54], [361, -78], [413, -139], [426, -204], [404, -280], [351, -327], [270, -344], [188, -324], [124, -290]] },
    ] },
    7: { avanco: 533, tracos: [
      { sentido: 'direita', q: [2], p: [[95, -615], [250, -614], [428, -614], [420, -545], [389, -474], [320, -360], [248, -241], [208, -141], [198, -70]] },
    ] },
    8: { avanco: 547, tracos: [
      // começa no alto, vai para a esquerda, cruza o meio, dá a volta embaixo e sobe de novo até o alto
      { sentido: 'esquerda', f: true, p: [[289, -629], [207, -617], [144, -568], [122, -499], [149, -422], [210, -380], [275, -360], [340, -338], [414, -297], [446, -211], [423, -129], [353, -70], [270, -54], [184, -73], [119, -134], [100, -211], [130, -294], [205, -342], [275, -362], [345, -386], [408, -434], [425, -505], [401, -571], [355, -612]] },
    ] },
    9: { avanco: 526, tracos: [
      // a bolinha para a esquerda, fecha lá em cima e desce
      { sentido: 'esquerda', q: [12], p: [[402, -556], [348, -608], [256, -629], [163, -603], [111, -542], [98, -479], [117, -410], [177, -355], [250, -338], [328, -354], [395, -395], [419, -460], [402, -556], [419, -460], [408, -340], [387, -227], [328, -143], [227, -85], [115, -68]] },
    ] },
  };
  // Letras de forma maiúsculas, no desenho da Fredoka 700 (a fonte das cartinhas de letras). Os pontos seguem o
  // "esqueleto" do desenho da fonte (o meio do traço, tirado do glifo afinado em jogo/teste/tracar-letras.html); as
  // pontas livres ficam um pouco para dentro da ponta redonda. Mesmas unidades e campos dos algarismos.
  // Ordem da escola: de cima para baixo e da esquerda para a direita; a vertical antes das barrigas (B, D, P, R) e
  // dos tracinhos deitados (E, F); O e C começam no alto e vão para a esquerda.
  const LETRAS = {
    A: { avanco: 711, tracos: [
      // as duas pernas, saindo do bico; depois o tracinho do meio
      { sentido: 'baixo', p: [[355, -610], [304, -502], [253, -395], [202, -287], [151, -180], [100, -72]] },
      { sentido: 'baixo', p: [[355, -610], [406, -502], [457, -395], [508, -287], [559, -180], [610, -72]] },
      { sentido: 'direita', fala: 'Agora o tracinho do meio!', p: [[172, -220], [294, -220], [416, -220], [538, -220]] },
    ] },
    E: { avanco: 603, tracos: [
      { sentido: 'baixo', p: [[129, -601], [129, -471], [129, -342], [129, -212], [129, -83]] },
      { sentido: 'direita', fala: 'Agora os tracinhos deitados!', p: [[129, -601], [256, -601], [383, -601], [510, -601]] },
      { sentido: 'direita', p: [[129, -341], [280, -341], [430, -341]] },
      { sentido: 'direita', p: [[129, -83], [256, -83], [383, -83], [510, -83]] },
    ] },
    I: { avanco: 239, tracos: [
      { sentido: 'baixo', p: [[119, -615], [119, -479], [119, -343], [119, -208], [119, -72]] },
    ] },
    O: { avanco: 721, tracos: [
      { sentido: 'esquerda', f: true, p: [[361, -601], [296, -593], [232, -571], [180, -528], [141, -472], [121, -408], [111, -341], [120, -274], [139, -209], [178, -154], [230, -111], [294, -89], [361, -79], [427, -88], [491, -110], [544, -153], [582, -209], [601, -274], [611, -341], [601, -407], [581, -471], [542, -526], [490, -569], [427, -592]] },
    ] },
    U: { avanco: 675, tracos: [
      // desce, faz a curva embaixo e sobe
      { sentido: 'baixo', p: [[119, -615], [119, -501], [119, -421], [123, -341], [132, -265], [152, -191], [195, -129], [261, -92], [337, -79], [401, -89], [460, -112], [505, -158], [532, -217], [545, -280], [553, -343], [555, -404], [555, -466], [555, -527], [555, -615]] },
    ] },
    P: { avanco: 595, tracos: [
      { sentido: 'baixo', p: [[125, -601], [125, -469], [125, -336], [125, -204], [125, -72]] },
      { sentido: 'direita', fala: 'Agora a barriga!', p: [[125, -601], [191, -599], [265, -599], [339, -590], [411, -572], [463, -520], [481, -449], [474, -387], [451, -330], [400, -294], [339, -280], [266, -278], [192, -278], [125, -278]] },
    ] },
    B: { avanco: 609, tracos: [
      { sentido: 'baixo', p: [[121, -601], [121, -472], [121, -343], [121, -214], [121, -85]] },
      { sentido: 'direita', fala: 'Agora a barriga de cima!', p: [[121, -601], [183, -600], [253, -600], [324, -597], [393, -584], [451, -549], [469, -481], [461, -408], [429, -362], [355, -357], [238, -357], [121, -357]] },
      { sentido: 'direita', fala: 'Agora a barriga de baixo!', p: [[121, -357], [238, -357], [355, -357], [432, -352], [471, -306], [487, -231], [476, -158], [427, -106], [353, -89], [279, -85], [204, -85], [121, -85]] },
    ] },
    M: { avanco: 809, tracos: [
      { sentido: 'baixo', p: [[119, -615], [119, -479], [119, -343], [119, -208], [119, -72]] },
      { sentido: 'baixo', p: [[125, -605], [218, -488], [311, -372], [404, -255]] },
      { sentido: 'baixo', p: [[683, -605], [590, -488], [497, -372], [404, -255]] },
      { sentido: 'baixo', p: [[689, -615], [689, -479], [689, -343], [689, -208], [689, -72]] },
    ] },
    L: { avanco: 569, tracos: [
      { sentido: 'baixo', q: [4], p: [[141, -615], [141, -478], [141, -342], [141, -205], [141, -69], [259, -69], [377, -69], [495, -69]] },
    ] },
    T: { avanco: 640, tracos: [
      { sentido: 'direita', p: [[85, -615], [203, -615], [320, -615], [438, -615], [555, -615]] },
      { sentido: 'baixo', p: [[320, -615], [320, -479], [320, -343], [320, -208], [320, -72]] },
    ] },
    V: { avanco: 728, tracos: [
      { sentido: 'baixo', p: [[113, -620], [176, -489], [239, -357], [301, -226], [364, -95]] },
      { sentido: 'baixo', p: [[615, -620], [552, -489], [490, -357], [427, -226], [364, -95]] },
    ] },
    C: { avanco: 631, tracos: [
      { sentido: 'esquerda', p: [[543, -555], [450, -589], [380, -600], [311, -591], [244, -571], [186, -532], [142, -477], [120, -411], [111, -341], [120, -272], [141, -206], [185, -151], [242, -112], [308, -90], [377, -81], [446, -90], [539, -123]] },
    ] },
    D: { avanco: 655, tracos: [
      { sentido: 'baixo', p: [[119, -601], [119, -472], [119, -343], [119, -214], [119, -85]] },
      { sentido: 'direita', fala: 'Agora a barriga!', p: [[119, -601], [183, -600], [256, -598], [328, -589], [399, -573], [460, -535], [507, -480], [533, -413], [543, -341], [533, -272], [509, -206], [464, -152], [405, -114], [338, -97], [268, -88], [198, -85], [119, -85]] },
    ] },
    F: { avanco: 613, tracos: [
      { sentido: 'baixo', p: [[129, -601], [129, -469], [129, -336], [129, -204], [129, -72]] },
      { sentido: 'direita', fala: 'Agora os tracinhos deitados!', p: [[129, -601], [256, -601], [383, -601], [510, -601]] },
      { sentido: 'direita', p: [[129, -341], [281, -341], [432, -341]] },
    ] },
    R: { avanco: 604, tracos: [
      // a vertical, a barriga (volta até a vertical) e a perninha, que sai do meio
      { sentido: 'baixo', p: [[125, -601], [125, -469], [125, -336], [125, -204], [125, -72]] },
      { sentido: 'direita', fala: 'Agora a barriga!', p: [[125, -601], [191, -599], [265, -599], [338, -590], [410, -573], [463, -522], [481, -451], [474, -385], [448, -325], [405, -284], [339, -278], [265, -278], [192, -278], [125, -278]] },
      { sentido: 'baixo', fala: 'Agora a perninha!', p: [[413, -281], [419, -213], [448, -148], [510, -65]] },
    ] },
    N: { avanco: 670, tracos: [
      { sentido: 'baixo', p: [[119, -615], [119, -479], [119, -343], [119, -208], [119, -72]] },
      { sentido: 'baixo', p: [[125, -605], [209, -502], [293, -399], [377, -296], [461, -193], [545, -90]] },
      { sentido: 'baixo', p: [[549, -615], [549, -479], [549, -343], [549, -208], [549, -72]] },
    ] },
    J: { avanco: 531, tracos: [
      // desce e faz o ganchinho para a esquerda
      { sentido: 'baixo', p: [[401, -615], [401, -511], [401, -441], [401, -371], [399, -301], [393, -239], [381, -177], [353, -123], [299, -93], [239, -82], [178, -92], [100, -127]] },
    ] },
  };
  [ALGARISMOS, LETRAS].forEach(tabela => Object.keys(tabela).forEach(d => {
    const a = tabela[d];
    a.numeroDeTracos = a.tracos.length;
    a.tracos.forEach(t => { t.inicio = t.p[0]; });
  }));

  // ================================================================ medidas (palco virtual 1600 × 900)
  const LOUSA = { x: 330, y: 160, l: 1200, a: 700 };      // por fora da moldura de madeira
  const CENTRO = { x: 930, y: 505 };                      // centro do algarismo enquanto a criança escreve
  const K = 0.75;                                         // px virtuais por unidade da fonte (~540 px de altura)
  const MEIO_Y = -343.5;                                  // meio da altura dos algarismos na fonte (de -703 a +16)
  const GIZ = Math.round(112 * K);                        // grossura do giz (um pouco mais fino que o traço da fonte)
  const DEPOIS = { x: 700, xLetra: 730, k: 0.62, k10: 0.56 }; // no fim, o algarismo (ou a letra) vai para a esquerda e diminui
  const QUADRO = { x: 965, y: 413, l: 460, a: 184 };      // quadro de 10 das estrelinhas (lado direito da lousa)
  const GIZ_LETRA = Math.round(130 * K);                  // a Fredoka 700 é mais grossa: giz um pouco mais largo
  const CARTAO = { x: 1035, y: 318, l: 320, a: 374 };     // cartão da figura no modo letra (no lugar do quadro de 10)
  const JANELA_FRENTE = 90;                               // quanto o giz pode avançar de uma vez (px virtuais)
  const JANELA_TRAS = 40;
  const PASSO_DEDO = 6;                                   // o movimento do dedo é examinado de 6 em 6 px
  const EMPATE = 3;                                       // ida e volta no mesmo lugar (3, 9): vale o que vem depois
  const TOL_DP = 63, TOL_MIN = 48, TOL_MAX = 120;         // ≈ 1 cm de cada lado, convertido para px virtuais

  /** Tolerância (px virtuais) de cada lado do caminho: ≈ 63 dp, com limites para telas muito grandes ou pequenas. */
  const tolerancia = () => U.limitar(TOL_DP / (PC.palco.escala || 1), TOL_MIN, TOL_MAX);

  // ================================================================ geometria
  /** Catmull-Rom centrípeta → curvas de Bézier cúbicas que passam exatamente pelos pontos. */
  function bezierCatmull(pts, fechado) {
    const n = pts.length, segs = [];
    if (n < 2) return segs;
    const P = i => {
      if (fechado) return pts[((i % n) + n) % n];
      if (i < 0) return { x: 2 * pts[0].x - pts[1].x, y: 2 * pts[0].y - pts[1].y };
      if (i > n - 1) return { x: 2 * pts[n - 1].x - pts[n - 2].x, y: 2 * pts[n - 1].y - pts[n - 2].y };
      return pts[i];
    };
    const m = fechado ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const d1 = Math.sqrt(U.distancia(p0, p1)) || 1e-6, d2 = Math.sqrt(U.distancia(p1, p2)) || 1e-6, d3 = Math.sqrt(U.distancia(p2, p3)) || 1e-6;
      const c1 = k => (d1 * d1 * p2[k] - d2 * d2 * p0[k] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[k]) / (3 * d1 * (d1 + d2));
      const c2 = k => (d3 * d3 * p1[k] - d2 * d2 * p3[k] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[k]) / (3 * d3 * (d3 + d2));
      segs.push([p1, { x: c1('x'), y: c1('y') }, { x: c2('x'), y: c2('y') }, p2]);
    }
    return segs;
  }
  /** Curvas de um traço: nas quinas, cada trecho é uma curva separada. */
  function segmentos(pts, quinas, fechado) {
    if (fechado && !quinas.length) return bezierCatmull(pts, true);
    const cortes = [0].concat(quinas.slice().sort((a, b) => a - b), [pts.length - 1]);
    let r = [];
    for (let i = 0; i < cortes.length - 1; i++) r = r.concat(bezierCatmull(pts.slice(cortes[i], cortes[i + 1] + 1), false));
    return r;
  }
  function bez(sg, t) {
    const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return { x: a * sg[0].x + b * sg[1].x + c * sg[2].x + d * sg[3].x, y: a * sg[0].y + b * sg[1].y + c * sg[2].y + d * sg[3].y };
  }
  const arred = v => Math.round(v * 10) / 10;

  /**
   * Monta um traço no palco: amostras a cada ~3 px (xs, ys, ss = comprimento até ali), comprimento L,
   * marcos (comprimento até cada ponto de controle) e o caminho SVG (d).
   */
  function montarTraco(def, ox, oy) {
    const pts = def.p.map(([x, y]) => ({ x: ox + x * K, y: oy + y * K }));
    const segs = segmentos(pts, def.q || [], !!def.f);
    const xs = [pts[0].x], ys = [pts[0].y], ss = [0], marcos = [0];
    let L = 0;
    segs.forEach(sg => {
      let c = 0, ant = sg[0];
      for (let k = 1; k <= 16; k++) { const q = bez(sg, k / 16); c += U.distancia(ant, q); ant = q; }
      const n = Math.max(2, Math.ceil(c / 3));
      for (let k = 1; k <= n; k++) {
        const q = bez(sg, k / n);
        L += Math.hypot(q.x - xs[xs.length - 1], q.y - ys[ys.length - 1]);
        xs.push(q.x); ys.push(q.y); ss.push(L);
      }
      marcos.push(L);
    });
    let d = `M${arred(pts[0].x)} ${arred(pts[0].y)}`;
    segs.forEach(sg => { d += ` C${arred(sg[1].x)} ${arred(sg[1].y)} ${arred(sg[2].x)} ${arred(sg[2].y)} ${arred(sg[3].x)} ${arred(sg[3].y)}`; });
    return { def, pts, xs, ys, ss, L, d, marcos };
  }
  /** Índice da última amostra com comprimento <= s. */
  function indiceDe(t, s) {
    if (s <= 0) return 0;
    if (s >= t.L) return t.ss.length - 1;
    let a = 0, b = t.ss.length - 1;
    while (b - a > 1) { const m = (a + b) >> 1; if (t.ss[m] <= s) a = m; else b = m; }
    return a;
  }
  /** Ponto do traço no comprimento s. */
  function pontoEm(t, s) {
    const i = indiceDe(t, s);
    if (i >= t.ss.length - 1) return { x: t.xs[i], y: t.ys[i] };
    const seg = t.ss[i + 1] - t.ss[i], f = seg > 0 ? (s - t.ss[i]) / seg : 0;
    return { x: t.xs[i] + (t.xs[i + 1] - t.xs[i]) * f, y: t.ys[i] + (t.ys[i + 1] - t.ys[i]) * f };
  }
  /** Direção (unitária) do traço no comprimento s. */
  function tangenteEm(t, s) {
    const a = pontoEm(t, Math.max(0, s - 6)), b = pontoEm(t, Math.min(t.L, s + 10));
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
  }

  /** Lista de algarismos válidos (0 a 10) dos params. */
  function digitosDe(params) {
    const l = (params && Array.isArray(params.digitos) ? params.digitos : []).map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 10);
    return l.length ? l : [1];
  }
  /** Modo letra: lista das letras válidas dos params (null se a fase é de algarismos). */
  function letrasDe(params) {
    if (!params || !Array.isArray(params.letras)) return null;
    const l = params.letras.map(x => String(x).toUpperCase()).filter(x => LETRAS[x]);
    return l.length ? l : ['A'];
  }
  /** Rodadas da fase: [{ letra: 'A' }] ou [{ numero: 3 }]. */
  function itensDe(params) {
    const l = letrasDe(params);
    return l ? l.map(letra => ({ letra })) : digitosDe(params).map(numero => ({ numero }));
  }
  /** Palavra do banco que começa com a letra, com figura; de preferência um bicho do álbum. */
  function palavraDa(letra) {
    if (!PC.palavras) return null;
    const todas = PC.palavras.filtrar({ iniciais: [letra], comFigura: true });
    const bichos = todas.filter(p => p.bicho);
    return U.escolher(bichos.length ? bichos : todas) || null;
  }
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);

  // ================================================================ desenhos fixos
  const ESTRELA = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6 L 39.6 22.6 L 57.7 24.6 L 44.2 36.9 L 48 54.7 L 32 45.6 L 16 54.7 L 19.8 36.9 L 6.3 24.6 L 24.4 22.6 Z" fill="#FFC93C" stroke="#3A2A5A" stroke-width="5" stroke-linejoin="round"/><path d="M23 27 L 30 25.5" stroke="#FFF1BC" stroke-width="4" stroke-linecap="round"/></svg>';
  const FAISCA = '<svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="M0 -19 Q 2.6 -2.6 19 0 Q 2.6 2.6 0 19 Q -2.6 2.6 -19 0 Q -2.6 -2.6 0 -19 Z" fill="#FFF3B0"/></svg>';
  // desenhos para o balão da Pipoca (a criança não lê: o desenho mostra do que ela está falando)
  const ICONE_BOLINHA = '<svg viewBox="-40 -40 80 80" aria-hidden="true"><circle r="34" fill="#3A2A5A"/><circle r="28.5" fill="#fff"/>' +
    '<circle r="21" fill="#5CC84A"/><path d="M-12 -7 A 14 14 0 0 1 1 -16" fill="none" stroke="#C8F7B5" stroke-width="5" stroke-linecap="round"/></svg>';
  // setinha com cabo: a ponta é sempre o lado mais comprido, então a direção não se confunde em nenhum ângulo
  // (a ponta de flecha sem cabo, girada, parecia apontar para um dos cantos de trás)
  const SETA_D = 'M-24 -7 L 0 -7 L 0 -19 L 25 0 L 0 19 L 0 7 L -24 7 Z';
  const ICONE_SETA = '<svg viewBox="-40 -40 80 80" aria-hidden="true"><path d="M-31 -10 L 1 -10 L 1 -27 L 34 0 L 1 27 L 1 10 L -31 10 Z" fill="#FFD84D" stroke="#3A2A5A" stroke-width="6" stroke-linejoin="round"/></svg>';
  const icone = svg => U.el('div', { class: 'pc-tracar-icone', html: svg });
  const CAVALETE = `<svg class="pc-tracar-cavalete" viewBox="0 0 1600 900" width="1600" height="900" aria-hidden="true">
      <g fill="none" stroke-linecap="round">
        <path d="M478 118 L 428 912 M1382 118 L 1432 912" stroke="#3A2A5A" stroke-width="46"/>
        <path d="M478 118 L 428 912 M1382 118 L 1432 912" stroke="#A8743C" stroke-width="34"/>
        <path d="M472 124 L 424 880 M1376 124 L 1424 880" stroke="#CF9A5C" stroke-width="8" opacity=".7"/>
      </g></svg>`;

  // ================================================================ estilo
  U.estilo('tracar', `
    .pc-tracar-cavalete { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; pointer-events: none; overflow: visible; }
    .pc-tracar-lousa { position: absolute; left: ${LOUSA.x}px; top: ${LOUSA.y}px; width: ${LOUSA.l}px; height: ${LOUSA.a}px; border-radius: 40px;
      border: 5px solid var(--tinta); background: linear-gradient(180deg, #D9A66A 0%, #C28C4E 48%, #A8753E 100%);
      box-shadow: 0 16px 0 rgba(58, 42, 90, .22), inset 0 6px 0 rgba(255, 255, 255, .28), inset 0 -7px 0 rgba(90, 50, 20, .18);
      touch-action: none; cursor: pointer; }
    .pc-tracar-verde { position: absolute; left: 25px; top: 25px; right: 25px; bottom: 25px; border-radius: 22px; border: 5px solid var(--tinta);
      pointer-events: none;
      background: radial-gradient(ellipse 420px 170px at 24% 26%, rgba(255, 255, 255, .07), rgba(255, 255, 255, 0) 70%),
        radial-gradient(ellipse 340px 150px at 78% 74%, rgba(255, 255, 255, .055), rgba(255, 255, 255, 0) 70%),
        linear-gradient(180deg, #34685A 0%, #2F5D50 60%, #2A5448 100%);
      box-shadow: inset 0 12px 0 rgba(0, 0, 0, .16); }
    .pc-tracar-prego { position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #8A5A34; box-shadow: inset 0 3px 0 rgba(255, 255, 255, .35); pointer-events: none; }
    .pc-tracar-bandeja { position: absolute; left: 290px; width: 610px; bottom: -22px; height: 34px; border-radius: 14px; border: 5px solid var(--tinta);
      background: linear-gradient(180deg, #C9935A, #94622F); pointer-events: none; }
    .pc-tracar-peca { position: absolute; bottom: 100%; margin-bottom: -5px; height: 24px; border-radius: 12px; border: 4px solid var(--tinta); }
    .pc-tracar-apagador { position: absolute; bottom: 100%; margin-bottom: -5px; right: 46px; width: 124px; height: 42px; border-radius: 10px; border: 4px solid var(--tinta);
      background: linear-gradient(180deg, #C98A55 0, #C98A55 52%, #B9B3CC 52%, #B9B3CC 100%); }
    .pc-tracar-desenho { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; pointer-events: none; transform-origin: ${CENTRO.x}px ${CENTRO.y}px; }
    .pc-tracar-desenho svg { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; overflow: visible; }
    .pc-tracar-fantasma { font-family: var(--fonte); font-weight: 600; fill: rgba(244, 241, 232, .13); stroke: rgba(244, 241, 232, .30);
      stroke-width: 3px; stroke-dasharray: 9 11; }
    .pc-tracar-fantasma.letra { font-weight: 700; }
    .pc-tracar-cartao { position: absolute; left: ${CARTAO.x}px; top: ${CARTAO.y}px; width: ${CARTAO.l}px; height: ${CARTAO.a}px; box-sizing: border-box;
      display: grid; grid-template-rows: 1fr auto; justify-items: center; padding: 18px 16px 14px; border-radius: 34px; background: #fff;
      border: 5px solid var(--tinta); box-shadow: 0 10px 0 rgba(0, 0, 0, .18); pointer-events: none;
      opacity: 0; transform: scale(.85) rotate(-3deg); transition: opacity .3s, transform .4s cubic-bezier(.3, 1.5, .5, 1); }
    .pc-tracar-cartao.mostra { opacity: 1; transform: scale(1) rotate(-2deg); }
    .pc-tracar-figura { width: 250px; height: 250px; }
    .pc-tracar-figura svg { width: 100%; height: 100%; display: block; }
    .pc-tracar-palavra { font: 700 50px/1 var(--fonte); color: var(--tinta); letter-spacing: .02em; white-space: nowrap; }
    .pc-tracar-palavra b { color: #FF7A6B; font-weight: 700; }
    .pc-tracar-pontilhado { fill: none; stroke: #F4F1E8; stroke-width: 13px; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 0 27;
      transition: opacity .3s; }
    .pc-tracar-pontilhado.futuro { opacity: .38; }
    .pc-tracar-halo { fill: none; stroke: #FFF8D2; stroke-linecap: round; stroke-linejoin: round; opacity: 0; }
    .pc-tracar-halo.fora { stroke: #FFE27A; }
    .pc-tracar-lampejo { fill: none; stroke: #FFE45C; stroke-linecap: round; stroke-linejoin: round; opacity: 0; }
    .pc-tracar-icone { flex: none; width: 76px; height: 76px; }
    .pc-tracar-icone svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .pc-tracar-po { fill: none; stroke: rgba(255, 255, 255, .22); stroke-linecap: round; stroke-linejoin: round; visibility: hidden; }
    .pc-tracar-giz { fill: none; stroke: #F6F3EA; stroke-linecap: round; stroke-linejoin: round; visibility: hidden; }
    .pc-tracar-rastro { fill: none; stroke: #F4F1E8; stroke-linecap: round; stroke-linejoin: round; opacity: .5; }
    .pc-tracar-setas { transition: opacity .3s; }
    .pc-tracar-setas.oculta { opacity: 0; }
    .pc-tracar-seta path { fill: #FFD84D; stroke: var(--tinta); stroke-width: 4px; stroke-linejoin: round; transition: opacity .25s; }
    .pc-tracar-seta.passou path { opacity: 0; }
    .pc-tracar-setas.balanca .pc-tracar-seta path { animation: pcTracarSeta .45s ease-in-out 3; }
    @keyframes pcTracarSeta { 50% { transform: translateX(12px); } }
    .pc-tracar-inicio { position: absolute; left: 0; top: 0; width: 0; height: 0; transition: opacity .2s; }
    .pc-tracar-inicio.some { opacity: 0; }
    .pc-tracar-bola { position: absolute; left: -34px; top: -34px; width: 68px; height: 68px; border-radius: 50%; background: #5CC84A;
      border: 7px solid #fff; box-shadow: 0 0 0 5px var(--tinta), inset 0 -6px 0 rgba(0, 0, 0, .14); }
    .pc-tracar-bola::after { content: ''; position: absolute; left: -26px; top: -26px; width: 106px; height: 106px; border-radius: 50%;
      border: 7px solid #C8F7B5; animation: pcTracarPulsa 1.4s ease-out infinite; }
    .pc-tracar-inicio.tracando .pc-tracar-bola::after { animation: none; opacity: 0; }
    .pc-tracar-inicio.chama .pc-tracar-bola { animation: pcTracarChama .42s ease-in-out 3; }
    @keyframes pcTracarPulsa { from { transform: scale(.6); opacity: .95; } to { transform: scale(1.3); opacity: 0; } }
    @keyframes pcTracarChama { 50% { transform: scale(1.4); } }
    .pc-tracar-cometa { position: absolute; left: 0; top: 0; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; pointer-events: none;
      background: #FFF6C2; box-shadow: 0 0 0 7px rgba(255, 226, 122, .5), 0 0 0 15px rgba(255, 226, 122, .2); }
    .pc-tracar-quadro { position: absolute; left: ${QUADRO.x}px; top: ${QUADRO.y}px; width: ${QUADRO.l}px; height: ${QUADRO.a}px; display: grid;
      grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(2, 1fr); border: 6px solid rgba(246, 243, 234, .92); border-radius: 16px;
      pointer-events: none; opacity: 0; transform: scale(.85); transition: opacity .3s, transform .35s cubic-bezier(.3, 1.5, .5, 1); }
    .pc-tracar-quadro.mostra { opacity: 1; transform: scale(1); }
    .pc-tracar-casa { display: grid; place-items: center; border-right: 3px dashed rgba(246, 243, 234, .6); border-bottom: 3px dashed rgba(246, 243, 234, .6); }
    .pc-tracar-casa:nth-child(5n) { border-right: 0; }
    .pc-tracar-casa:nth-child(n+6) { border-bottom: 0; }
    .pc-tracar-quadro.vazio .pc-tracar-casa { animation: pcTracarVazio .5s ease-in-out 2; }
    @keyframes pcTracarVazio { 50% { opacity: .3; } }
    .pc-tracar-estrela { width: 74px; height: 74px; opacity: 0; }
    .pc-tracar-estrela svg { width: 100%; height: 100%; display: block; }
    .pc-tracar-estrela.aparece { animation: pcTracarEstrela .45s cubic-bezier(.3, 1.6, .5, 1) forwards; }
    @keyframes pcTracarEstrela { from { opacity: 0; transform: scale(.2) rotate(-40deg); } to { opacity: 1; transform: scale(1) rotate(0deg); } }
    .pc-tracar-faisca { position: absolute; width: 58px; height: 58px; margin: -29px 0 0 -29px; opacity: 0; pointer-events: none; }
    .pc-tracar-faisca svg { width: 100%; height: 100%; display: block; }
  `);

  // ================================================================ atividade
  PC.atividades.registrar('tracar', {
    titulo: 'Escrever os números',
    icone: 'tracar',
    cenario: 'prado',
    totalRodadas(params) { return itensDe(params).length; },

    rodada(ctx) {
      const lista = itensDe(ctx.params);
      const item = lista[Math.min(ctx.indice, lista.length - 1)];
      const modoLetra = !!item.letra;
      const letra = modoLetra ? item.letra : null;
      const numero = modoLetra ? null : item.numero;
      const nome = modoLetra ? PC.palavras.falaLetra(letra) : PC.voz.extenso(numero);
      const Nome = maiuscula(nome);
      const partes = modoLetra ? [letra] : numero === 10 ? [1, 0] : [numero];
      const TABELA = modoLetra ? LETRAS : ALGARISMOS;
      const GIZ_RODADA = modoLetra ? GIZ_LETRA : GIZ;
      const palavra = modoLetra ? palavraDa(letra) : null;
      const raiz = ctx.palco;
      /** O que aparece no balão ao lado da fala: o número (com pontinhos) ou a letra numa cartinha. */
      const mostrar = () => (modoLetra ? U.el('div', { class: 'balao-numero', 'aria-hidden': 'true' }, U.el('b', { text: letra })) : numero);

      // ------------------------------------------------------------ geometria da rodada
      const largura = partes.reduce((a, d) => a + TABELA[d].avanco, 0) * K;
      const base = CENTRO.y - MEIO_Y * K;                          // linha de base da fonte
      const x0 = CENTRO.x - largura / 2;
      const caixa = { x: x0, y: base - 703 * K, l: largura, a: 719 * K };
      const canetas = [], tracos = [];
      let caneta = x0;
      partes.forEach((d, iParte) => {
        canetas.push(caneta);
        TABELA[d].tracos.forEach((def, i) => {
          const t = montarTraco(def, caneta, base);
          t.digito = d; t.parte = iParte;
          t.fala = iParte > 0 && i === 0 ? 'Agora o ' + PC.voz.extenso(d) + '!' : (def.fala || '');
          tracos.push(t);
        });
        caneta += TABELA[d].avanco * K;
      });

      // ------------------------------------------------------------ cena: cavalete, lousa, algarismo, quadro de 10
      const cavalete = U.svg(CAVALETE);
      const bandeja = U.el('div', { class: 'pc-tracar-bandeja' },
        U.el('i', { class: 'pc-tracar-peca', style: 'left:36px;width:96px;background:#F7F4EC' }),
        U.el('i', { class: 'pc-tracar-peca', style: 'left:150px;width:58px;background:#FFD84D' }),
        U.el('i', { class: 'pc-tracar-apagador' }));
      const lousa = U.el('div', { class: 'pc-tracar-lousa', teste: 'lousa', role: 'img', 'aria-label': (modoLetra ? 'Lousa para escrever a letra ' : 'Lousa para escrever o ') + nome },
        U.el('div', { class: 'pc-tracar-verde' }),
        U.el('i', { class: 'pc-tracar-prego', style: 'left:5px;top:5px' }), U.el('i', { class: 'pc-tracar-prego', style: 'right:5px;top:5px' }),
        U.el('i', { class: 'pc-tracar-prego', style: 'left:5px;bottom:5px' }), U.el('i', { class: 'pc-tracar-prego', style: 'right:5px;bottom:5px' }),
        bandeja);

      const desenho = U.el('div', { class: 'pc-tracar-desenho' });
      const svg = U.svgEl('svg', { viewBox: '0 0 1600 900', width: 1600, height: 900, 'aria-hidden': 'true' });
      const gFantasma = U.svgEl('g'), gHalo = U.svgEl('g'), gPontos = U.svgEl('g'), gGiz = U.svgEl('g'), gRastro = U.svgEl('g'), gSetas = U.svgEl('g');
      svg.append(gFantasma, gHalo, gPontos, gGiz, gRastro, gSetas);
      partes.forEach((d, i) => {
        gFantasma.appendChild(U.svgEl('text', { class: 'pc-tracar-fantasma' + (modoLetra ? ' letra' : ''), x: arred(canetas[i]), y: arred(base), 'font-size': 1000 * K }, String(d)));
      });
      const lugaresSetas = [];                                   // setas já postas (para não amontoar)
      /**
       * Lugar ruim para setinha: quina fechada ou ida e volta (o meio do 3, a haste do 9), ou outra parte de algum traço
       * passando perto (o cruzamento do 8, o risco do 4 que corta a barra). Ali a criança veria duas direções juntas.
       */
      function lugarConfuso(t, sa, p) {
        const a = tangenteEm(t, Math.max(0, sa - 30)), b = tangenteEm(t, Math.min(t.L, sa + 30));
        if (a.x * b.x + a.y * b.y < -0.3) return true;
        return tracos.some(u => {
          for (let k = 0; k < u.xs.length; k += 2) {
            if (u === t && Math.abs(u.ss[k] - sa) < 50) continue;
            if (Math.hypot(u.xs[k] - p.x, u.ys[k] - p.y) < 46) return true;
          }
          return false;
        });
      }
      tracos.forEach((t, i) => {
        t.elHalos = [
          U.svgEl('path', { d: t.d, class: 'pc-tracar-halo fora', 'stroke-width': GIZ_RODADA + 64 }),
          U.svgEl('path', { d: t.d, class: 'pc-tracar-halo', 'stroke-width': GIZ_RODADA + 30 }),
        ];
        t.elPontos = U.svgEl('path', { d: t.d, class: 'pc-tracar-pontilhado' + (i ? ' futuro' : '') });
        t.elPo = U.svgEl('path', { d: t.d, class: 'pc-tracar-po', 'stroke-width': GIZ_RODADA + 12, pathLength: 1000 });
        t.elGiz = U.svgEl('path', { d: t.d, class: 'pc-tracar-giz', 'stroke-width': GIZ_RODADA, pathLength: 1000 });
        t.elLampejo = U.svgEl('path', { d: t.d, class: 'pc-tracar-lampejo', 'stroke-width': GIZ_RODADA });
        gHalo.append(...t.elHalos); gPontos.appendChild(t.elPontos); gGiz.append(t.elPo, t.elGiz, t.elLampejo);
        // setinhas no sentido do traço, ao longo do caminho
        t.gSetas = U.svgEl('g', { class: 'pc-tracar-setas' + (i ? ' oculta' : '') });
        t.setas = [];
        // a primeira fica longe da bolinha verde (que cobre o começo); traço curto (o chapéu do 5) ganha uma só, no meio
        const passo = 150, ini = t.L < 300 ? Math.max(80, t.L * 0.55) : 80, fim = t.L - (t.def.f ? 100 : 40);
        const posicoes = [];
        for (let sa = ini; sa <= fim; sa += passo) {
          // lugar ruim ou perto de outra seta: anda um pouco para a frente (ou desiste desta)
          for (let x = sa; x <= fim && x < sa + passo - 20; x += 20) {
            const p = pontoEm(t, x);
            if (lugaresSetas.some(q => U.distancia(p, q) < 80) || lugarConfuso(t, x, p)) continue;
            posicoes.push(x); lugaresSetas.push(p);
            break;
          }
        }
        if (!posicoes.length) { posicoes.push(t.L * 0.55); lugaresSetas.push(pontoEm(t, t.L * 0.55)); }
        posicoes.forEach(sa => {
          const p = pontoEm(t, sa), tg = tangenteEm(t, sa);
          const ang = Math.atan2(tg.y, tg.x) * 180 / Math.PI;
          const el = U.svgEl('g', { class: 'pc-tracar-seta', transform: `translate(${arred(p.x)} ${arred(p.y)}) rotate(${arred(ang)})` },
            U.svgEl('path', { d: SETA_D }));
          t.gSetas.appendChild(el);
          t.setas.push({ s: sa, el });
        });
        gSetas.appendChild(t.gSetas);
      });
      const inicio = U.el('div', { class: 'pc-tracar-inicio' }, U.el('div', { class: 'pc-tracar-bola' }));
      desenho.append(svg, inicio);

      // lado direito da lousa no fim: o quadro de 10 das estrelinhas (algarismo) ou o cartão da figura (letra)
      let quadro, cartao = null;
      const casas = [];
      if (modoLetra) {
        // a palavra escrita embaixo da figura, com a letra do começo colorida (a criança liga a letra ao desenho)
        quadro = cartao = U.el('div', { class: 'pc-tracar-cartao', 'aria-hidden': 'true' });
        if (palavra) {
          cartao.append(U.el('div', { class: 'pc-tracar-figura', html: PC.palavras.desenho(palavra) }),
            U.el('div', { class: 'pc-tracar-palavra' }, U.el('b', { text: palavra.texto.charAt(0) }), palavra.texto.slice(1)));
        }
      } else {
        quadro = U.el('div', { class: 'pc-tracar-quadro', 'aria-hidden': 'true' });
        for (let i = 0; i < 10; i++) { const c = U.el('i', { class: 'pc-tracar-casa' }); casas.push(c); quadro.appendChild(c); }
      }

      raiz.append(cavalete, lousa, desenho, quadro);

      // ------------------------------------------------------------ estado
      let fase = 'tracando';        // 'demo' | 'tracando' | 'fim'
      let atual = 0;                // traço atual
      let s = 0;                    // até onde o giz chegou no traço atual (px virtuais ao longo do caminho)
      let notas = 0;                // pontos de controle já passados no traço atual (som)
      let gesto = null;             // arraste em andamento
      let animacao = null;          // mãozinha ou cometinha andando pelo caminho
      let destruida = false, resolvida = false, totalErros = 0, ultimoErro = -1e9, ultimaFalaToque = -1e9;
      const timers = new Set();
      const depois = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!destruida) fn(); }, U.duracao(ms)); timers.add(id); return id; };
      const falar = (texto, op) => ctx.falar(texto, op).catch(() => 'abortada');

      function moverInicio(p) { inicio.style.transform = `translate(${arred(p.x)}px, ${arred(p.y)}px)`; }
      moverInicio(pontoEm(tracos[0], 0));

      /** Pinta o giz do traço t até o comprimento sx (e apaga as setinhas que ficaram para trás). */
      function pintar(t, sx) {
        const f = t.L > 0 ? U.limitar(sx / t.L, 0, 1) : 1;
        [t.elPo, t.elGiz].forEach(el => {
          if (f <= 0) { el.style.visibility = 'hidden'; return; }
          el.style.visibility = 'visible';
          if (f >= 1) { el.style.strokeDasharray = 'none'; el.style.strokeDashoffset = '0'; }
          else { el.style.strokeDasharray = '1000 1000'; el.style.strokeDashoffset = String(arred(1000 - 1000 * f)); }
        });
        t.setas.forEach(a => a.el.classList.toggle('passou', sx >= a.s - 20));
      }

      /** A bolinha verde chama a atenção (e as setinhas balançam). */
      function chamarAtencao() {
        inicio.classList.remove('chama'); void inicio.offsetWidth; inicio.classList.add('chama');
        const t = tracos[atual];
        if (t) { t.gSetas.classList.remove('balanca'); void t.gSetas.getBoundingClientRect(); t.gSetas.classList.add('balanca'); }
      }

      // ------------------------------------------------------------ mãozinha / cometinha que percorre o caminho
      /**
       * Anda pelo traço t, do comprimento de até ate. opcoes: ms (andar), rastro (giz clarinho atrás), mao (false =
       * cometinha de luz, sem mão). Devolve { fim: Promise<boolean (completou)>, parar() }.
       */
      function percorrer(t, de, ate, { ms = 2000, rastro = false, mao = true } = {}) {
        const el = mao ? U.el('div', { class: 'dica-mao pc-tracar-mao', html: PC.arte.mao() }) : U.el('div', { class: 'pc-tracar-cometa' });
        (mao ? raiz : desenho).appendChild(el);
        let trilha = null;
        if (rastro) {
          trilha = U.svgEl('path', { d: t.d, class: 'pc-tracar-rastro', 'stroke-width': Math.round(GIZ_RODADA * 0.8), pathLength: 1000 });
          trilha.style.strokeDasharray = '1000 1000';
          trilha.style.strokeDashoffset = String(1000 - 1000 * de / t.L);
          gRastro.appendChild(trilha);
        }
        const dx = mao ? -34 : 0, dy = mao ? -18 : 0;
        const pos = (q, k) => `translate(${arred(q.x + dx)}px, ${arred(q.y + dy)}px) scale(${arred(k * 100) / 100})`;
        const suave = f => (f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2);
        const entrada = U.duracao(mao ? 350 : 150), anda = Math.max(1, U.duracao(ms)), parada = U.duracao(mao ? 350 : 60), saida = U.duracao(300);
        const total = entrada + anda + parada + saida;
        let vivo = true, idQuadro = 0, resolver = null, seguranca = 0;
        const fim = new Promise(r => { resolver = r; });
        const t0 = performance.now();
        function acabar(completo) {
          if (!vivo) return;
          vivo = false;
          cancelAnimationFrame(idQuadro); clearTimeout(seguranca);
          el.remove();
          if (trilha) {
            const tr = trilha;
            if (completo) U.animar(tr, [{ opacity: 0.5 }, { opacity: 0 }], { duration: 450, fill: 'forwards' }).then(() => tr.remove());
            else tr.remove();
          }
          if (animacao && animacao.fim === fim) animacao = null;
          resolver(completo);
        }
        function quadroAnim(agora) {
          if (!vivo) return;
          const dt = agora - t0;
          let sx = ate, k = 0.92, op = 1;
          if (dt < entrada) { const f = dt / entrada; sx = de; op = f; k = 1.15 - 0.23 * f; }
          else if (dt < entrada + anda) sx = de + (ate - de) * suave((dt - entrada) / anda);
          else if (dt < entrada + anda + parada) sx = ate;
          else if (dt < total) { op = 1 - (dt - entrada - anda - parada) / saida; k = 0.92 + 0.12 * (1 - op); }
          else { acabar(true); return; }
          el.style.opacity = String(arred(U.limitar(op, 0, 1)));
          el.style.transform = pos(pontoEm(t, sx), mao ? k : 1);
          if (trilha) trilha.style.strokeDashoffset = String(arred(1000 - 1000 * sx / t.L));
          idQuadro = requestAnimationFrame(quadroAnim);
        }
        el.style.opacity = '0';
        el.style.transform = pos(pontoEm(t, de), mao ? 1.15 : 1);
        idQuadro = requestAnimationFrame(quadroAnim);
        seguranca = setTimeout(() => acabar(true), total + 1500);     // aba em segundo plano: rAF parado
        const a = { fim, parar: () => acabar(false) };
        return a;
      }
      function pararAnimacao() { if (animacao) animacao.parar(); animacao = null; }
      const duracaoMao = comp => U.limitar(comp / 0.45, 1100, 3400);

      /** O cometinha de luz mostra o caminho que falta (no sentido certo). */
      function mostrarCaminho() {
        if (fase !== 'tracando' || animacao || gesto) return;
        const t = tracos[atual];
        if (t.L - s < 20) return;
        animacao = percorrer(t, s, t.L, { ms: U.limitar((t.L - s) / 0.7, 700, 2200), mao: false });
      }

      // ------------------------------------------------------------ falas
      function textoInstrucao() {
        const t = tracos[atual];
        if (atual === 0 && s === 0 && modoLetra) return 'Vamos escrever a letra ' + nome + '! Comece na bolinha verde.';
        if (atual === 0 && s === 0) return numero === 10 ? 'Vamos escrever o dez! Comece pelo um.' : 'Vamos escrever o ' + nome + '! Comece na bolinha verde.';
        if (s === 0 && t.fala) return t.fala + ' Comece na bolinha verde.';
        if (s === 0) return 'Agora este risquinho! Comece na bolinha verde.';
        return 'Continue da bolinha verde.';
      }
      function instrucao() {
        if (fase !== 'tracando' || destruida) return Promise.resolve();
        chamarAtencao();
        depois(mostrarCaminho, 500);
        ctx.pipoca.pose('aponta');
        return falar(textoInstrucao(), { mostrar: mostrar() }).then(r => {
          // interrompida por outra fala (um retorno de erro, por exemplo): a outra fala cuida da pose
          if (r !== 'interrompida' && fase === 'tracando' && !destruida) ctx.pipoca.pose('normal');
          return r;
        });
      }

      // ------------------------------------------------------------ demonstração (1ª rodada com demo)
      async function demonstrar() {
        fase = 'demo';
        ctx.ocupado(true);
        ctx.pipoca.pose('aponta');
        const fala = falar((modoLetra ? 'Olha como se escreve a letra ' : 'Olha como se escreve o ') + nome + '!', { mostrar: mostrar() });
        try { await ctx.esperar(700); } catch (e) { return; }
        if (fase !== 'demo') return;
        // algarismo: a mãozinha mostra o primeiro traço; letra: todos os traços, na ordem
        const mostrados = modoLetra ? tracos : [tracos[0]];
        for (let i = 0; i < mostrados.length; i++) {
          const t = mostrados[i];
          if (i) { try { await ctx.esperar(250); } catch (e) { return; } if (fase !== 'demo' || destruida) return; }
          animacao = percorrer(t, 0, t.L, { rastro: true, ms: duracaoMao(t.L) });
          await animacao.fim;
          if (fase !== 'demo' || destruida) return;
        }
        await fala;
        if (fase !== 'demo' || destruida) return;
        fase = 'tracando';
        ctx.ocupado(false);
        ctx.pipoca.pose('normal');
        chamarAtencao();
        falar('Agora é a sua vez! Comece na bolinha verde.', { mostrar: mostrar() });
      }
      function pararDemo() {
        if (fase !== 'demo') return;
        fase = 'tracando';
        pararAnimacao();
        ctx.ocupado(false);
        ctx.pipoca.pose('normal');
      }

      // ------------------------------------------------------------ o dedo na lousa
      /** Leva o giz adiante com o ponto q do dedo: vale o ponto do caminho mais perto, só um pouco à frente. */
      function avancarCom(q, tol) {
        const t = tracos[atual];
        const i0 = indiceDe(t, s - JANELA_TRAS), i1 = Math.min(t.xs.length - 1, indiceDe(t, s + JANELA_FRENTE) + 1);
        let menor = Infinity;
        for (let i = i0; i <= i1; i++) { const d = Math.hypot(t.xs[i] - q.x, t.ys[i] - q.y); if (d < menor) menor = d; }
        if (menor > tol) return false;                       // fora do caminho: só para de pintar
        let alvo = -1;
        for (let i = i0; i <= i1; i++) if (Math.hypot(t.xs[i] - q.x, t.ys[i] - q.y) <= menor + EMPATE) alvo = i;
        if (alvo >= 0 && t.ss[alvo] > s) s = t.ss[alvo];
        return true;
      }

      function tocarNotas(t) {
        while (notas + 1 < t.marcos.length && s >= t.marcos[notas + 1] - 1) {
          notas++;
          PC.som.contar(1 + Math.round(7 * t.marcos[notas] / t.L));
        }
      }

      /** O dedo chegou na bolinha verde (onde o giz parou)? Daí em diante, mexer o dedo pinta. */
      function encostar(g, q) {
        if (g.encostou || U.distancia(q, pontoEm(tracos[atual], s)) > g.tol) return;
        g.encostou = true;
        inicio.classList.add('tracando');
        PC.som.pegar();
      }

      function processar(p) {
        const g = gesto;
        if (!g || fase !== 'tracando') return;
        const t = tracos[atual];
        const dx = p.x - g.ultimo.x, dy = p.y - g.ultimo.y, dist = Math.hypot(dx, dy);
        const n = Math.max(1, Math.ceil(dist / PASSO_DEDO));
        const antes = s;
        for (let k = 1; k <= n; k++) {
          const q = { x: g.ultimo.x + dx * k / n, y: g.ultimo.y + dy * k / n };
          encostar(g, q);
          if (g.encostou) avancarCom(q, g.tol);
          if (s >= t.L - 0.5) break;
        }
        g.percurso += dist;
        g.ultimo = { x: p.x, y: p.y };
        const dd = Math.hypot(p.x - g.inicio.x, p.y - g.inicio.y);
        if (dd > g.maisLonge) { g.maisLonge = dd; g.desloc = { x: p.x - g.inicio.x, y: p.y - g.inicio.y }; }
        if (s > antes) {
          g.ganho += s - antes;
          pintar(t, s);
          moverInicio(pontoEm(t, s));
          tocarNotas(t);
          if (s >= t.L - 0.5) {
            concluirTraco();
            // o dedo continua na lousa: pode seguir para o próximo traço, mas só pinta depois de chegar na bolinha nova
            // (no último traço, terminar() já soltou o gesto)
            if (gesto === g) g.encostou = false;
          }
        }
      }

      /**
       * Quanto do fim do traço pode faltar quando o dedo sai (o giz completa sozinho): o pedacinho que fica escondido
       * embaixo da bolinha verde, nunca mais que um quarto do traço (o chapéu do 5 é curto).
       */
      const quaseNoFim = (tol, t) => Math.min(Math.max(45, tol * 0.6), t.L * 0.25);

      function errar(fala, desenhoBalao) {
        const agora = performance.now();
        if (agora - ultimoErro < 2500) return;
        ultimoErro = agora; totalErros++;
        ctx.errou({ fala, mostrar: icone(desenhoBalao) });
      }

      function fimDoGesto(cancelado) {
        const g = gesto;
        gesto = null;
        inicio.classList.remove('tracando');
        if (!g || fase !== 'tracando') return;
        const t = tracos[atual];
        if (s > 0 && t.L - s <= quaseNoFim(g.tol, t)) { concluirTraco(); return; } // soltou pertinho do fim
        if (cancelado) return;
        if (g.ganho >= 30) { ctx.avancou(); return; }
        chamarAtencao();
        if (g.percurso < Math.max(110, g.tol * 1.3)) return;                        // risquinho curto: nada
        // tentou escrever e não pintou nada
        if (!g.encostou) { errar('Começou fora da bolinha verde. Comece nela!', ICONE_BOLINHA); return; }
        const tg = tangenteEm(t, s);
        if (g.desloc.x * tg.x + g.desloc.y * tg.y < -0.35 * g.maisLonge) errar('Foi para o outro lado. Siga a setinha!', ICONE_SETA);
      }

      function tocouSemArrastar(p) {
        const g = gesto;
        gesto = null;
        inicio.classList.remove('tracando');
        if (fase !== 'tracando') return;
        const t = tracos[atual];
        const tol = g ? g.tol : tolerancia();
        // faltava só um pedacinho (até a tolerância, ≈ 1 cm) e ela tocou no fim do traço: completa
        if (s > 0 && t.L - s <= Math.min(tol, t.L * 0.35) && U.distancia(p, pontoEm(t, t.L)) <= tol) { concluirTraco(); return; }
        chamarAtencao();
        if (U.distancia(p, pontoEm(t, s)) <= tol && performance.now() - ultimaFalaToque > 6000) {
          ultimaFalaToque = performance.now();
          falar('Agora arraste o dedo pela setinha!', { mostrar: icone(ICONE_SETA) });
        }
      }

      const desligar = PC.arrastar(lousa, {
        limiar: 6,
        aoPressionar(p) {
          if (fase === 'demo') pararDemo();
          if (fase !== 'tracando') return;
          pararAnimacao();
          gesto = { tol: tolerancia(), inicio: { x: p.x, y: p.y }, ultimo: { x: p.x, y: p.y }, encostou: false,
            ganho: 0, percurso: 0, maisLonge: 0, desloc: { x: 0, y: 0 } };
          // só encosta: um toque sem arrastar não pinta nem mexe a bolinha (o giz anda quando o dedo se mexe)
          encostar(gesto, p);
        },
        aoMover(p) { processar(p); },
        aoSoltar(p) { processar(p); fimDoGesto(false); },
        aoCancelar() { fimDoGesto(true); },
        aoTocar(p) { tocouSemArrastar(p); },
        // o toque acabou antes de virar arraste (outro dedo assumiu, "Quer parar?", o sistema cancelou): solta o gesto,
        // senão a ajuda e o cometinha achariam que ainda há um dedo na lousa
        aoDesistir() { gesto = null; inicio.classList.remove('tracando'); },
      });
      // qualquer toque (inclusive no HUD) para a demonstração e a mãozinha
      const offToque = PC.on('toque', () => {
        if (fase === 'demo') pararDemo();
        else if (animacao) pararAnimacao();
      });

      // ------------------------------------------------------------ traços e fim
      function concluirTraco() {
        const t = tracos[atual];
        s = t.L;
        pintar(t, s);
        PC.som.encaixar();
        ctx.avancou();
        atual++; s = 0; notas = 0;
        if (atual >= tracos.length) { terminar(); return; }
        const prox = tracos[atual];
        prox.elPontos.classList.remove('futuro');
        prox.gSetas.classList.remove('oculta');
        moverInicio(pontoEm(prox, 0));
        inicio.classList.remove('tracando');
        chamarAtencao();
        PC.som.bolha();
        if (prox.fala) falar(prox.fala, { mostrar: mostrar() });
      }

      function faiscas() {
        const c = { x: caixa.x + caixa.l / 2, y: caixa.y + caixa.a / 2 };
        const rx = caixa.l / 2 + 60, ry = caixa.a / 2 + 20;
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + 0.35;
          const el = U.el('div', { class: 'pc-tracar-faisca', html: FAISCA,
            style: `left:${arred(c.x + Math.cos(ang) * rx)}px;top:${arred(c.y + Math.sin(ang) * ry)}px` });
          desenho.appendChild(el);
          U.animar(el, [
            { opacity: 0, transform: 'scale(0) rotate(0deg)' },
            { opacity: 1, transform: 'scale(1.25) rotate(45deg)', offset: 0.45 },
            { opacity: 0, transform: 'scale(0.2) rotate(90deg)' },
          ], { duration: 900, delay: i * 70, easing: 'ease-out', fill: 'forwards' }).then(() => el.remove());
        }
      }

      function mostrarEstrela(i) {
        const c = casas[i];
        if (!c) return;
        const e = U.el('div', { class: 'pc-tracar-estrela', html: ESTRELA });
        c.appendChild(e);
        void e.offsetWidth;
        e.classList.add('aparece');
      }

      /**
       * Conta as estrelinhas em voz alta, como PC.voz.contar ("um, dois, três. Três estrelinhas!"), mas cada número
       * espera o "Quer parar?" fechar (ctx.esperar segura): a contagem não continua nem fala por cima da pergunta.
       */
      async function contarEstrelas(n) {
        for (let i = 1; i <= n; i++) {
          await ctx.esperar(0);
          mostrarEstrela(i - 1);
          PC.som.contar(i);
          const fala = PC.voz.falar(PC.voz.extenso(i));
          await Promise.all([ctx.esperar(450), Promise.race([fala, U.esperar(PC.voz.TETO_NUMERO, ctx.sinal)])]);
        }
        await ctx.esperar(0);
        const total = PC.voz.quantidade(n, 'estrelinha', 'estrelinhas', { feminino: true });
        await PC.voz.falar(total.charAt(0).toUpperCase() + total.slice(1) + '!');
      }

      /** Fim da letra: "Á! Á de arara!" (só "Á!" se o banco não tiver palavra com ela). */
      const fraseFinal = () => (palavra ? Nome + '! ' + Nome + ' de ' + PC.palavras.nome(palavra) + '!' : Nome + '!');

      async function terminar() {
        fase = 'fim';
        gesto = null;
        pararAnimacao();
        ctx.ocupado(true);
        inicio.classList.add('some');
        tracos.forEach(t => { t.gSetas.classList.add('oculta'); pintar(t, t.L); });
        try {
          // brilho: o giz acende em amarelo, com uma auréola e faísquinhas em volta
          tracos.forEach(t => {
            t.elHalos.forEach(h => U.animar(h, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 1200, easing: 'ease-out' }));
            U.animar(t.elLampejo, [{ opacity: 0 }, { opacity: 0.55, offset: 0.3 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' });
          });
          faiscas();
          await U.animar(desenho, [{ transform: 'scale(1)' }, { transform: 'scale(1.07)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 650, easing: 'ease-in-out' });
          ctx.pipoca.pose('feliz');
          if (modoLetra) {
            // a letra vai para a esquerda e diminui; o cartão com a figura aparece à direita; a Pipoca diz
            // o nome da letra e a palavra ("Á! Á de arara!")
            await U.animar(desenho, [{ transform: 'translate(0px, 0px) scale(1)' }, { transform: `translate(${DEPOIS.xLetra - CENTRO.x}px, 0px) scale(${DEPOIS.k})` }],
              { duration: 520, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' });
            if (palavra) { cartao.classList.add('mostra'); PC.som.bolha(); }
            await ctx.esperar(380);
            ctx.pipoca.pose('aponta');
            await ctx.falar(fraseFinal(), { mostrar: mostrar() });
            await ctx.esperar(450);
            ctx.pipoca.pose('normal');
            ctx.acertou();
            return;
          }
          // a Pipoca diz o número
          if (numero > 0) await ctx.falar(Nome + '!', { mostrar: mostrar() });
          // o algarismo vai para a esquerda e diminui (sem encostar no balão); o quadro de 10 aparece à direita
          const k = numero === 10 ? DEPOIS.k10 : DEPOIS.k;
          await U.animar(desenho, [{ transform: 'translate(0px, 0px) scale(1)' }, { transform: `translate(${DEPOIS.x - CENTRO.x}px, 0px) scale(${k})` }],
            { duration: 520, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' });
          quadro.classList.add('mostra');
          await ctx.esperar(380);
          ctx.pipoca.pose('aponta');
          if (numero === 0) {
            quadro.classList.add('vazio');
            await ctx.falar('Zero! Nenhuma estrelinha.', { mostrar: 0 });
          } else {
            await contarEstrelas(numero);
          }
          await ctx.esperar(450);
          ctx.pipoca.pose('normal');
          ctx.acertou();
        } catch (e) {
          if (!U.ehAbortado(e)) console.error(e);
        }
      }

      // ------------------------------------------------------------ começo
      if (ctx.demo) demonstrar();
      else instrucao();

      return {
        instrucao,
        /** O gesto certo agora: o caminho que falta do traço atual, em px virtuais. */
        proximoGesto() {
          if ((fase !== 'tracando' && fase !== 'demo') || atual >= tracos.length) return null;
          const t = tracos[atual];
          const pontos = [];
          for (let x = s; x < t.L; x += 12) { const p = pontoEm(t, x); pontos.push({ x: arred(p.x), y: arred(p.y) }); }
          const u = pontoEm(t, t.L);
          pontos.push({ x: arred(u.x), y: arred(u.y) });
          if (pontos.length < 2) pontos.unshift(pontos[0]);
          return { tipo: 'tracar', pontos };
        },
        /**
         * Ajuda que ensina (a moldura chama com nível 2; aqui todo nível faz o mesmo): a mãozinha percorre o que falta do
         * traço, no sentido certo, deixando um giz clarinho. Com o dedo da criança na lousa, não atrapalha.
         */
        ajudar() {
          if (fase !== 'tracando' || gesto) return;
          const t = tracos[atual];
          pararAnimacao();
          chamarAtencao();
          ctx.ocupado(true);
          falar('Olha a mãozinha. Siga as setinhas!', { mostrar: mostrar() });
          animacao = percorrer(t, s, t.L, { rastro: true, ms: duracaoMao(t.L - s) });
          animacao.fim.then(() => { if (fase === 'tracando' && !destruida) ctx.ocupado(false); });
        },
        resolver() {
          if (resolvida || destruida) return;
          resolvida = true;
          pararAnimacao();
          gesto = null;
          fase = 'fim';
          tracos.forEach(t => pintar(t, t.L));
          atual = tracos.length;
          ctx.acertou();
        },
        estado() {
          const t = tracos[atual];
          return {
            algarismo: numero, letra, palavra: palavra ? palavra.id : null, partes: partes.slice(), fase, traco: atual, tracos: tracos.length,
            sentido: t ? t.def.sentido : null,
            progresso: t ? Math.round(1000 * s / t.L) / 1000 : 1,
            tolerancia: Math.round(tolerancia()), erros: totalErros, demo: fase === 'demo',
          };
        },
        destruir() {
          if (destruida) return;
          destruida = true;
          try { desligar(); } catch (e) { /* ok */ }
          offToque();
          pararAnimacao();
          timers.forEach(id => clearTimeout(id)); timers.clear();
          [cavalete, lousa, desenho, quadro].forEach(el => el.remove());
        },
      };
    },
  });

  // dados expostos para testes e para a ferramenta de conferência do desenho
  PC.atividades.obter('tracar').algarismos = ALGARISMOS;
  PC.atividades.obter('tracar').letras = LETRAS;

  // ================================================================ medalhão do mapa (estações de letras)
  // A mesma lousinha branca do medalhão dos números (CENAS.tracar em medalhoes.js), com as letras pontilhadas.
  if (PC.arte && PC.arte.registrarMedalhao) {
    PC.arte.registrarMedalhao('tracar-letras', {
      fundo: ['#DDF7F3', null, null],
      cena(p) {
        const { T, COR, FONTE, brilho } = PC.arte.pecasMedalhao;
        const lista = (Array.isArray(p.letras) && p.letras.length ? p.letras : ['A', 'E']).map(l => String(l).toUpperCase()).filter(l => LETRAS[l]);
        // as letras são mais largas que os algarismos: o tamanho sai da largura delas na fonte, para caber entre a
        // bolinha verde e o lápis (até 50 unidades a partir de x = 22)
        const largura = lista.reduce((a, l) => a + LETRAS[l].avanco / 1000, 0) + 0.22 * (lista.length - 1);
        const tam = Math.min(30, 50 / (largura || 1));
        const texto = lista.map((l, i) => `<tspan dx="${i ? (0.22 * tam).toFixed(1) : 0}">${l}</tspan>`).join('');
        return `<g transform="rotate(-6 50 50)"><rect x="6" y="20" width="80" height="58" rx="7" fill="#fff" stroke="${T}" stroke-width="2.6"/>` +
          `<path d="M14 33 H 78 M14 66 H 78" stroke="#BFE9E3" stroke-width="1.8"/>` +
          `<text x="22" y="${lista.length > 2 ? 58 : 61}" font-size="${tam.toFixed(1)}" ${FONTE} fill="#B5EDE5" stroke="${COR.turquesa}" stroke-width="1.7" stroke-dasharray="3 2.2" stroke-linejoin="round">${texto}</text>` +
          `</g>` +
          `<circle cx="15" cy="36" r="5" fill="${COR.verde}" stroke="${T}" stroke-width="2"/>` +
          `<g transform="translate(8 8) scale(.9) rotate(38 76 66)"><rect x="69" y="30" width="14" height="42" rx="3.5" fill="${COR.ouro}" stroke="${T}" stroke-width="2.6"/>` +
          `<path d="M73.5 30 V 72" stroke="#E9A92A" stroke-width="2.2"/><rect x="69" y="25" width="14" height="8" rx="3" fill="${COR.rosa}" stroke="${T}" stroke-width="2.4"/>` +
          `<path d="M69 72 L 76 86 L 83 72 Z" fill="#FFE0C2" stroke="${T}" stroke-width="2.4" stroke-linejoin="round"/><path d="M74 82 L 76 86 L 78 82 Z" fill="${T}"/></g>` +
          brilho(86, 14, 4.5, COR.ouro);
      },
    });
  }
})();
