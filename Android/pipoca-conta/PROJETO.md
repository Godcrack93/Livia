# Pipoca Aprende — projeto e contrato técnico (versão 3)

Documento de referência para todos que trabalham no jogo (pessoas e agentes). A versão 2 incorpora seis revisões independentes: pedagogia, experiência da criança, originalidade, Android e cobrança, políticas do Google Play e arquitetura. Se algo aqui mudar, atualize este arquivo primeiro.

## 1. Visão geral

| | |
|---|---|
| Nome | **Pipoca Aprende** (na loja: "Pipoca Aprende: letras e números"). Até novembro de 2026 se chamava Pipoca Conta e só tinha números. |
| Público | crianças de 4 a 6 anos que ainda não leem: toda instrução é **falada e mostrada** (número grande, pontinhos, mãozinha) |
| Plataforma | Android (tablet e celular), sempre deitado, funciona sem internet |
| Modelo | **zero anúncios**; teste grátis de 7 dias e **assinatura mensal** pelo Google Play Billing; estações 1 a 4 sempre grátis |
| Idioma | português do Brasil |
| Stack | jogo em HTML/CSS/JavaScript puro (sem framework, sem build) dentro de um app Android (Kotlin) com WebView — o mesmo padrão do `Android/parafusinhos` |

O jogo ensina **letras** (consciência de sílabas e rimas, as vogais e 12 consoantes pelo nome, letra inicial, traçado das letras de forma, maiúsculas e minúsculas, montar e ler palavras simples) e **números**: contar e produzir quantidades (até 20), reconhecer quantidades de relance, comparar (mais, menos, igual), o zero ("nenhum"), escrever os algarismos de 0 a 10, juntar (soma), separar (subtração), amigos do 10, dezena e unidades, sequências (de 1 em 1, para trás, de 2 em 2, de 10 em 10 até 100) e um pouco de dinheiro de brinquedo (pagar e dar troco de 5).

## 2. Originalidade (obrigatório)

O jogo usa mecânicas comuns de materiais educativos (cubos de encaixe, quadro de 10, reta numérica, mercadinho, traçado de algarismos), mas **não pode lembrar nenhum produto existente, em especial os Numberblocks**.

- Cubinhos são **peças de brinquedo de encaixe**: sem rosto, olhos, braços, pernas ou nome. Nunca desenhe um número como personagem.
- **Nenhum algarismo flutua sobre torres, cubinhos ou bichos.** O número de uma torre fica numa plaquinha presa na base.
- **A cor nunca depende da quantidade.** Padrão de 5 em 5: cubinhos 1–5 roxos e 6–10 dourados (o mesmo de 11 a 20). Com várias torres, cor e estampa seguem o papel da torre na rodada e são sorteadas (`PC.cores.sortearTorres`). Ao juntar, as partes mantêm cor e estampa; a torre nunca "se transforma".
- **Só a Pipoca fala**, em 3ª pessoa ("Agora tem três!"). Cubinhos e torres só fazem movimentos de peça (encaixar, cair, brilhar na contagem).
- Torres: pilha única, ou dezena presa com fitinha mais unidades. Nunca quadrados ou retângulos de cubinhos.
- Nada de bichinhos em forma de bolinha com olhos para contar. Os pintinhos são aves (bico, asinhas, pezinhos, topetinho) em cor creme.
- Sons e músicas totalmente originais.
- Palavras proibidas no jogo, na loja e na divulgação: Numberblocks, Numberblobs, Numberland, numberling, Alphablocks, Colourblocks, Blue Zoo, CBeebies, BBC, Unifix, MathLink, "Pintinho Amarelinho", "Pipoquinha", "Pipokinha".
- Não acrescentar: quiz com apresentador, níveis por cor, loja de um personagem, casas e fantasias de personagens, pintura em realidade aumentada.
- Quem desenha e programa usa só este documento e fontes pedagógicas — nunca capturas de tela ou vídeos de outros apps ou séries.

## 3. Personagens e visual

**Ficha da Pipoca** (traços fixos): macaquinha de pelo marrom (`#9A6338`), sentada de frente como um bichinho de pelúcia: cabeça grande e redonda com orelhas redondas dos lados, **rosto clarinho em forma de coração** (`#F3D3A8`), olhos redondos e brilhantes, narizinho de dois pontinhos, topetinho, barriga, mãos e pés clarinhos, braços compridos e rabo comprido enrolado (do lado esquerdo). **Flor amarela de ipê sempre do lado direito da cabeça (de quem olha)**: é a marca dela. Calma e animada. Poses: `normal`, `fala`, `feliz`, `aponta`, `pensa`, `danca`, `acena`. (Até novembro de 2026 a Pipoca era uma capivara; a versão antiga está guardada em `guardado/pipoca-capivara/`.)

Outros: **Pulo** (sapinho verde-limão de bochechas rosadas), **pintinhos** (aves creme com topetinho), fregueses da feirinha (**tucano, arara e quati**). Estilo: formas arredondadas, cores vivas e suaves, contorno `#3A2A5A`, sombra como elipse achatada desenhada no próprio SVG (sem filtros). Tudo em código (SVG/CSS). Fonte **Fredoka** (500/600/700) em `jogo/fontes/`. Cenários: **Prado**, **Lagoa**, **Floresta** (e `ceu` para telas de menu).

## 4. Telas e navegação

```
abertura ──Jogar──> mapa ──estação──> atividade (──> Parabéns ──> mapa)
   │                 ├──Álbum──> album
   │                 ├──Brincar livre──> livre
   │                 └──cadeado dos adultos──[portão]──> pais
   └──cadeado dos adultos──[portão]──> pais ──> assinatura (paywall) ──> pais
limite diário atingido ──> descanso (só um adulto libera, pelo portão)
```

1. **Abertura**: logo, Pipoca acenando (tocar nela: ela se apresenta), botão grande **Jogar** (ícone play), cadeado pequeno dos adultos no canto. Se a voz do aparelho não estiver disponível, um aviso pequeno para o adulto ("Toque no cadeado: falta a voz em português").
2. **Mapa (trilha)**: caminho que rola para os lados com o dedo (com inércia), atravessando Prado, Lagoa e Floresta. Ao abrir, rola sozinho até a estação atual, com a Pipoca em cima dela, apontando. Estados de estação:
   - **concluída**: colorida, com estrelinha e, ao lado, o bichinho da figurinha ganha ("o mundo cresce");
   - **atual (disponível)**: colorida e pulsando (a única que pulsa);
   - **bloqueada pela ordem**: cinza com cadeado; tocar → "Primeiro esta aqui!" e a Pipoca aponta a atual;
   - **fechada (assinatura)**: cinza com cadeado simples (nunca dourado, sem brilho); tocar → fala neutra "Essa ainda está fechadinha. Vamos brincar nesta?" e aponta uma estação liberada. **Nunca abre portão nem oferta.**
   Botões: Início (casinha), Álbum, Brincar livre, cadeado dos adultos.
