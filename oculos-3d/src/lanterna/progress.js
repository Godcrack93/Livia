import { DEFAULT_LEVEL, LEVELS, NIGHTS } from "./nights.js";

export const PROGRESS_KEY = "lanterna-progresso";

function read() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "null");
    const best = Array.isArray(saved?.best) ? saved.best.map((n) => (n == null ? -1 : Number(n) || 0)) : [];
    const level = Number.isInteger(saved?.level) && LEVELS[saved.level] ? saved.level : DEFAULT_LEVEL;
    return { best, level, seen: saved?.seen && typeof saved.seen === "object" ? saved.seen : {} };
  } catch {
    return { best: [], level: DEFAULT_LEVEL, seen: {} };
  }
}

// Estrelas de cada noite, nível de susto escolhido e fantasminhas já apresentados pela coruja.
export function createProgress() {
  const data = read();
  // lanterna?todas (ou ?jogo=lanterna&todas) libera todas as noites para testar.
  const all = new URLSearchParams(window.location.search).has("todas");

  function save() {
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    } catch {
      // Sem localStorage: vale só nesta sessão.
    }
  }

  return {
    stars(i) {
      return data.best[i] ?? -1;
    },
    unlocked(i) {
      return i >= 0 && i < NIGHTS.length && (all || i === 0 || (data.best[i - 1] ?? -1) >= 0);
    },
    finish(i, stars) {
      if (stars > (data.best[i] ?? -1)) {
        data.best[i] = stars;
        save();
      }
    },
    // Primeira noite ainda não vencida (ou a última, quando já venceu todas).
    suggested() {
      for (let i = 0; i < NIGHTS.length; i++) if ((data.best[i] ?? -1) < 0) return i;
      return NIGHTS.length - 1;
    },
    get level() {
      return data.level;
    },
    set level(value) {
      data.level = value;
      save();
    },
    seen(type) {
      return Boolean(data.seen[type]);
    },
    markSeen(type) {
      if (data.seen[type]) return false;
      data.seen[type] = true;
      save();
      return true;
    },
  };
}
