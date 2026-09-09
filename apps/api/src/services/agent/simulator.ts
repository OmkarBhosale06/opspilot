import { config } from "../../config.js";
import { eventBus } from "../../events/bus.js";

/**
 * Optional demo simulator: periodically re-emits investigation-oriented
 * events for INC-1042 so SSE clients see live agent activity.
 */
export function startAgentSimulator(): void {
  const incidentId = "INC-1042";
  const steps = [
    {
      step: "monitor_error_rate",
      message: "Re-checking Prometheus 5xx rate for checkout-api",
      status: "running",
    },
    {
      step: "monitor_error_rate",
      message: "Error rate still elevated at ~18%",
      status: "completed",
    },
    {
      step: "await_approval",
      message: "Waiting for on-call approval to rollback v43 → v42",
      status: "running",
    },
  ];

  let idx = 0;
  setInterval(() => {
    const step = steps[idx % steps.length];
    idx += 1;
    eventBus.publish({
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

  console.log("[agent-simulator] emitting demo investigation steps for INC-1042");
}
