import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/components/ui/status-dot";
import { StatusDot } from "@/components/ui/status-dot";
import { Skeleton } from "@/components/ui/skeleton";
import type { IncidentStatus, Severity } from "@/types";

export function severityTone(severity: Severity): StatusTone {
  switch (severity) {
    case "SEV1":
      return "critical";
    case "SEV2":
      return "warning";
    case "SEV3":
      return "info";
    default:
      return "unknown";
  }
}

export function incidentStatusTone(status: IncidentStatus): StatusTone {
  switch (status) {
    case "open":
    case "investigating":
      return "critical";
    case "mitigating":
      return "warning";
    case "resolved":
    case "closed":
      return "healthy";
    default:
      return "unknown";
  }
}

export function EmptyState({
  title,
  description,
  className,
  action,
}: {
  title: string;
  description?: string;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start justify-center gap-2 rounded-md border border-dashed border-border bg-card/40 px-5 py-8",
        className
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Inbox className="h-3.5 w-3.5" aria-hidden />
        <p className="text-sm font-medium text-foreground">{title}</p>
      </div>
      {description ? (
        <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Control plane error",
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border border-status-critical/35 bg-status-critical/8 px-3 py-3",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-status-critical">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        <StatusDot tone="critical" label="Error" />
        {title}
      </div>
      {description ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: Math.min(4, rows) }).map((_, i) => (
          <Skeleton key={i} className="h-[72px]" />
        ))}
      </div>
      {rows > 4 ? <Skeleton className="h-48 w-full" /> : null}
    </div>
  );
}
