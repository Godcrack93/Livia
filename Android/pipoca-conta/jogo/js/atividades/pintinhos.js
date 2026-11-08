/* Pipoca Conta — atividade "pintinhos": quantos são? (PROJETO.md 5.6)
   Modos (params.modo):
     contar     pintinhos no terreiro; tocar em cada um marca (o já marcado só pia e não conta de novo). Com
                vozConta, a voz conta junto a cada toque e termina com o total ("Quatro pintinhos!"); sem isso, quem
                conta é a criança. Com todos marcados aparecem 3 botões grandes de algarismo e a Pipoca lê as opções
                apontando ("É três, quatro ou cinco?").
     olhadinha  a criança toca na cerca (a porteira do galinheiro) e os pintinhos aparecem por params.tempo ms,
                arrumados como dado, soltos ou no quadro de 10; depois a porteira fecha e ela escolhe o número.
                O olho de espiar mostra de novo e pulsa como primeira ajuda; depois de um erro, o tempo aumenta.
     comparar   dois cercadinhos: "Qual tem mais?" — tocar no que tem mais, ou no botão "iguais"; algumas rodadas
                têm a mesma quantidade e outras têm um cercadinho vazio ("Nenhum! Zero pintinho."). Aqui os
                pintinhos ficam sempre soltos (o arranjo vale para o contar e a olhadinha).
   Arranjos: solto (lugares sorteados, espalhados pelo cercado inteiro), dado (como as faces de um dado; de 7 a 10,
   dois dados lado a lado — no contar, de 7 a 10 vira quadro de 10, porque dois dados não cabem com alvos de 150) e
   quadro10 (enche a linha de cima e depois a de baixo). A ordem de contar é a de leitura, linha por linha.
   Regras: a opção errada sai de jogo; só o primeiro toque vale até o retorno terminar; "Quase!" só quando errou por
   um. Os pintinhos são aves (penugem creme, topetinho, bico laranja, asinha, pezinhos), nunca bolinhas com olhos, e
   nenhum número flutua sobre eles: a contagem aparece no balão da Pipoca e, no comparar, numa plaquinha presa na
   base de cada cercadinho (só depois do acerto).
   params: { modo: 'contar'|'olhadinha'|'comparar', min, max, arranjo: 'dado'|'solto'|'quadro10', tempo (ms),
             rodadas, demo, vozConta } */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  const TINTA = '#3A2A5A';
  const MAX_PINTINHOS = 15;                                   // data-teste "pintinho-0" … "pintinho-14"
  // contar: terreiro entre o balão da Pipoca (x < 570) e a coluna das opções; 5 × 4 lugares de 150 px
  const TERREIRO = { x: 550, y: 148, l: 790, a: 658 };
  const AREA_CONTAR = { x: 570, y: 166, l: 750, a: 624 };
  const TOQUE_PINTINHO = 150;                                 // área de toque de cada pintinho (≥ 140)
  const TOQUE_GRANDE = 180;                                   // com até 4 pintinhos sobra lugar: pintinhos maiores
  // olhadinha: galinheiro com porteira; o olho de espiar fica à esquerda, acima do balão
  const GALINHEIRO = { x: 580, y: 160, l: 730, a: 640 };
  const MOLDURA = 26;                                         // espessura da moldura de madeira do galinheiro
  const OLHO = { x: 480, y: 252, lado: 150 };
  // opções (algarismos): coluna à direita, de cima para baixo em ordem crescente
  const OPCOES = { x: 1440, ys: [290, 480, 670], lado: 170 };
  // comparar: dois cercadinhos e o botão "iguais" entre eles
  const CERCADOS = [{ x: 585, y: 180, l: 390, a: 550 }, { x: 1155, y: 180, l: 390, a: 550 }];
  const IGUAIS = { x: 1065, y: 455, lado: 150 };
  const PORTA_MS = 460;                                       // abrir/fechar a porteira
  const FATOR_MAX = 2.5;                                      // a olhadinha pode durar até 2,5× o tempo pedido
  const memorias = new WeakMap();                             // por estação jogada (o objeto params é o mesmo)

  const CSS = `
    .pc-pintinhos { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
    .pc-pintinhos-bloco { position: absolute; }
    .pc-pintinhos-bloco > svg { position: absolute; left: 0; top: 0; display: block; overflow: visible; pointer-events: none; }
    .pc-pintinhos-pinto { position: absolute; }
    .pc-pintinhos-tocavel { cursor: pointer; border-radius: 40px; transition: transform .08s; }
    .pc-pintinhos-tocavel.apertado { transform: scale(.94); }
    .pc-pintinhos-pula { position: absolute; transform-origin: 50% 92%; pointer-events: none; }
    .pc-pintinhos-vira, .pc-pintinhos-bica { width: 100%; height: 100%; }
    .pc-pintinhos-vira.virado { transform: scaleX(-1); }
    .pc-pintinhos-bica { transform-origin: 50% 90%; animation: pcPintinhosBica 3.2s ease-in-out infinite; }
    .pc-pintinhos-bica svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .pc-pintinhos-anel { opacity: 0; transition: opacity .2s; }
    .pc-pintinhos-marcado .pc-pintinhos-anel { opacity: 1; }
    .pc-pintinhos-halo { opacity: 0; transition: opacity .15s; }
    .pc-pintinhos-vez .pc-pintinhos-halo { opacity: 1; }
    @keyframes pcPintinhosBica { 0%, 64%, 100% { transform: rotate(0deg); } 70% { transform: rotate(10deg) translateY(2px); }
      76% { transform: rotate(1deg); } 82% { transform: rotate(8deg) translateY(2px); } 88% { transform: rotate(0deg); } }
    .pc-pintinhos-esteira { position: absolute; border-radius: 40px; background: rgba(255, 250, 230, .7); border: 5px solid rgba(58, 42, 90, .3); }
    .pc-pintinhos-quadro { position: absolute; border-radius: 24px; background: #C98F4E; border: 5px solid #3A2A5A; box-shadow: 0 7px 0 rgba(58, 42, 90, .25); }
    .pc-pintinhos-casa { position: absolute; border-radius: 16px; background: #FFF4D6; border: 4px solid #3A2A5A; }
    .pc-pintinhos-opcao { position: absolute; width: ${OPCOES.lado}px; height: ${OPCOES.lado}px; margin: 0; padding: 0 0 10px; border-radius: 42px;
      cursor: pointer; background: #fff; border: 6px solid #3A2A5A; box-shadow: 0 10px 0 #3A2A5A; color: #3A2A5A;
      font: 700 118px/1 var(--fonte); display: grid; place-items: center;
      transition: transform .18s, background-color .2s, opacity .25s, box-shadow .08s; }
    .pc-pintinhos-opcao.apertado { transform: translateY(7px); box-shadow: 0 3px 0 #3A2A5A; }
    .pc-pintinhos-opcao.lendo { background: #FFE27A; transform: scale(1.1); }
    .pc-pintinhos-opcao.certa { background: #5CC84A; color: #fff; }
    .pc-pintinhos-opcao.fora, .pc-pintinhos-redondo.fora { background: #E6E0F0; color: #C9C0DA; border-color: #A79CC0;
      box-shadow: 0 4px 0 #A79CC0; pointer-events: none; transform: translateY(5px); }
    .pc-pintinhos-redondo.fora svg { opacity: .3; }
    .pc-pintinhos-redondo { position: absolute; margin: 0; padding: 0; border-radius: 50%; cursor: pointer; background: #fff;
      border: 6px solid #3A2A5A; box-shadow: 0 9px 0 #3A2A5A; display: grid; place-items: center;
      transition: transform .18s, background-color .2s, opacity .25s, box-shadow .08s; }
    .pc-pintinhos-redondo svg { width: 96px; height: 96px; display: block; }
    .pc-pintinhos-redondo.apertado { transform: translateY(7px); box-shadow: 0 3px 0 #3A2A5A; }
    .pc-pintinhos-redondo.lendo { background: #FFE27A; transform: scale(1.1); }
    .pc-pintinhos-redondo.certa { background: #5CC84A; }
    .pc-pintinhos-iguais { background: #2EC4B6; }
    .pc-pintinhos-cercado { position: absolute; cursor: pointer; transition: opacity .25s, transform .08s; }
    .pc-pintinhos-cercado.apertado { transform: scale(.985); }
    .pc-pintinhos-cercado.fora { pointer-events: none; }
    .pc-pintinhos-cercado::after { content: ''; position: absolute; left: 4px; top: 4px; right: 4px; bottom: -6px; border-radius: 44px;
      background: rgba(233, 227, 245, .62); opacity: 0; transition: opacity .25s; pointer-events: none; }
    .pc-pintinhos-cercado.fora::after { opacity: 1; }
    .pc-pintinhos-cercado.fora.contando::after { opacity: 0; }
    .pc-pintinhos-luz { position: absolute; left: -12px; top: -12px; right: -12px; bottom: -12px; border-radius: 60px; opacity: 0;
      pointer-events: none; background: rgba(255, 226, 122, .5); box-shadow: 0 0 0 7px #FFC93C; transition: opacity .2s; }
    .pc-pintinhos-cercado.lendo .pc-pintinhos-luz, .pc-pintinhos-cercado.contando .pc-pintinhos-luz { opacity: 1; }
    .pc-pintinhos-cercado.certo .pc-pintinhos-luz { opacity: 1; background: rgba(92, 200, 74, .4); box-shadow: 0 0 0 7px #5CC84A; }
    .pc-pintinhos-placa { position: absolute; width: 0; height: 0; z-index: 4; pointer-events: none; }
    .pc-pintinhos-placa .placa-numero { left: 0; top: 0; transform: translate(-50%, -50%); min-width: 130px; padding: 8px 22px 10px; }
    .pc-pintinhos-placa .placa-numero .algarismo { font-size: 84px; }
    .pc-pintinhos-galinheiro { position: absolute; }
    .pc-pintinhos-galinheiro:not(.pc-pintinhos-aberto) .pc-pintinhos-bica { animation-play-state: paused; }
    .pc-pintinhos-dentro { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
    .pc-pintinhos-portas { position: absolute; pointer-events: none; }
    .pc-pintinhos-porta { position: absolute; top: 0; height: 100%; transition-property: transform;
      transition-timing-function: cubic-bezier(.45, .05, .3, 1); }
    .pc-pintinhos-porta svg { display: block; overflow: visible; }
    .pc-pintinhos-porta-esq { left: 0; transform-origin: 0 50%; transform: perspective(1500px) rotateY(0deg); }
    .pc-pintinhos-porta-dir { right: 0; transform-origin: 100% 50%; transform: perspective(1500px) rotateY(0deg); }
    .pc-pintinhos-aberto .pc-pintinhos-porta-esq { transform: perspective(1500px) rotateY(86deg); }
    .pc-pintinhos-aberto .pc-pintinhos-porta-dir { transform: perspective(1500px) rotateY(-86deg); }
    .pc-pintinhos-cerca { position: absolute; left: 0; top: 0; width: 100%; height: 100%; cursor: pointer; border-radius: 26px; }
  `;

  // ---------------------------------------------------------------- utilidades
  const inteiro = (v, padrao) => { const n = Math.round(Number(v)); return isFinite(n) ? n : padrao; };
  const faixa = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const ext = n => PC.voz.extenso(n);
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);
  const pintinhos = n => PC.voz.quantidade(n, 'pintinho', 'pintinhos');

  function memoriaDe(params) {
    let m = memorias.get(params);
    if (!m) { m = { saco: [], ultimo: null, plano: null, fator: 1 }; memorias.set(params, m); }
    return m;
  }

  /** Sorteia a quantidade da rodada sem repetir até passar por todas da faixa (e nunca igual à anterior). */
  function sortearQuantidade(min, max, mem, preferida) {
    if (preferida != null && preferida >= min && preferida <= max) {
      mem.saco = mem.saco.filter(v => v !== preferida);
      mem.ultimo = preferida;
      return preferida;
    }
    if (!mem.saco.length) {
      mem.saco = U.embaralhar(faixa(min, max));
      if (mem.saco.length > 1 && mem.saco[mem.saco.length - 1] === mem.ultimo) mem.saco.unshift(mem.saco.pop());
    }
    const n = mem.saco.pop();
    mem.ultimo = n;
    return n;
  }

  /** Três números seguidos que contêm n (o do meio é o mais comum: n − 1, n, n + 1), dentro de [piso, teto]. */
  function sortearOpcoes(n, piso, teto) {
    const conjuntos = [[n - 1, n, n + 1], [n - 1, n, n + 1], [n - 2, n - 1, n], [n, n + 1, n + 2]]
      .filter(c => c[0] >= piso && c[2] <= teto);
    return (conjuntos.length ? U.escolher(conjuntos) : [n, n + 1, n + 2]).slice();
  }

  /**
   * Plano das rodadas do comparar: 'mais' (quantidades diferentes), 'iguais' e 'zero' (um cercadinho vazio).
   * Com 3 rodadas ou mais há pelo menos uma de cada (o zero só se min = 0); a demonstração é um 'mais' bem fácil.
   */
  function planoComparar(total, temZero, demo) {
    const resto = [];
    if (total >= 2) resto.push('iguais');
    if (temZero && total >= 3) resto.push('zero');
    while (resto.length < total - 1) resto.push('mais');
    return demo ? ['facil'].concat(U.embaralhar(resto)) : U.embaralhar(resto.concat('mais'));
  }

  function quantidadesComparar(tipo, min, max) {
    const piso = Math.max(1, min);
    if (max < piso) return [max, max];
    if (tipo === 'iguais' || piso === max) { const v = U.aleatorio(Math.min(max, Math.max(piso, 2)), max); return [v, v]; }
    if (tipo === 'zero' && min === 0) return U.embaralhar([0, U.aleatorio(piso, max)]);
    const pares = [];
    for (let a = piso; a <= max; a++) {
      for (let b = piso; b <= max; b++) {
        const d = Math.abs(a - b);
        if (!d) continue;
        if (tipo === 'facil' ? d < 2 : d > 3) continue;
        pares.push([a, b]);
      }
    }
    if (!pares.length) { const a = U.aleatorio(piso, max - 1); return U.embaralhar([a, U.aleatorio(a + 1, max)]); }
    return U.escolher(pares);
  }

  // ---------------------------------------------------------------- posições (centros, em px virtuais)
  // Dado: pontos numa grade 3 × 3 ([coluna, linha] com -1, 0, 1), na ordem de contar (linha por linha).
  const DADO = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };

  /** Como no dado (até 6); de 7 a 10, dois grupos lado a lado: 5 (como no dado) e o resto. */
  function arranjoDado(n, cx, cy, passo, tamanho) {
    const grupos = n <= 6 ? [n] : [5, n - 5];
    const p = grupos.length === 1 ? passo : Math.round(passo * 0.67);
    const t = grupos.length === 1 ? tamanho : Math.round(tamanho * 0.8);
    const lado = 2 * p + t + 36;
    const sep = grupos.length === 1 ? 0 : lado / 2 + 10;
    const pontos = [], esteiras = [];
    grupos.forEach((g, gi) => {
      const gx = grupos.length === 1 ? cx : cx + (gi === 0 ? -sep : sep);
      const espelho = (g === 2 || g === 3) && U.aleatorio(0, 1) === 1 ? -1 : 1;
      DADO[g].forEach(([c, l]) => pontos.push({ x: gx + c * p * espelho, y: cy + l * p, tamanho: t }));
      esteiras.push({ x: gx, y: cy, lado });
    });
    return { pontos, esteiras, quadro: null };
  }

  /**
   * Soltos: cada pintinho num lugar sorteado de uma grade, mexido um pouquinho dentro do seu lugar (sem encostar no
   * vizinho). As linhas recebem quantidades quase iguais e as colunas menos usadas têm preferência: assim eles se
   * espalham pelo cercado inteiro, em vez de se amontoar numa fileira ou num canto.
   * ocupa = lado do que não pode encostar (a área de toque, no contar); tamanho = desenho do pintinho.
   */
  function arranjoSolto(n, area, colunas, linhas, ocupa, folga, tamanho) {
    const cl = area.l / colunas, ca = area.a / linhas;
    const fx = Math.max(0, Math.floor((cl - ocupa) / 2) - folga), fy = Math.max(0, Math.floor((ca - ocupa) / 2) - folga);
    n = Math.min(n, colunas * linhas);
    const porLinha = faixa(0, linhas - 1).map(() => Math.floor(n / linhas));
    U.embaralhar(faixa(0, linhas - 1)).slice(0, n % linhas).forEach(l => { porLinha[l]++; });
    const uso = faixa(0, colunas - 1).map(() => 0);
    const pontos = [];
    U.embaralhar(faixa(0, linhas - 1)).forEach(l => {
      // colunas embaralhadas e depois as menos usadas primeiro (a ordenação é estável: o sorteio desempata)
      U.embaralhar(faixa(0, colunas - 1)).sort((a, b) => uso[a] - uso[b]).slice(0, porLinha[l]).forEach(c => {
        uso[c]++;
        pontos.push({ x: area.x + (c + 0.5) * cl + U.aleatorio(-fx, fx), y: area.y + (l + 0.5) * ca + U.aleatorio(-fy, fy), tamanho: tamanho || ocupa, c, l });
      });
    });
    // ordem de contar: como se lê (linha por linha, da esquerda para a direita), a mesma do dado e do quadro de 10
    pontos.sort((a, b) => a.l - b.l || a.c - b.c);
    return { pontos, esteiras: [], quadro: null };
  }

  /** Quadro de 10: 2 linhas × 5 casas; enche a linha de cima da esquerda para a direita, depois a de baixo. */
  function arranjoQuadro(n, cx, cy, casa, tamanho) {
    const pontos = [];
    for (let i = 0; i < Math.min(n, 10); i++) {
      const c = i % 5, l = Math.floor(i / 5);
      pontos.push({ x: cx + (c - 2) * casa, y: cy + (l - 0.5) * casa, tamanho });
    }
    return { pontos, esteiras: [], quadro: { x: cx, y: cy, casa } };
  }

  // ---------------------------------------------------------------- desenhos (SVG próprio, sem filtros)
  // Pintinho de perfil, olhando para a direita (viewBox 0 0 120 120): ave com penugem creme, topetinho, bico
  // laranja, asinha, rabinho e pezinhos. Nada de número nem de rosto em bolinha.
  const SVG_PINTINHO = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle class="pc-pintinhos-halo" cx="58" cy="64" r="56" fill="rgba(255,255,255,.8)" stroke="#2EC4B6" stroke-width="7"/>
    <ellipse cx="58" cy="111" rx="34" ry="6.5" fill="rgba(58,42,90,.18)"/>
    <ellipse class="pc-pintinhos-anel" cx="57" cy="108" rx="46" ry="11.5" fill="rgba(255,201,60,.5)" stroke="#E09A00" stroke-width="5"/>
    <g fill="none" stroke="#E07B12" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M49 92 V 106 M42 109 L 49 106 L 56 109"/><path d="M66 92 V 106 M59 109 L 66 106 L 73 109"/></g>
    <path d="M27 60 L 9 50 L 15 63 L 5 67 L 24 76 Z" fill="#FFF3CF" stroke="${TINTA}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M20 72 C 20 54 38 46 56 47 C 76 48 91 58 91 75 C 91 91 75 99 56 99 C 36 99 20 89 20 72 Z" fill="#FFF3CF" stroke="${TINTA}" stroke-width="5"/>
    <ellipse cx="62" cy="83" rx="20" ry="10" fill="#FFFBEA"/>
    <path d="M73 24 C 68 13 75 7 80 14 C 80 5 89 5 88 15 C 93 9 99 13 93 22" fill="#FFF3CF" stroke="${TINTA}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="80" cy="42" r="21" fill="#FFF3CF" stroke="${TINTA}" stroke-width="5"/>
    <path d="M33 66 C 41 55 60 56 65 68 C 59 81 43 85 33 77 C 31 73 31 69 33 66 Z" fill="#FFE08A" stroke="${TINTA}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M40 71 Q 48 67 57 71 M42 77 Q 49 74 55 77" fill="none" stroke="#E2B243" stroke-width="3" stroke-linecap="round"/>
    <path d="M98 37 L 115 44 L 98 51 Z" fill="#FF9F2E" stroke="${TINTA}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M100 44 H 110" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="87" cy="38" r="5" fill="${TINTA}"/><circle cx="88.8" cy="36.2" r="1.9" fill="#fff"/>
    <ellipse cx="85" cy="51" rx="5.5" ry="3.4" fill="#FF9FA0" opacity=".55"/>
  </svg>`;

  /** Chão de grama com cerquinha de madeira em volta (vista de cima), do tamanho l × a. */
  function svgCercado(l, a, opcoes = {}) {
    const m = 12, r = opcoes.raio || 46, w = l - 2 * m, h = a - 2 * m;
    const p = [];
    p.push(`<rect x="${m + 2}" y="${m + 14}" width="${w}" height="${h}" rx="${r}" fill="rgba(58,42,90,.16)"/>`);
    p.push(`<rect x="${m}" y="${m}" width="${w}" height="${h}" rx="${r}" fill="${opcoes.chao || '#CFEAA4'}"/>`);
    p.push(`<rect x="${m + 40}" y="${m + 40}" width="${w - 80}" height="${h - 80}" rx="${Math.max(10, r - 20)}" fill="#DCF0B8" opacity=".7"/>`);
    const tufos = Math.max(4, Math.round(w * h / 30000));
    for (let i = 0; i < tufos; i++) {
      const x = U.aleatorio(m + 34, l - m - 34), y = U.aleatorio(m + 34, a - m - 34);
      p.push(`<path d="M${x - 9} ${y} q 3 -12 6 0 q 3 -15 6 0 q 3 -11 6 0" fill="#A9D77F"/>`);
    }
    for (let i = 0; i < tufos; i++) {
      const x = U.aleatorio(m + 30, l - m - 30), y = U.aleatorio(m + 30, a - m - 30);
      p.push(`<circle cx="${x}" cy="${y}" r="3.2" fill="#E2C27A"/>`);
    }
    p.push(`<rect x="${m}" y="${m}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${TINTA}" stroke-width="21"/>`);
    p.push(`<rect x="${m}" y="${m}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="#D9A35F" stroke-width="12"/>`);
    const poste = (x, y) => `<rect x="${x - 12}" y="${y - 12}" width="24" height="24" rx="6" fill="#9C6338" stroke="${TINTA}" stroke-width="4"/>`;
    const nx = Math.max(1, Math.round((w - 2 * r) / 150)), ny = Math.max(1, Math.round((h - 2 * r) / 150));
    for (let i = 0; i <= nx; i++) { const x = m + r + (w - 2 * r) * i / nx; p.push(poste(x, m), poste(x, m + h)); }
    for (let i = 0; i <= ny; i++) { const y = m + r + (h - 2 * r) * i / ny; p.push(poste(m, y), poste(m + w, y)); }
    return `<svg width="${l}" height="${a}" viewBox="0 0 ${l} ${a}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${p.join('')}</svg>`;
  }

  /**
   * Fundo do galinheiro: sombra, parede do fundo e chão de palha (a moldura vai por cima das portas). A parede é uma
   * faixa baixa: todos os pintinhos, de qualquer arranjo, ficam de pé no chão de palha.
   */
  function svgGalinheiroFundo(l, a) {
    const f = MOLDURA, w = l - 2 * f, h = a - 2 * f, parede = Math.round(h * 0.16);
    let palha = '';
    for (let i = 0; i < 22; i++) {
      const x = U.aleatorio(f + 20, l - f - 40), y = U.aleatorio(f + parede + 24, a - f - 16);
      palha += `<path d="M${x} ${y} l ${U.aleatorio(14, 26)} ${U.aleatorio(-6, 6)}" stroke="#E2BF63" stroke-width="4" stroke-linecap="round"/>`;
    }
    return `<svg width="${l}" height="${a}" viewBox="0 0 ${l} ${a}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="16" width="${l - 4}" height="${a - 4}" rx="20" fill="rgba(58,42,90,.16)"/>
      <rect x="${f}" y="${f}" width="${w}" height="${h}" fill="#F7E6AE"/>
      <rect x="${f}" y="${f}" width="${w}" height="${parede}" fill="#E8C487"/>
      <path d="M${f} ${f + parede} H ${l - f}" stroke="#C99A5B" stroke-width="5"/>
      ${palha}</svg>`;
  }

  /** Moldura de madeira do galinheiro (postes dos lados, travessa em cima e soleira embaixo). */
  function svgGalinheiroMoldura(l, a) {
    const f = MOLDURA, peca = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="#9C6338" stroke="${TINTA}" stroke-width="5"/>`;
    return `<svg width="${l}" height="${a}" viewBox="0 0 ${l} ${a}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${peca(0, 0, f + 4, a)}${peca(l - f - 4, 0, f + 4, a)}${peca(0, 0, l, f + 4)}${peca(0, a - f - 4, l, f + 4)}
      <g fill="${TINTA}"><circle cx="${f / 2 + 2}" cy="${a * 0.22}" r="4"/><circle cx="${f / 2 + 2}" cy="${a * 0.75}" r="4"/>
      <circle cx="${l - f / 2 - 2}" cy="${a * 0.22}" r="4"/><circle cx="${l - f / 2 - 2}" cy="${a * 0.75}" r="4"/></g></svg>`;
  }

  /** Uma folha da porteira: tábuas de cerca com ponta, duas travessas, a diagonal e o ferrolho no meio. */
  function svgPorta(l, a, lado) {
    const n = Math.max(4, Math.round(l / 56)), pl = l / n;
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = i * pl, cor = i % 2 ? '#D49A55' : '#DFAA66';
      s += `<path d="M${(x + 2).toFixed(1)} ${a - 2} V 30 L ${(x + pl / 2).toFixed(1)} 6 L ${(x + pl - 2).toFixed(1)} 30 V ${a - 2} Z" fill="${cor}" stroke="${TINTA}" stroke-width="4" stroke-linejoin="round"/>`;
    }
    const y1 = Math.round(a * 0.2), y2 = Math.round(a * 0.72);
    const trav = y => `<rect x="2" y="${y}" width="${l - 4}" height="32" rx="7" fill="#B47C45" stroke="${TINTA}" stroke-width="4"/>`;
    const xa = lado === 'esq' ? 22 : l - 22, xb = lado === 'esq' ? l - 22 : 22;
    s += trav(y1) + trav(y2);
    s += `<path d="M${xa} ${y2 + 4} L ${xb} ${y1 + 28}" stroke="${TINTA}" stroke-width="30" stroke-linecap="round"/>`;
    s += `<path d="M${xa} ${y2 + 4} L ${xb} ${y1 + 28}" stroke="#B47C45" stroke-width="21" stroke-linecap="round"/>`;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * pl;
      s += `<circle cx="${x.toFixed(1)}" cy="${y1 + 16}" r="3.4" fill="${TINTA}"/><circle cx="${x.toFixed(1)}" cy="${y2 + 16}" r="3.4" fill="${TINTA}"/>`;
    }
    const xf = lado === 'esq' ? l - 30 : 4;
    s += `<rect x="${xf}" y="${Math.round(a * 0.46)}" width="26" height="44" rx="8" fill="#6E5E92" stroke="${TINTA}" stroke-width="4"/>`;
    return `<svg width="${l}" height="${a}" viewBox="0 0 ${l} ${a}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
  }

  // ---------------------------------------------------------------- a rodada
  function rodada(ctx) {
    U.estilo('pintinhos', CSS);
    const params = ctx.params || {};
    const modo = ['contar', 'olhadinha', 'comparar'].indexOf(params.modo) >= 0 ? params.modo : 'contar';
    const arranjo = ['dado', 'solto', 'quadro10'].indexOf(params.arranjo) >= 0 ? params.arranjo : (modo === 'olhadinha' ? 'dado' : 'solto');
    const mem = memoriaDe(params);
    mem.fator = Math.min(mem.fator, 1.5);        // a olhadinha mais longa (depois de erros) só se estende um pouco para a próxima rodada
    const vozConta = !!params.vozConta;
    const tempoBase = U.limitar(inteiro(params.tempo, 2500), 800, 10000);
    const teto = modo === 'comparar' || arranjo !== 'solto' ? 10 : MAX_PINTINHOS;
    const piso = modo === 'comparar' ? 0 : 1;
    const minimo = U.limitar(inteiro(params.min, piso), piso, teto);
    const maximo = U.limitar(inteiro(params.max, Math.max(minimo, 1)), Math.max(minimo, 1), teto);

    let destruido = false, resolvida = false, bloqueado = false, ajudando = false, interagiu = false;
    let fase = modo === 'contar' ? 'contando' : (modo === 'olhadinha' ? 'olhar' : 'escolhendo');
    let leitura = null;              // AbortController da fala/ajuda em andamento (instrução, leitura das opções, recontagem)
    let n = 0, certa = -1, opcoes = [], pintos = [];
    let marcados = 0, ultimaFala = null;                                               // contar
    let galinheiro = null, cerca = null, bOlho = null, aberta = false, espiando = false, espiadas = 0, errouAqui = false;  // olhadinha
    let cercados = [], bIguais = null, tipoComparar = '';                              // comparar

    const camada = U.el('div', { class: 'pc-pintinhos' });
    ctx.palco.appendChild(camada);
    const vivo = () => !destruido && !resolvida && !ctx.sinal.aborted;

    // ------------------------------------------------------------ peças
    function criarPintinho(pai, pt, opcoes = {}) {
      const tam = pt.tamanho || 118, toque = opcoes.toque || 0, lado = toque || tam;
      const el = U.el('div', {
        class: 'pc-pintinhos-pinto' + (toque ? ' pc-pintinhos-tocavel' : ''),
        style: { left: (pt.x - lado / 2) + 'px', top: (pt.y - lado / 2) + 'px', width: lado + 'px', height: lado + 'px' },
      });
      const pula = U.el('div', { class: 'pc-pintinhos-pula',
        style: { left: ((lado - tam) / 2 + (pt.dx || 0)) + 'px', top: ((lado - tam) / 2 + (pt.dy || 0)) + 'px', width: tam + 'px', height: tam + 'px' } });
      const vira = U.el('div', { class: 'pc-pintinhos-vira' + (opcoes.virado ? ' virado' : '') });
      vira.appendChild(U.el('div', { class: 'pc-pintinhos-bica', html: SVG_PINTINHO,
        style: { animationDelay: -U.aleatorio(0, 3200) + 'ms', animationDuration: U.aleatorio(2700, 3900) + 'ms' } }));
      pula.appendChild(vira);
      el.appendChild(pula);
      pai.appendChild(el);
      return { el, pula, x: pt.x, y: pt.y, marcado: false };
    }
    const pular = (p, alto = 28, atraso = 0) => U.animar(p.pula, [
      { transform: 'translateY(0px) scale(1, 1)' },
      { transform: `translateY(${-alto}px) scale(.95, 1.06)`, offset: 0.4 },
      { transform: 'translateY(0px) scale(1.07, .93)', offset: 0.78 },
      { transform: 'translateY(0px) scale(1, 1)' },
    ], { duration: 400, delay: atraso, easing: 'ease-out' });
    const balancar = p => U.animar(p.pula, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-11deg)', offset: 0.3 },
      { transform: 'rotate(9deg)', offset: 0.65 }, { transform: 'rotate(0deg)' }], { duration: 380, easing: 'ease-in-out' });
    const surgir = (el, atraso) => U.animar(el, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 380, delay: atraso, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' });
    const caixa = (x, y, l, a) => ({ left: x + 'px', top: y + 'px', width: l + 'px', height: a + 'px' });

    /** Esteiras (dado) e quadro de 10 debaixo dos pintinhos. (ox, oy) = canto do pai no palco. */
    function desenharArranjo(pai, arr, ox, oy) {
      arr.esteiras.forEach(e => pai.appendChild(U.el('div', { class: 'pc-pintinhos-esteira', style: caixa(e.x - e.lado / 2 - ox, e.y - e.lado / 2 - oy, e.lado, e.lado) })));
      if (!arr.quadro) return;
      const q = arr.quadro, pad = 12, W = 5 * q.casa + 2 * pad, H = 2 * q.casa + 2 * pad;
      const quadro = U.el('div', { class: 'pc-pintinhos-quadro', style: caixa(q.x - W / 2 - ox, q.y - H / 2 - oy, W, H) });
      for (let i = 0; i < 10; i++) {
        quadro.appendChild(U.el('div', { class: 'pc-pintinhos-casa', style: caixa(pad + (i % 5) * q.casa, pad + Math.floor(i / 5) * q.casa, q.casa - 10, q.casa - 10) }));
      }
      pai.appendChild(quadro);
    }

    /** Destaca (amarelo) um elemento que a Pipoca está apontando; null apaga. */
    function destacar(el) {
      camada.querySelectorAll('.lendo').forEach(e => { if (e !== el) e.classList.remove('lendo'); });
      if (el) el.classList.add('lendo');
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
      // segura enquanto o "Quer parar?" estiver aberto e confere de novo: uma fala que ficou esperando a pausa e foi
      // substituída (a moldura repete a instrução ao continuar) não pode voltar atrasada por cima da nova
      await ctx.esperar(0);
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

    // ------------------------------------------------------------ opções (algarismos)
    function criarOpcoes(valores) {
      opcoes = valores.map((v, i) => {
        const el = U.el('button', { type: 'button', class: 'pc-pintinhos-opcao', teste: 'opcao-' + i, 'aria-label': String(v), hidden: true,
          style: caixa(OPCOES.x - OPCOES.lado / 2, OPCOES.ys[i] - OPCOES.lado / 2, OPCOES.lado, OPCOES.lado) }, String(v));
        PC.aoTocar(el, () => escolherNumero(i));
        camada.appendChild(el);
        return { el, valor: v, i, fora: false, x: OPCOES.x, y: OPCOES.ys[i] };
      });
    }
    function mostrarOpcoes() {
      PC.som.bolha();
      opcoes.forEach((o, k) => { o.el.hidden = false; surgir(o.el, k * 110); });
    }
    /** "Quantos pintinhos? É três, quatro ou cinco?" — destacando cada opção enquanto fala o número dela. */
    async function lerOpcoes(sinal, pergunta) {
      PC.ui.pipoca.pose('aponta');
      await falarEm(sinal, pergunta);
      const vivas = opcoes.filter(o => !o.fora);
      if (vivas.length === 1) {
        destacar(vivas[0].el);
        await falarEm(sinal, 'Toque no ' + ext(vivas[0].valor) + '!');
      } else {
        for (let k = 0; k < vivas.length; k++) {
          destacar(vivas[k].el);
          const ultimo = k === vivas.length - 1;
          await falarEm(sinal, (k === 0 ? 'É ' : (ultimo ? 'ou ' : '')) + ext(vivas[k].valor) + (ultimo ? '?' : ','));
        }
      }
      destacar(null);
    }

    function escolherNumero(i) {
      const op = opcoes[i];
      if (!op || op.fora || bloqueado || !vivo() || fase !== 'escolhendo') return;
      interagiu = true;
      cancelarLeitura();
      if (op.valor === n) { acertarNumero(op); return; }
      bloqueado = true;
      op.fora = true;
      op.el.classList.add('fora');
      const porUm = Math.abs(op.valor - n) === 1;
      let fala = (porUm ? 'Quase! ' : '') + 'Esse é o ' + ext(op.valor) + '.';
      if (modo === 'olhadinha') {
        errouAqui = true;
        mem.fator = Math.min(FATOR_MAX, mem.fator + 0.5);         // depois de um erro, a olhadinha dura mais
        olhoPulsar(true);
        fala += ' Espie de novo!';
      } else {
        fala += op.valor > n ? ' Tem menos pintinhos.' : ' Tem mais pintinhos.';
      }
      ctx.errou({ fala, quase: porUm, mostrar: op.valor });
      esperarRetorno();
    }

    async function acertarNumero(op) {
      fase = 'fim';
      bloqueado = true;
      ctx.ocupado(true);
      op.el.classList.add('certa');
      U.animar(op.el, [{ transform: 'scale(1)' }, { transform: 'scale(1.2)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' });
      try {
        if (modo === 'olhadinha') {
          if (!errouAqui) mem.fator = Math.max(1, mem.fator - 0.25);
          await porta(true);
        }
        pintos.forEach((p, k) => pular(p, 24, k * 50));
        PC.som.piu();
        await ctx.falar(maiuscula(pintinhos(n)) + '!', { mostrar: n });
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

    // ------------------------------------------------------------ contar
    function montarTerreiro() {
      const bloco = U.el('div', { class: 'pc-pintinhos-bloco', style: caixa(TERREIRO.x, TERREIRO.y, TERREIRO.l, TERREIRO.a), html: svgCercado(TERREIRO.l, TERREIRO.a) });
      camada.appendChild(bloco);
      U.animar(bloco, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      const A = AREA_CONTAR, cx = A.x + A.l / 2, cy = A.y + A.a / 2;
      let arr, toque = TOQUE_PINTINHO;
      // dado com mais de 6: dois dados lado a lado não cabem no terreiro com alvos de 150 → quadro de 10, com casas
      // de 144 (o quadro inteiro cabe entre as cercas do terreiro e cada casa ainda é um alvo maior que 140)
      if (arranjo === 'dado' && n <= 6) arr = arranjoDado(n, cx, cy, 165, 128);
      else if (arranjo !== 'solto') { toque = 144; arr = arranjoQuadro(n, cx, cy, 144, 116); }
      else if (n <= 4) { toque = TOQUE_GRANDE; arr = arranjoSolto(n, A, 3, 2, toque, 1, 160); }
      else if (n <= 12) arr = arranjoSolto(n, A, 4, 3, toque, 1, 132);
      else arr = arranjoSolto(n, A, 5, 4, toque, 1, 128);
      desenharArranjo(camada, arr, 0, 0);
      pintos = arr.pontos.map((pt, i) => {
        const p = criarPintinho(camada, pt, { toque, virado: arranjo === 'solto' && U.aleatorio(0, 2) === 0 });
        p.el.dataset.teste = 'pintinho-' + i;
        p.el.setAttribute('role', 'button');
        p.el.setAttribute('aria-label', 'Pintinho');
        PC.aoTocar(p.el, () => tocarPintinho(p), { som: false, intervalo: 250 });
        surgir(p.el, 80 + i * 55);
        return p;
      });
    }

    function tocarPintinho(p) {
      if (!vivo()) return;
      interagiu = true;
      PC.som.piu();
      if (p.marcado || fase !== 'contando') { balancar(p); return; }      // já marcado: só pia
      p.marcado = true;
      marcados++;
      p.el.classList.add('pc-pintinhos-marcado');
      pular(p);
      if (vozConta) {
        // em fila: com toques rápidos a voz não corta um número pelo seguinte (a contagem nunca pula número)
        const k = marcados;
        ultimaFala = (ultimaFala || Promise.resolve())
          .then(() => (vivo() ? ctx.falar(maiuscula(ext(k)), { mostrar: k }) : null))
          .catch(() => {});
      }
      if (marcados >= pintos.length) aposContar();
    }

    /** Todos marcados: (com vozConta) o total, depois os três algarismos e a pergunta. */
    async function aposContar() {
      fase = 'transicao';
      cancelarLeitura();
      ctx.ocupado(true);
      try {
        if (ultimaFala) await ultimaFala;
        if (!vivo()) return;
        if (vozConta) await ctx.falar(maiuscula(pintinhos(n)) + '!', { mostrar: n });
        await ctx.esperar(250);
        mostrarOpcoes();
        fase = 'escolhendo';
        await ctx.esperar(420);
        ctx.ocupado(false);
        falarInstrucao(false);
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    }

    // ------------------------------------------------------------ olhadinha
    function montarGalinheiro() {
      const G = GALINHEIRO, f = MOLDURA, cx = G.x + G.l / 2, cy = G.y + G.a / 2 + 8;
      galinheiro = U.el('div', { class: 'pc-pintinhos-galinheiro', style: caixa(G.x, G.y, G.l, G.a) });
      const fundo = U.el('div', { class: 'pc-pintinhos-bloco', style: caixa(0, 0, G.l, G.a), html: svgGalinheiroFundo(G.l, G.a) });
      const dentro = U.el('div', { class: 'pc-pintinhos-dentro' });
      const area = { x: G.x + f + 34, y: G.y + f + 34, l: G.l - 2 * f - 68, a: G.a - 2 * f - 60 };
      let arr;
      if (arranjo === 'quadro10') arr = arranjoQuadro(n, cx, cy, 122, 98);
      else if (arranjo === 'solto') arr = n <= 9 ? arranjoSolto(n, area, 4, 3, 116, 4) : arranjoSolto(n, area, 5, 4, 104, 3);
      else arr = arranjoDado(n, cx, cy, n <= 6 ? 150 : 120, 120);   // de 7 a 10, os dois dados cabem entre as portas abertas
      desenharArranjo(dentro, arr, G.x, G.y);
      pintos = arr.pontos.map(pt => criarPintinho(dentro, { x: pt.x - G.x, y: pt.y - G.y, dx: pt.dx, dy: pt.dy, tamanho: pt.tamanho },
        { virado: arranjo === 'solto' && U.aleatorio(0, 2) === 0 }));
      // porteira de duas folhas (gira nas dobradiças) e a moldura por cima
      const dl = (G.l - 2 * f) / 2, da = G.a - 2 * f, dur = Math.round(U.duracao(PORTA_MS)) + 'ms';
      const portas = U.el('div', { class: 'pc-pintinhos-portas', style: caixa(f, f, G.l - 2 * f, da) },
        U.el('div', { class: 'pc-pintinhos-porta pc-pintinhos-porta-esq', style: { width: dl + 'px', transitionDuration: dur }, html: svgPorta(dl, da, 'esq') }),
        U.el('div', { class: 'pc-pintinhos-porta pc-pintinhos-porta-dir', style: { width: dl + 'px', transitionDuration: dur }, html: svgPorta(dl, da, 'dir') }));
      const moldura = U.el('div', { class: 'pc-pintinhos-bloco', style: caixa(0, 0, G.l, G.a), html: svgGalinheiroMoldura(G.l, G.a) });
      cerca = U.el('div', { class: 'pc-pintinhos-cerca', teste: 'cerca', role: 'button', 'aria-label': 'Cerca dos pintinhos' });
      PC.aoTocar(cerca, () => espiar(), { som: false });
      galinheiro.append(fundo, dentro, portas, moldura, cerca);
      camada.appendChild(galinheiro);
      surgir(galinheiro, 0);
      // olho de espiar: aparece depois da primeira olhadinha
      bOlho = U.el('button', { type: 'button', class: 'pc-pintinhos-redondo', teste: 'espiar', 'aria-label': 'Espiar de novo', hidden: true,
        style: caixa(OLHO.x - OLHO.lado / 2, OLHO.y - OLHO.lado / 2, OLHO.lado, OLHO.lado), html: PC.arte.icone('olho') });
      PC.aoTocar(bOlho, () => espiar(), { som: false });
      camada.appendChild(bOlho);
    }

    function olhoPulsar(sim) { if (bOlho) bOlho.classList.toggle('toque-pulsa', !!sim && !bOlho.hidden); }
    const tempoOlhadinha = () => Math.round(tempoBase * mem.fator);

    function porta(abrir) {
      if (!galinheiro || aberta === abrir) return Promise.resolve();
      aberta = abrir;
      galinheiro.classList.toggle('pc-pintinhos-aberto', abrir);
      PC.som.pagina();
      return ctx.esperar(PORTA_MS);
    }

    /** Abre a porteira por um tempo (params.tempo, mais longo depois de erros) e fecha de novo. */
    async function espiar() {
      if (!vivo() || modo !== 'olhadinha' || aberta || espiando || ajudando || fase === 'fim') return;
      const minha = ++espiadas;
      espiando = true;
      interagiu = true;
      cancelarLeitura();
      olhoPulsar(false);
      ctx.ocupado(true);
      try {
        await porta(true);
        pintos.forEach((p, k) => pular(p, 18, k * 40));
        PC.som.piu();
        // em pedacinhos: o tempo parado no "Quer parar?" não conta (ctx.esperar segura até continuar)
        const tempo = tempoOlhadinha();
        for (let t = 0; t < tempo; t += 100) await ctx.esperar(Math.min(100, tempo - t));
        if (ajudando || fase === 'fim') return;
        await porta(false);
        espiando = false;
        if (fase === 'olhar') {
          fase = 'escolhendo';
          mostrarOpcoes();
          bOlho.hidden = false;
          surgir(bOlho, 250);
          ctx.ocupado(false);
          await ctx.esperar(450);
          falarInstrucao(false);
        }
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        if (minha === espiadas) {
          espiando = false;
          if (vivo() && fase !== 'fim' && !ajudando) ctx.ocupado(false);
        }
      }
    }

    // ------------------------------------------------------------ comparar
    function montarComparar() {
      if (!mem.plano) mem.plano = planoComparar(ctx.total, minimo === 0, !!params.demo);
      tipoComparar = mem.plano[ctx.indice % mem.plano.length] || 'mais';
      const q = quantidadesComparar(tipoComparar, minimo, maximo);
      cercados = CERCADOS.map((r, i) => {
        const el = U.el('div', { class: 'pc-pintinhos-cercado', teste: 'cercado-' + i, role: 'button', 'aria-label': 'Cercadinho ' + (i + 1), style: caixa(r.x, r.y, r.l, r.a) },
          U.el('div', { class: 'pc-pintinhos-luz' }),
          U.el('div', { class: 'pc-pintinhos-bloco', style: caixa(0, 0, r.l, r.a), html: svgCercado(r.l, r.a, { raio: 40 }) }));
        const linhas = q[i] <= 6 ? 3 : 4;
        const arr = arranjoSolto(q[i], { x: 45, y: 58, l: r.l - 90, a: r.a - 110 }, 3, linhas, 100, 2, linhas === 3 ? 94 : 88);
        const ps = arr.pontos.map(pt => criarPintinho(el, pt, { virado: U.aleatorio(0, 2) === 0 }));
        PC.aoTocar(el, () => escolherComparar(i), { som: false });
        camada.appendChild(el);
        surgir(el, 60 + i * 140);
        return { el, n: q[i], pintos: ps, fora: false, x: r.x + r.l / 2, y: r.y + r.a / 2, r };
      });
      bIguais = U.el('button', { type: 'button', class: 'pc-pintinhos-redondo pc-pintinhos-iguais', teste: 'iguais', 'aria-label': 'Iguais',
        style: caixa(IGUAIS.x - IGUAIS.lado / 2, IGUAIS.y - IGUAIS.lado / 2, IGUAIS.lado, IGUAIS.lado), html: PC.arte.icone('iguais') });
      PC.aoTocar(bIguais, () => escolherComparar(2));
      camada.appendChild(bIguais);
      surgir(bIguais, 380);
      certa = q[0] === q[1] ? 2 : (q[0] > q[1] ? 0 : 1);
    }
    const iguaisFora = () => !!bIguais && bIguais.classList.contains('fora');

    function escolherComparar(alvo) {
      if (bloqueado || !vivo() || fase !== 'escolhendo') return;
      if (alvo === 2 ? iguaisFora() : cercados[alvo].fora) return;
      interagiu = true;
      cancelarLeitura();
      if (alvo === certa) { acertarComparar(alvo); return; }
      bloqueado = true;
      const a = cercados[0].n, b = cercados[1].n;
      const porUm = a !== b && Math.abs(a - b) === 1 && a > 0 && b > 0;
      let fala, mostrar = null;
      // retorno descritivo e neutro: quanto tem em cada um (a criança compara e escolhe de novo)
      if (alvo === 2) {
        bIguais.classList.add('fora');
        fala = 'Não são iguais: ' + ext(a) + ' e ' + ext(b) + '.';
      } else {
        const c = cercados[alvo], o = cercados[1 - alvo];
        c.fora = true;
        c.el.classList.add('fora');
        if (c.n === 0) fala = 'Nenhum! Zero pintinho. O outro tem ' + ext(o.n) + '.';
        else if (c.n === o.n) fala = 'Esse tem ' + ext(c.n) + '. O outro também tem ' + ext(o.n) + '.';
        else fala = 'Esse tem ' + ext(c.n) + '. O outro tem ' + ext(o.n) + '.';
        mostrar = c.n;
      }
      ctx.errou({ fala: (porUm ? 'Quase! ' : '') + fala, quase: porUm, mostrar });
      esperarRetorno();
    }

    /** Plaquinhas presas na base dos cercadinhos, com a quantidade de cada um (depois do acerto). */
    function mostrarPlacas() {
      cercados.forEach((c, i) => {
        const pos = U.el('div', { class: 'pc-pintinhos-placa', style: { left: c.x + 'px', top: (c.r.y + c.r.a + 4) + 'px' } }, PC.ui.placaNumero(c.n, { pontos: false }));
        camada.appendChild(pos);
        U.animar(pos, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 360, delay: i * 120, easing: 'cubic-bezier(.3, 1.5, .5, 1)', fill: 'backwards' });
      });
    }

    async function acertarComparar(alvo) {
      fase = 'fim';
      bloqueado = true;
      ctx.ocupado(true);
      const a = cercados[0].n, b = cercados[1].n;
      if (alvo === 2) bIguais.classList.add('certa'); else cercados[alvo].el.classList.add('certo');
      mostrarPlacas();
      try {
        if (alvo === 2) {
          cercados.forEach(c => c.pintos.forEach((p, k) => pular(p, 22, k * 50)));
          await ctx.falar(maiuscula(ext(a)) + ' e ' + ext(b) + '. São iguais!');
        } else {
          const m = cercados[alvo].n, o = cercados[1 - alvo].n;
          cercados[alvo].pintos.forEach((p, k) => pular(p, 24, k * 50));
          if (o === 0) {
            U.animar(cercados[1 - alvo].el, [{ transform: 'scale(1)' }, { transform: 'scale(1.04)', offset: 0.5 }, { transform: 'scale(1)' }], { duration: 500 });
            await ctx.falar('Nenhum! Zero pintinho.', { mostrar: 0 });
          }
          await ctx.falar(maiuscula(ext(m)) + ' é mais que ' + ext(o) + '!');
        }
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
      terminar();
    }

    async function lerComparar(sinal) {
      PC.ui.pipoca.pose('aponta');
      cercados.forEach(c => { if (!c.fora) c.el.classList.add('lendo'); });
      await falarEm(sinal, 'Qual cercadinho tem mais pintinhos?');
      destacar(null);
      if (!iguaisFora()) {
        destacar(bIguais);
        await falarEm(sinal, 'Se forem iguais, toque aqui.');
        destacar(null);
      }
    }

    // ------------------------------------------------------------ instrução, gesto e ajuda
    /** Fala a instrução do momento. pulsar: o olho de espiar pulsa (a primeira ajuda da olhadinha). */
    function falarInstrucao(pulsar) {
      if (!vivo() || fase === 'fim' || fase === 'transicao' || bloqueado || ajudando || espiando) return Promise.resolve();
      const ac = novaLeitura(), s = ac.signal;
      return (async () => {
        try {
          if (modo === 'contar') {
            if (fase === 'contando') {
              if (!marcados) await falarEm(s, vozConta ? 'Quantos pintinhos? Toque em cada um!' : 'Quantos pintinhos? Toque em cada um e conte!');
              else {
                pintos.forEach((p, k) => { if (!p.marcado) pular(p, 20, k * 30); });
                await falarEm(s, 'Toque nos pintinhos que faltam!');
              }
            } else await lerOpcoes(s, 'Quantos pintinhos?');
          } else if (modo === 'olhadinha') {
            if (fase === 'olhar') {
              if (galinheiro) U.animar(galinheiro, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-1deg)' }, { transform: 'rotate(1deg)' }, { transform: 'rotate(0deg)' }], { duration: 420 });
              await falarEm(s, 'Toque na cerca para espiar os pintinhos!');
            } else {
              if (pulsar) olhoPulsar(true);
              await lerOpcoes(s, 'Quantos pintinhos você viu?');
            }
          } else {
            await lerComparar(s);
          }
        } catch (e) {
          if (!U.ehAbortado(e)) console.error(e);
        } finally {
          if (leitura === ac) { leitura = null; destacar(null); if (vivo()) PC.ui.pipoca.pose('normal'); }
        }
      })();
    }

    /** O gesto certo agora (px virtuais): o próximo pintinho sem marca, a cerca, a opção certa ou o cercadinho certo. */
    function proximoGesto() {
      if (!vivo() || fase === 'fim' || fase === 'transicao') return null;
      const tocar = (x, y) => ({ tipo: 'tocar', em: { x, y } });
      if (modo === 'comparar') return certa === 2 ? tocar(IGUAIS.x, IGUAIS.y) : tocar(cercados[certa].x, cercados[certa].y);
      if (modo === 'contar' && fase === 'contando') {
        const p = pintos.find(q => !q.marcado);
        return p ? tocar(p.x, p.y) : null;
      }
      if (modo === 'olhadinha' && fase === 'olhar') {
        return espiando || aberta ? null : tocar(GALINHEIRO.x + GALINHEIRO.l / 2, GALINHEIRO.y + GALINHEIRO.a / 2);
      }
      const op = opcoes[certa];
      return op && !op.el.hidden ? tocar(op.x, op.y) : null;
    }

    /** A Pipoca conta junto, um por vez: o pintinho da vez pula e o número aparece no balão. */
    const apagarVez = () => camada.querySelectorAll('.pc-pintinhos-vez').forEach(e => e.classList.remove('pc-pintinhos-vez'));
    async function contarJunto(lista, sinal) {
      for (let k = 0; k < lista.length; k++) {
        await ctx.esperar(0);                      // se o "Quer parar?" abriu, o próximo só pula depois de continuar
        if (sinal.aborted) throw U.abortado();
        apagarVez();
        lista[k].el.classList.add('pc-pintinhos-vez');
        pular(lista[k], 24);
        PC.som.contar(k + 1);
        await Promise.all([falarEm(sinal, maiuscula(ext(k + 1)), { mostrar: k + 1 }), U.esperar(600, sinal)]);
      }
      await U.esperar(150, sinal);
      apagarVez();
      await falarEm(sinal, maiuscula(pintinhos(lista.length)) + '!', { mostrar: lista.length });
    }

    /** Ajuda que ensina (2º erro seguido): recontar destacando um pintinho por vez (no comparar, os dois cercadinhos). */
    async function ajudar(nivel) {
      if (nivel !== 2 || !vivo() || ajudando || fase === 'fim' || fase === 'transicao') return;
      const ac = novaLeitura(), s = ac.signal;
      ajudando = true;
      bloqueado = false;
      ctx.ocupado(true);
      try {
        PC.ui.pipoca.pose('aponta');
        if (modo === 'olhadinha') await porta(true);
        await falarEm(s, 'Vamos contar juntos!');
        if (modo === 'comparar') {
          for (const c of cercados) {
            c.el.classList.add('contando');
            if (c.n === 0) await falarEm(s, 'Nenhum! Zero pintinho.', { mostrar: 0 });
            else await contarJunto(c.pintos, s);
            c.el.classList.remove('contando');
            await U.esperar(300, s);
          }
        } else {
          await contarJunto(pintos, s);
          if (modo === 'olhadinha') await U.esperar(700, s);
        }
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ajudando = false;
        apagarVez();
        cercados.forEach(c => c.el.classList.remove('contando'));
        const minha = leitura === ac;
        if (minha) leitura = null;
        if (vivo() && fase !== 'fim') {
          if (minha) { destacar(null); PC.ui.pipoca.pose('normal'); }
          if (modo === 'olhadinha' && aberta && !espiando) porta(false).catch(() => {});
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
      try {
        pintos.forEach(p => { if (modo === 'contar') { p.marcado = true; p.el.classList.add('pc-pintinhos-marcado'); } });
        if (modo === 'comparar') {
          if (certa === 2) bIguais.classList.add('certa'); else cercados[certa].el.classList.add('certo');
        } else {
          opcoes.forEach(o => { o.el.hidden = false; });
          if (opcoes[certa]) opcoes[certa].el.classList.add('certa');
          if (galinheiro) { aberta = true; galinheiro.classList.add('pc-pintinhos-aberto'); }
        }
      } catch (e) { console.error(e); }
      ctx.acertou();
    }

    function estado() {
      const nomes = ['cercado-0', 'cercado-1', 'iguais'];
      return {
        modo, arranjo, fase, bloqueado, ajudando, resolvida,
        resposta: modo === 'comparar' ? nomes[certa] : n,
        certa, tipo: tipoComparar || null,
        quantidades: cercados.map(c => c.n),
        pintinhos: pintos.length, marcados,
        opcoes: opcoes.map(o => o.valor), opcoesVisiveis: opcoes.length ? !opcoes[0].el.hidden : false,
        fora: modo === 'comparar' ? nomes.filter((_, i) => (i === 2 ? iguaisFora() : cercados[i].fora)) : opcoes.filter(o => o.fora).map(o => 'opcao-' + o.i),
        errada: modo === 'comparar' ? nomes.find((_, i) => i !== certa && !(i === 2 ? iguaisFora() : cercados[i].fora)) || null
          : ((opcoes.find(o => o.i !== certa && !o.fora) || {}).i != null ? 'opcao-' + opcoes.find(o => o.i !== certa && !o.fora).i : null),
        aberta, espiando, espiadas, tempo: modo === 'olhadinha' ? tempoOlhadinha() : null,
      };
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      cancelarLeitura();
      camada.remove();
    }

    // ------------------------------------------------------------ montar e começar
    if (modo === 'comparar') montarComparar();
    else {
      n = sortearQuantidade(minimo, maximo, mem, ctx.demo ? U.limitar(3, minimo, maximo) : null);
      // as opções não passam do maior número da estação (nem de dez): na estação de 5 a 10 nunca aparece o onze
      const valores = sortearOpcoes(n, 1, Math.max(maximo, 10));
      certa = valores.indexOf(n);
      if (modo === 'contar') montarTerreiro(); else montarGalinheiro();
      criarOpcoes(valores);
    }

    // a instrução e, na primeira rodada com demo, a mãozinha mostra uma vez o gesto
    (async () => {
      try {
        await ctx.esperar(350);
        await falarInstrucao(false);
        if (ctx.demo && !interagiu && vivo()) {
          const g = proximoGesto();
          if (g) ctx.dica(g.em, null);
        }
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    })();

    return { instrucao: () => falarInstrucao(true), proximoGesto, ajudar, resolver, estado, destruir };
  }

  PC.atividades.registrar('pintinhos', {
    titulo: 'Quantos pintinhos?',
    icone: 'pintinhos',
    cenario: 'prado',
    totalRodadas: params => U.limitar(inteiro(params && params.rodadas, 4), 1, 10),
    rodada,
  });
})();
