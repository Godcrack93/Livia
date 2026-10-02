export const CELL = 0.1;
export const BALL_R = 0.034;
export const HOLE_R = 0.041;

export const T = { VOID: 0, FLOOR: 1, WALL: 2, ICE: 3, MUD: 4, HOLE: 5, DOOR: 6, BOOST: 7, BUMPER: 8, GOAL: 9 };

const ACCEL = 1.15;
const BOOST = 0.95;
const DAMP_FLOOR = 0.9;
const DAMP_ICE = 0.08;
const DAMP_MUD = 4.5;
const MAX_SPEED = 1.5;
const WALL_BOUNCE = 0.35;
const BUMPER_R = 0.03;
const PULL_ZONE = HOLE_R + BALL_R * 0.45;
const FALL_AT = HOLE_R - BALL_R * 0.3;
const SUBSTEPS = 5;

const ARROWS = { ">": [1, 0], "<": [-1, 0], "^": [0, -1], v: [0, 1] };

// Converte um mapa em dados de jogo (sem malhas): tipos de casa, entidades e objetos móveis.
export function parseStage(stage) {
  const map = stage.map;
  const rows = map.length;
  const cols = map[0].length;
  const W = cols * CELL;
  const H = rows * CELL;
  const cx = (c) => (c + 0.5) * CELL - W / 2;
  const cz = (r) => (r + 0.5) * CELL - H / 2;
  const L = {
    rows,
    cols,
    W,
    H,
    cx,
    cz,
    cells: new Uint8Array(rows * cols),
    boost: new Float32Array(rows * cols * 2),
    start: { x: 0, z: 0, r: 0, c: 0 },
    goal: { x: 0, z: 0, r: 0, c: 0 },
    stars: [],
    holes: [],
    bumpers: [],
    checks: [],
    keys: [],
    doors: [],
    portals: [],
    spinners: [],
    sliders: [],
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = map[r][c];
      const i = r * cols + c;
      const x = cx(c);
      const z = cz(r);
      let type = T.FLOOR;
      if (ch === "#") type = T.WALL;
      else if (ch === "_") type = T.VOID;
      else if (ch === "~") type = T.ICE;
      else if (ch === "m") type = T.MUD;
      else if (ch === "o") {
        type = T.HOLE;
        L.holes.push({ x, z, r, c });
      } else if (ch === "G") {
        type = T.GOAL;
        Object.assign(L.goal, { x, z, r, c });
      } else if (ch === "S") Object.assign(L.start, { x, z, r, c });
      else if (ch === "*") L.stars.push({ x, z, r, c, taken: false });
      else if (ch === "C") L.checks.push({ x, z, r, c, on: false });
      else if (ch === "k") L.keys.push({ x, z, r, c, taken: false });
      else if (ch === "D") {
        type = T.DOOR;
        L.doors.push({ x, z, r, c, open: false });
      } else if (ch === "B") {
        type = T.BUMPER;
        L.bumpers.push({ x, z, r, c, cool: 0 });
      } else if (ARROWS[ch]) {
        type = T.BOOST;
        L.boost[i * 2] = ARROWS[ch][0];
        L.boost[i * 2 + 1] = ARROWS[ch][1];
      } else if ("1234".includes(ch)) L.portals.push({ x, z, r, c, ch, partner: null, armed: true });
      L.cells[i] = type;
    }
  }
  const pairs = { 1: "2", 2: "1", 3: "4", 4: "3" };
  for (const p of L.portals) p.partner = L.portals.find((q) => q.ch === pairs[p.ch]) ?? null;
  for (const o of stage.objects ?? []) {
    if (o.type === "spinner") {
      L.spinners.push({ x: cx(o.at[1]), z: cz(o.at[0]), arm: o.arm * CELL, speed: o.speed, angle: 0, thick: 0.016 });
    } else if (o.type === "slider") {
      const s = {
        ax: cx(o.from[1]),
        az: cz(o.from[0]),
        bx: cx(o.to[1]),
        bz: cz(o.to[0]),
        hw: (o.size[0] * CELL) / 2,
        hh: (o.size[1] * CELL) / 2,
        period: o.period,
        x: 0,
        z: 0,
        vx: 0,
        vz: 0,
      };
      s.x = s.ax;
      s.z = s.az;
      L.sliders.push(s);
    }
  }
  return L;
}

