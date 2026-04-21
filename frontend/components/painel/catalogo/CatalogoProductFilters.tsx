"use client";

import {
  painelFilterBarClass,
  painelFilterFieldColClass,
  painelFilterLabelClass,
  painelFilterSearchInputClass,
  painelFilterSelectClass,
} from "@/lib/painel-filter-classes";

import type { CatalogoCategory } from "./types";

type Props = {
  categories: CatalogoCategory[];
  filterQuery: string;
  onFilterQueryChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  statusFilter: "all" | "active" | "inactive";
  onStatusFilterChange: (v: "all" | "active" | "inactive") => void;
};

export function CatalogoProductFilters({
  categories,
  filterQuery,
  onFilterQueryChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
}: Props) {
  return (
    <div className={painelFilterBarClass}>
      <div className={`min-w-0 flex-1 sm:max-w-md ${painelFilterFieldColClass}`}>
        <label className={painelFilterLabelClass} htmlFor="catalogo-search">
          Pesquisar produto
        </label>
        <input
          id="catalogo-search"
          type="search"
          autoComplete="off"
          placeholder="Nome ou descrição…"
          value={filterQuery}
          onChange={(e) => onFilterQueryChange(e.target.value)}
          className={painelFilterSearchInputClass}
        />
      </div>
      <div className={painelFilterFieldColClass}>
        <label className={painelFilterLabelClass} htmlFor="catalogo-cat">
          Categoria
        </label>
        <select
          id="catalogo-cat"
          className={painelFilterSelectClass}
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className={painelFilterFieldColClass}>
        <label className={painelFilterLabelClass} htmlFor="catalogo-act">
          Estado
        </label>
        <select
          id="catalogo-act"
          className={painelFilterSelectClass}
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as "all" | "active" | "inactive")}
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>
    </div>
  );
}
