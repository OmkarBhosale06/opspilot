import type { FastifyBaseLogger } from "fastify";
import type { Config } from "../config/env.js";
import type { EventBus } from "../events/bus.js";
import { createFnLog } from "../logging.js";
import {
  incidentStore,
  type ExecutionState,
  type Incident,
  type VerificationState,
} from "../repositories/incidents.js";
import { nowIso } from "../utils/time.js";
import { evaluatePolicy } from "./policy.js";
import type { KubernetesMonitorService } from "./kubernetes-monitor.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function executorEnabled(config: Config): boolean {
  const flag = String(config.ENABLE_EXECUTOR ?? "1");
  return !["0", "false"].includes(flag);
}

export class RemediationPipeline {
  private readonly inflight = new Map<string, Promise<void>>();
  private readonly flog;

  constructor(
    private readonly config: Config,
    private readonly k8s: KubernetesMonitorService,
    private readonly bus: EventBus,
    log?: FastifyBaseLogger
  ) {
    this.flog = createFnLog(log);
  }

  enqueue(incidentId: string): Promise<void> {
    const existing = this.inflight.get(incidentId);
    if (existing) return existing;
    const run = this.execute(incidentId).finally(() => {
      this.inflight.delete(incidentId);
    });
    this.inflight.set(incidentId, run);
    return run;
  }

  private publish(
    incident: Incident,
    type: "remediation.updated" | "verification.updated",
    status: string,
    message: string
  ) {
    this.bus.publish({
      type,
      incidentId: incident.id,
      clusterId: this.config.CLUSTER_ID,
      namespace: incident.namespace,
      timestamp: nowIso(),
      status,
      message,
    });
  }

  private patchExecution(
    id: string,
    execution: ExecutionState,
    extra?: Partial<Incident>
  ): Incident | undefined {
    return incidentStore.patch(id, (current) => ({
      ...current,
      ...extra,
      updatedAt: nowIso(),
      execution,
      timeline: extra?.timeline ?? current.timeline,
    }));
  }

  private async execute(incidentId: string): Promise<void> {
    const incident = incidentStore.get(incidentId);
    if (!incident) return;

    if (!executorEnabled(this.config)) {
      this.patchExecution(incidentId, {
        ...incident.execution,
        status: "blocked",
        detail: "Executor disabled (ENABLE_EXECUTOR=0)",
      });
      return;
    }

    const decision = evaluatePolicy(incident, this.config);
    if (!decision.allowed || !decision.action || !decision.deployment) {
      const next = this.patchExecution(
        incidentId,
        {
          status: "failed",
          action: decision.action,
          detail: decision.reason,
          startedAt: nowIso(),
          completedAt: nowIso(),
        },
        {
          timeline: [
            ...incident.timeline,
            {
              id: `${incidentId}-exec-denied`,
              timestamp: nowIso(),
              type: "remediation.denied",
              message: decision.reason,
              source: "policy",
              severity: "warning",
            },
          ],
        }
      );
      if (next) this.publish(next, "remediation.updated", "failed", decision.reason);
      return;
    }

    const startedAt = nowIso();
    const queued = this.patchExecution(
      incidentId,
      {
        status: "running",
        action: decision.action,
        detail: `Executing allowlisted ${decision.action} on ${decision.namespace}/${decision.deployment}`,
        startedAt,
        completedAt: null,
      },
      {
        status: "mitigating",
        timeline: [
          ...incident.timeline,
          {
            id: `${incidentId}-exec-start`,
            timestamp: startedAt,
            type: "remediation.started",
            message: `${decision.action} ${decision.namespace}/${decision.deployment} (policy ${decision.policyId})`,
            source: "executor",
            severity: "info",
          },
        ],
      }
    );
    if (queued) {
      this.publish(
        queued,
        "remediation.updated",
        "running",
        queued.execution.detail
      );
    }

    try {
      const result =
        decision.action === "rollback"
          ? await this.k8s.rollbackDeployment(
              decision.deployment,
              decision.namespace
            )
          : await this.k8s.restartDeployment(
              decision.deployment,
              decision.namespace
            );

      const mutated = incidentStore.patch(incidentId, (current) => ({
        ...current,
        updatedAt: nowIso(),
        execution: {
          status: "running",
          action: decision.action,
          detail: result.detail,
          startedAt,
          completedAt: null,
        },
        timeline: [
          ...current.timeline,
          {
            id: `${incidentId}-exec-applied`,
            timestamp: nowIso(),
            type: "remediation.applied",
            message: result.detail,
            source: "executor",
            severity: "info",
          },
        ],
      }));
      if (mutated) {
        this.publish(mutated, "remediation.updated", "running", result.detail);
      }
      await this.verify(incidentId, decision.deployment, decision.namespace);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.flog.warn("RemediationPipeline.execute", "mutation failed", {
        incidentId,
        err: message,
      });
      const failed = this.patchExecution(
        incidentId,
        {
          status: "failed",
          action: decision.action,
          detail: message,
          startedAt,
          completedAt: nowIso(),
        },
        {
          timeline: [
            ...(incidentStore.get(incidentId)?.timeline ?? incident.timeline),
            {
              id: `${incidentId}-exec-failed`,
              timestamp: nowIso(),
              type: "remediation.failed",
              message,
              source: "executor",
              severity: "critical",
            },
          ],
        }
      );
      if (failed) {
        this.publish(failed, "remediation.updated", "failed", message);
      }
    }
  }

