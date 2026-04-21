import { describe, expect, it } from "vitest";

import { buildMenuCatalogText } from "@/lib/painel-menu-catalog-text";

describe("buildMenuCatalogText", () => {
  it("monta secções, totais e link da loja", () => {
    const text = buildMenuCatalogText({
      storeName: "Padaria",
      storeUrl: "https://exemplo.com/loja/x",
      vitrineWhatsapp: "+55 11 99999-0000",
      sections: [
        { title: "Bolos", lines: [{ name: "Chocolate", price: "25.00" }] },
      ],
    });
    expect(text).toContain("🍽 Padaria");
    expect(text).toContain("— Bolos —");
    expect(text).toContain("• Chocolate");
    expect(text).toContain("Pedir online: https://exemplo.com/loja/x");
    expect(text).toMatch(/wa\.me\/5511999990000/);
  });

  it("omite linha WhatsApp se número vazio ou inválido", () => {
    const noDigits = buildMenuCatalogText({
      storeName: "L",
      storeUrl: "u",
      vitrineWhatsapp: "   ",
      sections: [],
    });
    expect(noDigits).not.toContain("wa.me");

    const invalid = buildMenuCatalogText({
      storeName: "L",
      storeUrl: "u",
      vitrineWhatsapp: "abc",
      sections: [],
    });
    expect(invalid).not.toContain("wa.me");
  });
});
