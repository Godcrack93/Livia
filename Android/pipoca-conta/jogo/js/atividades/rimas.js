/* Pipoca Aprende — atividade "rimas" (PROJETO.md 5.8 e 5.11).
   Modos (params.modo):
     rima     (padrão) a figura-modelo à esquerda (cartão branco com aro dourado) e 2 ou 3 figuras numa coluna à
              direita: "Pato! … Pato rima com…?". Só uma opção é do mesmo grupo de rima do modelo; as outras são de
              grupos diferentes e não "quase rimam" com o modelo, com a certa nem entre si (última sílaba diferente e
              vogais do fim diferentes: nada de bola × mala, pato × dado ou pão × pato).
     intruso  3 figuras numa fileira; duas rimam (mesmo grupo) e uma não: "Qual não rima?".
   Ao acertar: um laço colorido liga as duas figuras que rimam e elas pulam juntas ("Pato, gato! Rimou!"); só então
   ctx.acertou(). Erro: a figura tocada sai de jogo (fica clarinha) e a Pipoca diz que não rima e repete a pergunta,
   sem entregar a resposta ("Bola não rima. Pato rima com…?"); no intruso: "Pato rima com gato. Qual não rima?".
   Acerto do intruso: "Isso! Bola não rima. Pato, gato!". Falas curtas e inteiras: nada de juntar duas palavras
   sorteadas numa frase só (cada combinação seria uma gravação a mais).
   Ajuda (nível 2): a Pipoca fala cada figura destacando o fim ("Pato! pá… tô… tô!").
   Tocar no modelo: a Pipoca fala o nome dele de novo.
   Os grupos-modelo não se repetem dentro da estação (um saco por estação jogada; só repete se acabarem).
   Palavras e figuras: PC.palavras (gruposDeRima, nome, desenho, silabas, falaSilaba).
   params: { modo: 'rima' | 'intruso', opcoes: 2 | 3, rodadas, demo }
   data-teste: modelo, opcao-0 … opcao-2. */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;
  const T = '#3A2A5A';

  // ---------------------------------------------------------------- layout (px virtuais)
  // a coluna das opções fica à direita; o modelo à esquerda, fora da zona do balão da Pipoca (x < 570, y 380–600)
  const MODELO = { x: 720, y: 470, lado: 280 };
  const COLUNA = { x: 1310, ys: { 2: [335, 615], 3: [250, 470, 690] }, lado: { 2: 230, 3: 200 } };
  const FILEIRA = { y: 480, xs: [740, 1040, 1340], lado: 250 };          // intruso
  const NOTAS = { x: 1025, y: 470 };                                     // enfeite entre o modelo e as opções

  const CSS = `
    .pc-rimas { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
    .pc-rimas-cartao { position: absolute; margin: 0; padding: 0; border: 0; background: none; cursor: pointer; }
    .pc-rimas-pula { position: absolute; left: 0; top: 0; width: 100%; height: 100%; transform-origin: 50% 90%; }
    .pc-rimas-face { position: absolute; left: 0; top: 0; right: 0; bottom: 0; box-sizing: border-box; border-radius: 46px;
      background: #fff; border: 6px solid ${T}; box-shadow: 0 10px 0 rgba(58, 42, 90, .32);
      display: grid; place-items: center; transition: background-color .2s, border-color .2s, transform .18s, box-shadow .08s; }
    .pc-rimas-face svg { width: 84%; height: 84%; display: block; overflow: visible; pointer-events: none; }
    .pc-rimas-face::after { content: ''; position: absolute; left: 16px; top: 12px; width: 34%; height: 12px; border-radius: 6px;
      background: rgba(255, 255, 255, .7); pointer-events: none; }
    .pc-rimas-cartao.apertado .pc-rimas-face { transform: translateY(6px); box-shadow: 0 4px 0 rgba(58, 42, 90, .32); }
    .pc-rimas-modelo .pc-rimas-face { border-width: 7px; box-shadow: 0 0 0 10px #FFC93C, 0 0 0 15px ${T}, 0 18px 0 rgba(58, 42, 90, .3); }
    .pc-rimas-cartao.lendo .pc-rimas-face { background: #FFF2B3; transform: scale(1.07); }
    .pc-rimas-modelo.lendo .pc-rimas-face { transform: scale(1.05); }
    .pc-rimas-cartao.certa .pc-rimas-face { background: #DDF6D2; border-color: #2F8F2A; }
    .pc-rimas-cartao.fora { pointer-events: none; }
    .pc-rimas-cartao.fora .pc-rimas-face { background: #EEEAF4; border-color: #A79CC0; box-shadow: 0 4px 0 rgba(167, 156, 192, .6); transform: translateY(6px); }
    .pc-rimas-cartao.fora .pc-rimas-face svg { opacity: .3; }
    .pc-rimas-arco, .pc-rimas-enfeite { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; pointer-events: none; overflow: visible; }
    .pc-rimas-enfeite { transition: opacity .3s; }
    .pc-rimas-enfeite.some { opacity: 0; }
  `;

  // ---------------------------------------------------------------- palavras
  const memorias = new WeakMap();      // por estação jogada (a moldura usa o mesmo objeto params em todas as rodadas)
  function memoriaDe(params) {
    let m = memorias.get(params);
    if (!m) { m = { saco: [], ultimo: null, usadas: {} }; memorias.set(params, m); }
    return m;
  }

  const semAcento = s => PC.palavras.semAcento(String(s || '')).toUpperCase();
  const nome = p => PC.palavras.nome(p);
  const Nome = p => { const n = nome(p); return n.charAt(0).toUpperCase() + n.slice(1); };
  const ultimaSilaba = p => semAcento(p.silabas[p.silabas.length - 1]);
  /** Vogais do fim (do grupo de rima ou, sem grupo, da última sílaba): 'ato' → 'AO'. */
  const vogaisDoFim = p => semAcento(p.rima || ultimaSilaba(p)).replace(/[^AEIOU]/g, '');
  /** As duas "rimam" ou quase rimam (para uma criança soariam parecidas)? */
  function parecidas(a, b) {
    if (a === b) return true;
    if (a.rima && a.rima === b.rima) return true;
    if (ultimaSilaba(a) === ultimaSilaba(b)) return true;
    if (vogaisDoFim(a) === vogaisDoFim(b)) return true;
    const fa = semAcento(a.texto), fb = semAcento(b.texto);
    return fa.slice(-2) === fb.slice(-2);
  }

  /** Próximo grupo de rima sem repetir na estação (o saco só reabastece quando acaba). */
  function sortearGrupo(grupos, mem, preferido) {
    if (!mem.saco.length) {
      mem.saco = U.embaralhar(Object.keys(grupos));
      if (mem.saco.length > 1 && mem.saco[mem.saco.length - 1] === mem.ultimo) mem.saco.unshift(mem.saco.pop());
    }
    const k = preferido ? mem.saco.indexOf(preferido) : -1;
    const g = k >= 0 ? mem.saco.splice(k, 1)[0] : mem.saco.pop();
    mem.ultimo = g;
    return g;
  }

  /** k palavras que não rimam (nem quase) com nenhuma de `contra` nem entre si; prefere as menos usadas. */
  function sortearDespistes(k, contra, mem) {
    const banco = PC.palavras.filtrar({ rima: true }).filter(p => contra.every(c => !parecidas(p, c)));
    const ordem = U.embaralhar(banco).sort((a, b) => (mem.usadas[a.id] || 0) - (mem.usadas[b.id] || 0));
    const escolhidas = [];
    for (const p of ordem) {
      if (escolhidas.length >= k) break;
      if (escolhidas.every(e => !parecidas(e, p))) escolhidas.push(p);
    }
    return escolhidas;
  }

  // ---------------------------------------------------------------- desenhos
  /** Laço de três cores (arco-íris) entre dois pontos; a curva sobe acima dos dois. */
  function svgLaco(a, b, alturaExtra) {
    const cx = (a.x + b.x) / 2, cy = Math.min(a.y, b.y) - alturaExtra;
    const d = `M${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
    const meio = { x: (a.x + 2 * cx + b.x) / 4, y: (a.y + 2 * cy + b.y) / 4 };
    const estrela = (x, y, r, cor) => `<path d="M${x} ${y - r} Q ${x + r * 0.22} ${y - r * 0.22} ${x + r} ${y} Q ${x + r * 0.22} ${y + r * 0.22} ${x} ${y + r} ` +
      `Q ${x - r * 0.22} ${y + r * 0.22} ${x - r} ${y} Q ${x - r * 0.22} ${y - r * 0.22} ${x} ${y - r} Z" fill="${cor}" stroke="${T}" stroke-width="4" stroke-linejoin="round"/>`;
    return `<svg class="pc-rimas-arco" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<path d="${d}" fill="none" stroke="${T}" stroke-width="64" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="#FF7A6B" stroke-width="52" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="#FFC93C" stroke-width="34" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="#2EC4B6" stroke-width="16" stroke-linecap="round"/>` +
      estrela(meio.x, meio.y - 70, 30, '#FFE14D') + estrela(meio.x - 90, meio.y - 34, 18, '#FF8FC2') + estrela(meio.x + 92, meio.y - 30, 20, '#9B7BFF') +
      `</svg>`;
  }
  /** Enfeite entre o modelo e as opções: duas notinhas de música (rima é música de palavras). */
  function svgNotas() {
    const { x, y } = NOTAS;
    return `<svg class="pc-rimas-enfeite" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g opacity=".9">` +
      `<path d="M${x - 70} ${y + 20} q 40 -40 0 -80 M${x - 30} ${y + 34} q 60 -60 0 -120" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".75"/>` +
      `<g transform="translate(${x + 10} ${y - 40}) rotate(-8)">` +
      `<path d="M0 0 V -92 L 64 -112 V -20" fill="none" stroke="${T}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<path d="M0 -92 L 64 -112 V -88 L 0 -68 Z" fill="${T}"/>` +
      `<ellipse cx="-14" cy="2" rx="24" ry="18" fill="#FF8FC2" stroke="${T}" stroke-width="7" transform="rotate(-20 -14 2)"/>` +
      `<ellipse cx="50" cy="-18" rx="24" ry="18" fill="#9B7BFF" stroke="${T}" stroke-width="7" transform="rotate(-20 50 -18)"/>` +
      `<ellipse cx="-20" cy="-4" rx="7" ry="4" fill="#fff" opacity=".7" transform="rotate(-20 -20 -4)"/></g>` +
      `<g transform="translate(${x + 40} ${y + 120}) rotate(10)">` +
      `<path d="M0 0 V -80 q 28 8 34 34" fill="none" stroke="${T}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<ellipse cx="-14" cy="2" rx="22" ry="16" fill="#FFC93C" stroke="${T}" stroke-width="7" transform="rotate(-20 -14 2)"/></g>` +
      `</g></svg>`;
  }

  // ---------------------------------------------------------------- rodada
  function rodada(ctx) {
    U.estilo('rimas', CSS);
    const params = ctx.params || {};
    const modo = params.modo === 'intruso' ? 'intruso' : 'rima';
    const nOpcoes = modo === 'intruso' ? 3 : (Number(params.opcoes) === 2 ? 2 : 3);
    const mem = memoriaDe(params);

    let destruido = false, resolvida = false, bloqueado = false, ajudando = false, interagiu = false;
    let fase = 'escolhendo';
    let leitura = null;                 // AbortController da fala em andamento (instrução, ajuda, nome do modelo)
    let modelo = null;                  // { el, face, pula, p, x, y, lado }  (só no modo rima)
    let opcoes = [];                    // { el, face, pula, p, i, x, y, lado, fora }
    let certa = -1;                     // índice da opção certa (no intruso: a que não rima)
    let grupo = null;

    const camada = U.el('div', { class: 'pc-rimas' });
    ctx.palco.appendChild(camada);
    const vivo = () => !destruido && !resolvida && !ctx.sinal.aborted;

    // ------------------------------------------------------------ sorteio da rodada
    const grupos = PC.palavras.gruposDeRima();
    grupo = sortearGrupo(grupos, mem, ctx.demo && grupos.ato ? 'ato' : null);
    const doGrupo = grupos[grupo] || [];
    let figuras = [];
    if (modo === 'rima') {
      // na demonstração, o exemplo clássico: pato e gato
      const pModelo = ctx.demo && grupo === 'ato' && PC.palavras.obter('pato') ? PC.palavras.obter('pato') : U.escolher(doGrupo);
      const resto = doGrupo.filter(p => p !== pModelo);
      const pCerta = ctx.demo && grupo === 'ato' && PC.palavras.obter('gato') ? PC.palavras.obter('gato') : U.escolher(resto);
      const despistes = sortearDespistes(nOpcoes - 1, [pModelo, pCerta], mem);
      figuras = U.embaralhar([pCerta].concat(despistes));
      certa = figuras.indexOf(pCerta);
      modelo = { p: pModelo };
    } else {
      const par = U.embaralhar(doGrupo).slice(0, 2);
      const intruso = sortearDespistes(1, par, mem)[0];
      figuras = U.embaralhar(par.concat(intruso ? [intruso] : []));
      certa = figuras.indexOf(intruso);
    }
    [modelo && modelo.p].concat(figuras).forEach(p => { if (p) mem.usadas[p.id] = (mem.usadas[p.id] || 0) + 1; });

    // ------------------------------------------------------------ peças
    function criarCartao(p, x, y, lado, teste, extraClasse) {
      const el = U.el('div', {
        class: 'pc-rimas-cartao' + (extraClasse ? ' ' + extraClasse : ''), teste, role: 'button', tabindex: '0', 'aria-label': nome(p),
        style: { left: (x - lado / 2) + 'px', top: (y - lado / 2) + 'px', width: lado + 'px', height: lado + 'px' },
      });
      const pula = U.el('div', { class: 'pc-rimas-pula' });
      const face = U.el('div', { class: 'pc-rimas-face', html: PC.palavras.desenho(p) });
      pula.appendChild(face);
      el.appendChild(pula);
      return { el, pula, face, p, x, y, lado };
    }
    const pular = (c, alto = 34, atraso = 0) => U.animar(c.pula, [
      { transform: 'translateY(0px) scale(1, 1)' },
      { transform: `translateY(${-alto}px) scale(.96, 1.05)`, offset: 0.4 },
      { transform: 'translateY(0px) scale(1.05, .95)', offset: 0.78 },
      { transform: 'translateY(0px) scale(1, 1)' },
    ], { duration: 440, delay: atraso, easing: 'ease-out' });
    const balancar = c => U.animar(c.pula, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-6deg)', offset: 0.3 },
      { transform: 'rotate(5deg)', offset: 0.65 }, { transform: 'rotate(0deg)' }], { duration: 380, easing: 'ease-in-out' });
    const surgir = (el, atraso) => U.animar(el, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 380, delay: atraso, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' });

    let enfeite = null;
    if (modo === 'rima') {
      enfeite = U.el('div', { html: svgNotas() }).firstChild;
      camada.appendChild(enfeite);
      const m = createModelo();
      modelo = m;
      const ys = COLUNA.ys[nOpcoes], lado = COLUNA.lado[nOpcoes];
      opcoes = figuras.map((p, i) => Object.assign(criarCartao(p, COLUNA.x, ys[i], lado, 'opcao-' + i), { i, fora: false }));
    } else {
      opcoes = figuras.map((p, i) => Object.assign(criarCartao(p, FILEIRA.xs[i], FILEIRA.y, FILEIRA.lado, 'opcao-' + i), { i, fora: false }));
    }
    function createModelo() {
      const c = criarCartao(modelo.p, MODELO.x, MODELO.y, MODELO.lado, 'modelo', 'pc-rimas-modelo');
      camada.appendChild(c.el);
      PC.aoTocar(c.el, () => tocarModelo(), { som: false });
      surgir(c.el, 0);
      return c;
    }
    opcoes.forEach((o, k) => {
      camada.appendChild(o.el);
      PC.aoTocar(o.el, () => escolher(o.i));
      surgir(o.el, 120 + k * 110);
    });

    /** Destaca (amarelo) o cartão que a Pipoca está falando; null apaga. */
    function destacar(c) {
      camada.querySelectorAll('.lendo').forEach(e => { if (!c || e !== c.el) e.classList.remove('lendo'); });
      if (c) c.el.classList.add('lendo');
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
      await ctx.esperar(0);               // segura durante o "Quer parar?" e confere de novo
      if (sinal.aborted) throw U.abortado();
      const r = await ctx.falar(texto, op);
      if (sinal.aborted) throw U.abortado();
      return r;
    }
    function terminarLeitura(ac) {
      if (leitura === ac) { leitura = null; destacar(null); if (vivo()) PC.ui.pipoca.pose('normal'); }
    }
    /** Depois de ctx.errou: só o primeiro toque vale até a Pipoca terminar o retorno (ou começar a ajuda). */
    async function esperarRetorno() {
      try {
        await ctx.esperar(150);
        for (let t = 0; t < 20000 && PC.ui.pipoca.falando() && !ajudando; t += 100) await ctx.esperar(100);
      } catch (e) { if (!U.ehAbortado(e)) console.error(e); }
      if (!destruido && fase !== 'fim') bloqueado = false;
    }
    const vivas = () => opcoes.filter(o => !o.fora);

    /** Lê as figuras destacando uma por vez: "Gato! Bola! Uva!". */
    async function lerFiguras(s) {
      for (const o of vivas()) {
        destacar(o);
        await falarEm(s, Nome(o.p) + '!');
      }
      destacar(null);
    }

    function falarInstrucao() {
      if (!vivo() || fase === 'fim' || bloqueado || ajudando) return Promise.resolve();
      const ac = novaLeitura(), s = ac.signal;
      return (async () => {
        try {
          PC.ui.pipoca.pose('aponta');
          if (modo === 'rima') {
            destacar(modelo);
            await falarEm(s, Nome(modelo.p) + '!');
            await lerFiguras(s);
            destacar(modelo);
            await falarEm(s, Nome(modelo.p) + ' rima com…?');
          } else {
            await lerFiguras(s);
            await falarEm(s, 'Qual não rima?');
          }
        } catch (e) {
          if (!U.ehAbortado(e)) console.error(e);
        } finally {
          terminarLeitura(ac);
        }
      })();
    }

    function tocarModelo() {
      if (!vivo() || fase === 'fim' || bloqueado) return;
      interagiu = true;
      const ac = novaLeitura(), s = ac.signal;
      balancar(modelo);
      (async () => {
        try {
          destacar(modelo);
          await falarEm(s, Nome(modelo.p) + '!');
        } catch (e) {
          if (!U.ehAbortado(e)) console.error(e);
        } finally {
          terminarLeitura(ac);
        }
      })();
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
      balancar(op);
      let fala;
      if (modo === 'rima') {
        // não entrega a resposta: diz que não rima e repete a pergunta (a criança tenta de novo; as dicas em degraus
        // da moldura ajudam no 2º e no 3º erro). Frases curtas e inteiras: uma gravação por palavra, sem combinações.
        fala = `${Nome(op.p)} não rima. ${Nome(modelo.p)} rima com…?`;
      } else {
        const outra = opcoes.find(o => o !== op && o.i !== certa);
        fala = `${Nome(op.p)} rima com ${nome(outra.p)}. Qual não rima?`;
      }
      ctx.errou({ fala });
      esperarRetorno();
    }

    /** O par que rima: no modo rima, modelo + certa; no intruso, as duas que não são a resposta. */
    function parQueRima() {
      if (modo === 'rima') return [modelo, opcoes[certa]];
      return opcoes.filter(o => o.i !== certa);
    }

    /** Efeito de "rimou": o laço colorido liga as duas figuras e elas pulam juntas. */
    function mostrarLaco() {
      const [a, b] = parQueRima();
      let pa, pb, alto;
      if (modo === 'rima') {
        pa = { x: a.x + a.lado / 2 - 20, y: a.y };
        pb = { x: b.x - b.lado / 2 + 20, y: b.y };
        alto = 130;
      } else {
        pa = { x: a.x, y: a.y - a.lado / 2 + 18 };
        pb = { x: b.x, y: b.y - b.lado / 2 + 18 };
        alto = Math.abs(b.x - a.x) > 400 ? 200 : 150;
      }
      const caixa = U.el('div', { style: 'position:absolute;left:0;top:0;width:1600px;height:900px;pointer-events:none;transform-origin:' +
        ((pa.x + pb.x) / 2) + 'px ' + (Math.min(pa.y, pb.y)) + 'px', html: svgLaco(pa, pb, alto) });
      // atrás dos cartões: as pontas do laço somem debaixo deles
      camada.insertBefore(caixa, camada.firstChild);
      if (enfeite) enfeite.classList.add('some');
      U.animar(caixa, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.04)', offset: 0.7 }, { opacity: 1, transform: 'scale(1)' }],
        { duration: 520, easing: 'ease-out', fill: 'backwards' });
      return [a, b];
    }

    async function acertar(op) {
      fase = 'fim';
      bloqueado = true;
      ctx.ocupado(true);
      op.el.classList.add('certa');
      try {
        const [a, b] = mostrarLaco();
        if (modo === 'rima') a.el.classList.add('certa');
        PC.som.encaixar();
        const pulos = async () => {
          for (let k = 0; k < 2; k++) {
            await Promise.all([pular(a, 40), pular(b, 40)]);
            await ctx.esperar(60);
          }
        };
        PC.ui.pipoca.pose('feliz');
        if (modo === 'rima') {
          await Promise.all([pulos(), ctx.falar(`${Nome(modelo.p)}, ${nome(op.p)}! Rimou!`)]);
        } else {
          await Promise.all([pulos(), ctx.falar(`Isso! ${Nome(op.p)} não rima. ${Nome(a.p)}, ${nome(b.p)}!`)]);
        }
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

    // ------------------------------------------------------------ contrato
    function proximoGesto() {
      if (!vivo() || fase !== 'escolhendo') return null;
      const op = opcoes[certa];
      return op ? { tipo: 'tocar', em: { x: op.x, y: op.y } } : null;
    }

    /** "pá… tô… tô!": as sílabas separadas e a última repetida (o fim é o que rima). */
    function silabasDestacandoFim(p) {
      const s = p.silabas.map(x => PC.palavras.falaSilaba(x));
      return s.join('… ') + '… ' + s[s.length - 1] + '!';
    }

    /** Ajuda que ensina (2º erro seguido): a Pipoca fala cada figura destacando o fim. */
    async function ajudar(nivel) {
      if (nivel !== 2 || !vivo() || ajudando || fase !== 'escolhendo') return;
      const ac = novaLeitura(), s = ac.signal;
      ajudando = true;
      bloqueado = false;
      ctx.ocupado(true);
      try {
        PC.ui.pipoca.pose('aponta');
        await falarEm(s, 'Escute o fim!');
        const lista = (modo === 'rima' ? [modelo] : []).concat(vivas());
        for (const c of lista) {
          destacar(c);
          pular(c, 18);
          await falarEm(s, Nome(c.p) + '!');
          await falarEm(s, silabasDestacandoFim(c.p));
          await U.esperar(200, s);
        }
        destacar(modo === 'rima' ? modelo : null);
        await falarEm(s, modo === 'rima' ? Nome(modelo.p) + ' rima com…?' : 'Qual não rima?');
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ajudando = false;
        terminarLeitura(ac);
        if (vivo() && fase !== 'fim') ctx.ocupado(false);
      }
    }

    /** Testes: mostra a resposta certa e termina a rodada (um único ctx.acertou()). */
    function resolver() {
      if (destruido || resolvida) return;
      resolvida = true;
      fase = 'fim';
      cancelarLeitura();
      try {
        if (opcoes[certa]) opcoes[certa].el.classList.add('certa');
        if (modelo && modelo.el) modelo.el.classList.add('certa');
      } catch (e) { console.error(e); }
      ctx.acertou();
    }

    function estado() {
      const errada = opcoes.find(o => o.i !== certa && !o.fora);
      return {
        modo, fase, grupo, bloqueado, ajudando, resolvida,
        modelo: modelo ? modelo.p.id : null,
        opcoes: opcoes.map(o => o.p.id),
        rimas: opcoes.map(o => o.p.rima),
        certa, resposta: 'opcao-' + certa,
        errada: errada ? 'opcao-' + errada.i : null,
        fora: opcoes.filter(o => o.fora).map(o => 'opcao-' + o.i),
      };
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      cancelarLeitura();
      camada.remove();
    }

    // ------------------------------------------------------------ começar
    // a instrução e, na primeira rodada com demo, a mãozinha mostra uma vez o gesto
    (async () => {
      try {
        await ctx.esperar(450);
        await falarInstrucao();
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

  PC.atividades.registrar('rimas', {
    titulo: 'Rimas',
    icone: 'rimas',
    cenario: 'prado',
    totalRodadas: params => U.limitar(Math.round(Number(params && params.rodadas)) || 4, 1, 10),
    rodada,
  });

  // ---------------------------------------------------------------- medalhão do mapa
  // dois cartõezinhos (sol e anzol) ligados pelo laço colorido; no intruso, três cartões e o da uva levantado.
  if (PC.arte && PC.arte.registrarMedalhao) {
    const cartao = (x, y, l, desenho, giro = 0) =>
      `<g transform="rotate(${giro} ${x} ${y})"><rect x="${x - l / 2}" y="${y - l / 2 + 2.5}" width="${l}" height="${l}" rx="${l * 0.22}" fill="${T}" opacity=".25"/>` +
      `<rect x="${x - l / 2}" y="${y - l / 2}" width="${l}" height="${l}" rx="${l * 0.22}" fill="#fff" stroke="${T}" stroke-width="2.4"/>` +
      `<g transform="translate(${x} ${y}) scale(${l / 30})">${desenho}</g></g>`;
    // desenhos mínimos centrados em 0,0 (≈ 24 de largura)
    const sol = `<g stroke="${T}" stroke-width="1.6" stroke-linecap="round"><path d="M0 -11 V -8 M0 8 V 11 M-11 0 H -8 M8 0 H 11 M-7.8 -7.8 L -5.7 -5.7 M5.7 5.7 L 7.8 7.8 M-7.8 7.8 L -5.7 5.7 M5.7 -5.7 L 7.8 -7.8"/></g>` +
      `<circle r="5.6" fill="#FFC93C" stroke="${T}" stroke-width="1.6"/><circle cx="-1.8" cy="-1.8" r="1.4" fill="#fff" opacity=".7"/>`;
    const anzol = `<path d="M2 -12.5 Q 6 -15 4 -19 T 8 -24" fill="none" stroke="${T}" stroke-width="1.3" stroke-linecap="round"/>` +
      `<path d="M-6 1.6 L -5.4 -3.2 L -2.8 0.4" fill="#B9C3D6" stroke="${T}" stroke-width="1.3" stroke-linejoin="round"/>` +
      `<path d="M2 -10 V 4 a 5 5 0 0 1 -10 0 l 2.6 -2.6" fill="none" stroke="${T}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M2 -10 V 4 a 5 5 0 0 1 -10 0 l 2.6 -2.6" fill="none" stroke="#B9C3D6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="2" cy="-10.5" r="2.2" fill="#fff" stroke="${T}" stroke-width="1.4"/>`;
    const uva = [[-3.5, -3], [3.5, -3], [0, 3], [-7, 3], [7, 3], [-3.5, 9], [3.5, 9]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y - 2}" r="3.8" fill="#9B7BFF" stroke="${T}" stroke-width="1.3"/>`).join('') +
      `<path d="M0 -8 q 1 -4 4 -5" fill="none" stroke="#5CC84A" stroke-width="2" stroke-linecap="round"/>`;
    const laco = (x1, y1, x2, y2, alto) => {
      const d = `M${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - alto} ${x2} ${y2}`;
      return `<path d="${d}" fill="none" stroke="${T}" stroke-width="9.5" stroke-linecap="round"/>` +
        `<path d="${d}" fill="none" stroke="#FF7A6B" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="${d}" fill="none" stroke="#FFC93C" stroke-width="4.4" stroke-linecap="round"/>` +
        `<path d="${d}" fill="none" stroke="#2EC4B6" stroke-width="1.8" stroke-linecap="round"/>`;
    };
    PC.arte.registrarMedalhao('rimas', {
      fundo: ['#E3F1FF', '#B9E59A', '#94D373'],
      cena(p) {
        const br = PC.arte.pecasMedalhao ? PC.arte.pecasMedalhao.brilho : () => '';
        if (p && p.modo === 'intruso') {
          return laco(20, 56, 80, 56, 30) +
            cartao(20, 66, 25, sol, -6) + cartao(80, 66, 25, anzol, 6) + cartao(50, 52, 25, uva, 0) +
            `<path d="M50 30 v -5 M42 33 l -3 -4 M58 33 l 3 -4" stroke="${T}" stroke-width="2.4" stroke-linecap="round"/>` + br(86, 22, 4.5, '#fff');
        }
        return laco(30, 52, 70, 52, 26) + cartao(28, 64, 30, sol, -6) + cartao(72, 64, 30, anzol, 6) + br(50, 22, 5, '#FFE14D') + br(18, 28, 3.5, '#fff');
      },
    });
  }
})();
