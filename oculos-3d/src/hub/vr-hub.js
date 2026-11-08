import * as THREE from "three";
import { createAim } from "../shared/aim.js";
import { pointScale } from "../shared/points.js";
import { HIGH } from "../shared/quality.js";
import {
  FONT,
  TAU,
  angleDiff,
  canvasTexture,
  chickFace,
  clamp01,
  drawStar,
  easeOutBack,
  fbm,
  gradient,
  makeCanvas,
  mergeAll,
  paint,
  rand,
  roundRect,
  smoothstep,
  stickerText,
  xf,
} from "../shared/util.js";
import { EYE } from "../shared/vr.js";

const INK = "#3b3561";
const RAINBOW = ["#ff5f9e", "#ff9f43", "#ffd32e", "#5fd35f", "#3ec1ff", "#9b7bff", "#ff6fcf"];
// O planetinha: ela fica de pé no topo de uma esfera pequena, então o horizonte "cai" em volta.
const PLANET_R = 7;
const SUN = new THREE.Vector3(0.62, 0.42, -0.66).normalize();
const inv = new THREE.Matrix4();
const lo = new THREE.Vector3();
const ld = new THREE.Vector3();
const hp = new THREE.Vector3();
const center = new THREE.Vector3(0, EYE, 0);
const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const tmpColor = new THREE.Color();
const q = new THREE.Quaternion();
const m4 = new THREE.Matrix4();

function readNumber(key) {
  try {
    return Number(window.localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function readStars(key) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) ?? "null");
    if (!Array.isArray(saved?.best)) return 0;
    return saved.best.reduce((sum, s) => sum + Math.max(0, Number(s) || 0), 0);
  } catch {
    return 0;
  }
}

function fitText(ctx, text, x, y, size, color, maxW) {
  ctx.font = `700 ${size}px ${FONT}`;
  const w = ctx.measureText(text).width + size * 0.3;
  stickerText(ctx, text, x, y, w > maxW ? Math.floor((size * maxW) / w) : size, color);
}

function rainbowWord(ctx, word, cx, y, size, maxW) {
  ctx.font = `700 ${size}px ${FONT}`;
  let widths = [...word].map((c) => ctx.measureText(c).width + size * 0.06);
  let total = widths.reduce((a, b) => a + b, 0);
  if (total > maxW) {
    size = Math.floor((size * maxW) / total);
    ctx.font = `700 ${size}px ${FONT}`;
    widths = [...word].map((c) => ctx.measureText(c).width + size * 0.06);
    total = widths.reduce((a, b) => a + b, 0);
  }
  let x = cx - total / 2;
  [...word].forEach((c, i) => {
    if (c !== " ") {
      ctx.save();
      ctx.translate(x + widths[i] / 2, y + Math.sin(i * 1.3) * size * 0.06);
      ctx.rotate(Math.sin(i * 2.1) * 0.08);
      const color = RAINBOW[i % RAINBOW.length];
      const g = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.3, color);
      g.addColorStop(1, color);
      stickerText(ctx, c, 0, 0, size, g);
      ctx.restore();
    }
    x += widths[i];
  });
}

function bubble(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.04, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.12, "rgba(255,255,255,0.3)");
  g.addColorStop(0.62, "rgba(220,240,255,0.18)");
  g.addColorStop(0.84, "rgba(255,150,215,0.65)");
  g.addColorStop(1, "rgba(120,210,255,0.95)");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.11, -0.7, 0, TAU);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();
}

function sparkle(ctx, x, y, s, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
  ctx.restore();
}

// Cartão em forma de "janela para outro mundo": moldura brilhante, a arte do jogo dentro e o nome embaixo.
function portal(ctx, cw, ch, colors, art) {
  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.shadowColor = colors[0];
  ctx.shadowBlur = 34;
  roundRect(ctx, 24, 20, cw - 48, ch - 52, 54);
  ctx.fillStyle = "#1d1650";
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, 44, 40, cw - 88, ch - 182, 36);
  ctx.clip();
  art(ctx);
  const glass = ctx.createLinearGradient(44, 40, cw * 0.6, ch * 0.55);
  glass.addColorStop(0, "rgba(255,255,255,0.32)");
  glass.addColorStop(0.35, "rgba(255,255,255,0.05)");
  glass.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glass;
  ctx.fillRect(44, 40, cw - 88, ch - 182);
  ctx.restore();
  roundRect(ctx, 44, 40, cw - 88, ch - 182, 36);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.stroke();
  roundRect(ctx, 24, 20, cw - 48, ch - 52, 54);
  const rim = ctx.createLinearGradient(0, 0, cw, ch);
  rim.addColorStop(0, colors[0]);
  rim.addColorStop(1, colors[1]);
  ctx.lineWidth = 12;
  ctx.strokeStyle = rim;
  ctx.stroke();
  sparkle(ctx, 40, 44, 16);
  sparkle(ctx, cw - 46, ch - 60, 12, 0.85);
}

