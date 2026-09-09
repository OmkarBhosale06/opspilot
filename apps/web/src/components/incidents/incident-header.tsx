import { Badge } from "@/components/ui/badge";
import { incidentStatusTone, severityTone } from "@/components/ui/states";
import {
  formatDuration,
  formatPercent,
  formatRelative,
  formatTimestamp,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Incident } from "@/types";

export function IncidentHeader({ incident }: { incident: Incident }) {
  const confidence =
    incident.confidence ?? incident.rootCause?.confidence ?? null;
  const sevTone = severityTone(incident.severity);
  const statusTone = incidentStatusTone(incident.status);

  return (
    <header
      className={cn(
        "rounded-md border bg-card px-4 py-3.5",
        sevTone === "critical"
          ? "border-status-critical/40"
          : "border-status-warning/35"
      )}
    >
      <div
        className={cn(
          "-ml-4 mb-3 h-0.5 w-[calc(100%+2rem)]",
          sevTone === "critical" ? "bg-status-critical" : "bg-status-warning"
        )}
        aria-hidden
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="mono text-sm font-semibold tracking-tight">
              {incident.id}
            </h1>
            <Badge variant={sevTone === "critical" ? "critical" : "warning"}>
              {incident.severity}
            </Badge>
            <Badge
              variant={
                statusTone === "healthy"
                  ? "healthy"
                  : statusTone === "warning"
                    ? "warning"
                    : "critical"
              }
            >
              {incident.status}
            </Badge>
          </div>
          <p className="text-[15px] font-medium leading-snug tracking-tight">
            {incident.title}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {incident.summary}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-4">
          <Meta label="Service" value={incident.service} mono />
          <Meta label="Namespace" value={incident.namespace} mono />
          <Meta
            label="Started"
            value={formatRelative(incident.startedAt)}
            hint={formatTimestamp(incident.startedAt)}
          />
          <Meta
            label="Open for"
            value={formatDuration(incident.startedAt, incident.resolvedAt)}
          />
          <Meta
            label="5xx rate"
            value={formatPercent(incident.errorRate / 100, 1)}
            emphasize
          />
          <Meta
            label="Confidence"
            value={confidence != null ? formatPercent(confidence, 0) : "—"}
          />
          <Meta label="Cluster" value={incident.clusterId} mono />
          <Meta label="Replicas" value={String(incident.affectedReplicas)} />
        </dl>
      </div>
    </header>
  );
}

function Meta({
  label,
  value,
  hint,
  mono,
  emphasize,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-xs",
          mono && "mono",
          emphasize ? "font-semibold text-status-critical" : "text-foreground"
        )}
        title={hint}
      >
        {value}
      </dd>
    </div>
  );
}
