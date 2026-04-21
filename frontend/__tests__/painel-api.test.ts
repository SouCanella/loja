import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  apiPainelJson,
  apiPainelMediaUpload,
  draftOrderWhatsAppMessage,
  formatBRL,
  formatPercent,
  formatQty,
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

  function mockStorage(access: string | null, refresh: string | null = null) {
    const store: Record<string, string> = {};
    if (access) store.access_token = access;
    if (refresh) store.refresh_token = refresh;
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
    mockStorage("fake-token", null);
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
    mockStorage(null, null);
    await expect(apiPainelJson("/x")).rejects.toMatchObject({
      name: "PainelApiError",
      status: 401,
    });
  });

  it("faz parse JSON em sucesso", async () => {
    mockStorage("fake-token", null);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { ok: true } }),
    });
    const data = await apiPainelJson<{ ok: boolean }>("/api/v2/me");
    expect(data.ok).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalled();
  });

  it("lança PainelApiError com mensagem da API", async () => {
    mockStorage("fake-token", null);
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

  it("usa detail string quando não há envelope v2", async () => {
    mockStorage("fake-token", null);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: "campo inválido" }),
    });
    await expect(apiPainelJson("/x")).rejects.toMatchObject({
      message: "campo inválido",
      status: 422,
    });
  });

  it("reenvia após 401 quando refresh renova token", async () => {
    mockStorage("velho", "rt-1");
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { access_token: "novo", refresh_token: "rt-2" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ok: true } }),
      });
    const data = await apiPainelJson<{ ok: boolean }>("/api/v2/me");
    expect(data.ok).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it("rejeita com erro se JSON de sucesso não for envelope v2", async () => {
    mockStorage("fake-token", null);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ foo: 1 }),
    });
    await expect(apiPainelJson("/x")).rejects.toThrow(/envelope v2/);
  });
});

describe("formatPercent / formatQty", () => {
  it("formatPercent trata vazio e NaN", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent("x")).toBe("—");
    expect(formatPercent(12.3)).toMatch(/12/);
  });

  it("formatQty respeita maxFrac", () => {
    expect(formatQty(null)).toBe("—");
    expect(formatQty(1.23456, 2)).toMatch(/1[,.]23/);
  });
});

describe("draftOrderWhatsAppMessage", () => {
  it("mostra linha sem itens quando lista vazia", () => {
    const t = draftOrderWhatsAppMessage({
      storeName: "X",
      orderIdShort: "ab",
      orderIdFull: "uuid",
      statusLabel: "S",
      lines: [],
      total: "R$ 0",
      customerNote: null,
    });
    expect(t).toContain("(sem itens)");
  });
});

describe("apiPainelMediaUpload", () => {
  const origFetch = globalThis.fetch;
  const origWindow = globalThis.window;
  const origLocalStorage = globalThis.localStorage;

  function mockStorageMedia(access: string | null) {
    const store: Record<string, string> = access ? { access_token: access } : {};
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

  it("envia multipart e devolve public_url", async () => {
    mockStorageMedia("tok");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { public_url: "https://cdn/x.jpg" },
      }),
    });
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    const url = await apiPainelMediaUpload("product", file);
    expect(url).toBe("https://cdn/x.jpg");
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1]?.body).toBeInstanceOf(FormData);
  });

  it("401 sem token", async () => {
    mockStorageMedia(null);
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    await expect(apiPainelMediaUpload("product", file)).rejects.toMatchObject({
      status: 401,
    });
  });
});
