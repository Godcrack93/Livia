// Pipoca Aprende — frases que o robô de coleta (frases-coletar.mjs) não alcança: retornos de erro, ajudas, falas das
// telas (abertura, mapa, álbum, brincar livre, pais) e as variantes sorteadas das instruções de cada estação.
// Tudo gerado a partir das regras do código do jogo (jogo/js/...), com a mesma grafia, maiúsculas e pontuação.
// Uso: import frasesExtras from './frases-extras.mjs'; frasesExtras() → [{ origem, texto }, ...]
// Não remove repetidas entre origens (quem usa faz isso).

import fs from 'node:fs';

// ---------------------------------------------------------------- números por extenso (cópia de jogo/js/voz.js)
const UNI = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
  'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CEM = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
function ate999(n, fem) {
  if (n < 20) {
    if (fem && n === 1) return 'uma';
    if (fem && n === 2) return 'duas';
    return UNI[n];
  }
  if (n < 100) {
    const d = Math.floor(n / 10), u = n % 10;
    return u ? DEZ[d] + ' e ' + ate999(u, fem) : DEZ[d];
  }
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100), r = n % 100;
  let cent = CEM[c];
  if (fem && c > 1) cent = cent.replace(/os$/, 'as');
  return r ? cent + ' e ' + ate999(r, fem) : cent;
}
function extenso(n, { feminino = false } = {}) {
  n = Math.round(Number(n));
  if (!isFinite(n)) return '';
  if (n < 0) return 'menos ' + extenso(-n, { feminino });
  if (n < 1000) return ate999(n, feminino);
  if (n < 10000) {
    const m = Math.floor(n / 1000), r = n % 1000;
    const mil = m === 1 ? 'mil' : ate999(m, feminino) + ' mil';
    if (!r) return mil;
    return mil + (r < 100 || r % 100 === 0 ? ' e ' : ' ') + ate999(r, feminino);
  }
  return String(n);
}
function quantidade(n, singular, plural, { feminino = false } = {}) {
  if (n === 0) return (feminino ? 'nenhuma ' : 'nenhum ') + singular;
  return extenso(n, { feminino }) + ' ' + (n === 1 ? singular : plural);
}
function dezEMais(n) {
  if (n <= 10 || n >= 20) return extenso(n);
  return 'dez e mais ' + extenso(n - 10) + '... ' + extenso(n);
}
const ext = n => extenso(n);
const M = s => s.charAt(0).toUpperCase() + s.slice(1);
const faixa = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
const cubinhos = n => quantidade(n, 'cubinho', 'cubinhos');
const pintinhos = n => quantidade(n, 'pintinho', 'pintinhos');
/** Garantia de voz.js: nenhum algarismo chega ao motor de voz. */
const semAlgarismos = t => String(t).replace(/\d+/g, m => extenso(Number(m)));

// ---------------------------------------------------------------- estações (cópia de jogo/js/fases.js)
const E = (atividade, params) => ({ atividade, params });
const FASES = [
  E('torre', { min: 1, max: 3, rodadas: 3, demo: true, pontos: true, vozTotal: true, confirmar: false }),
  E('pintinhos', { modo: 'contar', min: 1, max: 4, arranjo: 'solto', rodadas: 4, demo: true, vozConta: true }),
  E('tracar', { digitos: [1, 2, 3], demo: true }),
  E('juntar', { alvoMin: 3, alvoMax: 4, torres: 2, rodadas: 3, demo: true }),
  E('pintinhos', { modo: 'comparar', min: 0, max: 5, rodadas: 4, demo: true }),
  E('torre', { min: 3, max: 5, rodadas: 4, pontos: true, vozTotal: false, confirmar: true }),
  E('feirinha', { modo: 'comprar', precoMin: 1, precoMax: 3, moedas: [1], rodadas: 3, demo: true, confirmar: false }),
  E('pintinhos', { modo: 'olhadinha', min: 1, max: 5, arranjo: 'dado', tempo: 2500, rodadas: 5, demo: true }),
  E('sapinho', { inicio: 1, passo: 1, quantidade: 5, lacunas: 1, rodadas: 2, demo: true }),
  E('separar', { totalMin: 3, totalMax: 5, rodadas: 3, demo: true, confirmar: false }),
  E('tracar', { digitos: [4, 5, 6] }),
  E('torre', { min: 6, max: 8, rodadas: 3, pontos: false, vozTotal: false, confirmar: true }),
  E('pintinhos', { modo: 'contar', min: 5, max: 10, arranjo: 'solto', rodadas: 4, vozConta: false }),
  E('juntar', { alvoMin: 5, alvoMax: 7, torres: 3, rodadas: 4 }),
  E('sapinho', { inicio: 1, passo: 1, quantidade: 10, lacunas: 3, rodadas: 2 }),
  E('tracar', { digitos: [7, 8, 9] }),
  E('feirinha', { modo: 'comprar', precoMin: 3, precoMax: 6, moedas: [1, 2], rodadas: 4, confirmar: true }),
  E('torre', { modo: 'comparar', min: 1, max: 10, rodadas: 4, demo: true }),
  E('separar', { totalMin: 6, totalMax: 10, rodadas: 4, confirmar: true }),
  E('juntar', { alvoMin: 10, alvoMax: 10, torres: 4, rodadas: 4 }),
  E('pintinhos', { modo: 'olhadinha', min: 4, max: 10, arranjo: 'quadro10', tempo: 3000, rodadas: 5 }),
  E('tracar', { digitos: [0, 10] }),
  E('torre', { min: 11, max: 15, rodadas: 3, confirmar: true, dezenaPronta: true, demo: true }),
  E('sapinho', { inicio: 10, passo: 1, quantidade: 11, lacunas: 3, rodadas: 2 }),
  E('feirinha', { modo: 'comprar', precoMin: 5, precoMax: 10, moedas: [1, 2, 5], rodadas: 4, confirmar: true }),
  E('sapinho', { inicio: 10, passo: -1, quantidade: 11, lacunas: 3, rodadas: 2, demo: true }),
  E('sapinho', { inicio: 2, passo: 2, quantidade: 10, lacunas: 3, rodadas: 2, demo: true }),
  E('separar', { totalMin: 11, totalMax: 19, rodadas: 4, confirmar: true, dezena: true, demo: true }),
  E('feirinha', { modo: 'troco', precoMin: 1, precoMax: 4, pagaCom: 5, rodadas: 3, confirmar: true, demo: true }),
  E('sapinho', { inicio: 10, passo: 10, quantidade: 10, lacunas: 3, rodadas: 2, barras: true, demo: true }),
];

