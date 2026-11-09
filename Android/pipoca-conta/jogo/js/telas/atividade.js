/* Pipoca Aprende — moldura das atividades (PROJETO.md 9.7).
   Cuida de: cenário, HUD (voltar, bolinhas de progresso, ouvir de novo), Pipoca apresentadora, ciclo das rodadas,
   retorno de erro, dicas em degraus, relógio de inatividade, "Quer parar?", retomada da rodada, comemoração entre
   rodadas, estatísticas e a tela de Parabéns com figurinha.
   Parâmetros de PC.telas.ir('atividade', ...): { estacao: n } ou { atividade: 'id', params: {...}, teste: true }. */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;
  const REPETIR_MS = 7000;      // parada sem tocar: repete a instrução
  const MAOZINHA_MS = 15000;    // parada sem tocar: mostra a mãozinha
  const PERGUNTA_MS = 8000;     // "Quer parar?" sem resposta: continua

  U.estilo('moldura', `
    .pc-moldura-pausa { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; z-index: 70; display: grid; place-items: center; }
    .pc-moldura-pausa .veu { position: absolute; left: -1200px; top: -700px; width: 4000px; height: 2300px; background: rgba(58, 42, 90, .5); }
    .pc-moldura-pausa .caixa { position: relative; display: flex; align-items: center; gap: 90px; padding: 50px 80px; border-radius: 48px;
      background: var(--creme); border: 6px solid var(--tinta); box-shadow: 0 14px 0 var(--tinta); }
    .pc-moldura-pausa .botao-icone.grande { width: 200px; height: 200px; }
    .pc-moldura-pausa .botao-icone.grande svg { width: 120px; height: 120px; }
    .pc-moldura-pausa .botao-icone.medio { width: 150px; height: 150px; }
    .pc-moldura-pausa .botao-icone.medio svg { width: 86px; height: 86px; }
    .pc-moldura-pausa .pipoca-pergunta { width: 230px; height: 248px; }
    .pc-moldura-pausa .pipoca-pergunta svg { width: 100%; height: 100%; overflow: visible; }
    .hud .botao-icone { width: 110px; height: 110px; }
    .hud .botao-icone svg { width: 64px; height: 64px; }
    .parabens .botoes .botao-grande.continuar { height: 150px; font-size: 60px; padding: 0 64px 0 50px; }
    .parabens .botoes .botao-grande.continuar svg { width: 76px; height: 76px; }
    .parabens .botoes .botao-icone { flex: none; width: 150px; height: 150px; }
    .parabens .linha-figurinha { display: flex; align-items: center; gap: 60px; margin: 0 0 30px; }
    .parabens .linha-figurinha .figurinha-nova { margin: 0; }
    .parabens .botoes .botao-icone svg { width: 86px; height: 86px; }
    .parabens .botoes { opacity: 0; transition: opacity .3s; pointer-events: none; }
    .parabens .botoes.mostrar { opacity: 1; pointer-events: auto; }
  `);

  PC.telas.registrar('atividade', {
    voltarPara: 'mapa',
    criar(raiz, entrada) {
      const fase = entrada.estacao ? PC.fase(entrada.estacao) : null;
      const idAtividade = fase ? fase.atividade : entrada.atividade;
      const params = Object.assign({}, fase ? fase.params : (entrada.params || {}));
      const def = PC.atividades.obter(idAtividade);
      const teste = !!entrada.teste;
      const sair = new AbortController();
      let rodada = null;          // { controle, ac, palco, ctx, limpar }
      let destruida = false, pausada = false, caixaPausa = null, timerPausa = null, ocupadoAgora = false;
      const inicioEstacao = performance.now();
      let totalErros = 0, totalDicas = 0;

      // cenário
      const nomeCenario = fase ? PC.regiaoDe(fase.n).cenario : (params.cenario || (def && def.cenario) || 'prado');
      raiz.appendChild(PC.arte.cenario(nomeCenario));

      // camada das rodadas
      const camada = U.el('div', { class: 'camada-rodadas', style: 'position:absolute;left:0;top:0;width:1600px;height:900px;z-index:10' });
      raiz.appendChild(camada);

      // HUD
      let total = 1;
      try { total = def ? (def.totalRodadas ? def.totalRodadas(params) : PC.rodadasDe(idAtividade, params)) : 1; } catch (e) { console.error(e); }
      total = Math.max(1, Math.min(10, Number(total) || 1));
      const hud = U.el('div', { class: 'hud' });
      const bVoltar = PC.ui.botaoIcone('voltar', 'Voltar', () => PC.telas.voltar());
      bVoltar.dataset.teste = 'voltar';
      const bOuvir = PC.ui.botaoIcone('falar', 'Ouvir de novo', () => repetirInstrucao(), { cor: 'amarelo' });
      bOuvir.dataset.teste = 'ouvir';
      const progresso = U.el('div', { class: 'progresso', 'aria-hidden': 'true' });
      const bolinhas = [];
      for (let i = 0; i < total; i++) { const b = U.el('i', { class: 'bolinha' }); bolinhas.push(b); progresso.appendChild(b); }
      hud.append(U.el('div', { class: 'hud-esq' }, bVoltar), progresso, U.el('div', { class: 'hud-dir' }, bOuvir));
      raiz.appendChild(hud);

      // Pipoca
      PC.ui.pipoca.montar(raiz);
      const offPipoca = PC.on('pipoca:tocada', () => repetirInstrucao());
      const offRetomar = PC.on('nativo:retomar', () => { if (!pausada) repetirInstrucao(); });

      function repetirInstrucao() {
        if (pausada || !rodada || rodada.ac.signal.aborted) return;
        try { const r = rodada.controle.instrucao && rodada.controle.instrucao(); if (r && r.catch) r.catch(() => {}); } catch (e) { console.error(e); }
      }

      function falhaGrave(e) {
        console.error(e);
        if (destruida) return;
        PC.ui.pipoca.dizer('Ops! Vamos voltar para a trilha.');
        setTimeout(() => { if (!destruida) PC.telas.ir(teste ? 'abertura' : 'mapa', {}); }, 1800);
      }

      if (!def) {
        PC.ui.pipoca.dizer('Esta brincadeira ainda está sendo construída!');
        return { destruir() { sair.abort(); offPipoca(); offRetomar(); } };
      }

      // ------------------------------------------------------------ retomada (rodada guardada da estação)
      let primeira = 0;
      if (fase && !teste) {
        const r = PC.dados.extra('retomar');
        if (r && r.estacao === fase.n && r.rodada > 0 && r.rodada < total) primeira = r.rodada;
      }

      // ------------------------------------------------------------ uma rodada
      function jogarRodada(indice) {
        return new Promise((resolve) => {
          const ac = new AbortController();
          const aoSair = () => ac.abort();
          sair.signal.addEventListener('abort', aoSair, { once: true });
          const palco = U.el('div', { class: 'rodada', 'data-rodada': String(indice) });
          camada.appendChild(palco);
          bolinhas.forEach((b, i) => b.classList.toggle('atual', i === indice));
          if (fase && !teste) PC.dados.extra('retomar', { estacao: fase.n, rodada: indice });
          PC.bloquearToques(450);

          let errosSeguidos = 0, acertou = false, ocupado = false, dicaAtiva = null, funcaoDica = null;
          let parado = 0, repetiu = false, mostrouMao = false;
          const zerarRelogio = () => { parado = 0; repetiu = false; mostrouMao = false; };
          const offToque = PC.on('toque', zerarRelogio);

          function maozinha() {
            if (ac.signal.aborted || acertou) return;
            totalDicas++;
            let g = null;
            try { g = controle.proximoGesto ? controle.proximoGesto() : null; } catch (e) { console.error(e); }
            if (dicaAtiva && dicaAtiva.parar) dicaAtiva.parar();
            if (g && g.tipo === 'arrastar') dicaAtiva = PC.ui.dica(g.de, g.para, { raiz: palco });
            else if (g && g.tipo === 'tocar') dicaAtiva = PC.ui.dica(g.em, null, { raiz: palco });
            else if (g && g.tipo === 'tracar' && g.pontos && g.pontos.length > 1) dicaAtiva = PC.ui.dica(g.pontos[0], null, { raiz: palco, caminho: g.pontos });
            else if (funcaoDica) { try { dicaAtiva = funcaoDica(3) || null; } catch (e) { console.error(e); } }
          }
          function ajudar(nivel) {
            if (ac.signal.aborted || acertou) return;
            if (nivel >= 3) { maozinha(); errosSeguidos = 1; return; }
            totalDicas++;
            if (controle.ajudar) { try { const r = controle.ajudar(nivel); if (r && r.catch) r.catch(() => {}); return; } catch (e) { console.error(e); } }
            if (funcaoDica && nivel === 2) { try { dicaAtiva = funcaoDica(2) || null; return; } catch (e) { console.error(e); } }
            repetirInstrucao();
          }

          // relógio de inatividade: só corre quando a criança pode agir
          ocupadoAgora = false;
          const relogio = setInterval(() => {
            if (ac.signal.aborted || acertou || pausada || ocupado || PC.ui.pipoca.falando() || PC.voz.falando() || PC.arrastar.ativo()) return;
            parado += 500;
            if (!repetiu && parado >= REPETIR_MS) { repetiu = true; repetirInstrucao(); }
            else if (!mostrouMao && parado >= MAOZINHA_MS) { mostrouMao = true; maozinha(); }
          }, 500);

          const ctx = {
            palco,
            params,
            indice,
            total,
            sinal: ac.signal,
            teste,
            /** primeira rodada de uma atividade nova: a atividade demonstra uma vez com a mãozinha */
            demo: !!params.demo && indice === 0,
            /** primeira rodada jogada agora (a 1ª da estação ou a da retomada): a instrução vai inteira; nas
             *  seguintes a atividade pode encurtar, porque a criança acabou de ouvir (a repetição por inatividade
             *  continua inteira) */
            primeiraDaVez: indice === primeira,
            /** Espera (segura enquanto o "Quer parar?" estiver aberto). Rejeita com AbortError quando a rodada acaba. */
            esperar: ms => U.esperar(ms, ac.signal).then(() => aguardarRetomada(ac.signal)),
            /** A Pipoca fala (depois do "Quer parar?", se aberto). Rejeita com AbortError se a rodada acabar. */
            falar(texto, opcoes) {
              if (ac.signal.aborted) return Promise.reject(U.abortado());
              return aguardarRetomada(ac.signal)
                .then(() => PC.ui.pipoca.dizer(texto, opcoes || {}))
                .then(r => { if (ac.signal.aborted) throw U.abortado(); return r; });
            },
            /** A rodada está pausada pelo "Quer parar?"? */
            pausada: () => pausada,
            /** Rodada resolvida. Só a primeira chamada vale (se pausada, vale quando a criança continuar). */
            acertou() {
              if (acertou || ac.signal.aborted) return;
              if (pausada) { aguardarRetomada(ac.signal).then(() => ctx.acertou(), () => {}); return; }
              acertou = true;
              palco.inert = true;
              PC.arrastar.cancelarTodos();
              if (dicaAtiva && dicaAtiva.parar) dicaAtiva.parar();
              PC.bloquearToques(600);
              ac.abort();
              resolve();
            },
            /** Acerto parcial (uma etapa de várias): zera os erros seguidos e o relógio. */
            avancou() { if (!acertou) { errosSeguidos = 0; zerarRelogio(); } },
            /**
             * Decisão errada (nunca use para escorregão do dedo). A moldura toca o som suave e fala `fala`
             * (descreva o que aconteceu: "Deu sete. Precisamos de cinco."). Depois decide a ajuda em degraus.
             */
            errou(opcoes) {
              if (acertou || ac.signal.aborted) return;
              const o = typeof opcoes === 'string' ? { fala: opcoes } : (opcoes || {});
              errosSeguidos++; totalErros++;
              zerarRelogio();
              PC.som.quase();
              const fala = o.fala || (o.quase ? PC.voz.quase() : 'Vamos tentar de novo.');
              const nivel = errosSeguidos;
              PC.ui.pipoca.pose('pensa');
              PC.ui.pipoca.dizer(fala, { mostrar: o.mostrar != null ? o.mostrar : null })
                .then(() => aguardarRetomada(ac.signal))           // se o "Quer parar?" abriu, a ajuda espera
                .then(() => {
                  PC.ui.pipoca.pose('normal');
                  if (nivel >= 2) ajudar(nivel);
                }, () => {});
            },
            /** A atividade está animando ou contando: o relógio de inatividade pausa. */
            ocupado(v) { ocupado = !!v; ocupadoAgora = ocupado; if (!ocupado) zerarRelogio(); },
            /** Mãozinha manual (de/para em px virtuais). Some no próximo toque. */
            dica(de, para, op) { if (dicaAtiva && dicaAtiva.parar) dicaAtiva.parar(); dicaAtiva = PC.ui.dica(de, para, Object.assign({ raiz: palco }, op || {})); return dicaAtiva; },
            /** (compatibilidade) registra a função de dica para quando a atividade não tiver proximoGesto/ajudar. */
            quandoPrecisarDeDica(fn) { funcaoDica = fn; },
            pipoca: PC.ui.pipoca,
          };

          let controle = {};
          try { controle = def.rodada(ctx) || {}; } catch (e) { falhaGrave(e); }
          rodada = {
            controle, ac, palco, ctx,
            limpar() {
              clearInterval(relogio); offToque();
              sair.signal.removeEventListener('abort', aoSair);
              if (dicaAtiva && dicaAtiva.parar) dicaAtiva.parar();
              ac.abort();
              try { if (controle.destruir) controle.destruir(); } catch (e) { console.error(e); }
              palco.remove();
            },
          };
          if (sair.signal.aborted) resolve();
        });
      }

      async function comemorarRodada(indice) {
        const b = bolinhas[indice];
        if (b) { b.classList.remove('atual'); b.classList.add('feita', 'acendeu'); }
        PC.voz.parar();
        PC.som.acerto();
        PC.ui.pipoca.pose('feliz');
        PC.ui.confete({ x: 800, y: 380, quantidade: 30, raiz });
        await Promise.all([PC.ui.pipoca.dizer(PC.voz.elogio()), U.esperar(1100, sair.signal)]);
        PC.ui.pipoca.pose('normal');
      }

      // ------------------------------------------------------------ "Quer parar?"
      // enquanto a pergunta está aberta, ctx.esperar, ctx.falar e ctx.acertou seguram até a criança continuar
      let retomada = Promise.resolve(), soltarRetomada = () => {};
      function aguardarRetomada(sinal) {
        if (!pausada) return Promise.resolve();
        return new Promise((ok, falha) => {
          retomada.then(() => { if (sinal && sinal.aborted) falha(U.abortado()); else ok(); });
          if (sinal) sinal.addEventListener('abort', () => falha(U.abortado()), { once: true });
        });
      }
      function perguntarParar() {
        if (caixaPausa) return;
        pausada = true;
        retomada = new Promise(r => { soltarRetomada = r; });
        PC.emitir('atividade:pausa');
        PC.arrastar.cancelarTodos();
        PC.voz.segurar(true);                      // falas e contagens da atividade esperam
        PC.voz.parar();
        const pip = U.el('div', { class: 'pipoca-pergunta', html: PC.arte.pipoca('pensa') });
        const bSair = PC.ui.botaoIcone('casa', 'Sair', () => sairDeVez());
        bSair.classList.add('medio'); bSair.dataset.teste = 'sair';
        const bContinuar = PC.ui.botaoIcone('play', 'Continuar', () => fecharPausa(), { cor: 'verde' });
        bContinuar.classList.add('grande', 'toque-pulsa'); bContinuar.dataset.teste = 'continuar';
        caixaPausa = U.el('div', { class: 'pc-moldura-pausa', role: 'dialog', 'aria-label': 'Quer parar?' },
          U.el('div', { class: 'veu' }), U.el('div', { class: 'caixa' }, pip, bSair, bContinuar));
        raiz.appendChild(caixaPausa);
        PC.voz.falar('Quer parar? A casinha sai. O botão verde continua.', { forcar: true });
        timerPausa = setTimeout(fecharPausa, PERGUNTA_MS);
      }
      function fecharPausa() {
        clearTimeout(timerPausa);
        if (caixaPausa) { caixaPausa.remove(); caixaPausa = null; }
        pausada = false;
        PC.voz.segurar(false);
        soltarRetomada();
        PC.emitir('atividade:continua');
        repetirInstrucao();
      }
      function sairDeVez() {
        clearTimeout(timerPausa);
        PC.telas.ir(teste ? 'abertura' : 'mapa', {});
      }

      // ------------------------------------------------------------ parabéns
      function parabens() {
        let r = { primeiraVez: false, nova: false };
        if (fase) {
          r = PC.dados.concluirEstacao(fase.n, fase.figurinha);
          PC.dados.extra('retomar', undefined);
          PC.dados.registrarEstatistica(fase.n, { erros: totalErros, dicas: totalDicas, segundos: (performance.now() - inicioEstacao) / 1000 });
        }
        const final = fase && fase.n === PC.fases.length;
        PC.ui.pipoca.esconder();

        const caixa = U.el('div', { class: 'parabens', role: 'dialog', 'aria-label': 'Parabéns' });
        const veu = U.el('div', { class: 'veu' });
        const painel = U.el('div', { class: 'painel' });
        const festa = U.el('div', { class: 'pipoca-festa danca', html: PC.arte.pipoca('danca') });
        const titulo = U.el('h2', { text: final && r.primeiraVez ? 'Você completou a trilha!' : 'Parabéns!' });
        const msg = U.el('p', { text: r.nova ? 'Você ganhou uma figurinha nova!' : (fase ? 'Você terminou esta brincadeira!' : 'Muito bem!') });
        painel.append(festa, titulo, msg);
        // linha da figurinha: a figurinha e, ao lado dela, o botão de jogar de novo (dentro do painel)
        const linhaFig = U.el('div', { class: 'linha-figurinha' });
        if (fase && PC.figurinhas && PC.figurinhas.desenho) {
          linhaFig.appendChild(U.el('div', { class: 'figurinha-nova', html: PC.figurinhas.desenho(fase.figurinha) }));
        }
        painel.appendChild(linhaFig);
        const botoes = U.el('div', { class: 'botoes' });
        const botoesExtra = U.el('div', { class: 'botoes extra' });
        const bContinuar = PC.ui.botaoGrande(teste ? 'De novo' : 'Continuar', () => {
          if (teste) PC.telas.ir('atividade', entrada);
          else PC.telas.ir('mapa', { animarEstacao: fase ? fase.n + 1 : null, concluida: fase ? fase.n : null });
        }, { icone: teste ? 'repetir' : 'play', cor: '#5CC84A' });
        bContinuar.classList.add('continuar', 'toque-pulsa'); bContinuar.dataset.teste = 'continuar';
        botoes.appendChild(bContinuar);
        if (!teste) {
          const bDeNovo = PC.ui.botaoIcone('repetir', 'Jogar de novo', () => PC.telas.ir('atividade', entrada));
          bDeNovo.dataset.teste = 'de-novo';
          botoesExtra.appendChild(bDeNovo);
          linhaFig.appendChild(botoesExtra);
        }
        painel.appendChild(botoes);
        caixa.append(veu, painel);
        raiz.appendChild(caixa);

        PC.som.festa();
        if (r.nova) setTimeout(() => PC.som.figurinha(), U.duracao(700));
        PC.ui.confete({ x: 800, y: 300, quantidade: 60, raiz: caixa, espalhar: 1.3 });
        if (final && r.primeiraVez) setTimeout(() => PC.ui.confete({ x: 400, y: 200, quantidade: 60, raiz: caixa }), U.duracao(900));
        // os botões só aparecem depois da figurinha (evita o toque que "sobra" da rodada)
        setTimeout(() => { botoes.classList.add('mostrar'); botoesExtra.classList.add('mostrar'); }, U.duracao(1300));
        const fala = final && r.primeiraVez ? 'Uau! Você completou a trilha toda! Que orgulho!'
          : (r.nova ? 'Parabéns! Você ganhou uma figurinha nova!' : 'Parabéns! Muito bem!');
        PC.voz.falar(fala).then(() => { if (!destruida) PC.voz.falar('Toque no botão verde para continuar.', { interromper: false }); });
        PC.emitir('atividade:concluida', { estacao: fase ? fase.n : null, nova: r.nova, primeiraVez: r.primeiraVez });
      }

      // ------------------------------------------------------------ ciclo
      (async () => {
        try {
          for (let i = 0; i < primeira; i++) bolinhas[i].classList.add('feita');
          PC.bloquearToques(700);                 // a 1ª rodada ainda vai começar: nada de toque "adiantado"
          await U.esperar(350, sair.signal);
          for (let i = primeira; i < total; i++) {
            await jogarRodada(i);
            if (sair.signal.aborted) return;
            await comemorarRodada(i);
            if (rodada) { rodada.limpar(); rodada = null; }
          }
          if (!sair.signal.aborted) parabens();
        } catch (e) {
          if (!U.ehAbortado(e)) falhaGrave(e);
        }
      })();

      // atalhos de teste: só no navegador (nunca dentro do app Android)
      if (!PC.modoApp) {
        PC.debug.resolverRodada = () => {
          if (rodada && rodada.controle && typeof rodada.controle.resolver === 'function') {
            try { const r = rodada.controle.resolver(); if (r && r.catch) r.catch(() => {}); } catch (e) { console.error(e); }
            return true;
          }
          return false;
        };
        PC.debug.rodadaAtual = () => (rodada ? Number(rodada.palco.dataset.rodada) : -1);
        PC.debug.rodadaOcupada = () => !!(rodada && ocupadoAgora && !destruida);
        PC.debug.proximoGestoVirtual = () => {
          try { return rodada && rodada.controle.proximoGesto ? rodada.controle.proximoGesto() : null; } catch (e) { return null; }
        };
        PC.debug.estadoRodada = () => {
          let est = null;
          try { est = rodada && rodada.controle.estado ? rodada.controle.estado() : null; } catch (e) { est = null; }
          return { atividade: idAtividade, estacao: fase ? fase.n : null, rodada: rodada ? Number(rodada.palco.dataset.rodada) : -1, total, pausada, estado: est };
        };
      }

      return {
        destruir() {
          if (destruida) return;
          destruida = true;
          clearTimeout(timerPausa);
          PC.voz.segurar(false);                   // nunca deixar a voz segurada ao sair
          sair.abort();
          offPipoca(); offRetomar();
          if (rodada) { rodada.limpar(); rodada = null; }
          PC.voz.parar();
        },
        /** Voltar (HUD ou Android): pergunta "Quer parar?"; com a pergunta aberta, sai de vez. */
        voltar() {
          if (raiz.querySelector('.parabens')) { PC.telas.ir(teste ? 'abertura' : 'mapa', {}); return true; }
          if (caixaPausa) { sairDeVez(); return true; }
          perguntarParar();
          return true;
        },
      };
    },
  });
})();
