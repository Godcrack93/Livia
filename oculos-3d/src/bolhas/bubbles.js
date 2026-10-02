import * as THREE from "three";
import { clamp01, easeOutBack, rand } from "../shared/util.js";
import { SUN, palette, time } from "./world.js";

const MAX = 60;

// Para um tipo novo de bolha: uma entrada aqui e o tratamento dela em game.js.
export const KINDS = {
  normal: { r: [0.27, 0.36], hold: 0.3, points: 1, life: [8, 11], code: 0 },
  mini: { r: [0.17, 0.21], hold: 0.22, points: 1, life: [5, 7], code: 0 },
  star: { r: [0.36, 0.4], hold: 0.32, points: 3, life: [8, 10], code: 0 },
  friend: { r: [0.42, 0.46], hold: 0.35, points: 5, life: [9, 11], code: 0 },
  gold: { r: [0.3, 0.32], hold: 0.25, points: 10, life: [5, 6.5], code: 1 },
  rainbow: { r: [0.38, 0.4], hold: 0.3, points: 3, life: [7, 8], code: 2 },
  giant: { r: [0.72, 0.82], hold: 0.55, points: 2, life: [10, 12], code: 0 },
  button: { r: [0.46, 0.46], hold: 1.2, points: 0, life: [Infinity, Infinity], code: 0 },
  number: { r: [0.36, 0.38], hold: 0.35, points: 0, life: [Infinity, Infinity], code: 0 },
};

// Conteúdo que sempre olha para a cabeça (placas de texto), em vez de girar.
const FACING = new Set(["button", "number"]);

const vertex = /* glsl */ `
attribute vec4 aData;
varying vec3 vNormalW;
varying vec3 vViewW;
varying vec3 vNormalV;
varying vec3 vLocal;
varying vec4 vData;
void main() {
  mat4 m = modelMatrix * instanceMatrix;
  vec4 wp = m * vec4(position, 1.0);
  vNormalW = normalize(mat3(m) * normal);
  vViewW = cameraPosition - wp.xyz;
  vNormalV = normalize(mat3(viewMatrix) * vNormalW);
  vLocal = position;
  vData = aData;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const fragment = /* glsl */ `
uniform float uTime;
uniform vec3 uSun;
uniform vec3 uSky;
uniform vec3 uHorizon;
uniform vec3 uGround;
varying vec3 vNormalW;
varying vec3 vViewW;
varying vec3 vNormalV;
varying vec3 vLocal;
varying vec4 vData;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

float swirl(vec3 p) {
  return sin(p.x * 3.1 + uTime * 0.8) * sin(p.y * 2.6 - uTime * 0.6) + sin(p.z * 3.4 + p.y * 1.3 + uTime * 0.7) * 0.6;
}

void main() {
  float front = gl_FrontFacing ? 1.0 : 0.0;
  vec3 N = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 V = normalize(vViewW);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = 1.0 - ndv;
  float kind = vData.z;

  float thick = vData.x + fres * 1.4 + swirl(vLocal * 1.3 + vData.x * 9.0) * 0.22 - vLocal.y * 0.35;
  vec3 film = mix(vec3(1.0), spectrum(thick), 0.85);
  if (kind > 1.5) {
    film = spectrum(vLocal.y * 1.1 + vLocal.x * 0.4 + uTime * 0.8) * 1.45;
  } else if (kind > 0.5) {
    film = mix(vec3(1.0, 0.62, 0.08), vec3(1.0, 0.93, 0.45), fres * 0.8 + vLocal.y * 0.3) * 1.5 + spectrum(thick) * 0.1;
  }

  vec3 R = reflect(-V, N);
  vec3 env = R.y > 0.0 ? mix(uHorizon, uSky, sqrt(R.y)) : mix(uHorizon, uGround, sqrt(-R.y));
  float sun = pow(max(dot(R, uSun), 0.0), 90.0) * 2.5;

  vec3 nv = normalize(vNormalV);
  float win = smoothstep(0.935, 0.975, dot(nv, normalize(vec3(-0.45, 0.55, 0.7)))) * front;
  float win2 = smoothstep(0.978, 0.992, dot(nv, normalize(vec3(0.5, -0.42, 0.75)))) * front * 0.6;

  vec3 col = film * (0.6 + 0.5 * env);
  float alpha = 0.04 + pow(fres, 2.0) * 0.78;
  if (kind > 0.5) alpha += 0.3 + fres * 0.15;
  col += vec3(win + win2 + sun);
  alpha += win * 0.85 + win2 + sun;

  float charge = vData.w;
  col += charge * vec3(0.45, 0.4, 0.5);
  alpha += charge * 0.2;
  if (front < 0.5) alpha *= 0.4;

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0) * vData.y);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const euler = new THREE.Euler();
const scale = new THREE.Vector3();
const v = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function bezier(out, a, b, c, t) {
  const u = 1 - t;
  out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z,
  );
  return out;
}

