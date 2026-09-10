import type { FastifyBaseLogger } from "fastify";
import type { Config } from "../config/env.js";
import type { EventBus } from "../events/bus.js";
import { createFnLog } from "../logging.js";
import { incidentStore, closeApprovalGate, type Incident } from "../repositories/incidents.js";
import type { KubernetesMonitorService } from "./kubernetes-monitor.js";
import type { AgentClient } from "./agent-client.js";
import type { PodDto } from "../types/dto.js";
import type { OpsPilotEvent } from "../types/events.js";

function localInvestigation(incident: Incident, pods: PodDto[]): Incident {
  const at = new Date().toISOString();
  const related = pods.filter(
    (pod) =>
      pod.labels.app === incident.service ||
      pod.name.startsWith(incident.service)
  );
  const unhealthy = related.filter((pod) => !pod.ready);
  const reason =
    unhealthy
      .flatMap((pod) => pod.containerStatuses.map((c) => c.reason))
      .find((r) => r) || "unknown";

  return {
    ...incident,
    updatedAt: at,
    investigation: [
      {
        id: `${incident.id}-inv-k8s`,
        step: "inspect_pods",
        status: "completed",
        tool: "k8s",
        startedAt: incident.startedAt,
        completedAt: at,
        summary: related.length
          ? `${unhealthy.length}/${related.length} ${incident.service} pods not ready (reason=${reason})`
          : `No live pods found for ${incident.service}; using incident signal only`,
        details: { pods: related.slice(0, 8) },
      },
      {
        id: `${incident.id}-inv-hyp`,
        step: "form_hypothesis",
        status: "completed",
        tool: "memory",
        startedAt: at,
        completedAt: at,
        summary: `Likely ${reason} on ${incident.service}. Recommend gated restart/rollback.`,
      },
      {
        id: `${incident.id}-inv-gate`,
        step: "await_approval",
        status: "running",
        tool: "policy",
        startedAt: at,
        completedAt: null,
        summary: "Waiting for on-call approval before executor mutation",
      },
    ],
    rootCause: {
      summary: unhealthy.length
        ? `${incident.service} pods are not ready (${reason})`
        : incident.rootCause.summary,
      confidence: unhealthy.length ? 0.72 : 0.4,
      service: incident.service,
      change: reason,
      contributingFactors: [reason, `${unhealthy.length} unhealthy pods`],
    },
  };
}

async function runForIncident(
  incidentId: string,
  k8s: KubernetesMonitorService,
  agent: AgentClient,
  bus: EventBus,
  config: Config,
  log: FastifyBaseLogger
): Promise<void> {
  const flog = createFnLog(log);
  const incident = incidentStore.get(incidentId);
  if (!incident) return;

  bus.publish({
    type: "agent.investigation.step",
    incidentId,
    clusterId: config.CLUSTER_ID,
    namespace: incident.namespace,
    timestamp: new Date().toISOString(),
    message: `Investigation started for ${incidentId}`,
    status: "running",
    step: "inspect_pods",
  });

  let pods: PodDto[] = [];
  try {
    pods = await k8s.listPods(incident.namespace);
  } catch {
    pods = [];
  }

  const remote = await agent.investigate(incident, pods);
  const latest = incidentStore.get(incidentId);
  if (!latest) return;

  const draft = remote
    ? {
        investigation: remote.investigation ?? latest.investigation,
        rootCause: remote.rootCause ?? latest.rootCause,
        remediation: remote.remediation ?? latest.remediation,
        evidence: remote.evidence
          ? [...latest.evidence, ...remote.evidence]
          : latest.evidence,
      }
    : localInvestigation(latest, pods);

  const next = incidentStore.patch(incidentId, (current) => {
    const gateClosed =
      current.policy.status === "approved" ||
      current.policy.status === "auto-approved" ||
      current.policy.status === "rejected" ||
      current.execution?.status !== undefined &&
      current.execution.status !== "blocked";
    const investigation = gateClosed
      ? closeApprovalGate(
          draft.investigation,
          current.updatedAt,
          current.policy.status === "rejected"
            ? "Remediation rejected; executor will not run"
            : "Approval already recorded; executor owns mutation"
        )
      : draft.investigation;
    return {
      ...current,
      updatedAt: new Date().toISOString(),
      investigation,
      rootCause: draft.rootCause,
      remediation: current.policy.status === "pending" ? draft.remediation : current.remediation,
      evidence: draft.evidence,
    };
  });
  if (!next) return;
  flog.info("runForIncident", remote ? "Applied agent investigation" : "Applied local investigation", {
    incidentId,
  });

  bus.publish({
    type: "agent.investigation.step",
    incidentId,
    clusterId: config.CLUSTER_ID,
    namespace: next.namespace,
    timestamp: next.updatedAt,
    message: next.investigation.at(-1)?.summary ?? "Investigation updated",
    status: next.investigation.at(-1)?.status === "running" ? "running" : "completed",
    step: next.investigation.at(-1)?.step ?? "form_hypothesis",
  });
}

export function startInvestigationRunner(
  bus: EventBus,
  config: Config,
  log: FastifyBaseLogger,
  k8s: KubernetesMonitorService,
  agent: AgentClient
): () => void {
  return bus.subscribe((event: OpsPilotEvent) => {
    if (event.type !== "incident.created" || !event.incidentId) return;
    void runForIncident(event.incidentId, k8s, agent, bus, config, log);
  });
}
