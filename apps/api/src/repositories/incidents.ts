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
  action: "rollback";
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

export type Incident = {
  id: string;
  title: string;
  summary: string;
  severity: "SEV1" | "SEV2" | "SEV3" | "SEV4";
  status: "open" | "investigating" | "mitigating" | "resolved" | "closed";
  service: string;
  namespace: string;
  clusterId: string;
  startedAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  affectedReplicas: number;
  errorRate: number;
  timeline: TimelineEvent[];
  investigation: InvestigationStep[];
  evidence: EvidenceItem[];
  rootCause: RootCauseHypothesis;
  remediation: RemediationPlan;
  policy: PolicyState;
  verification: VerificationState;
  relatedDeployments: Array<{
    name: string;
    version: string;
    status: string;
    at: string;
  }>;
  similarIncidents: Array<{
    id: string;
    title: string;
    resolution: string;
    similarity: number;
  }>;
};

const INCIDENT_ID = "INC-1042";
const BASE = "2026-09-09T14:00:00.000Z";

function t(offsetMinutes: number): string {
  return new Date(Date.parse(BASE) + offsetMinutes * 60_000).toISOString();
}

function seedInc1042(): Incident {
  return {
    id: INCIDENT_ID,
    title: "checkout-api elevated 5xx",
    summary:
      "checkout-api error rate spiked to 18.4% after deployment v43. Customers unable to complete checkout.",
    severity: "SEV1",
    status: "mitigating",
    service: "checkout-api",
    namespace: "opspilot",
    clusterId: "kind-opspilot",
    startedAt: t(0),
    updatedAt: t(22),
    resolvedAt: null,
    affectedReplicas: 3,
    errorRate: 18.4,
    timeline: [
      {
        id: "tl-1",
        timestamp: t(0),
        type: "alert.fired",
        message: "Prometheus alert: CheckoutAPIHigh5xxRate (threshold 5%)",
        source: "prometheus",
        severity: "critical",
      },
      {
        id: "tl-2",
        timestamp: t(1),
        type: "incident.created",
        message: "Incident INC-1042 opened for checkout-api elevated 5xx",
        source: "opspilot",
        severity: "critical",
      },
      {
        id: "tl-3",
        timestamp: t(2),
        type: "agent.started",
        message: "Investigation agent started for INC-1042",
        source: "agent",
        severity: "info",
      },
      {
        id: "tl-4",
        timestamp: t(5),
        type: "finding",
        message: "Error spike correlates with deployment checkout-api:v43 at 13:58 UTC",
        source: "agent",
        severity: "warning",
      },
      {
        id: "tl-5",
        timestamp: t(12),
        type: "hypothesis",
        message:
          "Root cause hypothesis: nil pointer in payment token validation introduced in v43",
        source: "agent",
        severity: "warning",
      },
      {
        id: "tl-6",
        timestamp: t(15),
        type: "remediation.proposed",
        message: "Proposed rollback checkout-api v43 → v42",
        source: "agent",
        severity: "info",
      },
      {
        id: "tl-7",
        timestamp: t(18),
        type: "policy.pending",
        message: "Rollback requires human approval (SEV1 production change)",
        source: "policy",
        severity: "warning",
      },
      {
        id: "tl-8",
        timestamp: t(22),
        type: "status.update",
        message: "Awaiting approval; error rate still elevated at 18.4%",
        source: "opspilot",
        severity: "critical",
      },
    ],
    investigation: [
      {
        id: "inv-1",
        step: "query_k8s_deployment",
        status: "completed",
        tool: "k8s",
        startedAt: t(2),
        completedAt: t(3),
        summary:
          "checkout-api deployment at revision 43, 3/3 ready, image checkout-api:v43",
        details: {
          deployment: "checkout-api",
          revision: "43",
          readyReplicas: 3,
          image: "ghcr.io/opspilot/checkout-api:v43",
        },
      },
      {
        id: "inv-2",
        step: "query_k8s_pods",
        status: "completed",
        tool: "k8s",
        startedAt: t(3),
        completedAt: t(4),
        summary: "All 3 pods Running; restart count elevated (avg 4) after rollout",
        details: {
          pods: [
            "checkout-api-7d8f9c-abc12",
            "checkout-api-7d8f9c-def34",
            "checkout-api-7d8f9c-ghi56",
          ],
          avgRestarts: 4,
        },
      },
      {
        id: "inv-3",
        step: "query_prometheus_error_rate",
        status: "completed",
        tool: "prometheus",
        startedAt: t(4),
        completedAt: t(6),
        summary: "5xx rate jumped from 0.3% → 18.4% at 13:58 UTC coinciding with rollout",
        details: {
          query:
            'sum(rate(http_requests_total{service="checkout-api",status=~"5.."}[5m])) / sum(rate(http_requests_total{service="checkout-api"}[5m]))',
          before: 0.003,
          after: 0.184,
          inflection: "2026-09-09T13:58:00.000Z",
        },
      },
      {
        id: "inv-4",
        step: "query_loki_error_logs",
        status: "completed",
        tool: "loki",
        startedAt: t(6),
        completedAt: t(9),
        summary:
          "Repeated panic: runtime error: invalid memory address in ValidatePaymentToken",
        details: {
          query: '{app="checkout-api"} |= "panic" |= "ValidatePaymentToken"',
          sampleCount: 842,
          topError:
            "runtime error: invalid memory address or nil pointer dereference",
        },
      },
      {
        id: "inv-5",
        step: "recall_recent_changes",
        status: "completed",
        tool: "memory",
        startedAt: t(9),
        completedAt: t(11),
        summary:
          "Memory: PR #884 merged 40m ago — 'refactor payment token validation for optional guest checkout'",
        details: {
          pr: 884,
          author: "dev@example.com",
          mergedAt: "2026-09-09T13:20:00.000Z",
          files: ["internal/payment/token.go"],
        },
      },
      {
        id: "inv-6",
        step: "propose_remediation",
        status: "completed",
        tool: "policy",
        startedAt: t(12),
        completedAt: t(15),
        summary: "Recommend rollback to v42; policy requires approval for SEV1 prod rollback",
        details: {
          action: "rollback",
          from: "v43",
          to: "v42",
        },
      },
    ],
    evidence: [
      {
        id: "ev-1",
        kind: "metric",
        title: "checkout-api 5xx rate",
        summary: "Error rate 18.4% (threshold 5%) over last 15m",
        source: "prometheus",
        timestamp: t(6),
        data: { value: 0.184, window: "15m", threshold: 0.05 },
      },
      {
        id: "ev-2",
        kind: "log",
        title: "Nil pointer in ValidatePaymentToken",
        summary: "842 panic stack traces matching payment token validation",
        source: "loki",
        timestamp: t(9),
        data: {
          snippet:
            "panic: runtime error: invalid memory address or nil pointer dereference\ngoroutine 184 [running]:\nopspilot/checkout-api/internal/payment.ValidatePaymentToken(...)",
        },
      },
      {
        id: "ev-3",
        kind: "k8s",
        title: "Deployment revision 43",
        summary: "checkout-api rolled out image v43 at 13:58 UTC",
        source: "kubernetes",
        timestamp: t(3),
        data: {
          deployment: "checkout-api",
          revision: "43",
          previousRevision: "42",
          image: "ghcr.io/opspilot/checkout-api:v43",
        },
      },
      {
        id: "ev-4",
        kind: "diff",
        title: "PR #884 payment token refactor",
        summary: "Guest checkout path leaves token pointer nil under load",
        source: "github",
        timestamp: t(11),
        data: {
          pr: 884,
          file: "internal/payment/token.go",
          change: "optional token without nil guard before dereference",
        },
      },
    ],
    rootCause: {
      summary:
        "Nil pointer dereference in ValidatePaymentToken introduced in checkout-api v43 (PR #884), causing panics and elevated 5xx under guest-checkout traffic.",
      confidence: 0.91,
      service: "checkout-api",
      change: "deployment revision 43 / image v43",
      contributingFactors: [
        "Missing nil guard after optional guest-checkout token refactor",
        "Rollout completed without canary error-budget gate",
        "Traffic mix includes ~35% guest checkout",
      ],
    },
    remediation: {
      action: "rollback",
      target: "deployment/checkout-api",
      fromVersion: "v43",
      toVersion: "v42",
      rationale:
        "v42 was stable for 6 days with <0.5% 5xx. Rollback restores known-good binary while fix lands.",
      risk: "low",
      estimatedImpact: "Brief connection drain (~30s); restores checkout success rate",
    },
    policy: {
      status: "pending",
      requiredApprovals: 1,
      approvals: [],
      policyId: "prod-sev1-rollback",
      reason: "SEV1 production rollback requires on-call approval before mutation",
    },
    verification: {
      status: "not_started",
      checks: [
        {
          name: "5xx rate < 1%",
          status: "pending",
          detail: "Will verify http 5xx rate drops below 1% for 10m",
        },
        {
          name: "Pod readiness 3/3",
          status: "pending",
          detail: "Will confirm all checkout-api replicas Ready after rollback",
        },
        {
          name: "No panic logs",
          status: "pending",
          detail: "Will confirm ValidatePaymentToken panics cease in Loki",
        },
      ],
      completedAt: null,
    },
    relatedDeployments: [
      {
        name: "checkout-api",
        version: "v43",
        status: "degraded",
        at: t(-2),
      },
      {
        name: "checkout-api",
        version: "v42",
        status: "verified healthy",
        at: "2026-09-03T08:42:00.000Z",
      },
    ],
    similarIncidents: [
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
    ],
  };
}

class IncidentStore {
  private incidents = new Map<string, Incident>();

  constructor() {
    const demo = seedInc1042();
    this.incidents.set(demo.id, demo);
  }

  list(): Incident[] {
    return Array.from(this.incidents.values()).sort(
      (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
    );
  }

  get(id: string): Incident | undefined {
    return this.incidents.get(id);
  }

  /** Lean list DTO for index views */
  listSummaries() {
    return this.list().map((i) => ({
      id: i.id,
      title: i.title,
      summary: i.summary,
      severity: i.severity,
      status: i.status,
      service: i.service,
      namespace: i.namespace,
      clusterId: i.clusterId,
      startedAt: i.startedAt,
      updatedAt: i.updatedAt,
      resolvedAt: i.resolvedAt,
      errorRate: i.errorRate,
      affectedReplicas: i.affectedReplicas,
    }));
  }
}

export const incidentStore = new IncidentStore();
