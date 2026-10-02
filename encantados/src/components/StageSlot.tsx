import type { PointerEvent } from "react";
import { CHARACTER_BY_ID, type CharacterId } from "../game/characters";
import { CharacterSprite, SilhouettePolo } from "./CharacterSprite";

type StageSlotProps = {
  index: number;
  characterId: CharacterId | null;
  highlight: boolean;
  hidden: boolean;
  onGrab: (event: PointerEvent<HTMLDivElement>) => void;
};

export function StageSlot({ index, characterId, highlight, hidden, onGrab }: StageSlotProps) {
  const character = characterId ? CHARACTER_BY_ID[characterId] : null;

  return (
    <div className={`stage-slot${highlight ? " is-target" : ""}`} data-slot={index}>
      {character && !hidden ? (
        <div
          className="stage-character"
          onPointerDown={onGrab}
          role="button"
          tabIndex={0}
          aria-label={`Tirar ${character.name} do palco`}
        >
          <CharacterSprite id={character.id} playing size={132} />
          <span className="stage-name">{character.name}</span>
        </div>
      ) : (
        <SilhouettePolo highlight={highlight} />
      )}
    </div>
  );
}
