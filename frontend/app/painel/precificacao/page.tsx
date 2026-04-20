"use client";

import { useEffect, useState } from "react";

import { FieldTip } from "@/components/painel/FieldTip";
import { apiPainelJson, formatBRL, formatPercent, PainelApiError } from "@/lib/painel-api";

type Recipe = {
  id: string;
  product_id: string;
  yield_quantity: string;
  estimated_unit_cost: string | null;
  effective_margin_percent: string;
  suggested_unit_price: string | null;
};

type Product = { id: string; name: string };

export default function PrecificacaoPage() {
  const [rows, setRows] = useState<Recipe[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
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
      })
      .catch((e: unknown) => {
        setErr(e instanceof PainelApiError ? e.message : "Erro ao carregar receitas.");
      });
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Precificação</h1>
        <FieldTip text="Custo unitário estimado usa insumos e rendimento da receita. A margem % reflecte a configuração efectiva do produto/receita. O preço sugerido é orientador — o preço de venda real define-se em Produtos / catálogo. «—» indica dado ausente ou não calculável." />
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Custo estimado por insumos, margem efectiva e preço sugerido — alinhe o preço de venda em{" "}
        <span className="font-medium">Produtos</span> / catálogo.
      </p>

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
            <tr>
              <th className="px-4 py-3">Receita</th>
              <th className="px-4 py-3 text-right">Rendimento</th>
              <th className="px-4 py-3 text-right">Custo unit. estimado</th>
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
    </>
  );
}
