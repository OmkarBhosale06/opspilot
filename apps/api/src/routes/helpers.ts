import type { FastifyReply, FastifyRequest } from "fastify";
import {
  isK8sUnavailableError,
  markDisconnected,
} from "../services/k8s/client.js";

export function getNamespace(
  request: FastifyRequest<{
    Querystring: { namespace?: string };
  }>,
  fallback: string
): string {
  return request.query.namespace?.trim() || fallback;
}

export function sendK8sError(reply: FastifyReply, err: unknown) {
  const message =
    err instanceof Error ? err.message : "Unexpected Kubernetes error";

  if (isK8sUnavailableError(err)) {
    markDisconnected(message);
    return reply.status(503).send({
      error: "kubernetes_unavailable",
      message,
      hint: "Start the kind-opspilot cluster and ensure kubeconfig points at it.",
    });
  }

  const statusCode =
    err && typeof err === "object" && "statusCode" in err
      ? Number((err as { statusCode?: number }).statusCode) || 500
      : 500;

  return reply
    .status(statusCode >= 400 && statusCode < 600 ? statusCode : 500)
    .send({
      error: "kubernetes_error",
      message,
    });
}
