import { ProductDetail } from "@/components/vitrine/ProductDetail";
import { getStorePublicCached } from "@/lib/vitrine/cache-store-public";
import { fetchProductPublic } from "@/lib/vitrine/server-fetch";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { slug: string; productId: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [store, product] = await Promise.all([
    getStorePublicCached(params.slug),
    fetchProductPublic(params.slug, params.productId),
  ]);
  if (!store || !product) return { title: "Produto" };
  return {
    title: `${product.name} — ${store.name}`,
    description: product.description ?? product.name,
  };
}

export default async function ProdutoVitrinePage({ params }: Props) {
  const [store, product] = await Promise.all([
    getStorePublicCached(params.slug),
    fetchProductPublic(params.slug, params.productId),
  ]);
  if (!store || !product) notFound();

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <nav className="mb-4 text-sm">
        <Link
          href={`/loja/${params.slug}`}
          className="font-semibold text-loja-accent hover:underline"
        >
          ← Voltar ao cardápio
        </Link>
      </nav>
      <ProductDetail store={store} product={product} />
    </div>
  );
}
