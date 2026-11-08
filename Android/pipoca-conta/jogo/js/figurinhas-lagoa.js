/* Pipoca Aprende — figurinhas fig41–fig50 (Lagoa, estações de letras).
   Desenhos no quadro 200×200 com as peças de PC.figurinhas.pecas (mesmo traço e cores de js/figurinhas.js);
   a borda branca de adesivo é aplicada pelo figurinhas.js. No álbum: colhereiro e jaçanã no alto; cervo, anta,
   sucuri e aguapé na margem; boto, tracajá, pirarucu e arraia na água. */
(function () {
  'use strict';
  const PC = window.PC;
  if (!PC || !PC.figurinhas || !PC.figurinhas.registrar) return;
  const { T, r2, c, e, p, l, tc, olho, bochecha, brilho, uniao, cn, agua } = PC.figurinhas.pecas;

  /** Marolinhas claras na água. */
  const marola = d => l(d, '#E7FAFF', 4);
  /** Elipse inteira como caminho (para os anéis da sucuri). */
  const anel = (x, y, rx, ry) => `M${x - rx} ${y} A ${rx} ${ry} 0 1 0 ${x + rx} ${y} A ${rx} ${ry} 0 1 0 ${x - rx} ${y} Z`;
  /** Capim baixo da margem. */
  const chao = (y = 168, rx = 70) => e(100, y, rx, 10, '#8BD06F') +
    l(`M${100 - rx + 18} ${y - 2} q 3 -6 7 -1 M${100 + rx - 26} ${y - 1} q 3 -6 7 -1`, '#5CB04A', 3);

  const D = {};

  // ---------------------------------------------------------------- na água
  D.fig41 = () => {                                   // boto-cor-de-rosa pulando da água: testão redondo e bico comprido
    const rosa = '#FF9DBB', rosaEsc = '#F07AA2', claro = '#FFD6E2';
    const corpo = 'M36 146 C 40 100 78 58 128 52 L 150 100 C 108 102 72 118 54 156 Z';
    return agua(100, 164, 78, 14) + marola('M34 164 Q 44 159 54 164 M140 168 Q 150 163 160 168 M84 172 h 22') +
      // cauda (nadadeira em leque) saindo da água
      p('M44 150 C 30 148 18 138 16 124 C 30 126 42 134 50 144 Z', rosaEsc, 4.5) +
      p('M44 150 C 44 162 52 170 66 172 C 64 160 58 150 50 144 Z', rosaEsc, 4.5) +
      p(corpo, rosa) + p('M56 150 C 74 118 108 102 146 100 L 142 92 C 104 94 72 110 52 142 Z', claro, 0) + p(corpo, 'none') +
      brilho(60, 102, 18, 5, -58, 0.4) +
      // cabeça: o "melão" redondo na testa e o bico fino e comprido
      p('M152 84 C 164 84 176 90 182 98 C 180 104 166 104 152 98 Z', rosa, 4.5) +
      e(134, 76, 29, 26, rosa) +
      p('M128 98 C 138 103 150 102 158 96 C 150 93 142 93 128 98 Z', claro, 0) +
      l('M157 94 Q 148 100 140 97', T, 3) +
      olho(142, 73, 4.8) + bochecha(134, 89, 5.5, 3.2) + brilho(124, 60, 10, 5, -30, 0.45) +
      // nadadeira do peito (larga, de remo)
      e(108, 114, 16, 8, rosaEsc, 4, 30) +
      // gotinhas do pulo, encostadas na água
      c(24, 150, 5, '#E7FAFF', 3.5) + c(72, 156, 5.5, '#E7FAFF', 3.5);
  };

  D.fig42 = () => {                                   // tracajá: casco baixo e liso, cabeça com as manchas amarelas
    const pele = '#7E8794', casco = 'M30 128 C 32 92 62 70 98 70 C 134 70 160 92 162 128 Z';
    return agua(100, 160, 80, 15) + marola('M30 160 Q 40 155 50 160 M150 164 Q 160 159 170 164 M90 172 h 20') +
      // patas de remo e rabinho
      e(52, 140, 17, 9, pele, 4.5, 25) + e(136, 142, 18, 9, pele, 4.5, -25) +
      p('M34 126 L 18 132 L 34 134 Z', pele, 4) +
      // casco
      p(casco, '#5E6E4E') + p('M28 128 Q 96 140 164 128 L 162 134 Q 96 146 30 134 Z', '#E8D58A', 4) +
      l('M60 80 Q 64 104 58 126 M98 72 V 126 M136 80 Q 132 104 138 126 M38 104 Q 98 96 158 104', '#4A5A3C', 3) +
      brilho(76, 86, 18, 6, -15, 0.3) +
      // pescoço e cabeça grande (achatada, de tartaruga de rio)
      tc('M148 118 C 154 108 156 100 156 92', pele, 18) +
      e(158, 84, 26, 21, pele) +
      e(166, 96, 14, 6, '#A9B0BA', 0) +
      // as manchas amarelas: atrás do olho, no focinho e no queixo
      e(144, 74, 7, 5, '#FFD23F', 0, -20) + e(174, 74, 5, 3.5, '#FFD23F', 0, 15) + e(146, 92, 5, 3.5, '#FFD23F', 0) +
      olho(162, 80, 5.2) + c(181, 81, 1.8, T, 0) + l('M180 92 Q 172 96 164 93', T, 3) +
      bochecha(156, 92, 4.5, 2.8) + brilho(150, 70, 7, 3.5, -30, 0.45);
  };

  D.fig43 = () => {                                   // pirarucu: peixão comprido, escamas de beirada vermelha e rabo vermelho
    const corpo = 'M42 100 C 50 78 92 66 132 68 C 160 70 178 84 180 98 C 178 114 160 128 132 130 C 92 132 50 122 42 100 Z';
    const escama = (x, y, cor) => l(`M${x} ${y} q 5 6 10 0`, cor, 2.6);
    let escamas = '';
    [[70, 84], [70, 98], [70, 112], [84, 78], [84, 92], [84, 106], [84, 120], [100, 82], [100, 96], [100, 110], [114, 86], [114, 100]].forEach(([x, y], i) => {
      escamas += escama(x, y, x < 96 ? '#B82E2A' : '#5C6E68');
    });
    return p('M50 100 C 36 76 18 76 18 100 C 18 124 36 124 50 100 Z', '#D9342E') + l('M24 92 L 38 98 M24 108 L 38 102', '#B82E2A', 3) +
      p('M54 86 C 58 68 74 62 90 70 Z', '#E8493A', 4) + p('M54 114 C 58 132 74 138 90 130 Z', '#E8493A', 4) +
      p(corpo, '#6F857C') +
      p('M44 100 C 50 82 66 74 92 70 Q 84 100 92 130 C 66 126 50 118 44 100 Z', '#F05A40', 0) +
      p('M120 70 C 150 68 172 80 178 94 C 160 88 140 86 118 88 Z', '#4E625C', 0) +
      p(corpo, 'none') + escamas +
      brilho(110, 76, 18, 4, -4, 0.35) +
      // nadadeira do peito, olho e boca virada para cima
      p('M128 106 C 120 112 112 122 112 130 C 122 128 130 120 134 110 Z', '#8FA59C', 3.5) + l('M126 112 L 118 124', '#6F857C', 2) +
      c(154, 92, 9.5, '#FFE27A', 3) + olho(155, 92, 5.4) +
      l('M180 96 Q 174 106 164 106', T, 3.2) + bochecha(148, 108, 5, 3) +
      c(176, 70, 5.5, '#E7FAFF', 3.5) + c(166, 54, 4.5, '#E7FAFF', 3);
  };

  D.fig44 = () => {                                   // arraia de rio vista de cima: disco largo com pintas e o rabo de ferrão
    const disco = 'M100 44 C 146 42 180 72 182 96 C 184 120 148 136 100 136 C 52 136 16 120 18 96 C 20 72 54 42 100 44 Z';
    const pinta = (x, y, r) => c(x, y, r, '#FFB13D', 2.5) + c(x, y, r2(r * 0.4), '#7A5638', 0);
    return c(170, 52, 6, '#E7FAFF', 3.5) + c(160, 36, 4.5, '#E7FAFF', 3) +
      // rabo comprido (de lado) com o ferrão e as nadadeirinhas de trás
      tc('M126 124 C 146 140 154 158 176 166', '#7A5638', 9) + p('M172 160 L 184 162 L 175 172 Z', '#FFF4E8', 2.5) +
      e(84, 136, 12, 8, '#7A5638', 4, 20) + e(116, 136, 12, 8, '#7A5638', 4, -20) +
      p(disco, '#9A7450') + p('M24 100 C 40 116 70 124 100 124 C 130 124 160 116 176 100 C 172 118 140 130 100 130 C 60 130 28 118 24 100 Z', '#B58C64', 0) +
      p(disco, 'none') +
      pinta(46, 86, 6.5) + pinta(154, 86, 6.5) + pinta(32, 104, 5) + pinta(168, 104, 5) + pinta(62, 110, 6.5) + pinta(138, 110, 6.5) +
      pinta(100, 116, 6) + pinta(80, 98, 5) + pinta(120, 98, 5) + pinta(66, 62, 5) + pinta(134, 62, 5) +
      brilho(74, 56, 16, 5, -15, 0.35) +
      // os olhinhos saltados em cima (de bicho do fundo) e um sorriso
      c(86, 70, 9.5, '#B58C64', 3.5) + c(114, 70, 9.5, '#B58C64', 3.5) + olho(86, 69, 5.6) + olho(114, 69, 5.6) +
      l('M93 87 Q 100 92 107 87', T, 3) + bochecha(74, 84, 4.5, 2.8) + bochecha(126, 84, 4.5, 2.8);
  };

  // ---------------------------------------------------------------- na margem
  D.fig45 = () => {                                   // cervo-do-pantanal: chifres galhados, orelhões e pernas pretas
    const pelo = '#C8642E', chifre = '#EAD3A8';
    const perna = x => p(`M${x} 126 L ${x} 162 Q ${x - 1} 168 ${x + 5} 168 L ${x + 9} 168 Q ${x + 13} 168 ${x + 10} 162 L ${x + 9} 126 Z`, '#2E2640', 4.5);
    return chao() +
      perna(56) + perna(104) +
      p('M46 108 C 36 100 34 92 38 86 C 46 88 50 96 52 104 Z', pelo, 4) + p('M40 90 C 42 94 45 98 47 102 L 50 100 C 48 95 45 91 42 88 Z', '#FFFFFF', 0) +
      perna(70) + perna(118) +
      e(88, 118, 44, 23, pelo) + e(88, 132, 28, 6, '#F0A872', 0) + brilho(72, 106, 16, 5, -8, 0.3) +
      tc('M114 112 C 118 100 120 92 122 82', pelo, 20) +
      // chifres galhados (atrás da cabeça)
      tc('M112 54 C 106 42 102 32 94 22 M106 42 C 98 40 90 40 82 34 M101 33 L 102 18', chifre, 6) +
      tc('M132 54 C 138 42 142 32 150 22 M138 42 C 146 40 154 40 162 34 M143 33 L 142 18', chifre, 6) +
      // orelhões
      e(94, 64, 17, 9, pelo, 4.5, -18) + e(95, 64, 10, 4.5, '#FFF0E0', 0, -18) +
      e(150, 64, 17, 9, pelo, 4.5, 18) + e(149, 64, 10, 4.5, '#FFF0E0', 0, 18) +
      // cabeça de frente: focinho preto e os olhos com a volta branca
      e(122, 78, 24, 27, pelo) +
      c(111, 74, 7.5, '#FFF4E8', 0) + c(133, 74, 7.5, '#FFF4E8', 0) + olho(111, 74, 4.8) + olho(133, 74, 4.8) +
      e(122, 96, 12, 9, '#2E2640', 0) + e(119, 93, 3, 1.6, '#FFFFFF', 0, -10) +
      l('M116 104 Q 122 108 128 104', '#FFF4E8', 3) +
      bochecha(104, 88, 4.5, 2.8) + bochecha(140, 88, 4.5, 2.8) + brilho(114, 60, 8, 4, -30, 0.4);
  };

  D.fig47 = () => {                                   // anta: corpo de barril, focinho de trombinha, orelhas em pé e crina
    const pelo = '#7A6A80', escuro = '#5A4C62', claro = '#A396AA';
    const perna = (x, cor) => p(`M${x} 128 L ${x} 160 Q ${x} 168 ${x + 7} 168 L ${x + 13} 168 Q ${x + 20} 168 ${x + 19} 160 L ${x + 18} 128 Z`, cor, 4.5);
    const cabeca = 'M116 96 C 114 76 126 64 142 64 C 154 64 162 72 168 82 L 180 96 Q 186 104 178 108 C 172 107 168 110 164 116 C 148 122 120 116 116 96 Z';
    return chao() +
      perna(44, escuro) + perna(98, escuro) +
      p('M36 106 L 26 112 L 36 116 Z', pelo, 4) +
      perna(58, pelo) + perna(112, pelo) +
      e(84, 116, 50, 32, pelo) + e(86, 136, 32, 8, claro, 0) + brilho(66, 98, 18, 6, -10, 0.3) +
      // crina curta no alto do pescoço
      p('M108 94 C 108 80 116 68 128 62 L 134 68 C 124 74 118 84 118 96 Z', '#3E3448', 3.5) +
      // orelhas em pé, de beirada branca
      e(130, 56, 8, 12, '#FFFFFF', 4, -18) + e(131, 58, 4.5, 8, escuro, 0, -18) +
      p(cabeca, pelo) +
      p('M140 106 C 148 112 158 112 164 108 C 162 114 150 118 140 106 Z', claro, 0) +
      // a trombinha: o focinho comprido que cai por cima da boca
      l('M160 84 q 4 3 3 8 M166 88 q 4 3 3 8 M172 93 q 3 3 2 7', escuro, 2.6) + c(180, 103, 2.2, T, 0) +
      l('M164 112 Q 160 114 156 112', T, 3) +
      olho(144, 82, 5) + bochecha(140, 96, 5, 3) + brilho(132, 70, 8, 4, -30, 0.4);
  };

  D.fig49 = () => {                                   // sucuri enroladinha, verde com manchas pretas, sorrindo
    const verde = '#86B43E', mancha = '#2E2640';
    const spot = (x, y, rx = 5, ry = 3.5, rot = 0) => e(x, y, rx, ry, mancha, 0, rot);
    return chao(170, 76) +
      // ponta do rabo
      tc('M146 160 C 160 166 172 162 178 150', verde, 10) +
      // três voltas, de baixo para cima
      tc(anel(100, 152, 56, 15), verde, 22) + spot(62, 162, 6, 3.5, 20) + spot(86, 168) + spot(114, 168) + spot(138, 162, 6, 3.5, -20) +
      tc(anel(100, 128, 44, 12), verde, 21) + spot(72, 137, 5, 3.2, 20) + spot(100, 141) + spot(128, 137, 5, 3.2, -20) +
      tc(anel(100, 106, 30, 9), verde, 20) + spot(84, 114, 4.5, 3, 15) + spot(116, 114, 4.5, 3, -15) +
      brilho(76, 150, 10, 3, 15, 0.35) +
      // pescoço e cabeça grande, achatada
      tc('M84 102 C 76 90 80 78 94 72', verde, 18) +
      e(104, 64, 32, 21, verde) + e(106, 74, 20, 8, '#D6E58A', 0) +
      spot(92, 50, 4, 3) + spot(116, 50, 4, 3) +
      olho(90, 60, 5.4) + olho(118, 60, 5.4) + c(100, 68, 1.6, T, 0) + c(108, 68, 1.6, T, 0) +
      l('M92 74 Q 104 82 116 74', T, 3) +
      l('M104 79 V 88 M104 88 l -4 4 M104 88 l 4 4', '#E8433A', 2.6) +
      bochecha(84, 72, 5, 3) + bochecha(124, 72, 5, 3) + brilho(96, 50, 10, 4, -10, 0.4);
  };

  D.fig50 = () => {                                   // aguapé: rosa de folhas lustrosas com talos inchados e a flor lilás
    const folhaA = '#4FB83F', talo = '#9EE070';
    const flor = (x, y, s) => {
      let f = '';
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 - 90) * Math.PI / 180;
        f += cn(x + Math.cos(a) * 6 * s, y + Math.sin(a) * 6 * s, 5.2 * s);
      }
      return uniao(f, '#C7A2F2', r2(1.3 * s)) + c(x, r2(y - 4.5 * s), r2(3 * s), '#7B4FC8', 0) + c(x, r2(y - 4.5 * s), r2(1.3 * s), '#FFD23F', 0) +
        c(x, y, r2(1.8 * s), '#F3E8FF', 0);
    };
    const folhinha = (x, y, rx, ry, rot) => e(x, y, rx, ry, folhaA, 5, rot) + brilho(r2(x - rx * 0.3), r2(y - ry * 0.3), r2(rx * 0.4), r2(ry * 0.25), rot, 0.45);
    return agua(100, 160, 80, 17) + marola('M28 160 Q 38 155 48 160 M152 164 Q 162 159 172 164') +
      l('M84 166 q -4 6 -2 12 M98 168 q 0 6 2 10 M112 166 q 4 6 2 12', '#4A7FB0', 2.5) +
      // folhas de trás
      tc('M88 146 L 62 110', '#5CC84A', 5) + folhinha(52, 98, 22, 17, -30) +
      tc('M112 146 L 138 110', '#5CC84A', 5) + folhinha(148, 98, 22, 17, 30) +
      // a haste da flor
      tc('M100 148 L 100 60', '#5CC84A', 6) +
      // talos inchados (as boias da planta) e as folhas da frente
      e(80, 142, 11, 15, talo, 4.5, -25) + e(120, 142, 11, 15, talo, 4.5, 25) + e(100, 146, 11, 14, talo, 4.5) +
      tc('M74 132 L 50 128', '#5CC84A', 5) + folhinha(36, 126, 18, 14, -10) +
      tc('M126 132 L 150 128', '#5CC84A', 5) + folhinha(164, 126, 18, 14, 10) +
      brilho(76, 136, 3, 6, -25, 0.5) + brilho(116, 136, 3, 6, 25, 0.5) +
      // o cacho de flores lilás
      flor(100, 34, 1) + flor(82, 52, 1) + flor(118, 52, 1) + flor(90, 74, 0.95) + flor(112, 76, 0.95) + flor(100, 94, 0.85);
  };

  // ---------------------------------------------------------------- no alto
  D.fig46 = () =>                                     // colhereiro: ave rosa, cabeça pelada e o bico de colher
    agua(98, 166, 62, 11) + marola('M50 166 h 14 M130 168 h 14') +
    tc('M78 128 L 74 162 M94 128 L 98 162', '#E8607A', 5) +
    p('M48 102 C 36 104 26 110 20 118 C 32 120 44 118 52 114 Z', '#FFB36B', 4) +
    tc('M104 98 C 112 88 118 78 120 68', '#FFE3EC', 16) +
    e(80, 108, 36, 26, '#FFA9C6', 5, -10) +
    e(74, 104, 24, 15, '#FF7FA8', 3.5, -10) + e(94, 96, 9, 5, '#E8436E', 0, -25) +
    l('M60 110 Q 74 114 88 108', '#F06292', 2.5) +
    c(124, 56, 20, '#FFE3EC') + p('M108 48 C 112 38 128 34 138 42 C 132 48 118 50 108 48 Z', '#C9DDA8', 0) +
    // o bico comprido que termina numa colher
    tc('M140 60 C 152 70 160 84 164 98', '#A9A69C', 7) + e(167, 108, 10, 13, '#A9A69C', 4, -22) + brilho(164, 104, 3, 6, -22, 0.5) +
    c(127, 55, 6.4, '#E8553D', 0) + olho(127, 55, 4.4) + bochecha(116, 66, 4.5, 2.8) +
    brilho(112, 44, 6, 3, -30, 0.45) + brilho(66, 96, 12, 4, -15, 0.4);

  D.fig48 = () =>                                     // jaçanã andando na folha da vitória-régia, de dedos compridíssimos
    agua(100, 166, 84, 12) +
    e(100, 156, 78, 16, '#3E9A30') + e(100, 153, 70, 11, '#7FD06A', 0) +
    l('M100 153 L 44 150 M100 153 L 156 150 M100 153 L 66 162 M100 153 L 134 162', '#A8E28F', 2.5) +
    // pernas e os dedos esparramados na folha
    tc('M90 116 L 80 150 M104 116 L 120 150', '#A7C25A', 4) +
    tc('M80 150 L 48 154 M80 150 L 70 160 M80 150 L 102 156 M80 150 L 84 142', '#A7C25A', 3) +
    tc('M120 150 L 152 154 M120 150 L 130 160 M120 150 L 98 156 M120 150 L 116 142', '#A7C25A', 3) +
    // asa levantada mostrando as penas amarelo-esverdeadas
    p('M84 86 C 66 66 58 42 64 22 C 80 36 96 60 100 82 Z', '#E5EA6A', 4) + l('M72 40 Q 80 58 90 74', '#C2C84A', 2.5) +
    p('M56 100 L 34 104 L 54 112 Z', '#6E2A1C', 4) +
    e(92, 100, 32, 20, '#8E3A26', 5, -12) +
    e(86, 96, 18, 10, '#A85036', 3.5, -12) +
    tc('M110 92 C 116 84 120 76 122 68', '#2E2640', 15) +
    c(126, 56, 18, '#2E2640') +
    p('M140 44 C 146 40 150 44 148 52 L 140 54 Z', '#E8433A', 3) +
    p('M142 54 L 166 60 L 142 66 Z', '#FFD23F', 3.5) +
    c(130, 52, 6.5, '#FFFFFF', 0) + olho(131, 52, 4.4) + bochecha(122, 66, 4.5, 2.6) +
    brilho(118, 46, 6, 3, -30, 0.3) + brilho(80, 92, 10, 4, -15, 0.3);

  PC.figurinhas.registrar(D);
})();
