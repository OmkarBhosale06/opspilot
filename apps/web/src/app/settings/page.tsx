import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function SettingsPage() {
  return (
    <PhasePlaceholder
      title="Settings"
      description="Models, integrations, and audit stay server-side."
      detail="Kubeconfig never reaches the browser. Cluster and CORS are configured on the API."
    />
  );
}
