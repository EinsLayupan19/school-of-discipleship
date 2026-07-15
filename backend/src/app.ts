import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes/index";
import { errorHandler } from "./middleware/errorHandler";

/**
 * Builds and configures the Express app.
 * Kept separate from server.ts (which just starts listening) so the
 * app instance can be imported directly in tests without opening a port.
 */
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(","),
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

  app.use("/api", routes);

  // Catch-all for unmatched routes
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });

  // Must be last: converts all thrown errors into JSON responses
  app.use(errorHandler);

  return app;
}
