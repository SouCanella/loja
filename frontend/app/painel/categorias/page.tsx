"use client";

import { useEffect, useState } from "react";

import { apiPainelJson, PainelApiError } from "@/lib/painel-api";

type Category = { id: string; name: string; slug: string };

export default function CategoriasPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void apiPainelJson<Category[]>("/api/v2/categories")
      .then(setRows)
      .catch((e: unknown) => {
        setErr(e instanceof PainelApiError ? e.message : "Erro ao carregar categorias.");
      });
  }, []);

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Categorias</h1>
      <p className="mt-1 text-sm text-slate-500">Categorias planas da loja (filtros na vitrine).</p>

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}

      <ul className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-medium text-slate-900">{c.name}</span>
            <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{c.slug}</code>
          </li>
        ))}
      </ul>
      {rows.length === 0 && !err ? (
        <p className="mt-4 text-sm text-slate-500">Nenhuma categoria. Crie via API ou script de seed.</p>
      ) : null}
    </>
  );
}