3. **Atividade**: moldura com cenário da região, HUD (voltar, bolinhas das rodadas, ouvir de novo), a Pipoca no canto. O voltar (HUD ou Android) pergunta **"Quer parar?"** (casinha = sair; play grande pulsando = continuar; sem resposta em 8 s, continua). A rodada em andamento fica guardada e a estação recomeça dali.
4. **Parabéns**: confete, Pipoca dançando, figurinha nova; os botões aparecem depois da animação: **Continuar** (grande, verde, pulsando, ícone play) e **De novo** (menor, ícone de seta circular). "De novo" sorteia números novos.
5. **Álbum ("álbum que brinca")**: duas cenas por região (Prado, Lagoa e Floresta, cada uma com a cena "123" dos números e a "ABC" das letras); cada figurinha ganha fica colada no seu lugar da cena; tocar nela → som, pulinho e a Pipoca diz o nome. As que faltam aparecem como moldura tracejada vazia (sem silhueta, sem "?"). Contador "12 de 60".
6. **Brincar livre**: mesa com balde de cubinhos; montar, juntar e separar à vontade; cada torre com sua plaquinha; tocar numa torre → a Pipoca conta. **Grátis limitado** (até 2 torres e 10 cubinhos por torre); com assinatura, até 8 torres e 20 cubinhos. Botão de limpar.
7. **Área dos pais** (depois do portão; textos com no mínimo 34 px virtuais): assinatura (estado, ver planos, restaurar, gerenciar, "tenho um código de acesso"), voz (volume, "falar mais devagar", aviso e botão "instalar voz em português" se faltar), efeitos sonoros liga/desliga, tempo de uso (hoje e semana), limite diário (desligado, 15, 30, 45, 60 min; aviso visível quando ligado), esconder ofertas de assinatura, progresso por estação (vezes, erros, dicas, tempo) e **zerar progresso** (confirmação dupla), privacidade (resumo + link para a política), créditos e licenças (Fredoka, SIL OFL 1.1), versão. No navegador: "Simular assinatura (só no navegador)".
8. **Assinatura (paywall)**, aberta só pela área dos pais. Dois estados, conforme o Google Play:
   - **com teste disponível**: "Experimente 7 dias grátis. Depois, R$ X por mês, cobrados automaticamente na sua conta Google Play todo mês até você cancelar. Cancele até o fim do teste e não paga nada. Para cancelar: Google Play > Pagamentos e assinaturas > Assinaturas. Sem assinar, as estações 1 a 4 continuam liberadas." + o que a assinatura libera (56 estações, Brincar livre completo) + botão **Começar teste grátis**;
   - **sem teste**: o mesmo texto sem o teste + botão **Assinar por R$ X por mês**.
   O preço vem sempre do Google Play. Sem preço (sem internet ou Play indisponível): botão desligado e "Conecte à internet para ver o preço". Compra pendente: "Aguardando pagamento ou aprovação". Play indisponível (ex.: modo infantil do fabricante): "O Google Play não está disponível neste aparelho". Nunca usar a moedinha da feirinha como ícone de compra. X grande para fechar.
9. **Portão dos adultos** (`PC.portao.pedir()` → Promise<boolean>, uma camada por cima da tela atual): "Para adultos: toque nos números sete, dois, nove." Três números por extenso (sem sequências fáceis como 1-2-3 ou 1-1-1), teclado 1 a 9, **sem voz**, X grande para fechar; errou → desafio novo; 3 erros seguidos → espera de 5 s; 20 s sem toque → fecha (false). Protege: área dos pais, assinatura, assinar, gerenciar, links externos, liberar tempo.
10. **Descanso**: quando o limite diário acaba, a Pipoca boceja e se despede ("Hora de descansar! Até amanhã!"). Só um adulto (portão) libera mais tempo hoje.
11. **Gire o aparelho**: se a janela ficar em pé, aparece a Pipoca pedindo para girar (núcleo).

## 5. Atividades

Regras gerais (valem para todas): não existe "perdeu"; **toda ação de arrastar tem alternativa só com toques**; soltar fora do lugar devolve o objeto sem contar como erro (`ctx.errou()` só para decisão errada); zonas de soltura "ímã" (acendem quando o objeto passa por cima e aceitam a até ~1 objeto de distância); alvos de toque com no mínimo 140 px virtuais (a área de toque pode ser maior que o desenho); a primeira rodada com `demo: true` começa com a Pipoca demonstrando uma vez com a mãozinha; feedback de erro **descritivo e neutro** ("Deu sete. Precisamos de cinco."), "Quase!" só quando errou por um; nas escolhas (bolhas, botões), a opção errada sai de jogo depois do erro e só o primeiro toque vale até o retorno terminar.

### 5.1 Torre — produzir N
- **Balde de cubinhos** à esquerda (x ≈ 420, fonte infinita), **base** no chão (x ≈ 850), **plaquinha do alvo** à direita (algarismo; pontinhos só se `params.pontos`). Instrução: "Monte uma torre de cinco cubinhos!" (com `mostrar: 5` no balão).
- Pôr: arrastar do balde até a torre **ou tocar no balde** (um cubinho voa por vez; toques extras são ignorados enquanto ele voa). Tirar: arrastar o de cima para fora **ou tocar na torre** (tira o de cima).
- `vozTotal: true`: a voz diz o novo total a cada cubinho (só nas primeiras estações). Sem isso, só um som de encaixe com nota subindo; a criança conta.
- `confirmar: false` (tutorial): quando a torre fica com N, a Pipoca conta tudo e a rodada acaba. `confirmar: true`: botão grande **Pronto** (ícone ✓); a Pipoca conta tudo; se não for N: "Temos quatro. Precisamos de cinco. Coloque mais um!" → `ctx.errou(...)`.
- Ao completar 10: a fitinha aparece com "Dez! Uma dezena!". `dezenaPronta: true`: o balde oferece também uma **dezena pronta** (barra de 10), que entra de uma vez ("Já temos dez! Ponha mais três").
- `modo: 'comparar'` (estação 18): rodadas alternando "Faça uma torre igual a esta", "Faça uma torre com um a mais" e "Qual torre tem mais?" (duas torres prontas; tocar na maior; inclui rodada com a mesma quantidade → botão "iguais").
- `params`: `{ min, max, rodadas, demo, pontos, vozTotal, confirmar, dezenaPronta, modo }`.

### 5.2 Juntar — compor N (soma)
- Torres prontas no chão (2 a 4), cada uma com cor + estampa de `PC.cores.sortearTorres(k)`, e a placa do alvo N.
- Juntar: arrastar uma torre sobre outra **ou tocar numa e depois na outra** (a primeira fica destacada). A área de toque é a coluna inteira da torre, com folga.
- Ao juntar: as partes mantêm cor e estampa, aparece numa lousinha a conta ("3 + 2 = 5"), a voz fala "Três mais dois... cinco!". Se der N: acerto ("Três e dois fazem cinco!"; no alvo 10: "Três e sete são amigos do dez!" e um quadro de 10 em duas cores). Se não: "Deu sete. Precisamos de cinco." e, depois de 1,2 s, as torres se separam e voltam ao lugar.
- Gerador: sempre existe um par que dá N; **toda torre tem menos de N**; as que sobram têm valores próximos dos certos (não dá para acertar só pela altura); com 2 torres, as duas dão N (tutorial).
- `params`: `{ alvoMin, alvoMax, torres: 2|3|4, rodadas, demo }`.

### 5.3 Separar — retirar até ficar N (subtração)
- Uma torre de T cubinhos (padrão de 5 em 5) e a placa do alvo N (0 ≤ N < T).
- Tirar: **tocar na torre tira o cubinho de cima** (ele pula para uma pilhinha ao lado); ou arrastar a **alça grande** (mãozinha/tesourinha ao lado da torre) até a altura certa e soltar: tira vários de uma vez. Pode tirar várias vezes; devolver também é possível (tocar na pilhinha).
- Ficou mais que N: "Ficaram seis. Tire mais!" (não é erro). Ficou menos que N: erro descritivo ("Ficaram duas. Precisamos de três.") e a criança devolve. `confirmar: false`: acerta ao ficar com N. `confirmar: true`: botão **Pronto**.
- Acerto: "Eram sete, tiramos três, ficaram quatro!" e a conta `7 − 3 = 4`.
- `dezena: true` (estação 28, T de 11 a 19): dois tipos de rodada — **tirar só unidades** (N de 10 a T−1) ou **tirar a dezena inteira** (N = T − 10; a dezena se move inteira com `t.separarDezena()`): "Quatorze menos dez... ficaram quatro!".
- `params`: `{ totalMin, totalMax, rodadas, demo, confirmar, dezena }`.

### 5.4 Feirinha da Pipoca — moedinhas
- Barraca de feira (toldo listrado, caixotes) com 3 ou 4 produtos brasileiros (banana, manga, abacaxi, caju, laranja, melancia, goiaba, milho, coco, pão de queijo, tapioca, paçoca), cada um com plaquinha de preço (algarismo e pontinhos). Um freguês (tucano, arara ou quati) vem comprar.
- Moedas de brinquedo **de tamanhos diferentes**: 1 (pequena, bronze, 1 pontinho), 2 (média, prateada, 2 pontinhos), 5 (grande, dourada, 5 pontinhos como no dado), e a **notinha de 10** (estilizada). Nunca imitam o Real. O preço é dito sem a palavra moedinha: "A banana custa três."
- **Comprar**: arrastar moedas do cofrinho para o balcão **ou tocar numa moeda** (ela vai para o balcão; tocar na que está no balcão a devolve). A voz conta **a partir do total anterior** ("três... quatro, cinco!" ao pôr uma moeda de 2 sobre 3). `confirmar: false`: acerta quando o total bate. `confirmar: true`: botão **Pagar**; se o total não bater, erro descritivo e a criança corrige.
- Preços: estação 17 pede no máximo uma moeda de 2; estação 25 tem solução curta (7 = 5 + 2).
- **Troco** (estação 29): o freguês paga com uma moeda de 5 um produto de 1 a 4. No balcão, um **quadro de 5** com P casas já ocupadas pelo preço; a criança completa as casas vazias com moedas de 1 até a mão do freguês; a voz conta a partir do preço ("custa três... quatro, cinco! Dois de troco"). Botão **Pronto**.
- `params`: `{ modo: 'comprar'|'troco', precoMin, precoMax, moedas: [1] | [1,2] | [1,2,5], pagaCom: 5, rodadas, demo, confirmar }`.

