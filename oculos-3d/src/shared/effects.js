import * as THREE from "three";
import { pointScale } from "./points.js";
import { FONT, TAU, canvasTexture, makeCanvas, rand } from "./util.js";

const tmpColor = new THREE.Color();
const WHITE = new THREE.Color(1, 1, 1);

function createParticles(max, additive) {
  const positions = new Float32Array(max * 3);
  const colors = new Float32Array(max * 3);
  const sizes = new Float32Array(max);
  const alphas = new Float32Array(max);
  const vel = new Float32Array(max * 3);
  const life = new Float32Array(max);
  const maxLife = new Float32Array(max);
  const gravity = new Float32Array(max);
  const drag = new Float32Array(max);
  const baseSize = new Float32Array(max);
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage);
  const colAttr = new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage);
  const sizeAttr = new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage);
  const alphaAttr = new THREE.BufferAttribute(alphas, 1).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", posAttr);
  geo.setAttribute("aColor", colAttr);
  geo.setAttribute("aSize", sizeAttr);
  geo.setAttribute("aAlpha", alphaAttr);
  const material = new THREE.ShaderMaterial({
    uniforms: { uScale: pointScale },
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: /* glsl */ `
      uniform float uScale;
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aAlpha;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uScale / max(0.1, -mv.z);
        vColor = aColor;
        vAlpha = aAlpha;
      }
    `,
    fragmentShader: additive
      ? /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float r = length(p);
          float core = exp(-r * r * 7.0);
          float cross = max(0.0, 1.0 - abs(p.x) * 7.0) * max(0.0, 1.0 - abs(p.y)) + max(0.0, 1.0 - abs(p.y) * 7.0) * max(0.0, 1.0 - abs(p.x));
          float a = (core + cross * 0.6) * vAlpha;
          gl_FragColor = vec4(vColor * a, a);
        }
      `
      : /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float r = dot(p, p);
          if (r > 1.0) discard;
          float edge = smoothstep(1.0, 0.7, r);
          float hi = smoothstep(0.35, 0.0, length(p - vec2(-0.35, -0.35)));
          gl_FragColor = vec4(vColor + hi * 0.7, edge * vAlpha);
        }
      `,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 6;
  let cursor = 0;
  let live = 0;

  function emit(x, y, z, vx, vy, vz, color, size, lifetime, g = 3, d = 1.5) {
    const i = cursor;
    cursor = (cursor + 1) % max;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    vel[i * 3] = vx;
    vel[i * 3 + 1] = vy;
    vel[i * 3 + 2] = vz;
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    baseSize[i] = size;
    life[i] = lifetime;
    maxLife[i] = lifetime;
    gravity[i] = g;
    drag[i] = d;
    live = max;
  }

  function update(dt) {
    if (live === 0) return;
    let any = false;
    for (let i = 0; i < max; i++) {
      if (life[i] <= 0) {
        if (alphas[i] !== 0) {
          alphas[i] = 0;
          sizes[i] = 0;
        }
        continue;
      }
      any = true;
      life[i] -= dt;
      const k = Math.max(0, life[i] / maxLife[i]);
      const damp = Math.max(0, 1 - drag[i] * dt);
      vel[i * 3] *= damp;
      vel[i * 3 + 1] = vel[i * 3 + 1] * damp - gravity[i] * dt;
      vel[i * 3 + 2] *= damp;
      positions[i * 3] += vel[i * 3] * dt;
      positions[i * 3 + 1] += vel[i * 3 + 1] * dt;
      positions[i * 3 + 2] += vel[i * 3 + 2] * dt;
      alphas[i] = Math.min(1, k * 2.2);
      sizes[i] = baseSize[i] * (0.4 + 0.6 * k);
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    if (!any) live = 0;
  }

  return { points, emit, update };
}

function ringMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() }, uAlpha: { value: 0 }, uWidth: { value: 0.1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uAlpha;
      uniform float uWidth;
      varying vec2 vUv;
      void main() {
        float r = length(vUv * 2.0 - 1.0);
        float ring = smoothstep(uWidth, 0.0, abs(r - 0.85));
        float a = ring * uAlpha;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  });
}

