import * as THREE from "three";
import { pointScale } from "../shared/points.js";
import { HIGH } from "../shared/quality.js";
import { TAU, blob, gradient, mergeAll, paint, pick, rand, xf } from "../shared/util.js";
import { EYE } from "../shared/vr.js";
import { THEMES } from "./themes.js";

const SUN = new THREE.Vector3(-0.45, 0.62, 0.64).normalize();

function createSky() {
  const uniforms = {
    uZenith: { value: new THREE.Color() },
    uMid: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uSunColor: { value: new THREE.Color() },
    uSun: { value: SUN },
    uFlash: { value: new THREE.Color(0, 0, 0) },
    uStars: { value: 0 },
    uTime: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uSunColor;
      uniform vec3 uSun;
      uniform vec3 uFlash;
      uniform float uStars;
      uniform float uTime;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(-0.05, 0.3, h));
        col = mix(col, uZenith, smoothstep(0.25, 0.95, h));
        col = mix(col, uHorizon * 0.92, smoothstep(-0.05, -0.4, h));
        float s = max(dot(d, uSun), 0.0);
        col += uSunColor * (pow(s, 6.0) * 0.3 + pow(s, 70.0) * 0.6);
        col += vec3(1.0, 0.97, 0.9) * smoothstep(0.9990, 0.9995, s) * 1.4;
        if (uStars > 0.0) {
          vec3 g = d * 150.0;
          vec3 cell = floor(g);
          float rnd = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          float dotMask = smoothstep(0.32, 0.0, length(fract(g) - 0.5));
          float star = step(0.975, rnd) * dotMask * smoothstep(0.02, 0.3, h);
          float tw = 0.55 + 0.45 * sin(uTime * 2.5 + rnd * 60.0);
          col += vec3(1.0, 0.95, 0.85) * star * tw * uStars * 1.4;
        }
        col += uFlash * (0.5 + 0.5 * max(h, 0.0));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), material);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return { mesh, uniforms, material };
}

function cloudPuffs(count, place, scale, seed = 0) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const { x, y, z, s } = place(i);
    const puffs = 3 + Math.floor(rand(0, 3));
    for (let k = 0; k < puffs; k++) {
      const pr = s * rand(0.55, 1) * (1 - Math.abs(k - puffs / 2) / (puffs * 1.4));
      const geo = blob(pr, 1, 0.25, seed + i * 13 + k);
      gradient(geo, "#e9e3ef", "#ffffff", 0.7);
      xf(geo, (k - puffs / 2) * s * 0.7, rand(-0.2, 0.4) * s * 0.4, rand(-0.4, 0.4) * s, 0, 0, 0, 1, scale, 1);
      xf(geo, x, y, z, 0, rand(0, TAU), 0);
      parts.push(geo);
    }
  }
  return mergeAll(parts);
}

