# A Pipoca capivara (guardada)

Esta é a primeira versão da Pipoca, quando ela era uma capivara. Em novembro de 2026 ela virou uma macaquinha,
e a capivara ficou guardada aqui, inteira, para voltar se quiser. Esta pasta não entra no aplicativo.

- `arte.js`: o arquivo `jogo/js/arte.js` completo, como era com a capivara. A Pipoca capivara é a função
  `pipoca(pose)` com as 7 poses (normal, fala, feliz, aponta, pensa, danca, acena), e as cores ficam no objeto `C`.
- `figurinha-capivara-bebe.js`: a figurinha 20 antiga, "capivara bebê, a prima da Pipoca".

## Para trazer a capivara de volta

1. Copie `arte.js` daqui por cima de `jogo/js/arte.js`.
   Atenção: se `arte.js` mudou em outras partes (ícones, cenários), copie só o trecho da Pipoca.
2. Em `jogo/estilo.css`, o braço que acena volta a girar em volta de `184px 180px`
   (procure `.pip-braco-aceno`).
3. Na tela de descanso (`jogo/js/telas/pais.js`, função `pipocaSonolenta`), os olhos fechados voltam para
   (84, 80) e (166, 80), o bocejo para (125, 138), e a cabeça gira em volta de `125px 160px`.
