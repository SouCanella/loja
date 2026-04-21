"use client";

import { useId } from "react";

function normalizeHex(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let h = s.startsWith("#") ? s : `#${s}`;
  if (/^#[0-9A-Fa-f]{6}$/i.test(h)) return h.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/i.test(h)) {
    const r = h[1]!;
    const g = h[2]!;
    const b = h[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

const FALLBACK = "#64748b";

/** Barra de cor nativa + campo hex; cores alinhadas ao painel (accent nos controlos). */
export function HexColorInput({
  id: idProp,
  value,
  onChange,
  placeholder = "#000000",
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const uid = useId();
  const id = idProp ?? uid;
  const valid = normalizeHex(value);
  const pickerValue = valid ?? normalizeHex(placeholder) ?? FALLBACK;

  return (
    <div className="space-y-2">
      <input
        type="color"
        className="h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white shadow-sm [color-scheme:light]"
        value={pickerValue}
        aria-label={ariaLabel ?? "Escolher cor"}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
      />
      <input
        id={id}
        type="text"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          const n = normalizeHex(e.target.value);
          if (n) onChange(n);
        }}
      />
    </div>
  );
}