export function createBubbles(scene, { onExpire }) {
  const geometry = new THREE.SphereGeometry(1, 32, 20);
  const data = new Float32Array(MAX * 4);
  const dataAttr = new THREE.InstancedBufferAttribute(data, 4).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("aData", dataAttr);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: time,
      uSun: { value: SUN },
      uSky: { value: palette.mid },
      uHorizon: { value: palette.horizon },
      uGround: { value: palette.ground },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, MAX);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  mesh.count = 0;
  scene.add(mesh);

  const pool = [];
  for (let i = 0; i < MAX; i++) {
    pool.push({
      active: false,
      kind: "normal",
      def: KINDS.normal,
      r: 0.3,
      hold: 0.3,
      points: 1,
      pos: new THREE.Vector3(),
      view: new THREE.Vector3(),
      start: new THREE.Vector3(),
      ctrl: new THREE.Vector3(),
      end: new THREE.Vector3(),
      drift: new THREE.Vector3(),
      approach: 2,
      age: 0,
      life: 10,
      seed: 0,
      hue: 0,
      alpha: 1,
      charge: 0,
      hover: 0,
      dying: false,
      content: null,
      contentScale: 1,
      sway: 0.12,
      emitter: -1,
      glow: 0,
      cool: 0,
      shake: 0,
      rare: false,
      number: 0,
    });
  }

  let focus = null;
  let focusProgress = 0;

  function spawn(kind, start, dir, end, { content = null, approach = rand(1.6, 2.3), emitter = -1 } = {}) {
    let b = null;
    for (const x of pool) {
      if (!x.active) {
        b = x;
        break;
      }
    }
    if (!b) return null;
    const def = KINDS[kind];
    b.active = true;
    b.kind = kind;
    b.def = def;
    b.r = rand(def.r[0], def.r[1]);
    b.hold = def.hold;
    b.points = def.points;
    b.start.copy(start);
    b.end.copy(end);
    b.ctrl.copy(start).addScaledVector(dir, 1.3).addScaledVector(UP, 0.6);
    b.pos.copy(start);
    b.view.copy(start);
    if (kind === "number") b.drift.set(0, 0, 0);
    else b.drift.set(rand(-0.08, 0.08), rand(0.05, 0.14), rand(-0.08, 0.08));
    b.approach = approach;
    b.age = 0;
    b.life = rand(def.life[0], def.life[1]);
    b.seed = rand(0, 100);
    b.hue = Math.random();
    b.alpha = 1;
    b.charge = 0;
    b.hover = 0;
    b.dying = false;
    b.sway = kind === "gold" ? 0.55 : kind === "giant" ? 0.06 : kind === "number" ? 0.05 : 0.12;
    b.emitter = emitter;
    b.glow = 0;
    b.cool = 0;
    b.shake = 0;
    b.rare = false;
    b.number = 0;
    b.content = content;
    b.contentScale = b.r * (FACING.has(kind) ? 1 : 0.92);
    if (content) scene.add(content);
    return b;
  }

  function release(b) {
    b.active = false;
    if (focus === b) focus = null;
    const content = b.content;
    b.content = null;
    return content;
  }

  function pop(b) {
    if (!b.active) return null;
    return release(b);
  }

  function setFocus(b, progress) {
    focus = b;
    focusProgress = progress;
  }

  function pick(origin, dir, out) {
    let best = null;
    let bestDist = Infinity;
    for (const b of pool) {
      if (!b.active || b.alpha < 0.35 || b.cool > 0 || b.age < (b.kind === "button" ? 1.2 : 0.25)) continue;
      v.copy(b.view).sub(origin);
      const tca = v.dot(dir);
      if (tca < 0) continue;
      const d2 = v.lengthSq() - tca * tca;
      const rr = b.r * 1.3 + 0.07;
      if (d2 > rr * rr) continue;
      const dist = tca - Math.sqrt(rr * rr - d2);
      if (dist < bestDist) {
        bestDist = dist;
        best = b;
      }
    }
    if (best) {
      out.target = best;
      out.dist = Math.max(0.5, bestDist);
    }
  }

  function separate() {
    for (let i = 0; i < MAX; i++) {
      const a = pool[i];
      if (!a.active || a.age < a.approach || a.kind === "button") continue;
      for (let j = i + 1; j < MAX; j++) {
        const b = pool[j];
        if (!b.active || b.age < b.approach || b.kind === "button") continue;
        v.copy(b.pos).sub(a.pos);
        const min = a.r + b.r + 0.08;
        const d2 = v.lengthSq();
        if (d2 >= min * min || d2 < 1e-6) continue;
        const d = Math.sqrt(d2);
        v.multiplyScalar(((min - d) * 0.5) / d);
        a.pos.sub(v);
        b.pos.add(v);
      }
      const h = Math.hypot(a.pos.x, a.pos.z);
      if (h < 1.7 && h > 1e-4) {
        a.pos.x *= 1.7 / h;
        a.pos.z *= 1.7 / h;
      }
    }
  }

  function update(dt, head) {
    separate();
    let n = 0;
    for (const b of pool) {
      if (!b.active) continue;
      b.age += dt;
      const t = b.age;
      if (b.kind === "button") {
        b.view.copy(b.end);
        b.view.y += Math.sin(t * 1.6) * 0.06;
        b.hue = (t * 0.05) % 1;
      } else {
        if (t < b.approach) {
          const k = t / b.approach;
          bezier(b.pos, b.start, b.ctrl, b.end, 1 - (1 - k) * (1 - k) * (1 - k));
        } else {
          b.pos.addScaledVector(b.drift, dt);
          if (b.dying) b.pos.y += dt * 0.8;
        }
        const settle = clamp01((t - b.approach * 0.6) / 1.2);
        const s = b.sway * settle;
        const f = b.kind === "gold" ? 2.6 : 1;
        b.view.set(
          b.pos.x + Math.sin(t * 1.3 * f + b.seed) * s,
          b.pos.y + Math.sin(t * 1.7 * f + b.seed * 1.3) * s * 0.6,
          b.pos.z + Math.cos(t * 1.1 * f + b.seed * 0.7) * s,
        );
        if (b.shake > 0) {
          b.shake = Math.max(0, b.shake - dt * 1.8);
          const k = Math.sin(t * 42) * 0.07 * b.shake;
          b.view.x += k * Math.cos(b.seed);
          b.view.z += k * Math.sin(b.seed);
        }
        if (b.cool > 0) b.cool = Math.max(0, b.cool - dt);
        if (!b.dying && t > b.life) b.dying = true;
        if (b.dying) {
          b.alpha -= dt * 1.4;
          if (b.alpha <= 0) {
            const content = release(b);
            onExpire(b, content);
            continue;
          }
        }
      }

      const glow = b.glow ? b.glow * (0.28 + 0.18 * Math.sin(t * 6)) : 0;
      const target = b === focus ? Math.max(focusProgress, glow) : glow;
      b.charge += (target - b.charge) * Math.min(1, dt * 20);
      b.hover += ((b === focus ? 1 : 0) - b.hover) * Math.min(1, dt * 12);

      const grow = easeOutBack(Math.min(1, t / 0.45));
      const wob = Math.sin(t * 6 + b.seed) * 0.035 + b.charge * 0.05;
      const r = b.r * grow * (1 + b.hover * 0.08 + b.charge * 0.06);
      euler.set(Math.sin(t * 0.4 + b.seed) * 0.4, t * 0.35 + b.seed, 0);
      q.setFromEuler(euler);
      m4.compose(b.view, q, scale.set(r * (1 + wob), r * (1 - wob), r * (1 + wob * 0.5)));
      mesh.setMatrixAt(n, m4);
      data[n * 4] = b.hue;
      data[n * 4 + 1] = b.alpha;
      data[n * 4 + 2] = b.def.code;
      data[n * 4 + 3] = b.charge;
      n++;

      if (b.content) {
        const c = b.content;
        c.position.copy(b.view);
        const cs = b.contentScale * grow * Math.max(0, b.alpha);
        c.scale.setScalar(cs);
        if (FACING.has(b.kind)) c.quaternion.copy(head.quaternion);
        else {
          c.rotation.y = t * 1.3 + b.seed;
          c.rotation.z = Math.sin(t * 2 + b.seed) * 0.15;
          c.position.y += Math.sin(t * 2.4 + b.seed) * b.r * 0.08;
        }
      }
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    dataAttr.needsUpdate = true;
  }

  function each(fn) {
    for (const b of pool) if (b.active) fn(b);
  }

  function count(filter) {
    let n = 0;
    for (const b of pool) if (b.active && !b.dying && (!filter || filter(b))) n++;
    return n;
  }

  function fadeAll(keepButtons = false) {
    for (const b of pool) {
      if (!b.active || (keepButtons && b.kind === "button")) continue;
      if (b.kind === "button") {
        onExpire(b, release(b));
        continue;
      }
      b.dying = true;
      b.alpha = Math.min(b.alpha, 0.6);
    }
  }

  return { spawn, pop, pick, setFocus, update, each, count, fadeAll, pool };
}
