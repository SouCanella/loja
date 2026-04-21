"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { FieldTipBeside } from "@/components/painel/FieldTip";
import { ImageUploadButton } from "@/components/painel/ImageUploadButton";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, formatBRL, PainelApiError } from "@/lib/painel-api";
import { painelBtnPrimaryClass } from "@/lib/painel-button-classes";

type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  active: boolean;
  catalog_spotlight: string | null;
  catalog_sale_mode: string;
};

type Category = { id: string; name: string; slug: string };

export default function CatalogoPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newUnit, setNewUnit] = useState("un");
  const [newQty, setNewQty] = useState("1");
  const [newCost, setNewCost] = useState("0");
  const [newSpot, setNewSpot] = useState("");
  const [newSale, setNewSale] = useState("in_stock");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setErr(null);
    Promise.all([
      apiPainelJson<Product[]>("/api/v2/products?active_only=false"),
      apiPainelJson<Category[]>("/api/v2/categories"),
    ])
      .then(([p, c]) => {
        setRows(p);
        setCategories(c);
      })
      .catch((e: unknown) => {
        setErr(e instanceof PainelApiError ? e.message : "Erro ao carregar produtos.");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patchProduct(id: string, body: Record<string, unknown>) {
    setSaving(id);
    setErr(null);
    try {
      await apiPainelJson(`/api/v2/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await load();
    } catch (e: unknown) {
      setErr(e instanceof PainelApiError ? e.message : "Erro ao guardar.");
    } finally {
      setSaving(null);
    }
  }

  async function onCreateProduct(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const n = newName.trim();
    if (!n) {
      setMsg("Indique o nome do produto.");
      return;
    }
    const price = Number.parseFloat(newPrice.replace(",", "."));
    if (Number.isNaN(price) || price < 0) {
      setMsg("Preço inválido.");
      return;
    }
    const q = Number.parseFloat(newQty.replace(",", "."));
    const c = Number.parseFloat(newCost.replace(",", "."));
    if (Number.isNaN(q) || q <= 0 || Number.isNaN(c) || c < 0) {
      setMsg("Stock inicial: quantidade deve ser maior que zero e custo unitário não negativo.");
      return;
    }
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        name: n,
        price: String(price),
        inventory: {
          unit: newUnit.trim() || "un",
          initial_quantity: String(q),
          unit_cost: String(c),
        },
      };
      if (newCat) payload.category_id = newCat;
      if (newSpot) payload.catalog_spotlight = newSpot;
      payload.catalog_sale_mode = newSale;
      await apiPainelJson("/api/v2/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setNewName("");
      setNewPrice("");
      setNewCat("");
      setNewUnit("un");
      setNewQty("1");
      setNewCost("0");
      setNewSpot("");
      setNewSale("in_stock");
      setMsg("Produto criado.");
      void load();
    } catch (e: unknown) {
      setMsg(e instanceof PainelApiError ? e.message : "Não foi possível criar.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <PainelStickyHeading
        title="Produtos & catálogo"
        description="Preço, categoria, imagem e estado — o stock inicial do produto acabado fica no primeiro lote do insumo ligado."
      />

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}
      {msg ? (
        <p className={`mt-4 text-sm ${msg.includes("criado") ? "text-emerald-800" : "text-red-700"}`}>{msg}</p>
      ) : null}

      <form
        onSubmit={(e) => void onCreateProduct(e)}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-slate-800">Novo produto</h2>
        <p className="mt-1 text-xs text-slate-500">
          Cria o produto de venda e o respectivo insumo de stock com um lote inicial (custo e quantidade).
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-slate-600" htmlFor="pn">
              <FieldTipBeside tip="Nome do produto na vitrine e nos pedidos.">Nome</FieldTipBeside>
            </label>
            <input
              id="pn"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600" htmlFor="pp">
              <FieldTipBeside tip="Preço público do produto (BRL).">Preço de venda</FieldTipBeside>
            </label>
            <input
              id="pp"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600" htmlFor="pc">
              <FieldTipBeside tip="Opcional. Agrupa na vitrine e nos relatórios por categoria.">
                Categoria
              </FieldTipBeside>
            </label>
            <select
              id="pc"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            >
              <option value="">— Nenhuma —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600" htmlFor="pu">
              <FieldTipBeside tip="Unidade do lote de produto acabado (ex.: un, caixa).">
                Unidade (stock)
              </FieldTipBeside>
            </label>
            <input
              id="pu"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600" htmlFor="pq">
              <FieldTipBeside tip="Quantidade do primeiro lote de stock de produto acabado (insumo ligado ao produto).">
                Qtd inicial (lote)
              </FieldTipBeside>
            </label>
            <input
              id="pq"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600" htmlFor="pco">
              <FieldTipBeside tip="Custo por unidade desse lote inicial (valorização e custos no painel).">
                Custo unit. do lote
              </FieldTipBeside>
            </label>
            <input
              id="pco"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600" htmlFor="psp">
              <FieldTipBeside tip="Opcional: aparece na secção «Em destaque» e como fita no card.">
                Destaque na vitrine
              </FieldTipBeside>
            </label>
            <select
              id="psp"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={newSpot}
              onChange={(e) => setNewSpot(e.target.value)}
            >
              <option value="">— Nenhum —</option>
              <option value="featured">Destaque</option>
              <option value="new">Novidade</option>
              <option value="bestseller">Mais vendido</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600" htmlFor="psm">
              <FieldTipBeside tip="Sob encomenda: fita e ainda encomendável; indisponível: bloqueia adicionar ao carrinho.">
                Disponibilidade
              </FieldTipBeside>
            </label>
            <select
              id="psm"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={newSale}
              onChange={(e) => setNewSale(e.target.value)}
            >
              <option value="in_stock">Disponível</option>
              <option value="order_only">Sob encomenda</option>
              <option value="unavailable">Indisponível</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={creating}
          className={`mt-4 ${painelBtnPrimaryClass}`}
        >
          {creating ? "A criar…" : "Criar produto"}
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1100px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Destaque</th>
              <th className="px-4 py-3">Venda</th>
              <th className="px-4 py-3">URL da imagem</th>
              <th className="px-4 py-3 text-right">Preço</th>
              <th className="px-4 py-3 text-center">Activo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => (
              <tr key={p.id} className={saving === p.id ? "opacity-60" : undefined}>
                <td className="max-w-[12rem] px-4 py-3 align-top">
                  <input
                    className="w-full rounded border border-slate-200 px-2 py-1 font-medium text-slate-900"
                    defaultValue={p.name}
                    disabled={saving === p.id}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== p.name) void patchProduct(p.id, { name: v });
                    }}
                  />
                  <textarea
                    className="mt-2 w-full rounded border border-slate-100 px-2 py-1 text-xs text-slate-600"
                    rows={2}
                    defaultValue={p.description ?? ""}
                    disabled={saving === p.id}
                    placeholder="Descrição (opcional)"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      const cur = p.description ?? "";
                      if (v !== cur) void patchProduct(p.id, { description: v || null });
                    }}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <select
                    className="max-w-[10rem] rounded border border-slate-200 px-2 py-1 text-xs"
                    value={p.category_id ?? ""}
                    disabled={saving === p.id}
                    onChange={(e) => {
                      const v = e.target.value;
                      void patchProduct(p.id, {
                        category_id: v ? v : null,
                      });
                    }}
                  >
                    <option value="">— Nenhuma —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 align-top">
                  <select
                    className="max-w-[9rem] rounded border border-slate-200 px-2 py-1 text-xs"
                    value={p.catalog_spotlight ?? ""}
                    disabled={saving === p.id}
                    onChange={(e) => {
                      const v = e.target.value;
                      void patchProduct(p.id, {
                        catalog_spotlight: v ? v : null,
                      });
                    }}
                  >
                    <option value="">— Nenhum —</option>
                    <option value="featured">Destaque</option>
                    <option value="new">Novidade</option>
                    <option value="bestseller">Mais vendido</option>
                  </select>
                </td>
                <td className="px-4 py-3 align-top">
                  <select
                    className="max-w-[9rem] rounded border border-slate-200 px-2 py-1 text-xs"
                    value={p.catalog_sale_mode ?? "in_stock"}
                    disabled={saving === p.id}
                    onChange={(e) => void patchProduct(p.id, { catalog_sale_mode: e.target.value })}
                  >
                    <option value="in_stock">Disponível</option>
                    <option value="order_only">Sob encomenda</option>
                    <option value="unavailable">Indisponível</option>
                  </select>
                </td>
                <td className="max-w-md px-4 py-3 align-top">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <input
                      key={`${p.id}-img-${p.image_url ?? ""}`}
                      type="url"
                      className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                      defaultValue={p.image_url ?? ""}
                      placeholder="https://…"
                      disabled={saving === p.id}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (p.image_url ?? "")) void patchProduct(p.id, { image_url: v || null });
                      }}
                    />
                    <ImageUploadButton
                      purpose="product"
                      disabled={saving === p.id}
                      label="Enviar"
                      onUploaded={(url) => void patchProduct(p.id, { image_url: url })}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <input
                    className="w-24 rounded border border-slate-200 px-2 py-1 text-right tabular-nums"
                    defaultValue={p.price}
                    disabled={saving === p.id}
                    inputMode="decimal"
                    onBlur={(e) => {
                      const raw = e.target.value.replace(",", ".").trim();
                      const n = Number.parseFloat(raw);
                      if (Number.isNaN(n) || n < 0) return;
                      if (String(p.price) !== String(n)) void patchProduct(p.id, { price: String(n) });
                    }}
                  />
                  <div className="mt-1 text-xs text-slate-500">{formatBRL(p.price)}</div>
                </td>
                <td className="px-4 py-3 text-center align-top">
                  <input
                    key={`${p.id}-${p.active ? "1" : "0"}`}
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    defaultChecked={p.active}
                    disabled={saving === p.id}
                    onChange={(e) => {
                      void patchProduct(p.id, { active: e.target.checked });
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !err ? <p className="p-6 text-sm text-slate-500">Sem produtos.</p> : null}
      </div>
    </>
  );
}
