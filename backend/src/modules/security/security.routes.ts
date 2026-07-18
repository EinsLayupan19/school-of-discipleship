import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/permit.middleware";
import { validateQuery } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/errorHandler";
import { prisma } from "../../config/db";

const router = Router();
router.use(requireAuth, requireRole(Role.SUPER_ADMIN));

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** GET /api/security/unlock-logs — every unlock, with actor + reason. */
router.get(
  "/unlock-logs",
  validateQuery(listQuery),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = req.query as unknown as z.infer<typeof listQuery>;

    const [data, total] = await Promise.all([
      prisma.unlockLog.findMany({
        include: { actor: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.unlockLog.count(),
    ]);

    res.status(200).json({
      success: true,
      data,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });
  })
);

/**
 * GET /api/security/backup — JSON export of core record-keeping tables.
 * Restore is deliberately NOT exposed as an API — re-importing this blindly
 * could corrupt referential integrity (cascades, unique constraints).
 * Use Supabase's own point-in-time recovery for actual restores; this
 * export exists for offline record-keeping and manual inspection.
 */
router.get(
  "/backup",
  asyncHandler(async (_req, res) => {
    const [
      users,
      batches,
      classes,
      groups,
      students,
      attendances,
      attendanceRecords,
      activities,
      activityScores,
      paActivities,
      paScores,
      groupChips,
      demerits,
      weeks,
      announcements,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.batch.findMany(),
      prisma.class.findMany(),
      prisma.group.findMany(),
      prisma.student.findMany(),
      prisma.attendance.findMany(),
      prisma.attendanceRecord.findMany(),
      prisma.activity.findMany(),
      prisma.activityScore.findMany(),
      prisma.pAActivity.findMany(),
      prisma.pAScore.findMany(),
      prisma.groupChip.findMany(),
      prisma.demerit.findMany(),
      prisma.week.findMany(),
      prisma.announcement.findMany(),
    ]);

    const backup = {
      generatedAt: new Date().toISOString(),
      users,
      batches,
      classes,
      groups,
      students,
      attendances,
      attendanceRecords,
      activities,
      activityScores,
      paActivities,
      paScores,
      groupChips,
      demerits,
      weeks,
      announcements,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="backup-${Date.now()}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  })
);

export default router;
