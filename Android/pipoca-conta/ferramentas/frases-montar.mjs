// Pipoca Aprende — monta gravacao/frases.json: a lista de TODAS as frases que a Pipoca fala, na ordem em que a criança
// as encontra no jogo, cada uma com o nome do arquivo de áudio e a tag de emoção para o ElevenLabs.
// Fontes:
//   ferramentas/saida/falas-coletadas.json   (frases-coletar.mjs: o robô jogando as 60 estações)
//   ferramentas/frases-extras.mjs            (erros, ajudas e telas, que o robô não alcança — estações de números)
//   ferramentas/frases-letras.mjs            (todas as falas possíveis das estações de letras, a partir do banco de palavras)
// Se gravacao/frases.json já existe, nada muda nas frases antigas (número, arquivo e tag editada à mão ficam);
// as frases novas entram no fim da lista.
// Uso: node ferramentas/frases-montar.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const COLETA = path.join(AQUI, 'saida', 'falas-coletadas.json');
const EXTRAS = path.join(AQUI, 'frases-extras.mjs');
const LETRAS = path.join(AQUI, 'frases-letras.mjs');
const DESTINO = path.join(RAIZ, 'gravacao', 'frases.json');

// A divisão e a chave TÊM de ser iguais às de jogo/js/voz.js.
const dividirFrases = texto => String(texto).split(/(?<=[.!?…])\s+/).map(s => s.trim()).filter(Boolean);
const chaveFrase = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- ordem do jogo
const ORDEM_TELAS_ANTES = ['abertura', 'mapa'];
const ORDEM_TELAS_DEPOIS = ['album', 'livre', 'pais', 'descanso'];

function lerColeta() {
  if (!fs.existsSync(COLETA)) { console.log('Aviso: sem ' + COLETA + ' (rode frases-coletar.mjs).'); return []; }
  // o Brincar livre de cubinhos virou a Casa da Pipoca (nov/2026): as falas coletadas dele não valem mais
  return JSON.parse(fs.readFileSync(COLETA, 'utf8')).filter(c => c.origem !== 'livre' && c.onde !== 'livre');
}
async function lerExtras() {
  if (!fs.existsSync(EXTRAS)) { console.log('Aviso: sem ' + EXTRAS); return []; }
  const m = await import(pathToFileURL(EXTRAS).href);
  const l = fs.existsSync(LETRAS) ? (await import(pathToFileURL(LETRAS).href)).default() : [];
  return m.default().concat(l);
}

const estacaoDe = origem => { const r = /estacao-?(\d+)/.exec(String(origem)); return r ? Number(r[1]) : null; };

async function falasEmOrdem() {
  const coleta = lerColeta();
  const extras = await lerExtras();
  const saida = [];
  const extrasDe = filtro => extras.filter(filtro).map(e => ({ origem: e.origem, texto: e.texto }));
  for (const o of ORDEM_TELAS_ANTES) saida.push(...extrasDe(e => e.origem === o));
  for (let n = 1; n <= 60; n++) {
    const o = 'estacao-' + String(n).padStart(2, '0');
    for (const r of coleta.filter(c => c.estacao === n)) for (const t of r.falas) saida.push({ origem: o, texto: t });
    saida.push(...extrasDe(e => estacaoDe(e.origem) === n));
    // falas gerais da moldura das atividades entram junto com a primeira estação
    if (n === 1) saida.push(...extrasDe(e => !estacaoDe(e.origem) && !ORDEM_TELAS_ANTES.includes(e.origem) && !ORDEM_TELAS_DEPOIS.includes(e.origem)));
  }
  for (const o of ORDEM_TELAS_DEPOIS) saida.push(...extrasDe(e => e.origem === o));
  return saida;
}

