/* Pipoca Aprende — inicialização e modo de teste.
   Chaves da URL (combináveis, depois de #; params sempre como encodeURIComponent(JSON.stringify(obj))):
     atividade=torre&params={...}   abre direto uma atividade (modo teste)
     estacao=7                      abre direto uma estação da trilha
     tela=mapa&dados={...}          abre direto uma tela, com params
     assinante=1|0                  simula a assinatura no navegador (ignorado no app)
     progresso=N                    estações 1 a N já concluídas (com figurinhas)
     dados=memoria                  não usa o localStorage (testes)
     semente=N                      sorteios repetíveis
     voz=simulada|muda              voz de teste (simulada demora como a de verdade, sem som)
     rapido=1                       esperas e animações curtas (implica voz=simulada se a voz não for dada)
     ponte=falsa&assinatura=...&vozapp=ok|sem-ptbr   simula o app Android (jogo/teste/ponte-falsa.js)
     debug=1                        avisos extras no console
   Nada disso funciona dentro do app Android (lá a ponte existe e os atalhos de teste ficam desligados). */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  function lerHash() {
    try { return new URLSearchParams((location.hash || '').replace(/^#/, '')); } catch (e) { return new URLSearchParams(); }
  }
  const h = lerHash();

  function carregarScript(src) {
    return new Promise(r => { const s = document.createElement('script'); s.src = src; s.onload = r; s.onerror = r; document.head.appendChild(s); });
  }

  function versaoChrome() {
    const m = /Chrome\/(\d+)/.exec(navigator.userAgent || '');
    return m ? Number(m[1]) : 0;
  }

  function iniciar() {
    const app = PC.nativo.disponivel() && h.get('ponte') !== 'falsa';
    PC.modoApp = app;                 // true só dentro do app Android de verdade
    if (!app) {
      if (h.get('rapido') === '1') PC.config.rapido = true;
      if (h.get('debug') === '1') PC.config.debug = true;
      if (h.get('semente')) U.semear(Number(h.get('semente')));
      const voz = h.get('voz') || (PC.config.rapido ? 'simulada' : '');
      if (voz === 'simulada' || voz === 'muda') PC.voz.forcarModo(voz);
    }

    PC.palco.montar(document.getElementById('jogo'));
    PC.dados.carregar(app ? {} : { memoria: h.get('dados') === 'memoria', progresso: Number(h.get('progresso')) || 0 });
    PC.assinatura.iniciar();

    // o som só pode começar depois de um toque
    window.addEventListener('pointerdown', () => PC.som.iniciar(), { capture: true });

    // app em segundo plano: cala a voz e pausa o som
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { PC.voz.parar(); PC.som.pausar(); } else PC.som.retomar();
    });
    PC.on('nativo:retomar', () => PC.som.retomar());
    PC.on('nativo:pausa', () => { PC.voz.parar(); PC.som.pausar(); });

    // o Android só intercepta o voltar quando há para onde voltar (na abertura, o sistema cuida)
    PC.on('tela:mudou', d => PC.nativo.enviar('podeVoltar', { valor: d.id !== 'abertura' }));

    // teclado (no computador): Esc volta
    window.addEventListener('keydown', ev => { if (ev.key === 'Escape') PC.telas.voltar(); });

    // tempo de uso e limite diário (supervisão dos pais): conta só com o app visível, fora das telas de adulto
    const TELAS_ADULTO = ['pais', 'portao', 'assinatura', 'descanso'];
    const PASSO = 5;
    setInterval(() => {
      if (document.hidden || PC.config.rapido) return;
      const tela = PC.telas.atual();
      if (!tela || TELAS_ADULTO.indexOf(tela) >= 0) return;
      PC.dados.registrarUso(PASSO);
      if (PC.dados.limiteAtingido() && tela !== 'abertura') PC.telas.ir('descanso', {});
    }, PASSO * 1000);

    // WebView muito antiga: avisa os pais (o jogo evita recursos mais novos que o Chrome 110)
    PC.webviewAntiga = versaoChrome() > 0 && versaoChrome() < 110;

    // janela em pé (multijanela, desktop): pede para girar, sem recarregar nada
    const gire = U.el('div', { class: 'pc-gire', 'aria-label': 'Gire o aparelho' },
      U.el('div', { class: 'pc-gire-pipoca', html: PC.arte.pipoca('aponta') }),
      U.el('div', { class: 'pc-gire-icone', html: '<svg viewBox="0 0 64 64"><rect x="20" y="8" width="24" height="44" rx="6" fill="#fff" stroke="#3A2A5A" stroke-width="4"/><path d="M50 30 a 18 18 0 0 1 -14 22" fill="none" stroke="#3A2A5A" stroke-width="4" stroke-linecap="round"/><path d="M33 47 l 4 6 l 6 -3" fill="none" stroke="#3A2A5A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>' }));
    document.getElementById('jogo').appendChild(gire);

    // primeira tela
    if (!app && h.get('atividade')) {
      let params = {};
      try { params = JSON.parse(h.get('params') || '{}'); } catch (e) { console.error('params inválidos na URL', e); }
      PC.telas.ir('atividade', { atividade: h.get('atividade'), params, teste: true });
    } else if (!app && h.get('estacao')) {
      PC.telas.ir('atividade', { estacao: Number(h.get('estacao')) });
    } else {
      let extra = {};
      if (!app) { try { extra = JSON.parse(h.get('dados') && h.get('dados') !== 'memoria' ? h.get('dados') : '{}'); } catch (e) { extra = {}; } }
      PC.telas.ir((!app && h.get('tela')) || 'abertura', extra);
    }

    if (!app) instalarDebug();
    PC.pronto = true;
    PC.emitir('pronto');
    // avisa o Android que o jogo está ouvindo (ele responde com 'estado': voz, assinatura e insets)
    PC.nativo.enviar('pronto', { versao: PC.versao });
  }

  // ---------------------------------------------------------------- ajudas para testes (só no navegador)
  function instalarDebug() {
    const D = PC.debug;
    D.paraTela = (x, y) => PC.palco.paraTela(x, y);
    D.estado = () => Object.assign({
      tela: PC.telas.atual(),
      falando: PC.ui.pipoca.falando(),
      arrastando: PC.arrastar.ativo(),
      erros: PC.erros.slice(),
    }, D.estadoRodada && PC.telas.atual() === 'atividade' ? D.estadoRodada() : {});
    /** Próximo gesto certo da rodada, em px de TELA (para o testador tocar de verdade). */
    D.proximoGesto = () => {
      const g = D.proximoGestoVirtual ? D.proximoGestoVirtual() : null;
      if (!g) return null;
      const t = p => { const q = PC.palco.paraTela(p.x, p.y); return { x: q.x, y: q.y }; };
      if (g.tipo === 'tocar') return { tipo: 'tocar', em: t(g.em) };
      if (g.tipo === 'arrastar') return { tipo: 'arrastar', de: t(g.de), para: t(g.para) };
      if (g.tipo === 'tracar') return { tipo: 'tracar', pontos: g.pontos.map(t) };
      return null;
    };
    /** Espera o jogo ficar parado (sem fala, sem arraste) por 400 ms. */
    D.esperarOcioso = ({ limite = 10000 } = {}) => new Promise(resolve => {
      const t0 = performance.now(); let calmo = 0;
      const tic = setInterval(() => {
        // uma tela pode avisar que está animando (ex.: o mapa rolando) com PC.debug.telaOcupada = () => boolean
        let tela = false;
        try { tela = typeof D.telaOcupada === 'function' && !!D.telaOcupada(); } catch (e) { tela = false; }
        let rodada = false;
        try { rodada = PC.telas.atual() === 'atividade' && typeof D.rodadaOcupada === 'function' && !!D.rodadaOcupada(); } catch (e) { rodada = false; }
        const ocupado = PC.ui.pipoca.falando() || PC.voz.falando() || PC.arrastar.ativo() || PC.toquesBloqueados() || tela || rodada;
        calmo = ocupado ? 0 : calmo + 100;
        if (calmo >= 400 || performance.now() - t0 > limite) { clearInterval(tic); resolve(calmo >= 400); }
      }, 100);
    });
    /** Confere alvos pequenos demais ou em zonas reservadas. Devolve [{teste, problema}]. */
    D.verificarLayout = () => {
      const L = PC.layout, problemas = [];
      const raiz = PC.telas.raizAtual();
      if (!raiz) return problemas;
      raiz.querySelectorAll('[data-teste]').forEach(el => {
        if (el.closest('.hud') || el.offsetParent === null) return;
        const r = PC.palco.retangulo(el);
        const nome = el.dataset.teste;
        if (r.l < L.alvoMinimo - 1 && r.a < L.alvoMinimo - 1) problemas.push({ teste: nome, problema: `alvo pequeno (${Math.round(r.l)}×${Math.round(r.a)})` });
        if ((PC.telas.atual() === 'atividade' || PC.telas.atual() === 'livre') && !el.closest('.parabens') && !el.closest('.pc-moldura-pausa') && !el.closest('.hud')) {
          if (r.y < L.faixaHud - 10) problemas.push({ teste: nome, problema: 'invade a faixa do HUD' });
          if (r.x < L.cantoPipoca.l - 10 && r.y + r.a > L.cantoPipoca.y + 10) problemas.push({ teste: nome, problema: 'invade o canto da Pipoca' });
          if (r.x < -5 || r.y < -5 || r.x + r.l > 1605 || r.y + r.a > 905) problemas.push({ teste: nome, problema: 'fora do palco' });
        }
      });
      return problemas;
    };
  }

  // ---------------------------------------------------------------- partida
  async function partida() {
    if (!PC.nativo.disponivel() && h.get('ponte') === 'falsa') await carregarScript('teste/ponte-falsa.js');
    try {
      if (document.fonts && document.fonts.load) {
        await Promise.race([
          Promise.all(['500', '600', '700'].map(p => document.fonts.load(p + ' 40px Fredoka'))),
          new Promise(r => setTimeout(r, 1500)),
        ]);
      }
    } catch (e) { /* segue com a fonte reserva */ }
    iniciar();
  }
  partida();
})();
