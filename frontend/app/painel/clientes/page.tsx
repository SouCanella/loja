"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { FieldTipBeside, PainelTitleHelp } from "@/components/painel/FieldTip";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";
import { painelBtnPrimaryClass } from "@/lib/painel-button-classes";

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

type VitrineCustomer = {
  id: string;
  email: string;
  created_at: string;
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
  const [vitrineCustomers, setVitrineCustomers] = useState<VitrineCustomer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vitrineError, setVitrineError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [vitrineMsg, setVitrineMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadVitrineCustomers = useCallback(() => {
    setVitrineError(null);
    void apiPainelJson<VitrineCustomer[]>("/api/v2/customers")
      .then(setVitrineCustomers)
      .catch((e: unknown) => {
        setVitrineCustomers([]);
        setVitrineError(
          e instanceof PainelApiError ? e.message : "Não foi possível carregar as contas na vitrine.",
        );
      });
  }, []);

  useEffect(() => {
    void apiPainelJson<OrderRow[]>("/api/v2/orders")
      .then(setRows)
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Não foi possível carregar os pedidos.");
      });
    void loadVitrineCustomers();
  }, [loadVitrineCustomers]);

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

  async function onCreateVitrineCustomer(e: FormEvent) {
    e.preventDefault();
    setVitrineMsg(null);
    const em = newEmail.trim();
    if (!em) {
      setVitrineMsg("Indique o e-mail.");
      return;
    }
    if (newPassword.length < 8) {
      setVitrineMsg("A palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== newPassword2) {
      setVitrineMsg("As palavras-passe não coincidem.");
      return;
    }
    setCreating(true);
    try {
      await apiPainelJson<VitrineCustomer>("/api/v2/customers", {
        method: "POST",
        body: JSON.stringify({ email: em, password: newPassword }),
      });
      setNewEmail("");
      setNewPassword("");
      setNewPassword2("");
      setVitrineMsg("Conta criada. O cliente pode iniciar sessão na vitrine com este e-mail.");
      void loadVitrineCustomers();
    } catch (err: unknown) {
      setVitrineMsg(err instanceof PainelApiError ? err.message : "Não foi possível criar a conta.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <PainelStickyHeading>
        <PainelTitleHelp tip="Contactos agrupados a partir dos pedidos (telefone, nome ou conta na vitrine). Pode também criar contas de login na vitrine (e-mail + palavra-passe) para o cliente aceder à loja com sessão.">
          <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
        </PainelTitleHelp>
      </PainelStickyHeading>
      <form
        onSubmit={(e) => void onCreateVitrineCustomer(e)}
        className="mt-6 max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-slate-800">
          <FieldTipBeside tip="Conta de login na vitrine: o cliente usa este e-mail e palavra-passe na loja pública (área de cliente).">
            Nova conta na vitrine
          </FieldTipBeside>
        </h2>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="vc-email">
              E-mail
            </label>
            <input
              id="vc-email"
              type="email"
              autoComplete="off"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="cliente@exemplo.com"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="vc-pw">
                Palavra-passe
              </label>
              <input
                id="vc-pw"
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="vc-pw2">
                Confirmar
              </label>
              <input
                id="vc-pw2"
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
              />
            </div>
          </div>
        </div>
        {vitrineMsg ? (
          <p
            className={`mt-3 text-sm ${vitrineMsg.includes("Não") || vitrineMsg.includes("não") || vitrineMsg.includes("Indique") || vitrineMsg.includes("coincidem") || vitrineMsg.includes("pelo menos") ? "text-red-700" : "text-emerald-800"}`}
          >
            {vitrineMsg}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={creating}
          className={`mt-4 ${painelBtnPrimaryClass} disabled:opacity-60`}
        >
          {creating ? "A criar…" : "Criar cliente"}
        </button>
      </form>

      {vitrineError ? <p className="mt-4 text-sm text-amber-800">{vitrineError}</p> : null}

      {vitrineCustomers && vitrineCustomers.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <caption className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-left text-xs font-semibold text-slate-700">
              Contas na vitrine
            </caption>
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
              <tr>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2 text-right">Registado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vitrineCustomers.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{c.email}</td>
                  <td className="px-4 py-2 text-right text-xs text-slate-600 tabular-nums">
                    {new Date(c.created_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : vitrineCustomers && vitrineCustomers.length === 0 && !vitrineError ? (
        <p className="mt-4 text-sm text-slate-500">Ainda não há contas de vitrine criadas pelo painel.</p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/painel/pedidos"
          className={`inline-flex items-center justify-center ${painelBtnPrimaryClass}`}
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
          <h2 className="text-sm font-semibold text-slate-800">Por pedidos</h2>
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
