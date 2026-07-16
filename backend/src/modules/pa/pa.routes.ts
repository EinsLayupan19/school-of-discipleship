import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/permit.middleware";
import { validateBody, validateQuery } from "../../middleware/validate.middleware";
import {
  createPASchema,
  listPAQuerySchema,
  unlockPASchema,
  upsertPAScoresSchema,
} from "./pa.schema";
import { paController } from "./pa.controller";

const router = Router();

router.use(requireAuth, requireRole(Role.SUPER_ADMIN, Role.MDC_FACILITATOR, Role.CC_FACILITATOR));

router.get("/", validateQuery(listPAQuerySchema), paController.listByClass);
router.get("/:id", paController.getById);
router.post("/", validateBody(createPASchema), paController.create);
router.patch("/:id/scores", validateBody(upsertPAScoresSchema), paController.upsertScores);
router.patch("/:id/submit", paController.submit);
router.patch(
  "/:id/unlock",
  requireRole(Role.SUPER_ADMIN),
  validateBody(unlockPASchema),
  paController.unlock
);

export default router;
