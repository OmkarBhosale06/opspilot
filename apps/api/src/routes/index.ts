import type { FastifyPluginAsync } from "fastify";
import { registerControllers, type AppContext } from "../controllers/index.js";

export const registerRoutes: FastifyPluginAsync<{ ctx: AppContext }> = async (
  app,
  opts
) => {
  registerControllers(app, opts.ctx);
};
