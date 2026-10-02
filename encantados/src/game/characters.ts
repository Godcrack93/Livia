export type Category = "beats" | "effects" | "melodies" | "vocals";

export type CharacterId =
  | "saci"
  | "curupira"
  | "caipora"
  | "mapinguari"
  | "boi-bumba"
  | "boitata"
  | "matinta"
  | "cuca"
  | "tutu"
  | "anhanga"
  | "iara"
  | "uirapuru"
  | "vitoria-regia"
  | "mae-do-ouro"
  | "guaraci"
  | "boto"
  | "fulozinha"
  | "jaci"
  | "negrinho"
  | "mani";

export type Character = {
  id: CharacterId;
  name: string;
  category: Category;
  color: string;
  stroke: string;
};

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "beats", label: "Batidas" },
  { id: "effects", label: "Efeitos" },
  { id: "melodies", label: "Melodias" },
  { id: "vocals", label: "Vozes" },
];

export const CHARACTERS: Character[] = [
  { id: "saci", name: "Saci", category: "beats", color: "#e23d3d", stroke: "#8c1c1c" },
  { id: "curupira", name: "Curupira", category: "beats", color: "#2f9e44", stroke: "#165c24" },
  { id: "caipora", name: "Caipora", category: "beats", color: "#c45c26", stroke: "#7a3010" },
  { id: "mapinguari", name: "Mapinguari", category: "beats", color: "#c4a36a", stroke: "#6e5228" },
  { id: "boi-bumba", name: "Boi Bumbá", category: "beats", color: "#f0c419", stroke: "#9a6b00" },
  { id: "boitata", name: "Boitatá", category: "effects", color: "#ff7a18", stroke: "#a33c00" },
  { id: "matinta", name: "Matinta", category: "effects", color: "#6b7c8d", stroke: "#33404c" },
  { id: "cuca", name: "Cuca", category: "effects", color: "#7cb342", stroke: "#3d5c1a" },
  { id: "tutu", name: "Tutu", category: "effects", color: "#8e74c4", stroke: "#4d3a78" },
  { id: "anhanga", name: "Anhangá", category: "effects", color: "#4f7a5a", stroke: "#244032" },
  { id: "iara", name: "Iara", category: "melodies", color: "#3aa0d1", stroke: "#155a7a" },
  { id: "uirapuru", name: "Uirapuru", category: "melodies", color: "#2bbbad", stroke: "#14665e" },
  { id: "vitoria-regia", name: "Vitória-Régia", category: "melodies", color: "#f3a6c4", stroke: "#b05a7c" },
  { id: "mae-do-ouro", name: "Mãe-do-Ouro", category: "melodies", color: "#e6c14a", stroke: "#8a6a12" },
  { id: "guaraci", name: "Guaraci", category: "melodies", color: "#ffb703", stroke: "#c06000" },
  { id: "boto", name: "Boto", category: "vocals", color: "#f48fb1", stroke: "#b04a72" },
  { id: "fulozinha", name: "Fulozinha", category: "vocals", color: "#66bb6a", stroke: "#2e6b32" },
  { id: "jaci", name: "Jaci", category: "vocals", color: "#c5b4e3", stroke: "#6d5a96" },
  { id: "negrinho", name: "Negrinho", category: "vocals", color: "#8d6e4e", stroke: "#4a3420" },
  { id: "mani", name: "Mani", category: "vocals", color: "#f3e2b3", stroke: "#b08948" },
];

export const CHARACTER_BY_ID: Record<CharacterId, Character> = Object.fromEntries(
  CHARACTERS.map((character) => [character.id, character]),
) as Record<CharacterId, Character>;

export function charactersIn(category: Category): Character[] {
  return CHARACTERS.filter((character) => character.category === category);
}
