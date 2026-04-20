"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { messageFromV2Error } from "@/lib/api-v2";
import { getApiBaseUrl } from "@/lib/api";
import { useCart } from "@/lib/vitrine/cart-context";
import { getVitrineCustomerTokens } from "@/lib/vitrine/customer-session";
import { productEmoji } from "@/lib/vitrine/product-emoji";
import type {
  CategoryPublic,
  DeliveryOptionPublic,
  PaymentMethodPublic,
  ProductPublic,
  StorePublic,
} from "@/lib/vitrine/types";
import { formatBRL, whatsappOrderUrl } from "@/lib/vitrine/whatsapp";

type Props = {
  store: StorePublic;
  categories: CategoryPublic[];
  products: ProductPublic[];
};

const DELIVERY_FALLBACK: DeliveryOptionPublic[] = [
  {
    id: "retirada",
    title: "Retirar na loja",
    hint: "Sem taxa de entrega; combinamos horário pelo WhatsApp.",
  },
  {
    id: "loja_entrega",
    title: "Entrega pela loja",
    hint: "Taxa e região combinadas no WhatsApp.",
  },
  {
    id: "uber",
    title: "Uber Entregas",
    hint: "O pedido no app Uber é combinado por aqui (link, endereço e horário).",
  },
  {
    id: "nove",
    title: "99 Entregas",
    hint: "O pedido no app 99 é combinado por aqui (link, endereço e horário).",
  },
];

const PAYMENT_FALLBACK: PaymentMethodPublic[] = [
  { id: "pix", label: "PIX (chave ou QR enviados após confirmação)" },
  { id: "entrega_dinheiro", label: "Dinheiro na entrega ou na retirada" },
  { id: "entrega_cartao", label: "Cartão de crédito/débito na entrega" },
  { id: "entrega_pix", label: "PIX na entrega (na hora)" },
];

function ribbonLabels(product: ProductPublic): string[] {
  const out: string[] = [];
  const sp = product.catalog_spotlight;
  if (sp === "featured") out.push("Destaque");
  else if (sp === "new") out.push("Novidade");
  else if (sp === "bestseller") out.push("Mais vendido");
  const sale = product.catalog_sale_mode ?? "in_stock";
  if (sale === "order_only") out.push("Sob encomenda");
  return out;
}

