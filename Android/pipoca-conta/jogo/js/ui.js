/* Pipoca Conta — interface comum: Pipoca apresentadora, botões, confete, dica, plaquinha de número,
   avisos e o gerenciador de telas (PC.telas). */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;
  const ui = PC.ui = {};

  // ---------------------------------------------------------------- Pipoca apresentadora
  ui.pipoca = (function () {
    let host = null, corpo = null, balao = null, pose = 'normal', timerBalao = null, falaSeq = 0, falandoAgora = false;

    function desenhar() {
      if (!corpo) return;
      corpo.innerHTML = PC.arte.pipoca(pose);
      corpo.classList.toggle('danca', pose === 'danca');
      corpo.classList.toggle('respira', pose !== 'danca');
    }
    function esconderBalao() {
      if (!balao || balao.hidden) return;
      balao.classList.remove('mostra'); balao.classList.add('some');
      const b = balao;
      setTimeout(() => { if (b.classList.contains('some')) { b.hidden = true; b.classList.remove('some'); } }, 240);
    }

    return {
      /** Coloca a Pipoca no canto de baixo à esquerda da tela raiz. */
      montar(raiz, { entrar = true } = {}) {
        if (host) host.remove();
        host = U.el('div', { class: 'pipoca-host' + (entrar ? ' entra' : '') });
        corpo = U.el('div', { class: 'pipoca-corpo respira', role: 'img', 'aria-label': 'Pipoca, a macaquinha' });
        balao = U.el('div', { class: 'balao', hidden: true });
        host.append(balao, corpo);
        corpo.addEventListener('pointerup', () => {
          corpo.classList.remove('pula'); void corpo.offsetWidth; corpo.classList.add('pula');
          PC.emitir('pipoca:tocada');
        });
        pose = 'normal';
        desenhar();
        raiz.appendChild(host);
        return host;
      },
      desmontar() { if (host) host.remove(); host = corpo = balao = null; clearTimeout(timerBalao); },
      get elemento() { return host; },
      esconder() { if (host) host.classList.add('escondida'); },
      mostrar() { if (host) host.classList.remove('escondida'); },
      /** Troca a pose: normal, fala, feliz, aponta, pensa, danca, acena. */
      pose(nome) {
        pose = nome || 'normal';
        desenhar();
        if (corpo && (pose === 'feliz')) { corpo.classList.remove('pula'); void corpo.offsetWidth; corpo.classList.add('pula'); }
      },
      /**
       * Mostra o balão e fala o texto. Resolve quando a fala termina (com 'fim', 'interrompida', 'muda' ou 'erro';
       * nunca rejeita). mostrar: um número (aparece grande, com pontinhos até 10) ou um elemento, ao lado do texto —
       * é o que a criança que não lê vai olhar.
       */
      dizer(texto, { voz = true, mostrar = null, balaoMs = 900 } = {}) {
        const meu = ++falaSeq;
        if (balao) {
          clearTimeout(timerBalao);
          balao.innerHTML = '';
          const conteudo = U.el('div', { class: 'balao-conteudo' });
          if (typeof mostrar === 'number' && isFinite(mostrar)) {
            const caixa = U.el('div', { class: 'balao-numero' }, U.el('b', { text: String(mostrar) }));
            if (mostrar > 0 && mostrar <= 10) {
              const g = U.el('div', { class: 'pontos' });
              for (let i = 0; i < mostrar; i++) g.appendChild(U.el('i', { class: i >= 5 ? 'b' : '' }));
              caixa.appendChild(g);
            }
            conteudo.appendChild(caixa);
          } else if (mostrar instanceof Node) conteudo.appendChild(mostrar);
          conteudo.appendChild(U.el('div', { class: 'balao-texto', text: texto }));
          balao.appendChild(conteudo);
          balao.hidden = false;
          balao.classList.remove('some', 'mostra'); void balao.offsetWidth; balao.classList.add('mostra');
        }
        if (host) host.classList.add('falando');
        falandoAgora = true;
        const fim = r => {
          if (meu !== falaSeq) return r;
          falandoAgora = false;
          if (host) host.classList.remove('falando');
          clearTimeout(timerBalao);
          timerBalao = setTimeout(() => { if (meu === falaSeq) esconderBalao(); }, balaoMs);
          return r;
        };
        const p = voz ? PC.voz.falar(texto) : U.esperar(Math.min(2500, 500 + texto.length * 45)).then(() => 'muda');
        return p.then(fim, () => fim('erro'));
      },
      /** A Pipoca está falando agora? (a moldura pausa o relógio de inatividade) */
      falando: () => falandoAgora,
      calar() { falaSeq++; falandoAgora = false; PC.voz.parar(); if (host) host.classList.remove('falando'); esconderBalao(); },
    };
  })();

  // ---------------------------------------------------------------- botões
  /** Botão redondo com ícone (96×96 virtual). opcoes: cor ('amarelo' | 'verde'), mostrarRotulo. */
  ui.botaoIcone = function (icone, rotulo, aoTocar, opcoes = {}) {
    const b = U.el('button', { type: 'button', class: 'botao-icone' + (opcoes.cor ? ' ' + opcoes.cor : ''), 'aria-label': rotulo, title: rotulo });
    b.innerHTML = PC.arte.icone(icone);
    if (opcoes.mostrarRotulo) b.appendChild(U.el('span', { class: 'rotulo-botao', text: rotulo }));
    if (aoTocar) PC.aoTocar(b, aoTocar);
    return b;
  };

  /** Botão grande em forma de pílula. opcoes: cor (CSS), icone (OBRIGATÓRIO em botões para a criança: ela não lê). */
  ui.botaoGrande = function (texto, aoTocar, opcoes = {}) {
    if (!opcoes.icone && !opcoes.semIcone && PC.config.debug) console.warn('botaoGrande sem ícone:', texto);
    const b = U.el('button', { type: 'button', class: 'botao-grande' + (opcoes.icone ? '' : ' sem-icone') });
    if (opcoes.cor) b.style.setProperty('--cor', opcoes.cor);
    if (opcoes.icone) b.insertAdjacentHTML('beforeend', PC.arte.icone(opcoes.icone));
    b.appendChild(U.el('span', { text: texto }));
    if (aoTocar) PC.aoTocar(b, aoTocar);
    return b;
  };

  // ---------------------------------------------------------------- confete
  const CORES_CONFETE = ['#FF7A6B', '#FFC93C', '#2EC4B6', '#9B7BFF', '#5CC84A', '#FF8FC2', '#4DA3FF'];
  /** Confete saindo de (x, y). raiz: onde desenhar (padrão: tela atual). */
  ui.confete = function ({ x = 800, y = 360, quantidade = 60, raiz = null, espalhar = 1 } = {}) {
    quantidade = Math.min(60, quantidade);                       // leve em tablet fraco
    const alvo = raiz || (PC.telas && PC.telas.raizAtual()) || PC.palco.el;
    const camada = U.el('div', { class: 'confete' });
    alvo.appendChild(camada);
    const pecas = [];
    for (let i = 0; i < quantidade; i++) {
      const p = U.el('i', { style: { left: x + 'px', top: y + 'px', background: CORES_CONFETE[i % CORES_CONFETE.length] } });
      if (i % 3 === 0) p.style.borderRadius = '50%', p.style.width = p.style.height = '18px';
      camada.appendChild(p);
      const ang = Math.random() * Math.PI * 2, vel = (180 + Math.random() * 420) * espalhar;
      const dx = Math.cos(ang) * vel, dy = Math.sin(ang) * vel * 0.7 - 260;
      const rot = (Math.random() - 0.5) * 900, dur = 1300 + Math.random() * 900;
      pecas.push(U.animar(p, [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx * 0.6}px, ${dy * 0.6}px) rotate(${rot * 0.5}deg)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${dx}px, ${dy + 520}px) rotate(${rot}deg)`, opacity: 0 },
      ], { duration: dur, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' }));
    }
    return Promise.all(pecas).then(() => camada.remove());
  };

  // ---------------------------------------------------------------- dica (mãozinha)
  /**
   * Mostra a mãozinha. de/para = {x, y} virtuais. para = null mostra um toque em "de".
   * opcoes: vezes (padrão 2), raiz. Devolve { parar() }. Some sozinha no próximo toque.
   */
  ui.dica = function (de, para, { vezes = 2, raiz = null, caminho = null } = {}) {
    if (Array.isArray(caminho) && caminho.length > 1) return dicaCaminho(caminho, { vezes, raiz });
    const alvo = raiz || (PC.telas && PC.telas.raizAtual()) || PC.palco.el;
    const mao = U.el('div', { class: 'dica-mao', html: PC.arte.mao() });
    const anel = para ? null : U.el('div', { class: 'dica-alvo', style: { left: de.x + 'px', top: de.y + 'px' } });
    if (anel) alvo.appendChild(anel);
    alvo.appendChild(mao);
    let vivo = true;
    const parar = () => { if (!vivo) return; vivo = false; mao.remove(); if (anel) anel.remove(); off(); };
    const off = PC.on('toque', parar);
    const pos = (p, s) => `translate(${p.x - 34}px, ${p.y - 18}px) scale(${s})`;
    (async () => {
      for (let i = 0; i < vezes && vivo; i++) {
        if (para) {
          await U.animar(mao, [
            { transform: pos(de, 1.1), opacity: 0 }, { transform: pos(de, 1), opacity: 1, offset: 0.12 },
            { transform: pos(de, 0.9), opacity: 1, offset: 0.22 }, { transform: pos(para, 0.9), opacity: 1, offset: 0.78 },
            { transform: pos(para, 1), opacity: 1, offset: 0.88 }, { transform: pos(para, 1), opacity: 0 },
          ], { duration: 1900, easing: 'ease-in-out', fill: 'forwards' });
        } else {
          await U.animar(mao, [
            { transform: pos(de, 1.15), opacity: 0 }, { transform: pos(de, 1), opacity: 1, offset: 0.25 },
            { transform: pos(de, 0.85), opacity: 1, offset: 0.45 }, { transform: pos(de, 1), opacity: 1, offset: 0.65 },
            { transform: pos(de, 1), opacity: 0 },
          ], { duration: 1300, fill: 'forwards' });
        }
      }
      parar();
    })();
    return { parar };
  };

  /** Mãozinha que percorre um caminho (ex.: o traço de um algarismo). */
  function dicaCaminho(pontos, { vezes = 2, raiz = null } = {}) {
    const alvo = raiz || (PC.telas && PC.telas.raizAtual()) || PC.palco.el;
    const mao = U.el('div', { class: 'dica-mao', html: PC.arte.mao() });
    alvo.appendChild(mao);
    let vivo = true;
    const parar = () => { if (!vivo) return; vivo = false; mao.remove(); off(); };
    const off = PC.on('toque', parar);
    // até 24 pontos espaçados ao longo do caminho
    const passo = Math.max(1, Math.floor(pontos.length / 24));
    const amostra = pontos.filter((_, i) => i % passo === 0);
    if (amostra[amostra.length - 1] !== pontos[pontos.length - 1]) amostra.push(pontos[pontos.length - 1]);
    const pos = (p, s) => `translate(${p.x - 34}px, ${p.y - 18}px) scale(${s})`;
    const quadros = [{ transform: pos(amostra[0], 1.1), opacity: 0, offset: 0 }, { transform: pos(amostra[0], 0.9), opacity: 1, offset: 0.08 }];
    amostra.forEach((p, i) => quadros.push({ transform: pos(p, 0.9), opacity: 1, offset: 0.1 + 0.8 * (i / Math.max(1, amostra.length - 1)) }));
    quadros.push({ transform: pos(amostra[amostra.length - 1], 1), opacity: 0, offset: 1 });
    (async () => {
      for (let i = 0; i < vezes && vivo; i++) await U.animar(mao, quadros, { duration: 2600, easing: 'linear', fill: 'forwards' });
      parar();
    })();
    return { parar };
  }

  // ---------------------------------------------------------------- plaquinha de número
  /** Plaquinha branca com o algarismo e os pontinhos (até 10). Posicione com style.left/top. */
  ui.placaNumero = function (n, { pontos = true } = {}) {
    const el = U.el('div', { class: 'placa-numero', 'aria-label': String(n) });
    el.appendChild(U.el('div', { class: 'algarismo', text: String(n) }));
    if (pontos && n > 0 && n <= 10) {
      const g = U.el('div', { class: 'pontos' });
      for (let i = 0; i < n; i++) g.appendChild(U.el('i', { class: i >= 5 ? 'b' : '' }));
      el.appendChild(g);
    }
    return el;
  };

  // ---------------------------------------------------------------- aviso curto
  ui.aviso = function (texto, { raiz = null, ms = 3000 } = {}) {
    const alvo = raiz || (PC.telas && PC.telas.raizAtual()) || PC.palco.el;
    const el = U.el('div', { class: 'aviso', text: texto });
    alvo.appendChild(el);
    setTimeout(() => el.remove(), ms);
    return el;
  };

  // ---------------------------------------------------------------- portão dos adultos (provisório; telas/portao.js substitui)
  // PC.portao.pedir() -> Promise<boolean>: abre o desafio dos adultos por cima da tela atual.
  // Chame SEMPRE antes de: abrir a área dos pais, a tela de assinatura, assinar(), gerenciar() e qualquer link externo.
  PC.portao = PC.portao || { pedir: () => Promise.resolve(true), provisorio: true };

  // ---------------------------------------------------------------- telas
  const VOLTAR_PADRAO = { mapa: 'abertura', atividade: 'mapa', album: 'mapa', livre: 'mapa', pais: 'abertura', assinatura: 'pais', portao: 'abertura', descanso: 'abertura' };

  PC.telas = (function () {
    const lista = {};
    let atual = null;          // { id, def, raiz, inst, params }
    let trocando = Promise.resolve();

    function telaProvisoria(id) {
      return {
        criar(raiz) {
          raiz.appendChild(PC.arte.cenario('ceu'));
          raiz.appendChild(U.el('h1', { class: 'titulo-tela', text: 'Em construção' }));
          raiz.appendChild(U.el('p', { class: 'centro', style: 'font:600 40px var(--fonte);background:#fff;padding:20px 30px;border-radius:24px;border:4px solid var(--tinta)', text: 'Tela "' + id + '" ainda não existe.' }));
          const b = ui.botaoIcone('voltar', 'Voltar', () => PC.telas.voltar());
          b.style.cssText = 'position:absolute;left:24px;top:12px';
          raiz.appendChild(b);
          return {};
        },
      };
    }

    let emTransicao = false;
    /** Troca de tela. Pedidos feitos durante uma transição são ignorados (toque duplo em "Jogar", voltar repetido). */
    function ir(id, params = {}) {
      if (emTransicao) return Promise.resolve(false);
      emTransicao = true;
      trocando = trocando.then(() => trocar(id, params)).catch(e => console.error(e))
        .then(() => U.esperar(260)).then(() => { emTransicao = false; return true; }, () => { emTransicao = false; return true; });
      return trocando;
    }

    async function trocar(id, params) {
      const def = lista[id] || telaProvisoria(id);
      PC.arrastar.cancelarTodos();
      PC.bloquearToques(350);
      ui.pipoca.calar();
      const velha = atual;
      atual = null;
      if (velha) {
        try { if (velha.inst && velha.inst.destruir) velha.inst.destruir(); } catch (e) { console.error(e); }
        velha.raiz.classList.add('saindo');
        setTimeout(() => velha.raiz.remove(), 230);
        ui.pipoca.desmontar();
      }
      const raiz = U.el('section', { class: 'tela entrando tela-' + id, 'data-tela': id });
      PC.palco.el.appendChild(raiz);
      const reg = { id, def, raiz, inst: null, params };
      atual = reg;
      try { reg.inst = def.criar(raiz, params) || {}; } catch (e) { console.error(e); reg.inst = {}; }
      setTimeout(() => raiz.classList.remove('entrando'), 340);
      PC.emitir('tela:mudou', { id, params });
    }

    return {
      registrar(id, def) { lista[id] = def; },
      existe: id => !!lista[id],
      ir,
      /** Botão voltar. Devolve true se tratou; false quando não há para onde voltar (o app fecha). */
      voltar() {
        if (!atual) return true;
        if (atual.inst && typeof atual.inst.voltar === 'function') {
          const r = atual.inst.voltar();
          if (r !== false) return true;
        }
        const destino = atual.def.voltarPara !== undefined ? atual.def.voltarPara : VOLTAR_PADRAO[atual.id];
        if (!destino) return false;
        ir(destino, {});
        return true;
      },
      atual: () => (atual ? atual.id : null),
      raizAtual: () => (atual ? atual.raiz : null),
      instancia: () => (atual ? atual.inst : null),
      params: () => (atual ? atual.params : null),
    };
  })();
})();
