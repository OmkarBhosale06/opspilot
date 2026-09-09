import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NAMESPACE: z.string().default("opspilot"),
  CLUSTER_ID: z.string().default("kind-opspilot"),
});

export type Config = z.infer<typeof envSchema>;

export const config: Config = envSchema.parse({
  PORT: process.env.PORT,
  NAMESPACE: process.env.NAMESPACE,
  CLUSTER_ID: process.env.CLUSTER_ID,
});
