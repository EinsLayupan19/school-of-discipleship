import { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/errors/AppError";
import { env } from "../config/env";

/**
 * Single place where every thrown error in the app ends up.
 * Keeps API error responses consistent: { success: false, message, ...}
 * Must be registered LAST in server.ts, after all routes.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Unexpected/programmer error — log full details, hide internals from client
  console.error("Unexpected error:", err);

  return res.status(500).json({
    success: false,
    message: env.NODE_ENV === "production" ? "Internal server error" : (err as Error).message,
  });
}

/** Wraps async route handlers so thrown errors reach errorHandler instead of crashing the process. */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
