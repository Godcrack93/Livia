import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { starGeometry } from "../shared/critters.js";
import { HIGH } from "../shared/quality.js";
import { TAU, blob, canvasTexture, easeOutBack, gradient, makeCanvas, mergeAll, paint, pick, rand, xf } from "../shared/util.js";
import { EYE } from "../shared/vr.js";
import { BALL_R, CELL, HOLE_R, T } from "./physics.js";

export const WALL_H = 0.075;
export const MAX_TILT = 0.2;
const TILE_H = 0.03;
const GAP = 0.004;
const tmpA = new THREE.Color();
const tmpB = new THREE.Color();
const rayO = new THREE.Vector3();
const rayD = new THREE.Vector3();
const inv = new THREE.Matrix4();

function shade(color, amount) {
  return new THREE.Color(color).offsetHSL(0, 0, amount);
}

function tileGeo(x, z, top, side) {
  const geo = new THREE.BoxGeometry(CELL - GAP, TILE_H, CELL - GAP);
  const n = geo.attributes.position.count;
  const data = new Float32Array(n * 3);
  tmpA.set(top);
  tmpB.set(side);
  for (let i = 0; i < n; i++) {
    const c = i >= 8 && i < 12 ? tmpA : tmpB;
    data[i * 3] = c.r;
    data[i * 3 + 1] = c.g;
    data[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(data, 3));
  xf(geo, x, -TILE_H / 2, z);
  return geo;
}

function colorByNormal(geo, top, side) {
  const nrm = geo.attributes.normal;
  const data = new Float32Array(nrm.count * 3);
  tmpA.set(top);
  tmpB.set(side);
  for (let i = 0; i < nrm.count; i++) {
    const c = nrm.getY(i) > 0.5 ? tmpA : tmpB;
    data[i * 3] = c.r;
    data[i * 3 + 1] = c.g;
    data[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(data, 3));
  return geo;
}

// Degradê pela altura já no lugar final (para a ilha inteira ter um degradê só).
function colorByY(geo, top, bottom, y0, y1) {
  const pos = geo.attributes.position;
  const data = new Float32Array(pos.count * 3);
  tmpA.set(top);
  tmpB.set(bottom);
  for (let i = 0; i < pos.count; i++) {
    const k = Math.min(1, Math.max(0, (y0 - pos.getY(i)) / (y0 - y1)));
    data[i * 3] = tmpA.r + (tmpB.r - tmpA.r) * k;
    data[i * 3 + 1] = tmpA.g + (tmpB.g - tmpA.g) * k;
    data[i * 3 + 2] = tmpA.b + (tmpB.b - tmpA.b) * k;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(data, 3));
  return geo;
}

function holeTile(x, z, top, side) {
  const s = (CELL - GAP) / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-s, -s);
  shape.lineTo(s, -s);
  shape.lineTo(s, s);
  shape.lineTo(-s, s);
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, HOLE_R, 0, TAU, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: TILE_H, bevelEnabled: false, curveSegments: 22 });
  xf(geo, 0, 0, 0, -Math.PI / 2, 0, 0);
  xf(geo, x, -TILE_H, z);
  return colorByNormal(geo, top, side);
}

function holeInside(x, z) {
  const tube = new THREE.CylinderGeometry(HOLE_R, HOLE_R * 0.92, 0.12, 22, 1, true);
  xf(tube, x, -0.06, z);
  colorByY(tube, "#3a2a2a", "#000000", 0, -0.1);
  const floor = new THREE.CircleGeometry(HOLE_R * 0.92, 16);
  xf(floor, x, -0.119, z, -Math.PI / 2, 0, 0);
  paint(floor, "#000000");
  return [tube, floor];
}

function distanceToVoid(L) {
  const out = new Uint8Array(L.rows * L.cols);
  for (let r = 0; r < L.rows; r++) {
    for (let c = 0; c < L.cols; c++) {
      let best = 4;
      for (let dr = -3; dr <= 3; dr++) {
        for (let dc = -3; dc <= 3; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          const out2 = rr < 0 || cc < 0 || rr >= L.rows || cc >= L.cols;
          if (out2 || L.cells[rr * L.cols + cc] === T.VOID) best = Math.min(best, Math.max(Math.abs(dr), Math.abs(dc)));
        }
      }
      out[r * L.cols + c] = best;
    }
  }
  return out;
}

