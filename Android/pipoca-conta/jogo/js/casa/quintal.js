/* Casa da Pipoca (esboço) — QUINTAL DOS FUNDOS: mangueira com balanço, casinha de passarinho, hortinha,
   varal, piscininha com boia e patinho, regador e baldinho. Cerca de ripas com trepadeira e flores ao fundo,
   degrau da porta da cozinha e caminho de pedrinhas.
   Cada objeto é uma função desenhada em volta de (0,0) = meio do pé no chão
   (a casinha de passarinho é a exceção: (0,0) = o gancho de onde ela pende). */
(function () {
  'use strict';
  const { T, r, c, e, p, l, f, fr, fe, brilho, sombra, tom, em, n } = CASA;
  const MAD = '#C98A55', MAD2 = '#A9703F', MAD3 = '#8A5A34', CREME = '#FFF4E6';
  const V1 = '#5CC84A', V2 = '#4FB83D', V3 = '#3E9E33', V4 = '#8BD06F';
  const AGUA = '#8FE0F4', CORDA = '#EAC98E';

  // ---------------------------------------------------------------- ajudantes do quintal
  /** anel/linha com contorno: risco grosso T por baixo e a cor por cima */
  const tubo = (d, cor, w) => l(d, T, w + 8) + l(d, cor, w);
  /** elipse vazada (laçada de corda) */
  const anel = (x, y, rx, ry, cor, sw) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="none" stroke="${cor}" stroke-width="${sw}"/>`;
  /** folhinha com nervura, apontando para o ângulo dado */
  function folha(x, y, ang, s, cor, sw = 3) {
    return em(x, y, 1, p(`M0 0 Q ${n(s * .5)} ${n(-s * .45)} ${n(s)} 0 Q ${n(s * .5)} ${n(s * .45)} 0 0 Z`, cor, sw) +
      l(`M${n(s * .12)} 0 H ${n(s * .72)}`, tom(cor, -.25), 2), ang);
  }
  /** nuvem de círculos com contorno só por fora */
  function nuvemDeFolhas(cs, cor, sw = 6) {
    return cs.map(([x, y, rr]) => c(x, y, rr, cor, sw)).join('') + cs.map(([x, y, rr]) => fe(x, y, rr - sw / 2, rr - sw / 2, cor)).join('');
  }
  /** florzinha de 5 pétalas */
  function flor(x, y, cor, s = 1, miolo = '#FFD23F') {
    let d = '';
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 - Math.PI / 2;
      d += c(x + Math.cos(a) * 9 * s, y + Math.sin(a) * 9 * s, 7.5 * s, cor, 3);
    }
    return d + c(x, y, 5.5 * s, miolo, 3) + fe(x - 1.5 * s, y - 1.5 * s, 2 * s, 2 * s, '#fff', .7);
  }
  /** tufinho de grama */
  const tufo = (x, y, s = 1, cor = V2) => em(x, y, s, p('M-16 0 Q -14 -14 -20 -26 Q -8 -18 -5 -6 Q -4 -26 2 -36 Q 6 -20 5 -6 Q 10 -20 20 -26 Q 14 -12 16 0 Z', cor, 3));
  /** risquinhos de veio de madeira dentro de um retângulo */
  function veio(x, y, w, h, cor = MAD2) {
    let s = '';
    const linhas = Math.max(1, Math.floor(h / 14));
    for (let i = 0; i < linhas; i++) {
      const yy = y + h * (i + .5) / linhas, a = x + 10 + (i * 37) % Math.max(20, w * .3);
      s += l(`M${n(a)} ${n(yy)} q ${n(w * .18)} -4 ${n(w * .36)} 0 t ${n(w * .3)} 0`, cor, 2.5);
    }
    return s;
  }

  // ---------------------------------------------------------------- objetos
  function manga(x, y, ang, k) {
    const cor = ['#FFC93C', '#FF9F43', '#FF7A6B', '#FFB347'][k % 4];
    return em(x, y, 1,
      l('M0 -19 q 2 -10 -3 -20', MAD3, 4) + folha(-2, -34, -150 + (k % 2) * 110, 22, V3, 3) +
      e(0, 0, 15, 21, cor, 4) + fe(4, 5, 8, 12, tom(cor, -.15)) +
      (k % 3 === 0 ? fe(-5, 6, 6, 8, '#FF7A6B', .55) : fe(-4, 8, 6, 7, '#9BD35A', .5)) +
      brilho(-5, -8, 4, 7, -20, .7), ang);
  }

  /** Mangueira grande, com um galho comprido à direita (onde amarra o balanço, em x +145 e +255, y -500). */
  function mangueira() {
    let s = sombra(30, 2, 330, 20) + sombra(10, 0, 140, 12);
    // tufos de folhas do fundo (mais escuros) para dar profundidade
    s += nuvemDeFolhas([[-385, -590, 74], [392, -600, 70], [-290, -830, 84], [300, -836, 80], [-60, -890, 70]], V3, 6);
    // tronco com raízes e os dois galhos numa forma só
    const tronco = 'M-95 0 Q -60 -10 -50 -60 Q -44 -130 -42 -300 L -40 -440 Q -110 -470 -200 -540 L -214 -580 Q -120 -532 -38 -505 L -38 -620 L 32 -620 L 34 -452 Q 90 -515 170 -512 L 300 -512 Q 345 -514 372 -550 Q 395 -542 388 -524 Q 352 -488 300 -488 L 170 -488 Q 100 -488 40 -400 L 42 -300 Q 46 -130 54 -60 Q 64 -10 100 0 Z';
    s += p(tronco, MAD3, 6);
    s += f('M14 -600 L 32 -600 L 34 -452 L 40 -400 L 42 -300 Q 46 -130 54 -60 Q 64 -10 100 0 L 34 0 Q 24 -60 22 -150 L 18 -420 Z', tom(MAD3, -.18));
    s += f('M110 -494 Q 150 -492 170 -492 L 300 -492 Q 345 -492 380 -528 L 388 -524 Q 352 -488 300 -488 L 170 -488 Q 130 -488 104 -480 Z', tom(MAD3, -.25));
    // casca: riscos e listras claras
    s += l('M-22 -70 q -8 -60 0 -120 q 7 -60 -2 -130 q -6 -60 2 -120', tom(MAD3, -.3), 4);
    s += l('M10 -40 q 6 -50 -2 -100 q -6 -40 3 -90', tom(MAD3, -.3), 4) + l('M-60 -14 q 14 -10 20 -36 M70 -10 q -14 -8 -22 -34', tom(MAD3, -.3), 4);
    s += l('M-30 -220 q -4 -40 2 -80 M-28 -470 q -3 -30 3 -50', tom(MAD3, .22), 4) + l('M200 -503 q 30 -3 60 0 M-110 -500 q -30 -18 -50 -30', tom(MAD3, .22), 3);
    s += l(tronco, T, 6);
    // buraquinho na casca
    s += e(-8, -300, 13, 19, '#5A3A22', 4) + fe(-5, -295, 7, 11, '#3A2414') + l('M-24 -316 q 16 -14 32 0', tom(MAD3, -.3), 3);
    // a copa
    const copa = [[-300, -630, 95], [-150, -630, 95], [0, -632, 95], [150, -630, 95], [300, -628, 95],
      [-230, -750, 128], [-60, -760, 132], [110, -755, 130], [270, -745, 112],
      [-130, -822, 96], [30, -830, 96], [180, -818, 92], [-390, -680, 80], [395, -690, 76]];
    s += nuvemDeFolhas(copa, V1, 6);
    // sombras embaixo de cada tufo e brilhos em cima
    copa.forEach(([x, y, rr]) => { if (y > -700) s += fe(x, y + 38, rr * .78, rr * .4, V2); });
    // arcos de dentro: os tufos de cima "encaixados" nos de baixo
    copa.forEach(([x, y, rr], i) => { if (y < -700 && Math.abs(x) < 360) { const a = .62 + (i % 3) * .08; s += l(`M${n(x - rr * a)} ${n(y + rr * Math.sqrt(1 - a * a))} A ${rr} ${rr} 0 0 0 ${n(x + rr * .35)} ${n(y + rr * .94)}`, V2, 6); } });
    s += fe(0, -585, 360, 34, V2) + fe(-10, -575, 330, 18, V3, .5);
    [[-150, -862, 50], [20, -872, 52], [-260, -790, 46], [100, -800, 50], [260, -790, 40], [-60, -800, 44]].forEach(([x, y, rr]) => { s += fe(x, y, rr, rr * .55, V4); });
    s += brilho(-120, -872, 46, 16, -15, .3) + brilho(40, -886, 30, 10, -15, .3);
    // textura de folhinhas (riscos em V)
    const marcas = [[-330, -660], [-250, -700], [-170, -680], [-90, -720], [-10, -690], [70, -710], [150, -670], [230, -700], [320, -660],
      [-280, -760], [-190, -790], [-110, -760], [-30, -810], [50, -780], [140, -760], [210, -730], [300, -740], [-370, -700], [380, -700],
      [-160, -840], [-60, -850], [60, -850], [150, -840], [220, -800], [-230, -730], [100, -720], [-40, -740], [0, -640], [-200, -640], [200, -640]];
    marcas.forEach(([x, y], i) => { s += l(`M${x} ${y} q ${i % 2 ? 8 : -8} 10 ${i % 2 ? 18 : -18} 2`, V3, 4); });
    marcas.forEach(([x, y], i) => { if (i % 3 === 0) s += folha(x + 20, y - 16, -30 - i * 13, 26, V4, 3); });
    // mangas: algumas penduradas embaixo da copa, outras no meio das folhas
    [[-220, -538, 8], [-75, -536, -6], [80, -545, 10], [228, -540, -8], [-340, -590, 4],
      [-150, -712, -10], [60, -800, 12], [200, -690, -4], [-40, -660, 6], [310, -760, 8], [-285, -775, -12], [-200, -870, 4], [140, -880, -6]]
      .forEach(([x, y, a], i) => { s += em(x, y, 1.18, manga(0, 0, a, i)); });
    // mangas caídas no chão e tufos no pé
    s += em(-150, -14, 1, manga(0, 0, 80, 1)) + em(150, -13, 1, manga(0, 0, -95, 2));
    s += tufo(-100, 2, 1.1, V1) + tufo(110, 2, 1, V2) + tufo(-40, 4, .8, V1);
    return s;
  }

  /** Balanço de corda com tábua; as cordas sobem até y -500 (o galho da mangueira). */
  function balanco() {
    const corda = x => tubo(`M${x} -500 V -126`, CORDA, 6) +
      Array.from({ length: 15 }, (_, i) => l(`M${x - 3} ${-484 + i * 24} l 6 8`, '#B88E52', 2)).join('');
    let s = sombra(0, 0, 100, 11);
    s += corda(-55) + corda(55);
    // laçadas em volta do galho
    s += [-55, 55].map(x => anel(x, -500, 12, 18, T, 11) + anel(x, -500, 12, 18, CORDA, 5) + l(`M${x - 8} -510 l 16 12`, '#B88E52', 2)).join('');
    // tábua
    s += r(-90, -140, 180, 28, MAD, 10, 5) + fr(-84, -124, 168, 9, tom(MAD, -.15), 4) + veio(-90, -138, 180, 18) +
      brilho(-45, -133, 32, 4, 0, .55) + c(-72, -126, 3.5, MAD3, 0) + c(72, -126, 3.5, MAD3, 0);
    // nós da corda embaixo da tábua
    s += [-55, 55].map(x => c(x, -106, 9, CORDA, 4) + l(`M${x - 3} -98 l -4 12 M${x + 3} -98 l 4 12`, T, 4)).join('');
    return s;
  }

  /** Casinha de passarinho pendurada, com um passarinho azul no poleiro. (0,0) = o gancho no alto.
      passeio: o passarinho sai voando, para no ar (cantando) e volta virado para a casinha. */
  function casinhaPassarinho(passeio = false) {
    let s = l('M0 0 V 52', T, 4) + l('M-24 64 L 0 46 L 24 64', T, 3);
    // corpo
    s += r(-40, 70, 80, 92, '#FFD23F', 10, 5) + fr(14, 76, 22, 82, tom('#FFD23F', -.15), 6) + l('M-36 100 H 36 M-36 130 H 36', tom('#FFD23F', -.2), 2.5);
    s += r(-40, 70, 80, 92, 'none', 10, 5);
    // telhado de telhinhas
    s += p('M-58 80 L 0 30 L 58 80 Q 60 90 50 90 L -50 90 Q -60 90 -58 80 Z', '#FF7A6B', 5);
    s += l('M-36 74 q 9 8 18 0 q 9 8 18 0 q 9 8 18 0 q 9 8 18 0 M-18 58 q 9 8 18 0 q 9 8 18 0', tom('#FF7A6B', -.2), 3) + brilho(-22, 58, 16, 5, -40, .45);
    // porta redonda, poleiro e bandejinha
    s += c(0, 112, 15, '#4A3060', 4) + fe(-4, 108, 5, 5, '#6A4A88') + tubo('M0 138 H 26', MAD3, 4);
    s += r(-46, 160, 92, 12, MAD, 5, 4) + c(-30, 154, 4, '#F5D58A', 2) + c(-20, 156, 3.5, '#F5D58A', 2) + c(32, 155, 4, '#F5D58A', 2);
    // passarinho
    const asa = p('M-8 -18 q 6 10 14 2', '#2E7FD8', 3);
    const ave = asa2 => em(30, 136, 1,
      p('M-14 -14 L -30 -20 L -24 -8 Z', '#2E7FD8', 3) +
      e(0, -16, 17, 14, '#4DA3FF', 4) + fe(4, -10, 10, 7, CREME) + c(10, -30, 11, '#4DA3FF', 4) +
      p('M19 -32 L 30 -28 L 19 -24 Z', '#FFC93C', 3) + c(13, -32, 2.6, T, 0) + fe(14, -26, 3, 2, '#FF8FC2', .8) +
      asa2 + l('M-2 -3 v 6 M5 -3 v 6', '#FF9F43', 3));
    if (!passeio) return s + ave(asa);
    // voando: a asa bate (aberta para cima) e o corpo vai e volta; na volta ele se vira para a casinha
    const bate = `<g style="transform-box:fill-box;transform-origin:50% 100%;animation:qtlAsa .14s linear infinite alternate">${p('M-10 -20 Q -4 -46 12 -22 Z', '#2E7FD8', 3)}</g>`;
    return s + `<g style="--dx:150px;--dy:-180px;animation:qtlPasseio 2.6s ease-in-out both"><g style="transform-box:fill-box;transform-origin:50% 50%;animation:qtlVira 2.6s linear both">${ave(bate)}</g></g>`;
  }

  /** Hortinha num canteiro de madeira: alfaces, cenouras aparecendo e um pé de tomate na estaca. */
  /*  cresce (0–3): as plantas ficam um pouco maiores a cada vez que são regadas.
      mexe: as folhas balançam e uma cenoura pula para fora da terra e volta. */
  function hortinha(cresce = 0, mexe = false) {
    const k = 1 + .1 * Math.min(3, cresce);
    /** a planta maior, crescendo a partir do pé (px, py) */
    const maior = (d, px, py) => (cresce > 0 ? em(px, py, k, em(-px, -py, 1, d)) : d);
    /** balança uma vez, presa pelo pé */
    const balanca = (d, a, atraso) => (mexe ? `<g style="transform-box:fill-box;transform-origin:50% 100%;--a:${a}deg;animation:qtlBalanca .9s ease-in-out ${atraso}s both">${d}</g>` : d);
    let s = sombra(0, 0, 145, 12);
    // pé de tomate (atrás da tábua da frente)
    let pe = tubo('M78 -80 V -300', MAD2, 8) + c(78, -304, 6, MAD2, 4);
    pe += l('M70 -86 Q 54 -140 74 -180 Q 92 -220 70 -260 Q 62 -282 78 -296', T, 11) + l('M70 -86 Q 54 -140 74 -180 Q 92 -220 70 -260 Q 62 -282 78 -296', V3, 5);
    [[62, -130, 200], [72, -180, -20], [86, -212, -30], [62, -244, 210], [74, -284, -60], [60, -164, 160], [92, -150, -10]]
      .forEach(([x, y, a]) => { pe += folha(x, y, a, 30, V1, 3); });
    pe += l('M70 -170 h 16 M72 -240 h 14', '#FF8FC2', 4);
    const tomate = (x, y, cor) => c(x, y, 15, cor, 4) + fe(x + 4, y + 5, 8, 7, tom(cor, -.15)) +
      p(`M${x - 8} ${y - 12} L ${x} ${y - 7} L ${x + 8} ${y - 12} L ${x + 5} ${y - 16} L ${x} ${y - 13} L ${x - 5} ${y - 16} Z`, V3, 2.5) + brilho(x - 5, y - 4, 4, 6, -20, .65);
    pe += tomate(48, -190, '#FF5A4F') + tomate(102, -228, '#FF5A4F') + tomate(56, -264, '#FF7A6B') + tomate(100, -168, '#FFB347') + tomate(46, -108, '#9BD35A');
    s += maior(balanca(pe, 5, 0), 78, -86);
    // cenouras: folhas rendadas e o ombro laranja aparecendo (inteira = com a raiz toda, para pular para fora da terra)
    const cenoura = (x, inteira) => {
      let d = '';
      [[-14, -150, -28], [0, -162, 0], [14, -148, 28]].forEach(([dx, y]) => {
        d += l(`M${x} -100 Q ${x + dx * .3} ${n(-120)} ${x + dx} ${y}`, T, 8) + l(`M${x} -100 Q ${x + dx * .3} ${n(-120)} ${x + dx} ${y}`, V2, 3);
        for (let j = 0; j < 3; j++) d += c(x + dx * (.55 + j * .2) + (j % 2 ? 5 : -5), -112 + (y + 112) * (.45 + j * .25), 7, V1, 3);
      });
      if (inteira) {
        return d + p(`M${x - 16} -92 Q ${x - 16} -106 ${x} -106 Q ${x + 16} -106 ${x + 16} -92 L ${x + 3} -24 Q ${x} -18 ${x - 3} -24 Z`, '#FF9F43', 4) +
          l(`M${x - 8} -86 h 7 M${x + 3} -70 h 7 M${x - 6} -54 h 6 M${x + 1} -40 h 5`, '#E07A1F', 2.5) + brilho(x - 7, -84, 3, 12, 0, .6);
      }
      return d + p(`M${x - 16} -88 Q ${x - 16} -106 ${x} -106 Q ${x + 16} -106 ${x + 16} -88 Z`, '#FF9F43', 4) + l(`M${x - 8} -96 h 6`, '#E07A1F', 2.5) + brilho(x - 6, -99, 5, 2.5, -10, .6);
    };
    const pula = mexe ? `<g style="--h:-104px;animation:qtlPulo .8s cubic-bezier(.35,0,.35,1) .05s both"><g style="transform-box:fill-box;transform-origin:50% 50%;--a:14deg;animation:qtlBalanca .8s ease-in-out .05s both">${cenoura(26, true)}</g></g>` : cenoura(26);
    s += maior(cenoura(-12) + pula, 7, -96);
    // terra
    s += p('M-114 -78 Q -110 -96 -78 -94 Q -50 -102 -20 -94 Q 14 -102 46 -94 Q 84 -102 112 -92 Q 118 -86 114 -78 Z', '#7A5236', 4) +
      [[-90, -86], [-40, -88], [10, -86], [60, -88], [96, -85]].map(([x, y]) => fe(x, y, 7, 3, '#5E3E27')).join('');
    // alfaces
    const alface = x => {
      const fol = [[-30, -96, 24], [30, -96, 24], [-18, -118, 26], [18, -118, 26], [0, -132, 24], [0, -104, 26]];
      return nuvemDeFolhas(fol.map(([dx, y, rr]) => [x + dx, y, rr]), V4, 4) +
        c(x, -116, 18, '#B9EA8E', 3) + fe(x - 4, -120, 7, 5, '#fff', .45) +
        l(`M${x - 32} -90 Q ${x - 26} -108 ${x - 14} -114 M${x + 32} -90 Q ${x + 26} -108 ${x + 14} -114 M${x} -96 V -112`, '#5FAE3E', 3);
    };
    s += maior(balanca(alface(-76), -6, .12), -76, -88);
    // caixa de tábuas
    s += r(-122, -82, 244, 42, MAD, 6, 5) + r(-122, -42, 244, 42, MAD, 6, 5);
    s += fr(-118, -50, 236, 8, tom(MAD, -.15)) + fr(-118, -10, 236, 8, tom(MAD, -.15)) + veio(-112, -78, 200, 28) + veio(-100, -38, 210, 26);
    s += brilho(-60, -74, 40, 4, 0, .45) + brilho(30, -34, 40, 4, 0, .35);
    s += r(-132, -96, 24, 96, MAD2, 6, 5) + r(108, -96, 24, 96, MAD2, 6, 5) + fr(122, -90, 6, 84, tom(MAD2, -.2), 2) + fr(-126, -90, 6, 84, tom(MAD2, -.2), 2);
    s += [[-120, -60], [-120, -20], [120, -60], [120, -20]].map(([x, y]) => c(x, y, 3.5, '#6E6A80', 0)).join('');
    s += tufo(-140, 0, .9, V1) + tufo(140, 0, .8);
    return s;
  }

  /** Varal com roupinhas coloridas presas por prendedores. Postes em x ±190.
      vento: as roupinhas balançam (presas pelo prendedor) e o passarinho do poste dá um pulinho. */
  function varal(vento = false) {
    const Y0 = -335, yAt = x => { const t = (x + 190) / 380; return Y0 + 72 * t * (1 - t); };
    let s = sombra(-190, 0, 34, 7) + sombra(190, 0, 34, 7);
    const poste = x => r(x - 9, -360, 18, 360, MAD2, 6, 5) + fr(x + 2, -354, 5, 350, tom(MAD2, -.2), 2) +
      r(x - 32, -366, 64, 16, MAD, 6, 5) + brilho(x - 3, -300, 2.5, 30, 0, .35) + c(x, -358, 3, MAD3, 0) +
      p(`M${x - 22} 0 Q ${x} -18 ${x + 22} 0 Z`, '#8A6A4E', 4);
    s += poste(-190) + poste(190);
    s += l(`M-190 ${Y0} Q 0 ${Y0 + 72} 190 ${Y0}`, T, 4);
    const prend = (x, cor) => { const y = yAt(x); return r(x - 5, y - 10, 10, 26, cor, 3, 3) + l(`M${x} ${y - 6} v 16`, tom(cor, -.25), 2); };
    // camiseta coral com estrela
    const cam = (x) => {
      const y = yAt(x) + 2, cor = '#FF7A6B';
      return p(`M${x - 22} ${y} L ${x - 48} ${y + 12} L ${x - 40} ${y + 36} L ${x - 28} ${y + 30} L ${x - 28} ${y + 84} L ${x + 28} ${y + 84} L ${x + 28} ${y + 30} L ${x + 40} ${y + 36} L ${x + 48} ${y + 12} L ${x + 22} ${y} Q ${x} ${y + 14} ${x - 22} ${y} Z`, cor, 5) +
        f(`M${x + 14} ${y + 8} L ${x + 28} ${y + 30} L ${x + 28} ${y + 82} L ${x + 14} ${y + 82} Z`, tom(cor, -.15)) +
        p(`M${x} ${y + 34} l 5 10 l 11 1 l -8 7 l 3 11 l -11 -6 l -11 6 l 3 -11 l -8 -7 l 11 -1 Z`, '#FFD23F', 3) +
        l(`M${x - 28} ${y + 74} h 56`, tom(cor, -.2), 3) + brilho(x - 16, y + 22, 4, 12, 10, .45) +
        prend(x - 30, '#2EC4B6') + prend(x + 30, '#FFD23F');
    };
    // shortinho azul
    const short = (x) => {
      const y = yAt(x) + 2, cor = '#4DA3FF';
      return p(`M${x - 28} ${y} L ${x + 28} ${y} L ${x + 32} ${y + 56} L ${x + 6} ${y + 58} L ${x} ${y + 30} L ${x - 6} ${y + 58} L ${x - 32} ${y + 56} Z`, cor, 5) +
        fr(x - 26, y + 3, 52, 9, tom(cor, -.15)) + l(`M${x - 26} ${y + 12} h 52`, T, 3) + l(`M${x + 12} ${y + 20} q 8 6 12 0`, tom(cor, -.25), 3) +
        f(`M${x + 18} ${y + 14} L ${x + 30} ${y + 14} L ${x + 32} ${y + 54} L ${x + 22} ${y + 55} Z`, tom(cor, -.15)) + brilho(x - 18, y + 30, 3, 10, 10, .45) +
        prend(x - 20, '#FF8FC2') + prend(x + 20, '#5CC84A');
    };
    // vestidinho roxo de bolinhas com babado
    const vestido = (x) => {
      const y = yAt(x) + 2, cor = '#9B7BFF';
      let d = p(`M${x - 18} ${y} L ${x - 24} ${y + 26} L ${x - 44} ${y + 92} Q ${x - 33} ${y + 102} ${x - 22} ${y + 94} Q ${x - 11} ${y + 104} ${x} ${y + 94} Q ${x + 11} ${y + 104} ${x + 22} ${y + 94} Q ${x + 33} ${y + 102} ${x + 44} ${y + 92} L ${x + 24} ${y + 26} L ${x + 18} ${y} Q ${x} ${y + 12} ${x - 18} ${y} Z`, cor, 5);
      d += f(`M${x + 12} ${y + 28} L ${x + 24} ${y + 28} L ${x + 42} ${y + 90} L ${x + 28} ${y + 94} Z`, tom(cor, -.15));
      d += l(`M${x - 24} ${y + 26} Q ${x} ${y + 34} ${x + 24} ${y + 26}`, T, 3) + c(x, y + 30, 6, '#FF8FC2', 3);
      [[-12, 46], [8, 52], [-22, 72], [0, 76], [20, 70], [-8, 60], [12, 84], [-26, 86]].forEach(([dx, dy]) => { d += fe(x + dx, y + dy, 3.5, 3.5, '#fff', .9); });
      return d + brilho(x - 14, y + 44, 3, 12, 15, .4) + prend(x - 14, '#FFD23F') + prend(x + 14, '#FF7A6B');
    };
    // meias listradas
    const meia = (x, cor, cor2) => {
      const y = yAt(x) + 2;
      return p(`M${x - 9} ${y} L ${x + 9} ${y} L ${x + 9} ${y + 38} Q ${x + 9} ${y + 46} ${x + 16} ${y + 48} Q ${x + 24} ${y + 52} ${x + 20} ${y + 60} Q ${x + 12} ${y + 64} ${x} ${y + 58} Q ${x - 9} ${y + 54} ${x - 9} ${y + 44} Z`, cor, 4) +
        fr(x - 7, y + 12, 14, 6, cor2) + fr(x - 7, y + 26, 14, 6, cor2) + fe(x + 14, y + 56, 6, 4, cor2) + prend(x, '#9B7BFF');
    };
    // no vento, cada peça balança pendurada no prendedor, cada uma no seu ritmo (e para sozinha, em pé)
    const pano = (d, k) => (vento ? `<g style="transform-box:fill-box;transform-origin:50% 0;--a:${[9, -11, 8, -14, 13][k]}deg;animation:qtlVento ${[.8, .7, .9, .6, .65][k]}s ease-in-out ${k * .08}s ${[3, 3, 2, 4, 3][k]} both">${d}</g>` : d);
    s += pano(cam(-128), 0) + pano(short(-38), 1) + pano(vestido(52), 2) + pano(meia(122, '#FFD23F', '#FF7A6B'), 3) + pano(meia(152, '#FF8FC2', '#FFF4E6'), 4);
    // passarinho amarelo em cima do poste da direita
    const ave = em(196, -366, 1, e(0, -14, 15, 12, '#FFD23F', 4) + c(9, -26, 9, '#FFD23F', 4) + p('M16 -28 L 25 -25 L 16 -22 Z', '#FF9F43', 3) +
      c(11, -28, 2.3, T, 0) + p('M-12 -14 L -24 -20 L -20 -8 Z', '#F2B21B', 3) + p('M-6 -16 q 5 9 12 1', '#F2B21B', 3));
    s += vento ? `<g style="--h:-34px;animation:qtlPulo .5s ease-in-out .25s 2 both">${ave}</g>` : ave;
    return s;
  }

  /** Piscininha de plástico redonda, com água, boia de rosquinha e patinho.
      onda: a água faz ondinhas, a boia balança e o patinho dá um pulinho. */
  function piscininha(onda = false) {
    let s = sombra(0, 0, 150, 13);
    const banda = (y, h, cor) => r(-132, y, 264, h, cor, h / 2, 5) + fe(0, y + h * .72, 112, h * .18, tom(cor, -.15)) + brilho(-70, y + h * .3, 34, 4.5, 0, .45);
    s += banda(-50, 50, '#4DA3FF') + banda(-96, 50, '#FFD23F');
    // estampa de florzinhas na banda amarela
    s += [-80, 0, 80].map(x => flor(x, -64, '#FF8FC2', .7, '#fff')).join('');
    // borda (anel de cima), parede de dentro e água
    s += e(0, -110, 138, 30, '#FF7A6B', 6) + brilho(-80, -126, 30, 5, -6, .55);
    s += e(0, -112, 114, 19, tom('#4DA3FF', .35), 4) + fe(0, -109, 110, 15, AGUA);
    s += l('M-80 -110 q 10 -5 20 0 t 20 0 M10 -104 q 10 -5 20 0 t 20 0 M-30 -117 q 8 -4 16 0', '#E6FAFF', 3) + brilho(-50, -116, 26, 3, 0, .7);
    // ondinhas que abrem na água
    if (onda) s += [0, .35].map(d => `<ellipse cx="-6" cy="-111" rx="70" ry="11" fill="none" stroke="#fff" stroke-width="4" style="transform-box:fill-box;transform-origin:50% 50%;animation:qtlOnda .9s ease-out ${d}s both"/>`).join('');
    const balanca = (d, a, atraso) => (onda ? `<g style="transform-box:fill-box;transform-origin:50% 100%;--a:${a}deg;animation:qtlBalanca 1.1s ease-in-out ${atraso}s both">${d}</g>` : d);
    // boia de rosquinha
    s += balanca(em(42, -114, 1, e(0, 0, 34, 15, '#FF8FC2', 4) + e(0, -3, 13, 5, AGUA, 3) +
      f('M-30 -4 Q -26 -12 -18 -13 L -14 -4 Q -16 4 -24 9 Q -32 6 -30 -4 Z', '#fff') + f('M18 -13 Q 28 -10 31 -2 Q 30 6 22 9 Q 16 2 14 -4 Z', '#fff') +
      brilho(-6, -10, 9, 2.5, 0, .7)), 10, 0) + l('M8 -104 q 34 6 68 0', AGUA, 4) + l('M2 -103 q 6 -3 12 0 M70 -103 q 6 -3 12 0', '#E6FAFF', 2.5);
    // patinho de borracha
    const pato = em(-52, -112, 1, p('M-18 -6 Q -20 -24 -4 -22 Q 10 -22 16 -12 Q 20 -2 8 0 L -14 0 Q -20 -1 -18 -6 Z', '#FFD23F', 4) +
      c(6, -28, 11, '#FFD23F', 4) + p('M15 -29 Q 26 -29 25 -24 Q 22 -21 14 -23 Z', '#FF9F43', 3) + c(8, -31, 2.4, T, 0) + fe(4, -24, 3, 2, '#FF8FC2', .8) +
      l('M-12 -12 q 8 6 16 -2', '#F2B21B', 3) + brilho(0, -32, 3, 2, 0, .8));
    s += (onda ? `<g style="--h:-40px;animation:qtlPulo .6s ease-in-out .1s both">${balanca(pato, -12, .1)}</g>` : pato) + l('M-74 -108 q 22 4 44 0', AGUA, 4);
    // gotinhas espirradas
    s += [[-128, -150, 1], [-108, -168, .8], [118, -152, 1], [134, -134, .8]].map(([x, y, k]) => em(x, y, k, p('M0 -10 Q 7 0 0 6 Q -7 0 0 -10 Z', AGUA, 3))).join('');
    // pitoco da válvula
    s += r(104, -40, 12, 14, tom('#4DA3FF', -.15), 4, 3);
    return s;
  }

  /** Regador verde-água de bolinhas, bico virado para a direita.
      regando: sobe um pouco, inclina para a frente (o bico desce) e volta. */
  function regador(regando = false) {
    const cor = '#2EC4B6';
    const sb = sombra(10, 0, 70, 9);
    let s = '';
    s += tubo('M-22 -74 Q -2 -118 30 -76', cor, 8);
    s += p('M28 -24 L 82 -82 L 92 -72 L 36 -14 Z', cor, 5) + em(90, -82, 1, e(0, 0, 9, 15, tom(cor, .25), 4) + [-6, 0, 6].map(y => c(2, y, 1.6, T, 0)).join(''), 45);
    s += r(-40, -78, 80, 78, cor, 18, 5) + f('M18 -74 H 22 Q 38 -74 38 -58 V -18 Q 38 -2 22 -2 H 18 Z', tom(cor, -.15)) + r(-40, -78, 80, 78, 'none', 18, 5);
    s += e(-6, -78, 22, 6, tom(cor, -.2), 4);
    s += [[-22, -52], [4, -40], [-14, -22], [18, -60], [10, -16]].map(([x, y]) => fe(x, y, 5, 5, '#fff', .85)).join('') + brilho(-26, -60, 4, 12, 0, .5);
    const gotas = [[104, -62], [112, -44], [100, -36]].map(([x, y]) => em(x, y, .8, p('M0 -10 Q 7 0 0 6 Q -7 0 0 -10 Z', AGUA, 3))).join('');
    if (!regando) return sb + s + gotas;
    return sb + `<g transform="translate(40 0)"><g style="--ang:30deg;--sobe:-56px;animation:qtlInclina 1.7s ease-in-out both"><g transform="translate(-40 0)">${s}</g></g></g>`;
  }

  /** castelinho de areia (feito com o baldinho); (0,0) = meio do pé */
  function castelinho() {
    const A1 = '#F2D68A', A2 = '#DDB765';
    const torre = (x, y, w, h) => r(x, y, w, h, A1, 5, 4) + fr(x + w - 8, y + 4, 5, h - 6, A2) +
      [0, 1, 2].map(i => r(x + i * (w - 9) / 2, y - 9, 9, 11, A1, 3, 3)).join('') + l(`M${x + 4} ${y + h * .45} h ${w - 8}`, A2, 2.5);
    let s = sombra(0, 0, 66, 8) + p('M-60 0 Q -58 -12 -46 -14 L 46 -14 Q 58 -12 60 0 Z', A1, 4);
    s += torre(-50, -66, 30, 54) + torre(20, -66, 30, 54) + torre(-17, -96, 34, 84);
    s += p('M-9 -12 V -34 Q 0 -44 9 -34 V -12 Z', '#B08A4A', 3) + l('M0 -96 V -126', T, 3) + p('M0 -126 L 22 -119 L 0 -112 Z', '#FF7A6B', 3);
    s += em(-40, -30, .5, flor(0, 0, '#FF8FC2', 1, '#fff')) + e(34, -6, 7, 5, '#FF8FC2', 3) + brilho(-10, -80, 3, 10, 0, .5);
    return s;
  }

  /** Baldinho amarelo com pazinha.
      cava: a pazinha cava (sobe, vira e volta). castelo: um castelinho de areia ao lado, à direita. */
  function baldinho(cava = false, castelo = false) {
    const cor = '#FFC93C';
    let s = sombra(0, 0, 44, 8);
    const pa = em(14, -70, 1, tubo('M0 0 L 0 -46', MAD, 5) + p('M-12 -46 Q 0 -60 12 -46 L 8 -36 L -8 -36 Z', '#9B7BFF', 3) + p('M-14 0 L 14 0 L 10 22 Q 0 32 -10 22 Z', '#FF7A6B', 4), 18);
    s += cava ? `<g style="transform-box:fill-box;transform-origin:50% 100%;animation:qtlCava .45s ease-in-out 2 both">${pa}</g>` : pa;
    s += p('M-38 -64 L 38 -64 L 30 -4 Q 29 0 24 0 L -24 0 Q -29 0 -30 -4 Z', cor, 5) + f('M18 -60 L 34 -60 L 27 -6 L 14 -6 Z', tom(cor, -.15));
    s += fr(-35, -42, 70, 12, '#FF7A6B') + l('M-35 -42 h 70 M-34 -30 h 68', T, 3) + p('M-38 -64 L 38 -64 L 30 -4 Q 29 0 24 0 L -24 0 Q -29 0 -30 -4 Z', 'none', 5);
    s += r(-42, -70, 84, 10, tom(cor, .2), 5, 4) + l('M-38 -66 Q 0 -112 38 -66', T, 4) + c(-38, -64, 4, '#FF7A6B', 3) + c(38, -64, 4, '#FF7A6B', 3);
    s += brilho(-22, -50, 4, 10, 10, .5);
    return castelo ? s + em(118, 0, 1, castelinho()) : s;
  }

  // ---------------------------------------------------------------- fundo
  function cerca(x0, x1, y) {
    let s = '';
    const topo = y - 160;
    // arbustos atrás da cerca
    const arbustos = [];
    for (let x = x0 + 40, i = 0; x < x1 + 40; x += 110, i++) arbustos.push([x, topo + 20 - (i % 3) * 16, 50 + (i % 2) * 14]);
    s += nuvemDeFolhas(arbustos, '#93D47A', 4);
    arbustos.forEach(([x, yy, rr]) => { s += fe(x - rr * .3, yy - rr * .4, rr * .35, rr * .2, '#B8E6A2') + l(`M${x - 12} ${yy - 4} q 8 8 18 2`, '#7CC163', 3); });
    // travessas
    s += r(x0, topo + 40, x1 - x0, 18, MAD2, 6, 5) + r(x0, topo + 106, x1 - x0, 18, MAD2, 6, 5);
    // ripas de ponta redonda, creme com sombra
    let i = 0;
    for (let x = x0 + 6; x < x1 - 20; x += 44, i++) {
      const h = 140 + (i % 2) * 10, yt = y - h;
      const d = `M${x} ${y} V ${yt + 16} Q ${x} ${yt} ${x + 16} ${yt} Q ${x + 32} ${yt} ${x + 32} ${yt + 16} V ${y} Z`;
      s += p(d, CREME, 4) + fr(x + 22, yt + 10, 8, h - 12, '#EAD8BF') + p(d, 'none', 4) + c(x + 16, y - 111, 2.6, '#9C8E86', 0) + c(x + 16, y - 45, 2.6, '#9C8E86', 0);
    }
    // mourões
    for (const x of [x0 + 16, x0 + 330, x0 + 640, x0 + 900]) s += r(x - 14, y - 180, 28, 180, MAD, 6, 5) + fr(x + 4, y - 174, 6, 170, tom(MAD, -.15)) + p(`M${x - 18} ${y - 180} Q ${x} ${y - 198} ${x + 18} ${y - 180} Z`, MAD2, 5);
    // trepadeira com flores
    const trep = (xa, xb, cor) => {
      let d = `M${xa} ${y - 98}`;
      for (let x = xa; x < xb; x += 60) d += ` q 15 -30 30 0 q 15 30 30 0`;
      let t = l(d, T, 7) + l(d, V3, 3);
      for (let x = xa + 10, k = 0; x < xb; x += 30, k++) {
        t += folha(x, y - 98 + (k % 2 ? 10 : -12), k % 2 ? 60 : -70, 22, k % 3 ? V1 : V4, 3);
        if (k % 3 === 1) t += flor(x + 8, y - 98 + (k % 2 ? -8 : 8), cor, .65);
      }
      return t;
    };
    s += trep(x0 + 20, x0 + 330, '#FF8FC2') + trep(x0 + 760, x0 + 1060, '#9B7BFF');
    return s;
  }

  function canteiroDaCerca(x0, x1, y) {
    let s = '';
    // folhagens e flores no pé da cerca
    for (let x = x0 + 30, i = 0; x < x1; x += 58 + (i % 3) * 22, i++) {
      const k = .8 + ((i * 7) % 5) * .1, h = 40 + ((i * 13) % 5) * 12;
      s += nuvemDeFolhas([[x - 16 * k, y - 16 * k, 20 * k], [x + 14 * k, y - 20 * k, 24 * k], [x, y - 32 * k, 19 * k]], [V1, V2, V4][i % 3], 4);
      const cor = ['#FF7A6B', '#FFD23F', '#FF8FC2', '#9B7BFF', '#4DA3FF', '#FFF4E6'][(i * 2) % 6];
      if (i % 4 !== 3) s += l(`M${x} ${y - 30} Q ${x + (i % 2 ? 6 : -6)} ${y - h * .7} ${x} ${y - h - 30}`, V3, 4) + flor(x, y - h - 34, cor, .7 + (i % 3) * .12);
      if (i % 2 === 0) s += flor(x + 20 * k, y - 40 * k, ['#FFF4E6', '#FFD23F', '#FF8FC2'][i % 3], .5);
      if (i % 5 === 2) s += folha(x - 10, y - 36 * k, -120, 26, V1) + folha(x + 10, y - 40 * k, -60, 24, V2);
    }
    return s;
  }
  /** girassol alto (fundo) */
  function girassol(x, y, h) {
    return tubo(`M${x} ${y} Q ${x - 6} ${y - h / 2} ${x} ${y - h}`, V3, 6) + folha(x, y - h * .45, -30, 40, V1) + folha(x, y - h * .6, 200, 36, V2) +
      Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return em(x + Math.cos(a) * 24, y - h + Math.sin(a) * 24, 1, p('M0 -9 Q 12 0 0 9 Q -12 0 0 -9 Z', '#FFD23F', 3), i * 30 + 90); }).join('') +
      c(x, y - h, 17, MAD3, 4) + [[-6, -4], [5, -6], [0, 5], [7, 4], [-6, 6]].map(([dx, dy]) => fe(x + dx, y - h + dy, 2.5, 2.5, '#5A3A22')).join('') + brilho(x - 8, y - h - 22, 6, 3, -20, .5);
  }

  const pedra = (x, y, rx, ry, cor) => e(x, y, rx, ry, cor, 4) + fe(x + rx * .15, y + ry * .35, rx * .75, ry * .4, tom(cor, -.12)) + brilho(x - rx * .35, y - ry * .3, rx * .3, ry * .22, 0, .6);

  /** degrau da porta da cozinha e caminho de pedrinhas até a mangueira */
  function caminho(x0, y, ate) {
    let s = '';
    // pedras em zigue-zague suave, cada vez um pouquinho menores
    let i = 0;
    for (let x = x0 + 190; x < ate; x += 96, i++) {
      const k = 1 - .15 * (x - x0) / (ate - x0);
      s += pedra(x, y + 30 + (i % 2) * 24 + Math.sin(i * 1.3) * 4, 36 * k + (i % 3) * 3, 13 * k, ['#E3DACB', '#D6CCBA', '#E9E1D4'][i % 3]);
      if (i % 3 === 1) s += pedra(x + 40, y + 70, 9, 4.5, '#D6CCBA');
    }
    return s;
  }
  /** degrau de pedra da porta da cozinha (o piso da cozinha fica 50 px acima do gramado); (0,0) = canto do pé junto à parede */
  function degrau() {
    return r(0, -50, 112, 52, '#D9D2C4', 8, 5) + fr(6, -18, 100, 14, '#C2B9A8', 3) + brilho(36, -40, 26, 3.5, 0, .6) +
      l('M30 -28 l 14 -6 M74 -32 l 10 8', '#B5AB98', 3) + tufo(118, 2, .7, V1);
  }
  /** florzinhas, pedrinhas e tufos espalhados pelo gramado da frente */
  function gramado(x0, x1, y) {
    let s = '';
    const cores = ['#FFF4E6', '#FFD23F', '#FF8FC2', '#FFF4E6', '#9B7BFF'];
    for (let x = x0 + 60, i = 0; x < x1 - 20; x += 137 + (i % 4) * 23, i++) {
      const yy = y + 80 + (i * 37) % 90;
      if (i % 3 === 0) s += tufo(x, yy, .7, i % 2 ? V1 : V2);
      else s += l(`M${x} ${yy + 4} v 14`, V3, 3) + flor(x, yy, cores[i % 5], .55);
      if (i % 7 === 3) s += pedra(x + 50, yy + 14, 10, 5, '#D6CCBA');
    }
    return s;
  }

  // ---------------------------------------------------------------- objetos do catálogo (não montados)
  /** Mesinha redonda de jardim com toalha xadrez, jarra de suco e dois copos.
      goles (0–2): os copos vão esvaziando (cheio, pela metade, vazio). servindo: a jarra inclina sobre os copos. */
  function mesinha(goles = 0, servindo = false) {
    let s = sombra(0, 0, 110, 11);
    s += r(-12, -128, 24, 116, MAD2, 6, 5) + fr(3, -122, 6, 106, tom(MAD2, -.2)) + p('M-52 0 Q -48 -18 -12 -18 L 12 -18 Q 48 -18 52 0 Z', MAD3, 5);
    // tampo e toalha
    s += e(0, -152, 116, 13, CREME, 5);
    let d = 'M-116 -152 Q 0 -138 116 -152 L 120 -106';
    for (let i = 0; i < 8; i++) { const xa = 120 - i * 30; d += ` Q ${xa - 15} ${i % 2 ? -92 : -96} ${xa - 30} -106`; }
    d += ' Z';
    s += p(d, CREME, 5);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++) if ((row + col) % 2 === 0) s += fr(-116 + col * 29.5, -144 + row * 13, 29.5, 13, '#FF7A6B', 0, .8);
    s += f('M60 -146 Q 100 -150 116 -152 L 120 -106 Q 105 -96 90 -106 Q 75 -92 60 -106 Z', tom(CREME, -.12), .5) + p(d, 'none', 5);
    // jarra de suco
    const jarra = em(-52, -156, 1, tubo('M26 -78 Q 46 -70 40 -40 Q 36 -26 24 -24', CREME, 6) +
      p('M-26 -88 L 22 -88 L 28 -10 Q 28 0 18 0 L -18 0 Q -28 0 -28 -10 Z', '#E9F8FF', 5) +
      f('M-25 -60 L 25 -60 L 27 -10 Q 27 -3 18 -3 L -18 -3 Q -27 -3 -27 -10 Z', '#FFD23F') +
      fr(-14, -56, 14, 14, '#fff', 3, .7) + fr(4, -50, 12, 12, '#fff', 3, .7) + l('M-25 -60 H 25', '#F2B21B', 3) +
      p('M-26 -88 L 22 -88 L 28 -10 Q 28 0 18 0 L -18 0 Q -28 0 -28 -10 Z', 'none', 5) + p('M-30 -88 L -38 -98 L -18 -92 Z', '#E9F8FF', 4) +
      c(16, -88, 13, '#FFE27A', 4) + l('M16 -96 V -80 M9 -92 L 23 -84 M9 -84 L 23 -92', '#F2B21B', 2) + brilho(-14, -40, 4, 18, 0, .6));
    // servindo: a jarra sobe um pouco e inclina para os copos (apoiada no canto de baixo, à direita)
    s += servindo ? `<g transform="translate(-24 -156)"><g style="--ang:34deg;--sobe:-30px;animation:qtlInclina 1.2s ease-in-out both"><g transform="translate(24 156)">${jarra}</g></g></g>` : jarra;
    // copos com canudinho (o suco baixa a cada gole)
    const suco = ['M-14 -36 L 14 -36 L 12 -4 L -12 -4 Z', 'M-13 -20 L 13 -20 L 12 -4 L -12 -4 Z', ''][Math.min(2, goles)];
    const copo = (x, cor) => em(x, -156, 1, l('M4 -54 L 14 -78 L 24 -78', '#FF8FC2', 5) +
      p('M-16 -52 L 16 -52 L 12 -4 Q 11 0 6 0 L -6 0 Q -11 0 -12 -4 Z', '#E9F8FF', 4) + (suco ? f(suco, cor) : '') +
      p('M-16 -52 L 16 -52 L 12 -4 Q 11 0 6 0 L -6 0 Q -11 0 -12 -4 Z', 'none', 4) + brilho(-7, -26, 2.5, 10, 0, .7));
    s += copo(22, '#FFD23F') + copo(70, '#FF8FC2');
    return s;
  }

  /** Banco de jardim de ripas, com pés pintados de verde-água. */
  function banco() {
    const cor = '#2EC4B6';
    let s = sombra(0, 0, 124, 11);
    s += r(-96, -222, 18, 222, cor, 7, 5) + r(78, -222, 18, 222, cor, 7, 5) + fr(-84, -214, 5, 210, tom(cor, -.18)) + fr(90, -214, 5, 210, tom(cor, -.18));
    s += c(-87, -226, 11, cor, 5) + c(87, -226, 11, cor, 5) + brilho(-90, -230, 4, 3, 0, .6) + brilho(84, -230, 4, 3, 0, .6);
    [-206, -166].forEach(y => { s += r(-108, y, 216, 30, MAD, 8, 5) + fr(-102, y + 21, 204, 7, tom(MAD, -.15), 3) + veio(-100, y + 2, 190, 22) + brilho(-50, y + 8, 30, 3.5, 0, .45); });
    s += r(-120, -110, 240, 28, MAD, 8, 5) + fr(-114, -90, 228, 8, tom(MAD, -.15), 3) + veio(-112, -108, 220, 20) + brilho(-60, -102, 36, 3.5, 0, .5);
    s += r(-104, -84, 18, 84, cor, 7, 5) + r(86, -84, 18, 84, cor, 7, 5) + fr(-92, -78, 5, 74, tom(cor, -.18)) + fr(98, -78, 5, 74, tom(cor, -.18));
    s += l('M-96 -40 H 96', T, 10) + l('M-96 -40 H 96', cor, 4);
    s += [-150, -190].map(y => c(-87, y, 3, '#6E6A80', 0) + c(87, y, 3, '#6E6A80', 0)).join('') + flor(-60, -191, '#FF8FC2', .55) + flor(60, -151, '#FFD23F', .55);
    return s;
  }

  /** Carrinho de mão virado canteiro, cheio de flores.
      brisa: as flores balançam (presas na terra da caçamba). */
  function carrinhoDeFlores(brisa = false) {
    let s = sombra(0, 0, 140, 11);
    s += tubo('M-58 -66 L -164 -116', MAD2, 9) + c(-166, -117, 7, MAD2, 4) + tubo('M-50 -50 L -60 -2', '#7C8BA6', 7) + r(-74, -8, 28, 10, '#7C8BA6', 4, 4);
    // folhas e flores saindo da terra
    const ponto = [[-70, -150], [-40, -176], [-10, -160], [22, -184], [52, -158], [-56, -196], [36, -210]];
    const sb = s;
    s = '';
    ponto.forEach(([x, y], i) => { s += l(`M${x * .8} -118 Q ${x} ${(y - 118) / 2} ${x} ${y}`, V3, 4); });
    s += nuvemDeFolhas([[-80, -126, 24], [-46, -132, 28], [-10, -128, 26], [26, -134, 28], [58, -126, 22]], V1, 4);
    s += folha(-80, -134, -150, 34, V2) + folha(60, -136, -30, 34, V2) + folha(-20, -150, -100, 30, V4) + folha(14, -146, -70, 30, V4);
    const tulipa = (x, y, cor) => p(`M${x - 13} ${y - 18} L ${x - 6} ${y - 8} L ${x} ${y - 20} L ${x + 6} ${y - 8} L ${x + 13} ${y - 18} Q ${x + 16} ${y + 8} ${x} ${y + 10} Q ${x - 16} ${y + 8} ${x - 13} ${y - 18} Z`, cor, 3.5) + f(`M${x + 2} ${y - 6} L ${x + 6} ${y - 8} L ${x + 12} ${y - 14} Q ${x + 13} ${y + 6} ${x + 2} ${y + 8} Z`, tom(cor, -.15)) + brilho(x - 6, y - 4, 2.5, 6, 0, .5);
    ponto.forEach(([x, y], i) => { s += i % 2 ? tulipa(x, y, ['#FF7A6B', '#9B7BFF', '#FF8FC2'][i % 3]) : flor(x, y, ['#FFD23F', '#FFF4E6', '#4DA3FF', '#FF8FC2'][i % 4], 1); });
    s = sb + (brisa ? `<g style="transform-box:fill-box;transform-origin:50% 100%;--a:6deg;animation:qtlBalanca 1.3s ease-in-out both">${s}</g>` : s);
    // caçamba
    const cac = 'M-104 -120 L 92 -120 L 64 -50 Q 60 -42 50 -42 L -70 -42 Q -80 -42 -84 -50 Z';
    s += p(cac, '#FF7A6B', 5) + f('M40 -116 L 88 -116 L 62 -50 Q 58 -46 50 -46 L 30 -46 Z', tom('#FF7A6B', -.15)) + p(cac, 'none', 5);
    s += r(-112, -128, 212, 16, tom('#FF7A6B', .25), 8, 5) + brilho(-50, -100, 30, 5, -4, .45) + [-60, -10, 40].map(x => fe(x, -80, 7, 7, '#fff', .55)).join('');
    // roda
    s += tubo('M40 -50 L 74 -30', '#7C8BA6', 7) + c(76, -32, 32, '#4A4060', 5) + c(76, -32, 16, '#FFD23F', 4) + c(76, -32, 4, T, 0) + brilho(66, -48, 8, 4, -30, .4);
    return s;
  }

  // ---------------------------------------------------------------- o que cada coisa faz no modo brincar
  // Movimentos que as classes casa-* não têm (inclinar e voltar, pular alto, ir e voltar, jogar longe). Só os <g> que
  // pedem estas animações se mexem, e todas param sozinhas (exceto as asas, que só existem durante o voo).
  if (typeof document !== 'undefined' && !document.querySelector('style[data-casa-quintal]')) {
    const st = document.createElement('style');
    st.setAttribute('data-casa-quintal', '');
    st.textContent = `
      @keyframes qtlInclina { 0%, 100% { transform: none; } 25%, 72% { transform: translateY(var(--sobe, 0px)) rotate(var(--ang, 30deg)); } }
      @keyframes qtlPulo { 0%, 100% { transform: none; } 45% { transform: translateY(var(--h, -60px)); } }
      @keyframes qtlPasseio { 0%, 100% { transform: none; } 30%, 68% { transform: translate(var(--dx), var(--dy)); } }
      @keyframes qtlVira { 0%, 68% { transform: none; } 70%, 98% { transform: scaleX(-1); } 100% { transform: none; } }
      @keyframes qtlBalanca { 0%, 100% { transform: none; } 22% { transform: rotate(var(--a, 6deg)); } 52% { transform: rotate(calc(var(--a, 6deg) * -.7)); } 78% { transform: rotate(calc(var(--a, 6deg) * .3)); } }
      @keyframes qtlVento { 0%, 100% { transform: none; } 30% { transform: rotate(var(--a, 8deg)); } 70% { transform: rotate(calc(var(--a, 8deg) * -.75)); } }
      @keyframes qtlCava { 0%, 100% { transform: none; } 40% { transform: translate(-6px, -30px) rotate(-26deg); } 70% { transform: translate(4px, -10px) rotate(12deg); } }
      @keyframes qtlJoga { 0% { transform: none; opacity: 0; } 10% { opacity: 1; } 45% { transform: translate(calc(var(--dx) * .5), var(--up)) rotate(calc(var(--gira, 90deg) * .5)); }
        80% { opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) rotate(var(--gira, 90deg)); opacity: 0; } }
      @keyframes qtlVai { 0% { transform: none; opacity: 0; } 12%, 70% { opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)); opacity: 0; } }
      @keyframes qtlAsa { to { transform: scaleY(.3); } }
      @keyframes qtlAsaX { to { transform: scaleX(.3); } }
      @keyframes qtlOnda { 0% { transform: scale(.25); opacity: .95; } 100% { transform: scale(1.2); opacity: 0; } }`;
    document.head.appendChild(st);
  }

  /** Mexidas curtas: ficam fora do estado guardado (não voltam ao abrir a casa de novo). estado -> { nome } */
  const curtas = new WeakMap();
  const agora = (est, nome) => !!est && (curtas.get(est) || {}).nome === nome;
  /** liga a mexida "nome" por ms e redesenha; no fim, roda fim() (se houver) e redesenha parado */
  function mexida(ctx, nome, ms, fim) {
    const marca = { nome };
    curtas.set(ctx.estado, marca);
    ctx.mudou();
    ctx.depois(ms, () => {
      if (curtas.get(ctx.estado) !== marca) return;    // tocou de novo: a mexida nova cuida do fim
      curtas.delete(ctx.estado);
      if (fim) fim();
      ctx.mudou();
    });
  }
  const sorteio = a => a[Math.floor(Math.random() * a.length)];
  const aleat = (a, b) => a + Math.random() * (b - a);
  /** coisinhas jogadas para longe (areia, pétalas): cada uma faz um arco e some. pecas = [[desenho, x, y], ...] */
  function joga(pecas, op) {
    return pecas.map(([d, x, y], k) => `<g transform="translate(${n(x)} ${n(y)})"><g style="--dx:${n(aleat(op.dx[0], op.dx[1]))}px;--up:${n(aleat(op.up[0], op.up[1]))}px;--dy:${n(aleat(op.dy[0], op.dy[1]))}px;--gira:${Math.round(aleat(-220, 220))}deg;animation:qtlJoga ${op.ms}s ${op.ease || 'ease-out'} ${n(k * (op.passo || .05))}s both">${d}</g></g>`).join('');
  }
  const graoDeAreia = () => c(0, 0, aleat(5, 8), sorteio(['#F2D68A', '#E8C878', '#DDB765']), 3);
  const petala = () => em(0, 0, 1, p('M0 -14 Q 12 -3 0 14 Q -12 -3 0 -14 Z', sorteio(['#FF8FC2', '#FF7A6B', '#9B7BFF', '#FFD23F', '#FFF4E6']), 3), Math.round(aleat(0, 180)));
  /** borboletinha (asas batendo) */
  function borboleta(cor) {
    const asa = lado => `<g style="transform-box:fill-box;transform-origin:${lado < 0 ? '100%' : '0%'} 50%;animation:qtlAsaX .16s linear infinite alternate">` +
      p(`M0 -2 Q ${lado * 22} -26 ${lado * 24} -6 Q ${lado * 22} 4 0 2 Z`, cor, 3) + p(`M0 2 Q ${lado * 18} 6 ${lado * 14} 18 Q ${lado * 4} 18 0 4 Z`, tom(cor, -.12), 3) + '</g>';
    return asa(-1) + asa(1) + e(0, 0, 4, 12, T, 0) + l('M-1 -11 q -4 -10 -9 -12 M1 -11 q 4 -10 9 -12', T, 2.5);
  }

  const ACOES = {
    // varal: bate um vento, as roupinhas balançam e o passarinho do poste pula
    varal: {
      desenho: est => (agora(est, 'vento') ? varal(true) : CASA.desenho('varal')),
      tocar(ctx) {
        mexida(ctx, 'vento', 2800);
        ctx.som('pagina');
        ctx.particulas('vento', -250, -300, 4, { dx: 380, dy: -10, espalha: 50, ms: 1300, seguidas: 170 });
        ctx.depois(400, () => ctx.som('piu'));
      },
    },
    // casinha de passarinho: o passarinho sai, canta lá no alto e volta para o poleiro
    casinhaPassarinho: {
      desenho: est => (agora(est, 'passeio') ? casinhaPassarinho(true) : CASA.desenho('casinhaPassarinho')),
      tocar(ctx) {
        if (agora(ctx.estado, 'passeio')) { ctx.som('piu'); ctx.particulas('nota', 180, -60, 2, { dy: -80, espalha: 40 }); return; }
        mexida(ctx, 'passeio', 2700);
        ctx.som('piu');
        ctx.depois(900, () => { ctx.som('piu'); ctx.particulas('nota', 190, -66, 3, { dy: -90, espalha: 50, seguidas: 220, ms: 1100 }); });
        ctx.depois(1350, () => ctx.som('piu'));
      },
    },
    // hortinha: as folhas balançam e uma cenoura pula para fora da terra e volta (regada, ela cresce: ver o regador)
    hortinha: {
      desenho: est => (agora(est, 'mexe') || (est && est.cresce) ? hortinha((est && est.cresce) || 0, agora(est, 'mexe')) : CASA.desenho('hortinha')),
      tocar(ctx) {
        mexida(ctx, 'mexe', 950);
        ctx.som('pulo');
        ctx.particulas('folha', 20, -150, 2, { dy: -90, espalha: 60 });
      },
    },
    // piscininha: tibum! espirra água, a boia balança e o patinho pula
    piscininha: {
      desenho: est => (agora(est, 'onda') ? piscininha(true) : CASA.desenho('piscininha')),
      tocar(ctx) {
        mexida(ctx, 'onda', 1300);
        ctx.som('bolha');
        ctx.particulas('gota', -10, -120, 6, { dy: -150, espalha: 110, cai: true, ms: 900 });
      },
    },
    // regador: inclina, caem gotinhas e, se a hortinha estiver perto, ela cresce um pouquinho (até 3 vezes)
    regador: {
      desenho: est => (agora(est, 'rega') ? regador(true) : CASA.desenho('regador')),
      tocar(ctx) {
        if (agora(ctx.estado, 'rega')) return;          // ainda regando
        mexida(ctx, 'rega', 1800);
        ctx.som('bolha');
        ctx.depois(420, () => ctx.particulas('gota', 128, -92, 6, { dx: 30, dy: 70, espalha: 22, cai: true, seguidas: 110, ms: 800 }));
        ctx.depois(800, () => ctx.som('bolha'));
        const horta = ctx.perto(420).find(o => o.id === 'hortinha');
        const flores = ctx.perto(380).find(o => o.id === 'carrinhoDeFlores');
        if (horta) {
          ctx.depois(1300, () => {
            const h = horta.contexto();
            if ((h.estado.cresce || 0) < 3) {
              h.estado.cresce = (h.estado.cresce || 0) + 1;
              h.mudou(); h.pular(); h.som('acerto');
              h.particulas('estrela', 0, -200, 4, { dy: -100, espalha: 90 });
              ctx.diz(sorteio(['Plantinha gosta de água!', 'Olha, cresceu!', 'Cresceu um pouquinho!']));
            } else {
              h.pular(); h.particulas('folha', 0, -200, 3, { dy: -100, espalha: 80 }); h.som('pulo');
            }
          });
        } else if (flores) {
          ctx.depois(1300, () => { const fl = flores.contexto(); fl.pular(); fl.particulas('estrela', 0, -190, 3, { dy: -90, espalha: 70 }); });
        }
      },
    },
    // baldinho: a pazinha cava, voa areia e aparece um castelinho de areia ao lado; tocar de novo desmancha o castelo
    baldinho: {
      desenho: est => {
        const cava = agora(est, 'cava'), castelo = !!(est && est.castelo);
        return cava || castelo ? baldinho(cava, castelo) : CASA.desenho('baldinho');
      },
      tocar(ctx) {
        const est = ctx.estado;
        if (est.castelo) {
          est.castelo = false;
          ctx.mudou();
          ctx.som('soltar');
          ctx.mostrar(joga(Array.from({ length: 8 }, (_, k) => [graoDeAreia(), 118 + (k - 3.5) * 14, -40 - (k % 3) * 22]),
            { dx: [-90, 90], up: [-90, -40], dy: [30, 50], ms: .8, passo: .02 }), 1000);
          return;
        }
        if (agora(est, 'cava')) return;
        mexida(ctx, 'cava', 950, () => { est.castelo = true; });
        ctx.som('pegar');
        ctx.mostrar(joga(Array.from({ length: 7 }, () => [graoDeAreia(), aleat(-20, 20), -70]),
          { dx: [-40, 150], up: [-150, -90], dy: [20, 66], ms: .75, passo: .06 }), 950);
        ctx.depois(960, () => { ctx.som('encaixar'); ctx.particulas('estrela', 118, -110, 3, { dy: -80, espalha: 60 }); });
      },
    },
    // mesinha: glub-glub, cada toque é um gole (o suco dos copos baixa); com os copos vazios, a jarra serve de novo
    mesinha: {
      desenho: est => {
        const goles = (est && est.goles) || 0, servindo = agora(est, 'serve');
        return goles || servindo ? mesinha(goles, servindo) : CASA.desenho('mesinha');
      },
      tocar(ctx) {
        const est = ctx.estado;
        if (agora(est, 'serve')) return;
        if ((est.goles || 0) < 2) {
          est.goles = (est.goles || 0) + 1;
          ctx.mudou();
          ctx.som('bolha');
          ctx.particulas('bolha', 36, -236, 2, { dy: -70, espalha: 20 });
          ctx.particulas('bolha', 84, -236, 2, { dy: -70, espalha: 20 });
          return;
        }
        mexida(ctx, 'serve', 1250, () => { est.goles = 0; });
        ctx.som('bolha');
        ctx.depois(1260, () => { ctx.som('encaixar'); ctx.particulas('estrela', 50, -230, 3, { dy: -80, espalha: 60 }); });
      },
    },
    // banco: pulinho, e uma borboletinha que estava ali sai voando
    banco: {
      tocar(ctx) {
        ctx.pular();
        ctx.som('pulo');
        const lado = Math.random() < .5 ? -1 : 1;
        ctx.mostrar(`<g transform="translate(${lado * 50} -128)"><g style="--dx:${lado * 190}px;--dy:-260px;animation:qtlVai 1.5s ease-in both">` +
          `<g class="casa-balanca" style="animation-duration:.4s">${em(0, 0, 1.7, borboleta(sorteio(['#FF8FC2', '#9B7BFF', '#FFD23F', '#4DA3FF', '#FF9F43'])))}</g></g></g>`, 1550);
      },
    },
    // carrinho de flores: as flores balançam e voam pétalas coloridas
    carrinhoDeFlores: {
      desenho: est => (agora(est, 'brisa') ? carrinhoDeFlores(true) : CASA.desenho('carrinhoDeFlores')),
      tocar(ctx) {
        mexida(ctx, 'brisa', 1350);
        ctx.som('pagina');
        ctx.mostrar(joga(Array.from({ length: 7 }, (_, k) => [petala(), -70 + k * 20, -170 - (k % 3) * 14]),
          { dx: [60, 200], up: [-170, -110], dy: [-80, 10], ms: 1.3, passo: .07 }), 1340);
      },
    },
  };

  // ---------------------------------------------------------------- luz: o poste de jardim (acende sozinho à noite)
  /** Poste de jardim de ferro com lanterna de vidro, telhadinho e um passarinho de enfeite; (0,0) = o pé no chão. */
  function posteDeJardim(aceso) {
    const FERRO = '#5A4A78', FERRO_L = '#7C6E96', VIDRO = aceso ? '#FFF3B8' : '#E1E6F0', VIDRO_S = aceso ? '#FFE07A' : '#C9D0E0',
      LAMP = aceso ? '#FFFDF0' : '#D3D8E6';
    let s = sombra(4, 2, 44, 8);
    // base de pedra e o poste
    s += r(-28, -34, 56, 36, '#D9D2C4', 10, 5) + fr(-20, -12, 40, 8, '#C2B9A8', 3) + brilho(-8, -26, 12, 3, 0, .6);
    s += r(-10, -330, 20, 300, FERRO, 6, 5) + fr(-5, -322, 5, 284, FERRO_L, 2, .8) + r(-18, -60, 36, 26, FERRO, 6, 5);
    // anel e os arabescos que seguram a lanterna (um caminho só)
    const curvas = 'M-8 -300 Q -40 -300 -40 -326 Q -40 -342 -26 -340 M8 -300 Q 40 -300 40 -326 Q 40 -342 26 -340';
    s += l(curvas, T, 11) + l(curvas, FERRO_L, 5) + r(-16, -306, 32, 12, FERRO, 5, 4);
    // a lanterna: base, vidro com a lâmpada, as grades e o telhadinho
    s += r(-34, -346, 68, 14, FERRO, 5, 5);
    s += p('M-30 -344 L -36 -432 L 36 -432 L 30 -344 Z', VIDRO, 5);
    s += f('M12 -344 L 14 -430 L 34 -430 L 28 -344 Z', VIDRO_S, .9);
    s += e(0, -386, 13, 20, LAMP, 4) + brilho(-4, -394, 4, 8, 0, .8) + r(-6, -364, 12, 12, FERRO_L, 3, 3);
    s += l('M-12 -344 L -14 -432 M12 -344 L 14 -432', T, 4) + brilho(-24, -410, 3, 14, 4, .6);
    s += p('M-48 -428 L 48 -428 Q 30 -448 0 -476 Q -30 -448 -48 -428 Z', FERRO, 5) + l('M-30 -440 Q -12 -456 -4 -466', FERRO_L, 3);
    s += c(0, -482, 8, '#FFD23F', 4);
    // passarinho pousado no telhadinho
    s += em(26, -446, .55, e(0, -26, 30, 24, '#FF7A6B', 5) + c(22, -50, 17, '#FF7A6B', 5) + p('M36 -52 L 54 -46 L 36 -40 Z', '#FFC93C', 4) + c(26, -54, 3.5, T, 0) +
      p('M-18 -30 Q -4 -40 10 -26 Q -4 -14 -18 -30 Z', tom('#FF7A6B', -.16), 4) + l('M-6 -2 v 8 M6 -2 v 8', '#FF9F43', 4));
    // florzinhas e tufos no pé
    s += tufo(-34, 2, .8, V1) + tufo(36, 2, .7, V2) + l('M-46 0 v -18 M44 0 v -14', V3, 3) + flor(-46, -22, '#FF8FC2', .55) + flor(44, -18, '#9B7BFF', .5);
    return s;
  }

  CASA.partes.quintal = {
    // sem janelas nem interruptor: o poste perto da porta dos fundos acende sozinho à noite
    luz: { janelas: [], interruptor: null, lustre: { x: 7700, y: CASA.CHAO, lampada: [0, -388], desenho: aceso => posteDeJardim(aceso) } },
    fundo(L) {
      const y = L.piso, fx0 = L.x1 - 1000;
      // cerca do fim do quintal (o resto fica aberto: gramado livre para as coisas da criança)
      return cerca(fx0, L.x1 + 10, y) + canteiroDaCerca(fx0, L.x1 - 40, y) +
        girassol(fx0 + 40, y, 240) + girassol(fx0 + 86, y, 196) + girassol(L.x1 - 160, y, 260) +
        caminho(L.x0, y, L.x0 + 1250) + gramado(L.x0 + 100, L.x1, y);
    },
    // o que não se mexe: a mangueira com o balanço e o degrau da porta (o varal é um item: ver casa/itens.js)
    fixos(L) {
      const y = L.piso, x0 = L.x0;
      return em(x0 + 900, y, 1, mangueira()) + em(x0 + 1100, y, 1, balanco());   // (o patamar e o degrau da porta são da casa: base.js)
    },
    catalogo: { mangueira, balanco, varal, casinhaPassarinho, hortinha, piscininha, regador, baldinho, mesinha, banco, carrinhoDeFlores },
    acoes: ACOES,
  };
})();
