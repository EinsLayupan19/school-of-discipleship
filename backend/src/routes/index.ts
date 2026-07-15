import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/user.routes";
import auditLogRoutes from "../modules/audit/audit.routes";
import studentRoutes from "../modules/students/student.routes";
import academicRoutes from "../modules/academic/academic.routes";
import weekRoutes from "../modules/weeks/week.routes";
import attendanceRoutes from "../modules/attendance/attendance.routes";
import activityRoutes from "../modules/activities/activity.routes";

/**
 * Root API router. Each module (users, auth, audit, etc.) will
 * register its own router here as it's built in later phases —
 * this file is the single source of truth for the API's route tree.
 */
const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/audit-logs", auditLogRoutes);
router.use("/students", studentRoutes);
router.use("/academic", academicRoutes);
router.use("/weeks", weekRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/activities", activityRoutes);

export default router;
