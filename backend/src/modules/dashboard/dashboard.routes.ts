import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateQuery } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/errorHandler";
import { prisma } from "../../config/db";
import { getFacilitatorClassIds } from "../../shared/utils/facilitatorScope";

const router = Router();
router.use(requireAuth);

const querySchema = z.object({ batchId: z.string().uuid() });

router.get(
  "/",
  validateQuery(querySchema),
  asyncHandler(async (req, res) => {
    const { batchId } = req.query as unknown as z.infer<typeof querySchema>;
    const actor = req.user!;

    const batchClasses = await prisma.class.findMany({
      where: { batchId },
      select: { id: true, facilitatorId: true },
    });
    let classIds = batchClasses.map((c) => c.id);

    if (actor.role !== Role.SUPER_ADMIN) {
      const owned = await getFacilitatorClassIds(actor.id);
      classIds = classIds.filter((id) => owned.includes(id));
    }

    if (classIds.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          totalStudents: 0,
          today: { present: 0, late: 0, absent: 0 },
          attendancePercent: 0,
          totalChips: 0,
          topStudents: [],
          topGroups: [],
          warningList: [],
          recentActivity: [],
          attendanceChart: [],
          chipsChart: [],
          categoryStats: [],
        },
      });
      return;
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    const [
      totalStudents,
      todayRecords,
      allRecords,
      students,
      groups,
      chips,
      recentActivity,
      recentSessions,
    ] = await Promise.all([
      prisma.student.count({ where: { classId: { in: classIds }, isArchived: false } }),
      prisma.attendanceRecord.findMany({
        where: {
          attendance: { classId: { in: classIds }, sessionDate: { gte: todayStart, lt: todayEnd } },
        },
        select: { status: true },
      }),
      prisma.attendanceRecord.findMany({
        where: { attendance: { classId: { in: classIds } } },
        select: { studentId: true, status: true },
      }),
      prisma.student.findMany({
        where: { classId: { in: classIds }, isArchived: false },
        select: { id: true, fullName: true, category: true },
      }),
      prisma.group.findMany({
        where: { classId: { in: classIds } },
        select: { id: true, name: true },
      }),
      prisma.groupChip.findMany({
        where: { group: { classId: { in: classIds } } },
        select: { groupId: true, amount: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { actor: { select: { fullName: true } } },
      }),
      prisma.attendance.findMany({
        where: { classId: { in: classIds } },
        orderBy: { sessionDate: "desc" },
        take: 8,
        include: { records: { select: { status: true } } },
      }),
    ]);

    const today = {
      present: todayRecords.filter((r) => r.status === "PRESENT").length,
      late: todayRecords.filter((r) => r.status === "LATE").length,
      absent: todayRecords.filter((r) => r.status === "ABSENT").length,
    };

    const attended = allRecords.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
    const attendancePercent =
      allRecords.length > 0 ? Math.round((attended / allRecords.length) * 100) : 0;

    const totalChips = chips.reduce((sum, c) => sum + c.amount, 0);

    const recordsByStudent = new Map<string, { present: number; late: number; total: number }>();
    allRecords.forEach((r) => {
      const entry = recordsByStudent.get(r.studentId) ?? { present: 0, late: 0, total: 0 };
      entry.total += 1;
      if (r.status === "PRESENT") entry.present += 1;
      if (r.status === "LATE") entry.late += 1;
      recordsByStudent.set(r.studentId, entry);
    });

    const studentStats = students.map((s) => {
      const rec = recordsByStudent.get(s.id) ?? { present: 0, late: 0, total: 0 };
      const percentage =
        rec.total > 0 ? Math.round(((rec.present + rec.late) / rec.total) * 100) : 0;
      const absentCount = rec.total - rec.present - rec.late;
      return { studentId: s.id, fullName: s.fullName, percentage, absentCount };
    });

    const topStudents = [...studentStats].sort((a, b) => b.percentage - a.percentage).slice(0, 10);
    const warningList = studentStats.filter((s) => s.absentCount >= 3);

    const chipsByGroup = new Map<string, number>();
    chips.forEach((c) =>
      chipsByGroup.set(c.groupId, (chipsByGroup.get(c.groupId) ?? 0) + c.amount)
    );
    const topGroups = groups
      .map((g) => ({ groupId: g.id, name: g.name, totalChips: chipsByGroup.get(g.id) ?? 0 }))
      .sort((a, b) => b.totalChips - a.totalChips)
      .slice(0, 6);

    const attendanceChart = recentSessions
      .map((s) => ({
        date: s.sessionDate,
        present: s.records.filter((r) => r.status === "PRESENT").length,
        late: s.records.filter((r) => r.status === "LATE").length,
        absent: s.records.filter((r) => r.status === "ABSENT").length,
      }))
      .reverse();

    const categoryStats = ["YOUTH", "ADULT", "SENIOR"].map((category) => ({
      category,
      count: students.filter((s) => s.category === category).length,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        today,
        attendancePercent,
        totalChips,
        topStudents,
        topGroups,
        warningList,
        recentActivity,
        attendanceChart,
        chipsChart: topGroups.map((g) => ({ name: g.name, totalChips: g.totalChips })),
        categoryStats,
      },
    });
  })
);

export default router;
