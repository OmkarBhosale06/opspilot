import type { FastifyReply, FastifyRequest } from "fastify";
import type { Config } from "../config/env.js";
import type { EventBus } from "./bus.js";
import type { OpsPilotEvent } from "../types/events.js";

const HEARTBEAT_MS = 15_000;

function writeSse(
  raw: NodeJS.WritableStream,
  event: string,
  data: unknown
): void {
  raw.write(`event: ${event}\n`);
  raw.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function openSseStream(
  request: FastifyRequest,
  reply: FastifyReply,
  bus: EventBus,
  config: Config,
  options: {
    filter?: (event: OpsPilotEvent) => boolean;
    initial?: OpsPilotEvent;
  } = {}
): void {
  const reqId = request.id;
  const url = request.url;
  const started = Date.now();
  let eventsSent = 0;
  let heartbeats = 0;

  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": config.CORS_ORIGIN,
    "X-Request-Id": String(reqId),
  });
  reply.raw.write("\n");

  const send = (sseEvent: string, payload: OpsPilotEvent) => {
    writeSse(reply.raw, sseEvent, payload);
    eventsSent += 1;
    if (sseEvent === "heartbeat" || payload.type === "heartbeat") {
      heartbeats += 1;
      request.log.trace(
        { reqId, url, type: payload.type, eventsSent, heartbeats },
        `SSE heartbeat ${url}`
      );
      return;
    }
    request.log.debug(
      {
        reqId,
        url,
        sseEvent,
        type: payload.type,
        incidentId: payload.incidentId,
        message: payload.message,
        eventsSent,
      },
      `SSE ${sseEvent} ${payload.type}`
    );
  };

  const onBusEvent = (event: OpsPilotEvent) => {
    if (options.filter && !options.filter(event)) return;
    send("message", event);
  };

  if (options.initial) {
    send("message", options.initial);
  }

  const unsubscribe = bus.subscribe(onBusEvent);
  request.log.info(
    {
      reqId,
      url,
      subscribers: bus.subscriberCount,
      filter: Boolean(options.filter),
    },
    `SSE open ${url} subscribers=${bus.subscriberCount}`
  );

  const heartbeat = setInterval(() => {
    send("heartbeat", {
      type: "heartbeat",
      clusterId: config.CLUSTER_ID,
      timestamp: new Date().toISOString(),
    } satisfies OpsPilotEvent);
  }, HEARTBEAT_MS);

  const cleanup = () => {
    clearInterval(heartbeat);
    unsubscribe();
    request.log.info(
      {
        reqId,
        url,
        ms: Date.now() - started,
        eventsSent,
        heartbeats,
        subscribers: bus.subscriberCount,
      },
      `SSE close ${url} ${Date.now() - started}ms events=${eventsSent}`
    );
  };

  request.raw.on("close", cleanup);
}
