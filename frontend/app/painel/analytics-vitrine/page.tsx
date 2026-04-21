"use client";

import { useEffect, useMemo, useState } from "react";

import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";
import {
  painelFilterBarBoxClass,
  painelFilterDateInputClass,
  painelFilterLabelCompactClass,
} from "@/lib/painel-filter-classes";

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

  return (
    <>
      <PainelStickyHeading>
        <h1 className="text-2xl font-semibold text-slate-900">Analytics da vitrine</h1>
        <p className="mt-1 text-sm text-slate-500">
          Eventos enviados pela loja pública (páginas vistas, produtos vistos, adicionar ao carrinho). Sessões são
          estimadas por identificador anónimo no navegador.
        </p>

        <div className={painelFilterBarBoxClass}>
          <div>
            <label className={painelFilterLabelCompactClass} htmlFor="af">
              De
            </label>
            <input
              id="af"
              type="date"
              className={painelFilterDateInputClass}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className={painelFilterLabelCompactClass} htmlFor="at">
              Até
            </label>
            <input
              id="at"
              type="date"
              className={painelFilterDateInputClass}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
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
              <ul className="divide-y divide-slate-100">
                {data.top_products_by_view.map((row) => (
                  <li key={row.product_id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="font-medium text-slate-900">{row.name}</span>
                    <span className="tabular-nums text-slate-600">{row.views} vistas</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
