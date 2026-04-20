import type { StorePublic } from "@/lib/vitrine/types";

function socialIconLabel(icon: string): string {
  const i = icon.toLowerCase();
  if (i.includes("instagram")) return "📸";
  if (i.includes("facebook")) return "📘";
  if (i.includes("tiktok")) return "🎵";
  if (i.includes("youtube")) return "▶️";
  return "🔗";
}

type Props = { store: StorePublic };

export function CatalogHero({ store }: Props) {
  return (
    <div className="border-b border-loja-primary/15 bg-gradient-to-b from-loja-surface via-loja-primary/[0.06] to-loja-bg/40">
      <div className="flex flex-col items-center gap-2.5 px-5 pb-5 pt-2 text-center">
        <div className="grid h-28 w-28 shrink-0 overflow-hidden rounded-[28px] border-2 border-loja-primary/35 bg-gradient-to-br from-white to-loja-primary/12 shadow-loja">
          {store.logo_image_url && /^https:\/\//i.test(store.logo_image_url.trim()) ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL configurada pelo lojista
            <img
              src={store.logo_image_url.trim()}
              alt={`Logótipo ${store.name}`}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-5xl leading-none" aria-hidden>
              {store.logo_emoji}
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-loja-ink">
          {store.name}
        </h1>
        {store.tagline ? (
          <p className="max-w-[28ch] text-[0.88rem] text-loja-muted">{store.tagline}</p>
        ) : (
          <p className="max-w-[28ch] text-[0.88rem] text-loja-muted">
            Encomendas pelo WhatsApp · Doces caseiros
          </p>
        )}
        {store.social_networks.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {store.social_networks.map((n) => (
              <a
                key={n.url}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-xl border border-loja-primary/20 bg-loja-surface text-lg shadow-loja hover:bg-loja-primary/10"
                title={n.label}
              >
                <span aria-hidden>{socialIconLabel(n.icon)}</span>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
