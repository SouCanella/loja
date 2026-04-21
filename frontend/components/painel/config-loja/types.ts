export type Me = {
  store_name: string;
  store_slug: string;
  vitrine_whatsapp?: string | null;
  vitrine_theme?: Record<string, unknown> | null;
  store_target_margin_percent: string | number;
  store_labor_rate_per_hour?: string | number;
  print_config?: {
    channel?: string;
    paper_width_mm?: number;
    shipping_label_size?: string;
  };
};

export type SocialLinkRow = { label: string; url: string; icon: string };

export function strFromTheme(v: Record<string, unknown> | null | undefined, key: string): string {
  if (!v) return "";
  const x = v[key];
  return typeof x === "string" ? x : "";
}

export function overlayPercentFromTheme(v: Record<string, unknown> | null | undefined): number {
  if (!v) return 88;
  const x = v["background_overlay_percent"];
  let n = 88;
  if (typeof x === "number" && Number.isFinite(x)) n = Math.round(x);
  else if (typeof x === "string") {
    const p = Number.parseFloat(x.replace(",", "."));
    if (!Number.isNaN(p)) n = Math.round(p);
  }
  return Math.max(15, Math.min(97, n));
}

export function normalizeSocialIcon(icon: string): string {
  const i = icon.toLowerCase();
  if (i.includes("instagram")) return "instagram";
  if (i.includes("facebook")) return "facebook";
  if (i.includes("tiktok")) return "tiktok";
  if (i.includes("youtube")) return "youtube";
  return "link";
}

export function socialNetworksFromTheme(v: Record<string, unknown> | null | undefined): SocialLinkRow[] {
  if (!v) return [];
  const raw = v["social_networks"];
  if (!Array.isArray(raw)) return [];
  const out: SocialLinkRow[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const url = typeof o.url === "string" ? o.url.trim() : "";
    if (!url) continue;
    const label = typeof o.label === "string" ? o.label : "";
    const iconRaw = typeof o.icon === "string" ? o.icon : "link";
    out.push({
      url,
      label,
      icon: normalizeSocialIcon(iconRaw),
    });
  }
  return out;
}
