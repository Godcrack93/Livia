import * as THREE from "three";
import { TAU, gradient, mergeAll, paint, rand, xf } from "./util.js";

const INK = "#2a2340";
const CHEEK = "#ff9db8";

function S(parts, r, color, x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) {
  const geo = new THREE.SphereGeometry(r, r < 0.06 ? 8 : 14, r < 0.06 ? 6 : 10);
  paint(geo, color);
  xf(geo, 0, 0, 0, rx, ry, rz, sx, sy, sz);
  xf(geo, x, y, z);
  parts.push(geo);
  return geo;
}

function eyes(parts, y, z, spacing, r, { x = 0, sideways = false } = {}) {
  for (const side of [-1, 1]) {
    if (sideways) {
      S(parts, r, "#ffffff", x, y, side * z);
      S(parts, r * 0.62, INK, x + r * 0.1, y, side * (z + r * 0.5));
      S(parts, r * 0.22, "#ffffff", x + r * 0.25, y + r * 0.25, side * (z + r * 0.95));
    } else {
      S(parts, r, INK, side * spacing, y, z);
      S(parts, r * 0.36, "#ffffff", side * spacing - r * 0.3, y + r * 0.35, z + r * 0.75);
      S(parts, r * 0.18, "#ffffff", side * spacing + r * 0.35, y - r * 0.3, z + r * 0.8);
    }
  }
}

function cheeks(parts, y, z, spacing, r = 0.05) {
  for (const side of [-1, 1]) S(parts, r, CHEEK, side * spacing, y, z, 1, 0.6, 0.4);
}

function chick() {
  const p = [];
  const body = new THREE.SphereGeometry(0.36, 22, 16);
  gradient(body, "#ffbf1f", "#ffe36b");
  xf(body, 0, -0.1, 0);
  p.push(body);
  S(p, 0.27, "#ffe36b", 0, 0.28, 0.05);
  for (const [a, s] of [
    [-0.4, 0.8],
    [0, 1],
    [0.4, 0.8],
  ]) {
    S(p, 0.06, "#ffd23f", Math.sin(a) * 0.06, 0.56, 0.04, 0.6 * s, 1.4 * s, 0.6 * s, 0, 0, -a);
  }
  const beak = new THREE.ConeGeometry(0.065, 0.14, 10);
  paint(beak, "#ff8c1a");
  xf(beak, 0, 0.25, 0.33, Math.PI / 2, 0, 0);
  p.push(beak);
  eyes(p, 0.34, 0.27, 0.1, 0.045);
  cheeks(p, 0.25, 0.25, 0.17);
  for (const side of [-1, 1]) {
    S(p, 0.16, "#ffc21a", side * 0.33, -0.06, 0, 0.42, 0.8, 0.9, 0, 0, side * 0.35);
    S(p, 0.07, "#ff8c1a", side * 0.12, -0.44, 0.12, 1, 0.4, 1.5);
  }
  return mergeAll(p);
}

function bunny() {
  const p = [];
  const white = "#fbf7ff";
  const pink = "#ffb3c7";
  S(p, 0.31, white, 0, -0.16, 0);
  S(p, 0.27, white, 0, 0.2, 0.04);
  for (const side of [-1, 1]) {
    S(p, 1, white, side * 0.1, 0.56, -0.02, 0.075, 0.25, 0.045, 0, 0, side * -0.18);
    S(p, 1, pink, side * 0.1, 0.55, 0.015, 0.045, 0.19, 0.02, 0, 0, side * -0.18);
    S(p, 0.08, white, side * 0.14, -0.43, 0.16, 1, 0.55, 1.4);
    S(p, 0.08, white, side * 0.24, -0.12, 0.2, 0.7, 1, 0.7);
  }
  eyes(p, 0.25, 0.26, 0.1, 0.045);
  S(p, 0.035, pink, 0, 0.17, 0.31, 1.2, 0.9, 0.8);
  cheeks(p, 0.15, 0.26, 0.16);
  S(p, 0.1, white, 0, -0.22, -0.3);
  return mergeAll(p);
}

