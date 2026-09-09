import type { FastifyPluginAsync } from "fastify";
import { config } from "../config.js";
import { listPods, getPod } from "../services/k8s/pods.js";
import { getNamespace, sendK8sError } from "./helpers.js";

export const podRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { namespace?: string } }>(
    "/api/pods",
    async (request, reply) => {
      try {
        const namespace = getNamespace(request, config.NAMESPACE);
        const pods = await listPods(namespace);
        return { namespace, items: pods, count: pods.length };
      } catch (err) {
        return sendK8sError(reply, err);
      }
    }
  );

  app.get<{
    Params: { name: string };
    Querystring: { namespace?: string };
  }>("/api/pods/:name", async (request, reply) => {
    try {
      const namespace = getNamespace(request, config.NAMESPACE);
      const pod = await getPod(request.params.name, namespace);
      if (!pod) {
        return reply.status(404).send({
          error: "not_found",
          message: `Pod ${request.params.name} not found in ${namespace}`,
        });
      }
      return pod;
    } catch (err) {
      return sendK8sError(reply, err);
    }
  });
};
