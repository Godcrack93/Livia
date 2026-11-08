// Testa e inspeciona as fases do Parafusinhos (spec §6). Node 18+, sem dependências.
//
//   node Android/parafusinhos/ferramentas/testar-fases.mjs [--de=1] [--ate=500] [--resolver=100] [--ver=N] [--detalhes]
//
// --ver=N (ou --ver=3,10,20) só desenha as fases pedidas em ASCII e sai.
// Sem --ver: testes das regras, geração + validação de cada fase, determinismo, resolvedor e dica,
// e um resumo por faixa de 10 fases. Sai com código 1 se algo falhar.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';

const PASTA_JS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'jogo', 'js');
const ARQUIVOS = ['aleatorio.js', 'geometria.js', 'regras.js', 'fases.js', 'resolvedor.js'];

// Cada contexto é um "navegador" novo: os arquivos rodam como scripts clássicos em globalThis.
function carregar() {
  const contexto = vm.createContext({ performance });
  for (const arquivo of ARQUIVOS) {
    vm.runInContext(readFileSync(path.join(PASTA_JS, arquivo), 'utf8'), contexto, { filename: arquivo });
  }
  return contexto.Parafusinhos;
}

const opcoes = {};
for (const a of process.argv.slice(2)) {
  const m = /^--([a-z]+)(?:=(.*))?$/.exec(a);
  if (!m) {
    console.error(`Opção desconhecida: ${a}`);
    process.exit(2);
  }
  opcoes[m[1]] = m[2] === undefined ? true : m[2];
}
const DE = Number(opcoes.de || 1);
const ATE = Number(opcoes.ate || 500);
const ATE_RESOLVER = Math.min(ATE, Number(opcoes.resolver === undefined ? 100 : opcoes.resolver));
const DETALHES = Boolean(opcoes.detalhes);

const P = carregar();
const { Aleatorio, Regras, Fases, Resolvedor } = P;
const falhas = [];
const falhar = (msg) => falhas.push(msg);

const media = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0);
const quantil = (l, q) => {
  if (!l.length) return 0;
  const o = l.slice().sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor(q * o.length))];
};
const fmt = (v, casas = 1) => v.toFixed(casas);
const pad = (v, n) => String(v).padStart(n);

// ------------------------------------------------------------------ desenho ASCII (--ver)

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const NOME_COR = ['vermelho', 'azul', 'amarelo', 'verde', 'roxo', 'laranja', 'rosa', 'turquesa', 'marrom'];

