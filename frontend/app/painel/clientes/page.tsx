"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { FieldTip } from "@/components/painel/FieldTip";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";

type OrderRow = {
  id: string;
  status: string;
  customer_note: string | null;
  source: string | null;
  stock_committed: boolean;
  created_at: string;
  contact_name: string | null;
  contact_phone: string | null;
  customer_id: string | null;
};

/** Agrupa pedidos pelo mesmo contacto (telefone normalizado, senão nome, senão conta vitrine, senão pedido isolado). */
function groupKey(o: OrderRow): string {
  const digits = (o.contact_phone ?? "").replace(/\D/g, "");
  if (digits.length >= 3) return `phone:${digits}`;
  const name = o.contact_name?.trim().toLowerCase();
  if (name) return `name:${name}`;
  if (o.customer_id) return `customer:${o.customer_id}`;
  return `order:${o.id}`;
}

function sortOrdersDesc(orders: OrderRow[]): OrderRow[] {
  return [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function pickDisplayOrder(orders: OrderRow[]): OrderRow {
  const s = sortOrdersDesc(orders);
  return (
    s.find((o) => o.contact_name?.trim() && o.contact_phone?.trim()) ??
    s.find((o) => o.contact_name?.trim()) ??
    s.find((o) => o.contact_phone?.trim()) ??
    s[0]
  );
}

function contactLabel(orders: OrderRow[]): { title: string; subtitle: string | null } {
  const o = pickDisplayOrder(orders);
  const name = o.contact_name?.trim() || null;
  const phone = o.contact_phone?.trim() || null;
  if (name && phone) return { title: name, subtitle: phone };
  if (name) return { title: name, subtitle: null };
  if (phone) return { title: phone, subtitle: null };
  if (o.customer_id) return { title: "Conta na vitrine", subtitle: `ID ${o.customer_id.slice(0, 8)}…` };
  return {
    title: "Sem nome nem telefone",
    subtitle: orders.length === 1 ? `Pedido ${o.id.slice(0, 8)}…` : `${orders.length} pedidos sem contacto`,
  };
}

type ContactGroup = {
  key: string;
  orders: OrderRow[];
  label: { title: string; subtitle: string | null };
};

/** Pesquisa por texto (nome, rótulos) ou por sequência de dígitos do telefone. */
function groupMatchesFilter(group: ContactGroup, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;

  const qDigits = raw.replace(/\D/g, "");
  const labelText = `${group.label.title} ${group.label.subtitle ?? ""}`.toLowerCase();
  if (labelText.includes(q)) return true;

  for (const o of group.orders) {
    const name = (o.contact_name ?? "").trim().toLowerCase();
    if (name.includes(q)) return true;
    const phoneDigits = (o.contact_phone ?? "").replace(/\D/g, "");
    if (qDigits.length >= 2 && phoneDigits.includes(qDigits)) return true;
  }

  return false;
}

export default function ClientesPage() {
  const [rows, setRows] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");

  useEffect(() => {
    void apiPainelJson<OrderRow[]>("/api/v2/orders")
      .then(setRows)
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Não foi possível carregar os pedidos.");
      });
  }, []);

  const groups = useMemo(() => {
    if (!rows?.length) return [];
    const map = new Map<string, OrderRow[]>();
    for (const o of rows) {
      const k = groupKey(o);
      const cur = map.get(k);
      if (cur) cur.push(o);
      else map.set(k, [o]);
    }
    const list = Array.from(map.entries()).map(([key, orders]) => ({
      key,
      orders: sortOrdersDesc(orders),
      label: contactLabel(orders),
    }));
    list.sort(
      (a, b) =>
        new Date(a.orders[0].created_at).getTime() - new Date(b.orders[0].created_at).getTime(),
    );
    return list.reverse();
  }, [rows]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => groupMatchesFilter(g, filterQuery));
  }, [groups, filterQuery]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
        <FieldTip text="Não existe cadastro de cliente à parte: o contacto vem dos pedidos. Agrupamos por telefone (normalizado) ou, na falta de telefone, por nome igual; pedidos só com conta vitrine agrupam por conta; sem dados ficam um por linha. Para detalhes e notas, abra o pedido." />
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
        Vista agregada por contacto a partir dos pedidos. Use a lista abaixo para ver quantas encomendas
        e o último movimento; abra um pedido para ver itens, estado e notas.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/painel/pedidos"
          className="inline-flex rounded-lg bg-painel-cta px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-painel-cta-hover"
        >
          Lista completa de pedidos
        </Link>
      </div>

      {error ? <p className="mt-6 text-sm text-amber-800">{error}</p> : null}

      {rows === null && !error ? (
        <p className="mt-8 text-sm text-slate-500">A carregar…</p>
      ) : null}

      {rows && rows.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">Ainda não há pedidos nesta loja.</p>
      ) : null}

      {groups.length > 0 ? (
        <div className="mt-8 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="max-w-md flex-1">
              <label className="block text-xs font-medium text-slate-600" htmlFor="clientes-filter">
                Filtrar por nome ou telefone
              </label>
              <input
                id="clientes-filter"
                type="search"
                autoComplete="off"
                placeholder="Ex.: Maria, 11999…"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-painel-primary focus:outline-none focus:ring-1 focus:ring-painel-primary"
              />
            </div>
            <p className="text-xs text-slate-500">
              {filteredGroups.length === groups.length
                ? `${groups.length} contacto${groups.length === 1 ? "" : "s"}`
                : `${filteredGroups.length} de ${groups.length} contactos`}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
              <tr>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3 text-right">Pedidos</th>
                <th className="px-4 py-3 text-right">Último pedido</th>
                <th className="px-4 py-3 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGroups.map(({ key, orders, label }) => {
                const latest = orders[0];
                const n = orders.length;
                return (
                  <tr key={key} className="text-slate-800">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{label.title}</div>
                      {label.subtitle ? (
                        <div className="mt-0.5 text-xs text-slate-500">{label.subtitle}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{n}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {new Date(latest.created_at).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/painel/pedidos/${latest.id}`}
                        className="font-medium text-painel-primary hover:text-painel-primary-strong"
                      >
                        Abrir último
                      </Link>
                      {n > 1 ? (
                        <details className="mt-2 text-left">
                          <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-900">
                            Ver os {n} pedidos
                          </summary>
                          <ul className="mt-2 space-y-1 pl-1 text-xs">
                            {orders.map((o) => (
                              <li key={o.id}>
                                <Link
                                  href={`/painel/pedidos/${o.id}`}
                                  className="font-mono text-painel-primary hover:underline"
                                >
                                  {o.id.slice(0, 8)}…
                                </Link>
                                <span className="ml-2 text-slate-500">
                                  {new Date(o.created_at).toLocaleString("pt-BR", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filterQuery.trim() && filteredGroups.length === 0 ? (
            <p className="border-t border-slate-100 px-4 py-6 text-center text-sm text-slate-600">
              Nenhum contacto corresponde a «{filterQuery.trim()}».{" "}
              <button
                type="button"
                className="font-medium text-painel-primary hover:underline"
                onClick={() => setFilterQuery("")}
              >
                Limpar filtro
              </button>
            </p>
          ) : null}
        </div>
        </div>
      ) : null}
    </>
  );
}
