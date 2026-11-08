/* Pipoca Aprende — atividade "torre" (PROJETO.md 5.1): produzir N com cubinhos de encaixe.
   Cena: balde de cubinhos à esquerda (fonte infinita), a base no chão (x ≈ 850) onde a torre cresce, a placa do alvo à
   direita (algarismo; pontinhos só com params.pontos) e, com confirmar, o botão Pronto.
   Pôr: arrastar um cubinho do balde até a torre OU tocar no balde (um cubinho voa por vez; toques extras são ignorados
   enquanto ele voa). Tirar: arrastar o cubinho de cima para fora OU tocar na torre (tira o de cima). Soltar fora do
   lugar devolve o cubinho ao balde, sem contar como erro. A torre inteira é a área de toque (nunca um cubinho isolado).
   Cores: padrão de 5 em 5 do PC.Torre. O número da torre só aparece na plaquinha presa na base, e só depois que a
   Pipoca contou (ou sempre, com vozTotal): quem conta é a criança.
   Instrução: "Monte uma torre de cinco cubinhos!" com o número no balão (pontinhos só com params.pontos, como a placa).
   demo (1ª rodada): depois da instrução, a mãozinha leva um cubinho de mentirinha do balde até a torre (ou a dezena
   pronta, com dezenaPronta). A 1ª passada é só para olhar; depois a rodada é liberada e a 2ª passada some no primeiro
   toque (o gesto da criança já vale).
   Ajuda (2º erro seguido): a Pipoca conta a torre em voz alta e diz o que falta ("Faltam dois!", com os lugares
   tracejados) ou o que sobra ("Sobram dois!", com os cubinhos a mais apagados).
   vozTotal: a Pipoca diz o novo total a cada cubinho; sem isso, só o som de encaixe com a nota subindo.
   confirmar false: ao chegar em N a Pipoca conta tudo e a rodada acaba. confirmar true: botão Pronto; a Pipoca conta
   tudo e, se não for N, o retorno é descritivo ("Temos quatro. Precisamos de cinco. Coloque mais um!").
   Ao completar 10: a fitinha aparece e "Dez! Uma dezena!". dezenaPronta (alvo de 11 a 20): ao lado do balde fica uma
   dezena pronta (barra de 10, com fitinha) que entra de uma vez ("Já temos dez! Ponha mais três!"). Acima de 10, a
   contagem acende a dezena inteira ("Dez!") e continua dali.
   modo 'comparar' (estação 18): rodadas "Faça uma torre igual a esta" e "Faça uma torre com um a mais que esta" (com
   uma torre-modelo ao lado e o botão Pronto, a menos que confirmar seja false) e "Qual torre tem mais?" (duas torres
   prontas; tocar na maior ou no botão "Iguais"; pelo menos uma rodada com a mesma quantidade). Na escolha, a opção
   errada sai de jogo e só o primeiro toque vale até o retorno terminar.
   params: { min, max, rodadas, demo, pontos, vozTotal, confirmar, dezenaPronta, modo } */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  // ---------------------------------------------------------------- medidas (px do palco virtual 1600×900)
  const LADO = 64;                                          // cubinho (o mesmo do PC.Torre)
  const MAX = 20;                                           // cubinhos por torre (PC.Torre.MAX)
  const VAO = 20;                                           // vão entre a dezena e as unidades (o mesmo do PC.Torre)
  const BASE_X = 850;                                       // base da torre da criança
  const MODELO_X = 1140;                                    // torre-modelo (modo comparar)
  const DUAS_X = [690, 1040];                               // "Qual torre tem mais?": as duas torres prontas
  const BALDE = { x: 300, y: 588, l: 240, a: 220 };         // desenho do balde
  const BALDE_TOQUE = { x: 296, y: 572, l: 248, a: 250 };   // área de toque do balde (maior que o desenho)
  const BOCA = { x: 420, y: 650 };                          // boca do balde: de onde os cubinhos saem
  const DEZENA_X = 645, DEZENA_LADO = 34;                   // dezena pronta: barrinha de 10 em pé, ao lado do balde
  const DEZENA_TOQUE = { x: 575, y: 420, l: 140, a: 410 };
  const ALVO = { x: 1380, y: 280 };                         // placa do alvo
  const BOTAO = { x: 1395, y: 700 };                        // Pronto (e Iguais)
  const TOPO_TOQUE = 150;                                   // nenhuma área de toque sobe além disso (faixa do HUD)
  const FUNDO_TOQUE = 890;
  const IMA = 130;                                          // ímã: até essa distância (x) do meio da torre o objeto entra
  const VOO_MS = 320;                                       // voo de um cubinho do balde até a torre
  const INTERVALO = 450;                                    // ritmo da contagem em voz alta

  const CSS = `
    .pc-torre { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
    .pc-torre-balde { position: absolute; left: ${BALDE.x}px; top: ${BALDE.y}px; width: ${BALDE.l}px; height: ${BALDE.a}px;
      pointer-events: none; transform-origin: 50% 96%; transition: transform .15s ease-out; }
    .pc-torre-balde svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .pc-torre-balde.fundo { z-index: 4; }
    .pc-torre-balde.frente { z-index: 20; }
    .pc-torre-ima-balde .pc-torre-balde { transform: scale(1.07); }
    .pc-torre-balde.pula { animation: pcTorreBalde .32s ease-out; }
    @keyframes pcTorreBalde { 40% { transform: scale(1.07, .93); } }
    .pc-torre-toque { position: absolute; z-index: 25; border-radius: 40px; cursor: pointer; }
    .pc-torre-base { position: absolute; z-index: 2; height: 24px; border-radius: 12px; border: 5px solid #3A2A5A; pointer-events: none;
      background: linear-gradient(180deg, #E8BA80 0%, #E8BA80 30%, #B98546 31%, #A87638 100%); box-shadow: 0 7px 0 rgba(58, 42, 90, .18); }
    .pc-torre-base.modelo { background: linear-gradient(180deg, #FFB9AE 0%, #FFB9AE 30%, #FF7A6B 31%, #E9604F 100%); }
    .pc-torre-vazio, .pc-torre-fantasma { position: absolute; z-index: 3; width: 64px; height: 64px; border-radius: 12px; pointer-events: none;
      border: 5px dashed #3A2A5A; background: rgba(255, 255, 255, .5); }
    .pc-torre-vazio.acesa { background: rgba(255, 234, 150, .95); border-color: #C98A00; }
    .pc-torre-fantasma.acesa { background: rgba(255, 234, 150, .95); border-color: #C98A00; }
    .pc-torre-ima { position: absolute; z-index: 1; border-radius: 30px; border: 6px dashed #fff; background: rgba(255, 255, 255, .32);
      pointer-events: none; opacity: 0; transition: opacity .15s; }
    .pc-torre-ima.acesa { opacity: 1; }
    .pc-torre-luz { position: absolute; z-index: 1; border-radius: 28px; pointer-events: none; opacity: 0;
      background: rgba(255, 255, 255, .7); border: 7px solid #FFC93C; box-shadow: 0 0 0 4px #3A2A5A; }
    .torre.pc-torre-semplaca .torre-placa { visibility: hidden; }
    .pc-torre-solto { left: 0; top: 0; z-index: 12; pointer-events: none; }
    .pc-torre-arrastado { z-index: 40 !important; pointer-events: none; }   /* na mão, voando ou de mentirinha (demo): nunca rouba o toque */
    .pc-torre-alvo { position: absolute; width: 0; height: 0; z-index: 8; pointer-events: none; }
    .pc-torre-alvo .placa-numero { left: 0; top: 0; transform: translate(-50%, -50%); }
    .pc-torre-botao { position: absolute; z-index: 26; display: flex; align-items: center; justify-content: center; pointer-events: none; }
    .pc-torre-botao .botao-grande { pointer-events: auto; height: 140px; }
    .pc-torre-botao .botao-grande[disabled] { opacity: .5; }
    .pc-torre-dezena { z-index: 6; }
    .torre.pc-torre-fora, .pc-torre-base.pc-torre-fora { opacity: .4; transition: opacity .3s; }
    .pc-torre-vivo .torre.pc-torre-fora, .pc-torre-vivo .pc-torre-base.pc-torre-fora { opacity: 1; }
    .pc-torre-botao .botao-grande.pc-torre-fora { opacity: .35; }
    .cubo.pc-torre-sobra { opacity: .45; }
  `;

  // ---------------------------------------------------------------- utilidades
  const inteiro = (v, padrao) => { const n = Math.round(Number(v)); return isFinite(n) ? n : padrao; };
  const faixa = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const ext = n => PC.voz.extenso(n);
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);
  const cubinhos = n => PC.voz.quantidade(n, 'cubinho', 'cubinhos');
  const corCinco = i => ((i % 10) < 5 ? PC.cores.cincoA : PC.cores.cincoB);
  const largura = n => (n > 10 ? 2 * LADO + VAO : LADO);

  /** Canto de cima à esquerda do cubinho i numa torre com `total` cubinhos e base em (bx, chao): o arranjo do PC.Torre. */
  function lugar(i, total, bx, chao) {
    if (total <= 10) return { x: bx - LADO / 2, y: chao - (i + 1) * LADO };
    const x0 = bx - (2 * LADO + VAO) / 2;
    if (i < 10) return { x: x0, y: chao - (i + 1) * LADO };
    return { x: x0 + LADO + VAO, y: chao - (i - 9) * LADO };
  }

  /** A janela "Quer parar?" da moldura está aberta? (ctx.pausada() da moldura; se faltar, olhamos a tela) */
  function pausado(ctx) {
    if (ctx && typeof ctx.pausada === 'function') return !!ctx.pausada();
    const r = PC.telas && PC.telas.raizAtual && PC.telas.raizAtual();
    return !!(r && r.querySelector('.pc-moldura-pausa'));
  }

  /** Frases de retorno: descritivas e neutras, número no fim. */
  function fraseErro(n, alvo) {
    const d = Math.abs(alvo - n);
    return `Temos ${ext(n)}. Precisamos de ${ext(alvo)}. ` + (n < alvo ? `Coloque mais ${ext(d)}!` : `Tire ${ext(d)}!`);
  }
  /** "Três cubinhos!", "Dez cubinhos! Uma dezena!", "Dez e mais três... treze cubinhos!" */
  function fraseTotal(n) {
    if (n === 10) return 'Dez cubinhos! Uma dezena!';
    if (n === 20) return 'Vinte cubinhos! Duas dezenas!';
    if (n > 10 && n < 20) return `Dez e mais ${ext(n - 10)}... ${cubinhos(n)}!`;
    return maiuscula(cubinhos(n)) + '!';
  }

  // ---------------------------------------------------------------- desenho do balde (SVG próprio; viewBox 0 0 240 220)
  // Duas camadas: o fundo (alça, boca escura e cubinhos lá dentro) fica atrás de tudo; a frente (corpo, faixa e aro)
  // fica na frente dos cubinhos soltos, para que o cubinho que sai ou volta pareça entrar no balde.
  function cuboSvg(x, y, l, cor, ang) {
    const T = PC.estilo.contorno, m = l / 2, p = Math.round(l * 0.42);
    return `<g transform="translate(${x} ${y}) rotate(${ang})">` +
      `<rect x="${-p / 2}" y="${-m - 9}" width="${p}" height="13" rx="5" fill="${U.tom(cor, 0.4)}" stroke="${T}" stroke-width="4"/>` +
      `<rect x="${-m}" y="${-m}" width="${l}" height="${l}" rx="9" fill="${cor}" stroke="${T}" stroke-width="4.5"/>` +
      `<rect x="${-m + 7}" y="${-m + 6}" width="${Math.round(l * 0.3)}" height="7" rx="3.5" fill="#fff" opacity=".6"/></g>`;
  }
  function desenhoBalde(parte) {
    const T = PC.estilo.contorno, A = PC.cores.cincoA, B = PC.cores.cincoB;
    const fundo =
      `<ellipse cx="120" cy="213" rx="106" ry="9" fill="rgba(58,42,90,.2)"/>` +
      `<path d="M26 62 C 32 -4, 208 -4, 214 62" fill="none" stroke="${T}" stroke-width="13" stroke-linecap="round"/>` +
      `<path d="M26 62 C 32 -4, 208 -4, 214 62" fill="none" stroke="#E4DEF2" stroke-width="5" stroke-linecap="round"/>` +
      `<rect x="104" y="12" width="32" height="14" rx="7" fill="#FF9F43" stroke="${T}" stroke-width="4"/>` +
      `<ellipse cx="120" cy="58" rx="106" ry="24" fill="#137369" stroke="${T}" stroke-width="5"/>` +
      cuboSvg(62, 64, 44, A, -16) + cuboSvg(104, 56, 46, B, 6) + cuboSvg(146, 60, 44, A, -6) + cuboSvg(186, 68, 40, B, 16);
    const frente =
      `<path d="M14 58 A 106 24 0 0 0 226 58 L 204 196 Q 201 212 186 212 L 54 212 Q 39 212 36 196 Z" fill="#2EC4B6" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M24.5 122 L 215.5 122 L 211.6 146 L 28.4 146 Z" fill="#FFC93C" stroke="${T}" stroke-width="4" stroke-linejoin="round"/>` +
      `<g fill="#fff" opacity=".75"><circle cx="62" cy="134" r="4.5"/><circle cx="96" cy="134" r="4.5"/><circle cx="130" cy="134" r="4.5"/><circle cx="164" cy="134" r="4.5"/><circle cx="196" cy="134" r="4.5"/></g>` +
      `<path d="M46 92 Q 49 138 57 182" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="M14 58 A 106 24 0 0 0 226 58" fill="none" stroke="${T}" stroke-width="20" stroke-linecap="round"/>` +
      `<path d="M14 58 A 106 24 0 0 0 226 58" fill="none" stroke="#8BE8DE" stroke-width="10" stroke-linecap="round"/>`;
    const corpo = parte === 'fundo' ? fundo : frente;
    return `<svg viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${corpo}</svg>`;
  }

  // ---------------------------------------------------------------- sorteio das rodadas
  const memorias = new WeakMap();   // por estação jogada: o objeto params é o mesmo em todas as rodadas dela
  function memoriaDe(params) {
    let m = memorias.get(params);
    if (!m) { m = { saco: [], ultimo: null, plano: null }; memorias.set(params, m); }
    return m;
  }
  const totalRodadas = params => U.limitar(inteiro(params && params.rodadas, 3), 1, 10);

  /** Montar N: os números da faixa saem de um "saco" embaralhado (todos aparecem antes de repetir; nunca dois iguais seguidos). */
  function sortearConstruir(params, mem) {
    const min = U.limitar(inteiro(params.min, 1), 1, MAX);
    const max = U.limitar(inteiro(params.max, Math.max(min, 3)), min, MAX);
    if (!mem.saco.length) {
      const s = U.embaralhar(faixa(min, max));
      if (s.length > 1 && s[0] === mem.ultimo) s.push(s.shift());
      mem.saco = s;
    }
    const alvo = mem.saco.shift();
    mem.ultimo = alvo;
    return { tipo: 'construir', alvo };
  }

  /** Ordem das rodadas do modo comparar: começa sempre montando (a demonstração mostra o arraste); depois alterna. */
  function planoComparar(total) {
    const ciclo = ['igual', 'maior', 'umamais', 'maior'];
    const tipos = [];
    for (let i = 0; i < total; i++) tipos.push(ciclo[i % ciclo.length]);
    // em cada ciclo de 4, uma das rodadas "Qual torre tem mais?" tem a mesma quantidade (botão "Iguais")
    for (let c = 0; c * 4 < total; c++) {
      const idx = [c * 4 + 1, c * 4 + 3].filter(i => i < total);
      if (idx.length) tipos[U.escolher(idx)] = 'maior-iguais';
    }
    return tipos;
  }
  function sortearComparar(params, mem, indice) {
    const min = U.limitar(inteiro(params.min, 1), 1, 9);
    const max = U.limitar(inteiro(params.max, 10), min + 1, 10);
    if (!mem.plano) mem.plano = planoComparar(totalRodadas(params));
    const tipo = mem.plano[indice] || 'igual';
    const evitar = lista => { const l = lista.filter(v => v !== mem.ultimo); return l.length ? l : lista; };
    if (tipo === 'igual') {
      // uma torre de 1 seria fácil demais; na 1ª rodada (a da demonstração), no máximo cinco: a novidade é copiar, não contar muito
      const teto = indice === 0 ? Math.max(Math.min(max, 5), Math.min(Math.max(min, 2), max)) : max;
      const m = U.escolher(evitar(faixa(Math.min(Math.max(min, 2), teto), teto)));
      mem.ultimo = m;
      return { tipo, modelo: m, alvo: m };
    }
    if (tipo === 'umamais') {
      const m = U.escolher(evitar(faixa(min, max - 1)));
      mem.ultimo = m + 1;
      return { tipo, modelo: m, alvo: m + 1 };
    }
    if (tipo === 'maior-iguais') {
      const v = U.escolher(evitar(faixa(Math.min(Math.max(min, 3), max), max)));
      mem.ultimo = v;
      return { tipo: 'maior', valores: [v, v] };
    }
    // quantidades diferentes, perto uma da outra (diferença de 1 a 3): não dá para acertar sem olhar com cuidado
    const a = U.escolher(evitar(faixa(min, max)));
    const b = U.escolher(faixa(min, max).filter(v => v !== a && Math.abs(v - a) <= 3));
    mem.ultimo = Math.max(a, b);
    return { tipo: 'maior', valores: U.embaralhar([a, b]) };
  }

  // ---------------------------------------------------------------- peças comuns de uma rodada
  function kit(ctx) {
    const camada = U.el('div', { class: 'pc-torre' });
    ctx.palco.appendChild(camada);
    let ocupacoes = 0;
    const K = {
      camada,
      /** Liga/desliga "ocupado" (pausa o relógio de inatividade da moldura). Conta pedidos: cada true tem seu false. */
      ocupar(v) { ocupacoes = Math.max(0, ocupacoes + (v ? 1 : -1)); if (!ctx.sinal.aborted) ctx.ocupado(ocupacoes > 0); },
      pose(nome) { if (!ctx.sinal.aborted) PC.ui.pipoca.pose(nome); },
      /** Fala sem esperar (nunca rejeita). */
      dizer(texto, op) { ctx.falar(texto, op).catch(() => {}); },
      /** Espera a janela "Quer parar?" fechar (rejeita se a rodada acabar). */
      async semPausa() { while (pausado(ctx)) await ctx.esperar(150); },
      /** Espera a fala de retorno da moldura terminar (rejeita se a rodada acabar). */
      async fimDaFala() { await ctx.esperar(80); while (PC.ui.pipoca.falando()) await ctx.esperar(100); },
      /**
       * Conta em voz alta, nível por nível: em cada número acende o cubinho daquele nível de cada torre (ou o lugar
       * tracejado, se houver). dezena: com mais de 10, a dezena inteira acende de uma vez ("Dez!") e a contagem segue.
       * A Pipoca fala cada número (o balão mostra o algarismo). sinal: aborta a contagem (ajuda interrompida).
       */
      async contar(colunas, ate, { sinal = null, dezena = false } = {}) {
        const checar = () => { if (sinal && sinal.aborted) throw U.abortado(); };
        const numero = async i => {
          checar();
          await K.semPausa();
          checar();
          PC.som.contar(Math.min(i, 20));
          await Promise.all([Promise.race([ctx.falar(maiuscula(ext(i)), { mostrar: i }), ctx.esperar(PC.voz.TETO_NUMERO)]), ctx.esperar(INTERVALO)]);
          checar();
        };
        let i = 1;
        if (dezena && ate > 10) {
          colunas.forEach(c => { if (c.torre) for (let k = 0; k < 10 && k < c.torre.n; k++) c.torre.destacar(k); });
          await numero(10);
          i = 11;
        }
        for (; i <= ate; i++) {
          colunas.forEach(c => {
            if (c.torre && c.torre.n >= i) c.torre.destacar(i - 1);
            else if (c.fantasmas && c.fantasmas[i - 1]) {
              const f = c.fantasmas[i - 1];
              f.classList.add('acesa');
              U.animar(f, [{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], 320);
            }
          });
          await numero(i);
        }
      },
      /** Pulinho de destaque (elementos sem transform próprio). */
      pulsar(el, escala = 1.12) {
        if (el) U.animar(el, [{ transform: 'scale(1)' }, { transform: `scale(${escala})`, offset: 0.4 }, { transform: 'scale(1)' }], { duration: 520, easing: 'ease-out' });
      },
      /** A plaquinha presa na base da torre dá um pulinho (a mesma animação do PC.Torre). */
      pulsarPlaca(t) {
        if (!t || !t.placa) return;
        t.placa.classList.remove('pulsa'); void t.placa.offsetWidth; t.placa.classList.add('pulsa');
      },
      /** Tábua do chão onde a torre fica em pé. */
      base(x, classe) {
        const el = U.el('div', { class: 'pc-torre-base' + (classe ? ' ' + classe : ''), style: { left: (x - 100) + 'px', top: (PC.layout.chao - 2) + 'px', width: '200px' } });
        camada.appendChild(el);
        return el;
      },
      /** Luz atrás de uma torre (destaque da torre-modelo e das opções). */
      luz(t) {
        const el = U.el('div', { class: 'pc-torre-luz' });
        camada.appendChild(el);
        const r = t.retangulo(), chao = PC.layout.chao;
        Object.assign(el.style, { left: (r.x - 24) + 'px', top: (r.y - 34) + 'px', width: (r.l + 48) + 'px', height: (chao - r.y + 34 + 30) + 'px' });
        return el;
      },
      acender(luz) {
        if (luz) U.animar(luz, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 1600, easing: 'ease-in-out' });
      },
      /** Botão grande (Pronto, Iguais) centrado em BOTAO. */
      botao(texto, aoTocar, op, teste) {
        const b = PC.ui.botaoGrande(texto, aoTocar, op);
        b.dataset.teste = teste;
        const caixa = U.el('div', { class: 'pc-torre-botao', style: { left: (BOTAO.x - 230) + 'px', top: (BOTAO.y - 90) + 'px', width: '460px', height: '180px' } }, b);
        camada.appendChild(caixa);
        return { b, caixa };
      },
    };
    return K;
  }

  // ======================================================================== montar a torre (normal, igual, um a mais)
  function rodadaConstruir(ctx, cfg) {
    const K = kit(ctx), camada = K.camada;
    const params = ctx.params || {};
    const CHAO = PC.layout.chao;
    const comparar = cfg.tipo === 'igual' || cfg.tipo === 'umamais';
    const alvo = cfg.alvo;
    const confirmar = comparar ? params.confirmar !== false : !!params.confirmar;
    const vozTotal = !comparar && !!params.vozTotal;
    const comDezena = !comparar && !!params.dezenaPronta && alvo > 10;

    let destruido = false, resolvida = false, contando = false, liberado = !ctx.demo;
    let voando = null;          // algo voando para a torre (um de cada vez): { el } | { dezena: true }
    let arrasto = null;         // gesto em andamento: { tipo: 'cubo'|'tirado'|'dezena', ... }
    let contado = false;        // a Pipoca contou e a torre não mudou depois: a plaquinha da base aparece
    let ajudaAC = null, fantasmas = [], sobras = [];
    const desligar = [];

    // ------------------------------------------------------------ cena
    const ima = U.el('div', { class: 'pc-torre-ima' });
    const vazio = U.el('div', { class: 'pc-torre-vazio', hidden: true });
    const baldeFundo = U.el('div', { class: 'pc-torre-balde fundo', html: desenhoBalde('fundo') });
    const baldeFrente = U.el('div', { class: 'pc-torre-balde frente', html: desenhoBalde('frente') });
    const baldeToque = U.el('div', {
      class: 'pc-torre-toque', teste: 'balde', role: 'button', 'aria-label': 'Balde de cubinhos',
      style: { left: BALDE_TOQUE.x + 'px', top: BALDE_TOQUE.y + 'px', width: BALDE_TOQUE.l + 'px', height: BALDE_TOQUE.a + 'px' },
    });
    camada.append(ima, vazio, baldeFundo, baldeFrente, baldeToque);
    K.base(BASE_X, '');
    const t = new PC.Torre({ x: BASE_X, y: CHAO, placa: 'base' });
    camada.appendChild(t.el);
    const torreToque = U.el('div', { class: 'pc-torre-toque', teste: 'torre', role: 'button', 'aria-label': 'Torre de cubinhos' });
    camada.appendChild(torreToque);

    // torre-modelo (comparar)
    let modelo = null, luzModelo = null;
    if (comparar) {
      K.base(MODELO_X, 'modelo');
      modelo = new PC.Torre({ x: MODELO_X, y: CHAO, n: cfg.modelo, placa: 'base' });
      modelo.el.classList.add('pc-torre-semplaca');
      luzModelo = K.luz(modelo);
      camada.appendChild(modelo.el);
    }

    // placa do alvo
    let alvoPos = null;
    if (!comparar) {
      alvoPos = U.el('div', { class: 'pc-torre-alvo', style: { left: ALVO.x + 'px', top: ALVO.y + 'px' } },
        PC.ui.placaNumero(alvo, { pontos: !!params.pontos }));
      camada.appendChild(alvoPos);
      U.animar(alvoPos, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
        { duration: 420, delay: 150, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' });
    }

    // botão Pronto (aparece quando a torre tem cubinhos)
    let bPronto = null, caixaPronto = null;
    if (confirmar) {
      const r = K.botao('Pronto', () => aoPronto(), { icone: 'check', cor: '#5CC84A' }, 'pronto');
      bPronto = r.b; caixaPronto = r.caixa;
      caixaPronto.hidden = true;
    }

    // dezena pronta (barra de 10 em pé ao lado do balde)
    let dez = null;
    if (comDezena) {
      const suporte = U.el('div', { class: 'pc-torre-base', style: { left: (DEZENA_X - 46) + 'px', top: (CHAO - 2) + 'px', width: '92px' } });
      const toque = U.el('div', {
        class: 'pc-torre-toque', teste: 'dezena', role: 'button', 'aria-label': 'Dezena pronta',
        style: { left: DEZENA_TOQUE.x + 'px', top: DEZENA_TOQUE.y + 'px', width: DEZENA_TOQUE.l + 'px', height: DEZENA_TOQUE.a + 'px' },
      });
      camada.append(suporte, toque);
      dez = { mini: null, toque, suporte, emUso: false };
      novaDezena(false);
    }

    // ------------------------------------------------------------ estado e visual
    const podeAgir = () => !destruido && !resolvida && !contando && liberado && !voando && !ctx.sinal.aborted;
    const dezenaDisponivel = () => !!dez && t.n < 10 && !resolvida;

    function novaDezena(animar) {
      if (dez.mini) dez.mini.destruir();
      dez.mini = new PC.Torre({ x: DEZENA_X, y: CHAO, n: 10, tamanho: DEZENA_LADO, placa: false });
      dez.mini.el.classList.add('pc-torre-dezena');
      camada.appendChild(dez.mini.el);
      if (animar) U.animar(dez.mini.el, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.3, 1.5, .5, 1)' });
    }

    function atualizar() {
      if (destruido) return;
      const n = t.n;
      t.el.classList.toggle('pc-torre-semplaca', !(vozTotal || contado));
      // lugar tracejado do próximo cubinho: com a torre vazia e durante um arraste
      const verVazio = !resolvida && !contando && n < MAX && (n === 0 || (!!arrasto && arrasto.tipo !== 'dezena'));
      if (verVazio) { const p = t.topo(); vazio.style.left = (p.x - LADO / 2) + 'px'; vazio.style.top = (p.y - LADO / 2) + 'px'; }
      vazio.hidden = !verVazio;
      // área de toque da torre: a torre inteira, com folga (vazia: em volta da base)
      const r = n ? t.retangulo() : { x: BASE_X - LADO / 2, y: CHAO - LADO, l: LADO, a: LADO };
      const l = Math.max(240, r.l + 120), topo = Math.max(TOPO_TOQUE, Math.min(CHAO - 140, r.y - 70));
      Object.assign(torreToque.style, { left: (BASE_X - l / 2) + 'px', top: topo + 'px', width: l + 'px', height: (FUNDO_TOQUE - topo) + 'px' });
      // halo do ímã acompanha a torre
      const larg = Math.max(largura(n), largura(n + 1)), topoIma = Math.min(r.y, t.topo().y - LADO / 2);
      Object.assign(ima.style, { left: (BASE_X - larg / 2 - 34) + 'px', top: Math.max(TOPO_TOQUE - 10, topoIma - 40) + 'px', width: (larg + 68) + 'px', height: (CHAO + 30 - Math.max(TOPO_TOQUE - 10, topoIma - 40)) + 'px' });
      // Pronto
      if (caixaPronto) {
        const ver = n > 0 || contando;
        if (ver && caixaPronto.hidden) {
          caixaPronto.hidden = false;
          U.animar(bPronto, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.3, 1.6, .5, 1)' });
        } else if (!ver) caixaPronto.hidden = true;
        bPronto.disabled = contando || resolvida;
      }
      // dezena pronta: só enquanto a torre ainda não tem uma dezena
      if (dez) {
        const ver = dez.emUso || dezenaDisponivel();
        if (ver && dez.mini.el.hidden) { dez.mini.el.hidden = false; novaDezena(true); }
        dez.mini.el.hidden = !ver;
        dez.suporte.hidden = !ver;
        dez.toque.hidden = !dezenaDisponivel() || dez.emUso;
      }
    }

    function marcarIma(ligado, noBalde) {
      ima.classList.toggle('acesa', !!ligado);
      vazio.classList.toggle('acesa', !!ligado);
      camada.classList.toggle('pc-torre-ima-balde', !!noBalde);
    }
    /** O ponto (virtual) está perto da torre o bastante para o objeto entrar nela ("ímã": até ~1 cubinho de distância)? */
    const naZona = p => Math.abs(p.x - BASE_X) <= IMA + (t.n >= 10 ? (LADO + VAO) / 2 : 0) && p.y >= TOPO_TOQUE - 30 && p.y <= FUNDO_TOQUE;

    function pularBalde() {
      [baldeFundo, baldeFrente].forEach(el => { el.classList.remove('pula'); void el.offsetWidth; el.classList.add('pula'); });
    }

    // ------------------------------------------------------------ cubinhos soltos (voando ou na mão)
    function criarCubo(cor) {
      const el = U.el('div', { class: 'cubo pc-torre-solto' });
      el.style.setProperty('--c', cor);
      el.style.setProperty('--c-claro', U.tom(cor, 0.45));
      el.style.setProperty('--c-escuro', U.tom(cor, -0.18));
      camada.appendChild(el);
      return { el, x: 0, y: 0 };
    }
    function posCubo(s, x, y) {
      s.x = x; s.y = y;
      s.el.style.transform = `translate(${(x - LADO / 2).toFixed(1)}px, ${(y - LADO / 2).toFixed(1)}px)`;
    }
    /** Voo em arco do ponto de até o ponto para (centros). Promise que nunca rejeita. */
    function voarCubo(s, de, para, ms, { altura = 140, girar = -22 } = {}) {
      const meio = { x: (de.x + para.x) / 2, y: Math.min(de.y, para.y) - altura };
      const quadros = [];
      for (let i = 0; i <= 10; i++) {
        const f = i / 10, r = 1 - f;
        const x = r * r * de.x + 2 * r * f * meio.x + f * f * para.x;
        const y = r * r * de.y + 2 * r * f * meio.y + f * f * para.y;
        const esc = f < 0.3 ? 0.7 + f : 1;
        quadros.push({ transform: `translate(${(x - LADO / 2).toFixed(1)}px, ${(y - LADO / 2).toFixed(1)}px) rotate(${Math.round(r * girar)}deg) scale(${esc.toFixed(2)})`, offset: f });
      }
      posCubo(s, para.x, para.y);
      return U.animar(s.el, quadros, { duration: ms, easing: 'ease-in-out' });
    }
    /** O cubinho volta para dentro do balde e some. */
    function devolverAoBalde(s) {
      s.el.classList.remove('pc-torre-arrastado');
      const de = { x: s.x, y: s.y };
      const para = { x: BOCA.x, y: BOCA.y + 30 };
      const ms = U.limitar(U.distancia(de, para) * 0.55, 220, 480);
      voarCubo(s, de, para, ms, { altura: 90, girar: 30 }).then(() => {
        U.animar(s.el, [{ opacity: 1 }, { opacity: 0 }], 90).then(() => s.el.remove());
        if (!destruido) pularBalde();
      });
    }

    // ------------------------------------------------------------ pôr e tirar
    /** Tocar no balde: um cubinho voa até o topo da torre. */
    function tocarBalde() {
      if (!podeAgir()) return;
      pularBalde();
      if (t.n >= MAX) { cheia(); return; }
      const s = criarCubo(corCinco(t.n));
      posCubo(s, BOCA.x, BOCA.y);
      voando = s;
      K.ocupar(true);                     // em voo: o relógio de inatividade espera (e os testes também)
      PC.som.pegar();
      atualizar();
      voarCubo(s, BOCA, t.topo(), VOO_MS).then(() => {
        if (voando === s) voando = null;
        K.ocupar(false);
        s.el.remove();
        if (destruido || resolvida || ctx.sinal.aborted) return;
        colocar(1, false);
      });
    }

    /** A torre ganhou cubinhos (1 do balde, ou 10 da dezena pronta). */
    function colocar(qtd, animar) {
      const antes = t.n;
      if (qtd === 1) t.adicionar(null, { animar });
      else t.adicionarVarios(qtd, { animar: false });
      PC.som.encaixar();
      PC.som.contar(Math.min(t.n, 20));
      mudou(antes, qtd === 10 ? 'dezena' : 'pos');
    }

    /** Tocar na torre: o cubinho de cima sai e volta para o balde. */
    function tocarTorre() {
      if (!podeAgir()) return;
      if (!t.n) { pularBalde(); return; }
      const i = t.n - 1, r = t.retanguloCubo(i), cor = t.corDe(i), antes = t.n;
      t.remover(1);
      PC.som.separar();
      const s = criarCubo(cor);
      posCubo(s, r.x + LADO / 2, r.y + LADO / 2);
      devolverAoBalde(s);
      mudou(antes, 'tirar');
    }

    function cheia() {
      t.tremer();
      K.dizer('A torre está cheia!');
    }

    /** Reage a cada mudança da torre: plaquinha, Pronto, falas e, sem Pronto, o fim da rodada ao chegar em N. */
    function mudou(antes, origem) {
      contado = false;
      limparAjudas();
      atualizar();
      const n = t.n;
      // a fitinha aparece ao completar uma dezena (no 10 e no 20) ou quando a dezena pronta entra
      if (origem === 'dezena' || (n === 10 && antes === 9) || (n === 20 && antes === 19)) animarFitas();
      if (!confirmar && n === alvo) { terminar(); return; }
      if (origem === 'dezena') {
        if (n === 10) K.dizer(`Já temos dez! Ponha mais ${ext(alvo - 10)}!`, { mostrar: 10 });
        else K.dizer(maiuscula(PC.voz.dezEMais(n)) + '!', { mostrar: n });
      } else if (n === 10 && antes === 9) {
        K.dizer('Dez! Uma dezena!', { mostrar: 10 });
      } else if (n === 20 && antes === 19) {
        K.dizer('Vinte! Duas dezenas!', { mostrar: 20 });
      } else if (vozTotal && n > 0) {
        K.dizer(maiuscula(ext(n)) + '!', { mostrar: n });
      }
    }
    function animarFitas() {
      (t.fitas || []).forEach(f => U.animar(f, [{ transform: 'scale(.2)' }, { transform: 'scale(1.25)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' }));
    }

    // ------------------------------------------------------------ arrastar: do balde, da torre ou a dezena pronta
    function pegarDoBalde(p) {
      if (!podeAgir()) return;
      if (t.n >= MAX) { pularBalde(); cheia(); return; }
      const s = criarCubo(corCinco(t.n));
      s.el.classList.add('pc-torre-arrastado');
      s.el.style.willChange = 'transform';
      arrasto = { tipo: 'cubo', s };
      PC.som.pegar();
      pularBalde();
      limparAjudas();
      moverArrasto(p);
      atualizar();
    }
    function pegarDaTorre(p) {
      if (!podeAgir() || !t.n) return;
      const i = t.n - 1, cor = t.corDe(i), antes = t.n;
      t.remover(1);
      contado = false;                    // a torre mudou: a plaquinha só volta depois de contar de novo
      PC.som.separar();
      const s = criarCubo(cor);
      s.el.classList.add('pc-torre-arrastado');
      s.el.style.willChange = 'transform';
      arrasto = { tipo: 'tirado', s, antes };
      limparAjudas();
      moverArrasto(p);
      atualizar();
    }
    function pegarDezena(p) {
      if (!podeAgir() || !dezenaDisponivel() || dez.emUso) return;
      const d = dez.mini;
      dez.emUso = true;
      d.el.classList.add('pc-torre-arrastado');
      d.el.style.willChange = 'transform';
      // a barrinha fica presa ao dedo no ponto em que foi pega
      arrasto = { tipo: 'dezena', dx: DEZENA_X - p.inicio.x, dy: CHAO - p.inicio.y, base: { x: DEZENA_X, y: CHAO } };
      PC.som.pegar();
      limparAjudas();
      moverArrasto(p);
      atualizar();
    }
    function moverArrasto(p) {
      const a = arrasto;
      if (!a || destruido) return;
      if (a.tipo === 'dezena') {
        a.base = { x: p.x + a.dx, y: p.y + a.dy };
        dez.mini.el.style.transform = `translate(${(a.base.x - DEZENA_X).toFixed(1)}px, ${(a.base.y - CHAO).toFixed(1)}px)`;
      } else posCubo(a.s, p.x, p.y - 12);
      const dentro = naZona(p);
      marcarIma(dentro, !dentro && a.tipo === 'tirado');
    }
    function soltarArrasto(p) {
      const a = arrasto;
      arrasto = null;
      marcarIma(false, false);
      if (!a) return;
      if (a.s) a.s.el.style.willChange = '';
      if (destruido || resolvida || ctx.sinal.aborted) { if (a.s) a.s.el.remove(); return; }
      const dentro = naZona(p);
      if (a.tipo === 'cubo') {
        if (dentro && t.n < MAX) encaixarSolto(a.s, () => colocar(1, false));
        else { PC.som.soltar(); devolverAoBalde(a.s); atualizar(); }
      } else if (a.tipo === 'tirado') {
        // de volta na torre: nada mudou; longe dela: o cubinho volta para o balde
        if (dentro && t.n < MAX) encaixarSolto(a.s, () => { t.adicionar(null, { animar: false }); PC.som.encaixar(); atualizar(); });
        else { devolverAoBalde(a.s); mudou(a.antes, 'tirar'); }
      } else if (a.tipo === 'dezena') {
        dez.mini.el.style.willChange = '';
        if (dentro && t.n < 10) encaixarDezena(a.base);
        else voltarDezena(a.base);
      }
    }
    function cancelarArrasto() {
      const a = arrasto;
      arrasto = null;
      marcarIma(false, false);
      if (!a) return;
      if (destruido || resolvida || ctx.sinal.aborted) { if (a.s) a.s.el.remove(); return; }
      if (a.tipo === 'cubo') { a.s.el.style.willChange = ''; devolverAoBalde(a.s); }
      else if (a.tipo === 'tirado') { a.s.el.remove(); t.adicionar(null, { animar: false }); }
      else if (a.tipo === 'dezena') { dez.mini.el.style.willChange = ''; voltarDezena(a.base); }
      atualizar();
    }
    /** O cubinho solto desliza até o topo da torre e encaixa (um de cada vez). */
    function encaixarSolto(s, depois) {
      const para = t.topo();
      voando = s;
      K.ocupar(true);
      s.el.classList.remove('pc-torre-arrastado');
      const de = { x: s.x, y: s.y };
      posCubo(s, para.x, para.y);
      U.animar(s.el, [
        { transform: `translate(${(de.x - LADO / 2).toFixed(1)}px, ${(de.y - LADO / 2).toFixed(1)}px)` },
        { transform: `translate(${para.x - LADO / 2}px, ${para.y - LADO / 2}px)` },
      ], { duration: 130, easing: 'ease-out' }).then(() => {
        if (voando === s) voando = null;
        K.ocupar(false);
        s.el.remove();
        if (destruido || resolvida || ctx.sinal.aborted) return;
        depois();
      });
    }

    /** A dezena pronta voa (crescendo) até a torre; se já havia cubinhos, eles passam a ser as unidades, à direita. */
    function encaixarDezena(de) {
      const d = dez.mini, k = t.n;
      const para = { x: k === 0 ? BASE_X : BASE_X - (LADO + VAO) / 2, y: CHAO };
      const s = LADO / DEZENA_LADO;
      dez.emUso = true;
      voando = { dezena: true };
      K.ocupar(true);
      d.el.classList.add('pc-torre-arrastado');
      PC.som.pegar();
      const quadros = [];
      for (let i = 0; i <= 8; i++) {
        const f = i / 8, x = de.x + (para.x - de.x) * f, y = de.y + (para.y - de.y) * f - 120 * 4 * f * (1 - f);
        quadros.push({ transform: `translate(${(x - DEZENA_X).toFixed(1)}px, ${(y - CHAO).toFixed(1)}px) scale(${(1 + (s - 1) * f).toFixed(3)})` });
      }
      d.el.style.transform = quadros[quadros.length - 1].transform;
      const voos = [U.animar(d.el, quadros, { duration: 420, easing: 'ease-in-out' })];
      if (k > 0) voos.push(U.animar(t.el, [{ transform: 'translateX(0px)' }, { transform: `translateX(${(LADO + VAO) / 2}px)` }], { duration: 420, easing: 'ease-in-out', fill: 'forwards' }));
      atualizar();
      Promise.all(voos).then(() => {
        t.el.getAnimations().forEach(an => an.cancel());
        voando = null;
        dez.emUso = false;
        K.ocupar(false);
        if (destruido) return;
        d.el.classList.remove('pc-torre-arrastado');
        d.el.style.transform = '';
        d.el.hidden = true;
        if (resolvida || ctx.sinal.aborted) return;
        colocar(10, false);
      });
    }
    function voltarDezena(de) {
      const d = dez.mini;
      dez.emUso = true;
      U.animar(d.el, [
        { transform: `translate(${(de.x - DEZENA_X).toFixed(1)}px, ${(de.y - CHAO).toFixed(1)}px)` },
        { transform: 'translate(0px, 0px)' },
      ], { duration: 260, easing: 'ease-out' }).then(() => {
        dez.emUso = false;
        if (destruido) return;
        d.el.classList.remove('pc-torre-arrastado');
        atualizar();
      });
      d.el.style.transform = '';
      PC.som.soltar();
    }
    function tocarDezena() {
      if (!podeAgir() || !dezenaDisponivel() || dez.emUso) return;
      encaixarDezena({ x: DEZENA_X, y: CHAO });
    }

    // ------------------------------------------------------------ contar e conferir
    const colunas = () => (modelo ? [{ torre: t }, { torre: modelo }] : [{ torre: t }]);
    const fimDaContagem = () => (modelo ? Math.max(t.n, modelo.n) : t.n);
    function revelarPlacas() {
      contado = true;
      atualizar();
      K.pulsarPlaca(t);
      if (modelo && modelo.el.classList.contains('pc-torre-semplaca')) { modelo.el.classList.remove('pc-torre-semplaca'); K.pulsarPlaca(modelo); }
    }
    function fraseAcerto() {
      if (cfg.tipo === 'igual') return `${maiuscula(ext(alvo))} e ${ext(alvo)}. Iguais!`;
      if (cfg.tipo === 'umamais') return `Um a mais que ${ext(cfg.modelo)} é ${ext(alvo)}!`;
      return fraseTotal(alvo);
    }

    /** Sem Pronto: a torre chegou em N. A Pipoca conta tudo e a rodada acaba. */
    async function terminar() {
      if (contando || resolvida) return;
      contando = true;
      K.ocupar(true);
      atualizar();
      try {
        await ctx.esperar(250);
        K.pose('aponta');
        await K.contar(colunas(), fimDaContagem(), { dezena: !modelo });
        revelarPlacas();
        await ctx.falar(fraseAcerto(), { mostrar: alvo });
        await K.semPausa();
        resolvida = true;
        K.pose('normal');
        ctx.acertou();
      } catch (e) {
        if (!U.ehAbortado(e)) { console.error(e); destravar(); }
      }
    }
    /** Só para falhas inesperadas: nunca deixar a rodada presa em "contando". */
    function destravar() {
      if (destruido || resolvida || !contando) return;
      contando = false;
      K.ocupar(false);
      atualizar();
    }

    /** Botão Pronto: a Pipoca conta tudo; certo → acerto; errado → retorno descritivo pela moldura. */
    async function aoPronto() {
      if (!podeAgir() || !t.n) return;
      contando = true;
      K.ocupar(true);
      const n = t.n;
      try {
        limparAjudas();
        atualizar();
        K.pose('aponta');
        await K.contar(colunas(), fimDaContagem(), { dezena: !modelo });
        revelarPlacas();
        if (n === alvo) {
          await ctx.falar(fraseAcerto(), { mostrar: alvo });
          await K.semPausa();
          resolvida = true;
          K.pose('normal');
          ctx.acertou();
          return;
        }
        K.pose('normal');
        contando = false;
        K.ocupar(false);
        atualizar();
        const fala = cfg.tipo === 'umamais' && n === cfg.modelo ? 'Ficou igual a esta. Coloque mais um!' : fraseErro(n, alvo);
        ctx.errou({ fala, mostrar: alvo });
      } catch (e) {
        if (!U.ehAbortado(e)) { console.error(e); destravar(); }
      }
    }

    // ------------------------------------------------------------ ajudas
    function limparAjudas() {
      if (ajudaAC) ajudaAC.abort();
      fantasmas.forEach(f => { if (f) f.remove(); });
      fantasmas = [];
      sobras.forEach(c => c.classList.remove('pc-torre-sobra'));
      sobras = [];
    }
    /** Lugares tracejados dos cubinhos que faltam (só quando o arranjo da torre não muda até lá). */
    function mostrarFantasmas(de, ate) {
      fantasmas.forEach(f => { if (f) f.remove(); });
      fantasmas = [];
      if (!(ate <= 10 || de > 10)) return false;
      const lista = [];
      for (let i = 0; i < ate; i++) {
        if (i < de) { lista.push(null); continue; }
        const q = lugar(i, ate, BASE_X, CHAO);
        const f = U.el('div', { class: 'pc-torre-fantasma', style: { left: q.x + 'px', top: q.y + 'px' } });
        camada.appendChild(f);
        U.animar(f, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 220, delay: (i - de) * 50, fill: 'backwards' });
        lista.push(f);
      }
      fantasmas = lista;
      return true;
    }

    /**
     * Ajuda que ensina (2º erro seguido): a Pipoca conta a torre em voz alta e diz o que falta. Faltando, aparecem os
     * lugares tracejados e a contagem continua neles ("quatro, cinco... Faltam dois!"); sobrando, conta só até N e os
     * cubinhos a mais ficam apagados ("Sobram dois!"). No modo comparar, conta a modelo junto, nível por nível.
     * Qualquer toque da criança interrompe.
     */
    async function ajudar(nivel) {
      // a criança já está mexendo (arrastando ou um cubinho voando): ela já está corrigindo, a ajuda só atrapalharia
      if (nivel >= 3 || destruido || resolvida || contando || !liberado || ajudaAC || arrasto || voando) return;
      const ac = new AbortController();
      const aoSair = () => ac.abort();
      ctx.sinal.addEventListener('abort', aoSair, { once: true });
      ac.signal.addEventListener('abort', () => { if (!destruido && !ctx.sinal.aborted) PC.ui.pipoca.calar(); }, { once: true });
      ajudaAC = ac;
      K.ocupar(true);
      const sinal = ac.signal;
      const falar = async (texto, op) => {
        if (sinal.aborted) throw U.abortado();
        await ctx.falar(texto, op);
        if (sinal.aborted) throw U.abortado();
      };
      try {
        const n = t.n;
        K.pose('aponta');
        if (!n) {
          pularBalde();
          await falar('Toque no balde!');
          return;
        }
        if (modelo) {
          if (n < alvo) mostrarFantasmas(n, alvo);
          await K.contar([{ torre: modelo }, { torre: t, fantasmas }], Math.max(n, alvo, modelo.n), { sinal });
          if (modelo.el.classList.contains('pc-torre-semplaca')) { modelo.el.classList.remove('pc-torre-semplaca'); K.pulsarPlaca(modelo); }
          if (cfg.tipo === 'umamais') await falar(`Um a mais que ${ext(cfg.modelo)} é ${ext(alvo)}!`, { mostrar: alvo });
        } else {
          const comFantasmas = n < alvo && mostrarFantasmas(n, alvo);
          await K.contar([{ torre: t, fantasmas }], n > alvo ? alvo : (comFantasmas ? alvo : n), { sinal, dezena: true });
        }
        if (n < alvo) {
          if (dez && dezenaDisponivel() && alvo - n >= 10) K.pulsar(dez.mini.el, 1.12);
          await falar((alvo - n === 1 ? 'Falta ' : 'Faltam ') + ext(alvo - n) + '!', { mostrar: alvo - n });
        } else if (n > alvo) {
          for (let i = alvo; i < n; i++) if (t.cubos[i]) { t.cubos[i].classList.add('pc-torre-sobra'); sobras.push(t.cubos[i]); }
          await falar((n - alvo === 1 ? 'Sobra ' : 'Sobram ') + ext(n - alvo) + '!', { mostrar: n - alvo });
        } else if (bPronto) {
          K.pulsar(bPronto);
          await falar(maiuscula(cubinhos(n)) + '! Toque no botão verde!', { mostrar: n });
        }
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ctx.sinal.removeEventListener('abort', aoSair);
        if (ajudaAC === ac) ajudaAC = null;
        K.ocupar(false);
        if (!destruido && !ctx.sinal.aborted && !contando) K.pose('normal');
      }
    }

    // ------------------------------------------------------------ instrução e demonstração
    function textoInstrucao() {
      if (cfg.tipo === 'igual') return 'Faça uma torre igual a esta!';
      if (cfg.tipo === 'umamais') return 'Faça uma torre com um a mais que esta!';
      return `Monte uma torre de ${cubinhos(alvo)}!`;
    }
    /** O número da instrução no balão: com pontinhos só se params.pontos (o mesmo que a placa do alvo). */
    function mostrarAlvo() {
      if (params.pontos || alvo > 10) return alvo;
      return U.el('div', { class: 'balao-numero' }, U.el('b', { text: String(alvo) }));
    }
    function instrucao() {
      if (destruido || resolvida || contando || ctx.sinal.aborted) return Promise.resolve();
      if (ajudaAC) ajudaAC.abort();        // pediu a instrução de novo (tocou na Pipoca): a ajuda em andamento para
      if (alvoPos) K.pulsar(alvoPos, 1.14);
      if (luzModelo) { K.acender(luzModelo); K.pulsar(modelo.el, 1.06); }
      // no comparar o número não aparece: a criança descobre contando a torre-modelo
      return ctx.falar(textoInstrucao(), comparar ? {} : { mostrar: mostrarAlvo() }).catch(() => {});
    }

    /** Onde a mãozinha da demonstração pega e solta. */
    function gestoDemo() {
      if (comDezena) return { tipo: 'dezena', de: { x: DEZENA_X, y: CHAO - 5 * DEZENA_LADO }, para: { x: BASE_X, y: CHAO - 5 * DEZENA_LADO } };
      return { tipo: 'cubo', de: { x: BOCA.x, y: BOCA.y }, para: t.topo() };
    }
    /**
     * Demonstração (1ª rodada com demo): a mãozinha leva um cubinho de mentirinha (ou a dezena pronta) do balde até a
     * torre, sem mudar a torre. A 1ª passada é só para olhar (a criança ainda não mexe); depois a rodada é liberada e
     * a mãozinha mostra mais uma vez — essa 2ª passada some no primeiro toque, e o gesto da criança já vale.
     */
    async function demonstrar() {
      K.ocupar(true);
      let passada = null;                       // { el, dica, real } da passada em andamento
      let tocou = false;
      const sumir = () => {
        const p = passada;
        passada = null;
        if (!p) return;
        if (p.dica && p.dica.parar) p.dica.parar();
        p.el.getAnimations().forEach(an => an.cancel());
        p.el.remove();
        if (p.real) p.real.getAnimations().forEach(an => an.cancel());   // a dezena de verdade volta a aparecer
      };
      // só depois de liberar: o toque da criança encerra a demonstração na hora (antes disso o toque é ignorado)
      const off = PC.on('toque', () => { if (liberado) { tocou = true; sumir(); } });
      try {
        for (let v = 0; v < 2 && !tocou; v++) {
          if (v === 1) { liberado = true; atualizar(); }
          const g = gestoDemo();
          const q = (p, o, off2, e = 1) => ({ transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scale(${e})`, opacity: o, offset: off2 });
          let quadros, el, real = null;
          if (g.tipo === 'dezena') {
            // a barrinha de mentirinha sai do suporte (a de verdade some enquanto isso) e cresce até o tamanho da torre
            const f = new PC.Torre({ x: 0, y: 0, n: 10, tamanho: DEZENA_LADO, placa: false });
            f.el.classList.add('pc-torre-arrastado');
            camada.appendChild(f.el);
            el = f.el;
            const b = p => ({ x: p.x, y: p.y + 5 * DEZENA_LADO }), s = (LADO / DEZENA_LADO).toFixed(3);
            quadros = [q(b(g.de), 0, 0), q(b(g.de), 0, 0.16), q(b(g.de), 0.9, 0.22), q(b(g.para), 0.9, 0.78, s), q(b(g.para), 0.9, 0.88, s), q(b(g.para), 0, 1, s)];
            if (dez && dez.mini) {
              real = dez.mini.el;
              U.animar(real, [{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0, offset: 0.23 }, { opacity: 0, offset: 0.9 }, { opacity: 1, offset: 1 }],
                { duration: 1900, easing: 'ease-in-out' });
            }
          } else {
            el = criarCubo(corCinco(t.n)).el;
            const c = p => ({ x: p.x - LADO / 2, y: p.y - LADO / 2 + 8 });
            quadros = [q(c(g.de), 0, 0), q(c(g.de), 0, 0.16), q(c(g.de), 0.9, 0.22), q(c(g.para), 0.9, 0.78), q(c(g.para), 0.9, 0.88), q(c(g.para), 0, 1)];
          }
          el.style.opacity = '0';
          passada = { el, real, dica: ctx.dica(g.de, g.para, { vezes: 1 }) };
          // a mesma duração e a mesma curva da mãozinha (PC.ui.dica): o objeto anda junto com ela
          await Promise.race([U.animar(el, quadros, { duration: 1900, easing: 'ease-in-out', fill: 'forwards' }), ctx.esperar(2600)]);
          sumir();
          if (!tocou && v === 0) await ctx.esperar(250);
        }
      } finally {
        off();
        sumir();
        K.ocupar(false);
      }
    }

    // ------------------------------------------------------------ gesto certo, resolver, estado
    function centroDe(el) { const r = PC.palco.retangulo(el); return { x: r.cx, y: r.cy }; }
    function proximoGesto() {
      if (destruido || resolvida || contando || !liberado || voando) return null;
      const n = t.n;
      if (n < alvo) {
        if (dezenaDisponivel() && alvo - n >= 10) {
          return { tipo: 'arrastar', de: { x: DEZENA_X, y: CHAO - 5 * DEZENA_LADO }, para: { x: BASE_X, y: Math.max(TOPO_TOQUE + 40, CHAO - 5 * LADO) } };
        }
        return { tipo: 'arrastar', de: { x: BOCA.x, y: BOCA.y + 40 }, para: t.topo() };
      }
      if (n > alvo) {
        const r = t.retanguloCubo(t.n - 1);
        return { tipo: 'tocar', em: { x: r.x + r.l / 2, y: r.y + r.a / 2 } };
      }
      if (bPronto && !caixaPronto.hidden) return { tipo: 'tocar', em: centroDe(bPronto) };
      return null;
    }

    /** Testes: a torre fica com N na hora e a rodada termina (um único ctx.acertou()). */
    function resolver() {
      if (destruido || resolvida) return;
      resolvida = true;
      limparAjudas();
      try {
        PC.arrastar.cancelarTodos();
        if (voando && voando.el) { voando.el.remove(); }
        voando = null;
        if (t.n !== alvo) t.definir(Array.from({ length: alvo }, (_, i) => corCinco(i)));
        contado = true;
        atualizar();
      } catch (e) { console.error(e); }
      ctx.acertou();
    }

    function estado() {
      return {
        modo: comparar ? 'comparar' : 'construir', tipo: cfg.tipo, alvo, n: t.n, modelo: modelo ? modelo.n : null,
        confirmar, vozTotal, dezenaPronta: !!dez, dezenaDisponivel: !!dez && dezenaDisponivel(),
        voando: !!voando, arrastando: !!arrasto, contando, liberado, resolvida, ajudando: !!ajudaAC,
        livre: podeAgir() && !arrasto && !PC.arrastar.ativo() && !PC.toquesBloqueados(),
        placaVisivel: t.n > 0 && !t.el.classList.contains('pc-torre-semplaca'),
        pronto: !!(caixaPronto && !caixaPronto.hidden), fantasmas: fantasmas.filter(Boolean).length, sobras: sobras.length,
      };
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      if (ajudaAC) ajudaAC.abort();
      offToque();
      desligar.forEach(f => { try { f(); } catch (e) { console.error(e); } });
      camada.remove();
    }

    // ------------------------------------------------------------ toques
    const offToque = PC.on('toque', () => limparAjudas());
    desligar.push(PC.arrastar(baldeToque, {
      podeComecar: () => podeAgir(),
      aoTocar: () => tocarBalde(),
      aoComecar: p => pegarDoBalde(p),
      aoMover: p => moverArrasto(p),
      aoSoltar: p => soltarArrasto(p),
      aoCancelar: () => cancelarArrasto(),
    }));
    desligar.push(PC.arrastar(torreToque, {
      podeComecar: () => podeAgir(),
      aoTocar: () => tocarTorre(),
      aoComecar: p => pegarDaTorre(p),
      aoMover: p => moverArrasto(p),
      aoSoltar: p => soltarArrasto(p),
      aoCancelar: () => cancelarArrasto(),
    }));
    if (dez) {
      desligar.push(PC.arrastar(dez.toque, {
        podeComecar: () => podeAgir() && dezenaDisponivel() && !dez.emUso,
        aoTocar: () => tocarDezena(),
        aoComecar: p => pegarDezena(p),
        aoMover: p => moverArrasto(p),
        aoSoltar: p => soltarArrasto(p),
        aoCancelar: () => cancelarArrasto(),
      }));
    }

    atualizar();

    // início: instrução e, na primeira rodada com demo, a mãozinha mostra o gesto antes de liberar
    (async () => {
      try {
        await ctx.esperar(300);
        if (ctx.demo) {
          K.ocupar(true);
          try { await instrucao(); } finally { K.ocupar(false); }
          if (!destruido && !resolvida) await demonstrar();
        } else instrucao();
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        if (!destruido) { liberado = true; atualizar(); }
      }
    })();

    return { instrucao, proximoGesto, ajudar, resolver, estado, destruir };
  }

  // ======================================================================== "Qual torre tem mais?" (comparar)
  function rodadaMaior(ctx, cfg) {
    const K = kit(ctx), camada = K.camada;
    const CHAO = PC.layout.chao;
    const valores = cfg.valores;
    const iguais = valores[0] === valores[1];
    const certo = iguais ? 'iguais' : (valores[0] > valores[1] ? 0 : 1);
    let destruido = false, resolvida = false, travado = false, retornando = false, ajudaAC = null;
    const fora = new Set();
    const timers = new Set();                     // setTimeout pendentes (limpos em destruir)

    const opcoes = valores.map((v, i) => {
      const x = DUAS_X[i];
      const base = K.base(x, '');
      const t = new PC.Torre({ x, y: CHAO, n: v, placa: 'base' });
      t.el.classList.add('pc-torre-semplaca');
      const luz = K.luz(t);
      camada.appendChild(t.el);
      const l = 240, topo = Math.max(TOPO_TOQUE, t.retangulo().y - 70);
      const toque = U.el('div', {
        class: 'pc-torre-toque', teste: 'torre-' + i, role: 'button', 'aria-label': 'Torre ' + (i === 0 ? 'da esquerda' : 'da direita'),
        style: { left: (x - l / 2) + 'px', top: topo + 'px', width: l + 'px', height: (FUNDO_TOQUE - topo) + 'px' },
      });
      camada.appendChild(toque);
      PC.aoTocar(toque, () => escolher(i));
      U.animar(t.el, [{ transform: 'translateY(70px)', opacity: 0 }, { transform: 'translateY(0px)', opacity: 1 }],
        { duration: 380, delay: 60 + i * 110, easing: 'cubic-bezier(.3, 1.4, .5, 1)', fill: 'backwards' });
      return { i, v, x, t, base, luz, toque };
    });
    const { b: bIguais } = K.botao('Iguais', () => escolher('iguais'), { icone: 'iguais', cor: '#4DA3FF' }, 'iguais');

    const maiorV = Math.max(valores[0], valores[1]), menorV = Math.min(valores[0], valores[1]);
    const conclusao = () => (iguais ? `${maiuscula(ext(maiorV))} e ${ext(maiorV)}. Iguais!` : `${maiuscula(ext(maiorV))} é mais que ${ext(menorV)}!`);

    function revelarPlacas() {
      opcoes.forEach(o => { if (o.t.el.classList.contains('pc-torre-semplaca')) { o.t.el.classList.remove('pc-torre-semplaca'); K.pulsarPlaca(o.t); } });
    }
    function tirarDeJogo(op) {
      fora.add(op);
      if (op === 'iguais') { bIguais.disabled = true; bIguais.classList.add('pc-torre-fora'); return; }
      const o = opcoes[op];
      o.t.el.classList.add('pc-torre-fora');
      o.base.classList.add('pc-torre-fora');
      o.toque.setAttribute('aria-disabled', 'true');
    }
    function fraseErro(op) {
      if (op === 'iguais') return `Uma tem ${ext(valores[0])}. A outra tem ${ext(valores[1])}.`;
      const v = valores[op], outra = valores[1 - op];
      return v === outra ? `Essa tem ${ext(v)}. A outra também!` : `Essa tem ${ext(v)}. A outra tem ${ext(outra)}.`;
    }

    /** Escolha da criança: só o primeiro toque vale até o retorno terminar; a opção errada sai de jogo. */
    async function escolher(op) {
      if (destruido || resolvida || travado || fora.has(op) || ctx.sinal.aborted) return;
      travado = true;
      if (ajudaAC) ajudaAC.abort();
      if (op === certo) {
        K.ocupar(true);
        try {
          if (op === 'iguais') K.pulsar(bIguais); else K.acender(opcoes[op].luz);
          K.pose('aponta');
          camada.classList.add('pc-torre-vivo');
          await K.contar(opcoes.map(o => ({ torre: o.t })), maiorV);
          revelarPlacas();
          await ctx.falar(conclusao());
          await K.semPausa();
          resolvida = true;
          K.pose('normal');
          ctx.acertou();
        } catch (e) {
          if (!U.ehAbortado(e)) { console.error(e); if (!resolvida && !destruido) { travado = false; K.ocupar(false); } }
        }
        return;
      }
      tirarDeJogo(op);
      if (op !== 'iguais') opcoes[op].t.tremer();
      retornando = true;
      ctx.errou({ fala: fraseErro(op) });
      try {
        await K.fimDaFala();
      } catch (e) {
        return;
      } finally { retornando = false; }
      travado = false;
    }

    function instrucao() {
      if (destruido || resolvida || travado || ctx.sinal.aborted) return Promise.resolve();
      if (ajudaAC) ajudaAC.abort();        // pediu a instrução de novo: a ajuda em andamento para
      return (async () => {
        opcoes.forEach((o, k) => {
          if (fora.has(o.i)) return;
          const id = setTimeout(() => { timers.delete(id); if (!destruido) K.acender(o.luz); }, U.duracao(k * 300));
          timers.add(id);
        });
        await ctx.falar('Qual torre tem mais?');
        // a criança já escolheu (não atrapalha o retorno) ou o "Iguais" já saiu de jogo: não oferece de novo
        if (destruido || resolvida || travado || fora.has('iguais')) return;
        K.pulsar(bIguais);
        await ctx.falar('Ou são iguais?');
      })().catch(() => {});
    }

    function proximoGesto() {
      if (destruido || resolvida || travado) return null;
      if (certo === 'iguais') { const r = PC.palco.retangulo(bIguais); return { tipo: 'tocar', em: { x: r.cx, y: r.cy } }; }
      const o = opcoes[certo];
      return { tipo: 'tocar', em: { x: o.x, y: CHAO - Math.max(1, o.v) * LADO / 2 } };
    }

    /** Ajuda (2º erro): conta as duas torres juntas, nível por nível, e diz quem tem mais; a opção certa pisca. */
    async function ajudar(nivel) {
      if (nivel >= 3 || destruido || resolvida || ajudaAC) return;
      const ac = new AbortController();
      const aoSair = () => ac.abort();
      ctx.sinal.addEventListener('abort', aoSair, { once: true });
      ac.signal.addEventListener('abort', () => { if (!destruido && !ctx.sinal.aborted) PC.ui.pipoca.calar(); }, { once: true });
      ajudaAC = ac;
      K.ocupar(true);
      try {
        while (retornando) await ctx.esperar(60);
        if (ac.signal.aborted || resolvida) return;
        K.pose('aponta');
        camada.classList.add('pc-torre-vivo');          // as torres fora de jogo voltam a aparecer bem enquanto a Pipoca conta
        await K.contar(opcoes.map(o => ({ torre: o.t })), maiorV, { sinal: ac.signal });
        revelarPlacas();
        if (certo === 'iguais') K.pulsar(bIguais); else K.acender(opcoes[certo].luz);
        if (ac.signal.aborted) return;
        await ctx.falar(conclusao());
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ctx.sinal.removeEventListener('abort', aoSair);
        if (ajudaAC === ac) ajudaAC = null;
        K.ocupar(false);
        camada.classList.remove('pc-torre-vivo');
        if (!destruido && !ctx.sinal.aborted && !resolvida) K.pose('normal');
      }
    }

    function resolver() {
      if (destruido || resolvida) return;
      resolvida = true;
      if (ajudaAC) ajudaAC.abort();
      try { revelarPlacas(); } catch (e) { console.error(e); }
      ctx.acertou();
    }

    function estado() {
      return {
        modo: 'comparar', tipo: 'maior', torres: valores.slice(), iguais,
        certo: certo === 'iguais' ? 'iguais' : 'torre-' + certo,
        fora: Array.from(fora).map(f => (f === 'iguais' ? 'iguais' : 'torre-' + f)),
        travado, resolvida, ajudando: !!ajudaAC, livre: !destruido && !resolvida && !travado && !PC.toquesBloqueados(),
      };
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      timers.forEach(id => clearTimeout(id));
      timers.clear();
      if (ajudaAC) ajudaAC.abort();
      offToque();
      camada.remove();
    }

    const offToque = PC.on('toque', () => { if (ajudaAC) ajudaAC.abort(); });

    (async () => {
      try {
        await ctx.esperar(350);
        await instrucao();
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    })();

    return { instrucao, proximoGesto, ajudar, resolver, estado, destruir };
  }

  // ======================================================================== registro
  function rodada(ctx) {
    U.estilo('torre', CSS);
    const params = ctx.params || {};
    const mem = memoriaDe(params);
    const cfg = params.modo === 'comparar' ? sortearComparar(params, mem, ctx.indice) : sortearConstruir(params, mem);
    return cfg.tipo === 'maior' ? rodadaMaior(ctx, cfg) : rodadaConstruir(ctx, cfg);
  }

  PC.atividades.registrar('torre', {
    titulo: 'Torre de cubinhos',
    icone: 'torre',
    cenario: 'prado',
    totalRodadas,
    rodada,
  });
})();
