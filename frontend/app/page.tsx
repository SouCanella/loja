import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold text-slate-800">Loja — frontend</h1>
      <p className="mt-2 text-slate-600">Fase 1 · rotas vitrine e painel</p>
      <nav className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-700">
        <Link className="underline" href="/loja/demo">
          Vitrine (/loja/demo)
        </Link>
        <Link className="underline" href="/login">
          Login
        </Link>
        <Link className="underline" href="/painel">
          Painel
        </Link>
      </nav>
    </main>
  );
}
