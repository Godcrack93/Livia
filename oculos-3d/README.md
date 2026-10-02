# Óculos Mágico

Jogos de óculos VR (Cardboard) para celular, controlados só com o olhar (não precisa de botão). É tudo numa página só: um toque na tela ao abrir e, daí em diante, tudo se escolhe olhando, inclusive trocar de jogo. Não é preciso tirar o celular do óculos.

- **Estoura-Bolhas**: olhe para as bolhas de sabão para estourá-las.
- **Labirinto Mágico**: incline um tabuleiro flutuante e leve o pintinho, dentro de uma bolinha de vidro, até a toca. São 10 níveis com dificuldade crescente e um grande final.

## Como abrir

1. Abra o endereço e toque em qualquer lugar da tela (ou em **Começar**). Esse toque libera a tela cheia, o giroscópio e o som; o navegador só deixa fazer isso com um toque de verdade.
2. Encaixe o celular no óculos. Aparece a **sala de jogos**, com um cartão para cada jogo e o botão **SOM**. Olhe para um cartão até a bolinha da mira encher.
3. Dentro dos jogos, a bolha **JOGOS** (Estoura-Bolhas, à esquerda das outras bolhas da tela de título) e o botão **JOGOS** (Labirinto, embaixo do mapa) voltam para a sala.

Se a sala ficar de lado (porque o celular foi encaixado olhando para outro canto), basta virar a cabeça: ela vem para a frente sozinha. Um botão que acabou de ser escolhido, como o do som, só vale de novo depois de olhar para outro lado.

Os endereços antigos `bolhas.html` e `labirinto.html` continuam funcionando: eles abrem a página única, e depois do toque o jogo correspondente já começa.

```bash
npm i
npm run dev          # http://localhost:8080 (computador)
npm run dev:https    # https://<ip-do-pc>:8443 (celular)
npm run build        # versão final em dist/
npm run niveis       # confere se todos os labirintos têm caminho até a toca e as estrelas
```

No Windows, basta dar dois cliques em `iniciar-jogo.bat`: ele liga os dois servidores e mostra o endereço do celular.

## Labirinto Mágico

### Como jogar

- Na sala de jogos, olhe para o cartão do Labirinto. Aparece o mapa com os 10 níveis: olhe para um número até a mira encher. Embaixo do mapa ficam **JOGOS** (volta para a sala) e **CONTROLE** (troca entre Olhar e Inclinar).
- O tabuleiro surge, a bolinha cai no início e vem o **JÁ!**. Leve a bolinha até a toca dourada, onde um amiguinho espera.
- Cada nível tem 3 estrelas para pegar no caminho. Cair num buraco ou para fora do tabuleiro custa um coração; a bolinha volta para o início ou para a última **bandeira** tocada.
- Sem corações, aparece "OPS!" e o nível recomeça. A cada vez que isso acontece no mesmo nível, ganha mais um coração (até 5).
- Terminar um nível libera o próximo. No fim aparecem as estrelas e os botões **PRÓXIMO**, **DE NOVO** e **MAPA**. Durante o jogo, um botão **MAPA** pequeno fica à esquerda do tabuleiro.

### Níveis

| Nível | Mundo | Novidade |
|---|---|---|
| 1 Primeiros Passos | Jardim | Corredores largos |
| 2 Caminho Torto | Jardim | Corredores estreitos e buracos |
| 3 Pontes do Jardim | Jardim | Pontes sem parede e bandeira |
| 4 Lago Congelado | Gelo | Gelo que escorrega |
| 5 Escorregador | Gelo | Setas que empurram |
| 6 Chave de Gelo | Gelo | Chave, porta e blocos que deslizam |
| 7 Pinball de Doces | Doces | Pula-pulas |
| 8 Portais Mágicos | Doces | Portais e caramelo que freia |
| 9 Moinho de Pirulito | Doces | Moinhos que giram |
| 10 Castelo nas Nuvens | Castelo | Grande final em 3 partes, com tudo junto |

Ao vencer o castelo vem a festa: fogos, arco-íris, o castelo acende e os amiguinhos aparecem em nuvens em volta.

### Controle (botão CONTROLE no mapa)

- **Olhar** (padrão): o tabuleiro inclina na direção de onde você olha, a partir da bolinha. Um anel mostra o ponto olhado e uma seta mostra a inclinação. Olhar perto da bolinha deixa o tabuleiro reto.
- **Inclinar**: inclinação real da cabeça. Encostar a orelha no ombro inclina para os lados; olhar para cima ou para baixo inclina para longe ou para perto.
- No computador, as setas ou W A S D também inclinam o tabuleiro.

O progresso (estrelas de cada nível) fica salvo no navegador; **Apagar progresso do Labirinto**, na tela de abertura, recomeça do nível 1. Para testar qualquer nível sem jogar os anteriores, abra `labirinto.html?todos` (ou `?jogo=labirinto&todos`).

Para criar um nível novo, acrescente um mapa em `src/labirinto/levels.js` (a legenda está no topo do arquivo) e rode `npm run niveis`.

## Estoura-Bolhas

### Como jogar

- Na tela de título há bolhas para escolher com o olhar: **JOGAR**, **NÚMEROS**, **ÁLBUM** e, mais à esquerda, **JOGOS** (volta para a sala de jogos). Olhe para uma delas até o círculo da mira se completar.
- No fim de cada partida, **DE NOVO** repete o mesmo modo e **INÍCIO** volta para a tela de título.

