/* Casa da Pipoca — COZINHA (térreo, à direita da sala). Esboço de proposta.
   Cada objeto é uma função desenhada em volta de (0,0) = meio do pé no chão (ou do ponto onde se apoia). */
(function () {
  const { T, r, c, e, p, l, f, fr, fe, brilho, sombra, tom, em, n } = CASA;

  // ---------------------------------------------------------------- paleta
  const CORAL = '#FF7A6B', AMA = '#FFC93C', AMA2 = '#FFD23F', AGUA = '#2EC4B6', ROXO = '#9B7BFF', VERDE = '#5CC84A',
    ROSA = '#FF8FC2', AZUL = '#4DA3FF', MAD1 = '#C98A55', MAD2 = '#A9703F', MAD3 = '#8A5A34', CREME = '#FFF4E6';
  const BRANCO = '#F4F8FE', BRANCO_S = '#C9D6EA', METAL = '#D3DCE7', METAL_S = '#A3B2C5', FERRO = '#4B4068',
    BARRO = '#D9774C', VIDRO = '#BFE8FF';

  // ---------------------------------------------------------------- ajudantes locais
  /** só o contorno de um retângulo (para fechar o volume por cima do sombreado) */
  const ro = (x, y, w, h, rx = 10, sw = 5) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${rx}" fill="none" stroke="${T}" stroke-width="${sw}"/>`;
  /** caixa com volume: base no tom escuro, face clara puxada para cima/esquerda, contorno por cima */
  const vol = (x, y, w, h, cor, rx = 10, sw = 5, kx, ky) => {
    kx = kx == null ? Math.min(w * .16, 20) : kx; ky = ky == null ? Math.min(h * .14, 12) : ky;
    return r(x, y, w, h, tom(cor, -.16), rx, 0) + fr(x, y, w - kx, h - ky, cor, rx) + ro(x, y, w, h, rx, sw);
  };
  /** letrinha desenhada por traço (com contorno) */
  const LETRAS = {
    A: 'M-12 15 L 0 -15 L 12 15 M-6.5 4 H 6.5',
    B: 'M-9 -15 V 15 M-9 -15 H 1 Q 10 -15 10 -7.5 Q 10 0 1 0 H -9 M1 0 Q 12 0 12 7.5 Q 12 15 1 15 H -9',
    C: 'M11 -9 Q 7 -15 0 -15 Q -12 -15 -12 0 Q -12 15 0 15 Q 7 15 11 9',
    D: 'M-10 -15 V 15 H -2 Q 12 15 12 0 Q 12 -15 -2 -15 Z',
    E: 'M10 -15 H -9 V 15 H 10 M-9 0 H 5',
  };
  /** uma pipoquinha (tufo creme) */
  const pipoca = (x, y, k = 1) => em(x, y, k,
    p('M-9 4 Q -14 -4 -7 -8 Q -5 -15 2 -12 Q 9 -15 11 -7 Q 16 0 9 6 Q 4 11 -2 8 Q -8 10 -9 4 Z', '#FFF8E8', 3) +
    fe(1, -1, 4, 3, AMA2) + fe(-4, -6, 3, 2, '#fff', .9));
  const vapor = (x, y, h, sw = 7) => {
    const d = `M${x} ${y} q -11 ${-h / 4} 0 ${-h / 2} q 11 ${-h / 4} 0 ${-h / 2}`;
    return l(d, '#CBC2EA', sw + 6) + l(d, '#FFFFFF', sw);
  };

  // ================================================================ OBJETOS
  /** geladeira retrô branca-azulada (os ímãs de letra são figurinhas à parte: imaLetra) */
  function geladeira() {
    const w = 144, h = 384, x = -w / 2, y = -h;
    let s = sombra(0, 2, 86, 11);
    s += r(-58, -14, 24, 16, FERRO, 5, 4) + r(34, -14, 24, 16, FERRO, 5, 4);            // pezinhos
    s += r(x, y, w, h - 10, BRANCO_S, 30, 0);
    s += fr(x, y, w - 24, h - 30, BRANCO, 28);                                        // face clara
    s += fr(x + w - 24, y + 30, 6, h - 90, '#DDE6F3', 3);                              // meio-tom na lateral
    s += ro(x, y, w, h - 10, 30, 6);
    // divisão freezer | geladeira (frestinha)
    s += l(`M${x + 3} -290 H ${x + w - 3}`, T, 6) + l(`M${x + 8} -284 H ${x + w - 8}`, '#DDE6F3', 3);
    // puxadores cromados
    s += vol(x + 10, -352, 14, 48, METAL, 7, 4, 4, 6) + vol(x + 10, -270, 14, 84, METAL, 7, 4, 4, 8);
    // grade de ventilação embaixo
    s += r(-40, -42, 80, 16, '#E3EAF4', 8, 4) + [-24, -8, 8, 24].map(v => l(`M${v} -38 V -30`, BRANCO_S, 4)).join('');
    // desenho de criança preso no freezer (sol e casinha), com um ímã de coração
    s += em(16, -334, 1, r(-26, -28, 52, 50, '#FFFFFF', 3, 3) + fr(-26, 14, 52, 8, '#EEF2F8') +
      c(-10, -12, 7, AMA, 3) + l('M-10 -24 v -3 M-21 -12 h -3 M1 -12 h 3 M-18 -20 l -2 -2 M-2 -20 l 2 -2', AMA, 3) +
      p('M4 10 V -2 L 13 -10 L 22 -2 V 10 Z', CORAL, 3) + l('M-22 12 Q 0 6 22 12', VERDE, 3), -4);
    s += p('M16 -364 Q 10 -372 6 -366 Q 2 -358 16 -350 Q 30 -358 26 -366 Q 22 -372 16 -364 Z', ROSA, 3);
    // brilhos
    s += brilho(x + 26, y + 60, 7, 34, 0, .9) + brilho(x + 26, -200, 6, 50, 0, .9) + brilho(x + 34, y + 18, 18, 5, 0, .8);
    return s;
  }

  /** ímã de letra para a geladeira (centro da letra em 0,0) */
  function imaLetra(letra, cor) {
    const d = LETRAS[letra];
    return l(d, T, 14) + l(d, cor, 8) + l(d, '#FFFFFF', 2).replace('stroke-width', 'opacity=".35" stroke-width') ;
  }

  /** bancada da pia: armário de madeira com portas verde-água, tampo de mármore, cuba de avental e torneira */
  function pia() {
    const w = 196, h = 184;
    let s = sombra(0, 2, 108, 11);
    // rodapé e corpo
    s += r(-w / 2 + 6, -16, w - 12, 16, MAD3, 4, 5);
    s += vol(-w / 2, -h + 14, w, h - 28, MAD1, 8, 6, 14, 10);
    // veio da madeira
    s += l(`M${-w / 2 + 8} -60 q 20 -6 40 0 M${w / 2 - 50} -120 q 18 -6 36 0`, MAD2, 3);
    // portas
    const porta = (x) => vol(x, -136, 80, 102, AGUA, 10, 5, 12, 10) + r(x + 12, -124, 50, 76, tom(AGUA, .18), 7, 3) + c(x + (x < 0 ? 66 : 14), -86, 7, AMA, 4) + brilho(x + 22, -116, 4, 14, 0, .5);
    s += porta(-88) + porta(8);
    // torneira (atrás do tampo)
    s += l('M0 -186 V -252 Q 0 -274 22 -274 Q 42 -274 42 -254 V -244', T, 15) + l('M0 -186 V -252 Q 0 -274 22 -274 Q 42 -274 42 -254 V -244', METAL, 8);
    s += brilho(-2, -228, 2, 12, 0, .9);
    s += r(-12, -196, 24, 14, METAL, 5, 4);
    s += em(-24, -198, 1, r(-6, -8, 12, 12, CORAL, 4, 3) + r(-9, -12, 18, 6, CORAL, 3, 3)) + em(24, -198, 1, r(-6, -8, 12, 12, AZUL, 4, 3) + r(-9, -12, 18, 6, AZUL, 3, 3));
    s += p('M42 -236 Q 47 -228 42 -224 Q 37 -228 42 -236 Z', '#9FD8FF', 3);   // pingo
    // cuba de avental (frente de inox no meio)
    s += vol(-44, -h + 10, 88, 44, METAL, 8, 6, 12, 8) + l('M-32 -146 H 32', METAL_S, 3) + brilho(-30, -158, 3, 8, 0, .8);
    // tampo de mármore
    s += vol(-w / 2 - 8, -h, w + 16, 22, '#F3EEE8', 9, 6, 0, 6);
    s += [[-80, -176], [-52, -172], [-20, -177], [30, -173], [64, -176], [90, -171]].map(([a, b]) => fe(a, b, 3, 1.6, '#C9BBD9')).join('');
    return s;
  }

  /** escorredor de louça com dois pratos e um copo */
  function escorredor() {
    let s = sombra(0, 0, 32, 5);
    s += r(-13, -54, 16, 40, '#BFE8FF', 5, 4) + fr(-11, -30, 12, 14, '#8FCFF5', 3);                  // copo
    s += c(-4, -40, 22, '#FFFFFF', 5) + fe(-4, -40, 13, 13, '#FFE0D9') + c(-4, -40, 13, 'none', 3).replace(`stroke="${T}"`, 'stroke="#FFB3A8"');
    s += c(12, -34, 20, '#FFFFFF', 5) + fe(12, -34, 11, 11, '#D5F4EF');
    s += vol(-28, -24, 56, 22, '#7FD9CF', 7, 5, 8, 5);
    s += [-16, -6, 4, 14].map(v => l(`M${v} -20 V -7`, '#FFFFFF', 3)).join('');
    s += r(-24, -4, 8, 6, FERRO, 2, 3) + r(16, -4, 8, 6, FERRO, 2, 3);
    return s;
  }

  /** liquidificador com suco de manga */
  function liquidificador() {
    let s = sombra(0, 0, 28, 5);
    s += vol(-22, -30, 44, 30, CORAL, 9, 5, 6, 5);
    s += c(-9, -15, 4.5, '#FFFFFF', 3) + c(4, -15, 4.5, AMA, 3) + r(11, -18, 6, 6, '#FFFFFF', 2, 3);
    const jarra = 'M-17 -30 L -21 -94 H 21 L 17 -30 Z';
    s += f(jarra, '#E6F6FF') + f('M-17.6 -36 L -19.8 -66 Q 0 -60 19.8 -66 L 17.6 -36 Z', AMA2) + fe(0, -66, 20, 3, '#FFE27A');
    s += fr(-13, -90, 5, 50, '#FFFFFF', 3, .9) + l(jarra, T, 5);
    s += l('M21 -84 Q 34 -80 32 -62 Q 30 -48 19 -46', T, 5);                    // alça
    s += vol(-25, -104, 50, 12, CORAL, 6, 5, 5, 3) + c(0, -108, 5, CORAL, 4);
    return s;
  }

  /** fogão branco de 4 bocas com forno */
  function fogao() {
    const w = 172;
    let s = sombra(0, 2, 96, 11);
    s += r(-70, -12, 18, 12, FERRO, 4, 4) + r(52, -12, 18, 12, FERRO, 4, 4);
    s += r(-w / 2, -170, w, 160, BRANCO_S, 16, 0) + fr(-w / 2, -170, w - 18, 150, BRANCO, 16) + ro(-w / 2, -170, w, 160, 16, 6);
    // grades e bocas (vistas de lado)
    s += r(-w / 2 + 2, -180, w - 4, 12, FERRO, 5, 5);
    s += [-60, -22, 22, 60].map(v => e(v, -184, 14, 4, '#6A5E8A', 3)).join('');
    // painel de botões
    s += r(-78, -160, 156, 28, '#E4EBF5', 9, 4);
    s += [[-54, CORAL], [-20, AMA], [20, AGUA], [54, ROXO]].map(([v, cor]) => c(v, -146, 10, cor, 4) + l(`M${v} -153 V -146`, T, 3)).join('');
    // forno
    s += vol(-72, -124, 144, 104, BRANCO, 12, 5, 0, 8);
    s += vol(-62, -122, 124, 12, METAL, 6, 4, 6, 4);                                      // puxador
    s += r(-52, -100, 104, 60, '#4A3D6B', 10, 5) + fr(-46, -60, 92, 14, '#FFB15E', 4, .55);   // vidro com luz quente
    s += f('M-40 -94 L -24 -94 L -48 -50 L -48 -66 Z', '#FFFFFF', .28) + f('M-12 -94 L -4 -94 L -30 -46 L -38 -46 Z', '#FFFFFF', .2);
    s += brilho(-60, -158, 10, 3, 0, .9);
    return s;
  }

  /** panela coral com tampa e vapor */
  function panela() {
    let s = '';
    s += vapor(-14, -78, 64) + vapor(8, -84, 88, 8) + vapor(28, -76, 56, 6);
    s += r(-48, -42, 18, 12, FERRO, 6, 4) + r(30, -42, 18, 12, FERRO, 6, 4);
    s += vol(-36, -48, 72, 46, CORAL, 12, 6, 10, 9);
    s += fr(-30, -26, 60, 5, tom(CORAL, .35), 2) ;                                         // faixa
    s += brilho(-22, -36, 4, 8, 0, .7);
    s += p('M-40 -48 Q -36 -68 0 -70 Q 36 -68 40 -48 Z', METAL, 5) + f('M-24 -54 Q 0 -60 24 -54', '#FFFFFF', .0);
    s += brilho(-16, -60, 10, 3, -10, .8) + r(-8, -80, 16, 10, FERRO, 5, 4);
    return s;
  }

  /** pipoqueira de alumínio com manivela, estourando pipoca */
  function pipoqueira() {
    let s = '';
    // pipocas pulando (atrás da tampa)
    s += pipoca(-26, -72, 1.25) + pipoca(-4, -78, 1.35) + pipoca(18, -72, 1.25) + pipoca(-14, -104, 1.1) + pipoca(32, -112, 1) + pipoca(-38, -122, .9) + pipoca(8, -134, .85);
    s += l('M-24 -114 l -5 -4 M40 -122 l 4 -5 M-46 -130 l -4 -4 M16 -146 l 2 -6', '#FFC93C', 3);
    // cabo de madeira
    s += vol(30, -42, 46, 12, MAD3, 6, 4, 4, 3) + c(78, -36, 6, MAD3, 4);
    // corpo
    s += vol(-34, -50, 68, 48, METAL, 12, 6, 12, 9);
    s += [-20, -6, 8, 22].map(v => l(`M${v} -44 V -12`, '#E9EEF5', 3)).join('') + brilho(-24, -34, 4, 10, 0, .8);
    // tampa levantadinha e manivela
    s += em(0, -52, 1, p('M-38 0 Q -34 -16 0 -18 Q 34 -16 38 0 Z', '#E4EAF2', 5) + brilho(-16, -10, 10, 3, -10, .8), -6);
    s += l('M0 -70 V -92 H 24 V -100', T, 10) + l('M0 -70 V -92 H 24 V -100', METAL, 4);
    s += vol(17, -122, 14, 24, CORAL, 7, 4, 3, 4);
    return s;
  }

  /** pano de prato listrado pendurado (0,0 = onde dobra no puxador) */
  function panoDePrato() {
    let s = '';
    s += p('M-20 0 L 22 0 L 24 64 Q 0 72 -22 64 Z', '#FFFDF8', 4);
    s += fr(-21, 40, 44, 7, CORAL) + fr(-21.5, 52, 45, 5, AMA);
    s += f('M8 2 L 22 2 L 24 63 Q 16 66 8 66 Z', '#E7DCEB', .6);
    s += l('M-22 64 Q 0 72 24 64', T, 4);
    s += c(-4, 22, 4, ROSA, 0) + [[0, -6], [6, 0], [0, 6], [-6, 0]].map(([a, b]) => fe(-4 + a, 22 + b, 3, 3, ROSA)).join('') + fe(-4, 22, 2, 2, AMA);
    s += r(-22, -8, 46, 14, '#FFFDF8', 6, 4);
    return s;
  }

  /** mesa com toalha xadrez (0,0 = pé no chão; tampo em y -156) */
  function mesa() {
    let s = sombra(0, 2, 104, 11);
    s += vol(-80, -104, 16, 102, MAD2, 5, 5, 4, 0) + vol(64, -104, 16, 102, MAD2, 5, 5, 4, 0);
    s += r(-84, -12, 24, 10, MAD3, 4, 4) + r(60, -12, 24, 10, MAD3, 4, 4);
    // toalha
    let d = 'M-100 -158 H 100 V -100';
    for (let x = 100; x > -100; x -= 25) d += ` Q ${x - 12.5} -86 ${x - 25} -100`;
    d += ' Z';
    s += f(d, '#FFFFFF');
    for (let x = -100; x < 100; x += 25) s += fr(x + 6, -156, 12.5, 58, CORAL, 0, .45);
    for (let y = -150; y < -100; y += 22) s += fr(-100, y, 200, 11, CORAL, 0, .45);
    s += f('M-100 -158 H 100 V -146 H -100 Z', '#FFFFFF', .35);
    s += f('M78 -146 H 100 V -100 Q 90 -88 78 -98 Z', T, .12);
    s += l(d, T, 6) + l('M-100 -146 H 100', T, 3);
    s += brilho(-56, -152, 26, 3, 0, .7);
    return s;
  }

  /** cadeira de madeira vista de frente (fica atrás da mesa, o encosto aparece acima do tampo) */
  function cadeira(cor = AMA) {
    let s = '';
    s += vol(-28, -96, 9, 96, MAD3, 3, 4, 2, 0) + vol(19, -96, 9, 96, MAD3, 3, 4, 2, 0);
    s += vol(-31, -212, 12, 120, MAD1, 5, 5, 3, 0) + vol(19, -212, 12, 120, MAD1, 5, 5, 3, 0);
    s += vol(-11, -190, 7, 70, MAD1, 3, 4, 2, 0) + vol(4, -190, 7, 70, MAD1, 3, 4, 2, 0);
    s += vol(-36, -230, 72, 34, MAD1, 14, 5, 6, 6) + p('M0 -206 Q -12 -214 -8 -221 Q -4 -226 0 -219 Q 4 -226 8 -221 Q 12 -214 0 -206 Z', cor, 3);
    s += vol(-36, -108, 72, 16, MAD1, 6, 5, 4, 4) + e(0, -112, 31, 7, cor, 4);
    s += brilho(-22, -222, 8, 3, 0, .6);
    return s;
  }

  /** fruteira roxa com banana, maçã e laranja */
  function fruteira() {
    let s = sombra(0, 0, 34, 5);
    s += c(-15, -42, 15, '#FF9F3C', 4) + fe(-19, -47, 5, 3, '#FFFFFF', .5) + c(-15, -55, 1.5, T, 0);
    s += p('M14 -34 Q 0 -36 2 -48 Q 4 -60 14 -56 Q 24 -60 26 -48 Q 28 -36 14 -34 Z', '#F2524E', 4) + l('M14 -56 Q 14 -62 17 -65', MAD3, 3) +
      p('M16 -60 Q 24 -66 28 -60 Q 22 -56 16 -60 Z', VERDE, 2) + fe(8, -50, 3, 5, '#FFFFFF', .45);
    s += p('M-34 -52 Q -12 -30 22 -50 Q 34 -58 36 -70 Q 38 -74 34 -72 Q 26 -54 4 -50 Q -16 -46 -30 -58 Z', AMA2, 4) +
      l('M-34 -54 l -4 -2', MAD3, 4) + l('M-24 -51 Q 0 -42 26 -56', '#F2B21B', 3);
    s += p('M-38 -38 Q -36 -10 0 -10 Q 36 -10 38 -38 Z', ROXO, 5) + f('M14 -14 Q 32 -18 34 -36 H 38 Q 36 -12 6 -10 Z', tom(ROXO, -.18));
    s += l('M-34 -32 Q 0 -28 34 -32', tom(ROXO, .4), 3);
    s += r(-12, -12, 24, 12, ROXO, 4, 4);
    return s;
  }

  /** filtro de barro com torneirinha */
  function filtroDeBarro() {
    const S = tom(BARRO, -.18);
    let s = sombra(0, 0, 36, 5);
    s += vol(-24, -10, 48, 10, BARRO, 4, 4, 4, 3);
    s += p('M-28 -8 Q -42 -40 -30 -68 H 30 Q 42 -40 28 -8 Z', BARRO, 5);
    s += f('M14 -66 H 28 Q 40 -40 26 -10 H 12 Q 24 -40 14 -66 Z', S);
    s += l('M-36 -40 Q 0 -32 36 -40', '#FFFFFF', 3) + [-24, -12, 0, 12, 24].map(v => fe(v, -30 - Math.abs(v) * .12, 2.5, 2.5, '#FFFFFF')).join('');
    s += p('M-28 -8 Q -42 -40 -30 -68 H 30 Q 42 -40 28 -8 Z', 'none', 5);
    s += vol(-32, -78, 64, 12, S, 5, 4, 0, 3);
    s += p('M-26 -78 Q -34 -98 -24 -116 H 24 Q 34 -98 26 -78 Z', BARRO, 5) + f('M12 -114 H 24 Q 32 -98 24 -80 H 12 Q 20 -98 12 -114 Z', S);
    s += p('M-26 -78 Q -34 -98 -24 -116 H 24 Q 34 -98 26 -78 Z', 'none', 5);
    s += p('M-28 -116 Q 0 -132 28 -116 Z', BARRO, 5) + c(0, -132, 7, S, 4);
    s += brilho(-20, -52, 4, 12, 0, .45) + brilho(-16, -100, 3, 8, 0, .45);
    // torneirinha
    s += r(26, -30, 16, 9, METAL, 3, 4) + r(36, -30, 8, 16, METAL, 3, 4) + r(30, -38, 8, 9, AZUL, 3, 3);
    return s;
  }

  /** balde listrado cheio de pipoca (a Pipoca adora!) */
  function baldeDePipoca() {
    let s = sombra(0, 0, 30, 5);
    s += pipoca(-16, -64, 1.1) + pipoca(4, -72, 1.2) + pipoca(20, -62, 1) + pipoca(-4, -58, 1) + pipoca(12, -54, .9) + pipoca(-20, -52, .9);
    const d = 'M-26 -52 L -18 -2 H 18 L 26 -52 Z';
    s += f(d, '#FFFFFF');
    for (let i = 0; i < 4; i++) {
      const a = -26 + i * 13, b = a + 6.5, t = -18 + i * 9, u = t + 4.5;
      s += f(`M${n(a)} -52 H ${n(b)} L ${n(u + 0)} -2 H ${n(t)} Z`, CORAL);
    }
    s += f('M14 -52 H 26 L 18 -2 H 10 Z', T, .1) + l(d, T, 5);
    s += vol(-28, -58, 56, 9, '#FFFFFF', 4, 4, 0, 3);
    return s;
  }

  /** vaso de ervas para a janela: tipo 0 manjericão, 1 cebolinha, 2 hortelã */
  function vasoDeErvas(tipo = 0, corVaso = BARRO) {
    let s = '';
    const V = '#4FB43E', V2 = '#78D35E';
    if (tipo === 0) {
      s += l('M0 -26 V -56 M0 -40 L -12 -50 M0 -44 L 12 -56', '#3E8F35', 4);
      s += [[-16, -52, -30], [14, -60, 30], [0, -66, 0], [-8, -38, -40], [12, -44, 40]].map(([x, y, a]) =>
        `<g transform="rotate(${a} ${x} ${y})">${e(x, y, 7, 11, V, 3)}${l(`M${x} ${y - 7} V ${y + 6}`, '#3E8F35', 2)}</g>`).join('');
    } else if (tipo === 1) {
      s += [-12, -6, 0, 6, 12].map((x, i) => l(`M${x * .5} -24 Q ${x} -50 ${x * 1.6} ${-70 + (i % 2) * 12}`, T, 8) + l(`M${x * .5} -24 Q ${x} -50 ${x * 1.6} ${-70 + (i % 2) * 12}`, V2, 4)).join('');
      s += c(-10, -64, 5, ROXO, 3) + c(-9, -64, 2, '#fff', 0);
    } else {
      s += [[-12, -40], [12, -42], [0, -56], [-8, -62], [10, -64], [0, -40]].map(([x, y], i) =>
        p(`M${x} ${y + 9} Q ${x - 11} ${y} ${x} ${y - 9} Q ${x + 11} ${y} ${x} ${y + 9} Z`, i % 2 ? V2 : V, 3) + l(`M${x} ${y + 6} V ${y - 5}`, '#3E8F35', 2)).join('');
    }
    s += p('M-17 -26 L -13 0 H 13 L 17 -26 Z', corVaso, 4) + f('M6 -24 H 15 L 11 -2 H 4 Z', tom(corVaso, -.18));
    s += vol(-20, -32, 40, 9, corVaso, 4, 4, 0, 2);
    s += brilho(-9, -14, 2, 6, 0, .5);
    return s;
  }

  // ================================================================ FUNDO (fixo)
  function azulejos(x0, x1, y0, y1) {
    const t = 38;
    let s = fr(x0, y0, x1 - x0, y1 - y0, '#FDFCF8');
    let i = 0;
    for (let y = y0; y < y1; y += t) {
      let j = 0;
      for (let x = x0; x < x1; x += t) {
        const cx = x + t / 2, cy = y + t / 2, cor = (i % 2) ? '#B8E8E2' : '#FFD3C8';
        if (cy < y1 - 6 && (i + j) % 2 === 0) {
          s += [[0, -8], [8, 0], [0, 8], [-8, 0]].map(([a, b]) => fe(cx + a, cy + b, 5, 5, cor)).join('') + fe(cx, cy, 3.5, 3.5, '#FFE28A');
        }
        if (cy < y1 - 6 && (i + j) % 2) {
          s += fe(cx, cy, 3, 3, '#E3EEF0');
        }
        j++;
      }
      i++;
    }
    let g = '';
    for (let x = x0 + t; x < x1; x += t) g += `M${x} ${y0} V ${y1} `;
    for (let y = y0 + t; y < y1; y += t) g += `M${x0} ${y} H ${x1} `;
    s += l(g, '#E2E6EE', 3);
    return s;
  }

  function piso(L) {
    const y0 = L.piso - 40, y1 = L.piso + 40, xc = (L.x0 + L.x1) / 2, t = 52, linhas = [y0, y0 + 24, y0 + 50, y1];
    const X = (x, y) => x + (x - xc) * (y - y0) / 80 * .16;
    let s = '';
    for (let k = 0; k < 3; k++) {
      const ya = linhas[k], yb = linhas[k + 1];
      let i = 0;
      for (let x = L.x0 - t * 2; x < L.x1 + t; x += t, i++) {
        const cor = (i + k) % 2 ? '#CDEDE7' : '#FFF8EE';
        s += f(`M${n(X(x, ya))} ${ya} L ${n(X(x + t, ya))} ${ya} L ${n(X(x + t, yb))} ${yb} L ${n(X(x, yb))} ${yb} Z`, cor);
      }
    }
    // rejunte
    let g = '';
    for (let x = L.x0 - t * 2; x < L.x1 + t; x += t) g += `M${n(X(x, y0))} ${y0} L ${n(X(x, y1))} ${y1} `;
    for (const y of linhas.slice(1, 3)) g += `M${L.x0} ${y} H ${L.x1} `;
    s += l(g, '#BFD9D4', 2.5);
    // recorta o que a perspectiva empurrou para fora da cozinha (não invade a sala nem o quintal)
    return `<clipPath id="cozinha-piso"><rect x="${L.x0}" y="${y0 - 2}" width="${L.x1 - L.x0}" height="84"/></clipPath><g clip-path="url(#cozinha-piso)">${s}</g>`;
  }

  const NUVEM = 'M-90 20 Q -110 -20 -60 -26 Q -50 -70 0 -62 Q 40 -90 74 -50 Q 120 -54 112 -8 Q 130 20 96 26 Z';

  /** janela com bandô de chita (x,y = canto de cima à esquerda do caixilho) */
  function janela(x, y, corBando = ROSA, arvore = true) {
    const w = 208, h = 230;
    let s = '';
    s += f(`M${x + 8} ${y + h} H ${x + w + 10} V ${y + h + 8} H ${x + 8} Z`, T, .08);
    s += r(x, y, w, h, '#FFFDF8', 14, 6);
    const gx = x + 16, gy = y + 16, gw = w - 32, gh = h - 32;
    s += fr(gx, gy, gw, gh, VIDRO);
    s += f(`M${gx} ${gy + gh - 60} Q ${gx + 60} ${gy + gh - 110} ${gx + 120} ${gy + gh - 70} Q ${gx + 150} ${gy + gh - 90} ${gx + gw} ${gy + gh - 80} V ${gy + gh} H ${gx} Z`, '#A8DDB5');
    s += f(`M${gx} ${gy + gh - 30} Q ${gx + 90} ${gy + gh - 52} ${gx + gw} ${gy + gh - 34} V ${gy + gh} H ${gx} Z`, '#7CCB5E');
    if (arvore) s += r(gx + 120, gy + gh - 100, 10, 50, MAD3, 3, 3) + c(gx + 125, gy + gh - 110, 24, VERDE, 4) + fe(gx + 118, gy + gh - 118, 8, 5, '#8FE07A');
    else s += c(gx + 140, gy + 40, 20, AMA2, 4) + fe(gx + 134, gy + 34, 6, 4, '#fff', .6) + [[30, 170, CORAL], [62, 176, AMA], [104, 172, ROSA]].map(([a, b, cor]) => l(`M${gx + a} ${gy + b + 14} V ${gy + b}`, '#3E8F35', 3) + c(gx + a, gy + b, 6, cor, 3)).join('');
    s += em(gx + 50, gy + 50, .38, p(NUVEM, '#fff', 10));
    s += f(`M${gx + 20} ${gy} L ${gx + 50} ${gy} L ${gx} ${gy + 60} L ${gx} ${gy + 24} Z`, '#FFFFFF', .45);
    s += ro(gx, gy, gw, gh, 4, 4);
    s += r(x + w / 2 - 6, gy, 12, gh, '#FFFDF8', 0, 4) + r(gx, y + h / 2 - 6, gw, 12, '#FFFDF8', 0, 4);
    // bandô de chita
    let d = `M${x - 14} ${y - 22} H ${x + w + 14} V ${y + 26}`;
    for (let k = 0; k < 8; k++) { const xa = x + w + 14 - k * (w + 28) / 8; d += ` Q ${n(xa - (w + 28) / 16)} ${y + 44} ${n(xa - (w + 28) / 8)} ${y + 26}`; }
    d += ' Z';
    s += p(d, corBando, 5);
    for (let k = 0; k < 9; k++) s += fe(x - 2 + k * 26, y - 6 + (k % 2) * 14, 4, 4, '#FFFFFF');
    s += r(x - 20, y - 30, w + 40, 12, MAD2, 6, 4) + c(x - 20, y - 24, 8, MAD2, 4) + c(x + w + 20, y - 24, 8, MAD2, 4);
    // peitoril
    s += vol(x - 16, y + h - 6, w + 32, 18, '#FFFDF8', 6, 5, 0, 5);
    return s;
  }

  /** porta dos fundos: batente e folha aberta para dentro; o vão fica sem pintura (vê-se o quintal de verdade) */
  function portaDosFundos(L, ax, topoP) {
    const chao = L.piso - 40, fx1 = L.x1 + 18;
    let s = '';
    // folha aberta, encostada na parede à esquerda do batente
    const a = ax - 64;
    s += f(`M${a - 10} ${topoP + 22} L ${ax} ${topoP + 8} L ${ax} ${chao} L ${a - 10} ${chao - 4} Z`, T, .1);
    s += p(`M${a} ${topoP + 16} L ${ax} ${topoP + 4} L ${ax} ${chao - 2} L ${a} ${chao - 12} Z`, AGUA, 6);
    s += f(`M${ax - 16} ${topoP + 8} L ${ax - 2} ${topoP + 7} L ${ax - 2} ${chao - 4} L ${ax - 16} ${chao - 6} Z`, tom(AGUA, -.18));
    s += p(`M${a + 12} ${topoP + 42} L ${ax - 20} ${topoP + 36} L ${ax - 20} ${topoP + 130} L ${a + 12} ${topoP + 132} Z`, VIDRO, 4);
    s += l(`M${a + 30} ${topoP + 40} V ${topoP + 131}`, '#FFFDF8', 4);
    s += p(`M${a + 12} ${topoP + 160} L ${ax - 20} ${topoP + 156} L ${ax - 20} ${chao - 40} L ${a + 12} ${chao - 46} Z`, tom(AGUA, .2), 3);
    s += c(a + 14, topoP + 186, 7, AMA, 4);
    // batente (lado esquerdo e verga)
    s += r(ax - 4, topoP - 16, 18, chao - topoP + 18, MAD1, 4, 5);
    s += r(ax - 12, topoP - 22, fx1 - ax + 12, 20, MAD1, 6, 5) + l(`M${ax} ${topoP - 14} H ${fx1 - 4}`, tom(MAD1, .25), 3);
    s += p(`M${ax + 40} ${topoP - 38} Q ${ax + 34} ${topoP - 48} ${ax + 30} ${topoP - 42} Q ${ax + 26} ${topoP - 34} ${ax + 40} ${topoP - 26} Q ${ax + 54} ${topoP - 34} ${ax + 50} ${topoP - 42} Q ${ax + 46} ${topoP - 48} ${ax + 40} ${topoP - 38} Z`, CORAL, 3);
    return s;
  }

  function capacho(x0, x1, y) {
    let s = p(`M${x0 + 6} ${y} H ${x1 - 6} L ${x1} ${y + 26} H ${x0} Z`, CORAL, 4);
    for (let k = 0; k < 3; k++) s += f(`M${x0 + 18 + k * 22} ${y + 3} h 10 l 2 20 h -10 Z`, AMA2);
    s += l(`M${x0} ${y + 26} H ${x1}`, T, 4);
    return s;
  }

  function armarioDeParede(x, y) {
    const w = 200, h = 160;
    let s = '';
    s += f(`M${x + 10} ${y + h} H ${x + w + 4} V ${y + h + 10} H ${x + 10} Z`, T, .1);
    s += vol(x, y, w, h, MAD1, 10, 6, 12, 10);
    s += r(x - 8, y - 12, w + 16, 16, MAD2, 6, 5);
    const porta = (px) => vol(px, y + 14, 84, h - 30, AGUA, 9, 5, 12, 10) + r(px + 12, y + 26, 52, h - 66, tom(AGUA, .18), 6, 3) + brilho(px + 22, y + 40, 4, 14, 0, .5);
    s += porta(x + 10) + porta(x + w - 94);
    s += c(x + w / 2 - 14, y + h - 40, 7, AMA, 4) + c(x + w / 2 + 14, y + h - 40, 7, AMA, 4);
    // varão com concha e colher de pau
    s += l(`M${x + 14} ${y + h + 18} H ${x + 86}`, METAL_S, 6) + c(x + 14, y + h + 18, 4, METAL, 3) + c(x + 86, y + h + 18, 4, METAL, 3);
    s += l(`M${x + 34} ${y + h + 18} V ${y + h + 70}`, T, 8) + l(`M${x + 34} ${y + h + 18} V ${y + h + 70}`, METAL, 3) + p(`M${x + 22} ${y + h + 70} Q ${x + 34} ${y + h + 90} ${x + 46} ${y + h + 70} Z`, METAL, 4);
    s += vol(x + 60, y + h + 16, 8, 50, MAD2, 4, 4, 2, 0) + e(x + 64, y + h + 76, 9, 14, MAD2, 4);
    return s;
  }

  function coifa(xc, topo, y) {
    let s = '';
    s += vol(xc - 26, topo + 20, 52, y - topo - 16, CORAL, 4, 5, 8, 0);
    s += p(`M${xc - 36} ${y} H ${xc + 36} L ${xc + 80} ${y + 64} H ${xc - 80} Z`, CORAL, 6) + f(`M${xc + 20} ${y + 4} H ${xc + 34} L ${xc + 74} ${y + 60} H ${xc + 56} Z`, tom(CORAL, -.16));
    s += vol(xc - 86, y + 62, 172, 18, tom(CORAL, -.05), 6, 5, 0, 5);
    s += [-40, -20, 0, 20, 40].map(v => l(`M${xc + v} ${y + 68} V ${y + 74}`, '#FFFFFF', 3)).join('');
    s += fr(xc - 60, y + 82, 120, 4, '#FFE8A8', 2, .9);
    s += brilho(xc - 30, y + 38, 14, 3, -50, .5);
    return s;
  }

  function relogio(x, y) {
    let s = c(x, y, 40, CORAL, 6) + c(x, y, 30, '#FFFDF5', 4);
    s += [0, 90, 180, 270].map(a => { const rad = a * Math.PI / 180; return fe(x + Math.sin(rad) * 22, y - Math.cos(rad) * 22, 3, 3, T); }).join('');
    s += l(`M${x} ${y} L ${x + 10} ${y - 12} M${x} ${y} L ${x - 15} ${y + 4}`, T, 4) + c(x, y, 4, AMA, 2);
    s += brilho(x - 18, y - 26, 10, 4, -30, .6);
    return s;
  }

  /** prateleira vazia na parede (lugar para a criança pôr coisas do catálogo) */
  function prateleira(x, y, w = 200) {
    let s = '';
    s += l(`M${x + 22} ${y + 12} V ${y + 44} L ${x + 50} ${y + 14}`, MAD3, 7);
    s += l(`M${x + w - 22} ${y + 12} V ${y + 44} L ${x + w - 50} ${y + 14}`, MAD3, 7);
    s += vol(x, y, w, 14, MAD1, 5, 5, 0, 4) + l(`M${x + 20} ${y + 6} q 30 -3 60 0`, MAD2, 2);
    return s;
  }

  /** luminária pendente do teto */
  function luminaria(x, topo, y) {
    let s = l(`M${x} ${topo} V ${y}`, T, 4) + r(x - 14, topo - 2, 28, 8, MAD2, 3, 4) + r(x - 7, y - 12, 14, 16, MAD3, 4, 4);
    s += fe(x, y + 56, 30, 9, '#FFE8A8', .9) + c(x, y + 50, 13, '#FFF6C8', 4);
    s += p(`M${x - 60} ${y + 48} Q ${x - 56} ${y} ${x} ${y} Q ${x + 56} ${y} ${x + 60} ${y + 48} Z`, AMA, 6);
    s += f(`M${x + 24} ${y + 4} Q ${x + 54} ${y + 10} ${x + 56} ${y + 44} H ${x + 38} Q ${x + 38} ${y + 14} ${x + 24} ${y + 4} Z`, tom(AMA, -.16));
    s += l(`M${x - 58} ${y + 38} H ${x + 58}`, CORAL, 5) + brilho(x - 28, y + 16, 12, 4, -25, .6);
    return s;
  }

  // ================================================================ montagem
  const MONTA = { geladeira: 4500, pia: 4690, fogao: 4885, janelas: [5420, 6330], luminaria: 5880, prateleira: 6720, portaX: 7104 };

  CASA.partes.cozinha = {
    fundo(L) {
      const { x0, x1, topo } = L, W = x1 - x0, chao = L.piso - 40, az = 1606, dx = MONTA.portaX, dy = L.piso - 350;
      let s = '';
      // parede: amarelo-manteiga com listrinhas (com o vão da porta dos fundos aberto até lá fora)
      s += fr(x0, topo, W, dy - topo, '#FFF1D2') + fr(x0, dy - 1, dx - x0, chao - dy + 1, '#FFF1D2');
      for (let x = x0 + 18; x < x1; x += 60) s += fr(x, topo, 24, (x + 24 > dx ? dy : az) - topo, '#FFE8BF', 0, .55);
      // sanca no teto
      s += fr(x0, topo, W, 24, '#FFF9EC') + l(`M${x0} ${topo + 24} H ${x1}`, '#E8CFA6', 4) + l(`M${x0} ${topo + 32} H ${x1}`, '#F3DDB8', 3);
      // azulejos de meia parede, com faixa decorada
      s += azulejos(x0, dx, az, chao);
      s += fr(x0, az - 18, dx - x0, 18, CORAL) + l(`M${x0} ${az - 18} H ${dx} M${x0} ${az} H ${dx}`, T, 4);
      for (let x = x0 + 14; x < dx - 8; x += 28) s += fe(x, az - 9, 4, 4, (x / 28 | 0) % 2 ? AMA2 : '#FFFFFF');
      // rodapé
      s += fr(x0, chao - 20, dx - x0, 20, MAD2) + fr(x0, chao - 20, dx - x0, 6, MAD1) + l(`M${x0} ${chao - 20} H ${dx}`, T, 4);
      // piso xadrez (vai até a soleira, debaixo da parede de fora)
      s += piso({ x0, x1: x1 + 18, piso: L.piso });
      s += l(`M${x0} ${chao} H ${x1 + 18}`, T, 5);
      // fixos na parede e no teto
      s += relogio(MONTA.geladeira, 1418) + armarioDeParede(MONTA.pia - 100, 1316) + coifa(MONTA.fogao, topo, 1372);
      s += janela(MONTA.janelas[0], 1344) + janela(MONTA.janelas[1], 1344, AMA, false);
      s += luminaria(MONTA.luminaria, topo + 24, 1300) + prateleira(MONTA.prateleira, 1500);
      s += portaDosFundos(L, dx, dy) + capacho(dx + 2, x1 + 14, L.piso - 30);
      return s;
    },
    objetos(L) {
      const P = L.piso, G = MONTA.geladeira;
      let s = '';
      // só o essencial: geladeira com ímãs de letras, bancada da pia e fogão
      s += em(G, P, 1, geladeira());
      s += em(G - 30, P - 238, 1, imaLetra('A', CORAL), -8) + em(G + 12, P - 228, 1, imaLetra('B', AZUL), 6) +
        em(G - 24, P - 172, 1, imaLetra('C', VERDE), 4) + em(G + 22, P - 162, 1, imaLetra('D', ROXO), -6) + em(G, P - 104, 1, imaLetra('E', AMA2), 3);
      s += em(MONTA.pia, P, 1, pia());
      s += em(MONTA.fogao, P, 1, fogao());
      // ver.html?...&catalogo: expõe as peças do catálogo no chão vazio, só para avaliar o desenho
      if (/[?&]catalogo\b/.test(location.search)) {
        const X = 5080;
        s += em(X, P, 1, mesa()) + em(X - 40, P - 158, 1, fruteira());
        s += em(X + 200, P, 1, cadeira(AMA)) + em(X + 290, P, 1, cadeira(ROSA));
        [[liquidificador()], [panela()], [pipoqueira()], [escorredor()], [filtroDeBarro()], [baldeDePipoca()], [vasoDeErvas(0)], [vasoDeErvas(1, AGUA)], [vasoDeErvas(2, AMA)], [panoDePrato(), -60]]
          .forEach(([o, dy = 0], i) => { s += em(X + 420 + i * 120, P + dy, 1, o); });
      }
      return s;
    },
    /** todas as funções de objeto (montadas ou não), desenhadas em volta de (0,0) = meio do pé */
    catalogo: { geladeira, imaLetra, pia, fogao, panela, pipoqueira, panoDePrato, escorredor, liquidificador, mesa, cadeira, fruteira, filtroDeBarro, baldeDePipoca, vasoDeErvas },
  };
})();
