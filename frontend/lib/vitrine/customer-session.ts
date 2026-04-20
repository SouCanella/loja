/**
 * Sessão de cliente da vitrine (por loja/slug), separada do painel (`access_token` global).
 */

import { getApiBaseUrl } from "@/lib/api";
import { unwrapV2Success } from "@/lib/api-v2";

const KEY_PREFIX = "vitrine_customer:";

export type VitrineCustomerTokens = {
  access_token: string;
  refresh_token: string | null;
};

function keyForSlug(storeSlug: string): string {
  return `${KEY_PREFIX}${storeSlug.trim().toLowerCase()}`;
}

export function getVitrineCustomerTokens(storeSlug: string): VitrineCustomerTokens | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(keyForSlug(storeSlug));
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== "object" || o === null) return null;
    const access = (o as { access_token?: unknown }).access_token;
    if (typeof access !== "string" || !access) return null;
    const rt = (o as { refresh_token?: unknown }).refresh_token;
    return {
      access_token: access,
      refresh_token: typeof rt === "string" && rt ? rt : null,
    };
  } catch {
    return null;
  }
}

export function setVitrineCustomerTokens(
  storeSlug: string,
  access: string,
  refresh?: string | null,
): void {
  if (typeof window === "undefined") return;
  const payload: VitrineCustomerTokens = {
    access_token: access,
    refresh_token: refresh ?? null,
  };
  localStorage.setItem(keyForSlug(storeSlug), JSON.stringify(payload));
}

export function clearVitrineCustomerSession(storeSlug: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(keyForSlug(storeSlug));
}

/** Renova o access token com o refresh (mesmo endpoint que o painel — JWT com `role: customer`). */
export async function refreshVitrineCustomerAccess(storeSlug: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const t = getVitrineCustomerTokens(storeSlug);
  if (!t?.refresh_token) return null;
  const url = `${getApiBaseUrl()}/api/v2/auth/refresh`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: t.refresh_token }),
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  try {
    const data = unwrapV2Success<{
      access_token: string;
      refresh_token?: string | null;
    }>(raw);
    if (typeof data.access_token !== "string") return null;
    setVitrineCustomerTokens(
      storeSlug,
      data.access_token,
      data.refresh_token ?? t.refresh_token,
    );
    return data.access_token;
  } catch {
    return null;
  }
}
