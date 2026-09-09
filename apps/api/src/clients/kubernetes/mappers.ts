import type * as k8s from "@kubernetes/client-node";
import type {
  ContainerStatusDto,
  DeploymentDto,
  K8sEventDto,
  NamespaceDto,
  PodDto,
  ServiceDto,
  SnapshotDto,
} from "../../types/dto.js";

function iso(value: unknown): string | null {
  if (!value) return null;
  try {
    return new Date(value as string | number | Date).toISOString();
  } catch {
    return null;
  }
}

function containerState(
  status: k8s.V1ContainerStatus
): Pick<ContainerStatusDto, "state" | "reason"> {
  if (status.state?.running) return { state: "running", reason: null };
  if (status.state?.waiting) {
    return { state: "waiting", reason: status.state.waiting.reason ?? null };
  }
  if (status.state?.terminated) {
    return {
      state: "terminated",
      reason: status.state.terminated.reason ?? null,
    };
  }
  return { state: "unknown", reason: null };
}

export function toPodDto(pod: k8s.V1Pod): PodDto {
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
  const restarts = containerStatuses.reduce((sum, c) => sum + c.restartCount, 0);
  const ready =
    containerStatuses.length > 0 && containerStatuses.every((c) => c.ready);

  return {
    name: pod.metadata?.name ?? "unknown",
    namespace: pod.metadata?.namespace ?? "default",
    phase: pod.status?.phase ?? "Unknown",
    node: pod.spec?.nodeName ?? null,
    labels: pod.metadata?.labels ?? {},
    createdAt: iso(pod.metadata?.creationTimestamp),
    containers: (pod.spec?.containers ?? []).map((c) => ({
      name: c.name,
      image: c.image ?? "",
    })),
    containerStatuses,
    ready,
    restarts,
  };
}

export function toDeploymentDto(dep: k8s.V1Deployment): DeploymentDto {
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
    createdAt: iso(dep.metadata?.creationTimestamp),
    strategy: dep.spec?.strategy?.type ?? null,
    conditions: (dep.status?.conditions ?? []).map((c) => ({
      type: c.type ?? "",
      status: c.status ?? "",
      reason: c.reason ?? null,
      message: c.message ?? null,
    })),
  };
}

export function toSnapshotDto(rs: k8s.V1ReplicaSet): SnapshotDto {
  const containers = rs.spec?.template?.spec?.containers ?? [];
  const ownerRefs = rs.metadata?.ownerReferences ?? [];
  const owner =
    ownerRefs.find((o) => o.kind === "Deployment")?.name ??
    ownerRefs[0]?.name ??
    null;

  return {
    name: rs.metadata?.name ?? "unknown",
    revision:
      rs.metadata?.annotations?.["deployment.kubernetes.io/revision"] ?? null,
    replicas: rs.spec?.replicas ?? 0,
    readyReplicas: rs.status?.readyReplicas ?? 0,
    images: containers.map((c) => c.image ?? ""),
    createdAt: iso(rs.metadata?.creationTimestamp),
    owner,
  };
}

export function toServiceDto(svc: k8s.V1Service): ServiceDto {
  return {
    name: svc.metadata?.name ?? "unknown",
    namespace: svc.metadata?.namespace ?? "default",
    type: svc.spec?.type ?? "ClusterIP",
    clusterIP: svc.spec?.clusterIP ?? null,
    ports: (svc.spec?.ports ?? []).map((p) => ({
      port: p.port,
      targetPort: String(p.targetPort ?? p.port),
      protocol: p.protocol ?? "TCP",
    })),
    selector: svc.spec?.selector ?? {},
    createdAt: iso(svc.metadata?.creationTimestamp),
  };
}

export function toNamespaceDto(ns: k8s.V1Namespace): NamespaceDto {
  return {
    name: ns.metadata?.name ?? "unknown",
    status: ns.status?.phase ?? "Unknown",
    labels: ns.metadata?.labels ?? {},
    createdAt: iso(ns.metadata?.creationTimestamp),
  };
}

export function toEventDto(event: k8s.CoreV1Event): K8sEventDto {
  const involved = event.involvedObject;
  const object =
    involved?.kind && involved?.name
      ? `${involved.kind}/${involved.name}`
      : "unknown";
  const last =
    event.lastTimestamp ??
    event.eventTime ??
    event.metadata?.creationTimestamp ??
    null;
  const first = event.firstTimestamp ?? last;

  return {
    type: event.type ?? "Normal",
    reason: event.reason ?? "",
    message: event.message ?? "",
    object,
    namespace: event.metadata?.namespace ?? involved?.namespace ?? "default",
    count: event.count ?? 1,
    firstTimestamp: iso(first),
    lastTimestamp: iso(last),
  };
}

export function watchPhaseToVerb(
  phase: string
): "added" | "modified" | "deleted" {
  const p = phase.toLowerCase();
  if (p === "added" || p === "deleted" || p === "modified") return p;
  return "modified";
}
