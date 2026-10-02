import * as THREE from "three";
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
  mergeAll,
  rand,
  roundRect,
  stickerText,
  xf,
} from "../shared/util.js";

const LOGO_COLORS = ["#ff5f9e", "#ff9f43", "#ffd32e", "#5fd35f", "#3ec1ff", "#9b7bff", "#ff6fcf"];
const fwd = new THREE.Vector3();

export function headYaw(head) {
  fwd.set(0, 0, -1).applyQuaternion(head.quaternion);
  return Math.atan2(-fwd.x, -fwd.z);
}

function cloudBackdrop(w, h) {
  const parts = [];
  const n = Math.round((w + h) * 3.2);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const per = 2 * (w + h);
    let d = t * per;
    let x;
    let y;
    if (d < w) {
      x = -w / 2 + d;
      y = h / 2;
    } else if ((d -= w) < h) {
      x = w / 2;
      y = h / 2 - d;
    } else if ((d -= h) < w) {
      x = w / 2 - d;
      y = -h / 2;
    } else {
      d -= w;
      x = -w / 2;
      y = -h / 2 + d;
    }
    const geo = blob(rand(0.22, 0.36), 1, 0.3, i);
    gradient(geo, "#efe3ff", "#ffffff", 0.8);
    xf(geo, 0, 0, 0, 0, 0, 0, 1, 1, 0.3);
    xf(geo, x * 1.04, y * 1.06, rand(-0.24, -0.16));
    parts.push(geo);
  }
  return new THREE.Mesh(
    mergeAll(parts),
    new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x9a92a8 }),
  );
}

function createBoard(width, height, cw, ch) {
  const canvas = makeCanvas(cw, ch);
  const ctx = canvas.getContext("2d");
  const texture = canvasTexture(canvas);
  const group = new THREE.Group();
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false, depthWrite: false }),
  );
  panel.renderOrder = 3;
  group.add(cloudBackdrop(width, height), panel);
  group.visible = false;
  let age = 0;
  let hiding = false;
  let baseY = 0;

  function show(head, yaw, dist, y) {
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    group.position.copy(head.position).addScaledVector(fwd, dist);
    group.position.y = y;
    baseY = y;
    group.rotation.set(0, yaw, 0);
    group.visible = true;
    group.scale.setScalar(0.001);
    age = 0;
    hiding = false;
  }

  function hide() {
    if (!group.visible) return;
    hiding = true;
    age = 0;
  }

  function update(dt) {
    if (!group.visible) return;
    age += dt;
    if (hiding) {
      const s = Math.max(0, 1 - age / 0.3);
      group.scale.setScalar(Math.max(0.001, s));
      if (s <= 0) group.visible = false;
      return;
    }
    group.scale.setScalar(Math.max(0.001, easeOutBack(age * 2.2)));
    group.position.y = baseY + Math.sin(age * 1.2) * 0.04;
  }

  return { group, ctx, canvas, texture, show, hide, update, get visible() {
    return group.visible && !hiding;
  } };
}

function panelBackground(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  roundRect(ctx, 6, 6, w - 12, h - 12, 70);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#fff1f8");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(255, 170, 215, 0.55)";
  ctx.stroke();
}

