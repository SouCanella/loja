"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiPainelJson, formatBRL, PainelApiError } from "@/lib/painel-api";

type Report = {
  date_from: string;
  date_to: string;
  orders_revenue: string;
  orders_count: number;
  production_runs_count: number;
  production_input_cost: string;
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
    const rows = [
      {
        periodo_inicio: data.date_from,
        periodo_fim: data.date_to,
        receita_pedidos: data.orders_revenue,
        num_pedidos: String(data.orders_count),
        corridas_producao: String(data.production_runs_count),
        custo_insumos_producao: data.production_input_cost,
      },
    ];
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
        Receita de pedidos (exceto rascunho e cancelados) e custo de insumos em produções no período.
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
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs text-slate-500">
            {data.date_from} → {data.date_to}
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
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
          </dl>
          <button
            type="button"
            onClick={downloadCsv}
            className="mt-6 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Descarregar CSV
          </button>
        </div>
      ) : !error ? (
        <p className="mt-8 text-sm text-slate-500">A carregar…</p>
      ) : null}
    </>
  );
}
