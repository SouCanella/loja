"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  apiPainelJson,
  orderStatusLabel,
  PainelApiError,
} from "@/lib/painel-api";

type OrderRow = {
  id: string;
  status: string;
  customer_note: string | null;
  stock_committed: boolean;
  created_at: string;
};

export default function PainelPedidosPage() {
  const [rows, setRows] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiPainelJson<OrderRow[]>("/api/v1/orders")
      .then(setRows)
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Não foi possível carregar os pedidos.");
      });
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pedidos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mais recentes primeiro. Abra um pedido para ver itens e alterar o estado.
          </p>
        </div>
        <Link
          href="/painel"
          className="text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          ← Painel
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}

      {rows === null && !error ? (
        <p className="mt-8 text-sm text-slate-500">A carregar…</p>
      ) : null}

      {rows && rows.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">Ainda não há pedidos nesta loja.</p>
      ) : null}

      {rows && rows.length > 0 ? (
        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
          {rows.map((o) => (
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
                  </p>
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
