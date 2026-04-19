"use client";

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

function num(s: string): number {
  const n = Number.parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

const COLORS = ["#6366f1", "#818cf8", "#4f46e5", "#a5b4fc", "#312e81", "#c7d2fe", "#4338ca"];

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
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Receita por estado do pedido</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey="nome" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) =>
                  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                }
              />
              <Bar dataKey="receita" name="Receita" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Receita por categoria</h3>
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
                    <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />
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
