import * as THREE from "three";
import { CRITTERS, RARE_CRITTERS } from "../shared/critters.js";
import { TAU, angleDiff, pick, rand } from "../shared/util.js";
import { EYE } from "../shared/vr.js";
import { NAMES } from "./album.js";
import { headYaw, makeLabel } from "./hud.js";
import { NUMBERS_TOTAL, createNumbers, numberStars } from "./numbers.js";
import { SONGS } from "./songs.js";
import { time } from "./world.js";

const ROUND = 70;
const FESTA = 55;
const STARS = [20, 45, 75];
const COMBO_WINDOW = 1.6;
const RECORD_KEY = "bolhas-recorde";
const NUMBERS_RECORD_KEY = "bolhas-numeros-recorde";
const RAINBOW_STARS = 8;
const RARE_CHANCE = 0.08;
const SONG_BONUS = 10;
const RAINBOW_BONUS = 10;

// Fases da rodada: span é o quanto (em radianos) as flores ativas se abrem a partir da frente.
const PHASES = [
  { until: 15, interval: [1.25, 1.0], span: 0.75, max: 12, weights: { normal: 78, star: 15, friend: 7 } },
  {
    until: 35,
    interval: [1.0, 0.8],
    span: 1.9,
    max: 18,
    weights: { normal: 58, star: 14, friend: 12, giant: 8, gold: 4, rainbow: 4 },
  },
  {
    until: FESTA,
    interval: [0.8, 0.6],
    span: 3.2,
    max: 22,
    weights: { normal: 52, star: 14, friend: 12, giant: 9, gold: 7, rainbow: 6 },
  },
  {
    until: ROUND,
    interval: [0.34, 0.28],
    span: 3.2,
    max: 30,
    weights: { normal: 70, star: 12, friend: 8, gold: 6, rainbow: 4 },
  },
];

const TEXT_COLOR = {
  normal: "#3ec1ff",
  mini: "#3ec1ff",
  star: "#ffb000",
  friend: "#ff5f9e",
  gold: "#ffb000",
  rainbow: "#9b7bff",
  giant: "#40c057",
};
// Ordem de prioridade da setinha (a primeira da lista ganha).
const POINTER_KINDS = ["gold", "rainbow", "friend", "star"];
const POINTER_COLOR = { gold: "#ffb000", rainbow: "#b197fc", friend: "#ff5f9e", star: "#ffd34d", number: "#3ec1ff" };
const GOLDS = ["#ffd34d", "#ffb000", "#fff3a0", "#ffffff"];
const PINKS = ["#ff9cc8", "#ff5f9e", "#ffffff", "#ffd1e6"];

const tmpStart = new THREE.Vector3();
const tmpDir = new THREE.Vector3();
const tmpEnd = new THREE.Vector3();
const tmpPos = new THREE.Vector3();
const tmpText = new THREE.Vector3();
const tmpColor = new THREE.Color();
const fwd = new THREE.Vector3();
const gaze = new THREE.Vector3();
const toBubble = new THREE.Vector3();

const notButton = (b) => b.kind !== "button";

