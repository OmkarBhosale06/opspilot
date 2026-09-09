"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DeploymentTable } from "@/components/infrastructure/pod-table";
import { ErrorState, LoadingBlock } from "@/components/ui/states";
import { listDeployments } from "@/services/deployments";
import { ApiError } from "@/lib/api";

export default function InfraDeploymentsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["deployments"],
    queryFn: () => listDeployments(),
    refetchInterval: 15_000,
  });

  return (
    <AppShell
      title="Deployments"
      breadcrumb={<span>Infrastructure / Deployments</span>}
    >
      <PageHeader
        title="Deployments"
        description="Replica readiness and image posture for the default namespace."
      />
      {isLoading ? <LoadingBlock rows={6} /> : null}
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
      {data ? <DeploymentTable deployments={data} /> : null}
    </AppShell>
  );
}
