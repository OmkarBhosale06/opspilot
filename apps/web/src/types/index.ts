export type HealthStatus = "ok" | "degraded" | "error" | "healthy" | "incident";

export type HealthResponse = {
  status: string;
  cluster: string;
  k8sConnected: boolean;
  timestamp: string;
};

export type OverviewResponse = {
  cluster: string;
  namespace: string;
  k8sConnected: boolean;
  status: "healthy" | "degraded" | "incident" | string;
  message?: string;
  timestamp: string;
  pods: { total: number; ready: number; notReady: number };
  deployments: { total: number; available: number; unavailable: number };
  events: { warning: number; normal: number };
  incidents: {
    open: number;
    total: number;
    highestSeverity: Severity | null;
  };
};

export type Severity = "SEV1" | "SEV2" | "SEV3" | "SEV4";
export type IncidentStatus =
  | "open"
  | "investigating"
  | "mitigating"
  | "resolved"
  | "closed";

export type ContainerStatusDto = {
  name: string;
  ready: boolean;
  restartCount: number;
  state: "running" | "waiting" | "terminated" | "unknown";
  reason: string | null;
  image?: string;
};

export type PodDto = {
  name: string;
  namespace: string;
  phase: string;
  node: string | null;
  labels: Record<string, string>;
  createdAt: string | null;
  containers: Array<{ name: string; image: string }>;
  containerStatuses: ContainerStatusDto[];
  ready: boolean;
  restarts: number;
};

export type DeploymentDto = {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  availableReplicas: number;
  updatedReplicas: number;
  labels: Record<string, string>;
  images: string[];
  createdAt: string | null;
  strategy: string | null;
  conditions: Array<{
    type: string;
    status: string;
    reason: string | null;
    message: string | null;
  }>;
};

export type SnapshotDto = {
  name: string;
  revision: string | null;
  replicas: number;
  readyReplicas: number;
  images: string[];
  createdAt: string | null;
  owner: string | null;
};

export type K8sEventDto = {
  type: string;
  reason: string;
  message: string;
  object: string;
  namespace: string;
  count: number;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
};

export type TimelineEvent = {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  source: string;
  severity?: "info" | "warning" | "critical";
};

export type InvestigationStep = {
  id: string;
  step: string;
  status: "pending" | "running" | "completed" | "failed";
  tool: "k8s" | "prometheus" | "loki" | "memory" | "github" | "policy";
  startedAt: string;
  completedAt: string | null;
  summary: string;
  details?: unknown;
};

export type EvidenceItem = {
  id: string;
  kind: "metric" | "log" | "k8s" | "diff" | "trace";
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  data?: unknown;
};

export type RootCauseHypothesis = {
  summary: string;
  confidence: number;
  service: string;
  change: string;
  contributingFactors: string[];
};

export type RemediationPlan = {
  action: "rollback" | string;
  target: string;
  fromVersion: string;
  toVersion: string;
  rationale: string;
  risk: "low" | "medium" | "high";
  estimatedImpact: string;
};

export type PolicyState = {
  status: "pending" | "approved" | "rejected" | "auto-approved";
  requiredApprovals: number;
  approvals: Array<{ actor: string; at: string; note?: string }>;
  policyId: string;
  reason: string;
};

export type VerificationState = {
  status: "not_started" | "in_progress" | "passed" | "failed";
  checks: Array<{
    name: string;
    status: "pending" | "passed" | "failed";
    detail: string;
  }>;
  completedAt: string | null;
};

export type IncidentSummary = {
  id: string;
  title: string;
  summary: string;
  severity: Severity;
  status: IncidentStatus;
  service: string;
  namespace: string;
  clusterId: string;
  startedAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  errorRate: number;
  affectedReplicas: number;
  confidence?: number;
};

export type Incident = IncidentSummary & {
  timeline: TimelineEvent[];
  investigation: InvestigationStep[];
  evidence: EvidenceItem[];
  rootCause: RootCauseHypothesis;
  remediation: RemediationPlan;
  policy: PolicyState;
  verification: VerificationState;
  relatedDeployments?: Array<{
    name: string;
    version: string;
    status: string;
    at: string;
  }>;
  similarIncidents?: Array<{
    id: string;
    title: string;
    resolution: string;
    similarity: number;
  }>;
};

export type OpsEvent = {
  type: string;
  incidentId?: string;
  clusterId: string;
  namespace?: string;
  timestamp: string;
  message?: string;
  status?: string;
  step?: string;
  data?: unknown;
};

export type NamespaceDto = {
  name: string;
  status?: string;
  createdAt?: string | null;
};

export type ConnectionState = "connected" | "degraded" | "disconnected";

export type AgentActivityItem = {
  id: string;
  agent: string;
  action: string;
  status: "running" | "completed" | "failed" | "idle";
  timestamp: string;
  incidentId?: string;
  detail?: string;
};
