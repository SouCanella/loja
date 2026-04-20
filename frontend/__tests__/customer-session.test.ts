import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearVitrineCustomerSession,
  getVitrineCustomerTokens,
  refreshVitrineCustomerAccess,
  setVitrineCustomerTokens,
} from "@/lib/vitrine/customer-session";

vi.mock("@/lib/api", () => ({
  getApiBaseUrl: () => "http://api.test",
}));

describe("vitrine customer-session", () => {
  const origFetch = globalThis.fetch;
  const origWindow = globalThis.window;
  const origLocalStorage = globalThis.localStorage;

  function mockStorage() {
    const store: Record<string, string> = {};
    const ls = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      key: () => null,
      length: 0,
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
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
    mockStorage();
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
    vi.restoreAllMocks();
  });

  it("grava e lê tokens por slug", () => {
    setVitrineCustomerTokens("Minha-Loja", "acc1", "ref1");
    const t = getVitrineCustomerTokens("minha-loja");
    expect(t?.access_token).toBe("acc1");
    expect(t?.refresh_token).toBe("ref1");
    clearVitrineCustomerSession("minha-loja");
    expect(getVitrineCustomerTokens("minha-loja")).toBeNull();
  });

  it("refreshVitrineCustomerAccess renova tokens", async () => {
    setVitrineCustomerTokens("s1", "old", "rt-xyz");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          access_token: "new-acc",
          refresh_token: "new-rt",
        },
      }),
    }) as unknown as typeof fetch;

    const next = await refreshVitrineCustomerAccess("s1");
    expect(next).toBe("new-acc");
    expect(getVitrineCustomerTokens("s1")?.access_token).toBe("new-acc");
    expect(getVitrineCustomerTokens("s1")?.refresh_token).toBe("new-rt");
  });

  it("refreshVitrineCustomerAccess devolve null sem refresh_token", async () => {
    setVitrineCustomerTokens("s2", "only-access", null);
    globalThis.fetch = vi.fn();
    expect(await refreshVitrineCustomerAccess("s2")).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
