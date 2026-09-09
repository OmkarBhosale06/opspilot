import type { FastifyPluginAsync } from "fastify";
import { listNamespaces } from "../services/k8s/namespaces.js";
import { sendK8sError } from "./helpers.js";

export const namespaceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/namespaces", async (_request, reply) => {
    try {
      const items = await listNamespaces();
      return { items, count: items.length };
    } catch (err) {
      return sendK8sError(reply, err);
    }
  });
};
