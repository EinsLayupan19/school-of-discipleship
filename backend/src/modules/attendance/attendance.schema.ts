import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";

export const createAttendanceSchema = z.object({
  classId: z.string().uuid(),
  sessionDate: z.coerce.date().refine((date) => date.getUTCDay() === 0, {
    message: "Session date must be a Sunday",
  }),
  topic: z.string().trim().max(200).optional(),
});
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;

export const updateRecordsSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        status: z.nativeEnum(AttendanceStatus),
        remarks: z.string().trim().max(500).optional(),
      })
    )
    .min(1, "At least one record is required"),
});
export type UpdateRecordsInput = z.infer<typeof updateRecordsSchema>;

export const unlockAttendanceSchema = z.object({
  reason: z.string().trim().min(3, "Reason is required"),
});
export type UnlockAttendanceInput = z.infer<typeof unlockAttendanceSchema>;

export const listAttendanceQuerySchema = z.object({
  classId: z.string().uuid(),
});
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;
