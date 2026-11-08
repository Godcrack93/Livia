/* Pipoca Conta — atividade "feirinha" (PROJETO.md 5.4): a Feirinha da Pipoca, com moedinhas de brinquedo.
   Barraca de feira (toldo listrado, caixotes) com 3 ou 4 produtos brasileiros; cada caixote tem a plaquinha de preço
   (algarismo e pontinhos). Um freguês (tucano, arara ou quati) quer um produto (balãozinho de pensamento, sem fala:
   só a Pipoca fala).
   comprar: a criança põe moedas do cofrinho no balcão — arrastando OU tocando na moeda (ela voa sozinha). Tocar no
            balcão devolve a moeda mais perto do dedo (ou arrastá-la para fora do balcão). A voz conta a partir do
            total anterior ("três... quatro, cinco!"). confirmar: false → acerta quando o total bate;
            confirmar: true → botão Pagar (data-teste "pagar"); total diferente → erro descritivo e a criança corrige.
   troco:   o freguês pagou com uma moeda de 5 um produto de 1 a 4. No balcão, um quadro de 5 com P casas ocupadas
            pelo preço; a criança completa as casas vazias com moedas de 1, até a mão do freguês. A voz conta a
            partir do preço ("custa três... quatro, cinco! Dois de troco"). Botão Pronto (data-teste "pagar").
            Tocar na moeda com que o freguês pagou só lembra o valor dela.
   Moedas de brinquedo, de tamanhos diferentes e sem algarismo: 1 (pequena, bronze, 1 pontinho), 2 (média, prateada,
   2 pontinhos), 5 (grande, dourada, 5 pontinhos como no dado) e a notinha de 10 (só se params.moedas tiver 10).
   Nada imita o Real. data-teste: moeda-1, moeda-2, moeda-5 (moeda-10), balcao, pagar, produto-0…3, fregues.
   O cofrinho e o botão dividem a fileira de baixo (o lugar padrão do botão, à direita, é do banquinho do freguês).
   Toda fala direta na voz (contagens) espera o "Quer parar?" fechar; a ajuda e a contagem param quando ele abre.
   params: { modo: 'comprar'|'troco', precoMin, precoMax, moedas: [1] | [1,2] | [1,2,5], pagaCom: 5, rodadas, demo,
             confirmar } */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;
  const T = '#3A2A5A';                                  // contorno

  // ---------------------------------------------------------------- posições (palco virtual 1600×900)
  const BALCAO = { x: 556, y: 452, l: 742, a: 214 };    // tampo do balcão: área de toque e de soltura das moedas
  const MOEDAS_X0 = 598, MOEDAS_X1 = 1256;              // faixa onde as moedas ficam deitadas no balcão
  const LINHA_UNICA = 560, LINHAS = [512, 612];         // centros das fileiras de moedas no balcão
  const MAX_BALCAO = 12;                                // moedas no balcão, no máximo
  const PRODUTO_TOPO = 230;                             // alto da fruta; o caixote fica embaixo dela
  const FREGUES = { x: 1252, y: 268, l: 300, a: 344 };  // o freguês fica de pé no banquinho, à direita do balcão
  const PENSA = { x: 1408, y: 198 };                    // balãozinho de pensamento (só desenho)
  // Fileira de baixo: o cofrinho e o botão Pagar/Pronto dividem a faixa entre a Pipoca (x < 290) e o banquinho do
  // freguês (x > 1334), centrados embaixo do balcão quando cabem. (O lugar padrão do botão, x ≈ 1420, é do banquinho.)
  const FILEIRA = { x0: 330, x1: 1322, centro: 927 };
  const BOTAO = { l: 340, a: 170, y: 795 };             // caixa do botão Pagar/Pronto (o botão tem 140 de altura)
  const BOTAO_VAO = 26;                                 // entre o cofrinho e o botão
  const COFRINHO_Y = 800;                               // centro das vagas do cofrinho
  const COFRINHO_PAD = 22, VAGA_VAO = 20;               // borda do cofrinho e espaço entre as vagas
  const VAGA = 170;                                     // área de toque de cada vaga do cofrinho
  const IMA = { cima: 90, lados: 90, baixo: 36 };       // folga da zona de soltura ("ímã")
  const CASA = 100, CASA_VAO = 6, QUADRO_PAD = 9;       // quadro de 5 (troco)

  // ---------------------------------------------------------------- moedas de brinquedo
  // d = diâmetro (px virtuais). Pontinhos em unidades do raio da face; a ordem é a da contagem.
  const MOEDAS = {
    1: { d: 96, aro: '#C47C45', face: '#E9AC72', luz: '#FAD7B0', canto: '#8E5328', pontos: [[0, 0]], rp: 0.26 },
    2: { d: 118, aro: '#A4B1C0', face: '#DDE4EC', luz: '#FFFFFF', canto: '#6F7C92', pontos: [[-0.36, -0.36], [0.36, 0.36]], rp: 0.21 },
    5: { d: 144, aro: '#E8A300', face: '#FFD23F', luz: '#FFF1A8', canto: '#B07800',
      pontos: [[-0.42, -0.42], [0.42, -0.42], [0, 0], [-0.42, 0.42], [0.42, 0.42]], rp: 0.17 },
    10: { nota: true, l: 188, a: 106, cor: '#A7E9D6', canto: '#3FA88C', luz: '#E6FBF4' },
  };
  const tamanho = v => (MOEDAS[v].nota ? { l: MOEDAS[v].l, a: MOEDAS[v].a } : { l: MOEDAS[v].d, a: MOEDAS[v].d });

  /** SVG de uma moeda (ou da notinha) com os pontinhos (classe pc-feirinha-ponto, na ordem de contar). */
  function desenhoMoeda(v) {
    const m = MOEDAS[v];
    if (m.nota) {
      const l = m.l, a = m.a, x = -l / 2, y = -a / 2;
      let pontos = '';
      for (let i = 0; i < 10; i++) {
        const c = i % 5, f = Math.floor(i / 5);
        pontos += `<circle class="pc-feirinha-ponto" cx="${(c - 2) * 27}" cy="${f ? 17 : -17}" r="9" fill="${i < 5 ? '#9B7BFF' : '#FFC93C'}" stroke="${T}" stroke-width="3"/>`;
      }
      return `<svg viewBox="${x} ${y} ${l} ${a}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
        `<rect x="${x + 2}" y="${y + 8}" width="${l - 4}" height="${a - 4}" rx="14" fill="${m.canto}" stroke="${T}" stroke-width="5"/>` +
        `<rect x="${x + 2}" y="${y + 2}" width="${l - 4}" height="${a - 4}" rx="14" fill="${m.cor}" stroke="${T}" stroke-width="5"/>` +
        `<rect x="${x + 12}" y="${y + 12}" width="${l - 24}" height="${a - 24}" rx="9" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="7 7"/>` +
        `<path d="M${x + 16} ${y + 30} q 8 -14 18 -14 M${-x - 16} ${-y - 30} q -8 14 -18 14" fill="none" stroke="${m.luz}" stroke-width="6" stroke-linecap="round"/>` +
        pontos + `</svg>`;
    }
    const r = m.d / 2, rf = r * 0.74, rp = rf * m.rp;
    const pontos = m.pontos.map(([px, py]) =>
      `<circle class="pc-feirinha-ponto" cx="${(px * rf).toFixed(1)}" cy="${(py * rf).toFixed(1)}" r="${rp.toFixed(1)}" fill="#9B7BFF" stroke="${T}" stroke-width="3"/>`).join('');
    return `<svg viewBox="${-r} ${-r} ${2 * r} ${2 * r}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<circle cx="0" cy="6" r="${r - 3}" fill="${m.canto}" stroke="${T}" stroke-width="5"/>` +
      `<circle cx="0" cy="0" r="${r - 3}" fill="${m.aro}" stroke="${T}" stroke-width="5"/>` +
      `<circle cx="0" cy="0" r="${rf.toFixed(1)}" fill="${m.face}" stroke="${m.canto}" stroke-width="3"/>` +
      `<path d="M${(-rf * 0.62).toFixed(1)} ${(-rf * 0.42).toFixed(1)} A ${(rf * 0.75).toFixed(1)} ${(rf * 0.75).toFixed(1)} 0 0 1 ${(-rf * 0.1).toFixed(1)} ${(-rf * 0.74).toFixed(1)}" fill="none" stroke="${m.luz}" stroke-width="${Math.max(5, r * 0.1).toFixed(1)}" stroke-linecap="round"/>` +
      pontos + `</svg>`;
  }

  /** Elemento de uma moeda centrado em (x, y). */
  function criarMoeda(v, x, y) {
    const t = tamanho(v);
    const el = U.el('div', { class: 'pc-feirinha-moeda', html: desenhoMoeda(v),
      style: { left: (x - t.l / 2) + 'px', top: (y - t.a / 2) + 'px', width: t.l + 'px', height: t.a + 'px' } });
    return { v, el, x, y, l: t.l, a: t.a };
  }
  /** Põe a moeda (sem animar) com o centro em (x, y). */
  function posicionar(m, x, y) {
    m.x = x; m.y = y;
    m.el.style.left = (x - m.l / 2) + 'px';
    m.el.style.top = (y - m.a / 2) + 'px';
  }

  // ---------------------------------------------------------------- produtos da feira (viewBox 0 0 120 100)
  const C4 = `stroke="${T}" stroke-width="4" stroke-linejoin="round"`;
  const pintas = (cor, lista, r) => `<g fill="${cor}">` + lista.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r || 2.3}"/>`).join('') + `</g>`;
  const brilho = (x, y, rx, ry, ang) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".4" transform="rotate(${ang || -30} ${x} ${y})"/>`;
  const folha = (x, y, ang) => `<path transform="rotate(${ang || 0} ${x} ${y})" d="M${x} ${y} C ${x + 10} ${y - 12} ${x + 30} ${y - 10} ${x + 34} ${y - 2} C ${x + 24} ${y + 8} ${x + 8} ${y + 8} ${x} ${y} Z" fill="#5CC84A" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/>`;

  const DESENHOS = {
    banana: `<path d="M30 16 C 38 48 64 66 106 62 C 113 61 112 53 105 53 C 72 54 50 40 42 16 Z" fill="#FFE57A" ${C4}/>
      <path d="M30 16 C 26 52 50 80 92 84 C 99 85 100 77 93 76 C 62 72 44 50 42 16 Z" fill="#F5C531" ${C4}/>
      <path d="M30 16 C 18 50 30 80 68 94 C 75 96 78 89 72 86 C 46 74 38 48 42 16 Z" fill="#FFD84D" ${C4}/>
      <g fill="${T}"><ellipse cx="108" cy="57" rx="3.5" ry="4"/><ellipse cx="96" cy="80" rx="3.5" ry="4"/><ellipse cx="73" cy="91" rx="3.5" ry="4"/></g>
      <rect x="27" y="4" width="18" height="16" rx="5" fill="#8A5A34" ${C4}/>
      <path d="M36 36 C 40 50 48 58 58 64" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>`,
    manga: `<path d="M58 16 C 90 12 112 38 106 66 C 100 90 70 98 44 91 C 18 83 8 58 18 38 C 26 24 42 18 58 16 Z" fill="#FFB238"/>
      <path d="M60 16 C 84 14 102 28 107 50 C 92 46 76 36 68 28 C 64 24 61 20 60 16 Z" fill="#8CCB4E"/>
      <path d="M17 42 C 11 58 20 80 42 90 C 31 76 27 60 31 46 Z" fill="#FF7A4D" opacity=".85"/>
      <path d="M58 16 C 90 12 112 38 106 66 C 100 90 70 98 44 91 C 18 83 8 58 18 38 C 26 24 42 18 58 16 Z" fill="none" ${C4}/>
      ${brilho(42, 40, 12, 7)}
      <path d="M60 17 C 61 10 64 6 69 3" fill="none" stroke="#6B4A2A" stroke-width="5" stroke-linecap="round"/>${folha(66, 8, -8)}`,
    abacaxi: `<path d="M60 40 L 40 10 L 54 22 L 60 2 L 66 22 L 80 10 Z" fill="#5CC84A" ${C4}/>
      <path d="M58 40 L 30 26 L 52 30 Z M62 40 L 90 26 L 68 30 Z" fill="#3E9A30" ${C4}/>
      <ellipse cx="60" cy="68" rx="30" ry="29" fill="#FFC23D" ${C4}/>
      <path d="${[[46, 54], [60, 50], [74, 54], [40, 68], [53, 67], [67, 67], [80, 68], [46, 82], [60, 85], [74, 82]]
        .map(([x, y]) => `M${x - 4} ${y - 4} l 8 8 M${x + 4} ${y - 4} l -8 8`).join(' ')}" stroke="#D98E10" stroke-width="3" stroke-linecap="round"/>
      ${brilho(45, 58, 7, 11, 20)}`,
    caju: `<path d="M48 77 C 41 88 51 95 61 91 C 68 88 71 84 78 85 C 86 86 87 77 78 75 Z" fill="#A8977A" ${C4}/>
      <path d="M60 12 C 46 12 41 24 39 39 C 36 56 31 66 41 73 C 51 80 69 80 79 73 C 89 66 84 56 81 39 C 79 24 74 12 60 12 Z" fill="#FF5A4E"/>
      <path d="M70 16 C 78 28 82 48 84 63 C 81 68 77 70 75 68 C 75 51 73 31 66 18 Z" fill="#FFB238" opacity=".9"/>
      <path d="M60 12 C 46 12 41 24 39 39 C 36 56 31 66 41 73 C 51 80 69 80 79 73 C 89 66 84 56 81 39 C 79 24 74 12 60 12 Z" fill="none" ${C4}/>
      ${brilho(50, 35, 6, 11, 12)}
      <path d="M60 13 C 60 8 62 5 66 3" fill="none" stroke="#6B4A2A" stroke-width="5" stroke-linecap="round"/>${folha(64, 6, -14)}`,
    laranja: `<circle cx="60" cy="58" r="38" fill="#FF9F2E" ${C4}/>
      ${pintas('#E8841A', [[40, 66], [50, 80], [66, 84], [80, 70], [84, 52], [70, 40], [56, 60], [36, 50]])}
      ${brilho(45, 42, 11, 7)}
      <path d="M60 21 V 12" stroke="#6B4A2A" stroke-width="5" stroke-linecap="round"/>${folha(61, 13, -10)}`,
    melancia: `<path d="M6 34 A 54 54 0 0 0 114 34 Z" fill="#4CAF50" ${C4}/>
      <path d="M15 34 A 45 45 0 0 0 105 34 Z" fill="#E6F7C4"/>
      <path d="M21 34 A 39 39 0 0 0 99 34 Z" fill="#FF4D5E"/>
      <path d="M6 34 H 114" stroke="${T}" stroke-width="4" stroke-linecap="round"/>
      <g fill="${T}"><ellipse cx="42" cy="46" rx="3" ry="4.6"/><ellipse cx="60" cy="54" rx="3" ry="4.6"/><ellipse cx="78" cy="46" rx="3" ry="4.6"/><ellipse cx="50" cy="64" rx="3" ry="4.6"/><ellipse cx="70" cy="64" rx="3" ry="4.6"/></g>
      <path d="M30 40 C 34 52 42 60 52 66" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>`,
    goiaba: `<circle cx="78" cy="50" r="30" fill="#A9D46B" ${C4}/>
      <path d="M99 30 l 7 -7 M102 35 l 9 -2 M96 27 l 1 -9" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="46" cy="64" r="33" fill="#A9D46B" ${C4}/>
      <circle cx="46" cy="64" r="26" fill="#FF8FA3"/>
      <circle cx="46" cy="64" r="13" fill="#FFC6D1"/>
      ${pintas('#F7E2B5', [[46, 44], [62, 52], [64, 72], [48, 84], [30, 76], [28, 56], [38, 47], [56, 82]], 2.4)}
      ${brilho(84, 38, 9, 5)}`,
    milho: `<path d="M60 97 C 30 91 17 62 23 30 C 34 56 46 76 60 85 Z" fill="#7CC35A" ${C4}/>
      <path d="M60 97 C 90 91 103 62 97 30 C 86 56 74 76 60 85 Z" fill="#7CC35A" ${C4}/>
      <path d="M60 5 C 76 5 82 30 80 56 C 78 77 70 88 60 88 C 50 88 42 77 40 56 C 38 30 44 5 60 5 Z" fill="#FFD84D" ${C4}/>
      <path d="M47 22 H 73 M43 38 H 77 M42 54 H 78 M44 70 H 76 M53 10 V 84 M67 10 V 84" stroke="#E0A800" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M60 97 C 44 93 35 81 33 66 C 45 76 53 82 60 85 C 67 82 75 76 87 66 C 85 81 76 93 60 97 Z" fill="#5CC84A" ${C4}/>`,
    coco: `<path d="M18 56 C 18 32 38 24 60 24 C 82 24 102 32 102 56 C 102 82 84 97 60 97 C 36 97 18 82 18 56 Z" fill="#6FBF4F" ${C4}/>
      <path d="M24 72 C 40 86 80 86 96 72" fill="none" stroke="#4E9E37" stroke-width="4" stroke-linecap="round"/>
      <path d="M32 54 C 32 44 38 38 46 36" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="60" cy="33" rx="23" ry="8" fill="#FFF4D6" ${C4}/>
      <path d="M66 32 L 84 3" stroke="${T}" stroke-width="12" stroke-linecap="round"/>
      <path d="M66 32 L 84 3" stroke="#fff" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M66 32 L 84 3" stroke="#FF7A6B" stroke-width="6.5" stroke-dasharray="4 5"/>`,
    'pao-de-queijo': `<circle cx="37" cy="68" r="24" fill="#EDB85A" ${C4}/><circle cx="83" cy="68" r="24" fill="#F2C46D" ${C4}/>
      <circle cx="60" cy="40" r="25" fill="#F6CE7E" ${C4}/>
      ${pintas('#FBE6B0', [[30, 62], [44, 74], [76, 62], [90, 74], [52, 32], [66, 44], [58, 52]], 3)}
      ${pintas('#D49A3E', [[36, 82], [84, 84], [70, 30], [24, 70], [96, 64]], 2.2)}`,
    tapioca: `<path d="M12 56 C 14 30 36 14 60 14 C 84 14 106 30 108 56 Z" fill="#F1E7D0" ${C4}/>
      ${pintas('#E2D4B4', [[36, 32], [56, 24], [76, 28], [92, 42], [26, 46]], 2.4)}
      <path d="M11 56 Q 60 38 109 56 L 109 64 Q 60 48 11 64 Z" fill="#FFD84D" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>
      ${pintas('#FF6B5A', [[30, 54], [50, 49], [72, 49], [92, 54]], 3.4)}
      <path d="M10 60 Q 60 46 110 60 C 108 84 86 98 60 98 C 34 98 12 84 10 60 Z" fill="#FFFDF6" ${C4}/>
      ${pintas('#E8DCC2', [[30, 72], [48, 82], [66, 76], [84, 84], [94, 70], [40, 62], [62, 90]], 2.6)}`,
    pacoca: `<path d="M58 40 V 78 A 20 7 0 0 0 98 78 V 40 Z" fill="#D29E62" ${C4}/><ellipse cx="78" cy="40" rx="20" ry="7" fill="#EBC592" ${C4}/>
      <path d="M20 56 V 88 A 23 8 0 0 0 66 88 V 56 Z" fill="#D9A86C" ${C4}/><ellipse cx="43" cy="56" rx="23" ry="8" fill="#EFCB98" ${C4}/>
      ${pintas('#B9834B', [[30, 70], [44, 80], [56, 68], [36, 86], [66, 56], [86, 62], [74, 74], [90, 76], [36, 56], [50, 57], [72, 40], [84, 41]], 2.1)}`,
  };
  const PRODUTOS = [
    ['banana', 'banana', 'a'], ['manga', 'manga', 'a'], ['abacaxi', 'abacaxi', 'o'], ['caju', 'caju', 'o'],
    ['laranja', 'laranja', 'a'], ['melancia', 'melancia', 'a'], ['goiaba', 'goiaba', 'a'], ['milho', 'milho', 'o'],
    ['coco', 'coco', 'o'], ['pao-de-queijo', 'pão de queijo', 'o'], ['tapioca', 'tapioca', 'a'], ['pacoca', 'paçoca', 'a'],
  ].map(([id, nome, artigo]) => ({ id, nome, artigo }));
  const desenhoProduto = id => `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${DESENHOS[id]}</svg>`;

  /** Caixote de feira (ripas de madeira), viewBox 0 0 168 104. */
  const CAIXOTE = `<svg viewBox="0 0 168 104" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="4" y="6" width="160" height="94" rx="10" fill="#B9773F" stroke="${T}" stroke-width="5"/>
    <rect x="13" y="15" width="142" height="32" rx="6" fill="#DDA56C" stroke="${T}" stroke-width="3.5"/>
    <rect x="13" y="56" width="142" height="35" rx="6" fill="#DDA56C" stroke="${T}" stroke-width="3.5"/>
    <g fill="#8A5A34"><circle cx="22" cy="31" r="3"/><circle cx="146" cy="31" r="3"/><circle cx="22" cy="73" r="3"/><circle cx="146" cy="73" r="3"/></g></svg>`;

  // ---------------------------------------------------------------- fregueses (viewBox 0 0 300 344, olhando para a esquerda)
  // mao = ponto da mão/asa estendida sobre o balcão (onde o troco e o produto chegam).
  const S5 = `stroke="${T}" stroke-width="5" stroke-linejoin="round"`;
  const sombraChao = `<ellipse cx="178" cy="337" rx="82" ry="8" fill="rgba(58,42,90,.18)"/>`;
  const CORPO = 'M118 214 C 116 160 150 132 188 138 C 232 146 250 202 238 252 C 228 292 194 310 160 304 C 130 298 120 258 118 214 Z';
  const ASA = 'M180 196 C 148 202 100 210 58 222 C 44 226 44 242 60 242 C 100 240 148 236 184 234 Z';
  const pes = cor => `<path d="M160 296 V 330 M188 296 V 330" stroke="${cor}" stroke-width="10" stroke-linecap="round"/>` +
    `<path d="M148 333 H 172 M176 333 H 200" stroke="${cor}" stroke-width="8" stroke-linecap="round"/>`;
  const olhoBicho = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${T}"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.38}" r="${r * 0.36}" fill="#fff"/>`;

  const FREGUESES = {
    tucano: {
      nome: 'tucano', artigo: 'o', mao: { x: 54, y: 232 },
      svg: sombraChao +
        `<path d="M204 262 C 222 290 236 314 248 336 L 214 336 C 204 316 192 294 184 276 Z" fill="#241E36" ${S5}/>` + pes('#6D7FA0') +
        `<path d="${CORPO}" fill="#2B2440" ${S5}/>` +
        `<circle cx="164" cy="116" r="56" fill="#2B2440" ${S5}/>` +
        `<path d="M114 130 C 112 158 116 188 128 210 C 138 228 156 232 164 222 C 168 200 166 170 160 146 C 150 134 130 128 114 130 Z" fill="#FFF2C9" stroke="${T}" stroke-width="4"/>` +
        `<ellipse cx="146" cy="104" rx="22" ry="20" fill="#FF9F43" stroke="${T}" stroke-width="3.5"/><circle cx="146" cy="104" r="12" fill="#4DA3FF" stroke="${T}" stroke-width="3"/>` +
        olhoBicho(146, 104, 7.5) +
        `<path d="M116 88 C 84 76 38 82 8 116 C 4 121 8 125 14 122 C 46 110 86 112 118 126 Z" fill="#FF8A1C"/>` +
        `<path d="M116 88 C 96 81 70 80 48 87 C 70 89 96 95 117 104 Z" fill="#FFD23F"/>` +
        `<path d="M28 99 C 18 105 12 111 8 116 C 4 121 8 125 14 122 C 20 120 26 117 34 116 Z" fill="${T}"/>` +
        `<path d="M118 112 C 86 104 46 107 16 118" fill="none" stroke="${T}" stroke-width="3.5" stroke-linecap="round"/>` +
        `<path d="M116 88 C 84 76 38 82 8 116 C 4 121 8 125 14 122 C 46 110 86 112 118 126" fill="none" ${S5}/>` +
        `<ellipse cx="186" cy="136" rx="11" ry="6" fill="#FF8FA0" opacity=".55"/>` +
        `<path d="${ASA}" fill="#3B3358" ${S5}/>` +
        `<path d="M76 229 C 92 227 108 225 124 223 M70 236 C 92 234 112 232 134 230" fill="none" stroke="#5A4D80" stroke-width="3.5" stroke-linecap="round"/>`,
    },
    arara: {
      nome: 'arara', artigo: 'a', mao: { x: 54, y: 232 },
      svg: sombraChao +
        `<path d="M196 252 C 220 284 246 312 268 338 L 236 340 C 216 316 196 290 180 268 Z" fill="#2E4FB0" ${S5}/>` + pes('#4A4A5A') +
        `<path d="${CORPO}" fill="#3F6FE0" ${S5}/>` +
        `<path d="M128 214 C 128 184 146 166 170 168 C 164 196 162 226 166 256 C 146 256 130 240 128 214 Z" fill="#6E95F5"/>` +
        `<circle cx="164" cy="116" r="56" fill="#4A7BEA" ${S5}/>` +
        `<circle cx="150" cy="104" r="15" fill="#FFD23F" stroke="${T}" stroke-width="3.5"/>` + olhoBicho(149, 104, 8) +
        `<path d="M121 124 C 108 124 96 127 88 133 C 92 143 106 147 121 141 Z" fill="#2C2C3A" stroke="${T}" stroke-width="4" stroke-linejoin="round"/>` +
        `<path d="M114 127 C 107 131 105 137 109 141 C 115 141 121 137 121 129 Z" fill="#FFD23F"/>` +
        `<path d="M121 88 C 92 78 66 88 60 112 C 58 122 62 132 70 137 C 70 124 78 116 90 116 C 100 116 110 120 121 124 Z" fill="#3C3C4E" ${S5}/>` +
        `<path d="M86 92 C 76 98 70 106 68 116" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="4" stroke-linecap="round"/>` +
        `<ellipse cx="186" cy="138" rx="11" ry="6" fill="#FF8FA0" opacity=".5"/>` +
        `<path d="${ASA}" fill="#2E4FB0" ${S5}/>` +
        `<path d="M76 229 C 92 227 108 225 124 223 M70 236 C 92 234 112 232 134 230" fill="none" stroke="#6E95F5" stroke-width="3.5" stroke-linecap="round"/>`,
    },
    quati: {
      nome: 'quati', artigo: 'o', mao: { x: 56, y: 230 },
      svg: sombraChao +
        `<path d="M206 288 C 266 262 276 170 244 108" fill="none" stroke="${T}" stroke-width="38" stroke-linecap="round"/>` +
        `<path d="M206 288 C 266 262 276 170 244 108" fill="none" stroke="#C9773D" stroke-width="28" stroke-linecap="round"/>` +
        `<path d="M206 288 C 266 262 276 170 244 108" fill="none" stroke="#6B3B1E" stroke-width="28" stroke-dasharray="15 15"/>` +
        `<ellipse cx="154" cy="330" rx="21" ry="9" fill="#5A3218" stroke="${T}" stroke-width="4"/><ellipse cx="194" cy="330" rx="21" ry="9" fill="#5A3218" stroke="${T}" stroke-width="4"/>` +
        `<path d="M126 236 C 120 186 146 160 178 162 C 214 164 232 196 228 244 C 224 292 204 322 174 322 C 142 322 130 286 126 236 Z" fill="#C9773D" ${S5}/>` +
        `<path d="M144 240 C 142 206 156 190 174 190 C 196 192 206 214 204 246 C 202 280 192 300 174 300 C 156 300 146 276 144 240 Z" fill="#F3D2A2"/>` +
        `<circle cx="154" cy="74" r="13" fill="#A65E2C" stroke="${T}" stroke-width="4"/><circle cx="198" cy="76" r="13" fill="#A65E2C" stroke="${T}" stroke-width="4"/>` +
        `<circle cx="154" cy="75" r="6" fill="#6B3B1E"/><circle cx="198" cy="77" r="6" fill="#6B3B1E"/>` +
        `<circle cx="176" cy="118" r="50" fill="#C9773D" ${S5}/>` +
        `<path d="M150 100 C 120 102 92 112 72 120 C 60 124 60 140 72 143 C 96 148 124 150 152 150" fill="#C9773D" ${S5}/>` +
        `<path d="M144 111 C 122 113 98 119 82 125" fill="none" stroke="#FFF4E6" stroke-width="7" stroke-linecap="round"/>` +
        `<ellipse cx="66" cy="131" rx="9" ry="10" fill="#3A2A3A"/>` +
        `<path d="M86 146 C 94 150 102 150 108 148" fill="none" stroke="${T}" stroke-width="3" stroke-linecap="round"/>` +
        `<ellipse cx="152" cy="107" rx="16" ry="13" fill="#FFF4E6"/>` + olhoBicho(151, 108, 7.5) +
        `<ellipse cx="188" cy="138" rx="10" ry="6" fill="#FF8FA0" opacity=".5"/>` +
        `<path d="M172 206 C 142 208 102 214 66 222 C 54 225 54 240 68 240 C 102 238 142 234 178 230 Z" fill="#B5682F" ${S5}/>` +
        `<ellipse cx="60" cy="231" rx="13" ry="11" fill="#5A3218" stroke="${T}" stroke-width="4"/>`,
    },
  };
  const desenhoFregues = id => `<svg viewBox="0 0 300 344" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${FREGUESES[id].svg}</svg>`;

  // ---------------------------------------------------------------- a barraca (desenho fixo, em coordenadas do palco)
  function desenhoBarraca() {
    const x0 = 540, x1 = 1310, n = 13, w = (x1 - x0) / n, yb = 214;
    let listras = '', babado = '';
    for (let i = 0; i < n; i++) {
      const a = x0 + i * w, cor = i % 2 ? '#FFF8EC' : '#FF7A6B';
      listras += `<rect x="${a.toFixed(1)}" y="152" width="${w.toFixed(1)}" height="${yb - 152}" fill="${cor}"/>`;
      babado += `<path d="M${a.toFixed(1)} ${yb} A ${(w / 2).toFixed(1)} ${(w * 0.5).toFixed(1)} 0 0 0 ${(a + w).toFixed(1)} ${yb} Z" fill="${cor}" stroke="${T}" stroke-width="4" stroke-linejoin="round"/>`;
    }
    let ripas = '';
    for (let x = 626; x < 1280; x += 62) ripas += `M${x} 676 V 794 `;
    return `<svg class="pc-feirinha-cena" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="930" cy="806" rx="430" ry="14" fill="rgba(58,42,90,.16)"/>
      <ellipse cx="1435" cy="804" rx="110" ry="10" fill="rgba(58,42,90,.14)"/>
      <rect x="566" y="170" width="24" height="630" rx="6" fill="#A8743F" stroke="${T}" stroke-width="5"/>
      <rect x="1260" y="170" width="24" height="630" rx="6" fill="#A8743F" stroke="${T}" stroke-width="5"/>
      <rect x="590" y="220" width="670" height="206" fill="#FCEBCB" stroke="${T}" stroke-width="4"/>
      <path d="M758 222 V 424 M925 222 V 424 M1092 222 V 424" stroke="#F1D7AB" stroke-width="5"/>
      <rect x="572" y="424" width="706" height="18" rx="6" fill="#C98A55" stroke="${T}" stroke-width="4"/>
      ${listras}<rect x="${x0}" y="152" width="${x1 - x0}" height="${yb - 152}" fill="none" stroke="${T}" stroke-width="5"/>${babado}
      <rect x="530" y="140" width="790" height="16" rx="8" fill="#8A5A34" stroke="${T}" stroke-width="4"/>
      <rect x="566" y="666" width="722" height="134" fill="#B98546" stroke="${T}" stroke-width="5"/>
      <path d="${ripas}" stroke="#9C6A34" stroke-width="5" stroke-linecap="round"/>
      <rect x="${BALCAO.x - 4}" y="${BALCAO.y}" width="${BALCAO.l + 8}" height="${BALCAO.a}" rx="22" fill="#F0CF98" stroke="${T}" stroke-width="5"/>
      <path d="M592 520 H 1262 M592 596 H 1262" stroke="#E2BA7C" stroke-width="4" stroke-linecap="round"/>
      <rect x="${BALCAO.x - 4}" y="${BALCAO.y + BALCAO.a - 26}" width="${BALCAO.l + 8}" height="30" rx="12" fill="#C99556" stroke="${T}" stroke-width="5"/>
      <rect x="1352" y="622" width="20" height="178" rx="5" fill="#A8743F" stroke="${T}" stroke-width="4"/>
      <rect x="1496" y="622" width="20" height="178" rx="5" fill="#A8743F" stroke="${T}" stroke-width="4"/>
      <rect x="1334" y="604" width="200" height="24" rx="10" fill="#C98A55" stroke="${T}" stroke-width="4"/>
    </svg>`;
  }

  // ---------------------------------------------------------------- estilo do módulo
  const CSS = `
    .pc-feirinha { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; }
    .pc-feirinha-cena { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; pointer-events: none; overflow: visible; z-index: 0; }
    .pc-feirinha-moeda > svg, .pc-feirinha-fruta > svg, .pc-feirinha-caixote > svg, .pc-feirinha-fregues .corpo > svg,
    .pc-feirinha-pensa .fruta > svg, .pc-feirinha-voo > svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .pc-feirinha-produto { position: absolute; z-index: 2; touch-action: manipulation; cursor: pointer; }
    .pc-feirinha-produto > * { pointer-events: none; }
    .pc-feirinha-luz { position: absolute; left: -8px; top: -8px; right: -8px; bottom: -6px; border-radius: 30px; background: rgba(255, 249, 214, .9);
      border: 6px solid #FFC93C; box-shadow: 0 0 0 4px ${T}; opacity: 0; transition: opacity .2s; }
    .pc-feirinha-escolhido > .pc-feirinha-luz { opacity: 1; }
    .pc-feirinha-fruta { position: absolute; left: 50%; top: 0; width: 136px; height: 113px; margin-left: -68px; }
    .pc-feirinha-caixote { position: absolute; left: 50%; top: 92px; width: 168px; height: 104px; margin-left: -84px; }
    .pc-feirinha-placa { position: absolute; left: 50%; top: 100px; transform: translateX(-50%) rotate(-3deg); min-width: 108px; padding: 3px 12px 9px;
      display: grid; justify-items: center; gap: 2px; background: #fff; border: 5px solid ${T}; border-radius: 18px; box-shadow: 0 5px 0 rgba(58, 42, 90, .25); }
    .pc-feirinha-placa b { font: 700 66px/1 var(--fonte); color: ${T}; }
    .pc-feirinha-placa .pontos { display: grid; gap: 4px; }
    .pc-feirinha-placa .pontos i { width: 15px; height: 15px; border-radius: 50%; background: #9B7BFF; border: 3px solid ${T}; }
    .pc-feirinha-placa .pontos i.b { background: #FFC93C; }
    .pc-feirinha-balcao { position: absolute; z-index: 3; border-radius: 24px; touch-action: none; }
    .pc-feirinha-balcao::after { content: ''; position: absolute; left: 4px; top: 4px; right: 4px; bottom: 30px; border-radius: 22px; border: 7px solid #FFC93C;
      background: rgba(255, 240, 170, .4); opacity: 0; transition: opacity .15s; pointer-events: none; }
    .pc-feirinha-balcao.ima::after, .pc-feirinha-balcao.acende::after { opacity: 1; }
    .pc-feirinha-moeda { position: absolute; z-index: 5; pointer-events: none; }
    .pc-feirinha-moeda.solta { z-index: 22; }
    .pc-feirinha-ponto { transition: fill .12s; }
    .pc-feirinha-ponto.aceso { fill: #FFFFFF; }
    .pc-feirinha-cofrinho { position: absolute; z-index: 4; pointer-events: none; border-radius: 40px; background: #FF9EC7; border: 6px solid ${T};
      box-shadow: inset 0 -14px 0 #EE7FAE, 0 8px 0 rgba(58, 42, 90, .22); }
    .pc-feirinha-poco { position: absolute; z-index: 4; pointer-events: none; border-radius: 50%; background: #E46A9C; border: 5px solid ${T}; }
    .pc-feirinha-vaga { position: absolute; z-index: 6; border-radius: 40px; touch-action: none; cursor: pointer; }
    .pc-feirinha-nao { animation: pcFeirinhaNao .4s ease; }
    @keyframes pcFeirinhaNao { 25%, 75% { transform: translateX(-9px); } 50% { transform: translateX(9px); } }
    .pc-feirinha-fregues { position: absolute; z-index: 4; pointer-events: none; }
    .pc-feirinha-fregues .corpo { width: 100%; height: 100%; transform-origin: 50% 100%; animation: pcFeirinhaRespira 2.6s ease-in-out infinite; }
    @keyframes pcFeirinhaRespira { 50% { transform: scale(1.015, .985); } }
    .pc-feirinha-fregues-toque { position: absolute; z-index: 4; touch-action: manipulation; cursor: pointer; border-radius: 60px; }
    .pc-feirinha-pensa { position: absolute; z-index: 4; pointer-events: none; width: 172px; height: 126px; margin: -63px 0 0 -86px; border-radius: 50%;
      background: #fff; border: 5px solid ${T}; display: grid; place-items: center; box-shadow: 0 6px 0 rgba(58, 42, 90, .16); }
    .pc-feirinha-pensa .fruta { width: 112px; height: 93px; }
    .pc-feirinha-pensa i { position: absolute; border-radius: 50%; background: #fff; border: 4px solid ${T}; }
    .pc-feirinha-botao { position: absolute; z-index: 7; display: flex; align-items: center; justify-content: center; pointer-events: none; }
    .pc-feirinha-botao .botao-grande { flex: none; pointer-events: auto; height: 140px; padding: 0 44px 0 32px; white-space: nowrap; }
    .pc-feirinha-quadro { position: absolute; z-index: 4; pointer-events: none; background: #FFF8EC; border: 5px solid ${T}; border-radius: 22px;
      box-shadow: 0 6px 0 rgba(58, 42, 90, .2); }
    .pc-feirinha-casa { position: absolute; width: ${CASA}px; height: ${CASA}px; border-radius: 18px; border: 4px dashed #A897CF; background: #fff;
      display: grid; place-items: center; transition: background .15s, border-color .15s; }
    .pc-feirinha-casa.preco { border: 4px solid ${T}; background: #EFE8FF; }
    .pc-feirinha-casa.preco i { width: 46px; height: 46px; border-radius: 50%; background: #9B7BFF; border: 4px solid ${T}; transition: background .15s; }
    .pc-feirinha-casa.preco i.aceso { background: #fff; }
    .pc-feirinha-casa.acesa { border-color: #E0A100; border-style: solid; background: #FFF4C2; }
    .pc-feirinha-voo { position: absolute; z-index: 24; pointer-events: none; }
  `;

  // ---------------------------------------------------------------- utilidades e sorteio
  const inteiro = (v, padrao) => { const n = Math.round(Number(v)); return isFinite(n) ? n : padrao; };
  const ext = n => PC.voz.extenso(n);
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);
  const memorias = new WeakMap();      // por estação jogada (o objeto params é o mesmo em todas as rodadas dela)

  function lerParams(params) {
    const modo = params.modo === 'troco' ? 'troco' : 'comprar';
    const pagaCom = modo === 'troco' ? (inteiro(params.pagaCom, 5) === 10 ? 10 : 5) : 0;
    const teto = modo === 'troco' ? pagaCom - 1 : 10;
    const min = U.limitar(inteiro(params.precoMin, 1), 1, teto);
    const max = U.limitar(inteiro(params.precoMax, min), min, teto);
    let moedas = modo === 'troco' ? [1] : (Array.isArray(params.moedas) ? params.moedas.map(Number).filter(v => MOEDAS[v]) : [1]);
    if (moedas.indexOf(1) < 0) moedas.push(1);                   // com moedas de 1, todo preço tem solução
    moedas = moedas.filter((v, i) => moedas.indexOf(v) === i).sort((a, b) => a - b);
    return { modo, pagaCom, min, max, moedas, confirmar: !!params.confirmar };
  }

  /** Preço, produtos da barraca (3 ou 4, preços diferentes) e freguês, sem repetir os da rodada anterior quando der. */
  function sortear(cfg, mem) {
    const faixa = []; for (let p = cfg.min; p <= cfg.max; p++) faixa.push(p);
    const precos = faixa.length > 1 ? faixa.filter(p => p !== mem.preco) : faixa;
    const preco = U.escolher(precos);
    const k = faixa.length >= 4 ? 4 : 3;
    const dist = p => (p < cfg.min ? cfg.min - p : p > cfg.max ? p - cfg.max : 0);
    const fora = []; for (let p = 1; p <= 10; p++) if (faixa.indexOf(p) < 0) fora.push(p);
    fora.sort((a, b) => dist(a) - dist(b));
    const outros = U.embaralhar(faixa.filter(p => p !== preco)).concat(fora).slice(0, k - 1);
    const recentes = mem.produtos || [];                // o produto pedido não repete nas últimas 4 rodadas
    const novos = U.embaralhar(PRODUTOS.map(p => p.id).filter(id => recentes.indexOf(id) < 0));
    const ids = [novos[0]].concat(U.embaralhar(PRODUTOS.map(p => p.id).filter(id => id !== novos[0]))).slice(0, k);
    const produtos = U.embaralhar([{ id: ids[0], preco }].concat(outros.map((p, i) => ({ id: ids[i + 1], preco: p }))));
    const fregues = U.escolher(Object.keys(FREGUESES).filter(f => f !== mem.fregues));
    mem.preco = preco; mem.produtos = recentes.concat([ids[0]]).slice(-4); mem.fregues = fregues;
    return { preco, produtos, alvo: produtos.findIndex(p => p.id === ids[0]), fregues };
  }

  /**
   * Moedas que pagam `valor` do jeito ensinado: com a de 5 (ou a nota), a solução curta (7 = 5 + 2);
   * só com 1 e 2, no máximo uma moeda de 2 (estação 17); só com 1, uma a uma.
   */
  function plano(valor, moedas) {
    const r = [];
    if (valor <= 0) return r;
    if (moedas.indexOf(5) >= 0 || moedas.indexOf(10) >= 0) {
      let resta = valor;
      for (const v of moedas.slice().sort((a, b) => b - a)) while (resta >= v) { r.push(v); resta -= v; }
      return r;
    }
    let resta = valor;
    if (moedas.indexOf(2) >= 0 && resta >= 2) { r.push(2); resta -= 2; }
    while (resta > 0) { r.push(1); resta--; }
    return r;
  }

  /** Centros das moedas no balcão (na ordem em que entraram): uma fileira; se não couber, duas (e aperta se precisar). */
  function posicoesBalcao(lista) {
    const W = MOEDAS_X1 - MOEDAS_X0, VAO = 12;
    const largura = arr => arr.reduce((s, m) => s + m.l, 0) + VAO * Math.max(0, arr.length - 1);
    let linhas;
    if (largura(lista) <= W) linhas = [lista];
    else {
      let i = 0, w = 0;
      while (i < lista.length && w + lista[i].l + (i ? VAO : 0) <= W) { w += lista[i].l + (i ? VAO : 0); i++; }
      linhas = [lista.slice(0, Math.max(1, i)), lista.slice(Math.max(1, i))];
    }
    const ys = linhas.length === 1 ? [LINHA_UNICA] : LINHAS;
    const pos = [];
    linhas.forEach((linha, li) => {
      const total = largura(linha);
      const passo = total > W && linha.length > 1 ? VAO - (total - W) / (linha.length - 1) : VAO;
      let x = MOEDAS_X0 + 8;
      linha.forEach(m => { pos.push({ x: x + m.l / 2, y: ys[li] }); x += m.l + passo; });
    });
    return pos;
  }

  /** Plaquinha de preço: algarismo e pontinhos (de 5 em 5, como as plaquinhas do jogo). */
  function placaPreco(n) {
    const pontos = U.el('div', { class: 'pontos', style: { gridTemplateColumns: `repeat(${Math.min(5, n)}, 15px)` } });
    for (let i = 0; i < n; i++) pontos.appendChild(U.el('i', { class: i >= 5 ? 'b' : '' }));
    return U.el('div', { class: 'pc-feirinha-placa', 'aria-hidden': 'true' }, U.el('b', { text: String(n) }), pontos);
  }

  /** Leva o elemento de `de` até `para` (centros) num arco; anima só transform. Devolve Promise (nunca rejeita). */
  function voar(m, de, para, { ms = 380, arco = 70 } = {}) {
    m.el.getAnimations().forEach(a => a.cancel());
    posicionar(m, para.x, para.y);
    m.el.style.transform = '';
    const dx = de.x - para.x, dy = de.y - para.y;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return Promise.resolve();
    const quadros = [];
    for (let i = 0; i <= 8; i++) {
      const s = i / 8;
      quadros.push({ transform: `translate(${(dx * (1 - s)).toFixed(1)}px, ${(dy * (1 - s) - arco * 4 * s * (1 - s)).toFixed(1)}px)` });
    }
    return U.animar(m.el, quadros, { duration: ms, easing: 'ease-in-out' });
  }
  const pulsar = (el, s) => U.animar(el, [{ transform: 'scale(1)' }, { transform: `scale(${s || 1.12})`, offset: 0.4 }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });

  // ---------------------------------------------------------------- a rodada
  function rodada(ctx) {
    U.estilo('feirinha', CSS);
    const params = ctx.params || {};
    const cfg = lerParams(params);
    let mem = memorias.get(params);
    if (!mem) { mem = {}; memorias.set(params, mem); }
    const sorteio = sortear(cfg, mem);
    const P = sorteio.preco;
    const troco = cfg.modo === 'troco';
    const freg = FREGUESES[sorteio.fregues];
    const nomeFreg = freg.artigo + ' ' + freg.nome;

    let destruido = false, resolvida = false, voando = false, pagando = false, ajudando = false, interagiu = false;
    let arr = null, contagem = null, ajudaAC = null, versao = 0, avisouBotao = false, pagarDepois = false;
    const desligares = [];
    const balcao = [];      // moedas no balcão (comprar) ou no quadro (troco), na ordem em que entraram

    const camada = U.el('div', { class: 'pc-feirinha' });
    ctx.palco.appendChild(camada);
    camada.insertAdjacentHTML('beforeend', desenhoBarraca());

    const podeAgir = () => !destruido && !resolvida && !pagando && !voando && !ctx.sinal.aborted;
    const atualizarOcupado = () => { if (!destruido && !ctx.sinal.aborted) ctx.ocupado(!!(contagem || pagando || ajudando || resolvida)); };

    // ------------------------------------------------------------ produtos nos caixotes, com a plaquinha de preço
    const k = sorteio.produtos.length;
    const largura = k === 4 ? 160 : 196, passo = 672 / k;
    const itens = sorteio.produtos.map((p, i) => {
      const info = PRODUTOS.find(q => q.id === p.id);
      const cx = Math.round(590 + passo * (i + 0.5));
      const el = U.el('div', {
        class: 'pc-feirinha-produto' + (i === sorteio.alvo ? ' pc-feirinha-escolhido' : ''), teste: 'produto-' + i, role: 'button',
        'aria-label': info.nome, style: { left: (cx - largura / 2) + 'px', top: PRODUTO_TOPO + 'px', width: largura + 'px', height: '212px' },
      },
      U.el('div', { class: 'pc-feirinha-luz' }),
      U.el('div', { class: 'pc-feirinha-fruta', html: desenhoProduto(p.id) }),
      U.el('div', { class: 'pc-feirinha-caixote', html: CAIXOTE, style: { width: (largura - 4) + 'px', marginLeft: -(largura - 4) / 2 + 'px' } }),
      placaPreco(p.preco));
      camada.appendChild(el);
      PC.aoTocar(el, () => tocarProduto(i), { som: false });
      return Object.assign({}, info, { preco: p.preco, el, cx });
    });
    const item = itens[sorteio.alvo];
    const nomeProduto = item.artigo + ' ' + item.nome;

    // ------------------------------------------------------------ freguês e o balãozinho do que ele quer
    const fregEl = U.el('div', { class: 'pc-feirinha-fregues', style: { left: FREGUES.x + 'px', top: FREGUES.y + 'px', width: FREGUES.l + 'px', height: FREGUES.a + 'px' } },
      U.el('div', { class: 'corpo', html: desenhoFregues(sorteio.fregues) }));
    camada.appendChild(fregEl);
    const fregToque = U.el('div', { class: 'pc-feirinha-fregues-toque', teste: 'fregues', role: 'button', 'aria-label': freg.nome,
      style: { left: (FREGUES.x + 104) + 'px', top: (FREGUES.y + 44) + 'px', width: '186px', height: '296px' } });
    camada.appendChild(fregToque);
    PC.aoTocar(fregToque, () => tocarFregues(), { som: false });
    const mao = { x: FREGUES.x + freg.mao.x, y: FREGUES.y + freg.mao.y };
    const pensa = U.el('div', { class: 'pc-feirinha-pensa', style: { left: PENSA.x + 'px', top: PENSA.y + 'px' } },
      U.el('div', { class: 'fruta', html: desenhoProduto(item.id) }),
      U.el('i', { style: 'width:28px;height:28px;left:98px;top:124px' }),
      U.el('i', { style: 'width:17px;height:17px;left:110px;top:156px' }));
    camada.appendChild(pensa);

    // ------------------------------------------------------------ balcão (troco: moeda que o freguês deu + quadro de 5)
    const balcaoEl = U.el('div', { class: 'pc-feirinha-balcao', teste: 'balcao', role: 'button', 'aria-label': 'Balcão',
      style: { left: BALCAO.x + 'px', top: BALCAO.y + 'px', width: BALCAO.l + 'px', height: BALCAO.a + 'px' } });
    camada.appendChild(balcaoEl);
    const casas = [];
    let pago = null, quadroEl = null, quadroX = 0;
    if (troco) {
      const n = cfg.pagaCom, linhas = n / 5;
      const lq = 5 * CASA + 4 * CASA_VAO + 2 * QUADRO_PAD + 10, aq = linhas * CASA + (linhas - 1) * CASA_VAO + 2 * QUADRO_PAD + 10;
      const qx = BALCAO.x + BALCAO.l - 8 - lq, qy = Math.round(LINHA_UNICA - aq / 2);
      quadroX = qx;
      quadroEl = U.el('div', { class: 'pc-feirinha-quadro', 'aria-hidden': 'true', style: { left: qx + 'px', top: qy + 'px', width: lq + 'px', height: aq + 'px' } });
      for (let i = 0; i < n; i++) {
        const l = QUADRO_PAD + (i % 5) * (CASA + CASA_VAO), t = QUADRO_PAD + Math.floor(i / 5) * (CASA + CASA_VAO);
        const el = U.el('div', { class: 'pc-feirinha-casa' + (i < P ? ' preco' : ''), style: { left: l + 'px', top: t + 'px' } }, i < P ? U.el('i') : null);
        quadroEl.appendChild(el);
        casas.push({ el, x: qx + 5 + l + CASA / 2, y: qy + 5 + t + CASA / 2 });
      }
      camada.appendChild(quadroEl);
      pago = criarMoeda(n, Math.round((BALCAO.x + qx) / 2), LINHA_UNICA);
      camada.appendChild(pago.el);
    }

    // ------------------------------------------------------------ cofrinho: uma vaga por moeda (fonte sem fim)
    const larguraVaga = v => (MOEDAS[v].nota ? 214 : VAGA);
    const lCofrinho = cfg.moedas.reduce((s, v) => s + larguraVaga(v), 0) + VAGA_VAO * (cfg.moedas.length - 1) + 2 * COFRINHO_PAD;
    const lFileira = lCofrinho + (cfg.confirmar ? BOTAO_VAO + BOTAO.l : 0);
    const esq = Math.round(U.limitar(FILEIRA.centro - lFileira / 2, FILEIRA.x0, Math.max(FILEIRA.x0, FILEIRA.x1 - lFileira)));
    const xsVagas = [];
    cfg.moedas.reduce((x, v) => { xsVagas.push(x + larguraVaga(v) / 2); return x + larguraVaga(v) + VAGA_VAO; }, esq + COFRINHO_PAD);
    camada.appendChild(U.el('div', { class: 'pc-feirinha-cofrinho', style: { left: esq + 'px', top: '708px', width: lCofrinho + 'px', height: '180px' } }));
    const vagas = cfg.moedas.map((v, i) => {
      const cx = xsVagas[i], cy = COFRINHO_Y, t = tamanho(v), lv = larguraVaga(v);
      camada.appendChild(U.el('div', { class: 'pc-feirinha-poco', style: { left: (cx - t.l / 2 - 10) + 'px', top: (cy - t.a / 2 - 6) + 'px',
        width: (t.l + 20) + 'px', height: (t.a + 28) + 'px', borderRadius: MOEDAS[v].nota ? '24px' : '50%' } }));
      const baixo = criarMoeda(v, cx, cy + 12);
      const cima = criarMoeda(v, cx, cy);
      camada.append(baixo.el, cima.el);
      const el = U.el('div', { class: 'pc-feirinha-vaga', teste: 'moeda-' + v, role: 'button', 'aria-label': 'Moedinha de ' + ext(v),
        style: { left: (cx - lv / 2) + 'px', top: (cy - VAGA / 2) + 'px', width: lv + 'px', height: VAGA + 'px' } });
      camada.appendChild(el);
      const vaga = { v, cx, cy, el, cima };
      desligares.push(PC.arrastar(el, {
        podeComecar: () => podeAgir(),
        aoTocar: () => tocarVaga(vaga),
        aoComecar: p => comecarArraste({ origem: 'vaga', vaga }, p),
        aoMover: p => moverArraste(p),
        aoSoltar: p => soltarArraste(p),
        aoCancelar: () => cancelarArraste(),
      }));
      return vaga;
    });
    const vagaDe = v => vagas.find(g => g.v === v) || vagas[0];

    desligares.push(PC.arrastar(balcaoEl, {
      podeComecar: () => podeAgir() && (balcao.length > 0 || troco),   // troco: tocar na moeda do freguês
      aoTocar: q => tocarBalcao(q),
      aoComecar: q => { const m = maisPerto(q.inicio, 150); if (m) comecarArraste({ origem: 'balcao', m }, q); },
      aoMover: q => moverArraste(q),
      aoSoltar: q => soltarArraste(q),
      aoCancelar: () => cancelarArraste(),
    }));

    // ------------------------------------------------------------ botão Pagar / Pronto
    let botao = null;
    if (cfg.confirmar) {
      botao = PC.ui.botaoGrande(troco ? 'Pronto' : 'Pagar', () => apertarPagar(), { icone: 'pronto', cor: PC.cores.verde });
      botao.dataset.teste = 'pagar';
      const bx = esq + lCofrinho + BOTAO_VAO;
      camada.appendChild(U.el('div', { class: 'pc-feirinha-botao',
        style: { left: bx + 'px', top: (BOTAO.y - BOTAO.a / 2) + 'px', width: BOTAO.l + 'px', height: BOTAO.a + 'px' } }, botao));
    }

    // qualquer toque da criança encerra a ajuda em andamento
    const offToque = PC.on('toque', () => { interagiu = true; cancelarAjuda(); });
    // "Quer parar?": a ajuda e a contagem param na hora (não falam por cima da pergunta); a do acerto só segura
    const offPausa = PC.on('atividade:pausa', () => {
      if (destruido) return;
      cancelarAjuda();
      pararContagem();
    });

    // ------------------------------------------------------------ moedas: tocar, arrastar, pôr e tirar
    const totalBalcao = () => (troco ? P + balcao.length : balcao.reduce((s, m) => s + m.v, 0));
    const cheio = () => (troco ? balcao.length >= cfg.pagaCom - P : balcao.length >= MAX_BALCAO);
    const centroVisual = m => { const r = PC.palco.retangulo(m.el); return { x: r.cx, y: r.cy }; };
    const naZona = q => !!q && q.x >= BALCAO.x - IMA.lados && q.x <= BALCAO.x + BALCAO.l + IMA.lados &&
      q.y >= BALCAO.y - IMA.cima && q.y <= BALCAO.y + BALCAO.a + IMA.baixo;
    const lugares = () => (troco ? balcao.map((m, i) => casas[P + i]) : posicoesBalcao(balcao));

    /** Leva cada moeda do balcão ao seu lugar (menos `exceto`). Devolve os lugares. */
    function arrumar(exceto) {
      const pos = lugares();
      balcao.forEach((m, i) => {
        const p = pos[i];
        if (m === exceto || (Math.abs(m.x - p.x) < 0.5 && Math.abs(m.y - p.y) < 0.5)) return;
        voar(m, centroVisual(m), p, { ms: 260, arco: 0 });
      });
      return pos;
    }
    function maisPerto(q, limite) {
      let melhor = null, d = Infinity;
      balcao.forEach(m => { const e = Math.hypot(m.x - q.x, m.y - q.y); if (e < d) { d = e; melhor = m; } });
      return melhor && (limite == null || d <= limite) ? melhor : null;
    }
    function naoCabe(vaga) {
      const el = troco ? quadroEl : vaga.cima.el;
      PC.som.soltar();
      el.classList.remove('pc-feirinha-nao'); void el.offsetWidth; el.classList.add('pc-feirinha-nao');
    }

    function tocarVaga(vaga) {
      if (!podeAgir()) return;
      interagiu = true;
      if (cheio()) { naoCabe(vaga); return; }
      const m = criarMoeda(vaga.v, vaga.cx, vaga.cy);
      m.el.classList.add('solta');
      camada.appendChild(m.el);
      PC.som.pegar();
      colocar(m, { x: vaga.cx, y: vaga.cy });
    }
    function tocarBalcao(q) {
      if (!podeAgir()) return;
      interagiu = true;
      if (troco && q.x < quadroX - 4) { tocarPago(); return; }   // a moeda do freguês não sai do balcão
      const m = maisPerto(q);
      if (m) tirar(m, centroVisual(m));
    }

    function comecarArraste(info, p) {
      if (!podeAgir() || arr) return;
      interagiu = true;
      let m = info.m;
      if (info.origem === 'vaga') {
        if (cheio()) { naoCabe(info.vaga); return; }
        m = criarMoeda(info.vaga.v, info.vaga.cx, info.vaga.cy);
        camada.appendChild(m.el);
      } else {
        const c = centroVisual(m);
        m.el.getAnimations().forEach(a => a.cancel());
        posicionar(m, c.x, c.y);
      }
      m.el.classList.add('solta');
      m.el.style.willChange = 'transform';
      arr = { origem: info.origem, m, base: { x: m.x, y: m.y }, atual: { x: m.x, y: m.y } };
      PC.som.pegar();
      moverArraste(p);
    }
    function moverArraste(p) {
      if (!arr || !p) return;
      arr.atual = { x: p.x, y: p.y - 6 };
      arr.m.el.style.transform = `translate(${arr.atual.x - arr.base.x}px, ${arr.atual.y - arr.base.y}px)`;
      balcaoEl.classList.toggle('ima', arr.origem === 'vaga' && naZona(arr.atual));
    }
    /** Termina o arraste: a moeda fica parada onde o dedo soltou (sem transform). */
    function encerrarArraste(p) {
      const a = arr;
      arr = null;
      if (p) a.atual = { x: p.x, y: p.y - 6 };
      balcaoEl.classList.remove('ima');
      a.m.el.style.willChange = '';
      a.m.el.style.transform = '';
      posicionar(a.m, a.atual.x, a.atual.y);
      return a;
    }
    function soltarArraste(p) {
      if (!arr) return;
      const a = encerrarArraste(p);
      if (destruido) return;
      if (a.origem === 'vaga') {
        if (naZona(a.atual) && podeAgir() && !cheio()) colocar(a.m, a.atual);
        else voltarAoCofrinho(a.m, a.atual);        // soltou longe do balcão: volta, sem contar como erro
        return;
      }
      if (!U.dentro(a.atual, BALCAO, 10) && podeAgir()) { tirar(a.m, a.atual); return; }
      voltarAoLugar(a.m);
    }
    function cancelarArraste() {
      if (!arr) return;
      const a = encerrarArraste(null);
      if (destruido) return;
      if (a.origem === 'vaga') voltarAoCofrinho(a.m, a.atual);
      else voltarAoLugar(a.m);
    }
    function voltarAoLugar(m) {
      const i = balcao.indexOf(m);
      m.el.classList.remove('solta');
      if (i >= 0) voar(m, { x: m.x, y: m.y }, lugares()[i], { ms: 240, arco: 0 });
    }
    function voltarAoCofrinho(m, de) {
      const vaga = vagaDe(m.v);
      m.el.classList.add('solta');
      PC.som.soltar();
      voar(m, de, { x: vaga.cx, y: vaga.cy }, { ms: 300, arco: 40 }).then(() => m.el.remove());
    }

    /** Uma moeda chega ao balcão (ou à próxima casa vazia do quadro). de = onde ela está agora. */
    async function colocar(m, de) {
      voando = true; versao++;
      cancelarContagem();
      const antes = totalBalcao();
      balcao.push(m);
      m.el.classList.add('solta');
      const alvo = arrumar(m)[balcao.length - 1];
      const longe = Math.hypot(alvo.x - de.x, alvo.y - de.y);
      await voar(m, de, alvo, { ms: U.limitar(220 + longe * 0.4, 260, 440), arco: Math.min(90, 20 + longe * 0.15) });
      voando = false;
      if (destruido || resolvida || ctx.sinal.aborted || balcao.indexOf(m) < 0) { pagarDepois = false; return; }
      m.el.classList.remove('solta');
      PC.som.moeda();
      const depois = antes + m.v;
      if (troco || depois <= P) ctx.avancou();                   // moeda certa: zera os erros seguidos
      if (pagarDepois) { pagarDepois = false; apertarPagar(); return; }   // tocou em Pagar com a moeda no ar
      const minha = versao;
      const completo = troco ? balcao.length === cfg.pagaCom - P : depois === P;
      if (completo && !cfg.confirmar) {
        resolvida = true; atualizarOcupado();
        contarMoeda(antes, m).then(() => (troco ? sucessoTroco(false) : sucesso()), () => {});
        return;
      }
      contarMoeda(antes, m).then(() => {
        if (minha !== versao || resolvida || destruido || ctx.sinal.aborted) return;
        if (!cfg.confirmar && !troco && depois > P) errouTotal(depois);
      }, () => {});
    }

    /** Tira a moeda do balcão e devolve ao cofrinho; a Pipoca diz quanto ficou. */
    function tirar(m, de) {
      const i = balcao.indexOf(m);
      if (i < 0) return;
      balcao.splice(i, 1); versao++;
      voltarAoCofrinho(m, de || centroVisual(m));
      arrumar();
      const total = totalBalcao();
      const c = novaContagem();
      falarVoz(total ? 'Agora tem ' + ext(total) + '.' : 'O balcão ficou vazio.', c.sinal).catch(() => {}).then(c.fim);
    }

    // ------------------------------------------------------------ contagem em voz ("três... quatro, cinco!")
    /** Começa uma contagem nova (a anterior para). fim() libera o relógio de inatividade e apaga os pontinhos. */
    function novaContagem() {
      cancelarContagem();
      const ac = new AbortController();
      const aoSair = () => ac.abort();
      ctx.sinal.addEventListener('abort', aoSair, { once: true });
      contagem = ac;
      atualizarOcupado();
      return {
        sinal: ac.signal,
        fim: () => {
          ctx.sinal.removeEventListener('abort', aoSair);
          if (contagem !== ac) return;
          contagem = null;
          apagarPontos();
          atualizarOcupado();
        },
      };
    }
    /**
     * Cancela a contagem em andamento já apagando os pontinhos dela (o fim() dela, que chega depois, não faz nada:
     * assim ele nunca apaga o que outra contagem ou o acerto acenderam nesse meio-tempo).
     */
    function cancelarContagem() {
      if (!contagem) return;
      const c = contagem;
      contagem = null;
      c.abort();
      apagarPontos();
      atualizarOcupado();
    }
    /** Para a contagem em andamento, menos a do acerto (a rodada já está terminando). */
    function pararContagem() { if (!resolvida) cancelarContagem(); }
    /** Fala direto na voz (sem balão), mas espera o "Quer parar?" fechar para não falar por cima da pergunta. */
    async function falarVoz(texto, sinal) {
      await ctx.esperar(0);
      if (sinal && sinal.aborted) throw U.abortado();
      await PC.voz.falar(texto);
      if (sinal && sinal.aborted) throw U.abortado();
    }
    /**
     * Conta em voz alta de `de` até `ate`, um número por vez (como PC.voz.contar), segurando enquanto o "Quer parar?"
     * estiver aberto. aCada(i) acende o pontinho da vez; a nota do som sobe com o número.
     */
    async function contarAlto(ate, { de = 1, intervalo = 480, sinal = null, aCada = null } = {}) {
      for (let v = de, i = 0; v <= ate; v++, i++) {
        await ctx.esperar(0);
        if (sinal && sinal.aborted) throw U.abortado();
        if (aCada) { try { aCada(i, v); } catch (e) { console.error(e); } }
        PC.som.contar(v);
        const fala = PC.voz.falar(ext(v));
        const [, r] = await Promise.all([U.esperar(intervalo, sinal), Promise.race([fala, U.esperar(PC.voz.TETO_NUMERO)])]);
        // o "Quer parar?" cortou este número (só acontece na contagem do acerto): fala de novo, sem pular nenhum
        if (r === 'interrompida' && ctx.pausada && ctx.pausada()) {
          await ctx.esperar(0);
          if (sinal && sinal.aborted) throw U.abortado();
          await Promise.race([PC.voz.falar(ext(v)), U.esperar(PC.voz.TETO_NUMERO)]);
        }
      }
    }
    function acender(m, i) {
      const pts = m.el.querySelectorAll('.pc-feirinha-ponto');
      if (pts[i]) pts[i].classList.add('aceso');
      pulsar(m.el, 1.08);
    }
    const acenderTudo = m => m.el.querySelectorAll('.pc-feirinha-ponto').forEach(p => p.classList.add('aceso'));
    function acenderPreco(sim) { casas.slice(0, P).forEach(c => { const i = c.el.querySelector('i'); if (i) i.classList.toggle('aceso', sim !== false); }); }
    function apagarPontos() {
      camada.querySelectorAll('.pc-feirinha-ponto.aceso, .pc-feirinha-casa i.aceso').forEach(p => p.classList.remove('aceso'));
      casas.forEach(c => c.el.classList.remove('acesa'));
    }

    /** Conta a moeda nova a partir do total anterior: "três... quatro, cinco!" (a de 5 sozinha: "Cinco!"). */
    async function contarMoeda(antes, m) {
      const c = novaContagem();
      try {
        if (antes === 0 && m.v >= 5) {
          acenderTudo(m);
          pulsar(m.el);
          await falarVoz(maiuscula(ext(m.v)) + '!', c.sinal);
        } else {
          if (antes > 0) {
            if (troco) acenderPreco();
            balcao.forEach(o => { if (o !== m) pulsar(o.el, 1.06); });
            await falarVoz(maiuscula(ext(antes)) + '...', c.sinal);
          }
          await contarAlto(antes + m.v, { de: antes + 1, sinal: c.sinal, aCada: i => acender(m, i) });
        }
        await U.esperar(120, c.sinal);
      } finally {
        c.fim();
      }
    }

    function errouTotal(total) {
      const porUm = Math.abs(total - P) === 1;
      ctx.errou({ fala: (porUm ? 'Quase! ' : '') + `Deu ${ext(total)}. ${maiuscula(nomeProduto)} custa ${ext(P)}.`, mostrar: P });
    }

    // ------------------------------------------------------------ Pagar / Pronto
    async function apertarPagar() {
      if (destruido || resolvida || pagando || ctx.sinal.aborted || arr) return;
      if (voando) { pagarDepois = true; return; }                // a moeda chega e o Pagar vale em seguida
      interagiu = true;
      cancelarAjuda();
      if (!troco && !balcao.length) {                            // nada no balcão: lembra o que fazer (não é erro)
        vagas.forEach(g => pulsar(g.cima.el));
        ctx.falar('Ponha as moedinhas no balcão.').catch(() => {});
        return;
      }
      pagando = true;
      cancelarContagem();
      atualizarOcupado();
      const total = totalBalcao();
      try {
        if (troco) {
          if (balcao.length === cfg.pagaCom - P) { resolvida = true; await sucessoTroco(true); return; }
          const porUm = cfg.pagaCom - total === 1;
          ctx.errou({ fala: (porUm ? 'Quase! ' : '') + `Deu ${ext(total)}. Precisamos de ${ext(cfg.pagaCom)}.`, mostrar: cfg.pagaCom });
          return;
        }
        balcao.forEach((m, i) => U.animar(m.el, [{ transform: 'translateY(0)' }, { transform: 'translateY(-16px)', offset: 0.4 }, { transform: 'translateY(0)' }],
          { duration: 300, delay: i * 70 }));
        if (total === P) {
          resolvida = true;
          await ctx.falar(`Deu ${ext(total)}.`, { mostrar: total });
          await sucesso();
          return;
        }
        errouTotal(total);
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        if (!resolvida && !destruido && !ctx.sinal.aborted) { pagando = false; atualizarOcupado(); }
      }
    }

    /** O produto vai para a mão do freguês e a rodada acaba (a moldura comemora). */
    async function levarProduto() {
      const r = { x: item.cx - 68, y: PRODUTO_TOPO };
      const voo = U.el('div', { class: 'pc-feirinha-voo', html: desenhoProduto(item.id), style: { left: r.x + 'px', top: r.y + 'px', width: '136px', height: '113px' } });
      camada.appendChild(voo);
      PC.som.pegar();
      const dx = mao.x - 68 - r.x, dy = mao.y - 70 - r.y, quadros = [];
      for (let i = 0; i <= 8; i++) {
        const s = i / 8;
        quadros.push({ transform: `translate(${(dx * s).toFixed(1)}px, ${(dy * s - 120 * 4 * s * (1 - s)).toFixed(1)}px) scale(${(1 - 0.25 * s).toFixed(3)})` });
      }
      await U.animar(voo, quadros, { duration: 560, easing: 'ease-in-out', fill: 'forwards' });
      U.animar(fregEl, [{ transform: 'translateY(0)' }, { transform: 'translateY(-28px)', offset: 0.4 }, { transform: 'translateY(0)' }], { duration: 440, easing: 'ease-out' });
      await ctx.esperar(420);
    }
    async function sucesso() {
      try {
        if (destruido || ctx.sinal.aborted) return;
        resolvida = true; atualizarOcupado();
        balcaoEl.classList.add('acende');
        await levarProduto();
        ctx.acertou();
      } catch (e) { if (!U.ehAbortado(e)) console.error(e); }
    }
    /** Troco certo: (recontar) "Custa três... quatro, cinco!", "Dois de troco." e o troco vai para a mão do freguês. */
    async function sucessoTroco(recontar) {
      try {
        if (destruido || ctx.sinal.aborted) return;
        resolvida = true; atualizarOcupado();
        if (recontar) {
          acenderPreco();
          await ctx.falar(`Custa ${ext(P)}...`, { mostrar: P });
          await contarAlto(cfg.pagaCom, { de: P + 1, sinal: ctx.sinal, aCada: i => acender(balcao[i], 0) });
        }
        const t = cfg.pagaCom - P;
        casas.slice(P).forEach(c => c.el.classList.add('acesa'));
        await ctx.falar(`${maiuscula(ext(t))} de troco.`, { mostrar: t });
        balcao.forEach((m, i) => {
          m.el.classList.add('solta');
          const t = setTimeout(() => { if (!destruido) PC.som.moeda(); }, U.duracao(i * 110));
          desligares.push(() => clearTimeout(t));
          voar(m, { x: m.x, y: m.y }, { x: mao.x, y: mao.y + 6 }, { ms: 420 + i * 110, arco: 40 });
        });
        await ctx.esperar(420 + balcao.length * 110);
        await levarProduto();
        ctx.acertou();
      } catch (e) { if (!U.ehAbortado(e)) console.error(e); }
    }

    // ------------------------------------------------------------ instrução e toques que só informam
    function instrucao() {
      if (destruido || resolvida || ctx.sinal.aborted) return Promise.resolve();
      pararContagem();
      pulsar(item.el, 1.06);
      if (troco) {
        return ctx.falar(`${maiuscula(nomeProduto)} custa ${ext(P)}. ${maiuscula(nomeFreg)} pagou com ${ext(cfg.pagaCom)}.`, { mostrar: P })
          .then(() => { if (pago) pulsar(pago.el); return ctx.falar(`Dê o troco! Complete até ${ext(cfg.pagaCom)}.`, { mostrar: cfg.pagaCom }); })
          .catch(() => {});
      }
      return ctx.falar(`${maiuscula(nomeFreg)} quer ${nomeProduto}. ${maiuscula(nomeProduto)} custa ${ext(P)}.`, { mostrar: P })
        .then(() => {
          if (!cfg.confirmar || avisouBotao || ctx.indice > 0) return null;
          avisouBotao = true;
          return ctx.falar('Depois, toque no botão verde.');
        }).catch(() => {});
    }
    function tocarProduto(i) {
      if (destruido || resolvida || ctx.sinal.aborted) return;
      const it = itens[i];
      pararContagem();
      pulsar(it.el, 1.06);
      ctx.falar(`${maiuscula(it.artigo + ' ' + it.nome)} custa ${ext(it.preco)}.`, { mostrar: it.preco }).catch(() => {});
    }
    /** Troco: tocar na moeda com que o freguês pagou só lembra o valor dela. */
    function tocarPago() {
      if (!pago) return;
      pararContagem();
      pulsar(pago.el);
      ctx.falar(`${maiuscula(nomeFreg)} pagou com ${ext(cfg.pagaCom)}.`, { mostrar: cfg.pagaCom }).catch(() => {});
    }
    function tocarFregues() {
      if (destruido || resolvida || ctx.sinal.aborted) return;
      U.animar(fregEl, [{ transform: 'translateY(0)' }, { transform: 'translateY(-20px)', offset: 0.4 }, { transform: 'translateY(0)' }], { duration: 380, easing: 'ease-out' });
      if (sorteio.fregues === 'quati') PC.som.pegar(); else PC.som.piu();     // piu só para as aves
      instrucao();
    }

    // ------------------------------------------------------------ ajuda que ensina (2º erro seguido): contar o balcão
    async function dizerAjuda(texto, mostrar, sinal) {
      if (sinal.aborted) throw U.abortado();
      await ctx.falar(texto, mostrar != null ? { mostrar } : {});
      if (sinal.aborted) throw U.abortado();
    }
    async function ajudaComprar(sinal) {
      if (!balcao.length) {
        vagas.forEach(g => pulsar(g.cima.el));
        await dizerAjuda(`O balcão está vazio. ${maiuscula(nomeProduto)} custa ${ext(P)}.`, P, sinal);
        return;
      }
      await dizerAjuda('Vamos contar as moedinhas do balcão.', null, sinal);
      let soma = 0;
      for (const m of balcao.slice()) {
        if (soma === 0 && m.v >= 5) {
          acenderTudo(m); pulsar(m.el);
          await falarVoz(maiuscula(ext(m.v)) + '...', sinal);
          await U.esperar(250, sinal);
        } else {
          await contarAlto(soma + m.v, { de: soma + 1, intervalo: 450, sinal, aCada: i => acender(m, i) });
        }
        soma += m.v;
      }
      let fala;
      if (soma < P) fala = `Temos ${ext(soma)}. ${P - soma === 1 ? 'Falta' : 'Faltam'} ${ext(P - soma)}.`;
      else if (soma > P) fala = `Temos ${ext(soma)}. ${soma - P === 1 ? 'Sobra' : 'Sobram'} ${ext(soma - P)}.`;
      else fala = `Temos ${ext(soma)}.` + (cfg.confirmar ? ' Toque no botão verde!' : '');
      await dizerAjuda(fala, soma, sinal);
    }
    async function ajudaTroco(sinal) {
      acenderPreco();
      await dizerAjuda(`Custa ${ext(P)}...`, P, sinal);
      if (balcao.length) await contarAlto(P + balcao.length, { de: P + 1, intervalo: 450, sinal, aCada: i => acender(balcao[i], 0) });
      const faltam = cfg.pagaCom - P - balcao.length;
      if (faltam > 0) {
        casas.slice(P + balcao.length).forEach(c => c.el.classList.add('acesa'));
        await dizerAjuda(`${faltam === 1 ? 'Falta' : 'Faltam'} ${ext(faltam)} para ${ext(cfg.pagaCom)}.`, faltam, sinal);
      } else {
        await dizerAjuda(`Chegou no ${ext(cfg.pagaCom)}!` + (cfg.confirmar ? ' Toque no botão verde!' : ''), cfg.pagaCom, sinal);
      }
    }
    async function ajudar(nivel) {
      if (nivel >= 3 || !podeAgir() || ajudando || arr) return;
      const ac = new AbortController();
      const aoSair = () => ac.abort();
      ctx.sinal.addEventListener('abort', aoSair, { once: true });
      cancelarContagem();
      ajudaAC = ac; ajudando = true; atualizarOcupado();
      PC.ui.pipoca.pose('aponta');
      try {
        if (troco) await ajudaTroco(ac.signal); else await ajudaComprar(ac.signal);
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      } finally {
        ctx.sinal.removeEventListener('abort', aoSair);
        if (ajudaAC === ac) encerrarAjuda();            // terminou sozinha (se foi cancelada, já está limpa)
      }
    }
    /** Limpa a ajuda: apaga o que ela acendeu e devolve a Pipoca à pose normal. */
    function encerrarAjuda() {
      ajudaAC = null; ajudando = false;
      if (destruido || ctx.sinal.aborted) return;
      if (!contagem) apagarPontos();
      PC.ui.pipoca.pose('normal');
      atualizarOcupado();
    }
    /**
     * Encerra a ajuda em andamento (toque da criança, Pagar, "Quer parar?", fim da rodada) já limpando tudo na hora:
     * a fala dela ainda pode demorar a voltar, e a limpeza atrasada apagaria o que o acerto acabou de acender.
     */
    function cancelarAjuda() {
      if (!ajudaAC) return;
      const ac = ajudaAC;
      encerrarAjuda();
      ac.abort();
    }

    // ------------------------------------------------------------ gesto certo, testes e limpeza
    function centroBotao() { const r = PC.palco.retangulo(botao); return { x: r.cx, y: r.cy }; }
    /**
     * Próxima moeda do jeito ensinado: segue o plano do preço inteiro (7 = 5 + 2; só com 1 e 2, no máximo uma moeda
     * de 2) descontando as moedas que já estão no balcão; se a criança foi por outro caminho, completa o que falta.
     */
    function proximaMoeda(total) {
      const falta = P - total, resto = plano(P, cfg.moedas);
      balcao.forEach(m => { const i = resto.indexOf(m.v); if (i >= 0) resto.splice(i, 1); });
      if (resto.length && resto.reduce((s, v) => s + v, 0) === falta) return resto[0];
      const soUmEDois = cfg.moedas.indexOf(5) < 0 && cfg.moedas.indexOf(10) < 0;
      if (soUmEDois && balcao.some(m => m.v === 2)) return 1;
      return plano(falta, cfg.moedas)[0];
    }
    /** Moeda para devolver quando passou: a maior que cabe no excesso; se nenhuma cabe, a menor. */
    function moedaParaTirar(excesso) {
      const cabem = balcao.filter(m => m.v <= excesso).map(m => m.v);
      const v = cabem.length ? Math.max.apply(null, cabem) : Math.min.apply(null, balcao.map(m => m.v));
      for (let i = balcao.length - 1; i >= 0; i--) if (balcao[i].v === v) return balcao[i];
      return balcao[balcao.length - 1];
    }
    function proximoGesto() {
      if (!podeAgir() || arr) return null;
      if (troco) {
        const n = balcao.length;
        if (n < cfg.pagaCom - P) { const g = vagaDe(1), c = casas[P + n]; return { tipo: 'arrastar', de: { x: g.cx, y: g.cy }, para: { x: c.x, y: c.y } }; }
        return botao ? { tipo: 'tocar', em: centroBotao() } : null;
      }
      const total = totalBalcao();
      if (total < P && balcao.length < MAX_BALCAO) {
        const v = proximaMoeda(total), g = vagaDe(v), t = tamanho(v);
        const pos = posicoesBalcao(balcao.concat([{ l: t.l, a: t.a }]));
        return { tipo: 'arrastar', de: { x: g.cx, y: g.cy }, para: pos[pos.length - 1] };
      }
      if (total !== P) { const m = moedaParaTirar(total - P); return { tipo: 'tocar', em: { x: m.x, y: m.y } }; }
      return botao ? { tipo: 'tocar', em: centroBotao() } : null;
    }

    /** Testes: põe a resposta certa na hora e termina a rodada (um único ctx.acertou()). */
    function resolver() {
      if (destruido || resolvida) return;
      resolvida = true;
      cancelarAjuda();
      cancelarContagem();
      try {
        PC.arrastar.cancelarTodos();
        balcao.splice(0).forEach(m => m.el.remove());
        const lista = troco ? Array(cfg.pagaCom - P).fill(1) : plano(P, cfg.moedas);
        lista.forEach(v => { const m = criarMoeda(v, 0, 0); camada.appendChild(m.el); balcao.push(m); });
        lugares().forEach((p, i) => posicionar(balcao[i], p.x, p.y));
      } catch (e) { console.error(e); }
      ctx.acertou();
    }

    function estado() {
      return {
        modo: cfg.modo, produto: item.id, preco: P, fregues: sorteio.fregues, confirmar: cfg.confirmar, moedas: cfg.moedas.slice(),
        produtos: itens.map(it => ({ id: it.id, preco: it.preco })), balcao: balcao.map(m => m.v), total: totalBalcao(),
        pagaCom: cfg.pagaCom || null, troco: troco ? balcao.length : null,
        voando, pagando, ajudando, contando: !!contagem, resolvida,
      };
    }

    function destruir() {
      if (destruido) return;
      destruido = true;
      if (contagem) contagem.abort();
      cancelarAjuda();
      offToque(); offPausa();
      desligares.forEach(d => { try { d(); } catch (e) { console.error(e); } });
      camada.remove();
    }

    // ------------------------------------------------------------ início: o freguês chega, a Pipoca explica
    U.animar(fregEl, [{ transform: 'translateX(340px)', opacity: 0 }, { transform: 'translateX(0px)', opacity: 1 }],
      { duration: 560, easing: 'cubic-bezier(.3, 1.2, .5, 1)', fill: 'backwards' });
    U.animar(pensa, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 360, delay: 520, easing: 'cubic-bezier(.3, 1.6, .5, 1)', fill: 'backwards' });
    (async () => {
      try {
        await ctx.esperar(560);
        await instrucao();
        if (ctx.demo && !interagiu && podeAgir() && !balcao.length && !PC.arrastar.ativo()) {
          const g = proximoGesto();
          if (g && g.tipo === 'arrastar') {
            ctx.dica(g.de, g.para);
            await ctx.falar(troco ? 'Ponha moedinhas nas casinhas vazias!' : 'Leve as moedinhas para o balcão!');
          }
        }
      } catch (e) {
        if (!U.ehAbortado(e)) console.error(e);
      }
    })();

    return { instrucao, proximoGesto, ajudar, resolver, estado, destruir };
  }

  PC.atividades.registrar('feirinha', {
    titulo: 'Feirinha da Pipoca',
    icone: 'feirinha',
    cenario: 'prado',
    totalRodadas: params => U.limitar(inteiro(params && params.rodadas, 3), 1, 10),
    rodada,
    // desenhos (para conferência visual nos testes)
    arte: { produto: desenhoProduto, moeda: desenhoMoeda, fregues: desenhoFregues, produtos: () => PRODUTOS.map(p => p.id) },
  });
})();