function RibbonBadges({ labels }: { labels: string[] }) {
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

function socialIconLabel(icon: string): string {
  const i = icon.toLowerCase();
  if (i.includes("instagram")) return "📸";
  if (i.includes("facebook")) return "📘";
  if (i.includes("tiktok")) return "🎵";
  if (i.includes("youtube")) return "▶️";
  return "🔗";
}

export function CatalogView({ store, categories, products }: Props) {
  const deliveryOpts = store.delivery_options?.length ? store.delivery_options : DELIVERY_FALLBACK;
  const paymentOpts = store.payment_methods?.length ? store.payment_methods : PAYMENT_FALLBACK;

  const cart = useCart();
  const [search, setSearch] = useState("");
  const [filterSlug, setFilterSlug] = useState<string | "all">("all");
  const [layout, setLayout] = useState<"grid" | "list">(
    store.catalog_layout_default === "list" ? "list" : "grid",
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [waPreviewOpen, setWaPreviewOpen] = useState(false);
  const [orderShortCode, setOrderShortCode] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const hpRef = useRef<HTMLInputElement>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [delivery, setDelivery] = useState(deliveryOpts[0]?.id ?? "retirada");
  const [payment, setPayment] = useState(paymentOpts[0]?.id ?? "pix");

  useEffect(() => {
    const d = store.delivery_options?.length ? store.delivery_options : DELIVERY_FALLBACK;
    const p = store.payment_methods?.length ? store.payment_methods : PAYMENT_FALLBACK;
    setLayout(store.catalog_layout_default === "list" ? "list" : "grid");
    setDelivery(d[0]?.id ?? "retirada");
    setPayment(p[0]?.id ?? "pix");
    // Apenas ao mudar de loja — não repor escolhas do cliente a cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.slug]);

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

  const highlights = useMemo(
    () => filtered.filter((p) => Boolean(p.catalog_spotlight?.trim())),
    [filtered],
  );

  const cartTotal = cart.total(productsById);

  const orderLines = useMemo(() => {
    const lines: { product: ProductPublic; qty: number }[] = [];
    for (const [id, qty] of Object.entries(cart.quantities)) {
      const product = productsById.get(id);
      if (product && qty > 0) lines.push({ product, qty });
    }
    return lines;
  }, [cart.quantities, productsById]);

  const deliveryLabel = deliveryOpts.find((d) => d.id === delivery)?.title ?? delivery;
  const paymentLabel = paymentOpts.find((p) => p.id === payment)?.label ?? payment;

  const orderMessage = useMemo(() => {
    if (orderLines.length === 0) return "";
    return cart.formatOrderText({
      storeName: store.name,
      lines: orderLines,
      customerName,
      customerPhone,
      delivery: deliveryLabel,
      payment: paymentLabel,
      address: delivery !== "retirada" ? address : undefined,
      orderGreeting: store.order_greeting,
      deliveryOptionId: delivery,
    });
  }, [
    cart,
    store.name,
    store.order_greeting,
    orderLines,
    customerName,
    customerPhone,
    delivery,
    deliveryLabel,
    paymentLabel,
    address,
  ]);

  const orderMessageWithRef = useMemo(() => {
    if (!orderMessage) return "";
    if (!orderShortCode) return orderMessage;
    return `${orderMessage}\n\n*Ref. pedido:* #${orderShortCode}`;
  }, [orderMessage, orderShortCode]);

  useEffect(() => {
    setOrderShortCode(null);
  }, [cart.quantities]);

  const waUrl = useMemo(() => {
    if (!store.whatsapp || orderLines.length === 0 || !orderMessageWithRef) return "";
    if (!orderShortCode) return "";
    return whatsappOrderUrl(store.whatsapp, orderMessageWithRef);
  }, [store.whatsapp, orderLines.length, orderMessageWithRef, orderShortCode]);

  const needAddress = delivery !== "retirada";

  async function registerOrderWithApi() {
    if (orderLines.length === 0) return;
    if (needAddress && !address.trim()) {
      setRegisterError("Indique o endereço para entrega.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setRegisterError("Preencha nome e telefone.");
      return;
    }
    setRegisterError(null);
    setRegistering(true);
    try {
      const items = orderLines.map((l) => ({
        product_id: l.product.id,
        quantity: String(l.qty),
      }));
      const body: Record<string, unknown> = {
        items,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_note: null,
        delivery_option_id: delivery,
        payment_method_id: payment,
        delivery_address: needAddress ? address.trim() || null : null,
        website: hpRef.current?.value ?? "",
      };
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const tok = getVitrineCustomerTokens(store.slug)?.access_token;
      if (tok) headers.Authorization = `Bearer ${tok}`;
      const res = await fetch(
        `${getApiBaseUrl()}/api/v2/public/stores/${encodeURIComponent(store.slug)}/orders`,
        { method: "POST", headers, body: JSON.stringify(body) },
      );
      const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const msg =
          messageFromV2Error(raw) ??
          (typeof raw.detail === "string" ? raw.detail : "Não foi possível registar o pedido.");
        setRegisterError(msg);
        return;
      }
      const ok = raw.success === true && raw.data && typeof raw.data === "object";
      const inner = ok ? (raw.data as { short_code?: string }) : null;
      if (inner && typeof inner.short_code === "string" && inner.short_code) {
        setOrderShortCode(inner.short_code);
      } else {
        setRegisterError("Resposta inválida da API.");
      }
    } catch {
      setRegisterError("Não foi possível contactar a API.");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl">
      <header className="sticky top-0 z-[70] border-b border-loja-primary/25 bg-white/90 shadow-loja-bar backdrop-blur-md">
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
          <nav className="flex flex-wrap gap-1 text-[0.8rem] font-semibold text-loja-muted" aria-label="Secções">
            <Link
              href={`/loja/${store.slug}/conta`}
              className="rounded-lg px-2.5 py-2 hover:bg-loja-primary/8 hover:text-loja-primary"
            >
              Conta
            </Link>
            <a
              href="#destaques"
              className="rounded-lg px-2.5 py-2 hover:bg-loja-primary/8 hover:text-loja-primary"
            >
              Destaques
            </a>
            <a
              href="#cardapio"
              className="rounded-lg px-2.5 py-2 hover:bg-loja-primary/8 hover:text-loja-primary"
            >
              Cardápio
            </a>
            <a
              href="#entrega-info"
              className="rounded-lg px-2.5 py-2 hover:bg-loja-primary/8 hover:text-loja-primary"
            >
              Entrega
            </a>
            <a
              href="#redes-sociais"
              className="rounded-lg px-2.5 py-2 hover:bg-loja-primary/8 hover:text-loja-primary"
            >
              Redes
            </a>
            <a href="#sobre" className="rounded-lg px-2.5 py-2 hover:bg-loja-primary/8 hover:text-loja-primary">
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

      <div className="border-b border-loja-primary/15 bg-gradient-to-b from-loja-surface via-loja-primary/[0.06] to-loja-bg/40">
        <div className="flex flex-col items-center gap-2.5 px-5 pb-5 pt-2 text-center">
          <div className="grid h-28 w-28 shrink-0 overflow-hidden rounded-[28px] border-2 border-loja-primary/35 bg-gradient-to-br from-white to-loja-primary/12 shadow-loja">
            {store.logo_image_url && /^https:\/\//i.test(store.logo_image_url.trim()) ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL configurada pelo lojista
              <img
                src={store.logo_image_url.trim()}
                alt={`Logótipo ${store.name}`}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-5xl leading-none" aria-hidden>
                {store.logo_emoji}
              </span>
            )}
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
          {store.social_networks.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {store.social_networks.map((n) => (
                <a
                  key={n.url}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-loja-primary/20 bg-loja-surface text-lg shadow-loja hover:bg-loja-primary/10"
                  title={n.label}
                >
                  <span aria-hidden>{socialIconLabel(n.icon)}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

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

      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-loja-ink/10 bg-loja-surface/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
        role="region"
        aria-label="Resumo do pedido"
      >
        <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-loja-muted">Total</p>
            <p className="text-lg font-bold text-loja-ink">{formatBRL(cartTotal)}</p>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {orderLines.length > 0 ? (
              <button
                type="button"
                className="rounded-2xl border border-loja-ink/15 bg-loja-bg px-4 py-3 text-sm font-bold text-loja-ink"
                onClick={() => setWaPreviewOpen(true)}
              >
                Ver mensagem
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-2xl bg-loja-whatsapp px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#0f7a6e]"
              onClick={() => setSheetOpen(true)}
            >
              Ver carrinho
            </button>
          </div>
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
                        className="h-8 w-8 rounded-lg border border-loja-ink/10 bg-loja-surface text-lg leading-none disabled:opacity-40"
                        onClick={() => cart.add(product.id, 1)}
                        disabled={product.catalog_sale_mode === "unavailable"}
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
                As opções abaixo alimentam a mensagem enviada ao WhatsApp da loja (RF-CF-09 / RF-PE-08).
              </p>
              <label className="mb-3 block">
                <span className="mb-1 block text-[0.78rem] font-semibold text-loja-muted">Nome completo</span>
                <input
                  className="w-full rounded-xl border border-loja-ink/10 bg-loja-surface px-3 py-2.5 text-[0.92rem]"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label className="mb-3 block">
                <span className="mb-1 block text-[0.78rem] font-semibold text-loja-muted">Telefone / WhatsApp</span>
                <input
                  className="w-full rounded-xl border border-loja-ink/10 bg-loja-surface px-3 py-2.5 text-[0.92rem]"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
              {needAddress ? (
                <label className="mb-3 block">
                  <span className="mb-1 block text-[0.78rem] font-semibold text-loja-muted">Endereço de entrega</span>
                  <textarea
                    className="min-h-[72px] w-full resize-y rounded-xl border border-loja-ink/10 bg-loja-surface px-3 py-2.5 text-[0.92rem]"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <span className="mt-1 block text-[0.68rem] text-loja-muted">
                    Obrigatório para entregas. Para Uber/99, use o mesmo endereço que informar no app.
                  </span>
                </label>
              ) : null}
              <p className="mb-2 text-[0.78rem] font-semibold text-loja-muted">Como receber</p>
              <div className="mb-4 flex flex-col gap-2">
                {deliveryOpts.map((d) => (
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
                {paymentOpts.map((p) => (
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
              <input
                ref={hpRef}
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="absolute h-px w-px overflow-hidden opacity-0"
                aria-hidden
              />
              {orderLines.length > 0 ? (
                <div className="mb-3 rounded-2xl border border-loja-primary/20 bg-loja-primary/[0.06] px-3 py-3">
                  <p className="text-[0.78rem] font-semibold text-loja-ink">
                    1. Registar o pedido na loja
                  </p>
                  <p className="mt-1 text-[0.72rem] text-loja-muted">
                    O pedido aparece no painel do lojista. Depois pode abrir o WhatsApp com a referência.
                  </p>
                  <button
                    type="button"
                    disabled={
                      registering ||
                      !customerName.trim() ||
                      !customerPhone.trim() ||
                      (needAddress && !address.trim())
                    }
                    className="mt-2 w-full rounded-xl bg-loja-primary py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                    onClick={() => void registerOrderWithApi()}
                  >
                    {registering
                      ? "A registar…"
                      : orderShortCode
                        ? `Pedido registado (#${orderShortCode})`
                        : "Registar pedido"}
                  </button>
                  {registerError ? (
                    <p className="mt-2 text-[0.78rem] text-red-700">{registerError}</p>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                className="mb-2 w-full rounded-2xl border border-loja-ink/15 bg-loja-surface py-3 text-sm font-bold text-loja-ink shadow-sm hover:bg-loja-bg"
                onClick={() => setWaPreviewOpen(true)}
              >
                Pré-visualizar mensagem (WhatsApp)
              </button>
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-loja-whatsapp py-3.5 text-center text-sm font-bold text-white shadow-md hover:bg-[#0f7a6e]"
                >
                  Abrir WhatsApp com o pedido
                </a>
              ) : store.whatsapp && orderLines.length > 0 && !orderShortCode ? (
                <p className="rounded-2xl border border-dashed border-loja-amber-400/50 bg-amber-50/80 px-3 py-4 text-center text-[0.85rem] text-loja-ink">
                  Registe o pedido acima para gerar a referência e abrir o WhatsApp.
                </p>
              ) : !store.whatsapp ? (
                <p className="rounded-2xl border border-dashed border-loja-ink/15 bg-loja-surface px-3 py-4 text-center text-[0.85rem] text-loja-muted">
                  Configure o WhatsApp da loja no painel para habilitar o envio.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>

      {waPreviewOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wa-preview-title"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-loja-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-loja-ink/10 px-4 py-3">
              <h2 id="wa-preview-title" className="text-lg font-bold">
                Mensagem do pedido
              </h2>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-loja-muted hover:bg-loja-ink/5"
                onClick={() => setWaPreviewOpen(false)}
              >
                Fechar
              </button>
            </div>
            <p className="border-b border-loja-ink/5 px-4 py-2 text-[0.75rem] text-loja-muted">
              Será enviada para o WhatsApp da loja com o texto abaixo (RF-PE-08).
            </p>
            <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-words px-4 py-3 text-[0.82rem] text-loja-ink">
              {orderMessageWithRef || "—"}
            </pre>
            <div className="flex flex-wrap gap-2 border-t border-loja-ink/10 p-4">
              <button
                type="button"
                className="flex-1 rounded-xl border border-loja-ink/15 py-3 text-sm font-semibold"
                onClick={() => setWaPreviewOpen(false)}
              >
                Ajustar carrinho
              </button>
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-loja-whatsapp py-3 text-center text-sm font-bold text-white"
                  onClick={() => setWaPreviewOpen(false)}
                >
                  Abrir WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
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
          ? "border-loja-primary bg-loja-primary text-white shadow-sm"
          : "border-loja-ink/10 bg-loja-surface text-loja-muted hover:border-loja-primary/30"
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
