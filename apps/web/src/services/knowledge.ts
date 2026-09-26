import { apiGet } from "@/lib/api";
import type { KnowledgeOverview } from "@/types";

export function getKnowledge() {
  return apiGet<KnowledgeOverview>("/api/knowledge");
}
