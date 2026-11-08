import * as THREE from "three";
import { pick, smoothstep } from "../shared/util.js";
import { CANDIES } from "./basket.js";
import { createDirector } from "./director.js";
import { LEVELS, NIGHTS } from "./nights.js";
import { SUNRISE } from "./world.js";

// Quem a coruja chama pelo nome. Os fantasmas nunca falam o nome dela (só a coruja, que é amiga).
const NAME = "Lívia";
const LINES = {
  first: `Oi, ${NAME}! Os fantasminhas querem os seus brigadeiros! Ilumine eles com a lanterna!`,
  night: [`Lá vêm eles, ${NAME}! Fique de ouvido aberto!`, "Noite chegando... prepare a lanterna!", `Boa noite, ${NAME}! Escute bem!`],
  sorrateiro: "Shhh... ouviu isso? Veio lá de trás!",
  timida: "Uma fantasminha tímida! Espere ela espiar atrás da árvore.",
  sombra: "Essa é a Sombra. Ela só anda quando você não está olhando!",
  soneca: "Ih! O Fantasmão Soneca acordou! Segure a luz bem nele!",
  sapinho: "Hu-hu! Era só um sapinho!",
  steal: ["Ops! Lá se foi um brigadeiro!", "Ele pegou um! Ilumine para pegar de volta!"],
  back: ["Isso! Pegou de volta!", "Muito bem!"],
  dawn: (n) => (n === CANDIES ? `Amanheceu! Você salvou todos os brigadeiros, ${NAME}!` : `Amanheceu! Você salvou ${n} brigadeiros!`),
  empty: "Amanheceu! Os fantasminhas comeram tudo... mas amanhã tem mais!",
};

const fwd = new THREE.Vector3();
const above = new THREE.Vector3();
const star = new THREE.Vector3();

export function headYaw(head) {
  fwd.set(0, 0, -1).applyQuaternion(head.quaternion);
  return Math.atan2(-fwd.x, -fwd.z);
}