#### Modo Bolhas (JOGAR)

- Começa com a contagem 3, 2, 1, JÁ! A partida dura 70 segundos. As flores começam na sua frente e, com o tempo, aparecem também dos lados e atrás: vale virar a cabeça.
- Nos últimos segundos chega a **FESTA DAS BOLHAS**: o céu fica roxo e saem bolhas de todos os lados.
- Estourar várias bolhas seguidas faz um combo; a cada 5 seguidas ganha +5 pontos.
- **Combo musical**: cada partida sorteia uma música (Brilha, Brilha, Estrelinha; The Wheels on the Bus; tema da Peppa Pig). Cada estouro seguido toca a próxima nota; se o combo quebrar, a música volta ao começo. Tocar a melodia inteira dá +10 pontos.
- **Arco-íris no céu**: a primeira bolha-estrela faz surgir um pedaço de arco-íris, e cada estrela desenha mais um pouco. Na 8ª estrela ele fica completo e dá +10 pontos.
- Os bichinhos salvos pulam para a grama em volta e ficam passeando até o fim da partida.
- Uma **setinha** aparece perto do centro da visão apontando para a bolha mais importante que está fora da vista (dourada, arco-íris, amiguinho ou estrela, nessa ordem).
- No fim aparecem as estrelas (20, 45 e 75 pontos), os bichinhos salvos e o recorde.

#### Modo Números

- Bolhas com números saem das flores: é preciso estourar em ordem, 1, 2, 3... O próximo número brilha, e a voz do celular fala cada número.
- São 3 etapas: de 1 a 5 na frente, de 1 a 10 na frente e dos lados, e de 1 a 10 espalhados em volta (a setinha mostra onde está o próximo).
- Errar não tira pontos: a bolha só balança.
- Cada etapa completa liberta um bichinho. Não há tempo limite; o cronômetro conta quanto você demorou. Terminar vale 1 estrela, até 60 segundos vale 2 e até 40 segundos vale 3. O melhor tempo fica salvo.

#### Álbum dos amigos

- Guarda todos os bichinhos já salvos, com quantas vezes cada um foi salvo. Os que ainda faltam aparecem com "?".
- Na primeira vez que um bichinho é salvo aparece **NOVO!**.
- Há 3 bichinhos **raros**, que só aparecem nas bolhas-amiguinho depois de liberados:
  - Pinguim: jogue 3 partidas.
  - Unicórnio: salve 40 bichinhos no total.
  - Dragãozinho: faça 3 estrelas numa partida.
- Depois de liberado, o raro aparece com certeza na partida seguinte do modo Bolhas e, depois disso, de vez em quando.

### Tipos de bolha

| Bolha | Pontos | O que acontece |
|---|---|---|
| Comum | 1 | Estoura com uma nota musical |
| Estrela | 3 | Tem uma estrela dourada dentro, que sobe girando |
| Amiguinho | 5 | Tem um bichinho dentro (pintinho, coelhinho, joaninha, peixinho, sapinho, gatinho, porquinho, cachorrinho, patinho ou ursinho, e os raros pinguim, unicórnio e dragãozinho), que pula para a grama e fica passeando |
| Dourada | 10 | Rara e brilhante |
| Arco-íris | 3 | Estoura todas as bolhas por perto em cascata |
| Gigante | 2 | Divide-se em 4 bolhas pequenas |

O recorde, o melhor tempo do modo Números e o álbum ficam salvos no navegador (cada endereço, como o do computador e o `https` do celular, tem o seu).

O tema da Peppa Pig em `src/bolhas/songs.js` foi tirado de ouvido e é aproximado; dá para ajustar as notas ali. Como a melodia tem direitos autorais, o jogo é para uso em casa e não deve ser publicado com ela.

## Nos dois jogos

### Computador

Arraste o mouse para olhar; a mira segue o ponteiro, e um clique escolhe na hora. Com o ponteiro parado em cima do jogo, ele também conta como olhar (no Labirinto, no modo Olhar, a bolinha rola na direção do ponteiro).

### Ajustes

- **SOM** (na sala de jogos, pelo olhar): liga ou desliga a música e os efeitos dos dois jogos. Fica salvo.
- **Gráficos: bonitos/leves** (tela de abertura): "bonitos" usa sombras, antisserrilhado e mais detalhes; "leves" é para celulares mais fracos. A página recarrega, por isso fica antes do toque.
- **Medidor** (tela de abertura): mostra no canto, durante o jogo, o FPS, os triângulos e os desenhos (draw calls) de cada quadro. Ao sair, a tela de abertura mostra o resumo.
- **Sair** (canto da tela, só pelo toque): volta para a tela de abertura.

### Celular (Chrome Android)

Use o endereço `https` que o `dev:https` mostrar, na mesma rede Wi-Fi. O giroscópio só funciona em HTTPS. Aceite o aviso de certificado (Avançado > Continuar), vire o celular de lado, toque na tela e encaixe no Cardboard.

### Para programar

`src/main.js` cria o renderizador, o VR e o som uma vez só e troca a cena ativa. A sala de jogos é `src/hub/vr-hub.js`. Cada jogo é um módulo (`src/bolhas/index.js`, `src/labirinto/index.js`) com `scene`, `enter()`, `leave()` e `frame()`, carregado na primeira vez que é escolhido.
