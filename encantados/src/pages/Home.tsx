import { Link } from "react-router-dom";
import { CharacterSprite } from "../components/CharacterSprite";
import "./Home.css";

export function Home() {
  return (
    <main className="hub">
      <header className="hub-header">
        <p className="hub-kicker">Cantinho de brincar</p>
        <h1>Jogos da Lívia</h1>
        <p className="hub-sub">Escolha um jogo e monte sua música com as lendas do Brasil.</p>
      </header>

      <Link className="game-card" to="/encantados">
        <div className="game-card-art" aria-hidden="true">
          <CharacterSprite id="saci" size={110} />
          <CharacterSprite id="iara" size={110} />
          <CharacterSprite id="curupira" size={110} />
        </div>
        <div className="game-card-copy">
          <span className="game-tag">Folclore brasileiro</span>
          <h2>Encantados</h2>
          <p>Arraste cada lenda para uma silhueta cinza. Cada uma canta um som diferente!</p>
          <span className="play-btn">Jogar</span>
        </div>
      </Link>
    </main>
  );
}
