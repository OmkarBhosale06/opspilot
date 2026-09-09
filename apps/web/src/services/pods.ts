import { apiGet } from "@/lib/api";
import type { PodDto } from "@/types";

type ListResponse<T> = { items: T[]; count?: number; namespace?: string };

export async function listPods(namespace?: string) {
  const qs = namespace ? `?namespace=${encodeURIComponent(namespace)}` : "";
  const res = await apiGet<ListResponse<PodDto> | PodDto[]>(`/api/pods${qs}`);
  return Array.isArray(res) ? res : res.items;
}

export function getPod(name: string, namespace?: string) {
  const qs = namespace ? `?namespace=${encodeURIComponent(namespace)}` : "";
  return apiGet<PodDto>(`/api/pods/${encodeURIComponent(name)}${qs}`);
}
