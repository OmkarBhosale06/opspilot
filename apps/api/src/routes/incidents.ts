import type { FastifyPluginAsync } from "fastify";
import { incidentStore } from "../services/incidents/store.js";

export const incidentRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/incidents", async () => {
    return {
      items: incidentStore.listSummaries(),
      count: incidentStore.list().length,
    };
  });

  app.get<{ Params: { id: string } }>(
    "/api/incidents/:id",
    async (request, reply) => {
      const incident = incidentStore.get(request.params.id);
      if (!incident) {
        return reply.status(404).send({
          error: "not_found",
          message: `Incident ${request.params.id} not found`,
        });
      }
      return incident;
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/incidents/:id/timeline",
    async (request, reply) => {
      const incident = incidentStore.get(request.params.id);
      if (!incident) {
        return reply.status(404).send({
          error: "not_found",
          message: `Incident ${request.params.id} not found`,
        });
      }
      return {
        incidentId: incident.id,
        items: incident.timeline,
        count: incident.timeline.length,
      };
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/incidents/:id/evidence",
    async (request, reply) => {
      const incident = incidentStore.get(request.params.id);
      if (!incident) {
        return reply.status(404).send({
          error: "not_found",
          message: `Incident ${request.params.id} not found`,
        });
      }
      return {
        incidentId: incident.id,
        items: incident.evidence,
        count: incident.evidence.length,
        rootCause: incident.rootCause,
      };
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/incidents/:id/investigation",
    async (request, reply) => {
      const incident = incidentStore.get(request.params.id);
      if (!incident) {
        return reply.status(404).send({
          error: "not_found",
          message: `Incident ${request.params.id} not found`,
        });
      }
      return {
        incidentId: incident.id,
        items: incident.investigation,
        count: incident.investigation.length,
        remediation: incident.remediation,
        policy: incident.policy,
        verification: incident.verification,
      };
    }
  );
};
