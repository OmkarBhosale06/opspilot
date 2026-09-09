import { describe, expect, it } from "vitest";
import type { V1Pod, V1Deployment, CoreV1Event } from "@kubernetes/client-node";
import {
  toPodDto,
  toDeploymentDto,
  toEventDto,
  watchPhaseToVerb,
} from "../clients/kubernetes/mappers.js";

describe("kubernetes mappers", () => {
  it("normalizes a ready pod without exposing secret values", () => {
    const dto = toPodDto({
      metadata: {
        name: "demo-api-abc",
        namespace: "opspilot",
        labels: { app: "demo-api" },
        creationTimestamp: new Date("2026-09-09T12:00:00Z"),
      },
      spec: {
        nodeName: "kind-control-plane",
        containers: [{ name: "demo-api", image: "nginx:1.27" }],
      },
      status: {
        phase: "Running",
        containerStatuses: [
          {
            name: "demo-api",
            ready: true,
            restartCount: 0,
            image: "nginx:1.27",
            imageID: "sha256:abc",
            containerID: "containerd://x",
            started: true,
            state: { running: { startedAt: new Date() } },
          },
        ],
      },
    } as V1Pod);

    expect(dto).toMatchObject({
      name: "demo-api-abc",
      namespace: "opspilot",
      phase: "Running",
      ready: true,
      restarts: 0,
      node: "kind-control-plane",
    });
    expect(JSON.stringify(dto)).not.toMatch(/kubeconfig|token|password/i);
  });

  it("marks waiting pods as not ready", () => {
    const dto = toPodDto({
      metadata: { name: "crash", namespace: "opspilot" },
      spec: { containers: [{ name: "app", image: "app:v1" }] },
      status: {
        phase: "Pending",
        containerStatuses: [
          {
            name: "app",
            ready: false,
            restartCount: 3,
            image: "app:v1",
            imageID: "",
            started: false,
            state: { waiting: { reason: "CrashLoopBackOff" } },
          },
        ],
      },
    } as V1Pod);

    expect(dto.ready).toBe(false);
    expect(dto.restarts).toBe(3);
    expect(dto.containerStatuses[0]?.state).toBe("waiting");
    expect(dto.containerStatuses[0]?.reason).toBe("CrashLoopBackOff");
  });

  it("normalizes deployments and events", () => {
    const dep = toDeploymentDto({
      metadata: { name: "demo-api", namespace: "opspilot" },
      spec: {
        replicas: 2,
        template: {
          spec: { containers: [{ name: "demo-api", image: "nginx:1.27" }] },
        },
        strategy: { type: "RollingUpdate" },
      },
      status: { readyReplicas: 2, availableReplicas: 2, updatedReplicas: 2 },
    } as V1Deployment);

    expect(dep.readyReplicas).toBe(2);
    expect(dep.images).toEqual(["nginx:1.27"]);

    const event = toEventDto({
      type: "Warning",
      reason: "BackOff",
      message: "Back-off restarting failed container",
      involvedObject: { kind: "Pod", name: "demo-api-abc", namespace: "opspilot" },
      count: 4,
      lastTimestamp: new Date("2026-09-09T12:01:00Z"),
      metadata: { namespace: "opspilot" },
    } as CoreV1Event);

    expect(event.object).toBe("Pod/demo-api-abc");
    expect(event.type).toBe("Warning");
    expect(watchPhaseToVerb("ADDED")).toBe("added");
  });
});
