import * as THREE from "three";

const KEY = "labirinto-controle";
const DEAD = 0.02;
const FULL = 0.2;
const ROLL_FULL = 0.3;
const PITCH_FULL = 0.32;
const SHAPE_DEAD = 0.12;
const right = new THREE.Vector3();
const fwd = new THREE.Vector3();
const gaze = { x: 0, z: 0 };

function read() {
  try {
    return window.localStorage.getItem(KEY) === "inclinar" ? "inclinar" : "olhar";
  } catch {
    return "olhar";
  }
}

function shape(v) {
  const a = Math.abs(v);
  if (a < SHAPE_DEAD) return 0;
  return Math.sign(v) * Math.min(1, (a - SHAPE_DEAD) / (1 - SHAPE_DEAD));
}

// Transforma olhar, inclinação da cabeça ou teclado numa inclinação do tabuleiro (-1 a 1 em cada eixo).
export function createControl() {
  let mode = read();
  const keys = { left: false, right: false, up: false, down: false };
  const tilt = { x: 0, z: 0 };
  const guide = { show: false, x: 0, z: 0 };

  const map = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
  };
  window.addEventListener("keydown", (e) => {
    if (map[e.code]) {
      keys[map[e.code]] = true;
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (map[e.code]) keys[map[e.code]] = false;
  });
  window.addEventListener("blur", () => {
    keys.left = keys.right = keys.up = keys.down = false;
  });

  function setMode(next) {
    mode = next;
    try {
      window.localStorage.setItem(KEY, mode);
    } catch {
      // Sem localStorage: vale só até recarregar.
    }
  }

  function reset() {
    tilt.x = 0;
    tilt.z = 0;
    guide.show = false;
  }

  // "strength" (0 a 1) suaviza o olhar logo após a largada, para a bolinha não sair disparada.
  function update(dt, { head, origin, direction, board, ball, layout, active, strength = 1 }) {
    let tx = 0;
    let tz = 0;
    guide.show = false;
    const kx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const kz = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (!active) {
      // Parado: o tabuleiro volta a ficar reto.
    } else if (kx || kz) {
      tx = kx;
      tz = kz;
    } else if (mode === "olhar") {
      if (board.project(origin, direction, gaze)) {
        const inside = Math.abs(gaze.x) < layout.W / 2 + 0.25 && Math.abs(gaze.z) < layout.H / 2 + 0.25;
        if (inside) {
          guide.show = true;
          guide.x = gaze.x;
          guide.z = gaze.z;
          const dx = gaze.x - ball.x;
          const dz = gaze.z - ball.z;
          const len = Math.hypot(dx, dz);
          if (len > 1e-5) {
            const k = Math.min(1, Math.max(0, (len - DEAD) / (FULL - DEAD))) * strength;
            tx = (dx / len) * k;
            tz = (dz / len) * k;
          }
        }
      }
    } else {
      right.set(1, 0, 0).applyQuaternion(head.quaternion);
      fwd.set(0, 0, -1).applyQuaternion(head.quaternion);
      const roll = Math.asin(Math.max(-1, Math.min(1, right.y)));
      const pitch = Math.asin(Math.max(-1, Math.min(1, fwd.y)));
      const center = board.root.position;
      const neutral = Math.atan2(center.y - head.position.y, Math.hypot(center.x - head.position.x, center.z - head.position.z));
      tx = shape(-roll / ROLL_FULL) * strength;
      tz = shape(-(pitch - neutral) / PITCH_FULL) * strength;
    }
    const len = Math.hypot(tx, tz);
    if (len > 1) {
      tx /= len;
      tz /= len;
    }
    const k = Math.min(1, dt * 7);
    tilt.x += (tx - tilt.x) * k;
    tilt.z += (tz - tilt.z) * k;
    return tilt;
  }

  return {
    tilt,
    guide,
    update,
    reset,
    setMode,
    get mode() {
      return mode;
    },
  };
}
