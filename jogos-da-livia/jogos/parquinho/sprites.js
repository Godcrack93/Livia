/* Parquinho Sprunki — desenhos prontos para o canvas: personagens em peças (corpo, braços, pernas),
   blocos em pixel art no estilo Minecraft e as armas. Os personagens vêm do mesmo código do Sprunkinhos (comum/personagens.js). */
(function () {
  'use strict';
  const RES = 1.4;   // pixels de imagem por unidade do desenho (alto o bastante para o zoom máximo)
  const SIZE = 2.6;  // altura do desenho de um personagem, em blocos
  const WS = 1.45;   // armas um pouco maiores que o natural, para aparecerem bem na mão
  const chars = new Map(), pending = new Map();

  function toCanvas(svg, vw, vh, scale) {
    return new Promise(res => {
      const w = Math.ceil(vw * scale), h = Math.ceil(vh * scale), img = new Image();
      img.onload = () => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h); res(cv); };
      img.onerror = () => res(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', `<svg width="${w}" height="${h}" `));
    });
  }

  // ---------- personagens ----------
  function charReady(id, horror) {
    const key = id + (horror ? '_h' : '_n');
    if (!pending.has(key)) {
      const p = window.SPR.puppetSVG(window.SPR.byId[id], 'pp' + key, horror);
      pending.set(key, Promise.all([toCanvas(p.body, 200, 352, RES), toCanvas(p.arm, 32, 92, RES * 1.3), toCanvas(p.leg, 40, 70, RES * 1.3)])
        .then(([body, arm, leg]) => { const s = { body, arm, leg }; chars.set(key, s); return s; }));
    }
    return pending.get(key);
  }
  function char(id, horror) {
    const s = chars.get(id + (horror ? '_h' : '_n'));
    if (!s) charReady(id, horror);
    return s || null;
  }

  // ---------- blocos (16x16 pixels) ----------
  const BLOCOS = { madeira: { nome: 'Madeira' }, tijolo: { nome: 'Tijolo' }, pedra: { nome: 'Pedra' }, vidro: { nome: 'Vidro' }, terra: { nome: 'Terra' }, grama: { nome: 'Grama' } };
  function rng(seed) { let s = Math.abs(seed) % 2147483646 + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function makeTex(kind) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 16;
    const x = cv.getContext('2d'), r = rng([...kind].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 1000003, 7));
    const P = (i, j, col) => { x.fillStyle = col; x.fillRect(i, j, 1, 1); };
    const R = (i, j, w, h, col) => { x.fillStyle = col; x.fillRect(i, j, w, h); };
    const speck = list => {
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
        const v = r(); let acc = 0;
        for (const [col, pr] of list) { acc += pr; if (v < acc) { P(i, j, col); break; } }
      }
    };
    switch (kind) {
      case 'madeira':
        R(0, 0, 16, 16, '#B98546'); speck([['#A7733A', 0.14], ['#C99A5C', 0.07]]);
        for (let row = 0; row < 4; row++) {
          R(0, row * 4, 16, 1, '#CB9B5E'); R(0, row * 4 + 3, 16, 1, '#7A4F24');
          R([11, 4, 13, 6][row], row * 4, 1, 3, '#7A4F24');
        }
        break;
      case 'tijolo':
        R(0, 0, 16, 16, '#C9BFB2');
        for (let row = 0; row < 4; row++) {
          const y = row * 4, off = row % 2 ? 4 : 0;
          for (let bx = -off; bx < 16; bx += 8) {
            const x0 = Math.max(0, bx), x1 = Math.min(16, bx + 7); if (x1 <= x0) continue;
            R(x0, y, x1 - x0, 3, ['#B4482F', '#A93F28', '#BC5034'][Math.floor(r() * 3)]); R(x0, y, x1 - x0, 1, '#C8603F');
            for (let k = 0; k < 2; k++) P(x0 + Math.floor(r() * (x1 - x0)), y + 1 + Math.floor(r() * 2), '#93321F');
          }
        }
        break;
      case 'pedra':
        R(0, 0, 16, 16, '#7E7E7E'); speck([['#6C6C6C', 0.18], ['#959595', 0.14]]);
        [[1, 1, 5, 4], [7, 0, 5, 3], [12, 2, 4, 4], [0, 6, 4, 4], [5, 5, 6, 5], [11, 7, 5, 4], [2, 11, 5, 4], [8, 11, 4, 5], [13, 12, 3, 4]].forEach(([sx, sy, w, h]) => {
          R(sx, sy, w, h, ['#8F8F8F', '#858585', '#9A9A9A'][Math.floor(r() * 3)]);
          R(sx, sy + h - 1, w, 1, '#5E5E5E'); R(sx + w - 1, sy, 1, h, '#666666'); P(sx, sy, '#ABABAB');
        });
        break;
      case 'vidro':
        R(0, 0, 16, 16, 'rgba(185, 228, 255, 0.30)');
        x.fillStyle = 'rgba(232, 248, 255, 0.95)'; x.fillRect(0, 0, 16, 1); x.fillRect(0, 15, 16, 1); x.fillRect(0, 0, 1, 16); x.fillRect(15, 0, 1, 16);
        [[3, 5], [4, 4], [5, 3], [4, 6], [6, 4], [10, 11], [11, 10], [12, 9]].forEach(([i, j]) => P(i, j, 'rgba(255,255,255,0.9)'));
        break;
      case 'terra':
        R(0, 0, 16, 16, '#8B5A2B'); speck([['#6E4520', 0.16], ['#A0703C', 0.12], ['#5C3A1B', 0.04]]);
        break;
      case 'grama':
        R(0, 0, 16, 16, '#8B5A2B'); speck([['#6E4520', 0.16], ['#A0703C', 0.12]]);
        for (let i = 0; i < 16; i++) {
          const h = 3 + (r() < 0.5 ? 1 : 0) + (r() < 0.25 ? 1 : 0);
          for (let j = 0; j < h; j++) P(i, j, j === h - 1 && r() < 0.5 ? '#4E8F2E' : (r() < 0.2 ? '#79C24A' : '#5DA83A'));
        }
        break;
    }
    return cv;
  }
  const texCache = {}, iconCache = {};
  function blockTex(kind) { return texCache[kind] || (texCache[kind] = makeTex(kind)); }
  function blockIcon(kind) {
    if (!iconCache[kind]) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(blockTex(kind), 0, 0, 64, 64);
      iconCache[kind] = cv.toDataURL();
    }
    return iconCache[kind];
  }

  // ---------- armas (cano apontando para a direita; "hold" é onde a mão segura) ----------
  const ARMAS = {
    pistola: {
      nome: 'Pistola', vb: [-14, -18, 68, 44], hold: [-2, 10], muzzle: [50, -9],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -18 68 44">
        <path d="M-8 -14 H 46 Q 50 -14 50 -10 V -4 H -8 Z" fill="#59606F" stroke="#191B22" stroke-width="3" stroke-linejoin="round"/>
        <rect x="-8" y="-5" width="36" height="9" rx="2" fill="#3C414D" stroke="#191B22" stroke-width="3"/>
        <path d="M-7 2 H 6 L 2 22 H -11 Z" fill="#7A5232" stroke="#191B22" stroke-width="3" stroke-linejoin="round"/>
        <path d="M7 4 Q 10 13 18 5" fill="none" stroke="#191B22" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="40" y="-17" width="4" height="4" fill="#191B22"/></svg>`,
    },
    metralhadora: {
      nome: 'Metralhadora', vb: [-46, -22, 134, 52], hold: [-5, 10], muzzle: [82, -5],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -22 134 52">
        <path d="M-42 -8 L -14 -10 L -14 4 L -36 10 Q -44 10 -42 2 Z" fill="#6E4B2E" stroke="#191B22" stroke-width="3" stroke-linejoin="round"/>
        <rect x="-16" y="-13" width="62" height="16" rx="3" fill="#3C414D" stroke="#191B22" stroke-width="3"/>
        <rect x="44" y="-9" width="38" height="7" rx="2" fill="#59606F" stroke="#191B22" stroke-width="3"/>
        <path d="M10 2 H 22 L 26 26 H 14 Z" fill="#2A2E37" stroke="#191B22" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-8 2 H 2 L -2 20 H -12 Z" fill="#6E4B2E" stroke="#191B22" stroke-width="3" stroke-linejoin="round"/>
        <rect x="-4" y="-19" width="22" height="6" rx="2" fill="#191B22"/></svg>`,
    },
    arco: {
      nome: 'Arco e flecha', vb: [-16, -48, 66, 96], hold: [9, 0], muzzle: [46, 0],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -48 66 96">
        <path d="M-4 -44 Q 22 0 -4 44" fill="none" stroke="#5A3A1A" stroke-width="9" stroke-linecap="round"/>
        <path d="M-4 -44 Q 22 0 -4 44" fill="none" stroke="#B5783E" stroke-width="5" stroke-linecap="round"/>
        <path d="M-4 -44 L -10 0 L -4 44" fill="none" stroke="#F3EDE2" stroke-width="1.8"/>
        <rect x="5" y="-7" width="8" height="14" rx="3" fill="#3A2412"/></svg>`,
    },
    taco: {
      nome: 'Taco de beisebol', vb: [-14, -14, 96, 28], hold: [2, 0], muzzle: [70, 0],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -14 96 28">
        <path d="M-6 -3.5 L 36 -5 C 56 -9, 76 -10, 78 0 C 76 10, 56 9, 36 5 L -6 3.5 Z" fill="#D9A062" stroke="#5A3A1A" stroke-width="3" stroke-linejoin="round"/>
        <path d="M40 -3 C 56 -6, 68 -6, 72 -3" stroke="#F2C894" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <rect x="-7" y="-4.5" width="16" height="9" rx="2" fill="#26262E"/><circle cx="-8" cy="0" r="5" fill="#5A3A1A"/></svg>`,
    },
  };
  const ARROW = { vb: [-8, -8, 66, 16], svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 66 16">
    <path d="M0 0 H 46" stroke="#8A5A2B" stroke-width="3" stroke-linecap="round"/>
    <path d="M46 -5 L 56 0 L 46 5 Z" fill="#9AA3AE" stroke="#191B22" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M0 0 L -6 -6 M0 0 L -6 6 M5 0 L -1 -6 M5 0 L -1 6" stroke="#E2453C" stroke-width="2.5" stroke-linecap="round"/></svg>` };
  const wcache = {};
  function weapon(type) {
    if (!(type in wcache)) { wcache[type] = null; const A = type === 'flecha' ? ARROW : ARMAS[type]; toCanvas(A.svg, A.vb[2], A.vb[3], RES * 1.4).then(cv => { wcache[type] = cv; }); }
    return wcache[type];
  }
  const weaponIcon = type => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ARMAS[type].svg);

  // ---------- desenho de um personagem em peças ----------
  // c: { id, horror, face, rot, legA, armF, armB, weapon, recoil, pop, alpha }; (px, py) = pés na tela; tile = tamanho do bloco em px
  function limb(cx, img, x, y, a, vx, vy, w, h) { cx.save(); cx.translate(x, y); cx.rotate(a); cx.drawImage(img, vx, vy, w, h); cx.restore(); }
  function drawPuppet(cx, c, px, py, tile) {
    const sp = char(c.id, c.horror), s = tile * SIZE / 352, rot = c.rot || 0;
    cx.save(); cx.translate(px, py);
    cx.translate(0, -Math.min(1, Math.abs(Math.sin(rot))) * 44 * s);
    cx.rotate(rot); cx.scale((c.face || 1) * s * (c.pop || 1), s * (c.pop || 1)); cx.translate(-100, -294);
    if (c.alpha != null) cx.globalAlpha *= c.alpha;
    if (!sp) { cx.fillStyle = 'rgba(120,120,140,.45)'; cx.beginPath(); cx.ellipse(100, 160, 60, 120, 0, 0, Math.PI * 2); cx.fill(); cx.restore(); return; }
    limb(cx, sp.arm, 66, 188, c.armB == null ? 0.25 : c.armB, -16, -16, 32, 92);
    limb(cx, sp.leg, 85, 232, c.legA || 0, -14, -4, 40, 70);
    limb(cx, sp.leg, 115, 232, -(c.legA || 0), -14, -4, 40, 70);
    cx.drawImage(sp.body, 0, -52, 200, 352);
    cx.save(); cx.translate(134, 188); cx.rotate(c.armF == null ? -0.25 : c.armF);
    if (c.weapon) {
      const A = ARMAS[c.weapon], img = weapon(c.weapon);
      if (img) {
        cx.save(); cx.translate(0, 60); cx.rotate(Math.PI / 2); cx.scale(WS, WS); if (c.recoil) cx.translate(-c.recoil * 6, 0);
        cx.drawImage(img, A.vb[0] - A.hold[0], A.vb[1] - A.hold[1], A.vb[2], A.vb[3]);
        if (c.weapon === 'arco' && !c.noArrow) { const ar = weapon('flecha'); if (ar) cx.drawImage(ar, -19 - 8 - 6, -8, 66, 16); }
        cx.restore();
      }
    }
    cx.drawImage(sp.arm, -16, -16, 32, 92);
    cx.restore();
    cx.restore();
  }

  function preload() {
    Object.keys(ARMAS).forEach(weapon); weapon('flecha');
    Object.keys(BLOCOS).forEach(blockTex);
  }

  window.Sprites = { SIZE, WS, char, charReady, BLOCOS, blockTex, blockIcon, ARMAS, ARROW, weapon, weaponIcon, drawPuppet, preload };
})();
