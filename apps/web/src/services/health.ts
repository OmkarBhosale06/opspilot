import { apiGet } from "@/lib/api";
import type { HealthResponse } from "@/types";

export function getHealth() {
  return apiGet<HealthResponse>("/api/health");
}
