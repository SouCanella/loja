import { productEmoji } from "@/lib/vitrine/product-emoji";
import type { StorePublic } from "@/lib/vitrine/types";
import { formatBRL } from "@/lib/vitrine/whatsapp";

import type { VitrineCheckoutState } from "@/hooks/use-vitrine-checkout";
import { useCart } from "@/lib/vitrine/cart-context";

type CartApi = ReturnType<typeof useCart>;

type Props = {
  open: boolean;
  onClose: () => void;
  store: StorePublic;
  cart: CartApi;
  co: VitrineCheckoutState;
  onPreviewMessage: () => void;
};

export function CatalogCartSheet({ open, onClose, store, cart, co, onPreviewMessage }: Props) {
  const {
    deliveryOpts,
    paymentOpts,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    address,
    setAddress,
    delivery,
    setDelivery,
    payment,
    setPayment,
    hpRef,
    needAddress,
    orderLines,
    orderShortCode,
    registerError,
    registering,
    registerOrderWithApi,
    waUrl,
  } = co;

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] bg-[rgb(20,15,12)]/45 transition-opacity ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-[101] flex w-full max-w-xl flex-col bg-loja-bg shadow-[-8px_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out sm:max-w-2xl ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Carrinho"
      >
        <div className="flex items-center justify-between border-b border-loja-ink/[0.06] bg-loja-surface px-[18px] py-4">
          <h2 className="text-[1.05rem] font-bold">Seu pedido</h2>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-loja-muted hover:bg-loja-ink/5"
            onClick={onClose}
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
                      {qty} × {formatBRL(product.price)} = {formatBRL(Number.parseFloat(product.price) * qty)}
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
                As opções abaixo alimentam a mensagem enviada ao WhatsApp da loja.
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
                  <p className="text-[0.78rem] font-semibold text-loja-ink">1. Registar o pedido na loja</p>
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
                  {registerError ? <p className="mt-2 text-[0.78rem] text-red-700">{registerError}</p> : null}
                </div>
              ) : null}
              <button
                type="button"
                className="mb-2 w-full rounded-2xl border border-loja-ink/15 bg-loja-surface py-3 text-sm font-bold text-loja-ink shadow-sm hover:bg-loja-bg"
                onClick={onPreviewMessage}
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
    </>
  );
}
