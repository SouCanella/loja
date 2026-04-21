import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Loja — Vitrine e gestão para lojas caseiras",
  description:
    "Catálogo online, pedidos organizados, stock e receitas num só painel. Os teus clientes encomendam pela vitrine; tu geres tudo num só sítio.",
  openGraph: {
    title: "Loja — Vitrine e gestão para lojas caseiras",
    description:
      "Catálogo online e painel de gestão. Multi-tenant por loja; sem promessas de funcionalidades ainda não disponíveis no produto.",
    url: siteUrl,
    locale: "pt_BR",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <SiteHeader />
      <main>
        <section className="border-b border-slate-100 bg-gradient-to-b from-emerald-50/60 to-white">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Gestão e vitrine para a tua loja caseira — sem folhas de cálculo à mistura.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              Catálogo online, pedidos organizados, stock e receitas num só painel. Os teus clientes encomendam pela
              vitrine; tu geres tudo num só sítio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/registo"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
              >
                Criar loja grátis
              </Link>
              <Link
                href="/loja/demo"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                Ver demo
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-emerald-800 hover:underline"
              >
                Entrar
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Sem cartão para experimentar · Configuração guiada · Dados por loja isolados (multi-tenant)
            </p>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-20 border-b border-slate-100 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-bold text-slate-900">Três passos para pôr a loja online</h2>
            <ol className="mt-8 grid gap-8 sm:grid-cols-3">
              <li>
                <p className="text-sm font-semibold text-emerald-800">1</p>
                <h3 className="mt-1 font-semibold text-slate-900">Cria a conta e a loja</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Nome, slug para o link público (<code className="rounded bg-slate-100 px-1">/loja/o-teu-slug</code>) e
                  acesso seguro.
                </p>
              </li>
              <li>
                <p className="text-sm font-semibold text-emerald-800">2</p>
                <h3 className="mt-1 font-semibold text-slate-900">Configura produtos e aparência</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Preços, categorias, imagens e tema da vitrine (cores, logótipo, mensagens).
                </p>
              </li>
              <li>
                <p className="text-sm font-semibold text-emerald-800">3</p>
                <h3 className="mt-1 font-semibold text-slate-900">Partilha o link e gere pedidos</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Pedidos no painel com estados claros; produção, stock e relatórios quando precisares.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section id="funcionalidades" className="scroll-mt-20 border-b border-slate-100 bg-slate-50/50 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-bold text-slate-900">Funcionalidades</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  t: "Vitrine pública",
                  d: "Loja por slug, mobile-first; tema alinhado à tua marca.",
                },
                {
                  t: "Pedidos com fluxo claro",
                  d: "Estados do pedido (confirmar, produzir, entregar) adaptados ao teu ritmo.",
                },
                {
                  t: "Catálogo e categorias",
                  d: "Produtos, imagens e disponibilidade.",
                },
                {
                  t: "Stock e receitas",
                  d: "Insumos, receitas, produção e sugestão de preço.",
                },
                {
                  t: "Relatórios",
                  d: "Visão financeira e de margem no painel.",
                },
                {
                  t: "Conta e segurança",
                  d: "Perfil e palavra-passe no painel.",
                },
              ].map((c) => (
                <div key={c.t} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900">{c.t}</h3>
                  <p className="mt-2 text-sm text-slate-600">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-bold text-slate-900">Feito para quem produz e vende em pequena escala</h2>
            <ul className="mt-6 list-inside list-disc space-y-2 text-slate-600">
              <li>Bolos, doces e salgados artesanais</li>
              <li>Take-away e catering local</li>
              <li>Artesanato e peças únicas</li>
              <li>Pequenos produtores que usam WhatsApp mas precisam de histórico e números</li>
            </ul>
          </div>
        </section>

        <section id="precos" className="border-b border-slate-100 bg-emerald-50/40 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-bold text-slate-900">Preços</h2>
            <p className="mt-4 max-w-2xl text-slate-600">
              Modelos de subscrição e limites comerciais serão definidos mais tarde (ver roadmap). Enquanto isso, podes
              experimentar o núcleo do produto sem integração de pagamento automático na plataforma.
            </p>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-bold text-slate-900">Perguntas frequentes</h2>
            <dl className="mt-8 space-y-6">
              <div>
                <dt className="font-semibold text-slate-900">Preciso de empresa (CNPJ) para começar?</dt>
                <dd className="mt-1 text-sm text-slate-600">
                  Depende da tua jurisdição e obrigações fiscais; o produto não substitui aconselhamento jurídico ou
                  contabilístico.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Há aplicativo móvel?</dt>
                <dd className="mt-1 text-sm text-slate-600">
                  O painel é web responsivo. Apps nativos podem integrar o roadmap — consulta a documentação do produto.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Como recebo pagamentos dos clientes?</dt>
                <dd className="mt-1 text-sm text-slate-600">
                  Hoje o fluxo típico é combinar com o cliente (ex.: PIX, dinheiro na entrega). Gateways integrados são
                  evolução futura se e quando estiverem no repositório.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Os meus dados estão isolados de outras lojas?</dt>
                <dd className="mt-1 text-sm text-slate-600">
                  Sim: o modelo é multi-tenant por loja (<code className="rounded bg-slate-100 px-1">store_id</code>).
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Posso usar o meu domínio?</dt>
                <dd className="mt-1 text-sm text-slate-600">
                  O caminho actual é vitrine em caminho/path no mesmo site; domínio próprio pode entrar no roadmap.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Onde vejo relatórios de vendas?</dt>
                <dd className="mt-1 text-sm text-slate-600">
                  No painel, em relatórios e dashboard, conforme as funcionalidades já disponíveis na tua conta.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="border-t border-slate-100 bg-slate-900 py-16 text-white">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <h2 className="text-2xl font-bold">Pronto para organizar a tua loja?</h2>
            <p className="mt-2 text-sm text-slate-300">Sem compromisso inicial para experimentar o núcleo.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/registo"
                className="inline-flex rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Criar loja grátis
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
