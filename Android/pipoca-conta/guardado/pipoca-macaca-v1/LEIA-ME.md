# A Pipoca macaquinha (guardada)

Esta é a segunda versão da Pipoca: uma macaquinha marrom, sentada de frente como um bichinho de pelúcia, com o rosto
em coração e a flor de ipê na cabeça (`poses.png` mostra as 7 poses). Em 9 de novembro de 2026 ela foi redesenhada do
zero e virou uma sagui de tufos de pipoca (`jogo/js/pipoca.js`). Esta pasta não entra no aplicativo.

- `arte.js`: o `jogo/js/arte.js` completo de antes. A macaquinha é a função `pipoca(pose)`, com as cores no objeto `C`.
- `ui.js`, `estilo.css`, `abertura.js`, `pais.js`, `figurinhas.js`: como eram, com as animações em CSS (respirar,
  pular, dançar, piscar, boca) e os desenhos feitos por cima dela (medalha, livro, olhos fechados do descanso).
- `conceitos.png`: os três caminhos apresentados antes do redesenho (a família escolheu o A, a sagui).

## Para trazer a macaquinha de volta

O jeito mais simples é pelo git: ela é a Pipoca do commit `a93b72f` ("falas menos repetitivas").
À mão: copie os arquivos daqui por cima dos de `jogo/` (confira antes se eles mudaram em outras partes), tire a linha
`<script src="js/pipoca.js"></script>` do `jogo/index.html` e desfaça os usos de `PC.pipoca.criar` em
`telas/atividade.js` e `telas/mapa.js`.
