import Link from "next/link";
import type { ReactNode } from "react";

export default function PainelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/painel" className="text-lg font-semibold text-slate-900">
            Painel
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
            <Link href="/painel/pedidos" className="hover:text-slate-900">
              Pedidos
            </Link>
            <Link href="/painel/receitas" className="hover:text-slate-900">
              Receitas
            </Link>
            <Link href="/painel/insumos" className="hover:text-slate-900">
              Insumos
            </Link>
            <Link href="/painel/definicoes" className="hover:text-slate-900">
              Definições
            </Link>
            <Link href="/painel/relatorio" className="hover:text-slate-900">
              Relatório
            </Link>
            <Link href="/login" className="hover:text-slate-900">
              Sessão
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
