import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { HIGH, signBoard, wood } from "./detail.js";
import { PLANTS, fruitGeometry, mergeAll, paint } from "./models.js";

const ANGLE = 1.9;
const DIST = 1.0;
const PANEL_W = 0.5;
const PANEL_H = 0.62;
const PANEL_Y = 1.0;
const CANVAS_W = 400;
const CANVAS_H = 496;
const HEADER = 70;
const ROW_H = (CANVAS_H - HEADER) / PLANTS.length;
const ICON_X = 245;
const PLANT_INDEX = Object.fromEntries(PLANTS.map((plant, index) => [plant.id, index]));

const lambert = new THREE.MeshLambertMaterial({ vertexColors: true });

function box(hex, w, h, d, x, y, z) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(x, y, z);
  return paint(geo, hex);
}

function boardGeometry() {
  const bottom = PANEL_Y - PANEL_H / 2;
  const parts = [box(0xa8703d, PANEL_W + 0.06, PANEL_H + 0.06, 0.03, 0, PANEL_Y, -0.02)];
  for (const x of [-PANEL_W / 2 + 0.05, PANEL_W / 2 - 0.05]) {
    parts.push(box(0x8a5a2e, 0.04, bottom, 0.04, x, bottom / 2, -0.025));
  }
  const shadow = new THREE.CircleGeometry(1, 16);
  shadow.rotateX(-Math.PI / 2);
  shadow.scale(0.32, 1, 0.12);
  shadow.translate(0, 0.005, -0.025);
  parts.push(paint(shadow, 0x3e8a52));
  return mergeGeometries(parts);
}

function toLocal(px, py, target) {
  return target.set((px / CANVAS_W - 0.5) * PANEL_W, PANEL_Y + (0.5 - py / CANVAS_H) * PANEL_H, 0.03);
}

export function createPriceBoard(scene, progress) {
  const x = Math.sin(ANGLE) * DIST;
  const z = -Math.cos(ANGLE) * DIST;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = Math.atan2(-x, -z);
  if (HIGH) {
    const woodParts = [];
    const plain = [];
    signBoard(PANEL_W, PANEL_H, PANEL_Y, woodParts, plain);
    group.add(new THREE.Mesh(mergeAll(woodParts), wood()), new THREE.Mesh(mergeAll(plain), lambert));
  } else {
    group.add(new THREE.Mesh(boardGeometry(), lambert));
  }
  scene.add(group);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W, PANEL_H), new THREE.MeshBasicMaterial({ map: texture }));
  panel.position.y = PANEL_Y;
  group.add(panel);

  const fruitGeos = PLANTS.map((plant) => fruitGeometry(plant.id));
  const icons = PLANTS.map((_, row) => {
    const icon = new THREE.Mesh(fruitGeos[0], lambert);
    toLocal(ICON_X, HEADER + (row + 0.5) * ROW_H, icon.position);
    icon.scale.setScalar(1.3);
    icon.visible = false;
    group.add(icon);
    return icon;
  });

  function coin(cx, cy, r) {
    ctx.fillStyle = "#e9b43a";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f6d365";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chamar de novo quando a loja liberar uma semente.
  function refresh() {
    const rows = [];
    for (const id of progress.data.seeds) {
      const type = PLANT_INDEX[id];
      if (type !== undefined && !rows.includes(type)) rows.push(type);
    }

    ctx.fillStyle = "#fff3c4";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#5bb86a";
    ctx.fillRect(0, 0, CANVAS_W, HEADER - 8);
    ctx.fillStyle = "#fff3c4";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText("PREÇOS", CANVAS_W / 2, HEADER / 2 - 2);

    for (let row = 0; row < PLANTS.length; row += 1) {
      const cy = HEADER + (row + 0.5) * ROW_H;
      const type = rows[row];
      const known = type !== undefined;
      if (row % 2 === 1) {
        ctx.fillStyle = "#f7e7b0";
        ctx.fillRect(0, cy - ROW_H / 2, CANVAS_W, ROW_H);
      }
      ctx.textBaseline = "middle";
      ctx.fillStyle = known ? "#3d405b" : "#c9bb95";
      ctx.textAlign = "left";
      ctx.font = "bold 30px sans-serif";
      ctx.fillText(known ? PLANTS[type].name.toUpperCase() : "???", 16, cy + 2);
      ctx.textAlign = "center";
      ctx.font = "bold 34px sans-serif";
      ctx.fillText("=", 292, cy + 2);
      if (known) {
        coin(328, cy, 15);
        ctx.fillStyle = "#3d405b";
        ctx.textAlign = "left";
        ctx.fillText(String(PLANTS[type].price), 350, cy + 3);
        icons[row].geometry = fruitGeos[type];
      } else {
        ctx.fillText("?", ICON_X, cy + 2);
        ctx.fillText("?", 350, cy + 2);
      }
      icons[row].visible = known;
    }
    texture.needsUpdate = true;
  }
  refresh();

  let time = 0;
  return {
    refresh,
    update(dt) {
      time += dt;
      for (let i = 0; i < icons.length; i += 1) icons[i].rotation.y = Math.sin(time * 0.7 + i) * 0.6;
    },
  };
}
