/* Casa da Pipoca (esboço de proposta) — estrutura comum: medidas, ajudantes de desenho e a montagem.
   Cada parte (quarto, banheiro, sala, cozinha, quintal) mora num arquivo próprio e se registra em CASA.partes:
     CASA.partes.quarto = { fundo(L) -> svg, objetos(L) -> svg }
   fundo: paredes, papel de parede, rodapé, piso, janelas e portas fixas. objetos: móveis, brinquedos e enfeites.
   L = as medidas da parte (CASA.L.quarto etc.). Tudo em coordenadas do MUNDO (px), nunca transform no grupo inteiro.
   Cada objeto deve ser uma função própria (desenhada em volta de (0,0) = o meio do pé no chão), para virar
   figurinha arrastável depois. */
(function () {
  'use strict';
  const T = '#3A2A5A';
  const CASA = window.CASA = { T, partes: {} };

  // ---------------------------------------------------------------- medidas do mundo
  // O mundo é contínuo: quintal da frente (esquerda) | casa de dois andares | quintal dos fundos (direita).
  CASA.W = 10800; CASA.H = 2140;
  CASA.TOPO = -760;                       // o mundo começa acima de y = 0: espaço para o telhado alto (cortado lá em cima)
  CASA.CHAO = 1960;                       // o gramado lá fora (o piso do térreo fica no mesmo nível)
  const CIMA = { topo: 210, piso: 1010 };  // piso = linha onde os pés pisam
  const BAIXO = { topo: 1110, piso: 1910 };
  CASA.CIMA = CIMA; CASA.BAIXO = BAIXO;
  CASA.CASA0 = 600; CASA.CASA1 = 7200;    // paredes de fora da casa
  CASA.ESCADA = { x0: 3560, x1: 4140 };   // a escada sobe da sala (térreo) para o quarto (buraco na laje nesse trecho)
  /* Tomadas (de verdade: os aparelhos elétricos só funcionam com o plugue numa delas). Centro da tomada no mundo.
     Ficam baixas na parede, acima do rodapé; a do quintal fica num postinho. Desenhadas por tomadas(), no cenário. */
  CASA.TOMADAS = [
    // quarto
    { x: 1290, y: CIMA.piso - 118 }, { x: 2330, y: CIMA.piso - 118 }, { x: 3260, y: CIMA.piso - 118 },
    // banheiro
    { x: 5170, y: CIMA.piso - 118 }, { x: 6050, y: CIMA.piso - 118 }, { x: 6700, y: CIMA.piso - 118 },
    // sala
    { x: 1180, y: BAIXO.piso - 118 }, { x: 2060, y: BAIXO.piso - 118 }, { x: 3000, y: BAIXO.piso - 118 },
    // cozinha
    { x: 5120, y: BAIXO.piso - 118 }, { x: 5820, y: BAIXO.piso - 118 }, { x: 6620, y: BAIXO.piso - 118 },
    // quintal (num postinho, perto da porta dos fundos)
    { x: 7560, y: CASA.CHAO - 150, poste: true },
  ];
  // cada parte: x0..x1 (do lado de dentro das paredes), topo e piso. A faixa do chão vai de piso-40 a piso+40.
  CASA.L = {
    quarto: { x0: 622, x1: 4478, topo: CIMA.topo, piso: CIMA.piso, evitar: [[3500, 4180, 'buraco da escada e corrimão: nada no chão aqui']] },
    banheiro: { x0: 4522, x1: 7178, topo: CIMA.topo, piso: CIMA.piso, evitar: [] },
    sala: { x0: 622, x1: 4228, topo: BAIXO.topo, piso: BAIXO.piso, evitar: [[3500, 4228, 'a escada: nada aqui']] },
    cozinha: { x0: 4272, x1: 7178, topo: BAIXO.topo, piso: BAIXO.piso, evitar: [[7090, 7178, 'a porta dos fundos (para o quintal) fica na parede da direita']] },
    quintal: { x0: 7200, x1: 10800, topo: 0, piso: CASA.CHAO, evitar: [] },
  };

  // ---------------------------------------------------------------- ajudantes (todos com contorno T)
  const n = v => String(Math.round(v * 10) / 10);
  CASA.n = n;
  CASA.r = (x, y, w, h, cor, rx = 10, sw = 5) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${rx}" fill="${cor}" stroke="${T}" stroke-width="${sw}"/>`;
  CASA.c = (x, y, r, cor, sw = 5) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${cor}" stroke="${T}" stroke-width="${sw}"/>`;
  CASA.e = (x, y, rx, ry, cor, sw = 5) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${cor}" stroke="${T}" stroke-width="${sw}"/>`;
  CASA.p = (d, cor, sw = 5) => `<path d="${d}" fill="${cor}" stroke="${T}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  CASA.l = (d, cor = T, sw = 5) => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  /** sem contorno (sombras, brilhos, estampas) */
  CASA.f = (d, cor, op = 1) => `<path d="${d}" fill="${cor}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
  CASA.fr = (x, y, w, h, cor, rx = 0, op = 1) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${rx}" fill="${cor}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
  CASA.fe = (x, y, rx, ry, cor, op = 1) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${cor}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
  /** brilho branco suave (um risco ou elipse) */
  CASA.brilho = (x, y, rx, ry, rot = -20, op = .35) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${n(x)} ${n(y)})"/>`;
  /** sombra no chão debaixo de um objeto */
  CASA.sombra = (x, y, rx, ry = 10) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${ry}" fill="${T}" opacity=".14"/>`;
  /** tom mais escuro (-) ou mais claro (+) de uma cor #RRGGBB */
  CASA.tom = (hex, f) => {
    const v = parseInt(hex.slice(1), 16), c = [v >> 16, (v >> 8) & 255, v & 255].map(x => Math.round(f < 0 ? x * (1 + f) : x + (255 - x) * f));
    return '#' + c.map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
  };
  CASA.em = (x, y, s, conteudo, rot = 0) => `<g transform="translate(${n(x)} ${n(y)})${rot ? ` rotate(${rot})` : ''}${s !== 1 ? ` scale(${s})` : ''}">${conteudo}</g>`;

  // ---------------------------------------------------------------- estrutura (céu, chão, telhado, paredes, laje, escada)
  const { r, c, e, p, l, f, fr, fe, brilho, tom, em } = CASA;
  function ceu() {
    let s = `<defs><linearGradient id="casaCeu" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#7CC8FF"/><stop offset=".75" stop-color="#D6F1FF"/></linearGradient></defs>`;
    s += `<rect y="${CASA.TOPO}" width="${CASA.W}" height="${CASA.H - CASA.TOPO}" fill="url(#casaCeu)"/>`;
    // morros ao longe
    let morros = `M-50 ${CASA.CHAO - 60}`;
    for (let x = 0; x < CASA.W + 600; x += 1300) morros += ` Q ${x + 650} ${CASA.CHAO - 380 - (x % 3) * 30} ${x + 1300} ${CASA.CHAO - 130}`;
    s += f(morros + ` V ${CASA.H} H -50 Z`, '#A8DDB5');
    // nuvens
    const nuvem = (x, y, k) => em(x, y, k, p('M-90 20 Q -110 -20 -60 -26 Q -50 -70 0 -62 Q 40 -90 74 -50 Q 120 -54 112 -8 Q 130 20 96 26 Z', '#fff', 5) + f('M-80 18 Q 0 30 96 22 Q 60 34 -60 32 Z', '#D6ECFA'));
    s += nuvem(160, 140, 1.1) + nuvem(7700, 160, 1.3) + nuvem(8700, 380, .9) + nuvem(9900, 200, 1.1) + nuvem(10500, 520, .7);
    // (o sol e a lua não entram no cenário: ficam vivos por cima, na tela da casa — CASA.SOL)
    // gramado
    s += f(`M-20 ${CASA.CHAO} H ${CASA.W + 20} V ${CASA.H + 20} H -20 Z`, '#7CCB5E') + l(`M-20 ${CASA.CHAO} H ${CASA.W + 20}`, T, 6);
    s += f(`M-20 ${CASA.CHAO + 30} H ${CASA.W + 20} V ${CASA.H + 20} H -20 Z`, '#6CBB50');
    for (let x = 20; x < CASA.W; x += 97) s += l(`M${x} ${CASA.CHAO + 70 + (x % 3) * 18} q 5 -14 10 0 q 5 -18 10 0`, '#4FA23A', 4);
    return s;
  }
  function quintalDaFrente() {
    // calçada, caixa de correio e um ipê-amarelo
    let s = r(-20, CASA.CHAO - 8, 630, 26, '#E3DACB', 6, 5);
    const ipe = em(250, CASA.CHAO, 1.3, p('M-18 0 C -14 -80 -22 -150 -8 -230 L 10 -230 C 16 -160 14 -80 20 0 Z', '#8A5A34', 5) +
      l('M-4 -150 Q -40 -190 -70 -200 M6 -190 Q 40 -230 74 -236', '#8A5A34', 9) +
      [[-80, -250, 62], [0, -300, 76], [76, -262, 62], [-40, -320, 52], [50, -340, 50], [-100, -300, 40], [100, -310, 42]].map(([x, y, rr]) => c(x, y, rr, '#FFD23F', 6)).join('') +
      [[-80, -250, 62], [0, -300, 76], [76, -262, 62], [-40, -320, 52], [50, -340, 50], [-100, -300, 40], [100, -310, 42]].map(([x, y, rr]) => fe(x, y, rr - 3, rr - 3, '#FFD23F')).join('') +
      [[-60, -280], [10, -330], [60, -280], [-20, -250], [40, -240], [-90, -310]].map(([x, y]) => fe(x, y, 10, 6, '#F2B21B')).join('') + brilho(-30, -340, 26, 12, -20, .4));
    s += ipe;
    s += em(520, CASA.CHAO - 8, 1, r(-6, -120, 12, 120, '#8A5A34', 3, 4) + r(-34, -160, 68, 44, '#4DA3FF', 14, 5) + r(26, -178, 8, 30, '#FF7A6B', 3, 3) + l('M-20 -140 h 30', T, 3));
    return s;
  }
  // ---------------------------------------------------------------- telhado de quatro águas (26°, de telha de barro)
  // De frente ele é um trapézio largo: as duas águas das pontas inclinadas e a cumeeira lá em cima. O mundo sobe acima
  // de y = 0 até CASA.TOPO para caber o telhado inteiro (a criança arrasta para cima e chega nele).
  // Desempenho: o telhado entra no cenário que vira imagem (é desenhado uma vez só), então os detalhes são de graça
  // no passeio; mesmo assim cada fileira de telhas é UM caminho só (e não uma forma por telha).
  function telhado() {
    const x0 = CASA.CASA0 - 130, x1 = CASA.CASA1 + 130, beiral = CIMA.topo + 6;
    const sobe = 760, corre = sobe / Math.tan(26 * Math.PI / 180), topo = beiral - sobe;
    const ra = x0 + corre, rb = x1 - corre;
    const BARRO = '#E8634F', ESCURO = '#C9473A', CLARO = '#F2876F';
    const id = 'casa-telhado';
    const d = `M${n(x0)} ${beiral} L ${n(ra)} ${topo} L ${n(rb)} ${topo} L ${n(x1)} ${beiral} Z`;
    // as águas das pontas (de lado) ficam um tom mais escuras: dão volume ao trapézio
    let s = `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
    s += chamine(rb - 520, topo + 250, 300);
    s += `<path d="${d}" fill="${BARRO}"/>`;
    let g = f(`M${n(x0)} ${beiral} L ${n(ra)} ${topo} L ${n(ra + 60)} ${topo} L ${n(x0 + 200)} ${beiral} Z`, ESCURO) +
      f(`M${n(x1)} ${beiral} L ${n(rb)} ${topo} L ${n(rb - 60)} ${topo} L ${n(x1 - 200)} ${beiral} Z`, ESCURO);
    const fileira = 54, larg = 64;
    // fileiras de telha: cada fileira é uma faixa com as "barrigas" das telhas (meia-lua) embaixo
    let fileiraN = 0;
    for (let y = beiral - 10; y > topo - fileira; y -= fileira, fileiraN++) {
      const desl = (fileiraN % 2) * larg / 2, xa = x0 - 80 + desl;
      // as barrigas: um caminho só com todas as meias-luas da fileira (contorno das telhas)
      let barrigas = `M${n(xa)} ${n(y)}`, luz = '';
      for (let x = xa; x < x1 + 80; x += larg) {
        barrigas += ` q ${larg / 2} ${n(fileira * .42)} ${larg} 0`;
        luz += `M${n(x + 14)} ${n(y - fileira * .55)} q ${n(larg * .2)} -6 ${n(larg * .42)} 0 `;
      }
      // tom da fileira: alternado bem de leve (o barro nunca é todo igual)
      if (fileiraN % 3 === 1) g += fr(x0, y - fileira, x1 - x0, fileira, CLARO, 0, .35);
      g += l(barrigas, ESCURO, 5) + l(luz, '#FFFFFF', 4).replace('/>', ' opacity=".22"/>');
    }
    [[1100, 170, 40], [1180, 150, 22], [4300, 150, 34], [6100, 170, 30], [6150, 158, 18], [2900, -120, 26]].forEach(([x, y, r]) => {
      g += fe(x, y, r, r * .55, '#7DBB4E', .85) + fe(x - r * .3, y - r * .2, r * .45, r * .25, '#A6D86E', .9);
    });
    // brilho do sol batendo no alto
    g += brilho((ra + rb) / 2 - 900, topo + 120, 520, 26, -2, .14);
    s += `<g clip-path="url(#${id})">${g}</g>`;
    s += `<path d="${d}" fill="none" stroke="${T}" stroke-width="8" stroke-linejoin="round"/>`;
    // espigões (as quinas das quatro águas) e a cumeeira, de telhas redondas
    const capa = (xa, ya, xb, yb) => l(`M${n(xa)} ${n(ya)} L ${n(xb)} ${n(yb)}`, T, 32) + l(`M${n(xa)} ${n(ya)} L ${n(xb)} ${n(yb)}`, ESCURO, 20) +
      l(`M${n(xa)} ${n(ya)} L ${n(xb)} ${n(yb)}`, CLARO, 6).replace('/>', ' opacity=".7" stroke-dasharray="40 26"/>');
    s += capa(x0 + 40, beiral - 18, ra, topo) + capa(x1 - 40, beiral - 18, rb, topo) + capa(ra, topo, rb, topo);
    // águas-furtadas (janelinhas do sótão) e a antena com um passarinho
    s += aguaFurtada(2700, beiral - 130) + aguaFurtada(5100, beiral - 130);
    s += antena(ra + 900, topo);
    s += passarinho(ra + 1700, topo - 14) + passarinho(ra + 1790, topo - 14, true);
    // beiral (tábua da beirada), calha e o cano que desce no canto
    s += r(x0 - 14, beiral - 6, x1 - x0 + 28, 26, '#FFF4E6', 8, 7);
    s += r(x0 - 20, beiral + 16, x1 - x0 + 40, 18, '#B9B3CC', 9, 5);
    s += r(x1 - 6, beiral + 24, 22, 120, '#B9B3CC', 8, 5);
    return s;
  }
  /** Água-furtada: janelinha com telhadinho saindo do telhado (com floreira). */
  function aguaFurtada(x, yBase) {
    return r(x - 120, yBase - 200, 240, 210, '#F6E3C8', 10, 7) + fr(x - 112, yBase - 40, 224, 40, '#E8CFA8') +
      r(x - 76, yBase - 168, 152, 132, '#FFFFFF', 12, 6) + r(x - 64, yBase - 156, 128, 108, '#BFE8FF', 8, 4) +
      l(`M${x} ${yBase - 156} V ${yBase - 48} M${x - 64} ${yBase - 102} H ${x + 64}`, T, 5) + brilho(x - 30, yBase - 128, 18, 9, -30, .6) +
      // cortininha
      f(`M${x - 64} ${yBase - 156} Q ${x - 40} ${yBase - 120} ${x - 52} ${yBase - 70} L ${x - 64} ${yBase - 70} Z`, '#FF8FC2') +
      // floreira
      r(x - 92, yBase - 40, 184, 34, '#C98A55', 8, 5) + [-60, -20, 20, 60].map((dx, i) => c(x + dx, yBase - 48, 13, ['#FF7A6B', '#FFD23F', '#FF8FC2', '#9B7BFF'][i], 4)).join('') +
      p(`M${x - 160} ${yBase - 186} L ${x} ${yBase - 340} L ${x + 160} ${yBase - 186} Z`, '#E8634F', 8) +
      l(`M${x - 126} ${yBase - 206} L ${x} ${yBase - 322} L ${x + 126} ${yBase - 206}`, '#C9473A', 5) +
      l(`M${x - 168} ${yBase - 180} L ${x} ${yBase - 346} L ${x + 168} ${yBase - 180}`, '#FFF4E6', 12).replace('/>', ' opacity=".9"/>');
  }
  function chamine(x, yBase, alto = 260) {
    return r(x - 60, yBase - alto, 120, alto + 30, '#C98A55', 6, 7) +
      [0, 1, 2, 3, 4].map(i => fr(x - 54, yBase - alto + 34 + i * 46, 108, 5, '#A9703F', 0, .7)).join('') +
      [0, 1, 2, 3].map(i => fr(x - 54 + (i % 2) * 40, yBase - alto + 52 + i * 46, 5, 28, '#A9703F', 0, .5)).join('') +
      r(x - 78, yBase - alto - 32, 156, 38, '#A9703F', 8, 6) +
      // fumacinha
      [[0, -90, 34], [30, -160, 42], [-10, -240, 50]].map(([dx, dy, rr]) => c(x + dx, yBase - alto + dy, rr, '#FFFFFF', 5)).join('');
  }
  function antena(x, y) {
    return l(`M${x} ${y} V ${y - 230}`, T, 9) + l(`M${x} ${y} V ${y - 230}`, '#B9B3CC', 4) +
      [[-90, 90, -170], [-70, 70, -120], [-50, 50, -70]].map(([a, b, dy]) => l(`M${x + a} ${y + dy - 40} L ${x + b} ${y + dy - 40}`, T, 7)).join('');
  }
  function passarinho(x, y, virado) {
    return em(x, y, 1, (virado ? '<g transform="scale(-1 1)">' : '<g>') +
      e(0, -26, 30, 24, '#4DA3FF', 5) + c(22, -50, 17, '#4DA3FF', 5) + p('M36 -52 L 54 -46 L 36 -40 Z', '#FFC93C', 4) +
      c(26, -54, 3.5, T, 0) + p('M-18 -30 Q -4 -40 10 -26 Q -4 -14 -18 -30 Z', '#2E86DE', 4) + fe(4, -12, 14, 8, '#BFE8FF') +
      l('M-6 -2 v 8 M6 -2 v 8', '#FF9F43', 4) + '</g>');
  }
  function estrutura() {
    const x0 = CASA.CASA0, x1 = CASA.CASA1;
    let s = '';
    // fundação e laje
    s += r(x0 - 24, BAIXO.piso + 40, x1 - x0 + 48, 34, '#B9AFA0', 4, 6);
    const lajeY = CIMA.piso + 40, lajeH = BAIXO.topo - lajeY;
    s += r(x0, lajeY, CASA.ESCADA.x0 - 20 - x0, lajeH, '#EBD8BC', 0, 6) + r(CASA.ESCADA.x1 + 20, lajeY, x1 - CASA.ESCADA.x1 - 20, lajeH, '#EBD8BC', 0, 6);
    // paredes de fora (grossas, de tijolinho rebocado). Vão de x0 - 30 até onde os cômodos começam por dentro
    // (CASA.L.*.x0), para não sobrar fresta de céu entre a parede e o papel de parede.
    const dentroE = CASA.L.quarto.x0, dentroD = CASA.L.cozinha.x1;
    const tijolos = (x, w, y0, y1) => { let t = ''; for (let y = y0 + 40, i = 0; y < y1 - 10; y += 76, i++) t += fr(x + (i % 2 ? 8 : 16), y, w - 24, 5, '#E6CDAA'); return t; };
    const paredeFora = (x, w, y1) => r(x, CIMA.topo - 4, w, y1 - CIMA.topo + 4, '#F6E3C8', 0, 7) + tijolos(x, w, CIMA.topo, y1) +
      fr(x + w - 12, CIMA.topo, 8, y1 - CIMA.topo, '#E6CDAA', 0, .8);                       // sombrinha do lado de dentro
    s += paredeFora(x0 - 30, dentroE - x0 + 30, BAIXO.piso + 40);
    // parede de fora da direita com o vão da porta dos fundos (a cozinha leva ao quintal)
    const portaTopo = BAIXO.piso - 350, wD = x1 + 30 - dentroD;
    s += r(dentroD, CIMA.topo - 4, wD, portaTopo - CIMA.topo + 4, '#F6E3C8', 0, 7) + tijolos(dentroD + 8, wD - 8, CIMA.topo, portaTopo) +
      r(dentroD - 8, portaTopo - 4, wD + 16, 22, '#C98A55', 4, 6) +                              // verga da porta
      soleiraEDegraus(dentroD, x1 + 30);
    // paredes de dentro com vão de porta em arco (a casa é contínua)
    const vao = (x, andar) => {
      const alto = andar.piso - 360;
      // a passagem: um tom mais escuro de parede (a espessura da parede vista de lado), para não aparecer o céu
      return fr(x - 24, alto - 20, 48, andar.piso + 40 - alto + 20, '#E2CDAE') + fr(x - 24, andar.piso - 40, 48, 80, '#D9BC94') +
        r(x - 24, andar.topo, 48, alto - andar.topo, '#EBD8BC', 0, 6) +
        p(`M${x - 24} ${alto} Q ${x} ${alto - 24} ${x + 24} ${alto}`, '#EBD8BC', 6) +
        l(`M${x - 24} ${alto} V ${andar.piso - 40} M${x + 24} ${alto} V ${andar.piso - 40}`, '#C9A77E', 6);
    };
    s += vao(4500, CIMA) + vao(4250, BAIXO);
    return s;
  }
  /**
   * A saída da cozinha para o quintal: a soleira de pedra no vão da porta, na altura do piso, e dois degraus de
   * pedra descendo até a grama (o chão de dentro fica mais alto que o gramado).
   */
  function soleiraEDegraus(xa, xb) {
    // o piso de dentro continua lá fora como um patamar de pedra (mesma altura), e um degrau desce até a grama
    const PEDRA = '#E3DACB', FACE = '#CFC4B0', BORDA = '#F2ECE1', fundo = BAIXO.piso + 74;
    const bloco = (x, w, topo) => r(x, topo, w, fundo - topo, FACE, 8, 6) +
      r(x, topo, w, 26, BORDA, 8, 5) + fr(x + 8, topo + 30, w - 16, 5, PEDRA, 2) + brilho(x + w * .4, topo + 12, w * .25, 3, 0, .7);
    let s = bloco(xa + 18, xb - xa + 110, BAIXO.piso - 42);         // patamar: do vão da porta até fora da parede
    s += bloco(xb + 120, 120, BAIXO.piso - 4);                       // degrau
    s += fe(xb + 250, CASA.CHAO + 6, 30, 6, T, .1) + l(`M${xb + 30} ${fundo - 20} l 14 -6 M${xb + 170} ${fundo - 16} l 10 6`, '#B5AB98', 3);
    return s;
  }
  /**
   * A escada vista de lado, como uma de verdade: os degraus formam um "serrote" (piso e espelho de cada degrau) em
   * cima de uma viga inclinada; embaixo dela fica o vão (aparece a parede da sala). O corrimão corre paralelo aos
   * degraus, sempre na mesma altura acima deles, e cada balaústre sai do meio de um degrau e encosta nele.
   */
  function escada() {
    const { x0, x1 } = CASA.ESCADA, N = 15;
    const yb = BAIXO.piso - 40, yt = CIMA.piso - 40;          // o chão da sala e o chão do quarto (onde se pisa)
    const w = (x1 - x0) / N, h = (yb - yt) / N, VIGA = 150, ALTO = 170;
    const MAD = '#C98A55', CLARO = '#E0A574', ESCURO = '#A9703F', CORR = '#8A5A34';
    let s = '';
    // o vão da laje por onde a escada sobe: a mesma faixa da divisória entre os andares, um tom mais funda (o lado de
    // dentro da abertura), com as mesmas linhas de cima e de baixo, entre as pontas cortadas da laje (base.js: estrutura)
    const gy0 = CIMA.piso + 40, gy1 = BAIXO.topo, gx0 = x0 - 20, gx1 = x1 + 20;
    s += fr(gx0, gy0, gx1 - gx0, gy1 - gy0, '#DCC39C') + fr(gx0, gy0, gx1 - gx0, 14, '#C9AD84', 0, .7) +
      l(`M${gx0} ${gy0} H ${gx1} M${gx0} ${gy1} H ${gx1}`, T, 6);
    // sombra no chão debaixo da escada
    s += fe(x0 + (x1 - x0) * .55, yb + 6, (x1 - x0) * .45, 10, T, .12);
    // a viga inclinada (de baixo até a laje lá em cima)
    const viga = `M${n(x0)} ${n(yb)} L ${n(x1)} ${n(yt)} L ${n(x1)} ${n(yt + VIGA)} L ${n(x0 + VIGA * w / h)} ${n(yb)} Z`;
    // os degraus (um caminho só): cada um é um triângulo em cima da linha da viga
    let dentes = '';
    for (let i = 0; i < N; i++) {
      const xa = x0 + i * w, ya = yb - i * h;
      dentes += `M${n(xa)} ${n(ya)} V ${n(ya - h)} H ${n(xa + w)} Z `;
    }
    s += `<path d="${dentes}" fill="${MAD}"/>`;
    s += p(viga, ESCURO, 6);
    s += l(`M${n(x0 + 30)} ${n(yb - 20)} L ${n(x1 - 14)} ${n(yt + 40)}`, CLARO, 5).replace('/>', ' opacity=".55"/>');
    // contorno do serrote e a pontinha clara de cada piso (o "bocel")
    let serrote = `M${n(x0)} ${n(yb)}`;
    for (let i = 0; i < N; i++) serrote += ` V ${n(yb - (i + 1) * h)} H ${n(x0 + (i + 1) * w)}`;
    s += l(serrote, T, 6);
    for (let i = 0; i < N; i++) s += r(x0 + i * w - 6, yb - (i + 1) * h - 5, w + 8, 12, CLARO, 5, 4);
    // corrimão: paralelo aos degraus, ALTO acima da pontinha dos pisos
    const yPiso = x => yb - h - (x - x0) * h / w;               // a linha das pontinhas dos degraus
    const xa = x0 + w / 2, xb = x1 - w / 2;
    for (let i = 0; i < N; i++) {
      const xc = x0 + i * w + w / 2, yd = yb - (i + 1) * h;
      if (i % 2) continue;
      s += l(`M${n(xc)} ${n(yd - 4)} V ${n(yPiso(xc) - ALTO + 4)}`, CORR, 7);
    }
    // pilarzinho de baixo e de cima
    s += r(xa - 10, yPiso(xa) - ALTO - 30, 20, ALTO + 30 + (yb - h - yPiso(xa)), CORR, 5, 5) + c(xa, yPiso(xa) - ALTO - 34, 13, CORR, 5);
    s += l(`M${n(xa)} ${n(yPiso(xa) - ALTO)} L ${n(xb)} ${n(yPiso(xb) - ALTO)}`, T, 15) + l(`M${n(xa)} ${n(yPiso(xa) - ALTO)} L ${n(xb)} ${n(yPiso(xb) - ALTO)}`, CORR, 9) +
      l(`M${n(xa)} ${n(yPiso(xa) - ALTO - 3)} L ${n(xb)} ${n(yPiso(xb) - ALTO - 3)}`, '#B47A48', 3);
    s += r(xb - 10, yPiso(xb) - ALTO - 30, 20, ALTO + 30, CORR, 5, 5) + c(xb, yPiso(xb) - ALTO - 34, 13, CORR, 5);
    // guarda-corpo lá em cima, em volta do buraco (no quarto), até a chegada da escada
    const gFim = x1 - 3 * w;
    s += l(`M${x0 - 30} ${CIMA.piso - 90} H ${n(gFim)}`, CORR, 12);
    for (let x = x0 - 20; x < gFim - 10; x += 86) s += l(`M${n(x)} ${CIMA.piso - 88} V ${CIMA.piso + 36}`, CORR, 7);
    s += r(gFim - 9, CIMA.piso - 110, 18, 150, CORR, 5, 5) + c(gFim, CIMA.piso - 114, 11, CORR, 5);
    return s;
  }

  // ---------------------------------------------------------------- sol, lua e estrelas (vivos, fora do cenário)
  /* O sol fica alto sobre o quintal dos fundos. Os desenhos são locais, com (0,0) no meio. Os raios ficam num grupo à
     parte (giram devagar); o resto é parado. Sem filtros nem gradientes. */
  CASA.SOL = { x: 9300, y: 230 };
  CASA.astro = {
    raios() {
      // 12 raios de pontinha redonda (um caminho só), alternando compridos e curtos, atrás de um brilho clarinho
      let d = '';
      for (let k = 0; k < 12; k++) {
        const a = k * Math.PI / 6, L = k % 2 ? 158 : 186, w = .15, R = 104;
        d += `M${n(Math.cos(a - w) * R)} ${n(Math.sin(a - w) * R)} L ${n(Math.cos(a) * L)} ${n(Math.sin(a) * L)} L ${n(Math.cos(a + w) * R)} ${n(Math.sin(a + w) * R)} Z `;
      }
      return `<circle r="146" fill="#FFF3B0" opacity=".5"/>` + `<path d="${d}" fill="#FFC93C" stroke="${T}" stroke-width="6" stroke-linejoin="round"/>`;
    },
    sol() {
      return c(0, 0, 112, '#FFD23F', 7) + fe(0, 10, 96, 90, '#FFE27A') + brilho(-48, -56, 30, 14, -35, .55) +
        // carinha: olhos fechados sorrindo, bochechas e boquinha
        l('M-46 -12 q 14 -16 28 0 M18 -12 q 14 -16 28 0', T, 7) + fe(-56, 22, 18, 11, '#FF9F7A', .7) + fe(56, 22, 18, 11, '#FF9F7A', .7) +
        p('M-22 22 Q 0 52 22 22 Q 0 32 -22 22 Z', '#FF7A6B', 6);
    },
    lua() {
      // lua cheia de criança: com crateras, carinha dormindo e uma touca de estrela
      return `<circle r="150" fill="#FFF6C8" opacity=".18"/>` + c(0, 0, 96, '#FFF3B8', 7) + fe(10, 8, 80, 80, '#FFF8D6') +
        c(-46, -40, 14, '#F2E29A', 0) + c(40, 46, 18, '#F2E29A', 0) + c(52, -30, 9, '#F2E29A', 0) + c(-30, 52, 8, '#F2E29A', 0) +
        l('M-40 0 q 12 10 24 0 M14 0 q 12 10 24 0', T, 6) + fe(-48, 22, 14, 9, '#FFB7A0', .6) + fe(50, 22, 14, 9, '#FFB7A0', .6) +
        l('M-10 30 q 10 8 20 0', T, 5) + brilho(-40, -60, 24, 10, -30, .6);
    },
    /** estrelas do céu (no mundo), só onde o céu não tem nada na frente: acima do telhado e alto sobre os quintais */
    estrelas() {
      const pts = [];
      let semente = 7;
      const rnd = () => (semente = (semente * 9301 + 49297) % 233280) / 233280;
      for (let k = 0; k < 150; k++) {
        const x = 40 + rnd() * (CASA.W - 80);
        const sobreCasa = x > CASA.CASA0 - 200 && x < CASA.CASA1 + 200;
        const y = sobreCasa ? CASA.TOPO + 30 + rnd() * 160 : CASA.TOPO + 30 + rnd() * 1300;
        if (Math.hypot(x - CASA.SOL.x, y - CASA.SOL.y) < 220) continue;
        pts.push([Math.round(x), Math.round(y), 6 + Math.round(rnd() * 9), k % 7 === 0]);
      }
      return pts;
    },
  };

  /** As tomadas (uma placa branca com os dois furinhos; a do quintal num postinho de madeira com tampinha). */
  function tomadas() {
    return CASA.TOMADAS.map(({ x, y, poste }) => {
      let s = '';
      if (poste) s += r(x - 16, y + 20, 32, CASA.CHAO - y - 20 + 6, '#A9703F', 6, 6) + r(x - 40, y - 46, 80, 26, '#8A5A34', 8, 5);
      s += CASA.sombra(x + 4, y + 34, 26, 5) + r(x - 26, y - 32, 52, 64, '#FFFFFF', 12, 5) + fr(x - 18, y - 24, 36, 10, '#F3ECF9', 4) +
        c(x, y + 2, 16, '#F3ECF9', 4) + fe(x - 6, y + 2, 3.2, 4.2, T) + fe(x + 6, y + 2, 3.2, 4.2, T) + fe(x, y + 11, 2.6, 2.6, T);
      return s;
    }).join('');
  }
  /**
   * As camadas do cenário, de trás para a frente, cada uma com a faixa de x que ela ocupa (para desenhar só o que
   * aparece num pedaço da casa: ver CASA.cenarioEm). Cada camada é desenhada uma vez e guardada.
   */
  let camadas = null;
  function montarCamadas() {
    const P = CASA.partes, L = CASA.L, W = CASA.W;
    const parte = (nome, qual) => { try { return P[nome] && P[nome][qual] ? P[nome][qual](L[nome]) : ''; } catch (err) { console.error(nome, err); return ''; } };
    const casa = [CASA.CASA0 - 120, CASA.CASA1 + 120];
    const faixa = nome => [L[nome].x0 - 60, L[nome].x1 + 60];
    const nomes = ['quarto', 'banheiro', 'sala', 'cozinha'];
    return [
      [[-50, W + 50], ceu()], [[-50, 700], quintalDaFrente()], [[L.quintal.x0 - 80, W + 50], parte('quintal', 'fundo')], [casa, telhado()],
    ].concat(nomes.map(nm => [faixa(nm), parte(nm, 'fundo')]))
      .concat([[casa, estrutura()], [[CASA.ESCADA.x0 - 120, CASA.ESCADA.x1 + 120], escada()]])
      .concat(nomes.concat('quintal').map(nm => [faixa(nm), parte(nm, 'fixos')]))
      .concat([[[-50, W + 50], tomadas()]]);
  }
  /** O cenário que não se mexe: céu, quintais, casa por fora, cômodos (fundo), estrutura, escada e os fixos. */
  CASA.cenario = function () {
    if (!camadas) camadas = montarCamadas();
    return camadas.map(c => c[1]).join('');
  };
  /** Só as camadas do cenário que passam pela faixa de x de xa a xb (o resto fica de fora do pedaço). */
  CASA.cenarioEm = function (xa, xb) {
    if (!camadas) camadas = montarCamadas();
    return camadas.filter(([[a, b]]) => b > xa && a < xb).map(c => c[1]).join('');
  };
  /** O mundo inteiro desenhado de uma vez (páginas de conferência): o cenário e os itens da casa inicial. */
  CASA.mundo = function (extra) {
    const itens = CASA.inicial ? CASA.ordenar(CASA.inicial().map(i => Object.assign({}, i))).map(i => CASA.desenharEm(i)).join('') : '';
    return CASA.cenario() + itens + (extra || '');
  };
})();
