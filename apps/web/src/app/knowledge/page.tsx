import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export default function KnowledgePage() {
  return (
    <AppShell title="Knowledge">
      <PageHeader
        title="Knowledge"
        description="Runbooks, previous incidents, and architecture memory."
      />
      <EmptyState
        title="Coming in a later phase"
        description="RAG over incident memory will power similar-incident recall on the command center."
      />
    </AppShell>
  );
}