  private async verify(
    incidentId: string,
    deployment: string,
    namespace: string
  ): Promise<void> {
    const started = incidentStore.patch(incidentId, (current) => ({
      ...current,
      updatedAt: nowIso(),
      verification: {
        ...current.verification,
        status: "in_progress",
      },
    }));
    if (started) {
      this.publish(
        started,
        "verification.updated",
        "in_progress",
        `Verifying ${namespace}/${deployment}`
      );
    }

    const deadline = Date.now() + this.config.VERIFY_TIMEOUT_MS;
    let last: { ready: boolean; crashloop: boolean; detail: string } | null =
      null;

    while (Date.now() <= deadline) {
      last = await this.snapshotHealth(deployment, namespace);
      if (last.ready && last.crashloop === false) break;
      await sleep(this.config.VERIFY_POLL_MS);
    }

    const health =
      last ??
      (await this.snapshotHealth(deployment, namespace).catch(() => ({
        ready: false,
        crashloop: true,
        detail: "Verification could not read cluster state",
      })));
    const passed = health.ready && !health.crashloop;
    const completedAt = nowIso();
    const current = incidentStore.get(incidentId);
    if (!current) return;

    const checks: VerificationState["checks"] = current.verification.checks.map(
      (check) => {
        if (/ready|replica/i.test(check.name)) {
          return {
            ...check,
            status: health.ready ? "passed" : "failed",
            detail: health.detail,
          };
        }
        if (/crash|backoff|imagepull/i.test(check.name)) {
          return {
            ...check,
            status: health.crashloop ? "failed" : "passed",
            detail: health.crashloop
              ? "Pods still CrashLoopBackOff / ImagePullBackOff"
              : "No CrashLoopBackOff / ImagePullBackOff observed",
          };
        }
        return {
          ...check,
          status: passed ? "passed" : check.status,
          detail: passed
            ? "Recorded after allowlisted mutation"
            : check.detail,
        };
      }
    );

    const next = incidentStore.patch(incidentId, (inc) => ({
      ...inc,
      updatedAt: completedAt,
      status: passed ? "resolved" : "mitigating",
      resolvedAt: passed ? completedAt : inc.resolvedAt,
      execution: {
        ...inc.execution,
        status: passed ? "completed" : "failed",
        completedAt,
        detail: health.detail,
      },
      verification: {
        status: passed ? "passed" : "failed",
        checks,
        completedAt,
      },
      timeline: [
        ...inc.timeline,
        {
          id: `${incidentId}-verify`,
          timestamp: completedAt,
          type: passed ? "verification.passed" : "verification.failed",
          message: health.detail,
          source: "verifier",
          severity: passed ? "info" : "warning",
        },
      ],
    }));
    if (next) {
      this.publish(
        next,
        "verification.updated",
        next.verification.status,
        health.detail
      );
      this.publish(
        next,
        "remediation.updated",
        next.execution.status,
        health.detail
      );
    }
  }

  private async snapshotHealth(deployment: string, namespace: string) {
    const dep = await this.k8s.getDeployment(deployment, namespace);
    const pods = await this.k8s.listPods(namespace);
    const owned = pods.filter(
      (pod) =>
        pod.labels.app === deployment ||
        pod.name.startsWith(`${deployment}-`)
    );
    const crashloop = owned.some((pod) =>
      pod.containerStatuses.some((c) =>
        /CrashLoopBackOff|ImagePullBackOff|ErrImagePull|Error/i.test(
          c.reason ?? ""
        )
      )
    );
    const desired = dep.replicas || owned.length;
    const readyPods = owned.filter((p) => p.ready).length;
    const ready =
      desired > 0 &&
      readyPods >= desired &&
      dep.readyReplicas >= desired &&
      dep.availableReplicas >= desired &&
      !crashloop;
    return {
      ready,
      crashloop,
      detail: `${namespace}/${deployment} ready ${dep.readyReplicas}/${desired}${
        crashloop ? " (crashloop still present)" : ""
      }`,
    };
  }
}
