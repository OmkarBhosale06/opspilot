"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
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

function strokeFor(tone: GraphNodeData["tone"]) {
  if (tone === "critical") return "#f43f5e";
  if (tone === "healthy") return "#22c55e";
  if (tone === "warning") return "#f59e0b";
  return "#3f3f46";
}

function InfraNode({ data }: { data: GraphNodeData }) {
  return (
    <div
      className={cn(
        "min-w-[148px] rounded-md border bg-card px-2.5 py-2",
        data.tone === "critical" && "border-status-critical/50 bg-status-critical/8",
        data.tone === "warning" && "border-status-warning/50 bg-status-warning/8",
        data.tone === "healthy" && "border-status-healthy/40 bg-status-healthy/6",
        data.tone === "info" && "border-status-info/30",
        (data.tone === "unknown" || !data.tone) && "border-border"
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <div className="flex items-center gap-1.5">
        <StatusDot tone={data.tone} pulse={data.tone === "critical"} />
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

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
        style: { stroke: "#52525b" },
      },
    ];

    deployments.forEach((d, i) => {
      const healthy = d.availableReplicas >= d.replicas && d.replicas > 0;
      const id = `dep-${d.name}`;
      const tone = healthy ? "healthy" : "critical";
      n.push({
        id,
        type: "infra",
        position: { x: 460, y: 40 + i * 120 },
        data: {
          label: d.name,
          kind: "deployment",
          tone,
          meta: `${d.readyReplicas}/${d.replicas}`,
        },
      });
      e.push({
        id: `e-ns-${d.name}`,
        source: `ns-${ns}`,
        target: id,
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
        style: { stroke: strokeFor(tone) },
      });

      const relatedPods = pods.filter(
        (p) =>
          p.labels?.app === d.name ||
          p.name.startsWith(d.name) ||
          Object.values(p.labels ?? {}).includes(d.name)
      );
      relatedPods.slice(0, 4).forEach((p, pi) => {
        const pid = `pod-${p.name}`;
        const podTone = p.ready ? "healthy" : "critical";
        n.push({
          id: pid,
          type: "infra",
          position: { x: 720, y: 40 + i * 120 + pi * 56 - 20 },
          data: {
            label: p.name,
            kind: "pod",
            tone: podTone,
            meta: p.phase,
          },
        });
        e.push({
          id: `e-${d.name}-${p.name}`,
          source: id,
          target: pid,
          style: { stroke: strokeFor(podTone) },
        });
      });
    });

    return { nodes: n, edges: e };
  }, [clusterId, namespaces, deployments, pods]);

  const onNodeClick = useCallback((_: unknown, node: Node<GraphNodeData>) => {
    setSelected(node.data);
  }, []);

  if (!ready) {
    return (
      <div className="h-[min(70vh,560px)] rounded-md border border-border bg-card" />
    );
  }

  return (
    <div className="flex h-[min(70vh,560px)] flex-col gap-3 lg:flex-row">
      <div className="min-h-[360px] flex-1 overflow-hidden rounded-md border border-border bg-card">
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
          <Background gap={16} size={1} color="#1b1b22" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => {
              const tone = (n.data as GraphNodeData)?.tone;
              return strokeFor(tone);
            }}
            maskColor="rgba(7,7,9,0.75)"
          />
        </ReactFlow>
      </div>
      <aside className="w-full rounded-md border border-border bg-card p-3 lg:w-64">
        <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Selection
        </div>
        {selected ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <StatusDot tone={selected.tone} />
              <span className="text-sm font-medium">{selected.label}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {selected.kind}
              {selected.meta ? ` · ${selected.meta}` : ""}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Select a node. Unhealthy objects use red edges so blast radius is
            visible without reading labels.
          </p>
        )}
      </aside>
    </div>
  );
}
