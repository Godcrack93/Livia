/* Casa da Pipoca — os itens que a criança põe, tira e arrasta pela casa (os desenhos vêm do catálogo de cada parte).
   CASA.ITENS[id] = { parte, nome, aba, tipo, desenho() }
     aba:  'moveis' | 'brinquedos' | 'enfeites'  (as abas do baú)
     tipo: 'chao'   assenta os pés no chão do andar onde foi solto
           'tapete' igual ao chão, mas fica sempre atrás de tudo
           'apoia'  cai e fica em cima do primeiro móvel embaixo dele (CASA.APOIOS), ou no chão
           'solto'  de parede: fica onde foi solto (quadros, prateleiras, relógio, luzinhas), dentro dos limites do cômodo
   CASA.inicial() -> a casa como ela vem: [{ id, x, y, k?, rot? }]  (x, y = o ponto (0,0) do desenho no mundo)
   CASA.desenho(id) -> texto SVG do item (guardado; cada item é desenhado uma vez só)
   CASA.desenharEm(item) -> o item no lugar dele (texto SVG)
   CASA.ordenar(lista) -> tapetes primeiro, o resto na ordem da lista (o último mexido fica na frente) */
(function () {
  'use strict';
  const C = id => (CASA.partes[id] && CASA.partes[id].catalogo) || {};
  const I = CASA.ITENS = {};
  const item = (id, parte, nome, aba, tipo, desenho) => { I[id] = { id, parte, nome, aba, tipo, desenho }; };
  const de = (parte, fn, ...args) => () => C(parte)[fn](...args);

  // ---------------------------------------------------------------- sala
  item('sofa', 'sala', 'sofá', 'moveis', 'chao', de('sala', 'sofa'));
  item('poltrona', 'sala', 'poltrona', 'moveis', 'chao', de('sala', 'poltrona'));
  item('pufe', 'sala', 'pufe', 'moveis', 'chao', de('sala', 'pufe'));
  item('tapeteSala', 'sala', 'tapete', 'moveis', 'tapete', de('sala', 'tapete'));
  item('luminariaPe', 'sala', 'luminária', 'moveis', 'chao', de('sala', 'luminaria'));
  item('ventilador', 'sala', 'ventilador', 'moveis', 'chao', de('sala', 'ventilador'));
  item('rede', 'sala', 'rede', 'moveis', 'chao', de('sala', 'rede'));
  item('rack', 'sala', 'rack', 'moveis', 'chao', de('sala', 'rack'));
  item('tv', 'sala', 'televisão', 'moveis', 'solto', de('sala', 'tv'));
  item('estante', 'sala', 'estante', 'moveis', 'chao', de('sala', 'estante'));
  item('aquario', 'sala', 'aquário', 'enfeites', 'chao', de('sala', 'aquario'));
  item('plantaSala', 'sala', 'planta', 'enfeites', 'chao', de('sala', 'planta'));
  item('relogio', 'sala', 'relógio', 'enfeites', 'solto', de('sala', 'relogio'));
  item('quadroPaisagem', 'sala', 'quadro', 'enfeites', 'solto', de('sala', 'quadroPaisagem'));
  item('quadroFlor', 'sala', 'quadro', 'enfeites', 'solto', de('sala', 'quadroFlor'));
  item('prateleiraSala', 'sala', 'prateleira', 'enfeites', 'solto', de('sala', 'prateleira'));
  // ---------------------------------------------------------------- quarto
  item('cama', 'quarto', 'cama', 'moveis', 'chao', de('quarto', 'cama'));
  item('criadoMudo', 'quarto', 'criado-mudo', 'moveis', 'chao', de('quarto', 'criadoMudo'));
  item('guardaRoupa', 'quarto', 'guarda-roupa', 'moveis', 'chao', de('quarto', 'guardaRoupa'));
  item('comoda', 'quarto', 'cômoda', 'moveis', 'chao', de('quarto', 'comoda'));
  item('tapeteQuarto', 'quarto', 'tapete', 'moveis', 'tapete', de('quarto', 'tapete'));
  item('abajur', 'quarto', 'abajur', 'enfeites', 'solto', de('quarto', 'abajur'));
  item('despertador', 'quarto', 'despertador', 'enfeites', 'solto', de('quarto', 'despertador'));
  item('bau', 'quarto', 'baú de brinquedos', 'brinquedos', 'chao', de('quarto', 'bau', ''));
  item('ursinho', 'quarto', 'ursinho', 'brinquedos', 'solto', de('quarto', 'ursinho'));
  item('bola', 'quarto', 'bola', 'brinquedos', 'solto', de('quarto', 'bola'));
  item('carrinho', 'quarto', 'carrinho', 'brinquedos', 'solto', de('quarto', 'carrinho'));
  item('piao', 'quarto', 'pião', 'brinquedos', 'solto', de('quarto', 'piao'));
  item('pipa', 'quarto', 'pipa', 'brinquedos', 'solto', de('quarto', 'pipa'));
  item('pantufas', 'quarto', 'pantufas', 'brinquedos', 'chao', de('quarto', 'pantufas'));
  item('prateleiraQuarto', 'quarto', 'prateleira', 'enfeites', 'solto', de('quarto', 'prateleira'));
  item('livros', 'quarto', 'livros', 'enfeites', 'solto', de('quarto', 'livros'));
  item('portaRetrato', 'quarto', 'porta-retrato', 'enfeites', 'solto', de('quarto', 'portaRetrato'));
  item('vasinho', 'quarto', 'vasinho', 'enfeites', 'solto', de('quarto', 'vasinho'));
  item('mobile', 'quarto', 'móbile', 'enfeites', 'solto', de('quarto', 'mobile'));
  item('bandeirinhas', 'quarto', 'bandeirinhas', 'enfeites', 'solto', de('quarto', 'bandeirinhas', 470));
  item('luzinhas', 'quarto', 'luzinhas', 'enfeites', 'solto', de('quarto', 'luzinhas', 500));
  item('luzinhasCurtas', 'quarto', 'luzinhas', 'enfeites', 'solto', de('quarto', 'luzinhas', 220, 1));
  item('quadroCasinha', 'quarto', 'quadro', 'enfeites', 'solto', de('quarto', 'quadro', 0));
  item('quadroFoguete', 'quarto', 'quadro', 'enfeites', 'solto', de('quarto', 'quadro', 1));
  item('quadroArcoIris', 'quarto', 'quadro', 'enfeites', 'solto', de('quarto', 'quadro', 2));
  // ---------------------------------------------------------------- banheiro
  item('banheira', 'banheiro', 'banheira', 'moveis', 'chao', de('banheiro', 'banheira'));
  item('cortina', 'banheiro', 'cortina', 'enfeites', 'solto', de('banheiro', 'cortina'));
  item('piaBanheiro', 'banheiro', 'pia', 'moveis', 'chao', de('banheiro', 'pia'));
  item('vaso', 'banheiro', 'vaso sanitário', 'moveis', 'chao', de('banheiro', 'vaso'));
  item('espelho', 'banheiro', 'espelho', 'enfeites', 'solto', de('banheiro', 'espelho'));
  item('toalhas', 'banheiro', 'toalhas', 'enfeites', 'solto', de('banheiro', 'toalhas'));
  item('papel', 'banheiro', 'papel higiênico', 'enfeites', 'solto', de('banheiro', 'papel'));
  item('pato', 'banheiro', 'patinho', 'brinquedos', 'solto', de('banheiro', 'pato'));
  item('copoEscovas', 'banheiro', 'escova de dente', 'enfeites', 'solto', de('banheiro', 'copoEscovas'));
  item('sabonete', 'banheiro', 'sabonete', 'enfeites', 'solto', de('banheiro', 'sabonete'));
  item('tapeteBanheiro', 'banheiro', 'tapetinho', 'moveis', 'tapete', de('banheiro', 'tapete'));
  item('plantaBanheiro', 'banheiro', 'plantinha', 'enfeites', 'chao', de('banheiro', 'planta'));
  item('prateleiraBanheiro', 'banheiro', 'prateleira', 'enfeites', 'solto', de('banheiro', 'prateleira'));
  item('luminariaTeto', 'banheiro', 'luminária', 'enfeites', 'solto', de('banheiro', 'luminaria'));
  // ---------------------------------------------------------------- cozinha
  item('geladeira', 'cozinha', 'geladeira', 'moveis', 'chao', de('cozinha', 'geladeira'));
  item('piaCozinha', 'cozinha', 'pia', 'moveis', 'chao', de('cozinha', 'pia'));
  item('fogao', 'cozinha', 'fogão', 'moveis', 'chao', de('cozinha', 'fogao'));
  item('mesa', 'cozinha', 'mesa', 'moveis', 'chao', de('cozinha', 'mesa'));
  item('cadeiraAmarela', 'cozinha', 'cadeira', 'moveis', 'chao', de('cozinha', 'cadeira', '#FFC93C'));
  item('cadeiraRosa', 'cozinha', 'cadeira', 'moveis', 'chao', de('cozinha', 'cadeira', '#FF8FC2'));
  item('filtro', 'cozinha', 'filtro de barro', 'moveis', 'chao', de('cozinha', 'filtroDeBarro'));
  item('panela', 'cozinha', 'panela', 'enfeites', 'solto', de('cozinha', 'panela'));
  item('pipoqueira', 'cozinha', 'pipoqueira', 'brinquedos', 'solto', de('cozinha', 'pipoqueira'));
  item('baldePipoca', 'cozinha', 'pipoca', 'brinquedos', 'solto', de('cozinha', 'baldeDePipoca'));
  item('liquidificador', 'cozinha', 'liquidificador', 'enfeites', 'solto', de('cozinha', 'liquidificador'));
  item('escorredor', 'cozinha', 'escorredor', 'enfeites', 'solto', de('cozinha', 'escorredor'));
  item('panoDePrato', 'cozinha', 'pano de prato', 'enfeites', 'solto', de('cozinha', 'panoDePrato'));
  item('fruteira', 'cozinha', 'fruteira', 'enfeites', 'solto', de('cozinha', 'fruteira'));
  item('manjericao', 'cozinha', 'manjericão', 'enfeites', 'solto', de('cozinha', 'vasoDeErvas', 0));
  item('cebolinha', 'cozinha', 'cebolinha', 'enfeites', 'solto', de('cozinha', 'vasoDeErvas', 1, '#2EC4B6'));
  item('hortela', 'cozinha', 'hortelã', 'enfeites', 'solto', de('cozinha', 'vasoDeErvas', 2, '#FFC93C'));
  // ímãs de letrinhas (na geladeira; tocar: a Pipoca diz a letra)
  [['A', '#FF7A6B'], ['B', '#4DA3FF'], ['C', '#5CC84A'], ['D', '#9B7BFF'], ['E', '#FFC93C']].forEach(([l, cor]) =>
    item('ima' + l, 'cozinha', l, 'brinquedos', 'solto', de('cozinha', 'imaLetra', l, cor)));
  // ---------------------------------------------------------------- quintal
  item('varal', 'quintal', 'varal', 'enfeites', 'chao', de('quintal', 'varal'));
  item('casinhaPassarinho', 'quintal', 'casinha de passarinho', 'enfeites', 'solto', de('quintal', 'casinhaPassarinho'));
  item('hortinha', 'quintal', 'hortinha', 'moveis', 'chao', de('quintal', 'hortinha'));
  item('piscininha', 'quintal', 'piscininha', 'brinquedos', 'chao', de('quintal', 'piscininha'));
  item('regador', 'quintal', 'regador', 'brinquedos', 'chao', de('quintal', 'regador'));
  item('baldinho', 'quintal', 'baldinho', 'brinquedos', 'chao', de('quintal', 'baldinho'));
  item('mesinha', 'quintal', 'mesinha', 'moveis', 'chao', de('quintal', 'mesinha'));
  item('banco', 'quintal', 'banco', 'moveis', 'chao', de('quintal', 'banco'));
  item('carrinhoDeFlores', 'quintal', 'carrinho de flores', 'enfeites', 'chao', de('quintal', 'carrinhoDeFlores'));

  // ---------------------------------------------------------------- o que se apoia em cima de outras coisas
  // tipo 'apoia': coisas pequenas que caem e ficam em cima do primeiro móvel embaixo delas (ou no chão).
  // As outras 'soltas' são de parede (quadros, relógio, prateleiras, luzinhas...) e ficam onde forem soltas.
  ['tv', 'abajur', 'despertador', 'ursinho', 'bola', 'carrinho', 'piao', 'livros', 'portaRetrato', 'vasinho', 'pato', 'copoEscovas',
    'sabonete', 'panela', 'pipoqueira', 'baldePipoca', 'liquidificador', 'escorredor', 'fruteira', 'manjericao', 'cebolinha', 'hortela',
    'filtro', 'plantaBanheiro', 'regador', 'baldinho', 'pantufas'].forEach(id => { if (I[id]) I[id].tipo = 'apoia'; });
  // os ímãs grudam na geladeira: onde ela for, eles vão junto, no mesmo lugar da porta
  Object.keys(I).forEach(id => { if (/^ima[A-Z]$/.test(id)) I[id].gruda = true; });
  /* Onde as coisas que grudam ficam presas: [x0, y0, x1, y1] no desenho do móvel. */
  CASA.GRUDA = { geladeira: [-110, -384, 110, -12] };
  /* Os tampos onde as coisas se apoiam: [x de, x até, y] nas coordenadas do desenho do móvel (o (0,0) é o pé). */
  CASA.APOIOS = {
    criadoMudo: [[-50, 50, -156]], comoda: [[-100, 100, -174]], guardaRoupa: [[-110, 110, -405]], cama: [[-120, 140, -150]],
    prateleiraQuarto: [[-145, 145, 0]],
    sofa: [[-124, 124, -150]], poltrona: [[-62, 62, -150]], pufe: [[-48, 48, -76]], rack: [[-76, 76, -116]], estante: [[-88, 88, -270]],
    aquario: [[-76, 76, -214]], prateleiraSala: [[-86, 86, -18]],
    piaBanheiro: [[-94, -64, -164], [64, 94, -164], [-64, 64, -206]],   // no meio, fica na borda da cuba
    prateleiraBanheiro: [[-54, 54, -4]],
    geladeira: [[-108, 108, -384]], piaCozinha: [[-100, 100, -184]], fogao: [[-88, 88, -188]], mesa: [[-96, 96, -158]],
    mesinha: [[-112, 116, -150]], banco: [[-116, 116, -110]],
  };

  // ---------------------------------------------------------------- bichos (prêmio a cada 5 estações)
  // Por enquanto o bicho entra na casa com o desenho da figurinha dele (sem a borda de adesivo seria a etapa 3:
  // cada bicho vira personagem, com animações próprias). id 'bicho-figNN'.
  if (PC.figurinhas) PC.figurinhas.lista.filter(f => f.tipo !== 'casa').forEach(f => {
    const k = 1.3;
    item('bicho-' + f.id, 'bichos', f.nome, 'bichos', 'chao', () => {
      const s = String(PC.figurinhas.desenho(f.id) || '').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      return CASA.em(-100 * k, -186 * k, k, s);
    });
  });
  /** O id do item da casa que um prêmio de estação dá ('casa-tv' -> 'tv'; 'fig20' -> 'bicho-fig20'). */
  CASA.itemDoPremio = id => (String(id).indexOf('casa-') === 0 ? String(id).slice(5) : /^fig\d\d$/.test(id) ? 'bicho-' + id : null);

  // ---------------------------------------------------------------- a casa como ela vem
  const Q = CASA.CIMA.piso, S = CASA.BAIXO.piso, G = CASA.CHAO;
  CASA.inicial = () => [
    // quarto: o canto de dormir e as coisas na parede
    { id: 'tapeteQuarto', x: 1200, y: Q + 10 }, { id: 'cama', x: 797, y: Q, k: .95 }, { id: 'criadoMudo', x: 1014, y: Q, k: .92 },
    { id: 'abajur', x: 1006, y: Q - 143, k: .95 },
    { id: 'luzinhas', x: 1290, y: 290 }, { id: 'bandeirinhas', x: 2310, y: 290 }, { id: 'luzinhasCurtas', x: 3320, y: 290 },
    { id: 'pipa', x: 1560, y: 420 }, { id: 'quadroCasinha', x: 2560, y: 470 }, { id: 'quadroFoguete', x: 2730, y: 440 },
    { id: 'quadroArcoIris', x: 1740, y: 560, k: .9 },
    { id: 'prateleiraQuarto', x: 3840, y: 640 }, { id: 'livros', x: 3772, y: 640 }, { id: 'vasinho', x: 3850, y: 596, k: .8 },
    { id: 'portaRetrato', x: 3940, y: 640 }, { id: 'mobile', x: 4320, y: 248, k: .9 },
    // banheiro
    { id: 'toalhas', x: 5322, y: Q - 410 }, { id: 'piaBanheiro', x: 4982, y: Q }, { id: 'banheira', x: 7016, y: Q }, { id: 'cortina', x: 7026, y: Q - 494 },
    // sala: o cantinho de estar e a parede
    { id: 'prateleiraSala', x: 714, y: S - 410 }, { id: 'relogio', x: 1600, y: S - 420 }, { id: 'quadroPaisagem', x: 1860, y: S - 440 },
    { id: 'quadroFlor', x: 2830, y: S - 470, k: 1.15 },
    { id: 'tapeteSala', x: 1660, y: S }, { id: 'luminariaPe', x: 1478, y: S - 8 }, { id: 'sofa', x: 1600, y: S - 2 },
    // cozinha: geladeira com ímãs, pia e fogão
    { id: 'geladeira', x: 4500, y: S }, { id: 'piaCozinha', x: 4800, y: S }, { id: 'fogao', x: 4995, y: S },
    { id: 'imaA', x: 4448, y: S - 236, rot: -8 }, { id: 'imaB', x: 4510, y: S - 244, rot: 6 }, { id: 'imaC', x: 4466, y: S - 168, rot: 4 },
    { id: 'imaD', x: 4540, y: S - 176, rot: -6 }, { id: 'imaE', x: 4500, y: S - 104, rot: 3 },
    // quintal
    { id: 'varal', x: 9450, y: G },
  ];

  // ---------------------------------------------------------------- desenho
  const cache = {};
  CASA.desenho = id => {
    if (cache[id] == null) { const it = I[id]; try { cache[id] = it ? String(it.desenho()) : ''; } catch (e) { console.error('item', id, e); cache[id] = ''; } }
    return cache[id];
  };
  CASA.desenharEm = i => CASA.em(i.x, i.y, i.k || 1, CASA.desenho(i.id), i.rot || 0);
  CASA.ordenar = lista => lista.filter(i => I[i.id] && I[i.id].tipo === 'tapete').concat(lista.filter(i => I[i.id] && I[i.id].tipo !== 'tapete'));
})();
