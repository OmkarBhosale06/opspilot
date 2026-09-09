"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricTile } from "@/components/overview/metric-tiles";
import { ActiveIncidents } from "@/components/overview/active-incidents";
import { LiveEvents } from "@/components/overview/live-events";
import { AgentActivityPanel } from "@/components/agents/agent-activity-panel";
import { ErrorRateSparkline } from "@/components/charts/error-rate-sparkline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingBlock } from "@/components/ui/states";
import { getOverview } from "@/services/overview";
import { listIncidents } from "@/services/incidents";
import { listEvents } from "@/services/events";
import { ApiError } from "@/lib/api";
import { useSse } from "@/hooks/use-sse";
import { useQueryClient } from "@tanstack/react-query";

export default function OverviewPage() {
  const qc = useQueryClient();

  const overview = useQuery({
    queryKey: ["overview"],
    queryFn: getOverview,
    refetchInterval: 15_000,
  });

  const incidents = useQuery({
    queryKey: ["incidents"],
    queryFn: listIncidents,
    refetchInterval: 15_000,
  });

  const events = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
    refetchInterval: 20_000,
    retry: false,
  });

  useSse("/api/health/stream", {
    onEvent: () => {
      void qc.invalidateQueries({ queryKey: ["overview"] });
      void qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  useSse("/api/agent/stream", {
    onEvent: () => {
      void qc.invalidateQueries({ queryKey: ["incidents"] });
    },
  });

  return (
    <AppShell title="Overview">
      <PageHeader
        title="Overview"
        description="Is production healthy? What changed? What needs attention?"
      />

      {overview.isLoading ? <LoadingBlock rows={3} /> : null}
      {overview.isError ? (
        <ErrorState
          title="Unable to load overview"
          description={
            overview.error instanceof ApiError
              ? overview.error.message
              : "API unreachable. Start the control plane on :4000."
          }
        />
      ) : null}

      {overview.data ? (
        <div className="space-y-4">
          {overview.data.message ? (
            <div className="rounded-md border border-status-warning/30 bg-status-warning/5 px-3 py-2 text-xs text-status-warning">
              {overview.data.message}
            </div>
          ) : null}

          <MetricTiles overview={overview.data} />

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <ActiveIncidents incidents={incidents.data ?? []} />
              <Card>
                <CardHeader>
                  <CardTitle>Error rate signal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ErrorRateSparkline
                    incidentErrorRate={
                      incidents.data?.find((i) => i.status !== "resolved")
                        ?.errorRate
                    }
                  />
                </CardContent>
              </Card>
              <LiveEvents
                events={events.data ?? []}
                error={
                  events.isError
                    ? events.error instanceof ApiError
                      ? events.error.message
                      : "Events unavailable (cluster may be offline)"
                    : undefined
                }
              />
            </div>
            <AgentActivityPanel />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
