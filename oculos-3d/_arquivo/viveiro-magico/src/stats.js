const WINDOW_MS = 500;
const WARMUP_MS = 1500;

function short(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// Medidor para comparar os níveis de detalhe: FPS a cada meio segundo, triângulos e desenhos por quadro.
export function createStats(renderer, label) {
  const live = document.querySelector("#stats");
  const summary = document.querySelector("#last-stats");
  renderer.info.autoReset = false;
  let last = performance.now();
  let playedMs = 0;
  let frames = 0;
  let acc = 0;
  let sum = 0;
  let samples = 0;
  let worst = Infinity;
  let maxTriangles = 0;

  return {
    begin() {
      renderer.info.reset();
    },
    end(playing) {
      const now = performance.now();
      const ms = now - last;
      last = now;
      if (!playing || ms > 1000) return;
      playedMs += ms;
      if (playedMs < WARMUP_MS) return;
      frames += 1;
      acc += ms;
      const { triangles, calls } = renderer.info.render;
      if (triangles > maxTriangles) maxTriangles = triangles;
      if (acc < WINDOW_MS) return;
      const fps = (frames * 1000) / acc;
      frames = 0;
      acc = 0;
      sum += fps;
      samples += 1;
      if (fps < worst) worst = fps;
      live.textContent = `${Math.round(fps)} FPS · ${short(triangles)} triângulos · ${calls} desenhos · detalhe ${label}`;
    },
    report() {
      if (samples > 0) {
        summary.textContent =
          `Última partida (detalhe ${label}): média ${Math.round(sum / samples)} FPS, ` +
          `pior ${Math.round(worst)} FPS, até ${short(maxTriangles)} triângulos por quadro.`;
        summary.hidden = false;
      }
      playedMs = 0;
      frames = 0;
      acc = 0;
      sum = 0;
      samples = 0;
      worst = Infinity;
      maxTriangles = 0;
      live.textContent = "";
    },
  };
}
