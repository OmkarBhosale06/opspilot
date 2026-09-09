import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import type { PolicyState, VerificationState } from "@/types";

export function PolicyExecutionState({
  policy,
  verification,
  executionStatus = "blocked",
}: {
  policy: PolicyState;
  verification: VerificationState;
  executionStatus?: "blocked" | "queued" | "running" | "completed" | "failed";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy · Execution · Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row
          label="Policy"
          tone={
            policy.status === "pending"
              ? "warning"
              : policy.status === "approved" || policy.status === "auto-approved"
                ? "healthy"
                : "critical"
          }
          value={policy.status}
          detail={policy.policyId}
        />
        <Row
          label="Execution"
          tone={
            executionStatus === "blocked"
              ? "warning"
              : executionStatus === "completed"
                ? "healthy"
                : executionStatus === "failed"
                  ? "critical"
                  : "info"
          }
          value={executionStatus}
          detail="Awaiting authorization"
        />
        <Row
          label="Verification"
          tone={
            verification.status === "passed"
              ? "healthy"
              : verification.status === "failed"
                ? "critical"
                : verification.status === "in_progress"
                  ? "info"
                  : "unknown"
          }
          value={verification.status.replace("_", " ")}
          detail={`${verification.checks.filter((c) => c.status === "passed").length}/${verification.checks.length} checks`}
        />
        <div className="space-y-1.5 border-t border-border-subtle pt-2">
          {verification.checks.map((check) => (
            <div
              key={check.name}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="text-muted-foreground">{check.name}</span>
              <Badge
                variant={
                  check.status === "passed"
                    ? "healthy"
                    : check.status === "failed"
                      ? "critical"
                      : "outline"
                }
              >
                {check.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "critical" | "warning" | "healthy" | "info" | "unknown";
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <StatusDot tone={tone} />
        <div>
          <div className="text-xs font-medium">{label}</div>
          <div className="mono text-[10px] text-muted-foreground">{detail}</div>
        </div>
      </div>
      <Badge
        variant={
          tone === "healthy"
            ? "healthy"
            : tone === "warning"
              ? "warning"
              : tone === "critical"
                ? "critical"
                : tone === "info"
                  ? "info"
                  : "outline"
        }
      >
        {value}
      </Badge>
    </div>
  );
}
