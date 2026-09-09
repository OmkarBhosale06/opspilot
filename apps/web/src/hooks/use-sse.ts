"use client";

import { useEffect, useRef, useState } from "react";
import { sseUrl, clientLog } from "@/lib/api";
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
      const url = sseUrl(path);
      clientLog("sse", `connecting ${url}`);
      es = new EventSource(url);

      es.onopen = () => {
        setConnected(true);
        clientLog("sse", `open ${url}`);
      };

      const handlePayload = (raw: MessageEvent) => {
        try {
          const data = JSON.parse(raw.data) as OpsEvent;
          const eventName = raw.type || "message";
          if (data.type === "heartbeat" || eventName === "heartbeat") {
            if (process.env.NEXT_PUBLIC_API_DEBUG === "1") {
              clientLog("sse", `heartbeat ${url}`);
            }
          } else {
            clientLog("sse", `${eventName} ${data.type}`, {
              incidentId: data.incidentId,
              message: data.message,
            });
          }
          setEvents((prev) => [data, ...prev].slice(0, 200));
          onEventRef.current?.(data);
        } catch {
          clientLog("sse", `ignored malformed frame on ${url}`);
        }
      };

      es.addEventListener("message", handlePayload);
      es.addEventListener("heartbeat", handlePayload);

      es.onerror = () => {
        setConnected(false);
        setError("SSE disconnected");
        clientLog("sse", `error ${url} — retrying in 3s`);
        es?.close();
        retryTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
      if (path) clientLog("sse", `closed ${sseUrl(path)}`);
      setConnected(false);
    };
  }, [path, enabled]);

  return { events, connected, error, clear: () => setEvents([]) };
}
