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
  const M = s => s.charAt(0).toUpperCase() + s.slice(1);

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
      .pc-casa-item.pegado { will-change: transform; z-index: 5; }
      .pc-casa-item.pula { animation: pcCasaPula .45s cubic-bezier(.3, 1.6, .5, 1); }
      @keyframes pcCasaPula { 40% { transform: translateY(-26px) scale(1.04, .96); } 70% { transform: translateY(0) scale(.97, 1.03); } }
      .pc-casa-item.assenta { animation: pcCasaAssenta .32s ease-out; }
      @keyframes pcCasaAssenta { 0% { transform: scale(1.04, .94); } 60% { transform: scale(.98, 1.03); } }
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
      let itens = (guardado ? guardado.itens : C.inicial()).filter(i => C.ITENS[i.id]).map(i => ({ id: i.id, x: +i.x, y: +i.y, k: i.k || 1, rot: i.rot || 0 }));
      const pip = Object.assign({ x: 2150, y: C.BAIXO.piso }, guardado && guardado.pipoca);
      let bauAberto = guardado ? guardado.bau !== false : true;
      const camIni = guardado && guardado.cam ? guardado.cam : { x: pip.x - 760, y: C.BAIXO.piso + 70 - (TELA.a - BAU) };
      let timerSalvar = 0;
      function salvar() {
        clearTimeout(timerSalvar);
        timerSalvar = setTimeout(() => {
          PC.dados.extra('casa', { v: VERSAO, itens: itens.map(i => ({ id: i.id, x: Math.round(i.x), y: Math.round(i.y), k: i.k, rot: i.rot })),
            pipoca: { x: Math.round(pip.x), y: Math.round(pip.y) }, cam: { x: Math.round(cam.x), y: Math.round(cam.y) }, bau: bauAberto });
        }, 250);
      }

      // ------------------------------------------------------------ medir desenhos (caixa de cada item, guardada)
      const NS = 'http://www.w3.org/2000/svg';
      const medidor = document.createElementNS(NS, 'svg');
      medidor.setAttribute('style', 'position:absolute;left:-99999px;top:0;width:10px;height:10px;visibility:hidden');
      raiz.appendChild(medidor);
      const caixas = {};
      function caixa(id, k = 1, rot = 0) {
        const chave = id + '|' + k + '|' + rot;
        if (!caixas[chave]) {
          medidor.innerHTML = C.em(0, 0, k, C.desenho(id), rot);
          let b = { x: -50, y: -100, width: 100, height: 100 };
          try { const r = medidor.firstChild.getBBox(); if (r.width && r.height) b = { x: r.x, y: r.y, width: r.width, height: r.height }; } catch (e) { /* sem medida */ }
          caixas[chave] = { x: b.x - 6, y: b.y - 6, l: b.width + 12, a: b.height + 12 };
        }
        return caixas[chave];
      }

      // ------------------------------------------------------------ a janela e o mundo
      const janela = U.el('div', { class: 'pc-casa-janela' });
      const mundo = U.el('div', { class: 'pc-casa-mundo', style: `width:${C.W}px;height:${C.H}px` });
      const cenario = U.el('div', { class: 'pc-casa-cenario' });
      const camada = U.el('div', { class: 'pc-casa-itens' });
      mundo.append(cenario, camada);
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
        const b = caixa(i.id, i.k, i.rot);
        const el = U.svg(`<svg class="pc-casa-item" viewBox="${b.x} ${b.y} ${b.l} ${b.a}" width="${b.l}" height="${b.a}" xmlns="${NS}">${C.em(0, 0, i.k, C.desenho(i.id), i.rot)}</svg>`);
        el.dataset.teste = 'item-' + i.id;
        el.__item = i;
        i.el = el;
        posicionar(i);
        return el;
      }
      function posicionar(i) {
        const b = caixa(i.id, i.k, i.rot);
        i.el.style.left = (i.x + b.x) + 'px';
        i.el.style.top = (i.y + b.y) + 'px';
      }
      function redesenharItens() {
        camada.innerHTML = '';
        C.ordenar(itens).forEach(i => camada.appendChild(elItem(i)));
        itens = C.ordenar(itens);
        camada.appendChild(pipEl);
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

      // ------------------------------------------------------------ HUD: voltar e mapinha
      const hud = U.el('div', { class: 'hud pc-casa-hud' });
      const bVoltar = PC.ui.botaoIcone('voltar', 'Voltar', () => PC.telas.voltar());
      bVoltar.dataset.teste = 'voltar';
      const mapinha = U.el('div', { class: 'pc-casa-mapinha', teste: 'mapinha', role: 'button', 'aria-label': 'Mapa da casa' });
      mapinha.innerHTML = `<svg viewBox="0 ${C.TOPO} ${C.W} ${C.H - C.TOPO}" preserveAspectRatio="none" xmlns="${NS}">` +
        `<rect y="${C.TOPO}" width="${C.W}" height="${C.H - C.TOPO}" fill="#BFE8FF"/><rect y="${C.CHAO}" width="${C.W}" height="${C.H - C.CHAO}" fill="#7CCB5E"/>` +
        `<path d="M${C.CASA0 - 130} ${C.CIMA.topo} L ${C.CASA0 + 1430} ${C.CIMA.topo - 760} L ${C.CASA1 - 1430} ${C.CIMA.topo - 760} L ${C.CASA1 + 130} ${C.CIMA.topo} Z" fill="#FF7A6B"/>` +
        `<rect x="${C.CASA0}" y="${C.CIMA.topo}" width="${C.CASA1 - C.CASA0}" height="${C.CIMA.piso + 40 - C.CIMA.topo}" fill="#EDE3FF"/>` +
        `<rect x="${C.CASA0}" y="${C.BAIXO.topo}" width="${C.CASA1 - C.CASA0}" height="${C.BAIXO.piso + 40 - C.BAIXO.topo}" fill="#FFF1D9"/>` +
        `<rect x="${C.CASA0}" y="${C.CIMA.piso + 40}" width="${C.CASA1 - C.CASA0}" height="${C.BAIXO.topo - C.CIMA.piso - 40}" fill="#C9A77E"/>` +
        `<circle cx="8100" cy="1300" r="420" fill="#4FB83D"/><rect x="8070" y="1300" width="60" height="660" fill="#8A5A34"/>` +
        `<rect class="vista" width="${TELA.l}" height="${TELA.a}" fill="rgba(155,123,255,.18)" stroke="#9B7BFF" stroke-width="90"/></svg>`;
      const vistaMapa = mapinha.querySelector('.vista');
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
      hud.append(bVoltar, mapinha);
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
      const PAREDES = { cima: [4500], baixo: [4250] };
      function andarEm(x, y) {
        if (x > C.CASA0 && x < C.CASA1) return y < C.CIMA.piso + 70 ? 'cima' : 'baixo';
        return 'fora';
      }
      const pisoDe = andar => (andar === 'cima' ? C.CIMA.piso : andar === 'baixo' ? C.BAIXO.piso : C.CHAO);
      const topoDe = andar => (andar === 'cima' ? C.CIMA.topo : andar === 'baixo' ? C.BAIXO.topo : 40);
      function limitesX(andar) { return andar === 'fora' ? [20, C.W - 20] : [C.CASA0 + 24, C.CASA1 - 24]; }
      /** Acerta o lugar de um item solto em (x, y): móveis no chão do andar, soltos dentro do cômodo, nada atravessando parede. */
      function acomodar(i) {
        const it = C.ITENS[i.id], b = caixa(i.id, i.k, i.rot);
        const meioY = i.y + b.y + b.a / 2;
        let andar = andarEm(i.x, it.tipo === 'solto' ? meioY : i.y - 20);
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
        if (it.tipo === 'chao') i.y = piso;
        else if (it.tipo === 'tapete') i.y = piso + 10;
        else i.y = U.limitar(i.y, topoDe(andar) + 8 - b.y, piso + 36 - (b.y + b.a));
      }

      // ------------------------------------------------------------ gestos na casa: passear, arrastar coisas, tocar
      let gesto = null;   // { tipo: 'cam' | 'item' | 'pipoca', ... }
      let autoRaf = 0;
      function telaParaMundo(p) { return { x: p.x + cam.x, y: p.y + cam.y }; }
      function alvoDe(ev) {
        const t = ev && ev.target;
        if (!t || !t.closest) return null;
        if (t.closest('.pc-casa-pipoca')) return { pipoca: true };
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
          if (!gesto || (gesto.tipo !== 'item' && gesto.tipo !== 'pipoca') || !vivo) return;
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
        if (g.tipo === 'item') { g.i.x = w.x - g.pegaX; g.i.y = w.y - g.pegaY; posicionar(g.i); }
        else if (g.tipo === 'pipoca') { pip.x = w.x - g.pegaX; pip.y = w.y - g.pegaY; posPipoca(); }
      }
      function soltarItem(i, sobreBau) {
        if (sobreBau) {
          // guardar no baú
          PC.som.soltar();
          i.el.remove();
          itens = itens.filter(o => o !== i);
          if (C.ITENS[i.id].aba !== aba) aba = C.ITENS[i.id].aba;
          montarCartas();
          salvar();
          return;
        }
        acomodar(i);
        posicionar(i);
        if (C.ITENS[i.id].tipo === 'tapete') { camada.insertBefore(i.el, camada.firstChild); itens = C.ordenar(itens); }
        i.el.classList.remove('pegado', 'assenta'); void i.el.offsetWidth; i.el.classList.add('assenta');
        PC.som.encaixar();
        salvar();
      }
      function soltarPipoca() {
        const andar = andarEm(pip.x, pip.y - 60);
        const [xa, xb] = limitesX(andar);
        pip.x = U.limitar(pip.x, xa + 110, xb - 110);
        pip.y = pisoDe(andar);
        posPipoca();
        rig.pular(12);
        salvar();
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
        pipocaDiz(/^[A-Z]$/.test(nome) ? M(PC.palavras.falaLetra(nome)) + '!' : M(nome) + '!');
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
          gesto = a && a.item ? { tipo: 'item', i: a.item } : a && a.pipoca ? { tipo: 'pipoca' } : { tipo: 'cam', cx: cam.x, cy: cam.y, hist: [] };
          gesto.ultimo = p;
        },
        aoComecar: p => {
          const g = gesto; if (!g) return;
          const w = telaParaMundo(g.ultimo);
          if (g.tipo === 'item') {
            g.pegaX = w.x - g.i.x; g.pegaY = w.y - g.i.y;
            trazerParaFrente(g.i);
            g.i.el.classList.add('pegado');
            PC.som.pegar();
            autoPasseio();
          } else if (g.tipo === 'pipoca') {
            g.pegaX = w.x - pip.x; g.pegaY = w.y - pip.y;
            rig.momento('surpresa', 900);
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
        },
        aoCancelar: () => {
          const g = gesto; gesto = null; cancelAnimationFrame(autoRaf);
          if (g && g.tipo === 'item') soltarItem(g.i, false);
          if (g && g.tipo === 'pipoca') soltarPipoca();
        },
        aoTocar: () => {
          const g = gesto; gesto = null;
          if (g && g.tipo === 'item') tocarItem(g.i);
          else if (g && g.tipo === 'pipoca') tocarPipoca();
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
            pipocaDiz(M(C.ITENS[g.id].nome) + '!');
          }
        },
      }));

      // ------------------------------------------------------------ começo
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
          estado: () => ({ cam: { x: Math.round(cam.x), y: Math.round(cam.y) }, aba, bau: bauAberto,
            itens: itens.map(i => ({ id: i.id, x: Math.round(i.x), y: Math.round(i.y) })), pipoca: { x: Math.round(pip.x), y: Math.round(pip.y) } }),
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
          if (timerSalvar) { clearTimeout(timerSalvar); timerSalvar = 0; PC.dados.extra('casa', { v: VERSAO, itens: itens.map(i => ({ id: i.id, x: Math.round(i.x), y: Math.round(i.y), k: i.k, rot: i.rot })), pipoca: { x: Math.round(pip.x), y: Math.round(pip.y) }, cam: { x: Math.round(cam.x), y: Math.round(cam.y) }, bau: bauAberto }); }
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
