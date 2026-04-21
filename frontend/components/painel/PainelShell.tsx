"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { type ReactNode, useEffect, useState } from "react";

import { PainelNotificationsBell } from "@/components/painel/PainelNotificationsBell";

type NavItem = { href: string; label: string; disabled?: boolean; hint?: string };

/** Fallback sólido; gradiente em roxo alinhado ao CTA dos botões (mais claro que o preto-roxo anterior). */
const SIDEBAR_SOLID = "#301a3e" as const;
const SIDEBAR_GRADIENT =
  "linear-gradient(165deg, #452252 0%, #301a3e 45%, #24142f 100%)" as const;

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
      { href: "/painel/notificacoes", label: "Notificações" },
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
      { href: "/painel/relatorio-estoque", label: "Stock (insumos)" },
      { href: "/painel/analytics-vitrine", label: "Vitrine (analytics)" },
    ],
  },
  {
    title: "Conta",
    items: [{ href: "/painel/conta", label: "Perfil e segurança" }],
  },
  {
    title: "Qualidade",
    items: [
      {
        href: "#",
        label: "Avaliações",
        disabled: true,
        hint: "Funcionalidade prevista para uma versão futura.",
      },
    ],
  },
];

function NavLink({ item, onPress }: { item: NavItem; onPress?: () => void }) {
  const pathname = usePathname();
  const active =
    !item.disabled &&
    (item.href === "/painel"
      ? pathname === "/painel"
      : pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (item.disabled) {
    return (
      <span
        className="flex cursor-not-allowed items-center rounded-lg px-3 py-2 text-sm text-painel-nav-label/45"
        title={item.hint}
      >
        {item.label}
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      className={`relative z-10 block min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium leading-snug no-underline transition [-webkit-tap-highlight-color:transparent] touch-manipulation ${
        active
          ? "bg-painel-primary text-white shadow-[inset_4px_0_0_0_#FFDE21,0_6px_18px_-6px_rgba(138,5,190,0.55)] hover:text-white"
          : "text-violet-100/95 visited:text-violet-100 hover:bg-painel-primary/20 hover:text-white"
      }`}
      onClick={() => onPress?.()}
    >
      {item.label}
    </Link>
  );
}

function NavGroup({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-painel-primary/25 bg-painel-primary/[0.08] p-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_1px_12px_rgba(138,5,190,0.12)] ${className}`}
    >
      <p className="select-none px-1.5 pb-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-painel-nav-label">
        {title}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export function PainelShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [navMounted, setNavMounted] = useState(false);

  useEffect(() => setNavMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="min-h-dvh bg-slate-50 print:bg-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1600px] print:max-w-none">
        {/* Desktop sidebar */}
        <aside
          className="hidden w-60 shrink-0 flex-col border-r border-painel-sidebar-border text-neutral-100 [color-scheme:dark] md:flex print:hidden"
          style={{ backgroundColor: SIDEBAR_SOLID, backgroundImage: SIDEBAR_GRADIENT }}
        >
          <div className="flex items-start justify-between gap-2 border-b border-painel-primary/25 bg-painel-primary/[0.07] px-4 py-4">
            <div className="min-w-0">
              <Link href="/painel" className="text-lg font-semibold tracking-tight text-white no-underline drop-shadow-sm">
                Painel
              </Link>
              <p className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-painel-nav-label/90">
                Gestão da loja
              </p>
            </div>
            <PainelNotificationsBell />
          </div>
          <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-4">
            {GROUPS.map((g) => (
              <NavGroup key={g.title} title={g.title}>
                {g.items.map((item) => (
                  <NavLink key={item.label + item.href} item={item} />
                ))}
              </NavGroup>
            ))}
          </nav>
          <div className="border-t border-painel-primary/25 bg-black/[0.12] p-3 print:hidden">
            <Link
              href="/login"
              className="block rounded-lg border border-painel-primary/20 px-3 py-2 text-center text-sm text-painel-nav-label no-underline transition hover:border-painel-secondary/35 hover:bg-painel-primary/15 hover:text-white"
            >
              Sessão / sair
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 md:hidden print:hidden">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              Menu
            </button>
            <Link href="/painel" className="font-semibold text-painel-primary-strong no-underline">
              Painel
            </Link>
            <div className="flex w-14 justify-end">
              <PainelNotificationsBell variant="light" />
            </div>
          </header>
          {navMounted && open
            ? createPortal(
                <div
                  className="fixed inset-0 z-[300] isolate pointer-events-none md:hidden print:hidden"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Menu do painel"
                >
                  <button
                    type="button"
                    className="pointer-events-auto absolute inset-0 z-[1] bg-black/45"
                    aria-label="Fechar menu"
                    onClick={() => setOpen(false)}
                  />
                  <nav
                    className="pointer-events-auto absolute left-0 top-0 z-[2] flex h-full min-h-0 w-[min(100%,280px)] max-w-[85vw] touch-manipulation flex-col overflow-y-auto overscroll-contain border-r border-painel-sidebar-border p-3 text-neutral-100 shadow-2xl shadow-painel-primary/20 [color-scheme:dark]"
                    style={{ backgroundColor: SIDEBAR_SOLID, backgroundImage: SIDEBAR_GRADIENT }}
                  >
                    <div className="mb-3 shrink-0 rounded-lg border border-painel-primary/20 bg-painel-primary/[0.08] px-3 py-2.5">
                      <Link
                        href="/painel"
                        className="inline-block min-h-[44px] text-lg font-semibold leading-tight text-white no-underline drop-shadow-sm [-webkit-tap-highlight-color:transparent] touch-manipulation"
                        onClick={() => setOpen(false)}
                      >
                        Painel
                      </Link>
                      <p className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-painel-nav-label/90">
                        Gestão da loja
                      </p>
                    </div>
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
                      {GROUPS.map((g) => (
                        <NavGroup key={g.title} title={g.title}>
                          {g.items.map((item) => (
                            <NavLink
                              key={item.label + item.href}
                              item={item}
                              onPress={() => setOpen(false)}
                            />
                          ))}
                        </NavGroup>
                      ))}
                    </div>
                    <Link
                      href="/login"
                      className="mt-3 flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-painel-primary/25 bg-black/[0.15] px-3 py-2.5 text-center text-sm text-painel-nav-label no-underline transition [-webkit-tap-highlight-color:transparent] touch-manipulation hover:border-painel-secondary/40 hover:bg-painel-primary/15 hover:text-white"
                      onClick={() => setOpen(false)}
                    >
                      Sessão / sair
                    </Link>
                  </nav>
                </div>,
                document.body,
              )
            : null}
          <main className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 print:p-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