### 5.5 Sapinho — sequências na reta numérica
- Lagoa com uma fileira **em linha reta** de vitórias-régias, números crescendo para a direita. O sapinho Pulo anda folha por folha e a voz diz o número de cada folha em que pousa.
- A próxima folha vazia mostra "?"; 3 bolhas de número boiam na água (balançam sem girar). Acertou: o número vai para a folha e o Pulo pula. Errou: a bolha afunda (sai de jogo) e há retorno com conteúdo ("Esse é o sete. Vamos contar: cinco, seis...?").
- Regras do gerador: as duas primeiras folhas e a última sempre visíveis; até a estação 27 (a 14ª de números), nunca duas lacunas seguidas; bolhas erradas nunca negativas nem repetidas, de preferência o erro típico (passo 1: n−1 e n+1; passo −1: o número de contar para frente; passo 2: n−1 e n+1; passo 10: n−9 e n+10).
- Instruções com as palavras da BNCC: "Qual número vem depois do quatro?", "E qual fica entre o seis e o oito?". Às vezes com ordinais: "O Pulo está na terceira folha."
- **Contagem regressiva** (passo −1): as folhas continuam crescendo para a direita; o Pulo começa no 10, à direita, e pula para a esquerda: "dez, nove, ..., um, zero!".
- **2 em 2**: embaixo de cada folha, os pares acumulados (2, 4, 6... como pares de pontinhos). **10 em 10** (`barras: true`): embaixo de cada folha, barras de dez iguais à dezena da Torre (a folha 30 mostra três barras).
- `params`: `{ inicio, passo, quantidade, lacunas, rodadas, demo, barras }`.

### 5.6 Pintinhos — quantos são?
- **contar**: pintinhos à vista; tocar em cada um marca (pintinho já marcado só pia, não conta de novo). `vozConta: true`: a voz conta junto a cada toque; senão o toque só marca e quem conta é a criança. Quando todos estiverem marcados, aparecem 3 botões grandes de algarismo; a Pipoca lê as opções apontando ("É três, quatro ou cinco?").
- **olhadinha**: a criança toca na cerca e os pintinhos aparecem por `tempo` ms (arrumados como dado, soltos ou no quadro de 10), depois se escondem. Escolhe o número. O olho de espiar pulsa como primeira ajuda; depois de um erro, o tempo de exibição aumenta.
- **comparar**: dois cercadinhos; "Qual tem mais?" — tocar no cercadinho com mais; algumas rodadas com a mesma quantidade (botão "iguais"); rodadas com zero ("Nenhum! Zero pintinho").
- `params`: `{ modo: 'contar'|'olhadinha'|'comparar', min, max, arranjo: 'dado'|'solto'|'quadro10', tempo, rodadas, demo, vozConta }`.

### 5.7 Traçar — escrever os algarismos
- Lousa (madeira + verde-lousa) com o algarismo grande pontilhado no **mesmo desenho da Fredoka** (1 com bandeirinha, 4 aberto), setinhas no sentido do traço e bolinha verde no início. Traços de cima para baixo; o 0 como a letra O, começando no alto e indo para a esquerda.
- Os traços de cada algarismo ficam em dados no arquivo (pontos de controle, início, sentido, número de traços). Arrastar o dedo pinta de giz; é preciso passar pelos pontos de controle em ordem; a **tolerância é medida em dp** (≈ 1 cm para cada lado). Levantar o dedo não apaga: continua do último ponto alcançado. Sair muito do caminho só para de pintar.
- Ao terminar: o número brilha, a voz diz o número e aparecem N estrelinhas arrumadas num quadro de 10, contadas. No 0: "Zero! Nenhuma estrelinha." (quadro vazio). O 10 é traçado como 1 seguido de 0.
- `params`: `{ digitos: [...], demo }` (uma rodada por algarismo).
- **Letras** (estações de português): `params: { letras: ['A', 'E'], demo }`. A mesma lousa com a **letra de forma maiúscula** pontilhada, no desenho da Fredoka, com os traços na ordem ensinada na escola (de cima para baixo e da esquerda para a direita; letras de mais de um traço mostram o número do traço só pela bolinha verde de início de cada um, sem algarismo). Ao terminar: a letra brilha, a Pipoca diz "Á! Á de arara!" (nome da letra + uma palavra do banco que começa com ela) e a figura da palavra aparece ao lado da lousa no lugar das estrelinhas. Letras desta versão: A E I O U P B M L T V C D F R N J.

### 5.8 Regras das brincadeiras de letras (valem para 5.9 a 5.14)
- Público: 4 a 6 anos, **que ainda não leem**. Toda instrução é falada; a criança decide olhando figuras, cartinhas e ouvindo.
- **Banco de palavras**: `PC.palavras` (`js/palavras.js`): palavras em maiúsculas de forma, separadas em sílabas, com figura (objeto desenhado em `palavras-arte-*.js` ou o bicho do álbum), letra inicial e grupo de rima. Use só ele (não invente palavras soltas no código da atividade). Sorteios com `PC.util.escolher/embaralhar`.
- **Voz**: a palavra é falada com `PC.palavras.nome(p)`; uma sílaba sozinha com `PC.palavras.falaSilaba('BA')` → "bá"; uma letra com `PC.palavras.falaLetra('B')` → "bê". **Nunca** peça nem fale o som isolado de uma consoante ("fff"). Frases curtas, sem algarismos.
- **Letras sem rosto**: letras aparecem só em cartinhas, lousa, plaquinhas, folhas e ovinhos (Fredoka 700, contorno `#3A2A5A`). Nunca olhos, boca, braços, pernas ou nome de personagem (PROJETO.md 2).
- **Figuras**: `PC.palavras.desenho(p)` devolve um SVG 200×200 (use num `<img src="data:image/svg+xml...">` ou `innerHTML`); a figura sempre vem num cartão branco arredondado de pelo menos `alvoPrincipal` (170 px) quando é tocável.
- Cores das cartinhas: papel creme `#FFF8E6`, letra `#3A2A5A`; a cor nunca indica a resposta.
- Retornos de erro descritivos e gentis ("Essa é a bola. Bola começa com bê."), dicas em degraus pela moldura (6.2), medalhão próprio registrado com `PC.arte.registrarMedalhao` (veja `js/medalhoes.js`).

### 5.9 Tambor das sílabas (`tambor`)
- A figura da palavra no alto (cartão), um **tamborzinho** grande no chão (x ≈ 850) e uma fileira de bolinhas vazias abaixo da figura (uma por toque, até 5) e o botão **Pronto** (x ≈ 1420, y ≈ 700).
- A Pipoca diz: "Bata no tambor: um toque para cada pedaço. Banana!". Cada toque no tambor acende uma bolinha (som de tambor, o tambor pula). Tocar numa bolinha acesa apaga a última (desfazer). Pronto: a Pipoca bate junto, devagar, falando as sílabas ("ba… na… na…") e acendendo uma por uma; certo → acertou; errado → retorno "Banana tem três pedaços: ba, na, na."
- `params`: `{ silabas: [min, max], bichos, rodadas, demo }`. Ajuda (nível 2): a Pipoca fala a palavra bem devagar, separando as sílabas, sem bater.

### 5.10 Com que letra começa? (`inicial`)
- **modo letra** (padrão): a figura grande à esquerda do centro; à direita, 2 ou 3 **cartinhas** grandes com letras maiúsculas. "Arara! Com que letra começa arara?". Toque na cartinha. Certo: "Á! Arara começa com á!". Errado: "Essa é a letra ó. Arara começa com á." As letras da rodada vêm de `params.letras`; as cartinhas erradas também (ou vogais, se faltar).
- **modo bicho**: uma cartinha grande com a letra e 3 figuras para escolher: "Qual começa com bê?".
- `params`: `{ modo: 'letra' | 'bicho', letras: [...], opcoes: 2 | 3, rodadas, demo }`. Ajuda: a Pipoca repete a palavra devagar, esticando o começo ("Aaa… rara"), e a cartinha certa dá um pulinho.

