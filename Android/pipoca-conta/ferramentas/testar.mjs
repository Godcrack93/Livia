// Pipoca Aprende — testador automático com Chrome sem janela (Chrome DevTools Protocol).
// Cada execução usa um Chrome e um servidor próprios (porta livre), então vários testes podem rodar ao mesmo tempo.
//
// Uso:
//   node ferramentas/testar.mjs --url "#atividade=torre&params={\"min\":1,\"max\":3,\"rodadas\":2}" \
//        --tamanho 1600x900 --passos passos.json --saida ferramentas/saida/torre [--toque] [--rapido]
//   (ou --passos-json '[{"esperar":500},{"foto":"inicio"}]')
//
// Passos (coordenadas SEMPRE no palco virtual 1600×900):
//   {"esperar": 500}                                  espera em ms
//   {"tocar": [x, y]}  ou  {"tocar": "@nome"}         toque/clique (@nome = elemento com data-teste="nome")
//   {"tocarEm": "seletor CSS"}                        toca no centro do elemento
//   {"arrastar": {"de": [x, y] | "@nome", "para": [x, y] | "@nome", "passos": 12, "ms": 400}}
//   {"gesto": true}                                   faz o próximo gesto certo da rodada (PC.debug.proximoGesto) com toque real
//   {"esperar": "ocioso"}                             espera o jogo parar (sem fala nem arraste)
//   {"jogarAte": "expressão JS", "max": 80}           joga sozinho com gestos certos até a expressão ficar verdadeira
//   {"doisDedos": {"um": [x,y]|"@nome", "dois": [x,y]|"@nome", "segurar": 300}}   dois dedos de verdade (use --toque)
//   {"avaliar": "expressão JS"}                       mostra o resultado
//   {"esperarAte": "expressão JS", "limite": 8000}    espera até a expressão ser verdadeira
//   {"foto": "nome"}                                  salva <saida>/nome.png
//   {"tamanho": [largura, altura]}                    muda o tamanho da janela (px CSS)
//   {"resolver": true}                                resolve a rodada atual (PC.debug.resolverRodada)
//   {"nota": "texto"}                                 só escreve no relatório
// Opções: --toque (dedo), --rapido, --densidade 2, --fraco (CPU 4x mais lenta), --limite ms, --voz real (padrão: simulada),
//         --dados real (padrão: memória, sem localStorage), --semente N.
// Saída: relatório no terminal; código 1 se houve exceção na página ou passo com erro.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ligar } from './servidor.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- argumentos
function lerArgs(lista) {
  const a = {};
  for (let i = 0; i < lista.length; i++) {
    const s = lista[i];
    if (!s.startsWith('--')) continue;
    const [k, v] = s.slice(2).split(/=(.*)/s);
    if (v !== undefined) a[k] = v;
    else if (i + 1 < lista.length && !lista[i + 1].startsWith('--')) a[k] = lista[++i];
    else a[k] = true;
  }
  return a;
}
const args = lerArgs(process.argv.slice(2));
const [LARG, ALT] = String(args.tamanho || '1600x900').split('x').map(Number);
const TOQUE = !!args.toque;
const DENSIDADE = Number(args.densidade || 1);
const FRACO = !!args.fraco;
const LIMITE_TOTAL = Number(args.limite || 120000);
const SAIDA = path.resolve(args.saida || path.join(AQUI, 'saida', 'teste-' + process.pid));
let passos = [];
if (args.passos) passos = JSON.parse(fs.readFileSync(args.passos, 'utf8'));
else if (args['passos-json']) passos = JSON.parse(args['passos-json']);

function chromeExe() {
  const candidatos = [
    process.env.CHROME,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium',
  ].filter(Boolean);
  const c = candidatos.find(p => fs.existsSync(p));
  if (!c) throw new Error('Chrome/Edge não encontrado (defina a variável CHROME).');
  return c;
}

