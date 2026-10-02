import * as THREE from "three";
import { createAim } from "../shared/aim.js";
import {
  FONT,
  TAU,
  angleDiff,
  blob,
  canvasTexture,
  chickFace,
  drawStar,
  easeOutBack,
  gradient,
  makeCanvas,
  rand,
  roundRect,
  stickerText,
} from "../shared/util.js";
import { EYE } from "../shared/vr.js";

const INK = "#3b3561";
const RAINBOW = ["#ff5f9e", "#ff9f43", "#ffd32e", "#5fd35f", "#3ec1ff", "#9b7bff", "#ff6fcf"];
const HILLS = ["#6cc04a", "#7fd35a", "#5fb246", "#8ad866"];
const inv = new THREE.Matrix4();
const lo = new THREE.Vector3();
const ld = new THREE.Vector3();
const hp = new THREE.Vector3();
const center = new THREE.Vector3(0, EYE, 0);

function readRecord() {
  try {
    return Number(window.localStorage.getItem("bolhas-recorde")) || 0;
  } catch {
    return 0;
  }
}

function readStars() {
  try {
    const saved = JSON.parse(window.localStorage.getItem("labirinto-progresso") ?? "null");
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

function cardBase(ctx, cw, ch, top, bottom) {
  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.shadowColor = "rgba(40,20,80,0.35)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, 16, 12, cw - 32, ch - 36, 56);
  const g = ctx.createLinearGradient(0, 0, 0, ch);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  roundRect(ctx, 16, 12, cw - 32, ch - 36, 56);
  ctx.lineWidth = 8;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function footerLine(ctx, cw, y, text, star) {
  ctx.font = `600 34px ${FONT}`;
  const tw = ctx.measureText(text).width;
  const w = tw + (star ? 120 : 70);
  roundRect(ctx, (cw - w) / 2, y - 30, w, 60, 30);
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (star) {
    drawStar(ctx, (cw - tw) / 2 - 10, y, 20);
    ctx.fillText(text, cw / 2 + 25, y + 2);
  } else ctx.fillText(text, cw / 2, y + 2);
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

function bubbleTexture() {
  const canvas = makeCanvas(128, 128);
  bubble(canvas.getContext("2d"), 64, 64, 58);
  return canvasTexture(canvas);
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

function buildWorld(scene) {
  scene.fog = new THREE.Fog("#d6ecff", 35, 120);
  const sky = new THREE.Mesh(
    gradient(new THREE.SphereGeometry(150, 32, 16), "#e6f6ff", "#3f8fe0", 2.2),
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  sky.renderOrder = -10;
  scene.add(sky);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(130, 48).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: "#8ad46b" }),
  );
  scene.add(ground);

  scene.add(new THREE.HemisphereLight("#ffffff", "#6fae55", 1.5));
  const sun = new THREE.DirectionalLight("#fff3e0", 1.3);
  sun.position.set(6, 10, 4);
  scene.add(sun);

  for (let i = 0; i < 11; i++) {
    const hill = new THREE.Mesh(blob(1, 2, 0.3, i), new THREE.MeshLambertMaterial({ color: HILLS[i % HILLS.length] }));
    const a = (i / 11) * TAU + rand(-0.15, 0.15);
    const d = rand(42, 70);
    const s = rand(7, 13);
    hill.scale.set(s, rand(2.5, 5.5), s * rand(0.8, 1.2));
    hill.position.set(Math.sin(a) * d, -0.5, Math.cos(a) * d);
    scene.add(hill);
  }

  const cloudMat = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.35 });
  for (let i = 0; i < 8; i++) {
    const cloud = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const puff = new THREE.Mesh(blob(1, 1, 0.25, i * 3 + k), cloudMat);
      puff.scale.setScalar(k === 1 ? 2.6 : 1.9);
      puff.position.set((k - 1) * 2.4, k === 1 ? 0.6 : 0, 0);
      cloud.add(puff);
    }
    const a = (i / 8) * TAU + rand(-0.3, 0.3);
    const d = rand(50, 85);
    cloud.position.set(Math.sin(a) * d, rand(16, 30), Math.cos(a) * d);
    cloud.lookAt(0, cloud.position.y, 0);
    scene.add(cloud);
  }

  const tex = bubbleTexture();
  const floaters = [];
  for (let i = 0; i < 18; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    const size = rand(0.25, 0.75);
    sprite.scale.setScalar(size);
    const f = { sprite, a: rand(0, TAU), r: rand(3.4, 9), y: rand(-0.5, 8), speed: rand(0.15, 0.4), phase: rand(0, TAU) };
    floaters.push(f);
    scene.add(sprite);
  }
  return floaters;
}