function ladybug() {
  const p = [];
  const shell = new THREE.SphereGeometry(0.4, 26, 14, 0, TAU, 0, Math.PI / 2);
  gradient(shell, "#d81b2a", "#ff4d4d");
  xf(shell, 0, -0.08, -0.02, 0, 0, 0, 1, 0.85, 1.12);
  p.push(shell);
  S(p, 0.39, INK, 0, -0.1, -0.02, 1, 0.25, 1.1);
  const line = new THREE.TorusGeometry(0.4, 0.014, 6, 32, Math.PI);
  paint(line, INK);
  xf(line, 0, 0, 0, 0, Math.PI / 2, 0, 1, 0.86, 1.13);
  xf(line, 0, -0.08, -0.02);
  p.push(line);
  for (const [phi, theta] of [
    [0.55, 0.5],
    [0.55, Math.PI - 0.5],
    [0.95, 1.2],
    [0.95, Math.PI - 1.2],
    [1.05, -0.9],
    [1.05, Math.PI + 0.9],
    [0.6, -1.6],
  ]) {
    const x = Math.sin(phi) * Math.cos(theta) * 0.4;
    const y = Math.cos(phi) * 0.4 * 0.85 - 0.08;
    const z = Math.sin(phi) * Math.sin(theta) * 0.4 * 1.12 - 0.02;
    S(p, 0.065, INK, x * 1.01, y * 1.01, z * 1.01, 1, 0.45, 1);
  }
  S(p, 0.19, INK, 0, -0.02, 0.4);
  for (const side of [-1, 1]) {
    S(p, 0.07, "#ffffff", side * 0.08, 0.05, 0.54);
    S(p, 0.042, INK, side * 0.08, 0.05, 0.6);
    S(p, 0.016, "#ffffff", side * 0.08 - 0.015, 0.07, 0.635);
    const antenna = new THREE.CylinderGeometry(0.01, 0.01, 0.22, 5);
    paint(antenna, INK);
    xf(antenna, side * 0.07, 0.22, 0.48, -0.5, 0, side * -0.4);
    p.push(antenna);
    S(p, 0.035, INK, side * 0.12, 0.31, 0.53);
  }
  cheeks(p, -0.02, 0.56, 0.12, 0.035);
  return mergeAll(p);
}

function fish() {
  const p = [];
  const body = new THREE.SphereGeometry(0.3, 24, 16);
  gradient(body, "#ff6a1a", "#ffb15c");
  xf(body, 0, 0, 0, 0, 0, 0, 1.3, 0.95, 0.72);
  p.push(body);
  for (const x of [0.08, -0.14]) {
    const ring = new THREE.TorusGeometry(0.27, 0.035, 8, 26);
    paint(ring, "#ffffff");
    const s = 1 - Math.abs(x) * 1.2;
    xf(ring, 0, 0, 0, 0, Math.PI / 2, 0, 1, 0.95 * s, 0.72 * s);
    xf(ring, x, 0, 0);
    p.push(ring);
  }
  const tail = new THREE.ConeGeometry(0.22, 0.3, 14);
  paint(tail, "#ff7a2a");
  xf(tail, 0, 0, 0, 0, 0, -Math.PI / 2, 1, 1, 0.25);
  xf(tail, -0.5, 0, 0);
  p.push(tail);
  const fin = new THREE.ConeGeometry(0.12, 0.2, 10);
  paint(fin, "#ff7a2a");
  xf(fin, -0.02, 0.3, 0, 0, 0, 0.5, 1, 1, 0.2);
  p.push(fin);
  eyes(p, 0.07, 0.15, 0, 0.075, { x: 0.2, sideways: true });
  S(p, 0.04, "#ff4f7b", 0.39, -0.05, 0, 0.6, 1, 1.4);
  return mergeAll(p);
}

