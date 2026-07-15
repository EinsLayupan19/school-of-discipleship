import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/permit.middleware";
import { validateBody, validateQuery } from "../../middleware/validate.middleware";
import {
  createWeekSchema,
  listWeeksQuerySchema,
  unlockWeekSchema,
  updateWeekSchema,
} from "./week.schema";
import { weekController } from "./week.controller";

const router = Router();

router.use(requireAuth, requireRole(Role.SUPER_ADMIN, Role.MDC_FACILITATOR, Role.CC_FACILITATOR));

router.get("/", validateQuery(listWeeksQuerySchema), weekController.listByBatch);
router.post("/", validateBody(createWeekSchema), weekController.create);
router.patch("/:id", validateBody(updateWeekSchema), weekController.update);

// Unlocking a completed week is intentionally restricted beyond the base role check above.
router.patch(
  "/:id/unlock",
  requireRole(Role.SUPER_ADMIN),
  validateBody(unlockWeekSchema),
  weekController.unlock
);

export default router;
