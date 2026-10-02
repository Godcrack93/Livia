import * as THREE from "three";
import { HIGH } from "../shared/quality.js";
import { angleDiff, canvasTexture, makeCanvas, rand, starPath } from "../shared/util.js";
import { BALL_R } from "./physics.js";

const axis = new THREE.Vector3();
const dq = new THREE.Quaternion();

function glassTexture() {
  const canvas = makeCanvas(256, 128);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(210, 240, 255, 0.16)";
  ctx.fillRect(0, 0, 256, 128);
  const colors = ["#ff6fa8", "#ffd34d", "#5ec8ff", "#8be36b", "#b388ff"];
  for (let i = 0; i < 22; i++) {
    const x = (i * 53) % 256;
    const y = 22 + ((i * 37) % 84);
    starPath(ctx, x, y, rand(5, 8), rand(2.4, 3.6));
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.85;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(0, 62, 256, 4);
  return canvasTexture(canvas);
}

function shadowTexture() {
  const canvas = makeCanvas(64, 64);
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(20,10,40,0.7)");
  g.addColorStop(0.5, "rgba(20,10,40,0.35)");
  g.addColorStop(1, "rgba(20,10,40,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return canvasTexture(canvas);
}

// Bolinha de vidro com o pintinho dentro. Fica no grupo que inclina, em coordenadas do tabuleiro.
export function createBall(critters) {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);

  const glassMat = new THREE.MeshStandardMaterial({
    map: glassTexture(),
    transparent: true,
    roughness: 0.05,
    metalness: 0.1,
    envMapIntensity: 1.5,
    depthWrite: false,
  });
  const glass = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 32, 20), glassMat);
  glass.renderOrder = 3;
  spin.add(glass);

  const rimUniforms = { uGlow: { value: 0 } };
  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_R * 1.004, 32, 20),
    new THREE.ShaderMaterial({
      uniforms: rimUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uGlow;
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          float f = 1.0 - max(dot(vN, vV), 0.0);
          float rim = pow(f, 2.4);
          vec3 l = normalize(vec3(-0.45, 0.65, 0.6));
          vec3 h = normalize(l + vV);
          float spec = pow(max(dot(vN, h), 0.0), 90.0);
          vec3 l2 = normalize(vec3(0.5, -0.3, 0.8));
          float spec2 = pow(max(dot(vN, normalize(l2 + vV)), 0.0), 40.0) * 0.25;
          vec3 col = vec3(0.7, 0.9, 1.0) * rim * 0.85 + vec3(1.0) * (spec * 1.3 + spec2);
          col += vec3(1.0, 0.85, 0.4) * uGlow * (0.35 + rim);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
  );
  rim.renderOrder = 4;
  group.add(rim);

  const chick = critters.make("pintinho");
  chick.scale.setScalar(BALL_R * 1.42);
  chick.position.y = -BALL_R * 0.08;
  chick.castShadow = HIGH;
  group.add(chick);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(BALL_R * 3.2, BALL_R * 3.2),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.55 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = 2;

  let heading = 0;
  let waddle = 0;

  function setEnv(texture) {
    glassMat.envMap = texture;
    glassMat.needsUpdate = true;
  }

  function attach(parent) {
    parent.add(group, shadow);
  }

  function update(dt, x, y, z, vx, vz, scale = 1) {
    group.position.set(x, y, z);
    group.scale.setScalar(scale);
    const speed = Math.hypot(vx, vz);
    if (speed > 1e-4) {
      axis.set(vz, 0, -vx).normalize();
      dq.setFromAxisAngle(axis, (speed * dt) / BALL_R);
      spin.quaternion.premultiply(dq);
    }
    if (speed > 0.04) heading += angleDiff(Math.atan2(vx, vz), heading) * Math.min(1, dt * 8);
    waddle += dt * (4 + speed * 30);
    chick.rotation.set(Math.sin(waddle) * Math.min(0.25, speed * 0.6), heading, Math.cos(waddle * 0.5) * Math.min(0.2, speed * 0.4));
    shadow.position.set(x, 0.0015, z);
    const lift = Math.max(0, y - BALL_R);
    shadow.visible = group.visible && y > -0.005;
    shadow.scale.setScalar(scale * (1 + lift * 6));
    shadow.material.opacity = (0.55 * scale) / (1 + lift * 10);
  }

  function setGlow(v) {
    rimUniforms.uGlow.value = v;
  }

  function setVisible(v) {
    group.visible = v;
    shadow.visible = v;
  }

  function faceForward() {
    heading = 0;
  }

  return {
    group,
    shadow,
    attach,
    update,
    setEnv,
    setGlow,
    setVisible,
    faceForward,
    get chick() {
      return chick;
    },
  };
}
