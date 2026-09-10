import type { Config } from "../config/env.js";
import type { KubernetesMonitorService } from "./kubernetes-monitor.js";
import type { PrometheusClient } from "../clients/prometheus/client.js";
import type { LokiClient } from "../clients/loki/client.js";
import { incidentStore } from "../repositories/incidents.js";

export type HealthReport = {
  status: "ok" | "degraded";
  cluster: string;
  k8sConnected: boolean;
  timestamp: string;
  dependencies: {
    kubernetes: boolean;
    prometheus: boolean;
    loki: boolean;
    postgres: boolean;
    redis: boolean;
  };
};

export async function getHealthReport(
  config: Config,
  k8s: KubernetesMonitorService,
  prometheus: PrometheusClient,
  loki: LokiClient,
  postgresOk: boolean,
  redisOk: boolean
): Promise<HealthReport> {
  const [prom, lokiOk, k8sConnected] = await Promise.all([
    prometheus.health(),
    loki.health(),
    k8s.probe(),
  ]);
  const status = k8sConnected ? "ok" : "degraded";
  return {
    status,
    cluster: config.CLUSTER_ID,
    k8sConnected,
    timestamp: new Date().toISOString(),
    dependencies: {
      kubernetes: k8sConnected,
      prometheus: prom,
      loki: lokiOk,
      postgres: postgresOk,
      redis: redisOk,
    },
  };
}

export async function getOverview(
  config: Config,
  k8s: KubernetesMonitorService
) {
  const incidents = incidentStore.listSummaries();
  const openIncidents = incidents.filter(
    (i) => i.status !== "resolved" && i.status !== "closed"
  );

  const k8sConnected = await k8s.probe();
  if (!k8sConnected) {
    return {
      cluster: config.CLUSTER_ID,
      namespace: config.NAMESPACE,
      k8sConnected: false,
      status: "degraded" as const,
      message:
        "Kubernetes unavailable — showing incident demo data only. Start kind-opspilot to enable live cluster metrics.",
      timestamp: new Date().toISOString(),
      pods: { total: 0, ready: 0, notReady: 0 },
      deployments: { total: 0, available: 0, unavailable: 0 },
      events: { warning: 0, normal: 0 },
      incidents: {
        open: openIncidents.length,
        total: incidents.length,
        highestSeverity: openIncidents[0]?.severity ?? null,
      },
    };
  }

  const ns = config.NAMESPACE;
  const [pods, deployments, events] = await Promise.all([
    k8s.listPods(ns),
    k8s.listDeployments(ns),
    k8s.listEvents(),
  ]);

  const readyPods = pods.filter((p) => p.ready).length;
  const availableDeps = deployments.filter(
    (d) => d.availableReplicas >= d.replicas && d.replicas > 0
  ).length;
  const warnings = events.filter((e) => e.type === "Warning").length;
  const clusterHealthy =
    readyPods === pods.length &&
    availableDeps === deployments.length &&
    openIncidents.length === 0;

  return {
    cluster: config.CLUSTER_ID,
    namespace: ns,
    k8sConnected: true,
    status: clusterHealthy
      ? ("healthy" as const)
      : openIncidents.length > 0
        ? ("incident" as const)
        : ("degraded" as const),
    timestamp: new Date().toISOString(),
    pods: {
      total: pods.length,
      ready: readyPods,
      notReady: pods.length - readyPods,
    },
    deployments: {
      total: deployments.length,
      available: availableDeps,
      unavailable: deployments.length - availableDeps,
    },
    events: {
      warning: warnings,
      normal: events.length - warnings,
    },
    incidents: {
      open: openIncidents.length,
      total: incidents.length,
      highestSeverity: openIncidents[0]?.severity ?? null,
    },
  };
}
