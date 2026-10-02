import * as THREE from "three";
import { createAim } from "../shared/aim.js";
import { createCritters } from "../shared/critters.js";
import { createEffects } from "../shared/effects.js";
import { EYE } from "../shared/vr.js";
import { createBall } from "./ball.js";
import { createBoard } from "./board.js";
import { createControl } from "./control.js";
import { createGame } from "./game.js";
import { createPhysics } from "./physics.js";
import { createProgress } from "./progress.js";
import { createScenery } from "./scenery.js";
import { createUI } from "./ui.js";

// Labirinto Mágico como módulo da página única: o renderizador, o VR e o som vêm de src/main.js.
export function createLabirinto({ renderer, vr, audio, onExit }) {
  const scenery = createScenery(renderer);
  const scene = scenery.scene;
  const critters = createCritters(scene);
  const head = new THREE.Object3D();
  head.position.set(0, EYE, 0);
  const effects = createEffects(scene, head);
  const board = createBoard(scene, critters);
  scenery.aimSun(board.root.position);
  const ball = createBall(critters);
  ball.attach(board.tilt);
  const physics = createPhysics();
  const control = createControl();
  const progress = createProgress();
  const ui = createUI(scene);
  const aim = createAim();
  scene.add(aim.reticle);
  const game = createGame({ board, ball, physics, control, progress, ui, audio, effects, scenery, critters, vr, head, onExit });
  game.toAttract();
  let elapsed = 0;
  let lastState = game.state;

  return {
    scene,
    enter() {
      game.toMap();
    },
    leave() {
      ui.setFocus(null);
      game.toAttract();
    },
    frame(dt, looker) {
      elapsed += dt;
      head.position.setFromMatrixPosition(looker.matrixWorld);
      head.quaternion.setFromRotationMatrix(looker.matrixWorld);
      const res = aim.update(dt, vr, looker, ui.pick, vr.consumeClick());      ui.setFocus(res.target);
      if (res.entered) game.hover(res.target);
      if (res.done) game.select(res.target);
      aim.reticle.visible = !game.onBoard || res.target !== null;
      game.update(dt, elapsed, aim.origin, aim.direction);
      if (game.state !== lastState && (game.state === "map" || game.state === "results")) aim.pause(0.9);
      lastState = game.state;
      critters.update(dt, elapsed);
      effects.update(dt);
      // O tabuleiro se mexe: a sombra é recalculada uma vez por quadro (e não uma vez por olho).
      renderer.shadowMap.needsUpdate = true;
    },
    resetProgress() {
      progress.reset();
      game.toAttract();
    },
  };
}
