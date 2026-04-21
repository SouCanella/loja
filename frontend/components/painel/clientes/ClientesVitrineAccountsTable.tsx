"use client";

import {
  painelTableCellDenseClass,
  painelTableClass,
  painelTableTbodyClass,
  painelTableTheadClass,
  painelTableWrapClass,
} from "@/lib/painel-table-classes";

type VitrineCustomer = {
  id: string;
  email: string;
  created_at: string;
};

type Props = {
  vitrineCustomers: VitrineCustomer[];
};

export function ClientesVitrineAccountsTable({ vitrineCustomers }: Props) {
  return (
    <div className={`mt-6 ${painelTableWrapClass}`}>
      <table className={painelTableClass}>
        <caption className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-left text-xs font-semibold text-slate-700">
          Contas na vitrine
        </caption>
        <thead className={painelTableTheadClass}>
          <tr>
            <th className={painelTableCellDenseClass}>E-mail</th>
            <th className={`${painelTableCellDenseClass} text-right`}>Registado em</th>
          </tr>
        </thead>
        <tbody className={painelTableTbodyClass}>
          {vitrineCustomers.map((c) => (
            <tr key={c.id}>
              <td className={`${painelTableCellDenseClass} font-medium text-slate-900`}>{c.email}</td>
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
    </div>
  );
}
