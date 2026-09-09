import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" breadcrumb={<span>Platform / Settings</span>}>
      <PageHeader
        title="Settings"
        description="Models, integrations, RBAC, and audit configuration."
      />
      <EmptyState
        title="Coming in a later phase"
        description="Control-plane configuration will be managed here."
      />
    </AppShell>
  );
}
