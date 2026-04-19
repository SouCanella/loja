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
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
          <Tooltip
            formatter={(value: number, name: string) => [
              value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
              name === "receita" ? "Receita" : "Média 7d",
            ]}
          />
          <Legend />
          <Bar dataKey="receita" name="receita" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="media7" name="media7" stroke="#94a3b8" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  aguardando_confirmacao: "#818cf8",
  confirmado: "#6366f1",
  em_producao: "#4f46e5",
  pronto: "#4338ca",
  saiu_entrega: "#312e81",
  entregue: "#10b981",
  cancelado: "#94a3b8",
  rascunho: "#cbd5e1",
};

export function OrdersByStatusChart({ rows, labelForStatus }: { rows: StatusRow[]; labelForStatus: (s: string) => string }) {
  const data = rows.map((r) => ({
    nome: labelForStatus(r.status),
    qtd: r.count,
    fill: STATUS_COLORS[r.status] ?? "#6366f1",
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 10 }} />
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
