"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { FieldTipBeside, PainelTitleHelp } from "@/components/painel/FieldTip";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import {
  apiPainelJson,
  formatBRL,
  formatQty,
  PainelApiError,
} from "@/lib/painel-api";
import { painelBtnDangerCompactClass, painelBtnPrimaryClass } from "@/lib/painel-button-classes";
import {
  painelFilterBarClass,
  painelFilterFieldColClass,
  painelFilterLabelClass,
  painelFilterSearchInputClass,
} from "@/lib/painel-filter-classes";
import {
  painelTableCellClass,
  painelTableClass,
  painelTableTbodyClass,
  painelTableTheadClass,
  painelTableWrapClass,
} from "@/lib/painel-table-classes";

type InvRow = {
  id: string;
  name: string;
  unit: string;
  has_sale_product?: boolean;
  quantity_available: string;
  weighted_avg_unit_cost: string | null;
  inventory_value: string;
};

export default function InsumosPage() {
  const [rows, setRows] = useState<InvRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("un");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");

  const displayRows = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.unit.toLowerCase().includes(q));
  }, [rows, filterQuery]);

  const load = useCallback(() => {
    setError(null);
    apiPainelJson<InvRow[]>("/api/v2/inventory-items")
      .then(setRows)
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Erro ao carregar");
      });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const n = name.trim();
    if (!n) {
      setMsg("Indique o nome.");
      return;
    }
    const body: Record<string, unknown> = { name: n, unit: unit.trim() || "un" };
    if (qty && cost) {
      const q = Number.parseFloat(qty.replace(",", "."));
      const c = Number.parseFloat(cost.replace(",", "."));
      if (Number.isNaN(q) || q <= 0 || Number.isNaN(c) || c < 0) {
        setMsg("Lote inicial: quantidade e custo inválidos.");
        return;
      }
      body.initial_batch = { quantity: String(q), unit_cost: String(c) };
      if (expirationDate.trim()) {
        (body.initial_batch as Record<string, string>).expiration_date = expirationDate.trim();
      }
    } else if (qty || cost) {
      setMsg("Lote inicial: preencha quantidade e custo unitário, ou deixe vazio.");
      return;
    }
    try {
      await apiPainelJson("/api/v2/inventory-items", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setName("");
      setQty("");
      setCost("");
      setExpirationDate("");
      setMsg("Insumo criado.");
      void load();
    } catch (err: unknown) {
      setMsg(err instanceof PainelApiError ? err.message : "Não foi possível criar.");
    }
  }

  async function remove(id: string) {
    if (
      !window.confirm(
        "Remover este insumo? (Só é permitido se não estiver em receitas nem ligado a produto.)",
      )
    ) {
      return;
    }
    setBusyId(id);
    setMsg(null);
    try {
      await apiPainelJson(`/api/v2/inventory-items/${id}`, { method: "DELETE" });
      setMsg("Removido.");
      void load();
    } catch (err: unknown) {
      setMsg(err instanceof PainelApiError ? err.message : "Não foi possível remover.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PainelStickyHeading>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PainelTitleHelp tip="Insumos são matérias-primas e itens sem ficha de produto de venda; servem de base às receitas e ao stock.">
            <h1 className="text-2xl font-semibold text-slate-900">Insumos</h1>
          </PainelTitleHelp>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/painel/relatorio-estoque"
              className="text-sm text-painel-primary hover:underline"
            >
              Relatório de stock →
            </Link>
            <Link href="/painel" className="text-sm text-painel-primary hover:underline">
              ← Painel
            </Link>
          </div>
        </div>

        <div className={painelFilterBarClass}>
          <div className={`min-w-[12rem] flex-1 sm:max-w-md ${painelFilterFieldColClass}`}>
            <label className={painelFilterLabelClass} htmlFor="insumos-filter">
              Pesquisar insumo
            </label>
            <input
              id="insumos-filter"
              type="search"
              autoComplete="off"
              placeholder="Nome ou unidade…"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className={painelFilterSearchInputClass}
            />
          </div>
        </div>
      </PainelStickyHeading>
      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}
      {msg ? (
        <p
          className={`mt-4 text-sm ${msg.includes("Removido") || msg.includes("criado") ? "text-emerald-800" : "text-red-700"}`}
        >
          {msg}
        </p>
      ) : null}

      <form
        className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        onSubmit={(e) => void onCreate(e)}
      >
        <h2 className="text-sm font-semibold text-slate-800">Novo insumo</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="min-w-[10rem] flex-1">
            <label className="block text-xs font-medium text-slate-600" htmlFor="nm">
              <FieldTipBeside tip="Nome do insumo (ex.: farinha, embalagem). Usado em receitas e no registo de movimentos.">
                Nome
              </FieldTipBeside>
            </label>
            <input
              id="nm"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex.: Farinha T55"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-slate-600" htmlFor="un">
              <FieldTipBeside tip="Unidade de stock (kg, L, un, etc.). Deve coincidir com as quantidades nas receitas.">
                Unidade
              </FieldTipBeside>
            </label>
            <input
              id="un"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Lote inicial (opcional): cria stock e custo médio no primeiro lote.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <div className="w-28">
            <label className="block text-xs font-medium text-slate-600" htmlFor="q">
              <FieldTipBeside tip="Quantidade e custo do primeiro lote; base para o custo médio e para consumo por ordem de validade (FEFO).">
                Qtd lote
              </FieldTipBeside>
            </label>
            <input
              id="q"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-slate-600" htmlFor="c">
              <FieldTipBeside tip="Custo por unidade deste lote (custo de aquisição, não preço de venda).">
                Custo / un.
              </FieldTipBeside>
            </label>
            <input
              id="c"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
            />
          </div>
          <div className="min-w-[10rem]">
            <label className="block text-xs font-medium text-slate-600" htmlFor="exp">
              <FieldTipBeside tip="Opcional. Validade do lote para consumo por ordem de data. Só tem efeito se existir lote inicial.">
                Validade do lote
              </FieldTipBeside>
            </label>
            <input
              id="exp"
              type="date"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className={`mt-4 ${painelBtnPrimaryClass}`}>
          Adicionar insumo
        </button>
      </form>

      <div className={`mt-8 ${painelTableWrapClass}`}>
        <table className={painelTableClass}>
          <thead className={painelTableTheadClass}>
            <tr>
              <th className={painelTableCellClass}>Insumo</th>
              <th className={`${painelTableCellClass} text-right`}>
                <FieldTipBeside align="end" tip="Stock total: soma das quantidades de todos os lotes.">
                  Qtd disponível
                </FieldTipBeside>
              </th>
              <th className={`${painelTableCellClass} text-right`}>
                <FieldTipBeside align="end" tip="Custo médio ponderado dos lotes em stock.">
                  Custo médio / un.
                </FieldTipBeside>
              </th>
              <th className={`${painelTableCellClass} text-right`}>
                <FieldTipBeside align="end" tip="Valor aproximado do stock (quantidade × custo por lote).">
                  Valor em stock
                </FieldTipBeside>
              </th>
              <th className={`${painelTableCellClass} text-right`}> </th>
            </tr>
          </thead>
          <tbody className={painelTableTbodyClass}>
            {rows.length === 0 && !error ? (
              <tr>
                <td colSpan={5} className={`${painelTableCellClass} py-8 text-center text-slate-500`}>
                  Nenhum insumo ainda.
                </td>
              </tr>
            ) : null}
            {rows.length > 0 && displayRows.length === 0 ? (
              <tr>
                <td colSpan={5} className={`${painelTableCellClass} py-8 text-center text-slate-500`}>
                  Nenhum insumo corresponde a «{filterQuery.trim()}».
                </td>
              </tr>
            ) : null}
            {displayRows.map((r) => (
              <tr key={r.id}>
                <td className={`max-w-[14rem] ${painelTableCellClass}`}>
                  <span className="font-medium text-slate-900">{r.name}</span>
                  <span className="text-slate-500"> ({r.unit})</span>
                  {r.has_sale_product ? (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      produto catálogo
                    </span>
                  ) : null}
                </td>
                <td className={`${painelTableCellClass} text-right tabular-nums text-slate-800`}>
                  {formatQty(r.quantity_available)}
                </td>
                <td className={`${painelTableCellClass} text-right tabular-nums text-slate-700`}>
                  {r.weighted_avg_unit_cost != null ? formatBRL(r.weighted_avg_unit_cost) : "—"}
                </td>
                <td className={`${painelTableCellClass} text-right tabular-nums text-slate-800`}>
                  {formatBRL(r.inventory_value)}
                </td>
                <td className={`${painelTableCellClass} text-right`}>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => void remove(r.id)}
                    className={painelBtnDangerCompactClass}
                  >
                    {busyId === r.id ? "…" : "Remover"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-xs text-slate-500">
        Dica: custo em stock vem dos lotes (entradas). O lote inicial no formulário só preenche o primeiro lote ao criar.
      </p>
    </>
  );
}
