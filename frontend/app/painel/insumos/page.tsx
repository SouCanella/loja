"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { FieldTip } from "@/components/painel/FieldTip";
import {
  apiPainelJson,
  formatBRL,
  formatQty,
  PainelApiError,
} from "@/lib/painel-api";

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
  const [busyId, setBusyId] = useState<string | null>(null);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Insumos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Matéria-prima sem produto de venda — base para receitas e stock.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/painel/relatorio-estoque"
            className="text-sm text-teal-700 hover:underline"
          >
            Relatório de stock →
          </Link>
          <Link href="/painel" className="text-sm text-teal-700 hover:underline">
            ← Painel
          </Link>
        </div>
      </div>
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
              Nome
              <FieldTip text="Identificação da matéria-prima (ex.: farinha, embalagem). Aparece em receitas e movimentos." />
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
              Unidade
              <FieldTip text="Unidade de medida do stock (kg, L, un). Deve ser consistente com as quantidades nas receitas." />
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
              Qtd lote
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
              Custo / un.
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
        </div>
        <button
          type="submit"
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Adicionar insumo
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
            <tr>
              <th className="px-4 py-3">Insumo</th>
              <th className="px-4 py-3 text-right">
                <span className="inline-flex items-center">
                  Qtd disponível
                  <FieldTip text="Soma das quantidades em todos os lotes deste insumo." />
                </span>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="inline-flex items-center justify-end">
                  Custo médio / un.
                  <FieldTip text="Custo médio ponderado pelos lotes (quando há stock)." />
                </span>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="inline-flex items-center justify-end">
                  Valor em stock
                  <FieldTip text="Quantidade × custo por lote (aproximação do valor inventariado)." />
                </span>
              </th>
              <th className="px-4 py-3 text-right"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && !error ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Nenhum insumo ainda.
                </td>
              </tr>
            ) : null}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="max-w-[14rem] px-4 py-3">
                  <span className="font-medium text-slate-900">{r.name}</span>
                  <span className="text-slate-500"> ({r.unit})</span>
                  {r.has_sale_product ? (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      produto catálogo
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                  {formatQty(r.quantity_available)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                  {r.weighted_avg_unit_cost != null ? formatBRL(r.weighted_avg_unit_cost) : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                  {formatBRL(r.inventory_value)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => void remove(r.id)}
                    className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
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
