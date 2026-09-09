import { Card, CardContent } from "@/components/ui/card";
import { StatusDot, type StatusTone } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";
import type { OverviewResponse } from "@/types";

export function MetricTile({
  label,
  value,
  hint,
  tone = "unknown",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden",
        tone === "critical" && "border-status-critical/35",
        tone === "warning" && "border-status-warning/35",
        tone === "healthy" && "border-status-healthy/25",
        className
      )}
    >
      <div
        className={cn(
          "h-0.5",
          tone === "critical" && "bg-status-critical",
          tone === "warning" && "bg-status-warning",
          tone === "healthy" && "bg-status-healthy",
          tone === "info" && "bg-status-info",
          (tone === "unknown" || tone === "ai") && "bg-border"
        )}
        aria-hidden
      />
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </span>
          <StatusDot tone={tone} pulse={tone === "critical"} />
        </div>
        <div className="text-2xl font-semibold tracking-tight tabular-nums capitalize">
          {value}
        </div>
        {hint ? (
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function MetricTiles({ overview }: { overview: OverviewResponse }) {
  const clusterTone: StatusTone =
    overview.status === "healthy"
      ? "healthy"
      : overview.status === "incident"
        ? "critical"
        : "warning";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricTile
        label="Cluster"
        value={overview.k8sConnected ? overview.status : "offline"}
        hint={overview.cluster}
        tone={overview.k8sConnected ? clusterTone : "critical"}
      />
      <MetricTile
        label="Open incidents"
        value={overview.incidents.open}
        hint={
          overview.incidents.highestSeverity
            ? `Highest ${overview.incidents.highestSeverity}`
            : `${overview.incidents.total} total`
        }
        tone={overview.incidents.open > 0 ? "critical" : "healthy"}
      />
      <MetricTile
        label="Pods not ready"
        value={overview.pods.notReady}
        hint={`${overview.pods.ready}/${overview.pods.total} ready`}
        tone={
          overview.pods.notReady > 0
            ? "critical"
            : overview.k8sConnected
              ? "healthy"
              : "unknown"
        }
      />
      <MetricTile
        label="Deployments"
        value={`${overview.deployments.available}/${overview.deployments.total}`}
        hint={
          overview.deployments.unavailable > 0
            ? `${overview.deployments.unavailable} unavailable`
            : overview.k8sConnected
              ? "All available"
              : "No cluster data"
        }
        tone={
          overview.deployments.unavailable > 0
            ? "warning"
            : overview.k8sConnected
              ? "healthy"
              : "unknown"
        }
      />
    </div>
  );
}
