/* Pipoca Aprende — a Pipoca: desenho e animação, tudo em código (SVG, viewBox 0 0 250 270).
   Versão 2 (novembro de 2026): a Pipoca é uma SAGUI, de pé, com dois tufos brancos nas orelhas que parecem pipoca
   estourada (daí o nome), gorrinho de pelo escuro, mancha branca na testa e rabo comprido de anéis.
   A versão anterior (macaquinha marrom sentada) está em guardado/pipoca-macaca-v1/.

   PC.pipoca.svg(pose)          -> texto SVG parado (figurinhas, telas simples). É o mesmo que PC.arte.pipoca(pose).
   PC.pipoca.criar(el, opcoes)  -> põe a Pipoca VIVA dentro de `el` e devolve o controle:
        pose(nome)              troca a pose (braços, cabeça e rosto vão até lá com molas: nada "pula" de lugar)
        falar(true | false)     a boca mexe com vários formatos e a cabeça acompanha
        rosto({...} | null)     muda só números do rosto por cima da pose (expressão enquanto fala)
        pular(altura)           pulinho: dobra as pernas, estica, encolhe os pés no ar e amortece na volta
        momento(nome, ms)       faz uma pose por um tempo e volta para a de antes
        olhar(dx, dy, ms)       olha numa direção por um tempo (dx, dy entre -1 e 1)
        poseAtual, el (o <svg>), destruir()
     opcoes: { pose: 'normal', vida: true } (vida: false = sem os movimentos de descanso)
   PC.pipoca.poses()            -> nomes das poses.

   Como funciona: a Pipoca é um boneco articulado. Cada pose é só uma lista de números (onde fica cada mão e cada pé,
   quanto a cabeça inclina, quanto a boca abre...). `quadro(p)` transforma esses números nos atributos do SVG; o
   desenho parado e o vivo usam a mesma função. No vivo, cada número persegue o valor da pose com uma mola (os
   movimentos passam um pouquinho do ponto e voltam, como um bicho de verdade) e, por cima, entram os movimentos de
   vida: respirar, trocar o peso de perna, piscar, ondular o rabo, tremer um tufo, olhar em volta. Os tufos e o
   topete balançam atrasados em relação à cabeça.

   O desenho é feito num espaço de 300 × 360 (chão em y = 343) e encaixado no viewBox 250 × 270 por ESCALA.
   Pontos úteis já no viewBox (para quem desenha por cima): cabeça (135, 101) · peito (135, 190) · mãos soltas
   (96, 215) e (174, 215) · chão y ≈ 263. A sombra do chão é o primeiro <ellipse> com fill="rgba(...)". */
