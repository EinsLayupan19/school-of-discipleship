import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env";
import { prisma } from "../config/db";
import { UnauthorizedError } from "../shared/errors/AppError";
import { asyncHandler } from "./errorHandler";
import { Role } from "../shared/types";

/**
 * Supabase publishes its current signing keys at this well-known JWKS URL.
 * `createRemoteJWKSet` fetches and caches them automatically, and
 * re-fetches if a token references a key it doesn't have cached yet
 * (e.g. after Supabase rotates keys) — so this needs no manual updates
 * even if Supabase changes its signing algorithm or rotates keys later.
 */
const JWKS = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

/**
 * Verifies the Supabase access token on every protected request, then
 * attaches the app's own User profile (not just the raw token claims) to
 * req.user, since role-based guards need `role`, which only exists in
 * our database, not in the Supabase token.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing access token");
  }

  const token = header.slice("Bearer ".length);

  let authId: string;
  try {
    const { payload } = await jwtVerify(token, JWKS);
    if (typeof payload.sub !== "string") {
      throw new Error("Token payload missing sub claim");
    }
    authId = payload.sub;
  } catch (err) {
    console.error("JWT verification failed:", (err as Error).message);
    throw new UnauthorizedError("Invalid or expired token");
  }

  const user = await prisma.user.findUnique({ where: { authId } });

  if (!user || !user.isActive) {
    throw new UnauthorizedError("Account not found or has been deactivated");
  }

  req.user = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as Role,
  };

  next();
});
