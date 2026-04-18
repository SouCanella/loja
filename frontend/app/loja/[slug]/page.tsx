import { CatalogView } from "@/components/vitrine/CatalogView";
import {
  fetchCategoriesPublic,
  fetchProductsPublic,
  fetchStorePublic,
} from "@/lib/vitrine/server-fetch";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await fetchStorePublic(params.slug);
  if (!store) return { title: "Loja" };
  return {
    title: `${store.name} — Vitrine`,
    description: store.tagline ?? `Pedidos em ${store.name}`,
  };
}

export default async function LojaVitrinePage({ params }: Props) {
  const store = await fetchStorePublic(params.slug);
  if (!store) notFound();

  const [categories, products] = await Promise.all([
    fetchCategoriesPublic(params.slug),
    fetchProductsPublic(params.slug),
  ]);

  return <CatalogView store={store} categories={categories} products={products} />;
}
