import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { HIGH, jitter, nail, plank, rand, tint, tuft, wood, woodUV } from "./detail.js";
import { mergeAll } from "./models.js";

const TAU = Math.PI * 2;
const BENCH_Z = -0.82;
const BENCH_TOP = 0.55;
const FENCE_Z = -1.7;
const LEG = 0xe07a5f;
const POST = 0x81b29a;
const RAIL = 0xf2cc8f;
const PICKET = 0xfff6e6;
const TERRACOTTA = 0xd9774f;

function paint(geo, hex) {
  const color = new THREE.Color(hex);
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

function box(hex, x, y, z, w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(x, y, z);
  return paint(geo, hex);
}

function simpleYard() {
  const parts = [
    box(0xe9c46a, 0, 0.5, BENCH_Z, 1.45, 0.1, 0.62),
    box(LEG, -0.6, 0.22, -0.58, 0.08, 0.44, 0.08),
    box(LEG, 0.6, 0.22, -0.58, 0.08, 0.44, 0.08),
    box(LEG, -0.6, 0.22, -1.06, 0.08, 0.44, 0.08),
    box(LEG, 0.6, 0.22, -1.06, 0.08, 0.44, 0.08),
  ];
  for (let i = 0; i < 7; i += 1) {
    const x = -1.5 + i * 0.5;
    parts.push(box(POST, x, 0.28, FENCE_Z, 0.08, 0.5, 0.08));
    if (i < 6) parts.push(box(RAIL, x + 0.25, 0.42, FENCE_Z, 0.5, 0.06, 0.06));
  }
  return parts;
}

function lathe(hex, points, segments, x, y, z) {
  const geo = new THREE.LatheGeometry(
    points.map(([r, h]) => new THREE.Vector2(r, h)),
    segments,
  );
  geo.translate(x, y, z);
  return paint(geo, hex);
}

function blobPart(hex, sx, sy, sz, x, y, z, w = 6, h = 4) {
  const geo = new THREE.SphereGeometry(1, w, h);
  geo.scale(sx, sy, sz);
  geo.translate(x, y, z);
  return paint(geo, hex);
}

function daisy(x, z, height, petal) {
  const head = [];
  for (let i = 0; i < 7; i += 1) {
    const geo = new THREE.SphereGeometry(1, 5, 4);
    geo.scale(0.006, 0.014, 0.003);
    geo.translate(0, 0.014, 0);
    geo.rotateZ((i / 7) * TAU);
    head.push(paint(geo, petal));
  }
  head.push(blobPart(0xf5d04c, 0.008, 0.008, 0.005, 0, 0, 0.002));
  for (const geo of head) {
    geo.rotateX(-0.7);
    geo.translate(x, height, z);
  }
  const stem = new THREE.CylinderGeometry(0.0018, 0.0025, height, 4);
  stem.translate(x, height / 2, z);
  const leaf = blobPart(0x5bb86a, 0.012, 0.004, 0.006, x + 0.01, height * 0.4, z, 5, 3);
  return [...head, paint(stem, 0x4f8a3c), leaf];
}

// Vasinho de reserva (empilhado na prateleira da mesa).
function sparePot(x, y, z, tilt) {
  const geo = lathe(TERRACOTTA, [
    [0.001, 0], [0.042, 0], [0.046, 0.006], [0.056, 0.085], [0.064, 0.088], [0.066, 0.1],
    [0.062, 0.104], [0.054, 0.104], [0.046, 0.014], [0.001, 0.014],
  ], 16, 0, 0, 0);
  geo.rotateZ(tilt);
  geo.translate(x, y, z);
  return geo;
}

function sack(x, y, z) {
  const parts = [
    lathe(0xc9a36b, [
      [0.001, 0], [0.07, 0.004], [0.092, 0.04], [0.09, 0.11], [0.062, 0.16], [0.034, 0.18],
      [0.03, 0.19], [0.042, 0.212], [0.03, 0.222], [0.001, 0.224],
    ], 14, 0, 0, 0),
  ];
  const band = new THREE.TorusGeometry(0.033, 0.005, 5, 14);
  band.rotateX(Math.PI / 2);
  band.translate(0, 0.185, 0);
  parts.push(paint(band, 0x8a6a40));
  parts.push(blobPart(0x5bb86a, 0.018, 0.03, 0.004, -0.012, 0.09, 0.09));
  parts.push(blobPart(0x3f8f4e, 0.018, 0.03, 0.004, 0.014, 0.085, 0.089));
  parts.push(blobPart(0x6b4a33, 0.03, 0.01, 0.004, 0, 0.055, 0.092));
  for (const geo of parts) {
    geo.rotateY(-0.35);
    geo.translate(x, y, z);
  }
  return parts;
}

function trowel(x, y, z) {
  const handle = new THREE.CylinderGeometry(0.011, 0.013, 0.1, 8);
  handle.rotateZ(Math.PI / 2);
  handle.translate(-0.06, 0, 0);
  const ferrule = new THREE.CylinderGeometry(0.009, 0.011, 0.022, 8);
  ferrule.rotateZ(Math.PI / 2);
  ferrule.translate(0.0, 0, 0);
  const neck = new THREE.CylinderGeometry(0.004, 0.004, 0.03, 5);
  neck.rotateZ(Math.PI / 2);
  neck.translate(0.025, 0.002, 0);
  const blade = new THREE.SphereGeometry(1, 10, 6);
  blade.scale(0.055, 0.006, 0.032);
  blade.translate(0.085, 0.004, 0);
  const parts = [paint(handle, 0xa86b3c), paint(ferrule, 0x8d949c), paint(neck, 0x8d949c), paint(blade, 0xa9b4bf)];
  for (const geo of parts) {
    geo.rotateY(0.5);
    geo.translate(x, y, z);
  }
  return parts;
}

// Mesa dos vasos: tampo de tábuas com pregos, saia, pés com sapata e prateleira com tralhas.
function benchParts(woodParts, plain) {
  const tops = [0xe3b574, 0xd9a866, 0xe8bd7c, 0xdcae6c, 0xd2a060];
  const gap = 0.006;
  const pw = (0.62 - 4 * gap) / 5;
  for (let i = 0; i < 5; i += 1) {
    const z = BENCH_Z + (i - 2) * (pw + gap);
    woodParts.push(plank(tops[i], 1.46, 0.035, pw, 0, BENCH_TOP - 0.0175, z));
    for (const x of [-0.69, 0, 0.69]) {
      for (const dz of [-0.032, 0.032]) woodParts.push(nail(x + (rand() - 0.5) * 0.01, BENCH_TOP + 0.0008, z + dz));
    }
  }
  const front = BENCH_Z + 0.24;
  const back = BENCH_Z - 0.24;
  for (const x of [-0.63, 0.63]) {
    for (const z of [front, back]) {
      woodParts.push(plank(jitter(LEG, 0.04), 0.07, 0.5, 0.07, x, 0.265, z, { radius: 0.01 }));
      woodParts.push(plank(tint(LEG, 0.7), 0.082, 0.02, 0.082, x, 0.01, z));
    }
    woodParts.push(plank(LEG, 0.04, 0.04, 0.44, x, 0.1, BENCH_Z, { radius: 0.006 }));
  }
  for (const [z, face] of [[front + 0.0225, 1], [back - 0.0225, -1]]) {
    woodParts.push(plank(tint(LEG, 0.92), 1.3, 0.07, 0.025, 0, 0.48, z));
    for (const x of [-0.63, 0.63]) {
      for (const y of [0.465, 0.495]) woodParts.push(nail(x, y, z + face * 0.0134, "z"));
    }
  }
  for (const side of [-1, 1]) {
    woodParts.push(plank(tint(LEG, 0.92), 0.025, 0.07, 0.55, side * 0.6525, 0.48, BENCH_Z));
  }
  const shelf = [0xecc996, 0xe4bd86, 0xeed09f, 0xe0b67d];
  for (let i = 0; i < 4; i += 1) {
    const z = BENCH_Z + (i - 1.5) * 0.105;
    woodParts.push(plank(shelf[i], 1.28, 0.02, 0.095, 0, 0.13, z, { radius: 0.004 }));
    for (const x of [-0.625, 0.625]) woodParts.push(nail(x, 0.1408, z));
  }

  plain.push(sparePot(-0.4, 0.14, BENCH_Z - 0.02, 0), sparePot(-0.4, 0.165, BENCH_Z - 0.02, 0.06));
  plain.push(sparePot(-0.398, 0.19, BENCH_Z - 0.02, -0.04));
  plain.push(sparePot(-0.24, 0.14, BENCH_Z + 0.05, 0));
  plain.push(...sack(0.36, 0.14, BENCH_Z - 0.03));
  plain.push(...trowel(0.02, 0.152, BENCH_Z + 0.1));
  const shadow = new THREE.CircleGeometry(1, 24);
  shadow.rotateX(-Math.PI / 2);
  shadow.scale(0.86, 1, 0.44);
  shadow.translate(0, 0.004, BENCH_Z);
  plain.push(paint(shadow, 0x4ea65d));
}

// Lugares ocupados no chão (mesas, barraca, quadros): a decoração não nasce dentro deles.
const BUSY = [
  [0, -0.82, 0.95],
  [0, 1.35, 0.95],
  [-0.82, -0.23, 0.42],
  [0.82, -0.23, 0.42],
  [-1.11, 0.57, 0.6],
  [0.95, 0.32, 0.4],
  [0, 0, 0.55],
];

function free(x, z) {
  if (z < FENCE_Z + 0.2 && z > FENCE_Z - 0.2 && Math.abs(x) < 1.6) return false;
  if (Math.abs(z - 1.62) < 0.3) return false;
  for (const [bx, bz, r] of BUSY) if (Math.hypot(x - bx, z - bz) < r) return false;
  return true;
}

function pebble(x, z) {
  const geo = new THREE.IcosahedronGeometry(0.02 + rand() * 0.025, 0);
  geo.scale(1, 0.5, 0.8);
  geo.rotateY(rand() * TAU);
  geo.translate(x, 0.005, z);
  return paint(geo, jitter(0xb9b2a6, 0.12));
}

function bush(x, z, s) {
  const parts = [];
  for (const [dx, dy, dz, r, hex] of [
    [0, 0.2, 0, 0.26, 0x4f9e5c],
    [0.2, 0.14, 0.05, 0.18, 0x5bb86a],
    [-0.19, 0.13, 0.04, 0.19, 0x3f8f4e],
    [0.05, 0.3, -0.08, 0.17, 0x5bb86a],
  ]) {
    const geo = new THREE.IcosahedronGeometry(r * s, 1);
    geo.translate(x + dx * s, dy * s, z + dz * s);
    parts.push(paint(geo, jitter(hex, 0.06)));
  }
  for (let i = 0; i < 5; i += 1) {
    const a = rand() * TAU;
    const berry = new THREE.IcosahedronGeometry(0.025 * s, 0);
    berry.translate(x + Math.cos(a) * 0.22 * s, (0.15 + rand() * 0.15) * s, z + Math.sin(a) * 0.22 * s);
    parts.push(paint(berry, i % 2 ? 0xf2849a : 0xfff3c4));
  }
  return parts;
}

// Chão em volta: tufos de mato, flores, pedrinhas e moitas no fundo.
function groundParts() {
  const plain = [];
  let tries = 0;
  let placed = 0;
  while (placed < 70 && tries < 800) {
    tries += 1;
    const a = rand() * TAU;
    const r = 0.6 + Math.sqrt(rand()) * 3.4;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (!free(x, z)) continue;
    placed += 1;
    if (placed % 5 === 0) plain.push(...daisy(x, z, 0.1 + rand() * 0.08, [0xffffff, 0xf2849a, 0xf5d04c][placed % 3]));
    else if (placed % 7 === 0) plain.push(pebble(x, z));
    else plain.push(...tuft(x, z, 5 + Math.floor(rand() * 4)));
  }
  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * TAU + rand() * 0.3;
    const r = 4.2 + rand() * 1.2;
    plain.push(...bush(Math.cos(a) * r, Math.sin(a) * r, 0.9 + rand() * 0.8));
  }
  return plain.map((geo) => (geo.index ? geo.toNonIndexed() : geo));
}