// Bloco de parede no estilo do mundo. Para um estilo novo: um "if" aqui e "wall" no tema.
function wallBlock(theme, x, z, r, c) {
  const out = [];
  const style = theme.wall;
  const base = new RoundedBoxGeometry(CELL, WALL_H, CELL, 2, style === "stone" ? 0.007 : 0.016);
  const tone = rand(-0.05, 0.04);
  if (style === "hedge") {
    gradient(base, shade(theme.wallSide, tone - 0.08), shade(theme.wallTop, tone), 1.4);
    xf(base, x, WALL_H / 2, z);
    out.push(base);
    for (let k = 0; k < 2; k++) {
      const leaf = blob(0.03, 1, 0.5, r * 31 + c * 7 + k);
      gradient(leaf, theme.wallSide, shade(theme.wallTop, 0.05));
      xf(leaf, x + rand(-0.022, 0.022), WALL_H - 0.006, z + rand(-0.022, 0.022), 0, rand(0, TAU), 0, 1, 0.55, 1);
      out.push(leaf);
    }
    if (Math.random() < 0.3) {
      const petal = pick(["#ffffff", "#ffd1e8", "#fff4a0", "#ff9ecf"]);
      const fx = x + rand(-0.03, 0.03);
      const fz = z + rand(-0.03, 0.03);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU;
        const p = new THREE.SphereGeometry(0.007, 6, 4);
        paint(p, petal);
        xf(p, fx + Math.cos(a) * 0.008, WALL_H + 0.012, fz + Math.sin(a) * 0.008, 0, 0, 0, 1, 0.5, 1);
        out.push(p);
      }
      const center = new THREE.SphereGeometry(0.0055, 6, 4);
      paint(center, "#ffc928");
      xf(center, fx, WALL_H + 0.014, fz);
      out.push(center);
    }
  } else if (style === "snow") {
    gradient(base, shade(theme.wallSide, tone - 0.06), theme.wallTop, 1.2);
    xf(base, x, WALL_H / 2, z);
    out.push(base);
    const cap = blob(0.056, 1, 0.25, r * 17 + c);
    gradient(cap, "#e6f2ff", "#ffffff");
    xf(cap, x, WALL_H, z, 0, rand(0, TAU), 0, 1, 0.3, 1);
    out.push(cap);
  } else if (style === "chocolate") {
    gradient(base, shade(theme.wallSide, tone - 0.08), shade(theme.wallSide, tone + 0.06));
    xf(base, x, WALL_H / 2, z);
    out.push(base);
    const icing = new RoundedBoxGeometry(CELL * 0.98, 0.016, CELL * 0.98, 1, 0.007);
    paint(icing, theme.wallTop);
    xf(icing, x, WALL_H + 0.002, z);
    out.push(icing);
    for (let k = 0; k < 2; k++) {
      const drip = new THREE.SphereGeometry(0.009, 8, 6);
      paint(drip, theme.wallTop);
      const side = Math.random() < 0.5;
      const off = rand(-0.035, 0.035);
      const edge = (Math.random() < 0.5 ? -1 : 1) * 0.049;
      xf(drip, x + (side ? edge : off), WALL_H - 0.012, z + (side ? off : edge), 0, 0, 0, 1, 1.7, 1);
      out.push(drip);
    }
    for (let k = 0; k < 3; k++) {
      const sprinkle = new THREE.BoxGeometry(0.013, 0.004, 0.004);
      paint(sprinkle, pick(["#ffffff", "#ffe066", "#69db7c", "#4dabf7", "#b197fc"]));
      xf(sprinkle, x + rand(-0.03, 0.03), WALL_H + 0.011, z + rand(-0.03, 0.03), 0, rand(0, TAU), 0);
      out.push(sprinkle);
    }
  } else {
    gradient(base, shade(theme.wallSide, tone - 0.06), shade(theme.wallTop, tone));
    xf(base, x, WALL_H / 2, z);
    out.push(base);
    if ((r + c) % 2 === 0) {
      const merlon = new RoundedBoxGeometry(0.052, 0.032, 0.052, 1, 0.005);
      gradient(merlon, theme.wallSide, theme.wallTop);
      xf(merlon, x, WALL_H + 0.016, z);
      out.push(merlon);
    }
  }
  return out;
}

