import { afterEach, describe, expect, it } from "vitest";

import { getApiBaseUrl } from "@/lib/api";

describe("getApiBaseUrl", () => {
  const orig = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (orig === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = orig;
    }
  });

  it("usa variável de ambiente quando definida", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://custom:9999";
    expect(getApiBaseUrl()).toBe("http://custom:9999");
  });

  it("fallback localhost:8000", () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getApiBaseUrl()).toBe("http://localhost:8000");
  });
});
