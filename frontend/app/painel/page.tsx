"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { OrdersByStatusChart, RevenueTrendChart } from "@/components/painel/DashboardCharts";
import { PainelDateRangeFields } from "@/components/painel/PainelDateRangeFields";
import { PanelCard } from "@/components/painel/PanelCard";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, formatBRL, orderStatusLabel, PainelApiError } from "@/lib/painel-api";
import { painelBtnSecondaryClass } from "@/lib/painel-button-classes";

type DashboardData = {
  date_from: string;
  date_to: string;
  aggregation_note: string;
  kpis: {
    orders_today: number;
    orders_in_period: number;
    ticket_avg: string | null;
    out_of_stock_items_count: number;
    new_customers_in_period: number | null;
  };
  revenue_by_day: { date: string; revenue: string }[];
  revenue_moving_avg_7d: { date: string; revenue: string }[];
  orders_by_status: { status: string; count: number }[];
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

export default function PainelDashboardPage() {
  const [range, setRange] = useState(defaultRange);
  const [data, setData] = useState<DashboardData | null>(null);
  const [meSlug, setMeSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiPainelJson<{ store_slug: string }>("/api/v2/me")
      .then((m) => setMeSlug(m.store_slug))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setError(null);
    const q = new URLSearchParams({ date_from: range.from, date_to: range.to });
    void apiPainelJson<DashboardData>(`/api/v2/dashboard/summary?${q.toString()}`)
      .then(setData)
      .catch((e: unknown) => {
        setData(null);
        setError(e instanceof PainelApiError ? e.message : "Erro ao carregar dashboard.");
      });
  }, [range.from, range.to]);

  const ticket = useMemo(() => {
    if (!data?.kpis.ticket_avg) return "—";
    return formatBRL(data.kpis.ticket_avg);
  }, [data]);

  return (
    <>
      <PainelStickyHeading>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              Indicadores e tendência de receita — período seleccionável (UTC, alinhado ao relatório).
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <PainelDateRangeFields
              bare
              idFrom="dash-from"
              idTo="dash-to"
              from={range.from}
              to={range.to}
              onFromChange={(v) => setRange((r) => ({ ...r, from: v }))}
              onToChange={(v) => setRange((r) => ({ ...r, to: v }))}
            />
          </div>
        </div>
      </PainelStickyHeading>

      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}

      {data ? (
        <>
          <p className="mt-6 mb-4 text-xs text-slate-400 md:mt-0">{data.aggregation_note}</p>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Pedidos hoje (UTC)" value={String(data.kpis.orders_today)} />
            <KpiCard label="Pedidos no período" value={String(data.kpis.orders_in_period)} />
            <KpiCard label="Ticket médio" value={ticket} />
            <KpiCard label="Insumos em ruptura" value={String(data.kpis.out_of_stock_items_count)} />
          </div>

          <PanelCard className="mb-8">
            <h2 className="text-sm font-semibold text-slate-800">Receita por dia + média móvel 7 dias</h2>
            <RevenueTrendChart revenueByDay={data.revenue_by_day} movingAvg={data.revenue_moving_avg_7d} />
          </PanelCard>

          <PanelCard className="mb-8">
            <h2 className="text-sm font-semibold text-slate-800">Pedidos por estado (período)</h2>
            <OrdersByStatusChart rows={data.orders_by_status} labelForStatus={orderStatusLabel} />
          </PanelCard>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/painel/pedidos"
              className={`inline-flex items-center justify-center ${painelBtnSecondaryClass}`}
            >
              Pedidos
            </Link>
            <Link
              href="/painel/catalogo"
              className={`inline-flex items-center justify-center ${painelBtnSecondaryClass}`}
            >
              Catálogo
            </Link>
            {meSlug ? (
              <Link
                href={`/loja/${meSlug}`}
                className="rounded-lg border border-painel-border bg-painel-soft px-4 py-2 text-sm font-medium text-painel-primary-strong hover:bg-painel-soft-hover"
              >
                Ver vitrine
              </Link>
            ) : null}
          </div>
        </>
      ) : !error ? (
        <p className="mt-6 text-sm text-slate-500 md:mt-4">A carregar…</p>
      ) : null}
    </>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <PanelCard>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
    </PanelCard>
  );
}