const textCache = new Map();

function textTexture(text, color) {
  const key = `${text}|${color}`;
  const cached = textCache.get(key);
  if (cached) return cached;
  const size = 96;
  const probe = makeCanvas(8, 8).getContext("2d");
  probe.font = `700 ${size}px ${FONT}`;
  const w = Math.ceil(probe.measureText(text).width + size * 0.8);
  const h = Math.ceil(size * 1.5);
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = size * 0.3;
  ctx.strokeStyle = "#3b3561";
  ctx.strokeText(text, w / 2, h / 2 + size * 0.06);
  ctx.lineWidth = size * 0.16;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeText(text, w / 2, h / 2);
  const g = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.8);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.35, color);
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.fillText(text, w / 2, h / 2);
  const entry = { texture: canvasTexture(canvas), aspect: w / h };
  textCache.set(key, entry);
  return entry;
}

const RAINBOW = ["#ff5f7e", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7", "#b197fc"];

// Para um efeito novo: uma função aqui que use emit/ring/text.
export function createEffects(scene, head) {
  const soft = createParticles(900, false);
  const glow = createParticles(700, true);
  scene.add(soft.points, glow.points);

  const ringGeo = new THREE.PlaneGeometry(1, 1);
  const rings = [];
  for (let i = 0; i < 18; i++) {
    const mesh = new THREE.Mesh(ringGeo, ringMaterial());
    mesh.visible = false;
    mesh.renderOrder = 7;
    mesh.frustumCulled = false;
    scene.add(mesh);
    rings.push({ mesh, age: 0, life: 0, from: 0, to: 0 });
  }
  let ringCursor = 0;

  const sprites = [];
  for (let i = 0; i < 20; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false }),
    );
    sprite.visible = false;
    sprite.renderOrder = 30;
    scene.add(sprite);
    sprites.push({ sprite, age: 0, life: 0, height: 0, rise: 0, aspect: 1 });
  }
  let spriteCursor = 0;

  function ring(pos, radius, color, life = 0.4, grow = 2.4, width = 0.12) {
    const r = rings[ringCursor];
    ringCursor = (ringCursor + 1) % rings.length;
    r.mesh.visible = true;
    r.mesh.position.copy(pos);
    r.mesh.material.uniforms.uColor.value.set(color);
    r.mesh.material.uniforms.uWidth.value = width;
    r.age = 0;
    r.life = life;
    r.from = radius * 2;
    r.to = radius * 2 * grow;
  }

  function text(pos, str, color, height = 0.32, life = 1.0, rise = 0.6) {
    const s = sprites[spriteCursor];
    spriteCursor = (spriteCursor + 1) % sprites.length;
    const { texture, aspect } = textTexture(str, color);
    s.sprite.material.map = texture;
    s.sprite.material.needsUpdate = true;
    s.sprite.position.copy(pos);
    s.sprite.visible = true;
    s.age = 0;
    s.life = life;
    s.height = height;
    s.rise = rise;
    s.aspect = aspect;
  }

  function pop(pos, radius, color) {
    tmpColor.set(color);
    const n = Math.round(14 + radius * 30);
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const b = Math.acos(rand(-1, 1));
      const sp = rand(1.2, 2.6) * (0.6 + radius);
      const dx = Math.sin(b) * Math.cos(a);
      const dy = Math.cos(b);
      const dz = Math.sin(b) * Math.sin(a);
      soft.emit(
        pos.x + dx * radius,
        pos.y + dy * radius,
        pos.z + dz * radius,
        dx * sp,
        dy * sp + 0.6,
        dz * sp,
        i % 3 === 0 ? tmpColor.set("#ffffff") : tmpColor.set(color),
        rand(0.035, 0.07),
        rand(0.45, 0.8),
        4.5,
        2.2,
      );
    }
    for (let i = 0; i < 8; i++) {
      const a = rand(0, TAU);
      const b = Math.acos(rand(-1, 1));
      const sp = rand(0.4, 1.2);
      glow.emit(
        pos.x,
        pos.y,
        pos.z,
        Math.sin(b) * Math.cos(a) * sp,
        Math.cos(b) * sp,
        Math.sin(b) * Math.sin(a) * sp,
        tmpColor.set(color).lerp(WHITE, 0.5),
        rand(0.12, 0.2),
        rand(0.35, 0.6),
        0,
        2,
      );
    }
    ring(pos, radius, color, 0.35, 2.2, 0.1);
  }

  function sparkle(pos, color, count = 1, spread = 0.2, size = 0.12) {
    tmpColor.set(color);
    for (let i = 0; i < count; i++) {
      glow.emit(
        pos.x + rand(-spread, spread),
        pos.y + rand(-spread, spread),
        pos.z + rand(-spread, spread),
        rand(-0.2, 0.2),
        rand(0.1, 0.5),
        rand(-0.2, 0.2),
        tmpColor,
        size * rand(0.7, 1.3),
        rand(0.5, 0.9),
        0,
        1,
      );
    }
  }

  function confetti(pos, count = 50, colors = RAINBOW, speed = 3) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const sp = rand(0.5, 1) * speed;
      soft.emit(
        pos.x,
        pos.y,
        pos.z,
        Math.cos(a) * sp * 0.7,
        rand(0.6, 1.4) * sp,
        Math.sin(a) * sp * 0.7,
        tmpColor.set(colors[i % colors.length]),
        rand(0.07, 0.12),
        rand(1.4, 2.2),
        2.2,
        1.8,
      );
    }
  }

  function firework(pos, color) {
    tmpColor.set(color);
    const n = 70;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const b = Math.acos(rand(-1, 1));
      const sp = rand(5, 7);
      glow.emit(
        pos.x,
        pos.y,
        pos.z,
        Math.sin(b) * Math.cos(a) * sp,
        Math.cos(b) * sp,
        Math.sin(b) * Math.sin(a) * sp,
        i % 4 === 0 ? tmpColor.set("#ffffff") : tmpColor.set(color),
        rand(0.6, 1.0),
        rand(1.1, 1.7),
        1.6,
        1.8,
      );
    }
    ring(pos, 1.2, color, 0.6, 5, 0.06);
  }

  function update(dt) {
    soft.update(dt);
    glow.update(dt);
    for (const r of rings) {
      if (!r.mesh.visible) continue;
      r.age += dt;
      const k = r.age / r.life;
      if (k >= 1) {
        r.mesh.visible = false;
        continue;
      }
      const e = 1 - (1 - k) * (1 - k);
      r.mesh.scale.setScalar(r.from + (r.to - r.from) * e);
      r.mesh.quaternion.copy(head.quaternion);
      r.mesh.material.uniforms.uAlpha.value = (1 - k) * 0.9;
    }
    for (const s of sprites) {
      if (!s.sprite.visible) continue;
      s.age += dt;
      const k = s.age / s.life;
      if (k >= 1) {
        s.sprite.visible = false;
        continue;
      }
      const popIn = Math.min(1, s.age * 8);
      const scale = s.height * (0.6 + 0.4 * popIn + Math.sin(Math.min(1, s.age * 6) * Math.PI) * 0.25);
      s.sprite.scale.set(scale * s.aspect, scale, 1);
      s.sprite.position.y += (s.rise / s.life) * dt * (1 - k);
      s.sprite.material.opacity = k > 0.7 ? (1 - k) / 0.3 : 1;
    }
  }

  return { pop, ring, text, sparkle, confetti, firework, update, RAINBOW };
}
