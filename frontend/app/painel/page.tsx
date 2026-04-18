"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiPainelJson, PainelApiError } from "@/lib/painel-api";

type Me = {
  email: string;
  role: string;
  store_id: string;
  store_slug: string;
  store_name: string;
};

export default function PainelHomePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiPainelJson<Me>("/api/v1/me")
      .then(setMe)
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Não foi possível carregar o perfil.");
      });
  }, []);

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Resumo</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gestão da loja — receitas, produção e números.
      </p>
      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}
      {me ? (
        <>
          <dl className="mt-6 space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <div>
              <dt className="text-slate-500">Loja</dt>
              <dd className="font-medium text-slate-900">{me.store_name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{me.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Vitrine pública</dt>
              <dd>
                <Link
                  href={`/loja/${me.store_slug}`}
                  className="font-medium text-teal-700 underline"
                >
                  /loja/{me.store_slug}
                </Link>
              </dd>
            </div>
          </dl>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            <li>
              <Link
                href="/painel/pedidos"
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
              >
                <span className="font-semibold text-slate-900">Pedidos</span>
                <p className="mt-1 text-xs text-slate-500">Listar e atualizar estado dos pedidos</p>
              </Link>
            </li>
            <li>
              <Link
                href="/painel/receitas"
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
              >
                <span className="font-semibold text-slate-900">Receitas</span>
                <p className="mt-1 text-xs text-slate-500">Cadastrar insumos e produzir lotes</p>
              </Link>
            </li>
            <li>
              <Link
                href="/painel/relatorio"
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
              >
                <span className="font-semibold text-slate-900">Relatório financeiro</span>
                <p className="mt-1 text-xs text-slate-500">Receita de pedidos e custo de produção</p>
              </Link>
            </li>
          </ul>
          <p className="mt-8 text-xs text-slate-400">
            Preços na vitrine: variável de ambiente e API em{" "}
            <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_API_URL</code>. Margem sugerida
            nas receitas: ~30% sobre custo estimado (indicativo).
          </p>
        </>
      ) : !error ? (
        <p className="mt-6 text-sm text-slate-500">A carregar…</p>
      ) : null}
    </>
  );
}