function frog() {
  const p = [];
  const body = new THREE.SphereGeometry(0.36, 24, 16);
  gradient(body, "#3fae3f", "#7fe06a");
  xf(body, 0, -0.1, 0, 0, 0, 0, 1.12, 0.78, 1);
  p.push(body);
  S(p, 0.27, "#c9f59a", 0, -0.16, 0.14, 1.1, 0.7, 0.8);
  for (const side of [-1, 1]) {
    S(p, 0.13, "#6fd65e", side * 0.17, 0.18, 0.1);
    S(p, 0.1, "#ffffff", side * 0.17, 0.21, 0.17);
    S(p, 0.056, INK, side * 0.17, 0.21, 0.255);
    S(p, 0.02, "#ffffff", side * 0.17 - 0.02, 0.235, 0.3);
    S(p, 0.09, "#4fbf4a", side * 0.22, -0.38, 0.22, 1.3, 0.4, 1.2);
  }
  const smile = new THREE.TorusGeometry(0.14, 0.018, 6, 20, Math.PI);
  paint(smile, "#c2185b");
  xf(smile, 0, 0.0, 0.33, 0.2, 0, Math.PI);
  p.push(smile);
  cheeks(p, -0.03, 0.31, 0.24);
  return mergeAll(p);
}

function kitten() {
  const p = [];
  const fur = "#ffa94d";
  const head = new THREE.SphereGeometry(0.31, 24, 16);
  gradient(head, "#ff9a3c", "#ffc078");
  xf(head, 0, 0.1, 0, 0, 0, 0, 1.12, 0.95, 1);
  p.push(head);
  S(p, 0.25, fur, 0, -0.3, -0.02);
  for (const side of [-1, 1]) {
    const ear = new THREE.ConeGeometry(0.11, 0.2, 4);
    paint(ear, fur);
    xf(ear, side * 0.2, 0.4, 0, 0, Math.PI / 4, side * -0.35);
    p.push(ear);
    const inner = new THREE.ConeGeometry(0.06, 0.12, 4);
    paint(inner, "#ffc9d6");
    xf(inner, side * 0.195, 0.38, 0.04, 0, Math.PI / 4, side * -0.35);
    p.push(inner);
    for (let k = 0; k < 2; k++) {
      const w = new THREE.CylinderGeometry(0.006, 0.006, 0.2, 4);
      paint(w, INK);
      xf(w, side * 0.22, 0.02 - k * 0.04, 0.27, 0, 0, Math.PI / 2 + side * (k ? -0.12 : 0.12));
      p.push(w);
    }
    S(p, 0.08, fur, side * 0.13, -0.5, 0.12, 1, 0.5, 1.3);
  }
  for (const x of [-0.07, 0, 0.07]) S(p, 0.05, "#e8731c", x, 0.36, 0.2, 0.4, 1, 0.4);
  S(p, 0.1, "#fff3e6", 0, 0.02, 0.27, 1.4, 0.8, 0.8);
  S(p, 0.03, "#ff7f9e", 0, 0.07, 0.35, 1.3, 0.9, 0.9);
  eyes(p, 0.14, 0.27, 0.12, 0.055);
  cheeks(p, 0.03, 0.28, 0.2);
  return mergeAll(p);
}

function piglet() {
  const p = [];
  const pink = "#ffb3c6";
  const dark = "#ff8fab";
  const body = new THREE.SphereGeometry(0.34, 22, 16);
  gradient(body, "#ff9fb8", "#ffc8d6");
  xf(body, 0, -0.14, -0.02, 0, 0, 0, 1.05, 0.9, 1.1);
  p.push(body);
  S(p, 0.27, pink, 0, 0.2, 0.08);
  const snout = new THREE.CylinderGeometry(0.1, 0.11, 0.08, 16);
  paint(snout, dark);
  xf(snout, 0, 0.16, 0.34, Math.PI / 2, 0, 0);
  p.push(snout);
  for (const side of [-1, 1]) {
    S(p, 0.022, "#c2185b", side * 0.04, 0.16, 0.385);
    const ear = new THREE.ConeGeometry(0.08, 0.15, 8);
    paint(ear, dark);
    xf(ear, side * 0.15, 0.44, 0.06, 0.3, 0, side * -0.45);
    p.push(ear);
    for (const z of [-0.17, 0.15]) S(p, 0.075, dark, side * 0.17, -0.42, z, 1, 0.8, 1);
  }
  eyes(p, 0.28, 0.3, 0.1, 0.04);
  cheeks(p, 0.15, 0.3, 0.19);
  const tail = new THREE.TorusGeometry(0.05, 0.016, 6, 14);
  paint(tail, dark);
  xf(tail, 0, -0.06, -0.42);
  p.push(tail);
  return mergeAll(p);
}

