import * as THREE from "three";
import { HIGH } from "../shared/quality.js";
import { TAU, canvasTexture, clamp01, easeOutBack, makeCanvas, mergeAll, paint, rand, smoothstep, xf } from "../shared/util.js";
import { EYE } from "../shared/vr.js";
import { time } from "./world.js";

// Tipos de fantasminha. Para um tipo novo: uma entrada aqui, o jeito de andar em move() e a voz em voice().
export const TYPES = {
  bolota: { color: "#eaf2ff", dark: "#7f93d6", size: 1, dwell: 0.6, speed: 1 },
  pipoca: { color: "#fff1bf", dark: "#a99a6a", size: 0.85, dwell: 0.55, speed: 1.05 },
  sorrateiro: { color: "#dccfff", dark: "#6d5fae", size: 0.95, dwell: 0.6, speed: 1, sneaky: true },
  timida: { color: "#ffd3e8", dark: "#a8708f", size: 0.85, dwell: 0.5, speed: 1 },
  sombra: { color: "#b9a8ff", dark: "#1c1f44", size: 1, dwell: 0.9, speed: 1.15, sneaky: true },
  soneca: { color: "#eef8ff", dark: "#8296cf", size: 1.9, dwell: 2.5, speed: 1 },
};

// Caras no atlas (uma por célula de 256 px).
const FACE = { escuro: 0, fofo: 1, riso: 2, buu: 3, sombra: 4, sono: 5, bobo: 6 };
const CELLS = 8;
const MAX = 10;
const VIEW = 0.75;
const INK = "#15132b";

const toGhost = new THREE.Vector3();
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const CANDY_HAND = new THREE.Vector3(0.3, -0.02, 0.3);

function faceAtlas() {
  const canvas = makeCanvas(256 * CELLS, 256);
  const ctx = canvas.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  function ellipse(x, y, rx, ry, color, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function glow(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(0.45, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  function cheeks(cx) {
    for (const side of [-1, 1]) ellipse(cx + side * 76, 148, 19, 10, "rgba(255,130,180,0.75)");
  }
  // Olhos fundos e boca em "O": o fantasma clássico, com um brilho fraco no fundo dos olhos.
  function hollow(cx, pupil, narrow = 1) {
    for (const side of [-1, 1]) ellipse(cx + side * 46, 100, 25, 36 * narrow, INK, side * 0.12);
    for (const side of [-1, 1]) glow(cx + side * 46, 108, 13, pupil);
    ellipse(cx, 180, 19, 27, INK);
  }

  let cx = 128;
  hollow(cx, "rgba(200,225,255,0.95)");

  cx += 256;
  for (const side of [-1, 1]) {
    ellipse(cx + side * 44, 104, 22, 26, INK);
    ellipse(cx + side * 44 - 8, 94, 8, 8, "#ffffff");
    ellipse(cx + side * 44 + 7, 114, 4, 4, "#ffffff");
  }
  cheeks(cx);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, 146, 22, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  cx += 256;
  ctx.lineWidth = 9;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + side * 44, 116, 20, 1.12 * Math.PI, 1.88 * Math.PI);
    ctx.stroke();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, 150, 34, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = "#5b1830";
  ctx.fill();
  ctx.clip();
  ellipse(cx, 178, 19, 11, "#ff7aa8");
  ctx.restore();
  cheeks(cx);

  cx += 256;
  for (const side of [-1, 1]) {
    ellipse(cx + side * 46, 98, 31, 31, INK);
    ellipse(cx + side * 46, 98, 25, 25, "#ffffff");
    ellipse(cx + side * 46, 104, 9, 9, INK);
  }
  ctx.lineWidth = 9;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + side * 18, 56);
    ctx.lineTo(cx + side * 72, 64);
    ctx.stroke();
  }
  ellipse(cx, 186, 46, 48, INK);
  ellipse(cx, 198, 33, 29, "#5b1830");

  cx += 256;
  hollow(cx, "rgba(255,226,102,1)", 0.82);

  cx += 256;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + side * 44, 106, 22, 20, 0, 0, Math.PI);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx + side * 44 - 26, 106);
    ctx.lineTo(cx + side * 44 + 26, 106);
    ctx.stroke();
  }
  ellipse(cx, 168, 13, 17, INK);
  cheeks(cx);

  cx += 256;
  for (const side of [-1, 1]) {
    ellipse(cx + side * 44, 100, 26, 26, INK);
    ellipse(cx + side * 44, 100, 21, 21, "#ffffff");
    ellipse(cx + side * 44 - side * 9, 104, 9, 9, INK);
  }
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, 146, 26, 0.12 * Math.PI, 0.88 * Math.PI);
  ctx.stroke();
  ellipse(cx + 6, 182, 15, 20, "#ff7aa8");
  ctx.strokeStyle = "#d94f84";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 6, 168);
  ctx.lineTo(cx + 6, 194);
  ctx.stroke();
  cheeks(cx);

  const texture = canvasTexture(canvas);
  texture.anisotropy = 2;
  return texture;
}

