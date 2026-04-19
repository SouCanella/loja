/**
 * Respostas `/api/v2` (DEC-06): `{ success, data, errors }`.
 */

export function unwrapV2Success<T>(raw: unknown): T {
  if (
    typeof raw === "object" &&
    raw !== null &&
    "success" in raw &&
    (raw as { success: boolean }).success === true &&
    "data" in raw
  ) {
    return (raw as { data: T }).data;
  }
  throw new Error("Resposta da API em formato inesperado (esperado envelope v2).");
}

export function messageFromV2Error(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    detail?: unknown;
  };
  if (
    r.success === false &&
    Array.isArray(r.errors) &&
    r.errors[0] &&
    typeof r.errors[0].message === "string"
  ) {
    return r.errors[0].message;
  }
  if (typeof r.detail === "string") return r.detail;
  return null;
}

/** Normaliza caminhos legados `/api/v1/...` → `/api/v2/...`. */
export function toApiV2Path(path: string): string {
  if (path.startsWith("/api/v1/")) {
    return path.replace("/api/v1/", "/api/v2/");
  }
  return path;
}
