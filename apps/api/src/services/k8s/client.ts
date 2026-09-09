import * as k8s from "@kubernetes/client-node";

export type K8sClients = {
  connected: boolean;
  error?: string;
  kc: k8s.KubeConfig | null;
  core: k8s.CoreV1Api | null;
  apps: k8s.AppsV1Api | null;
};

let cached: K8sClients | null = null;

export function getK8sClients(): K8sClients {
  if (cached) return cached;

  const kc = new k8s.KubeConfig();
  try {
    kc.loadFromDefault();
    cached = {
      connected: true,
      kc,
      core: kc.makeApiClient(k8s.CoreV1Api),
      apps: kc.makeApiClient(k8s.AppsV1Api),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load kubeconfig";
    console.warn(`[k8s] not connected: ${message}`);
    cached = {
      connected: false,
      error: message,
      kc: null,
      core: null,
      apps: null,
    };
  }

  return cached;
}

/** Optional live probe — marks disconnected if API server is unreachable. */
export async function probeK8sConnection(): Promise<boolean> {
  const clients = getK8sClients();
  if (!clients.connected || !clients.core) return false;
  try {
    await clients.core.listNamespace({ limit: 1 });
    return true;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Kubernetes API unreachable";
    console.warn(`[k8s] probe failed: ${message}`);
    cached = {
      ...clients,
      connected: false,
      error: message,
    };
    return false;
  }
}

export function markDisconnected(message: string): void {
  const clients = getK8sClients();
  cached = {
    ...clients,
    connected: false,
    error: message,
  };
}

export function requireK8s(): {
  core: k8s.CoreV1Api;
  apps: k8s.AppsV1Api;
  kc: k8s.KubeConfig;
} {
  const clients = getK8sClients();
  if (!clients.connected || !clients.core || !clients.apps || !clients.kc) {
    const err = new Error(
      clients.error
        ? `Kubernetes cluster unavailable: ${clients.error}`
        : "Kubernetes cluster unavailable. Ensure kind-opspilot is running and kubeconfig is configured."
    );
    (err as Error & { statusCode: number }).statusCode = 503;
    throw err;
  }
  return { core: clients.core, apps: clients.apps, kc: clients.kc };
}

export function isK8sConnected(): boolean {
  return getK8sClients().connected;
}

export function isK8sUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const statusCode = (err as { statusCode?: number }).statusCode;
  if (statusCode === 503) return true;
  const message = err instanceof Error ? err.message : String(err);
  return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|unreachable|unavailable|fetch failed/i.test(
    message
  );
}
