import { getApiBaseUrl } from "@/lib/api";

export type VitrineAnalyticsEventType =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "checkout_open";

type Queued = {
  event_type: VitrineAnalyticsEventType;
  path: string;
  session_id: string;
  product_id?: string;
};

const queues = new Map<string, Queued[]>();
const timers = new Map<string, ReturnType<typeof setTimeout>>;

function sessionKey(slug: string): string {
  return `vitrine-analytics-sid:${slug}`;
}

export function getOrCreateVitrineSessionId(slug: string): string {
  if (typeof window === "undefined") return "";
  try {
    let s = localStorage.getItem(sessionKey(slug));
    if (!s) {
      s = crypto.randomUUID();
      localStorage.setItem(sessionKey(slug), s);
    }
    return s;
  } catch {
    return "";
  }
}

function scheduleFlush(slug: string): void {
  if (timers.has(slug)) return;
  const t = setTimeout(() => {
    timers.delete(slug);
    void flushVitrineAnalytics(slug);
  }, 900);
  timers.set(slug, t);
}

export function trackVitrineEvent(
  slug: string,
  event: Omit<Queued, "session_id"> & { product_id?: string },
): void {
  if (typeof window === "undefined") return;
  const session_id = getOrCreateVitrineSessionId(slug);
  if (!session_id) return;
  const q = queues.get(slug) ?? [];
  q.push({ ...event, session_id });
  queues.set(slug, q);
  scheduleFlush(slug);
}

export async function flushVitrineAnalytics(slug: string): Promise<void> {
  const pending = queues.get(slug);
  if (!pending?.length) return;
  const batch = pending.splice(0, 50);
  if (pending.length > 0) queues.set(slug, pending);
  else queues.delete(slug);
  if (batch.length === 0) return;
  const url = `${getApiBaseUrl()}/api/v2/public/stores/${encodeURIComponent(slug)}/analytics/events`;
  const body = JSON.stringify({
    events: batch.map((e) => ({
      event_type: e.event_type,
      path: e.path,
      session_id: e.session_id,
      product_id: e.product_id ?? null,
    })),
  });
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}
