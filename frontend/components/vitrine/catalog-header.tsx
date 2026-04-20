import Link from "next/link";

type Props = {
  storeSlug: string;
  cartCount: number;
  onOpenCart: () => void;
};

export function CatalogHeader({ storeSlug, cartCount, onOpenCart }: Props) {
  return (
    <header className="sticky top-0 z-[70] border-b border-loja-primary/25 bg-white/90 shadow-loja-bar backdrop-blur-md">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
        <nav className="flex flex-wrap gap-1 text-[0.8rem] font-semibold text-loja-muted" aria-label="Secções">
          <Link
            href={`/loja/${storeSlug}/conta`}
            className="rounded-lg px-2.5 py-2 hover:bg-loja-primary/8 hover:text-loja-primary"
          >
            Conta
          </Link>
          <a href="#destaques" className="rounded-lg px-2.5 py-2 hover:bg-loja-primary/8 hover:text-loja-primary">
            Destaques
          </a>
          <a href="#cardapio" className="rounded-lg px-2.5 py-2 hover:bg-loja-primary/8 hover:text-loja-primary">
            Cardápio
          </a>
          <a href="#entrega-info" className="rounded-lg px-2.5 py-2 hover:bg-loja-primary/8 hover:text-loja-primary">
            Entrega
          </a>
          <a href="#redes-sociais" className="rounded-lg px-2.5 py-2 hover:bg-loja-primary/8 hover:text-loja-primary">
            Redes
          </a>
          <a href="#sobre" className="rounded-lg px-2.5 py-2 hover:bg-loja-primary/8 hover:text-loja-primary">
            Sobre
          </a>
        </nav>
        <button
          type="button"
          className="relative grid h-[46px] w-[46px] place-items-center rounded-[14px] border-0 bg-loja-surface text-loja-ink shadow-loja"
          onClick={onOpenCart}
          aria-label="Abrir carrinho"
        >
          <span className="text-lg" aria-hidden>
            🛒
          </span>
          {cartCount > 0 ? (
            <span className="absolute right-0.5 top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-loja-accent px-1.5 text-[0.68rem] font-bold text-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
}
