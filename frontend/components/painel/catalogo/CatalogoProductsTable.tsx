"use client";

import { ImageUploadButton } from "@/components/painel/ImageUploadButton";
import { formatBRL } from "@/lib/painel-api";
import {
  painelTableCellClass,
  painelTableClassWide,
  painelTableTbodyClass,
  painelTableTheadClass,
  painelTableWrapClass,
} from "@/lib/painel-table-classes";

import type { CatalogoCategory, CatalogoProduct } from "./types";

type Props = {
  rows: CatalogoProduct[];
  displayRows: CatalogoProduct[];
  categories: CatalogoCategory[];
  err: string | null;
  saving: string | null;
  patchProduct: (id: string, body: Record<string, unknown>) => Promise<void>;
};

export function CatalogoProductsTable({
  rows,
  displayRows,
  categories,
  err,
  saving,
  patchProduct,
}: Props) {
  return (
    <div className={`mt-8 ${painelTableWrapClass}`}>
      <table className={painelTableClassWide}>
        <thead className={painelTableTheadClass}>
          <tr>
            <th className={painelTableCellClass}>Produto</th>
            <th className={painelTableCellClass}>Categoria</th>
            <th className={painelTableCellClass}>Destaque</th>
            <th className={painelTableCellClass}>Venda</th>
            <th className={painelTableCellClass}>URL da imagem</th>
            <th className={`${painelTableCellClass} text-right`}>Preço</th>
            <th className={`${painelTableCellClass} text-center`}>Activo</th>
          </tr>
        </thead>
        <tbody className={painelTableTbodyClass}>
          {rows.length > 0 && displayRows.length === 0 ? (
            <tr>
              <td colSpan={7} className={`${painelTableCellClass} py-8 text-center text-slate-500`}>
                Nenhum produto corresponde aos filtros.
              </td>
            </tr>
          ) : null}
          {displayRows.map((p) => (
            <tr key={p.id} className={saving === p.id ? "opacity-60" : undefined}>
              <td className={`max-w-[12rem] ${painelTableCellClass} align-top`}>
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
              <td className={`${painelTableCellClass} align-top`}>
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
              <td className={`${painelTableCellClass} align-top`}>
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
              <td className={`${painelTableCellClass} align-top`}>
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
              <td className={`max-w-md ${painelTableCellClass} align-top`}>
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
              <td className={`${painelTableCellClass} text-right align-top`}>
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
              <td className={`${painelTableCellClass} text-center align-top`}>
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
  );
}
