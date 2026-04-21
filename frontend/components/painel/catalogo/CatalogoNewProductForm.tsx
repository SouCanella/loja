"use client";

import { FormEvent } from "react";

import { FieldTipBeside } from "@/components/painel/FieldTip";
import { PanelCard } from "@/components/painel/PanelCard";
import { painelBtnPrimaryClass } from "@/lib/painel-button-classes";
import { painelPageContentWidthClass } from "@/lib/painel-layout-classes";

import type { CatalogoCategory } from "./types";

type Props = {
  categories: CatalogoCategory[];
  newName: string;
  newPrice: string;
  newCat: string;
  newTrackInventory: boolean;
  newUnit: string;
  newQty: string;
  newCost: string;
  newSpot: string;
  newSale: string;
  creating: boolean;
  onNewNameChange: (v: string) => void;
  onNewPriceChange: (v: string) => void;
  onNewCatChange: (v: string) => void;
  onNewTrackInventoryChange: (v: boolean) => void;
  onNewUnitChange: (v: string) => void;
  onNewQtyChange: (v: string) => void;
  onNewCostChange: (v: string) => void;
  onNewSpotChange: (v: string) => void;
  onNewSaleChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
};

export function CatalogoNewProductForm({
  categories,
  newName,
  newPrice,
  newCat,
  newTrackInventory,
  newUnit,
  newQty,
  newCost,
  newSpot,
  newSale,
  creating,
  onNewNameChange,
  onNewPriceChange,
  onNewCatChange,
  onNewTrackInventoryChange,
  onNewUnitChange,
  onNewQtyChange,
  onNewCostChange,
  onNewSpotChange,
  onNewSaleChange,
  onSubmit,
}: Props) {
  return (
    <form onSubmit={(e) => void onSubmit(e)} className={`mt-6 ${painelPageContentWidthClass}`}>
      <PanelCard>
        <h2 className="text-sm font-semibold text-slate-800">Novo produto</h2>
        <p className="mt-1 text-xs text-slate-500">
          {newTrackInventory
            ? "Cria o produto de venda e o respectivo insumo de stock com um lote inicial (custo e quantidade)."
            : "Produto sem controlo de stock (serviços, encomendas externas): não há baixa de lotes em pedidos."}
        </p>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="rounded border-slate-300"
            checked={newTrackInventory}
            onChange={(e) => onNewTrackInventoryChange(e.target.checked)}
          />
          <FieldTipBeside tip="Se desmarcar, o produto não tem insumo nem movimentos de stock (IP-14 / DEC-23).">
            Controlar stock deste produto
          </FieldTipBeside>
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-slate-600" htmlFor="pn">
              <FieldTipBeside tip="Nome do produto na vitrine e nos pedidos.">Nome</FieldTipBeside>
            </label>
            <input
              id="pn"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={newName}
              onChange={(e) => onNewNameChange(e.target.value)}
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
              onChange={(e) => onNewPriceChange(e.target.value)}
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
              onChange={(e) => onNewCatChange(e.target.value)}
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              value={newUnit}
              onChange={(e) => onNewUnitChange(e.target.value)}
              disabled={!newTrackInventory}
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              value={newQty}
              onChange={(e) => onNewQtyChange(e.target.value)}
              inputMode="decimal"
              disabled={!newTrackInventory}
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              value={newCost}
              onChange={(e) => onNewCostChange(e.target.value)}
              inputMode="decimal"
              disabled={!newTrackInventory}
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
              onChange={(e) => onNewSpotChange(e.target.value)}
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
              onChange={(e) => onNewSaleChange(e.target.value)}
            >
              <option value="in_stock">Disponível</option>
              <option value="order_only">Sob encomenda</option>
              <option value="unavailable">Indisponível</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={creating} className={`mt-4 ${painelBtnPrimaryClass}`}>
          {creating ? "A criar…" : "Criar produto"}
        </button>
      </PanelCard>
    </form>
  );
}
