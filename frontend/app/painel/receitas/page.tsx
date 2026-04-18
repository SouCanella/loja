"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiPainelJson, formatBRL, PainelApiError } from "@/lib/painel-api";

type RecipeOut = {
  id: string;
  product_id: string;
  yield_quantity: string;
  time_minutes: number | null;
  estimated_unit_cost: string | null;
  target_margin_percent: string | null;
  effective_margin_percent: string;
  suggested_unit_price: string | null;
  items: { id: string; inventory_item_id: string; quantity: string }[];
};

type ProductOut = {
  id: string;
  name: string;
};

type InvItem = { id: string; name: string; unit: string; has_sale_product?: boolean };

export default function ReceitasPage() {
  const [recipes, setRecipes] = useState<RecipeOut[]>([]);
  const [products, setProducts] = useState<ProductOut[]>([]);
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      apiPainelJson<RecipeOut[]>("/api/v1/recipes"),
      apiPainelJson<ProductOut[]>("/api/v1/products"),
      apiPainelJson<InvItem[]>("/api/v1/inventory-items"),
    ])
      .then(([r, p, inv]) => {
        setRecipes(r);
        setProducts(p);
        setInventory(inv);
      })
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Erro ao carregar");
      });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function productName(id: string): string {
    return products.find((x) => x.id === id)?.name ?? id.slice(0, 8);
  }

  function invName(id: string): string {
    const row = inventory.find((x) => x.id === id);
    if (!row) return id.slice(0, 8);
    const tag = row.has_sale_product ? " · catálogo" : "";
    return `${row.name} (${row.unit})${tag}`;
  }

  async function produzir(recipeId: string) {
    setMsg(null);
    setBusyId(recipeId);
    try {
      const key =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `p-${Date.now()}`;
      await apiPainelJson<{
        id: string;
        output_quantity: string;
        total_input_cost: string;
        unit_output_cost: string;
      }>("/api/v1/production", {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: JSON.stringify({ recipe_id: recipeId }),
      });
      setMsg("Produção registada com sucesso.");
      void load();
    } catch (e: unknown) {
      setMsg(e instanceof PainelApiError ? e.message : "Falha na produção");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Receitas</h1>
          <p className="mt-1 text-sm text-slate-500">Uma receita por produto. Depois, produzir lote.</p>
        </div>
        <Link
          href="/painel/receitas/nova"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Nova receita
        </Link>
      </div>
      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}
      {msg ? (
        <p
          className={`mt-4 text-sm ${msg.includes("sucesso") ? "text-emerald-800" : "text-red-700"}`}
        >
          {msg}
        </p>
      ) : null}
      <ul className="mt-6 space-y-4">
        {recipes.length === 0 && !error ? (
          <li className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Nenhuma receita.{" "}
            <Link href="/painel/receitas/nova" className="font-medium text-teal-700 underline">
              Criar a primeira
            </Link>
          </li>
        ) : null}
        {recipes.map((r) => {
          const eff = Number.parseFloat(r.effective_margin_percent);
          const effLabel = Number.isNaN(eff) ? "—" : `${eff}%`;
          return (
            <li
              key={r.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{productName(r.product_id)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Rendimento: {r.yield_quantity} un. · Tempo:{" "}
                    {r.time_minutes != null ? `${r.time_minutes} min` : "—"}
                  </p>
                  {r.estimated_unit_cost != null ? (
                    <p className="mt-2 text-sm text-slate-600">
                      Custo estimado / un.: {formatBRL(r.estimated_unit_cost)}
                      <span className="ml-2 text-slate-500">
                        · Margem efectiva: {effLabel}
                        {r.target_margin_percent != null ? " (receita)" : " (loja)"}
                      </span>
                      {r.suggested_unit_price != null ? (
                        <span className="ml-2 text-slate-600">
                          · Sugestão preço: {formatBRL(r.suggested_unit_price)}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  <ul className="mt-2 text-xs text-slate-600">
                    {r.items.map((it) => (
                      <li key={it.id}>
                        {invName(it.inventory_item_id)} × {it.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void produzir(r.id)}
                  className="shrink-0 rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {busyId === r.id ? "A processar…" : "Produzir lote"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
