export type ContainerStatusDto = {
  name: string;
  ready: boolean;
  restartCount: number;
  state: "running" | "waiting" | "terminated" | "unknown";
  reason: string | null;
  image?: string;
};

export type PodDto = {
  name: string;
  namespace: string;
  phase: string;
  node: string | null;
  labels: Record<string, string>;
  createdAt: string | null;
  containers: Array<{ name: string; image: string }>;
  containerStatuses: ContainerStatusDto[];
  ready: boolean;
  restarts: number;
};

export type DeploymentDto = {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  availableReplicas: number;
  updatedReplicas: number;
  labels: Record<string, string>;
  images: string[];
  createdAt: string | null;
  strategy: string | null;
  conditions: Array<{
    type: string;
    status: string;
    reason: string | null;
    message: string | null;
  }>;
};

export type SnapshotDto = {
  name: string;
  revision: string | null;
  replicas: number;
  readyReplicas: number;
  images: string[];
  createdAt: string | null;
  owner: string | null;
};

export type ServiceDto = {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string | null;
  ports: Array<{ port: number; targetPort: string; protocol: string }>;
  selector: Record<string, string>;
  createdAt: string | null;
};

export type NamespaceDto = {
  name: string;
  status: string;
  labels: Record<string, string>;
  createdAt: string | null;
};

export type ClusterDto = {
  id: string;
  context: string | null;
  server: string | null;
  connected: boolean;
  defaultNamespace: string;
};

export type K8sEventDto = {
  type: string;
  reason: string;
  message: string;
  object: string;
  namespace: string;
  count: number;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
};

export type PodLogsDto = {
  pod: string;
  namespace: string;
  container: string | null;
  lines: string[];
};
