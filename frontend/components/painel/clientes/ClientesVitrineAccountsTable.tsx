"use client";

import { useMemo } from "react";

import { PainelPaginationBar } from "@/components/painel/PainelPaginationBar";
import { slicePage, usePainelPagination } from "@/lib/painel-pagination";
import {
  painelTableCellDenseClass,
  painelTableClass,
  painelTableTbodyClass,
  painelTableTheadClass,
  painelTableWrapClass,
} from "@/lib/painel-table-classes";

export type PainelCustomerRow = {
  id: string;
  source: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  has_vitrine_login: boolean;
  created_at: string;
};

type Props = {
  customers: PainelCustomerRow[];
};

function sourceLabel(source: string): string {
  if (source === "vitrine") return "Vitrine";
  if (source === "painel_manual") return "Painel";
  return source;
}

export function ClientesVitrineAccountsTable({ customers }: Props) {
  const resetKey = customers.map((c) => c.id).join(",");
  const pagination = usePainelPagination(customers.length, { resetKey });
  const pageRows = useMemo(
    () => slicePage(customers, pagination.page, pagination.pageSize),
    [customers, pagination.page, pagination.pageSize],
  );

  return (
    <div className={`mt-6 ${painelTableWrapClass}`}>
      <table className={painelTableClass}>
        <caption className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-left text-xs font-semibold text-slate-700">
          Clientes na base
        </caption>
        <thead className={painelTableTheadClass}>
          <tr>
            <th className={painelTableCellDenseClass}>Origem</th>
            <th className={painelTableCellDenseClass}>Nome</th>
            <th className={painelTableCellDenseClass}>Telefone</th>
            <th className={painelTableCellDenseClass}>E-mail</th>
            <th className={painelTableCellDenseClass}>Login vitrine</th>
            <th className={`${painelTableCellDenseClass} text-right`}>Registado em</th>
          </tr>
        </thead>
        <tbody className={painelTableTbodyClass}>
          {pageRows.map((c) => (
            <tr key={c.id}>
              <td className={`${painelTableCellDenseClass} text-slate-700`}>
                {sourceLabel(c.source)}
              </td>
              <td className={`${painelTableCellDenseClass} font-medium text-slate-900`}>
                {c.contact_name ?? "—"}
              </td>
              <td className={`${painelTableCellDenseClass} tabular-nums text-slate-800`}>
                {c.phone ?? "—"}
              </td>
              <td className={`${painelTableCellDenseClass} text-slate-700`}>
                {c.email ?? "—"}
              </td>
              <td className={`${painelTableCellDenseClass} text-slate-600`}>
                {c.has_vitrine_login ? "Sim" : "Não"}
              </td>
              <td className={`${painelTableCellDenseClass} text-right text-xs text-slate-600 tabular-nums`}>
                {new Date(c.created_at).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <PainelPaginationBar
        page={pagination.page}
        pageCount={pagination.pageCount}
        totalItems={customers.length}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}
