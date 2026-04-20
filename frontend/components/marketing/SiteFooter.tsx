import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">Loja</p>
            <p className="mt-1 text-sm text-slate-600">Vitrine e gestão para pequenas produções.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/termos" className="text-slate-600 hover:text-slate-900">
              Termos
            </Link>
            <Link href="/privacidade" className="text-slate-600 hover:text-slate-900">
              Privacidade
            </Link>
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Entrar
            </Link>
          </div>
        </div>
        <p className="mt-8 text-xs text-slate-500">© {year} — Documentação jurídica em revisão onde aplicável.</p>
      </div>
    </footer>
  );
}
