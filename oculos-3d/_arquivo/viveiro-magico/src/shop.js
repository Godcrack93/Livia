import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { HIGH, signBoard, wood } from "./detail.js";
import { packetGeometry } from "./garden.js";
import { PLANTS, fruitGeometry, mergeAll, paint } from "./models.js";
import { MAX_POTS } from "./progress.js";

// Para vender algo novo: um item aqui e um caso em priceOf(), owned(), buy(), iconGeometry() e drawDetails().
const ITEMS = [
  { kind: "pot", prices: [10, 25, 50] },
  { kind: "seed", id: "cenoura", price: 12 },
  { kind: "seed", id: "alface", price: 20 },
  { kind: "seed", id: "manjericao", price: 35 },
  { kind: "seed", id: "milho", price: 55 },
  { kind: "seed", id: "flor", price: 80 },
];

const CHOOSE = 0.8;
const BUY = 1.5;
const ANGLE = -1.1;
const DIST = 1.25;
const PANEL_W = 0.96;
const PANEL_H = 0.72;
const PANEL_Y = 1.15;
const CANVAS_W = 512;
const CANVAS_H = 384;
const HEADER = 72;
const COLS = 3;
const CELL_W = CANVAS_W / COLS;
const CELL_H = (CANVAS_H - HEADER) / 2;
const ICON_SCALE = 0.95;
const POP_W = 0.72;
const POP_H = 0.5625;
const POP_CW = 512;
const POP_CH = 400;
const POP_Z = 0.22;
const BUTTON = { x: 96, y: 290, w: 320, h: 80 };
const CLOSE = { x: 468, y: 44, r: 26 };
const ON = 0;
const OFF = 1;
const PLANT_INDEX = Object.fromEntries(PLANTS.map((plant, index) => [plant.id, index]));

const lambert = new THREE.MeshLambertMaterial({ vertexColors: true });
const faded = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.4 });
const hidden = new THREE.MeshBasicMaterial({ visible: false });

function box(hex, w, h, d, x, y, z) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(x, y, z);
  return paint(geo, hex);
}

function boardGeometry() {
  const parts = [
    box(0xa8703d, PANEL_W + 0.08, PANEL_H + 0.08, 0.04, 0, PANEL_Y, -0.025),
    box(0x8a5a2e, PANEL_W + 0.2, 0.05, 0.14, 0, PANEL_Y + PANEL_H / 2 + 0.07, -0.02),
  ];
  for (const x of [-PANEL_W / 2 + 0.06, PANEL_W / 2 - 0.06]) {
    parts.push(box(0x8a5a2e, 0.05, PANEL_Y - PANEL_H / 2, 0.05, x, (PANEL_Y - PANEL_H / 2) / 2, -0.03));
  }
  const shadow = new THREE.CircleGeometry(1, 16);
  shadow.rotateX(-Math.PI / 2);
  shadow.scale(0.6, 1, 0.2);
  shadow.translate(0, 0.005, -0.03);
  parts.push(paint(shadow, 0x3e8a52));
  return mergeGeometries(parts);
}

function detailedPotIcon() {
  const lathe = new THREE.LatheGeometry(
    [
      [0.001, 0], [0.038, 0], [0.042, 0.004], [0.042, 0.01], [0.05, 0.075], [0.052, 0.08],
      [0.06, 0.084], [0.063, 0.09], [0.062, 0.1], [0.057, 0.104], [0.05, 0.104], [0.048, 0.09], [0.001, 0.09],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    20,
  );
  const band = new THREE.TorusGeometry(0.049, 0.0025, 4, 20);
  band.rotateX(Math.PI / 2);
  band.translate(0, 0.066, 0);
  const soil = new THREE.CylinderGeometry(0.05, 0.05, 0.012, 16);
  soil.translate(0, 0.094, 0);
  const sprout = new THREE.CylinderGeometry(0.002, 0.003, 0.03, 4);
  sprout.translate(0, 0.112, 0);
  const parts = [paint(lathe, 0xe07a5f), paint(band, 0xfff3c4), paint(soil, 0x5b4030), paint(sprout, 0x4f8a3c)];
  for (const side of [-1, 1]) {
    const leaf = new THREE.SphereGeometry(1, 6, 4);
    leaf.scale(0.014, 0.004, 0.008);
    leaf.rotateZ(side * 0.4);
    leaf.translate(side * 0.013, 0.126, 0);
    parts.push(paint(leaf, 0x5bb86a));
  }
  return mergeAll(parts).translate(0, -0.05, 0).scale(0.75, 0.75, 0.75);
}

function potIcon() {
  if (HIGH) return detailedPotIcon();
  const body = new THREE.CylinderGeometry(0.05, 0.04, 0.1, 10);
  const rim = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 10);
  rim.translate(0, 0.055, 0);
  const soil = new THREE.CylinderGeometry(0.052, 0.052, 0.01, 10);
  soil.translate(0, 0.062, 0);
  return mergeGeometries([paint(body, 0xe07a5f), paint(rim, 0xe07a5f), paint(soil, 0x5b4030)]).scale(0.75, 0.75, 0.75);
}