function footerLine(ctx, cw, y, text, star) {
  ctx.font = `600 32px ${FONT}`;
  const tw = ctx.measureText(text).width;
  const w = tw + (star ? 118 : 66);
  roundRect(ctx, (cw - w) / 2, y - 28, w, 56, 28);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (star) {
    drawStar(ctx, (cw - tw) / 2 - 10, y, 19);
    ctx.fillText(text, cw / 2 + 25, y + 2);
  } else ctx.fillText(text, cw / 2, y + 2);
}

function bolhasArt(ctx) {
  const g = ctx.createLinearGradient(0, 40, 0, 360);
  g.addColorStop(0, "#ffd9ee");
  g.addColorStop(1, "#bfe7ff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, 400);
  ctx.fillStyle = "#8ad46b";
  ctx.beginPath();
  ctx.ellipse(320, 400, 380, 90, 0, 0, TAU);
  ctx.fill();
  bubble(ctx, 230, 190, 92);
  bubble(ctx, 410, 132, 54);
  bubble(ctx, 462, 262, 68);
  bubble(ctx, 108, 286, 36);
  bubble(ctx, 336, 300, 26);
  bubble(ctx, 548, 108, 22);
}

function labirintoArt(ctx) {
  const g = ctx.createLinearGradient(0, 40, 0, 360);
  g.addColorStop(0, "#d7f5c4");
  g.addColorStop(1, "#fff0c4");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, 400);
  ctx.save();
  ctx.translate(320, 205);
  ctx.scale(0.95, 0.95);
  roundRect(ctx, -150, -132, 300, 264, 26);
  ctx.fillStyle = "#8fdc6b";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#5aa845";
  ctx.stroke();
  ctx.fillStyle = "#ffb15c";
  ctx.strokeStyle = "#d9822b";
  ctx.lineWidth = 5;
  for (const [x, y, w, h] of [
    [-150, -132, 300, 22],
    [-150, 110, 300, 22],
    [-150, -132, 22, 264],
    [128, -132, 22, 264],
    [-70, -110, 20, 120],
    [-70, -10, 130, 20],
    [40, -70, 20, 80],
    [-10, 50, 20, 60],
  ]) {
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(88, 72, 20, 0, TAU);
  ctx.fillStyle = INK;
  ctx.fill();
  drawStar(ctx, -100, 70, 20);
  drawStar(ctx, 90, -95, 16);
  chickFace(ctx, -8, -62, 30);
  ctx.restore();
}

function lanternaArt(ctx) {
  const g = ctx.createLinearGradient(0, 40, 0, 360);
  g.addColorStop(0, "#0b1440");
  g.addColorStop(1, "#2a2560");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, 400);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + ((i * 37) % 10) / 16})`;
    ctx.beginPath();
    ctx.arc(50 + ((i * 131) % 540), 50 + ((i * 71) % 170), 1.2 + (i % 3) * 0.6, 0, TAU);
    ctx.fill();
  }
  const halo = ctx.createRadialGradient(512, 96, 20, 512, 96, 90);
  halo.addColorStop(0, "rgba(200,215,255,0.55)");
  halo.addColorStop(1, "rgba(200,215,255,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(400, 0, 240, 200);
  ctx.fillStyle = "#fff4d6";
  ctx.beginPath();
  ctx.arc(512, 96, 32, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#070b1f";
  for (let x = 30; x < 640; x += 58) {
    const h = 120 + ((x * 13) % 70);
    for (let k = 0; k < 3; k++) {
      const w = 34 - k * 8;
      const top = 366 - h + k * h * 0.22;
      ctx.beginPath();
      ctx.moveTo(x - w, top + h * 0.4);
      ctx.lineTo(x, top);
      ctx.lineTo(x + w, top + h * 0.4);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillRect(0, 330, 640, 70);
  const beam = ctx.createLinearGradient(130, 360, 340, 215);
  beam.addColorStop(0, "rgba(255,214,140,0.75)");
  beam.addColorStop(1, "rgba(255,214,140,0.08)");
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(118, 352);
  ctx.lineTo(262, 150);
  ctx.lineTo(430, 260);
  ctx.lineTo(142, 366);
  ctx.closePath();
  ctx.fill();
  // fantasminha iluminado, rindo de cócegas
  ctx.save();
  ctx.translate(336, 222);
  ctx.rotate(-0.12);
  const body = ctx.createLinearGradient(0, -70, 0, 60);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(1, "#e3e9ff");
  ctx.beginPath();
  ctx.moveTo(-58, 10);
  ctx.bezierCurveTo(-58, -86, 58, -86, 58, 10);
  ctx.lineTo(58, 44);
  for (let i = 0; i < 4; i++) {
    const x0 = 58 - i * 29;
    ctx.quadraticCurveTo(x0 - 7, i % 2 === 0 ? 60 : 30, x0 - 14.5, 44);
    ctx.quadraticCurveTo(x0 - 22, i % 2 === 0 ? 30 : 60, x0 - 29, 44);
  }
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineCap = "round";
  ctx.lineWidth = 7;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * 20, -18, 11, 1.1 * Math.PI, 1.9 * Math.PI);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 2, 16, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = "#5b1830";
  ctx.fill();
  ctx.fillStyle = "rgba(255,130,180,0.8)";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 36, 0, 9, 5, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  for (const [x, y, s] of [
    [258, 150, 14],
    [420, 170, 11],
    [404, 290, 9],
  ]) {
    sparkle(ctx, x, y, s);
  }
  // lanterna na mão
  ctx.save();
  ctx.translate(120, 352);
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 60);
  glow.addColorStop(0, "rgba(255,210,120,0.85)");
  glow.addColorStop(1, "rgba(255,210,120,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 60, 0, TAU);
  ctx.fill();
  roundRect(ctx, -18, -24, 36, 44, 8);
  ctx.fillStyle = "#ffd27a";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
  for (const [x, y] of [
    [80, 250],
    [560, 300],
    [470, 210],
    [190, 300],
  ]) {
    const f = ctx.createRadialGradient(x, y, 0, x, y, 12);
    f.addColorStop(0, "rgba(232,255,122,1)");
    f.addColorStop(1, "rgba(232,255,122,0)");
    ctx.fillStyle = f;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, TAU);
    ctx.fill();
  }
}

let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const canvas = makeCanvas(128, 128);
  const ctx = canvas.getContext("2d");
  ctx.filter = "blur(10px)";
  roundRect(ctx, 20, 20, 88, 88, 24);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  glowTex = canvasTexture(canvas);
  return glowTex;
}

function panel(w, h, cw, ch) {
  const canvas = makeCanvas(cw, ch);
  const ctx = canvas.getContext("2d");
  const texture = canvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }),
  );
  mesh.renderOrder = 22;
  const group = new THREE.Group();
  group.add(mesh);
  return { group, mesh, ctx, texture, w, h, cw, ch, delay: 0 };
}

// ----- espaço -----

function spaceTexture() {
  const w = HIGH ? 2048 : 1024;
  const h = w / 2;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#06051a");
  g.addColorStop(0.4, "#120b33");
  g.addColorStop(0.62, "#24124c");
  g.addColorStop(1, "#0a0720");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const tints = ["255,95,162", "155,107,255", "47,211,199", "95,123,255", "255,159,107"];
  for (let i = 0; i < 28; i++) {
    const x = rand(0, w);
    const y = rand(h * 0.16, h * 0.78);
    const r = rand(0.05, 0.16) * w;
    const tint = tints[i % tints.length];
    for (const dx of [-w, 0, w]) {
      const n = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, r);
      n.addColorStop(0, `rgba(${tint},${rand(0.12, 0.24).toFixed(2)})`);
      n.addColorStop(1, `rgba(${tint},0)`);
      ctx.fillStyle = n;
      ctx.save();
      ctx.translate(x + dx, y);
      ctx.scale(1, 0.55);
      ctx.translate(-(x + dx), -y);
      ctx.beginPath();
      ctx.arc(x + dx, y, r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  // Faixa da Via Láctea: poeira de estrelinhas numa onda.
  for (let i = 0; i < (HIGH ? 2600 : 1400); i++) {
    const x = Math.random() * w;
    const spread = (Math.random() + Math.random() + Math.random() - 1.5) * h * 0.09;
    const y = h * 0.42 + Math.sin((x / w) * TAU + 0.6) * h * 0.12 + spread;
    ctx.fillStyle = `rgba(255,255,255,${rand(0.05, 0.3).toFixed(2)})`;
    ctx.fillRect(x, y, rand(0.8, 1.8), rand(0.8, 1.8));
  }
  const texture = canvasTexture(canvas);
  texture.anisotropy = 1;
  return texture;
}

function createStars() {
  const count = HIGH ? 1400 : 900;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const tints = ["#ffffff", "#cfe0ff", "#fff1c9", "#ffd6f0", "#d9fff6"];
  for (let i = 0; i < count; i++) {
    const y = rand(-0.75, 1);
    const a = rand(0, TAU);
    const r = Math.sqrt(1 - y * y);
    positions[i * 3] = Math.cos(a) * r * 140;
    positions[i * 3 + 1] = y * 140;
    positions[i * 3 + 2] = Math.sin(a) * r * 140;
    sizes[i] = Math.random() < 0.06 ? rand(1.4, 2.0) : rand(0.4, 0.9);
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
  const uniforms = { uScale: pointScale, uTime: { value: 0 } };
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
      varying float vBig;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.5, aSize * uScale / max(1.0, -mv.z));
        vColor = aColor;
        vBig = step(1.3, aSize);
        vAlpha = 0.55 + 0.45 * sin(uTime * (1.0 + fract(aPhase) * 2.2) + aPhase);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vBig;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float core = exp(-dot(p, p) * 5.0);
        float cross = (max(0.0, 1.0 - abs(p.x) * 9.0) * max(0.0, 1.0 - abs(p.y)) + max(0.0, 1.0 - abs(p.y) * 9.0) * max(0.0, 1.0 - abs(p.x))) * vBig;
        float a = (core + cross * 0.7) * vAlpha;
        gl_FragColor = vec4(vColor * a, a);
      }
    `,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = -9;
  return { points, uniforms };
}

