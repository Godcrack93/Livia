import * as THREE from "three";
import { FONT, TAU, canvasTexture, drawStar, easeOutBack, makeCanvas, roundRect, stickerText } from "../shared/util.js";
import { EYE } from "../shared/vr.js";
import { CANDIES } from "./basket.js";
import { glowTexture } from "./lantern.js";
import { LEVELS, NIGHTS } from "./nights.js";

const INK = "#1b1a3a";
const inv = new THREE.Matrix4();
const lo = new THREE.Vector3();
const ld = new THREE.Vector3();
const hp = new THREE.Vector3();
const fwd = new THREE.Vector3();

function fitText(ctx, text, x, y, size, color, maxW, opts) {
  ctx.font = `700 ${size}px ${FONT}`;
  const w = ctx.measureText(text).width + size * 0.3;
  stickerText(ctx, text, x, y, w > maxW ? Math.floor((size * maxW) / w) : size, color, opts);
}

// Número pseudoaleatório fixo: as estrelinhas de enfeite ficam sempre no mesmo lugar.
function seeded(seed) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function cardBack(ctx, cw, ch, { top = "#283070", bottom = "#121842", border = "rgba(255,216,107,0.85)", r = 44, lw = 7 } = {}) {
  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, 14, 10, cw - 28, ch - 32, r);
  const g = ctx.createLinearGradient(0, 0, 0, ch);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  roundRect(ctx, 14, 10, cw - 28, ch - 32, r);
  ctx.lineWidth = lw;
  ctx.strokeStyle = border;
  ctx.stroke();
}

function sparkles(ctx, cw, ch, n, seed) {
  const rnd = seeded(seed);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x = 40 + rnd() * (cw - 80);
    const y = 30 + rnd() * (ch - 80);
    const s = 1.5 + rnd() * 3;
    ctx.globalAlpha = 0.35 + rnd() * 0.5;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, s * 0.5, 0, TAU);
    ctx.fill();
    ctx.fillRect(x - s * 1.6, y - 0.6, s * 3.2, 1.2);
    ctx.fillRect(x - 0.6, y - s * 1.6, 1.2, s * 3.2);
  }
  ctx.restore();
}

function moon(ctx, x, y, r, dim) {
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.45);
  glow.addColorStop(0, dim ? "rgba(150,150,180,0.25)" : "rgba(255,236,170,0.45)");
  glow.addColorStop(1, "rgba(255,236,170,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.45, 0, TAU);
  ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, dim ? "#b8b8c8" : "#fffbe8");
  g.addColorStop(1, dim ? "#7c7c92" : "#ffd98a");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = dim ? "rgba(90,90,110,0.35)" : "rgba(214,160,80,0.32)";
  for (const [dx, dy, rr] of [
    [-0.42, -0.28, 0.16],
    [0.38, 0.32, 0.2],
    [0.18, -0.46, 0.1],
    [-0.3, 0.45, 0.11],
  ]) {
    ctx.beginPath();
    ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function ghostIcon(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-40, 10);
  ctx.bezierCurveTo(-40, -58, 40, -58, 40, 10);
  ctx.lineTo(40, 38);
  for (let i = 0; i < 4; i++) {
    const x0 = 40 - i * 20;
    ctx.quadraticCurveTo(x0 - 5, i % 2 === 0 ? 50 : 26, x0 - 10, 38);
    ctx.quadraticCurveTo(x0 - 15, i % 2 === 0 ? 26 : 50, x0 - 20, 38);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = INK;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 14, -8, 7, 9, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,130,180,0.8)";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 25, 8, 6, 3.5, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function lanternIcon(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 62);
  glow.addColorStop(0, "rgba(255,210,120,0.75)");
  glow.addColorStop(1, "rgba(255,210,120,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 62, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.arc(0, -36, 12, Math.PI, TAU);
  ctx.stroke();
  roundRect(ctx, -22, -32, 44, 10, 4);
  ctx.fillStyle = "#3a2f5e";
  ctx.fill();
  roundRect(ctx, -18, -22, 36, 42, 8);
  ctx.fillStyle = "#ffd27a";
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff6de";
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 11, 0, 0, TAU);
  ctx.fill();
  roundRect(ctx, -22, 20, 44, 10, 4);
  ctx.fillStyle = "#3a2f5e";
  ctx.fill();
  ctx.restore();
}

