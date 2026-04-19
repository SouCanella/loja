"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

type NavItem = { href: string; label: string; disabled?: boolean; hint?: string };

const GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Visão geral", items: [{ href: "/painel", label: "Dashboard" }] },
  {
    title: "Loja & vitrine",
    items: [
      { href: "/painel/configuracao", label: "Configuração da loja" },
      { href: "/painel/catalogo", label: "Produtos & catálogo" },
      { href: "/painel/categorias", label: "Categorias" },
    ],
  },
  {
    title: "Vendas",
    items: [
      { href: "/painel/pedidos", label: "Pedidos" },
      { href: "/painel/clientes", label: "Clientes" },
    ],
  },
  {
    title: "Operação",
    items: [
      { href: "/painel/insumos", label: "Insumos & estoque" },
      { href: "/painel/receitas", label: "Receitas" },
      { href: "/painel/producao", label: "Produção" },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { href: "/painel/precificacao", label: "Precificação" },
      { href: "/painel/financeiro", label: "Financeiro" },
      { href: "/painel/relatorio", label: "Relatórios" },
    ],
  },
  {
    title: "Qualidade",
    items: [
      {
        href: "#",
        label: "Avaliações",
        disabled: true,
        hint: "Previsto no backlog (RN-025–027)",
      },
    ],
  },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active =
    !item.disabled &&
    (item.href === "/painel"
      ? pathname === "/painel"
      : pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (item.disabled) {
    return (
      <span
        className="flex cursor-not-allowed items-center rounded-lg px-3 py-2 text-sm text-slate-500 opacity-60"
        title={item.hint}
      >
        {item.label}
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "bg-indigo-600/90 text-white" : "text-slate-200 hover:bg-white/10"
      }`}
    >
      {item.label}
    </Link>
  );
}

export function PainelShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] print:max-w-none">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-100 md:flex print:hidden">
          <div className="border-b border-white/10 px-4 py-4">
            <Link href="/painel" className="text-lg font-semibold text-white">
              Painel
            </Link>
            <p className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-slate-400">Gestão da loja</p>
          </div>
          <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
            {GROUPS.map((g) => (
              <div key={g.title}>
                <div className="px-3 pb-1 text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                  {g.title}
                </div>
                <div className="flex flex-col gap-0.5">
                  {g.items.map((item) => (
                    <NavLink key={item.label + item.href} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-white/10 p-3 print:hidden">
            <Link
              href="/login"
              className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
            >
              Sessão / sair
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 md:hidden print:hidden">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              Menu
            </button>
            <Link href="/painel" className="font-semibold text-slate-900">
              Painel
            </Link>
            <span className="w-14" />
          </header>
          {open ? (
            <div className="fixed inset-0 z-30 md:hidden print:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-black/40"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
              />
              <nav className="absolute left-0 top-0 h-full w-[min(100%,280px)] overflow-y-auto bg-slate-900 p-4 text-slate-100 shadow-xl">
                {GROUPS.map((g) => (
                  <div key={g.title} className="mb-4">
                    <div className="px-2 pb-1 text-[0.65rem] font-bold uppercase text-slate-500">{g.title}</div>
                    <div className="flex flex-col gap-0.5">
                      {g.items.map((item) => (
                        <div key={item.label} onClick={() => setOpen(false)}>
                          <NavLink item={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Link href="/login" className="mt-4 block rounded-lg px-3 py-2 text-sm text-slate-300">
                  Sessão
                </Link>
              </nav>
            </div>
          ) : null}
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 print:p-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