function puppy() {
  const p = [];
  const fur = "#e8b77a";
  const darkFur = "#a8683a";
  const light = "#fff1dc";
  S(p, 0.3, fur, 0, -0.2, -0.02, 1, 0.95, 1.1);
  S(p, 0.2, light, 0, -0.2, 0.16, 1, 1, 0.6);
  S(p, 0.29, fur, 0, 0.2, 0.04);
  S(p, 0.13, light, 0, 0.12, 0.27, 1.2, 0.85, 1);
  S(p, 0.05, INK, 0, 0.17, 0.39, 1.2, 0.9, 1);
  S(p, 0.04, "#ff6b8b", 0, 0.04, 0.33, 1, 0.5, 0.6);
  S(p, 0.08, darkFur, 0.11, 0.28, 0.26, 1, 1, 0.4);
  for (const side of [-1, 1]) {
    S(p, 1, darkFur, side * 0.27, 0.14, 0.02, 0.08, 0.2, 0.05, 0, 0, side * 0.25);
    S(p, 0.08, fur, side * 0.15, -0.46, 0.12, 1, 0.6, 1.3);
    S(p, 0.09, fur, side * 0.2, -0.42, -0.15);
  }
  eyes(p, 0.28, 0.29, 0.11, 0.045);
  cheeks(p, 0.13, 0.3, 0.2);
  const tail = new THREE.CylinderGeometry(0.025, 0.035, 0.22, 6);
  paint(tail, fur);
  xf(tail, 0, -0.02, -0.38, -0.6, 0, 0);
  p.push(tail);
  S(p, 0.045, light, 0, 0.08, -0.45);
  return mergeAll(p);
}

function duckling() {
  const p = [];
  const yellow = "#ffe066";
  const deep = "#ffd43b";
  const orange = "#ff922b";
  const body = new THREE.SphereGeometry(0.32, 22, 16);
  gradient(body, deep, "#fff3a3");
  xf(body, 0, -0.18, -0.04, 0, 0, 0, 1, 0.82, 1.25);
  p.push(body);
  const tail = new THREE.ConeGeometry(0.1, 0.18, 8);
  paint(tail, yellow);
  xf(tail, 0, -0.04, -0.44, -1.0, 0, 0);
  p.push(tail);
  S(p, 0.24, yellow, 0, 0.24, 0.12);
  S(p, 0.05, deep, 0, 0.49, 0.1, 0.6, 1.4, 0.6);
  S(p, 1, orange, 0, 0.17, 0.37, 0.13, 0.045, 0.12);
  eyes(p, 0.3, 0.32, 0.09, 0.04);
  cheeks(p, 0.21, 0.31, 0.16);
  for (const side of [-1, 1]) {
    S(p, 0.15, deep, side * 0.3, -0.14, -0.04, 0.35, 0.7, 1.1, 0, 0, side * 0.25);
    S(p, 0.07, orange, side * 0.12, -0.44, 0.1, 1.2, 0.35, 1.6);
  }
  return mergeAll(p);
}

