import { getStorePublicCached } from "@/lib/vitrine/cache-store-public";
import {
  vitrineBackgroundOverlayStyle,
  vitrineOverlayAlphaFromPercent,
} from "@/lib/vitrine/vitrine-background-overlay";
import { vitrineThemeStyle } from "@/lib/vitrine/vitrine-theme-vars";
import { VitrineAnalyticsBridge } from "./VitrineAnalyticsBridge";
import { CartProvider } from "@/lib/vitrine/cart-context";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: { slug: string };
};

function vitrineBackgroundImageStyle(url: string): CSSProperties {
  return { backgroundImage: `url(${JSON.stringify(url)})` };
}

export default async function LojaSlugLayout({ children, params }: Props) {
  const store = await getStorePublicCached(params.slug);
  const themeStyle = store ? vitrineThemeStyle(store) : undefined;
  const hero = store?.hero_image_url?.trim();
  const showBg = Boolean(hero && /^https:\/\//i.test(hero));
  const overlayPct = store?.background_overlay_percent;
  const overlayAlpha = vitrineOverlayAlphaFromPercent(overlayPct);
  const softBlur = overlayAlpha < 0.88;

  return (
    <div
      className="relative min-h-dvh bg-loja-bg font-sans text-loja-ink antialiased [--font-dm-sans:ui-sans-serif,system-ui,sans-serif] [--font-fraunces:Georgia,'Times_New_Roman',serif]"
      style={themeStyle}
    >
      {showBg && hero ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={vitrineBackgroundImageStyle(hero)}
          />
          <div
            aria-hidden
            className={
              softBlur
                ? "pointer-events-none fixed inset-0 z-[1] backdrop-blur-[3px]"
                : "pointer-events-none fixed inset-0 z-[1]"
            }
            style={vitrineBackgroundOverlayStyle(overlayPct)}
          />
        </>
      ) : null}
      <div className="relative z-10">
        <CartProvider storeSlug={params.slug}>
          <VitrineAnalyticsBridge slug={params.slug} />
          {children}
        </CartProvider>
      </div>
    </div>
  );
}
