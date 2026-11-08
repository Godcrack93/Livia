/* Pipoca Conta — tela "mapa": a trilha das 30 estações (PROJETO.md 4.2, 6.5 e 9.2).
   A trilha rola para os lados com o dedo (com inércia) e atravessa Prado, Lagoa e Floresta, cada região com o seu
   cenário e um portal com o nome. Cada estação mostra o ícone da sua atividade e um destes estados:
     concluída  colorida, com estrelinha e, ao lado, o bichinho da figurinha ganha ("o mundo cresce");
     atual      colorida e pulsando (a ÚNICA coisa que anima no mapa), com a Pipoca em cima, apontando;
     bloqueada  (pela ordem) cinza com cadeado: "Primeiro esta aqui!" e a Pipoca aponta a atual;
     fechada    (assinatura) cinza com cadeado simples: fala neutra e aponta a atual. Nunca abre portão nem oferta.
   Sem assinatura, depois da estação 4 a "atual" é a última liberada (dá para jogar de novo); com a trilha toda
   feita, é a última. Uma estação feita que ficou fechada (a assinatura acabou) continua com estrela e bichinho.
   Parâmetros de PC.telas.ir('mapa', ...): { animarEstacao, concluida } (vêm da tela de Parabéns: a estação concluída
   ganha a estrela e o bichinho, a nova se abre e a Pipoca pula para ela). Sem eles (a criança saiu do Parabéns pelo
   voltar), vale a estação concluída pela primeira vez (evento 'dados:progresso'). Jogar de novo uma estação que já
   tinha estrela não repete a animação. Com a trilha toda feita pela primeira vez, confete na bandeira de chegada.
   A posição da trilha fica em PC.dados.extra('mapa-x'); ao abrir, a trilha rola sozinha até a estação atual.
   Tocar na Pipoca repete a instrução, como no resto do jogo: pulinho, "Vamos brincar? Toque aqui!" e a mãozinha
   na estação atual. Parada sem tocar (10 s), a Pipoca convida do mesmo jeito (no máximo duas vezes por visita).
   Voltar (Android/Esc): com o portão dos adultos aberto, só fecha o portão; senão, abertura.
   data-teste: estacao-1 … estacao-30, pipoca, trilha (o chão que rola), inicio, album, livre, pais.
   Testes (só no navegador): PC.debug.mapa.estado(), PC.debug.mapa.rolar(x), PC.debug.mapa.centro(n); o passo
   {"gesto": true} toca a estação atual (ou arrasta a trilha até ela) e {"esperar": "ocioso"} espera a trilha parar
   (PC.debug.telaOcupada). */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  // ---------------------------------------------------------------- medidas (px virtuais do palco)
  const X1 = 420;                  // x da estação 1 no mundo
  const ESPACO = 250;              // entre estações vizinhas
  const VAO = 420;                 // entre a última estação de uma região e a primeira da seguinte (portal no meio)
  const LADO = 150;                // área de toque da estação (≥ PC.layout.alvoMinimo)
  const FOCO = 800;                // x do palco onde fica a estação em foco
  const PIP = { l: 180, a: 194 };  // a Pipoca no mapa, de pé em cima da estação
  const PARALAXE = 0.35;           // as nuvens andam mais devagar que a trilha (o sol fica parado)
  const ATRITO = 0.9965;           // inércia: a velocidade é multiplicada por isto a cada ms
  const VMAX = 8;                  // velocidade máxima da inércia (px virtuais por ms)
  const OCIOSO_MS = 10000;         // sem toque nenhum: a Pipoca convida (uma vez até o próximo toque)
  const MAX_CONVITES = 2;          // convites por visita ao mapa (sem insistir: PROJETO.md 6.5)
  const FUSAO = 380;               // largura da faixa em que uma região se funde na anterior

  const FALA_BLOQUEADA = 'Primeiro esta aqui!';
  const FALA_FECHADA = 'Essa ainda está fechadinha. Vamos brincar nesta?';
  const FALA_NOVA = 'Oba! Agora é esta aqui!';
  const FALA_CONVITE = 'Vamos brincar? Toque aqui!';

  /** Altura da trilha em cada x do mundo: uma onda suave. */
  const ondaY = x => 565 + 78 * Math.sin((x - X1) / 330);

  // Estação concluída pela PRIMEIRA vez desde a última visita ao mapa (o Parabéns da moldura grava o progresso e o
  // núcleo emite 'dados:progresso'). Com isso o mapa mostra a conquista (estrela, bichinho e o pulo da Pipoca)
  // também quando a criança sai do Parabéns pelo voltar, sem os parâmetros, e não repete a animação quando ela só
  // jogou de novo uma estação antiga.
  let ultimaNova = 0;
  PC.on('dados:progresso', n => { ultimaNova = Number(n) || 0; });
  PC.on('dados:zerados', () => { ultimaNova = 0; });

  // ---------------------------------------------------------------- estilo
  function estilos() {
    U.estilo('mapa', `
      .tela-mapa .pc-mapa-ceu { position: absolute; left: -1200px; top: -700px; width: 4000px; height: 2300px; pointer-events: none;
        background: linear-gradient(180deg, #5FB6F0 0px, #7CC8FF 700px, #CDEEFF 1260px, #E4F7FF 1700px); }
      .tela-mapa .pc-mapa-sol { position: absolute; left: 560px; top: -12px; width: 260px; height: 260px; pointer-events: none; }
      .pc-mapa-area { position: absolute; left: -1200px; top: -700px; width: 4000px; height: 2300px; touch-action: none; }
      .pc-mapa-longe, .pc-mapa-mundo { position: absolute; left: 1200px; top: 700px; width: 0; height: 0; }
      .pc-mapa-longe, .pc-mapa-svg, .pc-mapa-portal, .pc-mapa-bicho { pointer-events: none; }
      .pc-mapa-svg { position: absolute; overflow: visible; }
      .pc-mapa-cenario { z-index: 0; }
      .pc-mapa-caminho { z-index: 2; }

      .pc-mapa-portal { position: absolute; z-index: 1; width: 0; height: 0; }
      .pc-mapa-poste { position: absolute; top: 70px; width: 26px; height: 486px; margin-left: -13px; border-radius: 9px;
        background: #B98546; border: 5px solid #3A2A5A; box-shadow: inset -6px 0 0 rgba(138, 90, 52, .45); }
      .pc-mapa-poste.e { left: -104px; }
      .pc-mapa-poste.d { left: 104px; }
      .pc-mapa-tabua { position: absolute; left: 0; top: 0; transform: translateX(-50%); height: 96px; padding: 0 28px 0 18px;
        display: flex; align-items: center; gap: 12px; white-space: nowrap; border-radius: 24px; background: #F8E2B0;
        border: 6px solid #3A2A5A; box-shadow: inset 0 -9px 0 rgba(185, 133, 70, .35), 0 8px 0 rgba(58, 42, 90, .22);
        font: 700 48px/1 var(--fonte); color: #3A2A5A; }
      .pc-mapa-tabua svg { width: 58px; height: 58px; flex: none; display: block; }

      .pc-mapa-bicho { position: absolute; z-index: 4; width: 104px; height: 104px; transform: rotate(-7deg); }
      .pc-mapa-bicho svg { width: 100%; height: 100%; display: block; }

      .pc-mapa-estacao { position: absolute; z-index: 5; width: ${LADO}px; height: ${LADO}px; cursor: pointer; }
      .pc-mapa-pulso { position: absolute; left: 0; top: 0; width: ${LADO}px; height: ${LADO}px; }
      .pc-mapa-disco { position: absolute; left: 5px; top: 3px; width: 140px; height: 140px; border-radius: 50%; display: grid; place-items: center;
        background: #fff; border: 6px solid #3A2A5A; box-shadow: inset 0 0 0 10px var(--cor, #5CC84A), 0 9px 0 rgba(58, 42, 90, .3);
        transition: transform .1s; }
      .pc-mapa-disco svg { width: 108px; height: 108px; display: block; border-radius: 50%; }
      .pc-mapa-estacao.apertado .pc-mapa-disco { transform: scale(.92); }
      .pc-mapa-estacao.feita .pc-mapa-disco { background: #FFFBEA; }
      .pc-mapa-estacao.cinza .pc-mapa-disco { background: #ECE9F1; border-color: #8D86A3;
        box-shadow: inset 0 0 0 10px #CFCADB, 0 9px 0 rgba(58, 42, 90, .16); }
      .pc-mapa-estacao.cinza .pc-mapa-disco svg { filter: saturate(.3) brightness(1.12) contrast(.85); }
      .pc-mapa-selo { position: absolute; display: grid; place-items: center; }
      .pc-mapa-selo svg { width: 100%; height: 100%; display: block; }
      .pc-mapa-estrela { right: -12px; top: -14px; width: 66px; height: 66px; }
      .pc-mapa-cadeado { left: -8px; bottom: -6px; width: 68px; height: 68px; border-radius: 50%; background: #fff; border: 5px solid #8D86A3; }
      .pc-mapa-cadeado svg { width: 46px; height: 46px; }
      .pc-mapa-estacao:not(.feita) .pc-mapa-estrela, .pc-mapa-estacao:not(.cinza) .pc-mapa-cadeado { display: none; }
      .pc-mapa-halo { position: absolute; left: -6px; top: -8px; width: 162px; height: 162px; border-radius: 50%; border: 8px solid #fff; opacity: 0; }
      .pc-mapa-estacao:not(.atual) .pc-mapa-halo { display: none; }
      .pc-mapa-estacao.atual .pc-mapa-pulso { animation: pcMapaPulsa 1.3s ease-in-out infinite; }
      .pc-mapa-estacao.atual .pc-mapa-halo { animation: pcMapaHalo 1.3s ease-out infinite; }
      @keyframes pcMapaPulsa { 50% { transform: scale(1.08); } }
      @keyframes pcMapaHalo { 0% { transform: scale(.86); opacity: .85; } 100% { transform: scale(1.34); opacity: 0; } }

      /* a Pipoca apresentadora (PC.ui.pipoca) mora dentro da trilha, de pé em cima da estação atual.
         No mapa só a estação atual anima: sem respirar nem piscar (falar e pular continuam). */
      .tela-mapa .pipoca-host.pc-mapa-pip { width: ${PIP.l}px; height: ${PIP.a}px; z-index: 30; }
      .tela-mapa .pc-mapa-pip .pipoca-corpo { width: ${PIP.l}px; height: ${PIP.a}px; }
      .tela-mapa .pc-mapa-pip .pipoca-corpo.respira:not(.pula):not(.danca) { animation: none; }
      .tela-mapa .pc-mapa-pip .pip-piscar, .tela-mapa .pc-mapa-pip .pip-braco-aceno { animation: none; }
      .tela-mapa .pc-mapa-pip .balao { left: 150px; bottom: 150px; transform-origin: 8% 100%; }
      .tela-mapa .pc-mapa-pip .balao::after { left: 30px; }
      .tela-mapa .pc-mapa-pip.pc-mapa-balao-esq .balao { left: auto; right: 150px; transform-origin: 92% 100%; }
      .tela-mapa .pc-mapa-pip.pc-mapa-balao-esq .balao::after { left: auto; right: 30px; }

      .pc-mapa-topo { position: absolute; left: 0; top: 0; width: 1600px; height: 0; z-index: 60; }
      .pc-mapa-topo .botao-icone.pc-mapa-btn { position: absolute; top: 14px; width: 140px; height: 140px; }
      .pc-mapa-topo .botao-icone.pc-mapa-btn svg { width: 84px; height: 84px; }
      .pc-mapa-topo .pc-mapa-inicio { left: 24px; }
      .pc-mapa-topo .pc-mapa-livre { right: 352px; background: #E2F7F3; }
      .pc-mapa-topo .pc-mapa-album { right: 192px; background: #FFE9F3; }
      .pc-mapa-pais { position: absolute; right: 20px; top: 14px; width: 140px; height: 140px; padding: 0; border: 0; background: none;
        cursor: pointer; display: grid; place-items: center; touch-action: manipulation; }
      .pc-mapa-pais > span { width: 88px; height: 88px; border-radius: 50%; display: grid; place-items: center; background: #fff;
        border: 5px solid var(--tinta); box-shadow: 0 6px 0 var(--tinta); transition: transform .08s, box-shadow .08s; }
      .pc-mapa-pais svg { width: 52px; height: 52px; display: block; }
      .pc-mapa-pais.apertado > span { transform: translateY(4px); box-shadow: 0 2px 0 var(--tinta); }
    `);
  }

  // ---------------------------------------------------------------- cenário (SVG em texto)
  // Formas iguais vão num <path> só (poucos elementos por tela). O "sorteio" do cenário é fixo: o mundo é sempre
  // o mesmo (e não gasta o sorteio com semente das atividades).
  const fixo = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const r1 = v => Math.round(v * 10) / 10;
  const circ = (cx, cy, r) => `M${r1(cx - r)} ${r1(cy)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const elip = (cx, cy, rx, ry) => `M${r1(cx - rx)} ${r1(cy)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  const forma = (d, cor, extra) => (d ? `<path d="${d}" fill="${cor}"${extra || ''}/>` : '');
  const traco = (d, cor, largura, extra) => (d ? `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${largura}" stroke-linecap="round"${extra || ''}/>` : '');

  function estrelaD(cx, cy, R, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + r1(cx + q * Math.cos(a)) + ' ' + r1(cy + q * Math.sin(a));
    }
    return d + 'Z';
  }

  /** Morros suaves de xa a xb (fechados até embaixo). alturaEm(x) -> [base, altura] dos morros naquele x. */
  function morros(xa, xb, passo, sem, alturaEm) {
    const pts = [];
    for (let x = xa, i = 0; x < xb + passo; x += passo, i++) { const [base, amp] = alturaEm(x); pts.push([x, base - amp * fixo(sem + i)]); }
    let d = `M${r1(xa)} 1500L${r1(pts[0][0])} ${r1(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], m = (x1 - x0) / 2;
      d += `C${r1(x0 + m)} ${r1(y0)} ${r1(x1 - m)} ${r1(y1)} ${r1(x1)} ${r1(y1)}`;
    }
    return d + `L${r1(pts[pts.length - 1][0])} 1500Z`;
  }
  function moitas(lista, cor) {
    let d = '';
    lista.forEach(([x, y, e]) => { d += circ(x, y - 30 * e, 44 * e) + circ(x - 44 * e, y - 12 * e, 32 * e) + circ(x + 44 * e, y - 10 * e, 34 * e); });
    return forma(d, cor);
  }
  function arvores(lista, corCopa, corTronco) {
    let tronco = '', copa = '', brilho = '';
    lista.forEach(([x, y, e]) => {
      tronco += `M${r1(x - 14 * e)} ${r1(y)}h${r1(28 * e)}v${r1(-112 * e)}h${r1(-28 * e)}Z`;
      copa += circ(x, y - 142 * e, 72 * e) + circ(x - 56 * e, y - 102 * e, 50 * e) + circ(x + 56 * e, y - 102 * e, 52 * e);
      brilho += circ(x - 22 * e, y - 172 * e, 22 * e);
    });
    return forma(tronco, corTronco) + forma(copa, corCopa) + forma(brilho, '#FFFFFF', ' opacity=".14"');
  }
  function flores(lista) {
    const porCor = {};
    let miolos = '';
    lista.forEach(([x, y, c]) => {
      porCor[c] = (porCor[c] || '') + circ(x - 9, y, 7) + circ(x + 9, y, 7) + circ(x, y - 9, 7) + circ(x, y + 9, 7);
      miolos += circ(x, y, 5);
    });
    return Object.keys(porCor).map(c => forma(porCor[c], c)).join('') + forma(miolos, '#FFE27A');
  }
  const tufos = (lista, cor) => forma(lista.map(([x, y]) => `M${r1(x)} ${r1(y)}q6 -26 12 0q6 -30 12 0q6 -22 12 0Z`).join(''), cor);
  function cogumelos(lista) {
    let pe = '', vermelho = '', roxo = '', pintas = '';
    lista.forEach(([x, y, roxinho]) => {
      pe += `M${r1(x - 7)} ${r1(y)}h14v-24h-14Z`;
      const chapeu = `M${r1(x - 25)} ${r1(y - 20)}C${r1(x - 25)} ${r1(y - 50)} ${r1(x + 25)} ${r1(y - 50)} ${r1(x + 25)} ${r1(y - 20)}Z`;
      if (roxinho) roxo += chapeu; else vermelho += chapeu;
      pintas += circ(x - 10, y - 31, 4) + circ(x + 9, y - 34, 3.5) + circ(x + 1, y - 25, 3);
    });
    return forma(pe, '#FFF8EC') + forma(vermelho, '#FF7A6B') + forma(roxo, '#9B7BFF') + forma(pintas, '#FFFFFF');
  }
  /** Bandeira de chegada, no fim da trilha. */
  function bandeira(x) {
    return `<g stroke="#3A2A5A" stroke-width="5" stroke-linejoin="round">
      <rect x="${x - 10}" y="318" width="20" height="500" rx="8" fill="#B98546"/>
      <path d="M${x + 10} 340L${x + 178} 388L${x + 10} 436Z" fill="#FF7A6B"/>
      <path d="${estrelaD(x + 68, 388, 25, 11)}" fill="#FFC93C" stroke-width="4"/>
      <circle cx="${x}" cy="314" r="17" fill="#FFC93C"/></g>`;
  }

  /**
   * Paisagem de cada região: cor e morros [base, altura] das três camadas (longe, meio, chão). Cada camada é UM
   * caminho para o mundo inteiro; na passagem de uma região para a seguinte (FUSAO px) a altura e a cor mudam aos
   * poucos, sem transparência: nada "fantasma" e nenhuma emenda reta no cenário.
   */
  const PAISAGEM = {
    prado: { cores: ['#B4E6A0', '#94D97C', '#7FCB65'], morros: [[594, 56], [714, 26], [808, 9]] },
    lagoa: { cores: ['#A6DD92', '#8ED474', '#7ECB64'], morros: [[590, 48], [700, 22], [810, 8]] },
    floresta: { cores: ['#8FCB7A', '#7AC062', '#6CB955'], morros: [[602, 40], [726, 20], [814, 8]] },
  };
  const CAMADAS = [{ passo: 470, semente: 11 }, { passo: 560, semente: 23 }, { passo: 680, semente: 37 }];
  const suave = t => t * t * (3 - 2 * t);
  let serie = 0;

  /**
   * As três camadas de morros com os detalhes de cada região entre elas, num <svg> só.
   * faixas: [{ id, x0 }] em ordem (x0 = onde a região começa a aparecer; a 1ª não tem); detalhes: [longe, meio, chão].
   */
  function paisagemMundo(xa, xb, faixas, detalhes) {
    const pais = f => PAISAGEM[f.id] || PAISAGEM.prado;
    const ids = 'pc-mapa-' + (++serie) + '-';
    const off = v => U.limitar((v - xa) / (xb - xa), 0, 1).toFixed(5);
    let defs = '', corpo = '';
    for (let k = 0; k < 3; k++) {
      // altura dos morros em x: a da região, ou a mistura das duas na faixa de passagem
      const alturaEm = x => {
        let i = 0;
        while (i + 1 < faixas.length && x >= faixas[i + 1].x0) i++;
        const m = pais(faixas[i]).morros[k];
        if (i === 0 || x >= faixas[i].x0 + FUSAO) return m;
        const a = pais(faixas[i - 1]).morros[k], t = suave((x - faixas[i].x0) / FUSAO);
        return [a[0] + (m[0] - a[0]) * t, a[1] + (m[1] - a[1]) * t];
      };
      let paradas = `<stop offset="0" stop-color="${pais(faixas[0]).cores[k]}"/>`;
      for (let i = 1; i < faixas.length; i++) {
        paradas += `<stop offset="${off(faixas[i].x0)}" stop-color="${pais(faixas[i - 1]).cores[k]}"/>` +
          `<stop offset="${off(faixas[i].x0 + FUSAO)}" stop-color="${pais(faixas[i]).cores[k]}"/>`;
      }
      paradas += `<stop offset="1" stop-color="${pais(faixas[faixas.length - 1]).cores[k]}"/>`;
      defs += `<linearGradient id="${ids + k}" gradientUnits="userSpaceOnUse" x1="${r1(xa)}" y1="0" x2="${r1(xb)}" y2="0">${paradas}</linearGradient>`;
      corpo += forma(morros(xa, xb, CAMADAS[k].passo, CAMADAS[k].semente, alturaEm), `url(#${ids + k})`) + (detalhes[k] || '');
    }
    return '<defs>' + defs + '</defs>' + corpo;
  }

  /**
   * Detalhes de cada região, de o.ini a o.fim (fora das faixas de passagem). Devolve [longe, meio, chão]: o que vai
   * logo depois dos morros de longe, dos do meio e do chão.
   */
  const DESENHOS = {
    prado(o) {
      const fl = [], tf = [], mo = [];
      for (let x = o.ini, k = 0; x < o.fim; x += 170, k++) {
        fl.push([x + 70 * fixo(k + 3), 746 + 30 * fixo(k + 4), ['#FF8FC2', '#FFFFFF', '#FF7A6B', '#FFFFFF'][k % 4]]);
        if (k % 2) fl.push([x + 30 + 60 * fixo(k + 5), 848 + 44 * fixo(k + 6), ['#FFFFFF', '#FF8FC2', '#FFC93C'][k % 3]]);
        tf.push([x + 60 * fixo(k + 8), 874 + 26 * fixo(k + 9)]);
      }
      for (let x = o.ini + 60, k = 0; x < o.fim - 100; x += 350, k++) mo.push([x + 80 * fixo(k + 32), 724, 0.7 + 0.4 * fixo(k + 33)]);
      // ipês-amarelos só no começo da trilha, longe das estações (copa amarela atrás de estação cinza pareceria brilho)
      const ip = o.xEstacao1 ? [[o.xEstacao1 - 520, 726, 0.95], [o.xEstacao1 - 900, 726, 0.8], [o.xEstacao1 - 1300, 726, 0.9]] : [];
      return [
        moitas(mo, '#88D070') + arvores(ip, '#FFD23F', '#8A5A34'),
        flores(fl.filter(f => f[1] < 800)),
        flores(fl.filter(f => f[1] >= 800)) + tufos(tf, '#6DB956'),
      ];
    },
    lagoa(o) {
      const xs = o.ini + 100, xe = o.fim - 30;                // o lago
      const mo = [], fl = [], tf = [];
      for (let x = o.ini, k = 0; x < o.fim - 100; x += 330, k++) mo.push([x + 90 * fixo(k + 50), 712, 0.6 + 0.35 * fixo(k + 51)]);
      for (let x = o.ini, k = 0; x < o.fim; x += 210, k++) {
        tf.push([x + 60 * fixo(k + 52), 874 + 24 * fixo(k + 53)]);
        if (k % 3 === 0) fl.push([x + 50 * fixo(k + 54), 852 + 38 * fixo(k + 55), k % 2 ? '#FFFFFF' : '#FF8FC2']);
      }
      let brilho = '', folhas = '', vinco = '', hastes = '', taboas = '';
      for (let x = xs + 150, k = 0; x < xe - 200; x += 240, k++) {
        brilho += `M${r1(x)} ${r1(730 + 46 * fixo(k + 60))}h${r1(50 + 60 * fixo(k + 61))}`;
        if (k % 2 === 0) {
          const fx = x + 100 * fixo(k + 62), fy = 744 + 30 * fixo(k + 63);
          folhas += elip(fx, fy, 48, 12);
          vinco += `M${r1(fx)} ${r1(fy)}l20 -9`;
        }
      }
      const grupos = [xs + 24, xe - 76];
      for (let x = xs + 760; x < xe - 600; x += 1150) grupos.push(x);
      grupos.forEach((gx, i) => {
        for (let j = 0; j < 4; j++) {
          const hx = gx + j * 17, topo = 640 + 44 * fixo(i * 7 + j + 70);
          hastes += `M${r1(hx)} 808V${r1(topo)}`;
          taboas += elip(hx, topo + 18, 8, 22);
        }
      });
      const agua = `M${xs} 812C${xs} 728 ${xs + 40} 702 ${xs + 150} 702L${xe - 150} 702C${xe - 40} 702 ${xe} 728 ${xe} 812Z`;
      return [
        moitas(mo, '#7FC86A'),
        forma(agua, '#5EC8E8') + traco(brilho, '#E7FAFF', 8, ' opacity=".85"') +
          forma(folhas, '#5DBB4C') + traco(vinco, '#3E9A30', 4) + traco(hastes, '#4E9E33', 6) + forma(taboas, '#8A5A34'),
        flores(fl) + tufos(tf, '#6DB956'),
      ];
    },
    floresta(o) {
      const av = [], mo = [], tf = [], co = [];
      for (let x = o.ini, k = 0; x < o.fim - 40; x += 210, k++) av.push([x + 50 * fixo(k + 80), 738, 0.7 + 0.42 * fixo(k + 81)]);
      for (let x = o.ini + 100, k = 0; x < o.fim - 100; x += 470, k++) mo.push([x + 120 * fixo(k + 82), 820, 0.55 + 0.3 * fixo(k + 83)]);
      for (let x = o.ini, k = 0; x < o.fim; x += 200, k++) {
        tf.push([x + 70 * fixo(k + 84), 876 + 22 * fixo(k + 85)]);
        if (k % 2 === 0) co.push([x + 40 + 60 * fixo(k + 86), 862 + 28 * fixo(k + 87), k % 4 === 2]);
      }
      return [
        arvores(av, '#4FA65A', '#7A5230'),
        moitas(mo, '#3E9A4A'),
        cogumelos(co) + tufos(tf, '#5AA846') + (o.xFim ? bandeira(o.xFim) : ''),
      ];
    },
  };

  /** Nuvens (camada do fundo, que anda mais devagar que a trilha). */
  function desenhoLonge(xa, xb) {
    let d = '';
    for (let x = xa, k = 0; x < xb; x += 460, k++) {
      const e = 0.55 + 0.5 * fixo(k + 90), y = 92 + 196 * fixo(k + 91), cx = x + 200 * fixo(k + 92);
      d += elip(cx, y, 70 * e, 38 * e) + elip(cx + 55 * e, y - 20 * e, 55 * e, 42 * e) + elip(cx + 110 * e, y + 4 * e, 60 * e, 34 * e) +
        elip(cx + 52 * e, y + 16 * e, 92 * e, 20 * e);
    }
    return forma(d, '#FFFFFF', ' opacity=".92"');
  }
  /** O sol fica parado no céu (bem longe): não passa por trás dos botões quando a trilha rola. */
  const SOL = '<svg class="pc-mapa-sol" viewBox="0 0 260 260" aria-hidden="true"><circle cx="130" cy="130" r="118" fill="#FFF4B8" opacity=".5"/>' +
    '<circle cx="130" cy="130" r="68" fill="#FFE27A" stroke="#F5C84C" stroke-width="6"/></svg>';

  const EMBLEMAS = {
    prado: '<svg viewBox="0 0 64 64" aria-hidden="true">' + [0, 72, 144, 216, 288].map(a =>
      `<ellipse cx="32" cy="18" rx="9" ry="13" transform="rotate(${a} 32 32)" fill="#FF8FC2" stroke="#3A2A5A" stroke-width="3.5"/>`).join('') +
      '<circle cx="32" cy="32" r="8" fill="#FFC93C" stroke="#3A2A5A" stroke-width="3.5"/></svg>',
    lagoa: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6 C 26 16 12 30 12 40 A 20 20 0 0 0 52 40 C 52 30 38 16 32 6 Z" fill="#4DA3FF" stroke="#3A2A5A" stroke-width="4" stroke-linejoin="round"/>' +
      '<ellipse cx="24" cy="41" rx="5" ry="8" fill="#fff" opacity=".65"/></svg>',
    floresta: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="27" y="36" width="10" height="22" rx="3" fill="#8A5A34" stroke="#3A2A5A" stroke-width="3.5"/>' +
      '<circle cx="32" cy="26" r="20" fill="#5CC84A" stroke="#3A2A5A" stroke-width="4"/><circle cx="25" cy="19" r="5" fill="#fff" opacity=".3"/></svg>',
  };

  /** Elemento <svg> posicionado no mundo: (x, y, l, a) em px virtuais, com viewBox nas mesmas coordenadas. */
  function svgCaixa(classe, x, y, l, a, conteudo) {
    return U.svg(`<svg class="pc-mapa-svg ${classe}" xmlns="http://www.w3.org/2000/svg" viewBox="${r1(x)} ${r1(y)} ${r1(l)} ${r1(a)}" ` +
      `width="${r1(l)}" height="${r1(a)}" style="left:${r1(x)}px;top:${r1(y)}px" aria-hidden="true">${conteudo}</svg>`);
  }

  /** O desenho da figurinha como imagem (um elemento só e sem conflito de ids entre as figurinhas). */
  function figurinha(id) {
    let s = '';
    try { s = String((PC.figurinhas && PC.figurinhas.desenho && PC.figurinhas.desenho(id)) || '').trim(); } catch (e) { console.error(e); s = ''; }
    if (!/^<svg[\s>]/i.test(s)) return null;
    if (!/^<svg[^>]*\sxmlns=/i.test(s)) s = s.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    if (/xlink:/.test(s) && !/xmlns:xlink=/.test(s)) s = s.replace(/^<svg/i, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  // ---------------------------------------------------------------- a tela
  PC.telas.registrar('mapa', {
    voltarPara: 'abertura',
    criar(raiz, params) {
      estilos();
      params = params || {};
      const fases = PC.fases, total = fases.length;
      // estado da tela (tudo declarado aqui em cima: as funções abaixo usam)
      let destruida = false, saindo = false, portaoAberto = false;
      let abrindo = null;                   // AbortController da abertura animada
      let dica = null, falaSeq = 0, timerOcioso = 0, pipEm = 0, convites = 0;
      let x = 0, modo = '', vel = 0, tween = null, raf = 0, tAnt = 0, arrastando = false;
      let amostras = [], xPress = 0, engolir = false, alvoToque = null, timerFim = 0, xGuardado = null;

      // ------------------------------------------------------------ geometria da trilha
      const P = {};                         // n -> { x, y } (centro da estação no mundo)
      let xc = X1, regAnt = null;
      fases.forEach(f => {
        if (regAnt !== null && f.regiao !== regAnt) xc += VAO - ESPACO;
        P[f.n] = { x: xc, y: Math.round(ondaY(xc)) };
        regAnt = f.regiao;
        xc += ESPACO;
      });
      const regs = PC.regioes.map(r => {
        const ns = fases.filter(f => f.regiao === r.id).map(f => f.n);
        return ns.length ? { r, x0: P[ns[0]].x, x1: P[ns[ns.length - 1]].x } : null;
      }).filter(Boolean);
      regs.forEach((g, i) => { g.portal = i === 0 ? g.x0 - 230 : Math.round((regs[i - 1].x1 + g.x0) / 2); });
      const xIni = P[1].x - 380;            // começo do caminho
      const xFim = P[total].x + 290;        // bandeira de chegada
      const min = P[1].x - FOCO, max = P[total].x - FOCO;
      const centroDe = n => P[n].x - FOCO;

      // ------------------------------------------------------------ estados
      const estados = {};
      let atual = 1, proxima = 1, completo = false;
      function calcular() {
        proxima = PC.dados.proximaEstacao();
        completo = proxima > total;
        atual = 0;
        if (!completo && PC.assinatura.liberada(proxima)) atual = proxima;
        else {
          for (let n = Math.min(proxima, total); n >= 1; n--) {
            if (PC.assinatura.liberada(n) && PC.dados.disponivel(n)) { atual = n; break; }
          }
        }
        if (!atual) atual = 1;
        let figs = null;                     // figurinhas ganhas: o bichinho só aparece ao lado de quem ganhou
        try { figs = PC.dados.figurinhas(); } catch (e) { figs = null; }
        fases.forEach(f => {
          const n = f.n, feita = PC.dados.estacaoConcluida(n);
          let tipo = 'aberta';
          if (!PC.assinatura.liberada(n)) tipo = 'fechada';
          else if (!feita && n !== atual && !PC.dados.disponivel(n)) tipo = 'bloqueada';
          estados[n] = { feita, tipo, atual: n === atual, bicho: feita && (!figs || figs.has(f.figurinha)) };
        });
      }
      calcular();

      // ------------------------------------------------------------ elementos
      raiz.appendChild(U.el('div', { class: 'pc-mapa-ceu' }));
      raiz.appendChild(U.svg(SOL));
      const area = U.el('div', { class: 'pc-mapa-area', teste: 'trilha' });      // o chão que rola com o dedo
      const longe = U.el('div', { class: 'pc-mapa-longe' });
      const mundo = U.el('div', { class: 'pc-mapa-mundo' });
      area.append(longe, mundo);
      raiz.appendChild(area);

      const lxa = Math.round((min - 500) * PARALAXE) - 500, lxb = Math.round((max + 500) * PARALAXE) + 2100;
      longe.appendChild(svgCaixa('pc-mapa-nuvens', lxa, 0, lxb - lxa, 420, desenhoLonge(lxa, lxb)));

      // o cenário: cada região começa a aparecer 200 px antes do seu portal (faixa de passagem de FUSAO px);
      // os detalhes de cada região (flores, lago, árvores...) ficam fora das faixas de passagem
      const xaMundo = regs[0].portal - 2200, xbMundo = xFim + 1900;
      const faixas = regs.map((g, i) => ({ id: g.r.id, x0: i === 0 ? -Infinity : g.portal - 200 }));
      const detalhes = ['', '', ''];
      regs.forEach((g, i) => {
        const ultima = i === regs.length - 1;
        const desenho = DESENHOS[g.r.id] || DESENHOS[['prado', 'lagoa', 'floresta'][i % 3]];
        desenho({
          ini: i === 0 ? xaMundo + 80 : faixas[i].x0 + FUSAO + 40,
          fim: ultima ? xbMundo - 60 : faixas[i + 1].x0 - 40,
          xFim: ultima ? xFim : 0,
          xEstacao1: i === 0 ? P[1].x : 0,
        }).forEach((s, k) => { detalhes[k] += s; });
      });
      mundo.appendChild(svgCaixa('pc-mapa-cenario', xaMundo, 250, xbMundo - xaMundo, 1250, paisagemMundo(xaMundo, xbMundo, faixas, detalhes)));

      // portais com o nome de cada região (as placas são guardadas: o balão da Pipoca não pode cobri-las)
      const placas = [];
      regs.forEach(g => {
        const tabua = U.el('div', { class: 'pc-mapa-tabua', html: (EMBLEMAS[g.r.id] || '') }, U.el('b', { text: g.r.nome }));
        mundo.appendChild(U.el('div', { class: 'pc-mapa-portal', style: `left:${g.portal}px;top:248px` },
          U.el('i', { class: 'pc-mapa-poste e' }), U.el('i', { class: 'pc-mapa-poste d' }), tabua));
        placas.push({ x: g.portal, el: tabua });
      });

      // o caminho: borda, chão e as pegadas douradas do trecho já andado
      const dTrilha = (xa, xb) => {
        let d = '';
        for (let x = xa; x < xb; x += 20) d += (d ? 'L' : 'M') + r1(x) + ' ' + r1(ondaY(x));
        return d + (d ? 'L' : 'M') + r1(xb) + ' ' + r1(ondaY(xb));
      };
      const dTodo = dTrilha(xIni, xFim);
      const svgCaminho = svgCaixa('pc-mapa-caminho', xIni - 40, 400, xFim - xIni + 80, 340,
        traco(dTodo, '#D2B47A', 48, ' stroke-linejoin="round"') + traco(dTodo, '#F6EACB', 34, ' stroke-linejoin="round"') +
        '<path class="pc-mapa-pegadas" d="M0 0" fill="none" stroke="#F0B43C" stroke-width="13" stroke-linecap="round" stroke-dasharray="0 30"/>');
      mundo.appendChild(svgCaminho);
      const pegadas = svgCaminho.querySelector('.pc-mapa-pegadas');
      function atualizarCaminho(ate) {
        if (!ate) {
          let ultimaFeita = 0;
          fases.forEach(f => { if (estados[f.n].feita) ultimaFeita = Math.max(ultimaFeita, f.n); });
          ate = Math.max(atual, ultimaFeita);
        }
        const xb = ate >= total && estados[total] && estados[total].feita ? xFim : P[Math.min(ate, total)].x;
        pegadas.setAttribute('d', dTrilha(xIni + 20, xb));
      }

      // estações
      const EL = {}, PULSO = {}, BICHO = {};     // a estação (área de toque), a parte que pulsa e o bichinho
      fases.forEach(f => {
        const p = P[f.n], reg = PC.regioes.find(r => r.id === f.regiao);
        const disco = U.el('div', { class: 'pc-mapa-disco', html: PC.arte.medalhao ? PC.arte.medalhao(f) : PC.arte.icone(f.atividade) });
        const pulso = U.el('div', { class: 'pc-mapa-pulso' }, disco);
        const el = U.el('div', { class: 'pc-mapa-estacao', teste: 'estacao-' + f.n, role: 'button',
          style: `left:${p.x - LADO / 2}px;top:${p.y - LADO / 2}px;--cor:${reg ? reg.cor : '#5CC84A'}` }, pulso);
        el.dataset.n = String(f.n);
        EL[f.n] = el;
        PULSO[f.n] = pulso;
        mundo.appendChild(el);
      });
      function selo(n, tipo) {
        const pulso = PULSO[n];
        let s = pulso.querySelector('.pc-mapa-' + tipo);
        if (!s) { s = U.el('span', { class: 'pc-mapa-selo pc-mapa-' + tipo, html: PC.arte.icone(tipo) }); pulso.appendChild(s); }
        return s;
      }
      function bicho(n, mostrar) {
        let b = BICHO[n];
        if (!b && mostrar) {
          const f = PC.fase(n), uri = figurinha(f.figurinha);
          if (uri) b = U.el('img', { class: 'pc-mapa-bicho', src: uri, alt: '', draggable: 'false' });
          else {
            let html = '';
            try { html = String((PC.figurinhas && PC.figurinhas.desenho && PC.figurinhas.desenho(f.figurinha)) || ''); } catch (e) { html = ''; }
            if (!html) return null;
            b = U.el('div', { class: 'pc-mapa-bicho', html });
          }
          b.style.left = (P[n].x + 80 - 52) + 'px';
          b.style.top = (P[n].y + 112 - 52) + 'px';
          BICHO[n] = b;
          mundo.appendChild(b);
        }
        if (b) b.hidden = !mostrar;
        return b;
      }
      /** Desenha o estado da estação n (e = estado a mostrar; o padrão é o de verdade). */
      function aplicar(n, e) {
        e = e || estados[n];
        const el = EL[n];
        el.classList.toggle('feita', !!e.feita);
        el.classList.toggle('atual', !!e.atual);
        el.classList.toggle('cinza', e.tipo !== 'aberta');
        if (e.feita) selo(n, 'estrela');
        if (e.tipo !== 'aberta') selo(n, 'cadeado');
        if (e.atual && !el.querySelector('.pc-mapa-halo')) el.insertBefore(U.el('i', { class: 'pc-mapa-halo' }), el.firstChild);
        bicho(n, !!(e.feita && e.bicho));
        el.setAttribute('aria-label', 'Estação ' + n + (e.tipo === 'aberta' ? (e.feita ? ', concluída' : '') : ', fechada'));
      }

      // a Pipoca (apresentadora do núcleo) mora na trilha
      const host = PC.ui.pipoca.montar(mundo, { entrar: false });
      host.classList.add('pc-mapa-pip');
      const corpo = host.querySelector('.pipoca-corpo');
      if (corpo) corpo.dataset.teste = 'pipoca';
      function posicionarPipoca(n) {
        host.style.left = (P[n].x - PIP.l / 2) + 'px';
        host.style.top = (P[n].y - 75 - PIP.a + 22) + 'px';
        pipEm = n;
      }

      // botões
      const topo = U.el('div', { class: 'pc-mapa-topo' });
      const bInicio = PC.ui.botaoIcone('casa', 'Início', () => sair('abertura'));
      bInicio.classList.add('pc-mapa-btn', 'pc-mapa-inicio'); bInicio.dataset.teste = 'inicio';
      const bLivre = PC.ui.botaoIcone('livre', 'Brincar livre', () => sair('livre'));
      bLivre.classList.add('pc-mapa-btn', 'pc-mapa-livre'); bLivre.dataset.teste = 'livre';
      const bAlbum = PC.ui.botaoIcone('album', 'Álbum', () => sair('album'));
      bAlbum.classList.add('pc-mapa-btn', 'pc-mapa-album'); bAlbum.dataset.teste = 'album';
      const bPais = U.el('button', { type: 'button', class: 'pc-mapa-pais', 'aria-label': 'Área dos pais', title: 'Área dos pais', teste: 'pais' },
        U.el('span', { html: PC.arte.icone('cadeado') }));
      PC.aoTocar(bPais, abrirPais);
      topo.append(bInicio, bLivre, bAlbum, bPais);
      raiz.appendChild(topo);

      // ------------------------------------------------------------ rolagem (dedo, inércia e animações)
      function aplicarX(v) {
        x = v;
        mundo.style.transform = 'translate(' + r1(-v) + 'px,0)';
        longe.style.transform = 'translate(' + r1(-v * PARALAXE) + 'px,0)';
      }
      function comecarMovimento() {
        clearTimeout(timerFim);
        mundo.style.willChange = 'transform';
        longe.style.willChange = 'transform';
      }
      function terminouMovimento() {
        clearTimeout(timerFim);
        timerFim = setTimeout(() => {
          if (modo || arrastando || destruida) return;
          mundo.style.willChange = '';
          longe.style.willChange = '';
        }, 220);
        guardarX();
      }
      function guardarX() {
        const v = Math.round(U.limitar(x, min, max));
        if (v === xGuardado) return;
        xGuardado = v;
        PC.dados.extra('mapa-x', v);
      }
      function agendar() { if (!raf) { tAnt = performance.now(); raf = requestAnimationFrame(quadro); } }
      function quadro(t) {
        raf = 0;
        if (destruida) return;
        const dt = U.limitar(t - tAnt, 1, 50);
        tAnt = t;
        if (modo === 'inercia') {
          let nx = x + vel * dt;
          vel *= Math.pow(ATRITO, dt);
          if (nx <= min || nx >= max) { nx = U.limitar(nx, min, max); vel = 0; }
          aplicarX(nx);
          if (Math.abs(vel) < 0.03) modo = '';
        } else if (modo === 'tween' && tween) {
          const k = U.limitar((performance.now() - tween.t0) / tween.dur, 0, 1);
          const e = tween.saida ? 1 - Math.pow(1 - k, 3) : (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
          aplicarX(tween.de + (tween.para - tween.de) * e);
          if (k >= 1) { const r = tween.resolve; tween = null; modo = ''; r(true); }
        } else modo = '';
        if (modo) raf = requestAnimationFrame(quadro); else terminouMovimento();
      }
      function pararMovimento() {
        const havia = !!modo;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        if (tween) { const r = tween.resolve; tween = null; r(false); }
        modo = ''; vel = 0;
        if (havia) terminouMovimento();
      }
      /** Rola até o x pedido. Devolve Promise<boolean> (false se outro movimento interrompeu). */
      function rolarPara(alvo, ms, saida) {
        alvo = U.limitar(alvo, min, max);
        pararMovimento();
        const dist = Math.abs(alvo - x);
        if (dist < 1.5) { aplicarX(alvo); guardarX(); return Promise.resolve(true); }
        const dur = U.duracao(ms != null ? ms : U.limitar(320 + dist * 0.22, 380, 1200));
        return new Promise(resolve => {
          tween = { de: x, para: alvo, t0: performance.now(), dur, saida: !!saida, resolve };
          modo = 'tween';
          comecarMovimento();
          agendar();
        });
      }
      const borracha = d => (1 - 1 / (d * 0.55 / 400 + 1)) * 400;   // resistência além das pontas da trilha
      function soltarDedo(comInercia) {
        if (destruida) return;
        if (x < min || x > max) { rolarPara(x < min ? min : max, 340, true); return; }
        let v = 0;
        if (comInercia && amostras.length >= 2) {
          const u = amostras[amostras.length - 1];
          if (performance.now() - u.t < 90) {
            let a0 = amostras[0];
            for (const a of amostras) { if (u.t - a.t <= 100) { a0 = a; break; } }
            if (u.t - a0.t > 8) v = (u.x - a0.x) / (u.t - a0.t);
          }
        }
        if (Math.abs(v) > 0.12) { vel = U.limitar(v, -VMAX, VMAX); modo = 'inercia'; comecarMovimento(); agendar(); }
        else terminouMovimento();
      }
      const marcar = (el, sim) => { if (el && el.classList.contains('pc-mapa-estacao')) el.classList.toggle('apertado', sim); };

      const desligarArraste = PC.arrastar(area, {
        podeComecar: () => !saindo && !destruida,
        aoPressionar(p, ev) {
          engolir = modo === 'inercia' && Math.abs(vel) > 0.3;     // toque que só para a trilha não abre estação
          pararMovimento();
          interromperAbertura();
          xPress = x;
          amostras = [{ t: performance.now(), x }];
          marcar(alvoToque, false);      // garantia: nenhuma estação fica apertada de um toque anterior
          const alvo = ev && ev.target && ev.target.closest ? ev.target.closest('[data-teste]') : null;
          alvoToque = alvo && alvo !== area && area.contains(alvo) ? alvo : null;
          marcar(alvoToque, true);
        },
        aoDesistir() {
          // o toque acabou sem virar toque nem arraste (o sistema cancelou o dedo, o portão ou outra tela pediu
          // o gesto): a estação não pode ficar com cara de apertada
          marcar(alvoToque, false);
          alvoToque = null;
        },
        aoComecar() {
          arrastando = true;
          marcar(alvoToque, false);
          alvoToque = null;
          comecarMovimento();
        },
        aoMover(p) {
          let nx = xPress - p.dx;
          if (nx < min) nx = min - borracha(min - nx);
          else if (nx > max) nx = max + borracha(nx - max);
          aplicarX(nx);
          const t = performance.now();
          amostras.push({ t, x: nx });
          while (amostras.length > 2 && t - amostras[0].t > 140) amostras.shift();
        },
        aoSoltar() { arrastando = false; soltarDedo(true); },
        aoCancelar() { arrastando = false; soltarDedo(false); },
        aoTocar(p) {
          const alvo = alvoToque;
          marcar(alvoToque, false);
          alvoToque = null;
          if (engolir) { engolir = false; return; }
          tocarEm(p, alvo);
        },
      });

      // ------------------------------------------------------------ toques nas estações
      function tocarEm(p, alvo) {
        if (saindo || destruida) return;
        let n = 0;
        if (alvo && alvo.dataset.n) n = Number(alvo.dataset.n);
        else if (alvo && alvo.dataset.teste === 'pipoca') { tocarPipoca(); return; }
        else {
          // perto de uma estação (dedo pequeno, mira imprecisa) também vale
          const wx = p.x + x, wy = p.y;
          let melhor = 96;
          fases.forEach(f => { const d = Math.hypot(P[f.n].x - wx, P[f.n].y - wy); if (d < melhor) { melhor = d; n = f.n; } });
        }
        if (n) tocarEstacao(n);
      }
      function tocarEstacao(n) {
        const e = estados[n];
        if (!e || saindo || destruida) return;
        if (e.tipo === 'aberta') { entrar(n); return; }
        PC.som.soltar();
        U.animar(PULSO[n], [{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(9px)' },
          { transform: 'translateX(-5px)' }, { transform: 'translateX(0)' }], 380);
        // fechada (assinatura): fala neutra e aponta uma liberada. Nunca abre portão nem mostra oferta.
        apontarAtual(e.tipo === 'fechada' ? FALA_FECHADA : FALA_BLOQUEADA);
      }
      /** Tocar na Pipoca repete a instrução, como no resto do jogo: ela dá um pulinho e mostra a estação atual. */
      function tocarPipoca() {
        if (saindo || destruida) return;
        const c = host.querySelector('.pipoca-corpo');
        if (c) { c.classList.remove('pula'); void c.offsetWidth; c.classList.add('pula'); }
        apontarAtual(FALA_CONVITE);
      }
      function entrar(n) {
        if (saindo) return;
        PC.som.clique();
        U.animar(PULSO[n], [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], 240);
        sair('atividade', { estacao: n });
      }
      function sair(id, dados) {
        if (saindo || destruida) return;
        saindo = true;
        interromperAbertura();
        pararMovimento();
        pararDica();
        guardarX();
        PC.telas.ir(id, dados || {}).then(ok => { if (!ok && !destruida) saindo = false; });
      }
      function abrirPais() {
        if (saindo || destruida || portaoAberto) return;
        portaoAberto = true;
        interromperAbertura();
        pararMovimento();
        pararDica();
        PC.ui.pipoca.calar();
        let pedido;
        try { pedido = Promise.resolve(PC.portao.pedir()); } catch (e) { console.error(e); pedido = Promise.resolve(false); }
        pedido.then(ok => {
          portaoAberto = false;
          if (destruida) return;
          if (ok) sair('pais');
          else armarOcioso();
        }, e => { console.error(e); portaoAberto = false; });
      }

      // ------------------------------------------------------------ a Pipoca aponta a estação atual
      function pararDica() { if (dica) { dica.parar(); dica = null; } }
      /**
       * O balão da Pipoca fica à direita dela; se ali ele cobrir a placa de uma região (estações 10, 20...), passa
       * para a esquerda. Medido depois de o texto entrar (tamanho de layout: a animação do balão não atrapalha).
       */
      function ajustarBalao() {
        const b = host.querySelector('.balao');
        if (!b || b.hidden) return;
        const hx = parseFloat(host.style.left) || 0, hy = parseFloat(host.style.top) || 0;
        const cobre = () => {
          const r = { x: hx + b.offsetLeft, y: hy + b.offsetTop, l: b.offsetWidth, a: b.offsetHeight };
          return placas.reduce((soma, p) => {
            const l = p.el.offsetWidth, a = p.el.offsetHeight, px = p.x - l / 2, py = 248;
            const dx = Math.min(r.x + r.l, px + l) - Math.max(r.x, px), dy = Math.min(r.y + r.a, py + a) - Math.max(r.y, py);
            return soma + (dx > 0 && dy > 0 ? dx * dy : 0);
          }, 0);
        };
        host.classList.remove('pc-mapa-balao-esq');
        const direita = cobre();
        if (!direita) return;
        host.classList.add('pc-mapa-balao-esq');
        if (cobre() >= direita) host.classList.remove('pc-mapa-balao-esq');
      }
      function apontarAtual(texto) {
        if (destruida || saindo) return;
        interromperAbertura();
        rolarPara(U.limitar(centroDe(atual), min, max));
        if (pipEm !== atual) posicionarPipoca(atual);
        pararDica();
        dica = PC.ui.dica({ x: P[atual].x, y: P[atual].y }, null, { raiz: mundo, vezes: 2 });
        PC.ui.pipoca.pose('aponta');
        const meu = ++falaSeq;
        PC.ui.pipoca.dizer(texto).then(() => { if (meu === falaSeq && !destruida) PC.ui.pipoca.pose('aponta'); });
        ajustarBalao();
      }

      // convite quando a criança fica parada (uma vez até o próximo toque, e no máximo MAX_CONVITES por visita)
      function armarOcioso(ms) {
        clearTimeout(timerOcioso);
        if (!destruida && convites < MAX_CONVITES) timerOcioso = setTimeout(convidar, ms || OCIOSO_MS);
      }
      function convidar() {
        if (destruida || saindo || convites >= MAX_CONVITES) return;
        if (portaoAberto || document.hidden || abrindo || PC.ui.pipoca.falando() || PC.arrastar.ativo()) { armarOcioso(4000); return; }
        convites++;
        apontarAtual(FALA_CONVITE);
      }
      const offToque = PC.on('toque', () => armarOcioso());

      // ------------------------------------------------------------ abertura: rola até a atual (e a Pipoca pula)
      // params.animarEstacao (a estação que se abre) e params.concluida vêm do Parabéns; sem eles (a criança saiu do
      // Parabéns pelo voltar), vale a estação concluída pela primeira vez que o núcleo avisou.
      const nova = ultimaNova;
      ultimaNova = 0;
      const pedido = Number(params.animarEstacao) || 0;
      let concl = Number(params.concluida) || (pedido ? pedido - 1 : 0);
      if (!concl && nova) concl = nova;
      const valida = n => n >= 1 && n <= total && estados[n] && estados[n].feita;
      // jogou de novo uma estação que já tinha estrela: nada de estrela "nova" nem de pulo (a estatística da estação
      // conta quantas vezes ela foi concluída; com #progresso=N nos testes ela está vazia e a animação acontece)
      const vezes = n => { try { const e = PC.dados.estatisticas()[n]; return (e && Number(e.vezes)) || 0; } catch (err) { return 0; } };
      const repeticao = concl > 0 && concl !== nova && vezes(concl) > 1;
      const pularDe = !repeticao && valida(concl) && atual === concl + 1 && (!pedido || pedido === atual) ? concl : 0;
      const popDe = !repeticao && !pularDe && valida(concl) ? concl : 0;
      const terminouTrilha = !repeticao && completo && (pedido > total || concl === total);
      const salvo = PC.dados.extra('mapa-x');
      const primeiraVez = !(typeof salvo === 'number' && isFinite(salvo));

      fases.forEach(f => aplicar(f.n));
      if (pularDe) {
        aplicar(pularDe, Object.assign({}, estados[pularDe], { feita: false, atual: false }));
        aplicar(atual, Object.assign({}, estados[atual], { tipo: 'bloqueada', atual: false }));
        posicionarPipoca(pularDe);
        atualizarCaminho(pularDe);
      } else {
        if (popDe) aplicar(popDe, Object.assign({}, estados[popDe], { feita: false }));
        posicionarPipoca(atual);
        atualizarCaminho();
      }
      PC.ui.pipoca.pose(terminouTrilha || pularDe ? 'feliz' : 'aponta');
      aplicarX(primeiraVez ? min : U.limitar(salvo, min, max));
      xGuardado = primeiraVez ? null : Math.round(U.limitar(salvo, min, max));

      function mostrarSelos(n) {
        aplicar(n, Object.assign({}, estados[n], { atual: estados[n].atual && !pularDe }));
        PC.som.bolha();
        const est = EL[n].querySelector('.pc-mapa-estrela'), b = BICHO[n];
        if (est) U.animar(est, [{ transform: 'scale(0)' }, { transform: 'scale(1.3)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' });
        if (b) U.animar(b, [{ transform: 'rotate(-7deg) scale(0)' }, { transform: 'rotate(-7deg) scale(1.18)', offset: 0.6 }, { transform: 'rotate(-7deg) scale(1)' }],
          { duration: 560, delay: 140, easing: 'ease-out', fill: 'backwards' });
      }
      async function destravar(n, sinal) {
        const c = EL[n].querySelector('.pc-mapa-cadeado');
        PC.som.encaixar();
        if (c) await U.animar(c, [{ transform: 'scale(1) rotate(0deg)' }, { transform: 'scale(1.2) rotate(-12deg)', offset: 0.35 }, { transform: 'scale(0) rotate(20deg)' }], 320);
        if (sinal.aborted) throw U.abortado();
        aplicar(n, Object.assign({}, estados[n], { atual: false }));
        U.animar(PULSO[n], [{ transform: 'scale(.85)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], 380);
      }
      function pular(de, para) {
        const a = P[de], b = P[para], dx = a.x - b.x, dy = a.y - b.y, h = 170, q = [];
        posicionarPipoca(para);
        for (let i = 0; i <= 12; i++) {
          const t = i / 12;
          q.push({ transform: `translate(${r1(dx * (1 - t))}px, ${r1(dy * (1 - t) - 4 * h * t * (1 - t))}px)` });
        }
        PC.som.pulo();
        return U.animar(host, q, { duration: 720, easing: 'linear' });
      }
      /** Estado final da abertura (também quando um toque interrompe a animação). */
      function finalizarAbertura() {
        try { host.getAnimations().forEach(a => a.cancel()); } catch (e) { /* navegador antigo */ }
        posicionarPipoca(atual);
        fases.forEach(f => aplicar(f.n));
        atualizarCaminho();
      }
      function interromperAbertura() {
        if (!abrindo) return;
        const ac = abrindo;
        abrindo = null;
        ac.abort();
        finalizarAbertura();
        PC.ui.pipoca.pose('aponta');
      }
      async function abrir() {
        const ac = abrindo = new AbortController(), s = ac.signal;
        const conferir = () => { if (s.aborted) throw U.abortado(); };
        try {
          await U.esperar(300, s);
          if (pularDe) {
            await rolarPara(Math.round((P[pularDe].x + P[atual].x) / 2) - FOCO, 650); conferir();
            mostrarSelos(pularDe);
            await U.esperar(620, s);
            await destravar(atual, s);
            await U.esperar(380, s);
            PC.ui.pipoca.pose('feliz');
            await pular(pularDe, atual); conferir();
            abrindo = null;
            finalizarAbertura();
            // a nova estação: a Pipoca fala e a mãozinha mostra onde tocar
            apontarAtual(FALA_NOVA);
          } else {
            if (popDe) mostrarSelos(popDe);
            await rolarPara(centroDe(atual)); conferir();
            if (terminouTrilha) {
              // a trilha toda feita: confete na bandeira de chegada (a espera ainda faz parte da abertura, então
              // sair do mapa ou tocar nele a interrompe)
              PC.ui.confete({ x: xFim + 80, y: 380, quantidade: 40, raiz: mundo });
              await U.esperar(900, s);
              PC.ui.pipoca.pose('aponta');
            }
            abrindo = null;
            if (primeiraVez && !destruida) { convites++; apontarAtual(FALA_CONVITE); }
          }
        } catch (e) {
          if (!U.ehAbortado(e)) console.error(e);
        } finally {
          if (abrindo === ac) abrindo = null;
        }
        armarOcioso();
      }
      abrir();

      // a assinatura pode chegar depois (o Google Play responde devagar) ou mudar: redesenha sem mensagem nenhuma.
      // Avisos que não mudam nada no mapa (ex.: "carregando" ao voltar do segundo plano) não interrompem a abertura.
      const marcaEstados = () => fases.map(f => estados[f.n].tipo + (estados[f.n].feita ? '+' : '') + (estados[f.n].atual ? '*' : '')).join(',');
      let marca = marcaEstados();
      const offAssinatura = PC.assinatura.aoMudar(() => {
        if (destruida) return;
        const antes = atual;
        calcular();
        const nova = marcaEstados();
        if (nova === marca) return;
        marca = nova;
        interromperAbertura();
        fases.forEach(f => aplicar(f.n));
        atualizarCaminho();
        if (atual !== antes) {
          pararDica();
          PC.ui.pipoca.calar();             // a fala que estava no balão era sobre a estação antiga
          posicionarPipoca(atual);
          PC.ui.pipoca.pose('aponta');
          if (!arrastando && !saindo) rolarPara(centroDe(atual));       // a Pipoca mudou de estação: a trilha vai junto
        }
      });

      // ------------------------------------------------------------ testes (só no navegador)
      // PC.debug.mapa: estado(), rolar(x), centro(n). O passo {"gesto": true} do testador faz o gesto certo do mapa:
      // tocar na estação atual (ou, se ela estiver fora da tela, arrastar a trilha na direção dela).
      let dbg = null, gesto = null, ocupada = null;
      if (!PC.modoApp && PC.debug) {
        dbg = {
          estado: () => ({
            x: Math.round(x), min, max, atual, proxima, completo, pipoca: pipEm, saindo, convites,
            animando: !!(abrindo || modo || arrastando),
            abertura: { pularDe, popDe, terminouTrilha, repeticao },
            estacoes: fases.map(f => f.n + ':' + estados[f.n].tipo + (estados[f.n].feita ? '+feita' : '') + (estados[f.n].atual ? '+atual' : '')),
          }),
          rolar: v => { pararMovimento(); aplicarX(U.limitar(Number(v) || 0, min, max)); guardarX(); return x; },
          centro: n => { const q = PC.palco.paraTela(P[n].x - x, P[n].y); return { x: q.x, y: q.y }; },
        };
        PC.debug.mapa = dbg;
        gesto = () => {
          if (destruida || saindo || portaoAberto || abrindo || modo || arrastando) return null;   // espera a trilha parar
          const sx = P[atual].x - x;
          if (sx >= 200 && sx <= 1400) return { tipo: 'tocar', em: { x: sx, y: P[atual].y } };
          const d = U.limitar(sx - FOCO, -900, 900);
          return { tipo: 'arrastar', de: { x: FOCO + d / 2, y: 770 }, para: { x: FOCO - d / 2, y: 770 } };
        };
        PC.debug.proximoGestoVirtual = gesto;
        // {"esperar": "ocioso"} também espera a abertura animada e a trilha parar de rolar
        ocupada = () => !destruida && !!(abrindo || modo || arrastando);
        PC.debug.telaOcupada = ocupada;
      }

      return {
        destruir() {
          if (destruida) return;
          destruida = true;
          if (abrindo) { abrindo.abort(); abrindo = null; }
          clearTimeout(timerOcioso);
          clearTimeout(timerFim);
          offToque();
          offAssinatura();
          desligarArraste();
          pararMovimento();
          pararDica();
          guardarX();
          if (dbg && PC.debug && PC.debug.mapa === dbg) delete PC.debug.mapa;
          if (gesto && PC.debug && PC.debug.proximoGestoVirtual === gesto) PC.debug.proximoGestoVirtual = null;
          if (ocupada && PC.debug && PC.debug.telaOcupada === ocupada) PC.debug.telaOcupada = null;
        },
        /** Voltar (Android ou Esc): com o portão dos adultos aberto, só fecha o portão; senão vai para a abertura. */
        voltar() {
          if (PC.portao && PC.portao.aberto && PC.portao.aberto()) { PC.portao.fechar(); return true; }
          return false;
        },
      };
    },
  });
})();
