# Pipoca Conta — histórico da arte

Registro das decisões de desenho do jogo, para mostrar que a arte foi criada de forma independente. Arquivos: `jogo/js/arte.js` (Pipoca, ícones, cenários, logo, flor, mãozinha) e `jogo/js/telas/abertura.js` (tela de abertura).

**Fontes usadas:** só o `PROJETO.md` (seções 2 e 3) e conhecimento geral sobre os bichos e plantas de verdade (capivara, ipê-amarelo, taboa, bromélia, palmeira juçara). Ninguém usou capturas de tela, vídeos, figurinhas ou imagens de outros apps, séries ou personagens. Todo o desenho é código SVG escrito à mão, sem imagens externas, sem bibliotecas e sem filtros.

## Ficha da Pipoca

| | |
|---|---|
| Quem é | capivara caramelo, calma e animada; a única que fala no jogo (em 3ª pessoa) |
| Desenho | de frente, em pé, proporções de bichinho de pelúcia; `viewBox 0 0 250 270`, chão em y ≈ 263 |
| Cabeça | retângulo bem arredondado, **mais largo que alto** (192 × 132, cantos de raio 46), com o alto reto: a cabeça "de caixote" da capivara |
| Focinho | **bloco largo e escuro** (`#8A5634`) na metade de baixo do rosto (y 96 a 169); o alto é um arco suave e, embaixo, ele passa um pouco da borda da cabeça, como o nariz rombudo da capivara visto de frente |
| Narinas | duas ovais **deitadas**, bem separadas, no alto do focinho (centros em 105,5 e 144,5; altura 111), menores que os olhos e sem brilho (`#2B1A2E`, mais escuras que o contorno para aparecer no focinho escuro) |
| Boca | de roedor: risquinho no meio + "w" e **os dois dentinhos da frente** (a capivara é o maior roedor do mundo). Falando: boca oval com língua e os dentinhos; feliz: sorriso aberto em "D" |
| Olhos | pequenos e calmos, com o alto num arco baixo (pálpebra tranquila) e dois brilhos brancos, em (84, 80) e (166, 80); felizes = arquinhos |
| Orelhas | pequenas, redondas, nos cantos de cima, com o miolo mais escuro |
| Flor | **ipê-amarelo sempre do lado direito da cabeça (de quem olha)**, presa junto da orelha: cinco pétalas franzidas com covinha na ponta, veio dourado e miolo laranja |
| Corpo | barril caramelo (`#C98A55`) com a barriguinha clara (`#EBC594`); patinhas curtas e grossas com dois risquinhos que separam os dedos; pés como almofadinhas com três dedinhos |
| Sombra | elipse achatada no próprio SVG (nunca filtro) |
| Contorno | `#3A2A5A`, 5 px no tamanho original |

**Poses** (`PC.arte.pipoca(pose)`): `normal` (patinhas apoiadas na barriga), `fala` (uma pata explicando), `feliz` (braços para cima, olhos em arco, sorriso), `aponta` (pata direita apontando para a direita, olhar para a direita), `pensa` (pata no queixo, sobrancelhas, bolhinhas de pensamento), `danca` (um braço para cima e o outro para baixo, do lado oposto, e o pé direito chutando para o lado), `acena` (braço direito levantado, que balança).

**Camadas dos braços:** `fundo` (atrás do corpo inteiro: só aparece o que sai dele), `atras` (por cima do corpo e da barriga, atrás da cabeça) e `frente` (por cima de tudo). A raiz do braço não tem contorno, para sumir no corpo.

**Classes que o CSS do núcleo e outras telas usam** (não mudar): `pip-boca-aberta`, `pip-boca-fechada`, `pip-olhos`, `pip-piscar`, `pip-braco-aceno` (gira em volta de 184, 180), `pip-cabeca` (a tela de descanso põe olhos fechados e bocejo por cima e gira a cabeça) e `pip-flor`. O grupo `pip-boca-aberta` não tem `<g>` dentro: a figurinha da Pipoca com medalha (figurinhas.js) corta esse grupo até o primeiro `</g>`.

