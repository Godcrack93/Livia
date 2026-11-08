/* Pipoca Conta — tela "livre": Brincar livre (PROJETO.md, seção 4, item 6).
   Uma mesa com um balde de cubinhos (fonte infinita). A criança:
     - monta torres: toca no balde (um cubinho voa para a torre da vez ou começa uma torre nova) ou arrasta um
       cubinho do balde até a mesa (torre nova) ou até uma torre (ela cresce);
     - arrasta torres pela mesa; soltar uma torre sobre outra junta as duas (PC.Torre.juntar) e a Pipoca diz a conta;
     - separa: arrasta a parte de cima (o cubinho pego e os de cima dele, PC.Torre.dividir) ou toca no topo da torre
       (o cubinho de cima pula para o lado e vira uma torre nova);
     - toca numa torre: a Pipoca conta em voz alta (t.contarAlto) e diz o total ("Sete cubinhos!"; de 16 a 19 com a
       estrutura: "Dez e mais sete... dezessete cubinhos!");
     - guarda: soltar um cubinho ou uma torre dentro do balde; o botão de limpar tira tudo da mesa.
   Padrão de 5 em 5 (roxo 1–5, dourado 6–10, igual de 11 a 20). Cada torre tem a plaquinha presa na base; no ar
   (arrastando ou caindo) a plaquinha some, para nenhum número flutuar perto de outra torre. A parte que está no ar
   mostra as cores do lugar onde vai ficar: ao ser pega continua como estava, por cima de outra torre já mostra as
   cores que vai ter lá e, sozinha na mesa, segue o padrão dela (nada troca de cor de repente na mão da criança).
   Sem assinatura: até 2 torres e 10 cubinhos por torre; com assinatura: até 8 torres e 20 cubinhos (dentro do espaço
   da mesa). A assinatura que chega no meio da visita libera na hora; a que acaba só vale na próxima visita.
   No limite, só uma fala neutra ("A mesa está cheia!", "Essa torre está cheia!", "Não cabe! Ia ficar com
   doze cubinhos.") — nunca um convite de compra.
   Nenhuma área de toque entra na faixa do HUD (y < 140) nem passa de x 1540 (gesto voltar do Android).
   params (testes): { torres: [7, 3] } começa com torres prontas (respeitando os limites). */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  // ---------------------------------------------------------------- medidas (px do palco virtual 1600×900)
  const BASE_Y = 800;                 // tampo da mesa: base de todas as torres
  const LADO = 64;                    // cubinho (o mesmo de PC.Torre)
  const X0 = 575, X1 = 1480;          // faixa das torres: depois do balde e antes da margem do gesto voltar
  const BORDA_DIR = 1540;             // as áreas de toque das torres não passam daqui (perto da borda vale o gesto voltar)
  const FOLGA = 46;                   // espaço preferido entre torres vizinhas (bem maior que o vão de 20 entre dezena e unidades)
  const FOLGA_MIN = 30;               // com menos espaço que isso, a mesa está cheia (maior que o vão de 20 da dezena)
  const IMA_TORRE = 22;               // ímã: torre solta a menos disso de outra (além da largura) junta com ela
  const IMA_ALTO = 56;                // ímã: torre erguida por cima de outra (a base acima do cubinho de cima dela)
  const IMA_CUBO = 38;               // ímã: cubinho solto a menos disso de uma torre entra nela
  const PEGA = 40;                    // folga para achar o cubinho que o dedo pegou
  const SOBRE_TOPO = 76;              // área de toque acima do cubinho de cima (o "topo")
  const BALDE = { x: 300, y: 590, l: 240, a: 220 };          // desenho do balde
  const BALDE_TOQUE = { x: 296, y: 580, l: 248, a: 240 };    // área de toque do balde (maior que o alvo principal)
  const BOCA = { x: 420, y: 640 };                             // de onde os cubinhos saem
  const PRIMEIRA_X = 850;             // a primeira torre nasce no lugar do objeto principal
  const DICA_MS = 9000;               // tempo parado até a Pipoca sugerir uma brincadeira
  const VEZES_DICA = 2;               // cada sugestão aparece no máximo duas vezes por visita
  // falas neutras de limite: descrevem o que aconteceu e nunca falam de assinatura nem convidam a comprar
  const FRASES_LIMITE = {
    mesa: 'A mesa está cheia!',
    torre: 'Essa torre está cheia!',
  };

  const larg = n => (n > 10 ? 2 * LADO + 20 : LADO);           // largura de uma torre com n cubinhos
  const corCinco = i => ((i % 10) < 5 ? PC.cores.cincoA : PC.cores.cincoB);
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);
  const pos = (el, x, y, l, a) => { el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = l + 'px'; el.style.height = a + 'px'; };

  // ---------------------------------------------------------------- estilo (injetado na primeira vez que a tela abre)
  function css() {
    return `
    .pc-livre-mesa { position: absolute; left: -1200px; top: 748px; width: 4000px; height: 960px; z-index: 1; pointer-events: none; }
    .pc-livre-tampo { position: absolute; left: 0; top: 0; width: 100%; height: 76px; border-top: 5px solid var(--tinta);
      background: repeating-linear-gradient(180deg, rgba(138, 90, 52, 0) 0 17px, rgba(138, 90, 52, .12) 17px 19px),
        linear-gradient(180deg, #F2CC94 0%, #E3AF70 100%); }
    .pc-livre-borda { position: absolute; left: 0; top: 76px; width: 100%; height: 22px; background: #C98C50;
      border-top: 5px solid var(--tinta); border-bottom: 4px solid #7E5230; }
    .pc-livre-frente { position: absolute; left: 0; top: 98px; width: 100%; height: 862px;
      background: repeating-linear-gradient(90deg, rgba(58, 42, 90, 0) 0 236px, rgba(58, 42, 90, .10) 236px 242px),
        linear-gradient(180deg, #B47640 0%, #9A6233 70%); }
    .pc-livre-camada { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; z-index: 10; }
    .pc-livre-balde { position: absolute; left: ${BALDE.x}px; top: ${BALDE.y}px; width: ${BALDE.l}px; height: ${BALDE.a}px;
      pointer-events: none; transform-origin: 50% 96%; transition: transform .15s ease-out; }
    .pc-livre-balde svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .pc-livre-balde.fundo { z-index: 4; }
    .pc-livre-balde.frente { z-index: 35; }
    .pc-livre-camada.ima-balde .pc-livre-balde { transform: scale(1.08); }
    .pc-livre-balde.pula { animation: pcLivreBalde .32s ease-out; }
    @keyframes pcLivreBalde { 40% { transform: scale(1.07, .93); } }
    .pc-livre-balde-toque { position: absolute; left: ${BALDE_TOQUE.x}px; top: ${BALDE_TOQUE.y}px; width: ${BALDE_TOQUE.l}px;
      height: ${BALDE_TOQUE.a}px; z-index: 36; border-radius: 48px; cursor: pointer; }
    .pc-livre-solto { left: 0; top: 0; z-index: 40; pointer-events: none; }
    .pc-livre-torre .pc-livre-sombra { position: absolute; border-radius: 50%; background: rgba(58, 42, 90, .2); pointer-events: none; }
    .pc-livre-torre .pc-livre-halo { position: absolute; display: none; border-radius: 26px; border: 6px dashed #fff;
      background: rgba(255, 255, 255, .38); pointer-events: none; }
    .pc-livre-torre.pc-livre-ima .pc-livre-halo { display: block; animation: pcLivreHalo .7s ease-in-out infinite alternate; }
    @keyframes pcLivreHalo { to { opacity: .45; } }
    .pc-livre-torre .pc-livre-alvo { position: absolute; cursor: pointer; }
    .pc-livre-torre.arrastando .pc-livre-sombra { display: none; }
    /* no ar (arrastando ou caindo até a mesa), a plaquinha some: o número nunca flutua perto de outra torre */
    .pc-livre-torre.arrastando .torre-placa, .pc-livre-torre.pc-livre-caindo .torre-placa { display: none; }
    .pc-livre-torre.pc-livre-encaixa { z-index: 30; }
    .pc-livre-torre.pc-livre-encaixa .pc-livre-sombra, .pc-livre-torre.pc-livre-encaixa .torre-placa { display: none; }
    .pc-livre-mini { width: 100px; height: 92px; flex: none; }
    .pc-livre-mini svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .pc-livre-hud .botao-icone { width: 110px; height: 110px; }
    .pc-livre-hud .botao-icone svg { width: 64px; height: 64px; }
    .pc-livre-hud .botao-icone::before { content: ''; position: absolute; left: -18px; top: -18px; right: -18px; bottom: -18px; border-radius: 50%; }
    `;
  }

  // ---------------------------------------------------------------- desenho do balde (SVG próprio; viewBox 0 0 240 220)
  // Duas camadas: o fundo (alça, boca e cubinhos lá dentro) fica atrás das torres; a frente (corpo e aro) fica na
  // frente, para que o que cai no balde pareça entrar nele.
  function cuboSvg(x, y, l, cor, ang) {
    const m = l / 2, p = Math.round(l * 0.4);
    return `<g transform="translate(${x} ${y}) rotate(${ang})">` +
      `<rect x="${-p / 2}" y="${-m - 10}" width="${p}" height="14" rx="5" fill="${U.tom(cor, 0.4)}" stroke="#3A2A5A" stroke-width="4"/>` +
      `<rect x="${-m}" y="${-m}" width="${l}" height="${l}" rx="9" fill="${cor}" stroke="#3A2A5A" stroke-width="4.5"/>` +
      `<rect x="${-m + 7}" y="${-m + 6}" width="${Math.round(l * 0.32)}" height="7" rx="3.5" fill="#fff" opacity=".6"/></g>`;
  }
  function desenhoBalde(parte) {
    const T = '#3A2A5A';
    const sombra = `<ellipse cx="120" cy="212" rx="104" ry="9" fill="rgba(58,42,90,.2)"/>`;
    const fundo =
      `<path d="M24 62 C 30 -6, 210 -6, 216 62" fill="none" stroke="${T}" stroke-width="13" stroke-linecap="round"/>` +
      `<path d="M24 62 C 30 -6, 210 -6, 216 62" fill="none" stroke="#D9D3EA" stroke-width="5" stroke-linecap="round"/>` +
      `<ellipse cx="120" cy="58" rx="106" ry="24" fill="#137369" stroke="${T}" stroke-width="5"/>` +
      cuboSvg(66, 66, 46, PC.cores.cincoA, -14) + cuboSvg(108, 58, 46, PC.cores.cincoB, 7) +
      cuboSvg(150, 62, 46, PC.cores.cincoA, -5) + cuboSvg(188, 70, 42, PC.cores.cincoB, 15);
    const frente =
      `<path d="M14 58 A 106 24 0 0 0 226 58 L 204 196 Q 201 212 186 212 L 54 212 Q 39 212 36 196 Z" fill="#2EC4B6" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M24.5 124 L 215.5 124 L 211.3 150 L 28.7 150 Z" fill="#FFC93C" stroke="${T}" stroke-width="4" stroke-linejoin="round"/>` +
      `<path d="M46 96 Q 49 140 57 182" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="M14 58 A 106 24 0 0 0 226 58" fill="none" stroke="${T}" stroke-width="20" stroke-linecap="round"/>` +
      `<path d="M14 58 A 106 24 0 0 0 226 58" fill="none" stroke="#8BE8DE" stroke-width="10" stroke-linecap="round"/>`;
    const corpo = parte === 'fundo' ? sombra + fundo : parte === 'frente' ? frente : fundo + frente;
    return `<svg viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${corpo}</svg>`;
  }
  /** Baldinho pequeno para o balão da Pipoca ("Toque no balde"): a criança que não lê vê o que tocar. */
  const miniBalde = () => U.el('div', { class: 'pc-livre-mini', html: desenhoBalde('inteiro') });

  // ---------------------------------------------------------------- tela
  PC.telas.registrar('livre', {
    voltarPara: 'mapa',
    criar(raiz, params) {
      params = params || {};
      U.estilo('livre', css());

      const sair = new AbortController();
      let vivo = true;
      let geracao = 0;            // muda ao limpar a mesa: voos e animações antigas desistem
      // torres paradas na mesa: { t (PC.Torre), base, corpo, topo, halo, sombra, hwL, hwR, ocupada, desligar, pintura }
      // (pintura: só nas torres no ar, que mostram as cores do lugar onde vão ficar; na mesa, sempre o padrão de 5 em 5)
      const torres = [];
      let atual = null;           // a torre da vez: recebe os cubinhos de quem toca no balde
      let arrasto = null;         // gesto em andamento: { tipo: 'cubo', el } | { tipo: 'torre', D, origem, x0, dx, dy }
      let voando = null;          // cubinho voando do balde: { el }
      let contagem = null;        // a Pipoca contando uma torre: { T, ac }
      let marcado = null;         // torre (ou 'balde') acesa pelo ímã
      let dicaMao = null;
      let mexeu = false;          // a criança já fez alguma coisa (a apresentação não se repete por cima)
      let parado = 0;             // ms sem tocar (sugestões)
      let falaId = 0;
      let ultimoLimite = { m: '', t: -1e9 };
      let animaAte = 0;           // até quando (performance.now) alguma peça ainda está se mexendo sozinha
      const fez = { balde: false, contar: false, juntar: false, separar: false, mesa: false };
      const vezesDica = {};
      const desligar = [];
      /** Marca que peças vão se mexer sozinhas por ms (testes: PC.debug.esperarOcioso espera acabar). */
      const animando = ms => { animaAte = Math.max(animaAte, performance.now() + U.duracao(ms) + 80); };

      // Limites da visita: a assinatura que chega (ex.: o Google Play respondeu depois) libera na hora; a que acaba
      // só vale na próxima visita (PROJETO.md 8) — nada some da mesa no meio da brincadeira.
      let assinante = PC.assinatura.ativa();
      desligar.push(PC.assinatura.aoMudar(e => { if (e && e.ativa) assinante = true; }));
      const limites = () => (assinante ? { torres: 8, cubos: 20 } : { torres: 2, cubos: 10 });
      /** A torre inteira que está no ar (arrastada) volta para a mesa: ela continua contando nos limites. */
      const noAr = () => (arrasto && arrasto.tipo === 'torre' && !arrasto.origem ? [arrasto.D] : []);
      const ns = (...exceto) => torres.concat(noAr()).filter(T => exceto.indexOf(T) < 0).map(T => T.t.n);
      /** Cabem torres com estas quantidades lado a lado na mesa? */
      function cabe(lista) {
        const soma = lista.reduce((s, n) => s + larg(n), 0);
        return soma + Math.max(0, lista.length - 1) * FOLGA_MIN <= X1 - X0;
      }
      const ordenadas = () => torres.slice().sort((a, b) => a.t.x - b.t.x);
      const livre = T => !!T && torres.indexOf(T) >= 0 && !T.ocupada;
      const podeTorreNova = n => torres.length + noAr().length + 1 <= limites().torres && cabe(ns().concat(n));
      /** Por que a torre não pode ganhar mais cubinhos? '' = pode; 'torre' = chegou no máximo; 'mesa' = falta espaço. */
      function motivoNaoCresce(T, mais = 1) {
        const n = T.t.n + mais;
        if (n > limites().cubos || n > PC.Torre.MAX) return 'torre';
        if (larg(n) !== larg(T.t.n) && !cabe(ns(T).concat(n))) return 'mesa';
        return '';
      }

      // ------------------------------------------------------------ cenário, mesa, balde
      raiz.appendChild(PC.arte.cenario('ceu'));
      raiz.appendChild(U.el('div', { class: 'pc-livre-mesa', 'aria-hidden': 'true' },
        U.el('div', { class: 'pc-livre-tampo' }), U.el('div', { class: 'pc-livre-borda' }), U.el('div', { class: 'pc-livre-frente' })));
      const camada = U.el('div', { class: 'pc-livre-camada' });
      raiz.appendChild(camada);
      const baldeFundo = U.el('div', { class: 'pc-livre-balde fundo', html: desenhoBalde('fundo') });
      const baldeFrente = U.el('div', { class: 'pc-livre-balde frente', html: desenhoBalde('frente') });
      const baldeToque = U.el('div', { class: 'pc-livre-balde-toque', teste: 'balde', role: 'button', 'aria-label': 'Balde de cubinhos' });
      camada.append(baldeFundo, baldeFrente, baldeToque);
      const centroBalde = () => ({ x: BALDE_TOQUE.x + BALDE_TOQUE.l / 2, y: BALDE_TOQUE.y + BALDE_TOQUE.a / 2 });
      function pularBalde() {
        [baldeFundo, baldeFrente].forEach(el => { el.classList.remove('pula'); void el.offsetWidth; el.classList.add('pula'); });
      }

      // ------------------------------------------------------------ HUD: voltar (mapa) e limpar a mesa
      const bVoltar = PC.ui.botaoIcone('voltar', 'Voltar', () => PC.telas.voltar());
      bVoltar.dataset.teste = 'voltar';
      const bLimpar = PC.ui.botaoIcone('limpar', 'Limpar a mesa', () => limpar());
      bLimpar.dataset.teste = 'limpar';
      raiz.appendChild(U.el('div', { class: 'hud pc-livre-hud' },
        U.el('div', { class: 'hud-esq' }, bVoltar), U.el('div', { class: 'hud-dir' }, bLimpar)));

      // ------------------------------------------------------------ Pipoca
      PC.ui.pipoca.montar(raiz);
      desligar.push(PC.on('pipoca:tocada', () => { if (!vivo) return; pararContagem(); mostrarDica(true); }));
      desligar.push(PC.on('toque', () => { parado = 0; }));

      /** A Pipoca fala (com pose); a pose volta ao normal no fim, se ninguém falou depois. */
      function falar(texto, { mostrar = null, pose = 'normal' } = {}) {
        if (!vivo) return Promise.resolve('muda');
        const id = ++falaId;
        PC.ui.pipoca.pose(pose);
        return PC.ui.pipoca.dizer(texto, { mostrar }).then(r => {
          if (vivo && id === falaId && !contagem) PC.ui.pipoca.pose('normal');
          return r;
        });
      }
      /** Fala neutra de limite (nunca convite de compra). Repetida em sequência, fica só no balanço do objeto. */
      function limite(motivo, texto) {
        const agora = performance.now();
        if (ultimoLimite.m === motivo && agora - ultimoLimite.t < 2500) return;
        ultimoLimite = { m: motivo, t: agora };
        falar(texto || FRASES_LIMITE[motivo] || FRASES_LIMITE.mesa);
      }
      function falarJuncao(a, b) {
        const s = a + b;
        let texto = maiuscula(PC.voz.extenso(a)) + ' mais ' + PC.voz.extenso(b) + '... ' + PC.voz.extenso(s) + '!';
        if (s === 10) texto += ' Uma dezena!';
        else if (s === 20) texto += ' Duas dezenas!';
        falar(texto, { mostrar: s, pose: 'feliz' });
      }

      // ------------------------------------------------------------ torres
      /** Liga uma PC.Torre à mesa: sombra, halo do ímã, áreas de toque (com folga) e o arraste. */
      function adotar(t) {
        const T = { t, ocupada: false, hwL: 72, hwR: 72, desligar: null };
        T.sombra = U.el('div', { class: 'pc-livre-sombra' });
        T.halo = U.el('div', { class: 'pc-livre-halo' });
        t.el.insertBefore(T.halo, t.el.firstChild);
        t.el.insertBefore(T.sombra, T.halo);
        T.corpo = U.el('div', { class: 'pc-livre-alvo' });                       // a coluna inteira, com folga
        T.base = U.el('div', { class: 'pc-livre-alvo', role: 'button' });        // cubinho de baixo + plaquinha (data-teste torre-N)
        T.topo = U.el('div', { class: 'pc-livre-alvo', hidden: true });          // cubinho de cima + o ar acima dele (topo-N)
        t.el.append(T.corpo, T.base, T.topo);
        t.el.classList.add('pc-livre-torre');
        T.desligar = PC.arrastar(t.el, {
          podeComecar: () => vivo && !arrasto && livre(T),
          aoTocar: p => tocarTorre(T, p),
          aoComecar: p => comecarTorre(T, p),
          aoMover: p => moverArrasto(p),
          aoSoltar: p => soltarArrasto(p),
          aoCancelar: p => cancelarArrasto(p),
        });
        return T;
      }
      /** Tira a torre do controle da mesa (o elemento some com t.destruir() ou t.juntar()). */
      function descartar(T) {
        const i = torres.indexOf(T);
        if (i >= 0) torres.splice(i, 1);
        if (T.desligar) { const d = T.desligar; T.desligar = null; d(); }
        if (atual === T) atual = null;
        if (contagem && contagem.T === T) pararContagem();
        if (marcado === T) marcarAlvo(null);
      }
      function criarTorre(x, n, y = BASE_Y) {
        const t = new PC.Torre({ x, y, n, placa: 'base' });
        camada.appendChild(t.el);
        const T = adotar(t);
        torres.push(T);
        return T;
      }

      /**
       * Arruma a mesa: as torres ficam na linha do tampo, sem se encostar, entre X0 e X1, perto de onde a criança pôs.
       * desejo: Map(torre -> x desejado) para quem acabou de chegar.
       */
      function arrumar({ animar = true, desejo = null } = {}) {
        const lista = torres.map(T => ({ T, x: desejo && desejo.has(T) ? desejo.get(T) : T.t.x, w: larg(T.t.n) }));
        lista.sort((a, b) => a.x - b.x);
        const n = lista.length;
        if (n) {
          const soma = lista.reduce((s, o) => s + o.w, 0);
          const folga = n > 1 ? Math.min(FOLGA, (X1 - X0 - soma) / (n - 1)) : FOLGA;
          if (folga < FOLGA) {
            // mesa apertada: todas lado a lado, com o mesmo espaço
            let x = X0;
            lista.forEach(o => { o.x = x + o.w / 2; x += o.w + folga; });
          } else {
            lista.forEach(o => { o.x = U.limitar(o.x, X0 + o.w / 2, X1 - o.w / 2); });
            for (let i = 1; i < n; i++) lista[i].x = Math.max(lista[i].x, lista[i - 1].x + (lista[i - 1].w + lista[i].w) / 2 + folga);
            if (lista[n - 1].x > X1 - lista[n - 1].w / 2) {
              lista[n - 1].x = X1 - lista[n - 1].w / 2;
              for (let i = n - 2; i >= 0; i--) lista[i].x = Math.min(lista[i].x, lista[i + 1].x - (lista[i].w + lista[i + 1].w) / 2 - folga);
            }
          }
          lista.forEach(o => {
            const t = o.T.t;
            if (Math.abs(t.x - o.x) <= 0.5 && Math.abs(t.y - BASE_Y) <= 0.5) return;
            // caindo do ar até a mesa: a plaquinha só aparece quando a torre pousa
            const caindo = animar && t.y < BASE_Y - 0.5;
            if (caindo) t.el.classList.add('pc-livre-caindo');
            if (animar) animando(350);
            t.mover(o.x, BASE_Y, { animar }).then(() => { if (caindo) t.el.classList.remove('pc-livre-caindo'); });
          });
        }
        ajustarAlvos();
      }

      /** Posiciona as áreas de toque de cada torre (sem invadir as vizinhas) e numera da esquerda para a direita. */
      function ajustarAlvos() {
        const lista = ordenadas();
        lista.forEach((T, i) => {
          const t = T.t, n = t.n, w = larg(n), meia = w / 2;
          // meia largura da área de toque: a torre com folga (mínimo de 140 no total). De 11 a 20 o topo fica só na coluna
          // das unidades (à direita), então a folga da direita cresce para o topo também ter 140 de largura, se houver espaço.
          let hwL = Math.max(meia + 10, PC.layout.alvoMinimo / 2 + 2);
          let hwR = n > 10 ? Math.max(hwL, 6 + PC.layout.alvoMinimo) : hwL;
          const ant = lista[i - 1], prox = lista[i + 1];
          if (ant) hwL = Math.min(hwL, t.x - ((ant.t.x + larg(ant.t.n) / 2) + (t.x - meia)) / 2);
          if (prox) hwR = Math.min(hwR, ((t.x + meia) + (prox.t.x - larg(prox.t.n) / 2)) / 2 - t.x);
          hwR = Math.min(hwR, BORDA_DIR - t.x);                           // longe da borda (gesto voltar do Android)
          T.hwL = hwL = Math.max(hwL, meia);
          T.hwR = hwR = Math.max(hwR, meia);
          const h = Math.min(n, 10) * LADO;
          const topoY = n > 10 ? -(n - 10) * LADO : -n * LADO;          // alto do cubinho de cima (relativo à base)
          // o "corpo" (contar/arrastar) vai do topo até a plaquinha; de 11 a 20 cobre a dezena inteira (o que fica no
          // ar acima das unidades e fora da caixa do topo também conta a torre). Nunca entra na faixa do HUD.
          const yCorpo = n > 10 ? Math.max(-h - 20, PC.layout.faixaHud + 4 - BASE_Y) : n >= 2 ? topoY + LADO : -h - 70;
          pos(T.corpo, -hwL, yCorpo, hwL + hwR, 90 - yCorpo);
          pos(T.base, -hwL, -LADO - 10, hwL + hwR, LADO + 100);
          if (n >= 2) {
            const c = caixaTopo(T);
            pos(T.topo, c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0);
            T.topo.hidden = false;
            T.topo.dataset.teste = 'topo-' + i;
          } else {
            T.topo.hidden = true;
            delete T.topo.dataset.teste;
          }
          pos(T.halo, -meia - 16, -h - 24, w + 32, h + 30);
          pos(T.sombra, -meia - 18, -9, w + 36, 18);
          T.base.dataset.teste = 'torre-' + i;
          T.base.setAttribute('aria-label', 'Torre com ' + PC.voz.quantidade(n, 'cubinho', 'cubinhos'));
        });
      }

      /**
       * Área do "topo" (relativa à base da torre): o cubinho de cima e o ar acima dele. Nunca entra na faixa do HUD
       * (y < 140, onde fica o botão de limpar); nas torres altas ela cresce para baixo para continuar com 140 de altura.
       * De 11 a 20, fica só na coluna das unidades (à direita da dezena).
       */
      function caixaTopo(T) {
        const n = T.t.n;
        const topoY = n > 10 ? -(n - 10) * LADO : -n * LADO;
        const y0 = Math.max(topoY - SOBRE_TOPO, PC.layout.faixaHud + 4 - BASE_Y);
        return { x0: n > 10 ? 6 : -T.hwL, x1: T.hwR, y0, y1: Math.max(topoY + LADO, y0 + PC.layout.alvoMinimo) };
      }
      /** O ponto (virtual) está no topo da torre (cubinho de cima e o ar acima dele) ou no resto ("corpo")? */
      function zona(T, p) {
        if (T.t.n < 2) return 'corpo';
        const c = caixaTopo(T), x = p.x - T.t.x, y = p.y - T.t.y;
        return x >= c.x0 - 2 && x <= c.x1 + 2 && y >= c.y0 - 2 && y <= c.y1 + 2 ? 'topo' : 'corpo';
      }
      const centroCubo = (T, i) => { const r = T.t.retanguloCubo(i); return { x: r.x + r.l / 2, y: r.y + r.a / 2 }; };

      /** Melhor lugar para uma torre nova: o meio do maior espaço vazio da mesa. */
      function lugarNovo(w = LADO) {
        if (!torres.length) return PRIMEIRA_X;
        const faixas = torres.map(T => { const l = larg(T.t.n); return [T.t.x - l / 2, T.t.x + l / 2]; }).sort((a, b) => a[0] - b[0]);
        let ini = X0, melhor = X0 + w / 2, tam = -Infinity;
        for (const [a, b] of faixas) {
          if (a - ini > tam) { tam = a - ini; melhor = (ini + a) / 2; }
          ini = Math.max(ini, b);
        }
        if (X1 - ini > tam) melhor = (ini + X1) / 2;
        return U.limitar(melhor, X0 + w / 2, X1 - w / 2);
      }
      /** Um x vazio, longe do ímã de todas as torres (para sugestões e testes), ou null. */
      function lugarSemIma(w = LADO, ima = IMA_TORRE) {
        const x = lugarNovo(w);
        return torres.every(T => Math.abs(T.t.x - x) >= (larg(T.t.n) + w) / 2 + ima + 8) ? x : null;
      }

      // ------------------------------------------------------------ contar (tocar numa torre)
      function pararContagem() {
        if (!contagem) return;
        const c = contagem;
        contagem = null;
        c.ac.abort();
        PC.voz.parar();
        if (vivo) PC.ui.pipoca.pose('normal');
      }
      async function contar(T) {
        pararContagem();
        atual = T;
        fez.contar = true;
        const ac = new AbortController();
        const c = contagem = { T, ac };
        PC.ui.pipoca.calar();
        PC.ui.pipoca.pose('aponta');
        try {
          await T.t.contarAlto({ sinal: ac.signal });
          if (ac.signal.aborted || !vivo) return;
          const n = T.t.n;
          // o total com o substantivo ("Sete cubinhos!"); de 16 a 19, com a estrutura: "Dez e mais sete... dezessete cubinhos!"
          const total = n >= 16 && n <= 19 ? PC.voz.dezEMais(n) + ' cubinhos' : PC.voz.quantidade(n, 'cubinho', 'cubinhos');
          await falar(maiuscula(total) + '!', { mostrar: n, pose: 'feliz' });
        } catch (e) {
          if (!U.ehAbortado(e)) console.error(e);
        } finally {
          if (contagem === c) {
            contagem = null;
            if (vivo && !PC.ui.pipoca.falando()) PC.ui.pipoca.pose('normal');
          }
        }
      }

      function tocarTorre(T, p) {
        if (!vivo || !livre(T)) return;
        mexeu = true;
        pararDica();
        if (zona(T, p) === 'topo') separarTopo(T);
        else contar(T);
      }

      /** Toque no topo: o cubinho de cima pula para o lado e vira uma torre nova. */
      function separarTopo(T) {
        pararContagem();
        const t = T.t;
        if (t.n < 2) { contar(T); return; }
        if (torres.length + 1 > limites().torres || !cabe(ns(T).concat(t.n - 1, 1))) { limite('mesa'); t.tremer(); return; }
        const N = t.dividir(t.n - 1);
        if (!N) return;
        const D = adotar(N);
        torres.push(D);
        const wT = larg(t.n);
        let x = t.x + wT / 2 + FOLGA + LADO / 2 + 40;
        if (x > X1 - LADO / 2) x = t.x - wT / 2 - FOLGA - LADO / 2 - 40;
        atual = T;
        fez.separar = true;
        PC.som.separar();
        arrumar({ desejo: new Map([[D, x]]) });
      }

      // ------------------------------------------------------------ balde: tocar (um cubinho voa)
      /** Para onde vai o próximo cubinho do balde: a torre da vez, uma torre nova ou outra que ainda cresce. */
      function escolherDestino() {
        if (livre(atual) && !motivoNaoCresce(atual)) return { T: atual };
        if (podeTorreNova(1)) return { x: lugarNovo() };
        const outra = torres.filter(T => livre(T) && !motivoNaoCresce(T)).sort((a, b) => a.t.n - b.t.n || a.t.x - b.t.x)[0];
        if (outra) return { T: outra };
        return { motivo: 'mesa' };
      }

      function criarCubo(cor) {
        const el = U.el('div', { class: 'cubo pc-livre-solto' });
        pintarCubo(el, cor);
        return el;
      }
      function pintarCubo(el, cor) {
        if (el.dataset.cor === cor) return;
        el.dataset.cor = cor;
        el.style.setProperty('--c', cor);
        el.style.setProperty('--c-claro', U.tom(cor, 0.45));
        el.style.setProperty('--c-escuro', U.tom(cor, -0.18));
      }
      function posCubo(el, x, y) {
        el._x = x; el._y = y;
        el.style.transform = `translate(${x - LADO / 2}px, ${y - LADO / 2}px)`;
      }
      /** Voo em arco (curva suave) do ponto de até o ponto para (centros, px virtuais). */
      function voarCubo(el, de, para, ms) {
        const meio = { x: (de.x + para.x) / 2, y: Math.min(de.y, para.y) - 140 };
        const quadros = [];
        for (let i = 0; i <= 10; i++) {
          const s = i / 10, r = 1 - s;
          const x = r * r * de.x + 2 * r * s * meio.x + s * s * para.x;
          const y = r * r * de.y + 2 * r * s * meio.y + s * s * para.y;
          const esc = s < 0.3 ? 0.6 + (s / 0.3) * 0.4 : 1;
          quadros.push({ transform: `translate(${(x - LADO / 2).toFixed(1)}px, ${(y - LADO / 2).toFixed(1)}px) rotate(${Math.round(r * -24)}deg) scale(${esc.toFixed(3)})`, offset: s });
        }
        posCubo(el, para.x, para.y);
        return U.animar(el, quadros, { duration: ms, easing: 'ease-in-out' });
      }
      /** O cubinho solto volta para dentro do balde e some. */
      function guardarCubo(el) {
        const x = el._x != null ? el._x : BOCA.x, y = el._y != null ? el._y : BOCA.y;
        animando(260);
        U.animar(el, [
          { transform: `translate(${x - LADO / 2}px, ${y - LADO / 2}px) scale(1)`, opacity: 1 },
          { transform: `translate(${BOCA.x - LADO / 2}px, ${BOCA.y + 10}px) scale(.45)`, opacity: 0 },
        ], { duration: 260, easing: 'ease-in', fill: 'forwards' }).then(() => el.remove());
        pularBalde();
      }

      function tocarBalde() {
        if (!vivo || voando) return;
        mexeu = true;
        pararContagem();
        pararDica();
        fez.balde = true;
        pularBalde();
        const dest = escolherDestino();
        if (dest.motivo) { limite(dest.motivo); return; }
        const g = geracao;
        const el = criarCubo(corCinco(dest.T ? dest.T.t.n : 0));
        camada.appendChild(el);
        const para = dest.T ? dest.T.t.topo() : { x: dest.x, y: BASE_Y - LADO / 2 };
        voando = { el };
        PC.som.pegar();
        voarCubo(el, BOCA, para, 300).then(() => {
          if (voando && voando.el === el) voando = null;
          if (!vivo || g !== geracao) { el.remove(); return; }
          // no caminho algo pode ter mudado (outra torre juntou nela, a mesa encheu): então o cubinho volta para o balde
          if (dest.T) {
            if (torres.indexOf(dest.T) >= 0 && !dest.T.ocupada && !motivoNaoCresce(dest.T)) { el.remove(); crescer(dest.T, { animar: false }); }
            else guardarCubo(el);
          } else if (podeTorreNova(1)) {
            el.remove();
            const T = criarTorre(para.x, 1);
            atual = T;
            PC.som.encaixar();
            PC.som.contar(1);
            arrumar({ desejo: new Map([[T, para.x]]) });
          } else guardarCubo(el);
        });
      }

      /** A torre ganhou um cubinho (do balde): som de encaixe com nota subindo; 10 e 20 ganham uma fala. */
      function crescer(T, { animar = true } = {}) {
        const antes = larg(T.t.n);
        T.t.adicionar(null, { animar });
        atual = T;
        const n = T.t.n;
        PC.som.encaixar();
        PC.som.contar(n);
        if (larg(n) !== antes) arrumar(); else ajustarAlvos();
        if (n === 10) falar('Dez! Uma dezena!', { mostrar: 10, pose: 'feliz' });
        else if (n === 20) falar('Vinte! Duas dezenas!', { mostrar: 20, pose: 'feliz' });
      }

      // ------------------------------------------------------------ arrastar: cubinho do balde ou torre
      function marcarAlvo(alvo) {
        if (marcado === alvo) return;
        if (marcado === 'balde') camada.classList.remove('ima-balde');
        else if (marcado) marcado.t.el.classList.remove('pc-livre-ima');
        marcado = alvo;
        if (alvo === 'balde') camada.classList.add('ima-balde');
        else if (alvo) alvo.t.el.classList.add('pc-livre-ima');
      }
      function alvoDoCubo(p) {
        if (U.dentro(p, BALDE_TOQUE, 10)) return 'balde';
        let melhor = null, dist = Infinity;
        for (const T of torres) {
          if (T.ocupada) continue;
          const d = Math.abs(p.x - T.t.x);
          if (d <= larg(T.t.n) / 2 + IMA_CUBO && d < dist) { dist = d; melhor = T; }
        }
        return melhor;
      }
      function alvoDaTorre(D, p) {
        if (U.dentro(p, BALDE_TOQUE, 10) || U.dentro({ x: D.t.x, y: D.t.y }, BALDE_TOQUE, 10)) return 'balde';
        let melhor = null, dist = Infinity;
        for (const T of torres) {
          if (T === D || T.ocupada) continue;
          const d = Math.abs(D.t.x - T.t.x);
          // erguida por cima da outra (a base da parte no ar acima do meio do cubinho de cima): o ímã fica com
          // cerca de um cubinho de folga (PROJETO.md 5); na altura da mesa, continua pequeno para arrumar lado a lado
          const altoT = BASE_Y - Math.min(T.t.n, 10) * LADO;
          const ima = D.t.y <= altoT + LADO / 2 ? IMA_ALTO : IMA_TORRE;
          if (d < (larg(T.t.n) + larg(D.t.n)) / 2 + ima && d < dist) { dist = d; melhor = T; }
        }
        return melhor;
      }

      /**
       * Cores de uma torre que está no ar: as do lugar onde ela vai ficar (padrão de 5 em 5 contado a partir de "de").
       * Por cima de uma torre com k cubinhos, de = k (a parte que acabou de sair da torre continua com as cores que
       * tinha lá); sozinha, de = 0. Assim nada troca de cor ao ser pego, e o que vai encaixar já mostra como vai ficar.
       */
      function pintarNoAr(D, de) {
        if (D.pintura === de) return;
        D.pintura = de;
        D.t.padrao = null;                     // cores explícitas enquanto está no ar (PC.Torre usa as da lista)
        D.t.definir(Array.from({ length: D.t.n }, (_, i) => corCinco(de + i)));
      }
      /** A torre pousou sozinha na mesa: volta ao padrão de 5 em 5 dela mesma. */
      function pousar(D) {
        if (D.pintura == null) return;
        D.pintura = null;
        D.t.padrao = 'cinco';
        D.t.definir(Array.from({ length: D.t.n }, (_, i) => corCinco(i)));
      }
      /** Por que D (no ar) não pode encaixar em cima de T? '' = pode; 'naoCabe' = passaria do máximo; 'mesa' = falta espaço. */
      function motivoNaoJunta(T, D, a) {
        if (a.origem === T) return '';                     // devolver a parte para a mesma torre só desfaz a separação
        const soma = T.t.n + D.t.n;
        if (soma > limites().cubos || soma > PC.Torre.MAX) return 'naoCabe';
        if (larg(soma) !== larg(T.t.n) && !cabe(ns(T, D).concat(soma))) return 'mesa';
        return '';
      }
      /** De onde contar as cores da torre no ar: do lugar onde ela fica se for solta agora (outra torre, a origem ou sozinha). */
      function coresNoAr(a, alvo) {
        if (alvo && alvo !== 'balde' && !motivoNaoJunta(alvo, a.D, a)) return alvo.t.n;
        const O = a.origem && torres.indexOf(a.origem) >= 0 ? a.origem : null;
        if (O && (alvo || !podeTorreNova(a.D.t.n))) return O.t.n;               // vai voltar para a torre de onde saiu
        return 0;
      }

      function comecarCubo(p) {
        if (!vivo) return;
        mexeu = true;
        pararContagem();
        pararDica();
        const el = criarCubo(corCinco(0));
        camada.appendChild(el);
        posCubo(el, p.x, p.y);
        PC.som.pegar();
        pularBalde();
        arrasto = { tipo: 'cubo', el };
        moverArrasto(p);
      }

      /** Começo do arraste de uma torre: pegar embaixo leva a torre inteira; pegar mais acima separa dali para cima. */
      function comecarTorre(T, p) {
        if (!vivo || !livre(T)) return;
        mexeu = true;
        pararContagem();
        pararDica();
        const t = T.t, ini = p.inicio, n = t.n;
        let idx = -1;
        if (n >= 2 && ini.y <= BASE_Y + 4) {                  // na plaquinha (abaixo dos cubinhos): a torre inteira
          // separa o cubinho pego e os de cima dele; o de baixo leva a torre inteira. De 11 a 20, só a coluna das
          // unidades separa (pegar na dezena leva tudo).
          const separa = i => i >= 1 && (n <= 10 || (i >= 10 && ini.x >= t.x + 4));
          const k = t.cuboEm(ini.x, ini.y, PEGA);
          if (k >= 0 && U.dentro(ini, t.retanguloCubo(k), 0)) idx = separa(k) ? k : -1;   // bem em cima de um cubinho
          else if (zona(T, ini) === 'topo') idx = n - 1;                                   // no ar, acima do de cima
          else if (k >= 0 && separa(k)) idx = k;                                           // ao lado, perto de um cubinho
        }
        let D = T, origem = null;
        if (idx >= 1) {
          const N = t.dividir(idx);
          if (!N) return;
          D = adotar(N);
          origem = T;
          pintarNoAr(D, idx);                 // a parte pega continua com as cores que tinha na torre
          PC.som.separar();
        } else {
          torres.splice(torres.indexOf(T), 1);
          PC.som.pegar();
        }
        delete D.base.dataset.teste;
        delete D.topo.dataset.teste;
        D.t.el.classList.add('arrastando');
        arrasto = { tipo: 'torre', D, origem, x0: D.t.x, dx: ini.x - D.t.x, dy: ini.y - D.t.y };
        if (origem) ajustarAlvos();
        moverArrasto(p);
      }

      function moverArrasto(p) {
        const a = arrasto;
        if (!a || !vivo) return;
        if (a.tipo === 'cubo') {
          posCubo(a.el, p.x, p.y);
          const alvo = alvoDoCubo(p);
          marcarAlvo(alvo);
          pintarCubo(a.el, corCinco(alvo && alvo !== 'balde' ? alvo.t.n : 0));   // mostra a cor que vai ter lá
        } else {
          a.D.t.mover(p.x - a.dx, p.y - a.dy);
          const alvo = alvoDaTorre(a.D, p);
          marcarAlvo(alvo);
          if (alvo !== 'balde') pintarNoAr(a.D, coresNoAr(a, alvo));            // mostra as cores que vai ter lá
        }
      }

      function soltarArrasto(p) {
        const a = arrasto;
        arrasto = null;
        marcarAlvo(null);
        if (!a || !vivo) return;
        if (a.tipo === 'cubo') soltarCubo(a, p);
        else soltarTorre(a, p);
      }

      function soltarCubo(a, p) {
        const alvo = alvoDoCubo(p);
        if (alvo === 'balde' || (!alvo && p.x < X0 - 40)) { guardarCubo(a.el); return; }
        if (alvo) {
          const motivo = motivoNaoCresce(alvo);
          if (motivo) { limite(motivo); alvo.t.tremer(); guardarCubo(a.el); return; }
          a.el.remove();
          fez.mesa = true;
          crescer(alvo);
          return;
        }
        if (!podeTorreNova(1)) { limite('mesa'); guardarCubo(a.el); return; }
        // mesa vazia: nasce uma torre de um cubinho ali (ela desce até o tampo)
        a.el.remove();
        const x = U.limitar(p.x, X0 + LADO / 2, X1 - LADO / 2);
        const T = criarTorre(x, 1, Math.min(BASE_Y, p.y + LADO / 2));
        atual = T;
        fez.mesa = true;
        PC.som.encaixar();
        PC.som.contar(1);
        arrumar({ desejo: new Map([[T, x]]) });
      }

      function soltarTorre(a, p) {
        const D = a.D;
        D.t.el.classList.remove('arrastando');
        const alvo = alvoDaTorre(D, p);
        if (alvo === 'balde') guardarTorre(D, a);
        else if (alvo) juntarEm(alvo, D, a);
        else colocarNaMesa(D, a);
      }

      /** Solta a torre (ou a parte separada) num lugar vazio da mesa. */
      function colocarNaMesa(D, a) {
        const w = larg(D.t.n);
        const x = U.limitar(D.t.x, X0 + w / 2, X1 - w / 2);
        if (a.origem) {
          if (!podeTorreNova(D.t.n)) { limite('mesa'); devolver(D, a); return; }
          fez.separar = true;
        }
        pousar(D);
        torres.push(D);
        atual = D;
        PC.som.soltar();
        arrumar({ desejo: new Map([[D, x]]) });
      }

      /** A torre arrastada volta de onde veio: a parte separada encaixa de novo na origem; a inteira volta ao lugar. */
      function devolver(D, a) {
        const O = a.origem;
        if (O && torres.indexOf(O) >= 0) {
          const g = geracao;
          O.ocupada = true;
          const fim = () => {
            O.ocupada = false;
            if (!vivo) return;
            if (g !== geracao || torres.indexOf(O) < 0) { D.t.destruir(); descartar(D); return; }
            O.t.juntar(D.t, { animar: false });
            descartar(D);
            atual = O;
            arrumar();
          };
          if (O.t.n + D.t.n <= 10) {
            pintarNoAr(D, O.t.n);
            D.t.el.classList.add('pc-livre-encaixa');
            D.t.mover(O.t.x, BASE_Y - O.t.n * LADO, { animar: true }).then(fim);
          } else fim();
          return;
        }
        pousar(D);
        torres.push(D);
        arrumar({ desejo: new Map([[D, a.x0]]) });
      }

      /** Solta a torre D sobre a torre T: D encaixa em cima de T (se couber). */
      function juntarEm(T, D, a) {
        const nT = T.t.n, nD = D.t.n, soma = nT + nD;
        const proprio = a.origem === T;        // devolveu a parte para a mesma torre: só desfaz a separação
        const motivo = motivoNaoJunta(T, D, a);
        if (motivo === 'naoCabe') {
          limite('naoCabe', 'Não cabe! Ia ficar com ' + PC.voz.quantidade(soma, 'cubinho', 'cubinhos') + '.');
          T.t.tremer();
          devolver(D, a);
          return;
        }
        if (motivo) { limite('mesa'); devolver(D, a); return; }
        const g = geracao;
        T.ocupada = true;
        const fim = () => {
          T.ocupada = false;
          if (!vivo) return;
          if (g !== geracao) { D.t.destruir(); descartar(D); return; }
          if (torres.indexOf(T) < 0) { D.t.el.classList.remove('pc-livre-encaixa'); pousar(D); torres.push(D); arrumar(); return; }
          T.t.juntar(D.t, { animar: soma > 10 });
          descartar(D);
          atual = T;
          PC.som.encaixar();
          if (!proprio) { fez.juntar = true; falarJuncao(nT, nD); }
          arrumar();
        };
        if (soma <= 10) {
          pintarNoAr(D, nT);
          D.t.el.classList.add('pc-livre-encaixa');
          D.t.mover(T.t.x, BASE_Y - nT * LADO, { animar: true }).then(fim);
        } else fim();
      }

      /** Solta a torre no balde: os cubinhos voltam para dentro dele. */
      function guardarTorre(D, a) {
        D.ocupada = true;
        PC.som.soltar();
        pularBalde();
        animando(320);
        const dx = BOCA.x - D.t.x, dy = BOCA.y + 30 - D.t.y;
        U.animar(D.t.el, [
          { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0 },
        ], { duration: 320, easing: 'ease-in', fill: 'forwards' }).then(() => { D.t.destruir(); descartar(D); });
        if (a.origem && torres.indexOf(a.origem) >= 0) atual = a.origem;
        arrumar();
      }

      /** Gesto interrompido (outro dedo assumiu ou a tela vai mudar): tudo volta para onde estava. */
      function cancelarArrasto() {
        const a = arrasto;
        arrasto = null;
        marcarAlvo(null);
        if (!a) return;
        if (a.tipo === 'cubo') { guardarCubo(a.el); return; }
        const D = a.D;
        D.t.el.classList.remove('arrastando');
        if (a.origem && torres.indexOf(a.origem) >= 0) {
          a.origem.t.juntar(D.t, { animar: false });
          descartar(D);
          ajustarAlvos();
          return;
        }
        pousar(D);
        torres.push(D);
        arrumar({ desejo: new Map([[D, a.x0]]) });
      }

      // ------------------------------------------------------------ toque e arraste no balde
      desligar.push(PC.arrastar(baldeToque, {
        podeComecar: () => vivo && !voando && !arrasto,
        aoTocar: () => tocarBalde(),
        aoComecar: p => comecarCubo(p),
        aoMover: p => moverArrasto(p),
        aoSoltar: p => soltarArrasto(p),
        aoCancelar: p => cancelarArrasto(p),
      }));

      // ------------------------------------------------------------ limpar a mesa
      function limpar() {
        if (!vivo) return;
        mexeu = true;
        pararContagem();
        pararDica();
        PC.arrastar.cancelarTodos();
        if (voando) { voando.el.remove(); voando = null; }
        geracao++;
        if (!torres.length) { pularBalde(); return; }
        const lista = torres.splice(0);
        atual = null;
        animando(320 + lista.length * 40);
        lista.forEach((T, i) => {
          T.ocupada = true;
          if (T.desligar) { const d = T.desligar; T.desligar = null; d(); }
          U.animar(T.t.el, [{ transform: 'translateY(0px)', opacity: 1 }, { transform: 'translateY(90px)', opacity: 0 }],
            { duration: 320, delay: i * 40, easing: 'ease-in', fill: 'forwards' }).then(() => T.t.destruir());
        });
        PC.som.pagina();
        falar('Mesa limpinha!', { pose: 'feliz' });
      }

      // ------------------------------------------------------------ sugestões (a criança parada ou tocando na Pipoca)
      function pararDica() { if (dicaMao) { dicaMao.parar(); dicaMao = null; } }
      /** Um par que pode juntar (A arrastada sobre B), preferindo a soma menor. */
      function parJuntavel() {
        const lim = limites(), lista = ordenadas().filter(T => !T.ocupada);
        let melhor = null;
        for (const A of lista) {
          for (const B of lista) {
            if (A === B) continue;
            const s = A.t.n + B.t.n;
            if (s > lim.cubos || s > PC.Torre.MAX) continue;
            if (larg(s) !== larg(B.t.n) && !cabe(ns(A, B).concat(s))) continue;
            if (!melhor || s < melhor.s) melhor = { A, B, s };
          }
        }
        return melhor;
      }
      /** A próxima brincadeira que a criança ainda não descobriu (frase + gesto da mãozinha), ou null. */
      function proximaDica() {
        if (!torres.length) return { id: 'balde', texto: 'Toque no balde para pegar cubinhos!', gesto: { tipo: 'tocar', em: centroBalde() } };
        const lista = ordenadas().filter(T => !T.ocupada);
        if (!lista.length) return null;
        if (!fez.contar) return { id: 'contar', texto: 'Toque numa torre para contar!', gesto: { tipo: 'tocar', em: centroCubo(lista[0], 0) } };
        const par = !fez.juntar ? parJuntavel() : null;
        if (par) {
          const r = par.B.t.retangulo();
          return { id: 'juntar', texto: 'Arraste uma torre para cima da outra!',
            gesto: { tipo: 'arrastar', de: centroCubo(par.A, 0), para: { x: par.B.t.x, y: Math.max(200, r.y - 40) } } };
        }
        if (!fez.separar && torres.length < limites().torres) {
          const alta = lista.find(T => T.t.n >= 2 && cabe(ns(T).concat(T.t.n - 1, 1)));
          const x = alta ? lugarSemIma(LADO, IMA_ALTO) : null;
          if (alta && x != null) {
            return { id: 'separar', texto: 'Puxe o cubinho de cima para separar!',
              gesto: { tipo: 'arrastar', de: centroCubo(alta, alta.t.n - 1), para: { x, y: BASE_Y - 160 } } };
          }
        }
        if (!fez.mesa && podeTorreNova(1)) {
          const x = lugarSemIma(LADO, IMA_CUBO);
          if (x != null) return { id: 'mesa', texto: 'Arraste um cubinho para a mesa!', gesto: { tipo: 'arrastar', de: centroBalde(), para: { x, y: BASE_Y - 120 } } };
        }
        return null;
      }
      function mostrarDica(pedida) {
        if (!vivo || arrasto) return;
        let d = proximaDica();
        if (!d && pedida) {
          const T = ordenadas()[0];
          d = T ? { id: 'contar', texto: 'Toque numa torre para contar!', gesto: { tipo: 'tocar', em: centroCubo(T, 0) } }
            : { id: 'balde', texto: 'Toque no balde para pegar cubinhos!', gesto: { tipo: 'tocar', em: centroBalde() } };
        }
        if (!d) return;
        if (!pedida) {
          vezesDica[d.id] = (vezesDica[d.id] || 0) + 1;
          if (vezesDica[d.id] > VEZES_DICA) return;
        }
        pararDica();
        falar(d.texto, { pose: 'aponta', mostrar: d.id === 'balde' ? miniBalde() : null });
        const g = d.gesto;
        dicaMao = g.tipo === 'arrastar' ? PC.ui.dica(g.de, g.para, { raiz }) : PC.ui.dica(g.em, null, { raiz, vezes: 3 });
      }
      // app em segundo plano: a contagem para (senão a voz continuaria os números com a tela apagada)
      const aoEsconder = () => { if (document.hidden) pararContagem(); };
      document.addEventListener('visibilitychange', aoEsconder);
      desligar.push(() => document.removeEventListener('visibilitychange', aoEsconder));
      desligar.push(PC.on('nativo:pausa', () => pararContagem()));
      // relógio das sugestões: só corre quando a criança pode agir (sem fala, contagem, voo ou arraste) e o app está à vista
      const relogio = setInterval(() => {
        if (!vivo) return;
        if (document.hidden || arrasto || voando || contagem || PC.ui.pipoca.falando() || PC.arrastar.ativo()) { parado = 0; return; }
        parado += 500;
        if (parado >= DICA_MS) { parado = 0; mostrarDica(false); }
      }, 500);

      // ------------------------------------------------------------ começo
      const lim0 = limites();
      const iniciais = (Array.isArray(params.torres) ? params.torres.slice(0, lim0.torres) : [])
        .map(v => U.limitar(Math.round(Number(v) || 0), 0, lim0.cubos)).filter(n => n > 0);
      iniciais.forEach((n, i) => {
        // na ordem pedida, da esquerda para a direita (a arrumação tira as sobreposições)
        if (podeTorreNova(n)) criarTorre(X0 + (i + 0.5) * (X1 - X0) / iniciais.length, n);
      });
      arrumar({ animar: false });

      (async () => {
        try {
          await U.esperar(420, sair.signal);
          if (!vivo || mexeu) return;
          if (!torres.length) {
            falar('Vamos montar torres! Toque no balde.', { pose: 'aponta', mostrar: miniBalde() });
            dicaMao = PC.ui.dica(centroBalde(), null, { raiz, vezes: 3 });
          } else {
            falar('Toque numa torre para contar!', { pose: 'aponta' });
          }
        } catch (e) {
          if (!U.ehAbortado(e)) console.error(e);
        }
      })();

      // ------------------------------------------------------------ ajudas para testes (só no navegador)
      let meuGesto = null, meuDebug = null, minhaOcupada = null;
      if (!PC.modoApp) {
        // PC.debug.esperarOcioso também espera a contagem, o voo do cubinho e as peças que ainda estão se mexendo
        minhaOcupada = () => !!(voando || contagem || arrasto) || performance.now() < animaAte || torres.some(T => T.ocupada);
        PC.debug.telaOcupada = minhaOcupada;
        // {"gesto": true} do testador: a próxima brincadeira sugerida; sem sugestão, toca no balde ou conta uma torre
        meuGesto = () => {
          try {
            const d = proximaDica();
            if (d) return d.gesto;
            if (!escolherDestino().motivo) return { tipo: 'tocar', em: centroBalde() };
            const T = ordenadas()[0];
            return T ? { tipo: 'tocar', em: centroCubo(T, 0) } : { tipo: 'tocar', em: centroBalde() };
          } catch (e) { console.error(e); return null; }
        };
        meuDebug = {
          estado: () => ({
            torres: ordenadas().map(T => T.t.n),
            xs: ordenadas().map(T => Math.round(T.t.x)),
            atual: atual ? ordenadas().indexOf(atual) : -1,
            limite: limites(),
            voando: !!voando, contando: !!contagem, arrastando: !!arrasto,
            fez: Object.assign({}, fez),
          }),
          limpar: () => limpar(),
        };
        PC.debug.proximoGestoVirtual = meuGesto;
        PC.debug.livre = meuDebug;
      }

      return {
        destruir() {
          if (!vivo) return;
          vivo = false;
          // o gesto que ainda estiver em andamento é só largado (os ouvintes desligados abaixo não mexem mais na mesa)
          const a = arrasto;
          arrasto = null;
          sair.abort();
          clearInterval(relogio);
          pararDica();
          if (contagem) { contagem.ac.abort(); contagem = null; }
          desligar.forEach(f => { try { f(); } catch (e) { console.error(e); } });
          torres.forEach(T => { if (T.desligar) { const d = T.desligar; T.desligar = null; d(); } });
          if (a && a.tipo === 'torre' && a.D.desligar) { const d = a.D.desligar; a.D.desligar = null; d(); }
          if (meuGesto && PC.debug.proximoGestoVirtual === meuGesto) PC.debug.proximoGestoVirtual = null;
          if (minhaOcupada && PC.debug.telaOcupada === minhaOcupada) PC.debug.telaOcupada = null;
          if (meuDebug && PC.debug.livre === meuDebug) delete PC.debug.livre;
        },
        /** Voltar (HUD ou Android): segue o padrão da tela (mapa). */
        voltar() { return false; },
      };
    },
  });
})();
