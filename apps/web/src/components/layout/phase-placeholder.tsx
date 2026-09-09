import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export function PhasePlaceholder({
  title,
  description,
  detail,
}: {
  title: string;
  description: string;
  detail: string;
}) {
  return (
    <AppShell title={title}>
      <PageHeader title={title} description={description} />
      <EmptyState
        title="Not wired in this phase"
        description={detail}
        action={
          <Link
            href="/incidents/INC-1042"
            className="text-xs text-ai hover:underline"
          >
            Open INC-1042 command center
          </Link>
        }
      />
    </AppShell>
  );
}
