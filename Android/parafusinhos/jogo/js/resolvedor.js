// Resolvedor (spec §5): busca em profundidade com memória de estados sem saída, usada pela Dica.
(function (P) {
  'use strict';

  const R = P.Regras;
  const PADRAO = { limiteNos: 60000, limiteMs: 300 };
  const VOLTA = { limiteNos: 15000, limiteMs: 80 }; // por estado do histórico
  const VOLTA_TOTAL_MS = 1500;

  // Sem performance.now (raro), vale só o limite de nós.
  function agora() {
    const p = globalThis.performance;
    return p && typeof p.now === 'function' ? p.now() : null;
  }

  // Para cada placa, os parafusos que ela cobre (inverso de nivel.cobertoPor).
  const cobertosPorPlaca = new WeakMap();
  function cobre(nivel) {
    let lista = cobertosPorPlaca.get(nivel);
    if (!lista) {
      lista = nivel.placas.map(() => []);
      nivel.cobertoPor.forEach((placas, id) => placas.forEach((q) => lista[q].push(id)));
      cobertosPorPlaca.set(nivel, lista);
    }
    return lista;
  }

  // Estados equivalentes têm a mesma chave: na bandeja só importam as cores, e numa caixa só cor e
  // quantidade (o resto do jogo não depende de qual parafuso é qual nem de qual slot é qual).
  function chave(nivel, e) {
    let k = '';
    const rem = e.removido;
    for (let i = 0; i < rem.length; i += 15) {
      let v = 0;
      for (let j = 0; j < 15 && i + j < rem.length; j++) if (rem[i + j]) v |= 1 << j;
      k += String.fromCharCode(48 + v);
    }
    const caixas = e.slots.map((c) => (c ? c.cor * 4 + c.parafusos.length : -1)).sort((a, b) => a - b);
    const cores = e.bandeja.map((id) => nivel.parafusos[id].cor).sort((a, b) => a - b);
    return k + '|' + caixas.join(',') + '|' + e.proxima + '|' + cores.join('') + '|' + e.extra;
  }

  // Jogadas legais, das mais promissoras para as menos (§5). Parafusos livres da mesma placa e
  // da mesma cor dão estados equivalentes: basta tentar um deles.
  function lances(nivel, e, cobertos) {
    const cabe = e.bandeja.length < R.capacidadeBandeja(nivel, e);
    const prox1 = nivel.caixas[e.proxima];
    const prox2 = nivel.caixas[e.proxima + 1];
    const vistos = new Set();
    const lista = [];
    for (let id = 0; id < nivel.parafusos.length; id++) {
      if (!R.livre(nivel, e, id)) continue;
      const s = nivel.parafusos[id];
      const marca = s.placa * 16 + s.cor;
      if (vistos.has(marca)) continue;
      const slot = R.slotPara(e, s.cor);
      let nota;
      if (slot >= 0) nota = 500 + (e.slots[slot].parafusos.length === R.CAPACIDADE_CAIXA - 1 ? 1000 : 0);
      else if (cabe) nota = (s.cor === prox1 || s.cor === prox2 ? 100 : 0) - 30 * e.bandeja.length;
      else continue;
      vistos.add(marca);
      let resta = 0;
      for (const t of nivel.parafusosDaPlaca[s.placa]) if (!e.removido[t]) resta++;
      if (resta === 1) {
        nota += 200; // a placa cai
        for (const t of cobertos[s.placa]) {
          if (e.removido[t]) continue;
          if (nivel.cobertoPor[t].every((q) => q === s.placa || e.caida[q])) nota += 50; // e solta este
        }
      }
      lista.push({ id, nota });
    }
    lista.sort((a, b) => b.nota - a.nota || a.id - b.id);
    return lista;
  }

  // `mortos` guarda chaves de estados já provados sem saída; a dica reaproveita entre buscas.
  function buscarDFS(nivel, estado, limites, mortos) {
    const cobertos = cobre(nivel);
    const inicio = agora();
    const caminho = [];
    let nos = 0;
    let estourou = false;
    let sugestao = null;

    function explorar(e, raiz) {
      if (e.restantes === 0) return true;
      nos++;
      if (nos > limites.limiteNos || (inicio !== null && (nos & 127) === 0 && agora() - inicio > limites.limiteMs)) {
        estourou = true;
        return false;
      }
      const k = chave(nivel, e);
      if (mortos.has(k)) return false;
      const lista = lances(nivel, e, cobertos);
      for (const { id } of lista) {
        if (raiz) sugestao = id; // o melhor lance ainda não provado perdido
        const f = R.copiar(e);
        R.aplicar(nivel, f, id);
        caminho.push(id);
        if (explorar(f, false)) return true;
        caminho.pop();
        if (estourou) return false;
      }
      mortos.add(k);
      return false;
    }

    if (explorar(R.copiar(estado), true)) return { status: 'solucao', jogadas: caminho };
    if (!estourou) return { status: 'semSaida' };
    if (sugestao === null) {
      const lista = lances(nivel, estado, cobertos);
      if (lista.length) sugestao = lista[0].id;
    }
    return { status: 'limite', sugestao };
  }


  // Protótipo da revisão: antes da busca funda, cada lance da raiz ganha uma fatia pequena do orçamento.
  function buscar(nivel, estado, limites, mortos) {
    if (estado.restantes === 0) return { status: 'solucao', jogadas: [] };
    const raiz = lances(nivel, estado, cobre(nivel));
    if (raiz.length < 2) return buscarDFS(nivel, estado, limites, mortos);
    const inicio = agora();
    const n = 4 * raiz.length;
    const fatia = { limiteNos: Math.max(200, Math.floor(limites.limiteNos / n)), limiteMs: limites.limiteMs / n };
    const abertos = [];
    let gastos = 0;
    for (const { id } of raiz) {
      const f = R.copiar(estado);
      R.aplicar(nivel, f, id);
      const r = buscarDFS(nivel, f, fatia, mortos);
      gastos += fatia.limiteNos;
      if (r.status === 'solucao') return { status: 'solucao', jogadas: [id].concat(r.jogadas) };
      if (r.status === 'limite') abertos.push(id);
    }
    if (!abertos.length) return { status: 'semSaida' };
    const resto = {
      limiteNos: Math.max(1000, limites.limiteNos - gastos),
      limiteMs: inicio === null ? limites.limiteMs : Math.max(10, limites.limiteMs - (agora() - inicio)),
    };
    const r = buscarDFS(nivel, estado, resto, mortos);
    if (r.status === 'limite' && abertos.indexOf(r.sugestao) < 0) r.sugestao = abertos[0];
    return r;
  }

  function limites(opcoes) {
    const o = opcoes || {};
    return {
      limiteNos: Number.isFinite(o.limiteNos) ? o.limiteNos : PADRAO.limiteNos,
      limiteMs: Number.isFinite(o.limiteMs) ? o.limiteMs : PADRAO.limiteMs,
    };
  }

  function resolver(nivel, estado, opcoes) {
    return buscar(nivel, estado, limites(opcoes), new Set());
  }

  // historico: estados anteriores, do mais antigo ao mais recente (o último é o de antes da última jogada).
  function dica(nivel, estado, historico, opcoes) {
    if (R.venceu(nivel, estado)) return { tipo: 'nada' };
    const mortos = new Set();
    const r = buscar(nivel, estado, limites(opcoes), mortos);
    if (r.status === 'solucao') return { tipo: 'parafuso', parafuso: r.jogadas[0] };
    if (r.status === 'limite' && r.sugestao !== null) return { tipo: 'parafuso', parafuso: r.sugestao };

    // Beco sem saída: procura o estado mais recente do histórico de onde ainda dá para vencer.
    const inicio = agora();
    const lista = historico || [];
    let recente = null;
    for (let k = 1; k <= lista.length; k++) {
      if (inicio !== null && agora() - inicio > VOLTA_TOTAL_MS) break;
      let anterior = lista[lista.length - k];
      if (R.venceu(nivel, anterior)) continue;
      // O espaço extra continua valendo depois de desfazer (a interface o reaplica).
      if (anterior.extra < estado.extra) anterior = Object.assign(R.copiar(anterior), { extra: estado.extra });
      const rk = buscar(nivel, anterior, VOLTA, mortos);
      if (rk.status === 'solucao') return { tipo: 'voltar', passos: k, parafuso: rk.jogadas[0] };
      if (rk.status === 'limite' && rk.sugestao !== null && !recente) recente = { tipo: 'voltar', passos: k, parafuso: rk.sugestao };
    }
    return recente || { tipo: 'recomecar' };
  }

  P.Resolvedor = { resolver, dica };
})(globalThis.Parafusinhos = globalThis.Parafusinhos || {});
