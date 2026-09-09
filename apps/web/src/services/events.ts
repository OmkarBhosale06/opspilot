import { apiGet } from "@/lib/api";
import type { K8sEventDto } from "@/types";

type ListResponse<T> = { items: T[]; count?: number; namespace?: string };

export async function listEvents(namespace?: string) {
  const qs = namespace ? `?namespace=${encodeURIComponent(namespace)}` : "";
  const res = await apiGet<ListResponse<K8sEventDto> | K8sEventDto[]>(
    `/api/events${qs}`
  );
  return Array.isArray(res) ? res : res.items;
}
