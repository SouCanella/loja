import Link from "next/link";

import { productEmoji } from "@/lib/vitrine/product-emoji";
import type { ProductPublic } from "@/lib/vitrine/types";
import { formatBRL } from "@/lib/vitrine/whatsapp";

import { RibbonBadges, ribbonLabels } from "./catalog-ribbon";

export function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-[0.82rem] font-semibold transition ${
        active
          ? "border-loja-primary bg-loja-primary text-white shadow-sm"
          : "border-loja-ink/10 bg-loja-surface text-loja-muted hover:border-loja-primary/30"
      }`}
    >
      {label}
    </button>
  );
}

export function ProductCard({
  product,
  storeSlug,
  layout,
  qty,
  onAdd,
}: {
  product: ProductPublic;
  storeSlug: string;
  layout: "grid" | "list" | "rail";
  qty: number;
  onAdd: (delta: number) => void;
}) {
  const emoji = productEmoji(product.id);
  const desc = product.description?.trim() || "Delicioso pedido caseiro.";
  const rail = layout === "rail";
  const ribbons = ribbonLabels(product);
  const unavailable = (product.catalog_sale_mode ?? "in_stock") === "unavailable";

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-loja-ink/[0.06] bg-loja-surface shadow-loja ${
        layout === "list" ? "flex flex-row items-stretch" : "flex flex-col"
      }`}
    >
      <Link
        href={`/loja/${storeSlug}/p/${product.id}`}
        className={
          layout === "list"
            ? "relative w-[108px] min-w-[108px] shrink-0"
            : rail
              ? "relative aspect-square shrink-0"
              : "relative aspect-square w-full"
        }
      >
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL externa configurável pelo lojista
          <img
            src={product.image_url}
            alt=""
            className={`h-full w-full object-cover ${unavailable ? "opacity-60" : ""}`}
          />
        ) : (
          <div
            className={`flex h-full min-h-0 w-full items-center justify-center bg-gradient-to-br from-loja-primary/15 to-loja-accent/10 text-4xl ${unavailable ? "opacity-60" : ""}`}
          >
            {emoji}
          </div>
        )}
        <RibbonBadges labels={ribbons} />
        {unavailable ? (
          <div className="pointer-events-none absolute inset-0 z-[2] grid place-items-center bg-white/75 text-[0.72rem] font-bold text-loja-muted">
            Indisponível
          </div>
        ) : null}
      </Link>
      <div
        className={`flex min-w-0 flex-1 flex-col gap-1.5 ${
          layout === "list" ? "py-2.5 pl-1 pr-3" : "px-3 pb-3 pt-2.5"
        }`}
      >
        <div className="line-clamp-2 text-[0.88rem] font-semibold leading-snug text-loja-ink">
          {product.name}
        </div>
        <p
          className={`line-clamp-3 min-h-[3em] text-[0.75rem] leading-snug text-loja-muted ${
            layout === "list" ? "line-clamp-2 min-h-0" : ""
          }`}
        >
          {desc}
        </p>
        <Link
          href={`/loja/${storeSlug}/p/${product.id}`}
          className="self-start text-[0.75rem] font-bold text-loja-accent underline underline-offset-2"
        >
          Ver detalhes
        </Link>
        <div
          className={
            layout === "grid"
              ? "mt-auto flex flex-col gap-2 pt-2 xl:flex-row xl:items-center xl:justify-between xl:gap-2"
              : "mt-auto flex items-center justify-between gap-1.5 pt-2"
          }
        >
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="text-[0.95rem] font-bold tabular-nums text-loja-ink">
              {formatBRL(product.price)}
            </span>
            <span className="text-[0.65rem] font-semibold text-loja-muted">/ un</span>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-1 xl:justify-end">
            <button
              type="button"
              className="h-[30px] w-[30px] rounded-lg border border-loja-ink/10 bg-loja-surface text-base leading-none disabled:opacity-35"
              onClick={(e) => {
                e.preventDefault();
                onAdd(-1);
              }}
              disabled={qty <= 0}
              aria-label="Remover um"
            >
              −
            </button>
            <span className="min-w-[18px] text-center text-[0.8rem] font-bold">{qty}</span>
            <button
              type="button"
              className="h-[30px] w-[30px] rounded-lg border border-loja-ink/10 bg-loja-surface text-base leading-none disabled:opacity-35"
              onClick={(e) => {
                e.preventDefault();
                if (!unavailable) onAdd(1);
              }}
              disabled={unavailable}
              aria-label="Adicionar um"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
