import * as THREE from "three";
import { HIGH } from "../shared/quality.js";
import { TAU, blob, clamp01, fbm, gradient, mergeAll, noise2, paint, rand, smoothstep, xf } from "../shared/util.js";

export const SUN = new THREE.Vector3(0.55, 0.36, 0.75).normalize();
export const LAKE = { x: -17, z: 14, r: 8.5 };
export const WATER = -0.3;
export const time = { value: 0 };

export const palette = {
  zenith: new THREE.Color("#3f8fe0"),
  mid: new THREE.Color("#93cdf6"),
  horizon: new THREE.Color("#ffdcb8"),
  ground: new THREE.Color("#7aa35a"),
  sun: new THREE.Color("#ffc98a"),
};
const party = {
  zenith: new THREE.Color("#6150d8"),
  mid: new THREE.Color("#c99cf0"),
  horizon: new THREE.Color("#ffb3cf"),
};
const fogDay = new THREE.Color("#f3d9bf");
const fogParty = new THREE.Color("#f1c0d6");

export function heightAt(x, z) {
  const d = Math.hypot(x, z);
  const meadow = (fbm(x * 0.12 + 3, z * 0.12 - 7, 2) - 0.5) * 0.35;
  const amp = smoothstep(10, 60, d);
  const hills = fbm(x * 0.025 + 11, z * 0.025 + 5, 4);
  let h = meadow + (hills - 0.35) * amp * 18 + amp * 3;
  const ld = Math.hypot(x - LAKE.x, z - LAKE.z) / LAKE.r;
  if (ld < 1.8) {
    const bowl = WATER - 0.9 + ld * ld * 0.9;
    h += (bowl - h) * smoothstep(1.8, 0.9, ld);
  }
  return h * smoothstep(1.6, 3.6, d);
}

// Para trocar o clima do céu (festa, susto, etc.): estenda mood e flash.
function createSky() {
  const uniforms = {
    uZenith: { value: palette.zenith.clone() },
    uMid: { value: palette.mid.clone() },
    uHorizon: { value: palette.horizon.clone() },
    uSunColor: { value: palette.sun.clone() },
    uSun: { value: SUN },
    uFlash: { value: new THREE.Color(0, 0, 0) },
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
      uniform vec3 uSunColor;
      uniform vec3 uSun;
      uniform vec3 uFlash;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.28, h));
        col = mix(col, uZenith, smoothstep(0.22, 0.95, h));
        col = mix(col, uHorizon * 0.9, smoothstep(0.0, -0.2, h));
        float s = max(dot(d, uSun), 0.0);
        col += uSunColor * (pow(s, 5.0) * 0.28 + pow(s, 60.0) * 0.7);
        col += vec3(1.0, 0.97, 0.88) * smoothstep(0.9991, 0.9996, s) * 1.6;
        col += uFlash * (0.5 + 0.5 * max(h, 0.0));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), material);
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  return { mesh: sky, uniforms };
}

