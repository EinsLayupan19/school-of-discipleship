/**
 * Roles mirror the Prisma `Role` enum. Kept here too so non-Prisma
 * layers (middleware, route guards) can import without pulling in
 * the generated Prisma client.
 */
export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  MDC_FACILITATOR = "MDC_FACILITATOR",
  CC_FACILITATOR = "CC_FACILITATOR",
}

/** Shape of the authenticated user attached to each request by authMiddleware. */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

// Extends Express's Request type globally so `req.user` is typed everywhere.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
