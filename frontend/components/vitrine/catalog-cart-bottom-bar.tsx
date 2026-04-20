import { formatBRL } from "@/lib/vitrine/whatsapp";

type Props = {
  cartTotal: number;
  hasLines: boolean;
  onPreviewMessage: () => void;
  onOpenCart: () => void;
};

export function CatalogCartBottomBar({ cartTotal, hasLines, onPreviewMessage, onOpenCart }: Props) {
  return (
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
          {hasLines ? (
            <button
              type="button"
              className="rounded-2xl border border-loja-ink/15 bg-loja-bg px-4 py-3 text-sm font-bold text-loja-ink"
              onClick={onPreviewMessage}
            >
              Ver mensagem
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-2xl bg-loja-whatsapp px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#0f7a6e]"
            onClick={onOpenCart}
          >
            Ver carrinho
          </button>
        </div>
      </div>
    </div>
  );
}