function candyIcon(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-24, 6);
  ctx.lineTo(24, 6);
  ctx.lineTo(18, 24);
  ctx.lineTo(-18, 24);
  ctx.closePath();
  ctx.fillStyle = "#ff9cc8";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -4, 20, 0, TAU);
  ctx.fillStyle = "#5a2d18";
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#2a120a";
  const rnd = seeded(7);
  for (let i = 0; i < 14; i++) ctx.fillRect(-14 + rnd() * 26, -18 + rnd() * 26, 4, 1.6);
  ctx.restore();
}

function fireflyIcon(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const glow = ctx.createRadialGradient(0, 6, 2, 0, 6, 34);
  glow.addColorStop(0, "rgba(232,255,122,0.95)");
  glow.addColorStop(1, "rgba(232,255,122,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 6, 34, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 11, -8, 10, 6, side * 0.5, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(0, -6, 7, 9, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#e8ff7a";
  ctx.beginPath();
  ctx.ellipse(0, 8, 8, 10, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function lockIcon(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 9;
  ctx.strokeStyle = "#e9ecef";
  ctx.beginPath();
  ctx.arc(0, -10, 18, Math.PI, TAU);
  ctx.lineTo(18, 4);
  ctx.moveTo(-18, 4);
  ctx.lineTo(-18, -10);
  ctx.stroke();
  roundRect(ctx, -28, 0, 56, 44, 10);
  ctx.fillStyle = "#e9ecef";
  ctx.fill();
  ctx.fillStyle = "#495057";
  ctx.beginPath();
  ctx.arc(0, 18, 7, 0, TAU);
  ctx.fill();
  ctx.fillRect(-3, 18, 6, 14);
  ctx.restore();
}

function pill(ctx, cw, ch, colors) {
  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
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
}

function panel(w, h, cw, ch) {
  const canvas = makeCanvas(cw, ch);
  const ctx = canvas.getContext("2d");
  const texture = canvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, fog: false }),
  );
  mesh.renderOrder = 22;
  const group = new THREE.Group();
  group.add(mesh);
  group.visible = false;
  return { group, mesh, ctx, texture, w, h, cw, ch, age: 0, delay: 0, hiding: false, focus: 0 };
}

