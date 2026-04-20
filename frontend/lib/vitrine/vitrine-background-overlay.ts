import type { CSSProperties } from "react";

/** Cor `loja-bg` do Tailwind (#faf6f2) — véu sobre a foto de fundo. */
const R = 250;
const G = 246;
const B = 242;

/** Converte 0–100 (opacidade do véu) em alpha 0.12–0.97. */
export function vitrineOverlayAlphaFromPercent(percent: number | null | undefined): number {
  const p = percent != null && Number.isFinite(Number(percent)) ? Number(percent) : 88;
  return Math.min(0.97, Math.max(0.12, p / 100));
}

export function vitrineBackgroundOverlayStyle(percent: number | null | undefined): CSSProperties {
  const a = vitrineOverlayAlphaFromPercent(percent);
  return { backgroundColor: `rgba(${R},${G},${B},${a})` };
}
