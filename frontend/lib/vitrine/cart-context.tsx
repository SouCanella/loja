"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProductPublic } from "@/lib/vitrine/types";
import { formatBRL } from "@/lib/vitrine/whatsapp";

type CartMap = Record<string, number>;

type CartContextValue = {
  quantities: CartMap;
  add: (productId: string, delta: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  count: number;
  total: (productsById: Map<string, ProductPublic>) => number;
  formatOrderText: (params: {
    storeName: string;
    lines: { product: ProductPublic; qty: number }[];
    customerName: string;
    customerPhone: string;
    delivery: string;
    payment: string;
    address?: string;
    orderGreeting?: string | null;
    deliveryOptionId?: string;
  }) => string;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(slug: string): string {
  return `vitrine-cart:${slug}`;
}

export function CartProvider({
  storeSlug,
  children,
}: {
  storeSlug: string;
  children: ReactNode;
}) {
  const [quantities, setQuantities] = useState<CartMap>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(storeSlug));
      if (raw) {
        const parsed = JSON.parse(raw) as CartMap;
        if (parsed && typeof parsed === "object") {
          setQuantities(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, [storeSlug]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(storeSlug), JSON.stringify(quantities));
    } catch {
      /* ignore */
    }
  }, [storeSlug, quantities]);

  const add = useCallback((productId: string, delta: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      const q = (next[productId] ?? 0) + delta;
      if (q <= 0) delete next[productId];
      else next[productId] = q;
      return next;
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setQuantities((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  const count = useMemo(
    () => Object.values(quantities).reduce((a, b) => a + b, 0),
    [quantities],
  );

  const total = useCallback(
    (productsById: Map<string, ProductPublic>) => {
      let t = 0;
      for (const [id, qty] of Object.entries(quantities)) {
        const p = productsById.get(id);
        if (!p) continue;
        const unit = Number.parseFloat(p.price);
        t += (Number.isNaN(unit) ? 0 : unit) * qty;
      }
      return t;
    },
    [quantities],
  );

  const formatOrderText = useCallback(
    (params: {
      storeName: string;
      lines: { product: ProductPublic; qty: number }[];
      customerName: string;
      customerPhone: string;
      delivery: string;
      payment: string;
      address?: string;
      orderGreeting?: string | null;
      deliveryOptionId?: string;
    }) => {
      const lines = params.lines
        .map(
          (l) =>
            `• ${l.qty}× ${l.product.name} — ${formatBRL(Number.parseFloat(l.product.price) * l.qty)}`,
        )
        .join("\n");
      const sub = params.lines.reduce(
        (s, l) => s + Number.parseFloat(l.product.price) * l.qty,
        0,
      );
      let body = "";
      if (params.orderGreeting?.trim()) {
        body += `${params.orderGreeting.trim()}\n\n`;
      }
      body += `*Pedido — ${params.storeName}*\n\n`;
      body += `${lines}\n\n`;
      body += `*Total:* ${formatBRL(sub)}\n\n`;
      body += `*Cliente:* ${params.customerName || "—"}\n`;
      body += `*Telefone:* ${params.customerPhone || "—"}\n`;
      body += `*Recebimento:* ${params.delivery}\n`;
      if (params.address) body += `*Endereço:* ${params.address}\n`;
      body += `*Pagamento:* ${params.payment}\n`;
      if (params.deliveryOptionId === "uber" || params.deliveryOptionId === "nove") {
        body +=
          "\n→ Combinar pelo WhatsApp o pedido no app (Uber ou 99), taxa e horário, link e endereço.\n";
      }
      return body;
    },
    [],
  );

  const value = useMemo(
    () => ({
      quantities,
      add,
      setQty,
      remove,
      count,
      total,
      formatOrderText,
    }),
    [quantities, add, setQty, remove, count, total, formatOrderText],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart dentro de CartProvider");
  return ctx;
}
