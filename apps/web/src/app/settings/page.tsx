import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <PageHeader
        title="Settings"
        description="Models, integrations, RBAC, and audit logs."
      />
      <EmptyState
        title="Coming in a later phase"
        description="Control-plane configuration stays server-side. Kubeconfig never reaches the browser."
      />
    </AppShell>
  );
}
