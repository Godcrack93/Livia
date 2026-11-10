// Pipoca Aprende — gera o ícone do aplicativo (vetor do Android) com o rosto da Pipoca sagui.
// O rosto usa as mesmas medidas de jogo/js/pipoca.js (espaço de 300 × 360, cabeça em volta de (150, 128)).
// Uso: node ferramentas/icone-gerar.mjs   (reescreve ic_launcher_rosto.xml e ic_launcher_monocromatico.xml)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RES = path.resolve(AQUI, '..', 'aplicativo', 'app', 'src', 'main', 'res', 'drawable');

const T = '#3A2A5A';
const C = { pelo: '#B8763E', escuro: '#6B4329', creme: '#FFE6C4', branco: '#FFFAF0', manteiga: '#FFE9A6', bochecha: '#FF9CAB', boca: '#4A1F2A', lingua: '#FF8C8C', iris: '#B46F26', pupila: '#22152F' };
const n = v => String(Math.round(v * 100) / 100);
const elipse = (cx, cy, rx, ry) => `M${n(cx - rx)},${n(cy)} a${n(rx)},${n(ry)} 0 1,0 ${n(2 * rx)},0 a${n(rx)},${n(ry)} 0 1,0 ${n(-2 * rx)},0 z`;
const circulo = (cx, cy, r) => elipse(cx, cy, r, r);
const TUFO_E = [[74, 108, 21], [51, 126, 22], [57, 156, 21], [86, 138, 26], [40, 143, 13]];
const TUFO_D = TUFO_E.map(([x, y, r]) => [300 - x, y, r]);
const CABECA = 'M150,68 C196,68 222,98 222,132 C222,170 192,196 150,196 C108,196 78,170 78,132 C78,98 104,68 150,68 Z';
const GORRO = 'M86,101 C97,81.7 119,68 150,68 C181,68 203,81.7 214,101 C211,100 209,101.5 206,103 C196,109 186,98 176,104 C166,109 158,104 150,98 C142,104 134,109 124,104 C114,98 104,109 94,103 C91,101.5 89,100 86,101 Z';
const TESTA = 'M150,82 C161,91 163,107 150,118 C137,107 139,91 150,82 Z';
const TOPETE = 'M137,73 C133,58 138,50 146,48 C143,57 146,61 150,62 C150,51 156,45 164,46 C159,54 161,62 165,73 Z';
const TOPETE_FIO = 'M137,71 C133,58 138,50 146,48 C143,57 146,61 150,62 C150,51 156,45 164,46 C159,54 161,62 164.5,71';
const NARIZ = 'M143.5,158 Q150,153.5 156.5,158 Q155,165 150,166.5 Q145,165 143.5,158 Z';
const BOCA = 'M136,170 Q150,175 164,170 Q161,187 150,187 Q139,187 136,170 Z';

// o rosto (com os tufos) ocupa x 27..273 e y 44..199: cabe no círculo seguro de 66 dp com escala 0,245
const E = 0.245, TX = n(54 - E * 150), TY = n(54 - E * 124);
const abre = comentario => `<?xml version="1.0" encoding="utf-8"?>
<!-- ${comentario} Gerado por ferramentas/icone-gerar.mjs: não edite à mão. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <group android:scaleX="${E}" android:scaleY="${E}" android:translateX="${TX}" android:translateY="${TY}">
`;
const fecha = '    </group>\n</vector>\n';
const p = (d, a) => `        <path android:pathData="${d}"${Object.entries(a).map(([k, v]) => ` android:${k}="${v}"`).join('')} />\n`;
const cheio = (d, cor, extra = {}) => p(d, Object.assign({ fillColor: cor }, extra));
const contornado = (d, cor, w = 6) => p(d, { fillColor: cor, strokeColor: T, strokeWidth: w, strokeLineJoin: 'round' });
const fio = (d, w, cor = T) => p(d, { strokeColor: cor, strokeWidth: w, strokeLineCap: 'round', strokeLineJoin: 'round' });

// ---------------------------------------------------------------- colorido
let s = abre('Ícone: rosto da Pipoca, a sagui de tufos de pipoca (as medidas de jogo/js/pipoca.js). Cabe no círculo seguro de 66 dp.');
for (const tufo of [TUFO_E, TUFO_D]) {
  tufo.forEach(([x, y, r]) => { s += contornado(circulo(x, y, r), C.branco); });
  tufo.forEach(([x, y, r]) => { s += cheio(circulo(x, y, r - 2.8), C.branco); });
}
[[58, 118], [70, 152], [242, 118], [230, 152]].forEach(([x, y]) => { s += cheio(circulo(x, y, 4.2), C.manteiga); });
s += cheio(CABECA, C.pelo) + cheio(GORRO, C.escuro) + fio(CABECA, 6) + cheio(TESTA, C.branco) + cheio(TOPETE, C.escuro) + fio(TOPETE_FIO, 6);
s += cheio(circulo(124, 141, 28), C.creme) + cheio(circulo(176, 141, 28), C.creme) + cheio(elipse(150, 166, 33, 22), C.creme);
s += cheio(elipse(101, 163, 9.5, 6), C.bochecha, { fillAlpha: '0.6' }) + cheio(elipse(199, 163, 9.5, 6), C.bochecha, { fillAlpha: '0.6' });
for (const [x, lado] of [[125, -1], [175, 1]]) {
  s += fio(`M${x + lado * 11},130.6 l${lado * 4.8},-4 M${x + lado * 6.6},126.6 l${lado * 3},-5.2`, 3.2);
  s += cheio(elipse(x, 141, 13.6, 15.6), T) + cheio(elipse(x, 144, 10.4, 11.6), C.iris) + cheio(elipse(x, 142.6, 6.9, 8.3), C.pupila);
  s += cheio(circulo(x + 4.7, 135.1, 5), '#FFFFFF') + cheio(circulo(x - 4.9, 147.9, 2.4), '#FFFFFF', { fillAlpha: '0.85' });
}
s += fio('M150,166 L150,170', 3.6) + cheio(NARIZ, C.escuro) + contornado(BOCA, C.boca, 5) + cheio(elipse(150, 182.4, 6.4, 3.2), C.lingua);
fs.writeFileSync(path.join(RES, 'ic_launcher_rosto.xml'), s + fecha);

// ---------------------------------------------------------------- uma cor só (Android 13+: o sistema escolhe a cor)
// silhueta dos tufos e da cabeça; olhos, nariz, boca e a mancha da testa são furos (evenOdd)
let m = abre('Ícone temático (Android 13+): a silhueta do rosto da Pipoca numa cor só; o sistema escolhe a cor.');
for (const tufo of [TUFO_E, TUFO_D]) tufo.forEach(([x, y, r]) => { m += cheio(circulo(x, y, r + 2), '#000000'); });
m += cheio(TOPETE, '#000000') + fio(TOPETE_FIO, 6, '#000000');
m += p(`${CABECA} ${elipse(125, 141, 13.6, 15.6)} ${elipse(175, 141, 13.6, 15.6)} ${TESTA} ${NARIZ} ${BOCA}`, { fillColor: '#000000', fillType: 'evenOdd', strokeColor: '#000000', strokeWidth: 3 });
m += cheio(circulo(129.7, 135.1, 5), '#000000') + cheio(circulo(179.7, 135.1, 5), '#000000');
fs.writeFileSync(path.join(RES, 'ic_launcher_monocromatico.xml'), m + fecha);
console.log('Ícones gerados em ' + RES);
