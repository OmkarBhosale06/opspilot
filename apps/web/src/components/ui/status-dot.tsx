import { cn } from "@/lib/utils";

const toneMap = {
  critical: "bg-status-critical",
  warning: "bg-status-warning",
  healthy: "bg-status-healthy",
  info: "bg-status-info",
  unknown: "bg-status-unknown",
  ai: "bg-ai",
} as const;

export type StatusTone = keyof typeof toneMap;

const toneLabel: Record<StatusTone, string> = {
  critical: "Critical",
  warning: "Warning",
  healthy: "Healthy",
  info: "Info",
  unknown: "Unknown",
  ai: "Agent active",
};

export function StatusDot({
  tone = "unknown",
  pulse = false,
  className,
  title,
  label,
}: {
  tone?: StatusTone;
  pulse?: boolean;
  className?: string;
  title?: string;
  label?: string;
}) {
  const text = label ?? title ?? toneLabel[tone];
  return (
    <span
      title={title ?? text}
      role="img"
      aria-label={text}
      className={cn(
        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        toneMap[tone],
        pulse && "animate-pulse",
        className
      )}
    />
  );
}
