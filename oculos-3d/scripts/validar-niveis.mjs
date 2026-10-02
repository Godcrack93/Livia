// Confere os mapas do labirinto: caminho do início à toca, estrelas e chave alcançáveis.
import { LEVELS, stagesOf } from "../src/labirinto/levels.js";

const VALID = new Set("#._SG*oC~m><^vBkD1234");
const BLOCK = new Set("#_oB");
const PAIRS = { 1: "2", 2: "1", 3: "4", 4: "3" };
let problems = 0;

function fail(where, msg) {
  problems += 1;
  console.log(`  ✗ ${where}: ${msg}`);
}

function find(map, ch) {
  const out = [];
  map.forEach((row, r) => [...row].forEach((c, k) => c === ch && out.push([r, k])));
  return out;
}

function reach(map, start, doorsOpen) {
  const seen = new Set([start.join(",")]);
  const queue = [start];
  while (queue.length) {
    const [r, c] = queue.shift();
    const here = map[r][c];
    const next = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];
    if (PAIRS[here]) next.push(...find(map, PAIRS[here]));
    for (const [nr, nc] of next) {
      const ch = map[nr]?.[nc];
      if (ch === undefined || BLOCK.has(ch) || (ch === "D" && !doorsOpen)) continue;
      const key = `${nr},${nc}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push([nr, nc]);
    }
  }
  return seen;
}

LEVELS.forEach((level, li) => {
  const stages = stagesOf(level);
  stages.forEach((stage, si) => {
    const where = `nível ${li + 1}${level.finale ? ` parte ${si + 1}` : ""} (${level.name})`;
    const map = stage.map;
    const width = map[0].length;
    map.forEach((row, r) => {
      if (row.length !== width) fail(where, `linha ${r} tem ${row.length} casas (esperado ${width})`);
      for (const ch of row) if (!VALID.has(ch)) fail(where, `caractere desconhecido "${ch}" na linha ${r}`);
    });
    const starts = find(map, "S");
    const goals = find(map, "G");
    if (starts.length !== 1) fail(where, `precisa de 1 início (S), tem ${starts.length}`);
    if (goals.length !== 1) fail(where, `precisa de 1 toca (G), tem ${goals.length}`);
    for (const p of ["1", "2", "3", "4"]) {
      const n = find(map, p).length;
      if (n > 1) fail(where, `portal ${p} aparece ${n} vezes`);
      if (n === 1 && find(map, PAIRS[p]).length !== 1) fail(where, `portal ${p} sem par`);
    }
    const stars = find(map, "*");
    const expected = level.finale ? 1 : 3;
    if (stars.length !== expected) fail(where, `tem ${stars.length} estrelas (esperado ${expected})`);
    if (!starts.length || !goals.length) return;
    const keys = find(map, "k");
    const doors = find(map, "D");
    let seen = reach(map, starts[0], false);
    if (doors.length) {
      if (!keys.some((k) => seen.has(k.join(",")))) fail(where, "a chave não é alcançável antes da porta");
      seen = reach(map, starts[0], true);
    }
    if (!seen.has(goals[0].join(","))) fail(where, "não há caminho do início até a toca");
    for (const s of stars) if (!seen.has(s.join(","))) fail(where, `estrela em [${s}] inalcançável`);
    console.log(`  ✓ ${where}: ${map.length}x${width}`);
  });
});

if (problems) {
  console.log(`\n${problems} problema(s).`);
  process.exit(1);
}
console.log("\nTodos os níveis estão ok.");
