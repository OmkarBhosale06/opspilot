"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { IncidentHeader } from "@/components/incidents/incident-header";
import { CausalChain } from "@/components/incidents/causal-chain";
import { IncidentTimeline } from "@/components/incidents/timeline";
import { InvestigationStream } from "@/components/incidents/investigation-stream";
import { EvidencePanel } from "@/components/incidents/evidence-panel";
import { RootCauseCard } from "@/components/incidents/root-cause";
import { RemediationCard } from "@/components/incidents/remediation-card";
import { RelatedAndSimilar } from "@/components/incidents/related-similar";
import {
  ErrorRateSparkline,
  demoErrorRateSeries,
} from "@/components/charts/error-rate-sparkline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingBlock } from "@/components/ui/states";
import { getIncident } from "@/services/incidents";
import { useSse } from "@/hooks/use-sse";
import { ApiError } from "@/lib/api";
import type { InvestigationStep } from "@/types";

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

  const { events: agentEvents, connected } = useSse("/api/agent/stream", {
    enabled: Boolean(id),
  });

  const liveEvents = useMemo(
    () => agentEvents.filter((e) => !e.incidentId || e.incidentId === id),
    [agentEvents, id]
  );

  const steps: InvestigationStep[] = data?.investigation ?? [];
  const series = useMemo(
    () => demoErrorRateSeries(data?.errorRate ?? 0.4),
    [data?.errorRate]
  );

  return (
    <AppShell
      title={data ? `${data.id} · ${data.status}` : "Incident"}
      breadcrumb={
        <nav className="flex items-center gap-1.5">
          <Link href="/incidents" className="hover:text-foreground">
            Incidents
          </Link>
          <span aria-hidden>/</span>
          <span className="mono text-foreground">{id}</span>
        </nav>
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
          <CausalChain incident={data} />

          <RemediationCard
            remediation={data.remediation}
            policy={data.policy}
            verification={data.verification}
          />

          <RootCauseCard rootCause={data.rootCause} />

          <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
            <InvestigationStream
              steps={steps}
              liveEvents={liveEvents}
              connected={connected}
            />
            <div className="space-y-3">
              <Card>
                <CardHeader>
                  <CardTitle>Error rate</CardTitle>
                  <span className="mono text-[10px] text-status-critical">
                    {data.service} · {data.errorRate.toFixed(1)}% 5xx
                  </span>
                </CardHeader>
                <CardContent>
                  <ErrorRateSparkline
                    data={series}
                    critical={data.errorRate > 5}
                    className="h-20"
                  />
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Inflection aligns with {data.rootCause.change}. Series is
                    illustrative until Prometheus is wired.
                  </p>
                </CardContent>
              </Card>
              <EvidencePanel evidence={data.evidence} />
            </div>
          </div>

          <IncidentTimeline events={data.timeline} />
          <RelatedAndSimilar incident={data} />
        </div>
      ) : null}
    </AppShell>
  );
}
