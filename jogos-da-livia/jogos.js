/* Jogos que aparecem na página inicial, na ordem dos cartões.
   Para incluir um jogo novo: coloque a pasta dele em jogos/<nome>/ (com index.html e uma capa) e acrescente um item aqui. */
window.JOGOS = [
  {
    id: 'sprunkinhos',
    nome: 'Sprunkinhos',
    frase: 'Arraste os personagens até os bonecos cinzas e monte a sua banda. Tem até modo terror!',
    tipo: 'Música',
    endereco: 'jogos/sprunkinhos/index.html',
    capa: 'jogos/sprunkinhos/capa.svg',
    cor: '#FF6A3D',
    sombra: '#C2410C',
    // mostra no cartão quantos segredos já foram descobertos
    progresso: { chave: 'sprunkinhos.segredos', total: 9, rotulo: 'segredos' },
  },
  {
    id: 'parquinho',
    nome: 'Parquinho Sprunki',
    frase: 'Construa com blocos, dê armas aos Sprunkis e defenda todo mundo das versões de terror!',
    tipo: 'Construir',
    endereco: 'jogos/parquinho/index.html',
    capa: 'jogos/parquinho/capa.svg',
    cor: '#3B7BFF',
    sombra: '#1D4FC4',
  },
];
