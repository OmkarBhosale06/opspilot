import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/formatters";
import type { Incident } from "@/types";

export function RelatedAndSimilar({ incident }: { incident: Incident }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Related revisions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(incident.relatedDeployments ?? []).map((dep) => (
            <Link
              key={`${dep.name}-${dep.version}`}
              href={`/deployments/${encodeURIComponent(dep.name)}`}
              className="flex items-center justify-between rounded-md border border-border-subtle px-2.5 py-2 text-xs transition-colors hover:bg-accent/40"
            >
              <div>
                <div className="font-medium">{dep.name}</div>
                <div className="mono text-[10px] text-muted-foreground">
                  {dep.version} · {formatTimestamp(dep.at)}
                </div>
              </div>
              <Badge
                variant={dep.status.includes("healthy") ? "healthy" : "warning"}
              >
                {dep.status}
              </Badge>
            </Link>
          ))}
          {(incident.relatedDeployments ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No related revisions linked.
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Similar incidents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(incident.similarIncidents ?? []).map((sim) => (
            <div
              key={sim.id}
              className="rounded-md border border-border-subtle px-2.5 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="mono text-muted-foreground">{sim.id}</span>
                <Badge variant="ai">
                  {Math.round(sim.similarity * 100)}% match
                </Badge>
              </div>
              <div className="mt-1 text-foreground">{sim.title}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                Resolved via {sim.resolution}
              </div>
            </div>
          ))}
          {(incident.similarIncidents ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No similar incidents in memory yet.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
