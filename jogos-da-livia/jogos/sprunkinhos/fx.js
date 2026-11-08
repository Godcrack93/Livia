/* Sprunkinhos — partículas do palco (canvas): notas, brilhos, confete, bolhas, vaga-lumes */
(function () {
  'use strict';
  const P = [], amb = {};
  let cv = null, cx = null, W = 0, H = 0, DPR = 1, acc = {};
  const CONF = ['#FF6A3D', '#FFD83F', '#3B7BFF', '#12A874', '#B84BEF', '#FF7CB8', '#62C6FF'];
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(canvas) { cv = canvas; cx = canvas.getContext('2d'); }
  function resize(w, h) {
    if (!cv) return;
    DPR = Math.min(2, window.devicePixelRatio || 1); W = w; H = h;
    cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
  }
  function push(p) { if (P.length < 320) P.push(p); }

  function spawn(type, x, y, o) {
    o = o || {};
    switch (type) {
      case 'note': push({ t: 'note', x, y, vx: rand(-14, 14), vy: rand(-62, -42), life: 1.7, age: 0, c: o.color || '#fff', s: rand(13, 19), d: Math.random() < 0.5, rot: rand(-0.3, 0.3) }); break;
      case 'spark': for (let i = 0; i < (o.n || 4); i++) { const a = rand(0, Math.PI * 2), sp = rand(40, 110); push({ t: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: rand(0.5, 0.8), age: 0, c: o.color || '#FFE27A', s: rand(4, 8) }); } break;
      case 'ring': push({ t: 'ring', x, y, life: 0.45, age: 0, c: o.color || '#fff', w: o.w || 80 }); break;
      case 'puff': for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + rand(-0.2, 0.2), sp = rand(60, 130); push({ t: 'puff', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 - 30, life: rand(0.45, 0.65), age: 0, c: o.color || '#fff', s: rand(9, 18) }); } break;
      case 'confetti': push({ t: 'conf', x, y, vx: o.vx != null ? o.vx : rand(-30, 30), vy: o.vy != null ? o.vy : rand(40, 90), life: o.life || 5, age: 0, c: CONF[(Math.random() * CONF.length) | 0], s: rand(6, 11), r: rand(0, 6), vr: rand(-6, 6), ph: rand(0, 6) }); break;
      case 'burst': for (let i = 0; i < (o.n || 40); i++) { const a = rand(-Math.PI, 0), sp = rand(160, 420); spawn('confetti', x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 3.2 }); } break;
      case 'bubble': push({ t: 'bub', x, y, vx: rand(-8, 8), vy: rand(-50, -28), life: rand(3, 4.5), age: 0, s: rand(5, 13), ph: rand(0, 6), c: o.color || '#9BDB2E' }); break;
      case 'firefly': push({ t: 'fly', x, y, vx: rand(-12, 12), vy: rand(-10, 4), life: rand(4, 7), age: 0, s: rand(2, 3.6), ph: rand(0, 6) }); break;
      case 'zzz': push({ t: 'zzz', x, y, vx: rand(4, 12), vy: rand(-26, -18), life: 2.2, age: 0, s: rand(12, 16) }); break;
      case 'ember': push({ t: 'ember', x, y, vx: rand(-10, 10), vy: rand(-75, -35), life: rand(2.2, 4.2), age: 0, s: rand(1.4, 3.2), ph: rand(0, 6) }); break;
    }
  }
  let eyes = null; // olhos que brilham no escuro (apagão do modo terror)
  function setEyes(list) { eyes = list; }

  function ambient(name, on) { amb[name] = on; }

  function update(dt) {
    if (!cx) return;
    // geradores contínuos dos bônus
    const rate = reduce ? 0.3 : 1;
    const gen = (name, perSec, fn) => { if (!amb[name]) return; acc[name] = (acc[name] || 0) + dt * perSec * rate; while (acc[name] >= 1) { acc[name] -= 1; fn(); } };
    gen('confetti', 26, () => spawn('confetti', rand(0, W), -10));
    gen('bubbles', 9, () => spawn('bubble', rand(0, W), H + 10, { color: ['#9BDB2E', '#62C6FF', '#D946C4', '#FFD83F'][(Math.random() * 4) | 0] }));
    gen('notes', 4, () => spawn('note', rand(W * 0.05, W * 0.95), H * rand(0.55, 0.9), { color: '#FFC93C' }));
    gen('sparkles', 6, () => spawn('spark', rand(0, W), rand(0, H * 0.6), { color: '#FFFFFF', n: 1 }));
    gen('fireflies', 2.5, () => spawn('firefly', rand(0, W), rand(H * 0.25, H * 0.9)));
    gen('embers', 9, () => spawn('ember', rand(0, W), H + 5));
    gen('embersBig', 22, () => spawn('ember', rand(0, W), H + 5));

    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx.clearRect(0, 0, W, H);
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.age += dt;
      if (p.age >= p.life) { P.splice(i, 1); continue; }
      if (eyes && p.t !== 'ember') continue; // no apagão só os olhos (e as brasas) aparecem
      const k = p.age / p.life;
      switch (p.t) {
        case 'note': p.x += (p.vx + Math.sin(p.age * 5) * 18) * dt; p.y += p.vy * dt; drawNote(p, 1 - k * k); break;
        case 'spark': p.vy += 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt; drawStar(p.x, p.y, p.s * (1 - k * 0.5), p.c, 1 - k); break;
        case 'ring': {
          cx.globalAlpha = (1 - k) * 0.7; cx.strokeStyle = p.c; cx.lineWidth = 4 * (1 - k) + 1;
          cx.beginPath(); cx.ellipse(p.x, p.y, p.w * (0.35 + k * 0.5), p.w * (0.08 + k * 0.1), 0, 0, Math.PI * 2); cx.stroke(); break;
        }
        case 'puff': p.vx *= 1 - 3 * dt; p.vy *= 1 - 3 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          cx.globalAlpha = (1 - k) * 0.85; cx.fillStyle = p.c; cx.beginPath(); cx.arc(p.x, p.y, p.s * (0.6 + k), 0, Math.PI * 2); cx.fill(); break;
        case 'conf': p.vy = Math.min(p.vy + 260 * dt, 120); p.vx *= 1 - 1.2 * dt; p.x += (p.vx + Math.sin(p.age * 3 + p.ph) * 25) * dt; p.y += p.vy * dt; p.r += p.vr * dt;
          if (p.y > H + 20) { P.splice(i, 1); continue; }
          cx.globalAlpha = Math.min(1, (1 - k) * 3); cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.scale(1, Math.cos(p.age * 7 + p.ph));
          cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore(); break;
        case 'bub': p.x += (p.vx + Math.sin(p.age * 2.4 + p.ph) * 14) * dt; p.y += p.vy * dt;
          cx.globalAlpha = Math.min(1, (1 - k) * 2) * 0.8; cx.strokeStyle = '#ffffff'; cx.lineWidth = 2; cx.fillStyle = p.c + '44';
          cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, Math.PI * 2); cx.fill(); cx.stroke();
          cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(p.x - p.s * 0.35, p.y - p.s * 0.35, p.s * 0.22, 0, Math.PI * 2); cx.fill(); break;
        case 'fly': p.x += (p.vx + Math.sin(p.age * 1.3 + p.ph) * 10) * dt; p.y += (p.vy + Math.cos(p.age * 1.1 + p.ph) * 8) * dt; {
          const a = Math.sin(Math.PI * k) * (0.55 + 0.45 * Math.sin(p.age * 4 + p.ph));
          const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 5);
          g.addColorStop(0, 'rgba(255,240,150,' + (0.9 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,240,150,0)');
          cx.globalAlpha = 1; cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, p.s * 5, 0, Math.PI * 2); cx.fill(); } break;
        case 'zzz': p.x += (p.vx + Math.sin(p.age * 3) * 8) * dt; p.y += p.vy * dt;
          cx.globalAlpha = Math.sin(Math.PI * k) * 0.8; cx.fillStyle = '#7E84A0'; cx.font = `700 ${p.s * (0.8 + k * 0.5)}px 'Baloo 2', 'Trebuchet MS', sans-serif`;
          cx.fillText('z', p.x, p.y); break;
        case 'ember': p.x += (p.vx + Math.sin(p.age * 2 + p.ph) * 16) * dt; p.y += p.vy * dt; {
          const a = Math.sin(Math.PI * k) * (0.65 + 0.35 * Math.sin(p.age * 9 + p.ph));
          cx.globalAlpha = a * 0.35; cx.fillStyle = '#FF7A1A'; cx.beginPath(); cx.arc(p.x, p.y, p.s * 3, 0, Math.PI * 2); cx.fill();
          cx.globalAlpha = a; cx.fillStyle = '#FFD27A'; cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, Math.PI * 2); cx.fill(); } break;
      }
    }
    if (eyes) {
      for (const e of eyes) {
        const g = cx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 3.2);
        g.addColorStop(0, 'rgba(255,240,225,1)'); g.addColorStop(0.18, 'rgba(255,60,40,0.95)'); g.addColorStop(0.5, 'rgba(200,10,15,0.45)'); g.addColorStop(1, 'rgba(200,10,15,0)');
        cx.globalAlpha = e.a == null ? 1 : e.a; cx.fillStyle = g; cx.beginPath(); cx.arc(e.x, e.y, e.r * 3.2, 0, Math.PI * 2); cx.fill();
      }
    }
    cx.globalAlpha = 1;
  }

  function drawNote(p, a) {
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.globalAlpha = Math.max(0, a);
    const s = p.s; cx.fillStyle = p.c; cx.strokeStyle = 'rgba(34,24,58,.85)'; cx.lineWidth = 2.5;
    const head = (hx, hy) => { cx.beginPath(); cx.ellipse(hx, hy, s * 0.42, s * 0.32, -0.45, 0, Math.PI * 2); cx.fill(); cx.stroke(); };
    if (p.d) {
      head(-s * 0.45, s * 0.6); head(s * 0.55, s * 0.4);
      cx.beginPath(); cx.moveTo(-s * 0.1, s * 0.55); cx.lineTo(-s * 0.1, -s * 0.7); cx.lineTo(s * 0.9, -s * 0.9); cx.lineTo(s * 0.9, s * 0.35); cx.stroke();
      cx.lineWidth = 4.5; cx.beginPath(); cx.moveTo(-s * 0.1, -s * 0.62); cx.lineTo(s * 0.9, -s * 0.82); cx.stroke();
    } else {
      head(0, s * 0.6);
      cx.beginPath(); cx.moveTo(s * 0.36, s * 0.5); cx.lineTo(s * 0.36, -s * 0.8); cx.quadraticCurveTo(s * 0.9, -s * 0.5, s * 0.8, -s * 0.05); cx.stroke();
    }
    cx.restore();
  }
  function drawStar(x, y, r, c, a) {
    cx.globalAlpha = Math.max(0, a); cx.fillStyle = c; cx.beginPath();
    for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, rr = i % 2 ? r * 0.35 : r; cx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr); }
    cx.closePath(); cx.fill();
  }

  window.SprFX = { init, resize, spawn, ambient, update, setEyes };
})();
