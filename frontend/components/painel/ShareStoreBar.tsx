"use client";

import { useState } from "react";

import { painelBtnSecondaryClass } from "@/lib/painel-button-classes";
import {
  copyTextToClipboard,
  publicStoreUrl,
  shareStoreMessage,
  shareViaNavigator,
  whatsAppShareUrl,
} from "@/lib/painel-share-store";

type Props = {
  storeName: string;
  storeSlug: string;
  className?: string;
};

export function ShareStoreBar({ storeName, storeSlug, className }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const url =
    typeof window !== "undefined" ? publicStoreUrl(window.location.origin, storeSlug) : "";
  const msg = shareStoreMessage(storeName, url);

  async function onCopy() {
    const ok = await copyTextToClipboard(url);
    setFeedback(ok ? "Link copiado." : "Não foi possível copiar.");
    window.setTimeout(() => setFeedback(null), 2500);
  }

  async function onShare() {
    const ok = await shareViaNavigator(`Loja ${storeName}`, msg, url);
    if (!ok) setFeedback("Partilha não disponível neste dispositivo.");
    window.setTimeout(() => setFeedback(null), 2500);
  }

  return (
    <div
      className={["rounded-lg border border-slate-200 bg-white p-4 shadow-sm", className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      <h2 className="text-sm font-semibold text-slate-900">Partilhar loja</h2>
      <p className="mt-1 break-all font-mono text-xs text-slate-600">{url || "…"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={painelBtnSecondaryClass} onClick={() => void onCopy()}>
          Copiar link
        </button>
        <a
          href={url ? whatsAppShareUrl(msg) : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center ${painelBtnSecondaryClass}`}
        >
          WhatsApp
        </a>
        <button type="button" className={painelBtnSecondaryClass} onClick={() => void onShare()}>
          Partilhar…
        </button>
      </div>
      {feedback ? <p className="mt-2 text-xs text-slate-600">{feedback}</p> : null}
    </div>
  );
}
