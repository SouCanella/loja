"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { FieldTip } from "@/components/painel/FieldTip";
import { FinancialReportCharts } from "@/components/painel/FinancialReportCharts";
import { MarginVolumeScatter } from "@/components/painel/MarginVolumeScatter";
import {
  apiPainelJson,
  formatBRL,
  formatPercent,
  orderStatusLabel,
  PainelApiError,
} from "@/lib/painel-api";

type ProductRow = {
  product_id: string;
  product_name: string;
  orders_revenue: string;
  quantity_sold: string;
  production_input_cost: string;
  margin_amount: string;
  margin_percent: string | null;
};

type CategoryRow = {
  category_id: string | null;
  category_name: string;
  orders_revenue: string;
  quantity_sold: string;
  production_input_cost: string;
  margin_amount: string;
  margin_percent: string | null;
};

type StatusRow = {
  status: string;
  orders_count: number;
  orders_revenue: string;
};

type Report = {
  date_from: string;
  date_to: string;
  orders_revenue: string;
  orders_count: number;
  production_runs_count: number;
  production_input_cost: string;
  period_margin_estimate: string;
  period_margin_percent: string | null;
  by_product: ProductRow[];
  by_category: CategoryRow[];
  by_order_status: StatusRow[];
};

function formatLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return { from: formatLocalIsoDate(from), to: formatLocalIsoDate(to) };
}

type Preset = "today" | "7d" | "30d" | "month" | "prev_month";

function applyPreset(p: Preset): { from: string; to: string } {
  const today = new Date();
  const to = formatLocalIsoDate(today);
  if (p === "today") {
    return { from: to, to };
  }
  if (p === "7d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: formatLocalIsoDate(from), to };
  }
  if (p === "30d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { from: formatLocalIsoDate(from), to };
  }
  if (p === "month") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: formatLocalIsoDate(from), to };
  }
  const endPrev = new Date(today.getFullYear(), today.getMonth(), 0);
  const startPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return { from: formatLocalIsoDate(startPrev), to: formatLocalIsoDate(endPrev) };
}

