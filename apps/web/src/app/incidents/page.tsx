"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  incidentStatusTone,
  severityTone,
} from "@/components/ui/states";
import { listIncidents } from "@/services/incidents";
import {
  formatDuration,
  formatPercent,
  formatRelative,
} from "@/lib/formatters";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSse } from "@/hooks/use-sse";

export default function IncidentsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["incidents"],
    queryFn: listIncidents,
    refetchInterval: 10_000,
  });

  useSse("/api/incidents/stream", {
    onEvent: (event) => {
      if (event.type.startsWith("incident.") || event.type.startsWith("policy.")) {
        void queryClient.invalidateQueries({ queryKey: ["incidents"] });
      }
    },
  });

  return (
    <AppShell title="Incidents">
      <PageHeader
        title="Incidents"
        description="Open investigations first. Resolved items remain as memory."
      />

      {isLoading ? <LoadingBlock /> : null}
      {isError ? (
        <ErrorState
          description={
            error instanceof ApiError ? error.message : "Failed to load incidents"
          }
        />
      ) : null}

      {data && data.length === 0 ? (
        <EmptyState
          title="No incidents"
          description="Alerts will open a command center workspace here."
        />
      ) : null}

      {data && data.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Error rate</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((incident) => {
                const open =
                  incident.status !== "resolved" && incident.status !== "closed";
                return (
                  <TableRow
                    key={incident.id}
                    className={cn(
                      open &&
                        severityTone(incident.severity) === "critical" &&
                        "bg-status-critical/6"
                    )}
                  >
                    <TableCell>
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="block rounded-sm hover:text-ai focus-visible:outline-none"
                      >
                        <div className="mono text-xs font-medium">
                          {incident.id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {incident.title}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          severityTone(incident.severity) === "critical"
                            ? "critical"
                            : "warning"
                        }
                      >
                        {incident.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          incidentStatusTone(incident.status) === "healthy"
                            ? "healthy"
                            : incidentStatusTone(incident.status) === "warning"
                              ? "warning"
                              : "critical"
                        }
                      >
                        {incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="mono text-xs">
                      {incident.service}
                    </TableCell>
                    <TableCell className="mono text-xs text-status-critical">
                      {formatPercent(incident.errorRate / 100, 1)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDuration(incident.startedAt, incident.resolvedAt)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelative(incident.updatedAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </AppShell>
  );
}
