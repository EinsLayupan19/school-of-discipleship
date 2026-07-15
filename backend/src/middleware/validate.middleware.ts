import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ValidationError } from "../shared/errors/AppError";

function formatZodError(error: ZodError): string {
  return error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
}

/** Validates req.body against `schema`, replacing it with the parsed (typed, defaulted) value. */
export function validateBody(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(formatZodError(result.error));
    }
    req.body = result.data;
    next();
  };
}

/** Validates req.query against `schema` (coercing types like page numbers), attaching the parsed result. */
export function validateQuery(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw new ValidationError(formatZodError(result.error));
    }
    // Express's req.query is technically read-only typed; validated data is
    // still attached here for handlers to read via `req.query as unknown as X`.
    Object.assign(req.query, result.data);
    next();
  };
}
