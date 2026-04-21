"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { messageFromV2Error } from "@/lib/api-v2";
import { getApiBaseUrl } from "@/lib/api";
import { useVitrineCustomerMe } from "@/hooks/use-vitrine-customer-me";
import {
  clearVitrineCustomerSession,
  setVitrineCustomerTokens,
} from "@/lib/vitrine/customer-session";

export default function VitrineContaPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { me, loading: meLoading, refetch: refetchMe } = useVitrineCustomerMe(slug);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!slug) return;
    setLoading(true);
    setMessage(null);
    const path =
      mode === "register"
        ? `/api/v2/public/stores/${encodeURIComponent(slug)}/customers/register`
        : `/api/v2/public/stores/${encodeURIComponent(slug)}/customers/login`;
    try {
      const res = await fetch(`${getApiBaseUrl()}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const msg =
          messageFromV2Error(data) ??
          (typeof data.detail === "string" ? data.detail : "Pedido inválido");
        setMessage(msg);
        return;
      }
      const success = data.success === true && data.data && typeof data.data === "object";
      const inner = success ? (data.data as Record<string, unknown>) : data;
      const access = inner.access_token;
      const refresh = inner.refresh_token;
      if (typeof access === "string") {
        setVitrineCustomerTokens(slug, access, typeof refresh === "string" ? refresh : null);
        setPassword("");
        await refetchMe();
        setMessage(null);
      } else {
        setMessage("Resposta inválida da API.");
      }
    } catch {
      setMessage("Não foi possível contactar a API.");
    } finally {
      setLoading(false);
    }
  }

  function onLogout() {
    if (!slug) return;
    clearVitrineCustomerSession(slug);
    void refetchMe();
    setMessage("Sessão terminada.");
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-loja-ink">Conta</h1>
      <p className="mt-1 text-sm text-loja-muted">Cliente desta vitrine (por email e loja).</p>

      {meLoading ? (
        <p className="mt-6 text-sm text-loja-muted">A carregar…</p>
      ) : me ? (
        <div className="mt-6 rounded-2xl border border-loja-primary/20 bg-white/90 p-5 shadow-loja">
          <p className="text-sm text-loja-muted">Sessão iniciada como</p>
          <p className="mt-1 font-medium text-loja-ink">{me.email}</p>
          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-loja-primary px-4 py-2.5 text-sm font-semibold text-white shadow-loja hover:opacity-95"
            onClick={onLogout}
          >
            Terminar sessão
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex rounded-xl border border-loja-primary/20 bg-white/80 p-1 shadow-sm">
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                mode === "login" ? "bg-loja-primary text-white shadow-sm" : "text-loja-muted"
              }`}
              onClick={() => {
                setMode("login");
                setMessage(null);
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                mode === "register" ? "bg-loja-primary text-white shadow-sm" : "text-loja-muted"
              }`}
              onClick={() => {
                setMode("register");
                setMessage(null);
              }}
            >
              Registar
            </button>
          </div>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-loja-ink/90" htmlFor="vc-email">
                Email
              </label>
              <input
                id="vc-email"
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded-xl border border-loja-primary/25 bg-white px-3 py-2 text-loja-ink shadow-sm focus:border-loja-primary focus:outline-none focus:ring-1 focus:ring-loja-primary"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-loja-ink/90" htmlFor="vc-password">
                Palavra-passe
              </label>
              <input
                id="vc-password"
                type="password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                minLength={8}
                className="mt-1 w-full rounded-xl border border-loja-primary/25 bg-white px-3 py-2 text-loja-ink shadow-sm focus:border-loja-primary focus:outline-none focus:ring-1 focus:ring-loja-primary"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-loja-accent px-4 py-2.5 text-sm font-semibold text-white shadow-loja hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "A enviar…" : mode === "register" ? "Criar conta" : "Entrar"}
            </button>
          </form>
          {message ? <p className="mt-4 text-sm text-red-700">{message}</p> : null}
        </>
      )}

      <p className="mt-10 text-center text-sm text-loja-muted">
        <Link href={`/loja/${encodeURIComponent(slug)}`} className="font-medium text-loja-primary underline">
          Voltar à vitrine
        </Link>
      </p>
    </main>
  );
}
