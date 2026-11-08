// Pipoca Aprende — gera os áudios das falas da Pipoca no ElevenLabs (uma requisição por frase) e monta jogo/vozes/indice.js.
// Lê:  gravacao/configuracao.json (voz, modelo, ajustes), gravacao/frases.json (lista), gravacao/chave-elevenlabs.txt (chave).
// Só gera o que ainda não existe em jogo/vozes/ — rodar de novo não gasta crédito com o que já foi feito.
// Uso (ou pelo GERAR-VOZES.bat):
//   node ferramentas/vozes-gerar.mjs                 gera tudo o que falta
//   node ferramentas/vozes-gerar.mjs --teste 10      gera só as 10 primeiras que faltam (para ouvir antes de gastar tudo)
//   node ferramentas/vozes-gerar.mjs --ate-estacao 5 gera só o que a criança ouve até a estação 5
//   node ferramentas/vozes-gerar.mjs --refazer 12,40-45   apaga e gera de novo essas frases
//   node ferramentas/vozes-gerar.mjs --indice        só refaz o jogo/vozes/indice.js
//   node ferramentas/vozes-gerar.mjs --conta         só mostra quantos caracteres faltam gerar
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const PASTA_GRAVACAO = path.join(RAIZ, 'gravacao');
const PASTA_AUDIO = path.join(RAIZ, 'jogo', 'vozes');
const ARQ_CHAVE = path.join(PASTA_GRAVACAO, 'chave-elevenlabs.txt');

function lerArgs(lista) {
  const a = {};
  for (let i = 0; i < lista.length; i++) {
    const s = lista[i];
    if (!s.startsWith('--')) continue;
    if (i + 1 < lista.length && !lista[i + 1].startsWith('--')) a[s.slice(2)] = lista[++i]; else a[s.slice(2)] = true;
  }
  return a;
}
const args = lerArgs(process.argv.slice(2));
const sair = (msg, codigo = 1) => { console.log('\n' + msg + '\n'); process.exit(codigo); };

const chaveFrase = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();   // igual a jogo/js/voz.js

// ---------------------------------------------------------------- leitura
const config = JSON.parse(fs.readFileSync(path.join(PASTA_GRAVACAO, 'configuracao.json'), 'utf8'));
const lista = JSON.parse(fs.readFileSync(path.join(PASTA_GRAVACAO, 'frases.json'), 'utf8')).frases;
fs.mkdirSync(PASTA_AUDIO, { recursive: true });
const existe = f => fs.existsSync(path.join(PASTA_AUDIO, f.arquivo));

function ids(texto) {
  const s = new Set();
  for (const parte of String(texto).split(',')) {
    const [a, b] = parte.split('-').map(Number);
    if (!a) continue;
    for (let i = a; i <= (b || a); i++) s.add(i);
  }
  return s;
}

function montarIndice() {
  const mapa = {};
  let n = 0;
  for (const f of lista) if (existe(f)) { mapa[chaveFrase(f.texto)] = f.arquivo; n++; }
  const js = '/* Gerado por ferramentas/vozes-gerar.mjs — não edite à mão. Frase (minúsculas) → arquivo nesta pasta. */\n' +
    'window.PC_VOZES = { voz: ' + JSON.stringify(config.vozId) + ', modelo: ' + JSON.stringify(config.modelo) + ', mapa: {\n' +
    Object.entries(mapa).map(([k, v]) => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(v)).join(',\n') + '\n} };\n';
  fs.writeFileSync(path.join(PASTA_AUDIO, 'indice.js'), js);
  // dados da página gravacao/ouvir.html (arquivo .js para abrir direto do disco, sem servidor)
  const dados = lista.map(f => ({ id: f.id, onde: f.onde, texto: f.texto, tag: f.tag, arquivo: f.arquivo, gravada: existe(f) }));
  fs.writeFileSync(path.join(PASTA_GRAVACAO, 'ouvir-dados.js'), 'window.FRASES_PIPOCA = ' + JSON.stringify(dados, null, 0).replace(/},{/g, '},\n{') + ';\n');
  return n;
}

const textoParaVoz = f => (f.tag ? f.tag + ' ' : '') + f.texto;

if (args.indice) { console.log(`indice.js: ${montarIndice()} frases gravadas.`); process.exit(0); }

if (args.refazer) {
  const alvo = ids(args.refazer);
  for (const f of lista) if (alvo.has(f.id) && existe(f)) { fs.unlinkSync(path.join(PASTA_AUDIO, f.arquivo)); console.log(`apagado ${f.arquivo}`); }
}

