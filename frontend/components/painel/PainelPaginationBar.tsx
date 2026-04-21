"use client";

import { painelBtnSecondaryCompactClass } from "@/lib/painel-button-classes";
import { paginationRangeLabel } from "@/lib/painel-pagination";

type Props = {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (next: number) => void;
  className?: string;
};

/**
 * Barra de paginação reutilizável (listagens do painel).
 * Mostra intervalo «de–até» e botões Anterior / Seguinte.
 */
export function PainelPaginationBar({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
}: Props) {
  if (totalItems <= 0) return null;

  const { from, to } = paginationRangeLabel(page, pageSize, totalItems);
  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <div
      className={`flex flex-col gap-2 border-t border-slate-100 bg-slate-50/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${className}`}
      role="navigation"
      aria-label="Paginação da lista"
    >
      <p className="text-xs tabular-nums text-slate-600">
        <span className="font-medium text-slate-700">
          {from}–{to}
        </span>
        <span className="text-slate-500"> de {totalItems}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className={`${painelBtnSecondaryCompactClass} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          Anterior
        </button>
        <span className="text-xs text-slate-600">
          Página {page} de {pageCount}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className={`${painelBtnSecondaryCompactClass} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          Seguinte
        </button>
      </div>
    </div>
  );
}
