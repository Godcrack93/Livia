import type { CharacterId } from "../game/characters";
import "./CharacterSprite.css";

type SpriteProps = {
  id: CharacterId;
  playing?: boolean;
  size?: number;
};

function Eyes() {
  return (
    <g className="eyes">
      <ellipse cx="64" cy="70" rx="7" ry="9" fill="#1d1d1d" />
      <ellipse cx="96" cy="70" rx="7" ry="9" fill="#1d1d1d" />
      <circle cx="66.5" cy="67" r="2.3" fill="#fff" />
      <circle cx="98.5" cy="67" r="2.3" fill="#fff" />
    </g>
  );
}

function Smile() {
  return (
    <path
      className="mouth"
      d="M66 90 Q80 104 94 90"
      fill="none"
      stroke="#1d1d1d"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
  );
}

function Cheeks({ color = "#f4a2a2" }: { color?: string }) {
  return (
    <g>
      <ellipse cx="52" cy="84" rx="8" ry="5" fill={color} opacity="0.85" />
      <ellipse cx="108" cy="84" rx="8" ry="5" fill={color} opacity="0.85" />
    </g>
  );
}

function Polo({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g>
      <ellipse cx="80" cy="154" rx="50" ry="56" fill={fill} stroke={stroke} strokeWidth="3.6" />
      <circle cx="80" cy="74" r="44" fill={fill} stroke={stroke} strokeWidth="3.6" />
    </g>
  );
}

