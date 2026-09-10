import { apiGet, apiPost } from "@/lib/api";
import type {
  EvidenceItem,
  Incident,
  IncidentSummary,
  InvestigationStep,
  TimelineEvent,
} from "@/types";

type ListResponse<T> = { items: T[]; count?: number };

const DEMO_SIMILAR = [
  {
    id: "INC-0891",
    title: "checkout-api 5xx after payment refactor",
    resolution: "Rollback to previous revision",
    similarity: 0.87,
  },
  {
    id: "INC-0712",
    title: "Nil pointer in token validation",
    resolution: "Hotfix + canary gate",
    similarity: 0.74,
  },
];

const DEMO_RELATED = [
  {
    name: "checkout-api",
    version: "v43",
    status: "degraded",
    at: "2026-09-09T13:58:00.000Z",
  },
  {
    name: "checkout-api",
    version: "v42",
    status: "verified healthy",
    at: "2026-09-03T08:42:00.000Z",
  },
];

function enrichIncident(incident: Incident): Incident {
  return {
    ...incident,
    confidence: incident.confidence ?? incident.rootCause?.confidence,
    similarIncidents: incident.similarIncidents ?? DEMO_SIMILAR,
    relatedDeployments: incident.relatedDeployments ?? DEMO_RELATED,
  };
}

export async function listIncidents() {
  const res = await apiGet<ListResponse<IncidentSummary> | IncidentSummary[]>(
    "/api/incidents"
  );
  return Array.isArray(res) ? res : res.items;
}

export async function getIncident(id: string) {
  const incident = await apiGet<Incident>(`/api/incidents/${id}`);
  return enrichIncident(incident);
}

export async function getIncidentTimeline(id: string) {
  const res = await apiGet<
    ListResponse<TimelineEvent> | TimelineEvent[] | { items: TimelineEvent[] }
  >(`/api/incidents/${id}/timeline`);
  return Array.isArray(res) ? res : res.items;
}

export async function getIncidentEvidence(id: string) {
  const res = await apiGet<
    ListResponse<EvidenceItem> | EvidenceItem[] | { items: EvidenceItem[] }
  >(`/api/incidents/${id}/evidence`);
  return Array.isArray(res) ? res : res.items;
}

export async function getIncidentInvestigation(id: string) {
  const res = await apiGet<
    | ListResponse<InvestigationStep>
    | InvestigationStep[]
    | { items: InvestigationStep[] }
  >(`/api/incidents/${id}/investigation`);
  return Array.isArray(res) ? res : res.items;
}

export async function approveIncident(
  id: string,
  body: { actor?: string; note?: string } = {}
) {
  const res = await apiPost<{
    already: boolean;
    executor: string;
    hint: string;
    incident: Incident;
  }>(`/api/incidents/${id}/approve`, body, {
    signal: AbortSignal.timeout(20_000),
  });
  return enrichIncident(res.incident);
}