function desenhar(nivel) {
  const G = P.Geometria;
  const lim = G.limitesNivel(nivel);
  const x0 = Math.floor(lim.x0);
  const y0 = Math.floor(lim.y0);
  const colunas = Math.ceil((lim.x1 - x0) * 4) + 1;
  const linhas = Math.ceil((lim.y1 - y0) * 2) + 1;
  const tela = [];
  for (let r = 0; r < linhas; r++) {
    const linha = [];
    for (let c = 0; c < colunas; c++) {
      const x = x0 + c / 4;
      const y = y0 + r / 2;
      let topo = -1;
      for (const q of nivel.placas) if (G.distEsqueleto(x, y, q) <= q.raio) topo = q.id;
      const naGrade = Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < nivel.largura && y < nivel.altura;
      linha.push(topo >= 0 ? LETRAS[topo % LETRAS.length] : naGrade ? '·' : ' ');
    }
    tela.push(linha);
  }
  const est = Regras.estadoInicial(nivel);
  for (const s of nivel.parafusos) {
    const c = (s.x - x0) * 4;
    const r = (s.y - y0) * 2;
    tela[r][c] = String(s.cor);
    if (!Regras.livre(nivel, est, s.id) && c + 1 < colunas) tela[r][c + 1] = '*';
  }
  const linhasTexto = [];
  const p = nivel.tutorial ? null : Fases.parametros(nivel.numero);
  linhasTexto.push(
    `Fase ${nivel.numero}${nivel.dificil ? ' (difícil)' : ''}${nivel.tutorial ? ` (tutorial ${nivel.tutorial})` : ''}: ` +
      `${nivel.largura}×${nivel.altura}, ${nivel.placas.length} placas, ${nivel.parafusos.length} parafusos, ` +
      `${nivel.numCores} cores, pressão ${nivel.pressao}, guloso ${fmt(nivel.stats.taxaGulosa, 2)}` +
      (p ? ` (alvo ${fmt(p.alvoGuloso, 2)})` : '') +
      `, cobertos ${nivel.stats.cobertosInicio} (${fmt((100 * nivel.stats.cobertosInicio) / nivel.parafusos.length, 0)}%)` +
      (p ? ` alvo ${fmt(100 * p.fracaoCoberta, 0)}%` : '')
  );
  linhasTexto.push('Letra = placa de cima naquele ponto (A = camada mais baixa); dígito = cor do parafuso; * = começa bloqueado.');
  linhasTexto.push('');
  for (const l of tela) linhasTexto.push('  ' + l.join('').replace(/\s+$/, ''));
  linhasTexto.push('');
  linhasTexto.push('Placas, de baixo para cima:');
  for (const q of nivel.placas) {
    const ps = nivel.parafusosDaPlaca[q.id].map((id) => {
      const s = nivel.parafusos[id];
      const cob = nivel.cobertoPor[id].length ? ` sob ${nivel.cobertoPor[id].map((i) => LETRAS[i % LETRAS.length]).join('')}` : '';
      return `#${id} cor ${s.cor} (${s.x},${s.y})${cob}`;
    });
    const esq = q.partes.map((pa) => (pa.fechado ? '◻' : '') + pa.pontos.map((pt) => pt.join(',')).join('→')).join(' + ');
    linhasTexto.push(`  ${LETRAS[q.id % LETRAS.length]} ${pad(q.forma, 9)} tinta ${q.tinta}  ${esq}  |  ${ps.join('; ')}`);
  }
  linhasTexto.push('');
  linhasTexto.push(`Fila de caixas: ${nivel.caixas.join(' ')}   (cores: ${NOME_COR.slice(0, nivel.numCores).map((n, i) => `${i} ${n}`).join(', ')})`);
  linhasTexto.push(`Solução: ${nivel.solucao.join(' ')}`);
  return linhasTexto.join('\n');
}

if (opcoes.ver !== undefined) {
  for (const n of String(opcoes.ver).split(',').map(Number)) {
    console.log(desenhar(Fases.gerar(n)));
    console.log('');
  }
  process.exit(0);
}

// ------------------------------------------------------------------ testes das regras

function nivelDeTeste({ placas, parafusos, caixas }) {
  const nivel = {
    numero: 0, versao: Fases.VERSAO, dificil: false, tutorial: 0, largura: 30, altura: 10,
    placas: placas.map((q, i) => ({ id: i, camada: i, forma: q.forma, partes: q.partes, raio: q.raio, tinta: 0 })),
    parafusos: parafusos.map(([x, y, placa, cor], i) => ({ id: i, placa, x, y, cor })),
    caixas, ativas: 2, bandeja: Regras.BANDEJA_BASE, numCores: 9, solucao: [], pressao: 0, stats: null,
  };
  return Regras.preparar(nivel);
}

// Cada parafuso num botão próprio, lado a lado: ninguém cobre ninguém.
function nivelDeBotoes(cores, caixas) {
  return nivelDeTeste({
    placas: cores.map((_, i) => ({ forma: 'botao', partes: [{ pontos: [[2 * i, 0]], fechado: false }], raio: Regras.RAIO_BOTAO })),
    parafusos: cores.map((cor, i) => [2 * i, 0, i, cor]),
    caixas,
  });
}

const tipos = (r) => r.eventos.map((ev) => ev.tipo).join(',');
const json = (v) => JSON.stringify(v);

