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

export type LogLevel = keyof Pick<
  AppLogger,
  "info" | "warn" | "error" | "debug" | "trace"
>;

/**
 * Preferred logging shape for OpsPilot:
 *   flog.info("functionName", "whatever message we want to pass", { optionalFields })
 *
 * Console / pino message becomes: (functionName) whatever message we want to pass
 */
export type FnLogger = {
  info: (
    functionName: string,
    message: string,
    fields?: Record<string, unknown>
  ) => void;
  warn: (
    functionName: string,
    message: string,
    fields?: Record<string, unknown>
  ) => void;
  error: (
    functionName: string,
    message: string,
    fields?: Record<string, unknown>
  ) => void;
  debug: (
    functionName: string,
    message: string,
    fields?: Record<string, unknown>
  ) => void;
  trace: (
    functionName: string,
    message: string,
    fields?: Record<string, unknown>
  ) => void;
};

type LogSink = {
  info: (obj: object, msg?: string) => void;
  warn: (obj: object, msg?: string) => void;
  error: (obj: object, msg?: string) => void;
  debug: (obj: object, msg?: string) => void;
  trace?: (obj: object, msg?: string) => void;
};

function emit(
  log: LogSink | undefined,
  level: LogLevel,
  functionName: string,
  message: string,
  fields?: Record<string, unknown>
): void {
  if (!log) return;
  const payload = { fn: functionName, ...(fields ?? {}) };
  const line = `(${functionName}) ${message}`;
  const write = log[level];
  if (typeof write === "function") {
    write.call(log, payload, line);
    return;
  }
  log.info(payload, line);
}

/** Wrap a pino/Fastify logger so every call is (functionName, message). */
export function createFnLog(log?: LogSink | null): FnLogger {
  return {
    info: (fn, message, fields) => emit(log ?? undefined, "info", fn, message, fields),
    warn: (fn, message, fields) => emit(log ?? undefined, "warn", fn, message, fields),
    error: (fn, message, fields) => emit(log ?? undefined, "error", fn, message, fields),
    debug: (fn, message, fields) => emit(log ?? undefined, "debug", fn, message, fields),
    trace: (fn, message, fields) => emit(log ?? undefined, "trace", fn, message, fields),
  };
}

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
              messageFormat: "{msg}",
            },
          },
        }
      : {}),
  };
}

export async function timed<T>(
  log: AppLogger | undefined,
  functionName: string,
  fields: Record<string, unknown>,
  message: string,
  fn: () => Promise<T>
): Promise<T> {
  const flog = createFnLog(log);
  const started = Date.now();
  try {
    const result = await fn();
    flog.debug(functionName, message, { ...fields, ms: Date.now() - started });
    return result;
  } catch (err) {
    flog.debug(functionName, `${message} failed`, {
      ...fields,
      err,
      ms: Date.now() - started,
    });
    throw err;
  }
}
