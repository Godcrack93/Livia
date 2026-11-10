// Pipoca Aprende — calcula as formas de boca de cada fala gravada (jogo/vozes/*.mp3) e monta jogo/vozes/bocas.js.
// Usa o Rhubarb Lip Sync (gratuito, github.com/DanielSWolf/rhubarb-lip-sync), no modo fonético (serve para português),
// com o texto da frase como dica, e o ffmpeg do pacote Python imageio-ffmpeg para converter mp3 em wav.
// Ferramentas ficam fora do projeto: %LOCALAPPDATA%\pipoca-ferramentas\Rhubarb-Lip-Sync-*\rhubarb.exe
// Só calcula o que ainda não está em bocas.js (rodar de novo é rápido).
// Uso:
//   node ferramentas/bocas-gerar.mjs                      todas as falas gravadas que faltam
//   node ferramentas/bocas-gerar.mjs --so 3402,3403       só essas (pelo número do arquivo)
//   node ferramentas/bocas-gerar.mjs --refazer            calcula tudo de novo
//
// Formato em bocas.js: PC_BOCAS['arquivo.mp3'] = 'B0C6G19A26X198' → forma + início em centésimos de segundo.
// Formas (Rhubarb): A fechada (m, b, p) · B quase fechada (consoantes) · C aberta (e, é) · D bem aberta (a) ·
// E redonda (o, ó) · F biquinho (u) · G dentinho no lábio (f, v) · X descanso.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const VOZES = path.join(RAIZ, 'jogo', 'vozes');
const DESTINO = path.join(VOZES, 'bocas.js');
const args = Object.fromEntries(process.argv.slice(2).map((a, i, l) => a.startsWith('--') ? [a.slice(2), l[i + 1] && !l[i + 1].startsWith('--') ? l[i + 1] : true] : null).filter(Boolean));

const pasta = path.join(process.env.LOCALAPPDATA || os.homedir(), 'pipoca-ferramentas');
const rh = fs.existsSync(pasta) && fs.readdirSync(pasta).filter(n => n.startsWith('Rhubarb')).map(n => path.join(pasta, n, 'rhubarb.exe')).find(f => fs.existsSync(f));
if (!rh) { console.log('Não achei o rhubarb.exe em ' + pasta); process.exit(1); }
let ff;
try { ff = execFileSync('python', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); }
catch (e) { console.log('Falta o ffmpeg: pip install imageio-ffmpeg'); process.exit(1); }

const frases = JSON.parse(fs.readFileSync(path.join(RAIZ, 'gravacao', 'frases.json'), 'utf8')).frases;
const textoDe = new Map(frases.map(f => [f.arquivo, String(f.texto).replace(/^\[[^\]]+\]\s*/, '')]));

const mapa = {};
if (!args.refazer && fs.existsSync(DESTINO)) {
  const m = fs.readFileSync(DESTINO, 'utf8').match(/PC_BOCAS = (\{[\s\S]*\});/);
  if (m) Object.assign(mapa, JSON.parse(m[1]));
}
let lista = fs.readdirSync(VOZES).filter(n => n.endsWith('.mp3')).sort();
if (args.so) { const nums = String(args.so).split(','); lista = lista.filter(n => nums.some(k => n.startsWith(k + '-'))); }
lista = lista.filter(n => args.refazer || args.so || !mapa[n]);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bocas-'));
let feitas = 0;
for (const nome of lista) {
  const wav = path.join(tmp, 'f.wav'), dica = path.join(tmp, 'f.txt'), saida = path.join(tmp, 'f.json');
  try {
    execFileSync(ff, ['-loglevel', 'error', '-y', '-i', path.join(VOZES, nome), '-ac', '1', '-ar', '16000', wav]);
    const extra = [];
    if (textoDe.has(nome)) { fs.writeFileSync(dica, textoDe.get(nome)); extra.push('-d', dica); }
    execFileSync(rh, ['-q', '-r', 'phonetic', '--extendedShapes', 'GX', '-f', 'json', ...extra, '-o', saida, wav]);
    const cues = JSON.parse(fs.readFileSync(saida, 'utf8')).mouthCues;
    mapa[nome] = cues.map(c => c.value + Math.round(c.start * 100)).join('');
    feitas++;
    if (feitas % 50 === 0) console.log(feitas + '/' + lista.length);
  } catch (e) { console.log('falhou: ' + nome + ' — ' + e.message.split('\n')[0]); }
}
fs.rmSync(tmp, { recursive: true, force: true });
const ordenado = Object.fromEntries(Object.keys(mapa).sort().map(k => [k, mapa[k]]));
fs.writeFileSync(DESTINO, '// gerado por ferramentas/bocas-gerar.mjs — as formas de boca de cada fala gravada (ver o comentário lá)\n' +
  'window.PC_BOCAS = ' + JSON.stringify(ordenado, null, 0).replace(/","/g, '",\n"') + ';\n');
console.log(`Pronto: ${feitas} calculadas agora; bocas.js tem ${Object.keys(ordenado).length} falas.`);
