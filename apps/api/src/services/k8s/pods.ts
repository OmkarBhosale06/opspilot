import type * as k8s from "@kubernetes/client-node";
import { requireK8s } from "./client.js";

export type ContainerStatusDto = {
  name: string;
  ready: boolean;
  restartCount: number;
  state: "running" | "waiting" | "terminated" | "unknown";
  reason: string | null;
  image?: string;
};

export type PodDto = {
  name: string;
  namespace: string;
  phase: string;
  node: string | null;
  labels: Record<string, string>;
  createdAt: string | null;
  containers: Array<{ name: string; image: string }>;
  containerStatuses: ContainerStatusDto[];
  ready: boolean;
  restarts: number;
};

function containerState(
  status: k8s.V1ContainerStatus
): Pick<ContainerStatusDto, "state" | "reason"> {
  if (status.state?.running) {
    return { state: "running", reason: null };
  }
  if (status.state?.waiting) {
    return {
      state: "waiting",
      reason: status.state.waiting.reason ?? null,
    };
  }
  if (status.state?.terminated) {
    return {
      state: "terminated",
      reason: status.state.terminated.reason ?? null,
    };
  }
  return { state: "unknown", reason: null };
}

export function normalizePod(pod: k8s.V1Pod): PodDto {
  const containerStatuses = (pod.status?.containerStatuses ?? []).map(
    (status) => {
      const { state, reason } = containerState(status);
      return {
        name: status.name,
        ready: Boolean(status.ready),
        restartCount: status.restartCount ?? 0,
        state,
        reason,
        image: status.image,
      };
    }
  );

  const restarts = containerStatuses.reduce(
    (sum, c) => sum + c.restartCount,
    0
  );
  const ready =
    containerStatuses.length > 0 && containerStatuses.every((c) => c.ready);

  return {
    name: pod.metadata?.name ?? "unknown",
    namespace: pod.metadata?.namespace ?? "default",
    phase: pod.status?.phase ?? "Unknown",
    node: pod.spec?.nodeName ?? null,
    labels: pod.metadata?.labels ?? {},
    createdAt: pod.metadata?.creationTimestamp
      ? new Date(pod.metadata.creationTimestamp).toISOString()
      : null,
    containers: (pod.spec?.containers ?? []).map((c) => ({
      name: c.name,
      image: c.image ?? "",
    })),
    containerStatuses,
    ready,
    restarts,
  };
}

export async function listPods(namespace: string): Promise<PodDto[]> {
  const { core } = requireK8s();
  const res = await core.listNamespacedPod({ namespace });
  return (res.items ?? []).map(normalizePod);
}

export async function getPod(
  name: string,
  namespace: string
): Promise<PodDto | null> {
  const { core } = requireK8s();
  try {
    const pod = await core.readNamespacedPod({ name, namespace });
    return normalizePod(pod);
  } catch (err: unknown) {
    const statusCode =
      err && typeof err === "object" && "statusCode" in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;
    if (statusCode === 404) return null;
    throw err;
  }
}
