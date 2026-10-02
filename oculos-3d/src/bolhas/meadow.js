import { TAU, angleDiff, rand } from "../shared/util.js";

const MAX = 24;
const R_MIN = 2.3;
const R_MAX = 4.5;
const SIZE = 0.5;
const FOOT = 0.45;

// Bichinhos salvos: pulam da bolha para a grama em volta do deck e ficam passeando até o fim da rodada.
export function createMeadow(scene, critters, { groundAt }) {
  const list = [];

  function free(x, z, self) {
    for (const o of list) {
      if (o === self || o.mode === "leave") continue;
      if (Math.hypot(o.tx - x, o.tz - z) < 0.7) return false;
    }
    return true;
  }

  function spot(angle, self) {
    let x = 0;
    let z = 0;
    for (let tries = 0; tries < 14; tries++) {
      const a = angle + rand(-0.7, 0.7);
      const r = rand(R_MIN, R_MAX);
      x = Math.sin(a) * r;
      z = Math.cos(a) * r;
      if (free(x, z, self)) break;
    }
    return [x, z];
  }

  function hop(c, tx, tz, dur, height, spin = 0) {
    c.mode = "hop";
    c.t = 0;
    c.dur = dur;
    c.height = height;
    c.spin = spin;
    c.fx = c.mesh.position.x;
    c.fy = c.mesh.position.y;
    c.fz = c.mesh.position.z;
    c.tx = tx;
    c.tz = tz;
    if (Math.hypot(tx - c.fx, tz - c.fz) > 0.05) c.heading = Math.atan2(tx - c.fx, tz - c.fz);
  }

  function leave(c, delay = 0) {
    if (c.mode === "leave") return;
    const out = Math.atan2(c.mesh.position.x, c.mesh.position.z) + rand(-0.4, 0.4);
    c.mode = "leave";
    c.t = -delay;
    c.heading = out;
    c.fy = c.mesh.position.y;
  }

  function add(mesh, from, scale) {
    const staying = list.filter((c) => c.mode !== "leave");
    if (staying.length >= MAX) leave(staying[0]);
    scene.add(mesh);
    mesh.position.copy(from);
    mesh.rotation.set(0, mesh.rotation.y, 0);
    const c = {
      mesh,
      scale0: scale,
      size: scale,
      heading: 0,
      next: rand(1.2, 2.6),
      land: 0,
      phase: rand(0, TAU),
      faceIn: true,
    };
    const [tx, tz] = spot(Math.atan2(from.x, from.z), c);
    hop(c, tx, tz, 1.0, 0.9, TAU);
    list.push(c);
  }

  function ground(x, z) {
    return groundAt(x, z) + FOOT * SIZE;
  }

  function idleAction(c) {
    const roll = Math.random();
    const p = c.mesh.position;
    if (roll < 0.45) {
      const a = Math.atan2(p.x, p.z) + rand(-0.35, 0.35);
      const r = Math.min(R_MAX, Math.max(R_MIN, Math.hypot(p.x, p.z) + rand(-0.5, 0.5)));
      const x = Math.sin(a) * r;
      const z = Math.cos(a) * r;
      if (free(x, z, c)) hop(c, x, z, 0.55, 0.28);
      else c.heading = Math.atan2(-p.x, -p.z);
    } else if (roll < 0.75) {
      c.heading = Math.atan2(-p.x, -p.z) + rand(-0.4, 0.4);
    } else if (roll < 0.9) {
      hop(c, p.x, p.z, 0.6, 0.4, Math.random() < 0.5 ? TAU : -TAU);
    } else {
      hop(c, p.x, p.z, 0.35, 0.15);
    }
    c.next = rand(1.4, 3.8);
  }

  function update(dt, t) {
    for (let i = list.length - 1; i >= 0; i--) {
      const c = list[i];
      const m = c.mesh;
      c.t += dt;
      let squash = 1;
      if (c.mode === "hop") {
        const k = Math.min(1, c.t / c.dur);
        const gy = ground(c.tx, c.tz);
        m.position.x = c.fx + (c.tx - c.fx) * k;
        m.position.z = c.fz + (c.tz - c.fz) * k;
        m.position.y = c.fy + (gy - c.fy) * k + c.height * 4 * k * (1 - k);
        if (c.size !== SIZE) c.size = c.scale0 + (SIZE - c.scale0) * k;
        if (c.spin) m.rotation.y = c.heading + c.spin * (1 - k);
        squash = k < 0.15 ? 1.12 : 1;
        if (k >= 1) {
          c.size = SIZE;
          c.mode = "idle";
          c.land = 0.18;
          if (c.faceIn) {
            c.faceIn = false;
            c.heading = Math.atan2(-m.position.x, -m.position.z);
          }
        }
      } else if (c.mode === "idle") {
        c.next -= dt;
        m.position.y = ground(m.position.x, m.position.z) + Math.abs(Math.sin(t * 2.2 + c.phase)) * 0.015;
        if (c.next <= 0) idleAction(c);
      } else if (c.mode === "leave") {
        if (c.t < 0) continue;
        const cycle = (c.t % 0.45) / 0.45;
        m.position.x += Math.sin(c.heading) * dt * 1.3;
        m.position.z += Math.cos(c.heading) * dt * 1.3;
        m.position.y = ground(m.position.x, m.position.z) + Math.sin(cycle * Math.PI) * 0.22;
        const fade = Math.max(0, 1 - c.t / 1.3);
        c.size = SIZE * fade;
        if (fade <= 0) {
          list.splice(i, 1);
          critters.release(m);
          continue;
        }
      }
      if (!c.spin || c.mode !== "hop") m.rotation.y += angleDiff(c.heading, m.rotation.y) * Math.min(1, dt * 7);
      if (c.land > 0) {
        c.land -= dt;
        squash = 0.8;
      }
      m.scale.set(c.size / Math.sqrt(squash), c.size * squash, c.size / Math.sqrt(squash));
    }
  }

  // immediate: some na hora (menu); senão, cada um vai embora saltitando.
  function clear(immediate = false) {
    if (immediate) {
      for (const c of list) critters.release(c.mesh);
      list.length = 0;
      return;
    }
    list.forEach((c, i) => leave(c, i * 0.05));
  }

  return {
    add,
    update,
    clear,
    get count() {
      return list.length;
    },
  };
}