function pyramid(hex, radius, height, x, y, z, depth = 1) {
  const geo = new THREE.CylinderGeometry(0, radius, height, 4, 1);
  geo.rotateY(Math.PI / 4);
  geo.scale(1, 1, depth);
  geo.translate(x, y, z);
  return woodUV(paint(geo, hex), "y");
}

// Cerca de estacas: mourões com chapéu, duas travessas pregadas e estacas de ponta.
function fenceParts(woodParts, plain) {
  const railZ = FENCE_Z + 0.05;
  const picketZ = FENCE_Z + 0.07;
  for (let i = 0; i < 7; i += 1) {
    const x = -1.5 + i * 0.5;
    woodParts.push(plank(jitter(POST, 0.05), 0.075, 0.56, 0.075, x, 0.28, FENCE_Z, { radius: 0.01 }));
    woodParts.push(pyramid(tint(POST, 0.78), 0.056, 0.05, x, 0.585, FENCE_Z));
    plain.push(...tuft(x + 0.015, FENCE_Z + 0.07, 7));
    if (i === 6) break;
    for (const y of [0.18, 0.42]) {
      woodParts.push(plank(jitter(RAIL, 0.05), 0.5, 0.05, 0.025, x + 0.25, y, railZ, { radius: 0.005 }));
      woodParts.push(nail(x + 0.018, y, railZ + 0.0134, "z"), nail(x + 0.482, y, railZ + 0.0134, "z"));
    }
    for (let k = 0; k < 4; k += 1) {
      const px = x + 0.1 * (k + 1);
      const h = 0.4 + 0.05 * Math.sin((Math.PI * (k + 1)) / 5);
      woodParts.push(plank(jitter(PICKET, 0.035), 0.06, h, 0.015, px, 0.04 + h / 2, picketZ, { radius: 0.004 }));
      woodParts.push(pyramid(jitter(PICKET, 0.035), 0.0424, 0.04, px, 0.06 + h, picketZ, 0.25));
      for (const y of [0.18, 0.42]) woodParts.push(nail(px, y, picketZ + 0.0083, "z"));
    }
    plain.push(...tuft(x + 0.25 + (rand() - 0.5) * 0.2, FENCE_Z + 0.11, 5));
    if (i % 2 === 0) plain.push(...daisy(x + 0.3, FENCE_Z + 0.13, 0.13 + rand() * 0.05, i % 4 === 0 ? 0xffffff : 0xf2849a));
  }
}

