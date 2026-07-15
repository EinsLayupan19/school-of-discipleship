import { z } from "zod";
import { WeekStatus } from "@prisma/client";

export const createWeekSchema = z.object({
  batchId: z.string().uuid(),
  label: z.string().trim().max(100).optional(),
});
export type CreateWeekInput = z.infer<typeof createWeekSchema>;

export const updateWeekSchema = z.object({
  label: z.string().trim().max(100).optional(),
  attendanceDone: z.boolean().optional(),
  quizDone: z.boolean().optional(),
  assignmentDone: z.boolean().optional(),
  recitationDone: z.boolean().optional(),
  performanceDone: z.boolean().optional(),
  paDone: z.boolean().optional(),
  groupChipsDone: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional(),
  status: z.nativeEnum(WeekStatus).optional(),
});
export type UpdateWeekInput = z.infer<typeof updateWeekSchema>;

export const unlockWeekSchema = z.object({
  reason: z.string().trim().min(3, "Reason is required"),
});
export type UnlockWeekInput = z.infer<typeof unlockWeekSchema>;

export const listWeeksQuerySchema = z.object({
  batchId: z.string().uuid(),
});
export type ListWeeksQuery = z.infer<typeof listWeeksQuerySchema>;