// ================================================================ telas
function abertura(f) {
  f('Oi! Eu sou a Pipoca! Vamos brincar e aprender?');
  f('Toque no botão verde para jogar!');
}
function mapa(f) {
  f('Vamos brincar? Toque aqui!');
  f('Oba! Agora é esta aqui!');
  f('Primeiro esta aqui!');
  f('Essa ainda está fechadinha. Vamos brincar nesta?');
}
/** Moldura das atividades (jogo/js/telas/atividade.js) e as listas de voz.js. */
function atividade(f) {
  ['Muito bem!', 'Isso aí!', 'Arrasou!', 'Que demais!', 'Mandou bem!', 'Uhuu! Acertou!', 'Perfeito!', 'Show de bola!'].forEach(f);
  f('Vamos tentar de novo.');
  ['Quase! Tenta outra vez.', 'Foi quase!', 'Quase! Vamos de novo?'].forEach(f);
  f('Quer parar? A casinha sai. O botão verde continua.');
  f('Parabéns! Você ganhou uma figurinha nova!');
  f('Parabéns! Muito bem!');
  f('Toque no botão verde para continuar.');
  f('Uau! Você completou a trilha toda! Que orgulho!');
  f('Ops! Vamos voltar para a trilha.');
  f('Esta brincadeira ainda está sendo construída!');
}

// ================================================================ torre (jogo/js/atividades/torre.js)
const MAX_TORRE = 20;
function fraseErroTorre(n, alvo) {
  const d = Math.abs(alvo - n);
  return `Temos ${ext(n)}. Precisamos de ${ext(alvo)}. ` + (n < alvo ? `Coloque mais ${ext(d)}!` : `Tire ${ext(d)}!`);
}
function fraseTotalTorre(n) {
  if (n === 10) return 'Dez cubinhos! Uma dezena!';
  if (n === 20) return 'Vinte cubinhos! Duas dezenas!';
  if (n > 10 && n < 20) return `Dez e mais ${ext(n - 10)}... ${cubinhos(n)}!`;
  return M(cubinhos(n)) + '!';
}
/** Ajuda (2º erro): contagem, "Falta/Faltam", "Sobra/Sobram", "… Toque no botão verde!". */
function ajudaTorre(f, alvos) {
  f('Toque no balde!');
  const maxAlvo = Math.max(...alvos), minAlvo = Math.min(...alvos);
  for (let d = 1; d < maxAlvo; d++) f((d === 1 ? 'Falta ' : 'Faltam ') + ext(d) + '!');
  for (let d = 1; d <= MAX_TORRE - minAlvo; d++) f((d === 1 ? 'Sobra ' : 'Sobram ') + ext(d) + '!');
  alvos.forEach(a => f(M(cubinhos(a)) + '! Toque no botão verde!'));
}
function contagemTorre(f) { for (let i = 1; i <= MAX_TORRE; i++) f(M(ext(i))); }
function torreConstruir(f, p) {
  const alvos = faixa(p.min, p.max);
  alvos.forEach(a => f(`Monte uma torre de ${cubinhos(a)}!`));
  if (p.vozTotal) for (let n = 1; n < p.max; n++) f(M(ext(n)) + '!');
  if (p.dezenaPronta) {
    alvos.forEach(a => f(`Já temos dez! Ponha mais ${ext(a - 10)}!`));
    for (let n = 11; n <= 19; n++) f(M(dezEMais(n)) + '!');
  }
  if (!p.vozTotal) contagemTorre(f);
  else for (let n = 1; n <= p.max; n++) f(M(ext(n)));
  alvos.forEach(a => f(fraseTotalTorre(a)));
  if (!p.confirmar) return;                     // sem Pronto não há erro nem ajuda (a rodada acaba ao chegar em N)
  f('Dez! Uma dezena!');
  f('Vinte! Duas dezenas!');
  f('A torre está cheia!');
  alvos.forEach(a => { for (let n = 1; n <= MAX_TORRE; n++) if (n !== a) f(fraseErroTorre(n, a)); });
  ajudaTorre(f, alvos);
}
function torreComparar(f, p) {
  const min = Math.min(Math.max(p.min, 1), 9), max = Math.min(Math.max(p.max, min + 1), 10);
  f('Faça uma torre igual a esta!');
  f('Faça uma torre com um a mais que esta!');
  f('Qual torre tem mais?');
  f('Ou são iguais?');
  contagemTorre(f);
  const iguais = faixa(Math.min(Math.max(min, 2), max), max);
  const umaMais = faixa(min, max - 1);
  iguais.forEach(a => f(`${M(ext(a))} e ${ext(a)}. Iguais!`));
  umaMais.forEach(m => f(`Um a mais que ${ext(m)} é ${ext(m + 1)}!`));
  f('Dez! Uma dezena!');
  f('Vinte! Duas dezenas!');
  f('A torre está cheia!');
  // erros ao montar (igual / um a mais)
  f('Ficou igual a esta. Coloque mais um!');
  const alvos = [...new Set(iguais.concat(umaMais.map(m => m + 1)))].sort((a, b) => a - b);
  alvos.forEach(a => { for (let n = 1; n <= MAX_TORRE; n++) if (n !== a) f(fraseErroTorre(n, a)); });
  ajudaTorre(f, alvos);
  // "Qual torre tem mais?": valores de min a max, diferença de 1 a 3, ou iguais (de 3 a max)
  const pares = [];
  for (let a = min; a <= max; a++) for (let b = min; b <= max; b++) if (a !== b && Math.abs(a - b) <= 3) pares.push([a, b]);
  pares.forEach(([a, b]) => f(`Uma tem ${ext(a)}. A outra tem ${ext(b)}.`));
  pares.forEach(([a, b]) => { if (a < b) f(`Essa tem ${ext(a)}. A outra tem ${ext(b)}.`); });
  const iguaisMaior = faixa(Math.min(Math.max(min, 3), max), max);
  iguaisMaior.forEach(v => f(`Essa tem ${ext(v)}. A outra também!`));
  pares.forEach(([a, b]) => { if (a > b) f(`${M(ext(a))} é mais que ${ext(b)}!`); });
  iguaisMaior.forEach(v => f(`${M(ext(v))} e ${ext(v)}. Iguais!`));
}