// Corpo: cabeça redonda que vira uma saia rodada (a barra ondula no shader), com dois bracinhos.
function bodyGeometry() {
  const profile = [
    [0.5, -0.36],
    [0.53, -0.33],
    [0.49, -0.22],
    [0.46, -0.08],
    [0.45, 0.06],
    [0.45, 0.2],
    [0.43, 0.34],
    [0.38, 0.46],
    [0.29, 0.55],
    [0.16, 0.61],
    [0.0, 0.63],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.LatheGeometry(profile, HIGH ? 30 : 20);
  paint(body, "#ffffff");
  const parts = [body];
  for (const side of [-1, 1]) {
    const arm = new THREE.SphereGeometry(0.11, 10, 8);
    paint(arm, "#ffffff");
    xf(arm, 0, 0, 0, 0, 0, side * 0.6, 0.75, 1.25, 0.75);
    xf(arm, side * 0.47, 0.04, 0.08);
    parts.push(arm);
  }
  return mergeAll(parts);
}

function bowGeometry() {
  const parts = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.ConeGeometry(0.07, 0.13, 8);
    paint(wing, "#ff6fb5");
    xf(wing, side * 0.07, 0, 0, 0, 0, side * -Math.PI / 2);
    parts.push(wing);
  }
  const knot = new THREE.SphereGeometry(0.035, 8, 6);
  paint(knot, "#ff9fd0");
  parts.push(knot);
  const geo = mergeAll(parts);
  xf(geo, 0.2, 0.52, 0.16, 0.2, 0, -0.35);
  return geo;
}

function capGeometry() {
  const parts = [];
  const cone = new THREE.ConeGeometry(0.3, 0.6, 16);
  paint(cone, "#7b62d6");
  xf(cone, 0, 0.3, 0);
  parts.push(cone);
  const band = new THREE.TorusGeometry(0.29, 0.05, 6, 20);
  paint(band, "#f3eeff");
  xf(band, 0, 0.02, 0, Math.PI / 2, 0, 0);
  parts.push(band);
  const pom = new THREE.SphereGeometry(0.075, 10, 8);
  paint(pom, "#ffffff");
  xf(pom, 0, 0.62, 0);
  parts.push(pom);
  const geo = mergeAll(parts);
  xf(geo, 0.04, 0.5, -0.02, 0, 0, -0.5);
  return geo;
}

