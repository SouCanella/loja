import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de utilização — Loja",
  description: "Termos de utilização do serviço (rascunho; revisão jurídica pendente).",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-12 text-slate-800">
      <article className="mx-auto max-w-2xl">
        <p className="text-sm font-medium text-amber-800">
          Revisão jurídica pendente — texto placeholder para desenvolvimento e testes.
        </p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Termos de utilização</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Este documento será substituído por versão revista por advogados antes de produção pública. Entre em contacto
          com o responsável pelo produto para a política aplicável à tua conta.
        </p>
        <ul className="mt-6 list-inside list-disc space-y-2 text-sm text-slate-600">
          <li>Uso do serviço conforme leis aplicáveis e boa fé.</li>
          <li>Conteúdo e produtos da loja são da responsabilidade do lojista.</li>
          <li>Disponibilidade do serviço sem garantias de tempo de actividade (SLA) até definição contratual.</li>
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
