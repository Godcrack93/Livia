import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { HIGH, jitter, nail, plank, tint, wood } from "./detail.js";
import { PLANTS, fruitGeometry, mergeAll, paint, plantGeometry } from "./models.js";
import { MAX_POTS } from "./progress.js";

const BENCH_TOP = 0.55;
const RADIUS = 0.82;
const POT_GAP = 0.41;
const TABLE_TOP = 0.5;
const RISE = 0.08;
const SPACING = 0.155;
const ROW_Z = [0.085, -0.08];
const STAND_ANGLE = 1.3;
const STAND_DIST = 0.85;
const FIREFLY_COUNT = 24;
const RAIN_COUNT = 16;
const RAIN_TIME = 1.8;
const CLOUD_Y = 1.55;
const TAG_W = 128;
const TAG_H = 96;
const WATER_USE = 1 / 20;
// Só dá para regar de novo abaixo desta fração (a linha vermelha do medidor).
const REFILL = 0.2;
const GAUGE_Y = 0.035;
const GAUGE_H = 0.09;
const POUR_TIME = 0.9;
const CAN_COLOR = 0x4f8fcf;
const CAN_SPOT = new THREE.Vector3(0, BENCH_TOP, -0.58);
const SPOUT_TIP = new THREE.Vector3(0.13, 0.1, 0);
const POT_COLORS = [0xe07a5f, 0x81b29a, 0xf2cc8f, 0xe9c46a];
const POT_DECOR = [0xfff3c4, 0xfff3c4, 0xe07a5f, 0xe07a5f];
const TAU = Math.PI * 2;
const PACKET_TEXT_W = 256;
const PACKET_TEXT_H = 64;
const SLOT_ORDER = [1, 0, 2, 4, 3, 5];
const FRUIT_SPOTS = [
  [0, 0.03, 0],
  [0.027, 0.05, 0],
  [-0.027, 0.05, 0],
  [0, 0.05, 0.027],
  [0, 0.05, -0.027],
];
const SHOWN = FRUIT_SPOTS.length;
const PLANT_INDEX = Object.fromEntries(PLANTS.map((plant, index) => [plant.id, index]));
const DRY = new THREE.Color(0xc29a66);
const WET = new THREE.Color(0x5b4030);

const lambert = new THREE.MeshLambertMaterial({ vertexColors: true });
const hidden = new THREE.MeshBasicMaterial({ visible: false });
const waterMaterial = new THREE.MeshBasicMaterial({ color: 0x5aa9d6 });
const tmpMatrix = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3(0.8, 0.8, 0.8);
const UP = new THREE.Vector3(0, 1, 0);

// Perfil do vaso torneado (raio, altura). O corpo fica dentro de r 0,075 na frente por causa do medidor.
const POT_PROFILE = [
  [0.001, 0], [0.054, 0], [0.059, 0.004], [0.061, 0.011], [0.058, 0.016], [0.06, 0.021],
  [0.075, 0.135], [0.078, 0.14], [0.088, 0.145], [0.093, 0.151], [0.094, 0.164], [0.091, 0.177],
  [0.086, 0.182], [0.079, 0.182], [0.075, 0.172], [0.072, 0.15], [0.001, 0.15],
];
const INNER_FROM = 13;

function bodyRadius(y) {
  return 0.06 + (0.015 * (y - 0.021)) / 0.114;
}

function detailedPot(hex, decor) {
  const lathe = new THREE.LatheGeometry(POT_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 28);
  const base = new THREE.Color(hex);
  const colors = new Float32Array(lathe.attributes.position.count * 3);
  const pos = lathe.attributes.position;
  const rows = POT_PROFILE.length;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const angle = Math.atan2(pos.getZ(i), pos.getX(i));
    let f = 0.8 + Math.min(1, y / 0.14) * 0.2;
    if (y > 0.14) f = 1.06;
    if (i % rows >= INNER_FROM) f = 0.62;
    f *= 1 + 0.045 * Math.sin(angle * 7 + y * 90) * Math.sin(angle * 3 - y * 40);
    colors[i * 3] = base.r * f;
    colors[i * 3 + 1] = base.g * f;
    colors[i * 3 + 2] = base.b * f;
  }
  lathe.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const saucer = new THREE.LatheGeometry(
    [[0.001, 0], [0.086, 0], [0.097, 0.012], [0.1, 0.021], [0.094, 0.022], [0.088, 0.009], [0.001, 0.009]]
      .map(([r, y]) => new THREE.Vector2(r, y)),
    28,
  );
  const parts = [lathe, paint(saucer, tint(hex, 0.82))];

  const band = new THREE.TorusGeometry(bodyRadius(0.122) + 0.0005, 0.0028, 5, 28, TAU - 0.9);
  band.rotateX(Math.PI / 2);
  band.rotateY((3 * Math.PI) / 2 - 0.45);
  band.translate(0, 0.122, 0);
  parts.push(paint(band, decor));
  for (let k = 0; k < 9; k += 1) {
    const theta = Math.PI / 2 + 0.6 + (k / 8) * (TAU - 1.2);
    const r = bodyRadius(0.085);
    const dot = new THREE.SphereGeometry(0.0058, 6, 4);
    dot.scale(1, 1, 0.35);
    dot.rotateY(Math.PI / 2 - theta);
    dot.translate(Math.cos(theta) * r, 0.085, Math.sin(theta) * r);
    parts.push(paint(dot, decor));
  }

  const frame = new THREE.BoxGeometry(0.032, 0.114, 0.003);
  frame.translate(0, 0.08, 0.0755);
  const gauge = new THREE.BoxGeometry(0.024, 0.104, 0.004);
  gauge.translate(0, 0.08, 0.078);
  parts.push(paint(frame, tint(hex, 0.6)), paint(gauge, 0xfff3c4));
  for (const t of [0.25, 0.5, 0.75, 1]) {
    for (const side of [-1, 1]) {
      const tick = new THREE.BoxGeometry(0.004, 0.0016, 0.002);
      tick.translate(side * 0.0095, GAUGE_Y + GAUGE_H * t, 0.0805);
      parts.push(paint(tick, 0x9aa5b1));
    }
  }
  const mark = new THREE.BoxGeometry(0.034, 0.004, 0.003);
  mark.translate(0, GAUGE_Y + GAUGE_H * REFILL, 0.0855);
  parts.push(paint(mark, 0xe23d3d));

  for (let k = 0; k < 6; k += 1) {
    const theta = k * 1.13 + 0.4;
    const r = 0.045 + (k % 3) * 0.006;
    const pebble = new THREE.IcosahedronGeometry(0.0055 + (k % 2) * 0.002, 0);
    pebble.scale(1, 0.6, 1);
    pebble.translate(Math.cos(theta) * r, 0.1615, Math.sin(theta) * r);
    parts.push(paint(pebble, jitter(0xb9b2a6, 0.1)));
  }

  const shadow = new THREE.CircleGeometry(0.15, 20);
  shadow.rotateX(-Math.PI / 2);
  shadow.translate(0, 0.004, 0);
  parts.push(paint(shadow, 0xb88a58));
  return mergeAll(parts);
}

