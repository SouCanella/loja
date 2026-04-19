import type { CategoryPublic, ProductPublic, StorePublic } from "@/lib/vitrine/types";
import { getApiBaseUrl } from "@/lib/api";
import { unwrapV2Success } from "@/lib/api-v2";

function apiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function fetchStorePublic(slug: string): Promise<StorePublic | null> {
  const res = await fetch(apiUrl(`/api/v2/public/stores/${encodeURIComponent(slug)}`), {
    next: { revalidate: 30 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Loja: ${res.status}`);
  const raw = await res.json();
  return unwrapV2Success<StorePublic>(raw);
}

export async function fetchCategoriesPublic(slug: string): Promise<CategoryPublic[]> {
  const res = await fetch(
    apiUrl(`/api/v2/public/stores/${encodeURIComponent(slug)}/categories`),
    { next: { revalidate: 30 } },
  );
  if (!res.ok) return [];
  const raw = await res.json();
  return unwrapV2Success<CategoryPublic[]>(raw);
}

export async function fetchProductsPublic(
  slug: string,
  categorySlug?: string | null,
): Promise<ProductPublic[]> {
  const q = categorySlug ? `?category_slug=${encodeURIComponent(categorySlug)}` : "";
  const res = await fetch(
    apiUrl(`/api/v2/public/stores/${encodeURIComponent(slug)}/products${q}`),
    { next: { revalidate: 15 } },
  );
  if (!res.ok) return [];
  const raw = await res.json();
  return unwrapV2Success<ProductPublic[]>(raw);
}

export async function fetchProductPublic(
  slug: string,
  productId: string,
): Promise<ProductPublic | null> {
  const res = await fetch(
    apiUrl(
      `/api/v2/public/stores/${encodeURIComponent(slug)}/products/${encodeURIComponent(productId)}`,
    ),
    { next: { revalidate: 15 } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Produto: ${res.status}`);
  const raw = await res.json();
  return unwrapV2Success<ProductPublic>(raw);
}
