"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  GitCommit,
  Layers,
  Undo2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { formatRelative, formatTimestamp, shortImage } from "@/lib/formatters";
import type { DeploymentDto, SnapshotDto } from "@/types";
import { cn } from "@/lib/utils";

export function DeploymentList({
  deployments,
}: {
  deployments: DeploymentDto[];
}) {
  return (
    <div className="space-y-2">
      {deployments.map((d) => {
        const healthy = d.availableReplicas >= d.replicas && d.replicas > 0;
        return (
          <Link
            key={`${d.namespace}/${d.name}`}
            href={`/deployments/${encodeURIComponent(d.name)}`}
            className={cn(
              "flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2.5 transition-colors hover:bg-accent/40",
              healthy ? "border-border" : "border-status-critical/35"
            )}
          >
            <div className="flex items-center gap-2.5">
              <StatusDot tone={healthy ? "healthy" : "critical"} />
              <div>
                <div className="text-sm font-medium">{d.name}</div>
                <div className="mono text-[11px] text-muted-foreground">
                  {d.images[0] ? shortImage(d.images[0]) : "—"} ·{" "}
                  {d.readyReplicas}/{d.replicas} ready
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={healthy ? "healthy" : "critical"}>
                {healthy ? "healthy" : "degraded"}
              </Badge>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {formatRelative(d.createdAt)}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

const STAGE_COPY: Record<
  string,
  { label: string; tone: "critical" | "healthy" | "warning" | "muted"; story: string }
> = {
  "43": {
    label: "Incident window",
    tone: "critical",
    story: "Git → rollout → 5xx spike → INC-1042. Rollback to v42 proposed.",
  },
  "42": {
    label: "Last verified healthy",
    tone: "healthy",
    story: "Stable baseline. Rollback target.",
  },
  "41": {
    label: "Prior revision",
    tone: "muted",
    story: "Previously healthy history.",
  },
};

export function SnapshotTimeline({
  name,
  snapshots,
}: {
  name: string;
  snapshots: SnapshotDto[];
}) {
  return (
    <div className="relative space-y-0 pl-5">
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" aria-hidden />
      {snapshots.map((snap, idx) => {
        const replicaOk =
          snap.readyReplicas >= snap.replicas && snap.replicas > 0;
        const latest = idx === 0;
        const stage = snap.revision ? STAGE_COPY[snap.revision] : undefined;
        const tone = stage?.tone ?? (replicaOk ? "healthy" : "critical");

        return (
          <div key={snap.name} className="relative pb-5 last:pb-0">
            <div
              className={cn(
                "absolute -left-5 top-2 h-2.5 w-2.5 rounded-full border-2 border-background",
                tone === "critical" && "bg-status-critical",
                tone === "healthy" && "bg-status-healthy",
                tone === "warning" && "bg-status-warning",
                tone === "muted" && "bg-status-unknown"
              )}
            />
            <article
              className={cn(
                "rounded-md border bg-card px-3 py-2.5",
                tone === "critical" && "border-status-critical/40",
                tone === "healthy" && "border-status-healthy/30",
                tone === "muted" && "border-border"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono text-sm font-medium">
                  rev {snap.revision ?? "?"}
                </span>
                <Badge
                  variant={
                    tone === "critical"
                      ? "critical"
                      : tone === "healthy"
                        ? "healthy"
                        : "outline"
                  }
                >
                  {latest
                    ? tone === "critical"
                      ? "current · incident"
                      : replicaOk
                        ? "current · healthy"
                        : "current · degraded"
                    : stage?.label ?? (replicaOk ? "verified healthy" : "unhealthy")}
                </Badge>
              </div>
              <div className="mono mt-1 text-[11px] text-muted-foreground">
                {snap.images.map(shortImage).join(", ") || "—"}
              </div>
              {stage ? (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {stage.story}
                </p>
              ) : null}
              {snap.revision === "43" && name.includes("checkout") ? (
                <ol className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  <li className="inline-flex items-center gap-1">
                    <GitCommit className="h-3 w-3" /> PR #884
                  </li>
                  <li aria-hidden>→</li>
                  <li className="inline-flex items-center gap-1">
                    <Layers className="h-3 w-3" /> deploy v43
                  </li>
                  <li aria-hidden>→</li>
                  <li className="inline-flex items-center gap-1 text-status-critical">
                    <Activity className="h-3 w-3" /> 18.4% 5xx
                  </li>
                  <li aria-hidden>→</li>
                  <li className="inline-flex items-center gap-1 text-status-critical">
                    <AlertTriangle className="h-3 w-3" /> INC-1042
                  </li>
                  <li aria-hidden>→</li>
                  <li className="inline-flex items-center gap-1 text-ai">
                    <Undo2 className="h-3 w-3" /> rollback v42
                  </li>
                </ol>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                <span>
                  {snap.readyReplicas}/{snap.replicas} ready
                </span>
                <span title={formatTimestamp(snap.createdAt)}>
                  {formatRelative(snap.createdAt)}
                </span>
                <Link
                  href={`/deployments/${encodeURIComponent(name)}?snapshot=${encodeURIComponent(snap.name)}`}
                  className="text-ai hover:underline"
                >
                  Inspect
                </Link>
                {snap.revision === "43" ? (
                  <Link href="/incidents/INC-1042" className="text-status-critical hover:underline">
                    Open incident
                  </Link>
                ) : null}
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}
