# Sprunkinhos

Jogo musical no estilo do Sprunki. Arraste os personagens coloridos até os bonecos cinzas do palco e cada um começa a cantar ou tocar a sua parte. Todos os sons estão no mesmo tom e no mesmo ritmo, então qualquer combinação soa bem.

## Como abrir

Este jogo faz parte dos **Jogos da Lívia**: abra a página inicial (`../../index.html` ou o `iniciar-jogo.bat` da pasta `jogos-da-livia`) e toque no cartão do Sprunkinhos. O botão de casinha, no canto de cima, volta para a página inicial.

Toque em **Tocar!** para começar: o navegador só libera o som depois de um toque.

## Como jogar

- Arraste um personagem da bandeja até um boneco cinza, ou só toque no ícone: ele vai para o primeiro lugar livre. O personagem entra cantando na próxima batida.
- Toque num personagem do palco para **Silenciar**, deixar só ele tocando (**Solo**) ou **Tirar**. Arrastar para fora do palco também tira.
- No topo ficam os botões de misturar (monta um palco aleatório), limpar, pausar e tela cheia.
- A **Lua** (último ícone dos efeitos) deixa o palco de noite e muda a música para tom menor.

São 20 personagens em 4 grupos (Batidas, Efeitos, Melodias e Vozes) e mais a Lua.

## Modo terror

O botão do fantasma (**Terror**, no topo) transforma o jogo, e um novo toque volta ao normal. Não tem sangue, feridas nem armas: o medo vem do clima.

- O palco vira um inferno vulcânico, com brasas subindo, relâmpagos com trovão e, de vez em quando, um apagão em que só os olhos ficam acesos.
- Cada personagem ganha uma versão assustadora: olhos vermelhos ou vazios, dentes afiados, rachaduras e tinta preta escorrendo. Os olhos seguem o dedo, e os bonecos cinzas abrem olhos vermelhos de repente.
- A música continua no mesmo ritmo, mas em Mi menor harmônica e com timbres sombrios: batida de coração, relógio, órgão, sino fúnebre, caixinha de música desafinada, coral fantasma e a canção de ninar da Lalá desafinada.

## Segredos

A estrela no topo conta as combinações especiais já descobertas (ficam guardadas no navegador):

- **Banda Completa:** um de cada grupo. Aparece um arco-íris.
- **Casa Cheia:** os 7 lugares ocupados. Festa com confete e luzes.
- **Bateria Total**, **Laboratório Maluco**, **Orquestra Mágica** e **Coral das Nuvens:** os 5 personagens de um mesmo grupo juntos.
- **Noite Encantada:** a Lua no palco.
- **Modo Terror:** apertar o botão do fantasma.
- **Pesadelo Completo:** os 7 lugares ocupados no modo terror.

## Como funciona

Não há arquivos de som: tudo é sintetizado com Web Audio, em Mi maior, a 118 BPM, sobre os acordes I–V–vi–IV num loop de 4 compassos. As partituras são escritas em graus da escala, por isso a Lua consegue trocar tudo para Mi menor e as melodias continuam combinando.

| Arquivo | O que tem |
| --- | --- |
| `index.html` | página, visual e textos |
| `chars.js` | desenho dos personagens e das versões de terror (SVG gerado em código) |
| `audio.js` | motor de áudio, relógio e instrumentos |
| `music.js` | partituras, volumes e efeitos de cada personagem |
| `fx.js` | partículas: notas, confete, bolhas, vaga-lumes |
| `game.js` | palco, arrastar e soltar, animações e segredos |
| `capa.svg` | capa do cartão na página inicial (gerada com os próprios personagens) |
