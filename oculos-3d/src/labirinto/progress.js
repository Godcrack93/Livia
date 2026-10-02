import { LEVELS } from "./levels.js";

const KEY = "labirinto-progresso";

// Melhor número de estrelas de cada nível (-1 = ainda não terminado). "?todos" na URL libera todos.
export function createProgress() {
  let best = LEVELS.map(() => -1);
  const all = new URLSearchParams(window.location.search).has("todos");

  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
    if (Array.isArray(saved?.best)) best = LEVELS.map((_, i) => (Number.isInteger(saved.best[i]) ? saved.best[i] : -1));
  } catch {
    // Progresso ilegível: começa do zero.
  }

  function save() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ best }));
    } catch {
      // Sem localStorage: vale só até recarregar.
    }
  }

  function unlocked(i) {
    return all || i === 0 || best[i - 1] >= 0;
  }

  function complete(i, stars) {
    const previous = best[i];
    if (stars > best[i]) best[i] = stars;
    save();
    return { best: best[i], isNew: stars > Math.max(0, previous), first: previous < 0 };
  }

  function reset() {
    best = LEVELS.map(() => -1);
    save();
  }

  return {
    stars: (i) => best[i],
    unlocked,
    complete,
    reset,
    total: () => best.reduce((sum, s) => sum + Math.max(0, s), 0),
    done: () => best.filter((s) => s >= 0).length,
    // Nível sugerido: o primeiro ainda não terminado (ou o último).
    next: () => {
      const i = best.findIndex((s) => s < 0);
      return i < 0 ? LEVELS.length - 1 : i;
    },
  };
}
