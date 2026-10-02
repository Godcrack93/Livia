// Escala das partículas (Points) em pixels: atualizar a cada quadro com a altura do canvas.
export const pointScale = { value: 400 };

export function updatePointScale(renderer) {
  pointScale.value = renderer.domElement.height * (0.5 / Math.tan((35 * Math.PI) / 180));
}
