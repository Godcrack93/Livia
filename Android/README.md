# Jogos para Android

Jogos da Lívia feitos para celular e tablet. Todos seguem a mesma organização:

| Pasta | O que tem |
| --- | --- |
| `jogo/` | o jogo em HTML, CSS e JavaScript; também abre no computador com dois cliques no `index.html` |
| `aplicativo/` | o projeto do Android Studio que transforma o jogo num aplicativo (APK) que funciona sem internet |
| `ferramentas/` | scripts de teste (Node.js) |

## Jogos

| Jogo | Pasta | O que é |
| --- | --- | --- |
| Parafusinhos | `parafusinhos/` | Quebra-cabeça de parafusos: tire os parafusos na ordem certa e guarde cada um na caixinha da sua cor. Sem anúncios, sem internet e com desfazer à vontade. Detalhes em `parafusinhos/README.md`. |
| Pipoca Conta | `pipoca-conta/` | Jogo de números para 4 a 6 anos, com a capivara Pipoca. Zero anúncios, teste grátis e assinatura mensal (Google Play Billing). Detalhes em `pipoca-conta/README.md`. |

## Como instalar um jogo no celular

1. Gere o APK (o README de cada jogo explica) ou use o que já está em `aplicativo/app/build/outputs/apk/debug/app-debug.apk`.
2. Passe o arquivo para o celular (cabo USB, Google Drive, mensagem para você mesmo).
3. Abra o arquivo no celular. Na primeira vez, o Android pede para permitir a instalação de apps daquela origem: permita.

Outro jeito: com o celular ligado no cabo e a depuração USB ativada, abra a pasta `aplicativo/` do jogo no Android Studio e aperte **Run**.

## Combinados entre os jogos

- Identificador do app: `br.livia.<nome>` (por exemplo, `br.livia.parafusinhos`). Depois de publicado na Play Store, ele não pode mudar.
- Ferramentas: Gradle 8.13, Android Gradle Plugin 8.13, Kotlin 2.3, compileSdk e targetSdk 36 (o Google Play exige o 36 para apps novos e atualizações desde 31/08/2026), minSdk 26 (Android 8.0 ou mais novo).
- O APK de debug instala direto no celular. Para publicar na Play Store, é preciso gerar o pacote assinado com a chave do desenvolvedor.
