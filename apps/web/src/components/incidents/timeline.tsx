"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTimestamp } from "@/lib/formatters";
import type { TimelineEvent } from "@/types";

export function IncidentTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <ScrollArea className="h-full max-h-[420px] px-3 pb-3">
          <ol className="relative space-y-3 border-l border-border-subtle pl-4">
            {events.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[21px] top-1">
                  <StatusDot
                    tone={
                      event.severity === "critical"
                        ? "critical"
                        : event.severity === "warning"
                          ? "warning"
                          : "info"
                    }
                  />
                </span>
                <div className="mono text-[10px] text-muted-foreground">
                  {formatTimestamp(event.timestamp)} · {event.source}
                </div>
                <div className="text-xs text-foreground">{event.message}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {event.type}
                </div>
              </li>
            ))}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
