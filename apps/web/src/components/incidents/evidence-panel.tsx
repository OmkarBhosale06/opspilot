import {
  Activity,
  FileSearch,
  Boxes,
  GitBranch,
  AudioLines,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { EvidenceItem } from "@/types";

const kindMeta = {
  metric: {
    icon: Activity,
    label: "Metric",
    className: "border-status-info/35 bg-status-info/6",
    iconClass: "text-status-info",
  },
  log: {
    icon: FileSearch,
    label: "Log",
    className: "border-status-warning/35 bg-status-warning/6",
    iconClass: "text-status-warning",
  },
  k8s: {
    icon: Boxes,
    label: "Cluster",
    className: "border-status-healthy/30 bg-status-healthy/6",
    iconClass: "text-status-healthy",
  },
  diff: {
    icon: GitBranch,
    label: "Change",
    className: "border-border bg-muted/40",
    iconClass: "text-foreground",
  },
  trace: {
    icon: AudioLines,
    label: "Trace",
    className: "border-border-subtle bg-muted/20",
    iconClass: "text-muted-foreground",
  },
} as const;

function snippet(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const rec = data as Record<string, unknown>;
  if (typeof rec.snippet === "string") return rec.snippet;
  if (typeof rec.query === "string") return rec.query;
  if (typeof rec.change === "string") return rec.change;
  return null;
}

export function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) {
  return (
    <Card className="h-full border-status-info/20">
      <CardHeader>
        <CardTitle className="text-status-info">Evidence</CardTitle>
        <span className="text-[10px] text-muted-foreground">
          Observed · not inferred
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {evidence.map((item) => {
          const meta = kindMeta[item.kind] ?? kindMeta.k8s;
          const Icon = meta.icon;
          const extra = snippet(item.data);
          return (
            <article
              key={item.id}
              className={cn("rounded-md border px-3 py-2.5", meta.className)}
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", meta.iconClass)}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-medium">{item.title}</h4>
                    <Badge variant="outline">{meta.label}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {item.summary}
                  </p>
                  {extra ? (
                    <pre className="mono mt-2 max-h-20 overflow-auto rounded border border-border-subtle bg-background/50 px-2 py-1.5 text-[10px] leading-relaxed text-foreground/90">
                      {extra}
                    </pre>
                  ) : null}
                  <div className="mono mt-1.5 text-[10px] text-muted-foreground">
                    {item.source} · {formatTimestamp(item.timestamp)}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}
