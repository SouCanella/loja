"use client";

import { useEffect, useState } from "react";

import { apiPainelJson, PainelApiError } from "@/lib/painel-api";

type Me = {
  store_name: string;
  store_slug: string;
  vitrine_whatsapp?: string | null;
  store_target_margin_percent: string | number;
};

export default function ConfiguracaoLojaPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [wa, setWa] = useState("");
  const [tz, setTz] = useState("America/Sao_Paulo");
  const [margin, setMargin] = useState("30");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void apiPainelJson<Me>("/api/v2/me")
      .then((m) => {
        setMe(m);
        setName(m.store_name);
        setSlug(m.store_slug);
        setWa(m.vitrine_whatsapp ?? "");
        const sm = m.store_target_margin_percent;
        setMargin(typeof sm === "number" ? String(sm) : String(sm ?? "30"));
      })
      .catch(() => setErr("Não foi possível carregar os dados da loja."));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPainelJson("/api/v2/me/store-settings", {
        method: "PATCH",
        body: JSON.stringify({
          store_name: name.trim(),
          store_slug: slug.trim(),
          theme: { vitrine: { whatsapp: wa.trim() || undefined } },
          config: { general: { timezone: tz.trim() } },
        }),
      });
      const m = Number.parseFloat(margin.replace(",", "."));
      if (!Number.isNaN(m)) {
        await apiPainelJson("/api/v2/me/store-pricing", {
          method: "PATCH",
          body: JSON.stringify({ target_margin_percent: m }),
        });
      }
      const updated = await apiPainelJson<Me>("/api/v2/me");
      setMe(updated);
      setMsg("Alterações guardadas.");
    } catch (e: unknown) {
      setErr(e instanceof PainelApiError ? e.message : "Erro ao guardar.");
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Configuração da loja</h1>
      <p className="mt-1 text-sm text-slate-500">
        Nome, URL pública, WhatsApp da vitrine, fuso horário (referência) e margem alvo.
      </p>

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}
      {msg ? <p className="mt-4 text-sm text-emerald-800">{msg}</p> : null}

      {me ? (
        <form onSubmit={saveProfile} className="mt-8 max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="sn">
              Nome da loja
            </label>
            <input
              id="sn"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="sl">
              Slug (URL) — /loja/<strong>{slug || "…"}</strong>
            </label>
            <input
              id="sl"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="wa">
              WhatsApp (vitrine)
            </label>
            <input
              id="wa"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="+55…"
              value={wa}
              onChange={(e) => setWa(e.target.value)}
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
              onChange={(e) => setTz(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Usado em configuração; agregações actuais do dashboard continuam em UTC.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="mg">
              Margem alvo da loja (%)
            </label>
            <input
              id="mg"
              type="text"
              inputMode="decimal"
              className="mt-1 w-full max-w-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Guardar
          </button>
        </form>
      ) : !err ? (
        <p className="mt-8 text-sm text-slate-500">A carregar…</p>
      ) : null}
    </>
  );
}
