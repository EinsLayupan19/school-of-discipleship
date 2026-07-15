import { z } from "zod";
import { Role } from "@prisma/client";

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  role: z.nativeEnum(Role),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").optional(),
  role: z.nativeEnum(Role).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const listUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.enum(["active", "inactive", "all"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