// Ponto na superfície do planetinha a uma distância (andando pelo chão) d e direção a.
function surface(d, a, out, normal) {
  const theta = d / PLANET_R;
  normal.set(-Math.sin(a) * Math.sin(theta), Math.cos(theta), -Math.cos(a) * Math.sin(theta));
  return out.copy(normal).multiplyScalar(PLANET_R).add(tmp2.set(0, -PLANET_R, 0));
}

function planetGround() {
  const geo = new THREE.SphereGeometry(PLANET_R, HIGH ? 96 : 64, HIGH ? 64 : 40);
  const pos = geo.attributes.position;
  const craters = [];
  for (let i = 0; i < 10; i++) {
    const a = rand(0, TAU);
    const th = rand(0.4, 1.5);
    craters.push({ dir: new THREE.Vector3(-Math.sin(a) * Math.sin(th), Math.cos(th), -Math.cos(a) * Math.sin(th)), r: rand(0.07, 0.16) });
  }
  const base = new THREE.Color("#7e6ff2");
  const dark = new THREE.Color("#5546c8");
  const light = new THREE.Color("#a99dff");
  const pit = new THREE.Color("#4a3cb2");
  const c = new THREE.Color();
  const colors = new Float32Array(pos.count * 3);
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(pos, i).normalize();
    const noise = fbm(n.x * 3 + 5, n.z * 3 + n.y * 2, 3);
    c.copy(base).lerp(dark, smoothstep(0.45, 0.7, noise) * 0.7).lerp(light, smoothstep(0.62, 0.8, fbm(n.x * 7, n.z * 7 - n.y, 2)) * 0.5);
    let dent = 0;
    for (const cr of craters) {
      const ang = Math.acos(Math.max(-1, Math.min(1, n.dot(cr.dir))));
      if (ang < cr.r) {
        c.lerp(pit, 0.6 * smoothstep(cr.r, cr.r * 0.4, ang));
        dent = Math.max(dent, smoothstep(cr.r, cr.r * 0.3, ang) * 0.09);
      } else if (ang < cr.r * 1.25) c.lerp(light, 0.5 * smoothstep(cr.r * 1.25, cr.r, ang));
    }
    pos.setXYZ(i, n.x * (PLANET_R - dent), n.y * (PLANET_R - dent), n.z * (PLANET_R - dent));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.position.y = -PLANET_R;
  return mesh;
}

