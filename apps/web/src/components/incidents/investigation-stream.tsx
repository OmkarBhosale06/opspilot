"use client";

import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  Database,
  Boxes,
  FileSearch,
  Shield,
  GitBranch,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/formatters";
import type { InvestigationStep, OpsEvent } from "@/types";

const toolIcon = {
  k8s: Boxes,
  prometheus: Activity,
  loki: FileSearch,
  memory: Database,
  github: GitBranch,
  policy: Shield,
} as const;

function StepStatusIcon({ status }: { status: InvestigationStep["status"] }) {
  if (status === "running")
    return (
      <Loader2 className="h-3.5 w-3.5 animate-spin text-ai" aria-hidden />
    );
  if (status === "completed")
    return (
      <CheckCircle2
        className="h-3.5 w-3.5 text-status-healthy"
        aria-hidden
      />
    );
  if (status === "failed")
    return <XCircle className="h-3.5 w-3.5 text-status-critical" aria-hidden />;
  return <Circle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />;
}

export function InvestigationStream({
  steps,
  liveEvents = [],
  connected = false,
}: {
  steps: InvestigationStep[];
  liveEvents?: OpsEvent[];
  connected?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const live = liveEvents.find(
    (e) => e.type.startsWith("agent.") && e.status === "running"
  );

  const ordered = useMemo(() => steps, [steps]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [ordered.length, live?.message]);

  return (
    <Card className="flex h-full min-h-[420px] flex-col border-ai/25 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--ai)_6%,transparent),transparent_28%)]">
      <CardHeader>
        <CardTitle className="text-ai">AI investigation</CardTitle>
        <div className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <StatusDot
            tone="ai"
            pulse={connected || Boolean(live)}
            label={connected ? "Investigation live" : "Investigation idle"}
          />
          {connected ? "Streaming" : "Replay"}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        {live ? (
          <div
            className="shimmer mx-3 mt-3 rounded-md border border-ai/35 px-3 py-2"
            aria-live="polite"
          >
            <div className="text-[10px] uppercase tracking-[0.12em] text-ai">
              Live
            </div>
            <p className="mt-0.5 text-xs text-foreground">
              {live.message ?? live.step ?? live.type}
            </p>
          </div>
        ) : null}
        <ScrollArea className="h-full max-h-[440px] px-3 py-3">
          <ol className="relative space-y-0 border-l border-ai/20 pl-4">
            <AnimatePresence initial={false}>
              {ordered.map((step, index) => {
                const Icon = toolIcon[step.tool] ?? Circle;
                const running = step.status === "running";
                return (
                  <motion.li
                    key={step.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.03 }}
                    className="relative pb-3 last:pb-0"
                  >
                    <span className="absolute -left-[21px] top-2.5">
                      <StepStatusIcon status={step.status} />
                    </span>
                    <div
                      className={cn(
                        "rounded-md border px-3 py-2",
                        running
                          ? "border-ai/40 bg-ai/10"
                          : "border-border-subtle bg-background/40"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className="h-3 w-3 text-muted-foreground"
                          aria-hidden
                        />
                        <span className="mono text-[11px] font-medium">
                          {step.step}
                        </span>
                        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                          {step.tool}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {step.summary}
                      </p>
                      <div className="mono mt-1 text-[10px] text-muted-foreground">
                        {formatRelative(step.completedAt ?? step.startedAt)} ·{" "}
                        {step.status}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            <div ref={bottomRef} />
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
