import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export default function AutomationPage() {
  return (
    <AppShell
      title="Automation"
      breadcrumb={<span>Platform / Automation</span>}
    >
      <PageHeader
        title="Automation"
        description="Proposed actions, approvals, executions, and policies."
      />
      <EmptyState
        title="Coming in a later phase"
        description="Policy-gated remediation workflows will appear here."
      />
    </AppShell>
  );
}
