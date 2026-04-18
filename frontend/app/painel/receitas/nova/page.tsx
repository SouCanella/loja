"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { apiPainelJson, PainelApiError } from "@/lib/painel-api";

type ProductOut = {
  id: string;
  name: string;
  inventory_item_id: string;
};

type InvItem = { id: string; name: string; unit: string };

type Line = { inventory_item_id: string; quantity: string };

export default function NovaReceitaPage() {
  const [products, setProducts] = useState<ProductOut[]>([]);
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [productId, setProductId] = useState("");
  const [yieldQty, setYieldQty] = useState("1");
  const [timeMin, setTimeMin] = useState("");
  const [lines, setLines] = useState<Line[]>([{ inventory_item_id: "", quantity: "1" }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void Promise.all([
      apiPainelJson<ProductOut[]>("/api/v1/products"),
      apiPainelJson<InvItem[]>("/api/v1/inventory-items"),
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
      await apiPainelJson("/api/v1/recipes", {
        method: "POST",
        body: JSON.stringify({
          product_id: pid,
          yield_quantity: yieldQty,
          time_minutes: timeMin ? Number.parseInt(timeMin, 10) : null,
          items,
        }),
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
      <Link href="/painel/receitas" className="text-sm text-teal-700 hover:underline">
        ← Receitas
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">Nova receita</h1>
      <p className="mt-1 text-sm text-slate-500">
        Define insumos para um rendimento (lote). Depois use &quot;Produzir lote&quot; na lista.
      </p>
      <form className="mt-6 max-w-lg space-y-4" onSubmit={onSubmit}>
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
            <span className="text-sm font-medium text-slate-700">Insumos</span>
            <button
              type="button"
              onClick={addLine}
              className="text-sm text-teal-700 hover:underline"
            >
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
                      {inv.name} ({inv.unit})
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
          {loading ? "A guardar…" : "Guardar receita"}
        </button>
      </form>
    </>
  );
}