function teddy() {
  const p = [];
  const fur = "#b07a45";
  const light = "#e9c597";
  const body = new THREE.SphereGeometry(0.32, 22, 16);
  gradient(body, "#9a6534", "#c28a52");
  xf(body, 0, -0.2, 0, 0, 0, 0, 1, 1, 0.95);
  p.push(body);
  S(p, 0.2, light, 0, -0.2, 0.18, 1, 1.05, 0.55);
  S(p, 0.28, fur, 0, 0.2, 0.04);
  S(p, 0.12, light, 0, 0.12, 0.27, 1.25, 0.9, 0.9);
  S(p, 0.05, INK, 0, 0.17, 0.37, 1.3, 0.9, 1);
  for (const side of [-1, 1]) {
    S(p, 0.1, fur, side * 0.2, 0.42, 0, 1, 1, 0.6);
    S(p, 0.06, light, side * 0.2, 0.42, 0.05, 1, 1, 0.4);
    S(p, 0.09, fur, side * 0.3, -0.12, 0.08, 0.9, 1.3, 0.9, 0, 0, side * 0.5);
    S(p, 0.11, fur, side * 0.16, -0.46, 0.1, 1, 0.75, 1.2);
    S(p, 0.06, light, side * 0.16, -0.46, 0.22, 1, 1, 0.4);
  }
  eyes(p, 0.27, 0.29, 0.11, 0.042);
  cheeks(p, 0.14, 0.3, 0.2);
  return mergeAll(p);
}

function penguin() {
  const p = [];
  const dark = "#2a2d4f";
  const orange = "#ff9f1c";
  const body = new THREE.SphereGeometry(0.32, 22, 16);
  gradient(body, "#1f2140", "#3a3d63");
  xf(body, 0, -0.15, 0, 0, 0, 0, 1, 1.05, 0.95);
  p.push(body);
  S(p, 0.25, "#ffffff", 0, -0.16, 0.13, 0.95, 1.05, 0.8);
  S(p, 0.25, dark, 0, 0.22, 0.02);
  S(p, 0.19, "#ffffff", 0, 0.2, 0.13, 1.15, 0.95, 0.85);
  eyes(p, 0.25, 0.28, 0.09, 0.042);
  cheeks(p, 0.16, 0.28, 0.15);
  const beak = new THREE.ConeGeometry(0.055, 0.14, 10);
  paint(beak, orange);
  xf(beak, 0, 0.18, 0.33, Math.PI / 2, 0, 0);
  p.push(beak);
  const scarf = new THREE.TorusGeometry(0.25, 0.055, 8, 26);
  paint(scarf, "#ff4d6d");
  xf(scarf, 0, 0.03, 0, Math.PI / 2, 0, 0);
  p.push(scarf);
  S(p, 1, "#ff4d6d", 0.13, -0.08, 0.27, 0.05, 0.12, 0.03, 0, 0, 0.3);
  for (const side of [-1, 1]) {
    S(p, 1, dark, side * 0.32, -0.12, 0, 0.06, 0.22, 0.12, 0, 0, side * 0.35);
    S(p, 0.08, orange, side * 0.12, -0.48, 0.12, 1.2, 0.35, 1.5);
  }
  return mergeAll(p);
}

