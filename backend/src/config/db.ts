import { PrismaClient } from "@prisma/client";
import { env } from "./env";

/**
 * Single shared PrismaClient instance for the whole app.
 * Without this singleton pattern, `tsx watch`'s hot-reload in dev would
 * create a new PrismaClient (and new DB connection pool) on every file
 * save, eventually exhausting Postgres's connection limit.
 */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
});
