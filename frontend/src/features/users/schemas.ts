import { z } from "zod";
import type { Role } from "@/features/auth/AuthContext";

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "MDC_FACILITATOR", label: "MDC Facilitator" },
  { value: "CC_FACILITATOR", label: "CC Facilitator" },
];

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  role: z.enum(["SUPER_ADMIN", "MDC_FACILITATOR", "CC_FACILITATOR"], {
    errorMap: () => ({ message: "Select a role" }),
  }),
});
export type CreateUserValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["SUPER_ADMIN", "MDC_FACILITATOR", "CC_FACILITATOR"], {
    errorMap: () => ({ message: "Select a role" }),
  }),
});
export type UpdateUserValues = z.infer<typeof updateUserSchema>;
