const EMOJIS = ["🧁", "🍰", "🎂", "🍮", "🥧", "🍪", "🧇", "🥐", "🍩", "🧈"];

/** Emoji estável por id de produto (substitui fotos no MVP). */
export function productEmoji(productId: string): string {
  let h = 0;
  for (let i = 0; i < productId.length; i++) {
    h = (h * 31 + productId.charCodeAt(i)) >>> 0;
  }
  return EMOJIS[h % EMOJIS.length];
}
