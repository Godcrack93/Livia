// Gera o logotipo da Lilumi Estúdio (a gata Zizi enroladinha + o nome) em SVG e exporta os PNGs.
//
//   node Android/lilumi-estudio/ferramentas/gerar-logo.mjs
//
// Saída: ../svg/*.svg e ../png/*.png. Os PNGs saem de um Chrome/Edge headless; sem ele, só os SVGs.
// As letras são desenhadas em traços (não dependem de fonte instalada).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRETO = '#1E1A22';
const BRANCO = '#FFFFFF';
const CREME = '#FFF8EC';

// ---------- A Zizi (caixa útil: x 41..472, y 33..470; centro 256,252) ----------
const CORPO = '<circle cx="276" cy="274" r="196"/>';
const ORELHAS = '<path d="M150 112 L170 40 L232 92 Z M110 196 L48 140 L124 120 Z" stroke-width="14" stroke-linejoin="round"/>';
const CABECA = '<ellipse cx="168" cy="176" rx="92" ry="82" transform="rotate(-35 168 176)"/>';
const PEITO = 'M150 262 Q200 250 236 278 Q262 300 252 326 Q226 342 196 322 Q170 300 150 262 Z';
const FOCINHO = 'M106 225 Q108 256 136 263 Q160 265 168 250 Q141 248 123 234 Q112 224 106 225 Z';
const RABO = 'M160 304 Q118 350 150 400 Q200 452 290 448 Q356 440 396 392';

// Duas tintas: a gata numa cor e as manchas noutra (opacas).
function gataDuasCores(tinta, mancha) {
  return `<g fill="${tinta}" stroke="${tinta}" stroke-width="0">${CORPO}${ORELHAS}` +
    `<path d="${PEITO}" fill="${mancha}"/>${CABECA}` +
    `<path d="${FOCINHO}" fill="${mancha}"/>` +
    `<path d="${RABO}" fill="none" stroke="${mancha}" stroke-width="10" stroke-linecap="round"/></g>`;
}

// Uma tinta só: as manchas viram recortes transparentes (máscara).
function gataUmaCor(tinta, id = 'zizi') {
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">` +
    `<g fill="#fff" stroke="#fff" stroke-width="0">${CORPO}${ORELHAS}<path d="${PEITO}" fill="#000"/>${CABECA}` +
    `<path d="${FOCINHO}" fill="#000"/><path d="${RABO}" fill="none" stroke="#000" stroke-width="10" stroke-linecap="round"/></g></mask>` +
    `<rect width="512" height="512" fill="${tinta}" mask="url(#${id})"/>`;
}

// ---------- As letras ----------
// "Lilumi": traço 18, altura 100 (y 0..100), largura 362.
function lilumi(tinta) {
  const t = 'M10 9 V91 H52 ' +                       // L
    'M84 49 V91 ' +                                  // i
    'M118 9 V91 ' +                                  // l
    'M152 49 V67 A24 24 0 0 0 200 67 V49 ' + // u
    'M234 91 V71 A22 22 0 0 1 278 71 V91 M278 71 A22 22 0 0 1 322 71 V91 ' + // m
    'M356 49 V91';                                   // i
  return `<path d="${t}" fill="none" stroke="${tinta}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="84" cy="17" r="11.5" fill="${tinta}"/><circle cx="356" cy="17" r="11.5" fill="${tinta}"/>`;
}
const LILUMI_L = 366;

// "estúdio": traço 6.5, altura-x 30 (y 0..30), ascendentes até y -16, largura 300.
function estudio(tinta) {
  const t = 'M2 15 H28 A13 13 0 1 0 24.2 24.2 ' +                              // e
    'M70 6.5 C66 1 53 0.5 52 8 C51 15.5 71 14.5 71 22.5 C71 30.5 56 30 51 24 ' + // s
    'M102 -9 V21 A9 9 0 0 0 111 30 H113 M94 2 H112 ' +                         // t
    'M138 2 V17 A13 13 0 0 0 164 17 V2 M148 -8 L155 -15 ' +         // ú
    'M214 15 A13 13 0 1 0 188 15 A13 13 0 1 0 214 15 M214 -15 V30 ' +          // d
    'M240 2 V30 ' +                                                            // i
    'M292 15 A13 13 0 1 0 266 15 A13 13 0 1 0 292 15';                         // o
  return `<path d="${t}" fill="none" stroke="${tinta}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="240" cy="-9" r="4.6" fill="${tinta}"/>`;
}
const ESTUDIO_L = 294;