### 5.11 Rimas (`rimas`)
- **modo rima** (padrão): a figura-modelo à esquerda ("Pato!") e 2 ou 3 figuras para escolher: "Pato rima com…?". Só uma rima (mesmo grupo em `PC.palavras.gruposDeRima()`). Certo: "Pato, gato! Rimou!". Errado: a figura sai de jogo e a Pipoca diz só que não rima e repete a pergunta, **sem entregar a resposta** ("Bola não rima. Pato rima com…?"); as dicas em degraus ajudam nos erros seguintes.
- **modo intruso**: 3 figuras, duas rimam: "Qual não rima?". Errado: "Pato rima com gato. Qual não rima?". Certo: "Isso! Bola não rima. Pato, gato!".
- Falas sempre curtas e inteiras: nunca juntar numa frase só duas palavras sorteadas que não rimam ("bola não rima com pato"), porque cada combinação vira uma gravação (milhares de vozes).
- `params`: `{ modo: 'rima' | 'intruso', opcoes, rodadas, demo }`. Ajuda: a Pipoca fala cada figura destacando o fim ("pa-TO… ga-TO…").

### 5.12 Montar a palavra (`montar`)
- A figura no alto e, abaixo, espaços vazios (um por sílaba). As sílabas vêm em **folhinhas** soltas no chão (embaralhadas, mais `despiste` sílabas que não fazem parte). Tocar numa folhinha: a Pipoca fala a sílaba. Arrastar até um espaço: se for a sílaba certa daquele espaço, encaixa; senão volta e retorno ("Essa é bá. Aqui vai pá."). Os espaços se preenchem em qualquer ordem. Completa: a Pipoca lê a palavra pelas sílabas e inteira ("Pa… to… Pato!").
- `params`: `{ silabas: [min, max], despiste, bichos, rodadas, demo }`. Ajuda: a Pipoca fala a sílaba que falta e a folhinha certa pulsa.

### 5.13 Pares de letras (`pares`)
- Ninhos no alto com **maiúsculas** (plaquinha no ninho) e ovinhos embaixo com as **minúsculas**. Arrastar cada ovinho para o ninho da mesma letra. Certo: "Á grande e á pequeno!" e o ovinho encaixa. Errado: volta com "Esse é o bê pequeno.". A rodada termina com todos os pares.
- `params`: `{ letras: [...], pares: 3 | 4, rodadas, demo }`. Ajuda: o ninho certo do ovinho que a criança pegou brilha.

### 5.14 Ler palavrinhas (`ler`)
- A palavra escrita grande numa plaquinha, com as sílabas levemente separadas (cada sílaba é tocável e falada sozinha), e 2 ou 3 figuras abaixo. A Pipoca **não** fala a palavra na instrução: "Leia comigo! Que palavra é essa?" Toque na figura. Certo: a Pipoca lê ("Pa… to… Pato!"). Errado: "Essa é a bola. Leia de novo: toque nos pedacinhos."
- `params`: `{ silabas: [min, max], opcoes, rodadas, demo }`. Ajuda (nível 2): a Pipoca fala as sílabas uma por uma, acendendo cada uma, sem juntar.

## 6. Regras comuns

### 6.1 Voz
- A voz é o canal principal. Frases curtas (até ~8 palavras), com o número no fim.
- Contagem sempre no masculino ("um, dois, três"), em ordem, sem pular número; toda contagem termina com o total e o substantivo: "...quatro, cinco. Cinco cubinhos!" (`PC.voz.contar(n, {substantivo})`).
- Concordância: `PC.voz.quantidade(n, 'moedinha', 'moedinhas', {feminino: true})` → "uma moedinha", "duas moedinhas", "vinte e uma figurinhas". Femininos: moedinha, torre, folha, estrelinha, figurinha. Masculinos: cubinho, pintinho, número.
- **Nunca mande algarismos ao TTS** (o `PC.voz.falar` troca por extenso como garantia, mas a concordância é sua).
- 16 a 19 com estrutura: `PC.voz.dezEMais(17)` → "dez e mais sete... dezessete".
- Operações: "Três mais dois... cinco!", "Eram sete, tirei três, ficaram quatro", "A torre ficou com quatro. Precisamos de três."
- Grafia brasileira: dezesseis, dezessete, dezenove, quatorze, cinquenta, cem.
- Velocidade ~0,9 (os pais podem deixar mais devagar); os pais **não desligam** a voz, só ajustam volume e velocidade; efeitos sonoros podem ser desligados.

### 6.2 Erros e dicas em degraus (a moldura comanda)
- `ctx.errou({fala})`: a moldura toca o som suave, a Pipoca fala o retorno descritivo e decide a ajuda: 1º erro → só o retorno; 2º erro → `controle.ajudar(2)` (apoio que ensina: recontar, o Pulo volta e conta até a lacuna, contar as moedas do balcão, "três e dois... precisamos de cinco"); 3º erro → mãozinha com `controle.proximoGesto()`.
- Inatividade (só conta quando a criança pode agir: pausa durante falas, contagens, animações marcadas com `ctx.ocupado(true)` e arrastes): 7 s → repete a instrução; 15 s → mãozinha. Depois disso, para até o próximo toque.
- `ctx.avancou()` em acertos parciais (cada lacuna do Sapinho, cada moeda certa) zera os erros seguidos.

### 6.3 Cubinhos
- Peça quadrada com pino em cima, brilho e contorno; 64 px virtuais.
- Até 10: uma pilha. 10: pilha com **fitinha** (a dezena). 11 a 20: dezena à esquerda + unidades à direita; 20 = duas dezenas (duas fitinhas). Tirar um cubinho de uma dezena desfaz a fitinha.
- Cores: padrão de 5 em 5 (roxo 1–5, dourado 6–10) na Torre, Separar e Brincar livre; na Juntar, `PC.cores.sortearTorres(k)` (cor + estampa: listras, bolinhas, xadrez). Nunca uma cor por quantidade.
- Nunca exija tocar num cubinho isolado: use a torre inteira (com folga) ou alças grandes.

### 6.4 Rodadas e estação
Ao acertar uma rodada, a moldura congela a rodada, comemora (som, elogio variado, confete leve, bolinha acesa) e passa para a próxima. Depois da última: Parabéns + figurinha. Meta de duração: 1 a 3 minutos por estação.

### 6.5 Sem truques para prender a criança
Sem notificações, sem sequência de dias, sem prêmio diário, sem contagem regressiva, sem Pipoca triste quando a criança sai, sem recompensa por tempo de uso, sem itens aleatórios (as figurinhas são fixas por estação). Motivos bons para voltar: mundo que cresce no mapa, álbum que brinca, comemorações variadas, "De novo" sempre com números novos.

## 7. Trilha (60 estações)

60 estações intercaladas: as **ímpares são de números** e as **pares são de letras** (`jogo/js/fases.js`). Regiões: Prado 1–20, Lagoa 21–40, Floresta 41–60. As 4 primeiras são grátis (2 de números e 2 de letras). `demo` = demonstração na 1ª rodada; `conf` = botão Pronto/Pagar. No mapa, as estações de letras têm o anel rosa.

### 7.0 Números (a estação no mapa é 2 × # − 1)

