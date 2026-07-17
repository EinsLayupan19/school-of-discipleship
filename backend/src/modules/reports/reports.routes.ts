import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/permit.middleware";
import { asyncHandler } from "../../middleware/errorHandler";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors/AppError";
import { prisma } from "../../config/db";
import { getFacilitatorClassIds } from "../../shared/utils/facilitatorScope";
import { sendFile, toCSV, toPDF, toXLSX, type Column } from "../../shared/utils/exporters";

const router = Router();
router.use(requireAuth, requireRole(Role.SUPER_ADMIN, Role.MDC_FACILITATOR, Role.CC_FACILITATOR));

const formatSchema = z.enum(["csv", "xlsx", "pdf"]);

async function assertClassAccess(classId: string, actorId: string, role: Role) {
  if (role === Role.SUPER_ADMIN) return;
  const owned = await getFacilitatorClassIds(actorId);
  if (!owned.includes(classId)) throw new ForbiddenError("You don't have access to this class");
}

/** date/week/month/phase filters all collapse to a single [from, to) date range before reaching here. */
function dateRangeFilter(dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) return {};
  return {
    ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
    ...(dateTo ? { lt: new Date(dateTo) } : {}),
  };
}

async function respond(
  res: import("express").Response,
  format: "csv" | "xlsx" | "pdf",
  filename: string,
  title: string,
  columns: Column[],
  rows: Record<string, unknown>[]
) {
  if (rows.length === 0) throw new ValidationError("No data for the selected filters");
  if (format === "csv") return sendFile(res, "csv", filename, toCSV(columns, rows));
  if (format === "xlsx") return sendFile(res, "xlsx", filename, toXLSX(columns, rows));
  return sendFile(res, "pdf", filename, await toPDF(title, columns, rows));
}

// ── Attendance report ────────────────────────────────────────────────
const attendanceQuery = z.object({
  classId: z.string().uuid(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: formatSchema,
});

router.get(
  "/attendance",
  asyncHandler(async (req, res) => {
    const { classId, dateFrom, dateTo, format } = attendanceQuery.parse(req.query);
    await assertClassAccess(classId, req.user!.id, req.user!.role);

    const sessions = await prisma.attendance.findMany({
      where: { classId, sessionDate: dateRangeFilter(dateFrom, dateTo) },
      include: { records: { include: { student: { select: { fullName: true } } } } },
      orderBy: { sessionDate: "asc" },
    });

    const rows = sessions.flatMap((s) =>
      s.records.map((r) => ({
        date: s.sessionDate.toLocaleDateString(),
        student: r.student.fullName,
        status: r.status,
        remarks: r.remarks ?? "",
      }))
    );

    const columns: Column[] = [
      { key: "date", label: "Date" },
      { key: "student", label: "Student" },
      { key: "status", label: "Status" },
      { key: "remarks", label: "Remarks" },
    ];

    await respond(res, format, "attendance-report", "Attendance Report", columns, rows);
  })
);

// ── Chips report ─────────────────────────────────────────────────────
const chipsQuery = z.object({
  classId: z.string().uuid(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: formatSchema,
});

router.get(
  "/chips",
  asyncHandler(async (req, res) => {
    const { classId, dateFrom, dateTo, format } = chipsQuery.parse(req.query);
    await assertClassAccess(classId, req.user!.id, req.user!.role);

    const chips = await prisma.groupChip.findMany({
      where: { group: { classId }, createdAt: dateRangeFilter(dateFrom, dateTo) },
      include: { group: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });

    const rows = chips.map((c) => ({
      date: c.createdAt.toLocaleDateString(),
      group: c.group.name,
      amount: c.amount,
      reason: c.reason ?? "",
    }));

    const columns: Column[] = [
      { key: "date", label: "Date" },
      { key: "group", label: "Group" },
      { key: "amount", label: "Amount" },
      { key: "reason", label: "Reason" },
    ];

    await respond(res, format, "chips-report", "Chips Report", columns, rows);
  })
);

// ── Student profile report ──────────────────────────────────────────
const studentQuery = z.object({ format: formatSchema });

router.get(
  "/student/:studentId",
  asyncHandler(async (req, res) => {
    const { format } = studentQuery.parse(req.query);
    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
      include: { class: { select: { name: true } }, group: { select: { name: true } } },
    });
    if (!student) throw new NotFoundError("Student");
    await assertClassAccess(student.classId, req.user!.id, req.user!.role);

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: student.id },
      include: { attendance: { select: { sessionDate: true } } },
      orderBy: { attendance: { sessionDate: "asc" } },
    });

    const rows = records.map((r) => ({
      date: r.attendance.sessionDate.toLocaleDateString(),
      status: r.status,
      remarks: r.remarks ?? "",
    }));

    const columns: Column[] = [
      { key: "date", label: "Date" },
      { key: "status", label: "Status" },
      { key: "remarks", label: "Remarks" },
    ];

    await respond(
      res,
      format,
      `student-${student.fullName.replace(/\s+/g, "-")}`,
      `Student Report — ${student.fullName} (${student.class.name}${student.group ? ", " + student.group.name : ""})`,
      columns,
      rows
    );
  })
);

