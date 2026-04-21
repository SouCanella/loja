export type OrderRow = {
  id: string;
  status: string;
  customer_note: string | null;
  source: string | null;
  stock_committed: boolean;
  created_at: string;
  contact_name: string | null;
  contact_phone: string | null;
  customer_id: string | null;
};

export type ContactGroup = {
  key: string;
  orders: OrderRow[];
  label: { title: string; subtitle: string | null };
};

/** Agrupa pedidos pelo mesmo contacto (telefone normalizado, senão nome, senão conta vitrine, senão pedido isolado). */
export function groupKey(o: OrderRow): string {
  const digits = (o.contact_phone ?? "").replace(/\D/g, "");
  if (digits.length >= 3) return `phone:${digits}`;
  const name = o.contact_name?.trim().toLowerCase();
  if (name) return `name:${name}`;
  if (o.customer_id) return `customer:${o.customer_id}`;
  return `order:${o.id}`;
}

export function sortOrdersDesc(orders: OrderRow[]): OrderRow[] {
  return [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function pickDisplayOrder(orders: OrderRow[]): OrderRow {
  const s = sortOrdersDesc(orders);
  return (
    s.find((o) => o.contact_name?.trim() && o.contact_phone?.trim()) ??
    s.find((o) => o.contact_name?.trim()) ??
    s.find((o) => o.contact_phone?.trim()) ??
    s[0]
  );
}

export function contactLabel(orders: OrderRow[]): { title: string; subtitle: string | null } {
  const o = pickDisplayOrder(orders);
  const name = o.contact_name?.trim() || null;
  const phone = o.contact_phone?.trim() || null;
  if (name && phone) return { title: name, subtitle: phone };
  if (name) return { title: name, subtitle: null };
  if (phone) return { title: phone, subtitle: null };
  if (o.customer_id) return { title: "Conta na vitrine", subtitle: `ID ${o.customer_id.slice(0, 8)}…` };
  return {
    title: "Sem nome nem telefone",
    subtitle: orders.length === 1 ? `Pedido ${o.id.slice(0, 8)}…` : `${orders.length} pedidos sem contacto`,
  };
}

/** Pesquisa por texto (nome, rótulos) ou por sequência de dígitos do telefone. */
export function groupMatchesFilter(group: ContactGroup, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;

  const qDigits = raw.replace(/\D/g, "");
  const labelText = `${group.label.title} ${group.label.subtitle ?? ""}`.toLowerCase();
  if (labelText.includes(q)) return true;

  for (const o of group.orders) {
    const name = (o.contact_name ?? "").trim().toLowerCase();
    if (name.includes(q)) return true;
    const phoneDigits = (o.contact_phone ?? "").replace(/\D/g, "");
    if (qDigits.length >= 2 && phoneDigits.includes(qDigits)) return true;
  }

  return false;
}
