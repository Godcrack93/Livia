// Servidor simples para jogar no tablet ou celular pela mesma rede Wi-Fi. Não precisa instalar nada além do Node.js.
// Uso: node servidor.js [--abrir] [--porta=4321]   (ou dois cliques em iniciar-jogo.bat)
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const argPorta = (process.argv.find(a => a.startsWith('--porta=')) || '').split('=')[1];
const PORTA = Number(argPorta) || Number(process.env.PORT) || 4321;
const PASTA = __dirname;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

const servidor = http.createServer((req, res) => {
  let rota;
  try { rota = decodeURIComponent(req.url.split('?')[0]); } catch (e) { rota = '/'; }
  const arquivo = path.join(PASTA, rota === '/' ? 'index.html' : rota);
  if (!arquivo.startsWith(PASTA + path.sep)) { res.writeHead(404); res.end(); return; }
  fs.readFile(arquivo, (erro, dados) => {
    if (erro) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Arquivo não encontrado'); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(dados);
  });
});

servidor.on('error', erro => {
  console.log(erro.code === 'EADDRINUSE'
    ? `\n  A porta ${PORTA} ja esta em uso. Feche a outra janela do jogo e tente de novo.\n`
    : `\n  Nao foi possivel ligar o servidor: ${erro.message}\n`);
  process.exitCode = 1;
});

servidor.listen(PORTA, () => {
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter(i => i && (i.family === 'IPv4' || i.family === 4) && !i.internal && !i.address.startsWith('169.254.'))
    .map(i => i.address);
  console.log('\n  Jogos da Livia no ar!\n');
  console.log(`  Neste computador:     http://localhost:${PORTA}`);
  ips.forEach(ip => console.log(`  No tablet ou celular: http://${ip}:${PORTA}`));
  console.log('\n  O tablet precisa estar na mesma rede Wi-Fi deste computador.');
  console.log('  Para desligar, feche esta janela.\n');
  if (process.argv.includes('--abrir') && process.platform === 'win32') {
    require('child_process').exec(`start "" "http://localhost:${PORTA}"`);
  }
});
