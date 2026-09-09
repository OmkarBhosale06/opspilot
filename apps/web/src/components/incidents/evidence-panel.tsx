import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/formatters";
import type { EvidenceItem } from "@/types";

export function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Evidence</CardTitle>
        <span className="mono text-[11px] text-muted-foreground">
          {evidence.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {evidence.map((item) => (
          <div
            key={item.id}
            className="flex gap-2 rounded-md border border-border-subtle px-2.5 py-2"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-healthy" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium">{item.title}</span>
                <Badge variant="outline">{item.kind}</Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {item.summary}
              </p>
              <div className="mono mt-1 text-[10px] text-muted-foreground">
                {item.source} · {formatTimestamp(item.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
