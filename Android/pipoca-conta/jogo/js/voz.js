/* Pipoca Aprende — voz em português do Brasil.
   Modos (PC.voz.modo):
     'nativa'   — no app Android: TextToSpeech do aparelho pela ponte (mensagens 'falar'/'pararFala'; resposta 'voz-fim').
     'web'      — no navegador: speechSynthesis com voz pt-BR, se houver.
     'simulada' — testes (#voz=simulada): não fala, mas demora o tempo de uma fala de verdade (60 ms por letra).
     'muda'     — sem voz nenhuma (#voz=muda ou voz desligada): resolve rápido; o balão continua.
   PC.voz.falar nunca rejeita e nunca fica pendente: resolve com 'fim', 'interrompida', 'muda' ou 'erro'.
   Regras de fala (PROJETO.md 6.1): nunca mande algarismos (falar() troca por extenso, no masculino, como garantia);
   use PC.voz.quantidade(n, 'moedinha', 'moedinhas', {feminino: true}) para concordar. */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;
  let ligada = true;
  let seq = 0;
  let pendente = null;          // { id, resolver, timer }
  let fila = Promise.resolve();
  let vozWeb = null;
  let modoForcado = null;       // 'simulada' | 'muda' | null

  // ---------------------------------------------------------------- números por extenso
  const UNI = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
    'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const CEM = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  function ate999(n, fem) {
    if (n < 20) {
      if (fem && n === 1) return 'uma';
      if (fem && n === 2) return 'duas';
      return UNI[n];
    }
    if (n < 100) {
      const d = Math.floor(n / 10), u = n % 10;
      return u ? DEZ[d] + ' e ' + ate999(u, fem) : DEZ[d];
    }
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100), r = n % 100;
    let cent = CEM[c];
    if (fem && c > 1) cent = cent.replace(/os$/, 'as');
    return r ? cent + ' e ' + ate999(r, fem) : cent;
  }

  /** Número por extenso (0 a 9999). feminino: "uma", "duas", "vinte e duas". Grafia do Brasil (dezesseis, quatorze). */
  function extenso(n, { feminino = false } = {}) {
    n = Math.round(Number(n));
    if (!isFinite(n)) return '';
    if (n < 0) return 'menos ' + extenso(-n, { feminino });
    if (n < 1000) return ate999(n, feminino);
    if (n < 10000) {
      const m = Math.floor(n / 1000), r = n % 1000;
      const mil = m === 1 ? 'mil' : ate999(m, feminino) + ' mil';
      if (!r) return mil;
      return mil + (r < 100 || r % 100 === 0 ? ' e ' : ' ') + ate999(r, feminino);
    }
    return String(n);
  }

  /** "um cubinho", "duas moedinhas", "vinte e uma figurinhas", "nenhum cubinho" (0). */
  function quantidade(n, singular, plural, { feminino = false } = {}) {
    if (n === 0) return (feminino ? 'nenhuma ' : 'nenhum ') + singular;
    return extenso(n, { feminino }) + ' ' + (n === 1 ? singular : plural);
  }

  /** Para 16 a 19 (e 11 a 15): "dez e mais seis... dezesseis". */
  function dezEMais(n) {
    if (n <= 10 || n >= 20) return extenso(n);
    return 'dez e mais ' + extenso(n - 10) + '... ' + extenso(n);
  }

  /** Garante que o texto não tem algarismos (o motor de voz pode ler errado). */
  const semAlgarismos = texto => String(texto).replace(/\d+/g, m => extenso(Number(m)));

  // ---------------------------------------------------------------- motores
  const ponte = () => (PC.nativo && PC.nativo.disponivel() ? true : null);
  let vozNativa = { disponivel: false, motivo: 'iniciando' };
  PC.on('nativo:voz', d => {
    vozNativa = { disponivel: !!(d && d.disponivel), motivo: (d && d.motivo) || '' };
    PC.emitir('voz:mudou', { disponivel: vozNativa.disponivel, motivo: vozNativa.motivo });
  });

  function escolherVozWeb() {
    if (!('speechSynthesis' in window)) return null;
    let vozes = [];
    try { vozes = window.speechSynthesis.getVoices() || []; } catch (e) { vozes = []; }
    const pt = vozes.filter(v => /^pt[-_]?BR/i.test(v.lang));      // só português do Brasil (nada de "dezassete")
    const preferidas = ['Google português do Brasil', 'Francisca', 'Thalita', 'Maria', 'Luciana', 'Daniel', 'Antonio'];
    for (const nome of preferidas) { const v = pt.find(x => x.name.indexOf(nome) >= 0); if (v) return v; }
    return pt[0] || null;
  }
  if ('speechSynthesis' in window) {
    vozWeb = escolherVozWeb();
    try { window.speechSynthesis.addEventListener('voiceschanged', () => { vozWeb = escolherVozWeb(); PC.emitir('voz:mudou', {}); }); } catch (e) { /* antigo */ }
  }

  function modo() {
    if (!ligada || modoForcado === 'muda') return 'muda';
    if (modoForcado === 'simulada') return 'simulada';
    if (ponte()) return 'nativa';
    if ('speechSynthesis' in window) return 'web';
    return 'muda';
  }

  function disponivel() {
    if (ponte()) return vozNativa.disponivel;
    return !!vozWeb;
  }

  const estimar = texto => 600 + String(texto).length * 75;           // duração aproximada de uma fala
  const velocidade = () => (PC.dados && PC.dados.ajustes && PC.dados.ajustes.vozDevagar ? 0.78 : 0.9);
  const volume = () => U.limitar(Number(PC.dados && PC.dados.ajustes && PC.dados.ajustes.vozVolume) || 1, 0.3, 1);

  function encerrarPendente(motivo) {
    if (!pendente) return;
    const p = pendente; pendente = null;
    clearTimeout(p.timer);
    p.resolver(motivo || 'fim');
  }

  // ---------------------------------------------------------------- vozes gravadas (jogo/vozes/, ElevenLabs)
  // jogo/vozes/indice.js define window.PC_VOZES = { mapa: { 'frase normalizada': 'arquivo.mp3' } }.
  // Cada fala é dividida em frases (depois de . ! ? …); se TODAS as frases tiverem gravação, toca os arquivos em
  // sequência; senão, a fala inteira vai para a voz do aparelho (nunca mistura as duas vozes na mesma fala).
  // A divisão e a chave TÊM de ser iguais às de ferramentas/frases-montar.mjs.
  const dividirFrases = texto => String(texto).split(/(?<=[.!?…])\s+/).map(s => s.trim()).filter(Boolean);
  const chaveFrase = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  let gravadasLigadas = true;
  let audioAtual = null;

  function arquivosGravados(texto) {
    const mapa = gravadasLigadas && window.PC_VOZES && window.PC_VOZES.mapa;
    if (!mapa) return null;
    // fala longa gravada inteira num áudio só (vozes/longas.js)
    const longas = window.PC_VOZES.longas;
    if (longas) { const k = chaveFrase(texto); for (const t in longas) if (chaveFrase(t) === k) return [longas[t]]; }
    const lista = dividirFrases(texto).map(f => mapa[chaveFrase(f)]);
    if (!lista.length || lista.some(a => !a)) {
      if (PC.debug && !PC.modoApp) (PC.debug.semGravacao = PC.debug.semGravacao || []).push(texto);
      return null;
    }
    return lista;
  }

  /**
   * A forma de boca do momento da fala gravada que está tocando (vozes/bocas.js, calculado pelo Rhubarb:
   * 'A'..'G' ou 'X'), ou null (sem áudio gravado tocando ou sem formas para ele: a boca mexe ao acaso).
   */
  const linhas = {};
  function bocaAgora() {
    const a = audioAtual, mapa = window.PC_BOCAS;
    if (!a || !mapa || !a.__arquivo || !mapa[a.__arquivo]) return null;
    // antes de o som começar e depois que ele acaba (até a fala se encerrar), a boca fica fechada, descansando
    if (a.ended || a.paused || a.currentTime <= 0) return 'X';
    let l = linhas[a.__arquivo];
    if (l === undefined) {
      const s = mapa[a.__arquivo];
      l = linhas[a.__arquivo] = s ? [...s.matchAll(/([A-HX])(\d+)/g)].map(m => [m[1], +m[2] / 100]) : null;
    }
    if (!l) return null;
    const t = a.currentTime + .08;   // adiantado: a boca leva uns centésimos para chegar na forma (molas) e o som sai com atraso
    let f = l[0][0];
    for (let k = 0; k < l.length && l[k][1] <= t; k++) f = l[k][0];
    return f;
  }

  function pararAudio() {
    const a = audioAtual; audioAtual = null;
    if (a) { try { a.onended = a.onerror = null; a.pause(); a.removeAttribute('src'); a.load(); } catch (e) { /* ok */ } }
  }

  /** Toca os arquivos em sequência. aoFalhar() é chamado se o primeiro nem começar (aí a voz do aparelho assume). */
  function tocarGravadas(arquivos, id, aoFalhar) {
    let i = 0;
    const devagar = PC.dados && PC.dados.ajustes && PC.dados.ajustes.vozDevagar;
    const proximo = () => {
      if (!pendente || pendente.id !== id) return;
      if (i >= arquivos.length) { audioAtual = null; encerrarPendente('fim'); return; }
      const primeiro = i === 0;
      const a = new Audio('vozes/' + arquivos[i]);
      a.__arquivo = arquivos[i++];
      audioAtual = a;
      a.volume = volume();
      try { a.preservesPitch = true; } catch (e) { /* antigo */ }
      a.playbackRate = devagar ? 0.85 : 1;
      a.onended = () => { if (audioAtual === a) setTimeout(proximo, 90); };
      const falhou = () => {
        if (audioAtual !== a) return;
        audioAtual = null;
        if (primeiro) aoFalhar(); else encerrarPendente('erro');
      };
      a.onerror = falhou;
      const p = a.play();
      if (p && p.catch) p.catch(falhou);
    };
    proximo();
  }

  function falarAgora(texto) {
    encerrarPendente('interrompida');
    pararAudio();
    return new Promise(resolver => {
      const id = 'f' + (++seq);
      const m = modo();
      const gravadas = (m === 'nativa' || m === 'web') ? arquivosGravados(texto) : null;
      if (gravadas) {
        pendente = { id, resolver, timer: setTimeout(() => { if (pendente && pendente.id === id) { pararAudio(); encerrarPendente('fim'); } }, 5000 + String(texto).length * 130) };
        tocarGravadas(gravadas, id, () => { if (pendente && pendente.id === id) falarComMotor(texto, id, m); });
        return;
      }
      const timer = setTimeout(() => { if (pendente && pendente.id === id) encerrarPendente('fim'); }, 1500 + String(texto).length * 90 + (m === 'simulada' ? 0 : 1500));
      pendente = { id, resolver, timer };
      if (m === 'simulada') {
        clearTimeout(timer);
        pendente.timer = setTimeout(() => { if (pendente && pendente.id === id) encerrarPendente('fim'); }, U.duracao(String(texto).length * 60));
        return;
      }
      falarComMotor(texto, id, m);
    });
  }

  /** Fala com o motor de voz do aparelho (nativa) ou do navegador (web); pendente já está montado. */
  function falarComMotor(texto, id, m) {
    if (m === 'nativa') {
      // o Android guarda o pedido até a voz ficar pronta e sempre responde voz-fim (fim, interrompida ou erro)
      if (!PC.nativo.enviar('falar', { texto, id, velocidade: velocidade(), volume: volume() })) encerrarPendente('erro');
      return;
    }
    if (m !== 'web') { encerrarPendente('muda'); return; }
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'pt-BR';
    if (vozWeb) u.voice = vozWeb;
    u.rate = velocidade() + 0.08; u.pitch = 1.08; u.volume = volume();
    u.onend = () => { if (pendente && pendente.id === id) encerrarPendente('fim'); };
    u.onerror = () => { if (pendente && pendente.id === id) encerrarPendente('erro'); };
    try { window.speechSynthesis.speak(u); } catch (e) { encerrarPendente('erro'); }
  }

  PC.on('nativo:voz-fim', d => { if (pendente && d && d.id === pendente.id) encerrarPendente(d.motivo || 'fim'); });

  function pararTudo() {
    encerrarPendente('interrompida');
    pararAudio();
    if (ponte()) PC.nativo.enviar('pararFala');
    else if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) { /* ok */ } }
  }

  // "segurar": enquanto o "Quer parar?" está aberto, as falas e contagens esperam (só falas com forcar passam)
  let segurando = false, soltarSegura = () => {}, segura = Promise.resolve();
  function segurar(v) {
    if (v && !segurando) { segurando = true; segura = new Promise(r => { soltarSegura = r; }); }
    else if (!v && segurando) { segurando = false; soltarSegura(); }
  }

  let geracao = 0;               // cada interrupção invalida o que estava na fila
  /**
   * Fala um texto. interromper (padrão true) corta a fala atual; false espera a atual terminar.
   * forcar: fala mesmo com a voz "segurada" (só a moldura usa, na pergunta "Quer parar?").
   * Devolve Promise<'fim'|'interrompida'|'muda'|'erro'> (nunca rejeita, nunca fica pendente).
   */
  function falar(texto, { interromper = true, forcar = false } = {}) {
    if (segurando && !forcar) return segura.then(() => falar(texto, { interromper }));
    texto = semAlgarismos(String(texto == null ? '' : texto).trim());
    if (!texto) return Promise.resolve('fim');
    if (PC.debug && !PC.modoApp) (PC.debug.falas = PC.debug.falas || []).push(texto);   // coleta de frases (ferramentas/frases-coletar.mjs)
    if (modo() === 'muda') return new Promise(r => setTimeout(() => r('muda'), U.duracao(Math.min(1800, 300 + texto.length * 30))));
    if (interromper) {
      const g = ++geracao;
      pararTudo();
      // o Chrome às vezes ignora um speak() logo depois do cancel(); um respiro resolve
      const atraso = modo() === 'web' ? 60 : 0;
      fila = new Promise(r => setTimeout(r, atraso)).then(() => (g === geracao ? falarAgora(texto) : 'interrompida'));
      return fila;
    }
    const g = geracao;
    fila = fila.then(() => (g === geracao ? falarAgora(texto) : 'interrompida'));
    return fila;
  }

  /**
   * Conta em voz alta: de, de+passo, ... até "ate". aCada(i, valor) é chamado em cada número (acende o cubinho).
   * Sempre no masculino ("um, dois, três"), em ordem, sem pular número: cada número espera a fala anterior
   * terminar (teto de 2,5 s) ou o intervalo, o que for maior.
   * substantivo: ['cubinho', 'cubinhos'] (ou ['moedinha', 'moedinhas', true] para feminino) termina com o total:
   * "... quatro, cinco. Cinco cubinhos!". sinal: AbortSignal — se abortar, rejeita com AbortError.
   */
  // na contagem, cada número espera a fala terminar, mas no máximo isto (a voz do aparelho demora a encerrar cada palavra)
  const TETO_NUMERO = 1100;

  async function contar(ate, { de = 1, passo = 1, aCada = null, intervalo = 450, sinal = null, substantivo = null } = {}) {
    if (!passo) passo = 1;
    let i = 0, ultimo = null;
    for (let v = de; passo > 0 ? v <= ate : v >= ate; v += passo, i++) {
      if (sinal && sinal.aborted) throw U.abortado();
      if (segurando) await segura;                         // "Quer parar?" aberto: a contagem espera
      if (sinal && sinal.aborted) throw U.abortado();
      if (aCada) { try { aCada(i, v); } catch (e) { console.error(e); } }
      if (PC.som) PC.som.contar(i + 1);
      const fala = falar(extenso(v));
      const [, r] = await Promise.all([U.esperar(intervalo, sinal), Promise.race([fala, U.esperar(TETO_NUMERO)])]);
      // a pergunta "Quer parar?" cortou este número: espera e fala de novo, para não pular nenhum
      if (r === 'interrompida' && segurando) {
        await segura;
        if (sinal && sinal.aborted) throw U.abortado();
        await Promise.race([falar(extenso(v)), U.esperar(TETO_NUMERO)]);
      }
      ultimo = v;
    }
    if (substantivo && ultimo !== null) {
      if (sinal && sinal.aborted) throw U.abortado();
      const t = quantidade(ultimo, substantivo[0], substantivo[1], { feminino: !!substantivo[2] });
      await falar(t.charAt(0).toUpperCase() + t.slice(1) + '!');
    }
  }

  const ELOGIOS = ['Muito bem!', 'Isso aí!', 'Arrasou!', 'Que demais!', 'Mandou bem!', 'Uhuu! Acertou!', 'Perfeito!', 'Show de bola!'];
  const QUASE = ['Quase! Tenta outra vez.', 'Foi quase!', 'Quase! Vamos de novo?'];
  let ultimoElogio = '', ultimoQuase = '';
  function sortearSem(lista, ultimo) { let s; do { s = U.escolher(lista); } while (lista.length > 1 && s === ultimo); return s; }

  PC.voz = {
    falar, contar, TETO_NUMERO, extenso, quantidade, dezEMais, disponivel,
    get modo() { return modo(); },
    /** Há uma fala acontecendo agora (de qualquer origem)? */
    falando: () => !!pendente,
    /** Segura (true) ou solta (false) as falas e contagens; a moldura usa durante o "Quer parar?". */
    segurar,
    /** 'simulada' ou 'muda' (testes); null volta ao normal. */
    forcarModo(m) { modoForcado = m || null; },
    /** Motivo da voz indisponível no app (ex.: 'sem-ptbr', 'sem-motor', 'iniciando'). */
    motivo: () => (ponte() ? vozNativa.motivo : (vozWeb ? '' : 'sem-voz-pt-br-no-navegador')),
    aoMudar: fn => PC.on('voz:mudou', fn),
    parar: pararTudo,
    bocaAgora,
    /** Elogio variado (a moldura usa no acerto). */
    elogio() { ultimoElogio = sortearSem(ELOGIOS, ultimoElogio); return ultimoElogio; },
    /** "Quase!" — use SÓ quando a criança errou por pouco (por um, ou por um passo da sequência). */
    quase() { ultimoQuase = sortearSem(QUASE, ultimoQuase); return ultimoQuase; },
    /** Usa as vozes gravadas (jogo/vozes/) quando existem; false força a voz do aparelho (comparar, testes). */
    get gravadas() { return gravadasLigadas; },
    set gravadas(v) { gravadasLigadas = !!v; },
    /** Quantas frases gravadas o jogo tem (0 = nenhuma; tudo sai pela voz do aparelho). */
    totalGravadas: () => (window.PC_VOZES && window.PC_VOZES.mapa ? Object.keys(window.PC_VOZES.mapa).length : 0),
    get ligada() { return ligada; },
    set ligada(v) { ligada = !!v; if (!ligada) pararTudo(); },
  };
})();
