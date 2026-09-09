import { startServer } from "./server.js";

startServer().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
