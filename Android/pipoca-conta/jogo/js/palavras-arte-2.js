/* Pipoca Aprende — desenhos dos objetos do banco de palavras, parte 2 (PROJETO.md 5.8 a 5.14).
   Registra em PC.palavras 22 desenhos de objetos: bola, mola, sapato, pao, janela, panela, vela, peteca, caneca, mala,
   bala, anzol, ovo, casa, dado, bolo, pipa, copo, lapis, navio, roda, escada.
   Cada desenho: SVG completo (viewBox 0 0 200 200, xmlns, sem ids, XML válido), fundo transparente, contorno #3A2A5A,
   cores chapadas, um brilho branco semitransparente; objetos sem rosto e sem letras, na vista mais reconhecível.
   As peças (c, e, p, l, tc, brilho) são as mesmas de js/figurinhas.js, reescritas aqui. */
(function () {
  'use strict';
  const PC = window.PC;

  const T = '#3A2A5A';
  const r2 = v => Math.round(v * 100) / 100;

  // ======================================================================== peças (texto SVG)
  const tinta = sw => (sw ? ` stroke="${T}" stroke-width="${sw}"` : '');
  const giro = (rot, x, y) => (rot ? ` transform="rotate(${rot} ${x} ${y})"` : '');
  const c = (x, y, r, cor, sw = 5) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r}" fill="${cor}"${tinta(sw)}/>`;
  const e = (x, y, rx, ry, cor, sw = 5, rot = 0) =>
    `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="${rx}" ry="${ry}"${giro(rot, r2(x), r2(y))} fill="${cor}"${tinta(sw)}/>`;
  const p = (d, cor, sw = 5) => `<path d="${d}" fill="${cor}"${sw ? tinta(sw) + ' stroke-linejoin="round"' : ''}/>`;
  /** Retângulo de cantos arredondados. */
  const r = (x, y, w, h, rx, cor, sw = 5) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${cor}"${sw ? tinta(sw) + ' stroke-linejoin="round"' : ''}/>`;
  /** Traço sem preenchimento. */
  const l = (d, cor = T, sw = 5, op = 1) =>
    `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ''}/>`;
  /** Traço grosso com contorno: o contorno por baixo e a cor por cima. */
  const tc = (d, cor, w, sw = 5) => l(d, T, w + sw) + l(d, cor, w);
  const brilho = (x, y, rx, ry, rot = 0, op = 0.45) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${giro(rot, x, y)} fill="#FFFFFF" opacity="${op}"/>`;
  const g = (transf, conteudo) => `<g transform="${transf}">${conteudo}</g>`;
  const svg = conteudo => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${conteudo}</svg>`;

  /** Estrela de cinco pontas (caminho). */
  function estrela(x, y, R, rr) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? rr : R;
      d += (i ? ' L ' : 'M') + r2(x + q * Math.cos(a)) + ' ' + r2(y + q * Math.sin(a));
    }
    return d + ' Z';
  }
  /** Chama de vela (ponta em cima), com o miolo amarelo. */
  const chama = (x, y, s = 1) => {
    const f = (dx, dy) => `${r2(x + dx * s)} ${r2(y + dy * s)}`;
    return p(`M${f(0, -27)} C ${f(9, -15)} ${f(13, -7)} ${f(12, 1)} C ${f(11, 9)} ${f(6, 13)} ${f(0, 13)} C ${f(-6, 13)} ${f(-11, 9)} ${f(-12, 1)} C ${f(-13, -7)} ${f(-9, -15)} ${f(0, -27)} Z`, '#FF9A3C', r2(4 * Math.min(1, s + 0.2))) +
      p(`M${f(0, -12)} C ${f(4, -6)} ${f(6, -2)} ${f(6, 3)} C ${f(6, 7)} ${f(3, 9)} ${f(0, 9)} C ${f(-3, 9)} ${f(-6, 7)} ${f(-6, 3)} C ${f(-6, -2)} ${f(-4, -6)} ${f(0, -12)} Z`, '#FFE15A', 0);
  };

  const D = {};

  // ------------------------------------------------------------------ bola: bola de praia de gomos coloridos
  D.bola = () => {
    // as curvas dos gomos vão do polo de cima (100,24) ao de baixo (100,176); o meio da curva fica em x = 50 + cx/2
    const gomo = (cx1, cx2, cor) => p(`M100 24 Q ${cx1} 100 100 176 Q ${cx2} 100 100 24 Z`, cor, 0);
    return c(100, 100, 76, '#FFFFFF') +
      p('M100 24 A76 76 0 0 0 100 176 Q 12 100 100 24 Z', '#FF5A5F', 0) +
      gomo(68, 132, '#4FA3F0') +
      p('M100 24 A76 76 0 0 1 100 176 Q 188 100 100 24 Z', '#FFC93C', 0) +
      l('M100 24 Q 12 100 100 176 M100 24 Q 68 100 100 176 M100 24 Q 132 100 100 176 M100 24 Q 188 100 100 176', T, 3.5) +
      c(100, 100, 76, 'none') +
      c(100, 26, 7, '#FFFFFF', 3.5) +
      brilho(66, 62, 18, 10, -40, 0.5);
  };

  // ------------------------------------------------------------------ mola: espiral de metal de lado
  D.mola = () => {
    // hélice vista de lado: os fios de trás (mais escuros) sobem para a esquerda, os da frente descem para a direita
    const xe = 44, xd = 156, passo = 23, n = 6, y0 = 34;
    let tras = '', frente = '', luz = '';
    for (let i = 0; i < n; i++) {
      const y = y0 + i * passo;
      if (i < n - 1) tras += tc(`M${xd} ${y + 13} Q 100 ${y + 2} ${xe} ${y + passo}`, '#7F8DA3', 11);
      frente += tc(`M${xe} ${y} Q 100 ${y + 30} ${xd} ${y + 13}`, '#C3CEDC', 11);
      luz += l(`M${xe + 20} ${y + 9} Q 96 ${y + 20} ${xd - 34} ${y + 15}`, '#FFFFFF', 3, 0.75);
    }
    const yf = y0 + (n - 1) * passo + 13;
    // pontas retas em cima e embaixo, como numa mola de verdade
    const pontas = tc(`M${xe} ${y0} L ${xe} ${y0 - 16}`, '#C3CEDC', 11) + tc(`M${xd} ${yf} L ${xd} ${yf + 16}`, '#C3CEDC', 11);
    return g('translate(0 0)', tras + pontas + frente + luz);
  };

  // ------------------------------------------------------------------ sapato: tênis de criança, de lado
  D.sapato = () => {
    const cabedal = 'M28 140 L 30 86 Q 32 68 50 68 L 64 70 Q 78 90 104 96 L 132 100 Q 172 106 180 140 Z';
    const laco = (x, y) => `M${x + 2.5} ${y - 7} L ${x - 2.5} ${y + 7} `;   // cadarço em barrinhas (nada de "X" que pareça letra)
    return g('translate(0 -8)',
      p('M60 74 Q 62 52 80 54 Q 90 58 86 78 Z', '#FFB3B3') +
      p(cabedal, '#FF6B6B') +
      p('M136 101 Q 172 107 180 140 L 138 140 Q 130 118 136 101 Z', '#FFFFFF', 4) +
      p('M28 140 L 29 108 Q 46 104 52 122 L 54 140 Z', '#FFC93C', 4) +
      e(46, 74, 13, 5, '#7A3A3A', 3.5, 4) +
      p('M64 70 Q 78 90 104 96 L 134 100 L 130 116 Q 98 114 72 100 Z', '#FF9C9C', 4) +
      tc(laco(82, 94) + laco(97, 100) + laco(112, 104) + laco(126, 107), '#FFFFFF', 4.5, 3.5) +
      p('M16 138 H 184 Q 188 164 164 164 H 36 Q 14 164 16 138 Z', '#FFFFFF') +
      l('M30 152 H 170', '#C9C2D8', 3.5) +
      brilho(46, 96, 10, 5, -60, 0.5) + brilho(150, 112, 10, 4, 20, 0.5));
  };

  // ------------------------------------------------------------------ pão: pão francês com a pestana no meio
  D.pao = () => g('rotate(-14 100 100)',
    p('M18 108 C 18 76 60 60 102 60 C 146 60 184 78 184 106 C 184 138 146 148 100 148 C 56 148 18 140 18 108 Z', '#E39A45') +
    e(100, 134, 70, 10, '#C77F35', 0) +
    p('M18 108 C 18 76 60 60 102 60 C 146 60 184 78 184 106 C 184 138 146 148 100 148 C 56 148 18 140 18 108 Z', 'none') +
    p('M40 100 C 70 82 130 78 164 92 C 132 102 74 108 40 100 Z', '#FBE3AE', 4) +
    l('M44 96 C 76 80 128 76 160 88', '#F5B868', 4) +
    brilho(70, 76, 22, 7, -8, 0.5));

  // ------------------------------------------------------------------ janela: aberta, com venezianas e cortininha
  D.janela = () => {
    const ripas = (x1, x2, ini, fim) => {
      let s = '';
      for (let y = ini; y <= fim; y += 14) s += `M${x1} ${y} L ${x2} ${y + (x1 < 100 ? -2 : -2)}`;
      return l(s, '#3E9A80', 3.5);
    };
    return r(48, 26, 104, 132, 6, '#FFFFFF') +
      r(58, 36, 84, 112, 4, '#BFE8FF', 4) +
      p('M70 128 Q 76 118 86 122 Q 92 114 102 120 Q 112 116 116 126 Q 120 132 112 134 H 74 Q 66 134 70 128 Z', '#FFFFFF', 3) +
      p('M58 36 H 92 Q 80 64 74 90 Q 80 116 70 148 H 58 Z', '#FF8FB1', 4) +
      p('M142 36 H 108 Q 120 64 126 90 Q 120 116 130 148 H 142 Z', '#FF8FB1', 4) +
      r(66, 86, 14, 8, 4, '#FFC93C', 3) + r(120, 86, 14, 8, 4, '#FFC93C', 3) +
      p('M54 32 H 146 V 48 Q 136 58 127 48 Q 118 58 109 48 Q 100 58 91 48 Q 82 58 73 48 Q 64 58 54 48 Z', '#FF6B9A', 4) +
      p('M48 30 L 14 42 L 14 146 L 48 156 Z', '#5CCCA8') + ripas(20, 44, 56, 140) +
      p('M152 30 L 186 42 L 186 146 L 152 156 Z', '#5CCCA8') + ripas(156, 180, 56, 140) +
      r(36, 156, 128, 14, 6, '#C98A4E') +
      brilho(64, 40, 8, 3, 0, 0.5) + brilho(26, 60, 4, 14, -6, 0.4);
  };

  // ------------------------------------------------------------------ panela: com tampa, cabo e fumacinha
  D.panela = () => g('translate(-6 0)',
    l('M74 38 q -9 -7 0 -14 q 9 -7 0 -14 M98 36 q -9 -7 0 -14 q 9 -7 0 -14 M122 38 q -9 -7 0 -14 q 9 -7 0 -14', '#9FB2CC', 4.5) +
    p('M146 106 H 182 Q 190 106 190 114 Q 190 122 182 122 H 146 Z', '#5A4A6A') +
    p('M30 98 H 146 V 140 Q 146 168 120 168 H 56 Q 30 168 30 140 Z', '#E8504A') +
    r(22, 92, 132, 14, 7, '#C83E3A') +
    p('M28 92 Q 32 58 88 56 Q 144 58 148 92 Z', '#F27A6E') +
    e(88, 50, 13, 7, '#5A4A6A') +
    brilho(56, 128, 8, 20, 0, 0.4) + brilho(62, 74, 14, 5, -18, 0.5));

  // ------------------------------------------------------------------ vela: vela de aniversário listrada e acesa
  D.vela = () => {
    let listras = '';
    for (const y of [100, 124, 148, 172]) listras += `M76 ${y} L 124 ${y - 16} L 124 ${y - 5} L 76 ${y + 11} Z `;
    return c(100, 46, 34, '#FFE9A0', 0).replace('/>', ' opacity=".6"/>') +
      e(100, 176, 52, 11, '#FFC93C') +
      r(76, 80, 48, 96, 8, '#FFFFFF', 0) +
      p(listras, '#FF7AA8', 0) +
      r(76, 80, 48, 96, 8, 'none') +
      p('M108 80 Q 112 92 110 100 Q 116 104 116 96 L 118 80 Z', '#FFFFFF', 0) +
      l('M100 80 V 68', T, 4.5) +
      chama(100, 48, 1.3) +
      brilho(86, 120, 4, 30, 0, 0.5);
  };

  // ------------------------------------------------------------------ peteca: base de couro e penas coloridas em leque
  D.peteca = () => {
    // penas compridas e pontudas saindo do nó; base de pano estufada, amarrada com uma fita
    const penas = [[-28, '#FF5A5F'], [28, '#4FA3F0'], [-14, '#FFC93C'], [14, '#5CC84A'], [0, '#B57CF0']];
    let s = '';
    for (const [ang, cor] of penas) {
      const pena = p('M100 124 C 80 100 80 50 100 14 C 120 50 120 100 100 124 Z', cor) +
        l('M100 122 L 100 32', '#FFFFFF', 3, 0.75) + l('M100 66 L 90 56 M100 84 L 110 74', '#FFFFFF', 2.5, 0.6);
      s += ang ? `<g transform="rotate(${ang} 100 132)">${pena}</g>` : pena;
    }
    return s +
      p('M84 132 C 52 136 48 156 54 170 C 60 184 78 187 100 187 C 122 187 140 184 146 170 C 152 156 148 136 116 132 Z', '#F2C27A') +
      l('M62 168 Q 100 180 138 168', '#D49A54', 3) +
      r(78, 124, 44, 16, 7, '#E8504A') +
      brilho(72, 154, 8, 12, 25, 0.5);
  };

  // ------------------------------------------------------------------ caneca: baixa e larga, com alça e fumacinha
  D.caneca = () => {
    const corpo = 'M28 66 H 136 V 148 Q 136 172 112 172 H 52 Q 28 172 28 148 Z';
    const coracao = 'M82 108 C 82 98 94 96 98 104 C 102 96 114 98 114 108 C 114 120 98 128 98 132 C 98 128 82 120 82 108 Z';
    return l('M66 46 q -9 -7 0 -14 q 9 -7 0 -14 M94 44 q -9 -7 0 -14 q 9 -7 0 -14', '#9FB2CC', 4.5) +
      tc('M132 86 C 186 82 186 152 132 148', '#4FA3F0', 16) +
      p(corpo, '#4FA3F0') +
      e(82, 66, 54, 11, '#8A5634') + e(82, 67, 44, 7, '#6E4026', 0) +
      p(coracao, '#FFFFFF', 0) +
      brilho(42, 120, 6, 32, 0, 0.45);
  };

  // ------------------------------------------------------------------ mala: malinha de viagem com alça
  D.mala = () => g('translate(0 6)',
    tc('M74 62 V 48 Q 74 36 86 36 H 114 Q 126 36 126 48 V 62', '#6B4A3A', 10) +
    r(18, 60, 164, 112, 16, '#F08A3C') +
    r(52, 60, 16, 112, 0, '#B8642A', 4) + r(132, 60, 16, 112, 0, '#B8642A', 4) +
    r(48, 104, 24, 18, 4, '#FFC93C', 4) + r(128, 104, 24, 18, 4, '#FFC93C', 4) +
    r(18, 60, 164, 112, 16, 'none') +
    p(estrela(100, 118, 18, 8), '#FFFFFF', 3.5) +
    brilho(36, 92, 6, 20, 0, 0.45));

  // ------------------------------------------------------------------ bala: embrulhada, com as pontas torcidas
  D.bala = () => {
    const ponta = 'M62 100 C 42 84 28 62 16 66 C 8 84 8 116 16 134 C 28 138 42 116 62 100 Z';
    const pontaD = 'M138 100 C 158 84 172 62 184 66 C 192 84 192 116 184 134 C 172 138 158 116 138 100 Z';
    return p(ponta, '#FFC2DA') + l('M24 76 Q 34 92 52 98 M24 124 Q 34 108 52 102', '#FF8FB8', 3) +
      p(pontaD, '#FFC2DA') + l('M176 76 Q 166 92 148 98 M176 124 Q 166 108 148 102', '#FF8FB8', 3) +
      e(58, 100, 7, 11, '#FF8FB8', 4) + e(142, 100, 7, 11, '#FF8FB8', 4) +
      e(100, 100, 44, 34, '#FF3D7F') +
      l('M84 72 Q 70 100 84 128 M104 67 Q 90 100 104 133 M124 72 Q 110 100 124 128', '#FFFFFF', 7) +
      e(100, 100, 44, 34, 'none') +
      brilho(84, 82, 14, 6, -25, 0.55);
  };

  // ------------------------------------------------------------------ anzol: anzol prateado com linha e boia
  D.anzol = () => g('translate(10 0)',
    l('M126 8 V 64', T, 3) +
    c(126, 34, 17, '#FFFFFF') +
    p('M109 34 A17 17 0 0 1 143 34 Z', '#FF5A5F', 0) + c(126, 34, 17, 'none') + l('M109 34 H 143', T, 3) +
    brilho(119, 27, 5, 3, -30, 0.6) +
    tc('M126 70 m -11 0 a 11 11 0 1 0 22 0 a 11 11 0 1 0 -22 0', '#C3CEDC', 7, 5) +
    tc('M126 82 V 132 C 126 184 50 184 50 132 V 120', '#C3CEDC', 11) +
    p('M42 124 L 50 98 L 58 124 Z', '#C3CEDC', 4.5) +
    p('M56 116 L 68 134 L 54 130 Z', '#C3CEDC', 4) +
    l('M122 92 V 130', '#FFFFFF', 3, 0.8));

  // ------------------------------------------------------------------ ovo: ovo branco, em pé
  D.ovo = () => {
    const casca = 'M100 16 C 144 16 168 92 166 126 C 164 162 136 184 100 184 C 64 184 36 162 34 126 C 32 92 56 16 100 16 Z';
    return p(casca, '#FFFBF0') +
      p('M160 112 C 168 150 140 180 100 180 C 136 172 156 146 160 112 Z', '#EDE3CC', 0) +
      p(casca, 'none') +
      brilho(74, 66, 12, 24, 22, 0.9);
  };

  // ------------------------------------------------------------------ casa: telhado, chaminé, porta e janelas
  D.casa = () =>
    r(128, 36, 22, 44, 3, '#B8642A') +
    r(38, 92, 124, 88, 4, '#FFE7A8') +
    p('M20 100 L 100 26 L 180 100 Z', '#E8504A') +
    p('M86 180 V 136 Q 86 122 100 122 Q 114 122 114 136 V 180 Z', '#9A5A2E') + c(108, 154, 3, '#FFC93C', 0) +
    r(50, 112, 26, 26, 3, '#BFE8FF', 4) + l('M63 112 V 138 M50 125 H 76', T, 3.5) +
    r(124, 112, 26, 26, 3, '#BFE8FF', 4) + l('M137 112 V 138 M124 125 H 150', T, 3.5) +
    l('M14 182 H 186', '#5CC84A', 6) +
    brilho(74, 72, 18, 5, -42, 0.45);

  // ------------------------------------------------------------------ dado: cubo branco com pontinhos, em três faces
  D.dado = () => {
    const pt = (x, y) => c(x, y, 9, T, 0);
    return p('M30 66 L 66 34 L 170 34 L 134 66 Z', '#F4F2FA') +
      p('M134 66 L 170 34 L 170 138 L 134 170 Z', '#DAD5EA') +
      r(30, 66, 104, 104, 10, '#FFFFFF') +
      pt(56, 92) + pt(108, 92) + pt(82, 118) + pt(56, 144) + pt(108, 144) +
      e(100, 50, 11, 6, T, 0) +
      e(143, 82, 5, 8, T, 0, -20) + e(152, 102, 5, 8, T, 0, -20) + e(161, 122, 5, 8, T, 0, -20) +
      brilho(48, 76, 10, 4, -20, 0.5);
  };

  // ------------------------------------------------------------------ bolo: bolo de aniversário com cobertura e 3 velinhas
  D.bolo = () => {
    let gotas = 'M30 112 Q 30 92 100 92 Q 170 92 170 112 V 120';
    const passos = 7, larg = 140 / passos;
    for (let i = 0; i < passos; i++) {
      const x0 = 170 - i * larg, x1 = x0 - larg, fundo = i % 2 ? 140 : 132;
      gotas += ` Q ${r2(x0 - larg / 2)} ${fundo} ${r2(x1)} 120`;
    }
    gotas += ' Z';
    let velas = '';
    for (const [x, cor] of [[72, '#4FA3F0'], [100, '#FFC93C'], [128, '#5CC84A']]) {
      velas += r(x - 6, 62, 12, 36, 4, cor, 4) + l(`M${x} 62 V 54`, T, 3) + chama(x, 42, 0.62);
    }
    const pinguinhos = [[60, 104, '#4FA3F0'], [84, 112, '#FFC93C'], [116, 112, '#5CC84A'], [140, 104, '#FFFFFF'], [100, 100, '#B57CF0']]
      .map(([x, y, cor]) => r(x - 4, y - 2, 8, 4, 2, cor, 0)).join('');
    return e(100, 170, 84, 14, '#E6EEF6') +
      p('M30 112 V 156 Q 30 172 100 172 Q 170 172 170 156 V 112 Z', '#F6C27A') +
      l('M30 146 Q 100 160 170 146', '#E8504A', 6) +
      p(gotas, '#FF9FC0') +
      pinguinhos + velas +
      brilho(52, 104, 12, 4, -10, 0.55);
  };

  // ------------------------------------------------------------------ pipa: losango colorido com rabiola de lacinhos
  D.pipa = () => {
    const laco = (x, y, cor, rot) => p(`M${x} ${y} L ${x - 14} ${y - 10} L ${x - 14} ${y + 10} Z M${x} ${y} L ${x + 14} ${y - 10} L ${x + 14} ${y + 10} Z`, cor, 3.5)
      .replace('/>', ` transform="rotate(${rot} ${x} ${y})"/>`);
    const A = [88, 14], E = [28, 68], Dd = [148, 68], B = [88, 142], M = [88, 68];
    const tri = (a, b, cor) => p(`M${M[0]} ${M[1]} L ${a[0]} ${a[1]} L ${b[0]} ${b[1]} Z`, cor, 0);
    return l('M88 142 C 96 164 124 152 134 168 C 144 182 164 178 182 186', T, 3) +
      laco(110, 157, '#FF5A5F', 20) + laco(137, 171, '#FFC93C', 30) + laco(163, 180, '#4FA3F0', 15) +
      tri(A, E, '#FF5A5F') + tri(A, Dd, '#FFC93C') + tri(E, B, '#4FA3F0') + tri(Dd, B, '#5CC84A') +
      l('M88 14 V 142 M28 68 H 148', '#8A5A34', 3.5) +
      p('M88 14 L 148 68 L 88 142 L 28 68 Z', 'none') +
      brilho(66, 44, 12, 5, -42, 0.5);
  };

  // ------------------------------------------------------------------ copo: copo de vidro, alto, com água
  D.copo = () => {
    const vidro = 'M44 28 H 156 L 140 172 Q 139 182 128 182 H 72 Q 61 182 60 172 Z';
    return p(vidro, '#EAF7FF') +
      p('M49.4 76 H 150.6 L 140 172 Q 139 182 128 182 H 72 Q 61 182 60 172 Z', '#8ED8F5', 0) +
      e(100, 76, 50.6, 8, '#B9E8FA', 3) +
      p(vidro, 'none') +
      e(100, 28, 56, 9, '#F6FCFF', 4.5) +
      p('M60 46 L 70 46 L 78 166 L 70 166 Z', '#FFFFFF', 0).replace('/>', ' opacity=".7"/>') +
      p('M128 90 L 133 90 L 128 150 L 124 150 Z', '#FFFFFF', 0).replace('/>', ' opacity=".5"/>');
  };

  // ------------------------------------------------------------------ lápis: lápis de cor apontado, na diagonal
  D.lapis = () => g('rotate(-35 100 100)',
    p('M150 80 L 190 100 L 150 120 Z', '#F4D3A0') +
    p('M177 93.5 L 190 100 L 177 106.5 Z', '#3E8BE0', 0) +
    p('M150 80 L 190 100 L 150 120 Z', 'none') +
    p('M28 80 H 150 V 120 H 28 Q 14 120 14 100 Q 14 80 28 80 Z', '#4FA3F0') +
    p('M28 80 H 150 V 120 H 28 Q 14 120 14 100 Q 14 80 28 80 Z', 'none') +
    r(20, 92, 130, 6, 0, '#8CC6FA', 0) + r(20, 108, 130, 6, 0, '#3E8BE0', 0) +
    p('M28 80 H 150 V 120 H 28 Q 14 120 14 100 Q 14 80 28 80 Z', 'none') +
    l('M150 80 Q 157 87 150 93 Q 157 100 150 107 Q 157 113 150 120', T, 4) +
    l('M150 80 V 120', T, 4) +
    brilho(70, 88, 40, 3, 0, 0.5));

  // ------------------------------------------------------------------ navio: navio grande com chaminés, no mar
  D.navio = () => {
    let vigias = '';
    for (let x = 44; x <= 156; x += 22) vigias += c(x, 124, 6, '#FFFFFF', 3.5);
    let janelas = '';
    for (let x = 58; x <= 138; x += 16) janelas += r(x, 92, 9, 10, 2, '#4FA3F0', 0);
    let onda = 'M8 164';
    for (let x = 8; x < 192; x += 23) onda += ` Q ${x + 11.5} 154 ${x + 23} 164`;
    onda += ' V 188 H 8 Z';
    return r(70, 32, 22, 44, 4, '#E8504A') + r(70, 32, 22, 10, 4, T, 0) +
      r(108, 32, 22, 44, 4, '#E8504A') + r(108, 32, 22, 10, 4, T, 0) +
      r(62, 66, 78, 22, 4, '#FFFFFF') +
      r(44, 84, 112, 26, 4, '#FFFFFF') + janelas +
      p('M12 108 H 188 L 166 162 H 34 Z', '#2F4F8F') +
      p('M24 138 H 176 L 166 162 H 34 Z', '#E8504A', 0) +
      p('M12 108 H 188 L 166 162 H 34 Z', 'none') +
      vigias +
      p(onda, '#5EC8E8', 4.5) +
      brilho(40, 114, 16, 3, 0, 0.35);
  };

  // ------------------------------------------------------------------ roda: pneu escuro com aro de metal e raios
  D.roda = () => {
    let sulcos = '', furos = '', parafusos = '';
    for (let i = 0; i < 20; i++) {
      const a = i * 18 * Math.PI / 180;
      sulcos += `M${r2(100 + Math.cos(a) * 70)} ${r2(100 + Math.sin(a) * 70)} L ${r2(100 + Math.cos(a) * 82)} ${r2(100 + Math.sin(a) * 82)} `;
    }
    for (let i = 0; i < 5; i++) {
      const ang = i * 72 - 90, a = ang * Math.PI / 180;
      furos += e(100 + Math.cos(a) * 30, 100 + Math.sin(a) * 30, 13, 9, '#5E6A80', 3.5, ang);
      const b = (ang + 36) * Math.PI / 180;
      parafusos += c(100 + Math.cos(b) * 8, 100 + Math.sin(b) * 8, 2.4, T, 0);
    }
    return c(100, 100, 84, '#45405A') +
      l(sulcos, '#2C283B', 4) +
      c(100, 100, 84, 'none') +
      c(100, 100, 52, '#D5DDE8') +
      c(100, 100, 44, 'none', 3) +
      furos +
      c(100, 100, 15, '#A9B6C8', 4) + parafusos +
      brilho(66, 56, 22, 7, -45, 0.35) + brilho(88, 80, 10, 4, -45, 0.6);
  };

  // ------------------------------------------------------------------ escada: escada de madeira em pé
  D.escada = () => {
    const xe = y => r2(52 + (184 - y) / 168 * 18), xd = y => r2(148 - (184 - y) / 168 * 18);
    let degraus = '';
    for (const y of [40, 74, 108, 142, 174]) degraus += `M${xe(y)} ${y} L ${xd(y)} ${y} `;
    return tc(degraus, '#F2B66A', 11) +
      tc(`M52 184 L 70 16 M148 184 L 130 16`, '#D98C3E', 15) +
      l('M55 170 L 69 40 M145 170 L 132 40', '#FFFFFF', 3, 0.5);
  };

  PC.palavras.registrarDesenhos(Object.fromEntries(Object.keys(D).map(k => [k, () => svg(D[k]())])));
})();