function potGeometry(hex, index) {
  if (HIGH) return detailedPot(hex, POT_DECOR[index]);
  const body = new THREE.CylinderGeometry(0.075, 0.06, 0.16, 8);
  body.translate(0, 0.08, 0);
  const rim = new THREE.CylinderGeometry(0.09, 0.09, 0.03, 8);
  rim.translate(0, 0.165, 0);
  const gauge = new THREE.BoxGeometry(0.024, 0.104, 0.004);
  gauge.translate(0, 0.08, 0.078);
  const mark = new THREE.BoxGeometry(0.034, 0.004, 0.003);
  mark.translate(0, GAUGE_Y + GAUGE_H * REFILL, 0.0855);
  const shadow = new THREE.CircleGeometry(0.14, 12);
  shadow.rotateX(-Math.PI / 2);
  shadow.translate(0, 0.006, 0);
  return mergeGeometries([
    paint(body, hex),
    paint(rim, hex),
    paint(gauge, 0xfff3c4),
    paint(mark, 0xe23d3d),
    paint(shadow, 0x3e8a52),
  ]);
}

function decalFlower(z, side) {
  const parts = [];
  for (let i = 0; i < 6; i += 1) {
    const petal = new THREE.SphereGeometry(1, 5, 3);
    petal.scale(0.004, 0.009, 0.0012);
    petal.translate(0, 0.009, 0);
    petal.rotateZ((i / 6) * TAU);
    parts.push(paint(petal, 0xfff3c4));
  }
  const center = new THREE.SphereGeometry(0.0045, 6, 4);
  center.scale(1, 1, 0.4);
  parts.push(paint(center, 0xf5d04c));
  for (const geo of parts) {
    if (side < 0) geo.rotateY(Math.PI);
    geo.translate(0, 0.047, z);
  }
  return parts;
}

// Regador detalhado: corpo torneado com frisos, boca com borda e água, bico com anel,
// crivo furadinho, alça de cima e de trás com rebites e uma florzinha pintada dos dois lados.
function detailedCan() {
  const DARK = 0x3d6fa8;
  const body = new THREE.LatheGeometry(
    [
      [0.001, 0], [0.04, 0], [0.046, 0.004], [0.048, 0.012], [0.047, 0.08], [0.043, 0.09],
      [0.037, 0.096], [0.035, 0.1], [0.03, 0.1], [0.03, 0.094], [0.001, 0.094],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    24,
  );
  const parts = [paint(body, CAN_COLOR)];
  const water = new THREE.CircleGeometry(0.03, 16);
  water.rotateX(-Math.PI / 2);
  water.translate(0, 0.0945, 0);
  parts.push(paint(water, 0x5aa9d6));
  const rim = new THREE.TorusGeometry(0.0325, 0.0032, 5, 20);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, 0.1, 0);
  parts.push(paint(rim, DARK));
  for (const y of [0.02, 0.07]) {
    const band = new THREE.TorusGeometry(0.0478, 0.0022, 4, 24);
    band.rotateX(Math.PI / 2);
    band.translate(0, y, 0);
    parts.push(paint(band, DARK));
  }

  const spout = new THREE.CylinderGeometry(0.0055, 0.0095, 0.11, 10);
  spout.translate(0, 0.055, 0);
  spout.rotateZ(-0.95);
  spout.translate(0.035, 0.03, 0);
  const collar = new THREE.TorusGeometry(0.0105, 0.0025, 4, 12);
  collar.rotateX(Math.PI / 2);
  collar.translate(0, 0.012, 0);
  collar.rotateZ(-0.95);
  collar.translate(0.035, 0.03, 0);
  parts.push(paint(spout, CAN_COLOR), paint(collar, DARK));

  const roseAngle = Math.PI - 0.95;
  const rose = new THREE.ConeGeometry(0.016, 0.022, 12);
  rose.rotateZ(roseAngle);
  rose.translate(SPOUT_TIP.x - 0.004, SPOUT_TIP.y - 0.004, 0);
  parts.push(paint(rose, DARK));
  const face = [paint(new THREE.CircleGeometry(0.016, 14), 0x6f9fd8)];
  for (let k = 0; k < 7; k += 1) {
    const hole = new THREE.CircleGeometry(0.0022, 5);
    const a = (k / 6) * TAU;
    const r = k === 6 ? 0 : 0.0095;
    hole.translate(Math.cos(a) * r, Math.sin(a) * r, 0.0005);
    face.push(paint(hole, 0x24476e));
  }
  const dir = new THREE.Vector3(Math.sin(0.95), Math.cos(0.95), 0);
  for (const geo of face) {
    geo.rotateY(Math.PI / 2);
    geo.rotateZ(Math.atan2(dir.y, dir.x));
    geo.translate(SPOUT_TIP.x - 0.004 + dir.x * 0.0112, SPOUT_TIP.y - 0.004 + dir.y * 0.0112, 0);
    parts.push(geo);
  }

  const handle = new THREE.TorusGeometry(0.034, 0.006, 6, 18, Math.PI);
  handle.translate(-0.012, 0.1, 0);
  const backHandle = new THREE.TorusGeometry(0.028, 0.0055, 6, 14, Math.PI);
  backHandle.rotateZ(Math.PI / 2);
  backHandle.translate(-0.047, 0.052, 0);
  parts.push(paint(handle, DARK), paint(backHandle, DARK));
  for (const [x, y] of [[0.022, 0.1], [-0.046, 0.1], [-0.047, 0.08], [-0.047, 0.024]]) {
    const rivet = new THREE.SphereGeometry(0.0045, 6, 4);
    rivet.translate(x, y, 0);
    parts.push(paint(rivet, 0x9aa5b1));
  }
  parts.push(...decalFlower(0.0478, 1), ...decalFlower(-0.0478, -1));
  return mergeGeometries(parts);
}

function canGeometry() {
  if (HIGH) return detailedCan();
  const body = new THREE.CylinderGeometry(0.042, 0.048, 0.09, 12);
  body.translate(0, 0.045, 0);
  const lid = new THREE.CylinderGeometry(0.034, 0.042, 0.012, 12);
  lid.translate(0, 0.096, 0);
  const spout = new THREE.CylinderGeometry(0.006, 0.01, 0.11, 6);
  spout.translate(0, 0.055, 0);
  spout.rotateZ(-0.95);
  spout.translate(0.035, 0.03, 0);
  const rose = new THREE.ConeGeometry(0.016, 0.022, 8);
  rose.rotateZ(Math.PI - 0.95);
  rose.translate(SPOUT_TIP.x - 0.004, SPOUT_TIP.y - 0.004, 0);
  const handle = new THREE.TorusGeometry(0.034, 0.006, 5, 12, Math.PI);
  handle.translate(-0.012, 0.1, 0);
  return mergeGeometries([
    paint(body, CAN_COLOR),
    paint(lid, 0x3d6fa8),
    paint(spout, CAN_COLOR),
    paint(rose, 0x3d6fa8),
    paint(handle, 0x3d6fa8),
  ]);
}

function dropGeometry() {
  const ball = new THREE.SphereGeometry(0.02, 8, 6);
  const tip = new THREE.ConeGeometry(0.0145, 0.026, 8);
  tip.translate(0, 0.024, 0);
  return mergeGeometries([ball, tip]);
}

function wingGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.004);
  shape.quadraticCurveTo(0.012, 0.06, 0.05, 0.055);
  shape.quadraticCurveTo(0.075, 0.045, 0.058, 0.012);
  shape.quadraticCurveTo(0.05, 0, 0.045, -0.006);
  shape.quadraticCurveTo(0.052, -0.04, 0.028, -0.042);
  shape.quadraticCurveTo(0.008, -0.04, 0, -0.012);
  shape.lineTo(0, 0.004);
  const geo = new THREE.ShapeGeometry(shape, 6);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

const WING_W = 256;
const WING_H = 352;

