import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/permit.middleware";
import { validateQuery } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/errorHandler";
import { prisma } from "../../config/db";

const listAuditLogsQuerySchema = z.object({
  entityType: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const router = Router();

/**
 * GET /api/audit-logs
 * Super Admin only. Supports filtering by entityType (e.g. "User") and
 * pagination. Includes the actor's name/email so the UI doesn't need a
 * second lookup per row.
 */
router.get(
  "/",
  requireAuth,
  requireRole(Role.SUPER_ADMIN),
  validateQuery(listAuditLogsQuerySchema),
  asyncHandler(async (req, res) => {
    const { entityType, page, pageSize } = req.query as unknown as z.infer<
      typeof listAuditLogsQuerySchema
    >;

    const where = entityType ? { entityType } : {};

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });
  })
);

export default router;
