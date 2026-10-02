import type { PointerEvent } from "react";
import { CATEGORIES, charactersIn, type CharacterId } from "../game/characters";
import { CharacterSprite } from "./CharacterSprite";

type CharacterTrayProps = {
  usedIds: Set<CharacterId>;
  draggingId: CharacterId | null;
  onGrab: (id: CharacterId, event: PointerEvent<HTMLButtonElement>) => void;
};

export function CharacterTray({ usedIds, draggingId, onGrab }: CharacterTrayProps) {
  return (
    <div className="tray" data-tray="true">
      {CATEGORIES.map((category) => (
        <div className={`tray-row cat-${category.id}`} key={category.id}>
          <p className="tray-label">{category.label}</p>
          <div className="tray-cells">
            {charactersIn(category.id).map((character) => {
              const used = usedIds.has(character.id);
              const ghost = draggingId === character.id;
              return (
                <button
                  type="button"
                  className={`tray-cell${used || ghost ? " is-empty" : ""}`}
                  key={character.id}
                  disabled={used}
                  onPointerDown={(event) => {
                    if (!used) onGrab(character.id, event);
                  }}
                  aria-label={used ? `${character.name} já está no palco` : `Arrastar ${character.name}`}
                >
                  {used || ghost ? (
                    <span className="tray-placeholder" />
                  ) : (
                    <>
                      <CharacterSprite id={character.id} size={72} />
                      <span className="tray-name">{character.name}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