// Telas dentro do óculos: título com as 5 noites, nível de susto, JOGOS e o resultado ao amanhecer.
export function createUI(scene) {
  const all = [];
  const buttons = [];
  let focused = null;
  let clock = 0;
  let progressRef = null;
  let suggested = 0;
  let levelIndex = 2;

  function add(p) {
    scene.add(p.group);
    all.push(p);
    return p;
  }

  function button(id, w, h, cw, ch, hold) {
    const p = add(panel(w, h, cw, ch));
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 1.3, h * 1.45),
      new THREE.MeshBasicMaterial({
        map: glowTexture(),
        color: "#fff1b8",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        fog: false,
      }),
    );
    glow.position.z = -0.01;
    glow.renderOrder = 21;
    p.group.add(glow);
    const b = Object.assign(p, { id, hold, glow, enabled: true });
    buttons.push(b);
    return b;
  }

  const title = add(panel(2.3, 0.7, 1024, 312));
  const nights = NIGHTS.map((_, i) => Object.assign(button("night", 0.5, 0.62, 400, 496, 1.2), { index: i }));
  const scare = button("scare", 0.9, 0.21, 840, 196, 1.0);
  const games = button("games", 0.52, 0.21, 486, 196, 1.2);
  const results = add(panel(1.9, 1.05, 1024, 566));
  const again = button("again", 0.56, 0.21, 532, 200, 1.2);
  const next = button("next", 0.56, 0.21, 532, 200, 1.2);
  const back = button("back", 0.56, 0.21, 532, 200, 1.2);

  function drawTitle() {
    const { ctx, cw, ch } = title;
    cardBack(ctx, cw, ch, { r: 60, top: "#2a2f73", bottom: "#141943" });
    sparkles(ctx, cw, ch, 30, 3);
    lanternIcon(ctx, 128, 140, 1.35);
    ghostIcon(ctx, 900, 128, 1.15, "#eaf2ff");
    const g = ctx.createLinearGradient(0, 50, 0, 150);
    g.addColorStop(0, "#fff6c9");
    g.addColorStop(0.5, "#ffd86b");
    g.addColorStop(1, "#ffa94d");
    fitText(ctx, "LANTERNA", 512, 100, 112, g, 640);
    fitText(ctx, "NA FLORESTA", 512, 178, 62, "#c9b8ff", 560);
    const text = "Olhe para uma noite e espere o anel encher";
    ctx.font = `600 32px ${FONT}`;
    const w = ctx.measureText(text).width + 56;
    roundRect(ctx, 512 - w / 2, 218, w, 52, 26);
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 512, 245);
    title.texture.needsUpdate = true;
  }

  function drawNight(b) {
    const { ctx, cw, ch, index: i } = b;
    const open = progressRef.unlocked(i);
    const stars = progressRef.stars(i);
    const isNext = open && i === suggested;
    b.enabled = open;
    cardBack(ctx, cw, ch, {
      r: 40,
      top: open ? "#2e3680" : "#22253f",
      bottom: open ? "#151b4a" : "#14162b",
      border: isNext ? "#ffd86b" : open ? "rgba(201,184,255,0.85)" : "rgba(120,120,160,0.6)",
      lw: isNext ? 11 : 7,
    });
    if (open) sparkles(ctx, cw, ch, 10, i + 11);
    moon(ctx, 200, 150, 80, !open);
    if (open) fitText(ctx, String(i + 1), 200, 156, 104, "#6a4fd0", 200);
    ctx.font = `600 34px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = open ? "#ece8ff" : "#8d8fa8";
    NIGHTS[i].name.forEach((line, k) => ctx.fillText(line, 200, 290 + k * 40));
    for (let k = 0; k < 3; k++) drawStar(ctx, 120 + k * 80, 410, 30, open && k < stars);
    if (!open) lockIcon(ctx, 200, 132, 1.25);
    b.texture.needsUpdate = true;
  }

  function drawScare() {
    const { ctx, cw, ch } = scare;
    const level = LEVELS[levelIndex];
    pill(ctx, cw, ch, level.color);
    ghostIcon(ctx, 96, 92, 0.85, "#ffffff");
    fitText(ctx, `SUSTO: ${level.label}`, 428, 92, 62, "#ffffff", 480);
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(714 + k * 40, 92, 13, 0, TAU);
      ctx.fillStyle = k < levelIndex ? "#ffffff" : "rgba(255,255,255,0.28)";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
    scare.texture.needsUpdate = true;
  }

  function drawPill(b, label, colors, icon) {
    const { ctx, cw, ch } = b;
    pill(ctx, cw, ch, colors);
    const cy = (ch - 26) / 2 + 8;
    if (icon === "grid") {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      for (const [dx, dy] of [
        [-17, -17],
        [17, -17],
        [-17, 17],
        [17, 17],
      ]) {
        roundRect(ctx, 86 + dx - 13, cy + dy - 13, 26, 26, 7);
        ctx.fill();
        ctx.stroke();
      }
    } else if (icon === "again") {
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(88, cy, 28, 0.3, TAU - 0.6);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(122, cy - 26);
      ctx.lineTo(126, cy + 4);
      ctx.lineTo(100, cy - 8);
      ctx.closePath();
      ctx.fill();
    } else if (icon === "next") {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(70, cy - 30);
      ctx.lineTo(118, cy);
      ctx.lineTo(70, cy + 30);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = INK;
      ctx.stroke();
    } else if (icon === "moon") {
      moon(ctx, 88, cy, 30, false);
    }
    fitText(ctx, label, cw / 2 + 50, cy, 62, "#ffffff", cw - 190);
    b.texture.needsUpdate = true;
  }

  function drawResults(r) {
    const { ctx, cw, ch } = results;
    cardBack(ctx, cw, ch, { r: 60, top: "#3f4a96", bottom: "#f2a28c", border: "#ffd86b", lw: 9 });
    const sun = ctx.createRadialGradient(512, ch - 22, 20, 512, ch - 22, 360);
    sun.addColorStop(0, "rgba(255,236,170,0.75)");
    sun.addColorStop(1, "rgba(255,236,170,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(14, 10, cw - 28, ch - 32);
    const g = ctx.createLinearGradient(0, 50, 0, 140);
    g.addColorStop(0, "#fff6c9");
    g.addColorStop(0.5, "#ffd86b");
    g.addColorStop(1, "#ff8c5a");
    fitText(ctx, "AMANHECEU!", 512, 92, 108, g, 760);
    ctx.font = `600 34px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff3e6";
    ctx.fillText(`Noite ${r.night + 1}: ${NIGHTS[r.night].name.join(" ").replace("- -", "-")}`, 512, 162);
    for (let k = 0; k < 3; k++) drawStar(ctx, 362 + k * 150, 262, 58, k < r.reveal);
    candyIcon(ctx, 300, 376, 1.25);
    fireflyIcon(ctx, 300, 452, 1.1);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.lineJoin = "round";
    const l1 = `${r.saved} de ${CANDIES} brigadeiros salvos`;
    const l2 = r.poofs === 1 ? "1 fantasminha virou vaga-lume" : `${r.poofs} fantasminhas viraram vaga-lumes`;
    for (const [text, y] of [
      [l1, 380],
      [l2, 456],
    ]) {
      let size = 42;
      ctx.font = `600 ${size}px ${FONT}`;
      while (ctx.measureText(text).width > cw - 400 && size > 24) {
        size -= 2;
        ctx.font = `600 ${size}px ${FONT}`;
      }
      ctx.strokeText(text, 348, y);
      ctx.fillText(text, 348, y);
    }
    results.texture.needsUpdate = true;
  }

  drawTitle();
  drawPill(games, "JOGOS", ["#b197fc", "#7950f2"], "grid");
  drawPill(again, "DE NOVO", ["#74c0fc", "#1c7ed6"], "again");
  drawPill(next, "PRÓXIMA", ["#ffe066", "#f59f00"], "next");
  drawPill(back, "NOITES", ["#b197fc", "#7950f2"], "moon");

  function place(p, head, yaw, dist, y, delay) {
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    p.group.position.set(head.position.x + fwd.x * dist, y, head.position.z + fwd.z * dist);
    p.group.lookAt(head.position.x, y, head.position.z);
    p.group.visible = true;
    p.group.scale.setScalar(0.001);
    p.age = 0;
    p.delay = delay;
    p.hiding = false;
    p.baseY = y;
  }

  function hide(p) {
    if (!p.group.visible || p.hiding) return;
    p.hiding = true;
    p.age = 0;
  }

  function hideAll() {
    for (const p of all) hide(p);
    focused = null;
  }

  function showTitle(progress, level, head, yaw) {
    hideAll();
    progressRef = progress;
    suggested = progress.suggested();
    levelIndex = level;
    for (const b of nights) drawNight(b);
    drawScare();
    place(title, head, yaw, 3.3, EYE + 0.86, 0);
    const offsets = [0.66, 0.33, 0, -0.33, -0.66];
    nights.forEach((b, i) => place(b, head, yaw + offsets[i], 2.6, EYE - 0.02, 0.12 + i * 0.07));
    place(scare, head, yaw + 0.22, 2.4, EYE - 0.62, 0.5);
    place(games, head, yaw - 0.32, 2.4, EYE - 0.62, 0.56);
  }

  function showResults(r, head, yaw) {
    hideAll();
    drawResults(r);
    place(results, head, yaw, 3.0, EYE + 0.28, 0);
    if (r.hasNext) {
      place(again, head, yaw + 0.33, 2.4, EYE - 0.58, 0.9);
      place(next, head, yaw, 2.4, EYE - 0.58, 0.95);
      place(back, head, yaw - 0.33, 2.4, EYE - 0.58, 1.0);
    } else {
      place(again, head, yaw + 0.2, 2.4, EYE - 0.58, 0.9);
      place(back, head, yaw - 0.2, 2.4, EYE - 0.58, 1.0);
    }
  }

  function pick(origin, dir, hit) {
    for (const b of buttons) {
      if (!b.group.visible || b.hiding || !b.enabled || b.age < b.delay + 0.35) continue;
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

  function update(dt) {
    clock += dt;
    for (const p of all) {
      if (!p.group.visible) continue;
      p.age += dt;
      if (p.hiding) {
        const s = Math.max(0, 1 - p.age / 0.25);
        p.group.scale.setScalar(Math.max(0.001, s));
        if (s <= 0) {
          p.group.visible = false;
          p.hiding = false;
        }
        continue;
      }
      const k = (p.age - p.delay) * 2.6;
      p.group.scale.setScalar(k <= 0 ? 0.001 : Math.max(0.001, easeOutBack(k)));
      p.group.position.y = p.baseY + Math.sin(clock * 1.1 + p.delay * 7) * 0.025;
    }
    for (const b of buttons) {
      b.focus += ((focused === b ? 1 : 0) - b.focus) * Math.min(1, dt * 12);
      b.mesh.scale.setScalar(1 + b.focus * 0.07);
      b.glow.material.opacity = b.focus * 0.9;
    }
  }

  return {
    showTitle,
    showResults,
    hideAll,
    pick,
    update,
    setFocus(target) {
      focused = target;
    },
    setLevel(level) {
      levelIndex = level;
      drawScare();
    },
    redrawResults(r) {
      drawResults(r);
    },
    // Posição de uma das estrelas do resultado (para o confete).
    starWorld(k, out) {
      out.set(((k - 1) * 150) / 1024 * results.w, (1 - 262 / 566 - 0.5) * results.h, 0.05);
      return results.group.localToWorld(out);
    },
    get visible() {
      return all.some((p) => p.group.visible && !p.hiding);
    },
  };
}
