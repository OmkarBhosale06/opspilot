"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { AgentActivityItem } from "@/types";

const statusIcon = {
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  idle: Circle,
} as const;

export function AgentActivityPanel({
  items,
  title = "AI activity",
  className,
  dense = false,
}: {
  items: AgentActivityItem[];
  title?: string;
  className?: string;
  dense?: boolean;
}) {
  return (
    <Card className={cn("flex h-full flex-col border-ai/20", className)}>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-ai" />
          {title}
        </CardTitle>
        <StatusDot tone="ai" pulse={items.some((i) => i.status === "running")} />
      </CardHeader>
      <CardContent className={cn("flex-1 space-y-2", dense && "p-2")}>
        {items.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No agent activity yet
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const Icon = statusIcon[item.status];
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-md border border-border-subtle bg-muted/30 px-2.5 py-2"
                >
                  <div className="flex items-start gap-2">
                    <Icon
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                        item.status === "running" && "animate-spin text-ai",
                        item.status === "completed" && "text-status-healthy",
                        item.status === "failed" && "text-status-critical",
                        item.status === "idle" && "text-muted-foreground"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-medium">
                          {item.action}
                        </span>
                        <span className="mono ml-auto shrink-0 text-[10px] text-muted-foreground">
                          {formatRelative(item.timestamp)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="text-ai">{item.agent}</span>
                        {item.incidentId ? (
                          <span className="mono">{item.incidentId}</span>
                        ) : null}
                      </div>
                      {item.detail ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {item.detail}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
