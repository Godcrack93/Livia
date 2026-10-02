import * as THREE from "three";

const IPD = 0.064;
const zee = new THREE.Vector3(0, 0, 1);
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion();
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const deviceQ = new THREE.Quaternion();
const offsetQ = new THREE.Quaternion();
const sizeCheck = new THREE.Vector2();

function mobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
}

function screenAngle() {
  const legacy = window.orientation;
  if (typeof legacy === "number") return legacy;
  return screen.orientation?.angle ?? 0;
}

export function createVR(renderer, canvas) {
  const rig = new THREE.Group();
  rig.position.set(0, 1.2, 0);

  const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 40);
  const left = new THREE.PerspectiveCamera(70, 1, 0.05, 40);
  const right = new THREE.PerspectiveCamera(70, 1, 0.05, 40);
  left.position.x = -IPD / 2;
  right.position.x = IPD / 2;
  rig.add(camera, left, right);

  let mode = "menu";
  let yaw = 0.22;
  let pitch = -0.34;
  let width = 1;
  let height = 1;
  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  let clickPending = false;
  const orientation = { alpha: 0, beta: 0, gamma: 0 };
  let hasOrientation = false;
  let source = null;
  let aligned = false;

  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  let onEnd = () => {};

  // Os dois eventos usam referências de "norte" diferentes; misturar faz a imagem pular.
  function onOrientation(event) {
    if (event.beta == null || event.gamma == null) return;
    if (source === null || (source === "deviceorientationabsolute" && event.type === "deviceorientation")) {
      if (source !== event.type) aligned = false;
      source = event.type;
    }
    if (event.type !== source) return;
    orientation.alpha = event.alpha ?? 0;
    orientation.beta = event.beta;
    orientation.gamma = event.gamma;
    hasOrientation = true;
  }

  function listen(on) {
    const method = on ? "addEventListener" : "removeEventListener";
    window[method]("deviceorientation", onOrientation);
    window[method]("deviceorientationabsolute", onOrientation);
  }

  function readDevice() {
    if (!hasOrientation) return false;
    const alpha = THREE.MathUtils.degToRad(orientation.alpha);
    const beta = THREE.MathUtils.degToRad(orientation.beta);
    const gamma = THREE.MathUtils.degToRad(orientation.gamma);
    const orient = THREE.MathUtils.degToRad(screenAngle());
    euler.set(beta, alpha, -gamma, "YXZ");
    deviceQ.setFromEuler(euler);
    deviceQ.multiply(q1);
    deviceQ.multiply(q0.setFromAxisAngle(zee, -orient));
    return true;
  }

  function resize() {
    const view = window.visualViewport;
    width = Math.max(1, Math.round(view?.width ?? window.innerWidth));
    const nextHeight = Math.max(1, Math.round(view?.height ?? window.innerHeight));
    const size = renderer.getSize(sizeCheck);
    height = nextHeight;
    if (size.x !== width || size.y !== height) renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const eye = Math.floor((width - 8) / 2) / height;
    left.aspect = eye;
    right.aspect = eye;
    left.updateProjectionMatrix();
    right.updateProjectionMatrix();
  }

  // Para um modo novo de visão: estenda enter() e render().
  function enter() {
    listen(true);
    mode = mobile() ? "stereo" : "mono";
    resize();

    safe(() => requestOrientation());
    safe(() => document.documentElement.requestFullscreen?.()?.catch(() => undefined));
    safe(() => screen.orientation?.lock?.("landscape")?.catch(() => undefined));
    safe(() =>
      startSession().then(async (session) => {
        if (!session || mode === "menu") {
          session?.end().catch(() => undefined);
          return;
        }
        await renderer.xr.setSession(session);
        mode = "xr";
        session.addEventListener("end", () => {
          mode = "menu";
          onEnd();
        });
      }),
    );

    return mode;
  }

  async function exit() {
    const session = renderer.xr.getSession?.();
    if (session) await session.end().catch(() => undefined);
    listen(false);
    hasOrientation = false;
    source = null;
    aligned = false;
    mode = "menu";
    if (document.fullscreenElement) await document.exitFullscreen?.().catch(() => undefined);
  }

  function update() {
    if (mode === "mono") {
      rig.rotation.order = "YXZ";
      rig.rotation.set(pitch, yaw, 0);
      return;
    }
    if (mode !== "stereo" || !readDevice()) return;
    if (!aligned) {
      offsetQ.copy(deviceQ).invert();
      aligned = true;
    }
    rig.quaternion.copy(offsetQ).multiply(deviceQ);
  }

  function render(scene) {
    if (renderer.xr.isPresenting) {
      renderer.autoClear = true;
      renderer.render(scene, camera);
      return;
    }
    if (mode === "stereo") {
      const eyeW = Math.floor((width - 8) / 2);
      renderer.autoClear = false;
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, width, height);
      renderer.clear();
      renderer.setScissorTest(true);
      renderer.setViewport(0, 0, eyeW, height);
      renderer.setScissor(0, 0, eyeW, height);
      renderer.render(scene, left);
      renderer.setViewport(width - eyeW, 0, eyeW, height);
      renderer.setScissor(width - eyeW, 0, eyeW, height);
      renderer.render(scene, right);
      return;
    }
    renderer.autoClear = true;
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.render(scene, camera);
  }

  function consumeClick() {
    const clicked = clickPending;
    clickPending = false;
    return clicked && mode === "mono";
  }

  function getLooker() {
    if (renderer.xr.isPresenting) {
      renderer.xr.updateCamera(camera);
      return renderer.xr.getCamera();
    }
    rig.updateMatrixWorld(true);
    return rig;
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (mode !== "mono") return;
    dragging = true;
    moved = 0;
    lastX = event.clientX;
    lastY = event.clientY;
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging || mode !== "mono") return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = event.clientX;
    lastY = event.clientY;
    yaw -= dx * 0.005;
    pitch -= dy * 0.005;
    pitch = THREE.MathUtils.clamp(pitch, -1.05, 0.45);
  });
  canvas.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    if (moved < 8) clickPending = true;
  });

  window.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("resize", resize);
  resize();

  return {
    rig,
    enter,
    exit,
    update,
    render,
    consumeClick,
    getLooker,
    setOnEnd(fn) {
      onEnd = fn;
    },
    get mode() {
      return mode;
    },
  };
}

function safe(fn) {
  try {
    const result = fn();
    if (result && typeof result.catch === "function") result.catch(() => undefined);
  } catch {
    // Recurso opcional do navegador; a cena continua sem ele.
  }
}

function requestOrientation() {
  if (typeof DeviceOrientationEvent === "undefined") return;
  if (typeof DeviceOrientationEvent.requestPermission !== "function") return;
  return DeviceOrientationEvent.requestPermission();
}

let xrOk = false;
if (navigator.xr?.isSessionSupported) {
  navigator.xr.isSessionSupported("immersive-vr").then(
    (ok) => {
      xrOk = ok;
    },
    () => {
      xrOk = false;
    },
  );
}

function startSession() {
  if (!xrOk || !navigator.xr?.requestSession) return Promise.resolve(null);
  try {
    return navigator.xr
      .requestSession("immersive-vr", { optionalFeatures: ["local", "local-floor"] })
      .catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}
