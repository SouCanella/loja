"use client";

import Link from "next/link";
import { useMemo } from "react";

import { PainelPaginationBar } from "@/components/painel/PainelPaginationBar";
import {
  painelFilterFieldColClass,
  painelFilterLabelClass,
  painelFilterSearchInputClass,
} from "@/lib/painel-filter-classes";
import { slicePage, usePainelPagination } from "@/lib/painel-pagination";
import type { ContactGroup } from "@/lib/painel-clientes-helpers";
import {
  painelTableCellClass,
  painelTableClass,
  painelTableTbodyClass,
  painelTableTheadClass,
  painelTableWrapClass,
} from "@/lib/painel-table-classes";

type Props = {
  groups: ContactGroup[];
  filteredGroups: ContactGroup[];
  filterQuery: string;
  onFilterQueryChange: (v: string) => void;
};

export function ClientesOrdersByContactSection({
  groups,
  filteredGroups,
  filterQuery,
  onFilterQueryChange,
}: Props) {
  const pagination = usePainelPagination(filteredGroups.length, {
    resetKey: filterQuery,
  });
  const pageGroups = useMemo(
    () => slicePage(filteredGroups, pagination.page, pagination.pageSize),
    [filteredGroups, pagination.page, pagination.pageSize],
  );

  if (groups.length === 0) return null;

  return (
    <div className="mt-8 space-y-3">
      <h2 className="text-sm font-semibold text-slate-800">Por pedidos</h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className={`min-w-0 flex-1 sm:max-w-md ${painelFilterFieldColClass}`}>
          <label className={painelFilterLabelClass} htmlFor="clientes-filter">
            Filtrar por nome ou telefone
          </label>
          <input
            id="clientes-filter"
            type="search"
            autoComplete="off"
            placeholder="Ex.: Maria, 11999…"
            value={filterQuery}
            onChange={(e) => onFilterQueryChange(e.target.value)}
            className={painelFilterSearchInputClass}
          />
        </div>
        <p className="text-xs text-slate-500">
          {filteredGroups.length === groups.length
            ? `${groups.length} contacto${groups.length === 1 ? "" : "s"}`
            : `${filteredGroups.length} de ${groups.length} contactos`}
        </p>
      </div>

      <div className={painelTableWrapClass}>
        <table className={painelTableClass}>
          <thead className={painelTableTheadClass}>
            <tr>
              <th className={painelTableCellClass}>Contacto</th>
              <th className={`${painelTableCellClass} text-right`}>Pedidos</th>
              <th className={`${painelTableCellClass} text-right`}>Último pedido</th>
              <th className={`${painelTableCellClass} text-right`}>Acções</th>
            </tr>
          </thead>
          <tbody className={painelTableTbodyClass}>
            {pageGroups.map(({ key, orders, label }) => {
              const latest = orders[0];
              const n = orders.length;
              return (
                <tr key={key} className="text-slate-800">
                  <td className={painelTableCellClass}>
                    <div className="font-medium text-slate-900">{label.title}</div>
                    {label.subtitle ? (
                      <div className="mt-0.5 text-xs text-slate-500">{label.subtitle}</div>
                    ) : null}
                  </td>
                  <td className={`${painelTableCellClass} text-right tabular-nums`}>{n}</td>
                  <td className={`${painelTableCellClass} text-right text-xs text-slate-600`}>
                    {new Date(latest.created_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className={`${painelTableCellClass} text-right`}>
                    <Link
                      href={`/painel/pedidos/${latest.id}`}
                      className="font-medium text-painel-primary hover:text-painel-primary-strong"
                    >
                      Abrir último
                    </Link>
                    {n > 1 ? (
                      <details className="mt-2 text-left">
                        <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-900">
                          Ver os {n} pedidos
                        </summary>
                        <ul className="mt-2 space-y-1 pl-1 text-xs">
                          {orders.map((o) => (
                            <li key={o.id}>
                              <Link
                                href={`/painel/pedidos/${o.id}`}
                                className="font-mono text-painel-primary hover:underline"
                              >
                                {o.id.slice(0, 8)}…
                              </Link>
                              <span className="ml-2 text-slate-500">
                                {new Date(o.created_at).toLocaleString("pt-BR", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <PainelPaginationBar
          page={pagination.page}
          pageCount={pagination.pageCount}
          totalItems={filteredGroups.length}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
        />
        {filterQuery.trim() && filteredGroups.length === 0 ? (
          <p className="border-t border-slate-100 px-4 py-6 text-center text-sm text-slate-600">
            Nenhum contacto corresponde a «{filterQuery.trim()}».{" "}
            <button
              type="button"
              className="font-medium text-painel-primary hover:underline"
              onClick={() => onFilterQueryChange("")}
            >
              Limpar filtro
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
}
