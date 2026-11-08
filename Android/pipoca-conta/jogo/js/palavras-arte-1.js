/* Pipoca Aprende — desenhos dos objetos do banco de palavras, parte 1 (PROJETO.md 5.8 a 5.14).
   Registra em PC.palavras os desenhos de: pato, gato, rato, leao, foca, vaca, macaca, cavalo, elefante, urubu, dourado,
   formiga, mao, pe, boca, olho, dedo, asa, fada, boneca, sol, lua, nuvem, ilha, uva, banana, tomate.
   Cada desenho: SVG completo (viewBox 0 0 200 200, xmlns, sem ids, XML válido para <img src="data:...">), fundo
   transparente, contorno #3A2A5A, cores chapadas e um brilho branco — o mesmo estilo fofo das figurinhas.
   Bichos com cara de bicho (olhinhos com brilho e bochechas); objetos e partes do corpo sem rosto; nada de texto.
   A macaca é a própria Pipoca (PC.arte.pipoca('feliz')). Página de conferência: jogo/teste/palavras-1.html. */
(function () {
  'use strict';
  const PC = window.PC;
  if (!PC || !PC.palavras) return;

  const T = '#3A2A5A';                // contorno
  const r2 = v => Math.round(v * 100) / 100;

  // ======================================================================== peças (as mesmas ideias de figurinhas.js)
  const tinta = sw => (sw ? ` stroke="${T}" stroke-width="${sw}"` : '');
  const giro = (rot, x, y) => (rot ? ` transform="rotate(${rot} ${x} ${y})"` : '');
  const c = (x, y, r, cor, sw = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${cor}"${tinta(sw)}/>`;
  const e = (x, y, rx, ry, cor, sw = 5, rot = 0) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${giro(rot, x, y)} fill="${cor}"${tinta(sw)}/>`;
  const p = (d, cor, sw = 5) => `<path d="${d}" fill="${cor}"${sw ? tinta(sw) + ' stroke-linejoin="round"' : ''}/>`;
  /** Traço sem preenchimento. */
  const l = (d, cor = T, sw = 5) => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  /** Traço grosso com contorno (perna, cauda, tronco): o contorno por baixo e a cor por cima. */
  const tc = (d, cor, w, sw = 5) => l(d, T, w + sw) + l(d, cor, w);
  const olho = (x, y, r = 5) => c(x, y, r, T, 0) + c(r2(x + r * 0.34), r2(y - r * 0.36), r2(r * 0.42), '#FFFFFF', 0) +
    c(r2(x - r * 0.34), r2(y + r * 0.4), r2(r * 0.17), '#FFFFFF', 0);
  /** Olhinho fechado de alegria (arco). */
  const olhoFeliz = (x, y, r = 6) => l(`M${x - r} ${y + 2} Q ${x} ${y - r * 1.2} ${x + r} ${y + 2}`, T, 4);
  const bochecha = (x, y, rx = 7, ry = 4.5) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA0" opacity=".55"/>`;
  const brilho = (x, y, rx, ry, rot = 0, op = 0.4) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${giro(rot, x, y)} fill="#FFFFFF" opacity="${op}"/>`;
  /** Várias formas "nuas" (sem cor) com um contorno só, por fora (juba, nuvem, mão). */
  const uniao = (formas, cor, sw = 5) =>
    `<g fill="${T}" stroke="${T}" stroke-width="${sw * 2}" stroke-linejoin="round">${formas}</g><g fill="${cor}">${formas}</g>`;
  const cn = (x, y, r) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(r)}"/>`;
  /** Cápsula "nua" (dedo, pena): a base no ponto (x, y), apontando para cima girada de `rot` graus. */
  const cap = (x, y, comp, larg, rot = 0) =>
    `<rect x="${r2(x - larg / 2)}" y="${r2(y - comp)}" width="${larg}" height="${r2(comp + larg / 2)}" rx="${r2(larg / 2)}"${giro(rot, x, y)}/>`;
  /** A mesma cápsula com cor e contorno próprios. */
  const capCor = (x, y, comp, larg, rot, cor, sw = 4.5) =>
    `<rect x="${r2(x - larg / 2)}" y="${r2(y - comp)}" width="${larg}" height="${r2(comp + larg / 2)}" rx="${r2(larg / 2)}"${giro(rot, x, y)} fill="${cor}"${tinta(sw)}/>`;
  /** Estrela de cinco pontas (caminho). */
  function estrela(x, y, R, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R;
      d += (i ? ' L ' : 'M') + r2(x + q * Math.cos(a)) + ' ' + r2(y + q * Math.sin(a));
    }
    return d + ' Z';
  }
  /** Brilhinho de quatro pontas (enfeite da fada e da lua). */
  const faisca = (x, y, s, cor = '#FFD23F') =>
    p(`M${x} ${y - s} Q ${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q ${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q ${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q ${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z`, cor, 2.5);
  /** Perna reta com casco/sapato embaixo (vaca, cavalo): x = lado esquerdo, de y0 a y1. */
  function perna(x, y0, y1, larg, cor, pe) {
    const d = `M${x} ${y0} L ${x} ${y1 - 6} Q ${x} ${y1} ${x + 6} ${y1} L ${x + larg - 6} ${y1} Q ${x + larg} ${y1} ${x + larg} ${y1 - 6} L ${x + larg} ${y0} Z`;
    return p(d, cor, 0) + p(`M${x} ${y1 - 13} H ${x + larg} V ${y1 - 6} Q ${x + larg} ${y1} ${x + larg - 6} ${y1} H ${x + 6} Q ${x} ${y1} ${x} ${y1 - 6} Z`, pe, 0) +
      p(d, 'none', 4.5);
  }

  const svg = miolo => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${miolo}</svg>`;

  // ======================================================================== os desenhos (quadro 200×200, margem ~12)
  const D = {};

  // ---------------------------------------------------------------- bichos
  D.pato = () =>                                       // patinho amarelo boiando, bico laranja
    e(100, 168, 84, 14, '#7FD3F0', 0) + l('M28 170 Q 40 164 52 170 M150 172 Q 162 166 174 172', '#FFFFFF', 4) +
    p('M18 92 C 30 104 44 108 58 104 C 80 96 142 96 162 118 C 178 138 160 174 104 176 C 54 178 28 156 22 128 C 20 116 18 104 18 92 Z', '#FFD43A') +
    p('M70 124 C 88 112 122 114 132 130 C 126 150 94 154 76 142 C 70 138 68 130 70 124 Z', '#F5BC1C', 4.5) +
    l('M86 136 Q 100 144 116 138', '#E0A30E', 3) +
    c(128, 72, 40, '#FFD43A') +
    p('M158 70 C 170 62 188 66 188 78 C 188 90 170 94 158 88 Z', '#FF9A2E', 4.5) + l('M162 80 Q 174 82 184 79', '#D9711A', 3) +
    olho(142, 62, 7) + bochecha(144, 84, 8, 5) +
    brilho(112, 48, 12, 6, -30, 0.5) + brilho(52, 120, 14, 6, -20, 0.35);

  D.gato = () =>                                       // gatinho laranja listrado, sentado de frente, rabo para cima
    tc('M134 176 C 170 178 184 150 174 120 C 170 110 176 100 182 104', '#F4A04A', 14) +
    p('M56 182 C 46 148 62 118 100 118 C 138 118 154 148 144 182 Z', '#F4A04A') +
    e(100, 158, 24, 22, '#FFE6C7', 0) +
    l('M58 146 Q 68 144 72 152 M56 162 Q 64 160 68 166 M142 146 Q 132 144 128 152 M144 162 Q 136 160 132 166', '#D9762A', 4) +
    e(80, 180, 16, 8, '#F4A04A') + e(120, 180, 16, 8, '#F4A04A') + l('M76 180 v 4 M84 180 v 4 M116 180 v 4 M124 180 v 4', T, 2.5) +
    p('M56 64 L 50 16 L 92 38 Z', '#F4A04A') + p('M60 54 L 57 30 L 80 41 Z', '#FFB3C1', 0) +
    p('M144 64 L 150 16 L 108 38 Z', '#F4A04A') + p('M140 54 L 143 30 L 120 41 Z', '#FFB3C1', 0) +
    e(100, 74, 54, 42, '#F4A04A') +
    l('M88 36 L 90 48 M100 33 V 47 M112 36 L 110 48', '#D9762A', 4) +
    e(100, 96, 22, 13, '#FFE6C7', 0) +
    olho(78, 72, 8.5) + olho(122, 72, 8.5) +
    p('M93 85 H 107 L 100 93 Z', '#FF8FA0', 3) +
    l('M100 93 V 97 M100 97 Q 94 104 88 100 M100 97 Q 106 104 112 100', T, 3.5) +
    l('M64 88 L 30 82 M64 96 L 32 102 M136 88 L 170 82 M136 96 L 168 102', T, 3) +
    bochecha(68, 92, 8, 5) + bochecha(132, 92, 8, 5) +
    brilho(72, 50, 12, 6, -25, 0.45) + brilho(78, 132, 8, 4, -30, 0.35);

  D.rato = () =>                                       // camundongo cinza de perfil: orelhonas redondas, focinho fino, rabo de fio
    tc('M46 150 C 14 156 8 120 24 106 C 36 96 50 106 42 118', '#F7B3C0', 4, 4) +
    e(64, 172, 15, 7, '#F7B3C0', 4) +
    e(90, 138, 52, 36, '#B9B7C9') +
    e(96, 154, 32, 14, '#E4E2EE', 0) +
    c(104, 66, 22, '#B9B7C9') + c(104, 66, 13, '#FFB3C1', 0) +
    p('M98 128 C 90 98 110 80 134 84 C 152 87 166 100 178 112 C 186 120 182 130 172 130 C 152 134 120 144 98 128 Z', '#B9B7C9') +
    e(132, 172, 13, 6.5, '#F7B3C0', 4) +
    c(136, 62, 28, '#B9B7C9') + c(136, 62, 17, '#FFB3C1', 0) +
    c(181, 118, 7, '#FF8FA0', 4) +
    l('M168 124 L 190 116 M168 128 L 190 134', T, 2.5) +
    olho(148, 102, 7) + bochecha(148, 118, 7, 4) +
    brilho(126, 46, 8, 4, -30, 0.5) + brilho(62, 118, 14, 6, -25, 0.35);

  D.leao = () => {                                     // leãozinho sentado de frente, com jubona
    let juba = cn(100, 78, 50);
    for (let i = 0; i < 12; i++) {
      const a = i * 30 * Math.PI / 180;
      juba += cn(100 + Math.cos(a) * 44, 78 + Math.sin(a) * 44, 19);
    }
    return tc('M136 176 C 172 178 182 156 178 134', '#F6C445', 9) + c(178, 128, 10, '#C8692A') +
      p('M58 182 C 50 148 66 122 100 122 C 134 122 150 148 142 182 Z', '#F6C445') +
      e(100, 160, 22, 20, '#FFF0C8', 0) +
      e(80, 180, 16, 8, '#F6C445') + e(120, 180, 16, 8, '#F6C445') + l('M76 180 v 4 M84 180 v 4 M116 180 v 4 M124 180 v 4', T, 2.5) +
      uniao(juba, '#D9792B') +
      c(68, 50, 12, '#F6C445') + c(68, 50, 6, '#E8A33A', 0) + c(132, 50, 12, '#F6C445') + c(132, 50, 6, '#E8A33A', 0) +
      c(100, 82, 40, '#F6C445') +
      e(100, 100, 22, 14, '#FFF0C8', 0) +
      olho(84, 78, 7.5) + olho(116, 78, 7.5) +
      p('M91 90 H 109 L 100 99 Z', '#7A4A2A', 3) +
      l('M100 99 V 102 M100 102 Q 94 109 88 105 M100 102 Q 106 109 112 105', T, 3.5) +
      bochecha(76, 98, 7, 4.5) + bochecha(124, 98, 7, 4.5) +
      brilho(84, 58, 11, 5, -25, 0.45) + brilho(60, 44, 10, 5, -40, 0.3);
  };

  /** Bola de praia: gomos vermelho, amarelo e azul. */
  const bola = (x, y, r) => c(x, y, r, '#FFFFFF') +
    p(`M${x} ${y - r} A ${r} ${r} 0 0 0 ${x} ${y + r} Q ${r2(x - r * 0.55)} ${y} ${x} ${y - r} Z`, '#FF5A5A', 0) +
    p(`M${x} ${y - r} A ${r} ${r} 0 0 1 ${x} ${y + r} Q ${r2(x + r * 0.55)} ${y} ${x} ${y - r} Z`, '#4DA3FF', 0) +
    p(`M${x} ${y - r} Q ${r2(x - r * 0.22)} ${y} ${x} ${y + r} Q ${r2(x + r * 0.22)} ${y} ${x} ${y - r} Z`, '#FFD23F', 0) +
    c(x, y, r, 'none');
  D.foca = () =>                                       // foquinha no gelo equilibrando a bola no nariz
    p('M14 170 Q 100 158 186 170 L 182 186 Q 100 194 18 186 Z', '#E4F6FF') + l('M40 176 H 60 M130 178 H 156', '#B8DDF0', 4) +
    p('M52 160 C 40 150 24 148 16 154 C 22 162 24 170 22 178 C 34 176 46 170 56 168 Z', '#7D8DA6') +
    p('M44 168 C 36 140 64 124 92 118 C 110 114 114 100 114 88 C 114 70 126 62 140 64 C 156 66 164 78 162 92 C 160 112 152 132 150 150 C 148 166 134 172 112 172 L 52 172 C 48 172 46 170 44 168 Z', '#97A8C0') +
    e(124, 146, 18, 22, '#C9D5E4', 0, 10) +
    p('M116 140 C 128 148 140 160 132 170 C 120 170 110 158 112 144 Z', '#7D8DA6', 4.5) +
    e(160, 86, 14, 10, '#C9D5E4', 4.5, -20) + c(171, 80, 5, T, 0) +
    l('M156 92 l -8 4 M158 96 l -6 7', T, 2.5) +
    olho(142, 78, 6.5) + bochecha(144, 94, 6, 3.5) +
    bola(166, 52, 20) +
    brilho(158, 42, 6, 3.5, -30, 0.6) + brilho(132, 70, 7, 4, -30, 0.45) + brilho(70, 136, 14, 6, -20, 0.35);

  D.vaca = () =>                                       // vaquinha malhada de pé, cabeça de frente
    l('M24 80 C 16 94 14 108 16 120', T, 4) + e(16, 124, 6, 9, '#4A3A5E', 3) +
    perna(34, 120, 176, 18, '#EDEAF2', '#5A4A3A') + perna(98, 120, 176, 18, '#EDEAF2', '#5A4A3A') +
    e(76, 142, 13, 8, '#FFB3C1', 4) +
    p('M22 84 Q 22 64 46 64 L 116 64 Q 140 64 140 86 L 140 118 Q 140 140 118 140 L 46 140 Q 22 140 22 118 Z', '#FFFFFF') +
    e(56, 90, 16, 11, '#4A3A5E', 0, 20) + e(102, 112, 17, 12, '#4A3A5E', 0, -15) + e(42, 124, 9, 7, '#4A3A5E', 0) +
    perna(52, 126, 180, 18, '#FFFFFF', '#5A4A3A') + perna(116, 126, 180, 18, '#FFFFFF', '#5A4A3A') +
    p('M132 46 C 124 40 122 30 128 24 C 130 32 136 38 142 42 Z', '#F3E3B5', 4) +
    p('M160 46 C 168 40 170 30 164 24 C 162 32 156 38 150 42 Z', '#F3E3B5', 4) +
    e(116, 62, 13, 7, '#FFFFFF', 4.5, 25) + e(176, 62, 13, 7, '#FFFFFF', 4.5, -25) +
    e(116, 62, 6, 3, '#FFB3C1', 0, 25) + e(176, 62, 6, 3, '#FFB3C1', 0, -25) +
    e(146, 74, 27, 30, '#FFFFFF') + e(158, 56, 9, 7, '#4A3A5E', 0, 20) +
    e(146, 98, 24, 16, '#FFB3C1') + c(137, 97, 3.4, T, 0) + c(155, 97, 3.4, T, 0) +
    olho(135, 72, 6) + olho(157, 72, 6) + bochecha(128, 86, 5, 3) + bochecha(164, 86, 5, 3) +
    brilho(48, 74, 14, 5, -10, 0.6) + brilho(134, 54, 7, 3.5, -30, 0.6);

  // a macaca é a própria Pipoca: o miolo do SVG dela (viewBox 0 0 250 270) encaixado no quadro
  function pipocaMiolo(pose) {
    let s = '';
    try { s = String((PC.arte && PC.arte.pipoca && PC.arte.pipoca(pose)) || ''); } catch (err) { s = ''; }
    const ini = s.indexOf('>'), fim = s.lastIndexOf('</svg>');
    if (!/^<svg[\s>]/.test(s) || ini < 0 || fim < ini) return '';
    s = s.slice(ini + 1, fim);
    // a boca aberta só aparece com o CSS da fala; dentro de uma imagem ela ficaria visível por cima da fechada
    s = s.replace(/<g class="pip-boca-aberta">[\s\S]*?<\/g>/, '');
    if (s.indexOf('pip-boca-aberta') >= 0) s = s.replace(/class="pip-boca-aberta"/g, 'opacity="0"');
    s = s.replace(/<ellipse[^>]*fill="rgba\([^"]*"\/>/, '');   // sem a sombrinha do chão
    return s.replace(/\sclass="[^"]*"/g, '');
  }
  D.macaca = () => {
    const miolo = pipocaMiolo('feliz');
    if (!miolo) throw new Error('arte da Pipoca ainda não carregou');   // sem cache: tenta de novo na próxima vez
    // a Pipoca feliz ocupa x 24..226 e y 52..262 no quadro dela
    const k = 0.82, x = r2(100 - 125 * k), y = r2(188 - 262 * k);
    return `<g transform="translate(${x} ${y}) scale(${k})">${miolo}</g>`;
  };

  D.cavalo = () =>                                     // cavalinho marrom de perfil, crina e rabo escuros
    p('M36 92 C 18 100 12 130 20 158 C 30 154 34 138 36 122 C 40 110 44 100 42 94 Z', '#6B3E22') +
    perna(40, 112, 176, 15, '#B57744', '#4A2E1E') + perna(110, 112, 176, 15, '#B57744', '#4A2E1E') +
    p('M110 100 C 116 76 124 60 134 46 L 160 58 C 150 74 144 94 142 120 Z', '#C9874E') +
    e(84, 104, 56, 28, '#C9874E') +
    perna(58, 118, 180, 15, '#C9874E', '#4A2E1E') + perna(128, 118, 180, 15, '#C9874E', '#4A2E1E') +
    p('M140 36 L 141 14 L 156 30 Z', '#C9874E', 4.5) + p('M143 31 L 143.5 21 L 151 29 Z', '#E6B58A', 0) +
    p('M132 46 C 134 30 152 24 162 34 L 184 62 C 190 72 184 84 170 80 L 148 70 C 138 64 131 56 132 46 Z', '#C9874E') +
    e(175, 72, 11, 9, '#E6B58A', 0) + c(179, 69, 2.6, T, 0) + l('M170 80 Q 176 82 180 79', T, 2.5) +
    p('M138 30 C 126 38 116 58 110 78 C 106 90 104 100 108 108 C 116 94 122 78 130 64 C 136 54 142 44 148 38 Z', '#6B3E22', 4) +
    p('M148 30 C 140 28 136 36 140 44 C 142 38 146 34 152 34 Z', '#6B3E22', 3.5) +
    olho(154, 48, 6.5) + bochecha(160, 62, 6, 3.5) +
    brilho(66, 90, 16, 6, -12, 0.35) + brilho(146, 36, 6, 3, -30, 0.45);

  D.elefante = () =>                                   // elefantinho de perfil, tromba levantada, orelhona
    l('M32 106 C 22 114 20 124 22 134', T, 4) + e(22, 138, 4, 6, T, 0) +
    perna(42, 130, 178, 24, '#93A3C6', '#93A3C6') + perna(106, 130, 178, 24, '#93A3C6', '#93A3C6') +
    e(88, 112, 58, 42, '#A9B8D6') +
    perna(62, 136, 182, 24, '#A9B8D6', '#A9B8D6') + perna(126, 136, 182, 24, '#A9B8D6', '#A9B8D6') +
    l('M66 180 v -4 M74 180 v -4 M82 180 v -4 M130 180 v -4 M138 180 v -4 M146 180 v -4', '#FFFFFF', 4) +
    tc('M156 100 C 176 110 188 96 186 76 C 185 66 180 60 174 60', '#A9B8D6', 18) +
    l('M180 84 h -6 M178 96 h -7', '#8796B8', 3) +
    c(140, 82, 38, '#A9B8D6') +
    e(116, 88, 22, 29, '#93A3C6', 5, -8) + e(117, 90, 13, 18, '#F6B5C6', 0, -8) +
    olho(154, 72, 7) + bochecha(160, 90, 6, 3.5) +
    brilho(138, 54, 10, 5, -20, 0.5) + brilho(62, 88, 18, 7, -15, 0.35);

  D.urubu = () =>                                      // urubu preto no galho, cabeça pelada cinza e bico curvo
    p('M22 160 Q 100 150 178 162 L 177 172 Q 100 162 23 170 Z', '#8A5A34') +
    p('M70 132 L 34 172 L 58 168 L 52 182 L 84 152 Z', '#2E2838', 4.5) +
    e(98, 112, 44, 50, '#463F55', 5, -8) +
    e(104, 128, 22, 24, '#5A5268', 0, -8) +
    p('M60 80 C 50 110 58 146 86 166 C 104 150 108 116 96 86 C 86 74 68 72 60 80 Z', '#2E2838', 4.5) +
    l('M70 112 Q 76 132 88 146 M66 96 Q 72 116 84 128', '#6E6680', 3) +
    l('M92 160 l -4 10 M100 160 v 10 M108 160 l 4 10 M112 158 l 0 12 M120 158 l 4 10', T, 4) +
    e(124, 84, 26, 13, '#2E2838', 4.5, -10) +
    c(130, 58, 26, '#8E8898') +
    l('M114 42 q 6 -4 12 0 M122 76 q 6 3 12 0', '#77718A', 2.5) +
    p('M150 52 C 166 50 178 60 176 76 C 174 82 170 82 168 78 C 166 70 160 68 152 70 Z', '#EFE4CC', 4) +
    l('M152 61 h 8', T, 2.5) +
    olho(138, 52, 7) + bochecha(138, 68, 6, 3.5) +
    brilho(122, 40, 8, 4, -30, 0.45) + brilho(80, 80, 12, 5, -40, 0.3);

  D.dourado = () =>                                    // peixe dourado de rio, com bolhinhas
    p('M48 104 L 16 72 C 24 94 24 114 16 136 Z', '#F79A1B') + l('M28 88 L 40 102 M28 120 L 40 106', '#D9761A', 3) +
    p('M78 76 C 88 48 124 46 142 74 Z', '#F79A1B') +
    p('M96 130 L 86 156 L 116 136 Z', '#F79A1B', 4.5) +
    p('M40 104 C 60 66 130 58 168 90 C 178 98 178 108 168 116 C 130 148 60 142 40 104 Z', '#FFC53D') +
    e(110, 122, 40, 10, '#FFE38A', 0) +
    l('M86 92 q 8 8 0 18 M102 88 q 9 11 0 24 M118 88 q 9 11 0 24', '#E8942A', 3) +
    l('M140 82 Q 130 102 140 122', '#E8942A', 3.5) +
    p('M40 104 C 60 66 130 58 168 90 C 178 98 178 108 168 116 C 130 148 60 142 40 104 Z', 'none') +
    olho(154, 96, 7.5) + bochecha(152, 112, 6, 3.5) + l('M174 106 q -6 4 -11 2', T, 3) +
    c(182, 70, 5, '#DFF5FF', 3) + c(172, 46, 7, '#DFF5FF', 3) +
    brilho(96, 76, 18, 6, -10, 0.45);

  D.formiga = () =>                                    // formiguinha vermelha de perfil, seis perninhas
    l('M58 124 L 40 156 L 30 158 M100 128 L 96 162 L 88 164 M110 124 L 136 156 L 146 158', T, 5) +
    e(56, 116, 36, 28, '#C9472E', 5, -8) +
    l('M42 98 Q 34 116 42 136 M60 92 Q 52 114 60 140', '#A8361F', 3.5) +
    e(102, 112, 18, 13, '#C9472E') +
    l('M72 130 L 60 160 L 50 162 M94 124 L 84 164 L 76 166 M120 120 L 150 150 L 160 150', T, 5) +
    l('M146 70 C 150 50 160 40 174 40 M130 70 C 128 52 120 42 108 38', T, 4) + c(174, 40, 5, T, 0) + c(108, 38, 5, T, 0) +
    c(142, 96, 30, '#D85536') +
    olho(152, 90, 7.5) + bochecha(150, 108, 6.5, 4) + l('M160 108 Q 166 112 170 106', T, 3) +
    brilho(132, 78, 10, 5, -30, 0.45) + brilho(46, 102, 10, 5, -30, 0.35);

  // ---------------------------------------------------------------- partes do corpo (sem rosto)
  const PELE = '#F7C9A0', PELE_ESC = '#E3A57C', MANGA = '#6EC3F2';

  D.mao = () => {                                      // mão aberta mostrando a palma
    const formas = `<rect x="56" y="90" width="88" height="76" rx="30"/>` +
      cap(72, 106, 64, 24, -12) + cap(95, 100, 74, 24, -3) + cap(117, 102, 68, 23, 7) + cap(137, 112, 50, 21, 18) +
      cap(64, 142, 40, 25, -60) + `<rect x="76" y="150" width="50" height="30"/>`;
    return `<g transform="translate(8 0)">` +
      uniao(formas, PELE) +
      l('M76 120 Q 96 112 122 120 M80 140 Q 98 132 116 140 M76 148 Q 84 132 82 116', PELE_ESC, 3.5) +
      l('M62 66 h 10 M88 46 h 10 M111 50 h 10 M134 78 h 9', PELE_ESC, 3) +
      `<rect x="66" y="166" width="70" height="22" rx="9" fill="${MANGA}" stroke="${T}" stroke-width="5"/>` +
      brilho(92, 46, 4, 10, 0, 0.45) + brilho(74, 104, 8, 5, -20, 0.4) + '</g>';
  };

  D.pe = () => {                                       // pezinho descalço visto de cima, com os cinco dedinhos
    const dedo = (x, y, r) => c(x, y, r, PELE, 4.5) + e(x, r2(y - r * 0.25), r2(r * 0.5), r2(r * 0.4), '#FFE3EC', 0);
    return '<g transform="translate(0 4)">' + dedo(150, 66, 9) + dedo(140, 46, 10.5) + dedo(122, 32, 12) + dedo(100, 26, 13) + dedo(70, 30, 19) +
      p('M54 62 C 56 44 84 42 104 46 C 128 50 152 62 152 92 C 152 124 136 140 132 160 C 128 180 112 188 96 186 C 74 184 66 166 70 144 C 74 120 52 92 54 62 Z', PELE) +
      l('M110 130 Q 104 112 118 96', PELE_ESC, 3.5) +
      brilho(84, 66, 14, 7, -15, 0.45) + brilho(64, 22, 6, 3.5, -20, 0.5) + '</g>';
  };

  D.boca = () =>                                       // boca sorrindo com lábios (sem o resto do rosto)
    p('M20 90 C 46 66 80 72 100 82 C 120 72 154 66 180 90 C 166 142 134 160 100 160 C 66 160 34 142 20 90 Z', '#F0566A') +
    p('M40 96 C 70 100 130 100 160 96 C 150 128 128 142 100 142 C 72 142 50 128 40 96 Z', '#7A2A44', 4) +
    p('M44 98 C 72 102 128 102 156 98 C 154 106 150 112 146 116 L 54 116 C 50 112 46 106 44 98 Z', '#FFFFFF', 0) +
    l('M54 116 H 146', '#E4DCEA', 2) +
    p('M72 136 C 76 120 96 118 100 126 C 104 118 124 120 128 136 C 118 142 82 142 72 136 Z', '#FF8FA0', 0) +
    p('M40 96 C 70 100 130 100 160 96 C 150 128 128 142 100 142 C 72 142 50 128 40 96 Z', 'none', 4) +
    l('M18 88 Q 12 92 14 98 M182 88 Q 188 92 186 98', T, 4) +
    brilho(64, 82, 14, 4, -10, 0.5) + brilho(110, 152, 16, 4, 0, 0.35);

  D.olho = () =>                                       // um olho grandão com cílios e sobrancelha
    l('M40 46 Q 100 18 160 46', '#7A4A2A', 9) +
    l('M38 98 L 24 86 M54 82 L 44 64 M76 72 L 70 52 M100 68 V 48 M124 72 L 130 52 M146 82 L 156 64 M162 98 L 176 86', T, 6) +
    p('M22 108 C 52 60 148 60 178 108 C 148 156 52 156 22 108 Z', '#FFFFFF') +
    c(100, 108, 32, '#4A9BE0', 4.5) + c(100, 108, 22, '#2F6FB8', 0) + c(100, 108, 14, T, 0) +
    c(112, 96, 8, '#FFFFFF', 0) + c(90, 120, 4, '#FFFFFF', 0) +
    p('M22 108 C 52 60 148 60 178 108 C 148 156 52 156 22 108 Z', 'none') +
    l('M56 154 Q 100 172 144 154', '#E3B5C4', 4) +
    brilho(60, 92, 8, 4, -30, 0.25);

  D.dedo = () => {                                     // mão fechada com o indicador para cima
    const formas = `<rect x="52" y="88" width="94" height="80" rx="28"/>` + cap(72, 100, 82, 26, 0) +
      `<rect x="76" y="150" width="50" height="30"/>`;
    return `<g transform="translate(4 0)">` +
      uniao(formas, PELE) +
      capCor(122, 110, 32, 22, -90, PELE) + capCor(124, 132, 34, 22, -90, PELE) + capCor(124, 154, 32, 20, -90, PELE) +
      `<rect x="54" y="122" width="58" height="24" rx="12" fill="${PELE}" stroke="${T}" stroke-width="4.5" transform="rotate(-8 83 134)"/>` +
      e(72, 28, 8, 7, '#FFE3EC', 3) +
      l('M64 64 h 14', PELE_ESC, 3) +
      `<rect x="66" y="166" width="70" height="22" rx="9" fill="${MANGA}" stroke="${T}" stroke-width="5"/>` +
      brilho(66, 50, 4, 12, 0, 0.45) + brilho(120, 102, 8, 3.5, 0, 0.45) + '</g>';
  };

  D.asa = () => {                                      // uma asa de passarinho: penas compridas em leque, a de cima a maior
    // cinco penas deitadas (pontas para a direita e para cima), cada uma mais curta que a de cima; um "ombro" fofo
    // de penas pequenas cobre as bases
    let penas = '';
    for (let i = 4; i >= 0; i--) {
      const y = 60 + i * 27, comp = 136 - i * 22, cor = i % 2 ? '#4DA3E0' : '#6FBCEB';
      penas += capCor(44, y, comp, 34, 90 + i * 6, cor, 4.5) + l(`M66 ${y} H ${44 + comp - 12}`, '#2F7FC0', 2.5).replace('/>', ` transform="rotate(${i * 6} 44 ${y})"/>`);
    }
    return `<g transform="translate(14 6) rotate(-16 44 120)">` + penas +
      p('M32 36 C 60 28 84 46 84 74 C 94 98 88 130 68 146 C 54 160 30 162 22 142 C 12 112 10 54 32 36 Z', '#A8DDF7') +
      l('M40 64 q 10 6 22 2 M36 94 q 12 6 26 0 M36 126 q 12 6 22 0', '#6FBCEB', 3.5) +
      brilho(40, 52, 12, 5, -10, 0.6) + '</g>';
  };

  // ---------------------------------------------------------------- personagens
  D.fada = () => {                                     // fadinha com asas e varinha de estrela
    const asa = (x, y, rx, ry, rot) => e(x, y, rx, ry, '#D6F1FF', 4.5, rot) + e(x, y, r2(rx * 0.55), r2(ry * 0.6), '#FFFFFF', 0, rot);
    return asa(62, 92, 24, 40, -38) + asa(138, 92, 24, 40, 38) + asa(70, 136, 15, 24, -60) + asa(130, 136, 15, 24, 60) +
      tc('M92 158 V 176 M108 158 V 176', '#F2C29B', 8, 4.5) +
      e(89, 180, 10, 6, '#FF6FA8', 4) + e(111, 180, 10, 6, '#FF6FA8', 4) +
      tc('M88 100 Q 74 110 66 126', '#F2C29B', 8, 4.5) + c(65, 128, 6.5, '#F2C29B', 4) +
      p('M86 92 C 80 112 62 140 56 162 Q 78 170 100 166 Q 122 170 144 162 C 138 140 120 112 114 92 Z', '#FF9EC8') +
      l('M66 150 Q 100 160 134 150', '#FF6FA8', 3.5) + c(100, 106, 3.5, '#FFD23F', 2.5) +
      tc('M114 100 Q 128 98 136 86', '#F2C29B', 8, 4.5) +
      tc('M138 86 L 158 52', '#FFFFFF', 4, 4) +
      p(estrela(160, 44, 20, 9), '#FFD23F', 4) + faisca(184, 70, 7) + faisca(138, 30, 6) + faisca(182, 24, 5) +
      c(138, 84, 7, '#F2C29B', 4) +
      c(100, 26, 11, '#8A4F2A') +
      c(100, 58, 31, '#8A4F2A') +
      c(100, 64, 24, '#F7CFA8') +
      p('M74 62 C 74 38 126 38 126 62 C 116 50 106 46 100 54 C 94 46 84 50 74 62 Z', '#8A4F2A', 0) +
      olho(91, 66, 5) + olho(109, 66, 5) + l('M94 77 Q 100 82 106 77', T, 3) +
      bochecha(84, 75, 5, 3) + bochecha(116, 75, 5, 3) +
      brilho(86, 40, 9, 4, -25, 0.45) + brilho(76, 120, 6, 12, 25, 0.35);
  };

  D.boneca = () =>                                     // boneca de pano: cabelo de lã, vestido com remendo, pontos de costura
    tc('M90 150 V 174 M110 150 V 174', '#FFFFFF', 11, 4.5) +
    l('M84.5 158 H 95.5 M84.5 166 H 95.5 M104.5 158 H 115.5 M104.5 166 H 115.5', '#F0566A', 4) +
    e(88, 180, 11, 7, '#5A3A7A', 4) + e(112, 180, 11, 7, '#5A3A7A', 4) +
    tc('M80 102 C 66 112 58 126 54 140', '#F7CFA8', 12, 4.5) + c(53, 144, 9, '#F7CFA8', 4.5) +
    tc('M120 102 C 134 112 142 126 146 140', '#F7CFA8', 12, 4.5) + c(147, 144, 9, '#F7CFA8', 4.5) +
    p('M78 96 Q 100 88 122 96 L 140 154 Q 100 166 60 154 Z', '#5CB8E6') +
    p('M78 96 Q 100 104 122 96 L 124 104 Q 100 112 76 104 Z', '#FFFFFF', 3) +
    `<rect x="106" y="124" width="20" height="18" rx="3" fill="#FFD23F" stroke="${T}" stroke-width="3" transform="rotate(-8 116 133)"/>` +
    `<path d="M109 128 L 123 126 M110 138 L 124 136" fill="none" stroke="${T}" stroke-width="2" stroke-dasharray="3 3"/>` +
    c(88, 122, 3.5, '#FFFFFF', 2.5) + c(88, 136, 3.5, '#FFFFFF', 2.5) +
    // tranças de lã com laços
    tc('M66 54 C 50 66 46 84 52 100', '#F07A2E', 12, 4.5) + tc('M134 54 C 150 66 154 84 148 100', '#F07A2E', 12, 4.5) +
    p('M52 96 L 40 90 L 42 104 Z M52 96 L 64 90 L 62 104 Z', '#FF6FA8', 3.5) +
    p('M148 96 L 136 90 L 138 104 Z M148 96 L 160 90 L 158 104 Z', '#FF6FA8', 3.5) +
    c(100, 60, 34, '#F7CFA8') +
    uniao(cn(72, 44, 12) + cn(84, 32, 13) + cn(100, 27, 14) + cn(116, 32, 13) + cn(128, 44, 12), '#F07A2E', 4.5) +
    l('M78 40 q 4 -4 8 0 M94 32 q 5 -5 10 0 M112 36 q 4 -4 8 0', '#C85A1A', 2.5) +
    c(87, 62, 6, T, 0) + c(113, 62, 6, T, 0) + c(89, 60, 2, '#FFFFFF', 0) + c(115, 60, 2, '#FFFFFF', 0) +
    c(78, 76, 6, '#FF8FA0', 0) + c(122, 76, 6, '#FF8FA0', 0) +
    `<path d="M88 78 Q 100 90 112 78" fill="none" stroke="#C8304A" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="4 4"/>` +
    brilho(84, 44, 7, 3.5, -30, 0.4) + brilho(86, 112, 5, 10, 15, 0.35);

  // ---------------------------------------------------------------- céu e natureza (sem rosto)
  D.sol = () => {                                      // sol de raios redondinhos
    let raios = '';
    for (let i = 0; i < 12; i++) {
      const a = i * 30 * Math.PI / 180, longo = i % 2 === 0;
      const R0 = 54, R1 = longo ? 86 : 76, w = longo ? 0.2 : 0.17;
      const pt = (r, da) => `${r2(100 + Math.cos(a + da) * r)} ${r2(100 + Math.sin(a + da) * r)}`;
      raios += p(`M${pt(R0, -w)} L ${pt(R1, 0)} L ${pt(R0, w)} Z`, longo ? '#FFB020' : '#FFC93A', 4.5);
    }
    return raios + c(100, 100, 56, '#FFD23F') + c(100, 100, 42, '#FFE36B', 0) +
      brilho(80, 76, 16, 9, -35, 0.55);
  };

  D.lua = () => {                                      // lua crescente com estrelinhas (sem rosto)
    // círculo de fora (100, 100) r 76 menos o círculo de dentro (134, 76) r 62: pontas em (100.2, 23.9) e (171.7, 125.3)
    const forma = 'M100.2 23.9 A 76 76 0 1 0 171.7 125.3 A 62 62 0 0 1 100.2 23.9 Z';
    return p(forma, '#FFE88A') +
      c(56, 120, 9, '#F5D564', 0) + c(80, 154, 6, '#F5D564', 0) + c(48, 86, 5, '#F5D564', 0) +
      p(forma, 'none') +
      p(estrela(150, 54, 15, 6.5), '#FFD23F', 3.5) + faisca(176, 92, 7) + faisca(126, 26, 5) +
      brilho(52, 62, 6, 14, 30, 0.55);
  };

  D.nuvem = () =>                                      // nuvem fofa
    uniao(cn(62, 110, 30) + cn(100, 86, 40) + cn(140, 102, 32) + cn(162, 126, 22) + cn(38, 132, 22) +
      '<rect x="38" y="112" width="126" height="42" rx="21"/>', '#F4FAFF') +
    p('M44 146 C 70 152 130 152 158 146 C 160 140 162 136 164 132 C 150 146 60 146 38 134 C 39 140 41 144 44 146 Z', '#D3E8F8', 0) +
    brilho(86, 66, 16, 8, -20, 0.9) + brilho(56, 98, 8, 5, -30, 0.8);

  D.ilha = () =>                                       // ilhinha de areia com coqueiro, no meio do mar
    e(100, 160, 88, 26, '#5EC8E8') + l('M24 164 q 8 -6 16 0 M160 166 q 8 -6 16 0 M60 178 q 8 -6 16 0 M126 180 q 8 -6 16 0', '#FFFFFF', 3.5) +
    p('M40 162 C 52 128 148 128 160 162 C 130 170 70 170 40 162 Z', '#F6D58A') +
    brilho(80, 144, 14, 4, -8, 0.5) +
    tc('M98 156 C 96 124 102 92 118 66', '#A8703E', 12) +
    l('M95 140 h 10 M96 122 h 10 M100 104 h 10 M106 88 h 10', '#7A4A22', 3) +
    p('M118 66 C 100 46 70 46 50 64 C 72 60 92 62 118 66 Z', '#4FB548') +
    p('M118 66 C 96 64 72 76 62 100 C 82 84 100 74 118 66 Z', '#5CC84A') +
    p('M118 66 C 132 44 160 40 182 54 C 160 54 140 58 118 66 Z', '#4FB548') +
    p('M118 66 C 140 64 164 76 172 100 C 152 84 136 74 118 66 Z', '#5CC84A') +
    p('M118 66 C 112 46 120 26 140 18 C 130 34 124 50 118 66 Z', '#5CC84A') +
    c(112, 72, 7, '#8A5A34', 4) + c(125, 74, 7, '#8A5A34', 4) +
    brilho(78, 54, 10, 3, -10, 0.45);

  // ---------------------------------------------------------------- frutas
  D.uva = () => {                                      // cacho de uva roxa
    const linhas = [[74, [50.5, 83.5, 116.5, 149.5]], [103, [67, 100, 133]], [132, [83.5, 116.5]], [160, [100]]];
    let bagos = '';
    linhas.forEach(([y, xs]) => xs.forEach(x => { bagos += c(x, y, 19, '#8E5BD6', 4.5) + brilho(r2(x - 6), y - 7, 5, 3, -35, 0.55); }));
    return tc('M100 58 C 100 42 104 30 112 20', '#7A4A22', 6) +
      p('M110 40 C 124 22 152 20 166 34 C 152 48 128 50 110 40 Z', '#5CC84A', 4.5) + l('M114 39 Q 136 36 158 34', '#3E9A30', 2.5) +
      bagos;
  };

  D.banana = () => {                                   // penca de três bananas
    const forma = 'M34 60 C 30 140 108 186 178 128 C 182 124 182 118 176 116 C 124 140 74 114 64 58 C 62 50 36 50 34 60 Z';
    const banana = cor => p(forma, cor) + l('M48 72 C 54 124 104 156 160 136', '#E8B820', 3) +
      p('M178 128 C 182 124 182 118 176 116 L 168 120 C 170 124 172 127 178 128 Z', '#6B4A22', 0) + p(forma, 'none');
    return `<g transform="rotate(-24 48 54)">${banana('#F2C82E')}</g>` +
      `<g transform="rotate(-12 48 54)">${banana('#FFD83A')}</g>` +
      banana('#FFE35A') +
      p('M36 60 L 34 34 C 34 28 46 26 48 32 L 62 56 Z', '#8BC34A', 4.5) + p('M34 34 C 34 28 46 26 48 32 L 50 40 L 35 42 Z', '#6B4A22', 0) +
      brilho(60, 112, 7, 22, -40, 0.5);
  };

  D.tomate = () =>                                     // tomate vermelho com as folhinhas verdes em estrela
    p('M100 52 C 150 44 182 76 180 116 C 178 156 144 180 100 180 C 56 180 22 156 20 116 C 18 76 50 44 100 52 Z', '#F0453A') +
    p(estrela(100, 54, 34, 12), '#4FB548', 4) +
    tc('M100 52 Q 100 36 110 26', '#4FB548', 7, 4.5) +
    brilho(56, 98, 10, 22, 20, 0.5) + brilho(70, 72, 5, 4, 0, 0.5);

  // ======================================================================== registro
  const registro = {};
  Object.keys(D).forEach(id => { registro[id] = () => svg(D[id]()); });
  PC.palavras.registrarDesenhos(registro);
})();