function packetIcon(type) {
  if (HIGH) return packetGeometry(PLANTS[type].fruit, fruitGeometry(PLANTS[type].id));
  const body = paint(new THREE.BoxGeometry(0.1, 0.13, 0.02), PLANTS[type].fruit);
  const label = paint(new THREE.BoxGeometry(0.084, 0.09, 0.004), 0xfff3c4);
  label.translate(0, 0.008, 0.011);
  const mini = fruitGeometry(PLANTS[type].id).clone();
  mini.scale(1.25, 1.25, 1.25);
  mini.translate(0, 0.006, 0.03);
  return mergeAll([body, label, mini]);
}

function iconGeometry(item) {
  return item.kind === "pot" ? potIcon() : packetIcon(PLANT_INDEX[item.id]);
}

function nameOf(item) {
  return item.kind === "pot" ? "VASO" : PLANTS[PLANT_INDEX[item.id]].name.toUpperCase();
}

function cellCenter(index) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return { px: (col + 0.5) * CELL_W, py: HEADER + (row + 0.5) * CELL_H };
}

function toLocal(px, py, target) {
  return target.set((px / CANVAS_W - 0.5) * PANEL_W, PANEL_Y + (0.5 - py / CANVAS_H) * PANEL_H, 0);
}

function toPopup(px, py, target) {
  return target.set((px / POP_CW - 0.5) * POP_W, (0.5 - py / POP_CH) * POP_H, 0);
}

function coin(ctx, x, y, r) {
  ctx.fillStyle = "#e9b43a";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f6d365";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
}

function check(ctx, x, y, s) {
  ctx.strokeStyle = "#5bb86a";
  ctx.lineWidth = s * 0.28;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - s * 0.5, y);
  ctx.lineTo(x - s * 0.12, y + s * 0.38);
  ctx.lineTo(x + s * 0.55, y - s * 0.4);
  ctx.stroke();
}

function fitText(ctx, text, x, y, maxWidth, size) {
  let px = size;
  ctx.font = `bold ${px}px sans-serif`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `bold ${px}px sans-serif`;
  }
  ctx.fillText(text, x, y);
}

function canvasTexture(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { ctx: canvas.getContext("2d"), texture };
}

function button(role, w, h, x, y, hold) {
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), hidden);
  hit.visible = false;
  hit.position.set(x, y, 0.01);
  hit.userData.kind = "shop";
  hit.userData.role = role;
  hit.userData.hold = hold;
  hit.layers.set(OFF);
  return hit;
}

