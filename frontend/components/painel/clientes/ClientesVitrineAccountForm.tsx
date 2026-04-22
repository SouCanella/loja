"use client";

import { FormEvent } from "react";

import { FieldTipBeside } from "@/components/painel/FieldTip";
import { PanelCard } from "@/components/painel/PanelCard";
import { painelBtnPrimaryClass } from "@/lib/painel-button-classes";
import { painelPageContentWidthClass } from "@/lib/painel-layout-classes";

type Props = {
  contactName: string;
  phone: string;
  emailOptional: string;
  onContactNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailOptionalChange: (v: string) => void;
  msg: string | null;
  creating: boolean;
  onSubmit: (e: FormEvent) => void;
};

export function ClientesVitrineAccountForm({
  contactName,
  phone,
  emailOptional,
  onContactNameChange,
  onPhoneChange,
  onEmailOptionalChange,
  msg,
  creating,
  onSubmit,
}: Props) {
  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className={`mt-6 ${painelPageContentWidthClass}`}
    >
      <PanelCard>
        <h2 className="text-sm font-semibold text-slate-800">
          <FieldTipBeside tip="Insere o cliente na base da loja (origem Painel). Nome e telefone são obrigatórios; o e-mail é opcional e serve para identificação — não cria palavra-passe na vitrine.">
            Novo cliente
          </FieldTipBeside>
        </h2>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="cli-name">
              Nome
            </label>
            <input
              id="cli-name"
              type="text"
              autoComplete="name"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={contactName}
              onChange={(e) => onContactNameChange(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="cli-phone">
              Telefone
            </label>
            <input
              id="cli-phone"
              type="tel"
              autoComplete="tel"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="11999999999"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="cli-email-opt">
              E-mail <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <input
              id="cli-email-opt"
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={emailOptional}
              onChange={(e) => onEmailOptionalChange(e.target.value)}
              placeholder="opcional@exemplo.com"
            />
          </div>
        </div>
        {msg ? (
          <p
            className={`mt-3 text-sm ${msg.includes("Não") || msg.includes("não") || msg.includes("Indique") || msg.includes("pelo menos") || msg.includes("inválid") ? "text-red-700" : "text-emerald-800"}`}
          >
            {msg}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={creating}
          className={`mt-4 ${painelBtnPrimaryClass} disabled:opacity-60`}
        >
          {creating ? "A gravar…" : "Gravar cliente"}
        </button>
      </PanelCard>
    </form>
  );
}
