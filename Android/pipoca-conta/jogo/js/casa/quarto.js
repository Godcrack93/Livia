/* Casa da Pipoca (esboço) — o QUARTO (andar de cima, à esquerda da escada).
   Cada objeto é uma função própria desenhada em volta de (0,0) = meio do pé no chão
   (nos objetos de parede, (0,0) = o ponto onde ele se prende: prego, gancho ou a tábua da prateleira). */
(function () {
  const { T, r, c, e, p, l, f, fr, fe, brilho, sombra, tom, em, n } = CASA;

  const CORAL = '#FF7A6B', AMARELO = '#FFC93C', AMARELO2 = '#FFD23F', AGUA = '#2EC4B6', ROXO = '#9B7BFF',
    VERDE = '#5CC84A', ROSA = '#FF8FC2', AZUL = '#4DA3FF', MAD = '#C98A55', MAD2 = '#A9703F', MAD3 = '#8A5A34', CREME = '#FFF4E6';

  let seq = 0;
  const uid = () => 'quarto-' + (++seq);
  /** recorta um conteúdo pelo caminho d (para estampas que não podem vazar) */
  const recorte = (d, conteudo) => { const id = uid(); return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${conteudo}</g>`; };
  /** linha tracejada (costura) */
  const costura = (d, cor, sw = 3, tr = '7 6') => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${sw}" stroke-dasharray="${tr}" stroke-linecap="round"/>`;
  /** estrela de 5 pontas */
  const estrelaD = (cx, cy, R, ri = R * .48) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? ri : R;
      d += (i ? ' L ' : 'M') + n(cx + Math.cos(a) * rr) + ' ' + n(cy + Math.sin(a) * rr);
    }
    return d + ' Z';
  };
  /** veio de madeira numa área (riscos ondulados sem contorno) */
  const veio = (x, y, w, h, cor, passo = 16) => {
    let s = '';
    for (let yy = y + passo / 2, i = 0; yy < y + h; yy += passo, i++) {
      const a = x + 8 + (i * 37) % Math.max(10, w * .3), b = Math.min(x + w - 8, a + w * .55);
      s += l(`M${n(a)} ${n(yy)} q ${n((b - a) / 4)} -4 ${n((b - a) / 2)} 0 t ${n((b - a) / 2)} 0`, cor, 2.5);
    }
    return s;
  };

  // =====================================================================================  FUNDO
  function papelDeParede(L, yFim) {
    const { x0, x1, topo } = L;
    let s = fr(x0, topo, x1 - x0, yFim - topo, '#EFE6FB');
    // estampa: florzinhas de 4 pétalas e bolinhas, em quincôncio
    for (let j = 0, y = topo + 70; y < yFim - 20; y += 64, j++) {
      for (let i = 0, x = x0 + (j % 2 ? 46 : 14); x < x1; x += 64, i++) {
        if ((i + j) % 2) s += fe(x, y, 4.5, 4.5, '#E0D2F5');
        else s += f(`M${x} ${y - 9} Q ${x + 3} ${y - 3} ${x + 9} ${y} Q ${x + 3} ${y + 3} ${x} ${y + 9} Q ${x - 3} ${y + 3} ${x - 9} ${y} Q ${x - 3} ${y - 3} ${x} ${y - 9} Z`, '#E3D6F7');
      }
    }
    // sanca no alto e a sombra que ela faz
    s += fr(x0, topo, x1 - x0, 34, '#FFF4E6') + fr(x0, topo + 34, x1 - x0, 10, '#DCCDF1') + l(`M${x0} ${topo + 34} H ${x1}`, T, 4);
    s += fr(x0, topo + 24, x1 - x0, 6, '#F1DEC6');
    return s;
  }
  function lambri(L, y0, y1) {
    const { x0, x1 } = L;
    let s = fr(x0, y0, x1 - x0, y1 - y0, '#D9F1EA');
    for (let x = x0 + 14; x < x1 - 40; x += 104) {
      s += fr(x, y0 + 22, 84, y1 - y0 - 44, '#C8E8DF', 10) + fr(x + 6, y0 + 28, 72, 5, '#fff', 3, .55) + fr(x + 74, y0 + 28, 5, y1 - y0 - 56, '#B5DDD2', 2);
    }
    // meia-cana de madeira em cima do lambri
    s += r(x0 - 4, y0 - 10, x1 - x0 + 8, 16, MAD, 5, 4) + fr(x0, y0 - 6, x1 - x0, 4, '#E0A574');
    return s;
  }
  function piso(L) {
    const { x0, x1, piso: y } = L;
    const top = y - 40, alt = 80, fil = 3, h = alt / fil, tons = ['#E6BC8A', '#DDAF7C', '#EAC493', '#E1B583'];
    let s = fr(x0, top, x1 - x0, alt + 2, '#E2B583');
    for (let i = 0; i < fil; i++) {
      const yy = top + i * h;
      let x = x0 - (i * 97) % 180, k = i;
      while (x < x1) {
        const w = 170 + ((k * 53) % 70), xa = Math.max(x, x0), xb = Math.min(x + w, x1);
        s += fr(xa, yy, xb - xa, h, tons[k % 4]) + fr(xa, yy + 2, xb - xa, 3, '#fff', 0, .18);
        if (x + w < x1) s += l(`M${n(x + w)} ${n(yy + 3)} V ${n(yy + h - 3)}`, '#B98A5A', 3);
        // nó / veio
        if (k % 3 === 0 && xb - xa > 80) s += l(`M${n(xa + 30)} ${n(yy + h / 2)} q 20 -4 40 0 t 40 0`, '#C99C6A', 2.5);
        x += w; k++;
      }
      if (i) s += l(`M${x0} ${n(yy)} H ${x1}`, '#B98A5A', 3);
    }
    s += l(`M${x0} ${top} H ${x1}`, T, 4);
    return s;
  }
  function rodape(L) {
    const { x0, x1, piso: y } = L;
    return r(x0 - 4, y - 66, x1 - x0 + 8, 28, CREME, 4, 4) + fr(x0, y - 60, x1 - x0, 5, '#fff', 0, .7) + fr(x0, y - 46, x1 - x0, 6, '#EAD9C2');
  }
  function janela(cx, y0, w = 230, h = 240, lado = 1) {
    // y0 = topo da moldura; lado = de que lado da vista fica a árvore (1 direita, -1 esquerda)
    const x0 = cx - w / 2, ix = x0 + 20, iy = y0 + 20, iw = w - 40, ih = h - 40;
    let s = '';
    // moldura externa
    s += r(x0, y0, w, h, '#FFFFFF', 18, 6) + fr(x0 + 6, y0 + 6, w - 12, 8, '#EDE6F7', 8);
    // vista: céu, morro, copa de árvore, nuvem, passarinho
    let v = fr(ix, iy, iw, ih, '#A9DEFF') + fr(ix, iy + ih * .55, iw, ih * .45, '#C7EBFF');
    v += f(`M${ix - 10} ${iy + ih - 40} Q ${ix + 60} ${iy + ih - 90} ${ix + 120} ${iy + ih - 50} Q ${ix + 170} ${iy + ih - 80} ${ix + iw + 10} ${iy + ih - 55} V ${iy + ih + 10} H ${ix - 10} Z`, '#A8DDB5');
    v += p(`M${lado > 0 ? ix + 44 : ix + iw - 110} ${iy + 54} q -14 -22 12 -24 q 6 -20 30 -10 q 22 -8 26 14 q 20 4 8 20 Z`, '#fff', 4);
    // árvore: tronco e copa
    const tx = lado > 0 ? ix + iw - 46 : ix + 50, ty = iy + ih;
    v += p(`M${tx - 10} ${ty + 4} L ${tx - 7} ${ty - 70} L ${tx + 9} ${ty - 70} L ${tx + 12} ${ty + 4} Z`, MAD3, 4);
    v += [[-34, -96, 34], [14, -122, 40], [44, -82, 32], [-10, -70, 30]].map(([x, y, rr]) => c(tx + x, ty + y, rr, '#5CC84A', 5)).join('');
    v += [[-34, -96, 34], [14, -122, 40], [44, -82, 32], [-10, -70, 30]].map(([x, y, rr]) => fe(tx + x, ty + y, rr - 3, rr - 3, '#5CC84A')).join('');
    v += [[-30, -84], [24, -104], [44, -70], [-4, -60], [6, -130]].map(([x, y]) => fe(tx + x, ty + y, 9, 6, '#47A83A')).join('');
    v += [[-18, -110], [30, -118], [50, -90]].map(([x, y]) => c(tx + x, ty + y, 5, CORAL, 2.5)).join('');
    v += brilho(tx - 4, ty - 140, 18, 8, -20, .4);
    v += (lado < 0 ? c(ix + 50, iy + 50, 22, AMARELO2, 4) + brilho(ix + 44, iy + 44, 7, 4, -30, .6) : '') + l(`M${lado > 0 ? ix + 120 : ix + iw / 2 - 10} ${iy + 40} q 7 -7 14 0 q 7 -7 14 0`, T, 3.5);
    s += recorte(`M${ix} ${iy} H ${ix + iw} V ${iy + ih} H ${ix} Z`, v);
    s += r(ix, iy, iw, ih, 'none', 4, 5);
    // reflexo no vidro
    s += f(`M${ix + 12} ${iy + 70} L ${ix + 70} ${iy + 12} L ${ix + 90} ${iy + 12} L ${ix + 12} ${iy + 90} Z`, '#fff', .35);
    s += f(`M${ix + iw / 2 + 14} ${iy + ih / 2 + 50} L ${ix + iw - 10} ${iy + ih / 2 - 4} L ${ix + iw - 10} ${iy + ih / 2 + 12} L ${ix + iw / 2 + 30} ${iy + ih / 2 + 50} Z`, '#fff', .3);
    // caixilho em cruz
    s += r(cx - 7, iy, 14, ih, '#FFFFFF', 4, 4) + r(ix, iy + ih / 2 - 7, iw, 14, '#FFFFFF', 4, 4);
    // peitoril
    s += r(x0 - 18, y0 + h - 6, w + 36, 22, CREME, 8, 5) + fr(x0 - 12, y0 + h + 8, w + 24, 6, '#EAD9C2', 3) + sombra(cx, y0 + h + 24, w / 2 + 10, 6);
    return s;
  }
  function cortinas(cx, yVara, largJanela, ate) {
    // varão + duas cortinas amarradas com laço
    const xa = cx - largJanela / 2 - 50, xb = cx + largJanela / 2 + 50;
    let s = '';
    const cortina = lado => {
      const xo = lado < 0 ? xa + 6 : xb - 6;          // borda de fora
      const xi = xo - lado * 84;                    // borda de dentro, no alto
      const yLaco = Math.round(yVara + (ate - yVara) * .55), xLaco = xo - lado * 34;
      const d = `M${xo} ${yVara + 4} L ${xi} ${yVara + 4} Q ${xi + lado * 8} ${yVara + 110} ${xLaco - lado * 12} ${yLaco} Q ${xLaco - lado * 26} ${yLaco + 70} ${xi + lado * 6} ${ate} Q ${(xi + xo) / 2} ${ate + 14} ${xo + lado * 2} ${ate - 2} Q ${xo + lado * 8} ${yLaco + 40} ${xo + lado * 2} ${yLaco} Z`;
      let est = fr(Math.min(xo, xi) - 60, yVara, 200, ate - yVara + 30, AMARELO2);
      // listras verticais finas e bolinhas
      for (let x = Math.min(xo, xi) - 60; x < Math.max(xo, xi) + 60; x += 26) est += fr(x, yVara, 8, ate - yVara + 30, '#FFE27A');
      for (let y = yVara + 30, j = 0; y < ate; y += 34, j++) for (let x = Math.min(xo, xi) - 40 + (j % 2) * 13; x < Math.max(xo, xi) + 40; x += 26) est += fe(x, y, 4, 4, '#fff', .9);
      // dobras (sombra de um lado)
      est += f(`M${xo} ${yVara} L ${xo - lado * 22} ${yVara} Q ${xo - lado * 18} ${yLaco} ${xo - lado * 4} ${ate + 10} L ${xo} ${ate + 10} Z`, tom(AMARELO2, -.15), .8);
      est += l(`M${xi + lado * 26} ${yVara + 20} Q ${xLaco - lado * 4} ${yLaco - 60} ${xLaco} ${yLaco - 8}`, tom(AMARELO2, -.2), 4);
      est += l(`M${xLaco} ${yLaco + 14} Q ${xLaco - lado * 16} ${yLaco + 70} ${xi + lado * 30} ${ate - 6}`, tom(AMARELO2, -.2), 4);
      let o = `<path d="${d}" fill="${AMARELO2}"/>` + recorte(d, est) + p(d, 'none', 5);
      // barrado coral
      o += recorte(d, fr(Math.min(xo, xi) - 60, ate - 20, 200, 40, CORAL) + fr(Math.min(xo, xi) - 60, ate - 20, 200, 4, '#fff', 0, .5)) + p(d, 'none', 5);
      // amarração com laço
      o += p(`M${xLaco - 36} ${yLaco - 8} Q ${xLaco} ${yLaco - 2} ${xLaco + 36} ${yLaco - 8} L ${xLaco + 36} ${yLaco + 6} Q ${xLaco} ${yLaco + 12} ${xLaco - 36} ${yLaco + 6} Z`, CORAL, 4);
      o += p(`M${xLaco} ${yLaco} L ${xLaco - 22} ${yLaco - 14} L ${xLaco - 22} ${yLaco + 14} Z`, CORAL, 4) + p(`M${xLaco} ${yLaco} L ${xLaco + 22} ${yLaco - 14} L ${xLaco + 22} ${yLaco + 14} Z`, CORAL, 4);
      o += p(`M${xLaco - 4} ${yLaco + 4} L ${xLaco - 12} ${yLaco + 30} L ${xLaco - 2} ${yLaco + 26} Z M${xLaco + 4} ${yLaco + 4} L ${xLaco + 12} ${yLaco + 32} L ${xLaco + 4} ${yLaco + 27} Z`, CORAL, 3);
      o += c(xLaco, yLaco, 7, tom(CORAL, -.1), 3);
      return o;
    };
    s += cortina(-1) + cortina(1);
    // varão com ponteiras e argolas
    s += r(xa - 14, yVara - 7, xb - xa + 28, 14, MAD2, 7, 5) + fr(xa - 8, yVara - 4, xb - xa + 16, 3, '#fff', 0, .35);
    s += c(xa - 20, yVara, 13, AMARELO2, 5) + c(xb + 20, yVara, 13, AMARELO2, 5) + brilho(xa - 24, yVara - 5, 5, 3, -30, .6) + brilho(xb + 16, yVara - 5, 5, 3, -30, .6);
    for (let i = 0; i < 4; i++) {
      s += e(xa + 14 + i * 22, yVara + 2, 7, 10, 'none', 3) + e(xb - 14 - i * 22, yVara + 2, 7, 10, 'none', 3);
    }
    return s;
  }
  function tomada(x, y) {
    return r(x - 18, y - 22, 36, 44, '#FFFFFF', 8, 4) + c(x, y, 11, '#F3ECF9', 3) + fe(x - 4, y, 2.4, 2.4, T) + fe(x + 4, y, 2.4, 2.4, T) + fe(x, y + 6, 2, 2, T);
  }
  function interruptor(x, y) {
    return r(x - 20, y - 28, 40, 56, '#FFFFFF', 8, 4) + r(x - 8, y - 14, 16, 28, '#F3ECF9', 5, 3) + fr(x - 5, y - 11, 10, 11, '#fff') + l(`M${x - 5} ${y + 1} H ${x + 5}`, '#C9BEDD', 2);
  }
  function estrelinhasDaParede(pts) {
    // estrelinhas adesivas (de brilhar no escuro)
    return pts.map(([x, y, R, rot]) => em(x, y, 1, p(estrelaD(0, 0, R), '#FFF0A8', 3) + brilho(-R * .2, -R * .3, R * .3, R * .16, -30, .6), rot)).join('');
  }

  // =====================================================================================  OBJETOS
  function cama(dormindo = false) {
    // cama de solteiro vista de lado: cabeceira alta à esquerda, pezeira baixa à direita (340 de largura)
    // dormindo: um ursinho dorme no travesseiro, com o cobertor puxado até o queixo
    let s = sombra(0, 0, 182, 11);
    // cabeceira
    const cab = 'M-172 0 V -292 Q -172 -340 -146 -340 Q -120 -340 -120 -292 V 0 Z';
    s += p(cab, MAD, 6) + f('M-134 -300 Q -132 -330 -146 -333 Q -126 -334 -126 -300 V -6 H -134 Z', tom(MAD, -.15));
    s += veio(-166, -290, 34, 280, MAD2, 26);
    s += r(-162, -276, 30, 110, tom(MAD, .18), 15, 3) + p(estrelaD(-147, -222, 11), AMARELO2, 3);
    s += c(-146, -352, 15, MAD2, 5) + brilho(-151, -357, 5, 3, -30, .5) + brilho(-156, -318, 5, 18, 0, .35);
    // pezeira
    const pez = 'M122 0 V -200 Q 122 -232 146 -232 Q 170 -232 170 -200 V 0 Z';
    s += p(pez, MAD, 6) + f('M158 -200 Q 158 -222 146 -226 Q 164 -226 164 -200 V -6 H 158 Z', tom(MAD, -.15));
    s += veio(128, -196, 36, 190, MAD2, 26);
    s += c(146, -244, 13, MAD2, 5) + brilho(141, -248, 4, 3, -30, .5);
    // estrado lateral (a "caixa" da cama)
    s += r(-124, -112, 250, 70, MAD, 12, 6) + fr(-118, -60, 238, 12, tom(MAD, -.15), 6) + fr(-116, -104, 234, 5, '#fff', 3, .3);
    s += veio(-110, -100, 220, 40, MAD2, 20);
    // pezinhos do meio
    s += r(-100, -44, 24, 44, MAD2, 6, 5) + r(78, -44, 24, 44, MAD2, 6, 5);
    // colchão
    s += r(-124, -152, 250, 46, CREME, 16, 5) + costura('M-112 -129 H 114', '#E6D3BA', 3, '6 7');
    // travesseiro (rosa de bolinhas, com babado)
    const trav = 'M-122 -150 Q -128 -196 -96 -196 Q -64 -204 -38 -194 Q -16 -188 -22 -160 Q -24 -146 -40 -146 Q -80 -142 -112 -146 Z';
    let est = `<path d="${trav}" fill="${ROSA}"/>`;
    for (let y = -196, j = 0; y < -140; y += 14, j++) for (let x = -124 + (j % 2) * 9; x < -16; x += 18) est += fe(x, y, 3.6, 3.6, '#fff', .85);
    est += f('M-120 -152 Q -80 -146 -24 -158 L -22 -144 L -120 -140 Z', tom(ROSA, -.15));
    s += recorte(trav, est) + p(trav, 'none', 5) + brilho(-90, -186, 22, 6, -6, .45);
    s += l('M-36 -194 q 6 -6 12 0 M-124 -186 q -6 -6 -2 -12', T, 3);
    // colcha de retalhos (cobre o colchão e cai pelo lado)
    const col = 'M-70 -160 Q -10 -168 60 -160 Q 104 -156 124 -150 Q 132 -146 132 -132 L 134 -70 Q 116 -60 98 -70 Q 80 -60 62 -70 Q 44 -60 26 -70 Q 8 -60 -10 -70 Q -28 -60 -46 -70 Q -64 -60 -76 -70 L -78 -140 Q -78 -158 -70 -160 Z';
    const cores = [CORAL, AMARELO2, AGUA, ROXO, '#FFB0D4', '#8FD3FF'];
    let ret = '';
    for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) {
      const x = -80 + i * 28, y = -170 + j * 28, cor = cores[(i + j * 2) % cores.length];
      ret += fr(x, y, 28, 28, cor);
      if ((i + j) % 3 === 0) ret += fe(x + 14, y + 14, 5, 5, '#fff', .8);
      else if ((i + j) % 3 === 1) ret += f(`M${x + 6} ${y + 22} L ${x + 22} ${y + 6}`, 'none') + l(`M${x + 7} ${y + 21} L ${x + 21} ${y + 7}`, '#fff', 3);
      else ret += p(estrelaD(x + 14, y + 14, 7), '#fff', 0);
    }
    for (let i = 1; i < 8; i++) ret += costura(`M${-80 + i * 28} -170 V -56`, '#fff', 2, '4 4');
    for (let j = 1; j < 4; j++) ret += costura(`M-80 ${-170 + j * 28} H 140`, '#fff', 2, '4 4');
    ret += f('M-80 -100 H 140 V -50 H -80 Z', T, .12);   // a parte que cai fica na sombra
    s += recorte(col, ret) + p(col, 'none', 6);
    // dobra do lençol (barrado branco com listrinha azul) na ponta de cima da colcha
    s += p('M-78 -160 Q -62 -164 -48 -162 Q -42 -140 -48 -118 Q -40 -94 -46 -70 Q -62 -62 -76 -70 Z', '#FFFFFF', 5) + [[-64, -148], [-58, -128], [-66, -108], [-58, -88]].map(([x, y]) => fe(x, y, 3.5, 3.5, '#8FD3FF')).join('') + f('M-56 -160 Q -50 -140 -54 -118 Q -48 -94 -52 -70 L -46 -70 Q -40 -94 -48 -118 Q -42 -140 -48 -162 Z', '#E2DCEF');
    s += brilho(10, -158, 50, 5, -2, .45);
    if (dormindo) {
      // cabecinha de ursinho dormindo (olhos fechados) no travesseiro
      const PEL = '#D9A066', CLARO = '#F3D2A6';
      s += c(-96, -196, 10, PEL, 4) + c(-58, -196, 10, PEL, 4) + fe(-96, -196, 5, 5, '#F2A7B0') + fe(-58, -196, 5, 5, '#F2A7B0');
      s += c(-77, -176, 23, PEL, 5) + e(-77, -168, 11, 8, CLARO, 3) + e(-77, -172, 4.5, 3, T, 0);
      s += l('M-89 -182 q 4.5 4 9 0 M-74 -182 q 4.5 4 9 0', T, 3) + fe(-93, -170, 4.5, 2.6, ROSA, .6) + fe(-61, -170, 4.5, 2.6, ROSA, .6);
      // o cobertor puxado até o queixo: a colcha e a dobra do lençol vêm para a esquerda
      const ext = 'M-108 -158 Q -76 -168 -40 -162 L -40 -70 Q -58 -60 -74 -70 Q -92 -60 -108 -70 Z';
      s += p(ext, CORAL, 5) + [[-92, -142], [-66, -130], [-88, -104], [-60, -96], [-78, -80]].map(([x, y]) => fe(x, y, 5, 5, '#fff', .8)).join('');
      s += l('M-52 -158 V -74', '#fff', 2) + f('M-106 -100 H -42 V -72 Q -58 -62 -74 -72 Q -92 -62 -106 -72 Z', T, .12);
      s += em(-32, 0, 1, p('M-78 -160 Q -62 -164 -48 -162 Q -42 -140 -48 -118 Q -40 -94 -46 -70 Q -62 -62 -76 -70 Z', '#FFFFFF', 5) + [[-64, -148], [-58, -128], [-66, -108], [-58, -88]].map(([x, y]) => fe(x, y, 3.5, 3.5, '#8FD3FF')).join(''));
    }
    return s;
  }

  function ursinho() {
    // ursinho de pelúcia sentado (~105 de altura)
    const PEL = '#D9A066', CLARO = '#F3D2A6';
    let s = sombra(0, 0, 40, 6);
    s += e(-26, -38, 12, 22, PEL, 5) + e(26, -38, 12, 22, PEL, 5);                            // braços (atrás)
    s += e(0, -34, 32, 34, PEL, 5) + fe(0, -26, 18, 20, CLARO) + f('M-30 -26 Q -28 -4 0 -2 Q 26 -4 30 -26 Q 26 -6 0 -6 Q -24 -6 -30 -26 Z', tom(PEL, -.15));
    s += costura('M0 -60 V -8', tom(PEL, -.25), 2, '4 4');
    s += e(-20, -8, 15, 11, PEL, 5) + e(20, -8, 15, 11, PEL, 5) + fe(-22, -8, 8, 6, CLARO) + fe(22, -8, 8, 6, CLARO);   // pezinhos
    s += c(-24, -104, 12, PEL, 5) + c(24, -104, 12, PEL, 5) + fe(-24, -104, 6, 6, '#F2A7B0') + fe(24, -104, 6, 6, '#F2A7B0');
    s += c(0, -82, 28, PEL, 5) + f('M-26 -74 Q -20 -56 0 -55 Q 20 -56 26 -74 Q 20 -60 0 -60 Q -20 -60 -26 -74 Z', tom(PEL, -.15));
    s += e(0, -74, 13, 10, CLARO, 3) + e(0, -79, 5, 3.5, T, 0) + l('M0 -76 V -71 M-5 -69 Q 0 -66 5 -69', T, 2.5);
    s += fe(-11, -88, 3.6, 4.4, T) + fe(11, -88, 3.6, 4.4, T) + fe(-10, -89.5, 1.3, 1.3, '#fff') + fe(12, -89.5, 1.3, 1.3, '#fff');
    s += fe(-18, -76, 5, 3, ROSA, .6) + fe(18, -76, 5, 3, ROSA, .6);
    s += brilho(-10, -100, 10, 5, -20, .45);
    // lacinho no pescoço
    s += p('M0 -54 L -16 -62 L -16 -46 Z', AGUA, 3) + p('M0 -54 L 16 -62 L 16 -46 Z', AGUA, 3) + c(0, -54, 5, tom(AGUA, -.15), 3);
    // remendo
    s += r(10, -30, 12, 12, '#8FD3FF', 3, 2.5) + l('M12 -28 l 8 8 M20 -28 l -8 8', T, 1.6);
    return s;
  }

  function criadoMudo(aberta = false) {
    // criadinho de madeira com duas gavetas verde-água (100 x 150). aberta: a gaveta de cima puxada, com coisinhas dentro
    let s = sombra(0, 0, 58, 8);
    s += l('M-36 -30 L -40 0 M36 -30 L 40 0', MAD2, 10) + l('M-36 -30 L -40 0 M36 -30 L 40 0', T, 0);
    s += p('M-42 -30 L -34 -2 Q -33 2 -29 2 L -27 2 L -28 -30 Z', MAD2, 4) + p('M42 -30 L 34 -2 Q 33 2 29 2 L 27 2 L 28 -30 Z', MAD2, 4);
    s += r(-48, -142, 96, 116, MAD, 10, 6) + f('M30 -136 H 42 V -32 H 30 Z', tom(MAD, -.15));
    s += veio(-42, -136, 70, 100, MAD2, 34);
    // gavetas
    const frente = y => r(-38, y, 76, 42, AGUA, 9, 4) + fr(-32, y + 32, 64, 6, tom(AGUA, -.15), 3) + fr(-31, y + 5, 50, 4, '#fff', 2, .4) +
      c(0, y + 20, 7, AMARELO2, 3.5) + brilho(-2, y + 18, 2.5, 1.6, -30, .7);
    for (const y of [-130, -80]) {
      if (aberta && y === -130) {
        // o vão da gaveta e o que tem dentro: meia, lápis e uma estrelinha
        s += r(-38, y, 76, 42, tom(MAD, -.4), 9, 4) + fr(-32, y + 4, 64, 6, T, 0, .2);
        s += em(-20, y + 22, 1, p('M-6 6 V -14 Q -6 -20 0 -20 Q 6 -20 6 -14 V 0 Q 14 0 14 6 Q 14 12 6 12 H -2 Q -6 12 -6 6 Z', ROSA, 3.5) + fr(-5, -12, 10, 4, '#fff', 1, .8), -14);
        s += em(4, y + 18, 1, r(-4, -18, 8, 30, AZUL, 2, 3) + p('M-4 -18 L 0 -28 L 4 -18 Z', '#F3D2A6', 3), 18);
        s += p(estrelaD(24, y + 8, 11), AMARELO2, 3.5) + brilho(21, y + 4, 3, 2, -30, .6);
        continue;
      }
      s += frente(y);
    }
    // a frente da gaveta aberta vem para perto da gente (maior e mais para baixo, por cima da outra)
    if (aberta) s += `<g class="quarto-gaveta">${r(-44, -106, 88, 46, AGUA, 10, 4.5) + fr(-38, -70, 76, 7, tom(AGUA, -.15), 3) + fr(-36, -101, 58, 4, '#fff', 2, .4) + c(0, -83, 8, AMARELO2, 3.5) + brilho(-2, -85, 2.8, 1.8, -30, .7)}</g>` + fe(0, -58, 40, 4, T, .18);
    // tampo
    s += r(-56, -156, 112, 18, MAD2, 7, 5) + fr(-50, -152, 96, 4, '#fff', 2, .3);
    // paninho de crochê
    s += p('M-34 -156 H 34 L 30 -146 Q 24 -140 18 -146 Q 12 -140 6 -146 Q 0 -140 -6 -146 Q -12 -140 -18 -146 Q -24 -140 -30 -146 Z', '#FFFFFF', 3);
    return s;
  }

  function abajur() {
    // abajur de cúpula amarela (~140 de altura); (0,0) = onde ele pousa
    let s = fe(0, -2, 26, 4, T, .15);
    // luz suave
    s += e(0, -26, 22, 25, AGUA, 5) + f('M8 -46 Q 22 -38 20 -22 Q 16 -6 2 -2 Q 14 -18 8 -46 Z', tom(AGUA, -.15));
    s += l('M-14 -30 Q 0 -22 14 -30', '#fff', 3) + brilho(-10, -36, 5, 9, -10, .5);
    s += r(-9, -54, 18, 8, AMARELO2, 3, 3);
    s += l('M0 -56 V -78', T, 5);
    // cúpula
    const cup = 'M-48 -74 Q -50 -70 -46 -70 L 46 -70 Q 50 -70 48 -74 L 32 -132 Q 30 -136 26 -136 L -26 -136 Q -30 -136 -32 -132 Z';
    let est = `<path d="${cup}" fill="${AMARELO2}"/>` + f('M24 -136 L 34 -136 L 52 -70 L 34 -70 Z', tom(AMARELO2, -.12));
    for (let y = -126, j = 0; y < -74; y += 16, j++) for (let x = -46 + (j % 2) * 10; x < 50; x += 20) est += fe(x, y, 3.5, 3.5, '#fff', .85);
    s += recorte(cup, est) + p(cup, 'none', 5);
    // franjinha
    s += p('M-48 -72 H 48 Q 44 -60 36 -66 Q 28 -58 20 -66 Q 12 -58 4 -66 Q -4 -58 -12 -66 Q -20 -58 -28 -66 Q -36 -58 -44 -66 Z', CORAL, 3.5);
    s += brilho(-18, -118, 7, 14, 20, .45);
    s += c(0, -142, 6, AMARELO2, 3);
    return s;
  }

  function despertador(hora = 0) {
    // despertador de campainhas (~70 de altura). hora (1–12): os ponteiros marcam essa hora em ponto
    let s = fe(0, -1, 24, 3.5, T, .15);
    s += l('M-14 -12 L -22 -2 M14 -12 L 22 -2', T, 5);
    s += p('M-26 -52 Q -26 -70 -10 -70 Z', AMARELO2, 4) + p('M26 -52 Q 26 -70 10 -70 Z', AMARELO2, 4);
    s += l('M-8 -60 Q 0 -66 8 -60', T, 4) + l('M0 -63 V -71', T, 4) + c(0, -72, 3.5, AMARELO2, 2.5);
    s += c(0, -34, 26, CORAL, 5) + f('M14 -54 Q 30 -40 22 -20 Q 12 -8 -4 -8 Q 18 -18 14 -54 Z', tom(CORAL, -.15));
    s += c(0, -34, 18, '#FFFFFF', 3.5);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, rr = i % 3 ? 14 : 12.5; s += l(`M${n(Math.cos(a) * rr)} ${n(-34 + Math.sin(a) * rr)} L ${n(Math.cos(a) * 15.5)} ${n(-34 + Math.sin(a) * 15.5)}`, T, i % 3 ? 1.6 : 2.6); }
    const a = hora * Math.PI / 6;
    s += l(hora ? `M0 -34 V -45 M0 -34 L ${n(Math.sin(a) * 8.5)} ${n(-34 - Math.cos(a) * 8.5)}` : 'M0 -34 V -45 M0 -34 L 8 -30', T, 3) + c(0, -34, 2.2, CORAL, 0);
    s += brilho(-9, -46, 6, 3, -30, .6);
    return s;
  }

  function tapete() {
    // tapete redondo felpudo, achatado no chão (perspectiva)
    let s = '';
    const borda = (rx, ry, k) => {
      let d = '';
      const N = 36;
      for (let i = 0; i <= N; i++) {
        const a = i / N * Math.PI * 2, rr = i % 2 ? 1 : 1 + k;
        d += (i ? ' L ' : 'M') + n(Math.cos(a) * rx * rr) + ' ' + n(-2 + Math.sin(a) * ry * rr);
      }
      return d + ' Z';
    };
    s += fe(0, 6, 160, 22, T, .12);
    s += p(borda(150, 24, .06), ROSA, 5);
    s += f('M-150 -2 Q -140 24 0 26 Q 140 24 150 -2 Q 140 16 0 18 Q -140 16 -150 -2 Z', tom(ROSA, -.15));
    s += e(0, -3, 118, 18, CREME, 0) + costura('M-118 -3 A 118 18 0 1 0 118 -3 A 118 18 0 1 0 -118 -3', tom(ROSA, -.1), 3, '5 6');
    s += e(0, -4, 88, 13.5, AGUA, 0) + e(0, -4, 58, 9, AMARELO2, 0) + e(0, -4, 28, 4.5, CORAL, 0);
    // tufos de pelo
    for (let i = 0; i < 22; i++) {
      const a = i / 22 * Math.PI * 2, x = Math.cos(a) * 104, y = -3 + Math.sin(a) * 16;
      s += l(`M${n(x - 3)} ${n(y + 1)} l 3 -3 l 3 3`, '#fff', 2);
    }
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2, x = Math.cos(a) * 73, y = -4 + Math.sin(a) * 11;
      s += l(`M${n(x - 3)} ${n(y + 1)} l 3 -3 l 3 3`, tom(AGUA, -.2), 2);
    }
    s += brilho(-50, -12, 50, 4, -2, .35);
    return s;
  }

  function bau(dentro = '') {
    // baú de brinquedos aberto (150 de largura). "dentro" = brinquedos (aparecem entre a tampa e a frente)
    let s = sombra(0, 0, 86, 10);
    // tampa aberta, encostada para trás (a gente vê o lado de dentro)
    s += p('M-70 -100 L -78 -186 Q -78 -196 -68 -196 L 68 -196 Q 78 -196 78 -186 L 70 -100 Z', tom(CORAL, -.08), 6);
    s += p('M-58 -110 L -64 -180 L 64 -180 L 58 -110 Z', tom(CORAL, -.3), 0);
    s += l('M-60 -168 H 60', '#fff', 3) + brilho(-40, -176, 18, 4, -4, .3);
    s += r(-78, -200, 156, 16, AMARELO2, 8, 5);
    // fundo escuro de dentro
    s += r(-66, -116, 132, 24, tom(CORAL, -.45), 6, 0);
    s += dentro;
    // caixa
    s += r(-76, -106, 152, 104, CORAL, 14, 6) + f('M50 -100 H 70 Q 70 -8 60 -8 H 50 Z', tom(CORAL, -.15));
    // faixas de madeira e cantoneiras
    s += r(-76, -106, 152, 18, AMARELO2, 9, 5) + r(-76, -22, 152, 18, AMARELO2, 9, 5);
    s += fr(-70, -102, 140, 4, '#fff', 2, .45);
    s += r(-58, -90, 14, 70, MAD, 4, 4) + r(44, -90, 14, 70, MAD, 4, 4);
    // estrela na frente e fechadura
    s += p(estrelaD(0, -56, 24), AMARELO2, 4) + brilho(-6, -64, 6, 3, -30, .6);
    s += c(-90, -60, 0, 'none', 0);
    s += brilho(-40, -80, 14, 5, -10, .35);
    // rodinhas
    s += c(-54, -2, 9, MAD2, 4) + c(54, -2, 9, MAD2, 4);
    return s;
  }

  function bola() {
    // bola de praia de gomos (raio 32)
    const R = 32;
    let s = c(0, -R, R, '#FFFFFF', 5);
    const gomo = (k, cor) => f(`M0 ${-2 * R + 3} Q ${n(k * R * 1.25)} ${-R} 0 -3 Q ${n(k * R * .45)} ${-R} 0 ${-2 * R + 3} Z`, cor);
    s += gomo(-1, CORAL) + gomo(1, AZUL) + f(`M0 ${-2 * R + 3} Q ${R * .2} ${-R} 0 -3 Q ${-R * .2} ${-R} 0 ${-2 * R + 3} Z`, AMARELO2);
    s += f(`M${R - 3} ${-R} Q ${R * .5} ${-R * .2} 0 -3 Q ${R * .8} ${-R * .5} ${R - 3} ${-R} Z`, AGUA, .0);
    s += c(0, -R, R, 'none', 5) + c(0, -2 * R + 6, 5, '#FFFFFF', 3);
    s += f(`M${n(R * .3)} -6 A ${R - 3} ${R - 3} 0 0 0 ${n(R - 3)} ${-R}  Q ${n(R * .7)} ${-R * .35} ${n(R * .3)} -6 Z`, T, .12);
    s += brilho(-12, -48, 9, 5, -30, .6);
    return s;
  }

  function carrinho() {
    // carrinho de brinquedo (~76 de largura)
    let s = sombra(0, 0, 36, 4);
    s += p('M-36 -14 Q -38 -30 -24 -32 L -16 -32 L -8 -48 Q -6 -52 0 -52 L 18 -52 Q 24 -52 26 -46 L 30 -32 L 32 -32 Q 40 -30 38 -14 Z', AZUL, 5);
    s += f('M-34 -20 H 36 Q 36 -14 34 -14 H -34 Z', tom(AZUL, -.15));
    s += p('M-4 -33 L 2 -46 L 10 -46 L 10 -33 Z', '#C9EEFF', 3) + p('M15 -33 L 15 -46 L 19 -46 L 23 -33 Z', '#C9EEFF', 3);
    s += fe(36, -24, 3, 3, AMARELO2) + fr(-36, -26, 5, 5, CORAL, 2);
    s += l('M-28 -26 H 26', '#fff', 2.5) + brilho(-18, -30, 8, 2.5, -4, .5);
    s += c(-20, -12, 10, '#5A4A78', 4) + c(22, -12, 10, '#5A4A78', 4) + c(-20, -12, 4, '#E9E2F2', 0) + c(22, -12, 4, '#E9E2F2', 0);
    return s;
  }

  function piao(fieira = true) {
    // pião de madeira listrado com a fieira enrolada (~62 de altura). fieira = false: sem a cordinha (girando)
    let s = fe(0, -1, 14, 3, T, .15);
    const corpo = 'M-30 -40 Q -30 -54 0 -54 Q 30 -54 30 -40 Q 28 -20 4 -8 L 0 -6 L -4 -8 Q -28 -20 -30 -40 Z';
    let est = `<path d="${corpo}" fill="${MAD}"/>` + fr(-32, -46, 64, 8, CORAL) + fr(-32, -32, 64, 7, AGUA) + fr(-32, -20, 64, 6, AMARELO2);
    est += f('M14 -54 Q 30 -50 28 -36 Q 24 -18 2 -6 Q 18 -24 14 -54 Z', T, .14);
    s += recorte(corpo, est) + p(corpo, 'none', 4);
    s += l('M0 -6 V 0', '#9C93AA', 4);
    s += r(-6, -66, 12, 14, MAD2, 4, 3.5);
    s += brilho(-14, -46, 7, 3, -20, .55);
    // fieira caída do lado
    if (fieira) s += l('M6 -60 Q 30 -70 36 -50 Q 40 -30 26 -18 Q 16 -8 30 -2', '#fff', 6) + l('M6 -60 Q 30 -70 36 -50 Q 40 -30 26 -18 Q 16 -8 30 -2', '#E9D7B8', 3);
    return s;
  }

  function prateleira() {
    // prateleira de parede (300 de largura); (0,0) = meio da tábua, em cima
    let s = '';
    const mao = x => p(`M${x - 8} 16 L ${x + 8} 16 L ${x + 8} 30 Q ${x + 8} 64 ${x - 14} 70 L ${x - 8} 70 Q ${x - 8} 40 ${x - 8} 30 Z`, MAD2, 4);
    s += f('M-140 18 H 140 V 30 H -140 Z', T, .1);
    s += mao(-104) + mao(116);
    s += r(-150, 0, 300, 20, MAD, 6, 5) + fr(-144, 3, 288, 4, '#fff', 2, .3) + fr(-146, 13, 292, 5, tom(MAD, -.15), 2);
    s += veio(-140, 4, 280, 10, MAD2, 12);
    s += c(-104, 50, 3, '#E9E2F2', 2) + c(116, 50, 3, '#E9E2F2', 2);
    return s;
  }

  function livros() {
    // fileira de livros (de pé e um deitado) apoiada num aparador de pinguim... não: num aparador de estrela
    let s = '';
    const livro = (x, w, h, cor, inc = 0) => {
      let o = r(-w / 2, -h, w, h, cor, 4, 4) + fr(w / 2 - 7, -h + 3, 4, h - 6, tom(cor, -.15)) + fr(-w / 2 + 3, -h + 12, w - 6, 5, '#fff', 1, .7) + fr(-w / 2 + 3, -22, w - 6, 4, tom(cor, -.25), 1);
      o += brilho(-w / 2 + 6, -h + 30, 2, 8, 0, .5);
      return em(x, 0, 1, o, inc);
    };
    s += livro(-70, 22, 90, CORAL) + livro(-46, 26, 104, AZUL) + livro(-20, 20, 84, AMARELO2) + livro(2, 24, 98, VERDE) + em(34, 0, 1, livro(0, 22, 92, ROXO), 12);
    // livro deitado com outro em cima
    s += r(52, -24, 80, 22, AGUA, 4, 4) + fr(56, -8, 72, 4, tom(AGUA, -.15)) + fr(60, -20, 66, 3, '#fff', 0, .6);
    s += r(58, -44, 68, 20, ROSA, 4, 4) + fr(62, -30, 60, 4, tom(ROSA, -.15)) + p(estrelaD(110, -34, 6), AMARELO2, 2);
    return s;
  }

  function portaRetrato() {
    // porta-retrato com um desenho da família (Pipoca e mamãe sagui)
    let s = '';
    s += p('M-8 0 L 14 -48 L 20 -48 L 4 0 Z', MAD2, 3);
    s += r(-46, -104, 92, 104, AMARELO2, 10, 5) + fr(-40, -14, 80, 8, tom(AMARELO2, -.15), 4);
    s += r(-34, -92, 68, 74, '#E6F6FF', 4, 3.5);
    s += f('M-34 -36 Q -10 -46 10 -40 Q 24 -36 34 -40 V -18 H -34 Z', '#A8DDB5');
    s += c(22, -78, 8, AMARELO2, 2.5);
    // duas carinhas de sagui (desenho simples, cara branca e tufos)
    const cara = (x, y, k) => em(x, y, k, e(0, 0, 12, 11, '#B78A5E', 2.5) + fe(0, 2, 8, 7, '#FFF4E6') + fe(-4, 0, 1.8, 2.2, T) + fe(4, 0, 1.8, 2.2, T) + fe(-14, -8, 6, 5, '#fff') + fe(14, -8, 6, 5, '#fff') + l('M-14 -8 l 0 0 M14 -8 l 0 0', T, 0));
    s += cara(-12, -52, 1.1) + cara(14, -48, .8);
    s += p('M-2 -66 q -6 -8 0 -10 q 6 2 0 10 Z', CORAL, 2) + p('M-2 -66 q 6 -8 6 -2 q -2 4 -6 2 Z', CORAL, 0);
    s += f('M-34 -92 L -14 -92 L -34 -66 Z', '#fff', .35);
    s += brilho(-36, -96, 6, 3, -30, .5);
    return s;
  }

  function vasinho() {
    // vasinho com uma suculenta (~70 de altura)
    let s = '';
    s += p('M-22 -36 L 22 -36 L 16 -2 Q 15 0 12 0 L -12 0 Q -15 0 -16 -2 Z', CORAL, 4) + r(-26, -42, 52, 12, tom(CORAL, .15), 5, 4);
    s += f('M8 -30 L 18 -30 L 14 -4 L 6 -4 Z', tom(CORAL, -.15));
    s += fe(-8, -18, 3, 3, '#fff', .8) + fe(4, -14, 3, 3, '#fff', .8) + fe(-2, -24, 3, 3, '#fff', .8);
    const folha = (rot, h, cor) => em(0, -40, 1, p(`M0 0 Q ${-h * .35} ${-h * .5} 0 ${-h} Q ${h * .35} ${-h * .5} 0 0 Z`, cor, 3.5) + l(`M0 -4 V ${-h * .7}`, tom(cor, -.2), 2), rot);
    s += folha(-50, 30, VERDE) + folha(50, 30, VERDE) + folha(-22, 36, '#7AD86A') + folha(22, 36, '#7AD86A') + folha(0, 40, VERDE);
    s += c(0, -78, 6, ROSA, 3);
    return s;
  }

  function pipa() {
    // pipa colorida pendurada num prego; (0,0) = o prego
    let s = '';
    const K = [0, 12], B = [0, 200], E = [-74, 70], D = [74, 70];
    const pt = q => q.join(' ');
    let corpo = '';
    corpo += f(`M${pt(K)} L ${pt(E)} L 0 70 Z`, CORAL) + f(`M${pt(K)} L ${pt(D)} L 0 70 Z`, AMARELO2);
    corpo += f(`M${pt(E)} L ${pt(B)} L 0 70 Z`, AGUA) + f(`M${pt(D)} L ${pt(B)} L 0 70 Z`, ROXO);
    corpo += f(`M${pt(D)} L ${pt(B)} L 0 70 Z`, T, .1) + f(`M${pt(E)} L ${pt(B)} L 0 70 Z`, T, .06);
    // olhinho/estrela no meio
    corpo += p(estrelaD(0, 70, 16), '#FFFFFF', 3);
    corpo += f(`M${pt(K)} L -20 ${K[1] + 27} L -8 ${K[1] + 30} Z`, '#fff', .45);
    let o = corpo + p(`M${pt(K)} L ${pt(E)} L ${pt(B)} L ${pt(D)} Z`, 'none', 5);
    o += l(`M${pt(K)} L ${pt(B)} M${pt(E)} Q 0 60 ${pt(D)}`, MAD3, 3.5);
    // rabiola com lacinhos
    const rab = `M${pt(B)} Q -30 236 4 268 Q 38 300 8 334`;
    o += l(rab, T, 3);
    const laco = (x, y, cor, rot) => em(x, y, 1, p('M0 0 L -16 -9 L -16 9 Z', cor, 3) + p('M0 0 L 16 -9 L 16 9 Z', cor, 3) + c(0, 0, 3.5, tom(cor, -.15), 2), rot);
    o += laco(-15, 234, AZUL, 20) + laco(24, 290, ROSA, -10) + laco(8, 334, VERDE, 10);
    // linha enrolada no prego
    o += l('M0 12 L 0 2', T, 3);
    s += em(0, 0, 1, o, 8);
    s += c(0, 0, 5, '#C9BEDD', 3);
    return s;
  }

  function mobile() {
    // móbile de lua e estrelas; (0,0) = o gancho no teto
    let s = '';
    s += l('M0 0 V 52', T, 3) + c(0, -2, 5, '#C9BEDD', 3);
    s += p('M-82 64 Q 0 40 82 64', 'none', 0) + l('M-82 64 Q 0 40 82 64', MAD2, 7) + c(-82, 64, 6, AMARELO2, 3) + c(82, 64, 6, AMARELO2, 3) + c(0, 52, 6, CORAL, 3);
    const fio = (x, y0, y1) => l(`M${x} ${y0} V ${y1}`, T, 2.5);
    s += fio(-76, 64, 120) + fio(76, 64, 112) + fio(0, 52, 150) + fio(-38, 56, 92) + fio(38, 56, 96);
    const estrela = (x, y, R, cor, rot) => em(x, y, 1, p(estrelaD(0, 0, R), cor, 4) + brilho(-R * .25, -R * .3, R * .3, R * .15, -30, .6) + fe(-R * .2, R * .05, 1.8, 2.2, T) + fe(R * .2, R * .05, 1.8, 2.2, T), rot);
    s += estrela(-76, 140, 22, AMARELO2, -8) + estrela(76, 132, 22, AMARELO2, 10) + estrela(-38, 106, 14, ROSA, 6) + estrela(38, 110, 14, AGUA, -6);
    // lua sorridente no meio
    s += em(0, 182, 1, p('M8 -34 Q -30 -30 -30 0 Q -28 32 10 34 Q -10 22 -10 0 Q -10 -22 8 -34 Z', '#FFE27A', 4) + fe(-18, -2, 2.2, 2.6, T) + l('M-24 10 q 5 4 10 0', T, 2.5) + fe(-22, 4, 3, 2, ROSA, .7) + brilho(-18, -18, 4, 7, 20, .55));
    return s;
  }

  function bandeirinhas(w, cores = [CORAL, AMARELO2, AGUA, ROXO, VERDE, ROSA, AZUL], classe = '') {
    // varal de bandeirinhas de festa junina, de 0 até w (duas barrigas). classe: animação de cada bandeirinha (balançar)
    let s = '';
    const meio = w / 2, barriga = 40;
    const yFio = x => { const t = (x % meio) / meio; return 4 * barriga * t * (1 - t); };
    s += l(`M0 0 Q ${meio / 2} ${barriga * 2} ${meio} 0 Q ${meio * 1.5} ${barriga * 2} ${w} 0`, T, 3);
    let k = 0;
    for (let x = 26; x < w - 16; x += 46) {
      if (Math.abs(x - meio) < 14) continue;
      const y = yFio(x), t = (x % meio) / meio, inc = (1 - 2 * t) * -14, cor = cores[k++ % cores.length];
      const b = p('M-17 0 L 17 0 L 17 42 L 0 32 L -17 42 Z', cor, 3.5) + f('M8 2 L 15 2 L 15 38 L 8 34 Z', tom(cor, -.15)) + fr(-14, 3, 22, 3, '#fff', 1, .5);
      s += em(x, y, 1, classe ? `<g class="${classe}" style="animation-delay:${(k % 4) * .09}s">${b}</g>` : b, inc);
    }
    s += c(0, 0, 5, '#C9BEDD', 3) + c(w, 0, 5, '#C9BEDD', 3) + c(meio, 0, 5, '#C9BEDD', 3);
    return s;
  }

  function pantufas(so = 0) {
    // par de pantufas de coelhinho (~90 de largura). so: -1 só a da esquerda, 1 só a da direita (as duas sem sombra)
    let s = so ? '' : sombra(0, 0, 50, 6);
    const uma = (x, k) => {
      let o = e(x, -14, 26, 14, ROSA, 4) + f(`M${x - 24} -10 Q ${x} 4 ${x + 24} -10 Q ${x + 20} 0 ${x} 0 Q ${x - 20} 0 ${x - 24} -10 Z`, tom(ROSA, -.15));
      o += e(x + k * 8, -18, 13, 7, '#FFFFFF', 3);
      o += em(x + k * 14, -24, 1, p('M-4 0 Q -10 -26 -2 -30 Q 6 -26 4 0 Z', '#FFFFFF', 3) + f('M-2 -4 Q -6 -20 -2 -24 Q 2 -20 1 -4 Z', ROSA), k * 20);
      o += fe(x + k * 22, -16, 2, 2.4, T) + fe(x + k * 25, -12, 2.6, 2, CORAL);
      o += brilho(x - k * 8, -22, 8, 3, -10, .5);
      return o;
    };
    s += (so !== 1 ? uma(-22, 1) : '') + (so !== -1 ? uma(26, 1) : '');
    return s;
  }

  function guardaRoupa(aberto = false) {
    // guarda-roupa de duas portas com coroa arredondada (230 x 420). aberto: portas abertas e as roupinhas penduradas
    let s = sombra(0, 0, 126, 12);
    s += p('M-104 -40 L -98 0 L -84 0 L -86 -40 Z M104 -40 L 98 0 L 84 0 L 86 -40 Z', MAD3, 5);
    // coroa
    s += p('M-118 -384 Q -118 -404 -98 -404 L -40 -404 Q 0 -440 40 -404 L 98 -404 Q 118 -404 118 -384 L 118 -370 L -118 -370 Z', MAD2, 6);
    s += p(estrelaD(0, -406, 13), AMARELO2, 3.5) + fr(-110, -398, 90, 4, '#fff', 2, .3);
    // corpo
    s += r(-110, -376, 220, 340, MAD, 14, 6) + f('M84 -370 H 104 V -44 H 84 Z', tom(MAD, -.15));
    s += veio(-104, -370, 200, 330, MAD2, 40);
    // portas
    const porta = (x0, k) => {
      let o = r(x0, -362, 92, 250, '#FFE7C7', 10, 5) + fr(x0 + 6, -356, 80, 6, '#fff', 3, .6) + fr(x0 + 70, -350, 12, 228, tom('#FFE7C7', -.1), 4);
      o += r(x0 + 14, -346, 64, 100, '#FFF4E6', 8, 3.5) + r(x0 + 14, -232, 64, 102, '#FFF4E6', 8, 3.5);
      o += c(x0 + 46, -296, 16, k ? ROSA : AGUA, 3.5) + p(estrelaD(x0 + 46, -182, 14), k ? AGUA : ROSA, 3.5);
      o += r(x0 + (k ? 8 : 74), -250, 10, 34, AMARELO2, 5, 3.5);
      return o;
    };
    if (!aberto) s += porta(-98, 0) + porta(6, 1);
    else {
      // o lado de dentro: cabideiro com camiseta, vestido e casaco; prateleira com roupas dobradas e sapatinhos
      s += r(-98, -362, 196, 250, tom(MAD, -.32), 10, 5) + fr(-92, -356, 184, 10, T, 4, .18);
      s += r(-94, -342, 188, 9, '#E9E2F2', 4.5, 3.5);
      const cabide = x => l(`M${x} -338 V -344 q 0 -7 6 -7`, T, 3) + l(`M${x - 22} -318 L ${x} -334 L ${x + 22} -318`, '#E9E2F2', 4) + l(`M${x - 22} -318 L ${x} -334 L ${x + 22} -318`, T, 1.5);
      const X1 = -58, X2 = -2, X3 = 54;
      s += cabide(X1) + p(`M${X1 - 14} -324 L ${X1 - 32} -312 L ${X1 - 25} -296 L ${X1 - 16} -301 V -258 H ${X1 + 16} V -301 L ${X1 + 25} -296 L ${X1 + 32} -312 L ${X1 + 14} -324 Q ${X1} -314 ${X1 - 14} -324 Z`, CORAL, 4);
      s += p(estrelaD(X1, -282, 9), '#fff', 0) + fr(X1 - 15, -268, 30, 4, tom(CORAL, -.15));
      s += cabide(X2) + p(`M${X2 - 11} -324 Q ${X2} -316 ${X2 + 11} -324 L ${X2 + 14} -292 L ${X2 + 30} -232 Q ${X2} -222 ${X2 - 30} -232 L ${X2 - 14} -292 Z`, ROSA, 4);
      s += [[-8, -306], [6, -298], [-12, -268], [10, -258], [-2, -244], [18, -240], [-20, -240]].map(([x, y]) => fe(X2 + x, y, 3.2, 3.2, '#fff', .9)).join('') + l(`M${X2 - 14} -292 Q ${X2} -286 ${X2 + 14} -292`, tom(ROSA, -.2), 3);
      s += cabide(X3) + p(`M${X3 - 15} -324 L ${X3 - 28} -312 V -226 H ${X3 + 28} V -312 L ${X3 + 15} -324 Q ${X3} -314 ${X3 - 15} -324 Z`, AZUL, 4);
      s += l(`M${X3} -318 V -226`, T, 2.5) + [-300, -278, -256].map(y => fe(X3 + 7, y, 3, 3, AMARELO2)).join('') + r(X3 - 22, -262, 14, 12, tom(AZUL, -.15), 3, 2.5);
      s += r(-98, -212, 196, 12, MAD2, 4, 4);
      // pilhas de roupa dobrada e um par de sapatinhos
      [[-70, ROXO], [-70, VERDE], [-70, AMARELO2]].forEach(([x, cor], k) => { s += r(x - 20, -130 - k * 18, 52, 18, cor, 6, 3.5) + l(`M${x - 12} ${-121 - k * 18} H ${x + 22}`, tom(cor, -.2), 2); });
      [[6, AGUA], [6, CORAL]].forEach(([x, cor], k) => { s += r(x - 22, -130 - k * 18, 56, 18, cor, 6, 3.5) + l(`M${x - 14} ${-121 - k * 18} H ${x + 24}`, tom(cor, -.2), 2); });
      s += e(64, -122, 18, 9, CORAL, 3.5) + e(82, -118, 14, 8, CORAL, 3.5) + fe(60, -126, 6, 2.5, '#fff', .5);
      // as portas abertas, de lado (dobradiças nas beiradas)
      const aberta = (k) => {
        const xi = k * 98, xo = k * 164, cor = '#FFE7C7';
        let o = p(`M${xi} -362 L ${xo} -378 Q ${xo + k * 2} -378 ${xo + k * 2} -372 L ${xo + k * 2} -100 Q ${xo + k * 2} -94 ${xo} -94 L ${xi} -112 Z`, cor, 5);
        o += p(`M${xi + k * 12} -346 L ${xo - k * 12} -358 L ${xo - k * 12} -250 L ${xi + k * 12} -244 Z`, '#FFF4E6', 3.5) + p(`M${xi + k * 12} -230 L ${xo - k * 12} -234 L ${xo - k * 12} -122 L ${xi + k * 12} -128 Z`, '#FFF4E6', 3.5);
        o += r(xo - k * 22 - 5, -258, 10, 30, AMARELO2, 5, 3.5);
        return `<g class="quarto-porta-${k < 0 ? 'e' : 'd'}">${o}</g>`;
      };
      s += aberta(-1) + aberta(1);
    }
    // gaveta de baixo
    s += r(-98, -102, 196, 54, AMARELO2, 10, 5) + fr(-92, -60, 184, 8, tom(AMARELO2, -.15), 4) + fr(-90, -96, 150, 4, '#fff', 2, .5);
    s += r(-24, -82, 48, 12, MAD2, 6, 3.5);
    s += brilho(-80, -340, 6, 30, 0, .3);
    return s;
  }

  function comoda(aberta = 0) {
    // cômoda de três gavetas coloridas (200 x 170). aberta (1–3): essa gaveta puxada, mostrando o que tem dentro
    let s = sombra(0, 0, 110, 10);
    s += p('M-86 -24 L -82 0 L -70 0 L -70 -24 Z M86 -24 L 82 0 L 70 0 L 70 -24 Z', MAD3, 5);
    s += r(-96, -160, 192, 140, MAD, 12, 6) + f('M74 -154 H 90 V -26 H 74 Z', tom(MAD, -.15));
    const cores = [CORAL, AMARELO2, AGUA];
    let frente = '';
    for (let i = 0; i < 3; i++) {
      const y = -150 + i * 42, cor = cores[i];
      if (aberta === i + 1) {
        s += r(-84, y, 168, 36, tom(MAD, -.4), 8, 4.5) + fr(-78, y + 4, 156, 6, T, 0, .2) + dentroDaGaveta(i, y);
        frente = `<g class="quarto-gaveta">${r(-92, y + 18, 184, 40, cor, 9, 4.5) + fr(-85, y + 49, 170, 6, tom(cor, -.15), 3) + fr(-83, y + 23, 122, 4, '#fff', 2, .45) +
          c(-44, y + 38, 7.2, '#FFF4E6', 3.5) + c(44, y + 38, 7.2, '#FFF4E6', 3.5)}</g>` + fe(0, y + 62, 84, 4, T, .16);
        continue;
      }
      s += r(-84, y, 168, 36, cor, 8, 4.5) + fr(-78, y + 28, 156, 5, tom(cor, -.15), 3) + fr(-76, y + 5, 110, 4, '#fff', 2, .45);
      s += c(-40, y + 18, 6.5, '#FFF4E6', 3.5) + c(40, y + 18, 6.5, '#FFF4E6', 3.5);
    }
    s += frente;
    s += r(-104, -174, 208, 18, MAD2, 8, 5) + fr(-98, -170, 180, 4, '#fff', 2, .3);
    return s;
  }
  /** o que aparece na gaveta aberta da cômoda: 0 camisetas dobradas, 1 meias, 2 brinquedinhos */
  function dentroDaGaveta(i, y) {
    if (i === 0) {
      const cam = (x, cor, rot) => em(x, y + 14, 1, p('M-26 -12 L -10 -16 Q 0 -10 10 -16 L 26 -12 L 26 12 L -26 12 Z', cor, 3.5) + l('M-10 -16 Q 0 -4 10 -16', tom(cor, -.25), 2.5) + fr(-22, 4, 44, 4, tom(cor, -.15), 2), rot);
      return cam(-46, AMARELO2, -4) + cam(4, AZUL, 3) + cam(52, VERDE, -2);
    }
    if (i === 1) {
      const meia = (x, cor, rot) => em(x, y + 20, 1, p('M-7 8 V -18 Q -7 -24 0 -24 Q 7 -24 7 -18 V 2 Q 18 2 18 10 Q 18 18 8 18 H -1 Q -7 18 -7 8 Z', cor, 3.5) + fr(-6, -16, 12, 5, '#fff', 1, .85) + fe(0, 0, 2.6, 2.6, '#fff', .8), rot);
      return meia(-52, ROSA, -10) + meia(-28, ROSA, 6) + meia(20, AGUA, -6) + meia(44, AGUA, 12) + em(70, y + 14, 1, c(0, 0, 12, ROXO, 3.5) + l('M-8 -6 Q 0 0 8 -6 M-9 3 Q 0 9 9 3', tom(ROXO, -.25), 2));
    }
    return em(-46, y + 30, .5, bola()) + em(0, y + 26, .6, carrinho(), -8) + p(estrelaD(48, y + 10, 13), AMARELO2, 3.5) + brilho(44, y + 6, 3, 2, -30, .6);
  }

  function quadro(tipo = 0) {
    // quadro pendurado num prego; (0,0) = o prego. tipo 0: casinha e sol; 1: foguete; 2: arco-íris
    const molduras = [MAD, AGUA, CORAL], W = tipo === 1 ? 120 : 150, H = tipo === 1 ? 160 : 120, y0 = 30;
    let s = l(`M0 0 L ${-W / 2 + 22} ${y0 + 4} M0 0 L ${W / 2 - 22} ${y0 + 4}`, T, 3);
    s += r(-W / 2, y0, W, H, molduras[tipo], 12, 5) + fr(-W / 2 + 6, y0 + H - 14, W - 12, 8, tom(molduras[tipo], -.15), 4);
    const ix = -W / 2 + 16, iy = y0 + 16, iw = W - 32, ih = H - 32;
    let v = '';
    if (tipo === 0) {
      v += fr(ix, iy, iw, ih, '#DFF3FF') + f(`M${ix - 4} ${iy + ih - 24} Q ${ix + 40} ${iy + ih - 50} ${ix + iw + 4} ${iy + ih - 28} V ${iy + ih + 4} H ${ix - 4} Z`, '#8EDB7A');
      v += c(ix + iw - 22, iy + 20, 12, AMARELO2, 3) + p(`M${ix + 22} ${iy + ih - 30} V ${iy + ih - 58} L ${ix + 42} ${iy + ih - 76} L ${ix + 62} ${iy + ih - 58} V ${iy + ih - 30} Z`, CORAL, 3);
      v += r(ix + 36, iy + ih - 48, 12, 18, AMARELO2, 2, 2.5) + l(`M${ix + 84} ${iy + ih - 30} V ${iy + ih - 46}`, MAD3, 3) + c(ix + 84, iy + ih - 52, 9, VERDE, 2.5);
    } else if (tipo === 1) {
      v += fr(ix, iy, iw, ih, '#3E3270');
      [[12, 16], [70, 26], [20, 90], [74, 110], [44, 12], [8, 60]].forEach(([x, y]) => { v += p(estrelaD(ix + x, iy + y, 5), '#FFE27A', 0); });
      const fx = ix + iw / 2, fy = iy + ih / 2 + 6;
      v += p(`M${fx - 10} ${fy + 26} Q ${fx} ${fy + 54} ${fx + 10} ${fy + 26} Z`, AMARELO2, 2.5);
      v += p(`M${fx - 16} ${fy + 4} L ${fx - 26} ${fy + 28} L ${fx - 12} ${fy + 24} Z M${fx + 16} ${fy + 4} L ${fx + 26} ${fy + 28} L ${fx + 12} ${fy + 24} Z`, CORAL, 3);
      v += p(`M${fx} ${fy - 46} Q ${fx + 20} ${fy - 24} ${fx + 16} ${fy + 26} L ${fx - 16} ${fy + 26} Q ${fx - 20} ${fy - 24} ${fx} ${fy - 46} Z`, '#FFFFFF', 3.5);
      v += c(fx, fy - 8, 8, '#8FD3FF', 3) + f(`M${fx - 10} ${fy - 32} Q ${fx} ${fy - 50} ${fx + 10} ${fy - 32} Z`, CORAL);
    } else {
      v += fr(ix, iy, iw, ih, '#FFFFFF');
      [CORAL, AMARELO2, VERDE, AZUL, ROXO].forEach((cor, i) => { const R = 50 - i * 8; v += l(`M${-R} ${iy + ih - 10} A ${R} ${R} 0 0 1 ${R} ${iy + ih - 10}`, cor, 8); });
      v += p(`M-66 ${iy + ih} q -6 -20 12 -18 q 8 -12 22 0 q 12 2 6 18 Z M66 ${iy + ih} q 6 -20 -12 -18 q -8 -12 -22 0 q -12 2 -6 18 Z`, '#FFFFFF', 3);
    }
    s += recorte(`M${ix} ${iy} H ${ix + iw} V ${iy + ih} H ${ix} Z`, v) + r(ix, iy, iw, ih, 'none', 3, 3.5);
    s += f(`M${ix} ${iy + 30} L ${ix + 30} ${iy} L ${ix + 44} ${iy} L ${ix} ${iy + 44} Z`, '#fff', .3);
    s += brilho(-W / 2 + 14, y0 + 10, 12, 3, -10, .5);
    s += c(0, 0, 5, '#C9BEDD', 3);
    return s;
  }

  function luzinhas(w, barrigas = 3) {
    // varal de luzinhas (lâmpadas de bolinha coloridas), de 0 até w
    const cores = [AMARELO2, CORAL, AGUA, ROSA, ROXO, VERDE, AZUL], seg = w / barrigas, fundo = 46;
    let d = 'M0 0';
    for (let i = 0; i < barrigas; i++) d += ` Q ${n(seg * i + seg / 2)} ${fundo * 2} ${n(seg * (i + 1))} 0`;
    let s = l(d, '#5A4A78', 3.5);
    let k = 0;
    for (let x = 30; x < w - 20; x += 54) {
      const t = (x % seg) / seg; if (t < .08 || t > .92) continue;
      const y = 4 * fundo * t * (1 - t), cor = cores[k++ % cores.length], inc = (1 - 2 * t) * -18;
      s += em(x, y, 1, fe(0, 26, 22, 22, cor, .22) + r(-5, 0, 10, 10, '#7C6E96', 3, 3) + p('M-9 10 Q -12 28 0 34 Q 12 28 9 10 Z', cor, 3.5) + brilho(-3, 18, 2.5, 6, 0, .7), inc);
    }
    for (let i = 0; i <= barrigas; i++) s += c(seg * i, 0, 5, '#C9BEDD', 3);
    return s;
  }

  // =====================================================================================  REGISTRO
  const catalogo = { cama, ursinho, criadoMudo, abajur, despertador, tapete, bau, bola, carrinho, piao, prateleira, livros, portaRetrato, vasinho, pipa, mobile, bandeirinhas, luzinhas, pantufas, guardaRoupa, comoda, quadro };
  // ?catalogo na URL do ver.html: espalha no chão os objetos do catálogo que não ficam montados (só para conferir os desenhos)
  const verCatalogo = typeof location !== 'undefined' && /[?&]catalogo\b/.test(location.search);

  // =====================================================================================  AÇÕES (modo brincar)
  // O formato e o ctx estão no topo de js/casa/acoes.js. As animações de uma vez só (bola quicando, carrinho andando...)
  // usam o truque do "voo": por um instante o desenho parado fica invisível (mesma caixa, então nada sai do lugar) e
  // o "sobre" mostra a mesma coisa se mexendo; no fim tudo volta ao normal. As animações próprias do quarto ficam nesta
  // folha de estilo (classes quarto-*), posta uma vez só na página.
  const CSS = `
.quarto-quica{transform-box:fill-box;transform-origin:50% 100%;animation:quartoQuica 1.4s both}
@keyframes quartoQuica{0%{transform:scale(1.18,.82);animation-timing-function:ease-out}18%{transform:translateY(-150px) scale(.94,1.06);animation-timing-function:ease-in}
36%{transform:scale(1.2,.8);animation-timing-function:ease-out}52%{transform:translateY(-70px);animation-timing-function:ease-in}
68%{transform:scale(1.12,.88);animation-timing-function:ease-out}80%{transform:translateY(-24px);animation-timing-function:ease-in}92%{transform:scale(1.05,.95)}100%{transform:none}}
.quarto-anda{animation:quartoAnda 2.2s ease-in-out both}
@keyframes quartoAnda{0%{transform:none}42%{transform:translateX(150px)}56%{transform:translateX(150px)}100%{transform:none}}
.quarto-bamboleia{transform-box:fill-box;transform-origin:50% 100%;animation:quartoBamboleia .36s ease-in-out infinite alternate}
@keyframes quartoBamboleia{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
.quarto-listra{animation:quartoListra .22s linear infinite}
@keyframes quartoListra{from{transform:translateX(-22px)}to{transform:translateX(22px)}}
.quarto-pula{transform-box:fill-box;transform-origin:50% 100%;animation:quartoPula .8s ease-in-out 2 both}
.quarto-depois{animation-delay:.3s}
@keyframes quartoPula{0%{transform:none}30%{transform:translateY(-54px) rotate(-12deg)}55%{transform:scale(1.12,.88)}72%,100%{transform:none}}
.quarto-ginga{transform-box:fill-box;transform-origin:50% 100%;animation:quartoGinga 1.4s ease-in-out both}
@keyframes quartoGinga{0%,100%{transform:none}18%{transform:rotate(10deg)}38%{transform:rotate(-8deg)}58%{transform:rotate(5deg)}78%{transform:rotate(-2deg)}}
.quarto-roda{transform-box:fill-box;transform-origin:50% 50%;animation:quartoRoda 7s ease-in-out infinite}
@keyframes quartoRoda{50%{transform:scaleX(-1)}}
.quarto-tremula{transform-box:fill-box;transform-origin:50% 0;animation:quartoTremula 1.7s ease-in-out both}
@keyframes quartoTremula{0%,100%{transform:none}15%{transform:rotate(16deg)}35%{transform:rotate(-12deg)}55%{transform:rotate(7deg)}75%{transform:rotate(-3deg)}}
.quarto-sai1,.quarto-sai2,.quarto-sai3{transform-box:fill-box;transform-origin:50% 100%;animation:quartoSai1 1.4s both}
.quarto-sai2{animation-name:quartoSai2;animation-delay:.14s}.quarto-sai3{animation-name:quartoSai3;animation-delay:.28s}
@keyframes quartoSai1{0%{transform:translateY(16px) scale(.4);opacity:0;animation-timing-function:ease-out}14%{opacity:1}
45%{transform:translate(-80px,-150px) rotate(-30deg);animation-timing-function:ease-in}82%{transform:translate(-14px,0) scale(.8);opacity:1}100%{transform:translateY(16px) scale(.4);opacity:0}}
@keyframes quartoSai2{0%{transform:translateY(16px) scale(.4);opacity:0;animation-timing-function:ease-out}14%{opacity:1}
45%{transform:translate(6px,-190px) rotate(200deg);animation-timing-function:ease-in}82%{transform:translate(0,0) scale(.8) rotate(360deg);opacity:1}100%{transform:translateY(16px) scale(.4) rotate(360deg);opacity:0}}
@keyframes quartoSai3{0%{transform:translateY(16px) scale(.4);opacity:0;animation-timing-function:ease-out}14%{opacity:1}
45%{transform:translate(84px,-140px) rotate(30deg);animation-timing-function:ease-in}82%{transform:translate(14px,0) scale(.8);opacity:1}100%{transform:translateY(16px) scale(.4);opacity:0}}
.quarto-surge{transform-box:fill-box;transform-origin:50% 100%;animation:quartoSurge 1.7s both}
@keyframes quartoSurge{0%{transform:scale(.3);opacity:0}14%{transform:scale(1.08);opacity:1}22%,86%{transform:none;opacity:1}100%{transform:scale(.6);opacity:0}}
.quarto-folha{transform-box:fill-box;transform-origin:0 50%;animation:quartoFolha .6s ease-in-out .35s both}
@keyframes quartoFolha{from{transform:none}to{transform:scaleX(-1)}}
.quarto-onda{transform-box:fill-box;transform-origin:50% 50%;animation:quartoOnda .9s ease-out both}
@keyframes quartoOnda{from{transform:scale(.5);opacity:1}to{transform:scale(1.25);opacity:0}}
.quarto-gaveta{animation:quartoGaveta .22s ease-out}
@keyframes quartoGaveta{from{transform:translateY(-18px)}}
.quarto-porta-e,.quarto-porta-d{transform-box:fill-box;transform-origin:100% 50%;animation:quartoPorta .28s ease-out}
.quarto-porta-d{transform-origin:0 50%}
@keyframes quartoPorta{from{transform:scaleX(.2)}}
`;
  if (typeof document !== 'undefined' && document.head && !document.querySelector('style[data-quarto]')) {
    const st = document.createElement('style');
    st.setAttribute('data-quarto', '');
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const D = id => CASA.desenho(id);
  const memo = {};
  /** desenho guardado (cada estado é desenhado uma vez só; o motor também guarda a caixa pelo texto) */
  const uma = (chave, fn) => (memo[chave] != null ? memo[chave] : (memo[chave] = fn()));
  const invisivel = id => uma('oculto-' + id, () => `<g opacity="0">${D(id)}</g>`);
  const voando = e => !!(e && e.voo > Date.now());
  /** o "voo": esconde o desenho parado por ms e mostra o sobre (que se mexe); depois volta ao normal */
  function voo(ctx, ms) {
    const e = ctx.estado, fim = Date.now() + ms;
    e.voo = fim;
    ctx.mudou();
    ctx.depois(ms, () => { if (e.voo === fim) { delete e.voo; ctx.mudou(); } });
  }
  /** ação de "voo" para um item: o desenho some e o sobre(e) aparece enquanto dura */
  const comVoo = (id, sobre, ms, tocar) => ({
    desenho: e => (voando(e) ? invisivel(id) : D(id)),
    sobre: e => (voando(e) ? sobre(e) : ''),
    tocar(ctx) { voo(ctx, ms); tocar(ctx); },
  });
  const HORAS = ['', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze'];
  const zzz = [[-60, -212, 0, 40], [-36, -236, .7, 32], [-64, -250, 1.4, 26]].map(([x, y, d, fs]) =>
    `<text class="casa-sobe" style="animation-delay:${d}s" x="${x}" y="${y}" font-family="Fredoka, sans-serif" font-weight="700" font-size="${fs}" fill="#fff" stroke="${T}" stroke-width="4" paint-order="stroke">z</text>`).join('');

  const acoes = {
    // ---------------------------------------------------------------- cama: um ursinho deita e dorme (z z z); de novo: bom dia
    cama: {
      desenho: e => (e && e.dorme ? uma('cama-dorme', () => cama(true)) : D('cama')),
      sobre: e => (e && e.dorme ? zzz : ''),
      tocar(ctx) {
        const e = ctx.estado;
        e.dorme = !e.dorme;
        ctx.mudou();
        if (e.dorme) { ctx.som('soltar'); ctx.particulas('z', -60, -210, 2, { dy: -80, espalha: 30, seguidas: 220 }); }
        else { ctx.som('pulo'); ctx.pular(); ctx.particulas('estrela', -76, -200, 4, { dy: -100 }); }
      },
    },
    // ---------------------------------------------------------------- criado-mudo: a gaveta abre (meia, lápis, estrela) e fecha
    criadoMudo: {
      desenho: e => (e && e.aberta ? uma('criadoMudo-aberta', () => criadoMudo(true)) : D('criadoMudo')),
      tocar(ctx) {
        const e = ctx.estado;
        e.aberta = !e.aberta;
        ctx.som(e.aberta ? 'pegar' : 'encaixar');
        ctx.mudou();
        if (e.aberta) ctx.particulas('estrela', 20, -130, 2, { dy: -70, espalha: 40 });
      },
    },
    // ---------------------------------------------------------------- cômoda: cada toque abre a próxima gaveta; depois fecha tudo
    comoda: {
      desenho: e => (e && e.gaveta ? uma('comoda-' + e.gaveta, () => comoda(e.gaveta)) : D('comoda')),
      tocar(ctx) {
        const e = ctx.estado;
        e.gaveta = ((e.gaveta || 0) + 1) % 4;
        ctx.som(e.gaveta ? 'pegar' : 'encaixar');
        ctx.mudou();
        if (e.gaveta) ctx.particulas('estrela', 0, -150 + (e.gaveta - 1) * 42, 2, { dy: -70, espalha: 60 });
      },
    },
    // ---------------------------------------------------------------- guarda-roupa: as portas abrem (roupinhas penduradas) e fecham
    guardaRoupa: {
      desenho: e => (e && e.aberta ? uma('guardaRoupa-aberto', () => guardaRoupa(true)) : D('guardaRoupa')),
      tocar(ctx) {
        const e = ctx.estado;
        e.aberta = !e.aberta;
        ctx.som(e.aberta ? 'pegar' : 'encaixar');
        ctx.mudou();
        if (e.aberta) ctx.particulas('estrela', 0, -300, 3, { dy: -90, espalha: 70 });
      },
    },
    // ---------------------------------------------------------------- tapete: sacode, fofinho
    tapeteQuarto: {
      tocar(ctx) {
        ctx.som('bolha'); ctx.pular();
        const onda = d => `<g class="quarto-onda" style="animation-delay:${d}s"><ellipse cx="0" cy="-4" rx="150" ry="24" fill="none" stroke="#FFE27A" stroke-width="9"/></g>`;
        ctx.mostrar(onda(0) + onda(.25), 1300);
        ctx.particulas('estrela', 0, -20, 3, { dy: -90, espalha: 90 });
      },
    },
    // ---------------------------------------------------------------- despertador: toca (treme, trim-trim) e os ponteiros andam uma hora
    despertador: {
      desenho: e => (e && e.hora ? uma('despertador-' + e.hora, () => despertador(e.hora)) : D('despertador')),
      tocar(ctx) {
        const e = ctx.estado;
        e.hora = ((e.hora || 4) % 12) + 1;
        ctx.mudou();
        const trim = () => { ctx.som('moeda'); ctx.tremer(); };
        trim(); ctx.depois(500, trim); ctx.depois(1000, trim);
        ctx.mostrar(`<g class="casa-treme">${p('M-26 -52 Q -26 -70 -10 -70 Z', AMARELO2, 4) + p('M26 -52 Q 26 -70 10 -70 Z', AMARELO2, 4)}</g>` +
          `<g class="casa-pisca">${l('M-34 -66 q -8 -8 -2 -18 M-40 -58 q -12 -10 -4 -26 M34 -66 q 8 -8 2 -18 M40 -58 q 12 -10 4 -26', T, 3)}</g>`, 1500);
        ctx.particulas('nota', 0, -80, 3, { dy: -90, espalha: 60, seguidas: 380 });
        ctx.depois(300, () => ctx.diz(e.hora === 1 ? 'É uma hora!' : `São ${HORAS[e.hora]} horas!`));
      },
    },
    // ---------------------------------------------------------------- baú: os brinquedos pulam para fora e voltam
    bau: {
      tocar(ctx) {
        ctx.som('pulo');
        const sai = (k, x, arte) => `<g transform="translate(${x} -100)"><g class="quarto-sai${k}">${arte}</g></g>`;
        ctx.mostrar(sai(1, -34, uma('bau-bola', () => em(0, 0, .62, bola()))) + sai(2, 4, uma('bau-piao', () => em(0, 0, .8, piao(false)))) +
          sai(3, 40, uma('bau-carro', () => em(0, 0, .75, carrinho()))), 2000);
        ctx.depois(140, () => ctx.som('pulo')); ctx.depois(1150, () => ctx.som('soltar'));
        ctx.particulas('estrela', 0, -130, 4, { dy: -120, espalha: 90 });
      },
    },
    // ---------------------------------------------------------------- ursinho: dá um abraço (olhinhos fechados e corações)
    ursinho: {
      tocar(ctx) {
        const PEL = '#D9A066';
        ctx.som('piu'); ctx.pular();
        ctx.mostrar(uma('ursinho-abraco', () =>
          fe(-11, -88, 5.5, 6.5, PEL) + fe(11, -88, 5.5, 6.5, PEL) + l('M-16 -87 q 5 -5 10 0 M6 -87 q 5 -5 10 0', T, 3) +
          fe(-18, -76, 6, 3.6, ROSA, .9) + fe(18, -76, 6, 3.6, ROSA, .9) +
          em(-14, -36, 1, e(0, 0, 10, 22, PEL, 5), -62) + em(14, -36, 1, e(0, 0, 10, 22, PEL, 5), 62) +
          p('M0 -30 C -12 -42 -20 -28 0 -18 C 20 -28 12 -42 0 -30 Z', CORAL, 3)), 1400);
        ctx.particulas('coracao', 0, -100, 4, { dy: -110, espalha: 60 });
      },
    },
    // ---------------------------------------------------------------- bola: quica
    bola: comVoo('bola', () => `<g class="quarto-quica">${D('bola')}</g>`, 1400, ctx => {
      ctx.som('pulo'); ctx.depois(500, () => ctx.som('pulo')); ctx.depois(950, () => ctx.som('pulo'));
    }),
    // ---------------------------------------------------------------- carrinho: anda para frente e volta (rodas girando)
    carrinho: comVoo('carrinho', () => uma('carrinho-anda', () => `<g class="quarto-anda">${D('carrinho')}` +
      [-20, 22].map(x => `<g class="casa-gira">${l(`M${x - 6} -12 H ${x + 6} M${x} -18 V -6`, '#E9E2F2', 3)}</g>`).join('') + '</g>'), 2200, ctx => {
      ctx.som('piu'); ctx.depois(1150, () => ctx.som('piu'));
      ctx.particulas('vento', -40, -16, 2, { dx: -120, dy: -10, espalha: 20, seguidas: 200 });
    }),
    // ---------------------------------------------------------------- pião: gira, bamboleando
    piao: comVoo('piao', () => uma('piao-gira', () => `<g class="quarto-bamboleia">${piao(false)}` +
      `<g class="quarto-listra">${l('M-2 -50 Q 2 -32 -1 -14', '#fff', 5)}</g></g>` +
      `<g class="casa-pisca">${l('M-42 -46 q -10 12 0 24 M42 -46 q 10 12 0 24', T, 3)}</g>`), 2200, ctx => {
      ctx.som('pegar'); ctx.depois(2100, () => ctx.som('soltar'));
      ctx.particulas('vento', 0, -30, 2, { dx: 0, dy: -60, espalha: 60 });
    }),
    // ---------------------------------------------------------------- pipa: balança no prego, com ventinho
    pipa: {
      tocar(ctx) {
        ctx.som('pegar'); ctx.balancar();
        ctx.particulas('vento', -100, 120, 3, { dx: 220, dy: 0, espalha: 50, seguidas: 160 });
      },
    },
    // ---------------------------------------------------------------- pantufas: pulam, uma de cada vez
    pantufas: comVoo('pantufas', () => uma('pantufas-pulam', () => sombra(0, 0, 50, 6) + `<g class="quarto-pula">${pantufas(-1)}</g><g class="quarto-pula quarto-depois">${pantufas(1)}</g>`), 2000, ctx => {
      ctx.som('pulo'); ctx.depois(300, () => ctx.som('pulo')); ctx.depois(800, () => ctx.som('pulo')); ctx.depois(1100, () => ctx.som('pulo'));
    }),
    // ---------------------------------------------------------------- prateleira: treme e o que está em cima dá um pulinho
    prateleiraQuarto: {
      tocar(ctx) {
        ctx.som('clique'); ctx.tremer();
        ctx.perto(190).forEach((o, k) => ctx.depois(120 + k * 110, () => o.contexto().pular()));
        ctx.depois(160, () => ctx.som('pulo'));
      },
    },
    // ---------------------------------------------------------------- livros: um livro abre e a página vira (cada vez um desenho)
    livros: {
      tocar(ctx) {
        const e = ctx.estado;
        e.pagina = ((e.pagina || 0) + 1) % 4;
        ctx.som('pagina'); ctx.depois(450, () => ctx.som('pagina'));
        ctx.mostrar(uma('livro-' + e.pagina, () => livroAberto(e.pagina)), 1700);
        ctx.depois(900, () => ctx.particulas('estrela', 30, -190, 2, { dy: -70, espalha: 50 }));
      },
    },
    // ---------------------------------------------------------------- porta-retrato: brilha
    portaRetrato: {
      tocar(ctx) {
        ctx.som('figurinha'); ctx.pular();
        ctx.mostrar(uma('retrato-brilha', () => `<g class="casa-pulsa"><rect x="-54" y="-112" width="108" height="120" rx="16" fill="none" stroke="#FFE27A" stroke-width="9" opacity=".9"/></g>` +
          [[-52, -110, 'casa-pisca'], [52, -6, 'casa-pisca2'], [54, -106, 'casa-pisca2'], [-50, -4, 'casa-pisca']].map(([x, y, cl]) => `<g class="${cl}">${p(estrelaD(x, y, 11), '#FFF6C8', 3)}</g>`).join('')), 1500);
        ctx.particulas('estrela', 0, -60, 3, { dy: -110, espalha: 70 });
        ctx.particulas('coracao', 0, -60, 2, { dy: -100, espalha: 40 });
      },
    },
    // ---------------------------------------------------------------- vasinho: ginga e a florzinha abre
    vasinho: comVoo('vasinho', () => uma('vasinho-ginga', () => `<g class="quarto-ginga">${D('vasinho')}<g class="casa-pulsa">` +
      [0, 72, 144, 216, 288].map(a => em(0, -78, 1, e(0, -11, 6, 9, ROSA, 3), a)).join('') + c(0, -78, 6, AMARELO2, 3) + '</g></g>'), 1500, ctx => {
      ctx.som('bolha');
      ctx.particulas('folha', 0, -60, 2, { dy: -70, espalha: 50 });
    }),
    // ---------------------------------------------------------------- móbile: gira devagar (liga e desliga)
    mobile: {
      desenho: e => (e && e.ligado ? invisivel('mobile') : D('mobile')),
      sobre: e => (e && e.ligado ? uma('mobile-gira', () => `<g class="quarto-roda">${D('mobile')}</g>`) : ''),
      tocar(ctx) {
        const e = ctx.estado;
        e.ligado = !e.ligado;
        ctx.som(e.ligado ? 'figurinha' : 'soltar');
        ctx.mudou();
        if (e.ligado) ctx.particulas('nota', 0, 120, 3, { dy: -80, espalha: 70, seguidas: 250 });
      },
    },
    // ---------------------------------------------------------------- bandeirinhas: balançam no ventinho
    bandeirinhas: comVoo('bandeirinhas', () => uma('bandeirinhas-balancam', () => bandeirinhas(470, undefined, 'quarto-tremula')), 2100, ctx => {
      ctx.som('pegar');
      ctx.particulas('vento', 40, 50, 3, { dx: 380, dy: 10, espalha: 30, seguidas: 160 });
    }),
    // ---------------------------------------------------------------- quadros: balançam no prego (cada um com uma graça)
    quadroCasinha: {
      tocar(ctx) {
        ctx.som('piu'); ctx.balancar();
        ctx.mostrar(uma('quadro-sol', () => `<g transform="translate(37 66)"><g class="casa-gira-lento">` +
          [0, 45, 90, 135, 180, 225, 270, 315].map(a => em(0, 0, 1, `<path d="M0 -15 V -22" stroke="#FFC93C" stroke-width="4" stroke-linecap="round"/>`, a)).join('') + '</g></g>'), 1400);
      },
    },
    quadroFoguete: {
      tocar(ctx) {
        ctx.som('figurinha'); ctx.balancar();
        ctx.mostrar(`<g class="casa-pulsa">${p('M-9 142 Q 0 182 9 142 Z', CORAL, 2.5) + f('M-4 144 Q 0 164 4 144 Z', '#FFE27A')}</g>`, 1300);
        ctx.particulas('estrela', 0, 110, 5, { dy: -120, espalha: 110 });
      },
    },
    quadroArcoIris: {
      tocar(ctx) {
        ctx.som('figurinha'); ctx.balancar();
        ctx.particulas('estrela', 0, 90, 3, { dy: -110, espalha: 90 });
        ctx.particulas('coracao', 0, 90, 2, { dy: -100, espalha: 60 });
      },
    },
  };

  /** livro aberto que surge por cima da fileira; a folha vira e mostra um desenho (sol, lua, peixe ou flor) */
  function livroAberto(k) {
    const pag = (lado, cor = '#FFFFFF') => p(`M0 0 Q ${lado * 30} -10 ${lado * 62} -2 V -70 Q ${lado * 30} -78 0 -68 Z`, cor, 3.5);
    const linhas = lado => [-56, -46, -36, -26, -16].map(y => l(`M${lado * 10} ${y} Q ${lado * 32} ${y - 4} ${lado * 52} ${y + 1}`, '#D8CDEB', 3)).join('');
    const figura = [
      c(32, -38, 12, AMARELO2, 3) + [0, 60, 120, 180, 240, 300].map(a => em(32, -38, 1, l('M0 -17 V -23', '#F2B21B', 3.5), a)).join(''),
      p('M38 -54 Q 18 -50 18 -36 Q 20 -20 40 -20 Q 28 -28 28 -38 Q 28 -48 38 -54 Z', '#FFE27A', 3) + p(estrelaD(48, -48, 5), AMARELO2, 2),
      p('M18 -38 q 14 -12 28 0 q -14 12 -28 0 Z', CORAL, 3) + p('M46 -38 l 10 -8 v 16 Z', CORAL, 3) + fe(24, -40, 2, 2, T) + c(52, -56, 3, 'none', 2),
      [0, 72, 144, 216, 288].map(a => em(32, -40, 1, e(0, -9, 5, 8, ROSA, 2.5), a)).join('') + c(32, -40, 5, AMARELO2, 2.5) + l('M32 -30 V -16', VERDE, 3),
    ][k % 4];
    let s = p('M-70 6 Q -34 -4 0 6 Q 34 -4 70 6 V -66 H -70 Z', CORAL, 4);
    s += pag(-1) + linhas(-1) + pag(1) + figura;
    s += `<g class="quarto-folha">${pag(1) + linhas(1)}</g>` + l('M0 -68 V 0', tom('#D8CDEB', -.2), 3);
    return em(18, -118, 1, `<g class="quarto-surge">${s}</g>`);
  }

  // =====================================================================================  LUZ
  /* A janela fechada: as mesmas cortinas amarelas de listrinhas e bolinhas, soltas do laço e fechadas sobre o vidro
     (cobrem também as cortinas abertas e o laço). j = o vidro; o varão fica 36 px acima dele. Sem clipPath: as
     listras e bolinhas ficam dentro do pano e o barrado coral cobre a ponta de baixo delas. */
  function cortinaFechada(j) {
    const cx = j.x + j.w / 2, yV = j.y - 36, xa = cx - 185, xb = cx + 185, ate = j.y + 380;
    const painel = (x0, x1, lado) => {
      const w = x1 - x0, dobras = 4, pw = w / dobras;
      // o pano: em cima reto (preso nas argolas), embaixo ondulado (as dobras)
      let d = `M${n(x0)} ${yV + 2} H ${n(x1)} L ${n(x1 + lado * 2)} ${ate - 4}`;
      for (let k = 0; k < dobras; k++) { const xa2 = x1 - k * pw; d += ` Q ${n(xa2 - pw / 2)} ${ate + 16} ${n(xa2 - pw)} ${ate - 4}`; }
      d += ' Z';
      let s = p(d, AMARELO2, 5);
      // listrinhas verticais (um caminho só)
      let li = '';
      for (let x = x0 + 12; x < x1 - 10; x += 26) li += `M${n(x)} ${yV + 6} h 8 V ${ate - 22} h -8 Z `;
      s += f(li, '#FFE27A');
      // bolinhas brancas (um caminho só)
      let bo = '';
      for (let y = yV + 34, jj = 0; y < ate - 30; y += 34, jj++)
        for (let x = x0 + 20 + (jj % 2) * 13; x < x1 - 12; x += 26) bo += `M${n(x - 4)} ${y} a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 `;
      s += f(bo, '#fff', .9);
      // dobras: sombras e luzes ondulando de cima a baixo
      let so = '', lu = '';
      for (let k = 1; k < dobras; k++) {
        const x = x0 + k * pw;
        so += `M${n(x)} ${yV + 14} q 7 ${n((ate - yV) * .3)} -2 ${n((ate - yV) * .6)} t 3 ${n((ate - yV) * .36)} `;
        lu += `M${n(x - pw / 2)} ${yV + 30} q 5 ${n((ate - yV) * .3)} -2 ${n((ate - yV) * .55)} `;
      }
      s += l(so, tom(AMARELO2, -.2), 5) + l(lu, '#fff', 5).replace('/>', ' opacity=".35"/>');
      // sombra no lado de dentro (onde os dois panos se encontram)
      const xi = lado > 0 ? x1 : x0;
      s += f(`M${n(xi)} ${yV + 6} L ${n(xi - lado * 18)} ${yV + 6} Q ${n(xi - lado * 12)} ${n((yV + ate) / 2)} ${n(xi - lado * 4)} ${ate - 22} L ${n(xi)} ${ate - 22} Z`, tom(AMARELO2, -.15), .8);
      // barrado coral ondulado, com a costurinha
      let bar = `M${n(x0 - lado * 0)} ${ate - 26} H ${n(x1)} L ${n(x1 + lado * 2)} ${ate - 4}`;
      for (let k = 0; k < dobras; k++) { const xa2 = x1 - k * pw; bar += ` Q ${n(xa2 - pw / 2)} ${ate + 16} ${n(xa2 - pw)} ${ate - 4}`; }
      s += p(bar + ' Z', CORAL, 5) + costura(`M${n(x0 + 8)} ${ate - 16} H ${n(x1 - 8)}`, '#fff', 3);
      return s;
    };
    let s = painel(xa - 4, cx + 4, 1) + painel(cx - 4, xb + 4, -1);
    // o varão por cima, com as argolas segurando o pano
    s += r(xa - 14, yV - 7, xb - xa + 28, 14, MAD2, 7, 5) + fr(xa - 8, yV - 4, xb - xa + 16, 3, '#fff', 0, .35);
    s += c(xa - 20, yV, 13, AMARELO2, 5) + c(xb + 20, yV, 13, AMARELO2, 5) + brilho(xa - 24, yV - 5, 5, 3, -30, .6) + brilho(xb + 16, yV - 5, 5, 3, -30, .6);
    let an = '';
    for (let x = xa + 10; x <= xb - 6; x += 40) an += `M${n(x)} ${yV - 8} a7 10 0 1 0 0.1 0 `;
    s += l(an, T, 3);
    return s;
  }
  /** O interruptor do quarto (já desenhado no fundo) e o lustre: uma nuvenzinha de luz com carinha, presa no teto. */
  function lustreNuvem(aceso) {
    const CORPO = aceso ? '#FFF8D6' : '#ECE8F4', SOMBRA = aceso ? '#FFE48A' : '#D6D0E6', BARRIGA = aceso ? '#FFFDF0' : '#F6F3FA';
    const nuvem = 'M-104 100 Q -128 100 -126 78 Q -124 56 -100 54 Q -104 26 -74 22 Q -60 0 -30 8 Q -6 -10 22 4 Q 50 -4 66 20 Q 98 16 102 46 Q 128 50 126 76 Q 124 100 104 100 Z';
    let s = r(-34, 0, 68, 12, CREME, 6, 4) + l('M0 12 V 18', T, 6);
    let g = p(nuvem, CORPO, 6);
    g += f('M126 76 Q 124 100 104 100 L -104 100 Q -122 100 -125 86 Q -20 96 124 66 Z', SOMBRA, .9);
    g += f('M66 20 Q 98 16 102 46 Q 116 48 122 58 Q 104 56 92 60 Q 96 32 66 20 Z', SOMBRA, .7);
    g += fe(0, 70, 78, 18, BARRIGA, .8);
    g += brilho(-62, 34, 22, 8, -20, .7) + brilho(-20, 18, 9, 4, -15, .6);
    // carinha: dormindo quando apagada, acordada e feliz quando acesa
    g += aceso
      ? fe(-26, 56, 5, 6.5, T) + fe(26, 56, 5, 6.5, T) + fe(-24, 53, 1.8, 2, '#fff') + fe(28, 53, 1.8, 2, '#fff') + l('M-12 70 Q 0 82 12 70', T, 4)
      : l('M-33 58 q 7 6 14 0 M19 58 q 7 6 14 0', T, 4) + l('M-6 74 q 6 4 12 0', T, 3.5);
    g += fe(-44, 70, 11, 6, ROSA, .55) + fe(44, 70, 11, 6, ROSA, .55);
    // estrelinhas grudadas na nuvem
    g += em(-92, 66, 1, p(estrelaD(0, 0, 14), AMARELO2, 3.5), -12) + em(96, 40, 1, p(estrelaD(0, 0, 11), AMARELO2, 3.5), 14) + c(70, 82, 5, ROSA, 3);
    return s + em(0, 6, .92, g);
  }

  CASA.partes.quarto = {
    acoes,
    catalogo,
    luz: {
      janelas: [1010, 2050, 3060].map(x => ({ x: x - 115, y: 360, w: 230, h: 300 })),
      fechada: j => cortinaFechada(j),
      interruptor: { x: 4440, y: 680 },
      lustre: { x: 2050, y: 210, lampada: [0, 64], desenho: aceso => lustreNuvem(aceso) },
    },
    fundo(L) {
      const yLambri = L.piso - 220, J = [[1010, -1], [2050, 1], [3060, -1]];
      let s = papelDeParede(L, yLambri) + lambri(L, yLambri, L.piso - 40) + rodape(L) + piso(L);
      for (const [x, lado] of J) s += janela(x, 340, 270, 340, lado) + cortinas(x, 324, 270, 740);
      s += interruptor(4440, L.piso - 330);   // (as tomadas são da casa toda: CASA.TOMADAS, js/casa/base.js)
      s += estrelinhasDaParede([[3640, 360, 12, 10], [3720, 320, 8, -12], [3800, 380, 10, 20], [3990, 330, 9, 0], [4060, 390, 12, -10], [3900, 300, 7, 15], [3580, 470, 8, 8], [4120, 480, 9, -6]]);
      return s;
    },
    objetos(L) {
      const y = L.piso;
      let s = '';
      if (verCatalogo) {
        const lista = [[guardaRoupa(), 300], [comoda(), 260], [bau(em(-30, -92, 1, bola()) + em(26, -100, 1, carrinho(), -12) + em(44, -96, .8, piao(), 18)), 200], [ursinho(), 130], [pantufas(), 130], [despertador(), 100], [bola(), 100], [carrinho(), 110], [piao(), 100]];
        let x = 1560;
        for (const [o, w] of lista) { s += em(x, y, 1, o); x += w; }
      }
      // paredes: luzinhas, pipa, quadros, prateleira, móbile perto do vão
      s += em(1290, 290, 1, luzinhas(500)) + em(2310, 290, 1, bandeirinhas(470)) + em(3320, 290, 1, luzinhas(220, 1));
      s += em(1560, 420, 1, pipa());
      s += em(2560, 470, 1, quadro(0)) + em(2730, 440, 1, quadro(1)) + em(1740, 560, .9, quadro(2));
      s += em(3840, 640, 1, prateleira());
      s += em(3772, 640, 1, livros()) + em(3850, 596, .8, vasinho()) + em(3940, 640, 1, portaRetrato());
      s += em(4320, 248, .9, mobile());
      // o canto de dormir
      s += em(1200, y + 10, 1, tapete());
      s += em(797, y, .95, cama());
      s += em(1014, y, .92, criadoMudo());
      s += em(1006, y - 143, .95, abajur());
      return s;
    },
  };
})();
