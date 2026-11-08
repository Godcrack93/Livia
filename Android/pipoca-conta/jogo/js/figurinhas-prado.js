/* Pipoca Aprende — figurinhas fig31–fig40 (Prado, estações de letras).
   Mesmo estilo das fig01–fig30 (js/figurinhas.js): chibi, contorno #3A2A5A, cores chapadas, brilhos brancos.
   Cada função devolve o miolo SVG no quadro 200×200 (a borda branca do adesivo é posta pelo figurinhas.js).
   Posição no álbum: as que voam (bem-te-vi, carcará, papagaio, vaga-lume) no céu; sabiá e flor-de-maracujá no meio;
   tatu-bola, ema, gafanhoto e caju no chão. */
(function () {
  'use strict';
  const PC = window.PC;
  if (!PC || !PC.figurinhas || !PC.figurinhas.registrar) return;
  const { T, r2, c, e, p, l, tc, olho, bochecha, brilho, uniao, cn, estrela, galho, folha } = PC.figurinhas.pecas;

  const gira = (rot, x, y, s) => `<g transform="rotate(${rot} ${x} ${y})">${s}</g>`;

  PC.figurinhas.registrar({
    // ---------------------------------------------------------------- bem-te-vi: em pé no galho, peito amarelo estufado,
    // cabeça preta com a faixa branca por cima do olho, garganta branca e o bico preto forte
    fig31: () => {
      const preto = '#2E2640', marrom = '#946A44', amarelo = '#FFD23F';
      return galho(158) + folha(36, 150, -20) + folha(166, 152, 22) +
        // cauda marrom caindo atrás do galho
        p('M110 140 L 124 182 L 106 182 L 98 146 Z', marrom) + l('M112 156 L 116 176', '#7A5434', 2.5) +
        l('M94 152 L 92 162 M108 152 L 108 162', T, 4.5) +
        // corpo: barriga amarela e a asa marrom com as beiradas ruivas
        e(100, 118, 32, 36, amarelo) +
        p('M112 88 C 134 94 142 122 130 150 C 118 148 108 130 106 110 Z', marrom, 4) +
        l('M116 104 Q 128 118 126 138 M112 118 Q 120 130 120 144', '#C98A4A', 3) +
        brilho(86, 120, 9, 14, 10, 0.35) +
        // cabeça
        c(92, 68, 30, preto) +
        p('M66 76 C 74 92 92 99 106 96 C 114 93 119 86 119 79 C 104 86 82 84 66 76 Z', '#FFFFFF', 0) +
        c(92, 68, 30, 'none') +
        l('M68 58 C 82 47 104 45 118 56', '#FFFFFF', 7.5) +
        c(83, 69, 7.6, '#FFFFFF', 0) + olho(83, 69, 5.2) +
        p('M66 62 L 38 70 L 66 79 Z', '#3A3448', 4) + l('M48 70 L 64 70.5', '#5A5470', 2) +
        bochecha(98, 80, 5, 3) + brilho(100, 50, 7, 3, -10, 0.3);
    },

    // ---------------------------------------------------------------- sabiá-laranjeira cantando no chão, com uma laranja
    fig32: () => {
      const costas = '#9C8668', escuro = '#7E6A50', laranja = '#F08A3C';
      return e(104, 166, 70, 12, '#8BD06F') +
        l('M40 160 l -4 -10 M46 160 l 2 -12 M164 160 l 4 -10 M158 160 l -2 -11', '#5CA84A', 3.5) +
        // a laranja caída
        c(46, 146, 17, '#FF9F2E') + c(42, 132, 2.6, '#5CA84A', 0) +
        p('M44 130 C 50 120 62 120 64 126 C 58 132 50 132 44 130 Z', '#5CC84A', 3.5) + brilho(38, 140, 5, 3.5, -30, 0.5) +
        // cauda e perninhas
        p('M70 128 L 40 104 L 34 114 L 66 140 Z', escuro) +
        tc('M96 144 L 94 162 M110 142 L 112 162', '#C9A88A', 4) + l('M86 164 H 98 M106 164 H 118', T, 4) +
        // corpo inclinado com o peito laranja
        e(98, 122, 40, 27, costas, 5, -24) +
        e(114, 129, 24, 12, laranja, 0, -24) + e(126, 110, 11, 9, laranja, 0, -24) +
        e(98, 122, 40, 27, 'none', 5, -24) +
        e(84, 116, 22, 13, escuro, 3.5, -24) + l('M70 124 Q 82 118 96 106', '#6A5840', 2.5) +
        brilho(86, 104, 12, 4, -24, 0.3) +
        // cabeça erguida, garganta clarinha riscada, anel amarelo no olho
        c(126, 74, 25, costas) +
        e(139, 90, 9, 5, '#F6EBD8', 0, -30) + l('M136 88 l 2 3 M142 86 l 2 3', '#9C8668', 1.8) +
        c(130, 68, 8.2, '#F2C24A', 2.5) + olho(131, 68, 5) +
        // bico aberto cantando
        p('M146 62 L 174 46 L 151 70 Z', '#E2B24A', 3.5) + p('M148 76 L 174 64 L 148 82 Z', '#E2B24A', 3.5) +
        // a notinha da música, encostada no bico
        p('M170 36 C 170 30 176 28 179 30 L 182 32 L 182 24 C 182 22 178 20 174 22 Z', '#7C5CFF', 0) +
        e(166, 40, 6.5, 5, '#7C5CFF', 3, -20) + l('M172 39 L 172 18 Q 178 20 182 26', T, 3) +
        bochecha(120, 86, 5, 3) + brilho(116, 58, 8, 4, -30, 0.4);
    },

    // ---------------------------------------------------------------- tatu-bola meio enroladinho: a carapaça redonda
    // com as plaquinhas e as três cintas do meio, a carinha de capacete saindo pela fresta
    fig33: () => {
      const casca = '#D2A35E', placa = '#E6BE7E', linha = '#9E7238', pele = '#F0C9A6';
      const cx = 116, cy = 100, R = 58;
      let placas = '';
      for (let yy = cy - 48; yy <= cy + 48; yy += 13) {
        for (let xx = cx - 50; xx <= cx + 52; xx += 14) {
          const x = xx + (((yy - cy) / 13) % 2 ? 7 : 0);
          if (x > 98 && x < 136) continue;                 // as cintas do meio são lisas
          const d = Math.hypot(x - cx, yy - cy);
          if (d > R - 10) continue;
          if (x < 100 && yy > 90) continue;                // a fresta por onde sai a cabeça
          placas += `<path d="M${r2(x - 4.5)} ${r2(yy - 3)} L ${r2(x)} ${r2(yy - 6)} L ${r2(x + 4.5)} ${r2(yy - 3)} L ${r2(x + 4.5)} ${r2(yy + 3)} L ${r2(x)} ${r2(yy + 6)} L ${r2(x - 4.5)} ${r2(yy + 3)} Z"/>`;
        }
      }
      return e(108, 166, 66, 11, '#8BD06F') +
        // carapaça
        c(cx, cy, R, casca) +
        `<g fill="${placa}" stroke="${linha}" stroke-width="2" stroke-linejoin="round">${placas}</g>` +
        l('M104 44 C 92 80 92 122 104 156 M118 42 C 108 80 108 122 118 158 M132 44 C 124 80 124 122 132 156', linha, 3) +
        l('M111 52 v 4 M111 76 v 4 M110 100 v 4 M111 124 v 4 M125 60 v 4 M124 88 v 4 M125 116 v 4 M126 140 v 4', '#B88A4A', 2.5) +
        c(cx, cy, R, 'none') +
        brilho(138, 62, 16, 8, 35, 0.35) +
        // a fresta escura, o rabinho de placas e as patinhas
        p('M60 108 C 70 96 92 98 100 116 C 106 132 100 150 86 156 C 70 158 56 140 60 108 Z', '#7A5434', 0) +
        p('M98 150 L 116 160 L 100 166 Z', casca, 3.5) +
        e(66, 160, 11, 6.5, pele, 4) + e(92, 162, 11, 6.5, pele, 4) +
        l('M60 161 v 4 M66 162 v 4 M72 161 v 4 M86 163 v 4 M92 164 v 4 M98 163 v 4', T, 2.2) +
        // orelhinhas, cabeça e o capacete de placas
        e(86, 98, 6.5, 9, pele, 4, 28) + e(86, 99, 2.8, 5, '#E8A0A0', 0, 28) +
        e(72, 97, 6, 8.5, pele, 4, -10) +
        p('M46 130 C 44 116 56 104 72 104 C 88 104 98 116 96 130 C 94 144 82 152 68 152 C 56 152 48 142 46 130 Z', pele) +
        // focinho comprido e o capacete de placas na testa
        p('M52 128 C 44 126 34 130 26 136 C 30 144 44 146 54 142 Z', pele) + c(27, 136, 4.2, '#E07A8A', 0) +
        p('M50 120 C 52 104 66 96 80 97 C 92 98 99 108 97 120 C 84 112 64 112 50 120 Z', casca, 4) +
        l('M62 103 L 64 113 M74 100 V 111 M86 102 L 84 112', linha, 2.2) +
        olho(66, 128, 5.4) + bochecha(76, 141, 6, 3.5) + l('M36 142 Q 42 146 47 142', T, 2.6);
    },

    // ---------------------------------------------------------------- ema: alta, pescoço comprido, corpo de penas
    // desgrenhadas, pernas grossas de três dedos
    fig34: () => {
      const pena = '#A9A097', pena2 = '#8E857C', pesc = '#C9C1B8', perna = '#C4B6A6';
      // corpo de ovo com a traseira mais alta e a barra de penas desgrenhadas caindo
      const corpo = 'M84 112 C 82 92 104 80 130 82 C 154 84 172 92 174 106 C 176 118 170 126 162 130 L 156 142 L 148 134 ' +
        'L 140 148 L 132 136 L 122 150 L 114 136 L 104 148 L 98 134 L 88 140 C 84 132 83 122 84 112 Z';
      return e(110, 172, 58, 8, '#8BD06F') +
        tc('M110 132 L 102 168 M132 132 L 136 168', perna, 9) +
        l('M88 172 L 102 168 L 112 172 M101 168 L 99 174 M124 172 L 136 168 L 148 172 M137 168 L 138 174', T, 4.5) +
        // o pescoção, com a base preta (entra por trás do corpo)
        tc('M98 114 C 80 98 72 78 66 58', pesc, 18) +
        l('M98 114 C 92 108 88 102 85 96', '#2E2640', 18) +
        p(corpo, pena) +
        l('M100 130 L 98 140 M114 134 L 116 144 M130 134 L 132 144 M146 130 L 150 140 M160 124 L 164 132', pena2, 3) +
        l('M108 104 Q 128 112 150 102 M118 120 Q 138 124 160 112 M140 94 Q 156 96 168 104', pena2, 3) +
        brilho(116, 92, 16, 5, -8, 0.3) +
        // a cabeça pequena (mas fofa) e o bico chato
        c(62, 44, 19, pesc) + p('M48 32 C 54 24 70 24 78 32 C 70 30 56 30 48 32 Z', pena2, 0) +
        p('M44 44 L 22 48 Q 20 55 28 55 L 46 54 Z', '#D9B49A', 3.5) + l('M28 51 L 44 50', '#B88E74', 2) +
        olho(58, 41, 5.4) + bochecha(64, 54, 5, 3) + brilho(66, 32, 6, 3, 20, 0.4);
    },

    // ---------------------------------------------------------------- carcará voando de lado, asas para cima:
    // boné preto, cara vermelho-alaranjada, bico de gancho, peito riscadinho e rabo claro de ponta escura
    fig35: () => {
      const asaCor = '#4A3A34', asaTras = '#3A2C28', creme = '#F4EAD8';
      // (desenhado um pouco acima e descido 10 para ficar no meio do quadro); a asa de trás
      return '<g transform="translate(0 10)">' + p('M84 106 C 70 82 60 58 58 32 Q 61 25 67 30 Q 70 22 76 28 Q 81 23 85 31 C 92 60 98 86 100 106 Z', asaTras) +
        // rabo claro de ponta escura
        p('M72 110 L 24 98 L 22 124 L 72 126 Z', '#EDE2CC') + p('M33.5 100.9 L 24 98 L 22 124 L 32.5 124.4 Z', asaCor, 0) +
        l('M44 104 L 44 124 M56 107 L 56 125', '#B8A890', 2.5) + p('M72 110 L 24 98 L 22 124 L 72 126 Z', 'none') +
        // patas amarelas encolhidas
        tc('M98 130 L 92 146 M110 130 L 108 146', '#FFC93C', 5) + l('M86 148 H 96 M102 148 H 112', T, 4) +
        // corpo escuro com o peito creme riscadinho
        e(98, 116, 36, 21, '#4A3A34', 5, -8) +
        p('M112 100 C 124 98 134 108 132 120 C 126 128 114 126 108 118 Z', creme, 0) +
        l('M114 106 h 6 M122 110 h 6 M112 114 h 6 M120 119 h 6', '#6A5650', 2.4) +
        e(98, 116, 36, 21, 'none', 5, -8) +
        l('M70 118 Q 88 124 106 122', '#6A5650', 2.5) +
        // a asa da frente levantada
        p('M90 110 C 82 84 84 56 96 28 Q 99 20 105 25 Q 109 17 115 23 Q 121 18 124 27 Q 131 26 130 34 C 128 64 120 92 108 114 Z', asaCor) +
        e(112, 40, 14, 7, '#D8C8B0', 0, -6) + l('M106 36 L 107 44 M113 35 L 114 44 M120 35 L 120 43', '#9C8C78', 2) +
        l('M96 98 Q 100 78 108 64 M104 104 Q 110 86 118 72', '#6A5650', 2.5) +
        brilho(100, 76, 4, 14, 15, 0.25) +
        // pescoço e cabeça: boné preto, cara vermelho-alaranjada e o bico claro de gancho
        tc('M114 108 Q 126 100 136 94', creme, 20) +
        c(144, 86, 22, creme) +
        p('M123 82 C 122 70 132 63 145 64 C 157 64 165 71 165 79 C 151 75 136 77 123 82 Z', '#2E2640', 0) +
        p('M128 70 L 116 66 L 124 80 Z', '#2E2640', 3) +
        p('M146 81 C 152 78 160 79 165 82 L 164 96 C 156 98 148 95 146 89 Z', '#FF6A3D', 0) +
        c(144, 86, 22, 'none') +
        olho(152, 86, 5) + bochecha(140, 98, 5, 3) +
        p('M162 80 C 174 77 183 86 180 100 C 177 95 172 93 167 94 L 162 95 Z', '#C9D8E6', 3.5) +
        p('M162 95 L 172 95 L 164 101 Z', '#C9D8E6', 3) + l('M168 82 Q 174 84 177 90', '#9AAEC2', 2) +
        brilho(138, 70, 7, 3, -10, 0.35) + '</g>';
    },

    // ---------------------------------------------------------------- papagaio-verdadeiro no galho segurando uma
    // pitanga com o pé: verde, testa azul, cara amarela, ombro vermelho, bico preto de gancho
    fig36: () => {
      const verde = '#3DBE5A', verde2 = '#2E9A48';
      return galho(158) + folha(36, 150, -20) +
        // cauda
        p('M86 140 L 66 180 L 86 182 L 100 146 Z', verde) + p('M70.5 172 L 66 180 L 86 182 L 89 175 Z', '#C8E05A', 0) +
        p('M86 140 L 66 180 L 86 182 L 100 146 Z', 'none') +
        l('M96 154 L 94 162', T, 4.5) +
        // corpo e asa
        e(102, 116, 32, 38, verde) +
        e(112, 128, 16, 18, '#7ED87A', 0) +
        e(86, 116, 17, 30, verde2, 3.5, 10) +
        e(90, 92, 9, 5.5, '#E8453C', 0, 40) +
        l('M78 120 Q 82 134 90 142 M84 112 Q 88 128 96 138', '#2F7AC8', 3) +
        // a perna erguida com a pitanga
        tc('M114 146 C 128 142 136 128 138 116', '#8A8A9A', 6) +
        c(146, 108, 9, '#E8434D', 4) + l('M141 104 Q 146 100 151 104', '#B8243A', 2) + l('M146 99 L 147 94', '#5CA84A', 3) +
        tc('M136 116 Q 135 107 140 102 M139 117 Q 147 119 152 113', '#8A8A9A', 3.5, 3.5) +
        brilho(84, 104, 6, 12, 10, 0.25) +
        // cabeça
        c(116, 68, 28, verde) +
        p('M104 46 C 116 40 132 44 140 54 C 130 56 116 54 106 52 Z', '#4DA3FF', 0) +
        p('M114 56 C 130 52 144 62 142 78 C 138 90 120 92 112 82 C 106 74 106 62 114 56 Z', '#FFD23F', 0) +
        c(116, 68, 28, 'none') +
        c(125, 66, 7.4, '#FFFFFF', 0) + olho(125.5, 66, 5.2) +
        // bico preto de gancho
        p('M139 62 C 154 58 164 70 160 88 C 156 82 150 80 142 80 Z', '#3A3448', 3.5) +
        p('M141 80 C 148 80 152 82 154 86 C 150 90 144 90 140 86 Z', '#3A3448', 3) +
        l('M146 64 Q 152 66 155 72', '#6A6280', 2) +
        bochecha(124, 80, 5, 3) + brilho(104, 52, 8, 4, -30, 0.35);
    },

    // ---------------------------------------------------------------- vaga-lume voando de noite, o bumbum aceso
    fig37: () => {
      const ceu = c(100, 100, 76, '#2F3B78') +
        p(estrela(52, 62, 6, 2.6), '#FFFFFF', 0) + p(estrela(150, 46, 5, 2.2), '#FFE84A', 0) + p(estrela(48, 132, 4.5, 2), '#FFE84A', 0) +
        c(70, 40, 2.2, '#FFFFFF', 0) + c(160, 120, 2.2, '#FFFFFF', 0) + c(40, 100, 1.8, '#FFFFFF', 0) + c(128, 164, 2, '#FFFFFF', 0) +
        brilho(64, 56, 18, 8, -40, 0.12);
      const bicho = gira(-28, 100, 100,
        // a luz em volta do bumbum
        l('M100 123 V 118 M121 129 L 125 125 M127 150 H 132 M121 171 L 125 175 M100 177 V 182 M79 171 L 75 175 M73 150 H 68 M79 129 L 75 125', '#FFE84A', 3.5) +
        c(100, 150, 22, '#FFF3A0', 0) +
        // asas finas abertas (atrás) e as capinhas duras abertas para os lados
        e(62, 108, 12, 28, '#E6F4FF', 3.5, -46) + l('M56 98 L 70 118', '#BFE2F7', 2.4) +
        e(138, 108, 12, 28, '#E6F4FF', 3.5, 46) + l('M144 98 L 130 118', '#BFE2F7', 2.4) +
        // perninhas
        l('M88 112 L 78 120 M88 122 L 80 132 M112 112 L 122 120 M112 122 L 120 132', T, 3.5) +
        // barriga com as faixinhas e a ponta acesa
        e(100, 122, 16, 30, '#7A5A48') +
        p('M84.6 130 C 92 134 108 134 115.4 130 C 114 144 108 152 100 152 C 92 152 86 144 84.6 130 Z', '#FFE84A', 0) +
        l('M85 112 Q 100 116 115 112 M84.5 121 Q 100 125 115.5 121', '#5A4234', 2.4) +
        e(100, 122, 16, 30, 'none') + brilho(95, 140, 6, 4, -20, 0.7) +
        e(76, 92, 9, 22, '#3A3448', 4, -40) +
        e(124, 92, 9, 22, '#3A3448', 4, 40) +
        // escudinho laranja com a pinta vermelha e a cabeça
        e(100, 82, 18, 11, '#FFB36B', 4) + e(100, 82, 6, 4, '#E8453C', 0) +
        l('M92 54 Q 88 46 82 44 M108 54 Q 112 46 118 44', T, 3.5) + c(82, 44, 4, T, 0) + c(118, 44, 4, T, 0) +
        c(100, 64, 17, '#4A3A5A', 4.5) +
        e(92, 62, 6.5, 7.5, '#FFFFFF', 0) + e(108, 62, 6.5, 7.5, '#FFFFFF', 0) + olho(93, 63.5, 4) + olho(109, 63.5, 4) +
        bochecha(88, 72, 3.5, 2.2) + bochecha(112, 72, 3.5, 2.2) + l('M96 73 Q 100 76 104 73', '#FFFFFF', 2.2));
      return ceu + `<g transform="translate(-6 -10)">${bicho}</g>`;
    },

    // ---------------------------------------------------------------- gafanhoto verde de lado numa folha, com a
    // perna de trás bem grande dobrada para pular
    fig38: () => {
      const verde = '#7CCB3A', verde2 = '#5BAA2E', claro = '#C8F08A';
      const corpo = 'M48 112 C 46 98 70 94 100 96 L 130 96 C 138 112 132 124 122 126 L 70 126 C 56 126 48 120 48 112 Z';
      // listrinhas em espinha na coxa (de través ao eixo da coxa, que sobe para trás a 32°)
      const ux = Math.cos(32 * Math.PI / 180), uy = Math.sin(32 * Math.PI / 180);
      let listras = '';
      [-18, -8, 2, 12].forEach(t => {
        const x = 78 + ux * t, y = 102 + uy * t;
        listras += `M${r2(x - uy * 7 - ux * 3)} ${r2(y + ux * 7 - uy * 3)} L ${r2(x)} ${r2(y)} L ${r2(x + uy * 7 - ux * 3)} ${r2(y - ux * 7 - uy * 3)} `;
      });
      return p('M18 166 C 60 150 140 148 182 158 C 140 170 60 176 18 166 Z', '#4FB83F') + l('M30 165 Q 100 158 172 158', '#3E9A30', 2.5) +
        // pernas do outro lado
        l('M118 122 L 124 140 L 120 158 M100 124 L 96 142 L 90 158', verde2, 4.5) +
        // corpo comprido
        p(corpo, verde) +
        p('M56 120 C 70 124 110 124 124 120 L 122 126 L 70 126 C 62 126 58 124 56 120 Z', claro, 0) +
        p(corpo, 'none') +
        // as asinhas compridas por cima das costas
        p('M44 104 C 70 86 112 84 128 90 L 126 100 C 104 100 74 104 46 112 Z', '#68B93A', 4) +
        l('M56 102 Q 86 92 120 93', '#4E9A28', 2.2) +
        // a perna de trás: a canela dobrada até a folha e a coxa grossa por cima
        tc('M50 86 L 66 154', '#6BB82E', 5) + l('M56 108 l -5 1 M60 124 l -5 1 M63 138 l -5 1', T, 2.2) +
        l('M62 157 L 80 157', T, 4.5) +
        e(78, 102, 33, 12, verde, 5, 32) + l(listras, verde2, 2.4) +
        brilho(70, 92, 12, 3.5, 32, 0.4) +
        // pernas da frente
        l('M128 120 L 136 138 L 132 158 M112 122 L 112 140 L 106 158', T, 4.5) +
        // cabeça grandona, de pé, com o olhão e as anteninhas
        l('M134 72 C 128 56 118 46 104 42 M144 68 C 144 52 138 40 126 32', T, 3.5) +
        e(144, 94, 23, 28, '#8ED84A') +
        p('M126 114 C 134 122 156 122 162 110 C 158 106 152 106 148 110 C 140 114 132 114 126 114 Z', claro, 0) +
        e(144, 94, 23, 28, 'none') +
        e(124, 98, 12, 14, verde2, 4) +
        c(146, 84, 9, '#FFFFFF', 0) + olho(147, 85, 6) +
        l('M152 108 Q 157 112 162 108', T, 3) + bochecha(140, 104, 5, 3) + brilho(136, 72, 7, 3.5, -30, 0.45);
    },

    // ---------------------------------------------------------------- caju pendurado no galho, com a castanha embaixo
    fig39: () => {
      const fruta = 'M66 64 C 64 46 136 46 134 64 C 138 92 130 116 118 128 C 110 136 90 136 82 128 C 70 116 62 92 66 64 Z';
      return p('M20 34 Q 100 24 180 36 L 179 46 Q 100 34 21 44 Z', '#8A5A34') +
        e(52, 44, 22, 11, '#4FB83F', 4, 16) + l('M34 40 L 70 48', '#3E9A30', 2.4) +
        e(150, 50, 24, 12, '#5CC84A', 4, -22) + l('M130 58 L 170 42', '#3E9A30', 2.4) +
        tc('M100 32 L 100 52', '#8A5A34', 7) +
        // a fruta: vermelha com o lado amarelinho
        p(fruta, '#F2453A') +
        p('M112 52 C 126 54 134 58 134 64 C 138 92 130 116 118 128 C 112 132 108 133 104 134 C 116 112 122 84 112 52 Z', '#FFB72E', 0) +
        p(fruta, 'none') +
        e(100, 52, 10, 5, '#8A5A34', 3.5) +
        brilho(80, 76, 7, 18, 8, 0.45) + brilho(84, 104, 3.5, 6, 8, 0.4) +
        c(96, 88, 1.6, '#B8202A', 0) + c(108, 100, 1.6, '#B8202A', 0) + c(90, 114, 1.6, '#B8202A', 0) +
        // a castanha
        p('M94 130 C 110 128 120 140 118 156 C 116 172 98 180 86 172 C 80 166 86 160 92 154 C 98 148 88 136 94 130 Z', '#A99A6E') +
        p('M102 136 C 112 142 114 156 108 166 C 106 160 106 148 102 136 Z', '#C7BA8E', 0) +
        brilho(106, 146, 3, 7, 10, 0.4);
    },

    // ---------------------------------------------------------------- flor-de-maracujá: pétalas brancas, a coroa de
    // franjas roxas e brancas, e o miolo verde com os estames amarelos e os três estiletes; folha e gavinha
    fig40: () => {
      const cx = 100, cy = 92;
      let tras = '', frente = '', franjaRoxa = '', franjaBranca = '', franjaPonta = '', estames = '', estiletes = '';
      for (let i = 0; i < 5; i++) {
        const a1 = i * 72 + 36, b1 = a1 * Math.PI / 180;
        tras += e(r2(cx + 40 * Math.sin(b1)), r2(cy - 40 * Math.cos(b1)), 13, 30, '#E6F2DC', 4, a1);
        const a2 = i * 72, b2 = a2 * Math.PI / 180;
        frente += e(r2(cx + 40 * Math.sin(b2)), r2(cy - 40 * Math.cos(b2)), 14, 30, '#FFFFFF', 4.5, a2);
      }
      for (let i = 0; i < 36; i++) {
        const a = i * 10 * Math.PI / 180, s = Math.sin(a), co = Math.cos(a), torce = (i % 2 ? 2 : -2);
        const pt = r => `${r2(cx + r * s)} ${r2(cy - r * co)}`;
        const ptT = (r, t) => `${r2(cx + r * s + t * co)} ${r2(cy - r * co + t * s)}`;
        franjaRoxa += `M${pt(12)} L ${pt(22)} `;
        franjaBranca += `M${pt(22)} L ${pt(27)} `;
        franjaPonta += `M${pt(27)} Q ${ptT(33, torce)} ${pt(40)} `;
      }
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 + 18) * Math.PI / 180;
        const x = r2(cx + 17 * Math.sin(a)), y = r2(cy - 17 * Math.cos(a));
        estames += l(`M${cx} ${cy} L ${x} ${y}`, '#8CC84A', 2.6) + e(x, y, 6, 3.6, '#FFD23F', 2.2, r2(i * 72 + 18 + 90));
      }
      [[-10, -22], [0, -25], [10, -22]].forEach(([dx, dy]) => {
        estiletes += l(`M${cx} ${cy - 2} Q ${cx + dx * 0.4} ${cy + dy * 0.6} ${cx + dx} ${cy + dy}`, '#6A2E6A', 3.2) + c(cx + dx, cy + dy, 3.8, '#6A2E6A', 0);
      });
      return tc('M146 160 C 138 152 128 144 118 136', '#4FB83F', 6) +
        // folha de três lobos
        uniao(['156 144 9 19 32', '165 160 9 18 90', '158 172 8 12 140'].map(v => {
          const [x, y, rx, ry, rot] = v.split(' ');
          return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})"/>`;
        }).join('') + cn(150, 160, 9), '#5CC84A', 4) +
        l('M148 160 L 162 132 M148 160 L 180 160 M148 160 L 164 177', '#3E9A30', 2.4) +
        // gavinha enroladinha
        l('M36 168 C 40 150 58 150 56 160 C 54 168 44 164 46 158', '#4FB83F', 3.5) + l('M36 168 C 34 172 30 176 26 178', '#4FB83F', 3.5) +
        l('M58 144 C 50 152 42 160 36 168', '#4FB83F', 3.5) +
        tras + frente +
        brilho(r2(cx - 30), r2(cy - 34), 5, 12, -36, 0.5) +
        l(franjaPonta, '#9B5BD0', 3) + l(franjaBranca, '#FFFFFF', 3) + l(franjaRoxa, '#5B2A86', 3.2) +
        c(cx, cy, 12, '#5B2A86', 0) + c(cx, cy, 7.5, '#B8E07A', 3) +
        estames + estiletes;
    },
  });
})();
