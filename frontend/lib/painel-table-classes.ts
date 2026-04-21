/**
 * Padrão visual único para tabelas no painel (scroll, cartão, cabeçalho, células).
 * Usar estes tokens em novas páginas; alterações centralizadas aqui.
 */

/** Bloco completo: scroll horizontal + cartão branco (tabela sozinha na página). */
export const painelTableWrapClass =
  "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm";

/** Mesmo bloco, com reset em impressão (relatórios PDF / print). */
export const painelTableWrapPrintClass = `${painelTableWrapClass} print:border-0 print:shadow-none`;

/** Só scroll — dentro de um cartão que já tem borda/cantos (ex.: relatório com título acima). */
export const painelTableScrollInnerClass = "overflow-x-auto";

/** `<table>` — largura fluida (maioria das páginas). */
export const painelTableClass = "min-w-full text-left text-sm";

/** `<table>` — catálogo e grelhas muito largas (editar inline em muitas colunas). */
export const painelTableClassWide = "min-w-[1100px] text-left text-sm";

export const painelTableTheadClass =
  "border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600";

export const painelTableTbodyClass = "divide-y divide-slate-100";

/** Células th/td — densidade normal (maioria). */
export const painelTableCellClass = "px-4 py-3";

/** Células th/td — relatórios e tabelas mais compactas. */
export const painelTableCellDenseClass = "px-4 py-2";
