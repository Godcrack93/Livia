/* Sprunkinhos — palco, arrastar e soltar, animações, segredos */
(function () {
  'use strict';
  const { CHARS, CATS, byId, charSVG, iconSVG, graySVG } = window.SPR;
  const FX = window.SprFX, E = new window.SprEngine();
  const N = 7, AR = 352 / 200, FEET = 346 / 352;
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), slotsEl = $('#slots'), palette = $('#palette'), ghost = $('#ghost');
  const menu = $('#menu'), banner = $('#banner'), hint = $('#hint'), toastEl = $('#toast');
  let uidN = 0; const uid = () => 'u' + (++uidN);
  const slots = new Array(N).fill(null), actors = new Map(), slotEls = [], tiles = {};
  let started = false, paused = false, layoutInfo = null, kick = 0, lastTs = 0, idleT = 0, zzzT = 2, pendingRestore = null;
  let horror = false, night = false, pendingHorror = false, scareT = 14, blackT = 30, blackUntil = 0, ptr = null, stageRect = null;

  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/></svg>',
  };
  const SECRET_ICONS = {
    banda: '<svg viewBox="0 0 48 48"><path d="M6 36a18 18 0 0 1 36 0" fill="none" stroke="#FF5B5B" stroke-width="5"/><path d="M11 36a13 13 0 0 1 26 0" fill="none" stroke="#FFC93C" stroke-width="5"/><path d="M16 36a8 8 0 0 1 16 0" fill="none" stroke="#3B9BFF" stroke-width="5"/></svg>',
    cheia: '<svg viewBox="0 0 48 48"><circle cx="24" cy="22" r="13" fill="#C9D3FF" stroke="#5B4BC4" stroke-width="3"/><path d="M11 22h26M24 9v26M15 13l18 18M33 13L15 31" stroke="#5B4BC4" stroke-width="2"/><path d="M24 4v5" stroke="#5B4BC4" stroke-width="3"/><rect x="6" y="38" width="5" height="5" fill="#FF6A3D"/><rect x="38" y="36" width="5" height="5" fill="#12A874"/></svg>',
    bateria: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="18" rx="15" ry="6" fill="#FFE1D4" stroke="#C2410C" stroke-width="3"/><path d="M9 18v14c0 3.3 6.7 6 15 6s15-2.7 15-6V18" fill="#FF6A3D" stroke="#C2410C" stroke-width="3"/><path d="M14 6l8 10M36 5l-9 11" stroke="#7A3B12" stroke-width="3" stroke-linecap="round"/></svg>',
    lab: '<svg viewBox="0 0 48 48"><path d="M19 6h10M21 6v12L10 38a3 3 0 0 0 3 4h22a3 3 0 0 0 3-4L27 18V6" fill="#D8F6C2" stroke="#2E7D32" stroke-width="3" stroke-linejoin="round"/><path d="M14 31h20l3 6a2 2 0 0 1-2 3H13a2 2 0 0 1-2-3z" fill="#9BDB2E"/><circle cx="22" cy="26" r="2.5" fill="#fff"/><circle cx="27" cy="21" r="1.8" fill="#fff"/></svg>',
    orquestra: '<svg viewBox="0 0 48 48"><path d="M18 34V10l20-4v24" fill="none" stroke="#3B7BFF" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="13" cy="34" rx="6" ry="4.5" fill="#3B7BFF"/><ellipse cx="33" cy="30" rx="6" ry="4.5" fill="#3B7BFF"/><path d="M18 16l20-4" stroke="#3B7BFF" stroke-width="3.5"/></svg>',
    coral: '<svg viewBox="0 0 48 48"><path d="M12 34a8 8 0 0 1 1-16 11 11 0 0 1 21-2 8 8 0 0 1 2 18z" fill="#F3F0FF" stroke="#B84BEF" stroke-width="3" stroke-linejoin="round"/><ellipse cx="24" cy="10" rx="9" ry="3" fill="none" stroke="#FFC93C" stroke-width="3"/></svg>',
    noite: '<svg viewBox="0 0 48 48"><path d="M30 6a17 17 0 1 0 12 26A14 14 0 0 1 30 6z" fill="#FFE27A" stroke="#C99700" stroke-width="3" stroke-linejoin="round"/><circle cx="12" cy="10" r="2" fill="#B39CFF"/><circle cx="40" cy="14" r="1.6" fill="#B39CFF"/></svg>',
  };
  const SECRETS = [
    { id: 'banda', name: 'Banda Completa', hint: 'Junte uma batida, um efeito, uma melodia e uma voz.', fx: 'rainbow', test: c => c.beat && c.fx && c.mel && c.voc },
    { id: 'cheia', name: 'Casa Cheia', hint: 'Encha os 7 lugares do palco.', fx: 'party', test: c => c.total === 7 },
    { id: 'bateria', name: 'Bateria Total', hint: 'Chame todas as 5 batidas.', fx: 'beats', test: c => c.beat === 5 },
    { id: 'lab', name: 'Laboratório Maluco', hint: 'Chame todos os 5 efeitos.', fx: 'lab', test: c => c.fx === 5 },
    { id: 'orquestra', name: 'Orquestra Mágica', hint: 'Chame todas as 5 melodias.', fx: 'orch', test: c => c.mel === 5 },
    { id: 'coral', name: 'Coral das Nuvens', hint: 'Chame todas as 5 vozes.', fx: 'choir', test: c => c.voc === 5 },
    { id: 'noite', name: 'Noite Encantada', hint: 'Chame a Lua para o palco.', fx: 'night', test: c => c.lua },
    { id: 'terror', name: 'Modo Terror', hint: 'Aperte o botão do fantasma.', fx: 'terror', test: c => c.horror },
    { id: 'pesadelo', name: 'Pesadelo Completo', hint: 'No modo terror, encha os 7 lugares do palco.', fx: 'nightmare', test: c => c.horror && c.total === 7 },
  ];
  SECRET_ICONS.terror = '<svg viewBox="0 0 48 48"><path d="M10 42V22a14 14 0 0 1 28 0v20l-4.6-3.2L28.8 42 24 38.8 19.2 42l-4.6-3.2z" fill="#2A1B4D"/><circle cx="19" cy="22" r="3.4" fill="#FF3B2F"/><circle cx="29" cy="22" r="3.4" fill="#FF3B2F"/></svg>';
  SECRET_ICONS.pesadelo = '<svg viewBox="0 0 48 48"><path d="M4 24c6-9 13-13 20-13s14 4 20 13c-6 9-13 13-20 13S10 33 4 24z" fill="#1A0508" stroke="#C81E1E" stroke-width="3"/><circle cx="24" cy="24" r="7" fill="#FF3B2F"/><circle cx="24" cy="24" r="2.6" fill="#fff"/></svg>';
  const found = new Set(), activeFx = new Set();
  try { (JSON.parse(localStorage.getItem('sprunkinhos.segredos') || '[]') || []).forEach(id => found.add(id)); } catch (e) { /* sem armazenamento */ }
  const saveFound = () => { try { localStorage.setItem('sprunkinhos.segredos', JSON.stringify([...found])); } catch (e) { /* sem armazenamento */ } };

  // ---------------- montagem ----------------
  function buildPalette() {
    ['beat', 'fx', 'mel', 'voc'].forEach(cat => {
      const g = document.createElement('div');
      g.className = 'group'; g.style.setProperty('--cat', CATS[cat].color);
      g.innerHTML = `<div class="glabel"><span class="dot"></span>${CATS[cat].name}</div><div class="tiles"></div>`;
      const box = g.querySelector('.tiles');
      CHARS.filter(c => c.cat === cat || (cat === 'fx' && c.cat === 'special')).forEach(c => box.appendChild(makeTile(c)));
      palette.appendChild(g);
    });
  }
  function makeTile(c) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tile' + (c.cat === 'special' ? ' special' : '');
    b.style.setProperty('--c', c.color); b.dataset.id = c.id;
    b.setAttribute('aria-label', `${c.name} (${c.sound})`); b.title = `${c.name} · ${c.sound}`;
    b.innerHTML = iconSVG(c, uid()) + `<span class="tname">${c.name}</span>`;
    tiles[c.id] = b;
    b.addEventListener('pointerdown', e => { if (!started || e.button > 0) return; e.preventDefault(); startPress(e, { from: 'tile', id: c.id, el: b }); });
    b.addEventListener('click', e => { if (e.detail === 0) tapTile(c.id); });
    return b;
  }
  function buildSlots() {
    for (let i = 0; i < N; i++) {
      const s = document.createElement('div');
      s.className = 'slot'; s.dataset.i = i;
      s.innerHTML = `<div class="pad"></div><div class="halo"></div><div class="who gray">${graySVG(uid())}</div><div class="who char"></div><div class="say"></div><div class="badge"></div>`;
      slotsEl.appendChild(s);
      const gs = s.querySelector('.gray svg');
      slotEls.push({ el: s, char: s.querySelector('.who.char'), say: s.querySelector('.say'), target: false,
        g: { rig: gs.querySelector('.rig'), sleep: gs.querySelector('.sleep'), wake: gs.querySelector('.wake') } });
      s.addEventListener('pointerdown', e => {
        if (!started || e.button > 0) return;
        const id = slots[i];
        if (!id) { poke(i); return; }
        e.preventDefault(); startPress(e, { from: 'slot', id, el: s, slot: i });
      });
    }
  }
  function buildIntro() {
    const row = $('#introCast');
    ['bumbo', 'lala', 'zip', 'grave', 'tiriri'].forEach((id, k) => {
      const d = document.createElement('div'); d.className = 'ic'; d.style.setProperty('--k', k);
      d.innerHTML = charSVG(byId[id], uid()); row.appendChild(d);
    });
  }
  function buildLogo() {
    const word = 'Sprunkinhos', cols = ['#FF8A1F', '#EE3B3B', '#FFD83F', '#9BDB2E', '#1CC6CF', '#3B7BFF', '#7446D9', '#D946C4', '#FF7CB8', '#FFB21F', '#43BC55'];
    document.querySelectorAll('.logo').forEach(el => {
      el.innerHTML = [...word].map((ch, i) => `<span style="--lc:${cols[i % cols.length]};--i:${i}">${ch}</span>`).join('');
    });
  }

  // ---------------- layout ----------------
  function layout() {
    const r = stage.getBoundingClientRect(), W = r.width, H = r.height;
    if (!W || !H) return;
    const padX = Math.max(12, W * 0.025);
    const single = Math.min((W - 2 * padX) / 7.3, (H * 0.8) / AR, 190);
    const two = Math.min((W - 2 * padX) / 3.3, (H * 0.95) / (AR * 1.5), 230);
    const useTwo = W / H < 1.5 && two > single * 1.3;
    const P = [];
    let rowW;
    if (!useTwo) {
      const w = single, gap = Math.min(w * 0.18, (W - 2 * padX - 7 * w) / 6), ground = H - Math.max(H * 0.09, 20);
      for (let i = 0; i < N; i++) P.push({ x: W / 2 + (i - 3) * (w + gap), ground, w, z: 2 });
      rowW = 7 * w + 6 * gap;
    } else {
      const wf = two, wb = Math.min((W - 2 * padX) / 4.3, wf * 0.9);
      const gf = Math.min(wf * 0.12, (W - 2 * padX - 3 * wf) / 2), gb = Math.min(wb * 0.15, (W - 2 * padX - 4 * wb) / 3);
      const gFront = H - Math.max(H * 0.05, 14), gBack = gFront - wf * AR * 0.62;
      for (let j = 0; j < 4; j++) P.push({ x: W / 2 + (j - 1.5) * (wb + gb), ground: gBack, w: wb, z: 1 });
      for (let j = 0; j < 3; j++) P.push({ x: W / 2 + (j - 1) * (wf + gf), ground: gFront, w: wf, z: 3 });
      rowW = 4 * wb + 3 * gb;
    }
    P.forEach((p, i) => {
      const s = slotEls[i].el, h = p.w * AR;
      p.h = h; p.pan = Math.max(-0.8, Math.min(0.8, (p.x / W - 0.5) * 1.1));
      s.style.left = (p.x - p.w / 2).toFixed(1) + 'px'; s.style.top = (p.ground - h * FEET).toFixed(1) + 'px';
      s.style.width = p.w.toFixed(1) + 'px'; s.style.height = h.toFixed(1) + 'px'; s.style.zIndex = p.z;
    });
    layoutInfo = { W, H, P, useTwo, fill: useTwo ? [4, 5, 6, 0, 1, 2, 3] : [0, 1, 2, 3, 4, 5, 6] };
    const top = useTwo ? P[0].ground - P[0].w * 0.32 : P[0].ground - P[0].w * 0.34;
    stage.style.setProperty('--floor', Math.round(top) + 'px');
    stage.style.setProperty('--spk', Math.round(Math.min(H * 0.34, 150)) + 'px');
    stage.classList.toggle('two-rows', useTwo);
    stage.classList.toggle('has-speakers', !useTwo && (W - rowW) / 2 > Math.min(H * 0.34, 150) * 0.62 + 10);
    FX.resize(W, H);
    for (const a of actors.values()) E.setPan(a.id, P[a.slot].pan);
    if (!hint.hidden) showHint();
  }

  // ---------------- arrastar e soltar ----------------
  let drag = null;
  function startPress(e, src) {
    if (drag) endDrag();
    closeMenu();
    drag = Object.assign({}, src, { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, px: e.clientX, moved: false, pid: e.pointerId, target: -1 });
    try { src.el.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    drag.x = e.clientX; drag.y = e.clientY;
    if (!drag.moved && Math.hypot(drag.x - drag.x0, drag.y - drag.y0) > 7) beginDrag();
    if (drag.moved) { moveGhost(); updateTarget(); }
  }
  function beginDrag() {
    drag.moved = true;
    const def = byId[drag.id];
    ghost.innerHTML = iconSVG(def, uid(), horror); ghost.style.setProperty('--c', def.color); ghost.hidden = false;
    document.body.classList.add('dragging');
    if (drag.from === 'slot') slotEls[drag.slot].el.classList.add('lifting'); else drag.el.classList.add('lifted');
    hideHint();
  }
  function moveGhost() {
    const tilt = Math.max(-16, Math.min(16, (drag.x - drag.px) * 0.9)); drag.px = drag.x;
    ghost.style.transform = `translate(${drag.x}px, ${drag.y}px) translate(-50%, -64%) rotate(${tilt.toFixed(1)}deg)`;
  }
  function updateTarget() {
    const i = slotAt(drag.x, drag.y);
    if (i === drag.target) return;
    if (drag.target >= 0) setTarget(drag.target, false);
    drag.target = i; if (i >= 0) setTarget(i, true);
  }
  function setTarget(i, on) { slotEls[i].target = on; slotEls[i].el.classList.toggle('target', on); }
  function slotAt(x, y) {
    if (!layoutInfo) return -1;
    const sr = stage.getBoundingClientRect();
    if (y < sr.top || y > sr.bottom + 12 || x < sr.left || x > sr.right) return -1;
    let best = -1, bd = Infinity;
    layoutInfo.P.forEach((p, i) => {
      const cxp = sr.left + p.x, cyp = sr.top + p.ground - p.h * 0.45;
      const dx = (x - cxp) / (p.w * 0.75), dy = (y - cyp) / (p.h * 0.62), d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    });
    return bd < 1.7 ? best : -1;
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    const d = drag; endDrag();
    if (!d.moved) { if (d.from === 'tile') tapTile(d.id); else openMenu(d.slot); return; }
    const i = slotAt(d.x, d.y);
    if (d.from === 'tile') { if (i >= 0) place(d.id, i); }
    else if (i >= 0) { if (i !== d.slot) moveActor(d.id, i); }
    else removeActor(d.id, true);
  }
  function onCancel(e) { if (drag && e.pointerId === drag.pid) endDrag(); }
  function endDrag() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    if (drag) {
      if (drag.target >= 0) setTarget(drag.target, false);
      if (drag.el) drag.el.classList.remove('lifted');
      if (drag.from === 'slot') slotEls[drag.slot].el.classList.remove('lifting');
    }
    ghost.hidden = true; document.body.classList.remove('dragging'); drag = null;
  }

  // ---------------- palco ----------------
  function tapTile(id) {
    if (!started || !layoutInfo) return;
    if (actors.has(id)) { removeActor(id, true); return; }
    const free = layoutInfo.fill.find(i => !slots[i]);
    if (free == null) {
      const t = tiles[id]; t.classList.remove('nope'); void t.offsetWidth; t.classList.add('nope');
      toast('O palco está cheio! Tire alguém para chamar outro.');
      return;
    }
    place(id, free);
  }
  function place(id, i, delay) {
    if (paused) togglePause(false);
    if (actors.has(id)) { moveActor(id, i); return; }
    if (slots[i]) removeActor(slots[i], false, true);
    const def = byId[id], se = slotEls[i];
    se.char.innerHTML = charSVG(def, uid(), horror);
    const a = { id, def, slot: i, parts: grabParts(se.char.querySelector('svg')), muted: false, solo: false,
      mouth: 0, mUntil: 0, mAmp: 0, shape: 'a', hit: 0, glow: 0, boing: 0, swing: 0, clap: 0, happyUntil: 0, blinkAt: 0, spin: 0, nc: 0 };
    a.startT = E.add(id, layoutInfo.P[i].pan);
    actors.set(id, a); slots[i] = id;
    se.el.style.setProperty('--c', def.color); se.el.style.setProperty('--d', (delay || 0) + 'ms');
    se.el.classList.add('on'); se.el.classList.remove('arrive'); void se.el.offsetWidth; se.el.classList.add('arrive');
    say(i, def.name, delay);
    tiles[id].classList.add('used');
    setTimeout(() => { if (slots[i] === id) burst(i, def.color); }, delay || 0);
    if (!delay) E.pop();
    hideHint(); afterChange();
  }
  function grabParts(svg) {
    const q = s => svg.querySelector(s);
    return { rig: q('.rig'), head: q('.headG'), armL: q('.armL'), armR: q('.armR'), eyes: q('.eyes'), happy: q('.happy'), mC: q('.mClosed'), mO: q('.mOpen'), pupils: q('.eyes .pupils'),
      acc: [...svg.querySelectorAll('.acc')].map(el => ({ el, a: el.dataset.a, px: +el.dataset.px || 100, py: +el.dataset.py || 60 })),
      glow: [...svg.querySelectorAll('.glow')], leds: [...svg.querySelectorAll('.led')] };
  }
  function removeActor(id, withSound, quiet) {
    const a = actors.get(id); if (!a) return;
    E.remove(id); actors.delete(id); slots[a.slot] = null;
    const se = slotEls[a.slot];
    se.el.classList.remove('on', 'muted', 'solo', 'arrive'); se.char.innerHTML = '';
    tiles[id].classList.remove('used');
    burst(a.slot, '#C3C7D3');
    if (withSound) E.poof();
    if (menuSlot === a.slot) closeMenu();
    if (!quiet) afterChange();
  }
  function moveActor(id, i) {
    const a = actors.get(id); if (!a || a.slot === i) return;
    const from = a.slot, other = slots[i], b = other ? actors.get(other) : null;
    const svgA = slotEls[from].char.firstElementChild, svgB = b ? slotEls[i].char.firstElementChild : null;
    slotEls[i].char.innerHTML = ''; slotEls[i].char.appendChild(svgA); a.slot = i; slots[i] = id;
    slotEls[from].char.innerHTML = '';
    if (b) { slotEls[from].char.appendChild(svgB); b.slot = from; slots[from] = other; E.setPan(other, layoutInfo.P[from].pan); }
    else slots[from] = null;
    E.setPan(id, layoutInfo.P[i].pan);
    refreshSlot(from); refreshSlot(i);
    burst(i, a.def.color); E.pop(); afterChange();
  }
  function refreshSlot(k) {
    const id = slots[k], se = slotEls[k], a = id && actors.get(id);
    se.el.classList.toggle('on', !!a);
    se.el.classList.toggle('muted', !!(a && a.muted));
    se.el.classList.toggle('solo', !!(a && a.solo));
    if (a) se.el.style.setProperty('--c', a.def.color);
  }
  function clearAll(withSound) {
    [...actors.keys()].forEach(id => removeActor(id, false));
    if (withSound) E.poof();
    closeMenu();
  }
  function shuffle() {
    if (!started) return;
    clearAll(false);
    const pick = (cat, n, not) => CHARS.filter(c => c.cat === cat && c.id !== not).map(c => c.id).sort(() => Math.random() - 0.5).slice(0, n);
    const ids = ['bumbo', ...pick('beat', 1, 'bumbo'), ...pick('fx', 1), ...pick('mel', 2), ...pick('voc', 2)].sort(() => Math.random() - 0.5);
    ids.forEach((id, k) => place(id, layoutInfo.fill[k], k * 90));
    E.pop();
  }
  function poke(i) {
    const g = slotEls[i].el; g.classList.remove('poked'); void g.offsetWidth; g.classList.add('poked');
    const p = layoutInfo.P[i]; FX.spawn('zzz', p.x + p.w * 0.25, p.ground - p.h * 0.72);
  }
  function burst(i, color) {
    const p = layoutInfo.P[i]; FX.spawn('puff', p.x, p.ground - p.h * 0.45, { color });
    FX.spawn('spark', p.x, p.ground - p.h * 0.6, { color: '#FFFFFF', n: 5 });
  }
  function say(i, text, delay) {
    const s = slotEls[i].say; s.textContent = text;
    s.classList.remove('show'); void s.offsetWidth;
    s.style.animationDelay = (delay || 0) + 'ms'; s.classList.add('show');
  }
  let toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    toastEl.classList.remove('show'); void toastEl.offsetWidth; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 2600);
  }

  // ---------------- menu do personagem ----------------
  let menuSlot = -1, menuTimer = 0;
  function openMenu(i) {
    const id = slots[i]; if (!id || !layoutInfo) return;
    const a = actors.get(id), p = layoutInfo.P[i];
    menuSlot = i;
    menu.style.left = p.x + 'px';
    menu.style.top = Math.max(44, p.ground - p.h * FEET + p.h * 0.16) + 'px';
    menu.querySelector('[data-act=mute]').setAttribute('aria-pressed', a.muted ? 'true' : 'false');
    menu.querySelector('[data-act=solo]').setAttribute('aria-pressed', a.solo ? 'true' : 'false');
    $('#menuName').textContent = a.def.name;
    menu.hidden = false; menu.classList.remove('pop'); void menu.offsetWidth; menu.classList.add('pop');
    clearTimeout(menuTimer); menuTimer = setTimeout(closeMenu, 6000);
  }
  function closeMenu() { menu.hidden = true; menuSlot = -1; }
  menu.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || menuSlot < 0) return;
    const id = slots[menuSlot], act = b.dataset.act;
    if (act === 'mute') toggleMute(id); else if (act === 'solo') toggleSolo(id); else removeActor(id, true);
    closeMenu();
  });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('.slot')) closeMenu(); });
  function toggleMute(id) { const a = actors.get(id); if (!a) return; a.muted = !a.muted; E.setMute(id, a.muted); refreshAll(); }
  function toggleSolo(id) {
    const a = actors.get(id); if (!a) return;
    const on = !a.solo;
    for (const b of actors.values()) if (b.solo && b !== a) { b.solo = false; E.setSolo(b.id, false); }
    a.solo = on; E.setSolo(id, on); refreshAll();
  }
  function refreshAll() {
    for (let k = 0; k < N; k++) refreshSlot(k);
    stage.classList.toggle('has-solo', [...actors.values()].some(a => a.solo));
  }

  // ---------------- segredos ----------------
  function counts() {
    const c = { beat: 0, fx: 0, mel: 0, voc: 0, total: 0, lua: false, horror };
    slots.forEach(id => { if (!id) return; const d = byId[id]; c.total++; if (d.cat === 'special') c.lua = true; else c[d.cat]++; });
    return c;
  }
  function afterChange() {
    const c = counts();
    SECRETS.forEach(s => {
      const on = !!s.test(c);
      if (on && !activeFx.has(s.id)) {
        activeFx.add(s.id);
        const first = !found.has(s.id);
        if (first) { found.add(s.id); saveFound(); updateCount(true); }
        showBanner(s, first); if (!horror) E.requestJingle(); setFx(s.fx, true);
      } else if (!on && activeFx.has(s.id)) { activeFx.delete(s.id); setFx(s.fx, false); }
    });
    stage.classList.toggle('empty', c.total === 0);
  }
  function setFx(fx, on) { stage.classList.toggle('fx-' + fx, on); refreshAmbient(); }
  function refreshAmbient() {
    FX.ambient('confetti', activeFx.has('cheia') && !horror);
    FX.ambient('bubbles', activeFx.has('lab'));
    FX.ambient('notes', activeFx.has('orquestra'));
    FX.ambient('sparkles', activeFx.has('coral') && !horror);
    FX.ambient('fireflies', night && !horror);
    FX.ambient('embers', horror);
    FX.ambient('embersBig', horror && activeFx.has('pesadelo'));
  }
  function updateCount(bump) {
    $('#secretCount').textContent = found.size + '/' + SECRETS.length;
    if (bump) { const c = $('#btnSecrets'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  }
  const bannerQ = []; let bannerBusy = false;
  function showBanner(s, first) { bannerQ.push({ s, first }); if (!bannerBusy) nextBanner(); }
  function nextBanner() {
    const it = bannerQ.shift();
    if (!it) { bannerBusy = false; return; }
    bannerBusy = true;
    banner.innerHTML = `<div class="b-icon">${SECRET_ICONS[it.s.id]}</div><div class="b-text"><div class="b-kicker">${it.first ? 'Segredo descoberto!' : 'Bônus!'}</div><div class="b-title">${it.s.name}</div></div>`;
    banner.hidden = false; banner.classList.remove('show'); void banner.offsetWidth; banner.classList.add('show');
    if (layoutInfo) FX.spawn('burst', layoutInfo.W / 2, 64, { n: it.first ? 60 : 30 });
    setTimeout(() => { banner.classList.remove('show'); setTimeout(() => { banner.hidden = true; nextBanner(); }, 380); }, 2700);
  }
  function renderSecrets() {
    $('#secretList').innerHTML = SECRETS.map(s => {
      const ok = found.has(s.id);
      return `<li class="${ok ? 'ok' : 'locked'}"><div class="s-icon">${ok ? SECRET_ICONS[s.id] : '<span>?</span>'}</div>
        <div class="s-text"><div class="s-name">${ok ? s.name : 'Segredo escondido'}</div><div class="s-hint">${s.hint}</div></div></li>`;
    }).join('');
    $('#secretSum').textContent = found.size === SECRETS.length ? 'Você descobriu todos!' : `${found.size} de ${SECRETS.length} descobertos`;
  }

  // ---------------- dica (mãozinha) ----------------
  function showHint() {
    if (actors.size || !layoutInfo || !started) return;
    const t = tiles.bumbo.getBoundingClientRect(), sr = stage.getBoundingClientRect(), p = layoutInfo.P[layoutInfo.fill[0]];
    hint.style.setProperty('--x0', (t.left + t.width / 2) + 'px'); hint.style.setProperty('--y0', (t.top + t.height / 2) + 'px');
    hint.style.setProperty('--x1', (sr.left + p.x) + 'px'); hint.style.setProperty('--y1', (sr.top + p.ground - p.h * 0.45) + 'px');
    hint.hidden = false;
  }
  function hideHint() { hint.hidden = true; idleT = 0; }

  // ---------------- animação ----------------
  const set = (el, v) => { if (el) el.setAttribute('transform', v); };
  const SHAPES = { a: [1.05, 1], o: [0.8, 0.95], u: [0.62, 0.75], i: [1.3, 0.55] };
  const DANCE = {
    bounce: (b, ph, e) => ({ ty: -7 * Math.abs(Math.sin(Math.PI * ph)), rot: 0, sq: e * 0.07 }),
    nod: (b, ph, e) => ({ ty: -3 * Math.abs(Math.sin(Math.PI * ph)), rot: 0, sq: e * 0.04, nod: e * 6 }),
    hop: (b) => { const h = ((b % 2) + 2) % 2; return { ty: h < 1 ? -15 * Math.sin(Math.PI * h) : 0, rot: 0, sq: h >= 1 ? Math.exp(-(h - 1) * 8) * 0.08 : 0 }; },
    sway: (b) => ({ ty: -3 * Math.abs(Math.sin(Math.PI * b)), rot: 5 * Math.sin(Math.PI * b), sq: 0 }),
    wiggle: (b, ph, e) => ({ ty: -4 * Math.abs(Math.sin(Math.PI * ph)), rot: 3 * Math.sin(2 * Math.PI * b), tx: 5 * Math.sin(Math.PI * b), sq: e * 0.04 }),
    float: (b) => ({ ty: -6 - 5 * Math.sin(Math.PI * b / 2), rot: 2.5 * Math.sin(Math.PI * b / 2), sq: 0 }),
    robot: (b, ph) => ({ ty: ph < 0.15 ? -4 : 0, rot: (Math.floor(b) % 2 ? 4 : -4), sq: 0 }),
    clap: (b, ph, e) => ({ ty: -5 * Math.abs(Math.sin(Math.PI * ph)), rot: 0, sq: e * 0.05 }),
  };
  function handleVis(ev) {
    const a = actors.get(ev.id); if (!a) return;
    a.mUntil = ev.t + Math.max(0.08, ev.dur); a.mAmp = Math.min(1, 0.45 + ev.v * 0.6); a.shape = ev.shape || 'a';
    a.hit = Math.max(a.hit, ev.v);
    if (ev.kind === 'kick') kick = Math.max(kick, ev.v);
    if (ev.kind !== 'kick' && ev.kind !== 'hit') a.glow = Math.max(a.glow, ev.kind === 'tick' ? 0.5 : 1);
    a.boing = ev.kind === 'boing' ? 1 : Math.max(a.boing, ev.v * 0.4);
    if (ev.kind === 'note' || ev.kind === 'long') a.swing = 1;
    if (ev.kind === 'clap') a.clap = 1;
    if (ev.kind === 'long') a.happyUntil = ev.t + ev.dur;
    const p = layoutInfo && layoutInfo.P[a.slot]; if (!p) return;
    if (ev.kind === 'note' || ev.kind === 'long') { if (++a.nc % 3 === 0) FX.spawn('note', p.x + p.w * 0.28, p.ground - p.h * 0.72, { color: a.def.color }); }
    else if (ev.kind === 'fx') { if (Math.random() < 0.6) FX.spawn('spark', p.x, p.ground - p.h * 0.78, { color: a.def.color, n: 3 }); }
    else if (ev.kind === 'kick') FX.spawn('ring', p.x, p.ground, { color: a.def.color, w: p.w });
  }
  function animActor(a, now, rt, beat, ph, e, dt, anySolo) {
    const P = a.parts, live = now >= a.startT - 0.02 && !a.muted && !(anySolo && !a.solo) && !paused;
    const D = (DANCE[a.def.dance] || DANCE.bounce)(beat, ph, e), amp = live ? 1 : 0.2;
    a.hit *= Math.pow(0.0005, dt); a.glow *= Math.pow(0.003, dt); a.boing *= Math.pow(0.03, dt); a.swing *= Math.pow(0.05, dt); a.clap *= Math.pow(0.0001, dt);
    const mt = live && now < a.mUntil ? a.mAmp * (0.78 + 0.22 * Math.sin(rt * 38)) : 0;
    a.mouth += (mt - a.mouth) * Math.min(1, dt * 28);
    const tx = (D.tx || 0) * amp, ty = D.ty * amp - a.hit * 2.5, rot = D.rot * amp, sq = D.sq * amp + a.hit * 0.03;
    set(P.rig, `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${rot.toFixed(2)} 100 294) translate(100 294) scale(${(1 + sq * 0.6).toFixed(3)} ${(1 - sq).toFixed(3)}) translate(-100 -294)`);
    const nod = (D.nod || 0) * amp + a.mouth * 2;
    let jerk = 0; // no modo terror, de vez em quando a cabeça dá um tranco
    if (horror && live) {
      if (!a.twitchAt) a.twitchAt = rt + 2 + Math.random() * 5;
      if (rt > a.twitchAt) {
        const tp = (rt - a.twitchAt) / 0.14;
        if (tp >= 1) { a.twitchAt = rt + 3 + Math.random() * 6; a.twitchDir = Math.random() < 0.5 ? -1 : 1; } else jerk = (a.twitchDir || 1) * 11 * Math.sin(Math.PI * tp);
      }
    }
    set(P.head, `translate(0 ${(nod * 0.5).toFixed(2)}) rotate(${(-rot * 0.4 + Math.sin(beat * Math.PI) * 2 * amp + jerk).toFixed(2)} 100 170)`);
    if (P.pupils) { // olhos que seguem o dedo (ou o mouse)
      let tx, ty;
      if (ptr && stageRect && layoutInfo) {
        const p = layoutInfo.P[a.slot], hx = stageRect.left + p.x, hy = stageRect.top + p.ground - p.h * FEET + p.h * (152 / 352);
        const dx = ptr.x - hx, dy = ptr.y - hy, dd = Math.hypot(dx, dy) || 1, m = Math.min(1, dd / 160);
        tx = (dx / dd) * 4.5 * m; ty = (dy / dd) * 3.5 * m;
      } else { tx = 3 * Math.sin(rt * 0.7 + a.slot); ty = 1.5 * Math.cos(rt * 0.5 + a.slot); }
      a.px = (a.px || 0) + (tx - (a.px || 0)) * Math.min(1, dt * 10); a.py = (a.py || 0) + (ty - (a.py || 0)) * Math.min(1, dt * 10);
      set(P.pupils, `translate(${a.px.toFixed(2)} ${a.py.toFixed(2)})`);
    }
    const up = live ? 10 * e + 18 * a.mouth : 3 * Math.sin(rt * 2);
    set(P.armL, `rotate(${(up - 48 * a.clap).toFixed(2)} 70 186)`);
    set(P.armR, `rotate(${(-up + 48 * a.clap).toFixed(2)} 130 186)`);
    if (P.mO) {
      const open = a.mouth > 0.06;
      P.mO.setAttribute('opacity', open ? 1 : 0); if (P.mC) P.mC.setAttribute('opacity', open ? 0 : 1);
      if (open) {
        const sh = SHAPES[a.shape] || SHAPES.a, my = a.def.acc === 'robot' ? 126 : 140;
        set(P.mO, `translate(100 ${my}) scale(${sh[0]} ${(0.3 + 0.9 * a.mouth * sh[1]).toFixed(3)}) translate(-100 -${my})`);
      }
    }
    if (!a.blinkAt) a.blinkAt = rt + 1 + Math.random() * 3;
    let eyeS = 1;
    if (rt > a.blinkAt) { const bp = (rt - a.blinkAt) / 0.14; if (bp >= 1) a.blinkAt = rt + 2 + Math.random() * 3.5; else eyeS = Math.max(0.08, Math.abs(1 - 2 * bp)); }
    const happy = live && now < a.happyUntil && !!P.happy;
    if (P.happy) P.happy.setAttribute('opacity', happy ? 1 : 0);
    if (P.eyes) { P.eyes.setAttribute('opacity', happy ? 0 : 1); set(P.eyes, `translate(0 100) scale(1 ${eyeS.toFixed(2)}) translate(0 -100)`); }
    for (const c of P.acc) {
      let tr = '';
      switch (c.a) {
        case 'pulse': { const s = 1 + 0.06 * a.hit + 0.02 * e * amp; tr = `translate(${c.px} ${c.py}) scale(${s.toFixed(3)}) translate(${-c.px} ${-c.py})`; break; }
        case 'nod': tr = `translate(0 ${(-2.5 * e * amp - a.hit * 2).toFixed(2)})`; break;
        case 'wiggle': tr = `rotate(${(4 * Math.sin(beat * Math.PI * 2) * amp + a.hit * 5 * Math.sin(rt * 40)).toFixed(2)} ${c.px} ${c.py})`; break;
        case 'boing': { const s = 1 + 0.32 * a.boing * Math.sin(rt * 26) + 0.06 * e * amp; tr = `translate(${c.px} ${c.py}) scale(1 ${s.toFixed(3)}) translate(${-c.px} ${-c.py})`; break; }
        case 'spin': a.spin += dt * (40 + 400 * a.glow) * (live ? 1 : 0.3); tr = `rotate(${(a.spin % 360).toFixed(1)} ${c.px} ${c.py})`; break;
        case 'swing': tr = `rotate(${(12 * a.swing * Math.sin(rt * 11) + 3 * Math.sin(beat * Math.PI) * amp).toFixed(2)} ${c.px} ${c.py})`; break;
        case 'float': tr = `translate(0 ${(2.5 * Math.sin(rt * 2.2)).toFixed(2)})`; break;
        case 'ears': tr = `rotate(${(5 * Math.sin(beat * Math.PI) * amp + 6 * a.hit).toFixed(2)} ${c.px} ${c.py})`; break;
      }
      if (tr) set(c.el, tr);
    }
    for (const g of P.glow) g.setAttribute('opacity', Math.min(0.9, a.glow).toFixed(2));
    P.leds.forEach((l, j) => l.setAttribute('opacity', live && (Math.floor(beat * 2) + j) % 3 === 0 ? 0.3 : 1));
    slotEls[a.slot].el.style.setProperty('--hit', (live ? 0.35 + 0.65 * a.hit : 0.12).toFixed(3));
  }
  function animGray(i, rt, beat, anyOn) {
    const se = slotEls[i], g = se.g, s = 1 + 0.014 * Math.sin(rt * 1.7 + i * 1.3);
    const sway = anyOn ? 1.6 * Math.sin(Math.PI * beat + i) : 0;
    set(g.rig, `rotate(${sway.toFixed(2)} 100 294) translate(100 294) scale(${(2 - s).toFixed(4)} ${s.toFixed(4)}) translate(-100 -294)`);
    let awake = se.target;
    if (horror) { // os bonecos cinzas abrem olhos vermelhos de repente
      if (!se.peekAt) se.peekAt = rt + 3 + Math.random() * 8;
      if (rt > se.peekAt) { se.peekUntil = rt + 1.1; se.peekAt = rt + 6 + Math.random() * 10; }
      if (rt < (se.peekUntil || 0)) awake = true;
    }
    g.sleep.setAttribute('opacity', awake ? 0 : 1); g.wake.setAttribute('opacity', awake ? 1 : 0);
  }
  const logoSpans = () => document.querySelectorAll('.top .logo span');
  let LS = null;
  function animLogo(beat, on) {
    if (!LS) LS = [...logoSpans()];
    LS.forEach((s, i) => {
      const y = on ? -5 * Math.max(0, Math.sin(Math.PI * (beat - i * 0.18))) : 0;
      s.style.transform = `translateY(${y.toFixed(2)}px)`;
    });
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016); lastTs = ts;
    const rt = ts / 1000, now = E.ctx ? E.now() : rt;
    stageRect = stage.getBoundingClientRect();
    const q = E.vis;
    while (q.length && q[0].t <= now) {
      const ev = q.shift();
      if (ev.kind === 'mode') setNight(ev.mode === 'night');
      else if (ev.kind !== 'beat' && ev.kind !== 'horror' && ev.t > now - 0.3) handleVis(ev);
    }
    if (q.length > 4000) q.splice(0, q.length - 4000);
    const pos = E.ctx ? E.posAt(now) : rt * 8, beat = pos / 4, ph = beat - Math.floor(beat), e = Math.exp(-ph * 7);
    let anySolo = false; for (const a of actors.values()) if (a.solo) anySolo = true;
    for (const a of actors.values()) animActor(a, now, rt, beat, ph, e, dt, anySolo);
    const anyOn = actors.size > 0 && !paused;
    for (let i = 0; i < N; i++) if (!slots[i]) animGray(i, rt, beat, anyOn);
    kick *= Math.pow(0.004, dt); stage.style.setProperty('--kick', kick.toFixed(3));
    stage.style.setProperty('--beat', anyOn ? e.toFixed(3) : '0');
    animLogo(beat, anyOn);
    if (started) {
      zzzT -= dt;
      if (zzzT <= 0 && layoutInfo) {
        zzzT = 2.5 + Math.random() * 2.5;
        const empty = []; for (let i = 0; i < N; i++) if (!slots[i]) empty.push(i);
        if (empty.length) { const i = empty[(Math.random() * empty.length) | 0], p = layoutInfo.P[i]; FX.spawn('zzz', p.x + p.w * 0.25, p.ground - p.h * 0.72); }
      }
      if (!actors.size && hint.hidden && !drag) { idleT += dt; if (idleT > 10) showHint(); }
      if (horror && !paused) {
        scareT -= dt; if (scareT <= 0) { scareT = 12 + Math.random() * 14; lightning(); }
        blackT -= dt; if (blackT <= 0) { blackT = 28 + Math.random() * 22; blackout(rt); }
      }
      if (blackUntil) { if (rt > blackUntil) endBlackout(); else FX.setEyes(eyeList(rt)); }
    }
    FX.update(dt);
  }
  function setNight(on) {
    night = on;
    stage.classList.toggle('is-night', on); document.body.classList.toggle('is-night', on);
    refreshAmbient();
  }

  // ---------------- modo terror ----------------
  function setHorror(on) {
    if (!started || on === horror) return;
    horror = on;
    if (paused) togglePause(false);
    E.setHorror(on);
    document.body.classList.toggle('is-horror', on);
    const b = $('#btnTerror');
    b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.title = on ? 'Voltar ao normal' : 'Modo terror'; b.setAttribute('aria-label', b.title);
    stage.classList.remove('glitching'); void stage.offsetWidth; stage.classList.add('glitching');
    setTimeout(() => stage.classList.remove('glitching'), 700);
    flash(on ? 'red' : 'white');
    E.thunder(on);
    setTimeout(rerenderAll, 140);
    if (!on) endBlackout();
    scareT = 8 + Math.random() * 6; blackT = 18 + Math.random() * 10;
    refreshAmbient(); afterChange();
  }
  function rerenderAll() {
    for (const a of actors.values()) {
      const se = slotEls[a.slot]; se.char.innerHTML = charSVG(a.def, uid(), horror); a.parts = grabParts(se.char.querySelector('svg'));
    }
    slotEls.forEach(se => {
      const w = se.el.querySelector('.who.gray'); w.innerHTML = graySVG(uid(), horror);
      const gs = w.querySelector('svg'); se.g = { rig: gs.querySelector('.rig'), sleep: gs.querySelector('.sleep'), wake: gs.querySelector('.wake') };
    });
    CHARS.forEach(c => { tiles[c.id].innerHTML = iconSVG(c, uid(), horror) + `<span class="tname">${c.name}</span>`; });
  }
  function flash(color) {
    const f = $('#flash'); f.dataset.c = color || 'white';
    f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  }
  function lightning() {
    flash('white');
    stage.classList.remove('bolt'); void stage.offsetWidth; stage.classList.add('bolt');
    setTimeout(() => E.thunder(false), 250 + Math.random() * 500);
  }
  function blackout(rt) { // as luzes apagam e só os olhos ficam acesos
    if (!layoutInfo) return;
    stage.classList.add('blackout'); blackUntil = rt + 1.8;
    E.whisper();
  }
  function endBlackout() { blackUntil = 0; stage.classList.remove('blackout'); FX.setEyes(null); }
  function eyeList(rt) {
    const out = [];
    layoutInfo.P.forEach((p, i) => {
      if (Math.sin(rt * 1.7 + i * 2.3) > 0.93) return; // piscadinha no escuro
      const top = p.ground - p.h * FEET, r = p.w * 0.05;
      [72, 128].forEach(vx => out.push({ x: p.x + (vx - 100) * p.w / 200, y: top + 152 * p.h / 352, r, a: 0.85 + 0.15 * Math.sin(rt * 9 + i) }));
    });
    return out;
  }
  $('#btnTerror').addEventListener('click', () => setHorror(!horror));
  window.addEventListener('pointermove', e => { ptr = { x: e.clientX, y: e.clientY }; }, { passive: true });

  // ---------------- controles ----------------
  function togglePause(force) {
    if (!started) return;
    paused = force == null ? !paused : force;
    if (paused) E.pause(); else E.resume();
    stage.classList.toggle('is-paused', paused);
    const b = $('#btnPause'); b.setAttribute('aria-pressed', paused ? 'true' : 'false');
    b.innerHTML = paused ? ICON.play : ICON.pause; b.title = paused ? 'Continuar' : 'Pausar'; b.setAttribute('aria-label', b.title);
  }
  $('#btnPause').addEventListener('click', () => togglePause());
  $('#btnShuffle').addEventListener('click', shuffle);
  $('#btnClear').addEventListener('click', () => { if (actors.size) clearAll(true); });
  const dEl = document.documentElement;
  if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) $('#btnFull').hidden = true;
  $('#btnFull').addEventListener('click', () => {
    try {
      const on = document.fullscreenElement || document.webkitFullscreenElement;
      const fn = on ? (document.exitFullscreen || document.webkitExitFullscreen) : (dEl.requestFullscreen || dEl.webkitRequestFullscreen);
      const r = fn && fn.call(on ? document : dEl); if (r && r.catch) r.catch(() => {});
    } catch (err) { /* tela cheia indisponível */ }
  });
  const secretsEl = $('#secrets');
  $('#btnSecrets').addEventListener('click', () => { renderSecrets(); secretsEl.hidden = false; $('#btnCloseSecrets').focus(); });
  $('#btnCloseSecrets').addEventListener('click', () => { secretsEl.hidden = true; });
  secretsEl.addEventListener('click', e => { if (e.target === secretsEl) secretsEl.hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { secretsEl.hidden = true; closeMenu(); } });

  let wake = null;
  const askWake = () => { try { if (navigator.wakeLock && document.visibilityState === 'visible') navigator.wakeLock.request('screen').then(w => { wake = w; }).catch(() => {}); } catch (err) { /* opcional */ } };
  document.addEventListener('visibilitychange', () => { if (started && document.visibilityState === 'visible' && (!wake || wake.released)) askWake(); });

  function start() {
    if (started) return;
    E.init(); started = true;
    document.body.classList.add('started');
    const intro = $('#intro'); intro.classList.add('leaving'); setTimeout(() => { intro.hidden = true; }, 650);
    askWake();
    layout();
    if (pendingRestore && pendingRestore.some(Boolean)) {
      pendingRestore.forEach((id, i) => { if (id && byId[id] && !actors.has(id)) place(id, i, i * 80); });
      pendingRestore = null;
    } else setTimeout(showHint, 700);
    if (pendingHorror) setTimeout(() => setHorror(true), 400);
  }
  $('#btnStart').addEventListener('click', start);

  // ---------------- início ----------------
  buildLogo(); buildPalette(); buildSlots(); buildIntro(); updateCount(false);
  FX.init($('#fx'));
  window.addEventListener('resize', layout);
  if (window.ResizeObserver) new ResizeObserver(layout).observe(stage);
  layout();
  requestAnimationFrame(frame);
  document.addEventListener('contextmenu', e => { if (e.target.closest('#app')) e.preventDefault(); });

  const hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(() => ({ slots: slots.slice(), horror }));
  const boot = data => { if (data && Array.isArray(data.slots)) pendingRestore = data.slots; if (data && data.horror) pendingHorror = true; };
  if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {});

  window.SprGame = { E, place, removeActor, slots, actors, start, layout: () => layoutInfo, setHorror,
    scare: { lightning, blackout: () => blackout(performance.now() / 1000) } };
})();
