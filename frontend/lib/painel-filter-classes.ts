/**
 * Classes partilhadas para barras de filtro no painel (pesquisa, selects, datas).
 * Mantém o mesmo aspecto que pedidos, clientes e receitas.
 */

/** Barra de filtros sob o título (controlos em linha ou coluna). */
export const painelFilterBarClass =
  "mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end";

/** Caixa com fundo (relatórios, analytics com datas). */
export const painelFilterBarBoxClass =
  "mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

/** Coluna: rótulo + controlo. */
export const painelFilterFieldColClass = "flex min-w-0 flex-col gap-2";

/** Rótulo de filtro (texto secundário). */
export const painelFilterLabelClass = "text-sm font-medium text-slate-600";

/** Rótulo compacto (datas em linha). */
export const painelFilterLabelCompactClass = "block text-xs font-medium text-slate-600";

/** Input de texto / pesquisa. */
export const painelFilterSearchInputClass =
  "mt-1 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-painel-primary focus:outline-none focus:ring-1 focus:ring-painel-primary";

/** Select (estado, período, etc.). */
export const painelFilterSelectClass =
  "w-full min-w-[10rem] max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-painel-primary focus:outline-none focus:ring-1 focus:ring-painel-primary";

/** Input de data (De / Até). */
export const painelFilterDateInputClass =
  "mt-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-painel-primary focus:outline-none focus:ring-1 focus:ring-painel-primary";

/** Checkbox em linha com rótulo (ex.: «mostrar inactivas»). */
export const painelFilterCheckboxClass =
  "mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-painel-primary focus:ring-painel-primary";
