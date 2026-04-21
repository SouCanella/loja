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
          <FieldTipBeside tip="Número usado no botão ou link wa.me na vitrine.">WhatsApp (vitrine)</FieldTipBeside>
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
          Fuso horário (referência)
        </label>
        <input
          id="tz"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={tz}
          onChange={(e) => onTzChange(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">
          Usado em configuração; agregações actuais do dashboard continuam em UTC.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="mg">
          <FieldTipBeside tip="Percentual usado em sugestões de preço e na margem efectiva quando a receita não define margem própria.">
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
          <FieldTipBeside tip="Usado com o tempo (minutos) de cada receita para repartir o custo de mão de obra por unidade produzida e incluir na sugestão de preço (junto à margem %). Deixe vazio para não contabilizar MO.">
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
        <p className="mt-1 text-xs text-slate-500">
          Custo MO por unidade = (taxa × minutos da receita ÷ 60) ÷ rendimento.
        </p>
      </div>
    </ConfigFormSection>
  );
}
