/* Parquinho Sprunki — o mundo: blocos, física, personagens, inteligência, armas e efeitos.
   Sem sangue: quem é pego pelo terror vira terror; o terror derrotado é curado e volta ao normal. Coordenadas em blocos (y para baixo). */
(function () {
  'use strict';
  const COLS = 96, ROWS = 36, MAXC = COLS; // tamanho do mapa, em blocos
  const G = 30, JUMP = 9.6, WALK = 1.9, RUN = 3.8, HWALK = 1.5, HRUN = 3.0;
  const BLOCKS = ['', 'madeira', 'tijolo', 'pedra', 'vidro', 'terra', 'grama'];
  const BID = {}; BLOCKS.forEach((b, i) => { if (b) BID[b] = i; });
  const WEAPONS = {
    pistola: { range: 12, cd: 0.55, dmg: 20, speed: 30, kind: 'bala', spread: 0.03, som: 'pistol' },
    metralhadora: { range: 11, cd: 0.09, dmg: 7, speed: 33, kind: 'bala', spread: 0.07, burst: 12, reload: 1.1, som: 'mg' },
    arco: { range: 15, cd: 1.15, dmg: 34, speed: 17, kind: 'flecha', grav: 14, som: 'bow' },
    taco: { range: 1.7, cd: 0.8, dmg: 30, melee: true },
  };
  const U = 2.6 / 352; // blocos por unidade do desenho do personagem
  const W = { cols: COLS, rows: ROWS, tiles: new Uint8Array(MAXC * ROWS), chars: [], items: [], projs: [], fx: [], t: 0, dirty: true, dirtyCells: [], changed: false, uid: 1 };
  const snd = (name, a) => { const S = window.Som; if (S && S[name]) S[name](a); };
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- blocos ----------
  function tileAt(c, r) { if (c < 0 || c >= W.cols || r >= ROWS) return 255; if (r < 0) return 0; return W.tiles[r * MAXC + c]; }
  const solid = (c, r) => tileAt(c, r) !== 0;
  function setTile(c, r, id) {
    if (c < 0 || c >= MAXC || r < 0 || r >= ROWS) return false;
    const i = r * MAXC + c; if (W.tiles[i] === id) return false;
    W.tiles[i] = id; W.changed = true;
    if (!W.dirty) W.dirtyCells.push(i); // só este bloco precisa ser redesenhado
    return true;
  }
  function resetGround() {
    W.tiles.fill(0);
    for (let c = 0; c < MAXC; c++) { W.tiles[(ROWS - 2) * MAXC + c] = BID.grama; W.tiles[(ROWS - 1) * MAXC + c] = BID.terra; }
    W.dirty = true;
  }

  // ---------- física de caixas ----------
  function stepX(b, dx) {
    if (!dx) return;
    b.x += dx;
    const r0 = Math.floor(b.y - b.h + 0.001), r1 = Math.floor(b.y - 0.001);
    if (dx > 0) { const c = Math.floor(b.x + b.w / 2); for (let r = r0; r <= r1; r++) if (solid(c, r)) { b.x = c - b.w / 2 - 0.001; b.vx = 0; b.hitWall = 1; return; } }
    else { const c = Math.floor(b.x - b.w / 2); for (let r = r0; r <= r1; r++) if (solid(c, r)) { b.x = c + 1 + b.w / 2 + 0.001; b.vx = 0; b.hitWall = -1; return; } }
  }
  function stepY(b, dy) {
    if (!dy) return;
    b.y += dy;
    const c0 = Math.floor(b.x - b.w / 2 + 0.001), c1 = Math.floor(b.x + b.w / 2 - 0.001);
    if (dy > 0) { const r = Math.floor(b.y); for (let c = c0; c <= c1; c++) if (solid(c, r)) { b.y = r; b.vy = 0; b.onGround = true; return; } }
    else { const r = Math.floor(b.y - b.h); for (let c = c0; c <= c1; c++) if (solid(c, r)) { b.y = r + 1 + b.h; b.vy = 0; return; } }
  }
  function moveBody(b, dt) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(b.vx), Math.abs(b.vy)) * dt / 0.3));
    b.hitWall = 0; b.onGround = false;
    for (let i = 0; i < n; i++) { stepX(b, b.vx * dt / n); stepY(b, b.vy * dt / n); }
  }
  function overlapsSolid(b) {
    const c0 = Math.floor(b.x - b.w / 2 + 0.001), c1 = Math.floor(b.x + b.w / 2 - 0.001), r0 = Math.floor(b.y - b.h + 0.001), r1 = Math.floor(b.y - 0.001);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (solid(c, r)) return true;
    return false;
  }
  function unstick(b) {
    b.x = clamp(b.x, b.w / 2 + 0.01, W.cols - b.w / 2 - 0.01);
    for (let i = 0; i < 40 && overlapsSolid(b); i++) b.y = Math.floor(b.y - 0.001);
  }

  // ---------- personagens e objetos ----------
  function addChar(id, horror, x, y) {
    const c = {
      kind: 'char', uid: W.uid++, id, horror: !!horror, x, y, vx: 0, vy: 0, w: 0.78, h: 1.85, face: Math.random() < 0.5 ? -1 : 1,
      onGround: false, hp: 100, weapon: null, cd: 0, burst: 0, state: 'ok', downT: 0, downDir: 1, rot: 0, spin: 0, flying: false, grabbed: false,
      aiT: Math.random() * 2, move: 0, run: false, walkPh: Math.random() * 2, legA: 0, armF: -0.25, armB: 0.25, aim: null, aimT: -9,
      hurtT: 0, swingT: 0, swingDone: true, swingTarget: null, alertT: 0, lastHit: -9, recoil: 0, pop: 0.3, cower: false, dragVx: 0,
    };
    unstick(c); W.chars.push(c); W.changed = true;
    if (window.Sprites) window.Sprites.charReady(id, c.horror);
    return c;
  }
  function addItem(type, x, y, vx, vy) {
    const it = { kind: 'item', uid: W.uid++, type, x, y, vx: vx || 0, vy: vy || 0, w: 0.9, h: 0.32, onGround: false, grabbed: false, rot: 0, pickT: 0.6 };
    unstick(it); W.items.push(it); W.changed = true; return it;
  }
  function dropWeapon(c) {
    if (!c.weapon) return;
    addItem(c.weapon, c.x + c.face * 0.3, c.y - 1, c.face * 2, -4).pickT = 1.2;
    c.weapon = null;
  }

  // ---------- efeitos visuais ----------
  function fx(o) { if (W.fx.length < 500) W.fx.push(o); }
  function fxText(x, y, text, color, big) { fx({ t: 'text', x, y, vx: 0, vy: -1.3, life: 0.9, max: 0.9, text, color, big }); }
  function fxPuff(x, y, color, n) { for (let i = 0; i < n; i++) fx({ t: 'puff', x: x + rand(-0.45, 0.45), y: y + rand(-0.7, 0.7), vx: rand(-1.6, 1.6), vy: rand(-2.2, 0.4), life: rand(0.5, 0.85), max: 0.85, r: rand(0.22, 0.42), color }); }
  function fxSparkle(x, y, n) { const cs = ['#FFE14D', '#FF7CB8', '#62C6FF', '#9BDB2E', '#FFFFFF']; for (let i = 0; i < n; i++) fx({ t: 'star', x: x + rand(-0.6, 0.6), y: y + rand(-1, 0.4), vx: rand(-2, 2), vy: rand(-3.5, -0.5), life: rand(0.6, 1), max: 1, r: rand(0.1, 0.2), color: cs[i % cs.length] }); }
  function fxBits(x, y, color, n, size) { for (let i = 0; i < n; i++) fx({ t: 'bit', x: x + rand(-0.3, 0.3), y: y + rand(-0.3, 0.3), vx: rand(-3.5, 3.5), vy: rand(-6, -1), life: rand(0.6, 1.1), max: 1.1, r: rand(0.07, size || 0.16), rot: rand(0, 6), vr: rand(-9, 9), color }); }
  function fxDust(x, y) { for (let i = 0; i < 6; i++) fx({ t: 'puff', x: x + rand(-0.5, 0.5), y: y - rand(0, 0.2), vx: rand(-1.8, 1.8), vy: rand(-1, -0.2), life: rand(0.35, 0.6), max: 0.6, r: rand(0.15, 0.3), color: 'rgba(200,190,170,.8)' }); }
  const BLOCK_COLOR = { madeira: '#B98546', tijolo: '#B4482F', pedra: '#8A8A8A', vidro: '#CDEBFF', terra: '#8B5A2B', grama: '#5DA83A' };

  // ---------- dano, infecção e cura ----------
  function knockDown(o, t, dir) { o.state = 'down'; o.downT = Math.max(o.downT, t); o.downDir = dir || (Math.random() < 0.5 ? -1 : 1); }
  function damage(o, dmg, kx, ky) {
    if (!W.chars.includes(o)) return;
    o.hp -= dmg; o.hurtT = 0.3; o.lastHit = W.t;
    o.vx += kx; o.vy += ky;
    if (Math.abs(kx) > 7) knockDown(o, 1.1, Math.sign(kx));
    if (o.hp <= 0) { if (o.horror) cure(o); else infect(o); }
  }
  function infect(o) {
    dropWeapon(o);
    o.horror = true; o.hp = 100; o.cd = 1.0; knockDown(o, 0.9);
    fxPuff(o.x, o.y - 1, 'rgba(40,10,40,.85)', 12); fxText(o.x, o.y - 2.3, 'Virou terror!', '#FF4A2F');
    snd('infect'); if (window.Sprites) window.Sprites.charReady(o.id, true);
  }
  function cure(o) {
    o.horror = false; o.hp = 100; o.cd = 0.5; knockDown(o, 1.0);
    fxSparkle(o.x, o.y - 1, 16); fxText(o.x, o.y - 2.3, 'Curado!', '#5DE07F');
    snd('cure'); if (window.Sprites) window.Sprites.charReady(o.id, false);
  }

  // ---------- inteligência ----------
  function nearest(c, pred, maxD) {
    let best = null, bd = maxD;
    for (const o of W.chars) { if (o === c || !pred(o)) continue; const d = Math.hypot(o.x - c.x, (o.y - c.y) * 1.6); if (d < bd) { bd = d; best = o; } }
    return best;
  }
  function nearestItem(c, maxD) {
    let best = null, bd = maxD;
    for (const it of W.items) { if (it.grabbed || it.pickT > 0 || Math.abs(it.y - c.y) > 3) continue; const d = Math.abs(it.x - c.x); if (d < bd) { bd = d; best = it; } }
    return best;
  }
  // altura do obstáculo à frente: 0 nada, 1 dá para pular, 2 muro
  function frontInfo(c, dir) {
    const fc = Math.floor(c.x + dir * (c.w / 2 + 0.12)), fr = Math.floor(c.y - 0.01);
    if (!solid(fc, fr)) return 0;
    return !solid(fc, fr - 1) && !solid(fc, fr - 2) ? 1 : 2;
  }
  function walk(c, dir, run) {
    c.move = dir; c.run = run; if (dir) c.face = dir;
    if (!dir || !c.onGround) return 0;
    const h = frontInfo(c, dir);
    if (h === 1 || (h === 2 && c.horror)) c.vy = -JUMP;
    return h;
  }
  function wander(c, dt) {
    c.run = false; c.aiT -= dt;
    if (c.aiT <= 0) { c.aiT = rand(1.2, 3.5); const r = Math.random(); c.move = r < 0.4 ? 0 : r < 0.7 ? -1 : 1; if (c.move) c.face = c.move; }
    if (c.move && c.onGround) {
      const h = frontInfo(c, c.move);
      if (h === 1 && Math.random() < 0.6) c.vy = -JUMP; else if (h) { c.move = -c.move; c.face = c.move; }
    }
  }
  function aiGood(c, dt) {
    const th = nearest(c, o => o.horror && !o.grabbed, 18);
    const dx = th ? th.x - c.x : 0, ad = Math.abs(dx), dy = th ? Math.abs(th.y - c.y) : 99;
    if (th && dy < 5 && ad < 9 && c.alertT <= 0) { c.alertT = 5; fxText(c.x, c.y - 2.2, '!', '#FFD84D', true); snd('alert'); }
    if (c.weapon) {
      const wp = WEAPONS[c.weapon];
      if (th && ad < wp.range && dy < 4.5) {
        c.aimT = W.t;
        if (wp.melee) {
          if (ad > 1.25) walk(c, Math.sign(dx), true);
          else { c.move = 0; c.face = Math.sign(dx) || c.face; if (c.cd <= 0) startSwing(c, th); }
        } else {
          c.face = Math.sign(dx) || c.face;
          if (ad < 1.4) { c.move = -c.face; c.run = true; if (c.onGround && frontInfo(c, c.move) === 1) c.vy = -JUMP; }
          else c.move = 0;
          if (c.cd <= 0) fire(c, th);
        }
        return;
      }
    } else if (th && ad < 7.5 && dy < 4) {
      if (walk(c, dx > 0 ? -1 : 1, true) === 2) { c.move = 0; c.cower = true; }
      return;
    } else {
      const it = nearestItem(c, 12);
      if (it) { walk(c, Math.sign(it.x - c.x) || 1, false); return; }
    }
    wander(c, dt);
  }
  function aiEvil(c, dt) {
    const prey = nearest(c, o => !o.horror && !o.grabbed, 40);
    if (prey) {
      const dx = prey.x - c.x, ad = Math.abs(dx), dy = Math.abs(prey.y - c.y);
      if (ad < 1.05 && dy < 1.3) { c.move = 0; c.face = Math.sign(dx) || c.face; if (c.cd <= 0) startSwing(c, prey); }
      else walk(c, Math.sign(dx) || c.face, ad < 7);
      if (Math.random() < dt * 0.08) snd('growl');
    } else wander(c, dt);
  }

  // ---------- armas ----------
  function shoulder(c) { return { x: c.x + c.face * 34 * U, y: c.y - 106 * U }; }
  function muzzleDist(type) { const S = window.Sprites, A = S && S.ARMAS[type]; return A ? (60 + (A.muzzle[0] - A.hold[0]) * S.WS) * U : 0.9; }
  function los(x0, y0, x1, y1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.2);
    for (let i = 1; i < n; i++) { const t = tileAt(Math.floor(x0 + (x1 - x0) * i / n), Math.floor(y0 + (y1 - y0) * i / n)); if (t && t !== BID.vidro) return false; }
    return true;
  }
  function fire(c, t) {
    const wp = WEAPONS[c.weapon], sh = shoulder(c), tx = t.x, ty = t.y - (t.state === 'down' ? 0.35 : t.h * 0.55);
    const dx = tx - sh.x, dy = ty - sh.y;
    if (!los(sh.x, sh.y, tx, ty)) { c.aim = { x: Math.sign(dx) || c.face, y: 0 }; return; }
    let vx, vy;
    if (wp.kind === 'flecha') {
      const v = wp.speed, g = wp.grav, X = Math.max(0.5, Math.abs(dx)), Y = -dy, disc = v ** 4 - g * (g * X * X + 2 * Y * v * v);
      const ang = disc >= 0 ? Math.atan((v * v - Math.sqrt(disc)) / (g * X)) : Math.PI / 4;
      vx = Math.sign(dx || c.face) * v * Math.cos(ang); vy = -v * Math.sin(ang);
    } else {
      const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 2 * wp.spread;
      vx = Math.cos(a) * wp.speed; vy = Math.sin(a) * wp.speed;
    }
    const L = Math.hypot(vx, vy); c.aim = { x: vx / L, y: vy / L };
    const m = muzzleDist(c.weapon), px = sh.x + c.aim.x * m, py = sh.y + c.aim.y * m;
    W.projs.push({ kind: wp.kind, x: px, y: py, vx, vy, dmg: wp.dmg, life: wp.kind === 'flecha' ? 3 : 1.2, grav: wp.grav || 0 });
    if (wp.kind === 'bala') fx({ t: 'flash', x: px, y: py, life: 0.06, max: 0.06, r: c.weapon === 'pistola' ? 0.32 : 0.26 });
    snd(wp.som); c.recoil = 1;
    if (wp.burst) { c.burst++; if (c.burst >= wp.burst) { c.burst = 0; c.cd = wp.reload; } else c.cd = wp.cd; } else c.cd = wp.cd;
  }
  function startSwing(c, target) {
    c.swingT = 0.28; c.swingTarget = target; c.swingDone = false;
    c.cd = c.horror ? 0.95 : WEAPONS.taco.cd;
    if (!c.horror) snd('whoosh');
  }
  function updateSwing(c, dt) {
    if (c.swingT <= 0) return;
    c.swingT -= dt;
    if (c.swingDone || c.swingT > 0.14) return;
    c.swingDone = true;
    const t = c.swingTarget;
    if (!t || !W.chars.includes(t) || t.grabbed || t.horror === c.horror) return;
    if (Math.abs(t.x - c.x) > (c.horror ? 1.5 : 2.0) || Math.abs(t.y - c.y) > 1.6) return;
    if (c.horror) { damage(t, 18, c.face * 3.5, -3.5); snd('claw'); snd('ouch'); fxPuff(t.x, t.y - 1.1, 'rgba(170,120,255,.7)', 4); }
    else { damage(t, 30, c.face * 11, -7); snd('bonk'); fxText(t.x, t.y - 2.2, 'BONK!', '#FFD84D', true); fxSparkle(t.x, t.y - 1.2, 5); }
  }

  // ---------- animação (ângulos dos braços e pernas) ----------
  function animate(c, dt) {
    const walking = c.onGround && Math.abs(c.vx) > 0.25 && c.state === 'ok' && !c.grabbed;
    if (walking) c.walkPh += dt * Math.abs(c.vx) * 2.4;
    const sw = walking ? Math.sin(c.walkPh * Math.PI) : 0;
    c.legA += ((c.grabbed ? Math.sin(W.t * 9) * 0.35 : sw * 0.55) - c.legA) * Math.min(1, dt * 18);
    let tr = 0;
    if (c.grabbed) tr = clamp(-c.dragVx * 0.06, -0.7, 0.7) + Math.sin(W.t * 7) * 0.06;
    else if (c.state === 'down' && !c.flying) tr = c.downDir * Math.PI / 2;
    else if (c.horror) tr = c.face * 0.12;
    else if (!c.onGround) tr = c.face * clamp(c.vx * 0.04, -0.3, 0.3);
    if (c.flying) c.rot += c.spin * dt;
    else { c.rot = Math.atan2(Math.sin(c.rot), Math.cos(c.rot)); c.rot += (tr - c.rot) * Math.min(1, dt * 12); }
    let af, ab;
    if (c.swingT > 0) { const p = 1 - c.swingT / 0.28; af = -3.6 + p * 3.0; ab = c.horror ? -1.3 : 0.4; }
    else if (c.grabbed || c.flying) { af = -2.7 + Math.sin(W.t * 13) * 0.4; ab = -2.6 + Math.cos(W.t * 13) * 0.4; }
    else if (c.horror) { af = -1.35 + Math.sin(W.t * 5 + c.uid) * 0.12; ab = -1.2 + Math.sin(W.t * 5 + c.uid + 1) * 0.12; }
    else if (c.weapon && c.aim && W.t - c.aimT < 1.2 && c.state === 'ok') { af = Math.atan2(-c.aim.x * c.face, c.aim.y); ab = 0.25 - sw * 0.4; if (c.weapon === 'arco') ab = -1.25; }
    else if (c.cower || (c.alertT > 0 && c.run)) { af = -2.6 + Math.sin(W.t * 14) * 0.3; ab = -2.5 + Math.cos(W.t * 14) * 0.3; }
    else if (c.weapon) { af = -0.6 - sw * 0.25; ab = 0.25 + sw * 0.5; }
    else { af = -0.25 - sw * 0.5; ab = 0.25 + sw * 0.5; }
    c.armF = af; c.armB = ab;
  }

  // ---------- passo da simulação ----------
  function update(dt) {
    W.t += dt;
    for (const c of W.chars) {
      c.cd = Math.max(0, c.cd - dt); c.hurtT = Math.max(0, c.hurtT - dt); c.alertT = Math.max(0, c.alertT - dt);
      c.recoil = Math.max(0, c.recoil - dt * 7); c.pop = Math.min(1, c.pop + dt * 5); c.cower = false;
      if (c.grabbed) { animate(c, dt); continue; }
      if (c.state === 'down') { c.move = 0; c.downT -= dt; if (c.downT <= 0 && c.onGround) { c.state = 'ok'; c.flying = false; } }
      else if (c.horror) aiEvil(c, dt); else aiGood(c, dt);
      if (c.state === 'down') { if (c.onGround) c.vx *= Math.pow(0.003, dt); }
      else {
        const sp = c.move * (c.horror ? (c.run ? HRUN : HWALK) : (c.run ? RUN : WALK)), acc = c.onGround ? 28 : 9;
        c.vx += clamp(sp - c.vx, -acc * dt, acc * dt);
      }
      c.vy = Math.min(c.vy + G * dt, 26);
      const air = !c.onGround, impact = c.vy;
      moveBody(c, dt);
      if (air && c.onGround && (c.flying || impact > 15)) {
        knockDown(c, 0.8 + Math.max(0, impact - 15) * 0.04, c.vx >= 0 ? 1 : -1);
        c.flying = false; fxDust(c.x, c.y); snd('thud');
      }
      updateSwing(c, dt);
      animate(c, dt);
    }
    for (const it of W.items) {
      it.pickT = Math.max(0, it.pickT - dt);
      if (it.grabbed) continue;
      it.vy = Math.min(it.vy + G * dt, 26);
      if (it.onGround) { it.vx *= Math.pow(0.002, dt); it.rot += -it.rot * Math.min(1, dt * 10); } else it.rot += it.vx * dt * 1.5;
      moveBody(it, dt);
    }
    // normais desarmados pegam armas do chão
    for (let i = W.items.length - 1; i >= 0; i--) {
      const it = W.items[i]; if (it.grabbed || it.pickT > 0) continue;
      for (const c of W.chars) {
        if (c.horror || c.weapon || c.state !== 'ok' || c.grabbed) continue;
        if (Math.abs(c.x - it.x) < (c.w + it.w) / 2 && it.y > c.y - c.h && it.y - it.h < c.y + 0.05) {
          c.weapon = it.type; W.items.splice(i, 1); snd('pick'); fxText(c.x, c.y - 2.2, 'Peguei!', '#FFFFFF'); W.changed = true; break;
        }
      }
    }
    updateProjs(dt);
    for (let i = W.fx.length - 1; i >= 0; i--) {
      const f = W.fx[i]; f.life -= dt;
      if (f.life <= 0) { W.fx.splice(i, 1); continue; }
      if (f.t === 'bit' || f.t === 'star') { f.vy += 18 * dt; f.rot = (f.rot || 0) + (f.vr || 0) * dt; }
      if (f.vx) f.x += f.vx * dt; if (f.vy) f.y += f.vy * dt;
    }
  }
  function updateProjs(dt) {
    for (let i = W.projs.length - 1; i >= 0; i--) {
      const p = W.projs[i]; p.life -= dt;
      let dead = p.life <= 0;
      const n = Math.max(1, Math.ceil(Math.hypot(p.vx, p.vy) * dt / 0.15));
      for (let s = 0; s < n && !dead; s++) {
        p.vy += p.grav * dt / n; p.x += p.vx * dt / n; p.y += p.vy * dt / n;
        const tc = Math.floor(p.x), tr = Math.floor(p.y), t = tileAt(tc, tr);
        if (t) {
          if (t === BID.vidro) breakTile(tc, tr);
          else if (p.kind === 'flecha') { fx({ t: 'arrow', x: p.x, y: p.y, ang: Math.atan2(p.vy, p.vx), life: 5, max: 5 }); snd('thunk'); }
          else { fxBits(p.x, p.y, '#FFE680', 3, 0.06); snd('ric'); }
          dead = true; break;
        }
        for (const o of W.chars) {
          if (!o.horror || o.grabbed) continue;
          const lying = o.state === 'down';
          const top = o.y - (lying ? 0.9 : o.h), half = lying ? 0.9 : o.w / 2, cxo = lying ? o.x + o.downDir * 0.7 : o.x;
          if (p.x > cxo - half && p.x < cxo + half && p.y > top && p.y < o.y) {
            damage(o, p.dmg, Math.sign(p.vx) * (p.kind === 'flecha' ? 4 : 2.2), -1.5);
            fxText(o.x, o.y - 2.2, p.kind === 'flecha' ? 'TÓIM!' : 'POW!', '#FFFFFF');
            fxBits(p.x, p.y, '#FFE14D', 4, 0.07); snd('hit');
            dead = true; break;
          }
        }
      }
      if (p.x < -2 || p.x > W.cols + 2 || p.y > ROWS + 2 || p.y < -30) dead = true;
      if (dead) W.projs.splice(i, 1);
    }
  }
  function breakTile(c, r) {
    if (!setTile(c, r, 0)) return;
    for (let i = 0; i < 10; i++) fx({ t: 'bit', x: c + 0.5 + rand(-0.4, 0.4), y: r + 0.5 + rand(-0.4, 0.4), vx: rand(-4, 4), vy: rand(-6, 1), life: rand(0.6, 1), max: 1, r: rand(0.06, 0.16), rot: rand(0, 6), vr: rand(-10, 10), color: 'rgba(205,235,255,.9)' });
    snd('shatter');
  }

  // ---------- ações vindas da tela ----------
  function charAt(x, y, standingOnly) {
    for (let i = W.chars.length - 1; i >= 0; i--) {
      const c = W.chars[i];
      if (c.state === 'down' && !c.grabbed && !standingOnly) {
        const cx = c.x + c.downDir * 0.8;
        if (Math.abs(x - cx) < 1.2 && y > c.y - 1 && y < c.y + 0.15) return c;
      } else if (Math.abs(x - c.x) < 0.65 && y > c.y - c.h - 0.45 && y < c.y + 0.15) return c;
    }
    return null;
  }
  function itemAt(x, y) {
    for (let i = W.items.length - 1; i >= 0; i--) { const it = W.items[i]; if (Math.abs(x - it.x) < 0.75 && Math.abs(y - (it.y - it.h / 2)) < 0.55) return it; }
    return null;
  }
  function spawnChar(id, horror, x, y) {
    const c = addChar(id, horror, clamp(x, 0.5, W.cols - 0.5), Math.min(ROWS - 0.01, y + 0.9));
    snd('pop'); fxSparkle(c.x, c.y - 1, 6);
    return c;
  }
  function spawnItem(type, x, y) { const it = addItem(type, clamp(x, 0.5, W.cols - 0.5), y + 0.2); it.pickT = 0.3; snd('pop'); return it; }
  function equip(c, type) {
    if (!c || c.horror) return false;
    if (c.weapon === type) return false;
    dropWeapon(c); c.weapon = type; W.changed = true;
    snd('pick'); fxText(c.x, c.y - 2.2, 'Peguei!', '#FFFFFF');
    return true;
  }
  function placeBlock(c, r, name) {
    const id = BID[name];
    if (!id || c < 0 || c >= W.cols || r < 0 || r >= ROWS) return false;
    if (W.tiles[r * MAXC + c] === id) return false;
    for (const ch of W.chars) if (c + 1 > ch.x - ch.w / 2 && c < ch.x + ch.w / 2 && r + 1 > ch.y - ch.h && r < ch.y) return false;
    setTile(c, r, id);
    for (const it of W.items) if (overlapsSolid(it)) unstick(it);
    snd('place', name);
    return true;
  }
  function eraseAt(x, y) {
    for (let i = W.chars.length - 1; i >= 0; i--) {
      const c = W.chars[i];
      if (charAt(x, y) === c) { W.chars.splice(i, 1); fxPuff(c.x, c.y - 1, 'rgba(255,255,255,.85)', 8); snd('erase'); W.changed = true; return true; }
    }
    const it = itemAt(x, y);
    if (it) { W.items.splice(W.items.indexOf(it), 1); fxPuff(it.x, it.y, 'rgba(255,255,255,.85)', 5); snd('erase'); W.changed = true; return true; }
    const tc = Math.floor(x), tr = Math.floor(y), t = tileAt(tc, tr);
    if (t && t !== 255) { fxBits(tc + 0.5, tr + 0.5, BLOCK_COLOR[BLOCKS[t]], 8, 0.16); setTile(tc, tr, 0); snd('erase'); return true; }
    return false;
  }
  function poke(c) {
    if (c.state !== 'ok' || c.grabbed) return;
    if (c.onGround) c.vy = -6;
    if (c.horror) { fxText(c.x, c.y - 2.2, 'GRRR!', '#FF4A2F', true); snd('growl'); }
    else { fxText(c.x, c.y - 2.2, 'Oi!', '#FFFFFF', true); snd('hi'); }
  }
  function grab(o) { o.grabbed = true; o.vx = o.vy = 0; o.flying = false; if (o.kind === 'char') { o.state = 'ok'; o.downT = 0; } snd('grab'); }
  function moveGrabbed(o, x, y, vx) { o.x = clamp(x, 0.4, W.cols - 0.4); o.y = clamp(y, o.h + 0.1, ROWS); o.dragVx = vx || 0; }
  function release(o, vx, vy) {
    o.grabbed = false; o.vx = clamp(vx || 0, -28, 28); o.vy = clamp(vy || 0, -28, 28);
    unstick(o); W.changed = true;
    if (o.kind === 'char' && Math.hypot(o.vx, o.vy) > 6) { o.flying = true; o.spin = clamp(o.vx * 0.8, -14, 14); o.state = 'down'; o.downT = 0.3; }
  }
  function equipFromItem(c, it) {
    if (!c || c.horror || it.grabbed) return false;
    const i = W.items.indexOf(it); if (i < 0) return false;
    W.items.splice(i, 1); dropWeapon(c); c.weapon = it.type;
    snd('pick'); fxText(c.x, c.y - 2.2, 'Peguei!', '#FFFFFF'); W.changed = true;
    return true;
  }
  function clearAll() { W.chars = []; W.items = []; W.projs = []; W.fx = []; resetGround(); W.changed = true; }
  // cena de exemplo para a primeira vez, no meio do mapa (onde a câmera começa)
  function starter() {
    clearAll();
    const b = Math.floor(COLS / 2) - 9, g = ROWS - 2;
    for (let c = b + 2; c < b + 7; c++) setTile(c, g - 4, BID.madeira);
    setTile(b + 10, g - 1, BID.pedra); setTile(b + 11, g - 1, BID.pedra); setTile(b + 11, g - 2, BID.vidro);
    addChar('lala', false, b + 4.5, g - 4).weapon = 'arco';
    addChar('bumbo', false, b + 3, g).weapon = 'pistola';
    addChar('grave', false, b + 6, g);
    addItem('taco', b + 8, g - 0.5);
    addChar('boquinha', true, b + 16, g);
  }

  // ---------- salvar ----------
  function serialize(cam) {
    const tiles = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < MAXC; c++) { const t = W.tiles[r * MAXC + c]; if (t) tiles.push(c, r, t); }
    return JSON.stringify({
      v: 2, cols: COLS, rows: ROWS, tiles, cam: cam || null,
      chars: W.chars.map(c => [c.id, c.horror ? 1 : 0, +c.x.toFixed(2), +Math.min(c.y, ROWS).toFixed(2), c.weapon || 0]),
      items: W.items.map(i => [i.type, +i.x.toFixed(2), +i.y.toFixed(2)]),
    });
  }
  function deserialize(json) {
    const d = JSON.parse(json); if (!d || (d.v !== 1 && d.v !== 2)) return false;
    // cenários antigos (mapa de 16 linhas) descem para o chão do mapa novo
    const dy = d.v === 1 ? ROWS - 16 : 0;
    W.chars = []; W.items = []; W.projs = []; W.fx = []; W.tiles.fill(0);
    let usado = 0;
    for (let i = 0; i + 2 < d.tiles.length; i += 3) {
      const c = d.tiles[i], r = d.tiles[i + 1] + dy, t = d.tiles[i + 2];
      if (c >= 0 && c < MAXC && r >= 0 && r < ROWS && BLOCKS[t]) { W.tiles[r * MAXC + c] = t; usado = Math.max(usado, c + 1); }
    }
    // o mapa antigo era mais estreito: completa o chão até a borda nova
    if (d.v === 1) for (let c = usado; c < MAXC; c++) { W.tiles[(ROWS - 2) * MAXC + c] = BID.grama; W.tiles[(ROWS - 1) * MAXC + c] = BID.terra; }
    const ids = new Set(window.SPR.CHARS.map(c => c.id));
    (d.chars || []).forEach(([id, h, x, y, w]) => { if (ids.has(id)) { const c = addChar(id, h, x, y + dy); if (w && WEAPONS[w]) c.weapon = w; c.pop = 1; } });
    (d.items || []).forEach(([t, x, y]) => { if (WEAPONS[t]) addItem(t, x, y + dy).pickT = 0; });
    W.dirty = true; W.dirtyCells.length = 0; W.changed = false;
    return { cam: d.v === 2 ? d.cam : null };
  }

  window.Mundo = {
    W, COLS, MAXC, ROWS, BLOCKS, BID, WEAPONS, tileAt, update, charAt, itemAt, spawnChar, spawnItem, equip, equipFromItem,
    placeBlock, eraseAt, poke, grab, moveGrabbed, release, clearAll, starter, serialize, deserialize, resetGround,
  };
})();
