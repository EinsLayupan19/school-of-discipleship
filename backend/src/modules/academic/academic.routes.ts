import { Router } from "express";
import { z } from "zod";
import { Program, Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/permit.middleware";
import { validateQuery } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/errorHandler";
import { prisma } from "../../config/db";
import { getFacilitatorClassIds } from "../../shared/utils/facilitatorScope";
import { ForbiddenError } from "../../shared/errors/AppError";

const router = Router();

router.use(requireAuth, requireRole(Role.SUPER_ADMIN, Role.MDC_FACILITATOR, Role.CC_FACILITATOR));

/**
 * GET /api/academic/batches
 * A facilitator only sees batches that contain at least one class they
 * facilitate — they can't browse batches they have no classes in.
 */
router.get(
  "/batches",
  validateQuery(z.object({ program: z.nativeEnum(Program).optional() })),
  asyncHandler(async (req, res) => {
    const { program } = req.query as unknown as { program?: Program };
    const isFacilitator = req.user!.role !== Role.SUPER_ADMIN;

    const classIds = isFacilitator ? await getFacilitatorClassIds(req.user!.id) : undefined;

    const batches = await prisma.batch.findMany({
      where: {
        ...(program ? { program } : {}),
        ...(classIds ? { classes: { some: { id: { in: classIds } } } } : {}),
      },
      orderBy: { name: "asc" },
    });

    res.status(200).json({ success: true, data: batches });
  })
);

/**
 * GET /api/academic/classes
 * A facilitator always sees only their own assigned classes, regardless
 * of what filters are passed — this is the ownership boundary the whole
 * Student module scoping relies on.
 */
router.get(
  "/classes",
  validateQuery(
    z.object({ batchId: z.string().uuid().optional(), program: z.nativeEnum(Program).optional() })
  ),
  asyncHandler(async (req, res) => {
    const { batchId, program } = req.query as unknown as { batchId?: string; program?: Program };
    const isFacilitator = req.user!.role !== Role.SUPER_ADMIN;

    const classes = await prisma.class.findMany({
      where: {
        ...(batchId ? { batchId } : {}),
        ...(program ? { batch: { program } } : {}),
        ...(isFacilitator ? { facilitatorId: req.user!.id } : {}),
      },
      include: { batch: { select: { name: true, program: true } } },
      orderBy: { name: "asc" },
    });

    res.status(200).json({ success: true, data: classes });
  })
);

/**
 * GET /api/academic/groups?classId=...
 * Facilitators may only list groups for a class they actually own.
 */
router.get(
  "/groups",
  validateQuery(z.object({ classId: z.string().uuid() })),
  asyncHandler(async (req, res) => {
    const { classId } = req.query as unknown as { classId: string };

    if (req.user!.role !== Role.SUPER_ADMIN) {
      const ownedClassIds = await getFacilitatorClassIds(req.user!.id);
      if (!ownedClassIds.includes(classId)) {
        throw new ForbiddenError("You don't have access to this class");
      }
    }

    const groups = await prisma.group.findMany({ where: { classId }, orderBy: { name: "asc" } });
    res.status(200).json({ success: true, data: groups });
  })
);

export default router;
