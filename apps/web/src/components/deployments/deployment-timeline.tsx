"use client";

import Link from "next/link";
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
        const healthy =
          d.availableReplicas >= d.replicas && d.replicas > 0;
        return (
          <Link
            key={`${d.namespace}/${d.name}`}
            href={`/deployments/${encodeURIComponent(d.name)}`}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent/40"
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

export function SnapshotTimeline({
  name,
  snapshots,
}: {
  name: string;
  snapshots: SnapshotDto[];
}) {
  return (
    <div className="relative space-y-0 pl-4">
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
      {snapshots.map((snap, idx) => {
        const healthy =
          snap.readyReplicas >= snap.replicas && snap.replicas > 0;
        const latest = idx === 0;
        return (
          <div key={snap.name} className="relative pb-6 last:pb-0">
            <div
              className={cn(
                "absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                healthy ? "bg-status-healthy" : "bg-status-critical"
              )}
            />
            <div className="rounded-md border border-border bg-card px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono text-sm font-medium">
                  rev {snap.revision ?? "?"}
                </span>
                <Badge
                  variant={
                    latest
                      ? healthy
                        ? "healthy"
                        : "critical"
                      : healthy
                        ? "healthy"
                        : "warning"
                  }
                >
                  {latest
                    ? healthy
                      ? "current · healthy"
                      : "current · failed"
                    : healthy
                      ? "verified healthy"
                      : "unhealthy"}
                </Badge>
              </div>
              <div className="mono mt-1 text-[11px] text-muted-foreground">
                {snap.images.map(shortImage).join(", ") || "—"}
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
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
                  Inspect snapshot
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