function testarRegras() {
  const casos = [];
  const caso = (nome, fn) => {
    try {
      fn();
      casos.push(nome);
    } catch (erro) {
      falhar(`regras: ${nome}: ${erro.message}`);
    }
  };
  const confere = (cond, msg) => {
    if (!cond) throw new Error(msg);
  };

  caso('aleatório determinístico', () => {
    confere(Aleatorio.hash('') === 0x811c9dc5, 'hash vazio');
    const a = Aleatorio.criar(123);
    const b = Aleatorio.criar(123);
    for (let i = 0; i < 50; i++) confere(a.proximo() === b.proximo(), 'mesma semente, mesma sequência');
    for (let i = 0; i < 200; i++) {
      const v = a.inteiro(-2, 3);
      confere(Number.isInteger(v) && v >= -2 && v <= 3, 'inteiro fora do intervalo');
    }
    confere(json(a.embaralhar([1, 2, 3, 4, 5]).sort()) === json([1, 2, 3, 4, 5]), 'embaralhar perde itens');
  });

  caso('relação de cobertura (limiares §4.3)', () => {
    const barra = { partes: [{ pontos: [[0, 0], [4, 0]], fechado: false }], raio: Regras.RAIO_BARRA };
    confere(P.Geometria.relacao(barra, 2, 0.13) === 'coberto', '0,13 coberto');
    confere(P.Geometria.relacao(barra, 2, 0.15) === 'ambiguo', '0,15 ambíguo');
    confere(P.Geometria.relacao(barra, 2, 0.73) === 'ambiguo', '0,73 ambíguo');
    confere(P.Geometria.relacao(barra, 2, 0.74) === 'livre', '0,74 livre');
    const disco = { partes: [{ pontos: [[3, 3]], fechado: false }], raio: Regras.RAIO_DISCO };
    confere(P.Geometria.relacao(disco, 4, 4) === 'coberto', 'diagonal do disco coberta');
    confere(P.Geometria.relacao(disco, 5, 3) === 'ambiguo', 'distância 2 do disco é ambígua');
    confere(P.Geometria.relacao(disco, 5, 4) === 'livre', 'raiz de 5 do disco é livre');
  });

  caso('cascata: completa, entra, puxa da bandeja, completa de novo', () => {
    // caixas: 0, 1, 2, 3. Os amarelos (2) esperam na bandeja até a caixa 2 entrar.
    const nivel = nivelDeBotoes([0, 0, 0, 2, 2, 2, 1, 1, 1, 3, 3, 3], [0, 1, 2, 3]);
    const e = Regras.estadoInicial(nivel);
    for (const id of [3, 4, 5]) confere(Regras.jogar(nivel, e, id).eventos[0].para.tipo === 'bandeja', 'amarelo vai para a bandeja');
    Regras.jogar(nivel, e, 0);
    Regras.jogar(nivel, e, 1);
    const r = Regras.jogar(nivel, e, 2);
    confere(
      tipos(r) === 'tirar,placaCai,caixaCompleta,caixaEntra,puloBandeja,puloBandeja,puloBandeja,caixaCompleta,caixaEntra',
      'sequência de eventos: ' + tipos(r)
    );
    const pulos = r.eventos.filter((ev) => ev.tipo === 'puloBandeja');
    confere(json(pulos.map((ev) => [ev.parafuso, ev.deVaga, ev.furo, ev.slot, ev.fila])) === json([[3, 0, 0, 0, 2], [4, 1, 1, 0, 2], [5, 2, 2, 0, 2]]), 'pulos');
    confere(json(r.eventos[8]) === json({ tipo: 'caixaEntra', slot: 0, fila: 3, cor: 3 }), 'caixa 3 entra no slot 0');
    confere(e.completas === 2 && e.proxima === 4 && e.bandeja.length === 0, 'estado depois da cascata');
    for (const id of [6, 7]) Regras.jogar(nivel, e, id);
    const r2 = Regras.jogar(nivel, e, 8);
    confere(tipos(r2) === 'tirar,placaCai,caixaCompleta,slotVazio', 'fila acabou: ' + tipos(r2));
    Regras.jogar(nivel, e, 9);
    Regras.jogar(nivel, e, 10);
    const r3 = Regras.jogar(nivel, e, 11);
    confere(r3.vitoria && !r3.semJogadas && r3.eventos[r3.eventos.length - 1].tipo === 'vitoria', 'vitória no fim');
    confere(Regras.venceu(nivel, e) && e.completas === 4 && e.slots.every((s) => s === null), 'tudo completo');
  });

  caso('bandeja cheia, vaga extra e cascata dupla com compactação', () => {
    // 0–5 amarelos (duas caixas amarelas na fila), 6–8 vermelhos, 9–11 azuis, 12 roxo (sem caixa).
    const nivel = nivelDeBotoes([2, 2, 2, 2, 2, 2, 0, 0, 0, 1, 1, 1, 4], [0, 1, 2, 2]);
    const e = Regras.estadoInicial(nivel);
    for (let id = 0; id < 5; id++) {
      const r = Regras.jogar(nivel, e, id);
      confere(r.ok && r.eventos[0].para.tipo === 'bandeja' && r.eventos[0].para.vaga === id && !r.semJogadas, 'vaga ' + id);
    }
    const antes = json(e);
    const cheia = Regras.jogar(nivel, e, 5);
    confere(!cheia.ok && cheia.motivo === 'bandejaCheia' && json(e) === antes, 'bandeja cheia não mexe no estado');
    confere(Regras.destino(nivel, e, 5) === null && Regras.capacidadeBandeja(nivel, e) === 5, 'sem destino');
    e.extra = 1;
    confere(Regras.capacidadeBandeja(nivel, e) === 6, 'capacidade 6 com o espaço extra');
    const r5 = Regras.jogar(nivel, e, 5);
    confere(r5.ok && r5.eventos[0].para.vaga === 5 && !r5.semJogadas, '6ª vaga com o extra');
    const r12 = Regras.jogar(nivel, e, 12);
    confere(!r12.ok && r12.motivo === 'bandejaCheia', 'o 7º não cabe nem com o extra');
    Regras.jogar(nivel, e, 6);
    Regras.jogar(nivel, e, 7);
    const r8 = Regras.jogar(nivel, e, 8);
    confere(
      tipos(r8) ===
        'tirar,placaCai,caixaCompleta,caixaEntra,puloBandeja,puloBandeja,puloBandeja,bandejaCompacta,' +
          'caixaCompleta,caixaEntra,puloBandeja,puloBandeja,puloBandeja,caixaCompleta,slotVazio',
      'cascata: ' + tipos(r8)
    );
    confere(json(r8.eventos[7].ordem) === json([3, 4, 5]), 'compactação antes da segunda caixa');
    confere(json(r8.eventos.filter((ev) => ev.tipo === 'puloBandeja').map((ev) => ev.deVaga)) === json([0, 1, 2, 0, 1, 2]), 'vagas de origem');
    confere(e.bandeja.length === 0 && e.slots[0] === null && e.completas === 3, 'estado depois da cascata');
  });

  caso('semJogadas com bandeja cheia', () => {
    // Placa de cima (barra) cobre os vermelhos; o único parafuso dela é turquesa, sem caixa.
    const nivel = nivelDeTeste({
      placas: [
        { forma: 'barraH', partes: [{ pontos: [[0, 2], [4, 2]], fechado: false }], raio: Regras.RAIO_BARRA },
        ...[0, 1, 2, 3, 4].map((i) => ({ forma: 'botao', partes: [{ pontos: [[2 * i, 5]], fechado: false }], raio: Regras.RAIO_BOTAO })),
        { forma: 'barraH', partes: [{ pontos: [[0, 2], [4, 2]], fechado: false }], raio: Regras.RAIO_BARRA },
      ],
      parafusos: [[0, 2, 0, 0], [4, 2, 0, 0], [2, 2, 6, 7], ...[0, 1, 2, 3, 4].map((i) => [2 * i, 5, i + 1, 2])],
      caixas: [0, 1],
    });
    const e = Regras.estadoInicial(nivel);
    confere(json(Regras.bloqueadores(nivel, e, 0)) === json([6]), 'vermelho 0 sob a placa 6');
    let r;
    for (const id of [3, 4, 5, 6, 7]) r = Regras.jogar(nivel, e, id);
    confere(r.ok && r.semJogadas && !r.vitoria, 'travou: ' + json(e.bandeja));
    confere(Regras.jogadasPossiveis(nivel, e).length === 0, 'nenhuma jogada possível');
  });

  caso('bloqueio e queda de placa', () => {
    const nivel = nivelDeTeste({
      placas: [
        { forma: 'barraV', partes: [{ pontos: [[2, 0], [2, 4]], fechado: false }], raio: Regras.RAIO_BARRA },
        { forma: 'barraH', partes: [{ pontos: [[0, 4], [4, 4]], fechado: false }], raio: Regras.RAIO_BARRA },
      ],
      parafusos: [[2, 0, 0, 0], [2, 4, 0, 0], [0, 4, 1, 1], [1, 4, 1, 1], [4, 4, 1, 1]],
      caixas: [0, 1],
    });
    const e = Regras.estadoInicial(nivel);
    const antes = json(e);
    const r = Regras.jogar(nivel, e, 1);
    confere(!r.ok && r.motivo === 'bloqueado' && json(r.placas) === json([1]) && json(e) === antes, 'bloqueado sem mudar o estado');
    confere(!Regras.livre(nivel, e, 1) && Regras.destino(nivel, e, 1) === null, 'livre/destino');
    for (const id of [2, 3]) confere(!tipos(Regras.jogar(nivel, e, id)).includes('placaCai'), 'placa ainda tem parafusos');
    const cai = Regras.jogar(nivel, e, 4);
    confere(tipos(cai) === 'tirar,placaCai,caixaCompleta,slotVazio' && e.caida[1] === 1, 'placa cai: ' + tipos(cai));
    confere(Regras.livre(nivel, e, 1), 'parafuso de baixo ficou livre');
    const rem = Regras.jogar(nivel, e, 4);
    confere(!rem.ok && rem.motivo === 'removido', 'já removido');
  });

  caso('compactação da bandeja', () => {
    // bandeja: 0 (amarelo), 1 (verde), 2 (amarelo), 3 (roxo); entra a caixa amarela.
    const nivel = nivelDeBotoes([2, 3, 2, 4, 0, 0, 0, 2, 1, 1, 1, 3, 3, 4, 4, 3, 4], [0, 1, 2, 3, 4]);
    const e = Regras.estadoInicial(nivel);
    for (const id of [0, 1, 2, 3, 4, 5]) Regras.jogar(nivel, e, id);
    const r = Regras.jogar(nivel, e, 6);
    const pulos = r.eventos.filter((ev) => ev.tipo === 'puloBandeja');
    confere(json(pulos.map((ev) => [ev.parafuso, ev.deVaga, ev.furo])) === json([[0, 0, 0], [2, 2, 1]]), 'pulos ' + json(pulos));
    const compacta = r.eventos.find((ev) => ev.tipo === 'bandejaCompacta');
    confere(compacta && json(compacta.ordem) === json([1, 3]) && json(e.bandeja) === json([1, 3]), 'ordem relativa mantida');
    confere(r.eventos.indexOf(compacta) === r.eventos.length - 1, 'compacta depois dos pulos');
    // Sem buraco no meio, sem evento de compactação.
    const nivel2 = nivelDeBotoes([3, 2, 0, 0, 0, 2, 2, 1, 1, 1, 3, 3], [0, 1, 2, 3]);
    const e2 = Regras.estadoInicial(nivel2);
    for (const id of [0, 1, 2, 3]) Regras.jogar(nivel2, e2, id);
    const r2 = Regras.jogar(nivel2, e2, 4);
    confere(!r2.eventos.some((ev) => ev.tipo === 'bandejaCompacta') && json(e2.bandeja) === json([0]), 'sem compactação: ' + tipos(r2));
  });

  caso('duas caixas da mesma cor: vai para a mais cheia', () => {
    const nivel = nivelDeBotoes([0, 0, 0, 0, 0, 0], [0, 0]);
    const e = Regras.estadoInicial(nivel);
    const r0 = Regras.jogar(nivel, e, 0);
    confere(r0.eventos[0].para.slot === 0 && r0.eventos[0].para.furo === 0, 'empate: menor slot');
    e.slots[1].parafusos.push(1, 2); // slot 1 fica mais cheio que o slot 0
    e.removido[1] = e.removido[2] = 1;
    e.restantes -= 2;
    confere(json(Regras.destino(nivel, e, 3)) === json({ tipo: 'caixa', slot: 1, furo: 2 }), 'destino é o slot mais cheio');
    const r3 = Regras.jogar(nivel, e, 3);
    confere(r3.eventos[0].para.slot === 1 && tipos(r3).includes('caixaCompleta'), 'completa o slot 1');
  });

  caso('copiar é independente', () => {
    const nivel = Fases.gerar(3);
    const e = Regras.estadoInicial(nivel);
    const c = Regras.copiar(e);
    const antes = json(e);
    for (const id of nivel.solucao.slice(0, 7)) Regras.jogar(nivel, c, id);
    confere(json(e) === antes, 'original mudou');
    confere(json(Regras.copiar(c)) === json(c), 'cópia fiel');
    const n2 = Regras.preparar(JSON.parse(json(nivel)));
    confere(n2.assinatura === nivel.assinatura && json(n2.cobertoPor) === json(nivel.cobertoPor), 'preparar idempotente');
  });

  caso('destino, jogadasPossiveis e jogar concordam', () => {
    const g = Aleatorio.criar(7);
    for (const n of [4, 12, 25, 40]) {
      const nivel = Fases.gerar(n);
      const e = Regras.estadoInicial(nivel);
      for (;;) {
        const legais = Regras.jogadasPossiveis(nivel, e);
        for (let id = 0; id < nivel.parafusos.length; id++) {
          const d = Regras.destino(nivel, e, id);
          const r = Regras.jogar(nivel, Regras.copiar(e), id);
          confere((d !== null) === legais.includes(id) && r.ok === (d !== null), `fase ${n}, parafuso ${id}`);
          if (r.ok) {
            const t = r.eventos[0].para;
            confere(t.tipo === d.tipo && (t.tipo === 'caixa' ? t.slot === d.slot && t.furo === d.furo : t.vaga === d.vaga), 'destino igual ao evento');
          }
        }
        if (!legais.length) break;
        const r = Regras.jogar(nivel, e, g.escolher(legais));
        confere(r.semJogadas === (!r.vitoria && Regras.jogadasPossiveis(nivel, e).length === 0), 'semJogadas');
      }
    }
  });

  caso('tutoriais conferem com a spec', () => {
    const esperado = { 1: [2, 6, 0], 2: [3, 6, 1], 3: [3, 9, 0] };
    for (const n of [1, 2, 3]) {
      const nivel = Fases.gerar(n);
      confere(nivel.tutorial === n && !nivel.dificil, 'flags');
      const [placas, parafusos, cobertos] = esperado[n];
      confere(nivel.placas.length === placas && nivel.parafusos.length === parafusos, 'tamanho');
      confere(nivel.stats.cobertosInicio === cobertos, 'cobertos no início');
      confere(Fases.validar(nivel).length === 0, 'validar: ' + Fases.validar(nivel).join('; '));
    }
    confere(json(Fases.gerar(2).cobertoPor[1]) === json([2]), 'fase 2: placa 2 cobre o parafuso 1');
    confere(Fases.gerar(3).pressao === 1, 'fase 3 usa a bandeja');
  });

  return casos.length;
}