function floorDecor(theme, x, z, out) {
  const cx = x + (Math.random() < 0.5 ? -1 : 1) * 0.032;
  const cz = z + (Math.random() < 0.5 ? -1 : 1) * 0.032;
  if (theme.decor === "trees") {
    if (Math.random() < 0.22) {
      const petal = pick(["#ffffff", "#ffd1e8", "#fff4a0", "#d0bfff"]);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU;
        const p = new THREE.SphereGeometry(0.0065, 6, 4);
        paint(p, petal);
        xf(p, cx + Math.cos(a) * 0.0075, 0.003, cz + Math.sin(a) * 0.0075, 0, 0, 0, 1, 0.45, 1);
        out.push(p);
      }
      const center = new THREE.SphereGeometry(0.005, 6, 4);
      paint(center, "#ffc928");
      xf(center, cx, 0.004, cz);
      out.push(center);
    } else if (Math.random() < 0.3) {
      for (let k = 0; k < 3; k++) {
        const blade = new THREE.ConeGeometry(0.0035, 0.022, 3);
        paint(blade, "#5fae45");
        xf(blade, cx + rand(-0.006, 0.006), 0.011, cz + rand(-0.006, 0.006), rand(-0.3, 0.3), 0, rand(-0.3, 0.3));
        out.push(blade);
      }
    }
  } else if (theme.decor === "candy") {
    if (Math.random() < 0.35) {
      for (let k = 0; k < 3; k++) {
        const s = new THREE.BoxGeometry(0.012, 0.003, 0.0035);
        paint(s, pick(["#ff5fa2", "#ffe066", "#69db7c", "#4dabf7", "#ffffff"]));
        xf(s, x + rand(-0.035, 0.035), 0.0015, z + rand(-0.035, 0.035), 0, rand(0, TAU), 0);
        out.push(s);
      }
    }
  } else if (theme.decor === "pines") {
    if (Math.random() < 0.14) {
      const lump = blob(0.012, 1, 0.3, Math.random() * 100);
      paint(lump, "#ffffff");
      xf(lump, cx, 0.001, cz, 0, 0, 0, 1, 0.45, 1);
      out.push(lump);
    }
  }
}

let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const canvas = makeCanvas(64, 64);
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,240,180,0.55)");
  g.addColorStop(1, "rgba(255,200,80,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  glowTex = canvasTexture(canvas);
  return glowTex;
}

const arrowTextures = new Map();
function arrowTexture(color) {
  if (arrowTextures.has(color)) return arrowTextures.get(color);
  const canvas = makeCanvas(128, 128);
  const ctx = canvas.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let k = 0; k < 2; k++) {
    const y = 40 + k * 64;
    ctx.beginPath();
    ctx.moveTo(30, y + 16);
    ctx.lineTo(64, y - 14);
    ctx.lineTo(98, y + 16);
    ctx.lineWidth = 24;
    ctx.strokeStyle = "rgba(59,53,97,0.35)";
    ctx.stroke();
    ctx.lineWidth = 14;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  const tex = canvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  arrowTextures.set(color, tex);
  return tex;
}

function portalMaterial(color, time) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: time, uColor: { value: new THREE.Color(color) } },
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
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float a = atan(p.y, p.x);
        float swirl = sin(a * 3.0 + r * 12.0 - uTime * 5.0) * 0.5 + 0.5;
        float alpha = smoothstep(1.0, 0.75, r) * (0.3 + 0.7 * swirl) * (0.6 + 0.4 * (1.0 - r));
        vec3 col = mix(uColor, vec3(1.0), swirl * (1.0 - r) * 0.7);
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
  });
}

