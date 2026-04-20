"use client";

import { useEffect } from "react";

import { flushVitrineAnalytics } from "@/lib/vitrine/analytics";

/** Envia fila pendente ao sair do separador ou fechar a página. */
export function VitrineAnalyticsBridge({ slug }: { slug: string }) {
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") void flushVitrineAnalytics(slug);
    };
    const onPageHide = () => void flushVitrineAnalytics(slug);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [slug]);
  return null;
}
