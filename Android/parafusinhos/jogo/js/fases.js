// Fases (spec §4): tutoriais fixos 1–3 e, a partir da 4, fases sorteadas a partir do número.
// Cada fase nasce de uma ordem de retirada válida; as cores são distribuídas seguindo essa ordem,
// então toda fase tem solução por construção (e validar confere jogando a solução).
(function (P) {
  'use strict';

  const A = P.Aleatorio;
  const G = P.Geometria;
  const R = P.Regras;

  const VERSAO = 1;
  const MAX_CORES = 9;
  const NUM_TINTAS = 8;

  const CANDIDATOS = 8; // fases completas por número; fica a de dificuldade mais próxima do alvo
  const CANDIDATOS_MAX = 40;
  const RODADAS_GULOSO = 32;
  const SORTEIOS_POR_PLACA = 24;
  const FALHAS_LAYOUT = 8; // rodadas sem nenhum sorteio válido antes de desistir do layout
  const P_CENTRADA = 0.35; // chance de sortear uma placa simétrica sobre o eixo (o resto vira par espelhado)
  const P_ANCORA = 0.75; // chance de a placa de cobertura nascer em cima de um parafuso existente
  const P_LOCAL = 0.85; // chance de a ordem de retirada seguir pelos parafusos recém-soltos
  const F_CHAVE = 3; // reserva só chaves, com chance min(1, F_CHAVE × pReserva)
  const VISIVEL_MIN = 0.3; // fração mínima do desenho de cada placa que precisa continuar à vista
  const ORCAMENTO_GRADE = 0.62; // no máximo esta fração dos furos com parafuso...
  const ORCAMENTO_PLACA = 2.3; // ...e cerca de tantos parafusos por placa
  const RIGOR_ORCAMENTO = 4; // quanto o sorteio do padrão de parafusos se prende ao orçamento
  const MEMORIA = 6;

  // Pesos da nota de cada placa sorteada no layout (§4.5).
  const PESO = {
    cobertura: 2.5, // distância entre parafusos recém-cobertos e o alvo
    excesso: 12, // por parafuso coberto além de 3 por placa
    profundo: 0.8, // por parafuso que já estava coberto (pilhas fundas escondem demais)
    baseCobre: 4, // placas de base não devem cobrir parafusos
    baseSobrepoe: 3, // nem ficar em cima umas das outras
    espaco: 1.2, // base: distância até os centros das placas existentes (ocupa áreas vazias)
    equilibrio: 3, // centro de massa vertical longe do meio do tabuleiro
    oculta: 4, // quanto do desenho das placas de baixo a nova esconde
    repeticao: 0.3, // por placa da mesma forma já usada...
    repeticaoTamanho: 0.8, // ...e mais ainda se for do mesmo tamanho e orientação
    assimetrica: 3,
    acaso: 1.5,
  };

  // Preferência de formas em cada fase do layout (só entram as liberadas para o número da fase).
  const PESO_FORMA = {
    base: { retangulo: 3, disco: 2, barraH: 1.2, barraV: 1.2, barraD: 0.5, losango: 1.5, U: 1.5 },
    cobertura: {
      barraH: 2, barraV: 2, barraD: 1.2, retangulo: 1.5, botao: 1, L: 2, T: 1.5, cruz: 1,
      triangulo: 1.5, U: 0.5, losango: 0.5, disco: 0.4,
    },
  };

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  // ------------------------------------------------------------------ parâmetros (§4.2)

  function ehDificil(n) {
    return n >= 10 && n % 10 === 0;
  }

  function parametros(numero) {
    const n = numero;
    const dificil = ehDificil(n);
    const alivio = n > 10 && n % 10 === 1;
    let numPlacas = clamp(Math.round(3.5 + 0.3 * n), 4, 22);
    if (dificil) numPlacas += 2;
    if (alivio) numPlacas -= 2;
    numPlacas = clamp(numPlacas, 4, 24);
    const grade = numPlacas <= 5 ? [5, 6] : numPlacas <= 9 ? [7, 8] : numPlacas <= 14 ? [7, 9] : [7, 10];
    let pressao = n <= 6 ? 0 : n <= 11 ? 1 : n <= 24 ? 2 : 3;
    if (dificil) pressao = Math.min(4, pressao + 1);
    if (alivio) pressao = Math.max(0, pressao - 1);
    let alvo = n <= 6 ? 0.95 : n <= 40 ? 0.85 - (0.4 * (n - 7)) / 33 : n <= 60 ? 0.45 - (0.1 * (n - 40)) / 20 : 0.35;
    if (dificil) alvo *= 0.5;
    if (alivio) alvo = Math.min(0.95, alvo + 0.2);
    let fracaoCoberta = Math.min(0.65, 0.2 + Math.min(0.4, 0.01 * n));
    if (dificil) fracaoCoberta = Math.min(0.65, fracaoCoberta + 0.1);
    const formas = ['barraH', 'barraV', 'retangulo', 'botao'];
    if (n >= 8) formas.push('barraD', 'disco', 'L');
    if (n >= 15) formas.push('triangulo', 'losango', 'U', 'T', 'cruz');
    return {
      numero: n,
      dificil,
      alivio,
      numCores: clamp(3 + Math.floor((n - 4) / 6), 3, MAX_CORES),
      numPlacas,
      largura: grade[0],
      altura: grade[1],
      pressao,
      pReserva: Math.min(0.5, 0.15 + 0.008 * n) + (dificil ? 0.15 : 0),
      alvoGuloso: alvo,
      fracaoCoberta,
      formas,
      ativas: 2,
      bandeja: R.BANDEJA_BASE,
    };
  }

  // ------------------------------------------------------------------ tutoriais (§4.1)

  // placas: [forma, tinta, fechado, pontos]; parafusos: [x, y, placa, cor].
  const TUTORIAIS = {
    1: {
      largura: 5, altura: 5, numCores: 2, caixas: [0, 1],
      placas: [['retangulo', 3, true, [[1, 1], [3, 1], [3, 3], [1, 3]]], ['barraH', 1, false, [[0, 2], [4, 2]]]],
      parafusos: [[1, 1, 0, 0], [3, 1, 0, 1], [1, 3, 0, 1], [3, 3, 0, 0], [0, 2, 1, 0], [4, 2, 1, 1]],
      solucao: [4, 5, 0, 1, 2, 3],
    },
    2: {
      largura: 5, altura: 6, numCores: 2, caixas: [0, 1],
      placas: [
        ['barraV', 5, false, [[2, 0], [2, 5]]],
        ['barraH', 1, false, [[0, 1], [4, 1]]],
        ['retangulo', 3, true, [[1, 4], [3, 4], [3, 5], [1, 5]]],
      ],
      parafusos: [[2, 0, 0, 0], [2, 5, 0, 1], [0, 1, 1, 1], [4, 1, 1, 0], [1, 4, 2, 0], [3, 4, 2, 1]],
      solucao: [4, 5, 1, 0, 2, 3],
    },
    3: {
      largura: 5, altura: 5, numCores: 3, caixas: [0, 1, 2],
      placas: [
        ['retangulo', 6, true, [[1, 1], [3, 1], [3, 3], [1, 3]]],
        ['barraV', 2, false, [[2, 0], [2, 4]]],
        ['barraH', 0, false, [[0, 2], [4, 2]]],
      ],
      parafusos: [
        [1, 1, 0, 2], [3, 1, 0, 0], [1, 3, 0, 1], [3, 3, 0, 2], [2, 0, 1, 0],
        [2, 4, 1, 1], [0, 2, 2, 0], [4, 2, 2, 1], [2, 2, 2, 2],
      ],
      solucao: [6, 7, 8, 4, 5, 1, 2, 0, 3],
    },
  };

  function tutorial(n) {
    const t = TUTORIAIS[n];
    const nivel = {
      numero: n,
      versao: VERSAO,
      dificil: false,
      tutorial: n,
      largura: t.largura,
      altura: t.altura,
      placas: t.placas.map(([forma, tinta, fechado, pontos], i) => ({
        id: i, camada: i, forma, partes: [{ pontos: pontos.map((p) => p.slice()), fechado }], raio: G.RAIO_BARRA, tinta,
      })),
      parafusos: t.parafusos.map(([x, y, placa, cor], i) => ({ id: i, placa, x, y, cor })),
      caixas: t.caixas.slice(),
      ativas: 2,
      bandeja: R.BANDEJA_BASE,
      numCores: t.numCores,
      solucao: t.solucao.slice(),
      pressao: 0,
      stats: null,
    };
    R.preparar(nivel);
    nivel.pressao = pressaoDaSolucao(nivel);
    nivel.stats = {
      taxaGulosa: simularGuloso(nivel, A.criar(A.hash('parafusinhos-tutorial-' + n)), RODADAS_GULOSO),
      cobertosInicio: contarCobertos(nivel),
    };
    return nivel;
  }

  // ------------------------------------------------------------------ catálogo de formas (§4.4)

  const giro = ([x, y], vezes) => {
    for (let i = 0; i < vezes; i++) [x, y] = [-y, x];
    return [x + 0, y + 0]; // evita -0
  };

  function espelharEm(placa, dobroDoEixo) {
    return {
      forma: placa.forma,
      raio: placa.raio,
      partes: placa.partes.map((pa) => ({ pontos: pa.pontos.map(([x, y]) => [dobroDoEixo - x, y]), fechado: pa.fechado })),
      pts: placa.pts.map(([x, y]) => [dobroDoEixo - x, y]),
    };
  }

  const chavePontos = (pts) => pts.map((p) => p[0] + ',' + p[1]).sort().join(';');

  function sobreEsqueleto(a, b, tolerancia) {
    for (const parte of a.partes) for (const [x, y] of parte.pontos) if (G.distEsqueleto(x, y, b) > tolerancia) return false;
    return true;
  }

  // Mesma forma no mesmo lugar e mesmos parafusos (placa idêntica ao seu espelho).
  function mesmaPlaca(a, b) {
    return chavePontos(a.pts) === chavePontos(b.pts) && sobreEsqueleto(a, b, 1e-9) && sobreEsqueleto(b, a, 1e-9);
  }

  function montarCatalogo() {
    const RB = G.RAIO_BARRA;
    const lista = [];
    const aberta = (pontos) => ({ pontos, fechado: false });
    const fechada = (pontos) => ({ pontos, fechado: true });

    function add(forma, partes, raio, padroes, base, cobre, rotacao = 0) {
      partes = partes.map((pa) => ({ pontos: pa.pontos.map((p) => giro(p, rotacao)), fechado: pa.fechado }));
      padroes = padroes.map((pd) => pd.map((p) => giro(p, rotacao)));
      const todos = [].concat(...partes.map((pa) => pa.pontos));
      const xs = todos.map((p) => p[0]);
      const ys = todos.map((p) => p[1]);
      const v = {
        forma, partes, raio, padroes, base, cobre,
        x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys),
        margem: forma === 'disco' ? 1 : 0, // o disco é grande: centro longe da borda
        cx: 0,
        simetricos: [], // padrões que tornam a placa simétrica sobre a vertical x = cx
        cobertos: [], // furos da grade que a placa cobre (para ancorá-la sobre um parafuso)
      };
      const local = { forma, raio, partes, pts: [] };
      v.amostras = amostrar(local); // desenho da placa em pontos, para medir o que fica à vista
      v.centro = centroide(v.amostras);
      const limite = raio - G.R_PARAFUSO + G.FOLGA_COBRE;
      for (let y = Math.floor(v.y0 - raio); y <= Math.ceil(v.y1 + raio); y++) {
        for (let x = Math.floor(v.x0 - raio); x <= Math.ceil(v.x1 + raio); x++) {
          if (G.distEsqueleto(x, y, local) <= limite) v.cobertos.push([x, y]);
        }
      }
      if ((v.x0 + v.x1) % 2 === 0) {
        v.cx = (v.x0 + v.x1) / 2;
        const espelho = espelharEm(local, 2 * v.cx);
        if (sobreEsqueleto(local, espelho, 1e-9) && sobreEsqueleto(espelho, local, 1e-9)) {
          for (const pd of padroes) {
            if (chavePontos(pd) === chavePontos(pd.map(([x, y]) => [2 * v.cx - x, y]))) v.simetricos.push(pd);
          }
        }
      }
      lista.push(v);
    }

    for (let L = 1; L <= 4; L++) {
      const pad = [[[0, 0], [L, 0]]];
      if (L % 2 === 0) pad.push([[0, 0], [L / 2, 0], [L, 0]]);
      add('barraH', [aberta([[0, 0], [L, 0]])], RB, pad, L >= 3, true);
      add('barraV', [aberta([[0, 0], [L, 0]])], RB, pad, L >= 3, true, 1);
    }
    for (let L = 1; L <= 3; L++) {
      for (const s of [1, -1]) {
        const pad = [[[0, 0], [L, s * L]]];
        if (L === 2) pad.push([[0, 0], [1, s], [2, 2 * s]]);
        add('barraD', [aberta([[0, 0], [L, s * L]])], RB, pad, L === 3, true);
      }
    }
    for (let w = 1; w <= 3; w++) {
      for (let h = 1; h <= 3; h++) {
        const pad = [
          [[0, 0], [w, 0], [w, h], [0, h]],
          [[0, 0], [w, h]],
          [[w, 0], [0, h]],
          [[0, 0], [w, 0]],
          [[0, h], [w, h]],
          [[0, 0], [0, h]],
          [[w, 0], [w, h]],
        ];
        if (w % 2 === 0 && h % 2 === 0) pad.push([[w / 2, h / 2]]);
        add('retangulo', [fechada([[0, 0], [w, 0], [w, h], [0, h]])], RB, pad, w * h >= 2, w * h <= 4);
      }
    }
    add('botao', [aberta([[0, 0]])], G.RAIO_BOTAO, [[[0, 0]]], false, true);
    add('disco', [aberta([[0, 0]])], G.RAIO_DISCO,
      [[[0, 0]], [[0, -1], [0, 1]], [[-1, 0], [1, 0]], [[0, -1], [1, 0], [0, 1], [-1, 0]]], true, true);
    for (let r = 0; r < 4; r++) {
      for (let a = 1; a <= 3; a++) {
        for (let b = 1; b <= 3; b++) {
          add('L', [aberta([[0, -a], [0, 0], [b, 0]])], RB, [[[0, -a], [b, 0]], [[0, -a], [0, 0], [b, 0]]], false, true, r);
        }
      }
      for (let a = 1; a <= 2; a++) {
        for (let b = 2; b <= 3; b++) {
          add('U', [aberta([[0, -a], [0, 0], [b, 0], [b, -a]])], RB,
            [[[0, -a], [b, -a]], [[0, -a], [0, 0], [b, 0], [b, -a]]], true, true, r);
        }
        for (let b = 1; b <= 3; b++) {
          add('T', [aberta([[-a, 0], [a, 0]]), aberta([[0, 0], [0, b]])], RB, [[[-a, 0], [a, 0], [0, b]]], false, true, r);
        }
      }
      add('triangulo', [fechada([[0, 0], [2, 0], [0, 2]])], RB, [[[0, 0], [2, 0], [0, 2]], [[2, 0], [0, 2]]], false, true, r);
    }
    add('cruz', [aberta([[-1, 0], [1, 0]]), aberta([[0, -1], [0, 1]])], RB,
      [[[-1, 0], [1, 0], [0, -1], [0, 1]], [[-1, 0], [1, 0]], [[0, -1], [0, 1]]], false, true);
    add('losango', [fechada([[1, 0], [2, 1], [1, 2], [0, 1]])], RB,
      [[[1, 0], [2, 1], [1, 2], [0, 1]], [[1, 0], [1, 2]], [[0, 1], [2, 1]]], true, true);

    // Índice: fase → (centrada ? 1 : 0) → forma → variantes.
    const indice = { base: [{}, {}], cobertura: [{}, {}] };
    for (const v of lista) {
      for (const fase of ['base', 'cobertura']) {
        if (fase === 'base' ? !v.base : !v.cobre) continue;
        for (const c of [0, 1]) {
          if (c && !v.simetricos.length) continue;
          (indice[fase][c][v.forma] = indice[fase][c][v.forma] || []).push(v);
        }
      }
    }
    return indice;
  }

  const CATALOGO = montarCatalogo();

  // ------------------------------------------------------------------ layout das placas (§4.5)

  // Placa sorteada: variante v deslocada de (ox, oy) e, no par, espelhada (x → W − 1 − x).
  function instanciar(v, padrao, ox, oy) {
    const q = {
      forma: v.forma,
      raio: v.raio,
      partes: v.partes.map((pa) => ({ pontos: pa.pontos.map(([x, y]) => [x + ox, y + oy]), fechado: pa.fechado })),
      pts: padrao.map(([x, y]) => [x + ox, y + oy]),
      v,
      ox,
      oy,
      espelhada: false,
    };
    return caixa(q, v.x0 + ox, v.y0 + oy, v.x1 + ox, v.y1 + oy);
  }

  function espelharSorteada(q, W) {
    const m = Object.assign(espelharEm(q, W - 1), { v: q.v, ox: q.ox, oy: q.oy, espelhada: !q.espelhada });
    return caixa(m, W - 1 - q.sx1, q.sy0, W - 1 - q.sx0, q.sy1);
  }

  function amostrasDe(q, W) {
    if (!q.amostras) q.amostras = q.v.amostras.map(([x, y]) => [q.espelhada ? W - 1 - (x + q.ox) : x + q.ox, y + q.oy]);
    return q.amostras;
  }

  function centroDe(q, W) {
    const x = q.v.centro[0] + q.ox;
    return [q.espelhada ? W - 1 - x : x, q.v.centro[1] + q.oy];
  }

  // Caixa do esqueleto (s*) e da área desenhada (b*).
  function caixa(q, x0, y0, x1, y1) {
    q.sx0 = x0;
    q.sy0 = y0;
    q.sx1 = x1;
    q.sy1 = y1;
    q.bx0 = x0 - q.raio;
    q.by0 = y0 - q.raio;
    q.bx1 = x1 + q.raio;
    q.by1 = y1 + q.raio;
    return q;
  }

  function medir(q) {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const parte of q.partes) {
      for (const [x, y] of parte.pontos) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    return caixa(q, x0, y0, x1, y1);
  }

  // Pontos que representam o desenho da placa (para medir quanto dela fica à vista).
  function amostrar(q) {
    const pts = [];
    for (const parte of q.partes) {
      const p = parte.pontos;
      if (p.length === 1) {
        const [x, y] = p[0];
        const r = 0.7 * q.raio;
        const d = 0.7071 * r;
        pts.push([x, y], [x + r, y], [x - r, y], [x, y + r], [x, y - r], [x + d, y + d], [x - d, y + d], [x + d, y - d], [x - d, y - d]);
        continue;
      }
      const n = parte.fechado ? p.length : p.length - 1;
      for (let i = 0; i < n; i++) {
        const [ax, ay] = p[i];
        const [bx, by] = p[(i + 1) % p.length];
        const passos = Math.max(1, Math.ceil(Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay)) / 0.5));
        for (let k = 0; k < passos; k++) pts.push([ax + ((bx - ax) * k) / passos, ay + ((by - ay) * k) / passos]);
      }
      if (!parte.fechado) pts.push(p[p.length - 1].slice());
      if (parte.fechado) {
        const xs = p.map((t) => t[0]);
        const ys = p.map((t) => t[1]);
        for (let x = Math.min(...xs) + 0.5; x < Math.max(...xs); x += 0.5) {
          for (let y = Math.min(...ys) + 0.5; y < Math.max(...ys); y += 0.5) if (G.pontoNoPoligono(x, y, p)) pts.push([x, y]);
        }
      }
    }
    return pts;
  }

  function centroide(pts) {
    let sx = 0;
    let sy = 0;
    for (const [x, y] of pts) {
      sx += x;
      sy += y;
    }
    return [sx / pts.length, sy / pts.length];
  }

  // Uma amostra some sob a placa q quando fica bem dentro dela.
  function esconde(q, x, y) {
    return x >= q.bx0 && x <= q.bx1 && y >= q.by0 && y <= q.by1 && G.distEsqueleto(x, y, q) <= q.raio - 0.1;
  }

  // Forma + tamanho + orientação: duas placas com a mesma assinatura parecem repetidas.
  const assinaturaForma = (q) => q.forma + ':' + (q.sx1 - q.sx0) + 'x' + (q.sy1 - q.sy0);

  function relacaoRapida(q, x, y) {
    const m = G.R_PARAFUSO + G.MARGEM_LIVRE;
    if (x < q.bx0 - m || x > q.bx1 + m || y < q.by0 - m || y > q.by1 + m) return 'livre';
    return G.relacao(q, x, y);
  }

  // V7: placas quase iguais (cada ponto do esqueleto e cada parafuso de uma a até 0,5 da outra).
  function quaseIguais(a, b) {
    if (Math.abs(a.sx0 - b.sx0) > 0.5 || Math.abs(a.sx1 - b.sx1) > 0.5 || Math.abs(a.sy0 - b.sy0) > 0.5 || Math.abs(a.sy1 - b.sy1) > 0.5) {
      return false;
    }
    const perto = (pts, q) => pts.every(([x, y]) => G.distEsqueleto(x, y, q) <= 0.5);
    return sobreEsqueleto(a, b, 0.5) && sobreEsqueleto(b, a, 0.5) && perto(a.pts, b) && perto(b.pts, a);
  }

  // Sorteio ponderado; `opcoes` = { lista, pesos, total }.
  function sortearPeso(opcoes, rng) {
    let r = rng.proximo() * opcoes.total;
    for (let i = 0; i < opcoes.lista.length - 1; i++) {
      r -= opcoes.pesos[i];
      if (r < 0) return opcoes.lista[i];
    }
    return opcoes.lista[opcoes.lista.length - 1];
  }

  // Formas liberadas para a fase, com seus pesos, por fase do layout e tipo (centrada ou não).
  function formasDoLayout(formas) {
    const r = {};
    for (const fase of ['base', 'cobertura']) {
      r[fase] = [0, 1].map((c) => {
        const lista = formas.filter((f) => PESO_FORMA[fase][f] && CATALOGO[fase][c][f]);
        const pesos = lista.map((f) => PESO_FORMA[fase][f]);
        return { lista, pesos, total: pesos.reduce((a, b) => a + b, 0) };
      });
    }
    return r;
  }

  // Sorteia uma placa: simétrica sobre o eixo ("centro"), par espelhado ("par") ou, raramente, solta ("livre").
  function sortear(L, fase, restam, maxAssimetricas, rng) {
    const centrada = restam === 1 || rng.chance(P_CENTRADA);
    const opcoes = L.formas[fase][centrada ? 1 : 0];
    if (!opcoes.lista.length) return null;
    const forma = sortearPeso(opcoes, rng);
    const v = rng.escolher(CATALOGO[fase][centrada ? 1 : 0][forma]);
    const oxMin = v.margem - v.x0;
    const oxMax = L.W - 1 - v.margem - v.x1;
    const oyMin = v.margem - v.y0;
    const oyMax = L.H - 1 - v.margem - v.y1;
    let ox = centrada ? (L.W - 1) / 2 - v.cx : null;
    let oy = null;
    // Na cobertura, quase sempre ancora a placa sobre um parafuso (de preferência ainda descoberto):
    // um deslocamento qualquer raramente cai em cima de um furo ocupado.
    if (fase === 'cobertura' && rng.chance(P_ANCORA)) {
      const s = rng.escolher(L.descobertos.length ? L.descobertos : L.parafusos);
      const c = rng.escolher(ox === null ? v.cobertos : v.cobertos.filter(([x]) => ox + x === s.x));
      if (c) {
        ox = s.x - c[0];
        oy = s.y - c[1];
      }
    }
    if (ox === null) ox = rng.inteiro(oxMin, oxMax);
    if (oy === null) oy = rng.inteiro(oyMin, oyMax);
    if (ox < oxMin || ox > oxMax || oy < oyMin || oy > oyMax) return null;
    // Padrão de parafusos só com furos livres (e livres também no espelho, que quase sempre vira par),
    // de preferência com a quantidade que mantém o total de parafusos dentro do orçamento.
    const livre = (x, y) => L.grade[y * L.W + x] < 0 && L.grade[y * L.W + L.W - 1 - x] < 0;
    const padroes = (centrada ? v.simetricos : v.padroes).filter((pd) => pd.every(([x, y]) => livre(x + ox, y + oy)));
    if (!padroes.length) return null;
    const porPlaca = (L.orcamento - L.parafusos.length) / restam;
    const pesos = padroes.map((pd) => 1 / (1 + RIGOR_ORCAMENTO * Math.abs(pd.length - porPlaca)));
    const padrao = sortearPeso({ lista: padroes, pesos, total: pesos.reduce((a, b) => a + b, 0) }, rng);
    const placa = instanciar(v, padrao, ox, oy);
    if (centrada) return { placa, espelho: null, tipo: 'centro' };
    // Só uma placa centrada no eixo pode ser o próprio espelho.
    const espelho = espelharSorteada(placa, L.W);
    if (placa.sx0 + placa.sx1 === L.W - 1 && mesmaPlaca(placa, espelho)) return { placa, espelho: null, tipo: 'centro' };
    if (restam >= 2) {
      // Par: as duas metades não podem se tocar (então também não dividem furos). Longe do eixo, nem precisa medir.
      const folga = placa.raio + 0.05;
      const longe = placa.sx1 <= (L.W - 1) / 2 - folga || placa.sx0 >= (L.W - 1) / 2 + folga;
      if (longe || G.distEsqueletos(placa, espelho) >= 2 * placa.raio + 0.1) return { placa, espelho, tipo: 'par' };
    }
    return L.assimetricas < maxAssimetricas ? { placa, espelho: null, tipo: 'livre' } : null;
  }

  // Nota de um sorteio sem contar o que ele esconde (isso fica para escolherMelhor), ou null se deixa
  // algum parafuso existente ambíguo (V3). Furos livres (V1) o sorteio já garantiu.
  function avaliar(L, cand, fase, rng) {
    const novas = cand.espelho ? [cand.placa, cand.espelho] : [cand.placa];

    // Só os furos perto da placa nova (as duas metades do par têm a mesma altura) podem mudar.
    const m = G.R_PARAFUSO + G.MARGEM_LIVRE;
    const q0 = cand.placa;
    const q1 = cand.espelho || q0;
    const x0 = Math.max(0, Math.ceil(Math.min(q0.bx0, q1.bx0) - m));
    const x1 = Math.min(L.W - 1, Math.floor(Math.max(q0.bx1, q1.bx1) + m));
    const y0 = Math.max(0, Math.ceil(q0.by0 - m));
    const y1 = Math.min(L.H - 1, Math.floor(q0.by1 + m));
    let cobertos = 0;
    let novos = 0;
    let profundos = 0;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = L.grade[y * L.W + x];
        if (i < 0) continue;
        let coberto = false;
        for (const q of novas) {
          const r = relacaoRapida(q, x, y);
          if (r === 'ambiguo') return null;
          if (r === 'coberto') coberto = true;
        }
        if (!coberto) continue;
        cobertos++;
        if (L.parafusos[i].cob.length) profundos++;
        else novos++;
      }
    }

    const centros = novas.map((q) => centroDe(q, L.W));
    let nota = 0;
    if (fase === 'base') {
      nota -= PESO.baseCobre * cobertos;
      let sobre = 0;
      let total = 0;
      for (const q of novas) {
        for (const [x, y] of amostrasDe(q, L.W)) {
          total++;
          if (L.placas.some((e) => x >= e.bx0 && x <= e.bx1 && y >= e.by0 && y <= e.by1 && G.distEsqueleto(x, y, e) <= e.raio)) sobre++;
        }
      }
      nota -= (PESO.baseSobrepoe * sobre) / total;
      let dist = 4;
      for (const [cx, cy] of centros) {
        for (const e of L.placas) dist = Math.min(dist, Math.sqrt((cx - e.cx) * (cx - e.cx) + (cy - e.cy) * (cy - e.cy)));
      }
      nota += PESO.espaco * dist;
    } else {
      const k = novas.length;
      const novosParafusos = novas.reduce((t, q) => t + q.pts.length, 0);
      const deficit = L.p.fracaoCoberta * (L.parafusos.length + novosParafusos) - L.cobertos;
      const alvo = clamp(Math.round(deficit), 1, 3 * k);
      nota -= PESO.cobertura * Math.abs(novos - alvo);
      if (cobertos > 3 * k) nota -= PESO.excesso * (cobertos - 3 * k);
      nota -= PESO.profundo * profundos;
    }
    // Centro de massa (peso = tamanho do desenho) perto do meio do tabuleiro, na vertical.
    let somaY = L.somaY;
    let peso = L.peso;
    novas.forEach((q, j) => {
      somaY += centros[j][1] * q.v.amostras.length;
      peso += q.v.amostras.length;
    });
    nota -= (PESO.equilibrio * Math.abs(somaY / peso - (L.H - 1) / 2)) / L.H;
    nota -= PESO.repeticao * (L.usoForma[cand.placa.forma] || 0);
    nota -= PESO.repeticaoTamanho * (L.usoForma[assinaturaForma(cand.placa)] || 0);
    if (cand.tipo === 'livre') nota -= PESO.assimetrica;
    return nota + PESO.acaso * rng.proximo();
  }

  // Quanto do desenho das placas existentes o sorteio esconderia (soma das frações), ou null se
  // alguma ficaria quase toda escondida. É a parte cara da nota, então só roda para os melhores.
  function perdaDeVista(L, cand) {
    const novas = cand.espelho ? [cand.placa, cand.espelho] : [cand.placa];
    let perda = 0;
    for (const e of L.placas) {
      let ocultas = 0;
      for (const q of novas) {
        if (q.bx0 > e.bx1 || q.bx1 < e.bx0 || q.by0 > e.by1 || q.by1 < e.by0) continue;
        for (let i = 0; i < e.amostras.length; i++) {
          if (!e.oculta[i] && esconde(q, e.amostras[i][0], e.amostras[i][1])) ocultas++;
        }
      }
      if (!ocultas) continue;
      if (e.visiveis - ocultas < Math.max(1, Math.ceil(VISIVEL_MIN * e.amostras.length))) return null;
      perda += ocultas / e.amostras.length;
    }
    return perda;
  }

  // O melhor sorteio: nota menos o que ele esconde, sem repetir placa (V7). Esconder só tira pontos,
  // então percorre por nota e para quando nenhum dos que faltam pode passar do melhor já achado.
  function escolherMelhor(L, validos) {
    validos.sort((a, b) => b.nota - a.nota || a.ordem - b.ordem);
    let melhor = null;
    for (const c of validos) {
      if (melhor && c.nota <= melhor.final) break;
      if ([c.placa, c.espelho].some((q) => q && L.placas.some((e) => quaseIguais(q, e)))) continue;
      const perda = perdaDeVista(L, c);
      if (perda === null) continue;
      c.final = c.nota - PESO.oculta * perda;
      if (!melhor || c.final > melhor.final) melhor = c;
    }
    return melhor;
  }

  function colocar(L, cand) {
    const novas = cand.espelho ? [cand.placa, cand.espelho] : [cand.placa];
    const i0 = L.placas.length;
    novas.forEach((q, j) => {
      const indice = i0 + j;
      for (const s of L.parafusos) {
        if (relacaoRapida(q, s.x, s.y) !== 'coberto') continue;
        if (!s.cob.length) L.cobertos++;
        s.cob.push(indice);
      }
      for (const e of L.placas) {
        if (q.bx0 > e.bx1 || q.bx1 < e.bx0 || q.by0 > e.by1 || q.by1 < e.by0) continue;
        for (let i = 0; i < e.amostras.length; i++) {
          if (!e.oculta[i] && esconde(q, e.amostras[i][0], e.amostras[i][1])) {
            e.oculta[i] = 1;
            e.visiveis--;
          }
        }
      }
      const amostras = amostrasDe(q, L.W);
      const [cx, cy] = centroDe(q, L.W);
      Object.assign(q, {
        tipo: cand.tipo,
        par: cand.espelho ? i0 + 1 - j : -1,
        oculta: new Uint8Array(amostras.length),
        visiveis: amostras.length,
        cx,
        cy,
      });
      L.placas.push(q);
      L.somaY += cy * amostras.length;
      L.peso += amostras.length;
      for (const [x, y] of q.pts) {
        L.grade[y * L.W + x] = L.parafusos.length;
        L.parafusos.push({ placa: indice, x, y, cob: [] });
      }
    });
    for (const chave of [cand.placa.forma, assinaturaForma(cand.placa)]) L.usoForma[chave] = (L.usoForma[chave] || 0) + novas.length;
    if (cand.tipo === 'livre') L.assimetricas++;
    L.descobertos = L.parafusos.filter((s) => !s.cob.length);
  }

  function montarLayout(p, rng) {
    const L = {
      p,
      W: p.largura,
      H: p.altura,
      placas: [],
      parafusos: [], // { placa, x, y, cob: placas que o cobrem }
      descobertos: [], // parafusos que nenhuma placa cobre (alvos para ancorar a próxima)
      grade: new Int16Array(p.largura * p.altura).fill(-1), // parafuso em cada ponto da grade
      cobertos: 0,
      assimetricas: 0,
      usoForma: {},
      formas: formasDoLayout(p.formas),
      somaY: 0,
      peso: 0,
      // Parafusos pretendidos: tabuleiro cheio demais trava a cobertura e polui o desenho.
      orcamento: Math.min(ORCAMENTO_GRADE * p.largura * p.altura, ORCAMENTO_PLACA * p.numPlacas),
    };
    const nBase = Math.max(2, Math.round(0.35 * p.numPlacas));
    const maxAssimetricas = p.numero >= 15 ? Math.floor(0.15 * p.numPlacas) : 0;
    let falhas = 0;
    while (L.placas.length < p.numPlacas && falhas < FALHAS_LAYOUT) {
      const fase = L.placas.length < nBase ? 'base' : 'cobertura';
      const restam = p.numPlacas - L.placas.length;
      const validos = [];
      for (let i = 0; i < 4 * SORTEIOS_POR_PLACA && validos.length < SORTEIOS_POR_PLACA; i++) {
        const cand = sortear(L, fase, restam, maxAssimetricas, rng);
        if (!cand) continue;
        cand.nota = avaliar(L, cand, fase, rng);
        if (cand.nota === null) continue;
        cand.ordem = validos.length;
        validos.push(cand);
      }
      const melhor = escolherMelhor(L, validos);
      if (melhor) colocar(L, melhor);
      else falhas++;
    }
    return L.placas.length >= p.numPlacas - 1 ? L : null;
  }

  // ------------------------------------------------------------------ total de parafusos múltiplo de 3

  // Parafuso novo em (x, y) na placa i: precisa estar na placa e não ficar ambíguo sob as de cima.
  function cabeParafuso(L, i, x, y) {
    if (L.grade[y * L.W + x] >= 0) return false;
    const q = L.placas[i];
    if (G.distEsqueleto(x, y, q) > q.raio - G.R_PARAFUSO + G.FOLGA_COBRE) return false;
    for (let j = i + 1; j < L.placas.length; j++) if (relacaoRapida(L.placas[j], x, y) === 'ambiguo') return false;
    return true;
  }

  function contarNaPlaca(L, i) {
    let n = 0;
    for (const s of L.parafusos) if (s.placa === i && !s.fora) n++;
    return n;
  }

  // Ajusta o total para múltiplo de 3 mantendo a simetria: tira um par espelhado ou um parafuso do
  // eixo, ou acrescenta parafusos em furos livres do esqueleto. Último recurso: tirar sem simetria.
  function ajustarTotal(L, rng) {
    const resto = L.parafusos.length % 3;
    if (!resto) return true;
    const eixo = (L.W - 1) / 2;
    const noPonto = (x, y) => {
      const i = L.grade[y * L.W + x];
      return i >= 0 ? L.parafusos[i] : null;
    };
    const opcoes = []; // { delta, tirar: [parafusos], por: [[placa, x, y]] }
    for (const s of L.parafusos) {
      const n = contarNaPlaca(L, s.placa);
      if (s.x === eixo && L.placas[s.placa].tipo === 'centro' && n >= 2) opcoes.push({ delta: -1, tirar: [s], por: [] });
      if (s.x < eixo) {
        const m = noPonto(L.W - 1 - s.x, s.y);
        if (!m) continue;
        const ok = m.placa === s.placa ? n >= 3 : n >= 2 && contarNaPlaca(L, m.placa) >= 2 && L.placas[s.placa].par === m.placa;
        if (ok) opcoes.push({ delta: -2, tirar: [s, m], por: [] });
      }
    }
    // Furos livres: só a metade esquerda (x ≤ eixo) de cada placa simétrica; o espelho vai junto.
    // A metade direita de um par não alcança o eixo, então cada par é visto uma vez só.
    L.placas.forEach((q, i) => {
      if (q.tipo === 'livre') return;
      const gemea = q.tipo === 'par' ? q.par : i;
      for (let y = Math.max(0, Math.ceil(q.by0)); y <= Math.min(L.H - 1, Math.floor(q.by1)); y++) {
        for (let x = Math.max(0, Math.ceil(q.bx0)); x <= Math.min(eixo, Math.floor(q.bx1)); x++) {
          if (!cabeParafuso(L, i, x, y)) continue;
          if (x === eixo) {
            if (q.tipo === 'centro') opcoes.push({ delta: 1, tirar: [], por: [[i, x, y]] });
          } else if (cabeParafuso(L, gemea, L.W - 1 - x, y)) {
            opcoes.push({ delta: 2, tirar: [], por: [[i, x, y], [gemea, L.W - 1 - x, y]] });
          }
        }
      }
    });
    const validas = opcoes.filter((o) => (resto + o.delta) % 3 === 0);
    if (!validas.length) {
      for (let k = 0; k < resto; k++) {
        const soltos = L.parafusos.filter((s) => !s.fora && contarNaPlaca(L, s.placa) >= 2);
        if (!soltos.length) return false;
        rng.escolher(soltos).fora = true;
      }
      validas.push({ tirar: [], por: [] });
    }
    const escolha = rng.escolher(validas);
    for (const s of escolha.tirar) s.fora = true;
    for (const [i, x, y] of escolha.por) {
      const cob = [];
      for (let j = i + 1; j < L.placas.length; j++) if (relacaoRapida(L.placas[j], x, y) === 'coberto') cob.push(j);
      L.grade[y * L.W + x] = L.parafusos.length;
      L.parafusos.push({ placa: i, x, y, cob });
    }
    L.parafusos = L.parafusos.filter((s) => !s.fora);
    return L.parafusos.length % 3 === 0;
  }

  // ------------------------------------------------------------------ solução e cores (§4.6)

  // Ordem de retirada aleatória e válida. Quase sempre continua pelos parafusos que a última placa
  // caída acabou de soltar: assim as caixas ativas pedem cores que estavam escondidas, e é preciso cavar.
  // Devolve também, para cada passo, quantos parafusos ele solta (> 0 = "chave").
  function ordemAleatoria(parafusos, numPlacas, rng) {
    const naPlaca = new Array(numPlacas).fill(0);
    const cobre = Array.from({ length: numPlacas }, () => []);
    const bloqueio = parafusos.map((s, id) => {
      naPlaca[s.placa]++;
      for (const q of s.cob) cobre[q].push(id);
      return s.cob.length;
    });
    const livres = [];
    bloqueio.forEach((b, id) => b === 0 && livres.push(id));
    const ordem = [];
    const solta = [];
    let recentes = [];
    while (livres.length) {
      const id = recentes.length && rng.chance(P_LOCAL) ? rng.escolher(recentes) : rng.escolher(livres);
      livres.splice(livres.indexOf(id), 1);
      recentes = recentes.filter((t) => t !== id);
      ordem.push(id);
      const placa = parafusos[id].placa;
      const novos = [];
      if (--naPlaca[placa] === 0) for (const t of cobre[placa]) if (--bloqueio[t] === 0) novos.push(t);
      livres.push(...novos);
      if (novos.length) recentes = novos;
      solta.push(novos.length);
    }
    return { ordem, solta };
  }

  // Percorre a ordem simulando caixas abstratas (§2.3) e decide a cor de cada parafuso.
  // Às vezes "reserva" uma chave (parafuso cuja saída derruba uma placa e solta outros): ela ganha a cor
  // de uma caixa futura e espera na bandeja. É o que obriga o jogador a escolher bem o que mandar para lá.
  function atribuirCores(N, ordem, solta, p, rng) {
    const B = N / 3;
    const sacola = [];
    const ordemCores = rng.embaralhar(Array.from({ length: p.numCores }, (_, c) => c));
    for (let i = 0; i < p.numCores; i++) {
      const vezes = Math.floor(B / p.numCores) + (i < B % p.numCores ? 1 : 0);
      for (let j = 0; j < vezes; j++) sacola.push(ordemCores[i]);
    }
    rng.embaralhar(sacola);
    const tirarCor = (evitar) => {
      let i = sacola.findIndex((c) => !evitar.includes(c));
      if (i < 0) i = 0;
      return sacola.splice(i, 1)[0];
    };
    const contar = (lista, c) => lista.reduce((t, x) => t + (x === c ? 1 : 0), 0);

    const caixas = [];
    const slots = [];
    for (let i = 0; i < p.ativas; i++) {
      if (caixas.length >= B) {
        slots.push(null);
        continue;
      }
      const c = tirarCor(slots.filter(Boolean).map((x) => x.cor));
      caixas.push(c);
      slots.push({ cor: c, n: 0 });
    }
    const futuras = [];
    const bandeja = [];
    const cor = new Array(N);
    let pressao = 0;

    for (let i = 0; i < N; i++) {
      const s = ordem[i];
      const comEspaco = slots.filter((x) => x && x.n < 3).map((x) => x.cor);
      let c = -1;
      if (bandeja.length < p.pressao && solta[i] > 0 && rng.chance(Math.min(1, F_CHAVE * p.pReserva))) {
        // Cores de caixas futuras que ainda têm vaga para mais um reservado (e que nenhuma caixa ativa aceitaria).
        const existentes = futuras.filter(
          (f, k) => futuras.indexOf(f) === k && !comEspaco.includes(f) && 3 * contar(futuras, f) - contar(bandeja, f) > 0
        );
        const podeNova = caixas.length < B && sacola.some((x) => !comEspaco.includes(x));
        if (existentes.length && (!podeNova || rng.chance(0.5))) {
          c = rng.escolher(existentes);
        } else if (podeNova) {
          c = tirarCor(comEspaco);
          futuras.push(c);
          caixas.push(c);
        }
      }
      if (c >= 0) {
        cor[s] = c;
        bandeja.push(c);
        pressao = Math.max(pressao, bandeja.length);
        continue; // ir para a bandeja não mexe nas caixas
      }

      // Uma caixa ativa com espaço dá a cor (60% a mais cheia); o parafuso entra como em §2.3.
      const abertas = [];
      slots.forEach((x, k) => x && x.n < 3 && abertas.push(k));
      if (!abertas.length) return null;
      abertas.sort((a, b) => slots[b].n - slots[a].n || a - b);
      c = slots[abertas.length > 1 && !rng.chance(0.6) ? abertas[1] : abertas[0]].cor;
      cor[s] = c;
      let alvo = -1;
      slots.forEach((x, k) => {
        if (x && x.cor === c && x.n < 3 && (alvo < 0 || x.n > slots[alvo].n)) alvo = k;
      });
      slots[alvo].n++;

      // Caixas cheias dão lugar à próxima (futura reservada ou nova), que puxa da bandeja a sua cor.
      let mudou = true;
      while (mudou) {
        mudou = false;
        for (let k = 0; k < slots.length; k++) {
          if (!slots[k] || slots[k].n < 3) continue;
          mudou = true;
          let nova = null;
          if (futuras.length) nova = futuras.shift();
          else if (caixas.length < B) {
            nova = tirarCor(slots.filter((x, j) => x && j !== k).map((x) => x.cor));
            caixas.push(nova);
          }
          slots[k] = nova === null ? null : { cor: nova, n: 0 };
          if (nova === null) continue;
          for (let v = 0; v < bandeja.length && slots[k].n < 3; ) {
            if (bandeja[v] === nova) {
              bandeja.splice(v, 1);
              slots[k].n++;
            } else v++;
          }
        }
      }
    }
    if (bandeja.length || futuras.length || caixas.length !== B || slots.some(Boolean)) return null;
    return { cor, caixas, pressao };
  }

  // ------------------------------------------------------------------ tintas

  // Pares espelhados levam a mesma tinta; placas que se tocam, tintas diferentes; equilibra o uso.
  function pintar(L, rng) {
    const usos = new Array(NUM_TINTAS).fill(0);
    L.placas.forEach((q, i) => {
      if (q.par >= 0 && q.par < i) {
        q.tinta = L.placas[q.par].tinta;
      } else {
        const vizinhas = new Set();
        for (let j = 0; j < i; j++) {
          const o = L.placas[j];
          if (q.bx0 > o.bx1 + 0.3 || q.bx1 < o.bx0 - 0.3 || q.by0 > o.by1 + 0.3 || q.by1 < o.by0 - 0.3) continue;
          if (G.distEsqueletos(q, o) < q.raio + o.raio + 0.3) vizinhas.add(o.tinta);
        }
        let opcoes = [];
        for (let t = 0; t < NUM_TINTAS; t++) if (!vizinhas.has(t)) opcoes.push(t);
        if (!opcoes.length) opcoes = usos.map((_, t) => t);
        const menor = Math.min(...opcoes.map((t) => usos[t]));
        q.tinta = rng.escolher(opcoes.filter((t) => usos[t] === menor));
      }
      usos[q.tinta]++;
    });
  }

  // ------------------------------------------------------------------ montagem, validação, dificuldade

  function contarCobertos(nivel) {
    return nivel.cobertoPor.reduce((t, l) => t + (l.length ? 1 : 0), 0);
  }

  function pressaoDaSolucao(nivel) {
    const e = R.estadoInicial(nivel);
    let max = 0;
    for (const id of nivel.solucao) {
      R.aplicar(nivel, e, id);
      max = Math.max(max, e.bandeja.length);
    }
    return max;
  }

  function candidato(n, p, semente) {
    const rng = A.criar(semente);
    const L = montarLayout(p, rng);
    if (!L || !ajustarTotal(L, rng)) return null;
    // Ids agrupados por placa e em ordem de leitura.
    const lista = L.parafusos.slice().sort((a, b) => a.placa - b.placa || a.y - b.y || a.x - b.x);
    const { ordem, solta } = ordemAleatoria(lista, L.placas.length, rng);
    const cores = atribuirCores(lista.length, ordem, solta, p, rng);
    if (!cores) return null;
    pintar(L, rng);
    const nivel = {
      numero: n,
      versao: VERSAO,
      dificil: p.dificil,
      tutorial: 0,
      largura: p.largura,
      altura: p.altura,
      placas: L.placas.map((q, i) => ({ id: i, camada: i, forma: q.forma, partes: q.partes, raio: q.raio, tinta: q.tinta })),
      parafusos: lista.map((s, i) => ({ id: i, placa: s.placa, x: s.x, y: s.y, cor: cores.cor[i] })),
      caixas: cores.caixas,
      ativas: p.ativas,
      bandeja: p.bandeja,
      numCores: p.numCores,
      solucao: ordem,
      pressao: cores.pressao,
      stats: null,
    };
    R.preparar(nivel);
    return validar(nivel).length ? null : nivel;
  }

  // Sorteia candidatos e fica com o de taxa de vitória do jogador guloso mais próxima do alvo (§4.7).
  function melhorCandidato(n, p, semente) {
    const validos = [];
    for (let k = 0; k < CANDIDATOS_MAX && !(k >= CANDIDATOS && validos.length); k++) {
      const nivel = candidato(n, p, A.hash(semente + ':' + k));
      if (!nivel) continue;
      const taxa = simularGuloso(nivel, A.criar(A.hash(semente + ':guloso')), RODADAS_GULOSO);
      validos.push({ nivel, taxa, k, cobertos: contarCobertos(nivel) });
    }
    if (!validos.length) return null;
    const erro = (c) => Math.abs(c.taxa - p.alvoGuloso);
    validos.sort((a, b) => erro(a) - erro(b) || b.cobertos - a.cobertos || a.k - b.k);
    const melhor = validos[0];
    melhor.nivel.stats = { taxaGulosa: melhor.taxa, cobertosInicio: melhor.cobertos, alvo: p.alvoGuloso, candidato: melhor.k };
    return melhor.nivel;
  }

  function construir(n) {
    const semente = A.hash('parafusinhos-v' + VERSAO + '-fase-' + n);
    let p = parametros(n);
    for (;;) {
      const nivel = melhorCandidato(n, p, semente);
      if (nivel) return nivel;
      if (p.numPlacas <= 4 && p.pressao === 0) break;
      p = Object.assign({}, p, { numPlacas: Math.max(4, p.numPlacas - 2), pressao: Math.max(0, p.pressao - 1) });
    }
    // Rede de segurança (nunca visto nos testes): a fase 3, com o número desta.
    return Object.assign(tutorial(3), { numero: n, tutorial: 0, dificil: ehDificil(n) });
  }

  // Jogador guloso: joga numa caixa quando pode (ao acaso), senão manda um parafuso qualquer para a bandeja.
  function simularGuloso(nivel, gerador, vezes) {
    const N = nivel.parafusos.length;
    const naCaixa = [];
    const naBandeja = [];
    let vitorias = 0;
    for (let v = 0; v < vezes; v++) {
      const e = R.estadoInicial(nivel);
      while (e.restantes > 0) {
        naCaixa.length = 0;
        naBandeja.length = 0;
        const cabe = e.bandeja.length < R.capacidadeBandeja(nivel, e);
        for (let id = 0; id < N; id++) {
          if (!R.livre(nivel, e, id)) continue;
          if (R.slotPara(e, nivel.parafusos[id].cor) >= 0) naCaixa.push(id);
          else if (cabe) naBandeja.push(id);
        }
        const lista = naCaixa.length ? naCaixa : naBandeja;
        if (!lista.length) break;
        R.aplicar(nivel, e, gerador.escolher(lista));
      }
      if (e.restantes === 0) vitorias++;
    }
    return vezes > 0 ? vitorias / vezes : 0;
  }

  // Uma mensagem por regra violada (§4.3); lista vazia = fase válida.
  function validar(nivel) {
    const erros = [];
    const W = nivel.largura;
    const H = nivel.altura;
    const placas = nivel.placas;
    const parafusos = nivel.parafusos;
    const N = parafusos.length;
    const dentro = (x, y) => x >= 0 && y >= 0 && x <= W - 1 && y <= H - 1;

    // V4
    placas.forEach((q, i) => {
      if (q.id !== i) erros.push(`V4: placa ${i} tem id ${q.id}`);
      if (i > 0 && !(q.camada > placas[i - 1].camada)) erros.push(`V4: camada da placa ${i} fora de ordem ou repetida`);
    });
    parafusos.forEach((s, i) => {
      if (s.id !== i) erros.push(`V4: parafuso ${i} tem id ${s.id}`);
    });
    const naPlaca = placas.map(() => []);
    for (const s of parafusos) {
      if (naPlaca[s.placa]) naPlaca[s.placa].push([s.x, s.y]);
      else erros.push(`V4: parafuso ${s.id} numa placa inexistente`);
    }
    naPlaca.forEach((l, i) => {
      if (!l.length) erros.push(`V4: placa ${i} sem parafuso`);
    });
    if (erros.length) return erros; // sem ids e placas coerentes, o resto não faz sentido

    // V1, V2
    const ocupados = new Set();
    for (const s of parafusos) {
      if (!Number.isInteger(s.x) || !Number.isInteger(s.y) || !dentro(s.x, s.y)) erros.push(`V1: parafuso ${s.id} fora da grade`);
      const k = s.x + ',' + s.y;
      if (ocupados.has(k)) erros.push(`V1: dois parafusos em (${k})`);
      ocupados.add(k);
      const q = placas[s.placa];
      if (G.distEsqueleto(s.x, s.y, q) > q.raio - G.R_PARAFUSO + G.FOLGA_COBRE) erros.push(`V2: parafuso ${s.id} fora da placa ${q.id}`);
    }

    // V3, V9
    for (const s of parafusos) {
      const propria = placas[s.placa].camada;
      const esperado = [];
      for (const q of placas) {
        if (q.camada <= propria) continue;
        const r = G.relacao(q, s.x, s.y);
        if (r === 'ambiguo') erros.push(`V3: parafuso ${s.id} ambíguo sob a placa ${q.id}`);
        else if (r === 'coberto') esperado.push(q.id);
      }
      if (!nivel.cobertoPor || String(nivel.cobertoPor[s.id]) !== String(esperado)) erros.push(`V9: cobertoPor do parafuso ${s.id} não confere`);
    }

    // V5
    if (N % 3) erros.push(`V5: ${N} parafusos (não é múltiplo de 3)`);
    if (nivel.caixas.length * 3 !== N) erros.push(`V5: ${nivel.caixas.length} caixas para ${N} parafusos`);
    if (!(Number.isInteger(nivel.numCores) && nivel.numCores >= 1 && nivel.numCores <= MAX_CORES)) erros.push('V5: numCores inválido');
    const porCor = new Array(MAX_CORES).fill(0);
    for (const s of parafusos) {
      if (Number.isInteger(s.cor) && s.cor >= 0 && s.cor < nivel.numCores) porCor[s.cor]++;
      else erros.push(`V5: cor ${s.cor} do parafuso ${s.id}`);
    }
    for (const c of nivel.caixas) {
      if (Number.isInteger(c) && c >= 0 && c < nivel.numCores) porCor[c] -= 3;
      else erros.push(`V5: caixa de cor ${c}`);
    }
    porCor.forEach((d, c) => {
      if (d) erros.push(`V5: cor ${c} com parafusos e caixas desencontrados`);
    });
    for (const q of placas) if (!(Number.isInteger(q.tinta) && q.tinta >= 0 && q.tinta < NUM_TINTAS)) erros.push(`V5: tinta da placa ${q.id}`);

    // V6
    for (const q of placas) for (const parte of q.partes) for (const [x, y] of parte.pontos) if (!dentro(x, y)) erros.push(`V6: placa ${q.id} sai da grade`);

    // V7
    const medidas = placas.map((q, i) => medir({ partes: q.partes, raio: q.raio, pts: naPlaca[i] }));
    for (let i = 0; i < placas.length; i++) {
      for (let j = i + 1; j < placas.length; j++) if (quaseIguais(medidas[i], medidas[j])) erros.push(`V7: placas ${i} e ${j} quase iguais`);
    }

    // V8
    const sol = nivel.solucao;
    const ehPermutacao = Array.isArray(sol) && sol.length === N && new Set(sol).size === N && sol.every((id) => Number.isInteger(id) && id >= 0 && id < N);
    if (!ehPermutacao) erros.push('V8: solucao não é uma permutação dos parafusos');
    else if (nivel.cobertoPor && nivel.parafusosDaPlaca) {
      const e = R.estadoInicial(nivel);
      let max = 0;
      let ok = true;
      for (const id of sol) {
        const r = R.jogar(nivel, e, id);
        if (!r.ok) {
          erros.push(`V8: jogada ${id} da solução é ilegal (${r.motivo})`);
          ok = false;
          break;
        }
        max = Math.max(max, e.bandeja.length);
      }
      if (ok && !R.venceu(nivel, e)) erros.push('V8: a solução não vence');
      if (ok && (max > 5 || max !== nivel.pressao)) erros.push(`V8: pressao ${nivel.pressao}, medida ${max}`);
    }
    return erros;
  }

  // ------------------------------------------------------------------ gerar (memória das últimas fases)

  const memoria = [];

  function gerar(numero) {
    const n = Math.max(1, Math.floor(Number(numero)) || 1);
    const i = memoria.findIndex((nv) => nv.numero === n);
    if (i >= 0) {
      const nivel = memoria.splice(i, 1)[0];
      memoria.push(nivel);
      return nivel;
    }
    const nivel = n <= 3 ? tutorial(n) : construir(n);
    memoria.push(nivel);
    if (memoria.length > MEMORIA) memoria.shift();
    return nivel;
  }

  P.Fases = { VERSAO, MAX_CORES, NUM_TINTAS, gerar, parametros, ehDificil, validar, simularGuloso };
})(globalThis.Parafusinhos = globalThis.Parafusinhos || {});
