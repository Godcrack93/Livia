/* Casa da Pipoca — o que cada coisa faz quando a criança toca nela no modo "brincar" (o motor fica em
   js/telas/casa.js). As ações deste arquivo são as dos APARELHOS ELÉTRICOS; as dos outros itens ficam no arquivo do
   cômodo de cada um, em CASA.partes.<cômodo>.acoes (mesmo formato).

   CASA.acoes[idDoItem] = {
     eletrico: { fio: [x, y] }   // (só aparelhos) de onde sai o fio, nas coordenadas do desenho do item.
                                 // Sem o plugue numa tomada, tocar faz a Pipoca avisar e a tomada mais perto piscar.
     desenho(estado, ligado)     // (opcional) o desenho do item no estado (porta aberta...). ligado = plugue na tomada.
     sobre(estado, ligado)       // (opcional) desenho POR CIMA, que fica enquanto o estado pede (pás girando, tela da TV,
                                 // luz). Pode usar as classes de animação: casa-gira, casa-gira-lento, casa-pisca,
                                 // casa-pisca2, casa-brilha, casa-sobe, casa-nada, casa-treme, casa-balanca, casa-pulsa.
                                 // (girar e tremer usam transform-box: fill-box; o centro é o centro do próprio <g>)
     tocar(ctx)                  // (opcional) o toque. Sem ele, o aparelho elétrico liga e desliga sozinho.
   }
   ctx = { estado (objeto guardado com a casa), ligado, mudou() (guarda e redesenha), mostrar(svg, ms) (desenho por
           cima por um tempo), particulas(tipo, x, y, n, op) (tipos: pipoca, bolha, gota, nota, coracao, estrela, faisca,
           vapor, vento, z, folha; op: { dx, dy, espalha, ms, cai, seguidas }), som(nome) (PC.som: clique, pegar,
           encaixar, soltar, pulo, piu, bolha, moeda, figurinha, acerto, festa, pagina, contar), diz(texto) (a Pipoca
           fala), pular(), tremer(), balancar(), depois(ms, fn), perto(raio) (outros itens perto), noMundo(x, y), olhar() }
   Regras: nada pesado (só o item tocado se mexe), animações curtas ou que param sozinhas, nenhuma fala comprida, e a
   Pipoca nunca fala o nome do item no modo brincar (isso é do modo "falar"). */
