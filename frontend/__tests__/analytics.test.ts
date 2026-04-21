import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  getApiBaseUrl: () => "http://api.test",
}));

import {
  flushVitrineAnalytics,
  getOrCreateVitrineSessionId,
  trackVitrineEvent,
} from "@/lib/vitrine/analytics";

describe("vitrine analytics", () => {
  const origFetch = globalThis.fetch;
  const origWindow = globalThis.window;
  const origLocalStorage = globalThis.localStorage;
  const origCrypto = globalThis.crypto;

  beforeEach(() => {
    vi.useFakeTimers();
    const store: Record<string, string> = {};
    const ls = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      key: () => null,
      length: 0,
    };
    Object.defineProperty(globalThis, "localStorage", {
      value: ls,
      configurable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      configurable: true,
    });
    Object.defineProperty(globalThis, "crypto", {
      value: { randomUUID: () => "fixed-session-uuid" },
      configurable: true,
    });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
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
    if (origCrypto === undefined) {
      Reflect.deleteProperty(globalThis, "crypto");
    } else {
      Object.defineProperty(globalThis, "crypto", {
        value: origCrypto,
        configurable: true,
      });
    }
  });

  it("getOrCreateVitrineSessionId persiste slug", () => {
    expect(getOrCreateVitrineSessionId("loja-a")).toBe("fixed-session-uuid");
    expect(getOrCreateVitrineSessionId("loja-a")).toBe("fixed-session-uuid");
  });

  it("trackVitrineEvent agenda flush e envia batch", async () => {
    trackVitrineEvent("loja-x", {
      event_type: "page_view",
      path: "/loja/x",
    });
    await vi.advanceTimersByTimeAsync(900);
    expect(globalThis.fetch).toHaveBeenCalled();
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("/api/v2/public/stores/loja-x/analytics/events");
  });

  it("flushVitrineAnalytics ignora fila vazia", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockClear();
    await flushVitrineAnalytics("nada");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
