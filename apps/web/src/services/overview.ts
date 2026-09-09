import { apiGet } from "@/lib/api";
import type { OverviewResponse } from "@/types";

export function getOverview() {
  return apiGet<OverviewResponse>("/api/overview");
}
