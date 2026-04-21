"use client";

import { ConfigFormSection } from "@/components/painel/ConfigFormSection";
import { FieldTipBeside } from "@/components/painel/FieldTip";

type Props = {
  wa: string;
  onWaChange: (v: string) => void;
  tz: string;
  onTzChange: (v: string) => void;
  margin: string;
  onMarginChange: (v: string) => void;
  laborRate: string;
  onLaborRateChange: (v: string) => void;
};

export function ConfigContactMarginSection({
  wa,
  onWaChange,
  tz,
  onTzChange,
  margin,
  onMarginChange,
  laborRate,
  onLaborRateChange,
}: Props) {
  return (
    <ConfigFormSection title="Contacto, horário e margem" defaultOpen={false}>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="wa">
          <FieldTipBeside tip="Telemóvel usado nos links e botões WhatsApp da vitrine (formato internacional, ex. +351…).">WhatsApp (vitrine)</FieldTipBeside>
        </label>
        <input
          id="wa"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="+55…"
          value={wa}
          onChange={(e) => onWaChange(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="tz">
          <FieldTipBeside tip="Fuso horário de referência para horários na loja. Os totais do dashboard usam calendário UTC; este campo não altera esses totais.">
            Fuso horário (referência)
          </FieldTipBeside>
        </label>
        <input
          id="tz"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={tz}
          onChange={(e) => onTzChange(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="mg">
          <FieldTipBeside tip="Margem de referência da loja para sugestões de preço e para receitas que usam a margem global.">
            Margem alvo da loja (%)
          </FieldTipBeside>
        </label>
        <input
          id="mg"
          type="text"
          inputMode="decimal"
          className="mt-1 w-full max-w-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={margin}
          onChange={(e) => onMarginChange(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="labor">
          <FieldTipBeside tip="Custo de mão de obra por hora. Com o tempo da receita (minutos) e o rendimento, calcula-se o MO por unidade: (taxa × minutos ÷ 60) ÷ rendimento. Vazio: não incluir MO nas sugestões.">
            Mão de obra (R$ / hora)
          </FieldTipBeside>
        </label>
        <input
          id="labor"
          type="text"
          inputMode="decimal"
          className="mt-1 w-full max-w-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={laborRate}
          onChange={(e) => onLaborRateChange(e.target.value)}
          placeholder="ex.: 100"
        />
      </div>
    </ConfigFormSection>
  );
}
