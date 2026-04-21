/**
 * Classes canónicas para botões do painel — estilos definidos em `app/globals.css` (@layer components).
 * Não usar strings Tailwind soltas aqui: o JIT pode não gerar utilitários e os botões ficam brancos/invisíveis.
 */

/** CTA principal: Guardar, Entrar, Novo pedido, etc. */
export const painelBtnPrimaryClass = "painel-btn-primary";

/** CTA compacto (tabelas, edição inline) */
export const painelBtnPrimaryCompactClass = "painel-btn-primary-compact";

/** Secundário com contorno */
export const painelBtnSecondaryClass = "painel-btn-secondary";

export const painelBtnSecondaryCompactClass = "painel-btn-secondary-compact";

/** Destrutivo */
export const painelBtnDangerClass = "painel-btn-danger";

export const painelBtnDangerCompactClass = "painel-btn-danger-compact";

/** Estilo link */
export const painelBtnLinkClass = "painel-btn-link";

export const painelBtnLinkCompactClass = "painel-btn-link-compact";