// ------------------------------------------------------------------ dica

function conferirDica(nivel, e, historico, contagem) {
  const d = Resolvedor.dica(nivel, e, historico);
  contagem[d.tipo] = (contagem[d.tipo] || 0) + 1;
  const n = nivel.numero;
  if (d.tipo === 'nada') {
    if (!Regras.venceu(nivel, e)) falhar(`dica fase ${n}: "nada" sem ter vencido`);
  } else if (d.tipo === 'parafuso') {
    if (!Regras.jogar(nivel, Regras.copiar(e), d.parafuso).ok) falhar(`dica fase ${n}: parafuso ${d.parafuso} não é jogada legal`);
  } else if (d.tipo === 'voltar') {
    if (!(d.passos >= 1 && d.passos <= historico.length)) {
      falhar(`dica fase ${n}: voltar ${d.passos} com histórico de ${historico.length}`);
      return d;
    }
    const alvo = Regras.copiar(historico[historico.length - d.passos]);
    alvo.extra = Math.max(alvo.extra, e.extra);
    const r = Regras.jogar(nivel, alvo, d.parafuso);
    if (!r.ok) falhar(`dica fase ${n}: voltar ${d.passos} e jogar ${d.parafuso} é ilegal (${r.motivo})`);
    else if (!r.vitoria && Resolvedor.resolver(nivel, alvo, { limiteNos: 400000, limiteMs: 20000 }).status !== 'solucao') {
      falhar(`dica fase ${n}: depois de voltar ${d.passos} e jogar ${d.parafuso} não há solução`);
    }
  }
  return d;
}

