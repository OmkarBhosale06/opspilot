import type { FastifyInstance } from "fastify";
import type { Config } from "../config/env.js";
import type { KubernetesClient } from "../clients/kubernetes/client.js";
import type { KubernetesMonitorService } from "../services/kubernetes-monitor.js";
import type { EventBus } from "../events/bus.js";
import { sendDomainError, namespaceFromQuery } from "../middleware/errors.js";
import { getHealthReport, getOverview } from "../services/health-service.js";
import { incidentStore } from "../repositories/incidents.js";
import { openSseStream } from "../events/sse.js";
import type { PrometheusClient } from "../clients/prometheus/client.js";
import type { LokiClient } from "../clients/loki/client.js";
import type { PostgresClient, RedisClient } from "../clients/data-stores.js";

export type AppContext = {
  config: Config;
  k8sClient: KubernetesClient;
  k8s: KubernetesMonitorService;
  bus: EventBus;
  prometheus: PrometheusClient;
  loki: LokiClient;
  postgres: PostgresClient;
  redis: RedisClient;
};

export function registerControllers(app: FastifyInstance, ctx: AppContext) {
  app.get("/api/health", async () => {
    return getHealthReport(
      ctx.config,
      ctx.k8s,
      ctx.prometheus,
      ctx.loki,
      await ctx.postgres.health(),
      await ctx.redis.health()
    );
  });

  app.get("/api/overview", async (_request, reply) => {
    try {
      return await getOverview(ctx.config, ctx.k8s);
    } catch (err) {
      return sendDomainError(reply, err, ctx.k8sClient);
    }
  });

  app.get("/api/clusters", async () => {
    return { items: ctx.k8s.listClusters(), count: 1 };
  });

  app.get("/api/namespaces", async (_request, reply) => {
    try {
      const items = await ctx.k8s.listNamespaces();
      return { items, count: items.length };
    } catch (err) {
      return sendDomainError(reply, err, ctx.k8sClient);
    }
  });

  app.get<{ Querystring: { namespace?: string } }>(
    "/api/pods",
    async (request, reply) => {
      try {
        const namespace = namespaceFromQuery(request.query, ctx.config.NAMESPACE);
        const items = await ctx.k8s.listPods(namespace);
        return { namespace, items, count: items.length };
      } catch (err) {
        return sendDomainError(reply, err, ctx.k8sClient);
      }
    }
  );

  app.get<{
    Params: { name: string };
    Querystring: { namespace?: string };
  }>("/api/pods/:name", async (request, reply) => {
    try {
      const namespace = namespaceFromQuery(request.query, ctx.config.NAMESPACE);
      return await ctx.k8s.getPod(request.params.name, namespace);
    } catch (err) {
      return sendDomainError(reply, err, ctx.k8sClient);
    }
  });

  app.get<{
    Params: { name: string };
    Querystring: { namespace?: string; container?: string; tailLines?: string };
  }>("/api/pods/:name/logs", async (request, reply) => {
    try {
      const namespace = namespaceFromQuery(request.query, ctx.config.NAMESPACE);
      const tailLines = request.query.tailLines
        ? Number(request.query.tailLines)
        : 200;
      return await ctx.k8s.getPodLogs(request.params.name, namespace, {
        container: request.query.container,
        tailLines: Number.isFinite(tailLines) ? tailLines : 200,
      });
    } catch (err) {
      return sendDomainError(reply, err, ctx.k8sClient);
    }
  });

  app.get<{ Querystring: { namespace?: string } }>(
    "/api/deployments",
    async (request, reply) => {
      try {
        const namespace = namespaceFromQuery(request.query, ctx.config.NAMESPACE);
        const items = await ctx.k8s.listDeployments(namespace);
        return { namespace, items, count: items.length };
      } catch (err) {
        return sendDomainError(reply, err, ctx.k8sClient);
      }
    }
  );

  app.get<{
    Params: { name: string };
    Querystring: { namespace?: string };
  }>("/api/deployments/:name", async (request, reply) => {
    try {
      const namespace = namespaceFromQuery(request.query, ctx.config.NAMESPACE);
      return await ctx.k8s.getDeployment(request.params.name, namespace);
    } catch (err) {
      return sendDomainError(reply, err, ctx.k8sClient);
    }
  });

  app.get<{
    Params: { name: string };
    Querystring: { namespace?: string };
  }>("/api/deployments/:name/snapshots", async (request, reply) => {
    try {
      const namespace = namespaceFromQuery(request.query, ctx.config.NAMESPACE);
      const items = await ctx.k8s.listSnapshots(request.params.name, namespace);
      return {
        deployment: request.params.name,
        namespace,
        items,
        count: items.length,
      };
    } catch (err) {
      return sendDomainError(reply, err, ctx.k8sClient);
    }
  });

  app.get<{ Querystring: { namespace?: string } }>(
    "/api/services",
    async (request, reply) => {
      try {
        const namespace = namespaceFromQuery(request.query, ctx.config.NAMESPACE);
        const items = await ctx.k8s.listServices(namespace);
        return { namespace, items, count: items.length };
      } catch (err) {
        return sendDomainError(reply, err, ctx.k8sClient);
      }
    }
  );

  app.get<{ Querystring: { namespace?: string } }>(
    "/api/events",
    async (request, reply) => {
      try {
        const namespace = request.query.namespace?.trim();
        const items = await ctx.k8s.listEvents(namespace || undefined);
        return { namespace: namespace || "all", items, count: items.length };
      } catch (err) {
        return sendDomainError(reply, err, ctx.k8sClient);
      }
    }
  );

  app.get("/api/incidents", async () => {
    return {
      items: incidentStore.listSummaries(),
      count: incidentStore.list().length,
    };
  });

  app.get<{ Params: { id: string } }>(
    "/api/incidents/:id",
    async (request, reply) => {
      const incident = incidentStore.get(request.params.id);
      if (!incident) {
        return reply.status(404).send({
          error: "not_found",
          message: `Incident ${request.params.id} not found`,
        });
      }
      return incident;
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/incidents/:id/timeline",
    async (request, reply) => {
      const incident = incidentStore.get(request.params.id);
      if (!incident) {
        return reply.status(404).send({
          error: "not_found",
          message: `Incident ${request.params.id} not found`,
        });
      }
      return {
        incidentId: incident.id,
        items: incident.timeline,
        count: incident.timeline.length,
      };
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/incidents/:id/evidence",
    async (request, reply) => {
      const incident = incidentStore.get(request.params.id);
      if (!incident) {
        return reply.status(404).send({
          error: "not_found",
          message: `Incident ${request.params.id} not found`,
        });
      }
      return {
        incidentId: incident.id,
        items: incident.evidence,
        count: incident.evidence.length,
        rootCause: incident.rootCause,
      };
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/incidents/:id/investigation",
    async (request, reply) => {
      const incident = incidentStore.get(request.params.id);
      if (!incident) {
        return reply.status(404).send({
          error: "not_found",
          message: `Incident ${request.params.id} not found`,
        });
      }
      return {
        incidentId: incident.id,
        items: incident.investigation,
        count: incident.investigation.length,
        remediation: incident.remediation,
        policy: incident.policy,
        verification: incident.verification,
      };
    }
  );

  app.get("/api/health/stream", async (request, reply) => {
    openSseStream(request, reply, ctx.bus, ctx.config, {
      filter: (e) =>
        e.type.startsWith("k8s.") ||
        e.type === "heartbeat" ||
        e.type.startsWith("health."),
      initial: {
        type: "health.snapshot",
        clusterId: ctx.config.CLUSTER_ID,
        namespace: ctx.config.NAMESPACE,
        timestamp: new Date().toISOString(),
        message: ctx.k8s.connected
          ? "Connected to Kubernetes"
          : "Kubernetes not connected",
        status: ctx.k8s.connected ? "ok" : "degraded",
        data: { k8sConnected: ctx.k8s.connected },
      },
    });
  });

  app.get("/api/incidents/stream", async (request, reply) => {
    openSseStream(request, reply, ctx.bus, ctx.config, {
      filter: (e) =>
        Boolean(e.incidentId) ||
        e.type.startsWith("incident.") ||
        e.type === "heartbeat",
      initial: {
        type: "incident.stream.connected",
        clusterId: ctx.config.CLUSTER_ID,
        namespace: ctx.config.NAMESPACE,
        timestamp: new Date().toISOString(),
        message: "Subscribed to incident stream",
      },
    });
  });

  app.get("/api/agent/stream", async (request, reply) => {
    openSseStream(request, reply, ctx.bus, ctx.config, {
      filter: (e) =>
        e.type.startsWith("agent.") ||
        e.type === "heartbeat" ||
        ("step" in e && e.step !== undefined),
      initial: {
        type: "agent.stream.connected",
        clusterId: ctx.config.CLUSTER_ID,
        namespace: ctx.config.NAMESPACE,
        timestamp: new Date().toISOString(),
        message: "Subscribed to agent investigation stream",
        data: { k8sConnected: ctx.k8s.connected },
      },
    });
  });
}
