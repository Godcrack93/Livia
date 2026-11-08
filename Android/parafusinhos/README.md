# Parafusinhos

Quebra-cabeça de parafusos para Android, no estilo dos jogos que fazem sucesso na Play Store, mas sem anúncio, sem internet e sem pressa.

Placas coloridas e transparentes ficam empilhadas, presas por parafusos coloridos. Toque num parafuso livre: ele gira, sai e voa para a caixinha da cor dele. No alto ficam duas caixinhas com 3 lugares; caixa cheia fecha e dá lugar à próxima. Se não houver caixinha da cor, o parafuso espera na bandeja (5 lugares). Placa sem parafuso cai, e a fase termina quando todas caírem.

## O que tem de melhor que os jogos cheios de anúncio

- Nenhum anúncio e nenhuma compra. O app não pede permissão nenhuma, nem de internet.
- Desfazer sem limite, dica e +1 espaço na bandeja, tudo de graça.
- Sem vidas e sem "fim de jogo": quando a bandeja enche, o jogo oferece desfazer ou voltar até o último ponto em que ainda dava para vencer.
- Placas transparentes (dá para ver o parafuso preso embaixo), as próximas caixas à vista e símbolos nas cores para quem confunde cores.
- Tocar perto do parafuso já vale; os botões ficam embaixo, ao alcance do polegar.
- Abre direto na fase em que você parou. O progresso é salvo sozinho, até no meio da fase.

## Fases

- As fases 1 a 3 ensinam a jogar, com uma mãozinha mostrando onde tocar.
- Da fase 4 em diante, as fases são criadas pelo computador a partir do número (a fase 37 é sempre a mesma) e não acabam. Cada uma é resolvida pelo próprio jogo antes de aparecer, então nunca existe fase impossível.
- A dificuldade cresce aos poucos (mais placas, camadas e cores). A cada 10 fases vem uma fase difícil, e a seguinte é mais leve.
- O botão de grade, no canto de cima, abre a lista de fases para jogar de novo qualquer uma já vencida.

## Jogar no computador

Dois cliques em `jogo/index.html`. Funciona sem internet.

| Tecla | O que faz |
| --- | --- |
| Z ou Ctrl+Z | desfaz |
| D | dica |
| R | recomeça a fase (dá para desfazer) |
| Esc | fecha o painel aberto |

Para testes: `index.html?fase=25` abre a fase 25 direto, sem mudar o que está liberado, e `index.html?limpo=1` joga sem ler nem gravar o progresso.

## Instalar no celular

O APK de teste fica em `aplicativo/app/build/outputs/apk/debug/app-debug.apk`. Passe o arquivo para o celular e abra; na primeira vez, o Android pede para permitir a instalação daquela origem. Outro jeito: abra a pasta `aplicativo/` no Android Studio, ligue o celular no cabo com a depuração USB ativada e aperte **Run**.

Funciona do Android 8.0 em diante (com o "Android System WebView" atualizado pela Play Store), sempre em pé e em tela cheia.

Atenção: o APK de teste é assinado com a chave de depuração deste computador. Uma versão futura assinada com outra chave (a da Play Store, por exemplo) não instala por cima: é preciso desinstalar, e o progresso salvo se perde.

## Gerar o APK

O APK leva a pasta `jogo/` dentro dele: basta mudar o jogo e gerar de novo.

```bash
cd Android/parafusinhos/aplicativo
./gradlew assembleDebug
```

No PowerShell, use `.\gradlew.bat assembleDebug`. Num clone novo do repositório, abra `aplicativo/` uma vez no Android Studio (ele cria o `local.properties` com o caminho do Android SDK) ou crie esse arquivo com a linha `sdk.dir=` apontando para o SDK. Versões: Gradle 8.13, Android Gradle Plugin 8.13.2, Kotlin 2.3.21, compileSdk e targetSdk 36, minSdk 26. Na primeira vez, o Gradle baixa o que faltar (inclusive a plataforma Android 36).

O `./gradlew assembleRelease` gera um APK menor e otimizado, mas sem assinatura: ele só instala depois de assinado.

## Publicar na Play Store (para depois)

- Precisa de conta de desenvolvedor no Google Play, de uma chave de assinatura e de uma política de privacidade (mesmo sem coletar dados).
- O pacote para a loja sai com `./gradlew bundleRelease`, depois de configurar a assinatura.
- O app já usa o targetSdk 36, que o Google Play exige desde 31/08/2026. Essa exigência sobe todo ano, por volta de agosto.
- O identificador `br.livia.parafusinhos` não pode mudar depois de publicado.
- Se um dia entrar anúncio, a ideia é só o opcional com recompensa (por exemplo, ganhar um espaço extra), nunca anúncio forçado.

## Testar as fases

```bash
node Android/parafusinhos/ferramentas/testar-fases.mjs --ate=1000 --resolver=150
node Android/parafusinhos/ferramentas/testar-fases.mjs --ver=25
```

O primeiro testa as regras, gera e valida as fases de 1 a 1000, confere que o resultado é sempre igual e que o resolvedor e a dica funcionam. O segundo desenha a fase 25 em texto.

## Arquivos

| Arquivo | O que tem |
| --- | --- |
| `jogo/index.html` | a tela: topo, tabuleiro, botões de ajuda e painéis |
| `jogo/estilo.css` | o visual: cores, botões, painéis, avisos e balões |
| `jogo/js/regras.js` | as regras: jogada, caixinhas, bandeja e placa que cai |
| `jogo/js/fases.js` | as fases do tutorial e o gerador das fases seguintes |
| `jogo/js/resolvedor.js` | o resolvedor da dica e do "voltar até dar certo" |
| `jogo/js/geometria.js`, `jogo/js/aleatorio.js` | contas de geometria e o sorteio com semente (a mesma fase sempre sai igual) |
| `jogo/js/desenho.js` | o desenho no canvas e as animações |
| `jogo/js/principal.js` | o fluxo do jogo: toques, botões, painéis, tutorial e progresso salvo |
| `jogo/js/sons.js` | os sons, gerados pelo código (não há arquivos de áudio) |
| `jogo/js/nativo.js` | a ponte com o Android (vibração e versão do app) |
| `jogo/fontes/` | a fonte Fredoka (licença OFL em `OFL.txt`) |
| `ferramentas/testar-fases.mjs` | testes das regras e das fases |
| `aplicativo/` | projeto do Android Studio (Kotlin): uma tela que roda o jogo de dentro do aplicativo, sem internet |

O progresso fica guardado no próprio aparelho. Apagar os dados do app (ou o botão "Apagar progresso", nos ajustes) volta tudo para a fase 1.
