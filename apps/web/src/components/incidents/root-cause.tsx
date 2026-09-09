import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/formatters";
import type { RootCauseHypothesis } from "@/types";

export function RootCauseCard({ rootCause }: { rootCause: RootCauseHypothesis }) {
  const pct = Math.round(rootCause.confidence * 100);

  return (
    <Card className="h-full border-status-critical/40 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--status-critical)_8%,transparent),transparent_40%)]">
      <CardHeader>
        <CardTitle className="text-status-critical">Root cause</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Confidence
          </span>
          <span className="mono text-xs font-semibold text-foreground">
            {formatPercent(rootCause.confidence, 0)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="h-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Hypothesis confidence"
        >
          <div
            className="h-full rounded-full bg-status-critical"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[15px] font-medium leading-snug tracking-tight text-foreground">
          {rootCause.summary}
        </p>
        <dl className="grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Service
            </dt>
            <dd className="mono mt-0.5">{rootCause.service}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Change
            </dt>
            <dd className="mono mt-0.5">{rootCause.change}</dd>
          </div>
        </dl>
        <div>
          <div className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Contributing factors
          </div>
          <ul className="space-y-1.5">
            {rootCause.contributingFactors.map((factor) => (
              <li
                key={factor}
                className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
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
