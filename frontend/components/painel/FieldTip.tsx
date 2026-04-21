"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

function computeTipBox(btn: DOMRect): { top: number; left: number; width: number } {
  const w = Math.min(288, Math.max(240, window.innerWidth - 24));
  let left = btn.left + btn.width / 2 - w / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - w - 12));

  const gap = 8;
  const margin = 12;
  const maxTooltip = Math.min(320, window.innerHeight * 0.5);

  let top = btn.bottom + gap;
  if (top + maxTooltip > window.innerHeight - margin) {
    const topIfAbove = btn.top - gap - maxTooltip;
    if (topIfAbove >= margin) {
      top = topIfAbove;
    } else {
      top = Math.max(margin, window.innerHeight - margin - maxTooltip);
    }
  }

  return { top, left, width: w };
}

/** Texto do campo + ícone «?»; o ícone mantém-se alinhado ao topo quando o título quebra linhas. */
export function FieldTipBeside({
  children,
  tip,
  align = "start",
}: {
  children: React.ReactNode;
  tip: string;
  align?: "start" | "end";
}) {
  if (align === "end") {
    return (
      <span className="inline-flex max-w-full items-start justify-end gap-1.5 text-right">
        <span className="min-w-0 leading-snug">{children}</span>
        <FieldTip text={tip} className="shrink-0" />
      </span>
    );
  }
  return (
    <span className="flex w-full min-w-0 items-start gap-1.5">
      <span className="min-w-0 flex-1 leading-snug [&_strong]:font-semibold">{children}</span>
      <FieldTip text={tip} className="shrink-0" />
    </span>
  );
}

/** Título de página ou secção + ajuda; alinhamento estável em telemóvel. */
export function PainelTitleHelp({
  children,
  tip,
  printHidden = true,
}: {
  children: React.ReactNode;
  tip: string;
  printHidden?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-start gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      <span className={printHidden ? "shrink-0 print:hidden" : "shrink-0"}>
        <FieldTip text={tip} />
      </span>
    </div>
  );
}

/** «?» alinhado à linha de filtros de data (mesmo markup em Relatórios, Financeiro, etc.). */
export function FilterBarFieldTip({ text }: { text: string }) {
  return (
    <span className="inline-flex shrink-0 items-start self-end pb-2 print:hidden">
      <FieldTip text={text} />
    </span>
  );
}

/** Dica contextual: toque/clique no ícone para abrir (adequado a mobile; evita só `title`). */
export function FieldTip({ text, className }: { text: string; className?: string }) {
  const id = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  const btnClass = [
    "inline-flex h-7 w-7 shrink-0 touch-manipulation items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold leading-none text-slate-600 shadow-sm sm:h-[22px] sm:w-[22px] sm:text-[11px]",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) {
      setBox(null);
      return;
    }
    const r = btnRef.current.getBoundingClientRect();
    setBox(computeTipBox(r));
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
        className="z-[500] flex max-h-[min(50vh,320px)] flex-col overflow-hidden rounded-xl border-2 border-painel-primary bg-white shadow-lg shadow-painel-primary/25"
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
        className={btnClass}
        aria-expanded={open}
        aria-label="Ajuda contextual"
        aria-describedby={open ? `${id}-tip` : undefined}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        ?
      </button>
      {tip ? createPortal(tip, document.body) : null}
    </>
  );
}
