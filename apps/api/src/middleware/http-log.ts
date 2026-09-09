import type { FastifyInstance } from "fastify";

function isStreamPath(url: string): boolean {
  return url.includes("/stream");
}

export function registerHttpLogging(app: FastifyInstance): void {
  app.addHook("onRequest", async (request, reply) => {
    void reply.header("x-request-id", request.id);
    request.log.info(
      {
        reqId: request.id,
        method: request.method,
        url: request.url,
        query: request.query,
        stream: isStreamPath(request.url),
      },
      `← ${request.method} ${request.url}`
    );
  });

  app.addHook("onResponse", async (request, reply) => {
    if (isStreamPath(request.url)) return;
    request.log.info(
      {
        reqId: request.id,
        method: request.method,
        url: request.url,
        status: reply.statusCode,
        ms: Math.round(reply.elapsedTime),
      },
      `→ ${request.method} ${request.url} ${reply.statusCode} ${Math.round(reply.elapsedTime)}ms`
    );
  });
}
