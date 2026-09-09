import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function ObservabilityPage() {
  return (
    <PhasePlaceholder
      title="Observability"
      description="Prometheus and Loki will answer error rate, latency, and log evidence."
      detail="Adapters exist on the API. This screen stays empty until live queries attach to incidents. Use the command center error-rate and evidence panels until then."
    />
  );
}
