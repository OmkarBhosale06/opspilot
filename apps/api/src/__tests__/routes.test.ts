import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import { registerControllers, type AppContext } from "../controllers/index.js";
import { EventBus } from "../events/bus.js";
import { loadConfig } from "../config/env.js";
import { KubernetesUnavailableError } from "../types/errors.js";
import type { KubernetesMonitorService } from "../services/kubernetes-monitor.js";
import type { KubernetesClient } from "../clients/kubernetes/client.js";
import type { PrometheusClient } from "../clients/prometheus/client.js";
import type { LokiClient } from "../clients/loki/client.js";
import type { PostgresClient, RedisClient } from "../clients/data-stores.js";
import type { PodDto, DeploymentDto, K8sEventDto } from "../types/dto.js";
import { ObservabilityService } from "../services/observability-service.js";
import { RemediationPipeline } from "../services/remediation-pipeline.js";

const pod: PodDto = {
  name: "demo-api-abc",
  namespace: "opspilot",
  phase: "Running",
  node: "kind-control-plane",
  labels: { app: "demo-api" },
  createdAt: "2026-09-09T12:00:00.000Z",
  containers: [{ name: "demo-api", image: "nginx:1.27" }],
  containerStatuses: [
    {
      name: "demo-api",
      ready: true,
      restartCount: 0,
      state: "running",
      reason: null,
      image: "nginx:1.27",
    },
  ],
  ready: true,
  restarts: 0,
};

const deployment: DeploymentDto = {
  name: "demo-api",
  namespace: "opspilot",
  replicas: 2,
  readyReplicas: 2,
  availableReplicas: 2,
  updatedReplicas: 2,
  labels: { app: "demo-api" },
  images: ["nginx:1.27"],
  createdAt: "2026-09-09T12:00:00.000Z",
  strategy: "RollingUpdate",
  conditions: [],
};

const event: K8sEventDto = {
  type: "Normal",
  reason: "Started",
  message: "Started container demo-api",
  object: "Pod/demo-api-abc",
  namespace: "opspilot",
  count: 1,
  firstTimestamp: "2026-09-09T12:00:00.000Z",
  lastTimestamp: "2026-09-09T12:00:00.000Z",
};

function fakeK8s(overrides: Partial<KubernetesMonitorService> = {}) {
  return {
    connected: true,
    listClusters: () => [
      {
        id: "kind-opspilot",
        context: "kind-opspilot",
        server: "https://127.0.0.1",
        connected: true,
        defaultNamespace: "opspilot",
      },
    ],
    listNamespaces: async () => [
      { name: "opspilot", status: "Active", labels: {}, createdAt: null },
    ],
    listPods: async () => [
      pod,
      { ...pod, name: "demo-api-def" },
    ],
    getPod: async () => pod,
    getPodLogs: async () => ({
      pod: pod.name,
      namespace: "opspilot",
      container: "demo-api",
      lines: ["listening on :80"],
    }),
    listDeployments: async () => [deployment],
    getDeployment: async () => deployment,
    listSnapshots: async () => [],
    listServices: async () => [],
    listEvents: async () => [event],
    probe: async () => true,
    restartDeployment: async () => ({
      action: "restart" as const,
      name: "demo-api",
      namespace: "opspilot",
      detail: "Rolled out opspilot/demo-api via restartedAt annotation",
    }),
    rollbackDeployment: async () => ({
      action: "rollback" as const,
      name: "demo-api",
      namespace: "opspilot",
      fromImages: ["nginx:bad"],
      toImages: ["nginx:1.27"],
      detail: "Rolled back opspilot/demo-api nginx:bad → nginx:1.27",
    }),
    ...overrides,
  } as unknown as KubernetesMonitorService;
}

async function buildTestApp(k8s: KubernetesMonitorService) {
  const app = Fastify({ logger: false });
  const config = loadConfig({
    NODE_ENV: "test",
    VERIFY_TIMEOUT_MS: "20",
    VERIFY_POLL_MS: "5",
  });
  const prometheus = {
    health: async () => false,
    instantQuery: async () => {
      throw new Error("prometheus down");
    },
    rangeQuery: async () => {
      throw new Error("prometheus down");
    },
    activeAlerts: async () => {
      throw new Error("prometheus down");
    },
  } as unknown as PrometheusClient;
  const loki = {
    health: async () => false,
    queryRange: async () => {
      throw new Error("loki down");
    },
  } as unknown as LokiClient;
  const bus = new EventBus();
  const ctx: AppContext = {
    config,
    k8sClient: { markDisconnected: () => undefined } as unknown as KubernetesClient,
    k8s,
    bus,
    prometheus,
    loki,
    observability: new ObservabilityService(prometheus, loki, config),
    postgres: { health: async () => false } as unknown as PostgresClient,
    redis: { health: async () => false } as unknown as RedisClient,
    remediation: new RemediationPipeline(config, k8s, bus),
  };
  registerControllers(app, ctx);
  await app.ready();
  return app;
}

