import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

/**
 * Schema for all environment variables the backend requires.
 * The app will refuse to boot if any of these are missing or malformed —
 * this prevents "works on my machine" bugs from reaching Railway.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),

  // Postgres connection string (via Supabase), used by Prisma
  DATABASE_URL: z.string().url(),
  // Direct (non-pooled) connection, used only for running migrations
  DIRECT_URL: z.string().url(),

  // Supabase project credentials, used for auth token verification
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // No longer required for auth verification (see auth.middleware.ts, which
  // now verifies against Supabase's public JWKS endpoint instead). Kept
  // optional here only in case some other legacy tool still expects it.
  SUPABASE_JWT_SECRET: z.string().optional(),

  // Comma-separated list of allowed frontend origins for CORS
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. Check your .env file.");
}

export const env = parsed.data;
