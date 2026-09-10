import type { Config } from "../config/env.js";
import type { Incident, RemediationPlan } from "../repositories/incidents.js";

export const ALLOWED_ACTIONS = ["restart", "rollback"] as const;

export type AllowedAction = (typeof ALLOWED_ACTIONS)[number];

export type PolicyDecision = {
  allowed: boolean;
  policyId: string;
  reason: string;
  action: AllowedAction | null;
  deployment: string | null;
  namespace: string;
};

export function mutationNamespaces(config: Config): string[] {
  const raw = config.MUTATION_NAMESPACES?.trim();
  if (!raw) return [config.NAMESPACE];
  return raw
    .split(",")
    .map((ns) => ns.trim())
    .filter(Boolean);
}

export function parseDeploymentTarget(
  target: string,
  fallback: string
): string {
  const trimmed = target.trim();
  const match = trimmed.match(/^(?:deployment\/)?([A-Za-z0-9][A-Za-z0-9.-]*)$/);
  return match?.[1] ?? fallback;
}

export function isAllowedAction(
  action: RemediationPlan["action"]
): action is AllowedAction {
  return (ALLOWED_ACTIONS as readonly string[]).includes(action);
}

export function evaluatePolicy(
  incident: Incident,
  config: Config
): PolicyDecision {
  const namespace = incident.namespace;
  const allowedNs = mutationNamespaces(config);
  const deployment = parseDeploymentTarget(
    incident.remediation.target,
    incident.service
  );
  const action = isAllowedAction(incident.remediation.action)
    ? incident.remediation.action
    : null;

  if (
    incident.policy.status !== "approved" &&
    incident.policy.status !== "auto-approved"
  ) {
    return {
      allowed: false,
      policyId: incident.policy.policyId,
      reason: `Policy ${incident.policy.policyId} has not authorized mutation (${incident.policy.status})`,
      action,
      deployment,
      namespace,
    };
  }

  if (!action) {
    return {
      allowed: false,
      policyId: incident.policy.policyId,
      reason: `Action ${incident.remediation.action} is not in the executor allowlist`,
      action: null,
      deployment,
      namespace,
    };
  }

  if (!allowedNs.includes(namespace)) {
    return {
      allowed: false,
      policyId: "mutation-namespace-allowlist",
      reason: `Namespace ${namespace} is not in MUTATION_NAMESPACES`,
      action,
      deployment,
      namespace,
    };
  }

  if (!deployment) {
    return {
      allowed: false,
      policyId: incident.policy.policyId,
      reason: "Remediation target is not a deployment",
      action,
      deployment: null,
      namespace,
    };
  }

  return {
    allowed: true,
    policyId: incident.policy.policyId,
    reason: `${incident.policy.policyId} authorized ${action} of ${namespace}/${deployment}`,
    action,
    deployment,
    namespace,
  };
}
