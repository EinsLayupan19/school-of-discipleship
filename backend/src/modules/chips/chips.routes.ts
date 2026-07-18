import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/permit.middleware";
import { validateBody, validateQuery } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/errorHandler";
import { ForbiddenError, NotFoundError } from "../../shared/errors/AppError";
import { prisma } from "../../config/db";
import { getFacilitatorClassIds } from "../../shared/utils/facilitatorScope";
import { createAuditLog } from "../audit/audit.service";
import { notifyClassFacilitator } from "../notifications/notification.service";

const router = Router();
router.use(requireAuth, requireRole(Role.SUPER_ADMIN, Role.MDC_FACILITATOR, Role.CC_FACILITATOR));

const createSchema = z.object({
  groupId: z.string().uuid(),
  amount: z.coerce
    .number()
    .int()
    .refine((n) => n !== 0, "Amount can't be zero"),
  reason: z.string().trim().max(300).optional(),
});

async function assertGroupAccess(groupId: string, actorId: string, role: Role) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { classId: true },
  });
  if (!group) throw new NotFoundError("Group");
  if (role === Role.SUPER_ADMIN) return group;
  const owned = await getFacilitatorClassIds(actorId);
  if (!owned.includes(group.classId))
    throw new ForbiddenError("You don't have access to this group");
  return group;
}

router.get(
  "/",
  validateQuery(z.object({ classId: z.string().uuid() })),
  asyncHandler(async (req, res) => {
    const { classId } = req.query as unknown as { classId: string };
    if (req.user!.role !== Role.SUPER_ADMIN) {
      const owned = await getFacilitatorClassIds(req.user!.id);
      if (!owned.includes(classId)) throw new ForbiddenError("You don't have access to this class");
    }
    const chips = await prisma.groupChip.findMany({
      where: { group: { classId } },
      include: { group: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data: chips });
  })
);

router.post(
  "/",
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const { groupId, amount, reason } = req.body as z.infer<typeof createSchema>;
    const group = await assertGroupAccess(groupId, req.user!.id, req.user!.role);

    const chip = await prisma.groupChip.create({ data: { groupId, amount, reason } });

    await createAuditLog({
      actorId: req.user!.id,
      action: "CREATE",
      entityType: "GroupChip",
      entityId: chip.id,
      metadata: { groupId, amount, reason },
    });

    await notifyClassFacilitator(group.classId, req.user!.id, {
      type: "ANNOUNCEMENT",
      title: "Chips adjusted",
      message: `${amount > 0 ? "+" : ""}${amount} chips ${amount > 0 ? "awarded to" : "deducted from"} a group in your class${reason ? ` — ${reason}` : ""}.`,
      entityType: "GroupChip",
      entityId: chip.id,
    });

    res.status(201).json({ success: true, data: chip });
  })
);

export default router;
