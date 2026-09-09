"use client";

import { Suspense, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SnapshotTimeline } from "@/components/deployments/deployment-timeline";
import { SnapshotDetail } from "@/components/deployments/snapshot-detail";
import { Badge } from "@/components/ui/badge";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
} from "@/components/ui/states";
import {
  getDeployment,
  getDeploymentSnapshots,
} from "@/services/deployments";
import { ApiError } from "@/lib/api";

function DeploymentDetailInner() {
  const params = useParams<{ name: string }>();
  const search = useSearchParams();
  const name = decodeURIComponent(params.name);
  const selectedSnap = search.get("snapshot");

  const deployment = useQuery({
    queryKey: ["deployment", name],
    queryFn: () => getDeployment(name),
    enabled: Boolean(name),
  });
  const snapshots = useQuery({
    queryKey: ["deployment-snapshots", name],
    queryFn: () => getDeploymentSnapshots(name),
    enabled: Boolean(name),
  });

  const loading = deployment.isLoading || snapshots.isLoading;
  const err = deployment.error || snapshots.error;

  const activeSnapshot = useMemo(() => {
    const list = snapshots.data ?? [];
    if (!list.length) return null;
    if (selectedSnap) {
      return list.find((s) => s.name === selectedSnap) ?? list[0];
    }
    return list[0];
  }, [snapshots.data, selectedSnap]);

  return (
    <AppShell
      title={name}
      breadcrumb={
        <span>
          Deployments / <span className="mono text-foreground">{name}</span>
        </span>
      }
    >
      <PageHeader
        title={name}
        description="ReplicaSet-derived snapshot history for known-good rollback context."
        actions={
          deployment.data ? (
            <Badge
              variant={
                deployment.data.readyReplicas >= deployment.data.replicas
                  ? "healthy"
                  : "warning"
              }
            >
              {deployment.data.readyReplicas}/{deployment.data.replicas} ready
            </Badge>
          ) : null
        }
      />

      {loading ? <LoadingBlock rows={6} /> : null}
      {err ? (
        <ErrorState
          title="Snapshot history unavailable"
          description={
            err instanceof ApiError
              ? err.message
              : "Unable to load deployment snapshots."
          }
        />
      ) : null}

      {!loading && !err ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          {(snapshots.data ?? []).length === 0 ? (
            <EmptyState
              title="No snapshots"
              description="ReplicaSet history will appear here as revisions roll out."
            />
          ) : (
            <SnapshotTimeline name={name} snapshots={snapshots.data ?? []} />
          )}
          {activeSnapshot ? (
            <SnapshotDetail snapshot={activeSnapshot} />
          ) : (
            <EmptyState
              title="Select a snapshot"
              description="Choose a revision to inspect images and readiness."
            />
          )}
        </div>
      ) : null}
    </AppShell>
  );
}

export default function DeploymentDetailPage() {
  return (
    <Suspense fallback={<LoadingBlock rows={6} />}>
      <DeploymentDetailInner />
    </Suspense>
  );
}
