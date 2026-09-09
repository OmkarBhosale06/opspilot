import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export default function ObservabilityPage() {
  return (
    <AppShell
      title="Observability"
      breadcrumb={<span>Platform / Observability</span>}
    >
      <PageHeader
        title="Observability"
        description="Metrics, logs, and alerts unified for incident response."
      />
      <EmptyState
        title="Coming in a later phase"
        description="Prometheus and Loki views will land here once the observation gateway is wired."
      />
    </AppShell>
  );
}
