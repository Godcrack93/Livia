import * as THREE from "three";
import { pick, rand } from "../shared/util.js";
import { EYE } from "../shared/vr.js";
import { LEVELS, stagesOf } from "./levels.js";
import { BALL_R, parseStage } from "./physics.js";
import { THEMES } from "./themes.js";

const wp = new THREE.Vector3();
const BOARD_PITCH = -0.4;
const DROP_H = 0.32;
const FIREWORKS = ["#ff5f9e", "#ffd34d", "#5ec8ff", "#8be36b", "#b388ff", "#ff9f43"];
const PORTAL_COLOR = { 1: "#c07bff", 2: "#c07bff", 3: "#3fd6ff", 4: "#3fd6ff" };
const FINALE_FRIENDS = ["coelhinho", "joaninha", "sapinho", "gatinho", "peixinho", "pintinho"];
const BOARD_STATES = new Set(["intro", "play", "fall", "respawn", "fail", "won"]);

// Estados: attract → map → intro → play ⇄ fall/respawn → fail | won → results | (final) próxima parte → finale.
export function createGame({ board, ball, physics, control, progress, ui, audio, effects, scenery, critters, vr, head, onExit }) {
  let state = "attract";
  let timer = 0;
  let index = 0;
  let stageIndex = 0;
  let level = LEVELS[0];
  let stages = stagesOf(level);
  let L = null;
  let theme = THEMES.jardim;
  let hearts = 3;
  let maxHearts = 3;
  const fails = LEVELS.map(() => 0);
  let starsStage = 0;
  let starsDone = 0;
  const respawn = { x: 0, z: 0 };
  const drop = { x: 0, z: 0, y: 0, vy: 0, active: false, landed: false };
  const fall = { kind: "void", x: 0, z: 0, vx: 0, vz: 0, hx: 0, hz: 0, y: 0, vy: 0 };
  const won = { x: 0, z: 0 };
  let doorDelay = 0;
  let heartDelay = 0;
  let fireworkTimer = 0;
  let revealed = 0;
  let revealTimer = 0;
  let finaleButton = false;
  let stageCleared = false;
  let ramp = 1;

  function applyTheme(name) {
    const env = scenery.setTheme(name);
    board.setEnv(env);
    ball.setEnv(env);
    theme = THEMES[name];
  }

  function refreshHud() {
    ui.drawHud({
      label: level.finale ? `FINAL ${stageIndex + 1}/3` : `NÍVEL ${index + 1}`,
      hearts,
      maxHearts,
      stars: starsStage,
      starsTotal: L.stars.length,
      key: L.keys.length ? L.keys.some((k) => k.taken) : null,
    });
  }

  function sparkleAt(x, y, z, color, count, size = 0.05) {
    board.toWorld(x, y, z, wp);
    effects.sparkle(wp, color, count, 0.035, size);
  }

  function buildStage(stage) {
    L = parseStage(stage);
    board.build(L, theme, stage.map, { friend: level.friend });
    physics.load(L);
    respawn.x = L.start.x;
    respawn.z = L.start.z;
    starsStage = 0;
    control.reset();
    board.setTilt(0, 0);
    board.hideGuide();
    ball.setVisible(false);
    ball.setGlow(0);
    ball.faceForward();
    drop.active = false;
    drop.landed = false;
  }

  function quiet() {
    audio.rolling(0, 0, false);
    board.hideGuide();
  }

  function toAttract() {
    ui.hideAll();
    scenery.endCelebration();
    state = "attract";
    index = progress.next();
    level = LEVELS[index];
    stages = stagesOf(level);
    stageIndex = 0;
    applyTheme(level.theme);
    buildStage(stages[0]);
    ball.setVisible(true);
    ball.update(0, L.start.x, BALL_R, L.start.z, 0, 0, 1);
    audio.setMusic("off");
    quiet();
  }

  function toMap() {
    ui.hideAll();
    scenery.endCelebration();
    state = "map";
    const suggested = progress.next();
    applyTheme(LEVELS[suggested].theme);
    board.vanish();
    ball.setVisible(false);
    quiet();
    ui.showMap(progress, suggested, control.mode, Boolean(onExit));
    audio.setMusic("mapa");
    vr.recenter(0.05);
  }

  function startLevel(i, recenter = true) {
    index = i;
    level = LEVELS[i];
    stages = stagesOf(level);
    stageIndex = 0;
    starsDone = 0;
    maxHearts = 3 + Math.min(2, fails[i]);
    hearts = maxHearts;
    ui.hideAll();
    scenery.endCelebration();
    applyTheme(level.theme);
    audio.setMusic(level.theme);
    if (recenter) vr.recenter(BOARD_PITCH);
    else vr.lookMono(BOARD_PITCH);
    beginStage(true);
  }

  function beginStage(first, sub = null) {
    const stage = stages[stageIndex];
    buildStage(stage);
    state = "intro";
    timer = 0;
    stageCleared = false;
    refreshHud();
    ui.showHud(true);
    ui.showPlayMap(true);
    if (level.finale) {
      const big = first && stageIndex === 0 ? "GRANDE FINAL!" : `PARTE ${stageIndex + 1} DE 3`;
      ui.showBanner(big, sub ?? stage.hint, "#ffb000", 2.1);
    } else ui.showBanner(`NÍVEL ${index + 1}`, sub ?? level.hint, theme.accent, 2.1);
  }

  function startDrop(x, z) {
    physics.place(x, z);
    drop.x = x;
    drop.z = z;
    drop.y = DROP_H;
    drop.vy = 0;
    drop.active = true;
    drop.landed = false;
    ball.setVisible(true);
    ball.faceForward();
  }

  function updateDrop(dt) {
    if (!drop.active) return;
    drop.vy -= 3.2 * dt;
    drop.y += drop.vy * dt;
    if (drop.y <= BALL_R) {
      drop.y = BALL_R;
      if (!drop.landed) {
        audio.drop();
        sparkleAt(drop.x, 0.01, drop.z, "#ffffff", 6, 0.04);
      }
      drop.landed = true;
      if (Math.abs(drop.vy) > 0.25) drop.vy = -drop.vy * 0.35;
      else {
        drop.vy = 0;
        drop.active = false;
      }
    }
    ball.update(dt, drop.x, drop.y, drop.z, 0, 0, 1);
  }

  function settleBoard(dt) {
    const tilt = control.update(dt, { head, board, ball: physics.ball, layout: L, active: false });
    board.setTilt(tilt.x, tilt.z);
  }

  // Para um objeto novo no tabuleiro: trate aqui o evento que a física gerar.
  function handle(e) {
    switch (e.type) {
      case "wall":
        if (e.speed > 0.15) audio.thud(e.speed);
        break;
      case "bumper": {
        const bp = L.bumpers[e.index];
        board.bump(e.index);
        audio.boing();
        sparkleAt(bp.x, 0.04, bp.z, theme.bumper, 6);
        break;
      }
      case "star": {
        const s = L.stars[e.index];
        board.hideStar(e.index);
        starsStage++;
        audio.star(starsStage);
        sparkleAt(s.x, 0.05, s.z, "#ffd34d", 16, 0.06);
        board.toWorld(s.x, 0.09, s.z, wp);
        effects.text(wp, "+1", "#ffb000", 0.07, 0.8, 0.12);
        refreshHud();
        ui.bumpHud();
        break;
      }
      case "key": {
        const k = L.keys[e.index];
        board.hideKey(e.index);
        audio.key();
        doorDelay = 0.45;
        sparkleAt(k.x, 0.05, k.z, "#ffd34d", 14, 0.06);
        for (const d of L.doors) sparkleAt(d.x, 0.08, d.z, theme.accent, 10);
        refreshHud();
        ui.bumpHud();
        break;
      }
      case "check": {
        const c = L.checks[e.index];
        board.lightCheck(e.index, theme.accent);
        respawn.x = c.x;
        respawn.z = c.z;
        audio.check();
        sparkleAt(c.x, 0.1, c.z, theme.accent, 12);
        break;
      }
      case "portal":
        audio.portal();
        sparkleAt(e.from.x, 0.03, e.from.z, PORTAL_COLOR[e.from.ch], 10);
        sparkleAt(e.to.x, 0.03, e.to.z, PORTAL_COLOR[e.to.ch], 10);
        break;
      case "fall":
        startFall(e);
        break;
      case "goal":
        win();
        break;
    }
  }

  function startFall(e) {
    state = "fall";
    timer = 0;
    const b = physics.ball;
    fall.kind = e.kind;
    fall.x = b.x;
    fall.z = b.z;
    fall.vx = b.vx;
    fall.vz = b.vz;
    fall.hx = e.x ?? b.x;
    fall.hz = e.z ?? b.z;
    fall.y = BALL_R;
    fall.vy = 0;
    hearts = Math.max(0, hearts - 1);
    heartDelay = 0.55;
    audio.fall();
    quiet();
  }

  function updateFall(dt) {
    let scale;
    if (fall.kind === "hole") {
      const k = Math.min(1, dt * 10);
      fall.x += (fall.hx - fall.x) * k;
      fall.z += (fall.hz - fall.z) * k;
      fall.y -= dt * 0.22;
      scale = Math.max(0, 1 - timer * 1.6);
    } else {
      fall.vy -= 2.6 * dt;
      fall.y += fall.vy * dt;
      fall.x += fall.vx * dt * 0.5;
      fall.z += fall.vz * dt * 0.5;
      scale = Math.max(0, 1 - Math.max(0, timer - 0.35) * 1.6);
    }
    ball.update(dt, fall.x, fall.y, fall.z, fall.vx, fall.vz, Math.max(0.001, scale));
    if (timer < 1.1) return;
    if (hearts > 0) {
      state = "respawn";
      timer = 0;
      startDrop(respawn.x, respawn.z);
      return;
    }
    state = "fail";
    timer = 0;
    fails[index]++;
    ball.setVisible(false);
    board.vanish();
    audio.fail();
    const more = 3 + Math.min(2, fails[index]) > maxHearts;
    ui.showBanner("OPS!", more ? "Vamos de novo! Ganhou mais um coração!" : "Vamos tentar de novo!", "#ff6b6b", 2.2);
  }

  function win() {
    state = "won";
    timer = 0;
    const b = physics.ball;
    won.x = b.x;
    won.z = b.z;
    starsDone += starsStage;
    audio.win();
    quiet();
    board.celebrate();
    ui.showPlayMap(false);
    board.toWorld(L.goal.x, 0.06, L.goal.z, wp);
    effects.confetti(wp, 46, effects.RAINBOW, 1.1);
    sparkleAt(L.goal.x, 0.05, L.goal.z, "#ffe27a", 20, 0.07);
    if (level.finale && stageIndex < stages.length - 1) {
      ui.showBanner("MUITO BEM!", `Parte ${stageIndex + 1} de 3 completa!`, "#40c057", 1.8);
    }
  }

  function updateWon(dt) {
    won.x += (L.goal.x - won.x) * Math.min(1, dt * 8);
    won.z += (L.goal.z - won.z) * Math.min(1, dt * 8);
    const sink = Math.min(1, timer * 2);
    ball.update(dt, won.x, BALL_R * (1 - sink * 0.45), won.z, 0, 0, 1);
    ball.setGlow(0.5 + Math.sin(timer * 10) * 0.5);
    if (Math.floor((timer - dt) * 3) !== Math.floor(timer * 3) && timer < 1.5) {
      sparkleAt(L.goal.x, 0.08, L.goal.z, pick(FIREWORKS), 6);
    }
    if (level.finale) {
      if (stageIndex < stages.length - 1) {
        if (timer > 1.8 && !stageCleared) {
          stageCleared = true;
          board.vanish();
          ball.setVisible(false);
        }
        if (timer > 2.4) {
          stageIndex++;
          beginStage(false);
        }
      } else if (timer > 1.6) startFinale();
      return;
    }
    if (timer > 1.8) {
      const rec = progress.complete(index, starsDone);
      ui.showHud(false);
      ui.showResults({
        index,
        name: level.name,
        stars: starsDone,
        isNew: rec.isNew,
        first: rec.first,
        hasNext: index < LEVELS.length - 1,
      });
      state = "results";
      timer = 0;
      revealed = 0;
      revealTimer = 0.9;
      vr.lookMono(-0.08);
    }
  }

  function startFinale() {
    state = "finale";
    timer = 0;
    progress.complete(index, starsDone);
    board.vanish();
    ball.setVisible(false);
    ui.showHud(false);
    ui.showPlayMap(false);
    audio.finale();
    audio.setMusic("festa");
    scenery.celebrate(critters, FINALE_FRIENDS);
    ui.showFinale(progress.total());
    vr.lookMono(0.12);
    fireworkTimer = 0.4;
    finaleButton = false;
  }

  function updateFinale(dt) {
    fireworkTimer -= dt;
    if (fireworkTimer <= 0) {
      const color = pick(FIREWORKS);
      wp.set(rand(-7, 7), rand(3, 7.5), rand(-15, -8));
      effects.firework(wp, color);
      scenery.pulse(color, 0.35);
      audio.boom();
      fireworkTimer = timer < 12 ? rand(0.45, 1.0) : rand(1.2, 2.4);
      if (Math.random() < 0.35) effects.confetti(wp.set(rand(-1.2, 1.2), EYE + 1.3, rand(-2, -1.2)), 40, effects.RAINBOW, 1.6);
    }
    if (!finaleButton && timer > 6) {
      finaleButton = true;
      ui.showFinaleButton(true);
    }
  }

  function updateResults(dt) {
    if (revealed >= starsDone) return;
    revealTimer -= dt;
    if (revealTimer > 0) return;
    revealed++;
    ui.revealStars(revealed);
    audio.ding(revealed - 1);
    effects.sparkle(wp.set((revealed - 2) * 0.225, 1.49, -1.6), "#ffd34d", 12, 0.06, 0.08);
    revealTimer = 0.45;
  }

  function update(dt, t, origin, direction) {
    timer += dt;
    if (doorDelay > 0 && (doorDelay -= dt) <= 0) audio.door();
    if (heartDelay > 0 && (heartDelay -= dt) <= 0) {
      audio.heart();
      refreshHud();
      ui.bumpHud();
    }
    switch (state) {
      case "intro":
        physics.idle(dt);
        if (timer >= 1.0 && !drop.active && !drop.landed) startDrop(L.start.x, L.start.z);
        updateDrop(dt);
        if (timer >= 2.3 && !drop.active) {
          state = "play";
          ramp = 0;
          ui.showBanner("JÁ!", "", "#40c057", 0.7);
          audio.go();
        }
        break;
      case "play": {
        ramp = Math.min(1, ramp + dt / 1.2);
        const strength = ramp * ramp;
        const tilt = control.update(dt, { head, origin, direction, board, ball: physics.ball, layout: L, active: true, strength });
        board.setTilt(tilt.x, tilt.z);
        const events = physics.step(dt, tilt.x, tilt.z);
        for (let i = 0; i < events.length && state === "play"; i++) handle(events[i]);
        if (state === "play") {
          const b = physics.ball;
          ball.update(dt, b.x, BALL_R, b.z, b.vx, b.vz, 1);
          audio.rolling(b.speed, b.surface, true);
          board.setGuide(control.guide.show, control.guide.x, control.guide.z, b, tilt.x, tilt.z);
        }
        break;
      }
      case "fall":
        physics.idle(dt);
        settleBoard(dt);
        updateFall(dt);
        break;
      case "respawn":
        physics.idle(dt);
        settleBoard(dt);
        updateDrop(dt);
        if (!drop.active && timer > 0.9) {
          state = "play";
          ramp = 0;
        }
        break;
      case "fail":
        settleBoard(dt);
        if (timer > 2.4) {
          maxHearts = 3 + Math.min(2, fails[index]);
          hearts = maxHearts;
          beginStage(!level.finale);
        }
        break;
      case "won":
        settleBoard(dt);
        updateWon(dt);
        break;
      case "results":
        updateResults(dt);
        break;
      case "finale":
        updateFinale(dt);
        break;
      default:
        break;
    }
    board.update(dt, L);
    scenery.update(dt, t);
    ui.update(dt);
  }

  function hover() {
    audio.hover();
  }

  function select(target) {
    switch (target.id) {
      case "level":
        if (target.locked) {
          audio.nope();
          ui.shake(target);
          return;
        }
        audio.select();
        startLevel(target.data);
        break;
      case "next":
        audio.select();
        startLevel(index + 1, false);
        break;
      case "again":
        audio.select();
        startLevel(index, false);
        break;
      case "control":
        audio.select();
        control.setMode(control.mode === "olhar" ? "inclinar" : "olhar");
        ui.setControl(control.mode);
        break;
      case "games":
        audio.select();
        onExit?.();
        break;
      default:
        audio.select();
        toMap();
        break;
    }
  }

  return {
    toAttract,
    toMap,
    update,
    hover,
    select,
    get state() {
      return state;
    },
    // Durante a partida a mira some (o anel no tabuleiro faz esse papel), exceto sobre um botão.
    get onBoard() {
      return BOARD_STATES.has(state);
    },
  };
}
