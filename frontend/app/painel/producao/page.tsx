"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PainelTitleHelp } from "@/components/painel/FieldTip";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, formatBRL, formatQty, PainelApiError } from "@/lib/painel-api";
import { painelBtnPrimaryClass, painelBtnSecondaryClass } from "@/lib/painel-button-classes";

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

        <div className="mt-6 flex flex-wrap items-end gap-3">
          <label className="text-xs text-slate-500">
            De
            <input
              type="date"
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="ml-2 rounded border border-slate-200 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs text-slate-500">
            Até
            <input
              type="date"
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="ml-2 rounded border border-slate-200 px-2 py-1 text-sm"
            />
          </label>
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

      {sorted.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
              <tr>
                <th className="px-4 py-3">Data (UTC)</th>
                <th className="px-4 py-3">Receita / produto</th>
                <th className="px-4 py-3 text-right">Quantidade produzida</th>
                <th className="px-4 py-3 text-right">Custo insumos</th>
                <th className="px-4 py-3 text-right">Custo unit. saída</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((r) => (
                <tr key={r.id} className="text-slate-800">
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {new Date(r.created_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {recipeNames[r.recipe_id] ?? r.recipe_id.slice(0, 8) + "…"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatQty(r.output_quantity)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatBRL(r.total_input_cost)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatBRL(r.unit_output_cost)}</td>
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
