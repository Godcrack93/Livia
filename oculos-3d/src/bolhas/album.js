import { CRITTERS, RARE_CRITTERS } from "../shared/critters.js";

const KEY = "bolhas-album";

export const NAMES = {
  pintinho: "Pintinho",
  coelhinho: "Coelhinho",
  joaninha: "Joaninha",
  peixinho: "Peixinho",
  sapinho: "Sapinho",
  gatinho: "Gatinho",
  porquinho: "Porquinho",
  cachorrinho: "Cachorrinho",
  patinho: "Patinho",
  ursinho: "Ursinho",
  pinguim: "Pinguim",
  unicornio: "Unicórnio",
  dragaozinho: "Dragãozinho",
};

// Para um raro novo: o nome em RARE_CRITTERS (critters.js) e a regra aqui.
const RULES = {
  pinguim: {
    ok: (d) => d.games >= 3,
    hint: (d) => ["JOGUE 3 VEZES", `${Math.min(d.games, 3)} de 3`],
  },
  unicornio: {
    ok: (d) => d.totalSaved >= 40,
    hint: (d) => ["SALVE 40 AMIGOS", `${Math.min(d.totalSaved, 40)} de 40`],
  },
  dragaozinho: {
    ok: (d) => d.bestStars >= 3,
    hint: () => ["FAÇA 3 ESTRELAS", "NUMA PARTIDA"],
  },
};

function blank() {
  return { counts: {}, games: 0, totalSaved: 0, bestStars: 0, unlocked: [], pending: [] };
}

function load() {
  const data = blank();
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
    if (raw && typeof raw === "object") {
      if (raw.counts && typeof raw.counts === "object") {
        for (const [type, n] of Object.entries(raw.counts)) if (NAMES[type]) data.counts[type] = Number(n) || 0;
      }
      data.games = Number(raw.games) || 0;
      data.totalSaved = Number(raw.totalSaved) || 0;
      data.bestStars = Number(raw.bestStars) || 0;
      if (Array.isArray(raw.unlocked)) data.unlocked = raw.unlocked.filter((t) => RULES[t]);
      if (Array.isArray(raw.pending)) data.pending = raw.pending.filter((t) => RULES[t]);
    }
  } catch {
    // Álbum corrompido ou sem localStorage: começa vazio.
  }
  return data;
}

export function createAlbum() {
  const data = load();

  function save() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Sem localStorage: o álbum vale só nesta sessão.
    }
  }

  function isUnlocked(type) {
    return !RULES[type] || data.unlocked.includes(type);
  }

  function refreshUnlocks() {
    const fresh = [];
    for (const type of RARE_CRITTERS) {
      if (data.unlocked.includes(type) || !RULES[type].ok(data)) continue;
      data.unlocked.push(type);
      data.pending.push(type);
      fresh.push(type);
    }
    return fresh;
  }

  // Devolve true se é a primeira vez que este bichinho é salvo.
  function addFriend(type) {
    const isNew = !data.counts[type];
    data.counts[type] = (data.counts[type] || 0) + 1;
    data.totalSaved += 1;
    save();
    return isNew;
  }

  // Fecha uma partida; devolve os raros que acabaram de ser liberados.
  function addGame(stars) {
    data.games += 1;
    data.bestStars = Math.max(data.bestStars, stars);
    const fresh = refreshUnlocks();
    save();
    return fresh;
  }

  // Raro recém-liberado que ainda não apareceu: a próxima partida garante uma aparição.
  function takePendingRare() {
    const type = data.pending.shift() ?? null;
    if (type) save();
    return type;
  }

  function unlockedRares() {
    return data.unlocked;
  }

  function entries() {
    return [...CRITTERS, ...RARE_CRITTERS].map((type) => {
      const count = data.counts[type] || 0;
      return {
        type,
        name: NAMES[type],
        count,
        rare: RARE_CRITTERS.includes(type),
        state: count > 0 ? "found" : isUnlocked(type) ? "unlocked" : "locked",
        hint: RULES[type]?.hint(data),
      };
    });
  }

  return { addFriend, addGame, takePendingRare, unlockedRares, entries, isUnlocked };
}
