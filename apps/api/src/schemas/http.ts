import { z } from "zod";

export const namespaceQuerySchema = z.object({
  namespace: z.string().min(1).optional(),
});

export const podLogsQuerySchema = namespaceQuerySchema.extend({
  container: z.string().min(1).optional(),
  tailLines: z.coerce.number().int().positive().max(5000).optional(),
});
