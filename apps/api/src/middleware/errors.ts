import type { FastifyReply } from "fastify";
import { createFnLog } from "../logging.js";
import { isUnavailable, KubernetesUnavailableError, NotFoundError } from "../types/errors.js";
import type { KubernetesClient } from "../clients/kubernetes/client.js";

export function sendDomainError(
  reply: FastifyReply,
  err: unknown,
  k8s?: KubernetesClient
) {
  if (err instanceof NotFoundError) {
    return reply.status(404).send({
      error: err.code,
      message: err.message,
    });
  }

  if (err instanceof KubernetesUnavailableError || isUnavailable(err)) {
    const message = err instanceof Error ? err.message : "Kubernetes unavailable";
    if (isUnavailable(err)) {
      k8s?.markDisconnected(message);
    }
    return reply.status(503).send({
      error: "kubernetes_unavailable",
      message,
      hint: "Start the kind-opspilot cluster and ensure kubeconfig points at it.",
    });
  }

  const message = err instanceof Error ? err.message : "Unexpected error";
  createFnLog(reply.log).error("sendDomainError", message, { err });
  return reply.status(500).send({
    error: "internal_error",
    message,
  });
}

export function namespaceFromQuery(
  query: { namespace?: string },
  fallback: string
): string {
  return query.namespace?.trim() || fallback;
}
