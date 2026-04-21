/** IP-13 — texto de cardápio para WhatsApp / Instagram (copiar e colar). */

import { formatBRL } from "@/lib/painel-api";

export type MenuCatalogLine = {
  name: string;
  price: string;
};

export type MenuCatalogSection = {
  title: string;
  lines: MenuCatalogLine[];
};

export function buildMenuCatalogText(opts: {
  storeName: string;
  storeUrl: string;
  vitrineWhatsapp: string | null | undefined;
  sections: MenuCatalogSection[];
}): string {
  const lines: string[] = [];
  lines.push(`🍽 ${opts.storeName}`);
  lines.push("");
  for (const sec of opts.sections) {
    lines.push(`— ${sec.title} —`);
    for (const l of sec.lines) {
      lines.push(`• ${l.name} — ${formatBRL(l.price)}`);
    }
    lines.push("");
  }
  lines.push(`Pedir online: ${opts.storeUrl}`);
  if (opts.vitrineWhatsapp?.trim()) {
    const d = opts.vitrineWhatsapp.replace(/\D/g, "");
    if (d) lines.push(`WhatsApp: https://wa.me/${d}`);
  }
  return lines.join("\n").trim();
}
