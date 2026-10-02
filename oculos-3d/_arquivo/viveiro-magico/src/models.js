import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Para adicionar uma planta: um item aqui e um caso em plantParts() e em fruitParts() (as mesas têm 6 lugares).
// grow: segundos de crescimento (com água) até ficar madura; price: moedas por fruto; name: aparece escrito nos quadros.
export const PLANTS = [
  { id: "alface", name: "Alface", fruit: 0x8ed36a, note: 523.25, grow: 30, price: 3 },
  { id: "cenoura", name: "Cenoura", fruit: 0xf28c28, note: 587.33, grow: 45, price: 5 },
  { id: "manjericao", name: "Manjericão", fruit: 0x3f8f4e, note: 659.25, grow: 35, price: 4 },
  { id: "tomate", name: "Tomate", fruit: 0xe23d3d, note: 783.99, grow: 40, price: 4 },
  { id: "milho", name: "Milho", fruit: 0xf5d04c, note: 880, grow: 60, price: 8 },
  { id: "flor", name: "Flor", fruit: 0xf2849a, note: 1046.5, grow: 50, price: 7 },
];

const TAU = Math.PI * 2;
const G_DARK = 0x3f8f4e;
const G_MID = 0x5bb86a;
const G_LIGHT = 0x8ed36a;
const G_PALE = 0xd5f0b0;
const STEM = 0x4f8a3c;
const HUSK = 0x9cc45a;
const WOOD = 0xc98b4f;
const ORANGE = 0xf28c28;
const RED = 0xe23d3d;
const YELLOW = 0xf5d04c;
const PINK = 0xf2849a;