// Asa direita pintada no canvas: asa da frente laranja e a de trás rosa com um "olho", bordas escuras,
// nervuras e bolinhas brancas. A esquerda é a mesma, espelhada.
function wingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = WING_W;
  canvas.height = WING_H;
  const ctx = canvas.getContext("2d");
  const fore = new Path2D();
  fore.moveTo(4, 176);
  fore.bezierCurveTo(20, 60, 90, 6, 180, 10);
  fore.quadraticCurveTo(250, 14, 246, 62);
  fore.bezierCurveTo(242, 120, 200, 168, 140, 184);
  fore.lineTo(4, 190);
  fore.closePath();
  const hind = new Path2D();
  hind.moveTo(4, 184);
  hind.lineTo(132, 186);
  hind.bezierCurveTo(200, 198, 214, 268, 170, 318);
  hind.bezierCurveTo(130, 346, 62, 342, 32, 300);
  hind.bezierCurveTo(12, 270, 2, 230, 4, 184);
  hind.closePath();

  function paintWing(path, stops, veins) {
    ctx.save();
    ctx.clip(path);
    const grad = ctx.createRadialGradient(6, 186, 4, 6, 186, 270);
    stops.forEach(([at, color]) => grad.addColorStop(at, color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WING_W, WING_H);
    ctx.strokeStyle = "rgba(43, 43, 58, 0.75)";
    ctx.lineWidth = 3;
    for (const [x, y] of veins) {
      ctx.beginPath();
      ctx.moveTo(6, 186);
      ctx.quadraticCurveTo((6 + x) / 2, (186 + y) / 2 + 8, x, y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = "#2b2b3a";
    ctx.lineWidth = 16;
    ctx.lineJoin = "round";
    ctx.stroke(path);
  }

  paintWing(fore, [[0, "#f5d04c"], [0.5, "#f28c28"], [1, "#e2572d"]], [[80, 20], [150, 14], [215, 40], [238, 100], [190, 160]]);
  paintWing(hind, [[0, "#ffe0e8"], [0.45, "#f2849a"], [1, "#d9607e"]], [[190, 240], [160, 318], [90, 336], [40, 300]]);

  ctx.fillStyle = "#ffffff";
  for (const [x, y, r] of [[176, 20, 6], [206, 24, 5], [230, 44, 6], [238, 72, 5], [232, 102, 5], [60, 60, 4]]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [r, color] of [[27, "#2b2b3a"], [21, "#4f8fcf"], [12, "#f5d04c"], [5, "#ffffff"]]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(124, 272, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function stick(hex, radius, from, dir, length) {
  const geo = new THREE.CylinderGeometry(radius, radius, length, 4);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()));
  geo.translate(from.x + (dir.x * length) / 2, from.y + (dir.y * length) / 2, from.z + (dir.z * length) / 2);
  return paint(geo, hex);
}

function ball(hex, r, x, y, z, sx = 1, sy = 1, sz = 1) {
  const geo = new THREE.SphereGeometry(r, 8, 6);
  geo.scale(sx, sy, sz);
  geo.translate(x, y, z);
  return paint(geo, hex);
}

// Corpo: cabeça com olhos brilhantes, tórax peludo, abdômen em gomos, seis perninhas e antenas com bolinha.
function butterflyBody() {
  const parts = [
    ball(0x3d405b, 0.0085, 0, 0, -0.03),
    ball(0x4a4e6a, 0.009, 0, 0, -0.014, 1, 1, 1.5),
  ];
  for (const side of [-1, 1]) {
    parts.push(ball(0x15161f, 0.0036, side * 0.0056, 0.002, -0.034));
    parts.push(ball(0xffffff, 0.0012, side * 0.0068, 0.0045, -0.0368));
    let tip = new THREE.Vector3(side * 0.003, 0.006, -0.036);
    for (const dir of [new THREE.Vector3(side * 0.35, 0.6, -0.72), new THREE.Vector3(side * 0.45, 0.3, -0.84)]) {
      dir.normalize();
      parts.push(stick(0x2b2b3a, 0.0008, tip, dir, 0.021));
      tip = tip.clone().addScaledVector(dir, 0.021);
    }
    parts.push(ball(0x2b2b3a, 0.0024, tip.x, tip.y, tip.z));
    for (const dz of [-0.02, -0.014, -0.008]) {
      parts.push(stick(0x2b2b3a, 0.0007, new THREE.Vector3(side * 0.004, -0.005, dz), new THREE.Vector3(side * 0.7, -0.7, dz * 8), 0.015));
    }
  }
  const sizes = [0.0075, 0.007, 0.0062, 0.0053, 0.0042];
  sizes.forEach((r, k) => parts.push(ball(k % 2 ? 0x5a5f80 : 0x3d405b, r, 0, 0, 0.002 + k * 0.0085, 1, 1, 1.2)));
  return mergeGeometries(parts);
}

function createDetailedButterfly() {
  const group = new THREE.Group();
  group.scale.setScalar(1.3);
  const body = new THREE.Mesh(butterflyBody(), lambert);
  const wingMaterial = new THREE.MeshLambertMaterial({ map: wingTexture(), alphaTest: 0.5, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(0.08, 0.11);
  geo.translate(0.042, 0.005, 0);
  geo.rotateX(-Math.PI / 2);
  const right = new THREE.Mesh(geo, wingMaterial);
  const left = new THREE.Mesh(geo.clone().scale(-1, 1, 1), wingMaterial);
  group.add(body, right, left);
  return { group, left, right };
}

function createButterfly() {
  if (HIGH) return createDetailedButterfly();
  const group = new THREE.Group();
  group.scale.setScalar(1.3);
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.008, 0.05, 3, 6).rotateX(Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x3d405b }),
  );
  const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xf2849a, side: THREE.DoubleSide });
  const geo = wingGeometry();
  const right = new THREE.Mesh(geo, wingMaterial);
  const left = new THREE.Mesh(geo.clone().scale(-1, 1, 1), wingMaterial);
  group.add(body, right, left);
  return { group, left, right };
}

function makeStand(side) {
  const x = Math.sin(STAND_ANGLE) * STAND_DIST * side;
  const z = -Math.cos(STAND_ANGLE) * STAND_DIST;
  const yaw = Math.atan2(-x, -z);
  return { yaw, matrix: new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z) };
}

function standSpot(stand, slot, target = new THREE.Vector3()) {
  const col = slot % 3;
  const row = Math.floor(slot / 3);
  return target.set((col - 1) * SPACING, TABLE_TOP + row * RISE, ROW_Z[row]).applyMatrix4(stand.matrix);
}

function standParts(stand) {
  const top = new THREE.BoxGeometry(0.52, 0.03, 0.38);
  top.translate(0, TABLE_TOP - 0.015, 0);
  const riser = new THREE.BoxGeometry(0.52, RISE, 0.19);
  riser.translate(0, TABLE_TOP + RISE / 2, ROW_Z[1]);
  const parts = [paint(top, 0xf2cc8f), paint(riser, 0xe9c46a)];
  for (const sx of [-0.22, 0.22]) {
    for (const sz of [-0.15, 0.15]) {
      const leg = new THREE.BoxGeometry(0.03, TABLE_TOP - 0.03, 0.03);
      leg.translate(sx, (TABLE_TOP - 0.03) / 2, sz);
      parts.push(paint(leg, 0xe07a5f));
    }
  }
  const shadow = new THREE.CircleGeometry(1, 16);
  shadow.rotateX(-Math.PI / 2);
  shadow.scale(0.34, 1, 0.26);
  shadow.translate(0, 0.005, 0);
  parts.push(paint(shadow, 0x3e8a52));
  for (const geo of parts) geo.applyMatrix4(stand.matrix);
  return parts;
}