// Bolinha rolando no plano do tabuleiro (x para a direita, z para perto de quem joga).
export function createPhysics() {
  const ball = { x: 0, z: 0, vx: 0, vz: 0, speed: 0, surface: T.FLOOR };
  const events = [];
  let L = null;
  let time = 0;
  let impact = 0;

  function load(layout) {
    L = layout;
    time = 0;
    place(L.start.x, L.start.z);
    moveObjects(0);
  }

  function place(x, z) {
    ball.x = x;
    ball.z = z;
    ball.vx = 0;
    ball.vz = 0;
    ball.speed = 0;
  }

  function cellIndex(x, z) {
    const c = Math.floor((x + L.W / 2) / CELL);
    const r = Math.floor((z + L.H / 2) / CELL);
    if (r < 0 || c < 0 || r >= L.rows || c >= L.cols) return -1;
    return r * L.cols + c;
  }

  function cellType(r, c) {
    if (r < 0 || c < 0 || r >= L.rows || c >= L.cols) return T.VOID;
    return L.cells[r * L.cols + c];
  }

  function isSolid(r, c) {
    const t = cellType(r, c);
    if (t === T.WALL) return true;
    if (t !== T.DOOR) return false;
    for (const d of L.doors) if (d.r === r && d.c === c) return !d.open;
    return false;
  }

  function moveObjects(t) {
    for (const s of L.spinners) s.angle = s.speed * t;
    for (const s of L.sliders) {
      const w = (Math.PI * 2) / s.period;
      const k = 0.5 - 0.5 * Math.cos(w * t);
      const dk = 0.5 * Math.sin(w * t) * w;
      s.x = s.ax + (s.bx - s.ax) * k;
      s.z = s.az + (s.bz - s.az) * k;
      s.vx = (s.bx - s.ax) * dk;
      s.vz = (s.bz - s.az) * dk;
    }
  }

  // Empurra a bolinha para fora de um ponto de contato e rebate a velocidade relativa.
  function resolve(px, pz, reach, svx, svz, bounce) {
    const dx = ball.x - px;
    const dz = ball.z - pz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= reach * reach) return false;
    const d = Math.sqrt(d2);
    let nx = 1;
    let nz = 0;
    if (d > 1e-6) {
      nx = dx / d;
      nz = dz / d;
    }
    ball.x += nx * (reach - d);
    ball.z += nz * (reach - d);
    const rvx = ball.vx - svx;
    const rvz = ball.vz - svz;
    const vn = rvx * nx + rvz * nz;
    if (vn < 0) {
      ball.vx -= (1 + bounce) * vn * nx;
      ball.vz -= (1 + bounce) * vn * nz;
      impact = Math.max(impact, -vn);
    }
    return true;
  }

  function collideBox(x0, z0, x1, z1, svx, svz, bounce) {
    const px = Math.max(x0, Math.min(ball.x, x1));
    const pz = Math.max(z0, Math.min(ball.z, z1));
    if (px === ball.x && pz === ball.z) {
      const left = ball.x - x0;
      const right = x1 - ball.x;
      const top = ball.z - z0;
      const bottom = z1 - ball.z;
      const m = Math.min(left, right, top, bottom);
      if (m === left) ball.x = x0 - BALL_R;
      else if (m === right) ball.x = x1 + BALL_R;
      else if (m === top) ball.z = z0 - BALL_R;
      else ball.z = z1 + BALL_R;
      return true;
    }
    return resolve(px, pz, BALL_R, svx, svz, bounce);
  }

  function substep(h, ax, az) {
    time += h;
    moveObjects(time);
    const i = cellIndex(ball.x, ball.z);
    const type = i < 0 ? T.VOID : L.cells[i];
    ball.surface = type;
    let fx = ax * ACCEL;
    let fz = az * ACCEL;
    let damp = DAMP_FLOOR;
    if (type === T.ICE) damp = DAMP_ICE;
    else if (type === T.MUD) damp = DAMP_MUD;
    else if (type === T.BOOST) {
      fx += L.boost[i * 2] * BOOST;
      fz += L.boost[i * 2 + 1] * BOOST;
    }
    for (const hole of L.holes) {
      const dx = hole.x - ball.x;
      const dz = hole.z - ball.z;
      const d = Math.hypot(dx, dz);
      if (d < PULL_ZONE && d > 1e-5) {
        const pull = 1.8 * (1 - d / PULL_ZONE);
        fx += (dx / d) * pull;
        fz += (dz / d) * pull;
      }
    }
    const gd = Math.hypot(L.goal.x - ball.x, L.goal.z - ball.z);
    if (gd < 0.07 && gd > 1e-5) {
      fx += ((L.goal.x - ball.x) / gd) * 1.2;
      fz += ((L.goal.z - ball.z) / gd) * 1.2;
    }
    ball.vx += fx * h;
    ball.vz += fz * h;
    const k = Math.max(0, 1 - damp * h);
    ball.vx *= k;
    ball.vz *= k;
    const sp = Math.hypot(ball.vx, ball.vz);
    if (sp > MAX_SPEED) {
      ball.vx *= MAX_SPEED / sp;
      ball.vz *= MAX_SPEED / sp;
    }
    ball.x += ball.vx * h;
    ball.z += ball.vz * h;

    const r0 = Math.floor((ball.z + L.H / 2) / CELL);
    const c0 = Math.floor((ball.x + L.W / 2) / CELL);
    for (let r = r0 - 1; r <= r0 + 1; r++) {
      for (let c = c0 - 1; c <= c0 + 1; c++) {
        if (!isSolid(r, c)) continue;
        const x0 = c * CELL - L.W / 2;
        const z0 = r * CELL - L.H / 2;
        collideBox(x0, z0, x0 + CELL, z0 + CELL, 0, 0, WALL_BOUNCE);
      }
    }
    for (const s of L.sliders) collideBox(s.x - s.hw, s.z - s.hh, s.x + s.hw, s.z + s.hh, s.vx, s.vz, 0.5);
    for (const s of L.spinners) {
      const ux = Math.cos(s.angle);
      const uz = -Math.sin(s.angle);
      const t = Math.max(-s.arm, Math.min(s.arm, (ball.x - s.x) * ux + (ball.z - s.z) * uz));
      const qx = s.x + ux * t;
      const qz = s.z + uz * t;
      resolve(qx, qz, BALL_R + s.thick, s.speed * (qz - s.z), -s.speed * (qx - s.x), 0.6);
    }
    for (let b = 0; b < L.bumpers.length; b++) {
      const bp = L.bumpers[b];
      bp.cool = Math.max(0, bp.cool - h);
      if (!resolve(bp.x, bp.z, BALL_R + BUMPER_R, 0, 0, 1)) continue;
      const nx = ball.x - bp.x;
      const nz = ball.z - bp.z;
      const n = Math.hypot(nx, nz) || 1;
      const out = (ball.vx * nx + ball.vz * nz) / n;
      const kick = Math.max(0, 0.6 - out);
      ball.vx += (nx / n) * kick;
      ball.vz += (nz / n) * kick;
      if (bp.cool <= 0) {
        bp.cool = 0.15;
        events.push({ type: "bumper", index: b });
      }
    }
  }

  // Para um objeto novo no tabuleiro: um gatilho aqui que gere um evento para o jogo.
  function triggers() {
    const i = cellIndex(ball.x, ball.z);
    if (i < 0 || L.cells[i] === T.VOID) {
      events.push({ type: "fall", kind: "void" });
      return true;
    }
    for (const hole of L.holes) {
      if (Math.hypot(hole.x - ball.x, hole.z - ball.z) < FALL_AT) {
        events.push({ type: "fall", kind: "hole", x: hole.x, z: hole.z });
        return true;
      }
    }
    if (Math.hypot(L.goal.x - ball.x, L.goal.z - ball.z) < 0.03) {
      events.push({ type: "goal" });
      return true;
    }
    L.stars.forEach((s, k) => {
      if (!s.taken && Math.hypot(s.x - ball.x, s.z - ball.z) < BALL_R + 0.025) {
        s.taken = true;
        events.push({ type: "star", index: k });
      }
    });
    L.keys.forEach((s, k) => {
      if (!s.taken && Math.hypot(s.x - ball.x, s.z - ball.z) < BALL_R + 0.025) {
        s.taken = true;
        for (const d of L.doors) d.open = true;
        events.push({ type: "key", index: k });
      }
    });
    L.checks.forEach((s, k) => {
      if (!s.on && Math.abs(s.x - ball.x) < CELL * 0.5 && Math.abs(s.z - ball.z) < CELL * 0.5) {
        s.on = true;
        events.push({ type: "check", index: k });
      }
    });
    for (const p of L.portals) {
      const d = Math.hypot(p.x - ball.x, p.z - ball.z);
      if (!p.armed) {
        if (d > 0.07) p.armed = true;
        continue;
      }
      if (d < 0.028 && p.partner) {
        p.partner.armed = false;
        ball.x = p.partner.x;
        ball.z = p.partner.z;
        ball.vx *= 0.6;
        ball.vz *= 0.6;
        events.push({ type: "portal", from: p, to: p.partner });
        break;
      }
    }
    return false;
  }

  function step(dt, ax, az) {
    events.length = 0;
    impact = 0;
    const h = dt / SUBSTEPS;
    for (let s = 0; s < SUBSTEPS; s++) {
      substep(h, ax, az);
      if (triggers()) break;
    }
    ball.speed = Math.hypot(ball.vx, ball.vz);
    if (impact > 0.12) events.push({ type: "wall", speed: impact });
    return events;
  }

  // Só anima os objetos móveis (antes da largada ou durante uma queda).
  function idle(dt) {
    time += dt;
    moveObjects(time);
  }

  return {
    ball,
    load,
    place,
    step,
    idle,
    get layout() {
      return L;
    },
  };
}
