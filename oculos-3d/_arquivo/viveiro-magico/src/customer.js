import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const SHIRT = 0;
const PANTS = 1;
const SKIN = 2;
const HAIR = 3;
const SHOE = 4;
const DARK = 5;
const WHITE = 6;
const CHEEK = 7;
const HAT = 8;
const BAG = 9;
const SLOTS = 10;

const SHIRTS = [0xe07a5f, 0x81b29a, 0x7ec8e3, 0xf2cc8f, 0xb58ac9, 0xf2849a, 0xf4a259, 0x5fa8d3];
const PANTS_COLORS = [0x3d5a80, 0x5c4b3b, 0x6d6875, 0x2a9d8f, 0x264653, 0x8d99ae];
const SKINS = [0xf5d6c0, 0xf1c9a5, 0xd9a47a, 0xa86f4c, 0x7a4b30];
const HAIRS = [0x3d2b1f, 0x6b4226, 0xe0b25c, 0x2b2b2b, 0xa0522d, 0xc0392b];
const SHOES = [0x3d2b1f, 0x2b2b2b, 0xe07a5f, 0xf4f1de, 0x3d5a80];
const GREY = 0xdedede;
// Para um penteado novo: um nome aqui e um caso em hairParts().
const STYLES = ["curto", "coque", "longo", "chapeu", "vovo"];

const TAU = Math.PI * 2;
const HIP_Y = 0.76;
const SHOULDER_Y = 1.2;
const NECK_Y = 1.33;
const REST = 0.1;

const material = new THREE.MeshLambertMaterial({ vertexColors: true });

function part(geo, slot, x = 0, y = 0, z = 0) {
  geo.translate(x, y, z);
  geo.userData.slot = slot;
  return geo;
}

function ball(r, sx, sy, sz, slot, x, y, z, w = 10, h = 8) {
  const geo = new THREE.SphereGeometry(r, w, h);
  geo.scale(sx, sy, sz);
  return part(geo, slot, x, y, z);
}

function tube(top, bottom, height, slot, x, y, z, depth = 1, seg = 10) {
  const geo = new THREE.CylinderGeometry(top, bottom, height, seg);
  geo.scale(1, 1, depth);
  return part(geo, slot, x, y, z);
}

function pill(r, length, slot, x, y, z) {
  return part(new THREE.CapsuleGeometry(r, length, 3, 8), slot, x, y, z);
}

function cube(w, h, d, slot, x, y, z, roll = 0) {
  const geo = new THREE.BoxGeometry(w, h, d);
  if (roll) geo.rotateZ(roll);
  return part(geo, slot, x, y, z);
}

function build(parts) {
  const geo = mergeGeometries(parts);
  const slots = new Uint8Array(geo.attributes.position.count);
  let offset = 0;
  for (const piece of parts) {
    const count = piece.attributes.position.count;
    slots.fill(piece.userData.slot, offset, offset + count);
    offset += count;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(slots.length * 3), 3));
  geo.userData.slots = slots;
  return geo;
}

function recolor(geo, palette) {
  const color = geo.attributes.color;
  const slots = geo.userData.slots;
  for (let i = 0; i < slots.length; i += 1) {
    const c = palette[slots[i]];
    color.setXYZ(i, c.r, c.g, c.b);
  }
  color.needsUpdate = true;
}

function bodyGeometry(skirt) {
  const parts = [
    tube(0.15, 0.125, 0.36, SHIRT, 0, 1.05, 0, 0.7),
    ball(1, 0.17, 0.075, 0.11, SHIRT, 0, 1.225, 0, 12, 6),
    tube(0.042, 0.048, 0.1, SKIN, 0, 1.28, 0),
  ];
  if (skirt) {
    parts.push(tube(0.13, 0.22, 0.3, SHIRT, 0, 0.74, 0, 0.8, 12));
  } else {
    parts.push(tube(0.125, 0.13, 0.14, PANTS, 0, 0.8, 0, 0.75));
    parts.push(ball(0.012, 1, 1, 0.6, WHITE, 0, 1.14, -0.102, 6, 4));
    parts.push(ball(0.012, 1, 1, 0.6, WHITE, 0, 1.04, -0.098, 6, 4));
  }
  return build(parts);
}

function shortHair() {
  const top = new THREE.SphereGeometry(0.116, 14, 8, 0, TAU, 0, Math.PI * 0.36);
  top.scale(1, 1.08, 1);
  const back = new THREE.SphereGeometry(0.117, 12, 8, 0, Math.PI, 0, Math.PI * 0.72);
  back.scale(1, 1.08, 1);
  return [part(top, HAIR, 0, 0.125, 0.004), part(back, HAIR, 0, 0.12, 0.004)];
}

