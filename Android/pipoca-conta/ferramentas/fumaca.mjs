// Pipoca Aprende — teste de fumaça: joga cada estação da trilha sozinho (com gestos certos e toque real) até a tela de
// Parabéns, em lotes paralelos, e resume quem passou. Uso:
//   node ferramentas/fumaca.mjs [--estacoes 1-60] [--lote 4] [--tamanho 1280x800] [--toque] [--rapido]
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, l) => a.startsWith('--') ? [a.slice(2), l[i + 1] && !l[i + 1].startsWith('--') ? l[i + 1] : true] : null).filter(Boolean));
const [de, ate] = String(args.estacoes || '1-60').split('-').map(Number);
const LOTE = Number(args.lote || 4);
const TAM = args.tamanho || '1280x800';

function rodar(n) {
  return new Promise(resolve => {
    const passos = [
      { esperar: 'ocioso' },
      { jogarAte: "!!document.querySelector('.parabens')", max: 120 },
      { esperar: 1500 },
      { foto: 'estacao-' + String(n).padStart(2, '0') },
      { avaliar: 'JSON.stringify(PC.debug.verificarLayout())' },
    ];
    const lista = ['ferramentas/testar.mjs', '--url', `#estacao=${n}&assinante=1&progresso=${n - 1}&semente=${n}`,
      '--tamanho', TAM, '--saida', 'ferramentas/saida/fumaca', '--passos-json', JSON.stringify(passos), '--limite', '400000'];
    if (args.toque) lista.push('--toque', '--densidade', '2');
    if (args.rapido) lista.push('--rapido');
    const t0 = Date.now();
    const p = spawn(process.execPath, lista, { cwd: path.resolve(AQUI, '..') });
    let saida = '';
    p.stdout.on('data', d => { saida += d; });
    p.stderr.on('data', d => { saida += d; });
    p.on('close', codigo => resolve({ n, ok: codigo === 0, segundos: Math.round((Date.now() - t0) / 1000), saida }));
  });
}

const fila = [];
for (let n = de; n <= ate; n++) fila.push(n);
const resultados = [];
async function trabalhador() { while (fila.length) { const n = fila.shift(); const r = await rodar(n); resultados.push(r); console.log(`${r.ok ? 'ok  ' : 'FALHA'} estação ${r.n} (${r.segundos} s)`); } }
await Promise.all(Array.from({ length: LOTE }, trabalhador));
resultados.sort((a, b) => a.n - b.n);
const falhas = resultados.filter(r => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} estações chegaram ao Parabéns sem erros.`);
for (const f of falhas) {
  console.log(`\n===== estação ${f.n} =====`);
  console.log(f.saida.split('\n').filter(l => /ERRO|FALHA|\[error\]|\[warning\]|exce|PC\.erros|→ \"\[\{/.test(l)).slice(0, 25).join('\n'));
}
process.exitCode = falhas.length ? 1 : 0;