function unicorn() {
  const p = [];
  const white = "#fdf7ff";
  const mane = ["#ff8fc7", "#c49bff", "#7cc8ff", "#ffd36e"];
  const body = new THREE.SphereGeometry(0.3, 22, 16);
  gradient(body, "#efe4ff", "#ffffff");
  xf(body, 0, -0.16, -0.06, 0, 0, 0, 0.9, 0.85, 1.25);
  p.push(body);
  S(p, 0.24, white, 0, 0.2, 0.2, 1, 0.95, 1.05);
  S(p, 0.13, "#ffe3f1", 0, 0.12, 0.38, 1.1, 0.9, 1);
  const horn = new THREE.ConeGeometry(0.05, 0.28, 10);
  gradient(horn, "#ffb000", "#fff3a0");
  xf(horn, 0, 0.5, 0.26, 0.35, 0, 0);
  p.push(horn);
  for (const side of [-1, 1]) {
    S(p, 0.018, "#e599b8", side * 0.05, 0.13, 0.5);
    const ear = new THREE.ConeGeometry(0.05, 0.12, 6);
    paint(ear, white);
    xf(ear, side * 0.13, 0.42, 0.13, 0, 0, side * -0.3);
    p.push(ear);
    for (const z of [0.15, -0.27]) {
      const leg = new THREE.CylinderGeometry(0.055, 0.06, 0.22, 8);
      paint(leg, white);
      xf(leg, side * 0.13, -0.4, z);
      p.push(leg);
      S(p, 0.065, "#c49bff", side * 0.13, -0.5, z, 1, 0.5, 1);
    }
  }
  eyes(p, 0.26, 0.4, 0.1, 0.042);
  cheeks(p, 0.17, 0.4, 0.17);
  for (let k = 0; k < 5; k++) S(p, 0.08, mane[k % 4], 0, 0.42 - k * 0.08, 0.1 - k * 0.07);
  for (let k = 0; k < 4; k++) S(p, 0.08 - k * 0.008, mane[(k + 1) % 4], 0, -0.06 - k * 0.08, -0.45 - k * 0.05);
  return mergeAll(p);
}

function dragon() {
  const p = [];
  const green = "#5fd39a";
  const orange = "#ff9f43";
  const body = new THREE.SphereGeometry(0.33, 22, 16);
  gradient(body, "#36a874", "#6fe0a8");
  xf(body, 0, -0.15, 0, 0, 0, 0, 1, 0.95, 1);
  p.push(body);
  S(p, 0.24, "#c9f5a0", 0, -0.17, 0.14, 0.95, 1.1, 0.7);
  S(p, 0.27, green, 0, 0.24, 0.06);
  S(p, 0.14, "#6fe0a8", 0, 0.16, 0.28, 1.15, 0.85, 1);
  for (const side of [-1, 1]) {
    S(p, 0.02, "#1f6f4a", side * 0.05, 0.19, 0.41);
    const horn = new THREE.ConeGeometry(0.045, 0.14, 8);
    paint(horn, "#fff3c4");
    xf(horn, side * 0.12, 0.5, 0, -0.35, 0, side * -0.3);
    p.push(horn);
    S(p, 1, "#a17dff", side * 0.3, 0.02, -0.22, 0.04, 0.2, 0.17, 0, side * 0.5, side * -0.5);
    S(p, 0.09, "#36a874", side * 0.16, -0.46, 0.1, 1.1, 0.6, 1.3);
  }
  for (let k = 0; k < 4; k++) {
    const phi = 0.55 + k * 0.38;
    const spike = new THREE.ConeGeometry(0.045, 0.11, 6);
    paint(spike, orange);
    xf(spike, 0, -0.15 + Math.cos(phi) * 0.33, -Math.sin(phi) * 0.33, -phi, 0, 0);
    p.push(spike);
  }
  const tail = new THREE.ConeGeometry(0.09, 0.32, 10);
  paint(tail, "#36a874");
  xf(tail, 0, -0.35, -0.43, -1.9, 0, 0);
  p.push(tail);
  eyes(p, 0.32, 0.3, 0.11, 0.045);
  cheeks(p, 0.2, 0.3, 0.19);
  return mergeAll(p);
}

export function starGeometry() {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.42 : 0.19;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 3,
  });
  geo.center();
  return geo;
}

export const CRITTERS = [
  "pintinho",
  "coelhinho",
  "joaninha",
  "peixinho",
  "sapinho",
  "gatinho",
  "porquinho",
  "cachorrinho",
  "patinho",
  "ursinho",
];
export const RARE_CRITTERS = ["pinguim", "unicornio", "dragaozinho"];

