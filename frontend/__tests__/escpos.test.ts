import { describe, expect, it } from "vitest";

import { buildEscPosFromOrderPrint } from "@/lib/escpos";

describe("buildEscPosFromOrderPrint", () => {
  it("gera bytes não vazios com cabeçalho ESC @", () => {
    const u = buildEscPosFromOrderPrint({
      store_name: "Doces",
      order_id: "abc-123",
      status: "confirmado",
      created_at: "2026-01-15T10:00:00Z",
      lines: [
        {
          product_name: "Bolo",
          quantity: "2",
          unit_price: "10.00",
          line_total: "20.00",
        },
      ],
      total: "20.00",
    });
    expect(u.length).toBeGreaterThan(20);
    expect(u[0]).toBe(0x1b);
    expect(u[1]).toBe(0x40);
  });
});