export function createGame({ forest, effects, critters, lantern, ghosts, owl, basket, eyes, hint, ui, progress, audio, head, onExit }) {
  let state = "attract";
  let stateT = 0;
  let nightIndex = 0;
  let night = NIGHTS[0];
  let level = LEVELS[progress.level];
  let playT = 0;
  let poofs = 0;
  let combo = 0;
  let lastPoof = -10;
  let clock = 0;
  let heartNext = 0;
  let speakCool = 0;
  let practice = 0;
  let result = null;

  function speak(text, force = false) {
    if (!text || (!force && speakCool > 0)) return;
    speakCool = 7;
    owl.talk(audio.say(text));
  }

  const director = createDirector({
    ghosts,
    forest,
    lantern,
    audio,
    critters,
    effects,
    say: (key) => speak(LINES[key], true),
  });

  function textAbove(g, str, color, size = 0.42) {
    above.copy(g.pos);
    above.y += 0.55 * g.def.size;
    effects.text(above, str, color, size, 1, 0.4);
  }

  ghosts.setHandlers({
    poof(g) {
      combo = clock - lastPoof < 2.6 ? combo + 1 : 0;
      lastPoof = clock;
      audio.poof(g.spot, combo);
      effects.pop(g.pos, 0.42 * g.def.size, g.def.color);
      effects.sparkle(g.pos, "#e8ff7a", 10, 0.3, 0.14);
      textAbove(g, combo >= 3 ? "INCRÍVEL!" : "POF!", combo >= 3 ? "#ffd34d" : "#c9b8ff");
      lantern.addFirefly(g.pos);
      if (state === "play") {
        poofs++;
        director.onPoof();
      }
    },
    boo(g) {
      audio.buu(g.spot, level.scary);
      textAbove(g, "BUU!", level.scary ? "#9b7bff" : "#ff9cc8", 0.55);
    },
    steal() {
      if (state !== "play") return -1;
      const i = basket.take();
      if (i >= 0) {
        director.onSteal();
        speak(pick(LINES.steal));
      }
      return i;
    },
    recover(g) {
      basket.give(g.carrying);
      g.carrying = -1;
      audio.back();
      textAbove(g, "DE VOLTA!", "#69db7c", 0.5);
      speak(pick(LINES.back));
    },
    split(g) {
      director.split(g);
    },
  });

  function resetNight() {
    ghosts.clear();
    eyes.clear();
    director.stop();
    lantern.reset();
    basket.reset();
    forest.setDawn(0, true);
    forest.setProgress(0);
    forest.setCover(0);
    forest.setMoon(level.moon);
    audio.setDetune(level.detune);
    audio.hush(false);
    audio.setTension(0);
  }

  function toAttract() {
    state = "attract";
    stateT = 0;
    resetNight();
    ui.hideAll();
    audio.stopAll();
  }

  function toTitle() {
    state = "title";
    stateT = 0;
    level = LEVELS[progress.level];
    resetNight();
    lantern.setCone(0.46);
    audio.setAmbient("night");
    audio.setMusic("title");
    practice = 3;
    ui.showTitle(progress, progress.level, head, headYaw(head));
  }

  function startNight(i) {
    nightIndex = i;
    night = NIGHTS[i];
    level = LEVELS[progress.level];
    resetNight();
    ui.hideAll();
    lantern.setCone(night.cone);
    audio.setAmbient("night", { creak: level.scary });
    audio.setMusic("night");
    poofs = 0;
    combo = 0;
    playT = 0;
    heartNext = 0;
    state = "intro";
    stateT = 0;
    audio.hoot();
    owl.hoot();
    speak(progress.markSeen("inicio") ? LINES.first : pick(LINES.night), true);
  }

  function toDawn() {
    state = "dawn";
    stateT = 0;
    director.stop();
    ghosts.goodbye();
    eyes.clear();
    forest.setDawn(1);
    forest.setCover(0);
    lantern.setNear(0);
    audio.setMusic("dawn");
    audio.setAmbient("dawn");
    audio.hush(false);
    audio.setTension(0);
    audio.dawn();
    const saved = basket.count;
    speak(saved > 0 ? LINES.dawn(saved) : LINES.empty, true);
  }

  function toResults() {
    const saved = basket.count;
    const stars = saved >= 5 ? 3 : saved >= 3 ? 2 : 1;
    progress.finish(nightIndex, stars);
    result = {
      night: nightIndex,
      saved,
      poofs,
      stars,
      reveal: 0,
      hasNext: nightIndex + 1 < NIGHTS.length && progress.unlocked(nightIndex + 1),
    };
    state = "results";
    stateT = 0;
    ui.showResults(result, head, headYaw(head));
  }

  function select(b) {
    audio.select();
    switch (b.id) {
      case "night":
        if (progress.unlocked(b.index)) startNight(b.index);
        break;
      case "scare": {
        const next = (progress.level + 1) % LEVELS.length;
        progress.level = next;
        level = LEVELS[next];
        forest.setMoon(level.moon);
        audio.setDetune(level.detune);
        ui.setLevel(next);
        break;
      }
      case "games":
        onExit?.();
        break;
      case "again":
        startNight(result.night);
        break;
      case "next":
        startNight(result.night + 1);
        break;
      case "back":
        toTitle();
        break;
      default:
        break;
    }
  }

  function updatePlay(dt, gazeYaw) {
    playT += dt;
    forest.setProgress(playT / night.duration);
    director.update(dt, { gazeYaw, head });
    const near = ghosts.nearest();
    const unseen = ghosts.nearest((g) => !g.inView);
    lantern.setNear(near ? smoothstep(5, 1.6, near.dist) : 0);
    audio.setTension(Math.min(1, ghosts.count() * 0.22 + (near ? smoothstep(10, 2, near.dist) * 0.5 : 0)));
    if (level.heartbeat && unseen && unseen.dist < 6) {
      heartNext -= dt;
      if (heartNext <= 0) {
        const k = 1 - unseen.dist / 6;
        heartNext = 1.1 - k * 0.55;
        audio.heartbeat(0.55 + 0.45 * k);
      }
    }
    if (playT >= night.duration) toDawn();
    return unseen;
  }

  function updateResults() {
    const revealAt = [0.7, 1.2, 1.7];
    if (result.reveal < 3 && stateT > revealAt[result.reveal]) {
      const k = result.reveal;
      if (k < result.stars) {
        result.reveal = k + 1;
        ui.redrawResults(result);
        audio.star(k);
        ui.starWorld(k, star);
        effects.confetti(star, 26, ["#ffd34d", "#ffb000", "#fff3a0", "#ffffff"], 2);
      } else result.reveal = 3;
    }
  }

  // Na tela de título, um fantasminha bonzinho fica por perto para ela treinar a lanterna.
  function updatePractice(dt, gazeYaw) {
    practice -= dt;
    if (practice > 0 || ghosts.count() > 0) return;
    practice = 6;
    const side = Math.random() < 0.5 ? -1 : 1;
    ghosts.spawn("bolota", { angle: gazeYaw + side * 0.95, dist: 6.5, height: 1.5, approach: 400, level: LEVELS[0] });
  }

  function update(dt, origin, direction) {
    clock += dt;
    stateT += dt;
    speakCool = Math.max(0, speakCool - dt);
    lantern.update(dt, head, origin, direction);
    audio.listen(head);
    const gazeYaw = Math.atan2(-direction.x, -direction.z);
    const calmLevel = state === "title" || state === "attract" ? LEVELS[0] : level;
    ghosts.update(dt, {
      head,
      gaze: lantern.dir,
      gazeYaw,
      level: calmLevel,
      basketPos: basket.position,
      canSteal: basket.count > 0,
      sunrise: SUNRISE,
    });
    let unseen = null;
    if (state === "title") updatePractice(dt, gazeYaw);
    else if (state === "intro" && stateT > 3.4) {
      state = "play";
      stateT = 0;
      director.start(nightIndex, level, progress);
    } else if (state === "play") unseen = updatePlay(dt, gazeYaw);
    else if (state === "dawn" && stateT > 5.5) toResults();
    else if (state === "results") updateResults();

    const showHint = unseen && (nightIndex <= 1 || progress.level <= 1 ? unseen.dist < 8 : unseen.dist < 3.5);
    hint.update(dt, head, showHint ? unseen.ghost.pos : null);
    eyes.update(dt, {
      lantern,
      gazeYaw,
      head,
      max: state === "play" ? level.eyes + (playT > night.duration * 0.86 ? 1 : 0) : 0,
      onLit: (p) => audio.at(p, 0, (sp) => audio.shy(sp)),
    });
    owl.update(dt, head, unseen && unseen.dist < 9 ? unseen.ghost.pos : null);
    basket.update(dt);
    forest.update(dt);
    ui.update(dt);
  }

  return {
    toAttract,
    toTitle,
    startNight,
    select,
    hover() {
      audio.hover();
    },
    update,
    get state() {
      return state;
    },
    get inMenu() {
      return state === "title" || state === "results";
    },
  };
}