describe("API routes", () => {
  it("GET /api/health reports kubernetes connectivity", async () => {
    const app = await buildTestApp(fakeK8s());
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      status: "ok",
      cluster: "kind-opspilot",
      k8sConnected: true,
    });
    await app.close();
  });

  it("GET /api/pods returns DTOs from the monitor service", async () => {
    const app = await buildTestApp(fakeK8s());
    const res = await app.inject({ method: "GET", url: "/api/pods" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.count).toBe(2);
    expect(body.items[0].name).toBe("demo-api-abc");
    expect(body.items[0].ready).toBe(true);
    await app.close();
  });

  it("GET /api/deployments and /api/events return inventory", async () => {
    const app = await buildTestApp(fakeK8s());
    const deps = await app.inject({ method: "GET", url: "/api/deployments" });
    const events = await app.inject({ method: "GET", url: "/api/events" });
    expect(deps.json().items[0].name).toBe("demo-api");
    expect(events.json().items[0].reason).toBe("Started");
    await app.close();
  });

  it("GET /api/pods/:name/logs returns normalized lines", async () => {
    const app = await buildTestApp(fakeK8s());
    const res = await app.inject({
      method: "GET",
      url: "/api/pods/demo-api-abc/logs",
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().lines).toContain("listening on :80");
    await app.close();
  });

  it("returns 503 when kubernetes is unavailable", async () => {
    const app = await buildTestApp(
      fakeK8s({
        connected: false,
        listPods: async () => {
          throw new KubernetesUnavailableError("kind not running");
        },
      })
    );
    const res = await app.inject({ method: "GET", url: "/api/pods" });
    expect(res.statusCode).toBe(503);
    expect(res.json().error).toBe("kubernetes_unavailable");
    await app.close();
  });

  it("GET /api/observability/overview degrades when telemetry is down", async () => {
    const app = await buildTestApp(fakeK8s());
    const res = await app.inject({
      method: "GET",
      url: "/api/observability/overview",
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      status: "degraded",
      prometheusAvailable: false,
      lokiAvailable: false,
      service: "checkout-api",
    });
    await app.close();
  });

  it("POST /api/incidents creates an incident and approve records policy", async () => {
    const app = await buildTestApp(fakeK8s());
    const created = await app.inject({
      method: "POST",
      url: "/api/incidents",
      payload: {
        title: "demo-api crash loop (test)",
        service: "demo-api",
        namespace: "opspilot",
        scenario: "crashloop",
        severity: "SEV2",
      },
    });
    expect(created.statusCode).toBe(201);
    const incident = created.json();
    expect(incident.id).toMatch(/^INC-\d+$/);
    expect(incident.policy.status).toBe("pending");

    const approved = await app.inject({
      method: "POST",
      url: `/api/incidents/${incident.id}/approve`,
      payload: { actor: "tester@local" },
    });
    expect(approved.statusCode).toBe(200);
    expect(approved.json().incident.policy.status).toBe("approved");
    expect(approved.json().incident.policy.approvals[0].actor).toBe("tester@local");
    expect(approved.json().executor).toBe("completed");
    expect(approved.json().incident.execution.status).toBe("completed");
    expect(approved.json().incident.verification.status).toBe("passed");
    expect(approved.json().incident.status).toBe("resolved");
    await app.close();
  });

  it("POST /api/incidents/:id/approve records executor failure when mutation is denied by the cluster", async () => {
    const app = await buildTestApp(
      fakeK8s({
        restartDeployment: async () => {
          throw new Error("Forbidden: cannot patch deployments");
        },
      })
    );
    const created = await app.inject({
      method: "POST",
      url: "/api/incidents",
      payload: {
        title: "demo-api crash loop (test)",
        service: "demo-api",
        namespace: "opspilot",
        scenario: "crashloop",
      },
    });
    const incident = created.json();
    const approved = await app.inject({
      method: "POST",
      url: `/api/incidents/${incident.id}/approve`,
      payload: { actor: "tester@local" },
    });
    expect(approved.statusCode).toBe(200);
    expect(approved.json().executor).toBe("failed");
    expect(approved.json().incident.execution.detail).toMatch(/Forbidden/);
    await app.close();
  });
});