// ---------------------------------------------------------------- tags de emoção (Eleven v4: tags em inglês, entre colchetes)
// Uma palavra só: as tags também contam como caracteres (créditos) no ElevenLabs.
const NUM = '(zero|um|uma|dois|duas|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|e)';
const SO_NUMERO = new RegExp(`^(é |ou )?${NUM}( ${NUM})*[,.]?$`, 'i');
const NUMERO_FESTA = new RegExp(`^${NUM}( ${NUM})*( [a-zçãõáéíóú]+)?!$`, 'i');
const ELOGIO = /^(muito bem|isso aí|arrasou|que demais|mandou bem|uhuu|perfeito|show de bola|parabéns|eba|oba|uau|viva|que lindo|incrível|conseguiu|você conseguiu|mesa limpinha)/i;
const FESTA = /(amigos do dez|figurinha nova|figurinhas novas|álbum completo|uma dezena|duas dezenas|são iguais)/i;
const CONSOLO = /^(quase|foi quase|vamos tentar|tenta outra|deu |esse é o|essa é a|ficaram|ficou|sobrou|sobraram|ops|hum|precisamos de|ia ficar|não cabe)/i;
const INSTRUCAO = /^(monte|toque|leve|ponha|arraste|complete|dê|conte|olha|olhe|siga|comece|agora|tire|junte|separe|escolha|pinte|faça|vamos|escreva|ajude|pague|guarde|coloque|depois|encontre|qual|quantos|quantas|ache|mostre)/i;

function tagPara(texto, origem) {
  const t = texto.trim();
  if (origem === 'pais' || origem === 'descanso') return '[calm]';
  if (SO_NUMERO.test(t)) return '';                              // contagem: sem tag, só o número bem claro
  if (ELOGIO.test(t) || FESTA.test(t)) return '[excited]';
  if (NUMERO_FESTA.test(t)) return '[happy]';
  if (CONSOLO.test(t)) return '[gentle]';
  if (/\?$/.test(t)) return '[curious]';
  if (INSTRUCAO.test(t)) return '[cheerful]';
  return '';                                                     // explicação neutra: a voz natural já basta (e economiza créditos)
}

// ---------------------------------------------------------------- nomes de arquivo
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'frase';

// ---------------------------------------------------------------- montar
const falas = await falasEmOrdem();
const anterior = fs.existsSync(DESTINO) ? JSON.parse(fs.readFileSync(DESTINO, 'utf8')) : { frases: [] };
// frases que o jogo não fala mais (ex.: o Brincar livre de cubinhos, que virou a Casa da Pipoca) saem da lista, a não
// ser que já tenham áudio gravado (aí ficam, sem custo)
const atuais = new Set();
for (const { texto } of falas) for (const fr of dividirFrases(texto)) atuais.add(chaveFrase(fr));
const PASTA_AUDIO = path.join(RAIZ, 'jogo', 'vozes');
const frases = anterior.frases.filter(f => atuais.has(chaveFrase(f.texto)) || fs.existsSync(path.join(PASTA_AUDIO, f.arquivo)));
const removidas = anterior.frases.length - frases.length;
if (removidas) console.log(`Saíram ${removidas} frases que o jogo não fala mais (sem áudio gravado).`);
const conhecidas = new Set(frases.map(f => chaveFrase(f.texto)));
let proximoId = frases.reduce((m, f) => Math.max(m, f.id), 0) + 1;
let novas = 0;
for (const { origem, texto } of falas) {
  for (const frase of dividirFrases(texto)) {
    const k = chaveFrase(frase);
    if (!k || conhecidas.has(k)) continue;
    conhecidas.add(k);
    const id = proximoId++;
    frases.push({ id, onde: origem, texto: frase, tag: tagPara(frase, origem), arquivo: String(id).padStart(4, '0') + '-' + slug(frase) + '.mp3' });
    novas++;
  }
}
const caracteres = frases.reduce((s, f) => s + f.texto.length + (f.tag ? f.tag.length + 1 : 0), 0);
fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
const cabecalho = {
  leiaMe: 'Lista de falas da Pipoca, na ordem do jogo. Pode editar a "tag" (emoção, em inglês, entre colchetes; vazio = sem tag). ' +
    'NÃO edite "texto" (tem de ser igual ao do jogo) nem "arquivo". Para regravar uma frase: GERAR-VOZES.bat --refazer <id>.',
  total: frases.length,
  caracteres,
};
// uma frase por linha, para ficar fácil de ler e editar
const linhas = frases.map(f => '  ' + JSON.stringify(f));
fs.writeFileSync(DESTINO, '{\n' + Object.entries(cabecalho).map(([k, v]) => `"${k}": ${JSON.stringify(v)},`).join('\n') + '\n"frases": [\n' + linhas.join(',\n') + '\n]}\n');
console.log(`${frases.length} frases (${novas} novas), ~${caracteres} caracteres → ${DESTINO}`);
const porTag = {};
for (const f of frases) porTag[f.tag || '(sem tag)'] = (porTag[f.tag || '(sem tag)'] || 0) + 1;
console.log(porTag);
