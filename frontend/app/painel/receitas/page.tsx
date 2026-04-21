"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FieldTipBeside } from "@/components/painel/FieldTip";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, formatBRL, formatPercent, PainelApiError } from "@/lib/painel-api";
import { painelBtnPrimaryClass, painelBtnSecondaryClass } from "@/lib/painel-button-classes";

type RecipeOut = {
  id: string;
  product_id: string;
  yield_quantity: string;
  time_minutes: number | null;
  is_active: boolean;
  estimated_material_unit_cost?: string | null;
  estimated_labor_unit_cost?: string | null;
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
  const [includeInactive, setIncludeInactive] = useState(false);
  const [filterText, setFilterText] = useState("");

  const load = useCallback(() => {
    setError(null);
    const q = includeInactive ? "?include_inactive=true" : "";
    Promise.all([
      apiPainelJson<RecipeOut[]>(`/api/v2/recipes${q}`),
      apiPainelJson<ProductOut[]>("/api/v2/products"),
      apiPainelJson<InvItem[]>("/api/v2/inventory-items"),
    ])
      .then(([r, p, inv]) => {
        setRecipes(r);
        setProducts(p);
        setInventory(inv);
      })
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Erro ao carregar");
      });
  }, [includeInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const t = filterText.trim().toLowerCase();
    if (!t) return recipes;
    return recipes.filter((r) => {
      const name = products.find((x) => x.id === r.product_id)?.name ?? "";
      return name.toLowerCase().includes(t) || r.id.toLowerCase().includes(t);
    });
  }, [recipes, products, filterText]);

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
      }>("/api/v2/production", {
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

  async function toggleActive(r: RecipeOut) {
    setBusyId(r.id);
    setMsg(null);
    try {
      await apiPainelJson(`/api/v2/recipes/${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !r.is_active }),
      });
      void load();
    } catch (e: unknown) {
      setMsg(e instanceof PainelApiError ? e.message : "Não foi possível alterar o estado.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PainelStickyHeading>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Receitas</h1>
            <p className="mt-1 text-sm text-slate-500">
              Uma receita por produto. Depois, produzir lote.
            </p>
          </div>
          <Link href="/painel/receitas/nova" className={`inline-flex items-center justify-center ${painelBtnPrimaryClass}`}>
            Nova receita
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="text-xs text-slate-600">
          Filtrar por nome do produto
          <input
            type="search"
            className="ml-2 mt-1 block rounded border border-slate-200 px-2 py-1 text-sm"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Comece a escrever…"
          />
        </label>
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          <FieldTipBeside tip="Receitas inactivas ficam ocultas na produção até serem reactivadas.">
            Mostrar inactivas
          </FieldTipBeside>
        </label>
        </div>
      </PainelStickyHeading>

      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}
      {msg ? (
        <p
          className={`mt-4 text-sm ${msg.includes("sucesso") ? "text-emerald-800" : "text-red-700"}`}
        >
          {msg}
        </p>
      ) : null}
      <ul className="mt-6 space-y-4">
        {filtered.length === 0 && !error ? (
          <li className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Nenhuma receita neste filtro.{" "}
            <Link href="/painel/receitas/nova" className="font-medium text-painel-primary underline">
              Criar
            </Link>
          </li>
        ) : null}
        {filtered.map((r) => {
          const effLabel = formatPercent(r.effective_margin_percent);
          return (
            <li
              key={r.id}
              className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${!r.is_active ? "opacity-80" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{productName(r.product_id)}</p>
                    {!r.is_active ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        Inactiva
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Rendimento: {r.yield_quantity} un. · Tempo:{" "}
                    {r.time_minutes != null ? `${r.time_minutes} min` : "—"}
                  </p>
                  {r.estimated_unit_cost != null ? (
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="inline-flex flex-wrap items-baseline gap-x-1">
                        <FieldTipBeside tip="Total = matéria-prima (stock médio dos insumos) + mão de obra (taxa hora × tempo ÷ rendimento). A sugestão aplica a margem % sobre este total.">
                          Custo estimado / un. (MP+MO):
                        </FieldTipBeside>{" "}
                        {formatBRL(r.estimated_unit_cost)}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        MP:{" "}
                        {r.estimated_material_unit_cost != null
                          ? formatBRL(r.estimated_material_unit_cost)
                          : "—"}{" "}
                        · MO:{" "}
                        {r.estimated_labor_unit_cost != null &&
                        Number.parseFloat(String(r.estimated_labor_unit_cost)) > 0
                          ? formatBRL(r.estimated_labor_unit_cost)
                          : "—"}
                      </span>
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
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                  <Link
                    href={`/painel/receitas/${r.id}`}
                    className={`inline-flex items-center justify-center text-center ${painelBtnSecondaryClass}`}
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => void toggleActive(r)}
                    className={painelBtnSecondaryClass}
                  >
                    {r.is_active ? "Inactivar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id || !r.is_active}
                    onClick={() => void produzir(r.id)}
                    title={!r.is_active ? "Active a receita para produzir." : undefined}
                    className={painelBtnPrimaryClass}
                  >
                    {busyId === r.id ? "A processar…" : "Produzir lote"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
