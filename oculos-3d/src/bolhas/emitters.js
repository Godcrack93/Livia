import * as THREE from "three";
import { HIGH } from "../shared/quality.js";
import { TAU, gradient, mergeAll, paint, rand, xf } from "../shared/util.js";
import { heightAt } from "./world.js";

const RADIUS = 7.2;
const COLORS = [
  ["#ff5fa2", "#ffd1e6"],
  ["#9b6bff", "#eee4ff"],
  ["#2fb4ff", "#d8f3ff"],
  ["#ff8a4c", "#ffe3c9"],
  ["#2fcf98", "#d4fff0"],
  ["#ffc21a", "#fff6c9"],
];
const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();

function stemGeometry(height) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.18, height * 0.35, -0.12),
    new THREE.Vector3(-0.12, height * 0.7, 0.12),
    new THREE.Vector3(0, height, 0.45),
  ]);
  const tube = new THREE.TubeGeometry(curve, 28, 0.06, 8, false);
  gradient(tube, "#2f7d32", "#7fcf55");
  const parts = [tube];
  for (const [side, y, len] of [
    [1, 0.12, 0.55],
    [-1, 0.3, 0.48],
    [1, height * 0.55, 0.38],
  ]) {
    const leaf = new THREE.SphereGeometry(1, 12, 8);
    gradient(leaf, "#3f9a3a", "#9be06a");
    xf(leaf, 0, 0, len * 0.5, 0, 0, 0, 0.17, 0.035, len * 0.5);
    xf(leaf, 0, y, 0, 0.45, side * 1.4 + rand(-0.3, 0.3), 0);
    parts.push(leaf);
  }
  return mergeAll(parts);
}

function headGeometry(base, tip) {
  const parts = [];
  const calyx = new THREE.SphereGeometry(0.14, 14, 10);
  paint(calyx, "#4fae45");
  xf(calyx, 0, -0.02, 0, 0, 0, 0, 1, 0.75, 1);
  parts.push(calyx);
  for (let k = 0; k < 6; k++) {
    const petal = new THREE.SphereGeometry(1, 14, 10);
    gradient(petal, base, tip, 0.8);
    xf(petal, 0, 0.34, 0, 0, 0, 0, 0.17, 0.38, 0.06);
    xf(petal, 0, 0, 0, 0.62, (k / 6) * TAU, 0);
    parts.push(petal);
  }
  for (let k = 0; k < 6; k++) {
    const petal = new THREE.SphereGeometry(1, 12, 8);
    gradient(petal, base, tip, 1.4);
    xf(petal, 0, 0.26, 0, 0, 0, 0, 0.13, 0.3, 0.05);
    xf(petal, 0, 0, 0, 0.32, (k / 6) * TAU + Math.PI / 6, 0);
    parts.push(petal);
  }
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU;
    const stalk = new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4);
    paint(stalk, "#fff2b0");
    xf(stalk, Math.cos(a) * 0.05, 0.12, Math.sin(a) * 0.05, Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3);
    const ball = new THREE.SphereGeometry(0.025, 8, 6);
    paint(ball, "#ffd23f");
    xf(ball, Math.cos(a) * 0.08, 0.22, Math.sin(a) * 0.08);
    parts.push(stalk, ball);
  }
  return mergeAll(parts);
}

// Flores que sopram as bolhas. Para mais flores: aumente COLORS (o ângulo se ajusta).
export function createEmitters(scene) {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 });
  const glowGeo = new THREE.SphereGeometry(0.11, 16, 12);
  const flowers = [];
  const count = COLORS.length;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * TAU + Math.PI / count;
    const x = -Math.sin(angle) * RADIUS;
    const z = -Math.cos(angle) * RADIUS;
    const height = rand(1.7, 2.1);
    const group = new THREE.Group();
    group.position.set(x, heightAt(x, z) - 0.05, z);
    group.rotation.y = angle;
    const stem = new THREE.Mesh(stemGeometry(height), material);
    stem.castShadow = HIGH;
    group.add(stem);

    const head = new THREE.Group();
    head.position.set(0, height, 0.45);
    head.quaternion.setFromUnitVectors(UP, tmp.set(0, 0.78, 0.62).normalize());
    const petals = new THREE.Mesh(headGeometry(COLORS[i][0], COLORS[i][1]), material);
    petals.castShadow = HIGH;
    const glowMat = new THREE.MeshStandardMaterial({
      color: COLORS[i][1],
      emissive: COLORS[i][0],
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 0.06;
    head.add(petals, glow);
    group.add(head);
    scene.add(group);
    flowers.push({
      angle,
      group,
      head,
      glowMat,
      color: new THREE.Color(COLORS[i][0]),
      puff: 10,
      seed: rand(0, 100),
    });
  }

  function puff(index) {
    flowers[index].puff = 0;
  }

  function spawnPoint(index, outPos, outDir) {
    const f = flowers[index];
    f.head.updateWorldMatrix(true, false);
    outPos.set(0, 0.22, 0).applyMatrix4(f.head.matrixWorld);
    outDir.set(0, 1, 0).transformDirection(f.head.matrixWorld);
    return f;
  }

  function update(dt, t) {
    for (const f of flowers) {
      f.puff += dt;
      const k = f.puff;
      const bounce = Math.exp(-k * 5) * Math.sin(k * 24);
      f.head.scale.set(1 - bounce * 0.18, 1 + bounce * 0.3, 1 - bounce * 0.18);
      f.group.rotation.z = Math.sin(t * 0.9 + f.seed) * 0.03;
      f.group.rotation.x = Math.sin(t * 0.7 + f.seed * 1.7) * 0.025;
      f.glowMat.emissiveIntensity = 0.7 + Math.sin(t * 2.2 + f.seed) * 0.2 + Math.exp(-k * 3.5) * 3;
    }
  }

  return { flowers, puff, spawnPoint, update };
}
