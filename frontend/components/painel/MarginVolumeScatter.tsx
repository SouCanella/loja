"use client";

import { FieldTipBeside } from "@/components/painel/FieldTip";
import { PAINEL_CHART } from "@/lib/painel-chart-colors";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function num(s: string): number {
  const n = Number.parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

export type MarginVolumeRow = {
  product_name: string;
  quantity_sold: string;
  margin_percent: string | null;
};

/** RF-FI-06 / mockup: matriz margem × volume — dispersão qtd vendida vs margem %. */
export function MarginVolumeScatter({ rows }: { rows: MarginVolumeRow[] }) {
  const data = rows
    .filter((r) => num(r.quantity_sold) > 0)
    .map((r) => ({
      name: r.product_name,
      volume: num(r.quantity_sold),
      margem: r.margin_percent != null ? num(r.margin_percent) : 0,
    }));

  if (data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-600">
        Sem produtos com quantidade vendida neste período — o gráfico margem × volume aparece quando houver dados.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 min-w-0">
        <FieldTipBeside tip="Cada ponto é um produto: eixo horizontal = quantidade vendida no período; vertical = margem % sobre a receita. Útil para ver artigos de alto volume com baixa ou alta margem (quadrantes).">
          <h3 className="text-sm font-semibold text-slate-800">Margem × volume (produtos)</h3>
        </FieldTipBeside>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={PAINEL_CHART.grid} />
            <XAxis
              type="number"
              dataKey="volume"
              name="Qtd"
              tick={{ fontSize: 11, fill: "#57534e" }}
              label={{ value: "Volume (unidades vendidas)", position: "bottom", offset: 0, fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="margem"
              name="Margem %"
              tick={{ fontSize: 11, fill: "#57534e" }}
              label={{ value: "Margem %", angle: -90, position: "insideLeft", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as { name: string; volume: number; margem: number };
                return (
                  <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-md">
                    <div className="font-medium text-slate-900">{p.name}</div>
                    <div className="text-slate-600">
                      Qtd: <span className="tabular-nums">{p.volume.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="text-slate-600">
                      Margem: <span className="tabular-nums">{p.margem.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter name="Produtos" data={data} fill={PAINEL_CHART.primary} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
