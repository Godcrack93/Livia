/* Pipoca Aprende — tela "livre": a Casa da Pipoca (o Brincar livre novo; PROJETO.md, seção 4, item 6).
   Uma casa de dois andares com quintal, bem maior que a tela (CASA.W × CASA.H, js/casa/base.js). A criança:
     - passeia pela casa arrastando o dedo no vazio (para os lados e para cima e para baixo), com inércia;
     - toca no mapinha (canto de cima) para ir direto a um lugar;
     - tira coisas do baú (embaixo): arrasta a cartinha para cima e solta na casa. Móveis assentam no chão do andar
       onde foram soltos; coisas "soltas" (quadros, enfeites, coisas em cima dos móveis) ficam onde foram soltas;
     - arrasta qualquer coisa da casa para mudar de lugar (perto da borda, a casa passeia junto);
     - guarda: solta a coisa em cima do baú;
     - toca numa coisa: ela pula e a Pipoca diz o nome; toca na Pipoca: ela pula e fala.
   A Pipoca viva (PC.pipoca.criar) mora na casa e também pode ser arrastada.
   A casa fica guardada no aparelho (PC.dados.extra('casa')) do jeito que a criança deixou.
   Nesta primeira etapa o baú tem todos os itens; na próxima, só os que a criança ganhou nas estações (figurinhas).
   data-teste: voltar, mapinha, bau, alca-bau, aba-moveis, aba-brinquedos, aba-enfeites, carta-<id>, item-<id>, pipoca. */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;
  const VERSAO = 1;
  const TELA = { l: 1600, a: 900 };
  const BAU = 176;                   // altura do baú aberto
  const BAU_FECHADO = 30;            // só a alça aparece
  const BORDA_AUTO = 130;            // arrastando uma coisa perto da borda, a casa passeia junto
  const ABAS = [
    { id: 'moveis', icone: 'sofa', cor: '#FF7A6B' },
    { id: 'brinquedos', icone: 'bola', cor: '#2EC4B6' },
    { id: 'enfeites', icone: 'quadroFlor', cor: '#FFC93C' },
    { id: 'bichos', icone: 'bicho-fig20', cor: '#9B7BFF' },
  ];
  const Maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);

  function css() {
    return `
      .tela-livre { background: #BFE8FF; overflow: visible; }
      /* a janela e o baú passam das bordas do palco (1600 × 900) até a beirada da tela do aparelho: em celular mais
         comprido que 16:9 não sobram faixas vazias dos lados (ver margens()) */
      .pc-casa-janela { position: absolute; left: 0; top: 0; width: ${TELA.l}px; height: ${TELA.a}px; overflow: hidden; touch-action: none; }
      .pc-casa-mundo { position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform; }
      /* desempenho: o cenário (milhares de formas paradas) vira imagens prontas, em pedaços (ver "pedaços do cenário"),
         numa camada só dele; a Pipoca e a coisa arrastada têm camada própria: o que se mexe nunca redesenha o cenário */
      .pc-casa-cenario { position: absolute; left: 0; top: 0; pointer-events: none; will-change: transform; }
      .pc-casa-cenario img { position: absolute; display: block; user-select: none; -webkit-user-drag: none; }
      .pc-casa-itens { position: absolute; left: 0; top: 0; }
      .pc-casa-item { position: absolute; display: block; overflow: visible; pointer-events: none; transform-origin: 50% 100%; }
      .pc-casa-item * { pointer-events: visiblePainted; }
      .pc-casa-item.pegado, .pc-casa-item.junto { will-change: transform; z-index: 5; }
      .pc-casa-fixos, .pc-casa-ceu { position: absolute; left: 0; top: 0; pointer-events: none; }
      .pc-casa-fixos > *, .pc-casa-ceu > * { position: absolute; }
      .pc-casa-vidro-noite { background: #1A2154; border-radius: 6px; opacity: 0; transition: opacity 1.4s; }
      .pc-casa-mundo.noite .pc-casa-vidro-noite { opacity: .86; }
      .pc-casa-cortina.cai { transform-origin: 50% 0; animation: pcCasaCortina .4s cubic-bezier(.3, 1.3, .5, 1); }
      @keyframes pcCasaCortina { from { transform: scaleY(.25); opacity: .3; } }
      .pc-casa-luz { position: absolute; left: 0; transform-origin: 0 0; pointer-events: none; will-change: transform; z-index: 6; }
      .pc-casa-ceu { z-index: 7; }
      .pc-casa-astro { transition: transform 1.8s cubic-bezier(.5, 0, .3, 1), opacity 1.4s; will-change: transform, opacity; }
      .pc-casa-astro.fora { opacity: 0; transform: translateY(380px) scale(.7); }
      .pc-casa-astro > svg { position: absolute; left: 0; top: 0; }
      .pc-casa-raios { animation: casaGira 40s linear infinite; will-change: transform; }
      .pc-casa-estrela { transition: opacity 1.6s; }
      .pc-casa-ceu.dia .pc-casa-estrela { opacity: 0; }
      .pc-casa-estrela.brilha { animation: casaPisca 1.6s steps(2, jump-none) infinite; }
      .pc-casa-ceu.dia .pc-casa-estrela.brilha { animation: none; }
      .pc-casa-astro-btn { position: absolute; right: 30px; top: 14px; width: 70px; height: 70px; z-index: 2; cursor: pointer; }
      .pc-casa-astro-btn svg { width: 100%; height: 100%; }
      .pc-casa-astro-btn.apertado { transform: scale(.9); }
      .pc-casa-mapinha .ceu { transition: fill 1.4s; }
      .pc-casa-mapinha.noite .ceu { fill: #2B3172; }
      .pc-casa-item.pula { animation: pcCasaPula .45s cubic-bezier(.3, 1.6, .5, 1); }
      @keyframes pcCasaPula { 40% { transform: translateY(-26px) scale(1.04, .96); } 70% { transform: translateY(0) scale(.97, 1.03); } }
      .pc-casa-item.assenta { animation: pcCasaAssenta .32s ease-out; }
      @keyframes pcCasaAssenta { 0% { transform: scale(1.04, .94); } 60% { transform: scale(.98, 1.03); } }
      .pc-casa-item.anima { will-change: transform; }
      .pc-casa-item.treme { animation: pcCasaTreme .5s linear; }
      @keyframes pcCasaTreme { 0%, 100% { transform: none; } 20% { transform: translateX(-5px) rotate(-1.5deg); } 40% { transform: translateX(5px) rotate(1.5deg); }
        60% { transform: translateX(-4px) rotate(-1deg); } 80% { transform: translateX(4px) rotate(1deg); } }
      .pc-casa-item.balanca { animation: pcCasaBalanca 1.2s ease-in-out; transform-origin: 50% 0; }
      @keyframes pcCasaBalanca { 25% { transform: rotate(6deg); } 50% { transform: rotate(-5deg); } 75% { transform: rotate(3deg); } }
      /* peças que se mexem dentro dos desenhos (as ações usam estas classes nos seus <g>) */
      .casa-gira { transform-box: fill-box; transform-origin: center; animation: casaGira .45s linear infinite; }
      .casa-gira-lento { transform-box: fill-box; transform-origin: center; animation: casaGira 2.4s linear infinite; }
      @keyframes casaGira { to { transform: rotate(360deg); } }
      .casa-pisca { animation: casaPisca 1s steps(2, jump-none) infinite; }
      .casa-pisca2 { animation: casaPisca 1s steps(2, jump-none) infinite reverse; }
      @keyframes casaPisca { 0% { opacity: 1; } 100% { opacity: .15; } }
      .casa-brilha { animation: casaBrilha 2.2s ease-in-out infinite; }
      @keyframes casaBrilha { 50% { opacity: .65; } }
      .casa-sobe { animation: casaSobe 2.2s ease-in infinite; }
      @keyframes casaSobe { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(-90px); opacity: 0; } }
      .casa-nada { animation: casaNada 6s ease-in-out infinite alternate; }
      @keyframes casaNada { 0% { transform: translateX(-20px); } 100% { transform: translateX(22px); } }
      .casa-treme { transform-box: fill-box; transform-origin: center; animation: casaTremeP .12s linear infinite; }
      @keyframes casaTremeP { 50% { transform: translate(1.5px, -1px) rotate(1deg); } }
      .casa-balanca { transform-box: fill-box; transform-origin: 50% 0; animation: casaBalanca 1.6s ease-in-out infinite alternate; }
      @keyframes casaBalanca { from { transform: rotate(-7deg); } to { transform: rotate(7deg); } }
      .casa-pulsa { transform-box: fill-box; transform-origin: center; animation: casaPulsa 1s ease-in-out infinite; }
      @keyframes casaPulsa { 50% { transform: scale(1.12); } }

      /* fios e plugues dos aparelhos elétricos; efeitos (partículas) */
      .pc-casa-fios, .pc-casa-plugues, .pc-casa-fx { position: absolute; left: 0; top: 0; }
      .pc-casa-fios { pointer-events: none; }
      .pc-casa-fio { position: absolute; overflow: visible; pointer-events: none; }
      .pc-casa-plugue { position: absolute; width: 88px; height: 88px; margin: -44px 0 0 -44px; cursor: pointer; }
      .pc-casa-plugue svg { width: 100%; height: 100%; display: block; overflow: visible; pointer-events: none; }
      .pc-casa-plugue.pegado { will-change: transform; z-index: 5; }
      .pc-casa-plugue.chama { animation: pcCasaChama .5s ease-in-out 3; }
      @keyframes pcCasaChama { 50% { transform: scale(1.35) rotate(-12deg); } }
      .pc-casa-fx { pointer-events: none; z-index: 8; }
      .pc-casa-fx > * { position: absolute; pointer-events: none; will-change: transform, opacity; }
      .pc-casa-anel { width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%; border: 10px solid #FFE27A;
        box-shadow: 0 0 0 5px var(--tinta); animation: pcCasaAnel .7s ease-out 3; }
      @keyframes pcCasaAnel { from { transform: scale(.4); opacity: 1; } to { transform: scale(1.3); opacity: 0; } }

      /* o botão de modo: brincar (mãozinha) ou ouvir os nomes (balão) */
      .pc-casa-modo { position: absolute; left: 140px; top: 12px; width: 120px; height: 120px; display: grid; place-items: center;
        cursor: pointer; touch-action: manipulation; }
      .pc-casa-modo > span { width: 96px; height: 96px; border-radius: 50%; background: #fff; border: 5px solid var(--tinta);
        box-shadow: 0 6px 0 var(--tinta); display: grid; place-items: center; transition: transform .12s; }
      .pc-casa-modo.falar > span { background: #FFE27A; }
      .pc-casa-modo svg { width: 64px; height: 64px; display: block; }
      .pc-casa-modo.troca > span { animation: pcCasaModo .4s cubic-bezier(.3, 1.6, .5, 1); }
      @keyframes pcCasaModo { 40% { transform: scale(1.2) rotate(-8deg); } }
      .pc-casa-pipoca.no-ar [data-p="sombra"] { opacity: 0; }
      .pc-casa-sombra { position: absolute; width: 230px; height: 26px; margin: -13px 0 0 -115px; border-radius: 50%;
        background: rgba(58, 42, 90, .2); pointer-events: none; will-change: transform; }
      .pc-casa-pipoca { position: absolute; width: 300px; height: 324px; cursor: pointer; z-index: 3; will-change: transform; }
      .pc-casa-pipoca svg { width: 100%; height: 100%; display: block; overflow: visible; }

      .pc-casa-hud .botao-icone { position: absolute; left: 24px; top: 12px; }
      .pc-casa-mapinha { position: absolute; right: 20px; top: 16px; width: 360px; height: 92px; border-radius: 22px; background: #fff;
        border: 5px solid var(--tinta); box-shadow: 0 5px 0 var(--tinta); overflow: hidden; touch-action: none; cursor: pointer; }
      .pc-casa-mapinha svg { position: absolute; left: 8px; top: 8px; width: 334px; height: 66px; }

      .pc-casa-bau { position: absolute; left: 0; width: ${TELA.l}px; height: ${BAU + 40}px; top: ${TELA.a - BAU}px; z-index: 40;
        transition: top .28s cubic-bezier(.3, 1.3, .5, 1); touch-action: none; }
            .pc-casa-bau .tampa { position: absolute; inset: 0; background: #8A5A34; border-top: 7px solid var(--tinta);
        box-shadow: inset 0 14px 0 #A9703F; }
      .pc-casa-alca { position: absolute; left: calc(50% - 70px); top: -46px; width: 140px; height: 54px; border-radius: 22px 22px 0 0; background: #8A5A34;
        border: 6px solid var(--tinta); border-bottom: none; display: grid; place-items: center; cursor: pointer; }
      .pc-casa-alca svg { width: 46px; height: 30px; transition: transform .25s; }
      .pc-casa-bau.fechado .pc-casa-alca svg { transform: rotate(180deg); }
      .pc-casa-abas { position: absolute; left: 18px; top: 22px; display: flex; flex-direction: column; gap: 6px; }
      .pc-casa-aba { width: 150px; height: 33px; border-radius: 14px; background: #FFF4E6; border: 4px solid var(--tinta); cursor: pointer;
        display: grid; place-items: center; }
      .pc-casa-aba svg { height: 28px; width: 120px; display: block; }
      .pc-casa-aba.atual { background: var(--cor); transform: translateX(8px); }
      .pc-casa-cartas-vao { position: absolute; left: 196px; right: 12px; top: 18px; height: 150px; overflow: hidden; }
      .pc-casa-cartas { position: absolute; left: 0; top: 0; display: flex; gap: 16px; padding: 4px 6px; will-change: transform; }
      .pc-casa-carta { flex: 0 0 auto; width: 140px; height: 140px; border-radius: 24px; background: #FFFAF0; border: 5px solid var(--tinta);
        box-shadow: 0 5px 0 var(--tinta); display: grid; place-items: center; }
      .pc-casa-carta svg { width: 118px; height: 118px; display: block; overflow: visible; pointer-events: none; }
      .pc-casa-carta.vazia { background: transparent; border: 5px dashed #C9B08A; box-shadow: none; }
      .pc-casa-carta.saiu { opacity: .35; }
    `;
  }

  PC.telas.registrar('livre', {
    voltarPara: 'mapa',
    criar(raiz) {
      U.estilo('casa', css());
      const desligar = [];
      let vivo = true;
      const C = window.CASA;

      // ------------------------------------------------------------ estado guardado
      const guardado = (() => { const g = PC.dados.extra('casa'); return g && g.v === VERSAO && Array.isArray(g.itens) ? g : null; })();
      let itens = (guardado ? guardado.itens : C.inicial()).filter(i => C.ITENS[i.id])
        .map(i => ({ id: i.id, x: +i.x, y: +i.y, k: i.k || 1, rot: i.rot || 0, e: i.e && typeof i.e === 'object' ? i.e : {}, t: Number.isInteger(i.t) ? i.t : null }));
      // a geladeira ficou mais larga (nov/2026): pia, fogão e ímãs que ainda estão no lugar de fábrica antigo vão para o novo
      const MUDOU = { piaCozinha: [4690, 4800], fogao: [4885, 4995] }, IMAS = { imaA: [4470, 4448], imaB: [4512, 4510], imaC: [4476, 4466], imaD: [4522, 4540] };
      itens.forEach(i => { const m = MUDOU[i.id] || IMAS[i.id]; if (m && Math.round(i.x) === m[0]) i.x = m[1]; });
      // quem está apoiado em quem (o pé a até 12 px de um tampo)
      itens.forEach(i => {
        i.sobre = null;
        if (C.ITENS[i.id].gruda) { i.sobre = grudaEm(i); return; }
        if (C.ITENS[i.id].tipo !== 'apoia') return;
        for (const g of itens) {
          if (g === i || !C.APOIOS[g.id]) continue;
          if (C.APOIOS[g.id].some(([x0, x1, y]) => i.x >= g.x + x0 * g.k - 4 && i.x <= g.x + x1 * g.k + 4 && Math.abs(g.y + y * g.k - i.y) <= 12)) { i.sobre = g; break; }
        }
      });
      // modo do toque: 'brincar' (as coisas funcionam) ou 'falar' (a Pipoca diz o nome). A criança escolhe no botão.
      let modo = guardado && guardado.modo === 'falar' ? 'falar' : 'brincar';
      // luz: dia ou noite, as janelas fechadas de cada cômodo e as luzes do teto acesas
      const luzG = (guardado && guardado.luz) || {};
      let noite = !!luzG.noite;
      const fechadas = Object.assign({}, luzG.fechadas), acesas = Object.assign({}, luzG.acesas);
      const pip = Object.assign({ x: 2150, y: C.BAIXO.piso }, guardado && guardado.pipoca);
      let bauAberto = guardado ? guardado.bau !== false : true;
      const camIni = guardado && guardado.cam ? guardado.cam : { x: pip.x - 760, y: C.BAIXO.piso + 70 - (TELA.a - BAU) };
      let timerSalvar = 0;
      const paraGuardar = () => ({ v: VERSAO, modo, luz: { noite, fechadas, acesas },
        itens: itens.map(i => ({ id: i.id, x: Math.round(i.x), y: Math.round(i.y), k: i.k, rot: i.rot, e: i.e, t: i.t })),
        pipoca: { x: Math.round(pip.x), y: Math.round(pip.y) }, cam: { x: Math.round(cam.x), y: Math.round(cam.y) }, bau: bauAberto });
      function salvar() {
        clearTimeout(timerSalvar);
        timerSalvar = setTimeout(() => { timerSalvar = 0; PC.dados.extra('casa', paraGuardar()); }, 250);
      }

      // ------------------------------------------------------------ medir desenhos (caixa de cada item, guardada)
      const NS = 'http://www.w3.org/2000/svg';
      const medidor = document.createElementNS(NS, 'svg');
      medidor.setAttribute('style', 'position:absolute;left:-99999px;top:0;width:10px;height:10px;visibility:hidden');
      raiz.appendChild(medidor);
      const caixas = new Map();
      /** A caixa de um desenho (texto SVG) na escala k e giro rot, guardada. */
      function caixaArte(arte, k = 1, rot = 0) {
        const chave = k + '|' + rot + '|' + arte;
        let b = caixas.get(chave);
        if (!b) {
          medidor.innerHTML = C.em(0, 0, k, arte, rot);
          let r = { x: -50, y: -100, width: 100, height: 100 };
          try { const m = medidor.firstChild.getBBox(); if (m.width && m.height) r = { x: m.x, y: m.y, width: m.width, height: m.height }; } catch (e) { /* sem medida */ }
          medidor.innerHTML = '';                     // nada fica escondido ali (nem animação rodando à toa)
          b = { x: r.x - 6, y: r.y - 6, l: r.width + 12, a: r.height + 12 };
          caixas.set(chave, b);
        }
        return b;
      }
      const caixa = (id, k = 1, rot = 0) => caixaArte(C.desenho(id), k, rot);
      // ------------------------------------------------------------ ações (o que cada coisa faz no modo brincar)
      function acaoDe(id) { return (C.acoes && C.acoes[id]) || (C.partes[C.ITENS[id] && C.ITENS[id].parte] || {}).acoes && C.partes[C.ITENS[id].parte].acoes[id] || null; }
      const ligadoNaTomada = i => i.t != null;
      /** O desenho do item no estado dele (a ação pode trocar o desenho: porta aberta, luz acesa...). */
      function arteDe(i) {
        const a = acaoDe(i.id);
        if (a && a.desenho) { try { return a.desenho(i.e, ligadoNaTomada(i)); } catch (e) { console.error(i.id, e); } }
        return C.desenho(i.id);
      }
      /** O que vai por cima do desenho enquanto o estado pede (pás girando, tela da TV, luz). */
      function sobreDe(i) {
        const a = acaoDe(i.id);
        if (!a || !a.sobre) return '';
        try { return a.sobre(i.e, ligadoNaTomada(i)) || ''; } catch (e) { console.error(i.id, e); return ''; }
      }
      const caixaDe = i => caixaArte(arteDe(i), i.k, i.rot);

      // a luz é redesenhada no próximo quadro quando algo muda (uma vez só, por mais que mude)
      var pedidoLuz = 0;
      function pedirLuz() { if (!pedidoLuz) pedidoLuz = requestAnimationFrame(() => pintarLuz()); }

      // ------------------------------------------------------------ a janela e o mundo
      const janela = U.el('div', { class: 'pc-casa-janela' });
      const mundo = U.el('div', { class: 'pc-casa-mundo', style: `width:${C.W}px;height:${C.H}px` });
      const cenario = U.el('div', { class: 'pc-casa-cenario' });
      const camada = U.el('div', { class: 'pc-casa-itens' });
      const fiosEl = U.el('div', { class: 'pc-casa-fios' });
      const pluguesEl = U.el('div', { class: 'pc-casa-plugues' });
      const fxEl = U.el('div', { class: 'pc-casa-fx' });
      const fixosEl = U.el('div', { class: 'pc-casa-fixos' });    // janelas fechadas, vidro de noite, luzes do teto
      const ceuEl = U.el('div', { class: 'pc-casa-ceu' });          // sol, lua e estrelas (por cima do escuro)
      const LUZ_ESC = 8, LUZ_L = Math.ceil(C.W / LUZ_ESC), LUZ_A = Math.ceil((C.H - C.TOPO) / LUZ_ESC);
      const luzEl = document.createElement('canvas');               // o escuro e as luzes, pequenininho e ampliado
      luzEl.className = 'pc-casa-luz'; luzEl.width = LUZ_L; luzEl.height = LUZ_A;
      luzEl.style.cssText = `top:${C.TOPO}px;width:${LUZ_L}px;height:${LUZ_A}px;transform:scale(${LUZ_ESC});display:none`;
      mundo.append(cenario, fixosEl, fiosEl, camada, pluguesEl, luzEl, ceuEl, fxEl);
      janela.appendChild(mundo);
      raiz.appendChild(janela);

      // ------------------------------------------------------------ pedaços do cenário (imagens prontas)
      // O cenário tem milhares de formas. Desenhado direto na tela, o navegador refaz esse desenho a cada pedaço novo que
      // aparece no passeio (pesado em aparelho fraco). Por isso ele vira imagens: cada pedaço (PW × PH do mundo) é um SVG
      // separado, só com as camadas que passam por ali (CASA.cenarioEm), mostrado num <img>. O navegador desenha cada
      // imagem uma vez e depois só move. Primeiro vêm os pedaços da tela; depois os outros, um de cada vez, em segundo
      // plano (preparar um pedaço ocupa o processador: em aparelho fraco, todos juntos travariam a entrada). Medido com a
      // CPU 4× mais lenta: passeio de 21–29 quadros/s (SVG direto na tela) para 42–52 (imagens), parada a 60.
      const Y0 = C.TOPO, PW = 1350, PH = (C.H - Y0) / 3, NX = Math.ceil(C.W / PW), NY = 3;   // o mundo começa em C.TOPO (o telhado alto)
      const pedacos = {};          // 'ix,iy' -> { img, url }
      function pedacoSvg(ix, iy) {
        const x = ix * PW, y = Y0 + iy * PH;
        return `<svg xmlns="${NS}" viewBox="${x} ${y} ${PW} ${PH}" width="${PW}" height="${PH}">${C.cenarioEm(x - 10, x + PW + 10)}</svg>`;
      }
      function carregarPedaco(ix, iy) {
        const chave = ix + ',' + iy;
        if (pedacos[chave]) return;
        const url = URL.createObjectURL(new Blob([pedacoSvg(ix, iy)], { type: 'image/svg+xml' }));
        const img = new Image(PW, PH);
        img.alt = '';
        img.decoding = 'async';
        img.style.cssText = `left:${ix * PW}px;top:${Y0 + iy * PH}px;width:${PW + 1}px;height:${PH + 1}px`;
        pedacos[chave] = { img, url };
        pedacos[chave].pronto = new Promise(ok => {
          const pronto = () => { if (vivo && pedacos[chave] && pedacos[chave].img === img) cenario.appendChild(img); ok(); };
          img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(pronto);
          img.onerror = pronto;
        });
        img.src = url;
        return pedacos[chave].pronto;
      }
      function soltarPedaco(chave) {
        const p = pedacos[chave];
        if (!p) return;
        p.img.remove(); p.img.removeAttribute('src'); URL.revokeObjectURL(p.url);
        delete pedacos[chave];
      }
      /** Carrega os pedaços que a tela mostra (e uma margem), os mais perto do meio primeiro. */
      function pedacosPerto() {
        const mx = 700, my = 500;
        const ix0 = Math.max(0, Math.floor((cam.x - M.x - mx) / PW)), ix1 = Math.min(NX - 1, Math.floor((cam.x + TELA.l + M.x + mx) / PW));
        const iy0 = Math.max(0, Math.floor((cam.y - Y0 - my) / PH)), iy1 = Math.min(NY - 1, Math.floor((cam.y - Y0 + TELA.a + my) / PH));
        const querer = [];
        for (let iy = iy0; iy <= iy1; iy++) for (let ix = ix0; ix <= ix1; ix++) querer.push([ix, iy]);
        // os da tela primeiro
        const cx = cam.x + TELA.l / 2, cy = cam.y + TELA.a / 2;
        querer.sort((a, b) => Math.hypot((a[0] + .5) * PW - cx, Y0 + (a[1] + .5) * PH - cy) - Math.hypot((b[0] + .5) * PW - cx, Y0 + (b[1] + .5) * PH - cy));
        return Promise.all(querer.map(([ix, iy]) => carregarPedaco(ix, iy)));
      }
      /** Os pedaços que faltam, um de cada vez, com uma folga entre eles (a criança já pode brincar). */
      async function carregarRestante() {
        const ordem = [];
        for (let iy = 0; iy < NY; iy++) for (let ix = 0; ix < NX; ix++) ordem.push([ix, iy]);
        const cx = cam.x + TELA.l / 2;
        ordem.sort((a, b) => Math.abs((a[0] + .5) * PW - cx) - Math.abs((b[0] + .5) * PW - cx));
        for (const [ix, iy] of ordem) {
          if (!vivo) return;
          if (pedacos[ix + ',' + iy]) continue;
          await carregarPedaco(ix, iy);
          await new Promise(ok => setTimeout(ok, 60));
        }
        if (PC.debug) PC.debug.casaPronta = true;
      }
      let timerPedacos = 0;
      const pedacosLogo = () => { if (!timerPedacos) timerPedacos = setTimeout(() => { timerPedacos = 0; if (vivo) pedacosPerto(); }, 120); };

      // cada item é um <svg> pequeno no lugar dele (só o desenho recebe toques: o vazio em volta não)
      function elItem(i) {
        const arte = arteDe(i), b = caixaArte(arte, i.k, i.rot), sobre = sobreDe(i);
        const el = U.svg(`<svg class="pc-casa-item${sobre ? ' anima' : ''}" viewBox="${b.x} ${b.y} ${b.l} ${b.a}" width="${b.l}" height="${b.a}" xmlns="${NS}">` +
          `<g class="casa-leva" style="transform-origin:${-b.x}px ${-b.y}px">${C.em(0, 0, i.k, arte + (sobre ? `<g class="casa-sobre">${sobre}</g>` : ''), i.rot)}</g><g class="casa-efeitos"/></svg>`);
        el.dataset.teste = 'item-' + i.id;
        el.__item = i;
        i.el = el;
        posicionar(i);
        return el;
      }
      function posicionar(i) {
        const b = caixaDe(i);
        i.el.style.left = (i.x + b.x) + 'px';
        i.el.style.top = (i.y + b.y) + 'px';
        if (i.fioEl) desenharFio(i);
        if (C.LUZES && C.LUZES[i.id]) pedirLuz();
      }
      /** Redesenha um item no mesmo lugar da pilha (o estado mudou). */
      function redesenharItem(i) {
        const velho = i.el, novo = elItem(i);
        if (velho && velho.parentNode) velho.parentNode.replaceChild(novo, velho);
        aplicarPortas();
        pedirLuz();
      }
      /**
       * Portas que escondem o que está grudado nelas (acao.portaEsconde(estado) -> [x0, y0, x1, y1] no desenho, ou null):
       * com a geladeira aberta vemos o lado de dentro, então os ímãs da porta somem. O lugar deles continua o mesmo.
       */
      function aplicarPortas() {
        itens.forEach(o => { if (o.escondido && o.el) o.el.style.visibility = ''; o.escondido = false; });
        itens.forEach(gl => {
          const a = acaoDe(gl.id);
          if (!a || !a.portaEsconde || !gl.el) return;
          let ar = null;
          try { ar = a.portaEsconde(gl.e); } catch (e) { console.error(e); }
          if (!ar) return;
          emCima(gl).forEach(o => {
            if (!o.el || !C.ITENS[o.id].gruda) return;
            const lx = (o.x - gl.x) / gl.k, ly = (o.y - gl.y) / gl.k;
            if (lx < ar[0] || lx > ar[2] || ly < ar[1] || ly > ar[3]) return;
            o.el.style.visibility = 'hidden'; o.escondido = true;
          });
        });
      }
      function redesenharItens() {
        itens = ordemDeApoio(itens);
        camada.innerHTML = '';
        C.ordenar(itens).forEach(i => camada.appendChild(elItem(i)));
        itens = C.ordenar(itens);
        camada.appendChild(pipEl);
        itens.forEach(i => { if (acaoDe(i.id) && acaoDe(i.id).eletrico) desenharFio(i); });
        aplicarPortas();
      }

      // ------------------------------------------------------------ fios, plugues e tomadas
      // Cada aparelho elétrico tem um fio que sai do ponto acao.eletrico.fio (coordenadas do desenho) e termina num
      // plugue. Solto, o plugue fica no chão ao lado; a criança arrasta até uma tomada (CASA.TOMADAS) e ele encaixa.
      const FIO_MAX = 760;                   // até onde o fio alcança (px do mundo)
      const PEGA_TOMADA = 95;                // soltar o plugue até essa distância da tomada: encaixa
      const pontaFio = i => { const f = acaoDe(i.id).eletrico.fio || [0, -10]; return { x: i.x + f[0] * i.k, y: i.y + f[1] * i.k }; };
      function descanso(i) {
        const a = pontaFio(i), andar = andarEm(a.x, a.y - 10), chao = pisoDe(andar) - 12;
        const x = U.limitar(a.x + 70, limitesX(andar)[0] + 30, limitesX(andar)[1] - 30);
        // aparelho no chão ou em cima de um móvel: o plugue cai no chão; luzinhas lá no alto da parede: ele fica pendurado
        return { x, y: chao - a.y < 420 ? chao : a.y + 170 };
      }
      const posPlugue = i => (i.t != null ? { x: C.TOMADAS[i.t].x, y: C.TOMADAS[i.t].y + 2 } : (i.plugAqui || descanso(i)));
      const PLUGUE_SOLTO = `<svg viewBox="-44 -44 88 88"><g transform="rotate(90)"><path d="M-9 -30 V -20 M9 -30 V -20" stroke="#B9B3CC" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M-9 -30 V -20 M9 -30 V -20" stroke="#3A2A5A" stroke-width="2" stroke-linecap="round"/>` +
        `<rect x="-19" y="-22" width="38" height="40" rx="10" fill="#fff" stroke="#3A2A5A" stroke-width="5"/><rect x="-11" y="16" width="22" height="12" rx="4" fill="#5A4A78"/></g></svg>`;
      const PLUGUE_LIGADO = `<svg viewBox="-44 -44 88 88"><rect x="-21" y="-22" width="42" height="40" rx="11" fill="#fff" stroke="#3A2A5A" stroke-width="5"/>` +
        `<rect x="-12" y="16" width="24" height="12" rx="4" fill="#5A4A78"/><circle cx="0" cy="-3" r="5" fill="#5CC84A" stroke="#3A2A5A" stroke-width="2.5"/></svg>`;
      function desenharFio(i) {
        if (!i.fioEl) {
          i.fioEl = document.createElementNS(NS, 'svg');
          i.fioEl.setAttribute('class', 'pc-casa-fio');
          fiosEl.appendChild(i.fioEl);
          i.plugEl = U.el('div', { class: 'pc-casa-plugue', teste: 'plugue-' + i.id, 'aria-label': 'Plugue' });
          i.plugEl.__item = i;
          pluguesEl.appendChild(i.plugEl);
          i.plugEstado = '';
        }
        const a = pontaFio(i), b = posPlugue(i);
        const piso = pisoDe(andarEm(a.x, a.y - 10));
        // o fio cai em curva e encosta no chão quando sobra fio
        const meioX = (a.x + b.x) / 2, sobra = Math.max(0, FIO_MAX * .55 - Math.hypot(b.x - a.x, b.y - a.y));
        const cy = Math.min(piso + 6, Math.max(a.y, b.y) + 40 + sobra * .5);
        const x0 = Math.min(a.x, b.x, meioX) - 30, y0 = Math.min(a.y, b.y) - 30, x1 = Math.max(a.x, b.x, meioX) + 30, y1 = Math.max(a.y, b.y, cy) + 30;
        const d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${meioX.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
        i.fioEl.setAttribute('viewBox', `${x0} ${y0} ${x1 - x0} ${y1 - y0}`);
        i.fioEl.setAttribute('width', x1 - x0); i.fioEl.setAttribute('height', y1 - y0);
        i.fioEl.style.left = x0 + 'px'; i.fioEl.style.top = y0 + 'px';
        i.fioEl.innerHTML = `<path d="${d}" fill="none" stroke="#3A2A5A" stroke-width="11" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#7C6E96" stroke-width="5" stroke-linecap="round"/>`;
        const est = i.t != null ? 'ligado' : 'solto';
        if (i.plugEstado !== est) { i.plugEl.innerHTML = est === 'ligado' ? PLUGUE_LIGADO : PLUGUE_SOLTO; i.plugEstado = est; }
        i.plugEl.style.left = b.x + 'px'; i.plugEl.style.top = b.y + 'px';
      }
      function tirarFio(i) {
        if (i.fioEl) i.fioEl.remove();
        if (i.plugEl) i.plugEl.remove();
        i.fioEl = i.plugEl = null; i.t = null; i.plugAqui = null;
      }
      const ocupada = (t, menos) => itens.some(o => o !== menos && o.t === t);
      function tomadaMaisPerto(pt, raio, livre, menos) {
        let melhor = -1, d = raio;
        C.TOMADAS.forEach((tm, k) => { const dd = Math.hypot(tm.x - pt.x, tm.y - pt.y); if (dd < d && (!livre || !ocupada(k, menos))) { d = dd; melhor = k; } });
        return melhor;
      }
      /** Uma tomada pisca (a Pipoca está mostrando onde ligar). */
      function piscarTomada(k) {
        if (k < 0) return;
        const anel = U.el('div', { class: 'pc-casa-anel', style: `left:${C.TOMADAS[k].x}px;top:${C.TOMADAS[k].y}px` });
        fxEl.appendChild(anel);
        setTimeout(() => anel.remove(), U.duracao(2200));
      }
      /** O plugue foi solto em pt: encaixa numa tomada perto (se o fio alcançar) ou volta para o chão. */
      function soltarPlugue(i, pt) {
        const k = tomadaMaisPerto(pt, PEGA_TOMADA, false, i);
        i.plugEl.classList.remove('pegado');
        i.plugAqui = null;
        if (k >= 0 && ocupada(k, i)) { pipocaDiz('Essa tomada já está ocupada!'); PC.som.soltar(); }
        else if (k >= 0 && Math.hypot(C.TOMADAS[k].x - pontaFio(i).x, C.TOMADAS[k].y - pontaFio(i).y) > FIO_MAX) {
          pipocaDiz('O fio não alcança! Leve para mais perto da tomada.'); PC.som.soltar();
        } else if (k >= 0) {
          i.t = k;
          PC.som.encaixar();
          particulas('faisca', C.TOMADAS[k].x, C.TOMADAS[k].y, 6);
          redesenharItem(i);
        } else PC.som.soltar();
        desenharFio(i);
        salvar();
      }
      /** Depois de mudar um aparelho de lugar: se o fio não alcança mais a tomada, o plugue sai. */
      function conferirFio(i) {
        const a = acaoDe(i.id);
        if (!a || !a.eletrico) return;
        if (i.t != null && Math.hypot(C.TOMADAS[i.t].x - pontaFio(i).x, C.TOMADAS[i.t].y - pontaFio(i).y) > FIO_MAX) {
          i.t = null; PC.som.soltar(); redesenharItem(i);
        }
        desenharFio(i);
      }

      // ------------------------------------------------------------ efeitos: partículas que voam e somem
      const PARTICULAS = {
        pipoca: () => `<svg viewBox="-20 -20 40 40" width="40" height="40"><g fill="#FFFAF0" stroke="#3A2A5A" stroke-width="3"><circle cx="-5" cy="2" r="8"/><circle cx="5" cy="1" r="8"/><circle cx="0" cy="-6" r="8"/></g><circle cx="0" cy="2" r="6" fill="#FFFAF0"/><circle cx="2" cy="6" r="2.5" fill="#FFD23F"/></svg>`,
        bolha: () => `<svg viewBox="-20 -20 40 40" width="40" height="40"><circle r="13" fill="#E6F6FF" fill-opacity=".55" stroke="#4DA3FF" stroke-width="3"/><circle cx="-4" cy="-5" r="3.5" fill="#fff"/></svg>`,
        gota: () => `<svg viewBox="-14 -20 28 40" width="28" height="40"><path d="M0 -14 Q 10 2 8 8 A 8 8 0 0 1 -8 8 Q -10 2 0 -14 Z" fill="#7CC8FF" stroke="#3A2A5A" stroke-width="3"/><circle cx="-3" cy="4" r="2" fill="#fff"/></svg>`,
        nota: () => `<svg viewBox="-20 -24 40 48" width="40" height="48"><path d="M4 8 V -16 L 16 -19 V -11 L 4 -8" fill="#3A2A5A" stroke="#3A2A5A" stroke-width="3" stroke-linejoin="round"/><ellipse cx="-2" cy="9" rx="8" ry="6" transform="rotate(-20 -2 9)" fill="${U.escolher(['#9B7BFF', '#FF8FC2', '#2EC4B6', '#FFC93C'])}" stroke="#3A2A5A" stroke-width="3"/></svg>`,
        coracao: () => `<svg viewBox="-18 -16 36 32" width="36" height="32"><path d="M0 10 C -16 -1 -9 -14 0 -6 C 9 -14 16 -1 0 10 Z" fill="#FF7A9A" stroke="#3A2A5A" stroke-width="3" stroke-linejoin="round"/></svg>`,
        estrela: () => `<svg viewBox="-16 -16 32 32" width="32" height="32"><path d="M0 -13 Q 3 -3 13 0 Q 3 3 0 13 Q -3 3 -13 0 Q -3 -3 0 -13 Z" fill="#FFD23F" stroke="#3A2A5A" stroke-width="3" stroke-linejoin="round"/></svg>`,
        faisca: () => `<svg viewBox="-12 -12 24 24" width="24" height="24"><path d="M0 -10 L 3 -3 L 10 0 L 3 3 L 0 10 L -3 3 L -10 0 L -3 -3 Z" fill="#FFE27A" stroke="#3A2A5A" stroke-width="2" stroke-linejoin="round"/></svg>`,
        vapor: () => `<svg viewBox="-24 -20 48 40" width="48" height="40"><g fill="#FFFFFF" fill-opacity=".85" stroke="#B9B3CC" stroke-width="3"><circle cx="-8" cy="4" r="11"/><circle cx="8" cy="2" r="12"/><circle cx="0" cy="-7" r="10"/></g></svg>`,
        vento: () => `<svg viewBox="-30 -12 60 24" width="60" height="24"><path d="M-26 0 Q -8 -10 8 0 T 26 -2" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/><path d="M-26 0 Q -8 -10 8 0 T 26 -2" fill="none" stroke="#9BD3F5" stroke-width="3" stroke-linecap="round"/></svg>`,
        z: () => `<svg viewBox="-16 -16 32 32" width="32" height="32"><text x="0" y="10" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="30" fill="#fff" stroke="#3A2A5A" stroke-width="5" paint-order="stroke">z</text></svg>`,
        folha: () => `<svg viewBox="-16 -16 32 32" width="32" height="32"><path d="M-10 8 Q -12 -10 10 -10 Q 10 10 -10 8 Z" fill="#5CC84A" stroke="#3A2A5A" stroke-width="3"/></svg>`,
      };
      /** n partículas do tipo saindo do ponto (x, y) do mundo. opcoes: { dx, dy (direção média), espalha, ms, sobe } */
      function particulas(tipo, x, y, n = 6, op = {}) {
        const desenho = PARTICULAS[tipo] || PARTICULAS.estrela;
        const dx = op.dx || 0, dy = op.dy != null ? op.dy : -110, espalha = op.espalha != null ? op.espalha : 80, ms = op.ms || 900;
        for (let k = 0; k < n; k++) {
          const el = U.el('div', { html: desenho() });
          el.style.left = x + 'px'; el.style.top = y + 'px';
          el.style.margin = '-20px 0 0 -20px';
          fxEl.appendChild(el);
          const vx = dx + (Math.random() - .5) * espalha * 2, vy = dy + (Math.random() - .5) * espalha;
          const giro = (Math.random() - .5) * 120, atraso = op.seguidas ? k * (op.seguidas) : Math.random() * 120;
          const anim = U.animar(el, [
            { transform: 'translate(0, 0) scale(.4) rotate(0deg)', opacity: 0 },
            { transform: `translate(${vx * .35}px, ${vy * .45}px) scale(1) rotate(${giro * .4}deg)`, opacity: 1, offset: .25 },
            { transform: `translate(${vx}px, ${vy + (op.cai ? 160 : 0)}px) scale(.9) rotate(${giro}deg)`, opacity: 0 },
          ], { duration: ms, delay: atraso, easing: op.cai ? 'cubic-bezier(.2,.6,.6,1)' : 'ease-out', fill: 'backwards' });
          const fim = () => el.remove();
          if (anim && anim.finished) anim.finished.then(fim, fim); else setTimeout(fim, ms + atraso + 50);
        }
      }

      // ------------------------------------------------------------ o que acontece ao tocar numa coisa (modo brincar)
      const timersAcao = [];
      /** O "contexto" que cada ação recebe: o estado, o mundo e os efeitos prontos. */
      function contexto(i) {
        const k = i.k;
        const noMundo = (lx, ly) => ({ x: i.x + lx * k, y: i.y + ly * k });
        const ctx = {
          estado: i.e,
          ligado: ligadoNaTomada(i),
          /** guarda o estado e redesenha o item (o desenho e o "sobre" mudam com o estado) */
          mudou() { redesenharItem(i); salvar(); },
          /** desenho por cima do item por ms (coordenadas do desenho do item); devolve uma função que tira antes */
          mostrar(svg, ms = 1200) {
            const g = i.el && i.el.querySelector('.casa-efeitos');
            if (!g) return () => {};
            const sub = document.createElementNS(NS, 'g');
            sub.setAttribute('transform', `rotate(${i.rot || 0}) scale(${k})`);
            sub.innerHTML = svg;
            g.appendChild(sub);
            i.el.classList.add('anima');
            const tirar = () => { sub.remove(); if (i.el && !i.el.querySelector('.casa-sobre') && !g.childNodes.length) i.el.classList.remove('anima'); };
            timersAcao.push(setTimeout(tirar, U.duracao(ms)));
            return tirar;
          },
          particulas(tipo, lx, ly, n, op) { const p = noMundo(lx, ly); particulas(tipo, p.x, p.y, n, op); },
          som(nome) { if (PC.som && PC.som[nome]) PC.som[nome](); },
          diz(texto) { return pipocaDiz(texto); },
          pular() { mexer(i, 'pula'); },
          tremer() { mexer(i, 'treme'); },
          balancar() { mexer(i, 'balanca'); },
          depois(ms, fn) { timersAcao.push(setTimeout(() => { if (vivo) fn(); }, U.duracao(ms))); },
          /** coisas da casa perto deste item (raio em px do mundo), para uma ação mexer em outra (ex.: o fogão e a panela) */
          perto(raio = 260) { return itens.filter(o => o !== i && Math.hypot(o.x - i.x, o.y - i.y) < raio).map(o => ({ id: o.id, estado: o.e, contexto: () => contexto(o) })); },
          noMundo,
          /** a Pipoca olha para cá */
          olhar() { rig.olhar(Math.sign(i.x - pip.x), -.2, 1500); },
        };
        return ctx;
      }
      function mexer(i, classe) {
        if (!i.el) return;
        i.el.classList.remove('pula', 'treme', 'balanca', 'assenta'); void i.el.offsetWidth; i.el.classList.add(classe);
      }
      function brincarCom(i) {
        const a = acaoDe(i.id);
        rig.olhar(Math.sign(i.x - pip.x), -.2, 1500);
        if (!a) { mexer(i, 'pula'); PC.som.clique(); return; }
        if (a.eletrico && !ligadoNaTomada(i)) {
          // aparelho fora da tomada: a Pipoca avisa e mostra a tomada livre mais perto
          mexer(i, 'treme');
          PC.som.soltar();
          pipocaDiz(U.escolher(['Ih, precisa ligar na tomada!', 'Ih, precisa colocar na tomada!']));
          piscarTomada(tomadaMaisPerto(pontaFio(i), 99999, true, i));
          if (i.plugEl) { i.plugEl.classList.remove('chama'); void i.plugEl.offsetWidth; i.plugEl.classList.add('chama'); }
          return;
        }
        const ctx = contexto(i);
        if (a.tocar) { try { a.tocar(ctx); } catch (e) { console.error(i.id, e); } }
        else if (a.eletrico) {
          // aparelho sem ação própria: liga e desliga
          i.e.ligado = !i.e.ligado; ctx.som(i.e.ligado ? 'clique' : 'soltar'); ctx.mudou();
        }
      }

      // ------------------------------------------------------------ a Pipoca viva
      const PK = 1.2;
      const pipEl = U.el('div', { class: 'pc-casa-pipoca', teste: 'pipoca', role: 'img', 'aria-label': 'Pipoca' });
      const rig = PC.pipoca.criar(pipEl, { pose: 'acena' });
      function posPipoca() { pipEl.style.left = (pip.x - 135 * PK) + 'px'; pipEl.style.top = (pip.y - 263 * PK) + 'px'; }
      posPipoca();
      redesenharItens();

      // ------------------------------------------------------------ câmera
      // cam = o ponto do mundo que fica no canto (0, 0) do palco. A tela do aparelho pode ir além do palco (mx, my
      // em px virtuais de cada lado): a janela cobre isso também e a câmera nunca mostra o que está fora do mundo.
      const cam = { x: 0, y: 0 };
      const M = { x: 0, y: 0 };
      const alturaBau = () => (bauAberto ? BAU : BAU_FECHADO);
      const bauTopo = () => TELA.a + M.y - alturaBau();
      function margens() {
        const e = PC.palco.escala || 1;
        M.x = Math.max(0, Math.round(PC.palco.ox / e)); M.y = Math.max(0, Math.round(PC.palco.oy / e));
        Object.assign(janela.style, { left: -M.x + 'px', top: -M.y + 'px', width: TELA.l + 2 * M.x + 'px', height: TELA.a + 2 * M.y + 'px' });
        Object.assign(bau.style, { left: -M.x + 'px', width: TELA.l + 2 * M.x + 'px' });
        posBau();
        moverCam(cam.x, cam.y);
      }
      function posBau() { bau.style.top = bauTopo() + 'px'; bau.classList.toggle('fechado', !bauAberto); }
      // embaixo, a câmera para quando o gramado fica logo acima do baú (não mostra terra nem o fim do mundo)
      const limY = () => C.CHAO + 80 - bauTopo();
      function moverCam(x, y) {
        cam.x = U.limitar(x, M.x, C.W - TELA.l - M.x);
        cam.y = U.limitar(y, C.TOPO + M.y, limY());
        mundo.style.transform = `translate(${M.x - cam.x}px, ${M.y - cam.y}px)`;
        atualizarMapinha();
        pedacosLogo();
      }
      let glide = 0;
      function deslizar(x, y, ms = 600) {
        cancelAnimationFrame(glide);
        const x0 = cam.x, y0 = cam.y, t0 = performance.now(), dur = U.duracao(ms);
        const passo = t => {
          const u = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - u, 3);
          moverCam(x0 + (x - x0) * e, y0 + (y - y0) * e);
          if (u < 1 && vivo) glide = requestAnimationFrame(passo); else salvar();
        };
        glide = requestAnimationFrame(passo);
      }
      let inercia = 0;
      function soltarComInercia(vx, vy) {
        cancelAnimationFrame(inercia);
        let ult = performance.now();
        const passo = t => {
          const dt = Math.min(50, t - ult) / 1000; ult = t;
          vx *= Math.pow(.04, dt); vy *= Math.pow(.04, dt);
          moverCam(cam.x - vx * dt, cam.y - vy * dt);
          if (vivo && Math.hypot(vx, vy) > 30) inercia = requestAnimationFrame(passo); else salvar();
        };
        inercia = requestAnimationFrame(passo);
      }

      // ------------------------------------------------------------ luz: janelas, luz do teto, dia e noite
      // Cada cômodo escurece conforme as janelas fechadas e a noite; a luz do teto (interruptor) clareia tudo; as coisas
      // acesas (abajur, luminária, TV, luzinhas...: CASA.LUZES) abrem uma poça de luz quente no escuro do cômodo delas.
      // Desempenho: o escuro é UM canvas pequeno (1/8 do mundo) ampliado pela placa de vídeo, redesenhado só quando
      // algo muda (e a cada quadro só enquanto anoitece ou enquanto uma luz é arrastada). De dia, tudo aberto, ele some.
      const COMODOS = ['quarto', 'banheiro', 'sala', 'cozinha'];
      function luzDe(nome) { return (C.partes[nome] && C.partes[nome].luz) || null; }
      const MEIO_LAJE = (C.CIMA.piso + 40 + C.BAIXO.topo) / 2;
      // o pedaço do mundo que cada cômodo escurece (com as paredes e metade da laje)
      const AREA = {
        // (as paredes de fora ficam com o escuro de fora: pela porta dos fundos aparece o quintal)
        quarto: [C.L.quarto.x0 - 4, C.CIMA.topo - 6, 4500, MEIO_LAJE], banheiro: [4500, C.CIMA.topo - 6, C.L.banheiro.x1 + 4, MEIO_LAJE],
        sala: [C.L.sala.x0 - 4, MEIO_LAJE, 4250, C.BAIXO.piso + 76], cozinha: [4250, MEIO_LAJE, C.L.cozinha.x1 + 4, C.BAIXO.piso + 76],
      };
      const CORPO = [C.CASA0 - 34, C.CIMA.topo - 6, C.CASA1 + 34, C.BAIXO.piso + 76];
      const comodoEm = (x, y) => COMODOS.find(nm => { const a = AREA[nm]; return x >= a[0] && x < a[2] && y >= a[1] && y < a[3]; }) || null;
      COMODOS.forEach(nm => { const lz = luzDe(nm); if (lz && (!Array.isArray(fechadas[nm]) || fechadas[nm].length !== lz.janelas.length)) fechadas[nm] = lz.janelas.map(() => false); });
      let noiteK = noite ? 1 : 0;

      /** Um desenho solto no mundo (coordenadas do mundo), num svg do tamanho dele. */
      function svgNoMundo(arte, classe) {
        const b = caixaArte(arte, 1, 0);
        const el = U.svg(`<svg class="${classe || ''}" viewBox="${b.x} ${b.y} ${b.l} ${b.a}" width="${b.l}" height="${b.a}" xmlns="${NS}">${arte}</svg>`);
        el.style.left = b.x + 'px'; el.style.top = b.y + 'px';
        el.__caixa = b;
        return el;
      }
      const fixos = {};   // cômodo -> { janelas: [{ vidro, fechada }], lustre }
      function montarFixos() {
        fixosEl.innerHTML = '';
        COMODOS.concat('quintal').forEach(nm => {
          const lz = luzDe(nm);
          if (!lz) return;
          const f = fixos[nm] = { janelas: [], lustre: null };
          (lz.janelas || []).forEach(j => {
            const vidro = U.el('div', { class: 'pc-casa-vidro-noite', style: `left:${j.x}px;top:${j.y}px;width:${j.w}px;height:${j.h}px` });
            fixosEl.appendChild(vidro);
            f.janelas.push({ vidro, fechada: null });
          });
          desenharFixos(nm);
        });
      }
      function desenharFixos(nm, anima) {
        const lz = luzDe(nm), f = fixos[nm];
        if (!lz || !f) return;
        f.janelas.forEach((jj, k) => {
          const fech = !!(fechadas[nm] && fechadas[nm][k]);
          if (fech && !jj.fechada) {
            try { jj.fechada = svgNoMundo(lz.fechada(lz.janelas[k], k), 'pc-casa-cortina' + (anima ? ' cai' : '')); } catch (e) { console.error(nm, e); return; }
            // logo depois do vidro da noite (fica atrás do lustre e de tudo o que vem depois)
            fixosEl.insertBefore(jj.fechada, jj.vidro.nextSibling);
          } else if (!fech && jj.fechada) { jj.fechada.remove(); jj.fechada = null; }
        });
        if (lz.lustre) {
          const aceso = nm === 'quintal' ? noite : !!acesas[nm];
          if (f.lustre && f.lustre.__aceso === aceso) return;
          if (f.lustre) f.lustre.remove();
          try { f.lustre = svgNoMundo(C.em(lz.lustre.x, lz.lustre.y, 1, lz.lustre.desenho(aceso))); } catch (e) { console.error(nm, e); return; }
          f.lustre.__aceso = aceso;
          fixosEl.appendChild(f.lustre);
        }
      }
      /** Toque no cenário: interruptor ou lustre acende/apaga a luz do teto; janela abre/fecha a cortina. */
      function tocarFixo(w) {
        for (const nm of COMODOS) {
          const lz = luzDe(nm), f = fixos[nm];
          if (!lz || !f) continue;
          const it = lz.interruptor, b = f.lustre && f.lustre.__caixa;
          const noLustre = b && w.x > b.x && w.x < b.x + b.l && w.y > b.y && w.y < b.y + b.a;
          if ((it && Math.abs(w.x - it.x) < 56 && Math.abs(w.y - it.y) < 66) || noLustre) {
            if (modo === 'falar') { PC.som.clique(); pipocaDiz(noLustre ? 'Lustre!' : 'Interruptor!'); return true; }
            acesas[nm] = !acesas[nm];
            PC.som.clique();
            desenharFixos(nm); pedirLuz(); salvar();
            return true;
          }
          const k = (lz.janelas || []).findIndex(j => w.x > j.x - 40 && w.x < j.x + j.w + 40 && w.y > j.y - 60 && w.y < j.y + j.h + 30);
          if (k >= 0) {
            if (modo === 'falar') { PC.som.clique(); pipocaDiz('Janela!'); return true; }
            fechadas[nm][k] = !fechadas[nm][k];
            PC.som.pegar();
            desenharFixos(nm, true); pedirLuz(); salvar();
            return true;
          }
        }
        return false;
      }

      // ---- o escuro
      const lctx = luzEl.getContext('2d');
      function escuroDe(nm) {
        const lz = luzDe(nm), fe = fechadas[nm] || [], n = lz ? lz.janelas.length : 0;
        const frac = n ? fe.filter(Boolean).length / n : 0;
        const base = .6 * frac * (1 - noiteK) + (.72 + .05 * frac) * noiteK;
        return { base, a: acesas[nm] ? base * .1 : base };
      }
      /** As luzes acesas agora (no mundo): { x, y, r, ry, f, cor, ceu } */
      function fontes() {
        const lista = [];
        itens.forEach(i => {
          const fn = C.LUZES && C.LUZES[i.id];
          if (!fn) return;
          let ls = null;
          try { ls = fn(i.e || {}, ligadoNaTomada(i)); } catch (e) { return; }
          if (!ls) return;
          ls.forEach(l => lista.push({ x: i.x + l.x * i.k, y: i.y + l.y * i.k, r: l.r * i.k, ry: (l.ry || l.r) * i.k, f: l.f, cor: l.cor }));
        });
        COMODOS.forEach(nm => {
          const lz = luzDe(nm);
          if (!lz || !lz.lustre || !acesas[nm]) return;
          const [dx, dy] = lz.lustre.lampada || [0, 0];
          lista.push({ x: lz.lustre.x + dx, y: lz.lustre.y + dy, r: 1100, ry: 800, f: .5 });
        });
        const q = luzDe('quintal');
        if (q && q.lustre && noiteK > .01) { const [dx, dy] = q.lustre.lampada || [0, 0]; lista.push({ x: q.lustre.x + dx, y: q.lustre.y + dy, r: 560, f: .85 * noiteK }); }
        if (noiteK > .01) lista.push({ x: C.SOL.x, y: C.SOL.y, r: 520, f: .5 * noiteK, cor: '#FFF6C8' });
        return lista;
      }
      const rgba = (hex, a) => { const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a.toFixed(3)})`; };
      function pintarLuz() {
        pedidoLuz = 0;
        if (!vivo) return;
        const ext = .7 * noiteK, esc = {};
        let algum = ext > .005;
        COMODOS.forEach(nm => { esc[nm] = escuroDe(nm); if (esc[nm].a > .005) algum = true; });
        luzEl.style.display = algum ? '' : 'none';
        if (!algum) return;
        const g = lctx;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
        g.clearRect(0, 0, LUZ_L, LUZ_A);
        g.setTransform(1 / LUZ_ESC, 0, 0, 1 / LUZ_ESC, 0, -C.TOPO / LUZ_ESC);   // desenha em coordenadas do mundo
        g.fillStyle = 'rgb(14,18,54)';
        if (ext > .005) { g.globalAlpha = ext; g.fillRect(0, C.TOPO, C.W, C.H - C.TOPO); }
        COMODOS.forEach(nm => {
          const [x0, y0, x1, y1] = AREA[nm];
          g.clearRect(x0, y0, x1 - x0, y1 - y0);
          if (esc[nm].a > .005) { g.globalAlpha = esc[nm].a; g.fillRect(x0, y0, x1 - x0, y1 - y0); }
        });
        // as luzes: furam o escuro (só dentro do cômodo delas; as de fora, só fora da casa) e pintam um pouco da cor
        fontes().forEach(l => {
          const nm = comodoEm(l.x, l.y);
          const base = nm ? esc[nm].base : ext;
          if (base < .02) return;
          g.save();
          g.beginPath();
          if (nm) { const [x0, y0, x1, y1] = AREA[nm]; g.rect(x0, y0, x1 - x0, y1 - y0); g.clip(); }
          else { g.rect(0, C.TOPO, C.W, C.H - C.TOPO); g.rect(CORPO[0], CORPO[1], CORPO[2] - CORPO[0], CORPO[3] - CORPO[1]); g.clip('evenodd'); }
          g.translate(l.x, l.y); g.scale(1, l.ry / l.r);
          const fura = g.createRadialGradient(0, 0, 0, 0, 0, l.r);
          fura.addColorStop(0, `rgba(0,0,0,${l.f})`); fura.addColorStop(.4, `rgba(0,0,0,${(l.f * .6).toFixed(3)})`); fura.addColorStop(1, 'rgba(0,0,0,0)');
          g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out'; g.fillStyle = fura;
          g.beginPath(); g.arc(0, 0, l.r, 0, Math.PI * 2); g.fill();
          const t = Math.min(.3, base * .42) * l.f;
          if (t > .01) {
            const cor = l.cor || '#FFC56B', rr = l.r * .75;
            const tinta = g.createRadialGradient(0, 0, 0, 0, 0, rr);
            tinta.addColorStop(0, rgba(cor, t)); tinta.addColorStop(1, rgba(cor, 0));
            g.globalCompositeOperation = 'source-over'; g.fillStyle = tinta;
            g.beginPath(); g.arc(0, 0, rr, 0, Math.PI * 2); g.fill();
          }
          g.restore();
        });
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
        // pelo vão da porta dos fundos aparece o quintal: ali vale o escuro de fora
        const PORTA = [C.L.cozinha.x1 - 60, C.BAIXO.piso - 352, C.L.cozinha.x1 + 4, C.BAIXO.piso - 40];
        g.clearRect(PORTA[0], PORTA[1], PORTA[2] - PORTA[0], PORTA[3] - PORTA[1]);
        if (ext > .005) { g.globalAlpha = ext; g.fillRect(PORTA[0], PORTA[1], PORTA[2] - PORTA[0], PORTA[3] - PORTA[1]); g.globalAlpha = 1; }
      }

      // ---- o céu: sol, lua e estrelas (vivos, por cima do escuro)
      const S = C.SOL;
      const solEl = U.el('div', { class: 'pc-casa-astro', style: `left:${S.x - 200}px;top:${S.y - 200}px;width:400px;height:400px` });
      solEl.append(U.svg(`<svg class="pc-casa-raios" viewBox="-200 -200 400 400" width="400" height="400" xmlns="${NS}">${C.astro.raios()}</svg>`),
        U.svg(`<svg viewBox="-200 -200 400 400" width="400" height="400" xmlns="${NS}">${C.astro.sol()}</svg>`));
      const luaEl = U.el('div', { class: 'pc-casa-astro', style: `left:${S.x - 160}px;top:${S.y - 160}px;width:320px;height:320px` });
      luaEl.append(U.svg(`<svg viewBox="-160 -160 320 320" width="320" height="320" xmlns="${NS}">${C.astro.lua()}</svg>`));
      const ESTRELA = 'M0 -10 Q 2 -2 10 0 Q 2 2 0 10 Q -2 2 -10 0 Q -2 -2 0 -10 Z';
      C.astro.estrelas().forEach(([x, y, r, brilha]) => {
        const el = U.svg(`<svg class="pc-casa-estrela${brilha ? ' brilha' : ''}" viewBox="-11 -11 22 22" width="${r * 2.2}" height="${r * 2.2}" xmlns="${NS}"><path d="${ESTRELA}" fill="#FFF3B0"/></svg>`);
        el.style.left = (x - r * 1.1) + 'px'; el.style.top = (y - r * 1.1) + 'px';
        if (brilha) el.style.animationDelay = (x % 13) / 10 + 's';
        ceuEl.appendChild(el);
      });
      ceuEl.append(solEl, luaEl);
      function mostrarCeu() {
        solEl.classList.toggle('fora', noite);
        luaEl.classList.toggle('fora', !noite);
        ceuEl.classList.toggle('dia', !noite);
        mundo.classList.toggle('noite', noite);
      }
      let animNoite = 0;
      function mudarNoite(v) {
        if (v === noite) return;
        noite = v;
        mostrarCeu();
        mapinha.classList.toggle('noite', noite); mostrarAstroBtn();
        desenharFixos('quintal');
        cancelAnimationFrame(animNoite);
        const k0 = noiteK, k1 = v ? 1 : 0, t0 = performance.now(), dur = U.duracao(1800);
        const passo = t => {
          if (!vivo) return;
          const u = dur > 0 ? U.limitar((t - t0) / dur, 0, 1) : 1;
          noiteK = k0 + (k1 - k0) * u * u * (3 - 2 * u);
          pintarLuz();
          if (u < 1) animNoite = requestAnimationFrame(passo);
        };
        animNoite = requestAnimationFrame(passo);
        salvar();
      }
      montarFixos();
      mostrarCeu();
      pedirLuz();

      // ------------------------------------------------------------ HUD: voltar e mapinha
      const hud = U.el('div', { class: 'hud pc-casa-hud' });
      const bVoltar = PC.ui.botaoIcone('voltar', 'Voltar', () => PC.telas.voltar());
      bVoltar.dataset.teste = 'voltar';
      const mapinha = U.el('div', { class: 'pc-casa-mapinha', teste: 'mapinha', role: 'button', 'aria-label': 'Mapa da casa' });
      mapinha.innerHTML = `<svg viewBox="0 ${C.TOPO} ${C.W} ${C.H - C.TOPO}" preserveAspectRatio="none" xmlns="${NS}">` +
        `<rect class="ceu" y="${C.TOPO}" width="${C.W}" height="${C.H - C.TOPO}" fill="#BFE8FF"/><rect y="${C.CHAO}" width="${C.W}" height="${C.H - C.CHAO}" fill="#7CCB5E"/>` +
        `<path d="M${C.CASA0 - 130} ${C.CIMA.topo} L ${C.CASA0 + 1430} ${C.CIMA.topo - 760} L ${C.CASA1 - 1430} ${C.CIMA.topo - 760} L ${C.CASA1 + 130} ${C.CIMA.topo} Z" fill="#FF7A6B"/>` +
        `<rect x="${C.CASA0}" y="${C.CIMA.topo}" width="${C.CASA1 - C.CASA0}" height="${C.CIMA.piso + 40 - C.CIMA.topo}" fill="#EDE3FF"/>` +
        `<rect x="${C.CASA0}" y="${C.BAIXO.topo}" width="${C.CASA1 - C.CASA0}" height="${C.BAIXO.piso + 40 - C.BAIXO.topo}" fill="#FFF1D9"/>` +
        `<rect x="${C.CASA0}" y="${C.CIMA.piso + 40}" width="${C.CASA1 - C.CASA0}" height="${C.BAIXO.topo - C.CIMA.piso - 40}" fill="#C9A77E"/>` +
        `<circle cx="8100" cy="1300" r="420" fill="#4FB83D"/><rect x="8070" y="1300" width="60" height="660" fill="#8A5A34"/>` +
        `<rect class="vista" width="${TELA.l}" height="${TELA.a}" fill="rgba(155,123,255,.18)" stroke="#9B7BFF" stroke-width="90"/></svg>`;
      const vistaMapa = mapinha.querySelector('.vista');
      // o sol (de dia) ou a lua (de noite) no canto do mapinha: tocar troca o dia pela noite
      const astroBtn = U.el('div', { class: 'pc-casa-astro-btn', teste: 'sol', role: 'button' });
      function mostrarAstroBtn() {
        astroBtn.setAttribute('aria-label', noite ? 'Fazer amanhecer' : 'Fazer anoitecer');
        astroBtn.innerHTML = `<svg viewBox="-200 -200 400 400" xmlns="${NS}">` + (noite ? C.astro.lua() : C.astro.raios() + C.astro.sol()) + '</svg>';
      }
      astroBtn.addEventListener('pointerdown', ev => ev.stopPropagation());
      PC.aoTocar(astroBtn, () => {
        mudarNoite(!noite);
        pipocaDiz(noite ? U.escolher(['Ficou de noite! Boa noite!', 'Olha a lua!']) : U.escolher(['Bom dia! O sol voltou!', 'Amanheceu!']));
      });
      hud.appendChild(astroBtn);
      mapinha.classList.toggle('noite', noite);
      mostrarAstroBtn();
      function atualizarMapinha() { vistaMapa.setAttribute('x', cam.x); vistaMapa.setAttribute('y', cam.y); }
      desligar.push(PC.arrastar(mapinha, {
        limiar: 4,
        aoTocar: (p, ev) => irPeloMapa(ev),
        aoMover: (p, ev) => irPeloMapa(ev, true),
      }));
      function irPeloMapa(ev, ja) {
        if (!ev) return;
        const r = mapinha.getBoundingClientRect();
        const fx = U.limitar((ev.clientX - r.left) / r.width, 0, 1), fy = U.limitar((ev.clientY - r.top) / r.height, 0, 1);
        const x = fx * C.W - TELA.l / 2, y = C.TOPO + fy * (C.H - C.TOPO) - (TELA.a - BAU) / 2;
        if (ja) { cancelAnimationFrame(glide); moverCam(x, y); salvar(); } else { PC.som.clique(); deslizar(x, y); }
      }
      // modo: brincar (mãozinha) ou ouvir os nomes (balão). Tocar troca; a Pipoca avisa.
      const ICONE_MODO = {
        brincar: PC.arte.mao().replace('<svg ', '<svg class="pc-casa-mao" '),
        falar: '<svg viewBox="0 0 64 64"><path d="M10 12 H 54 A 8 8 0 0 1 62 20 V 40 A 8 8 0 0 1 54 48 H 28 L 14 58 L 17 48 H 10 A 8 8 0 0 1 2 40 V 20 A 8 8 0 0 1 10 12 Z" fill="#fff" stroke="#3A2A5A" stroke-width="4.5" stroke-linejoin="round"/>' +
          '<path d="M16 30 V 30 M24 24 V 36 M32 19 V 41 M40 23 V 37 M48 29 V 31" stroke="#9B7BFF" stroke-width="5.5" stroke-linecap="round"/></svg>',
      };
      const bModo = U.el('div', { class: 'pc-casa-modo', teste: 'modo', role: 'button' });
      function mostrarModo() {
        bModo.className = 'pc-casa-modo ' + modo;
        bModo.setAttribute('aria-label', modo === 'falar' ? 'Modo: ouvir os nomes' : 'Modo: brincar');
        bModo.innerHTML = `<span>${ICONE_MODO[modo]}</span>`;
      }
      mostrarModo();
      PC.aoTocar(bModo, () => {
        modo = modo === 'falar' ? 'brincar' : 'falar';
        mostrarModo();
        bModo.classList.add('troca');
        pipocaDiz(modo === 'falar' ? 'Agora eu falo o nome das coisas!' : 'Agora é para brincar!');
        salvar();
      });
      hud.append(bVoltar, bModo, mapinha);
      raiz.appendChild(hud);

      // ------------------------------------------------------------ o baú
      const bau = U.el('div', { class: 'pc-casa-bau' + (bauAberto ? '' : ' fechado'), teste: 'bau' });
      const alca = U.el('div', { class: 'pc-casa-alca', teste: 'alca-bau', role: 'button', 'aria-label': 'Abrir ou fechar o baú' });
      alca.innerHTML = `<svg viewBox="0 0 46 30"><path d="M6 22 L 23 8 L 40 22" fill="none" stroke="#FFE9C2" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const abasEl = U.el('div', { class: 'pc-casa-abas' });
      const vao = U.el('div', { class: 'pc-casa-cartas-vao' });
      const cartas = U.el('div', { class: 'pc-casa-cartas' });
      vao.appendChild(cartas);
      bau.append(U.el('div', { class: 'tampa' }), alca, abasEl, vao);
      raiz.appendChild(bau);
      PC.aoTocar(alca, () => { bauAberto = !bauAberto; posBau(); moverCam(cam.x, cam.y); salvar(); });

      function miniatura(id, w, h) {
        const b = caixa(id);
        return `<svg viewBox="${b.x} ${b.y} ${b.l} ${b.a}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" xmlns="${NS}">${C.desenho(id)}</svg>`;
      }
      let aba = 'moveis', rolagem = 0;
      ABAS.forEach(a => {
        const el = U.el('div', { class: 'pc-casa-aba', teste: 'aba-' + a.id, role: 'button', style: '--cor:' + a.cor });
        el.innerHTML = miniatura(a.icone, 120, 28);
        el.__aba = a.id;
        PC.aoTocar(el, () => { aba = a.id; rolagem = 0; montarCartas(); }, { som: true });
        abasEl.appendChild(el);
      });
      const naCasa = id => itens.some(i => i.id === id);
      // o baú tem o que vem com a casa e o que a criança ganhou nas estações (com o modo de desenvolvedor: tudo)
      const deSempre = new Set(C.inicial().map(i => i.id));
      const ganhos = new Set();
      PC.dados.figurinhas().forEach(id => { const it = C.itemDoPremio(id); if (it) ganhos.add(it); });
      const tudo = !!(PC.dev && PC.dev.ativo && PC.dev.ativo());
      const temItem = id => tudo || deSempre.has(id) || ganhos.has(id);
      function montarCartas() {
        abasEl.querySelectorAll('.pc-casa-aba').forEach(el => el.classList.toggle('atual', el.__aba === aba));
        cartas.innerHTML = '';
        const lista = Object.values(C.ITENS).filter(it => it.aba === aba && !naCasa(it.id) && temItem(it.id));
        lista.forEach(it => {
          const c = U.el('div', { class: 'pc-casa-carta', teste: 'carta-' + it.id, 'aria-label': it.nome });
          c.innerHTML = miniatura(it.id, 118, 118);
          c.__id = it.id;
          cartas.appendChild(c);
        });
        if (!lista.length) cartas.appendChild(U.el('div', { class: 'pc-casa-carta vazia' }));
        rolar(0);
      }
      function rolar(d) {
        const max = Math.max(0, cartas.scrollWidth - vao.clientWidth / 1 + 12);
        rolagem = U.limitar(rolagem + d, 0, max);
        cartas.style.transform = `translateX(${-rolagem}px)`;
      }

      // ------------------------------------------------------------ regras de onde as coisas ficam
      var PAREDES = { cima: [4500], baixo: [4250] };
      function andarEm(x, y) {
        if (x > C.CASA0 && x < C.CASA1) return y < C.CIMA.piso + 70 ? 'cima' : 'baixo';
        return 'fora';
      }
      function pisoDe(andar) { return andar === 'cima' ? C.CIMA.piso : andar === 'baixo' ? C.BAIXO.piso : C.CHAO; }
      function topoDe(andar) { return andar === 'cima' ? C.CIMA.topo : andar === 'baixo' ? C.BAIXO.topo : 40; }
      function limitesX(andar) { return andar === 'fora' ? [20, C.W - 20] : [C.CASA0 + 24, C.CASA1 - 24]; }
      /** Acerta o lugar de um item solto em (x, y): móveis no chão do andar, soltos dentro do cômodo, nada atravessando parede. */
      function acomodar(i) {
        const it = C.ITENS[i.id], b = caixaDe(i);
        const meioY = i.y + b.y + b.a / 2;
        let andar = andarEm(i.x, it.tipo === 'solto' || it.tipo === 'apoia' ? meioY : i.y - 20);
        // fora da casa, mas soltou por cima do telhado: cai no quintal
        const [xa, xb] = limitesX(andar);
        i.x = U.limitar(i.x, xa - b.x, xb - (b.x + b.l));
        if (andar !== 'fora') {
          // não deixa atravessar a parede do meio: vai para o lado onde está a maior parte
          for (const px of PAREDES[andar]) {
            const e = i.x + b.x, d = e + b.l;
            if (e < px + 24 && d > px - 24) i.x = (i.x < px) ? px - 26 - (b.x + b.l) : px + 26 - b.x;
          }
        }
        const piso = pisoDe(andar);
        i.sobre = null;
        if (it.tipo === 'chao') i.y = piso;
        else if (it.tipo === 'tapete') i.y = piso + 10;
        else if (it.tipo === 'apoia') { const ap = apoioDe(i, andar); i.sobre = ap ? ap.g : null; i.y = ap ? ap.y : piso; }
        else {
          i.y = U.limitar(i.y, topoDe(andar) + 8 - b.y, piso + 36 - (b.y + b.a));
          if (it.gruda) i.sobre = grudaEm(i);
        }
      }
      /** O móvel em que um ímã gruda (a área C.GRUDA dele, com a porta fechada), ou null. */
      function grudaEm(i) {
        for (let n = itens.length - 1; n >= 0; n--) {
          const g = itens[n], ar = C.GRUDA[g.id];
          if (!ar || g === i) continue;
          const lx = (i.x - g.x) / g.k, ly = (i.y - g.y) / g.k;
          if (lx < ar[0] || lx > ar[2] || ly < ar[1] || ly > ar[3]) continue;
          const a = acaoDe(g.id), esc = a && a.portaEsconde ? a.portaEsconde(g.e || {}) : null;
          if (esc && lx >= esc[0] && lx <= esc[2] && ly >= esc[1] && ly <= esc[3]) continue;   // porta aberta: ali não gruda
          return g;
        }
        return null;
      }

      // ------------------------------------------------------------ coisas em cima de coisas
      // As coisas 'apoia' (abajur, livros, brinquedos, panelas...) ficam em cima do primeiro tampo embaixo delas
      // (CASA.APOIOS) ou no chão. Cada uma lembra em quem está apoiada (i.sobre): quando o móvel é arrastado, o que
      // está em cima vai junto; quando ele vai para o baú, o que estava em cima cai.
      const SOBE_TAMPO = 40;    // soltou um pouco abaixo do tampo (na frente da borda): sobe para ele
      function tampos(g) { const a = C.APOIOS[g.id]; return a ? a.map(([x0, x1, y]) => [g.x + x0 * g.k, g.x + x1 * g.k, g.y + y * g.k]) : []; }
      /** O tampo mais alto embaixo dos pés de i, no mesmo andar ({ g, y }), ou null (vai para o chão). */
      function apoioDe(i, andar) {
        const piso = pisoDe(andar), topo = topoDe(andar);
        let melhor = null;
        for (const g of itens) {
          if (g === i || g.queda || !C.APOIOS[g.id]) continue;
          let o = g; while (o && o !== i) o = o.sobre;
          if (o === i) continue;                                      // não apoia em algo que está em cima dele
          for (const [x0, x1, y] of tampos(g)) {
            if (i.x < x0 || i.x > x1 || y < i.y - SOBE_TAMPO || y > piso - 4 || y < topo) continue;
            if (!melhor || y < melhor.y) melhor = { g, y };
          }
        }
        return melhor;
      }
      function emCima(i) { return itens.filter(o => o.sobre === i); }
      /** Leva junto (dx, dy) tudo o que está em cima de i, e o que está em cima disso. */
      function moverJunto(i, dx, dy) {
        if (!dx && !dy) return;
        for (const o of emCima(i)) {
          if (o.queda) { o.queda.vivo = false; o.queda = null; o.y = o.yAlvo; }
          o.x += dx; o.y += dy;
          if (o.el) posicionar(o);
          moverJunto(o, dx, dy);
        }
      }
      function trazerJunto(i, marcar) {
        emCima(i).forEach(o => { trazerParaFrente(o); if (o.el) o.el.classList.toggle('junto', marcar); trazerJunto(o, marcar); });
      }
      /** Na ordem de desenho, o que está em cima de um móvel vem logo depois dele (fica na frente). */
      function ordemDeApoio(lista) {
        const feito = new Set(), res = [];
        const por = o => { if (feito.has(o)) return; feito.add(o); res.push(o); lista.forEach(d => { if (d.sobre === o) por(d); }); };
        lista.forEach(o => { if (!o.sobre || lista.indexOf(o.sobre) < 0) por(o); });
        lista.forEach(por);
        return res;
      }

      // ------------------------------------------------------------ gestos na casa: passear, arrastar coisas, tocar
      let gesto = null;   // { tipo: 'cam' | 'item' | 'pipoca', ... }
      let autoRaf = 0;
      function telaParaMundo(p) { return { x: p.x + cam.x, y: p.y + cam.y }; }
      function alvoDe(ev) {
        const t = ev && ev.target;
        if (!t || !t.closest) return null;
        if (t.closest('.pc-casa-pipoca')) return { pipoca: true };
        const pl = t.closest('.pc-casa-plugue');
        if (pl && pl.__item) return { plugue: pl.__item };
        const s = t.closest('.pc-casa-item');
        return s && s.__item ? { item: s.__item } : null;
      }
      function trazerParaFrente(i) {
        itens = itens.filter(o => o !== i).concat(i);
        if (C.ITENS[i.id].tipo !== 'tapete') camada.insertBefore(i.el, pipEl);
      }
      function autoPasseio() {
        cancelAnimationFrame(autoRaf);
        const passo = () => {
          if (!gesto || (gesto.tipo !== 'item' && gesto.tipo !== 'pipoca' && gesto.tipo !== 'plugue') || !vivo) return;
          const p = gesto.ultimo;
          let vx = 0, vy = 0;
          const esq = -M.x + BORDA_AUTO, dir = TELA.l + M.x - BORDA_AUTO, cima = -M.y + BORDA_AUTO + 20;
          if (p.x < esq) vx = -(esq - p.x) / 6; else if (p.x > dir) vx = (p.x - dir) / 6;
          if (p.y < cima && p.y > -M.y) vy = -(cima - p.y) / 7; else if (p.y > bauTopo() - 40 && p.y < bauTopo()) vy = (p.y - (bauTopo() - 40)) / 5;
          if (vx || vy) { moverCam(cam.x + vx, cam.y + vy); seguirDedo(); }
          autoRaf = requestAnimationFrame(passo);
        };
        autoRaf = requestAnimationFrame(passo);
      }
      function seguirDedo() {
        const g = gesto, w = telaParaMundo(g.ultimo);
        if (g.tipo === 'item') { const x0 = g.i.x, y0 = g.i.y; g.i.x = w.x - g.pegaX; g.i.y = w.y - g.pegaY; posicionar(g.i); moverJunto(g.i, g.i.x - x0, g.i.y - y0); }
        else if (g.tipo === 'plugue') { g.i.plugAqui = { x: w.x, y: w.y }; g.i.t = null; desenharFio(g.i); }
        else if (g.tipo === 'pipoca') { pip.x = w.x - g.pegaX; pip.y = w.y - g.pegaY; posPipoca(); sombraNoChao(); }
      }
      function soltarItem(i, sobreBau) {
        if (sobreBau) {
          // guardar no baú
          PC.som.soltar();
          i.el.remove();
          tirarFio(i);
          itens = itens.filter(o => o !== i);
          pedirLuz();
          // o que estava em cima cai
          emCima(i).forEach(o => { o.el.classList.remove('junto'); if (C.ITENS[o.id].gruda) soltarItem(o, true); else { o.sobre = null; pousar(o); } });
          if (C.ITENS[i.id].aba !== aba) aba = C.ITENS[i.id].aba;
          montarCartas();
          salvar();
          return;
        }
        i.el.classList.remove('pegado');
        pousar(i);
      }
      /** Acomoda i (e o que está em cima dele) e, se ficou no alto, cai até o tampo ou o chão (não aparece lá de repente). */
      function pousar(i) {
        const xAntes = i.x, yAntes = i.y;
        acomodar(i);
        moverJunto(i, i.x - xAntes, 0);
        if (C.ITENS[i.id].tipo === 'tapete') { camada.insertBefore(i.el, camada.firstChild); itens = C.ordenar(itens); }
        const chegou = () => {
          posicionar(i); conferirFio(i);
          const junto = [];
          const todos = o => emCima(o).forEach(d => { junto.push(d); todos(d); });
          todos(i);
          junto.forEach(o => { o.el.classList.remove('junto'); conferirFio(o); });
          aplicarPortas();
          i.el.classList.remove('assenta'); void i.el.offsetWidth; i.el.classList.add('assenta');
          PC.som.encaixar();
          salvar();
        };
        const yFinal = i.y;
        if (yFinal - yAntes > 30) {
          i.y = yAntes; i.yAlvo = yFinal;
          i.queda = cair(yAntes, yFinal, y => { const dy = y - i.y; i.y = y; posicionar(i); moverJunto(i, 0, dy); }, () => { i.queda = null; chegou(); });
        } else { moverJunto(i, 0, yFinal - yAntes); chegou(); }
      }
      /**
       * Queda com gravidade (para a Pipoca e para os móveis soltos no ar): acelera devagar, com uma velocidade máxima
       * gostosa de acompanhar com os olhos, e chama fim() ao tocar o chão. Subir (soltou abaixo do chão) é rápido e suave.
       */
      const quedas = new Set();
      function cair(y0, y1, aCada, fim) {
        const q = { vivo: true };
        quedas.add(q);
        let y = y0, v = 0, ult = performance.now();
        const G = 2600, VMAX = 1500;
        const passo = t => {
          if (!vivo || !q.vivo) { quedas.delete(q); return; }
          const dt = Math.min(.05, (t - ult) / 1000) * (PC.config && PC.config.rapido ? 4 : 1); ult = t;
          if (y1 >= y) { v = Math.min(VMAX, v + G * dt); y = Math.min(y1, y + v * dt); }
          else y = Math.max(y1, y - Math.max(200, (y - y1) * 10) * dt);
          aCada(y);
          if (y === y1) { quedas.delete(q); fim(); } else requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
        return q;
      }
      // Fora do chão (segurada no alto ou caindo) a Pipoca não leva a sombra nos pés: fica uma sombra no chão embaixo
      // dela, que cresce e escurece conforme ela chega perto.
      let quedaPipoca = null, sombraChao = null;
      function sombraNoChao() {
        const andar = andarEm(pip.x, pip.y - 60), chao = pisoDe(andar), alto = chao - pip.y;
        if (alto <= 8) { tirarSombraChao(); return; }
        if (!sombraChao) { sombraChao = U.el('div', { class: 'pc-casa-sombra' }); camada.insertBefore(sombraChao, pipEl); pipEl.classList.add('no-ar'); }
        const k = U.limitar(1 - alto / 700, 0, 1);
        sombraChao.style.left = pip.x + 'px'; sombraChao.style.top = chao + 'px';
        sombraChao.style.transform = `scale(${(.4 + .6 * k).toFixed(3)})`; sombraChao.style.opacity = (.3 + .7 * k).toFixed(2);
      }
      function tirarSombraChao() { if (sombraChao) { sombraChao.remove(); sombraChao = null; } pipEl.classList.remove('no-ar'); }
      function soltarPipoca() {
        const andar = andarEm(pip.x, pip.y - 60);
        const [xa, xb] = limitesX(andar);
        pip.x = U.limitar(pip.x, xa + 110, xb - 110);
        posPipoca();
        const chao = pisoDe(andar);
        const pousou = () => { quedaPipoca = null; tirarSombraChao(); rig.pose('normal'); rig.pular(14); PC.som.pulo(); salvar(); };
        if (chao - pip.y > 30) {
          // caindo: braços para cima, feliz ("uiii"), e pousa com um pulinho
          rig.pose('feliz');
          quedaPipoca = cair(pip.y, chao, y => { pip.y = y; posPipoca(); sombraNoChao(); }, pousou);
        } else { tirarSombraChao(); pip.y = chao; posPipoca(); rig.pular(12); salvar(); }
      }
      /** A Pipoca da casa fala (a boca mexe enquanto a voz toca). */
      let falaSeq = 0;
      function pipocaDiz(texto) {
        const meu = ++falaSeq;
        rig.falar(true);
        return PC.voz.falar(texto).then(() => { if (vivo && meu === falaSeq) rig.falar(false); });
      }
      function tocarItem(i) {
        i.el.classList.remove('pula', 'assenta'); void i.el.offsetWidth; i.el.classList.add('pula');
        PC.som.clique();
        const nome = C.ITENS[i.id].nome;
        pipocaDiz(/^[A-Z]$/.test(nome) ? Maiuscula(PC.palavras.falaLetra(nome)) + '!' : Maiuscula(nome) + '!');
        rig.olhar(Math.sign(i.x - pip.x), -.2, 1500);
      }
      let primeiraFala = true;
      function tocarPipoca() {
        rig.pular(30);
        PC.som.pulo();
        pipocaDiz(primeiraFala ? 'Esta é a minha casa! Tire coisas do baú e arrume do seu jeito.' : U.escolher(['Oi!', 'Que casa bonita!', 'Vamos brincar?']));
        primeiraFala = false;
      }
      desligar.push(PC.arrastar(janela, {
        aoPressionar: (p, ev) => {
          cancelAnimationFrame(inercia); cancelAnimationFrame(glide);
          const a = alvoDe(ev);
          gesto = a && a.item ? { tipo: 'item', i: a.item } : a && a.pipoca ? { tipo: 'pipoca' } : a && a.plugue ? { tipo: 'plugue', i: a.plugue }
            : { tipo: 'cam', cx: cam.x, cy: cam.y, hist: [] };
          gesto.ultimo = p;
        },
        aoComecar: p => {
          const g = gesto; if (!g) return;
          const w = telaParaMundo(g.ultimo);
          if (g.tipo === 'item') {
            if (g.i.queda) { g.i.queda.vivo = false; g.i.queda = null; }     // pegou no meio da queda
            g.pegaX = w.x - g.i.x; g.pegaY = w.y - g.i.y;
            g.i.sobre = null;                                                  // saiu de cima do móvel
            trazerParaFrente(g.i);
            trazerJunto(g.i, true);                                            // o que está em cima vai junto, na frente
            g.i.el.classList.add('pegado');
            PC.som.pegar();
            autoPasseio();
          } else if (g.tipo === 'pipoca') {
            if (quedaPipoca) { quedaPipoca.vivo = false; quedaPipoca = null; }
            g.pegaX = w.x - pip.x; g.pegaY = w.y - pip.y;
            rig.momento('surpresa', 900);
            autoPasseio();
          } else if (g.tipo === 'plugue') {
            const eraLigado = g.i.t != null;
            g.i.plugEl.classList.add('pegado');
            PC.som.pegar();
            if (eraLigado) { g.i.t = null; redesenharItem(g.i); }
            autoPasseio();
          }
        },
        aoMover: p => {
          const g = gesto; if (!g) return;
          g.ultimo = p;
          if (g.tipo === 'cam') {
            moverCam(g.cx - p.dx, g.cy - p.dy);
            g.hist.push({ t: performance.now(), x: p.x, y: p.y });
            if (g.hist.length > 6) g.hist.shift();
          } else seguirDedo();
        },
        aoSoltar: p => {
          const g = gesto; gesto = null; cancelAnimationFrame(autoRaf);
          if (!g) return;
          if (g.tipo === 'cam') {
            const h = g.hist, a = h[0], z = h[h.length - 1];
            if (a && z && z.t - a.t > 10 && performance.now() - z.t < 80) soltarComInercia((z.x - a.x) / ((z.t - a.t) / 1000), (z.y - a.y) / ((z.t - a.t) / 1000));
            else salvar();
          } else if (g.tipo === 'item') soltarItem(g.i, p.y > bauTopo());
          else if (g.tipo === 'pipoca') soltarPipoca();
          else if (g.tipo === 'plugue') soltarPlugue(g.i, telaParaMundo(p));
        },
        aoCancelar: () => {
          const g = gesto; gesto = null; cancelAnimationFrame(autoRaf);
          if (g && g.tipo === 'item') soltarItem(g.i, false);
          if (g && g.tipo === 'pipoca') soltarPipoca();
          if (g && g.tipo === 'plugue') soltarPlugue(g.i, posPlugue(g.i));
        },
        aoTocar: () => {
          const g = gesto; gesto = null;
          if (g && g.tipo === 'item') { if (modo === 'falar') tocarItem(g.i); else brincarCom(g.i); }
          else if (g && g.tipo === 'cam' && g.ultimo) tocarFixo(telaParaMundo(g.ultimo));
          else if (g && g.tipo === 'pipoca') tocarPipoca();
          else if (g && g.tipo === 'plugue') { PC.som.clique(); if (g.i.t == null) piscarTomada(tomadaMaisPerto(pontaFio(g.i), 99999, true, g.i)); }
        },
      }));

      // ------------------------------------------------------------ tirar do baú: arrastar a cartinha para cima
      let gBau = null;    // { tipo: 'rolar' | 'tirar', id, r0, i }
      desligar.push(PC.arrastar(vao, {
        aoPressionar: (p, ev) => {
          const c = ev && ev.target && ev.target.closest ? ev.target.closest('.pc-casa-carta') : null;
          gBau = { id: c && c.__id, carta: c, r0: rolagem };
        },
        aoComecar: p => {
          const g = gBau; if (!g) return;
          if (g.id && -p.dy > Math.abs(p.dx) * .45) {
            // vira um item de verdade, no tamanho da casa, embaixo do dedo
            g.tipo = 'tirar';
            const b = caixa(g.id);
            const w = telaParaMundo(p);
            const i = { id: g.id, x: w.x - (b.x + b.l / 2), y: w.y - (b.y + b.a / 2), k: 1, rot: 0 };
            itens.push(i);
            camada.insertBefore(elItem(i), pipEl);
            i.el.classList.add('pegado');
            g.carta.classList.add('saiu');
            gesto = { tipo: 'item', i, pegaX: w.x - i.x, pegaY: w.y - i.y, ultimo: p };
            PC.som.pegar();
            autoPasseio();
          } else g.tipo = 'rolar';
        },
        aoMover: p => {
          const g = gBau; if (!g) return;
          if (g.tipo === 'rolar') { rolagem = g.r0; rolar(-p.dx); }
          else if (g.tipo === 'tirar' && gesto) { gesto.ultimo = p; seguirDedo(); }
        },
        aoSoltar: p => {
          const g = gBau; gBau = null;
          if (g && g.tipo === 'tirar' && gesto) {
            const gi = gesto; gesto = null; cancelAnimationFrame(autoRaf);
            soltarItem(gi.i, p.y > bauTopo());
            montarCartas();
          }
        },
        aoCancelar: () => {
          const g = gBau; gBau = null;
          if (g && g.tipo === 'tirar' && gesto) { const gi = gesto; gesto = null; cancelAnimationFrame(autoRaf); soltarItem(gi.i, true); }
        },
        aoTocar: () => {
          const g = gBau; gBau = null;
          if (g && g.carta) {
            U.animar(g.carta, [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], { duration: 320 });
            pipocaDiz(Maiuscula(C.ITENS[g.id].nome) + '!');
          }
        },
      }));

      // ------------------------------------------------------------ começo
      // o que é de apoiar e ficou flutuando (casas guardadas antes das coisas se apoiarem) assenta no tampo ou no chão
      let assentou = false;
      itens.forEach(i => {
        if (C.ITENS[i.id].tipo !== 'apoia' || i.sobre) return;
        const x0 = i.x, y0 = i.y;
        acomodar(i);
        if (Math.abs(i.y - y0) > 1 || Math.abs(i.x - x0) > 1) assentou = true;
      });
      if (assentou) redesenharItens();      // (na ordem certa: quem está em cima de um móvel, na frente dele)
      montarCartas();
      cam.x = camIni.x; cam.y = camIni.y;
      margens();
      desligar.push(PC.palco.aoMudar(margens));
      if (PC.debug) PC.debug.casaPronta = false;
      pedacosPerto().then(() => { if (vivo) setTimeout(carregarRestante, U.duracao(400)); });
      const boasVindas = setTimeout(() => {
        if (!vivo) return;
        pipocaDiz(guardado ? 'Que bom que você voltou!' : 'Esta é a minha casa! Tire coisas do baú e arrume do seu jeito.')
          .then(() => { if (vivo) rig.pose('normal'); });
        primeiraFala = false;
      }, U.duracao(500));

      // ------------------------------------------------------------ testes (só no navegador)
      if (!PC.modoApp && PC.debug) {
        PC.debug.casa = {
          estado: () => ({ cam: { x: Math.round(cam.x), y: Math.round(cam.y) }, aba, bau: bauAberto, modo,
            itens: itens.map(i => ({ id: i.id, x: Math.round(i.x), y: Math.round(i.y), e: i.e, t: i.t, sobre: i.sobre ? i.sobre.id : null })), pipoca: { x: Math.round(pip.x), y: Math.round(pip.y) } }),
          /** põe um item da casa (do catálogo) em (x, y) do mundo, já acomodado */
          por: (id, x, y) => { const i = { id, x, y, k: 1, rot: 0, e: {}, t: null }; itens.push(i); camada.insertBefore(elItem(i), pipEl); acomodar(i); posicionar(i); if (acaoDe(id) && acaoDe(id).eletrico) desenharFio(i); montarCartas(); return true; },
          plugue: id => { const i = itens.find(o => o.id === id); return i && i.plugEl ? (() => { const b = posPlugue(i); return { x: Math.round(b.x - cam.x), y: Math.round(b.y - cam.y) }; })() : null; },
          tomada: k => ({ x: Math.round(C.TOMADAS[k].x - cam.x), y: Math.round(C.TOMADAS[k].y - cam.y) }),
          /** toca num item como no modo brincar (testes) */
          brincar: id => { const i = itens.find(o => o.id === id); if (!i) return false; brincarCom(i); return true; },
          /** liga o plugue do item na tomada k (testes) */
          ligar: (id, k) => { const i = itens.find(o => o.id === id); if (!i) return false; i.t = k; redesenharItem(i); desenharFio(i); return true; },
          /** pega o item e solta em (x, y), como o dedo faria (testes) */
          soltar: (id, x, y) => { const i = itens.find(o => o.id === id); if (!i) return false; if (i.queda) { i.queda.vivo = false; i.queda = null; } i.sobre = null; const x0 = i.x, y0 = i.y; i.x = x; i.y = y; posicionar(i); moverJunto(i, x - x0, y - y0); pousar(i); return true; },
          /** guarda o item no baú (testes) */
          guardar: id => { const i = itens.find(o => o.id === id); if (!i) return false; soltarItem(i, true); return true; },
          /** luz (testes): estado, noite(sim), janela(cômodo, k), interruptor(cômodo) */
          luz: () => ({ noite, noiteK, fechadas, acesas }),
          noite: v => { mudarNoite(!!v); return true; },
          janela: (nm, k) => { const j = luzDe(nm).janelas[k]; return tocarFixo({ x: j.x + j.w / 2, y: j.y + j.h / 2 }); },
          interruptor: nm => tocarFixo(luzDe(nm).interruptor),
          camera: (x, y) => moverCam(x, y),
          /** posição na TELA (px virtuais) de um ponto do mundo */
          naTela: (x, y) => ({ x: Math.round(x - cam.x), y: Math.round(y - cam.y) }),
        };
      }

      return {
        destruir() {
          if (!vivo) return;
          vivo = false;
          clearTimeout(boasVindas);
          cancelAnimationFrame(inercia); cancelAnimationFrame(glide); cancelAnimationFrame(autoRaf);
          if (timerSalvar) { clearTimeout(timerSalvar); timerSalvar = 0; PC.dados.extra('casa', paraGuardar()); }
          timersAcao.forEach(clearTimeout);
          rig.destruir();
          clearTimeout(timerPedacos);
          Object.keys(pedacos).forEach(soltarPedaco);
          desligar.forEach(f => { try { f(); } catch (e) { console.error(e); } });
          if (PC.debug && PC.debug.casa) delete PC.debug.casa;
        },
      };
    },
  });
})();
