"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  PAINEL_CHART,
  PAINEL_ORDER_STATUS_COLORS,
} from "@/lib/painel-chart-colors";

export type RevenueRow = { date: string; revenue: string };
export type StatusRow = { status: string; count: number };

function num(s: string): number {
  const n = Number.parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

export function RevenueTrendChart({
  revenueByDay,
  movingAvg,
}: {
  revenueByDay: RevenueRow[];
  movingAvg: RevenueRow[];
}) {
  const data = revenueByDay.map((r, i) => ({
    day: r.date.slice(5),
    receita: num(r.revenue),
    media7: num(movingAvg[i]?.revenue ?? "0"),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={PAINEL_CHART.grid} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#57534e" }} />
          <YAxis tick={{ fontSize: 11, fill: "#57534e" }} tickFormatter={(v) => `R$${v}`} />
          <Tooltip
            formatter={(value: number, name: string) => [
              value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
              name === "receita" ? "Receita" : "Média 7d",
            ]}
          />
          <Legend />
          <Bar dataKey="receita" name="receita" fill={PAINEL_CHART.primary} radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="media7"
            name="media7"
            stroke={PAINEL_CHART.line}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrdersByStatusChart({ rows, labelForStatus }: { rows: StatusRow[]; labelForStatus: (s: string) => string }) {
  const data = rows.map((r) => ({
    nome: labelForStatus(r.status),
    qtd: r.count,
    fill: PAINEL_ORDER_STATUS_COLORS[r.status] ?? PAINEL_CHART.primary,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={PAINEL_CHART.grid} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#57534e" }} />
          <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 10, fill: "#57534e" }} />
          <Tooltip />
          <Bar dataKey="qtd" name="Pedidos" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`c-${entry.nome}-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