| # | Região | Atividade | Parâmetros | BNCC |
|---|---|---|---|---|
| 1 | Prado | Torre | 1–3, 3 rodadas, demo, pontos, vozTotal | EI03ET07 |
| 2 | Prado | Pintinhos | contar 1–4 solto, 4 rodadas, demo, vozConta | EI03ET07 |
| 3 | Prado | Traçar | 1, 2, 3, demo | EI03ET04 |
| 4 | Prado | Juntar | alvo 3–4, 2 torres, 3 rodadas, demo | EF01MA06 |
| 5 | Prado | Pintinhos | comparar 0–5, 4 rodadas, demo | EI03ET01, EF01MA03 |
| 6 | Prado | Torre | 3–5, 4 rodadas, pontos, conf | EI03ET07, EF01MA02 |
| 7 | Prado | Feirinha | comprar 1–3, moedas [1], 3 rodadas, demo | EF01MA07 |
| 8 | Prado | Pintinhos | olhadinha 1–5 dado, 2500 ms, 5 rodadas, demo | EF01MA04 |
| 9 | Prado | Sapinho | 1→5, 1 lacuna, 2 rodadas, demo | EI03ET07, EF01MA10 |
| 10 | Prado | Separar | 3–5, 3 rodadas, demo | EF01MA08 |
| 11 | Lagoa | Traçar | 4, 5, 6 | EF01MA04 |
| 12 | Lagoa | Torre | 6–8, 3 rodadas, conf | EF01MA02 |
| 13 | Lagoa | Pintinhos | contar 5–10 solto, 4 rodadas | EF01MA02, EF01MA04 |
| 14 | Lagoa | Juntar | alvo 5–7, 3 torres, 4 rodadas | EF01MA06, EF01MA07 |
| 15 | Lagoa | Sapinho | 1→10, 3 lacunas, 2 rodadas | EF01MA10 |
| 16 | Lagoa | Traçar | 7, 8, 9 | EF01MA04 |
| 17 | Lagoa | Feirinha | comprar 3–6, moedas [1,2], 4 rodadas, conf | EF01MA07 |
| 18 | Lagoa | Torre | comparar (igual, um a mais, qual tem mais), 1–10, 4 rodadas, demo | EF01MA03, EF01MA05 |
| 19 | Lagoa | Separar | 6–10, 4 rodadas, conf | EF01MA08 |
| 20 | Lagoa | Juntar | alvo 10 (amigos do 10), 4 torres, 4 rodadas | EF01MA06, EF01MA07 |
| 21 | Floresta | Pintinhos | olhadinha 4–10 quadro10, 3000 ms, 5 rodadas | EF01MA04 |
| 22 | Floresta | Traçar | 0 e 10 | EF01MA04 |
| 23 | Floresta | Torre | 11–15, dezena pronta, 3 rodadas, conf, demo | EF01MA07 |
| 24 | Floresta | Sapinho | 10→20, 3 lacunas, 2 rodadas | EF01MA10 |
| 25 | Floresta | Feirinha | comprar 5–10, moedas [1,2,5], 4 rodadas, conf | EF01MA07 |
| 26 | Floresta | Sapinho | 10→0 (para a esquerda), 3 lacunas, 2 rodadas, demo | EI03ET07, EF01MA10 |
| 27 | Floresta | Sapinho | 2 em 2 até 20, 3 lacunas, 2 rodadas, demo | EF01MA10 |
| 28 | Floresta | Separar | 11–19 com dezena, 4 rodadas, conf, demo | EF01MA07, EF01MA08 |
| 29 | Floresta | Feirinha | troco de 5 (preço 1–4), 3 rodadas, conf, demo | EF01MA08 |
| 30 | Floresta | Sapinho | 10 em 10 até 100 com barras, 3 lacunas, 2 rodadas, demo | EF01MA10 |

Regras: no máximo uma novidade por estação; cada faixa numérica nova estreia numa atividade de montar (Torre) antes das de escolher. Prado e Lagoa = Educação Infantil; Floresta = 1º ano.

### 7.0b Letras (a estação no mapa é 2 × #)

| # | Estação | Região | Atividade | Parâmetros |
|---|---|---|---|---|
| 1 | 2 | Prado | Tambor | 1–2 sílabas, 3 rodadas, demo |
| 2 | 4 | Prado | Traçar | A, E, demo |
| 3 | 6 | Prado | Letra inicial | vogais, 2 cartinhas, 4 rodadas, demo |
| 4 | 8 | Prado | Rimas | 2 figuras, 4 rodadas, demo |
| 5 | 10 | Prado | Traçar | I, O, U |
| 6 | 12 | Prado | Tambor | 2–3 sílabas, 4 rodadas |
| 7 | 14 | Prado | Letra inicial | vogais, 3 cartinhas, 4 rodadas |
| 8 | 16 | Prado | Rimas | 3 figuras, 4 rodadas |
| 9 | 18 | Prado | Tambor | 1–4 sílabas, 4 rodadas |
| 10 | 20 | Prado | Letra inicial | vogais, 3 cartinhas, 5 rodadas (revisão) |
| 11 | 22 | Lagoa | Traçar | P, B, M |
| 12 | 24 | Lagoa | Letra inicial | P, B, M, 3 cartinhas, 4 rodadas |
| 13 | 26 | Lagoa | Montar | 2 sílabas, sem despiste, 3 rodadas, demo |
| 14 | 28 | Lagoa | Rimas | 3 figuras, 4 rodadas |
| 15 | 30 | Lagoa | Traçar | L, T, V |
| 16 | 32 | Lagoa | Letra inicial | P, B, M, L, T, V, 3 cartinhas, 5 rodadas |
| 17 | 34 | Lagoa | Montar | 2 sílabas, 1 despiste, 4 rodadas, demo |
| 18 | 36 | Lagoa | Tambor | nomes de bichos, 2–4 sílabas, 4 rodadas |
| 19 | 38 | Lagoa | Montar | 3 sílabas, sem despiste, 3 rodadas, demo |
| 20 | 40 | Lagoa | Letra inicial | modo bicho ("qual começa com bê?"), 4 rodadas, demo |
| 21 | 42 | Floresta | Traçar | C, D, F |
| 22 | 44 | Floresta | Pares | vogais, 4 pares, 2 rodadas, demo |
| 23 | 46 | Floresta | Ler | 2 sílabas, 2 figuras, 4 rodadas, demo |
| 24 | 48 | Floresta | Montar | 3 sílabas, 1 despiste, 4 rodadas |
| 25 | 50 | Floresta | Traçar | R, N, J |
| 26 | 52 | Floresta | Pares | consoantes, 4 pares, 2 rodadas |
| 27 | 54 | Floresta | Ler | 2 sílabas, 3 figuras, 4 rodadas |
| 28 | 56 | Floresta | Rimas | qual não rima?, 3 figuras, 4 rodadas, demo |
| 29 | 58 | Floresta | Montar | nomes de bichos, 2–3 sílabas, 2 despistes, 4 rodadas |
| 30 | 60 | Floresta | Ler | 3 sílabas, 3 figuras, 4 rodadas (final) |

### 7.1 Figurinhas (fauna e flora do Brasil)
Nenhuma mostra número como personagem nem cubinho com rosto. Desenho próprio, fofo, com borda branca de adesivo.

| Região | Figurinhas |
|---|---|
| Prado (fig01–fig10) | ipê-amarelo, joão-de-barro, tamanduá-bandeira, seriema, lobo-guará, borboleta-azul, joaninha, abelha jataí, girassol, quero-quero |
| Lagoa (fig11–fig20) | vitória-régia, garça-branca, ariranha, martim-pescador, tuiuiú, libélula, jacaré-de-papo-amarelo, peixinho lambari, sapo-cururu, capivara |
| Floresta (fig21–fig30) | onça-pintada, bicho-preguiça, tucano, arara-azul, mico-leão-dourado, quati, coruja-buraqueira, beija-flor, cogumelo, a Pipoca com uma medalha (final dos números) |
| Prado, letras (fig31–fig40) | bem-te-vi, sabiá-laranjeira, tatu-bola, ema, carcará, papagaio, vaga-lume, gafanhoto, caju, flor-de-maracujá |
| Lagoa, letras (fig41–fig50) | boto-cor-de-rosa, tracajá, pirarucu, arraia, cervo-do-pantanal, colhereiro, anta, jaçanã, sucuri, aguapé |
| Floresta, letras (fig51–fig60) | sagui, harpia, jabuti, cutia, jiboia, sapinho-ponta-de-flecha, bromélia, pau-brasil, castanheira, a Pipoca lendo um livro (final da trilha) |

As figurinhas das estações de números ficam em `figurinhas.js` (fig01–fig30, e a fig60); as das estações de letras em `figurinhas-prado.js`, `figurinhas-lagoa.js` e `figurinhas-floresta.js`. O álbum tem duas cenas por região (123 e ABC).

## 8. Assinatura, teste grátis e acesso de revisão