// Sala de jogos dentro do óculos: olhar para um cartão até a bolinha encher abre o jogo.
export function createHub({ vr, audio, onPick }) {
  const scene = new THREE.Scene();
  const floaters = buildWorld(scene);
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
  place(title, 0, 3.1, EYE + 0.78);
  const bolhas = makeButton("bolhas", 1.0, 0.78, 640, 500, 1.3);
  place(bolhas, 0.36, 2.4, EYE - 0.05);
  bolhas.delay = 0.15;
  const labirinto = makeButton("labirinto", 1.0, 0.78, 640, 500, 1.3);
  place(labirinto, -0.36, 2.4, EYE - 0.05);
  labirinto.delay = 0.25;
  const sound = makeButton("sound", 0.66, 0.2, 660, 200, 1.0);
  place(sound, 0, 2.3, EYE - 0.78);
  sound.delay = 0.4;

  function drawTitle() {
    const { ctx } = title;
    ctx.clearRect(0, 0, 1024, 256);
    rainbowWord(ctx, "ÓCULOS MÁGICO", 512, 108, 104, 940);
    const text = "Olhe para um jogo e espere a bolinha encher";
    ctx.font = `600 38px ${FONT}`;
    const w = ctx.measureText(text).width + 60;
    roundRect(ctx, 512 - w / 2, 180, w, 60, 30);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 512, 212);
    title.texture.needsUpdate = true;
  }

  function drawBolhas() {
    const { ctx, cw, ch } = bolhas;
    cardBase(ctx, cw, ch, "#ffe0f1", "#c9ecff");
    bubble(ctx, 225, 165, 98);
    bubble(ctx, 405, 118, 56);
    bubble(ctx, 455, 245, 72);
    bubble(ctx, 105, 285, 38);
    bubble(ctx, 330, 290, 28);
    bubble(ctx, 540, 120, 22);
    fitText(ctx, "ESTOURA-BOLHAS", cw / 2, 372, 64, "#ff5f9e", 580);
    const record = readRecord();
    const text = loading === "bolhas" ? "Carregando..." : record > 0 ? `Recorde: ${record} pontos` : "Olhe aqui para jogar";
    footerLine(ctx, cw, 436, text, false);
    bolhas.texture.needsUpdate = true;
  }

  function drawLabirinto() {
    const { ctx, cw, ch } = labirinto;
    cardBase(ctx, cw, ch, "#e3f8d2", "#fff0c4");
    ctx.save();
    ctx.translate(320, 182);
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
    fitText(ctx, "LABIRINTO", cw / 2, 372, 64, "#ff9f43", 580);
    const stars = readStars();
    const text = loading === "labirinto" ? "Carregando..." : stars > 0 ? `${stars} estrelas` : "Olhe aqui para jogar";
    footerLine(ctx, cw, 436, text, loading !== "labirinto" && stars > 0);
    labirinto.texture.needsUpdate = true;
  }

  function drawSound() {
    const { ctx, cw, ch } = sound;
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.shadowColor = "rgba(40,20,80,0.35)";
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
  drawBolhas();
  drawLabirinto();
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
    drawBolhas();
    drawLabirinto();
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
    for (const f of floaters) {
      f.y += f.speed * dt;
      if (f.y > 8.5) f.y = -0.6;
      const sway = Math.sin(time * 0.8 + f.phase) * 0.25;
      f.sprite.position.set(Math.sin(f.a) * f.r + sway, f.y, Math.cos(f.a) * f.r);
    }
  }

  return {
    scene,
    enter,
    leave,
    frame,
    setLoading(id, on) {
      loading = on ? id : null;
      if (id === "bolhas") drawBolhas();
      if (id === "labirinto") drawLabirinto();
    },
    setSound(on) {
      soundOn = on;
      drawSound();
    },
  };
}
