import * as THREE from "three";

const ndc = new THREE.Vector2();
const lookQ = new THREE.Quaternion();
const GRACE = 0.16;
const REST = 3;

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = /* glsl */ `
uniform float uProgress;
uniform float uHover;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float a = fract(atan(p.x, p.y) / 6.28318 + 1.0);
  float halo = smoothstep(0.34, 0.2, r);
  float core = smoothstep(0.21, 0.15, r);
  float ring = smoothstep(0.07, 0.02, abs(r - 0.66)) * uHover;
  float arcBand = smoothstep(0.15, 0.09, abs(r - 0.66));
  float arc = arcBand * step(a, uProgress) * step(0.001, uProgress);
  vec3 arcCol = mix(vec3(1.0, 0.42, 0.72), vec3(0.36, 0.84, 1.0), a);
  vec3 col = mix(vec3(0.23, 0.2, 0.38), vec3(1.0), core);
  float alpha = max(halo * 0.55, core);
  col = mix(col, vec3(1.0), ring * (1.0 - core));
  alpha = max(alpha, ring * 0.85);
  col = mix(col, arcCol, arc);
  alpha = max(alpha, arc);
  gl_FragColor = vec4(col, alpha);
}
`;

// Mira do olhar: centro da visão no óculos, ponteiro do mouse no computador.
export function createAim() {
  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const material = new THREE.ShaderMaterial({
    uniforms: { uProgress: { value: 0 }, uHover: { value: 0 } },
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const reticle = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  reticle.renderOrder = 100;
  reticle.frustumCulled = false;

  const hit = { target: null, dist: REST };
  const result = { done: false, target: null, entered: false, progress: 0 };
  let current = null;
  let spent = null;
  let spentLost = 0;
  let settle = false;
  let hold = 0;
  let lost = 0;
  let lock = 0;
  let hover = 0;
  let distance = REST;

  function castRay(vr, looker) {
    if (vr.mode === "mono" && vr.pointer.inside) {
      ndc.set(vr.pointer.x, vr.pointer.y);
      raycaster.setFromCamera(ndc, vr.camera);
      origin.copy(raycaster.ray.origin);
      direction.copy(raycaster.ray.direction);
    } else {
      const e = looker.matrixWorld.elements;
      origin.setFromMatrixPosition(looker.matrixWorld);
      direction.set(-e[8], -e[9], -e[10]).normalize();
    }
    lookQ.setFromRotationMatrix(looker.matrixWorld);
  }

  // Ao abrir uma tela: o que estiver sob o olhar quando a pausa acabar só vale depois de olhar para outro lado.
  function pause(seconds) {
    lock = seconds;
    hold = 0;
    settle = true;
  }

  function update(dt, vr, looker, pickFn, instant) {
    if (lock > 0) lock = Math.max(0, lock - dt);
    castRay(vr, looker);
    hit.target = null;
    hit.dist = REST;
    pickFn(origin, direction, hit);
    let target = hit.target;
    if (settle && lock <= 0) {
      settle = false;
      spent = target;
      spentLost = 0;
    }
    // Algo já escolhido só vale de novo depois que o olhar sair dele (botões que alternam, como o do som).
    if (spent) {
      if (target === spent && !instant) {
        target = null;
        spentLost = 0;
      } else if (target || (spentLost += dt) > GRACE) spent = null;
    }

    result.entered = false;
    if (target && target !== current) {
      current = target;
      hold = 0;
      lost = 0;
      result.entered = true;
    } else if (!target && current) {
      lost += dt;
      if (lost > GRACE) {
        current = null;
        hold = 0;
      }
    } else if (target) {
      lost = 0;
    }

    let done = false;
    let progress = 0;
    if (current && lock <= 0) {
      if (instant && target) done = true;
      else if (target) {
        hold += dt;
        const need = current.hold ?? 0.3;
        progress = Math.min(1, hold / need);
        if (hold >= need) done = true;
      } else {
        progress = Math.min(1, hold / (current.hold ?? 0.3));
      }
    }

    hover += ((current ? 1 : 0) - hover) * Math.min(1, dt * 14);
    distance += ((target ? hit.dist : REST) - distance) * Math.min(1, dt * 12);
    material.uniforms.uProgress.value = progress;
    material.uniforms.uHover.value = hover;
    reticle.position.copy(origin).addScaledVector(direction, distance);
    reticle.quaternion.copy(lookQ);
    reticle.scale.setScalar(distance * 0.07);

    result.done = done;
    result.target = current;
    result.progress = progress;
    if (done) {
      spent = current;
      spentLost = 0;
      current = null;
      hold = 0;
      lock = 0.08;
    }
    return result;
  }

  return { reticle, update, pause, origin, direction };
}
