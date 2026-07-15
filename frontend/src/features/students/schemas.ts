import { z } from "zod";
import type { Program } from "@/features/academic/api";

export type Sex = "MALE" | "FEMALE";
export type StudentCategory = "YOUTH" | "ADULT" | "SENIOR";

export interface StudentRecord {
  id: string;
  fullName: string;
  sex: Sex;
  category: StudentCategory;
  isArchived: boolean;
  classId: string;
  groupId: string | null;
  class: { id: string; name: string; batch: { id: string; name: string; program: Program } };
  group: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

export const CATEGORY_OPTIONS: { value: StudentCategory; label: string }[] = [
  { value: "YOUTH", label: "Youth" },
  { value: "ADULT", label: "Adult" },
  { value: "SENIOR", label: "Senior" },
];

// `batchId` exists only to drive the Class dropdown in the UI — it is
// stripped out before the payload is sent to the backend, since Student
// doesn't store batch directly (it's derived through Class -> Batch).
export const studentFormSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  batchId: z.string().uuid("Select a batch"),
  classId: z.string().uuid("Select a class"),
  groupId: z.string().optional(),
  sex: z.enum(["MALE", "FEMALE"], { errorMap: () => ({ message: "Select sex" }) }),
  category: z.enum(["YOUTH", "ADULT", "SENIOR"], {
    errorMap: () => ({ message: "Select category" }),
  }),
});
export type StudentFormValues = z.infer<typeof studentFormSchema>;
