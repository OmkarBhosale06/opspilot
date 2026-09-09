import type { FastifyPluginAsync } from "fastify";
import { registerControllers, type AppContext } from "../controllers/index.js";
import { registerHttpLogging } from "../middleware/http-log.js";

export const registerRoutes: FastifyPluginAsync<{ ctx: AppContext }> = async (
  app,
  opts
) => {
  registerHttpLogging(app);
  registerControllers(app, opts.ctx);
};
