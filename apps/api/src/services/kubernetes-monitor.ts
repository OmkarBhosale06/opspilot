import type { FastifyBaseLogger } from "fastify";
import type * as k8s from "@kubernetes/client-node";
import type { Config } from "../config/env.js";
import type { KubernetesClient } from "../clients/kubernetes/client.js";
import {
  toDeploymentDto,
  toEventDto,
  toPodDto,
  toServiceDto,
  watchPhaseToVerb,
} from "../clients/kubernetes/mappers.js";
import type { EventBus } from "../events/bus.js";
import type {
  DeploymentDto,
  K8sEventDto,
  NamespaceDto,
  PodDto,
  PodLogsDto,
  ServiceDto,
  SnapshotDto,
} from "../types/dto.js";
import { NotFoundError } from "../types/errors.js";

type RequestWatch = {
  abort: () => void;
};

export class KubernetesMonitorService {
  private watches: RequestWatch[] = [];
  private stopped = false;

  constructor(
    private readonly client: KubernetesClient,
    private readonly bus: EventBus,
    private readonly config: Config,
    private readonly log: FastifyBaseLogger
  ) {}

  get connected(): boolean {
    return this.client.connected;
  }

  async probe(): Promise<boolean> {
    return this.client.probe();
  }

  listClusters() {
    return [this.client.describeCluster(this.config.NAMESPACE)];
  }

  listNamespaces(): Promise<NamespaceDto[]> {
    return this.client.listNamespaces();
  }

  listPods(namespace = this.config.NAMESPACE): Promise<PodDto[]> {
    return this.client.listPods(namespace);
  }

  async getPod(name: string, namespace = this.config.NAMESPACE): Promise<PodDto> {
    const pod = await this.client.getPod(name, namespace);
    if (!pod) {
      throw new NotFoundError(`Pod ${name} not found in ${namespace}`);
    }
    return pod;
  }

  async getPodLogs(
    name: string,
    namespace = this.config.NAMESPACE,
    options: { container?: string; tailLines?: number } = {}
  ): Promise<PodLogsDto> {
    const logs = await this.client.getPodLogs(name, namespace, options);
    if (!logs) {
      throw new NotFoundError(`Pod ${name} not found in ${namespace}`);
    }
    return logs;
  }

  listDeployments(namespace = this.config.NAMESPACE): Promise<DeploymentDto[]> {
    return this.client.listDeployments(namespace);
  }

  async getDeployment(
    name: string,
    namespace = this.config.NAMESPACE
  ): Promise<DeploymentDto> {
    const dep = await this.client.getDeployment(name, namespace);
    if (!dep) {
      throw new NotFoundError(`Deployment ${name} not found in ${namespace}`);
    }
    return dep;
  }

  async listSnapshots(
    name: string,
    namespace = this.config.NAMESPACE
  ): Promise<SnapshotDto[]> {
    await this.getDeployment(name, namespace);
    return this.client.listDeploymentSnapshots(name, namespace);
  }

  listServices(namespace = this.config.NAMESPACE): Promise<ServiceDto[]> {
    return this.client.listServices(namespace);
  }

  listEvents(namespace = this.config.NAMESPACE): Promise<K8sEventDto[]> {
    return this.client.listEvents(namespace);
  }

  async start(): Promise<void> {
    const ok = await this.client.probe();
    if (!ok) {
      this.log.warn(
        { err: this.client.lastError },
        "Kubernetes watch skipped — cluster unreachable"
      );
      return;
    }
    this.stopped = false;
    const ns = this.config.NAMESPACE;
    this.watchPath(`/api/v1/namespaces/${ns}/pods`, (phase, obj) => {
      const pod = toPodDto(obj as k8s.V1Pod);
      const verb = watchPhaseToVerb(phase);
      this.bus.publish({
        type: `k8s.pod.${verb}`,
        clusterId: this.config.CLUSTER_ID,
        namespace: pod.namespace,
        timestamp: new Date().toISOString(),
        message: `Pod ${pod.name} ${verb}`,
        data: pod,
      });
    });
    this.watchPath(`/apis/apps/v1/namespaces/${ns}/deployments`, (phase, obj) => {
      const dep = toDeploymentDto(obj as k8s.V1Deployment);
      const verb = watchPhaseToVerb(phase);
      this.bus.publish({
        type: `k8s.deployment.${verb}`,
        clusterId: this.config.CLUSTER_ID,
        namespace: dep.namespace,
        timestamp: new Date().toISOString(),
        message: `Deployment ${dep.name} ${verb}`,
        data: dep,
      });
    });
    this.watchPath(`/api/v1/namespaces/${ns}/services`, (phase, obj) => {
      const svc = toServiceDto(obj as k8s.V1Service);
      const verb = watchPhaseToVerb(phase);
      this.bus.publish({
        type: `k8s.service.${verb}`,
        clusterId: this.config.CLUSTER_ID,
        namespace: svc.namespace,
        timestamp: new Date().toISOString(),
        message: `Service ${svc.name} ${verb}`,
        data: svc,
      });
    });
    this.watchPath(`/api/v1/namespaces/${ns}/events`, (phase, obj) => {
      const ev = toEventDto(obj as k8s.CoreV1Event);
      const verb = watchPhaseToVerb(phase);
      this.bus.publish({
        type: `k8s.event.${verb}`,
        clusterId: this.config.CLUSTER_ID,
        namespace: ev.namespace,
        timestamp: new Date().toISOString(),
        message: ev.message,
        data: ev,
      });
    });
    this.log.info({ namespace: ns }, "Watching Kubernetes pods/deployments/services/events");
  }

  stop(): void {
    this.stopped = true;
    for (const watch of this.watches) {
      try {
        watch.abort();
      } catch {
        // ignore
      }
    }
    this.watches = [];
  }

  private watchPath(
    path: string,
    onEvent: (phase: string, obj: object) => void
  ): void {
    const run = async () => {
      if (this.stopped) return;
      try {
        const req = await this.client.getWatch().watch(
          path,
          {},
          (phase, obj) => onEvent(String(phase), obj as object),
          (err) => {
            if (this.stopped) return;
            if (err) {
              this.log.warn({ err, path }, "Kubernetes watch ended");
            }
            setTimeout(() => void run(), 5000);
          }
        );
        this.watches.push(req as RequestWatch);
      } catch (err) {
        this.log.warn({ err, path }, "Failed to start Kubernetes watch");
      }
    };
    void run();
  }
}
