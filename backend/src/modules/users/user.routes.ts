import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/permit.middleware";
import { validateBody, validateQuery } from "../../middleware/validate.middleware";
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from "./user.schema";
import { userController } from "./user.controller";

const router = Router();

// Every route below requires a valid session AND the Super Admin role —
// enforced once here rather than repeated per-route.
router.use(requireAuth, requireRole(Role.SUPER_ADMIN));

router.get("/", validateQuery(listUsersQuerySchema), userController.list);
router.post("/", validateBody(createUserSchema), userController.create);
router.patch("/:id", validateBody(updateUserSchema), userController.update);
router.patch("/:id/deactivate", userController.deactivate);
router.patch("/:id/reactivate", userController.reactivate);
router.post("/:id/reset-password", userController.resetPassword);

export default router;