// ── Group report ─────────────────────────────────────────────────────
router.get(
  "/group/:groupId",
  asyncHandler(async (req, res) => {
    const { format } = studentQuery.parse(req.query);
    const group = await prisma.group.findUnique({
      where: { id: req.params.groupId },
      select: { id: true, name: true, classId: true, class: { select: { name: true } } },
    });
    if (!group) throw new NotFoundError("Group");
    await assertClassAccess(group.classId, req.user!.id, req.user!.role);

    const chips = await prisma.groupChip.findMany({
      where: { groupId: group.id },
      orderBy: { createdAt: "asc" },
    });
    const paScores = await prisma.pAScore.findMany({
      where: { groupId: group.id },
      include: { paActivity: { select: { sessionDate: true } } },
      orderBy: { paActivity: { sessionDate: "asc" } },
    });

    const rows = [
      ...chips.map((c) => ({
        date: c.createdAt.toLocaleDateString(),
        type: "Chip",
        detail: `${c.amount > 0 ? "+" : ""}${c.amount} (${c.reason ?? ""})`,
      })),
      ...paScores.map((p) => ({
        date: p.paActivity.sessionDate.toLocaleDateString(),
        type: "PA Score",
        detail: `${p.totalScore}`,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    const columns: Column[] = [
      { key: "date", label: "Date" },
      { key: "type", label: "Type" },
      { key: "detail", label: "Detail" },
    ];

    await respond(
      res,
      format,
      `group-${group.name.replace(/\s+/g, "-")}`,
      `Group Report — ${group.name} (${group.class.name})`,
      columns,
      rows
    );
  })
);

// ── Category report ──────────────────────────────────────────────────
const categoryQuery = z.object({ classId: z.string().uuid(), format: formatSchema });

router.get(
  "/category",
  asyncHandler(async (req, res) => {
    const { classId, format } = categoryQuery.parse(req.query);
    await assertClassAccess(classId, req.user!.id, req.user!.role);

    const students = await prisma.student.findMany({
      where: { classId, isArchived: false },
      select: { fullName: true, category: true, sex: true },
      orderBy: [{ category: "asc" }, { fullName: "asc" }],
    });

    const rows = students.map((s) => ({ name: s.fullName, category: s.category, sex: s.sex }));
    const columns: Column[] = [
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "sex", label: "Sex" },
    ];

    await respond(res, format, "category-report", "Category Report", columns, rows);
  })
);

// ── Printable attendance sheet (blank/filled roster for one session) ──
router.get(
  "/attendance-sheet",
  asyncHandler(async (req, res) => {
    const { attendanceId } = z.object({ attendanceId: z.string().uuid() }).parse(req.query);

    const session = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        class: { select: { name: true, batch: { select: { name: true } } } },
        records: {
          include: { student: { select: { fullName: true } } },
          orderBy: { student: { fullName: "asc" } },
        },
      },
    });
    if (!session) throw new NotFoundError("Attendance session");
    await assertClassAccess(session.classId, req.user!.id, req.user!.role);

    const rows = session.records.map((r) => ({
      name: r.student.fullName,
      status: r.status,
      signature: "",
    }));
    const columns: Column[] = [
      { key: "name", label: "Name" },
      { key: "status", label: "Status" },
      { key: "signature", label: "Signature" },
    ];

    const pdf = await toPDF(
      `Attendance Sheet — ${session.class.name} (${session.class.batch.name}) — ${session.sessionDate.toLocaleDateString()}`,
      columns,
      rows
    );
    sendFile(res, "pdf", "attendance-sheet", pdf);
  })
);

export default router;