export function paint(geo, hex) {
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

export function mergeAll(parts) {
  if (parts.length === 1) return parts[0];
  const flat = parts.some((geo) => !geo.index);
  return mergeGeometries(flat ? parts.map((geo) => (geo.index ? geo.toNonIndexed() : geo)) : parts);
}

function place(geo, tilt, yaw, x, y, z) {
  if (tilt) geo.rotateX(tilt);
  if (yaw) geo.rotateY(yaw);
  geo.translate(x, y, z);
  return geo;
}

function bundle(parts, tilt, yaw, x, y, z) {
  for (const geo of parts) place(geo, tilt, yaw, x, y, z);
  return parts;
}

function blob(hex, x, y, z, sx, sy, sz) {
  const geo = new THREE.SphereGeometry(1, 7, 5);
  geo.scale(sx, sy, sz);
  geo.translate(x, y, z);
  return paint(geo, hex);
}

function stem(hex, height, radius, x = 0, y = 0, z = 0) {
  const geo = new THREE.CylinderGeometry(radius * 0.75, radius, height, 5);
  geo.translate(x, y + height / 2, z);
  return paint(geo, hex);
}

function leaf(hex, len, wid, tilt, yaw, x = 0, y = 0, z = 0, round = false) {
  const geo = round ? new THREE.SphereGeometry(1, 6, 4) : new THREE.OctahedronGeometry(1, 0);
  geo.scale(wid / 2, len / 2, round ? 0.007 : 0.004);
  geo.translate(0, len / 2, 0);
  return paint(place(geo, tilt, yaw, x, y, z), hex);
}

function calyx(x, y, z, size) {
  const parts = [];
  for (let i = 0; i < 5; i += 1) parts.push(leaf(G_DARK, size, size * 0.45, 1.35, (i / 5) * TAU, x, y, z));
  return parts;
}

function bloom(size) {
  const parts = [];
  for (let i = 0; i < 8; i += 1) parts.push(leaf(PINK, size, size * 0.5, 1.4, (i / 8) * TAU, 0, 0, 0, true));
  const disc = new THREE.CylinderGeometry(size * 0.42, size * 0.42, size * 0.3, 10);
  parts.push(paint(disc, YELLOW));
  return parts;
}

function lettuce(stage) {
  if (stage === 0) {
    return [
      leaf(G_LIGHT, 0.055, 0.04, 0.6, 0, 0, 0, 0, true),
      leaf(G_LIGHT, 0.055, 0.04, 0.6, Math.PI, 0, 0, 0, true),
    ];
  }
  const parts = [];
  const outer = stage === 1 ? 5 : 8;
  const len = stage === 1 ? 0.075 : 0.1;
  for (let i = 0; i < outer; i += 1) {
    parts.push(leaf(i % 2 ? G_MID : G_LIGHT, len, len * 0.85, stage === 1 ? 0.8 : 1.15, (i / outer) * TAU, 0, 0.005, 0, true));
  }
  if (stage === 1) {
    parts.push(leaf(G_PALE, 0.045, 0.04, 0.2, 0, 0, 0, 0, true));
    return parts;
  }
  for (let i = 0; i < 5; i += 1) parts.push(leaf(G_LIGHT, 0.075, 0.07, 0.5, (i / 5) * TAU + 0.3, 0, 0.01, 0, true));
  parts.push(blob(G_PALE, 0, 0.05, 0, 0.042, 0.04, 0.042));
  return parts;
}

function frond(h, tilt, yaw, y) {
  const parts = [stem(G_MID, h, 0.003)];
  for (let k = 1; k <= 3; k += 1) {
    const at = h * (0.3 + k * 0.18);
    const size = 0.032 - k * 0.006;
    parts.push(
      leaf(G_DARK, size, size * 0.55, 1.0, Math.PI / 2, 0, at, 0),
      leaf(G_DARK, size, size * 0.55, 1.0, -Math.PI / 2, 0, at, 0),
    );
  }
  parts.push(leaf(G_MID, 0.022, 0.014, 0, 0, 0, h, 0));
  return bundle(parts, tilt, yaw, 0, y, 0);
}

function carrot(stage) {
  const n = [2, 4, 6][stage];
  const h = [0.06, 0.1, 0.13][stage];
  const base = stage === 2 ? 0.03 : 0;
  const parts = [];
  for (let i = 0; i < n; i += 1) parts.push(...frond(h, 0.3 + (i % 2) * 0.18, (i / n) * TAU, base));
  if (stage === 2) {
    const shoulder = new THREE.CylinderGeometry(0.03, 0.026, 0.045, 8);
    shoulder.translate(0, 0.008, 0);
    parts.push(paint(shoulder, ORANGE));
  }
  return parts;
}

function basilStem(h, x, z, pairs, size) {
  const parts = [stem(STEM, h, 0.004, x, 0, z)];
  for (let k = 0; k < pairs; k += 1) {
    const y = h * (pairs === 1 ? 0.6 : 0.3 + (0.55 * k) / (pairs - 1));
    const yaw = k % 2 ? Math.PI / 2 : 0;
    const s = size * (1 - k * 0.12);
    parts.push(
      leaf(k % 2 ? G_MID : G_DARK, s, s * 0.7, 0.85, yaw, x, y, z, true),
      leaf(k % 2 ? G_MID : G_DARK, s, s * 0.7, 0.85, yaw + Math.PI, x, y, z, true),
    );
  }
  parts.push(
    leaf(G_LIGHT, size * 0.5, size * 0.32, 0.35, 0, x, h, z, true),
    leaf(G_LIGHT, size * 0.5, size * 0.32, 0.35, Math.PI, x, h, z, true),
  );
  return parts;
}

function basil(stage) {
  if (stage === 0) return basilStem(0.04, 0, 0, 1, 0.04);
  if (stage === 1) return basilStem(0.1, 0, 0, 2, 0.055);
  const parts = [
    ...basilStem(0.16, 0, 0, 3, 0.062),
    ...basilStem(0.11, -0.04, 0.015, 2, 0.052),
    ...basilStem(0.11, 0.04, -0.015, 2, 0.052),
  ];
  for (let k = 0; k < 3; k += 1) parts.push(blob(0xf7f3e8, 0, 0.17 + k * 0.014, 0, 0.009, 0.007, 0.009));
  return parts;
}

function tomatoLeaf(yaw, y) {
  return [
    leaf(0x4f9d4a, 0.042, 0.022, 1.1, yaw, 0, y, 0),
    leaf(0x4f9d4a, 0.03, 0.018, 0.75, yaw - 0.6, 0, y, 0),
    leaf(0x4f9d4a, 0.03, 0.018, 0.75, yaw + 0.6, 0, y, 0),
  ];
}

function tomatoFruit(x, y, z, r) {
  return [blob(RED, x, y, z, r, r * 0.85, r), ...calyx(x, y + r * 0.78, z, r * 0.65)];
}

function stake(height) {
  const geo = new THREE.BoxGeometry(0.01, height, 0.01);
  geo.translate(0.045, height / 2, -0.02);
  return paint(geo, WOOD);
}

function tomato(stage) {
  if (stage === 0) return [stem(0x4f9d4a, 0.07, 0.006), ...tomatoLeaf(0, 0.035), ...tomatoLeaf(Math.PI, 0.055)];
  if (stage === 1) {
    return [
      stake(0.24),
      stem(0x4f9d4a, 0.18, 0.007),
      ...tomatoLeaf(0, 0.05),
      ...tomatoLeaf(2.2, 0.09),
      ...tomatoLeaf(4.4, 0.13),
      ...tomatoLeaf(1.0, 0.17),
      blob(YELLOW, 0.03, 0.15, 0.025, 0.011, 0.009, 0.011),
      blob(YELLOW, -0.028, 0.135, 0.02, 0.011, 0.009, 0.011),
      blob(0x8fbf4a, -0.035, 0.105, 0.025, 0.017, 0.016, 0.017),
      blob(0x8fbf4a, 0.03, 0.095, 0.02, 0.016, 0.015, 0.016),
    ];
  }
  return [
    stake(0.3),
    stem(0x4f9d4a, 0.24, 0.008),
    ...tomatoLeaf(0, 0.05),
    ...tomatoLeaf(2.2, 0.1),
    ...tomatoLeaf(4.4, 0.15),
    ...tomatoLeaf(1.0, 0.2),
    ...tomatoLeaf(3.3, 0.235),
    ...tomatoFruit(-0.042, 0.12, 0.03, 0.024),
    ...tomatoFruit(-0.018, 0.085, 0.045, 0.022),
    ...tomatoFruit(0.042, 0.15, 0.03, 0.024),
    ...tomatoFruit(0.05, 0.11, 0.0, 0.022),
    ...tomatoFruit(0.0, 0.19, 0.04, 0.022),
  ];
}

function blade(len, yaw, y) {
  const l1 = len * 0.55;
  const t1 = 0.45;
  return bundle(
    [
      leaf(0x6aa84f, l1, 0.042, t1, 0, 0, 0, 0, true),
      leaf(0x7cb85a, len * 0.5, 0.036, 1.25, 0, 0, Math.cos(t1) * l1 * 0.9, Math.sin(t1) * l1 * 0.9, true),
    ],
    0,
    yaw,
    0,
    y,
    0,
  );
}

function cob(yaw, y) {
  const kernels = new THREE.CylinderGeometry(0.014, 0.017, 0.065, 8);
  kernels.translate(0, 0.0325, 0);
  return bundle(
    [
      paint(kernels, YELLOW),
      leaf(HUSK, 0.066, 0.034, 0.28, 0, 0, 0, 0.01),
      leaf(HUSK, 0.066, 0.034, 0.28, Math.PI, 0, 0, -0.01),
      blob(0xa8703d, 0, 0.068, 0, 0.006, 0.01, 0.006),
    ],
    0.4,
    yaw,
    0,
    y,
    0,
  );
}

function corn(stage) {
  const h = [0.07, 0.18, 0.3][stage];
  const parts = [stem(0x6aa84f, h, [0.008, 0.011, 0.013][stage])];
  if (stage === 0) return [...parts, ...blade(0.08, 0, 0.01), ...blade(0.07, Math.PI, 0.03)];
  const count = stage === 1 ? 4 : 5;
  for (let i = 0; i < count; i += 1) parts.push(...blade(stage === 1 ? 0.14 : 0.17, i * 2.4, 0.03 + i * (h - 0.07) / count));
  if (stage === 2) {
    parts.push(...cob(0.8, 0.13), ...cob(3.9, 0.15));
    parts.push(stem(0xe9c46a, 0.045, 0.0025, 0, h, 0));
    for (let i = 0; i < 4; i += 1) {
      const spike = new THREE.CylinderGeometry(0.0018, 0.0025, 0.04, 4);
      spike.translate(0, 0.02, 0);
      parts.push(paint(place(spike, 0.6, (i / 4) * TAU, 0, h + 0.01, 0), 0xe9c46a));
    }
  }
  return parts;
}

function flower(stage) {
  if (stage === 0) {
    return [
      stem(G_MID, 0.05, 0.004),
      leaf(G_MID, 0.035, 0.018, 0.9, 0, 0, 0.01, 0),
      leaf(G_MID, 0.035, 0.018, 0.9, Math.PI, 0, 0.01, 0),
    ];
  }
  if (stage === 1) {
    return [
      stem(G_MID, 0.14, 0.004),
      leaf(G_MID, 0.04, 0.02, 0.9, 0, 0, 0.02, 0),
      leaf(G_MID, 0.04, 0.02, 0.9, Math.PI, 0, 0.02, 0),
      leaf(G_MID, 0.035, 0.018, 0.9, Math.PI / 2, 0, 0.07, 0),
      blob(G_MID, 0, 0.14, 0, 0.014, 0.02, 0.014),
      blob(PINK, 0, 0.158, 0, 0.009, 0.012, 0.009),
    ];
  }
  return [
    stem(G_MID, 0.22, 0.005),
    leaf(G_MID, 0.045, 0.022, 0.9, 0, 0, 0.02, 0),
    leaf(G_MID, 0.045, 0.022, 0.9, Math.PI, 0, 0.02, 0),
    leaf(G_MID, 0.04, 0.02, 0.9, Math.PI / 2, 0, 0.08, 0),
    leaf(G_MID, 0.04, 0.02, 0.9, -Math.PI / 2, 0, 0.08, 0),
    leaf(G_MID, 0.035, 0.018, 0.9, 0.8, 0, 0.14, 0),
    ...bundle(bloom(0.05), 0.5, 0, 0, 0.22, 0),
  ];
}

function plantParts(id, stage) {
  if (id === "alface") return lettuce(stage);
  if (id === "cenoura") return carrot(stage);
  if (id === "manjericao") return basil(stage);
  if (id === "tomate") return tomato(stage);
  if (id === "milho") return corn(stage);
  return flower(stage);
}

export function plantGeometry(id, stage) {
  return mergeAll(plantParts(id, stage));
}

function fruitParts(id) {
  if (id === "alface") {
    const parts = [blob(G_PALE, 0, 0, 0, 0.02, 0.019, 0.02)];
    for (let i = 0; i < 5; i += 1) parts.push(leaf(i % 2 ? G_MID : G_LIGHT, 0.042, 0.036, 0.45, (i / 5) * TAU, 0, -0.022, 0, true));
    return parts;
  }
  if (id === "cenoura") {
    const root = new THREE.ConeGeometry(0.014, 0.06, 7);
    root.rotateX(Math.PI);
    const parts = [
      paint(root, ORANGE),
      leaf(G_MID, 0.028, 0.012, 0.4, 0, 0, 0.028, 0),
      leaf(G_MID, 0.028, 0.012, 0.4, 2.1, 0, 0.028, 0),
      leaf(G_MID, 0.028, 0.012, 0.4, 4.2, 0, 0.028, 0),
    ];
    for (const geo of parts) geo.rotateZ(0.9);
    return parts;
  }
  if (id === "manjericao") {
    return [
      stem(STEM, 0.03, 0.003, 0, -0.04, 0),
      leaf(G_MID, 0.058, 0.04, 0.1, 0, 0, -0.016, 0, true),
      leaf(G_DARK, 0.054, 0.038, 0.6, Math.PI / 2, 0, -0.016, 0, true),
      leaf(G_DARK, 0.054, 0.038, 0.6, -Math.PI / 2, 0, -0.016, 0, true),
      leaf(G_LIGHT, 0.04, 0.028, 0.4, 0.3, 0, 0.0, 0.005, true),
    ];
  }
  if (id === "tomate") {
    return [
      ...tomatoFruit(0, 0, 0, 0.025),
      stem(G_DARK, 0.008, 0.002, 0, 0.02, 0),
    ];
  }
  if (id === "milho") {
    const kernels = new THREE.CylinderGeometry(0.013, 0.016, 0.065, 8);
    const parts = [
      paint(kernels, YELLOW),
      leaf(HUSK, 0.06, 0.03, 0.3, 0, 0, -0.032, 0.008),
      leaf(HUSK, 0.06, 0.03, 0.3, Math.PI, 0, -0.032, -0.008),
      blob(0xa8703d, 0, 0.034, 0, 0.005, 0.008, 0.005),
    ];
    for (const geo of parts) geo.rotateZ(1.0);
    return parts;
  }
  return [stem(G_MID, 0.035, 0.003, 0, -0.035, 0), ...bundle(bloom(0.03), 0.4, 0, 0, 0, 0)];
}

export function fruitGeometry(id) {
  return mergeAll(fruitParts(id));
}
