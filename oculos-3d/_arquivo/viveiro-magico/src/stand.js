import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createCustomer } from "./customer.js";
import { HIGH, jitter, nail, plank, tint, tuft, wood } from "./detail.js";
import { PLANTS, fruitGeometry, mergeAll, paint } from "./models.js";

const COUNTER_Z = 1.0;
const COUNTER_DEPTH = 0.34;
const COUNTER_TOP = 0.82;
const HALF = 0.6;
const CUSTOMER_Z = 1.62;
const WALK_FROM = 2.6;
const WALK_SPEED = 0.9;
const DAY_GOAL = 3;
const FLYER_COUNT = 6;
const MAX_KINDS = 2;
const SIGN_W = 256;
const SIGN_H = 96;
const BUBBLE_W = 512;
const BUBBLE_H = 256;
const BUBBLE_M = 0.84;
const BUBBLE_Y = 1.86;
const BODY_BOTTOM = 206;
const ROWS_ONE = [106];
const ROWS_TWO = [46, 106, 166];
const SIGN_Y = 0.6;
const WAVE_TIME = 1.6;
const PLANT_INDEX = Object.fromEntries(PLANTS.map((plant, index) => [plant.id, index]));

const lambert = new THREE.MeshLambertMaterial({ vertexColors: true });
const hidden = new THREE.MeshBasicMaterial({ visible: false });
const tmpFrom = new THREE.Vector3();

function box(hex, w, h, d, x, y, z) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(x, y, z);
  return paint(geo, hex);
}

function stallGeometry() {
  const cz = COUNTER_Z + COUNTER_DEPTH / 2;
  const parts = [box(0xc98b4f, HALF * 2, COUNTER_TOP - 0.04, COUNTER_DEPTH, 0, (COUNTER_TOP - 0.04) / 2, cz)];
  const plank = (HALF * 2) / 6;
  for (let i = 0; i < 6; i += 1) {
    parts.push(box(i % 2 ? 0xf2cc8f : 0xe9c46a, plank - 0.012, COUNTER_TOP - 0.12, 0.01, -HALF + plank / 2 + i * plank, COUNTER_TOP / 2, COUNTER_Z - 0.005));
  }
  parts.push(box(0xa8703d, HALF * 2 + 0.1, 0.04, COUNTER_DEPTH + 0.06, 0, COUNTER_TOP - 0.02, cz));

  const front = 1.86;
  const back = 2.08;
  const frontZ = 0.95;
  const backZ = 1.9;
  for (const x of [-HALF, HALF]) {
    parts.push(box(0xa8703d, 0.05, front - COUNTER_TOP, 0.05, x, (front + COUNTER_TOP) / 2, COUNTER_Z + 0.03));
    parts.push(box(0xa8703d, 0.05, back, 0.05, x, back / 2, backZ - 0.05));
  }

  const slope = Math.atan2(back - front, backZ - frontZ);
  const length = Math.hypot(back - front, backZ - frontZ);
  const stripes = 8;
  const width = (HALF * 2 + 0.12) / stripes;
  for (let i = 0; i < stripes; i += 1) {
    const x = -HALF - 0.06 + width / 2 + i * width;
    const hex = i % 2 ? 0xfff3c4 : 0xe07a5f;
    const stripe = new THREE.BoxGeometry(width, 0.02, length);
    stripe.rotateX(-slope);
    stripe.translate(x, (front + back) / 2, (frontZ + backZ) / 2);
    parts.push(paint(stripe, hex));
    parts.push(box(hex, width, 0.08, 0.012, x, front - 0.04, frontZ - 0.006));
  }
  const shadow = new THREE.CircleGeometry(1, 20);
  shadow.rotateX(-Math.PI / 2);
  shadow.scale(0.85, 1, 0.6);
  shadow.translate(0, 0.005, 1.4);
  parts.push(paint(shadow, 0x3e8a52));
  return mergeGeometries(parts);
}

