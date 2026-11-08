import * as THREE from "three";
import { angleDiff, rand } from "../shared/util.js";
import { TYPES } from "./ghosts.js";
import { NIGHTS, PHASES } from "./nights.js";

const BEHIND = 2.2;
const tmp = new THREE.Vector3();

function weighted(weights, filter) {
  let total = 0;
  for (const k in weights) if (!filter || filter(k)) total += weights[k];
  if (total <= 0) return null;
  let roll = Math.random() * total;
  for (const k in weights) {
    if (filter && !filter(k)) continue;
    roll -= weights[k];
    if (roll <= 0) return k;
  }
  return null;
}

// O "diretor" da noite: decide quem nasce, onde e quando, e cuida dos sustos especiais.
// Regras de justiça: nunca nasce dentro do feixe, alterna esquerda e direita, dá um respiro depois de cada BUU.
export function createDirector({ ghosts, forest, lantern, audio, critters, effects, say }) {
  let night = NIGHTS[0];
  let nightIndex = 0;
  let level = null;
  let progress = null;
  let running = false;
  let t = 0;
  let next = 0;
  let calm = 0;
  let side = 1;
  let difficulty = 1;
  let introDone = false;
  let bossDone = false;
  let alarmDone = false;
  let failDone = false;
  let alarm = null;
  let sneak = null;
  let hushT = 0;
  let coverT = 0;
  let coverNext = 0;
  let failClick = -1;

  function phaseAt(k) {
    for (const p of PHASES) if (k < p.until) return p;
    return PHASES[PHASES.length - 1];
  }

  function relYaw(g, gazeYaw) {
    return angleDiff(Math.atan2(-g.pos.x, -g.pos.z), gazeYaw);
  }

  const alive = (g) => g.state !== "flee" && g.state !== "bye";

  function nearestDist() {
    const n = ghosts.nearest();
    return n ? n.dist : Infinity;
  }

  function approachTime(type) {
    const base = Math.max(6.5, night.approach / difficulty);
    return type === "soneca" ? base * 2.2 : base;
  }

  function angleFor(type, gazeYaw) {
    side = -side;
    let off;
    if (type === "sorrateiro") off = rand(2.3, Math.PI);
    else if (type === "sombra") off = rand(1.5, Math.PI);
    else {
      const [lo, hi] = night.arc;
      off = lo + (hi - lo) * Math.pow(Math.random(), 1.2 - nightIndex * 0.12);
    }
    // Antes da noite 4, nunca dois por trás ao mesmo tempo.
    if (off > BEHIND && nightIndex < 3 && ghosts.count((g) => alive(g) && Math.abs(relYaw(g, gazeYaw)) > BEHIND) > 0) {
      off = rand(0.8, 1.6);
    }
    return gazeYaw + side * off;
  }

  function spawn(type, gazeYaw, extra = {}) {
    if (type === "timida" && extra.angle === undefined) {
      const trees = forest.nearTrees.filter((tr) => {
        const d = Math.abs(angleDiff(tr.a, gazeYaw));
        return d > 0.8 && d < 2.6;
      });
      if (trees.length) {
        const tree = trees[Math.floor(Math.random() * trees.length)];
        return ghosts.spawn("timida", { tree, approach: approachTime(type), level });
      }
    }
    return ghosts.spawn(type, {
      angle: extra.angle ?? angleFor(type, gazeYaw),
      dist: extra.dist ?? rand(10.5, 12.5),
      approach: extra.approach ?? approachTime(type),
      height: extra.height,
      level,
    });
  }

  // O Sorrateiro chega depois que a floresta fica em silêncio (nos níveis com silêncio).
  function sneakIn(type, gazeYaw) {
    if (!level.hush) {
      spawn(type, gazeYaw);
      return;
    }
    audio.hush(true);
    sneak = { type, t: 1.6, angle: angleFor(type, gazeYaw) };
  }

  function startAlarm(gazeYaw) {
    alarmDone = true;
    audio.hush(true);
    alarm = {
      t: 0,
      a: gazeYaw + (Math.random() < 0.5 ? -1 : 1) * rand(1.8, 2.6),
      frog: null,
      rustle: 0,
      since: 0,
      pos: new THREE.Vector3(),
    };
  }

  // Alarme falso: silêncio, folhas mexendo cada vez mais perto... e era só um sapinho.
  function updateAlarm(dt) {
    alarm.t += dt;
    const a = alarm.a;
    if (alarm.t > 1.4 && alarm.t < 3.4) {
      alarm.rustle -= dt;
      if (alarm.rustle <= 0) {
        alarm.rustle = 0.42;
        const r = 8 - (alarm.t - 1.4) * 2.4;
        tmp.set(-Math.sin(a) * r, 0.2, -Math.cos(a) * r);
        audio.at(tmp, 0.5, (sp) => audio.rustle(sp, 0.09));
      }
    }
    if (alarm.t >= 3.4 && !alarm.frog) {
      const x = -Math.sin(a) * 2.6;
      const z = -Math.cos(a) * 2.6;
      alarm.pos.set(x, forest.heightAt(x, z) + 0.16, z);
      alarm.frog = critters.make("sapinho");
      alarm.frog.scale.setScalar(0.55);
      alarm.frog.position.copy(alarm.pos);
      alarm.frog.rotation.y = Math.atan2(-x, -z);
      forest.scene.add(alarm.frog);
      audio.at(alarm.pos, 0.3, (sp) => audio.croak(sp));
    }
    if (alarm.frog) {
      alarm.since += dt;
      alarm.frog.position.y = alarm.pos.y + Math.abs(Math.sin(alarm.since * 5)) * 0.03;
      if (lantern.litAmount(alarm.pos, 0.25) > 0.4 || alarm.since > 5) {
        critters.free(alarm.frog, alarm.pos, 0.55);
        audio.at(alarm.pos, 0.3, (sp) => audio.croak(sp));
        say("sapinho");
        audio.hush(false);
        alarm = null;
        calm = 2;
      }
    }
  }

  function start(i, lv, prog) {
    night = NIGHTS[i];
    nightIndex = i;
    level = lv;
    progress = prog;
    running = true;
    t = 0;
    next = night.duration * PHASES[0].until + 1;
    calm = 0;
    difficulty = 1;
    introDone = !night.intro;
    bossDone = !night.boss;
    alarmDone = !level.falseAlarm;
    failDone = !level.failure;
    alarm = null;
    sneak = null;
    hushT = 0;
    coverT = 0;
    coverNext = rand(18, 30);
    failClick = -1;
  }

  function stop() {
    running = false;
    if (alarm?.frog) critters.release(alarm.frog);
    alarm = null;
    sneak = null;
    hushT = 0;
    audio.hush(false);
    forest.setCover(0);
  }

  function update(dt, { gazeYaw }) {
    if (!running) return;
    t += dt;
    const k = t / night.duration;
    const phase = phaseAt(k);
    calm = Math.max(0, calm - dt);

    if (sneak) {
      sneak.t -= dt;
      if (sneak.t <= 0) {
        spawn(sneak.type, gazeYaw, { angle: sneak.angle });
        sneak = null;
        hushT = 3.2;
      }
    }
    if (hushT > 0) {
      hushT -= dt;
      if (hushT <= 0) audio.hush(false);
    }

    // Nuvem passando na frente da lua: a floresta escurece um pouco.
    if (level.scary) {
      coverNext -= dt;
      if (coverNext <= 0) {
        forest.setCover(1);
        coverT = 7;
        coverNext = rand(25, 40);
      }
      if (coverT > 0) {
        coverT -= dt;
        if (coverT <= 0) forest.setCover(0);
      }
    }

    if (!introDone && k > 0.16 && !sneak && !alarm) {
      introDone = true;
      const type = night.intro;
      if (progress.markSeen(type)) say(type);
      if (type === "sorrateiro") sneakIn(type, gazeYaw);
      else spawn(type, gazeYaw);
      next = Math.max(next, 4);
    }

    if (!bossDone && k > 0.78) {
      bossDone = true;
      say("soneca");
      spawn("soneca", gazeYaw, { angle: gazeYaw + side * rand(0.9, 1.2), dist: 12.5, height: 1.6 });
      next = 6;
    }

    if (!alarmDone && !alarm && !sneak && k > 0.58 && nearestDist() > 5) startAlarm(gazeYaw);
    if (alarm) updateAlarm(dt);

    // Sustão: a lanterna falha uma vez, e alguém aproveita para chegar por trás.
    if (!failDone && !alarm && k > 0.66 && nearestDist() > 4) {
      failDone = true;
      lantern.fail();
      audio.fizzle();
      failClick = 2.5;
      spawn(Math.random() < 0.5 ? "sorrateiro" : "bolota", gazeYaw, { angle: gazeYaw + side * rand(2.4, 3.0) });
    }
    if (failClick > 0) {
      failClick -= dt;
      if (failClick <= 0) audio.click();
    }

    if (phase.rate <= 0 || calm > 0 || sneak || alarm) return;
    next -= dt * phase.rate * (ghosts.count((g) => g.type === "soneca") ? 0.5 : 1);
    if (next > 0) return;
    const max = night.max + (phase.final ? 1 : 0);
    if (ghosts.count(alive) >= max) {
      next = 0.8;
      return;
    }
    next = rand(night.gap[0], night.gap[1]) / difficulty;
    // Sustão: na onda final eles vêm em dupla, um pela frente e outro por trás.
    if (level.pairs && phase.final && ghosts.count(alive) + 2 <= max && Math.random() < 0.45) {
      spawn("bolota", gazeYaw, { angle: gazeYaw + side * rand(0.8, 1.2) });
      spawn("pipoca" in night.types ? "pipoca" : "bolota", gazeYaw, { angle: gazeYaw + Math.PI + rand(-0.3, 0.3) });
      return;
    }
    const type = (phase.sneaky && weighted(night.types, (tp) => TYPES[tp].sneaky)) || weighted(night.types);
    if (type === "sorrateiro") sneakIn(type, gazeYaw);
    else spawn(type, gazeYaw);
  }

  return {
    start,
    stop,
    update,
    onSteal() {
      difficulty = Math.max(0.8, difficulty * 0.9);
      calm = 5;
    },
    onPoof() {
      difficulty = Math.min(1.12, difficulty * 1.015);
    },
    // O Fantasmão Soneca vira três Bolotas que vêm de lados diferentes.
    split(g) {
      effects.confetti(g.pos, 30, ["#eaf2ff", "#c9b8ff", "#e8ff7a"], 2.4);
      for (const off of [-2.1, 0, 2.1]) spawn("bolota", 0, { angle: g.a + off, dist: 9, approach: 9 });
    },
    get time() {
      return t;
    },
  };
}
