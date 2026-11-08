// Pipoca Conta — servidor local para abrir o jogo no navegador (só para desenvolvimento).
// Uso: node ferramentas/servidor.mjs [--porta=5181]
// Abre a pasta jogo/ em http://localhost:<porta>/ (a raiz mostra o index.html).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const PASTA_JOGO = path.resolve(AQUI, '..', 'jogo');

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

/** Cria (sem ligar) um servidor que entrega os arquivos de `pasta`. */
export function criarServidor(pasta = PASTA_JOGO) {
  const raiz = path.resolve(pasta);
  return http.createServer((req, res) => {
    let rota;
    try { rota = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { rota = '/'; }
    if (rota.endsWith('/')) rota += 'index.html';
    const arquivo = path.resolve(raiz, '.' + rota);
    if (arquivo !== raiz && !arquivo.startsWith(raiz + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.readFile(arquivo, (erro, dados) => {
      if (erro) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Não encontrado: ' + rota); return; }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(dados);
    });
  });
}

/** Liga o servidor numa porta (0 = qualquer livre). Devolve { servidor, porta, url }. */
export function ligar(porta = 0, pasta = PASTA_JOGO) {
  const servidor = criarServidor(pasta);
  return new Promise((resolve, reject) => {
    servidor.once('error', reject);
    servidor.listen(porta, '127.0.0.1', () => {
      const p = servidor.address().port;
      resolve({ servidor, porta: p, url: `http://localhost:${p}/` });
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = process.argv.find(a => a.startsWith('--porta='));
  const porta = Number(arg ? arg.split('=')[1] : process.env.PORT) || 5181;
  ligar(porta).then(({ url }) => {
    console.log(`\n  Pipoca Conta no ar: ${url}\n  (Ctrl+C para desligar)\n`);
  }).catch(e => { console.error('Não foi possível ligar o servidor:', e.message); process.exit(1); });
}