// Ilhas flutuantes distantes, decoradas conforme o mundo.
function islands(theme) {
  const parts = [];
  const grass = {
    trees: ["#7ccf5a", "#9be27a"],
    pines: ["#e8f1fb", "#ffffff"],
    candy: ["#ff9ecf", "#ffd0e8"],
    towers: ["#b9b0dc", "#d9d2f2"],
  }[theme.decor];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + rand(-0.2, 0.2) + 0.35;
    const d = rand(11, 26);
    const x = Math.sin(a) * d;
    const z = -Math.cos(a) * d;
    const y = rand(-4.5, 3.5);
    const r = rand(1.1, 2.6);
    const top = new THREE.CylinderGeometry(r, r * 0.92, 0.45, 12);
    gradient(top, grass[0], grass[1]);
    xf(top, x, y, z);
    const rock = new THREE.ConeGeometry(r * 0.92, r * 1.7, 9);
    gradient(rock, theme.underBottom, theme.underTop);
    xf(rock, x, y - 0.225 - r * 0.85, z, Math.PI, rand(0, TAU), 0);
    parts.push(top, rock);
    const n = 2 + Math.floor(rand(0, 3));
    for (let k = 0; k < n; k++) {
      const ka = rand(0, TAU);
      const kd = rand(0, r * 0.65);
      const px = x + Math.cos(ka) * kd;
      const pz = z + Math.sin(ka) * kd;
      const py = y + 0.22;
      const s = rand(0.6, 1.1);
      if (theme.decor === "trees") {
        const trunk = new THREE.CylinderGeometry(0.08 * s, 0.12 * s, 0.7 * s, 6);
        paint(trunk, "#8a5a36");
        xf(trunk, px, py + 0.35 * s, pz);
        const crown = blob(0.55 * s, 1, 0.35, i * 7 + k);
        const tint = pick([
          ["#3f9d45", "#7fdc6a"],
          ["#e86aa0", "#ffb3d1"],
          ["#58b94c", "#a5e77f"],
        ]);
        gradient(crown, tint[0], tint[1]);
        xf(crown, px, py + 0.95 * s, pz);
        parts.push(trunk, crown);
      } else if (theme.decor === "pines") {
        for (let j = 0; j < 3; j++) {
          const cone = new THREE.ConeGeometry((0.55 - j * 0.14) * s, 0.6 * s, 8);
          gradient(cone, "#2f7d57", j === 2 ? "#ffffff" : "#4fae7a");
          xf(cone, px, py + (0.35 + j * 0.35) * s, pz);
          parts.push(cone);
        }
      } else if (theme.decor === "candy") {
        const stick = new THREE.CylinderGeometry(0.04 * s, 0.04 * s, 1.1 * s, 6);
        paint(stick, "#ffffff");
        xf(stick, px, py + 0.55 * s, pz);
        const color = pick(["#ff5f9e", "#ffb347", "#5ec8ff", "#8be36b", "#b388ff"]);
        const face = rand(0, TAU);
        const disc = new THREE.CylinderGeometry(0.42 * s, 0.42 * s, 0.1 * s, 16);
        paint(disc, color);
        xf(disc, px, py + 1.25 * s, pz, Math.PI / 2, face, 0);
        const swirl = new THREE.TorusGeometry(0.26 * s, 0.05 * s, 6, 18);
        paint(swirl, "#ffffff");
        xf(swirl, 0, 0, 0.06 * s);
        xf(swirl, px, py + 1.25 * s, pz, 0, face, 0);
        const drop = new THREE.SphereGeometry(0.28 * s, 12, 8, 0, TAU, 0, Math.PI / 2);
        paint(drop, pick(["#ff6f91", "#69db7c", "#ffd43b"]));
        xf(drop, px + 0.4 * s, py, pz + 0.3 * s);
        parts.push(stick, disc, swirl, drop);
      } else {
        const tower = new THREE.CylinderGeometry(0.28 * s, 0.32 * s, 1.4 * s, 10);
        gradient(tower, "#9d93c2", "#d6cfee");
        xf(tower, px, py + 0.7 * s, pz);
        const roof = new THREE.ConeGeometry(0.4 * s, 0.7 * s, 10);
        paint(roof, pick(["#ff7eb3", "#b388ff", "#5ec8ff"]));
        xf(roof, px, py + 1.75 * s, pz);
        parts.push(tower, roof);
      }
    }
  }
  return mergeAll(parts);
}

