import * as THREE from "three";
import {
  FONT,
  TAU,
  canvasTexture,
  chickFace,
  drawStar,
  easeOutBack,
  makeCanvas,
  roundRect,
  stickerText,
} from "../shared/util.js";
import { EYE } from "../shared/vr.js";
import { LEVELS, TOTAL_STARS } from "./levels.js";

const INK = "#3b3561";
const RAINBOW = ["#ff5f9e", "#ff9f43", "#ffd32e", "#5fd35f", "#3ec1ff", "#9b7bff", "#ff6fcf"];
const TILE_COLORS = {
  jardim: ["#9be36f", "#3fae4a"],
  gelo: ["#9fe0ff", "#3d8fe0"],
  doces: ["#ffb3d9", "#ea5a9a"],
  castelo: ["#c3a8ff", "#6a43e0"],
};
const inv = new THREE.Matrix4();
const lo = new THREE.Vector3();
const ld = new THREE.Vector3();
const hp = new THREE.Vector3();
const facing = new THREE.Vector3(0, EYE, 0);

function heart(ctx, x, y, s, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.9);
  ctx.bezierCurveTo(-s * 1.25, 0, -s * 0.75, -s * 1.0, 0, -s * 0.38);
  ctx.bezierCurveTo(s * 0.75, -s * 1.0, s * 1.25, 0, 0, s * 0.9);
  ctx.closePath();
  ctx.lineJoin = "round";
  ctx.lineWidth = s * 0.24;
  ctx.strokeStyle = INK;
  ctx.stroke();
  if (filled) {
    const g = ctx.createLinearGradient(0, -s, 0, s);
    g.addColorStop(0, "#ff8fab");
    g.addColorStop(1, "#e8384f");
    ctx.fillStyle = g;
  } else ctx.fillStyle = "rgba(59,53,97,0.18)";
  ctx.fill();
  if (filled) {
    ctx.beginPath();
    ctx.ellipse(-s * 0.4, -s * 0.35, s * 0.18, s * 0.1, -0.7, 0, TAU);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fill();
  }
  ctx.restore();
}

function keyIcon(ctx, x, y, s, have) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const color = have ? "#ffc928" : "rgba(59,53,97,0.25)";
  for (const [w, c] of [
    [s * 0.42, INK],
    [s * 0.22, color],
  ]) {
    ctx.lineWidth = w;
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.arc(-s * 0.45, 0, s * 0.32, 0, TAU);
    ctx.moveTo(-s * 0.13, 0);
    ctx.lineTo(s * 0.8, 0);
    ctx.moveTo(s * 0.62, 0);
    ctx.lineTo(s * 0.62, s * 0.32);
    ctx.moveTo(s * 0.36, 0);
    ctx.lineTo(s * 0.36, s * 0.24);
    ctx.stroke();
  }
  ctx.restore();
}

function lockIcon(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = s * 0.22;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.arc(0, -s * 0.15, s * 0.45, Math.PI, 0);
  ctx.stroke();
  roundRect(ctx, -s * 0.7, -s * 0.2, s * 1.4, s * 1.05, s * 0.2);
  ctx.fillStyle = "#ffd34d";
  ctx.fill();
  ctx.lineWidth = s * 0.14;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, s * 0.25, s * 0.14, 0, TAU);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.restore();
}

function crownIcon(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(-s, s * 0.5);
  ctx.lineTo(-s, -s * 0.35);
  ctx.lineTo(-s * 0.5, s * 0.05);
  ctx.lineTo(0, -s * 0.6);
  ctx.lineTo(s * 0.5, s * 0.05);
  ctx.lineTo(s, -s * 0.35);
  ctx.lineTo(s, s * 0.5);
  ctx.closePath();
  ctx.lineJoin = "round";
  ctx.lineWidth = s * 0.2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -s * 0.6, 0, s * 0.5);
  g.addColorStop(0, "#fff3a0");
  g.addColorStop(1, "#ffb000");
  ctx.fillStyle = g;
  ctx.fill();
  for (const [cx, color] of [
    [-s * 0.5, "#ff5f9e"],
    [0, "#3ec1ff"],
    [s * 0.5, "#5fd35f"],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, s * 0.22, s * 0.13, 0, TAU);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

function iconArrow(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.45, y - s * 0.6);
  ctx.lineTo(x + s * 0.6, y);
  ctx.lineTo(x - s * 0.45, y + s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function iconAgain(ctx, x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, s * 0.5, -0.3, Math.PI * 1.45);
  ctx.lineWidth = s * 0.26;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + s * 0.72, y - s * 0.55);
  ctx.lineTo(x + s * 0.68, y + s * 0.05);
  ctx.lineTo(x + s * 0.12, y - s * 0.12);
  ctx.closePath();
  ctx.fill();
}

