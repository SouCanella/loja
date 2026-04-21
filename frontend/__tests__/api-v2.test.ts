import { describe, expect, it } from "vitest";

import { messageFromV2Error, toApiV2Path, unwrapV2Success } from "@/lib/api-v2";

describe("unwrapV2Success", () => {
  it("extrai data quando success true", () => {
    expect(unwrapV2Success({ success: true, data: { a: 1 } })).toEqual({ a: 1 });
  });

  it("lança se envelope inválido", () => {
    expect(() => unwrapV2Success({ success: false })).toThrow(/envelope v2/);
    expect(() => unwrapV2Success(null)).toThrow();
    expect(() => unwrapV2Success({ success: true })).toThrow();
  });
});

describe("messageFromV2Error", () => {
  it("lê errors[0].message", () => {
    expect(
      messageFromV2Error({
        success: false,
        errors: [{ message: "falhou" }],
      }),
    ).toBe("falhou");
  });

  it("lê detail string", () => {
    expect(messageFromV2Error({ detail: "campo X" })).toBe("campo X");
  });

  it("devolve null quando não há mensagem útil", () => {
    expect(messageFromV2Error(null)).toBeNull();
    expect(messageFromV2Error({})).toBeNull();
    expect(messageFromV2Error({ success: false, errors: [] })).toBeNull();
  });
});

describe("toApiV2Path", () => {
  it("promove /api/v1/ para /api/v2/", () => {
    expect(toApiV2Path("/api/v1/me")).toBe("/api/v2/me");
  });

  it("mantém outros caminhos", () => {
    expect(toApiV2Path("/api/v2/x")).toBe("/api/v2/x");
  });
});
