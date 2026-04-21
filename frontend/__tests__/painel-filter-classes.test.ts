import { describe, expect, it } from "vitest";

import {
  painelFilterBarBoxClass,
  painelFilterBarClass,
  painelFilterCheckboxClass,
  painelFilterDateInputClass,
  painelFilterFieldColClass,
  painelFilterLabelClass,
  painelFilterLabelCompactClass,
  painelFilterSearchInputClass,
  painelFilterSelectClass,
} from "@/lib/painel-filter-classes";

describe("painel-filter-classes", () => {
  const exports: { name: string; value: string }[] = [
    { name: "painelFilterBarClass", value: painelFilterBarClass },
    { name: "painelFilterBarBoxClass", value: painelFilterBarBoxClass },
    { name: "painelFilterFieldColClass", value: painelFilterFieldColClass },
    { name: "painelFilterLabelClass", value: painelFilterLabelClass },
    { name: "painelFilterLabelCompactClass", value: painelFilterLabelCompactClass },
    { name: "painelFilterSearchInputClass", value: painelFilterSearchInputClass },
    { name: "painelFilterSelectClass", value: painelFilterSelectClass },
    { name: "painelFilterDateInputClass", value: painelFilterDateInputClass },
    { name: "painelFilterCheckboxClass", value: painelFilterCheckboxClass },
  ];

  it.each(exports)("$name é string Tailwind não vazia com tokens esperados", ({ value }) => {
    expect(value.length).toBeGreaterThan(10);
    expect(value).toMatch(/\b(text-|flex|rounded|border|mt-|w-|min-w)\b/);
  });
});