function iconBack(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x + s * 0.45, y - s * 0.6);
  ctx.lineTo(x - s * 0.6, y);
  ctx.lineTo(x + s * 0.45, y + s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function iconEye(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.75, y);
  ctx.quadraticCurveTo(x, y - s * 0.75, x + s * 0.75, y);
  ctx.quadraticCurveTo(x, y + s * 0.75, x - s * 0.75, y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, s * 0.24, 0, TAU);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
}

function iconTilt(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.4);
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.55, 0, TAU);
  ctx.fill();
  ctx.fillStyle = INK;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * s * 0.2, -s * 0.08, s * 0.08, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, s * 0.12, s * 0.2, 0.2, Math.PI - 0.2);
  ctx.lineWidth = s * 0.08;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
}

function iconMap(ctx, x, y, s) {
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      roundRect(ctx, x - s * 0.6 + c * s * 0.65, y - s * 0.6 + r * s * 0.65, s * 0.55, s * 0.55, s * 0.12);
      ctx.fill();
    }
  }
}

function wrap(ctx, text, maxW) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function rainbowWord(ctx, word, cx, y, size, offset = 0, maxW = 900) {
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
  for (let i = 0; i < word.length; i++) {
    if (word[i] !== " ") {
      ctx.save();
      ctx.translate(x + widths[i] / 2, y + Math.sin(i * 1.3 + offset) * size * 0.06);
      ctx.rotate(Math.sin(i * 2.1 + offset) * 0.08);
      const color = RAINBOW[(i + offset) % RAINBOW.length];
      const g = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.3, color);
      g.addColorStop(1, color);
      stickerText(ctx, word[i], 0, 0, size, g);
      ctx.restore();
    }
    x += widths[i];
  }
}

function cardBackground(ctx, w, h, radius = 60) {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.shadowColor = "rgba(40, 20, 80, 0.35)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, 16, 12, w - 32, h - 36, radius);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#f3ecff");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  roundRect(ctx, 16, 12, w - 32, h - 36, radius);
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(155, 123, 255, 0.45)";
  ctx.stroke();
}

let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const canvas = makeCanvas(128, 128);
  const ctx = canvas.getContext("2d");
  ctx.filter = "blur(10px)";
  roundRect(ctx, 22, 22, 84, 84, 22);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  glowTex = canvasTexture(canvas);
  return glowTex;
}

function popper(group, speed = 3) {
  let age = 0;
  let on = false;
  return {
    show(delay = 0) {
      group.visible = true;
      on = true;
      age = -delay;
      group.scale.setScalar(0.001);
    },
    hide() {
      if (!group.visible || !on) return;
      on = false;
      age = 0;
    },
    update(dt) {
      if (!group.visible) return;
      age += dt;
      if (on) {
        group.scale.setScalar(age <= 0 ? 0.001 : Math.max(0.001, easeOutBack(age * speed)));
        return;
      }
      const s = 1 - age * 5;
      group.scale.setScalar(Math.max(0.001, s));
      if (s <= 0) group.visible = false;
    },
    get ready() {
      return group.visible && on && age * speed >= 0.8;
    },
    get on() {
      return on;
    },
  };
}

function panel(w, h, cw, ch, order = 20) {
  const canvas = makeCanvas(cw, ch);
  const ctx = canvas.getContext("2d");
  const texture = canvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }),
  );
  mesh.renderOrder = order;
  const group = new THREE.Group();
  group.add(mesh);
  group.visible = false;
  return { group, mesh, ctx, canvas, texture, w, h, cw, ch, pop: popper(group) };
}

