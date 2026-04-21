"use client";

import { FieldTipBeside } from "@/components/painel/FieldTip";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PAINEL_CHART, PAINEL_CHART_SEQUENCE } from "@/lib/painel-chart-colors";

function num(s: string): number {
  const n = Number.parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

type StatusRow = { status: string; orders_revenue: string; orders_count: number };
type CategoryRow = {
  category_name: string;
  orders_revenue: string;
};

export function FinancialReportCharts({
  byOrderStatus,
  byCategory,
  labelForStatus,
}: {
  byOrderStatus: StatusRow[];
  byCategory: CategoryRow[];
  labelForStatus: (s: string) => string;
}) {
  const statusData = byOrderStatus.map((r) => ({
    nome: labelForStatus(r.status),
    receita: num(r.orders_revenue),
  }));

  const catData = byCategory
    .map((c) => ({
      name: c.category_name || "Sem categoria",
      value: num(c.orders_revenue),
    }))
    .filter((c) => c.value > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 min-w-0">
          <FieldTipBeside tip="Cada barra mostra a receita atribuída a pedidos nesse estado no período (ex.: pago, enviado). Toque nas barras no gráfico para ver o valor exacto (tooltip do gráfico). Estados sem movimento podem não aparecer.">
            <h3 className="text-sm font-semibold text-slate-800">Receita por estado do pedido</h3>
          </FieldTipBeside>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={PAINEL_CHART.grid} />
              <XAxis
                dataKey="nome"
                tick={{ fontSize: 10, fill: "#57534e" }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fontSize: 11, fill: "#57534e" }} />
              <Tooltip
                formatter={(v: number) =>
                  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                }
              />
              <Bar dataKey="receita" name="Receita" fill={PAINEL_CHART.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 min-w-0">
          <FieldTipBeside tip="Partilha da receita por categoria de produto no catálogo. Apenas categorias com receita maior que zero entram no gráfico; produtos sem categoria entram como «Sem categoria». Toque numa fatia ou use a legenda para ver valores (tooltip do gráfico).">
            <h3 className="text-sm font-semibold text-slate-800">Receita por categoria</h3>
          </FieldTipBeside>
        </div>
        {catData.length === 0 ? (
          <p className="text-sm text-slate-500">Sem dados de categoria no período.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={88}
                  label={({ name, percent }) =>
                    `${String(name)} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                >
                  {catData.map((_, i) => (
                    <Cell
                      key={`c-${i}`}
                      fill={PAINEL_CHART_SEQUENCE[i % PAINEL_CHART_SEQUENCE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) =>
                    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
