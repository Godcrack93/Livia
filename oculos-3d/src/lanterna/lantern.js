import * as THREE from "three";
import { pointScale } from "../shared/points.js";
import { HIGH } from "../shared/quality.js";
import { TAU, canvasTexture, makeCanvas, mergeAll, paint, rand, smoothstep, xf } from "../shared/util.js";
import { time } from "./world.js";

const RANGE = 15;
const BEAM = 7.5;
// Onde a lanterna fica em relação à cabeça: embaixo e à direita, como se estivesse na mão.
const HOLD = new THREE.Vector3(0.2, -0.34, -0.52);
const HOLD_SCALE = 0.62;
const FORWARD = new THREE.Vector3(0, 0, -1);
const toPoint = new THREE.Vector3();
const tmp = new THREE.Vector3();
const aim = new THREE.Vector3();
// Falha da lanterna (nível Sustão): [segundos, força]. As trocas levam 0,3 s ou mais (nada de pisca-pisca rápido).
const FAILURE = [
  [0, 1],
  [0.3, 0.25],
  [0.6, 1],
  [0.95, 0.15],
  [1.25, 0],
  [2.45, 0],
  [2.55, 1.35],
  [3.6, 1],
];

let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  const canvas = makeCanvas(64, 64);
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  glowTex = canvasTexture(canvas);
  return glowTex;
}

function frameGeometry() {
  const parts = [];
  const base = new THREE.CylinderGeometry(0.055, 0.062, 0.03, 14);
  paint(base, "#3a2f5e");
  xf(base, 0, -0.075, 0);
  parts.push(base);
  const top = new THREE.ConeGeometry(0.066, 0.05, 14);
  paint(top, "#3a2f5e");
  xf(top, 0, 0.085, 0);
  parts.push(top);
  const knob = new THREE.SphereGeometry(0.014, 8, 6);
  paint(knob, "#ffd27a");
  xf(knob, 0, 0.115, 0);
  parts.push(knob);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + TAU / 8;
    const bar = new THREE.CylinderGeometry(0.005, 0.005, 0.13, 4);
    paint(bar, "#3a2f5e");
    xf(bar, Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05);
    parts.push(bar);
  }
  const handle = new THREE.TorusGeometry(0.035, 0.006, 6, 16, Math.PI);
  paint(handle, "#3a2f5e");
  xf(handle, 0, 0.115, 0);
  parts.push(handle);
  return mergeAll(parts);
}

// Feixe: cones abertos uns dentro dos outros (o meio fica mais forte). Escala (R, R, comprimento).
function beamGeometry() {
  const parts = [];
  for (const k of HIGH ? [0.45, 0.72, 1] : [0.6, 1]) {
    const cone = new THREE.ConeGeometry(k, 1, 22, 1, true);
    cone.translate(0, -0.5, 0);
    cone.rotateX(Math.PI / 2);
    parts.push(cone);
  }
  return mergeAll(parts, ["position"]);
}

