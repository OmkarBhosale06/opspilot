import * as k8s from "@kubernetes/client-node";
import { config } from "../../config.js";
import { eventBus } from "../../events/bus.js";
import { getK8sClients } from "./client.js";
import { normalizePod } from "./pods.js";
import { normalizeDeployment } from "./deployments.js";
import { normalizeEvent } from "./events.js";

function now(): string {
  return new Date().toISOString();
}

/**
 * Watch pods/deployments/events and publish to the event bus.
 * If K8s is not connected, skip silently.
 */
export async function startWatchers(): Promise<void> {
  const clients = getK8sClients();
  if (!clients.connected || !clients.kc) {
    console.warn("[watch] K8s not connected — skipping resource watches");
    return;
  }

  const namespace = config.NAMESPACE;
  const clusterId = config.CLUSTER_ID;
  const watch = new k8s.Watch(clients.kc);

  const startPodWatch = async () => {
    try {
      await watch.watch(
        `/api/v1/namespaces/${namespace}/pods`,
        {},
        (phase, obj) => {
          const pod = normalizePod(obj as k8s.V1Pod);
          eventBus.publish({
            type: `k8s.pod.${String(phase).toLowerCase()}`,
            clusterId,
            namespace: pod.namespace,
            timestamp: now(),
            message: `Pod ${pod.name} ${phase}`,
            status: pod.phase,
            data: pod,
          });
        },
        (err) => {
          if (err) console.warn("[watch] pod watch ended:", err.message ?? err);
          setTimeout(() => void startPodWatch(), 5000);
        }
      );
    } catch (err) {
      console.warn("[watch] failed to start pod watch:", err);
    }
  };

  const startDeploymentWatch = async () => {
    try {
      await watch.watch(
        `/apis/apps/v1/namespaces/${namespace}/deployments`,
        {},
        (phase, obj) => {
          const dep = normalizeDeployment(obj as k8s.V1Deployment);
          eventBus.publish({
            type: `k8s.deployment.${String(phase).toLowerCase()}`,
            clusterId,
            namespace: dep.namespace,
            timestamp: now(),
            message: `Deployment ${dep.name} ${phase}`,
            data: dep,
          });
        },
        (err) => {
          if (err)
            console.warn(
              "[watch] deployment watch ended:",
              err.message ?? err
            );
          setTimeout(() => void startDeploymentWatch(), 5000);
        }
      );
    } catch (err) {
      console.warn("[watch] failed to start deployment watch:", err);
    }
  };

  const startEventWatch = async () => {
    try {
      await watch.watch(
        `/api/v1/namespaces/${namespace}/events`,
        {},
        (phase, obj) => {
          const ev = normalizeEvent(obj as k8s.CoreV1Event);
          eventBus.publish({
            type: `k8s.event.${String(phase).toLowerCase()}`,
            clusterId,
            namespace: ev.namespace,
            timestamp: now(),
            message: ev.message,
            status: ev.type,
            data: ev,
          });
        },
        (err) => {
          if (err)
            console.warn("[watch] event watch ended:", err.message ?? err);
          setTimeout(() => void startEventWatch(), 5000);
        }
      );
    } catch (err) {
      console.warn("[watch] failed to start event watch:", err);
    }
  };

  void startPodWatch();
  void startDeploymentWatch();
  void startEventWatch();
  console.log(`[watch] watching pods/deployments/events in ${namespace}`);
}
