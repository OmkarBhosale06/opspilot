import type { FastifyBaseLogger } from "fastify";
import type { Config } from "../config/env.js";
import type { EventBus } from "../events/bus.js";
import { createFnLog } from "../logging.js";
import { incidentStore } from "../repositories/incidents.js";
import type { PodDto } from "../types/dto.js";
import type { OpsPilotEvent } from "../types/events.js";

const BAD_REASONS = new Set([
  "CrashLoopBackOff",
  "ImagePullBackOff",
  "ErrImagePull",
  "Error",
  "OOMKilled",
  "CreateContainerError",
]);

function serviceFromPod(pod: PodDto): string {
  return (
    pod.labels.app ||
    pod.labels["app.kubernetes.io/name"] ||
    pod.name.replace(/-[a-z0-9]{5,10}-[a-z0-9]{5}$/i, "")
  );
}

function scenarioFromPod(pod: PodDto): string | null {
  const reason = pod.containerStatuses.find((c) => c.reason)?.reason;
  if (reason && BAD_REASONS.has(reason)) {
    if (reason === "ImagePullBackOff" || reason === "ErrImagePull") {
      return "imagepull";
    }
    if (reason === "CrashLoopBackOff" || reason === "Error") {
      return "crashloop";
    }
    return reason.toLowerCase();
  }
  if (!pod.ready && pod.phase === "Failed") return "failed";
  if (!pod.ready && pod.restarts >= 3) return "crashloop";
  return null;
}

export function startIncidentDetector(
  bus: EventBus,
  config: Config,
  log: FastifyBaseLogger
): () => void {
  const flog = createFnLog(log);
  flog.info(
    "startIncidentDetector",
    "Watching Kubernetes pod events for new incidents"
  );

  return bus.subscribe((event: OpsPilotEvent) => {
    if (event.type !== "k8s.pod.added" && event.type !== "k8s.pod.modified") {
      return;
    }
    const pod = event.data as PodDto;
    const scenario = scenarioFromPod(pod);
    if (!scenario) return;

    const service = serviceFromPod(pod);
    const existing = incidentStore.findOpenByService(pod.namespace, service);
    if (existing) return;

    const incident = incidentStore.create({
      title: `${service} ${scenario}`,
      summary: `Pod ${pod.name} is unhealthy (${scenario}, phase=${pod.phase}, restarts=${pod.restarts}).`,
      severity: scenario === "crashloop" || scenario === "imagepull" ? "SEV2" : "SEV3",
      service,
      namespace: pod.namespace,
      clusterId: config.CLUSTER_ID,
      scenario,
      affectedReplicas: 1,
      source: "k8s-detector",
    });

    flog.info("startIncidentDetector", "Opened incident from Kubernetes", {
      incidentId: incident.id,
      pod: pod.name,
      scenario,
    });

    bus.publish({
      type: "incident.created",
      incidentId: incident.id,
      clusterId: config.CLUSTER_ID,
      namespace: pod.namespace,
      timestamp: incident.startedAt,
      message: incident.title,
    });
  });
}
