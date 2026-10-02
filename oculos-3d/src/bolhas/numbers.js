import * as THREE from "three";
import { TAU, angleDiff, rand } from "../shared/util.js";
import { EYE } from "../shared/vr.js";
import { makeNumber } from "./hud.js";

// span: quanto (em radianos, para cada lado) os números se espalham a partir da frente.
const STAGES = [
  { count: 5, span: 0.85 },
  { count: 10, span: 1.7 },
  { count: 10, span: Math.PI },
];
export const NUMBERS_TOTAL = STAGES.reduce((sum, s) => sum + s.count, 0);
const SCALE = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5, 1174.66, 1318.51];
const WORDS = ["um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
const COLORS = ["#ff5f9e", "#ff9f43", "#f5b700", "#40c057", "#3ec1ff", "#9b7bff"];
const STAGE_PAUSE = 1.8;

// Terminar sempre vale 1 estrela; rapidez dá as outras.
export function numberStars(seconds) {
  return seconds <= 40 ? 3 : seconds <= 60 ? 2 : 1;
}

const tmpStart = new THREE.Vector3();
const tmpDir = new THREE.Vector3();
const tmpEnd = new THREE.Vector3();
const tmpPos = new THREE.Vector3();
const tmpText = new THREE.Vector3();

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// Modo Números: estourar 1, 2, 3... em ordem. Errar não tira nada: a bolha só balança.
export function createNumbers({ bubbles, effects, audio, emitters, critters, world, panFor, front, pickFriend, saveFriend }) {
  const labels = Array.from({ length: 10 }, (_, i) => makeNumber(i + 1, COLORS[i % COLORS.length]));
  const live = [];
  const queue = [];
  let stage = 0;
  let expected = 1;
  let found = 0;
  let elapsed = 0;
  let clock = 0;
  let pause = 0;
  let done = false;
  let doneT = 0;
  let baseYaw = 0;

  function nearestFlower(angle) {
    let best = 0;
    let min = Infinity;
    emitters.flowers.forEach((f, i) => {
      const d = Math.abs(angleDiff(f.angle, angle));
      if (d < min) {
        min = d;
        best = i;
      }
    });
    return best;
  }

  function startStage() {
    const st = STAGES[stage];
    expected = 1;
    live.length = 0;
    const full = st.span >= Math.PI;
    const order = shuffle(Array.from({ length: st.count }, (_, i) => i + 1));
    for (let i = 0; i < st.count; i++) {
      const angle = full
        ? baseYaw + (i / st.count) * TAU + rand(-0.12, 0.12)
        : baseYaw - st.span + (2 * st.span * (i + 0.5)) / st.count + rand(-0.06, 0.06);
      const y = EYE + (i % 2 ? 0.55 : -0.15) + rand(-0.08, 0.08);
      queue.push({ at: clock + 0.3 + i * 0.22, number: order[i], angle, y });
    }
  }

  function start(yaw) {
    baseYaw = yaw;
    stage = 0;
    found = 0;
    elapsed = 0;
    pause = 0;
    done = false;
    doneT = 0;
    queue.length = 0;
    startStage();
  }

  function spawn(q) {
    const index = nearestFlower(q.angle);
    emitters.spawnPoint(index, tmpStart, tmpDir);
    const dist = rand(2.8, 3.4);
    tmpEnd.set(-Math.sin(q.angle) * dist, q.y, -Math.cos(q.angle) * dist);
    const label = labels[q.number - 1];
    const b = bubbles.spawn("number", tmpStart, tmpDir, tmpEnd, { content: label, approach: rand(1.3, 1.7), emitter: index });
    if (!b) return false;
    b.number = q.number;
    b.hue = (q.number * 0.13) % 1;
    live[q.number] = b;
    emitters.puff(index);
    audio.puff(panFor(tmpStart));
    effects.sparkle(tmpStart, emitters.flowers[index].color, 6, 0.18);
    return true;
  }

  function finishStage(pos) {
    effects.confetti(pos, 60, effects.RAINBOW, 3);
    audio.combo(3);
    world.pulse("#ffcf40", 0.4);
    const friend = critters.make(pickFriend());
    effects.pop(pos, 0.4, "#ff9cc8");
    saveFriend(friend, pos, 0.4);
    stage++;
    if (stage >= STAGES.length) {
      done = true;
      return;
    }
    effects.text(front(3, EYE + 0.6, tmpText), "MUITO BEM!", "#ff5f9e", 0.55, 1.6, 0.3);
    pause = STAGE_PAUSE;
  }

  function hit(b) {
    if (b.kind !== "number" || done) return;
    const pan = panFor(b.view);
    if (b.number !== expected) {
      b.cool = 0.9;
      b.shake = 1;
      audio.boing(pan);
      const right = live[expected];
      if (right?.active) effects.ring(right.view, right.r, "#ffffff", 0.6, 1.8, 0.08);
      return;
    }
    const pos = tmpPos.copy(b.view);
    const r = b.r;
    const color = COLORS[(expected - 1) % COLORS.length];
    bubbles.pop(b)?.removeFromParent();
    live[expected] = null;
    audio.popNote(SCALE[expected - 1], pan);
    audio.say(WORDS[expected - 1]);
    effects.pop(pos, r, color);
    effects.sparkle(pos, color, 10, 0.3, 0.16);
    tmpText.copy(pos);
    tmpText.y += 0.4;
    effects.text(tmpText, String(expected), color, 0.5, 1.0, 0.5);
    found++;
    expected++;
    if (expected > STAGES[stage].count) finishStage(pos);
  }

  function update(dt) {
    clock += dt;
    if (done) {
      doneT += dt;
      return;
    }
    if (pause > 0) {
      pause -= dt;
      if (pause <= 0) startStage();
    } else {
      elapsed += dt;
    }
    for (let i = queue.length - 1; i >= 0; i--) {
      const q = queue[i];
      if (clock < q.at) continue;
      if (spawn(q)) queue.splice(i, 1);
      else q.at = clock + 0.3;
    }
    const next = live[expected];
    for (const b of live) if (b?.active) b.glow = b === next ? 1 : 0;
    if (next?.active && next.age > next.approach && Math.random() < dt * 6) {
      effects.sparkle(next.view, "#ffffff", 1, next.r * 0.9, 0.12);
    }
  }

  function nextBubble() {
    const b = live[expected];
    return b?.active ? b : null;
  }

  return {
    start,
    hit,
    update,
    nextBubble,
    get found() {
      return found;
    },
    get next() {
      return done || pause > 0 ? null : expected;
    },
    get elapsed() {
      return elapsed;
    },
    // Espera um instante depois do último número para a festa da etapa aparecer.
    get finished() {
      return done && doneT > 1.4;
    },
  };
}
