import type { FastifyInstance } from "fastify";
import type { Config } from "../config/env.js";
import type { KubernetesClient } from "../clients/kubernetes/client.js";
import type { KubernetesMonitorService } from "../services/kubernetes-monitor.js";
import type { EventBus } from "../events/bus.js";
import { sendDomainError, namespaceFromQuery } from "../middleware/errors.js";
import { getHealthReport, getOverview } from "../services/health-service.js";
import { incidentStore } from "../repositories/incidents.js";
import { z } from "zod";
import { openSseStream } from "../events/sse.js";
import type { PrometheusClient } from "../clients/prometheus/client.js";
import type { LokiClient } from "../clients/loki/client.js";
import type { PostgresClient, RedisClient } from "../clients/data-stores.js";
import type { ObservabilityService } from "../services/observability-service.js";
import type { RemediationPipeline } from "../services/remediation-pipeline.js";

export type AppContext = {
  config: Config;
  k8sClient: KubernetesClient;
  k8s: KubernetesMonitorService;
  bus: EventBus;
  prometheus: PrometheusClient;
  loki: LokiClient;
  observability: ObservabilityService;
  postgres: PostgresClient;
  redis: RedisClient;
  remediation: RemediationPipeline;
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

  const createIncidentBody = z.object({
    title: z.string().min(1),
    summary: z.string().optional(),
    severity: z.enum(["SEV1", "SEV2", "SEV3", "SEV4"]).optional(),
    service: z.string().min(1),
    namespace: z.string().optional(),
    scenario: z.string().optional(),
    errorRate: z.number().optional(),
    affectedReplicas: z.number().optional(),
  });

  const approvalBody = z.object({
    actor: z.string().min(1).optional(),
    note: z.string().optional(),
  });

  app.get("/api/incidents", async () => {
    return {
      items: incidentStore.listSummaries(),
      count: incidentStore.list().length,
    };
  });

  app.post("/api/incidents", async (request, reply) => {
    const parsed = createIncidentBody.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({
        error: "bad_request",
        message: parsed.error.issues[0]?.message ?? "Invalid incident payload",
      });
    }
    const incident = incidentStore.create({
      ...parsed.data,
      clusterId: ctx.config.CLUSTER_ID,
      source: "api",
    });
    ctx.bus.publish({
      type: "incident.created",
      incidentId: incident.id,
      clusterId: ctx.config.CLUSTER_ID,
      namespace: incident.namespace,
      timestamp: incident.startedAt,
      message: incident.title,
    });
    return reply.status(201).send(incident);
  });

  app.post<{ Params: { id: string } }>(
    "/api/incidents/:id/approve",
    async (request, reply) => {
      const parsed = approvalBody.safeParse(request.body ?? {});
      const actor = parsed.success
        ? parsed.data.actor?.trim() || "oncall@local"
        : "oncall@local";
      const note = parsed.success ? parsed.data.note : undefined;
      const result = incidentStore.approve(request.params.id, actor, note);
      if (!result) {
        return reply.status(404).send({
          error: "not_found",
          message: `Incident ${request.params.id} not found`,
        });
      }
      if (result.incident.policy.status === "rejected") {
        return reply.status(409).send({
          error: "conflict",
          message: "Incident remediation was already rejected",
          incident: result.incident,
        });
      }
      ctx.bus.publish({
        type: "policy.updated",
        incidentId: result.incident.id,
        clusterId: ctx.config.CLUSTER_ID,
        namespace: result.incident.namespace,
        timestamp: result.incident.updatedAt,
        message: `${actor} approved ${result.incident.id}`,
        status: result.incident.policy.status,
      });
      const authorized =
        result.incident.policy.status === "approved" ||
        result.incident.policy.status === "auto-approved";
      const execStatus = result.incident.execution.status;
      if (
        authorized &&
        (execStatus === "queued" || execStatus === "blocked")
      ) {
        const run = ctx.remediation.enqueue(result.incident.id);
        if (ctx.config.NODE_ENV === "test") {
          await run;
        } else {
          void run;
        }
      }
      const latest = incidentStore.get(result.incident.id) ?? result.incident;
      return {
        already: result.already,
        executor: latest.execution.status,
        hint:
          latest.execution.status === "blocked"
            ? "Policy recorded. Executor is disabled."
            : latest.execution.detail,
        incident: latest,
      };
    }
  );

  app.post<{ Params: { id: string } }>(
    "/api/incidents/:id/reject",
    async (request, reply) => {
      const parsed = approvalBody.safeParse(request.body ?? {});
      const actor = parsed.success
        ? parsed.data.actor?.trim() || "oncall@local"
        : "oncall@local";
      const note = parsed.success ? parsed.data.note : undefined;
      const incident = incidentStore.reject(request.params.id, actor, note);
      if (!incident) {
        return reply.status(404).send({
          error: "not_found",
          message: `Incident ${request.params.id} not found`,
        });
      }
      ctx.bus.publish({
        type: "policy.updated",
        incidentId: incident.id,
        clusterId: ctx.config.CLUSTER_ID,
        namespace: incident.namespace,
        timestamp: incident.updatedAt,
        message: `${actor} rejected ${incident.id}`,
        status: incident.policy.status,
      });
      return { incident };
    }
  );

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
      const telemetry = await ctx.observability.incidentTelemetry(incident.id);
      const liveItems = telemetry?.liveEvidence ?? [];
      const items = [...liveItems, ...incident.evidence];
      return {
        incidentId: incident.id,
        items,
        count: items.length,
        rootCause: incident.rootCause,
        live: Boolean(telemetry?.live),
      };
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/incidents/:id/telemetry",
    async (request, reply) => {
      const telemetry = await ctx.observability.incidentTelemetry(
        request.params.id
      );
      if (!telemetry) {
        return reply.status(404).send({
          error: "not_found",
          message: `Incident ${request.params.id} not found`,
        });
      }
      return telemetry;
    }
  );

  app.get("/api/observability/status", async () => {
    return ctx.observability.status();
  });

  app.get<{ Querystring: { service?: string } }>(
    "/api/observability/overview",
    async (request) => {
      const service = request.query.service?.trim() || "checkout-api";
      return ctx.observability.overview(service);
    }
  );

  app.get<{ Querystring: { query: string } }>(
    "/api/observability/metrics/query",
    async (request, reply) => {
      const query = request.query.query?.trim();
      if (!query) {
        return reply.status(400).send({
          error: "bad_request",
          message: "query is required",
        });
      }
      try {
        const result = await ctx.prometheus.instantQuery(query);
        return { live: true, query, result };
      } catch (err) {
        return reply.status(503).send({
          error: "prometheus_unavailable",
          message: err instanceof Error ? err.message : "Prometheus unavailable",
          hint: "Run `make obs-up` to start Prometheus on :9090.",
        });
      }
    }
  );

  app.get<{
    Querystring: { query: string; start?: string; end?: string; step?: string };
  }>("/api/observability/metrics/range", async (request, reply) => {
    const query = request.query.query?.trim();
    if (!query) {
      return reply.status(400).send({
        error: "bad_request",
        message: "query is required",
      });
    }
    const end = request.query.end ?? String(Math.floor(Date.now() / 1000));
    const start =
      request.query.start ??
      String(Number(end) - 30 * 60);
    const step = request.query.step ?? "30s";
    try {
      const result = await ctx.prometheus.rangeQuery(query, start, end, step);
      return { live: true, query, start, end, step, result };
    } catch (err) {
      return reply.status(503).send({
        error: "prometheus_unavailable",
        message: err instanceof Error ? err.message : "Prometheus unavailable",
        hint: "Run `make obs-up` to start Prometheus on :9090.",
      });
    }
  });

  app.get("/api/observability/alerts", async (_request, reply) => {
    try {
      const result = await ctx.prometheus.activeAlerts();
      return { live: true, result };
    } catch (err) {
      return reply.status(503).send({
        error: "prometheus_unavailable",
        message: err instanceof Error ? err.message : "Prometheus unavailable",
        hint: "Run `make obs-up` to start Prometheus on :9090.",
      });
    }
  });

  app.get<{
    Querystring: {
      query?: string;
      service?: string;
      start?: string;
      end?: string;
      limit?: string;
    };
  }>("/api/observability/logs", async (request, reply) => {
    const service = request.query.service?.trim() || "checkout-api";
    const query =
      request.query.query?.trim() ||
      `{service="${service}"} |~ "(?i)panic|error|ValidatePaymentToken"`;
    const endNs =
      request.query.end ?? `${BigInt(Date.now()) * 1_000_000n}`;
    const startNs =
      request.query.start ??
      `${BigInt(Date.now() - 30 * 60_000) * 1_000_000n}`;
    const limit = request.query.limit ? Number(request.query.limit) : 100;
    try {
      const items = await ctx.loki.queryRange(
        query,
        startNs,
        endNs,
        Number.isFinite(limit) ? limit : 100
      );
      return {
        live: true,
        query,
        items,
        count: items.length,
      };
    } catch (err) {
      return reply.status(503).send({
        error: "loki_unavailable",
        message: err instanceof Error ? err.message : "Loki unavailable",
        hint: "Run `make obs-up` to start Loki on :3100.",
      });
    }
  });

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
