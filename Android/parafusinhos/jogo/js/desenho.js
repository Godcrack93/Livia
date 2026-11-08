// Desenho do Parafusinhos (spec §7.3–§7.5 e §7.13): layout do canvas, sprites em cache e a cena
// animada. Tudo na cena é calculado a partir do relógio: cada parafuso, caixa e placa sabe onde está
// em qualquer instante. Assim várias animações correm juntas e um toque novo nunca espera o anterior.
(function (P) {
  'use strict';

  const G = P.Geometria;

  // ---------------------------------------------------------------- paleta (§7.2)

  const CORES = ['#E53950', '#2F7BF5', '#FFC531', '#2FB866', '#9B5DE5', '#FF8A2A', '#FF5DB1', '#18C3C9', '#9C6B4E'];
  const SIMBOLOS = ['circulo', 'quadrado', 'triangulo', 'losango', 'estrela', 'coracao', 'mais', 'hexagono', 'xis'];
  const TINTAS = ['#FF9AA8', '#FFC08A', '#FFE38A', '#9EE6A8', '#8FD0FF', '#C2A8FF', '#7FE3D4', '#F7B5E0'];
  const ALFA_PLACA = 0.78;
  const TINTA_SUAVE = '#5B6694';
  const VERDE = '#2FB866';
  const DOURADO = '#FFC531';
  const LARANJA = '#FF9F1C';
  const VERMELHO = '#FF4D4F';
  const FONTE = "600 13px Fredoka, system-ui, sans-serif";

  // Durações em ms (§7.5). Com pularAnimacoes(true) todas viram 0.
  const T = {
    desparafusar: 140, voo: 340, quique: 120, folgaCaixa: 40, queda: 80,
    esperaTampa: 60, tampa: 150, carimbo: 120, pausa: 90, sai: 250, entra: 250,
    pulo: 300, esperaPulo: 60, esperaCompacta: 80, compacta: 200,
    treme: 260, pisca: 600, tremeBandeja: 320,
    volta: 280, aparafusar: 120, surgePlaca: 180, ajuste: 220, surge: 240,
    entrada: 40, extra: 300, faiscas: 550, confete: 2200, caiCalmo: 260,
  };
  const T_NORMAL = Object.assign({}, T);
  // Com "reduzir movimento" no sistema: as mesmas respostas (sons, pousos, certinho), mais curtas
  // e sem deslocamentos grandes (placas somem no lugar, caixas aparecem sem deslizar, sem confete).
  const T_CALMO = {
    desparafusar: 70, voo: 200, quique: 90, tampa: 110, carimbo: 100, pausa: 60, sai: 160, entra: 160,
    pulo: 200, compacta: 140, volta: 180, aparafusar: 70, ajuste: 150, surge: 160, extra: 200, faiscas: 400,
  };
  const GRAVIDADE = 28; // u/s², queda das placas
  const CICLO_ONDA = 1100; // ms entre dois toques da mãozinha (as ondas seguem o mesmo ritmo)
  // Silhueta da mãozinha em círculos [x, y, raio] (frações do tamanho), para ela não tapar parafusos.
  const PONTOS_MAO = [[0, 0.3, 0.12], [0.13, 0.6, 0.27], [-0.08, 0.92, 0.13], [0.34, 0.92, 0.13]];

  // ---------------------------------------------------------------- utilidades

  const agora = () => performance.now();
  const lim01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const limitar = (v, a, b) => (v < a ? a : v > b ? b : v);
  const prog = (t, t0, d) => (d > 0 ? lim01((t - t0) / d) : t >= t0 ? 1 : 0);
  const suave = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(2 - 2 * p, 3) / 2);
  const saida = (p) => 1 - Math.pow(1 - p, 3);
  const entrada = (p) => p * p * p;
  // Passa um pouco do ponto e volta (ease-out-back).
  function mola(p) {
    const q = p - 1;
    return 1 + 2.70158 * q * q * q + 1.70158 * q * q;
  }
  // Quique do pouso: 1 → 1,12 → 1.
  const quique = (p) => (p <= 0 || p >= 1 ? 1 : 1 + 0.12 * Math.sin(Math.PI * p));

  function rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  function misturar(hex, alvo, f, alfa) {
    const a = rgb(hex);
    const b = rgb(alvo);
    const c = [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * f));
    return alfa === undefined ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + alfa + ')';
  }
  const escurecer = (hex, f, alfa) => misturar(hex, '#000000', f, alfa);
  const clarear = (hex, f, alfa) => misturar(hex, '#FFFFFF', f, alfa);

  // Tons derivados de cada cor de parafuso (calculados uma vez).
  const TONS = CORES.map((c) => ({
    base: c,
    anel: escurecer(c, 0.35),
    claro: clarear(c, 0.5),
    fundo: escurecer(c, 0.22),
    fenda: escurecer(c, 0.55),
    caixa: clarear(c, 0.75),
    borda: escurecer(c, 0.15),
    poco: escurecer(c, 0.3, 0.32),
    marca: escurecer(c, 0.15, 0.45),
    tampa: clarear(c, 0.18),
  }));

  // Contorno arredondado (sem beginPath: dá para somar a outro caminho).
  function retArredondado(g, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function circulo(g, x, y, r) {
    g.moveTo(x + r, y);
    g.arc(x, y, r, 0, Math.PI * 2);
  }
  function poligono(g, pts, s, ang) {
    const c = Math.cos(ang || 0);
    const sn = Math.sin(ang || 0);
    for (let i = 0; i < pts.length; i++) {
      const x = (pts[i][0] * c - pts[i][1] * sn) * s;
      const y = (pts[i][0] * sn + pts[i][1] * c) * s;
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.closePath();
  }
  function estrela(g, s, pontas, interno) {
    for (let i = 0; i < pontas * 2; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / pontas;
      const r = i % 2 ? s * interno : s;
      if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
  }

  const MAIS = [[-0.3, -0.92], [0.3, -0.92], [0.3, -0.3], [0.92, -0.3], [0.92, 0.3], [0.3, 0.3], [0.3, 0.92],
    [-0.3, 0.92], [-0.3, 0.3], [-0.92, 0.3], [-0.92, -0.3], [-0.3, -0.3]];

  // Símbolo de cada cor (modo "Símbolos nas cores"), centrado na origem, raio s.
  function caminhoSimbolo(g, tipo, s) {
    g.beginPath();
    switch (tipo) {
      case 'circulo': circulo(g, 0, 0, s * 0.8); break;
      case 'quadrado': retArredondado(g, -s * 0.72, -s * 0.72, s * 1.44, s * 1.44, s * 0.18); break;
      case 'triangulo': poligono(g, [[0, -0.98], [0.92, 0.66], [-0.92, 0.66]], s); break;
      case 'losango': poligono(g, [[0, -1.02], [0.78, 0], [0, 1.02], [-0.78, 0]], s); break;
      case 'estrela': estrela(g, s * 1.02, 5, 0.46); break;
      case 'coracao':
        g.moveTo(0, s * 0.86);
        g.bezierCurveTo(-s * 1.2, 0, -s * 0.72, -s * 1.04, 0, -s * 0.38);
        g.bezierCurveTo(s * 0.72, -s * 1.04, s * 1.2, 0, 0, s * 0.86);
        g.closePath();
        break;
      case 'mais': poligono(g, MAIS, s); break;
      case 'hexagono': estrela(g, s * 0.9, 3, 1); break;
      case 'xis': poligono(g, MAIS, s, Math.PI / 4); break;
    }
  }

  // ---------------------------------------------------------------- estado do módulo

  let tela = null;
  let ctx = null;
  let dpr = 1;
  let escalaX = 1; // px do canvas por px CSS (≈ dpr, ajustado ao arredondamento)
  let escalaY = 1;
  let medida = ''; // tamanho que gerou os sprites atuais
  let L = null; // layout atual
  let nivel = null;
  let ritmo = 1; // 0 = sem animações (testes)
  let calmo = false; // o sistema pede movimento reduzido
  let simbolos = false;
  let reservaTopo = 0; // px que o balão do tutorial ocupa no alto do tabuleiro
  let aoMomento = null;
  let raf = 0;
  let reserva = 0; // relógio de reserva (ver quadroReserva)
  let ultimoQuadro = 0;
  let larguraSeguir = 0; // largura do texto "a seguir" (medida de novo quando a fonte chega)

  // Sprites (refeitos quando muda o tamanho, a fase ou o modo de símbolos).
  let R0 = 10; // raio em que os sprites de parafuso são desenhados (px CSS)
  let TAM = 24; // lado desses sprites
  let sprParafusos = [];
  let sprBrilho = null;
  let sprSombra = null;
  let sprPlacas = [];
  let sprContornos = [];
  let sprMadeira = null;
  let sprMao = null;

  // Cena.
  let parafusos = [];
  let placas = [];
  let slots = [];
  let porFila = new Map(); // fila → caixa visual
  let bandeja = []; // entradas { id, tSai } na ordem da bandeja
  let saidaDoSlot = []; // quando a última caixa de cada slot começou a sair (para a próxima entrar)
  let pressaDoSlot = []; // fator (≤ 1) que encurta a troca de caixa quando a tela está atrasada
  let proximaBase = 0;
  let extra = 0;
  let tExtra = -Infinity;
  let tTremeBandeja = -Infinity;
  let pulsoBandeja = false;
  let ondasIds = [];
  let maoId = -1; // parafuso que a mãozinha do tutorial aponta (-1 = sem mão)
  let tMao = Infinity; // quando a mão começa a aparecer
  let maoAng = 0; // direção do punho (radianos), escolhida para não tapar outros parafusos
  let brilhos = [];
  let piscadas = [];
  let faiscas = [];
  let confetes = [];
  let tConfete = -Infinity;
  let momentos = [];
  let aoAssentar = [];
  let ocupadoAte = 0;

  // Objetos de rascunho (evitam alocação a cada quadro).
  const PT = { x: 0, y: 0, r: 0, giro: 0, elev: 0 };
  const DST = { x: 0, y: 0, r: 0 };
  const CX = { x: 0, y: 0, alfa: 1, esc: 1 };

  const dur = (ms) => ms * ritmo;
  let sujo = false; // algo foi agendado: quando tudo assentar, limpar o que terminou
  const ate = (t) => {
    if (t > ocupadoAte) ocupadoAte = t;
    sujo = true;
  };

  // ---------------------------------------------------------------- layout (§7.3)

  function calcularLayout(W, H) {
    const l = { W, H };
    // Caixas: duas vagas centradas, com a alça por cima.
    const hCaixas = limitar(0.2 * W, 70, 100);
    const cw = Math.min((W - 48) / 2, 168);
    const alca = Math.round(hCaixas * 0.13);
    const ch = Math.min(0.62 * cw, hCaixas - alca - 8);
    const n = nivel.ativas;
    const x0 = (W - (n * cw + (n - 1) * 16)) / 2;
    l.caixa = { w: cw, h: ch, raio: Math.min(14, ch * 0.3), alca };
    l.slots = [];
    for (let i = 0; i < n; i++) l.slots.push({ x: x0 + i * (cw + 16), y: 6 + alca });
    l.rCaixa = Math.min(ch * 0.25, cw * 0.1);
    l.passoCaixa = Math.min(cw * 0.28, l.rCaixa * 2.9);
    l.yFuro = ch * 0.56;
    let y = 6 + hCaixas;
    // "a seguir": só existe se a fila tem mais caixas que as vagas (não muda no meio da fase).
    l.seguir = null;
    if (nivel.caixas.length > nivel.ativas) {
      l.seguir = { y: y + 10 };
      y += 22;
    }
    y += 4;
    // Bandeja: cabe sempre 6 vagas (a sexta é o espaço extra).
    const hb = limitar(0.15 * W, 52, 68);
    const rv = Math.min((hb - 14) / 2, ((W - 36) / 6 - 8) / 2);
    l.bandeja = { y, h: hb, cy: y + hb / 2, rv, passo: 2 * rv + 8 };
    l.rBandeja = rv - 4;
    y += hb + 8;
    // Tabuleiro: o resto, com a fase centrada e o maior tamanho que couber.
    l.tab = { x: 12, y, w: W - 24, h: Math.max(60, H - y - 10) };
    const lim = G.limitesNivel(nivel);
    const bx0 = lim.x0 - 0.6;
    const by0 = lim.y0 - 0.6;
    const bw = lim.x1 - lim.x0 + 1.2;
    const bh = lim.y1 - lim.y0 + 1.2;
    const unidade = (res) => Math.max(6, Math.min((l.tab.w - 8) / bw, (l.tab.h - 8 - res) / bh, 76));
    // O balão do tutorial fica no alto do tabuleiro sem tapar nenhum parafuso: a faixa vazia em
    // volta da fase (0,6u) pode ficar embaixo dele. u depende da reserva, então são duas passadas.
    let reserva = 0;
    let u = unidade(0);
    if (reservaTopo > 0) {
      const teto = l.tab.h * 0.4;
      reserva = Math.max(0, Math.min(reservaTopo - 0.45 * unidade(Math.min(reservaTopo, teto)), teto));
      u = unidade(reserva);
    }
    l.u = u;
    l.ox = l.tab.x + (l.tab.w - bw * u) / 2 - bx0 * u;
    l.oy = l.tab.y + reserva + (l.tab.h - reserva - bh * u) / 2 - by0 * u;
    l.rParafuso = 0.27 * u;
    l.alcance = Math.max(0.55 * u, 24);
    return l;
  }

  // ---------------------------------------------------------------- sprites

  function novoCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * dpr));
    c.height = Math.max(1, Math.ceil(h * dpr));
    return c;
  }

  // Contexto com a origem no centro do sprite de parafuso.
  function pincelCentro(c) {
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, (TAM / 2) * dpr, (TAM / 2) * dpr);
    return g;
  }

  function criarSprites() {
    R0 = Math.max(10, Math.ceil(Math.max(L.rParafuso, L.rCaixa, L.rBandeja) * 1.3));
    TAM = 2 * R0 + 4;
    criarSpritesParafusos();
    sprSombra = criarSombra();
    sprPlacas = nivel.placas.map(criarSpritePlaca);
    sprContornos = [];
    sprMadeira = criarMadeira();
    sprMao = criarMao();
  }

  // Parafuso (§7.4): anel escuro, cabeça com degradê, fenda Phillips (ou símbolo) e reflexo.
  // A fenda fica num sprite separado porque gira ao desparafusar; o reflexo não gira.
  function criarSpritesParafusos() {
    sprBrilho = novoCanvas(TAM, TAM);
    const gb = pincelCentro(sprBrilho);
    const rb = R0 * 0.84;
    gb.save();
    gb.translate(-0.33 * rb, -0.42 * rb);
    gb.rotate(-0.6);
    gb.scale(1, 0.52);
    gb.beginPath();
    circulo(gb, 0, 0, rb * 0.32);
    gb.restore();
    gb.fillStyle = 'rgba(255,255,255,.55)';
    gb.fill();

    sprParafusos = TONS.map((tom, i) => {
      const cabeca = novoCanvas(TAM, TAM);
      const g = pincelCentro(cabeca);
      g.beginPath();
      circulo(g, 0, 0, R0);
      g.fillStyle = tom.anel;
      g.fill();
      const r = R0 * 0.84;
      const grad = g.createRadialGradient(-0.38 * r, -0.42 * r, 0, 0, 0, r * 1.06);
      grad.addColorStop(0, tom.claro);
      grad.addColorStop(0.5, tom.base);
      grad.addColorStop(1, tom.fundo);
      g.beginPath();
      circulo(g, 0, 0, r);
      g.fillStyle = grad;
      g.fill();

      const fenda = novoCanvas(TAM, TAM);
      const gf = pincelCentro(fenda);
      if (simbolos) {
        caminhoSimbolo(gf, SIMBOLOS[i], R0 * 0.5);
        gf.lineJoin = 'round';
        gf.lineWidth = Math.max(2.2, R0 * 0.16);
        gf.strokeStyle = 'rgba(27,31,59,.85)';
        gf.stroke();
        gf.fillStyle = '#fff';
        gf.fill();
      } else {
        const larg = r * 0.27;
        const meio = (r * 1.12 - larg) / 2;
        gf.lineCap = 'round';
        gf.lineWidth = larg;
        for (const [cor, dy] of [['rgba(255,255,255,.5)', Math.max(1, R0 * 0.06)], [tom.fenda, 0]]) {
          gf.beginPath();
          gf.moveTo(-meio, dy);
          gf.lineTo(meio, dy);
          gf.moveTo(0, dy - meio);
          gf.lineTo(0, dy + meio);
          gf.strokeStyle = cor;
          gf.stroke();
        }
      }

      const inteiro = novoCanvas(TAM, TAM);
      const gi = inteiro.getContext('2d');
      gi.drawImage(cabeca, 0, 0);
      gi.drawImage(fenda, 0, 0);
      gi.drawImage(sprBrilho, 0, 0);
      return { cabeca, fenda, inteiro };
    });
  }

  function criarSombra() {
    const c = novoCanvas(48, 48);
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const grad = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    grad.addColorStop(0, 'rgba(40,24,40,.36)');
    grad.addColorStop(0.5, 'rgba(40,24,40,.22)');
    grad.addColorStop(1, 'rgba(40,24,40,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 48, 48);
    return c;
  }

  // Mãozinha do tutorial: luva branca apontando com o indicador, contorno azul-escuro e punho
  // azul. Medidas em frações do tamanho S; a ponta do dedo fica na origem e o punho para baixo.
  function formaMao(g, S, e) {
    const peca = (x, y, w, h, r) => retArredondado(g, (x - e) * S, (y - e) * S, (w + 2 * e) * S, (h + 2 * e) * S, (r + e) * S);
    peca(-0.1, 0, 0.2, 0.6, 0.1); // indicador
    peca(-0.15, 0.36, 0.57, 0.5, 0.16); // mão fechada
    peca(0.075, 0.3, 0.125, 0.22, 0.062); // dedos dobrados (do maior para o mindinho)
    peca(0.19, 0.33, 0.12, 0.2, 0.06);
    peca(0.3, 0.375, 0.115, 0.18, 0.057);
    g.save();
    g.translate(-0.1 * S, 0.66 * S);
    g.rotate(-0.85);
    peca(-0.07, -0.25, 0.14, 0.3, 0.07); // polegar
    g.restore();
  }

  function criarMao() {
    const S = Math.round(limitar(4.4 * L.rParafuso, 40, 62));
    const ox = 0.42 * S;
    const oy = 0.1 * S;
    const c = novoCanvas(1.02 * S, 1.24 * S);
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
    const borda = 0.055;
    const punho = (e) => retArredondado(g, (-0.18 - e) * S, (0.8 - e) * S, (0.63 + 2 * e) * S, (0.2 + 2 * e) * S, (0.07 + e) * S);
    // Contorno: a silhueta inteira um pouco maior, pintada de azul-escuro, com a sombra.
    g.save();
    g.shadowColor = 'rgba(70,35,10,.32)';
    g.shadowBlur = 0.07 * S * dpr;
    g.shadowOffsetY = 0.05 * S * dpr;
    g.beginPath();
    formaMao(g, S, borda);
    punho(borda);
    g.fillStyle = '#2B3467';
    g.fill();
    g.restore();
    g.beginPath();
    formaMao(g, S, 0);
    const luva = g.createLinearGradient(-0.2 * S, 0, 0.45 * S, 0.8 * S);
    luva.addColorStop(0, '#FFFFFF');
    luva.addColorStop(0.55, '#FFFFFF');
    luva.addColorStop(1, '#DCE4F5');
    g.fillStyle = luva;
    g.fill();
    // Vincos entre os dedos dobrados e o do polegar.
    g.lineCap = 'round';
    g.lineWidth = Math.max(1.2, 0.035 * S);
    g.strokeStyle = 'rgba(43,52,103,.45)';
    g.beginPath();
    g.moveTo(0.19 * S, 0.43 * S);
    g.lineTo(0.19 * S, 0.5 * S);
    g.moveTo(0.3 * S, 0.45 * S);
    g.lineTo(0.3 * S, 0.52 * S);
    g.moveTo(-0.02 * S, 0.62 * S);
    g.quadraticCurveTo(0.04 * S, 0.68 * S, 0.12 * S, 0.68 * S);
    g.stroke();
    // Punho da manga (com o próprio contorno, por cima da luva).
    g.beginPath();
    punho(borda);
    g.fillStyle = '#2B3467';
    g.fill();
    g.beginPath();
    punho(0);
    g.fillStyle = '#4A90F7';
    g.fill();
    g.beginPath();
    retArredondado(g, -0.13 * S, 0.83 * S, 0.53 * S, 0.05 * S, 0.025 * S);
    g.fillStyle = 'rgba(255,255,255,.45)';
    g.fill();
    return { c, S, ox, oy, w: 1.02 * S, h: 1.24 * S };
  }

  // Forma da placa: partes fechadas = polígono preenchido + traço; abertas = traço redondo.
  function tracarForma(g, q, larg, cor) {
    const u = L.u;
    g.fillStyle = cor;
    g.strokeStyle = cor;
    g.lineWidth = larg;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const parte of q.partes) {
      const p = parte.pontos;
      g.beginPath();
      if (p.length === 1) {
        circulo(g, p[0][0] * u, p[0][1] * u, larg / 2);
        g.fill();
        continue;
      }
      g.moveTo(p[0][0] * u, p[0][1] * u);
      for (let i = 1; i < p.length; i++) g.lineTo(p[i][0] * u, p[i][1] * u);
      if (parte.fechado) {
        g.closePath();
        g.fill();
      }
      g.stroke();
    }
  }

  // Caixa (px CSS, relativa à origem da grade) que contém a placa com uma folga.
  function caixaPlaca(q, folga) {
    const u = L.u;
    const lim = G.limitesPlaca(q);
    const x = lim.x0 * u - folga;
    const y = lim.y0 * u - folga;
    return { x, y, w: (lim.x1 - lim.x0) * u + 2 * folga, h: (lim.y1 - lim.y0) * u + 2 * folga };
  }

  function pincelPlaca(c, cx) {
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, -cx.x * dpr, -cx.y * dpr);
    return g;
  }

  // Relevo: a sobra da forma menos ela mesma deslocada vira uma borda de luz (ou de sombra).
  function relevo(g, q, cx, larg, d, cor) {
    const c = novoCanvas(cx.w, cx.h);
    const t = pincelPlaca(c, cx);
    tracarForma(t, q, larg, cor);
    t.globalCompositeOperation = 'destination-out';
    t.translate(d, d);
    tracarForma(t, q, larg, '#000');
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(c, 0, 0);
    g.restore();
  }

  // Placa (§7.4): tinta opaca, contorno 30% mais escuro, relevo, brilho no alto à esquerda e os
  // furos vazados com um anel escuro. É desenhada com alfa 0,78 para mostrar o que está embaixo.
  function criarSpritePlaca(q) {
    const u = L.u;
    const cx = caixaPlaca(q, 4 + 0.3 * u);
    const c = novoCanvas(cx.w, cx.h);
    const g = pincelPlaca(c, cx);
    const tinta = TINTAS[q.tinta];
    const larg = 2 * q.raio * u;
    // Sombra macia só do lado de fora: separa a placa da madeira e das placas de baixo.
    const forma = novoCanvas(cx.w, cx.h);
    tracarForma(pincelPlaca(forma, cx), q, larg, '#000');
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.shadowColor = 'rgba(70,35,10,.4)';
    g.shadowBlur = 0.14 * u * dpr; // o desfoque e o deslocamento da sombra não seguem a escala
    g.shadowOffsetX = 0.03 * u * dpr;
    g.shadowOffsetY = 0.08 * u * dpr;
    g.drawImage(forma, 0, 0);
    g.shadowColor = 'transparent';
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(forma, 0, 0);
    g.restore();
    tracarForma(g, q, larg, escurecer(tinta, 0.3));
    tracarForma(g, q, larg - 4, tinta);
    const d = Math.max(1.5, 0.07 * u);
    relevo(g, q, cx, larg - 4, d, 'rgba(255,255,255,.6)');
    relevo(g, q, cx, larg - 4, -d * 0.8, 'rgba(70,30,40,.13)');
    g.globalCompositeOperation = 'source-atop';
    const brilho = g.createRadialGradient(cx.x, cx.y, 0, cx.x, cx.y, Math.min(Math.max(cx.w, cx.h) * 0.8, 3.2 * u));
    brilho.addColorStop(0, 'rgba(255,255,255,.42)');
    brilho.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = brilho;
    g.fillRect(cx.x, cx.y, cx.w, cx.h);
    g.globalCompositeOperation = 'destination-out';
    const ids = nivel.parafusosDaPlaca[q.id];
    g.beginPath();
    for (const id of ids) circulo(g, nivel.parafusos[id].x * u, nivel.parafusos[id].y * u, 0.2 * u);
    g.fill();
    g.globalCompositeOperation = 'source-over';
    const lw = Math.max(1.2, 0.05 * u);
    g.lineWidth = lw;
    g.strokeStyle = escurecer(tinta, 0.45);
    g.beginPath();
    for (const id of ids) circulo(g, nivel.parafusos[id].x * u, nivel.parafusos[id].y * u, 0.2 * u + lw / 2);
    g.stroke();
    return { c, x: cx.x, y: cx.y, w: cx.w, h: cx.h };
  }

  // Contorno luminoso em volta da placa (branco: placas que prendem o parafuso tocado; dourado:
  // a placa que o tutorial manda soltar). A borda escura fina garante contraste com a madeira.
  function contorno(i, cor) {
    const chave = i + cor;
    if (sprContornos[chave]) return sprContornos[chave];
    const q = nivel.placas[i];
    const cx = caixaPlaca(q, 16);
    const c = novoCanvas(cx.w, cx.h);
    const g = pincelPlaca(c, cx);
    const larg = 2 * q.raio * L.u;
    const anel = novoCanvas(cx.w, cx.h);
    const ta = pincelPlaca(anel, cx);
    tracarForma(ta, q, larg + 11, 'rgba(43,52,103,.6)');
    ta.globalCompositeOperation = 'destination-out';
    tracarForma(ta, q, larg + 8, '#000');
    g.shadowColor = cor;
    g.shadowBlur = 10 * dpr; // o desfoque da sombra não acompanha a escala do contexto
    tracarForma(g, q, larg + 8, cor);
    g.shadowColor = 'transparent';
    g.globalCompositeOperation = 'destination-out';
    tracarForma(g, q, larg - 2, '#000');
    g.globalCompositeOperation = 'source-over';
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(anel, 0, 0);
    sprContornos[chave] = { c, x: cx.x, y: cx.y, w: cx.w, h: cx.h };
    return sprContornos[chave];
  }

  // Painel de madeira (§7.2): moldura, veios e os furinhos da grade, prolongada até as bordas.
  function criarMadeira() {
    const tb = L.tab;
    const folga = 16;
    const c = novoCanvas(tb.w + 2 * folga, tb.h + 2 * folga);
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, (folga - tb.x) * dpr, (folga - tb.y) * dpr);
    g.save();
    g.shadowColor = 'rgba(43,52,103,.22)';
    g.shadowBlur = 14 * dpr;
    g.shadowOffsetY = 5 * dpr;
    g.beginPath();
    retArredondado(g, tb.x, tb.y, tb.w, tb.h, 22);
    g.fillStyle = '#B7834D';
    g.fill();
    g.restore();

    g.save();
    g.beginPath();
    retArredondado(g, tb.x + 4, tb.y + 4, tb.w - 8, tb.h - 8, 18);
    g.clip();
    const fundo = g.createLinearGradient(0, tb.y, 0, tb.y + tb.h);
    fundo.addColorStop(0, '#EDCB9C');
    fundo.addColorStop(0.5, '#E8C28F');
    fundo.addColorStop(1, '#E1B782');
    g.fillStyle = fundo;
    g.fillRect(tb.x, tb.y, tb.w, tb.h);
    veios(g, tb);
    furinhos(g, tb);
    const sombra = g.createLinearGradient(0, tb.y + 4, 0, tb.y + 18);
    sombra.addColorStop(0, 'rgba(110,62,24,.2)');
    sombra.addColorStop(1, 'rgba(110,62,24,0)');
    g.fillStyle = sombra;
    g.fillRect(tb.x, tb.y, tb.w, 18);
    g.restore();

    g.beginPath();
    retArredondado(g, tb.x + 2, tb.y + 2, tb.w - 4, tb.h - 4, 20);
    g.strokeStyle = '#B7834D';
    g.lineWidth = 4;
    g.stroke();
    g.beginPath();
    retArredondado(g, tb.x + 4.5, tb.y + 4.5, tb.w - 9, tb.h - 9, 17.5);
    g.strokeStyle = 'rgba(255,236,205,.5)';
    g.lineWidth = 1;
    g.stroke();
    return { c, x: tb.x - folga, y: tb.y - folga, w: tb.w + 2 * folga, h: tb.h + 2 * folga };
  }

  // Veios horizontais levemente ondulados; a semente fixa deixa o desenho igual a cada refazer.
  function veios(g, tb) {
    let s = 7;
    const sorte = () => (s = (s * 16807) % 2147483647) / 2147483647;
    g.strokeStyle = 'rgba(212,167,112,.35)';
    g.lineCap = 'round';
    for (let y = tb.y + 8; y < tb.y + tb.h; y += 8 + sorte() * 15) {
      g.lineWidth = 1 + sorte() * 1.8;
      const amp = 1.5 + sorte() * 4;
      const fase = sorte() * 6.28;
      const onda = 0.006 + sorte() * 0.012;
      g.beginPath();
      for (let x = tb.x; x <= tb.x + tb.w + 8; x += 8) {
        const yy = y + Math.sin(x * onda + fase) * amp;
        if (x === tb.x) g.moveTo(x, yy);
        else g.lineTo(x, yy);
      }
      g.stroke();
    }
  }

  function furinhos(g, tb) {
    const u = L.u;
    const r = Math.max(1.6, 0.09 * u);
    const m = 6 + Math.max(r, 0.18 * u);
    const pontos = [];
    for (let j = Math.ceil((tb.y + m - L.oy) / u); L.oy + j * u <= tb.y + tb.h - m; j++) {
      for (let i = Math.ceil((tb.x + m - L.ox) / u); L.ox + i * u <= tb.x + tb.w - m; i++) {
        const x = L.ox + i * u;
        const y = L.oy + j * u;
        if (dentroDoPainel(x, y, tb, 22 - 4, m)) pontos.push(x, y);
      }
    }
    g.beginPath();
    for (let k = 0; k < pontos.length; k += 2) circulo(g, pontos[k], pontos[k + 1], r);
    g.fillStyle = '#7A5230';
    g.fill();
    g.beginPath();
    for (let k = 0; k < pontos.length; k += 2) {
      g.moveTo(pontos[k] + (r + 0.6) * Math.cos(0.15 * Math.PI), pontos[k + 1] + (r + 0.6) * Math.sin(0.15 * Math.PI));
      g.arc(pontos[k], pontos[k + 1], r + 0.6, 0.15 * Math.PI, 0.85 * Math.PI);
    }
    g.strokeStyle = 'rgba(255,240,214,.75)';
    g.lineWidth = 1;
    g.stroke();
  }

  // O ponto cabe dentro do painel arredondado, longe pelo menos m da borda?
  function dentroDoPainel(x, y, tb, raio, m) {
    const x0 = tb.x + raio;
    const x1 = tb.x + tb.w - raio;
    const y0 = tb.y + raio;
    const y1 = tb.y + tb.h - raio;
    const dx = x < x0 ? x0 - x : x > x1 ? x - x1 : 0;
    const dy = y < y0 ? y0 - y : y > y1 ? y - y1 : 0;
    if (!dx || !dy) return true;
    return Math.sqrt(dx * dx + dy * dy) <= raio + 4 - m;
  }

  // ---------------------------------------------------------------- cena

  function novaCaixa(fila, cor, slot) {
    return {
      fila, cor, slot, furos: [], k: 1,
      tEntra: -Infinity, tPronta: -Infinity, tSurge: -Infinity,
      tFecha: Infinity, tSai: Infinity, tFim: Infinity,
    };
  }

  // Cena parada, igual ao estado lógico.
  function montarCena(estado) {
    parafusos = nivel.parafusos.map((s) => ({
      id: s.id, cor: s.cor, placa: s.placa, x: s.x, y: s.y,
      lugar: estado.removido[s.id] ? 'fora' : 'tabuleiro',
      cv: null, furo: -1, ent: null, voo: null,
      tTreme: -Infinity, tSurge: -Infinity,
    }));
    placas = nivel.placas.map((q) => ({ caida: !!estado.caida[q.id], queda: null, tSurge: -Infinity }));
    slots = [];
    saidaDoSlot = [];
    pressaDoSlot = [];
    porFila = new Map();
    estado.slots.forEach((s, i) => {
      slots.push([]);
      saidaDoSlot.push(-Infinity);
      pressaDoSlot.push(1);
      if (!s) return;
      const cv = novaCaixa(s.fila, s.cor, i);
      s.parafusos.forEach((id, k) => {
        cv.furos[k] = id;
        Object.assign(parafusos[id], { lugar: 'caixa', cv, furo: k });
      });
      slots[i].push(cv);
      porFila.set(s.fila, cv);
    });
    bandeja = estado.bandeja.map((id) => {
      const ent = { id, tSai: Infinity };
      Object.assign(parafusos[id], { lugar: 'bandeja', ent });
      return ent;
    });
    proximaBase = estado.proxima;
    extra = estado.extra;
    tExtra = -Infinity;
    piscadas = [];
    faiscas = [];
    tTremeBandeja = -Infinity;
  }

  // Os primeiros instantes da fase: placas aparecem em sequência, parafusos pulam no lugar,
  // caixas deslizam para dentro.
  function animarEntrada(t0) {
    const passo = dur(Math.min(T.entrada, 640 / Math.max(1, placas.length)));
    placas.forEach((q, i) => {
      q.tSurge = t0 + i * passo;
    });
    for (const p of parafusos) if (p.lugar === 'tabuleiro') p.tSurge = t0 + p.placa * passo + dur(90);
    slots.forEach((lista, s) => {
      for (const cv of lista) {
        cv.tEntra = t0 + dur(100 + s * 70);
        cv.tPronta = cv.tEntra + dur(T.entra);
        ate(cv.tPronta);
      }
    });
    ate(t0 + placas.length * passo + dur(90 + T.surge));
  }

  // ---------------------------------------------------------------- posições no tempo

  function posFuroTabuleiro(p, o) {
    o.x = L.ox + p.x * L.u;
    o.y = L.oy + p.y * L.u;
    o.r = L.rParafuso;
  }

  // Posição da caixa (canto superior esquerdo), transparência e escala no instante t.
  function caixaEm(cv, t, o) {
    const S = L.slots[cv.slot];
    o.x = S.x;
    o.y = S.y;
    o.alfa = 1;
    o.esc = 1;
    if (t < cv.tPronta) {
      const q = prog(t, cv.tEntra, cv.tPronta - cv.tEntra);
      if (calmo) {
        o.alfa = q;
      } else {
        o.x += (1 - mola(q)) * L.caixa.w * 0.7;
        o.alfa = lim01(q * 3);
      }
    }
    if (t < cv.tSurge + dur(T.surge)) {
      const q = prog(t, cv.tSurge, dur(T.surge));
      o.esc = 0.8 + 0.2 * mola(q);
      o.alfa *= lim01(q * 2.5);
    }
    if (t >= cv.tSai) {
      const q = prog(t, cv.tSai, dur(T.sai) * cv.k);
      if (!calmo) o.y -= entrada(q) * L.caixa.h * 0.75;
      o.alfa *= 1 - q;
      o.esc *= 1 + 0.08 * q;
    }
  }

  function posFuroCaixa(cv, k, t, o) {
    caixaEm(cv, t, CX);
    o.x = CX.x + L.caixa.w / 2 + (k - 1) * L.passoCaixa;
    o.y = CX.y + L.yFuro;
    o.r = L.rCaixa;
  }

  // Quantas vagas aparecem na bandeja (5 → 6 com o espaço extra, deslizando).
  function capacidadeVisual(t) {
    return nivel.bandeja + (extra ? suave(prog(t, tExtra, dur(T.extra))) : 0);
  }

  function xVaga(v, t) {
    return L.W / 2 + (v - (capacidadeVisual(t) - 1) / 2) * L.bandeja.passo + tremorBandeja(t);
  }

  function tremorBandeja(t) {
    const q = prog(t, tTremeBandeja, dur(T.tremeBandeja));
    return q >= 1 ? 0 : (calmo ? 3 : 7) * Math.sin(q * Math.PI * 8) * (1 - q);
  }

  // Uma entrada ocupa a vaga até pular para a caixa; depois as seguintes deslizam para a esquerda.
  function ocupacao(e, t) {
    if (e.tSai === Infinity) return 1;
    return 1 - suave(prog(t, e.tSai + dur(T.esperaCompacta), dur(T.compacta)));
  }

  function vagaDe(ent, t) {
    let v = 0;
    for (const e of bandeja) {
      if (e === ent) break;
      v += ocupacao(e, t);
    }
    return v;
  }

  function posBandeja(ent, t, o) {
    o.x = xVaga(vagaDe(ent, t), t);
    o.y = L.bandeja.cy;
    o.r = L.rBandeja;
  }

  // Para onde o parafuso vai (o destino é recalculado a cada quadro: a caixa pode estar entrando).
  function posDestino(p, t, o) {
    if (p.lugar === 'caixa') posFuroCaixa(p.cv, p.furo, t, o);
    else if (p.lugar === 'bandeja') posBandeja(p.ent, t, o);
    else posFuroTabuleiro(p, o);
  }

  function origem(p, v, o) {
    if (v.doFuro) {
      posFuroTabuleiro(p, o);
    } else {
      o.x = v.ox;
      o.y = v.oy;
      o.r = v.or;
    }
  }

  // Arco de Bézier de o (origem) até d, com o ponto de controle acima do meio (0,25 × distância).
  function voar(v, t, o, d, esc0, esc1, salto) {
    const q = suave(prog(t, v.tv, v.tL - v.tv));
    const x0 = o.x;
    const y0 = o.y;
    const r0 = o.r;
    const dx = d.x - x0;
    const dy = d.y - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const cx = (x0 + d.x) / 2;
    const cy = (y0 + d.y) / 2 - 0.25 * dist;
    const a = 1 - q;
    o.x = a * a * x0 + 2 * a * q * cx + q * q * d.x;
    o.y = a * a * y0 + 2 * a * q * cy + q * q * d.y;
    const esc = salto ? 1 + salto * Math.sin(Math.PI * q) : esc0 + (esc1 - esc0) * q;
    o.r = (r0 + (d.r - r0) * q) * esc;
    o.giro = 0;
    o.elev = salto ? Math.sin(Math.PI * q) : 1 - q;
  }

  // Desparafusar (gira uma volta no sentido anti-horário, cresce e a sombra aumenta), esperar a
  // caixa se ela ainda não chegou e voar até d.
  function posTirar(p, v, t, o, d) {
    origem(p, v, o);
    const tSolta = v.t0 + dur(T.desparafusar);
    if (t < tSolta) {
      const q = prog(t, v.t0, dur(T.desparafusar));
      o.giro = -2 * Math.PI * suave(q);
      o.r *= 1 + 0.22 * saida(q);
      o.elev = saida(q);
    } else if (t < v.tv) {
      o.r *= 1.22;
      o.y -= 2.5 * Math.sin(((t - tSolta) / 420) * Math.PI);
      o.elev = 1;
    } else {
      voar(v, t, o, d, 1.22, 1, 0);
    }
  }

  // Posição de um parafuso em voo (tirar, pular da bandeja, voltar ao furo, ajustar) no instante t.
  function posVoo(p, t, o) {
    const v = p.voo;
    o.giro = 0;
    o.elev = 0;
    if (v.tipo === 'tirar') {
      posDestino(p, t, DST);
      posTirar(p, v, t, o, DST);
    } else if (v.tipo === 'pulo') {
      if (t < v.tv && v.antes && t < v.antes.tL) {
        // A caixa chegou antes de ele pousar na bandeja: termina esse voo primeiro.
        posBandeja(v.deEnt, t, DST);
        posTirar(p, v.antes, t, o, DST);
        return;
      }
      posBandeja(v.deEnt, Math.min(t, v.tv), o);
      if (t >= v.tv) {
        posDestino(p, t, DST);
        voar(v, t, o, DST, 1, 1, 0.18);
      }
    } else if (v.tipo === 'volta') {
      origem(p, v, o);
      if (t < v.tL) {
        posFuroTabuleiro(p, DST);
        voar(v, t, o, DST, 1, 1.22, 0);
      } else {
        // Chegou: aparafusa de volta (gira no sentido horário e baixa).
        posFuroTabuleiro(p, o);
        const q = prog(t, v.tL, dur(T.aparafusar));
        o.giro = 2 * Math.PI * suave(q);
        o.r *= 1.22 - 0.22 * saida(q);
        o.elev = 1 - q;
      }
    } else {
      origem(p, v, o);
      posDestino(p, t, DST);
      voar(v, t, o, DST, 1, 1, 0.1);
    }
  }

  // Pulo marcado para depois: até lá ele ainda chega na bandeja (voando) ou espera nela.
  const aindaChegando = (v, t) => v.tipo === 'pulo' && t < v.tv && !!v.antes && t < v.antes.tL;

  // Onde o parafuso aparece agora (para o desfazer sair de onde ele está). false se não aparece.
  function posicaoAtual(p, t, o) {
    const v = p.voo;
    if (v && t < v.fim) {
      if (v.tipo === 'pulo' && t < v.tv) {
        if (aindaChegando(v, t)) posVoo(p, t, o);
        else posBandeja(v.deEnt, t, o);
        return true;
      }
      if (v.tipo === 'volta' || t < v.tL) {
        posVoo(p, t, o);
        return true;
      }
    }
    switch (p.lugar) {
      case 'tabuleiro':
        posFuroTabuleiro(p, o);
        return t >= p.tSurge;
      case 'caixa':
        if (t < p.cv.tEntra || t >= p.cv.tFim) return false;
        posFuroCaixa(p.cv, p.furo, t, o);
        return true;
      case 'bandeja':
        posBandeja(p.ent, t, o);
        return true;
      default:
        return false;
    }
  }

  function proximaVisual(t) {
    let pv = proximaBase;
    for (const lista of slots) {
      for (const cv of lista) if (cv.tEntra <= t && cv.fila + 1 > pv) pv = cv.fila + 1;
    }
    return pv;
  }

  // ---------------------------------------------------------------- jogada → animações

  function momento(t, tipo, dados) {
    momentos.push({ t, tipo, dados });
  }

  function tirar(ev, t0) {
    const p = parafusos[ev.parafuso];
    const v = { tipo: 'tirar', t0, tv: 0, tL: 0, fim: 0, doFuro: true, ox: 0, oy: 0, or: 0, deEnt: null };
    // Se ele ainda voltava de um desfazer, sai de onde está desenhado.
    if (p.voo && t0 < p.voo.fim && posicaoAtual(p, t0, PT)) {
      v.doFuro = false;
      v.ox = PT.x;
      v.oy = PT.y;
      v.or = PT.r;
    }
    let tL = t0 + dur(T.desparafusar + T.voo);
    if (ev.para.tipo === 'caixa') {
      const cv = porFila.get(ev.para.fila);
      // A caixa pode ainda estar entrando: o voo atrasa para pousar logo depois que ela chega.
      tL = Math.max(tL, cv.tPronta + dur(T.folgaCaixa));
      cv.furos[ev.para.furo] = p.id;
      Object.assign(p, { lugar: 'caixa', cv, furo: ev.para.furo, ent: null });
      momento(tL, 'pouso', { parafuso: p.id, furo: ev.para.furo, slot: ev.para.slot });
    } else {
      const ent = { id: p.id, tSai: Infinity };
      bandeja.push(ent);
      Object.assign(p, { lugar: 'bandeja', ent, cv: null, furo: -1 });
      momento(tL, 'bandeja', { parafuso: p.id, vaga: ev.para.vaga });
    }
    v.tv = tL - dur(T.voo);
    v.tL = tL;
    v.fim = tL + dur(T.quique);
    p.voo = v;
    p.tTreme = -Infinity;
    ate(v.fim);
  }

  function cair(id, tq) {
    const q = placas[id];
    const lim = G.limitesPlaca(nivel.placas[id]);
    const cx = (lim.x0 + lim.x1) / 2;
    const cy = (lim.y0 + lim.y1) / 2;
    const meia = Math.sqrt((lim.x1 - lim.x0) ** 2 + (lim.y1 - lim.y0) ** 2) / 2;
    // Tempo até sair por baixo da tela: vy₀ = −1,5 u/s, gravidade 28 u/s². Com movimento
    // reduzido a placa só desce um pouquinho e some no lugar.
    const falta = (L.H - (L.oy + cy * L.u)) / L.u + meia;
    const s = calmo ? T.caiCalmo / 1000 : (1.5 + Math.sqrt(2.25 + 2 * GRAVIDADE * Math.max(0, falta))) / GRAVIDADE;
    q.caida = true;
    q.queda = {
      t0: tq,
      fim: ritmo ? tq + s * 1000 : tq,
      calma: calmo,
      cx, cy,
      vx: (Math.random() * 2 - 1) * 1.2,
      vy: -1.5,
      w: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 1.5),
    };
    momento(tq, 'cai', { placa: id });
    ate(q.queda.fim);
  }

  function completar(ev) {
    const cv = porFila.get(ev.fila);
    const t = agora();
    let ultimo = t;
    for (const id of cv.furos) {
      const p = parafusos[id];
      if (p.voo && p.cv === cv && p.voo.tL > ultimo) ultimo = p.voo.tL;
    }
    // Jogando depressa (ou numa cascata) as caixas fazem fila na mesma vaga e a tela fica para
    // trás da lógica: quanto maior o atraso, mais curta a troca desta caixa e a entrada da próxima.
    const atraso = ultimo - (t + dur(T.desparafusar + T.voo));
    cv.k = atraso > 0 ? limitar(1 - atraso / 1000, 0.45, 1) : 1;
    pressaDoSlot[ev.slot] = cv.k;
    cv.tFecha = ultimo + dur(T.esperaTampa) * cv.k;
    const tCarimbo = cv.tFecha + dur(T.tampa) * cv.k;
    cv.tSai = tCarimbo + dur(T.carimbo + T.pausa) * cv.k;
    cv.tFim = cv.tSai + dur(T.sai) * cv.k;
    saidaDoSlot[ev.slot] = cv.tSai;
    momento(tCarimbo, 'completa', { slot: ev.slot, fila: ev.fila, caixa: cv });
    ate(cv.tFim);
  }

  function entrar(ev) {
    const cv = novaCaixa(ev.fila, ev.cor, ev.slot);
    cv.tEntra = Math.max(agora(), saidaDoSlot[ev.slot]);
    cv.tPronta = cv.tEntra + dur(T.entra) * pressaDoSlot[ev.slot];
    slots[ev.slot].push(cv);
    porFila.set(ev.fila, cv);
    ate(cv.tPronta);
  }

  function pular(ev) {
    const p = parafusos[ev.parafuso];
    const cv = porFila.get(ev.fila);
    const ent = p.ent;
    const chegou = p.voo && p.voo.tipo !== 'pulo' ? p.voo.tL : -Infinity;
    const tj = Math.max(cv.tPronta, chegou + dur(T.esperaPulo));
    ent.tSai = tj;
    const tL = tj + dur(T.pulo);
    cv.furos[ev.furo] = p.id;
    const antes = p.voo && p.voo.tipo === 'tirar' && agora() < p.voo.tL ? p.voo : null;
    Object.assign(p, { lugar: 'caixa', cv, furo: ev.furo, ent: null });
    p.voo = { tipo: 'pulo', t0: tj, tv: tj, tL, fim: tL + dur(T.quique), doFuro: false, ox: 0, oy: 0, or: 0, deEnt: ent, antes };
    momento(tL, 'pulo', { parafuso: p.id, furo: ev.furo, slot: ev.slot });
    ate(p.voo.fim);
    ate(tj + dur(T.esperaCompacta + T.compacta));
  }

  // Agenda as animações de uma jogada legal a partir da lista de eventos de Regras.jogar.
  function jogada(eventos) {
    if (!L) return;
    const t0 = agora();
    for (const ev of eventos) {
      if (ev.tipo === 'tirar') tirar(ev, t0);
      else if (ev.tipo === 'placaCai') cair(ev.placa, t0 + dur(T.queda));
      else if (ev.tipo === 'caixaCompleta') completar(ev);
      else if (ev.tipo === 'caixaEntra') entrar(ev);
      else if (ev.tipo === 'puloBandeja') pular(ev);
      // slotVazio, bandejaCompacta e vitoria: a cena já deduz pelo resto.
    }
    ritmo ? pedirQuadro() : quadroJa();
  }

  // ---------------------------------------------------------------- desenho

  function desenharParafuso(cor, x, y, r, giro, elev) {
    const a = ctx.globalAlpha;
    // Sombra: deslocada para baixo, cresce e clareia quando o parafuso sobe.
    const so = r * (0.22 + 0.4 * elev);
    const sw = r * (2.5 + 0.5 * elev);
    ctx.globalAlpha = a * (1 - 0.45 * elev);
    ctx.drawImage(sprSombra, x - sw / 2 + so * 0.5, y - sw / 2 + so, sw, sw);
    ctx.globalAlpha = a;
    const sp = sprParafusos[cor];
    const s = (TAM * r) / R0;
    if (!giro) {
      ctx.drawImage(sp.inteiro, x - s / 2, y - s / 2, s, s);
      return;
    }
    ctx.drawImage(sp.cabeca, x - s / 2, y - s / 2, s, s);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(giro);
    ctx.drawImage(sp.fenda, -s / 2, -s / 2, s, s);
    ctx.restore();
    ctx.drawImage(sprBrilho, x - s / 2, y - s / 2, s, s);
  }

  function desenharTabuleiro(t) {
    const m = sprMadeira;
    ctx.drawImage(m.c, m.x, m.y, m.w, m.h);
    const u = L.u;
    for (let i = 0; i < placas.length; i++) {
      const q = placas[i];
      const emPe = !q.caida || (q.queda && t < q.queda.t0);
      if (emPe && t >= q.tSurge) {
        const sp = sprPlacas[i];
        ctx.globalAlpha = ALFA_PLACA * suave(prog(t, q.tSurge, dur(T.surgePlaca)));
        ctx.drawImage(sp.c, L.ox + sp.x, L.oy + sp.y, sp.w, sp.h);
        ctx.globalAlpha = 1;
      }
      // Parafusos desta placa ficam entre ela e as placas de cima (aparecem por transparência).
      const ids = nivel.parafusosDaPlaca[i];
      for (let k = 0; k < ids.length; k++) {
        const p = parafusos[ids[k]];
        if (p.lugar !== 'tabuleiro' || t < p.tSurge) continue;
        if (p.voo && t < p.voo.fim) {
          // Voltando de um desfazer: voa por cima de tudo (desenharVoos) e se aparafusa aqui.
          if (t < p.voo.tL) continue;
          posVoo(p, t, PT);
          desenharParafuso(p.cor, PT.x, PT.y, PT.r, PT.giro, PT.elev);
          continue;
        }
        let x = L.ox + p.x * u;
        const qt = prog(t, p.tTreme, dur(T.treme));
        if (qt < 1) x += (calmo ? 0.03 : 0.08) * u * Math.sin(qt * Math.PI * 6) * (1 - qt * 0.5);
        const qs = prog(t, p.tSurge, dur(T.surge));
        desenharParafuso(p.cor, x, L.oy + p.y * u, L.rParafuso * (qs < 1 ? Math.max(0, mola(qs)) : 1), 0, 0);
      }
    }
  }

  function desenharCaixa(cv, t) {
    if (t < cv.tEntra || t >= cv.tFim) return;
    caixaEm(cv, t, CX);
    if (CX.alfa <= 0.01) return;
    // A caixa dá um pulinho a cada parafuso que pousa nela.
    for (let k = 0; k < cv.furos.length; k++) {
      const v = parafusos[cv.furos[k]].voo;
      if (v && t >= v.tL && t < v.tL + dur(T.quique) + 40) CX.esc *= 1 + 0.045 * Math.sin(Math.PI * prog(t, v.tL, dur(T.quique) + 40));
    }
    const C = L.caixa;
    const tom = TONS[cv.cor];
    const x = CX.x;
    const y = CX.y;
    const w = C.w;
    const h = C.h;
    ctx.save();
    ctx.globalAlpha = CX.alfa;
    if (CX.esc !== 1) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(CX.esc, CX.esc);
      ctx.translate(-x - w / 2, -y - h / 2);
    }
    // Degrau embaixo, como os botões da tela.
    ctx.beginPath();
    retArredondado(ctx, x, y + 4, w, h, C.raio);
    ctx.fillStyle = 'rgba(43,52,103,.16)';
    ctx.fill();
    // Alça.
    ctx.beginPath();
    ctx.moveTo(x + w * 0.32, y + 2);
    ctx.bezierCurveTo(x + w * 0.32, y - C.alca * 1.3, x + w * 0.68, y - C.alca * 1.3, x + w * 0.68, y + 2);
    ctx.lineCap = 'round';
    ctx.strokeStyle = tom.borda;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = tom.caixa;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // Corpo.
    ctx.beginPath();
    retArredondado(ctx, x, y, w, h, C.raio);
    ctx.fillStyle = tom.caixa;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = tom.borda;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + C.raio, y + 4);
    ctx.lineTo(x + w - C.raio, y + 4);
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Poços e parafusos que já chegaram.
    const fy = y + L.yFuro;
    for (let k = 0; k < 3; k++) {
      const fx = x + w / 2 + (k - 1) * L.passoCaixa;
      ctx.beginPath();
      circulo(ctx, fx, fy, L.rCaixa + 3);
      ctx.fillStyle = tom.poco;
      ctx.fill();
      const id = cv.furos[k];
      const p = id === undefined ? null : parafusos[id];
      if (p && p.cv === cv && !(p.voo && t < p.voo.tL)) {
        const esc = p.voo ? quique(prog(t, p.voo.tL, dur(T.quique))) : 1;
        desenharParafuso(p.cor, fx, fy, L.rCaixa * esc, 0, 0);
      } else if (simbolos) {
        // Poço vazio mostra o símbolo do que vai nele.
        ctx.save();
        ctx.translate(fx, fy);
        caminhoSimbolo(ctx, SIMBOLOS[cv.cor], L.rCaixa * 0.62);
        ctx.fillStyle = tom.marca;
        ctx.fill();
        ctx.restore();
      }
    }
    // Tampa desliza fechando e o certinho aparece.
    if (t >= cv.tFecha) {
      const q = saida(prog(t, cv.tFecha, dur(T.tampa) * cv.k));
      ctx.save();
      ctx.beginPath();
      retArredondado(ctx, x, y, w, h, C.raio);
      ctx.clip();
      ctx.fillStyle = tom.tampa;
      ctx.fillRect(x, y, w * q, h);
      ctx.fillStyle = 'rgba(255,255,255,.32)';
      ctx.fillRect(x, y, w * q, h * 0.3);
      ctx.fillStyle = tom.borda;
      ctx.fillRect(x + w * q - 2.5, y, 2.5, h);
      ctx.restore();
      ctx.beginPath();
      retArredondado(ctx, x, y, w, h, C.raio);
      ctx.lineWidth = 3;
      ctx.strokeStyle = tom.borda;
      ctx.stroke();
      const tc = cv.tFecha + dur(T.tampa) * cv.k;
      if (t >= tc) {
        const s = Math.max(0, mola(prog(t, tc, dur(T.carimbo) * cv.k))) * Math.min(h * 0.34, 21);
        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.beginPath();
        circulo(ctx, cx, cy, s);
        ctx.fillStyle = VERDE;
        ctx.fill();
        ctx.lineWidth = Math.max(1, s * 0.14);
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.42, cy + s * 0.02);
        ctx.lineTo(cx - s * 0.12, cy + s * 0.32);
        ctx.lineTo(cx + s * 0.44, cy - s * 0.3);
        ctx.lineWidth = Math.max(1, s * 0.2);
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function desenharCaixas(t) {
    for (let s = 0; s < slots.length; s++) {
      let algum = false;
      for (const cv of slots[s]) {
        if (t >= cv.tEntra && t < cv.tFim) algum = true;
        desenharCaixa(cv, t);
      }
      if (!algum) {
        // Vaga vazia: a fila de caixas acabou (ou a caixa ainda vai entrar).
        const S = L.slots[s];
        ctx.beginPath();
        retArredondado(ctx, S.x + 1.5, S.y + 1.5, L.caixa.w - 3, L.caixa.h - 3, L.caixa.raio);
        ctx.setLineDash([7, 7]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(91,102,148,.28)';
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function desenharSeguir(t) {
    if (!L.seguir) return;
    const pv = proximaVisual(t);
    const n = Math.min(3, nivel.caixas.length - pv);
    if (n <= 0) return;
    ctx.font = FONTE;
    const texto = 'a seguir';
    if (!larguraSeguir) larguraSeguir = ctx.measureText(texto).width;
    const tw = larguraSeguir;
    const r = 7;
    const total = tw + 10 + n * 2 * r + (n - 1) * 7;
    let x = (L.W - total) / 2;
    const y = L.seguir.y;
    ctx.fillStyle = TINTA_SUAVE;
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, x, y + 0.5);
    x += tw + 10 + r;
    for (let k = 0; k < n; k++) {
      const cor = nivel.caixas[pv + k];
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      if (simbolos) caminhoSimbolo(ctx, SIMBOLOS[cor], r * 1.05);
      else circulo(ctx, 0, 0, r);
      ctx.fillStyle = CORES[cor];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = TONS[cor].anel;
      ctx.stroke();
      ctx.beginPath();
      circulo(ctx, -r * 0.3, -r * 0.32, r * 0.26);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fill();
      ctx.restore();
      x += 2 * r + 7;
    }
  }

  function desenharBandeja(t) {
    const B = L.bandeja;
    const cap = capacidadeVisual(t);
    const dx = tremorBandeja(t);
    const w = cap * B.passo + 12;
    const x = L.W / 2 - w / 2 + dx;
    let livres = nivel.bandeja + extra;
    for (const e of bandeja) if (e.tSai === Infinity) livres--;
    ctx.beginPath();
    retArredondado(ctx, x, B.y, w, B.h, B.h / 2);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.fill();
    pulsoBandeja = livres === 1;
    if (livres <= 0) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = VERMELHO;
    } else if (livres === 1) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = misturar(LARANJA, '#FFFFFF', 0.45 - 0.45 * Math.sin(t / 190), 1);
    } else {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
    }
    ctx.stroke();
    // Vagas (a sexta, dourada, é o espaço extra e aparece com um pulinho).
    const total = nivel.bandeja + extra;
    for (let v = 0; v < total; v++) {
      const vx = xVaga(v, t);
      let rv = B.rv;
      if (v >= nivel.bandeja) rv *= Math.max(0, mola(prog(t, tExtra, dur(T.extra))));
      ctx.beginPath();
      circulo(ctx, vx, B.cy, rv);
      if (v >= nivel.bandeja) {
        ctx.fillStyle = 'rgba(255,197,49,.3)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = DOURADO;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(43,52,103,.09)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(vx, B.cy, rv - 1, 1.1 * Math.PI, 1.9 * Math.PI);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(43,52,103,.08)';
        ctx.stroke();
      }
    }
    for (const e of bandeja) {
      if (t >= e.tSai) continue; // já pulou para uma caixa
      const p = parafusos[e.id];
      const v = p.voo;
      if (p.ent === e && v && t < v.tL) continue; // ainda voando para cá
      if (v && v.deEnt === e && aindaChegando(v, t)) continue;
      const esc = p.ent === e && v ? quique(prog(t, v.tL, dur(T.quique))) : 1;
      desenharParafuso(p.cor, xVaga(vagaDe(e, t), t), B.cy, L.rBandeja * esc, 0, 0);
    }
  }

  function desenharQuedas(t) {
    const u = L.u;
    for (let i = 0; i < placas.length; i++) {
      const f = placas[i].queda;
      if (!f || t < f.t0 || t >= f.fim) continue;
      const s = (t - f.t0) / 1000;
      const sp = sprPlacas[i];
      ctx.save();
      if (f.calma) {
        const q = prog(t, f.t0, f.fim - f.t0);
        ctx.globalAlpha = ALFA_PLACA * (1 - q);
        ctx.translate(L.ox + f.cx * u, L.oy + (f.cy + 0.3 * q) * u);
      } else {
        ctx.globalAlpha = ALFA_PLACA;
        ctx.translate(L.ox + (f.cx + f.vx * s) * u, L.oy + (f.cy + f.vy * s + 0.5 * GRAVIDADE * s * s) * u);
        ctx.rotate(f.w * s);
      }
      ctx.drawImage(sp.c, sp.x - f.cx * u, sp.y - f.cy * u, sp.w, sp.h);
      ctx.restore();
    }
  }

  function desenharVoos(t) {
    for (const p of parafusos) {
      const v = p.voo;
      if (!v || t >= v.tL) continue;
      if (v.tipo === 'pulo' && t < v.tv && !aindaChegando(v, t)) continue; // parado na bandeja
      posVoo(p, t, PT);
      desenharParafuso(p.cor, PT.x, PT.y, PT.r, PT.giro, PT.elev);
    }
  }

  function desenharContorno(i, cor, alfa) {
    const sp = contorno(i, cor);
    ctx.globalAlpha = alfa;
    ctx.drawImage(sp.c, L.ox + sp.x, L.oy + sp.y, sp.w, sp.h);
    ctx.globalAlpha = 1;
  }

  function desenharEfeitos(t) {
    // Placas que prendem o parafuso tocado: contorno branco piscando duas vezes.
    for (const pc of piscadas) {
      const q = prog(t, pc.t0, dur(T.pisca));
      if (q < 1 && !placas[pc.placa].caida) desenharContorno(pc.placa, '#FFFFFF', Math.sin(Math.PI * ((2 * q) % 1)));
    }
    for (const i of brilhos) {
      const q = placas[i];
      if (!q.caida && t >= q.tSurge) desenharContorno(i, DOURADO, (0.6 + 0.4 * Math.sin(t / 260)) * prog(t, q.tSurge, dur(T.surgePlaca)));
    }
    // Ondas em volta do parafuso indicado (dica ou tutorial), até a próxima jogada.
    for (const id of ondasIds) {
      const p = parafusos[id];
      if (!p || p.lugar !== 'tabuleiro' || (p.voo && t < p.voo.fim)) continue;
      const x = L.ox + p.x * L.u;
      const y = L.oy + p.y * L.u;
      for (let k = 0; k < 2; k++) {
        const fase = (t / CICLO_ONDA + k * 0.5) % 1;
        const r = L.rParafuso * (1.1 + 1.6 * fase);
        ctx.beginPath();
        circulo(ctx, x, y, r);
        ctx.globalAlpha = (1 - fase) * 0.5;
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#7A5230';
        ctx.stroke();
        ctx.globalAlpha = 1 - fase;
        ctx.lineWidth = 3;
        ctx.strokeStyle = k ? DOURADO : '#fff';
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    desenharMao(t);
    // Faíscas da caixa completa: estrelinhas que se espalham e somem.
    for (const f of faiscas) {
      const q = prog(t, f.t0, dur(T.faiscas));
      if (q >= 1) continue;
      const d = f.vel * saida(q);
      ctx.save();
      ctx.translate(f.x + Math.cos(f.ang) * d, f.y + Math.sin(f.ang) * d);
      ctx.rotate(q * 2);
      ctx.globalAlpha = 1 - entrada(q);
      ctx.beginPath();
      estrela(ctx, f.tam * (1 - 0.5 * q), 4, 0.38);
      ctx.fillStyle = f.cor;
      ctx.fill();
      ctx.restore();
    }
    if (t < tConfete + T.confete) desenharConfete(t);
  }

  // Mãozinha do tutorial: a ponta do dedo encosta no parafuso no instante em que nasce cada onda,
  // sobe depressa, espera e desce de novo (parada, com movimento reduzido).
  function desenharMao(t) {
    if (maoId < 0 || t < tMao) return;
    const p = parafusos[maoId];
    if (p.lugar !== 'tabuleiro' || t < p.tSurge || (p.voo && t < p.voo.fim)) return;
    const h = (t / CICLO_ONDA) % 1;
    let d = 0.3;
    let aperto = 1;
    if (calmo) d = 0.12;
    else if (h < 0.1) {
      d = 0;
      aperto = 1 - 0.08 * Math.sin((Math.PI * h) / 0.1);
    } else if (h < 0.45) d = 0.3 * saida((h - 0.1) / 0.35);
    else if (h >= 0.8) d = 0.3 * (1 - entrada((h - 0.8) / 0.2));
    const dx = Math.cos(maoAng);
    const dy = Math.sin(maoAng);
    const toque = 0.3 * L.rParafuso + d * sprMao.S;
    ctx.save();
    ctx.globalAlpha = suave(prog(t, tMao, 300));
    ctx.translate(L.ox + p.x * L.u + dx * toque, L.oy + p.y * L.u + dy * toque);
    ctx.rotate(maoAng - Math.PI / 2);
    // Punho para a esquerda: a mão esquerda (espelhada) fica mais natural.
    ctx.scale(dx < -0.3 ? -aperto : aperto, aperto);
    ctx.drawImage(sprMao.c, -sprMao.ox, -sprMao.oy, sprMao.w, sprMao.h);
    ctx.restore();
  }

  // Para que lado fica o punho: de preferência para baixo e à direita, sem tapar outros parafusos
  // nem sair do painel de madeira.
  function escolherLadoMao() {
    const alvo = nivel.parafusos[maoId];
    const x0 = L.ox + alvo.x * L.u;
    const y0 = L.oy + alvo.y * L.u;
    const S = sprMao.S;
    const tb = L.tab;
    let melhor = Infinity;
    for (let graus = -150; graus <= 180; graus += 30) {
      const a = (graus * Math.PI) / 180;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const lado = dx < -0.3 ? -1 : 1; // mão espelhada (ver desenharMao)
      let custo = Math.abs(graus - 60) / 200;
      const fx = x0 + dx * 1.3 * S;
      const fy = y0 + dy * 1.3 * S;
      if (fx < tb.x + 4 || fx > tb.x + tb.w - 4 || fy < tb.y + 4 || fy > tb.y + tb.h - 4) custo += 4;
      // A mão vira quatro círculos (dedo, mão fechada e as pontas do punho), em coordenadas da
      // mão: y ao longo do braço, x para o lado dos dedos dobrados; a ponta fica a 0,15 S do parafuso.
      for (const [mx, my, raio] of PONTOS_MAO) {
        const cx = x0 + lado * mx * S * dy + (my + 0.15) * S * dx;
        const cy = y0 - lado * mx * S * dx + (my + 0.15) * S * dy;
        const r = raio * S + L.rParafuso;
        for (const p of parafusos) {
          if (p.id === maoId || p.lugar !== 'tabuleiro') continue;
          const d = Math.hypot(L.ox + p.x * L.u - cx, L.oy + p.y * L.u - cy);
          if (d < r) custo += 3 * (1 - d / r);
        }
      }
      if (custo < melhor) {
        melhor = custo;
        maoAng = a;
      }
    }
  }

  function desenharConfete(t) {
    const s = (t - tConfete) / 1000;
    const fim = T.confete / 1000;
    const alfa = lim01((fim - s) / 0.5);
    for (const c of confetes) {
      if (s < c.atraso) continue;
      const a = s - c.atraso;
      ctx.save();
      ctx.translate(c.x + c.vx * a + Math.sin(a * c.freq + c.fase) * c.amp, c.y + c.vy * a + 0.5 * c.g * a * a);
      ctx.rotate(c.rot + c.vr * a);
      ctx.globalAlpha = alfa;
      ctx.fillStyle = c.cor;
      ctx.fillRect(-c.w / 2, (-c.h / 2) * Math.abs(Math.cos(a * c.giro)), c.w, c.h * Math.abs(Math.cos(a * c.giro)) + 0.5);
      ctx.restore();
    }
  }

  function desenhar(t) {
    ctx.setTransform(escalaX, 0, 0, escalaY, 0, 0);
    ctx.clearRect(0, 0, L.W, L.H);
    desenharTabuleiro(t);
    desenharCaixas(t);
    desenharSeguir(t);
    desenharBandeja(t);
    desenharQuedas(t);
    desenharVoos(t);
    desenharEfeitos(t);
  }

  // ---------------------------------------------------------------- laço de quadros

  function pedirQuadro() {
    if (!L) return;
    if (!raf) raf = requestAnimationFrame(quadro);
    if (!reserva) reserva = setTimeout(quadroReserva, 250);
  }

  // Com a página em segundo plano o navegador para de chamar requestAnimationFrame: este relógio
  // de reserva mantém os momentos e o fim das animações andando (vitória, balões), mesmo sem pintar.
  function quadroReserva() {
    reserva = 0;
    if (!raf) return;
    if (agora() - ultimoQuadro < 200) reserva = setTimeout(quadroReserva, 250);
    else quadroJa();
  }

  function quadroJa() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    quadro();
  }

  function dispararMomentos(t) {
    if (!momentos.length) return;
    momentos.sort((a, b) => a.t - b.t);
    let n = 0;
    while (n < momentos.length && momentos[n].t <= t) n++;
    if (!n) return;
    for (const m of momentos.splice(0, n)) {
      if (m.tipo === 'completa') faiscar(m.dados.caixa, t);
      if (aoMomento) aoMomento(m.tipo, m.dados, t - m.t);
    }
  }

  function faiscar(cv, t) {
    if (!ritmo) return;
    caixaEm(cv, t, CX);
    const x = CX.x + L.caixa.w / 2;
    const y = CX.y + L.caixa.h / 2;
    for (let i = 0; i < 10; i++) {
      faiscas.push({
        t0: t, x, y,
        ang: (i / 10) * Math.PI * 2 + Math.random() * 0.5,
        vel: L.caixa.w * (0.35 + Math.random() * 0.3),
        tam: 4 + Math.random() * 3.5,
        cor: i % 2 ? DOURADO : '#FFFFFF',
      });
    }
    ate(t + dur(T.faiscas));
  }

  // Quando nada mais se mexe: limpa o que terminou (só aqui é seguro: nenhum voo depende disso).
  function arrumar(t) {
    for (const p of parafusos) if (p.voo && t >= p.voo.fim) p.voo = null;
    for (const q of placas) if (q.queda && t >= q.queda.fim) q.queda = null;
    for (const lista of slots) {
      for (let i = lista.length - 1; i >= 0; i--) if (t >= lista[i].tFim) lista.splice(i, 1);
    }
    bandeja = bandeja.filter((e) => e.tSai === Infinity);
    piscadas = piscadas.filter((pc) => t < pc.t0 + dur(T.pisca));
    faiscas = [];
  }

  function animandoAmbiente(t) {
    return ondasIds.length > 0 || maoId >= 0 || brilhos.length > 0 || pulsoBandeja || t < tConfete + T.confete;
  }

  function quadro() {
    raf = 0;
    if (!L) return;
    const t = agora();
    ultimoQuadro = t;
    dispararMomentos(t);
    desenhar(t);
    if (t >= ocupadoAte && !momentos.length) {
      if (sujo) {
        arrumar(t);
        sujo = false;
      }
      if (aoAssentar.length) for (const f of aoAssentar.splice(0)) f();
    }
    // aoAssentar ainda cheio = este quadro chegou um pouco antes do fim previsto (às vezes por
    // décimos de ms): sem pedir outro quadro, a vitória nunca apareceria.
    if (agora() < ocupadoAte || momentos.length || aoAssentar.length || animandoAmbiente(t)) pedirQuadro();
  }

  // ---------------------------------------------------------------- medidas

  function medir() {
    const r = tela.getBoundingClientRect();
    const W = Math.max(1, r.width);
    const H = Math.max(1, r.height);
    dpr = Math.min(globalThis.devicePixelRatio || 1, 3);
    const chave = W + 'x' + H + '@' + dpr + '+' + reservaTopo;
    if (chave === medida && L) return false;
    medida = chave;
    tela.width = Math.max(1, Math.round(W * dpr));
    tela.height = Math.max(1, Math.round(H * dpr));
    escalaX = tela.width / W;
    escalaY = tela.height / H;
    if (!nivel) return true;
    // Antes do primeiro layout da página o canvas pode medir quase nada: calcula com um mínimo
    // razoável (o ResizeObserver refaz tudo quando o tamanho real chegar).
    L = calcularLayout(Math.max(W, 240), Math.max(H, 320));
    criarSprites();
    if (maoId >= 0) escolherLadoMao();
    return true;
  }

  // Movimento reduzido: troca as durações e acompanha a preferência se ela mudar com o jogo aberto.
  function acompanharMovimento() {
    const consulta = globalThis.matchMedia ? globalThis.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const aplicar = () => {
      calmo = !!(consulta && consulta.matches);
      Object.assign(T, T_NORMAL, calmo ? T_CALMO : null);
    };
    aplicar();
    if (consulta && consulta.addEventListener) consulta.addEventListener('change', aplicar);
  }

  // ---------------------------------------------------------------- API

  P.Desenho = {
    CORES,

    // canvas: o #tela; opcoes.aoMomento(tipo, dados, atraso) recebe 'pouso', 'bandeja', 'pulo',
    // 'cai' e 'completa' no instante em que acontecem na tela (sons, vibração e tutorial); atraso
    // (ms) é grande quando a página ficou em segundo plano e os momentos chegam todos juntos.
    iniciar(canvas, opcoes) {
      tela = canvas;
      ctx = canvas.getContext('2d');
      aoMomento = (opcoes && opcoes.aoMomento) || null;
      acompanharMovimento();
      const fonteChegou = () => {
        larguraSeguir = 0;
        pedirQuadro();
      };
      if (document.fonts && document.fonts.load) document.fonts.load(FONTE).then(fonteChegou, () => {});
    },

    // Nova fase (ou a mesma de novo): refaz layout e sprites e monta a cena parada.
    // opcoes: { reserva: px para o balão do tutorial no alto do tabuleiro, animar: entrada animada }.
    carregar(nv, estado, opcoes) {
      const o = opcoes || {};
      nivel = nv;
      reservaTopo = o.reserva || 0;
      medida = '';
      momentos = [];
      aoAssentar = [];
      ondasIds = [];
      maoId = -1;
      brilhos = [];
      confetes = [];
      tConfete = -Infinity;
      ocupadoAte = agora();
      medir();
      montarCena(estado);
      if (o.animar && ritmo && !calmo) animarEntrada(agora());
      quadroJa();
    },

    // Muda o espaço do balão (a largura mudou ou a fonte chegou): refaz o layout se precisar.
    reservarTopo(px) {
      if (px === reservaTopo) return;
      reservaTopo = px;
      if (tela && nivel && medir()) quadroJa();
    },

    jogada,

    // Toque num parafuso preso: ele treme e as placas de cima piscam.
    bloqueado(id, ids) {
      const t = agora();
      parafusos[id].tTreme = t;
      for (const i of ids) piscadas.push({ placa: i, t0: t });
      ate(t + dur(Math.max(T.treme, T.pisca)));
      pedirQuadro();
    },

    bandejaCheia() {
      tTremeBandeja = agora();
      ate(tTremeBandeja + dur(T.tremeBandeja));
      pedirQuadro();
    },

    extraAtivado() {
      extra = 1;
      tExtra = agora();
      ate(tExtra + dur(T.extra));
      pedirQuadro();
    },

    // Desfazer, recomeçar: monta a cena do estado novo, mas o que mudou anda até o lugar certo.
    // Parafusos que voltam ao tabuleiro voam de onde estão desenhados e se aparafusam; placas
    // que voltam aparecem aos poucos; o que ainda caía continua caindo.
    reconstruir(estado) {
      if (!L) return;
      const t = agora();
      const antes = parafusos.map((p) => {
        const o = { x: 0, y: 0, r: 0, visivel: false, parado: false };
        o.visivel = posicaoAtual(p, t, o);
        o.parado = p.lugar === 'tabuleiro' && !(p.voo && t < p.voo.fim) && t >= p.tSurge;
        return o;
      });
      const placasAntes = placas.map((q) => ({ emPe: !q.caida || !!(q.queda && t < q.queda.t0), queda: q.queda, tSurge: q.tSurge }));
      const caixasAntes = new Set();
      for (const lista of slots) for (const cv of lista) if (t >= cv.tEntra && t < cv.tSai) caixasAntes.add(cv.fila);
      const extraAntes = { extra, tExtra };
      momentos = [];
      montarCena(estado);
      if (extra && extraAntes.extra) tExtra = extraAntes.tExtra;
      ocupadoAte = t;
      parafusos.forEach((p, id) => {
        const a = antes[id];
        if (p.lugar === 'tabuleiro') {
          if (a.parado) return;
          if (a.visivel) {
            p.voo = { tipo: 'volta', t0: t, tv: t, tL: t + dur(T.volta), fim: t + dur(T.volta + T.aparafusar), doFuro: false, ox: a.x, oy: a.y, or: a.r, deEnt: null };
            ate(p.voo.fim);
          } else {
            p.tSurge = t;
            ate(t + dur(T.surge));
          }
        } else if (p.lugar === 'caixa' || p.lugar === 'bandeja') {
          if (!a.visivel) return;
          posDestino(p, t, DST);
          if (Math.abs(DST.x - a.x) + Math.abs(DST.y - a.y) < 2) return;
          p.voo = { tipo: 'ajuste', t0: t, tv: t, tL: t + dur(T.ajuste), fim: t + dur(T.ajuste + T.quique), doFuro: false, ox: a.x, oy: a.y, or: a.r, deEnt: null };
          ate(p.voo.fim);
        }
      });
      placas.forEach((q, i) => {
        const a = placasAntes[i];
        if (!q.caida) {
          if (!a.emPe) q.tSurge = t;
          else if (t < a.tSurge + dur(T.surgePlaca)) q.tSurge = a.tSurge;
        } else if (a.queda && t < a.queda.fim) {
          q.queda = a.queda;
        }
        if (q.tSurge === t) ate(t + dur(T.surgePlaca));
        if (q.queda) ate(q.queda.fim);
      });
      for (const lista of slots) {
        for (const cv of lista) {
          if (!caixasAntes.has(cv.fila)) {
            cv.tSurge = t;
            ate(t + dur(T.surge));
          }
        }
      }
      ritmo ? pedirQuadro() : quadroJa();
    },

    // Ondas em volta destes parafusos (dica e tutorial); [] apaga.
    ondas(ids) {
      ondasIds = ids.slice();
      pedirQuadro();
    },

    // Mãozinha do tutorial tocando o parafuso id (-1 tira). Aparece quando a tela assenta (depois da
    // entrada da fase ou da queda de uma placa), para não disputar a atenção com a animação.
    mao(id) {
      if (id === maoId) return;
      maoId = id;
      if (id < 0 || !L) return;
      tMao = Math.max(agora(), ocupadoAte) + dur(250);
      escolherLadoMao();
      pedirQuadro();
    },

    // Placas com contorno brilhando (tutorial da fase 2); [] apaga.
    brilho(ids) {
      brilhos = ids.slice();
      pedirQuadro();
    },

    confete() {
      if (!ritmo || !L || calmo) return;
      tConfete = agora();
      confetes = [];
      for (let i = 0; i < 120; i++) {
        confetes.push({
          x: L.W * (0.15 + Math.random() * 0.7),
          y: L.tab.y + L.tab.h * (0.1 + Math.random() * 0.25),
          vx: (Math.random() - 0.5) * 520,
          vy: -280 - Math.random() * 420,
          g: 900,
          atraso: Math.random() * 0.25,
          amp: 6 + Math.random() * 16,
          freq: 4 + Math.random() * 5,
          fase: Math.random() * 6.28,
          rot: Math.random() * 6.28,
          vr: (Math.random() - 0.5) * 9,
          giro: 4 + Math.random() * 8,
          w: 6 + Math.random() * 5,
          h: 9 + Math.random() * 6,
          cor: i % 3 === 0 ? DOURADO : CORES[i % CORES.length],
        });
      }
      pedirQuadro();
    },

    // Parafusos ainda no tabuleiro perto do ponto (px CSS do canvas), do mais perto ao mais longe.
    acharParafusos(x, y, removido) {
      const lista = [];
      if (!L) return lista;
      for (const s of nivel.parafusos) {
        if (removido[s.id]) continue;
        const dx = L.ox + s.x * L.u - x;
        const dy = L.oy + s.y * L.u - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= L.alcance) lista.push({ id: s.id, d });
      }
      lista.sort((a, b) => a.d - b.d || a.id - b.id);
      return lista;
    },

    // Centro do furo do parafuso em coordenadas da janela (testes automáticos clicam aqui).
    posicaoNaTela(id) {
      if (!L || !nivel || !nivel.parafusos[id]) return null;
      const r = tela.getBoundingClientRect();
      const s = nivel.parafusos[id];
      return { x: r.left + L.ox + s.x * L.u, y: r.top + L.oy + s.y * L.u };
    },

    // Topo do painel de madeira (px CSS, relativo ao canvas), para posicionar o balão.
    topoTabuleiro() {
      return L ? L.tab.y : 0;
    },

    definirSimbolos(sim) {
      if (simbolos === !!sim) return;
      simbolos = !!sim;
      if (L) {
        criarSpritesParafusos();
        pedirQuadro();
      }
    },

    pularAnimacoes(sim) {
      ritmo = sim ? 0 : 1;
    },

    ocupado() {
      return agora() < ocupadoAte || momentos.length > 0 || aoAssentar.length > 0;
    },

    // Chama f quando todas as animações de jogada terminarem (vitória, bandeja cheia).
    quandoAssentar(f) {
      aoAssentar.push(f);
      ritmo ? pedirQuadro() : quadroJa();
    },

    redimensionar() {
      if (tela && medir()) quadroJa();
    },
  };
})(globalThis.Parafusinhos = globalThis.Parafusinhos || {});
