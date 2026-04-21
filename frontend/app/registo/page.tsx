"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { messageFromV2Error } from "@/lib/api-v2";
import { getApiBaseUrl } from "@/lib/api";
import { setSessionTokens } from "@/lib/painel-api";

export default function RegistoLojaPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v2/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: storeName.trim(),
          store_slug: storeSlug.trim().toLowerCase(),
          admin_email: email.trim(),
          password,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const msg =
          messageFromV2Error(data) ??
          (typeof data.detail === "string" ? data.detail : "Não foi possível criar a conta");
        setMessage(msg);
        return;
      }
      const success = data.success === true && data.data && typeof data.data === "object";
      const inner = success ? (data.data as Record<string, unknown>) : data;
      const access = inner.access_token;
      const refresh = inner.refresh_token;
      if (typeof access === "string") {
        setSessionTokens(access, typeof refresh === "string" ? refresh : null);
        router.push("/painel");
        return;
      }
      setMessage("Resposta de registo inválida.");
    } catch {
      setMessage("Não foi possível contactar a API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Criar loja</h1>
      <p className="mt-1 text-sm text-slate-500">
        Regista a tua loja e o utilizador administrador. O slug identifica a vitrine pública.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="store_name">
            Nome da loja
          </label>
          <input
            id="store_name"
            type="text"
            autoComplete="organization"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={storeName}
            onChange={(ev) => setStoreName(ev.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="store_slug">
            Slug da vitrine
          </label>
          <input
            id="store_slug"
            type="text"
            autoComplete="off"
            placeholder="minha-loja"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={storeSlug}
            onChange={(ev) => setStoreSlug(ev.target.value)}
            required
            minLength={2}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            title="Minúsculas, números e hífens (ex.: minha-loja)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">
            Email do administrador
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
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
            autoComplete="new-password"
            minLength={8}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-painel-cta px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-painel-cta-hover disabled:cursor-not-allowed disabled:bg-stone-400 disabled:text-white"
        >
          {loading ? "A criar…" : "Criar conta"}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-red-700">{message}</p> : null}
      <p className="mt-8 text-center text-sm text-slate-500">
        Já tens conta?{" "}
        <Link href="/login" className="text-slate-800 underline">
          Entrar
        </Link>
        {" · "}
        <Link href="/" className="text-slate-800 underline">
          Início
        </Link>
      </p>
    </main>
  );
}
