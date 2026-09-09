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
    logger: {
      level: config.LOG_LEVEL,
    },
  });

  await app.register(cors, {
    origin: config.CORS_ORIGIN.split(",").map((s) => s.trim()),
  });

  const k8sClient = options.k8sClient ?? new KubernetesClient(config.CLUSTER_ID);
  if (!options.k8sClient) {
    k8sClient.loadFromKubeConfig();
    await k8sClient.probe();
  }

  const bus = new EventBus();
  const k8s = new KubernetesMonitorService(k8sClient, bus, config, app.log);
  const prometheus = PrometheusClient.fromConfig(config);
  const loki = LokiClient.fromConfig(config);
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
    postgres,
    redis,
  };

  await app.register(registerRoutes, { ctx });

  app.addHook("onClose", async () => {
    k8s.stop();
    await postgres.close();
    await redis.close();
  });

  if (options.startWatchers !== false) {
    await k8s.start();
  }
  if (options.startSimulator !== false) {
    startAgentSimulator(bus, config, app.log);
  }

  app.log.info(
    {
      cluster: config.CLUSTER_ID,
      namespace: config.NAMESPACE,
      k8sConnected: k8s.connected,
    },
    "OpsPilot API ready"
  );

  return { app, ctx };
}

export async function startServer(): Promise<FastifyInstance> {
  const { app, ctx } = await buildServer();

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "Graceful shutdown");
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({ port: ctx.config.PORT, host: ctx.config.HOST });
  return app;
}
