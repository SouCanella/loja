/**
 * Fetch com Bearer da sessão de cliente da vitrine; em 401 tenta refresh uma vez e limpa sessão se falhar.
 */

import { getApiBaseUrl } from "@/lib/api";
import {
  clearVitrineCustomerSession,
  getVitrineCustomerTokens,
  refreshVitrineCustomerAccess,
} from "@/lib/vitrine/customer-session";

function resolveUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const base = getApiBaseUrl();
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

export async function vitrineCustomerFetch(
  storeSlug: string,
  pathOrUrl: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = resolveUrl(pathOrUrl);
  const headers = new Headers(init.headers);
  const tok = getVitrineCustomerTokens(storeSlug);
  if (tok?.access_token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${tok.access_token}`);
  }

  let res = await fetch(url, { ...init, headers });

  if (res.status === 401 && tok?.refresh_token) {
    const nextAccess = await refreshVitrineCustomerAccess(storeSlug);
    if (nextAccess) {
      headers.set("Authorization", `Bearer ${nextAccess}`);
      res = await fetch(url, { ...init, headers });
    }
  }

  if (res.status === 401) {
    clearVitrineCustomerSession(storeSlug);
  }

  return res;
}