function readRecord(key) {
  try {
    return Number(window.localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function saveRecord(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Sem localStorage: o recorde vale só nesta sessão.
  }
}

function weighted(weights) {
  let total = 0;
  for (const k in weights) total += weights[k];
  let roll = Math.random() * total;
  for (const k in weights) {
    roll -= weights[k];
    if (roll <= 0) return k;
  }
  return "normal";
}

function bubbleColor(hue, out) {
  out.setRGB(
    0.55 + 0.45 * Math.cos(TAU * hue),
    0.55 + 0.45 * Math.cos(TAU * (hue + 0.33)),
    0.55 + 0.45 * Math.cos(TAU * (hue + 0.67)),
  );
  return out;
}

export function createGame({
  world,
  nature,
  bubbles,
  critters,
  effects,
  hud,
  audio,
  emitters,
  head,
  meadow,
  pointer,
  skyRainbow,
  album,
  onExit,
}) {
  let state = "attract";
  let mode = "bolhas";
  let stateT = 0;
  let playT = 0;
  let score = 0;
  let friends = [];
  let combo = 0;
  let lastPop = -10;
  let clock = 0;
  let nextSpawn = 0;
  let lastFlower = -1;
  let playYaw = 0;
  let record = readRecord(RECORD_KEY);
  let numbersRecord = readRecord(NUMBERS_RECORD_KEY);
  let flags = {};
  let result = null;
  let songIndex = 0;
  let songPos = -1;
  let starCount = 0;
  const queue = [];
  const cascade = [];
  const shelf = [];

  const labels = {
    start: makeLabel(["JOGAR"], "#ff5f9e"),
    numbers: makeLabel(["NÚMEROS"], "#ff9f43"),
    album: makeLabel(["ÁLBUM"], "#3ec1ff"),
    again: makeLabel(["DE", "NOVO"], "#3ec1ff"),
    home: makeLabel(["INÍCIO"], "#9b7bff"),
    back: makeLabel(["VOLTAR"], "#9b7bff"),
    games: makeLabel(["JOGOS"], "#40c057"),
  };

  function front(dist, y, out, yaw = headYaw(head)) {
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    out.copy(head.position).addScaledVector(fwd, dist);
    out.y = y;
    return out;
  }

  function panFor(pos) {
    const a = Math.atan2(-(pos.x - head.position.x), -(pos.z - head.position.z));
    return -Math.sin(angleDiff(a, headYaw(head)));
  }

  function setState(next) {
    state = next;
    stateT = 0;
  }

  function phaseIndex() {
    for (let i = 0; i < PHASES.length; i++) if (playT < PHASES[i].until) return i;
    return PHASES.length - 1;
  }

  function chooseFlower(span) {
    const list = emitters.flowers;
    let best = -1;
    let tries = 0;
    while (tries++ < 12) {
      const i = Math.floor(Math.random() * list.length);
      if (Math.abs(angleDiff(list[i].angle, playYaw)) > span) continue;
      if (i === lastFlower && tries < 6) continue;
      best = i;
      break;
    }
    if (best < 0) {
      let min = Infinity;
      list.forEach((f, i) => {
        const d = Math.abs(angleDiff(f.angle, playYaw));
        if (d < min) {
          min = d;
          best = i;
        }
      });
    }
    lastFlower = best;
    return best;
  }

  // Raro recém-liberado tem aparição garantida; depois, cada amiguinho tem uma chance pequena de ser raro.
  function pickFriend() {
    if (state !== "play") return pick(CRITTERS);
    if (flags.rare && playT > 10) {
      const type = flags.rare;
      flags.rare = null;
      return type;
    }
    const rares = album.unlockedRares();
    if (rares.length && Math.random() < RARE_CHANCE) return pick(rares);
    return pick(CRITTERS);
  }

  function spawnFrom(index, kind) {
    const f = emitters.spawnPoint(index, tmpStart, tmpDir);
    const a = f.angle + rand(-0.38, 0.38);
    const dist = kind === "giant" ? rand(3.6, 4.6) : rand(2.6, 4.4);
    const y = kind === "giant" ? EYE + rand(0.1, 0.8) : EYE + rand(-0.45, 1.05);
    tmpEnd.set(-Math.sin(a) * dist, y, -Math.cos(a) * dist);
    let content = null;
    if (kind === "friend") content = critters.make(pickFriend());
    if (kind === "star") content = critters.make("estrela");
    const b = bubbles.spawn(kind, tmpStart, tmpDir, tmpEnd, { content, emitter: index });
    if (!b) {
      if (content) critters.release(content);
      return null;
    }
    if (content && RARE_CRITTERS.includes(content.userData.type)) b.rare = true;
    emitters.puff(index);
    audio.puff(panFor(tmpStart));
    effects.sparkle(tmpStart, f.color, 6, 0.18);
    return b;
  }

  function releaseContent(content) {
    if (!content) return;
    if (content.userData.type) critters.release(content);
    else content.removeFromParent();
  }

  function spawnButton(action, label, dist, y, yaw) {
    front(dist, y, tmpEnd, yaw);
    const b = bubbles.spawn("button", tmpEnd, tmpDir.set(0, 1, 0), tmpEnd, { content: label, approach: 0.01 });
    if (b) b.action = action;
    return b;
  }

  function addScore(points, pos, kind, size = 0.3) {
    if (state !== "play" || points <= 0) return;
    score += points;
    hud.bump();
    tmpText.copy(pos);
    tmpText.y += 0.35;
    effects.text(tmpText, `+${points}`, TEXT_COLOR[kind] ?? "#3ec1ff", size + Math.min(0.25, points * 0.02));
  }

  // Amiguinho salvo durante a partida: entra no álbum e vai passear na grama.
  function saveFriend(content, pos, scale) {
    const type = content.userData.type;
    friends.push(type);
    const isNew = album.addFriend(type);
    const rare = RARE_CRITTERS.includes(type);
    if (isNew || rare) {
      tmpText.copy(pos);
      tmpText.y += 0.8;
      effects.text(tmpText, isNew ? "NOVO!" : "RARO!", rare ? "#ffb000" : "#ff5f9e", 0.42, 1.5, 0.4);
      audio.newFriend(panFor(pos));
      if (rare) effects.confetti(pos, 30, GOLDS, 2.4);
    }
    meadow.add(content, pos, scale);
  }

  // Combo musical: cada estouro seguido toca a próxima nota da música da partida.
  function songNote(byPlayer) {
    const song = SONGS[songIndex];
    if (byPlayer && combo <= 1) songPos = 0;
    else songPos++;
    return { freq: song.notes[songPos % song.notes.length], finished: (songPos + 1) % song.notes.length === 0 };
  }

  function songDone(pos) {
    const song = SONGS[songIndex];
    score += SONG_BONUS;
    hud.bump();
    effects.text(front(3, EYE + 0.75, tmpText), `VOCÊ TOCOU ${song.title}!`, "#9b7bff", 0.4, 2.2, 0.3);
    tmpText.copy(pos);
    tmpText.y += 0.35;
    effects.text(tmpText, `+${SONG_BONUS}`, "#9b7bff", 0.5);
    effects.confetti(pos, 36, effects.RAINBOW, 2.4);
    audio.record();
  }

  function addStar(pos) {
    if (starCount >= RAINBOW_STARS) return;
    starCount++;
    skyRainbow.setProgress(starCount / RAINBOW_STARS);
    world.pulse("#fff0b0", 0.22);
    if (starCount === 1) {
      effects.text(front(3.2, EYE + 0.9, tmpText), "UM ARCO-ÍRIS!", "#9b7bff", 0.4, 1.6, 0.3);
    } else if (starCount === RAINBOW_STARS) {
      effects.text(front(3.2, EYE + 0.9, tmpText), "ARCO-ÍRIS COMPLETO!", "#9b7bff", 0.48, 2.4, 0.3);
      effects.confetti(pos, 60, effects.RAINBOW, 3);
      world.pulse("#ff9cf0", 0.5);
      audio.rainbow();
      audio.record();
      score += RAINBOW_BONUS;
      hud.bump();
      tmpText.copy(pos);
      tmpText.y += 0.7;
      effects.text(tmpText, `+${RAINBOW_BONUS}`, "#9b7bff", 0.5);
    }
  }

  function popBubble(b, byPlayer) {
    if (!b.active) return;
    const pos = tmpPos.copy(b.view);
    const kind = b.kind;
    const r = b.r;
    const scale = b.contentScale;
    const hue = b.hue;
    const points = b.points;
    const content = bubbles.pop(b);
    const pan = panFor(pos);

    if (byPlayer) {
      combo = clock - lastPop < COMBO_WINDOW ? combo + 1 : 1;
      lastPop = clock;
    }
    const song = songNote(byPlayer);
    bubbleColor(hue, tmpColor);

    if (kind === "giant") {
      audio.bigPop(pan);
      audio.note(song.freq, pan);
      effects.pop(pos, r, tmpColor);
      effects.ring(pos, r, "#ffffff", 0.5, 2.6, 0.06);
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU + rand(-0.3, 0.3);
        tmpDir.set(Math.cos(a), rand(0.2, 0.6), Math.sin(a)).normalize();
        tmpEnd.copy(pos).addScaledVector(tmpDir, 0.95);
        bubbles.spawn("mini", pos, tmpDir, tmpEnd, { approach: 0.6 });
      }
    } else if (kind === "gold") {
      audio.gold(pan);
      audio.note(song.freq, pan);
      effects.pop(pos, r, "#ffd34d");
      effects.confetti(pos, 46, GOLDS, 3.2);
      effects.ring(pos, r, "#ffd34d", 0.6, 4, 0.08);
      world.pulse("#ffcf40", 0.35);
    } else if (kind === "rainbow") {
      audio.rainbow();
      audio.note(song.freq, pan);
      effects.pop(pos, r, "#ffffff");
      effects.confetti(pos, 40, effects.RAINBOW, 2.6);
      world.pulse("#ff9cf0", 0.45);
      if (byPlayer) startCascade(pos, true);
    } else {
      audio.popNote(song.freq, pan);
      effects.pop(pos, r, tmpColor);
    }

    if (kind === "star") {
      audio.star(pan);
      effects.sparkle(pos, "#ffd34d", 12, 0.3, 0.16);
      if (content) critters.fly(content, pos, scale);
      if (state === "play") addStar(pos);
    } else if (kind === "friend") {
      audio.friend(pan);
      effects.confetti(pos, 18, PINKS, 1.6);
      if (content) {
        if (state === "play") saveFriend(content, pos, scale);
        else critters.free(content, pos, scale);
      }
    } else {
      releaseContent(content);
    }

    addScore(points, pos, kind);
    if (byPlayer && state === "play" && combo >= 5 && combo % 5 === 0) {
      score += 5;
      audio.combo(Math.min(3, combo / 5));
      tmpText.copy(pos);
      tmpText.y += 0.8;
      effects.text(tmpText, `COMBO ${combo}!`, "#9b7bff", 0.42, 1.4, 0.4);
      effects.confetti(pos, 24, effects.RAINBOW, 2);
    }
    if (song.finished && state === "play") songDone(pos);
  }

  function startCascade(origin, withPoints) {
    const list = [];
    for (const b of bubbles.pool) {
      if (b.active && b.kind !== "button") list.push(b);
    }
    list.sort((a, b) => a.view.distanceToSquared(origin) - b.view.distanceToSquared(origin));
    list.forEach((b, i) => cascade.push({ b, at: clock + 0.12 + i * (withPoints ? 0.07 : 0.05) }));
  }

  function runCascade() {
    for (let i = cascade.length - 1; i >= 0; i--) {
      const c = cascade[i];
      if (clock < c.at) continue;
      cascade.splice(i, 1);
      if (!c.b.active || c.b.kind === "button") continue;
      if (c.b.kind === "number") {
        const pos = tmpPos.copy(c.b.view);
        releaseContent(bubbles.pop(c.b));
        effects.pop(pos, 0.35, "#ffffff");
      } else popBubble(c.b, false);
    }
  }

  function runQueue() {
    for (let i = queue.length - 1; i >= 0; i--) {
      if (clock < queue[i].at) continue;
      const q = queue[i];
      queue.splice(i, 1);
      if (state === "play" || q.ambient) spawnFrom(q.index, q.kind);
    }
  }

  const numbers = createNumbers({
    bubbles,
    effects,
    audio,
    emitters,
    critters,
    world,
    panFor,
    front,
    pickFriend,
    saveFriend,
  });

  // ----- estados -----

  function hideBoards() {
    hud.title.hide();
    hud.results.hide();
    hud.album.hide();
  }

  function toAttract() {
    clearRound(true);
    hud.show(false, head);
    hideBoards();
    bubbles.fadeAll();
    skyRainbow.hide();
    audio.setMusic("off");
    world.setMood(0);
    nature.setBoost(0);
    setState("attract");
  }

  function toTitle(yaw = 0) {
    clearRound();
    hud.drawTitle(record);
    hideBoards();
    hud.title.show(head, yaw, 5.6, EYE + 1.45);
    hud.show(false, head);
    bubbles.fadeAll();
    skyRainbow.hide();
    spawnButton("numbers", labels.numbers, 2.6, EYE - 0.95, yaw + 0.55);
    spawnButton("start", labels.start, 2.6, EYE - 0.95, yaw);
    spawnButton("album", labels.album, 2.6, EYE - 0.95, yaw - 0.55);
    if (onExit) spawnButton("games", labels.games, 2.6, EYE - 0.95, yaw + 1.1);
    audio.setMusic("title");
    world.setMood(0);
    nature.setBoost(0);
    setState("title");
  }

  function toAlbum() {
    const yaw = headYaw(head);
    clearRound();
    hideBoards();
    bubbles.fadeAll();
    const entries = album.entries();
    const spots = hud.drawAlbum(entries);
    hud.album.show(head, yaw, 4.6, EYE + 0.55);
    entries.forEach((e, i) => {
      if (e.state !== "found") return;
      const c = critters.make(e.type);
      c.scale.setScalar(0.36);
      c.position.set(spots[i].x, spots[i].y, 0.3);
      c.userData.baseY = spots[i].y;
      c.userData.phase = i * 0.7;
      hud.album.group.add(c);
      shelf.push(c);
    });
    spawnButton("back", labels.back, 2.5, EYE - 1.15, yaw);
    setState("album");
  }

  function clearRound(immediate = false) {
    queue.length = 0;
    cascade.length = 0;
    for (const c of shelf) critters.release(c);
    shelf.length = 0;
    meadow.clear(immediate);
  }

  function startCountdown() {
    clearRound();
    hideBoards();
    bubbles.fadeAll();
    skyRainbow.hide();
    playYaw = headYaw(head);
    flags = { count: -1 };
    setState("countdown");
  }

  function startPlay() {
    score = 0;
    friends = [];
    combo = 0;
    playT = 0;
    nextSpawn = 0.2;
    starCount = 0;
    songPos = -1;
    songIndex = (songIndex + 1 + Math.floor(Math.random() * (SONGS.length - 1))) % SONGS.length;
    flags = {
      festa: false,
      friend: false,
      rainbow: false,
      gold: false,
      tick: 6,
      rare: mode === "bolhas" ? album.takePendingRare() : null,
    };
    skyRainbow.reset(playYaw);
    if (mode === "numeros") numbers.start(playYaw);
    hud.show(true, head);
    audio.setMusic("play");
    setState("play");
  }

  function endRound() {
    hud.show(false, head);
    audio.timeUp();
    audio.setMusic("fim");
    world.setMood(0);
    nature.setBoost(0.4);
    const numbersMode = mode === "numeros";
    effects.text(front(3, EYE + 0.2, tmpText), numbersMode ? "PARABÉNS!" : "TEMPO!", "#ff5f9e", 0.7, 1.6, 0.2);
    startCascade(head.position, false);
    if (numbersMode) {
      const t = Math.max(1, Math.round(numbers.elapsed));
      const isRecord = numbersRecord <= 0 || t < numbersRecord;
      if (isRecord) {
        numbersRecord = t;
        saveRecord(NUMBERS_RECORD_KEY, t);
      }
      result = { mode, time: t, score: 0, stars: numberStars(t), record: numbersRecord, isRecord };
    } else {
      const stars = STARS.filter((s) => score >= s).length;
      const isRecord = score > record && score > 0;
      if (isRecord) {
        record = score;
        saveRecord(RECORD_KEY, record);
      }
      result = { mode, score, stars, record, isRecord };
    }
    result.revealed = 0;
    result.friends = friends.length;
    result.kinds = friends.slice(0, 8);
    result.unlocked = album.addGame(result.stars);
    setState("end");
    flags = { shown: false, revealed: 0, again: false, nextFirework: 2.2, recordDone: false, unlockDone: false };
  }

  function showResults() {
    const yaw = headYaw(head);
    hud.drawResults(result);
    hud.results.show(head, yaw, 4.8, EYE + 0.55);
    const n = result.kinds.length;
    result.kinds.forEach((type, i) => {
      const c = critters.make(type);
      c.scale.setScalar(0.36);
      c.position.set((i - (n - 1) / 2) * 0.34, -1.36, 0.25);
      c.userData.baseY = -1.36;
      c.userData.phase = i * 0.7;
      hud.results.group.add(c);
      shelf.push(c);
    });
  }

  function hit(b) {
    if (!b || !b.active) return;
    if (b.kind === "button") {
      const action = b.action;
      bubbleColor(b.hue, tmpColor);
      const pos = tmpPos.copy(b.view);
      releaseContent(bubbles.pop(b));
      audio.bigPop(0);
      audio.beep(false);
      effects.pop(pos, 0.55, tmpColor);
      effects.confetti(pos, 50, effects.RAINBOW, 2.5);
      if (action === "start") mode = "bolhas";
      if (action === "numbers") mode = "numeros";
      if (action === "start" || action === "numbers" || action === "again") startCountdown();
      else if (action === "album") toAlbum();
      else if (action === "home" || action === "back") toTitle(headYaw(head));
      else if (action === "games") onExit?.();
      return;
    }
    if (b.kind === "number") {
      if (state === "play") numbers.hit(b);
      return;
    }
    popBubble(b, true);
  }

  function hover(b) {
    if (b?.kind === "button") audio.hover();
  }

  // ----- quadro a quadro -----

  function ambient(dt, every) {
    nextSpawn -= dt;
    if (nextSpawn > 0) return;
    nextSpawn = every * rand(0.7, 1.3);
    if (bubbles.count(notButton) >= 8) return;
    const kind = Math.random() < 0.15 ? "friend" : Math.random() < 0.15 ? "star" : "normal";
    spawnFrom(Math.floor(Math.random() * emitters.flowers.length), kind);
  }

  function updatePlay(dt) {
    playT += dt;
    const remaining = Math.max(0, Math.ceil(ROUND - playT));
    hud.draw(score, friends.length, remaining, ROUND);

    if (!flags.festa && playT >= FESTA) {
      flags.festa = true;
      audio.festa();
      audio.setMusic("festa");
      world.setMood(1);
      nature.setBoost(1);
      effects.text(front(3.2, EYE + 0.5, tmpText, playYaw), "FESTA DAS BOLHAS!", "#ff5f9e", 0.55, 2.2, 0.3);
      emitters.flowers.forEach((f, i) => {
        emitters.puff(i);
        emitters.spawnPoint(i, tmpStart, tmpDir);
        effects.confetti(tmpStart, 20, effects.RAINBOW, 2.2);
      });
    }
    if (remaining <= 5 && remaining < flags.tick && remaining > 0) {
      flags.tick = remaining;
      audio.tick();
    }

    const pi = phaseIndex();
    const ph = PHASES[pi];
    nextSpawn -= dt;
    if (nextSpawn <= 0) {
      const start = pi === 0 ? 0 : PHASES[pi - 1].until;
      const k = (playT - start) / (ph.until - start);
      nextSpawn = (ph.interval[0] + (ph.interval[1] - ph.interval[0]) * k) * rand(0.8, 1.2);
      if (bubbles.count(notButton) < ph.max) {
        let kind = weighted(ph.weights);
        if (!flags.friend && playT > 6) kind = "friend";
        else if (!flags.rainbow && playT > 24) kind = "rainbow";
        else if (!flags.gold && playT > 38) kind = "gold";
        else if (flags.rare && playT > 10) kind = "friend";
        if (kind === "friend") flags.friend = true;
        if (kind === "rainbow") flags.rainbow = true;
        if (kind === "gold") flags.gold = true;
        const index = chooseFlower(ph.span);
        spawnFrom(index, kind);
        if (pi >= 1 && Math.random() < 0.28) {
          queue.push({ at: clock + 0.2, index, kind: "normal" });
          if (pi === 3 && Math.random() < 0.5) queue.push({ at: clock + 0.4, index, kind: "normal" });
        }
      }
    }
    if (playT >= ROUND) endRound();
  }

  function updateNumbers(dt) {
    playT += dt;
    numbers.update(dt);
    hud.drawNumbers(numbers.next, numbers.found, NUMBERS_TOTAL, friends.length, Math.floor(numbers.elapsed));
    if (numbers.finished) endRound();
  }

  function updateEnd() {
    if (!flags.shown && stateT > 1.6) {
      flags.shown = true;
      showResults();
    }
    const revealAt = [2.3, 2.85, 3.4];
    if (flags.shown && flags.revealed < 3 && stateT > revealAt[flags.revealed]) {
      const i = flags.revealed;
      flags.revealed++;
      if (i < result.stars) {
        result.revealed = i + 1;
        hud.drawResults(result);
        audio.ding(i);
        tmpPos.set((i - 1) * 0.62, 0.6, 0.2);
        hud.results.group.localToWorld(tmpPos);
        effects.confetti(tmpPos, 30, GOLDS, 2);
        effects.sparkle(tmpPos, "#ffd34d", 10, 0.25, 0.2);
      }
    }
    if (result.isRecord && !flags.recordDone && stateT > 3.9) {
      flags.recordDone = true;
      audio.record();
    }
    if (result.unlocked.length && !flags.unlockDone && stateT > 4.6) {
      flags.unlockDone = true;
      tmpPos.set(0, 1.45, 0.3);
      hud.results.group.localToWorld(tmpPos);
      const names = result.unlocked.map((t) => NAMES[t].toUpperCase()).join(" E ");
      effects.text(tmpPos, `NOVO AMIGO RARO: ${names}!`, "#ffb000", 0.32, 3.5, 0.2);
      effects.confetti(tmpPos, 50, GOLDS, 2.6);
      audio.newFriend(0);
    }
    const party = result.stars >= 2 || result.isRecord;
    if (party && stateT > flags.nextFirework && stateT < 8) {
      flags.nextFirework = stateT + rand(0.45, 0.8);
      const yaw = headYaw(head) + rand(-0.7, 0.7);
      front(rand(16, 22), rand(7, 12), tmpPos, yaw);
      effects.firework(tmpPos, pick(effects.RAINBOW));
      audio.boom();
    }
    if (!flags.again && stateT > 4.3) {
      flags.again = true;
      const yaw = Math.atan2(
        -(hud.results.group.position.x - head.position.x),
        -(hud.results.group.position.z - head.position.z),
      );
      spawnButton("again", labels.again, 2.6, EYE - 0.95, yaw + 0.3);
      spawnButton("home", labels.home, 2.6, EYE - 0.95, yaw - 0.3);
    }
  }

  function pointerTarget() {
    if (state !== "play") return null;
    if (mode === "numeros") return numbers.nextBubble();
    gaze.set(0, 0, -1).applyQuaternion(head.quaternion);
    let best = null;
    let bestRank = Infinity;
    let bestDot = -Infinity;
    for (const b of bubbles.pool) {
      if (!b.active || b.dying || b.age < 0.8) continue;
      const rank = POINTER_KINDS.indexOf(b.kind);
      if (rank < 0 || rank > bestRank) continue;
      const dot = toBubble.copy(b.view).sub(head.position).normalize().dot(gaze);
      if (rank < bestRank || dot > bestDot) {
        best = b;
        bestRank = rank;
        bestDot = dot;
      }
    }
    return best;
  }

  function update(dt) {
    clock += dt;
    stateT += dt;
    if (state === "attract") ambient(dt, 1.6);
    else if (state === "title") ambient(dt, 2.2);
    else if (state === "album") ambient(dt, 3);
    else if (state === "countdown") {
      const step = Math.floor(stateT / 0.8);
      if (step !== flags.count && step <= 3) {
        flags.count = step;
        const label = ["3", "2", "1", "JÁ!"][step];
        effects.text(front(3, EYE + 0.1, tmpText, playYaw), label, step === 3 ? "#40c057" : "#ff9f43", 0.9, 0.75, 0.1);
        audio.beep(step === 3);
      }
      if (stateT > 2.75) startPlay();
    } else if (state === "play") {
      if (mode === "numeros") updateNumbers(dt);
      else updatePlay(dt);
    } else if (state === "end") updateEnd();

    runQueue();
    runCascade();
    bubbles.update(dt, head);
    for (const b of bubbles.pool) {
      if (!b.active) continue;
      if ((b.kind === "gold" || b.rare) && Math.random() < dt * 14) {
        effects.sparkle(b.view, "#ffd34d", 1, b.r * 0.9, 0.1);
      }
      if (b.kind === "rainbow" && Math.random() < dt * 10) {
        effects.sparkle(b.view, effects.RAINBOW[Math.floor(Math.random() * 6)], 1, b.r * 0.9, 0.1);
      }
    }
    const target = pointerTarget();
    pointer.update(dt, head, target, target ? POINTER_COLOR[target.kind] : undefined);
    critters.update(dt);
    meadow.update(dt, time.value);
    skyRainbow.update(dt);
    emitters.update(dt, time.value);
    effects.update(dt);
    hud.update(dt, head);
    hud.title.update(dt);
    hud.results.update(dt);
    hud.album.update(dt);
    for (const c of shelf) {
      const k = time.value * 3 + c.userData.phase;
      c.position.y = c.userData.baseY + Math.abs(Math.sin(k)) * 0.08;
      c.rotation.y = Math.sin(k * 0.5) * 0.5;
    }
  }

  return {
    toAttract,
    toTitle,
    hit,
    hover,
    update,
    releaseContent,
    get state() {
      return state;
    },
    get record() {
      return record;
    },
    get score() {
      return score;
    },
    get friends() {
      return friends.length;
    },
  };
}
