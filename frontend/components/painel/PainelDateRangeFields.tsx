"use client";

import type { ReactNode } from "react";

import {
  painelFilterBarBoxClass,
  painelFilterBarClass,
  painelFilterDateInputClass,
  painelFilterFieldColClass,
  painelFilterLabelCompactClass,
} from "@/lib/painel-filter-classes";

export type PainelDateRangeFieldsProps = {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  idFrom?: string;
  idTo?: string;
  labelDe?: string;
  labelAte?: string;
  /**
   * Só os dois campos (sem wrapper). Use dentro de uma `flex`/`grid` própria
   * (ex.: relatório com presets e «Atualizar»).
   */
  bare?: boolean;
  /** Barra de filtros padrão do painel (`mt-6` + flex wrap). */
  bar?: boolean;
  /** Caixa com fundo (ex.: analytics vitrine). */
  boxed?: boolean;
  className?: string;
  /** Conteúdo extra na mesma linha/bloco (botões, presets, tips). */
  children?: ReactNode;
};

/**
 * Campos **De** / **Até** com classes canónicas (`painel-filter-classes`).
 * Escolha `bare`, `bar` ou `boxed` conforme o layout da página.
 */
export function PainelDateRangeFields({
  from,
  to,
  onFromChange,
  onToChange,
  idFrom = "painel-dr-from",
  idTo = "painel-dr-to",
  labelDe = "De",
  labelAte = "Até",
  bare,
  bar,
  boxed,
  className = "",
  children,
}: PainelDateRangeFieldsProps) {
  const fields = (
    <>
      <div className={painelFilterFieldColClass}>
        <label className={painelFilterLabelCompactClass} htmlFor={idFrom}>
          {labelDe}
        </label>
        <input
          id={idFrom}
          type="date"
          className={painelFilterDateInputClass}
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
        />
      </div>
      <div className={painelFilterFieldColClass}>
        <label className={painelFilterLabelCompactClass} htmlFor={idTo}>
          {labelAte}
        </label>
        <input
          id={idTo}
          type="date"
          className={painelFilterDateInputClass}
          value={to}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>
    </>
  );

  if (bare) {
    return <>{fields}</>;
  }

  const inner = (
    <>
      {fields}
      {children}
    </>
  );

  if (boxed) {
    return <div className={`${painelFilterBarBoxClass} ${className}`.trim()}>{inner}</div>;
  }

  if (bar) {
    return <div className={`${painelFilterBarClass} ${className}`.trim()}>{inner}</div>;
  }

  return <div className={`flex flex-wrap items-end gap-3 ${className}`.trim()}>{inner}</div>;
}
