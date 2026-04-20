"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { usePainelNotifications } from "@/components/painel/PainelNotificationsContext";
import { playNewOrderChime, unlockNotificationAudio } from "@/lib/painel-notification-sound";

type Props = {
  /** `light` para barra clara (mobile); `dark` para sidebar escura (default). */
  variant?: "dark" | "light";
};

export function PainelNotificationsBell({ variant = "dark" }: Props) {
  const { inbox, loading, markRead, soundEnabled, setSoundEnabled } = usePainelNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unread = inbox?.unread_count ?? 0;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function onBellPointerDown() {
    unlockNotificationAudio();
  }

  async function onItemClick(id: string, orderId: string | null) {
    await markRead([id]);
    setOpen(false);
    if (orderId) {
      router.push(`/painel/pedidos/${orderId}`);
    }
  }

  const btnClass =
    variant === "light"
      ? "relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-300 bg-white text-lg text-slate-800 shadow-sm hover:bg-slate-50"
      : "relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/5 text-lg text-white hover:bg-white/10";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        className={btnClass}
        aria-label="Notificações"
        aria-expanded={open}
        onPointerDown={onBellPointerDown}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden>🔔</span>
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[0.6rem] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-[min(calc(100vw-2rem),20rem)] rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
          <div className="border-b border-slate-100 px-3 pb-2">
            <p className="text-xs font-semibold text-slate-800">Notificações</p>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
              Som ao novo pedido (vitrine)
            </label>
            <button
              type="button"
              className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => {
                unlockNotificationAudio();
                void playNewOrderChime().catch(() => {
                  /* browser pode bloquear sem gesto prévio */
                });
              }}
            >
              Testar som
            </button>
            <p className="mt-1 text-[0.65rem] leading-snug text-slate-400">
              Usa o mesmo alerta que um pedido novo (dois bipes). Se não ouvir, clique outra vez no painel e tente de novo.
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading && !inbox ? (
              <p className="px-3 py-4 text-xs text-slate-500">A carregar…</p>
            ) : !inbox?.items.length ? (
              <p className="px-3 py-4 text-xs text-slate-500">Sem notificações.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {inbox.items.slice(0, 12).map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`w-full px-3 py-2.5 text-left text-xs hover:bg-slate-50 ${
                        n.read_at ? "text-slate-500" : "font-medium text-slate-900"
                      }`}
                      onClick={() => void onItemClick(n.id, n.order_id)}
                    >
                      <span className="line-clamp-2">{n.title}</span>
                      <span className="mt-0.5 block text-[0.65rem] font-normal text-slate-400">
                        {new Date(n.created_at).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-slate-100 px-2 pt-2">
            <Link
              href="/painel/notificacoes"
              className="block rounded-md px-2 py-1.5 text-center text-xs font-medium text-painel-primary hover:bg-painel-soft"
              onClick={() => setOpen(false)}
            >
              Ver todas
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
