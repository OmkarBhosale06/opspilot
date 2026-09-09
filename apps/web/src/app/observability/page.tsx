import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export default function ObservabilityPage() {
  return (
    <AppShell title="Observability">
      <PageHeader
        title="Observability"
        description="Metrics, logs, and alerts — Prometheus and Loki adapters next."
      />
      <EmptyState
        title="Coming in a later phase"
        description="This screen will answer: what is the error rate, latency, and log evidence for the active incident?"
      />
    </AppShell>
  );
}
