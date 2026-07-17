import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/errorHandler";
import { prisma } from "../../config/db";
import { createAuditLog } from "../audit/audit.service";

const createAnnouncementSchema = z.object({
  title: z.string().trim().min(2).max(150),
  body: z.string().trim().min(2).max(2000),
});

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const data = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { author: { select: { fullName: true, role: true } } },
    });
    res.status(200).json({ success: true, data });
  })
);

router.post(
  "/",
  validateBody(createAnnouncementSchema),
  asyncHandler(async (req, res) => {
    const { title, body } = req.body as z.infer<typeof createAnnouncementSchema>;
    const announcement = await prisma.announcement.create({
      data: { title, body, authorId: req.user!.id },
      include: { author: { select: { fullName: true, role: true } } },
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: "CREATE",
      entityType: "Announcement",
      entityId: announcement.id,
      metadata: { title },
    });

    res.status(201).json({ success: true, data: announcement });
  })
);

export default router;