function castle() {
  const parts = [];
  const stone = ["#a79fc4", "#e2dcf5"];
  const roofs = ["#ff7eb3", "#b388ff"];
  const keep = new THREE.BoxGeometry(5, 4, 4);
  gradient(keep, stone[0], stone[1]);
  xf(keep, 0, 2, 0);
  parts.push(keep);
  for (let i = 0; i < 9; i++) {
    for (const zf of [-1, 1]) {
      const m = new THREE.BoxGeometry(0.4, 0.45, 0.4);
      gradient(m, stone[0], stone[1]);
      xf(m, -2.3 + i * 0.575, 4.2, zf * 1.8);
      parts.push(m);
    }
  }
  for (const [x, z] of [
    [-2.6, 2.1],
    [2.6, 2.1],
    [-2.6, -2.1],
    [2.6, -2.1],
  ]) {
    const t = new THREE.CylinderGeometry(0.85, 0.95, 6, 16);
    gradient(t, stone[0], stone[1]);
    xf(t, x, 3, z);
    const r = new THREE.ConeGeometry(1.15, 2.4, 16);
    gradient(r, roofs[0], "#ffd0e4");
    xf(r, x, 7.2, z);
    const flag = new THREE.ConeGeometry(0.25, 0.6, 3);
    paint(flag, "#ffd34d");
    xf(flag, x + 0.3, 8.6, z, 0, 0, -Math.PI / 2, 1, 1, 0.2);
    const pole = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5);
    paint(pole, "#ffffff");
    xf(pole, x, 8.6, z);
    parts.push(t, r, flag, pole);
  }
  const big = new THREE.CylinderGeometry(1.1, 1.25, 9, 18);
  gradient(big, stone[0], stone[1]);
  xf(big, 0, 4.5, -0.4);
  const bigRoof = new THREE.ConeGeometry(1.5, 3.4, 18);
  gradient(bigRoof, roofs[1], "#e5d4ff");
  xf(bigRoof, 0, 10.7, -0.4);
  const crown = new THREE.TorusGeometry(0.35, 0.09, 8, 16);
  paint(crown, "#ffd34d");
  xf(crown, 0, 12.6, -0.4);
  parts.push(big, bigRoof, crown);
  const gate = new THREE.BoxGeometry(1.4, 1.8, 0.2);
  paint(gate, "#5a3f7a");
  xf(gate, 0, 0.9, 2.02);
  const arch = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 16, 1, false, 0, Math.PI);
  paint(arch, "#5a3f7a");
  arch.rotateX(Math.PI / 2);
  xf(arch, 0, 1.8, 2.02, 0, 0, Math.PI / 2);
  parts.push(gate, arch);
  const body = new THREE.Mesh(mergeAll(parts), new THREE.MeshLambertMaterial({ vertexColors: true }));

  const windows = [];
  for (const [x, y, z] of [
    [-1.4, 2.6, 2.02],
    [1.4, 2.6, 2.02],
    [0, 3.3, 2.02],
    [-2.6, 4.6, 2.98],
    [2.6, 4.6, 2.98],
    [0, 7.5, 0.77],
    [0, 5.8, 0.77],
  ]) {
    const w = new THREE.PlaneGeometry(0.42, 0.62);
    xf(w, x, y, z);
    windows.push(w);
  }
  const windowMat = new THREE.MeshBasicMaterial({ color: "#ffd98a", toneMapped: false });
  const lights = new THREE.Mesh(mergeAll(windows, ["position", "normal"]), windowMat);
  const base = new THREE.Mesh(
    cloudPuffs(
      9,
      (i) => ({ x: Math.cos((i / 9) * TAU) * 3.2, y: -0.6, z: Math.sin((i / 9) * TAU) * 2.8, s: rand(1.6, 2.4) }),
      0.55,
      300,
    ),
    new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x6a5f8a }),
  );
  const group = new THREE.Group();
  group.add(body, lights, base);
  group.position.set(0, -2.2, -16);
  return { group, windowMat };
}

function rainbow() {
  const geo = new THREE.TorusGeometry(7.5, 0.7, 10, 72, Math.PI);
  const pos = geo.attributes.position;
  const data = new Float32Array(pos.count * 3);
  const bands = ["#b197fc", "#4dabf7", "#69db7c", "#ffe066", "#ffa94d", "#ff5f7e"].map((c) => new THREE.Color(c));
  const color = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i));
    const k = Math.min(0.999, Math.max(0, (r - 6.8) / 1.4)) * (bands.length - 1);
    const j = Math.floor(k);
    color.copy(bands[j]).lerp(bands[Math.min(bands.length - 1, j + 1)], k - j);
    data[i * 3] = color.r;
    data[i * 3 + 1] = color.g;
    data[i * 3 + 2] = color.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(data, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, -2.5, -11);
  mesh.scale.set(1, 1, 0.15);
  mesh.visible = false;
  return { mesh, mat };
}

