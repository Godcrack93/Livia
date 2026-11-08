/* Pipoca Aprende — telas dos adultos (PROJETO.md 4, itens 7, 8 e 10):
     "pais"        área dos pais (aberta depois do portão): assinatura, voz e sons, supervisão (tempo de uso, limite
                   diário, esconder ofertas), progresso por estação (e zerar, com confirmação dupla), privacidade,
                   créditos e licenças, versão.
     "assinatura"  paywall, aberto só pela área dos pais: preço e condições sempre vindos do Google Play.
     "descanso"    limite diário atingido: a Pipoca boceja e se despede; só um adulto (portão) libera mais tempo hoje.
   Textos para adultos com no mínimo 34 px virtuais. Falas (sempre da Pipoca): a despedida do descanso (uma vez só)
   e, na área dos pais, o exemplo de voz quando o adulto muda o volume ou a velocidade ou toca em "Ouvir a Pipoca".
   A área dos pais e o paywall voltam sozinhos para a abertura depois de 3 minutos sem toque (com o app visível):
   um adulto que esquece a área aberta não deixa compras e ajustes ao alcance da criança.
   A lista da área dos pais rola na vertical com PC.arrastar (inércia); os toques nos botões de dentro dela são
   decididos pela própria rolagem (toque = soltar sem arrastar). Em telas mais altas que 16:9 (tablets), a lista
   cresce para dentro da sobra em cima e embaixo do palco.
   Testes (só no navegador): PC.debug.rolarAte('<data-teste>') rola a lista até um botão; no descanso, o passo
   {"gesto": true} toca no cadeado dos adultos (e, com o portão aberto, nas teclas certas). */
