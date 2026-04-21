"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PainelPaginationBar } from "@/components/painel/PainelPaginationBar";
import { usePainelNotifications } from "@/components/painel/PainelNotificationsContext";
import { PainelTitleHelp } from "@/components/painel/FieldTip";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { painelBtnPrimaryClass, painelBtnSecondaryClass } from "@/lib/painel-button-classes";
import {
  painelFilterBarClass,
  painelFilterFieldColClass,
  painelFilterLabelClass,
  painelFilterSelectClass,
} from "@/lib/painel-filter-classes";
import { slicePage, usePainelPagination } from "@/lib/painel-pagination";

export default function PainelNotificacoesPage() {
  const { inbox, loading, error, markRead, markAllRead } = usePainelNotifications();
  const router = useRouter();
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  const filteredItems = useMemo(() => {
    if (!inbox?.items.length) return [];
    if (readFilter === "all") return inbox.items;
    if (readFilter === "unread") return inbox.items.filter((n) => !n.read_at);
    return inbox.items.filter((n) => n.read_at);
  }, [inbox, readFilter]);

  const notifPagination = usePainelPagination(filteredItems.length, { resetKey: readFilter });
  const pagedNotifs = useMemo(
    () => slicePage(filteredItems, notifPagination.page, notifPagination.pageSize),
    [filteredItems, notifPagination.page, notifPagination.pageSize],
  );

  async function onOpen(id: string, orderId: string | null) {
    await markRead([id]);
    if (orderId) {
      router.push(`/painel/pedidos/${orderId}`);
    }
  }

  return (
    <>
      <PainelStickyHeading>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PainelTitleHelp tip="Alertas de novos pedidos e outras mensagens da loja. Pode activar notificação sonora no ícone do sino (🔔).">
            <h1 className="text-2xl font-semibold text-slate-900">Notificações</h1>
          </PainelTitleHelp>
          <div className="flex flex-wrap gap-2">
            {inbox && inbox.unread_count > 0 ? (
              <button
                type="button"
                className={painelBtnSecondaryClass}
                onClick={() => void markAllRead()}
              >
                Marcar todas como lidas
              </button>
            ) : null}
            <Link
              href="/painel/pedidos"
              className={`inline-flex items-center justify-center ${painelBtnPrimaryClass}`}
            >
              Ir para pedidos
            </Link>
          </div>
        </div>

        {inbox && inbox.items.length > 0 ? (
          <div className={painelFilterBarClass}>
            <div className={painelFilterFieldColClass}>
              <label className={painelFilterLabelClass} htmlFor="notif-filter">
                Mostrar
              </label>
              <select
                id="notif-filter"
                className={painelFilterSelectClass}
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value as "all" | "unread" | "read")}
              >
                <option value="all">Todas ({inbox.items.length})</option>
                <option value="unread">
                  Não lidas ({inbox.items.filter((n) => !n.read_at).length})
                </option>
                <option value="read">Lidas ({inbox.items.filter((n) => n.read_at).length})</option>
              </select>
            </div>
          </div>
        ) : null}
      </PainelStickyHeading>

      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}

      {loading && !inbox ? (
        <p className="mt-8 text-sm text-slate-500">A carregar…</p>
      ) : null}

      {inbox && inbox.items.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">Não há notificações.</p>
      ) : null}

      {inbox && inbox.items.length > 0 && filteredItems.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">Nenhuma notificação neste filtro.</p>
      ) : null}

      {inbox && filteredItems.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-200">
          {pagedNotifs.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={`flex w-full flex-col gap-1 px-4 py-4 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${
                  n.read_at ? "text-slate-500" : "text-slate-900"
                }`}
                onClick={() => void onOpen(n.id, n.order_id)}
              >
                <div>
                  <p className={`text-sm ${n.read_at ? "font-normal" : "font-semibold"}`}>{n.title}</p>
                  {n.body ? <p className="mt-1 text-xs text-slate-500">{n.body}</p> : null}
                  <p className="mt-1 text-[0.65rem] text-slate-400">
                    {new Date(n.created_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                    {n.order_id ? (
                      <span className="ml-2 font-mono text-[0.6rem]">
                        Pedido {n.order_id.slice(0, 8)}…
                      </span>
                    ) : null}
                  </p>
                </div>
                <span className="text-xs font-medium text-painel-primary">
                  {n.order_id ? "Abrir pedido →" : "Marcar lida"}
                </span>
              </button>
            </li>
          ))}
          </ul>
          <PainelPaginationBar
            page={notifPagination.page}
            pageCount={notifPagination.pageCount}
            totalItems={filteredItems.length}
            pageSize={notifPagination.pageSize}
            onPageChange={notifPagination.setPage}
          />
        </div>
      ) : null}
    </>
  );
}
