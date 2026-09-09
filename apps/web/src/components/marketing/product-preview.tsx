"use client";

import { useState } from "react";

const TABS = ["Graph", "Pods", "Deployments", "Events"] as const;

const MEMORY = [
  {
    kind: "Failure pattern",
    meta: "9× · accelerating",
    service: "payments-api",
    copy: "Retry storm when settlement-engine times out under load.",
  },
  {
    kind: "Failure pattern",
    meta: "6× · recurring",
    service: "checkout-worker",
    copy: "CrashLoopBackOff correlates with ConfigMap reloads after deploy.",
  },
  {
    kind: "Business context",
    meta: "domain rule",
    service: "settlement-engine",
    copy: "Daily settlement must finish before the 5pm ET cutoff — late runs are revenue-impacting.",
  },
];

export function ProductPreview() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Graph");

  return (
    <div className="relative mx-auto mt-16 grid w-full max-w-5xl items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0e]/90 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Production cortex</p>
            <p className="mt-0.5 text-sm font-medium">cluster-prod · us-east-1</p>
          </div>
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-300">
            live
          </span>
        </div>
        <div className="flex gap-1 border-b border-white/8 px-3 py-2">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-full px-3 py-1 text-[12px] transition-colors ${
                tab === item ? "bg-white text-black" : "text-white/50 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="space-y-3 p-4">
          {tab === "Graph" ? (
            <>
              <NodeRow name="ingress-nginx" status="healthy" detail="12 replicas · p99 84ms" />
              <NodeRow name="payments-api" status="critical" detail="5xx 4.2% · crashloop on 3 pods" />
              <NodeRow name="settlement-engine" status="warning" detail="timeout 2.1s · queue depth 1.8k" />
              <NodeRow name="fraud-detector" status="healthy" detail="lag 12s · rules v2.14" />
            </>
          ) : null}
          {tab === "Pods" ? (
            <>
              <NodeRow name="payments-api-7f2a" status="critical" detail="CrashLoopBackOff · 14 restarts" />
              <NodeRow name="payments-api-9c11" status="warning" detail="OOMKilled · last 4m" />
              <NodeRow name="checkout-worker-3ab0" status="healthy" detail="Ready · 2d uptime" />
            </>
          ) : null}
          {tab === "Deployments" ? (
            <>
              <NodeRow name="payments-api" status="warning" detail="v2.18.4 → v2.19.1 · 18m ago" />
              <NodeRow name="checkout-worker" status="healthy" detail="v1.4.0 · stable" />
            </>
          ) : null}
          {tab === "Events" ? (
            <>
              <NodeRow name="FailedScheduling" status="warning" detail="insufficient cpu · node-pool-b" />
              <NodeRow name="BackOff" status="critical" detail="payments-api container crash" />
              <NodeRow name="ScalingReplicaSet" status="healthy" detail="ingress-nginx scaled to 12" />
            </>
          ) : null}
        </div>
      </div>

      <aside className="rounded-2xl border border-white/10 bg-[#0b0b0e]/80 p-4 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">See memory</p>
          <span className="text-[11px] text-white/30">System patterns</span>
        </div>
        <div className="space-y-3">
          {MEMORY.map((item) => (
            <article key={item.service} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-white/45">{item.kind}</p>
                <p className="text-[11px] text-white/30">{item.meta}</p>
              </div>
              <p className="mt-1 font-mono text-[12px] text-white/90">{item.service}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-white/55">{item.copy}</p>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}

function NodeRow({
  name,
  status,
  detail,
}: {
  name: string;
  status: "healthy" | "warning" | "critical";
  detail: string;
}) {
  const color =
    status === "critical"
      ? "bg-rose-400"
      : status === "warning"
        ? "bg-amber-400"
        : "bg-emerald-400";

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
        <span className="font-mono text-[12px]">{name}</span>
      </div>
      <span className="text-[11px] text-white/40">{detail}</span>
    </div>
  );
}