**Comparação com capivaras de desenho conhecidas.** Muitas capivaras de desenho são um "feijão" redondo, claro, com focinho pequeno e claro, olhos de pontinho meio fechados, às vezes com uma fruta em cima da cabeça ou em banho quente. Os traços em comum com qualquer capivara (cabeça grande, olhos e orelhas pequenos, nariz largo) vêm do bicho de verdade. Os traços próprios da Pipoca, que nenhuma delas tem junto: cabeça retangular mais larga que alta, focinho escuro em bloco que passa da borda da cabeça, narinas deitadas no alto desse bloco, os dois dentinhos aparecendo na boca fechada, a flor de ipê-amarelo do lado direito, barriguinha clara com patinhas de dedinhos e o contorno roxo-escuro do jogo. A Pipoca nunca carrega fruta na cabeça e não usa objetos de banho.

## Ícones

`viewBox 0 0 64 64`, contorno `#3A2A5A`, feitos para ler bem em 56 px (conferidos dentro dos botões branco, amarelo e verde). Nome desconhecido → círculo com "?" (aviso no console só com `PC.config.debug`). Lista (`PC.arte.nomesIcones()`): voltar, casa, falar, album, livre, cadeado, cadeado-ouro, cadeado-aberto, estrela, play, check, pronto, x, fechar, mais, menos, iguais, repetir, olho, limpar, engrenagem, som, som-desligado, voz, relogio, info, balde, alca, adulto, torre, juntar, separar, feirinha, sapinho, pintinhos, tracar, figurinha, e os sinônimos inicio (= casa), ouvir (= falar), de-novo (= repetir) e continuar (= play).

Regras de originalidade seguidas nos ícones: cubinhos sem rosto; a torre de três cubinhos é toda roxa (o padrão de 5 em 5 do jogo, nunca uma cor por quantidade); o pintinho é uma ave de perfil (bico, asinha, pezinhos e topetinho), nunca uma bolinha com olhos; o sapinho é o Pulo, verde-limão de bochechas rosadas; nenhum algarismo aparece como personagem.

## Cenários

`PC.arte.cenario(nome, opcoes)` → prado, lagoa, floresta e ceu (telas de menu). Coordenadas do palco virtual 1600 × 900, com sangria (`viewBox -1200 -700 4000 2300`) para cobrir telas de outras proporções; linha do chão em y ≈ 800. O meio do palco fica calmo (é onde a brincadeira acontece) e os enfeites moram no horizonte e no chão. O sol fica longe dos botões do HUD; `{ sol: false }` tira o sol. Sem filtros; formas da mesma cor vão juntas num caminho só (≈ 70 a 210 elementos por cenário).

Zonas que os cenários respeitam: faixa do HUD (y < 140), canto da Pipoca (x < 290, y > 600), faixa do balão (x < 570, y 380 a 600), balde (x ≈ 420), placa do alvo (x ≈ 1380, y ≈ 280) e botão Pronto/Pagar (x ≈ 1420, y ≈ 700).

- **Prado**: morros azulados ao longe, ipês-amarelos floridos com o tapetinho de flores caídas, uma cerquinha de madeira junto do ipê grande, florzinhas no campo e tufinhos de grama. Nada amarelo atrás do balde (para a copa não parecer mais cubinhos dourados) e nenhum ipê na faixa do balão.
- **Lagoa**: morros ao longe, mato e ipês na outra margem, água com faixas de brilho e estrelinhas, marolinhas, um pierzinho de madeira na beirada direita, taboas nos cantos, pedrinhas e florzinhas na margem de cá. Nenhuma vitória-régia no cenário (elas são da brincadeira do Sapinho).
- **Floresta**: árvores em três distâncias (as de longe mais claras), palmeiras juçara ao fundo (longe do balde e da placa do alvo), raios de sol entrando na mata (faixas que nascem transparentes), bromélias com flor vermelha, samambaias e cogumelos. Nenhuma árvore da frente atrás do botão Pronto/Pagar, que também é verde.
- **Céu**: o mais calmo, para menus: sol, nuvens, passarinhos, morros ao longe, ipês pequenos e poucas florzinhas.

