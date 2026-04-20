import type { ProductPublic } from "@/lib/vitrine/types";

export function ribbonLabels(product: ProductPublic): string[] {
  const out: string[] = [];
  const sp = product.catalog_spotlight;
  if (sp === "featured") out.push("Destaque");
  else if (sp === "new") out.push("Novidade");
  else if (sp === "bestseller") out.push("Mais vendido");
  const sale = product.catalog_sale_mode ?? "in_stock";
  if (sale === "order_only") out.push("Sob encomenda");
  return out;
}

export function RibbonBadges({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;
  return (
    <div className="pointer-events-none absolute left-2 right-2 top-2 z-[3] flex flex-wrap gap-1">
      {labels.map((t) => (
        <span
          key={t}
          className="rounded-md px-1.5 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-wide text-[#1a1512] shadow-sm"
          style={{
            background:
              t === "Destaque"
                ? "#fde047"
                : t === "Novidade"
                  ? "#0ea5e9"
                  : t === "Mais vendido"
                    ? "#a855f7"
                    : t === "Sob encomenda"
                      ? "#fed7aa"
                      : "#e5e7eb",
            color: t === "Novidade" || t === "Mais vendido" ? "#fff" : undefined,
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
