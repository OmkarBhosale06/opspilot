import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowRight, GitCommit, Layers, Activity, AlertTriangle, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Incident } from "@/types";

type Stage = {
  id: string;
  label: string;
  value: string;
  hint: string;
  href?: string;
  tone: "muted" | "critical" | "warning" | "healthy" | "ai";
  icon: ComponentType<{ className?: string }>;
};

export function CausalChain({ incident }: { incident: Incident }) {
  const diff = incident.evidence.find((e) => e.kind === "diff");
  const deploy = incident.relatedDeployments?.find((d) =>
    d.status.toLowerCase().includes("degraded")
  );
  const healthy = incident.relatedDeployments?.find((d) =>
    d.status.toLowerCase().includes("healthy")
  );

  const stages: Stage[] = [
    {
      id: "git",
      label: "Git",
      value: diff?.data && typeof diff.data === "object" && "pr" in diff.data
        ? `PR #${String((diff.data as { pr: number }).pr)}`
        : "Change merged",
      hint: diff?.title ?? "Code change",
      tone: "muted",
      icon: GitCommit,
    },
    {
      id: "deploy",
      label: "Deploy",
      value: deploy
        ? `${deploy.name}:${deploy.version}`
        : incident.rootCause.change,
      hint: "Rolled out to production",
      href: `/deployments/${encodeURIComponent(incident.service)}`,
      tone: "warning",
      icon: Layers,
    },
    {
      id: "health",
      label: "Health",
      value: `${incident.errorRate.toFixed(1)}% 5xx`,
      hint: "Error budget breached",
      tone: "critical",
      icon: Activity,
    },
    {
      id: "incident",
      label: "Incident",
      value: incident.id,
      hint: incident.status,
      tone: "critical",
      icon: AlertTriangle,
    },
    {
      id: "rollback",
      label: "Rollback",
      value:
        incident.policy.status === "pending"
          ? `${incident.remediation.toVersion} blocked`
          : `${incident.remediation.toVersion}`,
      hint: healthy
        ? `Last healthy ${healthy.version}`
        : incident.remediation.action,
      tone: incident.policy.status === "pending" ? "ai" : "healthy",
      icon: Undo2,
    },
  ];

  return (
    <nav
      aria-label="Causal chain from change to rollback"
      className="overflow-x-auto rounded-md border border-border bg-card px-3 py-3"
    >
      <ol className="flex min-w-[720px] items-stretch gap-0">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const inner = (
            <div
              className={cn(
                "flex h-full min-w-0 flex-1 flex-col gap-1 rounded-md border px-2.5 py-2",
                stage.tone === "critical" &&
                  "border-status-critical/50 bg-status-critical/10 ring-1 ring-status-critical/20",
                stage.tone === "warning" &&
                  "border-status-warning/45 bg-status-warning/10",
                stage.tone === "healthy" &&
                  "border-status-healthy/35 bg-status-healthy/8",
                stage.tone === "ai" && "border-ai/45 bg-ai/12 ring-1 ring-ai/20",
                stage.tone === "muted" && "border-border-subtle bg-muted/25 opacity-90"
              )}
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <Icon className="h-3 w-3" aria-hidden />
                {stage.label}
              </div>
              <div className="mono truncate text-xs font-medium">
                {stage.value}
              </div>
              <div className="truncate text-[10px] text-muted-foreground">
                {stage.hint}
              </div>
            </div>
          );

          return (
            <li key={stage.id} className="flex min-w-0 flex-1 items-center">
              {stage.href ? (
                <Link
                  href={stage.href}
                  className="min-w-0 flex-1 rounded-md focus-visible:outline-none"
                >
                  {inner}
                </Link>
              ) : (
                <div className="min-w-0 flex-1">{inner}</div>
              )}
              {index < stages.length - 1 ? (
                <ArrowRight
                  className="mx-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
