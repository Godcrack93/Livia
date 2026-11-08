# Pipoca Aprende

Jogo de letras e números para crianças de 4 a 6 anos, com a macaquinha **Pipoca**. (Até novembro de 2026 se chamava Pipoca Conta e só tinha números; a pasta ainda tem o nome antigo.) Funciona em celular e tablet Android (sempre deitado) e também abre no navegador do computador para testes.

- **Zero anúncios.** As estações 1 a 4 são grátis; o resto vem com a **assinatura mensal**, que tem **7 dias de teste grátis** (Google Play).
- 60 estações em três regiões (Prado, Lagoa e Floresta), intercalando números e letras. Números: Torre de cubinhos, Pintinhos, Traçar números, Juntar, Separar, Feirinha da Pipoca (moedinhas) e Sapinho (sequências). Letras: Tambor das sílabas, Com que letra começa?, Rimas, Traçar letras, Montar a palavra, Pares de letras (maiúscula e minúscula) e Ler palavrinhas. Mais o álbum de figurinhas da fauna e flora do Brasil e o Brincar livre.
- Tudo é falado: a criança não precisa saber ler.
- Área dos pais (protegida por um desafio para adultos): assinatura, volume e velocidade da voz, efeitos sonoros, tempo de uso, limite diário, progresso por estação, privacidade.

O projeto completo (regras de jogo, contrato técnico e decisões) está em [PROJETO.md](PROJETO.md).

## Como jogar no computador

No app Claude, abra a configuração **pipoca-conta** do navegador (porta 5181). Ou, no terminal:

```bash
node ferramentas/servidor.mjs --porta=5181
```

e abra `http://localhost:5181`. Atalhos úteis na URL (depois de `#`):

| Atalho | O que faz |
|---|---|
| `#assinante=1` | simula a assinatura (libera tudo) |
| `#progresso=12` | finge que as estações 1 a 12 já foram feitas |
| `#estacao=7` | abre direto a estação 7 |
| `#tela=pais` | abre direto a área dos pais |
| `#ponte=falsa&assinatura=pendente` | simula o app Android (estados: inativa, ativa, carregando, pendente, indisponivel, semteste, semPreco) |

No computador, a tecla **Esc** faz o papel do botão voltar.

## Como gerar o APK e instalar no celular ou tablet

1. Dê dois cliques em `gerar-apk.bat`. Na primeira vez ele baixa o Gradle e as bibliotecas (precisa de internet e demora alguns minutos).
2. O arquivo `PipocaAprende.apk` aparece nesta pasta.
3. Para instalar:
   - **Pelo cabo**: ative a "Depuração USB" no aparelho (Configurações > Sobre o telefone > toque 7 vezes em "Número da versão" > Opções do desenvolvedor > Depuração USB), ligue no PC e dê dois cliques em `instalar-no-celular.bat`.
   - **Sem cabo**: mande o `PipocaAprende.apk` para o aparelho (Google Drive, WhatsApp para você mesmo etc.), abra o arquivo e permita "instalar apps desconhecidos" quando o Android pedir.

> O APK de teste usa a chave de depuração. A assinatura **não funciona** num APK instalado assim: o Google Play só libera compras para apps baixados pela própria Play (faixa de teste interno). Para testar o jogo completo sem pagar, use o código de revisão (ver abaixo) ou o `#assinante=1` no navegador.

## Assinatura no Google Play: o que configurar

O código já está pronto para estes nomes (não mude depois de publicar):

| Item | Valor |
|---|---|
| Pacote (applicationId) | `br.livia.pipocaaprende` |
| ID da assinatura | `pipoca_mensal` |
| Nome visível | Pipoca Aprende – assinatura mensal |
| Plano básico | `mensal` (renovação automática todo mês) |
| Oferta | `teste-gratis`: 7 dias grátis, elegibilidade "nunca teve esta assinatura" |
| Preço | definido no Play Console (sugestão: entre R$ 9,90 e R$ 19,90 por mês) |

Passo a passo no Play Console:

1. **Conta**: decidir entre conta pessoal (exige teste fechado com 12 testadores por 14 dias seguidos antes da produção) ou de organização (CNPJ + número D-U-N-S). Cuidado: o endereço do perfil de pagamentos aparece publicamente na Play.
2. **Perfil de pagamentos** (conta de comerciante) e verificação de vendedor (nome, endereço, CPF/CNPJ).
3. Criar o app "Pipoca Aprende: letras e números" e enviar o primeiro **AAB** para o **teste interno** (a assinatura só pode ser criada depois que um build com a biblioteca de cobrança estiver na Play).
4. Criar a assinatura e a oferta da tabela acima.
5. **Testadores de licença**: em Configurações > Testes de licença, cadastrar os e-mails de quem vai testar compras (com cartões de teste o teste grátis dura ~3 min e a renovação mensal ~5 min).
6. **Conteúdo do app**: política de privacidade (URL), Segurança dos dados ("nenhum dado coletado nem compartilhado"), Público-alvo (5 anos ou menos e 6 a 8 anos), Anúncios: não, Classificação indicativa (IARC), Recursos financeiros: não oferece, **Acesso ao app** (texto abaixo).
7. Países: começar só pelo Brasil (o app é só em português).