## Abertura

Logo "Pipoca Conta" no alto (o pingo do "i" é a flor de ipê), a Pipoca grande à esquerda acenando, o botão verde **Jogar** com o ícone play (`data-teste="jogar"`) e o cadeado dos adultos no canto (`data-teste="pais"`, abre `PC.portao.pedir()` e só então a área dos pais). Tocar na Pipoca (`data-teste="pipoca"`): pulinho e "Oi! Eu sou a Pipoca! Vamos brincar com números?". Depois do primeiro toque, uma única vez: "Toque no botão verde para jogar!", com a Pipoca apontando e o botão balançando. Toques de adulto (no cadeado e no portão, que abre por cima da abertura) não contam como primeiro toque: se o adulto fecha o portão, o pedido acontece no primeiro toque da criança. No app, sem voz em português: aviso pequeno para o adulto preso ao cadeado ("Falta a voz em português: toque no cadeado"); com o aviso aberto, o balão fica mais estreito para não encostar nele. Três flores de ipê caem devagar, só em faixas livres (beirada esquerda, vão entre a Pipoca e o botão, direita do botão), nascendo abaixo do logo. O prado da abertura não tem sol: o logo é a estrela do céu e o canto do cadeado fica limpo.

## Notas datadas

### 06/11/2026 — primeira versão (construtor anterior do módulo de arte)

- Paleta da Pipoca tirada da ficha do PROJETO.md: caramelo `#C98A55`, focinho `#8A5634`; contorno `#3A2A5A` igual ao resto do jogo.
- Flor de ipê desenhada a partir da flor de verdade: corneta de cinco lóbulos franzidos, por isso cada pétala tem uma covinha na ponta e um veio dourado; miolo laranja com risquinhos avermelhados. A mesma flor vira o pingo do "i" do logo e as flores que caem na abertura.
- Primeira Pipoca: cabeça em retângulo arredondado com o focinho escuro por dentro da cabeça, braços em "salsicha", orelhas no alto, flor do lado direito. Olhos com o alto quase reto para dar o ar calmo; ficaram duas variantes de olho para comparar (uma de alto reto e outra um pouco mais redonda).
- Ícones: setas e sinais com contorno duplo (aparecem no branco, no amarelo e no verde dos botões); pintinho de perfil como ave; sapinho verde-limão com bochechas rosadas; balde com cubinhos; alça laranja com setas para cima e para baixo; adulto com duas pessoas.
- Cenários: céu em degradê, nuvens, sol com raios curtos e sem halo colorido (o halo amarelo sobre o azul ficava esverdeado), ipês-amarelos ao longe, taboas na lagoa, árvores redondas na floresta. O sol foi tirado de perto dos botões do HUD.
- Abertura: logo, Pipoca acenando, botão Jogar, cadeado, balão da fala, aviso de voz para o adulto e flores caindo.

### 07/11/2026, madrugada — refinamento (continuação da mesma tarefa)