- **Google Play**: assinatura `pipoca_mensal` (nome visível: "Pipoca Aprende – assinatura mensal"), plano básico `mensal` com renovação automática, oferta `teste-gratis` (7 dias grátis, elegibilidade "nunca teve esta assinatura"). Preço só no Play Console.
- **Fluxo nativo (Billing Library 9.1.0)**: um `BillingClient` com `enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())` e `enableAutoServiceReconnection()`; `startConnection` na abertura; `queryPurchasesAsync(SUBS)` ao abrir e a cada `onResume`; `queryProductDetailsAsync` (tratando `unfetchedProductList`); oferta: filtrar `basePlanId == 'mensal'`, usar `teste-gratis` se vier (fase com preço 0 = teste; fase recorrente `P1M` = preço), senão o plano básico; `launchBillingFlow` na thread principal; acknowledge só de compras `PURCHASED` e não reconhecidas (repetir no próximo início se falhar); `PENDING` → estado pendente; erros `USER_CANCELED`, `ITEM_ALREADY_OWNED` (refazer consulta), `BILLING_UNAVAILABLE` (Play bloqueada), `SERVICE_UNAVAILABLE`, `NETWORK_ERROR` → mensagem ao adulto.
- **Cache só no Android** (SharedPreferences) `{ativa, confirmadoEm}`: resposta OK sem compra ativa revoga na hora; erro de serviço/rede/indisponível usa o cache até **7 dias** após a última confirmação; depois, modo grátis (figurinhas ganhas ficam). O JS só recebe o estado decidido.
- **Acesso de revisão** (para a equipe do Google Play): na área dos pais, "Tenho um código de acesso" → mensagem `codigoRevisao`; o Android compara com um código lido de `aplicativo/revisao.properties` (fora do git) e, se certo, libera tudo por 30 dias (`origem: 'revisao'`). Texto em inglês para o Play Console fica no README.
- **Grátis**: estações 1 a 4 (jogáveis de novo com números novos) e Brincar livre limitado. **Assinatura**: estações 5 a 60 e Brincar livre completo. Assinatura que acaba: estações feitas continuam com estrela no mapa (só fechadas para jogar), sem mensagem de perda. Mudança de assinatura no meio de uma estação vale a partir da próxima.
- **No navegador**, a assinatura é simulada (`#assinante=1` ou o botão da área dos pais); a ponte falsa (`#ponte=falsa&assinatura=...`) simula o app.

## 9. Arquitetura do jogo (pasta `jogo/`)

### 9.1 Arquivos e donos
| Arquivo | O que tem | Dono |
|---|---|---|
| `index.html` | todas as tags `<script>` (ninguém mais mexe) | núcleo |
| `estilo.css` | tokens e componentes do núcleo (ninguém mais mexe) | núcleo |
| `fontes/` | Fredoka 500/600/700 + `LICENCA-Fredoka.txt` (vai no APK) | núcleo |
| `js/nucleo.js` | `PC`, `PC.util`, `PC.palco`, `PC.layout`, `PC.cores`, `PC.estilo`, `PC.arrastar`, `PC.aoTocar`, `PC.atividades`, `PC.nativo` | núcleo |
| `js/som.js`, `js/voz.js`, `js/dados.js`, `js/assinatura.js` | som, voz, dados, assinatura | núcleo |
| `js/torre.js` | `PC.Torre` | núcleo |
| `js/ui.js` | `PC.ui` (Pipoca, botões, confete, dica, placa, aviso), `PC.telas`, `PC.portao` provisório | núcleo |
| `js/fases.js` | trilha | núcleo |
| `js/telas/atividade.js` | moldura | núcleo |
| `js/app.js` | início, modo de teste, `PC.debug` | núcleo |
| `js/arte.js` | `PC.arte` (Pipoca, ícones, cenários, logo) | agente de arte |
| `js/telas/abertura.js` | abertura | agente de arte |
| `js/atividades/<id>.js` | uma atividade cada | um agente por atividade |
| `js/telas/mapa.js` | mapa | agente do mapa |
| `js/telas/album.js` + `js/figurinhas.js` | álbum e as 30 figurinhas | agente do álbum |
| `js/telas/livre.js` | Brincar livre | agente do livre |
| `js/telas/pais.js` + `js/telas/portao.js` | telas `pais`, `assinatura`, `descanso` e `PC.portao` | agente dos pais |
| `teste/ponte-falsa.js`, `ferramentas/` | testes | núcleo |
| `aplicativo/`, `gerar-apk.bat` | app Android | agente Android |

Regras: cada agente mexe **só nos seus arquivos**; precisa de algo no núcleo → descreve em "pendências". Nenhum arquivo chama outro módulo no nível do topo. Script clássico em `(function () { 'use strict'; ... })();`. CSS do módulo com `PC.util.estilo('<id>', css)` e classes `pc-<modulo>-...`. **Nomes** (ids, ícones, cenários, chaves de params e de dados, classes, arquivos): minúsculas, sem acento, com hífen (`de-novo`, `tracar`); acento só em texto mostrado ou falado. Nada de bibliotecas, CDN ou internet. **Nunca use `Math.random`**: use `PC.util.aleatorio/escolher/embaralhar` (têm semente). Compatibilidade: só recursos do **Chrome 110** ou mais antigos (nada de `Set.prototype.union`, `Array.fromAsync`, `@starting-style`, CSS `color-mix` etc.).

### 9.2 Palco, camadas e layout
- Palco virtual **1600 × 900**, escalado e centralizado dentro das margens seguras (`--seguro-*`); o cenário cobre a tela toda (desenhado nas mesmas coordenadas, com sangria). Converta toques com `PC.palco.paraVirtual`; nunca guarde `PC.palco.escala`.
- Camadas (z-index dentro da tela): cenário 0 · rodada 10 (objeto arrastado ganha z-index alto dentro dela) · Pipoca e balão 30 · dica 40 · efeitos 50 · HUD 60 · janelas (Parabéns, Quer parar?, portão) 70 · aviso 75. Pipoca, balão, dica e efeitos não recebem toque (exceto o corpo da Pipoca, que repete a instrução).
- `PC.layout`: `faixaHud: 140` (y < 140 é do HUD), `chao: 800`, `cantoPipoca {x:0, y:600, l:290, a:300}`, `zonaBalao {x:10, y:380, l:560, a:220}` (o balão aparece acima da Pipoca), `margemLateral: 120` (nada arrastável perto das bordas: gesto voltar), `alvoMinimo: 140`, `alvoPrincipal: 170`, `numeroMinimo: 64` (altura mínima de algarismo para a criança), `textoAdulto: 34`, `cubo: 64`.
- Posições padrão: balde x ≈ 420; base/objeto principal x ≈ 850 no chão (y 800); placa do alvo x ≈ 1380, y ≈ 280; botão Pronto/Pagar x ≈ 1420, y ≈ 700. Exceção: na Feirinha o botão Pagar/Pronto fica na fileira de baixo, ao lado do cofrinho (x ≈ 1050–1310, y ≈ 795), porque o freguês ocupa o canto direito.
- Durante o "Quer parar?", a moldura segura a voz (`PC.voz.segurar(true)`): falas e contagens da atividade esperam a criança continuar.
- Desempenho: objetos são `div` posicionados; anime só `transform` e `opacity` (`PC.util.animar`); `will-change` só durante arraste; proibido `filter`/`drop-shadow`/`backdrop-filter`/`mix-blend-mode`; confete ≤ 60 peças; no mapa só a estação atual pulsa; ~1.500 elementos por tela no máximo.
- Todo elemento que a criança toca ganha `data-teste="nome"` (ex.: `balde`, `torre-0`, `bolha-2`, `pronto`).