function particles() {
  const n = HIGH ? 320 : 160;
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = rand(-5, 5);
    pos[i * 3 + 1] = rand(-2.5, 4);
    pos[i * 3 + 2] = rand(-6, 4);
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const uniforms = { uTime: { value: 0 }, uColor: { value: new THREE.Color() }, uKind: { value: 0 }, uScale: pointScale };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uKind;
      uniform float uScale;
      attribute float aSeed;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * (0.6 + aSeed * 0.6) + aSeed * 40.0;
        if (uKind < 0.5) {
          p += vec3(sin(t * 0.7) * 0.4, sin(t * 0.5) * 0.3, cos(t * 0.6) * 0.4);
        } else if (uKind < 1.5) {
          p.y = mod(p.y + 2.5 - uTime * (0.25 + aSeed * 0.2), 6.5) - 2.5;
          p.x += sin(t) * 0.3;
        } else {
          p += vec3(sin(t * 0.4) * 0.2, sin(t * 0.3) * 0.15, cos(t * 0.35) * 0.2);
        }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float size = uKind > 0.5 && uKind < 1.5 ? 0.05 : 0.035;
        gl_PointSize = size * uScale / max(0.3, -mv.z);
        vAlpha = uKind > 1.5 ? 0.35 + 0.65 * abs(sin(t * 2.0)) : 0.75;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord * 2.0 - 1.0;
        float a = exp(-dot(c, c) * 4.0) * vAlpha;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.position.y = EYE;
  return { points, uniforms };
}

