/* Pipoca Aprende — tela "album": o álbum que brinca (PROJETO.md 4, item 5). Dono: agente do álbum.
   Uma cena por região (Prado, Lagoa, Floresta), sem separar números e letras: o cenário da região e as 20 figurinhas
   das estações dela em lugares fixos — os 4 bichos grandes embaixo e as 16 coisas da casa em duas fileiras em cima
   (PC.figurinhas.lista: a cada 5 estações um bicho, nas outras uma coisa para a Casa da Pipoca). A figurinha ganha fica colada no seu lugar; tocar nela:
   som do bicho, pulinho e a Pipoca diz o nome. As que faltam são molduras tracejadas vazias (sem silhueta, sem "?").
   Contador "12 de 60" no alto (tocar: a Pipoca diz quantas são). Troca de cena pelas abas grandes do alto ou
   arrastando o dedo para o lado. A figurinha que a criança ainda não viu no álbum chega "colando" na primeira vez
   que a cena dela aparece (PC.dados.extra('album-vistas')). Voltar (botão ou Android) → mapa.
   params: { pagina: 'prado' | 'lagoa' | 'floresta' } (opcional;
   o padrão é a cena da figurinha mais nova).
   data-teste: voltar, pagina-<pagina>, contador, pipoca, figurinha-figNN (ganha),
   vazia-figNN (moldura vazia).
   Testes (só no navegador): PC.debug.album.estado(), PC.debug.album.pagina(id); {"gesto": true} toca na próxima
   figurinha ainda não tocada (ou na aba da cena que ainda tem uma). */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  // três cenas, uma por região (as abas mostram o emblema e o nome da região)
  const PAGINAS = ['prado', 'lagoa', 'floresta'];
  const regiaoDa = id => id;
  let comemorouCompleto = false;      // a festa do álbum completo acontece uma vez cada vez que o jogo abre
  const OCIOSO_MS = 12000;            // parada sem tocar: a Pipoca convida (uma vez por visita)
  const LIMIAR_PAGINA = 120;          // arraste para o lado (px virtuais) que troca de cena
  const FOLGA_TOQUE = 44;             // dedo que escorregou até isso ainda é um toque na figurinha

  // Lugar de cada figurinha na cena: [x, y] do centro (px virtuais), lado, giro (graus). As 16 coisas da casa em duas
  // fileiras de 8 (em cima) e os 4 bichos maiores embaixo, longe da faixa de cima (y < 150) e do canto da Pipoca.
  const GIROS = [-4, 3, -2, 5, -5, 2, 4, -3];
  function lugarDe(fig, ordem) {
    if (fig.tipo !== 'casa') return [[700, 948, 1196, 1444][ordem % 4], 742, 214, [-3, 2, -2, 3][ordem % 4]];
    const fila = Math.floor(ordem / 8), col = ordem % 8;
    return [300 + col * 170, 262 + fila * 168, 150, GIROS[(col + fila * 3) % 8]];
  }

  // som e pulinho de cada tipo de figurinha (PC.figurinhas.lista[].tipo)
  const SONS = { ave: 'piu', mamifero: 'pulo', anfibio: 'pulo', reptil: 'encaixar', inseto: 'pegar', peixe: 'bolha',
    planta: 'pagina', fungo: 'bolha', pipoca: 'figurinha', casa: 'encaixar' };
  const PULOS = {
    padrao: [
      { transform: 'translateY(0) scale(1, 1)' }, { transform: 'translateY(-46px) scale(.95, 1.06)', offset: 0.35 },
      { transform: 'translateY(0) scale(1.07, .93)', offset: 0.68 }, { transform: 'translateY(-8px) scale(.98, 1.02)', offset: 0.84 },
      { transform: 'translateY(0) scale(1, 1)' }],
    inseto: [
      { transform: 'translate(0, 0) rotate(0deg)' }, { transform: 'translate(-12px, -34px) rotate(-10deg)', offset: 0.3 },
      { transform: 'translate(12px, -42px) rotate(9deg)', offset: 0.55 }, { transform: 'translate(-4px, -12px) rotate(-4deg)', offset: 0.8 },
      { transform: 'translate(0, 0) rotate(0deg)' }],
    peixe: [
      { transform: 'translate(0, 0) rotate(0deg)' }, { transform: 'translate(-14px, -22px) rotate(-9deg)', offset: 0.25 },
      { transform: 'translate(14px, -34px) rotate(9deg)', offset: 0.5 }, { transform: 'translate(-6px, -10px) rotate(-4deg)', offset: 0.75 },
      { transform: 'translate(0, 0) rotate(0deg)' }],
    planta: [
      { transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(-28px) rotate(-7deg)', offset: 0.3 },
      { transform: 'translateY(0) rotate(6deg)', offset: 0.6 }, { transform: 'translateY(0) rotate(-3deg)', offset: 0.8 },
      { transform: 'translateY(0) rotate(0deg)' }],
    pipoca: [
      { transform: 'translateY(0) rotate(0deg) scale(1)' }, { transform: 'translateY(-64px) rotate(-180deg) scale(1.08)', offset: 0.45 },
      { transform: 'translateY(0) rotate(-360deg) scale(1.06, .94)', offset: 0.8 }, { transform: 'translateY(0) rotate(-360deg) scale(1)' }],
  };
  const PULO_DO_TIPO = { inseto: 'inseto', peixe: 'peixe', planta: 'planta', fungo: 'planta', pipoca: 'pipoca' };
  const COLAR = [
    { transform: 'scale(1.6) rotate(14deg)', opacity: 0 }, { transform: 'scale(.9) rotate(-3deg)', opacity: 1, offset: 0.6 },
    { transform: 'scale(1.05) rotate(1deg)', opacity: 1, offset: 0.8 }, { transform: 'scale(1) rotate(0deg)', opacity: 1 }];

  const FALAS = {
    entrada: 'Seu álbum! Toque numa figurinha.',
    vazio: 'Brinque na trilha e ganhe figurinhas!',
    nova: 'Figurinha nova! Toque nela.',
    novas: 'Figurinhas novas! Toque nelas.',
    completo: 'Álbum completo! Sessenta figurinhas!',
    lugarVazio: 'Aqui ainda está vazio.',
    convite: 'Toque numa figurinha!',
    outraCena: 'Suas figurinhas estão aqui!',
    nenhuma: 'Nenhuma figurinha ainda.',
  };

  // emblema de cada região nas abas (desenho próprio, viewBox 0 0 64 64)
  const EMBLEMAS = {
    prado: '<svg viewBox="0 0 64 64" aria-hidden="true">' + [0, 72, 144, 216, 288].map(a =>
      `<ellipse cx="32" cy="18" rx="9.5" ry="13" transform="rotate(${a} 32 32)" fill="#FF8FC2" stroke="#3A2A5A" stroke-width="3.5"/>`).join('') +
      '<circle cx="32" cy="32" r="8.5" fill="#FFC93C" stroke="#3A2A5A" stroke-width="3.5"/></svg>',
    lagoa: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6 C 26 16 12 30 12 40 A 20 20 0 0 0 52 40 C 52 30 38 16 32 6 Z" fill="#7CC4FF" stroke="#3A2A5A" stroke-width="4" stroke-linejoin="round"/>' +
      '<ellipse cx="24" cy="41" rx="5" ry="8" fill="#fff" opacity=".7"/></svg>',
    floresta: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="27" y="38" width="10" height="20" rx="3" fill="#8A5A34" stroke="#3A2A5A" stroke-width="3.5"/>' +
      '<circle cx="32" cy="27" r="20" fill="#5CC84A" stroke="#3A2A5A" stroke-width="4"/><circle cx="25" cy="20" r="5" fill="#fff" opacity=".35"/></svg>',
  };

  function estilos() {
    U.estilo('album', `
      .tela-album .pc-album-fundo { z-index: 0; }
      .tela-album .pc-album-fundo[hidden] { display: none; }
      .pc-album-camada { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; z-index: 10; }
      .pc-album-cena { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
      .pc-album-cena[hidden] { display: none; }
      .pc-album-cena.saindo { pointer-events: none; }
      .pc-album-slot { position: absolute; transform: rotate(var(--giro)); cursor: pointer; }
      .pc-album-slot img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block; pointer-events: none;
        -webkit-user-drag: none; transform-origin: 50% 80%; transition: transform .08s; }
      .pc-album-slot.tipo-pipoca img { transform-origin: 50% 55%; }
      .pc-album-slot.apertado img { transform: scale(.93); }
      .pc-album-moldura { position: absolute; left: 18px; top: 18px; right: 18px; bottom: 18px; border-radius: 40px;
        border: 7px dashed rgba(58, 42, 90, .42); background: rgba(255, 255, 255, .38); pointer-events: none; }
      .pc-album-slot.apertado .pc-album-moldura { background: rgba(255, 255, 255, .6); }

      .pc-album-topo { position: absolute; left: 0; top: 0; width: 1600px; height: 0; z-index: 60; }
      .tela-album .hud .botao-icone::before { content: ''; position: absolute; left: -20px; top: -20px; right: -20px; bottom: -20px; border-radius: 50%; }
      .pc-album-abas { position: absolute; left: 768px; top: 6px; transform: translateX(-50%); display: flex; gap: 10px; }
      .pc-album-aba { position: relative; width: 178px; height: 142px; padding: 0; border: 0; background: none; cursor: pointer;
        touch-action: manipulation; display: grid; place-items: center; }
      .pc-album-aba .pc-album-aba-cara { width: 170px; height: 118px; border-radius: 30px; display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 2px; padding: 0; background: var(--claro); border: 5px solid var(--tinta); box-shadow: 0 7px 0 var(--tinta);
        font: 700 37px/1 var(--fonte); color: var(--tinta); transition: transform .12s, box-shadow .12s; white-space: nowrap; }
      .pc-album-aba .pc-album-aba-cara svg { width: 50px; height: 50px; flex: none; display: block; }
      .pc-album-aba .pc-album-aba-cara > span { font-size: 27px; letter-spacing: .01em; }
      .pc-album-aba.ativa .pc-album-aba-cara { background: var(--cor); color: #fff; -webkit-text-stroke: 3px var(--tinta); paint-order: stroke fill;
        transform: translateY(4px) scale(1.06); box-shadow: 0 0 0 5px #fff, 0 7px 0 5px var(--tinta); }
      .pc-album-aba.apertado .pc-album-aba-cara { transform: translateY(6px) scale(.97); box-shadow: 0 2px 0 var(--tinta); }
      .pc-album-novo { position: absolute; right: 2px; top: 0; width: 46px; height: 46px; pointer-events: none; display: none; }
      .pc-album-novo svg { width: 100%; height: 100%; display: block; }
      .pc-album-aba.tem-nova .pc-album-novo { display: block; }

      .pc-album-contador { position: absolute; right: 16px; top: 4px; width: 300px; height: 144px; padding: 0; border: 0; background: none;
        cursor: pointer; touch-action: manipulation; display: grid; place-items: center; }
      .pc-album-contador .pc-album-placar { display: flex; align-items: center; gap: 9px; height: 100px; padding: 0 24px 0 12px; border-radius: 50px;
        background: #fff; border: 5px solid var(--tinta); box-shadow: 0 7px 0 rgba(58, 42, 90, .3); font: 700 50px/1 var(--fonte);
        color: var(--tinta); white-space: nowrap; transition: transform .1s; }
      .pc-album-contador .pc-album-placar svg { width: 62px; height: 62px; flex: none; display: block; }
      .pc-album-contador .pc-album-placar small { font: 600 36px/1 var(--fonte); color: var(--tinta-suave); }
      .pc-album-contador.completo .pc-album-placar { background: #FFE27A; }
      .pc-album-contador.apertado .pc-album-placar { transform: scale(.95); }
      .pc-album-contador.pula .pc-album-placar { animation: pcAlbumPlacar .5s cubic-bezier(.3, 1.6, .5, 1); }
      @keyframes pcAlbumPlacar { 40% { transform: scale(1.12); } }
    `);
  }

  /** O desenho da figurinha como imagem: um elemento só por figurinha e nenhum conflito de ids. */
  const uriFigurinha = id => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PC.figurinhas.desenho(id));
  const estrelaNova = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4 L 39 22 L 58 24 L 44 37 L 48 56 L 32 46 L 16 56 L 20 37 L 6 24 L 25 22 Z" ' +
    'fill="#FFE27A" stroke="#3A2A5A" stroke-width="4.5" stroke-linejoin="round"/><circle cx="26" cy="26" r="4" fill="#fff" opacity=".7"/></svg>';

  PC.telas.registrar('album', {
    voltarPara: 'mapa',
    criar(raiz, params) {
      estilos();
      params = params || {};
      let vivo = true, atual = 0, seqTroca = 0, falaSeq = 0, convidou = false, timerOcioso = 0;
      let gesto = null;                         // toque/arraste em andamento na camada das cenas
      let dica = null;                          // mãozinha da sugestão da Pipoca
      let animandoAte = 0;                      // troca de cena ou figurinhas colando (testes: tela ocupada)
      const tocadas = new Set();                // figurinhas que a criança tocou nesta visita
      const timers = [], desligar = [];
      const depois = (ms, fn) => { const t = setTimeout(() => { if (vivo) fn(); }, U.duracao(ms)); timers.push(t); return t; };
      const animando = ms => { animandoAte = Math.max(animandoAte, performance.now() + U.duracao(ms)); };
      const ocupada = () => vivo && performance.now() < animandoAte;

      const lista = PC.figurinhas.lista;
      const tem = PC.dados.figurinhas();
      const total = lista.length;
      const ganhas = lista.filter(f => tem.has(f.id)).length;
      let vistas = new Set();
      try { const v = PC.dados.extra('album-vistas'); if (Array.isArray(v)) vistas = new Set(v.filter(s => typeof s === 'string')); } catch (e) { /* ok */ }
      const salvarVistas = () => { try { PC.dados.extra('album-vistas', lista.filter(f => vistas.has(f.id)).map(f => f.id)); } catch (e) { console.error(e); } };

      // ------------------------------------------------------------ cenários (um por região) e as cenas
      const fundos = PAGINAS.map(id => {
        const regiao = PC.regioes.find(r => r.id === regiaoDa(id));
        const f = PC.arte.cenario((regiao && regiao.cenario) || regiaoDa(id));
        f.classList.add('pc-album-fundo');
        f.hidden = true;
        raiz.appendChild(f);
        return f;
      });
      const camada = U.el('div', { class: 'pc-album-camada' });
      raiz.appendChild(camada);

      const slots = {};                         // id -> { el, img, fig, ganha, pagina }
      const cenas = PAGINAS.map((id, pagina) => {
        const cena = U.el('div', { class: 'pc-album-cena', 'data-pagina': id, hidden: true });
        const daCena = lista.filter(f => f.regiao === regiaoDa(id));
        const bichos = daCena.filter(f => f.tipo !== 'casa'), coisas = daCena.filter(f => f.tipo === 'casa');
        daCena.forEach(fig => {
          const lugar = lugarDe(fig, fig.tipo === 'casa' ? coisas.indexOf(fig) : bichos.indexOf(fig));
          const [x, y, lado, rot] = lugar;
          const ganha = tem.has(fig.id);
          const el = U.el('div', {
            class: 'pc-album-slot ' + (ganha ? 'ganha' : 'vazia') + ' tipo-' + fig.tipo,
            teste: (ganha ? 'figurinha-' : 'vazia-') + fig.id,
            role: 'button',
            'aria-label': ganha ? fig.nome : 'Lugar vazio',
            style: `left:${x - lado / 2}px;top:${y - lado / 2}px;width:${lado}px;height:${lado}px;--giro:${rot}deg`,
          });
          el.dataset.fig = fig.id;
          let img = null;
          if (ganha) { img = U.el('img', { src: uriFigurinha(fig.id), alt: '', draggable: 'false' }); el.appendChild(img); }
          else el.appendChild(U.el('div', { class: 'pc-album-moldura' }));
          slots[fig.id] = { el, img, fig, ganha, pagina, x, y };
          cena.appendChild(el);
        });
        camada.appendChild(cena);
        return cena;
      });
      const ganhasNa = pagina => lista.filter(f => slots[f.id] && slots[f.id].pagina === pagina && slots[f.id].ganha);
      const novasNa = pagina => ganhasNa(pagina).filter(f => !vistas.has(f.id));

      // ------------------------------------------------------------ alto: voltar, abas e contador
      const topo = U.el('div', { class: 'pc-album-topo' });
      const bVoltar = PC.ui.botaoIcone('voltar', 'Voltar', () => PC.telas.voltar());
      bVoltar.dataset.teste = 'voltar';
      const hud = U.el('div', { class: 'hud' }, U.el('div', { class: 'hud-esq' }, bVoltar));
      const abas = PAGINAS.map((id, pagina) => {
        const regiao = PC.regioes.find(r => r.id === regiaoDa(id)) || { nome: id, cor: '#5CC84A' };
        const aba = U.el('button', { type: 'button', class: 'pc-album-aba', teste: 'pagina-' + id,
          'aria-label': regiao.nome,
          style: `--cor:${regiao.cor};--claro:${U.tom(regiao.cor, 0.62)}` },
          U.el('span', { class: 'pc-album-aba-cara', html: EMBLEMAS[regiaoDa(id)] || '' }, U.el('span', { text: regiao.nome })),
          U.el('span', { class: 'pc-album-novo', html: estrelaNova }));
        PC.aoTocar(aba, () => {
          if (pagina !== atual) { irPara(pagina, pagina > atual ? 1 : -1); return; }
          // a aba da cena que já está aberta: a Pipoca só diz o nome da região
          PC.som.clique();
          voltarCena();
          falar(regiao.nome + '!', { pose: 'aponta' });
        }, { som: false });
        return aba;
      });
      const contador = U.el('button', { type: 'button', class: 'pc-album-contador' + (ganhas >= total ? ' completo' : ''), teste: 'contador',
        'aria-label': ganhas + ' de ' + total + ' figurinhas' },
        U.el('span', { class: 'pc-album-placar', html: PC.arte.icone('figurinha') },
          U.el('b', { text: String(ganhas) }), U.el('small', { text: 'de' }), U.el('b', { text: String(total) })));
      PC.aoTocar(contador, dizerQuantas, { som: false });
      topo.append(U.el('div', { class: 'pc-album-abas' }, abas), contador);
      raiz.append(hud, topo);

      function marcarAbas() {
        abas.forEach((a, i) => {
          a.classList.toggle('ativa', i === atual);
          a.setAttribute('aria-pressed', i === atual ? 'true' : 'false');
          a.classList.toggle('tem-nova', i !== atual && novasNa(i).length > 0);
        });
      }

      // ------------------------------------------------------------ a Pipoca (diz os nomes)
      PC.ui.pipoca.montar(raiz);
      const corpo = PC.ui.pipoca.elemento && PC.ui.pipoca.elemento.querySelector('.pipoca-corpo');
      if (corpo) corpo.dataset.teste = 'pipoca';
      function falar(texto, { pose = 'fala', mostrar = null } = {}) {
        if (!vivo || !texto) return Promise.resolve('muda');
        const meu = ++falaSeq;
        PC.ui.pipoca.pose(pose);
        return PC.ui.pipoca.dizer(texto, { mostrar }).then(r => {
          if (vivo && meu === falaSeq) PC.ui.pipoca.pose('normal');
          return r;
        });
      }

      // ------------------------------------------------------------ tocar nas figurinhas
      function cancelarAnimacoes(el) {
        try { el.getAnimations().forEach(a => a.cancel()); } catch (e) { /* navegador antigo */ }
      }
      function brincar(s) {
        const fig = s.fig;
        const som = SONS[fig.tipo] || 'pulo';
        if (PC.som && PC.som[som]) PC.som[som]();
        cancelarAnimacoes(s.img);
        U.animar(s.img, PULOS[PULO_DO_TIPO[fig.tipo] || 'padrao'], { duration: fig.tipo === 'pipoca' ? 760 : 600, easing: 'ease-out' });
        falar(PC.figurinhas.fala(fig.id), { pose: 'aponta' });
        tocadas.add(fig.id);
        if (!vistas.has(fig.id)) { vistas.add(fig.id); salvarVistas(); marcarAbas(); }
      }
      function balancarVazia(s) {
        PC.som.soltar();
        const m = s.el.firstChild;
        cancelarAnimacoes(m);
        U.animar(m, [{ transform: 'translateX(0)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(8px)' },
          { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], 360);
        falar(FALAS.lugarVazio, { pose: 'normal' });
      }
      function tocarSlot(el) {
        if (!vivo || !el) return;
        const s = slots[el.dataset.fig];
        if (!s || s.pagina !== atual) return;
        if (s.ganha) brincar(s); else balancarVazia(s);
      }

      function dizerQuantas() {
        if (!vivo) return;
        PC.som.clique();
        contador.classList.remove('pula'); void contador.offsetWidth; contador.classList.add('pula');
        let texto;
        if (!ganhas) texto = FALAS.nenhuma;
        else texto = 'Você tem ' + PC.voz.quantidade(ganhas, 'figurinha', 'figurinhas', { feminino: true }) + '!' + (ganhas >= total ? ' Álbum completo!' : '');
        falar(texto, { pose: 'feliz', mostrar: ganhas });
      }

      // ------------------------------------------------------------ trocar de cena
      /** Faz as figurinhas novas da cena chegarem "colando". Devolve quantas eram. */
      function colarNovas(pagina, atraso) {
        const novas = novasNa(pagina);
        if (!novas.length) return 0;
        const pedacos = Math.max(6, Math.floor(48 / novas.length));
        const passo = novas.length > 4 ? 170 : 230;
        animando(atraso + (novas.length - 1) * passo + 600);
        novas.forEach((f, i) => {
          const s = slots[f.id];
          cancelarAnimacoes(s.img);
          U.animar(s.img, COLAR, { duration: 560, delay: atraso + i * passo, easing: 'ease-out', fill: 'backwards' });
          depois(atraso + i * passo + 200, () => {
            if (i === 0) PC.som.figurinha(); else PC.som.bolha();
            if (pagina === atual) PC.ui.confete({ x: s.x, y: s.y, quantidade: pedacos, raiz, espalhar: 0.45 });
          });
          vistas.add(f.id);
        });
        salvarVistas();
        return novas.length;
      }
      function voltarCena() {
        const cena = cenas[atual];
        const x0 = parseFloat(cena.style.transform.replace(/[^\d.-]+/g, ' ').trim()) || 0;
        cena.style.transform = '';
        if (Math.abs(x0) > 1) U.animar(cena, [{ transform: `translateX(${x0}px)` }, { transform: 'translateX(0)' }], { duration: 260, easing: 'ease-out' });
      }
      /** Mostra a cena `pagina`. dir = 1 (a nova vem da direita) ou -1. */
      function irPara(pagina, dir, { inicio = false } = {}) {
        if (!vivo || pagina < 0 || pagina >= PAGINAS.length) return;
        if (pagina === atual && !inicio) { voltarCena(); return; }
        const de = atual, meu = ++seqTroca;
        atual = pagina;
        // cenários: o novo aparece por cima do velho
        fundos.forEach((f, i) => {
          cancelarAnimacoes(f);
          f.style.zIndex = i === pagina ? '1' : '0';
          f.hidden = !(i === pagina || (i === de && !inicio));
        });
        // cenas: a velha sai para um lado e a nova entra do outro
        cenas.forEach((c, i) => {
          cancelarAnimacoes(c);
          if (i !== pagina && (i !== de || inicio)) { c.hidden = true; c.style.transform = ''; c.classList.remove('saindo'); }
        });
        const nova = cenas[pagina];
        nova.hidden = false;
        nova.classList.remove('saindo');
        nova.style.transform = '';
        marcarAbas();
        if (inicio) return;
        animando(400);
        const velha = cenas[de];
        const x0 = parseFloat(velha.style.transform.replace(/[^\d.-]+/g, ' ').trim()) || 0;
        velha.style.transform = '';
        velha.classList.add('saindo');
        U.animar(fundos[pagina], [{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: 'ease-out' }).then(() => {
          if (meu === seqTroca) fundos.forEach((f, i) => { f.hidden = i !== atual; });
        });
        U.animar(velha, [{ transform: `translateX(${x0}px)`, opacity: 1 }, { transform: `translateX(${-dir * 260}px)`, opacity: 0 }],
          { duration: 260, easing: 'ease-in' }).then(() => {
          if (meu !== seqTroca) return;
          velha.classList.remove('saindo');
          if (cenas.indexOf(velha) !== atual) velha.hidden = true;
        });
        U.animar(nova, [{ transform: `translateX(${dir * 260}px)`, opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }],
          { duration: 340, easing: 'cubic-bezier(.2, .8, .3, 1)' });
        PC.som.pagina();
        const n = colarNovas(pagina, 260);
        const regiao = PC.regioes.find(r => r.id === regiaoDa(PAGINAS[pagina]));
        falar(n ? (n > 1 ? FALAS.novas : FALAS.nova) : (regiao ? regiao.nome + '!' : ''), { pose: n ? 'feliz' : 'aponta' });
      }

      // ------------------------------------------------------------ dedo: toque na figurinha ou arraste para trocar de cena
      const naBorda = d => (atual === 0 && d > 0) || (atual === PAGINAS.length - 1 && d < 0);
      function soltarAlvo() { if (gesto && gesto.alvo) gesto.alvo.classList.remove('apertado'); }
      desligar.push(PC.arrastar(camada, {
        podeComecar: () => vivo,
        aoPressionar(p, ev) {
          soltarAlvo();                         // garantia: nenhum "apertado" sobrando de um gesto anterior
          const alvo = ev && ev.target && ev.target.closest ? ev.target.closest('.pc-album-slot') : null;
          gesto = { alvo: alvo && camada.contains(alvo) ? alvo : null, arrastou: false };
          if (gesto.alvo) gesto.alvo.classList.add('apertado');
        },
        aoComecar() {
          if (!gesto) gesto = { alvo: null, arrastou: false };
          cancelarAnimacoes(cenas[atual]);
        },
        aoMover(p) {
          if (!gesto) return;
          if (!gesto.arrastou && Math.abs(p.dx) < 24) return;
          if (!gesto.arrastou) { gesto.arrastou = true; soltarAlvo(); }
          const v = naBorda(p.dx) ? p.dx * 0.16 : p.dx * 0.5;
          cenas[atual].style.transform = `translateX(${Math.round(v)}px)`;
        },
        aoSoltar(p) {
          const g = gesto; gesto = null;
          if (g && g.alvo) g.alvo.classList.remove('apertado');
          const dx = p.dx, dy = p.dy;
          if (Math.abs(dx) > LIMIAR_PAGINA && Math.abs(dx) > Math.abs(dy) * 1.3 && !naBorda(dx)) {
            irPara(atual + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
            return;
          }
          voltarCena();
          if (g && g.alvo && Math.abs(dx) < FOLGA_TOQUE && Math.abs(dy) < FOLGA_TOQUE) tocarSlot(g.alvo);
        },
        aoCancelar() { soltarAlvo(); gesto = null; voltarCena(); },
        // o sistema cancelou o toque antes de virar toque ou arraste (pointercancel): a figurinha não fica apertada
        aoDesistir() { soltarAlvo(); gesto = null; },
        aoTocar() {
          const g = gesto; gesto = null;
          if (g && g.alvo) { g.alvo.classList.remove('apertado'); tocarSlot(g.alvo); }
        },
      }));

      // ------------------------------------------------------------ convite quando a criança fica parada (uma vez)
      function armarOcioso() { clearTimeout(timerOcioso); if (vivo && !convidou) timerOcioso = setTimeout(convidar, OCIOSO_MS); }
      function convidar() {
        if (!vivo || convidou) return;
        if (document.hidden || PC.ui.pipoca.falando() || PC.arrastar.ativo()) { timerOcioso = setTimeout(convidar, 3000); return; }
        if (!ganhas) return;
        convidou = true;
        sugerir();
      }
      /** A Pipoca sugere o que fazer (parada longa ou toque nela), com a mãozinha. */
      function sugerir() {
        if (!vivo) return;
        if (dica) { dica.parar(); dica = null; }
        if (!ganhas) { falar(FALAS.vazio, { pose: 'normal' }); return; }
        const aqui = ganhasNa(atual);
        if (aqui.length) {
          // a mãozinha toca na figurinha mais nova desta cena
          const s = slots[aqui[aqui.length - 1].id];
          dica = PC.ui.dica({ x: s.x, y: s.y }, null, { raiz, vezes: 2 });
          falar(FALAS.convite, { pose: 'aponta' });
          return;
        }
        // cena sem figurinha: a mãozinha mostra a aba de uma cena que tem (por cima das abas)
        const outra = PAGINAS.findIndex((id, i) => ganhasNa(i).length > 0);
        if (outra >= 0) {
          const r = PC.palco.retangulo(abas[outra]);
          dica = PC.ui.dica({ x: r.cx, y: r.cy }, null, { raiz: topo, vezes: 2 });
        }
        falar(FALAS.outraCena, { pose: 'aponta' });
      }
      let tocou = false;                        // a criança já tocou em alguma coisa nesta visita
      desligar.push(PC.on('toque', () => { tocou = true; armarOcioso(); }));
      desligar.push(PC.on('pipoca:tocada', () => { if (vivo) { tocou = true; sugerir(); } }));

      // ------------------------------------------------------------ abertura: a cena da figurinha mais nova
      let inicial = PAGINAS.indexOf(params.pagina);
      if (inicial < 0) {
        let maisNova = null;                      // o Set guarda a ordem em que as figurinhas foram ganhas
        tem.forEach(id => { if (slots[id]) maisNova = id; });
        inicial = maisNova ? slots[maisNova].pagina : 0;
      }
      atual = inicial;
      irPara(inicial, 1, { inicio: true });
      const seqInicial = seqTroca;
      const novasAgora = colarNovas(inicial, 450);
      marcarAbas();
      depois(novasAgora ? 450 + novasAgora * (novasAgora > 4 ? 170 : 230) + 300 : 500, () => {
        // se a criança já tocou em alguma coisa (trocou de cena, ouviu um nome), não fala por cima
        if (seqTroca === seqInicial && !tocou) {
          if (ganhas >= total) falar(FALAS.completo, { pose: 'feliz' });
          else if (novasAgora) falar(novasAgora > 1 ? FALAS.novas : FALAS.nova, { pose: 'feliz' });
          else if (ganhas && !ganhasNa(inicial).length) sugerir();        // abriu (params.pagina) numa cena ainda vazia
          else falar(ganhas ? FALAS.entrada : FALAS.vazio, { pose: ganhas ? 'aponta' : 'normal' });
        }
        if (ganhas >= total && !comemorouCompleto) {
          comemorouCompleto = true;                 // a festa do álbum completo: uma vez cada vez que o jogo abre
          PC.som.festa();
          PC.ui.confete({ x: 800, y: 300, quantidade: 60, raiz, espalhar: 1.2 });
        }
      });
      armarOcioso();

      // ------------------------------------------------------------ testes (só no navegador)
      // PC.debug.album: estado(), pagina(id). O passo {"gesto": true} do testador toca na próxima figurinha ganha
      // desta cena que ainda não foi tocada nesta visita; acabou a cena, toca na aba de outra cena que ainda tem.
      // {"esperar": "ocioso"} também espera a troca de cena e as figurinhas novas colarem (PC.debug.telaOcupada).
      let dbg = null, gestoDbg = null, ocupadaDbg = null;
      if (!PC.modoApp && PC.debug) {
        dbg = {
          estado: () => ({
            pagina: PAGINAS[atual], ganhas, total, vistas: lista.filter(f => vistas.has(f.id)).map(f => f.id),
            tocadas: lista.filter(f => tocadas.has(f.id)).map(f => f.id),
            visiveis: Array.from(cenas[atual].querySelectorAll('[data-teste]')).map(el => el.dataset.teste),
            cenasVisiveis: cenas.filter(c => !c.hidden).length, convidou, animando: ocupada(),
            contador: contador.textContent.replace(/\s+/g, ' ').trim(),
          }),
          pagina: id => { const i = PAGINAS.indexOf(id); if (i >= 0) irPara(i, i > atual ? 1 : -1); return PAGINAS[atual]; },
        };
        PC.debug.album = dbg;
        gestoDbg = () => {
          if (!vivo || ocupada() || gesto) return null;
          const aqui = ganhasNa(atual).filter(f => !tocadas.has(f.id));
          if (aqui.length) { const s = slots[aqui[0].id]; return { tipo: 'tocar', em: { x: s.x, y: s.y } }; }
          const outra = PAGINAS.findIndex((id, i) => i !== atual && ganhasNa(i).some(f => !tocadas.has(f.id)));
          if (outra < 0) return null;
          const r = PC.palco.retangulo(abas[outra]);
          return { tipo: 'tocar', em: { x: r.cx, y: r.cy } };
        };
        PC.debug.proximoGestoVirtual = gestoDbg;
        ocupadaDbg = ocupada;
        PC.debug.telaOcupada = ocupadaDbg;
      }

      return {
        destruir() {
          if (!vivo) return;
          vivo = false;
          timers.forEach(clearTimeout);
          clearTimeout(timerOcioso);
          if (dica) { dica.parar(); dica = null; }
          desligar.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
          if (dbg && PC.debug && PC.debug.album === dbg) delete PC.debug.album;
          if (gestoDbg && PC.debug && PC.debug.proximoGestoVirtual === gestoDbg) PC.debug.proximoGestoVirtual = null;
          if (ocupadaDbg && PC.debug && PC.debug.telaOcupada === ocupadaDbg) PC.debug.telaOcupada = null;
        },
      };
    },
  });
})();