// ---------- Composições ----------
const svg = (l, a, miolo, fundo = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${l} ${a}" width="${l}" height="${a}">\n` +
  `<title>Lilumi Estúdio</title>\n${fundo}${miolo}\n</svg>\n`;
const g = (x, y, e, miolo) => `<g transform="translate(${x} ${y}) scale(${e})">${miolo}</g>`;

// modo: 'cores' (preta com manchas brancas), 'preto' ou 'branco' (uma tinta, com recortes)
function gata(modo) {
  if (modo === 'cores') return gataDuasCores(PRETO, BRANCO);
  return gataUmaCor(modo === 'preto' ? PRETO : BRANCO);
}
const tintaDe = (modo) => (modo === 'branco' ? BRANCO : PRETO);

function simbolo(modo) {
  return svg(512, 512, g(0, 4, 1, gata(modo)));
}

function vertical(modo) {
  const t = tintaDe(modo);
  const L = 600, eG = 0.68, eE = 0.8;
  return svg(L, 600,
    g(L / 2 - 256 * eG, 28 - 33 * eG, eG, gata(modo)) +
    g((L - LILUMI_L) / 2, 372, 1, lilumi(t)) +
    g((L - ESTUDIO_L * eE) / 2, 524, eE, estudio(t)));
}

function horizontal(modo) {
  const t = tintaDe(modo);
  const eG = 0.62, eE = 0.8;
  return svg(760, 330,
    g(30 - 41 * eG, 165 - 252 * eG, eG, gata(modo)) +
    g(350, 84, 1, lilumi(t)) +
    g(352, 228, eE, estudio(t)));
}

function icone(escuro) {
  const fundo = `<rect width="512" height="512" fill="${escuro ? PRETO : CREME}"/>`;
  const e = 0.74;
  return svg(512, 512, g(256 - 256 * e, 256 - 252 * e, e, escuro ? gataUmaCor(BRANCO) : gataDuasCores(PRETO, BRANCO)), fundo);
}

// A mesma composição sobre um fundo opaco (para lugares que não aceitam transparência).
const comFundo = (texto, cor) => texto.replace('</title>\n', `</title>\n<rect width="100%" height="100%" fill="${cor}"/>`);

const arquivos = {
  'simbolo': simbolo('cores'),
  'simbolo-uma-cor-preto': simbolo('preto'),
  'simbolo-uma-cor-branco': simbolo('branco'),
  'logo-vertical': vertical('cores'),
  'logo-vertical-uma-cor-preto': vertical('preto'),
  'logo-vertical-uma-cor-branco': vertical('branco'),
  'logo-horizontal': horizontal('cores'),
  'logo-horizontal-uma-cor-preto': horizontal('preto'),
  'logo-horizontal-uma-cor-branco': horizontal('branco'),
  'logo-vertical-fundo-branco': comFundo(vertical('cores'), BRANCO),
  'logo-horizontal-fundo-branco': comFundo(horizontal('cores'), BRANCO),
  'icone-quadrado': icone(false),
  'icone-quadrado-escuro': icone(true),
};

fs.mkdirSync(path.join(RAIZ, 'svg'), { recursive: true });
fs.mkdirSync(path.join(RAIZ, 'png'), { recursive: true });
for (const [nome, texto] of Object.entries(arquivos)) fs.writeFileSync(path.join(RAIZ, 'svg', nome + '.svg'), texto);
console.log('SVGs: ' + Object.keys(arquivos).length);

// ---------- PNGs ----------
// [svg, largura em px, sufixo do arquivo]
const PNGS = [
  ['icone-quadrado', 512], ['icone-quadrado', 1024], ['icone-quadrado', 192],
  ['icone-quadrado-escuro', 512], ['icone-quadrado-escuro', 1024],
  ['simbolo', 512], ['simbolo', 1024], ['simbolo-uma-cor-preto', 1024], ['simbolo-uma-cor-branco', 1024],
  ['logo-vertical', 1200], ['logo-vertical-uma-cor-preto', 1200], ['logo-vertical-uma-cor-branco', 1200],
  ['logo-horizontal', 1520], ['logo-horizontal-uma-cor-preto', 1520], ['logo-horizontal-uma-cor-branco', 1520],
  ['logo-vertical-fundo-branco', 1200], ['logo-horizontal-fundo-branco', 1520],
];
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((c) => fs.existsSync(c));
if (!CHROME) {
  console.log('Sem Chrome/Edge: PNGs não exportados.');
} else {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lilumi-'));
  for (const [nome, largura] of PNGS) {
    const [, l, a] = arquivos[nome].match(/viewBox="0 0 (\d+) (\d+)"/).map(Number);
    const altura = Math.round((largura * a) / l);
    const pagina = path.join(tmp, nome + '.html');
    fs.writeFileSync(pagina, `<html><body style="margin:0;background:transparent;overflow:hidden">` +
      arquivos[nome].replace(/width="\d+" height="\d+"/, `width="${largura}" height="${altura}" style="display:block"`) + `</body></html>`);
    const destino = path.join(RAIZ, 'png', `${nome}-${largura}.png`);
    spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
      '--default-background-color=00000000', `--user-data-dir=${path.join(tmp, 'perfil')}`,
      `--window-size=${largura},${altura}`, `--screenshot=${destino}`, pathToFileURL(pagina).href], { stdio: 'ignore' });
    console.log((fs.existsSync(destino) ? 'ok   ' : 'FALHOU ') + path.basename(destino) + ` (${largura}×${altura})`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}
