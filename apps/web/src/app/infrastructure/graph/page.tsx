"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { InfraGraph } from "@/components/infrastructure/infra-graph";
import { ErrorState, LoadingBlock, EmptyState } from "@/components/ui/states";
import { listDeployments } from "@/services/deployments";
import { listPods } from "@/services/pods";
import { listNamespaces } from "@/services/namespaces";
import { getHealth } from "@/services/health";
import { ApiError } from "@/lib/api";

export default function GraphPage() {
  const health = useQuery({ queryKey: ["health"], queryFn: getHealth });
  const namespaces = useQuery({
    queryKey: ["namespaces"],
    queryFn: listNamespaces,
    retry: false,
  });
  const deployments = useQuery({
    queryKey: ["deployments"],
    queryFn: () => listDeployments(),
    retry: false,
  });
  const pods = useQuery({
    queryKey: ["pods"],
    queryFn: () => listPods(),
    retry: false,
  });

  const loading =
    deployments.isLoading || pods.isLoading || namespaces.isLoading;
  const error = deployments.error ?? pods.error ?? namespaces.error;

  return (
    <AppShell title="Infrastructure graph">
      <PageHeader
        title="Infrastructure graph"
        description="Cluster → namespace → deployment → pods, colored by health."
      />
      {loading ? <LoadingBlock /> : null}
      {!loading && error ? (
        <ErrorState
          title="Graph data unavailable"
          description={
            error instanceof ApiError
              ? error.message
              : "Connect Kind so the graph can be built from live objects."
          }
        />
      ) : null}
      {!loading &&
      !error &&
      (deployments.data?.length ?? 0) === 0 &&
      (pods.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="Nothing to graph"
          description="No deployments or pods in the default namespace."
        />
      ) : null}
      {!loading &&
      !error &&
      ((deployments.data?.length ?? 0) > 0 || (pods.data?.length ?? 0) > 0) ? (
        <InfraGraph
          clusterId={health.data?.cluster ?? "kind-opspilot"}
          namespaces={namespaces.data ?? [{ name: "opspilot" }]}
          deployments={deployments.data ?? []}
          pods={pods.data ?? []}
        />
      ) : null}
    </AppShell>
  );
}
