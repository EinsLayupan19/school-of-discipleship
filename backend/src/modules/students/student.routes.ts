import { Router } from "express";
import multer from "multer";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/permit.middleware";
import { validateBody, validateQuery } from "../../middleware/validate.middleware";
import {
  createStudentSchema,
  listStudentsQuerySchema,
  updateStudentSchema,
} from "./student.schema";
import { studentController } from "./student.controller";

// Excel files only, kept in memory (never written to disk) since we parse
// and discard the buffer immediately. 5MB is generous for a roster file.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

// Every route requires login and one of these three roles. Facilitator
// ownership scoping (their own classes only) happens inside the service.
router.use(requireAuth, requireRole(Role.SUPER_ADMIN, Role.MDC_FACILITATOR, Role.CC_FACILITATOR));

router.get("/", validateQuery(listStudentsQuerySchema), studentController.list);
router.get("/:id", studentController.getById);
router.post("/", validateBody(createStudentSchema), studentController.create);
router.post("/import", upload.single("file"), studentController.import);
router.patch("/:id", validateBody(updateStudentSchema), studentController.update);
router.patch("/:id/archive", studentController.archive);
router.patch("/:id/unarchive", studentController.unarchive);

// Hard delete is destructive (cascades to attendance/grade/demerit records)
// and is intentionally restricted beyond the base role check above.
router.delete("/:id", requireRole(Role.SUPER_ADMIN), studentController.remove);

export default router;
