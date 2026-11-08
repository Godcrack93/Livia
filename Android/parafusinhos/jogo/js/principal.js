// Fluxo do jogo (spec §2.4 e §7): toques, botões de ajuda, painéis, tutorial, progresso salvo
// e os ganchos do aplicativo Android e dos testes automáticos. A lógica muda na hora do toque;
// o desenho (P.Desenho) anima depois, sem nunca segurar o próximo toque.
(function (P) {
  'use strict';

  const R = P.Regras;
  const F = P.Fases;
  const D = P.Desenho;
  const S = P.Sons;
  const N = P.Nativo;

  const CHAVE = 'parafusinhos.progresso.v1';
  const MAX_PARTIDAS = 3;
  // Teto para números vindos de fora (progresso estragado, ?fase=): a grade de fases cria um botão
  // por fase até a maior liberada.
  const MAX_FASE = 9999;

  // ?fase=N abre a fase N sem mexer no que está liberado; ?limpo=1 não lê nem grava nada.
  const busca = new URLSearchParams(location.search);
  const limpo = busca.get('limpo') === '1';
  const faseFixa = Math.min(MAX_FASE, Math.max(0, parseInt(busca.get('fase'), 10) || 0));

  const $ = (id) => document.getElementById(id);
  const el = {
    app: $('app'), mesa: $('mesa'), tela: $('tela'), balao: $('balao'), aviso: $('aviso'),
    rotulo: $('rotulo-fase'), seloDificil: $('selo-dificil'), btFases: $('bt-fases'), btAjustes: $('bt-ajustes'),
    btDesfazer: $('bt-desfazer'), btDica: $('bt-dica'), btEspaco: $('bt-espaco'), seloEspaco: $('selo-espaco'),
    btRecomecar: $('bt-recomecar'),
    fundo: $('fundo-painel'),
    vitoria: $('painel-vitoria'), vitoriaTitulo: $('vitoria-titulo'), vitoriaSelo: $('vitoria-selo'),
    vitoriaDica: $('vitoria-dica'), btProxima: $('bt-proxima'), btRepetir: $('bt-repetir'),
    travou: $('painel-travou'), btVoltarCerto: $('bt-voltar-certo'), btDesfazer1: $('bt-desfazer-1'),
    btUsarEspaco: $('bt-usar-espaco'), btRecomecar2: $('bt-recomecar-2'),
    fases: $('painel-fases'), fasesSub: $('fases-subtitulo'), grade: $('grade-fases'), modelo: $('modelo-fase'),
    ajustes: $('painel-ajustes'), ajSom: $('aj-som'), ajVibracao: $('aj-vibracao'), ajSimbolos: $('aj-simbolos'),
    btComo: $('bt-como-jogar'), btApagar: $('bt-apagar'), sobreVersao: $('sobre-versao'),
    como: $('painel-como'),
  };

  // ---------------------------------------------------------------- estado

  let progresso = null;
  let usoPartida = 0; // contador: as partidas mexidas por último ficam salvas
  let nivel = null;
  let estado = null;
  let historico = []; // { estado, jogadas } antes de cada jogada e de cada recomeço (§2.4)
  let jogadas = []; // parafusos jogados desde o último recomeço
  let extraUsado = false;
  let ajudou = false; // desfazer, dica, +1 espaço ou recomeçar: a vitória deixa de ser "Perfeito"
  let venceu = false;
  let versao = 0; // muda a cada alteração do estado; esperas antigas comparam e desistem
  let ritmo = 1; // 0 = testes sem animação
  let dicaId = -1; // parafuso indicado pela dica (ondas até a próxima jogada)
  let pensando = false;
  let timerTravou = 0;
  let vitoriaPendente = false;
  let painel = null;
  const timers = { aviso: 0, balao: 0, fechar: 0, apagar: 0, fala: 0 };

  const som = (nome, op) => {
    if (ritmo) S.tocar(nome, op);
  };
  const vibrar = (tipo) => {
    if (ritmo) N.vibrar(tipo);
  };
  // Espera ms (nos testes sem animação, executa na hora).
  function depois(ms, f) {
    if (ritmo) return setTimeout(f, ms);
    f();
    return 0;
  }

  // ---------------------------------------------------------------- progresso (§7.11)

  function progressoNovo() {
    return {
      versao: 1, nivel: 1, maior: 1, concluidas: {}, tutorial: {},
      ajustes: { som: true, vibracao: true, simbolos: false }, partidas: {},
    };
  }

  const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const inteiroPositivo = (v) => Number.isInteger(v) && v >= 1;

  // Lê o progresso salvo, aceitando só o que tem o formato certo (o jogo funciona sem nada salvo).
  function lerProgresso() {
    const p = progressoNovo();
    if (limpo) return p;
    let d = null;
    try {
      d = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    } catch (e) {
      d = null; // armazenamento bloqueado ou dado estragado: começa do zero
    }
    if (!objeto(d)) return p;
    if (inteiroPositivo(d.maior)) p.maior = Math.min(d.maior, MAX_FASE);
    if (inteiroPositivo(d.nivel)) p.nivel = Math.min(d.nivel, p.maior);
    if (objeto(d.concluidas)) {
      for (const k of Object.keys(d.concluidas)) if (d.concluidas[k] === 1 || d.concluidas[k] === 2) p.concluidas[k] = d.concluidas[k];
    }
    if (objeto(d.tutorial)) for (const k of Object.keys(d.tutorial)) if (d.tutorial[k] === true) p.tutorial[k] = true;
    if (objeto(d.ajustes)) {
      for (const k of ['som', 'vibracao', 'simbolos']) if (typeof d.ajustes[k] === 'boolean') p.ajustes[k] = d.ajustes[k];
    }
    if (objeto(d.partidas)) {
      for (const k of Object.keys(d.partidas)) {
        const s = d.partidas[k];
        if (!objeto(s) || !Number.isInteger(s.assinatura) || !Array.isArray(s.jogadas) || !s.jogadas.every(Number.isInteger)) continue;
        p.partidas[k] = { assinatura: s.assinatura, jogadas: s.jogadas.slice(), extra: s.extra ? 1 : 0, ajudou: !!s.ajudou, uso: Number(s.uso) || 0 };
        usoPartida = Math.max(usoPartida, p.partidas[k].uso);
      }
    }
    return p;
  }

  function gravar() {
    if (limpo) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(progresso));
    } catch (e) {
      // sem armazenamento (modo privado, cota cheia): o jogo segue, só não lembra
    }
  }

  // Partida em andamento desta fase; ficam só as 3 mexidas por último.
  function guardarPartida() {
    const n = nivel.numero;
    if (venceu || (!jogadas.length && !extraUsado && !ajudou)) {
      delete progresso.partidas[n];
    } else {
      progresso.partidas[n] = {
        assinatura: nivel.assinatura, jogadas: jogadas.slice(), extra: extraUsado ? 1 : 0, ajudou, uso: ++usoPartida,
      };
    }
    const chaves = Object.keys(progresso.partidas);
    if (chaves.length > MAX_PARTIDAS) {
      chaves.sort((a, b) => progresso.partidas[b].uso - progresso.partidas[a].uso);
      for (const k of chaves.slice(MAX_PARTIDAS)) delete progresso.partidas[k];
    }
    gravar();
  }

  // ---------------------------------------------------------------- aviso e balão

  // Truque para reiniciar a animação de entrada: esconder, forçar o layout e mostrar de novo.
  function reanimar(e) {
    e.classList.remove('saindo');
    e.hidden = true;
    void e.offsetWidth;
    e.hidden = false;
  }

  function sumir(e, chave) {
    clearTimeout(timers[chave]);
    if (e.hidden) return;
    if (!ritmo) {
      e.hidden = true;
      return;
    }
    e.classList.add('saindo');
    timers[chave] = setTimeout(() => {
      e.hidden = true;
      e.classList.remove('saindo');
    }, 180);
  }

  function avisar(texto, alerta) {
    clearTimeout(timers.aviso);
    el.aviso.textContent = texto;
    el.aviso.classList.toggle('alerta', !!alerta);
    reanimar(el.aviso);
    timers.aviso = setTimeout(() => sumir(el.aviso, 'aviso'), 2200);
  }

  let balaoInicio = false; // o balão mostra a instrução de início do tutorial

  function mostrarBalao(texto, ms, paraCima) {
    clearTimeout(timers.balao);
    el.balao.textContent = texto;
    el.balao.classList.toggle('cauda-cima', !!paraCima);
    posicionarBalao();
    reanimar(el.balao);
    balaoInicio = false;
    if (ms) timers.balao = setTimeout(esconderBalao, ms);
  }

  function esconderBalao() {
    balaoInicio = false;
    sumir(el.balao, 'balao');
  }

  function posicionarBalao() {
    el.balao.style.top = Math.round(D.topoTabuleiro() + 10) + 'px';
  }

  // ---------------------------------------------------------------- painéis

  function abrirPainel(p) {
    clearTimeout(timers.fechar);
    el.fundo.classList.remove('saindo');
    for (const x of el.fundo.querySelectorAll('.painel')) x.hidden = x !== p;
    el.fundo.hidden = false;
    painel = p;
    el.app.inert = true;
    const foco = p.querySelector('.bt-primario') || p.querySelector('button');
    if (foco) foco.focus({ preventScroll: true });
  }

  function fecharPainel() {
    if (!painel) return;
    const p = painel;
    painel = null;
    el.app.inert = false;
    clearTimeout(timers.apagar);
    el.btApagar.classList.remove('confirmando');
    if (!ritmo) {
      el.fundo.hidden = true;
      p.hidden = true;
    } else {
      el.fundo.classList.add('saindo');
      timers.fechar = setTimeout(() => {
        el.fundo.hidden = true;
        el.fundo.classList.remove('saindo');
        p.hidden = true;
      }, 180);
    }
    // A bandeja encheu enquanto outro painel estava aberto: o aviso de "sem jogadas" vem agora.
    if (p !== el.travou && p !== el.vitoria && semSaida()) agendarTravou();
  }

  // Voltar do Android e Esc: fecha o painel de cima; na vitória vale "Próxima fase".
  function voltar() {
    if (!painel) return false;
    if (painel === el.vitoria) proximaFase();
    else fecharPainel();
    return true;
  }

  function abrirVitoria(perfeito) {
    el.vitoriaTitulo.textContent = nivel.dificil ? 'Fase difícil vencida!' : 'Fase ' + nivel.numero + ' concluída!';
    el.vitoriaSelo.hidden = !perfeito;
    el.vitoriaDica.hidden = nivel.tutorial !== 3;
    abrirPainel(el.vitoria);
  }

  function abrirTravou() {
    if (painel) return; // outro painel aberto: os botões de ajuda continuam lá embaixo
    el.btUsarEspaco.hidden = extraUsado;
    abrirPainel(el.travou);
  }

  function abrirFases() {
    const maior = progresso.maior;
    el.fasesSub.textContent = 'Você está na fase ' + maior;
    const lista = document.createDocumentFragment();
    const ultima = Math.max(maior + 10, 30, nivel.numero);
    for (let n = 1; n <= ultima; n++) {
      const b = el.modelo.content.firstElementChild.cloneNode(true);
      const travada = n > maior;
      const c = progresso.concluidas[n];
      b.querySelector('.fase-num').textContent = n;
      b.dataset.fase = n;
      b.classList.toggle('travada', travada);
      b.classList.toggle('atual', n === nivel.numero);
      b.classList.toggle('concluida', c === 1);
      b.classList.toggle('perfeita', c === 2);
      b.classList.toggle('dificil', F.ehDificil(n));
      b.setAttribute('aria-label', 'Fase ' + n + (travada ? ', trancada' : c === 2 ? ', perfeita' : c === 1 ? ', concluída' : ''));
      lista.appendChild(b);
    }
    el.grade.textContent = '';
    el.grade.appendChild(lista);
    abrirPainel(el.fases);
    // Rola só a grade (não a página) até deixar a fase atual no meio.
    const atual = el.grade.querySelector('.atual');
    if (atual) el.grade.scrollTop = atual.offsetTop - el.grade.offsetTop - (el.grade.clientHeight - atual.offsetHeight) / 2;
  }

  // ---------------------------------------------------------------- tutorial (§7.8)

  // O que cada fase de tutorial mostra: o parafuso da mãozinha, a fala de início e as falas dos
  // momentos vistos na tela (cima = rabinho para cima, apontando as caixas e a bandeja).
  const TUTORIAL = {
    1: {
      alvo: 4,
      inicio: 'Toque num parafuso para tirar.',
      momentos: {
        pouso: { texto: 'Ele foi para a caixinha da mesma cor!', cima: true },
        cai: { texto: 'Placa sem parafuso cai. Derrube todas!' },
      },
    },
    2: {
      alvo: 1,
      placa: 2,
      inicio: 'Este parafuso está preso embaixo de outra placa.',
      preso: 'Primeiro solte a placa de cima!',
      momentos: { cai: { texto: 'Agora ele está livre!', placa: 2 } },
    },
    3: {
      alvo: 8,
      inicio: 'Agora são 3 cores e só 2 caixinhas. Toque num parafuso amarelo.',
      momentos: {
        bandeja: { texto: 'Sem caixinha da cor, ele espera na bandeja.', cima: true, ms: 3500 },
        pulo: { texto: 'A caixinha chegou e ele pulou sozinho!', cima: true },
      },
    },
  };
  let tut = 0; // fase de tutorial ativa (0 = nenhuma)
  let tutVisto = {}; // mensagens já mostradas nesta visita

  // Instrução de início: aparece ao abrir a fase e sempre que ela volta ao começo.
  function tutorialInicio() {
    if (!tut || jogadas.length) return;
    calarFalas();
    mostrarBalao(TUTORIAL[tut].inicio);
    balaoInicio = true;
  }

  // Espaço (px) que o maior balão desta fase ocupa no alto do tabuleiro, medido com a fonte e a
  // largura de agora: o tabuleiro encolhe o necessário para o balão não tapar parafusos.
  function reservaBalao() {
    if (!tut) return 0;
    const d = TUTORIAL[tut];
    const textos = [d.inicio];
    if (d.preso) textos.push(d.preso);
    for (const k of Object.keys(d.momentos)) textos.push(d.momentos[k].texto);
    const m = el.balao.cloneNode(false);
    m.removeAttribute('id');
    m.className = 'balao';
    m.hidden = false;
    m.style.cssText = 'visibility:hidden;animation:none;top:0';
    el.mesa.appendChild(m);
    let alto = 0;
    for (const t of textos) {
      m.textContent = t;
      alto = Math.max(alto, m.offsetHeight);
    }
    m.remove();
    return alto + 10 + 9; // 10 px de folga em cima (posicionarBalao) e o rabinho
  }

  // Ondas (tutorial e dica), mãozinha e brilho seguem o estado atual: desfazer os traz de volta.
  function atualizarIndicacoes() {
    const ids = [];
    let brilho = [];
    let mao = -1;
    if (tut === 2) {
      // Primeiro a mão mostra o parafuso preso; depois que a criança tenta (ou joga), ela vai para
      // a placa de cima, que brilha enquanto estiver de pé; quando ela cai, volta para o parafuso.
      const d = TUTORIAL[2];
      if (!estado.caida[d.placa]) {
        brilho = [d.placa];
        if (!jogadas.length && !tutVisto.preso) mao = d.alvo;
        else mao = nivel.parafusosDaPlaca[d.placa].find((id) => !estado.removido[id]); // de pé: sobra algum
      } else if (!estado.removido[d.alvo]) {
        mao = d.alvo;
      }
    } else if (tut && !jogadas.length) {
      mao = TUTORIAL[tut].alvo;
    }
    if (mao >= 0) ids.push(mao);
    if (dicaId >= 0 && !estado.removido[dicaId] && ids.indexOf(dicaId) < 0) ids.push(dicaId);
    D.ondas(ids);
    D.mao(mao);
    D.brilho(brilho);
  }

  // Falas dos momentos em fila: jogando depressa, "a placa caiu" e "foi para a caixinha" chegam
  // quase juntas; cada fala fica pelo menos FALA_MIN na tela antes de dar lugar à próxima.
  const FALA_MIN = 1600;
  let filaFalas = [];
  let falaDesde = -Infinity; // quando a última fala de momento apareceu

  function tutorialUmaVez(chave, texto, paraCima, ms) {
    if (tutVisto[chave]) return;
    tutVisto[chave] = true;
    filaFalas.push({ texto, paraCima, ms: ms || 3000 });
    if (!timers.fala) proximaFala();
  }

  function proximaFala() {
    timers.fala = 0;
    while (filaFalas.length) {
      const espera = falaDesde + FALA_MIN - performance.now();
      if (ritmo && espera > 0) {
        timers.fala = setTimeout(proximaFala, espera);
        return;
      }
      const f = filaFalas.shift();
      mostrarBalao(f.texto, f.ms, f.paraCima);
      falaDesde = performance.now();
    }
  }

  function calarFalas() {
    filaFalas = [];
    clearTimeout(timers.fala);
    timers.fala = 0;
  }

  // Momentos vistos na tela (o parafuso pousou, a placa caiu...): hora certa de explicar.
  function tutorialMomento(tipo, dados) {
    const m = tut ? TUTORIAL[tut].momentos[tipo] : null;
    if (!m || (m.placa !== undefined && dados.placa !== m.placa)) return;
    tutorialUmaVez(tipo, m.texto, m.cima, m.ms);
  }

  // ---------------------------------------------------------------- fases

  function carregarFase(n, opcoes) {
    const o = opcoes || {};
    const nv = F.gerar(n);
    nivel = nv;
    estado = R.estadoInicial(nv);
    historico = [];
    jogadas = [];
    extraUsado = false;
    ajudou = false;
    venceu = false;
    vitoriaPendente = false;
    dicaId = -1;
    mudou();
    const salva = progresso.partidas[nv.numero];
    if (salva && !o.novo && salva.assinatura === nv.assinatura) restaurar(salva);
    else delete progresso.partidas[nv.numero];
    if (!faseFixa) progresso.nivel = nv.numero;
    el.rotulo.textContent = 'Fase ' + nv.numero;
    el.seloDificil.hidden = !nv.dificil;
    atualizarEspaco();
    tut = nv.tutorial && !progresso.tutorial[nv.tutorial] ? nv.tutorial : 0;
    tutVisto = {};
    calarFalas();
    falaDesde = -Infinity;
    D.carregar(nv, estado, { reserva: reservaBalao(), animar: !!o.animar });
    esconderBalao();
    tutorialInicio();
    atualizarIndicacoes();
    if (semSaida()) agendarTravou();
    gravar();
  }

  // Refaz a partida salva jogando de novo, em silêncio (isso remonta o histórico do desfazer).
  function restaurar(salva) {
    extraUsado = !!salva.extra;
    ajudou = salva.ajudou;
    if (extraUsado) estado.extra = 1;
    for (const id of salva.jogadas) {
      if (id < 0 || id >= nivel.parafusos.length) break;
      const antes = { estado: R.copiar(estado), jogadas: jogadas.slice() };
      if (!R.aplicar(nivel, estado, id)) break;
      historico.push(antes);
      jogadas.push(id);
    }
    if (R.venceu(nivel, estado)) {
      // Partida já vencida que ficou salva: começa de novo.
      estado = R.estadoInicial(nivel);
      if (extraUsado) estado.extra = 1;
      historico = [];
      jogadas = [];
    }
  }

  function proximaFase() {
    som('botao');
    fecharPainel();
    carregarFase(nivel.numero + 1, { animar: true });
  }

  function jogarDeNovo() {
    som('botao');
    fecharPainel();
    carregarFase(nivel.numero, { novo: true, animar: true });
  }

  // ---------------------------------------------------------------- jogadas e ajudas

  // Toda mudança de estado: invalida esperas antigas (vitória, bandeja cheia, dica).
  function mudou() {
    versao++;
    clearTimeout(timerTravou);
    timerTravou = 0;
    dicaId = -1;
    el.btRecomecar.classList.remove('pulsando');
  }

  const semSaida = () => !venceu && R.jogadasPossiveis(nivel, estado).length === 0;

  // Mesmo caminho para o toque no canvas e para P.teste.tocar.
  function tocarParafuso(id) {
    if (painel || venceu || !nivel || !nivel.parafusos[id]) return null;
    const antes = { estado: R.copiar(estado), jogadas: jogadas.slice() };
    const r = R.jogar(nivel, estado, id);
    if (!r.ok) {
      if (r.motivo === 'bloqueado') {
        D.bloqueado(id, r.placas);
        som('bloqueado');
        vibrar('erro');
        if (tut === 2) {
          mostrarBalao(TUTORIAL[2].preso, 3000);
          tutVisto.preso = true;
          atualizarIndicacoes();
        }
      } else if (r.motivo === 'bandejaCheia') {
        D.bandejaCheia();
        som('bloqueado');
        vibrar('erro');
        avisar('A bandeja está cheia', true);
      }
      return r;
    }
    historico.push(antes);
    jogadas.push(id);
    mudou();
    som('tirar');
    if (balaoInicio) esconderBalao();
    D.jogada(r.eventos);
    atualizarIndicacoes();
    if (r.vitoria) vencer();
    else if (r.semJogadas) agendarTravou();
    guardarPartida();
    return r;
  }

  // Vitória: o progresso é salvo na hora; a festa espera a tela assentar (§7.5).
  function vencer() {
    venceu = true;
    const n = nivel.numero;
    const perfeito = !ajudou;
    const c = progresso.concluidas;
    c[n] = perfeito ? 2 : Math.max(c[n] || 0, 1);
    if (!faseFixa) {
      progresso.maior = Math.max(progresso.maior, n + 1);
      progresso.nivel = n + 1; // reabrir o app já cai na próxima fase
    }
    if (nivel.tutorial) progresso.tutorial[nivel.tutorial] = true;
    vitoriaPendente = true;
    const v = versao;
    // Gera a próxima fase enquanto a festa acontece: em celular lento, gerar no toque de
    // "Próxima fase" congelaria a tela por até 1 s. A memória do gerador guarda o resultado.
    depois(120, () => {
      try { P.Fases.gerar(n + 1); } catch (e) { /* gera de novo na hora, se precisar */ }
    });
    D.quandoAssentar(() => {
      if (v !== versao) return;
      som('vitoria');
      vibrar('forte');
      D.confete();
      calarFalas();
      esconderBalao();
      depois(650, () => {
        if (v !== versao) return;
        vitoriaPendente = false;
        abrirVitoria(perfeito);
      });
    });
  }

  // Bandeja cheia e nenhuma jogada: o painel aparece 400 ms depois que tudo assentar.
  function agendarTravou() {
    const v = versao;
    D.quandoAssentar(() => {
      if (v !== versao) return;
      timerTravou = depois(400, () => {
        timerTravou = 0;
        if (v === versao && semSaida()) abrirTravou();
      });
    });
  }

  function desfazer(passos, silencioso) {
    if (venceu) return false;
    if (!historico.length) {
      if (!silencioso) avisar('Nada para desfazer');
      return false;
    }
    let h = null;
    for (let i = 0; i < passos && historico.length; i++) h = historico.pop();
    estado = R.copiar(h.estado);
    jogadas = h.jogadas.slice();
    if (extraUsado) estado.extra = 1; // o espaço extra vale até o fim da visita (§2.4)
    ajudou = true;
    mudou();
    D.reconstruir(estado);
    tutorialInicio();
    atualizarIndicacoes();
    if (semSaida()) agendarTravou();
    guardarPartida();
    return true;
  }

  function recomecar() {
    if (venceu || !jogadas.length) return; // já está no começo
    historico.push({ estado: R.copiar(estado), jogadas: jogadas.slice() });
    estado = R.estadoInicial(nivel);
    if (extraUsado) estado.extra = 1;
    jogadas = [];
    ajudou = true;
    mudou();
    D.reconstruir(estado);
    avisar('Fase recomeçada. Dá para desfazer.');
    tutorialInicio();
    atualizarIndicacoes();
    guardarPartida();
  }

  function atualizarEspaco() {
    el.btEspaco.classList.toggle('usado', extraUsado);
    el.seloEspaco.hidden = extraUsado;
    el.btUsarEspaco.hidden = extraUsado;
  }

  function usarEspaco() {
    if (venceu) return;
    if (extraUsado) {
      som('botao');
      avisar('O espaço extra já está valendo nesta fase');
      return;
    }
    extraUsado = true;
    estado.extra = 1;
    ajudou = true;
    mudou();
    atualizarEspaco();
    D.extraAtivado();
    som('extra');
    vibrar('medio');
    avisar('Ganhou um espaço a mais na bandeja!');
    atualizarIndicacoes();
    guardarPartida();
  }

  // A conta da dica roda depois de um setTimeout 0 para o botão aparecer apertado antes.
  function pedirDica(doPainel) {
    if (venceu || pensando) return;
    pensando = true;
    el.btRecomecar.classList.remove('pulsando');
    depois(0, () => {
      pensando = false;
      if (venceu) return;
      const r = P.Resolvedor.dica(nivel, estado, historico.map((h) => h.estado));
      if (r.tipo === 'nada') return;
      ajudou = true;
      if (r.tipo === 'parafuso') {
        dicaId = r.parafuso;
        atualizarIndicacoes();
      } else if (r.tipo === 'voltar') {
        desfazer(r.passos, true);
        avisar('Esse caminho travava. Voltei ' + r.passos + (r.passos === 1 ? ' jogada.' : ' jogadas.'));
        dicaId = r.parafuso;
        atualizarIndicacoes();
      } else if (doPainel) {
        recomecar(); // "Voltar até dar certo" e só o começo dá certo: volta ao começo
      } else {
        avisar('Melhor recomeçar esta fase');
        const b = el.btRecomecar;
        b.classList.remove('pulsando');
        void b.offsetWidth;
        b.classList.add('pulsando');
      }
      guardarPartida();
    });
  }

  // ---------------------------------------------------------------- sons, vibração e tutorial
  // no ritmo da tela

  function aoMomento(tipo, dados, atraso) {
    // Voltando do segundo plano, vários momentos chegam atrasados de uma vez: sem barulho em rajada.
    if (atraso > 250) {
      tutorialMomento(tipo, dados);
      return;
    }
    if (tipo === 'pouso') {
      som('pouso', { furo: dados.furo });
      vibrar('leve');
    } else if (tipo === 'pulo') {
      som('pouso', { furo: dados.furo, volume: 0.8 });
    } else if (tipo === 'bandeja') {
      som('bandeja');
      vibrar('leve');
    } else if (tipo === 'cai') {
      som('cai');
    } else if (tipo === 'completa') {
      som('completa');
      vibrar('medio');
    }
    tutorialMomento(tipo, dados);
  }

  // ---------------------------------------------------------------- entradas

  function ligar() {
    // Toque no tabuleiro (§7.6): só o ponteiro principal; entre os parafusos ao alcance, o livre
    // mais perto; se nenhum está livre, o preso mais perto (para mostrar por que não sai).
    el.tela.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0) || !nivel) return;
      S.desbloquear();
      const r = el.tela.getBoundingClientRect();
      const perto = D.acharParafusos(e.clientX - r.left, e.clientY - r.top, estado.removido);
      if (!perto.length) return;
      const livre = perto.find((c) => R.livre(nivel, estado, c.id));
      tocarParafuso((livre || perto[0]).id);
    });
    // No computador, a mãozinha do mouse mostra onde dá para tocar.
    el.tela.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !nivel) return;
      const r = el.tela.getBoundingClientRect();
      el.tela.style.cursor = D.acharParafusos(e.clientX - r.left, e.clientY - r.top, estado.removido).length ? 'pointer' : '';
    });

    el.btDesfazer.addEventListener('click', () => {
      som('botao');
      desfazer(1);
    });
    el.btDica.addEventListener('click', () => {
      som('botao');
      pedirDica(false);
    });
    el.btEspaco.addEventListener('click', usarEspaco);
    el.btRecomecar.addEventListener('click', () => {
      som('botao');
      recomecar();
    });
    el.btFases.addEventListener('click', () => {
      som('botao');
      abrirFases();
    });
    el.btAjustes.addEventListener('click', () => {
      som('botao');
      abrirPainel(el.ajustes);
    });
    el.btComo.addEventListener('click', () => {
      som('botao');
      abrirPainel(el.como);
    });

    el.fundo.addEventListener('click', (e) => {
      if (e.target.closest('[data-fechar]')) {
        som('botao');
        fecharPainel();
      } else if (e.target === el.fundo && (painel === el.fases || painel === el.ajustes || painel === el.como)) {
        fecharPainel();
      }
    });

    el.btProxima.addEventListener('click', proximaFase);
    el.btRepetir.addEventListener('click', jogarDeNovo);

    el.btVoltarCerto.addEventListener('click', () => {
      som('botao');
      fecharPainel();
      pedirDica(true);
    });
    el.btDesfazer1.addEventListener('click', () => {
      som('botao');
      fecharPainel();
      desfazer(1);
    });
    el.btUsarEspaco.addEventListener('click', () => {
      fecharPainel();
      usarEspaco();
    });
    el.btRecomecar2.addEventListener('click', () => {
      som('botao');
      fecharPainel();
      recomecar();
    });

    el.grade.addEventListener('click', (e) => {
      const b = e.target.closest('.fase');
      if (!b) return;
      const n = Number(b.dataset.fase);
      if (n > progresso.maior) {
        som('bloqueado');
        avisar('Termine a fase ' + progresso.maior + ' para liberar');
        return;
      }
      som('botao');
      // A fase nova entra antes de o painel fechar (fechar confere se a fase atual travou).
      if (n !== nivel.numero) carregarFase(n, { animar: true });
      fecharPainel();
    });

    el.ajSom.addEventListener('change', () => {
      progresso.ajustes.som = el.ajSom.checked;
      S.definirAtivo(el.ajSom.checked);
      som('botao');
      gravar();
    });
    el.ajVibracao.addEventListener('change', () => {
      progresso.ajustes.vibracao = el.ajVibracao.checked;
      N.definirVibracao(el.ajVibracao.checked);
      vibrar('medio');
      som('botao');
      gravar();
    });
    el.ajSimbolos.addEventListener('change', () => {
      progresso.ajustes.simbolos = el.ajSimbolos.checked;
      D.definirSimbolos(el.ajSimbolos.checked);
      som('botao');
      gravar();
    });

    // "Apagar progresso" pede confirmação dentro do próprio botão (vale por 3 s).
    el.btApagar.addEventListener('click', () => {
      clearTimeout(timers.apagar);
      if (!el.btApagar.classList.contains('confirmando')) {
        som('botao');
        el.btApagar.classList.add('confirmando');
        timers.apagar = setTimeout(() => el.btApagar.classList.remove('confirmando'), 3000);
        return;
      }
      el.btApagar.classList.remove('confirmando');
      som('botao');
      const ajustes = progresso.ajustes;
      progresso = progressoNovo();
      progresso.ajustes = ajustes;
      carregarFase(1, { novo: true, animar: true });
      fecharPainel();
      avisar('Progresso apagado');
    });

    // Teclado no computador (§7.6).
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (voltar()) e.preventDefault();
        return;
      }
      if (painel || e.altKey || e.metaKey || !nivel) return;
      const k = e.key.toLowerCase();
      if (k === 'z') {
        e.preventDefault();
        som('botao');
        desfazer(1);
      } else if (e.ctrlKey || e.repeat) {
        return;
      } else if (k === 'd') {
        som('botao');
        pedirDica(false);
      } else if (k === 'r') {
        som('botao');
        recomecar();
      }
    });

    // Sair do app ou trocar de aba: grava na hora.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) gravar();
    });
    globalThis.addEventListener('pagehide', gravar);

    // A largura muda o tamanho do balão (e o espaço que ele pede); a fonte também, quando chega.
    const redimensionar = () => {
      D.reservarTopo(reservaBalao());
      D.redimensionar();
      posicionarBalao();
    };
    if (globalThis.ResizeObserver) new ResizeObserver(redimensionar).observe(el.mesa);
    else globalThis.addEventListener('resize', redimensionar);
    if (document.fonts && document.fonts.load) document.fonts.load('500 18px Fredoka').then(redimensionar, () => {});
  }

  // ---------------------------------------------------------------- ganchos (§7.10 e §7.12)

  P.voltar = voltar;
  P.pausar = function () {
    gravar();
    S.suspender();
  };
  P.retomar = function () {
    S.retomar();
  };

  P.teste = {
    nivel: () => nivel,
    estado: () => R.copiar(estado),
    tocar: (id) => tocarParafuso(id),
    ir: (n) => {
      carregarFase(n);
      fecharPainel();
    },
    pularAnimacoes: (sim) => {
      ritmo = sim ? 0 : 1;
      D.pularAnimacoes(!!sim);
    },
    ocupado: () => D.ocupado() || !!timerTravou || vitoriaPendente || pensando,
    // Extras para os testes no navegador: onde clicar e qual painel está aberto.
    posicao: (id) => D.posicaoNaTela(id),
    painel: () => (painel ? painel.id : null),
  };

  // ---------------------------------------------------------------- início

  progresso = lerProgresso();
  const a = progresso.ajustes;
  el.ajSom.checked = a.som;
  el.ajVibracao.checked = a.vibracao;
  el.ajSimbolos.checked = a.simbolos;
  S.definirAtivo(a.som);
  N.definirVibracao(a.vibracao);
  D.definirSimbolos(a.simbolos);
  el.sobreVersao.textContent = N.versao();
  D.iniciar(el.tela, { aoMomento });
  ligar();
  carregarFase(faseFixa || progresso.nivel, { animar: true });
})(globalThis.Parafusinhos = globalThis.Parafusinhos || {});
