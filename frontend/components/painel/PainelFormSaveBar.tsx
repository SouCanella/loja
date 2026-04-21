"use client";

import { createPortal } from "react-dom";
import { useLayoutEffect, useState } from "react";

import { painelBtnPrimaryClass } from "@/lib/painel-button-classes";

/**
 * Botão de envio fixo na parte inferior do ecrã (visível durante o scroll).
 * O `<form>` deve ter `id` igual a `formId`; o botão usa `form={formId}` (pode ficar fora do form no DOM).
 * Renderizado com **portal** em `document.body` + `z-[280]` (abaixo do menu móvel do painel, z-[300])
 * para não ficar atrás de cabeçalhos sticky nem de dropdowns (`z-50`).
 * `useLayoutEffect` monta o portal antes da pintura, evitando o botão «invisível» no primeiro frame.
 * Em desktop, a barra desloca-se para a coluna principal (`md:left-60` = largura da sidebar).
 */
export function PainelFormSaveBar({
  formId,
  submitLabel,
  disabled,
  className = "",
}: {
  formId: string;
  submitLabel: string;
  disabled?: boolean;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  const bar = (
    <div
      className={
        "pointer-events-auto fixed inset-x-0 bottom-0 z-[280] border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] backdrop-blur md:left-60 print:hidden " +
        className
      }
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      role="region"
      aria-label="Acções de gravação do formulário"
    >
      <div className="mx-auto flex w-full max-w-xl justify-end md:max-w-none">
        <button
          type="submit"
          form={formId}
          disabled={disabled}
          className={`min-h-[44px] ${painelBtnPrimaryClass}`}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(bar, document.body);
}
