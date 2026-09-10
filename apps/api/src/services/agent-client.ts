import type { FastifyBaseLogger } from "fastify";
import type { Config } from "../config/env.js";
import { createFnLog } from "../logging.js";
import type {
  EvidenceItem,
  Incident,
  InvestigationStep,
  RemediationPlan,
  RootCauseHypothesis,
} from "../repositories/incidents.js";
import type { PodDto } from "../types/dto.js";

export type AgentInvestigateResponse = {
  investigation?: InvestigationStep[];
  rootCause?: RootCauseHypothesis;
  remediation?: RemediationPlan;
  evidence?: EvidenceItem[];
  message?: string;
};

export class AgentClient {
  constructor(
    private readonly url: string,
    private readonly log: FastifyBaseLogger
  ) {}

  static fromConfig(config: Config, log: FastifyBaseLogger): AgentClient {
    return new AgentClient(config.AGENT_URL.replace(/\/$/, ""), log);
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.url}/health`, { signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async investigate(
    incident: Incident,
    pods: PodDto[]
  ): Promise<AgentInvestigateResponse | null> {
    const flog = createFnLog(this.log);
    try {
      const res = await fetch(`${this.url}/investigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          incident: {
            id: incident.id,
            title: incident.title,
            summary: incident.summary,
            service: incident.service,
            namespace: incident.namespace,
            severity: incident.severity,
          },
          pods,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        flog.warn("AgentClient.investigate", "Agent returned non-OK", {
          status: res.status,
          incidentId: incident.id,
        });
        return null;
      }
      return (await res.json()) as AgentInvestigateResponse;
    } catch (err) {
      flog.debug("AgentClient.investigate", "Agent unreachable — using local investigation", {
        err,
        url: this.url,
      });
      return null;
    }
  }
}
