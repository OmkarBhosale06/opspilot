import type { FastifyPluginAsync } from "fastify";
import { config } from "../config.js";
import {
  listDeployments,
  getDeployment,
  getDeploymentSnapshots,
} from "../services/k8s/deployments.js";
import { getNamespace, sendK8sError } from "./helpers.js";

export const deploymentRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { namespace?: string } }>(
    "/api/deployments",
    async (request, reply) => {
      try {
        const namespace = getNamespace(request, config.NAMESPACE);
        const items = await listDeployments(namespace);
        return { namespace, items, count: items.length };
      } catch (err) {
        return sendK8sError(reply, err);
      }
    }
  );

  app.get<{
    Params: { name: string };
    Querystring: { namespace?: string };
  }>("/api/deployments/:name", async (request, reply) => {
    try {
      const namespace = getNamespace(request, config.NAMESPACE);
      const deployment = await getDeployment(request.params.name, namespace);
      if (!deployment) {
        return reply.status(404).send({
          error: "not_found",
          message: `Deployment ${request.params.name} not found in ${namespace}`,
        });
      }
      return deployment;
    } catch (err) {
      return sendK8sError(reply, err);
    }
  });

  app.get<{
    Params: { name: string };
    Querystring: { namespace?: string };
  }>("/api/deployments/:name/snapshots", async (request, reply) => {
    try {
      const namespace = getNamespace(request, config.NAMESPACE);
      const deployment = await getDeployment(request.params.name, namespace);
      if (!deployment) {
        return reply.status(404).send({
          error: "not_found",
          message: `Deployment ${request.params.name} not found in ${namespace}`,
        });
      }
      const snapshots = await getDeploymentSnapshots(
        request.params.name,
        namespace
      );
      return {
        deployment: request.params.name,
        namespace,
        items: snapshots,
        count: snapshots.length,
      };
    } catch (err) {
      return sendK8sError(reply, err);
    }
  });
};
