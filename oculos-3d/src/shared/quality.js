const KEY = "bolhas-qualidade";

function read() {
  try {
    return window.localStorage.getItem(KEY) !== "leve";
  } catch {
    return true;
  }
}

export const HIGH = read();

export function setHigh(on) {
  try {
    window.localStorage.setItem(KEY, on ? "bonito" : "leve");
  } catch {
    // Sem localStorage: vale só até recarregar.
  }
}
