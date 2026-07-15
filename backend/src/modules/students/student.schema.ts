import { z } from "zod";
import { Sex, StudentCategory } from "@prisma/client";

export const createStudentSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  classId: z.string().uuid("Select a class"),
  groupId: z.string().uuid().optional().nullable(),
  sex: z.nativeEnum(Sex),
  category: z.nativeEnum(StudentCategory),
});
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").optional(),
  classId: z.string().uuid().optional(),
  groupId: z.string().uuid().nullable().optional(),
  sex: z.nativeEnum(Sex).optional(),
  category: z.nativeEnum(StudentCategory).optional(),
});
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const listStudentsQuerySchema = z.object({
  search: z.string().trim().optional(),
  batchId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  category: z.nativeEnum(StudentCategory).optional(),
  sex: z.nativeEnum(Sex).optional(),
  status: z.enum(["active", "archived", "all"]).default("active"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