(function () {
  'use strict';
  const T = '#3A2A5A';
  const A = CASA.acoes = {};

  // ---------------------------------------------------------------- ventilador: as pás giram e sai ventinho
  const pas = cy => `<g transform="translate(0 ${cy})"><circle r="74" fill="#EAF6FF"/><g class="casa-gira">` +
    [0, 120, 240].map(a => `<path transform="rotate(${a})" d="M0 0 Q -34 -30 -10 -66 Q 10 -70 14 -40 Q 16 -18 0 0 Z" fill="#7FD3E8" stroke="${T}" stroke-width="4" opacity=".9"/>`).join('') +
    `<circle r="74" fill="none"/></g><circle r="78" fill="none" stroke="#4DA3FF" stroke-width="5"/>` +
    `<g stroke="${T}" stroke-width="2" opacity=".55">${Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6; return `<line x1="${(Math.cos(a) * 18).toFixed(1)}" y1="${(Math.sin(a) * 18).toFixed(1)}" x2="${(Math.cos(a) * 74).toFixed(1)}" y2="${(Math.sin(a) * 74).toFixed(1)}"/>`; }).join('')}</g>` +
    `<circle r="16" fill="#FFC93C" stroke="${T}" stroke-width="5"/></g>`;
  A.ventilador = {
    eletrico: { fio: [0, -10] },
    sobre: (e, ligado) => (ligado && e.ligado ? pas(-290) : ''),
    tocar(ctx) {
      ctx.estado.ligado = !ctx.estado.ligado;
      ctx.som(ctx.estado.ligado ? 'clique' : 'soltar');
      ctx.mudou();
      if (ctx.estado.ligado) { ctx.particulas('vento', 80, -290, 4, { dx: 260, dy: 0, espalha: 50, ms: 1100, seguidas: 160 }); }
    },
  };

  // ---------------------------------------------------------------- TV: liga e troca de canal a cada toque
  const TELA = 'x="-62" y="-100" width="96" height="72" rx="16"';
  const CANAIS = [
    '',   // o desenho que já está na TV (morrinho, sol e nuvem)
    // barras coloridas
    `<g><rect ${TELA} fill="#fff"/>` + ['#FF7A6B', '#FFC93C', '#5CC84A', '#2EC4B6', '#4DA3FF', '#9B7BFF'].map((c, k) => `<rect x="${-58 + k * 15}" y="-96" width="15" height="64" fill="${c}"/>`).join('') +
      `<rect x="-58" y="-48" width="90" height="16" fill="#3A2A5A" opacity=".85"/><circle class="casa-pisca" cx="20" cy="-40" r="4" fill="#FF7A6B"/></g>`,
    // fundo do mar com um peixinho nadando
    `<g><rect ${TELA} fill="#4DA3FF"/><path d="M-60 -40 Q -30 -48 0 -40 Q 30 -48 32 -40 V -30 H -60 Z" fill="#F2D68A"/>` +
      `<g class="casa-nada"><path d="M-14 -66 q 14 -12 26 0 q -12 12 -26 0 Z" fill="#FFC93C" stroke="${T}" stroke-width="3"/><path d="M-14 -66 l -10 -8 v 16 Z" fill="#FFC93C" stroke="${T}" stroke-width="3"/><circle cx="6" cy="-68" r="2.5" fill="${T}"/></g>` +
      `<circle class="casa-sobe" cx="18" cy="-50" r="4" fill="none" stroke="#fff" stroke-width="2.5"/></g>`,
    // noite estrelada com lua
    `<g><rect ${TELA} fill="#3A2A5A"/><circle cx="12" cy="-78" r="13" fill="#FFE27A"/><circle cx="18" cy="-82" r="11" fill="#3A2A5A"/>` +
      [[-44, -84], [-26, -60], [-12, -88], [-40, -50], [24, -48]].map(([x, y], k) => `<path class="${k % 2 ? 'casa-pisca' : 'casa-pisca2'}" d="M${x} ${y - 5} l 1.6 3.4 l 3.4 1.6 l -3.4 1.6 l -1.6 3.4 l -1.6 -3.4 l -3.4 -1.6 l 3.4 -1.6 Z" fill="#fff"/>`).join('') + `</g>`,
  ];
  A.tv = {
    eletrico: { fio: [40, -10] },
    sobre(e, ligado) {
      if (!(ligado && e.ligado)) return `<rect ${TELA} fill="#3B4A63" stroke="${T}" stroke-width="5"/><path d="M-50 -90 L -30 -90 L -54 -56 Z" fill="#fff" opacity=".18"/>`;
      return (CANAIS[e.canal || 0] || '') + `<rect ${TELA} fill="none" stroke="${T}" stroke-width="5"/>`;
    },
    tocar(ctx) {
      const e = ctx.estado;
      if (!e.ligado) { e.ligado = true; e.canal = 0; }
      else if ((e.canal || 0) < CANAIS.length - 1) e.canal = (e.canal || 0) + 1;
      else { e.ligado = false; e.canal = 0; }
      ctx.som(e.ligado ? 'clique' : 'soltar');
      if (e.ligado) ctx.particulas('nota', 0, -120, 2, { dy: -90, espalha: 40 });
      ctx.mudou();
    },
  };

  // ---------------------------------------------------------------- luminária de pé e abajur: acendem
  // cúpulas (os mesmos contornos dos desenhos em sala.js e quarto.js): apagada fica mais escura; acesa, clarinha e brilhando
  const CUPULA_PE = 'M-58 -264 Q0 -254 58 -264 L40 -342 Q0 -350 -40 -342 Z';
  const CUPULA_ABAJUR = 'M-48 -74 Q -50 -70 -46 -70 L 46 -70 Q 50 -70 48 -74 L 32 -132 Q 30 -136 26 -136 L -26 -136 Q -30 -136 -32 -132 Z';
  const apagada = d => `<path d="${d}" fill="#3A2A5A" opacity=".18"/>`;
  const acesa = d => `<path d="${d}" fill="#FFF8D6" opacity=".6"/><path d="${d}" fill="none" stroke="#FFE27A" stroke-width="5" opacity=".9"/>`;
  // o facho de luz do desenho (qualquer que seja a forma de escrever a opacidade)
  const FACHO = /<path d="M-48 -268 L-64 -190 Q0 -180 64 -190 L48 -268 Z"[^>]*\/>/;
  A.luminariaPe = {
    eletrico: { fio: [0, -10] },
    // apagada, sem o facho de luz que o desenho tem
    desenho: (e, ligado) => (ligado && e.ligado ? CASA.desenho('luminariaPe') : CASA.desenho('luminariaPe').replace(FACHO, '')),
    sobre: (e, ligado) => (ligado && e.ligado
      ? `<g class="casa-brilha"><ellipse cx="0" cy="-300" rx="190" ry="170" fill="#FFF1A8" opacity=".22"/></g>` +
        `<path d="M-48 -268 L-74 -150 Q0 -134 74 -150 L48 -268 Z" fill="#FFE9A3" opacity=".45"/>` + acesa(CUPULA_PE)
      : apagada(CUPULA_PE)),
    tocar(ctx) { ctx.estado.ligado = !ctx.estado.ligado; ctx.som('clique'); ctx.mudou(); },
  };
  A.abajur = {
    eletrico: { fio: [16, -4] },
    sobre: (e, ligado) => (ligado && e.ligado
      ? `<g class="casa-brilha"><ellipse cx="0" cy="-100" rx="140" ry="120" fill="#FFF1A8" opacity=".22"/></g>` +
        `<path d="M-46 -70 L -70 -10 Q 0 4 70 -10 L 46 -70 Z" fill="#FFE9A3" opacity=".4"/>` + acesa(CUPULA_ABAJUR)
      : apagada(CUPULA_ABAJUR)),
    tocar(ctx) { ctx.estado.ligado = !ctx.estado.ligado; ctx.som('clique'); ctx.mudou(); },
  };

  // ---------------------------------------------------------------- aquário: o filtro solta bolhas e o peixe nada
  A.aquario = {
    eletrico: { fio: [64, -30] },
    sobre: (e, ligado) => (ligado && e.ligado
      ? [[-20, 0], [-6, .7], [8, 1.4], [44, .35], [52, 1.1]].map(([x, d]) => `<circle class="casa-sobe" style="animation-delay:${d}s" cx="${x}" cy="-104" r="${4 + (x % 3)}" fill="none" stroke="#fff" stroke-width="2.5"/>`).join('') +
        `<g class="casa-nada"><path d="M-30 -136 q 14 -12 26 0 q -12 12 -26 0 Z" fill="#FF8FC2" stroke="${T}" stroke-width="3.5"/><path d="M-30 -136 l -10 -8 v 16 Z" fill="#FF8FC2" stroke="${T}" stroke-width="3.5"/></g>` +
        `<rect x="-64" y="-184" width="128" height="84" rx="8" fill="#BFF3FF" opacity=".25" class="casa-brilha"/>`
      : ''),
    tocar(ctx) { ctx.estado.ligado = !ctx.estado.ligado; ctx.som('bolha'); ctx.mudou(); if (ctx.estado.ligado) ctx.particulas('bolha', 0, -200, 4, { dy: -80 }); },
  };

  // ---------------------------------------------------------------- liquidificador: bate o suco (e para sozinho)
  A.liquidificador = {
    eletrico: { fio: [24, -8] },
    tocar(ctx) {
      ctx.som('bolha'); ctx.tremer();
      ctx.mostrar(`<g class="casa-gira"><path d="M-14 -62 Q 0 -78 14 -62 Q 0 -46 -14 -62 Z" fill="#FFE27A" stroke="#F2B21B" stroke-width="3"/><circle cx="0" cy="-62" r="3" fill="#fff"/></g>` +
        `<g class="casa-treme"><path d="M-20 -94 H 20" stroke="#fff" stroke-width="3" opacity=".7"/></g>`, 1800);
      ctx.depois(1500, () => ctx.particulas('estrela', 0, -110, 3, { dy: -70 }));
    },
  };

  // ---------------------------------------------------------------- luzinhas do quarto: piscam
  /** os mesmos pontos das lampadinhas do desenho (quarto.js, luzinhas(w, barrigas)) */
  function lampadas(w, barrigas) {
    const seg = w / barrigas, fundo = 46, pts = [];
    for (let x = 30; x < w - 20; x += 54) { const t = (x % seg) / seg; if (t < .08 || t > .92) continue; pts.push([x, 4 * fundo * t * (1 - t) + 24]); }
    return pts;
  }
  const brilhos = (w, b) => lampadas(w, b).map(([x, y], k) => `<circle class="${k % 2 ? 'casa-pisca' : 'casa-pisca2'}" cx="${x}" cy="${y}" r="20" fill="#FFF6C8" opacity=".75"/>`).join('');
  A.luzinhas = { eletrico: { fio: [0, 0] }, sobre: (e, ligado) => (ligado && e.ligado ? brilhos(500, 3) : '') };
  A.luzinhasCurtas = { eletrico: { fio: [0, 0] }, sobre: (e, ligado) => (ligado && e.ligado ? brilhos(220, 1) : '') };

  // ---------------------------------------------------------------- a luz que cada coisa acesa espalha (no escuro)
  /* CASA.LUZES[id](estado, naTomada) -> [{ x, y, r, ry?, f, cor? }] em coordenadas do desenho do item, ou nada.
     r (e ry, para luz achatada) = até onde a luz chega; f = a força no meio (0 a 1); cor = o tom da luz (quente se faltar).
     O motor (telas/casa.js) clareia o escuro do cômodo nesses lugares e pinta um pouco da cor por cima. */
  const CORES_LUZINHAS = ['#FFD23F', '#FF7A6B', '#2EC4B6', '#FF8FC2', '#9B7BFF', '#5CC84A', '#4DA3FF'];
  const ligou = (e, t) => t && e.ligado;
  CASA.LUZES = {
    abajur: (e, t) => ligou(e, t) && [{ x: 0, y: -104, r: 330, f: .85 }, { x: 0, y: 4, r: 300, ry: 90, f: .55 }],
    luminariaPe: (e, t) => ligou(e, t) && [{ x: 0, y: -300, r: 420, f: .85 }, { x: 0, y: -10, r: 360, ry: 110, f: .6 }],
    tv: (e, t) => ligou(e, t) && [{ x: -14, y: -64, r: 300, f: .5, cor: '#8FC8FF' }],
    aquario: (e, t) => ligou(e, t) && [{ x: 0, y: -142, r: 230, f: .38, cor: '#8FE3FF' }],
    luzinhas: (e, t) => ligou(e, t) && lampadas(500, 3).map(([x, y], k) => ({ x, y: y + 26, r: 120, f: .42, cor: CORES_LUZINHAS[k % 7] })),
    luzinhasCurtas: (e, t) => ligou(e, t) && lampadas(220, 1).map(([x, y], k) => ({ x, y: y + 26, r: 120, f: .42, cor: CORES_LUZINHAS[k % 7] })),
    luminariaTeto: e => e.ligado && [{ x: 0, y: 130, r: 560, f: .85 }, { x: 0, y: 420, r: 420, ry: 120, f: .5 }],
    geladeira: e => e.aberta && [{ x: 0, y: -190, r: 260, f: .5, cor: '#E6F6FF' }],
    fogao: e => e.aceso && [{ x: 0, y: -200, r: 220, f: .38, cor: '#FFB15E' }],
  };

  // ---------------------------------------------------------------- bichos: pulam, fazem o som deles e soltam coraçõezinhos
  // (por enquanto; na etapa 3 cada bicho vira personagem com animações próprias)
  const SOM_DO_BICHO = { ave: 'piu', mamifero: 'pulo', reptil: 'encaixar', anfibio: 'pulo', peixe: 'bolha', inseto: 'pegar' };
  if (window.PC && PC.figurinhas) PC.figurinhas.lista.filter(f => f.tipo !== 'casa').forEach(f => {
    A['bicho-' + f.id] = {
      tocar(ctx) {
        ctx.pular();
        ctx.som(SOM_DO_BICHO[f.tipo] || 'pulo');
        ctx.particulas(f.tipo === 'ave' ? 'nota' : 'coracao', 0, -260, 3, { dy: -100, espalha: 60 });
      },
    };
  });
})();
