"use client";

import { FieldTipBeside } from "@/components/painel/FieldTip";
import { PAINEL_CHART_SEQUENCE } from "@/lib/painel-chart-colors";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

function num(s: string | null | undefined): number {
  if (s == null) return NaN;
  const n = Number.parseFloat(String(s));
  return Number.isNaN(n) ? NaN : n;
}

type Row = {
  id: string;
  product_id: string;
  estimated_material_unit_cost?: string | null;
  estimated_labor_unit_cost?: string | null;
  estimated_unit_cost: string | null;
  suggested_unit_price: string | null;
};

/** Composição aproximada do preço sugerido: custo estimado vs margem bruta (RF-PR / mockup). */
export function PricingCompositionChart({
  row,
  productLabel,
}: {
  row: Row | null;
  productLabel: string;
}) {
  if (!row) {
    return (
      <p className="text-sm text-slate-500">Seleccione uma receita na lista para ver a composição do preço.</p>
    );
  }

  const mat = num(row.estimated_material_unit_cost);
  const lab = num(row.estimated_labor_unit_cost);
  const costTotal = num(row.estimated_unit_cost);
  const sugg = num(row.suggested_unit_price);
  if (
    !Number.isFinite(costTotal) ||
    !Number.isFinite(sugg) ||
    sugg <= 0 ||
    !Number.isFinite(mat)
  ) {
    return (
      <p className="text-sm text-slate-600">
        Sem custo de matéria-prima ou preço sugerido calculável para «{productLabel}» — complete insumos e
        rendimento na receita (e tempo/MO na loja, se aplicável).
      </p>
    );
  }

  const laborPart = Number.isFinite(lab) && lab > 0 ? lab : 0;
  const margin = Math.max(0, sugg - costTotal);
  const data: { name: string; value: number }[] = [
    { name: "Matéria-prima (est.)", value: Math.max(0, mat) },
  ];
  if (laborPart > 0) {
    data.push({ name: "Mão de obra (est.)", value: laborPart });
  }
  data.push({ name: "Margem bruta (aprox.)", value: margin });
  const total = data[0].value + data[1].value;
  if (total <= 0) {
    return <p className="text-sm text-slate-600">Valores não positivos — não é possível desenhar o gráfico.</p>;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 min-w-0">
        <FieldTipBeside tip="Estimativa do preço sugerido: matéria-prima, mão de obra (se definida na loja) e margem. Custos fixos gerais não entram neste cálculo.">
          <h3 className="text-sm font-semibold text-slate-800">Composição do preço sugerido</h3>
        </FieldTipBeside>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        {productLabel} — valores orientadores (mesma base da tabela).
      </p>
      <div className="h-56 w-full max-w-md">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PAINEL_CHART_SEQUENCE[i % PAINEL_CHART_SEQUENCE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) =>
                `${(v as number).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${((100 * (v as number)) / total).toFixed(1)}%)`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1 text-xs text-slate-600">
        {data.map((d) => (
          <li key={d.name}>
            <span className="font-medium text-slate-800">{d.name}:</span>{" "}
            {d.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (
            {((100 * d.value) / total).toFixed(1)}%)
          </li>
        ))}
      </ul>
    </div>
  );
}
