# Lilumi Estúdio — logotipo

O logotipo é a Zizi (a gata frajola do estúdio) enroladinha, vista de cima, com o nome "Lilumi estúdio".
É todo em preto e branco: preto `#1E1A22`, branco `#FFFFFF` e, no ícone claro, fundo creme `#FFF8EC`.

## Qual arquivo usar

| Uso | Arquivo |
| --- | --- |
| Ícone de desenvolvedor no Google Play (512×512) | `png/icone-quadrado-512.png` |
| Ícone para redes sociais | `png/icone-quadrado-1024.png` ou `png/icone-quadrado-escuro-1024.png` |
| Créditos e abertura dos jogos (fundo claro ou colorido) | `svg/logo-vertical.svg` |
| Rodapé, política de privacidade, cabeçalhos | `svg/logo-horizontal.svg` |
| Onde não dá para usar transparência (fundo branco opaco) | os arquivos `-fundo-branco` |
| Fundo escuro | os arquivos `-uma-cor-branco` |
| Uma tinta só (carimbo, impressão, sobre cor) | os arquivos `-uma-cor-preto` |
| Só a Zizi, sem o nome | `svg/simbolo.svg` |

Nos arquivos normais a Zizi é preta com as manchas brancas opacas. Nos arquivos `-uma-cor-…`
só existe uma tinta e as manchas são recortes transparentes (aparece a cor do fundo).
Todos os PNGs, menos os ícones quadrados e os `-fundo-branco`, têm fundo transparente.

## Como gerar de novo

```bash
node Android/lilumi-estudio/ferramentas/gerar-logo.mjs
```

O desenho da gata e das letras fica dentro desse script (as letras são traços, não dependem de fonte).
Ele regrava `svg/` e exporta `png/` com o Chrome ou o Edge instalados.