// Florzinhas, cristais que brilham e um foguete estacionado atrás dela.
function planetDetails() {
  const lit = [];
  const glow = [];
  const p = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const place = (geo, d, a, spin = rand(0, TAU)) => {
    surface(d, a, p, nrm);
    q.setFromUnitVectors(UP, nrm);
    const yaw = new THREE.Quaternion().setFromAxisAngle(UP, spin);
    m4.compose(p, q.multiply(yaw), tmp.set(1, 1, 1));
    geo.applyMatrix4(m4);
    return geo;
  };
  const petals = ["#ff9cc8", "#ffe066", "#9ff0d4", "#ffffff", "#ffb86b"];
  for (let i = 0; i < (HIGH ? 30 : 18); i++) {
    const d = rand(1.2, 5.5);
    const a = rand(0, TAU);
    const parts = [];
    const stem = new THREE.CylinderGeometry(0.008, 0.012, 0.16, 5);
    paint(stem, "#5fd38a");
    xf(stem, 0, 0.08, 0);
    parts.push(stem);
    const color = petals[i % petals.length];
    for (let k = 0; k < 5; k++) {
      const petal = new THREE.SphereGeometry(0.03, 6, 4);
      paint(petal, color);
      const pa = (k / 5) * TAU;
      xf(petal, Math.cos(pa) * 0.035, 0.17, Math.sin(pa) * 0.035, 0, 0, 0, 1, 0.5, 1);
      parts.push(petal);
    }
    const heart = new THREE.SphereGeometry(0.022, 6, 4);
    paint(heart, "#ffd34d");
    xf(heart, 0, 0.18, 0);
    parts.push(heart);
    lit.push(place(mergeAll(parts), d, a));
  }
  const crystalColors = ["#5cf2e6", "#ff7ad9", "#b197fc"];
  for (let i = 0; i < 7; i++) {
    const d = rand(2.6, 5.8);
    const a = (i / 7) * TAU + rand(-0.3, 0.3);
    const parts = [];
    const color = crystalColors[i % crystalColors.length];
    for (let k = 0; k < 3; k++) {
      const h = rand(0.22, 0.45);
      const shard = new THREE.OctahedronGeometry(0.08, 0);
      paint(shard, color);
      xf(shard, rand(-0.1, 0.1), h * 0.5, rand(-0.1, 0.1), rand(-0.3, 0.3), 0, rand(-0.3, 0.3), 1, h * 6, 1);
      parts.push(shard);
    }
    glow.push(place(mergeAll(parts), d, a));
  }
  const rocket = [];
  const profile = [
    [0.0, 0],
    [0.2, 0.05],
    [0.27, 0.35],
    [0.28, 0.85],
    [0.22, 1.25],
    [0.0, 1.62],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.LatheGeometry(profile, 20);
  gradient(body, "#d9dcff", "#ffffff");
  rocket.push(body);
  const nose = new THREE.ConeGeometry(0.2, 0.42, 20);
  paint(nose, "#ff5f9e");
  xf(nose, 0, 1.45, 0);
  rocket.push(nose);
  const porthole = new THREE.SphereGeometry(0.11, 14, 10);
  paint(porthole, "#3ec1ff");
  xf(porthole, 0, 0.95, 0.24, 0, 0, 0, 1, 1, 0.45);
  rocket.push(porthole);
  const rim = new THREE.TorusGeometry(0.11, 0.025, 6, 18);
  paint(rim, "#9b7bff");
  xf(rim, 0, 0.95, 0.26);
  rocket.push(rim);
  for (let k = 0; k < 3; k++) {
    const fin = new THREE.BoxGeometry(0.05, 0.42, 0.26);
    paint(fin, "#ff5f9e");
    xf(fin, 0, 0.22, 0.28, 0.35, 0, 0);
    xf(fin, 0, 0, 0, 0, (k / 3) * TAU, 0);
    rocket.push(fin);
  }
  const rocketGeo = mergeAll(rocket);
  xf(rocketGeo, 0, 0, 0, 0, 0, 0, 1.15);
  lit.push(place(rocketGeo, 3.6, 2.45, 0.5));
  return {
    lit: new THREE.Mesh(mergeAll(lit), new THREE.MeshLambertMaterial({ vertexColors: true })),
    glow: new THREE.Mesh(mergeAll(glow), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })),
  };
}

