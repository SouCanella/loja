"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { shareStoreMessage, whatsAppShareUrl } from "@/lib/painel-share-store";

type Props = {
  storeSlug: string;
  storeName: string;
};

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 4V16C8 17.1 8.9 18 10 18H18C19.1 18 20 17.1 20 16V7.2C20 6.6 19.8 6.1 19.4 5.7L16.3 2.6C15.9 2.2 15.4 2 14.8 2H10C8.9 2 8 2.9 8 4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M16 18V20C16 21.1 15.1 22 14 22H6C4.9 22 4 21.1 4 20V10C4 8.9 4.9 8 6 8H8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Ícone WhatsApp (monocromático). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.168-.394-.337-.34-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.127.418.472.152.9.129 1.235.087.376-.053 1.176-.482 1.342-.95.165-.468.165-.867.123-.948-.045-.082-.166-.132-.327-.232z" />
    </svg>
  );
}

export function VitrinePreviewCard({ storeSlug, storeName }: Props) {
  const slug = storeSlug.replace(/^\/+|\/+$/g, "");
  const path = `/loja/${slug}`;
  const [fullUrl, setFullUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFullUrl(`${window.location.origin}${path}`);
  }, [path]);

  async function copyUrl() {
    const url = fullUrl || `${typeof window !== "undefined" ? window.location.origin : ""}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  }

  function openWhatsAppShare() {
    const url = fullUrl || `${typeof window !== "undefined" ? window.location.origin : ""}${path}`;
    const text = shareStoreMessage(storeName.trim() || "Loja", url);
    const wa = whatsAppShareUrl(text);
    window.open(wa, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-painel-primary via-[#7311a3] to-painel-cta p-5 text-white shadow-[0_12px_40px_-12px_rgba(138,5,190,0.45)]">
      <div className="flex items-stretch gap-2 rounded-xl bg-black/25 px-3 py-2.5 ring-1 ring-white/10">
        <p className="min-w-0 flex-1 break-all text-sm leading-snug text-white">
          {fullUrl || "…"}
        </p>
        <button
          type="button"
          onClick={() => void copyUrl()}
          className="flex shrink-0 items-center justify-center rounded-lg bg-white/15 px-2.5 py-1.5 text-white transition hover:bg-white/25"
          aria-label="Copiar link"
        >
          <CopyIcon className="h-[18px] w-[18px]" />
        </button>
      </div>
      {copied ? <p className="mt-2 text-xs font-medium text-painel-secondary">Link copiado.</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-painel-cta shadow-sm transition hover:bg-violet-50 sm:flex-initial sm:min-w-[10rem]"
        >
          Visualizar loja
        </Link>
        <button
          type="button"
          onClick={openWhatsAppShare}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:flex-initial sm:min-w-[10rem]"
          aria-label="Abrir WhatsApp com mensagem e link da loja"
        >
          <WhatsAppIcon className="h-[18px] w-[18px] shrink-0 opacity-95" />
          WhatsApp
        </button>
      </div>
    </div>
  );
}
