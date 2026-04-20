"use client";

import { useRef, useState } from "react";

import { apiPainelMediaUpload, PainelApiError } from "@/lib/painel-api";

export function ImageUploadButton({
  purpose,
  onUploaded,
  disabled,
  label = "Enviar imagem",
}: {
  purpose: "product" | "vitrine_logo" | "vitrine_hero";
  onUploaded: (publicUrl: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const url = await apiPainelMediaUpload(purpose, f);
      onUploaded(url);
    } catch (e) {
      setErr(e instanceof PainelApiError ? e.message : "Falha no envio.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        disabled={busy || disabled}
        onChange={(e) => void onChange(e)}
      />
      <button
        type="button"
        disabled={busy || disabled}
        onClick={() => ref.current?.click()}
        className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {busy ? "A enviar…" : label}
      </button>
      {err ? <span className="max-w-[14rem] text-xs text-amber-700">{err}</span> : null}
    </div>
  );
}
