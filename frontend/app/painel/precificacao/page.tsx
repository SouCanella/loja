"use client";

import { useEffect, useMemo, useState } from "react";

import { PainelTitleHelp } from "@/components/painel/FieldTip";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { PricingCompositionChart } from "@/components/painel/PricingCompositionChart";
import { apiPainelJson, formatBRL, formatPercent, PainelApiError } from "@/lib/painel-api";

type Recipe = {
  id: string;
  product_id: string;
  yield_quantity: string;
  estimated_material_unit_cost?: string | null;
  estimated_labor_unit_cost?: string | null;
  estimated_unit_cost: string | null;
  effective_margin_percent: string;
  suggested_unit_price: string | null;
};

type Product = { id: string; name: string };

export default function PrecificacaoPage() {
  const [rows, setRows] = useState<Recipe[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [chartRecipeId, setChartRecipeId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      apiPainelJson<Recipe[]>("/api/v2/recipes"),
      apiPainelJson<Product[]>("/api/v2/products?active_only=false"),
    ])
      .then(([recipes, products]) => {
        setRows(recipes);
        const m: Record<string, string> = {};
        for (const p of products) m[p.id] = p.name;
        setNames(m);
        setChartRecipeId((prev) => {
          if (prev) return prev;
          return recipes[0]?.id ?? null;
        });
      })
      .catch((e: unknown) => {
        setErr(e instanceof PainelApiError ? e.message : "Erro ao carregar receitas.");
      });
  }, []);

  const selectedRecipe = useMemo(
    () => rows.find((r) => r.id === chartRecipeId) ?? rows[0] ?? null,
    [rows, chartRecipeId],
  );
  const chartProductLabel = selectedRecipe ? (names[selectedRecipe.product_id] ?? "Produto") : "—";

  return (
    <>
      <PainelStickyHeading>
        <PainelTitleHelp tip="O custo unitário inclui matéria-prima (stock médio dos insumos) e mão de obra (taxa R$/h da loja × tempo da receita ÷ rendimento). A margem % incide sobre esse total. O preço sugerido é orientador — o preço de venda real define-se em Produtos / catálogo. «—» indica dado ausente ou não calculável.">
          <h1 className="text-2xl font-semibold text-slate-900">Precificação</h1>
        </PainelTitleHelp>
        <p className="mt-1 text-sm text-slate-500">
          Custo estimado (MP + MO), margem efectiva e preço sugerido — alinhe o preço de venda em{" "}
          <span className="font-medium">Produtos</span> / catálogo.
        </p>
      </PainelStickyHeading>

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
            <tr>
              <th className="px-4 py-3">Receita</th>
              <th className="px-4 py-3 text-right">Rendimento</th>
              <th className="px-4 py-3 text-right">Custo unit. (MP+MO)</th>
              <th className="px-4 py-3 text-right">Margem %</th>
              <th className="px-4 py-3 text-right">Preço sugerido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="text-slate-800">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-900">{names[r.product_id] ?? "Produto"}</span>
                  <span className="ml-2 font-mono text-[0.65rem] text-slate-400">{r.id.slice(0, 8)}…</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{r.yield_quantity}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.estimated_unit_cost != null ? formatBRL(r.estimated_unit_cost) : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPercent(r.effective_margin_percent)}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-painel-primary-strong">
                  {r.suggested_unit_price != null ? formatBRL(r.suggested_unit_price) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !err ? (
          <p className="p-6 text-sm text-slate-500">Sem receitas cadastradas. Crie em Receitas.</p>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <div className="mt-10 max-w-xl">
          <h2 className="text-sm font-semibold text-slate-800">Composição visual (mockup RF-PR)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Escolha uma receita para ver a divisão aproximada do preço sugerido entre custo e margem.
          </p>
          <div className="mt-3">
            <label className="text-xs font-medium text-slate-600" htmlFor="pc-chart-recipe">
              Receita
            </label>
            <select
              id="pc-chart-recipe"
              className="mt-1 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={chartRecipeId ?? ""}
              onChange={(e) => setChartRecipeId(e.target.value || null)}
            >
              {rows.map((r) => (
                <option key={r.id} value={r.id}>
                  {names[r.product_id] ?? r.product_id.slice(0, 8)}…
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <PricingCompositionChart row={selectedRecipe} productLabel={chartProductLabel} />
          </div>
        </div>
      ) : null}
    </>
  );
}
