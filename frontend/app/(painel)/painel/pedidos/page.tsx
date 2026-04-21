"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import {
  apiPainelJson,
  ORDER_STATUS_VALUES,
  orderStatusLabel,
  PainelApiError,
} from "@/lib/painel-api";
import { painelBtnPrimaryClass } from "@/lib/painel-button-classes";
import {
  painelFilterBarClass,
  painelFilterFieldColClass,
  painelFilterLabelClass,
  painelFilterSelectClass,
} from "@/lib/painel-filter-classes";

type OrderRow = {
  id: string;
  status: string;
  customer_note: string | null;
  source: string | null;
  stock_committed: boolean;
  created_at: string;
  contact_name: string | null;
  contact_phone: string | null;
};

export default function PainelPedidosPage() {
  const [rows, setRows] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "vitrine" | "painel">("all");

  useEffect(() => {
    void apiPainelJson<OrderRow[]>("/api/v2/orders")
      .then(setRows)
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Não foi possível carregar os pedidos.");
      });
  }, []);

  const bySource = useMemo(() => {
    if (!rows) return null;
    if (sourceFilter === "all") return rows;
    if (sourceFilter === "vitrine") return rows.filter((o) => o.source === "vitrine");
    return rows.filter((o) => o.source !== "vitrine");
  }, [rows, sourceFilter]);

  const filtered = useMemo(() => {
    if (!bySource) return null;
    if (filter === "all") return bySource;
    return bySource.filter((o) => o.status === filter);
  }, [bySource, filter]);

  return (
    <>
      <PainelStickyHeading>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Pedidos</h1>
            <p className="mt-1 text-sm text-slate-500">
              Mais recentes primeiro. Filtre por origem (vitrine vs painel) e por estado; abra um pedido
              para ver itens e alterar o estado.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/painel/pedidos/novo"
              className={`inline-flex items-center justify-center ${painelBtnPrimaryClass}`}
            >
              Novo pedido
            </Link>
            <Link
              href="/painel"
              className="text-sm font-medium text-painel-primary hover:text-painel-primary-strong"
            >
              ← Painel
            </Link>
          </div>
        </div>
      </PainelStickyHeading>

      {rows && rows.length > 0 && bySource ? (
        <div className={painelFilterBarClass}>
          <div className={painelFilterFieldColClass}>
            <label htmlFor="filtro-origem" className={painelFilterLabelClass}>
              Origem
            </label>
            <select
              id="filtro-origem"
              className={painelFilterSelectClass}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as "all" | "vitrine" | "painel")}
            >
              <option value="all">Todas ({rows.length})</option>
              <option value="vitrine">
                Vitrine ({rows.filter((o) => o.source === "vitrine").length})
              </option>
              <option value="painel">
                Painel ({rows.filter((o) => o.source !== "vitrine").length})
              </option>
            </select>
          </div>
          <div className={painelFilterFieldColClass}>
            <label htmlFor="filtro-estado" className={painelFilterLabelClass}>
              Estado
            </label>
            <select
              id="filtro-estado"
              className={painelFilterSelectClass}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Todos ({bySource.length})</option>
              {ORDER_STATUS_VALUES.map((s) => {
                const n = bySource.filter((o) => o.status === s).length;
                return (
                  <option key={s} value={s}>
                    {orderStatusLabel(s)} ({n})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}

      {rows === null && !error ? (
        <p className="mt-8 text-sm text-slate-500">A carregar…</p>
      ) : null}

      {rows && rows.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">Ainda não há pedidos nesta loja.</p>
      ) : null}

      {filtered && filtered.length === 0 && rows && rows.length > 0 ? (
        <p className="mt-6 text-sm text-slate-600">Nenhum pedido com estes filtros.</p>
      ) : null}

      {filtered && filtered.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
          {filtered.map((o) => (
            <li key={o.id}>
              <Link
                href={`/painel/pedidos/${o.id}`}
                className="flex flex-col gap-1 px-4 py-3 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-mono text-xs text-slate-500">
                    {o.id.slice(0, 8)}…
                  </span>
                  <p className="text-sm font-medium text-slate-900">
                    {orderStatusLabel(o.status)}
                    {o.source === "vitrine" ? (
                      <span className="ml-2 rounded bg-painel-secondary px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-painel-on-secondary">
                        Vitrine
                      </span>
                    ) : null}
                  </p>
                  {o.contact_name?.trim() || o.contact_phone?.trim() ? (
                    <p className="mt-0.5 text-xs text-slate-700">
                      {[o.contact_name?.trim(), o.contact_phone?.trim()].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {o.customer_note ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{o.customer_note}</p>
                  ) : null}
                </div>
                <div className="text-right text-xs text-slate-500">
                  {new Date(o.created_at).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                  {o.stock_committed ? (
                    <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">
                      Stock
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
