import { startServer } from "./server.js";

startServer().catch((err) => {
  console.error("(startServer) Fatal startup error:", err);
  process.exit(1);
});
