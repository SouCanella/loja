"use client";

import type { ReactNode } from "react";

/**
 * Cabeçalho da página fixo ao scroll no ecrã principal do painel (como em Configuração da loja).
 * Usar **na página**, não no menu lateral — `top-14` alinha abaixo da barra móvel «Menu / Painel».
 *
 * - Com `title` (+ `description` opcional): título simples.
 * - Com `children`: bloco livre (ex.: `PainelTitleHelp` + subtítulo + filtros na mesma faixa fixa).
 */
export function PainelStickyHeading({
  title,
  description,
  leading,
  children,
}: {
  title?: string;
  description?: ReactNode;
  leading?: ReactNode;
  children?: ReactNode;
}) {
  const body =
    children != null ? (
      children
    ) : (
      <>
        <h1 className="text-2xl font-semibold text-slate-900">{title ?? ""}</h1>
        {description ? <div className="mt-1 text-sm text-slate-500">{description}</div> : null}
      </>
    );

  return (
    <div
      className={
        "sticky top-14 z-10 -mx-4 border-b border-slate-200 bg-slate-50 px-4 py-3 max-md:shadow-sm print:static print:shadow-none " +
        "md:top-0 md:mx-0 md:mb-6 md:px-0"
      }
    >
      {leading ? <div className="mb-2 text-sm">{leading}</div> : null}
      {body}
    </div>
  );
}
