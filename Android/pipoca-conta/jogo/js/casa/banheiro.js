/* Casa da Pipoca (esboço) — o BANHEIRO, no andar de cima, à direita do quarto.
   Cada objeto é uma função própria, desenhada em volta de (0,0) = meio do pé no chão
   (coisas de parede: (0,0) = o ponto onde se prendem, dito em cada uma). */
(function () {
  const { T, r, c, e, p, l, f, fr, fe, brilho, sombra, tom, em, n } = CASA;

  // ---------------------------------------------------------------- cores do banheiro
  const PAREDE = '#DDF4EF', PAREDE_PONTO = '#C4EAE2';
  const AZULEJO = '#BFE7EE', REJUNTE = '#97CDD8';
  const PISO_A = '#F4FAFC', PISO_B = '#CFE5F0', PISO_REJ = '#A9CADB';
  const LOUCA = '#FFFFFF', LOUCA_S = '#D2E2F2', LOUCA_SS = '#B7CCE4';
  const METAL = '#D3DDEE', METAL_S = '#9CAED0';
  const AGUA = '#2EC4B6', CORAL = '#FF7A6B', AMAR = '#FFC93C', AMAR2 = '#FFD23F', ROXO = '#9B7BFF',
    VERDE = '#5CC84A', ROSA = '#FF8FC2', AZ = '#4DA3FF', MAD1 = '#C98A55', MAD2 = '#A9703F', MAD3 = '#8A5A34', CREME = '#FFF4E6';
  const LILAS = tom(ROXO, .38);

  // ---------------------------------------------------------------- miudezas
  /** cano/tubo com contorno: uma linha grossa T por baixo e a cor por cima */
  const tubo = (d, cor, larg = 10, sw = 4) => l(d, T, larg + sw * 2) + l(d, cor, larg);
  /** gotinha d'água em volta de (x,y) */
  const gota = (x, y, s = 1, cor = '#8FD0FF') => em(x, y, s, p('M0 -12 C 3 -6 8 -1 8 4 A 8 8 0 0 1 -8 4 C -8 -1 -3 -6 0 -12 Z', cor, 3) + brilho(-3, 3, 2, 3.5, 0, .9));
  /** bolha de sabão: transparente, com reflexo */
  const bolha = (x, y, rr) =>
    `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rr)}" fill="#E6F6FF" fill-opacity=".55" stroke="${T}" stroke-width="3"/>` +
    l(`M${n(x - rr * .62)} ${n(y + rr * .05)} A ${n(rr * .62)} ${n(rr * .62)} 0 0 1 ${n(x - rr * .05)} ${n(y - rr * .62)}`, '#fff', Math.max(2, rr * .2)) +
    fe(x + rr * .38, y + rr * .4, rr * .14, rr * .14, '#fff', .9);
  /** espuma: nuvem de círculos com um contorno só, sombra azulada embaixo */
  function espuma(cs) {
    let s = cs.map(([x, y, rr]) => c(x, y, rr, LOUCA, 5)).join('');
    s += cs.map(([x, y, rr]) => fe(x, y, rr - 2.5, rr - 2.5, LOUCA)).join('');
    s += cs.map(([x, y, rr]) => fe(x + rr * .15, y + rr * .45, rr * .7, rr * .38, '#E2EEFA')).join('');
    s += cs.map(([x, y, rr]) => fe(x - rr * .35, y - rr * .38, rr * .22, rr * .14, '#fff')).join('');
    return s;
  }

  // ================================================================ OBJETOS
  /** banheira de pezinhos, cheia de espuma e bolhas */
  function banheira() {
    let s = sombra(0, 2, 156, 13);
    // pezinhos dourados (bolinha com garrinha)
    const pe = x => p(`M${x - 17} -42 Q ${x - 24} -12 ${x - 14} -2 Q ${x} 4 ${x + 14} -2 Q ${x + 24} -12 ${x + 17} -42 Z`, AMAR, 5) +
      f(`M${x + 6} -38 Q ${x + 16} -14 ${x + 8} -4 Q ${x + 14} -2 ${x + 16} -10 Q ${x + 20} -26 ${x + 14} -40 Z`, tom(AMAR, -.18)) +
      l(`M${x - 6} -10 v 7 M${x + 4} -10 v 7`, T, 3) + brilho(x - 7, -28, 4, 8, 10, .6);
    s += pe(-104) + pe(104);
    // corpo (por fora, rosa com bolinhas)
    const corpo = 'M-140 -130 L 140 -130 Q 144 -68 110 -46 Q 90 -34 58 -34 L -58 -34 Q -90 -34 -110 -46 Q -144 -68 -140 -130 Z';
    s += p(corpo, ROSA, 6);
    s += f('M-136 -92 Q -124 -54 -92 -44 Q -62 -38 0 -38 L 58 -38 Q 90 -38 108 -48 Q 130 -62 137 -92 Q 100 -66 0 -64 Q -100 -66 -136 -92 Z', tom(ROSA, -.15));
    for (let i = 0; i < 9; i++) {
      const x = -104 + i * 26, y = -98 + (i % 2) * 18;
      s += fe(x, y, 6, 6, '#fff', .75);
    }
    s += brilho(-96, -108, 34, 8, -10, .5) + brilho(-60, -116, 10, 4, -6, .5);
    s += l(corpo, T, 6);
    // espuma por cima da água
    s += espuma([[-118, -150, 22], [-92, -164, 28], [-56, -176, 32], [-18, -166, 28], [18, -180, 34], [56, -168, 28], [90, -176, 26], [120, -156, 22],
      [-74, -148, 22], [-30, -148, 24], [12, -150, 24], [50, -148, 24], [92, -148, 22], [-2, -196, 22], [-80, -190, 18]]);
    // borda de louça
    s += r(-154, -148, 308, 26, LOUCA, 13, 6) + fr(-146, -130, 292, 6, LOUCA_S, 3) + brilho(-80, -141, 56, 4, 0, .9);
    // torneira na ponta esquerda
    s += tubo('M-124 -146 V -194 Q -124 -212 -104 -212 H -90 V -202', METAL, 10, 4) + l('M-122 -192 V -150', '#fff', 3);
    s += c(-124, -176, 10, CORAL, 4) + brilho(-127, -179, 3, 2, 0, .9);
    s += gota(-90, -186, .8);
    // bolhas subindo
    s += bolha(-40, -238, 13) + bolha(36, -262, 10) + bolha(100, -226, 15) + bolha(-6, -300, 8) + bolha(118, -292, 10) + bolha(-96, -262, 9);
    return s;
  }

  /** patinho de borracha (boia em cima da espuma) */
  function pato() {
    let s = '';
    s += c(-14, -44, 18, AMAR2, 5);
    const corpo = 'M-34 -16 Q -34 0 -10 0 L 22 0 Q 36 0 40 -16 L 48 -34 Q 36 -26 28 -28 Q 10 -32 -10 -30 Q -34 -30 -34 -16 Z';
    s += p(corpo, AMAR2, 5);
    s += fe(-14, -45, 13, 13, AMAR2);
    s += f('M-30 -8 Q -20 -1 -6 -1 L 22 -1 Q 34 -2 38 -14 Q 24 -6 -6 -6 Q -22 -6 -30 -8 Z', tom(AMAR2, -.18));
    s += l('M0 -18 Q 12 -6 26 -16', tom(AMAR2, -.3), 4);
    // bico, olho, bochecha
    s += p('M-29 -46 Q -46 -50 -50 -40 Q -44 -33 -29 -37 Z', CORAL, 4) + l('M-48 -41 H -32', tom(CORAL, -.3), 2.5);
    s += c(-18, -50, 4, T, 0) + fe(-17, -51.5, 1.4, 1.4, '#fff');
    s += fe(-8, -38, 5, 3.5, ROSA, .7);
    s += brilho(-8, -56, 7, 3.5, -25, .7) + brilho(-18, -22, 8, 3, -10, .45);
    return s;
  }

  /** o pano da cortina fechada, solto do varão de ponta a ponta */
  function panoFechado() {
    const x0 = -148, x1 = 144, y0 = 12, y1 = 328, W = x1 - x0;
    let s = fr(x0, y0, W, y1 - y0 + 4, LOUCA);
    const K = 11, lw = W / K;
    for (let i = 0; i < K; i++) {
      const a = x0 + i * lw;
      s += i % 2 === 0 ? fr(a, y0, lw, y1 - y0 + 2, AZ) : fr(a + lw * .38, y0, lw * .24, y1 - y0 + 2, AMAR2);
    }
    // dobras e sombra do lado da parede
    s += fr(x1 - 40, y0, 40, y1 - y0 + 2, T, 0, .16);
    for (let x = x0 + lw * 2; x < x1 - 30; x += lw * 2) s += l(`M${n(x)} ${y0 + 10} V ${y1 - 4}`, tom(AZ, -.35), 2.5);
    // barra de baixo em ondinhas
    let baixo = '';
    const passos = 8;
    for (let i = 1; i <= passos; i++) baixo += ` Q ${n(x1 - W * (i - .5) / passos)} ${y1 + (i % 2 ? 26 : 14)} ${n(x1 - W * i / passos)} ${y1 + 16}`;
    s += p(`M${x0} ${y1 - 6} H ${x1} V ${y1 + 16}${baixo} Z`, LOUCA, 5);
    s += l(`M${x0} ${y0} V ${y1 - 4} M${x1} ${y0} V ${y1 - 4}`, T, 6);
    // argolas no varão
    for (let i = 0; i < 10; i++) { const x = x0 + 8 + i * 30.5; s += `<circle cx="${n(x)}" cy="2" r="9" fill="none" stroke="${T}" stroke-width="7"/><circle cx="${n(x)}" cy="2" r="9" fill="none" stroke="${AMAR}" stroke-width="3"/>`; }
    s += brilho(x0 + 20, 90, 6, 30, 0, .5);
    return s;
  }

  /** cortina listrada no varão, presa de lado (0,0 = meio do varão; o varão vai até a parede em +146).
      fechada = o pano solto cobrindo a banheira inteira */
  function cortina(fechada = false) {
    let s = '';
    // varão (preso na parede da direita, bolinha na ponta)
    s += tubo('M-152 0 H 150', METAL, 8, 4) + l('M-148 -2 H 146', '#fff', 2.5);
    s += c(-158, 0, 10, AMAR, 4) + brilho(-161, -3, 3, 2, 0, .9);
    s += r(144, -16, 12, 32, METAL, 4, 4);
    if (fechada) return s + panoFechado();
    // o pano: cai do varão, amarrado no meio, abre de novo embaixo
    const H = 330, N = 14;
    const xl = t => 40 + 52 * Math.sin(Math.PI * t / 1.12), xr = t => 144 - 16 * Math.sin(Math.PI * t / 1.12);
    const yy = t => 12 + H * t;
    const borda = (lado, ts) => ts.map(t => `${n(lado(t))} ${n(yy(t))}`).join(' L ');
    const ts = Array.from({ length: N + 1 }, (_, i) => i / N), tr = [...ts].reverse();
    // barra de baixo em ondinhas
    let baixo = '';
    const xb0 = xr(1), xb1 = xl(1), passos = 4;
    for (let i = 1; i <= passos; i++) baixo += ` Q ${n(xb0 + (xb1 - xb0) * (i - .5) / passos)} ${n(yy(1) + (i % 2 ? 14 : 2))} ${n(xb0 + (xb1 - xb0) * i / passos)} ${n(yy(1) + 4)}`;
    const panoOnda = `M${n(xl(0))} ${n(yy(0))} L ${borda(xl, ts)} L ${n(xl(1))} ${n(yy(1) + 4)}` +
      ` L ${n(xr(1))} ${n(yy(1) + 4)} L ${borda(xr, tr)} Z`;
    s += p(panoOnda, LOUCA, 6);
    // listras azuis (faixas entre frações da largura)
    const listra = (a, b, cor, op = 1) => {
      const ida = ts.map(t => `${n(xl(t) + (xr(t) - xl(t)) * a)} ${n(yy(t))}`), volta = tr.map(t => `${n(xl(t) + (xr(t) - xl(t)) * b)} ${n(yy(t))}`);
      return f(`M${ida.join(' L ')} L ${n(xl(1) + (xr(1) - xl(1)) * b)} ${n(yy(1) + 4)} L ${volta.join(' L ')} Z`, cor, op);
    };
    const K = 7;
    for (let i = 0; i < K; i++) if (i % 2 === 0) s += listra(i / K, (i + 1) / K, AZ);
    for (let i = 0; i < K; i++) if (i % 2 === 1) s += listra((i + .38) / K, (i + .62) / K, AMAR2);
    // dobras e sombra do lado da parede
    s += listra(.8, 1, T, .16);
    for (const a of [.28, .56]) s += l(ts.map((t, i) => `${i ? 'L' : 'M'}${n(xl(t) + (xr(t) - xl(t)) * a)} ${n(yy(t))}`).join(' '), tom(AZ, -.35), 2.5);
    // ondinhas da barra embaixo (escondem o corte reto)
    s += p(`M${n(xr(1))} ${n(yy(1) + 4)}${baixo} Z`, LOUCA, 0);
    s += l(`M${n(xr(1))} ${n(yy(1) + 4)}${baixo}`, T, 6);
    s += l(`M${n(xl(1))} ${n(yy(1) + 4)} L ${borda(xl, tr)}`, T, 6) + l(`M${n(xr(1))} ${n(yy(1) + 4)} L ${borda(xr, tr)}`, T, 6);
    // argolas no varão
    for (let i = 0; i < 6; i++) { const x = 46 + i * 19; s += `<circle cx="${n(x)}" cy="2" r="9" fill="none" stroke="${T}" stroke-width="7"/><circle cx="${n(x)}" cy="2" r="9" fill="none" stroke="${AMAR}" stroke-width="3"/>`; }
    // laço que segura a cortina
    const tm = .5, ym = yy(tm), xa = xl(tm) - 4, xz = xr(tm) + 4;
    s += r(xa, ym - 10, xz - xa, 20, CORAL, 10, 5) + fr(xa + 6, ym + 2, xz - xa - 12, 5, tom(CORAL, -.18), 2);
    s += p(`M${n(xa + 6)} ${n(ym)} Q ${n(xa - 18)} ${n(ym - 24)} ${n(xa - 22)} ${n(ym - 4)} Q ${n(xa - 20)} ${n(ym + 14)} ${n(xa + 6)} ${n(ym)} Z`, CORAL, 4);
    s += p(`M${n(xa + 6)} ${n(ym + 2)} Q ${n(xa - 10)} ${n(ym + 30)} ${n(xa - 4)} ${n(ym + 44)} L ${n(xa + 10)} ${n(ym + 38)} Q ${n(xa + 4)} ${n(ym + 22)} ${n(xa + 12)} ${n(ym + 6)} Z`, CORAL, 4);
    s += c(xa + 6, ym, 7, tom(CORAL, -.1), 4);
    s += brilho(xl(.15) + 14, yy(.15), 6, 26, 8, .5);
    return s;
  }

  /** chuveiro elétrico com gotinhas (0,0 = o meio de cima da ducha; o cano vai até a parede em x = comp) */
  function chuveiro(comp = 140) {
    let s = '';
    s += r(comp - 10, -62, 16, 34, METAL, 5, 4);
    s += tubo(`M${comp - 4} -46 H 18 Q 0 -46 0 -30 V -20`, METAL, 10, 4) + l(`M${comp - 8} -49 H 20`, '#fff', 2.5);
    // registro (botãozinho de girar)
    s += c(comp - 40, -46, 11, AGUA, 4) + l(`M${comp - 48} -46 H ${comp - 32}`, T, 3);
    // corpo da ducha
    const corpo = 'M-40 -6 Q -40 -30 0 -30 Q 40 -30 40 -6 L 46 14 Q 48 24 36 24 L -36 24 Q -48 24 -46 14 Z';
    s += p(corpo, LOUCA, 5) + f('M14 -24 Q 38 -22 38 -6 L 44 16 Q 44 20 38 20 L 26 20 Q 30 0 14 -24 Z', LOUCA_S) + brilho(-18, -16, 14, 5, -8, .9) + l(corpo, T, 5);
    s += fe(0, -10, 5, 5, ROXO) + l('M-30 6 H 30', LOUCA_SS, 3);
    // crivo
    s += r(-40, 20, 80, 12, METAL, 6, 4);
    for (let i = 0; i < 6; i++) s += fe(-25 + i * 10, 26, 2, 2, METAL_S);
    // água caindo
    const gs = [[-28, 54, .8], [-6, 64, .9], [18, 50, .75], [32, 82, .8], [-20, 96, .85], [6, 108, .75], [-34, 130, .7], [24, 128, .8], [-6, 150, .7]];
    for (const [x, y, k] of gs) s += gota(x, y, k);
    return s;
  }

  /** pia com gabinete de madeira e cuba de louça */
  function pia() {
    let s = sombra(0, 2, 92, 11);
    // pezinhos
    s += r(-70, -16, 18, 16, MAD3, 5, 4) + r(52, -16, 18, 16, MAD3, 5, 4);
    // gabinete
    s += r(-82, -146, 164, 134, MAD1, 12, 6);
    s += fr(56, -140, 20, 122, tom(MAD1, -.15), 8);
    s += r(-70, -132, 66, 108, tom(MAD1, .14), 8, 4) + r(4, -132, 66, 108, tom(MAD1, .14), 8, 4);
    s += r(-60, -122, 46, 88, tom(MAD1, .22), 6, 3) + r(14, -122, 46, 88, tom(MAD1, .22), 6, 3);
    s += f('M-44 -110 q 6 20 0 40 M30 -100 q 6 18 0 36', 'none') + l('M-38 -110 q 5 18 0 38 M40 -104 q 5 16 0 34', tom(MAD1, -.12), 3);
    s += c(-14, -80, 7, AMAR, 4) + c(14, -80, 7, AMAR, 4) + fe(-16, -82, 2, 2, '#fff', .8) + fe(12, -82, 2, 2, '#fff', .8);
    s += brilho(-56, -126, 12, 4, 0, .5);
    // tampo
    s += r(-94, -164, 188, 24, CREME, 10, 6) + fr(-88, -146, 176, 5, tom(CREME, -.12), 2) + brilho(-50, -158, 30, 3.5, 0, .8);
    // torneira (atrás da cuba)
    s += tubo('M0 -170 V -238 Q 0 -256 18 -256 Q 34 -256 34 -240 V -228', METAL, 10, 4) + l('M-2 -236 V -200 M6 -251 Q 18 -253 26 -248', '#fff', 2.5);
    s += c(-17, -214, 9, AZ, 4) + c(17, -214, 9, CORAL, 4) + fe(-19, -216, 2.5, 2, '#fff', .9) + fe(15, -216, 2.5, 2, '#fff', .9);
    s += gota(34, -214, .7);
    // cuba
    const cuba = 'M-62 -204 L 62 -204 Q 60 -168 30 -163 L -30 -163 Q -60 -168 -62 -204 Z';
    s += p(cuba, LOUCA, 5) + f('M24 -200 L 58 -200 Q 54 -172 30 -166 L 14 -166 Q 40 -176 24 -200 Z', LOUCA_S) + brilho(-36, -186, 14, 5, -15, .9) + l(cuba, T, 5);
    s += e(0, -204, 62, 9, LOUCA, 5) + fe(0, -203, 52, 5, LOUCA_SS);
    return s;
  }

  /** copo com escovas de dente e a pasta */
  function copoEscovas() {
    let s = '';
    const escova = (x0, y0, x1, y1, cor) => {
      const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
      return tubo(`M${x0} ${y0} L ${x1} ${y1}`, cor, 6, 3.5) +
        em(x1, y1, 1, r(-2, -8, 10, 16, '#fff', 3, 3) + fr(1, -6, 2, 12, '#9FE3FF') + fr(5, -6, 2, 12, '#9FE3FF'), ang + 90);
    };
    s += escova(-6, -20, -20, -78, CORAL) + escova(6, -20, 22, -80, VERDE);
    // pasta de dente (tubo branco listrado de azul)
    s += em(2, -30, 1, r(-9, -44, 18, 44, LOUCA, 5, 3.5) + fr(-7, -32, 14, 8, AZ) + fr(-7, -20, 14, 4, CORAL) + r(-6, -54, 12, 12, AZ, 3, 3), -6);
    // copo
    const copo = 'M-20 -44 L 20 -44 L 16 -4 Q 15 0 11 0 L -11 0 Q -15 0 -16 -4 Z';
    s += p(copo, AMAR2, 4.5) + f('M8 -40 L 17 -40 L 13 -5 L 6 -5 Z', tom(AMAR2, -.16)) + brilho(-10, -28, 3, 10, 6, .7);
    s += fe(-2, -22, 4, 4, '#fff', .85) + fe(6, -16, 2.5, 2.5, '#fff', .85);
    return s;
  }

  /** sabonete na saboneteira, com bolinhas de espuma */
  function sabonete() {
    let s = '';
    s += p('M-30 -12 Q -32 0 -20 0 L 20 0 Q 32 0 30 -12 Z', AGUA, 4) + f('M10 -9 L 26 -9 Q 26 -3 18 -3 L 10 -3 Z', tom(AGUA, -.18));
    s += r(-20, -32, 40, 22, ROSA, 9, 4) + fr(4, -27, 13, 14, tom(ROSA, -.15), 5) + brilho(-8, -26, 8, 3, -5, .7);
    s += bolha(-12, -40, 7) + bolha(4, -44, 5) + bolha(14, -38, 6);
    return s;
  }

  /** vaso sanitário com a tampa fechada (aberta = a tampa levantada, encostada na caixa, e a água aparecendo) */
  function vaso(aberta = false) {
    let s = sombra(0, 2, 74, 11);
    // caixa acoplada
    s += r(-56, -216, 112, 108, LOUCA, 20, 6) + fr(28, -206, 22, 94, LOUCA_S, 8) + brilho(-32, -186, 8, 20, 0, .9);
    // florzinha na caixa
    for (let k = 0; k < 5; k++) { const a = k * 72 * Math.PI / 180; s += fe(-6 + Math.cos(a) * 8, -160 + Math.sin(a) * 8, 6, 6, ROSA); }
    s += fe(-6, -160, 5, 5, AMAR);
    s += r(-64, -228, 128, 22, LOUCA, 11, 6) + fr(-58, -212, 116, 5, LOUCA_S, 2) + brilho(-24, -222, 22, 3, 0, .9);
    s += r(-14, -240, 28, 14, ROXO, 6, 4) + brilho(-6, -236, 5, 2, 0, .7);
    // bacia
    const corpo = 'M-72 -112 Q -74 -58 -38 -42 L -32 -8 Q -32 0 -24 0 L 24 0 Q 32 0 32 -8 L 38 -42 Q 74 -58 72 -112 Z';
    s += p(corpo, LOUCA, 6) + f('M22 -106 Q 66 -102 62 -72 Q 56 -52 34 -42 L 28 -4 L 16 -4 L 22 -46 Q 46 -60 40 -104 Z', LOUCA_S) +
      f('M-30 -40 L 30 -40 L 32 -30 L -32 -30 Z', LOUCA_S, .7) + brilho(-42, -80, 9, 20, 12, .9) + l(corpo, T, 6);
    if (aberta) {
      // tampa em pé, na frente da caixa
      s += p('M-62 -112 Q -68 -200 0 -206 Q 68 -200 62 -112 Z', LILAS, 6) + f('M-46 -116 Q -50 -186 0 -190 Q 50 -186 46 -116 Z', tom(LILAS, -.1)) +
        brilho(-34, -168, 8, 20, 10, .6);
      // assento com a água no meio
      s += e(0, -112, 78, 16, LOUCA, 6) + e(0, -111, 56, 9, '#9FE3F0', 4) + fe(-18, -113, 16, 3, '#fff', .8);
      return s;
    }
    // assento e tampa
    s += e(0, -110, 78, 14, LOUCA, 6) + e(0, -122, 72, 14, LILAS, 6);
    s += fe(16, -118, 48, 7, tom(LILAS, -.12)) + fe(0, -124, 60, 8, LILAS) + brilho(-30, -126, 18, 3.5, 0, .8);
    return s;
  }

  /** rolo de papel higiênico no suporte (0,0 = o meio do rolo; mais = quanto a folha desceu além do normal) */
  function papel(mais = 0) {
    let s = '';
    s += r(-48, -14, 12, 28, METAL, 5, 4) + tubo('M-38 0 H 32', METAL, 6, 3);
    s += r(-30, -26, 58, 52, LOUCA, 16, 5) + fr(6, -20, 16, 40, LOUCA_S, 6);
    s += e(28, 0, 10, 26, LOUCA, 5) + e(28, 0, 4.5, 10, MAD1, 3);
    // folha pendurada com picotes
    const b = 58 + mais, b2 = 64 + mais;
    s += p(`M-28 4 L 20 4 L 20 ${b} L 12 ${b2} L 4 ${b} L -4 ${b2} L -12 ${b} L -20 ${b2} L -28 ${b} Z`, LOUCA, 4);
    s += fr(8, 8, 10, 48 + mais, LOUCA_S, 3);
    for (let y = 32; y < b - 12; y += 52) for (let i = 0; i < 6; i++) s += fe(-22 + i * 8, y, 1.6, 1.6, LOUCA_SS);
    s += brilho(-14, -14, 10, 3, 0, .9);
    return s;
  }

  /** cabide de madeira com três toalhas (0,0 = o meio da tábua; balancando = as toalhas balançam no gancho) */
  function toalhas(balancando = false) {
    let s = f('M-98 -8 H 110 V 24 H -98 Z', tom(PAREDE, -.12), 1);
    s += r(-104, -16, 208, 28, MAD1, 12, 6) + fr(-96, 2, 192, 6, tom(MAD1, -.15), 3) + brilho(-70, -8, 26, 3, 0, .5);
    s += l('M-80 -6 q 20 -3 40 0 M24 -8 q 24 -3 44 0', tom(MAD1, -.15), 2.5);
    const toalha = (x, w, h, cor, faixa) => {
      const a = x - w / 2, b = x + w / 2;
      const d = `M${x - 16} 4 Q ${x} -6 ${x + 16} 4 Q ${b} 28 ${b} 60 L ${b + 2} ${h - 8} Q ${b} ${h} ${b - 8} ${h} L ${a + 8} ${h} Q ${a} ${h} ${a - 2} ${h - 8} L ${a} 60 Q ${a} 28 ${x - 16} 4 Z`;
      let t = p(d, cor, 5);
      t += fr(a, h - 40, w, 9, faixa) + fr(a, h - 26, w, 5, faixa);
      t += f(`M${x + 10} 10 Q ${b - 4} 36 ${b - 2} 64 L ${b - 1} ${h - 6} L ${b - 14} ${h - 6} L ${b - 14} 64 Q ${b - 16} 36 ${x + 8} 12 Z`, tom(cor, -.16));
      t += l(`M${x - 4} 10 Q ${x - 8} 40 ${x - 12} ${h - 50}`, tom(cor, -.2), 3);
      t += brilho(a + 12, 50, 4, 18, 0, .5);
      t += l(d, T, 5);
      for (let xx = a + 6; xx <= b - 4; xx += 9) t += l(`M${n(xx)} ${h + 1} v 7`, T, 3);
      t += c(x, 0, 8, AMAR, 4);
      return balancando ? `<g class="casa-balanca" style="animation-duration:.55s;animation-delay:${n(-x / 200 - .3)}s">${t}</g>` : t;
    };
    s += toalha(-66, 62, 158, CORAL, '#fff') + toalha(66, 54, 104, VERDE, AMAR2) + toalha(0, 66, 136, AMAR2, AZ);
    return s;
  }

  /** tapetinho de banho fofinho (0,0 = o meio, no chão) */
  function tapete() {
    let s = '';
    for (let x = -112; x <= 112; x += 10) s += l(`M${x} 16 v 9`, T, 3);
    s += r(-124, -18, 248, 36, ROXO, 18, 5);
    s += fr(-116, 4, 232, 10, tom(ROXO, -.15), 6);
    s += r(-104, -11, 208, 20, LILAS, 10, 3);
    for (let i = 0; i < 8; i++) s += fe(-84 + i * 24, -1, 5, 3.5, i % 2 ? ROSA : '#fff', .95);
    s += brilho(-60, -12, 30, 3, 0, .6);
    return s;
  }

  /** plantinha num vasinho de barro (0,0 = o fundo do vaso; balancando = as folhas balançam) */
  function planta(balancando = false) {
    let s = '';
    const folha = (ang, comp, cor) => em(0, -46, 1, p(`M0 0 Q -14 ${-comp * .5} 0 ${-comp} Q 14 ${-comp * .5} 0 0 Z`, cor, 4) + l(`M0 -4 L 0 ${-comp + 8}`, tom(cor, -.25), 2.5), ang);
    s += folha(-62, 46, tom(VERDE, .15)) + folha(62, 44, tom(VERDE, .15)) + folha(-32, 62, VERDE) + folha(32, 60, VERDE) + folha(0, 74, tom(VERDE, -.08));
    // florzinha
    for (let k = 0; k < 5; k++) { const a = (k * 72 - 90) * Math.PI / 180; s += c(24 + Math.cos(a) * 8, -96 + Math.sin(a) * 8, 7, ROSA, 3); }
    s += c(24, -96, 5.5, AMAR2, 3);
    if (balancando) s = `<g class="casa-balanca" style="transform-origin:50% 100%;animation-duration:.5s">${s}</g>`;
    // vaso
    s += p('M-24 -42 L 24 -42 L 19 -2 Q 18 0 15 0 L -15 0 Q -18 0 -19 -2 Z', CORAL, 5) + f('M8 -40 L 22 -40 L 17 -3 L 6 -3 Z', tom(CORAL, -.16));
    s += r(-29, -54, 58, 14, CORAL, 6, 5) + fr(10, -50, 16, 6, tom(CORAL, -.16), 3) + brilho(-12, -48, 8, 2.5, 0, .7);
    return s;
  }

  /** prateleirinha de canto com xampu e condicionador (0,0 = o meio da tábua, em cima; balancando = o xampu balança) */
  function prateleira(balancando = false) {
    let s = fr(-50, 6, 108, 14, tom(AZULEJO, -.12), 6);
    // frascos
    const xampu = p('M-40 0 L -40 -46 Q -40 -56 -30 -56 L -14 -56 Q -4 -56 -4 -46 L -4 0 Z', AGUA, 4) + fr(-14, -50, 7, 46, tom(AGUA, -.16), 3) +
      r(-36, -38, 28, 20, '#fff', 5, 3) + fe(-22, -28, 6, 5, CORAL) + r(-30, -70, 16, 15, ROXO, 4, 3.5) + brilho(-34, -44, 2.5, 7, 0, .7);
    s += balancando ? `<g class="casa-balanca" style="transform-origin:50% 100%;animation-duration:.3s">${xampu}</g>` : xampu;
    s += p('M4 0 L 4 -34 Q 4 -42 12 -42 L 28 -42 Q 36 -42 36 -34 L 36 0 Z', CORAL, 4) + fr(26, -38, 7, 34, tom(CORAL, -.16), 3) +
      fe(20, -20, 8, 8, '#fff', .9) + fe(20, -20, 4, 4, AMAR2) + r(12, -54, 16, 13, AMAR2, 4, 3.5) + brilho(10, -30, 2.5, 6, 0, .7);
    // tábua com mãos-francesas
    s += p('M-38 12 L -38 34 Q -38 38 -34 34 L -16 14 Z', LOUCA, 3.5) + p('M38 12 L 38 34 Q 38 38 34 34 L 16 14 Z', LOUCA, 3.5);
    s += r(-56, 0, 112, 14, LOUCA, 6, 5) + fr(-50, 8, 100, 4, LOUCA_S, 2);
    return s;
  }

  /** luminária pendurada no teto (0,0 = o ponto no teto; acesa = false: a lâmpada apagada) */
  function luminaria(acesa = true) {
    let s = r(-16, 0, 32, 10, CREME, 4, 4);
    s += l('M0 10 V 70', T, 4);
    s += c(0, 108, 16, acesa ? '#FFF6C8' : '#DCD8E8', 4) + brilho(-5, 104, 5, 4, 0, .9);
    const cupula = 'M-46 104 Q -46 66 0 64 Q 46 66 46 104 Q 46 110 40 110 L -40 110 Q -46 110 -46 104 Z';
    s += p(cupula, AGUA, 5) + f('M18 70 Q 42 78 42 104 L 26 106 Q 28 84 18 70 Z', tom(AGUA, -.16)) + brilho(-22, 82, 12, 5, -25, .6);
    s += c(0, 64, 7, AMAR2, 4);
    for (let k = 0; k < 5; k++) s += fe(-32 + k * 16, 98, 3, 3, '#fff', .8);
    return s;
  }

  // ================================================================ PAREDE (coisas fixas)
  /** espelho redondo com moldura amarela (0,0 = centro) */
  function espelho(R = 74) {
    let s = fe(8, 10, R + 14, R + 14, tom(PAREDE, -.12));
    s += c(0, -R - 18, 9, AMAR, 4);
    s += c(0, 0, R + 14, AMAR, 6);
    for (let k = 0; k < 16; k++) { const a = k * 22.5 * Math.PI / 180; s += fe(Math.cos(a) * (R + 7), Math.sin(a) * (R + 7), 3, 3, '#fff', .55); }
    s += f(`M${n((R + 12) * .7)} ${n(-(R + 12) * .7)} A ${R + 12} ${R + 12} 0 0 1 ${n(-(R + 12) * .7)} ${n((R + 12) * .7)} A ${n(R * 1.3)} ${n(R * 1.3)} 0 0 0 ${n((R + 12) * .7)} ${n(-(R + 12) * .7)} Z`, tom(AMAR, -.15));
    s += c(0, 0, R, '#CDEFFF', 5);
    s += f(`M${n(R * .66)} ${n(-R * .66)} A ${R - 3} ${R - 3} 0 0 1 ${n(-R * .66)} ${n(R * .66)} A ${n(R * 1.25)} ${n(R * 1.25)} 0 0 0 ${n(R * .66)} ${n(-R * .66)} Z`, '#AEDDF5');
    s += brilho(-18, -18, R * .5, 9, -45, .75) + brilho(18, 4, R * .3, 5, -45, .6) + brilho(-40, 26, 6, 3, -45, .6);
    return s;
  }

  /** janela basculante com as lâminas abertas (0,0 = centro do vidro) */
  function janela() {
    let s = fr(-88, -70, 190, 168, tom(PAREDE, -.12), 16);
    s += r(-96, -82, 192, 164, CREME, 16, 6);
    s += r(-78, -64, 156, 128, '#BFE8FF', 8, 4);
    // céu com nuvenzinha e sol lá fora
    s += c(48, -38, 16, AMAR2, 0) + f('M-60 -20 q -6 -18 12 -18 q 6 -14 22 -4 q 16 -4 14 12 q 8 8 -6 10 h -36 q -12 0 -6 0 Z', '#fff');
    // três lâminas basculantes (abertas, vistas de frente)
    for (let i = 0; i < 3; i++) {
      const y = -60 + i * 42;
      s += fr(-74, y + 26, 148, 12, tom(CREME, -.12), 2);
      s += r(-76, y, 152, 28, '#E8F7FF', 5, 4);
      s += f(`M${-60 + i * 8} ${y + 24} L ${-48 + i * 8} ${y + 4} L ${-38 + i * 8} ${y + 4} L ${-50 + i * 8} ${y + 24} Z`, '#fff', .9);
      s += f(`M${-32 + i * 8} ${y + 24} L ${-24 + i * 8} ${y + 4} L ${-19 + i * 8} ${y + 4} L ${-27 + i * 8} ${y + 24} Z`, '#fff', .9);
    }
    // alavanca
    s += l('M86 -50 V 40', T, 9) + l('M86 -50 V 40', ROXO, 4) + c(86, 44, 7, ROXO, 4);
    // peitoril
    s += r(-112, 80, 224, 20, CREME, 8, 6) + fr(-104, 92, 208, 5, tom(CREME, -.14), 2);
    s += brilho(-70, -74, 30, 3, 0, .8);
    return s;
  }

  // ================================================================ LUZ (interruptor, janela fechada e lustre)
  const INTERRUPTOR = { x: 4592, y: 640 };
  /** interruptor de parede (igual ao do quarto); (x, y) = centro */
  function interruptor(x, y) {
    return fr(x - 16, y - 22, 40, 56, tom(PAREDE, -.12), 8) + r(x - 20, y - 28, 40, 56, '#FFFFFF', 8, 4) + r(x - 8, y - 14, 16, 28, '#F3ECF9', 5, 3) +
      fr(x - 5, y - 11, 10, 11, '#fff') + l(`M${x - 5} ${y + 1} H ${x + 5}`, '#C9BEDD', 2);
  }
  /** A janelinha fechada: uma persiana de lâminas água baixada sobre o vidro todo (cobre as lâminas basculantes
      abertas); bandô em cima, barra embaixo e a cordinha com a conta roxa. j = o vidro. */
  function persianaFechada(j) {
    const x0 = j.x - 4, x1 = j.x + j.w + 4, y0 = j.y - 4, y1 = j.y + j.h + 4, W = x1 - x0, LAM = tom(AGUA, .62), LAM_S = tom(AGUA, .3);
    let s = r(x0, y0, W, y1 - y0, LAM, 6, 4);
    // as lâminas: as sombrinhas entre elas num caminho só e os brilhos noutro
    let so = '', lu = '';
    for (let y = y0 + 30; y < y1 - 12; y += 16) { so += `M${x0 + 3} ${y} H ${x1 - 3} V ${y + 4} H ${x0 + 3} Z `; lu += `M${x0 + 8} ${y + 7} H ${x1 - 30} `; }
    s += f(so, LAM_S) + l(lu, '#fff', 2.5).replace('/>', ' opacity=".55"/>');
    // as fitinhas da escada da persiana
    s += l(`M${x0 + 30} ${y0 + 22} V ${y1 - 12} M${x1 - 30} ${y0 + 22} V ${y1 - 12}`, tom(AGUA, .1), 3);
    // bandô (a caixinha do rolo) e a barra de baixo
    s += r(x0 - 8, y0 - 6, W + 16, 26, CREME, 8, 5) + fr(x0, y0 + 10, W, 4, tom(CREME, -.12), 2);
    s += r(x0 + 2, y1 - 12, W - 4, 12, tom(AGUA, .2), 5, 4);
    // cordinha com a conta
    s += l(`M${x0 + 14} ${y0 + 18} V ${y1 + 26}`, T, 2.5) + c(x0 + 14, y1 + 32, 7, ROXO, 3.5) + brilho(x0 + 12, y1 + 30, 2, 2.5, 0, .7);
    return s + brilho(x0 + 50, y0 + 40, 20, 3, 0, .5);
  }
  /** Lustre do banheiro: um globo de vidro redondo como uma bolha de sabão, com uma onda água no meio. (0,0) = o teto. */
  function lustreBolha(aceso) {
    const VIDRO = aceso ? '#FFF6C8' : '#E1EAF2', VIDRO_S = aceso ? '#FFE48A' : '#C9D6E4', LAMP = aceso ? '#FFFDF0' : '#D3DDEE';
    // canopla e haste de metal
    let s = r(-28, 0, 56, 12, CREME, 6, 4) + tubo('M0 12 V 64', METAL, 5, 3) + c(0, 38, 6, METAL, 3);
    // o globo
    s += c(0, 134, 58, VIDRO, 6);
    s += f('M40 92 Q 62 114 56 150 Q 46 182 12 190 Q 46 168 50 136 Q 52 110 40 92 Z', VIDRO_S, .9);
    s += c(0, 124, 18, LAMP, 4) + brilho(-5, 119, 5, 7, 20, .8);
    // a onda que dá a volta no globo (um caminho com contorno)
    s += l('M-56 150 q 14 -12 28 0 t 28 0 t 28 0 t 28 0', T, 11) + l('M-56 150 q 14 -12 28 0 t 28 0 t 28 0 t 28 0', AGUA, 5);
    // bolinhas de sabão no vidro e o reflexo grande
    let bo = '';
    for (const [x, y, rr] of [[-30, 100, 7], [-40, 122, 4.5], [26, 108, 5], [-14, 174, 5], [22, 172, 3.5]]) bo += `M${n(x - rr)} ${y} a${rr} ${rr} 0 1 0 ${n(rr * 2)} 0 a${rr} ${rr} 0 1 0 ${n(-rr * 2)} 0 `;
    s += l(bo, '#fff', 3).replace('/>', ' opacity=".85"/>');
    s += l('M-42 112 A 46 46 0 0 1 -16 88', '#fff', 7).replace('/>', ' opacity=".7"/>');
    // tampa de metal em cima e a gotinha embaixo
    s += p('M-24 80 Q -22 62 0 60 Q 22 62 24 80 Q 0 86 -24 80 Z', METAL, 5) + fr(-14, 66, 10, 5, '#fff', 2, .7);
    s += gota(0, 202, .9, AGUA);
    return s;
  }

  // ================================================================ AÇÕES (modo brincar)
  // "mexendo": estados que estão num movimento curto (toalhas balançando, papel desenrolado). Fica só na memória,
  // nunca é guardado com a casa: se o jogo fechar no meio, a coisa volta parada.
  const mexendo = new WeakMap();
  /** mexe por ms e depois volta (tocar de novo no meio recomeça a contagem) */
  function mexerUmPouco(ctx, ms, fim) {
    const vez = (mexendo.get(ctx.estado) || 0) + 1;
    mexendo.set(ctx.estado, vez);
    ctx.mudou();
    ctx.depois(ms, () => { if (mexendo.get(ctx.estado) === vez) { mexendo.delete(ctx.estado); ctx.mudou(); if (fim) fim(); } });
  }
  /** bolha de sabão que sobe sem parar (para os "sobre"), começando com atraso d (s) */
  const bolhaSobe = (x, y, rr, d) => `<g class="casa-sobe" style="animation-delay:${d}s">${bolha(x, y, rr)}</g>`;
  /** redemoinho da descarga, achatado (em volta de (0,0)) */
  const espiral = (() => {
    let d = '';
    for (let k = 0; k <= 36; k++) { const a = k * Math.PI / 6, rr = 4 + k * 1.4; d += `${k ? ' L' : 'M'}${n(Math.cos(a) * rr)} ${n(Math.sin(a) * rr)}`; }
    return `<g class="casa-gira" style="animation-duration:.6s"><circle r="56" fill="#9FE3F0"/>${l(d, '#fff', 7)}${l(d, AZ, 3)}</g>`;
  })();

  const acoes = {
    // banheira: a torneira abre, a água cai, a espuma cresce e as bolhas sobem (toca de novo: fecha)
    banheira: {
      sobre: e => (e.ligado
        ? fr(-95, -200, 10, 22, '#8FD0FF', 4, .9) + `<g class="casa-pisca">${gota(-90, -188, .6)}</g>` +
          `<g class="casa-gira-lento">${c(-124, -176, 10, CORAL, 4)}${l('M-131 -176 H -117', '#fff', 3)}</g>` +
          `<g class="casa-pulsa" style="animation-duration:1.6s">${espuma([[-60, -200, 22], [-22, -210, 26], [20, -206, 24], [60, -198, 20], [-40, -224, 16], [6, -232, 18]])}</g>` +
          bolhaSobe(-50, -250, 12, 0) + bolhaSobe(10, -270, 9, .7) + bolhaSobe(70, -246, 13, 1.4) + bolhaSobe(-10, -300, 8, 1.1) + bolhaSobe(110, -280, 10, .35)
        : ''),
      tocar(ctx) {
        const e = ctx.estado;
        e.ligado = !e.ligado;
        ctx.som(e.ligado ? 'bolha' : 'soltar');
        ctx.mudou();
        if (e.ligado) ctx.particulas('bolha', 0, -240, 5, { dy: -120, espalha: 90 });
      },
    },
    // cortina: abre e fecha (e balança)
    cortina: {
      desenho: e => cortina(!!e.fechada),
      tocar(ctx) {
        ctx.estado.fechada = !ctx.estado.fechada;
        ctx.som('pagina');
        ctx.mudou();
        ctx.balancar();
      },
    },
    // pia: a torneira abre e a água escorre (toca de novo: fecha)
    piaBanheiro: {
      sobre: e => (e.ligado
        ? `<g class="casa-gira-lento">${c(-17, -214, 9, AZ, 4)}${l('M-23 -214 H -11', '#fff', 3)}</g>` +
          r(27, -232, 14, 30, '#8FD0FF', 7, 3) + `<g class="casa-brilha">${l('M32 -226 V -202', '#fff', 3)}</g>` + fe(30, -203, 22, 3.5, '#8FD0FF') +
          `<g class="casa-pisca">${gota(22, -190, .5)}</g><g class="casa-pisca2">${gota(46, -192, .5)}</g>` +
          `<g class="casa-sobe">${bolha(-20, -212, 6)}</g><g class="casa-sobe" style="animation-delay:1.1s">${bolha(10, -214, 5)}</g>`
        : ''),
      tocar(ctx) {
        const e = ctx.estado;
        e.ligado = !e.ligado;
        ctx.som(e.ligado ? 'bolha' : 'soltar');
        ctx.mudou();
        if (e.ligado) ctx.particulas('gota', 34, -200, 3, { dy: -60, espalha: 40 });
      },
    },
    // vaso: o 1º toque levanta a tampa; o 2º dá a descarga (a água gira) e a tampa fecha sozinha
    vaso: {
      desenho: e => vaso(!!e.aberta),
      tocar(ctx) {
        const e = ctx.estado;
        if (!e.aberta) { e.aberta = true; ctx.som('clique'); ctx.mudou(); return; }
        if (mexendo.has(e)) return;          // já está dando a descarga
        mexendo.set(e, 1);
        ctx.som('bolha');
        ctx.mostrar(`<g transform="translate(0 -111) scale(1 .17)">${espiral}</g>`, 1500);
        ctx.particulas('gota', 0, -120, 4, { dy: -110, espalha: 60 });
        ctx.depois(600, () => ctx.som('bolha'));
        ctx.depois(1500, () => { mexendo.delete(e); e.aberta = false; ctx.som('encaixar'); ctx.mudou(); });
      },
    },
    // espelho: brilha
    espelho: {
      tocar(ctx) {
        ctx.som('figurinha');
        ctx.mostrar(`<g class="casa-brilha" style="animation-duration:.7s"><circle r="74" fill="#fff" opacity=".45"/></g>` +
          [[-30, -28, 1.2], [26, -40, .8], [36, 22, 1], [-20, 34, .7]].map(([x, y, k], i) =>
            `<path class="${i % 2 ? 'casa-pisca' : 'casa-pisca2'}" transform="translate(${x} ${y}) scale(${k})" d="M0 -16 Q 3 -3 16 0 Q 3 3 0 16 Q -3 3 -16 0 Q -3 -3 0 -16 Z" fill="#fff" stroke="${T}" stroke-width="3"/>`).join(''), 1300);
        ctx.particulas('estrela', 0, -60, 3, { dy: -100, espalha: 70 });
      },
    },
    // toalhas: balançam no gancho
    toalhas: {
      desenho: e => toalhas(mexendo.has(e)),
      tocar(ctx) { ctx.som('pegar'); mexerUmPouco(ctx, 1500); ctx.particulas('vento', 0, 80, 2, { dx: 120, dy: 0, espalha: 30 }); },
    },
    // papel: desenrola um pouco e enrola de volta
    papel: {
      desenho: e => papel(mexendo.has(e) ? 80 : 0),
      tocar(ctx) { ctx.som('pagina'); mexerUmPouco(ctx, 1200, () => ctx.som('encaixar')); },
    },
    // patinho: grasna e pula
    pato: {
      tocar(ctx) { ctx.som('piu'); ctx.pular(); ctx.particulas('bolha', 0, -50, 3, { dy: -90, espalha: 50 }); },
    },
    // copo com escovas: as escovas "escovam" e sai espuminha
    copoEscovas: {
      tocar(ctx) {
        ctx.som('bolha'); ctx.tremer();
        ctx.mostrar(`<g class="casa-treme">${espuma([[-22, -86, 9], [-14, -80, 8], [22, -90, 9], [30, -82, 7]])}</g>` +
          `<g class="casa-sobe">${bolha(-18, -100, 6)}</g><g class="casa-sobe" style="animation-delay:.4s">${bolha(26, -104, 5)}</g>`, 1500);
        ctx.particulas('bolha', 0, -90, 3, { dy: -80, espalha: 50 });
      },
    },
    // sabonete: solta bolhas
    sabonete: {
      tocar(ctx) {
        ctx.som('bolha'); ctx.tremer();
        ctx.mostrar(`<g class="casa-pulsa" style="animation-duration:.5s">${bolha(-12, -40, 9)}${bolha(4, -46, 7)}${bolha(14, -38, 8)}</g>`, 1000);
        ctx.particulas('bolha', 0, -40, 6, { dy: -130, espalha: 70, seguidas: 90 });
      },
    },
    // tapetinho: fofinho
    tapeteBanheiro: {
      tocar(ctx) { ctx.som('pulo'); ctx.tremer(); ctx.particulas('coracao', 0, -20, 3, { dy: -90, espalha: 80 }); },
    },
    // plantinha: balança
    plantaBanheiro: {
      desenho: e => planta(mexendo.has(e)),
      tocar(ctx) { ctx.som('pegar'); mexerUmPouco(ctx, 1300); ctx.particulas('folha', 0, -80, 2, { dy: -60, espalha: 60, cai: true }); },
    },
    // prateleira: o xampu balança
    prateleiraBanheiro: {
      desenho: e => prateleira(mexendo.has(e)),
      tocar(ctx) { ctx.som('clique'); mexerUmPouco(ctx, 900); ctx.particulas('bolha', -22, -70, 2, { dy: -70, espalha: 30 }); },
    },
    // luminária do teto: acende e apaga (é de teto: não precisa de tomada)
    luminariaTeto: {
      desenho: e => luminaria(!!e.ligado),
      sobre: e => (e.ligado
        ? `<path d="M-40 110 L -150 400 Q 0 430 150 400 L 40 110 Z" fill="#FFE9A3" opacity=".3"/>` +
          `<g class="casa-brilha"><ellipse cx="0" cy="112" rx="110" ry="80" fill="#FFF1A8" opacity=".35"/><ellipse cx="0" cy="116" rx="46" ry="34" fill="#FFF6C8" opacity=".6"/></g>`
        : ''),
      tocar(ctx) { ctx.estado.ligado = !ctx.estado.ligado; ctx.som('clique'); ctx.mudou(); },
    },
  };

  // ================================================================ montagem
  CASA.partes.banheiro = {
    acoes,
    fundo(L) {
      // o fundo passa um pouco da parede da direita (que fica em x1 + 18) para não sobrar fresta
      const { x0, topo, piso } = L, x1 = L.x1 + 24, W = x1 - x0;
      const az = piso - 300;            // altura do azulejo (meia parede)
      let s = fr(x0, topo, W, piso + 40 - topo, PAREDE);
      // parede de cima: bolhinhas de estampa
      for (let i = 0, y = topo + 50; y < az - 40; y += 64, i++)
        for (let x = x0 + 30 + (i % 2) * 40; x < x1; x += 80)
          s += `<circle cx="${n(x)}" cy="${n(y)}" r="${(x + y) % 3 ? 9 : 6}" fill="none" stroke="${PAREDE_PONTO}" stroke-width="3"/>`;
      // sanca
      s += fr(x0, topo, W, 16, tom(PAREDE, -.06)) + l(`M${x0} ${topo + 16} H ${x1}`, tom(PAREDE, -.14), 3);
      // azulejos
      const lado = 50;
      s += fr(x0, az, W, piso - 40 - az, AZULEJO);
      for (let y = az; y < piso - 40; y += lado)
        for (let x = x0; x < x1; x += lado) {
          s += fr(x + 6, y + 6, 14, 5, '#fff', 2, .45);
          s += fr(x + lado - 10, y + 10, 5, lado - 18, tom(AZULEJO, -.05), 2);
        }
      for (let x = x0 + lado; x < x1; x += lado) s += l(`M${x} ${az} V ${piso - 40}`, REJUNTE, 3);
      for (let y = az + lado; y < piso - 40; y += lado) s += l(`M${x0} ${y} H ${x1}`, REJUNTE, 3);
      // faixa decorativa em cima do azulejo
      s += r(x0 - 6, az - 22, W + 12, 24, AGUA, 0, 5);
      for (let x = x0 + 25; x < x1; x += 50) s += f(`M${x} ${az - 18} L ${x + 8} ${az - 10} L ${x} ${az - 2} L ${x - 8} ${az - 10} Z`, AMAR2);
      for (let x = x0 + 50; x < x1; x += 50) s += fe(x, az - 10, 3, 3, '#fff', .9);
      // piso de ladrilho (xadrez, num pouquinho de perspectiva), cobrindo o cômodo inteiro
      const meio = (x0 + x1) / 2, y0 = piso - 40, ym = piso, y1 = piso + 40, k1 = 1.04, k2 = 1.08, lad = 66;
      const px = (x, k) => Math.max(x0, Math.min(x1, meio + (x - meio) * k));
      s += fr(x0, y0, W, 80, PISO_A);
      const meias = Math.ceil(W / 2 / lad) + 1;
      for (let col = -meias; col < meias; col++) {
        const a = meio + col * lad, b = a + lad, par = (col + 100) % 2;
        if (b <= x0 - lad || a >= x1 + lad) continue;
        const ca = Math.max(x0, Math.min(x1, a)), cb = Math.max(x0, Math.min(x1, b));
        s += f(`M${n(ca)} ${y0} L ${n(cb)} ${y0} L ${n(px(b, k1))} ${ym} L ${n(px(a, k1))} ${ym} Z`, par ? PISO_A : PISO_B);
        s += f(`M${n(px(a, k1))} ${ym} L ${n(px(b, k1))} ${ym} L ${n(px(b, k2))} ${y1} L ${n(px(a, k2))} ${y1} Z`, par ? PISO_B : PISO_A);
        if (a > x0 && a < x1) s += l(`M${n(a)} ${y0} L ${n(px(a, k2))} ${y1}`, PISO_REJ, 3);
        if (a + lad * .3 > x0 + 10 && a + lad * .3 < x1 - 10) s += fe(px(a + lad * .3, 1.02), y0 + 10, 8, 2.5, '#fff', .7);
      }
      s += l(`M${x0} ${ym} H ${x1}`, PISO_REJ, 3);
      // rodapé
      s += r(x0 - 6, piso - 56, W + 12, 18, tom(AGUA, .25), 0, 5);
      s += fr(x0, piso - 44, W, 4, tom(AGUA, -.05));
      // coisas presas na parede: espelho da pia, duas janelinhas basculantes, o chuveiro
      const P = posicoes(L);
      s += em(P.pia, piso - 350, 1, espelho(66));
      s += em(P.janela1, topo + 220, 1, janela());
      s += em(P.janela2, topo + 220, 1, janela());
      s += em(P.banheira + 4, piso - 404, 1, chuveiro(L.x1 - P.banheira - 14));
      // interruptor da luz, logo depois da passagem que vem do quarto (acima da faixa do azulejo)
      s += interruptor(INTERRUPTOR.x, INTERRUPTOR.y);
      return s;
    },
    objetos(L) {
      const { piso } = L, P = posicoes(L);
      let s = '';
      s += em(P.toalhas, piso - 410, 1, toalhas());
      s += em(P.pia, piso, 1, pia());
      s += em(P.banheira, piso, 1, banheira());
      s += em(P.banheira + 10, piso - 494, 1, cortina());
      return s;
    },
    luz: {
      // o vidro de cada janelinha basculante: janela() em (P.janela, topo + 220), vidro de -78..78 x -64..64
      janelas: [5802, 6382].map(x => ({ x: x - 78, y: CASA.L.banheiro.topo + 156, w: 156, h: 128 })),
      fechada: j => persianaFechada(j),
      interruptor: INTERRUPTOR,
      lustre: { x: 6092, y: CASA.L.banheiro.topo, lampada: [0, 128], desenho: aceso => lustreBolha(aceso) },
    },
    /** todas as funções de objeto (montadas ou não) — viram figurinhas */
    catalogo: { banheira, cortina, chuveiro, pia, espelho, janela, toalhas, vaso, papel, pato, copoEscovas, sabonete, tapete, planta, prateleira, luminaria },
  };
  /** onde ficam as coisas montadas (x do mundo); o chão do meio fica livre para a criança decorar */
  function posicoes(L) {
    return { pia: L.x0 + 460, toalhas: L.x0 + 800, janela1: L.x0 + 1280, janela2: L.x0 + 1860, banheira: L.x1 - 162 };
  }
  CASA.banheiro = { banheira, pato, cortina, chuveiro, pia, copoEscovas, sabonete, vaso, papel, toalhas, tapete, planta, espelho, janela, prateleira, luminaria };
})();
