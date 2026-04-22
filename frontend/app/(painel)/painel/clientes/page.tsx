"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ClientesOrdersByContactSection } from "@/components/painel/clientes/ClientesOrdersByContactSection";
import { ClientesVitrineAccountForm } from "@/components/painel/clientes/ClientesVitrineAccountForm";
import {
  ClientesVitrineAccountsTable,
  type PainelCustomerRow,
} from "@/components/painel/clientes/ClientesVitrineAccountsTable";
import { PainelPaginationBar } from "@/components/painel/PainelPaginationBar";
import { PainelTitleHelp } from "@/components/painel/FieldTip";
import { PanelCard } from "@/components/painel/PanelCard";
import { PainelDateRangeFields } from "@/components/painel/PainelDateRangeFields";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelBlob, apiPainelJson, PainelApiError } from "@/lib/painel-api";
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
  type OrderRow,
  sortOrdersDesc,
} from "@/lib/painel-clientes-helpers";
import { slicePage, usePainelPagination } from "@/lib/painel-pagination";

type CustomerOrderStatRow = {
  customer_id: string;
  display_label: string;
  email: string | null;
  order_count: number;
  last_order_at: string;
};

type CustomerOrderStatsPayload = {
  stats: CustomerOrderStatRow[];
  registered_accounts_count: number;
  accounts_with_orders_in_period: number;
  accounts_without_orders_in_period: number;
  total_orders_with_account_in_period: number;
  repeat_buyers_count: number;
  single_purchase_buyers_count: number;
  avg_orders_per_buyer: number | null;
  recompra_rate_pct: number | null;
  avg_days_between_orders_repeat_buyers: number | null;
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
  const [painelCustomers, setPainelCustomers] = useState<PainelCustomerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vitrineError, setVitrineError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmailOptional, setNewEmailOptional] = useState("");
  const [vitrineMsg, setVitrineMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [statsRange, setStatsRange] = useState(defaultCustomerStatsRange);
  const [custOrderStats, setCustOrderStats] = useState<CustomerOrderStatsPayload | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [exportSegment, setExportSegment] = useState<
    "inactive" | "buyers_all" | "buyers_repeat" | "buyers_single"
  >("inactive");
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const loadPainelCustomers = useCallback(() => {
    setVitrineError(null);
    void apiPainelJson<PainelCustomerRow[]>("/api/v2/customers")
      .then(setPainelCustomers)
      .catch((e: unknown) => {
        setPainelCustomers([]);
        setVitrineError(
          e instanceof PainelApiError ? e.message : "Não foi possível carregar os clientes.",
        );
      });
  }, []);

  useEffect(() => {
    void apiPainelJson<OrderRow[]>("/api/v2/orders")
      .then(setRows)
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Não foi possível carregar os pedidos.");
      });
    void loadPainelCustomers();
  }, [loadPainelCustomers]);

  useEffect(() => {
    setStatsError(null);
    const q = new URLSearchParams({
      date_from: statsRange.from,
      date_to: statsRange.to,
    });
    void apiPainelJson<CustomerOrderStatsPayload>(
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

  const customerOrderStatRows = custOrderStats?.stats ?? [];
  const statsPagination = usePainelPagination(customerOrderStatRows.length, {
    resetKey: `${statsRange.from}:${statsRange.to}`,
  });
  const pagedCustomerOrderStats = useMemo(
    () => slicePage(customerOrderStatRows, statsPagination.page, statsPagination.pageSize),
    [customerOrderStatRows, statsPagination.page, statsPagination.pageSize],
  );

  async function onCreatePainelCustomer(e: FormEvent) {
    e.preventDefault();
    setVitrineMsg(null);
    const name = newContactName.trim();
    const phone = newPhone.trim();
    const emOpt = newEmailOptional.trim();
    if (!name) {
      setVitrineMsg("Indique o nome.");
      return;
    }
    if (phone.length < 3) {
      setVitrineMsg("Indique um telefone válido (pelo menos 3 caracteres).");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, string> = { contact_name: name, phone };
      if (emOpt) body.email = emOpt;
      await apiPainelJson<PainelCustomerRow>("/api/v2/customers", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setNewContactName("");
      setNewPhone("");
      setNewEmailOptional("");
      setVitrineMsg("Cliente gravado na base (origem Painel).");
      void loadPainelCustomers();
    } catch (err: unknown) {
      setVitrineMsg(err instanceof PainelApiError ? err.message : "Não foi possível gravar o cliente.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <PainelStickyHeading>
        <PainelTitleHelp tip="Contactos agrupados a partir dos pedidos (telefone, nome ou cliente na base). Pode gravar clientes com nome e telefone (origem Painel); o e-mail é opcional e não define palavra-passe na vitrine.">
          <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
        </PainelTitleHelp>
      </PainelStickyHeading>

      <ClientesVitrineAccountForm
        contactName={newContactName}
        phone={newPhone}
        emailOptional={newEmailOptional}
        onContactNameChange={setNewContactName}
        onPhoneChange={setNewPhone}
        onEmailOptionalChange={setNewEmailOptional}
        msg={vitrineMsg}
        creating={creating}
        onSubmit={onCreatePainelCustomer}
      />

      {vitrineError ? <p className="mt-4 text-sm text-amber-800">{vitrineError}</p> : null}

      {painelCustomers && painelCustomers.length > 0 ? (
        <ClientesVitrineAccountsTable customers={painelCustomers} />
      ) : painelCustomers && painelCustomers.length === 0 && !vitrineError ? (
        <p className="mt-4 text-sm text-slate-500">Ainda não há clientes gravados na base.</p>
      ) : null}

      <PanelCard className="mt-8">
        <PainelTitleHelp tip="Pedidos no intervalo ligados a um cliente na base (vitrine ou Painel). Ordenação: mais pedidos em primeiro (até 100 linhas). Recompra, frequência e exportação CSV (IP-06). As datas são dia civil (AAAA-MM-DD).">
          <h2 className="text-sm font-semibold text-slate-800">Actividade por cliente</h2>
        </PainelTitleHelp>
        {custOrderStats && !statsError ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-800">Resumo no período</p>
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-slate-600">
              <li>
                <span className="tabular-nums font-medium text-slate-800">
                  {custOrderStats.registered_accounts_count}
                </span>{" "}
                cliente(s) na base
              </li>
              <li>
                <span className="tabular-nums font-medium text-slate-800">
                  {custOrderStats.accounts_with_orders_in_period}
                </span>{" "}
                com pelo menos um pedido
              </li>
              <li>
                <span className="tabular-nums font-medium text-slate-800">
                  {custOrderStats.accounts_without_orders_in_period}
                </span>{" "}
                sem pedidos neste intervalo
              </li>
              <li>
                <span className="tabular-nums font-medium text-slate-800">
                  {custOrderStats.total_orders_with_account_in_period}
                </span>{" "}
                pedido(s) com conta no período
              </li>
              <li>
                <span className="tabular-nums font-medium text-slate-800">
                  {custOrderStats.repeat_buyers_count}
                </span>{" "}
                comprador(es) com recompra (≥2 pedidos) ·{" "}
                <span className="tabular-nums font-medium text-slate-800">
                  {custOrderStats.single_purchase_buyers_count}
                </span>{" "}
                só com uma compra
              </li>
              <li>
                Média de pedidos por comprador:{" "}
                <span className="tabular-nums font-medium text-slate-800">
                  {custOrderStats.avg_orders_per_buyer ?? "—"}
                </span>
                {" · "}
                Taxa de recompra (entre compradores):{" "}
                <span className="tabular-nums font-medium text-slate-800">
                  {custOrderStats.recompra_rate_pct != null
                    ? `${custOrderStats.recompra_rate_pct.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                      })}%`
                    : "—"}
                </span>
              </li>
              <li>
                Média de dias entre pedidos (quem recompra):{" "}
                <span className="tabular-nums font-medium text-slate-800">
                  {custOrderStats.avg_days_between_orders_repeat_buyers != null
                    ? custOrderStats.avg_days_between_orders_repeat_buyers.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </span>
              </li>
            </ul>
          </div>
        ) : null}
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
          <div className="flex min-w-[12rem] flex-col gap-1">
            <label htmlFor="cli-export-seg" className="text-xs font-medium text-slate-600">
              Segmento CSV
            </label>
            <select
              id="cli-export-seg"
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
              value={exportSegment}
              onChange={(e) =>
                setExportSegment(
                  e.target.value as "inactive" | "buyers_all" | "buyers_repeat" | "buyers_single",
                )
              }
            >
              <option value="inactive">Sem pedidos no período</option>
              <option value="buyers_all">Todos com pedidos</option>
              <option value="buyers_repeat">Recompra (≥2 pedidos)</option>
              <option value="buyers_single">Uma compra</option>
            </select>
          </div>
          <button
            type="button"
            disabled={exportBusy}
            className={`inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50`}
            onClick={() => {
              setExportError(null);
              setExportBusy(true);
              const q = new URLSearchParams({
                date_from: statsRange.from,
                date_to: statsRange.to,
                segment: exportSegment,
              });
              void apiPainelBlob(`/api/v2/dashboard/customer-order-stats/export?${q.toString()}`)
                .then((blob) => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `clientes_${exportSegment}_${statsRange.from}_${statsRange.to}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                })
                .catch((e: unknown) => {
                  setExportError(
                    e instanceof PainelApiError ? e.message : "Não foi possível exportar o CSV.",
                  );
                })
                .finally(() => setExportBusy(false));
            }}
          >
            {exportBusy ? "A exportar…" : "Exportar CSV"}
          </button>
        </div>
        {exportError ? <p className="mt-2 text-sm text-amber-800">{exportError}</p> : null}
        {statsError ? <p className="mt-3 text-sm text-amber-800">{statsError}</p> : null}
        {custOrderStats === null && !statsError ? (
          <p className="mt-4 text-sm text-slate-500">A carregar métricas…</p>
        ) : null}
        {custOrderStats && custOrderStats.stats.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            Nenhum pedido ligado a cliente na base neste período.
          </p>
        ) : null}
        {custOrderStats && custOrderStats.stats.length > 0 ? (
          <div className={`mt-4 ${painelTableWrapClass}`}>
            <table className={painelTableClass}>
              <thead className={painelTableTheadClass}>
                <tr>
                  <th className={painelTableCellClass}>Contacto</th>
                  <th className={`${painelTableCellClass} text-right`}>Pedidos</th>
                  <th className={painelTableCellClass}>Último pedido</th>
                </tr>
              </thead>
              <tbody className={painelTableTbodyClass}>
                {pagedCustomerOrderStats.map((s) => (
                  <tr key={s.customer_id}>
                    <td className={`${painelTableCellClass} font-medium text-slate-900`}>
                      {s.display_label}
                    </td>
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
            <PainelPaginationBar
              page={statsPagination.page}
              pageCount={statsPagination.pageCount}
              totalItems={customerOrderStatRows.length}
              pageSize={statsPagination.pageSize}
              onPageChange={statsPagination.setPage}
            />
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
