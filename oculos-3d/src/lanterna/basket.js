import * as THREE from "three";
import { TAU, canvasTexture, gradient, makeCanvas, mergeAll, paint, xf } from "../shared/util.js";

export const CANDIES = 6;
// Aos pés dela, um pouquinho à frente: basta olhar para baixo para contar os brigadeiros.
const SPOT = new THREE.Vector3(0.05, 0, -0.8);
const CUPS = ["#ff9cc8", "#c9b6ff", "#9ff0d4"];
const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const p = new THREE.Vector3();
const s = new THREE.Vector3();

function blanketTexture() {
  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e9d8b4";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "rgba(160,40,70,0.55)";
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(i * 32 + 8, 0, 16, 256);
    ctx.fillRect(0, i * 32 + 8, 256, 16);
  }
  ctx.strokeStyle = "#a8324f";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 250);
  return canvasTexture(canvas);
}

function candyTexture() {
  const canvas = makeCanvas(128, 64);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4a2516";
  ctx.fillRect(0, 0, 128, 64);
  const colors = ["#2a120a", "#6b3a22", "#1d0b05"];
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = colors[i % colors.length];
    const x = Math.random() * 128;
    const y = Math.random() * 64;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * TAU);
    ctx.fillRect(-2.5, -0.8, 5, 1.6);
    ctx.restore();
  }
  return canvasTexture(canvas);
}

function basketGeometry() {
  const parts = [];
  const pot = new THREE.CylinderGeometry(0.17, 0.13, 0.16, 18, 3, true);
  gradient(pot, "#7a4a24", "#c08a4e");
  xf(pot, 0, 0.08, 0);
  parts.push(pot);
  const bottom = new THREE.CircleGeometry(0.13, 18);
  paint(bottom, "#6b3f1e");
  xf(bottom, 0, 0.005, 0, -Math.PI / 2, 0, 0);
  parts.push(bottom);
  for (const y of [0.04, 0.09, 0.14]) {
    const ring = new THREE.TorusGeometry(0.15 + (y - 0.04) * 0.2, 0.008, 5, 24);
    paint(ring, "#9a6534");
    xf(ring, 0, y, 0, Math.PI / 2, 0, 0);
    parts.push(ring);
  }
  const handle = new THREE.TorusGeometry(0.16, 0.012, 6, 20, Math.PI);
  paint(handle, "#9a6534");
  xf(handle, 0, 0.16, 0);
  parts.push(handle);
  const cloth = new THREE.SphereGeometry(0.15, 12, 6, 0, TAU, 0, Math.PI / 2);
  paint(cloth, "#d84a6a");
  xf(cloth, 0, 0.13, 0, 0, 0, 0, 1, 0.35, 1);
  parts.push(cloth);
  return mergeAll(parts);
}

// Toalha de piquenique, cesta e o prato com os brigadeiros (um InstancedMesh: cada um some ou volta).
export function createBasket(scene, groundAt) {
  const group = new THREE.Group();
  group.position.set(SPOT.x, groundAt(SPOT.x, SPOT.z) + 0.02, SPOT.z);
  scene.add(group);
  const blanket = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 1.0).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ map: blanketTexture() }),
  );
  group.add(blanket);
  const basket = new THREE.Mesh(basketGeometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
  basket.position.set(0.4, 0, -0.18);
  basket.rotation.y = 0.5;
  group.add(basket);
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.21, 0.025, 28),
    new THREE.MeshLambertMaterial({ color: "#eef3ff" }),
  );
  plate.position.set(-0.1, 0.013, 0.06);
  group.add(plate);

  const candyGeo = new THREE.SphereGeometry(0.05, 14, 10);
  const candyMat = new THREE.MeshLambertMaterial({ map: candyTexture() });
  const cupGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.035, 12, 1, true);
  const cupMat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  const candies = new THREE.InstancedMesh(candyGeo, candyMat, CANDIES);
  const cups = new THREE.InstancedMesh(cupGeo, cupMat, CANDIES);
  const slots = [];
  const color = new THREE.Color();
  for (let i = 0; i < CANDIES; i++) {
    // Um no meio do prato e os outros em volta.
    const b = ((i - 1) / (CANDIES - 1)) * TAU;
    const slot =
      i === 0
        ? new THREE.Vector3(-0.1, 0.045, 0.06)
        : new THREE.Vector3(-0.1 + Math.cos(b) * 0.14, 0.045, 0.06 + Math.sin(b) * 0.14);
    slots.push(slot);
    cups.setColorAt(i, color.set(CUPS[i % CUPS.length]));
  }
  group.add(cups, candies);
  const present = new Array(CANDIES).fill(true);
  const pop = new Array(CANDIES).fill(1);

  function draw() {
    for (let i = 0; i < CANDIES; i++) {
      const k = present[i] ? Math.min(1, pop[i]) : 0;
      const bounce = present[i] && pop[i] < 1 ? 1 + Math.sin(pop[i] * Math.PI) * 0.4 : 1;
      m4.compose(p.copy(slots[i]), q.identity(), s.setScalar(Math.max(0.001, k * bounce)));
      candies.setMatrixAt(i, m4);
      m4.compose(p.copy(slots[i]).setY(0.02), q.identity(), s.setScalar(present[i] ? 1 : 0.001));
      cups.setMatrixAt(i, m4);
    }
    candies.instanceMatrix.needsUpdate = true;
    cups.instanceMatrix.needsUpdate = true;
  }
  draw();

  return {
    group,
    // Tira um brigadeiro do prato e devolve qual foi (-1 se o prato já está vazio).
    take() {
      for (let i = CANDIES - 1; i >= 0; i--) {
        if (!present[i]) continue;
        present[i] = false;
        draw();
        return i;
      }
      return -1;
    },
    give(i) {
      if (i < 0 || present[i]) return;
      present[i] = true;
      pop[i] = 0;
    },
    reset() {
      present.fill(true);
      pop.fill(1);
      draw();
    },
    makeCandy() {
      return new THREE.Mesh(candyGeo, candyMat);
    },
    slotWorld(i, out) {
      return group.localToWorld(out.copy(slots[Math.max(0, i)]));
    },
    update(dt) {
      let busy = false;
      for (let i = 0; i < CANDIES; i++) {
        if (pop[i] >= 1) continue;
        pop[i] = Math.min(1, pop[i] + dt * 2.5);
        busy = true;
      }
      if (busy) draw();
    },
    get count() {
      return present.filter(Boolean).length;
    },
    get position() {
      return group.position;
    },
  };
}
