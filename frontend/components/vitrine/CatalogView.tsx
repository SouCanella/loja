"use client";

import { useEffect, useMemo, useState } from "react";

import { useVitrineCheckout } from "@/hooks/use-vitrine-checkout";
import { useCart } from "@/lib/vitrine/cart-context";
import type { CategoryPublic, ProductPublic, StorePublic } from "@/lib/vitrine/types";

import { CatalogCartBottomBar } from "./catalog-cart-bottom-bar";
import { CatalogCartSheet } from "./catalog-cart-sheet";
import { CatalogHeader } from "./catalog-header";
import { CatalogHero } from "./catalog-hero";
import { FilterPill, ProductCard } from "./catalog-product-card";
import { WhatsAppOrderPreviewModal } from "./whatsapp-order-preview-modal";

type Props = {
  store: StorePublic;
  categories: CategoryPublic[];
  products: ProductPublic[];
};

export function CatalogView({ store, categories, products }: Props) {
  const cart = useCart();
  const [search, setSearch] = useState("");
  const [filterSlug, setFilterSlug] = useState<string | "all">("all");
  const [layout, setLayout] = useState<"grid" | "list">(
    store.catalog_layout_default === "list" ? "list" : "grid",
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [waPreviewOpen, setWaPreviewOpen] = useState(false);

  const productsById = useMemo(() => {
    const m = new Map<string, ProductPublic>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const co = useVitrineCheckout(store, productsById, cart);

  useEffect(() => {
    setLayout(store.catalog_layout_default === "list" ? "list" : "grid");
  }, [store.slug, store.catalog_layout_default]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filterSlug !== "all") {
        if (p.category_slug !== filterSlug) return false;
      }
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.category_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, filterSlug, search]);

  const highlights = useMemo(
    () => filtered.filter((p) => Boolean(p.catalog_spotlight?.trim())),
    [filtered],
  );

  return (
    <div className="mx-auto w-full max-w-screen-2xl">
      <CatalogHeader storeSlug={store.slug} cartCount={cart.count} onOpenCart={() => setSheetOpen(true)} />

      <CatalogHero store={store} />

      <section className="mx-4 my-3 rounded-[20px] border border-loja-primary/15 bg-gradient-to-br from-loja-primary/10 via-loja-bg to-loja-surface p-[18px]">
        <h2 className="font-display text-xl font-bold text-loja-primary">Peça com carinho</h2>
        <p className="mt-2 text-[0.9rem] text-loja-muted">
          Monte seu pedido aqui; ao finalizar, confira a mensagem que será enviada ao WhatsApp da loja.
        </p>
      </section>

      <section
        id="entrega-info"
        className="scroll-mt-[72px] mx-4 my-3 rounded-[20px] border border-loja-primary/15 bg-loja-surface p-4 shadow-loja"
        aria-labelledby="entrega-info-title"
      >
        <h2 id="entrega-info-title" className="font-display text-base font-bold text-loja-primary">
          Entrega e retirada
        </h2>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-loja-muted">
          Você escolhe no carrinho: <strong className="text-loja-ink">retirar na loja</strong>,{" "}
          <strong className="text-loja-ink">entrega pela loja</strong> ou pedido via{" "}
          <strong className="text-loja-ink">Uber Entregas</strong> / <strong className="text-loja-ink">99 Entregas</strong>{" "}
          — nestes casos o envio no app é <strong className="text-loja-ink">combinado pelo WhatsApp</strong> (link, taxa e
          horário). As formas de pagamento são as que a loja habilitar.
        </p>
      </section>

      <div className="px-4 pb-1 pt-2">
        <label className="sr-only" htmlFor="vitrine-search">
          Buscar no cardápio
        </label>
        <div className="flex items-center gap-2.5 rounded-2xl border border-loja-ink/[0.08] bg-loja-surface px-3.5 py-3 shadow-loja transition-[border-color,box-shadow] focus-within:border-loja-primary/50 focus-within:ring-2 focus-within:ring-loja-primary/20">
          <span className="text-loja-muted" aria-hidden>
            🔍
          </span>
          <input
            id="vitrine-search"
            className="min-w-0 flex-1 border-0 bg-transparent text-[0.95rem] outline-none placeholder:text-[#a8988c]"
            placeholder="Buscar produto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2">
        <p className="max-w-[42ch] text-[0.68rem] leading-snug text-[#9a8b80]">
          Layout (RF-CF-08): o padrão vem da loja; pode alternar entre grade e lista.
        </p>
        <div
          className="inline-flex overflow-hidden rounded-xl border border-loja-ink/10 bg-loja-surface shadow-loja"
          role="group"
          aria-label="Layout do catálogo"
        >
          <button
            type="button"
            className={`px-3.5 py-2 text-[0.78rem] font-bold ${
              layout === "grid" ? "bg-loja-primary text-white shadow-sm" : "text-loja-muted"
            }`}
            aria-pressed={layout === "grid"}
            onClick={() => setLayout("grid")}
          >
            Grade
          </button>
          <button
            type="button"
            className={`px-3.5 py-2 text-[0.78rem] font-bold ${
              layout === "list" ? "bg-loja-primary text-white shadow-sm" : "text-loja-muted"
            }`}
            aria-pressed={layout === "list"}
            onClick={() => setLayout("list")}
          >
            Lista
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterPill label="Todos" active={filterSlug === "all"} onClick={() => setFilterSlug("all")} />
        {categories.map((c) => (
          <FilterPill
            key={c.id}
            label={c.name}
            active={filterSlug === c.slug}
            onClick={() => setFilterSlug(c.slug)}
          />
        ))}
      </div>

      {highlights.length > 0 ? (
        <section id="destaques" className="scroll-mt-[72px] mt-1" aria-labelledby="destaques-heading">
          <div className="flex items-baseline justify-between px-4 pb-1 pt-2">
            <h3
              id="destaques-heading"
              className="text-[0.72rem] font-bold uppercase tracking-widest text-loja-primary"
            >
              Em destaque &amp; novidades
            </h3>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:thin]">
            {highlights.map((p) => (
              <div
                key={p.id}
                className="min-w-[46vw] max-w-[min(280px,42vw)] shrink-0 snap-start scroll-ml-4 sm:min-w-[200px]"
              >
                <ProductCard
                  product={p}
                  storeSlug={store.slug}
                  layout="rail"
                  qty={cart.quantities[p.id] ?? 0}
                  onAdd={(d) => cart.add(p.id, d)}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div id="cardapio" className="scroll-mt-[72px] px-4 pb-1 pt-2">
        <h3 className="text-[0.72rem] font-bold uppercase tracking-widest text-loja-primary">Cardápio</h3>
      </div>

      <div
        className={
          layout === "list"
            ? "flex flex-col gap-2.5 px-4 pb-12 pt-2"
            : "grid grid-cols-2 gap-3 px-4 pb-12 pt-2 md:grid-cols-3 xl:grid-cols-4 md:gap-4"
        }
      >
        {filtered.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            storeSlug={store.slug}
            layout={layout === "list" ? "list" : "grid"}
            qty={cart.quantities[p.id] ?? 0}
            onAdd={(d) => cart.add(p.id, d)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 pb-12 text-center text-sm text-loja-muted">
          Nenhum produto encontrado. Tente outra busca ou categoria.
        </p>
      ) : null}

      <section
        id="redes-sociais"
        className="scroll-mt-[72px] mx-4 mb-4 rounded-[20px] border border-loja-ink/[0.08] bg-loja-surface p-4 shadow-loja"
        aria-labelledby="redes-heading"
      >
        <h2 id="redes-heading" className="font-display text-lg font-bold text-loja-primary">
          Redes sociais
        </h2>
        <p className="mt-1 text-[0.85rem] leading-snug text-loja-muted">
          Siga a loja para novidades e promoções. Os links são configurados pelo gestor.
        </p>
        {store.social_networks.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2.5">
            {store.social_networks.map((n) => (
              <li key={n.url}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 rounded-[14px] border border-loja-ink/10 bg-loja-bg/50 px-3.5 py-3 font-semibold text-loja-ink transition hover:border-loja-accent/25 hover:bg-loja-accentSoft"
                >
                  <span className="text-xl" aria-hidden>
                    🔗
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.92rem]">{n.label || "Link"}</span>
                    <span className="block truncate text-[0.78rem] font-medium text-loja-muted">
                      {n.url.replace(/^https?:\/\//, "")}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[0.78rem] text-[#9a8b80]">
            Nenhuma rede configurada no tema da loja (`theme.vitrine.social_networks`).
          </p>
        )}
      </section>

      <footer id="sobre" className="scroll-mt-[72px] mx-4 mb-32 px-2 pb-8 text-center text-[0.72rem] text-loja-muted">
        <p>
          {store.name} — vitrine · pedidos via WhatsApp
          {store.whatsapp ? (
            <>
              {" "}
              · <span className="font-mono text-[0.65rem]">{store.whatsapp}</span>
            </>
          ) : null}
        </p>
      </footer>

      <CatalogCartBottomBar
        cartTotal={co.cartTotal}
        hasLines={co.orderLines.length > 0}
        onPreviewMessage={() => setWaPreviewOpen(true)}
        onOpenCart={() => setSheetOpen(true)}
      />

      <CatalogCartSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        store={store}
        cart={cart}
        co={co}
        onPreviewMessage={() => setWaPreviewOpen(true)}
      />

      <WhatsAppOrderPreviewModal
        open={waPreviewOpen}
        onClose={() => setWaPreviewOpen(false)}
        messageText={co.orderMessageWithRef}
        waUrl={co.waUrl}
      />
    </div>
  );
}
