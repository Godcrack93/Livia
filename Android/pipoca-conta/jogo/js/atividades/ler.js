/* Pipoca Aprende — atividade "ler": Ler palavrinhas (PROJETO.md 5.8 e 5.14).
   Uma plaquinha de madeira clara com a palavra em MAIÚSCULAS, sílabas levemente separadas (cada sílaba é um botão:
   tocar → a Pipoca fala só aquela sílaba e ela acende) e, abaixo, 2 ou 3 figuras em cartões brancos.
   A instrução não fala a palavra: "Leia comigo! Que palavra é essa?". A criança toca na figura.
     certo   a Pipoca lê pelas sílabas e inteira ("pá… tô… Pato!") acendendo as sílabas e depois ctx.acertou().
     errado  "Essa é a bola. Toque nos pedacinhos e leia de novo." — o cartão errado sai de jogo.
     ajuda   (nível 2) a Pipoca fala as sílabas uma por uma, acendendo cada uma, sem juntar.
     demo    (1ª rodada com params.demo) a mãozinha toca nas sílabas, a Pipoca lê e mostra a figura certa.
   As opções erradas são plausíveis: de preferência com a mesma letra inicial e o mesmo número de sílabas (a criança
   precisa ler), nunca duas palavras iguais nem a mesma figura.
   params: { silabas: [min, max], opcoes: 2 | 3, rodadas, demo }
   data-teste: palavra (a plaquinha), silaba-N, opcao-0..2. */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;
  const T = '#3A2A5A';

  // ---------------------------------------------------------------- layout (px virtuais)
  const PLACA = { cx: 1010, y: 160 };                      // plaquinha: centro x e topo (fica acima do balão da Pipoca)
  const LARGURA_MAX = 960;                                 // plaquinha mais larga que isso fica compacta (sem passar de x ≈ 1480)
  const CARTAO = 250;                                      // lado dos cartões das figuras (≥ alvoPrincipal 170)
  const CARTAS_Y = 612;                                    // centro y dos cartões (base em 737, acima do chão 800)
  const CARTAS_X = { 2: [830, 1190], 3: [705, 1010, 1315] };
  const memorias = new WeakMap();                          // por estação jogada (o objeto params é o mesmo nas rodadas)

  const CSS = `
    .pc-ler { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
    .pc-ler-faixa { position: absolute; left: ${PLACA.cx - 800}px; top: ${PLACA.y}px; width: 1600px; display: flex; justify-content: center; pointer-events: none; }
    .pc-ler-placa { position: relative; pointer-events: auto; display: flex; align-items: center; gap: 22px; padding: 20px 44px 26px;
      background: #F6DDB0; border: 7px solid ${T}; border-radius: 40px; box-shadow: 0 12px 0 ${T}; }
    .pc-ler-veios { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: hidden; border-radius: 33px; pointer-events: none; }
    .pc-ler-veios svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block; }
    .pc-ler-prego { position: absolute; width: 16px; height: 16px; border-radius: 50%; background: #B98A5E; border: 4px solid ${T}; pointer-events: none; }
    .pc-ler-silaba { position: relative; min-width: 150px; height: 168px; margin: 0; padding: 0 22px 8px; border-radius: 30px; cursor: pointer;
      background: rgba(255, 255, 255, .45); border: 5px dashed rgba(58, 42, 90, .28); color: ${T};
      font: 700 132px/1 var(--fonte); letter-spacing: 2px; display: grid; place-items: center;
      transition: transform .16s, background-color .18s, border-color .18s; }
    .pc-ler-placa.compacta { gap: 14px; padding: 20px 30px 26px; }
    .pc-ler-placa.compacta .pc-ler-silaba { min-width: 140px; padding: 0 14px 8px; font-size: 112px; letter-spacing: 0; }
    .pc-ler-silaba.apertado { transform: scale(.95); }
    .pc-ler-silaba.acesa { background: #FFE27A; border: 5px solid #FFC93C; transform: scale(1.08); }
    .pc-ler-silaba.lida { background: #C9F0B4; border: 5px solid #5CC84A; }
    .pc-ler-carta { position: absolute; width: ${CARTAO}px; height: ${CARTAO}px; margin: 0; padding: 0; border-radius: 44px; cursor: pointer;
      background: #fff; border: 6px solid ${T}; box-shadow: 0 10px 0 ${T}; display: grid; place-items: center;
      transition: transform .18s, background-color .2s, opacity .25s, box-shadow .08s; }
    .pc-ler-carta img { width: 200px; height: 200px; display: block; pointer-events: none; }
    .pc-ler-carta.apertado { transform: translateY(7px); box-shadow: 0 3px 0 ${T}; }
    .pc-ler-carta.certa { background: #C9F0B4; border-color: #3E9E3A; }
    .pc-ler-carta.fora { background: #E6E0F0; border-color: #A79CC0; box-shadow: 0 4px 0 #A79CC0; pointer-events: none; transform: translateY(5px); }
    .pc-ler-carta.fora img { opacity: .3; }
    .pc-ler-balao { display: flex; gap: 8px; align-items: center; }
    .pc-ler-balao b { display: block; padding: 4px 16px 8px; border-radius: 18px; background: #F6DDB0; border: 4px solid ${T};
      font: 700 64px/1 var(--fonte); color: ${T}; }
  `;

  // ---------------------------------------------------------------- utilidades
  const inteiro = (v, padrao) => { const n = Math.round(Number(v)); return isFinite(n) ? n : padrao; };
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);
  const P = () => PC.palavras;
  const nome = p => P().nome(p);
  /** "a bola" / "o gato" */
  const comArtigo = p => P().artigo(p) + ' ' + nome(p);
  /** "Essa é a bola." / "Esse é o gato." */
  const essaE = p => (P().artigo(p) === 'a' ? 'Essa é ' : 'Esse é ') + comArtigo(p) + '.';
  /** "no pato" / "na bola" */
  const naNo = p => (P().artigo(p) === 'a' ? 'na ' : 'no ') + nome(p);
  /** Sílabas para o balão (o que a criança olha): plaquinhas em maiúsculas. */
  const balao = silabas => U.el('div', { class: 'pc-ler-balao' }, ...silabas.map(s => U.el('b', { text: s })));

  function memoriaDe(params) {
    let m = memorias.get(params);
    if (!m) { m = { saco: [], usadas: [] }; memorias.set(params, m); }
    return m;
  }

  /** Sorteia a palavra da rodada sem repetir na estação (enquanto houver palavras novas). */
  function sortearPalavra(pool, mem, preferida) {
    if (preferida) {
      const p = pool.find(q => q.id === preferida);
      if (p && mem.usadas.indexOf(p.id) < 0) { mem.usadas.push(p.id); return p; }
    }
    let livres = pool.filter(p => mem.usadas.indexOf(p.id) < 0);
    if (!livres.length) { mem.usadas = []; livres = pool.slice(); }
    const p = U.escolher(livres);
    mem.usadas.push(p.id);
    return p;
  }

  /** Opções erradas plausíveis: mesma letra inicial (+2), mesmo número de sílabas (+1), figura do mesmo tipo (+0,5). */
  function sortearErradas(alvo, quantas) {
    const pal = P();
    const tem = pal.temDesenho(alvo);
    const vistos = [alvo.texto], figuras = [alvo.figura];
    const candidatos = U.embaralhar(pal.lista.filter(p => p.texto !== alvo.texto && p.figura !== alvo.figura)).map(p => ({
      p, nota: (p.inicial === alvo.inicial ? 2 : 0) + (p.silabas.length === alvo.silabas.length ? 1 : 0) + (pal.temDesenho(p) === tem ? 0.5 : 0),
    }));
    candidatos.sort((a, b) => b.nota - a.nota);                 // sort estável: o embaralhar desempata
    const escolhidas = [];
    for (const c of candidatos) {
      if (escolhidas.length >= quantas) break;
      if (vistos.indexOf(c.p.texto) >= 0 || figuras.indexOf(c.p.figura) >= 0) continue;
      vistos.push(c.p.texto); figuras.push(c.p.figura);
      escolhidas.push(c.p);
    }
    return escolhidas;
  }

  // ---------------------------------------------------------------- uma rodada
  function rodada(ctx) {
    U.estilo('ler', CSS);
    const params = ctx.params || {};
    const pal = P();
    const faixaSil = Array.isArray(params.silabas) ? params.silabas.map(Number) : [2, 2];
    const minS = U.limitar(inteiro(faixaSil[0], 2), 1, 5), maxS = U.limitar(inteiro(faixaSil[1], minS), minS, 5);
    const nOpcoes = U.limitar(inteiro(params.opcoes, 3), 2, 3);
    const mem = memoriaDe(params);

    let pool = pal.filtrar({ silabas: [minS, maxS] });
    if (!pool.length) pool = pal.lista.slice();
    const alvo = sortearPalavra(pool, mem, ctx.demo ? 'pato' : null);
    const palavras = U.embaralhar([alvo].concat(sortearErradas(alvo, nOpcoes - 1)));
    const certa = palavras.indexOf(alvo);

    let destruido = false, resolvida = false, bloqueado = false, ajudando = false, demonstrando = false, interagiu = false;
    let fase = 'escolhendo';                 // escolhendo | fim
    let leitura = null;                      // AbortController da fala em andamento (instrução, sílaba, ajuda, demo)
    const vivo = () => !destruido && !resolvida && !ctx.sinal.aborted;

    const camada = U.el('div', { class: 'pc-ler' });
    ctx.palco.appendChild(camada);

    // ------------------------------------------------------------ plaquinha com as sílabas
    const placa = U.el('div', { class: 'pc-ler-placa', teste: 'palavra', role: 'group', 'aria-label': 'Palavra' });
    const veios = U.el('div', { class: 'pc-ler-veios', html:
      '<svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M4 22 Q 30 18 52 23 T 96 20 M3 52 Q 26 56 48 51 T 97 54 M5 82 Q 34 78 60 83 T 95 80" fill="none" stroke="#E2BE86" stroke-width="2.2" vector-effect="non-scaling-stroke"/>' +
      '<path d="M8 10 H 40" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>' });
    placa.appendChild(veios);
    [['16px', '16px', 'left', 'top'], ['16px', '16px', 'right', 'top'], ['16px', '16px', 'left', 'bottom'], ['16px', '16px', 'right', 'bottom']]
      .forEach(([a, b, h, v]) => placa.appendChild(U.el('i', { class: 'pc-ler-prego', style: h + ':' + a + ';' + v + ':' + b })));
    const silabas = alvo.silabas.map((s, i) => {
      const el = U.el('button', { type: 'button', class: 'pc-ler-silaba', teste: 'silaba-' + i, 'aria-label': pal.falaSilaba(s) }, s);
      PC.aoTocar(el, () => tocarSilaba(i), { som: false, intervalo: 250 });
      placa.appendChild(el);
      return el;
    });
    const faixa = U.el('div', { class: 'pc-ler-faixa' }, placa);
    camada.appendChild(faixa);
    if (placa.offsetWidth > LARGURA_MAX) placa.classList.add('compacta');   // palavras longas (4 sílabas)
    U.animar(placa, [{ transform: 'translateY(-40px) scale(.9)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1 }],
      { duration: 420, easing: 'cubic-bezier(.3, 1.4, .5, 1)' });

    /** Centro de uma sílaba em px virtuais (medido no próprio palco, sem depender da escala). */
    function centroSilaba(i) {
      const el = silabas[i];
      const x = PLACA.cx - placa.offsetWidth / 2 + el.offsetLeft + el.offsetWidth / 2;
      const y = PLACA.y + el.offsetTop + el.offsetHeight / 2;
      return { x: Math.round(x), y: Math.round(y) };
    }

    // ------------------------------------------------------------ cartões das figuras
    const xs = CARTAS_X[palavras.length] || CARTAS_X[3];
    const cartas = palavras.map((p, i) => {
      const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pal.desenho(p));
      const el = U.el('button', { type: 'button', class: 'pc-ler-carta', teste: 'opcao-' + i, 'aria-label': nome(p),
        style: { left: (xs[i] - CARTAO / 2) + 'px', top: (CARTAS_Y - CARTAO / 2) + 'px' } },
      U.el('img', { src, alt: '', draggable: 'false' }));
      PC.aoTocar(el, () => escolher(i));
      camada.appendChild(el);
      U.animar(el, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
        { duration: 380, delay: 200 + i * 110, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' });
      return { el, p, i, fora: false, x: xs[i], y: CARTAS_Y };
    });

    // ------------------------------------------------------------ falas que a criança pode interromper
    function acender(i, classe = 'acesa') {
      silabas.forEach((s, k) => { if (k !== i) s.classList.remove('acesa'); });
      if (i != null && silabas[i]) { silabas[i].classList.remove('lida'); silabas[i].classList.add(classe); }
    }
    const apagar = () => silabas.forEach(s => s.classList.remove('acesa', 'lida'));
    function cancelarLeitura() {
      const ac = leitura;
      leitura = null;
      if (ac) ac.abort();
      if (!resolvida) apagar();
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
      await ctx.esperar(0);                    // segura durante o "Quer parar?"
      if (sinal.aborted) throw U.abortado();
      const r = await ctx.falar(texto, op);
      if (sinal.aborted) throw U.abortado();
      return r;
    }
    /** Fala as sílabas uma por uma, acendendo cada uma (sem juntar). */
    async function lerSilabas(sinal, classe) {
      for (let k = 0; k < silabas.length; k++) {
        acender(k, 'acesa');
        await Promise.all([falarEm(sinal, pal.falaSilaba(alvo.silabas[k]), { mostrar: balao([alvo.silabas[k]]) }), U.esperar(U.duracao(450), sinal)]);
        silabas[k].classList.remove('acesa');
        if (classe) silabas[k].classList.add(classe);
        await U.esperar(U.duracao(180), sinal);
      }
    }
    /** Depois de ctx.errou: só o primeiro toque vale até a Pipoca terminar o retorno (ou começar a ajuda). */
    async function esperarRetorno() {
      try {
        await ctx.esperar(150);
        for (let t = 0; t < 20000 && PC.ui.pipoca.falando() && !ajudando; t += 100) await ctx.esperar(100);
      } catch (e) { if (!U.ehAbortado(e)) console.error(e); }
      if (!destruido && fase !== 'fim') bloqueado = false;
    }
    function terminarLeitura(ac) {
      if (leitura === ac) { leitura = null; if (vivo()) { apagar(); PC.ui.pipoca.pose('normal'); } }
    }

    // ------------------------------------------------------------ toques
    function tocarSilaba(i) {
      if (!vivo() || fase !== 'escolhendo' || demonstrando) return;
      interagiu = true;
      const ac = novaLeitura(), s = ac.signal;
      ajudando = false;
      (async () => {
        try {
          acender(i);
          U.animar(silabas[i], [{ transform: 'scale(1.08)' }, { transform: 'scale(1.16)', offset: 0.4 }, { transform: 'scale(1.08)' }], { duration: 300 });
          await Promise.all([falarEm(s, pal.falaSilaba(alvo.silabas[i]), { mostrar: balao([alvo.silabas[i]]) }), U.esperar(U.duracao(500), s)]);
        } catch (e) {
          if (!U.ehAbortado(e)) console.error(e);
        } finally { terminarLeitura(ac); }
      })();
    }

    function escolher(i) {
      const c = cartas[i];
      if (!c || c.fora || bloqueado || demonstrando || !vivo() || fase !== 'escolhendo') return;
      interagiu = true;
      cancelarLeitura();
      if (i === certa) { acertar(c); return; }
      bloqueado = true;
      c.fora = true;
      c.el.classList.add('fora');
      U.animar(c.el, [{ transform: 'translateX(0)' }, { transform: 'translateX(-12px)' }, { transform: 'translateX(10px)' },
        { transform: 'translateX(-6px)' }, { transform: 'translateX(0)' }], { duration: 360 });
      ctx.errou({ fala: essaE(c.p) + ' Toque nos pedacinhos e leia de novo.' });
      esperarRetorno();
    }

    async function acertar(c) {
      fase = 'fim';
      bloqueado = true;
      ctx.ocupado(true);
      c.el.classList.add('certa');
      U.animar(c.el, [{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' });
      const ac = new AbortController(), s = ac.signal;
      ctx.sinal.addEventListener('abort', () => ac.abort(), { once: true });
      try {
        PC.ui.pipoca.pose('aponta');
        await lerSilabas(s, 'lida');
        silabas.forEach(el => { el.classList.remove('lida'); el.classList.add('acesa'); });
        U.animar(placa, [{ transform: 'scale(1)' }, { transform: 'scale(1.05)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 500 });
        await falarEm(s, maiuscula(nome(alvo)) + '!', { mostrar: balao([alvo.texto]) });
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

    // ------------------------------------------------------------ instrução, demonstração, gesto e ajuda
    function falarInstrucao(curta) {
      if (!vivo() || fase !== 'escolhendo' || bloqueado || ajudando || demonstrando) return Promise.resolve();
      const ac = novaLeitura(), s = ac.signal;
      return (async () => {
        try {
          PC.ui.pipoca.pose('aponta');
          U.animar(placa, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-1deg)' }, { transform: 'rotate(1deg)' }, { transform: 'rotate(0deg)' }], { duration: 420 });
          await falarEm(s, curta ? 'Que palavra é essa?' : 'Leia comigo! Que palavra é essa?');   // curta: rodadas seguintes
        } catch (e) {
          if (!U.ehAbortado(e)) console.error(e);
        } finally { terminarLeitura(ac); }
      })();
    }

    /** 1ª rodada com demo: a mãozinha toca nas sílabas, a Pipoca lê e mostra a figura certa. */
    async function demonstrar() {
      const ac = novaLeitura(), s = ac.signal;
      demonstrando = true;
      ctx.ocupado(true);
      let dica = null;
      try {
        PC.ui.pipoca.pose('aponta');
        await falarEm(s, 'Olhe como eu leio: toco em cada pedacinho.');
        for (let k = 0; k < silabas.length; k++) {
          if (dica) dica.parar();
          dica = PC.ui.dica(centroSilaba(k), null, { vezes: 1, raiz: ctx.palco });
          await U.esperar(U.duracao(450), s);
          acender(k);
          await Promise.all([falarEm(s, pal.falaSilaba(alvo.silabas[k]), { mostrar: balao([alvo.silabas[k]]) }), U.esperar(U.duracao(700), s)]);
          silabas[k].classList.remove('acesa');
          silabas[k].classList.add('lida');
        }
        silabas.forEach(el => { el.classList.remove('lida'); el.classList.add('acesa'); });
        await falarEm(s, maiuscula(nome(alvo)) + '!', { mostrar: balao([alvo.texto]) });
        apagar();
        if (dica) dica.parar();
        demonstrando = false;
        ctx.ocupado(false);
        const g = proximoGesto();
        if (g) dica = ctx.dica(g.em, null);
        await falarEm(s, 'Agora toque ' + naNo(alvo) + '!');
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
        if (dica && U.ehAbortado(e) && !vivo()) dica.parar();
      } finally {
        if (demonstrando) { demonstrando = false; if (vivo()) ctx.ocupado(false); }
        terminarLeitura(ac);
      }
    }

    /** O gesto certo agora (px virtuais): tocar na figura certa. */
    function proximoGesto() {
      if (!vivo() || fase !== 'escolhendo') return null;
      const c = cartas[certa];
      return { tipo: 'tocar', em: { x: c.x, y: c.y } };
    }

    /** Ajuda que ensina (2º erro seguido): a Pipoca fala as sílabas uma por uma, acendendo cada uma, sem juntar. */
    async function ajudar(nivel) {
      if (nivel !== 2 || !vivo() || ajudando || demonstrando || fase !== 'escolhendo') return;
      const ac = novaLeitura(), s = ac.signal;
      ajudando = true;
      bloqueado = false;
      ctx.ocupado(true);
      try {
        PC.ui.pipoca.pose('aponta');
        await falarEm(s, 'Vamos ler devagar, pedacinho por pedacinho.');
        await lerSilabas(s, 'lida');
        await U.esperar(U.duracao(300), s);
        apagar();
        await falarEm(s, 'Que palavra é essa?');
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ajudando = false;
        terminarLeitura(ac);
        if (vivo()) ctx.ocupado(false);
      }
    }

    /** Testes: marca a figura certa e termina a rodada (um único ctx.acertou()). */
    function resolver() {
      if (destruido || resolvida) return;
      fase = 'fim';
      cancelarLeitura();
      resolvida = true;
      try {
        cartas[certa].el.classList.add('certa');
        silabas.forEach(el => el.classList.add('acesa'));
      } catch (e) { console.error(e); }
      ctx.acertou();
    }

    function estado() {
      const errada = cartas.find(c => c.i !== certa && !c.fora);
      return {
        fase, bloqueado, ajudando, demonstrando, resolvida,
        palavra: alvo.texto, silabas: alvo.silabas.slice(), resposta: 'opcao-' + certa, certa,
        opcoes: cartas.map(c => c.p.texto),
        fora: cartas.filter(c => c.fora).map(c => 'opcao-' + c.i),
        errada: errada ? 'opcao-' + errada.i : null,
        acesas: silabas.map((s, i) => (s.classList.contains('acesa') ? i : -1)).filter(i => i >= 0),
      };
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      cancelarLeitura();
      camada.remove();
    }

    // ------------------------------------------------------------ começar
    (async () => {
      try {
        await ctx.esperar(450);
        await falarInstrucao(!ctx.primeiraDaVez);
        if (ctx.demo && !interagiu && vivo()) await demonstrar();
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    })();

    return { instrucao: () => falarInstrucao(), proximoGesto, ajudar, resolver, estado, destruir };
  }

  PC.atividades.registrar('ler', {
    titulo: 'Ler palavrinhas',
    icone: 'ler',
    cenario: 'floresta',
    totalRodadas: params => U.limitar(inteiro(params && params.rodadas, 4), 1, 10),
    rodada,
  });

  // ---------------------------------------------------------------- medalhão do mapa
  // Plaquinha de madeira com a palavra em sílabas e, embaixo, os cartões das figuras (2 ou 3, como na estação).
  // Duas sílabas: PA·TO e o patinho. Três sílabas: BA·NA·NA e a banana.
  if (PC.arte && PC.arte.registrarMedalhao) {
    PC.arte.registrarMedalhao('ler', {
      fundo: ['#F1E9FF', '#B9E59A', '#94D373'],
      cena(p) {
        const pc = PC.arte.pecasMedalhao || {};
        const FONTE = pc.FONTE || 'font-family="Fredoka, sans-serif" font-weight="700"';
        const brilho = pc.brilho || (() => '');
        const tres = Array.isArray(p.silabas) && Number(p.silabas[0]) >= 3;
        const sil = tres ? ['BA', 'NA', 'NA'] : ['PA', 'TO'];
        const n = U.limitar(inteiro(p.opcoes, 3), 2, 3);
        // plaquinha pendurada (as sílabas em azulejinhos; a primeira acesa, como quando a criança toca)
        const lt = tres ? 19 : 23, fs = tres ? 11.5 : 14, gap = 2.5, larg = sil.length * lt + (sil.length - 1) * gap + 8, x0 = 50 - larg / 2;
        let s = `<path d="M${x0 + 9} 17 L 50 7 L ${x0 + larg - 9} 17" fill="none" stroke="${T}" stroke-width="2"/>` +
          `<circle cx="50" cy="7" r="2" fill="${T}"/>` +
          `<rect x="${x0}" y="16" width="${larg}" height="29" rx="7" fill="#F6DDB0" stroke="${T}" stroke-width="2.6"/>`;
        sil.forEach((t, i) => {
          const x = x0 + 4 + i * (lt + gap);
          s += `<rect x="${x}" y="19.5" width="${lt}" height="22" rx="5" fill="${i === 0 ? '#FFE27A' : '#FFF8EC'}" stroke="${T}" stroke-width="1.3" stroke-opacity=".5"/>` +
            `<text x="${x + lt / 2}" y="${35 - (14 - fs) * 0.35}" text-anchor="middle" font-size="${fs}" ${FONTE} fill="${T}">${t}</text>`;
        });
        // figurinhas: pato, bola, uva / banana, bola, uva
        const pato = (cx, cy) => `<ellipse cx="${cx}" cy="${cy + 3}" rx="7.5" ry="5" fill="#FFE14D" stroke="${T}" stroke-width="1.6"/>` +
          `<circle cx="${cx + 4}" cy="${cy - 3}" r="4" fill="#FFE14D" stroke="${T}" stroke-width="1.6"/>` +
          `<path d="M${cx + 7.5} ${cy - 3.5} l 4 1.2 l -4 1.6 Z" fill="#FF9F43" stroke="${T}" stroke-width="1.1" stroke-linejoin="round"/>` +
          `<circle cx="${cx + 5}" cy="${cy - 4}" r="0.9" fill="${T}"/>`;
        const banana = (cx, cy) => `<path d="M${cx - 6} ${cy - 7} Q ${cx - 8} ${cy + 7} ${cx + 8} ${cy + 5} Q ${cx - 1} ${cy + 1} ${cx - 2} ${cy - 7} Z" fill="#FFE14D" stroke="${T}" stroke-width="1.6" stroke-linejoin="round"/>` +
          `<path d="M${cx - 5} ${cy - 7} l 2 -2" stroke="#A9703F" stroke-width="2.4" stroke-linecap="round"/>`;
        const bola = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="7" fill="#FF7A6B" stroke="${T}" stroke-width="1.6"/>` +
          `<path d="M${cx - 7} ${cy} Q ${cx} ${cy - 4} ${cx + 7} ${cy}" fill="none" stroke="#fff" stroke-width="2"/>`;
        const uva = (cx, cy) => [[-3, -3], [3, -3], [0, 2], [-3.5, 2.5], [3.5, 2.5], [0, 6.5]].map(([dx, dy]) =>
          `<circle cx="${cx + dx}" cy="${cy + dy - 1}" r="2.8" fill="#9B7BFF" stroke="${T}" stroke-width="1.1"/>`).join('') +
          `<path d="M${cx} ${cy - 6} l 1 -3" stroke="#5CC84A" stroke-width="1.6" stroke-linecap="round"/>`;
        const figs = [tres ? banana : pato, bola, uva].slice(0, n);
        const xs = n === 2 ? [36, 64] : [24, 50, 76];
        figs.forEach((f, i) => {
          const cx = xs[i], cy = 69, l = 22;
          s += `<rect x="${cx - l / 2}" y="${cy - l / 2}" width="${l}" height="${l}" rx="5" fill="#fff" stroke="${T}" stroke-width="2.2"/>` + f(cx, cy);
        });
        return s + brilho(86, 52, 4, '#FFC93C');
      },
    });
  }
})();