// Mesinha lateral detalhada: tábuas pregadas, degrau de trás em caixa, saia e travessas.
function detailedStand(stand, woodParts, plain) {
  const local = [];
  const tops = [0xf2cc8f, 0xeac084, 0xf5d39b, 0xe8bf87];
  const gap = 0.005;
  const pw = (0.38 - 3 * gap) / 4;
  for (let i = 0; i < 4; i += 1) {
    const z = (i - 1.5) * (pw + gap);
    local.push(plank(tops[i], 0.53, 0.03, pw, 0, TABLE_TOP - 0.015, z, { radius: 0.005 }));
    for (const x of [-0.24, 0.24]) local.push(nail(x, TABLE_TOP + 0.0008, z));
  }
  const riserTop = TABLE_TOP + RISE;
  const rz = ROW_Z[1];
  for (const dz of [-0.0475, 0.0475]) {
    local.push(plank(jitter(0xe9c46a, 0.05), 0.53, 0.02, 0.0925, 0, riserTop - 0.01, rz + dz, { radius: 0.005 }));
    for (const x of [-0.245, 0.245]) local.push(nail(x, riserTop + 0.0008, rz + dz));
  }
  for (const [z, face] of [[rz + 0.086, 1], [rz - 0.086, -1]]) {
    local.push(plank(tint(0xe9c46a, 0.9), 0.52, 0.06, 0.018, 0, TABLE_TOP + 0.03, z, { radius: 0.004 }));
    for (const x of [-0.235, 0.235]) local.push(nail(x, TABLE_TOP + 0.03, z + face * 0.0098, "z"));
  }
  for (const side of [-1, 1]) {
    local.push(plank(tint(0xe9c46a, 0.85), 0.018, 0.06, 0.19, side * 0.251, TABLE_TOP + 0.03, rz, { radius: 0.004 }));
  }
  const legH = TABLE_TOP - 0.045;
  for (const sx of [-0.22, 0.22]) {
    for (const sz of [-0.15, 0.15]) {
      local.push(plank(jitter(0xe07a5f, 0.04), 0.035, legH, 0.035, sx, 0.015 + legH / 2, sz, { radius: 0.006 }));
      local.push(plank(tint(0xe07a5f, 0.7), 0.043, 0.015, 0.043, sx, 0.0075, sz, { radius: 0.004 }));
    }
    local.push(plank(0xe07a5f, 0.02, 0.025, 0.3, sx, 0.1, 0, { radius: 0.004 }));
  }
  local.push(plank(tint(0xe07a5f, 0.95), 0.44, 0.025, 0.02, 0, 0.1, 0, { radius: 0.004 }));
  for (const z of [-0.16, 0.16]) local.push(plank(tint(0xe07a5f, 0.92), 0.47, 0.045, 0.015, 0, TABLE_TOP - 0.0525, z));
  for (const x of [-0.23, 0.23]) local.push(plank(tint(0xe07a5f, 0.92), 0.015, 0.045, 0.3, x, TABLE_TOP - 0.0525, 0));
  for (const geo of local) woodParts.push(geo.applyMatrix4(stand.matrix));

  const shadow = new THREE.CircleGeometry(1, 20);
  shadow.rotateX(-Math.PI / 2);
  shadow.scale(0.36, 1, 0.28);
  shadow.translate(0, 0.005, 0);
  plain.push(paint(shadow, 0x3e8a52).applyMatrix4(stand.matrix));
}

function zigzag(width, band, tooth, teeth) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, band);
  const step = width / teeth;
  for (let i = teeth - 1; i >= 0; i -= 1) {
    const x = -width / 2 + i * step;
    shape.lineTo(x + step / 2, band + tooth);
    shape.lineTo(x, band);
  }
  shape.lineTo(-width / 2, 0);
  return shape;
}

function roundedPlate(w, h, r) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return new THREE.ShapeGeometry(shape, 4);
}

// Pacotinho de papel estufado, com a borda de cima serrilhada, costura embaixo e etiqueta com desenho.
function detailedPacket(hex, picture) {
  const W = 0.1;
  const body = new THREE.BoxGeometry(W, 0.118, 0.018, 8, 10, 1);
  const pos = body.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / (W / 2);
    const y = pos.getY(i) / 0.059;
    const z = pos.getZ(i);
    const puff = 0.004 + 0.0075 * (1 - x * x) * (1 - y * y * 0.8);
    pos.setZ(i, Math.sign(z) * puff);
  }
  body.translate(0, -0.006, 0);
  body.computeVertexNormals();
  const parts = [paint(body, hex)];

  const crimp = new THREE.ExtrudeGeometry(zigzag(W, 0.01, 0.006, 11), { depth: 0.01, bevelEnabled: false });
  crimp.translate(0, 0.053, -0.005);
  parts.push(paint(crimp, tint(hex, 0.78)));
  const fold = new THREE.BoxGeometry(W, 0.0025, 0.0125);
  fold.translate(0, 0.052, 0);
  parts.push(paint(fold, tint(hex, 0.6)));
  const seam = new THREE.BoxGeometry(W + 0.002, 0.008, 0.012);
  seam.translate(0, -0.063, 0);
  parts.push(paint(seam, tint(hex, 0.8)));

  const border = roundedPlate(0.084, 0.098, 0.01);
  border.translate(0, -0.006, 0.0118);
  const label = roundedPlate(0.076, 0.09, 0.008);
  label.translate(0, -0.006, 0.0122);
  const sun = new THREE.CircleGeometry(0.024, 20);
  sun.translate(0, 0.014, 0.0126);
  parts.push(paint(border, tint(hex, 0.7)), paint(label, 0xfff3c4), paint(sun, 0xffe39a));
  for (const [x, yaw] of [[-0.03, 0.5], [-0.022, -0.3]]) {
    const leafy = new THREE.SphereGeometry(1, 6, 4);
    leafy.scale(0.004, 0.009, 0.0015);
    leafy.rotateZ(yaw);
    leafy.translate(x, 0.03, 0.0128);
    parts.push(paint(leafy, 0x5bb86a));
  }
  const mini = picture.clone();
  mini.scale(1.05, 1.05, 1.05);
  mini.translate(0, 0.014, 0.026);
  parts.push(mini);
  return mergeAll(parts);
}

export function packetGeometry(hex, picture) {
  if (HIGH) return detailedPacket(hex, picture);
  const body = paint(new THREE.BoxGeometry(0.1, 0.13, 0.02), hex);
  const label = paint(new THREE.BoxGeometry(0.084, 0.09, 0.004), 0xfff3c4);
  label.translate(0, 0.008, 0.011);
  const mini = picture.clone();
  mini.scale(1.25, 1.25, 1.25);
  mini.translate(0, 0.006, 0.03);
  return mergeAll([body, label, mini]);
}