let faltam = lista.filter(f => !existe(f));
if (args.refazer) faltam = faltam.filter(f => ids(args.refazer).has(f.id));
if (args['ate-estacao']) {
  // o que a criança ouve até a estação pedida: as frases das estações 1..n, mais abertura, mapa e a moldura das
  // atividades (álbum, brincar livre e pais ficam de fora; testes '*-teste' também)
  const n = Number(args['ate-estacao']);
  const TELAS = new Set(['abertura', 'mapa', 'atividade']);
  faltam = faltam.filter(f => { const m = /^estacao-(\d+)$/.exec(f.onde); return m ? Number(m[1]) <= n : TELAS.has(f.onde); });
}
if (args.teste) faltam = faltam.slice(0, Number(args.teste) || 10);
const caracteres = faltam.reduce((s, f) => s + textoParaVoz(f).length, 0);
console.log(`Frases na lista: ${lista.length}. Já gravadas: ${lista.length - lista.filter(f => !existe(f)).length}. Vou gerar agora: ${faltam.length} (~${caracteres} caracteres/créditos).`);
if (args.conta || !faltam.length) { console.log(`indice.js: ${montarIndice()} frases gravadas.`); process.exit(0); }

// ---------------------------------------------------------------- chave
let chave = '';
try { chave = fs.readFileSync(ARQ_CHAVE, 'utf8').replace(/^﻿/, '').trim(); } catch (e) { /* sem arquivo */ }
if (!chave || chave.startsWith('COLE')) {
  if (!fs.existsSync(ARQ_CHAVE)) fs.writeFileSync(ARQ_CHAVE, 'COLE AQUI A SUA CHAVE DO ELEVENLABS (começa com sk_) E SALVE\n');
  sair(`Falta a chave do ElevenLabs. Abra o arquivo abaixo no Bloco de Notas, troque o texto pela sua chave e salve:\n  ${ARQ_CHAVE}`);
}

// ---------------------------------------------------------------- ElevenLabs
const API = String(args.api || 'https://api.elevenlabs.io').replace(/\/$/, '');
const espera = ms => new Promise(r => setTimeout(r, ms));
let usarIdioma = !!config.idioma;

async function gerar(f) {
  const corpo = () => JSON.stringify(Object.assign(
    { text: textoParaVoz(f), model_id: config.modelo, voice_settings: config.ajustes },
    usarIdioma ? { language_code: config.idioma } : {},
    config.semente != null ? { seed: Number(config.semente) } : {},
  ));
  for (let tentativa = 1; tentativa <= 6; tentativa++) {
    let r;
    const comIdioma = usarIdioma;
    try {
      r = await fetch(`${API}/v1/text-to-speech/${encodeURIComponent(config.vozId)}?output_format=${encodeURIComponent(config.formato)}`, {
        method: 'POST',
        headers: { 'xi-api-key': chave, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: corpo(),
      });
    } catch (e) { console.log(`  rede falhou (${e.message}); tentando de novo...`); await espera(3000 * tentativa); continue; }
    if (r.ok) {
      const dados = Buffer.from(await r.arrayBuffer());
      if (dados.length < 500) throw new Error('áudio vazio ou curto demais');
      fs.writeFileSync(path.join(PASTA_AUDIO, f.arquivo), dados);
      return;
    }
    const txt = await r.text().catch(() => '');
    if (r.status === 400 && comIdioma && /language/i.test(txt)) {
      if (usarIdioma) { usarIdioma = false; console.log('  (o modelo não aceita language_code; seguindo sem ele)'); }
      continue;
    }
    if (r.status === 401 && /quota|credit/i.test(txt)) sair('Os créditos do ElevenLabs acabaram. O que já foi gerado está salvo; rode de novo quando tiver créditos.\n' + txt);
    if (r.status === 401 || r.status === 403) sair(`O ElevenLabs recusou a chave (${r.status}). Confira a chave em ${ARQ_CHAVE} e se ela tem a permissão "Text to Speech".\n${txt}`);
    if (r.status === 404) sair(`O ElevenLabs não achou a voz "${config.vozId}" (ou o modelo "${config.modelo}"). Confira gravacao/configuracao.json.\n${txt}`);
    if (r.status === 429 || r.status >= 500) { const s = 4 * tentativa; console.log(`  servidor ocupado (${r.status}); esperando ${s} s...`); await espera(s * 1000); continue; }
    throw new Error(`HTTP ${r.status}: ${txt.slice(0, 300)}`);
  }
  throw new Error('não deu certo depois de várias tentativas');
}

const fila = faltam.slice();
const falhas = [];
let feitas = 0;
async function trabalhador() {
  while (fila.length) {
    const f = fila.shift();
    try {
      await gerar(f);
      feitas++;
      console.log(`[${feitas}/${faltam.length}] ${f.arquivo}  ${textoParaVoz(f)}`);
    } catch (e) { falhas.push(f); console.log(`FALHOU ${f.id} "${f.texto}": ${e.message}`); }
    if (feitas % 25 === 0) montarIndice();      // se parar no meio, o que já foi feito já vale no jogo
  }
}
await Promise.all(Array.from({ length: Math.max(1, Number(config.simultaneas) || 2) }, trabalhador));
const n = montarIndice();
console.log(`\nPronto: ${feitas} geradas agora, ${falhas.length} falharam. O jogo tem ${n} frases gravadas.`);
if (falhas.length) console.log('Para tentar de novo só as que falharam, rode de novo (ele pula as que já existem).');
console.log('Para ouvir tudo: abra gravacao/ouvir.html no navegador.');
