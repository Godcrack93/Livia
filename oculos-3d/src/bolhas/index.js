import * as THREE from "three";
import { createAim } from "../shared/aim.js";
import { createCritters } from "../shared/critters.js";
import { createEffects } from "../shared/effects.js";
import { EYE } from "../shared/vr.js";
import { createAlbum } from "./album.js";
import { createBubbles } from "./bubbles.js";
import { createEmitters } from "./emitters.js";
import { createGame } from "./game.js";
import { createHud } from "./hud.js";
import { createMeadow } from "./meadow.js";
import { createNature } from "./nature.js";
import { createPointer } from "./pointer.js";
import { createSkyRainbow } from "./sky-rainbow.js";
import { createWorld, heightAt } from "./world.js";

// Estoura-Bolhas como módulo da página única: o renderizador, o VR e o som vêm de src/main.js.
export function createBolhas({ renderer, vr, audio, onExit }) {
  const world = createWorld();
  const scene = world.scene;
  const nature = createNature(scene);
  const emitters = createEmitters(scene);
  const critters = createCritters(scene, { groundAt: heightAt });
  const head = new THREE.Object3D();
  head.position.set(0, EYE, 0);
  const effects = createEffects(scene, head);
  let game = null;
  const bubbles = createBubbles(scene, { onExpire: (b, content) => game?.releaseContent(content) });
  const hud = createHud(scene);
  const aim = createAim();
  scene.add(aim.reticle);
  game = createGame({
    world,
    nature,
    bubbles,
    critters,
    effects,
    hud,
    audio,
    emitters,
    head,
    meadow: createMeadow(scene, critters, { groundAt: heightAt }),
    pointer: createPointer(scene),
    skyRainbow: createSkyRainbow(scene),
    album: createAlbum(),
    onExit,
  });
  game.toAttract();

  return {
    scene,
    enter() {
      // O cenário não se move: a sombra é calculada uma vez ao entrar.
      renderer.shadowMap.needsUpdate = true;
      aim.pause(0.6);
      game.toTitle(0);
    },
    leave() {
      bubbles.setFocus(null, 0);
      game.toAttract();
    },
    frame(dt, looker) {
      head.position.setFromMatrixPosition(looker.matrixWorld);
      head.quaternion.setFromRotationMatrix(looker.matrixWorld);
      const res = aim.update(dt, vr, looker, bubbles.pick, vr.consumeClick());
      bubbles.setFocus(res.target, res.progress);
      if (res.entered) game.hover(res.target);
      if (res.done) game.hit(res.target);
      world.update(dt);
      nature.update(dt);
      game.update(dt);
    },
  };
}