export function createScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xfff3c4, 8, 26);
  scene.background = new THREE.Color(0x7ec8e3);

  const hemi = new THREE.HemisphereLight(0x7ec8e3, 0xf2cc8f, 0.95);
  const sun = new THREE.DirectionalLight(0xfff6df, 0.9);
  sun.position.set(4, 8, 2);
  const fill = new THREE.DirectionalLight(0xfff6df, 0.45);
  fill.position.set(-2, 5, -4);
  scene.add(hemi, sun, fill);

  const skyGold = { value: 0 };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(28, 20, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { uGold: skyGold },
      vertexShader: `
        varying float vH;
        void main() {
          vH = position.y / 28.0 * 0.5 + 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        varying float vH;
        uniform float uGold;
        void main() {
          vec3 top = mix(vec3(0.494, 0.784, 0.890), vec3(1.0, 0.78, 0.42), uGold);
          vec3 low = vec3(1.0, 0.953, 0.769);
          gl_FragColor = vec4(mix(low, top, clamp(vH, 0.0, 1.0)), 1.0);
        }
      `,
    }),
  );
  sky.frustumCulled = false;
  scene.add(sky);

  const ground = paint(new THREE.CircleGeometry(7, 28).rotateX(-Math.PI / 2), 0x5bb86a);
  const plainMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  if (HIGH) {
    const woodParts = [];
    const plain = [ground];
    benchParts(woodParts, plain);
    fenceParts(woodParts, plain);
    scene.add(new THREE.Mesh(mergeAll(woodParts), wood()));
    scene.add(new THREE.Mesh(mergeGeometries(plain), plainMaterial));
    scene.add(new THREE.Mesh(mergeGeometries(groundParts()), plainMaterial));
  } else {
    scene.add(new THREE.Mesh(mergeGeometries([ground, ...simpleYard()]), plainMaterial));
  }

  const puffs = [];
  const cloud = new THREE.IcosahedronGeometry(1, 1);
  for (const [x, y, z, s] of [
    [-2.4, 4.2, -3.6, 0.8],
    [1.8, 4.8, -4.2, 1],
    [3.6, 3.9, -1.8, 0.6],
    [-3.8, 4.5, 0.6, 0.7],
  ]) {
    for (const [dx, dy, r] of [
      [-0.9, -0.1, 0.55],
      [0, 0.15, 0.8],
      [0.85, -0.05, 0.6],
    ]) {
      const puff = cloud.clone();
      puff.scale(r * s, r * s * 0.75, r * s);
      puff.translate(x + dx * s, y + dy * s, z);
      puffs.push(puff);
    }
  }
  const clouds = new THREE.Mesh(
    mergeGeometries(puffs),
    new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }),
  );
  scene.add(clouds);

  let gold = 0;
  let goldTarget = 0;

  return {
    scene,
    update(dt) {
      if (gold >= goldTarget) return;
      gold = Math.min(goldTarget, gold + dt * 0.35);
      skyGold.value = gold;
      sun.color.setRGB(1, 0.965 - gold * 0.12, 0.875 - gold * 0.4);
      sun.intensity = 0.9 + gold * 0.5;
      hemi.color.setRGB(0.494 + gold * 0.4, 0.784 + gold * 0.05, 0.89 - gold * 0.4);
    },
    celebrate() {
      goldTarget = 1;
    },
  };
}