### 9.3 Núcleo (`PC`) — APIs
```js
PC.util.el(tag, attrs, ...filhos)            // attrs: class, style, on, html, text, dataset, teste (vira data-teste)
PC.util.svg(markup) / PC.util.svgEl(tag, attrs, ...filhos)
PC.util.aleatorio(min, max) / escolher(lista) / embaralhar(lista)    // com semente (#semente=N)
PC.util.esperar(ms, sinal) -> Promise         // rejeita com AbortError se o sinal abortar
PC.util.animar(el, quadros, opcoes) -> Promise (nunca rejeita) / PC.util.duracao(ms)
PC.util.limitar / distancia / dentro(p, r, folga) / tom(cor, fator) / estilo(id, css)
PC.palco.paraVirtual(cx, cy) / paraTela(x, y) / retangulo(el) / aoMudar(fn)
PC.arrastar(el, { aoPressionar, aoComecar, aoMover, aoSoltar, aoTocar, aoCancelar, podeComecar, limiar }) -> desligar()
   // p = {x, y, dx, dy, inicio}. aoComecar só após o limiar (px de tela); aoTocar e aoComecar exclusivos;
   // depois de aoComecar sempre vem um aoSoltar OU um aoCancelar. Um gesto por vez no jogo; dedo parado > 300 ms
   // perde para um dedo novo; palma e bordas (3%) ignoradas.
PC.arrastar.cancelarTodos() / PC.arrastar.ativo()
PC.aoTocar(el, fn, {som})                     // botões; ignora toque durante arraste e logo depois de acertos
PC.bloquearToques(ms)                         // ignora toques novos por um tempo
PC.on(nome, fn) -> desligar / PC.emitir(nome, dados)
PC.fase(n) / PC.fases / PC.regioes / PC.regiaoDe(n) / PC.rodadasDe(atividade, params)
```
**Som** (`PC.som`): `iniciar, clique, pegar, encaixar, soltar, separar, contar(n), acerto, quase, moeda, pulo, piu, figurinha, festa, pagina, bolha`. Atividades **não** tocam `acerto` nem `quase` (a moldura toca).
**Voz** (`PC.voz`): `falar(texto, {interromper}) -> Promise<'fim'|'interrompida'|'muda'|'erro'>` (nunca rejeita), `contar(ate, {de, passo, aCada, intervalo, sinal, substantivo})`, `extenso(n, {feminino})`, `quantidade(n, singular, plural, {feminino})`, `dezEMais(n)`, `parar()`, `elogio()`, `quase()`, `disponivel()`, `motivo()`, `aoMudar(fn)`, `modo`.
**Dados** (`PC.dados`): `concluirEstacao(n, figurinha) -> {primeiraVez, nova}`, `estacaoConcluida(n)`, `concluidas()`, `proximaEstacao()`, `disponivel(n)`, `figurinhas()`, `ajustes` + `salvarAjustes()`, `extra(chave[, valor])`, `registrarEstatistica(n, {erros, dicas, segundos})`, `estatisticas()`, `registrarUso(s)`, `tempoHoje()`, `tempoSemana()`, `limiteAtingido()`, `liberarHoje()`, `zerar()`, `modo`.
**Assinatura** (`PC.assinatura`): `ativa()`, `estado() -> {ativa, carregando, origem, precoFormatado, temTeste, diasTeste, pendente, indisponivel, erro, nativo}`, `aoMudar(fn)`, `gratis(n)`, `liberada(n)`, `assinar()`, `restaurar()`, `gerenciar()`, `usarCodigoRevisao(codigo) -> Promise<boolean>`, `simular(ativa)` (só navegador).
**Portão** (`PC.portao.pedir() -> Promise<boolean>`): implementado em `telas/portao.js`; o núcleo traz um provisório que sempre libera.

### 9.4 Torre (`PC.Torre`)
```js
const t = new PC.Torre({ x, y, cores: [...] | n + cor | n (padrão 5 em 5), placa: 'base' | false })   // x,y = centro da base
t.el / t.n / t.corDe(i)
t.adicionar(cor) / t.adicionarVarios(n|cores) / t.remover(qtd) -> cores / t.definir(cores)
t.dividir(k) -> nova torre com os cubinhos k..n-1 (no mesmo pai) / t.separarDezena() -> nova torre com a dezena (11..19)
t.juntar(outra) -> boolean (máx. 20)
t.cuboEm(x, y, folga) -> índice | -1 / t.contem(x, y, folga) / t.retangulo() / t.retanguloCubo(i) / t.topo()
t.mover(x, y, {animar}) -> Promise / t.destacar(i) / t.tremer() / t.contarAlto({sinal}) -> Promise / t.destruir()
```
`cor` aceita `'#cor|estampa'` (listras, bolinhas, xadrez). Antes de destruir uma torre que está sendo arrastada, chame `PC.arrastar.cancelarTodos()`.

### 9.5 Interface (`PC.ui`)
```js
PC.ui.pipoca.montar(raiz) / desmontar() / mostrar() / esconder() / pose(nome) / calar() / falando()
PC.ui.pipoca.dizer(texto, {voz, mostrar}) -> Promise    // mostrar: número (grande, com pontinhos) ou elemento no balão
PC.ui.botaoIcone(icone, rotulo, aoTocar, {cor, mostrarRotulo}) -> button     // ícone obrigatório
PC.ui.botaoGrande(texto, aoTocar, {cor, icone}) -> button                    // botões para a criança: SEMPRE com ícone
PC.ui.confete({x, y, quantidade, raiz}) / PC.ui.dica(de, para, {vezes, raiz}) -> {parar()}
PC.ui.placaNumero(n, {pontos}) -> elemento / PC.ui.aviso(texto)
PC.telas.registrar(id, {criar(raiz, params) -> {destruir(), voltar() -> boolean}, voltarPara})
PC.telas.ir(id, params) -> Promise (ignorado durante transição) / voltar() -> boolean / atual() / raizAtual() / params()
```

### 9.6 Contrato das atividades
```js
PC.atividades.registrar('torre', {
  titulo: 'Torre de cubinhos', icone: 'torre', cenario: 'prado',
  totalRodadas(params) { return params.rodadas; },          // opcional
  rodada(ctx) {                                             // SÍNCRONA: monta UMA rodada dentro de ctx.palco
    return {
      instrucao(),          // fala a instrução (botão ouvir, toque na Pipoca, 7 s parada)
      proximoGesto(),       // OBRIGATÓRIO: o gesto certo no estado ATUAL, em px virtuais:
                            //   {tipo:'tocar', em:{x,y}} | {tipo:'arrastar', de:{x,y}, para:{x,y}} | {tipo:'tracar', pontos:[...]} | null
      ajudar(nivel),        // opcional: apoio que ensina (nível 2)
      resolver(),           // testes: resolve a rodada sozinho (termina com UM ctx.acertou()); idempotente
      estado(),             // opcional: objeto simples para testes
      destruir(),           // remove ouvintes, timers e elementos; idempotente
    };
  },
});
```
| `ctx` | O que é |
|---|---|
| `palco` | `<div>` 1600×900 só desta rodada |
| `params`, `indice`, `total`, `teste`, `demo` | parâmetros, número da rodada, total, modo teste, demonstrar nesta rodada |
| `sinal` | `AbortSignal` da rodada: aborta no acerto, ao sair e no resolver |
| `esperar(ms)` / `falar(texto, {mostrar})` | rejeitam com AbortError quando a rodada acaba (interrompe o fluxo; o núcleo ignora esse erro) |
| `acertou()` | rodada resolvida (só a 1ª chamada vale; a moldura congela a rodada na hora) |
| `avancou()` | acerto parcial: zera erros seguidos e o relógio |
| `errou({fala, quase, mostrar})` | decisão errada: a moldura toca o som, fala o retorno e escala a ajuda |
| `ocupado(bool)` | animando/contando: pausa o relógio de inatividade |
| `dica(de, para)` | mãozinha manual |
| `pipoca` | `PC.ui.pipoca` |

A atividade **não** comemora o acerto (a moldura faz), não toca `acerto`/`quase` e não fala elogios. Pode fazer um efeito rápido no objeto certo (ex.: contar a torre) **antes** de chamar `acertou()`.

### 9.7 Modo de teste pela URL
`#atividade=<id>&params=<JSON codificado>`, `#estacao=N`, `#tela=<id>&dados=<JSON>`, `#assinante=0|1`, `#progresso=N`, `#dados=memoria`, `#semente=N`, `#voz=simulada|muda`, `#rapido=1`, `#ponte=falsa&assinatura=inativa|ativa|carregando|pendente|indisponivel|semteste|semPreco&vozapp=ok|sem-ptbr`, `#debug=1`. No app Android nada disso funciona.
`PC.debug` (só navegador): `estado()`, `esperarOcioso()`, `resolverRodada()`, `proximoGesto()` (px de tela), `paraTela(x, y)`, `verificarLayout()` → lista de alvos pequenos ou em zonas reservadas.

## 10. Ponte com o Android (mensagens JSON)

O Android usa `WebViewCompat.addWebMessageListener(webView, "PipocaAndroid", setOf("https://appassets.androidplatform.net"), ...)` (registrado antes do `loadUrl`; o ouvinte roda na thread principal). O JS manda `PipocaAndroid.postMessage(JSON.stringify({tipo, ...}))`; o Android responde pelo `replyProxy` (chega em `PipocaAndroid.onmessage`) e guarda tudo numa fila até receber `pronto`.

