import type {
  DeploymentDto,
  K8sEventDto,
  PodDto,
  ServiceDto,
} from "./dto.js";

export type EventBase = {
  clusterId: string;
  timestamp: string;
  namespace?: string;
  incidentId?: string;
  message?: string;
};

export type PodStatusChanged = EventBase & {
  type: "k8s.pod.added" | "k8s.pod.modified" | "k8s.pod.deleted";
  data: PodDto;
};

export type DeploymentChanged = EventBase & {
  type:
    | "k8s.deployment.added"
    | "k8s.deployment.modified"
    | "k8s.deployment.deleted";
  data: DeploymentDto;
};

export type ServiceChanged = EventBase & {
  type: "k8s.service.added" | "k8s.service.modified" | "k8s.service.deleted";
  data: ServiceDto;
};

export type KubernetesEventReceived = EventBase & {
  type: "k8s.event.added" | "k8s.event.modified" | "k8s.event.deleted";
  data: K8sEventDto;
};

export type IncidentCreated = EventBase & {
  type: "incident.created";
  incidentId: string;
};

export type InvestigationStepEvent = EventBase & {
  type: "agent.investigation.step";
  incidentId: string;
  step: string;
  status: "pending" | "running" | "completed" | "failed";
  data?: unknown;
};

export type RemediationUpdated = EventBase & {
  type: "remediation.updated";
  incidentId: string;
  status: string;
};

export type VerificationUpdated = EventBase & {
  type: "verification.updated";
  incidentId: string;
  status: string;
};

export type HeartbeatEvent = EventBase & {
  type: "heartbeat";
};

export type HealthSnapshot = EventBase & {
  type: "health.snapshot" | "health.stream.connected";
  status?: string;
  data?: unknown;
};

export type StreamConnected = EventBase & {
  type: "incident.stream.connected" | "agent.stream.connected";
  data?: unknown;
};

export type OpsPilotEvent =
  | PodStatusChanged
  | DeploymentChanged
  | ServiceChanged
  | KubernetesEventReceived
  | IncidentCreated
  | InvestigationStepEvent
  | RemediationUpdated
  | VerificationUpdated
  | HeartbeatEvent
  | HealthSnapshot
  | StreamConnected;

export type EventHandler = (event: OpsPilotEvent) => void;

/** Loose envelope kept for SSE clients that still read optional fields. */
export type OpsEvent = OpsPilotEvent & {
  status?: string;
  step?: string;
};