// Partida ao acaso (inclusive jogadas ruins para a bandeja), pedindo dica no meio e no fim se travar.
function testarDica(nivel, contagem, semente) {
  const g = Aleatorio.criar(semente);
  const e = Regras.estadoInicial(nivel);
  const historico = [];
  const pedirEm = g.inteiro(0, nivel.parafusos.length - 1);
  for (let passo = 0; ; passo++) {
    const legais = Regras.jogadasPossiveis(nivel, e);
    if (!legais.length) break;
    if (passo === pedirEm) {
      const d = conferirDica(nivel, e, historico, contagem);
      if (d.tipo === 'parafuso') {
        historico.push(Regras.copiar(e));
        Regras.jogar(nivel, e, d.parafuso);
        continue;
      }
    }
    historico.push(Regras.copiar(e));
    Regras.jogar(nivel, e, g.escolher(legais));
  }
  if (!Regras.venceu(nivel, e)) conferirDica(nivel, e, historico, contagem);
}

// ------------------------------------------------------------------ execução

const t0 = performance.now();
const casosRegras = testarRegras();
console.log(`Regras: ${casosRegras} casos ok${falhas.length ? `, ${falhas.length} falha(s)` : ''}.`);

const fases = [];
for (let n = DE; n <= ATE; n++) {
  const t = performance.now();
  const nivel = Fases.gerar(n);
  const ms = performance.now() - t;
  const erros = Fases.validar(nivel);
  for (const erro of erros) falhar(`fase ${n}: ${erro}`);
  const eixo = (nivel.largura - 1) / 2;
  const chave = (q) => q.partes.map((pa) => pa.pontos.map(([x, y]) => x + ',' + y).sort().join(';')).sort().join('|');
  const formas = new Set(nivel.placas.map(chave));
  const espelho = (q) => ({ partes: q.partes.map((pa) => ({ pontos: pa.pontos.map(([x, y]) => [2 * eixo - x, y]) })) });
  const simetricas = nivel.placas.filter((q) => formas.has(chave(espelho(q)))).length;
  const info = {
    n,
    dificil: nivel.dificil,
    placas: nivel.placas.length,
    parafusos: nivel.parafusos.length,
    cores: new Set(nivel.parafusos.map((s) => s.cor)).size,
    cobertos: (100 * nivel.stats.cobertosInicio) / nivel.parafusos.length,
    pressao: nivel.pressao,
    guloso: nivel.stats.taxaGulosa,
    alvo: n > 3 ? Fases.parametros(n).alvoGuloso : 0.95,
    simetria: (100 * simetricas) / nivel.placas.length,
    ms,
    assinatura: nivel.assinatura,
  };
  fases.push(info);
  if (DETALHES) {
    console.log(
      `fase ${pad(n, 4)}${nivel.dificil ? '*' : ' '} placas ${pad(info.placas, 2)} parafusos ${pad(info.parafusos, 2)} cores ${info.cores} ` +
        `cobertos ${pad(fmt(info.cobertos, 0), 3)}% pressão ${info.pressao} guloso ${fmt(info.guloso, 2)} (alvo ${fmt(info.alvo, 2)}) ` +
        `simetria ${pad(fmt(info.simetria, 0), 3)}% ${pad(fmt(ms, 0), 4)} ms`
    );
  }
}

