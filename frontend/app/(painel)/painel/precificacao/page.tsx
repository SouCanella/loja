"use client";

import { useEffect, useMemo, useState } from "react";

import { PainelTitleHelp } from "@/components/painel/FieldTip";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { PricingCompositionChart } from "@/components/painel/PricingCompositionChart";
import { apiPainelJson, formatBRL, formatPercent, PainelApiError } from "@/lib/painel-api";
import {
  painelTableCellClass,
  painelTableClass,
  painelTableTbodyClass,
  painelTableTheadClass,
  painelTableWrapClass,
} from "@/lib/painel-table-classes";
import {
  painelFilterBarClass,
  painelFilterFieldColClass,
  painelFilterLabelClass,
  painelFilterSearchInputClass,
  painelFilterSelectClass,
} from "@/lib/painel-filter-classes";
import { painelPageContentWidthClass } from "@/lib/painel-layout-classes";

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
  const [filterQuery, setFilterQuery] = useState("");

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

  const filteredRows = useMemo(() => {
    const t = filterQuery.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => {
      const pn = (names[r.product_id] ?? "").toLowerCase();
      return (
        pn.includes(t) ||
        r.product_id.toLowerCase().includes(t) ||
        r.id.toLowerCase().includes(t)
      );
    });
  }, [rows, names, filterQuery]);

  useEffect(() => {
    if (filteredRows.length === 0) return;
    setChartRecipeId((prev) => {
      if (prev && filteredRows.some((r) => r.id === prev)) return prev;
      return filteredRows[0].id;
    });
  }, [filteredRows]);

  const selectedRecipe = useMemo(
    () =>
      (chartRecipeId ? filteredRows.find((r) => r.id === chartRecipeId) : null) ??
      filteredRows[0] ??
      null,
    [filteredRows, chartRecipeId],
  );
  const chartProductLabel = selectedRecipe ? (names[selectedRecipe.product_id] ?? "Produto") : "—";

  return (
    <>
      <PainelStickyHeading>
        <PainelTitleHelp tip="Por receita: custo estimado (matéria-prima e mão de obra), margem efectiva e preço sugerido. O custo unitário usa o custo médio dos insumos e a mão de obra (taxa horária × tempo da receita ÷ rendimento). O preço de venda real define-se em Produtos / catálogo. «—» significa dado em falta ou não calculável.">
          <h1 className="text-2xl font-semibold text-slate-900">Precificação</h1>
        </PainelTitleHelp>
      </PainelStickyHeading>

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}

      <div className={painelFilterBarClass}>
        <div className={`min-w-0 flex-1 sm:max-w-md ${painelFilterFieldColClass}`}>
          <label className={painelFilterLabelClass} htmlFor="precificacao-search">
            Pesquisar receita / produto
          </label>
          <input
            id="precificacao-search"
            type="search"
            autoComplete="off"
            placeholder="Nome do produto…"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className={painelFilterSearchInputClass}
          />
        </div>
      </div>

      <div className={`mt-8 ${painelTableWrapClass}`}>
        <table className={painelTableClass}>
          <thead className={painelTableTheadClass}>
            <tr>
              <th className={painelTableCellClass}>Receita</th>
              <th className={`${painelTableCellClass} text-right`}>Rendimento</th>
              <th className={`${painelTableCellClass} text-right`}>Custo unit. (MP+MO)</th>
              <th className={`${painelTableCellClass} text-right`}>Margem %</th>
              <th className={`${painelTableCellClass} text-right`}>Preço sugerido</th>
            </tr>
          </thead>
          <tbody className={painelTableTbodyClass}>
            {rows.length > 0 && filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className={`${painelTableCellClass} py-8 text-center text-slate-500`}>
                  Nenhuma receita corresponde à pesquisa.
                </td>
              </tr>
            ) : null}
            {filteredRows.map((r) => (
              <tr key={r.id} className="text-slate-800">
                <td className={painelTableCellClass}>
                  <span className="font-medium text-slate-900">{names[r.product_id] ?? "Produto"}</span>
                  <span className="ml-2 font-mono text-[0.65rem] text-slate-400">{r.id.slice(0, 8)}…</span>
                </td>
                <td className={`${painelTableCellClass} text-right tabular-nums`}>{r.yield_quantity}</td>
                <td className={`${painelTableCellClass} text-right tabular-nums`}>
                  {r.estimated_unit_cost != null ? formatBRL(r.estimated_unit_cost) : "—"}
                </td>
                <td className={`${painelTableCellClass} text-right tabular-nums`}>
                  {formatPercent(r.effective_margin_percent)}
                </td>
                <td
                  className={`${painelTableCellClass} text-right font-semibold tabular-nums text-painel-primary-strong`}
                >
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

      {filteredRows.length > 0 ? (
        <div className={`mt-10 ${painelPageContentWidthClass}`}>
          <PainelTitleHelp tip="Seleccione uma receita para ver como o preço sugerido se reparte entre custos e margem.">
            <h2 className="text-sm font-semibold text-slate-800">Composição visual (mockup RF-PR)</h2>
          </PainelTitleHelp>
          <div className="mt-3">
            <label className={painelFilterLabelClass} htmlFor="pc-chart-recipe">
              Receita
            </label>
            <select
              id="pc-chart-recipe"
              className={`mt-1 ${painelFilterSelectClass} max-w-md`}
              value={chartRecipeId ?? ""}
              onChange={(e) => setChartRecipeId(e.target.value || null)}
            >
              {filteredRows.map((r) => (
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
