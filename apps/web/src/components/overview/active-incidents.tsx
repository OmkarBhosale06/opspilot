"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { incidentStatusTone, severityTone } from "@/components/ui/states";
import { formatDuration, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { IncidentSummary } from "@/types";

export function ActiveIncidents({
  incidents,
}: {
  incidents: IncidentSummary[];
}) {
  const active = incidents.filter(
    (i) => i.status !== "resolved" && i.status !== "closed"
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <span className="mono text-[11px] text-muted-foreground">
          {active.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {active.length === 0 ? (
          <EmptyState
            title="No open incidents"
            description="When an alert fires, the command center opens here."
            className="border-0 bg-transparent py-6"
          />
        ) : (
          active.map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className={cn(
                "block rounded-md border px-3 py-2.5 transition-colors hover:bg-accent/50",
                severityTone(incident.severity) === "critical"
                  ? "border-status-critical/35 bg-status-critical/6"
                  : "border-border-subtle bg-muted/20"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="mono text-[11px] text-muted-foreground">
                  {incident.id}
                </span>
                <Badge
                  variant={
                    severityTone(incident.severity) === "critical"
                      ? "critical"
                      : "warning"
                  }
                >
                  {incident.severity}
                </Badge>
                <Badge
                  variant={
                    incidentStatusTone(incident.status) === "warning"
                      ? "warning"
                      : "critical"
                  }
                >
                  {incident.status}
                </Badge>
                <span className="mono ml-auto shrink-0 text-[10px] text-muted-foreground">
                  {formatDuration(incident.startedAt, incident.resolvedAt)}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium leading-snug">
                {incident.title}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {incident.service} · {formatPercent(incident.errorRate / 100, 1)}{" "}
                5xx
              </p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
