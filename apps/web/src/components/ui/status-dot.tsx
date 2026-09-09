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

export function StatusDot({
  tone = "unknown",
  pulse = false,
  className,
  title,
}: {
  tone?: StatusTone;
  pulse?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        toneMap[tone],
        pulse && "animate-pulse",
        className
      )}
    />
  );
}
