import { apiGet } from "@/lib/api";
import type { NamespaceDto } from "@/types";

type ListResponse<T> = { items: T[]; count?: number };

export async function listNamespaces() {
  const res = await apiGet<
    ListResponse<NamespaceDto> | NamespaceDto[] | { name: string }[]
  >("/api/namespaces");
  const items = Array.isArray(res) ? res : res.items;
  return items.map((n) =>
    typeof n === "string" ? { name: n } : { name: n.name, ...n }
  ) as NamespaceDto[];
}