// ================================================================ pintinhos (jogo/js/atividades/pintinhos.js)
function triosOpcoes(n, piso, teto) {
  const c = [[n - 1, n, n + 1], [n - 2, n - 1, n], [n, n + 1, n + 2]].filter(t => t[0] >= piso && t[2] <= teto);
  return c.length ? c : [[n, n + 1, n + 2]];
}
function pintinhosNumero(f, p) {
  const olhadinha = p.modo === 'olhadinha';
  const ns = faixa(p.min, p.max);
  const teto = Math.max(p.max, 10);
  if (olhadinha) {
    f('Toque na cerca para espiar os pintinhos!');
    f('Quantos pintinhos você viu?');
  } else {
    f(p.vozConta ? 'Quantos pintinhos? Toque em cada um!' : 'Quantos pintinhos? Toque em cada um e conte!');
    f('Toque nos pintinhos que faltam!');
    f('Quantos pintinhos?');
  }
  // leitura das opções ("É três," "quatro," "ou cinco?"), também com uma ou duas opções já fora de jogo
  const frag = new Set();
  ns.forEach(n => triosOpcoes(n, 1, teto).forEach(t => {
    frag.add('É ' + ext(t[0]) + ','); frag.add(ext(t[1]) + ','); frag.add('ou ' + ext(t[2]) + '?');
    const outros = t.filter(v => v !== n);
    outros.forEach(fora => { const par = t.filter(v => v !== fora); frag.add('É ' + ext(par[0]) + ','); frag.add('ou ' + ext(par[1]) + '?'); });
    frag.add('Toque no ' + ext(n) + '!');
  }));
  frag.forEach(f);
  // erros: a opção errada (até dois de distância, dentro do trio)
  ns.forEach(n => {
    const errados = new Set();
    triosOpcoes(n, 1, teto).forEach(t => t.forEach(v => { if (v !== n) errados.add(v); }));
    [...errados].sort((a, b) => a - b).forEach(v => {
      const porUm = Math.abs(v - n) === 1;
      let fala = (porUm ? 'Quase! ' : '') + 'Esse é o ' + ext(v) + '.';
      fala += olhadinha ? ' Espie de novo!' : (v > n ? ' Tem menos pintinhos.' : ' Tem mais pintinhos.');
      f(fala);
    });
  });
  // ajuda (2º erro): contar juntos
  f('Vamos contar juntos!');
  for (let k = 1; k <= p.max; k++) f(M(ext(k)));
  ns.forEach(n => f(M(pintinhos(n)) + '!'));
}
function pintinhosComparar(f, p) {
  f('Qual cercadinho tem mais pintinhos?');
  f('Se forem iguais, toque aqui.');
  const piso = Math.max(1, p.min), max = p.max;
  const pares = [];
  for (let a = piso; a <= max; a++) for (let b = piso; b <= max; b++) if (a !== b) pares.push([a, b]);
  if (p.min === 0) faixa(piso, max).forEach(v => { pares.push([0, v]); pares.push([v, 0]); });
  const iguais = faixa(Math.min(max, Math.max(piso, 2)), max);
  // erros
  pares.forEach(([a, b]) => {
    const porUm = Math.abs(a - b) === 1 && a > 0 && b > 0;
    f((porUm ? 'Quase! ' : '') + 'Não são iguais: ' + ext(a) + ' e ' + ext(b) + '.');
  });
  pares.forEach(([c, o]) => {
    if (c > o) return;                                      // só o cercadinho com menos é escolha errada
    if (c === 0) { f('Nenhum! Zero pintinho. O outro tem ' + ext(o) + '.'); return; }
    const porUm = o - c === 1;
    f((porUm ? 'Quase! ' : '') + 'Esse tem ' + ext(c) + '. O outro tem ' + ext(o) + '.');
  });
  iguais.forEach(v => f('Esse tem ' + ext(v) + '. O outro também tem ' + ext(v) + '.'));
  // acertos (sorteados) e ajuda
  iguais.forEach(v => f(M(ext(v)) + ' e ' + ext(v) + '. São iguais!'));
  f('Nenhum! Zero pintinho.');
  pares.forEach(([m, o]) => { if (m > o) f(M(ext(m)) + ' é mais que ' + ext(o) + '!'); });
  f('Vamos contar juntos!');
  for (let k = 1; k <= max; k++) f(M(ext(k)));
  faixa(piso, max).forEach(n => f(M(pintinhos(n)) + '!'));
}