// Determinismo: outro contexto, outra ordem (de trás para frente), mesma assinatura.
const amostra = fases.filter((f, i) => i < 5 || f.dificil || i % 17 === 0).slice(0, 60);
const P2 = carregar();
let deterministas = 0;
for (const f of amostra.slice().reverse()) {
  const a = P2.Fases.gerar(f.n).assinatura;
  if (a === f.assinatura) deterministas++;
  else falhar(`determinismo: fase ${f.n} mudou de assinatura (${f.assinatura} → ${a})`);
}

// Resolvedor a partir do início, com o orçamento padrão.
const semSolucao = [];
const temposResolver = [];
for (let n = DE; n <= ATE_RESOLVER; n++) {
  const nivel = Fases.gerar(n);
  const t = performance.now();
  const r = Resolvedor.resolver(nivel, Regras.estadoInicial(nivel));
  temposResolver.push(performance.now() - t);
  if (r.status !== 'solucao') {
    semSolucao.push(`${n} (${r.status})`);
    continue;
  }
  const e = Regras.estadoInicial(nivel);
  const ok = r.jogadas.every((id) => Regras.jogar(nivel, e, id).ok) && Regras.venceu(nivel, e);
  if (!ok) falhar(`resolvedor: solução da fase ${n} não vence quando jogada`);
}
const totalResolver = Math.max(0, ATE_RESOLVER - DE + 1);
const taxaResolver = totalResolver ? (totalResolver - semSolucao.length) / totalResolver : 1;
if (taxaResolver < 0.99) falhar(`resolvedor: só ${fmt(100 * taxaResolver)}% das fases resolvidas (meta 99%)`);

