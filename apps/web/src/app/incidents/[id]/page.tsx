"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { IncidentHeader } from "@/components/incidents/incident-header";
import { IncidentTimeline } from "@/components/incidents/timeline";
import { InvestigationStream } from "@/components/incidents/investigation-stream";
import { EvidencePanel } from "@/components/incidents/evidence-panel";
import { RootCauseCard } from "@/components/incidents/root-cause";
import { RemediationCard } from "@/components/incidents/remediation-card";
import { RelatedAndSimilar } from "@/components/incidents/related-similar";
import { PolicyExecutionState } from "@/components/incidents/policy-state";
import { AgentActivityPanel } from "@/components/agents/agent-activity-panel";
import {
  ErrorRateSparkline,
  demoErrorRateSeries,
} from "@/components/charts/error-rate-sparkline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingBlock } from "@/components/ui/states";
import { getIncident } from "@/services/incidents";
import { useSse } from "@/hooks/use-sse";
import { ApiError } from "@/lib/api";
import type { AgentActivityItem, InvestigationStep } from "@/types";

export default function IncidentCommandCenterPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["incident", id],
    queryFn: () => getIncident(id),
    enabled: Boolean(id),
    refetchInterval: 12_000,
  });

  useSse("/api/incidents/stream", {
    enabled: Boolean(id),
    onEvent: (event) => {
      if (event.incidentId && event.incidentId !== id) return;
      if (
        event.type.startsWith("agent.") ||
        event.type.startsWith("incident.") ||
        event.step
      ) {
        void queryClient.invalidateQueries({ queryKey: ["incident", id] });
      }
    },
  });

  const { events: agentEvents } = useSse("/api/agent/stream", {
    enabled: Boolean(id),
  });

  const steps: InvestigationStep[] = data?.investigation ?? [];

  const agentItems: AgentActivityItem[] = useMemo(() => {
    const fromSse = agentEvents
      .filter((e) => !e.incidentId || e.incidentId === id)
      .slice(0, 6)
      .map((e, i) => ({
        id: `a-${e.timestamp}-${i}`,
        agent: "investigator",
        action: e.step ?? e.message ?? e.type,
        status:
          e.status === "running"
            ? ("running" as const)
            : e.status === "failed"
              ? ("failed" as const)
              : ("completed" as const),
        timestamp: e.timestamp,
        incidentId: e.incidentId ?? id,
        detail: e.message,
      }));
    if (fromSse.length) return fromSse;
    return steps.slice(-4).map((s) => ({
      id: s.id,
      agent: s.tool,
      action: s.step,
      status:
        s.status === "running"
          ? ("running" as const)
          : s.status === "failed"
            ? ("failed" as const)
            : s.status === "pending"
              ? ("idle" as const)
              : ("completed" as const),
      timestamp: s.completedAt ?? s.startedAt,
      incidentId: id,
      detail: s.summary,
    }));
  }, [agentEvents, steps, id]);

  return (
    <AppShell
      title={data ? data.id : "Incident"}
      breadcrumb={
        <span>
          Incidents / <span className="mono text-foreground">{id}</span>
        </span>
      }
    >
      {isLoading ? <LoadingBlock rows={8} /> : null}
      {isError ? (
        <ErrorState
          title="Incident not found"
          description={
            error instanceof ApiError
              ? error.message
              : "Failed to load incident command center."
          }
        />
      ) : null}

      {data ? (
        <div className="space-y-4">
          <IncidentHeader incident={data} />

          <div className="grid gap-3 xl:grid-cols-[1.1fr_1.1fr_0.9fr]">
            <IncidentTimeline events={data.timeline} />
            <InvestigationStream steps={steps} />
            <div className="space-y-3">
              <Card>
                <CardHeader>
                  <CardTitle>Error rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ErrorRateSparkline
                    data={demoErrorRateSeries(data.errorRate)}
                    critical={data.errorRate > 5}
                  />
                </CardContent>
              </Card>
              <AgentActivityPanel items={agentItems} dense />
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <EvidencePanel evidence={data.evidence} />
            <RootCauseCard rootCause={data.rootCause} />
          </div>

          <RelatedAndSimilar incident={data} />

          <div className="grid gap-3 xl:grid-cols-2">
            <RemediationCard
              remediation={data.remediation}
              policy={data.policy}
              verification={data.verification}
            />
            <PolicyExecutionState
              policy={data.policy}
              verification={data.verification}
            />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
