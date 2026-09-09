import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function AutomationPage() {
  return (
    <PhasePlaceholder
      title="Automation"
      description="Propose → authorize → execute → verify. No free-form kubectl."
      detail="Approval currently lives on the incident command center. Executor and verifier are not implemented yet."
    />
  );
}
