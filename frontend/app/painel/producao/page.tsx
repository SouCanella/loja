"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PainelTitleHelp } from "@/components/painel/FieldTip";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, formatBRL, formatQty, PainelApiError } from "@/lib/painel-api";
import { painelBtnPrimaryClass, painelBtnSecondaryClass } from "@/lib/painel-button-classes";
import {
  painelFilterBarClass,
  painelFilterDateInputClass,
  painelFilterFieldColClass,
  painelFilterLabelCompactClass,
  painelFilterSearchInputClass,
} from "@/lib/painel-filter-classes";
import {
  painelTableCellClass,
  painelTableClass,
  painelTableTbodyClass,
  painelTableTheadClass,
  painelTableWrapClass,
} from "@/lib/painel-table-classes";

type ProductionRun = {
  id: string;
  recipe_id: string;
  output_quantity: string;
  total_input_cost: string;
  unit_output_cost: string;
  created_at: string;
};

type RecipeRow = { id: string; product_id: string };
type ProductRow = { id: string; name: string };

function formatLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 89);
  return { from: formatLocalIsoDate(from), to: formatLocalIsoDate(to) };
}

export default function ProducaoPage() {
  const [range, setRange] = useState(defaultRange);
  const [runs, setRuns] = useState<ProductionRun[] | null>(null);
  const [recipeNames, setRecipeNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [textFilter, setTextFilter] = useState("");

  const load = useCallback(() => {
    setError(null);
    const q = new URLSearchParams({
      limit: "200",
      date_from: range.from,
      date_to: range.to,
    });
    void Promise.all([
      apiPainelJson<ProductionRun[]>(`/api/v2/production-runs?${q.toString()}`),
      apiPainelJson<RecipeRow[]>("/api/v2/recipes"),
      apiPainelJson<ProductRow[]>("/api/v2/products?active_only=false"),
    ])
      .then(([list, recipes, products]) => {
        setRuns(list);
        const pmap: Record<string, string> = {};
        for (const p of products) pmap[p.id] = p.name;
        const rmap: Record<string, string> = {};
        for (const r of recipes) {
          rmap[r.id] = pmap[r.product_id] ?? r.product_id.slice(0, 8) + "…";
        }
        setRecipeNames(rmap);
      })
      .catch((e: unknown) => {
        setRuns(null);
        setError(e instanceof PainelApiError ? e.message : "Erro ao carregar corridas.");
      });
  }, [range.from, range.to]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(() => {
    if (!runs) return [];
    return [...runs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [runs]);

  const displayed = useMemo(() => {
    const q = textFilter.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((r) => {
      const label = (recipeNames[r.recipe_id] ?? "").toLowerCase();
      return label.includes(q) || r.recipe_id.toLowerCase().includes(q);
    });
  }, [sorted, recipeNames, textFilter]);

  return (
    <>
      <PainelStickyHeading>
        <PainelTitleHelp tip="Lista as corridas de produção registadas (a partir de «Produzir lote» nas receitas). Filtre por intervalo de datas (UTC, alinhado ao relatório). Custos e quantidades vêm da API.">
          <h1 className="text-2xl font-semibold text-slate-900">Produção</h1>
        </PainelTitleHelp>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Histórico de lotes produzidos na loja. Para registar uma nova corrida, use{" "}
          <Link href="/painel/receitas" className="font-medium text-painel-primary hover:underline">
            Receitas
          </Link>{" "}
          → «Produzir lote».
        </p>

        <div className={painelFilterBarClass}>
          <div className={painelFilterFieldColClass}>
            <label className={painelFilterLabelCompactClass} htmlFor="prod-from">
              De
            </label>
            <input
              id="prod-from"
              type="date"
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className={painelFilterDateInputClass}
            />
          </div>
          <div className={painelFilterFieldColClass}>
            <label className={painelFilterLabelCompactClass} htmlFor="prod-to">
              Até
            </label>
            <input
              id="prod-to"
              type="date"
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className={painelFilterDateInputClass}
            />
          </div>
          <div className={`min-w-0 flex-1 sm:max-w-xs ${painelFilterFieldColClass}`}>
            <label className={painelFilterLabelCompactClass} htmlFor="prod-search">
              Receita / produto
            </label>
            <input
              id="prod-search"
              type="search"
              autoComplete="off"
              placeholder="Filtrar na lista…"
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              className={painelFilterSearchInputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className={painelBtnPrimaryClass}
          >
            Actualizar
          </button>
        </div>
      </PainelStickyHeading>

      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}

      {runs === null && !error ? (
        <p className="mt-8 text-sm text-slate-500">A carregar…</p>
      ) : null}

      {runs && runs.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">Nenhuma corrida neste intervalo.</p>
      ) : null}

      {sorted.length > 0 && displayed.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">
          Nenhuma corrida corresponde a «{textFilter.trim()}». Limpe a pesquisa ou ajuste o texto.
        </p>
      ) : null}

      {displayed.length > 0 ? (
        <div className={`mt-8 ${painelTableWrapClass}`}>
          <table className={painelTableClass}>
            <thead className={painelTableTheadClass}>
              <tr>
                <th className={painelTableCellClass}>Data (UTC)</th>
                <th className={painelTableCellClass}>Receita / produto</th>
                <th className={`${painelTableCellClass} text-right`}>Quantidade produzida</th>
                <th className={`${painelTableCellClass} text-right`}>Custo insumos</th>
                <th className={`${painelTableCellClass} text-right`}>Custo unit. saída</th>
              </tr>
            </thead>
            <tbody className={painelTableTbodyClass}>
              {displayed.map((r) => (
                <tr key={r.id} className="text-slate-800">
                  <td className={`${painelTableCellClass} text-xs text-slate-600`}>
                    {new Date(r.created_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className={`${painelTableCellClass} font-medium text-slate-900`}>
                    {recipeNames[r.recipe_id] ?? r.recipe_id.slice(0, 8) + "…"}
                  </td>
                  <td className={`${painelTableCellClass} text-right tabular-nums`}>
                    {formatQty(r.output_quantity)}
                  </td>
                  <td className={`${painelTableCellClass} text-right tabular-nums`}>
                    {formatBRL(r.total_input_cost)}
                  </td>
                  <td className={`${painelTableCellClass} text-right tabular-nums`}>
                    {formatBRL(r.unit_output_cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/painel/receitas"
          className={`inline-flex items-center justify-center ${painelBtnPrimaryClass}`}
        >
          Ir às receitas
        </Link>
        <Link
          href="/painel/relatorio"
          className={`inline-flex items-center justify-center ${painelBtnSecondaryClass}`}
        >
          Relatório financeiro
        </Link>
      </div>
    </>
  );
}
