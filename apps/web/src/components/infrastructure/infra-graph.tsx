"use client";

import { useMemo, useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { StatusDot } from "@/components/ui/status-dot";
import type { DeploymentDto, NamespaceDto, PodDto } from "@/types";
import { cn } from "@/lib/utils";

type GraphNodeData = {
  label: string;
  kind: string;
  tone: "healthy" | "warning" | "critical" | "info" | "unknown";
  meta?: string;
};

function InfraNode({ data }: { data: GraphNodeData }) {
  return (
    <div
      className={cn(
        "min-w-[140px] rounded-md border bg-card px-2.5 py-2 shadow-none",
        data.tone === "critical"
          ? "border-status-critical/40"
          : data.tone === "warning"
            ? "border-status-warning/40"
            : data.tone === "healthy"
              ? "border-status-healthy/30"
              : "border-border"
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <div className="flex items-center gap-1.5">
        <StatusDot tone={data.tone} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {data.kind}
        </span>
      </div>
      <div className="mt-0.5 truncate text-xs font-medium">{data.label}</div>
      {data.meta ? (
        <div className="mono mt-0.5 truncate text-[10px] text-muted-foreground">
          {data.meta}
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  );
}

const nodeTypes = { infra: InfraNode };

export function InfraGraph({
  clusterId,
  namespaces,
  deployments,
  pods,
}: {
  clusterId: string;
  namespaces: NamespaceDto[];
  deployments: DeploymentDto[];
  pods: PodDto[];
}) {
  const [selected, setSelected] = useState<GraphNodeData | null>(null);

  const { nodes, edges } = useMemo(() => {
    const ns =
      namespaces.find((n) => n.name === "opspilot")?.name ??
      namespaces[0]?.name ??
      "opspilot";

    const n: Node<GraphNodeData>[] = [
      {
        id: "cluster",
        type: "infra",
        position: { x: 0, y: 180 },
        data: {
          label: clusterId,
          kind: "cluster",
          tone: "info",
        },
      },
      {
        id: `ns-${ns}`,
        type: "infra",
        position: { x: 220, y: 180 },
        data: {
          label: ns,
          kind: "namespace",
          tone: "info",
        },
      },
    ];

    const e: Edge[] = [
      {
        id: "e-cluster-ns",
        source: "cluster",
        target: `ns-${ns}`,
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
        style: { stroke: "#3f3f46" },
      },
    ];

    deployments.forEach((d, i) => {
      const healthy = d.availableReplicas >= d.replicas && d.replicas > 0;
      const id = `dep-${d.name}`;
      n.push({
        id,
        type: "infra",
        position: { x: 460, y: 40 + i * 120 },
        data: {
          label: d.name,
          kind: "deployment",
          tone: healthy ? "healthy" : "critical",
          meta: `${d.readyReplicas}/${d.replicas}`,
        },
      });
      e.push({
        id: `e-ns-${d.name}`,
        source: `ns-${ns}`,
        target: id,
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
        style: { stroke: "#3f3f46" },
      });

      const relatedPods = pods.filter(
        (p) =>
          p.labels?.app === d.name ||
          p.name.startsWith(d.name) ||
          Object.values(p.labels ?? {}).includes(d.name)
      );
      relatedPods.slice(0, 4).forEach((p, pi) => {
        const pid = `pod-${p.name}`;
        n.push({
          id: pid,
          type: "infra",
          position: { x: 720, y: 40 + i * 120 + pi * 56 - 20 },
          data: {
            label: p.name,
            kind: "pod",
            tone: p.ready ? "healthy" : "critical",
            meta: p.phase,
          },
        });
        e.push({
          id: `e-${d.name}-${p.name}`,
          source: id,
          target: pid,
          style: { stroke: "#3f3f46" },
        });
      });
    });

    return { nodes: n, edges: e };
  }, [clusterId, namespaces, deployments, pods]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node<GraphNodeData>) => {
      setSelected(node.data);
    },
    []
  );

  return (
    <div className="flex h-[560px] flex-col gap-3 lg:flex-row">
      <div className="min-h-[400px] flex-1 overflow-hidden rounded-md border border-border bg-card">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          onNodeClick={onNodeClick}
          proOptions={{ hideAttribution: true }}
          minZoom={0.4}
          maxZoom={1.5}
        >
          <Background gap={16} size={1} color="#27272a" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => {
              const tone = (n.data as GraphNodeData)?.tone;
              if (tone === "critical") return "#ef4444";
              if (tone === "healthy") return "#22c55e";
              if (tone === "warning") return "#f59e0b";
              return "#71717a";
            }}
            maskColor="rgba(9,9,11,0.7)"
          />
        </ReactFlow>
      </div>
      <aside className="w-full rounded-md border border-border bg-card p-3 lg:w-64">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Selection
        </div>
        {selected ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <StatusDot tone={selected.tone} />
              <span className="text-sm font-medium">{selected.label}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Kind: {selected.kind}
            </div>
            {selected.meta ? (
              <div className="mono text-xs text-muted-foreground">
                {selected.meta}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Click a node to inspect health context for investigation.
          </p>
        )}
      </aside>
    </div>
  );
}
