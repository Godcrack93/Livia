import * as THREE from "three";
import { time } from "./world.js";

const INNER = 52;
const OUTER = 62;
const DIST = 105;
const BASE_Y = -6;

// Arco-íris no céu: cada bolha-estrela desenha mais um pedaço, da ponta esquerda até a direita.
export function createSkyRainbow(scene) {
  const uniforms = {
    uProgress: { value: 0 },
    uAlpha: { value: 0 },
    uTime: time,
    uInner: { value: INNER },
    uOuter: { value: OUTER },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vLocal;
      void main() {
        vLocal = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uProgress;
      uniform float uAlpha;
      uniform float uTime;
      uniform float uInner;
      uniform float uOuter;
      varying vec2 vLocal;
      vec3 hsv(float h, float s, float v) {
        vec3 k = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return v * mix(vec3(1.0), k, s);
      }
      void main() {
        float t = (length(vLocal) - uInner) / (uOuter - uInner);
        float a = atan(vLocal.y, vLocal.x);
        float k = 1.0 - a / 3.14159265;
        float reveal = smoothstep(uProgress, uProgress - 0.035, k);
        vec3 col = hsv((1.0 - t) * 0.78, 0.62, 1.0);
        float edge = smoothstep(0.0, 0.14, t) * smoothstep(1.0, 0.86, t);
        float tip = smoothstep(0.045, 0.0, abs(k - uProgress)) * step(uProgress, 0.995);
        float shimmer = 0.9 + 0.1 * sin(k * 40.0 - uTime * 3.0);
        col += vec3(tip * 0.7);
        float alpha = edge * max(reveal, tip * 0.8) * uAlpha * 0.72 * shimmer;
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(INNER, OUTER, 128, 1, 0, Math.PI), material);
  mesh.renderOrder = -5;
  mesh.visible = false;
  scene.add(mesh);

  let progress = 0;
  let target = 0;
  let alpha = 0;
  let alphaTarget = 0;

  function place(yaw) {
    mesh.position.set(-Math.sin(yaw) * DIST, BASE_Y, -Math.cos(yaw) * DIST);
    mesh.rotation.set(0, yaw, 0);
  }

  function reset(yaw) {
    place(yaw);
    progress = 0;
    target = 0;
    alpha = 0;
    alphaTarget = 0;
  }

  function setProgress(value) {
    target = Math.max(0, Math.min(1, value));
    alphaTarget = target > 0 ? 1 : 0;
  }

  function hide() {
    alphaTarget = 0;
  }

  function update(dt) {
    progress += (target - progress) * Math.min(1, dt * 1.6);
    alpha += (alphaTarget - alpha) * Math.min(1, dt * 1.4);
    uniforms.uProgress.value = progress;
    uniforms.uAlpha.value = alpha;
    mesh.visible = alpha > 0.005;
  }

  return { reset, setProgress, hide, update };
}
