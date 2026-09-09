"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import type { PolicyState, RemediationPlan, VerificationState } from "@/types";

export function RemediationCard({
  remediation,
  policy,
  verification,
}: {
  remediation: RemediationPlan;
  policy: PolicyState;
  verification: VerificationState;
}) {
  const riskVariant =
    remediation.risk === "high"
      ? "critical"
      : remediation.risk === "medium"
        ? "warning"
        : "healthy";

  return (
    <Card className="border-status-warning/45 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--status-warning)_10%,transparent),transparent_32%)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-status-warning" aria-hidden />
          <CardTitle className="text-status-warning">Action required</CardTitle>
        </div>
        <Badge variant="warning">Approval gate</Badge>
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
              <Badge variant="warning">
                {policy.approvals.length}/{policy.requiredApprovals} approvals
              </Badge>
            }
          />
          <Fact label="Expected outcome" value={remediation.estimatedImpact} />
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
          <Button type="button" variant="outline" size="sm">
            Review changes
          </Button>
          <Button type="button" variant="warning" size="sm">
            Approve rollback
          </Button>
          <p className="text-[10px] text-muted-foreground">
            UI-only this phase. Executor will not mutate until policy authorizes.
          </p>
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
