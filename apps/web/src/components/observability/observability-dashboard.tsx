"use client";

import { Activity, FileSearch, Radio } from "lucide-react";
import {
  ErrorRateSparkline,
  demoErrorRateSeries,
} from "@/components/charts/error-rate-sparkline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { StatusDot } from "@/components/ui/status-dot";
import { formatTimestamp } from "@/lib/formatters";
import type { ObservabilityOverview } from "@/types";

function AvailabilityPill({
  label,
  available,
}: {
  label: string;
  available: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-[11px]">
      <StatusDot tone={available ? "healthy" : "warning"} />
      <span className="text-muted-foreground">{label}</span>
      <span className="mono text-foreground">
        {available ? "up" : "down"}
      </span>
    </div>
  );
}

export function ObservabilityDashboard({
  data,
}: {
  data: ObservabilityOverview;
}) {
  const series =
    data.errorRate.series.length > 0
      ? data.errorRate.series
      : demoErrorRateSeries(data.errorRate.current ?? 18.4);

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
        <AvailabilityPill label="Prometheus" available={data.prometheusAvailable} />
        <AvailabilityPill label="Loki" available={data.lokiAvailable} />
        <AvailabilityPill
          label={`${data.service} series`}
          available={data.errorRate.live}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Activity className="h-3.5 w-3.5 text-status-info" aria-hidden />
              Error rate
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {data.errorRate.live ? "live" : "seed"}
              </Badge>
              <span className="mono text-[10px] text-status-critical">
                {data.errorRate.current != null
                  ? `${data.errorRate.current.toFixed(1)}% 5xx`
                  : "—"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <ErrorRateSparkline
              data={series}
              critical={(data.errorRate.current ?? 0) > 5}
              className="h-24"
            />
            <pre className="mono max-h-16 overflow-auto rounded border border-border-subtle bg-background/50 px-2 py-1.5 text-[10px] text-muted-foreground">
              {data.errorRate.query}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Radio className="h-3.5 w-3.5 text-status-warning" aria-hidden />
              Alerts
            </CardTitle>
            <span className="text-[10px] text-muted-foreground">
              {data.alerts.length} active
            </span>
          </CardHeader>
          <CardContent>
            {data.alerts.length === 0 ? (
              <EmptyState
                title="No firing alerts"
                description={
                  data.prometheusAvailable
                    ? "Prometheus is up but no Alertmanager rules are loaded yet."
                    : "Start the observability stack to query alerts."
                }
                className="py-6"
              />
            ) : (
              <ul className="space-y-2">
                {data.alerts.map((alert) => (
                  <li
                    key={`${alert.name}-${alert.activeAt ?? alert.state}`}
                    className="rounded-md border border-border-subtle px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">{alert.name}</p>
                      <Badge variant="outline">{alert.state}</Badge>
                    </div>
                    {alert.summary ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {alert.summary}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileSearch className="h-3.5 w-3.5 text-status-warning" aria-hidden />
            Recent error logs
          </CardTitle>
          <span className="text-[10px] text-muted-foreground">
            {data.service} · last 30m
          </span>
        </CardHeader>
        <CardContent>
          {data.recentLogs.length === 0 ? (
            <EmptyState
              title="No log lines"
              description={
                data.lokiAvailable
                  ? "Loki is reachable but no matching panic/error lines yet."
                  : "Run make obs-up so demo-telemetry can push checkout-api panics."
              }
              className="py-6"
            />
          ) : (
            <ul className="max-h-80 space-y-1.5 overflow-auto">
              {data.recentLogs.map((line, idx) => (
                <li
                  key={`${line.timestamp}-${idx}`}
                  className="rounded border border-border-subtle bg-background/40 px-2.5 py-1.5"
                >
                  <div className="mono text-[10px] text-muted-foreground">
                    {formatTimestamp(line.timestamp)}
                  </div>
                  <pre className="mono mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/90">
                    {line.line}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