function drawLogo(ctx, w, h, record) {
  panelBackground(ctx, w, h);
  const lines = [
    ["ESTOURA", 168, h * 0.27],
    ["BOLHAS", 210, h * 0.63],
  ];
  let ci = 0;
  for (const [word, size, y] of lines) {
    ctx.font = `700 ${size}px ${FONT}`;
    const widths = [...word].map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + (word.length - 1) * 4;
    let x = (w - total) / 2;
    for (let i = 0; i < word.length; i++) {
      const cx = x + widths[i] / 2;
      ctx.save();
      ctx.translate(cx, y + Math.sin(i * 1.3 + ci) * 10);
      ctx.rotate(Math.sin(i * 2.1 + ci) * 0.08);
      const g = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
      const color = LOGO_COLORS[ci % LOGO_COLORS.length];
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.3, color);
      g.addColorStop(1, color);
      stickerText(ctx, word[i], 0, 0, size, g);
      ctx.restore();
      x += widths[i] + 4;
      ci++;
    }
  }
  for (const [x, y, r] of [
    [70, 80, 34],
    [130, 150, 18],
    [950, 70, 28],
    [900, 140, 16],
    [960, 400, 30],
    [60, 420, 22],
  ]) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.15)");
    g.addColorStop(0.75, "rgba(180,220,255,0.25)");
    g.addColorStop(1, "rgba(255,140,220,0.75)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(59,53,97,0.35)";
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.25, r * 0.13, -0.6, 0, TAU);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();
    ctx.restore();
  }
  if (record > 0) {
    ctx.save();
    roundRect(ctx, w / 2 - 190, h - 82, 380, 64, 32);
    ctx.fillStyle = "#fff4c2";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#3b3561";
    ctx.stroke();
    drawStar(ctx, w / 2 - 140, h - 50, 22);
    ctx.font = `700 40px ${FONT}`;
    ctx.fillStyle = "#3b3561";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`RECORDE: ${record}`, w / 2 + 18, h - 48);
    ctx.restore();
  }
}

