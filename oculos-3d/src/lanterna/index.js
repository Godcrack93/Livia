import * as THREE from "three";
import { createAim } from "../shared/aim.js";
import { createCritters } from "../shared/critters.js";
import { createEffects } from "../shared/effects.js";
import { EYE } from "../shared/vr.js";
import { createBasket } from "./basket.js";
import { createEyes } from "./eyes.js";
import { createGame } from "./game.js";
import { createGhosts } from "./ghosts.js";
import { createHint } from "./hint.js";
import { createLantern } from "./lantern.js";
import { NIGHTS } from "./nights.js";
import { createOwl } from "./owl.js";
import { createProgress } from "./progress.js";
import { createUI } from "./ui.js";
import { createForest } from "./world.js";

const none = () => undefined;

// Lanterna na Floresta como módulo da página única: o renderizador, o VR e o som vêm de src/main.js.
export function createLanterna({ vr, audio, onExit }) {
  const forest = createForest();
  const scene = forest.scene;
  const head = new THREE.Object3D();
  head.position.set(0, EYE, 0);
  const effects = createEffects(scene, head);
  const critters = createCritters(scene, { groundAt: forest.heightAt });
  const basket = createBasket(scene, forest.heightAt);
  const lantern = createLantern(scene, { onFlare: () => audio.flare() });
  const ghosts = createGhosts(scene, { audio, lantern, makeCandy: basket.makeCandy });
  const owl = createOwl(scene, forest.perch);
  const eyes = createEyes(scene);
  const hint = createHint(scene);
  const ui = createUI(scene);
  const progress = createProgress();
  const aim = createAim();
  scene.add(aim.reticle);
  const game = createGame({ forest, effects, critters, lantern, ghosts, owl, basket, eyes, hint, ui, progress, audio, head, onExit });
  game.toAttract();

  // Para testar: ?jogo=lanterna&noite=3 começa direto na noite 3 (com &todas, mesmo sem ter vencido as anteriores).
  let firstNight = Number(new URLSearchParams(window.location.search).get("noite")) - 1;
  if (!(firstNight >= 0 && firstNight < NIGHTS.length && progress.unlocked(firstNight))) firstNight = -1;
  let elapsed = 0;
  let wasMenu = false;

  return {
    scene,
    enter() {
      audio.setOwl(owl.position);
      if (firstNight >= 0) game.startNight(firstNight);
      else game.toTitle();
      firstNight = -1;
      aim.pause(0.9);
    },
    leave() {
      ui.setFocus(null);
      game.toAttract();
    },
    frame(dt, looker, playing) {
      elapsed += dt;
      head.position.setFromMatrixPosition(looker.matrixWorld);
      head.quaternion.setFromRotationMatrix(looker.matrixWorld);
      const menu = game.inMenu && playing;
      const res = aim.update(dt, vr, looker, menu ? ui.pick : none, vr.consumeClick());
      ui.setFocus(menu ? res.target : null);
      if (menu && res.entered && res.target) game.hover(res.target);
      if (menu && res.done && res.target) game.select(res.target);
      aim.reticle.visible = menu;
      if (menu && !wasMenu) aim.pause(0.9);
      wasMenu = menu;
      game.update(dt, aim.origin, aim.direction);
      critters.update(dt, elapsed);
      effects.update(dt);
    },
  };
}
