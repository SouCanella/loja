import { getApiBaseUrl } from "@/lib/api";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
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

/** Chamada autenticada à API (JSON). */
export async function apiPainelJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new PainelApiError("Faça login para continuar.", 401);
  }
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  const data = (await res.json().catch(() => ({}))) as { detail?: unknown };
  if (!res.ok) {
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? JSON.stringify(data.detail)
          : `Erro ${res.status}`;
    throw new PainelApiError(msg, res.status);
  }
  return data as T;
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