function beamMaterial(time) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: time, uColor: { value: new THREE.Color("#ffe27a") } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float fade = pow(1.0 - vUv.y, 2.2);
        float stripes = 0.75 + 0.25 * sin(vUv.x * 40.0 + uTime * 3.0);
        float alpha = fade * stripes * (0.45 + 0.15 * sin(uTime * 4.0));
        gl_FragColor = vec4(uColor * alpha, alpha);
      }
    `,
  });
}

function keyGroup(material) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.005, 8, 20), material);
  ring.position.x = -0.02;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.007, 0.007), material);
  shaft.position.x = 0.01;
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.007), material);
  t1.position.set(0.022, -0.008, 0);
  const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.009, 0.007), material);
  t2.position.set(0.012, -0.006, 0);
  group.add(ring, shaft, t1, t2);
  for (const m of group.children) m.castShadow = HIGH;
  return group;
}

function stripedBar(length, radius, a, b) {
  const geo = new THREE.CapsuleGeometry(radius, length, 4, 10);
  xf(geo, 0, 0, 0, 0, 0, Math.PI / 2);
  const pos = geo.attributes.position;
  const data = new Float32Array(pos.count * 3);
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  for (let i = 0; i < pos.count; i++) {
    const c = Math.floor((pos.getX(i) + pos.getY(i) * 0.6 + 1) / 0.018) % 2 ? ca : cb;
    data[i * 3] = c.r;
    data[i * 3 + 1] = c.g;
    data[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(data, 3));
  return geo;
}

// Tabuleiro: raiz fixa na frente de quem joga, um grupo que inclina e o conteúdo do nível.
export function createBoard(scene, critters) {
  const root = new THREE.Group();
  root.position.set(0, EYE - 0.55, -1.1);
  root.rotation.x = 0.3;
  const tilt = new THREE.Group();
  root.add(tilt);
  const content = new THREE.Group();
  tilt.add(content);
  scene.add(root);

  const time = { value: 0 };
  const tileMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const underMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const wallMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const holeMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const iceMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.06, metalness: 0.15, envMapIntensity: 1.3 });
  const mudMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, envMapIntensity: 0.7 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffcf33,
    emissive: 0xff9a00,
    emissiveIntensity: 0.45,
    metalness: 0.55,
    roughness: 0.25,
  });
  const objMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, envMapIntensity: 0.6 });
  const portalMats = { 1: portalMaterial("#c07bff", time), 3: portalMaterial("#3fd6ff", time) };
  portalMats[2] = portalMats[1];
  portalMats[4] = portalMats[3];
  const beamMat = beamMaterial(time);
  const starGeo = starGeometry();
  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const guideMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
  const guideRing = new THREE.Mesh(new THREE.RingGeometry(0.016, 0.024, 32), guideMat);
  guideRing.rotation.x = -Math.PI / 2;
  guideRing.renderOrder = 5;
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 0.034);
  arrowShape.lineTo(-0.02, 0.008);
  arrowShape.lineTo(-0.008, 0.008);
  arrowShape.lineTo(-0.008, -0.01);
  arrowShape.lineTo(0.008, -0.01);
  arrowShape.lineTo(0.008, 0.008);
  arrowShape.lineTo(0.02, 0.008);
  arrowShape.closePath();
  const arrowGeo = new THREE.ShapeGeometry(arrowShape);
  xf(arrowGeo, 0, 0, -(BALL_R + 0.024), -Math.PI / 2, 0, 0);
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const guideArrow = new THREE.Mesh(arrowGeo, arrowMat);
  guideArrow.renderOrder = 5;
  tilt.add(guideRing, guideArrow);

  let parts = null;
  let perBuild = [];
  let appear = 1;
  let appearing = 0;
  let cheer = 0;

  function setEnv(texture) {
    for (const m of [iceMat, mudMat, goldMat, objMat]) {
      m.envMap = texture;
      m.needsUpdate = true;
    }
  }

  function clear() {
    if (parts?.friend) critters.release(parts.friend);
    content.traverse((o) => {
      if (o.geometry && !o.isSprite && o.geometry !== starGeo) o.geometry.dispose();
    });
    content.clear();
    for (const m of perBuild) m.dispose();
    perBuild = [];
    parts = null;
  }

  function addMerged(list, material, { cast = false, receive = false } = {}) {
    if (!list.length) return null;
    const mesh = new THREE.Mesh(mergeAll(list), material);
    mesh.castShadow = cast && HIGH;
    mesh.receiveShadow = receive && HIGH;
    content.add(mesh);
    for (const g of list) g.dispose();
    return mesh;
  }

  function own(material) {
    perBuild.push(material);
    return material;
  }

  function build(L, theme, map, { friend = null } = {}) {
    clear();
    const tiles = [];
    const unders = [];
    const walls = [];
    const decor = [];
    const ice = [];
    const mud = [];
    const holeIn = [];
    const boosts = [];
    const dist = distanceToVoid(L);
    for (let r = 0; r < L.rows; r++) {
      for (let c = 0; c < L.cols; c++) {
        const i = r * L.cols + c;
        const type = L.cells[i];
        if (type === T.VOID) continue;
        const x = L.cx(c);
        const z = L.cz(r);
        const dv = dist[i];
        const depth = 0.035 + 0.055 * Math.min(dv, 3) + rand(0, 0.025);
        const chunk = new THREE.BoxGeometry(CELL, depth, CELL);
        xf(chunk, x, -TILE_H - depth / 2 + 0.001, z);
        colorByY(chunk, theme.underTop, theme.underBottom, -TILE_H, -0.3);
        unders.push(chunk);
        if (dv >= 2 && Math.random() < 0.55) {
          const len = depth * 0.8 + 0.04;
          const tip = new THREE.ConeGeometry(CELL * 0.45, len, 5);
          xf(tip, x, -TILE_H - depth - len / 2 + 0.003, z, Math.PI, rand(0, TAU), 0);
          colorByY(tip, theme.underTop, theme.underBottom, -TILE_H, -0.3);
          unders.push(tip);
        }
        const checker = (r + c) % 2 === 0 ? theme.floorA : theme.floorB;
        if (type === T.HOLE || type === T.GOAL) {
          tiles.push(holeTile(x, z, checker, theme.floorSide));
          holeIn.push(...holeInside(x, z));
        } else if (type === T.ICE) {
          ice.push(tileGeo(x, z, shade(theme.ice, rand(-0.03, 0.03)), theme.floorSide));
          if (Math.random() < 0.5) {
            const streak = new THREE.PlaneGeometry(0.05, 0.005);
            paint(streak, "#ffffff");
            xf(streak, x + rand(-0.02, 0.02), 0.0012, z + rand(-0.02, 0.02), -Math.PI / 2, 0, rand(0, TAU));
            ice.push(streak);
          }
        } else if (type === T.MUD) {
          mud.push(tileGeo(x, z, shade(theme.mud, rand(-0.03, 0.03)), theme.floorSide));
          for (let k = 0; k < 2; k++) {
            const bubble = new THREE.SphereGeometry(rand(0.006, 0.011), 8, 6);
            paint(bubble, shade(theme.mud, 0.08));
            xf(bubble, x + rand(-0.035, 0.035), 0, z + rand(-0.035, 0.035), 0, 0, 0, 1, 0.45, 1);
            mud.push(bubble);
          }
        } else {
          tiles.push(tileGeo(x, z, checker, theme.floorSide));
        }
        if (type === T.BOOST) {
          const plane = new THREE.PlaneGeometry(CELL * 0.86, CELL * 0.86);
          const dx = L.boost[i * 2];
          const dz = L.boost[i * 2 + 1];
          xf(plane, 0, 0, 0, -Math.PI / 2, 0, 0);
          xf(plane, x, 0.0015, z, 0, Math.atan2(-dx, -dz), 0);
          boosts.push(plane);
        }
        if (type === T.WALL) walls.push(...wallBlock(theme, x, z, r, c));
        if (map[r][c] === ".") floorDecor(theme, x, z, decor);
      }
    }
    addMerged(unders, underMat);
    addMerged(tiles, tileMat, { receive: true });
    addMerged(decor, tileMat);
    addMerged(walls, wallMat, { cast: true, receive: true });
    addMerged(ice, iceMat, { receive: true });
    addMerged(mud, mudMat, { receive: true });
    addMerged(holeIn, holeMat);
    let boostMesh = null;
    if (boosts.length) {
      const tex = arrowTexture(theme.accent);
      const mat = own(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
      boostMesh = new THREE.Mesh(mergeAll(boosts, ["position", "normal", "uv"]), mat);
      boostMesh.renderOrder = 1;
      content.add(boostMesh);
    }

    const stars = L.stars.map((s, k) => {
      const mesh = new THREE.Mesh(starGeo, goldMat);
      mesh.scale.setScalar(0.11);
      mesh.position.set(s.x, 0.045, s.z);
      mesh.rotation.y = k;
      mesh.castShadow = HIGH;
      const glow = new THREE.Sprite(glowMat);
      glow.scale.setScalar(0.85);
      glow.renderOrder = 4;
      mesh.add(glow);
      content.add(mesh);
      return mesh;
    });

    const keys = L.keys.map((k) => {
      const g = keyGroup(goldMat);
      g.position.set(k.x, 0.04, k.z);
      const glow = new THREE.Sprite(glowMat);
      glow.scale.setScalar(0.09);
      g.add(glow);
      content.add(g);
      return g;
    });

    const doors = L.doors.map((d) => {
      const geo = new RoundedBoxGeometry(CELL * 0.96, WALL_H, CELL * 0.96, 2, 0.012);
      gradient(geo, shade(theme.accent, -0.15), shade(theme.accent, 0.08));
      const hole = new THREE.CircleGeometry(0.011, 14);
      paint(hole, "#3b3561");
      xf(hole, 0, 0.008, CELL * 0.48 + 0.001);
      const slot = new THREE.PlaneGeometry(0.008, 0.02);
      paint(slot, "#3b3561");
      xf(slot, 0, -0.006, CELL * 0.48 + 0.001);
      const mesh = new THREE.Mesh(mergeAll([geo, hole, slot]), objMat);
      mesh.position.set(d.x, WALL_H / 2, d.z);
      mesh.castShadow = HIGH;
      mesh.userData.sink = 0;
      content.add(mesh);
      return mesh;
    });

    const bumpers = L.bumpers.map((b) => {
      const mat = own(new THREE.MeshStandardMaterial({ color: theme.bumper, roughness: 0.25, emissive: theme.bumper, emissiveIntensity: 0.15 }));
      const group = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.036, 0.014, 20), objMat);
      paint(base.geometry, "#ffffff");
      base.position.y = 0.007;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 12, 0, TAU, 0, Math.PI / 2), mat);
      dome.scale.y = 1.1;
      dome.position.y = 0.012;
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 24), objMat);
      paint(band.geometry, "#ffe066");
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.016;
      group.add(base, dome, band);
      group.position.set(b.x, 0, b.z);
      for (const m of group.children) m.castShadow = HIGH;
      content.add(group);
      return { group, mat, flash: 0 };
    });

    const checks = L.checks.map((ck) => {
      const group = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.13, 6), objMat);
      paint(pole.geometry, "#ffffff");
      pole.position.y = 0.065;
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 8), goldMat);
      knob.position.y = 0.132;
      const flagMat = own(new THREE.MeshLambertMaterial({ color: "#b8b3c9", side: THREE.DoubleSide }));
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.055, -0.016);
      shape.lineTo(0, -0.034);
      shape.closePath();
      const flag = new THREE.Mesh(new THREE.ShapeGeometry(shape), flagMat);
      flag.position.set(0.002, 0.125, 0);
      group.add(pole, knob, flag);
      group.position.set(ck.x - 0.03, 0, ck.z - 0.03);
      content.add(group);
      return { flag, mat: flagMat, wave: 0 };
    });

    const portals = L.portals.map((p) => {
      const color = p.ch === "1" || p.ch === "2" ? "#c07bff" : "#3fd6ff";
      const group = new THREE.Group();
      const ringMat = own(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.3 }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.007, 8, 28), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.004;
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.036, 28), portalMats[p.ch]);
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.002;
      disc.renderOrder = 3;
      group.add(ring, disc);
      group.position.set(p.x, 0, p.z);
      content.add(group);
      return { group, disc };
    });

    const stripeA = theme.wall === "stone" ? "#ffd34d" : theme.accent;
    const spinners = L.spinners.map((s) => {
      const group = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.06, 12), objMat);
      paint(post.geometry, "#ffffff");
      post.position.y = 0.03;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.018, 14, 10), goldMat);
      cap.position.y = 0.062;
      const bar = new THREE.Mesh(stripedBar(s.arm * 2, s.thick, stripeA, "#ffffff"), objMat);
      bar.position.y = BALL_R;
      group.add(post, cap, bar);
      group.position.set(s.x, 0, s.z);
      for (const m of group.children) m.castShadow = HIGH;
      content.add(group);
      return group;
    });

    const sliders = L.sliders.map((s) => {
      const geo = new RoundedBoxGeometry(s.hw * 2, 0.06, s.hh * 2, 2, 0.012);
      gradient(geo, shade(theme.wallSide, -0.05), theme.wallTop);
      const parts2 = [geo];
      for (const side of [-1, 1]) {
        const eye = new THREE.SphereGeometry(0.008, 10, 8);
        paint(eye, "#2a2340");
        xf(eye, side * 0.016, 0.008, s.hh + 0.001, 0, 0, 0, 1, 1.2, 0.5);
        const shine = new THREE.SphereGeometry(0.003, 6, 4);
        paint(shine, "#ffffff");
        xf(shine, side * 0.016 - 0.003, 0.012, s.hh + 0.004);
        parts2.push(eye, shine);
      }
      const cheek = new THREE.SphereGeometry(0.007, 8, 6);
      paint(cheek, "#ff9db8");
      xf(cheek, 0, -0.008, s.hh + 0.001, 0, 0, 0, 2.4, 0.5, 0.3);
      parts2.push(cheek);
      const mesh = new THREE.Mesh(mergeAll(parts2), objMat);
      mesh.position.set(s.x, 0.03, s.z);
      mesh.castShadow = HIGH;
      content.add(mesh);
      return mesh;
    });

    const goalRing = new THREE.Mesh(new THREE.TorusGeometry(HOLE_R + 0.005, 0.006, 8, 32), goldMat);
    goalRing.rotation.x = Math.PI / 2;
    goalRing.position.set(L.goal.x, 0.003, L.goal.z);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(HOLE_R, HOLE_R * 1.25, 0.28, 24, 1, true), beamMat);
    beam.position.set(L.goal.x, 0.14, L.goal.z);
    beam.renderOrder = 4;
    const goalGlow = new THREE.Mesh(
      new THREE.CircleGeometry(HOLE_R * 0.95, 20),
      own(new THREE.MeshBasicMaterial({ color: "#ffe27a", toneMapped: false })),
    );
    goalGlow.rotation.x = -Math.PI / 2;
    goalGlow.position.set(L.goal.x, -0.025, L.goal.z);
    content.add(goalRing, beam, goalGlow);

    let friendMesh = null;
    let friendBase = 0;
    if (friend) {
      friendMesh = critters.make(friend);
      friendMesh.scale.setScalar(0.065);
      const spot = friendSpot(L);
      friendBase = spot.y;
      friendMesh.position.set(spot.x, spot.y, spot.z);
      friendMesh.rotation.y = spot.face;
      friendMesh.castShadow = HIGH;
      content.add(friendMesh);
    }

    parts = { stars, keys, doors, bumpers, checks, portals, spinners, sliders, goalRing, beam, boostMesh, friend: friendMesh, friendBase };
    cheer = 0;
    content.scale.setScalar(0.001);
    appear = 0;
    appearing = 1;
  }

  // Lugar do amiguinho perto da toca: em cima de uma parede vizinha ou no chão ao lado.
  function friendSpot(L) {
    const { r, c } = L.goal;
    const around = [
      [-1, 0],
      [0, -1],
      [0, 1],
      [1, 0],
      [-1, -1],
      [-1, 1],
    ];
    for (const [dr, dc] of around) {
      const t = L.cells[(r + dr) * L.cols + (c + dc)];
      if (r + dr >= 0 && c + dc >= 0 && r + dr < L.rows && c + dc < L.cols && t === T.WALL) {
        return { x: L.cx(c + dc), z: L.cz(r + dr), y: WALL_H + 0.06 * 0.62, face: Math.atan2(L.cx(c) - L.cx(c + dc), 1.2) };
      }
    }
    for (const [dr, dc] of around) {
      const rr = r + dr;
      const cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= L.rows || cc >= L.cols) continue;
      if (L.cells[rr * L.cols + cc] !== T.VOID) {
        return { x: (L.cx(cc) + L.cx(c)) / 2 + (L.cx(cc) - L.cx(c)) * 0.3, z: (L.cz(rr) + L.cz(r)) / 2 + (L.cz(rr) - L.cz(r)) * 0.3, y: 0.06 * 0.62, face: 0 };
      }
    }
    return { x: L.goal.x, z: L.goal.z - CELL, y: 0.04, face: 0 };
  }

  function setTilt(ax, az) {
    tilt.rotation.set(az * MAX_TILT, 0, -ax * MAX_TILT);
  }

  function setGuide(show, gx, gz, ball, ax, az) {
    guideRing.visible = show;
    if (show) guideRing.position.set(gx, 0.003, gz);
    const mag = Math.min(1, Math.hypot(ax, az));
    guideArrow.visible = mag > 0.05;
    if (guideArrow.visible) {
      guideArrow.position.set(ball.x, 0.003, ball.z);
      guideArrow.rotation.y = Math.atan2(-ax, -az);
      arrowMat.opacity = 0.25 + mag * 0.65;
      guideArrow.scale.setScalar(0.7 + mag * 0.5);
    }
  }

  function hideGuide() {
    guideRing.visible = false;
    guideArrow.visible = false;
  }

  function project(origin, dir, out) {
    root.updateMatrixWorld();
    inv.copy(root.matrixWorld).invert();
    rayO.copy(origin).applyMatrix4(inv);
    rayD.copy(dir).transformDirection(inv);
    if (rayD.y > -1e-4) return false;
    const t = -rayO.y / rayD.y;
    out.x = rayO.x + rayD.x * t;
    out.z = rayO.z + rayD.z * t;
    return true;
  }

  function toWorld(x, y, z, out) {
    tilt.updateWorldMatrix(true, false);
    return tilt.localToWorld(out.set(x, y, z));
  }

  function hideStar(i) {
    if (parts?.stars[i]) parts.stars[i].visible = false;
  }

  function hideKey(i) {
    if (parts?.keys[i]) parts.keys[i].visible = false;
  }

  function bump(i) {
    if (parts?.bumpers[i]) parts.bumpers[i].flash = 1;
  }

  function lightCheck(i, color) {
    const ck = parts?.checks[i];
    if (!ck) return;
    ck.mat.color.set(color);
    ck.wave = 1;
  }

  function celebrate() {
    cheer = 0.001;
  }

  function vanish() {
    appearing = -1;
  }

  function update(dt, L) {
    time.value += dt;
    if (appearing !== 0) {
      appear = Math.min(1, Math.max(0, appear + appearing * dt * (appearing > 0 ? 1.4 : 2.2)));
      const s = appearing > 0 ? easeOutBack(appear) : appear;
      content.scale.setScalar(Math.max(0.001, s));
      content.position.y = (1 - appear) * (appearing > 0 ? 0.25 : -0.1);
      if ((appearing > 0 && appear >= 1) || (appearing < 0 && appear <= 0)) appearing = 0;
    }
    if (!parts || !L) return;
    const t = time.value;
    parts.stars.forEach((m, i) => {
      if (!m.visible) return;
      m.rotation.y += dt * 2.2;
      m.position.y = 0.045 + Math.sin(t * 2.4 + i) * 0.006;
    });
    parts.keys.forEach((g, i) => {
      if (!g.visible) return;
      g.rotation.y += dt * 2;
      g.position.y = 0.042 + Math.sin(t * 2.2 + i) * 0.006;
    });
    parts.doors.forEach((m, i) => {
      if (!L.doors[i].open || !m.visible) return;
      m.userData.sink = Math.min(1, m.userData.sink + dt * 1.6);
      m.position.y = WALL_H / 2 - m.userData.sink * (WALL_H + 0.01);
      if (m.userData.sink >= 1) m.visible = false;
    });
    for (const b of parts.bumpers) {
      b.flash = Math.max(0, b.flash - dt * 5);
      b.group.scale.set(1 + b.flash * 0.25, 1 - b.flash * 0.2, 1 + b.flash * 0.25);
      b.mat.emissiveIntensity = 0.15 + b.flash * 1.2;
    }
    for (const ck of parts.checks) {
      ck.wave = Math.max(0, ck.wave - dt);
      ck.flag.rotation.y = Math.sin(t * 3) * 0.25 + Math.sin(ck.wave * 20) * ck.wave * 0.8;
    }
    for (const p of parts.portals) p.disc.rotation.z += dt * 2;
    parts.spinners.forEach((g, i) => {
      g.rotation.y = L.spinners[i].angle;
    });
    parts.sliders.forEach((m, i) => {
      m.position.set(L.sliders[i].x, 0.03, L.sliders[i].z);
    });
    if (parts.boostMesh) parts.boostMesh.material.map.offset.y -= dt * 0.9;
    parts.goalRing.rotation.z += dt * 1.5;
    const f = parts.friend;
    if (f) {
      if (cheer > 0) {
        cheer += dt;
        f.position.y = parts.friendBase + Math.abs(Math.sin(cheer * 9)) * 0.04;
        f.rotation.y += dt * 6;
      } else {
        f.position.y = parts.friendBase + Math.abs(Math.sin(t * 2.5)) * 0.004;
      }
    }
  }

  return {
    root,
    tilt,
    content,
    build,
    clear,
    setEnv,
    setTilt,
    setGuide,
    hideGuide,
    project,
    toWorld,
    hideStar,
    hideKey,
    bump,
    lightCheck,
    celebrate,
    vanish,
    update,
    get parts() {
      return parts;
    },
  };
}
