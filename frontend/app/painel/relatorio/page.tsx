"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiPainelJson, formatBRL, PainelApiError } from "@/lib/painel-api";

type ProductRow = {
  product_id: string;
  product_name: string;
  orders_revenue: string;
  quantity_sold: string;
  production_input_cost: string;
  margin_amount: string;
  margin_percent: string | null;
};

type Report = {
  date_from: string;
  date_to: string;
  orders_revenue: string;
  orders_count: number;
  production_runs_count: number;
  production_input_cost: string;
  period_margin_estimate: string;
  by_product: ProductRow[];
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

function marginPctLabel(p: string | null): string {
  if (p == null || p === "") return "—";
  const n = Number.parseFloat(p);
  if (Number.isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

export default function RelatorioPage() {
  const def = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(def.from);
  const [to, setTo] = useState(def.to);
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    const q = new URLSearchParams();
    q.set("date_from", from);
    q.set("date_to", to);
    void apiPainelJson<Report>(`/api/v1/reports/financial?${q.toString()}`)
      .then(setData)
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Erro ao carregar");
        setData(null);
      });
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  function downloadCsv() {
    if (!data) return;
    const summary = [
      {
        tipo: "resumo",
        periodo_inicio: data.date_from,
        periodo_fim: data.date_to,
        receita_pedidos: data.orders_revenue,
        num_pedidos: String(data.orders_count),
        corridas_producao: String(data.production_runs_count),
        custo_insumos_producao: data.production_input_cost,
        margem_periodo_estimada: data.period_margin_estimate,
        produto_id: "",
        produto_nome: "",
        qtd_vendida: "",
        receita_produto: "",
        custo_producao_produto: "",
        margem_produto: "",
        margem_pct: "",
      },
    ];
    const detail = data.by_product.map((r) => ({
      tipo: "produto",
      periodo_inicio: data.date_from,
      periodo_fim: data.date_to,
      receita_pedidos: "",
      num_pedidos: "",
      corridas_producao: "",
      custo_insumos_producao: "",
      margem_periodo_estimada: "",
      produto_id: r.product_id,
      produto_nome: r.product_name,
      qtd_vendida: r.quantity_sold,
      receita_produto: r.orders_revenue,
      custo_producao_produto: r.production_input_cost,
      margem_produto: r.margin_amount,
      margem_pct: r.margin_percent ?? "",
    }));
    const rows = [...summary, ...detail];
    const header = Object.keys(rows[0]);
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        header
          .map((h) => {
            const v = r[h as keyof typeof r];
            const s = String(v);
            return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio-${data.date_from}-${data.date_to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Relatório financeiro</h1>
      <p className="mt-1 text-sm text-slate-500">
        Receita de pedidos (exceto rascunho e cancelados), custo de insumos em produções no período e
        repartição por produto (aproximação: receita de vendas vs custo das corridas de produção do
        mesmo artigo).
      </p>
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600" htmlFor="df">
            De
          </label>
          <input
            id="df"
            type="date"
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600" htmlFor="dt">
            Até
          </label>
          <input
            id="dt"
            type="date"
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300"
        >
          Atualizar
        </button>
      </div>
      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}
      {data ? (
        <div className="mt-8 space-y-8">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs text-slate-500">
              {data.date_from} → {data.date_to}
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-sm text-slate-500">Receita (pedidos)</dt>
                <dd className="text-xl font-semibold text-slate-900">
                  {formatBRL(data.orders_revenue)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Pedidos contados</dt>
                <dd className="text-xl font-semibold text-slate-900">{data.orders_count}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Corridas de produção</dt>
                <dd className="text-xl font-semibold text-slate-900">{data.production_runs_count}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Custo insumos (produção)</dt>
                <dd className="text-xl font-semibold text-slate-900">
                  {formatBRL(data.production_input_cost)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Margem período (estimada)</dt>
                <dd className="text-xl font-semibold text-slate-900">
                  {formatBRL(data.period_margin_estimate)}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={downloadCsv}
              className="mt-6 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Descarregar CSV
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-800">Por produto</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Custos de produção alocados ao produto acabado das corridas no período.
              </p>
            </div>
            {data.by_product.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Sem movimento neste período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
                    <tr>
                      <th className="px-4 py-2">Produto</th>
                      <th className="px-4 py-2 text-right">Qtd vendida</th>
                      <th className="px-4 py-2 text-right">Receita</th>
                      <th className="px-4 py-2 text-right">Custo produção</th>
                      <th className="px-4 py-2 text-right">Margem</th>
                      <th className="px-4 py-2 text-right">Margem %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.by_product.map((r) => (
                      <tr key={r.product_id} className="text-slate-800">
                        <td className="px-4 py-2 font-medium">{r.product_name}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.quantity_sold}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatBRL(r.orders_revenue)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatBRL(r.production_input_cost)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatBRL(r.margin_amount)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                          {marginPctLabel(r.margin_percent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500">
            API v2 (envelope DEC-06):{" "}
            <code className="rounded bg-slate-100 px-1">GET /api/v2/reports/financial</code> — mesmos
            parâmetros; resposta <code className="rounded bg-slate-100 px-1">{"{ success, data, errors }"}</code>
            .
          </p>
        </div>
      ) : !error ? (
        <p className="mt-8 text-sm text-slate-500">A carregar…</p>
      ) : null}
    </>
  );
}
