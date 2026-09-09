import * as k8s from "@kubernetes/client-node";
import { KubernetesUnavailableError, isNotFound } from "../../types/errors.js";
import type { AppLogger } from "../../logging.js";
import { timed } from "../../logging.js";
import type {
  ClusterDto,
  DeploymentDto,
  K8sEventDto,
  NamespaceDto,
  PodDto,
  PodLogsDto,
  ServiceDto,
  SnapshotDto,
} from "../../types/dto.js";
import {
  toDeploymentDto,
  toEventDto,
  toNamespaceDto,
  toPodDto,
  toServiceDto,
  toSnapshotDto,
} from "./mappers.js";

export type KubernetesApis = {
  kc: k8s.KubeConfig;
  core: k8s.CoreV1Api;
  apps: k8s.AppsV1Api;
  watch: k8s.Watch;
};

export class KubernetesClient {
  private apis: KubernetesApis | null = null;
  private loadError: string | null = null;
  private liveConnected = false;

  constructor(
    private readonly clusterId: string,
    private readonly log?: AppLogger
  ) {}

  loadFromKubeConfig(): void {
    const kc = new k8s.KubeConfig();
    try {
      kc.loadFromDefault();
      this.apis = {
        kc,
        core: kc.makeApiClient(k8s.CoreV1Api),
        apps: kc.makeApiClient(k8s.AppsV1Api),
        watch: new k8s.Watch(kc),
      };
      this.liveConnected = true;
      this.loadError = null;
    } catch (err) {
      this.apis = null;
      this.liveConnected = false;
      this.loadError =
        err instanceof Error ? err.message : "Failed to load kubeconfig";
    }
  }

  get connected(): boolean {
    return this.liveConnected && this.apis !== null;
  }

  get lastError(): string | null {
    return this.loadError;
  }

  getWatch(): k8s.Watch {
    return this.requireApis().watch;
  }

  describeCluster(defaultNamespace: string): ClusterDto {
    const context = this.apis?.kc.getCurrentContext() ?? null;
    const cluster = context
      ? this.apis?.kc.getCluster(this.apis.kc.getCurrentCluster()?.name ?? "")
      : undefined;
    const current = this.apis?.kc.getCurrentCluster();
    return {
      id: this.clusterId,
      context,
      server: current?.server ?? cluster?.server ?? null,
      connected: this.connected,
      defaultNamespace,
    };
  }

  async probe(): Promise<boolean> {
    if (!this.apis) {
      this.liveConnected = false;
      return false;
    }
    try {
      await timed(
        this.log,
        { client: "k8s", op: "probe" },
        "k8s probe",
        () => this.apis!.core.listNamespace({ limit: 1 })
      );
      this.liveConnected = true;
      this.loadError = null;
      return true;
    } catch (err) {
      this.liveConnected = false;
      this.loadError =
        err instanceof Error ? err.message : "Kubernetes API unreachable";
      return false;
    }
  }

  markDisconnected(message: string): void {
    this.liveConnected = false;
    this.loadError = message;
  }

  async listNamespaces(): Promise<NamespaceDto[]> {
    const { core } = this.requireApis();
    const res = await timed(
      this.log,
      { client: "k8s", op: "listNamespaces" },
      "k8s listNamespaces",
      () => core.listNamespace()
    );
    return (res.items ?? []).map(toNamespaceDto);
  }

  async listPods(namespace: string): Promise<PodDto[]> {
    const { core } = this.requireApis();
    const res = await timed(
      this.log,
      { client: "k8s", op: "listPods", namespace },
      "k8s listPods",
      () => core.listNamespacedPod({ namespace })
    );
    return (res.items ?? []).map(toPodDto);
  }

  async getPod(name: string, namespace: string): Promise<PodDto | null> {
    const { core } = this.requireApis();
    try {
      const pod = await timed(
        this.log,
        { client: "k8s", op: "getPod", name, namespace },
        "k8s getPod",
        () => core.readNamespacedPod({ name, namespace })
      );
      return toPodDto(pod);
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async getPodLogs(
    name: string,
    namespace: string,
    options: { container?: string; tailLines?: number } = {}
  ): Promise<PodLogsDto | null> {
    const { core } = this.requireApis();
    try {
      const text = await timed(
        this.log,
        { client: "k8s", op: "getPodLogs", name, namespace },
        "k8s getPodLogs",
        () =>
          core.readNamespacedPodLog({
            name,
            namespace,
            container: options.container,
            tailLines: options.tailLines ?? 200,
          })
      );
      const body = typeof text === "string" ? text : String(text ?? "");
      return {
        pod: name,
        namespace,
        container: options.container ?? null,
        lines: body.length ? body.replace(/\n$/, "").split("\n") : [],
      };
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async listDeployments(namespace: string): Promise<DeploymentDto[]> {
    const { apps } = this.requireApis();
    const res = await timed(
      this.log,
      { client: "k8s", op: "listDeployments", namespace },
      "k8s listDeployments",
      () => apps.listNamespacedDeployment({ namespace })
    );
    return (res.items ?? []).map(toDeploymentDto);
  }

  async getDeployment(
    name: string,
    namespace: string
  ): Promise<DeploymentDto | null> {
    const { apps } = this.requireApis();
    try {
      const dep = await timed(
        this.log,
        { client: "k8s", op: "getDeployment", name, namespace },
        "k8s getDeployment",
        () => apps.readNamespacedDeployment({ name, namespace })
      );
      return toDeploymentDto(dep);
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async listDeploymentSnapshots(
    name: string,
    namespace: string
  ): Promise<SnapshotDto[]> {
    const { apps } = this.requireApis();
    const res = await timed(
      this.log,
      { client: "k8s", op: "listReplicaSets", name, namespace },
      "k8s listReplicaSets",
      () => apps.listNamespacedReplicaSet({ namespace })
    );
    return (res.items ?? [])
      .filter((rs) =>
        (rs.metadata?.ownerReferences ?? []).some(
          (o) => o.kind === "Deployment" && o.name === name
        )
      )
      .map(toSnapshotDto)
      .sort((a, b) => Number(b.revision ?? 0) - Number(a.revision ?? 0));
  }

  async listServices(namespace: string): Promise<ServiceDto[]> {
    const { core } = this.requireApis();
    const res = await timed(
      this.log,
      { client: "k8s", op: "listServices", namespace },
      "k8s listServices",
      () => core.listNamespacedService({ namespace })
    );
    return (res.items ?? []).map(toServiceDto);
  }

  async listEvents(namespace: string): Promise<K8sEventDto[]> {
    const { core } = this.requireApis();
    const res = await timed(
      this.log,
      { client: "k8s", op: "listEvents", namespace },
      "k8s listEvents",
      () => core.listNamespacedEvent({ namespace })
    );
    return (res.items ?? [])
      .map(toEventDto)
      .sort((a, b) => {
        const ta = a.lastTimestamp ? Date.parse(a.lastTimestamp) : 0;
        const tb = b.lastTimestamp ? Date.parse(b.lastTimestamp) : 0;
        return tb - ta;
      });
  }

  private requireApis(): KubernetesApis {
    if (!this.apis || !this.liveConnected) {
      throw new KubernetesUnavailableError(
        this.loadError ??
          "Ensure kind-opspilot is running and kubeconfig is configured."
      );
    }
    return this.apis;
  }
}
