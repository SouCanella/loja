"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { CatalogoNewProductForm } from "@/components/painel/catalogo/CatalogoNewProductForm";
import { CatalogoProductFilters } from "@/components/painel/catalogo/CatalogoProductFilters";
import { CatalogoProductsTable } from "@/components/painel/catalogo/CatalogoProductsTable";
import type { CatalogoCategory, CatalogoProduct } from "@/components/painel/catalogo/types";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { buildMenuCatalogText, type MenuCatalogSection } from "@/lib/painel-menu-catalog-text";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";
import { copyTextToClipboard } from "@/lib/painel-share-store";
import { painelBtnSecondaryClass } from "@/lib/painel-button-classes";

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
  const [newTrackInventory, setNewTrackInventory] = useState(true);
  const [creating, setCreating] = useState(false);
  const [meMenu, setMeMenu] = useState<{
    store_name: string;
    store_slug: string;
    vitrine_whatsapp: string | null;
  } | null>(null);
  const [menuMsg, setMenuMsg] = useState<string | null>(null);
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
    void Promise.allSettled([
      apiPainelJson<CatalogoProduct[]>("/api/v2/products?active_only=false"),
      apiPainelJson<CatalogoCategory[]>("/api/v2/categories"),
    ]).then((results) => {
      const msgs: string[] = [];
      if (results[0].status === "fulfilled") {
        setRows(results[0].value);
      } else {
        setRows([]);
        const e = results[0].reason;
        msgs.push(
          e instanceof PainelApiError
            ? `Produtos: ${e.message}`
            : "Produtos: erro ao carregar (verifique sessão, API e migrações da base de dados).",
        );
      }
      if (results[1].status === "fulfilled") {
        setCategories(results[1].value);
      } else {
        setCategories([]);
        const e = results[1].reason;
        msgs.push(
          e instanceof PainelApiError
            ? `Categorias: ${e.message}`
            : "Categorias: erro ao carregar.",
        );
      }
      if (msgs.length > 0) {
        setErr(msgs.join(" "));
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void apiPainelJson<{
      store_name: string;
      store_slug: string;
      vitrine_whatsapp: string | null;
    }>("/api/v2/me")
      .then(setMeMenu)
      .catch(() => {});
  }, []);

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
    if (newTrackInventory) {
      if (Number.isNaN(q) || q <= 0 || Number.isNaN(c) || c < 0) {
        setMsg("Stock inicial: quantidade deve ser maior que zero e custo unitário não negativo.");
        return;
      }
    }
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        name: n,
        price: String(price),
        track_inventory: newTrackInventory,
      };
      if (newTrackInventory) {
        payload.inventory = {
          unit: newUnit.trim() || "un",
          initial_quantity: String(q),
          unit_cost: String(c),
        };
      }
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
      setNewTrackInventory(true);
      setMsg("Produto criado.");
      void load();
    } catch (e: unknown) {
      setMsg(e instanceof PainelApiError ? e.message : "Não foi possível criar.");
    } finally {
      setCreating(false);
    }
  }

  function buildMenuSections(): MenuCatalogSection[] {
    const active = rows.filter((p) => p.active);
    const catName = (id: string | null) =>
      id ? categories.find((c) => c.id === id)?.name ?? "Outros" : "Sem categoria";
    const byCat = new Map<string, CatalogoProduct[]>();
    for (const p of active) {
      const k = catName(p.category_id);
      const cur = byCat.get(k);
      if (cur) cur.push(p);
      else byCat.set(k, [p]);
    }
    const sections: MenuCatalogSection[] = [];
    for (const [title, lines] of byCat.entries()) {
      lines.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      sections.push({
        title,
        lines: lines.map((l) => ({ name: l.name, price: l.price })),
      });
    }
    sections.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    return sections;
  }

  async function exportMenuText() {
    if (!meMenu) {
      setMenuMsg("A carregar dados da loja…");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin.replace(/\/$/, "")}/loja/${encodeURIComponent(meMenu.store_slug)}`;
    const text = buildMenuCatalogText({
      storeName: meMenu.store_name,
      storeUrl: url,
      vitrineWhatsapp: meMenu.vitrine_whatsapp,
      sections: buildMenuSections(),
    });
    const ok = await copyTextToClipboard(text);
    setMenuMsg(ok ? "Texto do cardápio copiado. Cole no WhatsApp ou Instagram." : "Não foi possível copiar.");
    window.setTimeout(() => setMenuMsg(null), 4000);
  }

  return (
    <>
      <PainelStickyHeading
        title="Produtos & catálogo"
        description="Preço, categoria, imagem e estado — o stock inicial do produto acabado fica no primeiro lote do insumo ligado (se controlar stock)."
      />

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}
      {msg ? (
        <p className={`mt-4 text-sm ${msg.includes("criado") ? "text-emerald-800" : "text-red-700"}`}>{msg}</p>
      ) : null}
      {menuMsg ? <p className="mt-2 text-sm text-slate-600">{menuMsg}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={painelBtnSecondaryClass} onClick={() => void exportMenuText()}>
          Gerar texto do cardápio (WhatsApp / Instagram)
        </button>
      </div>

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
        newTrackInventory={newTrackInventory}
        creating={creating}
        onNewNameChange={setNewName}
        onNewPriceChange={setNewPrice}
        onNewCatChange={setNewCat}
        onNewTrackInventoryChange={setNewTrackInventory}
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
