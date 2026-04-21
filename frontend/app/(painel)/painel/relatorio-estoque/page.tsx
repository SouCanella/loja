"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import {
  apiPainelJson,
  formatBRL,
  formatQty,
  PainelApiError,
} from "@/lib/painel-api";
import { painelBtnSecondaryClass } from "@/lib/painel-button-classes";
import {
  painelFilterBarClass,
  painelFilterFieldColClass,
  painelFilterLabelClass,
  painelFilterSearchInputClass,
} from "@/lib/painel-filter-classes";
import {
  painelTableCellClass,
  painelTableClass,
  painelTableTbodyClass,
  painelTableTheadClass,
  painelTableWrapPrintClass,
} from "@/lib/painel-table-classes";

type InvRow = {
  id: string;
  name: string;
  unit: string;
  has_sale_product?: boolean;
  quantity_available: string;
  weighted_avg_unit_cost: string | null;
  inventory_value: string;
};

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function RelatorioEstoquePage() {
  const [rows, setRows] = useState<InvRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");

  const displayRows = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.unit.toLowerCase().includes(q));
  }, [rows, filterQuery]);

  const load = useCallback(() => {
    setError(null);
    apiPainelJson<InvRow[]>("/api/v2/inventory-items")
      .then(setRows)
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Erro ao carregar");
      });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalValor = useMemo(() => {
    let t = 0;
    for (const r of displayRows) {
      const n = Number.parseFloat(r.inventory_value);
      if (!Number.isNaN(n)) t += n;
    }
    return t;
  }, [displayRows]);

  function downloadCsv() {
    const header = [
      "id",
      "nome",
      "unidade",
      "catalogo",
      "qtd_disponivel",
      "custo_medio_un",
      "valor_stock",
    ];
    const lines = [
      header.join(","),
      ...displayRows.map((r) =>
        [
          r.id,
          r.name,
          r.unit,
          r.has_sale_product ? "sim" : "nao",
          r.quantity_available,
          r.weighted_avg_unit_cost ?? "",
          r.inventory_value,
        ]
          .map((c) => csvEscape(String(c)))
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-insumos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PainelStickyHeading>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Relatório de stock (insumos)</h1>
            <p className="mt-1 text-sm text-slate-500">
              Quantidades disponíveis e valor aproximado por insumo (agregado dos lotes).
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={displayRows.length === 0}
              onClick={downloadCsv}
              className={`${painelBtnSecondaryClass} disabled:opacity-50`}
            >
              Exportar CSV
            </button>
            <Link href="/painel/insumos" className="text-sm text-painel-primary hover:underline">
              ← Insumos
            </Link>
          </div>
        </div>

        <div className={painelFilterBarClass}>
          <div className={`min-w-0 flex-1 sm:max-w-md ${painelFilterFieldColClass}`}>
            <label className={painelFilterLabelClass} htmlFor="rel-est-filter">
              Pesquisar insumo
            </label>
            <input
              id="rel-est-filter"
              type="search"
              autoComplete="off"
              placeholder="Nome ou unidade…"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className={painelFilterSearchInputClass}
            />
          </div>
        </div>
      </PainelStickyHeading>

      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-600">
          Valor total aproximado{filterQuery.trim() ? " (filtro)" : ""} em stock:{" "}
          <span className="font-semibold tabular-nums text-slate-900">
            {formatBRL(totalValor)}
          </span>
        </p>
      </div>

      <div className={`mt-4 ${painelTableWrapPrintClass}`}>
        <table className={painelTableClass}>
          <thead className={painelTableTheadClass}>
            <tr>
              <th className={painelTableCellClass}>Insumo</th>
              <th className={`${painelTableCellClass} text-right`}>Qtd disponível</th>
              <th className={`${painelTableCellClass} text-right`}>Custo médio / un.</th>
              <th className={`${painelTableCellClass} text-right`}>Valor em stock</th>
            </tr>
          </thead>
          <tbody className={painelTableTbodyClass}>
            {rows.length > 0 && displayRows.length === 0 ? (
              <tr>
                <td colSpan={4} className={`${painelTableCellClass} py-8 text-center text-slate-500`}>
                  Nenhum insumo corresponde a «{filterQuery.trim()}».
                </td>
              </tr>
            ) : null}
            {displayRows.map((r) => (
              <tr key={r.id}>
                <td className={painelTableCellClass}>
                  <span className="font-medium">{r.name}</span>{" "}
                  <span className="text-slate-500">({r.unit})</span>
                </td>
                <td className={`${painelTableCellClass} text-right tabular-nums`}>
                  {formatQty(r.quantity_available)}
                </td>
                <td className={`${painelTableCellClass} text-right tabular-nums`}>
                  {r.weighted_avg_unit_cost != null ? formatBRL(r.weighted_avg_unit_cost) : "—"}
                </td>
                <td className={`${painelTableCellClass} text-right tabular-nums font-medium`}>
                  {formatBRL(r.inventory_value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !error ? (
          <p className="p-6 text-center text-sm text-slate-500">Sem dados.</p>
        ) : null}
      </div>
    </>
  );
}
