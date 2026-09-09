"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DeploymentList } from "@/components/deployments/deployment-timeline";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";
import { listDeployments } from "@/services/deployments";
import { ApiError } from "@/lib/api";

export default function InfraDeploymentsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["deployments"],
    queryFn: () => listDeployments(),
    refetchInterval: 15_000,
    retry: false,
  });

  return (
    <AppShell title="Workloads">
      <PageHeader
        title="Deployments"
        description="Which workloads are healthy, and what image is running?"
      />
      {isLoading ? <LoadingBlock /> : null}
      {isError ? (
        <ErrorState
          title="Deployments unavailable"
          description={
            error instanceof ApiError
              ? error.message
              : "Connect Kubernetes to list live deployments."
          }
        />
      ) : null}
      {data && data.length === 0 ? (
        <EmptyState
          title="No deployments"
          description="Apply infrastructure/kubernetes/base/test-app.yaml to Kind."
        />
      ) : null}
      {data && data.length > 0 ? <DeploymentList deployments={data} /> : null}
    </AppShell>
  );
}
