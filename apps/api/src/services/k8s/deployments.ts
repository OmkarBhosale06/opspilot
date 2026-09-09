import type * as k8s from "@kubernetes/client-node";
import { requireK8s } from "./client.js";

export type DeploymentDto = {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  availableReplicas: number;
  updatedReplicas: number;
  labels: Record<string, string>;
  images: string[];
  createdAt: string | null;
  strategy: string | null;
  conditions: Array<{
    type: string;
    status: string;
    reason: string | null;
    message: string | null;
  }>;
};

export type SnapshotDto = {
  name: string;
  revision: string | null;
  replicas: number;
  readyReplicas: number;
  images: string[];
  createdAt: string | null;
  owner: string | null;
};

export function normalizeDeployment(dep: k8s.V1Deployment): DeploymentDto {
  const containers = dep.spec?.template?.spec?.containers ?? [];
  return {
    name: dep.metadata?.name ?? "unknown",
    namespace: dep.metadata?.namespace ?? "default",
    replicas: dep.spec?.replicas ?? 0,
    readyReplicas: dep.status?.readyReplicas ?? 0,
    availableReplicas: dep.status?.availableReplicas ?? 0,
    updatedReplicas: dep.status?.updatedReplicas ?? 0,
    labels: dep.metadata?.labels ?? {},
    images: containers.map((c) => c.image ?? ""),
    createdAt: dep.metadata?.creationTimestamp
      ? new Date(dep.metadata.creationTimestamp).toISOString()
      : null,
    strategy: dep.spec?.strategy?.type ?? null,
    conditions: (dep.status?.conditions ?? []).map((c) => ({
      type: c.type ?? "",
      status: c.status ?? "",
      reason: c.reason ?? null,
      message: c.message ?? null,
    })),
  };
}

export function normalizeReplicaSet(rs: k8s.V1ReplicaSet): SnapshotDto {
  const containers = rs.spec?.template?.spec?.containers ?? [];
  const ownerRefs = rs.metadata?.ownerReferences ?? [];
  const owner =
    ownerRefs.find((o) => o.kind === "Deployment")?.name ??
    ownerRefs[0]?.name ??
    null;

  return {
    name: rs.metadata?.name ?? "unknown",
    revision: rs.metadata?.annotations?.["deployment.kubernetes.io/revision"] ?? null,
    replicas: rs.spec?.replicas ?? 0,
    readyReplicas: rs.status?.readyReplicas ?? 0,
    images: containers.map((c) => c.image ?? ""),
    createdAt: rs.metadata?.creationTimestamp
      ? new Date(rs.metadata.creationTimestamp).toISOString()
      : null,
    owner,
  };
}

export async function listDeployments(
  namespace: string
): Promise<DeploymentDto[]> {
  const { apps } = requireK8s();
  const res = await apps.listNamespacedDeployment({ namespace });
  return (res.items ?? []).map(normalizeDeployment);
}

export async function getDeployment(
  name: string,
  namespace: string
): Promise<DeploymentDto | null> {
  const { apps } = requireK8s();
  try {
    const dep = await apps.readNamespacedDeployment({ name, namespace });
    return normalizeDeployment(dep);
  } catch (err: unknown) {
    const statusCode =
      err && typeof err === "object" && "statusCode" in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;
    if (statusCode === 404) return null;
    throw err;
  }
}

/** Derive deployment history snapshots from owned ReplicaSets. */
export async function getDeploymentSnapshots(
  name: string,
  namespace: string
): Promise<SnapshotDto[]> {
  const { apps } = requireK8s();
  const res = await apps.listNamespacedReplicaSet({ namespace });
  const snapshots = (res.items ?? [])
    .filter((rs) =>
      (rs.metadata?.ownerReferences ?? []).some(
        (o) => o.kind === "Deployment" && o.name === name
      )
    )
    .map(normalizeReplicaSet)
    .sort((a, b) => {
      const ra = Number(a.revision ?? 0);
      const rb = Number(b.revision ?? 0);
      return rb - ra;
    });
  return snapshots;
}
