import * as THREE from "three";
import { angleDiff, canvasTexture, makeCanvas } from "../shared/util.js";

const CONE = 0.5;
const RADIUS = 0.45;
const DEPTH = 2;
const inv = new THREE.Quaternion();
const v = new THREE.Vector3();

function arrowTexture() {
  const canvas = makeCanvas(128, 128);
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.moveTo(114, 64);
  ctx.lineTo(56, 16);
  ctx.lineTo(56, 42);
  ctx.lineTo(14, 42);
  ctx.lineTo(14, 86);
  ctx.lineTo(56, 86);
  ctx.lineTo(56, 112);
  ctx.closePath();
  ctx.lineJoin = "round";
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#3b3561";
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  return canvasTexture(canvas);
}

// Setinha presa à cabeça: aponta para a bolha importante quando ela está fora da vista.
export function createPointer(scene) {
  const material = new THREE.MeshBasicMaterial({
    map: arrowTexture(),
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    opacity: 0,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), material);
  mesh.renderOrder = 60;
  mesh.frustumCulled = false;
  const group = new THREE.Group();
  group.add(mesh);
  group.visible = false;
  scene.add(group);

  let opacity = 0;
  let angle = 0;
  let clock = 0;
  let color = "";

  function update(dt, head, target, tint = "#ffffff") {
    clock += dt;
    let show = false;
    if (target?.active) {
      v.copy(target.view).sub(head.position);
      inv.copy(head.quaternion).invert();
      v.applyQuaternion(inv);
      const len = v.length();
      const off = Math.acos(Math.max(-1, Math.min(1, -v.z / Math.max(len, 1e-6))));
      if (off > CONE) {
        show = true;
        const dx = Math.hypot(v.x, v.y) < 1e-3 ? 1 : v.x;
        const a = Math.atan2(v.y, dx);
        angle += angleDiff(a, angle) * Math.min(1, dt * 10);
        if (tint !== color) {
          color = tint;
          material.color.set(tint);
        }
      }
    }
    opacity += ((show ? 1 : 0) - opacity) * Math.min(1, dt * 8);
    material.opacity = opacity;
    group.visible = opacity > 0.01;
    if (!group.visible) return;
    group.position.copy(head.position);
    group.quaternion.copy(head.quaternion);
    const pulse = Math.sin(clock * 7);
    const r = RADIUS + pulse * 0.03;
    mesh.position.set(Math.cos(angle) * r, Math.sin(angle) * r, -DEPTH);
    mesh.rotation.set(0, 0, angle);
    mesh.scale.setScalar(1 + pulse * 0.08);
  }

  return { update };
}