function dustPoints() {
  const count = HIGH ? 36 : 22;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const z = rand(0.05, 0.9);
    const a = rand(0, TAU);
    const r = Math.sqrt(Math.random()) * z * 0.8;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = Math.sin(a) * r;
    positions[i * 3 + 2] = -z;
    phases[i] = rand(0, TAU);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  const uniforms = { uScale: pointScale, uTime: time, uPower: { value: 1 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uScale;
      uniform float uTime;
      attribute float aPhase;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.4 + aPhase) * 0.04;
        p.y += sin(uTime * 0.33 + aPhase * 1.7) * 0.04;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 0.02 * uScale / max(0.1, -mv.z);
        vAlpha = (0.4 + 0.6 * pow(max(0.0, sin(uTime * 1.3 + aPhase)), 3.0)) * (1.0 - smoothstep(0.5, 0.95, -position.z));
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uPower;
      varying float vAlpha;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float a = exp(-dot(p, p) * 5.0) * vAlpha * 0.5 * uPower;
        gl_FragColor = vec4(vec3(1.0, 0.9, 0.7) * a, a);
      }
    `,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 9;
  return { points, uniforms };
}

function sampleFailure(t) {
  for (let i = 1; i < FAILURE.length; i++) {
    const [t1, v1] = FAILURE[i];
    if (t > t1) continue;
    const [t0, v0] = FAILURE[i - 1];
    const k = smoothstep(t0, t1, t);
    return v0 + (v1 - v0) * k;
  }
  return 1;
}

// A lanterna da Lívia: luz de verdade (SpotLight), feixe visível e o teste de "está iluminado?".
export function createLantern(scene, { onFlare } = {}) {
  const holder = new THREE.Group();
  scene.add(holder);
  const model = new THREE.Group();
  model.position.copy(HOLD);
  model.scale.setScalar(HOLD_SCALE);
  holder.add(model);
  model.add(new THREE.Mesh(frameGeometry(), new THREE.MeshLambertMaterial({ vertexColors: true })));
  const glassMat = new THREE.MeshBasicMaterial({ color: "#ffd27a", toneMapped: false });
  model.add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 14), glassMat));
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshBasicMaterial({ color: "#fff6de", toneMapped: false }));
  flame.scale.set(1, 1.6, 1);
  model.add(flame);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color: "#ffc861",
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  halo.scale.setScalar(0.32);
  halo.renderOrder = 10;
  model.add(halo);

  const beamUniforms = { uColor: { value: new THREE.Color("#ffd9a0") }, uPower: { value: 1 }, uTime: time };
  const beam = new THREE.Mesh(
    beamGeometry(),
    new THREE.ShaderMaterial({
      uniforms: beamUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        varying float vT;
        varying vec3 vLocal;
        void main() {
          vT = -position.z;
          vLocal = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uPower;
        uniform float uTime;
        varying float vT;
        varying vec3 vLocal;
        void main() {
          float t = clamp(vT, 0.0, 1.0);
          float fade = smoothstep(0.0, 0.08, t) * pow(1.0 - t, 1.7);
          float dust = 0.78 + 0.22 * sin(vLocal.x * 9.0 + uTime * 0.7) * sin(vLocal.y * 7.0 - uTime * 0.5 + t * 6.0);
          float a = fade * dust * uPower * 0.085;
          gl_FragColor = vec4(uColor * a, a);
        }
      `,
    }),
  );
  beam.frustumCulled = false;
  beam.renderOrder = 8;
  scene.add(beam);
  const dust = dustPoints();
  beam.add(dust.points);

  const light = new THREE.SpotLight("#ffd6a0", 0, RANGE * 1.4, 0.45, 0.6, 1.2);
  scene.add(light, light.target);

  const flies = [];
  for (let i = 0; i < 6; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture(),
        color: "#e8ff7a",
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    sprite.visible = false;
    sprite.renderOrder = 11;
    scene.add(sprite);
    flies.push({ sprite, from: new THREE.Vector3(), ctrl: new THREE.Vector3(), t: 0, active: false });
  }

  const eye = new THREE.Vector3();
  const dir = new THREE.Vector3(0, 0, -1);
  const tip = new THREE.Vector3();
  let cone = 0.45;
  let near = 0;
  let boost = 0;
  let failT = -1;
  let power = 1;
  let clock = 0;

  function litAmount(p, radius = 0.3) {
    if (power < 0.3) return 0;
    toPoint.copy(p).sub(eye);
    const d = toPoint.length();
    if (d > RANGE || d < 0.05) return 0;
    const cos = toPoint.dot(dir) / d;
    const allow = cone + Math.atan(radius / d) * 0.9;
    const k = smoothstep(Math.cos(allow), Math.cos(allow * 0.55), cos);
    return k * Math.min(1, power) * smoothstep(RANGE, RANGE * 0.7, d);
  }

  function addFirefly(from) {
    const f = flies.find((x) => !x.active);
    if (!f) return;
    f.active = true;
    f.t = 0;
    f.from.copy(from);
    f.ctrl.copy(from).lerp(tip, 0.5);
    f.ctrl.y += rand(0.6, 1.1);
    f.sprite.visible = true;
  }

  // head: a cabeça (a lanterna fica presa a ela); origin/direction: o olhar (no computador, o raio do mouse).
  function update(dt, head, origin, direction) {
    clock += dt;
    eye.copy(origin);
    dir.copy(direction).normalize();
    holder.position.copy(head.position);
    holder.quaternion.copy(head.quaternion);
    holder.updateMatrixWorld(true);
    model.position.set(HOLD.x, HOLD.y + Math.sin(clock * 1.7) * 0.006, HOLD.z);
    model.rotation.z = Math.sin(clock * 1.3) * 0.05;
    model.getWorldPosition(tip);

    let base = 1;
    if (failT >= 0) {
      failT += dt;
      base = sampleFailure(failT);
      if (failT > FAILURE[FAILURE.length - 1][0]) failT = -1;
    }
    boost = Math.max(0, boost - dt * 0.6);
    const wobble = 1 - near * 0.22 * (0.5 + 0.5 * Math.sin(clock * TAU * 1.6));
    power = base * wobble + boost;

    // A luz sai da lanterna e mira no ponto olhado, a uns 8 metros.
    aim.copy(eye).addScaledVector(dir, 8);
    light.position.copy(tip);
    light.target.position.copy(aim);
    light.angle = cone;
    light.intensity = 14 * power;
    beam.position.copy(tip);
    tmp.copy(aim).sub(tip).normalize();
    beam.quaternion.setFromUnitVectors(FORWARD, tmp);
    const r = Math.tan(cone) * BEAM;
    beam.scale.set(r, r, BEAM);
    beamUniforms.uPower.value = power;
    dust.uniforms.uPower.value = power;
    glassMat.color.setRGB(1, 0.82, 0.48).multiplyScalar(0.35 + 0.65 * Math.min(1.2, power));
    flame.visible = power > 0.2;
    halo.material.opacity = Math.min(1, 0.65 * power);

    for (const f of flies) {
      if (!f.active) continue;
      f.t += dt / 0.9;
      const k = Math.min(1, f.t);
      const u = 1 - k;
      f.sprite.position.set(
        u * u * f.from.x + 2 * u * k * f.ctrl.x + k * k * tip.x,
        u * u * f.from.y + 2 * u * k * f.ctrl.y + k * k * tip.y,
        u * u * f.from.z + 2 * u * k * f.ctrl.z + k * k * tip.z,
      );
      f.sprite.scale.setScalar(0.11 * (0.7 + 0.3 * Math.sin(clock * 20 + k * 9)));
      if (k >= 1) {
        f.active = false;
        f.sprite.visible = false;
        boost = Math.min(0.45, boost + 0.22);
        onFlare?.();
      }
    }
  }

  return {
    update,
    litAmount,
    addFirefly,
    setCone(angle) {
      cone = angle;
    },
    // Quanto um fantasma está perto (0 a 1): a luz treme devagar.
    setNear(value) {
      near = Math.max(0, Math.min(1, value));
    },
    fail() {
      failT = 0;
    },
    reset() {
      failT = -1;
      boost = 0;
      near = 0;
      for (const f of flies) {
        f.active = false;
        f.sprite.visible = false;
      }
    },
    get failing() {
      return failT >= 0;
    },
    get power() {
      return power;
    },
    get cone() {
      return cone;
    },
    get eye() {
      return eye;
    },
    get dir() {
      return dir;
    },
    get tip() {
      return tip;
    },
  };
}
