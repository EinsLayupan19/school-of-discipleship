import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/errorHandler";
import { createAuditLog } from "../audit/audit.service";
import { supabaseAdmin } from "../../config/supabase";
import { prisma } from "../../config/db";
import { ValidationError } from "../../shared/errors/AppError";

const router = Router();

/**
 * GET /api/auth/me
 * Returns the logged-in user's own profile (id, email, fullName, role).
 * The frontend calls this right after Supabase login succeeds, to learn
 * the user's role and decide what the Dashboard should show them.
 */
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  })
);

/**
 * POST /api/auth/login-event
 * Called by the frontend right after a successful Supabase sign-in, since
 * login itself happens client-side and the backend never sees it otherwise.
 * Powers "Login history" in the audit trail.
 */
router.post(
  "/login-event",
  requireAuth,
  asyncHandler(async (req, res) => {
    await createAuditLog({
      actorId: req.user!.id,
      action: "LOGIN",
      entityType: "User",
      entityId: req.user!.id,
    });
    res.status(200).json({ success: true });
  })
);

const changePasswordSchema = z.object({ newPassword: z.string().min(8, "At least 8 characters") });

/** POST /api/auth/change-password — self-service password change for the logged-in user. */
router.post(
  "/change-password",
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { newPassword } = req.body as z.infer<typeof changePasswordSchema>;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new ValidationError("User not found");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.authId, {
      password: newPassword,
    });
    if (error) throw new ValidationError(error.message);

    await createAuditLog({
      actorId: req.user!.id,
      action: "RESET_PASSWORD",
      entityType: "User",
      entityId: req.user!.id,
      metadata: { selfService: true },
    });

    res.status(200).json({ success: true });
  })
);

export default router;
