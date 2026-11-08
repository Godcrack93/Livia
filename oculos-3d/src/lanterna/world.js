import * as THREE from "three";
import { pointScale } from "../shared/points.js";
import { HIGH } from "../shared/quality.js";
import {
  TAU,
  angleDiff,
  blob,
  canvasTexture,
  clamp01,
  fbm,
  gradient,
  makeCanvas,
  mergeAll,
  noise2,
  paint,
  rand,
  smoothstep,
  xf,
} from "../shared/util.js";

export const time = { value: 0 };
// O sol nasce atrás e à direita de quem começou olhando para a coruja: no fim vale virar para ver.
export const SUNRISE = new THREE.Vector3(0.55, 0.1, 0.83).normalize();
const MOON_YAW = 0.62;
const MOON_PITCH = 0.62;

const NIGHT = {
  zenith: new THREE.Color("#040820"),
  mid: new THREE.Color("#0b1440"),
  horizon: new THREE.Color("#2a2560"),
  fog: new THREE.Color("#0a1030"),
  sky: new THREE.Color("#3b4f9e"),
  line: new THREE.Color("#060a1c"),
};
const DAWN = {
  zenith: new THREE.Color("#4a78c8"),
  mid: new THREE.Color("#a7b4e6"),
  horizon: new THREE.Color("#ffb08a"),
  fog: new THREE.Color("#c4a7c0"),
  sky: new THREE.Color("#ffd6c0"),
  line: new THREE.Color("#2a2140"),
};
const PREDAWN = new THREE.Color("#122058");
const tmpColor = new THREE.Color();
const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const euler = new THREE.Euler();
const pos = new THREE.Vector3();
const scl = new THREE.Vector3();

export function heightAt(x, z) {
  const d = Math.hypot(x, z);
  const bumps = (fbm(x * 0.11 + 5, z * 0.11 - 3, 3) - 0.5) * 0.55;
  return bumps * smoothstep(3, 9, d) + smoothstep(14, 45, d) * 2.4;
}

function moonDir(out, yaw, pitch) {
  return out.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
}

function createSky() {
  const uniforms = {
    uZenith: { value: NIGHT.zenith.clone() },
    uMid: { value: NIGHT.mid.clone() },
    uHorizon: { value: NIGHT.horizon.clone() },
    uMoon: { value: moonDir(new THREE.Vector3(), MOON_YAW, MOON_PITCH) },
    uMoonVis: { value: 1 },
    uSun: { value: SUNRISE },
    uDawn: { value: 0 },
    uTime: time,
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uMoon;
      uniform float uMoonVis;
      uniform vec3 uSun;
      uniform float uDawn;
      uniform float uTime;
      varying vec3 vDir;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.3, h));
        col = mix(col, uZenith, smoothstep(0.25, 0.95, h));
        col = mix(col, uHorizon * 0.55, smoothstep(0.0, -0.25, h));
        float s = max(dot(d, uSun), 0.0);
        col += vec3(1.0, 0.62, 0.38) * pow(s, 6.0) * 0.6 * uDawn;
        vec2 p = d.xz / (h + 0.35);
        float n = vnoise(p * 1.7 + vec2(uTime * 0.012, uTime * 0.004)) * 0.65 + vnoise(p * 4.1 - vec2(uTime * 0.02, 0.0)) * 0.35;
        float cloud = smoothstep(0.55, 0.85, n) * smoothstep(0.02, 0.25, h);
        vec3 cloudCol = mix(vec3(0.07, 0.09, 0.2), vec3(0.95, 0.72, 0.72), uDawn);
        float m = dot(d, uMoon);
        float disc = smoothstep(0.99895, 0.99915, m);
        float halo = pow(max(m, 0.0), 80.0) * 0.5 + pow(max(m, 0.0), 10.0) * 0.12;
        float vis = uMoonVis * (1.0 - cloud * 0.7);
        col += vec3(0.62, 0.7, 1.0) * halo * vis;
        vec2 mp = (d.xy - uMoon.xy) * 420.0;
        vec3 moonCol = vec3(1.0, 0.96, 0.84) * (0.82 + 0.18 * vnoise(mp + 3.0));
        col = mix(col, moonCol, disc * vis);
        col = mix(col, cloudCol, cloud * 0.55);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(190, 48, 24), material);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

