// Ponte com o aplicativo Android (vibração e versão), com alternativas para o navegador.
(function (P) {
  'use strict';

  // Vibração do navegador (ms) quando não há a ponte nativa.
  const PADROES = { leve: 10, medio: 18, forte: 35, erro: [20, 40, 20] };
  let vibracaoLigada = true;

  // Objeto injetado pelo MainActivity (addJavascriptInterface); não existe no navegador.
  function ponte() {
    return globalThis.ParafusinhosAndroid || null;
  }

  P.Nativo = {
    noAndroid: !!ponte(),

    // tipo: leve | medio | forte | erro
    vibrar(tipo) {
      if (!vibracaoLigada || !PADROES[tipo]) return;
      const android = ponte();
      if (android) {
        try {
          android.vibrar(tipo);
        } catch (e) {
          // ponte indisponível (WebView recriada): segue sem vibrar
        }
        return;
      }
      const nav = globalThis.navigator;
      if (!nav || typeof nav.vibrate !== 'function') return;
      // Antes do primeiro toque na página o Chrome recusa e reclama no console.
      if (nav.userActivation && !nav.userActivation.hasBeenActive) return;
      try {
        nav.vibrate(PADROES[tipo]);
      } catch (e) {
        // navegador sem permissão para vibrar: ignora
      }
    },

    definirVibracao(sim) {
      vibracaoLigada = !!sim;
    },

    versao() {
      const android = ponte();
      if (android) {
        try {
          return String(android.versao());
        } catch (e) {
          // cai no valor padrão abaixo
        }
      }
      return '1.0';
    },
  };
})(globalThis.Parafusinhos = globalThis.Parafusinhos || {});
