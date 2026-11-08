/* Pipoca Conta — progresso, figurinhas, ajustes, tempo de uso e estatísticas, guardados só no aparelho (localStorage).
   Nada disso sai do aparelho. Estação = número de 1 a 30; figurinha = 'fig01'…'fig30'.
   #dados=memoria na URL (e nos testes automáticos) usa só a memória, sem tocar no localStorage.
   #progresso=N marca as estações 1 a N como concluídas (com as figurinhas), para testar mapa e álbum. */
(function () {
  'use strict';
  const PC = window.PC;
  const CHAVE = 'pipoca-conta:v1';
  const AJUSTES_PADRAO = () => ({
    som: true,               // efeitos sonoros
    voz: true,               // só para testes; os pais ajustam volume e velocidade, não desligam a voz
    vozVolume: 1,            // 0.4 a 1
    vozDevagar: false,       // fala mais devagar
    limiteMin: 0,            // limite diário em minutos (0 = sem limite)
    esconderOfertas: false,  // esconde as ofertas de assinatura na área dos pais
  });
  const padrao = () => ({ versao: 1, concluidas: [], figurinhas: [], ajustes: AJUSTES_PADRAO(), extras: {}, uso: {}, liberadoEm: '', estatisticas: {} });
  let d = padrao();
  let modo = 'local';

  function ler() {
    if (modo === 'memoria') return;
    let t = null;
    try { t = localStorage.getItem(CHAVE); } catch (e) { modo = 'memoria'; return; }
    if (!t) return;
    try {
      const o = JSON.parse(t) || {};
      d = {
        versao: 1,
        concluidas: Array.isArray(o.concluidas) ? o.concluidas.filter(n => Number.isInteger(n) && n >= 1 && n <= 99) : [],
        figurinhas: Array.isArray(o.figurinhas) ? o.figurinhas.filter(s => /^fig\d\d$/.test(s)) : [],
        ajustes: Object.assign(AJUSTES_PADRAO(), o.ajustes || {}),
        extras: o.extras && typeof o.extras === 'object' ? o.extras : {},
        uso: o.uso && typeof o.uso === 'object' ? o.uso : {},
        liberadoEm: typeof o.liberadoEm === 'string' ? o.liberadoEm : '',
        estatisticas: o.estatisticas && typeof o.estatisticas === 'object' ? o.estatisticas : {},
      };
    } catch (e) {
      // JSON estragado: guarda uma cópia e recomeça sem travar
      try { localStorage.setItem(CHAVE + ':corrompido', t); } catch (e2) { /* ok */ }
      d = padrao();
    }
  }
  function salvar() {
    if (modo === 'memoria') return;
    try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) { /* sem espaço ou bloqueado */ }
  }
  function aplicarAjustes() {
    if (PC.som) PC.som.ligado = d.ajustes.som !== false;
    if (PC.voz) PC.voz.ligada = d.ajustes.voz !== false;
  }
  const total = () => (PC.fases && PC.fases.length) || 30;
  const dia = (desloc = 0) => {
    const x = new Date(); x.setDate(x.getDate() - desloc);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  };

  PC.dados = {
    /** opcoes: { memoria: boolean, progresso: N } */
    carregar(opcoes = {}) {
      if (opcoes.memoria) modo = 'memoria';
      ler();
      if (opcoes.progresso) {
        for (let n = 1; n <= Math.min(total(), opcoes.progresso); n++) {
          if (d.concluidas.indexOf(n) < 0) d.concluidas.push(n);
          const f = 'fig' + String(n).padStart(2, '0');
          if (d.figurinhas.indexOf(f) < 0) d.figurinhas.push(f);
        }
        d.concluidas.sort((a, b) => a - b);
      }
      aplicarAjustes();
    },
    get modo() { return modo; },
    salvar,
    /** A estação n (1…30) já foi concluída? */
    estacaoConcluida: n => d.concluidas.indexOf(n) >= 0,
    /**
     * Conclui a estação e dá a figurinha numa única gravação.
     * Devolve { primeiraVez: boolean, nova: boolean (figurinha nova) }.
     */
    concluirEstacao(n, figurinha) {
      const primeiraVez = d.concluidas.indexOf(n) < 0;
      if (primeiraVez) { d.concluidas.push(n); d.concluidas.sort((a, b) => a - b); }
      const nova = !!figurinha && d.figurinhas.indexOf(figurinha) < 0;
      if (nova) d.figurinhas.push(figurinha);
      if (primeiraVez || nova) salvar();
      if (primeiraVez) PC.emitir('dados:progresso', n);
      if (nova) PC.emitir('dados:figurinha', figurinha);
      return { primeiraVez, nova };
    },
    concluidas: () => d.concluidas.slice(),
    /** Primeira estação ainda não concluída (total + 1 se a trilha acabou). */
    proximaEstacao() { for (let i = 1; i <= total(); i++) if (d.concluidas.indexOf(i) < 0) return i; return total() + 1; },
    /** A estação pode ser jogada pela ordem da trilha? (sem olhar a assinatura) */
    disponivel(n) { return n >= 1 && n <= (PC.dev && PC.dev.ativo() ? total() : Math.min(total(), PC.dados.proximaEstacao())); },
    figurinhas: () => new Set(d.figurinhas),
    /** Ganha uma figurinha avulsa. Devolve true se era nova. */
    ganharFigurinha(id) {
      if (!id || d.figurinhas.indexOf(id) >= 0) return false;
      d.figurinhas.push(id); salvar();
      PC.emitir('dados:figurinha', id);
      return true;
    },
    /** Ajustes: { som, voz, vozVolume, vozDevagar, limiteMin, esconderOfertas }. Altere e chame salvarAjustes(). */
    get ajustes() { return d.ajustes; },
    salvarAjustes() { salvar(); aplicarAjustes(); PC.emitir('dados:ajustes', d.ajustes); },
    /** Valores pequenos de telas (ex.: posição do mapa, rodada para retomar). */
    extra(chave, valor) {
      if (arguments.length < 2) return d.extras[chave];
      if (valor === undefined) delete d.extras[chave]; else d.extras[chave] = valor;
      salvar(); return valor;
    },

    // ---------------- estatísticas por estação (só no aparelho; aparecem na área dos pais)
    /** Soma uma jogada da estação: { erros, dicas, segundos }. */
    registrarEstatistica(n, { erros = 0, dicas = 0, segundos = 0 } = {}) {
      const e = d.estatisticas[n] || { vezes: 0, erros: 0, dicas: 0, segundos: 0 };
      e.vezes++; e.erros += erros; e.dicas += dicas; e.segundos += Math.round(segundos);
      d.estatisticas[n] = e; salvar();
    },
    estatisticas: () => JSON.parse(JSON.stringify(d.estatisticas)),

    // ---------------- tempo de uso (supervisão dos pais)
    /** Soma segundos de uso ao dia de hoje (guarda os últimos 14 dias). */
    registrarUso(segundos) {
      const hoje = dia();
      d.uso[hoje] = (d.uso[hoje] || 0) + segundos;
      const manter = new Set(Array.from({ length: 14 }, (_, i) => dia(i)));
      Object.keys(d.uso).forEach(k => { if (!manter.has(k)) delete d.uso[k]; });
      salvar();
    },
    tempoHoje: () => d.uso[dia()] || 0,
    tempoSemana: () => Array.from({ length: 7 }, (_, i) => d.uso[dia(i)] || 0).reduce((a, b) => a + b, 0),
    /** O limite diário (se ligado) já foi atingido hoje? */
    limiteAtingido() {
      const lim = Number(d.ajustes.limiteMin) || 0;
      if (!lim || d.liberadoEm === dia()) return false;
      return PC.dados.tempoHoje() >= lim * 60;
    },
    /** Um adulto libera mais tempo só por hoje. */
    liberarHoje() { d.liberadoEm = dia(); salvar(); },

    /** Apaga progresso, figurinhas, estatísticas e tempo de uso (mantém os ajustes; a assinatura é do Google Play). */
    zerar() { const aj = d.ajustes; d = padrao(); d.ajustes = aj; salvar(); PC.emitir('dados:zerados'); },
  };

  // ---------------- modo desenvolvedor: todas as estações abertas (fora da ordem e sem assinatura)
  // Liga na área dos pais (7 toques na linha da versão). Só existe no navegador e no APK de teste (debug): no APK da
  // loja o Android não manda 'depuracao' e os toques não fazem nada (não vira um jeito de pular a assinatura).
  PC.dev = {
    permitido: () => !PC.modoApp || !!PC.depuracao,
    ativo: () => PC.dev.permitido() && !!(d && d.extras && d.extras.dev),
    ligar(v) { PC.dados.extra('dev', v ? true : undefined); PC.emitir('dev:mudou', PC.dev.ativo()); return PC.dev.ativo(); },
  };
})();
