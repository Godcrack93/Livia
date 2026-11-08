/* Pipoca Conta — componente de torre de cubinhos de encaixe (PC.Torre).
   Usado pela Torre, Juntar, Separar e Brincar livre. Coordenadas sempre no palco virtual.
   (x, y) é o CENTRO DA BASE da torre: os cubinhos sobem a partir dali e a plaquinha com o número fica logo abaixo.
   Até 10 cubinhos: uma pilha. De 11 a 20: a pilha da dezena (com fitinha) e, ao lado, a pilha das unidades. */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;
  const LADO = 64;          // lado do cubinho (px virtuais)
  const VAO = 20;           // espaço entre a dezena e as unidades
  const MAX = 20;

  const corPadraoCinco = i => ((i % 10) < 5 ? PC.cores.cincoA : PC.cores.cincoB);
  // cor clara? (para a estampa sair escura e visível)
  const claro = cor => {
    const m = /^#?([0-9a-f]{6})$/i.exec(cor || '');
    if (!m) return false;
    const n = parseInt(m[1], 16);
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 160;
  };

  class Torre {
    /**
     * opcoes: x, y (centro da base), cores (lista, uma por cubinho) OU n + cor OU n + padrao 'cinco' (padrão),
     *         tamanho (px do cubinho, padrão 64), placa ('base' = plaquinha com o número presa na base, padrão; false = sem)
     *         O número NUNCA flutua acima da torre (PROJETO.md, seção 2).
     */
    constructor(opcoes = {}) {
      const { x = 800, y = 800, cores = null, n = 0, cor = null, padrao = null, tamanho = LADO } = opcoes;
      const numero = opcoes.placa !== undefined ? opcoes.placa !== false : opcoes.numero !== false;
      this.k = tamanho / LADO;
      this.padrao = padrao || (cores || cor ? null : 'cinco');
      this.cores = cores ? cores.slice(0, MAX) : Array.from({ length: Math.min(n, MAX) }, (_, i) => cor || corPadraoCinco(i));
      this.el = U.el('div', { class: 'torre' });
      this.interno = U.el('div', { class: 'torre-interno', style: 'position:absolute;left:0;top:0' });
      if (this.k !== 1) this.interno.style.transform = `scale(${this.k})`, this.interno.style.transformOrigin = '0 0';
      this.el.appendChild(this.interno);
      this.cubos = [];
      this.fita = null;
      this.placa = numero ? U.el('div', { class: 'torre-placa' }) : null;
      if (this.placa) this.interno.appendChild(this.placa);
      this.x = x; this.y = y;
      this.el.style.left = x + 'px'; this.el.style.top = y + 'px';
      this._desenhar(-1);
    }

    /** Quantidade de cubinhos. */
    get n() { return this.cores.length; }
    /** Cor do cubinho i. */
    corDe(i) { return this.padrao === 'cinco' ? corPadraoCinco(i) : this.cores[i]; }

    // posição (relativa à base, sem escala) do canto superior esquerdo do cubinho i quando a torre tem total cubinhos
    _pos(i, total) {
      const s = LADO;
      if (total <= 10) return { x: -s / 2, y: -(i + 1) * s };
      const larg = 2 * s + VAO, x0 = -larg / 2;
      if (i < 10) return { x: x0, y: -(i + 1) * s };
      return { x: x0 + s + VAO, y: -(i - 10 + 1) * s };
    }

    _desenhar(novoDe) {
      const n = this.n;
      // cria ou remove elementos
      while (this.cubos.length < n) {
        const c = U.el('div', { class: 'cubo' });
        this.interno.insertBefore(c, this.placa || null);
        this.cubos.push(c);
      }
      while (this.cubos.length > n) this.cubos.pop().remove();
      for (let i = 0; i < n; i++) {
        const c = this.cubos[i], p = this._pos(i, n), pintura = this.corDe(i);
        c.style.left = p.x + 'px'; c.style.top = p.y + 'px';
        if (c.dataset.cor !== pintura) {
          // pintura = '#cor' ou '#cor|estampa' (listras, bolinhas, xadrez)
          const [cor, estampa] = String(pintura).split('|');
          c.dataset.cor = pintura;
          c.style.setProperty('--c', cor);
          c.style.setProperty('--c-claro', U.tom(cor, 0.45));
          c.style.setProperty('--c-escuro', U.tom(cor, -0.18));
          c.className = 'cubo' + (estampa ? ' estampa-' + estampa + (claro(cor) ? ' estampa-escura' : '') : '');
        }
        c.classList.remove('chega');
        if (novoDe >= 0 && i >= novoDe) { void c.offsetWidth; c.classList.add('chega'); }
      }
      // fitinha de cada dezena completa (no 10 e no 20); some quando a dezena se desfaz
      const dezenas = Math.floor(n / 10);
      this.fitas = this.fitas || [];
      while (this.fitas.length < dezenas) { const f = U.el('div', { class: 'fitinha' }); this.interno.appendChild(f); this.fitas.push(f); }
      while (this.fitas.length > dezenas) this.fitas.pop().remove();
      this.fitas.forEach((f, d) => {
        const p = this._pos(d * 10, n);
        f.style.left = (p.x - 6) + 'px';
        f.style.top = (-5 * LADO - 11) + 'px';
      });
      this.fita = this.fitas[0] || null;
      // plaquinha
      if (this.placa) {
        this.placa.textContent = String(n);
        this.placa.style.left = '0px';
        this.placa.hidden = n === 0;
      }
    }

    _pulsarPlaca() {
      if (!this.placa) return;
      this.placa.classList.remove('pulsa'); void this.placa.offsetWidth; this.placa.classList.add('pulsa');
    }

    /** Acrescenta um cubinho no topo. Devolve false se já tem 20. */
    adicionar(cor, { animar = true } = {}) {
      if (this.n >= MAX) return false;
      this.cores.push(cor || (this.padrao === 'cinco' ? corPadraoCinco(this.n) : PC.cores.coral));
      this._desenhar(animar ? this.n - 1 : -1);
      this._pulsarPlaca();
      return true;
    }

    /** Acrescenta vários cubinhos de uma vez (ex.: uma dezena pronta). Devolve quantos entraram. */
    adicionarVarios(qtdOuCores, { animar = true } = {}) {
      const lista = Array.isArray(qtdOuCores) ? qtdOuCores : Array.from({ length: qtdOuCores }, () => null);
      const de = this.n;
      for (const cor of lista) {
        if (this.n >= MAX) break;
        this.cores.push(cor || (this.padrao === 'cinco' ? corPadraoCinco(this.n) : PC.cores.cincoA));
      }
      this._desenhar(animar ? de : -1);
      this._pulsarPlaca();
      return this.n - de;
    }

    /**
     * Com 11 a 19 cubinhos: tira a dezena inteira (os 10 de baixo, presos pela fitinha) numa torre nova,
     * posicionada onde a dezena estava, e as unidades ficam nesta torre. Devolve a nova torre ou null.
     */
    separarDezena() {
      if (this.n <= 10 || this.n >= 20) return null;
      const r0 = this.retanguloCubo(0);
      const dezena = this.cores.splice(0, 10);
      const nova = new Torre({ x: r0.x + r0.l / 2, y: this.y, cores: dezena, padrao: this.padrao, tamanho: LADO * this.k, placa: this.placa ? 'base' : false });
      if (this.el.parentNode) this.el.parentNode.insertBefore(nova.el, this.el);
      this._desenhar(-1);
      this._pulsarPlaca();
      return nova;
    }

    /** Tira qtd cubinhos do topo. Devolve as cores tiradas. */
    remover(qtd = 1) {
      const tiradas = this.cores.splice(Math.max(0, this.n - qtd));
      this._desenhar(-1);
      this._pulsarPlaca();
      return tiradas;
    }

    /** Troca todo o conteúdo de uma vez (sem animação). */
    definir(cores) { this.cores = cores.slice(0, MAX); this._desenhar(-1); }

    /**
     * Separa os cubinhos de índice k até o topo numa torre nova, posicionada exatamente onde eles estavam
     * (a nova torre é colocada no mesmo pai). Devolve a nova torre, ou null se k for 0 ou >= n.
     */
    dividir(k) {
      if (k <= 0 || k >= this.n) return null;
      const r = this.retanguloCubo(k);
      const tiradas = this.cores.splice(k);
      const nova = new Torre({ x: r.x + r.l / 2, y: r.y + r.a, cores: tiradas, padrao: this.padrao, tamanho: LADO * this.k, placa: this.placa ? 'base' : false });
      if (this.el.parentNode) this.el.parentNode.insertBefore(nova.el, this.el.nextSibling);
      this._desenhar(-1);
      this._pulsarPlaca();
      return nova;
    }

    /** Põe os cubinhos de outra torre em cima desta (a outra é destruída). Devolve false se passaria de 20. */
    juntar(outra, { animar = true } = {}) {
      if (!outra || outra === this || this.n + outra.n > MAX) return false;
      const de = this.n;
      for (let i = 0; i < outra.n; i++) this.cores.push(outra.corDe(i));
      outra.destruir();
      this._desenhar(animar ? de : -1);
      this._pulsarPlaca();
      return true;
    }

    /** Retângulo (virtual) do cubinho i: {x, y, l, a}. */
    retanguloCubo(i) {
      const p = this._pos(i, this.n), s = LADO * this.k;
      return { x: this.x + p.x * this.k, y: this.y + p.y * this.k, l: s, a: s };
    }

    /** Retângulo (virtual) da torre inteira, sem a plaquinha. */
    retangulo() {
      const s = LADO * this.k, n = this.n;
      const l = (n <= 10 ? LADO : 2 * LADO + VAO) * this.k, a = Math.max(1, Math.min(n, 10)) * s;
      return { x: this.x - l / 2, y: this.y - a, l, a, cx: this.x, cy: this.y - a / 2 };
    }

    /** Índice do cubinho no ponto (x, y) virtual, ou -1. folga em px virtuais. */
    cuboEm(x, y, folga = 6) {
      const p = { x, y };
      for (let i = this.n - 1; i >= 0; i--) if (U.dentro(p, this.retanguloCubo(i), 0)) return i;
      // fora de todos: o mais perto dentro da folga
      let melhor = -1, dist = Infinity;
      for (let i = 0; i < this.n; i++) {
        const r = this.retanguloCubo(i);
        if (!U.dentro(p, r, folga)) continue;
        const d = Math.hypot(x - (r.x + r.l / 2), y - (r.y + r.a / 2));
        if (d < dist) { dist = d; melhor = i; }
      }
      return melhor;
    }

    /** O ponto (x, y) está sobre a torre (com folga)? */
    contem(x, y, folga = 24) { return this.n > 0 && U.dentro({ x, y }, this.retangulo(), folga); }

    /** Centro do lugar onde o próximo cubinho vai encaixar. */
    topo() {
      const n = this.n, p = this._pos(n, n + 1), s = LADO * this.k;
      return { x: this.x + p.x * this.k + s / 2, y: this.y + p.y * this.k + s / 2 };
    }

    /** Move a base da torre para (x, y). Com animar, desliza e devolve uma Promise. */
    mover(x, y, { animar = false, ms = 350 } = {}) {
      this.x = x; this.y = y;
      if (!animar) {
        this.el.classList.remove('animando');
        this.el.style.left = x + 'px'; this.el.style.top = y + 'px';
        return Promise.resolve();
      }
      this.el.classList.add('animando');
      this.el.style.left = x + 'px'; this.el.style.top = y + 'px';
      return U.esperar(ms).then(() => this.el.classList.remove('animando'));
    }

    /** Faz o cubinho i brilhar um instante. */
    destacar(i) {
      const c = this.cubos[i];
      if (!c) return;
      c.classList.remove('brilha'); void c.offsetWidth; c.classList.add('brilha');
    }

    /** Balança a torre (algo não deu certo). */
    tremer() { this.interno.classList.remove('treme'); void this.interno.offsetWidth; this.interno.classList.add('treme'); }

    /** Conta os cubinhos em voz alta, acendendo um por um. sinal: AbortSignal opcional. */
    async contarAlto({ sinal = null, intervalo = 600 } = {}) {
      if (!this.n) return;
      await PC.voz.contar(this.n, { aCada: i => this.destacar(i), sinal, intervalo });
      this._pulsarPlaca();
    }

    /** Remove a torre do palco. */
    destruir() { this.el.remove(); this.cubos = []; }
  }

  Torre.LADO = LADO;
  Torre.MAX = MAX;
  PC.Torre = Torre;
})();
