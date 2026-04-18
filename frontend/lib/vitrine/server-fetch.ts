import type { CategoryPublic, ProductPublic, StorePublic } from "@/lib/vitrine/types";
import { getApiBaseUrl } from "@/lib/api";

function apiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function fetchStorePublic(slug: string): Promise<StorePublic | null> {
  const res = await fetch(apiUrl(`/api/v1/public/stores/${encodeURIComponent(slug)}`), {
    next: { revalidate: 30 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Loja: ${res.status}`);
  return res.json() as Promise<StorePublic>;
}

export async function fetchCategoriesPublic(slug: string): Promise<CategoryPublic[]> {
  const res = await fetch(apiUrl(`/api/v1/public/stores/${encodeURIComponent(slug)}/categories`), {
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  return res.json() as Promise<CategoryPublic[]>;
}

export async function fetchProductsPublic(
  slug: string,
  categorySlug?: string | null,
): Promise<ProductPublic[]> {
  const q = categorySlug ? `?category_slug=${encodeURIComponent(categorySlug)}` : "";
  const res = await fetch(
    apiUrl(`/api/v1/public/stores/${encodeURIComponent(slug)}/products${q}`),
    { next: { revalidate: 15 } },
  );
  if (!res.ok) return [];
  return res.json() as Promise<ProductPublic[]>;
}

export async function fetchProductPublic(
  slug: string,
  productId: string,
): Promise<ProductPublic | null> {
  const res = await fetch(
    apiUrl(
      `/api/v1/public/stores/${encodeURIComponent(slug)}/products/${encodeURIComponent(productId)}`,
    ),
    { next: { revalidate: 15 } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Produto: ${res.status}`);
  return res.json() as Promise<ProductPublic>;
}