export function createShop(scene, progress) {
  const group = new THREE.Group();
  group.position.set(Math.sin(ANGLE) * DIST, 0, Math.cos(ANGLE) * DIST);
  group.rotation.y = ANGLE + Math.PI;
  if (HIGH) {
    const woodParts = [];
    const plain = [];
    signBoard(PANEL_W, PANEL_H, PANEL_Y, woodParts, plain);
    group.add(new THREE.Mesh(mergeAll(woodParts), wood()), new THREE.Mesh(mergeAll(plain), lambert));
  } else {
    group.add(new THREE.Mesh(boardGeometry(), lambert));
  }
  scene.add(group);

  const board = canvasTexture(CANVAS_W, CANVAS_H);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W, PANEL_H), new THREE.MeshBasicMaterial({ map: board.texture }));
  panel.position.y = PANEL_Y;
  group.add(panel);

  const iconGeos = ITEMS.map(iconGeometry);
  const colliders = [];
  const icons = ITEMS.map((item, index) => {
    const { px, py } = cellCenter(index);
    const icon = new THREE.Mesh(iconGeos[index], lambert);
    toLocal(px, py - 6, icon.position);
    icon.position.z = 0.05;
    icon.scale.setScalar(ICON_SCALE);
    group.add(icon);

    const hit = new THREE.Mesh(new THREE.BoxGeometry(PANEL_W / COLS - 0.02, (PANEL_H * CELL_H) / CANVAS_H - 0.02, 0.04), hidden);
    hit.visible = false;
    toLocal(px, py, hit.position);
    hit.position.z = 0.03;
    hit.userData.kind = "shop";
    hit.userData.role = "card";
    hit.userData.index = index;
    hit.userData.hold = CHOOSE;
    group.add(hit);
    colliders.push(hit);
    return { icon, pop: 0 };
  });

  const detail = canvasTexture(POP_CW, POP_CH);
  const popup = new THREE.Group();
  popup.position.set(0, PANEL_Y, POP_Z);
  popup.visible = false;
  group.add(popup);
  popup.add(new THREE.Mesh(new THREE.PlaneGeometry(POP_W, POP_H), new THREE.MeshBasicMaterial({ map: detail.texture, alphaTest: 0.5 })));
  const popIcon = new THREE.Mesh(iconGeos[0], lambert);
  toPopup(130, 200, popIcon.position);
  popIcon.position.z = 0.05;
  popIcon.scale.setScalar(1.6);
  popup.add(popIcon);

  const blocker = button("panel", POP_W, POP_H, 0, 0, CHOOSE);
  blocker.position.z = -0.01;
  const center = toPopup(BUTTON.x + BUTTON.w / 2, BUTTON.y + BUTTON.h / 2, new THREE.Vector3());
  const buyHit = button("buy", (BUTTON.w / POP_CW) * POP_W, (BUTTON.h / POP_CH) * POP_H, center.x, center.y, BUY);
  toPopup(CLOSE.x, CLOSE.y, center);
  const closeHit = button("close", 0.09, 0.09, center.x, center.y, CHOOSE);
  popup.add(blocker, buyHit, closeHit);
  colliders.push(blocker, buyHit, closeHit);
  let selected = -1;

  function priceOf(item) {
    if (item.kind === "pot") return item.prices[Math.min(progress.data.pots - 1, item.prices.length - 1)];
    return item.price;
  }

  function owned(item) {
    if (item.kind === "pot") return progress.data.pots >= MAX_POTS;
    return progress.data.seeds.includes(item.id);
  }

  function affordable(item) {
    return !owned(item) && (progress.data.money ?? 0) >= priceOf(item);
  }

  function buy(item) {
    if (item.kind === "pot") progress.addPot();
    else progress.unlockSeed(item.id);
  }

  let drawnMoney = -1;

  function drawBoard() {
    const ctx = board.ctx;
    const money = progress.data.money ?? 0;
    drawnMoney = money;
    ctx.fillStyle = "#fff3c4";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#e07a5f";
    ctx.fillRect(0, 0, CANVAS_W, HEADER - 8);
    ctx.fillStyle = "#fff3c4";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("LOJA", 20, HEADER / 2 - 2);
    coin(ctx, CANVAS_W - 150, HEADER / 2 - 4, 22);
    ctx.fillText(String(money), CANVAS_W - 118, HEADER / 2 - 2);

    ITEMS.forEach((item, index) => {
      const { px, py } = cellCenter(index);
      const have = owned(item);
      const can = affordable(item);
      ctx.fillStyle = have ? "#e3f4df" : can ? "#ffffff" : "#d9d4c7";
      ctx.beginPath();
      ctx.roundRect(px - CELL_W / 2 + 8, py - CELL_H / 2 + 6, CELL_W - 16, CELL_H - 12, 18);
      ctx.fill();
      if (can || index === selected) {
        ctx.strokeStyle = index === selected ? "#e07a5f" : "#5bb86a";
        ctx.lineWidth = 6;
        ctx.stroke();
      }
      ctx.fillStyle = have || can ? "#3d405b" : "#8d877b";
      ctx.textAlign = "center";
      fitText(ctx, nameOf(item), px, py - CELL_H / 2 + 26, CELL_W - 28, 24);
      const labelY = py + CELL_H / 2 - 26;
      if (have) {
        check(ctx, px, labelY - 2, 26);
      } else {
        coin(ctx, px - 28, labelY, 14);
        ctx.fillStyle = can ? "#3d405b" : "#8d877b";
        ctx.font = "bold 30px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(String(priceOf(item)), px - 9, labelY + 2);
      }
      icons[index].icon.material = have || can ? lambert : faded;
    });
    board.texture.needsUpdate = true;
  }

  function drawDetails(item) {
    const ctx = detail.ctx;
    const money = progress.data.money ?? 0;
    ctx.clearRect(0, 0, POP_CW, POP_CH);
    ctx.fillStyle = "#a8703d";
    ctx.beginPath();
    ctx.roundRect(2, 2, POP_CW - 4, POP_CH - 4, 30);
    ctx.fill();
    ctx.fillStyle = "#fffaf0";
    ctx.beginPath();
    ctx.roundRect(10, 10, POP_CW - 20, POP_CH - 20, 24);
    ctx.fill();

    ctx.fillStyle = "#e07a5f";
    ctx.beginPath();
    ctx.arc(CLOSE.x, CLOSE.y, CLOSE.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(CLOSE.x - 10, CLOSE.y - 10);
    ctx.lineTo(CLOSE.x + 10, CLOSE.y + 10);
    ctx.moveTo(CLOSE.x + 10, CLOSE.y - 10);
    ctx.lineTo(CLOSE.x - 10, CLOSE.y + 10);
    ctx.stroke();

    const seed = item.kind === "seed";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#8d877b";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(seed ? "SEMENTE DE" : "MAIS UM", POP_CW / 2, 44);
    ctx.fillStyle = "#3d405b";
    fitText(ctx, nameOf(item), POP_CW / 2, 92, 360, 54);

    ctx.fillStyle = "#8d877b";
    ctx.font = "bold 24px sans-serif";
    if (seed) {
      const plant = PLANTS[PLANT_INDEX[item.id]];
      ctx.fillText("CADA FRUTO VALE", 370, 160);
      coin(ctx, 330, 212, 24);
      ctx.fillStyle = "#3d405b";
      ctx.font = "bold 56px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(String(plant.price), 364, 215);
    } else {
      const pots = progress.data.pots;
      ctx.fillText("VASOS NA BANCADA", 370, 160);
      ctx.fillStyle = "#3d405b";
      ctx.font = "bold 56px sans-serif";
      ctx.fillText(owned(item) ? `${pots}` : `${pots} → ${pots + 1}`, 370, 215);
    }

    const have = owned(item);
    const can = affordable(item);
    const midY = BUTTON.y + BUTTON.h / 2;
    ctx.fillStyle = have ? "#e3f4df" : can ? "#5bb86a" : "#d9d4c7";
    ctx.beginPath();
    ctx.roundRect(BUTTON.x, BUTTON.y, BUTTON.w, BUTTON.h, 24);
    ctx.fill();
    ctx.textAlign = "center";
    if (have) {
      ctx.fillStyle = "#3d405b";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText("JÁ É SEU", POP_CW / 2 - 24, midY + 2);
      check(ctx, POP_CW / 2 + 92, midY, 30);
    } else {
      const amount = can ? priceOf(item) : priceOf(item) - money;
      ctx.fillStyle = can ? "#ffffff" : "#8d877b";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText(can ? "COMPRAR" : "FALTAM", 214, midY + 2);
      coin(ctx, 336, midY, 18);
      ctx.fillStyle = can ? "#ffffff" : "#8d877b";
      ctx.textAlign = "left";
      ctx.fillText(String(amount), 360, midY + 3);
    }
    detail.texture.needsUpdate = true;
  }

  function setPopupHits(on) {
    for (const hit of [blocker, buyHit, closeHit]) hit.layers.set(on ? ON : OFF);
  }

  function open(index) {
    selected = index;
    popIcon.geometry = iconGeos[index];
    drawDetails(ITEMS[index]);
    popup.visible = true;
    popup.scale.setScalar(0.6);
    setPopupHits(true);
    drawBoard();
  }

  function close() {
    selected = -1;
    popup.visible = false;
    setPopupHits(false);
    drawBoard();
  }

  drawBoard();
  let time = 0;

  return {
    colliders,
    canUse(target) {
      const role = target.userData.role;
      if (role === "card") return target.userData.index !== selected;
      if (role === "buy") return selected >= 0 && affordable(ITEMS[selected]);
      return role === "close";
    },
    use(target) {
      const role = target.userData.role;
      if (role === "card") {
        open(target.userData.index);
        return "abrir";
      }
      if (role === "close") {
        close();
        return "fechar";
      }
      if (role !== "buy" || selected < 0) return null;
      const index = selected;
      const item = ITEMS[index];
      if (!affordable(item)) return null;
      progress.data.money -= priceOf(item);
      buy(item);
      progress.save();
      icons[index].pop = 1;
      close();
      return "comprar";
    },
    update(dt) {
      time += dt;
      if ((progress.data.money ?? 0) !== drawnMoney) {
        drawBoard();
        if (selected >= 0) drawDetails(ITEMS[selected]);
      }
      if (popup.visible) {
        popup.scale.setScalar(Math.min(1, popup.scale.x + dt * 4));
        popIcon.rotation.y = Math.sin(time * 1.2) * 0.6;
      }
      for (let i = 0; i < icons.length; i += 1) {
        const entry = icons[i];
        entry.icon.rotation.y = Math.sin(time * 0.8 + i) * 0.5;
        entry.pop = Math.max(0, entry.pop - dt * 2);
        entry.icon.scale.setScalar(ICON_SCALE * (1 + Math.sin(entry.pop * Math.PI) * 0.4));
      }
    },
  };
}
