import type { FastifyPluginAsync } from "fastify";
import { config } from "../config.js";
import { listEvents } from "../services/k8s/events.js";
import { getNamespace, sendK8sError } from "./helpers.js";

export const eventRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { namespace?: string } }>(
    "/api/events",
    async (request, reply) => {
      try {
        const namespace = getNamespace(request, config.NAMESPACE);
        const items = await listEvents(namespace);
        return { namespace, items, count: items.length };
      } catch (err) {
        return sendK8sError(reply, err);
      }
    }
  );
};
