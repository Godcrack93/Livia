// Notas na oitava dos estouros (Dó5 em diante).
const N = {
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880,
  B5: 987.77,
  C6: 1046.5,
  D6: 1174.66,
  E6: 1318.51,
};

function notes(text) {
  return text.split(/\s+/).map((name) => N[name]);
}

// Cada estouro seguido toca a próxima nota; completar a melodia dá bônus.
// Para uma música nova: título curto (aparece no "VOCÊ TOCOU ...") e as notas.
export const SONGS = [
  {
    title: "BRILHA BRILHA",
    notes: notes("C5 C5 G5 G5 A5 A5 G5 F5 F5 E5 E5 D5 D5 C5"),
  },
  {
    title: "O ÔNIBUS",
    notes: notes("C5 F5 F5 F5 F5 A5 C6 A5 F5 G5 E5 C5 C6 A5 F5"),
  },
  {
    // Tema da Peppa Pig, tirado de ouvido (aproximado). Só para uso em casa: a melodia tem direitos autorais.
    title: "PEPPA PIG",
    notes: notes("G5 E5 C5 E5 G5 G5 A5 G5 E5 C5 D5 E5 C5 D5 C5"),
  },
];