function bandedPlanet(radius, palette, detail = 40) {
  const geo = new THREE.SphereGeometry(radius, detail, Math.round(detail * 0.7));
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / radius;
    const wobble = Math.sin(pos.getX(i) * 0.6 / radius * 6 + y * 3) * 0.05;
    const band = (y * 0.5 + 0.5 + wobble) * palette.length * 1.7;
    const k = Math.floor(band) % palette.length;
    c.set(palette[k]).lerp(tmpColor.set(palette[(k + 1) % palette.length]), smoothstep(0.75, 1, band % 1));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

function ringTexture() {
  const canvas = makeCanvas(256, 8);
  const ctx = canvas.getContext("2d");
  for (let x = 0; x < 256; x++) {
    const t = x / 255;
    const a = (0.35 + 0.45 * Math.abs(Math.sin(t * 19))) * smoothstep(0, 0.12, t) * smoothstep(1, 0.85, t) * (t > 0.55 && t < 0.6 ? 0.2 : 1);
    ctx.fillStyle = `rgba(255,${Math.round(214 + 30 * Math.sin(t * 7))},${Math.round(170 + 40 * t)},${a.toFixed(3)})`;
    ctx.fillRect(x, 0, 1, 8);
  }
  return canvasTexture(canvas);
}

function ringedPlanet() {
  const group = new THREE.Group();
  const ball = bandedPlanet(12, ["#ffb86b", "#ffd59e", "#f29e6b", "#ffcf8a", "#f7b27a"], HIGH ? 48 : 32);
  group.add(ball);
  const ringGeo = new THREE.RingGeometry(16, 27, 96, 1);
  // A textura vai do anel de dentro para o de fora.
  const uv = ringGeo.attributes.uv;
  const p = ringGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    const r = Math.hypot(p.getX(i), p.getY(i));
    uv.setXY(i, (r - 16) / 11, 0.5);
  }
  const ring = new THREE.Mesh(
    ringGeo,
    new THREE.MeshBasicMaterial({ map: ringTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }),
  );
  ring.rotation.set(1.25, 0.2, 0.35);
  group.add(ring);
  group.position.set(-40, 34, -58);
  return { group, ball, ring };
}

