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
    retry: false,
  });

  return (
    <AppShell title="Deployment history">
      <PageHeader
        title="Deployment history"
        description="What changed, and which revision was last verified healthy?"
      />
      {isLoading ? <LoadingBlock /> : null}
      {isError ? (
        <ErrorState
          title="Live deployments unavailable"
          description={
            error instanceof ApiError
              ? `${error.message} Open INC-1042 related checkout-api snapshots when Kubernetes is back.`
              : "Kubernetes disconnected."
          }
        />
      ) : null}
      {data && data.length === 0 ? (
        <EmptyState
          title="No deployment history"
          description="ReplicaSet revisions will appear here once a workload is applied."
        />
      ) : null}
      {data && data.length > 0 ? <DeploymentList deployments={data} /> : null}
    </AppShell>
  );
}
