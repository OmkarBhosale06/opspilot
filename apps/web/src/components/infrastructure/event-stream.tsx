"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelative, formatTimestamp } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { K8sEventDto } from "@/types";

export function EventStream({
  events,
  maxHeight = "480px",
}: {
  events: K8sEventDto[];
  maxHeight?: string;
}) {
  return (
    <ScrollArea style={{ maxHeight }} className="w-full">
      <div className="divide-y divide-border-subtle">
        {events.map((event, idx) => {
          const warning = event.type === "Warning";
          return (
            <div
              key={`${event.object}-${event.reason}-${event.lastTimestamp}-${idx}`}
              className="flex gap-3 px-3 py-2.5"
            >
              <div
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  warning ? "bg-status-warning" : "bg-status-info"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={warning ? "warning" : "info"}>
                    {event.reason}
                  </Badge>
                  <span className="mono text-[11px] text-muted-foreground">
                    {event.object}
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {formatRelative(event.lastTimestamp)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-foreground/90">{event.message}</p>
                <div className="mono mt-1 text-[10px] text-muted-foreground">
                  {event.namespace} · count {event.count} ·{" "}
                  {formatTimestamp(event.lastTimestamp)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
