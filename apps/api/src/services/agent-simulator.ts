import type { FastifyBaseLogger } from "fastify";
import type { Config } from "../config/env.js";
import type { EventBus } from "../events/bus.js";

export function startAgentSimulator(
  bus: EventBus,
  config: Config,
  log: FastifyBaseLogger
): () => void {
  const incidentId = "INC-1042";
  const steps = [
    {
      step: "monitor_error_rate",
      message: "Re-checking Prometheus 5xx rate for checkout-api",
      status: "running" as const,
    },
    {
      step: "monitor_error_rate",
      message: "Error rate still elevated at ~18%",
      status: "completed" as const,
    },
    {
      step: "await_approval",
      message: "Waiting for on-call approval to rollback v43 → v42",
      status: "running" as const,
    },
  ];

  let idx = 0;
  const timer = setInterval(() => {
    const step = steps[idx % steps.length];
    idx += 1;
    bus.publish({
      type: "agent.investigation.step",
      incidentId,
      clusterId: config.CLUSTER_ID,
      namespace: config.NAMESPACE,
      timestamp: new Date().toISOString(),
      message: step.message,
      status: step.status,
      step: step.step,
      data: { demo: true },
    });
  }, 20_000);

  log.info("Emitting demo investigation steps for INC-1042");
  return () => clearInterval(timer);
}
