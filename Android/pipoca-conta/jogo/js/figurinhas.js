/* Pipoca Aprende — as 60 figurinhas do álbum (PROJETO.md 7.1): fauna e flora do Brasil, uma por estação.
   fig01–fig30 são as das estações de números (fig01–fig10 Prado, fig11–fig20 Lagoa, fig21–fig30 Floresta) e
   fig31–fig60 as das estações de letras (fig31–fig40 Prado, fig41–fig50 Lagoa, fig51–fig60 Floresta). Dono: agente do álbum.
   Os desenhos de fig31–fig59 ficam em js/figurinhas-prado.js, figurinhas-lagoa.js e figurinhas-floresta.js, que usam
   PC.figurinhas.registrar({ fig31: () => desenho }) e as peças de PC.figurinhas.pecas (as mesmas deste arquivo).

   PC.figurinhas.lista        -> [{ id: 'fig01', nome: 'ipê-amarelo', regiao: 'prado', materia: 'numeros', tipo: 'planta', fala? }, ...]
                                 tipo: planta | fungo | ave | mamifero | inseto | peixe | anfibio | reptil | pipoca
                                 (o álbum escolhe o som e o jeito do pulinho pelo tipo)
   PC.figurinhas.desenho(id)  -> texto SVG (viewBox 0 0 200 200): adesivo recortado — o desenho com contorno #3A2A5A,
                                 uma borda branca que acompanha a silhueta, um fio escuro por fora e uma sombrinha.
                                 Sem ids (a mesma figurinha pode aparecer duas vezes na página) e em XML válido, com
                                 xmlns (o mapa usa como <img src="data:...">). Id desconhecido: adesivo de estrelinha.
   PC.figurinhas.obter(id)    -> o item da lista (ou null)
   PC.figurinhas.fala(id)     -> o que a Pipoca diz ao tocar na figurinha ("Ipê-amarelo!"), sem algarismos
   PC.figurinhas.daRegiao(r)  -> as 20 figurinhas da região, na ordem (10 de números e 10 de letras)

   Regras (PROJETO.md 2 e 7.1): desenho próprio, fofo e simples; nenhum número como personagem, nenhum cubinho com
   rosto. Bichos têm cara de bicho (bico, patas, rabo), as plantas não têm rosto. A fig30 é a Pipoca (PC.arte.pipoca)
   com uma medalha de estrela; a fig60 é a Pipoca lendo um livro. */
