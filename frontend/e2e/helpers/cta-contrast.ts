import { expect, type Locator } from "@playwright/test";

function parseRgb(css: string): { r: number; g: number; b: number; a?: number } | null {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/,\s*/).map((x) => Number.parseFloat(x));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] };
}

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

/**
 * Evita regressão em que o JIT do Tailwind não gera `bg-painel-cta` (classes só em `lib/`)
 * e o botão fica branco sobre barra branca — invisível ao utilizador.
 * Valida `getComputedStyle().backgroundColor` distante de branco puro.
 */
export async function expectCtaButtonBackground(
  button: Locator,
  context: string,
): Promise<void> {
  const bg = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
  const rgb = parseRgb(bg);
  expect(rgb, `${context}: backgroundColor parseável (${bg})`).not.toBeNull();
  const dWhite = colorDistance(rgb!, { r: 255, g: 255, b: 255 });
  expect(
    dWhite,
    `${context}: o fundo do botão primário não deve ser branco/invisível (Tailwind sem utilitário?). Obtido: ${bg}`,
  ).toBeGreaterThan(35);
}
