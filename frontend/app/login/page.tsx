"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { messageFromV2Error } from "@/lib/api-v2";
import { getApiBaseUrl } from "@/lib/api";
import { setSessionTokens } from "@/lib/painel-api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const body = new URLSearchParams();
    body.set("username", email);
    body.set("password", password);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v2/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const msg =
          messageFromV2Error(data) ??
          (typeof data.detail === "string" ? data.detail : "Falha no login");
        setMessage(msg);
        return;
      }
      const success = data.success === true && data.data && typeof data.data === "object";
      const inner = success ? (data.data as Record<string, unknown>) : data;
      const access = inner.access_token;
      const refresh = inner.refresh_token;
      if (typeof access === "string") {
        setSessionTokens(
          access,
          typeof refresh === "string" ? refresh : null,
        );
        setMessage("Sessão iniciada. Pode abrir o painel.");
      } else {
        setMessage("Resposta de login inválida.");
      }
    } catch {
      setMessage("Não foi possível contactar a API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Entrar</h1>
      <p className="mt-1 text-sm text-slate-500">
        OAuth2 password flow — email no campo utilizador.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="password">
            Palavra-passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "A enviar…" : "Entrar"}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}
      <p className="mt-8 text-center text-sm text-slate-500">
        <Link href="/painel" className="text-slate-800 underline">
          Painel
        </Link>
        {" · "}
        <Link href="/" className="text-slate-800 underline">
          Início
        </Link>
      </p>
    </main>
  );
}
