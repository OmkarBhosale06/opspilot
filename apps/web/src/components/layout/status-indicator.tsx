"use client";

import { useClusterHealth } from "@/hooks/use-cluster-health";
import { StatusDot } from "@/components/ui/status-dot";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function StatusIndicator() {
  const { connection, data, isError } = useClusterHealth();

  const label =
    connection === "connected"
      ? "Connected"
      : connection === "degraded"
        ? "Degraded"
        : "Disconnected";

  const tone =
    connection === "connected"
      ? "healthy"
      : connection === "degraded"
        ? "warning"
        : "critical";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px]",
            isError && "border-status-critical/30"
          )}
        >
          <StatusDot
            tone={tone}
            pulse={connection !== "disconnected"}
          />
          <span className="text-muted-foreground">{label}</span>
          {data?.cluster ? (
            <span className="mono text-foreground/80">{data.cluster}</span>
          ) : null}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {data
          ? `K8s ${data.k8sConnected ? "reachable" : "unreachable"} · ${data.status}`
          : isError
            ? "API unreachable"
            : "Checking control plane…"}
      </TooltipContent>
    </Tooltip>
  );
}
