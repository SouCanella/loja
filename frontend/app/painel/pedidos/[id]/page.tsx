"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  apiPainelJson,
  formatBRL,
  ORDER_STATUS_VALUES,
  orderStatusLabel,
  PainelApiError,
} from "@/lib/painel-api";

type OrderDetail = {
  id: string;
  status: string;
  customer_note: string | null;
  stock_committed: boolean;
  created_at: string;
  items: {
    id: string;
    product_id: string;
    quantity: string;
    unit_price: string;
  }[];
};

type ProductRow = {
  id: string;
  name: string;
};

export default function PainelPedidoDetalhePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setError(null);
    void Promise.all([
      apiPainelJson<OrderDetail>(`/api/v1/orders/${id}`),
      apiPainelJson<ProductRow[]>("/api/v1/products"),
    ])
      .then(([o, plist]) => {
        setOrder(o);
        setProducts(plist);
        setPendingStatus(o.status);
      })
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Erro ao carregar o pedido.");
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const nameByProductId = useMemo(() => {
    const m = new Map<string, string>();
    if (products) {
      for (const p of products) {
        m.set(p.id, p.name);
      }
    }
    return m;
  }, [products]);

  const lineTotal = (q: string, price: string) => {
    const n = Number.parseFloat(q) * Number.parseFloat(price);
    if (Number.isNaN(n)) return 0;
    return n;
  };

  const orderTotal = useMemo(() => {
    if (!order) return 0;
    return order.items.reduce((acc, it) => acc + lineTotal(it.quantity, it.unit_price), 0);
  }, [order]);

  async function applyStatus(next: string) {
    if (!order || next === order.status) return;
    if (next === "cancelado") {
      const ok = window.confirm(
        "Marcar este pedido como cancelado? O stock será libertado se já estiver confirmado.",
      );
      if (!ok) {
        setPendingStatus(order.status);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await apiPainelJson<OrderDetail>(`/api/v1/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setOrder(updated);
      setPendingStatus(updated.status);
    } catch (e: unknown) {
      setError(e instanceof PainelApiError ? e.message : "Não foi possível actualizar o estado.");
      setPendingStatus(order.status);
    } finally {
      setSaving(false);
    }
  }

  if (!id) {
    return <p className="text-sm text-amber-800">Identificador inválido.</p>;
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pedido</h1>
          <p className="mt-1 font-mono text-xs text-slate-500">{id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/painel/pedidos"
            className="text-sm font-medium text-teal-700 hover:text-teal-800"
          >
            ← Lista
          </Link>
          <button
            type="button"
            onClick={() => load()}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Recarregar
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}

      {!order && !error ? <p className="mt-8 text-sm text-slate-500">A carregar…</p> : null}

      {order ? (
        <div className="mt-6 space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Estado</h2>
            <p className="mt-1 text-xs text-slate-500">
              Criado em{" "}
              {new Date(order.created_at).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
              {order.stock_committed ? (
                <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">
                  Stock reservado / baixado
                </span>
              ) : null}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor="status" className="text-sm text-slate-600">
                Alterar para
              </label>
              <select
                id="status"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                value={pendingStatus ?? order.status}
                disabled={saving}
                onChange={(e) => {
                  const v = e.target.value;
                  setPendingStatus(v);
                  void applyStatus(v);
                }}
              >
                {ORDER_STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusLabel(s)}
                  </option>
                ))}
              </select>
              {saving ? <span className="text-xs text-slate-500">A guardar…</span> : null}
            </div>
            {order.customer_note ? (
              <p className="mt-4 text-sm text-slate-700">
                <span className="font-medium text-slate-900">Nota do cliente: </span>
                {order.customer_note}
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
              Itens
            </h2>
            <ul className="divide-y divide-slate-100">
              {order.items.map((it) => (
                <li key={it.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {nameByProductId.get(it.product_id) ?? `Produto ${it.product_id.slice(0, 8)}…`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {Number.parseFloat(it.quantity)} × {formatBRL(it.unit_price)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {formatBRL(lineTotal(it.quantity, it.unit_price))}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex justify-end border-t border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Total {formatBRL(orderTotal)}</p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
