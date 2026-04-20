/**
 * Geração mínima ESC/POS para recibos (Fase 3.2 — experimental).
 * Caracteres fora de Latin-1 são substituídos por '?'.
 */

export type OrderPrintLine = {
  product_name: string;
  quantity: string;
  unit_price: string;
  line_total: string;
};

export type OrderPrintPayload = {
  store_name: string;
  order_id: string;
  status: string;
  created_at: string;
  customer_note?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  delivery_address?: string | null;
  delivery_option_id?: string | null;
  payment_method_id?: string | null;
  lines: OrderPrintLine[];
  total: string;
};

const ESC = 0x1b;
const GS = 0x1d;

function latin1Safe(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 0xff) {
      out += s[i];
    } else {
      out += "?";
    }
  }
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const n = parts.reduce((a, p) => a + p.length, 0);
  const u = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    u.set(p, o);
    o += p.length;
  }
  return u;
}

function textLine(s: string): Uint8Array {
  const enc = new TextEncoder();
  return enc.encode(latin1Safe(s) + "\n");
}

/** Inicialização + texto do pedido + corte parcial (comum em Epson/Star). */
export function buildEscPosFromOrderPrint(data: OrderPrintPayload): Uint8Array {
  const init = new Uint8Array([ESC, 0x40]);
  const header = textLine("---");
  const title = textLine(latin1Safe(data.store_name));
  const oid = textLine(`Pedido ${data.order_id}`);
  const st = textLine(`Estado: ${data.status}`);
  const created = textLine(`Data: ${data.created_at}`);
  const parts: Uint8Array[] = [init, header, title, oid, st, created, textLine("---")];

  if (data.contact_name || data.contact_phone) {
    if (data.contact_name) parts.push(textLine(`Cliente: ${data.contact_name}`));
    if (data.contact_phone) parts.push(textLine(`Tel: ${data.contact_phone}`));
  }
  if (data.delivery_option_id) parts.push(textLine(`Entrega: ${data.delivery_option_id}`));
  if (data.payment_method_id) parts.push(textLine(`Pagto: ${data.payment_method_id}`));
  if (data.delivery_address) parts.push(textLine(`End: ${data.delivery_address}`));
  if (data.customer_note) parts.push(textLine(`Nota: ${data.customer_note}`));

  parts.push(textLine("---"));
  for (const ln of data.lines) {
    const name = ln.product_name.slice(0, 36);
    parts.push(textLine(`${name}`));
    parts.push(textLine(`  ${ln.quantity} x ${ln.unit_price} = ${ln.line_total}`));
  }
  parts.push(textLine("---"));
  parts.push(textLine(`TOTAL ${data.total}`));
  parts.push(textLine(""));
  parts.push(textLine("Obrigado!"));
  parts.push(textLine(""));
  const cut = new Uint8Array([GS, 0x56, 0x00]);
  parts.push(cut);
  return concat(...parts);
}

export function hasWebUsb(): boolean {
  return typeof navigator !== "undefined" && "usb" in navigator;
}
