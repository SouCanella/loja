"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { messageFromV2Error } from "@/lib/api-v2";
import { DELIVERY_FALLBACK, PAYMENT_FALLBACK } from "@/lib/vitrine/catalog-defaults";
import { useCart } from "@/lib/vitrine/cart-context";
import type { DeliveryOptionPublic, PaymentMethodPublic, ProductPublic, StorePublic } from "@/lib/vitrine/types";
import { whatsappOrderUrl } from "@/lib/vitrine/whatsapp";
import { vitrineCustomerFetch } from "@/lib/vitrine/vitrine-customer-fetch";

type CartApi = ReturnType<typeof useCart>;

export function useVitrineCheckout(
  store: StorePublic,
  productsById: Map<string, ProductPublic>,
  cart: CartApi,
) {
  const deliveryOpts: DeliveryOptionPublic[] = store.delivery_options?.length
    ? store.delivery_options
    : DELIVERY_FALLBACK;
  const paymentOpts: PaymentMethodPublic[] = store.payment_methods?.length
    ? store.payment_methods
    : PAYMENT_FALLBACK;

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [delivery, setDelivery] = useState(deliveryOpts[0]?.id ?? "retirada");
  const [payment, setPayment] = useState(paymentOpts[0]?.id ?? "pix");
  const [orderShortCode, setOrderShortCode] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const hpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const d = store.delivery_options?.length ? store.delivery_options : DELIVERY_FALLBACK;
    const p = store.payment_methods?.length ? store.payment_methods : PAYMENT_FALLBACK;
    setDelivery(d[0]?.id ?? "retirada");
    setPayment(p[0]?.id ?? "pix");
    // Apenas ao mudar de loja — não repor escolhas do cliente a cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.slug]);

  const orderLines = useMemo(() => {
    const lines: { product: ProductPublic; qty: number }[] = [];
    for (const [id, qty] of Object.entries(cart.quantities)) {
      const product = productsById.get(id);
      if (product && qty > 0) lines.push({ product, qty });
    }
    return lines;
  }, [cart.quantities, productsById]);

  const deliveryLabel = deliveryOpts.find((d) => d.id === delivery)?.title ?? delivery;
  const paymentLabel = paymentOpts.find((p) => p.id === payment)?.label ?? payment;
  const needAddress = delivery !== "retirada";

  const orderMessage = useMemo(() => {
    if (orderLines.length === 0) return "";
    return cart.formatOrderText({
      storeName: store.name,
      lines: orderLines,
      customerName,
      customerPhone,
      delivery: deliveryLabel,
      payment: paymentLabel,
      address: delivery !== "retirada" ? address : undefined,
      orderGreeting: store.order_greeting,
      deliveryOptionId: delivery,
    });
  }, [
    cart,
    store.name,
    store.order_greeting,
    orderLines,
    customerName,
    customerPhone,
    delivery,
    deliveryLabel,
    paymentLabel,
    address,
  ]);

  const orderMessageWithRef = useMemo(() => {
    if (!orderMessage) return "";
    if (!orderShortCode) return orderMessage;
    return `${orderMessage}\n\n*Ref. pedido:* #${orderShortCode}`;
  }, [orderMessage, orderShortCode]);

  useEffect(() => {
    setOrderShortCode(null);
  }, [cart.quantities]);

  const waUrl = useMemo(() => {
    if (!store.whatsapp || orderLines.length === 0 || !orderMessageWithRef) return "";
    if (!orderShortCode) return "";
    return whatsappOrderUrl(store.whatsapp, orderMessageWithRef);
  }, [store.whatsapp, orderLines.length, orderMessageWithRef, orderShortCode]);

  const cartTotal = cart.total(productsById);

  const registerOrderWithApi = useCallback(async () => {
    if (orderLines.length === 0) return;
    if (needAddress && !address.trim()) {
      setRegisterError("Indique o endereço para entrega.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setRegisterError("Preencha nome e telefone.");
      return;
    }
    setRegisterError(null);
    setRegistering(true);
    try {
      const items = orderLines.map((l) => ({
        product_id: l.product.id,
        quantity: String(l.qty),
      }));
      const body: Record<string, unknown> = {
        items,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_note: null,
        delivery_option_id: delivery,
        payment_method_id: payment,
        delivery_address: needAddress ? address.trim() || null : null,
        website: hpRef.current?.value ?? "",
      };
      const path = `/api/v2/public/stores/${encodeURIComponent(store.slug)}/orders`;
      const res = await vitrineCustomerFetch(store.slug, path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const msg =
          messageFromV2Error(raw) ??
          (typeof raw.detail === "string" ? raw.detail : "Não foi possível registar o pedido.");
        setRegisterError(msg);
        return;
      }
      const ok = raw.success === true && raw.data && typeof raw.data === "object";
      const inner = ok ? (raw.data as { short_code?: string }) : null;
      if (inner && typeof inner.short_code === "string" && inner.short_code) {
        setOrderShortCode(inner.short_code);
      } else {
        setRegisterError("Resposta inválida da API.");
      }
    } catch {
      setRegisterError("Não foi possível contactar a API.");
    } finally {
      setRegistering(false);
    }
  }, [
    orderLines,
    needAddress,
    address,
    customerName,
    customerPhone,
    delivery,
    payment,
    store.slug,
  ]);

  return {
    deliveryOpts,
    paymentOpts,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    address,
    setAddress,
    delivery,
    setDelivery,
    payment,
    setPayment,
    hpRef,
    needAddress,
    deliveryLabel,
    paymentLabel,
    orderLines,
    cartTotal,
    orderMessage,
    orderMessageWithRef,
    waUrl,
    orderShortCode,
    registerError,
    registering,
    registerOrderWithApi,
  };
}

export type VitrineCheckoutState = ReturnType<typeof useVitrineCheckout>;
