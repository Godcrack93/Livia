// Pipoca Aprende — todas as falas possíveis das estações de letras (as pares), geradas a partir do banco de palavras
// (jogo/js/palavras.js) e dos modelos de frase de cada atividade (jogo/js/atividades/*.js), com a mesma grafia.
// O robô (frases-coletar.mjs) só ouve as palavras que sorteou; aqui entram todas as que podem aparecer.
// Cada fala vai para a PRIMEIRA estação em que pode aparecer (frases-montar.mjs tira as repetidas).
// Uso: import frasesLetras from './frases-letras.mjs'; frasesLetras() → [{ origem: 'estacao-02', texto }, ...]
// Se mudar uma fala numa atividade de letras, mude aqui também.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const JS = path.resolve(AQUI, '..', 'jogo', 'js');
const require = createRequire(import.meta.url);

export default function frasesLetras() {
  // carrega o banco de palavras, as figurinhas e a trilha num "window" falso
  const antes = globalThis.window;
  globalThis.window = { PC: { atividades: { obter() { return null; } } } };
  for (const f of ['palavras.js', 'figurinhas.js', 'fases.js']) {
    const arq = path.join(JS, f);
    delete require.cache[require.resolve(arq)];
    require(arq);
  }
  const PC = globalThis.window.PC;
  globalThis.window = antes;
  const P = PC.palavras;

  const M = s => s.charAt(0).toUpperCase() + s.slice(1);
  const nome = w => P.nome(w), Nome = w => M(P.nome(w));
  const fs = s => P.falaSilaba(s);
  const L = l => P.falaLetra(l);
  const ehA = w => P.artigo(w) === 'a';
  const VOGAIS = ['A', 'E', 'I', 'O', 'U'];
  const PEDACOS = ['', 'um pedaço', 'dois pedaços', 'três pedaços', 'quatro pedaços', 'cinco pedaços'];
  const todas = P.lista;

  const A = {
    // jogo/js/atividades/tambor.js
    tambor(p, f) {
      const W = P.filtrar({ silabas: p.silabas, bichos: p.bichos ? true : undefined });
      if (p.demo) { f('Para apagar, toque na bolinha.'); f('Agora é sua vez!'); }
      for (const w of W) {
        const sil = w.silabas.map(fs);
        f(`Bata no tambor: um toque para cada pedaço. ${Nome(w)}!`);
        sil.forEach(s => f(s));
        f(`${Nome(w)} tem ${PEDACOS[sil.length]}: ${sil.join(', ')}.`);
      }
    },
    // jogo/js/atividades/tracar.js (modo letra)
    tracar(p, f) {
      if (!p.letras) return;
      f('Comece na bolinha verde.');
      f('Agora arraste o dedo pela setinha!');
      ['Agora o tracinho do meio!', 'Agora os tracinhos deitados!', 'Agora a barriga!', 'Agora a barriga de cima!',
        'Agora a barriga de baixo!', 'Agora a perninha!'].forEach(t => f(t));
      if (p.demo) f(`Olha como se escreve a letra ${L(p.letras[0])}!`);
      for (const l of p.letras) {
        f(`Vamos escrever a letra ${L(l)}! Comece na bolinha verde.`);
        const ws = P.filtrar({ iniciais: [l] });              // (aqui não há desenhos carregados: todas as do banco)
        f(M(L(l)) + '!');
        ws.forEach(w => f(`${M(L(l))} de ${nome(w)}!`));
      }
    },
    // jogo/js/atividades/inicial.js
    inicial(p, f) {
      const modo = p.modo === 'bicho' ? 'bicho' : 'letra';
      const W = P.filtrar({ iniciais: p.letras }).filter(w => w.id !== 'escada');
      const letras = [...new Set([...p.letras, ...VOGAIS])];
      const esticada = w => {
        const s = fs(w.silabas[0]);
        const m = s.match(/[aeiouáéíóúâêôãõ]/i);
        const comeco = m ? s.slice(0, m.index) + m[0].repeat(3) + s.slice(m.index + 1) : s;
        const resto = w.silabas.slice(1).join('').toLowerCase();
        return M(comeco) + '… ' + (resto ? resto + '. ' : '') + Nome(w) + '!';
      };
      if (modo === 'letra') {
        for (const l of letras) { f(`É ${L(l)},`); f(`${L(l)},`); f(`ou ${L(l)}?`); f(`Toque na letra ${L(l)}!`); }
        for (const w of W) {
          f(`${Nome(w)}! Com que letra começa ${nome(w)}?`);
          f(`${M(L(w.inicial))}! ${Nome(w)} começa com ${L(w.inicial)}!`);
          f(esticada(w));
          for (const l of letras) if (l !== w.inicial) f(`Essa é a letra ${L(l)}. ${Nome(w)} começa com ${L(w.inicial)}.`);
        }
      } else {
        for (const l of p.letras) { f(`Qual começa com ${L(l)}?`); f(M(L(l)) + '!'); }
        // opções: a certa e outras do banco (com figura)
        for (const w of todas) {
          f(Nome(w) + ','); f(nome(w) + ','); f(`ou ${nome(w)}?`);
          f(`Toque ${ehA(w) ? 'na' : 'no'} ${nome(w)}!`);
          f(`${ehA(w) ? 'Essa é a' : 'Esse é o'} ${nome(w)}. ${Nome(w)} começa com ${L(w.inicial)}.`);
        }
        for (const w of W) { f(`${Nome(w)}! ${Nome(w)} começa com ${L(w.inicial)}!`); f(esticada(w)); }
      }
    },
    // jogo/js/atividades/rimas.js
    rimas(p, f) {
      const R = P.filtrar({ rima: true });
      const G = P.gruposDeRima();
      f('Escute o fim!');
      for (const w of R) {
        f(Nome(w) + '!');
        const s = w.silabas.map(fs);
        f(s.join('… ') + '… ' + s[s.length - 1] + '!');
      }
      if (p.modo === 'intruso') {
        f('Qual não rima?');
        for (const g of Object.values(G)) for (const a of g) for (const b of g) if (a !== b) {
          f(`${Nome(a)} rima com ${nome(b)}. Qual não rima?`);
          f(`${Nome(a)}, ${nome(b)}!`);
        }
        for (const w of R) f(`Isso! ${Nome(w)} não rima.`);
      } else {
        for (const g of Object.values(G)) for (const m of g) {
          f(`${Nome(m)} rima com…?`);
          for (const c of g) if (c !== m) f(`${Nome(m)}, ${nome(c)}! Rimou!`);
        }
        for (const w of R) f(`${Nome(w)} não rima.`);
      }
    },
    // jogo/js/atividades/montar.js
    montar(p, f) {
      const W = P.filtrar({ silabas: p.silabas, bichos: p.bichos ? true : undefined });
      const daPalavra = new Set(W.flatMap(w => w.silabas));
      const despistes = p.despiste ? new Set(todas.flatMap(w => w.silabas)) : new Set();
      if (p.demo) f('Toque numa folhinha para ouvir.');
      for (const w of W) { f(`Vamos montar ${nome(w)}! Arraste as folhinhas para os espaços.`); f(Nome(w) + '!'); }
      for (const s of daPalavra) { f(M(fs(s)) + '…'); f(`Aqui vai ${fs(s)}.`); if (p.demo) f(`Olhe! ${M(fs(s))} vai aqui.`); }
      for (const s of new Set([...daPalavra, ...despistes])) { f(M(fs(s)) + '…'); f(`Essa é ${fs(s)}.`); }
    },
    // jogo/js/atividades/pares.js
    pares(p, f) {
      f('Leve cada ovinho para o ninho da mesma letra!');
      for (const l of p.letras) {
        f(`${M(L(l))} grande e ${L(l)} pequeno!`); f(`Esse é o ${L(l)} pequeno.`); f(`${M(L(l))} pequeno.`);
        f(`${M(L(l))} grande.`); f(`O ${L(l)} pequeno vai no ninho do ${L(l)} grande!`);
      }
    },
    // jogo/js/atividades/ler.js
    ler(p, f) {
      const W = P.filtrar({ silabas: p.silabas });
      f('Leia comigo! Que palavra é essa?');
      f('Vamos ler devagar, pedacinho por pedacinho.');
      if (p.demo) { f('Olhe como eu leio: toco em cada pedacinho.'); f('Agora toque no pato!'); }
      for (const w of W) { f(Nome(w) + '!'); w.silabas.forEach(s => f(fs(s))); }
      for (const w of todas) f(`${ehA(w) ? 'Essa é' : 'Esse é'} ${P.artigo(w)} ${nome(w)}. Toque nos pedacinhos e leia de novo.`);
    },
  };

  const lista = [];
  for (const fase of PC.fases) {
    if (fase.materia !== 'letras' || !A[fase.atividade]) continue;
    const origem = 'estacao-' + String(fase.n).padStart(2, '0');
    A[fase.atividade](fase.params, texto => lista.push({ origem, texto }));
  }
  return lista;
}
