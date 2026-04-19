import { getApiBaseUrl } from "@/lib/api";
import { messageFromV2Error, toApiV2Path, unwrapV2Success } from "@/lib/api-v2";

const REFRESH_KEY = "refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setSessionTokens(access: string, refresh?: string | null) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", access);
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  const url = `${getApiBaseUrl()}/api/v2/auth/refresh`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: rt }),
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    return null;
  }
  try {
    const data = unwrapV2Success<{
      access_token: string;
      refresh_token?: string | null;
    }>(raw);
    if (typeof data.access_token !== "string") {
      return null;
    }
    setSessionTokens(data.access_token, data.refresh_token ?? rt);
    return data.access_token;
  } catch {
    return null;
  }
}

export class PainelApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PainelApiError";
  }
}

function errorMessageFromResponse(raw: unknown, status: number): string {
  const v2 = messageFromV2Error(raw);
  if (v2) return v2;
  if (typeof raw === "object" && raw !== null && "detail" in raw) {
    const d = (raw as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return JSON.stringify(d);
  }
  return `Erro ${status}`;
}

/** Chamada autenticada à API v2 (JSON com envelope). */
export async function apiPainelJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let token = getAccessToken();
  if (!token) {
    throw new PainelApiError("Faça login para continuar.", 401);
  }
  const pathV2 = toApiV2Path(path.startsWith("/") ? path : `/${path}`);
  const url = `${getApiBaseUrl()}${pathV2.startsWith("/") ? pathV2 : `/${pathV2}`}`;
  const doFetch = (bearer: string) =>
    fetch(url, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
        Authorization: `Bearer ${bearer}`,
      },
    });
  let res = await doFetch(token);
  if (res.status === 401 && getRefreshToken()) {
    const next = await refreshAccessToken();
    if (next) {
      res = await doFetch(next);
    }
  }
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PainelApiError(errorMessageFromResponse(raw, res.status), res.status);
  }
  return unwrapV2Success<T>(raw);
}

export function formatBRL(value: string | number): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Estados canónicos (DEC-14) — ordem do fluxo operacional. */
export const ORDER_STATUS_VALUES = [
  "rascunho",
  "aguardando_confirmacao",
  "confirmado",
  "em_producao",
  "pronto",
  "saiu_entrega",
  "entregue",
  "cancelado",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];

const ORDER_STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_confirmacao: "Aguardando confirmação",
  confirmado: "Confirmado",
  em_producao: "Em produção",
  pronto: "Pronto",
  saiu_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

/** Digits only — `wa.me/{digits}` */
export function whatsappDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Abre conversa WhatsApp com texto (UTF-8). Requer pelo menos um dígito no telefone. */
export function whatsAppUrl(phone: string, text: string): string | null {
  const d = whatsappDigits(phone);
  if (!d) return null;
  const u = new URL(`https://wa.me/${d}`);
  u.searchParams.set("text", text);
  return u.toString();
}

/** Rascunho de mensagem para contactar o cliente (lojista edita antes de enviar). */
export function draftOrderWhatsAppMessage(opts: {
  storeName: string;
  orderIdShort: string;
  orderIdFull: string;
  statusLabel: string;
  lines: { productName: string; qtyLabel: string; lineTotal: string }[];
  total: string;
  customerNote: string | null;
}): string {
  const head = `*${opts.storeName}*\nPedido #${opts.orderIdShort}\nEstado: ${opts.statusLabel}\n`;
  const body = opts.lines
    .map((l) => `• ${l.productName} — ${l.qtyLabel} → ${l.lineTotal}`)
    .join("\n");
  const tailParts = [`\n*Total:* ${opts.total}`];
  if (opts.customerNote) {
    tailParts.push(`\n_Nota:_ ${opts.customerNote}`);
  }
  tailParts.push(`\n\n_Ref.:_ ${opts.orderIdFull}`);
  return head + (body ? `\n${body}` : "\n(sem itens)") + tailParts.join("");
}
