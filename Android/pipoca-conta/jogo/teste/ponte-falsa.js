/* Pipoca Aprende — ponte falsa do Android, para testar no navegador o que só existe no app.
   Ativada por #ponte=falsa na URL (app.js carrega este arquivo antes de iniciar). Fala o MESMO protocolo de
   mensagens do app (PROJETO.md, seção 10). Opções na URL:
     assinatura=inativa (padrão) | ativa | carregando | pendente | indisponivel | semteste | semPreco
     vozapp=ok (padrão) | sem-ptbr | sem-motor
   O código de revisão aceito aqui é REVISAO-TESTE. Este arquivo não vai para o APK. */
(function () {
  'use strict';
  const h = new URLSearchParams((location.hash || '').replace(/^#/, ''));
  const tipoAss = h.get('assinatura') || 'inativa';
  const tipoVoz = h.get('vozapp') || 'ok';
  const registro = window.__ponteFalsa = { enviadas: [], recebidas: [], podeVoltar: false };

  const base = { ativa: false, carregando: false, origem: '', precoFormatado: 'R$ 14,90', temTeste: true, diasTeste: 7,
    pendente: false, indisponivel: false, erro: '' };
  const estados = {
    inativa: {},
    ativa: { ativa: true, origem: 'play', temTeste: false },
    carregando: { carregando: true, precoFormatado: '' },
    pendente: { pendente: true },
    indisponivel: { indisponivel: true, precoFormatado: '', temTeste: false, erro: 'play-indisponivel' },
    semteste: { temTeste: false, diasTeste: 0 },
    semPreco: { precoFormatado: '', erro: 'sem-conexao' },
  };
  let assinatura = Object.assign({}, base, estados[tipoAss] || {});
  const voz = tipoVoz === 'ok' ? { disponivel: true, motivo: '' } : { disponivel: false, motivo: tipoVoz };
  let falaAtual = null;

  function responder(msg) {
    registro.recebidas.push(msg);
    setTimeout(() => {
      const p = window.PipocaAndroid;
      if (p && typeof p.onmessage === 'function') p.onmessage({ data: JSON.stringify(msg) });
    }, 30);
  }

  window.PipocaAndroid = {
    onmessage: null,
    postMessage(texto) {
      let m;
      try { m = JSON.parse(texto); } catch (e) { return; }
      registro.enviadas.push(m);
      switch (m.tipo) {
        case 'pronto':
          responder({ tipo: 'estado', voz, assinatura, insets: { esq: 0, topo: 0, dir: 0, base: 0 } });
          break;
        case 'falar': {
          if (falaAtual) { clearTimeout(falaAtual.t); responder({ tipo: 'voz-fim', id: falaAtual.id, motivo: 'interrompida' }); }
          if (!voz.disponivel) { responder({ tipo: 'voz-fim', id: m.id, motivo: 'erro' }); falaAtual = null; break; }
          const id = m.id;
          falaAtual = { id, t: setTimeout(() => { falaAtual = null; responder({ tipo: 'voz-fim', id, motivo: 'fim' }); }, 60 * String(m.texto || '').length) };
          break;
        }
        case 'pararFala':
          if (falaAtual) { clearTimeout(falaAtual.t); responder({ tipo: 'voz-fim', id: falaAtual.id, motivo: 'interrompida' }); falaAtual = null; }
          break;
        case 'assinar':
          if (assinatura.indisponivel) { responder({ tipo: 'assinatura', estado: Object.assign({}, assinatura, { erro: 'play-indisponivel' }) }); break; }
          assinatura = Object.assign({}, assinatura, { carregando: true });
          responder({ tipo: 'assinatura', estado: assinatura });
          setTimeout(() => {
            assinatura = Object.assign({}, assinatura, { carregando: false, ativa: true, origem: 'play', temTeste: false, pendente: false });
            responder({ tipo: 'assinatura', estado: assinatura });
          }, 900);
          break;
        case 'restaurar':
          assinatura = Object.assign({}, assinatura, { carregando: false });
          responder({ tipo: 'assinatura', estado: assinatura });
          break;
        case 'codigoRevisao': {
          const ok = m.codigo === 'REVISAO-TESTE';
          if (ok) assinatura = Object.assign({}, assinatura, { ativa: true, origem: 'revisao' });
          responder({ tipo: 'codigoRevisao', ok });
          if (ok) responder({ tipo: 'assinatura', estado: assinatura });
          break;
        }
        case 'podeVoltar': registro.podeVoltar = !!m.valor; break;
        case 'gerenciar': case 'vibrar': case 'abrirAjustesVoz': case 'abrirPrivacidade': case 'sair': break;
        default: console.warn('ponte falsa: mensagem desconhecida', m);
      }
    },
  };
  // simula o botão voltar do Android: __ponteFalsa.voltar()
  registro.voltar = () => { if (registro.podeVoltar) responder({ tipo: 'voltar' }); else registro.saiu = true; };
  if (window.PC && window.PC.ligarPonte) window.PC.ligarPonte();
})();
