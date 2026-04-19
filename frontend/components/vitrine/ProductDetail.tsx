"use client";

import Link from "next/link";
import { useCart } from "@/lib/vitrine/cart-context";
import { productEmoji } from "@/lib/vitrine/product-emoji";
import type { ProductPublic, StorePublic } from "@/lib/vitrine/types";
import { formatBRL } from "@/lib/vitrine/whatsapp";

export function ProductDetail({
  store,
  product,
}: {
  store: StorePublic;
  product: ProductPublic;
}) {
  const cart = useCart();
  const qty = cart.quantities[product.id] ?? 0;
  const emoji = productEmoji(product.id);

  return (
    <article>
      <div className="overflow-hidden rounded-[20px] border border-loja-ink/[0.06] bg-loja-surface shadow-loja">
        <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#f0e6de] to-[#e8dcd2] text-7xl">
          {emoji}
        </div>
        <div className="p-5">
          {product.category_name ? (
            <p className="mb-1 text-[0.72rem] font-bold uppercase tracking-wider text-loja-muted">
              {product.category_name}
            </p>
          ) : null}
          <h1 className="font-display text-2xl font-bold text-loja-ink">{product.name}</h1>
          <p className="mt-3 whitespace-pre-line text-[0.95rem] leading-relaxed text-loja-muted">
            {product.description?.trim() || "Sem descrição detalhada ainda. Peça pelo WhatsApp!"}
          </p>
          <p className="mt-4 text-2xl font-bold text-loja-ink">{formatBRL(product.price)}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-loja-ink/10 bg-loja-bg/40 px-2 py-1">
              <button
                type="button"
                className="h-10 w-10 rounded-xl border border-loja-ink/10 bg-loja-surface text-lg leading-none disabled:opacity-35"
                onClick={() => cart.add(product.id, -1)}
                disabled={qty <= 0}
                aria-label="Remover um"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-base font-bold">{qty}</span>
              <button
                type="button"
                className="h-10 w-10 rounded-xl border border-loja-ink/10 bg-loja-surface text-lg leading-none"
                onClick={() => cart.add(product.id, 1)}
                aria-label="Adicionar um"
              >
                +
              </button>
            </div>
            <p className="text-[0.8rem] text-loja-muted">
              Loja: <strong className="text-loja-ink">{store.name}</strong>
            </p>
          </div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-loja-ink/10 bg-loja-surface/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-loja-muted">
              No carrinho
            </p>
            <p className="text-lg font-bold text-loja-ink">{cart.count} itens</p>
          </div>
          <Link
            href={`/loja/${store.slug}`}
            className="rounded-2xl bg-loja-whatsapp px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#0f7a6e]"
          >
            Ver pedido
          </Link>
        </div>
      </div>
    </article>
  );
}
