import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/formatters";
import type { RootCauseHypothesis } from "@/types";

export function RootCauseCard({ rootCause }: { rootCause: RootCauseHypothesis }) {
  return (
    <Card className="h-full border-status-critical/25">
      <CardHeader>
        <CardTitle className="text-status-critical">Root cause</CardTitle>
        <Badge variant="critical">
          {formatPercent(rootCause.confidence, 0)} confidence
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-foreground">
          {rootCause.summary}
        </p>
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Service
            </div>
            <div className="mono">{rootCause.service}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Change
            </div>
            <div className="mono">{rootCause.change}</div>
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Contributing factors
          </div>
          <ul className="space-y-1">
            {rootCause.contributingFactors.map((factor) => (
              <li
                key={factor}
                className="flex gap-2 text-xs text-muted-foreground"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-status-warning" />
                {factor}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
