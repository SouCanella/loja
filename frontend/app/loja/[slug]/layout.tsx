import { CartProvider } from "@/lib/vitrine/cart-context";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: { slug: string };
};

export default function LojaSlugLayout({ children, params }: Props) {
  return (
    <div className="min-h-dvh bg-loja-bg font-sans text-loja-ink antialiased [--font-dm-sans:ui-sans-serif,system-ui,sans-serif] [--font-fraunces:Georgia,'Times_New_Roman',serif]">
      <CartProvider storeSlug={params.slug}>{children}</CartProvider>
    </div>
  );
}
