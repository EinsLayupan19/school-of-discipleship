import { Router } from "express";

const router = Router();

/**
 * GET /api/health
 * Used by Railway (and us, during setup) to confirm the server is alive.
 * Extended in Phase 2 to also ping the database.
 */
router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "School of Discipleship API",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default router;
