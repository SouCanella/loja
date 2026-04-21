/**
 * Superfícies e inputs partilhados (cartões, formulários auth) — alinhado ao painel.
 */

/** Cartão branco com borda — blocos principais em listagens e dashboards. */
export const painelCardClass = "rounded-xl border border-slate-200 bg-white shadow-sm";

/** Variante mais discreta (relatórios, secções densas). */
export const painelCardSubtleClass = "rounded-lg border border-slate-200 bg-white shadow-sm";

/** Input de texto em páginas públicas login/registo — foco painel-primary. */
export const painelAuthInputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-painel-primary focus:outline-none focus:ring-1 focus:ring-painel-primary";
