"use client";

import { useEffect, useRef, useState } from "react";
import { sseUrl } from "@/lib/api";
import type { OpsEvent } from "@/types";

type Options = {
  enabled?: boolean;
  onEvent?: (event: OpsEvent) => void;
};

export function useSse(path: string | null, options: Options = {}) {
  const { enabled = true, onEvent } = options;
  const [events, setEvents] = useState<OpsEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !path) return;

    let es: EventSource | null = null;
    let closed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (closed) return;
      setError(null);
      es = new EventSource(sseUrl(path));

      es.onopen = () => setConnected(true);

      const handlePayload = (raw: MessageEvent) => {
        try {
          const data = JSON.parse(raw.data) as OpsEvent;
          setEvents((prev) => [data, ...prev].slice(0, 200));
          onEventRef.current?.(data);
        } catch {
          // ignore malformed frames
        }
      };

      es.addEventListener("message", handlePayload);
      es.addEventListener("heartbeat", handlePayload);

      es.onerror = () => {
        setConnected(false);
        setError("SSE disconnected");
        es?.close();
        retryTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
      setConnected(false);
    };
  }, [path, enabled]);

  return { events, connected, error, clear: () => setEvents([]) };
}