(function () {
  'use strict';
  const PC = window.PC;

  const T = '#3A2A5A';                // contorno
  const BORDA = 8.5;                  // borda branca do adesivo, além do contorno do desenho
  const FIO = 3.5;                    // fio escuro por fora da borda branca
  const r2 = v => Math.round(v * 100) / 100;

  // ======================================================================== peças de desenho (texto SVG)
  const tinta = sw => (sw ? ` stroke="${T}" stroke-width="${sw}"` : '');
  const giro = (rot, x, y) => (rot ? ` transform="rotate(${rot} ${x} ${y})"` : '');
  /** Círculo, elipse e caminho com contorno (sw = 0: sem contorno). */
  const c = (x, y, r, cor, sw = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${cor}"${tinta(sw)}/>`;
  const e = (x, y, rx, ry, cor, sw = 5, rot = 0) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${giro(rot, x, y)} fill="${cor}"${tinta(sw)}/>`;
  const p = (d, cor, sw = 5) => `<path d="${d}" fill="${cor}"${sw ? tinta(sw) + ' stroke-linejoin="round"' : ''}/>`;
  /** Traço sem preenchimento. */
  const l = (d, cor = T, sw = 5) => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  /** Traço grosso com contorno (perna, cauda, caule): o contorno por baixo e a cor por cima. */
  const tc = (d, cor, w, sw = 5) => l(d, T, w + sw) + l(d, cor, w);
  const olho = (x, y, r = 5) => c(x, y, r, T, 0) + c(r2(x + r * 0.34), r2(y - r * 0.36), r2(r * 0.42), '#FFFFFF', 0) +
    c(r2(x - r * 0.34), r2(y + r * 0.4), r2(r * 0.17), '#FFFFFF', 0);
  const bochecha = (x, y, rx = 7, ry = 4.5) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA0" opacity=".55"/>`;
  const brilho = (x, y, rx, ry, rot = 0, op = 0.35) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${giro(rot, x, y)} fill="#FFFFFF" opacity="${op}"/>`;
  /** Várias formas "nuas" (sem cor) com um contorno só, por fora (copa de árvore, juba, pétalas). */
  const uniao = (formas, cor, sw = 5) =>
    `<g fill="${T}" stroke="${T}" stroke-width="${sw * 2}" stroke-linejoin="round">${formas}</g><g fill="${cor}">${formas}</g>`;
  const cn = (x, y, r) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(r)}"/>`;
  /** Florzinha de cinco pétalas (s = escala). */
  function florzinha(x, y, s, petala, miolo) {
    let f = '';
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180;
      f += cn(x + Math.cos(a) * 6.4 * s, y + Math.sin(a) * 6.4 * s, 5.4 * s);
    }
    return uniao(f, petala, r2(1.3 * s)) + c(x, y, r2(3.4 * s), miolo, r2(2 * s));
  }
  /** Estrela de cinco pontas (caminho). */
  function estrela(x, y, R, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R;
      d += (i ? ' L ' : 'M') + r2(x + q * Math.cos(a)) + ' ' + r2(y + q * Math.sin(a));
    }
    return d + ' Z';
  }
  /** Galho horizontal (para pássaros e bichos de árvore). */
  const galho = (y, cor = '#8A5A34') => p(`M22 ${y} Q 100 ${y - 10} 178 ${y + 2} L 177 ${y + 12} Q 100 ${y} 23 ${y + 10} Z`, cor);
  /** Folhinha (com o veio) num galho. */
  const folha = (x, y, rot) => e(x, y, 12, 6, '#5CC84A', 3.5, rot) +
    `<path d="M${x - 8} ${y} H ${x + 8}"${giro(rot, x, y)} fill="none" stroke="#3E9A30" stroke-width="2" stroke-linecap="round"/>`;
  const agua = (x, y, rx, ry) => e(x, y, rx, ry, '#5EC8E8');

  // ======================================================================== silhueta do adesivo
  // A borda branca segue o desenho: o mesmo desenho é repetido por baixo com um traço grosso de uma cor só.
  // Cada elemento ganha um traço igual ao dele mais 2 × folga (assim pernas e caudas finas também ganham borda).
  const TAG = /<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g;
  const ATRIB = /\s+([\w:-]+)="([^"]*)"/g;
  const FORA = /^(opacity|fill-opacity|stroke-opacity|stroke-dasharray|class|style)$/;
  function silhueta(desenho, cor, folga) {
    return desenho.replace(TAG, (tudo, tag, atribs, fecha) => {
      let sw = null, contorno = null, preenche = null, resto = '';
      atribs.replace(ATRIB, (m, k, v) => {
        if (k === 'stroke-width') sw = parseFloat(v);
        else if (k === 'stroke') contorno = v;
        else if (k === 'fill') preenche = v;
        else if (!FORA.test(k)) resto += ` ${k}="${v}"`;
        return '';
      });
      if (preenche != null) resto += preenche === 'none' ? ' fill="none"' : ` fill="${cor}"`;
      if (contorno != null) resto += ` stroke="${cor}"`;
      if (sw != null) resto += ` stroke-width="${r2((contorno === 'none' ? 0 : sw) + 2 * folga)}"`;
      return `<${tag}${resto}${fecha}>`;
    });
  }
  /**
   * Monta o adesivo: sombrinha, fio escuro, borda branca e o desenho.
   * k = escala do desenho dentro do quadro 200×200 (a borda fica com a mesma espessura em qualquer escala).
   */
  function adesivo(desenho, { k = 1, transform = '' } = {}) {
    const caixa = s => (transform ? `<g transform="${transform}">${s}</g>` : s);
    const camada = (cor, folga) => `<g fill="${cor}" stroke="${cor}" stroke-width="${r2(2 * folga)}" stroke-linejoin="round" stroke-linecap="round">` +
      silhueta(desenho, cor, folga) + '</g>';
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      `<g transform="translate(1.5 4.5)" opacity=".16">${caixa(camada(T, (BORDA + FIO + 0.5) / k))}</g>` +
      caixa(camada(T, (BORDA + FIO) / k)) + caixa(camada('#FFFFFF', BORDA / k)) + caixa(desenho) + '</svg>';
  }

  // ======================================================================== os desenhos (quadro 200×200)
  // Tudo cabe entre ~18 e ~182 (a borda branca, o fio e a sombra ocupam o resto).
  const D = {};

  // ---------------------------------------------------------------- Prado
  D.fig01 = () => {                                   // ipê-amarelo
    const copa = [cn(100, 48, 22), cn(74, 62, 26), cn(126, 62, 26), cn(62, 94, 26), cn(138, 94, 26), cn(100, 78, 40),
      cn(82, 108, 20), cn(118, 108, 20)].join('');
    return e(100, 164, 56, 11, '#8BD06F') +
      florzinha(68, 162, 0.55, '#FFE36B', '#F08A1C') + florzinha(136, 165, 0.5, '#FFE36B', '#F08A1C') +
      p('M88 164 Q 94 144 92 128 Q 82 118 76 106 L 88 100 Q 94 112 100 118 Q 107 108 115 100 L 126 108 Q 113 118 108 130 Q 106 146 112 164 Z', '#8A5A34') +
      l('M98 140 Q 101 150 99 158', '#6E4426', 3) +
      uniao(copa, '#FFD23F') +
      `<g fill="#F7B910">${cn(62, 104, 13) + cn(138, 104, 13) + cn(100, 106, 11)}</g>` +
      brilho(84, 50, 14, 7, -20, 0.5) + brilho(124, 44, 8, 5, 15, 0.45) +
      florzinha(80, 72, 1, '#FFF3B0', '#F08A1C') + florzinha(122, 58, 0.9, '#FFF3B0', '#F08A1C') +
      florzinha(104, 96, 0.95, '#FFF3B0', '#F08A1C') + florzinha(58, 92, 0.8, '#FFF3B0', '#F08A1C') +
      florzinha(142, 88, 0.85, '#FFF3B0', '#F08A1C') + florzinha(100, 42, 0.75, '#FFF3B0', '#F08A1C');
  };

  D.fig02 = () =>                                     // joão-de-barro gordinho em cima do seu forninho de barro
    p('M22 160 Q 100 150 178 162 L 177 172 Q 100 162 23 170 Z', '#8A5A34') + folha(34, 152, -25) + folha(168, 154, 20) +
    p('M30 162 C 30 116 56 96 92 96 C 128 96 154 116 154 162 Z', '#D9945A') +
    p('M126 104 C 144 116 154 136 154 162 L 136 162 C 138 140 134 120 126 104 Z', '#C27C45', 0) +
    p('M30 162 C 30 116 56 96 92 96 C 128 96 154 116 154 162 Z', 'none') +
    l('M44 136 Q 54 132 64 135 M118 122 Q 128 120 138 124 M124 146 Q 134 142 144 146 M42 154 Q 50 152 58 154', '#B8743E', 4) +
    brilho(56, 118, 12, 6, -35, 0.3) +
    p('M70 162 C 70 142 78 130 92 130 C 106 130 114 142 114 162 Z', '#5A3220', 4.5) +
    p('M79 162 C 79 149 85 141 92 141 C 99 141 105 149 105 162 Z', '#40220F', 0) +
    // o passarinho: rabo, corpo, asa e cabeção
    p('M76 84 L 44 70 L 56 92 Z', '#A65E2E', 4) +
    e(96, 80, 30, 21, '#C4733A', 5, -6) + e(104, 88, 18, 10, '#F3D7B0', 0, -6) +
    e(86, 76, 17, 10, '#A65E2E', 3.5, -10) + l('M76 78 q 8 4 18 2', '#8A4A22', 2.5) +
    c(124, 52, 25, '#C4733A') +
    e(131, 66, 13, 7, '#F3D7B0', 0) +
    l('M106 42 Q 120 32 138 37', '#F3D7B0', 3.5) +
    p('M146 49 L 172 54 L 146 60 Z', '#E0B070', 3.5) +
    olho(134, 48, 6) + bochecha(122, 62, 5.5, 3.2) + brilho(112, 38, 8, 4, -30, 0.45);

  D.fig03 = () => {                                   // tamanduá-bandeira de cabeção, com o rabo de bandeira
    const pernaD = x => `M${x} 126 L ${x - 1} 158 Q ${x - 1} 166 ${x + 5} 166 L ${x + 14} 166 Q ${x + 19} 165 ${x + 17} 158 L ${x + 16} 126 Z`;
    const pernaBranca = x => p(pernaD(x), '#F4EEE2', 0) + p(`M${x - 1} 142 H ${x + 17} V 150 H ${x - 1} Z`, '#2E2640', 0) + p(pernaD(x), 'none');
    const cabeca = 'M118 96 C 116 78 130 68 146 72 C 156 75 162 86 168 98 L 180 114 Q 184 124 175 125 C 162 123 148 118 136 114 C 124 110 119 104 118 96 Z';
    return p('M72 104 C 46 112 22 98 20 70 C 19 52 28 38 42 34 C 50 56 64 80 88 96 Z', '#6E5848') +
      l('M34 48 Q 42 72 62 92 M26 64 Q 34 84 52 98 M44 40 Q 52 62 70 84', '#8C7462', 3) +
      p(pernaD(54), '#7A6654') + pernaBranca(110) +
      e(94, 114, 46, 30, '#A08A74') +
      e(96, 130, 30, 8, '#BBA68E', 0) +
      p('M132 124 L 86 86 L 102 80 L 142 112 Z', '#FFFFFF', 0) +
      p('M132 119 L 91 86 L 99 83 L 140 110 Z', '#2E2640', 0) +
      e(94, 114, 46, 30, 'none') +
      p(pernaD(70), '#8A7562') + pernaBranca(126) +
      e(128, 76, 7, 6, '#A08A74', 4) + e(128, 76, 3, 2.6, '#7A6654', 0) +
      p(cabeca, '#AE987F') +
      l('M150 102 Q 162 110 172 119', '#C9B59C', 2.5) + c(178, 120, 3.8, T, 0) +
      olho(140, 88, 5.6) + bochecha(135, 101, 5, 3) + brilho(132, 78, 7, 3.5, -30, 0.45) + brilho(76, 100, 16, 6, -12, 0.25);
  };

  D.fig04 = () =>                                     // seriema de topete, olho azul e bico vermelho
    tc('M90 136 L 86 166 M104 136 L 108 166', '#F0764A', 6) + l('M77 168 H 94 M101 168 H 118', T, 5) +
    p('M66 108 C 46 112 30 124 22 142 C 38 141 56 134 74 122 Z', '#A8967A') +
    l('M30 134 L 36 128 M38 131 L 44 125 M46 128 L 52 122', '#FFFFFF', 3.5) +
    tc('M106 104 C 110 92 114 84 116 76', '#CDBB9E', 20) +
    e(94, 116, 34, 26, '#CDBB9E', 5, -12) +
    e(102, 126, 20, 10, '#EFE6D6', 0, -12) +
    e(86, 112, 21, 12, '#B3A083', 3.5, -12) + l('M72 116 L 92 108 M76 122 L 96 114', '#8C7A62', 2.5) +
    tc('M110 42 L 100 22 M116 40 L 112 18 M122 40 L 126 18 M128 42 L 140 26', '#8C7A62', 4.5) +
    c(118, 62, 24, '#CDBB9E') +
    e(122, 75, 13, 7, '#EFE6D6', 0) +
    c(126, 58, 9.5, '#9ED2F0', 2.5) + olho(127, 58, 5.6) +
    p('M139 62 L 166 68 Q 164 74 156 74 L 139 72 Z', '#E8553D', 3.5) +
    bochecha(114, 72, 5, 3) + brilho(108, 50, 8, 4, -35, 0.45) + brilho(80, 104, 10, 4, -20, 0.3);

  D.fig05 = () => {                                   // lobo-guará de orelhões e pernas compridas
    const perna = (x, cor = '#4A3440') => p(`M${x} 108 L ${x} 162 Q ${x - 1} 168 ${x + 5} 168 L ${x + 9} 168 Q ${x + 13} 168 ${x + 10} 162 L ${x + 9} 108 Z`, cor, 4.5);
    const cabeca = 'M112 66 C 110 46 124 36 140 36 C 156 36 166 46 168 58 L 179 67 Q 183 77 175 79 L 162 80 C 152 92 120 90 112 66 Z';
    const cauda = 'M54 96 C 34 102 24 122 28 146 C 34 151 43 149 45 142 C 44 126 50 114 62 106 Z';
    return perna(62, '#3D2B36') + perna(116, '#3D2B36') +
      p(cauda, '#E2742F') + p('M27.5 135 C 28 141 29 145 30.5 147 C 35 151 42 149 45 142 C 44.6 138 44.4 135 44.6 131 Q 36 136 27.5 135 Z', '#FFF4E8', 0) + p(cauda, 'none') +
      perna(76) + perna(130) +
      e(94, 102, 44, 23, '#EE7B30') +
      e(92, 117, 28, 5, '#FFC79A', 0) +
      p('M104 80 C 114 78 122 72 126 66 L 138 80 C 128 88 116 92 104 94 Z', '#3D2B36', 0) +
      e(94, 102, 44, 23, 'none') +
      p('M118 50 L 112 18 L 136 38 Z', '#EE7B30', 4.5) + p('M144 38 L 154 16 L 162 46 Z', '#EE7B30', 4.5) +
      p('M120 42 L 117 27 L 130 38 Z', '#FFF4E8', 0) + p('M148 38 L 153.5 25 L 158 42 Z', '#FFF4E8', 0) +
      p(cabeca, '#EE7B30') +
      p('M166 57 L 179 67 Q 183 77 175 79 L 163 80 Z', '#3D2B36', 0) +
      e(136, 79, 13, 6, '#FFF4E8', 0) + p(cabeca, 'none') +
      c(178, 72, 3.8, T, 0) +
      olho(146, 56, 5.6) + bochecha(140, 70, 6, 3.5) + brilho(128, 46, 8, 4, -30, 0.45) + brilho(78, 90, 18, 6, -8, 0.25);
  };

  D.fig06 = () => {                                   // borboleta-azul (morfo)
    const lado = p('M96 96 C 74 60 48 40 32 51 C 19 61 24 96 46 108 C 62 116 82 112 96 104 Z', '#22306E') +
      p('M93 97.5 C 75 68 54 54 41 61 C 32 68 36 94 52 103 C 66 110 81 107 93 101.5 Z', '#4DA8FF', 0) +
      brilho(60, 76, 13, 7, 35, 0.35) +
      p('M96 108 C 78 112 56 120 50 140 C 46 158 62 168 77 160 C 89 152 95 132 98 116 Z', '#22306E') +
      p('M94 112 C 80 116 62 124 58 140 C 56 151 65 157 75 152 C 85 146 91 130 95 118 Z', '#4DA8FF', 0) +
      c(31, 66, 2.8, '#FFFFFF', 0) + c(29, 81, 2.8, '#FFFFFF', 0) + c(34, 95, 2.6, '#FFFFFF', 0) + c(37, 57, 2.4, '#FFFFFF', 0) +
      c(54, 156, 2.4, '#FFFFFF', 0) + c(53, 143, 2.4, '#FFFFFF', 0);
    const espelho = s => `<g transform="matrix(-1 0 0 1 200 0)">${s}</g>`;
    return lado + espelho(lado) +
      l('M97 70 C 92 56 86 47 76 42 M103 70 C 108 56 114 47 124 42', T, 3.5) + c(76, 42, 4.5, T, 0) + c(124, 42, 4.5, T, 0) +
      e(100, 114, 8, 30, '#4A3A6A', 4) +
      c(100, 78, 10.5, '#4A3A6A', 4) +
      c(96, 76.5, 3.2, '#FFFFFF', 0) + c(104, 76.5, 3.2, '#FFFFFF', 0) + c(96.6, 77.2, 1.8, T, 0) + c(104.6, 77.2, 1.8, T, 0);
  };

  D.fig07 = () =>                                     // joaninha
    l('M52 92 L 30 80 M44 118 L 22 118 M52 144 L 32 160 M148 92 L 170 80 M156 118 L 178 118 M148 144 L 168 160', T, 5) +
    l('M88 38 Q 82 27 72 24 M112 38 Q 118 27 128 24', T, 4) + c(72, 24, 4.5, T, 0) + c(128, 24, 4.5, T, 0) +
    e(100, 58, 32, 24, '#3A2A5A', 5) +
    e(88, 46, 7.5, 8.5, '#FFFFFF', 0) + e(112, 46, 7.5, 8.5, '#FFFFFF', 0) + olho(89, 47.5, 4.3) + olho(113, 47.5, 4.3) +
    c(100, 114, 58, '#F0453A') +
    e(77, 60.5, 6, 3.5, '#FFFFFF', 0, -15) + e(123, 60.5, 6, 3.5, '#FFFFFF', 0, 15) +
    l('M100 57 V 171', T, 4.5) +
    c(77, 94, 11, T, 0) + c(123, 94, 11, T, 0) + c(65, 130, 9, T, 0) + c(135, 130, 9, T, 0) + c(87, 156, 7.5, T, 0) + c(113, 156, 7.5, T, 0) +
    brilho(124, 71, 12, 5.5, 25, 0.45) + brilho(64, 108, 7, 4, -50, 0.35);

  D.fig08 = () =>                                     // abelha jataí (abelha sem ferrão)
    e(92, 54, 20, 30, '#DDF3FF', 4, -28) + l('M88 66 Q 90 50 96 36', '#A9DFF7', 3) +
    e(118, 50, 16, 26, '#DDF3FF', 4, 22) + l('M116 62 Q 118 50 124 38', '#A9DFF7', 3) +
    e(76, 112, 42, 31, '#F7B910') +
    l('M64 86 Q 57 112 64 138', '#8A5A34', 9) + l('M88 85 Q 82 112 88 139', '#8A5A34', 9) +
    e(76, 112, 42, 31, 'none') +
    brilho(56, 100, 9, 6, -30, 0.45) +
    l('M114 118 L 109 132 M126 120 L 127 134', T, 4.5) +
    c(122, 104, 18, '#5A3A28') +
    l('M142 74 Q 138 58 130 52 M158 73 Q 162 58 170 52', T, 4) + c(130, 52, 4.5, T, 0) + c(170, 52, 4.5, T, 0) +
    c(150, 94, 23, '#C98236') +
    e(142, 91, 6.5, 8, '#FFFFFF', 0) + e(160, 91, 6.5, 8, '#FFFFFF', 0) + olho(143, 92.5, 4) + olho(161, 92.5, 4) +
    bochecha(137, 104, 5, 3) + bochecha(165, 104, 5, 3) +
    l('M145 106 Q 151 110 157 106', T, 3);

  D.fig09 = () => {                                   // girassol
    let tras = '', frente = '', sementes = '';
    for (let i = 0; i < 13; i++) {
      const a1 = (i + 0.5) * 360 / 13, b1 = a1 * Math.PI / 180;
      tras += e(r2(100 + 34 * Math.sin(b1)), r2(76 - 34 * Math.cos(b1)), 9, 19, '#F7B910', 4, r2(a1));
      const a2 = i * 360 / 13, b2 = a2 * Math.PI / 180;
      frente += e(r2(100 + 31 * Math.sin(b2)), r2(76 - 31 * Math.cos(b2)), 10, 18, '#FFD23F', 4.5, r2(a2));
    }
    [[0, 0], [-9, -8], [9, -8], [-12, 4], [12, 4], [0, 12], [-4, -16], [8, 15], [-9, 15], [16, -4], [-16, -4], [3, -7], [-4, 4]].forEach(([dx, dy]) => {
      sementes += c(100 + dx, 76 + dy, 2.3, '#5E3A22', 0);
    });
    return tc('M100 108 C 98 134 102 152 100 170', '#5CC84A', 8) +
      p('M100 150 C 86 136 66 136 52 146 C 64 158 86 160 100 150 Z', '#5CC84A') + l('M96 149 Q 76 144 58 146', '#3E9A30', 3) +
      p('M101 136 C 114 122 134 122 148 132 C 136 144 116 146 101 136 Z', '#5CC84A') + l('M105 135 Q 124 130 142 132', '#3E9A30', 3) +
      tras + frente + c(100, 76, 26, '#8A5634') + sementes + brilho(90, 66, 9, 5, -30, 0.3);
  };

  D.fig10 = () =>                                     // quero-quero de topete, máscara preta e olho vermelho
    tc('M98 138 L 94 166 M112 138 L 116 166', '#E88A96', 5) + l('M86 168 H 100 M108 168 H 122', T, 4.5) +
    p('M128 106 L 166 112 L 159 126 L 126 126 Z', '#FFFFFF') + p('M150 109 L 166 112 L 159 126 L 147 126 Z', '#2E2640', 0) +
    p('M128 106 L 166 112 L 159 126 L 126 126 Z', 'none') +
    e(106, 114, 36, 28, '#A3A9A0') +
    p('M100 96 C 118 92 138 98 144 110 C 130 116 112 114 100 108 Z', '#8C9A6E', 3.5) +
    p('M112 100 L 104 94 L 106 104 Z', '#E8553D', 0) +
    p('M74 100 C 86 94 98 96 104 104 C 100 116 90 124 80 124 C 74 116 72 108 74 100 Z', '#2E2640', 0) +
    e(104, 131, 24, 9, '#FFFFFF', 0) +
    e(106, 114, 36, 28, 'none') +
    l('M96 42 C 108 32 120 30 134 32 M96 47 C 108 40 118 40 130 42', T, 4) +
    c(82, 64, 24, '#A3A9A0') +
    p('M60 66 C 60 80 68 90 82 92 L 94 88 C 82 82 78 74 76 66 Z', '#2E2640', 0) +
    l('M76 72 Q 84 82 94 82', '#FFFFFF', 3.5) +
    c(82, 64, 24, 'none') +
    c(78, 60, 8, '#E8553D', 2.2) + olho(78, 60, 4.8) +
    p('M60 62 L 38 68 L 60 73 Z', '#E8553D', 3) + p('M45 66 L 38 68 L 45 70.5 Z', T, 0) +
    bochecha(94, 72, 5, 3) + brilho(90, 48, 8, 4, 20, 0.4);

  // ---------------------------------------------------------------- Lagoa
  D.fig11 = () => {                                   // vitória-régia
    let veios = '', tras = '', frente = '';
    for (let i = 1; i < 8; i++) {
      const a = i / 8 * Math.PI;
      veios += `M100 129 L ${r2(100 - Math.cos(a) * 54)} ${r2(129 + Math.sin(a) * 16)} `;
      veios += `M100 129 L ${r2(100 - Math.cos(a) * 54)} ${r2(129 - Math.sin(a) * 15)} `;
    }
    [-62, -31, 0, 31, 62].forEach(a => {
      const b = a * Math.PI / 180;
      tras += e(r2(104 + 21 * Math.sin(b)), r2(112 - 21 * Math.cos(b)), 8.5, 23, '#FF8FC2', 4, a);
    });
    [-74, -44, -15, 15, 44, 74].forEach(a => {
      const b = a * Math.PI / 180;
      frente += e(r2(104 + 15 * Math.sin(b)), r2(114 - 15 * Math.cos(b)), 8, 18, '#FFE3EE', 4, a);
    });
    return agua(100, 142, 82, 30) + l('M28 152 Q 38 147 48 152 M152 156 Q 162 151 172 156 M60 165 h 22 M118 166 h 20', '#E7FAFF', 4) +
      e(100, 134, 70, 24, '#3E9A30') + e(100, 130, 63, 19, '#7FD06A', 0) + l(veios, '#A8E28F', 2.5) +
      p('M97 152 L 100 141 L 103 152 Z', '#3E9A30', 0) +
      tras + frente + e(104, 105, 12, 6, '#FFD23F', 3) + brilho(70, 124, 16, 5, -6, 0.35);
  };

  D.fig12 = () =>                                     // garça-branca de pescoção, pisando na água
    agua(100, 166, 60, 11) + l('M54 167 h 14 M126 169 h 16', '#E7FAFF', 3.5) +
    tc('M92 134 L 88 162 M106 134 L 110 162', '#3A3448', 5) +
    p('M60 106 C 46 108 32 116 22 128 C 36 128 50 126 64 122 Z', '#EEF2F8', 4) +
    tc('M110 100 C 126 86 106 72 118 58', '#FFFFFF', 14) +
    e(90, 112, 36, 26, '#FFFFFF', 5, -10) +
    p('M66 106 C 80 98 104 100 118 110 C 104 122 82 124 68 118 Z', '#EEF2F8', 3.5) +
    l('M76 114 Q 92 118 108 112', '#D8DEE8', 3) +
    c(128, 50, 20, '#FFFFFF') +
    p('M145 46 L 181 52 L 145 58 Z', '#FFC93C', 3.5) +
    c(133, 46, 7, '#FFE27A', 0) + olho(133, 46, 4.4) + bochecha(126, 58, 4.5, 2.8) +
    brilho(118, 38, 7, 3.5, -30, 0.5) + brilho(76, 100, 12, 4, -15, 0.4);

  D.fig13 = () =>                                     // ariranha
    c(69, 54, 6.5, '#6A3E22') + c(131, 54, 6.5, '#6A3E22') +
    p('M62 172 C 58 130 66 98 100 94 C 134 98 142 130 138 172 Z', '#7A4A2A') +
    p('M86 110 C 92 104 108 104 114 110 C 120 122 112 136 100 138 C 88 136 80 122 86 110 Z', '#F2DDB8', 0) +
    brilho(120, 120, 6, 14, 10, 0.18) +
    e(100, 72, 37, 27, '#7A4A2A') +
    e(100, 85, 21, 12, '#9C6A44', 0) +
    e(100, 77, 8.5, 5.5, T, 0) + l('M100 82 V 89 M92 89 Q 96 94 100 89.5 Q 104 94 108 89', T, 3) +
    l('M82 84 L 70 81 M82 89 L 70 91 M118 84 L 130 81 M118 89 L 130 91', '#E3C9A6', 2.2) +
    olho(84, 64, 4.6) + olho(116, 64, 4.6) + bochecha(74, 77, 6, 3.5) + bochecha(126, 77, 6, 3.5) +
    brilho(86, 53, 12, 5, -15, 0.25) +
    agua(100, 160, 78, 15) + l('M30 158 Q 40 154 50 158 M150 162 Q 160 158 170 162 M90 170 h 20', '#E7FAFF', 4) +
    e(80, 147, 11, 6.5, '#7A4A2A', 4) + e(120, 147, 11, 6.5, '#7A4A2A', 4) +
    l('M76 145 v 4 M81 144.5 v 4 M86 145 v 4 M114 145 v 4 M119 144.5 v 4 M124 145 v 4', '#4A2A16', 2);

  D.fig14 = () =>                                     // martim-pescador de cabeção, topete e bico comprido
    galho(152) + folha(40, 144, -20) + folha(166, 146, 22) +
    p('M76 130 L 62 162 L 76 161 L 88 136 Z', '#256F96') +
    l('M94 140 L 92 150 M104 140 L 104 150', T, 4) +
    e(94, 114, 30, 30, '#2E8FC0', 5, 12) +
    p('M100 96 C 118 102 122 122 110 142 C 98 138 92 122 96 104 Z', '#E07B3C', 0) +
    e(94, 114, 30, 30, 'none', 5, 12) +
    e(80, 112, 13, 20, '#256F96', 3.5, 12) +
    c(76, 106, 2.6, '#9EE0FF', 0) + c(74, 118, 2.6, '#9EE0FF', 0) + c(82, 124, 2.4, '#9EE0FF', 0) +
    p('M88 50 L 70 42 L 87 42 L 78 26 L 96 36 L 98 22 L 112 40 Z', '#2E8FC0', 4) +
    c(108, 66, 28, '#2E8FC0') +
    e(118, 86, 12, 6, '#FFFFFF', 0) + e(112, 76, 16, 5, '#E07B3C', 0, 10) +
    p('M132 60 L 180 68 L 132 76 Z', '#3A3448', 3.5) + l('M137 68 L 170 68', '#5A5470', 2) +
    c(130, 64, 2.6, '#FFFFFF', 0) + olho(118, 60, 6) + bochecha(108, 76, 5, 3) + brilho(96, 50, 10, 4.5, -30, 0.35);

  D.fig15 = () =>                                     // tuiuiú: cabeça preta, papo vermelho e bicão
    agua(96, 168, 48, 9) +
    tc('M86 138 L 82 164 M100 138 L 104 164', '#2E2640', 5) +
    p('M52 112 C 42 114 34 120 30 128 C 40 128 48 126 56 122 Z', '#2E2640', 3.5) +
    tc('M104 102 C 110 90 114 78 118 68', '#2E2640', 19) +
    e(86, 118, 40, 28, '#FFFFFF') + l('M58 116 Q 80 124 106 114', '#D8DEE8', 3.5) + l('M54 126 Q 70 134 94 132', '#E6EBF2', 3) +
    e(108, 98, 15, 10, '#E53935', 4, -35) +
    c(120, 54, 23, '#2E2640') +
    p('M136 46 C 154 42 168 36 182 28 C 174 44 156 58 138 64 Z', '#3A3448', 4) +
    l('M140 54 C 154 49 166 42 177 33', '#5A5470', 2) +
    c(125, 48, 6.2, '#FFFFFF', 0) + olho(126, 48, 4.2) + bochecha(116, 62, 4.5, 2.6) +
    brilho(110, 40, 7, 3.5, -30, 0.3) + brilho(72, 108, 12, 4, -15, 0.4);

  D.fig16 = () => {                                   // libélula
    const veio = (x, y, rx, rot) => `<path d="M${x - rx + 6} ${y} H ${x + rx - 6}" transform="rotate(${rot} ${x} ${y})" fill="none" stroke="#A9DFF7" stroke-width="2.5" stroke-linecap="round"/>`;
    return e(60, 64, 40, 13, '#D6F2FF', 4, -14) + veio(60, 64, 40, -14) + e(140, 64, 40, 13, '#D6F2FF', 4, 14) + veio(140, 64, 40, 14) +
      e(63, 90, 36, 12, '#D6F2FF', 4, 12) + veio(63, 90, 36, 12) + e(137, 90, 36, 12, '#D6F2FF', 4, -12) + veio(137, 90, 36, -12) +
      tc('M100 100 L 100 166', '#2EC4B6', 9) + l('M95.5 114 h 9 M95.5 128 h 9 M95.5 142 h 9 M95.5 156 h 9', T, 3) +
      e(100, 84, 11, 16, '#2EC4B6') +
      c(100, 54, 15, '#2EC4B6') +
      c(89, 49, 9, '#7C5CFF', 4) + c(111, 49, 9, '#7C5CFF', 4) + c(91.5, 46, 3, '#FFFFFF', 0) + c(113.5, 46, 3, '#FFFFFF', 0) +
      l('M94 61 Q 100 65 106 61', T, 3) + bochecha(88, 60, 3.5, 2.2) + bochecha(112, 60, 3.5, 2.2);
  };

  D.fig17 = () => {                                   // jacaré-de-papo-amarelo
    const cabeca = 'M116 112 C 124 96 144 94 158 100 C 170 104 178 112 176 122 C 174 132 162 136 144 136 C 130 136 120 130 116 122 Z';
    return c(66, 112, 5.5, '#4E8A3C', 3.5) + c(80, 109, 5.5, '#4E8A3C', 3.5) + c(94, 108, 5.5, '#4E8A3C', 3.5) + c(108, 109, 5.5, '#4E8A3C', 3.5) +
      p('M64 116 C 46 116 28 108 20 90 C 22 112 40 134 68 142 Z', '#6FA552') +
      c(40, 112, 3, '#4E8A3C', 0) + c(52, 122, 3, '#4E8A3C', 0) +
      e(114, 150, 10, 8, '#5E9446', 4) + e(66, 150, 10, 8, '#5E9446', 4) +
      e(92, 128, 40, 22, '#6FA552') +
      e(92, 140, 28, 7, '#A8D07A', 0) + c(80, 122, 3.5, '#5E9446', 0) + c(96, 118, 3.5, '#5E9446', 0) + c(108, 124, 3, '#5E9446', 0) +
      e(120, 152, 10, 8, '#6FA552', 4) + e(72, 152, 10, 8, '#6FA552', 4) +
      p(cabeca, '#6FA552') +
      e(146, 132, 22, 6, '#FFD23F', 0) + p(cabeca, 'none') +
      c(136, 98, 9, '#6FA552') + olho(137, 97, 4.2) +
      c(168, 108, 1.9, T, 0) + c(172, 111, 1.9, T, 0) +
      l('M134 122 C 146 126 160 124 174 116', T, 3.5) +
      p('M148 124.3 L 150.5 129 L 153 124.3 Z', '#FFFFFF', 1.5) + p('M159 123.6 L 161.5 128 L 164 122.8 Z', '#FFFFFF', 1.5) +
      bochecha(126, 116, 5, 3) + brilho(150, 104, 10, 4, 10, 0.3);
  };

  D.fig18 = () => {                                   // peixinho lambari
    const corpo = 'M44 100 C 60 72 104 64 140 76 C 160 84 170 94 172 100 C 170 106 160 116 140 124 C 104 136 60 128 44 100 Z';
    return p('M52 100 L 24 76 Q 32 100 24 124 Z', '#FF7A3C') + l('M40 92 L 32 85 M40 108 L 32 115', '#D9542A', 3) +
      p('M98 75 L 108 54 L 124 77 Z', '#FFC93C', 4) + p('M98 125 L 105 140 L 118 124 Z', '#FFC93C', 4) +
      p(corpo, '#C9DDE8') +
      p('M50 95 C 66 77 104 71 138 81 C 154 87 164 94 168 98 C 150 92 120 90 94 93 C 76 95 62 98 50 95 Z', '#A7C6DA', 0) +
      p(corpo, 'none') +
      e(62, 100, 6, 9, T, 0) + l('M70 104 Q 104 100 146 98', '#FFFFFF', 3.5) +
      l('M134 82 Q 128 100 134 118', '#8FB3CC', 3.5) +
      e(122, 108, 11, 6, '#FFC93C', 3.5, 25) +
      c(148, 92, 9.5, '#FFFFFF', 3.5) + c(150, 92.5, 5.5, T, 0) + c(152, 90.5, 2, '#FFFFFF', 0) +
      l('M169 103 Q 165 108 160 106', T, 3) + bochecha(150, 108, 5, 3) +
      c(174, 72, 6, '#E7FAFF', 3.5) + c(162, 52, 4.5, '#E7FAFF', 3) + brilho(96, 84, 16, 4, -6, 0.4);
  };

  D.fig19 = () =>                                     // sapo-cururu
    e(46, 146, 26, 17, '#9C7A42', 5, -18) + e(154, 146, 26, 17, '#9C7A42', 5, 18) +
    e(100, 128, 62, 44, '#A8884E') +
    e(100, 148, 38, 22, '#F0DFB0', 0) +
    c(62, 128, 4, '#8A6A3A', 0) + c(140, 128, 4, '#8A6A3A', 0) + c(70, 104, 3.5, '#8A6A3A', 0) + c(130, 104, 3.5, '#8A6A3A', 0) +
    c(52, 116, 3, '#8A6A3A', 0) + c(150, 116, 3, '#8A6A3A', 0) + c(100, 96, 3.5, '#8A6A3A', 0) + c(86, 100, 2.5, '#8A6A3A', 0) + c(114, 100, 2.5, '#8A6A3A', 0) +
    e(48, 98, 10, 6, '#8A6A3A', 3.5, -25) + e(152, 98, 10, 6, '#8A6A3A', 3.5, 25) +
    c(72, 82, 18, '#A8884E') + c(128, 82, 18, '#A8884E') +
    c(72, 80, 11, '#FFD95A', 3.5) + c(128, 80, 11, '#FFD95A', 3.5) +
    e(72, 80, 7, 3.2, T, 0) + e(128, 80, 7, 3.2, T, 0) + c(75.5, 76.5, 2, '#FFFFFF', 0) + c(131.5, 76.5, 2, '#FFFFFF', 0) +
    l('M62 113 Q 100 130 138 113', T, 4.5) +
    bochecha(60, 118, 7, 4) + bochecha(140, 118, 7, 4) +
    e(78, 168, 13, 7.5, '#9C7A42', 4) + e(122, 168, 13, 7.5, '#9C7A42', 4) +
    l('M70 170 v 4 M78 171 v 4 M86 170 v 4 M114 170 v 4 M122 171 v 4 M130 170 v 4', T, 2.5) +
    brilho(88, 108, 12, 5, -10, 0.25);

  D.fig20 = () => {                                   // capivara sentadinha de lado, com uma mexerica na cabeça
    // desenhada num quadro maior (250) e encolhida: o contorno é mais grosso para ficar igual ao das outras
    const sw = 7.5, pelo = '#B57A4A', escuro = '#94603A';
    const cab = 'M64 120 C 60 74 92 34 140 32 C 184 30 220 56 234 92 C 242 112 244 134 232 150 C 222 162 202 166 182 166 L 106 168 C 80 168 66 148 64 120 Z';
    const desenho = p('M18 206 C 16 172 44 152 84 152 L 132 152 C 168 152 190 176 188 210 C 186 242 166 256 136 256 L 56 256 C 30 256 20 236 18 206 Z', pelo, sw) +
      e(108, 240, 54, 12, '#D9A877', 0) + l('M48 206 Q 56 180 86 174', escuro, 5) + brilho(56, 170, 22, 7, -18, 0.3) +
      e(48, 252, 24, 9, escuro, sw) +
      tc('M150 196 L 148 244', '#A86F42', 22, sw) + e(150, 252, 17, 8, escuro, sw) +
      tc('M178 196 L 180 244', '#A86F42', 22, sw) + e(182, 252, 17, 8, escuro, sw) +
      e(102, 46, 13, 11, escuro, sw, -24) + e(102, 46, 6, 5, '#6E4426', 0, -24) +
      p(cab, pelo, sw) + p('M178 64 C 214 60 244 88 244 122 C 244 148 224 166 194 166 C 168 166 154 144 156 118 C 158 90 164 68 178 64 Z', '#8F5A35', 0) +
      p(cab, 'none', sw) + brilho(116, 50, 26, 8, -18, 0.3) +
      olho(150, 88, 8.5) + bochecha(138, 118, 10, 6) +
      e(228, 98, 3.4, 5.6, T, 0, 28) + l('M227 106 Q 224 118 214 126', '#6E4426', 4) +
      l('M194 130 Q 201 137 208 131 Q 215 137 222 130', T, 6) +
      // a mexerica equilibrada na cabeça
      c(146, 24, 17, '#FF9F2E', sw) + brilho(140, 18, 6, 3.5, -30, 0.5) +
      p('M148 8 C 156 0 168 2 170 8 C 162 12 154 12 148 8 Z', '#5CC84A', 4.5) + l('M146 8 L 146 2', T, 4);
    return { desenho, k: 0.66, transform: `translate(${r2(25.5 - 18 * 0.66)} ${r2(18 - 6 * 0.66)}) scale(0.66)` };
  };

  // ---------------------------------------------------------------- Floresta
  D.fig21 = () => {                                   // onça-pintada (filhote)
    const roseta = (x, y, r) => c(x, y, r, '#D98E22', 3.5);
    return tc('M140 162 C 166 164 176 144 168 124', '#F2B33D', 11) + c(168.5, 123, 5.5, T, 0) +
      p('M56 172 C 52 136 70 114 100 114 C 130 114 148 136 144 172 Z', '#F2B33D') +
      e(100, 150, 22, 22, '#FFF1D6', 0) +
      roseta(70, 140, 6) + roseta(130, 140, 6) + roseta(66, 160, 5) + roseta(134, 160, 5) +
      e(80, 167, 14, 8, '#F2B33D', 4) + e(120, 167, 14, 8, '#F2B33D', 4) + l('M76 167 v 5 M84 167 v 5 M116 167 v 5 M124 167 v 5', T, 2.5) +
      c(62, 42, 13, '#F2B33D') + c(138, 42, 13, '#F2B33D') + c(62, 44, 6, '#7A4A2A', 0) + c(138, 44, 6, '#7A4A2A', 0) +
      e(100, 78, 50, 42, '#F2B33D') +
      c(70, 56, 3.6, T, 0) + c(83, 47, 3, T, 0) + c(100, 44, 3.6, T, 0) + c(117, 47, 3, T, 0) + c(130, 56, 3.6, T, 0) +
      c(60, 80, 3, T, 0) + c(140, 80, 3, T, 0) + c(64, 96, 2.6, T, 0) + c(136, 96, 2.6, T, 0) +
      e(100, 99, 22, 15, '#FFF1D6', 0) +
      p('M92 89 Q 100 86 108 89 Q 106 96 100 98 Q 94 96 92 89 Z', '#6A3A2A', 3) +
      l('M100 98 V 102 M92 104 Q 96 108 100 103 Q 104 108 108 104', T, 3.5) +
      c(88, 98, 1.5, '#C9A27E', 0) + c(84, 102, 1.5, '#C9A27E', 0) + c(112, 98, 1.5, '#C9A27E', 0) + c(116, 102, 1.5, '#C9A27E', 0) +
      olho(80, 74, 6) + olho(120, 74, 6) + bochecha(70, 92, 7, 4) + bochecha(130, 92, 7, 4) + brilho(84, 52, 14, 5, -15, 0.3);
  };

  D.fig22 = () => {                                   // bicho-preguiça pendurado no galho, de cabeção e sorriso
    const pelo = '#B59C80', pelo2 = '#97806A', claro = '#F4E7D2', mancha = '#5A4632';
    const garras = (x, y, v) => l(`M${x - 7} ${y} q ${v * 2} -9 ${v * 7} -10 M${x} ${y + 1} q ${v * 2} -10 ${v * 7} -11 M${x + 7} ${y} q ${v * 2} -9 ${v * 7} -9`, '#F4E7D2', 3.2);
    return p('M18 44 Q 100 30 182 46 L 181 58 Q 100 44 19 56 Z', '#8A5A34') +
      l('M40 46 q 10 -3 20 -2 M120 40 q 12 -1 24 2', '#B07A4A', 2.5) +
      folha(34, 40, -28) + folha(168, 42, 24) + folha(152, 34, -12) +
      // florzinha de ipê no galho
      florzinha(56, 36, 0.9, '#FFD23F', '#F08A1C') +
      // braços erguidos agarrando o galho
      tc('M74 112 C 66 92 64 70 68 52', pelo, 17) + tc('M126 112 C 134 92 136 70 132 52', pelo, 17) +
      garras(68, 54, 1) + garras(132, 54, -1) +
      // perninhas encolhidas
      e(76, 166, 14, 12, pelo, 5, 20) + e(124, 166, 14, 12, pelo, 5, -20) +
      l('M68 172 l -2 6 M75 175 l -1 6 M132 172 l 2 6 M125 175 l 1 6', '#F4E7D2', 3) +
      // corpo
      e(100, 140, 36, 34, pelo) + e(100, 148, 22, 22, '#CDB79C', 0) +
      l('M80 132 q 3 6 0 12 M120 132 q -3 6 0 12 M92 160 q 2 4 0 8 M108 160 q -2 4 0 8', pelo2, 2.6) +
      // cabeça grande
      c(100, 98, 34, pelo) +
      l('M84 68 q 4 -6 9 -4 M98 65 q 4 -6 8 -2 M110 68 q 5 -5 9 -1', pelo2, 3) +
      e(100, 103, 27, 22, claro, 0) +
      // as faixas escuras dos olhos (a marca da preguiça)
      e(86, 99, 11, 6.5, mancha, 0, 18) + e(114, 99, 11, 6.5, mancha, 0, -18) +
      c(88, 99, 5.6, '#2B1A2E', 0) + c(112, 99, 5.6, '#2B1A2E', 0) +
      c(90, 97, 2.2, '#FFFFFF', 0) + c(114, 97, 2.2, '#FFFFFF', 0) + c(86.5, 101.5, 1, '#FFFFFF', 0) + c(110.5, 101.5, 1, '#FFFFFF', 0) +
      e(100, 109, 6, 4.2, '#3A2A3A', 0) + brilho(98, 107.8, 2, 1, 0, 0.6) +
      l('M92 115 Q 100 122 108 115', T, 3.4) +
      bochecha(80, 112, 6, 3.6) + bochecha(120, 112, 6, 3.6) +
      brilho(86, 76, 11, 5, -25, 0.3) + brilho(86, 128, 10, 5, -30, 0.25);
  };

  D.fig23 = () =>                                     // tucano-toco de cabeção e bicão laranja
    galho(158) + folha(36, 150, -20) +
    p('M70 140 L 60 176 L 80 174 L 86 144 Z', '#2E2640') +
    e(82, 146, 9, 6, '#E53935', 3) +
    l('M90 154 L 88 162 M100 154 L 100 162', '#7A8AA8', 4.5) +
    e(88, 118, 32, 38, '#2E2640') +
    e(78, 124, 15, 26, '#463B63', 3.5, 8) +
    c(96, 70, 28, '#2E2640') +
    p('M100 84 C 116 84 124 98 118 114 C 104 114 94 104 92 92 C 94 88 96 86 100 84 Z', '#FFF3D0', 0) +
    p('M114 56 C 138 46 168 50 182 64 C 170 74 142 80 116 82 Z', '#FF9F43', 4) +
    l('M118 60 C 138 52 156 54 168 58', '#E53935', 3) + l('M120 74 C 138 76 154 74 168 70', '#E8811F', 3) +
    p('M170 57 C 176 59 180 62 182 64 C 178 69 172 71 166 72.5 C 169 67 170.5 62 170 57 Z', T, 0) +
    brilho(136, 58, 14, 4, -10, 0.45) +
    c(106, 64, 10, '#4DA3FF', 3) + olho(107, 64, 5.2) + brilho(84, 54, 8, 4, -30, 0.25);

  D.fig24 = () =>                                     // arara-azul de cabeção, olho e papo amarelos
    galho(158) + folha(160, 150, 20) +
    p('M108 140 L 134 178 L 118 180 L 98 146 Z', '#2F4DC9') + l('M108 146 L 125 172', '#4F78E8', 3) +
    l('M94 152 L 92 162 M106 152 L 108 162', '#5A5A6A', 4.5) +
    e(102, 116, 30, 36, '#3B5BDB') +
    e(112, 118, 17, 28, '#2F4DC9', 3.5, -10) + l('M106 104 Q 114 120 112 138', '#4F78E8', 3) +
    c(90, 70, 28, '#3B5BDB') +
    brilho(84, 54, 11, 5, -20, 0.3) +
    p('M70 60 C 52 56 40 70 44 90 C 50 84 56 82 66 84 Z', '#3A3448', 4) +
    p('M64 84 C 58 88 58 96 64 98 C 70 96 72 90 70 84 Z', '#3A3448', 4) +
    p('M67 82 C 75 81 82 87 79 96 C 75 99 69 98 66 96 Z', '#FFD23F', 3) +
    c(88, 62, 9.5, '#FFD23F', 3) + olho(88, 62, 5.2) + bochecha(98, 82, 5, 3);

  D.fig25 = () => {                                   // mico-leão-dourado sentado no galho, segurando uma frutinha
    // juba: tufos pontudos e macios em volta do rosto (14 pontas)
    const pontas = 14, cx = 100, cy = 78;
    let d = '';
    for (let i = 0; i <= pontas; i++) {
      const a = (i / pontas) * Math.PI * 2 - Math.PI / 2, am = a - Math.PI / pontas;
      const rf = 42 + (i % 2) * 4, rv = 30;
      const px = r2(cx + rf * Math.cos(a)), py = r2(cy + rf * 0.95 * Math.sin(a));
      const vx = r2(cx + rv * Math.cos(am)), vy = r2(cy + rv * 0.95 * Math.sin(am));
      d += i ? ` Q ${vx} ${vy} ${px} ${py}` : `M${px} ${py}`;
    }
    const juba = p(d + ' Z', '#FFAD33') + c(100, 80, 30, '#FFC56A', 0);
    return galho(152) +
      // cauda comprida pendurada
      tc('M120 152 C 128 170 146 176 160 166', '#F28C1C', 11) + c(161, 165, 7, '#FFB13D', 4) +
      // corpo e pés no galho
      e(100, 130, 28, 26, '#FF9F2E') + e(100, 136, 15, 14, '#FFC66B', 0) +
      e(84, 152, 12, 7, '#F28C1C', 4) + e(116, 152, 12, 7, '#F28C1C', 4) +
      // bracinhos segurando a frutinha
      tc('M76 120 Q 78 138 93 138', '#FF9F2E', 10) + tc('M124 120 Q 122 138 107 138', '#FF9F2E', 10) +
      c(100, 138, 9, '#E8434D', 4) + brilho(97, 135, 3, 2, -20, 0.6) +
      p('M100 129 q 4 -6 10 -4 q -3 6 -10 4 Z', '#5CC84A', 2.5) +
      // juba fofinha em volta do rosto
      juba +
      l('M76 62 q 6 -4 12 -2 M112 60 q 6 -2 12 2 M70 86 q 4 4 4 10 M130 86 q -4 4 -4 10', '#E8901E', 3) +
      // rosto: a pele escura com os olhos em volta clara (para os olhos aparecerem)
      p('M100 60 C 116 60 120 74 119 86 C 118 100 110 106 100 106 C 90 106 82 100 81 86 C 80 74 84 60 100 60 Z', '#7A3E26', 4) +
      c(91, 79, 7.6, '#E9B48A', 0) + c(109, 79, 7.6, '#E9B48A', 0) +
      c(91, 79, 5.2, '#2B1A2E', 0) + c(109, 79, 5.2, '#2B1A2E', 0) +
      c(93, 77, 2, '#FFFFFF', 0) + c(111, 77, 2, '#FFFFFF', 0) +
      e(100, 95, 9, 7, '#A65A3A', 0) +
      c(97, 92, 1.6, T, 0) + c(103, 92, 1.6, T, 0) + l('M95 98 Q 100 102 105 98', '#2B1A2E', 2.8) +
      bochecha(85, 92, 4.2, 2.6) + bochecha(115, 92, 4.2, 2.6) +
      brilho(80, 54, 12, 6, -35, 0.4);
  };

  D.fig26 = () => {                                   // quati de focinho comprido e rabo listrado em pé
    const cauda = 'M60 118 C 36 108 26 78 36 40';
    const perna = x => p(`M${x} 132 L ${x - 1} 160 Q ${x} 166 ${x + 6} 166 L ${x + 12} 166 Q ${x + 16} 165 ${x + 14} 160 L ${x + 13} 132 Z`, '#5A3A28');
    const cabeca = 'M118 92 C 116 74 130 64 146 68 C 156 71 162 82 166 92 L 177 106 Q 181 115 173 116 L 160 116 C 146 122 120 112 118 92 Z';
    return tc(cauda, '#C98C55', 16) +
      `<path d="${cauda}" fill="none" stroke="#5A3A28" stroke-width="16" stroke-dasharray="7 9"/>` +
      perna(62) + perna(110) +
      e(92, 122, 44, 26, '#B8733E') + e(92, 136, 28, 8, '#E0B080', 0) + brilho(78, 106, 16, 5, -6, 0.25) +
      perna(76) + perna(124) +
      c(126, 72, 8, '#B8733E', 4) + c(126, 72, 3.5, '#7A4A2A', 0) + c(148, 64, 8, '#B8733E', 4) + c(148, 64, 3.5, '#7A4A2A', 0) +
      p(cabeca, '#B8733E') +
      p('M138 80 C 148 76 158 84 160 96 C 150 98 140 92 138 80 Z', '#FFF4E0', 0) +
      l('M150 108 L 170 114', '#FFF4E0', 3) + c(175, 111, 4.2, T, 0) +
      olho(147, 88, 5.4) + bochecha(134, 100, 5, 3) + brilho(130, 76, 7, 3.5, -30, 0.4);
  };

  D.fig27 = () =>                                     // coruja-buraqueira de cabeção na porta da toca
    p('M22 172 C 28 142 60 132 100 132 C 140 132 172 142 178 172 Z', '#C48A5A') +
    p('M132 172 C 132 158 140 150 152 150 C 164 150 172 158 172 172 Z', '#5A3220', 3.5) +
    l('M36 160 h 8 M150 140 h 8 M58 146 h 6', '#A87448', 3) +
    tc('M88 148 L 86 168 M104 148 L 106 168', '#E8D6A8', 5) + l('M78 170 H 94 M98 170 H 114', T, 4) +
    e(96, 124, 30, 32, '#A8774A') +
    e(96, 132, 18, 20, '#E8D2AE', 0) +
    c(88, 126, 2.6, '#A8774A', 0) + c(100, 134, 2.6, '#A8774A', 0) + c(92, 142, 2.4, '#A8774A', 0) + c(104, 122, 2.4, '#A8774A', 0) +
    e(68, 124, 10, 22, '#946339', 4, 10) + e(124, 124, 10, 22, '#946339', 4, -10) +
    c(66, 118, 2.4, '#FFF6E6', 0) + c(126, 118, 2.4, '#FFF6E6', 0) + c(68, 130, 2.2, '#FFF6E6', 0) + c(124, 130, 2.2, '#FFF6E6', 0) +
    e(96, 70, 38, 32, '#A8774A') + e(96, 76, 30, 22, '#D8B48A', 0) +
    c(76, 48, 2.6, '#FFF6E6', 0) + c(88, 44, 2.4, '#FFF6E6', 0) + c(104, 44, 2.4, '#FFF6E6', 0) + c(116, 48, 2.6, '#FFF6E6', 0) +
    l('M70 58 Q 81 50 92 58 M100 58 Q 111 50 122 58', '#FFFFFF', 5) +
    c(82, 72, 12.5, '#FFD23F', 3.5) + c(110, 72, 12.5, '#FFD23F', 3.5) + olho(82, 72, 6.5) + olho(110, 72, 6.5) +
    p('M92 84 L 100 84 L 96 94 Z', '#E8C870', 3) +
    l('M78 98 Q 96 105 114 98', '#FFFFFF', 5) + bochecha(70, 88, 5, 3) + bochecha(122, 88, 5, 3) +
    brilho(76, 52, 9, 4, -30, 0.3);

  D.fig28 = () =>                                     // beija-flor bebendo o néctar de uma flor
    // a flor: trombeta vermelha deitada, com a boca virada para o bico; caule, folha e um botão
    tc('M172 98 C 176 130 162 156 164 182', '#4FB83F', 6) +
    p('M166 150 C 172 140 178 140 180 146 C 176 154 170 156 166 150 Z', '#5CC84A', 3.5) +
    tc('M170 112 C 160 92 162 74 164 62', '#4FB83F', 5) + e(164, 56, 7, 11, '#FF4D6D', 4, 15) +
    p('M174 92 C 164 84 152 82 142 80 L 142 104 C 152 102 164 100 174 96 Z', '#FF4D6D') +
    l('M146 86 C 154 87 162 89 170 92', '#C81E4A', 2.4) +
    e(140, 92, 7, 14, '#FF7A8C') + e(140, 92, 3, 7, '#C81E4A', 0) +
    p('M172 88 L 179 85 L 176 94 L 179 101 L 172 98 Z', '#5CC84A', 3.5) +
    // asa de trás (batendo)
    p('M70 92 C 54 68 54 42 66 28 C 80 46 86 70 82 92 Z', '#BFF0DA', 4) +
    // cauda
    p('M50 124 L 24 140 L 36 124 L 20 116 L 50 112 Z', '#1F8A68', 4) +
    // corpo gordinho
    e(78, 112, 30, 21, '#2EC48A', 5, -18) + e(82, 120, 18, 9, '#E9FFF4', 0, -18) +
    l('M62 112 q 8 4 16 2', '#23A876', 2.5) +
    // asa da frente
    p('M86 100 C 78 74 84 48 100 34 C 108 56 106 82 96 102 Z', '#DDFFF2', 4) + l('M92 90 Q 94 70 100 50', '#A6E6C8', 2.5) +
    l('M106 40 q 8 2 10 10 M110 32 q 10 3 13 13', '#FFFFFF', 3) +
    // cabeça grande, pescoço rubi e o bico até a flor
    c(106, 84, 19, '#2EC48A') + p('M92 92 C 96 104 112 106 120 96 C 112 98 100 98 92 92 Z', '#E0457B', 0) +
    l('M123 86 L 138 90', T, 6) + l('M123 86 L 138 90', '#6A5A7A', 2.6) +
    c(111, 80, 6, '#2B1A2E', 0) + c(113, 78, 2.4, '#FFFFFF', 0) + c(109.5, 82.5, 1, '#FFFFFF', 0) +
    bochecha(104, 92, 4, 2.5) + brilho(96, 72, 7, 3.5, -30, 0.45) + brilho(66, 104, 10, 4, -20, 0.35);

  D.fig29 = () => {                                   // cogumelos nascendo num tronco caído da mata, com musgo
    // chapéus lisos de duas cores, sem pintinhas brancas (o cogumelo vermelho de bolinhas é europeu e muito batido)
    const chapeu = 'M42 100 C 42 58 72 36 101 36 C 130 36 160 58 160 100 C 140 110 62 110 42 100 Z';
    const tronco = 'M40 134 H 156 C 166 134 172 142 172 151 C 172 160 166 168 156 168 H 40 C 32 168 26 160 26 151 C 26 142 32 134 40 134 Z';
    return p(tronco, '#9C6A43') + l('M40 146 h 22 M76 158 h 30 M44 160 h 10 M118 160 h 18 M104 146 h 16', '#7A4E2D', 3.5) +
      e(158, 151, 13, 17, '#E8C391', 4) +
      `<ellipse cx="158" cy="151" rx="6.5" ry="9" fill="none" stroke="#C99A62" stroke-width="2.5"/>` + c(158, 151, 1.8, '#C99A62', 0) +
      uniao(cn(36, 136, 7) + cn(48, 133, 8) + cn(62, 135, 6) + cn(122, 135, 6) + cn(134, 132, 7) + cn(146, 135, 6), '#6FBF4F', 3.5) +
      folha(84, 150, 12) +
      // o pequeno, à esquerda
      p('M44 138 C 44 133 45 129 46 125 L 55 125 C 56 129 57 133 57 138 Z', '#FFF3DE', 4) +
      p('M33 127 C 33 115 40 108 50.5 108 C 61 108 68 115 68 127 C 60 131 41 131 33 127 Z', '#FFB547', 4) +
      brilho(43, 115, 5.5, 2.6, -30, 0.5) +
      // o do meio, à direita
      p('M134 138 C 134 132 135 128 136 124 L 150 124 C 151 128 152 132 152 138 Z', '#FFF3DE', 4) +
      p('M120 125 C 120 109 131 101 143 101 C 155 101 166 109 166 125 C 156 130 130 130 120 125 Z', '#B5703F', 4.5) +
      p('M126 126 C 136 129 150 129 160 126 C 152 133 134 133 126 126 Z', '#FFE0BE', 0) +
      brilho(133, 109, 8, 3.4, -25, 0.4) +
      // o grande, no meio: pé creme, chapéu laranja com a beirada mais clara e as lamelas por baixo
      p('M84 138 C 85 127 87 116 90 105 L 112 105 C 115 116 117 127 118 138 Z', '#FFF3DE') +
      l('M96 113 Q 95 124 96 132', '#EAD7B8', 3) +
      p(chapeu, '#FF7A3C', 0) +
      p('M47 86 C 70 97 132 97 155 86 C 157 90 158 94 159 98 C 136 106 66 106 43 98 C 44 94 45 90 47 86 Z', '#FFA25E', 0) +
      p(chapeu, 'none') +
      p('M48 101 C 66 108 136 108 154 101 C 149 116 53 116 48 101 Z', '#FFD9B0', 3.5) +
      brilho(76, 58, 17, 7.5, -30, 0.45) + brilho(120, 50, 7, 4, 20, 0.35);
  };

  // ---------------------------------------------------------------- a Pipoca com uma medalha (final da trilha)
  // Usa a Pipoca oficial (PC.arte.pipoca, pose "feliz", viewBox 0 0 250 270) e põe uma medalha de estrela no peito
  // (o peito da sagui fica em (135, 190): a medalha, desenhada em volta de (125, 207), anda 10 para o lado e 11 para cima).
  const PIP = { k: 168 / 270, dentro: 0.82 };          // dentro: a escala que a Pipoca já tem no quadro dela (js/pipoca.js)
  PIP.x = r2((200 - 250 * PIP.k) / 2); PIP.y = 12;
  function medalha() {
    return '<g transform="translate(10 -11)">' + p('M103 163 L 117 199 L 127 195 L 113 160 Z', '#FF7A6B', 3.5) +
      p('M147 163 L 133 199 L 123 195 L 137 160 Z', '#2EC4B6', 3.5) +
      c(125, 207, 21, '#FFC93C', 4.5) + c(125, 207, 15, '#FFD95A', 2.5) +
      p(estrela(125, 207.5, 10.5, 4.6), '#FFF4B8', 2.5) + brilho(117, 199, 5, 3, -40, 0.6) + '</g>';
  }
  function pipocaMiolo(pose = 'feliz') {
    let s = '';
    try { s = String((PC.arte && PC.arte.pipoca && PC.arte.pipoca(pose)) || ''); } catch (err) { s = ''; }
    const ini = s.indexOf('>'), fim = s.lastIndexOf('</svg>');
    if (!/^<svg[\s>]/.test(s) || ini < 0 || fim < ini) return '';
    s = s.slice(ini + 1, fim);
    // a boca aberta só aparece com o CSS da fala; dentro de uma imagem ela ficaria visível por cima da fechada
    s = s.replace(/<g class="pip-boca-aberta">[\s\S]*?<\/g>/, '');
    if (s.indexOf('pip-boca-aberta') >= 0) s = s.replace(/class="pip-boca-aberta"/g, 'opacity="0"');
    return s.replace(/\sclass="[^"]*"/g, '');
  }
  /** null se a arte da Pipoca ainda não carregou (o chamador usa uma medalha sozinha e não guarda no cache). */
  function pipocaComMedalha() {
    const miolo = pipocaMiolo();
    if (!miolo) return null;
    return adesivo(miolo + medalha(), { k: PIP.k * PIP.dentro, transform: `translate(${PIP.x} ${PIP.y}) scale(${PIP.k})` });
  }
  // a Pipoca lendo: pose normal (de pé, mãos soltas em 96,215 e 174,215) com um livro aberto na frente da barriga,
  // que cobre as mãos de verdade, e duas mãozinhas por cima segurando as beiradas
  function livro() {
    // k = -1: página da esquerda; k = 1: página da direita
    const pg = k => p(`M125 214 Q ${125 + k * 18} 205 ${125 + k * 38} 208 L ${125 + k * 38} 242 Q ${125 + k * 18} 239 125 248 Z`, '#FFFDF4', 3.5) +
      l(`M${125 + k * 9} 220 Q ${125 + k * 20} 215 ${125 + k * 31} 217 M${125 + k * 9} 228 Q ${125 + k * 20} 223 ${125 + k * 31} 225`, '#B9B3CC', 2.6);
    const letra = (x, t, cor) => `<text x="${x}" y="242" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="15" fill="${cor}">${t}</text>`;
    // livro grande (escala 1,4 em volta do meio) com capa coral, para aparecer bem no mapa; as mãos seguram as beiradas
    return '<g transform="translate(10 -22)"><g transform="translate(125 226) scale(1.4) translate(-125 -226)">' +
      p('M84 210 Q 104 202 125 212 Q 146 202 166 210 L 166 248 Q 146 242 125 252 Q 104 242 84 248 Z', '#FF7A6B', 4) +
      pg(-1) + pg(1) + l('M125 214 V 248', T, 2.6) + letra(108, 'A', '#4DA3FF') + letra(142, 'b', '#2EC4B6') + '</g>' +
      c(78, 230, 11, '#F6C6A2', 4.5) + c(172, 230, 11, '#F6C6A2', 4.5) + '</g>';
  }
  function pipocaLendo() {
    const miolo = pipocaMiolo('normal');
    if (!miolo) return null;
    return adesivo(miolo + livro(), { k: PIP.k * PIP.dentro, transform: `translate(${PIP.x} ${PIP.y}) scale(${PIP.k})` });
  }
  const soMedalha = () => adesivo(medalha(), { k: 2.2, transform: 'translate(-175 -326.8) scale(2.2)' });

  // ======================================================================== a lista (PROJETO.md 7.1)
  const L = (nome, tipo, fala) => ({ nome, tipo, fala });
  const DADOS = [
    L('ipê-amarelo', 'planta'), L('joão-de-barro', 'ave'), L('tamanduá-bandeira', 'mamifero'), L('seriema', 'ave'),
    L('lobo-guará', 'mamifero'), L('borboleta-azul', 'inseto'), L('joaninha', 'inseto'), L('abelha jataí', 'inseto'),
    L('girassol', 'planta'), L('quero-quero', 'ave'),
    L('vitória-régia', 'planta'), L('garça-branca', 'ave'), L('ariranha', 'mamifero'), L('martim-pescador', 'ave'),
    L('tuiuiú', 'ave'), L('libélula', 'inseto'), L('jacaré-de-papo-amarelo', 'reptil'), L('peixinho lambari', 'peixe'),
    L('sapo-cururu', 'anfibio'), L('capivara', 'mamifero'),
    L('onça-pintada', 'mamifero'), L('bicho-preguiça', 'mamifero'), L('tucano', 'ave'), L('arara-azul', 'ave'),
    L('mico-leão-dourado', 'mamifero'), L('quati', 'mamifero'), L('coruja-buraqueira', 'ave'), L('beija-flor', 'ave'),
    L('cogumelo', 'fungo', 'Cogumelos!'), L('Pipoca com medalha', 'pipoca', 'A Pipoca ganhou uma medalha!'),
    // ---------------- estações de letras
    L('bem-te-vi', 'ave'), L('sabiá-laranjeira', 'ave'), L('tatu-bola', 'mamifero'), L('ema', 'ave'), L('carcará', 'ave'),
    L('papagaio', 'ave'), L('vaga-lume', 'inseto'), L('gafanhoto', 'inseto'), L('caju', 'planta'), L('flor-de-maracujá', 'planta'),
    L('boto-cor-de-rosa', 'mamifero'), L('tracajá', 'reptil'), L('pirarucu', 'peixe'), L('arraia', 'peixe'), L('cervo-do-pantanal', 'mamifero'),
    L('colhereiro', 'ave'), L('anta', 'mamifero'), L('jaçanã', 'ave'), L('sucuri', 'reptil'), L('aguapé', 'planta'),
    L('sagui', 'mamifero'), L('harpia', 'ave'), L('jabuti', 'reptil'), L('cutia', 'mamifero'), L('jiboia', 'reptil'),
    L('sapinho-ponta-de-flecha', 'anfibio'), L('bromélia', 'planta'), L('pau-brasil', 'planta'), L('castanheira', 'planta'),
    L('Pipoca lendo', 'pipoca', 'A Pipoca aprendeu a ler!'),
  ];
  const REGIOES = ['prado', 'lagoa', 'floresta'];
  const lista = DADOS.map((d, i) => {
    const item = { id: 'fig' + String(i + 1).padStart(2, '0'), nome: d.nome, regiao: REGIOES[Math.floor(i / 10) % 3],
      materia: i < 30 ? 'numeros' : 'letras', tipo: d.tipo };
    if (d.fala) item.fala = d.fala;
    return Object.freeze(item);
  });
  const porId = {};
  lista.forEach(f => { porId[f.id] = f; });

  const cache = {};
  function desenho(id) {
    id = String(id || '');
    if (cache[id]) return cache[id];
    let s;
    try {
      if (id === 'fig30' || id === 'fig60') {
        s = id === 'fig30' ? pipocaComMedalha() : pipocaLendo();
        if (!s) return soMedalha();              // a arte da Pipoca ainda não está pronta: não guarda no cache
      } else if (D[id]) {
        const d = D[id]();                     // texto, ou { desenho, k, transform } para quem desenha num quadro maior
        s = typeof d === 'string' ? adesivo(d) : adesivo(d.desenho, d);
      }
      else s = adesivo(c(100, 100, 64, '#FFF4B8') + p(estrela(100, 101, 46, 20), '#FFC93C', 5));
    } catch (err) {
      console.error(err);
      return adesivo(c(100, 100, 64, '#FFF4B8'));
    }
    cache[id] = s;
    return s;
  }

  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);

  PC.figurinhas = {
    lista,
    desenho,
    obter: id => porId[id] || null,
    fala(id) { const f = porId[id]; return f ? (f.fala || maiuscula(f.nome) + '!') : ''; },
    daRegiao: regiao => lista.filter(f => f.regiao === regiao),
    /** Desenhos de outros arquivos: { fig31: () => texto | { desenho, k, transform } }. */
    registrar(obj) { Object.keys(obj).forEach(k => { D[k] = obj[k]; delete cache[k]; }); },
    /** As peças de desenho deste arquivo (mesmas regras de traço e cor). */
    pecas: { T, r2, c, e, p, l, tc, olho, bochecha, brilho, uniao, cn, florzinha, estrela, galho, folha, agua, adesivo },
  };
})();