const espera = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------- CDP mínimo
class CDP {
  constructor(ws) {
    this.ws = ws; this.n = 0; this.pend = new Map(); this.ouvintes = [];
    ws.addEventListener('message', ev => {
      const m = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
      if (m.id && this.pend.has(m.id)) {
        const { ok, falha } = this.pend.get(m.id); this.pend.delete(m.id);
        m.error ? falha(new Error(m.error.message)) : ok(m.result);
      } else if (m.method) this.ouvintes.forEach(fn => fn(m));
    });
  }
  enviar(metodo, params = {}) {
    const id = ++this.n;
    this.ws.send(JSON.stringify({ id, method: metodo, params }));
    return new Promise((ok, falha) => this.pend.set(id, { ok, falha }));
  }
  ao(fn) { this.ouvintes.push(fn); }
}

async function avaliar(cdp, expr) {
  const r = await cdp.enviar('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
  return r.result ? r.result.value : undefined;
}

async function paraTela(cdp, x, y) {
  return avaliar(cdp, `(() => { const p = PC.palco.paraTela(${Number(x)}, ${Number(y)}); return [p.x, p.y]; })()`);
}
/** Converte [x, y] virtual ou "@nome" (data-teste) em coordenadas de tela. */
async function alvo(cdp, a) {
  if (typeof a === 'string' && a.startsWith('@')) {
    const nome = a.slice(1);
    const c = await avaliar(cdp, `(() => { const e = document.querySelector('[data-teste=${JSON.stringify(nome)}]'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
    if (!c) throw new Error('não achei data-teste="' + nome + '"');
    return c;
  }
  return paraTela(cdp, a[0], a[1]);
}
/** Executa um gesto em coordenadas de tela ({tipo:'tocar'|'arrastar'|'tracar'}). */
async function executarGesto(cdp, g) {
  if (g.tipo === 'tocar') { await pressionar(cdp, g.em.x, g.em.y); await espera(60); await soltar(cdp, g.em.x, g.em.y); }
  else if (g.tipo === 'arrastar') await arrastarTela(cdp, g.de.x, g.de.y, g.para.x, g.para.y, 14, 500);
  else if (g.tipo === 'tracar' && g.pontos && g.pontos.length) {
    await pressionar(cdp, g.pontos[0].x, g.pontos[0].y);
    for (const q of g.pontos.slice(1)) { await espera(20); await moverPara(cdp, q.x, q.y); }
    const u = g.pontos[g.pontos.length - 1]; await espera(40); await soltar(cdp, u.x, u.y);
  }
}
async function arrastarTela(cdp, x0, y0, x1, y1, n = 12, ms = 400) {
  await pressionar(cdp, x0, y0);
  for (let i = 1; i <= n; i++) { await espera(ms / n); await moverPara(cdp, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n); }
  await espera(40); await soltar(cdp, x1, y1);
}

async function pressionar(cdp, x, y) {
  if (TOQUE) await cdp.enviar('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }] });
  else await cdp.enviar('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
}
async function moverPara(cdp, x, y) {
  if (TOQUE) await cdp.enviar('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }] });
  else await cdp.enviar('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
}
async function soltar(cdp, x, y) {
  if (TOQUE) await cdp.enviar('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  else await cdp.enviar('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
}

// ---------------------------------------------------------------- principal
async function principal() {
  fs.mkdirSync(SAIDA, { recursive: true });
  const { servidor, url: base } = await ligar(0);
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'pipoca-chrome-'));
  const chrome = spawn(chromeExe(), [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--remote-debugging-port=0', `--user-data-dir=${perfil}`, `--window-size=${LARG},${ALT}`,
    '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore' });

  const relatorio = { passos: [], console: [], excecoes: [] };
  let cdp = null, falhou = false;
  const limpar = async () => {
    // o Chrome pode fechar o socket antes de responder: nunca espere para sempre
    try { if (cdp) await Promise.race([cdp.enviar('Browser.close').catch(() => {}), espera(2000)]); } catch { /* ok */ }
    try { if (cdp) cdp.ws.close(); } catch { /* ok */ }
    try { chrome.kill(); } catch { /* ok */ }
    if (process.platform === 'win32' && chrome.pid) {
      try { spawn('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* ok */ }
    }
    servidor.close();
    await espera(300);
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* o Windows às vezes segura o arquivo */ }
  };
  const relogio = setTimeout(() => { console.error('TEMPO ESGOTADO'); limpar().then(() => process.exit(2)); }, LIMITE_TOTAL);

  try {
    // porta do DevTools
    const arqPorta = path.join(perfil, 'DevToolsActivePort');
    let portaDev = null;
    for (let i = 0; i < 200 && !portaDev; i++) {
      // no Windows a leitura às vezes falha com EBUSY enquanto o Chrome escreve o arquivo: tenta de novo
      try { if (fs.existsSync(arqPorta)) { const t = fs.readFileSync(arqPorta, 'utf8').split('\n')[0].trim(); if (t) portaDev = Number(t); } } catch { /* tenta de novo */ }
      if (!portaDev) await espera(50);
    }
    if (!portaDev) throw new Error('O Chrome não abriu o DevTools.');
    const alvos = await (await fetch(`http://127.0.0.1:${portaDev}/json/list`)).json();
    const pagina = alvos.find(t => t.type === 'page');
    const ws = new WebSocket(pagina.webSocketDebuggerUrl);
    await new Promise((ok, falha) => { ws.addEventListener('open', ok, { once: true }); ws.addEventListener('error', falha, { once: true }); });
    cdp = new CDP(ws);
    cdp.ao(m => {
      if (m.method === 'Runtime.consoleAPICalled') {
        const tipo = m.params.type;
        if (tipo === 'error' || tipo === 'warning' || tipo === 'assert') {
          const txt = m.params.args.map(a => a.value !== undefined ? a.value : (a.description || a.type)).join(' ');
          relatorio.console.push(`[${tipo}] ${txt}`);
        }
      } else if (m.method === 'Runtime.exceptionThrown') {
        const d = m.params.exceptionDetails;
        relatorio.excecoes.push((d.exception && d.exception.description) || d.text);
      } else if (m.method === 'Log.entryAdded') {
        const e = m.params.entry;
        if (e.level === 'error') relatorio.console.push(`[rede/log] ${e.text}${e.url ? ' ' + e.url : ''}`);
      }
    });
    await cdp.enviar('Runtime.enable');
    await cdp.enviar('Log.enable');
    await cdp.enviar('Page.enable');
    await cdp.enviar('Emulation.setDeviceMetricsOverride', { width: LARG, height: ALT, deviceScaleFactor: DENSIDADE, mobile: TOQUE });
    if (TOQUE) await cdp.enviar('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    if (FRACO) await cdp.enviar('Emulation.setCPUThrottlingRate', { rate: 4 });

    let url = String(args.url || '');
    const junta = k => { url += (url.includes('#') ? '&' : '#') + k; };
    if (args.rapido) junta('rapido=1');
    if (args.voz !== 'real' && !/[#&]voz=/.test(url)) junta('voz=simulada');
    if (args.dados !== 'real' && !/[#&]dados=/.test(url)) junta('dados=memoria');
    if (args.semente && !/[#&]semente=/.test(url)) junta('semente=' + Number(args.semente));
    const endereco = url.startsWith('http') ? url : base + (url.startsWith('#') ? 'index.html' + url : url.replace(/^\//, ''));
    const carregou = new Promise(ok => cdp.ao(m => { if (m.method === 'Page.loadEventFired') ok(); }));
    await cdp.enviar('Page.navigate', { url: endereco });
    await Promise.race([carregou, espera(10000)]);
    for (let i = 0; i < 100; i++) { if (await avaliar(cdp, '!!(window.PC && PC.pronto)').catch(() => false)) break; await espera(100); }
    relatorio.passos.push(`abriu ${endereco} em ${LARG}x${ALT}${TOQUE ? ' (toque)' : ''}`);

    for (const p of passos) {
      const rot = JSON.stringify(p);
      const limitePasso = setTimeout(() => { relatorio.passos.push('ERRO tempo esgotado no passo ' + rot); }, 20000);
      try {
        if (p.esperar === 'ocioso') {
          const ok = await avaliar(cdp, 'PC.debug.esperarOcioso ? PC.debug.esperarOcioso({limite: 15000}) : true');
          relatorio.passos.push(`${ok ? 'ok ' : 'ERRO'} ${rot}`); if (!ok) falhou = true;
        }
        else if (p.esperar != null) { await espera(Number(p.esperar)); relatorio.passos.push(`ok  ${rot}`); }
        else if (p.jogarAte) {
          // joga sozinho: repete (esperar ocioso → próximo gesto certo) até a expressão ficar verdadeira
          clearTimeout(limitePasso);
          const max = Number(p.max || 80); let feitos = 0, ok = false;
          for (let i = 0; i < max; i++) {
            if (await avaliar(cdp, p.jogarAte).catch(() => false)) { ok = true; break; }
            await avaliar(cdp, 'PC.debug.esperarOcioso ? PC.debug.esperarOcioso({limite: 8000}) : true').catch(() => {});
            if (await avaliar(cdp, p.jogarAte).catch(() => false)) { ok = true; break; }
            const g = await avaliar(cdp, 'PC.debug.proximoGesto ? PC.debug.proximoGesto() : null').catch(() => null);
            if (!g) { await espera(400); continue; }
            await executarGesto(cdp, g); feitos++;
            await espera(250);
          }
          if (!ok) { falhou = true; relatorio.passos.push(`ERRO ${rot}: não chegou lá depois de ${feitos} gestos`); }
          else relatorio.passos.push(`ok  ${rot} (${feitos} gestos)`);
        }
        else if (p.doisDedos) {
          // dois dedos de verdade (precisa de --toque): o 1º encosta, o 2º encosta depois, os dois soltam juntos
          const [x1, y1] = await alvo(cdp, p.doisDedos.um);
          const [x2, y2] = await alvo(cdp, p.doisDedos.dois);
          const d1 = { x: x1, y: y1, id: 1, radiusX: 4, radiusY: 4, force: 1 };
          const d2 = { x: x2, y: y2, id: 2, radiusX: 4, radiusY: 4, force: 1 };
          await cdp.enviar('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [d1] });
          await espera(Number(p.doisDedos.intervalo || 120));
          await cdp.enviar('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [d1, d2] });
          await espera(Number(p.doisDedos.segurar || 300));
          await cdp.enviar('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          relatorio.passos.push(`ok  ${rot}`);
        }
        else if (p.gesto) {
          const g = await avaliar(cdp, 'PC.debug.proximoGesto ? PC.debug.proximoGesto() : null');
          if (!g) throw new Error('a rodada não informou o próximo gesto');
          if (g.tipo === 'tocar') { await pressionar(cdp, g.em.x, g.em.y); await espera(60); await soltar(cdp, g.em.x, g.em.y); }
          else if (g.tipo === 'arrastar') await arrastarTela(cdp, g.de.x, g.de.y, g.para.x, g.para.y, 14, 500);
          else if (g.tipo === 'tracar') {
            await pressionar(cdp, g.pontos[0].x, g.pontos[0].y);
            for (const q of g.pontos.slice(1)) { await espera(25); await moverPara(cdp, q.x, q.y); }
            const u = g.pontos[g.pontos.length - 1]; await espera(40); await soltar(cdp, u.x, u.y);
          }
          relatorio.passos.push(`ok  ${rot} → ${g.tipo}`);
        }
        else if (p.tocar) {
          const [x, y] = await alvo(cdp, p.tocar);
          await pressionar(cdp, x, y); await espera(60); await soltar(cdp, x, y);
          relatorio.passos.push(`ok  ${rot}`);
        } else if (p.tocarEm) {
          const c = await avaliar(cdp, `(() => { const e = document.querySelector(${JSON.stringify(p.tocarEm)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
          if (!c) throw new Error('elemento não encontrado');
          await pressionar(cdp, c[0], c[1]); await espera(60); await soltar(cdp, c[0], c[1]);
          relatorio.passos.push(`ok  ${rot}`);
        } else if (p.arrastar) {
          const n = Number(p.arrastar.passos || 12), ms = Number(p.arrastar.ms || 400);
          const [x0, y0] = await alvo(cdp, p.arrastar.de);
          const [x1, y1] = await alvo(cdp, p.arrastar.para);
          await arrastarTela(cdp, x0, y0, x1, y1, n, ms);
          relatorio.passos.push(`ok  ${rot}`);
        } else if (p.avaliar) {
          const v = await avaliar(cdp, p.avaliar);
          relatorio.passos.push(`ok  ${rot}\n    → ${JSON.stringify(v)}`);
        } else if (p.esperarAte) {
          const lim = Number(p.limite || 8000); const t0 = Date.now(); let v = false;
          while (Date.now() - t0 < lim) { v = await avaliar(cdp, p.esperarAte).catch(() => false); if (v) break; await espera(100); }
          if (!v) throw new Error('condição não aconteceu em ' + lim + ' ms');
          relatorio.passos.push(`ok  ${rot} (${Date.now() - t0} ms)`);
        } else if (p.foto) {
          const r = await cdp.enviar('Page.captureScreenshot', { format: 'png' });
          const arq = path.join(SAIDA, p.foto.replace(/[^\w.-]+/g, '_') + '.png');
          fs.writeFileSync(arq, Buffer.from(r.data, 'base64'));
          relatorio.passos.push(`ok  foto → ${arq}`);
        } else if (p.tamanho) {
          await cdp.enviar('Emulation.setDeviceMetricsOverride', { width: p.tamanho[0], height: p.tamanho[1], deviceScaleFactor: DENSIDADE, mobile: TOQUE });
          await espera(250);
          relatorio.passos.push(`ok  ${rot}`);
        } else if (p.resolver) {
          const v = await avaliar(cdp, 'PC.debug.resolverRodada ? PC.debug.resolverRodada() : false');
          relatorio.passos.push(`ok  ${rot} → ${v}`);
        } else if (p.nota) {
          relatorio.passos.push(`--  ${p.nota}`);
        } else {
          relatorio.passos.push(`??  passo desconhecido ${rot}`);
        }
      } catch (e) {
        falhou = true;
        relatorio.passos.push(`ERRO ${rot}: ${e.message}`);
      } finally { clearTimeout(limitePasso); }
    }
    const errosPC = await avaliar(cdp, 'window.PC && PC.erros ? PC.erros.slice() : []').catch(() => []);
    if (errosPC && errosPC.length) relatorio.excecoes.push(...errosPC.map(e => 'PC.erros: ' + e));
  } catch (e) {
    falhou = true;
    relatorio.passos.push('FALHA GERAL: ' + e.message);
  } finally {
    clearTimeout(relogio);
    await limpar();
  }

  console.log('=== passos ===');
  relatorio.passos.forEach(l => console.log(l));
  console.log('=== console (erros e avisos) ===');
  console.log(relatorio.console.length ? relatorio.console.join('\n') : '(nada)');
  console.log('=== exceções ===');
  console.log(relatorio.excecoes.length ? relatorio.excecoes.join('\n') : '(nenhuma)');
  if (falhou || relatorio.excecoes.length) process.exitCode = 1;
}

principal().catch(e => { console.error(e); process.exit(1); });