// Para um bichinho novo: um builder aqui e o nome em CRITTERS (ou RARE_CRITTERS).
export function createCritters(scene, { groundAt = () => 0 } = {}) {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 });
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xffcf33,
    emissive: 0xff9a00,
    emissiveIntensity: 0.45,
    metalness: 0.35,
    roughness: 0.3,
  });
  const geometries = {
    pintinho: chick(),
    coelhinho: bunny(),
    joaninha: ladybug(),
    peixinho: fish(),
    sapinho: frog(),
    gatinho: kitten(),
    porquinho: piglet(),
    cachorrinho: puppy(),
    patinho: duckling(),
    ursinho: teddy(),
    pinguim: penguin(),
    unicornio: unicorn(),
    dragaozinho: dragon(),
    estrela: starGeometry(),
  };
  const pools = new Map();
  const freed = [];

  function make(type) {
    const pool = pools.get(type);
    const mesh = pool?.pop() ?? new THREE.Mesh(geometries[type], type === "estrela" ? starMat : material);
    mesh.userData.type = type;
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.setScalar(1);
    mesh.visible = true;
    return mesh;
  }

  function release(mesh) {
    mesh.removeFromParent();
    const type = mesh.userData.type;
    if (!pools.has(type)) pools.set(type, []);
    pools.get(type).push(mesh);
  }

  // Bichinho solto: pula, cai na grama, quica e vai embora saltitando.
  function free(mesh, position, scale) {
    scene.add(mesh);
    mesh.position.copy(position);
    const out = Math.atan2(position.x, position.z) + rand(-0.6, 0.6);
    freed.push({
      mesh,
      vx: Math.sin(out) * 0.7,
      vz: Math.cos(out) * 0.7,
      vy: 2.4,
      age: 0,
      bounces: 0,
      scale,
      spin: rand(-1, 1) > 0 ? 6 : -6,
      heading: out,
    });
  }

  // Estrela: sobe girando e some.
  function fly(mesh, position, scale) {
    scene.add(mesh);
    mesh.position.copy(position);
    freed.push({ mesh, star: true, age: 0, scale, vy: 1.2 });
  }

  function update(dt, t) {
    for (let i = freed.length - 1; i >= 0; i--) {
      const f = freed[i];
      f.age += dt;
      const m = f.mesh;
      if (f.star) {
        f.vy += dt * 3;
        m.position.y += f.vy * dt;
        m.rotation.y += dt * (8 + f.age * 10);
        m.scale.setScalar(f.scale * (1 + f.age * 0.8) * Math.max(0, 1 - f.age / 1.1));
        if (f.age > 1.1) {
          freed.splice(i, 1);
          release(m);
        }
        continue;
      }
      const grow = Math.min(1, f.age * 3);
      const ground = groundAt(m.position.x, m.position.z) + 0.2 * f.scale * 1.3;
      f.vy -= 9 * dt;
      m.position.x += f.vx * dt;
      m.position.y += f.vy * dt;
      m.position.z += f.vz * dt;
      if (m.position.y < ground) {
        m.position.y = ground;
        f.bounces += 1;
        f.vy = f.bounces < 3 ? 2.2 / f.bounces : 2.0;
        f.vx = Math.sin(f.heading) * (f.bounces < 3 ? 0.3 : 1.2);
        f.vz = Math.cos(f.heading) * (f.bounces < 3 ? 0.3 : 1.2);
      }
      if (f.bounces < 2) m.rotation.y += f.spin * dt;
      else m.rotation.y += (f.heading - m.rotation.y) * Math.min(1, dt * 6);
      const squash = m.position.y - ground < 0.05 ? 0.82 : 1;
      const fade = f.age > 3.4 ? Math.max(0, 1 - (f.age - 3.4) / 0.4) : 1;
      const s = f.scale * (1 + grow * 0.3) * fade;
      m.scale.set(s / Math.sqrt(squash), s * squash, s / Math.sqrt(squash));
      if (f.age > 3.8) {
        freed.splice(i, 1);
        release(m);
      }
    }
  }

  function clear() {
    for (const f of freed) release(f.mesh);
    freed.length = 0;
  }

  return { make, release, free, fly, update, clear };
}
