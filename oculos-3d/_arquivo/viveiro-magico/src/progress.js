const KEY = "viveiro-magico-v1";
export const MAX_POTS = 4;

function fresh() {
  return { money: 0, served: 0, seeds: ["tomate"], pots: 1, baskets: {}, potState: [] };
}

export function createProgress() {
  let data = load();
  let frozen = false;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && typeof saved === "object") return { ...fresh(), ...saved };
    } catch {
      // Sem localStorage ou dado corrompido: começa do zero.
    }
    return fresh();
  }

  function save() {
    if (frozen) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Sem localStorage: o progresso vale só nesta partida.
    }
  }

  // Depois de reset a página recarrega; congelar evita que o jogo antigo salve por cima.
  function reset() {
    data = fresh();
    frozen = true;
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Nada salvo para apagar.
    }
  }

  return {
    get data() {
      return data;
    },
    load() {
      data = load();
    },
    save,
    reset,
    unlockSeed(id) {
      if (data.seeds.includes(id)) return;
      data.seeds.push(id);
      save();
    },
    addPot() {
      if (data.pots >= MAX_POTS) return;
      data.pots += 1;
      save();
    },
  };
}
