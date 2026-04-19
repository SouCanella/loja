"use client";

import { useCallback, useEffect, useState } from "react";

import { apiPainelJson, PainelApiError } from "@/lib/painel-api";

type Product = {
  id: string;
  name: string;
  price: string;
  image_url: string | null;
  active: boolean;
};

export default function CatalogoPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    void apiPainelJson<Product[]>("/api/v2/products?active_only=false")
      .then(setRows)
      .catch((e: unknown) => {
        setErr(e instanceof PainelApiError ? e.message : "Erro ao carregar produtos.");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveImageUrl(id: string, url: string) {
    setSaving(id);
    setErr(null);
    try {
      await apiPainelJson(`/api/v2/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ image_url: url || null }),
      });
      await load();
    } catch (e: unknown) {
      setErr(e instanceof PainelApiError ? e.message : "Erro ao guardar.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Produtos &amp; catálogo</h1>
      <p className="mt-1 text-sm text-slate-500">
        URL pública da imagem (https) — exibida na vitrine quando definida.
      </p>

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">URL da imagem</th>
              <th className="px-4 py-3 text-right">Preço</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                <td className="max-w-md px-4 py-3">
                  <input
                    type="url"
                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                    defaultValue={p.image_url ?? ""}
                    placeholder="https://…"
                    disabled={saving === p.id}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (p.image_url ?? "")) void saveImageUrl(p.id, v);
                    }}
                  />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">{p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !err ? <p className="p-6 text-sm text-slate-500">Sem produtos.</p> : null}
      </div>
    </>
  );
}
