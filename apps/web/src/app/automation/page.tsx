import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function AutomationPage() {
  return (
    <PhasePlaceholder
      title="Automation"
      description="Propose → authorize → execute → verify. No free-form kubectl."
      detail="Approve on the incident command center. The executor then runs an allowlisted restart or rollback and the verifier checks replica readiness."
    />
  );
}
