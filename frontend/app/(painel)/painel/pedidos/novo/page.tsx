"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, formatBRL, PainelApiError } from "@/lib/painel-api";
import { painelBtnDangerClass, painelBtnLinkClass, painelBtnPrimaryClass, painelBtnSecondaryClass } from "@/lib/painel-button-classes";

type ProductRow = {
  id: string;
  name: string;
  price: string;
  active: boolean;
};

type Line = {
  product_id: string;
  quantity: string;
};

type OrderDetail = {
  id: string;
};

export default function PainelPedidoNovoPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [lines, setLines] = useState<Line[]>([{ product_id: "", quantity: "1" }]);
  const [customerNote, setCustomerNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void apiPainelJson<ProductRow[]>("/api/v2/products")
      .then((list) => setProducts(list.filter((p) => p.active)))
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Não foi possível carregar produtos.");
      });
  }, []);

  function addLine() {
    setLines((prev) => [...prev, { product_id: "", quantity: "1" }]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const items: { product_id: string; quantity: string }[] = [];
    for (const line of lines) {
      if (!line.product_id) {
        setError("Seleccione um produto em cada linha.");
        return;
      }
      const q = Number.parseFloat(line.quantity.replace(",", "."));
      if (Number.isNaN(q) || q <= 0) {
        setError("Quantidade inválida (use um número maior que zero).");
        return;
      }
      items.push({ product_id: line.product_id, quantity: String(q) });
    }
    if (items.length === 0) {
      setError("Adicione pelo menos um item.");
      return;
    }
    setSaving(true);
    try {
      const created = await apiPainelJson<OrderDetail>("/api/v2/orders", {
        method: "POST",
        headers: {
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          items,
          customer_note: customerNote.trim() || null,
        }),
      });
      router.push(`/painel/pedidos/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof PainelApiError ? err.message : "Não foi possível criar o pedido.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PainelStickyHeading>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Novo pedido</h1>
            <p className="mt-1 text-sm text-slate-500">
              Cria um pedido em rascunho com os preços actuais do catálogo. Depois pode alterar o
              estado na página do pedido.
            </p>
          </div>
          <Link
            href="/painel/pedidos"
            className="text-sm font-medium text-painel-primary hover:text-painel-primary-strong"
          >
            ← Pedidos
          </Link>
        </div>
      </PainelStickyHeading>

      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}

      {products === null ? (
        <p className="mt-8 text-sm text-slate-500">A carregar produtos…</p>
      ) : products.length === 0 ? (
        <p className="mt-8 text-sm text-amber-800">
          Não há produtos activos. Crie produtos no catálogo antes de registar pedidos manuais.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-6">
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Itens</h2>
            {lines.map((line, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-md border border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:items-end"
              >
                <label className="block flex-1 text-sm">
                  <span className="text-slate-600">Produto</span>
                  <select
                    required
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    value={line.product_id}
                    onChange={(e) => updateLine(index, { product_id: e.target.value })}
                  >
                    <option value="">— Escolher —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatBRL(p.price)})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block w-full sm:w-32 text-sm">
                  <span className="text-slate-600">Qtd.</span>
                  <input
                    type="number"
                    min={0.001}
                    step="any"
                    required
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  disabled={lines.length <= 1}
                  className={painelBtnDangerClass}
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLine}
              className={painelBtnLinkClass}
            >
              + Adicionar linha
            </button>
          </div>

          <label className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-sm font-semibold text-slate-900">Nota do cliente (opcional)</span>
            <textarea
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              rows={3}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Ex.: entregar após as 18h"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className={painelBtnPrimaryClass}
            >
              {saving ? "A criar…" : "Criar pedido"}
            </button>
            <Link
              href="/painel/pedidos"
              className={`inline-flex items-center justify-center ${painelBtnSecondaryClass}`}
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
