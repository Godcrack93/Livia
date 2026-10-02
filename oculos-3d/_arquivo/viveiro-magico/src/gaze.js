import * as THREE from "three";

const HOLD = 1;
const origin = new THREE.Vector3();
const direction = new THREE.Vector3();
const lookQ = new THREE.Quaternion();

export function createGaze() {
  const raycaster = new THREE.Raycaster();
  const reticle = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.008, 0.011, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3c4, depthTest: false }),
  );
  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(0.007, 20),
    new THREE.MeshBasicMaterial({ color: 0x7ec8e3, depthTest: false, transparent: true, opacity: 0.9 }),
  );
  const badge = new THREE.Mesh(
    new THREE.SphereGeometry(0.005, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }),
  );
  ring.renderOrder = 10;
  fill.renderOrder = 11;
  badge.renderOrder = 12;
  fill.position.z = 0.001;
  fill.scale.setScalar(0.001);
  badge.position.set(0.016, -0.016, 0.001);
  badge.visible = false;
  reticle.add(ring, fill, badge);

  const result = { done: false, target: null, entered: false };
  let hold = 0;
  let lock = 0;
  let current = null;
  let badgeColor = null;

  function pause(seconds) {
    lock = seconds;
    hold = 0;
  }

  function setBadge(color) {
    if (color === badgeColor) return;
    badgeColor = color;
    badge.visible = color != null;
    if (color != null) badge.material.color.setHex(color);
  }

  function update(dt, looker, colliders, instant, canUse) {
    if (lock > 0) lock = Math.max(0, lock - dt);

    const elements = looker.matrixWorld.elements;
    origin.setFromMatrixPosition(looker.matrixWorld);
    direction.set(elements[8], elements[9], elements[10]).normalize().negate();
    lookQ.setFromRotationMatrix(looker.matrixWorld);
    raycaster.set(origin, direction);

    const hit = raycaster.intersectObjects(colliders, false)[0]?.object ?? null;
    const usable = hit != null && canUse(hit);
    result.entered = hit !== current && hit != null;
    if (hit !== current) {
      current = hit;
      hold = 0;
    }

    let done = false;
    let progress = 0;
    if (usable && lock <= 0) {
      if (instant) done = true;
      else {
        const need = hit.userData.hold ?? HOLD;
        hold += dt;
        progress = Math.min(1, hold / need);
        if (hold >= need) done = true;
      }
    }

    fill.scale.setScalar(progress > 0 ? progress : 0.001);
    ring.material.color.setHex(usable ? 0xf2cc8f : 0xfff3c4);
    reticle.position.copy(origin).addScaledVector(direction, 0.6);
    reticle.quaternion.copy(lookQ);

    result.done = done;
    result.target = hit;
    return result;
  }

  return { reticle, update, pause, setBadge };
}
