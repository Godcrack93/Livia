/* Pipoca Conta — arte desenhada em código (SVG). Dono: agente de arte (histórico em HISTORICO-ARTE.md).
   PC.arte.pipoca(pose)   -> texto SVG da capivara Pipoca (viewBox 0 0 250 270). Poses: normal, fala, feliz, aponta,
                             pensa, danca, acena. Classes que o CSS do núcleo usa: pip-boca-aberta, pip-boca-fechada,
                             pip-olhos, pip-piscar, pip-braco-aceno (o braço que acena gira em volta de 184,180).
   PC.arte.icone(nome)    -> texto SVG de um ícone (viewBox 0 0 64 64, contorno #3A2A5A). Lista: PC.arte.nomesIcones().
                             Nome desconhecido: círculo com "?" (e aviso no console só com PC.config.debug).
   PC.arte.cenario(nome, opcoes) -> elemento .cenario que cobre a tela inteira: prado, lagoa, floresta ou ceu.
                             Coordenadas = palco virtual 1600×900; o desenho continua além das bordas (sangria) e o
                             chão fica em y ≈ 800 (PC.layout.chao). opcoes (opcional): { sol: false } tira o sol.
                             Nome desconhecido: prado (e aviso no console só com PC.config.debug).
   PC.arte.mao()          -> texto SVG da mãozinha de dica.
   PC.arte.logo()         -> HTML do logo "Pipoca Conta" (letras coloridas; o pingo do i é a flor de ipê).
   PC.arte.flor()         -> texto SVG da flor de ipê-amarelo (a marca da Pipoca), viewBox -32 -32 64 64.
   PC.arte.cores          -> cores da Pipoca. PC.arte.nomesIcones() / nomesCenarios() / poses() -> listas de nomes.
   PC.arte.novoId(prefixo) -> id único para <defs> (gradientes, máscaras) de quem desenha SVG.
   Tudo aqui é desenho original, feito só a partir do PROJETO.md (seções 2 e 3). Sem filtros SVG: sombra é elipse. */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;
  const T = '#3A2A5A';                                   // contorno (o mesmo de PC.estilo.contorno)
  let uid = 0;
  const novoId = p => (p || 'pc-arte-') + (++uid);

  // ======================================================================== cores da Pipoca (ficha: PROJETO.md 3)
  const C = {
    corpo: '#C98A55',        // caramelo
    sombra: '#A9703F',       // orelhas, patinhas, pés
    barriga: '#EBC594',      // barriguinha clara
    focinho: '#8A5634',      // focinho largo e escuro
    orelha: '#7A4A2A',       // dentro da orelha
    rosto: '#D49862',        // (reserva) tom do rosto
    pinta: '#A97049',        // pontinhos dos bigodes no focinho
    narina: '#2B1A2E',       // narinas (mais escuras que o contorno, para aparecer no focinho escuro)
    bochecha: '#FF8FA0',
    boca: '#4A1F2A', lingua: '#FF8C8C', dente: '#FFFFFF',
    flor: '#FFD23F', florVeio: '#F2B21B', florMiolo: '#F08A1C', florRisco: '#B8461B',
  };

  // ======================================================================== flor de ipê-amarelo (a marca da Pipoca)
  // Cinco pétalas franzidas, cada uma com uma covinha na ponta (como a flor de ipê, que é uma corneta de 5 lóbulos),
  // um veio dourado em cada pétala e o miolo laranja com risquinhos avermelhados.
  const PETALA = 'M0 -3 C -8 -6 -14 -13 -13 -20 C -12 -27 -5 -29 0 -24 C 5 -29 12 -27 13 -20 C 14 -13 8 -6 0 -3 Z';
  function florInterna(traco) {
    const w = traco || 3;
    let s = '';
    for (let i = 0; i < 5; i++) {
      s += `<g transform="rotate(${i * 72})"><path d="${PETALA}" fill="${C.flor}" stroke="${T}" stroke-width="${w}" stroke-linejoin="round"/>` +
        `<path d="M0 -8 V -19" stroke="${C.florVeio}" stroke-width="${w * 0.8}" stroke-linecap="round"/></g>`;
    }
    s += `<circle r="7" fill="${C.florMiolo}" stroke="${T}" stroke-width="${w}"/>` +
      `<path d="M0 -2.5 V -5 M2.4 0.8 L 4.6 1.6 M-2.4 0.8 L -4.6 1.6" stroke="${C.florRisco}" stroke-width="1.6" stroke-linecap="round"/>` +
      `<circle cx="-2.2" cy="-2.6" r="1.6" fill="#FFE9A8"/>`;
    return s;
  }
  /** Flor de ipê sozinha (logo, abertura, enfeites). viewBox -32 -32 64 64. */
  function flor() {
    return `<svg viewBox="-32 -32 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${florInterna(3)}</svg>`;
  }

  // ======================================================================== Pipoca
  // De frente, em pé, como um bichinho de pelúcia (viewBox 0 0 250 270):
  //   cabeça   x 29..221, y 30..162 — retângulo bem arredondado, mais largo que alto (192 × 132, cantos de raio 46),
  //            com o alto reto: a cabeça "de caixote" da capivara
  //   focinho  x 42..208, y 96..169 — bloco largo e escuro na metade de baixo do rosto; embaixo ele passa um pouco
  //            da borda da cabeça (é o nariz grande e rombudo da capivara visto de frente)
  //   narinas  no alto do focinho, bem separadas; boca de roedor (risquinho + "w") e os dois dentinhos da frente
  //   olhos    pequenos e calmos em (84, 80) e (166, 80); orelhinhas redondas nos cantos de cima
  //   ombros   (66, 180) e (184, 180) — o braço que acena gira em volta de (184, 180) (CSS do núcleo); as patinhas
  //            apoiadas na barriga saem de (76, 178) e (174, 178), mais para dentro, para a raiz ficar dentro do corpo
  //   chão     y ≈ 263 (sombra em elipse; os pés pisam ali)
  const CAB = { x: 29, y: 30, l: 192, a: 132, r: 46 };
  const FOCINHO = 'M46 121 C 46 104 84 96 125 96 C 166 96 204 104 204 121 L 207 142 C 209 160 197 169 178 169 L 72 169 C 53 169 41 160 43 142 Z';
  const CORPO = 'M52 214 C 50 172 84 147 125 147 C 166 147 200 172 198 214 C 196 245 166 257 125 257 C 84 257 54 245 52 214 Z';
  const OMBRO = { e: [66, 180], d: [184, 180], be: [76, 178], bd: [174, 178], queixo: [172, 184] };
  const f1 = n => (Math.round(n * 10) / 10).toString();

  // pata da frente: cápsula curta e grossa; a raiz não tem contorno (some no corpo) e a ponta tem dois risquinhos
  // separando os dedinhos. ombro: 'e' | 'd' (dos lados), 'be' | 'bd' (patinha apoiada na barriga) ou 'queixo'.
  function braco(x1, y1, ombro, classe) {
    const [x0, y0] = OMBRO[ombro] || OMBRO.d;
    const L = Math.hypot(x1 - x0, y1 - y0) || 1;
    const ux = (x1 - x0) / L, uy = (y1 - y0) / L, vx = -uy, vy = ux, r = 12;
    // ponto a partir de (x, y): a ao lado (perpendicular) e b na direção do braço
    const P = (x, y, a, b) => `${f1(x + vx * a + ux * b)} ${f1(y + vy * a + uy * b)}`;
    const a1 = P(x0, y0, r, 0), b1 = P(x1, y1, r, 0), b2 = P(x1, y1, -r, 0), a2 = P(x0, y0, -r, 0);
    const dedos = [-4.3, 4.3].map(k => `M${P(x1, y1, k, 5)} L ${P(x1, y1, k, 10)}`).join(' ');
    return `<g${classe ? ` class="${classe}"` : ''}>` +
      `<path d="M${a1} L ${b1} A ${r} ${r} 0 0 0 ${b2} L ${a2} A ${r} ${r} 0 0 0 ${a1} Z" fill="${C.corpo}"/>` +
      `<path d="M${a1} L ${b1} A ${r} ${r} 0 0 0 ${b2} L ${a2}" fill="none" stroke="${T}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${dedos}" stroke="${T}" stroke-width="2.6" stroke-linecap="round" opacity=".7"/></g>`;
  }

  // camadas dos braços: fundo = atrás do corpo inteiro (só aparece o que sai dele); atras = por cima do corpo e da
  // barriga, mas atrás da cabeça; frente = por cima de tudo (rosto e corpo)
  const POSES = {
    normal: { atras: [[92, 210, 'be'], [158, 210, 'bd']] },
    fala: { atras: [[92, 210, 'be']], frente: [[214, 154, 'd']] },
    feliz: { atras: [[28, 146, 'e'], [222, 146, 'd']], olhos: 'felizes', boca: 'sorriso' },
    aponta: { atras: [[92, 210, 'be']], frente: [[237, 168, 'd']], olhar: [3.5, 0] },
    pensa: { atras: [[92, 210, 'be']], frente: [[148, 162, 'queixo']], olhar: [-1, -4], sobrancelhas: true, bolhas: true },
    // dança: um braço para cima e o outro para baixo, do outro lado (o passo de dança), e o pé direito chutando
    danca: { atras: [[24, 136, 'e']], fundo: [[232, 204, 'd']], olhos: 'felizes', boca: 'sorriso', pe: true },
    acena: { atras: [[92, 210, 'be']], frente: [[220, 134, 'd', 'pip-braco-aceno']] },
  };

  // olhinho calmo: o alto num arco baixo (pálpebra tranquila de capivara) e o embaixo redondo
  const olho = (x, y) => `M${x - 8.5} ${y - 2.5} C ${x - 7.5} ${y - 8.5} ${x + 7.5} ${y - 8.5} ${x + 8.5} ${y - 2.5} C ${x + 9.5} ${y + 5.5} ${x + 4.8} ${y + 10} ${x} ${y + 10} C ${x - 4.8} ${y + 10} ${x - 9.5} ${y + 5.5} ${x - 8.5} ${y - 2.5} Z`;
  function olhos(cfg) {
    if (cfg.olhos === 'felizes') {
      return `<g class="pip-olhos"><path d="M74 85 Q 84 72 94 85 M156 85 Q 166 72 176 85" fill="none" stroke="${T}" stroke-width="6" stroke-linecap="round"/></g>`;
    }
    const [ox, oy] = cfg.olhar || [0, 0];
    const e = 84 + ox, d = 166 + ox, y = 80 + oy;
    return `<g class="pip-olhos pip-piscar">` +
      `<path d="${olho(e, y)}" fill="${T}"/><path d="${olho(d, y)}" fill="${T}"/>` +
      `<circle cx="${e + 3}" cy="${y - 1.5}" r="3.2" fill="#fff"/><circle cx="${d + 3}" cy="${y - 1.5}" r="3.2" fill="#fff"/>` +
      `<circle cx="${e - 3}" cy="${y + 5.2}" r="1.5" fill="#fff" opacity=".8"/><circle cx="${d - 3}" cy="${y + 5.2}" r="1.5" fill="#fff" opacity=".8"/></g>`;
  }

  // dois dentinhos de roedor (a capivara é o maior roedor do mundo)
  const dentes = (y, h) => `<rect x="118.8" y="${y}" width="5.8" height="${h}" rx="1.6" fill="${C.dente}" stroke="${T}" stroke-width="1.8"/>` +
    `<rect x="125.4" y="${y}" width="5.8" height="${h}" rx="1.6" fill="${C.dente}" stroke="${T}" stroke-width="1.8"/>`;
  function boca(cfg) {
    const fechada = cfg.boca === 'sorriso'
      ? `<g class="pip-boca-fechada"><path d="M104 129 Q 125 163 146 129 Z" fill="${C.boca}" stroke="${T}" stroke-width="4.5" stroke-linejoin="round"/>` +
        `<ellipse cx="125" cy="141" rx="8" ry="4" fill="${C.lingua}"/>${dentes(129.5, 7.5)}</g>`
      : `<g class="pip-boca-fechada">${dentes(129.5, 8.5)}` +
        `<path d="M108 128 Q 116.5 138 125 129.5 Q 133.5 138 142 128" fill="none" stroke="${T}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    const aberta = `<g class="pip-boca-aberta"><ellipse cx="125" cy="139" rx="12.5" ry="10.5" fill="${C.boca}" stroke="${T}" stroke-width="4.5"/>` +
      `<ellipse cx="125" cy="144.4" rx="7" ry="3.6" fill="${C.lingua}"/>${dentes(129.6, 6)}</g>`;
    return fechada + aberta;
  }

  // pé de capivara visto de frente: almofadinha com três dedinhos
  function pe(cx, cy, giro) {
    return `<g${giro ? ` transform="rotate(${giro} ${cx} ${cy})"` : ''}>` +
      `<path d="M${cx - 23} ${cy + 1} C ${cx - 23} ${cy - 9} ${cx - 13} ${cy - 12} ${cx} ${cy - 12} C ${cx + 13} ${cy - 12} ${cx + 23} ${cy - 9} ${cx + 23} ${cy + 1} C ${cx + 23} ${cy + 8} ${cx + 13} ${cy + 10} ${cx} ${cy + 10} C ${cx - 13} ${cy + 10} ${cx - 23} ${cy + 8} ${cx - 23} ${cy + 1} Z" fill="${C.sombra}" stroke="${T}" stroke-width="5"/>` +
      `<path d="M${cx - 7} ${cy + 2} V ${cy + 8} M${cx + 7} ${cy + 2} V ${cy + 8}" stroke="${T}" stroke-width="2.8" stroke-linecap="round" opacity=".7"/></g>`;
  }

  /** A Pipoca numa pose: normal, fala, feliz, aponta, pensa, danca, acena. Texto SVG, viewBox 0 0 250 270. */
  function pipoca(pose) {
    const cfg = POSES[pose] || POSES.normal;
    const feliz = cfg.boca === 'sorriso';
    // na dança, o pé direito chuta para o lado: sai de trás do corpo, inclinado para cima
    const pes = cfg.pe ? pe(94, 253) : pe(94, 253) + pe(156, 253);
    const peLevantado = cfg.pe ? pe(207, 233, -34) : '';
    const camada = lista => (lista || []).map(b => braco(b[0], b[1], b[2], b[3])).join('');
    const fundo = camada(cfg.fundo), atras = camada(cfg.atras), frente = camada(cfg.frente);
    const sobrancelhas = cfg.sobrancelhas
      ? `<path d="M72 63 Q 84 58 96 63 M154 59 Q 166 50 178 57" fill="none" stroke="${T}" stroke-width="4.5" stroke-linecap="round"/>` : '';
    const bolhas = cfg.bolhas
      ? `<g fill="#fff" stroke="${T}" stroke-width="3.5"><circle cx="26" cy="36" r="5.5"/><circle cx="12" cy="16" r="8.5"/></g>` : '';
    // pontinhos dos bigodes (3 de cada lado do focinho)
    const pintas = [[62, 128], [70, 139], [57, 143], [188, 128], [180, 139], [193, 143]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${C.pinta}"/>`).join('');
    return `<svg viewBox="0 0 250 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<ellipse cx="125" cy="263" rx="90" ry="8" fill="rgba(58,42,90,.18)"/>` + peLevantado + fundo +
      // corpo de barril e barriguinha clara; o contorno vem depois dos braços de trás (a raiz deles some no corpo)
      `<path d="${CORPO}" fill="${C.corpo}"/>` +
      `<ellipse cx="125" cy="218" rx="45" ry="32" fill="${C.barriga}"/>` +
      atras +
      `<path d="${CORPO}" fill="none" stroke="${T}" stroke-width="5"/>` +
      pes +
      `<g class="pip-cabeca">` +
        // orelhinhas redondas nos cantos de cima (atrás da cabeça)
        `<ellipse cx="59" cy="34" rx="15" ry="13" transform="rotate(-28 59 34)" fill="${C.sombra}" stroke="${T}" stroke-width="5"/>` +
        `<ellipse cx="191" cy="34" rx="15" ry="13" transform="rotate(28 191 34)" fill="${C.sombra}" stroke="${T}" stroke-width="5"/>` +
        `<ellipse cx="57.5" cy="31.5" rx="7.5" ry="6" transform="rotate(-28 57.5 31.5)" fill="${C.orelha}"/>` +
        `<ellipse cx="192.5" cy="31.5" rx="7.5" ry="6" transform="rotate(28 192.5 31.5)" fill="${C.orelha}"/>` +
        // cabeça grande, retângulo bem arredondado
        `<rect x="${CAB.x}" y="${CAB.y}" width="${CAB.l}" height="${CAB.a}" rx="${CAB.r}" fill="${C.corpo}" stroke="${T}" stroke-width="5"/>` +
        `<ellipse cx="90" cy="48" rx="32" ry="8.5" fill="#fff" opacity=".18" transform="rotate(-6 90 48)"/>` +
        `<ellipse cx="52" cy="103" rx="11" ry="7" fill="${C.bochecha}" opacity=".45"/><ellipse cx="198" cy="103" rx="11" ry="7" fill="${C.bochecha}" opacity=".45"/>` +
        olhos(cfg) + sobrancelhas +
        // focinho largo e escuro na metade de baixo do rosto
        `<path d="${FOCINHO}" fill="${C.focinho}" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>` +
        `<path d="M76 109 Q 125 97 174 109" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="5" stroke-linecap="round"/>` +
        // narinas no alto do focinho, bem separadas: ovais deitadas e menores que os olhos. Inclinadas elas viravam
        // um segundo par de olhos (bravos) dentro do focinho; deitadas, leem como as narinas largas da capivara.
        `<ellipse cx="105.5" cy="111" rx="6.6" ry="4" fill="${C.narina}"/>` +
        `<ellipse cx="144.5" cy="111" rx="6.6" ry="4" fill="${C.narina}"/>` +
        pintas +
        `<path d="M125 118 V ${feliz ? 129 : 130}" stroke="${T}" stroke-width="4.5" stroke-linecap="round"/>` +
        boca(cfg) +
        // flor de ipê: SEMPRE do lado direito da cabeça (de quem olha), presa junto da orelha
        `<g class="pip-flor" transform="translate(206 56) rotate(14) scale(.84)">${florInterna(3.4)}</g>` +
      `</g>` +
      frente + bolhas +
      `</svg>`;
  }

  // ======================================================================== ícones (viewBox 0 0 64 64)
  const cuboMini = (x, y, cor, l = 18) =>
    `<rect x="${x}" y="${y}" width="${l}" height="${l}" rx="4" fill="${cor}" stroke="${T}" stroke-width="3.5"/>` +
    `<rect x="${x + l / 2 - 4}" y="${y - 5}" width="8" height="5" rx="2" fill="${cor}" stroke="${T}" stroke-width="3"/>`;
  // traço grosso com contorno (sinais e setas que precisam aparecer em fundo claro e escuro)
  const contornado = (d, cor, largura = 8, borda = 4.5) =>
    `<path d="${d}" fill="none" stroke="${T}" stroke-width="${largura + 2 * borda}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${largura}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const notas = cor =>
    `<path d="M24 46 V 17 M50 40 V 11" stroke="${T}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M24 17 L 50 11" stroke="${T}" stroke-width="9" stroke-linecap="round"/>` +
    `<ellipse cx="17.5" cy="47" rx="8.5" ry="6.8" transform="rotate(-20 17.5 47)" fill="${cor}" stroke="${T}" stroke-width="4.5"/>` +
    `<ellipse cx="43.5" cy="41" rx="8.5" ry="6.8" transform="rotate(-20 43.5 41)" fill="${cor}" stroke="${T}" stroke-width="4.5"/>`;
  const corpoCadeado = cor =>
    `<rect x="14" y="27" width="36" height="28" rx="7" fill="${cor}" stroke="${T}" stroke-width="5"/>` +
    `<circle cx="32" cy="39" r="4.5" fill="${T}"/><path d="M32 41 V 47" stroke="${T}" stroke-width="4" stroke-linecap="round"/>`;

  const ICONES = {
    voltar: `<path d="M38 13 L 19 32 L 38 51" fill="none" stroke="${T}" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    casa: `<rect x="15" y="28" width="34" height="27" rx="3" fill="#FFC93C" stroke="${T}" stroke-width="5"/>
      <path d="M27 55 V 45 a5 5 0 0 1 10 0 V 55 Z" fill="#fff" stroke="${T}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M8 31 L 32 10 L 56 31 Z" fill="#FF7A6B" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>`,
    falar: `<path d="M10 25 H 20 L 32 14 V 50 L 20 39 H 10 Z" fill="#FFC93C" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M40 24 Q 46 32 40 40 M46 18 Q 56 32 46 46" fill="none" stroke="${T}" stroke-width="5" stroke-linecap="round"/>`,
    album: `<rect x="12" y="10" width="40" height="46" rx="6" fill="#FF8FC2" stroke="${T}" stroke-width="5"/>
      <path d="M20 10 V 56" stroke="${T}" stroke-width="4"/>
      <path d="M36 22 L 39.5 29 L 47 30 L 41.5 35 L 43 42.5 L 36 39 L 29 42.5 L 30.5 35 L 25 30 L 32.5 29 Z" fill="#FFC93C" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>`,
    livre: cuboMini(10, 38, '#9B7BFF') + cuboMini(30, 38, '#2EC4B6') + cuboMini(20, 16, '#FFC93C'),
    cadeado: `<path d="M21 28 V 20 A 11 11 0 0 1 43 20 V 28" fill="none" stroke="${T}" stroke-width="6"/>` + corpoCadeado('#B9B3CC'),
    'cadeado-ouro': `<path d="M21 28 V 20 A 11 11 0 0 1 43 20 V 28" fill="none" stroke="${T}" stroke-width="6"/>` + corpoCadeado('#FFC93C'),
    'cadeado-aberto': `<path d="M21 28 V 13 A 11 11 0 0 1 43 13 V 17" fill="none" stroke="${T}" stroke-width="6" stroke-linecap="round"/>` + corpoCadeado('#B9B3CC'),
    estrela: `<path d="M32 8 L 39 23 L 55 25 L 43 36 L 46 52 L 32 44 L 18 52 L 21 36 L 9 25 L 25 23 Z" fill="#FFC93C" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>`,
    play: `<path d="M22 14 L 50 32 L 22 50 Z" fill="#fff" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>`,
    check: contornado('M14 34 L 27 47 L 51 19', '#fff', 8, 4.5),
    pronto: contornado('M13 34 L 27 48 L 52 18', '#fff', 9, 4.5),
    x: `<path d="M18 18 L 46 46 M46 18 L 18 46" stroke="${T}" stroke-width="8" stroke-linecap="round"/>`,
    fechar: contornado('M19 19 L 45 45 M45 19 L 19 45', '#FF7A6B', 8, 4.5),
    mais: contornado('M32 13 V 51 M13 32 H 51', '#fff', 8, 4.5),
    menos: contornado('M13 32 H 51', '#fff', 8, 4.5),
    iguais: contornado('M15 21 H 49 M15 43 H 49', '#fff', 7, 4.5),
    repetir: `<path d="M48 34 A 16 16 0 1 1 40 20.1" fill="none" stroke="${T}" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M48.5 25 L 36 27.5 L 43.5 13.5 Z" fill="${T}" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>`,
    olho: `<path d="M6 32 Q 32 8 58 32 Q 32 56 6 32 Z" fill="#fff" stroke="${T}" stroke-width="5" stroke-linejoin="round"/><circle cx="32" cy="32" r="9" fill="${T}"/><circle cx="35" cy="29" r="3" fill="#fff"/>`,
    limpar: `<path d="M38 8 L 30 30" stroke="${T}" stroke-width="6" stroke-linecap="round"/>
      <path d="M18 30 H 42 L 46 54 H 14 Z" fill="#FFC93C" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M22 40 V 52 M30 40 V 52 M38 40 V 52" stroke="${T}" stroke-width="3"/>`,
    engrenagem: `<g transform="translate(32 32)">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="-5" y="-26" width="10" height="12" rx="3" fill="#B9B3CC" stroke="${T}" stroke-width="3.5" transform="rotate(${a})"/>`).join('')}
      <circle r="17" fill="#B9B3CC" stroke="${T}" stroke-width="5"/><circle r="6" fill="#fff" stroke="${T}" stroke-width="4"/></g>`,
    som: notas('#9B7BFF'),
    'som-desligado': notas('#D9D4E6') + contornado('M11 11 L 53 53', '#FF7A6B', 6, 4),
    voz: `<path d="M12 12 H 52 A 8 8 0 0 1 60 20 V 38 A 8 8 0 0 1 52 46 H 28 L 15 56 L 18 46 H 12 A 8 8 0 0 1 4 38 V 20 A 8 8 0 0 1 12 12 Z" fill="#fff" stroke="${T}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M16 29 V 29 M24 24 V 34 M32 19 V 39 M40 23 V 35 M48 28 V 30" stroke="#9B7BFF" stroke-width="5.5" stroke-linecap="round"/>`,
    relogio: `<circle cx="15" cy="14" r="7" fill="#FFC93C" stroke="${T}" stroke-width="4"/><circle cx="49" cy="14" r="7" fill="#FFC93C" stroke="${T}" stroke-width="4"/>
      <circle cx="32" cy="35" r="24" fill="#4DA3FF" stroke="${T}" stroke-width="5"/><circle cx="32" cy="35" r="16.5" fill="#fff"/>
      <path d="M32 35 V 24 M32 35 L 40.5 39" stroke="${T}" stroke-width="4.5" stroke-linecap="round"/><circle cx="32" cy="35" r="3" fill="${T}"/>`,
    info: `<circle cx="32" cy="32" r="25" fill="#4DA3FF" stroke="${T}" stroke-width="5"/>
      <circle cx="32" cy="19.5" r="4.8" fill="#fff"/><rect x="27.5" y="27" width="9" height="22" rx="4.5" fill="#fff"/>`,
    balde: `<path d="M11 31 C 11 2 53 2 53 31" fill="none" stroke="${T}" stroke-width="4"/>` +
      cuboMini(16, 13, '#9B7BFF', 15) + cuboMini(33, 10, '#FFC93C', 15) +
      `<path d="M10 28 H 54 L 48 57 H 16 Z" fill="#2EC4B6" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="7" y="23" width="50" height="9" rx="4.5" fill="#7FE0D6" stroke="${T}" stroke-width="4.5"/>
      <path d="M15 44 H 49" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>`,
    alca: `<path d="M32 3 L 22 14 H 42 Z M32 61 L 22 50 H 42 Z" fill="${T}" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="13" y="19" width="38" height="26" rx="9" fill="#FF9F43" stroke="${T}" stroke-width="5"/>
      <path d="M23 27 H 41 M23 32 H 41 M23 37 H 41" stroke="${T}" stroke-width="3.2" stroke-linecap="round"/>`,
    adulto: `<circle cx="23" cy="17" r="9" fill="#9B7BFF" stroke="${T}" stroke-width="4.5"/>
      <path d="M9 56 V 42 A 14 14 0 0 1 37 42 V 56 Z" fill="#9B7BFF" stroke="${T}" stroke-width="4.5" stroke-linejoin="round"/>
      <circle cx="46" cy="31" r="7" fill="#FFC93C" stroke="${T}" stroke-width="4.5"/>
      <path d="M36 56 V 49 A 10 10 0 0 1 56 49 V 56 Z" fill="#FFC93C" stroke="${T}" stroke-width="4.5" stroke-linejoin="round"/>`,
    // ícones das atividades (a torre de três é toda roxa, como no padrão de 5 em 5 do jogo)
    torre: cuboMini(23, 42, '#9B7BFF') + cuboMini(23, 24, '#9B7BFF') + cuboMini(23, 6, '#9B7BFF'),
    juntar: cuboMini(6, 40, '#4DA3FF', 16) + cuboMini(6, 22, '#4DA3FF', 16) + cuboMini(42, 40, '#FF8FC2', 16) +
      `<path d="M26 34 H 38 M32 28 V 40" stroke="${T}" stroke-width="5" stroke-linecap="round"/>`,
    separar: cuboMini(10, 40, '#9B7BFF', 17) + cuboMini(10, 22, '#9B7BFF', 17) + cuboMini(38, 26, '#9B7BFF', 17) +
      `<path d="M30 14 L 40 8" stroke="${T}" stroke-width="4" stroke-linecap="round"/>`,
    feirinha: `<rect x="10" y="30" width="44" height="24" rx="3" fill="#C98A55" stroke="${T}" stroke-width="4.5"/>
      <path d="M6 30 L 12 12 H 52 L 58 30 Z" fill="#5CC84A" stroke="${T}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M22 12 L 20 30 M32 12 V 30 M42 12 L 44 30" stroke="${T}" stroke-width="3"/>
      <circle cx="22" cy="38" r="6" fill="#FF9F43" stroke="${T}" stroke-width="3"/><path d="M32 36 q 6 -6 12 0 q -6 10 -12 0" fill="#FFE14D" stroke="${T}" stroke-width="3"/>
      <circle cx="46" cy="40" r="5" fill="#E8434D" stroke="${T}" stroke-width="3"/>`,
    // o Pulo: sapinho verde-limão de bochechas rosadas
    sapinho: `<ellipse cx="32" cy="41" rx="24" ry="15" fill="#A8E061" stroke="${T}" stroke-width="5"/>
      <circle cx="20" cy="23" r="9" fill="#A8E061" stroke="${T}" stroke-width="4.5"/><circle cx="44" cy="23" r="9" fill="#A8E061" stroke="${T}" stroke-width="4.5"/>
      <circle cx="20" cy="23" r="4" fill="${T}"/><circle cx="44" cy="23" r="4" fill="${T}"/>
      <circle cx="21.5" cy="21.4" r="1.4" fill="#fff"/><circle cx="45.5" cy="21.4" r="1.4" fill="#fff"/>
      <ellipse cx="15" cy="40" rx="4.6" ry="3" fill="#FF8FC2"/><ellipse cx="49" cy="40" rx="4.6" ry="3" fill="#FF8FC2"/>
      <path d="M22 42 Q 32 50 42 42" fill="none" stroke="${T}" stroke-width="4" stroke-linecap="round"/>`,
    // pintinho: ave creme de perfil (bico, asinha, pezinhos e topetinho) — nunca uma bolinha com olhos
    pintinhos: `<path d="M27 50 V 57 M37 50 V 57 M23 58 H 31 M33 58 H 41" stroke="#F08A1C" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M12 33 L 4 27 L 7 40 Z" fill="#FFF0C4" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="29" cy="39" rx="20" ry="14.5" fill="#FFF0C4" stroke="${T}" stroke-width="4.5"/>
      <circle cx="44" cy="22" r="11" fill="#FFF0C4" stroke="${T}" stroke-width="4.5"/>
      <path d="M19 38 Q 28 31 36 39 Q 27 47 19 38 Z" fill="#FFE08A" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M53.5 19.5 L 61 23.5 L 53.5 27 Z" fill="#F08A1C" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="47.5" cy="19.5" r="2.8" fill="${T}"/>
      <path d="M41 11.5 Q 41 5 46 5 M44.5 11.5 Q 47 7 51 8" fill="none" stroke="${T}" stroke-width="3" stroke-linecap="round"/>`,
    tracar: `<path d="M20 22 Q 32 8 42 20 Q 48 30 20 52 H 46" fill="none" stroke="#2EC4B6" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 10"/>
      <g transform="rotate(35 46 30)"><rect x="40" y="6" width="12" height="40" rx="3" fill="#FFC93C" stroke="${T}" stroke-width="4"/>
      <path d="M40 46 L 46 58 L 52 46 Z" fill="#FFE0C2" stroke="${T}" stroke-width="4" stroke-linejoin="round"/></g>`,
    figurinha: `<rect x="10" y="10" width="44" height="44" rx="10" fill="#fff" stroke="${T}" stroke-width="5"/>
      <path d="M32 18 L 36 27 L 46 28 L 38 34 L 41 44 L 32 39 L 23 44 L 26 34 L 18 28 L 28 27 Z" fill="#FFC93C" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>`,
  };
  // nomes iguais (sinônimos): o mesmo desenho
  const SINONIMOS = { inicio: 'casa', ouvir: 'falar', 'de-novo': 'repetir', continuar: 'play' };
  Object.keys(SINONIMOS).forEach(n => { ICONES[n] = ICONES[SINONIMOS[n]]; });
  const DESCONHECIDO = `<circle cx="32" cy="32" r="25" fill="#E9E3F5" stroke="${T}" stroke-width="5"/>
    <path d="M24.5 25.5 A 8 8 0 1 1 36 32.5 C 33 34 32 36 32 39.5" fill="none" stroke="${T}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="32" cy="47.5" r="3.8" fill="${T}"/>`;

  /** Texto SVG do ícone `nome` (viewBox 0 0 64 64). */
  function icone(nome) {
    let corpo = Object.prototype.hasOwnProperty.call(ICONES, nome) ? ICONES[nome] : null;
    if (!corpo) {
      if (PC.config && PC.config.debug) console.warn('PC.arte.icone: ícone desconhecido "' + nome + '". Nomes: ' + Object.keys(ICONES).join(', '));
      corpo = DESCONHECIDO;
    }
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${corpo}</svg>`;
  }

  // ======================================================================== mãozinha de dica
  function mao() {
    return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17 40c-4-3-9-9-10-12-1-2 1-4 3-3l5 4V9a3 3 0 0 1 6 0v12V6a3 3 0 0 1 6 0v15V8a3 3 0 0 1 6 0v14-9a3 3 0 0 1 6 0v15c0 7-3 12-8 14z"
        fill="#FFE0C2" stroke="${T}" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  }

  // ======================================================================== cenários
  // O SVG usa viewBox -1200 -700 4000 2300: as coordenadas são as do palco (0..1600 × 0..900) e o desenho continua
  // além das bordas para cobrir as faixas de telas com outra proporção. Poucos elementos (≈ 70 no céu a 210 na
  // floresta), sem filtros: formas da mesma cor vão juntas num caminho só.
  // O meio do palco (y 140..560) fica calmo, porque é onde a brincadeira acontece: os enfeites moram no horizonte e
  // no chão. O sol fica longe dos cantos de cima (botões do HUD e cadeado) e a linha do chão fica em y ≈ 800.
  function gradiente(id, cima, baixo) {
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cima}"/><stop offset="1" stop-color="${baixo}"/></linearGradient></defs>
      <rect x="-1200" y="-700" width="4000" height="1500" fill="url(#${id})"/>`;
  }
  // elipses e círculos como pedaços de um caminho, todos no mesmo sentido (assim se somam, sem buracos)
  const elipse = (x, y, rx, ry) => `M${f1(x - rx)} ${f1(y)} a ${f1(rx)} ${f1(ry)} 0 1 0 ${f1(2 * rx)} 0 a ${f1(rx)} ${f1(ry)} 0 1 0 ${f1(-2 * rx)} 0 Z`;
  const circulos = lista => lista.map(([x, y, r]) => elipse(x, y, r, r)).join(' ');
  // nuvem fofa com a "barriga" azulada embaixo (dá volume sem sombra nem filtro)
  const NUVEM = elipse(0, 0, 70, 38) + elipse(55, -20, 55, 42) + elipse(110, 4, 60, 34) + ' M-23 0 A 17 17 0 0 0 -23 34 H 133 A 17 17 0 0 0 133 0 Z';
  function nuvem(x, y, e) {
    return `<g transform="translate(${x} ${y}) scale(${e})"><path d="${NUVEM}" fill="#D6ECFB" transform="translate(5 9)"/><path d="${NUVEM}" fill="#fff"/></g>`;
  }
  // sol com raios curtos (sem halo colorido, que com o azul do céu fica esverdeado). r = raio do disco.
  function sol(x, y, r) {
    r = r || 66;
    let raios = '';
    for (let i = 0; i < 10; i++) {
      const a = (i * 36 + 18) * Math.PI / 180;
      raios += `M${(x + Math.cos(a) * (r + 20)).toFixed(1)} ${(y + Math.sin(a) * (r + 20)).toFixed(1)} L ${(x + Math.cos(a) * (r + 41)).toFixed(1)} ${(y + Math.sin(a) * (r + 41)).toFixed(1)} `;
    }
    return `<g class="pc-arte-sol"><circle cx="${x}" cy="${y}" r="${r + 51}" fill="#fff" opacity=".22"/>` +
      `<path d="${raios}" stroke="#FFE27A" stroke-width="${Math.round(r / 5)}" stroke-linecap="round"/>` +
      `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFE27A" stroke="#F5C84C" stroke-width="6"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 4.7}" fill="#fff" opacity=".4"/></g>`;
  }
  // passarinhos ao longe ("v" suave)
  function passaros(lista) {
    return lista.map(([x, y, e]) => `<path d="M${x - 16 * e} ${y} q ${8 * e} ${-9 * e} ${16 * e} 0 q ${8 * e} ${-9 * e} ${16 * e} 0" fill="none" stroke="#5B7FA3" stroke-width="${4.5 * e}" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>`).join('');
  }
  // morrinhos ao longe, azulados (um caminho só): dão profundidade ao horizonte
  function morros(y, cor, alturas) {
    let d = `M-1200 ${y}`, x = -1200, i = 0;
    while (x < 2800) {
      const w = 300 + (i % 3) * 110, h = alturas[i % alturas.length];
      d += ` c ${f1(w * 0.32)} ${-h} ${f1(w * 0.68)} ${-h} ${w} 0`;
      x += w; i++;
    }
    return `<path d="${d} V 1600 H -1200 Z" fill="${cor}"/>`;
  }
  function tufos(cor, lista) {
    return lista.map(([x, y]) => `<path d="M${x} ${y} q 6 -26 12 0 q 6 -30 12 0 q 6 -22 12 0" fill="${cor}"/>`).join('');
  }
  // florzinha do campo: cinco pétalas redondas (um caminho) e o miolo amarelo. e = escala.
  function florzinhas(lista, e) {
    const k = e || 1;
    return lista.map(([x, y, c]) => `<path d="${circulos([[x, y, 9 * k], [x - 9 * k, y, 7 * k], [x + 9 * k, y, 7 * k], [x, y - 9 * k, 7 * k], [x, y + 9 * k, 7 * k]])}" fill="${c}"/>` +
      `<circle cx="${x}" cy="${y}" r="${f1(5 * k)}" fill="#FFE27A"/>`).join('');
  }
  function arvore(x, y, e, cor, brilho, frutas) {
    return `<g transform="translate(${x} ${y}) scale(${e})"><rect x="-14" y="-40" width="28" height="90" rx="10" fill="#8A5A34"/>` +
      `<path d="${circulos([[0, -90, 72], [-56, -50, 50], [56, -50, 52]])}" fill="${cor}"/>` +
      (brilho === false ? '' : `<circle cx="-22" cy="-120" r="24" fill="#fff" opacity=".13"/><circle cx="-60" cy="-62" r="14" fill="#fff" opacity=".1"/>`) +
      (frutas ? `<path d="${circulos([[30, -96, 9], [-34, -40, 8], [52, -44, 8], [-6, -60, 7]])}" fill="${frutas}"/>` : '') + `</g>`;
  }
  // ipê-amarelo florido ao longe (a árvore da flor da Pipoca)
  // copa larga em dois amarelos, galhos aparecendo e um tapetinho de flores caídas no chão (como o ipê de verdade)
  function ipe(x, y, e) {
    return `<g transform="translate(${x} ${y}) scale(${e})">
      <ellipse cx="4" cy="2" rx="74" ry="11" fill="#FFD23F" opacity=".6"/>
      <path d="M0 0 V -62 M0 -36 L -34 -70 M0 -48 L 30 -84 M0 -62 L -6 -92" fill="none" stroke="#7A4E2D" stroke-width="10" stroke-linecap="round"/>
      <path d="${circulos([[-52, -82, 26], [50, -90, 28], [-20, -104, 32], [22, -112, 30]])}" fill="#F7B910"/>
      <path d="${circulos([[-34, -96, 22], [6, -124, 22], [36, -100, 20]])}" fill="#FFD84D"/>
      <circle cx="-12" cy="-128" r="10" fill="#fff" opacity=".35"/></g>`;
  }
  // cerquinha de madeira ao longe, no alto do morro
  function cerca(x, y, n, e) {
    const l = (n - 1) * 46 + 12;
    let postes = '';
    for (let i = 0; i < n; i++) postes += `<rect x="${i * 46 - 6}" y="-58" width="12" height="58" rx="5"/>`;
    return `<g transform="translate(${x} ${y}) scale(${e})"><g fill="#C99C6E"><rect x="-6" y="-46" width="${l}" height="9" rx="4.5"/>` +
      `<rect x="-6" y="-24" width="${l}" height="9" rx="4.5"/></g><g fill="#E0BB8E">${postes}</g></g>`;
  }
  // taboa da beira da lagoa: folhas compridas e as "salsichinhas" marrons
  function taboa(x, y, e, virar) {
    return `<g transform="translate(${x} ${y}) scale(${virar ? -e : e} ${e})">
      <path d="M-8 0 C -12 -50 -30 -88 -54 -116 M12 0 C 16 -40 30 -78 50 -100" fill="none" stroke="#5DAA3F" stroke-width="8" stroke-linecap="round"/>
      <path d="M0 0 V -164 M-22 0 V -128 M22 0 V -142" stroke="#4E9E33" stroke-width="6" stroke-linecap="round"/>
      <g fill="#8A5A34"><rect x="-8" y="-150" width="16" height="46" rx="8"/><rect x="-29.5" y="-116" width="15" height="38" rx="7.5"/><rect x="14.5" y="-130" width="15" height="40" rx="7.5"/></g></g>`;
  }
  // pierzinho de madeira saindo da outra margem da lagoa (com marolinhas nos pés)
  function pier(x, y, e) {
    return `<g transform="translate(${x} ${y}) scale(${e})">` +
      `<g fill="#9C6A43"><rect x="10" y="-2" width="11" height="38" rx="3"/><rect x="70" y="-2" width="11" height="42" rx="3"/><rect x="130" y="-2" width="11" height="38" rx="3"/></g>` +
      `<path d="M3 38 h 25 M63 42 h 25 M123 38 h 25" stroke="#E7FAFF" stroke-width="5" stroke-linecap="round" opacity=".85"/>` +
      `<rect x="0" y="-13" width="152" height="15" rx="4" fill="#C9935F"/>` +
      `<path d="M38 -13 v 15 M76 -13 v 15 M114 -13 v 15" stroke="#A8794E" stroke-width="3"/></g>`;
  }
  // fileira de mato baixo (um caminho só, morrinhos de tamanhos alternados)
  function fileiraMato(y, cor) {
    let d = `M-1200 ${y + 60} L -1200 ${y}`, x = -1200, i = 0;
    while (x < 2800) { const w = 150 + (i % 3) * 55, h = 30 + (i % 2) * 16; d += ` q ${w / 2} ${-h * 2} ${w} 0`; x += w; i++; }
    return `<path d="${d} L ${x} ${y + 60} Z" fill="${cor}"/>`;
  }
  function samambaia(x, y, e, virar) {
    return `<g transform="translate(${x} ${y}) scale(${virar ? -e : e} ${e})" fill="#3F8F3F">
      <path d="M0 0 C -14 -40 -46 -66 -96 -74 C -56 -52 -26 -30 0 0 Z"/><path d="M0 0 C -4 -52 -18 -94 -50 -124 C -30 -84 -14 -44 0 0 Z"/>
      <path d="M0 0 C 12 -46 36 -78 78 -96 C 44 -66 20 -34 0 0 Z"/></g>`;
  }
  // palmeira ao longe (como a juçara da Mata Atlântica): tronco fininho e um tufo de folhas compridas
  function palmeira(x, y, e, cor) {
    const folhas = [[-84, 10], [-64, -24], [-26, -44], [22, -44], [60, -24], [82, 10]]
      .map(([dx, dy]) => `M0 -250 Q ${dx * 0.5} ${-280 + dy} ${dx} ${-234 + dy}`).join(' ');
    return `<g transform="translate(${x} ${y}) scale(${e})"><path d="M0 0 Q -16 -130 0 -250" fill="none" stroke="#94785A" stroke-width="12" stroke-linecap="round"/>` +
      `<path d="${folhas}" fill="none" stroke="${cor}" stroke-width="15" stroke-linecap="round"/></g>`;
  }
  // bromélia: roseta de folhas pontudas com a flor vermelha no meio
  function bromelia(x, y, e, virar) {
    return `<g transform="translate(${x} ${y}) scale(${virar ? -e : e} ${e})">` +
      `<g fill="#2F8A45"><path d="M0 0 C -30 -4 -56 -20 -70 -40 C -42 -30 -20 -20 2 -8 Z"/><path d="M0 0 C 30 -4 56 -20 70 -40 C 42 -30 20 -20 -2 -8 Z"/></g>` +
      `<g fill="#46A35A"><path d="M-2 0 C -22 -16 -34 -40 -32 -66 C -18 -44 -8 -24 6 -6 Z"/><path d="M2 0 C 22 -16 34 -40 32 -66 C 18 -44 8 -24 -6 -6 Z"/></g>` +
      `<path d="M-9 -4 C -11 -28 -5 -48 0 -58 C 5 -48 11 -28 9 -4 Z" fill="#FF6B5B"/><path d="M0 -48 V -14" stroke="#FFB0A8" stroke-width="3" stroke-linecap="round"/></g>`;
  }
  // raios de sol entrando na mata: faixas claras que nascem transparentes na altura das copas e chegam ao chão
  function raiosDeSol(id, lista) {
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6CC" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="#FFF6CC" stop-opacity=".42"/></linearGradient></defs><g fill="url(#${id})">` +
      lista.map(([x, l, desvio]) => `<path d="M${x} 300 h ${l} L ${x + l + desvio} 800 h ${-l * 1.9} Z"/>`).join('') + `</g>`;
  }
  function cogumelo(x, y, e, cor) {
    return `<g transform="translate(${x} ${y}) scale(${e})"><rect x="-7" y="0" width="14" height="22" rx="5" fill="#FFF8EC"/>` +
      `<ellipse cx="0" cy="0" rx="24" ry="14" fill="${cor}"/><circle cx="-7" cy="-4" r="4" fill="#fff"/><circle cx="7" cy="2" r="3" fill="#fff"/></g>`;
  }
  function brilhosAgua(lista) {
    return lista.map(([x, y]) => `<path d="M${x} ${y - 11} L ${x + 3} ${y - 3} L ${x + 11} ${y} L ${x + 3} ${y + 3} L ${x} ${y + 11} L ${x - 3} ${y + 3} L ${x - 11} ${y} L ${x - 3} ${y - 3} Z" fill="#fff" opacity=".75"/>`).join('');
  }

  const CENARIOS = {
    // céu das telas de menu (álbum, livre, pais...): calmo, com o chão em 800
    ceu(id, op) {
      return gradiente(id, '#8FD3FF', '#DFF4FF') + (op.sol === false ? '' : sol(1190, 105)) +
        nuvem(140, 120, 1) + nuvem(720, 70, .7) + nuvem(1560, 170, .85) + nuvem(-560, 90, .9) + nuvem(2150, 110, 1) +
        passaros([[430, 200, 1], [470, 222, .8]]) +
        morros(690, '#CBEBD3', [60, 92, 48, 80]) +
        `<path d="M-1200 700 C -600 640, 0 690, 500 672 C 1000 654, 1400 700, 2800 680 V 1600 H -1200 Z" fill="#B7E6A3"/>` +
        // nenhum ipê atrás da Pipoca do canto (a pontinha da copa parecia um chapéu) nem do balde do Brincar livre
        ipe(1440, 712, .5) + ipe(660, 708, .42) + ipe(-500, 700, .5) + ipe(2200, 704, .5) +
        `<path d="M-1200 760 C -500 730, 200 770, 800 752 C 1400 736, 2100 772, 2800 756 V 1600 H -1200 Z" fill="#9EDC85"/>
         <rect x="-1200" y="800" width="4000" height="800" fill="#86CF6C"/>
         <path d="M-1200 800 C -600 790, 0 808, 800 800 C 1600 792, 2200 808, 2800 800" fill="none" stroke="#74BD5B" stroke-width="8"/>` +
        florzinhas([[330, 776, '#fff'], [1250, 770, '#FF8FC2'], [-260, 780, '#FF7A6B'], [1880, 776, '#fff']], .8) +
        tufos('#74BD5B', [[90, 872], [1490, 862], [-320, 880], [1900, 870]]);
    },
    prado(id, op) {
      return gradiente(id, '#7CC8FF', '#D6F1FF') + (op.sol === false ? '' : sol(1352, 88, 52)) +
        nuvem(260, 150, .8) + nuvem(980, 84, 1) + nuvem(1720, 150, .9) + nuvem(-560, 120, 1.1) + nuvem(2250, 100, 1) +
        passaros([[560, 200, 1], [602, 224, .8], [528, 236, .65]]) +
        morros(586, '#C6EAD0', [70, 112, 58, 96]) +
        `<path d="M-1200 600 C -800 520, -300 560, 100 600 C 500 640, 800 520, 1200 560 C 1600 600, 2200 520, 2800 580 V 1600 H -1200 Z" fill="#B4E6A0"/>` +
        // cerquinhas no morro: uma junto do ipê grande (longe da Pipoca, do balde e do botão Pronto) e outra na sangria
        cerca(986, 592, 4, .55) + cerca(-760, 590, 6, .6) +
        // ipês longe do balde (x ≈ 420): copa amarela atrás dele pareceria mais cubinhos dourados. Nenhum na faixa do
        // balão da Pipoca (x < 570, y 380..600): coberto pelo balão, só o tronco aparecia, como um pauzinho. O de x 652
        // fica no vão entre a Pipoca grande e o botão Jogar da abertura.
        ipe(1160, 590, .62) + ipe(1290, 604, .45) + ipe(652, 604, .44) + ipe(-420, 600, .55) + ipe(2050, 590, .6) +
        `<path d="M-1200 690 C -700 640, -200 700, 300 690 C 800 680, 1200 640, 1700 690 C 2200 740, 2500 690, 2800 700 V 1600 H -1200 Z" fill="#94D97C"/>
         <rect x="-1200" y="800" width="4000" height="900" fill="#7FCB65"/>
         <path d="M-1200 800 C -600 780, 0 815, 800 800 C 1600 785, 2200 815, 2800 800" fill="none" stroke="#6DB956" stroke-width="10"/>` +
        tufos('#6DB956', [[60, 860], [420, 880], [980, 870], [1330, 885], [1530, 850], [-150, 880], [1800, 870], [-420, 860]]) +
        florzinhas([[180, 745, '#FF8FC2'], [700, 725, '#fff'], [1120, 740, '#FF7A6B'], [1480, 760, '#fff'], [-300, 760, '#FF8FC2'], [1900, 740, '#FF7A6B'], [860, 870, '#FFD23F'], [-80, 880, '#fff']]) +
        florzinhas([[520, 712, '#fff'], [960, 708, '#FF8FC2'], [1360, 716, '#FFD23F'], [2200, 712, '#fff'], [-600, 716, '#FFD23F']], .6);
    },
    lagoa(id, op) {
      return gradiente(id, '#86CFFF', '#E1F5FF') + (op.sol === false ? '' : sol(312, 96, 50)) +
        nuvem(700, 110, .9) + nuvem(1300, 160, .8) + nuvem(-400, 120, 1) + nuvem(2000, 90, 1) +
        passaros([[1040, 230, .9], [1078, 250, .7]]) +
        morros(540, '#C2E8CF', [52, 84, 40, 70]) +
        `<path d="M-1200 560 C -700 500, -100 540, 400 520 C 900 500, 1300 540, 1800 520 C 2300 500, 2600 540, 2800 530 V 1600 H -1200 Z" fill="#A6DD92"/>` +
        // fileira de mato na outra margem e uns ipês
        fileiraMato(574, '#8CCD7C') + ipe(1290, 582, .5) + ipe(-260, 578, .45) +
        `<path d="M-1200 600 C -400 585, 500 610, 1300 595 C 1900 585, 2400 605, 2800 600 V 805 H -1200 Z" fill="#5EC8E8"/>
         <path d="M-1200 604 C -400 590, 500 614, 1300 600 C 1900 590, 2400 610, 2800 604 V 628 C 2000 640, 1000 618, -1200 632 Z" fill="#8ADCF0" opacity=".7"/>
         <path d="M-100 650 h 120 M380 700 h 160 M900 660 h 110 M1300 712 h 150 M1700 660 h 120 M-600 710 h 140 M640 760 h 90 M1120 770 h 70" stroke="#E7FAFF" stroke-width="8" stroke-linecap="round" opacity=".8"/>` +
        // o pierzinho aparece na beirada direita (e inteiro nas telas mais largas)
        pier(1500, 598, .7) + pier(-900, 600, .7) +
        brilhosAgua([[560, 640], [1460, 650], [210, 735]]) +
        // marolinhas (dois aros de água)
        `<g fill="none" stroke="#E7FAFF" stroke-width="5" opacity=".7"><ellipse cx="1040" cy="742" rx="46" ry="9"/><ellipse cx="1040" cy="742" rx="22" ry="4.5"/></g>` +
        `<path d="M-1200 792 C -600 778, 200 812, 900 794 C 1500 780, 2200 812, 2800 796 V 1600 H -1200 Z" fill="#8ED474"/>
         <path d="M-1200 792 C -600 778, 200 812, 900 794 C 1500 780, 2200 812, 2800 796" fill="none" stroke="#76BE5E" stroke-width="8"/>
         <rect x="-1200" y="860" width="4000" height="800" fill="#7ECB64"/>` +
        // taboas (nos cantos)
        taboa(30, 806, .95, false) + taboa(1590, 806, 1, true) + taboa(-180, 800, .8, true) + taboa(1800, 800, .85, false) +
        `<g fill="#B9B3CC"><ellipse cx="420" cy="806" rx="26" ry="12"/><ellipse cx="452" cy="810" rx="16" ry="9"/><ellipse cx="1250" cy="808" rx="22" ry="10"/></g>` +
        `<g fill="#fff" opacity=".45"><ellipse cx="412" cy="801" rx="10" ry="4"/><ellipse cx="1244" cy="803" rx="8" ry="3.5"/></g>` +
        tufos('#6DB956', [[200, 880], [760, 870], [1200, 885], [1450, 860], [-300, 870], [1850, 875]]) +
        florzinhas([[520, 850, '#fff'], [1330, 840, '#FF8FC2'], [-480, 846, '#FFD23F'], [2050, 850, '#fff']]);
    },
    floresta(id, op) {
      return gradiente(id, '#9AD8FF', '#EAF7E6') + nuvem(300, 90, .8) + nuvem(1200, 70, .9) + nuvem(-500, 120, 1) + nuvem(2100, 110, .9) +
        morros(596, '#BFE3BC', [80, 120, 66, 104]) +
        `<path d="M-1200 620 C -700 560, -200 600, 300 580 C 800 560, 1300 610, 1800 580 C 2300 560, 2600 600, 2800 590 V 1600 H -1200 Z" fill="#9FD68C"/>` +
        // fundo: palmeiras e árvores mais claras (mais longe). As palmeiras ficam longe do balde (x ≈ 420) e da placa
        // do alvo (x ≈ 1380): um tronco atrás deles pareceria um pau espetado no balde ou na placa.
        palmeira(170, 606, .82, '#6FBB72') + palmeira(1150, 598, .78, '#6FBB72') + palmeira(-760, 600, .85, '#6FBB72') + palmeira(2240, 600, .8, '#6FBB72') +
        [[-1000, 600, .9], [-640, 590, .8], [-260, 610, .95], [140, 585, .75], [520, 600, .85], [880, 590, .8], [1240, 605, .9], [1620, 590, .8], [2000, 600, .9], [2400, 590, .85]]
          .map(([x, y, e]) => arvore(x, y, e, '#7CC37A', false)).join('') +
        raiosDeSol(id + '-raio', [[1090, 80, -150], [640, 64, -140], [1560, 70, -150], [-300, 80, -140], [2300, 76, -150]]) +
        [[-900, 650, 1.2], [-500, 620, 1], [-120, 660, 1.3], [260, 610, .9, '#FF8A5B'], [620, 650, 1.1], [1000, 620, 1, '#FFC93C'], [1380, 660, 1.25], [1760, 620, .95, '#FF8A5B'], [2150, 650, 1.2], [2550, 630, 1]]
          .map(([x, y, e, f]) => arvore(x, y, e, '#4FA65A', true, f)).join('') +
        `<path d="M-1200 732 C -700 702, -100 748, 500 728 C 1100 708, 1700 748, 2800 730 V 1600 H -1200 Z" fill="#7AC062"/>` +
        // árvores da frente: nenhuma atrás do botão Pronto/Pagar (x ≈ 1420, y ≈ 700), que também é verde
        [[-300, 790, .9], [100, 772, .75], [1860, 798, .9]].map(([x, y, e]) => arvore(x, y, e, '#3E9A4A')).join('') +
        bromelia(330, 742, .7) + bromelia(1180, 738, .62, true) +
        `<rect x="-1200" y="800" width="4000" height="800" fill="#6CB955"/>
         <path d="M-1200 800 C -600 788, 0 812, 800 800 C 1600 788, 2200 812, 2800 800" fill="none" stroke="#5AA846" stroke-width="9"/>` +
        samambaia(-30, 812, 1, false) + samambaia(1640, 812, 1.05, true) + samambaia(1300, 828, .6, false) +
        bromelia(-260, 830, .9) + bromelia(1880, 834, .85, true) +
        cogumelo(203, 842, 1, '#FF7A6B') + cogumelo(1402, 852, .84, '#9B7BFF') + cogumelo(1430, 862, .55, '#FF7A6B') +
        tufos('#5AA846', [[420, 880], [880, 870], [1180, 885], [-180, 870], [1700, 880]]);
    },
  };

  /**
   * Cria o elemento de cenário (prado, lagoa, floresta ou ceu), que cobre a tela inteira.
   * opcoes: { sol: false } tira o sol (a abertura usa: o logo é a estrela do céu).
   */
  function cenario(nome, opcoes) {
    const ok = Object.prototype.hasOwnProperty.call(CENARIOS, nome);
    if (!ok && PC.config && PC.config.debug) console.warn('PC.arte.cenario: cenário desconhecido "' + nome + '". Nomes: ' + Object.keys(CENARIOS).join(', '));
    const el = U.el('div', { class: 'cenario cenario-' + (ok ? nome : 'prado') });
    el.innerHTML = `<svg class="cenario-svg" viewBox="-1200 -700 4000 2300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${(ok ? CENARIOS[nome] : CENARIOS.prado)(novoId('pc-arte-ceu-'), opcoes || {})}</svg>`;
    return el;
  }

  // ======================================================================== logo
  // Letras coloridas (o CSS .logo é do núcleo). O "i" é verde como um cabinho e o pingo dele é a flor de ipê.
  const CORES_LOGO = ['#FF7A6B', '#5CC84A', '#FFC93C', '#9B7BFF', '#2EC4B6', '#FF8FC2', '#4DA3FF', '#FF9F43', '#FF7A6B', '#FFC93C', '#2EC4B6'];
  function estiloLogo() {
    U.estilo('arte', `
      .logo .pc-arte-letra-i { position: relative; }
      .logo .pc-arte-pingo { position: absolute; left: 50%; top: .01em; width: .36em; height: .36em; margin-left: -.18em; pointer-events: none; }
      .logo .pc-arte-pingo svg { width: 100%; height: 100%; display: block; overflow: visible; }
    `);
  }
  /** Logo "Pipoca Conta" (texto HTML, para dentro de um elemento com a classe .logo). */
  function logo() {
    estiloLogo();
    let k = 0;
    return 'Pipoca Conta'.split(' ').map(p =>
      `<span class="logo-palavra">${[...p].map(ch => {
        const i = k++;
        const ehI = ch === 'i';
        return `<span class="logo-letra${ehI ? ' pc-arte-letra-i' : ''}" style="--c:${CORES_LOGO[i % CORES_LOGO.length]};--i:${i}">${ch}` +
          (ehI ? `<span class="pc-arte-pingo" aria-hidden="true">${flor()}</span>` : '') + `</span>`;
      }).join('')}</span>`).join(' ');
  }

  PC.arte = {
    pipoca, icone, cenario, mao, logo, flor, cores: C, novoId,
    poses: () => Object.keys(POSES),
    nomesIcones: () => Object.keys(ICONES),
    nomesCenarios: () => Object.keys(CENARIOS),
  };
})();
