/* Pipoca Aprende — atividade "montar" (PROJETO.md 5.8 e 5.12): montar a palavra com as sílabas.
   A figura da palavra fica no alto (cartão branco; tocar nela: a Pipoca diz a palavra) e, abaixo dela, um espaço
   vazio por sílaba. As sílabas vêm em FOLHINHAS verdes soltas no chão, embaralhadas, mais `despiste` sílabas que não
   estão na palavra (nunca iguais nem com o mesmo som de uma sílaba dela).
   - Tocar numa folhinha: a Pipoca fala a sílaba ("bá…").
   - Arrastar até um espaço vazio: se for a sílaba daquele espaço, encaixa (ctx.avancou) e a Pipoca fala a sílaba;
     senão a folhinha volta para o chão e a moldura dá o retorno ("Essa é bá. Aqui vai pá."). Soltar longe de um
     espaço vazio só devolve a folhinha (não é erro). Os espaços se preenchem em qualquer ordem; sílabas repetidas
     (BA-NA-NA) servem em qualquer espaço com a mesma sílaba.
   - Completa: a Pipoca lê pelas sílabas e inteira ("Bá… na… na… Banana!"), acendendo cada folhinha; depois acertou().
   Ajuda (nível 2): o espaço que falta brilha ("Aqui vai pá.") e a folhinha certa pulsa ("pá…") até o próximo toque.
   Demonstração (1ª rodada com demo): a mãozinha leva uma cópia clarinha da folhinha da primeira sílaba até o primeiro
   espaço ("Olhe! Bá vai aqui.") e a Pipoca lembra que dá para ouvir as folhinhas.
   Testes no navegador: estado() descreve a rodada; PC.debug.telaOcupada fica verdadeiro durante a entrada, a
   demonstração, a ajuda e a leitura final.
   params: { silabas: [min, max], despiste, bichos, rodadas, demo, palavra (id fixo, só testes) } */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;
  const T = '#3A2A5A';

  // ---------------------------------------------------------------- medidas (palco virtual 1600×900)
  const CENTRO_X = 900;                 // eixo da figura e dos espaços (um pouco à direita: o balão fica à esquerda)
  const FIG_L = 210, FIG_Y = 150;       // cartão da figura (topo em FIG_Y)
  const ESP_L = 176, ESP_A = 160, ESP_GAP = 22, ESP_Y = 482;   // espaços (centro em ESP_Y)
  const FOLHA_L = 176, FOLHA_A = 160;   // área de toque da folhinha (o desenho tem 170×130)
  const CHAO_Y = 712;                   // centro das folhinhas no chão
  const ESPACO_FOLHAS = 186;            // distância mínima entre os centros das folhinhas numa fileira
  const memorias = new WeakMap();       // por estação jogada (o objeto params é o mesmo em todas as rodadas)

  const CSS = `
    .pc-montar { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
    .pc-montar-figura { position: absolute; width: ${FIG_L}px; height: ${FIG_L}px; box-sizing: border-box; padding: 12px;
      border-radius: 34px; background: #fff; border: 6px solid ${T}; box-shadow: 0 8px 0 rgba(58, 42, 90, .22);
      cursor: pointer; touch-action: manipulation; }
    .pc-montar-figura svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .pc-montar-espaco { position: absolute; width: ${ESP_L}px; height: ${ESP_A}px; box-sizing: border-box; border-radius: 34px;
      border: 6px dashed rgba(58, 42, 90, .72); background: rgba(255, 248, 230, .82); transition: transform .12s, background-color .12s; }
    .pc-montar-espaco.ima { background: #FFF1A8; border-style: solid; border-color: ${T}; transform: scale(1.07); }
    .pc-montar-espaco.cheio { border-style: solid; border-color: rgba(58, 42, 90, .28); background: rgba(255, 248, 230, .5); }
    .pc-montar-espaco.brilha { animation: pcMontarBrilha .8s ease-in-out 4; }
    @keyframes pcMontarBrilha { 50% { transform: scale(1.1); background: #FFE36E; border-color: ${T}; } }
    .pc-montar-folha { position: absolute; width: ${FOLHA_L}px; height: ${FOLHA_A}px; cursor: grab; touch-action: none; }
    .pc-montar-folha.arrastando { z-index: 30; cursor: grabbing; }
    .pc-montar-folha.voando { z-index: 25; }
    .pc-montar-folha-gira { position: absolute; left: 0; top: 0; width: 100%; height: 100%; transform: rotate(var(--giro, 0deg)); transition: transform .14s; }
    .pc-montar-folha.arrastando .pc-montar-folha-gira { transform: rotate(0deg) scale(1.1); }
    .pc-montar-folha.colocada .pc-montar-folha-gira { transform: rotate(0deg); }
    .pc-montar-folha-desenho { position: absolute; left: 3px; top: 15px; width: 170px; height: 130px; }
    .pc-montar-folha-desenho svg { position: absolute; left: 0; top: 0; width: 170px; height: 130px; overflow: visible; }
    .pc-montar-silaba { position: absolute; left: 10px; right: 0; top: 63px; transform: translateY(-50%); padding-top: .07em;
      text-align: center; font-family: var(--fonte); font-weight: 700; line-height: 1; color: ${T}; white-space: nowrap;
      text-shadow: 0 2px 0 rgba(255, 255, 255, .55); pointer-events: none; }
    .pc-montar-folha.pulsa .pc-montar-folha-desenho { animation: pcMontarPulsa .9s ease-in-out infinite; }
    @keyframes pcMontarPulsa { 50% { transform: scale(1.15); } }
    .pc-montar-folha.demo { pointer-events: none; opacity: 0; z-index: 26; }
    .pc-montar-folha.demo .pc-montar-folha-desenho { opacity: .78; }
  `;

  // ---------------------------------------------------------------- utilidades
  const inteiro = (v, padrao) => { const n = Math.round(Number(v)); return isFinite(n) ? n : padrao; };
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);
  const fala = s => PC.palavras.falaSilaba(s);
  const semAcento = s => PC.palavras.semAcento(String(s)).toUpperCase();

  let regua = null;
  /** Largura do texto em Fredoka 700 com 1 px de fonte. */
  function larguraEm(texto) {
    try {
      if (!regua) regua = document.createElement('canvas').getContext('2d');
      regua.font = '700 100px Fredoka';
      const l = regua.measureText(String(texto)).width / 100;
      if (l > 0.2) return l;
    } catch (e) { /* segue com a estimativa */ }
    return String(texto).length * 0.66;
  }

  // ---------------------------------------------------------------- sorteios
  function memoriaDe(params) {
    let m = memorias.get(params);
    if (!m) { m = { usadas: [] }; memorias.set(params, m); }
    return m;
  }

  /** A palavra da rodada: do banco (PC.palavras), sem repetir na mesma estação; prefere as que já têm desenho. */
  function sortearPalavra(params) {
    if (params.palavra && PC.palavras.obter(params.palavra)) return PC.palavras.obter(params.palavra);
    const sil = Array.isArray(params.silabas) ? params.silabas : [2, 2];
    const min = U.limitar(inteiro(sil[0], 2), 1, 6), max = U.limitar(inteiro(sil[1], min), min, 6);
    const filtro = { silabas: [min, max] };
    if (params.bichos === true) filtro.bichos = true;
    let lista = PC.palavras.filtrar(Object.assign({ comFigura: true }, filtro));
    if (lista.length < 4) lista = PC.palavras.filtrar(filtro);
    if (!lista.length) lista = PC.palavras.filtrar({ silabas: [2, 3] });
    const mem = memoriaDe(params);
    let livres = lista.filter(p => mem.usadas.indexOf(p.id) < 0);
    if (!livres.length) { mem.usadas = []; livres = lista; }
    const p = U.escolher(livres);
    mem.usadas.push(p.id);
    return p;
  }

  let todasSilabas = null;
  /** Sílabas que não estão na palavra (nem com o mesmo som): de preferência parecidas (mesma consoante ou vogal). */
  function sortearDespiste(palavra, qtd) {
    if (qtd <= 0) return [];
    if (!todasSilabas) {
      todasSilabas = [];
      PC.palavras.lista.forEach(p => p.silabas.forEach(s => { if (todasSilabas.indexOf(s) < 0) todasSilabas.push(s); }));
    }
    const proibidas = palavra.silabas.map(semAcento), sons = palavra.silabas.map(fala);
    const iniciais = palavra.silabas.map(s => semAcento(s).charAt(0));
    const vogal = s => { const m = semAcento(s).match(/[AEIOU](?=[^AEIOU]*$)/); return m ? m[0] : ''; };
    const vogais = palavra.silabas.map(vogal);
    const candidatas = todasSilabas.filter(s => proibidas.indexOf(semAcento(s)) < 0 && sons.indexOf(fala(s)) < 0 && s.length <= 3);
    const parecidas = candidatas.filter(s => iniciais.indexOf(semAcento(s).charAt(0)) >= 0 || vogais.indexOf(vogal(s)) >= 0);
    const r = [];
    const pegar = lista => {
      for (const s of U.embaralhar(lista)) {
        if (r.length >= qtd) return;
        if (r.some(o => semAcento(o) === semAcento(s) || fala(o) === fala(s))) continue;
        r.push(s);
      }
    };
    pegar(parecidas);
    pegar(candidatas);
    return r;
  }

  /** Embaralha as folhinhas sem deixar as sílabas da palavra na ordem certa da esquerda para a direita. */
  function embaralharFolhas(silabasPalavra, despiste) {
    const todas = silabasPalavra.map((s, i) => ({ silaba: s, daPalavra: true, ordem: i })).concat(despiste.map(s => ({ silaba: s, daPalavra: false, ordem: -1 })));
    let melhor = todas;
    for (let t = 0; t < 40; t++) {
      const c = U.embaralhar(todas);
      melhor = c;
      const seq = c.filter(f => f.daPalavra).map(f => f.silaba).join('-');
      if (silabasPalavra.length < 2 || seq !== silabasPalavra.join('-')) break;
    }
    return melhor;
  }

  // ---------------------------------------------------------------- desenhos (SVG próprios, contorno #3A2A5A, sem filtros)
  /** Folhinha verde (viewBox 0 0 170 130): cabinho à esquerda, ponta à direita, veios só nas pontas (a sílaba fica limpa). */
  function svgFolha() {
    return `<svg viewBox="0 0 170 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="90" cy="121" rx="64" ry="8" fill="${T}" opacity=".14"/>
      <path d="M18 80 Q 8 92 5 110" fill="none" stroke="${T}" stroke-width="10" stroke-linecap="round"/>
      <path d="M18 80 Q 8 92 5 110" fill="none" stroke="#5BA83A" stroke-width="4" stroke-linecap="round"/>
      <path d="M12 74 C 16 16, 118 -4, 167 30 C 152 106, 60 130, 12 74 Z" fill="#8DD763" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M20 73 Q 28 71 34 70 M23 69 Q 25 60 30 54 M24 78 Q 28 86 34 90" fill="none" stroke="#5BA83A" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M144 40 Q 152 37 160 34 M148 38 Q 149 28 153 22 M147 44 Q 150 54 152 60" fill="none" stroke="#5BA83A" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M36 40 Q 56 18 92 13" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".45"/>
    </svg>`;
  }

  // ---------------------------------------------------------------- a rodada
  function rodada(ctx) {
    U.estilo('montar', CSS);
    const params = ctx.params || {};
    const palavra = sortearPalavra(params);
    const nomeP = PC.palavras.nome(palavra);
    const qtdDespiste = U.limitar(inteiro(params.despiste, 0), 0, 4);
    const despiste = sortearDespiste(palavra, qtdDespiste);
    const ordem = embaralharFolhas(palavra.silabas, despiste);

    let destruido = false, resolvida = false, interagiu = false;
    let fase = 'entrando';           // entrando | jogando | lendo | fim
    let erros = 0, ultimoErrado = -1;
    let demoAC = null, ajudaAC = null, ajudando = false;
    const desligares = [], timers = [];

    // ------------------------------------------------------------ cena
    const raiz = U.el('div', { class: 'pc-montar' });
    ctx.palco.appendChild(raiz);

    const figura = U.el('div', {
      class: 'pc-montar-figura', teste: 'figura', role: 'button', 'aria-label': maiuscula(nomeP),
      style: { left: (CENTRO_X - FIG_L / 2) + 'px', top: FIG_Y + 'px' }, html: PC.palavras.desenho(palavra),
    });
    raiz.appendChild(figura);

    // espaços
    const k = palavra.silabas.length;
    const larguraEsp = k * ESP_L + (k - 1) * ESP_GAP;
    const espacos = palavra.silabas.map((s, i) => {
      const x = CENTRO_X - larguraEsp / 2 + ESP_L / 2 + i * (ESP_L + ESP_GAP), y = ESP_Y;
      const el = U.el('div', { class: 'pc-montar-espaco', teste: 'espaco-' + i, 'aria-label': 'Espaço ' + (i + 1),
        style: { left: (x - ESP_L / 2) + 'px', top: (y - ESP_A / 2) + 'px' } });
      raiz.appendChild(el);
      return { i, silaba: s, x, y, el, folha: null };
    });

    // folhinhas no chão
    const n = ordem.length;
    const xMin = PC.layout.cantoPipoca.l + FOLHA_L / 2 + 6;              // longe da Pipoca
    const xMax = 1600 - PC.layout.margemLateral - FOLHA_L / 2;           // longe da borda direita (gesto voltar)
    const porFila = n * ESPACO_FOLHAS - ESPACO_FOLHAS <= xMax - xMin ? n : Math.ceil(n / 2);
    const filas = Math.ceil(n / porFila);
    const casas = [];
    for (let f = 0; f < filas; f++) {
      const naFila = Math.min(porFila, n - f * porFila);
      const passo = naFila > 1 ? Math.min(230, (xMax - xMin) / (naFila - 1)) : 0;
      const cx = (xMin + xMax) / 2;
      for (let j = 0; j < naFila; j++) {
        const desvio = filas > 1 ? (f === 0 ? -64 : 66) : ((j % 2) ? 20 : -12);
        const x = Math.round(U.limitar(cx + (j - (naFila - 1) / 2) * passo + U.aleatorio(-8, 8), xMin, xMax));
        const y = Math.round(CHAO_Y + desvio + U.aleatorio(-5, 5));
        casas.push({ x, y });
      }
    }
    const fonteDe = s => Math.round(Math.min(64, 102 / larguraEm(s)));

    function criarVisual(silaba, giro) {
      const gira = U.el('div', { class: 'pc-montar-folha-gira' });
      gira.style.setProperty('--giro', giro + 'deg');
      const des = U.el('div', { class: 'pc-montar-folha-desenho', html: svgFolha() });
      des.appendChild(U.el('span', { class: 'pc-montar-silaba', text: silaba, style: { fontSize: fonteDe(silaba) + 'px' } }));
      gira.appendChild(des);
      return gira;
    }

    const folhas = ordem.map((o, i) => {
      const casa = casas[i];
      const giro = U.aleatorio(-9, 9);
      const el = U.el('div', {
        class: 'pc-montar-folha', teste: 'folha-' + i, role: 'button', 'aria-label': 'Folhinha ' + o.silaba,
        dataset: { silaba: o.silaba }, style: { left: (casa.x - FOLHA_L / 2) + 'px', top: (casa.y - FOLHA_A / 2) + 'px' },
      }, criarVisual(o.silaba, giro));
      raiz.appendChild(el);
      const f = { i, silaba: o.silaba, daPalavra: o.daPalavra, casa, el, espaco: null, arr: null };
      desligares.push(PC.arrastar(el, {
        podeComecar: () => podeAgir(),
        aoTocar: () => tocarFolha(f),
        aoComecar: () => comecarArraste(f),
        aoMover: p => moverArraste(f, p),
        aoSoltar: p => soltarArraste(f, p),
        aoCancelar: () => cancelarArraste(f),
      }));
      return f;
    });

    // entrada: a figura aparece, os espaços surgem e as folhinhas caem no chão
    U.animar(figura, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, delay: 60, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' });
    espacos.forEach((e, i) => U.animar(e.el, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 320, delay: 260 + i * 90, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' }));
    folhas.forEach((f, i) => U.animar(f.el, [
      { transform: 'translateY(-120px) rotate(-14deg)', opacity: 0 },
      { transform: 'translateY(10px) rotate(4deg)', opacity: 1, offset: 0.7 },
      { transform: 'translateY(0px) rotate(0deg)', opacity: 1 },
    ], { duration: 560, delay: 380 + i * 110, easing: 'ease-out', fill: 'backwards' }));

    // ------------------------------------------------------------ estado e utilidades da rodada
    const podeAgir = () => !destruido && !resolvida && !ctx.sinal.aborted && fase === 'jogando';
    const vazios = () => espacos.filter(e => !e.folha);
    const livres = () => folhas.filter(f => !f.espaco);
    const centroCasa = f => ({ x: f.casa.x, y: f.casa.y });
    /** Uma folhinha no chão com a sílaba do espaço (qualquer uma serve: BA-NA-NA tem duas "NA"). */
    const folhaPara = esp => livres().find(f => f.silaba === esp.silaba) || null;

    function pulsar(el, escala) {
      return U.animar(el, [{ transform: 'scale(1)' }, { transform: `scale(${escala || 1.18})`, offset: 0.4 }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' });
    }
    const desenhoDe = f => f.el.querySelector('.pc-montar-folha-desenho');

    /** Leva a folhinha (de onde ela está agora: "de") até o ponto (centro) "para", num arquinho. Nunca rejeita. */
    function voar(f, de, para, { ms = 320, arco = 0 } = {}) {
      f.el.getAnimations().forEach(a => a.cancel());
      f.el.style.left = (para.x - FOLHA_L / 2) + 'px';
      f.el.style.top = (para.y - FOLHA_A / 2) + 'px';
      f.el.style.transform = '';
      const dx = de.x - para.x, dy = de.y - para.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return Promise.resolve();
      const q = [];
      for (let i = 0; i <= 6; i++) {
        const s = i / 6;
        q.push({ transform: `translate(${(dx * (1 - s)).toFixed(1)}px, ${(dy * (1 - s) - arco * 4 * s * (1 - s)).toFixed(1)}px)` });
      }
      f.el.classList.add('voando');
      return U.animar(f.el, q, { duration: ms, easing: 'ease-out' }).then(() => { f.el.classList.remove('voando'); });
    }

    // ------------------------------------------------------------ falas
    const textoInstrucao = () => `Vamos montar ${nomeP}! Arraste as folhinhas para os espaços.`;
    function instrucao() {
      if (destruido || resolvida || ctx.sinal.aborted || fase !== 'jogando') return Promise.resolve();
      if (ajudando || demoAC) return Promise.resolve();          // a ajuda ou a demonstração está falando
      pulsar(figura, 1.08);
      return ctx.falar(textoInstrucao()).catch(() => {});
    }
    /** A Pipoca fala a sílaba sozinha ("bá…"); a mesma fala serve no toque, no encaixe e na leitura final. */
    const falarSilaba = s => ctx.falar(maiuscula(fala(s)) + '…');

    // ------------------------------------------------------------ toque e arraste
    function tocarFolha(f) {
      if (destruido || resolvida || ctx.sinal.aborted) return;
      if (fase !== 'jogando') return;
      interagiu = true;
      pararDemo();
      pulsar(desenhoDe(f));
      falarSilaba(f.silaba).catch(() => {});
    }

    PC.aoTocar(figura, () => {
      if (!podeAgir()) return;
      interagiu = true;
      pararDemo();
      pulsar(figura, 1.08);
      ctx.falar(maiuscula(nomeP) + '!').catch(() => {});
    }, { som: false });

    /** O espaço vazio mais perto do centro da folhinha arrastada (se estiver perto o bastante). */
    function espacoSob(pt) {
      let melhor = null, dist = Infinity;
      for (const e of espacos) {
        if (e.folha) continue;
        const d = Math.hypot(e.x - pt.x, e.y - pt.y);
        if (d < dist) { dist = d; melhor = e; }
      }
      return melhor && dist < 135 ? melhor : null;
    }
    let ima = null;
    function marcarIma(e) {
      if (ima === e) return;
      if (ima) ima.el.classList.remove('ima');
      ima = e;
      if (ima) ima.el.classList.add('ima');
    }

    function comecarArraste(f) {
      if (!podeAgir() || f.espaco) { f.arr = null; return; }
      interagiu = true;
      pararDemo();
      pararAjuda();
      f.el.getAnimations().forEach(a => a.cancel());
      f.el.classList.remove('pulsa');
      f.arr = { dx: 0, dy: 0 };
      f.el.classList.add('arrastando');
      f.el.style.willChange = 'transform';
      PC.som.pegar();
    }
    function moverArraste(f, p) {
      if (!f.arr) return;
      f.arr.dx = p.dx; f.arr.dy = p.dy;
      f.el.style.transform = `translate(${p.dx}px, ${p.dy}px)`;
      marcarIma(espacoSob({ x: f.casa.x + p.dx, y: f.casa.y + p.dy }));
    }
    function encerrarArraste(f) {
      f.arr = null;
      marcarIma(null);
      f.el.classList.remove('arrastando');
      f.el.style.willChange = '';
    }
    function soltarArraste(f, p) {
      if (!f.arr) return;
      const de = { x: f.casa.x + p.dx, y: f.casa.y + p.dy };
      encerrarArraste(f);
      const esp = podeAgir() ? espacoSob(de) : null;
      if (!esp) {
        // soltou longe de um espaço vazio: volta para o chão, sem ser erro
        if (podeAgir()) PC.som.soltar();
        voar(f, de, centroCasa(f));
        return;
      }
      if (esp.silaba === f.silaba) encaixar(f, esp, de);
      else errar(f, esp, de);
    }
    function cancelarArraste(f) {
      if (!f.arr) return;
      const de = { x: f.casa.x + f.arr.dx, y: f.casa.y + f.arr.dy };
      encerrarArraste(f);
      if (destruido) return;
      if (resolvida || ctx.sinal.aborted) { f.el.style.transform = ''; return; }
      voar(f, de, centroCasa(f));
    }

    // ------------------------------------------------------------ certo e errado
    function colocar(f, esp) {
      f.espaco = esp;
      esp.folha = f;
      f.el.classList.add('colocada');
      f.el.classList.remove('pulsa');
      esp.el.classList.add('cheio');
      esp.el.classList.remove('brilha');
    }

    function encaixar(f, esp, de) {
      colocar(f, esp);
      ctx.avancou();
      PC.som.encaixar();
      voar(f, de, { x: esp.x, y: esp.y }, { ms: 220 }).then(() => { if (!destruido) pulsar(desenhoDe(f), 1.12); });
      if (vazios().length) {
        falarSilaba(f.silaba).catch(() => {});
        return;
      }
      completar();
    }

    function errar(f, esp, de) {
      erros++;
      ultimoErrado = esp.i;
      voar(f, de, centroCasa(f), { ms: 420, arco: 40 });
      ctx.errou({ fala: `Essa é ${fala(f.silaba)}. Aqui vai ${fala(esp.silaba)}.` });
    }

    /** Palavra completa: a Pipoca lê pelas sílabas, acendendo cada folhinha, e depois inteira. */
    async function completar() {
      fase = 'lendo';
      ctx.ocupado(true);
      pararAjuda();
      PC.ui.pipoca.calar();
      try {
        await ctx.esperar(380);
        PC.ui.pipoca.pose('aponta');
        for (const e of espacos) {
          if (!e.folha) continue;
          pulsar(desenhoDe(e.folha), 1.2);
          await falarSilaba(e.silaba);
        }
        espacos.forEach((e, i) => { if (e.folha) timers.push(setTimeout(() => { if (!destruido) pulsar(desenhoDe(e.folha), 1.12); }, U.duracao(i * 90))); });
        pulsar(figura, 1.1);
        PC.ui.pipoca.pose('feliz');
        await ctx.falar(maiuscula(nomeP) + '!');
        await ctx.esperar(200);
        if (destruido || ctx.sinal.aborted) return;
        resolvida = true;
        fase = 'fim';
        ctx.acertou();
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    }

    // ------------------------------------------------------------ demonstração e ajuda
    /** O gesto certo agora: levar uma folhinha certa até o primeiro espaço vazio que tem folhinha no chão. */
    function proximoGesto() {
      if (!podeAgir()) return null;
      for (const e of espacos) {
        if (e.folha) continue;
        const f = folhaPara(e);
        if (f) return { tipo: 'arrastar', de: centroCasa(f), para: { x: e.x, y: e.y } };
      }
      return null;
    }

    function pararDemo() { if (demoAC) demoAC.abort(); }
    function pararAjuda() {
      if (ajudaAC) ajudaAC.abort();
      folhas.forEach(f => f.el.classList.remove('pulsa'));
      espacos.forEach(e => e.el.classList.remove('brilha'));
    }

    /**
     * Demonstração (1ª rodada com demo): a mãozinha leva uma cópia clarinha da folhinha da primeira sílaba até o
     * primeiro espaço, uma vez ("Olhe! Bá vai aqui."). Qualquer toque da criança encerra.
     */
    async function demonstrar() {
      if (interagiu || !podeAgir()) return;
      const esp = espacos[0], f = folhaPara(esp);
      if (!f) return;
      const ac = new AbortController();
      demoAC = ac;
      let copia = null, mao = null;
      ctx.ocupado(true);
      try {
        const de = centroCasa(f), para = { x: esp.x, y: esp.y };
        copia = U.el('div', { class: 'pc-montar-folha demo', 'aria-hidden': 'true', style: { left: (-FOLHA_L / 2) + 'px', top: (-FOLHA_A / 2) + 'px' } },
          criarVisual(f.silaba, 0));
        raiz.appendChild(copia);
        mao = ctx.dica(de, para, { vezes: 1 });
        // os mesmos tempos e a mesma curva da mãozinha (PC.ui.dica): a cópia anda junto com ela
        const quadro = (pt, opacidade, offset) => ({ transform: `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px)`, opacity: opacidade, offset });
        const anda = U.animar(copia, [quadro(de, 0, 0), quadro(de, 0, 0.16), quadro(de, 1, 0.22), quadro(para, 1, 0.78),
          quadro(para, 1, 0.88), quadro(para, 0, 1)], { duration: 1900, easing: 'ease-in-out', fill: 'forwards' });
        const falaDemo = U.esperar(700, ac.signal).then(() => ctx.falar(`Olhe! ${maiuscula(fala(f.silaba))} vai aqui.`));
        const interrompida = new Promise((ok, falha) => ac.signal.addEventListener('abort', () => falha(U.abortado()), { once: true }));
        interrompida.catch(() => {});
        falaDemo.catch(() => {});
        await Promise.race([Promise.all([anda, falaDemo]), interrompida]);
        copia.remove(); copia = null;
        if (ac.signal.aborted || interagiu) return;
        await ctx.falar('Toque numa folhinha para ouvir.');
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        if (copia) copia.remove();
        if (ac.signal.aborted && mao && mao.parar) mao.parar();
        if (demoAC === ac) demoAC = null;
        if (!destruido && !ctx.sinal.aborted && fase === 'jogando' && !ajudando) ctx.ocupado(false);
      }
    }

    /** Ajuda que ensina (2º erro seguido): o espaço que falta brilha ("Aqui vai pá.") e a folhinha certa pulsa ("pá…"). */
    async function ajudar(nivel) {
      if (nivel >= 3 || !podeAgir() || ajudando) return;
      if (PC.arrastar.ativo()) return;                 // a criança já está levando uma folhinha: não atrapalha
      let esp = ultimoErrado >= 0 && !espacos[ultimoErrado].folha ? espacos[ultimoErrado] : null;
      if (!esp || !folhaPara(esp)) esp = vazios().find(e => folhaPara(e)) || null;
      if (!esp) return;
      const f = folhaPara(esp);
      pararDemo();
      pararAjuda();
      const ac = new AbortController();
      const aoAbortar = () => ac.abort();
      ctx.sinal.addEventListener('abort', aoAbortar, { once: true });
      ajudaAC = ac; ajudando = true;
      ctx.ocupado(true);
      try {
        PC.ui.pipoca.pose('aponta');
        esp.el.classList.add('brilha');
        await ctx.esperar(0);
        if (ac.signal.aborted) return;
        await ctx.falar(`Aqui vai ${fala(esp.silaba)}.`);
        if (ac.signal.aborted || !podeAgir()) return;
        f.el.classList.add('pulsa');                   // continua pulsando até a criança tocar
        await ctx.falar(maiuscula(fala(esp.silaba)) + '…');
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ctx.sinal.removeEventListener('abort', aoAbortar);
        if (ajudaAC === ac) ajudaAC = null;
        ajudando = false;
        if (!destruido && !ctx.sinal.aborted) {
          esp.el.classList.remove('brilha');
          if (fase === 'jogando') { PC.ui.pipoca.pose('normal'); ctx.ocupado(false); }
        }
      }
    }

    // qualquer toque da criança encerra a demonstração e apaga o brilho da ajuda (a folhinha certa para de pulsar)
    const offToque = PC.on('toque', () => {
      interagiu = true;
      pararDemo();
      if (ajudaAC) ajudaAC.abort();
      folhas.forEach(f => f.el.classList.remove('pulsa'));
    });
    // "Quer parar?": a demonstração e a ajuda param (a moldura já cancela o arraste: a folhinha volta ao chão)
    const offPausa = PC.on('atividade:pausa', () => { if (!destruido) { pararDemo(); if (ajudaAC) ajudaAC.abort(); } });

    // testes no navegador: {"esperar": "ocioso"} também espera a entrada, a demonstração, a ajuda e a leitura final
    let ocupadaDbg = null;
    if (!PC.modoApp && PC.debug) {
      ocupadaDbg = () => !destruido && !resolvida && !ctx.sinal.aborted && (fase !== 'jogando' || ajudando || !!demoAC);
      PC.debug.telaOcupada = ocupadaDbg;
    }

    // ------------------------------------------------------------ controle (moldura e testes)
    /** Testes: põe todas as folhinhas certas nos espaços na hora e termina a rodada (um único ctx.acertou()). */
    function resolver() {
      if (destruido || resolvida) return;
      resolvida = true;
      fase = 'fim';
      pararDemo();
      pararAjuda();
      try {
        PC.arrastar.cancelarTodos();
        marcarIma(null);
        espacos.forEach(e => {
          if (e.folha) return;
          const f = folhaPara(e);
          if (!f) return;
          colocar(f, e);
          f.el.getAnimations().forEach(a => a.cancel());
          f.el.style.transform = '';
          f.el.style.left = (e.x - FOLHA_L / 2) + 'px';
          f.el.style.top = (e.y - FOLHA_A / 2) + 'px';
        });
      } catch (e) { console.error(e); }
      ctx.acertou();
    }

    function estado() {
      return {
        fase, palavra: palavra.texto, silabas: palavra.silabas.slice(), despiste: despiste.slice(), erros,
        folhas: folhas.map(f => ({ silaba: f.silaba, daPalavra: f.daPalavra, espaco: f.espaco ? f.espaco.i : -1 })),
        espacos: espacos.map(e => (e.folha ? e.folha.silaba : '')),
        ajudando, demo: !!demoAC,
      };
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      pararDemo();
      if (ajudaAC) ajudaAC.abort();
      offToque(); offPausa();
      timers.forEach(t => clearTimeout(t));
      if (ocupadaDbg && PC.debug && PC.debug.telaOcupada === ocupadaDbg) PC.debug.telaOcupada = null;
      desligares.forEach(d => { try { d(); } catch (e) { console.error(e); } });
      raiz.remove();
    }

    // início: entrada, instrução e, na 1ª rodada com demo, a mãozinha mostra a primeira sílaba
    (async () => {
      try {
        ctx.ocupado(true);
        await ctx.esperar(380 + n * 110 + 300);
        fase = 'jogando';
        ctx.ocupado(false);
        await instrucao();
        if (ctx.demo) await demonstrar();
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    })();

    return { instrucao, proximoGesto, ajudar, resolver, estado, destruir };
  }

  PC.atividades.registrar('montar', {
    titulo: 'Montar a palavra',
    icone: 'montar',
    cenario: 'lagoa',
    totalRodadas: params => U.limitar(inteiro(params && params.rodadas, 3), 1, 10),
    rodada,
  });

  // ---------------------------------------------------------------- medalhão do mapa
  // A figura no cartão, os espaços da palavra (um já com a folhinha "BO") e a folhinha "LA" no chão; com três
  // sílabas, três espaços; com despiste, uma folhinha a mais no chão.
  if (PC.arte && PC.arte.registrarMedalhao) {
    PC.arte.registrarMedalhao('montar', {
      fundo: ['#E2F5FF', '#B9E59A', '#94D373'],
      cena(p) {
        const { T: C, FONTE, brilho } = PC.arte.pecasMedalhao;
        const tres = Array.isArray(p.silabas) && Number(p.silabas[1]) >= 3;
        const folha = (cx, cy, e, txt, giro) => `<g transform="translate(${cx} ${cy}) rotate(${giro}) scale(${e})">` +
          `<path d="M-14 4 Q -18 8 -19 13" fill="none" stroke="${C}" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="M-16 3 C -13 -11, 10 -15, 17 -7 C 13 8, -3 13, -16 3 Z" fill="#8DD763" stroke="${C}" stroke-width="2.2" stroke-linejoin="round"/>` +
          `<text x="0" y="4.5" text-anchor="middle" font-size="11" ${FONTE} fill="${C}">${txt}</text></g>`;
        const espaco = (cx, cy, l) => `<rect x="${cx - l / 2}" y="${cy - 9}" width="${l}" height="18" rx="5" fill="#FFF8E6" stroke="${C}" stroke-width="1.8" stroke-dasharray="3 2.4"/>`;
        // cartão com a figura: bola (BO-LA) ou, com três sílabas, banana (BA-NA-NA: sílaba repetida)
        let s = `<rect x="35" y="9" width="30" height="30" rx="7" fill="#fff" stroke="${C}" stroke-width="2.4"/>`;
        if (tres) {
          s += `<path d="M41 17 Q 40 33 58 33 Q 62 32 60 30 Q 47 29 46 16 Q 44 14 41 17 Z" fill="#FFE14D" stroke="${C}" stroke-width="2" stroke-linejoin="round"/>` +
            `<path d="M42 16 L 43 13" stroke="${C}" stroke-width="2.4" stroke-linecap="round"/>`;
        } else {
          s += `<circle cx="50" cy="24" r="10" fill="#FF7A6B" stroke="${C}" stroke-width="2"/>` +
            `<path d="M41 22 Q 50 27 59 22 M50 14 Q 46 24 50 34" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
        }
        const xs = tres ? [27, 50, 73] : [37, 63], l = tres ? 21 : 24;
        const sil = tres ? ['BA', 'NA', 'NA'] : ['BO', 'LA'];
        xs.forEach(x => { s += espaco(x, 53, l); });
        s += folha(xs[0] + 1, 53, tres ? 0.62 : 0.7, sil[0], 0);
        s += folha(tres ? 54 : 62, 84, 0.78, sil[1], -8);
        if (tres) s += folha(28, 84, 0.72, sil[2], 6);
        if (Number(p.despiste) > 0) s += folha(tres ? 80 : 34, 82, 0.72, 'PA', 9);
        return s + brilho(84, 17, 4.2, '#FFC93C');
      },
    });
  }
})();
