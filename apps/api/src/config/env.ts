import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(4000),
  NAMESPACE: z.string().default("opspilot"),
  CLUSTER_ID: z.string().default("kind-opspilot"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  PROMETHEUS_URL: z.string().default("http://localhost:9090"),
  LOKI_URL: z.string().default("http://localhost:3100"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return envSchema.parse({
    NODE_ENV: env.NODE_ENV,
    HOST: env.HOST,
    PORT: env.PORT,
    NAMESPACE: env.NAMESPACE,
    CLUSTER_ID: env.CLUSTER_ID,
    CORS_ORIGIN: env.CORS_ORIGIN,
    DATABASE_URL: env.DATABASE_URL,
    REDIS_URL: env.REDIS_URL,
    PROMETHEUS_URL: env.PROMETHEUS_URL,
    LOKI_URL: env.LOKI_URL,
    LOG_LEVEL: env.LOG_LEVEL,
  });
}

export const config = loadConfig();