// ================================================================ tracar (jogo/js/atividades/tracar.js)
const TRACOS_EXTRA = { 4: ['Agora o outro risquinho!'], 5: ['Agora o chapéu do cinco!'], 10: ['Agora o zero!'] };
function tracar(f, p) {
  p.digitos.forEach((d, i) => {
    const nome = ext(d);
    if (p.demo && i === 0) { f('Olha como se escreve o ' + nome + '!'); f('Agora é a sua vez! Comece na bolinha verde.'); }
    f(d === 10 ? 'Vamos escrever o dez! Comece pelo um.' : 'Vamos escrever o ' + nome + '! Comece na bolinha verde.');
    (TRACOS_EXTRA[d] || []).forEach(t => { f(t); f(t + ' Comece na bolinha verde.'); });
    f('Continue da bolinha verde.');
    if (d > 0) f(M(nome) + '!');
    if (d === 0) f('Zero! Nenhuma estrelinha.');
    for (let k = 1; k <= d; k++) f(ext(k));
    if (d > 0) f(M(quantidade(d, 'estrelinha', 'estrelinhas', { feminino: true })) + '!');
  });
  f('Começou fora da bolinha verde. Comece nela!');
  f('Foi para o outro lado. Siga a setinha!');
  f('Agora arraste o dedo pela setinha!');
  f('Olha a mãozinha. Siga as setinhas!');
}

// ================================================================ juntar (jogo/js/atividades/juntar.js)
function juntar(f, p) {
  const alvos = faixa(Math.max(2, p.alvoMin), Math.min(10, p.alvoMax));
  const k = p.torres || 2;
  alvos.forEach(N => {
    f(k === 2 ? `Junte as torres para fazer ${ext(N)}!` : `Junte duas torres para fazer ${ext(N)}!`);
    // junções: com 2 torres só existe o par certo; com 3 ou 4, qualquer par de torres (cada uma de 1 a N − 1)
    for (let a = 1; a < N; a++) for (let b = 1; b < N; b++) {
      const s = a + b;
      if (k === 2 && s !== N) continue;
      f(`${M(ext(a))} mais ${ext(b)}...`);
      f(M(s >= 16 && s <= 19 ? dezEMais(s) : ext(s)) + '!');
      if (s === N) f(N === 10 ? `${M(ext(a))} e ${ext(b)} são amigos do dez!` : `${M(ext(a))} e ${ext(b)} fazem ${ext(N)}!`);
      else f((Math.abs(s - N) === 1 ? 'Quase! ' : '') + `Deu ${ext(s)}. Precisamos de ${ext(N)}.`);
    }
    // ajuda (2º erro): contar a partir da maior torre do par certo
    if (k === 2) return;
    for (let base = Math.ceil(N / 2); base < N; base++) {
      f('Esta torre tem ' + ext(base) + '.');
      for (let v = base; v <= N; v++) f(ext(v));
      const falta = N - base;
      f((falta === 1 ? 'Falta ' : 'Faltam ') + ext(falta) + '!');
    }
  });
}

