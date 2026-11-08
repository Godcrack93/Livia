/* Pipoca Aprende — medalhões das estações do mapa: uma mini cena colorida por estação (viewBox 0 0 100 100, recortada
   em círculo). A cena mostra a brincadeira E o que muda naquela estação: os algarismos do traçar, as moedas da
   feirinha, a sequência do sapinho, a altura da torre, o jeito de contar os pintinhos.
   Regras de arte do jogo: contorno #3A2A5A, cores chapadas, cubinhos sem rosto, número só em plaquinha/folha/moeda,
   padrão de 5 em 5 em roxo e dourado (a cor nunca depende da quantidade).
   Uso: PC.arte.medalhao(fase) → texto SVG.
   Atividades novas registram a sua cena (no próprio arquivo da atividade):
     PC.arte.registrarMedalhao(id, { fundo: [ceu, chao|null, chaoEscuro|null], cena(params) -> SVG em 0..100 })
   e podem usar as peças: PC.arte.pecasMedalhao = { T, COR, FONTE, brilho, cartinha }.
   Estações de letras (fase.materia === 'letras') ganham a borda rosa no mapa (o mapa cuida disso). */
(function () {
  'use strict';
  const PC = window.PC;
  const T = '#3A2A5A';
  const COR = { roxo: '#9B7BFF', ouro: '#FFC93C', azul: '#4DA3FF', rosa: '#FF8FC2', verde: '#5CC84A', coral: '#FF7A6B',
    turquesa: '#2EC4B6', laranja: '#FF9F43', creme: '#FFF0C4', madeira: '#C98A55', madeiraEsc: '#A9703F' };
  const FONTE = `font-family="Fredoka, 'Baloo 2', sans-serif" font-weight="700"`;

  // ------------------------------------------------------------------ peças
  /** Cubinho (sem rosto): corpo, brilho no canto e o encaixe em cima (só no do topo). */
  function cubo(x, y, s, cor, topo) {
    const r = s * 0.2, w = Math.max(1.6, s * 0.17);
    return (topo ? `<rect x="${x + s * 0.28}" y="${y - s * 0.2}" width="${s * 0.44}" height="${s * 0.28}" rx="${s * 0.1}" fill="${cor}" stroke="${T}" stroke-width="${w * 0.8}"/>` : '') +
      `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" fill="${cor}" stroke="${T}" stroke-width="${w}"/>` +
      `<rect x="${x + s * 0.17}" y="${y + s * 0.16}" width="${s * 0.32}" height="${s * 0.16}" rx="${s * 0.08}" fill="#fff" opacity=".6"/>`;
  }
  /** Torre de n cubinhos com a base em (cx, base). 1 a 5 roxos, 6 a 10 dourados (padrão de 5 em 5). */
  function torre(cx, base, n, s, cores) {
    let out = '';
    for (let i = 0; i < n; i++) {
      const cor = cores ? cores(i) : (Math.floor(i / 5) % 2 ? COR.ouro : COR.roxo);
      out += cubo(cx - s / 2, base - (i + 1) * s, s, cor, i === n - 1);
    }
    return out;
  }
  /** Barra de dezena: dez cubinhos colados (5 roxos + 5 dourados), em pé. */
  function dezena(cx, base, s) {
    const w = s, h = s * 4, x = cx - w / 2, y = base - h, passo = h / 10;
    let riscos = '';
    for (let i = 1; i < 10; i++) riscos += `<path d="M${x + 1.5} ${y + i * passo} H ${x + w - 1.5}" stroke="${T}" stroke-width="1.1" opacity=".55"/>`;
    return `<rect x="${x + w * 0.28}" y="${y - w * 0.2}" width="${w * 0.44}" height="${w * 0.28}" rx="${w * 0.1}" fill="${COR.ouro}" stroke="${T}" stroke-width="1.8"/>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h / 2}" rx="3" fill="${COR.ouro}" stroke="${T}" stroke-width="2.4"/>` +
      `<rect x="${x}" y="${y + h / 2}" width="${w}" height="${h / 2}" rx="3" fill="${COR.roxo}" stroke="${T}" stroke-width="2.4"/>` +
      riscos + `<rect x="${x + w * 0.16}" y="${y + 3}" width="${w * 0.22}" height="${h - 6}" rx="2" fill="#fff" opacity=".45"/>`;
  }
  /** Tábua de madeira (a base das torres do jogo). */
  const tabua = (x1, x2, y) => `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="5.5" rx="2.75" fill="${COR.madeira}" stroke="${T}" stroke-width="2.2"/>` +
    `<path d="M${x1 + 4} ${y + 2} H ${x2 - 4}" stroke="#E8B27E" stroke-width="1.4" stroke-linecap="round"/>`;
  /** Plaquinha com número (o número do jogo mora numa plaquinha, nunca solto no ar). */
  function plaquinha(cx, cy, texto, l) {
    l = l || (String(texto).length > 1 ? 21 : 15);
    return `<rect x="${cx - l / 2}" y="${cy - 8}" width="${l}" height="16" rx="4.5" fill="#fff" stroke="${T}" stroke-width="2.2"/>` +
      `<text x="${cx}" y="${cy + 4.6}" text-anchor="middle" font-size="13" ${FONTE} fill="${T}">${texto}</text>`;
  }
  /** Brilhinho de quatro pontas. */
  const brilho = (x, y, r, cor) => `<path d="M${x} ${y - r} Q ${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y} Q ${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r} Q ${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y} Q ${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r} Z" fill="${cor || '#fff'}"/>`;
  /** Balde de cubinhos (o do jogo), pequeno. */
  const balde = (x, y, e) => `<g transform="translate(${x} ${y}) scale(${e})">` +
    `<path d="M2 9 C 2 -8 30 -8 30 9" fill="none" stroke="${T}" stroke-width="2.4"/>` +
    cubo(6, 1, 9, COR.roxo) + cubo(16, -1, 9, COR.ouro) +
    `<path d="M1 8 H 31 L 27 30 H 5 Z" fill="${COR.turquesa}" stroke="${T}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<rect x="-1" y="5" width="34" height="5.5" rx="2.75" fill="#7FE0D6" stroke="${T}" stroke-width="2.3"/>` +
    `<path d="M6 19 H 26" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/></g>`;

  /** Pintinho de perfil (o mesmo desenho do jogo), com o pé em (x, y). virar: olha para a esquerda. */
  function pintinho(x, y, e, virar) {
    return `<g transform="translate(${x} ${y}) scale(${virar ? -e : e} ${e}) translate(-32 -58)">` +
      `<path d="M27 50 V 57 M37 50 V 57 M23 58 H 31 M33 58 H 41" stroke="#F08A1C" stroke-width="3.5" stroke-linecap="round"/>` +
      `<path d="M12 33 L 4 27 L 7 40 Z" fill="${COR.creme}" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/>` +
      `<ellipse cx="29" cy="39" rx="20" ry="14.5" fill="${COR.creme}" stroke="${T}" stroke-width="4.5"/>` +
      `<circle cx="44" cy="22" r="11" fill="${COR.creme}" stroke="${T}" stroke-width="4.5"/>` +
      `<path d="M19 38 Q 28 31 36 39 Q 27 47 19 38 Z" fill="#FFE08A" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/>` +
      `<path d="M53.5 19.5 L 61 23.5 L 53.5 27 Z" fill="#F08A1C" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>` +
      `<circle cx="47.5" cy="19.5" r="2.8" fill="${T}"/><circle cx="48.4" cy="18.6" r="0.9" fill="#fff"/>` +
      `<ellipse cx="42" cy="27" rx="3.2" ry="2" fill="${COR.rosa}" opacity=".8"/>` +
      `<path d="M41 11.5 Q 41 5 46 5 M44.5 11.5 Q 47 7 51 8" fill="none" stroke="${T}" stroke-width="3" stroke-linecap="round"/></g>`;
  }
  /** O Pulo (sapinho do jogo) sentado, com a base em (x, y). */
  function sapo(x, y, e) {
    return `<g transform="translate(${x} ${y}) scale(${e}) translate(-32 -54)">` +
      `<ellipse cx="14" cy="52" rx="9" ry="4.5" fill="#86C843" stroke="${T}" stroke-width="3.5"/><ellipse cx="50" cy="52" rx="9" ry="4.5" fill="#86C843" stroke="${T}" stroke-width="3.5"/>` +
      `<ellipse cx="32" cy="41" rx="24" ry="15" fill="#A8E061" stroke="${T}" stroke-width="4.5"/>` +
      `<ellipse cx="32" cy="46" rx="13" ry="7" fill="#D6F2A8"/>` +
      `<circle cx="20" cy="23" r="9" fill="#A8E061" stroke="${T}" stroke-width="4.2"/><circle cx="44" cy="23" r="9" fill="#A8E061" stroke="${T}" stroke-width="4.2"/>` +
      `<circle cx="20" cy="23" r="4.2" fill="${T}"/><circle cx="44" cy="23" r="4.2" fill="${T}"/>` +
      `<circle cx="21.6" cy="21.3" r="1.5" fill="#fff"/><circle cx="45.6" cy="21.3" r="1.5" fill="#fff"/>` +
      `<ellipse cx="15" cy="38" rx="4.6" ry="3" fill="${COR.rosa}"/><ellipse cx="49" cy="38" rx="4.6" ry="3" fill="${COR.rosa}"/>` +
      `<path d="M23 40 Q 32 48 41 40" fill="none" stroke="${T}" stroke-width="3.6" stroke-linecap="round"/></g>`;
  }
  /** Moeda dourada com o valor. */
  function moeda(cx, cy, r, valor) {
    return `<circle cx="${cx}" cy="${cy + 1.6}" r="${r}" fill="#D99A1E" stroke="${T}" stroke-width="2.3"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${COR.ouro}" stroke="${T}" stroke-width="2.3"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r * 0.72}" fill="none" stroke="#E0A526" stroke-width="1.6"/>` +
      `<text x="${cx}" y="${cy + r * 0.42}" text-anchor="middle" font-size="${r * 1.15}" ${FONTE} fill="${T}">${valor}</text>`;
  }
  // ------------------------------------------------------------------ fundos (cada brincadeira tem sua cor)
  const FUNDO = {
    torre: ['#EFE8FF', '#B9E59A', '#94D373'],
    juntar: ['#DDEEFF', '#B9E59A', '#94D373'],
    separar: ['#FFE6F2', '#B9E59A', '#94D373'],
    pintinhos: ['#FFF4CC', '#F7D982', '#E9BE55'],
    tracar: ['#DDF7F3', null, null],
    feirinha: ['#FFE9D4', '#E8C9A0', '#D8B184'],
    sapinho: ['#D6F0FF', '#7FD0F5', '#5BBCE9'],
  };
  function fundo(atividade) {
    const [ceu, chao, chaoEsc] = FUNDO[atividade] || FUNDO.torre;
    let s = `<rect width="100" height="100" fill="${ceu}"/>` +
      `<circle cx="18" cy="20" r="2" fill="#fff" opacity=".9"/><circle cx="84" cy="30" r="1.6" fill="#fff" opacity=".9"/><circle cx="74" cy="13" r="1.2" fill="#fff"/>`;
    if (chao) s += `<path d="M0 78 Q 28 70 50 76 Q 74 82 100 72 V 100 H 0 Z" fill="${chao}"/>` +
      `<path d="M0 78 Q 28 70 50 76 Q 74 82 100 72" fill="none" stroke="${chaoEsc}" stroke-width="2.4"/>`;
    return s;
  }

  // ------------------------------------------------------------------ cenas (o personagem principal ocupa ~70% do disco)
  const CENAS = {
    torre(p) {
      if (p.modo === 'comparar') {
        // duas torres lado a lado e a pergunta: qual tem mais?
        return tabua(12, 88, 80) + torre(32, 80, 3, 14) + torre(68, 80, 5, 11.5) +
          `<path d="M18 12 h 22 a 7 7 0 0 1 7 7 v 9 a 7 7 0 0 1 -7 7 h -6 l -2 6 l -5 -6 h -9 a 7 7 0 0 1 -7 -7 v -9 a 7 7 0 0 1 7 -7 Z" fill="#fff" stroke="${T}" stroke-width="2.4" stroke-linejoin="round"/>` +
          `<text x="29" y="31" text-anchor="middle" font-size="19" ${FONTE} fill="${COR.coral}">?</text>` + brilho(86, 16, 4, COR.ouro);
      }
      const max = Number(p.max) || 3;
      if (p.dezenaPronta || max > 10) {
        // dezena pronta + cubinhos soltos: "dez e mais..."
        return tabua(22, 86, 76) + dezena(42, 76, 15) + torre(68, 76, 3, 14, () => COR.roxo) + plaquinha(54, 86, max > 10 ? max : 10, 22) +
          brilho(84, 24, 5, COR.ouro) + brilho(18, 30, 3.5, '#fff');
      }
      const n = max <= 3 ? 3 : max <= 5 ? 5 : 7;
      const s = n === 3 ? 19 : n === 5 ? 13 : 9.6;
      return tabua(40, 86, 76) + torre(63, 76, n, s * 0.92) + plaquinha(63, 86, max) +
        balde(5, 46, 1.02) + brilho(86, 26, 5, COR.ouro) + brilho(30, 18, 3.5, '#fff');
    },
    juntar(p) {
      const alvo = Number(p.alvoMax) || 4;
      const [a, b] = alvo >= 10 ? [4, 6] : alvo >= 6 ? [3, 3] : [2, 2];
      const s = alvo >= 10 ? 9.5 : alvo >= 6 ? 13 : 16;
      const base = 84;
      const ya = base - a * s, yb = base - b * s, ym = Math.max(36, Math.min(ya, yb));
      return tabua(4, 96, base) +
        torre(22, base, a, s, () => COR.azul) + torre(78, base, b, s, () => COR.rosa) +
        `<path d="M27 ${ya - 6} Q 32 ${ym - 22} 40 ${ym - 18}" fill="none" stroke="${T}" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="0.1 5.5"/>` +
        `<path d="M73 ${yb - 6} Q 68 ${ym - 22} 60 ${ym - 18}" fill="none" stroke="${T}" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="0.1 5.5"/>` +
        `<circle cx="50" cy="${ym - 16}" r="12" fill="${COR.ouro}" stroke="${T}" stroke-width="2.6"/>` +
        `<path d="M50 ${ym - 23} V ${ym - 9} M43 ${ym - 16} H 57" stroke="${T}" stroke-width="3.6" stroke-linecap="round"/>` +
        (alvo >= 10 ? `<path d="M50 70 c -5 -6 -13 -2 -10 4 c 2 4 10 9 10 9 s 8 -5 10 -9 c 3 -6 -5 -10 -10 -4 Z" fill="${COR.coral}" stroke="${T}" stroke-width="2.2"/>` : plaquinha(50, 72, alvo));
    },
    separar(p) {
      const tot = Number(p.totalMax) || 5;
      if (p.dezena || tot > 10) {
        return tabua(10, 80, 84) + dezena(30, 84, 15) + torre(54, 84, 2, 14, () => COR.roxo) +
          `<g transform="rotate(20 77 30)">${cubo(70, 22, 14, COR.roxo, true)}</g>` +
          `<path d="M58 50 q 4 -16 12 -20" fill="none" stroke="${T}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="0.1 5"/>` +
          `<path d="M66 50 l 7 -4 M68 57 l 8 -3" stroke="${T}" stroke-width="2.4" stroke-linecap="round"/>` + brilho(86, 58, 4, COR.ouro);
      }
      const fica = tot > 5 ? 5 : 3, s = tot > 5 ? 11.5 : 16, voam = tot > 5 ? 2 : 1;
      let voando = '';
      for (let i = 0; i < voam; i++) {
        const x = 58 + i * 17, y = 34 - i * 9;
        voando += `<g transform="rotate(${18 + i * 14} ${x + s / 2} ${y + s / 2})">${cubo(x, y, s, COR.roxo, true)}</g>`;
      }
      const topo = 84 - fica * s;
      return tabua(14, 70, 84) + torre(40, 84, fica, s) + voando +
        `<path d="M46 ${topo - 6} q 4 -12 14 -16" fill="none" stroke="${T}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="0.1 5"/>` +
        `<path d="M58 ${topo + 8} l 8 -4 M60 ${topo + 16} l 9 -3" stroke="${T}" stroke-width="2.4" stroke-linecap="round"/>` +
        brilho(16, 26, 4, '#fff') + brilho(86, 66, 4, COR.ouro);
    },
    pintinhos(p) {
      const capim = `<path d="M6 84 l 3 -8 l 2 8 M88 82 l 3 -8 l 2 8" fill="none" stroke="#C99A3C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (p.modo === 'comparar') {
        // dois ninhos: de qual lado tem mais?
        const ninhoFeito = (cx, rx, pos) => pos.map(([x, y], i) => pintinho(x, y, 0.44, i % 2)).join('') +
          `<ellipse cx="${cx}" cy="79" rx="${rx}" ry="7" fill="${COR.madeira}" stroke="${T}" stroke-width="2.4"/>` +
          `<path d="M${cx - rx + 4} 79 h ${2 * rx - 8}" stroke="#E8B27E" stroke-width="1.8" stroke-dasharray="3 3"/>`;
        const ninho = (cx, n, e) => {
          let s = '';
          for (let i = 0; i < n; i++) s += pintinho(cx - (n - 1) * 8 + i * 16, 74 - (i % 2) * 6, e, i % 2);
          const rx = n > 2 ? 26 : 18;
          return s + `<ellipse cx="${cx}" cy="80" rx="${rx}" ry="8" fill="${COR.madeira}" stroke="${T}" stroke-width="2.4"/>` +
            `<path d="M${cx - rx + 4} 80 h ${2 * rx - 8}" stroke="#E8B27E" stroke-width="1.8" stroke-dasharray="3 3"/>`;
        };
        return capim + ninhoFeito(25, 19, [[15, 76], [35, 76]]) + ninhoFeito(70, 25, [[56, 78], [84, 78], [70, 64]]) + brilho(48, 22, 6, COR.ouro) + brilho(80, 24, 3.5, '#fff');
      }
      if (p.modo === 'olhadinha') {
        if (p.arranjo === 'quadro10') {
          // quadro de dez: 2 × 5 casinhas, 7 cheias
          let casas = '';
          for (let i = 0; i < 10; i++) {
            const x = 13 + (i % 5) * 15, y = 22 + Math.floor(i / 5) * 15;
            casas += `<rect x="${x}" y="${y}" width="15" height="15" fill="#fff" stroke="${T}" stroke-width="2"/>` +
              (i < 7 ? `<circle cx="${x + 7.5}" cy="${y + 7.5}" r="4.8" fill="${i < 5 ? COR.roxo : COR.ouro}" stroke="${T}" stroke-width="1.5"/>` : '');
          }
          return capim + `<rect x="9" y="18" width="83" height="38" rx="6" fill="${COR.turquesa}" stroke="${T}" stroke-width="2.6"/>` + casas +
            pintinho(70, 92, 0.48, true) + `<path d="M16 72 q 8 -7 16 0 q -8 7 -16 0 Z" fill="#fff" stroke="${T}" stroke-width="2"/><circle cx="24" cy="72" r="2.8" fill="${T}"/>`;
        }
        // dado: num piscar de olhos, quantos?
        const pontos = [[-11, -11], [11, -11], [0, 0], [-11, 11], [11, 11]].map(([dx, dy]) => `<circle cx="${46 + dx}" cy="${40 + dy}" r="4.6" fill="${T}"/>`).join('');
        return capim + `<g transform="rotate(-10 46 40)"><rect x="22" y="19" width="48" height="48" rx="10" fill="#E8E2F5" stroke="${T}" stroke-width="2.6"/>` +
          `<rect x="22" y="16" width="48" height="48" rx="10" fill="#fff" stroke="${T}" stroke-width="2.6"/>${pontos}</g>` +
          pintinho(78, 92, 0.46, true) + brilho(84, 22, 4.5, COR.ouro) +
          `<path d="M10 78 q 8 -7 16 0 q -8 7 -16 0 Z" fill="#fff" stroke="${T}" stroke-width="2"/><circle cx="18" cy="78" r="2.8" fill="${T}"/>`;
      }
      // contar: a turminha de pintinhos, com o brilho do toque
      const muitos = (Number(p.max) || 4) > 5;
      const lista = muitos
        ? [[24, 58, 0.38, 1], [52, 54, 0.38], [78, 58, 0.38, 1], [34, 88, 0.42], [66, 88, 0.42, 1]]
        : [[50, 56, 0.55, 1], [26, 90, 0.6], [74, 90, 0.6, 1]];
      return capim + lista.map(([x, y, e, v]) => pintinho(x, y, e, v)).join('') +
        brilho(muitos ? 52 : 50, muitos ? 18 : 16, 5, COR.ouro) + brilho(86, 30, 3.5, '#fff');
    },
    tracar(p) {
      const dig = (p.digitos || [1, 2, 3]).join(' ');
      return `<g transform="rotate(-6 50 50)"><rect x="6" y="20" width="80" height="58" rx="7" fill="#fff" stroke="${T}" stroke-width="2.6"/>` +
        `<path d="M14 33 H 78 M14 66 H 78" stroke="#BFE9E3" stroke-width="1.8"/>` +
        `<text x="40" y="62" text-anchor="middle" font-size="${dig.length > 5 ? 28 : 32}" ${FONTE} fill="#B5EDE5" stroke="${COR.turquesa}" stroke-width="1.9" stroke-dasharray="3.2 2.4" stroke-linejoin="round" letter-spacing="2">${dig}</text>` +
        `</g>` +
        `<circle cx="15" cy="36" r="5" fill="${COR.verde}" stroke="${T}" stroke-width="2"/>` +
        `<g transform="translate(8 8) scale(.9) rotate(38 76 66)"><rect x="69" y="30" width="14" height="42" rx="3.5" fill="${COR.ouro}" stroke="${T}" stroke-width="2.6"/>` +
        `<path d="M73.5 30 V 72" stroke="#E9A92A" stroke-width="2.2"/><rect x="69" y="25" width="14" height="8" rx="3" fill="${COR.rosa}" stroke="${T}" stroke-width="2.4"/>` +
        `<path d="M69 72 L 76 86 L 83 72 Z" fill="#FFE0C2" stroke="${T}" stroke-width="2.4" stroke-linejoin="round"/><path d="M74 82 L 76 86 L 78 82 Z" fill="${T}"/></g>` +
        brilho(86, 14, 4.5, COR.ouro);
    },
    feirinha(p) {
      const toldo = [0, 1, 2, 3, 4, 5].map(i => `<path d="M${8 + i * 14} 24 h 14 v 7 a 7 7 0 0 1 -14 0 Z" fill="${i % 2 ? '#fff' : COR.coral}" stroke="${T}" stroke-width="2.3" stroke-linejoin="round"/>`).join('');
      const banca = `<path d="M14 30 V 60 M86 30 V 60" stroke="${COR.madeiraEsc}" stroke-width="3.6"/>` +
        `<path d="M5 24 L 13 8 H 87 L 95 24 Z" fill="${COR.coral}" stroke="${T}" stroke-width="2.4" stroke-linejoin="round"/>` + toldo +
        `<rect x="6" y="58" width="88" height="19" rx="4" fill="${COR.madeira}" stroke="${T}" stroke-width="2.6"/>` +
        `<path d="M11 65 H 89" stroke="#E8B27E" stroke-width="1.8"/>` +
        `<circle cx="27" cy="49" r="9" fill="${COR.laranja}" stroke="${T}" stroke-width="2.3"/><path d="M27 40 q 3 -4 7 -3" fill="none" stroke="${COR.verde}" stroke-width="2.4" stroke-linecap="round"/><circle cx="24" cy="46" r="2" fill="#fff" opacity=".6"/>` +
        `<path d="M40 52 q 11 6 22 -8 q -2 14 -22 14 Z" fill="#FFE14D" stroke="${T}" stroke-width="2.3" stroke-linejoin="round"/>` +
        `<path d="M64 58 a 12 12 0 0 1 24 0 Z" fill="#E8434D" stroke="${T}" stroke-width="2.3"/><path d="M67 58 a 9 9 0 0 1 18 0" fill="none" stroke="${COR.verde}" stroke-width="2.4"/>` +
        `<circle cx="72" cy="53" r="1.1" fill="${T}"/><circle cx="78" cy="51" r="1.1" fill="${T}"/><circle cx="82" cy="55" r="1.1" fill="${T}"/>`;
      let moedas;
      if (p.modo === 'troco') {
        moedas = moeda(24, 86, 9.5, 5) +
          `<path d="M40 90 q 9 -9 18 0" fill="none" stroke="${T}" stroke-width="2.6" stroke-linecap="round"/><path d="M56 85 l 3 5 l -5 2" fill="none" stroke="${T}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
          moeda(64, 87, 7.5, 1) + moeda(78, 83, 7.5, 1);
      } else {
        const vals = p.moedas || [1];
        const xs = vals.length === 1 ? [50] : vals.length === 2 ? [39, 61] : [28, 50, 72];
        moedas = vals.map((v, i) => moeda(xs[i], 88, 9.5, v)).join('');
      }
      return banca + moedas;
    },
    sapinho(p) {
      const ini = Number(p.inicio) || 1, passo = Number(p.passo) || 1;
      const seq = passo === -1 ? [ini - 1, ini - 2] : [ini, ini + passo];
      const agua = `<path d="M30 96 q 6 -3 12 0 M58 97 q 6 -3 12 0" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`;
      // folha de vitória-régia: disco verde com o cortezinho, e o número bem grande
      const folha = (cx, cy, r, texto, destaque) =>
        `<ellipse cx="${cx}" cy="${cy + 2}" rx="${r}" ry="${r * 0.55}" fill="#3E9E3A" stroke="${T}" stroke-width="2.4"/>` +
        `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.55}" fill="${destaque ? '#B8F08A' : '#6CCB4A'}" stroke="${T}" stroke-width="2.4"/>` +
        `<path d="M${cx} ${cy} L ${cx + r * 0.75} ${cy - r * 0.42} L ${cx + r * 0.95} ${cy - r * 0.12} Z" fill="${FUNDO.sapinho[1]}" stroke="${T}" stroke-width="2" stroke-linejoin="round"/>` +
        `<text x="${cx - r * 0.12}" y="${cy + r * 0.3}" text-anchor="middle" font-size="${String(texto).length > 1 ? r * 0.72 : r * 0.85}" ${FONTE} fill="${destaque ? COR.coral : '#fff'}" stroke="${T}" stroke-width="${destaque ? 0 : 2.2}" paint-order="stroke">${texto}</text>`;
      return agua + folha(22, 74, 16, seq[0]) + folha(50, 82, 16, seq[1]) + folha(78, 70, 15, '?', true) +
        `<path d="M56 68 Q 66 34 76 60" fill="none" stroke="${T}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="0.1 5.5"/>` +
        sapo(42, 50, 0.62) +
        `<path d="M8 50 l 2 -16 M15 54 l 3 -18" stroke="#7BBE4A" stroke-width="2.8" stroke-linecap="round"/>` +
        `<ellipse cx="10" cy="32" rx="2.6" ry="6" fill="${COR.madeiraEsc}" stroke="${T}" stroke-width="1.4"/>` +
        brilho(84, 20, 4.5, '#fff');
    },
  };

  /** SVG do medalhão da estação (fase = item de PC.fases). Recortado em círculo; o disco do mapa faz a moldura. */
  function medalhao(fase) {
    let at = fase && fase.atividade;
    const p = (fase && fase.params) || {};
    if (at === 'tracar' && p.letras && CENAS['tracar-letras']) at = 'tracar-letras';
    const cena = CENAS[at];
    if (!cena) return PC.arte.icone(at);
    const id = PC.arte.novoId('pc-med-');
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<defs><clipPath id="${id}"><circle cx="50" cy="50" r="50"/></clipPath></defs>` +
      `<g clip-path="url(#${id})">${fundo(at)}${cena(p)}</g></svg>`;
  }

  PC.arte.medalhao = medalhao;
  PC.arte.registrarMedalhao = (id, { fundo: f, cena }) => { if (f) FUNDO[id] = f; CENAS[id] = cena; };
  /** Cartinha de letra (sem rosto): x, y = centro; l = largura; letra; cor do papel. */
  const cartinha = (x, y, l, letra, cor = '#fff', giro = 0) => {
    const a = l * 1.25;
    return `<g transform="rotate(${giro} ${x} ${y})"><rect x="${x - l / 2}" y="${y - a / 2}" width="${l}" height="${a}" rx="${l * 0.18}" fill="${cor}" stroke="${T}" stroke-width="2.4"/>` +
      `<text x="${x}" y="${y + l * 0.3}" text-anchor="middle" font-size="${l * 0.82}" ${FONTE} fill="${T}">${letra}</text></g>`;
  };
  PC.arte.pecasMedalhao = { T, COR, FONTE, brilho, cartinha };
})();
