"use client";

import { useEffect, useMemo, useState } from "react";

import { PainelPaginationBar } from "@/components/painel/PainelPaginationBar";
import { PainelTitleHelp } from "@/components/painel/FieldTip";
import { PainelDateRangeFields } from "@/components/painel/PainelDateRangeFields";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";
import { slicePage, usePainelPagination } from "@/lib/painel-pagination";

type Summary = {
  date_from: string;
  date_to: string;
  distinct_sessions: number;
  events_by_type: Record<string, number>;
  top_products_by_view: { product_id: string; name: string; views: number }[];
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function PainelAnalyticsVitrinePage() {
  const defaultTo = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(() => {
    const x = new Date(defaultTo);
    x.setDate(x.getDate() - 29);
    return x;
  }, [defaultTo]);

  const [from, setFrom] = useState(() => isoDate(defaultFrom));
  const [to, setTo] = useState(() => isoDate(defaultTo));
  const [data, setData] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setErr(null);
    setLoading(true);
    void apiPainelJson<Summary>(
      `/api/v2/analytics/vitrine/summary?date_from=${encodeURIComponent(from)}&date_to=${encodeURIComponent(to)}`,
    )
      .then(setData)
      .catch((e: unknown) =>
        setErr(e instanceof PainelApiError ? e.message : "Não foi possível carregar analytics."),
      )
      .finally(() => setLoading(false));
  }, [from, to]);

  const topProducts = data?.top_products_by_view ?? [];
  const topProductsPagination = usePainelPagination(topProducts.length, {
    resetKey: `${from}:${to}`,
  });
  const pagedTopProducts = useMemo(
    () => slicePage(topProducts, topProductsPagination.page, topProductsPagination.pageSize),
    [topProducts, topProductsPagination.page, topProductsPagination.pageSize],
  );

  return (
    <>
      <PainelStickyHeading>
        <PainelTitleHelp tip="Estatísticas anónimas da vitrine: páginas vistas, visualizações de produto e adições ao carrinho. «Sessões» estima visitantes distintos por identificador no navegador (não substitui analytics externo).">
          <h1 className="text-2xl font-semibold text-slate-900">Analytics da vitrine</h1>
        </PainelTitleHelp>

        <PainelDateRangeFields
          boxed
          idFrom="af"
          idTo="at"
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
        />
      </PainelStickyHeading>

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}
      {loading ? <p className="mt-6 text-sm text-slate-500">A carregar…</p> : null}

      {data && !loading ? (
        <div className="mt-8 space-y-8">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Resumo</h2>
            <p className="mt-1 text-xs text-slate-500">
              Período: {data.date_from} a {data.date_to} (UTC)
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-800">
              Sessões distintas:{" "}
              <span className="tabular-nums text-painel-primary-strong">{data.distinct_sessions}</span>
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {Object.entries(data.events_by_type).map(([k, v]) => (
                <li
                  key={k}
                  className="flex justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-slate-600">{k}</span>
                  <span className="font-semibold tabular-nums text-slate-900">{v}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
              Produtos mais vistos (página de produto)
            </h2>
            {data.top_products_by_view.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">Sem dados neste período.</p>
            ) : (
              <div className="overflow-hidden">
                <ul className="divide-y divide-slate-100">
                  {pagedTopProducts.map((row) => (
                    <li key={row.product_id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="font-medium text-slate-900">{row.name}</span>
                      <span className="tabular-nums text-slate-600">{row.views} vistas</span>
                    </li>
                  ))}
                </ul>
                <PainelPaginationBar
                  page={topProductsPagination.page}
                  pageCount={topProductsPagination.pageCount}
                  totalItems={topProducts.length}
                  pageSize={topProductsPagination.pageSize}
                  onPageChange={topProductsPagination.setPage}
                />
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