function hairParts(style) {
  if (style === "vovo") {
    const ring = new THREE.SphereGeometry(0.116, 12, 6, 0, Math.PI, Math.PI * 0.4, Math.PI * 0.3);
    ring.scale(1, 1.08, 1);
    const mustache = new THREE.CapsuleGeometry(0.014, 0.05, 3, 6);
    mustache.rotateZ(Math.PI / 2);
    return [part(ring, HAIR, 0, 0.12, 0.004), part(mustache, HAIR, 0, 0.088, -0.106)];
  }
  const parts = shortHair();
  if (style === "coque") parts.push(ball(0.055, 1, 1, 1, HAIR, 0, 0.225, 0.075));
  if (style === "longo") {
    const back = new THREE.CapsuleGeometry(0.1, 0.12, 3, 10);
    back.scale(1.05, 1, 0.5);
    parts.push(part(back, HAIR, 0, 0.04, 0.07));
  }
  if (style === "chapeu") {
    parts.push(tube(0.19, 0.19, 0.012, HAT, 0, 0.215, 0, 1, 16));
    parts.push(tube(0.1, 0.112, 0.08, HAT, 0, 0.26, 0, 1, 14));
    parts.push(tube(0.114, 0.114, 0.022, SHIRT, 0, 0.232, 0, 1, 14));
  }
  return parts;
}

function headGeometry(style) {
  const smile = new THREE.TorusGeometry(0.03, 0.006, 4, 10, Math.PI);
  smile.rotateZ(Math.PI);
  const parts = [
    ball(0.11, 1, 1.08, 1, SKIN, 0, 0.12, 0, 16, 12),
    ball(0.026, 0.5, 1, 0.8, SKIN, 0.108, 0.12, 0),
    ball(0.026, 0.5, 1, 0.8, SKIN, -0.108, 0.12, 0),
    ball(0.017, 1, 1, 1, SKIN, 0, 0.105, -0.108),
    ball(0.02, 1, 0.7, 0.4, CHEEK, 0.06, 0.09, -0.09),
    ball(0.02, 1, 0.7, 0.4, CHEEK, -0.06, 0.09, -0.09),
    cube(0.035, 0.008, 0.012, HAIR, 0.04, 0.168, -0.1, -0.12),
    cube(0.035, 0.008, 0.012, HAIR, -0.04, 0.168, -0.1, 0.12),
    part(smile, DARK, 0, 0.075, -0.103),
    ...hairParts(style),
  ];
  return build(parts);
}

function eyesGeometry() {
  return build([
    ball(0.024, 1, 1.1, 0.5, WHITE, 0.038, 0, -0.104),
    ball(0.024, 1, 1.1, 0.5, WHITE, -0.038, 0, -0.104),
    ball(0.014, 1, 1.1, 0.6, DARK, 0.038, -0.003, -0.113, 8, 6),
    ball(0.014, 1, 1.1, 0.6, DARK, -0.038, -0.003, -0.113, 8, 6),
  ]);
}

const upperGeometry = () => build([pill(0.045, 0.16, SHIRT, 0, -0.1, 0)]);
const foreGeometry = () =>
  build([pill(0.038, 0.14, SKIN, 0, -0.09, 0), ball(0.046, 1, 1.1, 0.8, SKIN, 0, -0.21, 0)]);

function legGeometry() {
  const shoe = new THREE.CapsuleGeometry(0.042, 0.08, 3, 8);
  shoe.rotateX(Math.PI / 2);
  shoe.scale(1, 0.65, 1);
  return build([tube(0.055, 0.045, 0.7, PANTS, 0, -0.35, 0), part(shoe, SHOE, 0, -0.725, -0.03)]);
}

