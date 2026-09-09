"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { InfraGraph } from "@/components/infrastructure/infra-graph";
import { ErrorState, LoadingBlock } from "@/components/ui/states";
import { listDeployments } from "@/services/deployments";
import { listPods } from "@/services/pods";
import { getOverview } from "@/services/overview";
import { ApiError } from "@/lib/api";

export default function InfraGraphPage() {
  const overview = useQuery({ queryKey: ["overview"], queryFn: getOverview });
  const deployments = useQuery({
    queryKey: ["deployments"],
    queryFn: () => listDeployments(),
  });
  const pods = useQuery({
    queryKey: ["pods"],
    queryFn: () => listPods(),
  });

  const loading =
    overview.isLoading || deployments.isLoading || pods.isLoading;
  const err = overview.error || deployments.error || pods.error;

  return (
    <AppShell
      title="Infrastructure graph"
      breadcrumb={<span>Infrastructure / Graph</span>}
    >
      <PageHeader
        title="Dependency graph"
        description="Cluster → Namespace → Deployment → Pods → Service with health colors."
      />
      {loading ? <LoadingBlock rows={6} /> : null}
      {err ? (
        <ErrorState
          title="Graph data unavailable"
          description={
            err instanceof ApiError
              ? err.message
              : "Unable to load cluster topology."
          }
        />
      ) : null}
      {!loading && !err ? (
        <InfraGraph
          clusterId={overview.data?.cluster ?? "kind-opspilot"}
          namespace={overview.data?.namespace ?? "opspilot"}
          deployments={deployments.data ?? []}
          pods={pods.data ?? []}
        />
      ) : null}
    </AppShell>
  );
}
