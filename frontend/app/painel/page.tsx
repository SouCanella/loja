"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getApiBaseUrl } from "@/lib/api";

type Me = {
  email: string;
  role: string;
  store_id: string;
};

export default function PainelPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      setError("Sem token. Faça login primeiro.");
      return;
    }
    void fetch(`${getApiBaseUrl()}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.detail === "string" ? data.detail : "Sessão inválida");
          return;
        }
        setMe(data as Me);
      })
      .catch(() => setError("Não foi possível contactar a API."));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Painel</h1>
      <p className="mt-1 text-sm text-slate-500">Área autenticada (esqueleto Fase 1).</p>
      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}
      {me ? (
        <dl className="mt-6 space-y-2 text-sm">
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{me.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Função</dt>
            <dd className="font-mono text-slate-800">{me.role}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Loja (store_id)</dt>
            <dd className="break-all font-mono text-xs text-slate-700">{me.store_id}</dd>
          </div>
        </dl>
      ) : null}
      <p className="mt-10 text-sm text-slate-500">
        <Link href="/login" className="text-slate-800 underline">
          Login
        </Link>
        {" · "}
        <Link href="/" className="text-slate-800 underline">
          Início
        </Link>
      </p>
    </main>
  );
}
