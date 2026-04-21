"use client";

import { ConfigFormSection } from "@/components/painel/ConfigFormSection";
import { FieldTipBeside } from "@/components/painel/FieldTip";

type Props = {
  name: string;
  onNameChange: (v: string) => void;
};

export function ConfigIdentitySection({ name, onNameChange }: Props) {
  return (
    <ConfigFormSection title="Identidade da loja" defaultOpen>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="sn">
          <FieldTipBeside tip="Nome público da loja na vitrine e nas mensagens ao cliente.">Nome da loja</FieldTipBeside>
        </label>
        <input
          id="sn"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
      </div>
    </ConfigFormSection>
  );
}
