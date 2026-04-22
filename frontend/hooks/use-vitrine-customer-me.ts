"use client";

import { useCallback, useEffect, useState } from "react";

import { getVitrineCustomerTokens } from "@/lib/vitrine/customer-session";
import { vitrineCustomerFetch } from "@/lib/vitrine/vitrine-customer-fetch";

export type VitrineCustomerMe = {
  email: string | null;
  contact_name: string | null;
  phone: string | null;
  store_slug: string;
};

export function useVitrineCustomerMe(storeSlug: string) {
  const [me, setMe] = useState<VitrineCustomerMe | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!storeSlug) {
      setMe(null);
      setLoading(false);
      return;
    }
    const tok = getVitrineCustomerTokens(storeSlug);
    if (!tok) {
      setMe(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const path = `/api/v2/public/stores/${encodeURIComponent(storeSlug)}/customers/me`;
    try {
      const res = await vitrineCustomerFetch(storeSlug, path);
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setMe(null);
        return;
      }
      const success = data.success === true && data.data && typeof data.data === "object";
      setMe(success ? (data.data as VitrineCustomerMe) : null);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { me, loading, refetch };
}