const AWNING_FRONT = 1.86;
const AWNING_BACK = 2.08;
const AWNING_FZ = 0.95;
const AWNING_BZ = 1.9;

function fabric(hex, width, length, sag) {
  const geo = new THREE.BoxGeometry(width, 0.014, length, 1, 1, 8);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const t = pos.getZ(i) / length + 0.5;
    pos.setY(i, pos.getY(i) - Math.sin(t * Math.PI) * sag);
  }
  geo.computeVertexNormals();
  return paint(geo, hex);
}

// Barraca detalhada: balcão de tábuas com rodapé, tampo pregado, toldo de lona com franja recortada,
// caibros por baixo, bandeirinhas e um caixote de tomates.
function detailedStall() {
  const woodParts = [];
  const plain = [];
  const back = COUNTER_Z + COUNTER_DEPTH;
  const bodyH = COUNTER_TOP - 0.04;
  const boards = 6;
  const bw = (HALF * 2) / boards;
  for (let i = 0; i < boards; i += 1) {
    const x = -HALF + bw / 2 + i * bw;
    woodParts.push(plank(jitter(i % 2 ? 0xf2cc8f : 0xe9c46a, 0.04), bw - 0.008, bodyH - 0.02, 0.02, x, bodyH / 2 + 0.01, COUNTER_Z + 0.012, { along: "y", radius: 0.005 }));
    for (const y of [0.1, bodyH - 0.06]) woodParts.push(nail(x, y, COUNTER_Z + 0.001, "z", -1));
  }
  woodParts.push(plank(0xa8703d, HALF * 2 + 0.02, 0.07, 0.02, 0, 0.055, COUNTER_Z - 0.006));
  for (const x of [-HALF, HALF]) {
    for (const z of [COUNTER_Z + 0.03, back - 0.03]) {
      woodParts.push(plank(jitter(0xa8703d, 0.05), 0.055, bodyH, 0.055, x, bodyH / 2, z, { radius: 0.008 }));
    }
    for (let k = 0; k < 3; k += 1) {
      woodParts.push(plank(jitter(0xe9c46a, 0.06), 0.02, 0.23, COUNTER_DEPTH - 0.06, x + Math.sign(x) * 0.017, 0.14 + k * 0.245, COUNTER_Z + COUNTER_DEPTH / 2, { along: "z", radius: 0.005 }));
    }
  }
  const inner = new THREE.BoxGeometry(HALF * 2 - 0.02, bodyH, 0.01);
  inner.translate(0, bodyH / 2, back - 0.01);
  plain.push(paint(inner, 0x7a5230));

  const tops = [0xc98b4f, 0xbf8246, 0xd09456];
  const tw = (COUNTER_DEPTH + 0.06 - 2 * 0.005) / 3;
  for (let i = 0; i < 3; i += 1) {
    const z = COUNTER_Z - 0.03 + tw / 2 + i * (tw + 0.005);
    woodParts.push(plank(tops[i], HALF * 2 + 0.1, 0.04, tw, 0, COUNTER_TOP - 0.02, z));
    for (const x of [-HALF, 0, HALF]) woodParts.push(nail(x, COUNTER_TOP + 0.0008, z));
  }

  for (const x of [-HALF, HALF]) {
    woodParts.push(plank(jitter(0xa8703d, 0.05), 0.055, AWNING_FRONT - COUNTER_TOP, 0.055, x, (AWNING_FRONT + COUNTER_TOP) / 2, COUNTER_Z + 0.03, { radius: 0.008 }));
    woodParts.push(plank(jitter(0xa8703d, 0.05), 0.055, AWNING_BACK, 0.055, x, AWNING_BACK / 2, AWNING_BZ - 0.05, { radius: 0.008 }));
    plain.push(...tuft(x, AWNING_BZ - 0.05, 7));
  }

  const slope = Math.atan2(AWNING_BACK - AWNING_FRONT, AWNING_BZ - AWNING_FZ);
  const length = Math.hypot(AWNING_BACK - AWNING_FRONT, AWNING_BZ - AWNING_FZ);
  const midY = (AWNING_FRONT + AWNING_BACK) / 2;
  const midZ = (AWNING_FZ + AWNING_BZ) / 2;
  for (const x of [-HALF, 0, HALF]) {
    woodParts.push(plank(0x8a5a2e, 0.035, 0.035, length, x, midY - 0.035, midZ, { rot: [-slope, 0, 0], along: "z", radius: 0.005 }));
  }
  const stripes = 8;
  const width = (HALF * 2 + 0.12) / stripes;
  for (let i = 0; i < stripes; i += 1) {
    const x = -HALF - 0.06 + width / 2 + i * width;
    const hex = i % 2 ? 0xfff3c4 : 0xe07a5f;
    const stripe = fabric(hex, width + 0.002, length, 0.025);
    stripe.rotateX(-slope);
    stripe.translate(x, midY, midZ);
    plain.push(stripe);
    const flap = new THREE.BoxGeometry(width, 0.06, 0.012);
    flap.translate(x, AWNING_FRONT - 0.03, AWNING_FZ - 0.006);
    plain.push(paint(flap, hex));
    const scallop = new THREE.CylinderGeometry(width / 2, width / 2, 0.012, 10, 1, false, Math.PI / 2, Math.PI);
    scallop.rotateX(-Math.PI / 2);
    scallop.translate(x, AWNING_FRONT - 0.06, AWNING_FZ - 0.006);
    plain.push(paint(scallop, hex));
    const trim = new THREE.BoxGeometry(width, 0.008, 0.016);
    trim.translate(x, AWNING_FRONT - 0.004, AWNING_FZ - 0.006);
    plain.push(paint(trim, tint(hex, 0.85)));
  }

  const flags = [0xe23d3d, 0xf5d04c, 0x5bb86a, 0x4f8fcf, 0xf2849a];
  const count = 11;
  const ropeY = 1.7;
  const ropeZ = COUNTER_Z + 0.0;
  for (let k = 0; k <= count; k += 1) {
    const t = k / count;
    const x = -HALF + t * HALF * 2;
    const y = ropeY - Math.sin(t * Math.PI) * 0.05;
    if (k < count) {
      const nx = -HALF + ((k + 1) / count) * HALF * 2;
      const ny = ropeY - Math.sin(((k + 1) / count) * Math.PI) * 0.05;
      const seg = new THREE.CylinderGeometry(0.0025, 0.0025, Math.hypot(nx - x, ny - y), 4);
      seg.rotateZ(Math.PI / 2 + Math.atan2(ny - y, nx - x));
      seg.translate((x + nx) / 2, (y + ny) / 2, ropeZ);
      plain.push(paint(seg, 0xfff3c4));
    }
    if (k === 0 || k === count) continue;
    const flag = new THREE.CylinderGeometry(0.036, 0.036, 0.004, 3);
    flag.rotateX(Math.PI / 2);
    flag.scale(1, 1.3, 1);
    flag.translate(x, y - 0.034, ropeZ);
    plain.push(paint(flag, flags[k % flags.length]));
  }

  const crateX = -0.43;
  const crateZ = COUNTER_Z + 0.2;
  const base = COUNTER_TOP;
  for (const side of [-1, 1]) {
    for (const y of [0.025, 0.07]) {
      woodParts.push(plank(0xd9a866, 0.22, 0.035, 0.012, crateX, base + y, crateZ + side * 0.075, { radius: 0.003 }));
      woodParts.push(plank(0xcf9a5e, 0.012, 0.035, 0.15, crateX + side * 0.104, base + y, crateZ, { radius: 0.003 }));
    }
  }
  woodParts.push(plank(0xc48d52, 0.21, 0.01, 0.15, crateX, base + 0.006, crateZ, { radius: 0.003 }));
  const tomato = fruitGeometry("tomate");
  for (const [dx, dy, dz] of [[-0.06, 0.04, -0.03], [0, 0.04, -0.035], [0.06, 0.04, -0.03], [-0.05, 0.04, 0.035], [0.02, 0.04, 0.03], [0.065, 0.045, 0.035], [-0.02, 0.08, 0], [0.04, 0.08, 0.005]]) {
    const fruit = tomato.clone();
    fruit.rotateY(dx * 40);
    fruit.translate(crateX + dx, base + dy, crateZ + dz);
    plain.push(fruit);
  }

  const shadow = new THREE.CircleGeometry(1, 24);
  shadow.rotateX(-Math.PI / 2);
  shadow.scale(0.85, 1, 0.6);
  shadow.translate(0, 0.005, 1.4);
  plain.push(paint(shadow, 0x3e8a52));
  return { wood: mergeAll(woodParts), plain: mergeAll(plain) };
}

