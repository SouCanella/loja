type Props = {
  params: { slug: string };
};

export default function LojaVitrinePage({ params }: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Loja</h1>
      <p className="mt-2 text-slate-600">
        Vitrine pública — slug: <span className="font-mono text-slate-800">{params.slug}</span>
      </p>
      <p className="mt-4 text-sm text-slate-500">
        Fase 1 · conteúdo da loja (catálogo) nas fases seguintes.
      </p>
    </main>
  );
}
