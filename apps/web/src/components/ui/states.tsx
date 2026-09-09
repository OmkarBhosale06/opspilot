import { cn } from "@/lib/utils";
import type { StatusTone } from "@/components/ui/status-dot";
import { StatusDot } from "@/components/ui/status-dot";
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
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border px-4 py-10 text-center",
        className
      )}
    >
      <p className="text-sm text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-status-critical/30 bg-status-critical/5 px-3 py-3",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-status-critical">
        <StatusDot tone="critical" />
        {title}
      </div>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-8 animate-pulse rounded-md bg-muted"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}
