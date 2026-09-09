import type { FastifyPluginAsync } from "fastify";
import { config } from "../config.js";
import { isK8sConnected } from "../services/k8s/client.js";
import { openSseStream } from "./sse.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/health", async () => {
    const connected = isK8sConnected();
    return {
      status: connected ? "ok" : "degraded",
      cluster: config.CLUSTER_ID,
      k8sConnected: connected,
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/api/health/stream", async (request, reply) => {
    openSseStream(request, reply, {
      filter: (e) =>
        e.type.startsWith("k8s.") ||
        e.type === "heartbeat" ||
        e.type.startsWith("health."),
      initial: {
        type: "health.snapshot",
        clusterId: config.CLUSTER_ID,
        namespace: config.NAMESPACE,
        timestamp: new Date().toISOString(),
        status: isK8sConnected() ? "ok" : "degraded",
        message: isK8sConnected()
          ? "Connected to Kubernetes"
          : "Kubernetes not connected",
        data: { k8sConnected: isK8sConnected() },
      },
    });
  });
};