### Texto para "Acesso ao app" (Play Console, em inglês)

```text
Most content requires a monthly subscription. To review all content for free:
1. On the title screen, tap the small padlock icon (top-right corner) to open the parents' area.
2. A parental gate asks you to tap three numbers that are written as Portuguese words. Use this table:
   um=1, dois=2, três=3, quatro=4, cinco=5, seis=6, sete=7, oito=8, nove=9.
3. In the parents' area, tap "Tenho um código de acesso" ("I have an access code") and enter: <CÓDIGO DE REVISÃO>
4. All 60 stations and the free-play mode are unlocked for 30 days. Tap the back arrow, then "Jogar" (Play).
The app has no ads, no account and no login.
```

O código de revisão fica em `aplicativo/revisao.properties` (fora do git; copie de `revisao.properties.example`). Troque o código a cada versão.

## Publicar (versão final)

1. Criar a chave de upload (uma vez só, e guardar cópia em lugar seguro): no Android Studio, Build > Generate Signed App Bundle, ou com `keytool`. Preencher `aplicativo/keystore.properties` (copie de `keystore.properties.example`).
2. Gerar o AAB: na pasta `aplicativo`, `gradlew.bat bundleRelease`. O arquivo sai em `aplicativo/app/build/outputs/bundle/release/`.
3. Aumentar o `versionCode` a cada envio.
4. Ativar a Assinatura de apps do Google Play (Play App Signing).

## Antes de publicar

- [ ] Preencher o nome e o e-mail do desenvolvedor em `privacidade/index.html` e publicar essa página numa URL fixa (pode ser num GitHub Pages separado; o deste repositório já é usado pelo Óculos Mágico). Colocar a URL no Play Console e em `aplicativo/revisao.properties` (`PRIVACIDADE_URL`).
- [ ] Buscar "PIPOCA" e "PIPOCA CONTA" no INPI (busca.inpi.gov.br), classes 9, 41 e 28, e nas lojas. Se estiver livre, considerar registrar a marca. Nunca usar os apelidos "Pipoquinha" ou "Pipokinha".
- [ ] Testar num tablet barato e num celular: voz em português presente e ausente, volume no zero, botão e gesto de voltar, dois dedos e palma da mão na tela.
- [ ] Fazer um teste com 3 a 5 crianças de 4 a 6 anos, sem ajuda de adulto, observando onde travam (a área dos pais mostra erros e dicas por estação).
- [ ] Conferir a lista de originalidade da seção 13 do PROJETO.md.
- [ ] Avaliar a Play Age Signals API (sinal de faixa etária, ECA Digital) quando ela sair da fase beta.

## Pastas

| Pasta/arquivo | O que tem |
|---|---|
| `jogo/` | o jogo em HTML/CSS/JS (é o que vai dentro do app) |
| `jogo/js/atividades/` | as 7 brincadeiras |
| `jogo/js/telas/` | abertura, mapa, moldura das atividades, álbum, brincar livre, pais, portão |
| `jogo/teste/` | ponte falsa do Android (não vai para o APK) |
| `aplicativo/` | projeto Android (Kotlin + WebView + Google Play Billing) |
| `ferramentas/` | servidor local e testador automático (Chrome sem janela) |
| `privacidade/` | política de privacidade pronta para publicar |
| `PROJETO.md` | contrato técnico e regras do jogo |
| `HISTORICO-ARTE.md` | ficha da Pipoca e histórico das decisões de desenho |

## Testes automáticos

```bash
node ferramentas/testar.mjs --url "#estacao=1" --tamanho 1280x800 --saida ferramentas/saida/teste --passos-json "[{\"esperar\":\"ocioso\"},{\"gesto\":true},{\"foto\":\"depois\"}]"
```

Veja o cabeçalho de `ferramentas/testar.mjs` para todos os passos e opções.

## Créditos e licenças

- Fonte **Fredoka** — The Fredoka Project Authors, SIL Open Font License 1.1 (`jogo/fontes/LICENCA-Fredoka.txt`).
- Personagens, desenhos, sons e textos: originais deste projeto.
