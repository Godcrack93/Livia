# Vozes da Pipoca (ElevenLabs)

O jogo toca falas gravadas (`jogo/vozes/*.mp3`). Se uma frase não tiver gravação, a fala inteira usa a voz do
aparelho, então o jogo nunca fica mudo.

## O que tem nesta pasta

| Arquivo | Para que serve |
|---|---|
| `frases.json` | Todas as falas, na ordem em que a criança encontra no jogo. Cada uma tem número, texto, tag de emoção e nome do arquivo. |
| `configuracao.json` | Voz, modelo (`eleven_v4`), velocidade, estabilidade etc. |
| `chave-elevenlabs.txt` | A sua chave da API. Fica só no seu computador e nunca vai para o git. |
| `ouvir.html` | Página para ouvir tudo e marcar o que ficou ruim. |

## Gerar as vozes

1. Crie uma chave no ElevenLabs em **Developers → API Keys**, só com a permissão **Text to Speech**.
2. Dê dois cliques em `GERAR-VOZES.bat`, na pasta do projeto. Na primeira vez ele cria `gravacao/chave-elevenlabs.txt`.
   Abra esse arquivo no Bloco de Notas, troque o texto pela chave e salve.
3. **Teste primeiro**: abra um terminal na pasta do projeto e rode `GERAR-VOZES.bat --teste 15`. Isso grava só as 15 primeiras.
   Abra `gravacao/ouvir.html` e escute.
4. Se gostou, rode `GERAR-VOZES.bat` sem nada para gravar o resto. Ele pula o que já existe, então rodar de novo
   não gasta crédito à toa. Se parar no meio, por falta de crédito ou de internet, é só rodar de novo depois.
5. Gere o APK de novo (`gerar-apk.bat`) para as vozes entrarem no aplicativo.

## Regravar o que ficou ruim

Em `ouvir.html`, marque ✗ nas frases estranhas. A página monta o comando pronto, por exemplo:

    GERAR-VOZES.bat --refazer 12,40-45

Às vezes basta regravar a mesma frase, porque cada gravação sai um pouco diferente. Se uma frase continuar estranha,
mude a `tag` dela em `frases.json` (veja abaixo) e regrave.

## Tags de emoção

O Eleven v4 entende tags **em inglês**, entre colchetes, antes da frase. O jogo usa estas:

| Tag | Onde |
|---|---|
| `[excited]` | elogios e comemorações ("Arrasou!", "Parabéns!") |
| `[happy]` | um número comemorado ("Cinco cubinhos!") |
| `[cheerful]` | instruções ("Monte uma torre de...") |
| `[curious]` | perguntas ("Quantos pintinhos?") |
| `[gentle]` | erros e "quase" ("Deu sete. Precisamos de cinco.") |
| `[calm]` | área dos pais e hora do descanso |
| (sem tag) | contagem ("um", "dois", "três"...) e explicações ("A banana custa sete."): a voz natural já basta e economiza créditos |

Outras que funcionam: `[laughs]`, `[whispers]`, `[sighs]`, `[mischievously]`. O texto que vai entre colchetes também
pode descrever a voz, por exemplo `[soft, slow voice]`. A tag não aparece nem é falada no jogo.

**Não edite o `texto`.** Ele precisa ser idêntico ao que o jogo fala, porque é assim que o jogo acha o áudio.

## Quando o jogo ganhar falas novas

    node ferramentas/frases-coletar.mjs     (o robô joga as 30 estações e anota as falas; uns 30 a 60 minutos)
    node ferramentas/frases-montar.mjs      (as frases novas entram no fim de frases.json; as antigas não mudam)
    GERAR-VOZES.bat                         (grava só as novas)

Para ver no navegador quais falas ainda saem pela voz do aparelho, abra o jogo e veja `PC.debug.semGravacao` no console.

## Licença

Só os áudios gerados num **plano pago** do ElevenLabs podem ser usados comercialmente. Gere tudo no mês em que a
assinatura estiver ativa. Depois de gerados, os arquivos continuam valendo mesmo que você cancele o plano. Confira os
termos atuais no site deles.
