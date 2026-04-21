"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { FieldTipBeside, PainelTitleHelp } from "@/components/painel/FieldTip";
import { PainelFormSaveBar } from "@/components/painel/PainelFormSaveBar";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";
import { painelBtnDangerCompactClass, painelBtnLinkClass } from "@/lib/painel-button-classes";
import { painelPageContentWidthClass } from "@/lib/painel-layout-classes";

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
  output_shelf_life_days: number | null;
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
  const [shelfLifeDays, setShelfLifeDays] = useState("");
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
        setShelfLifeDays(
          r.output_shelf_life_days != null ? String(r.output_shelf_life_days) : "",
        );
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
      if (shelfLifeDays.trim()) {
        const d = Number.parseInt(shelfLifeDays.trim(), 10);
        if (Number.isNaN(d) || d < 1) {
          setError("Validade (dias) deve ser um número inteiro ≥ 1.");
          setLoading(false);
          return;
        }
        payload.output_shelf_life_days = d;
      } else {
        payload.output_shelf_life_days = null;
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
        <Link href="/painel/receitas" className="text-sm text-painel-primary hover:underline">
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
      <PainelStickyHeading
        leading={
          <Link href="/painel/receitas" className="text-painel-primary hover:underline">
            ← Receitas
          </Link>
        }
      >
        <PainelTitleHelp
          tip={`Produto acabado: ${productLabel}. O produto associado à receita não pode ser alterado neste ecrã.`}
        >
          <h1 className="text-2xl font-semibold text-slate-900">Editar receita</h1>
        </PainelTitleHelp>
      </PainelStickyHeading>

      <form
        id="editar-receita-form"
        className={`mt-4 ${painelPageContentWidthClass} space-y-4 pb-28 md:pb-32`}
        onSubmit={onSubmit}
      >
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <FieldTipBeside tip="Receitas inactivas não aparecem em «Produzir lote» até voltarem a estar activas.">
              Receita activa
            </FieldTipBeside>
          </label>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[8rem] flex-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="marginR">
              <FieldTipBeside tip="Percentagem de margem sobre o custo estimado. Vazio + opção abaixo: usar a margem alvo definida na configuração da loja.">
                Margem % (receita)
              </FieldTipBeside>
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
          <label className="block text-sm font-medium text-slate-700" htmlFor="shelf">
            <FieldTipBeside tip="Validade do lote = data da produção + dias indicados. Vazio: remove esta regra para esta receita.">
              Validade produto acabado (dias após produção), opcional
            </FieldTipBeside>
          </label>
          <input
            id="shelf"
            type="number"
            min={1}
            className="mt-1 w-full max-w-xs rounded-md border border-slate-300 px-3 py-2"
            value={shelfLifeDays}
            onChange={(e) => setShelfLifeDays(e.target.value)}
            placeholder="ex.: 7"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Insumos por lote</span>
            <button type="button" onClick={addLine} className={painelBtnLinkClass}>
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
                    className={painelBtnDangerCompactClass}
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
      </form>
      <PainelFormSaveBar
        formId="editar-receita-form"
        submitLabel={loading ? "A guardar…" : "Guardar alterações"}
        disabled={loading}
      />
    </>
  );
}
