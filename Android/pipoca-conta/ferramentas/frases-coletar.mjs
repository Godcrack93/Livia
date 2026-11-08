// Pipoca Aprende — coleta as falas do jogo, na ordem em que aparecem: um robô joga cada estação da trilha
// (com vários sorteios) e anota tudo o que a Pipoca fala (PC.debug.falas, gravado por voz.js no navegador).
// Ele também fica parado um pouco no começo de cada estação, para ouvir a ajuda de quem demora.
// Uso:
//   node ferramentas/frases-coletar.mjs [--estacoes 1-60] [--sementes 8] [--lote 6]
// Saída: ferramentas/saida/falas-coletadas.json  →  [{ estacao, semente, falas: [...] }, ...]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const args = Object.fromEntries(process.argv.slice(2).map((a, i, l) => a.startsWith('--') ? [a.slice(2), l[i + 1] && !l[i + 1].startsWith('--') ? l[i + 1] : true] : null).filter(Boolean));
const [de, ate] = String(args.estacoes || '1-60').split('-').map(Number);
const SEMENTES = Number(args.sementes || 8);
const LOTE = Number(args.lote || 6);
const SAIDA = path.join(AQUI, 'saida', 'falas-coletadas.json');

function rodar(n, semente) {
  return new Promise(resolve => {
    const passos = [
      { esperar: 'ocioso' },
      { esperar: semente % 2 ? 9000 : 0 },            // metade das vezes fica parado: ouve a ajuda
      { jogarAte: "!!document.querySelector('.parabens')", max: 140 },
      { esperar: 1500 },
      { avaliar: "({marca: 'FALAS', falas: PC.debug.falas || []})" },
    ];
    const lista = ['ferramentas/testar.mjs', '--url', `#estacao=${n}&assinante=1&progresso=${n - 1}&semente=${semente * 100 + n}`,
      '--tamanho', '1280x800', '--saida', 'ferramentas/saida/coleta', '--passos-json', JSON.stringify(passos), '--limite', '400000', '--rapido'];
    const p = spawn(process.execPath, lista, { cwd: RAIZ });
    let saida = '';
    p.stdout.on('data', d => { saida += d; });
    p.stderr.on('data', d => { saida += d; });
    p.on('close', codigo => {
      const linha = saida.split('\n').find(l => l.includes('→ {"marca":"FALAS"'));
      let falas = [];
      try { falas = JSON.parse(linha.slice(linha.indexOf('{'))).falas; } catch (e) { /* sem falas */ }
      resolve({ estacao: n, semente, ok: codigo === 0, falas });
    });
  });
}

const fila = [];
for (let s = 1; s <= SEMENTES; s++) for (let n = de; n <= ate; n++) fila.push([n, s]);
const resultados = [];
async function trabalhador() {
  while (fila.length) {
    const [n, s] = fila.shift();
    const r = await rodar(n, s);
    resultados.push(r);
    console.log(`${r.ok ? 'ok  ' : 'FALHA'} estação ${n} semente ${s}: ${r.falas.length} falas`);
  }
}
await Promise.all(Array.from({ length: LOTE }, trabalhador));
resultados.sort((a, b) => a.estacao - b.estacao || a.semente - b.semente);
fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
fs.writeFileSync(SAIDA, JSON.stringify(resultados, null, 1));
console.log(`\nSalvo em ${SAIDA}`);
