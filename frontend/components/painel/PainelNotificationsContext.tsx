"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getSoundEnabledFromStorage,
  playNewOrderChime,
  setSoundEnabledInStorage,
  unlockNotificationAudio,
} from "@/lib/painel-notification-sound";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";

export type StoreNotificationRow = {
  id: string;
  kind: string;
  order_id: string | null;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationsInboxData = {
  items: StoreNotificationRow[];
  unread_count: number;
};

type PainelNotificationsContextValue = {
  inbox: NotificationsInboxData | null;
  loading: boolean;
  error: string | null;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  refetch: () => Promise<void>;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const PainelNotificationsContext = createContext<PainelNotificationsContextValue | null>(null);

const POLL_MS = 22_000;

export function PainelNotificationsProvider({ children }: { children: ReactNode }) {
  const [inbox, setInbox] = useState<NotificationsInboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState(true);

  const prevUnreadRef = useRef<number | null>(null);
  const firstFetchDoneRef = useRef(false);
  const soundEnabledRef = useRef(true);

  useEffect(() => {
    const se = getSoundEnabledFromStorage();
    setSoundEnabledState(se);
    soundEnabledRef.current = se;
  }, []);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const setSoundEnabled = useCallback((v: boolean) => {
    setSoundEnabledState(v);
    setSoundEnabledInStorage(v);
  }, []);

  const refetch = useCallback(async () => {
    try {
      const data = await apiPainelJson<NotificationsInboxData>("/api/v2/notifications?limit=50");
      setInbox(data);
      setError(null);

      if (!firstFetchDoneRef.current) {
        firstFetchDoneRef.current = true;
        prevUnreadRef.current = data.unread_count;
        return;
      }

      const prev = prevUnreadRef.current ?? 0;
      if (data.unread_count > prev && soundEnabledRef.current) {
        playNewOrderChime();
      }
      prevUnreadRef.current = data.unread_count;
    } catch (e: unknown) {
      if (e instanceof PainelApiError && e.status === 401) {
        setInbox(null);
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "Erro ao carregar notificações");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const once = () => {
      unlockNotificationAudio();
      document.removeEventListener("click", once);
    };
    document.addEventListener("click", once, { capture: true });
    return () => document.removeEventListener("click", once, { capture: true });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refetch();
      }
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refetch]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void refetch();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refetch]);

  const markRead = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      await apiPainelJson<{ marked_count: number }>("/api/v2/notifications/mark-read", {
        method: "POST",
        body: JSON.stringify({ notification_ids: ids }),
      });
      await refetch();
    },
    [refetch],
  );

  const markAllRead = useCallback(async () => {
    await apiPainelJson<{ marked_count: number }>("/api/v2/notifications/read-all", {
      method: "POST",
    });
    await refetch();
  }, [refetch]);

  const value = useMemo(
    () => ({
      inbox,
      loading,
      error,
      soundEnabled,
      setSoundEnabled,
      refetch,
      markRead,
      markAllRead,
    }),
    [inbox, loading, error, soundEnabled, setSoundEnabled, refetch, markRead, markAllRead],
  );

  return (
    <PainelNotificationsContext.Provider value={value}>{children}</PainelNotificationsContext.Provider>
  );
}

export function usePainelNotifications(): PainelNotificationsContextValue {
  const ctx = useContext(PainelNotificationsContext);
  if (!ctx) {
    throw new Error("usePainelNotifications dentro de PainelNotificationsProvider");
  }
  return ctx;
}
