import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/formatters";
import type { SnapshotDto } from "@/types";

export function SnapshotDetail({ snapshot }: { snapshot: SnapshotDto }) {
  const healthy =
    snapshot.readyReplicas >= snapshot.replicas && snapshot.replicas > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snapshot detail</CardTitle>
        <Badge variant={healthy ? "healthy" : "critical"}>
          {healthy ? "verified healthy" : "unhealthy"}
        </Badge>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="ReplicaSet" value={snapshot.name} mono />
          <Field label="Revision" value={snapshot.revision ?? "—"} mono />
          <Field
            label="Replicas"
            value={`${snapshot.readyReplicas}/${snapshot.replicas}`}
            mono
          />
          <Field label="Owner" value={snapshot.owner ?? "—"} mono />
          <Field
            label="Created"
            value={formatTimestamp(snapshot.createdAt)}
          />
          <Field
            label="Container images"
            value={snapshot.images.join("\n") || "—"}
            mono
          />
        </dl>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Secret values are never displayed. Full ConfigMap/Secret references,
          probes, and Helm metadata land with the snapshot persistence phase.
        </p>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mono mt-0.5 whitespace-pre-wrap text-xs"
            : "mt-0.5 text-xs"
        }
      >
        {value}
      </dd>
    </div>
  );
}
