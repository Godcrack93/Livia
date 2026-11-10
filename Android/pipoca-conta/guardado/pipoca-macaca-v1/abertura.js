/* Pipoca Aprende — tela de abertura (dono: agente de arte).
   Logo, a Pipoca acenando (tocar nela: ela se apresenta), o botão grande Jogar (ícone play) e o cadeado dos adultos.
   Depois do primeiro toque, a Pipoca pede uma vez: "Toque no botão verde para jogar!" (apontando para o botão).
   Toques de adulto (no cadeado e no portão aberto por cima da abertura) não contam como primeiro toque.
   No app, se a voz em português faltar, aparece um aviso pequeno para o adulto, preso ao cadeado.
   data-teste: pipoca, jogar, pais. */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;

  const FALA_OI = 'Oi! Eu sou a Pipoca! Vamos brincar e aprender?';
  const FALA_JOGAR = 'Toque no botão verde para jogar!';
  const AVISO_VOZ = 'Falta a voz em português: toque no cadeado';

  function estilo() {
    U.estilo('abertura', `
      .logo.pc-abertura-logo { position: absolute; left: 50%; top: 38px; transform: translateX(-50%); font-size: 146px; z-index: 5; pointer-events: none; }
      .pc-abertura-flores { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; z-index: 2; pointer-events: none; }
      /* flores de ipê caindo devagar, só em faixas livres (nascem abaixo do logo e nunca passam na frente de nada) */
      .pc-abertura-florcai { position: absolute; top: 196px; width: 40px; height: 40px; opacity: 0; animation: pcAberturaCai 16s linear infinite; }
      .pc-abertura-florcai svg { width: 100%; height: 100%; display: block; }
      @keyframes pcAberturaCai {
        0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0; }
        7% { opacity: .95; }
        30% { transform: translate(38px, 160px) rotate(120deg) scale(1); }
        55% { transform: translate(-22px, 330px) rotate(240deg) scale(1); }
        78% { transform: translate(30px, 500px) rotate(350deg) scale(1); opacity: .95; }
        88% { transform: translate(22px, 568px) rotate(380deg) scale(.9); opacity: .9; }
        95%, 100% { transform: translate(20px, 580px) rotate(390deg) scale(.3); opacity: 0; }
      }
      .pc-abertura-pipoca { position: absolute; left: 130px; top: 318px; width: 450px; height: 486px; z-index: 6; cursor: pointer; touch-action: manipulation; }
      .pc-abertura-corpo { width: 100%; height: 100%; transform-origin: 50% 97%; animation: pcAberturaRespira 2.8s ease-in-out infinite; }
      .pc-abertura-corpo svg { width: 100%; height: 100%; display: block; overflow: visible; }
      @keyframes pcAberturaRespira { 50% { transform: scale(1.018, .982); } }
      .botao-grande.pc-abertura-jogar { position: absolute; left: 812px; top: 468px; height: 184px; padding: 0 86px 0 66px; border-radius: 92px; gap: 24px;
        font-size: 86px; z-index: 7; box-shadow: 0 12px 0 var(--tinta); }
      .botao-grande.pc-abertura-jogar svg { width: 98px; height: 98px; }
      .pc-abertura-pais { position: absolute; right: 10px; top: 4px; width: 152px; height: 152px; display: grid; place-items: center; z-index: 8;
        cursor: pointer; touch-action: manipulation; }
      .pc-abertura-pais .botao-icone { width: 92px; height: 92px; pointer-events: none; }
      .pc-abertura-pais .botao-icone svg { width: 54px; height: 54px; }
      .pc-abertura-pais.apertado .botao-icone { transform: translateY(5px); box-shadow: 0 2px 0 var(--tinta); }
      .pc-abertura-aviso { position: absolute; right: 26px; top: 196px; padding: 14px 26px 16px; border-radius: 24px; z-index: 8;
        background: var(--tinta); color: #fff; font: 600 34px/1.22 var(--fonte); text-align: right; pointer-events: none; }
      .pc-abertura-aviso span { display: block; white-space: nowrap; }
      .pc-abertura-aviso::before { content: ''; position: absolute; right: 62px; top: -34px; border: 18px solid transparent; border-top: 0;
        border-bottom: 36px solid var(--tinta); }
      .pc-abertura-balao { position: absolute; left: 548px; top: 222px; width: max-content; max-width: 620px; padding: 16px 28px 18px; z-index: 9;
        background: var(--papel); border: 5px solid var(--tinta); border-radius: 32px; box-shadow: 0 6px 0 rgba(58, 42, 90, .18);
        font: 600 36px/1.22 var(--fonte); color: var(--tinta); pointer-events: none; transform-origin: 8% 100%; }
      .pc-abertura-balao::after { content: ''; position: absolute; left: 14px; bottom: -21px; width: 32px; height: 32px; background: var(--papel);
        border-right: 5px solid var(--tinta); border-bottom: 5px solid var(--tinta); transform: rotate(62deg) skew(14deg, 14deg); border-radius: 0 0 6px 0; }
      .pc-abertura-balao.mostra { animation: pcAberturaBalao .3s cubic-bezier(.3, 1.6, .5, 1) both; }
      /* com o aviso da voz aberto embaixo do cadeado, o balão fica mais estreito para não encostar nele */
      .pc-abertura-balao.pc-abertura-estreito { max-width: 500px; }
      @keyframes pcAberturaBalao { from { transform: scale(.4); opacity: 0; } }
    `);
  }

  PC.telas.registrar('abertura', {
    voltarPara: null,          // na abertura, o voltar do Android fecha o app (o sistema cuida)
    criar(raiz) {
      estilo();
      let vivo = true;
      const timers = [];
      const depois = (ms, fn) => { const t = setTimeout(() => { if (vivo) fn(); }, U.duracao(ms)); timers.push(t); return t; };

      // o prado sem o sol: no céu da abertura a estrela é o logo (e o canto do cadeado fica limpo)
      raiz.appendChild(PC.arte.cenario('prado', { sol: false }));

      // flores de ipê caindo devagar (só enfeite; anima só transform e opacity). Faixas livres: a beirada esquerda,
      // o vão entre a Pipoca e o botão Jogar e a direita do botão.
      const flores = U.el('div', { class: 'pc-abertura-flores', 'aria-hidden': 'true' });
      [[44, 6, 18], [668, 1, 15], [1452, 10, 17]].forEach(([x, atraso, dur]) => {
        flores.appendChild(U.el('div', { class: 'pc-abertura-florcai', html: PC.arte.flor(),
          style: `left:${x}px;animation-duration:${dur}s;animation-delay:-${atraso}s` }));
      });

      const logo = U.el('h1', { class: 'logo pc-abertura-logo', html: PC.arte.logo(), 'aria-label': 'Pipoca Aprende' });

      // ------------------------------------------------------------ a Pipoca (tocar: ela se apresenta)
      const pip = U.el('div', { class: 'pc-abertura-pipoca', teste: 'pipoca', role: 'button', tabindex: '0', 'aria-label': 'Pipoca, a macaquinha' });
      const corpo = U.el('div', { class: 'pc-abertura-corpo' });
      pip.appendChild(corpo);
      let pose = '';
      const posar = nome => { if (nome !== pose) { pose = nome; corpo.innerHTML = PC.arte.pipoca(nome); } };
      posar('acena');

      const balao = U.el('div', { class: 'pc-abertura-balao', hidden: true });
      let falaSeq = 0, timerBalao = 0;
      /** A Pipoca fala com balão e boca mexendo; volta a acenar no fim. Resolve com o resultado de PC.voz.falar. */
      function dizer(texto, poseFala) {
        const meu = ++falaSeq;
        clearTimeout(timerBalao);
        posar(poseFala);
        balao.textContent = texto;
        balao.hidden = false;
        balao.classList.remove('mostra'); void balao.offsetWidth; balao.classList.add('mostra');
        pip.classList.add('falando');
        // sem voz no aparelho, o balão fica um tempinho para o adulto ler
        const leitura = U.esperar(1200 + texto.length * 40);
        return Promise.all([PC.voz.falar(texto), leitura]).then(([r]) => {
          if (vivo && meu === falaSeq) {
            pip.classList.remove('falando');
            posar('acena');
            timerBalao = depois(700, () => { if (meu === falaSeq) balao.hidden = true; });
          }
          return r;
        });
      }
      function calar() {
        falaSeq++;
        clearTimeout(timerBalao);
        balao.hidden = true;
        pip.classList.remove('falando');
        posar('acena');
      }

      const pular = () => U.animar(pip, [
        { transform: 'translateY(0) scale(1, 1)' }, { transform: 'translateY(-46px) scale(.97, 1.04)', offset: 0.35 },
        { transform: 'translateY(0) scale(1.05, .95)', offset: 0.7 }, { transform: 'translateY(0) scale(1, 1)' },
      ], { duration: 560, easing: 'ease-out' });

      let apresentando = false, falouJogar = false, tocou = false;
      function apresentar() {
        if (!vivo) return;
        pular();
        if (apresentando) return;                  // toques repetidos durante a fala: só o pulinho
        apresentando = true;
        dizer(FALA_OI, 'feliz').then(r => {
          apresentando = false;
          if (vivo && r !== 'interrompida' && !falouJogar) falarJogar();
        });
      }
      PC.aoTocar(pip, apresentar, { som: false });

      // ------------------------------------------------------------ botão Jogar
      const jogar = PC.ui.botaoGrande('Jogar', () => {
        if (!vivo) return;
        PC.som.iniciar();
        PC.telas.ir('mapa', {});
      }, { icone: 'play', cor: '#5CC84A' });
      jogar.classList.add('pc-abertura-jogar', 'toque-pulsa');
      jogar.dataset.teste = 'jogar';

      // o portão dos adultos abre por cima da abertura, dentro desta tela
      const portaoNaFrente = () => { try { return !!(PC.portao && PC.portao.aberto && PC.portao.aberto()); } catch (e) { return false; } };

      function falarJogar() {
        if (falouJogar || !vivo) return;
        if (portaoNaFrente()) { tocou = false; return; }   // um adulto está no portão: o pedido espera o próximo toque
        falouJogar = true;
        dizer(FALA_JOGAR, 'aponta');
        depois(500, () => U.animar(jogar, [
          { transform: 'scale(1) rotate(0deg)' }, { transform: 'scale(1.14) rotate(-3deg)', offset: 0.25 },
          { transform: 'scale(1.14) rotate(3deg)', offset: 0.5 }, { transform: 'scale(1.1) rotate(-2deg)', offset: 0.75 },
          { transform: 'scale(1) rotate(0deg)' },
        ], { duration: 900, easing: 'ease-in-out' }));
      }

      // ------------------------------------------------------------ cadeado dos adultos (portão antes da área dos pais)
      const pais = U.el('div', { class: 'pc-abertura-pais', teste: 'pais', role: 'button', tabindex: '0', 'aria-label': 'Área dos pais (para adultos)' },
        U.el('div', { class: 'botao-icone', 'aria-hidden': 'true', html: PC.arte.icone('cadeado') }));
      let portaoAberto = false;
      PC.aoTocar(pais, () => {
        if (portaoAberto || !vivo) return;
        portaoAberto = true;
        calar();
        PC.voz.parar();
        let pedido;
        try { pedido = PC.portao.pedir(); } catch (e) { console.error(e); pedido = Promise.resolve(false); }
        // se o adulto cortou a apresentação (ou o pedido) antes do "Toque no botão verde", o pedido fica para o
        // próximo toque da criança depois que o portão fechar
        const liberarPedido = () => { if (!falouJogar) tocou = false; };
        Promise.resolve(pedido).then(ok => {
          portaoAberto = false;
          liberarPedido();
          if (ok && vivo) PC.telas.ir('pais');
        }, e => { portaoAberto = false; liberarPedido(); console.error(e); });
      });

      // ------------------------------------------------------------ aviso de voz (só no app)
      // duas linhas: "Falta a voz em português:" / "toque no cadeado"
      const partes = AVISO_VOZ.split(': ');
      const aviso = U.el('div', { class: 'pc-abertura-aviso', role: 'note', hidden: true, 'aria-label': AVISO_VOZ },
        U.el('span', { text: partes[0] + ':' }), U.el('span', { text: partes.slice(1).join(': ') }));
      let esperouVoz = false;
      function conferirVoz() {
        if (!vivo) return;
        let falta = false;
        try {
          if (PC.nativo.disponivel() && !PC.voz.disponivel()) {
            const motivo = PC.voz.motivo ? PC.voz.motivo() : '';
            falta = motivo !== 'iniciando' || esperouVoz;     // a voz do aparelho ainda pode estar ligando
          }
        } catch (e) { console.error(e); }
        aviso.hidden = !falta;
        balao.classList.toggle('pc-abertura-estreito', falta);
      }
      const offVoz = PC.voz.aoMudar(conferirVoz);
      conferirVoz();
      depois(8000, () => { esperouVoz = true; conferirVoz(); });

      // ------------------------------------------------------------ primeiro toque: pede o Jogar uma vez
      // Toques de adulto (no cadeado e no portão aberto por cima) não contam: o pedido fica para o toque da criança.
      function primeiroToque(ev) {
        if (tocou || !vivo || portaoNaFrente()) return;
        const alvo = ev.target && ev.target.closest ? ev.target.closest('[data-teste]') : null;
        const nome = alvo ? alvo.dataset.teste : '';
        if (nome === 'pais') return;
        tocou = true;
        if (nome === 'jogar') { falouJogar = true; return; }
        if (nome === 'pipoca') {
          // a apresentação pede o Jogar no fim; se o toque não virou apresentação (dedo escorregou), pede assim mesmo
          depois(900, () => { if (!apresentando && !falouJogar) falarJogar(); });
          return;
        }
        falarJogar();
      }
      raiz.addEventListener('pointerdown', primeiroToque, true);

      raiz.append(flores, logo, pip, jogar, pais, aviso, balao);

      return {
        destruir() {
          if (!vivo) return;
          vivo = false;
          timers.forEach(clearTimeout);
          clearTimeout(timerBalao);
          offVoz();
          raiz.removeEventListener('pointerdown', primeiroToque, true);
        },
        /** Para testes: o que a abertura está mostrando. */
        estado() {
          return { pose, falando: pip.classList.contains('falando'), balao: balao.hidden ? '' : balao.textContent,
            pediuJogar: falouJogar, avisoVoz: !aviso.hidden };
        },
      };
    },
  });
})();
