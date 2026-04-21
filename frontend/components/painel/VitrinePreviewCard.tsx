"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

/** Ícone partilhar (nós). */
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92 0-1.61-1.31-2.92-2.92-2.92z" />
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

  async function shareStore() {
    const url = fullUrl || `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName.trim() || "Loja",
          text: "Visite a nossa loja online.",
          url,
        });
        return;
      } catch {
        /* cancelado ou erro */
      }
    }
    await copyUrl();
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
          onClick={() => void shareStore()}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:flex-initial sm:min-w-[10rem]"
        >
          <ShareIcon className="h-[18px] w-[18px] shrink-0 opacity-95" />
          Partilhar
        </button>
      </div>
    </div>
  );
}
