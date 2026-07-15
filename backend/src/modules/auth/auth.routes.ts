import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/errorHandler";

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

export default router;
