/* Pipoca Conta — assinatura.
   No app Android, quem fala com o Google Play Billing é o código nativo (ponte PipocaAndroid); aqui só guardamos
   o estado e avisamos as telas. No navegador (sem a ponte), a assinatura é simulada para testes; no APK a simulação
   não existe, porque a ponte sempre existe lá.

   Estado (PC.assinatura.estado()):
     ativa          true quando há assinatura comprada (inclui o período de teste) ou acesso de revisão válido
     carregando     consultando o Google Play
     origem         'play' | 'cache' | 'revisao' | 'simulada' | ''
     precoFormatado preço por mês vindo do Google Play (ex.: "R$ 14,90"), '' se não carregou
     temTeste       a pessoa tem direito à oferta de teste grátis
     diasTeste      duração do teste em dias (ex.: 7)
     pendente       compra aguardando pagamento ou aprovação
     indisponivel   Google Play indisponível neste aparelho (BILLING_UNAVAILABLE)
     erro           código curto do último erro ('' se nenhum)
     nativo         true dentro do app Android */
(function () {
  'use strict';
  const PC = window.PC;
  const CHAVE_SIM = 'pipocaconta.simulacao';
  let estado = {
    ativa: false, carregando: true, origem: '', precoFormatado: '', temTeste: false, diasTeste: 0,
    pendente: false, indisponivel: false, erro: '', nativo: false,
  };
  const ouvintes = [];

  // No app: o Android manda {tipo:'assinatura', estado:{...}} depois do 'pronto' e sempre que algo muda.
  // O JS pede com mensagens: 'assinar', 'restaurar', 'gerenciar', 'codigoRevisao' (resposta {tipo:'codigoRevisao', ok}).
  const ponte = () => (PC.nativo && PC.nativo.disponivel() ? true : null);

  function atualizar(novo) {
    estado = Object.assign({}, estado, novo || {});
    ouvintes.slice().forEach(fn => { try { fn(PC.assinatura.estado()); } catch (e) { console.error(e); } });
    PC.emitir('assinatura:mudou', PC.assinatura.estado());
  }

  function iniciar() {
    if (ponte()) {
      atualizar({ nativo: true, carregando: true });
      PC.on('nativo:assinatura', d => atualizar(Object.assign({ nativo: true }, (d && d.estado) || {})));
      return;
    }
    // navegador: simulação
    let sim = false;
    try { sim = localStorage.getItem(CHAVE_SIM) === '1'; } catch (e) { /* ok */ }
    const h = location.hash || '';
    if (/[#&]assinante=1(&|$)/.test(h)) sim = true;
    if (/[#&]assinante=0(&|$)/.test(h)) sim = false;
    atualizar({ ativa: sim, carregando: false, origem: sim ? 'simulada' : '', precoFormatado: 'R$ 14,90', temTeste: !sim, diasTeste: 7,
      pendente: false, indisponivel: false, erro: '', nativo: false });
  }

  PC.assinatura = {
    iniciar,
    ativa: () => !!estado.ativa,
    estado: () => Object.assign({}, estado),
    aoMudar(fn) { ouvintes.push(fn); return () => { const i = ouvintes.indexOf(fn); if (i >= 0) ouvintes.splice(i, 1); }; },
    /** A estação n é grátis? */
    gratis: n => n <= PC.config.estacoesGratis,
    /** A estação n está liberada (grátis ou assinante)? */
    liberada: n => n <= PC.config.estacoesGratis || !!estado.ativa || !!(PC.dev && PC.dev.ativo()),
    /** Abre a compra (chame SÓ depois do portão dos adultos, na área dos pais). */
    assinar() {
      if (ponte()) { atualizar({ erro: '' }); if (!PC.nativo.enviar('assinar')) atualizar({ erro: 'assinar' }); return; }
      atualizar({ carregando: true, erro: '' });
      setTimeout(() => PC.assinatura.simular(true), 700);
    },
    /** Consulta de novo as compras no Google Play. */
    restaurar() {
      if (ponte()) { atualizar({ carregando: true, erro: '' }); PC.nativo.enviar('restaurar'); return; }
      atualizar({ carregando: false });
    },
    /** Abre a página de assinaturas do Google Play. */
    gerenciar() {
      if (ponte()) { PC.nativo.enviar('gerenciar'); return; }
      if (PC.ui && PC.ui.aviso) PC.ui.aviso('No celular, este botão abre as assinaturas do Google Play.');
    },
    /**
     * Código de acesso para a equipe de revisão do Google Play (área dos pais). Quem confere é o app nativo
     * (o código fica fora do repositório). Devolve Promise<boolean>.
     */
    usarCodigoRevisao(codigo) {
      if (!ponte()) return Promise.resolve(false);
      return new Promise(resolve => {
        const t = setTimeout(() => { off(); resolve(false); }, 4000);
        const off = PC.on('nativo:codigoRevisao', d => { clearTimeout(t); off(); resolve(!!(d && d.ok)); });
        if (!PC.nativo.enviar('codigoRevisao', { codigo: String(codigo || '').trim() })) { clearTimeout(t); off(); resolve(false); }
      });
    },
    /** Só no navegador: liga ou desliga a assinatura de mentirinha. */
    simular(ativa) {
      if (ponte()) return;
      try { localStorage.setItem(CHAVE_SIM, ativa ? '1' : '0'); } catch (e) { /* ok */ }
      atualizar({ ativa: !!ativa, carregando: false, origem: ativa ? 'simulada' : '', temTeste: !ativa, erro: '' });
    },
  };
})();
