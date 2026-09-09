import type { FastifyPluginAsync } from "fastify";
import { config } from "../config.js";
import { isK8sConnected } from "../services/k8s/client.js";
import { openSseStream } from "./sse.js";

export const streamRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/incidents/stream", async (request, reply) => {
    openSseStream(request, reply, {
      filter: (e) =>
        Boolean(e.incidentId) ||
        e.type.startsWith("incident.") ||
        e.type === "heartbeat",
      initial: {
        type: "incident.stream.connected",
        clusterId: config.CLUSTER_ID,
        namespace: config.NAMESPACE,
        timestamp: new Date().toISOString(),
        message: "Subscribed to incident stream",
      },
    });
  });

  app.get("/api/agent/stream", async (request, reply) => {
    openSseStream(request, reply, {
      filter: (e) =>
        e.type.startsWith("agent.") ||
        e.type === "heartbeat" ||
        e.step !== undefined,
      initial: {
        type: "agent.stream.connected",
        clusterId: config.CLUSTER_ID,
        namespace: config.NAMESPACE,
        timestamp: new Date().toISOString(),
        message: "Subscribed to agent investigation stream",
        data: { k8sConnected: isK8sConnected() },
      },
    });
  });
};
