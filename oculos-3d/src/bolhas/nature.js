import * as THREE from "three";
import { pointScale } from "../shared/points.js";
import { HIGH } from "../shared/quality.js";
import { TAU, blob, canvasTexture, gradient, makeCanvas, mergeAll, paint, rand, setFloat, xf } from "../shared/util.js";
import { LAKE, WATER, heightAt, time } from "./world.js";

// Balanço do vento no vertex shader; "attr" escolhe quanto cada vértice balança.
function windy(material, amount, { attr = null, freq = 0.35 } = {}) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;\n${attr ? `attribute float ${attr};` : ""}`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float sway = ${attr ? attr : "position.y * position.y"};
        vec3 base = position;
        #ifdef USE_INSTANCING
          base = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #endif
        float w = sin(uTime * 1.6 + base.x * ${freq.toFixed(3)} + base.z * ${(freq * 0.7).toFixed(3)})
          + 0.45 * sin(uTime * 2.9 + base.x * ${(freq * 2.3).toFixed(3)} - base.z * ${(freq * 1.6).toFixed(3)});
        transformed.x += w * ${amount.toFixed(3)} * sway;
        transformed.z += w * ${(amount * 0.6).toFixed(3)} * sway;`,
      );
  };
  return material;
}

function nearLake(x, z, margin) {
  return Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + margin;
}

function puffyTree(x, z, s, kind, detail) {
  const parts = [];
  const y0 = heightAt(x, z) - 0.1;
  const trunkH = rand(1.4, 2.0) * s;
  const trunk = new THREE.CylinderGeometry(0.12 * s, 0.22 * s, trunkH, 8);
  gradient(trunk, "#6b4429", "#9a6a43");
  xf(trunk, 0, trunkH / 2, 0);
  setFloat(trunk, "aSway", 0);
  parts.push(trunk);
  const colors = {
    green: ["#3f8a3a", "#9ad25a"],
    blossom: ["#d8709f", "#ffd3e8"],
    gold: ["#d99a2b", "#ffe17a"],
  }[kind];
  const blobs = 4 + Math.floor(rand(0, 3));
  for (let i = 0; i < blobs; i++) {
    const r = rand(0.75, 1.15) * s;
    const geo = blob(r, detail, 0.35, x + z + i);
    gradient(geo, colors[0], colors[1], 0.9);
    const a = (i / blobs) * TAU + rand(-0.3, 0.3);
    const off = i === 0 ? 0 : rand(0.5, 0.85) * s;
    const yy = trunkH + 0.55 * s + (i === 0 ? 0.55 * s : rand(-0.2, 0.45) * s);
    xf(geo, Math.cos(a) * off, yy, Math.sin(a) * off);
    setFloat(geo, "aSway", 0.6 + yy / (trunkH + 2 * s) * 0.4);
    parts.push(geo);
  }
  if (kind === "green" && Math.random() < 0.5) {
    for (let i = 0; i < 9; i++) {
      const fruit = new THREE.SphereGeometry(0.11 * s, 8, 6);
      paint(fruit, Math.random() < 0.5 ? "#ff4d4d" : "#ff8c1a");
      const a = rand(0, TAU);
      const yy = trunkH + rand(0.2, 1.3) * s;
      const rr = rand(0.95, 1.25) * s;
      xf(fruit, Math.cos(a) * rr, yy, Math.sin(a) * rr);
      setFloat(fruit, "aSway", 0.8);
      parts.push(fruit);
    }
  }
  for (const p of parts) xf(p, x, y0, z);
  return parts;
}

function pineTree(x, z, s) {
  const parts = [];
  const y0 = heightAt(x, z) - 0.1;
  const trunk = new THREE.CylinderGeometry(0.1 * s, 0.18 * s, 1.2 * s, 7);
  gradient(trunk, "#5a3a24", "#8a5c3a");
  xf(trunk, 0, 0.6 * s, 0);
  setFloat(trunk, "aSway", 0);
  parts.push(trunk);
  const layers = 4;
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const r = (1.25 - t * 0.8) * s;
    const h = (1.5 - t * 0.4) * s;
    const cone = new THREE.ConeGeometry(r, h, 9, 1);
    gradient(cone, "#24614a", "#5fae6e");
    xf(cone, 0, (1.0 + i * 0.85) * s + h / 2, 0, 0, i * 0.5, 0);
    setFloat(cone, "aSway", 0.3 + t * 0.7);
    parts.push(cone);
  }
  for (const p of parts) xf(p, x, y0, z);
  return parts;
}