// Interface no espaço 3D: tudo é escolhido olhando (a mira enche) ou clicando no computador.
export function createUI(scene) {
  const buttons = [];
  let focused = null;
  let time = 0;

  function place(group, x, y, z) {
    group.position.set(x, y, z);
    group.lookAt(facing);
    scene.add(group);
  }

  function makeButton(id, w, h, cw, ch, hold) {
    const p = panel(w, h, cw, ch, 22);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 1.35, h * 1.6),
      new THREE.MeshBasicMaterial({
        map: glowTexture(),
        color: "#fff6c0",
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    glow.renderOrder = 21;
    p.group.add(glow);
    const b = { ...p, id, hold, glow, focus: 0, shake: 0, pulse: false, enabled: true, data: null };
    buttons.push(b);
    return b;
  }

  function drawButton(b, label, colors, icon) {
    const { ctx, cw, ch } = b;
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.shadowColor = "rgba(40,20,80,0.35)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    roundRect(ctx, 10, 8, cw - 20, ch - 26, (ch - 26) / 2);
    const g = ctx.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    roundRect(ctx, 10, 8, cw - 20, ch - 26, (ch - 26) / 2);
    ctx.lineWidth = 7;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cw * 0.32, ch * 0.24, cw * 0.18, ch * 0.07, 0, 0, TAU);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fill();
    const size = ch * 0.36;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 6;
    const ix = cw * 0.2;
    const iy = (ch - 18) / 2 + 4;
    if (icon === "next") iconArrow(ctx, ix, iy, size);
    else if (icon === "again") iconAgain(ctx, ix, iy, size);
    else if (icon === "map") iconMap(ctx, ix, iy, size);
    else if (icon === "back") iconBack(ctx, ix, iy, size);
    else if (icon === "olhar") iconEye(ctx, ix, iy, size);
    else if (icon === "inclinar") iconTilt(ctx, ix, iy, size);
    let fs = ch * 0.34;
    ctx.font = `700 ${fs}px ${FONT}`;
    const avail = cw * 0.6;
    const tw = ctx.measureText(label).width + fs * 0.3;
    if (tw > avail) fs = Math.floor((fs * avail) / tw);
    stickerText(ctx, label, cw * 0.62, iy, fs, "#ffffff");
    b.texture.needsUpdate = true;
  }

  // ---------- Mapa de níveis ----------
  const title = panel(1.7, 0.425, 1024, 256);
  place(title.group, 0, EYE + 0.6, -2.15);
  const footer = panel(1.4, 0.175, 1024, 128);
  place(footer.group, 0, EYE - 0.66, -2.05);
  const tiles = LEVELS.map((level, i) => {
    const b = makeButton("level", 0.34, 0.34, 256, 256, 1.0);
    b.data = i;
    const col = i % 5;
    const row = Math.floor(i / 5);
    place(b.group, (col - 2) * 0.42, row === 0 ? EYE + 0.13 : EYE - 0.31, -2.1 + Math.abs(col - 2) * 0.06);
    return b;
  });

  function drawTile(b, level, i, best, open) {
    const { ctx } = b;
    ctx.clearRect(0, 0, 256, 256);
    const colors = open ? TILE_COLORS[level.theme] : ["#d9d4e6", "#a29bb8"];
    ctx.save();
    ctx.shadowColor = "rgba(40,20,80,0.35)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    roundRect(ctx, 14, 10, 228, 228, 48);
    const g = ctx.createLinearGradient(0, 10, 0, 238);
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    roundRect(ctx, 14, 10, 228, 228, 48);
    ctx.lineWidth = level.finale ? 12 : 8;
    ctx.strokeStyle = level.finale && open ? "#ffd34d" : INK;
    ctx.stroke();
    if (level.finale && open) {
      roundRect(ctx, 24, 20, 208, 208, 40);
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(90, 46, 56, 16, -0.15, 0, TAU);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fill();
    if (!open) {
      lockIcon(ctx, 128, 110, 56);
      stickerText(ctx, String(i + 1), 128, 206, 44, "#ffffff");
    } else {
      if (level.finale) {
        crownIcon(ctx, 128, 62, 44);
        stickerText(ctx, String(i + 1), 128, 136, 92, "#ffffff");
      } else stickerText(ctx, String(i + 1), 128, 112, 124, "#ffffff");
      for (let k = 0; k < 3; k++) drawStar(ctx, 128 + (k - 1) * 58, 196 - (k === 1 ? 6 : 0), k === 1 ? 26 : 22, k < best);
    }
    b.texture.needsUpdate = true;
  }

  function drawTitle(total) {
    const { ctx } = title;
    ctx.clearRect(0, 0, 1024, 256);
    rainbowWord(ctx, "LABIRINTO MÁGICO", 512, 96, 118);
    roundRect(ctx, 362, 168, 300, 72, 36);
    ctx.fillStyle = "#fff4c2";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    drawStar(ctx, 412, 204, 26);
    ctx.font = `700 48px ${FONT}`;
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${total} / ${TOTAL_STARS}`, 538, 207);
    title.texture.needsUpdate = true;
  }

  function drawFooter(mode) {
    const { ctx } = footer;
    ctx.clearRect(0, 0, 1024, 128);
    roundRect(ctx, 40, 14, 944, 100, 50);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const how = mode === "inclinar" ? "incline a cabeça para rolar" : "olhe para onde a bolinha deve ir";
    const text = `Olhe um número e espere  •  No jogo: ${how}`;
    let size = 40;
    ctx.font = `600 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width;
    if (w > 880) {
      size = Math.floor((size * 880) / w);
      ctx.font = `600 ${size}px ${FONT}`;
    }
    ctx.fillText(text, 512, 66);
    footer.texture.needsUpdate = true;
  }

  const mapGames = makeButton("games", 0.4, 0.17, 512, 218, 1.2);
  place(mapGames.group, -0.52, EYE - 0.95, -2.0);
  drawButton(mapGames, "JOGOS", ["#b197fc", "#7950f2"], "back");
  const mapControl = makeButton("control", 0.7, 0.17, 896, 218, 1.2);
  place(mapControl.group, 0.3, EYE - 0.95, -2.0);

  function setControl(mode) {
    drawFooter(mode);
    drawButton(mapControl, mode === "inclinar" ? "CONTROLE: INCLINAR" : "CONTROLE: OLHAR", ["#ffe066", "#f08c00"], mode);
  }

  function showMap(progress, suggested, mode, games = true) {
    drawTitle(progress.total());
    setControl(mode);
    title.pop.show(0);
    footer.pop.show(0.3);
    mapControl.pop.show(0.7);
    if (games) mapGames.pop.show(0.75);
    tiles.forEach((b, i) => {
      const open = progress.unlocked(i);
      drawTile(b, LEVELS[i], i, Math.max(0, progress.stars(i)), open);
      b.enabled = true;
      b.data = i;
      b.locked = !open;
      b.hold = open ? 1.0 : 0.6;
      b.pulse = i === suggested;
      b.pop.show(0.1 + i * 0.05);
    });
  }

  function hideMap() {
    title.pop.hide();
    footer.pop.hide();
    mapGames.pop.hide();
    mapControl.pop.hide();
    for (const b of tiles) b.pop.hide();
  }

  // ---------- Placa durante o jogo ----------
  const hud = panel(1.04, 0.1625, 1024, 160, 18);
  place(hud.group, 0, 1.14, -1.82);
  let hudKey = "";
  let hudBump = 0;

  function drawHud({ label, hearts, maxHearts, stars, starsTotal, key }) {
    const k = `${label}|${hearts}|${maxHearts}|${stars}|${starsTotal}|${key}`;
    if (k === hudKey) return;
    hudKey = k;
    const { ctx } = hud;
    ctx.clearRect(0, 0, 1024, 160);
    roundRect(ctx, 8, 10, 1008, 140, 70);
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(59,53,97,0.35)";
    ctx.stroke();
    stickerText(ctx, label, 150, 82, 54, "#9b7bff");
    const hx = 330;
    for (let i = 0; i < maxHearts; i++) heart(ctx, hx + i * 70, 82, 26, i < hearts);
    let sx = 730;
    if (key !== null) {
      keyIcon(ctx, 690, 80, 46, key);
      sx = 800;
    }
    for (let i = 0; i < starsTotal; i++) drawStar(ctx, sx + i * 66, 80, 27, i < stars);
    hud.texture.needsUpdate = true;
  }

  function showHud(on) {
    if (on && !hud.pop.on) hud.pop.show(0);
    else if (!on) hud.pop.hide();
  }

  const playMap = makeButton("play-map", 0.26, 0.115, 256, 114, 1.6);
  place(playMap.group, -0.98, 1.08, -1.5);
  drawButton(playMap, "MAPA", ["#74c0fc", "#3b82e0"], "map");

  function showPlayMap(on) {
    if (on && !playMap.pop.on) playMap.pop.show(0.5);
    else if (!on) playMap.pop.hide();
  }

  // ---------- Faixa de aviso ----------
  const banner = panel(1.25, 0.49, 1024, 400, 30);
  place(banner.group, 0, 1.2, -1.5);
  let bannerLeft = 0;

  function showBanner(text, sub = "", color = "#ff5f9e", seconds = 1.6) {
    const { ctx } = banner;
    ctx.clearRect(0, 0, 1024, 400);
    const big = text.length > 12 ? 112 : 150;
    stickerText(ctx, text, 512, sub ? 140 : 200, big, color);
    if (sub) {
      ctx.font = `600 50px ${FONT}`;
      const lines = wrap(ctx, sub, 900).slice(0, 2);
      lines.forEach((line, i) => {
        const y = 270 + i * 64;
        ctx.save();
        ctx.font = `600 50px ${FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineJoin = "round";
        ctx.lineWidth = 14;
        ctx.strokeStyle = "rgba(255,255,255,0.95)";
        ctx.strokeText(line, 512, y);
        ctx.fillStyle = INK;
        ctx.fillText(line, 512, y);
        ctx.restore();
      });
    }
    banner.texture.needsUpdate = true;
    banner.pop.show(0);
    bannerLeft = seconds;
  }

  // ---------- Resultado do nível ----------
  const results = panel(1.15, 0.72, 1024, 640, 24);
  place(results.group, 0, 1.5, -1.65);
  const resNext = makeButton("next", 0.4, 0.17, 512, 218, 1.0);
  const resAgain = makeButton("again", 0.4, 0.17, 512, 218, 1.0);
  const resMap = makeButton("map", 0.4, 0.17, 512, 218, 1.0);
  drawButton(resNext, "PRÓXIMO", ["#8ce99a", "#2f9e44"], "next");
  drawButton(resAgain, "DE NOVO", ["#ffe066", "#f08c00"], "again");
  drawButton(resMap, "MAPA", ["#74c0fc", "#3b82e0"], "map");
  for (const b of [resNext, resAgain, resMap]) scene.add(b.group);
  let resultData = null;

  function drawResults(revealed) {
    const d = resultData;
    const { ctx } = results;
    cardBackground(ctx, 1024, 640);
    const headline = ["CHEGOU!", "CONSEGUIU!", "MUITO BEM!", "PERFEITO!"][d.stars];
    rainbowWord(ctx, headline, 512, 104, 104, d.stars);
    ctx.font = `600 44px ${FONT}`;
    ctx.fillStyle = "rgba(59,53,97,0.8)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Nível ${d.index + 1}: ${d.name}`, 512, 196);
    for (let i = 0; i < 3; i++) {
      const filled = i < Math.min(d.stars, revealed);
      drawStar(ctx, 512 + (i - 1) * 200, 330 - (i === 1 ? 22 : 0), i === 1 ? 86 : 70, filled);
    }
    if (revealed >= d.stars) {
      if (d.isNew && !d.first) {
        roundRect(ctx, 292, 470, 440, 80, 40);
        const g = ctx.createLinearGradient(292, 0, 732, 0);
        g.addColorStop(0, "#ff5f9e");
        g.addColorStop(0.5, "#ffb000");
        g.addColorStop(1, "#3ec1ff");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = INK;
        ctx.stroke();
        stickerText(ctx, "NOVO RECORDE!", 512, 510, 52, "#ffffff");
      } else if (d.stars < 3) {
        ctx.font = `600 40px ${FONT}`;
        ctx.fillStyle = "rgba(59,53,97,0.75)";
        ctx.fillText("Pegue todas as estrelas para ganhar 3!", 512, 510);
      } else {
        chickFace(ctx, 512, 510, 44);
      }
    }
    results.texture.needsUpdate = true;
  }

  function showResults(data) {
    resultData = data;
    drawResults(0);
    results.pop.show(0);
    const list = data.hasNext ? [resNext, resAgain, resMap] : [resAgain, resMap];
    resNext.enabled = data.hasNext;
    list.forEach((b, i) => {
      b.group.position.set((i - (list.length - 1) / 2) * 0.45, 1.02, -1.6);
      b.group.lookAt(facing);
      b.pulse = b === list[0];
      b.pop.show(0.6 + i * 0.12);
    });
  }

  function revealStars(n) {
    if (resultData) drawResults(n);
  }

  function hideResults() {
    results.pop.hide();
    for (const b of [resNext, resAgain, resMap]) b.pop.hide();
  }

  // ---------- Grande final ----------
  const finale = panel(1.7, 1.02, 1024, 614, 24);
  place(finale.group, 0, 1.78, -2.3);
  const finaleMap = makeButton("finale-map", 0.6, 0.255, 512, 218, 1.2);
  place(finaleMap.group, 0, 1.02, -2.1);
  drawButton(finaleMap, "MAPA", ["#74c0fc", "#3b82e0"], "map");

  function showFinale(total) {
    const { ctx } = finale;
    cardBackground(ctx, 1024, 614, 80);
    rainbowWord(ctx, "PARABÉNS!", 512, 120, 150);
    stickerText(ctx, "VOCÊ VENCEU O", 512, 256, 56, "#9b7bff");
    stickerText(ctx, "LABIRINTO MÁGICO!", 512, 330, 62, "#ff9f43");
    for (const side of [-1, 1]) {
      chickFace(ctx, 512 + side * 400, 312, 50);
      crownIcon(ctx, 512 + side * 400, 248, 30);
    }
    roundRect(ctx, 322, 430, 380, 92, 46);
    ctx.fillStyle = "#fff4c2";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    drawStar(ctx, 386, 476, 32);
    ctx.font = `700 58px ${FONT}`;
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${total} / ${TOTAL_STARS}`, 540, 480);
    finale.texture.needsUpdate = true;
    finale.pop.show(0);
  }

  function showFinaleButton(on) {
    if (on) {
      finaleMap.pulse = true;
      finaleMap.pop.show(0);
    } else finaleMap.pop.hide();
  }

  function hideFinale() {
    finale.pop.hide();
    finaleMap.pop.hide();
  }

  // ---------- Mira ----------
  function pick(origin, dir, hit) {
    for (const b of buttons) {
      if (!b.enabled || !b.pop.ready) continue;
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

  function setFocus(target) {
    focused = target;
  }

  function shake(b) {
    b.shake = 1;
  }

  function hideAll() {
    hideMap();
    showHud(false);
    showPlayMap(false);
    hideResults();
    hideFinale();
    banner.pop.hide();
  }

  function update(dt) {
    time += dt;
    for (const p of [title, footer, hud, banner, results, finale]) p.pop.update(dt);
    if (bannerLeft > 0) {
      bannerLeft -= dt;
      if (bannerLeft <= 0) banner.pop.hide();
    }
    hudBump = Math.max(0, hudBump - dt * 4);
    hud.mesh.scale.setScalar(1 + hudBump * 0.08);
    for (const b of buttons) {
      b.pop.update(dt);
      if (!b.group.visible) continue;
      b.focus += ((focused === b ? 1 : 0) - b.focus) * Math.min(1, dt * 12);
      b.shake = Math.max(0, b.shake - dt * 2.5);
      const pulse = b.pulse ? 0.04 + Math.sin(time * 4) * 0.04 : 0;
      b.mesh.scale.setScalar(1 + b.focus * 0.1 + pulse);
      b.mesh.position.x = Math.sin(b.shake * 40) * b.shake * 0.025;
      b.glow.material.opacity = Math.max(b.focus * 0.9, b.pulse ? 0.25 + Math.sin(time * 4) * 0.15 : 0);
    }
  }

  return {
    pick,
    setFocus,
    shake,
    showMap,
    hideMap,
    setControl,
    drawHud,
    showHud,
    bumpHud: () => {
      hudBump = 1;
    },
    showPlayMap,
    showBanner,
    showResults,
    revealStars,
    hideResults,
    showFinale,
    showFinaleButton,
    hideFinale,
    hideAll,
    update,
  };
}
