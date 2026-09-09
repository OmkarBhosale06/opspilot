"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EventStream } from "@/components/infrastructure/event-stream";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";
import { listEvents } from "@/services/events";
import { useSse } from "@/hooks/use-sse";
import { ApiError } from "@/lib/api";

export default function EventsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
    refetchInterval: 12_000,
    retry: false,
  });

  useSse("/api/health/stream", {
    onEvent: (event) => {
      if (event.type.startsWith("k8s.event")) {
        void qc.invalidateQueries({ queryKey: ["events"] });
      }
    },
  });

  return (
    <AppShell title="Events">
      <PageHeader
        title="Events"
        description="What is Kubernetes reporting right now?"
      />
      {isLoading ? <LoadingBlock /> : null}
      {isError ? (
        <ErrorState
          title="Events unavailable"
          description={
            error instanceof ApiError
              ? error.message
              : "Cluster events require a connected Kind/Kubernetes API."
          }
        />
      ) : null}
      {data && data.length === 0 ? (
        <EmptyState title="No events" description="Quiet cluster, or disconnected." />
      ) : null}
      {data && data.length > 0 ? (
        <Card>
          <EventStream events={data} />
        </Card>
      ) : null}
    </AppShell>
  );
}
