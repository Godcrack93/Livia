/* Pipoca Conta — núcleo: namespace PC, utilidades, palco virtual, toque/arraste, eventos, registros e ponte nativa.
   Todo o jogo vive em window.PC. Os outros arquivos penduram as suas partes aqui.
   Regra de carga: nenhum arquivo chama outro módulo no nível do topo; tudo roda depois de app.js iniciar. */
(function () {
  'use strict';

  const PC = window.PC = window.PC || {};
  PC.versao = '1.0.0';
  PC.V = { L: 1600, A: 900 };                         // palco virtual
  PC.config = Object.assign({
    estacoesGratis: 4,                                  // estações liberadas sem assinatura
    produtoAssinatura: 'pipoca_mensal',
    debug: false,
    rapido: false,                                      // testes: esperas e animações curtas
  }, PC.config || {});

  // ---------------------------------------------------------------- cores, estilo e layout (um lugar só)
  PC.cores = {
    tinta: '#3A2A5A', tintaSuave: '#6E5E92', papel: '#FFFFFF', creme: '#FFF8EC',
    coral: '#FF7A6B', turquesa: '#2EC4B6', ouro: '#FFC93C', verde: '#5CC84A', verdeEscuro: '#3E9A30',
    azul: '#4DA3FF', roxo: '#9B7BFF', rosa: '#FF8FC2', laranja: '#FF9F43', ceu: '#BFE8FF',
    caramelo: '#C98A55', carameloEscuro: '#9C6338', focinho: '#8A5634', madeira: '#B98546', madeiraEscura: '#8A5A34',
    giz: '#F4F1E8', lousa: '#2F5D50', agua: '#5EC8E8', grama: '#7FCB65',
    // padrão de 5 em 5 dos cubinhos (Torre, Separar, Brincar livre): 1–5 roxo, 6–10 dourado (e o mesmo de 11 a 20)
    cincoA: '#9B7BFF', cincoB: '#FFC93C',
    // cores por PAPEL da torre na rodada, sorteadas a cada rodada — NUNCA uma cor por quantidade.
    // Poucas cores, com claridades bem diferentes (daltonismo); a 2ª parte de uma soma também ganha estampa.
    torres: ['#6C4FD8', '#FFD23F', '#1FA89B', '#FF8FC2'],
  };
  /**
   * Sorteia a "pintura" de k torres de uma rodada: cada uma com cor E estampa próprias ('#cor|estampa'), para que
   * duas partes juntas sempre se distingam, inclusive para daltônicos. Passe o texto direto em new PC.Torre({cor}).
   */
  PC.cores.sortearTorres = k => {
    const cores = PC.util.embaralhar(PC.cores.torres);
    const estampas = ['', 'listras', 'bolinhas', 'xadrez'];
    const r = [];
    for (let i = 0; i < k; i++) r.push(cores[i % cores.length] + (estampas[i % estampas.length] ? '|' + estampas[i % estampas.length] : ''));
    return r;
  };

  PC.estilo = { traco: 5, raio: 18, contorno: '#3A2A5A' };

  /** Posições e tamanhos padrão do palco (px virtuais). Use estes valores em vez de inventar. */
  PC.layout = {
    faixaHud: 140,                                       // y < 140 é do HUD (voltar, progresso, ouvir)
    chao: 800,                                           // linha do chão: base das torres e dos personagens
    cantoPipoca: { x: 0, y: 600, l: 290, a: 300 },       // a Pipoca apresentadora
    zonaBalao: { x: 10, y: 380, l: 560, a: 220 },        // o balão de fala (aparece acima da Pipoca)
    margemLateral: 120,                                  // nada arrastável a menos disso das bordas (gesto voltar)
    alvoMinimo: 140,                                     // área de toque mínima de tudo que a criança toca (≈ 56 dp no celular)
    alvoPrincipal: 170,                                  // ação principal da rodada
    numeroMinimo: 64,                                    // altura mínima de algarismo que a criança lê
    textoAdulto: 34,                                     // fonte mínima nas telas dos adultos
    cubo: 64,
  };

  // ---------------------------------------------------------------- utilidades
  const U = PC.util = {};

  /** Cria um elemento HTML. attrs: class, style (texto ou objeto), on: {evento: fn}, html, text, dataset, teste e atributos. */
  U.el = function (tag, attrs, ...filhos) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'style') { if (typeof v === 'string') e.style.cssText = v; else Object.assign(e.style, v); }
        else if (k === 'on') { for (const ev of Object.keys(v)) e.addEventListener(ev, v[ev]); }
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'dataset') Object.assign(e.dataset, v);
        else if (k === 'teste') e.dataset.teste = v;
        else e.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (const f of filhos.flat(Infinity)) {
      if (f == null || f === false) continue;
      e.append(f instanceof Node ? f : document.createTextNode(String(f)));
    }
    return e;
  };

  /** Cria um elemento a partir de texto (serve para <svg>...</svg>). */
  U.svg = function (markup) {
    const t = document.createElement('template');
    t.innerHTML = String(markup).trim();
    return t.content.firstElementChild;
  };

  /** Cria um elemento SVG (namespace certo). */
  U.svgEl = function (tag, attrs, ...filhos) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) for (const k of Object.keys(attrs)) if (attrs[k] != null) e.setAttribute(k, String(attrs[k]));
    filhos.flat(Infinity).forEach(f => { if (f != null) e.append(f); });
    return e;
  };

  // sorteio com semente (#semente=N na URL deixa os testes repetíveis). NUNCA use Math.random fora do núcleo.
  let semente = (Date.now() ^ 0x5bd1e995) >>> 0;
  U.semear = n => { semente = (Number(n) >>> 0) || 1; };
  U.acaso = () => {                                       // mulberry32
    semente = (semente + 0x6D2B79F5) >>> 0;
    let t = semente;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  U.aleatorio = (min, max) => Math.floor(U.acaso() * (max - min + 1)) + min;
  U.escolher = lista => lista[Math.floor(U.acaso() * lista.length)];
  U.embaralhar = lista => {
    const a = lista.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(U.acaso() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  U.limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  U.distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  U.dentro = (p, r, folga = 0) => p.x >= r.x - folga && p.x <= r.x + r.l + folga && p.y >= r.y - folga && p.y <= r.y + r.a + folga;

  /** Erro de cancelamento (rodada terminou ou a criança saiu). O núcleo ignora esse erro quando não é tratado. */
  U.abortado = function () { const e = new Error('abortado'); e.name = 'AbortError'; e.abortado = true; return e; };
  U.ehAbortado = e => !!(e && (e.abortado || e.name === 'AbortError'));

  /** Duração ajustada (no modo rápido de teste, tudo encurta). */
  U.duracao = ms => (PC.config.rapido ? Math.max(1, ms * 0.12) : ms);

  /** Espera ms milissegundos. Rejeita com AbortError se o sinal abortar. */
  U.esperar = function (ms, sinal) {
    return new Promise((resolve, reject) => {
      if (sinal && sinal.aborted) { reject(U.abortado()); return; }
      const t = setTimeout(() => { if (sinal) sinal.removeEventListener('abort', ab); resolve(); }, Math.max(0, U.duracao(ms)));
      function ab() { clearTimeout(t); reject(U.abortado()); }
      if (sinal) sinal.addEventListener('abort', ab, { once: true });
    });
  };
  U.quadro = () => new Promise(r => requestAnimationFrame(() => r()));

  /** Animação com Web Animations (anime só transform e opacity); devolve Promise que nunca rejeita. */
  U.animar = function (el, quadros, opcoes) {
    if (!el || !el.animate) return Promise.resolve();
    const o = typeof opcoes === 'number' ? { duration: opcoes } : Object.assign({}, opcoes);
    if (o.duration) o.duration = U.duracao(o.duration);
    if (o.delay) o.delay = U.duracao(o.delay);
    try { return el.animate(quadros, o).finished.then(() => {}, () => {}); } catch (e) { return Promise.resolve(); }
  };

  /** Clareia (fator > 0) ou escurece (fator < 0) uma cor #rrggbb. */
  U.tom = function (cor, fator) {
    const m = /^#?([0-9a-f]{6})$/i.exec(cor || '');
    if (!m) return cor;
    const n = parseInt(m[1], 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (fator >= 0) { r += (255 - r) * fator; g += (255 - g) * fator; b += (255 - b) * fator; }
    else { r *= 1 + fator; g *= 1 + fator; b *= 1 + fator; }
    const h = v => Math.round(U.limitar(v, 0, 255)).toString(16).padStart(2, '0');
    return '#' + h(r) + h(g) + h(b);
  };

  /** Injeta o CSS de um módulo uma única vez. Use classes com prefixo pc-<modulo>- . */
  U.estilo = function (id, css) {
    if (document.querySelector('style[data-modulo="' + id + '"]')) return;
    const s = document.createElement('style');
    s.dataset.modulo = id;
    s.textContent = css;
    document.head.appendChild(s);
  };
  U.css = U.estilo;

  /** Garante uma função chamada uma vez só. */
  U.umaVez = function (fn) { let feito = false; return function (...a) { if (feito) return; feito = true; return fn.apply(this, a); }; };

  // ---------------------------------------------------------------- eventos
  const ouvintes = {};
  PC.on = function (nome, fn) { (ouvintes[nome] = ouvintes[nome] || []).push(fn); return () => PC.off(nome, fn); };
  PC.off = function (nome, fn) { const l = ouvintes[nome]; if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); } };
  PC.emitir = function (nome, dados) { (ouvintes[nome] || []).slice().forEach(fn => { try { fn(dados); } catch (e) { console.error(e); } }); };

  // ---------------------------------------------------------------- palco virtual
  const palco = PC.palco = { escala: 1, ox: 0, oy: 0, el: null, raiz: null };

  function lerSeguro(nome) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(nome);
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  /** Recalcula a escala. Nunca guarde PC.palco.escala em variável: ela muda ao girar/redimensionar. */
  palco.ajustar = function () {
    if (!palco.el) return;
    const topo = lerSeguro('--seguro-topo'), base = lerSeguro('--seguro-base');
    const esq = lerSeguro('--seguro-esq'), dir = lerSeguro('--seguro-dir');
    const w = Math.max(1, window.innerWidth - esq - dir), h = Math.max(1, window.innerHeight - topo - base);
    const s = Math.min(w / PC.V.L, h / PC.V.A);
    palco.escala = s;
    palco.ox = esq + (w - PC.V.L * s) / 2;
    palco.oy = topo + (h - PC.V.A * s) / 2;
    palco.el.style.transform = `translate(${palco.ox}px, ${palco.oy}px) scale(${s})`;
    document.documentElement.classList.toggle('pc-retrato', window.innerWidth / Math.max(1, window.innerHeight) < 1.2);
    PC.emitir('palco:ajustado', { escala: s });
  };
  palco.aoMudar = fn => PC.on('palco:ajustado', fn);

  palco.montar = function (raiz) {
    palco.raiz = raiz;
    palco.el = raiz.querySelector('#palco');
    palco.ajustar();
    window.addEventListener('resize', palco.ajustar);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', palco.ajustar);
  };

  /** Converte coordenadas da tela (clientX/Y) para o palco virtual. */
  palco.paraVirtual = (cx, cy) => ({ x: (cx - palco.ox) / palco.escala, y: (cy - palco.oy) / palco.escala });
  /** Converte coordenadas do palco virtual para a tela. */
  palco.paraTela = (x, y) => ({ x: x * palco.escala + palco.ox, y: y * palco.escala + palco.oy });
  /** Retângulo de um elemento em pixels virtuais. */
  palco.retangulo = function (el) {
    const r = el.getBoundingClientRect();
    const a = palco.paraVirtual(r.left, r.top);
    const l = r.width / palco.escala, al = r.height / palco.escala;
    return { x: a.x, y: a.y, l, a: al, cx: a.x + l / 2, cy: a.y + al / 2 };
  };

  // ---------------------------------------------------------------- bloqueio curto de toques (toques que "sobram")
  let bloqueadoAte = 0;
  /** Ignora toques novos por ms (depois de acertos, trocas de rodada e de tela). */
  PC.bloquearToques = ms => { bloqueadoAte = Math.max(bloqueadoAte, performance.now() + U.duracao(ms)); };
  PC.toquesBloqueados = () => performance.now() < bloqueadoAte;

  // ---------------------------------------------------------------- arrastar ("manda o dedo que se mexe")
  let ativo = null;   // { id, el, cancelar(), ultimoMovimento }

  function palma(ev) {
    // contatos muito largos (palma apoiada), quando o aparelho informa o tamanho do toque
    return ev.pointerType === 'touch' && (ev.width > 70 || ev.height > 70);
  }
  function naBorda(ev) {
    if (ev.pointerType !== 'touch') return false;
    const m = 0.03;
    return ev.clientX < window.innerWidth * m || ev.clientX > window.innerWidth * (1 - m);
  }

  /**
   * Liga toque/arraste num elemento.
   * opcoes: aoPressionar(p, ev), aoComecar(p, ev), aoMover(p, ev), aoSoltar(p, ev), aoTocar(p, ev), aoCancelar(p),
   *         aoDesistir(p) (toque cancelado ANTES de virar arraste), podeComecar(ev) -> boolean, limiar (px de TELA, padrão 10).
   * p = {x, y, dx, dy, inicio} em px virtuais (dx/dy desde o toque inicial).
   * Garantias: aoComecar só depois de passar do limiar; aoTocar e aoComecar são exclusivos; depois de aoComecar vem
   * SEMPRE exatamente um aoSoltar ou um aoCancelar. Um gesto por vez no jogo inteiro; se o dedo atual está parado há
   * mais de 300 ms e outro dedo começa, o atual é cancelado (aoCancelar) e o novo assume.
   * Devolve desligar().
   */
  PC.arrastar = function (el, op) {
    op = op || {};
    const limiar = op.limiar != null ? op.limiar : 10;
    let at = null;   // { id, inicio, telaInicio, arrastando }
    el.style.touchAction = 'none';

    function ponto(ev) {
      const p = palco.paraVirtual(ev.clientX, ev.clientY);
      p.inicio = at ? at.inicio : { x: p.x, y: p.y };
      p.dx = p.x - p.inicio.x; p.dy = p.y - p.inicio.y;
      return p;
    }
    function chamar(fn, p, ev) { try { fn(p, ev); } catch (e) { console.error(e); } }
    function largar() {
      window.removeEventListener('pointermove', mover, true);
      window.removeEventListener('pointerup', soltar, true);
      window.removeEventListener('pointercancel', cancelarEv, true);
      if (at) { try { el.releasePointerCapture(at.id); } catch (e) { /* ok */ } }
      if (ativo && at && ativo.id === at.id && ativo.el === el) ativo = null;
      at = null;
    }
    function cancelar(p) {
      if (!at) return;
      const arrastou = at.arrastando, ponto0 = p || at.inicio;
      largar();
      if (arrastou) {
        if (op.aoCancelar) chamar(op.aoCancelar, ponto0);
        else if (op.aoSoltar) chamar(op.aoSoltar, ponto0, null);
      } else if (op.aoDesistir) {
        // o toque acabou sem virar toque nem arraste (outro dedo assumiu, o sistema cancelou): desfaça o "apertado"
        chamar(op.aoDesistir, ponto0, null);
      }
    }
    function pressionar(ev) {
      if (at) return;
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      if (PC.toquesBloqueados() || palma(ev) || naBorda(ev)) return;
      if (ativo) {
        // outro gesto em andamento: só rouba se o dedo dele está parado há um tempo
        if (performance.now() - ativo.ultimoMovimento < 300) return;
        ativo.cancelar();
      }
      if (op.podeComecar && !op.podeComecar(ev)) return;
      ev.preventDefault();
      ev.stopPropagation();
      const ini = palco.paraVirtual(ev.clientX, ev.clientY);
      at = { id: ev.pointerId, inicio: ini, telaInicio: { x: ev.clientX, y: ev.clientY }, arrastando: false };
      ativo = { id: ev.pointerId, el, cancelar: () => cancelar(null), ultimoMovimento: performance.now() };
      try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ok */ }
      window.addEventListener('pointermove', mover, true);
      window.addEventListener('pointerup', soltar, true);
      window.addEventListener('pointercancel', cancelarEv, true);
      PC.emitir('toque', ini);
      if (op.aoPressionar) chamar(op.aoPressionar, ponto(ev), ev);
    }
    function mover(ev) {
      if (!at || ev.pointerId !== at.id) return;
      ev.preventDefault();
      const p = ponto(ev);
      if (!at.arrastando) {
        if (Math.hypot(ev.clientX - at.telaInicio.x, ev.clientY - at.telaInicio.y) < limiar) return;
        at.arrastando = true;
        if (op.aoComecar) chamar(op.aoComecar, p, ev);
      }
      if (ativo && ativo.id === at.id) ativo.ultimoMovimento = performance.now();
      if (op.aoMover) chamar(op.aoMover, p, ev);
    }
    function soltar(ev) {
      if (!at || ev.pointerId !== at.id) return;
      ev.preventDefault();
      const p = ponto(ev), arrastou = at.arrastando;
      largar();
      if (arrastou) { if (op.aoSoltar) chamar(op.aoSoltar, p, ev); }
      else if (op.aoTocar) chamar(op.aoTocar, p, ev);
    }
    function cancelarEv(ev) { if (at && ev.pointerId === at.id) cancelar(ponto(ev)); }

    el.addEventListener('pointerdown', pressionar);
    return function desligar() {
      el.removeEventListener('pointerdown', pressionar);
      cancelar(null);
    };
  };
  /** Cancela o gesto em andamento (a moldura chama no acerto e ao sair). */
  PC.arrastar.cancelarTodos = () => { if (ativo) ativo.cancelar(); };
  /** Há um gesto (arraste) acontecendo? */
  PC.arrastar.ativo = () => !!ativo;
  PC.arrastando = PC.arrastar.ativo;
  PC.liberarArraste = PC.arrastar.cancelarTodos;

  // ---------------------------------------------------------------- toque simples (botões)
  /** Chama fn ao tocar (soltar o dedo dentro do elemento). Ignora toques durante arrastes e logo depois de acertos. */
  PC.aoTocar = function (el, fn, { intervalo = 400, som = true } = {}) {
    let ultimo = 0, apertado = false;
    el.style.touchAction = 'manipulation';
    el.addEventListener('pointerdown', ev => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      if (ativo || PC.toquesBloqueados() || palma(ev)) return;
      apertado = true; el.classList.add('apertado');
      PC.emitir('toque', palco.paraVirtual(ev.clientX, ev.clientY));
    });
    const solta = () => { apertado = false; el.classList.remove('apertado'); };
    el.addEventListener('pointerleave', solta);
    el.addEventListener('pointercancel', solta);
    el.addEventListener('pointerup', ev => {
      if (!apertado) return;
      solta();
      const agora = performance.now();
      if (agora - ultimo < intervalo || el.disabled) return;
      ultimo = agora;
      if (som && PC.som) PC.som.clique();
      try { fn(ev); } catch (e) { console.error(e); }
    });
    el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fn(ev); } });
  };

  // ---------------------------------------------------------------- registros
  PC.atividades = {
    lista: {},
    registrar(id, def) { def.id = id; this.lista[id] = def; PC.emitir('atividade:registrada', id); },
    obter(id) { return this.lista[id] || null; },
  };

  // ---------------------------------------------------------------- ponte com o Android (PROJETO.md, seção 10)
  // O app injeta window.PipocaAndroid com WebViewCompat.addWebMessageListener (só para a origem do app).
  // JS → Android: PC.nativo.enviar(tipo, dados) manda {tipo, ...dados} em JSON.
  // Android → JS: mensagens {tipo, ...} chegam em PipocaAndroid.onmessage e viram eventos 'nativo:<tipo>'.
  PC.nativo = {
    disponivel: () => !!(window.PipocaAndroid && typeof window.PipocaAndroid.postMessage === 'function'),
    enviar(tipo, dados) {
      if (!PC.nativo.disponivel()) return false;
      try { window.PipocaAndroid.postMessage(JSON.stringify(Object.assign({ tipo }, dados || {}))); return true; }
      catch (e) { console.error(e); return false; }
    },
    /** Recebe uma mensagem do Android (objeto ou texto JSON). */
    evento(dados) {
      if (typeof dados === 'string') { try { dados = JSON.parse(dados); } catch (e) { return; } }
      if (!dados || !dados.tipo) return;
      if (dados.tipo === 'estado') {            // pacote inicial: {voz, assinatura, insets}
        PC.depuracao = !!dados.depuracao;       // APK de teste (debug): permite o modo desenvolvedor
        if (dados.voz) PC.emitir('nativo:voz', dados.voz);
        if (dados.assinatura) PC.emitir('nativo:assinatura', { estado: dados.assinatura });
        if (dados.insets) PC.emitir('nativo:insets', dados.insets);
        return;
      }
      PC.emitir('nativo:' + dados.tipo, dados);
    },
    ouvir: (tipo, fn) => PC.on('nativo:' + tipo, fn),
    /** Botão voltar (o Android só manda quando o jogo disse que pode voltar). */
    voltar() {
      try { return !!(PC.telas && PC.telas.voltar()); } catch (e) { console.error(e); return true; }
    },
  };
  PC.nativo.receber = PC.nativo.evento;
  function ligarPonte() {
    if (!PC.nativo.disponivel()) return;
    try { window.PipocaAndroid.onmessage = ev => PC.nativo.evento(ev && ev.data); } catch (e) { /* ok */ }
  }
  ligarPonte();
  PC.ligarPonte = ligarPonte;                    // usado pela ponte falsa dos testes
  PC.on('nativo:voltar', () => PC.nativo.voltar());
  PC.on('nativo:insets', d => {
    const raiz = document.documentElement.style;
    raiz.setProperty('--seguro-esq', (Number(d.esq) || 0) + 'px');
    raiz.setProperty('--seguro-topo', (Number(d.topo) || 0) + 'px');
    raiz.setProperty('--seguro-dir', (Number(d.dir) || 0) + 'px');
    raiz.setProperty('--seguro-base', (Number(d.base) || 0) + 'px');
    if (PC.palco) PC.palco.ajustar();
  });

  // ---------------------------------------------------------------- erros
  PC.erros = [];
  window.addEventListener('error', ev => { PC.erros.push(String(ev.message || ev.error)); });
  window.addEventListener('unhandledrejection', ev => {
    if (U.ehAbortado(ev.reason)) { ev.preventDefault(); return; }   // cancelamentos são normais
    PC.erros.push(String(ev.reason && ev.reason.stack || ev.reason));
  });
  // sem menu de toque longo nem seleção
  document.addEventListener('contextmenu', ev => ev.preventDefault());

  PC.debug = PC.debug || {};
})();
