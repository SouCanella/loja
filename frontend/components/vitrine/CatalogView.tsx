"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/vitrine/cart-context";
import { productEmoji } from "@/lib/vitrine/product-emoji";
import type { CategoryPublic, ProductPublic, StorePublic } from "@/lib/vitrine/types";
import { formatBRL, whatsappOrderUrl } from "@/lib/vitrine/whatsapp";

const DELIVERY_OPTIONS = [
  { id: "retirada", title: "Retirar na loja", hint: "Combine o horário pelo WhatsApp." },
  { id: "entrega", title: "Entrega no endereço", hint: "Taxa e prazo combinados na mensagem." },
];

const PAYMENT_OPTIONS = [
  { id: "pix", label: "PIX" },
  { id: "dinheiro", label: "Dinheiro na entrega / retirada" },
  { id: "cartao", label: "Cartão (maquininha)" },
];

type Props = {
  store: StorePublic;
  categories: CategoryPublic[];
  products: ProductPublic[];
};

export function CatalogView({ store, categories, products }: Props) {
  const cart = useCart();
  const [search, setSearch] = useState("");
  const [filterSlug, setFilterSlug] = useState<string | "all">("all");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [delivery, setDelivery] = useState(DELIVERY_OPTIONS[0].id);
  const [payment, setPayment] = useState(PAYMENT_OPTIONS[0].id);

  const productsById = useMemo(() => {
    const m = new Map<string, ProductPublic>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

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

  const suggestions = useMemo(() => filtered.slice(0, 4), [filtered]);

  const cartTotal = cart.total(productsById);

  const orderLines = useMemo(() => {
    const lines: { product: ProductPublic; qty: number }[] = [];
    for (const [id, qty] of Object.entries(cart.quantities)) {
      const product = productsById.get(id);
      if (product && qty > 0) lines.push({ product, qty });
    }
    return lines;
  }, [cart.quantities, productsById]);

  const waUrl = useMemo(() => {
    if (!store.whatsapp || orderLines.length === 0) return "";
    const deliveryLabel =
      DELIVERY_OPTIONS.find((d) => d.id === delivery)?.title ?? delivery;
    const paymentLabel = PAYMENT_OPTIONS.find((p) => p.id === payment)?.label ?? payment;
    const text = cart.formatOrderText({
      storeName: store.name,
      lines: orderLines,
      customerName,
      customerPhone,
      delivery: deliveryLabel,
      payment: paymentLabel,
      address: delivery === "entrega" ? address : undefined,
    });
    return whatsappOrderUrl(store.whatsapp, text);
  }, [
    store.name,
    store.whatsapp,
    orderLines,
    cart,
    customerName,
    customerPhone,
    delivery,
    payment,
    address,
  ]);

  return (
    <div className="mx-auto w-full max-w-screen-2xl">
      <header className="sticky top-0 z-[70] border-b border-loja-ink/[0.08] bg-white/90 shadow-loja-bar backdrop-blur-md">
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
          <nav className="flex gap-1 text-[0.8rem] font-semibold text-loja-muted" aria-label="Secções">
            <a href="#cardapio" className="rounded-lg px-2.5 py-2 hover:bg-loja-ink/[0.04] hover:text-loja-ink">
              Cardápio
            </a>
            <a href="#sobre" className="rounded-lg px-2.5 py-2 hover:bg-loja-ink/[0.04] hover:text-loja-ink">
              Sobre
            </a>
          </nav>
          <button
            type="button"
            className="relative grid h-[46px] w-[46px] place-items-center rounded-[14px] border-0 bg-loja-surface text-loja-ink shadow-loja"
            onClick={() => setSheetOpen(true)}
            aria-label="Abrir carrinho"
          >
            <span className="text-lg" aria-hidden>
              🛒
            </span>
            {cart.count > 0 ? (
              <span className="absolute right-0.5 top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-loja-accent px-1.5 text-[0.68rem] font-bold text-white">
                {cart.count > 99 ? "99+" : cart.count}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <div className="border-b border-loja-ink/[0.06] bg-gradient-to-b from-loja-surface to-loja-bg/40">
        <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-2" />

        <div className="flex flex-col items-center gap-2.5 px-5 pb-5 pt-2 text-center">
          <div
            className="grid h-28 w-28 shrink-0 place-items-center rounded-[28px] border-2 border-loja-accent/20 bg-gradient-to-br from-white to-loja-accentSoft text-5xl shadow-loja"
            aria-hidden
          >
            {store.logo_emoji}
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-loja-ink">
            {store.name}
          </h1>
          {store.tagline ? (
            <p className="max-w-[28ch] text-[0.88rem] text-loja-muted">{store.tagline}</p>
          ) : (
            <p className="max-w-[28ch] text-[0.88rem] text-loja-muted">
              Encomendas pelo WhatsApp · Doces caseiros
            </p>
          )}
        </div>
      </div>

      <section className="mx-4 my-3 rounded-[20px] border border-loja-accent/15 bg-gradient-to-br from-loja-accent/10 via-loja-bg to-loja-surface p-[18px]">
        <h2 className="font-display text-xl font-bold text-loja-ink">Peça com carinho</h2>
        <p className="mt-2 text-[0.9rem] text-loja-muted">
          Monte seu pedido aqui e envie tudo pronto pelo WhatsApp para a loja confirmar.
        </p>
      </section>

      <div className="px-4 pb-1 pt-2">
        <label className="sr-only" htmlFor="vitrine-search">
          Buscar no cardápio
        </label>
        <div className="flex items-center gap-2.5 rounded-2xl border border-loja-ink/[0.08] bg-loja-surface px-3.5 py-3 shadow-loja">
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
          Alternância de layout (RF-CF-08): mesmos dados em grade ou lista.
        </p>
        <div
          className="inline-flex overflow-hidden rounded-xl border border-loja-ink/10 bg-loja-surface shadow-loja"
          role="group"
          aria-label="Layout do catálogo"
        >
          <button
            type="button"
            className={`px-3.5 py-2 text-[0.78rem] font-bold ${
              layout === "grid" ? "bg-loja-ink text-white" : "text-loja-muted"
            }`}
            aria-pressed={layout === "grid"}
            onClick={() => setLayout("grid")}
          >
            Grade
          </button>
          <button
            type="button"
            className={`px-3.5 py-2 text-[0.78rem] font-bold ${
              layout === "list" ? "bg-loja-ink text-white" : "text-loja-muted"
            }`}
            aria-pressed={layout === "list"}
            onClick={() => setLayout("list")}
          >
            Lista
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterPill
          label="Todos"
          active={filterSlug === "all"}
          onClick={() => setFilterSlug("all")}
        />
        {categories.map((c) => (
          <FilterPill
            key={c.id}
            label={c.name}
            active={filterSlug === c.slug}
            onClick={() => setFilterSlug(c.slug)}
          />
        ))}
      </div>

      {suggestions.length > 0 ? (
        <section className="mt-1" aria-labelledby="destaques-heading">
          <div className="flex items-baseline justify-between px-4 pb-1 pt-2">
            <h3 id="destaques-heading" className="text-[0.72rem] font-bold uppercase tracking-widest text-loja-muted">
              Sugestões
            </h3>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:thin]">
            {suggestions.map((p) => (
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
        <h3 className="text-[0.72rem] font-bold uppercase tracking-widest text-loja-muted">
          Cardápio
        </h3>
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
        id="sobre"
        className="scroll-mt-[72px] mx-4 mb-6 rounded-[20px] border border-loja-ink/[0.08] bg-loja-surface p-4 pb-32 shadow-loja sm:pb-36"
      >
        <h2 className="font-display text-lg font-bold text-loja-ink">Redes e contato</h2>
        <p className="mt-1 text-[0.85rem] leading-snug text-loja-muted">
          Siga a loja nas redes ou fale direto pelo WhatsApp.
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
            Nenhuma rede configurada. O gestor pode adicionar links no tema da loja (`theme.vitrine.social_networks`).
          </p>
        )}
      </section>

      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-loja-ink/10 bg-loja-surface/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
        role="region"
        aria-label="Resumo do pedido"
      >
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-loja-muted">Total</p>
            <p className="text-lg font-bold text-loja-ink">{formatBRL(cartTotal)}</p>
          </div>
          <button
            type="button"
            className="rounded-2xl bg-loja-whatsapp px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#0f7a6e]"
            onClick={() => setSheetOpen(true)}
          >
            Ver carrinho
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[100] bg-[rgb(20,15,12)]/45 transition-opacity ${
          sheetOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!sheetOpen}
        onClick={() => setSheetOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-[101] flex w-full max-w-xl flex-col bg-loja-bg shadow-[-8px_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out sm:max-w-2xl ${
          sheetOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Carrinho"
      >
        <div className="flex items-center justify-between border-b border-loja-ink/[0.06] bg-loja-surface px-[18px] py-4">
          <h2 className="text-[1.05rem] font-bold">Seu pedido</h2>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-loja-muted hover:bg-loja-ink/5"
            onClick={() => setSheetOpen(false)}
          >
            Fechar
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {orderLines.length === 0 ? (
            <p className="px-2 py-8 text-center text-[0.9rem] text-loja-muted">
              Seu carrinho está vazio.
              <br />
              Adicione itens do cardápio.
            </p>
          ) : (
            <ul className="divide-y divide-loja-ink/[0.08]">
              {orderLines.map(({ product, qty }) => (
                <li key={product.id} className="flex gap-3 py-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-loja-accentSoft text-xl">
                    {productEmoji(product.id)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block text-[0.88rem]">{product.name}</strong>
                    <span className="text-[0.78rem] text-loja-muted">
                      {qty} × {formatBRL(product.price)} ={" "}
                      {formatBRL(Number.parseFloat(product.price) * qty)}
                    </span>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="h-8 w-8 rounded-lg border border-loja-ink/10 bg-loja-surface text-lg leading-none"
                        onClick={() => cart.add(product.id, -1)}
                        aria-label="Remover um"
                      >
                        −
                      </button>
                      <span className="min-w-[1.25rem] text-center text-[0.8rem] font-bold">{qty}</span>
                      <button
                        type="button"
                        className="h-8 w-8 rounded-lg border border-loja-ink/10 bg-loja-surface text-lg leading-none"
                        onClick={() => cart.add(product.id, 1)}
                        aria-label="Adicionar um"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="ml-auto text-[0.78rem] font-semibold text-loja-accent underline-offset-2 hover:underline"
                        onClick={() => cart.remove(product.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {orderLines.length > 0 ? (
            <div className="mt-4 border-t border-loja-ink/10 pt-4">
              <h3 className="mb-3 text-[0.78rem] font-bold uppercase tracking-wider text-loja-muted">
                Seus dados e entrega
              </h3>
              <p className="mb-3 text-[0.7rem] leading-snug text-[#9a8b80]">
                As opções abaixo alimentam a mensagem enviada ao WhatsApp da loja.
              </p>
              <label className="mb-3 block">
                <span className="mb-1 block text-[0.78rem] font-semibold text-loja-muted">
                  Nome completo
                </span>
                <input
                  className="w-full rounded-xl border border-loja-ink/10 bg-loja-surface px-3 py-2.5 text-[0.92rem]"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label className="mb-3 block">
                <span className="mb-1 block text-[0.78rem] font-semibold text-loja-muted">
                  Telefone / WhatsApp
                </span>
                <input
                  className="w-full rounded-xl border border-loja-ink/10 bg-loja-surface px-3 py-2.5 text-[0.92rem]"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
              {delivery === "entrega" ? (
                <label className="mb-3 block">
                  <span className="mb-1 block text-[0.78rem] font-semibold text-loja-muted">
                    Endereço de entrega
                  </span>
                  <textarea
                    className="min-h-[72px] w-full resize-y rounded-xl border border-loja-ink/10 bg-loja-surface px-3 py-2.5 text-[0.92rem]"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </label>
              ) : null}
              <p className="mb-2 text-[0.78rem] font-semibold text-loja-muted">Como receber</p>
              <div className="mb-4 flex flex-col gap-2">
                {DELIVERY_OPTIONS.map((d) => (
                  <label
                    key={d.id}
                    className={`flex cursor-pointer gap-2.5 rounded-xl border px-3 py-2.5 text-[0.86rem] leading-snug ${
                      delivery === d.id
                        ? "border-loja-accent/45 bg-loja-accentSoft/50"
                        : "border-loja-ink/10 bg-loja-surface"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      className="mt-1"
                      checked={delivery === d.id}
                      onChange={() => setDelivery(d.id)}
                    />
                    <span>
                      {d.title}
                      <small className="mt-1 block text-[0.72rem] text-loja-muted">{d.hint}</small>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mb-2 text-[0.78rem] font-semibold text-loja-muted">Forma de pagamento</p>
              <div className="mb-4 flex flex-col gap-2">
                {PAYMENT_OPTIONS.map((p) => (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer gap-2.5 rounded-xl border px-3 py-2.5 text-[0.86rem] ${
                      payment === p.id
                        ? "border-loja-accent/45 bg-loja-accentSoft/50"
                        : "border-loja-ink/10 bg-loja-surface"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      className="mt-0.5"
                      checked={payment === p.id}
                      onChange={() => setPayment(p.id)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-loja-whatsapp py-3.5 text-center text-sm font-bold text-white shadow-md hover:bg-[#0f7a6e]"
                >
                  Enviar pedido no WhatsApp
                </a>
              ) : (
                <p className="rounded-2xl border border-dashed border-loja-ink/15 bg-loja-surface px-3 py-4 text-center text-[0.85rem] text-loja-muted">
                  {orderLines.length === 0
                    ? "Adicione produtos para enviar o pedido."
                    : "Configure o número do WhatsApp da loja no tema (`theme.vitrine.whatsapp`) para habilitar o envio."}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function FilterPill({
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
          ? "border-loja-ink bg-loja-ink text-white"
          : "border-loja-ink/10 bg-loja-surface text-loja-muted hover:border-loja-ink/20"
      }`}
    >
      {label}
    </button>
  );
}

function ProductCard({
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
        <div className="flex h-full min-h-0 w-full items-center justify-center bg-gradient-to-br from-[#f0e6de] to-[#e8dcd2] text-4xl">
          {emoji}
        </div>
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
              className="h-[30px] w-[30px] rounded-lg border border-loja-ink/10 bg-loja-surface text-base leading-none"
              onClick={(e) => {
                e.preventDefault();
                onAdd(1);
              }}
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
