"use client";

import { useState } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const [whyOpen, setWhyOpen] = useState(true);

  return (
    <Card className="h-full border-status-warning/30">
      <CardHeader>
        <CardTitle className="text-status-warning">
          Recommended remediation
        </CardTitle>
        <Badge variant="warning">{remediation.risk} risk</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium capitalize">
            {remediation.action} {remediation.target}
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-md border border-border-subtle bg-muted/30 px-2.5 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Current
              </div>
              <div className="mono text-status-critical">
                {remediation.fromVersion}
              </div>
            </div>
            <div className="rounded-md border border-status-healthy/30 bg-status-healthy/5 px-2.5 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Target
              </div>
              <div className="mono text-status-healthy">
                {remediation.toVersion}
                <span className="ml-1.5 text-[10px] font-sans uppercase tracking-wide">
                  Verified healthy
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setWhyOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-md border border-border-subtle px-2.5 py-2 text-left text-xs hover:bg-accent/40"
          aria-expanded={whyOpen}
        >
          <span className="font-medium">Why this action?</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              whyOpen && "rotate-180"
            )}
          />
        </button>

        {whyOpen ? (
          <div className="space-y-2 rounded-md border border-border-subtle bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <p>{remediation.rationale}</p>
            <p>
              <span className="text-foreground">Expected outcome: </span>
              {remediation.estimatedImpact}
            </p>
            <div>
              <span className="text-foreground">Verification plan:</span>
              <ul className="mt-1 space-y-1">
                {verification.checks.map((check) => (
                  <li key={check.name} className="flex gap-2">
                    <span className="text-muted-foreground">•</span>
                    {check.name} — {check.detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        <div className="flex items-start gap-2 rounded-md border border-status-warning/25 bg-status-warning/5 px-2.5 py-2">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-warning" />
          <div className="text-xs">
            <div className="font-medium text-status-warning">
              Policy: approval required
            </div>
            <p className="mt-0.5 text-muted-foreground">{policy.reason}</p>
            <p className="mono mt-1 text-[10px] text-muted-foreground">
              {policy.policyId} · {policy.approvals.length}/
              {policy.requiredApprovals} approvals
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            Review changes
          </Button>
          <Button variant="warning" size="sm">
            Approve rollback
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Approval is UI-only in this phase. Mutations require policy → executor
          → verifier.
        </p>
      </CardContent>
    </Card>
  );
}
