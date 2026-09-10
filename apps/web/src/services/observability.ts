import { apiGet } from "@/lib/api";
import type {
  IncidentTelemetry,
  ObservabilityOverview,
  ObservabilityStatus,
} from "@/types";

export function getObservabilityStatus() {
  return apiGet<ObservabilityStatus>("/api/observability/status");
}

export function getObservabilityOverview(service = "checkout-api") {
  const qs = new URLSearchParams({ service });
  return apiGet<ObservabilityOverview>(
    `/api/observability/overview?${qs.toString()}`
  );
}

export function getIncidentTelemetry(id: string) {
  return apiGet<IncidentTelemetry>(`/api/incidents/${id}/telemetry`);
}
