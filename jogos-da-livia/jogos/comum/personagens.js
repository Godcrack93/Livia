/* Jogos da Lívia — elenco dos Sprunkinhos e desenho dos personagens (SVG gerado em código). Usado pelo Sprunkinhos e pelo Parquinho.
   Cada personagem também tem uma versão de terror: olhos brilhantes, dentes afiados, rachaduras e tinta preta. Sem sangue. */
(function () {
  'use strict';
  const INK = '#22183A', BLK = '#050205', DARK = '#0B0407';

  function hex(c) { c = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)); }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function star(cx, cy, R, r, n) {
    n = n || 5; const p = [];
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R;
      p.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1));
    }
    return p.join(' ');
  }

  const CATS = {
    beat: { name: 'Batidas', color: '#FF6A3D' },
    fx: { name: 'Efeitos', color: '#12A874' },
    mel: { name: 'Melodias', color: '#3B7BFF' },
    voc: { name: 'Vozes', color: '#B84BEF' },
  };

  const CHARS = [
    { id: 'bumbo', name: 'Bumbo', cat: 'beat', color: '#FF8A1F', acc: 'headphones', dance: 'bounce', sound: 'bumbo e caixa' },
    { id: 'chiado', name: 'Chiado', cat: 'beat', color: '#1CC6CF', acc: 'cap', dance: 'nod', sound: 'chimbal' },
    { id: 'boquinha', name: 'Boquinha', cat: 'beat', color: '#EE3B3B', acc: 'horns', dance: 'hop', sound: 'beatbox' },
    { id: 'palminha', name: 'Palminha', cat: 'beat', color: '#FFD83F', acc: 'buns', dance: 'clap', sound: 'palmas' },
    { id: 'bongo', name: 'Bongô', cat: 'beat', color: '#C47A3D', acc: 'bandana', dance: 'sway', sound: 'bongô' },
    { id: 'zip', name: 'Zip', cat: 'fx', color: '#9BDB2E', acc: 'antennae', dance: 'wiggle', sound: 'laser' },
    { id: 'mola', name: 'Mola', cat: 'fx', color: '#D946C4', acc: 'spring', dance: 'hop', sound: 'boing' },
    { id: 'risco', name: 'DJ Risco', cat: 'fx', color: '#3050B0', acc: 'vinyl', dance: 'nod', sound: 'scratch' },
    { id: 'estrelinha', name: 'Estrelinha', cat: 'fx', color: '#B39CFF', acc: 'star', dance: 'sway', sound: 'brilhos' },
    { id: 'robo', name: 'Robô', cat: 'fx', color: '#A9BCD0', acc: 'robot', dance: 'robot', sound: 'bipes' },
    { id: 'grave', name: 'Grave', cat: 'mel', color: '#7446D9', acc: 'beanie', dance: 'bounce', sound: 'baixo' },
    { id: 'tecla', name: 'Tecla', cat: 'mel', color: '#2F7BF0', acc: 'glasses', dance: 'nod', sound: 'teclado' },
    { id: 'pisca', name: 'Pisca', cat: 'mel', color: '#4FD9AE', acc: 'bulb', dance: 'wiggle', sound: 'arpejo' },
    { id: 'sininho', name: 'Sininho', cat: 'mel', color: '#62C6FF', acc: 'bell', dance: 'sway', sound: 'sininhos' },
    { id: 'flautinha', name: 'Flautinha', cat: 'mel', color: '#43BC55', acc: 'sprout', dance: 'sway', sound: 'flauta' },
    { id: 'nuvem', name: 'Nuvem', cat: 'voc', color: '#EEF2FF', dark: '#C9D3FF', outline: '#7381C4', acc: 'cloud', dance: 'float', sound: 'uuuh' },
    { id: 'dudu', name: 'Dudu', cat: 'voc', color: '#A2305E', acc: 'tophat', dance: 'bounce', sound: 'dum-dum' },
    { id: 'lala', name: 'Lalá', cat: 'voc', color: '#FF7CB8', acc: 'bunny', dance: 'sway', sound: 'lá-lá', prop: 'mic', iconVB: '0 -50 200 200' },
    { id: 'ua', name: 'Uá', cat: 'voc', color: '#FFA77E', acc: 'quiff', dance: 'wiggle', sound: 'uá-uá' },
    { id: 'tiriri', name: 'Tiriri', cat: 'voc', color: '#FFB21F', acc: 'hamster', dance: 'hop', sound: 'tiriri' },
    { id: 'lua', name: 'Lua', cat: 'special', color: '#2E2870', light: '#6F68C9', acc: 'nightcap', dance: 'float', sound: 'noite' },
  ];

  const PROPS = {
    mic: () => `<g transform="rotate(-18 150 240)"><rect x="144.5" y="206" width="11" height="36" rx="5" fill="#2A2340"/>
      <circle cx="150" cy="202" r="12" fill="#D5DAE3" stroke="#4A4F63" stroke-width="3"/>
      <path d="M141 199 H 159 M140 205 H 160" stroke="#9AA1B2" stroke-width="2"/></g>`,
  };
  const SPRING = 'M100 48 C 82 46, 82 38, 100 38 C 118 38, 118 30, 100 30 C 82 30, 82 22, 100 22 C 118 22, 118 14, 100 14';
  const CLOUD = [[50, 62, 21], [72, 42, 25], [100, 32, 27], [128, 42, 25], [150, 62, 21], [100, 52, 22]];

  const ACC = {
    headphones: () => ({
      front: `<g class="acc" data-a="pulse" data-px="100" data-py="104">
      <path d="M30 98 C 26 8, 174 8, 170 98" fill="none" stroke="#2A2340" stroke-width="12" stroke-linecap="round"/>
      <path d="M44 60 C 62 22, 138 22, 156 60" fill="none" stroke="#5A4E86" stroke-width="3" stroke-linecap="round"/>
      <rect x="12" y="78" width="32" height="52" rx="14" fill="#2A2340"/><rect x="19" y="87" width="18" height="34" rx="8" fill="#FFC062"/>
      <rect x="156" y="78" width="32" height="52" rx="14" fill="#2A2340"/><rect x="163" y="87" width="18" height="34" rx="8" fill="#FFC062"/></g>`,
    }),
    cap: k => ({
      front: `<g class="acc" data-a="nod" data-px="100" data-py="70">
      <path d="M150 72 C 172 58, 198 62, 199 75 C 186 84, 164 82, 150 78 Z" fill="#F2B200" stroke="#A87A00" stroke-width="4" stroke-linejoin="round"/>
      <path d="M33 78 C 33 18, 167 18, 167 78 Z" fill="#FFD23F" stroke="#A87A00" stroke-width="4" stroke-linejoin="round"/>
      <path d="M100 28 V 76 M66 36 C 78 50, 82 62, 82 76 M134 36 C 122 50, 118 62, 118 76" stroke="#E0A400" stroke-width="2.5" fill="none"/>
      <path d="M92 46 L 106 46 L 94 60 L 108 60" stroke="${k.c}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="100" cy="26" r="6" fill="${k.c}" stroke="#A87A00" stroke-width="3"/></g>`,
    }),
    horns: k => ({
      back: `<g class="acc" data-a="wiggle" data-px="100" data-py="60">
      <path d="M60 60 C 48 38, 48 18, 58 2 C 68 18, 82 32, 90 48 Z" fill="#FFF0D2" stroke="${k.O}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M140 60 C 152 38, 152 18, 142 2 C 132 18, 118 32, 110 48 Z" fill="#FFF0D2" stroke="${k.O}" stroke-width="4" stroke-linejoin="round"/></g>`,
      face: `<path d="M54 69 L 86 77" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M146 69 L 114 77" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
      mouth: `<path d="M105 140 L 112.5 140 L 108.7 148.5 Z" fill="#fff" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`,
    }),
    buns: k => ({
      back: `<g class="acc" data-a="wiggle" data-px="100" data-py="70">
      <circle cx="40" cy="56" r="25" fill="${k.D}" stroke="${k.O}" stroke-width="4"/><circle cx="160" cy="56" r="25" fill="${k.D}" stroke="${k.O}" stroke-width="4"/>
      <path d="M26 50 C 30 40, 40 36, 48 40 M174 50 C 170 40, 160 36, 152 40" stroke="${k.L}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M22 30 L 36 37 L 22 44 Z M50 30 L 36 37 L 50 44 Z" fill="#FF5C8A" stroke="#B3134A" stroke-width="2.5" stroke-linejoin="round"/><circle cx="36" cy="37" r="4.5" fill="#FF8FB0" stroke="#B3134A" stroke-width="2"/>
      <path d="M150 30 L 164 37 L 150 44 Z M178 30 L 164 37 L 178 44 Z" fill="#FF5C8A" stroke="#B3134A" stroke-width="2.5" stroke-linejoin="round"/><circle cx="164" cy="37" r="4.5" fill="#FF8FB0" stroke="#B3134A" stroke-width="2"/></g>`,
    }),
    bandana: () => ({
      front: `<g class="acc" data-a="nod" data-px="100" data-py="60">
      <path d="M164 68 L 192 56 L 188 80 Z M164 72 L 190 88 L 174 96 Z" fill="#E8453C" stroke="#8E1D18" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M30 80 C 30 18, 170 18, 170 80 C 140 64, 60 64, 30 80 Z" fill="#E8453C" stroke="#8E1D18" stroke-width="4" stroke-linejoin="round"/>
      <g fill="#fff" opacity=".92"><circle cx="60" cy="52" r="4"/><circle cx="84" cy="36" r="4"/><circle cx="114" cy="33" r="4"/><circle cx="140" cy="46" r="4"/><circle cx="100" cy="54" r="4"/><circle cx="74" cy="64" r="3.5"/><circle cx="128" cy="62" r="3.5"/></g>
      <circle cx="166" cy="70" r="7" fill="#C8352D" stroke="#8E1D18" stroke-width="3"/></g>`,
    }),
    antennae: k => ({
      back: `<g class="acc" data-a="wiggle" data-px="100" data-py="50">
      <path d="M80 50 Q 70 26 58 8" stroke="${k.O}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M120 50 Q 130 26 142 8" stroke="${k.O}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle class="glow" cx="58" cy="8" r="22" fill="#F4FF6B" opacity="0"/><circle class="glow" cx="142" cy="8" r="22" fill="#F4FF6B" opacity="0"/>
      <circle cx="58" cy="8" r="11" fill="#F4FF6B" stroke="${k.O}" stroke-width="4"/><circle cx="142" cy="8" r="11" fill="#F4FF6B" stroke="${k.O}" stroke-width="4"/>
      <circle cx="55" cy="5" r="3" fill="#fff"/><circle cx="139" cy="5" r="3" fill="#fff"/></g>`,
    }),
    spring: k => ({
      back: `<g class="acc" data-a="boing" data-px="100" data-py="46">
      <path d="${SPRING}" fill="none" stroke="#8F97A8" stroke-width="7" stroke-linecap="round"/>
      <path d="${SPRING}" fill="none" stroke="#E3E7EF" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="100" cy="0" r="14" fill="#FF8BE6" stroke="${k.O}" stroke-width="4"/><circle cx="95" cy="-5" r="4" fill="#fff" opacity=".85"/></g>`,
    }),
    vinyl: () => ({
      front: `<g class="acc" data-a="nod" data-px="100" data-py="44"><g transform="rotate(-10 100 40)">
      <ellipse cx="100" cy="40" rx="66" ry="16" fill="#17151F" stroke="#000" stroke-width="3"/>
      <ellipse cx="100" cy="40" rx="52" ry="12" fill="none" stroke="#3A3650" stroke-width="2"/>
      <ellipse cx="100" cy="40" rx="38" ry="9" fill="none" stroke="#3A3650" stroke-width="2"/>
      <ellipse cx="100" cy="40" rx="17" ry="5" fill="#FF4D6D"/><ellipse cx="100" cy="40" rx="3" ry="1.2" fill="#17151F"/>
      <path d="M58 34 Q 80 28 104 28" stroke="#5A5670" stroke-width="2" fill="none"/></g></g>`,
      eyes: `<g class="eyes">
      <path d="M46 88 H 94 V 102 C 94 118, 82 124, 70 124 C 57 124, 46 117, 46 102 Z" fill="#14121C" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
      <path d="M106 88 H 154 V 102 C 154 117, 143 124, 130 124 C 118 124, 106 118, 106 102 Z" fill="#14121C" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
      <path d="M94 94 H 106" stroke="#14121C" stroke-width="5"/>
      <path d="M54 94 L 66 94 L 56 112 Z M114 94 L 126 94 L 116 112 Z" fill="#fff" opacity=".3"/></g>`,
      noHappy: true,
    }),
    star: k => ({
      back: `<path d="M100 46 V 24" stroke="${k.O}" stroke-width="5" stroke-linecap="round"/>
      <g class="acc" data-a="spin" data-px="100" data-py="6"><polygon class="glow" points="${star(100, 6, 32, 15)}" fill="#FFF2A8" opacity="0"/>
      <polygon points="${star(100, 6, 21, 9.5)}" fill="#FFD84D" stroke="#C99700" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="95" cy="2" r="3" fill="#fff" opacity=".9"/></g>`,
      face: `<polygon points="${star(52, 130, 7, 3)}" fill="#FFD84D"/><polygon points="${star(148, 130, 7, 3)}" fill="#FFD84D"/>`,
      noCheeks: true,
    }),
    beanie: () => ({
      front: `<path d="M28 82 C 24 14, 176 14, 172 82 Z" fill="#FFC233" stroke="#A9720A" stroke-width="4" stroke-linejoin="round"/>
      <path d="M44 34 C 52 50, 54 60, 54 66 M76 22 C 80 40, 82 52, 82 62 M124 22 C 120 40, 118 52, 118 62 M156 34 C 148 50, 146 60, 146 66" stroke="#E3A21A" stroke-width="3" fill="none"/>
      <path d="M26 68 C 60 56, 140 56, 174 68 L 174 82 C 140 72, 60 72, 26 82 Z" fill="#F0A818" stroke="#A9720A" stroke-width="4" stroke-linejoin="round"/>
      <g class="acc" data-a="boing" data-px="100" data-py="26"><circle cx="100" cy="14" r="15" fill="#FFF1C2" stroke="#A9720A" stroke-width="4"/></g>`,
    }),
    glasses: () => ({
      front: `<path d="M58 58 C 68 20, 132 18, 148 50 C 128 40, 106 40, 94 50 C 84 42, 70 46, 58 58 Z" fill="#1C2F66" stroke="#0E1838" stroke-width="3.5" stroke-linejoin="round"/>`,
      face: `<g fill="#ffffff" fill-opacity=".12" stroke="#1C1A2E" stroke-width="5"><circle cx="72" cy="100" r="26"/><circle cx="128" cy="100" r="26"/></g>
      <path d="M97 97 Q 100 92 103 97" stroke="#1C1A2E" stroke-width="5" fill="none"/><path d="M46 96 L 31 90 M154 96 L 169 90" stroke="#1C1A2E" stroke-width="5" stroke-linecap="round"/>`,
      body: `<path d="M100 172 L 76 160 L 76 186 Z M100 172 L 124 160 L 124 186 Z" fill="#fff" stroke="#1C1A2E" stroke-width="3" stroke-linejoin="round"/>
      <path d="M84 164 V 176 M91 167 V 177 M109 167 V 177 M116 164 V 176" stroke="#1C1A2E" stroke-width="4"/>
      <rect x="93" y="165" width="14" height="14" rx="4" fill="#1C1A2E"/>`,
    }),
    bulb: () => ({
      back: `<path d="M100 46 C 90 38, 110 32, 100 24" stroke="#555A6E" stroke-width="5" fill="none" stroke-linecap="round"/>
      <g class="acc" data-a="wiggle" data-px="100" data-py="24">
      <circle class="glow" cx="100" cy="0" r="30" fill="#FFF07A" opacity="0"/>
      <rect x="91" y="12" width="18" height="12" rx="3" fill="#9BA1B5" stroke="#4A4F63" stroke-width="3"/>
      <circle cx="100" cy="0" r="15" fill="#FFF8CC" stroke="#C9A400" stroke-width="3.5"/>
      <path d="M94 4 Q 100 -6 106 4" stroke="#E0B000" stroke-width="2.5" fill="none"/><circle cx="95" cy="-5" r="3" fill="#fff"/></g>`,
    }),
    bell: () => ({
      front: `<g class="acc" data-a="swing" data-px="100" data-py="4">
      <path d="M60 62 C 62 30, 76 10, 100 10 C 124 10, 138 30, 140 62 C 148 64, 150 72, 140 76 L 60 76 C 50 72, 52 64, 60 62 Z" fill="#FFCF3A" stroke="#B07E00" stroke-width="4" stroke-linejoin="round"/>
      <path d="M78 26 C 72 36, 70 48, 70 60" stroke="#FFF2B0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>
      <path d="M62 67 H 138" stroke="#E0A800" stroke-width="3"/>
      <circle cx="100" cy="3" r="7" fill="none" stroke="#B07E00" stroke-width="4"/></g>`,
    }),
    sprout: () => ({
      back: `<g class="acc" data-a="wiggle" data-px="100" data-py="44">
      <path d="M100 46 V 20" stroke="#2A7A36" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M100 24 C 86 4, 62 8, 56 18 C 68 30, 90 32, 100 24 Z" fill="#86E57E" stroke="#2A7A36" stroke-width="4" stroke-linejoin="round"/>
      <path d="M100 20 C 112 -2, 138 0, 146 10 C 134 24, 110 28, 100 20 Z" fill="#A6EF8E" stroke="#2A7A36" stroke-width="4" stroke-linejoin="round"/></g>`,
      front: `<g>${[0, 72, 144, 216, 288].map(a => { const r = (a - 90) * Math.PI / 180; return `<circle cx="${(146 + Math.cos(r) * 8).toFixed(1)}" cy="${(64 + Math.sin(r) * 8).toFixed(1)}" r="7" fill="#FF8FC1" stroke="#C2457F" stroke-width="2.5"/>`; }).join('')}
      <circle cx="146" cy="64" r="5.5" fill="#FFD84D" stroke="#C99700" stroke-width="2"/></g>`,
    }),
    cloud: () => ({
      front: `<g class="acc" data-a="float" data-px="100" data-py="50">
      ${CLOUD.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#AFC0EE" stroke-width="4"/>`).join('')}
      ${CLOUD.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 2.5}" fill="#fff"/>`).join('')}
      <path d="M74 30 C 82 20, 92 16, 104 16" stroke="#E4ECFF" stroke-width="4" fill="none" stroke-linecap="round"/></g>`,
    }),
    tophat: () => ({
      front: `<g class="acc" data-a="nod" data-px="100" data-py="46">
      <path d="M68 48 L 72 -6 C 72 -12, 128 -12, 128 -6 L 132 48 Z" fill="#2B2136" stroke="#120C1A" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M70 30 L 130 30 L 131.5 44 L 68.5 44 Z" fill="#F2C14E"/>
      <ellipse cx="100" cy="48" rx="58" ry="11" fill="#2B2136" stroke="#120C1A" stroke-width="3.5"/>
      <path d="M82 0 L 84 24" stroke="#54476A" stroke-width="4" stroke-linecap="round"/></g>`,
      face: `<path d="M100 124 C 92 115, 78 115, 72 123 C 66 131, 56 127, 55 118 C 54 134, 72 141, 84 134 C 92 130, 98 128, 100 128 C 102 128, 108 130, 116 134 C 128 141, 146 134, 145 118 C 144 127, 134 131, 128 123 C 122 115, 108 115, 100 124 Z" fill="#3B2416" stroke="#1E120A" stroke-width="2" stroke-linejoin="round"/>`,
      body: `<path d="M100 172 L 80 162 L 80 184 Z M100 172 L 120 162 L 120 184 Z" fill="#E84A5F" stroke="#8C1E33" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="172" r="6" fill="#C9354A" stroke="#8C1E33" stroke-width="2.5"/>`,
    }),
    bunny: k => ({
      back: `<g class="acc" data-a="ears" data-px="100" data-py="52">
      <g transform="rotate(-14 76 46)"><ellipse cx="76" cy="2" rx="17" ry="46" fill="${k.c}" stroke="${k.O}" stroke-width="4"/><ellipse cx="76" cy="6" rx="8" ry="32" fill="#FFD3E6"/></g>
      <g transform="rotate(18 124 46)"><ellipse cx="124" cy="2" rx="17" ry="46" fill="${k.c}" stroke="${k.O}" stroke-width="4"/><ellipse cx="124" cy="6" rx="8" ry="32" fill="#FFD3E6"/></g></g>`,
    }),
    quiff: () => ({
      front: `<g class="acc" data-a="nod" data-px="100" data-py="60">
      <path d="M30 84 L 34 112" stroke="#3A2A55" stroke-width="8" stroke-linecap="round"/><path d="M170 82 L 166 112" stroke="#3A2A55" stroke-width="8" stroke-linecap="round"/>
      <path d="M32 82 C 18 36, 58 4, 110 8 C 154 10, 186 40, 170 80 C 158 58, 134 48, 112 52 C 98 42, 64 46, 32 82 Z" fill="#3A2A55" stroke="#1E1530" stroke-width="4" stroke-linejoin="round"/>
      <path d="M66 24 C 94 10, 136 14, 160 38" stroke="#6E5C96" stroke-width="5" fill="none" stroke-linecap="round"/></g>`,
    }),
    hamster: k => ({
      back: `<g class="acc" data-a="wiggle" data-px="100" data-py="60"><circle cx="48" cy="50" r="22" fill="${k.c}" stroke="${k.O}" stroke-width="4"/><circle cx="48" cy="50" r="11" fill="#FFB7C9"/>
      <circle cx="152" cy="50" r="22" fill="${k.c}" stroke="${k.O}" stroke-width="4"/><circle cx="152" cy="50" r="11" fill="#FFB7C9"/></g>`,
      front: `<g class="acc" data-a="wiggle" data-px="128" data-py="40"><path d="M128 40 L 108 28 L 110 52 Z M128 40 L 148 28 L 146 52 Z" fill="#FF4D6D" stroke="#A3122F" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="128" cy="40" r="6" fill="#FF7A93" stroke="#A3122F" stroke-width="3"/></g>`,
      mouth: `<rect x="93" y="141" width="7" height="8" rx="1.5" fill="#fff" stroke="${INK}" stroke-width="1.5"/><rect x="100" y="141" width="7" height="8" rx="1.5" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`,
      bigCheeks: true,
    }),
    nightcap: k => ({
      front: `<g class="acc" data-a="nod" data-px="100" data-py="62">
      <path d="M30 84 C 22 30, 80 4, 130 12 C 168 18, 188 52, 182 98 C 176 80, 166 66, 156 60 C 160 68, 166 76, 168 84 C 130 70, 70 70, 30 84 Z" fill="#4A3FB0" stroke="#1C1650" stroke-width="4" stroke-linejoin="round"/>
      <path d="M28 78 C 70 62, 130 62, 170 78 L 170 88 C 130 74, 70 74, 28 90 Z" fill="#EDE7FF" stroke="#1C1650" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="182" cy="102" r="11" fill="#FFF3B0" stroke="#C9A400" stroke-width="3"/>
      <path d="M78 30 A 14 14 0 1 0 98 52 A 11 11 0 1 1 78 30 Z" fill="#FFE27A" stroke="#C9A400" stroke-width="2"/>
      <polygon points="${star(128, 34, 5, 2.2)}" fill="#FFE27A"/><polygon points="${star(150, 52, 4, 1.8)}" fill="#FFE27A"/><polygon points="${star(56, 54, 4, 1.8)}" fill="#FFE27A"/></g>`,
      eyes: `<g class="eyes">
      <ellipse cx="72" cy="100" rx="18" ry="22" fill="#fff" stroke="${k.O}" stroke-width="3"/><ellipse cx="128" cy="100" rx="18" ry="22" fill="#fff" stroke="${k.O}" stroke-width="3"/>
      <circle cx="74" cy="106" r="9.5" fill="#FFD84D"/><circle cx="126" cy="106" r="9.5" fill="#FFD84D"/><circle cx="74" cy="106" r="4.2" fill="${INK}"/><circle cx="126" cy="106" r="4.2" fill="${INK}"/>
      <path d="M53 100 C 53 72, 91 72, 91 100 Z" fill="${k.D}" stroke="${k.O}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M109 100 C 109 72, 147 72, 147 100 Z" fill="${k.D}" stroke="${k.O}" stroke-width="3" stroke-linejoin="round"/></g>`,
      body: `<g fill="#FFE27A"><polygon points="${star(82, 196, 5, 2.2)}"/><polygon points="${star(118, 222, 4.5, 2)}"/><polygon points="${star(94, 238, 3.5, 1.5)}"/></g>`,
    }),
  };

  // ================= MODO TERROR =================
  // olhos, boca e detalhes de cada personagem na versão assustadora
  const H = {
    bumbo: { eyes: 'mismatch', mouth: 'grin', drip: 1, crack: 1, brows: 1 },
    chiado: { eyes: 'glow', mouth: 'grin', brows: 1 },
    boquinha: { eyes: 'slit', mouth: 'fangs', brows: 1 },
    palminha: { eyes: 'hollow', mouth: 'smallFang', drip: 1 },
    bongo: { eyes: 'glow', mouth: 'grin', crack: 1 },
    zip: { eyes: 'alien', mouth: 'tiny' },
    mola: { eyes: 'mismatch', mouth: 'grin', brows: 1 },
    risco: { eyes: 'shades', mouth: 'grin' },
    estrelinha: { eyes: 'hollow', mouth: 'tiny', drip: 1 },
    robo: {},
    grave: { eyes: 'glow', mouth: 'grin', brows: 1 },
    tecla: { eyes: 'blank', mouth: 'grin', crack: 1 },
    pisca: { eyes: 'mismatch', mouth: 'smallFang', crack: 1 },
    sininho: { eyes: 'hollow', mouth: 'tiny', drip: 1 },
    flautinha: { eyes: 'glow', mouth: 'grin', brows: 1 },
    nuvem: { eyes: 'ghost', mouth: 'oval', hc: '#56536E' },
    dudu: { eyes: 'hollowRed', mouth: 'grin' },
    lala: { eyes: 'hollow', mouth: 'scared', drip: 1 },
    ua: { eyes: 'glow', mouth: 'grin' },
    tiriri: { eyes: 'glow', mouth: 'fangs', brows: 1 },
    lua: { eyes: 'slit', mouth: 'grin', hc: '#4A0E1C', brows: 1 },
  };
  const TEETH = '#F2ECE2';
  const EYE_AT = [[72, 100], [128, 100]];
  const sockets = (rx, ry, fill) => EYE_AT.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="#000" stroke-width="3"/>`).join('');
  const glowDot = (x, y, r, uid) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#rg${uid})"/>`;

  function hEyes(style, uid) {
    switch (style) {
      case 'glow': return `<g class="eyes">${sockets(20, 24, BLK)}<g class="pupils">${glowDot(74, 103, 13, uid)}${glowDot(126, 103, 13, uid)}<circle cx="74" cy="103" r="2.8" fill="#FFF4E8"/><circle cx="126" cy="103" r="2.8" fill="#FFF4E8"/></g></g>`;
      case 'hollow': return `<g class="eyes">${sockets(21, 25, '#000')}<g class="pupils"><circle cx="74" cy="104" r="3.6" fill="#fff"/><circle cx="126" cy="104" r="3.6" fill="#fff"/></g></g>`;
      case 'hollowRed': return `<g class="eyes">${sockets(20, 24, '#000')}<g class="pupils">${glowDot(74, 104, 9, uid)}${glowDot(126, 104, 9, uid)}</g></g>`;
      case 'mismatch': return `<g class="eyes"><ellipse cx="72" cy="98" rx="22" ry="26" fill="#F2EEE6" stroke="#000" stroke-width="3"/><ellipse cx="128" cy="102" rx="18" ry="21" fill="#000" stroke="#000" stroke-width="3"/>
        <g class="pupils"><circle cx="74" cy="100" r="4" fill="#000"/>${glowDot(127, 103, 9, uid)}</g></g>`;
      case 'slit': return `<g class="eyes"><ellipse cx="72" cy="100" rx="19" ry="21" fill="url(#ye${uid})" stroke="#000" stroke-width="3"/><ellipse cx="128" cy="100" rx="19" ry="21" fill="url(#ye${uid})" stroke="#000" stroke-width="3"/>
        <g class="pupils"><ellipse cx="73" cy="101" rx="3" ry="15" fill="#000"/><ellipse cx="127" cy="101" rx="3" ry="15" fill="#000"/></g></g>`;
      case 'alien': return `<g class="eyes"><path d="M46 96 C 46 74, 82 76, 92 98 C 96 114, 74 124, 60 118 C 50 114, 46 106, 46 96 Z" fill="#000" stroke="#000" stroke-width="3"/>
        <path d="M154 96 C 154 74, 118 76, 108 98 C 104 114, 126 124, 140 118 C 150 114, 154 106, 154 96 Z" fill="#000" stroke="#000" stroke-width="3"/>
        <g class="pupils">${glowDot(68, 100, 7, uid)}${glowDot(132, 100, 7, uid)}</g></g>`;
      case 'shades': return `<g class="eyes"><path d="M46 88 H 94 V 102 C 94 118, 82 124, 70 124 C 57 124, 46 117, 46 102 Z" fill="#0A0508" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
        <path d="M106 88 H 154 V 102 C 154 117, 143 124, 130 124 C 118 124, 106 118, 106 102 Z" fill="#0A0508" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
        <path d="M94 94 H 106" stroke="#0A0508" stroke-width="5"/>
        <g class="pupils">${glowDot(70, 104, 10, uid)}${glowDot(130, 104, 10, uid)}</g>
        <path d="M58 90 L 66 102 L 60 110 L 70 120 M66 102 L 78 100" stroke="#D9D2E0" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      case 'blank': return `<g class="eyes"><ellipse cx="72" cy="100" rx="22" ry="25" fill="#FFF6D8" opacity=".25"/><ellipse cx="128" cy="100" rx="22" ry="25" fill="#FFF6D8" opacity=".25"/>
        <ellipse cx="72" cy="100" rx="15" ry="18" fill="#FFFDF2"/><ellipse cx="128" cy="100" rx="15" ry="18" fill="#FFFDF2"/><g class="pupils"></g></g>`;
      case 'ghost': return `<g class="eyes"><ellipse cx="74" cy="98" rx="15" ry="27" fill="#000"/><ellipse cx="126" cy="98" rx="15" ry="27" fill="#000"/>
        <g class="pupils"><circle cx="75" cy="102" r="3" fill="#fff"/><circle cx="125" cy="102" r="3" fill="#fff"/></g></g>`;
    }
    return '';
  }
  function grin() {
    const top = x => 127 + 10 * (1 - Math.pow((x - 100) / 36, 2)), bot = x => 127 + 18.5 * (1 - Math.pow((x - 100) / 36, 2));
    let d = '';
    for (let x = 69; x < 130; x += 7.75) {
      const xm = x + 3.875, len = Math.min(7, (bot(xm) - top(xm)) * 0.9);
      d += `M${x.toFixed(1)} ${top(x).toFixed(1)} L ${xm.toFixed(1)} ${(top(xm) + len).toFixed(1)} L ${(x + 7.75).toFixed(1)} ${top(x + 7.75).toFixed(1)} Z `;
    }
    return `<path d="M64 127 Q 100 164 136 127 Q 100 147 64 127 Z" fill="${BLK}" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/><path d="${d}" fill="${TEETH}"/>`;
  }
  function hMouth(style) {
    switch (style) {
      case 'grin': return grin();
      case 'fangs': return `<path d="M72 131 Q 100 152 128 131 Q 100 141 72 131 Z" fill="${BLK}" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M84 134 L 88 148 L 93 135.5 Z M107 135.5 L 112 148 L 116 134 Z" fill="${TEETH}" stroke="#000" stroke-width="1"/>`;
      case 'smallFang': return `<path d="M82 136 Q 100 147 118 134" fill="none" stroke="#000" stroke-width="4.5" stroke-linecap="round"/><path d="M103 140.5 L 107 150 L 110.5 139.5 Z" fill="${TEETH}" stroke="#000" stroke-width="1"/>`;
      case 'scared': return `<path d="M86 141 Q 91 135 96 141 Q 101 147 106 141 Q 111 135 115 140" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      case 'oval': return `<ellipse cx="100" cy="143" rx="8" ry="11" fill="#000"/>`;
      default: return `<path d="M90 141 Q 100 137 110 141" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/>`;
    }
  }
  const H_OPEN = `<g class="mOpen" opacity="0"><ellipse cx="100" cy="140" rx="17" ry="14" fill="${BLK}" stroke="#000" stroke-width="3"/>
    <path d="M85 131 L 89 138.5 L 93 128.5 L 97 137.5 L 101 127.5 L 105 137.5 L 109 128.5 L 113 138.5 L 116 131 C 110 127, 90 127, 85 131 Z" fill="${TEETH}"/>
    <path d="M86 148.5 L 90 142 L 94 151 L 98 143 L 102 152 L 106 143 L 110 151 L 114 144 C 108 154, 92 154, 86 148.5 Z" fill="${TEETH}"/>
    <ellipse cx="100" cy="148" rx="6" ry="2.5" fill="#3A1030"/></g>`;
  const H_OPEN_OVAL = `<g class="mOpen" opacity="0"><ellipse cx="100" cy="142" rx="11" ry="18" fill="#000"/></g>`;
  const DRIPS = `<g fill="#14060F"><path d="M60 118 C 61 128, 58 136, 59 146 C 60 152, 66 152, 66 146 C 66 136, 64 128, 66 119 Z"/><path d="M76 122 C 77 128, 76 132, 76 137 C 76 141, 81 141, 81 137 C 81 132, 80 127, 81 122 Z"/>
    <path d="M122 122 C 123 130, 120 138, 121 150 C 122 156, 128 156, 128 150 C 128 138, 126 130, 128 122 Z"/><path d="M137 119 C 138 125, 137 130, 137 134 C 137 138, 142 138, 142 134 C 142 129, 141 124, 142 119 Z"/></g>`;
  const CRACKS = `<g fill="none" stroke="${DARK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".85"><path d="M104 42 L 98 56 L 106 64 L 99 78"/><path d="M106 64 L 116 70"/><path d="M164 92 L 152 98 L 157 108 L 150 116"/><path d="M38 120 L 48 126 L 44 134"/></g>`;
  const BROWS = `<path d="M50 70 L 88 82" stroke="${DARK}" stroke-width="7" stroke-linecap="round"/><path d="M150 70 L 112 82" stroke="${DARK}" stroke-width="7" stroke-linecap="round"/>`;

  // acessórios trocados ou acrescentados no modo terror
  const HACC = {
    bumbo: () => ({ extraFront: `<g fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 90 L 28 100 L 22 110"/><path d="M168 88 L 160 98 L 166 106"/><path d="M60 30 L 70 36 L 66 44"/></g>` }),
    boquinha: () => ({
      back: `<g class="acc" data-a="wiggle" data-px="100" data-py="60">
      <path d="M58 62 C 30 50, 22 22, 34 -4 C 44 16, 62 30, 84 44 Z" fill="#5A0D12" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
      <path d="M142 62 C 170 50, 178 22, 166 -4 C 156 16, 138 30, 116 44 Z" fill="#5A0D12" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
      <path d="M34 -4 C 38 6, 42 12, 48 18 M166 -4 C 162 6, 158 12, 152 18" stroke="#1A0004" stroke-width="5" stroke-linecap="round"/></g>`,
      face: '',
    }),
    bongo: () => ({ extraFront: `<g transform="translate(100 46)"><path d="M-10 0 A 10 10 0 1 1 10 0 L 10 5 L 6 5 L 6 9 L -6 9 L -6 5 L -10 5 Z" fill="#E9E1D6" stroke="#000" stroke-width="2"/>
      <circle cx="-4" cy="0" r="2.8" fill="#120408"/><circle cx="4" cy="0" r="2.8" fill="#120408"/><path d="M-2 6 V 9 M2 6 V 9" stroke="#120408" stroke-width="1.5"/></g>` }),
    zip: () => ({ back: `<g class="acc" data-a="wiggle" data-px="100" data-py="50">
      <path d="M80 50 Q 70 26 58 8" stroke="#000" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M120 50 Q 130 26 142 8" stroke="#000" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle class="glow" cx="58" cy="8" r="22" fill="#FF3B2F" opacity="0"/><circle class="glow" cx="142" cy="8" r="22" fill="#FF3B2F" opacity="0"/>
      <circle cx="58" cy="8" r="11" fill="#C81E1E" stroke="#000" stroke-width="4"/><circle cx="142" cy="8" r="11" fill="#C81E1E" stroke="#000" stroke-width="4"/></g>` }),
    mola: () => ({ back: `<g class="acc" data-a="boing" data-px="100" data-py="46">
      <path d="${SPRING}" fill="none" stroke="#3A3540" stroke-width="7" stroke-linecap="round"/><path d="${SPRING}" fill="none" stroke="#6A6270" stroke-width="3.5" stroke-linecap="round"/>
      <polygon points="${star(100, 0, 21, 10, 8)}" fill="#3A0B33" stroke="#000" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="0" r="8" fill="#24061F"/></g>` }),
    estrelinha: () => ({
      back: `<path d="M100 46 V 24" stroke="#000" stroke-width="5" stroke-linecap="round"/>
      <g class="acc" data-a="spin" data-px="100" data-py="6"><polygon class="glow" points="${star(100, 6, 32, 15)}" fill="#FF3B2F" opacity="0"/>
      <polygon points="${star(100, 6, 21, 9.5)}" fill="#3A2A10" stroke="#000" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="100" cy="7" r="7.5" fill="#F2EEE6" stroke="#000" stroke-width="2"/><circle cx="100" cy="7" r="3.6" fill="#D0141E"/></g>`,
      face: `<polygon points="${star(52, 130, 7, 3)}" fill="#3A2A10"/><polygon points="${star(148, 130, 7, 3)}" fill="#3A2A10"/>`,
    }),
    grave: () => ({ extraFront: `<path d="M50 40 L 40 12 L 64 30 Z M150 40 L 160 12 L 136 30 Z" fill="#2A0A0E" stroke="#000" stroke-width="3" stroke-linejoin="round"/>` }),
    tecla: () => ({ faceExtra: `<g fill="none" stroke="#E9E2EC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".9"><path d="M58 82 L 68 94 L 62 102 L 74 112 M68 94 L 82 90"/><path d="M142 84 L 132 96 L 140 104"/></g>` }),
    pisca: () => ({ back: `<path d="M100 46 C 90 38, 110 32, 100 24" stroke="#2A2A33" stroke-width="5" fill="none" stroke-linecap="round"/>
      <g class="acc" data-a="wiggle" data-px="100" data-py="24"><circle class="glow" cx="100" cy="0" r="30" fill="#FF3B2F" opacity="0"/>
      <rect x="91" y="12" width="18" height="12" rx="3" fill="#3A3D48" stroke="#111" stroke-width="3"/>
      <circle cx="100" cy="0" r="15" fill="#3A1416" stroke="#000" stroke-width="3.5"/>
      <path d="M92 -8 L 99 0 L 95 6 L 104 10 M99 0 L 108 -4" stroke="#C9B9BC" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>` }),
    sininho: () => ({ front: `<g class="acc" data-a="swing" data-px="100" data-py="4">
      <path d="M60 62 C 62 30, 76 10, 100 10 C 124 10, 138 30, 140 62 C 148 64, 150 72, 140 76 L 60 76 C 50 72, 52 64, 60 62 Z" fill="#5C4310" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
      <path d="M62 67 H 138" stroke="#3A2A08" stroke-width="3"/>
      <path d="M92 12 L 86 30 L 96 40 L 88 58 M96 40 L 108 46" stroke="#140C02" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="100" cy="3" r="7" fill="none" stroke="#3A2A08" stroke-width="4"/></g>` }),
    flautinha: () => ({
      back: `<g class="acc" data-a="wiggle" data-px="100" data-py="44">
      <path d="M100 46 C 98 36, 104 28, 98 16" stroke="#2B1A0C" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M99 24 C 86 26, 70 34, 64 48 C 78 44, 92 38, 99 28 Z" fill="#4A3A1A" stroke="#120A02" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M98 18 C 110 18, 126 24, 132 36 C 118 34, 106 28, 98 22 Z" fill="#3E3216" stroke="#120A02" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M100 36 L 108 32 M99 30 L 92 26 M101 42 L 94 40" stroke="#120A02" stroke-width="3" stroke-linecap="round"/></g>`,
      front: `<g><circle cx="146" cy="64" r="9" fill="#2A0D1A" stroke="#000" stroke-width="2.5"/><path d="M140 58 L 152 70 M152 58 L 140 70" stroke="#5A1A33" stroke-width="2.5"/></g>`,
    }),
    nuvem: () => ({ front: `<g class="acc" data-a="float" data-px="100" data-py="50">
      ${CLOUD.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2E2B3E" stroke="#0D0B14" stroke-width="4"/>`).join('')}
      ${CLOUD.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 2.5}" fill="#2E2B3E"/>`).join('')}
      <path class="glow" d="M108 22 L 96 44 L 106 44 L 94 66 L 118 38 L 107 38 L 116 22 Z" fill="#FFF3A0" opacity="0"/></g>` }),
    lala: k => ({
      back: `<g class="acc" data-a="ears" data-px="100" data-py="52"><g transform="rotate(-14 76 46)"><ellipse cx="76" cy="2" rx="17" ry="46" fill="${k.c}" stroke="${k.O}" stroke-width="4"/><ellipse cx="76" cy="6" rx="8" ry="32" fill="${k.D}"/></g></g>`,
      extraFront: `<g class="acc" data-a="float" data-px="126" data-py="46"><g transform="rotate(140 126 46)"><ellipse cx="126" cy="2" rx="16" ry="44" fill="${k.c}" stroke="${k.O}" stroke-width="4"/><ellipse cx="126" cy="6" rx="7" ry="30" fill="${k.D}"/></g></g>`,
    }),
    ua: () => ({ front: `<g class="acc" data-a="nod" data-px="100" data-py="60">
      <path d="M34 120 C 18 70, 40 18, 100 14 C 156 12, 182 52, 172 100 C 168 130, 170 160, 160 182 C 158 150, 156 120, 150 96 C 146 72, 124 52, 104 54 C 96 76, 96 112, 92 150 C 88 170, 70 176, 54 172 C 44 160, 40 140, 34 120 Z" fill="#120A18" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
      <path d="M60 40 C 80 26, 120 22, 150 40" stroke="#2E2238" stroke-width="5" fill="none" stroke-linecap="round"/></g>` }),
    lua: () => ({
      front: `<g class="acc" data-a="nod" data-px="100" data-py="62">
      <path d="M30 84 C 22 30, 80 4, 130 12 C 168 18, 188 52, 182 98 C 176 80, 166 66, 156 60 C 160 68, 166 76, 168 84 C 130 70, 70 70, 30 84 Z" fill="#2A0B22" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
      <path d="M28 78 C 70 62, 130 62, 170 78 L 170 88 C 130 74, 70 74, 28 90 Z" fill="#3A1426" stroke="#000" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="182" cy="102" r="11" fill="#5A1020" stroke="#000" stroke-width="3"/>
      <circle class="glow" cx="88" cy="40" r="22" fill="#FF2A2A" opacity="0"/>
      <path d="M78 30 A 14 14 0 1 0 98 52 A 11 11 0 1 1 78 30 Z" fill="#E0262E" stroke="#5A0008" stroke-width="2"/></g>`,
      body: `<g fill="#E0262E" opacity=".8"><polygon points="${star(82, 196, 5, 2.2)}"/><polygon points="${star(118, 222, 4.5, 2)}"/><polygon points="${star(94, 238, 3.5, 1.5)}"/></g>`,
    }),
  };
  // escurece as cores fixas dos acessórios (mantém as cores do próprio personagem)
  function darken(s, keep) {
    if (!s) return s;
    return s.replace(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, h => {
      if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
      return keep.has(h.toLowerCase()) ? h : mix(mix(h, '#12040A', 0.55), '#4A0808', 0.12);
    });
  }
  const glowDefs = uid => `<radialGradient id="rg${uid}"><stop offset="0" stop-color="#FFF1E0"/><stop offset=".22" stop-color="#FF4A2F"/><stop offset=".6" stop-color="#C40F12"/><stop offset="1" stop-color="#C40F12" stop-opacity="0"/></radialGradient>
    <radialGradient id="ye${uid}" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#FFF0A0"/><stop offset=".6" stop-color="#FFB000"/><stop offset="1" stop-color="#E0520A"/></radialGradient>`;

  function legsArms(k, def, shoe) {
    const legs = `<g class="legs">
      <rect x="76" y="230" width="18" height="52" rx="9" fill="${k.D}" stroke="${k.O}" stroke-width="4"/>
      <rect x="106" y="230" width="18" height="52" rx="9" fill="${k.D}" stroke="${k.O}" stroke-width="4"/>
      <ellipse cx="82" cy="284" rx="18" ry="10" fill="${shoe}" stroke="${k.O}" stroke-width="4"/>
      <ellipse cx="118" cy="284" rx="18" ry="10" fill="${shoe}" stroke="${k.O}" stroke-width="4"/></g>`;
    const arm = side => {
      const L = side === 'L';
      const x0 = L ? 70 : 130, xm = L ? 54 : 146, x1 = L ? 52 : 148;
      const d = `M${x0} 184 Q ${xm} 210 ${x1} 236`;
      return `<g class="arm${side}">
        <path d="${d}" stroke="${k.O}" stroke-width="27" stroke-linecap="round" fill="none"/>
        <path d="${d}" stroke="${k.c}" stroke-width="19" stroke-linecap="round" fill="none"/>
        ${!L && def && def.prop ? (k.horror ? darken(PROPS[def.prop](), new Set()) : PROPS[def.prop]()) : ''}
        <circle cx="${x1}" cy="242" r="12" fill="${k.c}" stroke="${k.O}" stroke-width="4"/></g>`;
    };
    return { legs, armL: arm('L'), armR: arm('R') };
  }

  function colorsOf(def, horror) {
    const HD = horror ? (H[def.id] || {}) : null;
    let c, L, D, O;
    if (horror) {
      c = HD.hc || mix(def.color, '#1A0610', 0.45);
      L = mix(c, '#FF6A2A', 0.38); D = mix(c, '#000000', 0.6); O = DARK;
    } else {
      c = def.color; L = def.light || mix(c, '#ffffff', 0.45); D = def.dark || mix(c, '#000000', 0.18); O = def.outline || mix(c, '#1b1035', 0.62);
    }
    const shoe = horror ? mix(c, '#000000', 0.7) : (def.shoe || mix(c, '#1b1035', 0.35));
    return { HD, c, L, D, O, shoe };
  }

  function build(def, uid, vb, horror, opts) {
    const { HD, c, L, D, O } = colorsOf(def, horror);
    const k = { c, L, D, O, uid, horror };
    const robot = def.acc === 'robot';
    let A = ACC[def.acc] ? ACC[def.acc](k) : {};
    if (horror) {
      const keep = new Set([c, L, D, O].map(x => x.toLowerCase())), dk = s => darken(s, keep);
      const X = HACC[def.id] ? HACC[def.id](k) : {};
      A = { back: dk(A.back), front: dk(A.front), face: dk(A.face), body: dk(A.body), noCheeks: true };
      ['back', 'front', 'face', 'body'].forEach(p => { if (X[p] !== undefined) A[p] = X[p]; });
      A.extraFront = X.extraFront || ''; A.faceExtra = X.faceExtra || '';
    }
    const shoe = colorsOf(def, horror).shoe;
    let { legs, armL, armR } = legsArms(k, def, shoe);
    if (opts && opts.noLimbs) legs = armL = armR = '';

    let head, eyes, happy, mouth, back = A.back || '', chest, extras = '';
    if (robot) {
      const scr = horror ? '#1A0306' : '#13233A', led = horror ? '#FF2A2A' : '#6BF3FF';
      back += `<path d="M100 44 V 20" stroke="${horror ? '#2A2A30' : '#5B6B80'}" stroke-width="5" stroke-linecap="round"/>
        <g class="acc" data-a="glowonly" data-px="100" data-py="12"><circle class="glow" cx="100" cy="12" r="22" fill="#FF8A9B" opacity="0"/>
        <circle cx="100" cy="12" r="9" fill="#FF5D73" stroke="#8C1E33" stroke-width="3"/></g>`;
      head = `<rect x="20" y="88" width="18" height="34" rx="6" fill="${D}" stroke="${O}" stroke-width="4"/>
        <rect x="162" y="88" width="18" height="34" rx="6" fill="${D}" stroke="${O}" stroke-width="4"/>
        <rect x="34" y="42" width="132" height="122" rx="32" fill="url(#hg${uid})" stroke="${O}" stroke-width="4"/>
        <rect x="52" y="70" width="96" height="72" rx="20" fill="${scr}" stroke="#0B1626" stroke-width="3"/>` +
        (horror ? CRACKS : `<path d="M50 54 H 72" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>`);
      eyes = horror
        ? `<g class="eyes"><rect x="68" y="86" width="18" height="24" rx="7" fill="${led}"/><path d="M114 88 L 132 108 M132 88 L 114 108" stroke="${led}" stroke-width="5" stroke-linecap="round"/><g class="pupils"></g></g>`
        : `<g class="eyes"><rect x="68" y="86" width="18" height="24" rx="7" fill="${led}"/><rect x="114" y="86" width="18" height="24" rx="7" fill="${led}"/></g>`;
      happy = horror ? '' : `<g class="happy" opacity="0"><path d="M66 102 L 77 92 L 88 102 M112 102 L 123 92 L 134 102" stroke="${led}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      mouth = `<g class="mClosed">${horror
        ? `<path d="M84 126 L 90 120 L 96 128 L 102 120 L 108 128 L 116 122" stroke="${led}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M84 126 H 116" stroke="${led}" stroke-width="4" stroke-linecap="round"/>`}</g>
        <g class="mOpen" opacity="0">${[[80, 6], [88, 12], [96, 18], [104, 12], [112, 6]].map(([x, h]) => `<rect x="${x}" y="${126 - h / 2}" width="6" height="${h}" rx="2" fill="${led}"/>`).join('')}</g>`;
      chest = `<rect x="80" y="194" width="40" height="30" rx="7" fill="${scr}" stroke="#0B1626" stroke-width="3"/>
        <circle class="led" cx="90" cy="209" r="4" fill="${horror ? '#FF2A2A' : '#FF5D73'}"/><circle class="led" cx="100" cy="209" r="4" fill="${horror ? '#5A0A0A' : '#FFD84D'}"/><circle class="led" cx="110" cy="209" r="4" fill="${horror ? '#FF2A2A' : '#6BF3FF'}"/>`;
    } else {
      head = `<ellipse cx="100" cy="104" rx="72" ry="66" fill="url(#hg${uid})" stroke="${O}" stroke-width="4"/>`;
      if (!horror) {
        head += `<ellipse cx="70" cy="64" rx="22" ry="11" fill="#fff" opacity=".3" transform="rotate(-25 70 64)"/>`;
        const cr = A.bigCheeks ? [16, 11] : [12, 8];
        if (!A.noCheeks) head += `<ellipse cx="52" cy="130" rx="${cr[0]}" ry="${cr[1]}" fill="#FF4F8F" opacity=".3"/><ellipse cx="148" cy="130" rx="${cr[0]}" ry="${cr[1]}" fill="#FF4F8F" opacity=".3"/>`;
        eyes = A.eyes || `<g class="eyes">
          <ellipse cx="72" cy="100" rx="18" ry="22" fill="#fff" stroke="${O}" stroke-width="3"/><ellipse cx="128" cy="100" rx="18" ry="22" fill="#fff" stroke="${O}" stroke-width="3"/>
          <circle cx="75" cy="104" r="9.5" fill="${INK}"/><circle cx="125" cy="104" r="9.5" fill="${INK}"/>
          <circle cx="79" cy="98.5" r="3.6" fill="#fff"/><circle cx="129" cy="98.5" r="3.6" fill="#fff"/><circle cx="71.5" cy="108.5" r="1.8" fill="#fff"/><circle cx="121.5" cy="108.5" r="1.8" fill="#fff"/></g>`;
        happy = A.noHappy ? '' : `<g class="happy" opacity="0"><path d="M56 106 Q 72 88 88 106" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/><path d="M112 106 Q 128 88 144 106" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/></g>`;
        mouth = `<g class="mClosed"><path d="M84 136 Q 100 150 116 136" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>${A.mouth || ''}</g>
          <g class="mOpen" opacity="0"><ellipse cx="100" cy="140" rx="15" ry="12" fill="#3A1530" stroke="${INK}" stroke-width="3"/><ellipse cx="100" cy="146.5" rx="8.5" ry="4.5" fill="#FF6F8E"/></g>`;
        chest = `<ellipse cx="100" cy="210" rx="25" ry="28" fill="${L}" opacity=".5"/>`;
      } else {
        if (HD.crack) head += CRACKS;
        eyes = hEyes(HD.eyes, uid) + (HD.drip ? DRIPS : '');
        happy = '';
        mouth = `<g class="mClosed">${hMouth(HD.mouth)}</g>${HD.mouth === 'oval' ? H_OPEN_OVAL : H_OPEN}`;
        chest = `<ellipse cx="100" cy="212" rx="25" ry="28" fill="${D}" opacity=".45"/>`;
        if (HD.brows) extras = BROWS;
      }
    }
    const grad = horror
      ? `<radialGradient id="hg${uid}" cx="50%" cy="96%" r="92%"><stop offset="0" stop-color="${L}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${D}"/></radialGradient>
         <linearGradient id="bg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${D}"/><stop offset=".6" stop-color="${c}"/><stop offset="1" stop-color="${L}"/></linearGradient>${glowDefs(uid)}`
      : `<radialGradient id="hg${uid}" cx="36%" cy="28%" r="80%"><stop offset="0" stop-color="${L}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${D}"/></radialGradient>
         <linearGradient id="bg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${D}"/></linearGradient>`;

    return `<svg class="spr${horror ? ' horror' : ''}" viewBox="${vb || '0 -52 200 352'}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>${grad}</defs>
<g class="rig">${legs}${armL}${armR}
<g class="torso"><rect x="60" y="160" width="80" height="96" rx="36" fill="url(#bg${uid})" stroke="${O}" stroke-width="4"/>${chest}${A.body || ''}</g>
<g class="headG">${back}${head}${eyes}${happy}${mouth}${A.face || ''}${extras}${A.faceExtra || ''}${A.front || ''}${A.extraFront || ''}</g>
</g></svg>`;
  }

  function graySVG(uid, horror) {
    const k = horror ? { c: '#2B2430', L: '#45394A', D: '#141017', O: '#060407', uid } : { c: '#C3C7D3', L: '#DDE0E8', D: '#A6ABBA', O: '#8D92A5', uid };
    const { legs, armL, armR } = legsArms(k, null, horror ? '#0E0B10' : '#9DA2B2');
    const lid = horror ? '#000000' : '#6E7387';
    const wake = horror
      ? `<g class="wake" opacity="0">${sockets(18, 22, '#000')}${glowDot(74, 100, 11, uid)}${glowDot(126, 100, 11, uid)}<circle cx="74" cy="100" r="2.4" fill="#fff"/><circle cx="126" cy="100" r="2.4" fill="#fff"/></g>`
      : `<g class="wake" opacity="0"><ellipse cx="72" cy="100" rx="18" ry="22" fill="#fff" stroke="${k.O}" stroke-width="3"/><ellipse cx="128" cy="100" rx="18" ry="22" fill="#fff" stroke="${k.O}" stroke-width="3"/>
        <circle cx="76" cy="96" r="9" fill="${lid}"/><circle cx="124" cy="96" r="9" fill="${lid}"/></g>`;
    return `<svg class="spr gray${horror ? ' horror' : ''}" viewBox="0 -52 200 352" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><radialGradient id="hg${uid}" cx="36%" cy="28%" r="80%"><stop offset="0" stop-color="${k.L}"/><stop offset=".6" stop-color="${k.c}"/><stop offset="1" stop-color="${k.D}"/></radialGradient>${horror ? glowDefs(uid) : ''}</defs>
<g class="rig">${legs}${armL}${armR}
<g class="torso"><rect x="60" y="160" width="80" height="96" rx="36" fill="${k.c}" stroke="${k.O}" stroke-width="4"/><ellipse cx="100" cy="210" rx="25" ry="28" fill="${k.L}" opacity=".45"/></g>
<g class="headG"><ellipse cx="100" cy="104" rx="72" ry="66" fill="url(#hg${uid})" stroke="${k.O}" stroke-width="4"/>
${horror ? CRACKS : `<ellipse cx="70" cy="64" rx="22" ry="11" fill="#fff" opacity=".35" transform="rotate(-25 70 64)"/>`}
<g class="sleep"><path d="M58 102 Q 72 113 86 102" fill="none" stroke="${lid}" stroke-width="5" stroke-linecap="round"/><path d="M114 102 Q 128 113 142 102" fill="none" stroke="${lid}" stroke-width="5" stroke-linecap="round"/></g>
${wake}
<path class="gm" d="M92 140 Q 100 145 108 140" fill="none" stroke="${lid}" stroke-width="4.5" stroke-linecap="round"/></g>
</g></svg>`;
  }

  // Peças soltas para o Parquinho: corpo sem braços e pernas, um braço reto (ombro na origem) e uma perna (quadril na origem).
  function puppetSVG(def, uid, horror) {
    const { c, D, O, shoe } = colorsOf(def, horror);
    return {
      body: build(def, uid, null, horror, { noLimbs: true }),
      arm: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -16 32 92"><path d="M0 0 L 0 58" stroke="${O}" stroke-width="27" stroke-linecap="round" fill="none"/>
        <path d="M0 0 L 0 58" stroke="${c}" stroke-width="19" stroke-linecap="round" fill="none"/><circle cx="0" cy="60" r="12" fill="${c}" stroke="${O}" stroke-width="4"/></svg>`,
      leg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -4 40 70"><rect x="-9" y="-2" width="18" height="54" rx="9" fill="${D}" stroke="${O}" stroke-width="4"/>
        <ellipse cx="5" cy="54" rx="17" ry="9.5" fill="${shoe}" stroke="${O}" stroke-width="4"/></svg>`,
    };
  }

  window.SPR = {
    CHARS, CATS, mix, star,
    byId: Object.fromEntries(CHARS.map(c => [c.id, c])),
    charSVG: (def, uid, horror) => build(def, uid, null, horror),
    iconSVG: (def, uid, horror) => build(def, uid, def.iconVB || '6 -22 188 188', horror),
    graySVG, puppetSVG,
  };
})();
