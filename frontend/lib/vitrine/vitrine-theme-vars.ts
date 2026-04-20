import type { CSSProperties } from "react";

import type { StorePublic } from "@/lib/vitrine/types";

/** Converte #RGB ou #RRGGBB para canais separados por espaço (Tailwind + / opacidade). */
export function hexToRgbChannels(hex: string): string | null {
  let h = hex.trim();
  if (!h) return null;
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6 || !/^[0-9a-fA-F]+$/.test(h)) return null;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function mixTowardsWhite(channels: string, ratio: number): string {
  const parts = channels.split(/\s+/).map((x) => Number.parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return channels;
  const t = Math.min(1, Math.max(0, ratio));
  const mix = (x: number) => Math.round(x + (255 - x) * t);
  return `${mix(parts[0])} ${mix(parts[1])} ${mix(parts[2])}`;
}

/** Variáveis CSS consumidas por `theme.extend.colors.loja` no Tailwind. */
export function vitrineThemeStyle(store: StorePublic): CSSProperties {
  const style: Record<string, string> = {};
  const pk = store.primary_color ? hexToRgbChannels(store.primary_color) : null;
  if (pk) {
    style["--loja-primary-rgb"] = pk;
  }
  const ak = store.accent_color ? hexToRgbChannels(store.accent_color) : null;
  if (ak) {
    style["--loja-accent-rgb"] = ak;
    style["--loja-accent-soft-rgb"] = mixTowardsWhite(ak, 0.88);
  }
  return style as CSSProperties;
}
