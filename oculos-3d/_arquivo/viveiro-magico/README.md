# Viveiro Mágico

```bash
npm i
npm run dev          # http://localhost:8080 (computador)
npm run dev:https    # https://<ip-do-pc>:8443 (celular)
```

No Windows, basta dar dois cliques em `iniciar-jogo.bat`: ele liga os dois servidores e mostra o endereço do celular.

Computador: arraste o mouse para olhar e clique para escolher a semente (mesa da esquerda), plantar, pegar o regador e regar.

Como jogar:
- As plantas crescem sozinhas enquanto o vaso tem água. O medidor azul no vaso mostra a água.
- Só dá para regar quando a água passa da linha vermelha do medidor (menos de 20%). Nessa hora aparece uma gotinha pulando em cima do vaso.
- O regador fica na frente da bancada: olhe para ele para pegar (ou devolver) e depois olhe para um vaso para regar. A nuvem também rega quando para em cima de um vaso com pouca água.
- Ao lado das cestas fica o quadro de PREÇOS, com quanto os clientes pagam por fruto. Ele mostra as sementes que você já tem; as outras aparecem como "???".
- Atrás de você fica a barraca. O cliente mostra o pedido num balão, com quanto vai pagar por cada fruto (ex.: TOMATE 🍅 x4 = 16 🪙) e o total; quando as cestas têm tudo, a borda fica verde e é só olhar para ele para entregar e ganhar moedas.
- Depois de 3 pedidos entregues na mesma partida, o céu fica dourado.
- Ao lado direito da barraca fica a loja: mais vasos (até 4) e sementes novas. Olhar para um item abre um quadro com os detalhes (por exemplo, quanto vale cada fruto). Para comprar, segure o olhar em COMPRAR por 1,5 s; o X fecha. Itens caros demais ficam apagados, e os já comprados ganham um ✓.
- Os nomes aparecem escritos em letra de forma maiúscula nos quadros, para ajudar a ligar a palavra ao objeto.

O jogo começa com 1 vaso e a semente de tomate. O progresso (cestas, vasos, sementes e moedas) fica salvo no navegador; o botão "Recomeçar" no menu apaga tudo.

Teste de desempenho (menu):
- "Detalhes: alto/baixo" troca os objetos do cenário entre a versão caprichada e a versão simples. A página recarrega; o progresso continua salvo. No alto:
  - mesa e mesinhas de tábuas com veio e pregos, prateleira com vasinhos, saco de terra e pá;
  - cerca de estacas, mato, flores, pedrinhas e moitas em volta;
  - vaso torneado com pratinho e pacote de papel com o nome escrito;
  - regador com frisos e crivo furadinho, cestas de vime com paninho xadrez;
  - barraca de tábuas com toldo de franja recortada, bandeirinhas e caixote de tomates;
  - quadros da loja e de preços com moldura, cantoneiras e telhadinho;
  - borboleta com asas pintadas (nervuras, bordas, bolinhas e um "olho"), antenas, olhos e perninhas.
- "Medidor: ligado" mostra no canto de cima, durante o jogo, o FPS, os triângulos e os desenhos (draw calls) de cada quadro. Ao sair, o menu mostra o resumo da partida (média e pior FPS). No celular, jogue 1–2 minutos em cada nível e compare os resumos.

Celular (Chrome Android): use o endereço `https` que o `dev:https` mostrar, na mesma rede Wi-Fi. O giroscópio só funciona em HTTPS. Aceite o aviso de certificado (Avançado > Continuar), vire o celular de lado, toque em Começar e encaixe no Cardboard.
