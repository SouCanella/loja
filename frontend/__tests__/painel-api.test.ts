import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  apiPainelJson,
  draftOrderWhatsAppMessage,
  formatBRL,
  orderStatusLabel,
  PainelApiError,
  whatsappDigits,
  whatsAppUrl,
} from "@/lib/painel-api";

vi.mock("@/lib/api", () => ({
  getApiBaseUrl: () => "http://api.test",
}));

describe("formatBRL", () => {
  it("formata número e string", () => {
    expect(formatBRL(10)).toMatch(/10/);
    expect(formatBRL("10.5")).toMatch(/10/);
  });
  it("devolve em dash para NaN", () => {
    expect(formatBRL("x")).toBe("—");
  });
});

describe("orderStatusLabel", () => {
  it("traduz estado canónico", () => {
    expect(orderStatusLabel("confirmado")).toBe("Confirmado");
  });
  it("devolve o raw se desconhecido", () => {
    expect(orderStatusLabel("foo")).toBe("foo");
  });
});

describe("whatsappDigits / whatsAppUrl", () => {
  it("remove não-dígitos", () => {
    expect(whatsappDigits("+55 (11) 91234-5678")).toBe("5511912345678");
  });
  it("devolve null sem dígitos", () => {
    expect(whatsAppUrl("abc", "oi")).toBeNull();
  });
  it("monta wa.me com texto", () => {
    const u = whatsAppUrl("+5511", "Olá");
    expect(u).toContain("wa.me/5511");
    expect(u).toContain(encodeURIComponent("Olá"));
  });
});

describe("draftOrderWhatsAppMessage", () => {
  it("inclui cabeçalho, itens e referência", () => {
    const t = draftOrderWhatsAppMessage({
      storeName: "Doce",
      orderIdShort: "abc12345",
      orderIdFull: "full-uuid",
      statusLabel: "Confirmado",
      lines: [
        { productName: "Bolo", qtyLabel: "2", lineTotal: "R$ 20,00" },
      ],
      total: "R$ 20,00",
      customerNote: "Sem açúcar",
    });
    expect(t).toContain("Doce");
    expect(t).toContain("Bolo");
    expect(t).toContain("Sem açúcar");
    expect(t).toContain("full-uuid");
  });
});

describe("apiPainelJson", () => {
  const origFetch = globalThis.fetch;
  const origWindow = globalThis.window;
  const origLocalStorage = globalThis.localStorage;

  function mockStorage(token: string | null) {
    const store: Record<string, string> = token ? { access_token: token } : {};
    const ls = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => {
          delete store[k];
        });
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    };
    Object.defineProperty(globalThis, "localStorage", {
      value: ls,
      configurable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      configurable: true,
    });
  }

  beforeEach(() => {
    mockStorage("fake-token");
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
    if (origWindow === undefined) {
      Reflect.deleteProperty(globalThis, "window");
    } else {
      Object.defineProperty(globalThis, "window", {
        value: origWindow,
        configurable: true,
      });
    }
    if (origLocalStorage === undefined) {
      Reflect.deleteProperty(globalThis, "localStorage");
    } else {
      Object.defineProperty(globalThis, "localStorage", {
        value: origLocalStorage,
        configurable: true,
      });
    }
  });

  it("lança PainelApiError 401 sem token", async () => {
    mockStorage(null);
    await expect(apiPainelJson("/x")).rejects.toMatchObject({
      name: "PainelApiError",
      status: 401,
    });
  });

  it("faz parse JSON em sucesso", async () => {
    mockStorage("fake-token");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { ok: true } }),
    });
    const data = await apiPainelJson<{ ok: boolean }>("/api/v2/me");
    expect(data.ok).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalled();
  });

  it("lança PainelApiError com mensagem da API", async () => {
    mockStorage("fake-token");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        errors: [{ message: "stock baixo" }],
      }),
    });
    await expect(apiPainelJson("/x")).rejects.toMatchObject({
      name: "PainelApiError",
      message: "stock baixo",
      status: 400,
    });
  });
});