function polarTerrain() {
  const rings = 72;
  const segs = 132;
  const rMin = 0.5;
  const rMax = 190;
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

  const dark = new THREE.Color("#4f9a38");
  const mid = new THREE.Color("#79c044");
  const light = new THREE.Color("#b8dd60");
  const hill = new THREE.Color("#c9d86a");
  const sand = new THREE.Color("#e8d39c");
  const wet = new THREE.Color("#6f9f86");
  const c = new THREE.Color();
  const colors = new Float32Array((positions.length / 3) * 3);
  for (let i = 0; i < positions.length / 3; i++) {
    const x = positions[i * 3];
    const h = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const n = fbm(x * 0.07, z * 0.07, 3);
    const n2 = noise2(x * 0.45 + 9, z * 0.45 - 4);
    c.copy(dark).lerp(mid, clamp01(n * 1.6 - 0.2));
    c.lerp(light, smoothstep(0.55, 0.85, n2) * 0.45);
    c.lerp(hill, smoothstep(3, 12, h) * 0.55);
    c.lerp(sand, smoothstep(WATER + 0.4, WATER + 0.08, h));
    c.lerp(wet, smoothstep(WATER - 0.05, WATER - 0.7, h));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.receiveShadow = HIGH;
  return mesh;
}

function createWater() {
  const uniforms = {
    uTime: time,
    uSun: { value: SUN },
    uSky: { value: palette.mid },
    uHorizon: { value: palette.horizon },
    uCenter: { value: new THREE.Vector2(LAKE.x, LAKE.z) },
    uRadius: { value: LAKE.r },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uSun;
      uniform vec3 uSky;
      uniform vec3 uHorizon;
      uniform vec2 uCenter;
      uniform float uRadius;
      varying vec3 vWorld;
      void main() {
        vec2 p = vWorld.xz;
        vec3 V = normalize(cameraPosition - vWorld);
        float wx = cos(p.x * 1.4 + uTime * 1.2) + 0.6 * cos((p.x + p.y) * 2.6 + uTime * 1.9);
        float wz = cos(p.y * 1.7 - uTime * 0.9) + 0.6 * cos((p.x - p.y) * 2.2 - uTime * 1.5);
        vec3 N = normalize(vec3(wx * 0.045, 1.0, wz * 0.045));
        vec3 R = reflect(-V, N);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        vec3 sky = mix(uHorizon, uSky, clamp(R.y * 1.6, 0.0, 1.0));
        float sun = pow(max(dot(R, uSun), 0.0), 180.0) * 3.5;
        float edge = length(p - uCenter) / uRadius;
        vec3 deep = vec3(0.08, 0.38, 0.5);
        vec3 shallow = vec3(0.35, 0.75, 0.72);
        vec3 col = mix(deep, shallow, smoothstep(0.4, 1.05, edge));
        col = mix(col, sky, 0.3 + fres * 0.6) + sun;
        float rim = smoothstep(1.12, 0.98, edge);
        float alpha = mix(0.55, 0.92, fres) * rim + sun;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(LAKE.r * 1.25, 64), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(LAKE.x, WATER, LAKE.z);
  mesh.renderOrder = 1;
  return mesh;
}

function lilyPads() {
  const parts = [];
  for (let i = 0; i < 9; i++) {
    const a = rand(0, TAU);
    const r = rand(1.5, LAKE.r * 0.85);
    const x = LAKE.x + Math.cos(a) * r;
    const z = LAKE.z + Math.sin(a) * r;
    const s = rand(0.35, 0.6);
    const pad = new THREE.CylinderGeometry(s, s, 0.03, 16, 1, false, 0.3, TAU - 0.6);
    paint(pad, i % 2 ? "#4c9a3a" : "#5fae45");
    xf(pad, x, WATER + 0.02, z, 0, rand(0, TAU), 0);
    parts.push(pad);
    if (i % 3 === 0) {
      for (let k = 0; k < 6; k++) {
        const petal = new THREE.SphereGeometry(0.1, 8, 6);
        paint(petal, "#ff9ccc");
        xf(petal, 0, 0.06, 0.1, 0.6, 0, 0, 0.6, 0.35, 1.3);
        xf(petal, x, WATER + 0.03, z, 0, (k / 6) * TAU, 0);
        parts.push(petal);
      }
      const center = new THREE.SphereGeometry(0.06, 8, 6);
      paint(center, "#ffe066");
      xf(center, x, WATER + 0.1, z);
      parts.push(center);
    }
  }
  return parts;
}

function mountains() {
  const parts = [];
  const base = new THREE.Color("#6f9a7c");
  const midC = new THREE.Color("#8d88bd");
  const snow = new THREE.Color("#ffffff");
  const c = new THREE.Color();
  const count = 24;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + rand(-0.1, 0.1);
    const r = rand(125, 160);
    const height = rand(28, 62);
    const radius = rand(28, 44);
    let geo = new THREE.ConeGeometry(radius, height, 10, 5);
    geo = geo.toNonIndexed();
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let k = 0; k < pos.count; k++) {
      const x = pos.getX(k);
      const y = pos.getY(k);
      const z = pos.getZ(k);
      const t = (y + height / 2) / height;
      const n = noise2(x * 0.08 + i * 5, z * 0.08 + y * 0.05);
      const bump = t < 0.98 ? (n - 0.5) * radius * 0.35 * (1 - t) : 0;
      pos.setXYZ(k, x + bump, y + (n - 0.5) * 4 * (1 - t), z + bump * 0.6);
      c.copy(base).lerp(midC, smoothstep(0.1, 0.6, t));
      if (height > 40) c.lerp(snow, smoothstep(0.68, 0.8, t + (n - 0.5) * 0.12));
      colors[k * 3] = c.r;
      colors[k * 3 + 1] = c.g;
      colors[k * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    xf(geo, x, heightAt(x, z) + height / 2 - 4, z, 0, rand(0, TAU), 0);
    parts.push(geo);
  }
  const mesh = new THREE.Mesh(
    mergeAll(parts),
    new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
  );
  return mesh;
}

function clouds() {
  const group = new THREE.Group();
  const parts = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + rand(-0.2, 0.2);
    const r = rand(85, 125);
    const cx = Math.cos(a) * r;
    const cz = Math.sin(a) * r;
    const cy = rand(26, 44);
    const s = rand(4, 7.5);
    const puffs = 5 + Math.floor(rand(0, 4));
    for (let k = 0; k < puffs; k++) {
      const pr = s * rand(0.55, 1.05) * (1 - Math.abs(k - puffs / 2) / puffs);
      const geo = blob(pr, 1, 0.25, i * 13 + k);
      gradient(geo, "#f2d4cf", "#ffffff", 0.7);
      xf(geo, (k - puffs / 2) * s * 0.75, rand(-0.3, 0.6) * s * 0.4, rand(-0.5, 0.5) * s, 0, 0, 0, 1, 0.72, 1);
      xf(geo, cx, cy, cz, 0, -a + Math.PI / 2, 0);
      parts.push(geo);
    }
  }
  const mesh = new THREE.Mesh(
    mergeAll(parts),
    new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x8a7f86, fog: false }),
  );
  group.add(mesh);
  return group;
}

