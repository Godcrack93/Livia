// Sorteios determinísticos: a mesma semente gera a mesma fase em qualquer aparelho.
// Só usa aritmética inteira de 32 bits (Math.imul, >>>), que dá o mesmo resultado em todo motor JS.
(function (P) {
  'use strict';

  // FNV-1a sobre as unidades UTF-16 do texto.
  function hash(texto) {
    const s = String(texto);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  // sfc32: rápido e de boa qualidade. Uma semente que não é número é tratada como texto.
  function criar(semente) {
    const s = typeof semente === 'number' ? semente >>> 0 : hash(semente);
    let a = s ^ 0x9e3779b9;
    let b = Math.imul(s, 0x85ebca6b) ^ 0x243f6a88;
    let c = Math.imul(s ^ (s >>> 16), 0xc2b2ae35) ^ 0xb7e15162;
    let d = s;

    function passo() {
      const t = (((a + b) | 0) + d) | 0;
      d = (d + 1) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      c = (c + t) | 0;
      return t >>> 0;
    }
    // Os primeiros valores ainda lembram a semente: descarta.
    for (let i = 0; i < 15; i++) passo();

    const gerador = {
      proximo() {
        return passo() / 4294967296;
      },
      inteiro(min, max) {
        return min + Math.floor(gerador.proximo() * (max - min + 1));
      },
      escolher(lista) {
        return lista[Math.floor(gerador.proximo() * lista.length)];
      },
      embaralhar(lista) {
        for (let i = lista.length - 1; i > 0; i--) {
          const j = Math.floor(gerador.proximo() * (i + 1));
          const t = lista[i];
          lista[i] = lista[j];
          lista[j] = t;
        }
        return lista;
      },
      chance(p) {
        return gerador.proximo() < p;
      },
    };
    return gerador;
  }

  P.Aleatorio = { criar, hash };
})(globalThis.Parafusinhos = globalThis.Parafusinhos || {});