const bodyVertex = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uWiggle;
varying vec3 vN;
varying vec3 vW;
#include <fog_pars_vertex>
void main() {
  vec3 p = position;
  float hem = smoothstep(0.02, -0.34, p.y);
  float ang = atan(p.z, p.x);
  p.y += sin(ang * 6.0 + uTime * 4.0 + uSeed) * 0.045 * hem;
  p.xz *= 1.0 + sin(ang * 3.0 - uTime * 2.6 + uSeed * 1.7) * 0.05 * hem + uWiggle * 0.05 * sin(uTime * 30.0 + p.y * 9.0);
  vec4 w = modelMatrix * vec4(p, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const bodyFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uDark;
uniform vec3 uWarm;
uniform float uLit;
uniform float uAlpha;
uniform float uGhostly;
varying vec3 vN;
varying vec3 vW;
#include <fog_pars_fragment>
void main() {
  vec3 N = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.2);
  float top = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 dark = uDark * (0.45 + 0.35 * top) + vec3(0.55, 0.68, 1.0) * fres * 0.9;
  vec3 lit = uColor * (0.82 + 0.25 * top) + uWarm * 0.18 + vec3(1.0) * fres * 0.22;
  vec3 col = mix(dark, lit, uLit);
  float darkAlpha = mix(0.62 + fres * 0.3, 0.3 + fres * 0.55, uGhostly);
  float a = mix(darkAlpha, 0.95, uLit) * uAlpha;
  if (!gl_FrontFacing) a *= 0.35;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

const faceVertex = /* glsl */ `
varying vec2 vUv;
#include <fog_pars_vertex>
void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const faceFragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uA;
uniform float uB;
uniform float uMix;
uniform float uAlpha;
varying vec2 vUv;
#include <fog_pars_fragment>
void main() {
  vec4 a = texture2D(uMap, vec2((vUv.x + uA) / ${CELLS.toFixed(1)}, vUv.y));
  vec4 b = texture2D(uMap, vec2((vUv.x + uB) / ${CELLS.toFixed(1)}, vUv.y));
  vec4 c = mix(a, b, uMix);
  gl_FragColor = vec4(c.rgb, c.a * uAlpha);
  #include <colorspace_fragment>
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    // Os olhos brilham um pouco através da névoa.
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor * 0.6);
  #endif
}
`;

// Para um comportamento novo: um estado em update() (os nomes estão no topo de cada bloco).
export function createGhosts(scene, { audio, lantern, makeCandy }) {
  const bodyGeo = bodyGeometry();
  const faceGeo = new THREE.PlaneGeometry(0.66, 0.66);
  const atlas = faceAtlas();
  const bowGeo = bowGeometry();
  const capGeo = capGeometry();
  const accMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const pool = [];
  let handlers = {};

  for (let i = 0; i < MAX; i++) {
    const bodyU = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uColor: { value: new THREE.Color() },
        uDark: { value: new THREE.Color() },
        uWarm: { value: new THREE.Color("#ffc27a") },
        uLit: { value: 0 },
        uAlpha: { value: 0 },
        uGhostly: { value: 1 },
        uSeed: { value: rand(0, 100) },
        uWiggle: { value: 0 },
      },
    ]);
    bodyU.uTime = time;
    const body = new THREE.Mesh(
      bodyGeo,
      new THREE.ShaderMaterial({
        uniforms: bodyU,
        vertexShader: bodyVertex,
        fragmentShader: bodyFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: true,
      }),
    );
    body.renderOrder = 3;
    const faceU = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      { uA: { value: 0 }, uB: { value: 0 }, uMix: { value: 0 }, uAlpha: { value: 0 } },
    ]);
    faceU.uMap = { value: atlas };
    const face = new THREE.Mesh(
      faceGeo,
      new THREE.ShaderMaterial({
        uniforms: faceU,
        vertexShader: faceVertex,
        fragmentShader: faceFragment,
        transparent: true,
        depthWrite: false,
        fog: true,
      }),
    );
    face.position.set(0, 0.2, 0.43);
    face.renderOrder = 4;
    const bow = new THREE.Mesh(bowGeo, accMat);
    const cap = new THREE.Mesh(capGeo, accMat);
    const group = new THREE.Group();
    group.add(body, face, bow, cap);
    group.visible = false;
    scene.add(group);
    pool.push({
      active: false,
      group,
      body,
      face,
      bow,
      cap,
      bodyU,
      faceU,
      candy: null,
      type: "bolota",
      def: TYPES.bolota,
      state: "off",
      t: 0,
      age: 0,
      a: 0,
      r: 10,
      y: EYE,
      baseY: EYE,
      speed: 1,
      approach: 10,
      tickle: 0,
      lit: 0,
      alpha: 0,
      inView: false,
      seen: false,
      seed: rand(0, 100),
      hop: 0,
      tree: null,
      side: 1,
      peeks: 0,
      nextVoice: 0,
      nextGiggle: 0,
      spot: null,
      carrying: -1,
      pos: new THREE.Vector3(),
      from: new THREE.Vector3(),
      to: new THREE.Vector3(),
      out: new THREE.Vector3(),
      pop: 0,
      faceFrom: 0,
      faceTo: 0,
      faceMix: 1,
      boo: 0,
      split: false,
    });
  }

  function polar(g, out) {
    return out.set(-Math.sin(g.a) * g.r, g.y, -Math.cos(g.a) * g.r);
  }

  // Troca de cara com transição (duas células do atlas misturadas).
  function setFace(g, want, rate, dt) {
    if (want !== g.faceTo) {
      if (want === g.faceFrom) {
        g.faceFrom = g.faceTo;
        g.faceMix = 1 - g.faceMix;
      } else {
        g.faceFrom = g.faceMix > 0.5 ? g.faceTo : g.faceFrom;
        g.faceMix = 0;
      }
      g.faceTo = want;
    }
    g.faceMix = Math.min(1, g.faceMix + dt * rate);
    g.faceU.uA.value = g.faceFrom;
    g.faceU.uB.value = g.faceTo;
    g.faceU.uMix.value = g.faceMix;
  }

  function darkFace(g, level) {
    if (g.type === "soneca") return FACE.sono;
    if (!level.scary) return FACE.fofo;
    return g.type === "sombra" ? FACE.sombra : FACE.escuro;
  }

  function spawn(type, { angle = 0, dist = 11.5, height = rand(EYE - 0.15, EYE + 0.35), approach = 11, tree = null, level } = {}) {
    const g = pool.find((x) => !x.active);
    if (!g) return null;
    const def = TYPES[type];
    g.active = true;
    g.type = type;
    g.def = def;
    g.a = angle;
    g.r = dist;
    g.y = height;
    g.baseY = height;
    g.approach = approach;
    g.speed = ((dist - 1.5) / approach) * def.speed;
    g.state = tree ? "hide" : "enter";
    g.tree = tree;
    g.side = Math.random() < 0.5 ? -1 : 1;
    g.peeks = 0;
    g.t = 0;
    g.age = 0;
    g.tickle = 0;
    g.lit = 0;
    g.alpha = 0;
    g.inView = false;
    g.seen = false;
    g.hop = 0;
    g.pop = 0;
    g.boo = 0;
    g.split = false;
    g.carrying = -1;
    g.nextVoice = rand(0.3, 1.2);
    g.nextGiggle = 0;
    g.bodyU.uColor.value.set(def.color);
    g.bodyU.uDark.value.set(def.dark);
    g.bodyU.uGhostly.value = level?.scary ? 1 : 0.35;
    const face = level ? darkFace(g, level) : FACE.fofo;
    g.faceFrom = face;
    g.faceTo = face;
    g.faceMix = 1;
    g.bow.visible = type === "timida";
    g.cap.visible = type === "soneca";
    if (g.candy) g.candy.visible = false;
    if (tree) {
      tmp.set(tree.x, 0, tree.z).normalize();
      g.pos.set(tree.x + tmp.x * 0.75, 1.05, tree.z + tmp.z * 0.75);
    } else polar(g, g.pos);
    g.group.position.copy(g.pos);
    g.group.scale.setScalar(0.001);
    g.group.visible = true;
    g.spot = audio.spot();
    audio.place(g.spot, g.pos, 0.5);
    if (!def.sneaky && !tree) audio.plim(g.spot);
    return g;
  }

  function remove(g) {
    g.active = false;
    g.state = "off";
    g.group.visible = false;
    if (g.candy) g.candy.visible = false;
    audio.release(g.spot);
    g.spot = null;
  }

  function poof(g, ctx) {
    handlers.poof?.(g);
    if (g.carrying >= 0) handlers.recover?.(g);
    if (g.type === "soneca" && !g.split) {
      g.split = true;
      handlers.split?.(g);
    }
    remove(g);
  }

  // Volta a andar em linha reta a partir de onde está (depois de se esconder, por exemplo).
  function resume(g, approach) {
    g.a = Math.atan2(-g.pos.x, -g.pos.z);
    g.r = Math.hypot(g.pos.x, g.pos.z);
    g.y = g.pos.y;
    g.baseY = g.pos.y;
    g.speed = (Math.max(0.5, g.r - 1.5) / approach) * g.def.speed;
    g.state = "move";
    g.t = 0;
  }

  function voice(g, dt) {
    g.nextVoice -= dt;
    if (g.nextVoice > 0) return;
    const near = 0.55 + 0.45 * clamp01(g.r / 10);
    switch (g.type) {
      case "bolota":
        audio.hum(g.spot, 0.9 + (g.seed % 1) * 0.25);
        g.nextVoice = rand(1.6, 2.2) * near;
        break;
      case "pipoca":
        audio.giggle(g.spot, 0.2);
        g.nextVoice = rand(2.2, 3) * near;
        break;
      case "sorrateiro":
        audio.rustle(g.spot);
        if (g.r < 4.5) audio.whisper(g.spot);
        g.nextVoice = g.r < 4.5 ? rand(0.9, 1.3) : rand(0.45, 0.6);
        break;
      case "timida":
        audio.shy(g.spot);
        g.nextVoice = rand(2.2, 2.8) * near;
        break;
      case "sombra":
        audio.whoosh(g.spot, 0.05);
        g.nextVoice = rand(1, 1.3);
        break;
      case "soneca":
        audio.snore(g.spot);
        g.nextVoice = 2.7;
        break;
      default:
        g.nextVoice = 2;
    }
  }

  // Anda na direção dela, cada tipo do seu jeito. Devolve true quando chegou perto.
  function move(g, dt, ctx) {
    const stop = ctx.level.boo > 0 ? ctx.level.boo : 1.4;
    let step = g.speed * dt;
    if (g.type === "sombra" && g.inView) step = 0;
    g.r = Math.max(stop, g.r - step);
    if (g.type === "pipoca") {
      const before = Math.floor(g.hop);
      g.hop += dt * 2.1;
      if (Math.floor(g.hop) !== before) audio.boing(g.spot);
      g.a += Math.sin(g.age * 1.7 + g.seed) * 0.22 * dt;
    } else g.a += Math.sin(g.age * 0.6 + g.seed) * 0.05 * dt;
    const settle = smoothstep(6, 2.2, g.r);
    const hop = g.type === "pipoca" ? Math.abs(Math.sin(g.hop * Math.PI)) * 0.5 * (1 - settle * 0.6) : 0;
    g.y = g.baseY + (EYE - 0.05 - g.baseY) * settle;
    polar(g, g.pos);
    g.pos.y += hop + Math.sin(g.age * 2.1 + g.seed) * 0.06;
    if (g.type !== "sombra" || !g.inView) voice(g, dt);
    return g.r <= stop + 0.02;
  }

  function startBoo(g, ctx) {
    g.state = "swoop";
    g.t = 0;
    g.from.copy(g.pos);
    const side = Math.random() < 0.5 ? -1 : 1;
    const yaw = ctx.gazeYaw + side * 0.62;
    const d = ctx.level.boo;
    g.to.set(ctx.head.position.x - Math.sin(yaw) * d, EYE - 0.02, ctx.head.position.z - Math.cos(yaw) * d);
  }

  function startGrab(g, ctx) {
    g.state = "grab";
    g.t = 0;
    g.from.copy(g.pos);
    g.to.copy(ctx.basketPos);
    g.to.y += 0.3;
  }

  // Foge para trás dela (para um lado ou outro): para pegar o brigadeiro de volta, ela precisa virar.
  function startFlee(g, ctx) {
    g.state = "flee";
    g.t = 0;
    const a = ctx.gazeYaw + Math.PI + rand(-0.9, 0.9);
    g.out.set(-Math.sin(a), 0, -Math.cos(a));
  }

  function update(dt, ctx) {
    const { head, gaze, level } = ctx;
    for (const g of pool) {
      if (!g.active) continue;
      g.t += dt;
      g.age += dt;
      toGhost.copy(g.pos).sub(head.position);
      const dist = toGhost.length();
      const facing = dist > 1e-4 ? toGhost.dot(gaze) / dist : 1;
      g.inView = facing > Math.cos(VIEW);
      if (g.inView) g.seen = true;
      let litable = false;
      let faceWant = darkFace(g, level);
      let faceRate = 2.5;
      let targetAlpha = 1;

      if (g.state === "enter") {
        // ----- entrando: aparece devagar e já começa a andar -----
        targetAlpha = Math.min(1, g.t / 0.8);
        litable = g.t > 0.4;
        if (move(g, dt, ctx)) g.state = "near";
        else if (g.t > 0.8) g.state = "move";
      } else if (g.state === "move") {
        // ----- andando -----
        litable = true;
        if (move(g, dt, ctx)) g.state = "near";
      } else if (g.state === "hide") {
        // ----- Tímida escondida atrás da árvore -----
        targetAlpha = 0.18;
        const tree = g.tree;
        tmp.set(tree.x, 0, tree.z).normalize();
        g.to.set(tree.x + tmp.x * 0.75, 1.05, tree.z + tmp.z * 0.75);
        g.pos.lerp(g.to, Math.min(1, dt * 4));
        if (g.t > (g.peeks === 0 ? rand(0.8, 1.4) : 1.2)) {
          g.state = "peek";
          g.t = 0;
          g.side = -g.side;
          audio.place(g.spot, g.pos, 0.5);
          audio.shy(g.spot);
        }
      } else if (g.state === "peek") {
        // ----- Tímida espiando: só dá para iluminar agora -----
        litable = g.t > 0.25;
        const tree = g.tree;
        tmp.set(tree.x, 0, tree.z).normalize();
        tmp2.set(tmp.z, 0, -tmp.x).multiplyScalar(g.side * (tree.trunk + 0.5));
        g.to.set(tree.x + tmp.x * 0.15 + tmp2.x, 1.05 + Math.sin(g.t * 3) * 0.05, tree.z + tmp.z * 0.15 + tmp2.z);
        g.pos.lerp(g.to, Math.min(1, dt * 5));
        if (g.t > 1.8) {
          g.peeks++;
          g.t = 0;
          if (g.peeks >= 2) resume(g, g.approach * 0.55);
          else g.state = "hide";
        }
      } else if (g.state === "near") {
        // ----- chegou: BUU! (ou, sem susto, vai direto para a cesta) -----
        if (level.boo > 0) startBoo(g, ctx);
        else startGrab(g, ctx);
      } else if (g.state === "swoop") {
        // ----- dá a volta até ficar na frente dela, um pouco para o lado -----
        const k = Math.min(1, g.t / (level.scary ? 0.45 : 0.7));
        const e = k * k * (3 - 2 * k);
        g.pos.lerpVectors(g.from, g.to, e);
        g.pos.y += Math.sin(k * Math.PI) * 0.25;
        if (k >= 1) {
          g.state = "buu";
          g.t = 0;
          g.pop = 1;
          handlers.boo?.(g);
        }
      } else if (g.state === "buu") {
        // ----- BUU! cara de susto por meio segundo, depois cai na risada -----
        const scary = level.scary && g.t < 0.5;
        faceWant = scary ? FACE.buu : level.scary ? FACE.riso : FACE.bobo;
        faceRate = 14;
        if (g.boo === 0 && g.t >= (level.scary ? 0.5 : 0.3)) {
          g.boo = 1;
          audio.laugh(g.spot);
        }
        if (g.t > (level.scary ? 1.0 : 0.9)) startGrab(g, ctx);
      } else if (g.state === "grab") {
        // ----- desce até a cesta e pega um brigadeiro -----
        faceWant = FACE.riso;
        const k = Math.min(1, g.t / 0.65);
        const e = k * k * (3 - 2 * k);
        g.pos.lerpVectors(g.from, g.to, e);
        if (k >= 1) {
          g.carrying = ctx.canSteal ? (handlers.steal?.(g) ?? -1) : -1;
          if (g.carrying >= 0) {
            g.candy ??= makeCandy();
            g.group.add(g.candy);
            g.candy.position.copy(CANDY_HAND);
            g.candy.visible = true;
          }
          audio.place(g.spot, g.pos, 0);
          audio.nham(g.spot);
          startFlee(g, ctx);
        }
      } else if (g.state === "flee") {
        // ----- foge rindo (dá para pegar o brigadeiro de volta iluminando) -----
        litable = g.t > 0.3;
        faceWant = FACE.riso;
        g.pos.addScaledVector(g.out, dt * 2.3);
        g.pos.y += dt * 0.65;
        targetAlpha = 1 - smoothstep(1.5, 2.6, g.t);
        if (g.t > 2.6) {
          handlers.escape?.(g);
          remove(g);
          continue;
        }
      } else if (g.state === "bye") {
        // ----- amanheceu: acena e vai embora para o lado do sol -----
        faceWant = FACE.fofo;
        g.pos.addScaledVector(ctx.sunrise, dt * 1.2);
        g.pos.y += dt * 0.9;
        targetAlpha = 1 - smoothstep(0.6, 2.6, g.t);
        if (g.t > 2.7) {
          remove(g);
          continue;
        }
      }

      // ----- luz da lanterna: faz cócegas até o POF -----
      const lit = litable ? lantern.litAmount(g.pos, g.def.size * 0.42) : 0;
      const on = lit > 0.25;
      g.lit += ((on ? 1 : 0) - g.lit) * Math.min(1, dt * (on ? 9 : 3));
      if (on) {
        g.tickle += (dt / g.def.dwell) * (0.6 + 0.4 * lit);
        g.nextGiggle -= dt;
        if (g.nextGiggle <= 0) {
          g.nextGiggle = 0.42 - g.tickle * 0.2;
          audio.giggle(g.spot, g.tickle);
        }
      } else g.tickle = Math.max(0, g.tickle - dt * 0.45);
      if (g.tickle >= 1) {
        poof(g, ctx);
        continue;
      }
      if (g.lit > 0.5 && (g.state === "move" || g.state === "enter" || g.state === "peek" || g.state === "flee")) {
        faceWant = g.tickle > 0.45 ? FACE.riso : FACE.fofo;
        faceRate = 7;
      }
      setFace(g, faceWant, faceRate, dt);

      g.alpha += (targetAlpha - g.alpha) * Math.min(1, dt * 6);
      g.pop = Math.max(0, g.pop - dt * 2.2);
      const grow = easeOutBack(Math.min(1, g.age / 0.6));
      const breathe = 1 + Math.sin(g.age * 2.2 + g.seed) * 0.04;
      g.group.scale.setScalar(Math.max(0.001, g.def.size * grow * breathe * (1 + g.pop * 0.2)));
      const shake = g.tickle * 0.035;
      g.group.position.set(
        g.pos.x + Math.sin(g.age * 38) * shake,
        g.pos.y + Math.sin(g.age * 33) * shake * 0.5,
        g.pos.z + Math.cos(g.age * 41) * shake,
      );
      g.group.lookAt(head.position.x, g.group.position.y + (head.position.y - g.group.position.y) * 0.4, head.position.z);
      g.group.rotateZ(Math.sin(g.age * 1.3 + g.seed) * 0.08 + (g.state === "bye" ? Math.sin(g.age * 9) * 0.25 : 0));
      g.bodyU.uLit.value = g.lit;
      g.bodyU.uAlpha.value = g.alpha;
      g.bodyU.uWiggle.value = g.tickle;
      g.faceU.uAlpha.value = g.alpha;
      g.bow.visible = g.type === "timida" && g.alpha > 0.4;
      g.cap.visible = g.type === "soneca" && g.alpha > 0.4;
      if (g.candy?.visible) g.candy.rotation.y += dt * 2;
      audio.place(g.spot, g.pos, smoothstep(0.1, -0.85, facing));
    }
  }

  return {
    pool,
    spawn,
    update,
    setHandlers(h) {
      handlers = h;
    },
    count(filter) {
      let n = 0;
      for (const g of pool) if (g.active && (!filter || filter(g))) n++;
      return n;
    },
    // O fantasma mais perto que ainda está chegando (para o coração, a coruja e o vaga-lume guia).
    nearest(filter) {
      let best = null;
      let bestD = Infinity;
      for (const g of pool) {
        if (!g.active || (g.state !== "enter" && g.state !== "move" && g.state !== "hide" && g.state !== "peek")) continue;
        if (filter && !filter(g)) continue;
        const d = Math.hypot(g.pos.x, g.pos.z);
        if (d < bestD) {
          bestD = d;
          best = g;
        }
      }
      return best ? { ghost: best, dist: bestD } : null;
    },
    goodbye() {
      for (const g of pool) {
        if (!g.active || g.state === "bye") continue;
        g.state = "bye";
        g.t = 0;
        g.tickle = 0;
      }
    },
    clear() {
      for (const g of pool) if (g.active) remove(g);
    },
  };
}
