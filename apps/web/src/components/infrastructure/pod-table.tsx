"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { EmptyState } from "@/components/ui/states";
import { formatRelative, shortImage } from "@/lib/formatters";
import type { DeploymentDto, PodDto } from "@/types";

export function PodTable({ pods }: { pods: PodDto[] }) {
  if (pods.length === 0) {
    return (
      <EmptyState
        title="No pods"
        description="No pods found in this namespace, or the cluster is unreachable."
      />
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pod</TableHead>
            <TableHead>Phase</TableHead>
            <TableHead>Ready</TableHead>
            <TableHead>Restarts</TableHead>
            <TableHead>Node</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pods.map((pod) => {
            const tone = pod.ready
              ? "healthy"
              : pod.phase === "Pending"
                ? "warning"
                : "critical";
            return (
              <TableRow
                key={`${pod.namespace}/${pod.name}`}
                className={
                  tone === "critical"
                    ? "bg-status-critical/6"
                    : tone === "warning"
                      ? "bg-status-warning/5"
                      : undefined
                }
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusDot tone={tone} />
                    <div>
                      <div className="mono text-xs">{pod.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {pod.namespace}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tone === "healthy"
                        ? "healthy"
                        : tone === "warning"
                          ? "warning"
                          : "critical"
                    }
                  >
                    {pod.phase}
                  </Badge>
                </TableCell>
                <TableCell className="mono text-xs">
                  {pod.ready ? "Ready" : "Not ready"}
                </TableCell>
                <TableCell
                  className={
                    pod.restarts > 0
                      ? "mono text-xs text-status-warning"
                      : "mono text-xs"
                  }
                >
                  {pod.restarts}
                </TableCell>
                <TableCell className="mono text-xs text-muted-foreground">
                  {pod.node ?? "—"}
                </TableCell>
                <TableCell className="mono text-xs text-muted-foreground">
                  {pod.containers[0]
                    ? shortImage(pod.containers[0].image)
                    : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatRelative(pod.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function DeploymentTable({
  deployments,
  linkBase = "/deployments",
}: {
  deployments: DeploymentDto[];
  linkBase?: string;
}) {
  if (deployments.length === 0) {
    return (
      <EmptyState
        title="No deployments"
        description="No deployments found in this namespace."
      />
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Replicas</TableHead>
            <TableHead>Images</TableHead>
            <TableHead>Strategy</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deployments.map((dep) => {
            const healthy =
              dep.replicas > 0 && dep.readyReplicas >= dep.replicas;
            return (
              <TableRow
                key={`${dep.namespace}/${dep.name}`}
                className={healthy ? undefined : "bg-status-warning/6"}
              >
                <TableCell>
                  <Link
                    href={`${linkBase}/${encodeURIComponent(dep.name)}`}
                    className="mono text-xs text-foreground hover:text-ai hover:underline"
                  >
                    {dep.name}
                  </Link>
                  <div className="text-[10px] text-muted-foreground">
                    {dep.namespace}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="inline-flex items-center gap-1.5">
                    <StatusDot tone={healthy ? "healthy" : "warning"} />
                    <span className="mono">
                      {dep.readyReplicas}/{dep.replicas}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="mono text-muted-foreground">
                  {dep.images.map(shortImage).join(", ") || "—"}
                </TableCell>
                <TableCell>{dep.strategy ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatRelative(dep.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