(function () {
  'use strict';
  const PC = window.PC;
  const T = '#3A2A5A';                                   // contorno (o mesmo do resto do jogo)
  const C = {
    pelo: '#B8763E', escuro: '#6B4329', creme: '#FFE6C4', branco: '#FFFAF0', tufoSombra: '#E6D6BE', manteiga: '#FFE9A6',
    pele: '#F6C6A2', peleEscura: '#E3A27C', bochecha: '#FF9CAB', boca: '#4A1F2A', lingua: '#FF8C8C', iris: '#B46F26', pupila: '#22152F',
  };
  const ESCALA = 'translate(12 -18.3) scale(.82)';
  const DESCE = 14;                                      // quanto a cabeça desce para assentar no tronco
  let uid = 0;

  // ======================================================================== contas pequenas
  const RAD = Math.PI / 180;
  const lim = (v, a, b) => (v < a ? a : v > b ? b : v);
  const n1 = v => String(Math.round(v * 10) / 10);
  const n2 = v => String(Math.round(v * 100) / 100);
  const n3 = v => String(Math.round(v * 1000) / 1000);
  const suave = u => { u = lim(u, 0, 1); return u * u * (3 - 2 * u); };
  function girar(x, y, cx, cy, graus) {
    const r = graus * RAD, c = Math.cos(r), s = Math.sin(r), dx = x - cx, dy = y - cy;
    return [cx + dx * c - dy * s, cy + dx * s + dy * c];
  }
  /** Valor no tempo t de uma lista de quadros-chave [[tempo, valor], ...], com entrada e saída suaves. */
  function chaves(t, lista) {
    if (t <= lista[0][0]) return lista[0][1];
    for (let i = 1; i < lista.length; i++) {
      if (t <= lista[i][0]) {
        const a = lista[i - 1], b = lista[i];
        return a[1] + (b[1] - a[1]) * suave((t - a[0]) / (b[0] - a[0]));
      }
    }
    return lista[lista.length - 1][1];
  }

  // ======================================================================== os números de uma pose
  const P0 = {
    // corpo inteiro: pulo (para cima), agacha (amassa > 0, estica < 0), inclina (graus, em volta do chão)
    pulo: 0, agacha: 0, inclina: 0,
    // tronco: desliza para o lado e para baixo (as pernas dobram), gira em volta do quadril; resp = respiração
    corpoX: 0, corpoY: 0, troncoRot: 0, resp: 0,
    // cabeça
    cabX: 0, cabY: 0, cabRot: 0,
    // olhos: para onde olha, pálpebras (0 aberta, 1 fechada), olhos felizes "^ ^", tamanho, forma do olho fechado
    olharX: 0, olharY: 0, palE: 0, palD: 0, feliz: 0, olhoEsc: 1, fecCurva: -1,
    // sobrancelhas (aparecem só nas expressões) e bochechas coradas
    sobOp: 0, sobEy: 0, sobDy: 0, sobEr: 0, sobDr: 0, corar: 0.6,
    // boca: meia largura, sorriso (cantos para cima), abertura, redonda ("ó")
    bLarg: 13.5, bSorriso: 1, bAbre: 0, bO: 0,
    // braços: onde está cada mão, quanto o cotovelo dobra para fora, giro extra da mão
    eX: 103, eY: 284, eCurva: 14, eGira: 0, dX: 197, dY: 284, dCurva: 14, dGira: 0,
    // pés: quanto cada um sai do lugar
    peEX: 0, peEY: 0, peDX: 0, peDY: 0,
    // rabo (graus; onda = balanço que corre da base até a ponta), tufos e topete (graus)
    raboAng: 0, raboCurl: 0, raboOnda: 0, raboFase: 0, tufoE: 0, tufoD: 0, topete: 0,
    // enfeites em volta (0 some, 1 aparece)
    bolhas: 0, brilhos: 0, notas: 0, coracoes: 0,
  };
  const CHAVES = Object.keys(P0);
  const MAOS = ['mao', 'aberta', 'dedo', 'punho', 'joia'];

  /* Poses. p: números diferentes do descanso. eMao/dMao: formato da mão (mao, aberta, dedo, punho, joia).
     ciclo(t, o): movimento que se repete enquanto a pose dura (escreve em `o` o que SOMAR aos números).
     foto: instante do ciclo usado no desenho parado. vagueia: os olhos passeiam sozinhos. calma: quanto do balanço
     de descanso a pose aceita (0 a 1). */
  const POSES = {
    normal: { p: {}, vagueia: true },
    fala: {
      p: { dX: 240, dY: 208, dCurva: 16, cabRot: 2, bSorriso: 1.1, corpoX: 1 }, dMao: 'aberta',
      ciclo(t, o) { o.dX = 4 * Math.sin(t * 3.1); o.dY = 6 * Math.sin(t * 4.3 + 1); o.dGira = 9 * Math.sin(t * 3.1 + .6); },
    },
    feliz: {
      p: { eX: 60, eY: 192, eCurva: 14, dX: 240, dY: 192, dCurva: 14, feliz: 1, bAbre: .9, bLarg: 16, corar: .9, tufoE: 7, tufoD: -7, raboCurl: -16 },
      eMao: 'aberta', dMao: 'aberta',
      ciclo(t, o) { o.eGira = 11 * Math.sin(t * 8); o.dGira = -11 * Math.sin(t * 8); o.cabRot = 2.4 * Math.sin(t * 4); o.corpoY = -2 * Math.abs(Math.sin(t * 4)); },
    },
    aponta: {
      p: { dX: 256, dY: 218, dCurva: 8, olharX: 4, cabRot: 3.5, cabX: 2, corpoX: 3, troncoRot: 2.5, bSorriso: 1.15 }, dMao: 'dedo',
      ciclo(t, o) { const k = Math.max(0, Math.sin(t * 5.2)); o.dX = 5 * k; o.dY = -1 * k; },
    },
    pensa: {
      p: { dX: 173, dY: 214, dCurva: 32, olharX: -3.2, olharY: -4.2, cabRot: -5, bLarg: 9, bSorriso: .55,
        sobOp: 1, sobEy: 1, sobEr: 5, sobDy: -4.5, sobDr: 8, bolhas: 1, peDX: -6, corpoX: -2 },
      dMao: 'punho',
      ciclo(t, o) { o.olharX = 1.4 * Math.sin(t * .9); o.cabRot = 1.6 * Math.sin(t * 1.1); o.raboCurl = 12 * Math.sin(t * 2.3); },
    },
    danca: {
      p: { eX: 62, eY: 214, eCurva: 15, dX: 238, dY: 214, dCurva: 15, feliz: 1, bAbre: .85, bLarg: 16, corar: .85, notas: 1 },
      eMao: 'aberta', dMao: 'aberta', foto: .31, calma: 0,
      ciclo(t, o) {
        const f = Math.PI * t / .62, s = Math.sin(f), c2 = s * s;
        o.corpoX = 9 * s; o.troncoRot = 5 * s; o.corpoY = 5 * (1 - c2) - 2; o.pulo = 5 * c2;
        o.eY = -40 * s; o.dY = 40 * s; o.eX = 4 * s; o.dX = 4 * s;
        o.eGira = 14 * Math.sin(f * 2); o.dGira = -14 * Math.sin(f * 2);
        o.cabRot = -7 * s;
        o.peEY = -15 * Math.max(0, s); o.peEX = -5 * Math.max(0, s);        // o pé do lado de fora sobe
        o.peDY = -15 * Math.max(0, -s); o.peDX = 5 * Math.max(0, -s);
        o.raboAng = 14 * s;
      },
    },
    acena: {
      p: { dX: 238, dY: 194, dCurva: 15, cabRot: 4, bAbre: .55, bLarg: 15, corpoX: -2, tufoD: -4 }, dMao: 'aberta',
      ciclo(t, o) {
        const a = 18 * Math.sin(t * 10.5), v = girar(22, -44, 0, 0, a);     // o antebraço balança em volta do cotovelo
        o.dX = v[0] - 22; o.dY = v[1] + 44; o.dGira = a * .6; o.cabRot = 1.6 * Math.sin(t * 5.25);
      },
    },
    comemora: {
      p: { eX: 66, eY: 188, eCurva: 12, dX: 234, dY: 188, dCurva: 12, feliz: 1, bAbre: 1, bLarg: 17, corar: .95, brilhos: 1, raboCurl: -24 },
      eMao: 'punho', dMao: 'punho', foto: .23, calma: 0,
      ciclo(t, o) {
        const u = (t % .5) / .5, ar = lim((u - .14) / .72, 0, 1);
        o.pulo = 20 * 4 * ar * (1 - ar);
        o.corpoY = chaves(u, [[0, 7], [.14, 0], [.86, 0], [1, 7]]);
        o.agacha = chaves(u, [[0, .04], [.16, -.05], [.5, -.02], [.84, -.05], [1, .04]]);
        const k = Math.sin(Math.PI * ar);
        o.peEY = -9 * k; o.peDY = -9 * k; o.peEX = -4 * k; o.peDX = 4 * k;
        o.eX = 4 * Math.sin(t * 16); o.dX = -4 * Math.sin(t * 16); o.eY = -7 * k; o.dY = -7 * k;
      },
    },
    palmas: {
      p: { eX: 137, eY: 246, eCurva: 24, dX: 163, dY: 246, dCurva: 24, feliz: 1, bAbre: .75, bLarg: 15.5, corar: .85 },
      calma: .4,
      ciclo(t, o) {
        const g = 11 * (.5 + .5 * Math.cos(Math.PI * 2 * t / .34));          // 0 = bateu, 11 = mãos afastadas
        o.eX = -g; o.dX = g; o.eY = -g * .3; o.dY = -g * .3; o.corpoY = -2.5 * (1 - g / 11); o.cabRot = 3 * Math.sin(t * 3.1);
      },
    },
    surpresa: {
      p: { eX: 106, eY: 198, eCurva: 26, dX: 194, dY: 198, dCurva: 26, olhoEsc: 1.16, sobOp: 1, sobEy: -5, sobDy: -5,
        bLarg: 7.5, bSorriso: 0, bAbre: .8, bO: 1, cabY: -2, corar: .75, tufoE: 9, tufoD: -9 },
      entrada: 'pulinho',
    },
    ops: {
      p: { eX: 106, eY: 197, eCurva: 26, cabRot: -7, olharX: 3.6, olharY: -1, sobOp: 1, sobEy: -3, sobDy: -3, sobEr: -12, sobDr: 12,
        bLarg: 8, bSorriso: .1, bAbre: .34, bO: .9, troncoRot: -2, tufoE: -6, tufoD: 6 },
      ciclo(t, o) { o.cabRot = 1.6 * Math.sin(t * 2.2); },
    },
    ouve: {
      p: { dX: 238, dY: 189, dCurva: 20, dGira: -30, cabRot: 8, cabX: 3, olharX: 4, sobOp: 1, sobEy: -3, sobDy: -5, bLarg: 11, bSorriso: .9,
        tufoD: -12, troncoRot: 3, corpoX: 2 },
      dMao: 'aberta',
      ciclo(t, o) { o.tufoD = 6 * Math.max(0, Math.sin(t * 2.4)) * Math.sin(t * 19); o.dGira = 5 * Math.sin(t * 3); },
    },
    torce: {
      p: { eX: 126, eY: 242, eCurva: 24, dX: 174, dY: 242, dCurva: 24, sobOp: 1, sobEr: 12, sobDr: -12, sobEy: 1, sobDy: 1,
        bAbre: .55, bLarg: 15.5, bSorriso: 1.1 },
      eMao: 'punho', dMao: 'punho', calma: .3,
      ciclo(t, o) { const s = Math.sin(t * 11); o.eY = 6 * s; o.dY = -6 * s; o.corpoY = 3 * Math.abs(s); o.cabRot = 2 * s; },
    },
    joia: {
      p: { dX: 240, dY: 214, dCurva: 10, dGira: 33, palD: 1, fecCurva: 1, cabRot: 5, bAbre: .6, bLarg: 15.5, bSorriso: 1.1, corar: .8, corpoX: 2 },
      dMao: 'joia',
      ciclo(t, o) { o.dY = -5 * Math.abs(Math.sin(t * 4)); },
    },
    carinho: {
      p: { eX: 140, eY: 249, eCurva: 26, dX: 160, dY: 246, dCurva: 26, palE: 1, palD: 1, fecCurva: 1, corar: 1, bLarg: 13, bSorriso: 1.35,
        cabRot: -5, coracoes: 1, tufoE: -5, tufoD: 5 },
      ciclo(t, o) { const s = Math.sin(t * 2.2); o.corpoX = 4 * s; o.troncoRot = 3 * s; o.cabRot = 2.5 * Math.sin(t * 2.2 + .8); },
    },
    sono: {
      p: { palE: 1, palD: 1, cabRot: 10, cabY: 5, corpoY: 3, troncoRot: 2, bLarg: 7.5, bSorriso: .2, bAbre: .1, bO: .7,
        tufoE: -12, tufoD: 12, corar: .7, raboCurl: 14, eCurva: 8, dCurva: 8 },
      calma: 0,
      ciclo(t, o) { const b = Math.sin(t * 1.5); o.cabY = 2.2 * b; o.cabRot = 1.4 * b; o.resp = .9 * b; o.bAbre = .08 * (1 + b); o.corpoX = 1.5 * Math.sin(t * .75); },
    },
    boceja: {
      p: { palE: 1, palD: 1, sobOp: 1, sobEy: -4, sobDy: -4, sobEr: -8, sobDr: 8, bLarg: 9.5, bSorriso: 0, bAbre: 1.2, bO: 1,
        cabRot: -8, cabY: -3, dX: 242, dY: 170, dCurva: 16, eX: 52, eY: 232, eCurva: 10, agacha: -.03, tufoE: 6, tufoD: -6 },
      dMao: 'punho', eMao: 'punho', calma: 0,
    },
  };

  // ======================================================================== peças do desenho
  const linha = (x1, y1, x2, y2, cor, w) =>
    `<path d="M${n1(x1)} ${n1(y1)} L ${n1(x2)} ${n1(y2)}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="round"/>`;
  /** Dedos em leque: [ângulo, comprimento, largura]. Devolve os contornos e os recheios separados. */
  function dedos(lista) {
    const pts = lista.map(([ang, comp, larg]) => { const c = Math.cos(ang * RAD), s = Math.sin(ang * RAD); return [c * 3, s * 3, c * comp, s * comp, larg]; });
    return {
      fora: pts.map(p => linha(p[0], p[1], p[2], p[3], T, p[4] + 9.6)).join(''),
      dentro: pts.map(p => linha(p[0], p[1], p[2], p[3], C.pele, p[4])).join(''),
    };
  }
  const risquinhos = d => `<path d="${d}" fill="none" stroke="${T}" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>`;
  /** A mão, desenhada em volta de (0, 0), com os dedos apontando para +x. */
  function maoSvg(tipo) {
    const palma = r => `<circle r="${r}" fill="${C.pele}" stroke="${T}" stroke-width="5.4"/>`;
    if (tipo === 'aberta') {
      const d = dedos([[-44, 20, 7], [-15, 22, 7], [15, 22, 7], [44, 20, 7], [-104, 16.5, 7.4]]);
      return palma(12.2) + d.fora + d.dentro + `<circle r="12.1" fill="${C.pele}"/><ellipse cx="1" cy="1.5" rx="5.4" ry="4.2" fill="${C.peleEscura}" opacity=".55"/>`;
    }
    if (tipo === 'dedo') {
      const d = dedos([[-4, 28, 7.6], [-80, 15.5, 7.4]]);
      return palma(12.4) + d.fora + d.dentro + `<circle r="12.3" fill="${C.pele}"/>` + risquinhos('M9 4.6 l 4 .8 M7 9.2 l 3.4 2');
    }
    if (tipo === 'joia') {
      const d = dedos([[-90, 29, 9]]);
      return palma(13.2) + d.fora + d.dentro + `<circle r="13.1" fill="${C.pele}"/>` + risquinhos('M6 -6.4 q 5 .6 7 3.6 M7.6 -.6 q 4.6 1 5.8 4.2 M6.4 5 q 3.4 1.6 4.2 4.6');
    }
    if (tipo === 'punho') {
      return palma(13.2) + risquinhos('M6 -7.4 q 5.2 1 7.2 4.2 M7.6 -1.6 q 4.6 1.2 5.8 4.4 M6.4 4.4 q 3.4 1.8 4 4.8') +
        `<path d="M-6.4 7.5 Q 0 1.8 7.5 5.3" fill="none" stroke="${T}" stroke-width="2.6" stroke-linecap="round" opacity=".5"/>`;
    }
    // 'mao': mãozinha solta, fechada de leve
    return `<ellipse cx="1" cy="0" rx="13.2" ry="12.4" fill="${C.pele}" stroke="${T}" stroke-width="5.4"/>` + risquinhos('M8.6 -5.4 l 4.2 -.9 M10 0 h 4.4 M8.6 5.4 l 4.2 .9');
  }
  /** Vários círculos que viram uma forma só (contorno só por fora): os tufos de pipoca. */
  function tufo(circulos) {
    return circulos.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.branco}" stroke="${T}" stroke-width="6"/>`).join('') +
      circulos.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${n1(r - 2.8)}" fill="${C.branco}"/>`).join('');
  }
  const TUFO_E = [[74, 108, 21], [51, 126, 22], [57, 156, 21], [86, 138, 26], [40, 143, 13]];
  const TUFO_D = TUFO_E.map(([x, y, r]) => [300 - x, y, r]);
  // rabo comprido de anéis (pontos de uma curva; os de longe balançam mais)
  const RABO = [[134, 298], [76, 308], [32, 272], [42, 220], [48, 188], [30, 168], [14, 180], [0, 191], [9, 212], [27, 205]];
  function rabo(ang, curl, onda, fase) {
    let pts = RABO.map(([x, y], i) => {
      const w = Math.pow(i / 9, 1.2);
      return girar(x, y, 134, 298, ang * w + onda * w * Math.sin(fase - i * .6));
    });
    const c = pts[3];
    pts = pts.map((p, i) => (i < 4 ? p : girar(p[0], p[1], c[0], c[1], curl * (i - 3) / 6)));
    const s = pts.map(p => n1(p[0]) + ' ' + n1(p[1]));
    return `M${s[0]} C ${s[1]} ${s[2]} ${s[3]} C ${s[4]} ${s[5]} ${s[6]} C ${s[7]} ${s[8]} ${s[9]}`;
  }
  const CABECA = 'M150 68 C 196 68 222 98 222 132 C 222 170 192 196 150 196 C 108 196 78 170 78 132 C 78 98 104 68 150 68 Z';
  const ESTRELA = 'M0 -12 Q 2.4 -2.4 12 0 Q 2.4 2.4 0 12 Q -2.4 2.4 -12 0 Q -2.4 -2.4 0 -12 Z';
  const CORACAO = 'M0 8 C -15 -2 -8 -14 0 -6 C 8 -14 15 -2 0 8 Z';
  const BRILHOS = [[34, 56, 1.15], [268, 48, 1], [290, 196, .85], [8, 138, .8]];
  const NOTAS = [[28, 74, '#9B7BFF'], [274, 62, '#FF8FC2']];
  const CORACOES = [[40, 96, 1.15], [262, 86, 1], [282, 168, .8]];

  // ======================================================================== dos números para os atributos do SVG
  function braco(q, L, ombro, hx, hy, curva, giro) {
    const dx = hx - ombro[0], dy = hy - ombro[1], comp = Math.hypot(dx, dy) || 1;
    let vx = -dy / comp, vy = dx / comp;
    if ((vx < 0) !== (L === 'e')) { vx = -vx; vy = -vy; }          // o cotovelo sempre para fora do corpo
    const cx = (ombro[0] + hx) / 2 + vx * curva, cy = (ombro[1] + hy) / 2 + vy * curva;
    const d = `M${n1(ombro[0])} ${n1(ombro[1])} Q ${n1(cx)} ${n1(cy)} ${n1(hx)} ${n1(hy)}`;
    q[L + 'B1.d'] = d; q[L + 'B2.d'] = d;
    const ang = Math.atan2(hy - cy, hx - cx) / RAD + (L === 'e' ? -giro : giro);
    q[L + 'M.transform'] = `translate(${n1(hx)} ${n1(hy)}) rotate(${n1(ang)})` + (L === 'e' ? ' scale(1 -1)' : '');
  }
  /** Perna do quadril ao tornozelo; quando encurta, o joelho dobra para fora. */
  function perna(q, L, quadril, px, py) {
    const fora = L === 'E' ? -1 : 1;
    const tx = px - fora * 7, ty = py - 8;                          // tornozelo, um pouco para dentro do pé
    const comp = Math.hypot(tx - quadril[0], ty - quadril[1]);
    const dobra = lim((29 - comp) * 1.25, 0, 22) + 2;
    const d = `M${n1(quadril[0])} ${n1(quadril[1])} Q ${n1((quadril[0] + tx) / 2 + fora * dobra)} ${n1((quadril[1] + ty) / 2)} ${n1(tx)} ${n1(ty)}`;
    q['pn' + L + '1.d'] = d; q['pn' + L + '2.d'] = d;
    q['pe' + L + '.transform'] = `translate(${n1(px)} ${n1(py)}) rotate(${n1(lim((335 - py) * fora * -.9, -24, 24))})`;
  }
  function olho(q, L, cx, p, pal) {
    const fz = lim(p.feliz, 0, 1), lid = lim(pal, 0, 1), e = p.olhoEsc;
    const ox = lim(p.olharX, -6, 6), oy = lim(p.olharY, -5.5, 5.5);
    const pos = `translate(${n1(cx + ox)} ${n1(141 + oy)})`;
    q['ol' + L + '.transform'] = pos + ` scale(${n3(e)} ${n3(e * (1 - .7 * fz))})`;
    q['ol' + L + '.opacity'] = n2(1 - fz);
    q['br' + L + '.transform'] = `translate(${n1(-ox * .3)} ${n1(-oy * .3)})`;
    const h = lid * 34.5;
    q['pal' + L + '.height'] = n1(h);
    q['palL' + L + '.d'] = `M-16 ${n1(-17.5 + h)} Q 0 ${n1(-14.5 + h)} 16 ${n1(-17.5 + h)}`;
    q['palL' + L + '.opacity'] = lid > .03 && lid < .96 ? '1' : '0';
    q['olIn' + L + '.opacity'] = lid < .96 ? '1' : '0';             // fechado de vez: só o risquinho (sem sobra do olho)
    const fc = lim(p.fecCurva, -1, 1);
    q['fec' + L + '.transform'] = pos;
    q['fec' + L + '.d'] = `M-13 ${n1(2 * fc + 1.5)} Q 0 ${n1(-13.5 * fc + 1.5)} 13 ${n1(2 * fc + 1.5)}`;
    q['fec' + L + '.opacity'] = n2(lim((lid - .78) / .2, 0, 1) * (1 - fz));
  }
  function boca(q, p) {
    const w = Math.max(4, p.bLarg), s = p.bSorriso, a = lim(p.bAbre, 0, 1.3), o = lim(p.bO, 0, 1) * Math.min(1, a * 2.5);
    const yc = 172 - 3.5 * s + 1.5 * a;                            // altura dos cantos
    const queda = 6 * s;                                           // quanto o meio desce num sorriso fechado
    const dU = queda * (1 - .8 * Math.min(1, a)) - 5 * o, dL = queda + 13 * a + 3 * o;
    const k = w * (2 / 3) * (1 - .85 * o);
    const xl = n1(150 - w), xr = n1(150 + w), k1 = n1(150 - w + k), k2 = n1(150 + w - k), y = n1(yc);
    const cu = n1(yc + dU / .75), cl = n1(yc + dL / .75);
    const d = `M${xl} ${y} C ${k1} ${cu} ${k2} ${cu} ${xr} ${y} C ${k2} ${cl} ${k1} ${cl} ${xl} ${y} Z`;
    q['boca.d'] = d; q['bocaC.d'] = d; q['bocaT.d'] = d;
    q['filtro.d'] = `M150 166 L 150 ${n1(Math.max(166.5, yc + dU - 1))}`;
    const vao = dL - dU;
    q['lingua.cy'] = n1(yc + dL - Math.max(1.4, vao * .26));
    q['lingua.rx'] = n1(w * .62); q['lingua.ry'] = n1(Math.max(.1, vao * .42));
    q['lingua.opacity'] = n2(lim((vao - 3) / 3.5, 0, 1));
    // no desenho parado não há recorte (figurinhas não aceitam id): uma língua menor, que cabe inteira na boca
    q['linguaS.cy'] = n1(yc + dL - vao * .31); q['linguaS.rx'] = n1(w * .46); q['linguaS.ry'] = n1(Math.max(.1, vao * .23));
  }
  function enfeites(q, p, t) {
    const bo = lim(p.bolhas, 0, 1), br = lim(p.brilhos, 0, 1), no = lim(p.notas, 0, 1), co = lim(p.coracoes, 0, 1);
    q['bolhas.opacity'] = n2(bo); q['brilhos.opacity'] = n2(br); q['notas.opacity'] = n2(no); q['coracoes.opacity'] = n2(co);
    q['bolhas.transform'] = `translate(0 ${n1(bo > .01 ? 3 * Math.sin(t * 2.2) : 0)})`;
    BRILHOS.forEach(([x, y, e], i) => {
      const s = br > .01 ? e * (.55 + .45 * Math.abs(Math.sin(t * 4.2 + i * 1.7))) : e;
      q['bri' + i + '.transform'] = `translate(${x} ${y}) rotate(${n1(br > .01 ? 20 * Math.sin(t * 3 + i) : 0)}) scale(${n2(s)})`;
    });
    NOTAS.forEach(([x, y], i) => {
      const k = no > .01 ? Math.sin(t * 5 + i * 2.4) : (i ? -.5 : .5);
      q['nota' + i + '.transform'] = `translate(${x} ${n1(y - 6 * k)}) rotate(${n1(12 * k)}) scale(1.2)`;
    });
    CORACOES.forEach(([x, y, e], i) => {
      const u = (t * .42 + .25 + i * .31) % 1;
      q['cor' + i + '.transform'] = `translate(${n1(x + 6 * Math.sin(u * 6 + i))} ${n1(y - 40 * u)}) scale(${n2(e * (.55 + .5 * u))})`;
      q['cor' + i + '.opacity'] = n2(Math.sin(Math.PI * u));
    });
  }
  /** Todos os atributos do desenho para os números `p` no instante `t`. */
  function quadro(p, t) {
    const q = {};
    q['tudo.transform'] = `translate(0 ${n1(-p.pulo)}) rotate(${n2(p.inclina)} 150 343) translate(150 343) ` +
      `scale(${n3(1 + p.agacha * .55)} ${n3(1 - p.agacha)}) translate(-150 -343)`;
    const alt = lim(p.pulo / 120, 0, .75);
    q['sombra.rx'] = n1(92 * (1 - alt * .55)); q['sombra.opacity'] = n2(1 - alt * .8);
    const bx = p.corpoX, by = p.corpoY, tr = p.troncoRot, r = p.resp;
    const noCorpo = (x, y) => { const g = girar(x, y, 150, 302, tr); return [g[0] + bx, g[1] + by]; };
    const desloca = `translate(${n1(bx)} ${n1(by)})`;
    const rb = rabo(p.raboAng, p.raboCurl, p.raboOnda, p.raboFase);
    q['rabo1.d'] = rb; q['rabo2.d'] = rb; q['rabo3.d'] = rb; q['raboG.transform'] = desloca;
    perna(q, 'E', noCorpo(132, 300), 119 + p.peEX, 335 + p.peEY);
    perna(q, 'D', noCorpo(168, 300), 181 + p.peDX, 335 + p.peDY);
    q['corpo.transform'] = `${desloca} rotate(${n2(tr)} 150 302) translate(150 318) scale(${n3(1 - .006 * r)} ${n3(1 + .013 * r)}) translate(-150 -318)`;
    const pesc = noCorpo(150, 198 - 1.5 * r);
    // a cabeça é desenhada com o queixo em y = 196 e o tronco começa em y = 206: ela desce DESCE para ASSENTAR nos
    // ombros (o queixo cobre o alto do tronco). Sem isso a cabeça parece flutuar acima do corpo.
    q['cab.transform'] = `translate(${n1(pesc[0] - 150 + p.cabX)} ${n1(pesc[1] - 198 + DESCE + p.cabY)}) rotate(${n2(p.cabRot + tr * .4)} 150 194)`;
    braco(q, 'e', noCorpo(119, 229 - 1.2 * r), p.eX + bx, p.eY + by, p.eCurva, p.eGira);
    braco(q, 'd', noCorpo(181, 229 - 1.2 * r), p.dX + bx, p.dY + by, p.dCurva, p.dGira);
    q['tufoE.transform'] = `rotate(${n2(p.tufoE)} 94 138)`;
    q['tufoD.transform'] = `rotate(${n2(p.tufoD)} 206 138)`;
    q['topete.transform'] = `rotate(${n2(p.topete)} 150 72)`;
    olho(q, 'E', 125, p, p.palE); olho(q, 'D', 175, p, p.palD);
    q['arcos.opacity'] = n2(lim(p.feliz, 0, 1));
    q['sobs.opacity'] = n2(lim(p.sobOp, 0, 1));
    q['sobE.transform'] = `translate(125 ${n1(118.5 + p.sobEy)}) rotate(${n2(p.sobEr)})`;
    q['sobD.transform'] = `translate(175 ${n1(118.5 + p.sobDy)}) rotate(${n2(p.sobDr)})`;
    q['cora.opacity'] = n2(lim(p.corar, 0, 1));
    boca(q, p);
    enfeites(q, p, t);
    return q;
  }

  /** O SVG inteiro (sem a etiqueta <svg>). vivo: com data-p em tudo o que mexe e as cinco mãos de cada braço. */
  function molde(q, d, vivo, id) {
    const a = (k, ...attrs) => (vivo ? ` data-p="${k}"` : '') + attrs.map(x => ` ${x}="${q[k + '.' + x]}"`).join('');
    const cont = `stroke="${T}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
    const membro = (k, cor, w) =>
      `<path${a(k + '1', 'd')} fill="none" stroke="${T}" stroke-width="${w + 12}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path${a(k + '2', 'd')} fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const bracoSvg = L =>
      membro(L + 'B', C.pelo, 17) + `<g${a(L + 'M', 'transform')}>` +
      MAOS.filter(tp => vivo || tp === d[L + 'Mao']).map(tp =>
        `<g${vivo ? ` data-p="${L}M_${tp}" display="${tp === d[L + 'Mao'] ? 'inline' : 'none'}"` : ''}>${maoSvg(tp)}</g>`).join('') + `</g>`;
    const pe = L =>
      `<g${a('pe' + L, 'transform')}><ellipse cx="${L === 'E' ? -1 : 1}" rx="23" ry="11.5" fill="${C.pele}" ${cont}/>` +
      `<path d="${L === 'E' ? 'M-13 -1 v 5.4 M-4 1 v 5.4' : 'M13 -1 v 5.4 M4 1 v 5.4'}" fill="none" stroke="${T}" stroke-width="2.6" stroke-linecap="round" opacity=".45"/></g>`;
    // O desenho parado não leva nada invisível nem recortes com id: quem monta figurinha engrossa TODOS os traços
    // para fazer a borda do adesivo (o que estivesse escondido apareceria) e não aceita id repetido.
    const mostra = k => vivo || parseFloat(q[k + '.opacity']) > .02;
    const cilios = espelha => `<path d="${espelha ? 'M11 -10.4 l 4.8 -4 M6.6 -14.4 l 3 -5.2' : 'M-11 -10.4 l -4.8 -4 M-6.6 -14.4 l -3 -5.2'}" fill="none" stroke="${T}" stroke-width="3.2" stroke-linecap="round"/>`;
    const globo = L => `<ellipse rx="13.6" ry="15.6" fill="${T}"/><ellipse cy="3" rx="10.4" ry="11.6" fill="${C.iris}"/><ellipse cy="1.6" rx="6.9" ry="8.3" fill="${C.pupila}"/>` +
      `<g${a('br' + L, 'transform')}><circle cx="4.7" cy="-5.9" r="5" fill="#fff"/><circle cx="-4.9" cy="6.9" r="2.4" fill="#fff" opacity=".85"/></g>`;
    const olhoSvg = (L, espelha) =>
      (!mostra('ol' + L) ? '' : `<g${a('ol' + L, 'transform', 'opacity')}>` + cilios(espelha) +
        (vivo
          ? `<g${a('olIn' + L, 'opacity')} clip-path="url(#${id}o)">` + globo(L) +
            `<rect${a('pal' + L, 'height')} x="-16" y="-17.5" width="32" fill="${C.creme}"/>` +
            `<path${a('palL' + L, 'd', 'opacity')} fill="none" stroke="${T}" stroke-width="4" stroke-linecap="round"/></g>`
          : (q['olIn' + L + '.opacity'] === '1' ? globo(L) : '')) + `</g>`) +
      (mostra('fec' + L) ? `<path${a('fec' + L, 'transform', 'd', 'opacity')} fill="none" stroke="${T}" stroke-width="6.2" stroke-linecap="round"/>` : '');
    const pintas = (x, y) => `<circle cx="${x}" cy="${y}" r="4.2" fill="${C.manteiga}"/>`;
    return (vivo ? `<defs><clipPath id="${id}o"><ellipse rx="13.6" ry="15.6"/></clipPath><clipPath id="${id}b"><path${a('bocaC', 'd')}/></clipPath></defs>` : '') +
      `<g transform="${ESCALA}">` +
      `<ellipse${a('sombra', 'rx', 'opacity')} cx="150" cy="343" ry="9.5" fill="rgba(58,42,90,.18)"/>` +
      `<g${a('tudo', 'transform')}>` +
      // rabo de anéis
      `<g${a('raboG', 'transform')}>` + membro('rabo', C.pelo, 17) +
      `<path${a('rabo3', 'd')} fill="none" stroke="${C.escuro}" stroke-width="17" stroke-dasharray="10 18" stroke-dashoffset="-22"/></g>` +
      // pernas e pés
      membro('pnE', C.pelo, 21) + membro('pnD', C.pelo, 21) + pe('E') + pe('D') +
      // tronco em forma de pera, barriga clara com pelinhos em cima
      `<g${a('corpo', 'transform')}>` +
      `<path d="M150 206 C 180 206 198 236 198 270 C 198 302 180 318 150 318 C 120 318 102 302 102 270 C 102 236 120 206 150 206 Z" fill="${C.pelo}" ${cont}/>` +
      `<path d="M122 264 C 122 251 128 245 134 242 q 5 5.4 9 -1 q 4 6.4 8 0 q 4 6.4 8 0 q 5 5.4 8 2 C 174 247 178 253 178 264 C 178 293 168 310 150 310 C 132 310 122 293 122 264 Z" fill="${C.creme}"/>` +
      `<ellipse cx="141" cy="276" rx="10" ry="17" fill="#fff" opacity=".35"/></g>` +
      // cabeça
      `<g${a('cab', 'transform')}>` +
      `<g${a('tufoE', 'transform')}>${tufo(TUFO_E)}${pintas(58, 118)}${pintas(70, 152)}` +
      `<path d="M52 136 q 7 -9 16 -5 M50 160 q 8 -6 15 -1" fill="none" stroke="${C.tufoSombra}" stroke-width="3.8" stroke-linecap="round"/></g>` +
      `<g${a('tufoD', 'transform')}>${tufo(TUFO_D)}${pintas(242, 118)}${pintas(230, 152)}` +
      `<path d="M248 136 q -7 -9 -16 -5 M250 160 q -8 -6 -15 -1" fill="none" stroke="${C.tufoSombra}" stroke-width="3.8" stroke-linecap="round"/></g>` +
      `<path d="${CABECA}" fill="${C.pelo}"/>` +
      // gorrinho de pelo escuro (acompanha o alto da cabeça, com a barra ondulada) e o brilho dele
      `<path d="M86 101 C 97 81.7 119 68 150 68 C 181 68 203 81.7 214 101 C 211 100 209 101.5 206 103 C 196 109 186 98 176 104 C 166 109 158 104 150 98 C 142 104 134 109 124 104 C 114 98 104 109 94 103 C 91 101.5 89 100 86 101 Z" fill="${C.escuro}"/>` +
      `<ellipse cx="119" cy="86" rx="17" ry="6.5" fill="#fff" opacity=".16" transform="rotate(-24 119 86)"/>` +
      `<path d="${CABECA}" fill="none" ${cont}/>` +
      // mancha branca na testa
      `<path d="M150 82 C 161 91 163 107 150 118 C 137 107 139 91 150 82 Z" fill="${C.branco}"/>` +
      // topetinho de duas pontas
      `<g${a('topete', 'transform')}><path d="M137 73 C 133 58 138 50 146 48 C 143 57 146 61 150 62 C 150 51 156 45 164 46 C 159 54 161 62 165 73 Z" fill="${C.escuro}"/>` +
      `<path d="M137 71 C 133 58 138 50 146 48 C 143 57 146 61 150 62 C 150 51 156 45 164 46 C 159 54 161 62 164.5 71" fill="none" ${cont}/></g>` +
      // máscara clara: dois "óculos" e o focinho
      `<circle cx="124" cy="141" r="28" fill="${C.creme}"/><circle cx="176" cy="141" r="28" fill="${C.creme}"/><ellipse cx="150" cy="166" rx="33" ry="22" fill="${C.creme}"/>` +
      `<g${a('cora', 'opacity')} fill="${C.bochecha}"><ellipse cx="101" cy="163" rx="9.5" ry="6"/><ellipse cx="199" cy="163" rx="9.5" ry="6"/></g>` +
      olhoSvg('E', false) + olhoSvg('D', true) +
      (mostra('arcos') ? `<g${a('arcos', 'opacity')} fill="none" stroke="${T}" stroke-width="7" stroke-linecap="round"><path d="M112 146 Q 125 128 138 146"/><path d="M162 146 Q 175 128 188 146"/></g>` : '') +
      (mostra('sobs') ? `<g${a('sobs', 'opacity')} fill="none" stroke="${T}" stroke-width="5" stroke-linecap="round">` +
      `<path${a('sobE', 'transform')} d="M-12 2 Q 0 -6 12 .6"/><path${a('sobD', 'transform')} d="M12 2 Q 0 -6 -12 .6"/></g>` : '') +
      // narizinho e o risquinho até a boca
      `<path${a('filtro', 'd')} fill="none" stroke="${T}" stroke-width="3.6" stroke-linecap="round"/>` +
      `<path d="M143.5 158 Q 150 153.5 156.5 158 Q 155 165 150 166.5 Q 145 165 143.5 158 Z" fill="${C.escuro}"/>` +
      // boca: recheio, língua recortada pela boca, contorno por cima
      `<path${a('boca', 'd')} fill="${C.boca}"/>` +
      (vivo ? `<g clip-path="url(#${id}b)"><ellipse${a('lingua', 'cy', 'rx', 'ry', 'opacity')} cx="150" fill="${C.lingua}"/></g>`
        : (mostra('lingua') ? `<ellipse${a('linguaS', 'cy', 'rx', 'ry')} cx="150" fill="${C.lingua}"/>` : '')) +
      `<path${a('bocaT', 'd')} fill="none" stroke="${T}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>` +
      `</g>` +
      // braços (por cima da cabeça: as mãos levantadas passam na frente dos tufos)
      bracoSvg('e') + bracoSvg('d') +
      // enfeites
      (mostra('bolhas') ? `<g${a('bolhas', 'opacity', 'transform')} fill="#fff" stroke="${T}" stroke-width="4.2"><circle cx="54" cy="78" r="7"/><circle cx="34" cy="50" r="11"/></g>` : '') +
      (mostra('brilhos') ? `<g${a('brilhos', 'opacity')} fill="#FFD23F" stroke="${T}" stroke-width="3.4" stroke-linejoin="round">` +
      BRILHOS.map((b, i) => `<path${a('bri' + i, 'transform')} d="${ESTRELA}"/>`).join('') + `</g>` : '') +
      (mostra('notas') ? `<g${a('notas', 'opacity')}>` + NOTAS.map((n, i) =>
        `<g${a('nota' + i, 'transform')}><path d="M4 5 V -13 L 14 -16 V -9.5 L 4 -6.5" fill="${T}" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>` +
        `<ellipse cx="-.5" cy="6" rx="6" ry="4.6" transform="rotate(-20 -.5 6)" fill="${n[2]}" stroke="${T}" stroke-width="3"/></g>`).join('') + `</g>` : '') +
      (mostra('coracoes') ? `<g${a('coracoes', 'opacity')} fill="#FF7A9A" stroke="${T}" stroke-width="3" stroke-linejoin="round">` +
      CORACOES.map((c, i) => `<path${a('cor' + i, 'transform', 'opacity')} d="${CORACAO}"/>`).join('') + `</g>` : '') +
      `</g></g>`;
  }

  const defDe = nome => POSES[nome] || POSES.normal;
  const discretos = def => ({ eMao: def.eMao || 'mao', dMao: def.dMao || 'mao' });
  const ABRE = '<svg viewBox="0 0 250 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';

  /** A Pipoca parada numa pose. Texto SVG, viewBox 0 0 250 270. */
  function svg(pose) {
    const def = defDe(pose), p = Object.assign({}, P0, def.p);
    if (def.ciclo) {
      const o = {};
      def.ciclo(def.foto || 0, o, p);
      for (const k in o) p[k] += o[k];
    }
    return ABRE + molde(quadro(p, 0), discretos(def), false, 'pcp' + (++uid)) + '</svg>';
  }

  // ======================================================================== a Pipoca viva
  // molas: [velocidade, amortecimento]. Menos amortecimento = passa mais do ponto antes de assentar.
  const MOLAS = {};
  const grupo = (lista, w, z) => lista.split(' ').forEach(k => { MOLAS[k] = [w, z]; });
  grupo('eX eY eCurva eGira dX dY dCurva dGira', 15, .6);
  grupo('cabX cabY cabRot troncoRot inclina corpoX corpoY', 12, .66);
  grupo('pulo agacha', 18, .7);
  grupo('olharX olharY palE palD feliz olhoEsc fecCurva sobOp sobEy sobDy sobEr sobDr corar', 24, .9);
  grupo('bLarg bSorriso bAbre bO', 60, .85);   // rápida: a boca acompanha as sílabas da fala
  grupo('peEX peEY peDX peDY', 16, .7);
  grupo('raboAng raboCurl raboOnda raboFase tufoE tufoD topete resp', 10, .55);
  grupo('bolhas brilhos notas coracoes', 9, 1);
  // formatos de boca da fala: [abertura, meia largura, redonda]
  const BOCAS = [[.22, 12, 0], [.5, 13.5, .15], [.85, 12.5, .4], [.45, 8, 1], [.3, 15, 0], [.65, 10, .7], [0, 12.5, 0]];
  // as formas do Rhubarb (fala gravada com vozes/bocas.js): A fechada (m b p), B quase fechada, C aberta (e),
  // D bem aberta (a), E redonda (o), F biquinho (u), G dentinho no lábio (f v), H língua (l), X descanso
  const VISEMAS = { A: [0, 11.5, 0], B: [.22, 13, 0], C: [.55, 14, .1], D: [.92, 13, .2], E: [.6, 10, .75], F: [.32, 7.5, 1],
    G: [.16, 13.5, 0], H: [.42, 12.5, 0], X: [0, 12.5, 0] };
  const sorte = (a, b) => a + Math.random() * (b - a);      // (Math.random de propósito: não mexe no sorteio do jogo)

  function criar(alvoEl, opcoes) {
    const op = opcoes || {};
    const comVida = op.vida !== false;
    const id = 'pcp' + (++uid);
    let nome = POSES[op.pose] ? op.pose : 'normal', def = POSES[nome];
    const est = Object.assign({}, P0, def.p), vel = {}, alvo = Object.assign({}, P0, def.p), alvoFala = {};
    CHAVES.forEach(k => { vel[k] = 0; });
    const disc = discretos(def);
    alvoEl.innerHTML = ABRE + molde(quadro(est, 0), disc, true, id) + '</svg>';
    const el = alvoEl.firstElementChild;
    const refs = {}, cache = {};
    el.querySelectorAll('[data-p]').forEach(e => { refs[e.dataset.p] = e; });

    let relogio = 0, ultimo = 0, raf = 0, tPose = 0, destruida = false, quadros = 0, visivel = true, fora = 0;
    let rostoExtra = null; const alvoRosto = {};
    let falando = false, falaPeso = 0, bocaAtual = BOCAS[0], proxBoca = 0;
    let proxPisca = sorte(1, 3), piscaT = -1, piscaDupla = false;
    let proxTufo = sorte(3, 7), tufoT = -1, tufoLado = 'E';
    let proxOlhar = sorte(2.5, 5), fimOlhar = 0;
    const vag = { x: 0, y: 0, tx: 0, ty: 0 }, toque = { x: 0, y: 0, ate: 0 };
    let proxMania = sorte(7, 12);
    const arr = { cab: 0, alt: 0, vCab: 0, vAlt: 0 };
    const ciclos = [];
    let momentoTimer = 0;

    function aplicar(q) {
      for (const k in q) {
        const v = q[k];
        if (cache[k] === v) continue;
        cache[k] = v;
        const i = k.lastIndexOf('.'), e = refs[k.slice(0, i)];
        if (e) e.setAttribute(k.slice(i + 1), v);
      }
    }
    function trocarMao(L, tipo) {
      if (disc[L + 'Mao'] === tipo) return;
      const a = refs[L + 'M_' + disc[L + 'Mao']], b = refs[L + 'M_' + tipo];
      if (a) a.setAttribute('display', 'none');
      if (b) b.setAttribute('display', 'inline');
      disc[L + 'Mao'] = tipo;
    }
    function addCiclo(fn, dur, daPose) {
      ciclos.push({ fn, t0: relogio, peso: dur ? 1 : 0, alvo: 1, dur: dur || Infinity, daPose: !!daPose, o: {} });
    }
    function rodarCiclos(p, dt) {
      for (let i = ciclos.length - 1; i >= 0; i--) {
        const c = ciclos[i], tc = relogio - c.t0;
        if (c.alvo > c.peso) c.peso = Math.min(1, c.peso + dt / .24); else if (c.alvo < c.peso) c.peso = Math.max(0, c.peso - dt / .16);
        if ((c.alvo === 0 && c.peso <= 0) || tc >= c.dur) { ciclos.splice(i, 1); continue; }
        for (const k in c.o) c.o[k] = 0;
        c.fn(tc, c.o, p);
        for (const k in c.o) p[k] += c.o[k] * c.peso;
      }
    }

    // ---------------------------------------------------------------- movimentos de vida
    function vida(p, dt) {
      const t = relogio, calma = def.calma == null ? 1 : def.calma;
      const b = Math.sin(t * 1.9);                                 // respiração
      p.resp += b;
      if (p.eY > 262) p.eY -= .8 * b;                              // as mãos soltas acompanham
      if (p.dY > 262) p.dY -= .8 * b;
      // troca o peso de uma perna para a outra, bem devagar
      const peso = Math.sin(t * .62);
      p.corpoX += 2.2 * peso * calma; p.troncoRot += .9 * peso * calma; p.cabRot += (1.3 * Math.sin(t * .83 + 1) - .6 * peso) * calma;
      // o rabo ondula da base até a ponta
      p.raboOnda += 5; p.raboFase += t * 2.3;
      p.raboAng += 4 * Math.sin(t * 1.1); p.raboCurl += 9 * Math.sin(t * 1.05 + .7);
      p.tufoE += 1.3 * b; p.tufoD -= 1.3 * b;
      // piscar (às vezes duas vezes seguidas)
      if (piscaT < 0 && t >= proxPisca) piscaT = t;
      if (piscaT >= 0) {
        const u = (t - piscaT) / .17;
        if (u >= 1) {
          piscaT = -1;
          piscaDupla = !piscaDupla && Math.random() < .22;
          proxPisca = t + (piscaDupla ? .1 : sorte(2.2, 5.6));
        } else {
          const k = u < .4 ? u / .4 : 1 - (u - .4) / .6;
          p.palE = Math.max(p.palE, k); p.palD = Math.max(p.palD, k);
        }
      }
      // um tufo dá uma tremidinha
      if (tufoT < 0 && t >= proxTufo) { tufoT = t; tufoLado = Math.random() < .5 ? 'E' : 'D'; }
      if (tufoT >= 0) {
        const u = (t - tufoT) / .55;
        if (u >= 1) { tufoT = -1; proxTufo = t + sorte(4, 9); }
        else p['tufo' + tufoLado] += 9 * Math.sin(u * Math.PI * 3) * (1 - u);
      }
      // os olhos passeiam (só nas poses calmas e sem fala) e acompanham o último toque da criança
      if (def.vagueia && !falando) {
        if (t >= proxOlhar) { vag.tx = sorte(-3.6, 3.6); vag.ty = sorte(-2, 1.4); fimOlhar = t + sorte(.7, 1.6); proxOlhar = fimOlhar + sorte(2.2, 5); }
        if (t >= fimOlhar) { vag.tx = 0; vag.ty = 0; }
      } else { vag.tx = 0; vag.ty = 0; }
      let tx = vag.tx, ty = vag.ty;
      if (t < toque.ate) { tx = toque.x * 4.4; ty = toque.y * 3.2; }
      const f = Math.min(1, dt * 13);
      vag.x += (tx - vag.x) * f; vag.y += (ty - vag.y) * f;
      p.olharX += vag.x; p.olharY += vag.y;
      p.cabRot += vag.x * .5; p.cabX += vag.x * .3;                  // a cabeça vai um pouquinho junto com o olhar
      // de vez em quando, uma mania (só parada na pose normal)
      if (nome === 'normal' && !falando && t >= proxMania) {
        proxMania = t + sorte(8, 15);
        const qual = Math.floor(Math.random() * 3);
        if (qual === 0) addCiclo((u, o) => { const k = 1 - u / 1.2; o.raboAng = 18 * Math.sin(u * 11) * k; o.raboCurl = -16 * Math.sin(u * 5.7) * k; }, 1.2);
        else if (qual === 1) {
          const lado = Math.random() < .5 ? -1 : 1;
          addCiclo((u, o) => { const k = Math.sin(Math.PI * u / 1.7); o.cabRot = 8 * lado * k; o.olharX = 3 * lado * k; o.olharY = -2 * k; o.sobOp = k; o.sobEy = -3 * k; o.sobDy = -3 * k; o['tufo' + (lado < 0 ? 'E' : 'D')] = 6 * lado * k; }, 1.7);
        } else addCiclo((u, o) => { const k = Math.sin(Math.PI * u / .5); o.corpoY = -4 * k; o.peEY = -3 * k; o.eY = -4 * k; o.dY = -4 * k; }, .5);
      }
    }
    function fala(p, dt) {
      falaPeso += lim((falando ? 1 : 0) - falaPeso, -dt / .2, dt / .15);
      if (falaPeso <= 0) return;
      const t = relogio, f = falaPeso;
      p.cabY -= 1.8 * Math.abs(Math.sin(t * 6.3)) * f;
      p.cabRot += 1.8 * Math.sin(t * 3.7) * f;
      p.sobEy -= 1.4 * f; p.sobDy -= 1.4 * f;
      p.raboCurl += 5 * Math.sin(t * 6.3) * f;
    }
    /** Os tufos, o topete e o rabo vão atrasados em relação à cabeça e ao sobe e desce do corpo. */
    function arrasto(p, dt) {
      const giro = p.cabRot + p.inclina + p.troncoRot * .4, altura = p.pulo - p.corpoY - p.cabY;
      const vc = (giro - arr.cab) / dt, va = (altura - arr.alt) / dt;
      arr.cab = giro; arr.alt = altura;
      const f = Math.min(1, dt * 9);
      arr.vCab += (lim(vc, -160, 160) - arr.vCab) * f; arr.vAlt += (lim(va, -260, 260) - arr.vAlt) * f;
      p.tufoE += -arr.vCab * .09 - arr.vAlt * .07; p.tufoD += -arr.vCab * .09 + arr.vAlt * .07;
      p.topete += -arr.vCab * .2 - arr.vAlt * .05;
      p.raboCurl += arr.vAlt * .09; p.raboAng += -arr.vCab * .04;
    }

    // ---------------------------------------------------------------- o laço
    function passo(agora) {
      raf = 0;
      if (destruida) return;
      if (!el.isConnected) {                                       // fora da tela: espera um pouco (pode estar sendo
        if (++fora < 40) setTimeout(acordar, 150);                 // montada); depois para (pose() ou falar() acordam)
        return;
      }
      fora = 0;
      raf = requestAnimationFrame(passo);
      quadros++;
      if (quadros % 30 === 0) visivel = alvoEl.offsetWidth > 0;
      if (!visivel) { ultimo = agora; return; }
      const ativo = falando || falaPeso > 0 || relogio - tPose < 1.2 || ciclos.length > 0 || relogio < toque.ate + .4;
      if (!ativo && (quadros & 1)) return;                         // parada, desenha a 30 quadros por segundo
      let dt = ultimo ? (agora - ultimo) / 1000 : 1 / 60;
      ultimo = agora;
      dt = lim(dt, .001, .05);
      if (PC.config && PC.config.rapido) dt *= 3;
      relogio += dt;
      // a fala troca o formato da boca várias vezes por segundo
      let al = alvo;
      if (rostoExtra) al = Object.assign(alvoRosto, alvo, rostoExtra);
      if (falando) {
        const v = PC.voz && PC.voz.bocaAgora ? PC.voz.bocaAgora() : null;
        if (v) bocaAtual = VISEMAS[v] || bocaAtual;
        else if (relogio >= proxBoca) {
          let b; do { b = BOCAS[Math.floor(Math.random() * BOCAS.length)]; } while (b === bocaAtual);
          bocaAtual = b; proxBoca = relogio + sorte(.085, .17);
        }
        al = Object.assign(alvoFala, al);
        al.bAbre = bocaAtual[0]; al.bLarg = bocaAtual[1]; al.bO = bocaAtual[2]; al.bSorriso = .6;
      }
      // molas
      const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
      for (let j = 0; j < CHAVES.length; j++) {
        const k = CHAVES[j], m = MOLAS[k], w = m[0], z = m[1], a = al[k];
        let x = est[k], v = vel[k];
        for (let i = 0; i < n; i++) { v += (w * w * (a - x) - 2 * z * w * v) * h; x += v * h; }
        est[k] = x; vel[k] = v;
      }
      const p = Object.assign({}, est);
      rodarCiclos(p, dt);
      if (comVida) vida(p, dt);
      fala(p, dt);
      arrasto(p, dt);
      aplicar(quadro(p, relogio));
    }
    function acordar() { if (!raf && !destruida) { ultimo = 0; raf = requestAnimationFrame(passo); } }

    function pose(novo) {
      novo = POSES[novo] ? novo : 'normal';
      clearTimeout(momentoTimer);
      if (novo !== nome) {
        nome = novo; def = POSES[nome];
        Object.assign(alvo, P0, def.p);
        const dn = discretos(def);
        trocarMao('e', dn.eMao); trocarMao('d', dn.dMao);
        tPose = relogio;
        ciclos.forEach(c => { if (c.daPose) c.alvo = 0; });
        if (def.ciclo) addCiclo(def.ciclo, 0, true);
        if (def.entrada === 'pulinho') pular(14);
      }
      acordar();
    }
    let pulandoAte = 0;
    function pular(altura) {
      if (relogio < pulandoAte) return;                            // já está no ar: um pulo de cada vez
      pulandoAte = relogio + .6;
      const h = altura || 30;
      addCiclo((t, o) => {
        const u = lim((t - .12) / .36, 0, 1), k = Math.sin(Math.PI * u);
        o.pulo = h * 4 * u * (1 - u);
        o.corpoY = chaves(t, [[0, 0], [.12, 10], [.17, 0], [.47, 0], [.53, 9], [.72, 0]]);       // dobra as pernas antes e depois
        o.agacha = chaves(t, [[0, 0], [.12, .03], [.2, -.07], [.32, -.03], [.46, -.06], [.52, .05], [.62, -.02], [.72, 0]]);
        o.peEY = -8 * k; o.peDY = -8 * k; o.peEX = -3 * k; o.peDX = 3 * k;                        // encolhe os pés no ar
        if (est.eY > 262) { o.eY = -12 * k; o.eX = -6 * k; }
        if (est.dY > 262) { o.dY = -12 * k; o.dX = 6 * k; }
        o.raboCurl = -18 * k;
      }, .72);
      acordar();
    }
    if (def.ciclo) addCiclo(def.ciclo, 0, true);
    acordar();

    return {
      el,
      get poseAtual() { return nome; },
      pose,
      pular,
      falar(liga) { falando = !!liga; if (falando) proxBoca = 0; acordar(); },
      /** Faz a pose `outra` por `ms` e volta para a que estava. */
      momento(outra, ms) {
        const antes = nome;
        pose(outra);
        momentoTimer = setTimeout(() => { if (nome === outra) pose(antes); }, ms || 1500);
      },
      /** Olha para uma direção (dx, dy de -1 a 1) por `ms`. */
      /** muda só o rosto (olhos, sobrancelhas, bochechas, sorriso, inclinação da cabeça) por cima da pose: rosto({...}) ou rosto(null) */
      rosto(r) { rostoExtra = r ? Object.assign({}, r) : null; acordar(); },
      olhar(dx, dy, ms) { toque.x = lim(dx, -1, 1); toque.y = lim(dy, -1, 1); toque.ate = relogio + (ms || 1200) / 1000; acordar(); },
      destruir() { destruida = true; clearTimeout(momentoTimer); if (raf) cancelAnimationFrame(raf); raf = 0; },
    };
  }

  PC.pipoca = { svg, criar, poses: () => Object.keys(POSES), cores: C };
  if (PC.arte) { PC.arte.pipoca = svg; PC.arte.poses = () => Object.keys(POSES); }
})();