// Cenário ao redor do tabuleiro. Para um mundo novo: tema em themes.js (cores, decoração, partículas).
export function createScenery(renderer) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 30, 170);
  const sky = createSky();
  scene.add(sky.mesh);

  const cloudMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x77708a });
  const sea = new THREE.Mesh(
    cloudPuffs(
      HIGH ? 44 : 26,
      (i) => {
        const a = rand(0, TAU);
        const d = i < 8 ? rand(4, 9) : rand(10, 80);
        return { x: Math.sin(a) * d, y: i < 8 ? rand(-6, -4) : rand(-17, -9), z: -Math.cos(a) * d, s: i < 8 ? rand(1.2, 2) : rand(3, 7) };
      },
      0.5,
    ),
    cloudMat,
  );
  const high = new THREE.Mesh(
    cloudPuffs(
      10,
      (i) => {
        const a = (i / 10) * TAU + rand(-0.2, 0.2);
        const d = rand(70, 110);
        return { x: Math.sin(a) * d, y: rand(16, 34), z: -Math.cos(a) * d, s: rand(4, 7) };
      },
      0.7,
      100,
    ),
    new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x8a8296, fog: false }),
  );
  const seat = new THREE.Mesh(
    cloudPuffs(
      6,
      (i) => {
        const a = (i / 6) * TAU;
        return { x: Math.cos(a) * 0.32, y: 0.3, z: Math.sin(a) * 0.32 + 0.15, s: rand(0.24, 0.34) };
      },
      0.7,
      200,
    ),
    cloudMat,
  );
  scene.add(sea, high, seat);

  const hemi = new THREE.HemisphereLight(0xd4ebff, 0x9a8fb0, 1.3);
  const sun = new THREE.DirectionalLight(0xffe2bc, 2.3);
  if (HIGH) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const cam = sun.shadow.camera;
    cam.left = -1;
    cam.right = 1;
    cam.top = 1;
    cam.bottom = -1;
    cam.near = 0.1;
    cam.far = 10;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.004;
  }
  scene.add(hemi, sun, sun.target);

  const ambient = particles();
  scene.add(ambient.points);

  let islandMesh = null;
  const islandMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  let castleParts = null;
  const bow = rainbow();
  scene.add(bow.mesh);

  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(sky.mesh.geometry, sky.material));
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envTarget = null;

  let current = null;
  let party = 0;
  let partyTarget = 0;
  const flash = new THREE.Color();
  const friends = [];

  function setTheme(name) {
    if (current === name) return envTarget.texture;
    current = name;
    const th = THEMES[name];
    const u = sky.uniforms;
    u.uZenith.value.set(th.sky.zenith);
    u.uMid.value.set(th.sky.mid);
    u.uHorizon.value.set(th.sky.horizon);
    u.uSunColor.value.set(th.sky.sun);
    u.uStars.value = th.stars;
    scene.fog.color.set(th.fog);
    cloudMat.color.set(th.cloud[1]).lerp(new THREE.Color(th.cloud[0]), 0.5);
    high.material.color.copy(cloudMat.color);
    hemi.color.set(th.sky.mid).lerp(new THREE.Color("#ffffff"), 0.4);
    hemi.groundColor.set(th.underTop);
    sun.color.set(th.sky.sun).lerp(new THREE.Color("#ffffff"), 0.4);
    sun.intensity = th.stars ? 1.7 : 2.3;
    hemi.intensity = th.stars ? 1.5 : 1.3;
    ambient.uniforms.uColor.value.set(th.particles.color);
    ambient.uniforms.uKind.value = { pollen: 0, snow: 1, sugar: 2, stars: 3 }[th.particles.kind];
    if (islandMesh) {
      scene.remove(islandMesh);
      islandMesh.geometry.dispose();
    }
    islandMesh = new THREE.Mesh(islands(th), islandMat);
    scene.add(islandMesh);
    if (name === "castelo" && !castleParts) {
      castleParts = castle();
      scene.add(castleParts.group);
    }
    if (castleParts) castleParts.group.visible = name === "castelo";
    if (envTarget) envTarget.dispose();
    envTarget = pmrem.fromScene(envScene, 0.04);
    return envTarget.texture;
  }

  function aimSun(target) {
    sun.target.position.copy(target);
    sun.position.copy(target).addScaledVector(SUN, 4);
  }

  function pulse(color, strength = 0.4) {
    flash.set(color).multiplyScalar(strength);
  }

  // Grande final: castelo aceso, arco-íris e os amiguinhos em nuvens ao redor.
  function celebrate(critters, types) {
    partyTarget = 1;
    bow.mesh.visible = true;
    types.forEach((type, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const a = side * (0.62 + Math.floor(i / 2) * 0.34);
      const d = 1.9 + Math.floor(i / 2) * 0.12;
      const x = Math.sin(a) * d;
      const z = -Math.cos(a) * d;
      const y = EYE - 0.42 + (i % 3) * 0.08;
      const puff = new THREE.Mesh(
        cloudPuffs(1, () => ({ x: 0, y: 0, z: 0, s: 0.2 }), 0.45, 400 + i),
        cloudMat,
      );
      puff.position.set(x, y, z);
      const mesh = critters.make(type);
      mesh.position.set(x, y + 0.14, z);
      mesh.rotation.y = Math.atan2(-x, -z);
      mesh.scale.setScalar(0.001);
      scene.add(puff, mesh);
      friends.push({ mesh, puff, y: y + 0.14, phase: i * 0.7, age: -i * 0.18, critters });
    });
  }

  function endCelebration() {
    partyTarget = 0;
    for (const f of friends) {
      f.critters.release(f.mesh);
      scene.remove(f.puff);
      f.puff.geometry.dispose();
    }
    friends.length = 0;
  }

  function update(dt, t) {
    sky.uniforms.uTime.value = t;
    ambient.uniforms.uTime.value = t;
    sea.rotation.y += dt * 0.003;
    high.rotation.y += dt * 0.002;
    flash.multiplyScalar(Math.max(0, 1 - dt * 3));
    sky.uniforms.uFlash.value.copy(flash);
    party += (partyTarget - party) * Math.min(1, dt * 1.2);
    bow.mat.opacity = party * 0.75;
    if (party < 0.01 && partyTarget === 0) bow.mesh.visible = false;
    if (castleParts) {
      const glow = Math.min(1, party * (0.9 + Math.sin(t * 6) * 0.1));
      castleParts.windowMat.color.setRGB(0.85 + glow * 0.15, 0.62 + glow * 0.22, 0.3 + glow * 0.12);
    }
    for (const f of friends) {
      f.age += dt;
      const grow = Math.min(1, Math.max(0, f.age * 2.5));
      f.mesh.scale.setScalar(0.32 * (grow < 1 ? grow * (1.3 - 0.3 * grow) : 1));
      f.mesh.position.y = f.y + Math.abs(Math.sin(t * 5 + f.phase)) * 0.12 * grow;
    }
  }

  return { scene, setTheme, aimSun, pulse, celebrate, endCelebration, update };
}
