/**
 * Classes Tailwind canónicas para botões e controlos tipo botão no painel.
 * Manter alterações aqui para o visual ficar consistente (primário, secundário, perigo, links).
 */

/** CTA principal: Guardar, Criar pedido, Adicionar insumo, Produzir, etc. */
export const painelBtnPrimaryClass =
  "rounded-md bg-painel-cta px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-painel-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-painel-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-stone-400 disabled:text-white";

/** CTA compacto (linhas de tabela, edição inline) */
export const painelBtnPrimaryCompactClass =
  "rounded-md bg-painel-cta px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-painel-cta-hover disabled:cursor-not-allowed disabled:opacity-50";

/** Secundário com contorno (Cancelar, Exportar, Enviar ficheiro, inputs ao lado) */
export const painelBtnSecondaryClass =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-painel-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

/** Secundário compacto (Cancelar em edição inline) */
export const painelBtnSecondaryCompactClass =
  "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

/** Destrutivo: Remover linha, Remover insumo, etc. */
export const painelBtnDangerClass =
  "rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-800 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

/** Destrutivo compacto (tabelas densas) */
export const painelBtnDangerCompactClass =
  "rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50";

/** Texto + cor primária: + Linha, + Adicionar rede, Editar (quando é só texto) */
export const painelBtnLinkClass =
  "text-sm font-medium text-painel-primary transition-colors hover:text-painel-primary-strong hover:underline disabled:opacity-50";

export const painelBtnLinkCompactClass =
  "text-xs font-medium text-painel-primary transition-colors hover:underline disabled:opacity-50";
