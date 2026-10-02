import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/fredoka/700.css";
import "./shared/menu.css";
import * as THREE from "three";
import { createAudio as createBolhasAudio } from "./bolhas/audio.js";
import { createHub } from "./hub/vr-hub.js";
import { createAudio as createLabirintoAudio } from "./labirinto/audio.js";
import { updatePointScale } from "./shared/points.js";
import { HIGH, setHigh } from "./shared/quality.js";
import { createStats } from "./shared/stats.js";
import { createVR } from "./shared/vr.js";

// As placas são desenhadas em canvas: espera a fonte (com limite) para não sair com a fonte padrão.
await Promise.race([
  Promise.all([document.fonts.load('700 64px "Fredoka"'), document.fonts.load('600 64px "Fredoka"')]),
  new Promise((resolve) => setTimeout(resolve, 2500)),
]).catch(() => undefined);

const METER_KEY = "oculos-medidor";
const SOUND_KEY = "oculos-som";
const LABIRINTO_KEY = "labirinto-progresso";

// Para um jogo novo: crie src/<jogo>/index.js com create<Jogo>(contexto) e registre aqui e na sala (vr-hub.js).
const LOADERS = {
  bolhas: () => import("./bolhas/index.js").then((m) => m.createBolhas(context("bolhas"))),
  labirinto: () => import("./labirinto/index.js").then((m) => m.createLabirinto(context("labirinto"))),
};

const canvas = document.querySelector("#view");
const menu = document.querySelector("#menu");
const qualityBtn = document.querySelector("#quality");
const meterBtn = document.querySelector("#meter");
const resetBtn = document.querySelector("#reset");
const exitBtn = document.querySelector("#exit");
const httpsTip = document.querySelector("#https-tip");
if (!window.isSecureContext && /Android|iPhone|iPad/i.test(navigator.userAgent)) httpsTip.hidden = false;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: HIGH, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, HIGH ? 2 : 1.25));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = HIGH;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Cada jogo decide quando recalcular a sombra (ver enter()/frame() de cada um).
renderer.shadowMap.autoUpdate = false;

const vr = createVR(renderer, canvas);
vr.rig.rotation.order = "YXZ";
const stats = createStats(renderer, HIGH ? "bonitos" : "leves");
qualityBtn.textContent = HIGH ? "Gráficos: bonitos" : "Gráficos: leves";

const audios = { bolhas: createBolhasAudio(), labirinto: createLabirintoAudio() };
const hub = createHub({ vr, audio: audios.bolhas, onPick: pick });
setSound(readFlag(SOUND_KEY, true));

const games = {};
let active = hub;
let opening = false;
let firstGame = new URLSearchParams(window.location.search).get("jogo");
if (!(firstGame in LOADERS)) firstGame = null;
hub.scene.add(vr.rig);

function context(name) {
  return { renderer, vr, audio: audios[name], onExit: () => activate(hub) };
}

function readFlag(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value === "ligado";
  } catch {
    return fallback;
  }
}

function saveFlag(key, on) {
  try {
    window.localStorage.setItem(key, on ? "ligado" : "desligado");
  } catch {
    // Sem localStorage: vale só até recarregar.
  }
}

function setSound(on) {
  for (const audio of Object.values(audios)) audio.setEnabled(on);
  hub.setSound(on);
}

function pick(id) {
  if (id === "sound") {
    const on = !audios.bolhas.enabled;
    saveFlag(SOUND_KEY, on);
    setSound(on);
    return;
  }
  open(id);
}

// O primeiro carregamento de um jogo monta o cenário dele (pode levar um segundo); depois fica guardado.
function open(name) {
  if (opening || !(name in LOADERS)) return;
  opening = true;
  hub.setLoading(name, true);
  games[name] ??= LOADERS[name]();
  games[name]
    .then((game) => {
      if (vr.mode !== "menu" && active === hub) activate(game);
    })
    .catch((error) => {
      delete games[name];
      console.error(error);
    })
    .finally(() => {
      opening = false;
      hub.setLoading(name, false);
    });
}

function activate(next) {
  if (next === active) return;
  active.leave();
  active = next;
  next.scene.add(vr.rig);
  vr.recenter();
  next.enter();
}

function showMeter(on) {
  document.body.classList.toggle("meter", on);
  meterBtn.textContent = on ? "Medidor: ligado" : "Medidor: desligado";
}
showMeter(readFlag(METER_KEY, readFlag("bolhas-medidor", false) || readFlag("labirinto-medidor", false)));

function showReset() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(LABIRINTO_KEY) ?? "null");
    resetBtn.hidden = !saved?.best?.some((s) => s >= 0);
  } catch {
    resetBtn.hidden = true;
  }
}
showReset();

function showMenu() {
  document.body.classList.remove("playing");
  exitBtn.hidden = true;
  stats.report();
  if (active !== hub) {
    active.leave();
    active = hub;
    hub.scene.add(vr.rig);
  }
  hub.leave();
  showReset();
}

// O único toque do jogo: libera tela cheia, giroscópio e som. Daqui em diante tudo é pelo olhar.
function begin() {
  if (document.body.classList.contains("playing")) return;
  document.body.classList.add("playing");
  exitBtn.hidden = false;
  for (const audio of Object.values(audios)) {
    try {
      audio.unlock();
    } catch {
      // Sem Web Audio: o jogo segue mudo.
    }
  }
  try {
    vr.enter();
    hub.enter();
    if (firstGame) open(firstGame);
    firstGame = null;
  } catch (error) {
    showMenu();
    console.error(error);
  }
}

vr.setOnEnd(showMenu);
menu.addEventListener("click", (event) => {
  if (event.target.closest(".row, .link")) return;
  begin();
});
exitBtn.addEventListener("click", () => {
  void vr.exit().then(showMenu);
});
qualityBtn.addEventListener("click", () => {
  setHigh(!HIGH);
  window.location.reload();
});
meterBtn.addEventListener("click", () => {
  const on = !document.body.classList.contains("meter");
  saveFlag(METER_KEY, on);
  showMeter(on);
});
resetBtn.addEventListener("click", () => {
  if (!window.confirm("Apagar as estrelas do Labirinto e voltar ao nível 1?")) return;
  try {
    window.localStorage.removeItem(LABIRINTO_KEY);
  } catch {
    // Sem localStorage: não há progresso salvo.
  }
  void games.labirinto?.then((game) => game.resetProgress()).catch(() => undefined);
  showReset();
});

// Baixa os jogos em segundo plano para a troca ficar rápida (o cenário só é montado ao escolher).
setTimeout(() => {
  void import("./bolhas/index.js").catch(() => undefined);
  void import("./labirinto/index.js").catch(() => undefined);
}, 1500);

const clock = new THREE.Clock();
let elapsed = 0;
let failed = false;

renderer.setAnimationLoop(() => {
  stats.begin();
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  const playing = vr.mode !== "menu";
  if (playing) vr.update();
  else vr.rig.rotation.set(0.04, Math.sin(elapsed * 0.12) * 0.3, 0);
  const looker = vr.getLooker();
  // Um erro num quadro não pode derrubar o laço de desenho (o celular está dentro do óculos).
  try {
    active.frame(dt, looker, playing);
  } catch (error) {
    if (!failed) console.error(error);
    failed = true;
  }
  updatePointScale(renderer);
  vr.render(active.scene);
  stats.end(playing);
});
