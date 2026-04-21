"use client";

import Link from "next/link";
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

type Line = { inventory_item_id: string; quantity: string };

export default function NovaReceitaPage() {
  const [products, setProducts] = useState<ProductOut[]>([]);
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [productId, setProductId] = useState("");
  const [yieldQty, setYieldQty] = useState("1");
  const [timeMin, setTimeMin] = useState("");
  const [shelfLifeDays, setShelfLifeDays] = useState("");
  const [marginPct, setMarginPct] = useState("");
  const [lines, setLines] = useState<Line[]>([{ inventory_item_id: "", quantity: "1" }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void Promise.all([
      apiPainelJson<ProductOut[]>("/api/v2/products"),
      apiPainelJson<InvItem[]>("/api/v2/inventory-items"),
    ])
      .then(([p, inv]) => {
        setProducts(p);
        setInventory(inv);
      })
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Erro ao carregar dados");
      });
  }, []);

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
    setError(null);
    const pid = productId;
    if (!pid) {
      setError("Escolha o produto.");
      return;
    }
    const y = Number.parseFloat(yieldQty);
    if (Number.isNaN(y) || y <= 0) {
      setError("Rendimento inválido.");
      return;
    }
    const finished = products.find((p) => p.id === pid)?.inventory_item_id;
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
        product_id: pid,
        yield_quantity: yieldQty,
        time_minutes: timeMin ? Number.parseInt(timeMin, 10) : null,
        items,
      };
      if (marginPct.trim()) {
        const m = Number.parseFloat(marginPct.replace(",", "."));
        if (Number.isNaN(m) || m < 0 || m > 100) {
          setError("Margem % inválida (0–100).");
          setLoading(false);
          return;
        }
        payload.target_margin_percent = String(m);
      }
      if (shelfLifeDays.trim()) {
        const d = Number.parseInt(shelfLifeDays.trim(), 10);
        if (Number.isNaN(d) || d < 1) {
          setError("Validade (dias) deve ser um número inteiro ≥ 1.");
          setLoading(false);
          return;
        }
        payload.output_shelf_life_days = d;
      }
      await apiPainelJson("/api/v2/recipes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      window.location.href = "/painel/receitas";
    } catch (err: unknown) {
      setError(err instanceof PainelApiError ? err.message : "Não foi possível guardar.");
    } finally {
      setLoading(false);
    }
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
        <PainelTitleHelp tip="Indique o produto acabado, os insumos e o rendimento do lote. Depois de guardar, registe produções em Receitas → «Produzir lote».">
          <h1 className="text-2xl font-semibold text-slate-900">Nova receita</h1>
        </PainelTitleHelp>
      </PainelStickyHeading>
      <form
        id="nova-receita-form"
        className={`mt-4 ${painelPageContentWidthClass} space-y-4 pb-28 md:pb-32`}
        onSubmit={onSubmit}
      >
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="product">
            Produto acabado
          </label>
          <select
            id="product"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">— escolher —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[8rem] flex-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="marginR">
              Margem % (opcional)
            </label>
            <input
              id="marginR"
              type="text"
              inputMode="decimal"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={marginPct}
              onChange={(e) => setMarginPct(e.target.value)}
              placeholder="herda da loja"
            />
            <p className="mt-1 text-xs text-slate-500">Se vazio, usa a margem em Definições.</p>
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
            <FieldTipBeside tip="Se preencher, cada produção calcula a validade do lote como data da produção + estes dias. Vazio: sem regra automática de validade.">
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
            <span className="text-sm font-medium text-slate-700">Insumos</span>
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
        formId="nova-receita-form"
        submitLabel={loading ? "A guardar…" : "Guardar receita"}
        disabled={loading}
      />
    </>
  );
}
