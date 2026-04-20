"use client";

import { useCallback, useEffect, useState } from "react";

import { FinancialReportCharts } from "@/components/painel/FinancialReportCharts";
import {
  apiPainelJson,
  formatBRL,
  formatPercent,
  orderStatusLabel,
  PainelApiError,
} from "@/lib/painel-api";

type Report = {
  date_from: string;
  date_to: string;
  orders_revenue: string;
  orders_count: number;
  production_input_cost: string;
  period_margin_percent: string | null;
  by_order_status: { status: string; orders_count: number; orders_revenue: string }[];
  by_category: {
    category_name: string;
    orders_revenue: string;
    quantity_sold: string;
    production_input_cost: string;
    margin_amount: string;
    margin_percent: string | null;
  }[];
};

function formatLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from: formatLocalIsoDate(from), to: formatLocalIsoDate(to) };
}

export default function FinanceiroPage() {
  const [range, setRange] = useState(defaultRange);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    const q = new URLSearchParams({ date_from: range.from, date_to: range.to });
    void apiPainelJson<Report>(`/api/v2/reports/financial?${q.toString()}`)
      .then(setReport)
      .catch((e: unknown) => {
        setReport(null);
        setError(e instanceof PainelApiError ? e.message : "Erro ao carregar relatório.");
      });
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Financeiro</h1>
      <p className="mt-1 text-sm text-slate-500">
        Visão sintética do período — mesmos dados do relatório detalhado.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
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
      </div>

      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}

      {report ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium uppercase text-slate-500">Receita (pedidos)</div>
              <div className="mt-1 text-xl font-semibold">{formatBRL(report.orders_revenue)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium uppercase text-slate-500">Pedidos</div>
              <div className="mt-1 text-xl font-semibold">{report.orders_count}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium uppercase text-slate-500">Custo insumos (produção)</div>
              <div className="mt-1 text-xl font-semibold">{formatBRL(report.production_input_cost)}</div>
            </div>
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium uppercase text-slate-500">Margem % período</div>
              <div className="mt-1 break-words text-xl font-semibold tabular-nums">
                {formatPercent(report.period_margin_percent)}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <FinancialReportCharts
              byOrderStatus={report.by_order_status}
              byCategory={report.by_category}
              labelForStatus={orderStatusLabel}
            />
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Para Pareto por produto e exportação CSV, use{" "}
            <a href="/painel/relatorio" className="font-medium text-indigo-700 underline">
              Relatórios
            </a>
            .
          </p>
        </>
      ) : !error ? (
        <p className="mt-6 text-sm text-slate-500">A carregar…</p>
      ) : null}
    </>
  );
}
