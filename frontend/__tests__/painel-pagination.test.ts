import { describe, expect, it } from "vitest";

import {
  PAINEL_DEFAULT_PAGE_SIZE,
  paginationRangeLabel,
  slicePage,
} from "@/lib/painel-pagination";

describe("slicePage", () => {
  const items = ["a", "b", "c", "d", "e"];

  it("returns empty for empty input", () => {
    expect(slicePage([], 1, 20)).toEqual([]);
  });

  it("returns empty when pageSize <= 0", () => {
    expect(slicePage(items, 1, 0)).toEqual([]);
  });

  it("returns first page", () => {
    expect(slicePage(items, 1, 2)).toEqual(["a", "b"]);
  });

  it("returns second page", () => {
    expect(slicePage(items, 2, 2)).toEqual(["c", "d"]);
  });

  it("clamps page below 1 to page 1 behaviour via max(1,page)", () => {
    expect(slicePage(items, 0, 2)).toEqual(["a", "b"]);
  });

  it("returns partial last page", () => {
    expect(slicePage(items, 3, 2)).toEqual(["e"]);
  });
});

describe("paginationRangeLabel", () => {
  it("returns zeros when total is 0", () => {
    expect(paginationRangeLabel(1, 20, 0)).toEqual({ from: 0, to: 0 });
  });

  it("returns full range on first page", () => {
    expect(paginationRangeLabel(1, 20, 45)).toEqual({ from: 1, to: 20 });
  });

  it("returns correct range on last partial page", () => {
    expect(paginationRangeLabel(3, 20, 45)).toEqual({ from: 41, to: 45 });
  });
});

describe("PAINEL_DEFAULT_PAGE_SIZE", () => {
  it("is positive", () => {
    expect(PAINEL_DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
  });
});