(function () {
  'use strict';
  const PC = window.PC, U = PC.util;
  const T = '#3A2A5A';
  const INATIVO_MS = 180000;          // área dos pais / paywall sem toque: volta para a abertura
  let rolagemGuardada = 0;            // posição da lista ao ir para o paywall (volta no mesmo lugar)

  U.estilo('pais', `
    /* ---------- fundo calmo das telas dos adultos ---------- */
    .pc-pais-fundo { position: absolute; left: -1200px; top: -700px; width: 4000px; height: 2300px; pointer-events: none;
      background: linear-gradient(180deg, #E4DEF7 0px, #ECE7FA 700px, #FFF8EC 1600px, #FFF8EC 2300px); }

    /* ---------- topo ---------- */
    .pc-pais-topo { position: absolute; left: 0; top: 0; width: 1600px; height: 140px; z-index: 20; }
    .pc-pais-redondo { position: absolute; width: 140px; height: 140px; padding: 0; border: 0; background: transparent; cursor: pointer;
      display: grid; place-items: center; }
    .pc-pais-redondo > span { width: 104px; height: 104px; border-radius: 50%; background: #fff; border: 5px solid var(--tinta);
      box-shadow: 0 6px 0 var(--tinta); display: grid; place-items: center; transition: transform .07s, box-shadow .07s; }
    .pc-pais-redondo svg { width: 60px; height: 60px; display: block; }
    .pc-pais-redondo.grande > span { width: 118px; height: 118px; border-width: 6px; box-shadow: 0 7px 0 var(--tinta); }
    .pc-pais-redondo.grande svg { width: 72px; height: 72px; }
    .pc-pais-redondo.apertado > span { transform: translateY(5px); box-shadow: 0 1px 0 var(--tinta); }
    .pc-pais-titulo { position: absolute; left: 186px; top: 36px; margin: 0; font: 700 62px/1.1 var(--fonte); color: var(--tinta); white-space: nowrap; }
    .pc-pais-selo { position: absolute; right: 48px; top: 40px; height: 64px; padding: 0 26px; border-radius: 32px; display: flex; align-items: center;
      background: #E3F6DE; border: 4px solid #7CC66F; font: 600 34px/1 var(--fonte); color: #24561C; white-space: nowrap; }

    /* ---------- lista que rola ---------- */
    .pc-pais-rolagem { position: absolute; left: 0; top: 140px; width: 1600px; height: 760px; overflow: hidden; z-index: 10; }
    .pc-pais-conteudo { position: absolute; left: 160px; top: 0; width: 1280px; padding: 4px 0 90px; }
    .pc-pais-trilho { position: absolute; left: 1490px; top: 20px; width: 14px; height: 720px; border-radius: 7px; background: rgba(58, 42, 90, .10); pointer-events: none; }
    .pc-pais-polegar { position: absolute; left: 0; top: 0; width: 14px; height: 80px; border-radius: 7px; background: rgba(58, 42, 90, .40); }
    .pc-pais-sombra { position: absolute; left: 0; bottom: 0; width: 1600px; height: 60px; pointer-events: none;
      background: linear-gradient(180deg, rgba(255, 248, 236, 0), #FFF8EC); }
    .pc-pais-sombra-topo { position: absolute; left: 0; top: 0; width: 1600px; height: 34px; pointer-events: none;
      background: linear-gradient(180deg, #EFEAF8, rgba(239, 234, 248, 0)); }

    /* ---------- faixa "falta a voz" (no alto da lista) ---------- */
    .pc-pais-faixa-voz { display: flex; align-items: center; gap: 28px; margin: 0 0 26px; padding: 22px 26px 22px 32px; border-radius: 32px;
      background: #FFF1CC; border: 4px solid #E5B23A; }
    .pc-pais-faixa-voz > p { flex: 1; margin: 0; font: 600 36px/1.3 var(--fonte); color: #5A4300; }
    .pc-pais-faixa-voz > .pc-pais-botao { flex: none; }

    /* ---------- índice ---------- */
    .pc-pais-indice { display: flex; flex-wrap: wrap; gap: 14px; margin: 0 0 26px; }
    .pc-pais-indice .pc-pais-botao { min-height: 100px; padding: 10px 30px; font-size: 34px; box-shadow: 0 4px 0 rgba(58, 42, 90, .3); border-width: 3px; }

    /* ---------- cartões ---------- */
    .pc-pais-cartao { margin: 0 0 28px; padding: 34px 44px 40px; border-radius: 36px; background: #fff; border: 4px solid #D8CFEE;
      box-shadow: 0 6px 0 rgba(58, 42, 90, .10); }
    .pc-pais-cartao > h2 { margin: 0 0 22px; font: 700 48px/1.15 var(--fonte); color: var(--tinta); }
    .pc-pais-texto { margin: 0 0 16px; font: 500 36px/1.35 var(--fonte); color: var(--tinta); }
    .pc-pais-nota { margin: 18px 0 0; font: 500 34px/1.35 var(--fonte); color: var(--tinta-suave); }
    .pc-pais-nota.ok { color: #2F7A26; font-weight: 600; }
    .pc-pais-nota.ruim { color: #A8281F; font-weight: 600; }
    .pc-pais-aviso { margin: 0 0 18px; padding: 20px 28px; border-radius: 24px; background: #FFF1CC; border: 4px solid #E5B23A;
      font: 600 36px/1.3 var(--fonte); color: #5A4300; }
    .pc-pais-aviso.info { background: #E6F1FF; border-color: #7DB0E6; color: #1C4570; }
    .pc-pais-aviso.ok { background: #E3F6DE; border-color: #7CC66F; color: #24561C; }
    .pc-pais-aviso.ruim { background: #FFE6E2; border-color: #E0796B; color: #7A1E14; }
    .pc-pais-estado { display: flex; align-items: center; gap: 18px; margin: 0 0 12px; font: 700 42px/1.2 var(--fonte); color: var(--tinta); }
    .pc-pais-estado > i { width: 32px; height: 32px; flex: none; border-radius: 50%; border: 4px solid var(--tinta); background: #CFC8E0; }
    .pc-pais-estado.ativa > i { background: #5CC84A; }
    .pc-pais-estado.pendente > i { background: #FFC93C; }
    .pc-pais-estado.indisponivel > i { background: #FF7A6B; }
    .pc-pais-estado.carregando > i { animation: pcPaisPisca 1s ease-in-out infinite; }
    @keyframes pcPaisPisca { 50% { opacity: .3; } }

    /* ---------- botões ---------- */
    .pc-pais-botoes { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; margin-top: 26px; }
    .pc-pais-botoes.fim { justify-content: flex-end; }
    .pc-pais-botao { position: relative; min-width: 150px; min-height: 112px; padding: 14px 40px; border-radius: 56px; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 14px; text-align: center;
      font: 600 36px/1.15 var(--fonte); color: var(--tinta); background: #fff; border: 4px solid var(--tinta); box-shadow: 0 6px 0 var(--tinta);
      transition: transform .07s, box-shadow .07s; }
    .pc-pais-botao svg { width: 48px; height: 48px; flex: none; }
    .pc-pais-botao.apertado { transform: translateY(5px); box-shadow: 0 1px 0 var(--tinta); }
    .pc-pais-botao.principal { background: #2F8A38; color: #fff; font-weight: 700; }
    .pc-pais-botao.perigo { background: #C2352A; color: #fff; font-weight: 700; }
    .pc-pais-botao.discreto { background: transparent; box-shadow: none; border: 4px dashed #B3A7D6; font-weight: 500; }
    .pc-pais-botao.discreto.apertado { transform: none; background: rgba(58, 42, 90, .07); }
    .pc-pais-botao[disabled] { opacity: .5; cursor: default; }
    .pc-pais-botao[disabled].apertado { transform: none; }

    /* ---------- interruptor (linha inteira é o alvo) ---------- */
    .pc-pais-linha { display: flex; align-items: center; gap: 26px; width: 100%; min-height: 120px; margin: 0; padding: 18px 0;
      border: 0; border-top: 3px solid #EEE8F8; background: transparent; text-align: left; cursor: pointer; color: var(--tinta); }
    .pc-pais-linha.sem-borda { border-top: 0; }
    .pc-pais-linha-rotulo { flex: 1; font: 600 38px/1.25 var(--fonte); }
    .pc-pais-linha-rotulo small { display: block; margin-top: 6px; font: 500 34px/1.3 var(--fonte); color: var(--tinta-suave); }
    .pc-pais-linha-estado { flex: none; width: 170px; text-align: right; font: 600 34px/1 var(--fonte); color: var(--tinta-suave); }
    .pc-pais-chave { position: relative; flex: none; width: 120px; height: 66px; border-radius: 33px; background: #CFC8E0;
      border: 4px solid var(--tinta); transition: background-color .15s; }
    .pc-pais-chave::after { content: ''; position: absolute; left: 6px; top: 6px; width: 46px; height: 46px; border-radius: 50%;
      background: #fff; border: 4px solid var(--tinta); transition: transform .15s; }
    .pc-pais-linha.ligada .pc-pais-chave { background: #3E9A30; }
    .pc-pais-linha.ligada .pc-pais-chave::after { transform: translateX(54px); }
    .pc-pais-linha.ligada .pc-pais-linha-estado { color: #2F7A26; }

    /* ---------- escolha entre opções ---------- */
    .pc-pais-rotulo { margin: 26px 0 16px; font: 600 38px/1.25 var(--fonte); color: var(--tinta); }
    .pc-pais-segmentos { display: flex; flex-wrap: wrap; gap: 14px; }
    .pc-pais-seg { min-width: 150px; height: 108px; padding: 0 30px; border-radius: 54px; cursor: pointer; border: 4px solid var(--tinta);
      background: #fff; font: 600 36px/1 var(--fonte); color: var(--tinta); box-shadow: 0 5px 0 rgba(58, 42, 90, .3); transition: transform .07s; }
    .pc-pais-seg.escolhido { background: var(--tinta); color: #fff; }
    .pc-pais-seg.apertado { transform: translateY(4px); box-shadow: none; }

    /* ---------- números e tabela ---------- */
    .pc-pais-numeros { display: flex; gap: 20px; margin: 0 0 6px; }
    .pc-pais-numero { flex: 1; padding: 18px 26px 20px; border-radius: 26px; background: #F4F0FC; }
    .pc-pais-numero b { display: block; font: 700 54px/1.1 var(--fonte); color: var(--tinta); }
    .pc-pais-numero span { font: 500 34px/1.25 var(--fonte); color: var(--tinta-suave); }
    .pc-pais-tabela { width: 100%; margin: 22px 0 0; border-collapse: collapse; font: 500 34px/1.25 var(--fonte); color: var(--tinta); }
    .pc-pais-tabela th { padding: 10px 12px; text-align: left; font-weight: 700; border-bottom: 4px solid #D8CFEE; white-space: nowrap; }
    .pc-pais-tabela td { padding: 11px 12px; border-bottom: 2px solid #EEE8F8; }
    .pc-pais-tabela .num { text-align: right; white-space: nowrap; }
    .pc-pais-tabela .feita { color: #2F7A26; font-weight: 700; }

    /* ---------- janelas (confirmação, código) ---------- */
    .pc-pais-modal { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; z-index: 70; }
    .pc-pais-modal-veu { position: absolute; left: -1200px; top: -700px; width: 4000px; height: 2300px; background: rgba(38, 27, 62, .62);
      animation: pcPaisVeu .2s ease both; }
    @keyframes pcPaisVeu { from { opacity: 0; } }
    .pc-pais-modal-caixa { position: absolute; left: 200px; top: 150px; width: 1200px; padding: 44px 54px 46px; border-radius: 40px;
      background: #fff; border: 5px solid var(--tinta); box-shadow: 0 12px 0 var(--tinta); animation: pcPaisCaixa .28s cubic-bezier(.3, 1.3, .5, 1) both; }
    @keyframes pcPaisCaixa { from { transform: translateY(30px) scale(.96); opacity: 0; } }
    .pc-pais-modal-caixa > h2 { margin: 0 0 18px; font: 700 52px/1.15 var(--fonte); color: var(--tinta); }
    .pc-pais-campo-linha { display: flex; gap: 20px; align-items: center; margin-top: 10px; }
    .pc-pais-campo { flex: 1; min-width: 0; height: 100px; padding: 0 28px; border-radius: 26px; border: 4px solid var(--tinta); background: #FBF9FF;
      font: 600 42px/1 var(--fonte); color: var(--tinta); letter-spacing: .04em; -webkit-user-select: text; user-select: text; outline: none; }
    .pc-pais-campo:focus { border-color: #6C4FD8; box-shadow: 0 0 0 6px rgba(108, 79, 216, .2); }

    /* ---------- paywall ---------- */
    .pc-pais-assin { position: absolute; left: 110px; top: 30px; width: 1290px; height: 840px; padding: 44px 64px 46px; border-radius: 44px;
      background: #fff; border: 5px solid var(--tinta); box-shadow: 0 12px 0 rgba(58, 42, 90, .25); display: flex; flex-direction: column; }
    .pc-pais-assin-marca { margin: 0 0 6px; font: 600 34px/1.2 var(--fonte); color: var(--tinta-suave); }
    .pc-pais-assin-titulo { margin: 0 0 18px; font: 700 64px/1.1 var(--fonte); color: var(--tinta); }
    .pc-pais-assin-texto { margin: 0 0 12px; font: 500 36px/1.32 var(--fonte); color: var(--tinta); }
    .pc-pais-assin-texto.forte { font-weight: 700; }
    /* se o texto do Google Play não couber (preço longo, mensagem de erro), tudo fica um pouco mais compacto */
    .pc-pais-assin.compacto .pc-pais-assin-titulo { margin-bottom: 10px; font-size: 56px; }
    .pc-pais-assin.compacto .pc-pais-assin-texto { margin-bottom: 8px; font-size: 34px; line-height: 1.26; }
    .pc-pais-assin.compacto .pc-pais-assin-libera { padding: 14px 26px; }
    .pc-pais-assin.compacto .pc-pais-botoes { padding-top: 14px; }
    .pc-pais-assin-libera { margin: 10px 0 0; padding: 22px 30px; border-radius: 28px; background: #F4F0FC; }
    .pc-pais-assin-libera p { margin: 0 0 10px; font: 700 36px/1.2 var(--fonte); color: var(--tinta); }
    .pc-pais-assin-libera ul { display: flex; flex-wrap: wrap; gap: 8px 44px; margin: 0; padding: 0; list-style: none; }
    .pc-pais-assin-libera li { display: flex; align-items: center; gap: 14px; font: 500 36px/1.25 var(--fonte); color: var(--tinta); }
    .pc-pais-assin-libera li i { width: 44px; height: 44px; flex: none; border-radius: 50%; background: #3E9A30; border: 4px solid var(--tinta);
      display: grid; place-items: center; }
    .pc-pais-assin-libera li svg { width: 28px; height: 28px; display: block; }
    .pc-pais-assin .pc-pais-aviso { margin: 12px 0 0; }
    .pc-pais-assin .pc-pais-botoes { margin-top: auto; padding-top: 24px; }
    .pc-pais-assin .pc-pais-botao.principal { min-height: 124px; padding: 16px 56px; font-size: 44px; border-width: 5px; box-shadow: 0 8px 0 var(--tinta); }
    /* desligado (sem preço, pendente, indisponível, carregando): o texto é o recado para o adulto, então fica legível
       (cinza-lilás com letra escura, sem a transparência que apagava o branco sobre o verde) */
    .pc-pais-assin .pc-pais-botao.principal[disabled] { padding: 16px 40px; font-size: 38px; opacity: 1; background: #ECE7F7;
      color: var(--tinta-suave); border-color: #B3A7D6; box-shadow: 0 8px 0 #B3A7D6; }
    .pc-pais-giro { display: inline-block; width: 40px; height: 40px; margin-right: 18px; vertical-align: -6px; border-radius: 50%;
      border: 6px solid #D8CFEE; border-top-color: var(--tinta); animation: pcPaisGira .9s linear infinite; }
    @keyframes pcPaisGira { to { transform: rotate(360deg); } }
    .pc-pais-assin.sucesso { align-items: center; justify-content: center; text-align: center; }
    .pc-pais-assin-ok { width: 190px; height: 190px; margin-bottom: 34px; border-radius: 50%; background: #3E9A30; border: 7px solid var(--tinta);
      box-shadow: 0 10px 0 var(--tinta); display: grid; place-items: center; animation: pcPaisOk .5s cubic-bezier(.3, 1.6, .5, 1) both; }
    .pc-pais-assin-ok svg { width: 130px; height: 130px; display: block; }
    @keyframes pcPaisOk { from { transform: scale(.3); opacity: 0; } }

    /* ---------- descanso ---------- */
    .pc-pais-desc-pipoca { position: absolute; left: 616px; top: 420px; width: 368px; height: 397px; transform-origin: 50% 100%; cursor: pointer;
      animation: pcDescRespira 3.8s ease-in-out infinite; }
    .pc-pais-desc-pipoca svg { width: 100%; height: 100%; display: block; overflow: visible; }
    @keyframes pcDescRespira { 50% { transform: scale(1.018, .986); } }
    .pc-pais-desc-pipoca .pip-olhos { display: none; }
    .pc-pais-desc-bocejo { opacity: 0; }
    .pc-pais-desc-pipoca .pip-cabeca { transform-box: view-box; transform-origin: 125px 168px; transition: transform .5s ease-in-out; }
    .pc-pais-desc-pipoca.bocejando { animation: pcDescEspreguica 2s ease-in-out; }
    @keyframes pcDescEspreguica { 0%, 100% { transform: none; } 30%, 70% { transform: scale(.975, 1.05); } }
    .pc-pais-desc-pipoca.bocejando .pip-cabeca { transform: rotate(-5deg); }
    .pc-pais-desc-pipoca.bocejando .pc-pais-desc-bocejo { opacity: 1; }
    .pc-pais-desc-pipoca.bocejando .pip-boca-fechada, .pc-pais-desc-pipoca.bocejando .pip-boca-aberta { opacity: 0; animation: none; }
    .pc-pais-desc-zs span { position: absolute; font: 700 70px/1 var(--fonte); color: #fff; -webkit-text-stroke: 4px var(--tinta); paint-order: stroke fill;
      opacity: 0; animation: pcDescZ 4.2s ease-out infinite; pointer-events: none; }
    .pc-pais-desc-zs span:nth-child(1) { left: 610px; top: 470px; }
    .pc-pais-desc-zs span:nth-child(2) { left: 586px; top: 430px; font-size: 56px; animation-delay: 1.4s; }
    .pc-pais-desc-zs span:nth-child(3) { left: 600px; top: 450px; font-size: 46px; animation-delay: 2.8s; }
    @keyframes pcDescZ { 0% { opacity: 0; transform: translate(0, 0) scale(.6); } 18% { opacity: 1; } 100% { opacity: 0; transform: translate(-90px, -190px) scale(1.2); } }
    .pc-pais-desc-balao { position: absolute; left: 1010px; top: 310px; width: max-content; max-width: 560px; padding: 26px 40px 30px; border-radius: 40px;
      background: #fff; border: 5px solid var(--tinta); box-shadow: 0 8px 0 rgba(38, 27, 62, .35); font: 700 50px/1.2 var(--fonte); color: var(--tinta);
      transform-origin: 0 100%; }
    .pc-pais-desc-balao > span { display: block; white-space: nowrap; }
    .pc-pais-desc-balao::after { content: ''; position: absolute; left: -22px; bottom: 54px; width: 40px; height: 40px; background: #fff;
      border-left: 5px solid var(--tinta); border-bottom: 5px solid var(--tinta); transform: rotate(45deg); border-radius: 0 0 0 8px; }
    .pc-pais-desc-balao.mostra { animation: balaoMostra .35s cubic-bezier(.3, 1.6, .5, 1) both; }
    .pc-pais-desc-adulto > span { width: 88px; height: 88px; background: rgba(255, 255, 255, .92); border-width: 5px; box-shadow: 0 5px 0 var(--tinta); }
    .pc-pais-desc-adulto svg { width: 52px; height: 52px; }
  `);

  // ---------------------------------------------------------------- utilidades
  const fundo = () => U.el('div', { class: 'pc-pais-fundo' });
  /** Só no navegador de verdade (sem app e sem ponte, nem a falsa): mostra a simulação de assinatura. */
  const navegadorPuro = () => !PC.modoApp && !PC.nativo.disponivel();
  const salvarAjustes = () => PC.dados.salvarAjustes();
  /** Ações que abrem algo fora do jogo (Google Play, navegador, ajustes do aparelho): cada uma no máximo uma vez a
      cada 1,5 s, mesmo que a seção tenha sido redesenhada entre dois toques (toque duplo não abre duas vezes). */
  const externoEm = {};
  function podeAbrirFora(acao) {
    const agora = performance.now();
    if (agora - (externoEm[acao] || -1e9) < 1500) return false;
    externoEm[acao] = agora;
    return true;
  }

  /** Troca de tela; se o pedido cair numa transição, tenta de novo um pouco depois (enquanto aindaVale()). */
  function irSeguro(id, params, aindaVale, tentativas) {
    if (tentativas == null) tentativas = 12;
    PC.telas.ir(id, params || {}).then(ok => {
      if (ok === false && tentativas > 0 && (!aindaVale || aindaVale())) setTimeout(() => irSeguro(id, params, aindaVale, tentativas - 1), 150);
    });
  }

  /** 125 s → "2 min"; 4000 s → "1 h 6 min". */
  function formatarTempo(seg) {
    seg = Math.max(0, Math.round(Number(seg) || 0));
    if (seg < 60) return seg > 0 ? 'menos de 1 min' : '0 min';
    const min = Math.floor(seg / 60);
    if (min < 60) return min + ' min';
    const h = Math.floor(min / 60), m = min % 60;
    return h + ' h' + (m ? ' ' + m + ' min' : '');
  }

  /** Nome da brincadeira de uma estação, para os adultos. */
  function nomeEstacao(f) {
    const p = f.params || {};
    switch (f.atividade) {
      case 'torre': return p.modo === 'comparar' ? 'Torre: comparar' : (p.dezenaPronta ? 'Torre: dezena e unidades' : 'Torre de cubinhos');
      case 'pintinhos': return 'Pintinhos: ' + ({ olhadinha: 'olhadinha', comparar: 'comparar' }[p.modo] || 'contar');
      case 'tracar': return Array.isArray(p.digitos) ? 'Traçar ' + p.digitos.join(', ').replace(/, (\d+)$/, ' e $1') : 'Traçar números';
      case 'juntar': return p.alvoMin === 10 && p.alvoMax === 10 ? 'Juntar: amigos do 10' : 'Juntar (soma)';
      case 'separar': return p.dezena ? 'Separar: com dezena' : 'Separar (subtração)';
      case 'feirinha': return p.modo === 'troco' ? 'Feirinha: troco' : 'Feirinha: comprar';
      case 'sapinho':
        if (p.passo === -1) return 'Sapinho: para trás';
        if (p.passo === 2) return 'Sapinho: de 2 em 2';
        if (p.passo === 10) return 'Sapinho: de 10 em 10';
        return 'Sapinho: sequência';
      default: { const d = PC.atividades.obter(f.atividade); return (d && d.titulo) || f.atividade; }
    }
  }

  /** Resumo do estado da assinatura para a área dos pais. */
  function resumoAssinatura(e) {
    if (e.ativa) {
      if (e.origem === 'revisao') return { classe: 'ativa', titulo: 'Acesso de revisão ativo', texto: 'Tudo liberado pelo código de acesso.' };
      if (e.origem === 'simulada') return { classe: 'ativa', titulo: 'Assinatura ativa (simulada)', texto: 'Simulação do navegador: todas as estações estão liberadas.' };
      return { classe: 'ativa', titulo: 'Assinatura ativa', texto: 'As 60 estações e o Brincar livre completo estão liberados.' };
    }
    if (e.carregando) return { classe: 'carregando', titulo: 'Consultando o Google Play…', texto: '' };
    if (e.pendente) return { classe: 'pendente', titulo: 'Compra aguardando pagamento ou aprovação', texto: 'Quando o Google Play confirmar, tudo é liberado sozinho.' };
    if (e.indisponivel) {
      return { classe: 'indisponivel', titulo: 'O Google Play não está disponível neste aparelho',
        texto: 'Isso acontece, por exemplo, quando o modo infantil do fabricante bloqueia a loja. As estações 1 a 4 continuam grátis.' };
    }
    return { classe: 'inativa', titulo: 'Sem assinatura',
      texto: 'Grátis: estações 1 a 4 e Brincar livre com até 2 torres. A assinatura libera as estações 5 a 60 e o Brincar livre completo.' };
  }

  /**
   * Mensagem para o adulto a partir do código de erro do Google Play ('' quando não há o que dizer).
   * Códigos do app (aplicativo/.../Cobranca.kt): play-indisponivel, sem-conexao, servico-sem-resposta, compra-cancelada,
   * item-already-owned, produto-nao-encontrado, pagamento-recusado, erro-play. Também entende os nomes do
   * BillingResponseCode (USER_CANCELED, SERVICE_UNAVAILABLE, BILLING_UNAVAILABLE...). A ordem importa:
   * SERVICE_UNAVAILABLE é o serviço que não respondeu, e não o Google Play bloqueado no aparelho.
   */
  function textoErro(e, { semPrecoJaAvisado = false } = {}) {
    const c = String(e.erro || '').toLowerCase();
    if (!c) return '';
    if (/cancel/.test(c)) return 'A compra foi cancelada. Nada foi cobrado.';
    if (/already|owned/.test(c)) return 'Esta conta do Google já tem a assinatura. Toque em Restaurar compra.';
    if (/recusad|declined|pagamento/.test(c)) return 'O pagamento não foi aprovado. Confira a forma de pagamento no Google Play.';
    if (/conex|network|internet|offline/.test(c)) return semPrecoJaAvisado && !e.precoFormatado ? '' : 'Sem conexão com a internet. Confira e tente de novo.';
    if (/servic|serviç|timeout|disconnected|sem-resposta/.test(c)) return 'O Google Play não respondeu. Tente de novo daqui a pouco.';
    if (/produto|nao-encontrado|item_unavailable|item-unavailable/.test(c)) return 'O Google Play não encontrou a assinatura agora. Tente de novo mais tarde.';
    if (/indispon|unavailable/.test(c)) return e.indisponivel ? '' : 'O Google Play não está disponível neste aparelho.';
    return 'Não foi possível falar com o Google Play. Tente de novo.';
  }

  /** Volta para a abertura depois de INATIVO_MS sem toque (pausa com o app em segundo plano). Devolve desligar(). */
  function vigiarInatividade(raiz, aoEsgotar) {
    let ultimo = performance.now(), pausado = false;
    const marcar = () => { ultimo = performance.now(); };
    raiz.addEventListener('pointerdown', marcar, true);
    window.addEventListener('keydown', marcar, true);
    document.addEventListener('visibilitychange', marcar);
    const offs = [
      PC.on('nativo:pausa', () => { pausado = true; }),
      PC.on('nativo:retomar', () => { pausado = false; marcar(); }),
    ];
    const tic = setInterval(() => {
      if (pausado || document.hidden) { marcar(); return; }
      if (performance.now() - ultimo >= INATIVO_MS) { clearInterval(tic); aoEsgotar(); }
    }, 2000);
    return () => {
      clearInterval(tic);
      raiz.removeEventListener('pointerdown', marcar, true);
      window.removeEventListener('keydown', marcar, true);
      document.removeEventListener('visibilitychange', marcar);
      offs.forEach(f => f());
    };
  }

  // ---------------------------------------------------------------- botões e controles para adultos
  // Dentro da lista que rola, o toque é decidido pela rolagem (ver criarRolagem); fora dela, PC.aoTocar.
  const acoes = new WeakMap();

  /** Botão para adultos. tipo: 'principal' | 'secundario' | 'perigo' | 'discreto'. solto: fora da rolagem (PC.aoTocar). */
  function botao(texto, acao, { tipo = 'secundario', teste = null, icone = null, solto = false, desligado = false } = {}) {
    const b = U.el('button', { type: 'button', class: 'pc-pais-botao ' + tipo, teste, disabled: desligado || null });
    if (icone) b.insertAdjacentHTML('beforeend', PC.arte.icone(icone));
    b.appendChild(U.el('span', { text: texto }));
    if (solto) PC.aoTocar(b, acao); else acoes.set(b, acao);
    return b;
  }

  /** Botão redondo com ícone (alvo de 140 px). */
  function redondo(icone, rotulo, acao, { teste, grande = false, classe = '' } = {}) {
    const b = U.el('button', { type: 'button', class: 'pc-pais-redondo' + (grande ? ' grande' : '') + (classe ? ' ' + classe : ''), teste, 'aria-label': rotulo, title: rotulo },
      U.el('span', { html: PC.arte.icone(icone) }));
    PC.aoTocar(b, acao);
    return b;
  }

  /** Linha liga/desliga (a linha inteira é o alvo). */
  function interruptor(rotulo, descricao, ligado, aoMudar, teste, { semBorda = false } = {}) {
    const estado = U.el('span', { class: 'pc-pais-linha-estado' });
    const l = U.el('button', { type: 'button', class: 'pc-pais-linha' + (semBorda ? ' sem-borda' : ''), role: 'switch', teste },
      U.el('span', { class: 'pc-pais-linha-rotulo' }, rotulo, descricao ? U.el('small', { text: descricao }) : null),
      estado, U.el('span', { class: 'pc-pais-chave', 'aria-hidden': 'true' }));
    const mostrar = v => {
      l.classList.toggle('ligada', v);
      l.setAttribute('aria-checked', v ? 'true' : 'false');
      estado.textContent = v ? 'Ligado' : 'Desligado';
    };
    mostrar(!!ligado);
    acoes.set(l, () => { const v = !l.classList.contains('ligada'); mostrar(v); aoMudar(v); });
    return l;
  }

  /** Escolha de uma opção entre várias (volume, limite diário). */
  function segmentado(opcoes, atual, aoEscolher) {
    const g = U.el('div', { class: 'pc-pais-segmentos', role: 'radiogroup' });
    opcoes.forEach(o => {
      const sim = o.valor === atual;
      const b = U.el('button', { type: 'button', class: 'pc-pais-seg' + (sim ? ' escolhido' : ''), role: 'radio', 'aria-checked': sim ? 'true' : 'false', teste: o.teste }, o.texto);
      acoes.set(b, () => {
        g.querySelectorAll('.pc-pais-seg').forEach(x => { x.classList.toggle('escolhido', x === b); x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
        aoEscolher(o.valor);
      });
      g.appendChild(b);
    });
    return g;
  }

  const numero = (valor, legenda) => U.el('div', { class: 'pc-pais-numero' }, U.el('b', { text: valor }), U.el('span', { text: legenda }));

  // ---------------------------------------------------------------- rolagem vertical (PC.arrastar, com inércia)
  function criarRolagem() {
    const vp = U.el('div', { class: 'pc-pais-rolagem' });
    const conteudo = U.el('div', { class: 'pc-pais-conteudo' });
    const polegar = U.el('i', { class: 'pc-pais-polegar' });
    const trilho = U.el('div', { class: 'pc-pais-trilho', 'aria-hidden': 'true' }, polegar);
    const sombra = U.el('div', { class: 'pc-pais-sombra' });
    const sombraTopo = U.el('div', { class: 'pc-pais-sombra-topo', hidden: true });
    vp.append(conteudo, trilho, sombra, sombraTopo);

    let y = 0, max = 0, altVp = 760, altConteudo = 0, y0 = 0, vel = 0, raf = 0, arrastando = false, pressionado = null, amostras = [];

    function aplicar() {
      conteudo.style.transform = 'translateY(' + (-y).toFixed(1) + 'px)';
      trilho.hidden = max <= 0;
      if (max > 0) {
        const th = Math.max(100, altVp - 40), ph = Math.max(70, th * altVp / Math.max(altVp, altConteudo));
        polegar.style.height = ph.toFixed(0) + 'px';
        polegar.style.transform = 'translateY(' + ((th - ph) * U.limitar(y / max, 0, 1)).toFixed(1) + 'px)';
      }
      sombra.hidden = y >= max - 2;
      sombraTopo.hidden = y <= 2;
    }
    function medir() {
      altVp = vp.clientHeight || 760;
      trilho.style.height = Math.max(100, altVp - 40) + 'px';
      altConteudo = conteudo.offsetHeight;
      max = Math.max(0, altConteudo - altVp);
      if (!arrastando && !raf) y = U.limitar(y, 0, max);
      aplicar();
    }
    function pararMovimento() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; vel = 0;
      conteudo.style.willChange = '';
      if (!arrastando) { y = U.limitar(y, 0, max); aplicar(); }
    }
    function inercia() {
      if (raf) cancelAnimationFrame(raf);
      let t0 = performance.now();
      const passo = t => {
        const dt = U.limitar(t - t0, 1, 48); t0 = t;
        if (y < 0 || y > max) {                         // passou da borda: volta com mola
          const alvo = y < 0 ? 0 : max;
          y += (alvo - y) * Math.min(1, dt / 90);
          if (Math.abs(alvo - y) < 0.6) y = alvo;
          vel = 0;
        } else if (Math.abs(vel) > 0.02) {              // desliza e freia
          y += vel * dt;
          vel *= Math.pow(0.996, dt);
          if (y < -50) { y = -50; vel = 0; } else if (y > max + 50) { y = max + 50; vel = 0; }
        } else vel = 0;
        aplicar();
        if (vel === 0 && y >= 0 && y <= max) { raf = 0; conteudo.style.willChange = ''; return; }
        raf = requestAnimationFrame(passo);
      };
      raf = requestAnimationFrame(passo);
    }
    /** Rola até y (animado). */
    function irPara(alvo, animar = true) {
      pararMovimento();
      alvo = U.limitar(alvo, 0, max);
      if (!animar) { y = alvo; aplicar(); return; }
      const de = y, t0 = performance.now(), dur = 380;
      const passo = t => {
        const k = U.limitar((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
        y = de + (alvo - de) * e; aplicar();
        raf = k < 1 ? requestAnimationFrame(passo) : 0;
      };
      raf = requestAnimationFrame(passo);
    }
    /** Posição de um elemento dentro do conteúdo (px virtuais). */
    function topoDe(el) {
      let t = 0;
      for (let e = el; e && e !== conteudo; e = e.offsetParent) t += e.offsetTop;
      return t;
    }

    function alvoDe(el) {
      for (let e = el; e && e !== vp; e = e.parentElement) if (acoes.has(e)) return e;
      return null;
    }
    function soltarBotao() {
      if (pressionado) pressionado.classList.remove('apertado');
      pressionado = null;
    }
    const ultimoAcionado = new WeakMap();
    function acionar(b, ev) {
      if (!b || !b.isConnected || b.disabled) return;
      const agora = performance.now();                  // como no PC.aoTocar: toque duplo aciona uma vez só
      if (agora - (ultimoAcionado.get(b) || -1e9) < 400) return;
      ultimoAcionado.set(b, agora);
      if (PC.som) PC.som.clique();
      try { acoes.get(b)(ev); } catch (e) { console.error(e); }
    }
    // dedo levantado ou gesto cancelado sem arrastar: tira o "apertado" (a rolagem não avisa esse caso)
    function fimDoToque() {
      window.removeEventListener('pointerup', fimDoToque, true);
      window.removeEventListener('pointercancel', fimDoToque, true);
      soltarBotao();
    }

    const desligar = PC.arrastar(vp, {
      limiar: 12,
      aoPressionar(p, ev) {
        const deslizando = !!raf && Math.abs(vel) > 0.05;   // tocar para frear a lista só freia (não aciona o botão)
        pararMovimento();
        const b = deslizando ? null : alvoDe(ev.target);
        pressionado = b && !b.disabled ? b : null;
        if (pressionado) pressionado.classList.add('apertado');
        window.addEventListener('pointerup', fimDoToque, true);
        window.addEventListener('pointercancel', fimDoToque, true);
      },
      aoComecar(p) {
        soltarBotao();
        arrastando = true;
        y0 = y;
        amostras = [{ t: performance.now(), y: p.y }];
        conteudo.style.willChange = 'transform';
      },
      aoMover(p) {
        let ny = y0 - p.dy;
        if (ny < 0) ny *= 0.35; else if (ny > max) ny = max + (ny - max) * 0.35;   // borda elástica
        y = ny; aplicar();
        const t = performance.now();
        amostras.push({ t, y: p.y });
        while (amostras.length > 2 && t - amostras[0].t > 120) amostras.shift();
      },
      aoSoltar() {
        arrastando = false;
        const a = amostras[0], b = amostras[amostras.length - 1];
        vel = a && b && b.t > a.t ? -(b.y - a.y) / (b.t - a.t) : 0;
        if (!b || performance.now() - b.t > 90) vel = 0;               // o dedo parou antes de soltar
        vel = U.limitar(vel, -6, 6);
        inercia();
      },
      aoCancelar() { arrastando = false; vel = 0; inercia(); },
      aoTocar(p, ev) {
        const b = pressionado;
        soltarBotao();
        acionar(b, ev);
      },
    });

    // roda do mouse (computador)
    const roda = ev => { pararMovimento(); y = U.limitar(y + ev.deltaY / (PC.palco.escala || 1), 0, max); aplicar(); };
    vp.addEventListener('wheel', roda, { passive: true });
    // teclado (computador): Enter/Espaço nos botões de dentro; foco sempre visível; o navegador não rola sozinho
    conteudo.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const b = alvoDe(ev.target);
      if (b) { ev.preventDefault(); acionar(b, ev); }
    });
    conteudo.addEventListener('focusin', ev => {
      const t = topoDe(ev.target), a = ev.target.offsetHeight || 0;
      if (t < y + 10) irPara(t - 20); else if (t + a > y + altVp - 10) irPara(t + a - altVp + 30);
    });
    vp.addEventListener('scroll', () => { if (vp.scrollTop || vp.scrollLeft) { vp.scrollTop = 0; vp.scrollLeft = 0; } });

    let observador = null;
    if (window.ResizeObserver) { observador = new ResizeObserver(() => medir()); observador.observe(conteudo); }

    return {
      vp, conteudo, medir, irPara, topoDe,
      get y() { return y; },
      destruir() {
        desligar();
        fimDoToque();
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        if (observador) observador.disconnect();
        vp.removeEventListener('wheel', roda);
      },
    };
  }

  // ================================================================ tela "pais"
  PC.telas.registrar('pais', {
    voltarPara: 'abertura',
    criar(raiz, params) {
      params = params || {};
      let destruida = false, modal = null, esperouVoz = false;
      const aj = PC.dados.ajustes;

      raiz.appendChild(fundo());
      const selo = U.el('div', { class: 'pc-pais-selo', hidden: true });
      const bVoltar = redondo('voltar', 'Voltar', () => PC.telas.voltar(), { teste: 'voltar' });
      bVoltar.style.cssText = 'left:22px;top:0';
      const barraTopo = U.el('div', { class: 'pc-pais-topo' }, bVoltar, U.el('h1', { class: 'pc-pais-titulo', text: 'Área dos pais' }), selo);
      raiz.appendChild(barraTopo);

      const rol = criarRolagem();
      raiz.appendChild(rol.vp);

      // Telas mais altas que 16:9 (tablets 4:3 e 16:10) sobram em cima e embaixo do palco: o título sobe e a lista
      // cresce para dentro dessa sobra (só dentro da área segura), mostrando mais texto de uma vez.
      function usarSobra() {
        if (destruida) return;
        const s = PC.palco.escala || 1;
        const seguroTopo = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--seguro-topo')) || 0;
        const sobra = Math.floor(U.limitar(((PC.palco.oy || 0) - seguroTopo) / s, 0, 400));
        barraTopo.style.top = (-sobra) + 'px';
        rol.vp.style.top = (140 - sobra) + 'px';
        rol.vp.style.height = (760 + 2 * sobra) + 'px';
        rol.medir();
      }
      const offPalco = PC.palco.aoMudar(usarSobra);

      // ------------------------------------------------ seções (cada uma pode ser refeita sozinha)
      const secoes = {};
      function cartao(id, titulo) {
        return U.el('section', { class: 'pc-pais-cartao', 'data-secao': id }, U.el('h2', { text: titulo }));
      }
      function secao(id, construir) {
        const el = construir();
        secoes[id] = { el, construir };
        return el;
      }
      function refazer(id) {
        const s = secoes[id];
        if (!s || destruida) return;
        const novo = s.construir();
        s.el.replaceWith(novo);
        s.el = novo;
        rol.medir();
      }
      function atualizarSelo() {
        const lim = Number(aj.limiteMin) || 0;
        selo.hidden = !lim;
        selo.textContent = lim ? 'Limite diário: ' + lim + ' min' : '';
      }
      // um aviso novo tira o anterior (inclusive o que o núcleo mostra no "Gerenciar" do navegador): dois toques
      // seguidos em botões diferentes não empilham dois avisos um em cima do outro
      const aviso = texto => {
        raiz.querySelectorAll(':scope > .aviso').forEach(e => e.remove());
        return PC.ui.aviso(texto, { raiz });
      };

      // ------------------------------------------------ assinatura
      function construirAssinatura() {
        const e = PC.assinatura.estado();
        const s = cartao('assinatura', 'Assinatura');
        const r = resumoAssinatura(e);
        s.append(U.el('p', { class: 'pc-pais-estado ' + r.classe }, U.el('i'), r.titulo));
        if (r.texto) s.append(U.el('p', { class: 'pc-pais-texto', text: r.texto }));
        const erro = textoErro(e);
        if (erro) s.append(U.el('p', { class: 'pc-pais-aviso', text: erro }));

        const linha1 = U.el('div', { class: 'pc-pais-botoes' });
        const linha2 = U.el('div', { class: 'pc-pais-botoes' });
        const podeAssinar = !e.ativa && !e.pendente && !e.indisponivel;
        // "Esconder ofertas" ligado: o botão continua (o adulto pode querer assinar), mas sem destaque, junto dos discretos
        if (podeAssinar && !aj.esconderOfertas) linha1.append(botao('Ver planos', verPlanos, { tipo: 'principal', teste: 'ver-planos', icone: 'estrela' }));
        linha1.append(botao('Restaurar compra', restaurar, { teste: 'restaurar' }));
        // sempre à mão: cancelar ou trocar a forma de pagamento é no Google Play (mesmo se o estado aqui estiver antigo)
        linha1.append(botao('Gerenciar assinatura', gerenciar, { teste: 'gerenciar' }));
        s.append(linha1);

        if (podeAssinar && aj.esconderOfertas) linha2.append(botao('Ver planos', verPlanos, { tipo: 'discreto', teste: 'ver-planos' }));
        linha2.append(botao('Tenho um código de acesso', abrirCodigo, { tipo: 'discreto', teste: 'codigo-acesso' }));
        if (navegadorPuro()) {
          const simulada = e.ativa && e.origem === 'simulada';
          linha2.append(botao(simulada ? 'Desligar a simulação (só no navegador)' : 'Simular assinatura (só no navegador)',
            () => PC.assinatura.simular(!PC.assinatura.ativa()), { tipo: 'discreto', teste: 'simular' }));
        }
        s.append(linha2);
        return s;
      }
      function verPlanos() { irSeguro('assinatura', {}, () => !destruida, 0); }
      function gerenciar() {
        if (!podeAbrirFora('gerenciar')) return;
        raiz.querySelectorAll(':scope > .aviso').forEach(e => e.remove());
        PC.assinatura.gerenciar();           // no navegador, o próprio núcleo mostra um aviso
        if (PC.nativo.disponivel()) aviso('Abrindo as assinaturas do Google Play…');
      }
      function restaurar() {
        PC.assinatura.restaurar();
        aviso(PC.nativo.disponivel() ? 'Consultando o Google Play…' : 'No navegador, a assinatura é simulada.');
      }

      // ------------------------------------------------ voz e sons
      function volumeAtual() {
        const v = Number(aj.vozVolume) || 1;
        return [0.4, 0.6, 0.8, 1].reduce((m, x) => (Math.abs(x - v) < Math.abs(m - v) ? x : m), 1);
      }
      function exemploVoz() { PC.voz.falar('Oi! Eu sou a Pipoca. Vamos contar até três?'); }
      function instalarVoz() {
        if (!podeAbrirFora('voz')) return;
        if (PC.nativo.enviar('abrirAjustesVoz')) aviso('Abrindo os ajustes de voz do aparelho…');
        else aviso('No celular, este botão abre a instalação da voz em português.');
      }
      // a voz do aparelho ainda pode estar ligando; se demorar demais (8 s), conta como faltando
      const vozIniciando = () => !PC.voz.disponivel() && PC.voz.motivo() === 'iniciando' && !esperouVoz;
      const vozFaltando = () => !PC.voz.disponivel() && !vozIniciando();
      const TEXTO_SEM_VOZ = 'Falta a voz em português do Brasil neste aparelho. Sem ela, a Pipoca não consegue falar as instruções.';
      /** Faixa no alto da lista quando falta a voz (a abertura manda o adulto para cá: "toque no cadeado"). */
      function construirFaixaVoz() {
        const s = U.el('div', { class: 'pc-pais-faixa-voz', 'data-secao': 'faixa-voz', role: 'note' });
        if (!vozFaltando()) { s.hidden = true; return s; }
        s.append(U.el('p', { text: TEXTO_SEM_VOZ }),
          botao('Instalar voz em português', instalarVoz, { tipo: 'principal', teste: 'instalar-voz', icone: 'falar' }));
        return s;
      }
      function construirVoz() {
        const s = cartao('voz', 'Voz e sons');
        if (vozIniciando()) s.append(U.el('p', { class: 'pc-pais-aviso info', text: 'Preparando a voz do aparelho…' }));
        else if (vozFaltando()) {
          s.append(U.el('p', { class: 'pc-pais-aviso', text: TEXTO_SEM_VOZ }));
          s.append(U.el('div', { class: 'pc-pais-botoes', style: 'margin:0 0 10px' },
            botao('Instalar voz em português', instalarVoz, { tipo: 'principal', teste: 'instalar-voz-2', icone: 'falar' })));
        }
        s.append(U.el('p', { class: 'pc-pais-rotulo', text: 'Volume da voz da Pipoca' }));
        s.append(segmentado([40, 60, 80, 100].map(v => ({ valor: v / 100, texto: v + '%', teste: 'volume-' + v })), volumeAtual(),
          v => { aj.vozVolume = v; salvarAjustes(); exemploVoz(); }));
        s.append(U.el('div', { style: 'height:22px' }));
        s.append(interruptor('Falar mais devagar', 'A Pipoca fala com mais calma.', !!aj.vozDevagar,
          v => { aj.vozDevagar = v; salvarAjustes(); exemploVoz(); }, 'devagar'));
        s.append(interruptor('Efeitos sonoros', 'Sons de encaixe, cliques e festas. A voz da Pipoca continua.', aj.som !== false,
          v => { aj.som = v; salvarAjustes(); if (v && PC.som) { PC.som.iniciar(); PC.som.encaixar(); } }, 'efeitos'));
        s.append(U.el('div', { class: 'pc-pais-botoes', style: 'margin-top:14px' }, botao('Ouvir a Pipoca', exemploVoz, { teste: 'ouvir-voz', icone: 'falar' })));
        s.append(U.el('p', { class: 'pc-pais-nota', text: 'A voz não pode ser desligada: é ela que explica as brincadeiras para quem ainda não lê.' }));
        return s;
      }

      // ------------------------------------------------ supervisão: tempo de uso, limite diário, ofertas
      function construirSupervisao() {
        const s = cartao('supervisao', 'Tempo de uso e limites');
        s.append(U.el('div', { class: 'pc-pais-numeros' },
          numero(formatarTempo(PC.dados.tempoHoje()), 'hoje'),
          numero(formatarTempo(PC.dados.tempoSemana()), 'nos últimos 7 dias')));
        const lim = Number(aj.limiteMin) || 0;
        s.append(U.el('p', { class: 'pc-pais-rotulo', text: 'Limite diário' }));
        s.append(segmentado([0, 15, 30, 45, 60].map(m => ({ valor: m, texto: m ? m + ' min' : 'Desligado', teste: 'limite-' + m })), lim,
          m => { aj.limiteMin = m; salvarAjustes(); refazer('supervisao'); atualizarSelo(); }));
        if (lim) {
          const resta = lim * 60 - PC.dados.tempoHoje();
          let hoje;
          if (resta > 0) hoje = 'Hoje ainda restam ' + formatarTempo(resta) + '.';
          else if (PC.dados.limiteAtingido()) hoje = 'O tempo de hoje já acabou.';
          else hoje = 'Hoje um adulto já liberou mais tempo.';
          s.append(U.el('p', { class: 'pc-pais-aviso ok', style: 'margin:22px 0 0' },
            'Limite ligado: ' + lim + ' minutos por dia. Quando o tempo acaba, a Pipoca se despede e só um adulto libera mais tempo. ' + hoje));
        }
        s.append(U.el('div', { style: 'height:16px' }));
        s.append(interruptor('Esconder ofertas de assinatura', 'O botão "Ver planos" fica discreto aqui. O jogo nunca mostra ofertas para a criança.',
          !!aj.esconderOfertas, v => { aj.esconderOfertas = v; salvarAjustes(); refazer('assinatura'); }, 'esconder-ofertas'));
        s.append(U.el('p', { class: 'pc-pais-nota', text: 'O tempo conta só com o jogo aberto na tela, fora da área dos pais.' }));
        return s;
      }

      // ------------------------------------------------ progresso por estação
      function construirProgresso() {
        const s = cartao('progresso', 'Progresso');
        const fases = PC.fases || [];
        const total = fases.length || 30;
        s.append(U.el('div', { class: 'pc-pais-numeros' },
          numero(PC.dados.concluidas().length + ' de ' + total, 'estações concluídas'),
          numero(PC.dados.figurinhas().size + ' de ' + total, 'figurinhas no álbum')));
        const est = PC.dados.estatisticas();
        const linhas = fases.filter(f => est[f.n] || PC.dados.estacaoConcluida(f.n));
        if (!linhas.length) s.append(U.el('p', { class: 'pc-pais-nota', text: 'Nenhuma estação jogada ainda.' }));
        else {
          const tab = U.el('table', { class: 'pc-pais-tabela' });
          tab.appendChild(U.el('thead', {}, U.el('tr', {},
            U.el('th', { text: 'Estação' }), U.el('th', { text: 'Brincadeira' }), U.el('th', { class: 'num', text: 'Vezes' }),
            U.el('th', { class: 'num', text: 'Erros' }), U.el('th', { class: 'num', text: 'Dicas' }), U.el('th', { class: 'num', text: 'Tempo' }))));
          const corpo = U.el('tbody');
          linhas.forEach(f => {
            const e = est[f.n];
            const feita = PC.dados.estacaoConcluida(f.n);
            corpo.appendChild(U.el('tr', {},
              U.el('td', { class: feita ? 'feita' : '', text: (feita ? '★ ' : '') + f.n }),
              U.el('td', { text: nomeEstacao(f) }),
              U.el('td', { class: 'num', text: e ? String(e.vezes) : '–' }),
              U.el('td', { class: 'num', text: e ? String(e.erros) : '–' }),
              U.el('td', { class: 'num', text: e ? String(e.dicas) : '–' }),
              U.el('td', { class: 'num', text: e ? formatarTempo(e.segundos) : '–' })));
          });
          tab.appendChild(corpo);
          s.append(tab);
          s.append(U.el('p', { class: 'pc-pais-nota', text: '★ = estação concluída. Vezes, erros, dicas e tempo somam todas as jogadas.' }));
        }
        s.append(U.el('div', { class: 'pc-pais-botoes' }, botao('Zerar progresso', zerarPasso1, { tipo: 'perigo', teste: 'zerar' })));
        s.append(U.el('p', { class: 'pc-pais-nota', text: 'Apaga as estações concluídas, as figurinhas, as estatísticas e o tempo de uso deste aparelho. Os ajustes e a assinatura continuam.' }));
        return s;
      }

      // ------------------------------------------------ privacidade, créditos e versão
      function abrirPolitica() {
        if (!podeAbrirFora('politica')) return;
        if (PC.nativo.disponivel()) { PC.nativo.enviar('abrirPrivacidade'); aviso('Abrindo a política no navegador…'); return; }
        try { window.open(new URL('../privacidade/index.html', location.href).href, '_blank', 'noopener'); } catch (e) { console.error(e); }
      }
      function construirPrivacidade() {
        const s = cartao('privacidade', 'Privacidade');
        s.append(U.el('p', { class: 'pc-pais-texto', text: 'O Pipoca Aprende não coleta, não envia e não compartilha dados pessoais. Não tem anúncios nem ferramentas de análise.' }));
        s.append(U.el('p', { class: 'pc-pais-texto', text: 'O progresso, os ajustes e o tempo de uso ficam só neste aparelho. A assinatura é cobrada pelo Google Play, que cuida do pagamento.' }));
        s.append(U.el('div', { class: 'pc-pais-botoes', style: 'margin-top:10px' }, botao('Ver a política completa', abrirPolitica, { teste: 'politica' })));
        return s;
      }
      function construirCreditos() {
        const s = cartao('creditos', 'Créditos e licenças');
        s.append(U.el('p', { class: 'pc-pais-texto', text: 'Pipoca Aprende: brincadeiras, desenhos e sons originais.' }));
        s.append(U.el('p', { class: 'pc-pais-texto', text: 'Fonte Fredoka — Copyright 2016 The Fredoka Project Authors. Licenciada sob a SIL Open Font License 1.1 (o texto completo da licença acompanha o aplicativo).' }));
        const m = /Chrome\/(\d+)/.exec(navigator.userAgent || '');
        const versao = U.el('p', { class: 'pc-pais-texto', style: 'margin:0', 'data-teste': 'versao',
          text: 'Versão ' + PC.versao + (m ? ' · WebView ' + m[1] + (PC.webviewAntiga ? ' (desatualizado)' : '') : '') });
        // 7 toques seguidos na versão ligam/desligam o modo desenvolvedor (só no navegador e no APK de teste)
        let toques = 0, ultimoToque = 0;
        versao.addEventListener('click', () => {
          if (!PC.dev.permitido()) return;
          const agora = Date.now();
          toques = agora - ultimoToque < 1200 ? toques + 1 : 1; ultimoToque = agora;
          if (toques >= 4 && toques < 7) aviso('Faltam ' + (7 - toques) + ' toques para o modo desenvolvedor');
          if (toques < 7) return;
          toques = 0;
          const ligado = PC.dev.ligar(!PC.dev.ativo());
          aviso(ligado ? 'Modo desenvolvedor ligado: todas as estações abertas.' : 'Modo desenvolvedor desligado.');
          refazer('dev');
        });
        s.append(versao);
        return s;
      }

      // ------------------------------------------------ modo desenvolvedor (só aparece ligado)
      function construirDev() {
        if (!PC.dev.ativo()) return U.el('section', { 'data-secao': 'dev', hidden: true });
        const s = cartao('dev', 'Modo desenvolvedor');
        s.append(U.el('p', { class: 'pc-pais-texto', text: 'Todas as estações estão abertas no mapa, fora da ordem e sem assinatura. Toque num número para jogar direto.' }));
        const grade = U.el('div', { class: 'pc-pais-botoes', style: 'gap:14px' });
        (PC.fases || []).forEach(f => grade.appendChild(botao(String(f.n), () => PC.telas.ir('atividade', { estacao: f.n }), { teste: 'dev-' + f.n })));
        s.append(grade);
        s.append(U.el('div', { class: 'pc-pais-botoes' },
          botao('Abrir o mapa', () => PC.telas.ir('mapa', {}), { teste: 'dev-mapa' }),
          botao('Desligar o modo desenvolvedor', () => { PC.dev.ligar(false); aviso('Modo desenvolvedor desligado.'); refazer('dev'); }, { tipo: 'perigo', teste: 'dev-desligar' })));
        return s;
      }

      // ------------------------------------------------ índice (atalhos para as seções)
      function indice() {
        const g = U.el('nav', { class: 'pc-pais-indice', 'aria-label': 'Seções' });
        [['assinatura', 'Assinatura'], ['voz', 'Voz e sons'], ['supervisao', 'Tempo de uso'], ['progresso', 'Progresso'], ['privacidade', 'Privacidade']]
          .forEach(([id, texto]) => g.appendChild(botao(texto, () => { const s = secoes[id]; if (s) rol.irPara(rol.topoDe(s.el) - 16); }, { teste: 'ir-' + id })));
        return g;
      }

      // ------------------------------------------------ janelas: confirmação e código de acesso
      function abrirModal({ titulo, texto, corpo, botoes, topo }) {
        fecharModal();
        const caixa = U.el('div', { class: 'pc-pais-modal-caixa', style: topo != null ? 'top:' + topo + 'px' : null },
          U.el('h2', { text: titulo }), texto ? U.el('p', { class: 'pc-pais-texto', text: texto }) : null, corpo || null);
        if (botoes && botoes.length) {
          const linha = U.el('div', { class: 'pc-pais-botoes fim' });
          botoes.forEach(b => linha.appendChild(botao(b.texto, b.acao, { tipo: b.tipo || 'secundario', teste: b.teste, solto: true })));
          caixa.appendChild(linha);
        }
        const el = U.el('div', { class: 'pc-pais-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo }, U.el('div', { class: 'pc-pais-modal-veu' }), caixa);
        el.addEventListener('pointerdown', ev => ev.stopPropagation());
        raiz.appendChild(el);
        modal = el;
        return el;
      }
      function fecharModal() { if (modal) { modal.remove(); modal = null; } }

      function zerarPasso1() {
        abrirModal({
          titulo: 'Zerar o progresso?',
          texto: 'Isso apaga as estações concluídas, as figurinhas, as estatísticas e o tempo de uso deste aparelho. Não dá para desfazer.',
          botoes: [
            { texto: 'Cancelar', teste: 'cancelar', acao: fecharModal },
            { texto: 'Continuar', teste: 'zerar-sim', tipo: 'perigo', acao: zerarPasso2 },
          ],
        });
      }
      function zerarPasso2() {
        PC.bloquearToques(500);                  // um toque duplo não confirma as duas janelas
        abrirModal({
          titulo: 'Tem certeza?',
          texto: 'Todas as figurinhas do álbum e as estrelas da trilha vão sumir deste aparelho.',
          botoes: [                              // posições trocadas em relação à primeira janela, de propósito
            { texto: 'Apagar tudo', teste: 'zerar-confirmar', tipo: 'perigo', acao: zerarDeVez },
            { texto: 'Cancelar', teste: 'cancelar', acao: fecharModal },
          ],
        });
        modal.querySelector('.pc-pais-botoes').classList.remove('fim');
      }
      function zerarDeVez() {
        fecharModal();
        PC.dados.zerar();
        refazer('progresso');
        refazer('supervisao');
        rol.irPara(rol.topoDe(secoes.progresso.el) - 16);   // mostra o resultado (a tabela encolheu)
        aviso('Progresso zerado.');
      }

      function abrirCodigo() {
        const campo = U.el('input', { class: 'pc-pais-campo', type: 'text', teste: 'codigo', autocomplete: 'off', autocapitalize: 'characters',
          autocorrect: 'off', spellcheck: 'false', maxlength: '40', enterkeyhint: 'done', 'aria-label': 'Código de acesso', placeholder: 'Código' });
        const status = U.el('p', { class: 'pc-pais-nota', 'aria-live': 'polite', style: 'min-height:46px' });
        let enviando = false, el = null;
        const usar = botao('Usar código', enviar, { tipo: 'principal', teste: 'usar-codigo', solto: true });
        const mostrar = (texto, tipo) => { status.textContent = texto; status.className = 'pc-pais-nota' + (tipo ? ' ' + tipo : ''); };
        function enviar() {
          if (enviando) return;
          const codigo = campo.value.trim();
          if (!codigo) { mostrar('Digite o código.', 'ruim'); return; }
          enviando = true; usar.disabled = true; mostrar('Conferindo…');
          PC.assinatura.usarCodigoRevisao(codigo).then(ok => {
            enviando = false; usar.disabled = false;
            if (destruida || modal !== el) return;
            if (ok) {
              mostrar('Código aceito! Tudo liberado por 30 dias.', 'ok');
              setTimeout(() => { if (modal === el) fecharModal(); }, 1800);
            } else {
              mostrar(PC.nativo.disponivel() ? 'Código não aceito. Confira e tente de novo.' : 'No navegador, o código só funciona dentro do aplicativo.', 'ruim');
            }
          });
        }
        campo.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); enviar(); } });
        // a janela fica no alto da tela e o campo vem logo depois do título: o teclado do celular (o app não
        // encolhe a tela quando ele abre) cobre a parte de baixo
        el = abrirModal({
          titulo: 'Código de acesso',
          corpo: U.el('div', {}, U.el('div', { class: 'pc-pais-campo-linha' }, campo, usar), status,
            U.el('p', { class: 'pc-pais-texto', style: 'margin:6px 0 0',
              text: 'Recebeu um código de acesso (por exemplo, para a revisão do Google Play)? Digite o código e toque em "Usar código".' })),
          botoes: [{ texto: 'Fechar', teste: 'cancelar', acao: fecharModal }],
          topo: 30,
        });
        try { campo.focus({ preventScroll: true }); } catch (e) { /* ok */ }
      }

      // ------------------------------------------------ montagem
      const c = rol.conteudo;
      if (PC.webviewAntiga) {
        c.appendChild(U.el('p', { class: 'pc-pais-aviso', style: 'margin:0 0 24px',
          text: 'O Android System WebView deste aparelho está desatualizado. Atualize-o pela Play Store para o jogo funcionar melhor.' }));
      }
      c.appendChild(secao('faixa-voz', construirFaixaVoz));
      c.appendChild(indice());
      c.append(
        secao('assinatura', construirAssinatura),
        secao('voz', construirVoz),
        secao('supervisao', construirSupervisao),
        secao('progresso', construirProgresso),
        secao('privacidade', construirPrivacidade),
        secao('creditos', construirCreditos),
        secao('dev', construirDev));
      atualizarSelo();
      usarSobra();                               // já mede a lista
      if (params.manterRolagem && rolagemGuardada) rol.irPara(rolagemGuardada, false);

      const offAssinatura = PC.assinatura.aoMudar(() => refazer('assinatura'));
      const refazerVoz = () => { refazer('faixa-voz'); refazer('voz'); };
      const offVoz = PC.voz.aoMudar(refazerVoz);
      const timerVoz = setTimeout(() => { esperouVoz = true; if (!PC.voz.disponivel()) refazerVoz(); }, 8000);
      const pararVigia = vigiarInatividade(raiz, () => irSeguro('abertura', {}, () => !destruida));

      // testes (só no navegador): PC.debug.rolarAte('zerar') rola a lista até o botão, para o testador tocar nele
      let rolarAte = null;
      if (!PC.modoApp && PC.debug) {
        rolarAte = PC.debug.rolarAte = nome => {
          const el = rol.conteudo.querySelector('[data-teste="' + nome + '"]');
          if (!el) return false;
          rol.irPara(rol.topoDe(el) - 300, false);
          return true;
        };
      }

      return {
        destruir() {
          if (destruida) return;
          destruida = true;
          rolagemGuardada = rol.y;
          if (rolarAte && PC.debug.rolarAte === rolarAte) delete PC.debug.rolarAte;
          offAssinatura(); offVoz(); offPalco(); pararVigia(); clearTimeout(timerVoz);
          fecharModal();
          rol.destruir();
        },
        /** Voltar (botão, Android, Esc): fecha o portão ou a janela aberta; sem nada aberto, vai para a abertura. */
        voltar() {
          if (PC.portao.aberto && PC.portao.aberto()) { PC.portao.fechar(); return true; }
          if (modal) { fecharModal(); return true; }
          return false;
        },
      };
    },
  });

  // ================================================================ tela "assinatura" (paywall)
  PC.telas.registrar('assinatura', {
    criar(raiz) {
      let destruida = false, timerVolta = 0, comemorou = false, recado = '', timerRecado = 0;
      raiz.appendChild(fundo());
      const cartao = U.el('div', { class: 'pc-pais-assin' });
      const bFechar = redondo('x', 'Fechar', () => voltarParaPais(), { teste: 'fechar', grande: true });
      bFechar.style.cssText = 'left:1440px;top:14px';
      raiz.append(cartao, bFechar);

      function voltarParaPais() { irSeguro('pais', { manterRolagem: true }, () => !destruida); }
      const p = (texto, forte) => U.el('p', { class: 'pc-pais-assin-texto' + (forte ? ' forte' : ''), text: texto });

      // o cartão é redesenhado a cada mudança de estado (o botão vira outro elemento): um toque duplo, ou um toque
      // que chega antes de o Google Play responder, não pode abrir duas compras
      let pedidoEm = -1e9;
      function assinar() {
        const e = PC.assinatura.estado();
        if (e.carregando || e.ativa || e.pendente || e.indisponivel || !e.precoFormatado) return;
        const agora = performance.now();
        if (agora - pedidoEm < 2000) return;
        pedidoEm = agora;
        PC.assinatura.assinar();
      }
      function restaurar() {
        // com a ponte, o próprio estado passa a "Consultando o Google Play…"; no navegador, um recado no cartão
        if (!PC.nativo.disponivel()) {
          recado = 'No navegador, a assinatura é simulada: não há compras para restaurar.';
          clearTimeout(timerRecado);
          timerRecado = setTimeout(() => { recado = ''; desenhar(); }, 3500);
        }
        PC.assinatura.restaurar();
        desenhar();
      }

      function desenhar() {
        if (destruida) return;
        const e = PC.assinatura.estado();
        cartao.innerHTML = '';
        cartao.classList.remove('compacto');
        cartao.classList.toggle('sucesso', !!e.ativa);

        if (e.ativa) {
          cartao.append(
            U.el('div', { class: 'pc-pais-assin-ok', html: PC.arte.icone('check') }),
            U.el('h1', { class: 'pc-pais-assin-titulo', text: 'Assinatura ativa! Bom divertimento!' }),
            p('Todas as estações estão liberadas. Voltando para a área dos pais…'));
          if (!comemorou) { comemorou = true; timerVolta = setTimeout(voltarParaPais, 2600); }
          return;
        }

        const preco = e.precoFormatado || '';
        const dias = Number(e.diasTeste) || 7;
        const comTeste = !!(e.temTeste && preco) && !e.carregando && !e.pendente && !e.indisponivel;
        cartao.append(U.el('p', { class: 'pc-pais-assin-marca', text: 'Pipoca Aprende – assinatura mensal' }));
        cartao.append(U.el('h1', { class: 'pc-pais-assin-titulo', text: comTeste ? 'Experimente ' + dias + ' dias grátis' : 'Assinatura mensal' }));

        let rotulo = '', pode = false;
        const cancelar = 'Para cancelar: Google Play > Pagamentos e assinaturas > Assinaturas.';
        const gratis = 'Sem assinar, as estações 1 a 4 continuam liberadas.';
        if (e.carregando) {
          cartao.append(U.el('p', { class: 'pc-pais-assin-texto forte' }, U.el('i', { class: 'pc-pais-giro' }), 'Consultando o Google Play…'));
          cartao.append(p(gratis));
          rotulo = 'Aguarde…';
        } else if (e.indisponivel) {
          cartao.append(p('O Google Play não está disponível neste aparelho.', true));
          cartao.append(p('Isso acontece, por exemplo, quando o modo infantil do fabricante bloqueia a loja. ' + gratis));
          rotulo = 'Assinatura indisponível';
        } else if (e.pendente) {
          cartao.append(U.el('p', { class: 'pc-pais-aviso', style: 'margin:0 0 16px', text: 'Aguardando pagamento ou aprovação.' }));
          cartao.append(p('Quando o Google Play confirmar a compra, tudo é liberado sozinho. ' + gratis));
          rotulo = 'Aguardando aprovação';
        } else if (!preco) {
          cartao.append(p('Conecte à internet para ver o preço e as condições da assinatura.', true));
          cartao.append(p(gratis));
          rotulo = 'Conecte à internet para ver o preço';
        } else if (comTeste) {
          cartao.append(p('Depois, ' + preco + ' por mês, cobrados automaticamente na sua conta Google Play todo mês até você cancelar. ' +
            'Cancele até o fim do teste e não paga nada. ' + cancelar));
          cartao.append(p(gratis));
          rotulo = 'Começar teste grátis'; pode = true;
        } else {
          cartao.append(p(preco + ' por mês, cobrados automaticamente na sua conta Google Play todo mês até você cancelar. ' + cancelar));
          cartao.append(p(gratis));
          rotulo = 'Assinar por ' + preco + ' por mês'; pode = true;
        }

        const check = () => U.el('i', { html: PC.arte.icone('check') });
        const libera = U.el('div', { class: 'pc-pais-assin-libera' },
          U.el('p', { text: 'A assinatura libera:' }),
          U.el('ul', {},
            U.el('li', {}, check(), '56 estações a mais (da 5 à 60)'),
            U.el('li', {}, check(), 'Brincar livre completo')));
        cartao.append(libera);

        const erro = textoErro(e, { semPrecoJaAvisado: true });
        const msg = erro || recado;
        if (msg) cartao.append(U.el('p', { class: 'pc-pais-aviso ' + (erro ? 'ruim' : 'info'), role: 'status', text: msg }));

        const linha = U.el('div', { class: 'pc-pais-botoes' },
          botao(rotulo, assinar, { tipo: 'principal', teste: 'assinar', solto: true, desligado: !pode }),
          botao('Restaurar compra', restaurar, { teste: 'restaurar', solto: true }));
        cartao.append(linha);

        // os botões nunca podem sair do cartão (nem encostar na borda): primeiro compacta; se ainda não couber, a
        // mensagem fica no lugar da lista do que a assinatura libera (o preço e as condições continuam sempre à vista).
        // A folga é a margem automática acima dos botões (valor usado, em px do palco).
        const apertado = () => cartao.scrollHeight > cartao.clientHeight + 1 || (parseFloat(getComputedStyle(linha).marginTop) || 0) < 12;
        if (apertado()) cartao.classList.add('compacto');
        if (apertado() && msg) {
          libera.remove();
          cartao.classList.remove('compacto');
          if (apertado()) cartao.classList.add('compacto');
        }
      }

      desenhar();
      const off = PC.assinatura.aoMudar(desenhar);
      const pararVigia = vigiarInatividade(raiz, () => irSeguro('abertura', {}, () => !destruida));
      return {
        destruir() {
          if (destruida) return;
          destruida = true;
          off(); pararVigia(); clearTimeout(timerVolta); clearTimeout(timerRecado);
        },
        voltar() {
          if (PC.portao.aberto && PC.portao.aberto()) { PC.portao.fechar(); return true; }
          voltarParaPais();
          return true;
        },
      };
    },
  });

  // ================================================================ tela "descanso" (limite diário)
  /** Céu de fim de tarde, calmo, com lua e estrelas (mesmas coordenadas e sangria dos cenários). */
  function ceuDescanso() {
    const id = PC.arte.novoId('pc-descanso');
    const estrela = (x, y, e) => `<path d="M${x} ${y - 15 * e} L ${x + 4 * e} ${y - 4 * e} L ${x + 15 * e} ${y} L ${x + 4 * e} ${y + 4 * e} L ${x} ${y + 15 * e} ` +
      `L ${x - 4 * e} ${y + 4 * e} L ${x - 15 * e} ${y} L ${x - 4 * e} ${y - 4 * e} Z" fill="#FFF4CC" opacity="${(0.5 + 0.45 * e).toFixed(2)}"/>`;
    const estrelas = [[90, 120, 1], [270, 60, .8], [440, 190, .9], [650, 90, .7], [860, 170, 1], [1040, 60, .8], [1120, 300, .6], [1500, 110, 1],
      [1560, 290, .8], [330, 330, .6], [-260, 150, 1], [-640, 70, .8], [-480, 320, .7], [1840, 90, 1], [2160, 220, .8], [2420, 80, .7]]
      .map(([x, y, e]) => estrela(x, y, e)).join('');
    const el = U.el('div', { class: 'cenario cenario-descanso' });
    el.innerHTML = `<svg class="cenario-svg" viewBox="-1200 -700 4000 2300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="-700" x2="0" y2="820">
          <stop offset="0" stop-color="#24215A"/><stop offset=".5" stop-color="#3E3787"/><stop offset=".82" stop-color="#8E73BC"/><stop offset="1" stop-color="#E9B6C9"/>
        </linearGradient>
        <mask id="${id}-lua"><circle cx="1270" cy="170" r="72" fill="#fff"/><circle cx="1302" cy="146" r="64" fill="#000"/></mask>
      </defs>
      <rect x="-1200" y="-700" width="4000" height="2300" fill="url(#${id})"/>
      ${estrelas}
      <circle cx="1270" cy="170" r="130" fill="#FFF1B8" opacity=".10"/>
      <circle cx="1270" cy="170" r="72" fill="#FFF1B8" mask="url(#${id}-lua)"/>
      <path d="M-1200 690 C -700 640, -200 690, 300 668 C 800 646, 1200 700, 1700 668 C 2200 636, 2500 676, 2800 664 V 1600 H -1200 Z" fill="#3C6676"/>
      <path d="M-1200 772 C -600 748, 200 794, 900 774 C 1500 756, 2200 792, 2800 776 V 1600 H -1200 Z" fill="#4C8170"/>
      <rect x="-1200" y="812" width="4000" height="800" fill="#467866"/>
      <g fill="#5E9A7E">${[[120, 860], [460, 880], [1080, 870], [1380, 885], [-200, 870], [1800, 875]].map(([x, y]) =>
        `<path d="M${x} ${y} q 6 -24 12 0 q 6 -28 12 0 q 6 -20 12 0"/>`).join('')}</g>
    </svg>`;
    return el;
  }

  /** A Pipoca (pose normal) com os olhos fechados e uma boca de bocejo (aparece com a classe "bocejando"). */
  function pipocaSonolenta() {
    const svg = U.svg(PC.arte.pipoca('normal'));
    const cabeca = svg.querySelector('.pip-cabeca') || svg;
    const traco = { fill: 'none', stroke: T, 'stroke-width': 6, 'stroke-linecap': 'round' };
    // olhos fechados no lugar dos olhinhos da arte (centros em (108, 118) e (142, 118), como em PC.arte.pipoca)
    cabeca.append(
      U.svgEl('g', { class: 'pc-pais-desc-olhos' },
        U.svgEl('path', Object.assign({ d: 'M99 117 Q 108 128 117 117' }, traco)),
        U.svgEl('path', Object.assign({ d: 'M133 117 Q 142 128 151 117' }, traco))),
      // bocejo: boca oval abaixo das narinas (y 136), dentro do rosto (que vai até y 164)
      U.svgEl('g', { class: 'pc-pais-desc-bocejo' },
        U.svgEl('ellipse', { cx: 125, cy: 151, rx: 10, ry: 11, fill: '#4A1F2A', stroke: T, 'stroke-width': 4.5 }),
        U.svgEl('ellipse', { cx: 125, cy: 157, rx: 5.5, ry: 3, fill: '#FF8C8C' })));
    return svg;
  }

  const FALA_DESCANSO = 'Hora de descansar! Até amanhã!';

  PC.telas.registrar('descanso', {
    voltarPara: 'abertura',
    criar(raiz) {
      const ac = new AbortController();
      raiz.appendChild(ceuDescanso());
      const pip = U.el('div', { class: 'pc-pais-desc-pipoca', teste: 'pipoca', role: 'img', 'aria-label': 'A Pipoca bocejando' }, pipocaSonolenta());
      const zs = U.el('div', { class: 'pc-pais-desc-zs', 'aria-hidden': 'true' }, U.el('span', { text: 'z' }), U.el('span', { text: 'z' }), U.el('span', { text: 'z' }));
      const balao = U.el('div', { class: 'pc-pais-desc-balao', hidden: true, 'aria-label': FALA_DESCANSO },
        U.el('span', { text: 'Hora de descansar!' }), U.el('span', { text: 'Até amanhã!' }));
      const bAdulto = redondo('cadeado', 'Adultos: liberar mais tempo hoje', liberar, { teste: 'adulto', classe: 'pc-pais-desc-adulto' });
      bAdulto.style.cssText = 'left:1446px;top:10px';
      raiz.append(zs, pip, balao, bAdulto);

      let timerBocejo = 0;
      function bocejar() {
        clearTimeout(timerBocejo);
        pip.classList.remove('bocejando'); void pip.offsetWidth; pip.classList.add('bocejando');
        timerBocejo = setTimeout(() => pip.classList.remove('bocejando'), 2000);
      }
      PC.aoTocar(pip, bocejar, { som: false });   // tocar na Pipoca: ela boceja de novo (sem falar)

      let pedindo = false;                       // toque duplo no cadeado: um portão e uma liberação só
      function liberar() {
        if (pedindo) return;
        pedindo = true;
        PC.portao.pedir().then(ok => {
          pedindo = false;
          if (!ok || ac.signal.aborted) return;
          PC.dados.liberarHoje();
          irSeguro('mapa', {}, () => !ac.signal.aborted);
        }, () => { pedindo = false; });
      }

      // boceja e se despede (falado uma vez só)
      (async () => {
        try {
          await U.esperar(500, ac.signal);
          bocejar();
          await U.esperar(1900, ac.signal);
          // o portão dos adultos é silencioso: se ele abriu antes da despedida, a fala espera ele fechar
          while (PC.portao.aberto && PC.portao.aberto()) await U.esperar(300, ac.signal);
          balao.hidden = false; balao.classList.add('mostra');
          pip.classList.add('falando');
          await PC.voz.falar(FALA_DESCANSO);
          pip.classList.remove('falando');
        } catch (e) { /* saiu da tela */ }
      })();

      // testes (só no navegador): {"gesto": true} toca no botão dos adultos; com o portão aberto, nas teclas certas
      let gesto = null, gestoAnterior = null;
      if (!PC.modoApp && PC.debug) {
        gestoAnterior = PC.debug.proximoGestoVirtual;
        gesto = () => { const r = PC.palco.retangulo(bAdulto); return { tipo: 'tocar', em: { x: r.cx, y: r.cy } }; };
        PC.debug.proximoGestoVirtual = gesto;
      }

      return {
        destruir() {
          ac.abort();
          clearTimeout(timerBocejo);
          if (gesto && PC.debug.proximoGestoVirtual === gesto) PC.debug.proximoGestoVirtual = gestoAnterior;
        },
        /** Voltar com o portão aberto fecha só o portão; sem portão, vai para a abertura. */
        voltar() {
          if (PC.portao.aberto && PC.portao.aberto()) { PC.portao.fechar(); return true; }
          return false;
        },
      };
    },
  });
})();
