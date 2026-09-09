"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { EmptyState } from "@/components/ui/states";
import { formatRelative, formatTimestamp } from "@/lib/formatters";
import type { K8sEventDto } from "@/types";
import { cn } from "@/lib/utils";

export function LiveEvents({
  events,
  live = false,
  error,
}: {
  events: K8sEventDto[];
  live?: boolean;
  error?: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Live events</CardTitle>
        {live ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] text-status-healthy">
            <StatusDot tone="healthy" pulse />
            Live
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1.5">
        {error ? (
          <p className="text-xs text-status-warning">{error}</p>
        ) : null}
        {events.length === 0 && !error ? (
          <EmptyState
            title="No recent events"
            description="Cluster events will stream here when available."
            className="border-0 py-8"
          />
        ) : (
          events.slice(0, 12).map((event, idx) => (
            <div
              key={`${event.object}-${event.reason}-${event.lastTimestamp}-${idx}`}
              className="rounded-md border border-border-subtle px-2.5 py-2"
            >
              <div className="flex items-center gap-2">
                <StatusDot
                  tone={event.type === "Warning" ? "warning" : "info"}
                />
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    event.type === "Warning"
                      ? "text-status-warning"
                      : "text-foreground"
                  )}
                >
                  {event.reason}
                </span>
                <span className="mono ml-auto text-[10px] text-muted-foreground">
                  {formatRelative(event.lastTimestamp)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                {event.message}
              </p>
              <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">
                <span className="mono">{event.object}</span>
                <span>·</span>
                <span>{formatTimestamp(event.lastTimestamp)}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