function bush(x, z, s) {
  const parts = [];
  const y0 = heightAt(x, z);
  for (let i = 0; i < 3; i++) {
    const geo = blob(rand(0.35, 0.55) * s, 1, 0.4, x * 3 + i);
    gradient(geo, "#3d8a36", "#8fcf55");
    xf(geo, rand(-0.4, 0.4) * s, 0.25 * s, rand(-0.4, 0.4) * s, 0, 0, 0, 1, 0.8, 1);
    setFloat(geo, "aSway", 0.25);
    parts.push(geo);
  }
  const flower = ["#ff7eb6", "#ffffff", "#ffd84d", "#b28dff"][Math.floor(rand(0, 4))];
  for (let i = 0; i < 6; i++) {
    const dot = new THREE.SphereGeometry(0.06 * s, 6, 4);
    paint(dot, flower);
    const a = rand(0, TAU);
    xf(dot, Math.cos(a) * 0.45 * s, rand(0.25, 0.6) * s, Math.sin(a) * 0.45 * s);
    setFloat(dot, "aSway", 0.25);
    parts.push(dot);
  }
  for (const p of parts) xf(p, x, y0, z);
  return parts;
}

function rock(x, z, s) {
  const geo = new THREE.DodecahedronGeometry(s, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) * 0.6);
  geo.computeVertexNormals();
  gradient(geo, "#8a8597", "#c9c4d6");
  xf(geo, x, heightAt(x, z) + s * 0.15, z, rand(0, 1), rand(0, TAU), 0);
  setFloat(geo, "aSway", 0);
  return geo;
}

function createTrees() {
  const parts = [];
  let placed = 0;
  let guard = 0;
  while (placed < 38 && guard++ < 400) {
    const a = rand(0, TAU);
    const r = rand(15, 52);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (nearLake(x, z, 3)) continue;
    const s = rand(0.9, 1.5) * (r > 30 ? 1.3 : 1);
    const detail = r < 26 && HIGH ? 2 : 1;
    const roll = Math.random();
    if (roll < 0.25) parts.push(...pineTree(x, z, s));
    else if (roll < 0.45) parts.push(...puffyTree(x, z, s, "blossom", detail));
    else if (roll < 0.55) parts.push(...puffyTree(x, z, s, "gold", detail));
    else parts.push(...puffyTree(x, z, s, "green", detail));
    placed++;
  }
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU + rand(-0.1, 0.1);
    const r = rand(10.5, 14);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (nearLake(x, z, 1)) continue;
    parts.push(...bush(x, z, rand(0.8, 1.4)));
  }
  for (let i = 0; i < 14; i++) {
    const a = rand(0, TAU);
    const r = i < 6 ? LAKE.r + rand(0.3, 1.2) : rand(9, 30);
    const x = i < 6 ? LAKE.x + Math.cos(a) * r : Math.cos(a) * r;
    const z = i < 6 ? LAKE.z + Math.sin(a) * r : Math.sin(a) * r;
    parts.push(rock(x, z, rand(0.25, 0.7)));
  }
  const material = windy(new THREE.MeshLambertMaterial({ vertexColors: true }), 0.06, { attr: "aSway", freq: 0.08 });
  const mesh = new THREE.Mesh(mergeAll(parts, ["position", "normal", "color", "aSway"]), material);
  mesh.castShadow = HIGH;
  mesh.receiveShadow = HIGH;
  return mesh;
}