function createStars() {
  const count = HIGH ? 900 : 600;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const tints = ["#ffffff", "#cfe0ff", "#fff1c9", "#e6d9ff"];
  for (let i = 0; i < count; i++) {
    const y = rand(0.03, 1);
    const a = rand(0, TAU);
    const r = Math.sqrt(1 - y * y);
    positions[i * 3] = Math.cos(a) * r * 150;
    positions[i * 3 + 1] = y * 150;
    positions[i * 3 + 2] = Math.sin(a) * r * 150;
    sizes[i] = Math.random() < 0.08 ? rand(1.2, 1.6) : rand(0.5, 1.05);
    phases[i] = rand(0, TAU);
    tmpColor.set(tints[i % tints.length]);
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  const uniforms = { uScale: pointScale, uTime: time, uFade: { value: 1 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uScale;
      uniform float uTime;
      attribute float aSize;
      attribute float aPhase;
      attribute vec3 aColor;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.5, aSize * uScale / max(1.0, -mv.z));
        vColor = aColor;
        vAlpha = (0.55 + 0.45 * sin(uTime * (1.2 + fract(aPhase) * 2.0) + aPhase)) * smoothstep(3.0, 20.0, position.y);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uFade;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float a = exp(-dot(p, p) * 4.0) * vAlpha * uFade;
        gl_FragColor = vec4(vColor * a, a);
      }
    `,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = -9;
  return { points, uniforms };
}

function polarGround() {
  const rings = HIGH ? 60 : 48;
  const segs = HIGH ? 120 : 90;
  const rMin = 0.4;
  const rMax = 80;
  const positions = [0, heightAt(0, 0), 0];
  for (let i = 0; i < rings; i++) {
    const r = rMin * Math.pow(rMax / rMin, i / (rings - 1));
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * TAU + (i % 2) * (Math.PI / segs);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      positions.push(x, heightAt(x, z), z);
    }
  }
  const index = [];
  for (let j = 0; j < segs; j++) index.push(0, 1 + ((j + 1) % segs), 1 + j);
  for (let i = 0; i < rings - 1; i++) {
    const a0 = 1 + i * segs;
    const b0 = 1 + (i + 1) * segs;
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs;
      index.push(a0 + j, a0 + j1, b0 + j);
      index.push(a0 + j1, b0 + j1, b0 + j);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const moss = new THREE.Color("#244a3e");
  const mossLight = new THREE.Color("#34604c");
  const floor = new THREE.Color("#152c27");
  const leaves = new THREE.Color("#3b3a2c");
  const c = new THREE.Color();
  const colors = new Float32Array((positions.length / 3) * 3);
  for (let i = 0; i < positions.length / 3; i++) {
    const x = positions[i * 3];
    const z = positions[i * 3 + 2];
    const d = Math.hypot(x, z);
    const n = fbm(x * 0.35, z * 0.35, 3);
    c.copy(moss).lerp(mossLight, smoothstep(0.45, 0.75, n) * 0.7);
    c.lerp(floor, smoothstep(5, 9, d));
    c.lerp(leaves, smoothstep(0.62, 0.8, noise2(x * 0.8 + 7, z * 0.8 - 2)) * 0.45);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

function pineGeo() {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.11, 0.2, 1.3, 7);
  gradient(trunk, "#24181e", "#3f2c31");
  xf(trunk, 0, 0.65, 0);
  parts.push(trunk);
  for (let i = 0; i < 4; i++) {
    const t = i / 4;
    const r = 1.35 - t * 0.85;
    const h = 1.6 - t * 0.35;
    const cone = new THREE.ConeGeometry(r, h, 9, 1);
    gradient(cone, "#0c2422", "#2d5c55");
    xf(cone, 0, 1.05 + i * 0.9 + h / 2, 0, 0, i * 0.45, 0);
    parts.push(cone);
  }
  return mergeAll(parts);
}

function roundGeo() {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.12, 0.22, 1.7, 8);
  gradient(trunk, "#24181e", "#463338");
  xf(trunk, 0, 0.85, 0);
  parts.push(trunk);
  for (let i = 0; i < 4; i++) {
    const r = rand(0.75, 1.05);
    const geo = blob(r, 1, 0.35, i * 7.1);
    gradient(geo, "#102a26", "#2b5a49", 0.9);
    const a = (i / 4) * TAU + rand(-0.3, 0.3);
    const off = i === 0 ? 0 : rand(0.5, 0.8);
    xf(geo, Math.cos(a) * off, 2.3 + (i === 0 ? 0.55 : rand(-0.15, 0.4)), Math.sin(a) * off);
    parts.push(geo);
  }
  return mergeAll(parts);
}

// Árvore seca e torta: dá o arrepio da floresta sem ter "garras" (as pontas são redondas).
function crookedGeo() {
  const parts = [];
  const segs = [
    [0.19, 0.15, 1.2, 0],
    [0.15, 0.11, 1.05, 0.14],
    [0.11, 0.07, 0.95, -0.22],
  ];
  let y = 0;
  let x = 0;
  for (const [r0, r1, h, tilt] of segs) {
    const seg = new THREE.CylinderGeometry(r1, r0, h, 7);
    gradient(seg, "#2a2233", "#4b3f55");
    xf(seg, 0, h / 2, 0);
    xf(seg, x, y, 0, 0, 0, tilt);
    parts.push(seg);
    x += -Math.sin(tilt) * h;
    y += Math.cos(tilt) * h;
  }
  for (const [by, len, a, tilt] of [
    [1.6, 1.0, 0.4, 0.9],
    [2.3, 0.85, 2.6, -0.8],
    [2.7, 0.7, 4.4, 0.75],
  ]) {
    const branch = new THREE.CylinderGeometry(0.03, 0.065, len, 6);
    gradient(branch, "#2a2233", "#4b3f55");
    xf(branch, 0, len / 2, 0);
    xf(branch, 0, 0, 0, 0, 0, tilt);
    xf(branch, x * (by / y), by, 0, 0, a, 0);
    parts.push(branch);
    const tip = new THREE.SphereGeometry(0.045, 6, 4);
    paint(tip, "#4b3f55");
    xf(tip, -Math.sin(tilt) * len, Math.cos(tilt) * len, 0);
    xf(tip, x * (by / y), by, 0, 0, a, 0);
    parts.push(tip);
  }
  return mergeAll(parts);
}

function plantTrees(scene) {
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  const builders = [
    { geo: pineGeo(), weight: 0.5 },
    { geo: roundGeo(), weight: 0.33 },
    { geo: crookedGeo(), weight: 0.17 },
  ];
  const total = HIGH ? 96 : 66;
  const spots = [];
  let tries = 0;
  while (spots.length < total && tries++ < 5000) {
    const r = 7.4 + Math.pow(Math.random(), 1.4) * 28;
    const a = rand(0, TAU);
    // Janela na mata para a lua aparecer.
    if (r < 22 && Math.abs(angleDiff(a, MOON_YAW)) < 0.32) continue;
    const x = -Math.sin(a) * r;
    const z = -Math.cos(a) * r;
    const min = r < 11 ? 2.6 : 2.1;
    if (spots.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < min * min)) continue;
    let roll = Math.random();
    let type = 0;
    while (type < builders.length - 1 && roll > builders[type].weight) {
      roll -= builders[type].weight;
      type++;
    }
    spots.push({ x, z, r, a, type, s: rand(0.85, 1.35) * (r < 11 ? 0.92 : 1) });
  }
  const near = [];
  builders.forEach((b, type) => {
    const list = spots.filter((p) => p.type === type);
    const mesh = new THREE.InstancedMesh(b.geo, material, Math.max(1, list.length));
    mesh.count = list.length;
    list.forEach((p, i) => {
      euler.set(rand(-0.04, 0.04), rand(0, TAU), rand(-0.04, 0.04));
      q.setFromEuler(euler);
      m4.compose(pos.set(p.x, heightAt(p.x, p.z) - 0.05, p.z), q, scl.set(p.s, p.s * rand(0.92, 1.15), p.s));
      mesh.setMatrixAt(i, m4);
      if (p.r < 10.8) near.push({ x: p.x, z: p.z, a: p.a, r: p.r, trunk: 0.2 * p.s });
    });
    mesh.computeBoundingSphere();
    scene.add(mesh);
  });
  return near;
}

function treelineTexture() {
  const canvas = makeCanvas(2048, 256);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  const shapes = [];
  for (let x = -30; x < 2048; x += rand(24, 58)) shapes.push({ x, h: rand(70, 200), pine: Math.random() < 0.62 });
  for (const { x: x0, h, pine } of shapes) {
    for (const x of [x0 - 2048, x0, x0 + 2048]) {
      if (x < -80 || x > 2128) continue;
      if (pine) {
        for (let k = 0; k < 4; k++) {
          const w = (46 - k * 9) * (h / 150);
          const top = 256 - h + k * h * 0.2;
          ctx.beginPath();
          ctx.moveTo(x - w, top + h * 0.36);
          ctx.lineTo(x, top);
          ctx.lineTo(x + w, top + h * 0.36);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillRect(x - 5, 256 - h * 0.5, 10, h * 0.5);
      } else {
        const r = h * 0.26;
        ctx.beginPath();
        ctx.arc(x, 256 - h + r, r, 0, TAU);
        ctx.arc(x - r * 0.7, 256 - h + r * 1.6, r * 0.8, 0, TAU);
        ctx.arc(x + r * 0.7, 256 - h + r * 1.5, r * 0.85, 0, TAU);
        ctx.fill();
        ctx.fillRect(x - 6, 256 - h * 0.45, 12, h * 0.45);
      }
    }
  }
  ctx.fillRect(0, 220, 2048, 36);
  const texture = canvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(3, 1);
  return texture;
}

function decorations() {
  const parts = [];
  const stumpY = heightAt(0, -3.6);
  const stump = new THREE.CylinderGeometry(0.34, 0.44, 1.0, 12);
  gradient(stump, "#2b1e24", "#4a353a");
  xf(stump, 0, stumpY + 0.5, -3.6);
  parts.push(stump);
  const cut = new THREE.CylinderGeometry(0.33, 0.33, 0.03, 12);
  paint(cut, "#8a6a52");
  xf(cut, 0, stumpY + 1.0, -3.6);
  parts.push(cut);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    const root = new THREE.ConeGeometry(0.12, 0.5, 6);
    gradient(root, "#2b1e24", "#3a2a30");
    xf(root, 0, 0.25, 0, 0, 0, 1.1);
    xf(root, Math.cos(a) * 0.36, stumpY, -3.6 + Math.sin(a) * 0.36, 0, -a, 0);
    parts.push(root);
  }
  const log = new THREE.CylinderGeometry(0.22, 0.26, 2.3, 10);
  gradient(log, "#2b1e24", "#45323a");
  xf(log, 0, 0, 0, 0, 0, Math.PI / 2);
  xf(log, 2.6, heightAt(2.6, -2.1) + 0.2, -2.1, 0, 0.7, 0);
  parts.push(log);
  for (let i = 0; i < 7; i++) {
    const a = rand(0, TAU);
    const r = rand(3, 6.4);
    const x = -Math.sin(a) * r;
    const z = -Math.cos(a) * r;
    const s = rand(0.18, 0.42);
    const rock = new THREE.DodecahedronGeometry(s, 0);
    const p = rock.attributes.position;
    for (let k = 0; k < p.count; k++) p.setY(k, p.getY(k) * 0.6);
    rock.computeVertexNormals();
    gradient(rock, "#2e3350", "#585f82");
    xf(rock, x, heightAt(x, z) + s * 0.15, z, rand(0, 1), rand(0, TAU), 0);
    parts.push(rock);
  }
  for (let i = 0; i < 9; i++) {
    const a = rand(0, TAU);
    const r = rand(4.6, 7);
    const x = -Math.sin(a) * r;
    const z = -Math.cos(a) * r;
    for (let k = 0; k < 3; k++) {
      const geo = blob(rand(0.32, 0.5), 1, 0.4, i * 3 + k);
      gradient(geo, "#0f2a24", "#24513f");
      xf(geo, x + rand(-0.4, 0.4), heightAt(x, z) + 0.22, z + rand(-0.4, 0.4), 0, 0, 0, 1, 0.75, 1);
      parts.push(geo);
    }
  }
  return {
    mesh: new THREE.Mesh(mergeAll(parts), new THREE.MeshLambertMaterial({ vertexColors: true })),
    perch: new THREE.Vector3(0, stumpY + 1.02, -3.6),
  };
}

function mushrooms() {
  const parts = [];
  const glows = [];
  const caps = ["#5cf2e6", "#ff7ad9", "#b197fc"];
  const n = HIGH ? 18 : 12;
  let made = 0;
  let tries = 0;
  while (made < n && tries++ < 400) {
    const a = rand(0, TAU);
    const r = rand(2.4, 6.6);
    const x = -Math.sin(a) * r;
    const z = -Math.cos(a) * r;
    if (Math.hypot(x, z + 3.6) < 0.9 || Math.hypot(x, z + 0.8) < 1.3) continue;
    made++;
    const color = caps[made % caps.length];
    const k = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < k; i++) {
      const mx = x + rand(-0.25, 0.25);
      const mz = z + rand(-0.25, 0.25);
      const s = rand(0.7, 1.3) * (i === 0 ? 1.2 : 0.8);
      const y = heightAt(mx, mz);
      const stem = new THREE.CylinderGeometry(0.03 * s, 0.045 * s, 0.16 * s, 6);
      paint(stem, "#cfeff0");
      xf(stem, mx, y + 0.08 * s, mz);
      const cap = new THREE.SphereGeometry(0.1 * s, 10, 6, 0, TAU, 0, Math.PI / 2);
      paint(cap, color);
      xf(cap, mx, y + 0.15 * s, mz, 0, 0, 0, 1, 0.7, 1);
      parts.push(stem, cap);
      for (let d = 0; d < 3; d++) {
        const dot = new THREE.SphereGeometry(0.014 * s, 5, 4);
        paint(dot, "#ffffff");
        const da = (d / 3) * TAU + i;
        xf(dot, mx + Math.cos(da) * 0.05 * s, y + 0.2 * s, mz + Math.sin(da) * 0.05 * s);
        parts.push(dot);
      }
      glows.push({ x: mx, y: y + 0.18 * s, z: mz, color, size: 0.42 * s });
    }
  }
  const mesh = new THREE.Mesh(mergeAll(parts), new THREE.MeshBasicMaterial({ vertexColors: true }));
  return { mesh, glows };
}

// Brilhos fixos (cogumelos) e vaga-lumes num desenho só, com o piscar feito no shader.
function glowPoints(list, moving) {
  const count = list.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  list.forEach((g, i) => {
    positions[i * 3] = g.x;
    positions[i * 3 + 1] = g.y;
    positions[i * 3 + 2] = g.z;
    tmpColor.set(g.color);
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
    sizes[i] = g.size;
    phases[i] = rand(0, TAU);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  const uniforms = { uScale: pointScale, uTime: time, uFade: { value: 1 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    defines: moving ? { MOVING: "" } : {},
    vertexShader: /* glsl */ `
      uniform float uScale;
      uniform float uTime;
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        #ifdef MOVING
          p += vec3(sin(uTime * 0.31 + aPhase) * 0.9, sin(uTime * 0.47 + aPhase * 1.7) * 0.35, cos(uTime * 0.27 + aPhase * 0.6) * 0.9);
          vAlpha = pow(max(0.0, sin(uTime * (0.9 + fract(aPhase) * 0.8) + aPhase)), 6.0);
        #else
          vAlpha = 0.28 + 0.1 * sin(uTime * 1.3 + aPhase);
        #endif
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uScale / max(0.1, -mv.z);
        vColor = aColor;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uFade;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = dot(p, p);
        #ifdef MOVING
          float a = (exp(-r * 9.0) + exp(-r * 2.2) * 0.35) * vAlpha * uFade;
        #else
          float a = exp(-r * 3.0) * vAlpha * uFade;
        #endif
        gl_FragColor = vec4(vColor * a, a);
      }
    `,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 5;
  return { points, uniforms };
}

// Para mudar o clima da noite (nuvem na lua, amanhecer...): setCover, setDawn e setProgress.
export function createForest() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(NIGHT.fog.clone(), 6.5, 34);

  const sky = createSky();
  scene.add(sky.mesh);
  const stars = createStars();
  scene.add(stars.points);
  scene.add(polarGround());
  const nearTrees = plantTrees(scene);

  const lineMat = new THREE.MeshBasicMaterial({
    map: treelineTexture(),
    color: NIGHT.line.clone(),
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const treeline = new THREE.Mesh(new THREE.CylinderGeometry(52, 52, 24, 64, 1, true), lineMat);
  treeline.position.y = 9;
  treeline.renderOrder = -8;
  scene.add(treeline);

  const deco = decorations();
  scene.add(deco.mesh);
  const shrooms = mushrooms();
  scene.add(shrooms.mesh);
  const shroomGlow = glowPoints(shrooms.glows, false);
  scene.add(shroomGlow.points);
  const flies = [];
  for (let i = 0; i < (HIGH ? 40 : 24); i++) {
    const a = rand(0, TAU);
    const r = rand(1.8, 9);
    flies.push({ x: -Math.sin(a) * r, y: rand(0.4, 2.6), z: -Math.cos(a) * r, color: "#e8ff7a", size: rand(0.08, 0.12) });
  }
  const fireflies = glowPoints(flies, true);
  scene.add(fireflies.points);

  const hemi = new THREE.HemisphereLight(NIGHT.sky.clone(), new THREE.Color("#0b1124"), 0.85);
  const moonLight = new THREE.DirectionalLight("#a9bcff", 0.8);
  const sunLight = new THREE.DirectionalLight("#ffb27a", 0);
  sunLight.position.copy(SUNRISE).multiplyScalar(50);
  scene.add(hemi, moonLight, moonLight.target, sunLight, sunLight.target);

  let cover = 0;
  let coverTarget = 0;
  let dawn = 0;
  let dawnTarget = 0;
  let moonFactor = 1;
  let progress = 0;

  function update(dt) {
    time.value += dt;
    cover += (coverTarget - cover) * Math.min(1, dt * 0.8);
    dawn += (dawnTarget - dawn) * Math.min(1, dt * 0.35);
    if (dawnTarget === 0 && dawn < 0.001) dawn = 0;
    const pre = smoothstep(0.72, 1, progress) * 0.4;
    const u = sky.uniforms;
    u.uZenith.value.copy(NIGHT.zenith).lerp(PREDAWN, pre).lerp(DAWN.zenith, dawn);
    u.uMid.value.copy(NIGHT.mid).lerp(PREDAWN, pre * 0.6).lerp(DAWN.mid, dawn);
    u.uHorizon.value.copy(NIGHT.horizon).lerp(DAWN.horizon, dawn);
    u.uDawn.value = dawn;
    moonDir(u.uMoon.value, MOON_YAW + progress * 0.12, MOON_PITCH - progress * 0.14);
    u.uMoonVis.value = Math.min(1.2, moonFactor) * (1 - cover * 0.8) * (1 - dawn * 0.75);
    moonLight.position.copy(u.uMoon.value).multiplyScalar(50);
    const night = moonFactor * (1 - cover * 0.45);
    hemi.intensity = THREE.MathUtils.lerp(1.05 * night, 1.7, dawn);
    hemi.color.copy(NIGHT.sky).lerp(DAWN.sky, dawn);
    moonLight.intensity = 0.95 * moonFactor * (1 - cover * 0.6) * (1 - dawn);
    sunLight.intensity = 1.5 * dawn;
    scene.fog.color.copy(NIGHT.fog).lerp(PREDAWN, pre * 0.3).lerp(DAWN.fog, dawn);
    scene.fog.near = THREE.MathUtils.lerp(6.5, 12, dawn);
    scene.fog.far = THREE.MathUtils.lerp(34 + moonFactor * 4, 75, dawn);
    lineMat.color.copy(NIGHT.line).lerp(DAWN.line, dawn);
    stars.uniforms.uFade.value = 1 - dawn;
    fireflies.uniforms.uFade.value = 1 - dawn;
    shroomGlow.uniforms.uFade.value = 1 - dawn * 0.8;
  }

  return {
    scene,
    heightAt,
    nearTrees,
    perch: deco.perch,
    update,
    // Nuvem passando na frente da lua (0 = lua limpa, 1 = coberta).
    setCover(value) {
      coverTarget = clamp01(value);
    },
    setDawn(value, instant = false) {
      dawnTarget = clamp01(value);
      if (instant) dawn = dawnTarget;
    },
    setMoon(value) {
      moonFactor = value;
    },
    // Avanço da noite (0 a 1): a lua desce e o céu clareia um pouquinho perto do fim.
    setProgress(value) {
      progress = clamp01(value);
    },
    get dawn() {
      return dawn;
    },
  };
}