export function makeLabel(lines, color) {
  const canvas = makeCanvas(512, 256);
  const ctx = canvas.getContext("2d");
  let size = lines.length > 1 ? 100 : 120;
  ctx.font = `700 ${size}px ${FONT}`;
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
  if (widest > 440) size = Math.floor((size * 440) / widest);
  lines.forEach((line, i) => {
    const y = 128 + (i - (lines.length - 1) / 2) * size * 0.98;
    stickerText(ctx, line, 256, y, size, color);
  });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.85),
    new THREE.MeshBasicMaterial({
      map: canvasTexture(canvas),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  mesh.renderOrder = 1;
  return mesh;
}

export function makeNumber(n, color) {
  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext("2d");
  stickerText(ctx, String(n), 128, 132, n >= 10 ? 150 : 180, color);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({
      map: canvasTexture(canvas),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  mesh.renderOrder = 1;
  return mesh;
}

function clockFace(ctx, cx, cy, seconds, frac, color) {
  ctx.beginPath();
  ctx.arc(cx, cy, 62, 0, TAU);
  ctx.fillStyle = "#eef9ff";
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.strokeStyle = "rgba(59,53,97,0.15)";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 62, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.font = `700 ${seconds >= 100 ? 48 : 60}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#3b3561";
  ctx.fillText(String(seconds), cx, cy + 4);
}

function numberBadge(ctx, cx, cy, r, text) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.7, "#d8f3ff");
  g.addColorStop(1, "#9fdcff");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = r * 0.14;
  ctx.strokeStyle = "#3b3561";
  ctx.stroke();
  ctx.font = `700 ${r * 1.15}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#3b3561";
  ctx.fillText(text, cx, cy + r * 0.08);
  ctx.restore();
}

export function createHud(scene) {
  const canvas = makeCanvas(1024, 192);
  const ctx = canvas.getContext("2d");
  const texture = canvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    opacity: 0,
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.225), material);
  panel.position.set(0, -0.62, -2.1);
  panel.rotation.x = 0.28;
  panel.renderOrder = 50;
  const group = new THREE.Group();
  group.add(panel);
  group.visible = false;
  scene.add(group);

  let yaw = 0;
  let shown = false;
  let opacity = 0;
  let last = "";
  let pulse = 0;

  function draw(score, friends, seconds, total) {
    const key = `${score}|${friends}|${seconds}`;
    if (key === last) return;
    last = key;
    ctx.clearRect(0, 0, 1024, 192);
    roundRect(ctx, 10, 14, 1004, 164, 82);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(59,53,97,0.3)";
    ctx.stroke();
    drawStar(ctx, 104, 96, 50);
    ctx.font = `700 100px ${FONT}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = "#3b3561";
    ctx.fillText(String(score), 172, 100);
    chickFace(ctx, 540, 96, 48);
    ctx.fillText(String(friends), 606, 100);
    const frac = Math.max(0, seconds / total);
    const warn = seconds <= 10;
    ctx.beginPath();
    ctx.arc(912, 96, 62, 0, TAU);
    ctx.fillStyle = warn ? "#ffe3e3" : "#eef9ff";
    ctx.fill();
    ctx.lineWidth = 16;
    ctx.strokeStyle = "rgba(59,53,97,0.15)";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(912, 96, 62, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
    ctx.strokeStyle = warn ? "#ff4d6d" : seconds <= 25 ? "#ffa94d" : "#40c057";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.font = `700 60px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillStyle = warn ? "#d6336c" : "#3b3561";
    ctx.fillText(String(seconds), 912, 100);
    texture.needsUpdate = true;
  }

  // Modo Números: próximo número, quantos já foram, amigos e cronômetro (sobe, sem limite).
  function drawNumbers(next, found, total, friends, seconds) {
    const key = `n|${next}|${found}|${friends}|${seconds}`;
    if (key === last) return;
    last = key;
    ctx.clearRect(0, 0, 1024, 192);
    roundRect(ctx, 10, 14, 1004, 164, 82);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(59,53,97,0.3)";
    ctx.stroke();
    numberBadge(ctx, 104, 96, 56, next ? String(next) : "✓");
    ctx.font = `700 84px ${FONT}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = "#3b3561";
    ctx.fillText(`${found}/${total}`, 182, 100);
    chickFace(ctx, 560, 96, 48);
    ctx.font = `700 100px ${FONT}`;
    ctx.fillText(String(friends), 626, 100);
    clockFace(ctx, 912, 96, seconds, (seconds % 60) / 60 || 1, "#3ec1ff");
    texture.needsUpdate = true;
  }

  function show(on, head) {
    shown = on;
    if (on) {
      group.visible = true;
      yaw = headYaw(head);
    }
  }

  function bump() {
    pulse = 1;
  }

  function update(dt, head) {
    opacity += ((shown ? 1 : 0) - opacity) * Math.min(1, dt * 6);
    material.opacity = opacity;
    if (!shown && opacity < 0.01) {
      group.visible = false;
      return;
    }
    const target = headYaw(head);
    const diff = angleDiff(target, yaw);
    yaw += diff * Math.min(1, dt * (Math.abs(diff) > 0.45 ? 4 : 0.6));
    group.position.copy(head.position);
    group.rotation.set(0, yaw, 0);
    pulse = Math.max(0, pulse - dt * 4);
    panel.scale.setScalar(1 + pulse * 0.06);
  }

  const title = createBoard(3.8, 1.9, 1024, 512);
  scene.add(title.group);
  function drawTitle(record) {
    drawLogo(title.ctx, 1024, 512, record);
    title.texture.needsUpdate = true;
  }

  const results = createBoard(3.0, 2.25, 1024, 768);
  scene.add(results.group);
  function drawResults({ mode, score, time, stars, revealed, record, isRecord, friends }) {
    const c = results.ctx;
    const numbers = mode === "numeros";
    panelBackground(c, 1024, 768);
    const headline = stars >= 3 ? "SUPER ESTRELA!" : stars === 2 ? "INCRÍVEL!" : "MUITO BEM!";
    stickerText(c, headline, 512, 92, 96, "#ff5f9e");
    for (let i = 0; i < 3; i++) {
      const filled = i < Math.min(stars, revealed);
      const big = i === 1 ? 92 : 76;
      drawStar(c, 512 + (i - 1) * 210, 250 - (i === 1 ? 20 : 0), big, filled);
    }
    c.save();
    c.font = `700 52px ${FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#3b3561";
    c.fillText(numbers ? "TEMPO" : "PONTOS", 300, 410);
    c.fillText("AMIGOS", 724, 410);
    c.restore();
    stickerText(c, numbers ? `${time}s` : String(score), 300, 495, 120, "#ffb000");
    chickFace(c, 660, 495, 50);
    stickerText(c, String(friends), 790, 495, 120, "#3ec1ff");
    if (isRecord) {
      roundRect(c, 262, 590, 500, 84, 42);
      const g = c.createLinearGradient(262, 0, 762, 0);
      g.addColorStop(0, "#ff5f9e");
      g.addColorStop(0.5, "#ffb000");
      g.addColorStop(1, "#3ec1ff");
      c.fillStyle = g;
      c.fill();
      c.lineWidth = 6;
      c.strokeStyle = "#3b3561";
      c.stroke();
      stickerText(c, "NOVO RECORDE!", 512, 632, 60, "#ffffff");
    } else if (record > 0) {
      c.save();
      c.font = `600 44px ${FONT}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "rgba(59,53,97,0.75)";
      c.fillText(numbers ? `MELHOR TEMPO: ${record}s` : `RECORDE: ${record}`, 512, 632);
      c.restore();
    }
    results.texture.needsUpdate = true;
  }

  const ALBUM_W = 4.2;
  const ALBUM_H = 2.95;
  const album = createBoard(ALBUM_W, ALBUM_H, 1024, 720);
  scene.add(album.group);

  // Devolve, para cada bichinho, a posição (local da placa) onde o modelo 3D deve ficar.
  function drawAlbum(entries) {
    const c = album.ctx;
    panelBackground(c, 1024, 720);
    stickerText(c, "ÁLBUM DOS AMIGOS", 512, 66, 62, "#ff5f9e");
    const found = entries.filter((e) => e.state === "found").length;
    c.save();
    c.font = `600 32px ${FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "rgba(59,53,97,0.75)";
    c.fillText(`${found} de ${entries.length} amigos`, 512, 118);
    c.restore();
    const spots = [];
    entries.forEach((e, i) => {
      const cx = i < 10 ? 132 + (i % 5) * 190 : 322 + (i - 10) * 190;
      const cy = i < 5 ? 225 : i < 10 ? 405 : 590;
      c.save();
      roundRect(c, cx - 84, cy - 80, 168, 152, 30);
      c.fillStyle = e.rare ? "#fff4c2" : "#eef9ff";
      c.fill();
      c.lineWidth = e.rare ? 7 : 5;
      c.strokeStyle = e.rare ? "#ffb000" : "rgba(59,53,97,0.25)";
      c.stroke();
      c.textAlign = "center";
      c.textBaseline = "middle";
      if (e.state === "found") {
        c.font = `600 ${e.name.length > 9 ? 23 : 26}px ${FONT}`;
        c.fillStyle = "#3b3561";
        c.fillText(e.name, cx, cy + 50);
        c.beginPath();
        c.arc(cx + 66, cy - 64, 27, 0, TAU);
        c.fillStyle = e.rare ? "#ffb000" : "#ff5f9e";
        c.fill();
        c.lineWidth = 4;
        c.strokeStyle = "#3b3561";
        c.stroke();
        c.font = `700 ${e.count >= 100 ? 20 : 26}px ${FONT}`;
        c.fillStyle = "#ffffff";
        c.fillText(String(e.count), cx + 66, cy - 62);
      } else if (e.state === "unlocked") {
        stickerText(c, "?", cx, cy - 14, 84, "#ffb000");
        c.font = `600 24px ${FONT}`;
        c.fillStyle = "#3b3561";
        c.fillText("PROCURE!", cx, cy + 50);
      } else {
        stickerText(c, "?", cx, cy - 24, 64, "#c9c3dd");
        c.font = `600 19px ${FONT}`;
        c.fillStyle = "rgba(59,53,97,0.85)";
        const hint = e.hint ?? ["", ""];
        c.fillText(hint[0], cx, cy + 28);
        c.fillText(hint[1], cx, cy + 52);
      }
      c.restore();
      spots.push({ x: (cx / 1024 - 0.5) * ALBUM_W, y: (0.5 - (cy - 18) / 720) * ALBUM_H });
    });
    album.texture.needsUpdate = true;
    return spots;
  }

  return {
    group,
    draw,
    drawNumbers,
    show,
    bump,
    update,
    title,
    drawTitle,
    results,
    drawResults,
    album,
    drawAlbum,
  };
}
