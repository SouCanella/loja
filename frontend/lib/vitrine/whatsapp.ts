/** Monta URL wa.me com texto UTF-8. */
export function whatsappOrderUrl(phoneRaw: string, message: string): string {
  const digits = phoneRaw.replace(/\D/g, "");
  if (!digits) return "";
  const text = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${text}`;
}

export function formatBRL(value: string | number): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
