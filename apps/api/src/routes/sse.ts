import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config.js";
import { eventBus } from "../events/bus.js";
import type { OpsEvent } from "../events/types.js";

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
  options: {
    filter?: (event: OpsEvent) => boolean;
    initial?: OpsEvent;
  } = {}
): void {
  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "http://localhost:3000",
  });
  reply.raw.write("\n");

  const send = (event: OpsEvent) => {
    if (options.filter && !options.filter(event)) return;
    writeSse(reply.raw, "message", event);
  };

  if (options.initial) {
    writeSse(reply.raw, "message", options.initial);
  }

  const unsubscribe = eventBus.subscribe(send);
  const heartbeat = setInterval(() => {
    writeSse(reply.raw, "heartbeat", {
      type: "heartbeat",
      clusterId: config.CLUSTER_ID,
      timestamp: new Date().toISOString(),
    } satisfies OpsEvent);
  }, HEARTBEAT_MS);

  const cleanup = () => {
    clearInterval(heartbeat);
    unsubscribe();
  };

  request.raw.on("close", cleanup);
}
