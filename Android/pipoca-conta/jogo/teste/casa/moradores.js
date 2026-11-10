/* Casa da Pipoca (esboço) — quem mora e passeia pela casa: a Pipoca e alguns bichos das figurinhas.
   No jogo de verdade os bichos seriam redesenhados sem a borda branca de adesivo. */
(function () {
  const { em } = CASA;
  const miolo = svg => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  // a Pipoca: o desenho dela (viewBox 250 × 270) tem os pés em y ≈ 263 e o meio em x ≈ 135
  const pipoca = (x, piso, pose, k = 1.2) => em(x - 135 * k, piso - 263 * k, k, miolo(PC.pipoca.svg(pose)));
  // figurinha (quadro 200 × 200, pés perto de y 182)
  const bicho = (id, x, piso, k = 1) => em(x - 100 * k, piso - 182 * k, k, miolo(PC.figurinhas.desenho(id)));
  const S = CASA.partes.sala && CASA.partes.sala.lugares;
  CASA.moradores = () =>
    pipoca(2150, CASA.BAIXO.piso, 'acena') +
    bicho('fig20', S && S.tapete ? 1760 : 1760, CASA.BAIXO.piso + 14, .95) +      // capivara no tapete da sala
    bicho('fig21', 2200, CASA.CIMA.piso + 8, .9) +                               // onça brincando no quarto
    bicho('fig23', 5600, CASA.BAIXO.piso + 8, .85) +                             // tucano na cozinha
    bicho('fig26', 9000, CASA.CHAO + 12, 1) +                                    // quati no quintal
    bicho('fig22', 8300, CASA.CHAO - 125, .8);                                   // preguiça no balanço
})();
