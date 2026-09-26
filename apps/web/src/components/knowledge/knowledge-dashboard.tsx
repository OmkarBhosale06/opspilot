"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { StatusDot } from "@/components/ui/status-dot";
import { formatTimestamp } from "@/lib/formatters";
import type { KnowledgeOverview } from "@/types";

export function KnowledgeDashboard({ data }: { data: KnowledgeOverview }) {
  return (
    <div className="space-y-4">
      {data.message ? (
        <div
          role="status"
          className="rounded-md border border-status-warning/30 bg-status-warning/8 px-3 py-2 text-xs leading-relaxed text-status-warning"
        >
          {data.message}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Pill label="Postgres" ok={data.postgres} />
        <Pill label="Redis" ok={data.redis} />
        <Pill label="Remembered" ok={data.remembered > 0} value={String(data.remembered)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-ai" aria-hidden />
            Resolved memory
          </CardTitle>
          <Badge variant={data.status === "live" ? "healthy" : "warning"}>
            {data.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recent.length === 0 ? (
            <EmptyState
              title="Nothing remembered yet"
              description="Resolve an incident after make data-up. Similar recall uses lexical overlap on title, service, and root cause — not embeddings yet."
            />
          ) : (
            data.recent.map((row) => (
              <Link
                key={row.id}
                href={`/incidents/${encodeURIComponent(row.id)}`}
                className="flex items-start justify-between gap-3 rounded-md border border-border-subtle px-3 py-2 text-xs transition-colors hover:bg-accent/40"
              >
                <div>
                  <div className="mono text-[10px] text-muted-foreground">
                    {row.id} · {row.service}
                  </div>
                  <div className="mt-0.5 font-medium">{row.title}</div>
                  <div className="mt-0.5 text-muted-foreground">
                    {row.resolution} · {formatTimestamp(row.updatedAt)}
                  </div>
                </div>
                <Badge variant="healthy">{row.status}</Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Pill({
  label,
  ok,
  value,
}: {
  label: string;
  ok: boolean;
  value?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-[11px]">
      <StatusDot tone={ok ? "healthy" : "warning"} />
      <span className="text-muted-foreground">{label}</span>
      <span className="mono text-foreground">{value ?? (ok ? "up" : "down")}</span>
    </div>
  );
}
