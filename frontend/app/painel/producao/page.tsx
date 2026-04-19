import Link from "next/link";

export default function ProducaoPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Produção</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        As corridas de produção são registadas a partir das <strong>receitas</strong> (botão
        &quot;Produzir lote&quot;). Consulte também o relatório financeiro para custo de insumos no
        período.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/painel/receitas"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Receitas e produção
        </Link>
        <Link
          href="/painel/relatorio"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Relatório financeiro
        </Link>
      </div>
    </>
  );
}