function num(s: string): number {
  const n = Number.parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

type SortKey = "name" | "revenue" | "qty" | "cost" | "margin" | "marginPct";

function SortTh({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-2 ${align === "right" ? "text-right" : "text-left"} cursor-pointer select-none hover:bg-slate-100`}
      onClick={onClick}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? <span className="text-slate-400">{dir === "asc" ? "↑" : "↓"}</span> : null}
      </span>
    </th>
  );
}

function csvEscape(s: string): string {
  return s.includes(",") || s.includes("\n") || s.includes('"')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export default function RelatorioPage() {
  const def = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(def.from);
  const [to, setTo] = useState(def.to);
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const normalizedRange = useMemo(() => {
    if (from <= to) return { from, to };
    return { from: to, to: from };
  }, [from, to]);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    const q = new URLSearchParams();
    q.set("date_from", normalizedRange.from);
    q.set("date_to", normalizedRange.to);
    void apiPainelJson<Report>(`/api/v2/reports/financial?${q.toString()}`)
      .then(setData)
      .catch((e: unknown) => {
        setError(e instanceof PainelApiError ? e.message : "Erro ao carregar");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [normalizedRange.from, normalizedRange.to]);

  useEffect(() => {
    void load();
  }, [load]);

  const rangeSwapped = from > to;

  const paretoByProduct = useMemo(() => {
    if (!data) return new Map<string, string>();
    const sorted = [...data.by_product].sort((a, b) => num(b.orders_revenue) - num(a.orders_revenue));
    let cum = 0;
    const total = num(data.orders_revenue);
    const map = new Map<string, string>();
    for (const r of sorted) {
      cum += num(r.orders_revenue);
      const pct = total > 0 ? (cum / total) * 100 : 0;
      map.set(r.product_id, pct.toFixed(1));
    }
    return map;
  }, [data]);

  const sortedProducts = useMemo(() => {
    if (!data) return [];
    const rows = [...data.by_product];
    const mult = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return mult * a.product_name.localeCompare(b.product_name, "pt-BR");
        case "revenue":
          return mult * (num(a.orders_revenue) - num(b.orders_revenue));
        case "qty":
          return mult * (num(a.quantity_sold) - num(b.quantity_sold));
        case "cost":
          return mult * (num(a.production_input_cost) - num(b.production_input_cost));
        case "margin":
          return mult * (num(a.margin_amount) - num(b.margin_amount));
        case "marginPct": {
          const pa = a.margin_percent != null ? num(a.margin_percent) : -Infinity;
          const pb = b.margin_percent != null ? num(b.margin_percent) : -Infinity;
          return mult * (pa - pb);
        }
        default:
          return 0;
      }
    });
    return rows;
  }, [data, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const maxStatusRev = useMemo(() => {
    if (!data?.by_order_status.length) return 0;
    return Math.max(...data.by_order_status.map((s) => num(s.orders_revenue)), 1);
  }, [data]);

  const productTotals = useMemo(() => {
    if (!data?.by_product.length) return null;
    let qty = 0;
    let rev = 0;
    let cost = 0;
    let margin = 0;
    for (const r of data.by_product) {
      qty += num(r.quantity_sold);
      rev += num(r.orders_revenue);
      cost += num(r.production_input_cost);
      margin += num(r.margin_amount);
    }
    const mPct = rev > 0 ? ((margin / rev) * 100).toFixed(1) : null;
    return { qty, rev, cost, margin, mPct };
  }, [data]);

  function downloadCsv() {
    if (!data) return;
    const lines: string[] = [];
    const push = (cells: string[]) => {
      lines.push(cells.map(csvEscape).join(","));
    };
    push([
      "bloco",
      "periodo_inicio",
      "periodo_fim",
      "metrica",
      "valor",
      "produto_id",
      "nome",
      "qtd",
      "receita",
      "custo_producao",
      "margem",
      "margem_pct",
      "estado_pedido",
      "pedidos",
      "categoria_id",
    ]);
    push([
      "resumo",
      data.date_from,
      data.date_to,
      "receita_pedidos",
      data.orders_revenue,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    push([
      "resumo",
      data.date_from,
      data.date_to,
      "pedidos_contados",
      String(data.orders_count),
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    push([
      "resumo",
      data.date_from,
      data.date_to,
      "corridas_producao",
      String(data.production_runs_count),
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    push([
      "resumo",
      data.date_from,
      data.date_to,
      "custo_insumos",
      data.production_input_cost,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    push([
      "resumo",
      data.date_from,
      data.date_to,
      "margem_periodo",
      data.period_margin_estimate,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    if (data.period_margin_percent != null) {
      push([
        "resumo",
        data.date_from,
        data.date_to,
        "margem_periodo_pct",
        data.period_margin_percent,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
    }
    for (const s of data.by_order_status) {
      push([
        "estado_pedido",
        data.date_from,
        data.date_to,
        "",
        "",
        "",
        "",
        "",
        s.orders_revenue,
        "",
        "",
        "",
        s.status,
        String(s.orders_count),
        "",
      ]);
    }
    for (const c of data.by_category) {
      push([
        "categoria",
        data.date_from,
        data.date_to,
        "",
        "",
        "",
        c.category_name,
        c.quantity_sold,
        c.orders_revenue,
        c.production_input_cost,
        c.margin_amount,
        c.margin_percent ?? "",
        "",
        "",
        c.category_id ?? "",
      ]);
    }
    for (const r of data.by_product) {
      push([
        "produto",
        data.date_from,
        data.date_to,
        "",
        "",
        r.product_id,
        r.product_name,
        r.quantity_sold,
        r.orders_revenue,
        r.production_input_cost,
        r.margin_amount,
        r.margin_percent ?? "",
        "",
        "",
        "",
      ]);
    }
    if (productTotals) {
      push([
        "totais_produto",
        data.date_from,
        data.date_to,
        "",
        "",
        "",
        "Totais (soma linhas)",
        String(productTotals.qty),
        String(productTotals.rev),
        String(productTotals.cost),
        String(productTotals.margin),
        productTotals.mPct ?? "",
        "",
        "",
        "",
      ]);
    }
    const blob = new Blob(["\ufeff", lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio-${data.date_from}-${data.date_to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="relatorio-print">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Relatório financeiro
          {loading && data ? (
            <span className="ml-2 text-base font-normal text-slate-400">A actualizar…</span>
          ) : null}
        </h1>
        <span className="print:hidden inline-flex items-center">
          <FieldTip text="Receita de pedidos no período (exclui estados ignorados pela API, p.ex. rascunho e cancelados). Custo de insumos refere-se a produções no intervalo. Tabelas por produto/categoria são agregados do período — aproximação contabilística, não custo por lote (COGS) detalhado." />
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Receita de pedidos (exceto rascunho e cancelados), custo de insumos em produções no período e
        repartição por produto e categoria (aproximação período-a-período; não é COGS por lote).
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3 print:hidden">
        <div>
          <label className="block text-xs font-medium text-slate-600" htmlFor="df">
            De
          </label>
          <input
            id="df"
            type="date"
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600" htmlFor="dt">
            Até
          </label>
          <input
            id="dt"
            type="date"
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="self-end pb-2 text-xs text-slate-500">Períodos:</span>
          {(
            [
              ["today", "Hoje"],
              ["7d", "7 dias"],
              ["30d", "30 dias"],
              ["month", "Este mês"],
              ["prev_month", "Mês anterior"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => {
                const r = applyPreset(k);
                setFrom(r.from);
                setTo(r.to);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md bg-painel-cta px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-painel-cta-hover"
        >
          Atualizar
        </button>
        <span className="print:hidden inline-flex items-center self-end pb-2">
          <FieldTip text="Escolha datas manualmente ou use um atalho (Hoje, 7 dias, etc.). Se «De» for depois de «Até», o intervalo é corrigido automaticamente na consulta. «Atualizar» recarrega os dados do servidor." />
        </span>
      </div>
      {rangeSwapped ? (
        <p className="mt-2 text-xs text-amber-700 print:hidden">
          As datas foram invertidas na consulta (o &quot;De&quot; é posterior ao &quot;Até&quot;).
        </p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}
      {loading && !data ? <p className="mt-8 text-sm text-slate-500">A carregar…</p> : null}

      {data ? (
        <div className="mt-8 space-y-8">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start gap-2">
              <p className="text-xs text-slate-500">
                {data.date_from} → {data.date_to}
              </p>
              <span className="print:hidden inline-flex items-center">
                <FieldTip text="Resumo: totais de receita, pedidos e corridas de produção no período; custo de insumos das produções contabilizadas; margem estimada e percentual sobre a receita, conforme cálculo da API." />
              </span>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-sm text-slate-500">Receita (pedidos)</dt>
                <dd className="text-xl font-semibold text-slate-900">
                  {formatBRL(data.orders_revenue)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Pedidos contados</dt>
                <dd className="text-xl font-semibold text-slate-900">{data.orders_count}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Corridas de produção</dt>
                <dd className="text-xl font-semibold text-slate-900">{data.production_runs_count}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Custo insumos (produção)</dt>
                <dd className="text-xl font-semibold text-slate-900">
                  {formatBRL(data.production_input_cost)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Margem período (estimada)</dt>
                <dd className="text-xl font-semibold text-slate-900">
                  {formatBRL(data.period_margin_estimate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Margem % sobre receita</dt>
                <dd className="text-xl font-semibold text-slate-900">
                  {formatPercent(data.period_margin_percent)}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3 print:hidden">
              <button
                type="button"
                onClick={downloadCsv}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Descarregar CSV (UTF-8)
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Imprimir / PDF
              </button>
            </div>
          </div>

          <div className="print:hidden">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800">Gráficos</h2>
              <FieldTip text="Barras: receita por estado do pedido. Circular: partilha por categoria. Use o «?» em cada cartão para explicação; no gráfico, toque numa barra ou fatia para valores (tooltip do gráfico)." />
            </div>
            <FinancialReportCharts
              byOrderStatus={data.by_order_status}
              byCategory={data.by_category}
              labelForStatus={orderStatusLabel}
            />
            <div className="mt-6">
              <MarginVolumeScatter rows={data.by_product} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex flex-wrap items-center gap-1">
                <h2 className="text-sm font-semibold text-slate-800">Receita por estado do pedido</h2>
                <span className="print:hidden inline-flex items-center">
                  <FieldTip text="Mesma lógica do gráfico de barras: receita atribuída a cada estado (pago, enviado, etc.). A coluna «Partilha» compara visualmente cada linha com o maior valor da tabela." />
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Distribuição da receita contabilizada no período (mesmos filtros do resumo).
              </p>
            </div>
            {data.by_order_status.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Sem pedidos neste período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
                    <tr>
                      <th className="px-4 py-2">Estado</th>
                      <th className="px-4 py-2 text-right">Pedidos</th>
                      <th className="px-4 py-2 text-right">Receita</th>
                      <th className="hidden min-w-[120px] px-4 py-2 sm:table-cell">Partilha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.by_order_status.map((s) => {
                      const rev = num(s.orders_revenue);
                      const w = maxStatusRev > 0 ? Math.round((rev / maxStatusRev) * 100) : 0;
                      return (
                        <tr key={s.status} className="text-slate-800">
                          <td className="px-4 py-2 font-medium">{orderStatusLabel(s.status)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{s.orders_count}</td>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {formatBRL(s.orders_revenue)}
                          </td>
                          <td className="hidden px-4 py-2 sm:table-cell">
                            <div className="h-2 w-full max-w-[140px] rounded-full bg-slate-100">
                              <div
                                className="h-2 rounded-full bg-slate-400"
                                style={{ width: `${w}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex flex-wrap items-center gap-1">
                <h2 className="text-sm font-semibold text-slate-800">Por categoria</h2>
                <span className="print:hidden inline-flex items-center">
                  <FieldTip text="Totais por categoria de produto no catálogo. Quantidade vendida, receita, custo de produção (insumos) e margens são somas do período por essa categoria." />
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Agregado pela categoria do produto no catálogo (produtos sem categoria aparecem como
                &quot;Sem categoria&quot;).
              </p>
            </div>
            {data.by_category.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Sem movimento por categoria neste período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
                    <tr>
                      <th className="px-4 py-2">Categoria</th>
                      <th className="px-4 py-2 text-right">Qtd vendida</th>
                      <th className="px-4 py-2 text-right">Receita</th>
                      <th className="px-4 py-2 text-right">Custo produção</th>
                      <th className="px-4 py-2 text-right">Margem</th>
                      <th className="px-4 py-2 text-right">Margem %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.by_category.map((r) => (
                      <tr key={r.category_id ?? "none"} className="text-slate-800">
                        <td className="px-4 py-2 font-medium">{r.category_name}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.quantity_sold}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatBRL(r.orders_revenue)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatBRL(r.production_input_cost)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatBRL(r.margin_amount)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                          {formatPercent(r.margin_percent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex flex-wrap items-center gap-1">
                <h2 className="text-sm font-semibold text-slate-800">Por produto</h2>
                <span className="print:hidden inline-flex items-center">
                  <FieldTip text="Toque no cabeçalho para ordenar por produto, quantidade, receita, custo ou margem. Pareto % é a receita acumulada ao percorrer a lista ordenada por receita decrescente (curva ABC)." />
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Ordenação local; coluna Pareto = receita acumulada % (curva ABC, ordenação por
                receita decrescente).
              </p>
            </div>
            {sortedProducts.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Sem movimento neste período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
                    <tr>
                      <SortTh
                        label="Produto"
                        active={sortKey === "name"}
                        dir={sortDir}
                        onClick={() => toggleSort("name")}
                      />
                      <SortTh
                        label="Qtd vendida"
                        align="right"
                        active={sortKey === "qty"}
                        dir={sortDir}
                        onClick={() => toggleSort("qty")}
                      />
                      <SortTh
                        label="Receita"
                        align="right"
                        active={sortKey === "revenue"}
                        dir={sortDir}
                        onClick={() => toggleSort("revenue")}
                      />
                      <SortTh
                        label="Custo produção"
                        align="right"
                        active={sortKey === "cost"}
                        dir={sortDir}
                        onClick={() => toggleSort("cost")}
                      />
                      <SortTh
                        label="Margem"
                        align="right"
                        active={sortKey === "margin"}
                        dir={sortDir}
                        onClick={() => toggleSort("margin")}
                      />
                      <SortTh
                        label="Margem %"
                        align="right"
                        active={sortKey === "marginPct"}
                        dir={sortDir}
                        onClick={() => toggleSort("marginPct")}
                      />
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">
                        Pareto %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedProducts.map((r) => (
                      <tr key={r.product_id} className="text-slate-800">
                        <td className="px-4 py-2 font-medium">{r.product_name}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.quantity_sold}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatBRL(r.orders_revenue)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatBRL(r.production_input_cost)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatBRL(r.margin_amount)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                          {formatPercent(r.margin_percent)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                          {paretoByProduct.get(r.product_id) ?? "—"}%
                        </td>
                      </tr>
                    ))}
                    {productTotals ? (
                      <tr className="border-t-2 border-slate-200 bg-slate-50 font-medium text-slate-900">
                        <td className="px-4 py-2">Totais</td>
                        <td className="px-4 py-2 text-right tabular-nums">{productTotals.qty}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatBRL(productTotals.rev)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatBRL(productTotals.cost)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatBRL(productTotals.margin)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {productTotals.mPct != null ? `${productTotals.mPct}%` : "—"}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-400">—</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 print:hidden">
            Dados: <code className="rounded bg-slate-100 px-1">GET /api/v2/reports/financial</code>
            {" "}(resposta no formato da API v2).
          </p>
        </div>
      ) : !error && !loading ? (
        <p className="mt-8 text-sm text-slate-500">Sem dados.</p>
      ) : null}
    </div>
  );
}