function bladeGeometry() {
  const segs = 3;
  const positions = [];
  const colors = [];
  const base = new THREE.Color("#3a7a2a");
  const tip = new THREE.Color("#c2e46a");
  const c = new THREE.Color();
  for (let i = 0; i < segs; i++) {
    const y = i / segs;
    const w = 0.022 * Math.pow(1 - y, 0.7);
    const bend = y * y * 0.22;
    positions.push(-w, y, bend, w, y, bend);
    c.copy(base).lerp(tip, y);
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
  }
  positions.push(0, 1, 0.22);
  colors.push(tip.r, tip.g, tip.b);
  const index = [];
  for (let i = 0; i < segs - 1; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const top = segs * 2;
  index.push(top - 2, top - 1, top);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const normals = [];
  for (let i = 0; i < positions.length / 3; i++) normals.push(0, 0.95, 0.3);
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(index);
  return geo;
}

function createGrass() {
  const count = HIGH ? 12000 : 5000;
  const material = windy(
    new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
    0.18,
  );
  const mesh = new THREE.InstancedMesh(bladeGeometry(), material, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const c = new THREE.Color();
  let n = 0;
  let guard = 0;
  while (n < count && guard++ < count * 3) {
    const a = rand(0, TAU);
    const r = 1.35 + 15 * Math.pow(Math.random(), 1.25);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = heightAt(x, z);
    if (y < WATER + 0.12) continue;
    e.set(rand(-0.15, 0.15), rand(0, TAU), rand(-0.15, 0.15));
    q.setFromEuler(e);
    const h = rand(0.12, 0.3) * (r < 3 ? 0.75 : 1);
    m.compose(p.set(x, y - 0.02, z), q, s.set(rand(0.8, 1.4), h, 1));
    mesh.setMatrixAt(n, m);
    c.setHSL(rand(0.22, 0.3), rand(0.45, 0.65), rand(0.42, 0.58));
    c.multiplyScalar(1.9);
    mesh.setColorAt(n, c);
    n++;
  }
  mesh.count = n;
  mesh.receiveShadow = HIGH;
  mesh.frustumCulled = false;
  return mesh;
}

function createFlowers() {
  const count = HIGH ? 420 : 200;
  const stems = [];
  const stem = new THREE.CylinderGeometry(0.012, 0.016, 1, 3, 1, true);
  paint(stem, "#4c9a3a");
  xf(stem, 0, 0.5, 0);
  stems.push(stem);
  const leaf = new THREE.CircleGeometry(0.06, 5);
  paint(leaf, "#5fae45");
  xf(leaf, 0.06, 0.35, 0, -1.2, 0, 0, 0.6, 1.4, 1);
  stems.push(leaf);
  const center = new THREE.IcosahedronGeometry(0.04, 0);
  paint(center, "#ffd23f");
  xf(center, 0, 1.01, 0, 0, 0, 0, 1, 0.6, 1);
  stems.push(center);
  const stemGeo = mergeAll(stems);

  const petals = [];
  for (let k = 0; k < 6; k++) {
    const petal = new THREE.CircleGeometry(0.06, 6);
    paint(petal, "#ffffff");
    xf(petal, 0, 0, 0.07, -Math.PI / 2 + 0.25, 0, 0, 0.6, 1.25, 1);
    xf(petal, 0, 0.99, 0, 0, (k / 6) * TAU, 0);
    petals.push(petal);
  }
  const petalGeo = mergeAll(petals);

  const stemMat = windy(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 0.12);
  const petalMat = windy(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 0.12);
  const stemMesh = new THREE.InstancedMesh(stemGeo, stemMat, count);
  const petalMesh = new THREE.InstancedMesh(petalGeo, petalMat, count);
  const tints = ["#ff7eb6", "#ffffff", "#ffd84d", "#b28dff", "#7fd3ff", "#ff9f68"];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const c = new THREE.Color();
  let n = 0;
  let guard = 0;
  while (n < count && guard++ < count * 4) {
    const a = rand(0, TAU);
    const r = rand(1.6, 15);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = heightAt(x, z);
    if (y < WATER + 0.2) continue;
    e.set(rand(-0.12, 0.12), rand(0, TAU), rand(-0.12, 0.12));
    q.setFromEuler(e);
    const h = rand(0.22, 0.42);
    m.compose(p.set(x, y, z), q, s.set(h * 1.4, h, h * 1.4));
    stemMesh.setMatrixAt(n, m);
    petalMesh.setMatrixAt(n, m);
    c.set(tints[n % tints.length]);
    petalMesh.setColorAt(n, c);
    n++;
  }
  stemMesh.count = n;
  petalMesh.count = n;
  stemMesh.frustumCulled = false;
  petalMesh.frustumCulled = false;
  return [stemMesh, petalMesh];
}

function wingTexture(main, edge) {
  const canvas = makeCanvas(128, 128);
  const ctx = canvas.getContext("2d");
  ctx.translate(4, 64);
  const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 120);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.25, main);
  g.addColorStop(1, edge);
  ctx.fillStyle = g;
  ctx.strokeStyle = "#2a2340";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.bezierCurveTo(30, -70, 120, -66, 116, -18);
  ctx.bezierCurveTo(112, 0, 70, 2, 40, 0);
  ctx.bezierCurveTo(80, 8, 100, 40, 80, 58);
  ctx.bezierCurveTo(58, 72, 18, 40, 0, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (const [x, y, r] of [
    [92, -34, 7],
    [76, -46, 5],
    [62, 34, 6],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  return canvasTexture(canvas);
}

function createButterflies() {
  const group = new THREE.Group();
  const kinds = [
    ["#ffb347", "#ff6a00"],
    ["#7fd3ff", "#3a6df0"],
    ["#ff9ccc", "#d6338a"],
    ["#fff07a", "#f0a500"],
  ];
  const wing = new THREE.PlaneGeometry(0.16, 0.16);
  wing.translate(0.08, 0, 0);
  const body = new THREE.CapsuleGeometry(0.012, 0.07, 3, 6);
  body.rotateX(Math.PI / 2);
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2a2340 });
  const list = [];
  for (let i = 0; i < 6; i++) {
    const [main, edge] = kinds[i % kinds.length];
    const mat = new THREE.MeshLambertMaterial({
      map: wingTexture(main, edge),
      side: THREE.DoubleSide,
      alphaTest: 0.5,
      emissive: 0x332a22,
    });
    const b = new THREE.Group();
    const leftPivot = new THREE.Group();
    const rightPivot = new THREE.Group();
    const l = new THREE.Mesh(wing, mat);
    const r = new THREE.Mesh(wing, mat);
    l.rotation.x = -Math.PI / 2;
    r.rotation.x = -Math.PI / 2;
    r.scale.x = -1;
    leftPivot.add(l);
    rightPivot.add(r);
    b.add(new THREE.Mesh(body, bodyMat), leftPivot, rightPivot);
    b.userData = {
      left: leftPivot,
      right: rightPivot,
      cx: rand(-6, 6),
      cz: rand(-6, 6),
      seed: rand(0, 100),
      speed: rand(0.25, 0.45),
      prev: new THREE.Vector3(),
    };
    group.add(b);
    list.push(b);
  }
  const look = new THREE.Vector3();
  function update(t) {
    for (const b of list) {
      const d = b.userData;
      const k = t * d.speed + d.seed;
      let x = d.cx + Math.sin(k * 0.9) * 3.5 + Math.sin(k * 2.3) * 0.8;
      let z = d.cz + Math.cos(k * 0.7) * 3.5 + Math.cos(k * 1.9) * 0.8;
      const h = Math.hypot(x, z);
      if (h < 2.4) {
        const push = 2.4 / Math.max(h, 0.01);
        x *= push;
        z *= push;
      }
      const ground = heightAt(x, z);
      const y = Math.max(ground + 0.35, 0.6 + Math.sin(k * 1.3) * 0.7 + Math.sin(k * 3.7) * 0.15);
      d.prev.copy(b.position);
      b.position.set(x, y, z);
      look.copy(b.position).sub(d.prev);
      if (look.lengthSq() > 1e-8) b.rotation.y = Math.atan2(look.x, look.z);
      const flap = 0.25 + (Math.sin(t * 18 + d.seed) * 0.5 + 0.5) * 1.1;
      d.left.rotation.z = flap;
      d.right.rotation.z = -flap;
    }
  }
  return { group, update };
}

function createSparkles() {
  const count = HIGH ? 260 : 120;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const palette = [new THREE.Color("#fff3b0"), new THREE.Color("#ffc6e5"), new THREE.Color("#c8f1ff")];
  for (let i = 0; i < count; i++) {
    const a = rand(0, TAU);
    const r = rand(1.8, 14);
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = rand(0, 4.5);
    positions[i * 3 + 2] = Math.sin(a) * r;
    seeds[i] = rand(0, 100);
    const c = palette[i % palette.length];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  const uniforms = { uTime: time, uScale: pointScale, uBoost: { value: 0 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uScale;
      uniform float uBoost;
      attribute float aSeed;
      attribute vec3 aColor;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * (0.12 + fract(aSeed) * 0.15), 4.5);
        p.x += sin(uTime * 0.6 + aSeed) * 0.3;
        p.z += cos(uTime * 0.5 + aSeed * 1.3) * 0.3;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float tw = 0.5 + 0.5 * sin(uTime * (2.0 + fract(aSeed * 7.0) * 3.0) + aSeed);
        vAlpha = tw * smoothstep(0.0, 0.6, p.y) * smoothstep(4.5, 3.8, p.y) * (0.6 + uBoost);
        vColor = aColor;
        gl_PointSize = (0.07 + uBoost * 0.05) * uScale / -mv.z;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = length(p);
        float core = exp(-r * r * 9.0);
        float cross = max(0.0, 1.0 - abs(p.x) * 9.0) * max(0.0, 1.0 - abs(p.y)) + max(0.0, 1.0 - abs(p.y) * 9.0) * max(0.0, 1.0 - abs(p.x));
        float a = (core + cross * 0.5) * vAlpha;
        gl_FragColor = vec4(vColor * a, a);
      }
    `,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  return { points, uniforms };
}

export function createNature(scene) {
  scene.add(createTrees());
  scene.add(createGrass());
  for (const mesh of createFlowers()) scene.add(mesh);
  const butterflies = createButterflies();
  scene.add(butterflies.group);
  const sparkles = createSparkles();
  scene.add(sparkles.points);
  let boost = 0;
  let boostTarget = 0;
  return {
    setBoost(v) {
      boostTarget = v;
    },
    update(dt) {
      butterflies.update(time.value);
      boost += (boostTarget - boost) * Math.min(1, dt * 2);
      sparkles.uniforms.uBoost.value = boost;
    },
  };
}