// Dica em partidas ao acaso.
const contagemDica = {};
const tDica = performance.now();
for (let n = DE; n <= ATE_RESOLVER; n++) testarDica(Fases.gerar(n), contagemDica, Aleatorio.hash('dica-' + n));
const msDica = performance.now() - tDica;

// ------------------------------------------------------------------ resumo

console.log('');
console.log('faixa      placas parafusos cores cobertos pressão guloso  alvo  difíceis(guloso) simetria  ms med  ms p95');
for (let ini = DE - ((DE - 1) % 10); ini <= ATE; ini += 10) {
  const faixa = fases.filter((f) => f.n >= ini && f.n < ini + 10);
  if (!faixa.length) continue;
  const dificeis = faixa.filter((f) => f.dificil);
  const ms = faixa.map((f) => f.ms);
  console.log(
    `${pad(`${ini}-${ini + 9}`, 9)} ${pad(fmt(media(faixa.map((f) => f.placas))), 7)} ${pad(fmt(media(faixa.map((f) => f.parafusos))), 9)} ` +
      `${pad(fmt(media(faixa.map((f) => f.cores))), 5)} ${pad(fmt(media(faixa.map((f) => f.cobertos)), 0) + '%', 8)} ` +
      `${pad(fmt(media(faixa.map((f) => f.pressao))), 7)} ${pad(fmt(media(faixa.map((f) => f.guloso)), 2), 6)} ` +
      `${pad(fmt(media(faixa.map((f) => f.alvo)), 2), 5)} ${pad(dificeis.length ? fmt(media(dificeis.map((f) => f.guloso)), 2) : '-', 16)} ` +
      `${pad(fmt(media(faixa.map((f) => f.simetria)), 0) + '%', 8)} ${pad(fmt(quantil(ms, 0.5), 0), 7)} ${pad(fmt(quantil(ms, 0.95), 0), 7)}`
  );
}
// Fases difíceis (múltiplos de 10) entre a anterior e a de alívio que vem depois.
const porNumero = new Map(fases.map((f) => [f.n, f]));
const trios = fases.filter((f) => f.dificil && porNumero.has(f.n - 1) && porNumero.has(f.n + 1) && f.n <= 200);
if (trios.length) {
  console.log('');
  console.log('Difíceis (guloso antes → difícil → alívio, entre parênteses o alvo da difícil):');
  const celulas = trios.map((f) => {
    const g = (n) => fmt(porNumero.get(n).guloso, 2);
    return `${pad(f.n, 3)}: ${g(f.n - 1)} → ${g(f.n)} (${fmt(f.alvo, 2)}) → ${g(f.n + 1)}`;
  });
  for (let i = 0; i < celulas.length; i += 4) console.log('  ' + celulas.slice(i, i + 4).join('   '));
}
const todosMs = fases.map((f) => f.ms);
const medianaMs = quantil(todosMs, 0.5);
const p95Ms = quantil(todosMs, 0.95);
console.log('');
console.log(`Fases ${DE}–${ATE}: ${fases.length} geradas; geração mediana ${fmt(medianaMs)} ms, p95 ${fmt(p95Ms)} ms, máx ${fmt(Math.max(...todosMs))} ms.`);
console.log(`Determinismo: ${deterministas}/${amostra.length} assinaturas iguais num contexto novo (ordem invertida).`);
console.log(
  `Resolvedor (início, orçamento padrão): ${totalResolver - semSolucao.length}/${totalResolver} = ${fmt(100 * taxaResolver)}%` +
    `${semSolucao.length ? ` — sem solução: ${semSolucao.join(', ')}` : ''}; tempo mediano ${fmt(quantil(temposResolver, 0.5))} ms, p95 ${fmt(quantil(temposResolver, 0.95))} ms.`
);
console.log(`Dica: ${Object.entries(contagemDica).map(([k, v]) => `${k} ${v}`).join(', ')} em ${fmt(msDica / 1000)} s.`);
if (medianaMs > 120) falhar(`geração: mediana ${fmt(medianaMs)} ms (meta 120)`);
if (p95Ms > 250) falhar(`geração: p95 ${fmt(p95Ms)} ms (meta 250)`);
console.log(`Tempo total: ${fmt((performance.now() - t0) / 1000)} s.`);
if (falhas.length) {
  console.log('');
  console.log(`${falhas.length} FALHA(S):`);
  for (const f of falhas.slice(0, 50)) console.log('  ' + f);
  if (falhas.length > 50) console.log(`  ... e mais ${falhas.length - 50}`);
  process.exit(1);
}
console.log('Tudo certo.');
