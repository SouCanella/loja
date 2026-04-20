import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          Loja
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
          <a href="#funcionalidades" className="hover:text-slate-900">
            Funcionalidades
          </a>
          <a href="#como-funciona" className="hover:text-slate-900">
            Como funciona
          </a>
          <a href="#faq" className="hover:text-slate-900">
            FAQ
          </a>
          <Link href="/login" className="hover:text-slate-900">
            Entrar
          </Link>
          <Link
            href="/registo"
            className="rounded-lg bg-emerald-700 px-3 py-2 text-white shadow-sm hover:bg-emerald-800"
          >
            Criar loja
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
          <Link href="/login" className="text-sm font-medium text-slate-700">
            Entrar
          </Link>
          <Link
            href="/registo"
            className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
          >
            Criar loja
          </Link>
        </div>
      </div>
    </header>
  );
}
