import type * as k8s from "@kubernetes/client-node";
import { requireK8s } from "./client.js";

export type K8sEventDto = {
  type: string;
  reason: string;
  message: string;
  object: string;
  namespace: string;
  count: number;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
};

export function normalizeEvent(event: k8s.CoreV1Event): K8sEventDto {
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
    firstTimestamp: first ? new Date(first).toISOString() : null,
    lastTimestamp: last ? new Date(last).toISOString() : null,
  };
}

export async function listEvents(namespace: string): Promise<K8sEventDto[]> {
  const { core } = requireK8s();
  const res = await core.listNamespacedEvent({ namespace });
  return (res.items ?? [])
    .map(normalizeEvent)
    .sort((a, b) => {
      const ta = a.lastTimestamp ? Date.parse(a.lastTimestamp) : 0;
      const tb = b.lastTimestamp ? Date.parse(b.lastTimestamp) : 0;
      return tb - ta;
    });
}