- **Pipoca mais capivara.** O focinho virou um bloco largo que passa da borda de baixo da cabeça (antes era uma "máscara" por dentro, que lembrava focinheira de urso). Entraram os dois dentinhos de roedor na boca fechada, narinas mais escuras e bem separadas, orelhas um pouco maiores nos cantos e a flor presa junto da orelha direita. Os olhos subiram e se afastaram um pouco (84 e 166, altura 80), com o alto num arco baixo, perto da variante mais redonda, que combinou melhor com o focinho grande novo.
- Braços refeitos como cápsulas curtas e grossas sem contorno na raiz (a raiz some no corpo) e com risquinhos de dedos; na pose normal as patinhas ficam apoiadas na barriga (calma); o contorno do corpo é desenhado depois dos braços de trás para não abrir "dentes" no ombro. Pés com três dedinhos.
- A pata do `pensa` sai de um ombro mais para dentro, para a raiz não escapar do corpo. Todas as poses conferidas em tamanho grande (700 px) e pequeno (70 px).
- Ícone da torre todo roxo (três cubinhos = padrão de 5 em 5).
- Cenários com mais charme e menos elementos: morros azulados ao longe, nuvens com barriga azulada, cerquinha no prado, pierzinho e marolinhas na lagoa, palmeiras, bromélias e raios de sol na floresta; círculos da mesma cor juntos num caminho só. Ipês e palmeiras tirados de trás do balde, da placa do alvo e da Pipoca do canto (a pontinha amarela de uma copa aparecia em cima da cabeça dela, como um chapéu).
- `PC.arte.cenario(nome, { sol: false })` (opcional) e aviso no console para cenário desconhecido só com `PC.config.debug`.
- Abertura sem sol, flores caindo só em faixas livres, balão mais largo (a frase do botão verde cabe numa linha) e mais estreito quando o aviso de voz aparece.

### 07/11/2026, manhã — revisão final, ajustes e testes

- **Narinas.** Vistas em tamanho grande, as narinas inclinadas em "\ /" (ovais de 16 × 9) liam como um segundo par de olhos, bravos, dentro do focinho: o focinho parecia um rosto dentro do rosto. Foram comparadas onze variantes lado a lado, em tamanho grande e no tamanho do canto (inclinadas, em vírgula, em "Y" com vírgulas, em pé, em pé pequenas, redondas, deitadas, deitadas com brilho, com borda clara em cima, em feijão e com uma faixa clara por cima). Ficaram as **ovais deitadas** (13 × 8), menores que os olhos e sem brilho: leem como as narinas largas da capivara no alto do focinho e deixam a cara calma. Bolinhas redondas viravam olhos de novo; as vírgulas pareciam sobrancelhas bravas.
- **Dança.** O braço de baixo passou para a camada nova `fundo` (atrás do corpo): antes o contorno dele aparecia por dentro da barriga. O pé levantado, que ficava quase todo escondido e parecia um defeito na barra do corpo, agora sai de trás do corpo, inclinado, chutando para o lado.
- **Prado.** O ipê de x 262 ficava na faixa do balão da Pipoca: com o balão aberto, só o tronco aparecia embaixo dele, como um pauzinho. Foi para x 652 (no vão entre a Pipoca grande e o botão Jogar da abertura e entre o balde e a base da Torre).
- **Floresta.** Saiu a árvore escura da frente que ficava bem atrás do botão Pronto/Pagar (verde sobre verde).
- **Abertura.** O toque no cadeado e os toques no portão (que abre por cima da abertura) não contam mais como primeiro toque; antes, se um adulto abrisse e fechasse o portão, a criança nunca ouvia "Toque no botão verde para jogar!".
- Conferido nos tamanhos 1600×900, 1280×800, 1024×768 e, com toque, 915×412 e 800×360: abertura (apresentação, pedido do Jogar, portão, área dos pais, toques rápidos, aviso sem voz), Torre (rodadas com gestos, erro proposital, "Quer parar?", Parabéns com a Pipoca dançando), cenários com a Pipoca do canto e o balão, figurinha da Pipoca com medalha e a tela de descanso.

### 07/11/2026 — verificação independente

- **Abertura.** Se a criança tocasse na Pipoca e um adulto abrisse o cadeado durante a apresentação, a fala era cortada e o pedido "Toque no botão verde para jogar!" nunca vinha (o primeiro toque já tinha sido gasto). Agora, quando o portão fecha sem que o pedido tenha sido feito, o próximo toque da criança volta a pedir o Jogar.
- Conferidos de novo, sem mudar o desenho: as 7 poses e os 41 ícones (botão verde de 56 px; nome desconhecido com "?" e sem aviso fora do modo debug), os cenários lagoa, floresta e céu na Torre em 1024×768 e 800×360, a abertura com e sem voz e a Torre com erro proposital, dois dedos e toques rápidos no balde, nos cinco tamanhos.
