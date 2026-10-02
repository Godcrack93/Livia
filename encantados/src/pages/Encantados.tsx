import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { CharacterSprite } from "../components/CharacterSprite";
import { CharacterTray } from "../components/CharacterTray";
import { StageSlot } from "../components/StageSlot";
import {
  isAudioReady,
  setMuted,
  setOnBeat,
  syncVoices,
  unlockAudio,
} from "../game/audioEngine";
import { CHARACTER_BY_ID, type CharacterId } from "../game/characters";
import "./Encantados.css";

const SLOT_COUNT = 7;

type DragState = {
  id: CharacterId;
  from: "tray" | number;
  x: number;
  y: number;
};

function slotFromPoint(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y);
  const slot = el?.closest("[data-slot]");
  if (!slot) return null;
  const value = Number(slot.getAttribute("data-slot"));
  return Number.isInteger(value) ? value : null;
}

export function Encantados() {
  const [ready, setReady] = useState(isAudioReady);
  const [starting, setStarting] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [slots, setSlots] = useState<Array<CharacterId | null>>(Array(SLOT_COUNT).fill(null));
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const [beatOn, setBeatOn] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  const usedIds = new Set(slots.filter((id): id is CharacterId => id !== null));

  useEffect(() => {
    document.documentElement.style.setProperty("--beat", `${60 / 105}s`);
    setOnBeat((beat) => setBeatOn(beat % 2 === 0));
    return () => {
      setOnBeat(null);
      syncVoices([]);
    };
  }, []);

  useEffect(() => {
    if (ready) {
      syncVoices(slots.filter((id): id is CharacterId => id !== null));
    }
  }, [ready, slots]);

  useEffect(() => {
    if (!drag) {
      document.body.classList.remove("dragging");
      setHoverSlot(null);
      return;
    }

    document.body.classList.add("dragging");

    const onMove = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      setDrag({ ...current, x: event.clientX, y: event.clientY });
      setHoverSlot(slotFromPoint(event.clientX, event.clientY));
    };

    const onUp = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      const target = slotFromPoint(event.clientX, event.clientY);
      if (target !== null) {
        setSlots((prev) => {
          const next = [...prev];
          for (let i = 0; i < next.length; i++) {
            if (next[i] === current.id) next[i] = null;
          }
          next[target] = current.id;
          return next;
        });
      } else if (current.from !== "tray") {
        const fromSlot = current.from;
        setSlots((prev) => {
          const next = [...prev];
          next[fromSlot] = null;
          return next;
        });
      }
      setDrag(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag !== null]);

  async function begin() {
    setStarting(true);
    await unlockAudio();
    setMuted(muted);
    syncVoices(slots.filter((id): id is CharacterId => id !== null));
    setReady(true);
    setStarting(false);
  }

  function grabFromTray(id: CharacterId, event: ReactPointerEvent) {
    event.preventDefault();
    setDrag({ id, from: "tray", x: event.clientX, y: event.clientY });
  }

  function grabFromSlot(index: number, event: ReactPointerEvent) {
    const id = slots[index];
    if (!id) return;
    event.preventDefault();
    setDrag({ id, from: index, x: event.clientX, y: event.clientY });
  }

  function clearAll() {
    setSlots(Array(SLOT_COUNT).fill(null));
  }

  function toggleMute() {
    const next = !muted;
    setMutedState(next);
    if (ready) setMuted(next);
  }

  return (
    <div className="game">
      <header className="game-bar">
        <Link className="bar-btn" to="/">
          Voltar
        </Link>
        <h1>Encantados</h1>
        <div className="bar-actions">
          <span className={`beat-pulse${beatOn ? " is-on" : ""}`} aria-hidden="true" />
          <button type="button" className="bar-btn" onClick={toggleMute}>
            {muted ? "Som" : "Mudo"}
          </button>
          <button type="button" className="bar-btn danger" onClick={clearAll}>
            Limpar tudo
          </button>
        </div>
      </header>

      <section className="stage-scene">
        <div className="sun" aria-hidden="true" />
        <div className="river" aria-hidden="true" />
        <div className="platform">
          {slots.map((id, index) => (
            <StageSlot
              key={index}
              index={index}
              characterId={id}
              highlight={hoverSlot === index}
              hidden={drag?.from === index}
              onGrab={(event) => grabFromSlot(index, event)}
            />
          ))}
        </div>
      </section>

      <CharacterTray usedIds={usedIds} draggingId={drag?.from === "tray" ? drag.id : null} onGrab={grabFromTray} />

      {drag ? (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
          <CharacterSprite id={drag.id} size={108} />
          <span>{CHARACTER_BY_ID[drag.id].name}</span>
        </div>
      ) : null}

      {!ready ? (
        <button type="button" className="start-overlay" onClick={begin} disabled={starting}>
          <div className="start-card">
            <div className="start-art" aria-hidden="true">
              <CharacterSprite id="saci" size={90} />
              <CharacterSprite id="boto" size={90} />
              <CharacterSprite id="guaraci" size={90} />
            </div>
            <h2>{starting ? "Afinando as lendas…" : "Clique para começar"}</h2>
            <p>Arraste um Encantado para a silhueta cinza e o som entra no ritmo.</p>
          </div>
        </button>
      ) : null}
    </div>
  );
}
