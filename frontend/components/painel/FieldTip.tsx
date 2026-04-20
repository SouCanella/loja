"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

/** Dica contextual: toque/clique no ícone para abrir (adequado a mobile; evita só `title`). */
export function FieldTip({ text }: { text: string }) {
  const id = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) {
      setBox(null);
      return;
    }
    const r = btnRef.current.getBoundingClientRect();
    const w = Math.min(288, Math.max(240, window.innerWidth - 24));
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
    setBox({ top: r.bottom + 8, left, width: w });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => setOpen(false);
    const onScroll = () => setOpen(false);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      const el = document.getElementById(`${id}-tip`);
      if (el?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, id]);

  const tip =
    mounted && open && box ? (
      <div
        id={`${id}-tip`}
        role="tooltip"
        style={{
          position: "fixed",
          top: box.top,
          left: box.left,
          width: box.width,
        }}
        className="z-[300] flex max-h-[min(50vh,320px)] flex-col overflow-hidden rounded-xl border-2 border-painel-primary bg-white shadow-lg shadow-painel-primary/25"
      >
        <div className="min-h-0 flex-1 overflow-y-auto border-l-4 border-painel-secondary bg-white py-3 pl-3 pr-3 text-left text-sm leading-relaxed text-slate-800">
          {text}
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="ml-1 inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold leading-none text-slate-600 shadow-sm touch-manipulation sm:min-h-[22px] sm:min-w-[22px] sm:text-[11px]"
        aria-expanded={open}
        aria-label="Ajuda sobre este campo"
        aria-describedby={open ? `${id}-tip` : undefined}
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
      >
        ?
      </button>
      {tip ? createPortal(tip, document.body) : null}
    </>
  );
}
