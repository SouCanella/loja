"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { FieldTip } from "@/components/painel/FieldTip";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";

type ProductOut = {
  id: string;
  name: string;
  inventory_item_id: string;
};

type InvItem = { id: string; name: string; unit: string; has_sale_product?: boolean };

type RecipeOut = {
  id: string;
  product_id: string;
  yield_quantity: string;
  time_minutes: number | null;
  is_active: boolean;
  items: { id: string; inventory_item_id: string; quantity: string }[];
  target_margin_percent: string | null;
};

type Line = { inventory_item_id: string; quantity: string };

export default function EditarReceitaPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = typeof params.id === "string" ? params.id : "";

  const [products, setProducts] = useState<ProductOut[]>([]);
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [recipe, setRecipe] = useState<RecipeOut | null>(null);
  const [yieldQty, setYieldQty] = useState("1");
  const [timeMin, setTimeMin] = useState("");
  const [marginPct, setMarginPct] = useState("");
  const [useStoreMargin, setUseStoreMargin] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [lines, setLines] = useState<Line[]>([{ inventory_item_id: "", quantity: "1" }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!recipeId) return;
    void Promise.all([
      apiPainelJson<ProductOut[]>("/api/v2/products"),
      apiPainelJson<InvItem[]>("/api/v2/inventory-items"),
      apiPainelJson<RecipeOut>(`/api/v2/recipes/${recipeId}`),
    ])
      .then(([p, inv, r]) => {
        setProducts(p);
        setInventory(inv);
        setRecipe(r);
        setYieldQty(String(r.yield_quantity));
        setTimeMin(r.time_minutes != null ? String(r.time_minutes) : "");
        if (r.target_margin_percent != null) {
          setMarginPct(String(r.target_margin_percent));
          setUseStoreMargin(false);
        } else {
          setMarginPct("");
          setUseStoreMargin(true);
        }
        setIsActive(r.is_active);
        setLines(
          r.items.length > 0
            ? r.items.map((it) => ({
                inventory_item_id: it.inventory_item_id,
                quantity: String(it.quantity),
              }))
            : [{ inventory_item_id: "", quantity: "1" }],
        );
      })
      .catch((e: unknown) => {
        setInitError(e instanceof PainelApiError ? e.message : "Erro ao carregar receita.");
      });
  }, [recipeId]);

  function addLine() {
    setLines((prev) => [...prev, { inventory_item_id: "", quantity: "1" }]);
  }

  function setLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, j) => j !== i));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!recipe) return;
    setError(null);
    const y = Number.parseFloat(yieldQty.replace(",", "."));
    if (Number.isNaN(y) || y <= 0) {
      setError("Rendimento inválido.");
      return;
    }
    const finished = products.find((p) => p.id === recipe.product_id)?.inventory_item_id;
    const items = lines
      .filter((l) => l.inventory_item_id && l.quantity)
      .map((l) => ({
        inventory_item_id: l.inventory_item_id,
        quantity: l.quantity,
      }));
    if (items.length === 0) {
      setError("Adicione pelo menos um insumo.");
      return;
    }
    if (finished && items.some((x) => x.inventory_item_id === finished)) {
      setError("Não use o insumo do próprio produto acabado como matéria-prima.");
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        yield_quantity: yieldQty,
        time_minutes: timeMin ? Number.parseInt(timeMin, 10) : null,
        items,
        is_active: isActive,
      };
      if (useStoreMargin) {
        payload.target_margin_percent = null;
      } else if (marginPct.trim()) {
        const m = Number.parseFloat(marginPct.replace(",", "."));
        if (Number.isNaN(m) || m < 0 || m > 100) {
          setError("Margem % inválida (0–100).");
          setLoading(false);
          return;
        }
        payload.target_margin_percent = String(m);
      } else {
        payload.target_margin_percent = null;
      }
      await apiPainelJson(`/api/v2/recipes/${recipeId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      router.push("/painel/receitas");
    } catch (err: unknown) {
      setError(err instanceof PainelApiError ? err.message : "Não foi possível guardar.");
    } finally {
      setLoading(false);
    }
  }

  const productLabel = recipe
    ? products.find((p) => p.id === recipe.product_id)?.name ?? recipe.product_id
    : "…";

  if (initError) {
    return (
      <>
        <Link href="/painel/receitas" className="text-sm text-teal-700 hover:underline">
          ← Receitas
        </Link>
        <p className="mt-4 text-sm text-amber-800">{initError}</p>
      </>
    );
  }

  if (!recipe && !initError) {
    return (
      <p className="text-sm text-slate-500" aria-live="polite">
        A carregar…
      </p>
    );
  }

  return (
    <>
      <Link href="/painel/receitas" className="text-sm text-teal-700 hover:underline">
        ← Receitas
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">Editar receita</h1>
      <p className="mt-1 text-sm text-slate-500">
        Produto: <span className="font-medium text-slate-800">{productLabel}</span> — o produto acabado não pode ser
        alterado aqui.
      </p>

      <form className="mt-6 max-w-lg space-y-4" onSubmit={onSubmit}>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Receita activa
            <FieldTip text="Receitas inactivas não aparecem na produção até serem reactivadas." />
          </label>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[8rem] flex-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="marginR">
              Margem % (receita)
              <FieldTip text="Se usar margem da loja, deixe vazio e marque a opção abaixo." />
            </label>
            <input
              id="marginR"
              type="text"
              inputMode="decimal"
              disabled={useStoreMargin}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              value={marginPct}
              onChange={(e) => setMarginPct(e.target.value)}
              placeholder="ex.: 35"
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={useStoreMargin}
                onChange={(e) => setUseStoreMargin(e.target.checked)}
              />
              Usar margem alvo da loja
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[8rem] flex-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="yield">
              Rendimento (un.)
            </label>
            <input
              id="yield"
              type="text"
              inputMode="decimal"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={yieldQty}
              onChange={(e) => setYieldQty(e.target.value)}
            />
          </div>
          <div className="min-w-[8rem] flex-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="time">
              Tempo (min), opcional
            </label>
            <input
              id="time"
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={timeMin}
              onChange={(e) => setTimeMin(e.target.value)}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Insumos por lote</span>
            <button type="button" onClick={addLine} className="text-sm text-teal-700 hover:underline">
              + Linha
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <select
                  className="min-w-[12rem] flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
                  value={line.inventory_item_id}
                  onChange={(e) => setLine(i, { inventory_item_id: e.target.value })}
                >
                  <option value="">— insumo —</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {`${inv.name} (${inv.unit}${inv.has_sale_product ? " · catálogo" : ""})`}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Qtd"
                  className="w-24 rounded-md border border-slate-300 px-2 py-2 text-sm"
                  value={line.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                />
                {lines.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-red-600"
                    onClick={() => removeLine(i)}
                  >
                    remover
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "A guardar…" : "Guardar alterações"}
        </button>
      </form>
    </>
  );
}
