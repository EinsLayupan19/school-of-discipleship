import { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../shared/errors/AppError";
import { Role } from "../shared/types";

/**
 * Restricts a route to specific roles. Must run AFTER requireAuth,
 * since it reads req.user which requireAuth attaches.
 *
 * Usage: router.get("/admin-only", requireAuth, requireRole(Role.SUPER_ADMIN), handler)
 *
 * Access matrix this enforces across the app:
 *   SUPER_ADMIN      -> everything (MDC + CC + user mgmt + settings + audit logs)
 *   MDC_FACILITATOR  -> MDC-scoped routes only
 *   CC_FACILITATOR   -> CC-scoped routes only
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError("Your role does not have access to this resource");
    }

    next();
  };
}
