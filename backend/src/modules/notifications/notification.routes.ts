import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/errorHandler";
import { prisma } from "../../config/db";
import { getFacilitatorClassIds } from "../../shared/utils/facilitatorScope";

const router = Router();
router.use(requireAuth);

/** GET /api/notifications — persisted (unlocks) + computed (reminders), newest first. */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const actor = req.user!;

    const persisted = await prisma.notification.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const classIds =
      actor.role === Role.SUPER_ADMIN
        ? (await prisma.class.findMany({ select: { id: true } })).map((c) => c.id)
        : await getFacilitatorClassIds(actor.id);

    const reminders: {
      id: string;
      type: string;
      title: string;
      message: string;
      createdAt: string;
    }[] = [];

    if (classIds.length > 0) {
      // Upcoming Sunday: any class with no attendance session yet for the next Sunday.
      const today = new Date();
      const nextSunday = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() + ((7 - today.getUTCDay()) % 7 || 7)
        )
      );
      const classesWithSession = await prisma.attendance.findMany({
        where: { classId: { in: classIds }, sessionDate: nextSunday },
        select: { classId: true },
      });
      const coveredIds = new Set(classesWithSession.map((c) => c.classId));
      const classesNeeded = await prisma.class.findMany({
        where: { id: { in: classIds.filter((id) => !coveredIds.has(id)) } },
        select: { id: true, name: true },
      });
      classesNeeded.forEach((c) =>
        reminders.push({
          id: `upcoming-${c.id}`,
          type: "UPCOMING_SESSION",
          title: "Upcoming Sunday session",
          message: `No attendance session created yet for "${c.name}" on ${nextSunday.toLocaleDateString()}.`,
          createdAt: new Date().toISOString(),
        })
      );

      // Drop warnings: students with 3+ absences.
      const absentGroups = await prisma.attendanceRecord.groupBy({
        by: ["studentId"],
        where: { status: "ABSENT", attendance: { classId: { in: classIds } } },
        _count: true,
      });
      const atRiskIds = absentGroups.filter((g) => g._count >= 3).map((g) => g.studentId);
      if (atRiskIds.length > 0) {
        const students = await prisma.student.findMany({
          where: { id: { in: atRiskIds } },
          select: { id: true, fullName: true },
        });
        students.forEach((s) =>
          reminders.push({
            id: `drop-${s.id}`,
            type: "DROP_WARNING",
            title: "Drop warning",
            message: `${s.fullName} has 3 or more absences.`,
            createdAt: new Date().toISOString(),
          })
        );
      }

      // Pending actions: unsubmitted (draft) sessions.
      const [draftAttendance, draftActivities, draftPA] = await Promise.all([
        prisma.attendance.findMany({
          where: { classId: { in: classIds }, isLocked: false },
          select: { id: true, sessionDate: true, class: { select: { name: true } } },
        }),
        prisma.activity.findMany({
          where: { classId: { in: classIds }, isLocked: false },
          select: { id: true, title: true },
        }),
        prisma.pAActivity.findMany({
          where: { classId: { in: classIds }, isLocked: false },
          select: { id: true, sessionDate: true, class: { select: { name: true } } },
        }),
      ]);
      draftAttendance.forEach((a) =>
        reminders.push({
          id: `pending-attn-${a.id}`,
          type: "PENDING_ACTION",
          title: "Attendance not submitted",
          message: `${a.class.name} — ${new Date(a.sessionDate).toLocaleDateString()} attendance is still a draft.`,
          createdAt: new Date().toISOString(),
        })
      );
      draftActivities.forEach((a) =>
        reminders.push({
          id: `pending-act-${a.id}`,
          type: "PENDING_ACTION",
          title: "Activity not submitted",
          message: `"${a.title}" scores are still a draft.`,
          createdAt: new Date().toISOString(),
        })
      );
      draftPA.forEach((p) =>
        reminders.push({
          id: `pending-pa-${p.id}`,
          type: "PENDING_ACTION",
          title: "PA not submitted",
          message: `${p.class.name} — ${new Date(p.sessionDate).toLocaleDateString()} PA is still a draft.`,
          createdAt: new Date().toISOString(),
        })
      );
    }

    res.status(200).json({
      success: true,
      data: {
        persisted,
        reminders,
        unreadCount: persisted.filter((n) => !n.isRead).length + reminders.length,
      },
    });
  })
);

router.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.user!.id) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.status(200).json({ success: true, data: updated });
  })
);

router.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    res.status(200).json({ success: true });
  })
);

export default router;
