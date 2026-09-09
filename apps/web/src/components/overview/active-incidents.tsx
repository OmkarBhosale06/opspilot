"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import {
  incidentStatusTone,
  severityTone,
} from "@/components/ui/states";
import { formatDuration, formatPercent } from "@/lib/formatters";
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
        <CardTitle>Active incidents</CardTitle>
        <span className="mono text-[11px] text-muted-foreground">
          {active.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {active.length === 0 ? (
          <EmptyState
            title="Production calm"
            description="No open incidents requiring attention."
            className="border-0 py-8"
          />
        ) : (
          active.map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="block rounded-md border border-border-subtle bg-muted/20 px-3 py-2 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-2">
                <span className="mono text-[11px] text-muted-foreground">
                  {incident.id}
                </span>
                <Badge variant={severityTone(incident.severity) === "critical" ? "critical" : "warning"}>
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
                <span className="mono ml-auto text-[10px] text-muted-foreground">
                  {formatDuration(incident.startedAt, incident.resolvedAt)}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-foreground">
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
