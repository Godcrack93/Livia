/* Pipoca Aprende — banco de palavras das brincadeiras de letras (PROJETO.md 5.8 a 5.14). Dono: núcleo.
   Cada palavra: { id, texto: 'BANANA', silabas: ['BA', 'NA', 'NA'], inicial: 'B', figura, rima?, bicho? }
     figura   'obj:<id>' (desenho de objeto: js/palavras-arte.js) ou 'fig:<figNN>' (o bicho do álbum)
     rima     grupo de rima ('ato', 'ao', ...): palavras do mesmo grupo rimam (PC.palavras.gruposDeRima() = grupos com 2 ou mais)
     bicho    true para os bichos do álbum (estações com params.bichos)
   Tudo em MAIÚSCULAS de forma (a letra que a criança aprende primeiro). Minúsculas: PC.palavras.minuscula(s).

   API
     PC.palavras.lista                     todas as palavras
     PC.palavras.obter(id)                 a palavra (ou null)
     PC.palavras.filtrar({ silabas: [min, max], iniciais: [...], bichos, rima, comFigura }) -> [palavras]
     PC.palavras.desenho(palavra|id)       SVG da figura (viewBox 0 0 200 200), pronto para um <img> ou innerHTML
     PC.palavras.nome(palavra)             como a Pipoca fala a palavra ('banana')
     PC.palavras.falaSilaba('BA')          como a Pipoca fala uma sílaba sozinha ('bá'), para o motor de voz não soletrar
     PC.palavras.falaLetra('B')            o nome da letra ('bê')
     PC.palavras.artigo(palavra)           'o' ou 'a' ("Toque na banana")
     PC.palavras.registrarDesenhos({ id: () => svg })   usado por palavras-arte.js
   Regras: nunca uma letra com rosto, olhos ou braços (PROJETO.md 2: nada de "Alphablocks"); as letras aparecem em
   cartinhas, lousa, plaquinhas e ovinhos. Nunca peça o som isolado de uma consoante: use o nome da letra e sílabas. */