function streakTexture() {
  const canvas = makeCanvas(128, 16);
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 128, 0);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.85, "rgba(220,235,255,0.8)");
  g.addColorStop(1, "rgba(255,255,255,1)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(124, 3);
  ctx.arc(124, 8, 5, -Math.PI / 2, Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  return canvasTexture(canvas);
}

function stardust() {
  const count = HIGH ? 46 : 28;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = rand(0, TAU);
    const r = rand(2.6, 9);
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = rand(-1.5, 5);
    positions[i * 3 + 2] = Math.sin(a) * r;
    phases[i] = rand(0, TAU);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  const uniforms = { uScale: pointScale, uTime: { value: 0 } };
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
      varying float vTint;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * (0.12 + fract(aPhase) * 0.15) + 1.5, 6.5) - 1.5;
        p.x += sin(uTime * 0.5 + aPhase) * 0.3;
        p.z += cos(uTime * 0.4 + aPhase) * 0.3;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 0.16 * uScale / max(0.1, -mv.z);
        vAlpha = (0.5 + 0.5 * sin(uTime * 2.3 + aPhase * 3.0)) * smoothstep(-1.5, -0.8, p.y) * smoothstep(5.0, 4.0, p.y);
        vTint = fract(aPhase * 7.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      varying float vTint;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float star = max(0.0, 1.0 - abs(p.x) * 6.0) * max(0.0, 1.0 - abs(p.y)) + max(0.0, 1.0 - abs(p.y) * 6.0) * max(0.0, 1.0 - abs(p.x));
        float a = (star * 0.9 + exp(-dot(p, p) * 6.0) * 0.6) * vAlpha;
        vec3 col = mix(vec3(1.0, 0.92, 0.6), vec3(1.0, 0.75, 0.95), vTint);
        gl_FragColor = vec4(col * a, a);
      }
    `,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 7;
  return { points, uniforms };
}

// Luz que sobe do chão até o cartão, como um holograma.
function beamMesh(color) {
  const geo = new THREE.CylinderGeometry(0.42, 0.62, 1, 28, 1, true);
  geo.translate(0, 0.5, 0);
  const material = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uBoost: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying float vY;
      varying vec2 vUv;
      void main() {
        vY = position.y;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uBoost;
      varying float vY;
      varying vec2 vUv;
      void main() {
        float stripes = 0.75 + 0.25 * sin(vUv.x * 60.0 + uTime * 2.0);
        float a = (1.0 - vY) * smoothstep(0.0, 0.08, vY) * (0.16 + uBoost * 0.18) * stripes;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = 6;
  return mesh;
}

function buildWorld(scene) {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(160, 48, 24),
    new THREE.MeshBasicMaterial({ map: spaceTexture(), side: THREE.BackSide, depthWrite: false, toneMapped: false }),
  );
  sky.renderOrder = -10;
  scene.add(sky);
  const stars = createStars();
  scene.add(stars.points);

  scene.add(new THREE.HemisphereLight("#c9b8ff", "#2a1f5c", 1.15));
  const sun = new THREE.DirectionalLight("#ffe2c0", 1.6);
  sun.position.copy(SUN).multiplyScalar(60);
  scene.add(sun);

  scene.add(planetGround());
  const details = planetDetails();
  scene.add(details.lit, details.glow);

  const ringed = ringedPlanet();
  scene.add(ringed.group);
  const blue = bandedPlanet(7, ["#3ec1ff", "#a5e9ff", "#2f8ad8", "#7fd6ff"], HIGH ? 40 : 28);
  blue.position.set(52, 16, 40);
  scene.add(blue);
  const moon = bandedPlanet(3.2, ["#ffc8dd", "#ffb3cf", "#ffd6e7"], 28);
  moon.position.set(30, 24, -50);
  scene.add(moon);
  const tiny = bandedPlanet(2.2, ["#9ff0a8", "#5fd35f", "#c9f7b0"], 24);
  tiny.position.set(-56, 12, 34);
  scene.add(tiny);

  const streakMat = new THREE.MeshBasicMaterial({
    map: streakTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const streaks = [];
  for (let i = 0; i < 2; i++) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.9), streakMat.clone());
    mesh.visible = false;
    mesh.renderOrder = -8;
    scene.add(mesh);
    streaks.push({ mesh, pos: new THREE.Vector3(), vel: new THREE.Vector3(), t: 0, life: 0 });
  }
  const dust = stardust();
  scene.add(dust.points);
  return { stars, ringed, blue, moon, tiny, streaks, dust };
}

// Sala de jogos dentro do óculos: olhar para um cartão até a bolinha encher abre o jogo.
// Para um jogo novo: um cartão em GAMES (com a arte e o rodapé) e o carregador em src/main.js.
export function createHub({ vr, audio, onPick }) {
  const scene = new THREE.Scene();
  const world = buildWorld(scene);
  const content = new THREE.Group();
  scene.add(content);
  const aim = createAim();
  scene.add(aim.reticle);
  const buttons = [];
  const pops = [];
  let focused = null;
  let time = 0;
  let age = 0;
  let contentYaw = 0;
  let following = false;
  let loading = null;
  let soundOn = true;
  let nextStreak = 2;

  const GAMES = [
    {
      id: "bolhas",
      yaw: 0.55,
      title: "ESTOURA-BOLHAS",
      color: "#ff5f9e",
      rim: ["#ff7ac0", "#7f6bff"],
      beam: "#ff7ac0",
      art: bolhasArt,
      footer: () => {
        const record = readNumber("bolhas-recorde");
        return record > 0 ? [`Recorde: ${record} pontos`, false] : ["Olhe aqui para jogar", false];
      },
    },
    {
      id: "lanterna",
      yaw: 0,
      title: "LANTERNA",
      color: "#ffc233",
      rim: ["#ffd86b", "#9b7bff"],
      beam: "#ffd27a",
      art: lanternaArt,
      footer: () => {
        const stars = readStars("lanterna-progresso");
        return stars > 0 ? [`${stars} estrelas`, true] : ["Olhe aqui para jogar", false];
      },
    },
    {
      id: "labirinto",
      yaw: -0.55,
      title: "LABIRINTO",
      color: "#ff9f43",
      rim: ["#ffb15c", "#3ec1ff"],
      beam: "#7fe0a0",
      art: labirintoArt,
      footer: () => {
        const stars = readStars("labirinto-progresso");
        return stars > 0 ? [`${stars} estrelas`, true] : ["Olhe aqui para jogar", false];
      },
    },
  ];

  function place(p, yaw, dist, y) {
    p.group.position.set(-Math.sin(yaw) * dist, y, -Math.cos(yaw) * dist);
    p.group.lookAt(center);
    content.add(p.group);
    pops.push(p);
  }

  function makeButton(id, w, h, cw, ch, hold) {
    const p = panel(w, h, cw, ch);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 1.25, h * 1.3),
      new THREE.MeshBasicMaterial({
        map: glowTexture(),
        color: "#fff6c0",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    glow.position.z = -0.01;
    glow.renderOrder = 21;
    p.group.add(glow);
    const b = { ...p, id, hold, glow, focus: 0 };
    buttons.push(b);
    return b;
  }

  const title = panel(2.1, 0.525, 1024, 256);
  place(title, 0, 3.1, EYE + 0.8);
  const cards = GAMES.map((g, i) => {
    const b = makeButton(g.id, 0.92, 0.72, 640, 500, 1.3);
    place(b, g.yaw, 2.35, EYE - 0.05);
    b.delay = 0.12 + i * 0.1;
    b.game = g;
    // Feixe de luz do chão do planetinha até o cartão.
    const foot = surface(2.35, g.yaw, new THREE.Vector3(), tmp);
    const beam = beamMesh(g.beam);
    beam.position.copy(foot);
    beam.scale.set(1, EYE - 0.05 - 0.36 - foot.y, 1);
    content.add(beam);
    b.beam = beam;
    return b;
  });
  const sound = makeButton("sound", 0.66, 0.2, 660, 200, 1.0);
  place(sound, 0, 2.3, EYE - 0.78);
  sound.delay = 0.45;

  function drawTitle() {
    const { ctx } = title;
    ctx.clearRect(0, 0, 1024, 256);
    for (const [x, y, s] of [
      [70, 70, 18],
      [960, 60, 14],
      [120, 170, 10],
      [910, 165, 12],
    ]) {
      sparkle(ctx, x, y, s, 0.9);
    }
    rainbowWord(ctx, "ÓCULOS MÁGICO", 512, 108, 104, 900);
    const text = "Olhe para um jogo e espere a bolinha encher";
    ctx.font = `600 38px ${FONT}`;
    const w = ctx.measureText(text).width + 60;
    roundRect(ctx, 512 - w / 2, 180, w, 60, 30);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 512, 212);
    title.texture.needsUpdate = true;
  }

  function drawCard(b) {
    const { ctx, cw, ch, game } = b;
    portal(ctx, cw, ch, game.rim, game.art);
    fitText(ctx, game.title, cw / 2, ch - 108, 62, game.color, cw - 110);
    const [text, star] = loading === game.id ? ["Carregando...", false] : game.footer();
    footerLine(ctx, cw, ch - 54, text, star);
    b.texture.needsUpdate = true;
  }

  function drawSound() {
    const { ctx, cw, ch } = sound;
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.shadowColor = "rgba(20,10,60,0.5)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    roundRect(ctx, 10, 8, cw - 20, ch - 26, (ch - 26) / 2);
    const g = ctx.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, soundOn ? "#8ce99a" : "#dee2e6");
    g.addColorStop(1, soundOn ? "#2f9e44" : "#868e96");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    roundRect(ctx, 10, 8, cw - 20, ch - 26, (ch - 26) / 2);
    ctx.lineWidth = 7;
    ctx.strokeStyle = INK;
    ctx.stroke();
    const cx = 120;
    const cy = 90;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 44, cy - 18);
    ctx.lineTo(cx - 20, cy - 18);
    ctx.lineTo(cx + 8, cy - 42);
    ctx.lineTo(cx + 8, cy + 42);
    ctx.lineTo(cx - 20, cy + 18);
    ctx.lineTo(cx - 44, cy + 18);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 9;
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    if (soundOn) {
      ctx.arc(cx + 14, cy, 26, -0.8, 0.8);
      ctx.moveTo(cx + 14 + 46 * Math.cos(-0.8), cy + 46 * Math.sin(-0.8));
      ctx.arc(cx + 14, cy, 46, -0.8, 0.8);
    } else {
      ctx.moveTo(cx + 26, cy - 22);
      ctx.lineTo(cx + 66, cy + 22);
      ctx.moveTo(cx + 66, cy - 22);
      ctx.lineTo(cx + 26, cy + 22);
    }
    ctx.stroke();
    fitText(ctx, soundOn ? "SOM LIGADO" : "SOM DESLIGADO", 400, cy, 60, "#ffffff", 420);
    sound.texture.needsUpdate = true;
  }

  drawTitle();
  for (const b of cards) drawCard(b);
  drawSound();

  function pick(origin, dir, hit) {
    if (age < 0.8) return;
    for (const b of buttons) {
      if (loading && b.id !== "sound") continue;
      const m = b.mesh;
      inv.copy(m.matrixWorld).invert();
      lo.copy(origin).applyMatrix4(inv);
      ld.copy(dir).transformDirection(inv);
      if (Math.abs(ld.z) < 1e-6) continue;
      const t = -lo.z / ld.z;
      if (t <= 0) continue;
      const x = lo.x + ld.x * t;
      const y = lo.y + ld.y * t;
      if (Math.abs(x) > b.w / 2 || Math.abs(y) > b.h / 2) continue;
      const d = hp.set(x, y, 0).applyMatrix4(m.matrixWorld).distanceTo(origin);
      if (d < hit.dist) {
        hit.dist = d;
        hit.target = b;
      }
    }
  }

  function enter() {
    for (const b of cards) drawCard(b);
    age = 0;
    contentYaw = 0;
    following = false;
    content.rotation.y = 0;
    aim.pause(0.9);
  }

  function leave() {
    focused = null;
  }

  // Se a sala ficou para o lado (o celular foi encaixado olhando para outro canto), ela vem para a frente.
  function follow(dt, dir) {
    if (Math.abs(dir.y) > 0.85) return;
    const yaw = Math.atan2(-dir.x, -dir.z);
    const diff = angleDiff(yaw, contentYaw);
    if (!focused && Math.abs(diff) > 0.85) following = true;
    if (!following) return;
    contentYaw += diff * Math.min(1, dt * 2.5);
    if (Math.abs(diff) < 0.05) following = false;
    content.rotation.y = contentYaw;
  }

  // Estrela cadente de vez em quando, cruzando o céu.
  function shootingStars(dt, looker) {
    nextStreak -= dt;
    if (nextStreak <= 0) {
      nextStreak = rand(3, 7);
      const s = world.streaks.find((x) => !x.mesh.visible);
      if (s) {
        const a = rand(0, TAU);
        const el = rand(0.35, 0.95);
        s.pos.set(-Math.sin(a) * Math.cos(el), Math.sin(el), -Math.cos(a) * Math.cos(el)).multiplyScalar(110);
        s.vel.set(rand(-1, 1), rand(-0.6, -0.2), rand(-1, 1)).normalize().multiplyScalar(70);
        s.vel.addScaledVector(s.pos, -s.vel.dot(s.pos) / s.pos.lengthSq());
        s.t = 0;
        s.life = rand(0.7, 1.1);
        s.mesh.visible = true;
      }
    }
    looker.getWorldPosition(tmp);
    for (const s of world.streaks) {
      if (!s.mesh.visible) continue;
      s.t += dt;
      const k = s.t / s.life;
      if (k >= 1) {
        s.mesh.visible = false;
        continue;
      }
      s.pos.addScaledVector(s.vel, dt);
      s.mesh.position.copy(s.pos);
      // Deitada na direção do movimento, virada para quem olha.
      const x = tmp2.copy(s.vel).normalize();
      const zAxis = lo.copy(tmp).sub(s.pos).normalize();
      const yAxis = ld.crossVectors(zAxis, x).normalize();
      zAxis.crossVectors(x, yAxis);
      m4.makeBasis(x, yAxis, zAxis);
      s.mesh.quaternion.setFromRotationMatrix(m4);
      s.mesh.material.opacity = Math.sin(k * Math.PI);
    }
  }

  function frame(dt, looker, playing) {
    time += dt;
    age += dt;
    if (playing) {
      const res = aim.update(dt, vr, looker, pick, vr.consumeClick());
      focused = res.target;
      aim.reticle.visible = true;
      if (res.entered && res.target) audio.hover();
      if (res.done && res.target) {
        audio.bigPop(0);
        onPick(res.target.id);
      }
      const e = looker.matrixWorld.elements;
      follow(dt, hp.set(-e[8], -e[9], -e[10]).normalize());
    } else {
      focused = null;
      aim.reticle.visible = false;
    }

    for (const p of pops) {
      const k = (age - p.delay) * 2.6;
      p.group.scale.setScalar(k <= 0 ? 0.001 : Math.max(0.001, easeOutBack(k)));
    }
    for (const b of buttons) {
      b.focus += ((focused === b ? 1 : 0) - b.focus) * Math.min(1, dt * 12);
      const busy = loading === b.id ? 0.04 * Math.sin(time * 8) : 0;
      b.mesh.scale.setScalar(1 + b.focus * 0.07 + busy);
      b.glow.material.opacity = Math.max(b.focus * 0.95, loading === b.id ? 0.6 : 0);
    }
    cards.forEach((b, i) => {
      b.mesh.position.y = Math.sin(time * 1.2 + i * 1.7) * 0.025;
      b.beam.material.uniforms.uTime.value = time;
      b.beam.material.uniforms.uBoost.value = b.focus;
      b.beam.visible = clamp01((age - b.delay) * 2) > 0.5;
    });
    world.stars.uniforms.uTime.value = time;
    world.dust.uniforms.uTime.value = time;
    world.ringed.ball.rotation.y += dt * 0.03;
    world.ringed.group.rotation.y = Math.sin(time * 0.05) * 0.1;
    world.blue.rotation.y += dt * 0.05;
    world.moon.rotation.y -= dt * 0.08;
    world.tiny.rotation.y += dt * 0.1;
    shootingStars(dt, looker);
  }

  return {
    scene,
    enter,
    leave,
    frame,
    setLoading(id, on) {
      loading = on ? id : null;
      for (const b of cards) if (b.id === id) drawCard(b);
    },
    setSound(on) {
      soundOn = on;
      drawSound();
    },
  };
}
