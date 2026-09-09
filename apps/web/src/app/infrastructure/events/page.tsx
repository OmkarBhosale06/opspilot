"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EventStream } from "@/components/infrastructure/event-stream";
import { StatusDot } from "@/components/ui/status-dot";
import { ErrorState, LoadingBlock } from "@/components/ui/states";
import { listEvents } from "@/services/events";
import { useSse } from "@/hooks/use-sse";
import { ApiError } from "@/lib/api";
import type { K8sEventDto } from "@/types";

export default function EventsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
    refetchInterval: 12_000,
  });

  const { events: sseEvents, connected } = useSse("/api/health/stream");

  const merged: K8sEventDto[] = useMemo(() => {
    const base = data ?? [];
    const extras: K8sEventDto[] = sseEvents
      .filter((e) => e.type.startsWith("k8s.event") || e.type === "k8s.Warning")
      .map((e, i) => ({
        type: e.status === "Warning" || e.type.includes("Warning")
          ? "Warning"
          : "Normal",
        reason: e.step ?? e.type,
        message: e.message ?? "",
        object: typeof e.data === "object" && e.data && "object" in e.data
          ? String((e.data as { object?: string }).object ?? "cluster")
          : "cluster",
        namespace: e.namespace ?? "opspilot",
        count: 1,
        firstTimestamp: e.timestamp,
        lastTimestamp: e.timestamp,
      }));
    return [...extras, ...base];
  }, [data, sseEvents]);

  return (
    <AppShell
      title="Events"
      breadcrumb={<span>Infrastructure / Events</span>}
      actions={
        connected ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-status-healthy">
            <StatusDot tone="healthy" pulse />
            SSE live
          </span>
        ) : null
      }
    >
      <PageHeader
        title="Cluster events"
        description="Warning and normal Kubernetes events with optional live updates."
      />
      {isLoading ? <LoadingBlock rows={8} /> : null}
      {isError ? (
        <ErrorState
          title="Events unavailable"
          description={
            error instanceof ApiError
              ? error.message
              : "Unable to reach the control plane."
          }
        />
      ) : null}
      {!isLoading && !isError ? <EventStream events={merged} /> : null}
    </AppShell>
  );
}
