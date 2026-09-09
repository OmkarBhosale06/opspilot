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
  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": config.CORS_ORIGIN,
  });
  reply.raw.write("\n");

  const send = (event: OpsPilotEvent) => {
    if (options.filter && !options.filter(event)) return;
    writeSse(reply.raw, "message", event);
  };

  if (options.initial) {
    writeSse(reply.raw, "message", options.initial);
  }

  const unsubscribe = bus.subscribe(send);
  const heartbeat = setInterval(() => {
    writeSse(reply.raw, "heartbeat", {
      type: "heartbeat",
      clusterId: config.CLUSTER_ID,
      timestamp: new Date().toISOString(),
    } satisfies OpsPilotEvent);
  }, HEARTBEAT_MS);

  const cleanup = () => {
    clearInterval(heartbeat);
    unsubscribe();
  };

  request.raw.on("close", cleanup);
}
