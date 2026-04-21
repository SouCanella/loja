/** IP-12 — partilhar URL pública da loja (copiar, WhatsApp, Web Share API). */

export function publicStoreUrl(origin: string, storeSlug: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/loja/${encodeURIComponent(storeSlug)}`;
}

export function shareStoreMessage(storeName: string, url: string): string {
  return `Vê o catálogo da ${storeName}: ${url}`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function whatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function shareViaNavigator(
  title: string,
  text: string,
  url: string,
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    await navigator.share({ title, text, url });
    return true;
  } catch {
    return false;
  }
}
