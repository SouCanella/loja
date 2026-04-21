"use client";

import { ConfigFormSection } from "@/components/painel/ConfigFormSection";
import { painelBtnDangerClass, painelBtnLinkClass } from "@/lib/painel-button-classes";

import { SOCIAL_ICON_PRESETS } from "./constants";
import type { SocialLinkRow } from "./types";

type Props = {
  socialLinks: SocialLinkRow[];
  onSocialLinksChange: (next: SocialLinkRow[] | ((prev: SocialLinkRow[]) => SocialLinkRow[])) => void;
};

export function ConfigSocialSection({ socialLinks, onSocialLinksChange }: Props) {
  return (
    <ConfigFormSection
      title="Redes sociais"
      defaultOpen
      summaryTip="Links mostrados na vitrine (secção Redes sociais). Cada URL abre num novo separador."
    >
      <div className="space-y-3">
        {socialLinks.map((row, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:flex-row lg:flex-wrap lg:items-end"
          >
            <div className="w-full shrink-0 lg:w-40">
              <label className="block text-xs font-medium text-slate-600" htmlFor={`soc-icon-${idx}`}>
                Tipo / ícone
              </label>
              <select
                id={`soc-icon-${idx}`}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                value={row.icon}
                onChange={(e) =>
                  onSocialLinksChange((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, icon: e.target.value } : r)),
                  )
                }
              >
                {SOCIAL_ICON_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 flex-1 lg:min-w-[220px]">
              <label className="block text-xs font-medium text-slate-600" htmlFor={`soc-url-${idx}`}>
                URL (https)
              </label>
              <input
                id={`soc-url-${idx}`}
                type="url"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={row.url}
                onChange={(e) =>
                  onSocialLinksChange((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r)),
                  )
                }
                placeholder="https://instagram.com/sua_loja"
              />
            </div>
            <div className="min-w-0 flex-1 lg:min-w-[200px]">
              <label className="block text-xs font-medium text-slate-600" htmlFor={`soc-lbl-${idx}`}>
                Rótulo (opcional)
              </label>
              <input
                id={`soc-lbl-${idx}`}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={row.label}
                onChange={(e) =>
                  onSocialLinksChange((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)),
                  )
                }
                placeholder="Segue-nos no Instagram"
              />
            </div>
            <div className="flex justify-end lg:shrink-0">
              <button
                type="button"
                className={painelBtnDangerClass}
                onClick={() => onSocialLinksChange((prev) => prev.filter((_, i) => i !== idx))}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className={painelBtnLinkClass}
          onClick={() =>
            onSocialLinksChange((prev) => [...prev, { label: "", url: "", icon: "instagram" }])
          }
        >
          + Adicionar rede
        </button>
      </div>
    </ConfigFormSection>
  );
}