function CharacterArt({ id }: { id: CharacterId }) {
  switch (id) {
    case "saci":
      return (
        <>
          <Polo fill="#e23d3d" stroke="#8c1c1c" />
          <path d="M38 48c8-28 76-28 84 0" fill="#1a1a1a" />
          <ellipse cx="80" cy="46" rx="46" ry="16" fill="#1a1a1a" />
          <circle cx="80" cy="22" r="8" fill="#1a1a1a" />
          <circle cx="80" cy="22" r="4" fill="#e23d3d" />
          <Cheeks />
          <Eyes />
          <Smile />
          <ellipse cx="80" cy="208" rx="14" ry="8" fill="#5b3310" />
        </>
      );
    case "curupira":
      return (
        <>
          <path d="M42 58 52 8 68 48 80 6 94 48 110 8 120 58" fill="#ff7a18" stroke="#c44500" strokeWidth="3" />
          <Polo fill="#2f9e44" stroke="#165c24" />
          <Cheeks color="#ffd19a" />
          <Eyes />
          <Smile />
          <ellipse cx="46" cy="206" rx="16" ry="8" fill="#5b3310" transform="rotate(18 46 206)" />
          <ellipse cx="114" cy="206" rx="16" ry="8" fill="#5b3310" transform="rotate(-18 114 206)" />
        </>
      );
    case "caipora":
      return (
        <>
          <Polo fill="#c45c26" stroke="#7a3010" />
          <path d="M48 34 62 10 80 32 98 10 112 34 80 46Z" fill="#3d8b3d" stroke="#1f5a1f" strokeWidth="3" />
          <Cheeks />
          <Eyes />
          <Smile />
          <ellipse cx="54" cy="208" rx="12" ry="7" fill="#5b3310" />
          <ellipse cx="106" cy="208" rx="12" ry="7" fill="#5b3310" />
        </>
      );
    case "mapinguari":
      return (
        <>
          <ellipse cx="80" cy="150" rx="56" ry="58" fill="#c4a36a" stroke="#6e5228" strokeWidth="3.6" />
          <circle cx="80" cy="78" r="48" fill="#c4a36a" stroke="#6e5228" strokeWidth="3.6" />
          <path d="M40 70c8-28 72-28 80 0" fill="#a9854c" />
          <Cheeks color="#e8c9a0" />
          <Eyes />
          <Smile />
        </>
      );
    case "boi-bumba":
      return (
        <>
          <Polo fill="#f0c419" stroke="#9a6b00" />
          <path d="M28 64c-10-28 18-38 28-16" fill="none" stroke="#c0392b" strokeWidth="8" strokeLinecap="round" />
          <path d="M132 64c10-28-18-38-28-16" fill="none" stroke="#c0392b" strokeWidth="8" strokeLinecap="round" />
          <circle cx="80" cy="52" r="7" fill="#c0392b" />
          <Cheeks />
          <Eyes />
          <Smile />
        </>
      );
    case "boitata":
      return (
        <>
          <path
            d="M36 196c8-40 52-18 52-58 0-28-34-22-30-48 4-24 50-18 54 8 4 28-28 22-18 48 12 30 50 8 46 40"
            fill="#ff7a18"
            stroke="#a33c00"
            strokeWidth="4"
          />
          <circle cx="108" cy="58" r="22" fill="#ffd166" stroke="#a33c00" strokeWidth="3" />
          <ellipse cx="101" cy="54" rx="4" ry="6" fill="#1d1d1d" />
          <ellipse cx="113" cy="54" rx="4" ry="6" fill="#1d1d1d" />
          <circle cx="86" cy="92" r="8" fill="#ffe08a" />
          <circle cx="70" cy="128" r="8" fill="#ffe08a" />
          <circle cx="96" cy="158" r="8" fill="#ffe08a" />
        </>
      );
    case "matinta":
      return (
        <>
          <Polo fill="#6b7c8d" stroke="#33404c" />
          <path d="M34 70c18-54 74-54 92 0" fill="#44515e" />
          <ellipse cx="118" cy="42" rx="18" ry="14" fill="#d8d2c4" stroke="#33404c" strokeWidth="3" />
          <circle cx="124" cy="40" r="3" fill="#1d1d1d" />
          <Cheeks color="#c9b8a6" />
          <Eyes />
          <Smile />
        </>
      );
    case "cuca":
      return (
        <>
          <path d="M44 40 56 8 72 36 80 4 90 36 108 8 118 42" fill="#3d5c1a" />
          <Polo fill="#7cb342" stroke="#3d5c1a" />
          <ellipse cx="80" cy="92" rx="18" ry="10" fill="#5d8a2e" />
          <Cheeks />
          <Eyes />
          <Smile />
          <ellipse cx="52" cy="200" rx="16" ry="10" fill="#5a7a24" />
          <ellipse cx="108" cy="200" rx="16" ry="10" fill="#5a7a24" />
        </>
      );
    case "tutu":
      return (
        <>
          <path d="M28 70c4-40 100-40 104 0v110c-8 24-96 24-104 0Z" fill="#8e74c4" stroke="#4d3a78" strokeWidth="3.6" />
          <circle cx="64" cy="92" r="8" fill="#1d1d1d" />
          <circle cx="96" cy="92" r="8" fill="#1d1d1d" />
          <circle cx="66" cy="90" r="2.2" fill="#fff" />
          <circle cx="98" cy="90" r="2.2" fill="#fff" />
          <path d="M70 112 Q80 118 90 112" fill="none" stroke="#1d1d1d" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "anhanga":
      return (
        <>
          <path d="M52 38 44 8 68 42" fill="#e8e0d0" stroke="#244032" strokeWidth="3" />
          <path d="M108 38 116 8 92 42" fill="#e8e0d0" stroke="#244032" strokeWidth="3" />
          <Polo fill="#4f7a5a" stroke="#244032" />
          <circle cx="58" cy="128" r="6" fill="#e8e0d0" />
          <circle cx="100" cy="150" r="6" fill="#e8e0d0" />
          <Cheeks />
          <Eyes />
          <Smile />
        </>
      );
    case "iara":
      return (
        <>
          <path d="M50 148c4 36 56 40 60 8 2 22-18 52-30 60-20-10-36-40-30-68Z" fill="#2bb07a" stroke="#155a7a" strokeWidth="3.6" />
          <ellipse cx="80" cy="142" rx="42" ry="40" fill="#3aa0d1" stroke="#155a7a" strokeWidth="3.6" />
          <circle cx="80" cy="74" r="40" fill="#3aa0d1" stroke="#155a7a" strokeWidth="3.6" />
          <path d="M44 58c10-28 62-32 78-4-18-8-40-6-50 6" fill="#0d4d68" />
          <path d="M118 78c12 16 8 36-6 44 18-2 28-28 6-44Z" fill="#0d4d68" />
          <Cheeks />
          <Eyes />
          <Smile />
          <circle cx="120" cy="92" r="7" fill="#f3a6c4" />
        </>
      );
    case "uirapuru":
      return (
        <>
          <ellipse cx="80" cy="120" rx="48" ry="36" fill="#2bbbad" stroke="#14665e" strokeWidth="3.6" />
          <circle cx="118" cy="92" r="26" fill="#ffb703" stroke="#14665e" strokeWidth="3.4" />
          <path d="M36 110c-18-8-22-40-6-48 8 14 18 24 28 28Z" fill="#c0392b" />
          <path d="M70 88c8-28 28-36 40-20" fill="#148f84" />
          <path d="M138 96 158 100 138 108Z" fill="#e67e22" />
          <ellipse cx="126" cy="88" rx="4" ry="5" fill="#1d1d1d" />
          <circle cx="127.5" cy="86.5" r="1.4" fill="#fff" />
          <ellipse cx="58" cy="156" rx="16" ry="8" fill="#14665e" />
          <ellipse cx="96" cy="160" rx="16" ry="8" fill="#14665e" />
        </>
      );
    case "vitoria-regia":
      return (
        <>
          <ellipse cx="80" cy="188" rx="62" ry="18" fill="#3d8b3d" stroke="#1f5a1f" strokeWidth="3" />
          <circle cx="80" cy="86" r="46" fill="#f3a6c4" stroke="#b05a7c" strokeWidth="3.6" />
          <path d="M80 48 92 76 122 80 100 98 106 128 80 112 54 128 60 98 38 80 68 76Z" fill="#fff7dc" />
          <Cheeks />
          <Eyes />
          <Smile />
        </>
      );
    case "mae-do-ouro":
      return (
        <>
          <Polo fill="#e6c14a" stroke="#8a6a12" />
          <circle cx="80" cy="28" r="16" fill="#fff3b0" stroke="#8a6a12" strokeWidth="3" />
          <path d="M40 70c14-36 66-36 80 0" fill="#d4a017" />
          <Cheeks />
          <Eyes />
          <Smile />
        </>
      );
    case "guaraci":
      return (
        <>
          <g className="rays">
            {Array.from({ length: 10 }, (_, index) => (
              <rect
                key={index}
                x="76"
                y="8"
                width="8"
                height="28"
                rx="4"
                fill="#ffb703"
                transform={`rotate(${index * 36} 80 110)`}
              />
            ))}
          </g>
          <circle cx="80" cy="110" r="52" fill="#ffe08a" stroke="#c06000" strokeWidth="3.6" />
          <Cheeks />
          <Eyes />
          <Smile />
        </>
      );
    case "boto":
      return (
        <>
          <ellipse cx="80" cy="128" rx="46" ry="58" fill="#f48fb1" stroke="#b04a72" strokeWidth="3.6" />
          <path d="M80 70c18-40 58-22 52 10" fill="#f48fb1" stroke="#b04a72" strokeWidth="3.6" />
          <path d="M36 150c-22 4-22 36 2 34" fill="#f48fb1" stroke="#b04a72" strokeWidth="3" />
          <Cheeks color="#ffd1dc" />
          <Eyes />
          <Smile />
        </>
      );
    case "fulozinha":
      return (
        <>
          <Polo fill="#66bb6a" stroke="#2e6b32" />
          <circle cx="48" cy="48" r="10" fill="#e23d3d" />
          <circle cx="80" cy="32" r="10" fill="#f0c419" />
          <circle cx="112" cy="48" r="10" fill="#3aa0d1" />
          <Cheeks />
          <Eyes />
          <Smile />
        </>
      );
    case "jaci":
      return (
        <>
          <path d="M112 40c-28-28-76-8-76 40 0 40 40 64 72 52-28 4-52-22-52-52 0-28 24-48 56-40Z" fill="#c5b4e3" stroke="#6d5a96" strokeWidth="3.6" />
          <circle cx="96" cy="92" r="38" fill="#ede4ff" stroke="#6d5a96" strokeWidth="3.2" />
          <Cheeks color="#e4d2f7" />
          <Eyes />
          <Smile />
        </>
      );
    case "negrinho":
      return (
        <>
          <Polo fill="#8d6e4e" stroke="#4a3420" />
          <ellipse cx="80" cy="42" rx="50" ry="16" fill="#c4a36a" stroke="#4a3420" strokeWidth="3" />
          <rect x="30" y="42" width="100" height="10" rx="4" fill="#c4a36a" />
          <Cheeks />
          <Eyes />
          <Smile />
          <circle cx="118" cy="58" r="8" fill="#ffd166" stroke="#9a6b00" strokeWidth="2.5" />
        </>
      );
    case "mani":
      return (
        <>
          <Polo fill="#f3e2b3" stroke="#b08948" />
          <path d="M80 18c-8 18-28 22-18 40 16-8 28-8 44 0 10-18-10-22-18-40Z" fill="#7cb342" />
          <Cheeks />
          <Eyes />
          <Smile />
        </>
      );
  }
}

export function CharacterSprite({ id, playing = false, size = 96 }: SpriteProps) {
  return (
    <svg
      className={`sprite char-${id}${playing ? " is-playing" : ""}`}
      viewBox="0 0 160 220"
      width={size}
      height={size * 1.375}
      aria-hidden="true"
    >
      <CharacterArt id={id} />
    </svg>
  );
}

export function SilhouettePolo({ highlight = false }: { highlight?: boolean }) {
  const fill = highlight ? "#c5ccd6" : "#8f98a4";
  const stroke = highlight ? "#7d8794" : "#6c7580";
  return (
    <svg className={`sprite silhouette${highlight ? " is-hot" : ""}`} viewBox="0 0 160 220" width="148" height="203" aria-hidden="true">
      <ellipse cx="80" cy="154" rx="50" ry="56" fill={fill} stroke={stroke} strokeWidth="3.6" />
      <circle cx="80" cy="74" r="44" fill={fill} stroke={stroke} strokeWidth="3.6" />
    </svg>
  );
}