// ================================================================ separar (jogo/js/atividades/separar.js)
function ficaram(n) {
  if (n === 0) return 'não ficou nenhum';
  if (n === 1) return 'ficou um';
  return 'ficaram ' + ext(n);
}
const pedido = n => (n === 0 ? 'Tire todos!' : `Precisamos de ${ext(n)}.`);
const totalFalado = n => (n >= 16 && n <= 19 ? dezEMais(n) : ext(n));
function paresSeparar(p) {
  const r = [];
  if (p.dezena) {
    const min = Math.min(Math.max(p.totalMin, 11), 19), max = Math.min(Math.max(p.totalMax, min), 19);
    faixa(min, max).forEach(t => r.push([t, t - 10, 'dezena']));
    faixa(min, max).forEach(t => faixa(10, t - 1).forEach(n => { if (t - n >= 2) r.push([t, n, 'unidades']); }));
    return r;
  }
  const min = Math.min(Math.max(p.totalMin, 2), 10), max = Math.min(Math.max(p.totalMax, min), 10);
  faixa(min, max).forEach(t => r.push([t, 0, 'simples']));
  faixa(min, max).forEach(t => faixa(1, t - 1).forEach(n => { if (t < 6 || t - n >= 2) r.push([t, n, 'simples']); }));
  return r;
}
function separar(f, p) {
  const conf = !!p.confirmar;
  if (p.demo) { f('Toque na torre para tirar um cubinho!'); if (p.dezena) f('Toque na dezena: ela sai inteira!'); }
  const pares = paresSeparar(p);
  pares.forEach(([T, N, tipo]) => {
    const alvo = N === 0 ? 'Tire todos os cubinhos!' : `Tire cubinhos até ${N === 1 ? 'ficar um' : 'ficarem ' + ext(N)}!`;
    f(`A torre tem ${totalFalado(T)}. ${alvo}`);
    f((N === 0 ? 'Tire todos os cubinhos!' : `A torre precisa ficar com ${ext(N)}!`) + (conf ? ' Depois, toque no botão verde!' : ''));
    f(tipo === 'dezena' ? `${M(ext(T))} menos dez... ${ficaram(N)}!` : `Eram ${ext(T)}, tiramos ${ext(T - N)}, ${ficaram(N)}!`);
    if (conf) f(`A torre ainda tem ${ext(T)}. ${pedido(N)}`);
    for (let r = 0; r <= T; r++) {
      if (r > N) {
        f(`${M(ficaram(r))}. Tire mais!`);
        if (tipo === 'dezena' && r >= 11 && r - 10 === N) f(`${M(ficaram(r))}. ${pedido(N)} Toque na dezena!`);
        else f(`${M(ficaram(r))}. ${pedido(N)}` + (N === 0 ? '' : ' Tire mais!'));
      } else if (r < N) {
        f(`${M(ficaram(r))}. ${pedido(N)}`);
        if (N - r === 1) f(`Quase! ${M(ficaram(r))}. ${pedido(N)}`);
        f(`${M(ficaram(r))}. ${pedido(N)} Toque na pilhinha para devolver!`);
      } else {
        f(`${M(ficaram(r))}!` + (conf ? ' Toque no botão verde!' : ''));
      }
    }
  });
  const maxT = Math.max(...pares.map(x => x[0]));
  for (let v = 1; v <= maxT; v++) f(ext(v));
}

