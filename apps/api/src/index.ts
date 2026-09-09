import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { getK8sClients, probeK8sConnection } from "./services/k8s/client.js";
import { startWatchers } from "./services/k8s/watch.js";
import { startAgentSimulator } from "./services/agent/simulator.js";
import { healthRoutes } from "./routes/health.js";
import { overviewRoutes } from "./routes/overview.js";
import { podRoutes } from "./routes/pods.js";
import { deploymentRoutes } from "./routes/deployments.js";
import { eventRoutes } from "./routes/events.js";
import { namespaceRoutes } from "./routes/namespaces.js";
import { incidentRoutes } from "./routes/incidents.js";
import { streamRoutes } from "./routes/stream.js";

async function main() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: ["http://localhost:3000"],
  });

  // Eagerly load kubeconfig, then live-probe the API server
  getK8sClients();
  const connected = await probeK8sConnection();
  app.log.info(
    {
      cluster: config.CLUSTER_ID,
      namespace: config.NAMESPACE,
      k8sConnected: connected,
    },
    "OpsPilot API starting"
  );

  await app.register(healthRoutes);
  await app.register(overviewRoutes);
  await app.register(namespaceRoutes);
  await app.register(podRoutes);
  await app.register(deploymentRoutes);
  await app.register(eventRoutes);
  await app.register(incidentRoutes);
  await app.register(streamRoutes);

  await startWatchers();
  startAgentSimulator();

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`OpsPilot API listening on http://localhost:${config.PORT}`);
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
