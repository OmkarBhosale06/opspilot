"use client";

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
import { cn } from "@/lib/utils";
import type { InvestigationStep } from "@/types";

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
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-ai" />;
  if (status === "completed")
    return <CheckCircle2 className="h-3.5 w-3.5 text-status-healthy" />;
  if (status === "failed")
    return <XCircle className="h-3.5 w-3.5 text-status-critical" />;
  return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function InvestigationStream({
  steps,
}: {
  steps: InvestigationStep[];
}) {
  return (
    <Card className="flex h-full min-h-0 flex-col border-ai/20">
      <CardHeader>
        <CardTitle className="text-ai">Investigation stream</CardTitle>
        <span className="text-[10px] text-muted-foreground">
          OpsPilot is investigating
        </span>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <ScrollArea className="h-full max-h-[420px] px-3 pb-3">
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {steps.map((step) => {
                const Icon = toolIcon[step.tool] ?? Circle;
                return (
                  <motion.div
                    key={step.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "rounded-md border px-3 py-2",
                      step.status === "running"
                        ? "border-ai/40 bg-ai/5"
                        : "border-border-subtle bg-muted/20"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <StepStatusIcon status={step.status} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3 w-3 text-muted-foreground" />
                          <span className="mono text-[11px] font-medium">
                            {step.step}
                          </span>
                          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                            {step.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {step.summary}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
