import * as THREE from "three";
import { pointScale } from "../shared/points.js";
import { rand } from "../shared/util.js";

const PAIRS = 6;
const SPACING = 0.085;
const side = new THREE.Vector3();

// Olhos no escuro entre as árvores (níveis Medinho e Sustão): piscam e somem quando a luz chega.
export function createEyes(scene) {
  const positions = new Float32Array(PAIRS * 2 * 3);
  const opens = new Float32Array(PAIRS * 2);
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage);
  const openAttr = new THREE.BufferAttribute(opens, 1).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", posAttr);
  geo.setAttribute("aOpen", openAttr);
  const material = new THREE.ShaderMaterial({
    uniforms: { uScale: pointScale, uColor: { value: new THREE.Color("#e9ffb0") } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uScale;
      attribute float aOpen;
      varying float vOpen;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 0.13 * uScale / max(0.1, -mv.z);
        vOpen = aOpen;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vOpen;
      void main() {
        if (vOpen < 0.03) discard;
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        vec2 q = vec2(p.x, p.y / vOpen) * vec2(1.0, 1.3);
        float r = length(q);
        float a = smoothstep(0.62, 0.38, r) + exp(-dot(p, p) * 2.5) * 0.3 * vOpen;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 6;
  scene.add(points);

  const pairs = [];
  for (let i = 0; i < PAIRS; i++) {
    pairs.push({ active: false, pos: new THREE.Vector3(), t: 0, life: 0, nextBlink: 0, blink: 0, vanish: 0, open: 0 });
  }
  let nextSpawn = 2;

  function spawn(gazeYaw) {
    const p = pairs.find((x) => !x.active);
    if (!p) return;
    const a = gazeYaw + (Math.random() < 0.5 ? -1 : 1) * rand(0.9, Math.PI);
    const r = rand(8, 13);
    p.pos.set(-Math.sin(a) * r, rand(0.7, 2.1), -Math.cos(a) * r);
    p.active = true;
    p.t = 0;
    p.life = rand(4, 7);
    p.nextBlink = rand(0.8, 1.6);
    p.blink = 0;
    p.vanish = 0;
    p.open = 0;
  }

  // max: quantos pares ao mesmo tempo (0 desliga). onLit(posição): a luz pegou um par.
  function update(dt, { lantern, gazeYaw, head, max, onLit }) {
    let alive = 0;
    for (const p of pairs) if (p.active) alive++;
    nextSpawn -= dt;
    if (max > 0 && alive < max && nextSpawn <= 0) {
      nextSpawn = rand(2, 5);
      spawn(gazeYaw);
    }
    for (let i = 0; i < PAIRS; i++) {
      const p = pairs[i];
      let open = 0;
      if (p.active) {
        p.t += dt;
        if (!p.vanish && lantern.litAmount(p.pos, 0.3) > 0.45) {
          p.vanish = 0.001;
          onLit?.(p.pos);
        }
        if (p.vanish) p.vanish += dt;
        p.nextBlink -= dt;
        if (p.nextBlink <= 0) {
          p.blink = 0.16;
          p.nextBlink = rand(1.4, 2.6);
        }
        p.blink = Math.max(0, p.blink - dt);
        const fadeIn = Math.min(1, p.t / 0.5);
        const fadeOut = Math.min(1, Math.max(0, (p.life - p.t) / 0.6));
        open = fadeIn * fadeOut * (p.blink > 0 ? 0.05 : 1) * (p.vanish ? Math.max(0, 1 - p.vanish / 0.2) : 1);
        if (p.t > p.life || p.vanish > 0.2 || max === 0) p.active = false;
      }
      side.set(p.pos.z - head.position.z, 0, -(p.pos.x - head.position.x)).normalize().multiplyScalar(SPACING);
      for (let k = 0; k < 2; k++) {
        const j = i * 2 + k;
        const s = k === 0 ? -1 : 1;
        positions[j * 3] = p.pos.x + side.x * s;
        positions[j * 3 + 1] = p.pos.y;
        positions[j * 3 + 2] = p.pos.z + side.z * s;
        opens[j] = open;
      }
    }
    posAttr.needsUpdate = true;
    openAttr.needsUpdate = true;
  }

  return {
    update,
    clear() {
      for (const p of pairs) p.active = false;
      opens.fill(0);
      openAttr.needsUpdate = true;
      nextSpawn = 2;
    },
    get count() {
      return pairs.filter((p) => p.active).length;
    },
  };
}
