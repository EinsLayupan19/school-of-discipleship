import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/permit.middleware";
import { validateBody, validateQuery } from "../../middleware/validate.middleware";
import {
  createAttendanceSchema,
  listAttendanceQuerySchema,
  unlockAttendanceSchema,
  updateRecordsSchema,
} from "./attendance.schema";
import { attendanceController } from "./attendance.controller";

const router = Router();

router.use(requireAuth, requireRole(Role.SUPER_ADMIN, Role.MDC_FACILITATOR, Role.CC_FACILITATOR));

router.get("/", validateQuery(listAttendanceQuerySchema), attendanceController.listByClass);
router.get(
  "/dashboard",
  validateQuery(listAttendanceQuerySchema),
  attendanceController.classDashboard
);
router.get("/student/:studentId/summary", attendanceController.studentSummary);
router.get("/:id", attendanceController.getById);
router.post("/", validateBody(createAttendanceSchema), attendanceController.create);
router.patch("/:id/records", validateBody(updateRecordsSchema), attendanceController.updateRecords);
router.patch("/:id/submit", attendanceController.submit);

// Unlocking a submitted session is intentionally restricted beyond the base role check above.
router.patch(
  "/:id/unlock",
  requireRole(Role.SUPER_ADMIN),
  validateBody(unlockAttendanceSchema),
  attendanceController.unlock
);

export default router;
