// Geometria das placas: distância de um ponto ao "esqueleto" (polilinha ou polígono) e a regra
// que decide se uma placa cobre um parafuso. Só usa + - * / e Math.sqrt (resultado igual em todo motor).
(function (P) {
  'use strict';

  // Medidas em unidades da grade (distância entre furos = 1). Regras.js reexporta estes valores.
  const R_PARAFUSO = 0.27; // raio da cabeça do parafuso
  const RAIO_BARRA = 0.39; // meia espessura das barras e margem arredondada das partes fechadas
  const RAIO_BOTAO = 0.42; // plaquinha redonda com um parafuso no centro
  const RAIO_DISCO = 1.68; // disco grande: cobre o bloco 3×3 em volta do centro
  const FOLGA_COBRE = 0.02;
  const MARGEM_LIVRE = 0.08;

  function distPontoSegmento(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + t * dx - px;
    const qy = ay + t * dy - py;
    return Math.sqrt(qx * qx + qy * qy);
  }

  // Par-ímpar (raio horizontal). Pontos sobre a borda tanto faz: a borda já está a distância 0.
  function pontoNoPoligono(px, py, pontos) {
    let dentro = false;
    for (let i = 0, j = pontos.length - 1; i < pontos.length; j = i++) {
      const xi = pontos[i][0];
      const yi = pontos[i][1];
      const xj = pontos[j][0];
      const yj = pontos[j][1];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
  }

  function distParte(px, py, parte) {
    const p = parte.pontos;
    if (p.length === 1) {
      const dx = px - p[0][0];
      const dy = py - p[0][1];
      return Math.sqrt(dx * dx + dy * dy);
    }
    if (parte.fechado && pontoNoPoligono(px, py, p)) return 0;
    let m = Infinity;
    for (let i = 0; i + 1 < p.length; i++) {
      const d = distPontoSegmento(px, py, p[i][0], p[i][1], p[i + 1][0], p[i + 1][1]);
      if (d < m) m = d;
    }
    if (parte.fechado) {
      const u = p.length - 1;
      const d = distPontoSegmento(px, py, p[u][0], p[u][1], p[0][0], p[0][1]);
      if (d < m) m = d;
    }
    return m;
  }

  function distEsqueleto(px, py, placa) {
    let m = Infinity;
    for (const parte of placa.partes) {
      const d = distParte(px, py, parte);
      if (d < m) m = d;
    }
    return m;
  }

  // Situação de um parafuso em (px, py) diante de uma placa MAIS ALTA que a dele.
  // Entre os dois limiares fica a zona "ambígua", proibida nas fases (o desenho enganaria o jogador).
  function relacao(placa, px, py) {
    const d = distEsqueleto(px, py, placa);
    if (d <= placa.raio - R_PARAFUSO + FOLGA_COBRE) return 'coberto';
    if (d >= placa.raio + R_PARAFUSO + MARGEM_LIVRE) return 'livre';
    return 'ambiguo';
  }

  // Segmentos de uma parte (um ponto sozinho vira segmento degenerado).
  function segmentos(parte) {
    const p = parte.pontos;
    if (p.length === 1) return [[p[0], p[0]]];
    const lista = [];
    for (let i = 0; i + 1 < p.length; i++) lista.push([p[i], p[i + 1]]);
    if (parte.fechado && p.length > 2) lista.push([p[p.length - 1], p[0]]);
    return lista;
  }

  function orientacao(a, b, c) {
    const v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    return v > 0 ? 1 : v < 0 ? -1 : 0;
  }

  function distSegmentos(a, b, c, d) {
    // Cruzamento próprio; encostar ou sobrepor já dá 0 nas distâncias ponto-segmento abaixo.
    if (orientacao(a, b, c) * orientacao(a, b, d) < 0 && orientacao(c, d, a) * orientacao(c, d, b) < 0) return 0;
    return Math.min(
      distPontoSegmento(a[0], a[1], c[0], c[1], d[0], d[1]),
      distPontoSegmento(b[0], b[1], c[0], c[1], d[0], d[1]),
      distPontoSegmento(c[0], c[1], a[0], a[1], b[0], b[1]),
      distPontoSegmento(d[0], d[1], a[0], a[1], b[0], b[1])
    );
  }

  // Menor distância entre os esqueletos de duas placas (0 se se tocam ou um está dentro do outro).
  function distEsqueletos(a, b) {
    let m = Infinity;
    for (const pa of a.partes) {
      for (const pb of b.partes) {
        if (pb.fechado && pontoNoPoligono(pa.pontos[0][0], pa.pontos[0][1], pb.pontos)) return 0;
        if (pa.fechado && pontoNoPoligono(pb.pontos[0][0], pb.pontos[0][1], pa.pontos)) return 0;
        for (const [s0, s1] of segmentos(pa)) {
          for (const [t0, t1] of segmentos(pb)) {
            const d = distSegmentos(s0, s1, t0, t1);
            if (d < m) m = d;
          }
        }
      }
    }
    return m;
  }

  function limitesPlaca(placa) {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const parte of placa.partes) {
      for (const [x, y] of parte.pontos) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
    return { x0: x0 - placa.raio, y0: y0 - placa.raio, x1: x1 + placa.raio, y1: y1 + placa.raio };
  }

  function limitesNivel(nivel) {
    if (!nivel.placas.length) return { x0: 0, y0: 0, x1: nivel.largura - 1, y1: nivel.altura - 1 };
    const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (const placa of nivel.placas) {
      const l = limitesPlaca(placa);
      r.x0 = Math.min(r.x0, l.x0);
      r.y0 = Math.min(r.y0, l.y0);
      r.x1 = Math.max(r.x1, l.x1);
      r.y1 = Math.max(r.y1, l.y1);
    }
    return r;
  }

  P.Geometria = {
    R_PARAFUSO,
    RAIO_BARRA,
    RAIO_BOTAO,
    RAIO_DISCO,
    FOLGA_COBRE,
    MARGEM_LIVRE,
    distPontoSegmento,
    pontoNoPoligono,
    distParte,
    distEsqueleto,
    distEsqueletos,
    relacao,
    limitesPlaca,
    limitesNivel,
  };
})(globalThis.Parafusinhos = globalThis.Parafusinhos || {});