// Cesta de vime: parede com fiadas trançadas e costelas, borda grossa, paninho xadrez e alça.
function detailedBasket() {
  const LIGHT = 0xc98b4f;
  const DARK = 0xa8703d;
  const wall = new THREE.CylinderGeometry(0.063, 0.05, 0.06, 16, 1, true);
  wall.translate(0, 0.03, 0);
  const bottom = new THREE.CircleGeometry(0.05, 16);
  bottom.rotateX(-Math.PI / 2);
  bottom.translate(0, 0.002, 0);
  const parts = [paint(wall, DARK), paint(bottom, tint(DARK, 0.85))];
  for (let k = 0; k < 4; k += 1) {
    const y = 0.01 + k * 0.014;
    const ring = new THREE.TorusGeometry(0.0505 + (0.0125 * y) / 0.06, 0.0045, 4, 18);
    ring.rotateX(Math.PI / 2);
    ring.rotateY(k * 0.3);
    ring.translate(0, y, 0);
    parts.push(paint(ring, k % 2 ? LIGHT : tint(LIGHT, 0.9)));
  }
  for (let k = 0; k < 10; k += 1) {
    const a = (k / 10) * TAU;
    const rib = new THREE.CylinderGeometry(0.0025, 0.0025, 0.062, 3);
    rib.rotateZ(-0.21);
    rib.translate(0.0565, 0.031, 0);
    rib.rotateY(a);
    parts.push(paint(rib, tint(DARK, 0.8)));
  }
  const rim = new THREE.TorusGeometry(0.065, 0.0065, 5, 20);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, 0.061, 0);
  parts.push(paint(rim, tint(DARK, 0.9)));
  for (let k = 0; k < 8; k += 1) {
    const cloth = new THREE.CylinderGeometry(0.061, 0.057, 0.014, 2, 1, true, (k / 8) * TAU, TAU / 8);
    cloth.translate(0, 0.058, 0);
    parts.push(paint(cloth, k % 2 ? 0xe23d3d : 0xfff3c4));
  }
  const handle = new THREE.TorusGeometry(0.06, 0.0055, 6, 20, Math.PI);
  handle.rotateY(Math.PI / 2);
  handle.translate(0, 0.062, 0);
  parts.push(paint(handle, DARK));
  for (const a of [0.5, Math.PI / 2, Math.PI - 0.5]) {
    const wrap = new THREE.TorusGeometry(0.0068, 0.0022, 4, 8);
    wrap.rotateX(-a - Math.PI / 2);
    wrap.translate(0, 0.062 + Math.sin(a) * 0.06, Math.cos(a) * 0.06);
    parts.push(paint(wrap, 0xe23d3d));
  }
  return mergeGeometries(parts);
}

let basketTemplate = null;

function basketParts(at, yaw) {
  if (HIGH) {
    if (!basketTemplate) basketTemplate = detailedBasket();
    const geo = basketTemplate.clone();
    geo.rotateY(yaw);
    geo.translate(at.x, at.y, at.z);
    return [geo];
  }
  const wall = new THREE.CylinderGeometry(0.065, 0.05, 0.06, 10, 1, true);
  wall.translate(0, 0.03, 0);
  const bottom = new THREE.CircleGeometry(0.05, 10);
  bottom.rotateX(-Math.PI / 2);
  bottom.translate(0, 0.002, 0);
  const handle = new THREE.TorusGeometry(0.06, 0.006, 5, 14, Math.PI);
  handle.rotateY(Math.PI / 2);
  handle.translate(0, 0.06, 0);
  const parts = [paint(wall, 0xc98b4f), paint(bottom, 0xa8703d), paint(handle, 0xa8703d)];
  for (const geo of parts) {
    geo.rotateY(yaw);
    geo.translate(at.x, at.y, at.z);
  }
  return parts;
}

function tagGeometry(index, at, yaw) {
  const geo = new THREE.PlaneGeometry(0.09, 0.0675);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) uv.setX(i, (index + uv.getX(i)) / PLANTS.length);
  geo.rotateX(-0.35);
  geo.translate(0, 0.036, 0.08);
  geo.rotateY(yaw);
  geo.translate(at.x, at.y, at.z);
  return geo;
}

// Nome da semente escrito na etiqueta do pacote (uma textura só, uma faixa por planta).
function packetNames() {
  const canvas = document.createElement("canvas");
  canvas.width = PACKET_TEXT_W;
  canvas.height = PACKET_TEXT_H * PLANTS.length;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff3c4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#3d405b";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  PLANTS.forEach((plant, index) => {
    const text = plant.name.toUpperCase();
    let px = 50;
    ctx.font = `bold ${px}px sans-serif`;
    while (px > 16 && ctx.measureText(text).width > PACKET_TEXT_W - 16) {
      px -= 2;
      ctx.font = `bold ${px}px sans-serif`;
    }
    ctx.fillText(text, PACKET_TEXT_W / 2, index * PACKET_TEXT_H + PACKET_TEXT_H / 2 + 3);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geos = PLANTS.map((_, index) => {
    const geo = new THREE.PlaneGeometry(0.07, 0.0175);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i += 1) uv.setY(i, (PLANTS.length - 1 - index + uv.getY(i)) / PLANTS.length);
    geo.translate(0, -0.037, 0.0127);
    return geo;
  });
  return { geos, material: new THREE.MeshLambertMaterial({ map: texture }) };
}

function mergeOrEmpty(parts) {
  return parts.length ? mergeGeometries(parts) : new THREE.BufferGeometry();
}

function hexCss(hex) {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

function collider(radius, kind, index) {
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), hidden);
  sphere.visible = false;
  sphere.userData.kind = kind;
  sphere.userData.index = index;
  return sphere;
}

function stageOf(growth) {
  if (growth >= 1) return 2;
  return growth >= 0.5 ? 1 : 0;
}

// Upgrades futuros (fertilizante, regador automático) entram nestas duas funções.
function growthRate(pot) {
  return 1 / PLANTS[pot.type].grow;
}

function waterUse() {
  return WATER_USE;
}

