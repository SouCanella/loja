import { describe, expect, it } from "vitest";

describe("smoke (frontend)", () => {
  it("ambiente de teste ativo", () => {
    expect(1 + 1).toBe(2);
  });
});
