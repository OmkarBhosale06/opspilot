"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PodTable } from "@/components/infrastructure/pod-table";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";
import { listPods } from "@/services/pods";
import { useSse } from "@/hooks/use-sse";
import { ApiError } from "@/lib/api";

export default function PodsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pods"],
    queryFn: () => listPods(),
    refetchInterval: 15_000,
    retry: false,
  });

  useSse("/api/health/stream", {
    onEvent: (event) => {
      if (event.type.startsWith("k8s.pod")) {
        void qc.invalidateQueries({ queryKey: ["pods"] });
      }
    },
  });

  return (
    <AppShell title="Pods">
      <PageHeader
        title="Pods"
        description="What is running, ready, or restarting in the cluster?"
      />
      {isLoading ? <LoadingBlock /> : null}
      {isError ? (
        <ErrorState
          title="Pods unavailable"
          description={
            error instanceof ApiError
              ? error.message
              : "Start kind-opspilot and the API to load live workloads."
          }
        />
      ) : null}
      {data && data.length === 0 ? (
        <EmptyState
          title="No pods"
          description="The opspilot namespace has no pods, or Kubernetes is disconnected."
        />
      ) : null}
      {data && data.length > 0 ? <PodTable pods={data} /> : null}
    </AppShell>
  );
}
