"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { usePainelNotifications } from "@/components/painel/PainelNotificationsContext";

export default function PainelNotificacoesPage() {
  const { inbox, loading, error, markRead, markAllRead } = usePainelNotifications();
  const router = useRouter();

  async function onOpen(id: string, orderId: string | null) {
    await markRead([id]);
    if (orderId) {
      router.push(`/painel/pedidos/${orderId}`);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notificações</h1>
          <p className="mt-1 text-sm text-slate-500">
            Novos pedidos da vitrine e outras mensagens da loja. O som pode ser activado no ícone 🔔.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {inbox && inbox.unread_count > 0 ? (
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
              onClick={() => void markAllRead()}
            >
              Marcar todas como lidas
            </button>
          ) : null}
          <Link
            href="/painel/pedidos"
            className="rounded-lg bg-painel-cta px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-painel-cta-hover"
          >
            Ir para pedidos
          </Link>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}

      {loading && !inbox ? (
        <p className="mt-8 text-sm text-slate-500">A carregar…</p>
      ) : null}

      {inbox && inbox.items.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">Não há notificações.</p>
      ) : null}

      {inbox && inbox.items.length > 0 ? (
        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
          {inbox.items.map((n) => (
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
      ) : null}
    </>
  );
}
