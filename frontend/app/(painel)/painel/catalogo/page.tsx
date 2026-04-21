"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { CatalogoNewProductForm } from "@/components/painel/catalogo/CatalogoNewProductForm";
import { CatalogoProductFilters } from "@/components/painel/catalogo/CatalogoProductFilters";
import { CatalogoProductsTable } from "@/components/painel/catalogo/CatalogoProductsTable";
import type { CatalogoCategory, CatalogoProduct } from "@/components/painel/catalogo/types";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";

export default function CatalogoPage() {
  const [rows, setRows] = useState<CatalogoProduct[]>([]);
  const [categories, setCategories] = useState<CatalogoCategory[]>([]);
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
  const [filterQuery, setFilterQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState("");

  const displayRows = useMemo(() => {
    let list = rows;
    const q = filterQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const name = p.name.toLowerCase();
        const desc = (p.description ?? "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }
    if (statusFilter === "active") list = list.filter((p) => p.active);
    else if (statusFilter === "inactive") list = list.filter((p) => !p.active);
    if (categoryFilter) list = list.filter((p) => p.category_id === categoryFilter);
    return list;
  }, [rows, filterQuery, statusFilter, categoryFilter]);

  const load = useCallback(() => {
    setErr(null);
    Promise.all([
      apiPainelJson<CatalogoProduct[]>("/api/v2/products?active_only=false"),
      apiPainelJson<CatalogoCategory[]>("/api/v2/categories"),
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

      <CatalogoNewProductForm
        categories={categories}
        newName={newName}
        newPrice={newPrice}
        newCat={newCat}
        newUnit={newUnit}
        newQty={newQty}
        newCost={newCost}
        newSpot={newSpot}
        newSale={newSale}
        creating={creating}
        onNewNameChange={setNewName}
        onNewPriceChange={setNewPrice}
        onNewCatChange={setNewCat}
        onNewUnitChange={setNewUnit}
        onNewQtyChange={setNewQty}
        onNewCostChange={setNewCost}
        onNewSpotChange={setNewSpot}
        onNewSaleChange={setNewSale}
        onSubmit={onCreateProduct}
      />

      <CatalogoProductFilters
        categories={categories}
        filterQuery={filterQuery}
        onFilterQueryChange={setFilterQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <CatalogoProductsTable
        rows={rows}
        displayRows={displayRows}
        categories={categories}
        err={err}
        saving={saving}
        patchProduct={patchProduct}
      />
    </>
  );
}
