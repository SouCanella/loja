"use client";

import { useEffect, useState } from "react";

import { FieldTip } from "@/components/painel/FieldTip";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";

type Me = { email: string };

export default function ContaPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void apiPainelJson<Me>("/api/v2/me")
      .then((m) => setMe({ email: m.email }))
      .catch(() => setErr("Não foi possível carregar o perfil."));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (newPassword.length < 8) {
      setErr("A nova palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("A confirmação não coincide com a nova palavra-passe.");
      return;
    }
    setSaving(true);
    try {
      await apiPainelJson("/api/v2/me/password", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMsg("Palavra-passe actualizada. Use a nova palavra-passe no próximo login.");
    } catch (e: unknown) {
      setErr(e instanceof PainelApiError ? e.message : "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Perfil e segurança</h1>
        <FieldTip text="Altere a palavra-passe da sua conta de lojista. Mantenha uma palavra-passe forte e única; após alterar, o login anterior deixa de ser válido." />
      </div>
      <p className="mt-2 max-w-xl text-sm text-slate-600">
        Conta de acesso ao painel (RF-AU). O e-mail não pode ser alterado aqui.
      </p>

      {me ? (
        <p className="mt-4 text-sm text-slate-700">
          <span className="font-medium text-slate-900">E-mail:</span> {me.email}
        </p>
      ) : null}

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}
      {msg ? <p className="mt-4 text-sm text-emerald-800">{msg}</p> : null}

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="mt-8 max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="cur-pw">
            Palavra-passe actual
          </label>
          <input
            id="cur-pw"
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="new-pw">
            Nova palavra-passe (mín. 8 caracteres)
          </label>
          <input
            id="new-pw"
            type="password"
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="cf-pw">
            Confirmar nova palavra-passe
          </label>
          <input
            id="cf-pw"
            type="password"
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-painel-cta px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-painel-cta-hover disabled:opacity-70"
        >
          {saving ? "A guardar…" : "Actualizar palavra-passe"}
        </button>
      </form>
    </>
  );
}
