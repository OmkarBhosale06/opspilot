import { apiGet } from "@/lib/api";
import type { DeploymentDto, SnapshotDto } from "@/types";

type ListResponse<T> = { items: T[]; count?: number; namespace?: string };

export async function listDeployments(namespace?: string) {
  const qs = namespace ? `?namespace=${encodeURIComponent(namespace)}` : "";
  const res = await apiGet<ListResponse<DeploymentDto> | DeploymentDto[]>(
    `/api/deployments${qs}`
  );
  return Array.isArray(res) ? res : res.items;
}

export function getDeployment(name: string, namespace?: string) {
  const qs = namespace ? `?namespace=${encodeURIComponent(namespace)}` : "";
  return apiGet<DeploymentDto>(
    `/api/deployments/${encodeURIComponent(name)}${qs}`
  );
}

export async function getDeploymentSnapshots(name: string, namespace?: string) {
  const qs = namespace ? `?namespace=${encodeURIComponent(namespace)}` : "";
  const res = await apiGet<ListResponse<SnapshotDto> | SnapshotDto[]>(
    `/api/deployments/${encodeURIComponent(name)}/snapshots${qs}`
  );
  return Array.isArray(res) ? res : res.items;
}
