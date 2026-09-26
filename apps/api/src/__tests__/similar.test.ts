import { describe, expect, it } from "vitest";
import { jaccard, recallSimilar, similarityScore, tokens } from "../services/similar.js";
import type { Incident } from "../repositories/incidents.js";

function stub(partial: Partial<Incident> & Pick<Incident, "id" | "title" | "service">): Incident {
  return {
    summary: partial.summary ?? partial.title,
    namespace: "opspilot",
    clusterId: "kind-opspilot",
    severity: "SEV2",
    status: "resolved",
    startedAt: "2026-09-10T00:00:00.000Z",
    updatedAt: "2026-09-10T00:00:00.000Z",
    resolvedAt: "2026-09-10T00:00:00.000Z",
    affectedReplicas: 1,
    errorRate: 0,
    timeline: [],
    investigation: [],
    evidence: [],
    rootCause: {
      summary: partial.title,
      confidence: 0.5,
      service: partial.service,
      change: "crashloop",
      contributingFactors: [],
    },
    remediation: {
      action: "restart",
      target: `deployment/${partial.service}`,
      fromVersion: "current",
      toVersion: "last-healthy",
      rationale: "recycle",
      risk: "low",
      estimatedImpact: "brief",
    },
    policy: {
      status: "approved",
      requiredApprovals: 1,
      approvals: [],
      policyId: "gate",
      reason: "gate",
    },
    execution: {
      status: "completed",
      action: "restart",
      detail: "ok",
      startedAt: null,
      completedAt: null,
    },
    verification: { status: "passed", checks: [], completedAt: null },
    relatedDeployments: [],
    similarIncidents: [],
    ...partial,
  };
}

describe("similar recall", () => {
  it("scores shared service and tokens higher than unrelated", () => {
    const crash = stub({
      id: "INC-1",
      title: "demo-api crash loop",
      service: "demo-api",
    });
    const same = stub({
      id: "INC-2",
      title: "demo-api crashloop after bad image",
      service: "demo-api",
    });
    const other = stub({
      id: "INC-3",
      title: "payments latency",
      service: "payments-api",
      rootCause: {
        summary: "slow queries",
        confidence: 0.4,
        service: "payments-api",
        change: "deploy",
        contributingFactors: [],
      },
    });
    expect(similarityScore(crash, same)).toBeGreaterThan(similarityScore(crash, other));
    expect(recallSimilar(crash, [crash, same, other])[0]?.id).toBe("INC-2");
  });

  it("jaccard is 1 for identical token sets", () => {
    const a = tokens("demo api crash loop");
    expect(jaccard(a, a)).toBe(1);
  });
});
