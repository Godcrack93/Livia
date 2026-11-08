/* Parquinho Sprunki — tela, câmera (zoom e passear), toques e desenho */
(function () {
  'use strict';
  const { CHARS, iconSVG } = window.SPR, M = window.Mundo, S = window.Sprites, Som = window.Som, W = M.W;
  const $ = s => document.querySelector(s);
  const app = $('#app'), scene = $('#scene'), cv = $('#cv'), cx = cv.getContext('2d'), itemsEl = $('#items'), ghost = $('#ghost'), hint = $('#hint'), toastEl = $('#toast');
  const zoomEl = $('#zoom'), knob = $('#zknob'), zfill = $('#zfill');
  const STEP = 1 / 60, SAVE_KEY = 'parquinho.cena', TAB_NAMES = { sprunkis: 'Sprunkis', blocos: 'Blocos', armas: 'Armas' };
  let DPR = 1, VW = 0, VH = 0, acc = 0, lastTs = 0, saveT = 0, uidN = 0;
  const cam = { x: M.COLS / 2, y: M.ROWS, z: 40 };
  let zMin = 8, zMax = 100, savedCam = null;
  let zWant = 1 / 16; // zoom escolhido, como fração da altura da tela (não muda quando a tela muda de tamanho)
  const bg = document.createElement('canvas');            // céu, sol e nuvens (tela)
  const TP = 16, mapa = document.createElement('canvas'); // todos os blocos do mapa, 16 px por bloco
  mapa.width = M.COLS * TP; mapa.height = M.ROWS * TP;
  const mctx = mapa.getContext('2d');
  const sel = { tab: 'sprunkis', sprunkis: { id: 'bumbo', horror: false }, blocos: 'madeira', armas: 'pistola' };
  let eraser = false, paused = false, drag = null, hover = null, pinch = null;
  const pointers = new Map();
  const uid = () => 'pq' + (++uidN);

  // ---------- câmera ----------
  function limits() { zMin = Math.max(4, Math.min(VW / M.COLS, VH / M.ROWS)); zMax = Math.max(zMin * 2, VH / 8); }
  function clampCam() {
    cam.z = Math.max(zMin, Math.min(zMax, cam.z));
    const vw = VW / cam.z, vh = VH / cam.z;
    cam.x = vw >= M.COLS ? M.COLS / 2 : Math.max(vw / 2, Math.min(M.COLS - vw / 2, cam.x));
    cam.y = vh >= M.ROWS ? M.ROWS - vh / 2 : Math.max(vh / 2, Math.min(M.ROWS - vh / 2, cam.y));
    syncSlider();
  }
  const sx = x => (x - cam.x) * cam.z + VW / 2, sy = y => (y - cam.y) * cam.z + VH / 2;
  function toWorld(clientX, clientY) {
    const r = cv.getBoundingClientRect();
    return { x: cam.x + (clientX - r.left - VW / 2) / cam.z, y: cam.y + (clientY - r.top - VH / 2) / cam.z };
  }
  function zoomAt(z, px, py) { // (px, py): ponto da tela que fica parado
    const wx = cam.x + (px - VW / 2) / cam.z, wy = cam.y + (py - VH / 2) / cam.z;
    cam.z = Math.max(zMin, Math.min(zMax, z));
    cam.x = wx - (px - VW / 2) / cam.z; cam.y = wy - (py - VH / 2) / cam.z;
    clampCam(); zWant = cam.z / VH;
  }
  // zoom pela lupa: se o chão aparece na tela, ele fica parado embaixo; senão, o meio da tela fica parado
  function zoomCenter(z) { zoomAt(z, VW / 2, cam.y + VH / (2 * cam.z) >= M.ROWS - 0.01 ? sy(M.ROWS) : VH / 2); }
  const tOf = z => Math.log(z / zMin) / Math.log(zMax / zMin), zOf = t => zMin * Math.pow(zMax / zMin, t);
  function syncSlider() {
    const t = Math.max(0, Math.min(1, tOf(cam.z)));
    knob.style.top = ((1 - t) * 100).toFixed(2) + '%'; zfill.style.height = (t * 100).toFixed(2) + '%';
    zoomEl.setAttribute('aria-valuenow', Math.round(t * 100));
  }
  // controle deslizante da lupa
  let zoomPid = null;
  function zoomFromPointer(e) {
    const r = zoomEl.querySelector('.ztrack').getBoundingClientRect();
    zoomCenter(zOf(Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height))));
  }
  zoomEl.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); zoomPid = e.pointerId; try { zoomEl.setPointerCapture(e.pointerId); } catch (err) { /* nada */ } zoomFromPointer(e); hideHint(); });
  zoomEl.addEventListener('pointermove', e => { if (e.pointerId === zoomPid) zoomFromPointer(e); });
  const zoomEnd = e => { if (e.pointerId === zoomPid) zoomPid = null; };
  zoomEl.addEventListener('pointerup', zoomEnd); zoomEl.addEventListener('pointercancel', zoomEnd);
  zoomEl.addEventListener('keydown', e => {
    const d = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 0.06 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -0.06 : 0;
    if (d) { e.preventDefault(); zoomCenter(zOf(Math.max(0, Math.min(1, tOf(cam.z) + d)))); }
  });

  // ---------- tamanho e fundo ----------
  function resize() {
    const r = scene.getBoundingClientRect(); if (!r.width || !r.height) return;
    const first = !VW;
    VW = r.width; VH = r.height; DPR = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR); cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
    bg.width = cv.width; bg.height = cv.height; drawBg();
    limits();
    if (first && savedCam) { cam.x = savedCam.x; cam.y = savedCam.y; zWant = savedCam.zr || 1 / 16; }
    cam.z = zWant * VH;
    clampCam();
  }
  function drawBg() {
    const b = bg.getContext('2d'); b.setTransform(DPR, 0, 0, DPR, 0, 0);
    const g = b.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#7CC8FF'); g.addColorStop(0.65, '#C8ECFF'); g.addColorStop(1, '#E8F7FF');
    b.fillStyle = g; b.fillRect(0, 0, VW, VH);
    const u = VH / 16, x0 = VW * 0.8, y0 = VH * 0.17, sr = u * 1.1, sg = b.createRadialGradient(x0, y0, 0, x0, y0, sr * 2.3);
    sg.addColorStop(0, 'rgba(255,250,210,1)'); sg.addColorStop(0.42, 'rgba(255,241,170,.95)'); sg.addColorStop(1, 'rgba(255,241,170,0)');
    b.fillStyle = sg; b.beginPath(); b.arc(x0, y0, sr * 2.3, 0, Math.PI * 2); b.fill();
    b.fillStyle = 'rgba(255,255,255,.85)';
    [[0.12, 0.14, 1.2], [0.42, 0.08, 0.9], [0.6, 0.22, 1], [0.92, 0.33, 0.8]].forEach(([fx, fy, k]) => {
      const x = VW * fx, y = VH * fy, q = u * 0.5 * k;
      b.fillRect(x, y, q * 6, q * 1.4); b.fillRect(x + q, y - q * 0.9, q * 3.4, q); b.fillRect(x + q * 2.2, y - q * 1.6, q * 1.8, q);
    });
  }
  // colinas ao fundo, em degraus; andam mais devagar que o mapa
  function drawHills() {
    const gy = sy(M.ROWS - 2), step = Math.max(4, cam.z * 0.5);
    [['#B5E3C0', 0.11, 2.6, 0.45], ['#93D3A6', 0.23, 1.6, 0.7]].forEach(([col, f, k, par], li) => {
      cx.fillStyle = col;
      const off = cam.x * cam.z * par, i0 = Math.floor(off / step), frac = off - i0 * step;
      for (let i = -1; i * step < VW + step; i++) {
        const hx = (i0 + i) * 0.5;
        const h = (Math.sin(hx * f + li * 2) * 0.5 + Math.sin(hx * f * 2.3 + 1 + li) * 0.3 + 1.1) * k * cam.z;
        cx.fillRect(i * step - frac, gy - Math.round(h / step) * step, step + 1, VH);
      }
    });
  }
  function paintCell(i) {
    const c = i % M.COLS, r = (i / M.COLS) | 0, id = W.tiles[i];
    mctx.clearRect(c * TP, r * TP, TP, TP);
    if (id) mctx.drawImage(S.blockTex(M.BLOCKS[id]), c * TP, r * TP, TP, TP);
  }
  function updateMap() {
    mctx.imageSmoothingEnabled = false;
    if (W.dirty) { mctx.clearRect(0, 0, mapa.width, mapa.height); for (let i = 0; i < W.tiles.length; i++) if (W.tiles[i]) paintCell(i); W.dirty = false; W.dirtyCells.length = 0; }
    else if (W.dirtyCells.length) { for (const i of W.dirtyCells) paintCell(i); W.dirtyCells.length = 0; }
  }

  // ---------- desenho (em blocos, com a câmera aplicada) ----------
  const worldView = () => { const z = cam.z * DPR; cx.setTransform(z, 0, 0, z, DPR * (VW / 2 - cam.x * cam.z), DPR * (VH / 2 - cam.y * cam.z)); };
  const px = n => n / cam.z; // converte pixels da tela em blocos
  function star(x, y, r, col) {
    cx.fillStyle = col; cx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; cx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    cx.closePath(); cx.fill();
  }
  function rrect(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  const UNIT = S.SIZE / 352;
  function drawChar(c) {
    if (c.onGround && !c.grabbed) {
      const lying = c.state === 'down';
      cx.fillStyle = 'rgba(30,20,60,.16)'; cx.beginPath();
      cx.ellipse(c.x + (lying ? c.downDir * 0.7 : 0), c.y, lying ? 1.1 : 0.5, 0.1, 0, 0, Math.PI * 2); cx.fill();
    }
    c.noArrow = c.weapon === 'arco' && c.cd > 0.55;
    cx.save();
    if (c.hurtT > 0 && Math.floor(c.hurtT * 24) % 2 === 0) cx.globalAlpha = 0.5;
    S.drawPuppet(cx, c, c.x, c.y, 1);
    cx.restore();
  }
  function drawOverlay(c) {
    if (c.grabbed) return;
    const lying = c.state === 'down';
    if (c.hp < 100 && W.t - c.lastHit < 3) {
      const w = 1, h = Math.max(0.12, px(4)), bx = c.x - w / 2, by = c.y - (lying ? 1.35 : 2.5), p2 = px(2);
      cx.fillStyle = 'rgba(20,20,30,.75)'; rrect(bx - p2, by - p2, w + p2 * 2, h + p2 * 2, px(4)); cx.fill();
      cx.fillStyle = c.horror ? '#B84BEF' : '#5DE07F'; rrect(bx, by, Math.max(px(2), w * Math.max(0, c.hp) / 100), h, px(3)); cx.fill();
    }
    if (lying && !c.flying) {
      const hx = c.x + Math.sin(c.rot) * 190 * UNIT, hy = c.y - 0.85;
      for (let i = 0; i < 3; i++) { const a = W.t * 4 + i * 2.1; star(hx + Math.cos(a) * 0.45, hy + Math.sin(a) * 0.15, 0.13, '#FFD84D'); }
    }
  }
  function drawItem(it) {
    const img = S.weapon(it.type), A = S.ARMAS[it.type]; if (!img) return;
    const s = UNIT * S.WS * 0.9;
    cx.save(); cx.translate(it.x, it.y - it.h / 2); cx.rotate(it.rot + (it.type === 'arco' ? Math.PI / 2 : 0));
    if (!it.grabbed && it.pickT <= 0) {
      cx.globalAlpha = 0.22 + 0.2 * Math.sin(W.t * 4 + it.uid); cx.fillStyle = '#FFF6B0';
      cx.beginPath(); cx.ellipse(0, 0, A.vb[2] * s * 0.62, A.vb[3] * s * 0.62, 0, 0, Math.PI * 2); cx.fill(); cx.globalAlpha = 1;
    }
    cx.scale(s, s); cx.drawImage(img, -A.vb[2] / 2, -A.vb[3] / 2, A.vb[2], A.vb[3]);
    cx.restore();
  }
  function drawArrow(x, y, ang, alpha) {
    const img = S.weapon('flecha'); if (!img) return;
    const s = UNIT * S.WS;
    cx.save(); cx.globalAlpha = alpha; cx.translate(x, y); cx.rotate(ang); cx.scale(s, s); cx.drawImage(img, -8 - 56, -8, 66, 16); cx.restore();
  }
  function drawProj(p) {
    if (p.kind === 'bala') {
      const L = Math.hypot(p.vx, p.vy), ux = p.vx / L, uy = p.vy / L;
      cx.strokeStyle = '#FFE680'; cx.lineWidth = Math.max(px(2), 0.08); cx.lineCap = 'round';
      cx.beginPath(); cx.moveTo(p.x - ux * 0.5, p.y - uy * 0.5); cx.lineTo(p.x, p.y); cx.stroke();
    } else drawArrow(p.x, p.y, Math.atan2(p.vy, p.vx), 1);
  }
  function drawFx(f) {
    const k = f.life / f.max;
    cx.save();
    switch (f.t) {
      case 'arrow': drawArrow(f.x, f.y, f.ang, Math.min(1, f.life)); break;
      case 'puff': cx.globalAlpha = k; cx.fillStyle = f.color; cx.beginPath(); cx.arc(f.x, f.y, f.r * (1 + (1 - k) * 1.3), 0, Math.PI * 2); cx.fill(); break;
      case 'star': cx.globalAlpha = Math.min(1, k * 1.5); star(f.x, f.y, f.r, f.color); break;
      case 'bit': cx.globalAlpha = Math.min(1, k * 2); cx.translate(f.x, f.y); cx.rotate(f.rot); cx.fillStyle = f.color; cx.fillRect(-f.r, -f.r, f.r * 2, f.r * 2); break;
      case 'flash': star(f.x, f.y, f.r, '#FFF3A0'); star(f.x, f.y, f.r * 0.5, '#FFFFFF'); break;
    }
    cx.restore();
  }
  function drawText(f) { // textos ficam em pixels da tela, sempre legíveis
    const k = f.life / f.max, size = Math.max(14, cam.z * (f.big ? 0.62 : 0.42));
    cx.save();
    cx.globalAlpha = Math.min(1, k * 2.5); cx.font = `400 ${size}px 'Lilita One', 'Baloo 2', sans-serif`; cx.textAlign = 'center'; cx.lineJoin = 'round';
    cx.lineWidth = Math.max(3, size * 0.22); cx.strokeStyle = '#2A1B4D'; cx.strokeText(f.text, sx(f.x), sy(f.y)); cx.fillStyle = f.color; cx.fillText(f.text, sx(f.x), sy(f.y));
    cx.restore();
  }
  function drawHover() {
    if (!hover || pinch) return;
    if (eraser) {
      cx.strokeStyle = 'rgba(226,69,60,.95)'; cx.lineWidth = px(3);
      cx.beginPath(); cx.arc(hover.x, hover.y, 0.45, 0, Math.PI * 2); cx.stroke();
      cx.beginPath(); cx.moveTo(hover.x - 0.25, hover.y - 0.25); cx.lineTo(hover.x + 0.25, hover.y + 0.25); cx.moveTo(hover.x + 0.25, hover.y - 0.25); cx.lineTo(hover.x - 0.25, hover.y + 0.25); cx.stroke();
      return;
    }
    if (sel.tab !== 'blocos') return;
    const c = Math.floor(hover.x), r = Math.floor(hover.y);
    if (c < 0 || c >= M.COLS || r < 0 || r >= M.ROWS) return;
    cx.globalAlpha = 0.5; cx.imageSmoothingEnabled = false; cx.drawImage(S.blockTex(sel.blocos), c, r, 1, 1); cx.imageSmoothingEnabled = true; cx.globalAlpha = 1;
    cx.strokeStyle = '#fff'; cx.lineWidth = px(2); cx.setLineDash([px(5), px(4)]); cx.strokeRect(c + px(1), r + px(1), 1 - px(2), 1 - px(2)); cx.setLineDash([]);
  }
  function render() {
    if (!VW) return;
    updateMap();
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.drawImage(bg, 0, 0);
    cx.setTransform(DPR, 0, 0, DPR, 0, 0); drawHills();
    worldView();
    cx.imageSmoothingEnabled = false; cx.drawImage(mapa, 0, 0, M.COLS, M.ROWS); cx.imageSmoothingEnabled = true;
    // fora do mapa (quando o zoom está bem longe): faixa escura nas bordas
    cx.fillStyle = 'rgba(23,25,34,.35)'; cx.fillRect(-M.COLS, -M.ROWS, M.COLS, M.ROWS * 3); cx.fillRect(M.COLS, -M.ROWS, M.COLS, M.ROWS * 3);
    drawHover();
    for (const f of W.fx) if (f.t === 'arrow') drawFx(f);
    W.items.forEach(drawItem);
    let held = null;
    for (const c of W.chars) { if (c.grabbed) held = c; else drawChar(c); }
    if (held) drawChar(held);
    W.projs.forEach(drawProj);
    for (const f of W.fx) if (f.t !== 'arrow' && f.t !== 'text') drawFx(f);
    W.chars.forEach(drawOverlay);
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (const f of W.fx) if (f.t === 'text') drawText(f);
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, lastTs ? (ts - lastTs) / 1000 : STEP); lastTs = ts;
    if (!paused) { acc += dt; let n = 0; while (acc >= STEP && n < 5) { M.update(STEP); acc -= STEP; n++; } if (n === 5) acc = 0; }
    render();
    if (!paused) { saveT += dt; if (saveT > 4) { saveT = 0; save(); } }
  }

  // ---------- paleta ----------
  function renderItems() {
    itemsEl.innerHTML = ''; $('#tabname').textContent = TAB_NAMES[sel.tab];
    document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === sel.tab ? 'true' : 'false'));
    if (sel.tab === 'sprunkis') {
      CHARS.forEach(def => [false, true].forEach(h => addBtn({ kind: 'sprunki', id: def.id, horror: h }, iconSVG(def, uid(), h),
        def.name + (h ? ' de terror' : ''), sel.sprunkis.id === def.id && sel.sprunkis.horror === h, h ? 'h' : '', false)));
    } else if (sel.tab === 'blocos') {
      Object.keys(S.BLOCOS).forEach(b => addBtn({ kind: 'bloco', id: b }, `<img src="${S.blockIcon(b)}" alt="">`, S.BLOCOS[b].nome, sel.blocos === b, 'pix', true));
    } else {
      Object.keys(S.ARMAS).forEach(a => addBtn({ kind: 'arma', id: a }, `<img src="${S.weaponIcon(a)}" alt="">`, S.ARMAS[a].nome, sel.armas === a, 'wpn', true));
    }
  }
  function addBtn(item, inner, name, on, cls, showName) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'it ' + cls; b.title = name; b.setAttribute('aria-label', name); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.innerHTML = inner + (showName ? `<span class="lbl">${name}</span>` : '');
    b.addEventListener('pointerdown', e => paletteDown(e, item, b));
    b.addEventListener('click', e => { if (e.detail === 0) select(item, b); });
    itemsEl.appendChild(b);
  }
  function select(item, b) {
    setEraser(false);
    if (item.kind === 'sprunki') sel.sprunkis = { id: item.id, horror: item.horror };
    else if (item.kind === 'bloco') sel.blocos = item.id; else sel.armas = item.id;
    itemsEl.querySelectorAll('.it').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    if (item.kind === 'sprunki') S.charReady(item.id, item.horror);
  }
  function paletteDown(e, item, b) {
    if (e.button > 0) return;
    Som.init();
    const st = { x: e.clientX, y: e.clientY, pid: e.pointerId, moved: false };
    const mv = ev => {
      if (ev.pointerId !== st.pid) return;
      if (!st.moved && Math.hypot(ev.clientX - st.x, ev.clientY - st.y) > 8) { st.moved = true; showGhost(b); }
      if (st.moved) ghost.style.transform = `translate(${ev.clientX - 42}px, ${ev.clientY - 60}px)`;
    };
    const up = ev => {
      if (ev.pointerId !== st.pid) return;
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      ghost.hidden = true;
      if (ev.type === 'pointercancel') return;
      select(item, b);
      if (st.moved) {
        const r = cv.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) { hideHint(); useTool(toWorld(ev.clientX, ev.clientY)); }
      }
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }
  function showGhost(b) {
    ghost.innerHTML = b.querySelector('svg, img').outerHTML;
    ghost.className = b.classList.contains('pix') ? 'pix' : '';
    ghost.hidden = false;
  }
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { sel.tab = t.dataset.tab; setEraser(false); renderItems(); }));

  // ---------- cenário: tocar, arrastar, pintar, passear e zoom ----------
  function useTool(p) {
    if (sel.tab === 'sprunkis') M.spawnChar(sel.sprunkis.id, sel.sprunkis.horror, p.x, p.y);
    else if (sel.tab === 'blocos') paint(p, p);
    else { const c = M.charAt(p.x, p.y); if (c && !c.horror) M.equip(c, sel.armas); else M.spawnItem(sel.armas, p.x, p.y); }
  }
  function paint(a, b) {
    let x0 = Math.floor(a.x), y0 = Math.floor(a.y);
    const x1 = Math.floor(b.x), y1 = Math.floor(b.y), dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sxs = x0 < x1 ? 1 : -1, sys = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let n = 0; n < 400; n++) {
      M.placeBlock(x0, y0, sel.blocos);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sxs; } if (e2 <= dx) { err += dx; y0 += sys; }
    }
  }
  function eraseLine(a, b) {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.3));
    for (let i = 1; i <= n; i++) M.eraseAt(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n);
  }
  function velocity(samples) {
    const last = samples[samples.length - 1];
    let first = samples[0];
    for (const s of samples) if (last[0] - s[0] < 120) { first = s; break; }
    const dt = (last[0] - first[0]) / 1000;
    return dt > 0.01 ? { x: (last[1] - first[1]) / dt, y: (last[2] - first[2]) / dt } : { x: 0, y: 0 };
  }
  function firstStroke(d) { if (d.type === 'paint') paint(d.last, d.last); else M.eraseAt(d.last.x, d.last.y); }
  function startPinch() {
    if (drag && drag.obj && drag.obj.grabbed) M.release(drag.obj, 0, 0);
    drag = null;
    const [a, b] = [...pointers.values()], r = cv.getBoundingClientRect();
    const m = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
    pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: cam.z, w: { x: cam.x + (m.x - VW / 2) / cam.z, y: cam.y + (m.y - VH / 2) / cam.z } };
  }
  function updatePinch() {
    const [a, b] = [...pointers.values()]; if (!b) return;
    const r = cv.getBoundingClientRect(), d = Math.hypot(a.x - b.x, a.y - b.y) || 1, m = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
    cam.z = Math.max(zMin, Math.min(zMax, pinch.z0 * d / pinch.d0));
    cam.x = pinch.w.x - (m.x - VW / 2) / cam.z; cam.y = pinch.w.y - (m.y - VH / 2) / cam.z;
    clampCam(); zWant = cam.z / VH;
  }
  cv.addEventListener('pointerdown', e => {
    Som.init(); hideHint();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
    if (pointers.size === 2) { startPinch(); return; }
    if (pointers.size > 2 || pinch) return;
    const p = toWorld(e.clientX, e.clientY); hover = p;
    drag = { pid: e.pointerId, sx: e.clientX, sy: e.clientY, last: p, samples: [[performance.now(), p.x, p.y]], cam0: { x: cam.x, y: cam.y } };
    if (e.button === 1 || e.button === 2) { drag.type = 'pan'; return; } // botão do meio ou direito do mouse: passear
    if (e.button > 0) { drag = null; return; }
    // pintar e apagar só começam quando o dedo anda ou sai: assim o primeiro dedo de uma pinça não deixa bloco nem apaga nada
    if (eraser) { drag.type = 'erase'; drag.wait = true; return; }
    const ch = M.charAt(p.x, p.y);
    if (ch) { drag.type = 'pending'; drag.obj = ch; drag.ox = ch.x - p.x; drag.oy = ch.y - p.y; return; }
    const it = M.itemAt(p.x, p.y);
    if (it) { drag.type = 'grab'; drag.obj = it; drag.ox = it.x - p.x; drag.oy = it.y - p.y; M.grab(it); return; }
    if (sel.tab === 'blocos') { drag.type = 'paint'; drag.wait = true; return; }
    drag.type = 'tap'; // tocar solta o item escolhido; arrastar passeia pelo mapa
  });
  cv.addEventListener('pointermove', e => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch) { updatePinch(); return; }
    const p = toWorld(e.clientX, e.clientY); hover = p;
    if (!drag || e.pointerId !== drag.pid) return;
    drag.samples.push([performance.now(), p.x, p.y]); if (drag.samples.length > 10) drag.samples.shift();
    const moved = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
    if (drag.type === 'tap' && moved > 8) drag.type = 'pan';
    if (drag.type === 'pan') { cam.x = drag.cam0.x - (e.clientX - drag.sx) / cam.z; cam.y = drag.cam0.y - (e.clientY - drag.sy) / cam.z; clampCam(); return; }
    if (drag.wait) { if (moved <= 5) return; drag.wait = false; firstStroke(drag); }
    if (drag.type === 'pending' && moved > 6) { drag.type = 'grab'; M.grab(drag.obj); }
    if (drag.type === 'grab') M.moveGrabbed(drag.obj, p.x + drag.ox, p.y + drag.oy, velocity(drag.samples).x);
    else if (drag.type === 'paint') paint(drag.last, p);
    else if (drag.type === 'erase') eraseLine(drag.last, p);
    drag.last = p;
  });
  function pointerEnd(e) {
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size === 0) pinch = null; return; }
    if (!drag || e.pointerId !== drag.pid) return;
    const d = drag; drag = null;
    if (d.type === 'grab') {
      const v = velocity(d.samples); M.release(d.obj, v.x, v.y);
      if (d.obj.kind === 'item') { const c = M.charAt(d.obj.x, d.obj.y - 0.3, true); if (c && !c.horror) M.equipFromItem(c, d.obj); }
    } else if (d.type === 'pending' && e.type === 'pointerup') {
      if (sel.tab === 'armas' && !d.obj.horror) M.equip(d.obj, sel.armas); else M.poke(d.obj);
    } else if (d.type === 'tap' && e.type === 'pointerup') useTool(d.last);
    else if (d.wait && e.type === 'pointerup') firstStroke(d);
  }
  cv.addEventListener('pointerup', pointerEnd);
  cv.addEventListener('pointercancel', pointerEnd);
  cv.addEventListener('pointerleave', () => { if (!drag) hover = null; });
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    zoomAt(cam.z * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  document.addEventListener('contextmenu', e => e.preventDefault());

  // ---------- botões ----------
  function setEraser(on) { eraser = on; $('#btnErase').setAttribute('aria-pressed', on ? 'true' : 'false'); scene.classList.toggle('erasing', on); }
  $('#btnErase').addEventListener('click', () => { Som.init(); setEraser(!eraser); toast(eraser ? 'Borracha ligada: toque no que quiser apagar.' : 'Borracha desligada.'); });
  let clearArm = 0;
  $('#btnClear').addEventListener('click', () => {
    Som.init();
    const b = $('#btnClear');
    if (Date.now() - clearArm < 2600) {
      clearArm = 0; b.classList.remove('armed'); M.clearAll(); Som.erase(); save(); toast('Tudo limpo!');
    } else {
      clearArm = Date.now(); b.classList.remove('armed'); void b.offsetWidth; b.classList.add('armed');
      toast('Toque de novo para limpar tudo.');
      setTimeout(() => { if (Date.now() - clearArm >= 2500) b.classList.remove('armed'); }, 2600);
    }
  });
  $('#btnPanel').addEventListener('click', () => {
    const c = app.classList.toggle('collapsed');
    $('#btnPanel').title = c ? 'Mostrar o painel' : 'Esconder o painel'; $('#btnPanel').setAttribute('aria-label', $('#btnPanel').title);
  });
  $('#btnMute').addEventListener('click', () => {
    Som.init(); const m = !Som.isMuted(); Som.setMuted(m);
    const b = $('#btnMute'); b.setAttribute('aria-pressed', m ? 'true' : 'false'); b.setAttribute('aria-label', m ? 'Ligar o som' : 'Desligar o som');
    b.querySelector('.wave').style.display = m ? 'none' : ''; b.querySelector('.off').style.display = m ? '' : 'none';
  });
  $('#btnPause').addEventListener('click', () => {
    paused = !paused;
    const b = $('#btnPause'); b.setAttribute('aria-pressed', paused ? 'true' : 'false'); b.title = paused ? 'Continuar' : 'Pausar'; b.setAttribute('aria-label', b.title);
    b.querySelector('.pa').style.display = paused ? 'none' : ''; b.querySelector('.pl').style.display = paused ? '' : 'none';
    $('#paused').hidden = !paused;
  });
  let toastT = 0;
  function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 2400); }
  function hideHint() { hint.hidden = true; }

  // ---------- salvar ----------
  function save() {
    const c = VW ? { x: +cam.x.toFixed(2), y: +cam.y.toFixed(2), zr: +zWant.toFixed(4) } : savedCam; // a tela ainda não apareceu: mantém a câmera salva
    try { localStorage.setItem(SAVE_KEY, M.serialize(c)); } catch (e) { /* sem armazenamento */ }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
  window.addEventListener('pagehide', save);

  // ---------- início ----------
  S.preload(); S.charReady('bumbo', false);
  renderItems();
  let loaded = null;
  try { const s = localStorage.getItem(SAVE_KEY); if (s) loaded = M.deserialize(s); } catch (e) { loaded = null; }
  if (!loaded) M.starter(); else { hint.hidden = true; savedCam = loaded.cam; }
  resize();
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(scene);
  requestAnimationFrame(frame);

  // para testes: avança a simulação alguns segundos e desenha (útil quando a aba está escondida)
  window.Parquinho = { M, S, sel, cam, step(sec) { for (let i = 0; i < Math.round(sec / STEP); i++) M.update(STEP); render(); }, zoomAt, zoomCenter };
})();
