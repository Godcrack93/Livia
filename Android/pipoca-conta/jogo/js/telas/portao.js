/* Pipoca Conta — portão dos adultos (PROJETO.md 4, item 9).

   PC.portao.pedir() -> Promise<boolean>
     Abre uma camada por cima da tela atual (z-index 70) com um desafio que só um adulto que lê resolve:
     "Para adultos: toque nos números sete, dois, nove." — três números por extenso, sem repetição e sem sequências
     fáceis (1-2-3, 3-2-1, 2-4-6, 1-5-9...), teclado grande de 1 a 9, SEM voz e um X grande para fechar.
     Errou → desafio novo. 3 erros seguidos → teclado parado por 5 s. 20 s sem toque → fecha (false). X → false.
     Chamadas repetidas com o portão aberto devolvem a mesma promessa. Se a tela mudar, o portão fecha (false).
     Fechar e abrir de novo não pula a espera nem zera os erros seguidos.
     Voltar do Android e Esc fecham o portão (false). Enquanto ele está aberto, o jogo pede o voltar ao Android
     (podeVoltar: true) mesmo na abertura, para o voltar fechar só o portão e não o app.
   PC.portao.aberto() -> boolean   /   PC.portao.fechar()  fecha com false (para o voltar do Android e o Esc).

   Também registra a tela "portao" (compatibilidade com PC.telas.ir('portao', { depois: 'pais' })): mostra o portão
   num fundo calmo; se o adulto acertar, vai para `depois` (com os params `dadosDepois`); senão, para `voltar`
   (padrão: abertura).

   Testes (só no navegador): enquanto o portão está aberto, o passo {"gesto": true} do testador toca a próxima tecla
   certa; PC.debug.portao.desafio() devolve os três números. */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  const PALAVRAS = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const ERROS_PARA_ESPERAR = 3;      // erros seguidos que param o teclado
  const ESPERA_MS = 5000;            // tempo com o teclado parado
  const SEM_TOQUE_MS = 20000;        // sem nenhum toque: fecha (false)
  const ESQUECER_ERROS_MS = 120000;  // erros mais antigos que isso deixam de contar como "seguidos"

  // Sobrevivem entre aberturas: fechar no X e abrir de novo não zera os erros nem pula a espera.
  let errosSeguidos = 0, ultimoErro = 0, esperaAte = 0, ultimoDesafio = '';
  let atual = null;                  // portão aberto (um por vez)

  U.estilo('portao', `
    .pc-portao { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; z-index: 70; touch-action: none; }
    .pc-portao-veu { position: absolute; left: -1200px; top: -700px; width: 4000px; height: 2300px; background: rgba(38, 27, 62, .76);
      animation: pcPortaoVeu .22s ease both; }
    @keyframes pcPortaoVeu { from { opacity: 0; } }
    .pc-portao-painel { position: absolute; left: 190px; top: 100px; width: 1300px; height: 700px; border-radius: 48px;
      background: var(--creme); border: 6px solid var(--tinta); box-shadow: 0 14px 0 var(--tinta);
      animation: pcPortaoPainel .3s cubic-bezier(.3, 1.3, .5, 1) both; }
    @keyframes pcPortaoPainel { from { transform: translateY(36px) scale(.95); opacity: 0; } }
    .pc-portao-painel.treme { animation: pcPortaoTreme .4s ease; }
    @keyframes pcPortaoTreme { 20%, 60% { transform: translateX(-14px); } 40%, 80% { transform: translateX(14px); } }

    .pc-portao-esq { position: absolute; left: 60px; top: 54px; width: 630px; }
    .pc-portao-titulo { display: flex; align-items: center; gap: 18px; margin: 0; font: 700 58px/1.1 var(--fonte); color: var(--tinta); }
    .pc-portao-titulo svg { width: 72px; height: 72px; flex: none; }
    .pc-portao-instrucao { margin: 34px 0 18px; font: 600 42px/1.25 var(--fonte); color: var(--tinta); }
    .pc-portao-palavras { display: flex; gap: 16px; }
    .pc-portao-palavra { position: relative; flex: 1 1 0; height: 108px; display: grid; place-items: center; border-radius: 28px;
      background: #fff; border: 5px solid var(--tinta); font: 700 48px/1 var(--fonte); color: var(--tinta); white-space: nowrap;
      transition: background-color .15s, border-color .15s; }
    .pc-portao-palavra.proxima { border-color: #6C4FD8; box-shadow: 0 0 0 6px rgba(108, 79, 216, .22); }
    .pc-portao-palavra.feita { background: #D3F0CB; }
    .pc-portao-ok { position: absolute; right: -14px; top: -14px; width: 46px; height: 46px; border-radius: 50%; background: var(--verde-escuro);
      border: 4px solid var(--tinta); display: none; place-items: center; }
    .pc-portao-ok svg { width: 30px; height: 30px; display: block; }
    .pc-portao-palavra.feita .pc-portao-ok { display: grid; }
    .pc-portao-msg { min-height: 96px; margin: 30px 0 0; font: 600 36px/1.3 var(--fonte); color: var(--tinta); }
    .pc-portao-msg.erro { color: #A8281F; }
    .pc-portao-barra { height: 20px; margin-top: 10px; border-radius: 10px; background: #E4DDF3; overflow: hidden; }
    .pc-portao-barra i { display: block; width: 100%; height: 100%; background: var(--tinta-suave); transform-origin: 0 50%; }
    .pc-portao-nota { position: absolute; left: 60px; bottom: 46px; width: 630px; margin: 0; font: 500 34px/1.3 var(--fonte); color: var(--tinta-suave); }

    .pc-portao-teclado { position: absolute; left: 744px; top: 103px; display: grid; grid-template-columns: repeat(3, 160px);
      grid-auto-rows: 150px; gap: 16px; }
    .pc-portao-tecla { width: 160px; height: 150px; padding: 0; border-radius: 30px; cursor: pointer; background: #fff;
      border: 5px solid var(--tinta); box-shadow: 0 8px 0 var(--tinta); font: 700 84px/1 var(--fonte); color: var(--tinta);
      transition: transform .07s, box-shadow .07s, opacity .2s; }
    .pc-portao-tecla.apertado { transform: translateY(6px); box-shadow: 0 2px 0 var(--tinta); background: #F1ECFF; }
    .pc-portao-teclado.parado .pc-portao-tecla { opacity: .35; cursor: default; }

    /* X no canto de cima à ESQUERDA: os cadeados que abrem o portão ficam à direita, e um toque duplo no cadeado
       não pode cair no X */
    .pc-portao-fechar { position: absolute; left: 22px; top: 10px; width: 140px; height: 140px; padding: 0; border: 0;
      background: transparent; cursor: pointer; display: grid; place-items: center; }
    .pc-portao-fechar > span { width: 118px; height: 118px; border-radius: 50%; background: #fff; border: 6px solid var(--tinta);
      box-shadow: 0 7px 0 var(--tinta); display: grid; place-items: center; transition: transform .07s, box-shadow .07s; }
    .pc-portao-fechar svg { width: 72px; height: 72px; display: block; }
    .pc-portao-fechar.apertado > span { transform: translateY(5px); box-shadow: 0 2px 0 var(--tinta); }

    .pc-portao-fundo { position: absolute; left: -1200px; top: -700px; width: 4000px; height: 2300px; pointer-events: none;
      background: linear-gradient(180deg, #E4DEF7 0px, #ECE7FA 700px, #FFF8EC 1600px, #FFF8EC 2300px); }
  `);

  // ---------------------------------------------------------------- desafio
  /** Três números de 1 a 9: sem repetição (1-1-1, 4-4-2), sem sequência de passo fixo (1-2-3, 9-8-7, 2-4-6, 1-5-9)
      e sem três vizinhos em qualquer ordem (2-1-3, 5-4-6), que uma criança que sabe contar acertaria por acaso. */
  function sortear() {
    for (let t = 0; t < 500; t++) {
      const d = [U.aleatorio(1, 9), U.aleatorio(1, 9), U.aleatorio(1, 9)];
      if (d[0] === d[1] || d[0] === d[2] || d[1] === d[2]) continue;
      if (d[1] - d[0] === d[2] - d[1]) continue;
      if (Math.max(d[0], d[1], d[2]) - Math.min(d[0], d[1], d[2]) === 2) continue;
      const chave = d.join('');
      if (chave === ultimoDesafio) continue;     // errou: o desafio novo é sempre outro
      ultimoDesafio = chave;
      return d;
    }
    ultimoDesafio = '729';
    return [7, 2, 9];
  }

  const esperando = () => performance.now() < esperaAte;

  // ---------------------------------------------------------------- abrir
  function pedir() {
    if (atual) return atual.promessa;
    let resolver = null;
    const promessa = new Promise(r => { resolver = r; });
    const raiz = (PC.telas && PC.telas.raizAtual()) || PC.palco.el;
    PC.arrastar.cancelarTodos();
    if (PC.voz) PC.voz.parar();                  // o portão é silencioso

    const p = atual = {
      promessa, resolver, raiz, desafio: [], pos: 0, teclas: {}, palavras: [], timers: [],
      abertoEm: performance.now(), ultimoToque: performance.now(), fechado: false, acertou: false,
    };
    montar(p);
    if (esperando()) parar(p, esperaAte - performance.now());
    else novoDesafio(p);

    // 20 s sem toque: fecha
    p.relogio = setInterval(() => {
      if (performance.now() - p.ultimoToque >= U.duracao(SEM_TOQUE_MS)) encerrar(p, false);
    }, 250);
    // a tela mudou por baixo (voltar, limite diário...): fecha
    p.offTela = PC.on('tela:mudou', () => { if (PC.telas.raizAtual() !== p.raiz) encerrar(p, false); });
    // voltar do Android: fecha só o portão (a tela de baixo pode já ter fechado; aí não faz nada)
    p.offVoltar = PC.on('nativo:voltar', () => encerrar(p, false));
    PC.nativo.enviar('podeVoltar', { valor: true });
    // teclado físico (computador): 1 a 9 tocam as teclas; Esc fecha (e não chega ao voltar da tela)
    p.teclasFisicas = ev => {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); encerrar(p, false); return; }
      if (/^[1-9]$/.test(ev.key) && !ev.repeat) { ev.preventDefault(); ev.stopImmediatePropagation(); marcarToque(p); tecla(p, Number(ev.key)); }
    };
    window.addEventListener('keydown', p.teclasFisicas, true);
    instalarGesto(p);
    return promessa;
  }

  function montar(p) {
    const camada = U.el('div', { class: 'pc-portao', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Para adultos' });
    const veu = U.el('div', { class: 'pc-portao-veu' });
    const painel = U.el('div', { class: 'pc-portao-painel' });

    const titulo = U.el('h2', { class: 'pc-portao-titulo', html: PC.arte.icone('cadeado') }, 'Para adultos:');
    const instrucao = U.el('p', { class: 'pc-portao-instrucao', text: 'toque nos números' });
    const palavras = U.el('div', { class: 'pc-portao-palavras' });
    for (let i = 0; i < 3; i++) {
      const w = U.el('div', { class: 'pc-portao-palavra' }, U.el('span'), U.el('i', { class: 'pc-portao-ok', html: PC.arte.icone('check') }));
      p.palavras.push(w);
      palavras.appendChild(w);
    }
    const msg = U.el('p', { class: 'pc-portao-msg', 'aria-live': 'polite' });
    const barra = U.el('div', { class: 'pc-portao-barra', hidden: true }, U.el('i'));
    const esq = U.el('div', { class: 'pc-portao-esq' }, titulo, instrucao, palavras, msg, barra);
    const nota = U.el('p', { class: 'pc-portao-nota', text: 'Este desafio protege compras, links e ajustes.' });

    const teclado = U.el('div', { class: 'pc-portao-teclado' });
    for (let n = 1; n <= 9; n++) {
      const t = U.el('button', { type: 'button', class: 'pc-portao-tecla', teste: 'tecla-' + n, 'aria-label': PALAVRAS[n] }, String(n));
      PC.aoTocar(t, () => tecla(p, n));
      p.teclas[n] = t;
      teclado.appendChild(t);
    }
    const fechar = U.el('button', { type: 'button', class: 'pc-portao-fechar', teste: 'fechar', 'aria-label': 'Fechar' },
      U.el('span', { html: PC.arte.icone('x') }));
    // logo depois de abrir, o X ignora toques (o segundo toque de um toque duplo no cadeado); depois do acerto
    // também (o portão já vai fechar liberando)
    PC.aoTocar(fechar, () => { if (!p.acertou && performance.now() - p.abertoEm >= 500) encerrar(p, false); });

    painel.append(esq, nota, teclado);
    camada.append(veu, painel, fechar);
    // todo toque conta como "mexeu" e não chega à tela de baixo (ex.: um mapa que rola com o dedo)
    camada.addEventListener('pointerdown', ev => { marcarToque(p); ev.stopPropagation(); });
    camada.addEventListener('pointerup', ev => ev.stopPropagation());
    Object.assign(p, { camada, painel, msg, barra, teclado });
    p.raiz.appendChild(camada);
  }

  function marcarToque(p) { p.ultimoToque = performance.now(); }

  function mensagem(p, texto, erro) {
    p.msg.textContent = texto || '';
    p.msg.classList.toggle('erro', !!erro);
  }

  function novoDesafio(p) {
    p.desafio = sortear();
    p.pos = 0;
    p.palavras.forEach((w, i) => {
      w.firstChild.textContent = PALAVRAS[p.desafio[i]];
      w.classList.remove('feita');
      w.classList.toggle('proxima', i === 0);
    });
    p.camada.setAttribute('aria-label', 'Para adultos: toque nos números ' + p.desafio.map(n => PALAVRAS[n]).join(', ') + '.');
  }

  // ---------------------------------------------------------------- jogada
  function tecla(p, n) {
    if (p.fechado || p.acertou || esperando()) return;
    marcarToque(p);
    if (n === p.desafio[p.pos]) {
      const w = p.palavras[p.pos];
      w.classList.remove('proxima');
      w.classList.add('feita');
      p.pos++;
      if (p.pos < 3) { p.palavras[p.pos].classList.add('proxima'); mensagem(p, ''); return; }
      p.acertou = true;
      errosSeguidos = 0;
      mensagem(p, 'Liberado!');
      p.timers.push(setTimeout(() => encerrar(p, true), U.duracao(320)));
      return;
    }
    errou(p);
  }

  function errou(p) {
    const agora = performance.now();
    if (agora - ultimoErro > ESQUECER_ERROS_MS) errosSeguidos = 0;
    errosSeguidos++;
    ultimoErro = agora;
    p.painel.classList.remove('treme'); void p.painel.offsetWidth; p.painel.classList.add('treme');
    if (errosSeguidos >= ERROS_PARA_ESPERAR) { errosSeguidos = 0; parar(p, U.duracao(ESPERA_MS)); return; }
    novoDesafio(p);
    mensagem(p, 'Não era esse número. Veja o novo desafio.', true);
  }

  /** Para o teclado por `ms` (3 erros seguidos). */
  function parar(p, ms) {
    ms = Math.max(0, ms);
    esperaAte = performance.now() + ms;
    p.teclado.classList.add('parado');
    Object.keys(p.teclas).forEach(k => { p.teclas[k].disabled = true; });
    p.palavras.forEach(w => { w.firstChild.textContent = '–'; w.classList.remove('proxima', 'feita'); });
    mensagem(p, 'Muitas tentativas. Aguarde alguns segundos.', true);
    p.barra.hidden = false;
    const faixa = p.barra.firstChild;
    try { faixa.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: ms, fill: 'forwards' }); } catch (e) { /* sem animação */ }
    p.timers.push(setTimeout(() => liberar(p), ms + 20));
  }

  function liberar(p) {
    if (p.fechado) return;
    p.teclado.classList.remove('parado');
    Object.keys(p.teclas).forEach(k => { p.teclas[k].disabled = false; });
    p.barra.hidden = true;
    novoDesafio(p);
    mensagem(p, 'Pode tentar de novo.');
  }

  // ---------------------------------------------------------------- fechar
  function encerrar(p, ok) {
    if (!p || p.fechado) return;
    p.fechado = true;
    clearInterval(p.relogio);
    p.timers.forEach(t => clearTimeout(t));
    if (p.offTela) p.offTela();
    if (p.offVoltar) p.offVoltar();
    window.removeEventListener('keydown', p.teclasFisicas, true);
    restaurarGesto(p);
    p.camada.remove();
    if (atual === p) atual = null;
    // devolve ao Android o voltar da tela de baixo (na abertura, o sistema cuida do voltar)
    const tela = PC.telas.atual();
    if (tela) PC.nativo.enviar('podeVoltar', { valor: tela !== 'abertura' });
    PC.bloquearToques(250);                      // o toque que fechou não "cai" na tela de baixo
    p.resolver(!!ok);
  }

  // ---------------------------------------------------------------- ajudas de teste (só no navegador)
  function instalarGesto(p) {
    if (PC.modoApp || !PC.debug) return;
    p.gestoAnterior = PC.debug.proximoGestoVirtual;
    p.gesto = () => {
      if (p.fechado || p.acertou || esperando()) return null;
      const t = p.teclas[p.desafio[p.pos]];
      if (!t) return null;
      const r = PC.palco.retangulo(t);
      return { tipo: 'tocar', em: { x: r.cx, y: r.cy } };
    };
    PC.debug.proximoGestoVirtual = p.gesto;
  }
  function restaurarGesto(p) {
    if (p.gesto && PC.debug && PC.debug.proximoGestoVirtual === p.gesto) PC.debug.proximoGestoVirtual = p.gestoAnterior;
  }
  PC.on('pronto', () => {
    if (PC.modoApp || !PC.debug) return;
    PC.debug.portao = {
      aberto: () => !!atual,
      desafio: () => (atual ? atual.desafio.slice() : null),
      esperando,
      errosSeguidos: () => errosSeguidos,
    };
  });

  PC.portao = {
    pedir,
    aberto: () => !!atual,
    fechar() { if (atual) encerrar(atual, false); },
  };

  // ---------------------------------------------------------------- tela "portao" (compatibilidade)
  function irSeguro(id, params, aindaVale, tentativas) {
    if (tentativas == null) tentativas = 12;
    PC.telas.ir(id, params || {}).then(ok => {
      if (ok === false && tentativas > 0 && aindaVale()) setTimeout(() => irSeguro(id, params, aindaVale, tentativas - 1), 150);
    });
  }

  PC.telas.registrar('portao', {
    voltarPara: 'abertura',
    criar(raiz, params) {
      params = params || {};
      let viva = true;
      raiz.appendChild(U.el('div', { class: 'pc-portao-fundo' }));
      pedir().then(ok => {
        if (!viva) return;
        if (ok) irSeguro(params.depois || 'pais', params.dadosDepois || {}, () => viva);
        else irSeguro(params.voltar || 'abertura', {}, () => viva);
      });
      return {
        destruir() { viva = false; },
        voltar() { if (atual) { encerrar(atual, false); return true; } return false; },
      };
    },
  });
})();
