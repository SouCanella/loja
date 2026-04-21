import { describe, expect, it } from "vitest";

import { formatBRL, whatsappOrderUrl } from "@/lib/vitrine/whatsapp";
import { productEmoji } from "@/lib/vitrine/product-emoji";
import {
  vitrineBackgroundOverlayStyle,
  vitrineOverlayAlphaFromPercent,
} from "@/lib/vitrine/vitrine-background-overlay";
import type { StorePublic } from "@/lib/vitrine/types";
import { vitrineThemeStyle } from "@/lib/vitrine/vitrine-theme-vars";

describe("vitrine whatsapp", () => {
  it("whatsappOrderUrl monta wa.me", () => {
    expect(whatsappOrderUrl("+55 11 9", "oi")).toContain("wa.me/55119");
    expect(whatsappOrderUrl("abc", "x")).toBe("");
  });

  it("formatBRL vitrine", () => {
    expect(formatBRL(1)).toMatch(/1/);
    expect(formatBRL("x")).toBe("—");
  });
});

describe("productEmoji", () => {
  it("é determinístico", () => {
    expect(productEmoji("same-id")).toBe(productEmoji("same-id"));
  });

  it("varia com id", () => {
    const a = productEmoji("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    const b = productEmoji("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(a).not.toBe(b);
  });
});

describe("vitrine background overlay", () => {
  it("clamp e omissão", () => {
    expect(vitrineOverlayAlphaFromPercent(undefined)).toBeCloseTo(0.88);
    expect(vitrineOverlayAlphaFromPercent(5)).toBe(0.12);
    expect(vitrineOverlayAlphaFromPercent(200)).toBe(0.97);
  });

  it("gera rgba", () => {
    const s = vitrineBackgroundOverlayStyle(50);
    expect(s.backgroundColor).toMatch(/^rgba\(250,\s*246,\s*242,/);
  });
});

describe("vitrineThemeStyle", () => {
  const base: StorePublic = {
    name: "L",
    slug: "l",
    tagline: null,
    logo_emoji: "🍰",
    whatsapp: null,
    social_networks: [],
  };

  it("define variáveis com hex longo e curto", () => {
    const st = vitrineThemeStyle({
      ...base,
      primary_color: "#aabbcc",
      accent_color: "#abc",
    });
    expect(st["--loja-primary-rgb"]).toBe("170 187 204");
    expect(st["--loja-accent-rgb"]).toBe("170 187 204");
    expect(st["--loja-accent-soft-rgb"]).toBeDefined();
  });

  it("omite cores inválidas", () => {
    const st = vitrineThemeStyle({
      ...base,
      primary_color: "nope",
    });
    expect(st["--loja-primary-rgb"]).toBeUndefined();
  });
});
