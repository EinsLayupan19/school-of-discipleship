import { z } from "zod";

export const createPASchema = z.object({
  classId: z.string().uuid(),
  sessionDate: z.coerce.date(),
  topic: z.string().trim().max(200).optional(),
});
export type CreatePAInput = z.infer<typeof createPASchema>;

const rubricScore = z.coerce.number().min(0).max(100);

export const upsertPAScoresSchema = z.object({
  scores: z
    .array(
      z.object({
        groupId: z.string().uuid(),
        cleanliness: rubricScore,
        creativity: rubricScore,
        execution: rubricScore,
        teamwork: rubricScore,
        timeManagement: rubricScore,
      })
    )
    .min(1),
});
export type UpsertPAScoresInput = z.infer<typeof upsertPAScoresSchema>;

export const unlockPASchema = z.object({ reason: z.string().trim().min(3) });
export type UnlockPAInput = z.infer<typeof unlockPASchema>;

export const listPAQuerySchema = z.object({ classId: z.string().uuid() });
export type ListPAQuery = z.infer<typeof listPAQuerySchema>;