| JS → Android | |
|---|---|
| `{tipo:'pronto', versao}` | o jogo está ouvindo; o Android responde `estado` |
| `{tipo:'falar', texto, id, velocidade, volume}` / `{tipo:'pararFala'}` | TextToSpeech pt-BR (`QUEUE_FLUSH`, `KEY_PARAM_UTTERANCE_ID`, `KEY_PARAM_VOLUME`) |
| `{tipo:'assinar'}` / `{tipo:'restaurar'}` / `{tipo:'gerenciar'}` | Billing; gerenciar abre `https://play.google.com/store/account/subscriptions?sku=pipoca_mensal&package=br.livia.pipocaaprende` |
| `{tipo:'codigoRevisao', codigo}` | confere o código de revisão |
| `{tipo:'abrirAjustesVoz'}` | `TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA` |
| `{tipo:'abrirPrivacidade'}` | abre a URL da política no navegador |
| `{tipo:'vibrar', ms}` | `performHapticFeedback` (sem permissão) |
| `{tipo:'podeVoltar', valor}` | liga/desliga o `OnBackPressedCallback` (false só na abertura) |

| Android → JS | |
|---|---|
| `{tipo:'estado', voz, assinatura, insets}` | pacote inicial depois de `pronto` |
| `{tipo:'voz', disponivel, motivo: ''|'iniciando'|'sem-ptbr'|'sem-motor'}` | quando muda |
| `{tipo:'voz-fim', id, motivo: 'fim'|'interrompida'|'erro'}` | de `onDone`, `onStop` e `onError` (sempre na thread principal) |
| `{tipo:'assinatura', estado: {...}}` | ver 9.3 |
| `{tipo:'codigoRevisao', ok}` | resposta do código |
| `{tipo:'voltar'}` / `{tipo:'pausa'}` / `{tipo:'retomar'}` | ciclo de vida |
| `{tipo:'insets', esq, topo, dir, base}` | barras + recorte, em dp (= px CSS) |

## 11. App Android (pasta `aplicativo/`)

- **Versões (fixas, conferidas no build)**: Gradle 8.13, Android Gradle Plugin 8.13.2, Kotlin 2.3.21, core 1.18.0, **compileSdk 36, targetSdk 36**, `minSdk 26`, buildTools 36.0.0, Java 17. Plano B se a opção A falhar: AGP 9.3 + Gradle 9.5 com Kotlin embutido e compileSdk 37 (já instalado). Dependências: `com.android.billingclient:billing:9.1.0`, `androidx.activity:activity` 1.13.x, `androidx.core:core` 1.17.x, `androidx.webkit:webkit` 1.18.x (recuar se pedirem compileSdk maior).
- `applicationId`/namespace **`br.livia.pipocaaprende`** (trocado em novembro de 2026, antes do primeiro envio; depois de publicar não muda). Uma `ComponentActivity`.
- **Manifesto**: `android:appCategory="game"` (mantém a tela deitada em tablets com target 36); `screenOrientation="sensorLandscape"`; `configChanges="orientation|screenSize|smallestScreenSize|screenLayout|density|uiMode|keyboard|keyboardHidden|navigation"`; `<queries>` com `android.intent.action.TTS_SERVICE`; `usesCleartextTraffic="false"`; meta-data `android.webkit.WebView.MetricsOptOut=true`; **sem** `INTERNET` declarada pelo app (o manifesto mesclado é o que vale: conferir; se aparecer `AD_ID` ou localização, remover com `tools:node="remove"`); backup do progresso decidido em `dataExtractionRules`.
- **WebView**: `javaScriptEnabled`, `domStorageEnabled`, `mediaPlaybackRequiresUserGesture=false`, `allowFileAccess=false`, `allowContentAccess=false`, `blockNetworkLoads=true`, zoom desligado, `textZoom=100`, sem toque longo; `shouldInterceptRequest` serve os assets de `https://appassets.androidplatform.net/` (e devolve 404, nunca null); `shouldOverrideUrlLoading` bloqueia outras origens; `onRenderProcessGone` recria a WebView; `setWebContentsDebuggingEnabled` só no debug. **A origem nunca muda entre versões** (é a chave do localStorage).
- **Assets**: `jogo/` (sem `teste/`) entra no APK por `sourceSets`/tarefa de cópia, sem duplicar arquivos no repositório; inclui `fontes/LICENCA-Fredoka.txt`.
- **Tela**: `enableEdgeToEdge()`; barras escondidas (`WindowInsetsControllerCompat`, `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`) no `onResume` e no `onWindowFocusChanged(true)`; `windowLayoutInDisplayCutoutMode=shortEdges`; insets (barras + recorte) enviados ao JS; `FLAG_KEEP_SCREEN_ON` durante o jogo.
- **Voltar**: `OnBackPressedCallback` ligado/desligado por `podeVoltar`; quando ligado, manda `voltar` ao JS; na abertura, desligado (o sistema faz o voltar preditivo).
- **Voz**: `TextToSpeech` criado no `onCreate`, fala só depois do `onInit`; `setLanguage(Locale("pt","BR"))` tratando `LANG_MISSING_DATA`/`LANG_NOT_SUPPORTED`; preferir voz pt-BR com `isNetworkConnectionRequired == false`; pedidos antes do `onInit` ficam guardados; `UtteranceProgressListener` → `voz-fim` na thread principal; `stop()` no `onPause`, `shutdown()` no `onDestroy`.
- **Billing**: seção 8. Cache em SharedPreferences. Código de revisão lido de `aplicativo/revisao.properties` (fora do git) para o `BuildConfig`.
- **Build**: `gerar-apk.bat` (raiz do jogo) gera o APK de debug e copia para `Android/pipoca-conta/PipocaAprende.apk`; `bundleRelease` gera o AAB assinado com a chave de upload (`aplicativo/keystore.properties`, fora do git). `local.properties` com `sdk.dir` (fora do git). Wrapper do Gradle gerado com uma distribuição do Gradle.

## 12. Testes

- `ferramentas/servidor.mjs` (porta 5181 por padrão; `.claude/launch.json` → `pipoca-conta`).
- `ferramentas/testar.mjs`: Chrome sem janela via DevTools, servidor e perfil próprios por execução (vários agentes ao mesmo tempo). Passos com coordenadas virtuais ou `"@nome"` (data-teste); `{"gesto": true}` executa `proximoGesto()` com toque real; `{"esperar": "ocioso"}`; `--toque`, `--densidade 2`, `--fraco`, `--rapido`, `--semente N`; por padrão `voz=simulada` e `dados=memoria`. Veja o cabeçalho do arquivo.
- Cada atividade/tela deve ser testada em **1600×900**, **1280×800**, **1024×768** (4:3) e **915×412** e **800×360** (celular) com `--toque --densidade 2`, inclusive: rodadas resolvidas por `{"gesto": true}`, erro proposital, dica, dois dedos, "Quer parar?", e `PC.debug.verificarLayout()` vazio.
- Teste de fumaça: todas as estações com `#estacao=N&rapido=1&semente=1`, resolvendo as rodadas, sem erro no console.
- Antes de publicar: aparelho real (tablet barato e celular), voz pt-BR presente e ausente, volume zero, voltar e gesto de borda, dois dedos e palma, e um playtest com 3 a 5 crianças.

## 13. Lista de originalidade (antes de cada versão, com revisão final de uma pessoa)
Nenhum número flutuando; nenhuma cor ligada a quantidade; cubinhos sem rosto e sem reação; só a Pipoca fala; nenhuma palavra proibida; pintinhos com cara de ave; sons originais; figurinhas da seção 7.1.

## 14. Loja, privacidade e Google Play
- Título "Pipoca Aprende: letras e números" (≤ 30 caracteres, sem "grátis"); descrição curta ≤ 80; descrição diz que as estações 1 a 4 são grátis e o resto exige assinatura mensal com teste de 7 dias. Sem palavras proibidas, sem "alternativa a/igual a". Ícone: rosto da Pipoca com a flor de ipê.
- **Política de privacidade** em `privacidade/index.html` (preencher nome e e-mail do desenvolvedor e publicar numa URL fixa). Segurança dos dados: "nenhum dado coletado nem compartilhado" (o Billing fala com o Google; não afirmar "sem internet nenhuma").
- Política para Famílias: sem anúncios, sem SDKs de terceiros, compras só na área dos pais (portão), sem táticas de pressão. ECA Digital: supervisão (tempo de uso, limite diário, esconder ofertas), configuração protetora por padrão, sem caixas de recompensa. Play Age Signals: avaliar quando sair da fase beta (registrar no README).
- Checklist do Play Console, texto em inglês do "Acesso ao app" e o plano de teste fechado (12 testadores × 14 dias para contas pessoais) ficam no README.
- Antes do primeiro envio: busca de marca "PIPOCA CONTA" no INPI (classes 9, 41, 28).
