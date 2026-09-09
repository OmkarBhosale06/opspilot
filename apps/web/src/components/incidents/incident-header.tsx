import { Badge } from "@/components/ui/badge";
import {
  incidentStatusTone,
  severityTone,
} from "@/components/ui/states";
import {
  formatDuration,
  formatPercent,
  formatRelative,
  formatTimestamp,
} from "@/lib/formatters";
import type { Incident } from "@/types";

export function IncidentHeader({ incident }: { incident: Incident }) {
  const confidence =
    incident.confidence ?? incident.rootCause?.confidence ?? null;

  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono text-sm font-semibold text-foreground">
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
                incidentStatusTone(incident.status) === "healthy"
                  ? "healthy"
                  : incidentStatusTone(incident.status) === "warning"
                    ? "warning"
                    : "critical"
              }
            >
              {incident.status}
            </Badge>
          </div>
          <h1 className="text-base font-medium tracking-tight">
            {incident.title}
          </h1>
          <p className="max-w-3xl text-xs text-muted-foreground">
            {incident.summary}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-right sm:grid-cols-4">
          <Meta label="Environment" value={incident.namespace} />
          <Meta label="Source" value="Kubernetes" />
          <Meta
            label="Started"
            value={formatRelative(incident.startedAt)}
            hint={formatTimestamp(incident.startedAt)}
          />
          <Meta
            label="Duration"
            value={formatDuration(incident.startedAt, incident.resolvedAt)}
          />
          <Meta
            label="Confidence"
            value={confidence != null ? formatPercent(confidence, 0) : "—"}
          />
          <Meta
            label="Error rate"
            value={formatPercent(incident.errorRate / 100, 1)}
          />
          <Meta label="Service" value={incident.service} mono />
          <Meta label="Cluster" value={incident.clusterId} mono />
        </div>
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  hint,
  mono,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={mono ? "mono text-xs text-foreground" : "text-xs text-foreground"}
        title={hint}
      >
        {value}
      </div>
    </div>
  );
}