function bagGeometry() {
  const handle = new THREE.TorusGeometry(0.035, 0.006, 4, 10, Math.PI);
  return build([cube(0.12, 0.13, 0.07, BAG, 0, -0.32, 0), part(handle, BAG, 0, -0.255, 0)]);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function ease(current, target, k) {
  return current + (target - current) * k;
}

export function createCustomer() {
  const palette = Array.from({ length: SLOTS }, () => new THREE.Color());
  palette[DARK].setHex(0x2b2d42);
  palette[WHITE].setHex(0xffffff);
  palette[CHEEK].setHex(0xf4a6a6);
  palette[HAT].setHex(0xe9c46a);
  palette[BAG].setHex(0xc8a06a);

  const bodies = [bodyGeometry(false), bodyGeometry(true)];
  const heads = STYLES.map(headGeometry);
  const eyesGeo = eyesGeometry();
  const upperGeo = upperGeometry();
  const foreGeo = foreGeometry();
  const legGeo = legGeometry();
  const bagGeo = bagGeometry();

  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);
  const body = new THREE.Mesh(bodies[0], material);
  inner.add(body);

  const head = new THREE.Group();
  head.position.y = NECK_Y;
  const face = new THREE.Mesh(heads[0], material);
  const eyes = new THREE.Mesh(eyesGeo, material);
  eyes.position.y = 0.135;
  const mouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 10, 6).scale(1, 0.75, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x8c2f39 }),
  );
  mouth.position.set(0, 0.075, -0.1);
  mouth.visible = false;
  head.add(face, eyes, mouth);
  inner.add(head);

  function limb(x, y, geo, childGeo, childY) {
    const joint = new THREE.Group();
    joint.position.set(x, y, 0);
    joint.add(new THREE.Mesh(geo, material));
    inner.add(joint);
    if (!childGeo) return { joint };
    const elbow = new THREE.Group();
    elbow.position.y = childY;
    elbow.add(new THREE.Mesh(childGeo, material));
    joint.add(elbow);
    return { joint, elbow };
  }
  // Braço "a" fica no +x (esquerda de quem olha para o cliente).
  const armA = limb(0.185, SHOULDER_Y, upperGeo, foreGeo, -0.22);
  const armB = limb(-0.185, SHOULDER_Y, upperGeo, foreGeo, -0.22);
  const legA = limb(0.068, HIP_Y, legGeo);
  const legB = limb(-0.068, HIP_Y, legGeo);
  const bag = new THREE.Mesh(bagGeo, material);
  bag.visible = false;
  armB.elbow.add(bag);

  let stride = 0;
  let blink = 2;
  let turnHead = 0;

  function dress() {
    const style = pick(STYLES);
    const skirt = Math.random() < 0.4;
    palette[SHIRT].setHex(pick(SHIRTS));
    palette[SKIN].setHex(pick(SKINS));
    palette[HAIR].setHex(style === "vovo" ? GREY : pick(HAIRS));
    palette[SHOE].setHex(pick(SHOES));
    if (skirt && Math.random() < 0.5) palette[PANTS].copy(palette[SKIN]);
    else palette[PANTS].setHex(pick(PANTS_COLORS));
    body.geometry = bodies[skirt ? 1 : 0];
    face.geometry = heads[STYLES.indexOf(style)];
    for (const geo of [body.geometry, face.geometry, eyesGeo, upperGeo, foreGeo, legGeo, bagGeo]) recolor(geo, palette);
    root.scale.setScalar(0.94 + Math.random() * 0.1);
    bag.visible = false;
    turnHead = Math.random() * TAU;
  }

  // mode: "walk", "wave", "idle" ou "happy". Para um gesto novo: outro caso aqui.
  function animate(dt, mode, time) {
    const k = Math.min(1, dt * 10);
    let legSwing = 0;
    let armAx = 0;
    let armBx = 0;
    let armAz = REST;
    let armBz = -REST;
    let foreA = 0.25;
    let foreB = 0.25;
    let foreBz = 0;
    let headY = 0;
    let headZ = 0;
    let lift = 0;

    if (mode === "walk") {
      stride += dt * 7.5;
      legSwing = Math.sin(stride) * 0.5;
      armAx = -legSwing * 0.8;
      armBx = legSwing * 0.8;
      foreA = 0.4;
      foreB = bag.visible ? 0.1 : 0.4;
      lift = Math.abs(Math.cos(stride)) * 0.03;
    } else if (mode === "wave") {
      armBz = -2.6;
      foreB = 0;
      foreBz = Math.sin(time * 12) * 0.5;
      headZ = -0.12;
    } else if (mode === "idle") {
      turnHead += dt * 0.45;
      headY = Math.sin(turnHead) * 0.25;
      headZ = Math.sin(time * 0.9) * 0.06;
      armAz = REST + Math.sin(time * 1.8) * 0.03;
      armBz = -armAz;
      lift = Math.sin(time * 1.8) * 0.004;
    } else if (mode === "happy") {
      armAz = 2.5 + Math.sin(time * 10) * 0.15;
      armBz = -armAz;
      foreA = 0;
      foreB = 0;
      lift = Math.abs(Math.sin(time * 8)) * 0.1;
      headZ = Math.sin(time * 8) * 0.08;
    }

    legA.joint.rotation.x = ease(legA.joint.rotation.x, legSwing, k);
    legB.joint.rotation.x = ease(legB.joint.rotation.x, -legSwing, k);
    armA.joint.rotation.x = ease(armA.joint.rotation.x, armAx, k);
    armB.joint.rotation.x = ease(armB.joint.rotation.x, armBx, k);
    armA.joint.rotation.z = ease(armA.joint.rotation.z, armAz, k);
    armB.joint.rotation.z = ease(armB.joint.rotation.z, armBz, k);
    armA.elbow.rotation.x = ease(armA.elbow.rotation.x, foreA, k);
    armB.elbow.rotation.x = ease(armB.elbow.rotation.x, foreB, k);
    armB.elbow.rotation.z = ease(armB.elbow.rotation.z, foreBz, k);
    head.rotation.y = ease(head.rotation.y, headY, k * 0.5);
    head.rotation.z = ease(head.rotation.z, headZ, k);
    inner.position.y = mode === "walk" || mode === "happy" ? lift : ease(inner.position.y, lift, k);
    mouth.visible = mode === "happy" || mode === "wave";

    blink -= dt;
    if (blink < 0) {
      eyes.scale.y = 0.1;
      if (blink < -0.12) {
        blink = 2 + Math.random() * 3;
        eyes.scale.y = 1;
      }
    }
  }

  return {
    group: root,
    dress,
    animate,
    setBag(on) {
      bag.visible = on;
    },
  };
}
