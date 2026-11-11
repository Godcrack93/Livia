/* Pipoca Aprende — atividade "inicial": com que letra começa? (PROJETO.md 5.8 e 5.10)
   Modos (params.modo):
     letra  (padrão) a figura grande à esquerda do centro e, à direita, 2 ou 3 cartinhas com letras maiúsculas.
            "Arara! Com que letra começa arara?" e a Pipoca lê as cartinhas apontando ("É á, ó ou u?").
            Certo: "Á! Arara começa com á!". Errado: "Essa é a letra ó. Arara começa com á." (a cartinha sai de jogo).
     bicho  uma cartinha grande com a letra no alto e 3 figuras embaixo: "Qual começa com bê?" e a Pipoca diz o nome
            de cada figura apontando. Certo: "Boto! Boto começa com bê!". Errado: "Essa é a mala. Mala começa com ême."
   As letras da rodada saem de params.letras (sorteadas sem repetir até passar por todas); as cartinhas erradas também
   (completadas com vogais se faltar). Nunca duas opções com a mesma inicial; nenhuma palavra se repete na estação.
   Tocar na figura (modo letra) ou na cartinha da letra (modo bicho) só faz a Pipoca dizer a palavra ou a letra.
   Ajuda (nível 2): a Pipoca fala a palavra certa esticando o começo ("Ááá… rara. Arara!") e a opção certa dá pulinhos.
   Voz: a letra sempre pelo nome (PC.palavras.falaLetra), nunca o som isolado de uma consoante.
   Letras só em cartinhas de papel (sem rosto, olhos ou braços); a cor nunca indica a resposta antes do acerto.
   params: { modo: 'letra' | 'bicho', letras: [...], opcoes: 2 | 3, rodadas, demo, bichos } */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  const TINTA = '#3A2A5A';
  const PAPEL = '#FFF8E6';
  const VOGAIS = ['A', 'E', 'I', 'O', 'U'];
  const RESERVA = ['P', 'B', 'M', 'L', 'T', 'V'];           // se nem as vogais bastarem (não acontece na trilha)
  // começa com E, mas a gente fala "iscada": confunde quem ainda está ouvindo o começo das palavras
  const EVITAR = ['escada'];

  // modo letra: a figura à esquerda do centro (fora do balão da Pipoca, x > 570) e as cartinhas à direita
  const FIGURA = { x: 740, y: 470, lado: 330 };
  const CARTAS = {
    2: { xs: [1120, 1380], y: 470, l: 210, a: 262 },
    3: { xs: [1050, 1262, 1474], y: 470, l: 186, a: 232 },
  };
  // modo bicho: a cartinha da letra no alto e as 3 figuras numa fileira embaixo
  const LETRA_B = { x: 1010, y: 292, l: 180, a: 226 };
  const FIGURAS_B = { xs: [710, 1010, 1310], y: 640, lado: 250 };
  const memorias = new WeakMap();                           // por estação jogada (o objeto params é o mesmo)

  const CSS = `
    .pc-inicial { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
    .pc-inicial-alvo { position: absolute; margin: 0; padding: 0; border: 0; background: none; cursor: pointer;
      -webkit-tap-highlight-color: transparent; transition: opacity .3s; }
    .pc-inicial-alvo.fora { pointer-events: none; }
    .pc-inicial-carta, .pc-inicial-cartao { position: absolute; left: 0; top: 0; width: 100%; height: 100%; box-sizing: border-box;
      border: 7px solid ${TINTA}; color: ${TINTA}; transition: transform .08s, box-shadow .08s, background-color .2s; }
    .pc-inicial-carta { border-radius: 34px; background: ${PAPEL}; display: grid; place-items: center;
      box-shadow: 0 11px 0 ${TINTA}, inset 0 -14px 0 rgba(236, 214, 160, .55); font-family: var(--fonte); font-weight: 700; line-height: 1; }
    .pc-inicial-carta b { display: block; font-weight: 700; transform: translateY(-3%); }
    .pc-inicial-carta i { position: absolute; left: 16px; top: 14px; width: 34px; height: 13px; border-radius: 8px; background: #fff; opacity: .8; }
    .pc-inicial-cartao { border-radius: 42px; background: #fff; padding: 16px; box-shadow: 0 11px 0 ${TINTA}; }
    .pc-inicial-cartao svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .pc-inicial-alvo.apertado .pc-inicial-carta, .pc-inicial-alvo.apertado .pc-inicial-cartao { transform: translateY(7px);
      box-shadow: 0 4px 0 ${TINTA}; }
    .pc-inicial-alvo.lendo .pc-inicial-carta, .pc-inicial-alvo.lendo .pc-inicial-cartao { background: #FFE27A; }
    .pc-inicial-alvo.certa .pc-inicial-carta { background: #C9F2B5; box-shadow: 0 11px 0 ${TINTA}, 0 0 0 12px #5CC84A; }
    .pc-inicial-alvo.certa .pc-inicial-cartao { background: #EAF9E1; box-shadow: 0 11px 0 ${TINTA}, 0 0 0 12px #5CC84A; }
    .pc-inicial-alvo.fora .pc-inicial-carta, .pc-inicial-alvo.fora .pc-inicial-cartao { background: #E6E0F0; color: #C9C0DA;
      border-color: #A79CC0; box-shadow: 0 4px 0 #A79CC0; transform: translateY(6px); }
    .pc-inicial-alvo.fora .pc-inicial-cartao svg { opacity: .3; }
    .pc-inicial-mini { flex: none; width: 92px; height: 115px; box-sizing: border-box; border-radius: 18px; background: ${PAPEL};
      border: 5px solid ${TINTA}; box-shadow: 0 5px 0 ${TINTA}; display: grid; place-items: center; color: ${TINTA};
      font: 700 80px/1 var(--fonte); }
  `;

  // ---------------------------------------------------------------- utilidades
  const inteiro = (v, padrao) => { const n = Math.round(Number(v)); return isFinite(n) ? n : padrao; };
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);
  const nome = p => PC.palavras.nome(p);
  const letraFalada = l => PC.palavras.falaLetra(l);
  const unicas = lista => lista.filter((v, i) => lista.indexOf(v) === i);
  const caixa = (x, y, l, a) => ({ left: x + 'px', top: y + 'px', width: l + 'px', height: a + 'px' });

  /** params.letras normalizado: maiúsculas sem acento, uma letra cada, sem repetir (vazio → vogais). */
  function normalizarLetras(lista) {
    const ok = (Array.isArray(lista) ? lista : [])
      .map(l => PC.palavras.semAcento(String(l)).toUpperCase().charAt(0))
      .filter(l => /^[A-Z]$/.test(l));
    const r = unicas(ok);
    return r.length ? r : VOGAIS.slice();
  }

  function memoriaDe(params) {
    let m = memorias.get(params);
    if (!m) { m = { saco: [], ultima: null, usadas: {} }; memorias.set(params, m); }
    return m;
  }

  /** Palavras (ainda não usadas na estação) que começam com a letra; com desenho pronto têm preferência. */
  function palavrasDe(letra, mem, bichos, excluir) {
    const todas = PC.palavras.filtrar({ iniciais: [letra], bichos: bichos ? true : undefined })
      .filter(p => EVITAR.indexOf(p.id) < 0 && (!excluir || excluir.indexOf(p.id) < 0));
    const novas = todas.filter(p => !mem.usadas[p.id]);
    const desenhadas = novas.filter(p => PC.palavras.temDesenho(p));
    return desenhadas.length ? desenhadas : novas;
  }

  /** A letra da rodada: sorteada sem repetir até passar por todas (e nunca igual à anterior), só se tiver palavra nova. */
  function sortearLetra(letras, mem, bichos) {
    for (let volta = 0; volta < 2; volta++) {
      for (let t = 0; t < letras.length * 2; t++) {
        if (!mem.saco.length) {
          mem.saco = U.embaralhar(letras.slice());
          if (mem.saco.length > 1 && mem.saco[mem.saco.length - 1] === mem.ultima) mem.saco.unshift(mem.saco.pop());
        }
        const l = mem.saco.pop();
        if (palavrasDe(l, mem, bichos).length) { mem.ultima = l; return l; }
      }
      mem.usadas = {};                                     // acabaram as palavras novas: recomeça (estação muito longa)
    }
    return letras[0];
  }

  /** Letras erradas: primeiro as da estação, depois vogais; nenhuma igual à certa nem repetida. */
  function letrasErradas(certa, n, letras) {
    const r = [];
    const pegar = lista => U.embaralhar(lista.filter(l => l !== certa && r.indexOf(l) < 0)).forEach(l => { if (r.length < n) r.push(l); });
    pegar(letras); pegar(VOGAIS); pegar(RESERVA);
    return r;
  }

  /** Como a Pipoca fala a palavra esticando o começo: 'Ááá… rara. Arara!', 'Bôôô… la. Bola!', 'Pããão… Pão!'. */
  function esticada(p) {
    const s = PC.palavras.falaSilaba(p.silabas[0]);
    const m = s.match(/[aeiouáéíóúâêôãõ]/i);
    const comeco = m ? s.slice(0, m.index) + m[0].repeat(3) + s.slice(m.index + 1) : s;
    const resto = p.silabas.slice(1).join('').toLowerCase();
    return maiuscula(comeco) + '… ' + (resto ? resto + '. ' : '') + maiuscula(nome(p)) + '!';
  }

  /** Cartinha pequena para o balão da Pipoca (a criança olha a letra de que ela está falando). */
  const mini = letra => U.el('div', { class: 'pc-inicial-mini', 'aria-hidden': 'true' }, letra);

  // ---------------------------------------------------------------- a rodada
  function rodada(ctx) {
    U.estilo('inicial', CSS);
    const params = ctx.params || {};
    const modo = params.modo === 'bicho' ? 'bicho' : 'letra';
    const letras = normalizarLetras(params.letras);
    const nOpcoes = modo === 'bicho' ? 3 : (inteiro(params.opcoes, 3) <= 2 ? 2 : 3);
    const bichos = !!params.bichos;
    const mem = memoriaDe(params);

    let destruido = false, resolvida = false, bloqueado = false, ajudando = false, interagiu = false;
    let fase = 'escolhendo';
    let leitura = null;                // AbortController da fala/ajuda em andamento
    let palavra = null, letra = '', opcoes = [], certa = -1, figuraEl = null, letraEl = null;

    const camada = U.el('div', { class: 'pc-inicial' });
    ctx.palco.appendChild(camada);
    const vivo = () => !destruido && !resolvida && !ctx.sinal.aborted;

    // ------------------------------------------------------------ peças
    function criarAlvo(x, y, l, a, teste, rotulo, conteudo) {
      const el = U.el('button', { type: 'button', class: 'pc-inicial-alvo', teste, 'aria-label': rotulo, style: caixa(x - l / 2, y - a / 2, l, a) }, conteudo);
      camada.appendChild(el);
      return el;
    }
    function carta(letraDaCarta, l, a) {
      const c = U.el('div', { class: 'pc-inicial-carta' }, U.el('i'), U.el('b', { text: letraDaCarta }));
      c.style.fontSize = Math.round(a * 0.68) + 'px';
      return c;
    }
    const cartao = p => U.el('div', { class: 'pc-inicial-cartao', html: PC.palavras.desenho(p) });
    const pular = (el, alto = 30, atraso = 0) => U.animar(el, [
      { transform: 'translateY(0px) scale(1, 1)' },
      { transform: `translateY(${-alto}px) scale(.97, 1.04)`, offset: 0.4 },
      { transform: 'translateY(0px) scale(1.04, .96)', offset: 0.78 },
      { transform: 'translateY(0px) scale(1, 1)' },
    ], { duration: 440, delay: atraso, easing: 'ease-out' });
    const surgir = (el, atraso) => U.animar(el, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 380, delay: atraso, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' });

    function destacar(el) {
      camada.querySelectorAll('.lendo').forEach(e => { if (e !== el) e.classList.remove('lendo'); });
      if (el) el.classList.add('lendo');
    }

    // ------------------------------------------------------------ montar
    function montarLetra() {
      letra = sortearLetra(letras, mem, bichos);
      palavra = U.escolher(palavrasDe(letra, mem, bichos));
      mem.usadas[palavra.id] = true;
      figuraEl = criarAlvo(FIGURA.x, FIGURA.y, FIGURA.lado, FIGURA.lado, 'figura', maiuscula(nome(palavra)), cartao(palavra));
      PC.aoTocar(figuraEl, () => tocarExtra(), { som: false });
      surgir(figuraEl, 0);
      const C = CARTAS[nOpcoes];
      const valores = U.embaralhar([letra].concat(letrasErradas(letra, nOpcoes - 1, letras)));
      certa = valores.indexOf(letra);
      opcoes = valores.map((v, i) => {
        const el = criarAlvo(C.xs[i], C.y, C.l, C.a, 'opcao-' + i, 'Letra ' + letraFalada(v), carta(v, C.l, C.a));
        PC.aoTocar(el, () => escolher(i));
        surgir(el, 160 + i * 110);
        return { el, i, letra: v, palavra: null, fora: false, x: C.xs[i], y: C.y };
      });
    }

    function montarBicho() {
      letra = sortearLetra(letras, mem, bichos);
      palavra = U.escolher(palavrasDe(letra, mem, bichos));
      const escolhidas = [palavra];
      // as erradas: uma palavra de cada outra letra (da estação, depois vogais), nunca a mesma inicial
      const outras = U.embaralhar(letras.filter(l => l !== letra))
        .concat(U.embaralhar(VOGAIS.filter(l => l !== letra && letras.indexOf(l) < 0)))
        .concat(U.embaralhar(RESERVA.filter(l => l !== letra && letras.indexOf(l) < 0 && VOGAIS.indexOf(l) < 0)));
      for (let k = 0; k < outras.length && escolhidas.length < 3; k++) {
        let lista = palavrasDe(outras[k], mem, bichos, escolhidas.map(p => p.id));
        if (!lista.length) lista = palavrasDe(outras[k], { usadas: {} }, false, escolhidas.map(p => p.id));
        if (lista.length) escolhidas.push(U.escolher(lista));
      }
      escolhidas.forEach(p => { mem.usadas[p.id] = true; });
      letraEl = criarAlvo(LETRA_B.x, LETRA_B.y, LETRA_B.l, LETRA_B.a, 'letra', 'Letra ' + letraFalada(letra), carta(letra, LETRA_B.l, LETRA_B.a));
      PC.aoTocar(letraEl, () => tocarExtra(), { som: false });
      surgir(letraEl, 0);
      const lista = U.embaralhar(escolhidas);
      certa = lista.indexOf(palavra);
      const F = FIGURAS_B;
      opcoes = lista.map((p, i) => {
        const el = criarAlvo(F.xs[i], F.y, F.lado, F.lado, 'opcao-' + i, maiuscula(nome(p)), cartao(p));
        PC.aoTocar(el, () => escolher(i));
        surgir(el, 180 + i * 120);
        return { el, i, letra: p.inicial, palavra: p, fora: false, x: F.xs[i], y: F.y };
      });
    }

    // ------------------------------------------------------------ falas que a criança pode interromper
    function cancelarLeitura() {
      const ac = leitura;
      leitura = null;
      if (ac) ac.abort();
      destacar(null);
    }
    function novaLeitura() {
      cancelarLeitura();
      const ac = new AbortController();
      const repassar = () => ac.abort();
      ctx.sinal.addEventListener('abort', repassar, { once: true });
      ac.signal.addEventListener('abort', () => ctx.sinal.removeEventListener('abort', repassar), { once: true });
      leitura = ac;
      return ac;
    }
    async function falarEm(sinal, texto, op) {
      if (sinal.aborted) throw U.abortado();
      await ctx.esperar(0);                      // segura no "Quer parar?" e confere de novo (pode ter sido substituída)
      if (sinal.aborted) throw U.abortado();
      const r = await ctx.falar(texto, op);
      if (sinal.aborted) throw U.abortado();
      return r;
    }
    /** Depois de ctx.errou: só o primeiro toque vale até a Pipoca terminar o retorno (ou começar a ajuda). */
    async function esperarRetorno() {
      try {
        await ctx.esperar(150);
        for (let t = 0; t < 20000 && PC.ui.pipoca.falando() && !ajudando; t += 100) await ctx.esperar(100);
      } catch (e) { if (!U.ehAbortado(e)) console.error(e); }
      if (!destruido && fase !== 'fim') bloqueado = false;
    }

    // ------------------------------------------------------------ instrução
    /** "Á, ó ou u?" (modo letra) ou "Boto, pato ou mala?" (modo bicho), destacando cada opção enquanto fala. */
    async function lerOpcoes(sinal) {
      const vivas = opcoes.filter(o => !o.fora);
      const falaDe = o => (modo === 'bicho' ? nome(o.palavra) : letraFalada(o.letra));
      if (vivas.length === 1) {
        const o = vivas[0];
        destacar(o.el);
        if (modo === 'bicho') await falarEm(sinal, 'Toque ' + (PC.palavras.artigo(o.palavra) === 'a' ? 'na ' : 'no ') + nome(o.palavra) + '!');
        else await falarEm(sinal, 'Toque na letra ' + letraFalada(o.letra) + '!');
      } else {
        for (let k = 0; k < vivas.length; k++) {
          destacar(vivas[k].el);
          const ultimo = k === vivas.length - 1;
          const texto = falaDe(vivas[k]);
          const inicio = k === 0 ? maiuscula(texto) : (ultimo ? 'ou ' + texto : texto);
          await falarEm(sinal, inicio + (ultimo ? '?' : ','));
        }
      }
      destacar(null);
    }

    /** curta (começo das rodadas seguintes, modo letra): "Ipê!" e as opções, sem "Com que letra começa ipê?". */
    function falarInstrucao(curta) {
      if (!vivo() || fase === 'fim' || bloqueado || ajudando) return Promise.resolve();
      const ac = novaLeitura(), s = ac.signal;
      return (async () => {
        try {
          PC.ui.pipoca.pose('aponta');
          if (modo === 'letra') {
            pular(figuraEl, 22);
            await falarEm(s, maiuscula(nome(palavra)) + '!' + (curta ? '' : ' Com que letra começa ' + nome(palavra) + '?'));
          } else {
            pular(letraEl, 22);
            await falarEm(s, 'Qual começa com ' + letraFalada(letra) + '?', { mostrar: mini(letra) });
          }
          await lerOpcoes(s);
        } catch (e) {
          if (!U.ehAbortado(e)) console.error(e);
        } finally {
          if (leitura === ac) { leitura = null; destacar(null); if (vivo()) PC.ui.pipoca.pose('normal'); }
        }
      })();
    }

    /** Tocar na figura (modo letra) ou na cartinha da letra (modo bicho): a Pipoca diz a palavra ou a letra. */
    function tocarExtra() {
      if (!vivo() || fase === 'fim' || bloqueado || ajudando) return;
      interagiu = true;
      const ac = novaLeitura(), s = ac.signal;
      const el = modo === 'letra' ? figuraEl : letraEl;
      PC.som.clique();
      pular(el, 24);
      const texto = modo === 'letra' ? maiuscula(nome(palavra)) + '!' : maiuscula(letraFalada(letra)) + '!';
      falarEm(s, texto, modo === 'bicho' ? { mostrar: mini(letra) } : undefined)
        .catch(e => { if (!U.ehAbortado(e)) console.error(e); })
        .then(() => { if (leitura === ac) leitura = null; });
    }

    // ------------------------------------------------------------ escolher
    function escolher(i) {
      const op = opcoes[i];
      if (!op || op.fora || bloqueado || !vivo() || fase !== 'escolhendo') return;
      interagiu = true;
      cancelarLeitura();
      if (i === certa) { acertar(op); return; }
      bloqueado = true;
      op.fora = true;
      op.el.classList.add('fora');
      let fala;
      if (modo === 'letra') {
        fala = 'Essa é a letra ' + letraFalada(op.letra) + '. ' + maiuscula(nome(palavra)) + ' começa com ' + letraFalada(letra) + '.';
      } else {
        const p = op.palavra, fem = PC.palavras.artigo(p) === 'a';
        fala = (fem ? 'Essa é a ' : 'Esse é o ') + nome(p) + '. ' + maiuscula(nome(p)) + ' começa com ' + letraFalada(p.inicial) + '.';
      }
      ctx.errou({ fala, mostrar: mini(op.letra) });
      esperarRetorno();
    }

    async function acertar(op) {
      fase = 'fim';
      bloqueado = true;
      ctx.ocupado(true);
      op.el.classList.add('certa');
      opcoes.forEach(o => { if (o !== op) o.el.classList.add('fora'); });
      U.animar(op.el, [{ transform: 'scale(1)' }, { transform: 'scale(1.14)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' });
      pular(modo === 'letra' ? figuraEl : letraEl, 26, 180);
      try {
        const fala = modo === 'letra'
          ? maiuscula(letraFalada(letra)) + '! ' + maiuscula(nome(palavra)) + ' começa com ' + letraFalada(letra) + '!'
          : maiuscula(nome(palavra)) + '! ' + maiuscula(nome(palavra)) + ' começa com ' + letraFalada(letra) + '!';
        await ctx.falar(fala, { mostrar: mini(letra) });
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
      terminar();
    }

    /** Fim da rodada: um único ctx.acertou(), mesmo se o resolver() dos testes chegou antes. */
    function terminar() {
      if (resolvida || destruido) return;
      resolvida = true;
      ctx.acertou();
    }

    // ------------------------------------------------------------ gesto e ajuda
    function proximoGesto() {
      if (!vivo() || fase === 'fim') return null;
      const op = opcoes[certa];
      return op ? { tipo: 'tocar', em: { x: op.x, y: op.y } } : null;
    }

    /** Ajuda que ensina (2º erro seguido): a palavra devagar, esticando o começo, e a opção certa dá pulinhos. */
    async function ajudar(nivel) {
      if (nivel !== 2 || !vivo() || ajudando || fase === 'fim') return;
      const ac = novaLeitura(), s = ac.signal;
      ajudando = true;
      bloqueado = false;
      ctx.ocupado(true);
      const op = opcoes[certa];
      try {
        PC.ui.pipoca.pose('aponta');
        if (modo === 'letra') pular(figuraEl, 22);
        const pulos = (async () => {
          for (let k = 0; k < 3; k++) { await ctx.esperar(k ? 650 : 250); if (s.aborted) return; pular(op.el, 34); }
        })().catch(() => {});
        await falarEm(s, esticada(palavra), { mostrar: mini(letra) });
        await pulos;
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ajudando = false;
        const minha = leitura === ac;
        if (minha) leitura = null;
        if (vivo() && fase !== 'fim') {
          if (minha) { destacar(null); PC.ui.pipoca.pose('normal'); }
          ctx.ocupado(false);
        }
      }
    }

    /** Testes: mostra a resposta certa e termina a rodada (um único ctx.acertou()). */
    function resolver() {
      if (destruido || resolvida) return;
      resolvida = true;
      fase = 'fim';
      cancelarLeitura();
      try { if (opcoes[certa]) opcoes[certa].el.classList.add('certa'); } catch (e) { console.error(e); }
      ctx.acertou();
    }

    function estado() {
      const errada = opcoes.find(o => o.i !== certa && !o.fora);
      return {
        modo, fase, bloqueado, ajudando, resolvida,
        palavra: palavra ? palavra.id : null, letra,
        opcoes: opcoes.map(o => (modo === 'bicho' ? o.palavra.id : o.letra)),
        certa, resposta: 'opcao-' + certa,
        fora: opcoes.filter(o => o.fora).map(o => 'opcao-' + o.i),
        errada: errada ? 'opcao-' + errada.i : null,
        usadas: Object.keys(mem.usadas),
      };
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      cancelarLeitura();
      camada.remove();
    }

    // ------------------------------------------------------------ montar e começar
    if (modo === 'bicho') montarBicho(); else montarLetra();

    // a instrução e, na primeira rodada com demo, a mãozinha mostra uma vez o gesto
    (async () => {
      try {
        await ctx.esperar(450);
        await falarInstrucao(!ctx.primeiraDaVez);
        if (ctx.demo && !interagiu && vivo()) {
          const g = proximoGesto();
          if (g) ctx.dica(g.em, null);
        }
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    })();

    return { instrucao: () => falarInstrucao(), proximoGesto, ajudar, resolver, estado, destruir };
  }

  PC.atividades.registrar('inicial', {
    titulo: 'Com que letra começa?',
    icone: 'inicial',
    cenario: 'prado',
    totalRodadas: params => U.limitar(inteiro(params && params.rodadas, 4), 1, 10),
    rodada,
  });

  // ---------------------------------------------------------------- medalhão do mapa
  // modo letra: uma figurinha (uva nas vogais, bola nas consoantes) e as cartinhas de letra ao lado;
  // modo bicho: a cartinha grande da letra e três figurinhas pequenas embaixo.
  if (PC.arte && PC.arte.registrarMedalhao && PC.arte.pecasMedalhao) {
    const { T, COR, brilho, cartinha } = PC.arte.pecasMedalhao;
    const cartao = (x, y, l) => `<rect x="${x}" y="${y + 1.8}" width="${l}" height="${l}" rx="${l * 0.2}" fill="${T}"/>` +
      `<rect x="${x}" y="${y}" width="${l}" height="${l}" rx="${l * 0.2}" fill="#fff" stroke="${T}" stroke-width="2.4"/>`;
    const uva = (cx, cy, e) => {
      const bagos = [[-8, -8], [0, -8], [8, -8], [-4, 0], [4, 0], [12, 0], [0, 8], [8, 8], [4, 16]];
      return `<g transform="translate(${cx} ${cy}) scale(${e})">` +
        `<path d="M4 -14 Q 6 -22 12 -24" fill="none" stroke="${COR.madeiraEsc}" stroke-width="2.6" stroke-linecap="round"/>` +
        `<path d="M6 -17 q 10 -10 18 -2 q -10 6 -18 2 Z" fill="${COR.verde}" stroke="${T}" stroke-width="2" stroke-linejoin="round"/>` +
        bagos.map(([x, y]) => `<circle cx="${x - 2}" cy="${y}" r="5.4" fill="#9B6BDF" stroke="${T}" stroke-width="2"/>`).join('') +
        `<circle cx="-12" cy="-10" r="1.6" fill="#fff" opacity=".7"/><circle cx="-4" cy="-2" r="1.6" fill="#fff" opacity=".7"/></g>`;
    };
    const bola = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${COR.coral}" stroke="${T}" stroke-width="2.4"/>` +
      `<path d="M${cx - r} ${cy} Q ${cx} ${cy - r * 0.5} ${cx + r} ${cy} M${cx} ${cy - r} Q ${cx - r * 0.45} ${cy} ${cx} ${cy + r}" fill="none" stroke="#fff" stroke-width="${r * 0.22}" stroke-linecap="round"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${T}" stroke-width="2.4"/>`;
    const pipa = (cx, cy, r) => `<path d="M${cx} ${cy - r} L ${cx + r * 0.75} ${cy} L ${cx} ${cy + r} L ${cx - r * 0.75} ${cy} Z" fill="${COR.ouro}" stroke="${T}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M${cx} ${cy - r} V ${cy + r} M${cx - r * 0.75} ${cy} H ${cx + r * 0.75}" stroke="${T}" stroke-width="1.3"/>`;
    const sol = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${COR.ouro}" stroke="${T}" stroke-width="2"/>` +
      `<circle cx="${cx - r * 0.35}" cy="${cy - r * 0.35}" r="${r * 0.25}" fill="#fff" opacity=".6"/>`;
    PC.arte.registrarMedalhao('inicial', {
      fundo: ['#FFEFF6', '#B9E59A', '#94D373'],
      cena(p) {
        const letras = normalizarLetras(p.letras);
        const vogais = letras.every(l => VOGAIS.indexOf(l) >= 0);
        if (p.modo === 'bicho') {
          return cartinha(50, 34, 30, letras[0] || 'P', PAPEL, -4) + brilho(76, 16, 4.5, COR.ouro) +
            cartao(9, 66, 22) + pipa(20, 77, 8) +
            cartao(39, 70, 22) + bola(50, 81, 7.5) +
            cartao(69, 66, 22) + sol(80, 77, 7) + brilho(20, 30, 3.5, '#fff');
        }
        const fig = cartao(7, 30, 44) + (vogais ? uva(30, 54, 1.05) : bola(29, 52, 15));
        const [a, b, c] = vogais ? ['U', 'A', 'O'] : (letras.indexOf('L') >= 0 ? ['B', 'L', 'V'] : ['B', 'P', 'M']);
        const cartas = (Number(p.opcoes) || 3) <= 2
          ? cartinha(70, 36, 22, a, PAPEL, -8) + cartinha(80, 67, 21, b, PAPEL, 8)
          : cartinha(67, 25, 18, a, PAPEL, -8) + cartinha(83, 50, 18, b, PAPEL, 5) + cartinha(67, 75, 18, c, PAPEL, 10);
        return fig + cartas + brilho(12, 22, 4, COR.ouro) + brilho(48, 86, 3, '#fff');
      },
    });
  }
})();