(function () {
  'use strict';
  const PC = window.PC;

  // [texto, sílabas separadas por '-', figura, extras]
  // figura: 'obj:id' ou 'fig:figNN'. extras: { rima, bicho, artigo, fala }
  const W = (silabas, figura, extras = {}) => ({ silabas: silabas.split('-'), figura, ...extras });
  const DADOS = [
    // ---------------- objetos e bichos do dia a dia (desenhos em palavras-arte.js)
    W('BO-LA', 'obj:bola', { rima: 'ola' }),
    W('MO-LA', 'obj:mola', { rima: 'ola' }),
    W('PA-TO', 'obj:pato', { rima: 'ato' }),
    W('GA-TO', 'obj:gato', { rima: 'ato' }),
    W('RA-TO', 'obj:rato', { rima: 'ato' }),
    W('SA-PA-TO', 'obj:sapato', { rima: 'ato' }),
    W('MÃO', 'obj:mao', { rima: 'ao', artigo: 'a' }),
    W('PÃO', 'obj:pao', { rima: 'ao' }),
    W('LE-ÃO', 'obj:leao', { rima: 'ao' }),
    W('JA-NE-LA', 'obj:janela', { rima: 'ela' }),
    W('PA-NE-LA', 'obj:panela', { rima: 'ela' }),
    W('VE-LA', 'obj:vela', { rima: 'ela' }),
    W('BO-CA', 'obj:boca', { rima: 'oca' }),
    W('FO-CA', 'obj:foca', { rima: 'oca' }),
    W('BO-NE-CA', 'obj:boneca', { rima: 'eca' }),
    W('PE-TE-CA', 'obj:peteca', { rima: 'eca' }),
    W('CA-NE-CA', 'obj:caneca', { rima: 'eca' }),
    W('MA-LA', 'obj:mala', { rima: 'ala' }),
    W('BA-LA', 'obj:bala', { rima: 'ala' }),
    W('SOL', 'obj:sol', { rima: 'ol' }),
    W('AN-ZOL', 'obj:anzol', { rima: 'ol' }),
    W('U-VA', 'obj:uva', { rima: 'uva' }),
    W('O-VO', 'obj:ovo', { rima: 'ovo' }),
    W('CA-SA', 'obj:casa', { rima: 'asa' }),
    W('A-SA', 'obj:asa', { rima: 'asa' }),
    W('DA-DO', 'obj:dado', { rima: 'ado' }),
    W('BO-LO', 'obj:bolo', { rima: 'olo' }),
    W('PI-PA', 'obj:pipa', { rima: 'ipa' }),
    W('LU-A', 'obj:lua', { rima: 'ua' }),
    W('VA-CA', 'obj:vaca', { rima: 'aca' }),
    W('MA-CA-CA', 'obj:macaca', { rima: 'aca', fala: 'macaca' }),
    W('BA-NA-NA', 'obj:banana', { rima: 'ana' }),
    W('TO-MA-TE', 'obj:tomate', { rima: 'ate' }),
    W('CA-VA-LO', 'obj:cavalo', { rima: 'alo' }),
    W('PÉ', 'obj:pe', { rima: 'e' }),
    W('CO-PO', 'obj:copo', { rima: 'opo' }),
    W('LÁ-PIS', 'obj:lapis', { rima: 'is' }),
    W('FA-DA', 'obj:fada', { rima: 'ada' }),
    W('DE-DO', 'obj:dedo', { rima: 'edo' }),
    W('NA-VI-O', 'obj:navio', { rima: 'io' }),
    W('RO-DA', 'obj:roda', { rima: 'oda' }),
    W('NU-VEM', 'obj:nuvem', { rima: 'em', artigo: 'a' }),
    W('ES-CA-DA', 'obj:escada', { rima: 'ada' }),
    W('E-LE-FAN-TE', 'obj:elefante', { rima: 'ante' }),
    W('I-LHA', 'obj:ilha', { rima: 'ilha' }),
    W('O-LHO', 'obj:olho', { rima: 'olho' }),
    // ---------------- bichos e plantas do álbum (o desenho é a própria figurinha)
    W('A-RA-RA', 'fig:fig24', { bicho: true }),
    W('A-BE-LHA', 'fig:fig08', { bicho: true }),
    W('AN-TA', 'fig:fig47', { bicho: true }),
    W('E-MA', 'fig:fig34', { bicho: true }),
    W('I-PÊ', 'fig:fig01', { bicho: true, artigo: 'o' }),
    W('ON-ÇA', 'fig:fig21', { bicho: true }),
    W('U-RU-BU', 'obj:urubu', { bicho: true }),
    W('BO-TO', 'fig:fig41', { bicho: true }),
    W('PI-RA-RU-CU', 'fig:fig43', { bicho: true }),
    W('MI-CO', 'fig:fig25', { bicho: true }),
    W('TA-TU', 'fig:fig33', { bicho: true }),
    W('TU-CA-NO', 'fig:fig23', { bicho: true }),
    W('VA-GA-LU-ME', 'fig:fig37', { bicho: true, fala: 'vaga-lume' }),
    W('JA-CA-RÉ', 'fig:fig17', { bicho: true }),
    W('CA-PI-VA-RA', 'fig:fig20', { bicho: true }),
    W('CO-RU-JA', 'fig:fig27', { bicho: true }),
    W('JA-BU-TI', 'fig:fig53', { bicho: true }),
    W('CU-TI-A', 'fig:fig54', { bicho: true }),
    W('SA-GUI', 'fig:fig51', { bicho: true }),
    W('SA-PO', 'fig:fig19', { bicho: true }),
    W('QUA-TI', 'fig:fig26', { bicho: true }),
    W('LI-BÉ-LU-LA', 'fig:fig16', { bicho: true }),
    W('GAR-ÇA', 'fig:fig12', { bicho: true }),
    W('PA-PA-GAI-O', 'fig:fig36', { bicho: true }),
    W('BEM-TE-VI', 'fig:fig31', { bicho: true, fala: 'bem-te-vi' }),
    W('CA-JU', 'fig:fig39', { bicho: true }),
    W('DOU-RA-DO', 'obj:dourado', { bicho: true }),
    W('FOR-MI-GA', 'obj:formiga', { bicho: true }),
    W('LO-BO', 'fig:fig05', { bicho: true }),
    W('JI-BOI-A', 'fig:fig55', { bicho: true }),
  ];

  const tirarAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const lista = DADOS.map(d => {
    const texto = d.silabas.join('');
    const id = d.id || tirarAcento(texto).toLowerCase();
    return Object.freeze({
      id, texto, silabas: Object.freeze(d.silabas.slice()), inicial: tirarAcento(texto.charAt(0)),
      figura: d.figura, rima: d.rima || null, bicho: !!d.bicho, artigo: d.artigo || null, fala: d.fala || null,
    });
  });
  const porId = {};
  lista.forEach(p => { porId[p.id] = p; });

  // ---------------------------------------------------------------- voz
  const NOMES_LETRAS = { A: 'á', B: 'bê', C: 'cê', D: 'dê', E: 'é', F: 'éfe', G: 'gê', H: 'agá', I: 'i', J: 'jota', K: 'cá',
    L: 'éle', M: 'ême', N: 'êne', O: 'ó', P: 'pê', Q: 'quê', R: 'érre', S: 'ésse', T: 'tê', U: 'u', V: 'vê', W: 'dáblio',
    X: 'xis', Y: 'ípsilon', Z: 'zê' };
  /** Nome da letra para a voz: 'B' -> 'bê'. */
  const falaLetra = l => NOMES_LETRAS[tirarAcento(String(l)).toUpperCase()] || String(l).toLowerCase();

  // sílaba sozinha: a vogal ganha acento para o motor de voz ler como sílaba ("BA" -> "bá", "TO" -> "tô")
  const VOGAL_FALADA = { A: 'á', E: 'ê', I: 'í', O: 'ô', U: 'ú' };
  /** Como a Pipoca fala uma sílaba sozinha: 'BA' -> 'bá', 'NE' -> 'nê', 'MÃO' -> 'mão', 'ZOL' -> 'zól'. */
  function falaSilaba(s) {
    s = String(s).toUpperCase().replace(/^Ç/, 'S');                 // ÇA sozinho se lê "sá"
    if (/[ÁÉÍÓÚÂÊÔÃÕ]/.test(s)) return s.toLowerCase();       // já tem acento: lê do jeito que está escrito
    const m = s.match(/^(.*?)([AEIOU])([^AEIOU]*)$/);            // a última vogal leva o acento
    if (!m) return s.toLowerCase();
    let [, ini, v, fim] = m;
    if (fim === 'L' && v === 'O') return (ini + 'ÓL').toLowerCase();
    if (fim === 'M' || fim === 'N') return (ini + v + fim).toLowerCase();  // EM, AN: nasal, sem acento
    if (/^[AEIOU]$/.test(ini.slice(-1))) return s.toLowerCase();  // ditongo: GUI, QUA, BOI
    return (ini + VOGAL_FALADA[v] + fim).toLowerCase();
  }

  /** Como a Pipoca fala a palavra inteira: 'banana'. */
  const nome = p => { p = typeof p === 'string' ? porId[p] : p; return p ? (p.fala || p.texto.toLowerCase()) : ''; };

  // artigo: as que terminam em A são femininas, menos as marcadas
  const artigo = p => { p = typeof p === 'string' ? porId[p] : p; if (!p) return 'o'; return p.artigo || (/A$/.test(tirarAcento(p.texto)) ? 'a' : 'o'); };

  const minuscula = s => String(s).toLowerCase();

  // ---------------------------------------------------------------- desenhos
  const desenhos = {};
  const cache = {};
  const ESTRELA = '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="70" fill="#FFF4B8" stroke="#3A2A5A" stroke-width="6"/>' +
    '<text x="100" y="124" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="64" fill="#3A2A5A">?</text></svg>';
  function desenho(p) {
    p = typeof p === 'string' ? porId[p] : p;
    if (!p) return ESTRELA;
    const [tipo, id] = p.figura.split(':');
    if (tipo === 'fig') return PC.figurinhas ? PC.figurinhas.desenho(id) : ESTRELA;
    if (cache[id]) return cache[id];
    if (!desenhos[id]) return ESTRELA;
    try { cache[id] = desenhos[id](); } catch (e) { console.error(e); return ESTRELA; }
    return cache[id];
  }
  /** O desenho existe de verdade (não é o "?" provisório)? */
  const temDesenho = p => { p = typeof p === 'string' ? porId[p] : p; if (!p) return false; const [t, id] = p.figura.split(':'); return t === 'fig' || !!desenhos[id]; };

  function filtrar({ silabas, iniciais, bichos, rima, comFigura = false } = {}) {
    return lista.filter(p => {
      if (silabas && (p.silabas.length < silabas[0] || p.silabas.length > silabas[1])) return false;
      if (iniciais && iniciais.indexOf(p.inicial) < 0) return false;
      if (bichos === true && !p.bicho) return false;
      if (bichos === false && p.bicho) return false;
      if (rima === true && !p.rima) return false;
      if (typeof rima === 'string' && p.rima !== rima) return false;
      if (comFigura && !temDesenho(p)) return false;
      return true;
    });
  }

  PC.palavras = {
    lista,
    obter: id => porId[id] || null,
    filtrar,
    desenho,
    temDesenho,
    nome,
    artigo,
    falaSilaba,
    falaLetra,
    minuscula,
    semAcento: tirarAcento,
    /** Grupos de rima com 2 palavras ou mais: { ato: [pato, gato, ...], ... } */
    gruposDeRima() {
      const g = {};
      lista.forEach(p => { if (p.rima) (g[p.rima] = g[p.rima] || []).push(p); });
      Object.keys(g).forEach(k => { if (g[k].length < 2) delete g[k]; });
      return g;
    },
    registrarDesenhos(obj) { Object.keys(obj).forEach(k => { desenhos[k] = obj[k]; delete cache[k]; }); },
  };
})();
