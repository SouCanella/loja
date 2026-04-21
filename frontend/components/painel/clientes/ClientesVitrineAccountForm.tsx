"use client";

import { FormEvent } from "react";

import { FieldTipBeside } from "@/components/painel/FieldTip";
import { PanelCard } from "@/components/painel/PanelCard";
import { painelBtnPrimaryClass } from "@/lib/painel-button-classes";
import { painelPageContentWidthClass } from "@/lib/painel-layout-classes";

type Props = {
  newEmail: string;
  newPassword: string;
  newPassword2: string;
  onNewEmailChange: (v: string) => void;
  onNewPasswordChange: (v: string) => void;
  onNewPassword2Change: (v: string) => void;
  vitrineMsg: string | null;
  creating: boolean;
  onSubmit: (e: FormEvent) => void;
};

export function ClientesVitrineAccountForm({
  newEmail,
  newPassword,
  newPassword2,
  onNewEmailChange,
  onNewPasswordChange,
  onNewPassword2Change,
  vitrineMsg,
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
          <FieldTipBeside tip="Cria um login para o cliente na loja online com este e-mail e palavra-passe.">
            Nova conta na vitrine
          </FieldTipBeside>
        </h2>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="vc-email">
              E-mail
            </label>
            <input
              id="vc-email"
              type="email"
              autoComplete="off"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={newEmail}
              onChange={(e) => onNewEmailChange(e.target.value)}
              placeholder="cliente@exemplo.com"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="vc-pw">
                Palavra-passe
              </label>
              <input
                id="vc-pw"
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={newPassword}
                onChange={(e) => onNewPasswordChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="vc-pw2">
                Confirmar
              </label>
              <input
                id="vc-pw2"
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={newPassword2}
                onChange={(e) => onNewPassword2Change(e.target.value)}
              />
            </div>
          </div>
        </div>
        {vitrineMsg ? (
          <p
            className={`mt-3 text-sm ${vitrineMsg.includes("Não") || vitrineMsg.includes("não") || vitrineMsg.includes("Indique") || vitrineMsg.includes("coincidem") || vitrineMsg.includes("pelo menos") ? "text-red-700" : "text-emerald-800"}`}
          >
            {vitrineMsg}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={creating}
          className={`mt-4 ${painelBtnPrimaryClass} disabled:opacity-60`}
        >
          {creating ? "A criar…" : "Criar cliente"}
        </button>
      </PanelCard>
    </form>
  );
}