function turn(current, target, k) {
  return current + Math.atan2(Math.sin(target - current), Math.cos(target - current)) * k;
}

export function createStand(scene, progress, garden) {
  if (HIGH) {
    const stall = detailedStall();
    scene.add(new THREE.Mesh(stall.wood, wood()), new THREE.Mesh(stall.plain, lambert));
  } else {
    scene.add(new THREE.Mesh(stallGeometry(), lambert));
  }

  const signCanvas = document.createElement("canvas");
  signCanvas.width = SIGN_W;
  signCanvas.height = SIGN_H;
  const signCtx = signCanvas.getContext("2d");
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.165),
    new THREE.MeshBasicMaterial({ map: signTexture, alphaTest: 0.5 }),
  );
  sign.position.set(0, SIGN_Y, COUNTER_Z - 0.016);
  sign.rotation.y = Math.PI;
  scene.add(sign);
  let shownMoney = progress.data.money ?? 0;

  function drawSign() {
    signCtx.clearRect(0, 0, SIGN_W, SIGN_H);
    signCtx.fillStyle = "#a8703d";
    signCtx.beginPath();
    signCtx.roundRect(2, 2, SIGN_W - 4, SIGN_H - 4, 22);
    signCtx.fill();
    signCtx.fillStyle = "#fff3c4";
    signCtx.beginPath();
    signCtx.roundRect(10, 10, SIGN_W - 20, SIGN_H - 20, 16);
    signCtx.fill();
    signCtx.fillStyle = "#e9b43a";
    signCtx.beginPath();
    signCtx.arc(56, SIGN_H / 2, 26, 0, Math.PI * 2);
    signCtx.fill();
    signCtx.fillStyle = "#f6d365";
    signCtx.beginPath();
    signCtx.arc(56, SIGN_H / 2, 18, 0, Math.PI * 2);
    signCtx.fill();
    signCtx.fillStyle = "#3d405b";
    signCtx.textAlign = "center";
    signCtx.textBaseline = "middle";
    signCtx.font = "bold 26px sans-serif";
    signCtx.fillText("$", 56, SIGN_H / 2 + 1);
    signCtx.font = "bold 54px sans-serif";
    signCtx.fillText(String(shownMoney), 160, SIGN_H / 2 + 3);
    signTexture.needsUpdate = true;
  }
  drawSign();

  const customer = createCustomer();
  customer.group.visible = false;
  customer.group.position.set(WALK_FROM, 0, CUSTOMER_Z);
  scene.add(customer.group);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), hidden);
  hit.visible = false;
  hit.position.y = 1.1;
  hit.userData.kind = "customer";
  customer.group.add(hit);
  const colliders = [hit];

  const bubbleCanvas = document.createElement("canvas");
  bubbleCanvas.width = BUBBLE_W;
  bubbleCanvas.height = BUBBLE_H;
  const bubbleCtx = bubbleCanvas.getContext("2d");
  const bubbleTexture = new THREE.CanvasTexture(bubbleCanvas);
  bubbleTexture.colorSpace = THREE.SRGBColorSpace;
  const bubble = new THREE.Group();
  bubble.position.set(0, BUBBLE_Y, -0.05);
  const bubblePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(BUBBLE_M, (BUBBLE_M * BUBBLE_H) / BUBBLE_W),
    new THREE.MeshBasicMaterial({ map: bubbleTexture, alphaTest: 0.5, depthFunc: THREE.AlwaysDepth }),
  );
  // Desenha por cima do toldo, mas grava profundidade para os ícones ficarem na frente dele.
  bubblePlane.renderOrder = 10;
  bubblePlane.rotation.y = Math.PI;
  bubble.add(bubblePlane);
  const fruitGeos = PLANTS.map((plant) => fruitGeometry(plant.id));
  const icons = [];
  for (let i = 0; i < MAX_KINDS; i += 1) {
    const icon = new THREE.Mesh(fruitGeos[0], lambert);
    icon.scale.setScalar(1.5);
    icon.renderOrder = 11;
    icon.visible = false;
    bubble.add(icon);
    icons.push(icon);
  }
  bubble.visible = false;
  customer.group.add(bubble);

  const order = [];
  for (let i = 0; i < MAX_KINDS; i += 1) order.push({ type: 0, qty: 0 });
  let kinds = 0;

  const flyers = [];
  for (let i = 0; i < FLYER_COUNT; i += 1) {
    const view = new THREE.Mesh(fruitGeos[0], lambert);
    view.visible = false;
    scene.add(view);
    flyers.push({ view, t: 0, active: false, from: new THREE.Vector3(), to: new THREE.Vector3(), value: 0 });
  }

  let state = "away";
  let timer = 3;
  let side = 1;
  let yaw = 0;
  let waved = 0;
  let ready = false;
  let served = 0;
  let time = 0;

  function coin(cx, cy, r) {
    bubbleCtx.fillStyle = "#e9b43a";
    bubbleCtx.beginPath();
    bubbleCtx.arc(cx, cy, r, 0, Math.PI * 2);
    bubbleCtx.fill();
    bubbleCtx.fillStyle = "#f6d365";
    bubbleCtx.beginPath();
    bubbleCtx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
    bubbleCtx.fill();
  }

  function fitText(text, x, y, maxWidth, size) {
    let px = size;
    bubbleCtx.font = `bold ${px}px sans-serif`;
    while (px > 14 && bubbleCtx.measureText(text).width > maxWidth) {
      px -= 2;
      bubbleCtx.font = `bold ${px}px sans-serif`;
    }
    bubbleCtx.fillText(text, x, y);
  }

  // Uma linha do balão: NOME [fruto] x3 = 12 (moeda). Sem fruto, vira a linha do TOTAL.
  function drawRow(y, name, qty, value, size) {
    bubbleCtx.fillStyle = "#3d405b";
    bubbleCtx.textBaseline = "middle";
    bubbleCtx.textAlign = "left";
    fitText(name, 30, y + 2, 170, size);
    bubbleCtx.textAlign = "center";
    bubbleCtx.font = `bold ${size}px sans-serif`;
    if (qty > 0) bubbleCtx.fillText(`x${qty}`, 294, y + 2);
    bubbleCtx.fillText("=", 346, y + 2);
    bubbleCtx.fillText(String(value), 398, y + 3);
    coin(452, y, size * 0.45);
  }

  function orderTotal() {
    let total = 0;
    for (let i = 0; i < kinds; i += 1) total += order[i].qty * PLANTS[order[i].type].price;
    return total;
  }

  function drawBubble() {
    const happy = state === "happy";
    bubbleCtx.clearRect(0, 0, BUBBLE_W, BUBBLE_H);
    bubbleCtx.fillStyle = "#ffffff";
    bubbleCtx.beginPath();
    bubbleCtx.roundRect(6, 6, BUBBLE_W - 12, BODY_BOTTOM - 6, 30);
    bubbleCtx.moveTo(236, BODY_BOTTOM - 2);
    bubbleCtx.lineTo(256, BUBBLE_H - 10);
    bubbleCtx.lineTo(280, BODY_BOTTOM - 2);
    bubbleCtx.fill();
    bubbleCtx.lineWidth = ready || happy ? 8 : 4;
    bubbleCtx.strokeStyle = ready || happy ? "#5bb86a" : "#3d405b";
    bubbleCtx.beginPath();
    bubbleCtx.roundRect(8, 8, BUBBLE_W - 16, BODY_BOTTOM - 10, 28);
    bubbleCtx.stroke();

    const rows = kinds === 1 ? ROWS_ONE : ROWS_TWO;
    const size = kinds === 1 ? 48 : 38;
    if (happy) {
      bubbleCtx.fillStyle = "#f2849a";
      bubbleCtx.beginPath();
      bubbleCtx.arc(228, 86, 30, Math.PI, 0);
      bubbleCtx.arc(284, 86, 30, Math.PI, 0);
      bubbleCtx.lineTo(256, 160);
      bubbleCtx.closePath();
      bubbleCtx.fill();
    } else {
      for (let i = 0; i < kinds; i += 1) {
        const plant = PLANTS[order[i].type];
        drawRow(rows[i], plant.name.toUpperCase(), order[i].qty, order[i].qty * plant.price, size);
      }
      if (kinds > 1) {
        bubbleCtx.strokeStyle = "#d9d4c7";
        bubbleCtx.lineWidth = 3;
        bubbleCtx.beginPath();
        bubbleCtx.moveTo(30, rows[2] - 30);
        bubbleCtx.lineTo(BUBBLE_W - 30, rows[2] - 30);
        bubbleCtx.stroke();
        drawRow(rows[2], "TOTAL", 0, orderTotal(), size);
      }
    }
    bubbleTexture.needsUpdate = true;

    const scale = BUBBLE_M / BUBBLE_W;
    for (let i = 0; i < icons.length; i += 1) {
      const on = !happy && i < kinds;
      icons[i].visible = on;
      if (!on) continue;
      icons[i].geometry = fruitGeos[order[i].type];
      icons[i].scale.setScalar(kinds === 1 ? 1.7 : 1.5);
      icons[i].position.set(-(236 - BUBBLE_W / 2) * scale, (BUBBLE_H / 2 - rows[i]) * scale, -0.03);
    }
  }

  function unlockedTypes() {
    const types = [];
    for (const id of progress.data.seeds) {
      const type = PLANT_INDEX[id];
      if (type !== undefined && !types.includes(type)) types.push(type);
    }
    for (let i = types.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    return types;
  }

  // Para pedidos maiores ou clientes especiais: mudar a regra aqui.
  function newOrder() {
    const types = unlockedTypes();
    kinds = types.length > 1 && Math.random() < 0.5 ? 2 : 1;
    const beginner = (progress.data.served ?? 0) < 2;
    const total = beginner ? kinds : kinds + Math.floor(Math.random() * (4 - kinds));
    for (let i = 0; i < kinds; i += 1) {
      order[i].type = types[i];
      order[i].qty = 1;
    }
    for (let extra = total - kinds; extra > 0; extra -= 1) order[Math.floor(Math.random() * kinds)].qty += 1;
  }

  function isReady() {
    for (let i = 0; i < kinds; i += 1) {
      const id = PLANTS[order[i].type].id;
      if ((progress.data.baskets[id] ?? 0) < order[i].qty) return false;
    }
    return true;
  }

  function spawn() {
    newOrder();
    customer.dress();
    side = Math.random() < 0.5 ? 1 : -1;
    yaw = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    customer.group.position.set(side * WALK_FROM, 0, CUSTOMER_Z);
    customer.group.rotation.y = yaw;
    customer.group.visible = true;
    bubble.visible = false;
    state = "arrive";
  }

  function launch(type, from, index, total, value) {
    const flyer = flyers.find((item) => !item.active && !item.view.visible);
    if (!flyer) {
      shownMoney += value;
      drawSign();
      return;
    }
    flyer.active = true;
    flyer.t = -index * 0.15;
    flyer.value = value;
    flyer.from.copy(from);
    flyer.to.set((index - (total - 1) / 2) * 0.09, COUNTER_TOP + 0.03, COUNTER_Z + 0.17);
    flyer.view.geometry = fruitGeos[type];
    flyer.view.position.copy(from);
  }

  return {
    colliders,
    get served() {
      return served;
    },
    get dayDone() {
      return served >= DAY_GOAL;
    },
    syncMoney() {
      let pending = 0;
      for (const flyer of flyers) if (flyer.active) pending += flyer.value;
      shownMoney = (progress.data.money ?? 0) - pending;
      drawSign();
    },
    canUse: (target) => target === hit && state === "wait" && ready,
    use(target) {
      if (target !== hit || state !== "wait" || !ready) return null;
      let total = 0;
      for (let i = 0; i < kinds; i += 1) total += order[i].qty;
      let pay = 0;
      let index = 0;
      for (let i = 0; i < kinds; i += 1) {
        const { type, qty } = order[i];
        const price = PLANTS[type].price;
        garden.basketPosition(type, tmpFrom);
        garden.take(type, qty);
        pay += price * qty;
        for (let q = 0; q < qty; q += 1) launch(type, tmpFrom, index++, total, price);
      }
      progress.data.money = (progress.data.money ?? 0) + pay;
      progress.data.served = (progress.data.served ?? 0) + 1;
      progress.save();
      served += 1;
      state = "happy";
      timer = 1.1 + 0.15 * (total - 1) + 0.6;
      ready = false;
      drawBubble();
      return "venda";
    },
    update(dt) {
      time += dt;
      let sound = null;

      if (state === "away") {
        timer -= dt;
        if (timer <= 0) spawn();
      } else if (state === "arrive") {
        const x = customer.group.position.x - side * WALK_SPEED * dt;
        if (side * x <= 0) {
          customer.group.position.x = 0;
          state = "wait";
          yaw = 0;
          waved = 0;
          ready = isReady();
          bubble.visible = true;
          drawBubble();
          sound = "cliente";
        } else {
          customer.group.position.x = x;
        }
      } else if (state === "wait") {
        waved += dt;
        const now = isReady();
        if (now !== ready) {
          ready = now;
          drawBubble();
        }
        bubble.scale.setScalar(ready ? 1 + Math.sin(time * 5) * 0.05 : 1);
      } else if (state === "happy") {
        timer -= dt;
        bubble.scale.setScalar(1);
        if (timer <= 0) {
          state = "leave";
          yaw = side > 0 ? Math.PI / 2 : -Math.PI / 2;
          bubble.visible = false;
          customer.setBag(true);
          for (const flyer of flyers) {
            flyer.active = false;
            flyer.view.visible = false;
          }
        }
      } else if (state === "leave") {
        customer.group.position.x -= side * WALK_SPEED * dt;
        if (Math.abs(customer.group.position.x) >= WALK_FROM) {
          customer.group.visible = false;
          state = "away";
          timer = 2.5 + Math.random() * 2;
        }
      }

      if (customer.group.visible) {
        customer.group.rotation.y = turn(customer.group.rotation.y, yaw, Math.min(1, dt * 6));
        const walking = state === "arrive" || state === "leave";
        const mode = walking ? "walk" : state === "happy" ? "happy" : waved < WAVE_TIME ? "wave" : "idle";
        customer.animate(dt, mode, time);
      }

      for (const flyer of flyers) {
        if (!flyer.active) continue;
        if (flyer.t < 0) {
          flyer.t += dt;
          continue;
        }
        flyer.view.visible = true;
        flyer.t = Math.min(1, flyer.t + dt / 1.1);
        const t = flyer.t;
        flyer.view.position.lerpVectors(flyer.from, flyer.to, t);
        flyer.view.position.y += Math.sin(t * Math.PI) * 0.6;
        flyer.view.rotation.y = t * 8;
        if (t >= 1) {
          flyer.active = false;
          shownMoney += flyer.value;
          drawSign();
          sound = "moeda";
        }
      }

      return sound;
    },
  };
}