// ================================================================ feirinha (jogo/js/atividades/feirinha.js)
const PRODUTOS = [
  ['banana', 'a'], ['manga', 'a'], ['abacaxi', 'o'], ['caju', 'o'], ['laranja', 'a'], ['melancia', 'a'], ['goiaba', 'a'],
  ['milho', 'o'], ['coco', 'o'], ['pão de queijo', 'o'], ['tapioca', 'a'], ['paçoca', 'a'],
].map(([nome, artigo]) => artigo + ' ' + nome);
const FREGUESES = ['o tucano', 'a arara', 'o quati'];
const MAX_BALCAO = 12;
function feirinha(f, p) {
  const troco = p.modo === 'troco';
  const pagaCom = troco ? (p.pagaCom === 10 ? 10 : 5) : 0;
  const teto = troco ? pagaCom - 1 : 10;
  const min = Math.min(Math.max(p.precoMin, 1), teto), max = Math.min(Math.max(p.precoMax, min), teto);
  const precos = faixa(min, max);
  const conf = !!p.confirmar;
  const moedas = troco ? [1] : [...new Set([1].concat(p.moedas || []))];
  // o balcão aceita até 12 moedas (comprar); no troco, só as casas vazias do quadro
  const maxTotal = troco ? pagaCom : MAX_BALCAO * Math.max(...moedas);
  // instruções sorteadas (freguês × produto × preço) e o toque nos caixotes
  if (troco) {
    PRODUTOS.forEach(pr => precos.forEach(P => FREGUESES.forEach(fr => f(`${M(pr)} custa ${ext(P)}. ${M(fr)} pagou com ${ext(pagaCom)}.`))));
    f(`Dê o troco! Complete até ${ext(pagaCom)}.`);
    FREGUESES.forEach(fr => f(`${M(fr)} pagou com ${ext(pagaCom)}.`));
  } else {
    FREGUESES.forEach(fr => PRODUTOS.forEach(pr => precos.forEach(P => f(`${M(fr)} quer ${pr}. ${M(pr)} custa ${ext(P)}.`))));
    if (conf) f('Depois, toque no botão verde.');
  }
  // preços nos caixotes: a faixa (e, com menos de 3 preços na faixa, os vizinhos de fora até completar)
  const naBarraca = new Set(precos);
  const k = precos.length >= 4 ? 4 : 3;
  const fora = faixa(1, 10).filter(v => precos.indexOf(v) < 0).sort((a, b) => Math.abs(a - (a < min ? min : max)) - Math.abs(b - (b < min ? min : max)));
  fora.slice(0, Math.max(0, k - precos.length)).forEach(v => naBarraca.add(v));
  PRODUTOS.forEach(pr => [...naBarraca].sort((a, b) => a - b).forEach(v => f(`${M(pr)} custa ${ext(v)}.`)));
  if (p.demo) f(troco ? 'Ponha moedinhas nas casinhas vazias!' : 'Leve as moedinhas para o balcão!');
  // contagem das moedas ("três... quatro, cinco!") e o "Agora tem…" ao tirar uma moeda
  if (moedas.indexOf(5) >= 0) { f('Cinco!'); f('Cinco...'); }
  for (let a = troco ? min : 1; a < maxTotal; a++) f(M(ext(a)) + '...');
  for (let v = 1; v <= maxTotal; v++) f(ext(v));
  if (troco) for (let t = min; t < pagaCom; t++) f('Agora tem ' + ext(t) + '.');
  else { for (let t = 1; t < maxTotal; t++) f('Agora tem ' + ext(t) + '.'); f('O balcão ficou vazio.'); }
  if (troco) {
    // erros (Pronto com casas vazias) e ajuda
    for (let t = min; t < pagaCom; t++) f((pagaCom - t === 1 ? 'Quase! ' : '') + `Deu ${ext(t)}. Precisamos de ${ext(pagaCom)}.`);
    precos.forEach(P => { f(`Custa ${ext(P)}...`); f(`${M(ext(pagaCom - P))} de troco.`); });
    for (let fl = 1; fl <= pagaCom - min; fl++) f(`${fl === 1 ? 'Falta' : 'Faltam'} ${ext(fl)} para ${ext(pagaCom)}.`);
    f(`Chegou no ${ext(pagaCom)}!` + (conf ? ' Toque no botão verde!' : ''));
    return;
  }
  if (conf) { f('Ponha as moedinhas no balcão.'); precos.forEach(P => f(`Deu ${ext(P)}.`)); }
  // erros: total diferente do preço (com Pagar, qualquer total possível; sem Pagar, só passando do preço)
  PRODUTOS.forEach(pr => precos.forEach(P => {
    for (let t = conf ? 1 : P + 1; t <= maxTotal; t++) {
      if (t === P) continue;
      f((Math.abs(t - P) === 1 ? 'Quase! ' : '') + `Deu ${ext(t)}. ${M(pr)} custa ${ext(P)}.`);
    }
  }));
  // ajuda (2º erro): contar o balcão
  PRODUTOS.forEach(pr => precos.forEach(P => f(`O balcão está vazio. ${M(pr)} custa ${ext(P)}.`)));
  f('Vamos contar as moedinhas do balcão.');
  for (let s = 1; s <= maxTotal; s++) {
    precos.forEach(P => {
      if (s < P) f(`Temos ${ext(s)}. ${P - s === 1 ? 'Falta' : 'Faltam'} ${ext(P - s)}.`);
      else if (s > P) f(`Temos ${ext(s)}. ${s - P === 1 ? 'Sobra' : 'Sobram'} ${ext(s - P)}.`);
      else f(`Temos ${ext(s)}.` + (conf ? ' Toque no botão verde!' : ''));
    });
  }
}

