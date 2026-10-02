export function createAudio() {
  let ctx = null;
  let enabled = true;

  function unlock() {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  }

  function setEnabled(value) {
    enabled = value;
  }

  // Para um som novo: outro nome em play().
  function play(name) {
    if (!ctx || !enabled) return;
    const now = ctx.currentTime;
    if (name === "agua") tone(now, 520, 0.18, 0.06);
    if (name === "colheita") {
      tone(now, 784, 0.12, 0.06);
      tone(now + 0.09, 1046, 0.2, 0.06);
    }
    if (name === "semente") tone(now, 440, 0.1, 0.05);
    if (name === "plantar") {
      tone(now, 392, 0.12, 0.05);
      tone(now + 0.1, 523, 0.18, 0.05);
    }
    if (name === "chuva") {
      for (const [delay, freq] of [
        [0, 1320],
        [0.11, 1180],
        [0.19, 1400],
        [0.31, 1250],
        [0.4, 1480],
      ]) {
        tone(now + delay, freq, 0.07, 0.025);
      }
    }
    if (name === "regar") {
      tone(now, 660, 0.1, 0.04);
      tone(now + 0.12, 590, 0.1, 0.04);
      tone(now + 0.24, 520, 0.16, 0.04);
    }
    if (name === "pegar") tone(now, 330, 0.12, 0.05, "triangle");
    if (name === "crescer") tone(now, 587, 0.2, 0.045, "triangle");
    if (name === "pronto") {
      tone(now, 659, 0.12, 0.06);
      tone(now + 0.1, 880, 0.22, 0.06);
    }
    if (name === "cliente") {
      tone(now, 988, 0.16, 0.05);
      tone(now + 0.16, 784, 0.26, 0.05);
    }
    if (name === "venda") {
      tone(now, 523, 0.1, 0.06);
      tone(now + 0.08, 659, 0.1, 0.06);
      tone(now + 0.16, 1046, 0.22, 0.06);
    }
    if (name === "moeda") {
      tone(now, 1568, 0.06, 0.02, "square");
      tone(now + 0.06, 2093, 0.14, 0.018, "square");
    }
    if (name === "abrir") {
      tone(now, 660, 0.08, 0.045, "triangle");
      tone(now + 0.07, 880, 0.12, 0.045, "triangle");
    }
    if (name === "fechar") {
      tone(now, 880, 0.08, 0.04, "triangle");
      tone(now + 0.07, 660, 0.12, 0.04, "triangle");
    }
    if (name === "comprar") {
      tone(now, 784, 0.1, 0.06);
      tone(now + 0.09, 988, 0.1, 0.06);
      tone(now + 0.18, 1175, 0.1, 0.06);
      tone(now + 0.27, 1568, 0.3, 0.06);
    }
    if (name === "fim") {
      tone(now, 523, 0.2, 0.07);
      tone(now + 0.14, 659, 0.22, 0.07);
      tone(now + 0.28, 784, 0.34, 0.08);
    }
  }

  function note(freq) {
    if (!ctx || !enabled || !freq) return;
    tone(ctx.currentTime, freq, 0.35, 0.05, "triangle");
  }

  function tone(when, freq, dur, gainValue, type = "sine") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(gainValue, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  return {
    unlock,
    setEnabled,
    play,
    note,
    get enabled() {
      return enabled;
    },
  };
}
