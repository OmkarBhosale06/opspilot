import { MetricTile } from "@/components/overview/metric-tiles";
import type { OverviewResponse } from "@/types";

export function MetricTiles({ overview }: { overview: OverviewResponse }) {
  const clusterTone =
    overview.status === "healthy"
      ? "healthy"
      : overview.status === "incident"
        ? "critical"
        : "warning";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricTile
        label="Cluster health"
        value={overview.k8sConnected ? overview.status : "offline"}
        hint={overview.cluster}
        tone={overview.k8sConnected ? clusterTone : "critical"}
      />
      <MetricTile
        label="Active incidents"
        value={overview.incidents.open}
        hint={`${overview.incidents.total} total`}
        tone={overview.incidents.open > 0 ? "critical" : "healthy"}
      />
      <MetricTile
        label="Unhealthy pods"
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
            : "All available"
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
