import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidade — Loja",
  description: "Política de privacidade (rascunho; revisão jurídica pendente).",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white px-4 py-12 text-slate-800">
      <article className="mx-auto max-w-2xl">
        <p className="text-sm font-medium text-amber-800">
          Revisão jurídica pendente — texto placeholder para desenvolvimento e testes.
        </p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Política de privacidade</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Descrevemos aqui, em termos gerais, o tratamento de dados esperado num serviço multi-tenant: dados associados à
          tua loja e utilizadores são isolados por <code className="rounded bg-slate-100 px-1">store_id</code>. O texto
          definitivo deverá alinhar com RGPD/LGPD e com o registo de actividades de tratamento do responsável.
        </p>
        <ul className="mt-6 list-inside list-disc space-y-2 text-sm text-slate-600">
          <li>Finalidades: prestação do serviço, segurança, suporte e melhoria do produto.</li>
          <li>Conservação: conforme necessidade operacional e obrigações legais.</li>
          <li>Direitos: os titulares de dados podem solicitar esclarecimentos ao responsável pelo tratamento.</li>
        </ul>
        <p className="mt-8">
          <Link href="/" className="text-sm font-medium text-emerald-800 hover:underline">
            ← Voltar à página inicial
          </Link>
        </p>
      </article>
    </div>
  );
}
