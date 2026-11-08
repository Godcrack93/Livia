// Regras do jogo (spec §2): bloqueio, destino do parafuso, caixas que completam e entram,
// bandeja de espera. O estado é um objeto simples (serializável em JSON) que só jogar/aplicar alteram.
(function (P) {
  'use strict';

  const G = P.Geometria;
  const CAPACIDADE_CAIXA = 3;
  const BANDEJA_BASE = 5;

  // Calcula os dados derivados (quem cobre cada parafuso, parafusos de cada placa, assinatura).
  // Pode ser chamado de novo sem efeito.
  function preparar(nivel) {
    const placas = nivel.placas;
    nivel.cobertoPor = nivel.parafusos.map((s) => {
      const camada = placas[s.placa].camada;
      const lista = [];
      for (const q of placas) if (q.camada > camada && G.relacao(q, s.x, s.y) === 'coberto') lista.push(q.id);
      return lista;
    });
    nivel.parafusosDaPlaca = placas.map(() => []);
    for (const s of nivel.parafusos) nivel.parafusosDaPlaca[s.placa].push(s.id);
    nivel.assinatura = assinar(nivel);
    return nivel;
  }

  // Identifica a fase jogável (geometria, cores, fila, vagas): partidas salvas só valem para a mesma assinatura.
  function assinar(nivel) {
    const partes = [nivel.largura, nivel.altura, nivel.ativas, nivel.bandeja];
    for (const q of nivel.placas) {
      partes.push('p' + q.camada + ',' + q.raio);
      for (const parte of q.partes) partes.push((parte.fechado ? 'f' : 'a') + parte.pontos.join(';'));
    }
    for (const s of nivel.parafusos) partes.push('s' + s.placa + ',' + s.x + ',' + s.y + ',' + s.cor);
    partes.push('c' + nivel.caixas.join(','));
    return P.Aleatorio.hash(partes.join('|'));
  }

  function estadoInicial(nivel) {
    const slots = [];
    for (let i = 0; i < nivel.ativas; i++) {
      slots.push(i < nivel.caixas.length ? { fila: i, cor: nivel.caixas[i], parafusos: [] } : null);
    }
    return {
      removido: nivel.parafusos.map(() => 0),
      caida: nivel.placas.map(() => 0),
      slots,
      proxima: Math.min(nivel.ativas, nivel.caixas.length),
      bandeja: [],
      extra: 0,
      restantes: nivel.parafusos.length,
      completas: 0,
    };
  }

  function copiar(e) {
    return {
      removido: e.removido.slice(),
      caida: e.caida.slice(),
      slots: e.slots.map((c) => (c ? { fila: c.fila, cor: c.cor, parafusos: c.parafusos.slice() } : null)),
      proxima: e.proxima,
      bandeja: e.bandeja.slice(),
      extra: e.extra,
      restantes: e.restantes,
      completas: e.completas,
    };
  }

  function capacidadeBandeja(nivel, estado) {
    return nivel.bandeja + estado.extra;
  }

  function livre(nivel, estado, id) {
    if (estado.removido[id]) return false;
    const cob = nivel.cobertoPor[id];
    for (let i = 0; i < cob.length; i++) if (!estado.caida[cob[i]]) return false;
    return true;
  }

  function bloqueadores(nivel, estado, id) {
    return nivel.cobertoPor[id].filter((q) => !estado.caida[q]);
  }

  // Caixa ativa da cor com espaço; havendo duas, a mais cheia (empate: o slot de menor índice).
  function slotPara(estado, cor) {
    let melhor = -1;
    for (let i = 0; i < estado.slots.length; i++) {
      const c = estado.slots[i];
      if (!c || c.cor !== cor || c.parafusos.length >= CAPACIDADE_CAIXA) continue;
      if (melhor < 0 || c.parafusos.length > estado.slots[melhor].parafusos.length) melhor = i;
    }
    return melhor;
  }

  // Para onde o parafuso iria agora; null se a jogada é ilegal (removido, bloqueado ou bandeja cheia).
  function destino(nivel, estado, id) {
    if (!livre(nivel, estado, id)) return null;
    const slot = slotPara(estado, nivel.parafusos[id].cor);
    if (slot >= 0) return { tipo: 'caixa', slot, furo: estado.slots[slot].parafusos.length };
    if (estado.bandeja.length < capacidadeBandeja(nivel, estado)) return { tipo: 'bandeja', vaga: estado.bandeja.length };
    return null;
  }

  // Executa a jogada de um parafuso livre. `eventos` é um array (registra o que aconteceu) ou null.
  // Devolve false sem mexer no estado se não há para onde ir.
  function mover(nivel, estado, id, eventos) {
    const s = nivel.parafusos[id];
    const slot = slotPara(estado, s.cor);
    if (slot >= 0) {
      const caixa = estado.slots[slot];
      if (eventos) {
        eventos.push({ tipo: 'tirar', parafuso: id, para: { tipo: 'caixa', slot, fila: caixa.fila, furo: caixa.parafusos.length } });
      }
      caixa.parafusos.push(id);
    } else if (estado.bandeja.length < capacidadeBandeja(nivel, estado)) {
      if (eventos) eventos.push({ tipo: 'tirar', parafuso: id, para: { tipo: 'bandeja', vaga: estado.bandeja.length } });
      estado.bandeja.push(id);
    } else {
      return false;
    }
    estado.removido[id] = 1;
    estado.restantes--;
    if (nivel.parafusosDaPlaca[s.placa].every((t) => estado.removido[t])) {
      estado.caida[s.placa] = 1;
      if (eventos) eventos.push({ tipo: 'placaCai', placa: s.placa });
    }
    resolverCaixas(nivel, estado, eventos);
    return true;
  }

  // Caixas cheias completam e dão lugar à próxima da fila, que puxa da bandeja os parafusos da sua cor.
  // Repete até estabilizar: uma caixa que enche só com o que puxou completa na volta seguinte.
  function resolverCaixas(nivel, estado, eventos) {
    let mudou = true;
    while (mudou) {
      mudou = false;
      for (let i = 0; i < estado.slots.length; i++) {
        const caixa = estado.slots[i];
        if (!caixa || caixa.parafusos.length < CAPACIDADE_CAIXA) continue;
        mudou = true;
        estado.completas++;
        if (eventos) eventos.push({ tipo: 'caixaCompleta', slot: i, fila: caixa.fila });
        if (estado.proxima >= nivel.caixas.length) {
          estado.slots[i] = null;
          if (eventos) eventos.push({ tipo: 'slotVazio', slot: i });
          continue;
        }
        const nova = { fila: estado.proxima, cor: nivel.caixas[estado.proxima], parafusos: [] };
        estado.proxima++;
        estado.slots[i] = nova;
        if (eventos) eventos.push({ tipo: 'caixaEntra', slot: i, fila: nova.fila, cor: nova.cor });
        puxarDaBandeja(nivel, estado, i, eventos);
      }
    }
  }

  function puxarDaBandeja(nivel, estado, slot, eventos) {
    const caixa = estado.slots[slot];
    const bandeja = estado.bandeja;
    let fica = 0;
    let deslocou = false;
    for (let v = 0; v < bandeja.length; v++) {
      const id = bandeja[v];
      if (caixa.parafusos.length < CAPACIDADE_CAIXA && nivel.parafusos[id].cor === caixa.cor) {
        if (eventos) {
          eventos.push({ tipo: 'puloBandeja', parafuso: id, deVaga: v, slot, fila: caixa.fila, furo: caixa.parafusos.length });
        }
        caixa.parafusos.push(id);
      } else {
        if (fica !== v) deslocou = true;
        bandeja[fica++] = id; // compacta no lugar, mantendo a ordem relativa
      }
    }
    bandeja.length = fica;
    if (deslocou && eventos) eventos.push({ tipo: 'bandejaCompacta', ordem: bandeja.slice() });
  }

  function jogar(nivel, estado, id) {
    if (estado.removido[id]) return { ok: false, motivo: 'removido' };
    const placas = bloqueadores(nivel, estado, id);
    if (placas.length) return { ok: false, motivo: 'bloqueado', placas };
    const eventos = [];
    if (!mover(nivel, estado, id, eventos)) return { ok: false, motivo: 'bandejaCheia' };
    const vitoria = estado.restantes === 0;
    if (vitoria) eventos.push({ tipo: 'vitoria' });
    return { ok: true, eventos, vitoria, semJogadas: !vitoria && !temJogada(nivel, estado) };
  }

  // O mesmo que jogar, sem montar eventos (resolvedor, simulações, replay silencioso). true se jogou.
  function aplicar(nivel, estado, id) {
    return livre(nivel, estado, id) && mover(nivel, estado, id, null);
  }

  function temJogada(nivel, estado) {
    if (estado.restantes === 0) return false;
    const cabeNaBandeja = estado.bandeja.length < capacidadeBandeja(nivel, estado);
    for (let id = 0; id < nivel.parafusos.length; id++) {
      if (livre(nivel, estado, id) && (cabeNaBandeja || slotPara(estado, nivel.parafusos[id].cor) >= 0)) return true;
    }
    return false;
  }

  function jogadasPossiveis(nivel, estado) {
    const cabeNaBandeja = estado.bandeja.length < capacidadeBandeja(nivel, estado);
    const lista = [];
    for (let id = 0; id < nivel.parafusos.length; id++) {
      if (livre(nivel, estado, id) && (cabeNaBandeja || slotPara(estado, nivel.parafusos[id].cor) >= 0)) lista.push(id);
    }
    return lista;
  }

  function venceu(nivel, estado) {
    return estado.restantes === 0;
  }

  P.Regras = {
    CAPACIDADE_CAIXA,
    BANDEJA_BASE,
    R_PARAFUSO: G.R_PARAFUSO,
    RAIO_BARRA: G.RAIO_BARRA,
    RAIO_BOTAO: G.RAIO_BOTAO,
    RAIO_DISCO: G.RAIO_DISCO,
    FOLGA_COBRE: G.FOLGA_COBRE,
    MARGEM_LIVRE: G.MARGEM_LIVRE,
    preparar,
    estadoInicial,
    copiar,
    capacidadeBandeja,
    livre,
    bloqueadores,
    slotPara,
    destino,
    jogar,
    aplicar,
    jogadasPossiveis,
    venceu,
  };
})(globalThis.Parafusinhos = globalThis.Parafusinhos || {});
