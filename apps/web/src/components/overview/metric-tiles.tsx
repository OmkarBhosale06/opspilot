import { Card, CardContent } from "@/components/ui/card";
import { StatusDot, type StatusTone } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";

export function MetricTile({
  label,
  value,
  hint,
  tone = "unknown",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <StatusDot tone={tone} />
        </div>
        <div className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </div>
        {hint ? (
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