export function createGarden(scene, progress) {
  const geos = PLANTS.map((plant) => [0, 1, 2].map((stage) => plantGeometry(plant.id, stage)));
  const fruitGeos = PLANTS.map((plant) => fruitGeometry(plant.id));
  const colliders = [];

  const soilGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.02, HIGH ? 24 : 8);
  soilGeo.translate(0, 0.15, 0);
  const fillGeo = new THREE.BoxGeometry(0.014, GAUGE_H, 0.004);
  fillGeo.translate(0, GAUGE_H / 2, 0);
  const dropGeo = dropGeometry();

  const pots = [];
  for (let index = 0; index < MAX_POTS; index += 1) {
    const base = new THREE.Mesh(potGeometry(POT_COLORS[index], index), lambert);
    const soil = new THREE.Mesh(soilGeo, new THREE.MeshLambertMaterial({ color: DRY }));
    const fill = new THREE.Mesh(fillGeo, waterMaterial);
    fill.position.set(0, GAUGE_Y, 0.082);
    const thirsty = new THREE.Mesh(dropGeo, waterMaterial);
    thirsty.position.set(0, 0.3, 0.12);
    base.add(soil, fill, thirsty);
    const view = new THREE.Mesh(geos[0][0], lambert);
    const hit = collider(0.18, "pot", index);
    scene.add(base, view, hit);

    const saved = progress.data.potState[index];
    const type = PLANT_INDEX[saved?.type] ?? 0;
    const savedStage = saved && Number.isInteger(saved.stage) ? Math.max(-1, Math.min(2, saved.stage)) : -1;
    const growth = savedStage < 0 ? 0 : Math.min(1, Math.max(savedStage * 0.5, Number(saved.growth) || 0));
    const stage = savedStage < 0 ? -1 : stageOf(growth);
    const water = Math.min(1, Math.max(0, Number(saved?.water) || 0));
    if (stage >= 0) view.geometry = geos[type][stage];
    pots.push({
      base, soil, fill, thirsty, view, hit, type, stage, growth, water,
      shownWater: water, on: false, x: 0, z: 0, pop: 0, wiggle: 0,
    });
  }
  let potCount = 1;

  const canGeo = canGeometry();
  const can = new THREE.Mesh(canGeo, lambert);
  can.position.copy(CAN_SPOT);
  can.rotation.y = -0.5;
  const canHit = collider(0.09, "can", -1);
  canHit.position.set(CAN_SPOT.x, CAN_SPOT.y + 0.06, CAN_SPOT.z);
  scene.add(can, canHit);
  let holdingCan = false;

  const pourCan = new THREE.Mesh(canGeo, lambert);
  pourCan.visible = false;
  const streamGeo = new THREE.CylinderGeometry(0.004, 0.007, 1, 5);
  streamGeo.translate(0, -0.5, 0);
  const stream = new THREE.Mesh(streamGeo, waterMaterial);
  stream.visible = false;
  scene.add(pourCan, stream);
  const pour = { t: POUR_TIME, pot: null };

  const seedStand = makeStand(-1);
  const basketStand = makeStand(1);
  if (HIGH) {
    const woodParts = [];
    const plain = [];
    detailedStand(seedStand, woodParts, plain);
    detailedStand(basketStand, woodParts, plain);
    scene.add(new THREE.Mesh(mergeAll(woodParts), wood()), new THREE.Mesh(mergeGeometries(plain), lambert));
  } else {
    scene.add(new THREE.Mesh(mergeGeometries([...standParts(seedStand), ...standParts(basketStand)]), lambert));
  }

  const packetText = HIGH ? packetNames() : null;
  const packets = PLANTS.map((plant, index) => {
    const mesh = new THREE.Mesh(packetGeometry(plant.fruit, fruitGeos[index]), lambert);
    if (packetText) mesh.add(new THREE.Mesh(packetText.geos[index], packetText.material));
    mesh.rotation.order = "YXZ";
    mesh.rotation.set(-0.3, seedStand.yaw, 0);
    const hit = collider(0.07, "seed", index);
    scene.add(mesh, hit);
    return { mesh, hit, baseY: 0 };
  });
  let heldSeed = -1;

  const basketMesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  );
  scene.add(basketMesh);

  const tagCanvas = document.createElement("canvas");
  tagCanvas.width = TAG_W * PLANTS.length;
  tagCanvas.height = TAG_H;
  const tagCtx = tagCanvas.getContext("2d");
  const tagTexture = new THREE.CanvasTexture(tagCanvas);
  tagTexture.colorSpace = THREE.SRGBColorSpace;
  const tagMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ map: tagTexture, alphaTest: 0.5 }));
  scene.add(tagMesh);

  const shown = PLANTS.map((plant) => progress.data.baskets[plant.id] ?? 0);
  const basketAt = PLANTS.map(() => new THREE.Vector3());
  const slotOf = PLANTS.map(() => -1);
  const harvest = PLANTS.map((_, index) => {
    const mesh = new THREE.InstancedMesh(fruitGeos[index], lambert, SHOWN);
    mesh.count = 0;
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  });

  function drawTag(index) {
    const x = index * TAG_W;
    const fruit = hexCss(PLANTS[index].fruit);
    tagCtx.clearRect(x, 0, TAG_W, TAG_H);
    tagCtx.fillStyle = fruit;
    tagCtx.beginPath();
    tagCtx.roundRect(x + 4, 4, TAG_W - 8, TAG_H - 8, 20);
    tagCtx.fill();
    tagCtx.fillStyle = "#fff3c4";
    tagCtx.beginPath();
    tagCtx.roundRect(x + 12, 12, TAG_W - 24, TAG_H - 24, 14);
    tagCtx.fill();
    tagCtx.fillStyle = fruit;
    tagCtx.beginPath();
    tagCtx.arc(x + 36, TAG_H / 2, 15, 0, Math.PI * 2);
    tagCtx.fill();
    const text = String(shown[index]);
    tagCtx.fillStyle = "#3d405b";
    tagCtx.font = `bold ${text.length > 2 ? 34 : 52}px sans-serif`;
    tagCtx.textAlign = "center";
    tagCtx.textBaseline = "middle";
    tagCtx.fillText(text, x + 84, TAG_H / 2 + 3);
    tagTexture.needsUpdate = true;
  }
  PLANTS.forEach((_, index) => drawTag(index));

  function spotPosition(type, k, target) {
    const [dx, dy, dz] = FRUIT_SPOTS[k];
    return target.set(basketAt[type].x + dx, basketAt[type].y + dy, basketAt[type].z + dz);
  }

  function placeFruits(type) {
    const mesh = harvest[type];
    const count = Math.min(shown[type], SHOWN);
    for (let k = 0; k < count; k += 1) {
      spotPosition(type, k, tmpPos);
      tmpQuat.setFromAxisAngle(UP, k * 1.3);
      mesh.setMatrixAt(k, tmpMatrix.compose(tmpPos, tmpQuat, tmpScale));
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
  }

  const flyers = [];
  for (let i = 0; i < 3; i += 1) {
    const view = new THREE.Mesh(fruitGeos[0], lambert);
    view.visible = false;
    scene.add(view);
    flyers.push({ view, t: 0, active: false, from: new THREE.Vector3(), to: new THREE.Vector3(), type: 0 });
  }

  const cloud = new THREE.Group();
  const puffs = [];
  for (const [dx, dy, r] of [
    [-0.12, 0, 0.1],
    [0, 0.04, 0.14],
    [0.13, 0, 0.1],
  ]) {
    const puff = new THREE.IcosahedronGeometry(r, 1);
    puff.scale(1, 0.75, 1);
    puff.translate(dx, dy, 0);
    puffs.push(puff);
  }
  const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xf4f7fb });
  cloud.add(new THREE.Mesh(mergeGeometries(puffs), cloudMaterial));
  const cloudHit = collider(0.22, "cloud", -1);
  cloud.add(cloudHit);
  scene.add(cloud);
  let cloudTarget = 0;
  let cloudTimer = 0;
  let raining = 0;

  const dot = dotTexture();
  const rainPositions = new Float32Array(RAIN_COUNT * 3);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
  const rain = new THREE.Points(
    rainGeo,
    new THREE.PointsMaterial({ color: 0x5aa9d6, size: 0.035, map: dot, alphaTest: 0.5 }),
  );
  rain.frustumCulled = false;
  rain.visible = false;
  scene.add(rain);

  const butterfly = createButterfly();
  scene.add(butterfly.group);

  const flyPositions = new Float32Array(FIREFLY_COUNT * 3);
  const flyBase = new Float32Array(FIREFLY_COUNT * 3);
  const flyPhase = new Float32Array(FIREFLY_COUNT);
  for (let i = 0; i < FIREFLY_COUNT; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.3 + Math.random() * 1.1;
    flyBase[i * 3] = Math.cos(a) * r;
    flyBase[i * 3 + 1] = 0.7 + Math.random() * 0.8;
    flyBase[i * 3 + 2] = -0.8 + Math.sin(a) * r;
    flyPhase[i] = Math.random() * Math.PI * 2;
  }
  flyPositions.set(flyBase);
  const flyGeo = new THREE.BufferGeometry();
  flyGeo.setAttribute("position", new THREE.BufferAttribute(flyPositions, 3));
  const fireflies = new THREE.Points(
    flyGeo,
    new THREE.PointsMaterial({ color: 0xfff3c4, size: 0.05, map: dot, alphaTest: 0.5 }),
  );
  fireflies.visible = false;
  scene.add(fireflies);

  let gazed = -1;
  let time = 0;
  let done = false;
  let saveTimer = 0;
  let centerX = 0;
  let centerZ = -RADIUS;
  let lastX = centerX + 0.16;
  let lastZ = centerZ;
  let heading = 0;

  // Chamar de novo quando a loja liberar sementes ou vasos.
  function refresh() {
    const data = progress.data;
    potCount = Math.max(1, Math.min(data.pots, MAX_POTS));
    colliders.length = 0;
    pots.forEach((pot, index) => {
      pot.on = index < potCount;
      pot.base.visible = pot.on;
      pot.view.visible = pot.on && pot.stage >= 0;
      if (!pot.on) return;
      const angle = (index - (potCount - 1) / 2) * POT_GAP;
      pot.x = Math.sin(angle) * RADIUS;
      pot.z = -Math.cos(angle) * RADIUS;
      pot.base.position.set(pot.x, BENCH_TOP, pot.z);
      pot.base.rotation.y = -angle;
      pot.view.position.set(pot.x, BENCH_TOP + 0.16, pot.z);
      pot.hit.position.set(pot.x, BENCH_TOP + 0.22, pot.z);
      colliders.push(pot.hit);
    });

    const unlocked = [];
    for (const id of data.seeds) {
      const type = PLANT_INDEX[id];
      if (type !== undefined && !unlocked.includes(type) && unlocked.length < SLOT_ORDER.length) unlocked.push(type);
    }
    slotOf.fill(-1);
    unlocked.forEach((type, k) => {
      slotOf[type] = SLOT_ORDER[k];
    });

    const basketGeo = [];
    const tagParts = [];
    packets.forEach((packet, type) => {
      const slot = slotOf[type];
      packet.mesh.visible = slot >= 0;
      harvest[type].visible = slot >= 0;
      if (slot < 0) return;
      standSpot(seedStand, slot, tmpPos);
      packet.mesh.position.set(tmpPos.x, tmpPos.y + 0.075, tmpPos.z);
      packet.baseY = packet.mesh.position.y;
      packet.hit.position.copy(packet.mesh.position);
      colliders.push(packet.hit);

      standSpot(basketStand, slot, basketAt[type]);
      basketGeo.push(...basketParts(basketAt[type], basketStand.yaw));
      tagParts.push(tagGeometry(type, basketAt[type], basketStand.yaw));
      placeFruits(type);
    });
    basketMesh.geometry.dispose();
    basketMesh.geometry = mergeOrEmpty(basketGeo);
    tagMesh.geometry.dispose();
    tagMesh.geometry = mergeOrEmpty(tagParts);

    colliders.push(canHit, cloudHit);
    if (heldSeed >= 0 && slotOf[heldSeed] < 0) heldSeed = -1;
    if (cloudTarget >= potCount) cloudTarget = 0;
  }

  refresh();
  cloud.position.set(pots[0].x, CLOUD_Y, pots[0].z);
  centerX = pots[0].x;
  centerZ = pots[0].z;

  function savePots() {
    saveTimer = 0;
    progress.data.potState = pots.map((pot) => ({
      type: PLANTS[pot.type].id,
      stage: pot.stage,
      growth: Math.round(pot.growth * 1000) / 1000,
      water: Math.round(pot.water * 1000) / 1000,
    }));
    progress.save();
  }

  function hasEmptyPot() {
    for (const pot of pots) if (pot.on && pot.stage < 0) return true;
    return false;
  }

  function growing(pot) {
    return pot.on && (pot.stage === 0 || pot.stage === 1);
  }

  function thirsty(pot) {
    return growing(pot) && pot.water < REFILL;
  }

  function anyThirsty() {
    for (const pot of pots) if (thirsty(pot)) return true;
    return false;
  }

  function show(pot) {
    pot.view.geometry = geos[pot.type][pot.stage];
    pot.view.visible = true;
    pot.pop = 1;
  }

  function fill(pot) {
    pot.water = 1;
    savePots();
  }

  function startPour(pot) {
    pour.t = 0;
    pour.pot = pot;
    pourCan.position.set(pot.x - 0.16, BENCH_TOP + 0.45, pot.z);
    pourCan.rotation.set(0, 0, 0);
    pourCan.visible = true;
  }

  function pick(pot) {
    const type = pot.type;
    const id = PLANTS[type].id;
    progress.data.baskets[id] = (progress.data.baskets[id] ?? 0) + 1;
    pot.stage = -1;
    pot.growth = 0;
    pot.view.visible = false;
    savePots();
    const flyer = flyers.find((item) => !item.active);
    if (!flyer) {
      land(type);
      return;
    }
    flyer.active = true;
    flyer.t = 0;
    flyer.type = type;
    flyer.from.set(pot.x, BENCH_TOP + 0.3, pot.z);
    flyer.view.geometry = fruitGeos[type];
    flyer.view.position.copy(flyer.from);
    flyer.view.visible = true;
  }

  function land(type) {
    shown[type] = Math.min(shown[type] + 1, progress.data.baskets[PLANTS[type].id] ?? 0);
    placeFruits(type);
    drawTag(type);
  }

  function activeIndex() {
    if (gazed >= 0 && growing(pots[gazed])) return gazed;
    for (let i = 0; i < potCount; i += 1) if (growing(pots[i])) return i;
    return 0;
  }

  function updateRain(dt) {
    const attr = rainGeo.attributes.position;
    const floor = BENCH_TOP + 0.17;
    for (let i = 0; i < RAIN_COUNT; i += 1) {
      let y = attr.getY(i) - dt * 1.6;
      if (y < floor || y > CLOUD_Y) {
        const span = y < -5 ? CLOUD_Y - 0.05 - floor : 0.1;
        y = CLOUD_Y - 0.05 - Math.random() * span;
        attr.setX(i, cloud.position.x + (Math.random() - 0.5) * 0.24);
        attr.setZ(i, cloud.position.z + (Math.random() - 0.5) * 0.12);
      }
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  }

  function updatePour(dt) {
    if (pour.t >= POUR_TIME) return;
    pour.t = Math.min(POUR_TIME, pour.t + dt);
    const t = pour.t / POUR_TIME;
    const tilt = Math.min(1, t * 5, (1 - t) * 5);
    pourCan.rotation.z = -0.75 * tilt;
    const pouring = t > 0.2 && t < 0.8;
    stream.visible = pouring;
    if (pouring) {
      pourCan.updateMatrixWorld();
      pourCan.localToWorld(tmpPos.copy(SPOUT_TIP));
      stream.position.copy(tmpPos);
      stream.scale.y = Math.max(0.01, tmpPos.y - (BENCH_TOP + 0.16));
    }
    if (pour.t >= POUR_TIME) {
      pourCan.visible = false;
      stream.visible = false;
    }
  }

  return {
    colliders,
    refresh,
    get heldColor() {
      if (holdingCan) return CAN_COLOR;
      return heldSeed < 0 ? null : PLANTS[heldSeed].fruit;
    },
    celebrate() {
      done = true;
    },
    basketPosition(type, target) {
      return target.set(basketAt[type].x, basketAt[type].y + 0.05, basketAt[type].z);
    },
    take(type, qty) {
      const id = PLANTS[type].id;
      progress.data.baskets[id] = Math.max(0, (progress.data.baskets[id] ?? 0) - qty);
      shown[type] = Math.min(Math.max(0, shown[type] - qty), progress.data.baskets[id]);
      placeFruits(type);
      drawTag(type);
      progress.save();
    },
    setGazed(target) {
      gazed = target?.userData.kind === "pot" ? target.userData.index : -1;
    },
    canUse: (target) => {
      const kind = target.userData.kind;
      if (kind === "pot") {
        const pot = pots[target.userData.index];
        if (pot.stage === 2) return true;
        if (pot.stage < 0) return heldSeed >= 0;
        return holdingCan && thirsty(pot) && pour.t >= POUR_TIME;
      }
      if (kind === "seed") return target.userData.index !== heldSeed && hasEmptyPot();
      if (kind === "can") return true;
      if (kind === "cloud") {
        const pot = pots[cloudTarget];
        const arrived = Math.abs(cloud.position.x - pot.x) < 0.03;
        return raining <= 0 && arrived && thirsty(pot);
      }
      return false;
    },
    // Para uma interação nova: um tipo de collider e um caso aqui.
    use(target) {
      const kind = target.userData.kind;
      if (kind === "pot") {
        const pot = pots[target.userData.index];
        if (pot.stage === 2) {
          pick(pot);
          return "colheita";
        }
        if (pot.stage < 0 && heldSeed >= 0) {
          pot.type = heldSeed;
          pot.stage = 0;
          pot.growth = 0;
          show(pot);
          savePots();
          if (!hasEmptyPot()) heldSeed = -1;
          return "plantar";
        }
        if (holdingCan && growing(pot)) {
          fill(pot);
          startPour(pot);
          return "regar";
        }
        return null;
      }
      if (kind === "seed" && hasEmptyPot()) {
        heldSeed = target.userData.index;
        holdingCan = false;
        return "semente";
      }
      if (kind === "can") {
        holdingCan = !holdingCan;
        if (holdingCan) heldSeed = -1;
        return "pegar";
      }
      if (kind === "cloud" && raining <= 0) {
        raining = RAIN_TIME;
        rain.visible = true;
        rainPositions.fill(-10);
        return "chuva";
      }
      return null;
    },
    hover(target) {
      const kind = target?.userData.kind;
      if (kind === "seed") return PLANTS[target.userData.index].note;
      if (kind !== "pot") return 0;
      const pot = pots[target.userData.index];
      if (pot.stage < 0) return 0;
      pot.wiggle = 0.6;
      return PLANTS[pot.type].note;
    },
    update(dt) {
      time += dt;
      let sound = null;
      let grew = false;

      for (const pot of pots) {
        if (!pot.on) continue;
        if (growing(pot) && pot.water > 0) {
          grew = true;
          pot.growth = Math.min(1, pot.growth + dt * growthRate(pot));
          pot.water = Math.max(0, pot.water - dt * waterUse(pot));
          const stage = stageOf(pot.growth);
          if (stage !== pot.stage) {
            pot.stage = stage;
            show(pot);
            savePots();
            sound = stage === 2 ? "pronto" : "crescer";
          }
        }
        if (pot.stage >= 0) {
          const local = pot.stage === 2 ? 1 : (pot.growth - pot.stage * 0.5) / 0.5;
          const size = pot.stage === 2 ? 1 : 0.55 + 0.45 * local;
          pot.pop = Math.max(0, pot.pop - dt * 3);
          pot.view.scale.setScalar(size * (1 + Math.sin(pot.pop * Math.PI) * 0.2));
        }
        if (pot.wiggle > 0) {
          pot.wiggle = Math.max(0, pot.wiggle - dt);
          pot.view.rotation.z = Math.sin(pot.wiggle * 30) * 0.2 * pot.wiggle;
        }
        pot.shownWater += (pot.water - pot.shownWater) * Math.min(1, dt * 6);
        pot.fill.scale.y = Math.max(0.02, pot.shownWater);
        pot.soil.material.color.lerpColors(DRY, WET, Math.min(1, pot.shownWater * 1.5));
        const dry = thirsty(pot);
        pot.thirsty.visible = dry;
        if (dry) {
          pot.thirsty.position.y = 0.3 + Math.sin(time * 4) * 0.015;
          pot.thirsty.scale.setScalar(1 + Math.sin(time * 6) * 0.12);
        }
      }
      saveTimer += dt;
      if (grew && saveTimer > 5) savePots();

      updatePour(dt);

      for (const flyer of flyers) {
        if (!flyer.active) continue;
        flyer.t = Math.min(1, flyer.t + dt / 0.9);
        const t = flyer.t;
        spotPosition(flyer.type, Math.min(shown[flyer.type], SHOWN - 1), flyer.to);
        flyer.view.position.lerpVectors(flyer.from, flyer.to, t);
        flyer.view.position.y += Math.sin(t * Math.PI) * 0.3;
        flyer.view.scale.setScalar(1.4 - t * 0.6);
        flyer.view.rotation.y = t * 6;
        if (t >= 1) {
          flyer.active = false;
          flyer.view.visible = false;
          land(flyer.type);
        }
      }

      const free = heldSeed < 0 && !holdingCan;
      const invite = free && hasEmptyPot();
      const ease = Math.min(1, dt * 8);
      for (let i = 0; i < packets.length; i += 1) {
        const { mesh, baseY } = packets[i];
        if (!mesh.visible) continue;
        const lift = i === heldSeed ? 0.035 : 0;
        mesh.position.y += (baseY + lift - mesh.position.y) * ease;
        mesh.scale.setScalar(invite ? 1 + Math.sin(time * 4 + i * 0.8) * 0.06 : 1);
      }
      can.visible = !holdingCan;
      can.scale.setScalar(!holdingCan && anyThirsty() ? 1 + Math.sin(time * 5) * 0.08 : 1);

      if (raining > 0) {
        raining -= dt;
        updateRain(dt);
        cloudMaterial.color.setHex(0xc9d6e3);
        if (raining <= 0) {
          rain.visible = false;
          cloudMaterial.color.setHex(0xf4f7fb);
          if (growing(pots[cloudTarget])) {
            fill(pots[cloudTarget]);
            sound = "agua";
          }
        }
      } else {
        cloudTimer += dt;
        if (cloudTimer > 6) {
          cloudTimer = 0;
          cloudTarget = (cloudTarget + 1) % potCount;
        }
      }
      const follow = Math.min(1, dt * 1.2);
      cloud.position.x += (pots[cloudTarget].x - cloud.position.x) * follow;
      cloud.position.z += (pots[cloudTarget].z - cloud.position.z) * follow;
      cloud.position.y = CLOUD_Y + Math.sin(time * 0.9) * 0.02;

      const pot = pots[activeIndex()];
      const toX = pot.x - centerX;
      const toZ = pot.z - centerZ;
      const dist = Math.hypot(toX, toZ);
      if (dist > 0.0001) {
        const step = Math.min(dist, dt * 0.3);
        centerX += (toX / dist) * step;
        centerZ += (toZ / dist) * step;
      }
      const bob = Math.sin(time * 1.4) * 0.03;
      const orbit = time * 0.7;
      const px = centerX + Math.cos(orbit) * 0.16;
      const pz = centerZ + Math.sin(orbit) * 0.1;
      butterfly.group.position.set(px, BENCH_TOP + 0.48 + bob, pz);
      const vx = px - lastX;
      const vz = pz - lastZ;
      if (vx * vx + vz * vz > 1e-9) {
        const want = Math.atan2(-vx, -vz);
        const diff = Math.atan2(Math.sin(want - heading), Math.cos(want - heading));
        heading += diff * Math.min(1, dt * 5);
      }
      lastX = px;
      lastZ = pz;
      butterfly.group.rotation.y = heading;
      const flap = 0.35 + Math.sin(time * 9) * 0.55;
      butterfly.right.rotation.z = flap;
      butterfly.left.rotation.z = -flap;

      if (done) {
        fireflies.visible = true;
        const attr = flyGeo.attributes.position;
        for (let i = 0; i < FIREFLY_COUNT; i += 1) {
          attr.setXYZ(
            i,
            flyBase[i * 3] + Math.sin(time * 0.6 + flyPhase[i]) * 0.05,
            flyBase[i * 3 + 1] + Math.sin(time * 1.3 + flyPhase[i]) * 0.08,
            flyBase[i * 3 + 2] + Math.cos(time * 0.5 + flyPhase[i]) * 0.05,
          );
        }
        attr.needsUpdate = true;
      }

      return sound;
    },
  };
}

function dotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
