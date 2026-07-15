import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/permit.middleware";
import { validateBody, validateQuery } from "../../middleware/validate.middleware";
import {
  createActivitySchema,
  listActivitiesQuerySchema,
  unlockActivitySchema,
  updateActivitySchema,
  upsertScoresSchema,
} from "./activity.schema";
import { activityController } from "./activity.controller";

const router = Router();

router.use(requireAuth, requireRole(Role.SUPER_ADMIN, Role.MDC_FACILITATOR, Role.CC_FACILITATOR));

router.get("/", validateQuery(listActivitiesQuerySchema), activityController.list);
router.get("/:id", activityController.getById);
router.post("/", validateBody(createActivitySchema), activityController.create);
router.patch("/:id", validateBody(updateActivitySchema), activityController.update);
router.patch("/:id/scores", validateBody(upsertScoresSchema), activityController.upsertScores);
router.patch("/:id/submit", activityController.submit);
router.patch(
  "/:id/unlock",
  requireRole(Role.SUPER_ADMIN),
  validateBody(unlockActivitySchema),
  activityController.unlock
);

export default router;
