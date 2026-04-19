import Link from "next/link";

export default function ClientesPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
        Nesta versão (3.1-a) não existe entidade de cliente separada: o contacto e o histórico aparecem
        nos <strong>pedidos</strong>. Use a lista de pedidos para acompanhar encomendas e notas.
      </p>
      <p className="mt-4 text-sm text-slate-500">
        Evolução prevista (3.1-b): nome e telefone no pedido e vista agregada por contacto.
      </p>
      <Link
        href="/painel/pedidos"
        className="mt-8 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Ir para pedidos
      </Link>
    </>
  );
}
