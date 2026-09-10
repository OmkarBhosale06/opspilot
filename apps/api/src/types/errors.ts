export class KubernetesUnavailableError extends Error {
  readonly statusCode = 503;
  readonly code = "kubernetes_unavailable";

  constructor(message: string) {
    const prefixed = message.startsWith("Kubernetes cluster unavailable")
      ? message
      : `Kubernetes cluster unavailable: ${message}`;
    super(prefixed);
    this.name = "KubernetesUnavailableError";
  }
}

export class NotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = "not_found";

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export function httpStatusOf(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  if ("statusCode" in err && typeof err.statusCode === "number") {
    return err.statusCode;
  }
  return undefined;
}

export function isNotFound(err: unknown): boolean {
  return httpStatusOf(err) === 404;
}

export function isUnavailable(err: unknown): boolean {
  if (err instanceof KubernetesUnavailableError) return true;
  const status = httpStatusOf(err);
  if (status === 503) return true;
  const message = err instanceof Error ? err.message : String(err);
  return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|ENETUNREACH|EHOSTUNREACH|unreachable|fetch failed|kubeconfig/i.test(
    message
  );
}
