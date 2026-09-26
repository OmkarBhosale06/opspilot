"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { KnowledgeDashboard } from "@/components/knowledge/knowledge-dashboard";
import { ErrorState, LoadingBlock } from "@/components/ui/states";
import { getKnowledge } from "@/services/knowledge";
import { ApiError } from "@/lib/api";

export default function KnowledgePage() {
  const knowledge = useQuery({
    queryKey: ["knowledge"],
    queryFn: getKnowledge,
    refetchInterval: 12_000,
  });

  return (
    <AppShell title="Knowledge">
      <PageHeader
        title="Knowledge"
        description="Persisted incidents and similar-incident recall. Survives API restarts when Postgres is up."
      />
      {knowledge.isLoading ? <LoadingBlock rows={5} /> : null}
      {knowledge.isError ? (
        <ErrorState
          title="Unable to load knowledge"
          description={
            knowledge.error instanceof ApiError
              ? knowledge.error.message
              : "API unreachable. Start the control plane on :4000."
          }
        />
      ) : null}
      {knowledge.data ? <KnowledgeDashboard data={knowledge.data} /> : null}
    </AppShell>
  );
}
