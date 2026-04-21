import { useEffect, useMemo, useState } from "react";

/** Tamanho de página por omissão nas listagens do painel (linhas por página). */
export const PAINEL_DEFAULT_PAGE_SIZE = 20;

export function slicePage<T>(items: readonly T[], page: number, pageSize: number): T[] {
  if (!items.length || pageSize <= 0) return [];
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize) as T[];
}

export function paginationRangeLabel(
  page: number,
  pageSize: number,
  totalCount: number,
): { from: number; to: number } {
  if (totalCount <= 0) return { from: 0, to: 0 };
  const from = (Math.max(1, page) - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  return { from, to };
}

type UsePainelPaginationOptions = {
  pageSize?: number;
  /** Quando mudar (filtros, intervalo de datas, etc.), a página volta a 1. */
  resetKey?: string | number;
};

export function usePainelPagination(totalCount: number, options?: UsePainelPaginationOptions) {
  const pageSize = options?.pageSize ?? PAINEL_DEFAULT_PAGE_SIZE;
  const resetKey = options?.resetKey ?? "";

  const pageCount = useMemo(() => {
    if (totalCount <= 0) return 1;
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }, [totalCount, pageSize]);

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), pageCount));
  }, [pageCount]);

  return { page, setPage, pageSize, pageCount };
}
