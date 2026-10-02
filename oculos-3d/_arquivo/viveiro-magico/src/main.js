import "./style.css";
import * as THREE from "three";
import { createAudio } from "./audio.js";
import { HIGH, setHigh } from "./detail.js";
import { createGarden } from "./garden.js";
import { createGaze } from "./gaze.js";
import { createProgress } from "./progress.js";
import { createPriceBoard } from "./prices.js";
import { createScene } from "./scene.js";
import { createShop } from "./shop.js";
import { createStand } from "./stand.js";
import { createStats } from "./stats.js";
import { createVR } from "./vr.js";

const canvas = document.querySelector("#view");
const startBtn = document.querySelector("#start");
const soundBtn = document.querySelector("#sound");
const exitBtn = document.querySelector("#exit");
const resetBtn = document.querySelector("#reset");
const detailBtn = document.querySelector("#detail");
const meterBtn = document.querySelector("#meter");
const METER_KEY = "viveiro-medidor";

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.setClearColor(0x000000, 1);

const progress = createProgress();
const world = createScene();
const garden = createGarden(world.scene, progress);
const stand = createStand(world.scene, progress, garden);
const shop = createShop(world.scene, progress);
const prices = createPriceBoard(world.scene, progress);
const targets = [];
function collectTargets() {
  targets.length = 0;
  targets.push(...garden.colliders, ...stand.colliders, ...shop.colliders);
}
collectTargets();

// Para um objeto novo que o olhar usa: um kind aqui e o módulo dele.
function ownerOf(target) {
  const kind = target.userData.kind;
  if (kind === "customer") return stand;
  if (kind === "shop") return shop;
  return garden;
}
const canUse = (target) => ownerOf(target).canUse(target);
const gaze = createGaze();
world.scene.add(gaze.reticle);
const audio = createAudio();
const vr = createVR(renderer, canvas);
const httpsTip = document.querySelector("#https-tip");
if (!window.isSecureContext && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
  httpsTip.hidden = false;
}

let celebrated = false;
const clock = new THREE.Clock();
const stats = createStats(renderer, HIGH ? "alto" : "baixo");function readMeter() {
  try {
    return window.localStorage.getItem(METER_KEY) !== "desligado";
  } catch {
    return true;
  }
}

function showMeter(on) {
  document.body.classList.toggle("meter", on);
  meterBtn.textContent = on ? "Medidor: ligado" : "Medidor: desligado";
}
showMeter(readMeter());
detailBtn.textContent = HIGH ? "Detalhes: alto" : "Detalhes: baixo";

function showMenu() {
  document.body.classList.remove("playing");
  exitBtn.hidden = true;
  stats.report();
}

detailBtn.addEventListener("click", () => {
  setHigh(!HIGH);
  window.location.reload();
});

meterBtn.addEventListener("click", () => {
  const on = !document.body.classList.contains("meter");
  try {
    window.localStorage.setItem(METER_KEY, on ? "ligado" : "desligado");
  } catch {
    // Sem localStorage: vale só até recarregar.
  }
  showMeter(on);
});

vr.setOnEnd(showMenu);

startBtn.addEventListener("click", begin);

soundBtn.addEventListener("click", () => {
  try {
    audio.unlock();
  } catch {
    // Sem Web Audio: o jogo segue mudo.
  }
  audio.setEnabled(!audio.enabled);
  soundBtn.textContent = audio.enabled ? "Som: ligado" : "Som: desligado";
});

exitBtn.addEventListener("click", () => {
  void vr.exit().then(showMenu);
});

resetBtn.addEventListener("click", () => {
  if (!window.confirm("Apagar tudo e recomeçar do zero?")) return;
  progress.reset();
  window.location.reload();
});

function begin() {
  document.body.classList.add("playing");
  exitBtn.hidden = false;
  try {
    audio.unlock();
  } catch {
    // Sem Web Audio: o jogo segue mudo.
  }
  try {
    vr.enter();
  } catch (error) {
    showMenu();
    startBtn.textContent = `Erro: ${error?.message ?? error}`;
  }
}

renderer.setAnimationLoop(() => {
  stats.begin();
  const dt = Math.min(clock.getDelta(), 0.05);
  if (vr.mode !== "menu") {
    vr.update();
    const looker = vr.getLooker();
    const aim = gaze.update(dt, looker, targets, vr.consumeClick(), canUse);
    garden.setGazed(aim.target);
    if (aim.entered) audio.note(garden.hover(aim.target));
    if (aim.done) {
      const sound = ownerOf(aim.target).use(aim.target);
      if (sound === "comprar") {
        garden.refresh();
        prices.refresh();
        stand.syncMoney();
        collectTargets();
      }
      if (sound) {
        gaze.pause(0.45);
        audio.play(sound);
      }
    }
    gaze.setBadge(garden.heldColor);
  }
  const sound = garden.update(dt);
  if (sound) audio.play(sound);
  const standSound = stand.update(dt);
  if (standSound) audio.play(standSound);
  shop.update(dt);
  prices.update(dt);
  if (stand.dayDone && !celebrated) {
    celebrated = true;
    world.celebrate();
    garden.celebrate();
    audio.play("fim");
  }
  world.update(dt);
  vr.render(world.scene);
  stats.end(vr.mode !== "menu");
});
