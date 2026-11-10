/* Casa da Pipoca (esboço) — a SALA (térreo, à esquerda; a escada fica de x 1060 a 1500).
   Cada objeto é uma função própria, desenhada em volta de (0,0) = meio do pé no chão
   (nos objetos de parede, (0,0) = meio da borda de baixo). */
(function () {
  'use strict';
  const { T, r, c, e, p, l, f, fr, fe, brilho, sombra, tom, em, n } = CASA;
  const BAIXO_PISO = CASA.L.sala.piso;

  const COR = {
    coral: '#FF7A6B', amarelo: '#FFC93C', amarelo2: '#FFD23F', agua: '#2EC4B6', roxo: '#9B7BFF', verde: '#5CC84A',
    rosa: '#FF8FC2', azul: '#4DA3FF', mad1: '#C98A55', mad2: '#A9703F', mad3: '#8A5A34', creme: '#FFF4E6',
  };
  /** costura tracejada (sem contorno) */
  const costura = (d, cor, sw = 3, tr = '7 6') => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${sw}" stroke-dasharray="${tr}" stroke-linecap="round"/>`;
  /** losango cheio, sem contorno */
  const losango = (x, y, w, h, cor, op = 1) => f(`M${n(x)} ${n(y - h)} L${n(x + w)} ${n(y)} L${n(x)} ${n(y + h)} L${n(x - w)} ${n(y)} Z`, cor, op);
  /** algarismo do relógio */
  const num = (x, y, t, tam) => `<text x="${n(x)}" y="${n(y)}" font-family="Fredoka, Arial Rounded MT Bold, Arial, sans-serif" font-weight="700" font-size="${tam}" text-anchor="middle" dominant-baseline="central" fill="${T}">${t}</text>`;

  // ================================================================ objetos

  /** Sofá de três lugares, verde-água, capitonê no encosto, almofadas estampadas e manta listrada.
      Assento a 150 px do chão; o lugar da Pipoca é o meio (x -60..60). */
  function sofa() {
    const S = COR.agua, S1 = tom(S, -.15), S2 = tom(S, -.28), SL = tom(S, .3);
    let s = sombra(0, 2, 182, 12);
    // pezinhos de madeira
    for (const x of [-148, 148]) s += p(`M${x - 11} -26 H${x + 11} L${x + 7} 0 H${x - 7} Z`, COR.mad3, 4);
    // encosto com dois gomos
    s += p('M-150 -140 V-246 Q-150 -284 -112 -284 Q-56 -292 0 -276 Q56 -292 112 -284 Q150 -284 150 -246 V-140 Z', S, 6);
    s += f('M-146 -150 V-196 Q0 -176 146 -196 V-150 Z', S1);
    s += l('M0 -272 V-160', S1, 4);
    // capitonê: losangos de vinco e botões
    const bot = [];
    for (const [y, xs] of [[-246, [-108, -54, 54, 108]], [-206, [-81, -27, 27, 81]]]) for (const x of xs) bot.push([x, y]);
    let vinco = '';
    for (const [x, y] of bot.filter(b => b[1] === -246)) vinco += `M${x} ${y} L${x + 27} ${y + 40} M${x} ${y} L${x - 27} ${y + 40} `;
    s += l(vinco, S1, 3);
    for (const [x, y] of bot) s += fe(x, y, 6, 5, S2) + fe(x - 1.5, y - 1.5, 2.2, 2, SL);
    s += brilho(-80, -268, 46, 9, -4, .4) + brilho(70, -268, 40, 8, 4, .3);
    // base (saia) com costura
    s += r(-160, -116, 320, 92, S, 22, 6);
    s += f('M-156 -58 H156 V-46 Q156 -28 138 -28 H-138 Q-156 -28 -156 -46 Z', S1);
    s += costura('M-140 -40 H140', S2);
    // almofadas do assento (o assento fica a -150)
    for (const x0 of [-126, 0]) {
      s += r(x0, -158, 126, 52, S, 18, 5);
      s += fr(x0 + 6, -128, 114, 16, S1, 6);
      s += costura(`M${x0 + 14} -146 H${x0 + 112}`, SL, 3, '6 6');
      s += brilho(x0 + 40, -148, 28, 5, -2, .45);
    }
    // braços com rolinho na frente
    for (const lado of [-1, 1]) {
      const x = lado * 150;
      s += r(x - 26, -214, 52, 190, S, 26, 6);
      s += fr(x - (lado < 0 ? -10 : 22), -170, 12, 136, S1, 6);
      s += c(x, -186, 22, SL, 5) + l(`M${x} -186 m -9 0 a 9 9 0 1 1 9 9 a 5 5 0 1 1 -4 -6`, S1, 3);
      s += brilho(x - 6, -198, 9, 5, -30, .5);
    }
    // almofada coral com losangos (encostada no braço esquerdo)
    const almofada = (base, est) => {
      let a = p('M-40 -36 Q0 -28 40 -36 Q33 0 40 36 Q0 28 -40 36 Q-33 0 -40 -36 Z', base, 5);
      a += f('M-34 14 Q0 22 34 14 L38 32 Q0 26 -38 32 Z', tom(base, -.15));
      a += est;
      for (const [x, y] of [[-40, -36], [40, -36], [-40, 36], [40, 36]]) a += c(x, y, 5, tom(base, -.2), 3);
      return a + brilho(-14, -22, 14, 5, -15, .5);
    };
    const est1 = losango(0, 0, 14, 18, COR.amarelo2) + losango(-24, -16, 6, 8, COR.creme) + losango(24, -16, 6, 8, COR.creme) +
      losango(-24, 16, 6, 8, COR.creme) + losango(24, 16, 6, 8, COR.creme) + fe(0, 0, 4, 4, COR.coral);
    const est2 = [[-20, -18], [6, -20], [-6, 2], [20, 4], [-22, 18], [10, 20], [26, -12]].map(([x, y]) => fe(x, y, 5, 5, COR.creme)).join('') +
      [[-8, -10], [16, -2], [-16, 8]].map(([x, y]) => fe(x, y, 3, 3, COR.coral)).join('');
    s += em(-98, -196, 1, almofada(COR.coral, est1), -12);
    s += em(96, -192, .9, almofada(COR.amarelo2, est2), 10);
    // manta listrada jogada no braço direito
    const M = COR.roxo;
    s += p('M86 -280 Q122 -294 156 -270 Q182 -246 180 -196 Q178 -120 176 -64 Q160 -56 140 -64 Q138 -140 128 -190 Q116 -236 86 -280 Z', M, 5);
    s += f('M150 -230 Q166 -190 166 -120 Q166 -88 162 -68 L150 -66 Q150 -150 140 -210 Z', tom(M, -.15));
    s += l('M104 -270 Q138 -276 162 -256 M120 -244 Q150 -248 172 -226 M130 -212 Q156 -214 177 -192 M136 -170 Q158 -170 178 -152 M140 -126 Q160 -126 177 -110', COR.amarelo2, 6);
    s += l('M112 -258 Q144 -262 166 -242 M126 -228 Q154 -230 175 -210 M134 -190 Q158 -192 178 -172 M138 -148 Q160 -148 178 -130', COR.rosa, 3);
    s += l('M144 -64 l -2 14 M152 -62 l 0 15 M160 -62 l 1 14 M168 -63 l 2 14 M175 -65 l 3 13', M, 4);
    s += brilho(120, -262, 18, 5, 30, .45);
    return s;
  }

  /** Luminária de pé, cúpula amarela listrada (fica atrás do braço do sofá). */
  function luminaria() {
    let s = sombra(0, 2, 44, 8);
    s += e(0, -8, 40, 11, COR.mad3, 5) + fe(0, -11, 28, 5, tom(COR.mad3, .25));
    s += l('M0 -12 V-262', T, 14) + l('M0 -14 V-260', COR.mad2, 7) + l('M-2 -40 V-250', tom(COR.mad2, .3), 2);
    s += c(0, -140, 8, COR.mad3, 4);
    // facho de luz
    s += f('M-48 -268 L-64 -190 Q0 -180 64 -190 L48 -268 Z', '#FFE9A3', .3);
    // cúpula
    s += p('M-58 -264 Q0 -254 58 -264 L40 -342 Q0 -350 -40 -342 Z', COR.amarelo2, 6);
    s += f('M-40 -340 L-24 -344 L-34 -260 L-52 -263 Z M-8 -346 H8 L8 -256 H-8 Z M24 -344 L40 -340 L52 -263 L34 -260 Z', COR.amarelo, 1);
    s += f('M42 -334 L56 -268 Q48 -262 40 -262 L30 -340 Z', tom(COR.amarelo2, -.15));
    s += l('M-58 -264 Q0 -254 58 -264', COR.coral, 7) + l('M-40 -342 Q0 -350 40 -342', T, 5);
    s += l('M22 -256 V-226', T, 2.5) + c(22, -222, 4, COR.coral, 2.5);
    s += brilho(-26, -322, 8, 18, 12, .55);
    return s;
  }

  /** Espada-de-são-jorge num vaso de barro listrado. */
  function planta() {
    let s = sombra(0, 2, 40, 8);
    const folha = (x0, h, inc, w) => {
      const tx = x0 + inc, d = `M${x0 - w} -60 Q${x0 - w - 4} ${-60 - h * .55} ${tx} ${-60 - h} Q${x0 + w + 4} ${-60 - h * .55} ${x0 + w} -60 Z`;
      const di = `M${x0 - w + 5} -60 Q${x0 - w + 2} ${-60 - h * .52} ${tx} ${-60 - h + 14} Q${x0 + w - 2} ${-60 - h * .52} ${x0 + w - 5} -60 Z`;
      let a = p(d, '#FFD23F', 4) + f(di, '#3FA35A');
      for (let k = 1; k < 6; k++) {
        const t = k / 6.5, y = -60 - h * t * .9, x = x0 + inc * t * t, ww = (w - 6) * (1 - t * .7);
        a += l(`M${n(x - ww)} ${n(y)} Q${n(x)} ${n(y - 7)} ${n(x + ww)} ${n(y)}`, '#2E7D4A', 3);
      }
      return a + f(`M${x0 - 2} -66 Q${x0 - 3} ${-60 - h * .5} ${x0 + inc * .6} ${-60 - h * .85} L${x0 + 2} -66 Z`, '#7FDB6E', .7);
    };
    s += folha(-24, 170, -22, 13) + folha(24, 160, 24, 13) + folha(-8, 230, -8, 15) + folha(12, 205, 12, 14);
    // vaso
    s += p('M-38 -70 H38 L28 -4 Q28 0 24 0 H-24 Q-28 0 -28 -4 Z', '#E8825A', 6);
    s += f('M18 -66 H34 L26 -6 H14 Z', tom('#E8825A', -.15));
    s += l('M-34 -44 L-24 -34 L-12 -44 L0 -34 L12 -44 L24 -34 L34 -44', COR.creme, 5);
    s += r(-44, -84, 88, 18, '#F0946E', 7, 5);
    s += brilho(-22, -50, 6, 14, 8, .45);
    return s;
  }

  /** Rack de madeira baixo com duas portinhas. */
  function rack() {
    const M = COR.mad1, M1 = tom(M, -.15);
    let s = sombra(0, 2, 82, 9);
    for (const x of [-56, 56]) s += p(`M${x - 8} -16 H${x + 8} L${x + 5} 0 H${x - 5} Z`, COR.mad3, 4);
    s += r(-74, -104, 148, 90, M, 8, 6);
    s += fr(-70, -30, 140, 12, M1, 4);
    // portinhas
    for (const x0 of [-64, 4]) {
      s += r(x0, -92, 60, 62, tom(M, .12), 6, 4);
      s += l(`M${x0 + 10} -80 q 14 6 22 -2 t 20 4 M${x0 + 8} -56 q 18 -6 30 2 t 14 -2 M${x0 + 12} -42 q 12 4 22 0`, M1, 2.5);
      s += brilho(x0 + 18, -84, 12, 4, -10, .4);
    }
    s += c(-12, -62, 5, COR.amarelo, 3) + c(12, -62, 5, COR.amarelo, 3);
    // tampo
    s += r(-84, -116, 168, 18, COR.mad2, 7, 5) + fr(-78, -112, 120, 4, tom(COR.mad2, .3), 2);
    return s;
  }

  /** TV redondinha de pezinho, com antena e um desenho na tela (fica em cima do rack: y = -116). */
  function tv() {
    const C = COR.roxo;
    let s = sombra(0, 2, 50, 5);
    s += p('M-26 0 L-14 -16 H14 L26 0 Z', COR.mad3, 4);
    // antena
    s += l('M0 -112 L-30 -152 M0 -112 L34 -150', T, 4) + c(-30, -152, 6, COR.coral, 3) + c(34, -150, 6, COR.amarelo, 3);
    s += e(0, -110, 16, 8, C, 4);
    // corpo
    s += r(-74, -112, 148, 98, C, 22, 6);
    s += fr(-68, -36, 136, 18, tom(C, -.15), 10);
    // tela com um desenho (morrinho, sol e nuvem)
    s += r(-62, -100, 96, 72, '#BFE8FF', 16, 5);
    s += f('M-58 -48 Q-36 -66 -14 -50 Q8 -66 30 -48 V-40 Q30 -32 22 -32 H-50 Q-58 -32 -58 -40 Z', COR.verde);
    s += fe(12, -80, 10, 10, COR.amarelo2) + fe(-34, -82, 13, 6, '#fff') + fe(-24, -86, 8, 6, '#fff');
    s += brilho(-36, -90, 18, 5, -20, .6);
    // botões
    s += c(52, -86, 8, COR.amarelo2, 3.5) + l('M52 -86 l 4 -5', T, 3) + c(52, -62, 7, COR.agua, 3.5);
    for (const y of [-46, -40, -34]) s += l(`M45 ${y} H59`, tom(C, -.3), 2.5);
    s += brilho(-52, -106, 16, 4, -4, .4);
    return s;
  }

  /** Tapete grande com borda roxa, losangos e franjas. Fica no chão (y -18 a +26). */
  function tapete() {
    let s = '';
    // franjas
    for (let y = -12; y <= 20; y += 6) s += l(`M${-262 - (y + 18) * .45} ${y} h -18 M${262 + (y + 18) * .45} ${y} h 18`, '#F6E7FF', 4);
    s += p('M-252 -18 H252 L276 24 H-276 Z', COR.roxo, 5);
    s += fr(-275, 22, 550, 6, tom(COR.roxo, -.2), 2);
    s += f('M-232 -11 H232 L250 18 H-250 Z', COR.creme);
    s += f('M-222 -6 H222 L237 13 H-237 Z', '#FFE3D6');
    // faixa de losangos
    for (let i = -6; i <= 6; i++) {
      const x = i * 36;
      s += losango(x, 3, 15, 9, [COR.coral, COR.amarelo2, COR.agua][(i + 9) % 3]);
      if (i < 6) s += fe(x + 18, 3, 2.6, 2, COR.roxo);
    }
    s += l('M-220 -2 H220 M-232 9 H232', tom(COR.roxo, .3), 2);
    s += brilho(-120, -10, 60, 2.5, 0, .4);
    return s;
  }

  /** Relógio de parede com números grandes (o “pé” é a borda de baixo). */
  function relogio() {
    const R = 86, cy = -R - 4;
    let s = '';
    s += l(`M0 ${cy - R - 14} l -14 18 M0 ${cy - R - 14} l 14 18`, T, 3) + c(0, cy - R - 14, 4, COR.mad3, 3);
    s += c(3, cy + 5, R, T, 0).replace('fill="#3A2A5A"', `fill="${T}" opacity=".12"`);
    s += c(0, cy, R, COR.coral, 6);
    s += f(`M${R * .62} ${cy + R * .62} A ${R - 6} ${R - 6} 0 0 1 ${-R * .62} ${cy + R * .62} A ${R - 14} ${R - 14} 0 0 0 ${R * .62} ${cy + R * .62} Z`, tom(COR.coral, -.15));
    s += c(0, cy, R - 16, '#FFFBF2', 5);
    // risquinhos dos minutos
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue;
      const a = i * Math.PI / 30, r1 = R - 24, r2 = R - 28;
      s += l(`M${n(Math.sin(a) * r1)} ${n(cy - Math.cos(a) * r1)} L${n(Math.sin(a) * r2)} ${n(cy - Math.cos(a) * r2)}`, '#D9C9EE', 2.5);
    }
    // números
    for (let h = 1; h <= 12; h++) {
      const a = h * Math.PI / 6, rr = R - 38;
      s += num(Math.sin(a) * rr, cy - Math.cos(a) * rr + 1, h, h >= 10 ? 19 : 22);
    }
    // ponteiros (10 e 10)
    const pont = (ang, len, cor, sw) => { const a = ang * Math.PI / 180; return l(`M0 ${cy} L${n(Math.sin(a) * len)} ${n(cy - Math.cos(a) * len)}`, T, sw + 5) + l(`M0 ${cy} L${n(Math.sin(a) * len)} ${n(cy - Math.cos(a) * len)}`, cor, sw); };
    s += pont(305, 34, COR.roxo, 7) + pont(60, 50, COR.agua, 5);
    s += c(0, cy, 8, COR.amarelo2, 4);
    s += brilho(-40, cy - 50, 22, 8, -40, .5);
    return s;
  }

  /** Quadro de paisagem (morros, sol e casinha) com moldura de madeira. */
  function quadroPaisagem() {
    let s = fr(-58, -100, 122, 104, T, 10, .1);
    s += l('M0 -122 L-40 -98 M0 -122 L40 -98', T, 3) + c(0, -122, 4, COR.mad3, 3);
    s += r(-62, -106, 124, 106, COR.mad2, 10, 5);
    s += r(-50, -94, 100, 82, '#BFE8FF', 4, 4);
    s += f('M-48 -40 Q-20 -66 6 -44 Q26 -62 48 -46 V-14 H-48 Z', COR.verde);
    s += f('M-48 -26 Q0 -40 48 -28 V-14 H-48 Z', tom(COR.verde, -.15));
    s += fe(28, -76, 9, 9, COR.amarelo2);
    s += p('M-24 -38 V-52 L-14 -60 L-4 -52 V-38 Z', COR.coral, 3);
    s += fe(-34, -78, 10, 5, '#fff');
    s += f('M44 -100 H58 V-4 H44 Z', tom(COR.mad2, -.15), .5);
    s += brilho(-40, -100, 16, 3, 0, .5);
    return s;
  }

  /** Prateleira de parede com livros, rádio antigo e porta-retrato (o “pé” é a ponta das mãos-francesas). */
  function prateleira() {
    let s = fr(-80, -24, 166, 10, T, 4, .1);
    // mãos-francesas
    for (const x of [-56, 56]) s += p(`M${x - 6} -28 H${x + 6} V-20 Q${x + 4} -8 ${x} 0 Q${x - 4} -8 ${x - 6} -20 Z`, COR.mad3, 4);
    // livros
    const livros = [[-78, 18, 62, COR.coral], [-60, 16, 54, COR.azul], [-44, 20, 66, COR.verde], [-24, 14, 50, COR.amarelo2]];
    for (const [x, w, h, cor] of livros) {
      s += r(x, -40 - h, w, h, cor, 3, 4);
      s += fr(x + w - 6, -38 - h, 4, h - 4, tom(cor, -.15));
      s += l(`M${x + 3} ${-30 - h} h ${w - 6} M${x + 3} -50 h ${w - 6}`, '#fff', 2.5);
    }
    s += em(-1, -40, 1, r(0, -56, 14, 56, COR.rosa, 3, 4) + l('M3 -46 h 8 M3 -12 h 8', '#fff', 2.5), 14);
    // rádio
    s += l('M44 -84 L60 -122', T, 3) + c(60, -122, 4, COR.amarelo2, 2.5);
    s += r(16, -86, 66, 46, COR.coral, 12, 5);
    s += fr(20, -54, 58, 10, tom(COR.coral, -.15), 5);
    s += c(34, -64, 12, COR.creme, 3.5);
    for (const [x, y] of [[30, -68], [38, -68], [30, -60], [38, -60], [34, -64]]) s += fe(x, y, 1.8, 1.8, T);
    s += r(52, -78, 24, 12, COR.creme, 3, 3) + l('M60 -78 v 12', COR.coral, 2.5);
    s += c(58, -55, 4.5, COR.amarelo2, 2.5) + c(70, -55, 4.5, COR.agua, 2.5);
    s += brilho(30, -80, 10, 3, -5, .5);
    // porta-retrato (a Pipoca e a família: carinhas redondas)
    s += r(-4, -84, 32, 44, COR.amarelo2, 5, 4) + r(2, -78, 20, 30, '#BFE8FF', 3, 2.5);
    s += fe(9, -58, 5, 5, '#E9B77A') + fe(17, -61, 4, 4, '#C98A55') + f('M3 -49 Q9 -56 15 -49 Q18 -54 22 -49 Z', COR.rosa);
    // tábua
    s += r(-90, -42, 180, 16, COR.mad2, 5, 5) + fr(-84, -39, 140, 3.5, tom(COR.mad2, .3), 2);
    return s;
  }

  /** Quadrinho redondo com uma flor. */
  function quadroFlor() {
    let s = fe(4, -38, 36, 36, T, .1);
    s += l('M0 -84 L-18 -66 M0 -84 L18 -66', T, 3) + c(0, -84, 3.5, COR.mad3, 2.5);
    s += c(0, -40, 36, COR.agua, 5) + c(0, -40, 26, '#FFF8EC', 4);
    s += l('M0 -34 Q-2 -24 0 -18', '#3FA35A', 4) + f('M0 -24 Q-12 -28 -14 -20 Q-6 -18 0 -24 Z', COR.verde);
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s += fe(Math.cos(a) * 8, -44 + Math.sin(a) * 8, 6, 6, COR.rosa); }
    s += fe(0, -44, 5, 5, COR.amarelo2);
    s += brilho(-16, -60, 9, 4, -40, .5);
    return s;
  }

  /** Poltrona coral fofinha, de pés palito, com almofada de listras. Assento a ~140 px. */
  function poltrona() {
    const P = COR.coral, P1 = tom(P, -.15), PL = tom(P, .3);
    let s = sombra(0, 2, 96, 10);
    for (const x of [-64, 64]) s += p(`M${x - 8} -30 H${x + 8} L${x + lado(x) * 6 + 4} 0 H${x + lado(x) * 6 - 4} Z`, COR.mad3, 4);
    s += p('M-74 -130 V-236 Q-74 -262 -44 -264 Q0 -272 44 -264 Q74 -262 74 -236 V-130 Z', P, 6);
    s += f('M-70 -140 V-176 Q0 -160 70 -176 V-140 Z', P1);
    s += costura('M-56 -240 Q0 -250 56 -240', PL);
    s += brilho(-30, -246, 26, 6, -4, .4);
    s += r(-88, -110, 176, 82, P, 22, 6) + fr(-84, -56, 168, 22, P1, 10) + costura('M-70 -42 H70', tom(P, -.3));
    s += r(-62, -150, 124, 46, P, 16, 5) + fr(-56, -122, 112, 12, P1, 6) + brilho(-20, -140, 26, 5, -2, .45);
    for (const ld of [-1, 1]) {
      const x = ld * 82;
      s += r(x - 22, -186, 44, 158, P, 22, 6) + c(x, -162, 18, PL, 4.5) + l(`M${x} -162 m -7 0 a 7 7 0 1 1 7 7`, P1, 3);
    }
    // almofada de listras
    const alm = p('M-30 -28 Q0 -22 30 -28 Q25 0 30 28 Q0 22 -30 28 Q-25 0 -30 -28 Z', COR.creme, 5) +
      l('M-24 -14 Q0 -10 24 -14 M-26 0 H26 M-24 14 Q0 10 24 14', COR.agua, 5) + f('M-26 16 Q0 22 26 16 L28 26 Q0 22 -28 26 Z', '#E8D9C4');
    s += em(-6, -184, 1, alm, -8);
    return s;
    function lado(x) { return x < 0 ? -1 : 1; }
  }

  /** Pufe redondo amarelo, com gomos e botão. */
  function pufe() {
    const Y = COR.amarelo2, Y1 = tom(Y, -.15);
    let s = sombra(0, 2, 56, 8);
    s += p('M-52 -10 Q-58 -40 -50 -62 Q0 -76 50 -62 Q58 -40 52 -10 Q0 4 -52 -10 Z', Y, 6);
    s += f('M-50 -24 Q0 -10 50 -24 Q52 -14 50 -10 Q0 4 -50 -10 Z', Y1);
    s += l('M-26 -66 Q-30 -36 -24 -4 M0 -70 V-2 M26 -66 Q30 -36 24 -4', Y1, 3.5);
    s += e(0, -64, 50, 12, tom(Y, .2), 5) + fe(0, -64, 6, 3.5, COR.coral) + brilho(-22, -66, 16, 3.5, 0, .55);
    s += l('M-52 -40 Q0 -26 52 -40', COR.coral, 5);
    return s;
  }

  /** Ventilador de pé azul, com grade e três pás. */
  function ventilador() {
    const A = COR.azul;
    let s = sombra(0, 2, 50, 8);
    s += e(0, -8, 46, 11, A, 5) + fe(0, -11, 32, 5, tom(A, .3));
    s += c(-24, -9, 4, COR.amarelo2, 2.5) + c(-10, -12, 4, COR.creme, 2.5) + c(4, -12, 4, COR.creme, 2.5);
    s += l('M0 -16 V-200', T, 14) + l('M0 -18 V-198', '#E9EEF7', 7);
    s += r(-10, -216, 20, 30, A, 6, 4);
    s += r(-24, -268, 48, 40, A, 14, 5) + fr(-20, -242, 40, 10, tom(A, -.15), 5);
    // grade
    const cy = -290;
    s += c(0, cy, 78, '#EAF6FF', 6);
    for (let i = 0; i < 3; i++) {
      const a = i * 2 * Math.PI / 3 - Math.PI / 2;
      s += p(`M0 ${cy} Q${n(Math.cos(a - .5) * 70)} ${n(cy + Math.sin(a - .5) * 70)} ${n(Math.cos(a) * 66)} ${n(cy + Math.sin(a) * 66)} Q${n(Math.cos(a + .25) * 46)} ${n(cy + Math.sin(a + .25) * 46)} 0 ${cy} Z`, [COR.agua, COR.agua, COR.agua][i], 4);
    }
    let g = '';
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g += `M${n(Math.cos(a) * 18)} ${n(cy + Math.sin(a) * 18)} L${n(Math.cos(a) * 74)} ${n(cy + Math.sin(a) * 74)} `; }
    s += l(g, T, 2) + `<circle cx="0" cy="${cy}" r="48" fill="none" stroke="${T}" stroke-width="2"/>`;
    s += `<circle cx="0" cy="${cy}" r="78" fill="none" stroke="${A}" stroke-width="5"/><circle cx="0" cy="${cy}" r="81" fill="none" stroke="${T}" stroke-width="3"/>`;
    s += c(0, cy, 16, COR.amarelo2, 5) + fe(-4, cy - 4, 5, 4, '#fff', .7);
    s += brilho(-40, cy - 44, 20, 7, -40, .5);
    return s;
  }

  /** Rede listrada num suporte de madeira (fica de pé sozinha). */
  function rede() {
    const M = COR.mad2;
    let s = sombra(0, 2, 200, 12);
    // suporte
    s += p('M-196 -4 Q-196 -22 -176 -22 H176 Q196 -22 196 -4 V0 H-196 Z', M, 5);
    s += l('M-178 -18 Q-200 -150 -164 -262', T, 18) + l('M-178 -18 Q-200 -150 -164 -262', M, 10);
    s += l('M178 -18 Q200 -150 164 -262', T, 18) + l('M178 -18 Q200 -150 164 -262', M, 10);
    s += l('M-186 -120 Q-196 -170 -180 -220', tom(M, .3), 3) + l('M186 -120 Q196 -170 180 -220', tom(M, .3), 3);
    s += c(-164, -262, 10, COR.mad3, 4) + c(164, -262, 10, COR.mad3, 4);
    // cordinhas
    let cord = '';
    for (const k of [-1, 1]) for (let j = 0; j < 5; j++) cord += `M${k * 164} -258 L${k * (120 - j * 2)} ${-176 + j * 12} `;
    s += l(cord, '#E8D5B0', 3);
    // pano (barriga para baixo) em faixas coloridas
    const cores = [COR.coral, COR.amarelo2, COR.agua, COR.roxo, COR.rosa, COR.verde];
    const tt = x => Math.max(0, Math.min(1, (x + 120) / 240)), topo = x => -176 - 96 * tt(x) * (1 - tt(x)), fundo = x => -128 + 216 * tt(x) * (1 - tt(x));
    s += p('M-122 -176 Q0 -224 122 -176 L120 -128 Q0 -20 -120 -128 Z', COR.coral, 6);
    for (let i = 1; i < cores.length; i += 2) {
      const xa = -120 + i * 40, xb = Math.min(118, xa + 40), pts = [0, .25, .5, .75, 1].map(t => xa + (xb - xa) * t);
      s += f('M' + pts.map(x => `${n(x)} ${n(topo(x) + 5)}`).join(' L') + ' L' + pts.reverse().map(x => `${n(x)} ${n(fundo(x) - 5)}`).join(' L') + ' Z', cores[i]);
    }
    s += l('M-100 -184 Q0 -214 100 -184', COR.creme, 4);
    s += f('M-112 -122 Q0 -36 112 -122 L116 -126 Q0 -22 -116 -126 Z', T, .15);
    // franja
    let fr2 = '';
    for (let x = -110; x <= 110; x += 12) { const y = fundo(x) - 2; fr2 += `M${x} ${n(y)} l ${x / 40} 22 `; }
    s += l(fr2, COR.amarelo2, 4);
    s += l('M-120 -128 Q0 -20 120 -128', T, 5);
    s += brilho(-60, -168, 30, 5, 4, .45);
    return s;
  }

  /** Estante baixa de madeira com livros, um pião e um vasinho. */
  function estante() {
    const M = COR.mad1, M1 = tom(M, -.15);
    let s = sombra(0, 2, 96, 10);
    for (const x of [-70, 70]) s += r(x - 8, -14, 16, 16, COR.mad3, 3, 4);
    s += r(-90, -270, 180, 258, M, 10, 6);
    s += fr(-78, -258, 156, 234, tom(M, -.32), 4);
    s += fr(64, -262, 20, 246, M1, 4);
    // prateleiras
    for (const y of [-180, -96]) s += r(-82, y, 164, 12, M, 3, 4);
    // livros de cima
    let x = -74;
    for (const [w, h, cor] of [[16, 62, COR.coral], [14, 54, COR.amarelo2], [18, 68, COR.azul], [14, 58, COR.verde]]) { s += r(x, -180 - h, w, h, cor, 3, 3.5) + l(`M${x + 3} ${-170 - h} h ${w - 6}`, '#fff', 2.5); x += w + 1; }
    s += em(x + 4, -180, 1, r(0, -50, 14, 50, COR.rosa, 3, 3.5), 18);
    // vasinho com plantinha
    s += f('M44 -230 Q30 -250 36 -262 Q48 -250 48 -232 Z M52 -230 Q66 -252 60 -264 Q50 -248 48 -232 Z', COR.verde) + l('M44 -230 Q30 -250 36 -262 Q48 -250 48 -232 M52 -230 Q66 -252 60 -264 Q50 -248 48 -232', T, 3);
    s += p('M34 -232 H62 L58 -182 H38 Z', COR.agua, 4);
    // prateleira do meio: pião e caixinha
    s += p('M-50 -150 L-28 -150 L-39 -108 Z', COR.roxo, 4) + e(-39, -152, 14, 6, COR.amarelo2, 3.5) + l('M-39 -158 V-170', T, 4);
    s += r(-6, -146, 70, 50, COR.coral, 6, 4.5) + r(-10, -154, 78, 14, tom(COR.coral, .2), 5, 4) + c(29, -118, 6, COR.amarelo2, 3);
    // embaixo: livros deitados
    s += r(-74, -40, 76, 16, COR.verde, 3, 3.5) + r(-70, -56, 70, 16, COR.amarelo2, 3, 3.5) + r(-64, -72, 60, 16, COR.azul, 3, 3.5);
    s += c(40, -50, 24, COR.coral, 4.5) + l('M18 -50 Q40 -40 62 -50 M40 -74 Q30 -50 40 -26', '#fff', 3);
    s += brilho(-70, -262, 26, 4, 0, .45);
    return s;
  }

  /** Aquário redondinho num móvel baixo, com peixinhos, alga e bolhas. */
  function aquario() {
    const M = COR.mad2;
    let s = sombra(0, 2, 84, 10);
    // móvel
    s += r(-72, -96, 144, 84, M, 8, 6) + fr(-68, -28, 136, 12, tom(M, -.15), 4);
    s += r(-60, -84, 120, 54, tom(M, .12), 6, 4) + c(0, -57, 5, COR.amarelo, 3);
    for (const x of [-58, 58]) s += p(`M${x - 7} -14 H${x + 7} L${x + 4} 0 H${x - 4} Z`, COR.mad3, 4);
    // aquário
    s += r(-70, -206, 140, 112, '#BFEAF5', 14, 6);
    s += fr(-64, -184, 128, 84, '#7FD3E8', 8);
    s += f('M-64 -110 Q-30 -122 0 -112 Q30 -122 64 -110 V-104 Q64 -100 58 -100 H-58 Q-64 -100 -64 -104 Z', '#F2D68A');
    for (const [x, y, cor] of [[-40, -106, COR.rosa], [-20, -104, COR.roxo], [26, -107, COR.amarelo], [44, -104, COR.coral]]) s += fe(x, y, 5, 3, cor);
    s += l('M-44 -110 Q-54 -130 -44 -148 Q-36 -164 -46 -178 M-34 -110 Q-28 -126 -36 -142', '#3FA35A', 6);
    // peixinhos
    const peixe = (x, y, cor, ld) => p(`M${x} ${y} q ${ld * 16} -14 ${ld * 30} 0 q ${-ld * 14} 14 ${-ld * 30} 0 Z`, cor, 3.5) + p(`M${x} ${y} l ${-ld * 12} -9 v 18 Z`, cor, 3.5) + fe(x + ld * 22, y - 2, 2.5, 2.5, T);
    s += peixe(4, -158, COR.coral, 1) + peixe(30, -128, COR.amarelo2, -1);
    for (const [x, y, rr] of [[30, -166, 5], [36, -180, 3.5], [32, -192, 2.5]]) s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="none" stroke="#fff" stroke-width="2.5"/>`;
    s += l('M-64 -184 H64', '#fff', 3) + r(-76, -214, 152, 16, COR.agua, 6, 5);
    s += brilho(-52, -170, 6, 22, 0, .55);
    return s;
  }

  // ================================================================ fundo
  function fundo(L) {
    const { x0, x1, topo, piso } = L, ch = piso - 40, W = x1 - x0;
    let s = '';
    // parede com papel de florzinhas
    const PAR = '#FFF1DA', EST = '#F6DDBA';
    s += fr(x0, topo, W, ch - topo, PAR);
    let i = 0;
    for (let y = topo + 80; y < ch - 200; y += 64, i++) {
      for (let x = x0 + 26 + (i % 2) * 44; x < x1; x += 88) {
        s += fe(x, y - 6, 3.5, 5, EST) + fe(x, y + 6, 3.5, 5, EST) + fe(x - 6, y, 5, 3.5, EST) + fe(x + 6, y, 5, 3.5, EST) + fe(x, y, 2.6, 2.6, '#FFD9A6');
      }
    }
    // lambri verde-água claro na parte de baixo
    const lambri = ch - 210;
    s += fr(x0, lambri, W, ch - lambri, '#D7F1EC');
    for (let x = x0 + 26; x < x1; x += 40) s += l(`M${x} ${lambri + 18} V${ch - 24}`, '#BFE4DC', 3);
    s += r(x0 - 6, lambri - 8, W + 12, 18, COR.creme, 5, 4) + fr(x0, lambri + 10, W, 6, T, 0, .06);
    // sanca no teto
    s += fr(x0, topo, W, 26, '#FFF9F0') + l(`M${x0} ${topo + 26} H${x1}`, '#E8CFA8', 4) + fr(x0, topo + 28, W, 10, T, 0, .05);
    // piso de taco
    s += fr(x0, ch, W, 80, '#EBC48F');
    const tons = ['#E6BB82', '#EFCB98', '#E2B279'];
    for (let row = 0; row < 4; row++) {
      const y = ch + row * 20;
      for (let x = x0 - (row % 2) * 24, k = 0; x < x1; x += 48, k++) {
        s += fr(x + 1, y + 1, 46, 18, tons[(k + row * 2) % 3]);
        if ((k + row) % 2) s += l(`M${x + 16} ${y + 3} V${y + 17} M${x + 32} ${y + 3} V${y + 17}`, '#D3A46C', 2);
        else s += l(`M${x + 4} ${y + 10} H${x + 44}`, '#D3A46C', 2);
      }
    }
    s += fr(x0, ch, W, 10, T, 0, .08);
    // rodapé
    s += r(x0 - 6, ch - 24, W + 12, 26, '#FFFFFF', 3, 4) + fr(x0, ch - 8, W, 8, '#E9E0F3');
    s += l(`M${x0} ${ch} H${x1}`, T, 5);

    // ---- porta da rua (junto da parede esquerda)
    const dx = x0 + 22, dw = 140, dt = ch - 330;
    s += porta(dx, dw, dt, ch, piso);
    // ---- janelas com cortina, bem espaçadas
    for (const jx of JANELAS) s += janela(jx, topo + 150, 200, 270);
    // tomadas
    for (const tx of [2060, 3000]) s += r(tx, ch - 56, 22, 30, '#FFFFFF', 6, 3) + fe(tx + 7, ch - 41, 2.2, 3, T) + fe(tx + 15, ch - 41, 2.2, 3, T);
    return s;
  }

  function porta(dx, dw, dt, ch, piso) {
    let s = r(dx - 16, dt - 18, dw + 32, ch - dt + 18, COR.creme, 6, 5);
    s += fr(dx - 10, dt - 12, 6, ch - dt + 10, '#fff', 3, .6);
    s += r(dx, dt, dw, ch - dt + 2, COR.mad1, 4, 5);
    s += fr(dx + dw - 20, dt + 4, 16, ch - dt - 6, tom(COR.mad1, -.15));
    s += l(`M${dx + 10} ${dt + 30} q 8 60 0 120 t 4 150 M${dx + 72} ${dt + 10} q -6 80 2 160 t -2 150 M${dx + 108} ${dt + 40} q 6 50 -2 110`, tom(COR.mad1, -.12), 2.5);
    for (const [px, py, pw, ph] of [[dx + 18, dt + 22, 44, 132], [dx + 74, dt + 22, 44, 132], [dx + 18, dt + 176, 44, 124], [dx + 74, dt + 176, 44, 124]]) {
      s += r(px, py, pw, ph, tom(COR.mad1, .12), 6, 3.5) + fr(px + 4, py + ph - 14, pw - 8, 10, tom(COR.mad1, -.08), 4);
    }
    s += c(dx + dw / 2, dt + 12, 4.5, COR.amarelo, 2.5);
    s += r(dx + dw - 30, dt + 150, 16, 46, COR.amarelo, 7, 3.5) + c(dx + dw - 22, dt + 164, 9, COR.amarelo2, 4) + fe(dx + dw - 25, dt + 161, 3, 2.5, '#fff', .7);
    s += fe(dx + dw - 22, dt + 186, 2.5, 4, T);
    s += brilho(dx + 34, dt + 60, 8, 40, 0, .25);
    // capacho listrado com franjinha
    s += l(`M${dx - 4} ${piso - 24} h -10 M${dx - 4} ${piso - 16} h -12 M${dx - 4} ${piso - 8} h -14 M${dx + dw + 4} ${piso - 24} h 10 M${dx + dw + 4} ${piso - 16} h 12 M${dx + dw + 4} ${piso - 8} h 14`, '#F2D68A', 3.5);
    s += p(`M${dx} ${piso - 30} H${dx + dw} L${dx + dw + 8} ${piso - 2} H${dx - 8} Z`, COR.coral, 4);
    s += l(`M${dx - 2} ${piso - 21} H${dx + dw + 2} M${dx - 5} ${piso - 11} H${dx + dw + 5}`, COR.amarelo2, 4);
    // interruptor ao lado da porta
    s += r(dx + dw + 30, ch - 220, 24, 36, '#FFFFFF', 6, 3) + r(dx + dw + 37, ch - 212, 10, 18, '#E9E0F3', 3, 2.5);
    return s;
  }

  /** janela centrada em cx, com vidro ww x wh a partir de wy, babado e cortinas coral de bolinhas */
  function janela(cx, wy, ww, wh) {
    const wx = cx - ww / 2, k = ww / 140, kv = wh / 196;
    let s = r(wx - 12, wy - 12, ww + 24, wh + 24, COR.creme, 10, 5);
    s += r(wx, wy, ww, wh, '#BFE8FF', 6, 4);
    s += f(`M${wx + 3} ${wy + wh - 70} Q${n(wx + ww * .3)} ${wy + wh - 120} ${n(wx + ww * .58)} ${wy + wh - 80} Q${n(wx + ww * .8)} ${wy + wh - 108} ${wx + ww - 3} ${wy + wh - 84} V${wy + wh - 3} H${wx + 3} Z`, '#8FD87E');
    s += f(`M${wx + 3} ${wy + wh - 34} Q${n(wx + ww * .5)} ${wy + wh - 60} ${wx + ww - 3} ${wy + wh - 40} V${wy + wh - 3} H${wx + 3} Z`, '#76C965');
    s += fe(wx + ww * .74, wy + 44, 22, 9, '#fff') + fe(wx + ww * .66, wy + 37, 13, 9, '#fff') + fe(wx + ww * .22, wy + 60, 14, 6, '#fff');
    s += fe(wx + ww * .28, wy + wh - 96, 16, 14, '#5CC84A') + l(`M${n(wx + ww * .28)} ${wy + wh - 84} V${wy + wh - 64}`, COR.mad3, 4);
    s += fe(wx + ww * .84, wy + 92, 12, 12, COR.amarelo2, .9);
    s += l(`M${cx} ${wy} V${wy + wh} M${wx} ${wy + wh / 2} H${wx + ww}`, COR.creme, 9);
    s += l(`M${cx - 4.5} ${wy} V${wy + wh} M${cx + 4.5} ${wy} V${wy + wh} M${wx} ${wy + wh / 2 - 4.5} H${wx + ww} M${wx} ${wy + wh / 2 + 4.5} H${wx + ww}`, T, 2.5);
    s += brilho(wx + 30, wy + 40, 7, 32, 25, .55) + brilho(cx + 36, wy + wh / 2 + 44, 6, 22, 25, .45);
    s += r(wx - 22, wy + wh + 6, ww + 44, 16, COR.creme, 6, 4.5) + fr(wx - 16, wy + wh + 22, ww + 32, 6, T, 0, .08);
    const rod = wy - 30;
    const cortina = lado => {
      const X = v => n(cx + lado * v * k), Y = v => n(rod + v * kv);
      const d = `M${X(96)} ${rod} H${X(46)} Q${X(52)} ${Y(90)} ${X(66)} ${Y(150)} Q${X(56)} ${Y(200)} ${X(62)} ${Y(262)} H${X(102)} Q${X(98)} ${Y(210)} ${X(92)} ${Y(150)} Q${X(98)} ${Y(80)} ${X(96)} ${rod} Z`;
      let a = p(d, COR.coral, 5);
      a += f(`M${X(80)} ${rod + 4} Q${X(78)} ${Y(90)} ${X(84)} ${Y(150)} Q${X(84)} ${Y(210)} ${X(88)} ${Y(258)} H${X(100)} Q${X(98)} ${Y(210)} ${X(92)} ${Y(150)} Q${X(98)} ${Y(80)} ${X(94)} ${rod + 4} Z`, tom(COR.coral, -.15));
      a += l(`M${X(64)} ${Y(10)} Q${X(66)} ${Y(80)} ${X(74)} ${Y(140)} M${X(74)} ${Y(170)} Q${X(72)} ${Y(220)} ${X(76)} ${Y(255)}`, tom(COR.coral, -.2), 3);
      for (const [vx, vy] of [[60, 30], [84, 60], [68, 100], [86, 126], [72, 190], [90, 222], [70, 240]]) a += fe(X(vx), Y(vy), 5, 5, COR.creme);
      a += r(Math.min(+X(54), +X(100)), +Y(150) - 8, 46 * k, 16, COR.amarelo2, 8, 4);
      a += c(X(77), Y(150), 8, COR.amarelo, 3.5);
      return a;
    };
    s += cortina(-1) + cortina(1);
    const hw = 108 * k;
    s += l(`M${n(cx - hw - 2)} ${rod} H${n(cx + hw + 2)}`, T, 10) + l(`M${n(cx - hw)} ${rod} H${n(cx + hw)}`, COR.mad2, 5);
    s += c(cx - hw - 6, rod, 9, COR.amarelo2, 4) + c(cx + hw + 6, rod, 9, COR.amarelo2, 4);
    const bw = 104 * k, nb = 8;
    let bab = `M${n(cx - bw)} ${rod - 4} H${n(cx + bw)} V${rod + 20}`;
    for (let j = 0; j < nb; j++) bab += ` Q${n(cx + bw - (j + .5) * 2 * bw / nb)} ${rod + 40} ${n(cx + bw - (j + 1) * 2 * bw / nb)} ${rod + 20}`;
    s += p(bab + ' Z', COR.amarelo2, 4.5) + l(`M${n(cx - bw + 4)} ${rod + 7} H${n(cx + bw - 4)}`, COR.amarelo, 3);
    return s;
  }

  // ================================================================ montagem
  const JANELAS = [1080, 2440, 3220];
  const SOFA = 1600;
  CASA.partes.sala = {
    fundo,
    objetos(L) {
      const y = L.piso;
      let s = '';
      // parede
      s += em(L.x0 + 92, y - 410, 1, prateleira());
      s += em(SOFA, y - 420, 1, relogio());
      s += em(1860, y - 440, 1, quadroPaisagem());
      s += em(2830, y - 470, 1.15, quadroFlor());
      // cantinho de estar (de trás para a frente)
      s += em(SOFA + 60, y, 1, tapete());
      s += em(SOFA - 122, y - 8, 1, luminaria());
      s += em(SOFA, y - 2, 1, sofa());
      return s;
    },
    catalogo: { sofa, poltrona, pufe, tapete, luminaria, ventilador, rede, rack, tv, estante, aquario, planta, relogio, quadroPaisagem, quadroFlor, prateleira },
    // para quem for pôr os bichos: onde a Pipoca senta e o espaço livre no tapete
    lugares: { assento: { x: SOFA, y: BAIXO_PISO - 152 }, tapete: { x0: SOFA - 160, x1: SOFA + 300, y: BAIXO_PISO + 16 } },
  };
})();
