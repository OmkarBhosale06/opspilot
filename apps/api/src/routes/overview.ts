import type { FastifyPluginAsync } from "fastify";
import { config } from "../config.js";
import { isK8sConnected } from "../services/k8s/client.js";
import { listPods } from "../services/k8s/pods.js";
import { listDeployments } from "../services/k8s/deployments.js";
import { listEvents } from "../services/k8s/events.js";
import { incidentStore } from "../services/incidents/store.js";

export const overviewRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/overview", async (_request, reply) => {
    const connected = isK8sConnected();
    const incidents = incidentStore.listSummaries();
    const openIncidents = incidents.filter(
      (i) => i.status !== "resolved" && i.status !== "closed"
    );

    if (!connected) {
      return {
        cluster: config.CLUSTER_ID,
        namespace: config.NAMESPACE,
        k8sConnected: false,
        status: "degraded",
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

    try {
      const ns = config.NAMESPACE;
      const [pods, deployments, events] = await Promise.all([
        listPods(ns),
        listDeployments(ns),
        listEvents(ns),
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
          ? "healthy"
          : openIncidents.length > 0
            ? "incident"
            : "degraded",
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Overview failed";
      return reply.status(503).send({
        error: "kubernetes_unavailable",
        message,
        hint: "Start the kind-opspilot cluster and ensure kubeconfig points at it.",
      });
    }
  });
};
