"use client";

import { FieldTip } from "@/components/painel/FieldTip";

export function ConfigFormSection({
  title,
  summaryTip,
  defaultOpen = false,
  children,
}: {
  title: string;
  summaryTip?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-slate-200 bg-white shadow-sm open:shadow-md"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-xl px-4 py-3 text-left [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1 text-sm font-semibold text-slate-900">{title}</span>
        <span className="flex shrink-0 items-start gap-2">
          {summaryTip ? <FieldTip text={summaryTip} /> : null}
          <span className="text-[10px] text-slate-400 transition group-open:rotate-180" aria-hidden>
            ▼
          </span>
        </span>
      </summary>
      <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3">{children}</div>
    </details>
  );
}
