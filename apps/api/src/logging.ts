import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import type { FastifyServerOptions } from "fastify";
import type { Config } from "./config/env.js";

const require = createRequire(import.meta.url);

function prettyTransportTarget(): string | undefined {
  try {
    return require.resolve("pino-pretty");
  } catch {
    return undefined;
  }
}

export type AppLogger = {
  info: (obj: object, msg?: string) => void;
  warn: (obj: object, msg?: string) => void;
  error: (obj: object, msg?: string) => void;
  debug: (obj: object, msg?: string) => void;
  trace: (obj: object, msg?: string) => void;
};

export function createReqId(): string {
  return randomUUID().slice(0, 8);
}

export function summarizeUrl(url: string, max = 240): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max)}…`;
}

export function loggerOptions(config: Config): FastifyServerOptions["logger"] {
  const prettyTarget =
    config.NODE_ENV === "development" ? prettyTransportTarget() : undefined;
  return {
    level: config.LOG_LEVEL,
    timestamp: true,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "headers.authorization",
        "headers.cookie",
      ],
      remove: true,
    },
    ...(prettyTarget
      ? {
          transport: {
            target: prettyTarget,
            options: {
              colorize: true,
              translateTime: "HH:MM:ss.l",
              ignore: "pid,hostname",
              singleLine: true,
            },
          },
        }
      : {}),
  };
}

export async function timed<T>(
  log: AppLogger | undefined,
  fields: Record<string, unknown>,
  message: string,
  fn: () => Promise<T>
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    log?.debug({ ...fields, ms: Date.now() - started }, message);
    return result;
  } catch (err) {
    log?.debug({ ...fields, err, ms: Date.now() - started }, `${message} failed`);
    throw err;
  }
}
