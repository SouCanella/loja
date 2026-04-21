import { describe, expect, it } from "vitest";

import { publicStoreUrl, shareStoreMessage, whatsAppShareUrl } from "@/lib/painel-share-store";

describe("publicStoreUrl", () => {
  it("concatena origem normalizada e slug", () => {
    expect(publicStoreUrl("https://app.example/", "minha-loja")).toBe(
      "https://app.example/loja/minha-loja",
    );
  });

  it("codifica slug com caracteres especiais", () => {
    const u = publicStoreUrl("http://localhost:3000", "loja & cia");
    expect(u).toContain("/loja/");
    expect(u).toContain(encodeURIComponent("loja & cia"));
  });
});

describe("shareStoreMessage", () => {
  it("inclui nome da loja e URL", () => {
    const m = shareStoreMessage("Doce Sabor", "https://x/y");
    expect(m).toContain("Doce Sabor");
    expect(m).toContain("https://x/y");
  });
});

describe("whatsAppShareUrl", () => {
  it("prefixa wa.me com texto codificado", () => {
    const u = whatsAppShareUrl("olá mundo");
    expect(u.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(u.slice("https://wa.me/?text=".length))).toBe("olá mundo");
  });
});