// ================================================================ sapinho (jogo/js/atividades/sapinho.js)
const ORDINAIS = ['primeira', 'segunda', 'terceira', 'quarta', 'quinta', 'sexta', 'sétima', 'oitava', 'nona', 'décima'];
function sequencia(p) {
  let passo = p.passo || 1;
  passo = Math.max(-10, Math.min(10, passo));
  let inicio = Math.max(0, p.inicio != null ? p.inicio : (passo > 0 ? 1 : 10));
  let n = Math.max(4, Math.min(11, p.quantidade || 5));
  if (passo < 0) {
    n = Math.min(n, Math.floor(inicio / -passo) + 1);
    if (n < 4) { n = 4; inicio = -passo * 3; }
  }
  const valores = [];
  for (let i = 0; i < n; i++) valores.push(inicio + i * passo);
  return { valores, passo, n };
}
function distratores(certo, passo) {
  const pa = Math.abs(passo);
  let pref;
  if (passo === 1 || passo === 2) pref = [certo - 1, certo + 1, certo + 2, certo - 2, certo + 3];
  else if (passo === -1) pref = [certo + 2, certo - 1, certo + 1, certo + 3, certo - 2];
  else if (passo === 10) pref = [certo - 9, certo + 10, certo + 1, certo - 10, certo - 1];
  else if (passo > 0) pref = [certo - passo + 1, certo + passo, certo + 1, certo - 1, certo + 2];
  else pref = [certo + 2 * pa, certo - pa, certo + 1, certo - 1, certo + pa];
  const r = [];
  const pode = v => v >= 0 && v !== certo && r.indexOf(v) < 0;
  for (const v of pref) { if (r.length < 2 && pode(v)) r.push(v); }
  for (let d = 1; r.length < 2 && d < 50; d++) for (const v of [certo + d, certo - d]) if (r.length < 2 && pode(v)) r.push(v);
  return r;
}
function sapinho(f, p, estacao) {
  const { valores, passo, n } = sequencia(p);
  const P = Math.abs(passo);
  const seguidas = estacao > 27;                       // permiteSeguidas: só depois da estação 27 (a 14ª de números)
  // abertura (1ª rodada e seguintes)
  for (const primeiraRodada of [true, false]) {
    const primeira = primeiraRodada ? 'Este é o Pulo! ' : '';
    const ini = valores[0], fim = valores[n - 1];
    if (passo < 0) f(`${primeira}Agora para trás, do ${ext(ini)} até o ${ext(fim)}!`);
    else if (P === 1 && ini <= 1) f(primeiraRodada ? 'Este é o Pulo! Vamos contar com ele!' : 'Vamos contar com o Pulo!');
    else if (P === 1) f(`${primeira}Vamos contar do ${ext(ini)} até o ${ext(fim)}!`);
    else f(`${primeira}Agora de ${ext(P)} em ${ext(P)}!`);
  }
  // números das folhas (o Pulo andando e a ajuda, que volta duas folhas e conta)
  valores.forEach(v => f(ext(v)));
  if (p.demo) f('Toque na bolha certa!');
  for (let g = 2; g <= n - 2; g++) {
    const c = valores[g - 1];
    // a regra só vai na repetição (texto completo); a pergunta de cara é curta (igual a sapinho.js)
    const regra = passo < 0 ? (P > 1 ? `De ${ext(P)} em ${ext(P)} para trás! ` : 'Contando para trás! ') : (P > 1 ? `De ${ext(P)} em ${ext(P)}! ` : '');
    // perguntas: com e sem a folha seguinte visível (lacunas seguidas), primeira lacuna da rodada ou não
    for (const temProx of seguidas ? [true, false] : [true]) {
      const prox = temProx ? valores[g + 1] : null;
      for (const primeira of [true, false]) {
        const Ev = primeira ? '' : 'E ', Q = primeira ? 'Qual' : 'qual';
        let tipos;
        if (passo > 0) tipos = ['depois'].concat(temProx && P === 1 ? ['entre'] : []).concat(temProx ? ['antes'] : []);
        else tipos = ['depois'].concat(temProx && P === 1 ? ['entre'] : []);
        tipos.forEach(tipo => {
          let texto;
          if (tipo === 'entre') {
            const a = Math.min(c, prox), b = Math.max(c, prox);
            texto = `${Ev}${Q} fica entre o ${ext(a)} e o ${ext(b)}?`;
          } else if (tipo === 'antes') {
            texto = P === 1 ? `${Ev}${Q} número vem antes do ${ext(prox)}?` : `${Ev}${Q} vem antes do ${ext(prox)}?`;
          } else if (passo < 0) {
            texto = `${Ev}${Q} vem depois do ${ext(c)}?`;
          } else {
            texto = P === 1 ? `${Ev}${Q} número vem depois do ${ext(c)}?` : `${Ev}${Q} vem depois do ${ext(c)}?`;
            if (P === 1 && valores[0] === 1 && g - 1 < ORDINAIS.length) {
              f(texto);
              texto = `O Pulo está na ${ORDINAIS[g - 1]} folha. ` + texto.replace(/^E qual/, 'Qual');
            }
          }
          f(texto);
          if (regra) f(regra + texto.replace(/^E qual/, 'Qual'));
        });
      }
    }
    // erros: as duas bolhas erradas da lacuna
    const certo = valores[g];
    distratores(certo, passo).forEach(errado => {
      const quase = Math.abs(errado - certo) === 1;
      let contar = 'Vamos contar';
      if (P > 1) contar = `De ${ext(P)} em ${ext(P)}`;
      if (passo < 0) contar = P > 1 ? contar + ', para trás' : 'Vamos contar para trás';
      f(`${quase ? 'Quase! ' : ''}Esse é o ${ext(errado)}. ${contar}: ${ext(valores[g - 2])}, ${ext(valores[g - 1])}...?`);
    });
    // acerto da lacuna (lacunas sorteadas)
    const dito = P === 1 && certo >= 16 && certo <= 19 ? dezEMais(certo) : ext(certo);
    f(M(dito) + '!');
  }
}

