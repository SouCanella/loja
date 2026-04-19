"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { apiPainelJson, PainelApiError } from "@/lib/painel-api";

type Me = {
  store_target_margin_percent: string | number;
};

export default function DefinicoesPage() {
  const [margin, setMargin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setError(null);
    apiPainelJson<Me>("/api/v2/me")
      .then((m) => {
        const v = m.store_target_margin_percent;
        setMargin(typeof v === "number" ? String(v) : String(v));
      })
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Erro ao carregar");
      });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const n = Number.parseFloat(margin.replace(",", "."));
    if (Number.isNaN(n) || n < 0 || n > 100) {
      setMsg("Margem inválida (0–100%).");
      return;
    }
    setLoading(true);
    try {
      await apiPainelJson<Me>("/api/v2/me/store-pricing", {
        method: "PATCH",
        body: JSON.stringify({ target_margin_percent: String(n) }),
      });
      setMsg("Margem da loja atualizada.");
      void load();
    } catch (err: unknown) {
      setMsg(err instanceof PainelApiError ? err.message : "Não foi possível guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Definições</h1>
          <p className="mt-1 text-sm text-slate-500">
            Margem alvo da loja — usada na sugestão de preço quando a receita não define margem própria.
          </p>
        </div>
        <Link href="/painel" className="text-sm text-teal-700 hover:underline">
          ← Painel
        </Link>
      </div>
      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}
      {msg ? (
        <p className={`mt-4 text-sm ${msg.includes("atualizada") ? "text-emerald-800" : "text-red-700"}`}>
          {msg}
        </p>
      ) : null}

      <form className="mt-6 max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={(e) => void onSubmit(e)}>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="margin">
            Margem alvo (%)
          </label>
          <input
            id="margin"
            type="text"
            inputMode="decimal"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
            value={margin}
            onChange={(e) => setMargin(e.target.value)}
            placeholder="30"
          />
          <p className="mt-1 text-xs text-slate-500">
            Ex.: 30 significa sugerir preço = custo × 1,30 (marcação sobre o custo).
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "A guardar…" : "Guardar"}
        </button>
      </form>
    </>
  );
}
