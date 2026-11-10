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
  function geladeira(aberta = false) {
    // larga (220): a porta da geladeira é grande o bastante para os ímãs de letrinha ficarem espaçados
    const w = 220, h = 384, x = -w / 2, y = -h;
    let s = sombra(0, 2, 124, 12);
    s += r(-90, -14, 26, 16, FERRO, 5, 4) + r(64, -14, 26, 16, FERRO, 5, 4);            // pezinhos
    s += r(x, y, w, h - 10, BRANCO_S, 30, 0);
    s += fr(x, y, w - 26, h - 30, BRANCO, 28);                                        // face clara
    s += fr(x + w - 26, y + 30, 7, h - 90, '#DDE6F3', 3);                              // meio-tom na lateral
    s += ro(x, y, w, h - 10, 30, 6);
    // divisão freezer | geladeira (frestinha)
    s += l(`M${x + 3} -290 H ${x + w - 3}`, T, 6) + l(`M${x + 8} -284 H ${x + w - 8}`, '#DDE6F3', 3);
    // puxadores cromados (do lado esquerdo; a dobradiça é à direita)
    s += vol(x + 12, -352, 16, 48, METAL, 8, 4, 4, 6) + (aberta ? '' : vol(x + 12, -270, 16, 84, METAL, 8, 4, 4, 8));
    // grade de ventilação embaixo
    s += r(-62, -42, 124, 16, '#E3EAF4', 8, 4) + [-40, -24, -8, 8, 24, 40].map(v => l(`M${v} -38 V -30`, BRANCO_S, 4)).join('');
    // desenho de criança preso no freezer (sol e casinha), com um ímã de coração
    s += em(46, -334, 1, r(-26, -28, 52, 50, '#FFFFFF', 3, 3) + fr(-26, 14, 52, 8, '#EEF2F8') +
      c(-10, -12, 7, AMA, 3) + l('M-10 -24 v -3 M-21 -12 h -3 M1 -12 h 3 M-18 -20 l -2 -2 M-2 -20 l 2 -2', AMA, 3) +
      p('M4 10 V -2 L 13 -10 L 22 -2 V 10 Z', CORAL, 3) + l('M-22 12 Q 0 6 22 12', VERDE, 3), -4);
    s += p('M46 -364 Q 40 -372 36 -366 Q 32 -358 46 -350 Q 60 -358 56 -366 Q 52 -372 46 -364 Z', ROSA, 3);
    // brilhos
    // brilhos (o reflexo da luz), ao lado dos puxadores, sem passar por cima deles
    s += brilho(x + 50, y + 60, 7, 34, 0, .9) + (aberta ? '' : brilho(x + 50, -200, 6, 50, 0, .9)) + brilho(x + 66, y + 18, 20, 5, 0, .8);
    if (aberta) s += dentroDaGeladeira();
    return s;
  }

  /** a geladeira de porta aberta: prateleiras com comidinhas, a luzinha e a porta (dobradiça à direita) aberta para
   *  o lado (os ímãs grudados na porta somem enquanto ela está aberta: acao.portaEsconde) */
  function dentroDaGeladeira() {
    // por dentro: fundo claro, luzinha
    let s = r(-98, -282, 196, 236, '#CFE6F7', 14, 5) + fr(-92, -276, 178, 222, '#F2FAFF', 10);
    s += r(-14, -280, 28, 10, '#FFF3A6', 4, 3);
    // prateleira de cima: leite, geleia, queijo e um potinho
    s += em(-30, 0, 1, p('M-52 -218 V -250 L -46 -260 H -32 L -26 -250 V -218 Z', '#FFFFFF', 4) + fr(-50, -242, 22, 10, AZUL) + l('M-46 -260 L -39 -250 L -32 -260', T, 3));
    s += em(-24, 0, 1, r(-18, -246, 24, 28, '#E8476A', 6, 4) + r(-20, -252, 28, 8, AMA, 3, 4) + fe(-12, -236, 3, 6, '#FFFFFF', .5));
    s += em(-10, 0, 1, p('M14 -218 H 54 V -240 Z', AMA2, 4) + fe(42, -226, 3, 3, '#F2B21B') + fe(48, -232, 2, 2, '#F2B21B') + fe(30, -222, 2.5, 2, '#F2B21B'));
    s += r(58, -240, 26, 22, '#FFFFFF', 6, 4) + fr(60, -236, 22, 6, ROSA);
    s += r(-94, -220, 188, 7, VIDRO, 3, 3);
    // do meio: ovos, gelatina com cereja, suco e garrafinhas
    s += em(-30, 0, 1, r(-56, -168, 50, 8, '#F5D7B0', 3, 3) + [-46, -31, -16].map(v => e(v, -178, 7, 10, '#FFF8EE', 3)).join(''));
    s += em(-14, 0, 1, e(16, -160, 22, 4, '#FFFFFF', 3) + p('M-2 -162 Q -2 -192 16 -192 Q 34 -192 34 -162 Z', ROSA, 4) + fe(8, -180, 3, 6, '#FFFFFF', .55) + c(16, -197, 5, '#F2524E', 3));
    s += r(30, -200, 14, 38, '#FF9F3C', 5, 4) + r(32, -208, 10, 9, VERDE, 2, 3);
    s += r(54, -194, 10, 32, VERDE, 3, 3) + r(70, -198, 11, 36, CORAL, 3, 3);
    s += r(-94, -162, 188, 7, VIDRO, 3, 3);
    // de baixo: melancia e iogurtes
    s += em(-24, 0, 1, p('M-54 -108 Q -32 -150 -10 -108 Z', '#FF5D6C', 4) + l('M-50 -110 H -14', VERDE, 5) + fe(-38, -122, 1.6, 3, T) + fe(-26, -124, 1.6, 3, T) + fe(-32, -134, 1.6, 3, T));
    s += r(4, -132, 18, 24, '#FFFFFF', 4, 4) + fr(5, -131, 16, 6, ROXO) + r(28, -126, 18, 18, '#FFFFFF', 4, 4) + fr(29, -125, 16, 5, VERDE);
    s += r(52, -130, 18, 22, '#FFFFFF', 4, 4) + fr(53, -129, 16, 6, AMA);
    // gaveta de verduras (cenoura e alface aparecendo)
    s += l('M-50 -100 l -6 -16 M-46 -100 l 2 -18 M-42 -100 l 8 -14', VERDE, 4) + c(14, -100, 12, '#8FE07A', 4) + c(30, -102, 10, '#5CC84A', 4) + c(48, -100, 11, '#8FE07A', 4);
    s += vol(-92, -104, 184, 50, '#BDEBCB', 8, 4, 8, 6) + l('M-30 -84 H 30', '#7FC995', 4);
    // a porta da geladeira, aberta para a direita (vista de fora, de lado): branca, com o puxador
    s += p('M110 -290 L 178 -304 L 178 -30 L 110 -46 Z', BRANCO, 6) + f('M166 -298 L 178 -301 L 178 -34 L 166 -36 Z', '#DDE6F3');
    s += vol(162, -230, 8, 76, METAL, 4, 3, 3, 4);
    s += brilho(124, -230, 4, 40, 0, .8);
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
  function panela(mexe = false) {
    let s = '';
    s += vapor(-14, -78, 64) + vapor(8, -84, 88, 8) + vapor(28, -76, 56, 6);
    s += r(-48, -42, 18, 12, FERRO, 6, 4) + r(30, -42, 18, 12, FERRO, 6, 4);
    s += vol(-36, -48, 72, 46, CORAL, 12, 6, 10, 9);
    s += fr(-30, -26, 60, 5, tom(CORAL, .35), 2) ;                                         // faixa
    s += brilho(-22, -36, 4, 8, 0, .7);
    let t = p('M-40 -48 Q -36 -68 0 -70 Q 36 -68 40 -48 Z', METAL, 5) + f('M-24 -54 Q 0 -60 24 -54', '#FFFFFF', .0);
    t += brilho(-16, -60, 10, 3, -10, .8) + r(-8, -80, 16, 10, FERRO, 5, 4);
    s += mexe ? `<g class="coz-tampa">${t}</g>` : t;                                      // a tampa (chacoalha)
    return s;
  }

  /** pipoqueira de alumínio com manivela, estourando pipoca */
  function pipoqueira(gira = false) {
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
    const m = l('M0 -70 V -92 H 24 V -100', T, 10) + l('M0 -70 V -92 H 24 V -100', METAL, 4) + vol(17, -122, 14, 24, CORAL, 7, 4, 3, 4);
    s += gira ? `<g class="coz-manivela">${m}</g>` : m;
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
  function fruteira(pula = 0) {
    const fruta = (k, svg) => (pula === k ? `<g class="coz-pula">${svg}</g>` : svg);     // pula: 1 laranja, 2 maçã, 3 banana
    let s = sombra(0, 0, 34, 5);
    s += fruta(1, c(-15, -42, 15, '#FF9F3C', 4) + fe(-19, -47, 5, 3, '#FFFFFF', .5) + c(-15, -55, 1.5, T, 0));
    s += fruta(2, p('M14 -34 Q 0 -36 2 -48 Q 4 -60 14 -56 Q 24 -60 26 -48 Q 28 -36 14 -34 Z', '#F2524E', 4) + l('M14 -56 Q 14 -62 17 -65', MAD3, 3) +
      p('M16 -60 Q 24 -66 28 -60 Q 22 -56 16 -60 Z', VERDE, 2) + fe(8, -50, 3, 5, '#FFFFFF', .45));
    s += fruta(3, p('M-34 -52 Q -12 -30 22 -50 Q 34 -58 36 -70 Q 38 -74 34 -72 Q 26 -54 4 -50 Q -16 -46 -30 -58 Z', AMA2, 4) +
      l('M-34 -54 l -4 -2', MAD3, 4) + l('M-24 -51 Q 0 -42 26 -56', '#F2B21B', 3));
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
  function baldeDePipoca(pula = false) {
    let s = sombra(0, 0, 30, 5);
    s += pipoca(-16, -64, 1.1) + (pula ? `<g class="coz-pula">${pipoca(4, -72, 1.2)}</g>` : pipoca(4, -72, 1.2)) + pipoca(20, -62, 1) + pipoca(-4, -58, 1) + pipoca(12, -54, .9) + pipoca(-20, -52, .9);
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
  function vasoDeErvas(tipo = 0, corVaso = BARRO, mexe = false) {
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
    if (mexe) s = `<g class="coz-erva">${s}</g>`;                                         // as folhas balançam
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
    s += janelaPorCima(x, y, corBando);
    // peitoril
    s += vol(x - 16, y + h - 6, w + 32, 18, '#FFFDF8', 6, 5, 0, 5);
    return s;
  }
  /** o que fica por cima do vidro (contorno, caixilho, bandô e varão): o motor redesenha por cima do vidro escuro da
   *  noite (luz.sobreVidro) */
  function janelaPorCima(x, y, corBando = ROSA) {
    const w = 208, h = 230, gx = x + 16, gy = y + 16, gw = w - 32, gh = h - 32;
    let s = ro(gx, gy, gw, gh, 4, 4);
    s += r(x + w / 2 - 6, gy, 12, gh, '#FFFDF8', 0, 4) + r(gx, y + h / 2 - 6, gw, 12, '#FFFDF8', 0, 4);
    // bandô de chita
    let d = `M${x - 14} ${y - 22} H ${x + w + 14} V ${y + 26}`;
    for (let k = 0; k < 8; k++) { const xa = x + w + 14 - k * (w + 28) / 8; d += ` Q ${n(xa - (w + 28) / 16)} ${y + 44} ${n(xa - (w + 28) / 8)} ${y + 26}`; }
    d += ' Z';
    s += p(d, corBando, 5);
    for (let k = 0; k < 9; k++) s += fe(x - 2 + k * 26, y - 6 + (k % 2) * 14, 4, 4, '#FFFFFF');
    s += r(x - 20, y - 30, w + 40, 12, MAD2, 6, 4) + c(x - 20, y - 24, 8, MAD2, 4) + c(x + w + 20, y - 24, 8, MAD2, 4);
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

  // ================================================================ AÇÕES (modo brincar; o formato está em casa/acoes.js)
  // movimentos de uma vez só (as classes casa-* do motor são contínuas)
  if (typeof document !== 'undefined' && document.head) {
    const st = document.createElement('style');
    st.textContent =
      '.coz-pula{transform-box:fill-box;transform-origin:50% 100%;animation:cozPula .75s ease-out}' +
      '@keyframes cozPula{30%{transform:translateY(-46px) rotate(-12deg)}60%{transform:translateY(0) rotate(4deg)}78%{transform:translateY(-8px)}}' +
      '.coz-tampa{transform-box:fill-box;transform-origin:50% 100%;animation:cozTampa .3s ease-in-out 3}' +
      '@keyframes cozTampa{25%{transform:translateY(-10px) rotate(-6deg)}50%{transform:translateY(-2px)}75%{transform:translateY(-8px) rotate(5deg)}}' +
      '.coz-erva{transform-box:fill-box;transform-origin:50% 100%;animation:cozErva 1s ease-in-out}' +
      '@keyframes cozErva{20%{transform:rotate(-9deg)}45%{transform:rotate(7deg)}70%{transform:rotate(-4deg)}90%{transform:rotate(2deg)}}' +
      '.coz-manivela{transform-box:fill-box;transform-origin:0 50%;animation:cozManivela .43s linear 3}' +
      '@keyframes cozManivela{50%{transform:scaleX(-1)}}';
    document.head.appendChild(st);
  }

  /** "mexendo agora" (não fica guardado): o desenho troca por um tempinho e volta sozinho */
  const mexendo = new WeakMap(), vez = new WeakMap();
  const mexe = e => (mexendo.get(e) || 0) > 0;
  function mexerPor(ctx, ms) {
    const e = ctx.estado;
    mexendo.set(e, (mexendo.get(e) || 0) + 1);
    ctx.mudou();
    ctx.depois(ms, () => {
      const k = (mexendo.get(e) || 1) - 1;
      if (k > 0) mexendo.set(e, k); else { mexendo.delete(e); ctx.mudou(); }
    });
  }
  /** a coisa "de cima" está apoiada em cima da "de baixo"? (posição relativa, em px do desenho de baixo) */
  function emCima(baixo, cima, meiaLargura, y0, y1) {
    const a = baixo.noMundo(0, 0), k = baixo.noMundo(1, 0).x - a.x || 1, b = cima.noMundo(0, 0);
    const dx = (b.x - a.x) / k, dy = (b.y - a.y) / k;
    return Math.abs(dx) <= meiaLargura && dy >= y0 && dy <= y1;
  }
  const FOGO = [-100, -250, -130];                                   // em cima do fogão: meia largura, faixa de altura
  const noFogoAceso = ctx => ctx.perto(320).some(o => o.id === 'fogao' && o.estado.aceso && emCima(o.contexto(), ctx, ...FOGO));

  const ACOES = {
    geladeira: {
      desenho: e => geladeira(!!e.aberta),
      // porta de baixo aberta: o que vemos é o lado de dentro, então os ímãs grudados nela somem (e voltam ao fechar)
      portaEsconde: e => (e.aberta ? [-110, -290, 110, -12] : null),
      sobre: e => (e.aberta ? `<g class="casa-brilha"><ellipse cx="0" cy="-246" rx="84" ry="36" fill="#FFF6C8" opacity=".4"/></g>` : ''),
      tocar(ctx) {
        const e = ctx.estado;
        e.aberta = !e.aberta;
        ctx.som(e.aberta ? 'clique' : 'encaixar');
        ctx.mudou();
        if (e.aberta) ctx.particulas('vapor', 10, -170, 3, { dx: 40, dy: -50, espalha: 40 });
      },
    },
    piaCozinha: {
      // a torneira aberta: um fiozinho de água que brilha e respinga no tampo
      sobre: e => (e.aberta
        ? `<path d="M38 -240 Q 37 -214 39 -186 H 47 Q 48 -214 46 -240 Z" fill="#9FD8FF" stroke="${T}" stroke-width="3"/>` +
          `<path class="casa-pisca" d="M42 -234 V -222 M43 -208 V -196" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>` +
          `<path class="casa-pisca2" d="M42 -226 V -214 M43 -200 V -191" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>` +
          `<g class="casa-pulsa"><path d="M26 -186 Q 30 -198 36 -189 M50 -189 Q 56 -198 60 -186" fill="none" stroke="${T}" stroke-width="7" stroke-linecap="round"/>` +
          `<path d="M26 -186 Q 30 -198 36 -189 M50 -189 Q 56 -198 60 -186" fill="none" stroke="#9FD8FF" stroke-width="3.5" stroke-linecap="round"/></g>`
        : ''),
      tocar(ctx) {
        const e = ctx.estado;
        e.aberta = !e.aberta;
        ctx.som(e.aberta ? 'bolha' : 'clique');
        ctx.mudou();
        if (e.aberta) ctx.particulas('gota', 43, -192, 3, { dy: -60, espalha: 40, cai: true });
      },
    },
    fogao: {
      // as quatro bocas com foguinho
      sobre: e => (e.aceso ? [-60, -22, 22, 60].map(v =>
        `<g class="casa-treme"><path d="M${v - 11} -186 Q ${v - 13} -200 ${v - 4} -206 Q ${v - 2} -198 ${v} -214 Q ${v + 12} -200 ${v + 11} -186 Z" fill="#FF8A3D" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>` +
        `<path d="M${v - 5} -187 Q ${v - 5} -196 ${v} -202 Q ${v + 5} -196 ${v + 5} -187 Z" fill="${AMA2}"/></g>`).join('') : ''),
      tocar(ctx) {
        const e = ctx.estado;
        e.aceso = !e.aceso;
        ctx.som(e.aceso ? 'clique' : 'soltar');
        ctx.mudou();
        if (!e.aceso) return;
        ctx.particulas('faisca', 0, -196, 3, { dy: -60, espalha: 70 });
        // a panela (ou a pipoqueira) que estiver em cima esquenta
        ctx.perto(320).filter(o => (o.id === 'panela' || o.id === 'pipoqueira') && emCima(ctx, o.contexto(), ...FOGO))
          .forEach(o => ctx.depois(350, () => ACOES[o.id].tocar(o.contexto())));
      },
    },
    panela: {
      desenho: e => panela(mexe(e)),
      tocar(ctx) {
        mexerPor(ctx, 900);
        ctx.som('bolha');
        ctx.particulas('vapor', 0, -96, noFogoAceso(ctx) ? 5 : 3, { dy: -110, espalha: 30, seguidas: 160 });
      },
    },
    pipoqueira: {
      desenho: e => pipoqueira(mexe(e)),
      tocar(ctx) {
        mexerPor(ctx, 1300);
        ctx.tremer();
        ctx.som('pulo');
        ctx.particulas('pipoca', 0, -100, noFogoAceso(ctx) ? 8 : 6, { dy: -170, espalha: 70, cai: true, seguidas: 120 });
        ctx.depois(500, () => ctx.som('pulo'));
      },
    },
    baldePipoca: {
      desenho: e => baldeDePipoca(mexe(e)),
      tocar(ctx) { mexerPor(ctx, 800); ctx.som('pulo'); ctx.particulas('pipoca', 4, -78, 1, { dy: -130, espalha: 30, cai: true, ms: 1000 }); },
    },
    filtro: {
      tocar(ctx) { ctx.som('bolha'); ctx.particulas('gota', 40, -10, 1, { dy: 34, espalha: 2, ms: 700 }); },
    },
    fruteira: {
      desenho: e => fruteira(mexe(e) ? (vez.get(e) || 1) : 0),
      tocar(ctx) { vez.set(ctx.estado, (vez.get(ctx.estado) || 0) % 3 + 1); mexerPor(ctx, 800); ctx.som('pulo'); },
    },
    mesa: {
      // a mesa pula e as coisas que estão em cima dela pulam junto
      tocar(ctx) {
        ctx.pular(); ctx.som('pulo');
        ctx.perto(260).filter(o => emCima(ctx, o.contexto(), 110, -230, -120)).forEach(o => o.contexto().pular());
      },
    },
    cadeiraAmarela: { tocar(ctx) { ctx.pular(); ctx.som('pulo'); ctx.particulas('coracao', 0, -220, 1, { dy: -80, espalha: 20 }); } },
    cadeiraRosa: { tocar(ctx) { ctx.pular(); ctx.som('pulo'); ctx.particulas('coracao', 0, -220, 1, { dy: -80, espalha: 20 }); } },
    panoDePrato: { tocar(ctx) { ctx.balancar(); ctx.som('pagina'); } },
    escorredor: {
      tocar(ctx) { ctx.tremer(); ctx.som('bolha'); ctx.particulas('gota', -4, -2, 3, { dy: 10, espalha: 20, cai: true, seguidas: 220 }); },
    },
  };
  // as ervas da janela: as folhas balançam
  [['manjericao', 0, BARRO], ['cebolinha', 1, AGUA], ['hortela', 2, AMA]].forEach(([id, tipo, cor]) => {
    ACOES[id] = {
      desenho: e => vasoDeErvas(tipo, cor, mexe(e)),
      tocar(ctx) { mexerPor(ctx, 1000); ctx.som('pagina'); ctx.particulas('folha', 0, -60, 2, { dy: -50, espalha: 40, cai: true }); },
    };
  });
  // ímãs de letra: o ímã pula e a Pipoca diz o nome da letra
  ['A', 'B', 'C', 'D', 'E'].forEach(L => {
    ACOES['ima' + L] = {
      tocar(ctx) {
        ctx.pular(); ctx.som('pulo');
        ctx.particulas('estrela', 0, -10, 2, { dy: -70, espalha: 40 });
        const nome = (PC.palavras && PC.palavras.falaLetra(L)) || L;
        ctx.diz(nome.charAt(0).toUpperCase() + nome.slice(1) + '!');
      },
    };
  });

  // ================================================================ montagem
  // ================================================================ LUZ (interruptor, janela fechada e lustre)
  const INTERRUPTOR = { x: 4332, y: 1640 };
  /** interruptor de parede (igual ao do quarto); (x, y) = centro */
  function interruptor(x, y) {
    return fr(x - 16, y - 22, 40, 56, T, 8, .08) + r(x - 20, y - 28, 40, 56, '#FFFFFF', 8, 4) + r(x - 8, y - 14, 16, 28, '#F3ECF9', 5, 3) +
      fr(x - 5, y - 11, 10, 11, '#fff') + l(`M${x - 5} ${y + 1} H ${x + 5}`, '#C9BEDD', 2);
  }
  /** A janela fechada: duas cortininhas da mesma chita do bandô (rosa numa janela, amarela na outra) fechadas sobre
      o vidro todo; o bandô e o varão voltam por cima. j = o vidro (a moldura começa 16 px antes). */
  function cortinaFechada(j, nj) {
    const x = j.x - 16, y = j.y - 16, w = 208, h = 230, cor = nj ? AMA : ROSA, ate = y + h - 10;
    const painel = (x0, x1, lado) => {
      const dobras = 3, pw = (x1 - x0) / dobras;
      let d = `M${n(x0)} ${y - 24} H ${n(x1)} L ${n(x1 + lado * 2)} ${ate - 4}`;
      for (let k = 0; k < dobras; k++) { const xa = x1 - k * pw; d += ` Q ${n(xa - pw / 2)} ${ate + 10} ${n(xa - pw)} ${ate - 4}`; }
      let o = p(d + ' Z', cor, 5);
      // dobras (sombra num caminho só) e bolinhas brancas da chita (outro caminho)
      let so = '', bo = '';
      for (let k = 0; k < dobras; k++) {
        const xx = x0 + (k + .7) * pw;
        so += `M${n(xx)} ${y + 30} q 5 ${n((ate - y) * .45)} 0 ${n(ate - y - 36)} h 10 q 3 ${n(-(ate - y) * .5)} -2 ${n(-(ate - y - 36))} Z `;
      }
      for (let yy = y + 44, jj = 0; yy < ate - 12; yy += 28, jj++)
        for (let xx = x0 + 12 + (jj % 2) * 13; xx < x1 - 8; xx += 26) bo += `M${n(xx - 4)} ${yy} a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 `;
      o += f(so, tom(cor, -.16)) + f(bo, '#FFFFFF');
      const xi = lado > 0 ? x1 : x0;
      o += f(`M${n(xi)} ${y + 30} L ${n(xi - lado * 12)} ${y + 30} Q ${n(xi - lado * 8)} ${n((y + ate) / 2)} ${n(xi - lado * 3)} ${ate - 6} L ${n(xi)} ${ate - 6} Z`, tom(cor, -.22), .7);
      return o;
    };
    let s = painel(x - 10, x + w / 2 + 3, 1) + painel(x + w / 2 - 3, x + w + 10, -1);
    // o bandô de chita e o varão por cima (iguais aos da janela aberta)
    let d = `M${x - 14} ${y - 22} H ${x + w + 14} V ${y + 26}`;
    for (let k = 0; k < 8; k++) { const xa = x + w + 14 - k * (w + 28) / 8; d += ` Q ${n(xa - (w + 28) / 16)} ${y + 44} ${n(xa - (w + 28) / 8)} ${y + 26}`; }
    s += p(d + ' Z', cor, 5);
    for (let k = 0; k < 9; k++) s += fe(x - 2 + k * 26, y - 6 + (k % 2) * 14, 4, 4, '#FFFFFF');
    s += r(x - 20, y - 30, w + 40, 12, MAD2, 6, 4) + c(x - 20, y - 24, 8, MAD2, 4) + c(x + w + 20, y - 24, 8, MAD2, 4);
    return s;
  }
  /** Lustre da cozinha: pendente de esmalte amarelo de bolinhas, com a borda coral e a lâmpada aparecendo embaixo.
      Fica no mesmo lugar da luminária pendente do cenário (luminaria(), mais abaixo) e a cobre inteira. (0,0) = o teto. */
  function lustre(aceso) {
    const LAMP = aceso ? '#FFF6C8' : '#DCD8E8';
    let s = r(-18, 20, 36, 10, MAD2, 3, 4) + l('M0 28 V 180', T, 5);
    s += r(-10, 170, 20, 22, MAD3, 4, 4) + fr(-6, 174, 4, 14, '#fff', 2, .35);
    // a lâmpada (só a pontinha aparece embaixo da borda)
    s += c(0, 266, 18, LAMP, 4) + brilho(-6, 268, 4, 5, 0, .8);
    // a cúpula de esmalte, com o lado da sombra
    s += p('M-76 254 Q -76 186 0 184 Q 76 186 76 254 Z', AMA, 6);
    s += f('M30 190 Q 70 198 72 252 L 48 252 Q 50 208 30 190 Z', tom(AMA, -.16));
    let bo = '';
    for (const [x, y] of [[-46, 228], [-18, 210], [10, 230], [-50, 246], [36, 214], [-26, 242]]) bo += `M${x - 5} ${y} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 `;
    s += f(bo, '#FFFFFF', .9) + brilho(-40, 206, 16, 5, -28, .6);
    // borda coral (cobre também a borda e o brilho da luminária antiga)
    s += r(-80, 248, 160, 16, CORAL, 8, 5) + fr(-72, 251, 120, 3, '#fff', 2, .45);
    return s;
  }

  const MONTA = { geladeira: 4500, pia: 4800, fogao: 4995, janelas: [5420, 6330], luminaria: 5880, prateleira: 6720, portaX: 7104 };

  CASA.partes.cozinha = {
    luz: {
      // o vidro de cada janela: janela(x, 1344) com moldura 208 x 230 e vidro 16 px para dentro
      janelas: MONTA.janelas.map(x => ({ x: x + 16, y: 1360, w: 176, h: 198 })),
      fechada: (j, nj) => cortinaFechada(j, nj),
      sobreVidro: (j, k) => janelaPorCima(MONTA.janelas[k], 1344, k ? AMA : ROSA),
      interruptor: INTERRUPTOR,
      lustre: { x: MONTA.luminaria, y: CASA.L.cozinha.topo, lampada: [0, 262], desenho: aceso => lustre(aceso) },
    },
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
      s += prateleira(MONTA.prateleira, 1500);   // (a luz do teto é o lustre de luz.lustre: acende pelo interruptor)
      s += portaDosFundos(L, dx, dy) + capacho(dx + 2, x1 + 14, L.piso - 30);
      // interruptor da luz, logo depois da passagem que vem da sala
      s += interruptor(INTERRUPTOR.x, INTERRUPTOR.y);
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
    acoes: ACOES,
    catalogo: { geladeira, imaLetra, pia, fogao, panela, pipoqueira, panoDePrato, escorredor, liquidificador, mesa, cadeira, fruteira, filtroDeBarro, baldeDePipoca, vasoDeErvas },
  };
})();