// ================================================================ álbum, livre, pais
function album(f) {
  f('Seu álbum! Toque numa figurinha.');
  f('Brinque na trilha e ganhe figurinhas!');
  f('Figurinha nova! Toque nela.');
  f('Figurinhas novas! Toque nelas.');
  f('Álbum completo! Sessenta figurinhas!');
  f('Aqui ainda está vazio.');
  f('Toque numa figurinha!');
  f('Suas figurinhas estão aqui!');
  f('Nenhuma figurinha ainda.');
  ['Prado', 'Lagoa', 'Floresta'].forEach(r => f(r + '!'));
  const FIGS = [
    ['ipê-amarelo'], ['joão-de-barro'], ['tamanduá-bandeira'], ['seriema'], ['lobo-guará'], ['borboleta-azul'], ['joaninha'],
    ['abelha jataí'], ['girassol'], ['quero-quero'], ['vitória-régia'], ['garça-branca'], ['ariranha'], ['martim-pescador'],
    ['tuiuiú'], ['libélula'], ['jacaré-de-papo-amarelo'], ['peixinho lambari'], ['sapo-cururu'],
    ['capivara'], ['onça-pintada'], ['bicho-preguiça'], ['tucano'], ['arara-azul'],
    ['mico-leão-dourado'], ['quati'], ['coruja-buraqueira'], ['beija-flor'], ['cogumelo', 'Cogumelos!'],
    ['Pipoca com medalha', 'A Pipoca ganhou uma medalha!'],
    // estações de letras (fig31–fig60)
    ['bem-te-vi'], ['sabiá-laranjeira'], ['tatu-bola'], ['ema'], ['carcará'], ['papagaio'], ['vaga-lume'], ['gafanhoto'], ['caju'],
    ['flor-de-maracujá'], ['boto-cor-de-rosa'], ['tracajá'], ['pirarucu'], ['arraia'], ['cervo-do-pantanal'], ['colhereiro'], ['anta'],
    ['jaçanã'], ['sucuri'], ['aguapé'], ['sagui'], ['harpia'], ['jabuti'], ['cutia'], ['jiboia'], ['sapinho-ponta-de-flecha'],
    ['bromélia'], ['pau-brasil'], ['castanheira'], ['Pipoca lendo', 'A Pipoca aprendeu a ler!'],
  ];
  // desde nov/2026 só 12 bichos são prêmio (a cada 5 estações; RECOMPENSAS em jogo/js/figurinhas.js); os nomes das
  // coisas da casa vêm de livre() (jogo/js/casa/itens.js)
  const fonteFig = fs.readFileSync(new URL('../jogo/js/figurinhas.js', import.meta.url), 'utf8');
  const premios = new Set([...fonteFig.matchAll(/'fig(\d\d)'/g)].map(m => Number(m[1]) - 1));
  FIGS.forEach(([nome, fala], i) => { if (premios.has(i)) f(fala || M(nome) + '!'); });
  const total = 60;
  for (let g = 1; g <= total; g++) f('Você tem ' + quantidade(g, 'figurinha', 'figurinhas', { feminino: true }) + '!' + (g >= total ? ' Álbum completo!' : ''));
}
// Casa da Pipoca (jogo/js/telas/casa.js): falas da Pipoca e o nome de cada item (tocar no item ou na cartinha do baú).
// Os nomes vêm de jogo/js/casa/itens.js (lidos do arquivo, sem carregar os desenhos).
function livre(f) {
  f('Esta é a minha casa! Tire coisas do baú e arrume do seu jeito.');
  f('Que bom que você voltou!');
  ['Oi!', 'Que casa bonita!', 'Vamos brincar?'].forEach(t => f(t));
  // tomadas, fios e o botão de modo (jogo/js/telas/casa.js)
  ['Ih, precisa ligar na tomada!', 'Ih, precisa colocar na tomada!', 'O fio não alcança! Leve para mais perto da tomada.',
    'Essa tomada já está ocupada!', 'Agora eu falo o nome das coisas!', 'Agora é para brincar!',
    'Ficou de noite! Boa noite!', 'Olha a lua!', 'Bom dia! O sol voltou!', 'Amanheceu!', 'Lustre!', 'Interruptor!', 'Janela!'].forEach(t => f(t));
  // o relógio da sala diz a hora (uma hora cheia de 1 a 12)
  f('É uma hora!');
  for (let h = 2; h <= 12; h++) f('São ' + extenso(h, { feminino: true }) + ' horas!');   // duas horas (feminino)
  // regador molhando a hortinha (jogo/js/casa/quintal.js)
  ['Plantinha gosta de água!', 'Olha, cresceu!', 'Cresceu um pouquinho!'].forEach(t => f(t));
  const fonte = fs.readFileSync(new URL('../jogo/js/casa/itens.js', import.meta.url), 'utf8');
  const nomes = new Set();
  for (const m of fonte.matchAll(/item\('[^']+', '[^']+', '([^']+)'/g)) nomes.add(m[1]);
  nomes.forEach(n => f(M(n) + '!'));
  // ímãs de letrinhas da geladeira (a Pipoca diz o nome da letra)
  ['Á', 'Bê', 'Cê', 'Dê', 'É'].forEach(l => f(l + '!'));
}
function pais(f) {
  f('Oi! Eu sou a Pipoca. Vamos contar até três?');
  f('Hora de descansar! Até amanhã!');
}

// ================================================================ montagem
const ATIVIDADES = {
  torre: (f, p) => (p.modo === 'comparar' ? torreComparar(f, p) : torreConstruir(f, p)),
  pintinhos: (f, p) => (p.modo === 'comparar' ? pintinhosComparar(f, p) : pintinhosNumero(f, p)),
  tracar, juntar, separar, feirinha, sapinho,
};

export default function frasesExtras() {
  const lista = [];
  // repetidas só dentro da mesma origem saem (entre origens diferentes ficam todas)
  const coletor = origem => {
    const vistas = new Set();
    return texto => {
      const t = semAlgarismos(String(texto).trim());
      if (!t || vistas.has(t)) return;
      vistas.add(t);
      lista.push({ origem, texto: t });
    };
  };
  abertura(coletor('abertura'));
  mapa(coletor('mapa'));
  atividade(coletor('atividade'));
  FASES.forEach((e, i) => {
    const n = 2 * i + 1;                                 // trilha intercalada: as de números são as ímpares
    ATIVIDADES[e.atividade](coletor('estacao-' + String(n).padStart(2, '0')), e.params, n);
  });
  album(coletor('album'));
  livre(coletor('livre'));
  pais(coletor('pais'));
  return lista;
}
