/* Pipoca Conta — a trilha: 3 regiões e 30 estações (PROJETO.md, seção 7).
   Cada estação: n (1…30), regiao, atividade, params, figurinha ('fig01'…'fig30').
   As 4 primeiras são grátis (PC.config.estacoesGratis). Parâmetros comuns:
     demo: true      primeira rodada começa com a Pipoca demonstrando (estreia de atividade ou modo)
     confirmar: true a criança decide quando terminou e toca no botão Pronto (ou Pagar); sem isso, o acerto é automático
     tempo           sempre em milissegundos */
(function () {
  'use strict';
  const PC = window.PC;

  PC.regioes = [
    { id: 'prado', nome: 'Prado', subtitulo: 'Números de 1 a 5', de: 1, ate: 10, cenario: 'prado', cor: '#5CC84A' },
    { id: 'lagoa', nome: 'Lagoa', subtitulo: 'Números de 6 a 10', de: 11, ate: 20, cenario: 'lagoa', cor: '#4DA3FF' },
    { id: 'floresta', nome: 'Floresta', subtitulo: 'Até 20 e até 100', de: 21, ate: 30, cenario: 'floresta', cor: '#9B7BFF' },
  ];

  const E = (atividade, params) => ({ atividade, params });
  const lista = [
    // ---------------- Prado (Educação Infantil, 1 a 5)
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
    // ---------------- Lagoa (Educação Infantil, 6 a 10)
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
    // ---------------- Floresta (1º ano, até 20 e até 100)
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

  PC.fases = lista.map((e, i) => {
    const n = i + 1;
    const regiao = PC.regioes.find(r => n >= r.de && n <= r.ate).id;
    return { n, regiao, atividade: e.atividade, params: e.params, figurinha: 'fig' + String(n).padStart(2, '0') };
  });

  PC.fase = n => PC.fases.find(f => f.n === n) || null;
  PC.regiaoDe = n => PC.regioes.find(r => n >= r.de && n <= r.ate) || PC.regioes[0];

  /** Quantas rodadas uma atividade terá com estes parâmetros. */
  PC.rodadasDe = (atividade, params) => {
    const def = PC.atividades.obter(atividade);
    if (def && typeof def.totalRodadas === 'function') return def.totalRodadas(params);
    if (def && typeof def.rodadasDe === 'function') return def.rodadasDe(params);
    if (params && Array.isArray(params.digitos)) return params.digitos.length;
    return (params && params.rodadas) || 3;
  };
})();
