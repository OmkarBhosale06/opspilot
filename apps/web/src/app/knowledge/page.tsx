import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export default function KnowledgePage() {
  return (
    <AppShell
      title="Knowledge"
      breadcrumb={<span>Platform / Knowledge</span>}
    >
      <PageHeader
        title="Knowledge"
        description="Runbooks, previous incidents, and architecture memory."
      />
      <EmptyState
        title="Coming in a later phase"
        description="Incident memory and runbook retrieval will power this space."
      />
    </AppShell>
  );
}
