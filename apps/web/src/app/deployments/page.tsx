"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DeploymentList } from "@/components/deployments/deployment-timeline";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";
import { listDeployments } from "@/services/deployments";
import { ApiError } from "@/lib/api";

export default function DeploymentsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["deployments"],
    queryFn: () => listDeployments(),
    refetchInterval: 20_000,
  });

  return (
    <AppShell
      title="Deployments"
      breadcrumb={<span>Delivery / Timeline</span>}
    >
      <PageHeader
        title="Deployment timeline"
        description="Current rollout posture — open a deployment for ReplicaSet snapshots."
      />
      {isLoading ? <LoadingBlock rows={5} /> : null}
      {isError ? (
        <ErrorState
          title="Deployments unavailable"
          description={
            error instanceof ApiError
              ? error.message
              : "Unable to reach the control plane."
          }
        />
      ) : null}
      {data && data.length === 0 ? (
        <EmptyState
          title="No deployments"
          description="Deployment history appears when the cluster is connected."
        />
      ) : null}
      {data && data.length > 0 ? <DeploymentList deployments={data} /> : null}
    </AppShell>
  );
}
