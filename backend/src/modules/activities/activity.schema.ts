import { z } from "zod";
import { ActivityType } from "@prisma/client";

export const createActivitySchema = z.object({
  classId: z.string().uuid(),
  title: z.string().trim().min(2),
  type: z.nativeEnum(ActivityType),
  maxScore: z.coerce.number().positive(),
});
export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z.object({
  title: z.string().trim().min(2).optional(),
  type: z.nativeEnum(ActivityType).optional(),
  maxScore: z.coerce.number().positive().optional(),
});
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

export const listActivitiesQuerySchema = z.object({
  classId: z.string().uuid(),
  type: z.nativeEnum(ActivityType).optional(),
  search: z.string().trim().optional(),
});
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;

export const upsertScoresSchema = z.object({
  scores: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        score: z.coerce.number().min(0),
      })
    )
    .min(1),
});
export type UpsertScoresInput = z.infer<typeof upsertScoresSchema>;

export const unlockActivitySchema = z.object({
  reason: z.string().trim().min(3),
});
export type UnlockActivityInput = z.infer<typeof unlockActivitySchema>;