function deck() {
  const parts = [];
  const R = 1.25;
  const woods = ["#c98b55", "#b97a48", "#d69a62", "#c48450"];
  for (let i = -5; i <= 5; i++) {
    const x = i * 0.23;
    const len = 2 * Math.sqrt(Math.max(0.01, R * R - x * x));
    const plank = new THREE.BoxGeometry(0.21, 0.07, len);
    paint(plank, woods[(i + 5) % woods.length]);
    xf(plank, x, 0.07, 0);
    parts.push(plank);
  }
  const rim = new THREE.TorusGeometry(R + 0.02, 0.07, 8, 48);
  paint(rim, "#8a5a36");
  xf(rim, 0, 0.09, 0, Math.PI / 2, 0, 0);
  parts.push(rim);
  const under = new THREE.CylinderGeometry(R, R * 1.05, 0.12, 32);
  paint(under, "#7a4e2e");
  xf(under, 0, 0.0, 0);
  parts.push(under);

  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.4;
    const r = rand(1.65, 2.3);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const s = rand(0.6, 1.1);
    const stem = new THREE.CylinderGeometry(0.05 * s, 0.07 * s, 0.22 * s, 10);
    paint(stem, "#fff4e0");
    xf(stem, x, 0.11 * s, z);
    const cap = new THREE.SphereGeometry(0.15 * s, 14, 8, 0, TAU, 0, Math.PI / 2);
    paint(cap, i % 2 ? "#ff5a5f" : "#ff7f50");
    xf(cap, x, 0.2 * s, z, 0, 0, 0, 1, 0.75, 1);
    parts.push(stem, cap);
    for (let k = 0; k < 4; k++) {
      const dot = new THREE.SphereGeometry(0.025 * s, 6, 4);
      paint(dot, "#ffffff");
      const da = (k / 4) * TAU + i;
      xf(dot, x + Math.cos(da) * 0.09 * s, 0.27 * s, z + Math.sin(da) * 0.09 * s, 0, 0, 0, 1, 0.5, 1);
      parts.push(dot);
    }
  }
  const mesh = new THREE.Mesh(mergeAll(parts), new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.receiveShadow = HIGH;
  mesh.castShadow = HIGH;
  return mesh;
}

export function createWorld() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(fogDay.clone(), 40, 260);

  const sky = createSky();
  scene.add(sky.mesh);
  scene.add(polarTerrain());
  scene.add(createWater());
  scene.add(mountains());
  const cloudGroup = clouds();
  scene.add(cloudGroup);
  scene.add(deck());

  const pads = new THREE.Mesh(mergeAll(lilyPads()), new THREE.MeshLambertMaterial({ vertexColors: true }));
  scene.add(pads);

  const hemi = new THREE.HemisphereLight(0xd4ebff, 0x86a860, 1.35);
  const sun = new THREE.DirectionalLight(0xffe2bc, 2.4);
  sun.position.copy(SUN).multiplyScalar(60);
  if (HIGH) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const cam = sun.shadow.camera;
    cam.left = -34;
    cam.right = 34;
    cam.top = 34;
    cam.bottom = -34;
    cam.near = 5;
    cam.far = 140;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
  }
  scene.add(hemi, sun, sun.target);

  let mood = 0;
  let moodTarget = 0;
  const flash = new THREE.Color();

  function setMood(value) {
    moodTarget = value;
  }

  function pulse(color, strength = 0.5) {
    flash.set(color).multiplyScalar(strength);
  }

  function update(dt) {
    time.value += dt;
    cloudGroup.rotation.y += dt * 0.004;
    mood += (moodTarget - mood) * Math.min(1, dt * 1.5);
    const u = sky.uniforms;
    u.uZenith.value.copy(palette.zenith).lerp(party.zenith, mood);
    u.uMid.value.copy(palette.mid).lerp(party.mid, mood);
    u.uHorizon.value.copy(palette.horizon).lerp(party.horizon, mood);
    scene.fog.color.copy(fogDay).lerp(fogParty, mood);
    flash.multiplyScalar(Math.max(0, 1 - dt * 3.5));
    u.uFlash.value.copy(flash);
  }

  return { scene, update, setMood, pulse };
}
