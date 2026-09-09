import { requireK8s } from "./client.js";

export type NamespaceDto = {
  name: string;
  status: string;
  labels: Record<string, string>;
  createdAt: string | null;
};

export async function listNamespaces(): Promise<NamespaceDto[]> {
  const { core } = requireK8s();
  const res = await core.listNamespace();
  return (res.items ?? []).map((ns) => ({
    name: ns.metadata?.name ?? "unknown",
    status: ns.status?.phase ?? "Unknown",
    labels: ns.metadata?.labels ?? {},
    createdAt: ns.metadata?.creationTimestamp
      ? new Date(ns.metadata.creationTimestamp).toISOString()
      : null,
  }));
}
