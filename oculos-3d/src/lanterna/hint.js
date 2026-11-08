import * as THREE from "three";
import { angleDiff } from "../shared/util.js";
import { glowTexture } from "./lantern.js";

const inv = new THREE.Quaternion();
const v = new THREE.Vector3();

// Vaga-lume guia: na borda da visão, do lado de onde vem o fantasma que ela ainda não viu.
export function createHint(scene) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  function sprite(color, size) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture(),
        color,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        opacity: 0,
      }),
    );
    s.scale.setScalar(size);
    s.renderOrder = 60;
    group.add(s);
    return s;
  }
  const halo = sprite("#e8ff7a", 0.17);
  const core = sprite("#fbffd9", 0.05);
  let opacity = 0;
  let angle = 0;
  let clock = 0;

  function update(dt, head, target) {
    clock += dt;
    let show = false;
    if (target) {
      v.copy(target).sub(head.position);
      inv.copy(head.quaternion).invert();
      v.applyQuaternion(inv);
      const len = v.length();
      const off = Math.acos(Math.max(-1, Math.min(1, -v.z / Math.max(len, 1e-6))));
      if (off > 0.55) {
        show = true;
        // Atrás dela, o guia fica no lado para onde é mais curto virar.
        const a = Math.atan2(v.y * 0.6, Math.abs(v.x) < 1e-3 ? 1 : v.x);
        angle += angleDiff(a, angle) * Math.min(1, dt * 8);
      }
    }
    opacity += ((show ? 1 : 0) - opacity) * Math.min(1, dt * 5);
    group.visible = opacity > 0.01;
    if (!group.visible) return;
    group.position.copy(head.position);
    group.quaternion.copy(head.quaternion);
    const r = 0.5 + Math.sin(clock * 5) * 0.04;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    halo.position.set(x, y, -1.6);
    core.position.set(x, y, -1.6);
    const pulse = 0.6 + 0.4 * Math.sin(clock * 9);
    halo.material.opacity = opacity * pulse;
    core.material.opacity = opacity;
  }

  return { update };
}
