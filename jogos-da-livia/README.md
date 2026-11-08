# Jogos da Lívia

Página inicial com todos os jogos que estamos criando. A Lívia abre só esta página e escolhe o jogo pelo cartão; dentro de cada jogo, o botão de casinha volta para cá.

## Como abrir

- **No computador:** dois cliques em `index.html`. A internet só é usada para carregar as fontes.
- **No tablet ou celular:** dois cliques em `iniciar-jogo.bat`. Ele liga um servidor pequeno, abre a página inicial no computador e mostra o endereço para digitar no tablet (algo como `http://192.168.0.10:4321`). O tablet precisa estar na mesma rede Wi-Fi. Na primeira vez, o Windows pode perguntar se o Node.js pode usar a rede: escolha **Permitir** para redes privadas.

```bash
node servidor.js               # http://localhost:4321 e o endereço para o tablet
node servidor.js --abrir       # o mesmo, já abrindo o navegador
node servidor.js --porta=5000  # usa outra porta
```

## Jogos

| Jogo | Pasta | O que é |
| --- | --- | --- |
| Sprunkinhos | `jogos/sprunkinhos/` | Monte uma banda arrastando personagens até os bonecos cinzas. Tem modo terror. |
| Parquinho Sprunki | `jogos/parquinho/` | Caixa de areia: blocos, armas e os Sprunkis de terror atacando os normais (sem sangue: quem é pego vira terror, e o terror derrotado é curado). |

Os personagens dos dois jogos vêm de `jogos/comum/personagens.js`.

## Como incluir um jogo novo

1. Crie a pasta `jogos/<nome>/` com o `index.html` do jogo e uma capa (`capa.svg` ou `capa.png`, no formato 16:10).
2. Acrescente o jogo em `jogos.js` (nome, frase, tipo, endereço, capa e cor). O cartão aparece sozinho na página inicial, antes do cartão "Em breve".
3. No jogo, coloque um botão de casinha com `href="../../index.html"` para voltar ao início.

## Arquivos

| Arquivo | O que tem |
| --- | --- |
| `index.html` | página inicial: título, cartões e cenário |
| `jogos.js` | lista de jogos da página inicial |
| `servidor.js` | servidor local para jogar no tablet (serve esta pasta inteira) |
| `iniciar-jogo.bat` | liga o servidor e abre a página inicial |
