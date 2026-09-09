"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PodTable } from "@/components/infrastructure/pod-table";
import { ErrorState, LoadingBlock } from "@/components/ui/states";
import { listPods } from "@/services/pods";
import { ApiError } from "@/lib/api";

export default function PodsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pods"],
    queryFn: () => listPods(),
    refetchInterval: 10_000,
  });

  return (
    <AppShell
      title="Pods"
      breadcrumb={<span>Infrastructure / Pods</span>}
    >
      <PageHeader
        title="Pods"
        description="Live workload health from the Kubernetes API."
      />
      {isLoading ? <LoadingBlock rows={8} /> : null}
      {isError ? (
        <ErrorState
          title="Pods unavailable"
          description={
            error instanceof ApiError
              ? error.message
              : "Unable to reach the control plane."
          }
        />
      ) : null}
      {data ? <PodTable pods={data} /> : null}
    </AppShell>
  );
}
