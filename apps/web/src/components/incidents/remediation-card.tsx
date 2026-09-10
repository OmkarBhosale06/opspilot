"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import type {
  ExecutionState,
  PolicyState,
  RemediationPlan,
  VerificationState,
} from "@/types";

export function RemediationCard({
  incidentId,
  remediation,
  policy,
  verification,
  execution,
  onApprove,
}: {
  incidentId: string;
  remediation: RemediationPlan;
  policy: PolicyState;
  verification: VerificationState;
  execution?: ExecutionState;
  onApprove?: () => Promise<void> | void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const approved =
    policy.status === "approved" || policy.status === "auto-approved";
  const rejected = policy.status === "rejected";
  const riskVariant =
    remediation.risk === "high"
      ? "critical"
      : remediation.risk === "medium"
        ? "warning"
        : "healthy";

  async function handleApprove() {
    if (!onApprove || approved || rejected) return;
    setPending(true);
    setError(null);
    try {
      await onApprove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="border-status-warning/45 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--status-warning)_10%,transparent),transparent_32%)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-status-warning" aria-hidden />
          <CardTitle className="text-status-warning">Action required</CardTitle>
        </div>
        <Badge variant={approved ? "healthy" : rejected ? "critical" : "warning"}>
          {approved ? "Approved" : rejected ? "Rejected" : "Approval gate"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-[15px] font-semibold tracking-tight capitalize">
            {remediation.action} {remediation.target}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-status-critical/30 bg-status-critical/8 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Current
              </div>
              <div className="mono text-sm text-status-critical">
                {remediation.fromVersion}
              </div>
            </div>
            <div className="rounded-md border border-status-healthy/35 bg-status-healthy/8 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Target
              </div>
              <div className="mono text-sm text-status-healthy">
                {remediation.toVersion}
              </div>
            </div>
          </div>
        </div>

        <dl className="grid gap-3 md:grid-cols-2">
          <Fact label="Why" value={remediation.rationale} />
          <Fact
            label="Risk"
            value={`${remediation.risk} · ${remediation.estimatedImpact}`}
            badge={
              <Badge variant={riskVariant}>{remediation.risk} risk</Badge>
            }
          />
          <Fact
            label="Policy"
            value={`${policy.policyId}: ${policy.reason}`}
            badge={
              <Badge variant={approved ? "healthy" : "warning"}>
                {policy.approvals.length}/{policy.requiredApprovals} approvals
              </Badge>
            }
          />
          <Fact label="Expected outcome" value={remediation.estimatedImpact} />
          <Fact
            label="Executor"
            value={
              execution?.detail ??
              "Blocked until policy records the required approval"
            }
            badge={
              <Badge
                variant={
                  execution?.status === "completed"
                    ? "healthy"
                    : execution?.status === "failed"
                      ? "critical"
                      : execution?.status === "running" ||
                          execution?.status === "queued"
                        ? "info"
                        : "warning"
                }
              >
                {execution?.status ?? "blocked"}
              </Badge>
            }
          />
        </dl>

        <div className="rounded-md border border-border-subtle bg-muted/25 px-3 py-2.5">
          <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Verification
          </div>
          <ul className="space-y-1.5">
            {verification.checks.map((check) => (
              <li
                key={check.name}
                className="flex items-start justify-between gap-3 text-xs"
              >
                <span className="flex items-center gap-2">
                  <StatusDot
                    tone={
                      check.status === "passed"
                        ? "healthy"
                        : check.status === "failed"
                          ? "critical"
                          : "unknown"
                    }
                    label={check.status}
                  />
                  {check.name}
                </span>
                <span className="max-w-[55%] text-right text-[11px] text-muted-foreground">
                  {check.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled>
            Review changes
          </Button>
          <Button
            type="button"
            variant="warning"
            size="sm"
            disabled={pending || approved || rejected}
            onClick={() => void handleApprove()}
          >
            {pending
              ? "Approving…"
              : approved
                ? "Approved"
                : `Approve ${remediation.action}`}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            {execution?.detail
              ? execution.detail
              : approved
                ? "Policy authorized. Executor will run an allowlisted restart or rollback."
                : `Approval is live for ${incidentId}. The executor mutates only allowlisted deployments.`}
          </p>
          {error ? (
            <p className="w-full text-[11px] text-status-critical">{error}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Fact({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-background/40 px-3 py-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </dt>
        {badge}
      </div>
      <dd className="text-xs leading-relaxed text-foreground/90">{value}</dd>
    </div>
  );
}
