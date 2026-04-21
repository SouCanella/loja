"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ClientesOrdersByContactSection } from "@/components/painel/clientes/ClientesOrdersByContactSection";
import { ClientesVitrineAccountForm } from "@/components/painel/clientes/ClientesVitrineAccountForm";
import { ClientesVitrineAccountsTable } from "@/components/painel/clientes/ClientesVitrineAccountsTable";
import { PainelTitleHelp } from "@/components/painel/FieldTip";
import { PanelCard } from "@/components/painel/PanelCard";
import { PainelDateRangeFields } from "@/components/painel/PainelDateRangeFields";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";
import { painelBtnPrimaryClass } from "@/lib/painel-button-classes";
import {
  painelTableCellClass,
  painelTableClass,
  painelTableTbodyClass,
  painelTableTheadClass,
  painelTableWrapClass,
} from "@/lib/painel-table-classes";
import {
  contactLabel,
  groupKey,
  groupMatchesFilter,
  type ContactGroup,
  type OrderRow,
  sortOrdersDesc,
} from "@/lib/painel-clientes-helpers";

type VitrineCustomer = {
  id: string;
  email: string;
  created_at: string;
};

type CustomerOrderStatRow = {
  customer_id: string;
  email: string;
  order_count: number;
  last_order_at: string;
};

function formatLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultCustomerStatsRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from: formatLocalIsoDate(from), to: formatLocalIsoDate(to) };
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
  const [statsRange, setStatsRange] = useState(defaultCustomerStatsRange);
  const [custOrderStats, setCustOrderStats] = useState<{ stats: CustomerOrderStatRow[] } | null>(
    null,
  );
  const [statsError, setStatsError] = useState<string | null>(null);

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

  useEffect(() => {
    setStatsError(null);
    const q = new URLSearchParams({
      date_from: statsRange.from,
      date_to: statsRange.to,
    });
    void apiPainelJson<{ stats: CustomerOrderStatRow[] }>(
      `/api/v2/dashboard/customer-order-stats?${q.toString()}`,
    )
      .then(setCustOrderStats)
      .catch((e: unknown) => {
        setCustOrderStats(null);
        setStatsError(
          e instanceof PainelApiError ? e.message : "Não foi possível carregar métricas de clientes.",
        );
      });
  }, [statsRange.from, statsRange.to]);

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
        <PainelTitleHelp tip="Contactos agrupados a partir dos pedidos (telefone, nome ou cliente com sessão na vitrine). Pode criar contas para o cliente iniciar sessão na loja online com e-mail e palavra-passe.">
          <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
        </PainelTitleHelp>
      </PainelStickyHeading>

      <ClientesVitrineAccountForm
        newEmail={newEmail}
        newPassword={newPassword}
        newPassword2={newPassword2}
        onNewEmailChange={setNewEmail}
        onNewPasswordChange={setNewPassword}
        onNewPassword2Change={setNewPassword2}
        vitrineMsg={vitrineMsg}
        creating={creating}
        onSubmit={onCreateVitrineCustomer}
      />

      {vitrineError ? <p className="mt-4 text-sm text-amber-800">{vitrineError}</p> : null}

      {vitrineCustomers && vitrineCustomers.length > 0 ? (
        <ClientesVitrineAccountsTable vitrineCustomers={vitrineCustomers} />
      ) : vitrineCustomers && vitrineCustomers.length === 0 && !vitrineError ? (
        <p className="mt-4 text-sm text-slate-500">Ainda não há contas de vitrine criadas pelo painel.</p>
      ) : null}

      <PanelCard className="mt-8">
        <PainelTitleHelp tip="Número de pedidos no intervalo de datas (calendário) para cada cliente com login na vitrine. Ordenação: mais pedidos em primeiro. As datas seguem o calendário local e são enviadas como dia civil (AAAA-MM-DD).">
          <h2 className="text-sm font-semibold text-slate-800">Actividade por conta (vitrine)</h2>
        </PainelTitleHelp>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <PainelDateRangeFields
            bare
            idFrom="cli-stats-from"
            idTo="cli-stats-to"
            from={statsRange.from}
            to={statsRange.to}
            onFromChange={(v) => setStatsRange((r) => ({ ...r, from: v }))}
            onToChange={(v) => setStatsRange((r) => ({ ...r, to: v }))}
          />
        </div>
        {statsError ? <p className="mt-3 text-sm text-amber-800">{statsError}</p> : null}
        {custOrderStats === null && !statsError ? (
          <p className="mt-4 text-sm text-slate-500">A carregar métricas…</p>
        ) : null}
        {custOrderStats && custOrderStats.stats.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            Nenhum pedido com conta na vitrine neste período.
          </p>
        ) : null}
        {custOrderStats && custOrderStats.stats.length > 0 ? (
          <div className={`mt-4 ${painelTableWrapClass}`}>
            <table className={painelTableClass}>
              <thead className={painelTableTheadClass}>
                <tr>
                  <th className={painelTableCellClass}>E-mail</th>
                  <th className={`${painelTableCellClass} text-right`}>Pedidos</th>
                  <th className={painelTableCellClass}>Último pedido</th>
                </tr>
              </thead>
              <tbody className={painelTableTbodyClass}>
                {custOrderStats.stats.map((s) => (
                  <tr key={s.customer_id}>
                    <td className={`${painelTableCellClass} font-medium text-slate-900`}>{s.email}</td>
                    <td className={`${painelTableCellClass} text-right tabular-nums`}>
                      {s.order_count}
                    </td>
                    <td className={`${painelTableCellClass} text-xs text-slate-600`}>
                      {new Date(s.last_order_at).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </PanelCard>

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

      <ClientesOrdersByContactSection
        groups={groups}
        filteredGroups={filteredGroups}
        filterQuery={filterQuery}
        onFilterQueryChange={setFilterQuery}
      />
    </>
  );
}
