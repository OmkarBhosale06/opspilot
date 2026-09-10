import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { type Config, loadConfig } from "./config/env.js";
import { KubernetesClient } from "./clients/kubernetes/client.js";
import { PrometheusClient } from "./clients/prometheus/client.js";
import { LokiClient } from "./clients/loki/client.js";
import { PostgresClient, RedisClient } from "./clients/data-stores.js";
import { EventBus } from "./events/bus.js";
import { KubernetesMonitorService } from "./services/kubernetes-monitor.js";
import { registerRoutes } from "./routes/index.js";
import type { AppContext } from "./controllers/index.js";
import { startAgentSimulator } from "./services/agent-simulator.js";
import { AgentClient } from "./services/agent-client.js";
import { startIncidentDetector } from "./services/incident-detector.js";
import { startInvestigationRunner } from "./services/investigation-runner.js";
import { ObservabilityService } from "./services/observability-service.js";
import { createFnLog, createReqId, loggerOptions } from "./logging.js";

export type BuildOptions = {
  config?: Config;
  k8sClient?: KubernetesClient;
  startWatchers?: boolean;
  startSimulator?: boolean;
};

export async function buildServer(
  options: BuildOptions = {}
): Promise<{ app: FastifyInstance; ctx: AppContext }> {
  const config = options.config ?? loadConfig();
  const app = Fastify({
    disableRequestLogging: true,
    genReqId: () => createReqId(),
    logger: loggerOptions(config),
  });

  await app.register(cors, {
    origin: config.CORS_ORIGIN.split(",").map((s) => s.trim()),
  });

  const flog = createFnLog(app.log);
  const k8sClient =
    options.k8sClient ?? new KubernetesClient(config.CLUSTER_ID, app.log);
  if (!options.k8sClient) {
    k8sClient.loadFromKubeConfig();
    flog.info(
      "buildServer",
      k8sClient.connected ? "Loaded kubeconfig" : "Kubeconfig not loaded",
      {
        connected: k8sClient.connected,
        error: k8sClient.lastError,
        cluster: k8sClient.describeCluster(config.NAMESPACE),
      }
    );
    await k8sClient.probe();
    flog.info(
      "buildServer",
      k8sClient.connected ? "Kubernetes reachable" : "Kubernetes unreachable",
      { connected: k8sClient.connected, error: k8sClient.lastError }
    );
  }

  const bus = new EventBus(app.log);
  const k8s = new KubernetesMonitorService(k8sClient, bus, config, app.log);
  const prometheus = PrometheusClient.fromConfig(config, app.log);
  const loki = LokiClient.fromConfig(config, app.log);
  const observability = new ObservabilityService(prometheus, loki, config);
  const postgres = PostgresClient.fromConfig(config);
  const redis = RedisClient.fromConfig(config);
  await postgres.connect();
  await redis.connect();

  const ctx: AppContext = {
    config,
    k8sClient,
    k8s,
    bus,
    prometheus,
    loki,
    observability,
    postgres,
    redis,
  };

  await app.register(registerRoutes, { ctx });

  app.addHook("onClose", async () => {
    k8s.stop();
    await postgres.close();
    await redis.close();
  });

  const agent = AgentClient.fromConfig(config, app.log);
  if (options.startWatchers !== false) {
    await k8s.start();
    startIncidentDetector(bus, config, app.log);
    startInvestigationRunner(bus, config, app.log, k8s, agent);
  }
  const simFlag = String(config.ENABLE_AGENT_SIMULATOR ?? "1");
  const simEnabled = !["0", "false"].includes(simFlag);
  if (options.startSimulator !== false && simEnabled) {
    startAgentSimulator(bus, config, app.log);
  }

  flog.info("buildServer", "OpsPilot API ready", {
    cluster: config.CLUSTER_ID,
    namespace: config.NAMESPACE,
    k8sConnected: k8s.connected,
  });

  return { app, ctx };
}

export async function startServer(): Promise<FastifyInstance> {
  const { app, ctx } = await buildServer();
  const flog = createFnLog(app.log);

  const shutdown = async (signal: string) => {
    flog.info("startServer", "Graceful shutdown", { signal });
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      flog.error("startServer", "Error during shutdown", { err });
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({ port: ctx.config.PORT, host: ctx.config.HOST });
  return app;
}
