"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ObservabilityDashboard } from "@/components/observability/observability-dashboard";
import { ErrorState, LoadingBlock } from "@/components/ui/states";
import { getObservabilityOverview } from "@/services/observability";
import { ApiError } from "@/lib/api";

export default function ObservabilityPage() {
  const overview = useQuery({
    queryKey: ["observability", "overview", "checkout-api"],
    queryFn: () => getObservabilityOverview("checkout-api"),
    refetchInterval: 10_000,
  });

  return (
    <AppShell title="Observability">
      <PageHeader
        title="Observability"
        description="Prometheus metrics and Loki logs for the active investigation surface."
      />

      {overview.isLoading ? <LoadingBlock rows={6} /> : null}
      {overview.isError ? (
        <ErrorState
          title="Unable to load observability"
          description={
            overview.error instanceof ApiError
              ? overview.error.message
              : "API unreachable. Start the control plane on :4000."
          }
        />
      ) : null}

      {overview.data ? <ObservabilityDashboard data={overview.data} /> : null}
    </AppShell>
  );
}
