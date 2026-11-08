# Parquinho Sprunki

Caixa de areia com os Sprunkinhos, no estilo do Sprunki Playground. Dá para colocar os 21 personagens (normais e de terror), construir com blocos, dar armas aos Sprunkis normais e ver os de terror atacando.

Não tem sangue nem mortes:

- quando um Sprunki de terror alcança um normal e a vida dele acaba, ele **vira versão de terror**;
- quando um Sprunki de terror é derrotado pelas armas, ele **é curado** e volta ao normal, com brilhinhos;
- os golpes têm efeitos de desenho animado ("POW!", "BONK!", estrelinhas, tombos).

## Como jogar

- **Painel da esquerda:** as abas de cima trocam entre **Sprunkis** (cada linha tem o normal e o de terror), **Blocos** e **Armas**. Toque num item para escolher.
- **No cenário:** toque para colocar o item escolhido, ou arraste o item direto do painel para o cenário. Com um bloco escolhido, arrastar o dedo pinta vários blocos de uma vez.
- **Mapa:** tem 96 blocos de largura por 36 de altura. Para passear, arraste o céu (ou um lugar vazio) com um dedo; com um bloco escolhido, arraste com dois dedos. No computador, também dá para arrastar com o botão direito do mouse.
- **Zoom:** arraste a lupa da barra da direita (para cima aproxima, para baixo afasta). No tablet, também dá para abrir e fechar os dois dedos na tela; no computador, use a rodinha do mouse. Afastando tudo, aparece o mapa inteiro.
- **Armas:** com uma arma escolhida, toque num Sprunki normal para entregar a arma a ele. Armas soltas no chão são pegas pelos Sprunkis normais que estão sem arma.
- **Pegar e arremessar:** arraste qualquer personagem ou arma pelo cenário; solte com força para arremessar.
- **Toque num personagem** para ele pular e dizer "Oi!" (o de terror rosna).
- **Botões do lado:** esconder o painel, borracha (apaga o que você tocar) e limpar tudo (toque duas vezes).
- **Botões do canto:** som, pausa e a casinha, que volta para a página inicial.

O cenário fica salvo no navegador (com o lugar e o zoom em que você parou) e volta igual da próxima vez.

## Como os personagens agem

- **Terror:** persegue o normal mais perto, pula obstáculos de 1 bloco e ataca de perto. Muros de 2 blocos ou mais seguram eles.
- **Normal sem arma:** foge quando vê um de terror e vai buscar armas que estão no chão.
- **Normal com arma:** pistola, metralhadora (rajadas) e arco (flecha em arco) atiram de longe; o taco bate de perto e arremessa longe. Tiros quebram vidro.

## Arquivos

| Arquivo | O que tem |
| --- | --- |
| `index.html` | página, painel, botões e visual |
| `mundo.js` | blocos, física, personagens, inteligência, armas, infecção e cura |
| `jogo.js` | câmera (zoom e passear), toques, arrastar, pintar blocos, desenho do cenário e salvamento |
| `sprites.js` | personagens em peças (corpo, braços, pernas), blocos em pixel art e armas |
| `sons.js` | efeitos sonoros sintetizados |
| `capa.svg` | capa do cartão na página inicial |
| `modelo.html` | folha de modelo para conferir o visual de cada personagem em todas as poses |

Os personagens vêm de `../comum/personagens.js`, o mesmo código usado pelo Sprunkinhos.
