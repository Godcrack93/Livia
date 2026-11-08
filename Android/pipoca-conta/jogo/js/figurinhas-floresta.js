/* Pipoca Aprende — figurinhas fig51–fig59 (Floresta, estações de letras).
   Mesmo estilo das figurinhas de figurinhas.js (chibi, contorno #3A2A5A, cores chapadas, brilhos brancos), com as
   peças de PC.figurinhas.pecas. Cada função devolve o miolo SVG no quadro 200×200 (a borda de adesivo é aplicada
   por figurinhas.js). A fig60 (a Pipoca lendo) fica em figurinhas.js.
   No álbum: sagui, harpia, jiboia, bromélia e sapinho ficam nas árvores; jabuti, cutia, pau-brasil e castanheira no chão. */
(function () {
  'use strict';
  const PC = window.PC;
  if (!PC || !PC.figurinhas || !PC.figurinhas.registrar) return;
  const { T, r2, c, e, p, l, tc, olho, bochecha, brilho, uniao, cn, galho, folha } = PC.figurinhas.pecas;

  // ---------------------------------------------------------------- peças extras
  /** Elipse "nua" (sem cor) para usar dentro de uniao(). */
  const en = (x, y, rx, ry, rot = 0) => `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="${r2(rx)}" ry="${r2(ry)}"` +
    (rot ? ` transform="rotate(${r2(rot)} ${r2(x)} ${r2(y)})"` : '') + '/>';
  /** Caminho com contorno e um transform (desenhado em coordenadas locais). */
  const pt = (d, cor, sw, transform) => `<path d="${d}" transform="${transform}" fill="${cor}"` +
    (sw ? ` stroke="${T}" stroke-width="${sw}" stroke-linejoin="round"` : '') + '/>';
  /** Traço sem preenchimento com transform. */
  const lt = (d, cor, sw, transform) => `<path d="${d}" transform="${transform}" fill="none" stroke="${cor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  /** Hexágono de ponta para cima (casco do jabuti). */
  function hexagono(x, y, R) {
    let d = '';
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 - 90) * Math.PI / 180;
      d += (i ? ' L ' : 'M') + r2(x + R * Math.cos(a)) + ' ' + r2(y + R * Math.sin(a));
    }
    return d + ' Z';
  }
  /** Uma castanha-do-pará (gomo de três lados), centrada em (x, y), girada rot graus, escala s. */
  function castanha(x, y, rot, s = 1, cor = '#7A4626') {
    const tr = `translate(${x} ${y}) rotate(${rot}) scale(${s})`;
    return pt('M0 -17 C 9 -13 11 3 8 14 Q 0 19 -8 14 C -11 3 -9 -13 0 -17 Z', cor, r2(4 / s), tr) +
      lt('M1 -12 Q 3 0 1 12', '#A86A3E', r2(2.6 / s), tr) + lt('M-4 -9 Q -6 -2 -4 6', '#FFFFFF', r2(2 / s), tr).replace('fill="none"', 'fill="none" opacity=".35"');
  }

  const D = {};

  // ---------------------------------------------------------------- fig51 sagui-de-tufo-branco
  // Pequeno e cinza, agarrado num tronco em pé: tufos brancos enormes nas orelhas, testa branca, rabo listrado enrolado.
  D.fig51 = () => {
    const cinza = '#A19EAB', cinza2 = '#857F90', cara = '#4E4250';
    const tufo = (x, y, v) => {
      let f = cn(x + v * 3, y, 9);
      for (let i = 0; i < 7; i++) {
        const a = -66 + i * 22, b = (a * Math.PI) / 180;
        f += en(x + v * Math.cos(b) * 15, y + Math.sin(b) * 15, 15 - Math.abs(i - 3) * 1.2, 5, v * a);
      }
      let fios = '';
      [-44, 0, 44].forEach(a => {
        const b = (a * Math.PI) / 180;
        fios += `M${r2(x + v * Math.cos(b) * 8)} ${r2(y + Math.sin(b) * 8)} L ${r2(x + v * Math.cos(b) * 20)} ${r2(y + Math.sin(b) * 20)} `;
      });
      return uniao(f, '#FFFFFF', 3.5) + l(fios, '#D9D7E4', 2.2);
    };
    const tronco = 'M24 20 C 20 70 30 124 22 180 L 52 180 C 58 124 48 70 54 20 Z';
    const cauda = 'M102 150 C 108 176 140 182 152 164 C 162 148 152 132 138 138';
    return p(tronco, '#8A5A34') + l('M36 34 q 5 12 0 24 M46 92 q -5 12 0 26 M34 140 q 5 10 0 20', '#6E4426', 3.5) +
      p('M56 52 C 66 44 78 46 82 52 C 74 58 64 58 56 52 Z', '#5CC84A', 3.5) + l('M58 52 L 78 51', '#3E9A30', 2) +
      // rabo comprido listrado, enrolado na ponta
      tc(cauda, cinza, 13) +
      `<path d="${cauda}" fill="none" stroke="#3E3646" stroke-width="13" stroke-dasharray="6 7"/>` +
      // pé de trás agarrado no tronco
      tc('M90 150 Q 74 162 58 158', cinza2, 11) + l('M58 152 l -6 -1 M57 158 l -7 0 M58 164 l -6 2', T, 3.5) +
      // corpinho
      e(98, 126, 24, 29, cinza, 5, 8) + e(104, 134, 12, 18, '#D8D0C8', 0, 8) +
      l('M78 112 q 8 4 16 1 M76 124 q 8 4 15 1 M78 136 q 7 4 14 1', cinza2, 3) +
      // bracinho agarrado no tronco
      tc('M86 104 Q 72 98 58 98', cinza2, 10) + l('M58 92 l -6 -1 M57 98 l -7 0 M58 104 l -6 2', T, 3.5) +
      // perninha da frente
      e(112, 152, 11, 7, cinza2, 4) +
      // cabeção: os tufos brancos por trás, a cabeça escura, a testa branca
      tufo(80, 66, -1) + tufo(136, 66, 1) +
      c(108, 72, 30, cara) +
      p('M100 46 Q 108 38 116 46 Q 114 56 108 64 Q 102 56 100 46 Z', '#FFFFFF', 0) +
      e(108, 84, 19, 15, '#E7D6CC', 0) +
      e(98, 76, 7.5, 7, '#E7D6CC', 0) + e(118, 76, 7.5, 7, '#E7D6CC', 0) +
      olho(98, 76, 5.4) + olho(118, 76, 5.4) +
      c(105, 86, 1.6, T, 0) + c(111, 86, 1.6, T, 0) + l('M103 92 Q 108 96 113 92', T, 3) +
      bochecha(90, 89, 4.5, 2.8) + bochecha(126, 89, 4.5, 2.8) +
      brilho(92, 52, 7, 3.5, -30, 0.35) + brilho(84, 116, 7, 4, -30, 0.3);
  };

  // ---------------------------------------------------------------- fig52 harpia (gavião-real)
  // De frente num galho: penacho duplo, cabeça cinza-clara, colar preto, peito branco, calças listradas e pés amarelos.
  D.fig52 = () => {
    // o penacho: um leque de penas compridas de cada lado do alto da cabeça
    const pena = (ang, comp, cor) => pt(`M-8 0 C -11 ${-comp * 0.5} -8 ${-comp * 0.9} 0 ${-comp} C 8 ${-comp * 0.9} 11 ${-comp * 0.5} 8 0 Z`, cor, 4, `translate(100 72) rotate(${ang})`);
    const penacho = pena(-70, 54, '#6A6C80') + pena(-50, 64, '#3A3A4A') + pena(-30, 58, '#55566A');
    const espelho = s => `<g transform="matrix(-1 0 0 1 200 0)">${s}</g>`;
    const pe = x => l(`M${x - 8} 152 l -2 9 M${x} 153 l 0 10 M${x + 8} 152 l 2 9`, T, 4) + e(x, 150, 11, 6, '#FFC93C', 4);
    return galho(158) + folha(36, 150, -20) + folha(166, 152, 22) +
      // cauda listrada
      p('M90 146 L 84 180 Q 100 184 116 180 L 110 146 Z', '#4A4A5C') + l('M87 172 Q 100 175 113 172', '#9EA2B2', 4) +
      // asas
      p('M70 92 C 50 104 46 140 62 162 C 72 154 80 132 82 108 Z', '#5E6072') +
      p('M130 92 C 150 104 154 140 138 162 C 128 154 120 132 118 108 Z', '#5E6072') +
      l('M60 120 q 6 10 6 22 M140 120 q -6 10 -6 22', '#7E8194', 3) +
      // corpo branco com o colar preto
      e(100, 124, 32, 36, '#FFFFFF') +
      p('M70 108 C 78 96 122 96 130 108 C 122 116 78 116 70 108 Z', '#3A3A4A', 0) +
      l('M84 132 h 8 M108 132 h 8 M90 142 h 8 M102 142 h 8', '#C9CCD8', 2.6) +
      e(100, 124, 32, 36, 'none') +
      pe(86) + pe(114) +
      // penacho duplo atrás da cabeça
      penacho + espelho(penacho) +
      // cabeção
      c(100, 72, 32, '#C3C6D3') +
      e(100, 78, 25, 20, '#DDE0EA', 0) +
      olho(86, 70, 6.6) + olho(114, 70, 6.6) +
      // bico de gancho: a cera cinza e o bico preto curvado para baixo
      p('M93 82 Q 100 76 107 82 C 108 90 106 98 100 104 C 94 98 92 90 93 82 Z', '#3A3448', 3.5) +
      p('M93 82 Q 100 76 107 82 Q 104 86 100 86 Q 96 86 93 82 Z', '#8A8DA0', 0) +
      l('M102.5 89 Q 104 94 101.5 99', '#6A6680', 2) + c(97, 82.6, 1.2, T, 0) + c(103, 82.6, 1.2, T, 0) +
      bochecha(78, 84, 5, 3) + bochecha(122, 84, 5, 3) +
      brilho(86, 50, 10, 4.5, -25, 0.45) + brilho(80, 118, 8, 4, -30, 0.35);
  };

  // ---------------------------------------------------------------- fig53 jabuti
  // De lado: casco alto de placas hexagonais com o miolo amarelo, cabeça para fora e manchinhas laranja nas patas.
  D.fig53 = () => {
    const perna = (x, cor) => p(`M${x} 126 C ${x - 1} 142 ${x - 3} 156 ${x - 2} 166 Q ${x + 10} 171 ${x + 23} 166 C ${x + 23} 156 ${x + 21} 142 ${x + 20} 126 Z`, cor, 4.5) +
      c(x + 5, 146, 3.4, '#FF8A2A', 0) + c(x + 14, 154, 3.2, '#FF8A2A', 0) + c(x + 13, 140, 2.8, '#FF8A2A', 0) + c(x + 5, 159, 2.6, '#FF8A2A', 0) +
      l(`M${x + 3} 168 v -4 M${x + 10} 169 v -4 M${x + 17} 168 v -4`, T, 2.5);
    const casco = 'M24 136 C 22 86 54 52 90 52 C 126 52 158 86 156 136 Z';
    let placas = '';
    [[78, 73], [102, 73], [66, 94], [90, 94], [114, 94], [54, 115], [78, 115], [102, 115], [126, 115]].forEach(([x, y]) => {
      placas += p(hexagono(x, y, 11.6), '#7A5232', 0) + p(hexagono(x, y, 7.6), '#966A40', 0) + p(hexagono(x, y, 4.2), '#F6B53E', 0);
    });
    return e(96, 168, 80, 9, '#8BD06F') +
      // a sombra embaixo do casco (não deixa buraco entre as patas) e as patas do outro lado
      p('M34 132 L 150 132 L 148 164 L 36 164 Z', '#3E3028', 0) +
      perna(58, '#4E4038') + perna(112, '#4E4038') +
      p('M26 130 L 12 140 L 30 140 Z', '#6E5A4C', 3.5) +
      // pescoço
      tc('M138 128 C 146 120 150 112 152 104', '#6E5A4C', 20) +
      // casco: placas com o miolo amarelo e a beirada
      p(casco, '#6A4226') + placas +
      p('M24 136 C 23 130 23 126 24 122 L 156 122 C 157 126 157 130 156 136 Z', '#6B4426', 0) +
      l('M40 123 V 135 M58 123 V 135 M76 123 V 135 M94 123 V 135 M112 123 V 135 M130 123 V 135 M146 123 V 135', '#4E3020', 2.6) +
      p(casco, 'none') +
      brilho(64, 70, 14, 6, -34, 0.3) +
      // patas da frente (as de perto)
      perna(32, '#6E5A4C') + perna(128, '#6E5A4C') +
      // cabeção
      p('M136 96 C 136 80 148 72 162 72 C 176 72 184 82 182 96 C 180 108 170 114 158 114 C 144 114 136 108 136 96 Z', '#6E5A4C') +
      c(150, 80, 3.2, '#FFB13D', 0) + c(160, 77, 2.8, '#FFB13D', 0) + c(144, 90, 2.6, '#FFB13D', 0) + c(170, 79, 2.4, '#FFB13D', 0) +
      olho(164, 92, 6) + l('M160 106 Q 170 108 179 102', T, 3) + bochecha(154, 102, 5, 3) +
      brilho(148, 82, 7, 3, -30, 0.3);
  };

  // ---------------------------------------------------------------- fig54 cutia
  // Sentadinha e corcunda, de lado, roendo uma castanha-do-pará segura nas mãozinhas.
  D.fig54 = () => {
    const pelo = '#C9762E', pelo2 = '#A95E22', claro = '#F4CB92';
    const corpo = 'M40 150 C 28 120 44 84 82 76 C 112 70 132 92 130 122 C 128 152 108 166 78 166 C 58 166 46 162 40 150 Z';
    return e(100, 170, 70, 8, '#C99A62') + folha(36, 166, -12) + folha(168, 168, 14) +
      // rabinho curto
      c(36, 140, 6, pelo2, 4) +
      // pé de trás comprido no chão (pata fina)
      p('M62 160 C 76 158 100 158 116 160 Q 122 166 114 171 L 64 171 Q 56 167 62 160 Z', pelo2) +
      l('M106 165 v 6 M112 164 v 6', T, 2.5) +
      // corpo redondo e corcunda, com a coxa marcada só por uma linha
      p(corpo, pelo) +
      p('M100 98 C 118 104 124 124 116 148 C 106 156 94 150 94 138 C 92 122 92 108 100 98 Z', '#E39A52', 0) +
      p(corpo, 'none') +
      l('M58 128 C 62 112 80 108 92 118 C 98 130 92 150 84 160', pelo2, 3.2) +
      l('M52 100 l 4 -3 M62 92 l 4 -3 M72 86 l 4 -3 M48 112 l 4 -3 M58 104 l 4 -3 M44 126 l 4 -3', '#8A4A1A', 2.4) +
      brilho(60, 100, 13, 6, -40, 0.3) +
      // cabeça: focinho comprido, orelhinha redonda
      e(110, 44, 9, 11, pelo2, 4, -15) + e(110, 45, 4.5, 6, '#F2A0A0', 0, -15) +
      p('M96 74 C 94 54 108 42 126 44 C 142 46 152 56 162 66 L 172 72 Q 177 80 168 83 C 156 88 138 92 122 90 C 104 88 96 84 96 74 Z', pelo) +
      e(146, 82, 14, 6.5, claro, 0, -8) +
      c(171, 74, 3.6, T, 0) + l('M158 84 l 10 3 M158 79 l 12 -1', '#E8C8A0', 1.8) +
      olho(130, 63, 6) + bochecha(124, 78, 5, 3) + brilho(112, 52, 8, 4, -30, 0.4) +
      // braço e a castanha nas mãozinhas, bem na boca
      tc('M112 104 Q 124 116 140 110', pelo2, 9) +
      castanha(152, 100, 62, 1.25) +
      e(144, 108, 6.5, 5.5, pelo2, 3.5) + e(158, 112, 5.5, 4.5, pelo2, 3.5, 20);
  };

  // ---------------------------------------------------------------- fig55 jiboia
  // Pendurada num galho em duas alças, com as "selas" marrons nas costas, a cauda avermelhada e o cabeção largo de cobra.
  D.fig55 = () => {
    const base = '#DDC290', sela = '#7A4A2A', claro = '#F4E6C8';
    const corpo = 'M34 120 C 30 104 36 94 48 94 C 64 94 58 152 78 152 C 98 152 92 94 108 94 C 124 94 118 148 136 148 C 152 148 156 116 152 92';
    const cabeca = 'M116 60 C 116 42 134 34 152 34 C 170 34 188 42 188 60 C 188 74 172 82 152 82 C 132 82 116 74 116 60 Z';
    return p('M18 96 Q 100 88 182 98 L 181 110 Q 100 100 19 108 Z', '#8A5A34') +
      l('M40 100 q 10 -2 20 -1 M128 98 q 12 0 22 2', '#B07A4A', 2.5) + folha(28, 90, -24) + folha(174, 92, 22) +
      // a ponta da cauda, mais fina e avermelhada
      tc('M36 118 C 32 132 26 140 22 154', '#B8603E', 9) +
      '<path d="M36 118 C 32 132 26 140 22 154" fill="none" stroke="#7A3424" stroke-width="9" stroke-dasharray="5 7"/>' +
      // o corpo grosso com as selas
      tc(corpo, base, 21) +
      `<path d="${corpo}" fill="none" stroke="${sela}" stroke-width="15" stroke-dasharray="9 10" stroke-dashoffset="4"/>` +
      // cabeção largo
      tc('M152 96 L 152 80', base, 21) +
      p(cabeca, base) +
      p('M118 56 C 124 58 130 60 134 63 L 131 68 C 126 65 122 64 117 63 Z M186 56 C 180 58 174 60 170 63 L 173 68 C 178 65 182 64 187 63 Z', sela, 0) +
      e(152, 40, 9, 3.4, '#C8A672', 0) +
      e(152, 72, 24, 8, claro, 0) +
      p(cabeca, 'none') +
      olho(140, 56, 6.2) + olho(164, 56, 6.2) +
      c(148, 66, 1.5, T, 0) + c(156, 66, 1.5, T, 0) +
      l('M138 72 Q 152 80 166 72', T, 3.2) +
      l('M152 78 L 152 90 M152 90 l -4 5 M152 90 l 4 5', '#E8434D', 2.6) +
      bochecha(130, 68, 5, 3) + bochecha(174, 68, 5, 3) +
      brilho(134, 44, 9, 4, -15, 0.45);
  };

  // ---------------------------------------------------------------- fig56 sapinho-ponta-de-flecha (azul)
  // Pequeno, de lado numa folha larga: azul vivo com pintas pretas, pernas compridas e as pontinhas redondas dos dedos.
  D.fig56 = () => {
    const azul = '#3D8BFF', azul2 = '#2457C8', pinta = '#1E1A3A';
    const dedos = (pontos) => pontos.map(([x, y]) => c(x, y, 3.6, azul2, 2.5)).join('');
    return p('M18 166 C 46 132 116 116 182 120 C 156 158 82 180 18 166 Z', '#5CC84A') +
      l('M26 164 C 70 146 128 132 172 124 M70 150 l 12 -14 M110 140 l 14 -12 M80 152 l 16 6 M120 142 l 16 4', '#3E9A30', 3) +
      p('M18 166 C 46 132 116 116 182 120 C 156 158 82 180 18 166 Z', 'none') +
      c(160, 112, 4.5, '#BDEBFF', 3) + brilho(158.5, 110.5, 1.6, 1.2, 0, 0.9) +
      // perna de trás: canela e pé compridos, dobrados embaixo da coxa
      tc('M62 140 Q 70 152 90 150 L 106 148', azul2, 8) + dedos([[108, 142], [112, 148], [108, 154]]) +
      // corpo
      p('M52 126 C 48 104 70 88 98 86 C 126 84 146 98 148 116 C 148 130 128 140 100 140 C 78 140 56 138 52 126 Z', azul) +
      // coxa
      p('M50 124 C 56 112 80 114 92 128 C 88 140 66 144 54 138 C 50 134 49 129 50 124 Z', azul2, 4) +
      c(64, 128, 2.8, pinta, 0) + c(78, 134, 2.4, pinta, 0) +
      // perna da frente fininha até a folha
      tc('M124 126 L 132 146', azul2, 8) + dedos([[126, 148], [133, 151], [140, 148]]) +
      // olhos grandes no alto da cabeça
      c(116, 80, 11, azul, 4) + c(140, 82, 12, azul, 4) +
      olho(117, 80, 6.5) + olho(141, 82, 7) +
      // pintas pretas e brilhos
      c(80, 102, 5, pinta, 0) + c(96, 95, 3.5, pinta, 0) + c(64, 112, 4, pinta, 0) + c(102, 112, 3, pinta, 0) +
      c(124, 102, 3, pinta, 0) + c(112, 128, 2.6, pinta, 0) +
      l('M120 112 Q 134 120 146 112', T, 3.2) + bochecha(136, 106, 5, 3) +
      brilho(86, 92, 12, 4.5, -18, 0.45) + brilho(138, 76, 4, 2.5, -30, 0.5);
  };

  // ---------------------------------------------------------------- fig57 bromélia
  // Uma bromélia num galho: roseta de folhas compridas e pontudas e, no meio, a flor de brácteas vermelhas pontudas.
  D.fig57 = () => {
    const folhaB = (ang, comp, larg, cor, risco) => {
      const tr = `translate(100 146) rotate(${ang})`;
      const d = `M${-larg} 0 C ${-larg} ${-comp * 0.5} ${-larg * 0.2} ${-comp * 0.85} ${larg * 0.6} ${-comp} C ${larg * 0.6} ${-comp * 0.7} ${larg} ${-comp * 0.4} ${larg} 0 Z`;
      return pt(d, cor, 4.5, tr) + lt(`M0 -6 C 0 ${-comp * 0.45} ${larg * 0.1} ${-comp * 0.75} ${larg * 0.45} ${-comp * 0.92}`, risco, 2.6, tr);
    };
    const bractea = (ang, comp, cor) => pt(`M-7 0 C -7 ${-comp * 0.45} -3 ${-comp * 0.8} 0 ${-comp} C 3 ${-comp * 0.8} 7 ${-comp * 0.45} 7 0 Z`, cor, 4, `translate(100 112) rotate(${ang})`);
    let tras = '', frente = '', flor = '';
    [[-68, 72], [68, 72], [-40, 80], [40, 80]].forEach(([a, n]) => { tras += folhaB(a, n, 10, '#3E9A30', '#5CB84A'); });
    [[-84, 66], [84, 66], [-56, 76], [56, 76]].forEach(([a, n]) => { tras += folhaB(a, n, 10.5, '#5CC84A', '#8EDB76'); });
    [[-24, 44], [24, 44], [0, 34]].forEach(([a, n]) => { frente += folhaB(a, n, 11, '#5CC84A', '#8EDB76'); });
    [[-58, 42, '#E02F3E'], [58, 42, '#E02F3E'], [-38, 54, '#F0453A'], [38, 54, '#F0453A'], [-18, 66, '#E02F3E'], [18, 66, '#E02F3E'], [0, 76, '#F0453A']].forEach(([a, n, cor]) => {
      flor += bractea(a, n, cor);
    });
    return galho(160) + folha(36, 152, -24) + folha(166, 154, 22) +
      uniao(cn(70, 156, 8) + cn(84, 152, 9) + cn(118, 152, 9) + cn(132, 156, 8), '#7CC85E', 3.5) +
      tras + flor +
      // florzinhas amarelas na ponta das brácteas do meio
      c(100, 38, 4, '#FFE36B', 2.5) + c(80, 50, 3.4, '#FFE36B', 2.5) + c(120, 50, 3.4, '#FFE36B', 2.5) +
      frente +
      brilho(66, 118, 3, 9, -50, 0.3);
  };

  // ---------------------------------------------------------------- fig58 pau-brasil
  // Um tronco cortado com o miolo vermelho (a madeira que deu nome ao Brasil), espinhos, folhinhas miúdas e flores amarelas
  // com a pétala de cima riscada de vermelho.
  D.fig58 = () => {
    const flor = (x, y, s, rot) => {
      const tr = `translate(${x} ${y}) rotate(${rot}) scale(${s})`;
      let f = '';
      [[0, -9, 6.5, 8], [-9, -2, 6, 7], [9, -2, 6, 7], [-6, 8, 6, 6.5], [6, 8, 6, 6.5]].forEach(([dx, dy, rx, ry]) => { f += en(dx, dy, rx, ry); });
      return `<g transform="${tr}">` + uniao(f, '#FFD23F', 1.6) +
        l('M0 -4 L 0 -13 M-3 -5 L -5 -11 M3 -5 L 5 -11', '#E53935', 1.8) +
        l('M0 1 l -4 8 M0 1 l 0 9 M0 1 l 4 8', '#E8811F', 1.4) + c(0, 0, 2.4, '#F08A1C', 0) + '</g>';
    };
    const ramo = (x0, y0, x1, y1, n) => {
      let s = l(`M${x0} ${y0} L ${x1} ${y1}`, '#3E7A30', 2.5);
      const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
      for (let i = 1; i <= n; i++) {
        const t = i / (n + 0.5), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
        const ox = 5 * Math.cos((ang - 90) * Math.PI / 180), oy = 5 * Math.sin((ang - 90) * Math.PI / 180);
        s += e(r2(x + ox), r2(y + oy), 5.5, 3.2, '#4FA63C', 2, r2(ang - 40)) + e(r2(x - ox), r2(y - oy), 5.5, 3.2, '#4FA63C', 2, r2(ang + 40));
      }
      return s + e(r2(x1 + (x1 - x0) * 0.06), r2(y1 + (y1 - y0) * 0.06), 5.5, 3.2, '#4FA63C', 2, r2(ang));
    };
    const tronco = 'M22 140 C 22 132 30 128 40 128 L 150 128 L 150 168 L 40 168 C 30 168 22 164 22 156 Z';
    return e(100, 172, 74, 8, '#8BD06F') +
      // o galho que brota do tronco
      tc('M84 130 C 80 104 92 80 104 62', '#6E4426', 8) + tc('M94 94 C 112 90 128 82 140 70', '#6E4426', 5) +
      tc('M98 76 C 86 66 72 62 60 62', '#6E4426', 4.5) +
      ramo(60, 62, 26, 66, 3) + ramo(68, 63, 52, 38, 2) + ramo(140, 70, 172, 70, 3) +
      ramo(86, 112, 56, 104, 3) +
      // o tronco cortado: casca com espinhos e a ponta mostrando a madeira vermelha
      p(tronco, '#7A4A2E') + l('M40 140 h 30 M60 156 h 34 M104 140 h 26 M112 158 h 20', '#5A321C', 3) +
      p('M48 128 l 3 -8 l 4 8 Z M110 128 l 3 -8 l 4 8 Z M70 168 l 3 7 l 4 -7 Z M126 168 l 3 7 l 4 -7 Z', '#5A321C', 2.5) +
      e(152, 148, 22, 22, '#F2D3A0') + c(152, 148, 15, '#D8433A', 0) +
      '<circle cx="152" cy="148" r="9" fill="none" stroke="#B02A2E" stroke-width="2.4"/>' + c(152, 148, 3, '#B02A2E', 0) +
      e(152, 148, 22, 22, 'none') + brilho(146, 138, 6, 3, -35, 0.5) +
      // as flores amarelas em cacho e os botões
      flor(104, 54, 1.2, 0) + flor(126, 42, 1, 18) + flor(82, 42, 0.95, -18) + flor(146, 58, 0.85, 30) +
      c(106, 28, 4.5, '#FFD23F', 3) + c(94, 24, 4, '#FFD23F', 3) + c(134, 26, 3.6, '#FFD23F', 3) +
      brilho(48, 136, 12, 3, -4, 0.3);
  };

  // ---------------------------------------------------------------- fig59 castanheira (o ouriço da castanha-do-pará)
  // O ouriço lenhoso aberto em cima, cheio de castanhas, e duas castanhas soltas no chão (uma quebrada, com a polpa branca).
  D.fig59 = () => {
    let dentro = '';
    [[70, 82, -26], [84, 76, -12], [100, 74, 0], [116, 76, 12], [130, 82, 26], [76, 92, -18], [89, 94, -8], [111, 94, 8], [124, 92, 18], [100, 88, 0]].forEach(([x, y, r], i) => {
      dentro += castanha(x, y, r, i < 5 ? 0.95 : 1.02, i % 2 ? '#8A5230' : '#7A4626');
    });
    const folhaC = (x, y, rot) => pt('M0 0 C 14 -12 44 -14 64 0 C 44 14 14 12 0 0 Z', '#4FA63C', 4, `translate(${x} ${y}) rotate(${rot})`) +
      lt('M4 0 L 58 0', '#3E7A30', 2.5, `translate(${x} ${y}) rotate(${rot})`);
    return e(100, 170, 76, 9, '#8BD06F') +
      // folhas compridas da castanheira atrás
      folhaC(84, 140, 200) + folhaC(116, 140, -20) +
      // o ouriço: bola de casca grossa
      c(100, 116, 52, '#8A5A34') +
      c(76, 128, 2.6, '#6E4426', 0) + c(90, 150, 2.4, '#6E4426', 0) + c(118, 146, 2.6, '#6E4426', 0) + c(130, 124, 2.4, '#6E4426', 0) +
      c(104, 132, 2.2, '#6E4426', 0) + c(66, 146, 2, '#6E4426', 0) + c(140, 140, 2, '#6E4426', 0) +
      l('M60 126 Q 64 146 80 158 M140 126 Q 136 146 120 158', '#74482A', 3) +
      brilho(72, 122, 9, 15, 20, 0.2) +
      // a boca aberta: o fundo escuro, as castanhas e a beirada da frente por cima
      e(100, 92, 40, 17, '#6A4026', 4.5) +
      dentro +
      p('M60 92 C 62 104 80 112 100 112 C 120 112 138 104 140 92 C 140 100 140 106 138 110 C 128 120 72 120 62 110 C 60 106 60 100 60 92 Z', '#B07A48', 0) +
      l('M60 92 C 62 104 80 112 100 112 C 120 112 138 104 140 92', T, 4.5) +
      e(100, 116, 52, 52, 'none') +
      // castanhas soltas no chão: uma inteira e uma quebrada, com a polpa branquinha
      castanha(38, 160, -70, 1) +
      castanha(150, 162, 74, 0.95) +
      pt('M0 -13 C 7 -9 8 2 6 11 Q 0 14 -6 11 C -8 2 -7 -9 0 -13 Z', '#FFF6E2', 3.5, 'translate(170 154) rotate(56)') +
      brilho(168, 151, 4, 1.8, 56, 0.9);
  };

  PC.figurinhas.registrar(D);
})();
