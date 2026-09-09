"use client";

import { Suspense, use, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import {
  SnapshotTimeline,
} from "@/components/deployments/deployment-timeline";
import { SnapshotDetail } from "@/components/deployments/snapshot-detail";
import { ErrorState, LoadingBlock, EmptyState } from "@/components/ui/states";
import {
  getDeployment,
  getDeploymentSnapshots,
} from "@/services/deployments";
import { ApiError } from "@/lib/api";
import type { SnapshotDto } from "@/types";

const DEMO_SNAPSHOTS: SnapshotDto[] = [
  {
    name: "checkout-api-7d8f9c",
    revision: "43",
    replicas: 3,
    readyReplicas: 3,
    images: ["ghcr.io/opspilot/checkout-api:v43"],
    createdAt: "2026-09-09T13:58:00.000Z",
    owner: "checkout-api",
  },
  {
    name: "checkout-api-6c4a21",
    revision: "42",
    replicas: 3,
    readyReplicas: 3,
    images: ["ghcr.io/opspilot/checkout-api:v42"],
    createdAt: "2026-09-03T08:42:00.000Z",
    owner: "checkout-api",
  },
  {
    name: "checkout-api-5b1e90",
    revision: "41",
    replicas: 3,
    readyReplicas: 3,
    images: ["ghcr.io/opspilot/checkout-api:v41"],
    createdAt: "2026-09-01T11:20:00.000Z",
    owner: "checkout-api",
  },
];

export default function DeploymentDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  return (
    <Suspense fallback={<LoadingBlock rows={6} />}>
      <DeploymentDetail params={params} />
    </Suspense>
  );
}

function DeploymentDetail({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const decoded = decodeURIComponent(name);
  const search = useSearchParams();
  const selectedName = search.get("snapshot");

  const deployment = useQuery({
    queryKey: ["deployment", decoded],
    queryFn: () => getDeployment(decoded),
    retry: false,
  });

  const snapshotsQuery = useQuery({
    queryKey: ["snapshots", decoded],
    queryFn: () => getDeploymentSnapshots(decoded),
    retry: false,
  });

  const snapshots = useMemo(() => {
    if (snapshotsQuery.data && snapshotsQuery.data.length > 0) {
      return snapshotsQuery.data;
    }
    if (decoded === "checkout-api") return DEMO_SNAPSHOTS;
    return snapshotsQuery.data ?? [];
  }, [decoded, snapshotsQuery.data]);

  const selected =
    snapshots.find((s) => s.name === selectedName) ?? snapshots[0] ?? null;

  const usingDemo =
    (!snapshotsQuery.data || snapshotsQuery.data.length === 0) &&
    decoded === "checkout-api";

  return (
    <AppShell
      title={decoded}
      breadcrumb={
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/deployments" className="hover:text-foreground">
            Deployments
          </Link>
          <span>/</span>
          <span className="mono text-foreground">{decoded}</span>
        </nav>
      }
    >
      {deployment.isLoading && snapshotsQuery.isLoading ? (
        <LoadingBlock rows={6} />
      ) : null}

      {deployment.isError && !usingDemo ? (
        <ErrorState
          title="Deployment not found on cluster"
          description={
            deployment.error instanceof ApiError
              ? deployment.error.message
              : "Kubernetes disconnected."
          }
        />
      ) : null}

      {usingDemo ? (
        <p className="mb-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          ReplicaSet history for checkout-api, including the INC-1042 window.
          Live objects replace this seed when Kind is connected.
        </p>
      ) : null}

      {snapshots.length === 0 && !snapshotsQuery.isLoading ? (
        <EmptyState
          title="No snapshots"
          description="ReplicaSet history will appear after rollouts."
        />
      ) : null}

      {snapshots.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SnapshotTimeline name={decoded} snapshots={snapshots} />
          {selected ? (
            <SnapshotDetail
              snapshot={selected}
              serviceHealth={
                selected.revision === "43" && decoded.includes("checkout")
                  ? "degraded"
                  : selected.revision === "42" && decoded.includes("checkout")
                    ? "healthy"
                    : "unknown"
              }
            />
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
