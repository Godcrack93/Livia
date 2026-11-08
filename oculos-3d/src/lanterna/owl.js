import * as THREE from "three";
import { gradient, mergeAll, paint, rand, xf } from "../shared/util.js";

const local = new THREE.Vector3();
const inv = new THREE.Matrix4();

function bodyGeometry() {
  const parts = [];
  const body = new THREE.SphereGeometry(0.22, 18, 14);
  gradient(body, "#3f3462", "#6d5c99");
  xf(body, 0, 0.2, 0, 0, 0, 0, 1, 1.12, 0.92);
  parts.push(body);
  const belly = new THREE.SphereGeometry(0.15, 14, 10);
  gradient(belly, "#b9a6dc", "#e3d8f5");
  xf(belly, 0, 0.17, 0.1, 0, 0, 0, 1, 1.15, 0.6);
  parts.push(belly);
  for (const [x, y] of [
    [-0.05, 0.22],
    [0.05, 0.22],
    [0, 0.15],
    [-0.07, 0.1],
    [0.07, 0.1],
  ]) {
    const dot = new THREE.SphereGeometry(0.016, 6, 4);
    paint(dot, "#8f7cb8");
    xf(dot, x, y, 0.185, 0, 0, 0, 1.4, 0.7, 0.5);
    parts.push(dot);
  }
  for (const side of [-1, 1]) {
    const wing = new THREE.SphereGeometry(0.12, 12, 8);
    gradient(wing, "#2f2552", "#5a4a85");
    xf(wing, 0, 0, 0, 0, 0, side * 0.15, 0.45, 1.1, 0.85);
    xf(wing, side * 0.2, 0.18, -0.01);
    parts.push(wing);
    for (let k = -1; k <= 1; k++) {
      const toe = new THREE.SphereGeometry(0.022, 6, 4);
      paint(toe, "#ffb347");
      xf(toe, side * 0.07 + k * 0.025, 0.005, 0.11, 0, 0, 0, 1, 0.7, 1.4);
      parts.push(toe);
    }
  }
  const tail = new THREE.ConeGeometry(0.07, 0.14, 8);
  paint(tail, "#2f2552");
  xf(tail, 0, 0.02, -0.16, -2.2, 0, 0);
  parts.push(tail);
  return mergeAll(parts);
}

function headGeometry() {
  const parts = [];
  const head = new THREE.SphereGeometry(0.17, 18, 14);
  gradient(head, "#4a3d70", "#7a69a8");
  xf(head, 0, 0, 0, 0, 0, 0, 1.12, 0.95, 1);
  parts.push(head);
  for (const side of [-1, 1]) {
    const disc = new THREE.SphereGeometry(0.085, 14, 10);
    paint(disc, "#d9cdf0");
    xf(disc, side * 0.066, -0.01, 0.12, 0, 0, 0, 1, 1, 0.35);
    parts.push(disc);
    const tuft = new THREE.ConeGeometry(0.045, 0.13, 6);
    paint(tuft, "#3f3462");
    xf(tuft, side * 0.11, 0.15, 0.02, 0, 0, side * -0.45);
    parts.push(tuft);
  }
  const beak = new THREE.ConeGeometry(0.026, 0.065, 8);
  paint(beak, "#ffb347");
  xf(beak, 0, -0.05, 0.165, Math.PI / 2 + 0.35, 0, 0);
  parts.push(beak);
  return mergeAll(parts);
}

// Dona Coruja: fica no toco à frente, fala com a voz do navegador e vira a cabeça para o fantasma escondido.
export function createOwl(scene, perch) {
  const group = new THREE.Group();
  group.position.copy(perch);
  group.lookAt(0, perch.y, 0);
  scene.add(group);
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  const body = new THREE.Mesh(bodyGeometry(), material);
  group.add(body);
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.45, 0);
  group.add(headPivot);
  headPivot.add(new THREE.Mesh(headGeometry(), material));
  const eyes = new THREE.Group();
  headPivot.add(eyes);
  const irisMat = new THREE.MeshBasicMaterial({ color: "#ffd34d", toneMapped: false });
  const pupilMat = new THREE.MeshBasicMaterial({ color: "#1b1a3a" });
  const shineMat = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
  for (const side of [-1, 1]) {
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), irisMat);
    iris.position.set(side * 0.066, 0, 0.135);
    iris.scale.z = 0.5;
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.027, 10, 8), pupilMat);
    pupil.position.set(side * 0.066, -0.003, 0.155);
    pupil.scale.z = 0.4;
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 4), shineMat);
    shine.position.set(side * 0.066 - 0.012, 0.014, 0.166);
    eyes.add(iris, pupil, shine);
  }

  let yaw = 0;
  let tilt = 0;
  let blink = rand(2, 4);
  let talking = 0;
  let hooting = 0;
  let clock = 0;
  const position = new THREE.Vector3().copy(perch).setY(perch.y + 0.45);

  function update(dt, head, hint) {
    clock += dt;
    // Sem fantasma para apontar, olha para ela; com fantasma, gira a cabeça (corujas viram quase para trás).
    let want = 0;
    let wantTilt = Math.sin(clock * 0.7) * 0.12;
    group.updateMatrixWorld();
    inv.copy(group.matrixWorld).invert();
    local.copy(hint ?? head.position).applyMatrix4(inv);
    want = Math.max(-2.4, Math.min(2.4, Math.atan2(local.x, local.z)));
    if (hint) wantTilt = 0.2;
    yaw += (want - yaw) * Math.min(1, dt * (hint ? 5 : 2.5));
    tilt += (wantTilt - tilt) * Math.min(1, dt * 4);
    headPivot.rotation.set(-0.05 - hooting * 0.3, yaw, tilt);
    blink -= dt;
    let open = 1;
    if (blink < 0) {
      open = Math.max(0.08, Math.abs(blink + 0.07) / 0.07);
      if (blink < -0.14) blink = rand(2.5, 5);
    }
    eyes.scale.y = open;
    talking = Math.max(0, talking - dt);
    hooting = Math.max(0, hooting - dt * 1.6);
    const bob = talking > 0 ? Math.abs(Math.sin(clock * 9)) * 0.03 : Math.sin(clock * 1.4) * 0.006;
    body.position.y = bob * 0.5;
    headPivot.position.y = 0.45 + bob;
  }

  return {
    group,
    update,
    position,
    talk(seconds) {
      talking = Math.max(talking, seconds);
    },
    hoot() {
      hooting = 1;
    },
  };
}
