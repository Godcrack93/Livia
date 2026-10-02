import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const TAU = Math.PI * 2;
export const FONT = '"Fredoka", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';

export function rand(a, b) {
  return a + Math.random() * (b - a);
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(a, b, v) {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export function angleDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

// Elástico de "pulo": 0 → passa um pouco de 1 → assenta em 1.
export function easeOutBack(t) {
  const c = 1.9;
  const x = clamp01(t) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
}

function hash(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function noise2(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x, y, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise2(x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

const tmpColor = new THREE.Color();
const tmpColor2 = new THREE.Color();

export function paint(geometry, color) {
  const count = geometry.attributes.position.count;
  const data = new Float32Array(count * 3);
  tmpColor.set(color);
  for (let i = 0; i < count; i++) {
    data[i * 3] = tmpColor.r;
    data[i * 3 + 1] = tmpColor.g;
    data[i * 3 + 2] = tmpColor.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(data, 3));
  return geometry;
}

// Degradê no eixo Y do próprio objeto (antes de mover/girar).
export function gradient(geometry, bottom, top, power = 1) {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const span = Math.max(1e-6, max.y - min.y);
  const pos = geometry.attributes.position;
  const data = new Float32Array(pos.count * 3);
  tmpColor.set(bottom);
  tmpColor2.set(top);
  for (let i = 0; i < pos.count; i++) {
    const t = Math.pow(clamp01((pos.getY(i) - min.y) / span), power);
    data[i * 3] = tmpColor.r + (tmpColor2.r - tmpColor.r) * t;
    data[i * 3 + 1] = tmpColor.g + (tmpColor2.g - tmpColor.g) * t;
    data[i * 3 + 2] = tmpColor.b + (tmpColor2.b - tmpColor.b) * t;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(data, 3));
  return geometry;
}

export function setFloat(geometry, name, value) {
  const count = geometry.attributes.position.count;
  geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(count).fill(value), 1));
  return geometry;
}

const xfMatrix = new THREE.Matrix4();
const xfQuat = new THREE.Quaternion();
const xfEuler = new THREE.Euler();
const xfPos = new THREE.Vector3();
const xfScale = new THREE.Vector3();

export function xf(geometry, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  xfEuler.set(rx, ry, rz, "YXZ");
  xfQuat.setFromEuler(xfEuler);
  xfMatrix.compose(xfPos.set(x, y, z), xfQuat, xfScale.set(sx, sy, sz));
  geometry.applyMatrix4(xfMatrix);
  return geometry;
}

export function mergeAll(list, keep = ["position", "normal", "color"]) {
  const prepared = list.map((g) => {
    const geo = g.index ? g.toNonIndexed() : g;
    for (const name of Object.keys(geo.attributes)) {
      if (!keep.includes(name)) geo.deleteAttribute(name);
    }
    return geo;
  });
  return mergeGeometries(prepared, false);
}

// Esfera "fofa" (nuvem, copa de árvore): deforma com ruído e mantém sombreado suave.
export function blob(radius, detail, amount, seed = 0) {
  let geo = new THREE.IcosahedronGeometry(radius, detail);
  geo.deleteAttribute("normal");
  geo.deleteAttribute("uv");
  geo = mergeVertices(geo);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = noise2(v.x * 2.1 + seed * 7.3, v.z * 2.1 + v.y * 1.7 + seed * 3.1);
    v.multiplyScalar(1 + (n - 0.5) * amount);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function makeCanvas(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

export function canvasTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function starPath(ctx, cx, cy, outer, inner, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawStar(ctx, cx, cy, size, filled = true) {
  ctx.save();
  ctx.lineJoin = "round";
  starPath(ctx, cx, cy, size, size * 0.48);
  ctx.lineWidth = size * 0.28;
  ctx.strokeStyle = "#3b3561";
  ctx.stroke();
  if (filled) {
    const g = ctx.createLinearGradient(cx, cy - size, cx, cy + size);
    g.addColorStop(0, "#fff3a0");
    g.addColorStop(0.5, "#ffd34d");
    g.addColorStop(1, "#ff9f1c");
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = "rgba(59, 53, 97, 0.18)";
  }
  ctx.fill();
  if (filled) {
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.22, cy - size * 0.3, size * 0.16, size * 0.09, -0.6, 0, TAU);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fill();
  }
  ctx.restore();
}

// Texto com contorno branco grosso e borda escura, no estilo "adesivo".
export function stickerText(ctx, text, x, y, size, fill, { align = "center", outline = "#3b3561" } = {}) {
  ctx.save();
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = size * 0.32;
  ctx.strokeStyle = outline;
  ctx.strokeText(text, x, y + size * 0.05);
  ctx.lineWidth = size * 0.18;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function chickFace(ctx, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fillStyle = "#ffd84d";
  ctx.fill();
  ctx.lineWidth = r * 0.16;
  ctx.strokeStyle = "#3b3561";
  ctx.stroke();
  ctx.fillStyle = "#3b3561";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + side * r * 0.36, cy - r * 0.12, r * 0.14, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = "#ffffff";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + side * r * 0.36 - r * 0.04, cy - r * 0.17, r * 0.05, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.18, cy + r * 0.12);
  ctx.lineTo(cx + r * 0.18, cy + r * 0.12);
  ctx.lineTo(cx, cy + r * 0.38);
  ctx.closePath();
  ctx.fillStyle = "#ff8c42";
  ctx.fill();
  ctx.fillStyle = "rgba(255, 120, 150, 0.55)";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + side * r * 0.62, cy + r * 0.18, r * 0.16, r * 0.1, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
