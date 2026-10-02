import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { paint } from "./models.js";

const KEY = "viveiro-detalhe";

function readLevel() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// Nível de detalhe dos objetos fixos (mesa, cerca, vasos, pacotes). Muda pelo menu e vale ao recarregar.
export const HIGH = readLevel() !== "baixo";

export function setHigh(on) {
  try {
    window.localStorage.setItem(KEY, on ? "alto" : "baixo");
  } catch {
    // Sem localStorage: fica no padrão.
  }
}

let seed = 11;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
}

function grainTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 26; i += 1) {
    const y0 = rand() * size;
    const amp = 1 + rand() * 5;
    const freq = ((1 + Math.floor(rand() * 3)) * Math.PI * 2) / size;
    const phase = rand() * Math.PI * 2;
    ctx.strokeStyle = `rgba(150, 100, 60, ${0.05 + rand() * 0.1})`;
    ctx.lineWidth = 1 + rand() * 2.5;
    for (const shift of [-size, 0, size]) {
      ctx.beginPath();
      for (let x = 0; x <= size; x += 8) {
        const y = y0 + shift + Math.sin(x * freq + phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  for (let k = 0; k < 2; k += 1) {
    const kx = 40 + rand() * (size - 80);
    const ky = 40 + rand() * (size - 80);
    for (let ring = 5; ring >= 1; ring -= 1) {
      ctx.fillStyle = `rgba(130, 84, 50, ${0.06 + (5 - ring) * 0.03})`;
      ctx.beginPath();
      ctx.ellipse(kx, ky, ring * 4, ring * 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

let woodMaterial = null;
// Um material só para toda a madeira: cor por vértice multiplicada pelo veio.
export function wood() {
  if (!woodMaterial) woodMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, map: grainTexture() });
  return woodMaterial;
}

const AXES = { x: 0, y: 1, z: 2 };
const p = [0, 0, 0];

// UV pela posição: o veio corre ao longo de "along" e não estica com o tamanho da peça.
export function woodUV(geo, along = "x") {
  const a = AXES[along];
  const offset = rand() * 10;
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i += 1) {
    p[0] = pos.getX(i);
    p[1] = pos.getY(i);
    p[2] = pos.getZ(i);
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const nz = Math.abs(nor.getZ(i));
    const d = nx >= ny && nx >= nz ? 0 : ny >= nz ? 1 : 2;
    if (d === a) {
      uv.setXY(i, p[(a + 1) % 3] * 5 + offset, p[(a + 2) % 3] * 5);
    } else {
      const across = (a + 1) % 3 === d ? (a + 2) % 3 : (a + 1) % 3;
      uv.setXY(i, p[a] * 1.6 + offset, p[across] * 2.5 + offset * 0.7);
    }
  }
  return geo;
}

// Escurece de leve as quinas arredondadas para as peças ganharem contorno.
function shadeEdges(geo) {
  const nor = geo.attributes.normal;
  const col = geo.attributes.color;
  for (let i = 0; i < nor.count; i += 1) {
    const k = Math.max(Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i)));
    const f = 0.8 + 0.2 * k * k * k;
    col.setXYZ(i, col.getX(i) * f, col.getY(i) * f, col.getZ(i) * f);
  }
  return geo;
}

function longest(w, h, d) {
  if (w >= h && w >= d) return "x";
  return h >= d ? "y" : "z";
}

export function plank(hex, w, h, d, x, y, z, { along, rot, radius = 0.006 } = {}) {
  const r = Math.min(radius, Math.min(w, h, d) / 2 - 0.0005);
  const geo = new RoundedBoxGeometry(w, h, d, 2, r);
  if (rot) {
    geo.rotateX(rot[0]);
    geo.rotateY(rot[1]);
    geo.rotateZ(rot[2]);
  }
  geo.translate(x, y, z);
  shadeEdges(paint(geo, hex));
  return woodUV(geo, along ?? longest(w, h, d));
}

// Cabeça de prego virada para "facing" (x, y ou z; sinal pelo lado).
export function nail(x, y, z, facing = "y", side = 1) {
  const geo = new THREE.CylinderGeometry(0.0042, 0.0042, 0.002, 6);
  if (facing === "z") geo.rotateX(Math.PI / 2);
  if (facing === "x") geo.rotateZ(Math.PI / 2);
  geo.translate(x, y, z);
  paint(geo, side > 0 ? 0x6f6a66 : 0x5d5955);
  return geo;
}

export function tuft(x, z, count = 6, y = 0) {
  const parts = [];
  for (let i = 0; i < count; i += 1) {
    const h = 0.06 + rand() * 0.07;
    const geo = new THREE.ConeGeometry(0.008, h, 3);
    geo.translate(0, h / 2, 0);
    geo.rotateZ((rand() - 0.5) * 0.8);
    geo.rotateY(rand() * Math.PI * 2);
    geo.translate(x + (rand() - 0.5) * 0.06, y, z + (rand() - 0.5) * 0.04);
    parts.push(paint(geo, jitter(0x4f9e5c, 0.14)));
  }
  return parts;
}

// Quadro de pé (loja, preços): moldura pregada, cantoneiras, telhadinho de telhas, pés com mão-francesa.
// O painel com a textura fica em z = 0, centrado em (0, y); tudo aqui fica em volta dele.
export function signBoard(w, h, y, woodParts, plain) {
  const FRAME = 0xa8703d;
  const DARK = 0x8a5a2e;
  const top = y + h / 2;
  woodParts.push(plank(tint(DARK, 0.9), w + 0.04, h + 0.04, 0.02, 0, y, -0.02, { along: "x" }));
  for (const side of [-1, 1]) {
    woodParts.push(plank(jitter(FRAME, 0.05), w + 0.1, 0.05, 0.035, 0, y + side * (h / 2 + 0.025), 0.003));
    woodParts.push(plank(jitter(FRAME, 0.05), 0.05, h, 0.035, side * (w / 2 + 0.025), y, 0.003));
  }
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const cx = sx * (w / 2 + 0.025);
      const cy = y + sy * (h / 2 + 0.025);
      const bracket = new THREE.BoxGeometry(0.045, 0.045, 0.004);
      bracket.translate(cx, cy, 0.022);
      plain.push(paint(bracket, 0x8d949c));
      for (const [dx, dy] of [[-0.012, -0.012], [0.012, 0.012]]) {
        const rivet = new THREE.SphereGeometry(0.0045, 6, 4);
        rivet.translate(cx + dx * sx, cy + dy * sy, 0.025);
        plain.push(paint(rivet, 0x6f757c));
      }
    }
  }

  const postX = w / 2 - 0.06;
  const postTop = top + 0.12;
  for (const side of [-1, 1]) {
    const x = side * postX;
    woodParts.push(plank(jitter(DARK, 0.05), 0.055, postTop, 0.055, x, postTop / 2, -0.06, { radius: 0.008 }));
    for (const dz of [-1, 1]) {
      woodParts.push(plank(tint(DARK, 0.85), 0.035, 0.24, 0.03, x, 0.1, -0.06 + dz * 0.07, { rot: [-dz * 0.62, 0, 0], along: "y" }));
    }
    plain.push(...tuft(x, -0.02, 6));
  }
  woodParts.push(plank(DARK, w - 0.06, 0.05, 0.03, 0, 0.16, -0.06));

  const roofY = postTop + 0.02;
  const tilt = 0.32;
  const depth = 0.24;
  woodParts.push(plank(tint(DARK, 0.8), w + 0.22, 0.02, depth, 0, roofY, -0.02, { rot: [tilt, 0, 0] }));
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  const tiles = Math.round((w + 0.22) / 0.075);
  const tileW = (w + 0.22) / tiles;
  for (let row = 0; row < 3; row += 1) {
    const along = -depth / 2 + 0.04 + row * 0.075;
    const ty = roofY + 0.018 - along * sin;
    const tz = -0.02 + along * cos;
    for (let k = 0; k < tiles; k += 1) {
      const tx = -(w + 0.22) / 2 + tileW * (k + 0.5) + (row % 2 ? tileW / 2 : 0);
      if (tx > (w + 0.22) / 2) continue;
      const tile = new THREE.CylinderGeometry(tileW * 0.52, tileW * 0.52, 0.085, 8, 1, false, -Math.PI / 2, Math.PI);
      tile.rotateX(-Math.PI / 2);
      tile.scale(1, 0.35, 1);
      tile.rotateX(tilt);
      tile.translate(tx, ty, tz);
      plain.push(paint(tile, jitter(0xc8553d, 0.08)));
    }
  }

  const shadow = new THREE.CircleGeometry(1, 20);
  shadow.rotateX(-Math.PI / 2);
  shadow.scale(w / 2 + 0.12, 1, 0.2);
  shadow.translate(0, 0.005, -0.04);
  plain.push(paint(shadow, 0x4ea65d));
}

export function tint(hex, f) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return c.getHex();
}

export function jitter(hex, amount = 0.06) {
  return tint(hex, 1 - amount + rand() * amount * 2);
}

export { rand };
