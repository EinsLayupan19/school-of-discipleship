import { AttendanceStatus, Role } from "@prisma/client";
import { attendanceRepository } from "./attendance.repository";
import { createAuditLog } from "../audit/audit.service";
import { prisma } from "../../config/db";
import { getFacilitatorClassIds } from "../../shared/utils/facilitatorScope";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors/AppError";
import type { AuthUser } from "../../shared/types";
import type { CreateAttendanceInput, UpdateRecordsInput } from "./attendance.schema";

/** A student is flagged at-risk once their cumulative absences in a class reach this. */
const DROP_WARNING_THRESHOLD = 3;

async function assertClassAccess(classId: string, actor: AuthUser) {
  if (actor.role === Role.SUPER_ADMIN) return;
  const ownedClassIds = await getFacilitatorClassIds(actor.id);
  if (!ownedClassIds.includes(classId)) {
    throw new ForbiddenError("You don't have access to this class");
  }
}

function summarizeStatuses(records: { status: AttendanceStatus }[]) {
  const presentCount = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
  const lateCount = records.filter((r) => r.status === AttendanceStatus.LATE).length;
  const absentCount = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
  const excusedCount = records.filter((r) => r.status === AttendanceStatus.EXCUSED).length;
  const total = records.length;
  // Present and Late both count as "showed up" for the percentage; only
  // Absent counts against it. Excused is tracked but doesn't penalize.
  const attendedCount = presentCount + lateCount;
  const percentage = total > 0 ? Math.round((attendedCount / total) * 100) : 0;

  return { presentCount, lateCount, absentCount, excusedCount, total, percentage };
}

export const attendanceService = {
  async listByClass(classId: string, actor: AuthUser) {
    await assertClassAccess(classId, actor);
    const sessions = await attendanceRepository.findByClass(classId);
    return sessions.map((session) => ({
      ...session,
      summary: summarizeStatuses(session.records),
    }));
  },

  async getById(id: string, actor: AuthUser) {
    const session = await attendanceRepository.findById(id);
    if (!session) throw new NotFoundError("Attendance session");
    await assertClassAccess(session.classId, actor);
    return session;
  },

  async create(input: CreateAttendanceInput, actor: AuthUser) {
    await assertClassAccess(input.classId, actor);

    const session = await attendanceRepository.create(
      input.classId,
      input.sessionDate,
      input.topic
    );

    await createAuditLog({
      actorId: actor.id,
      action: "CREATE",
      entityType: "Attendance",
      entityId: session.id,
      metadata: {
        classId: input.classId,
        sessionDate: input.sessionDate,
        studentCount: session.records.length,
      },
    });

    return session;
  },

  async updateRecords(id: string, input: UpdateRecordsInput, actor: AuthUser) {
    const session = await attendanceRepository.findById(id);
    if (!session) throw new NotFoundError("Attendance session");
    await assertClassAccess(session.classId, actor);

    if (session.isLocked) {
      throw new ForbiddenError(
        "This session is locked. Ask a Super Admin to unlock it before editing."
      );
    }

    await attendanceRepository.upsertRecords(id, input.records);

    await createAuditLog({
      actorId: actor.id,
      action: "UPDATE",
      entityType: "Attendance",
      entityId: id,
      metadata: { updatedCount: input.records.length },
    });

    return attendanceRepository.findById(id);
  },

  /** Locks the session — the "Lock after submission" requirement. */
  async submit(id: string, actor: AuthUser) {
    const session = await attendanceRepository.findById(id);
    if (!session) throw new NotFoundError("Attendance session");
    await assertClassAccess(session.classId, actor);

    if (session.isLocked) {
      throw new ValidationError("This session is already submitted and locked");
    }

    const locked = await attendanceRepository.lock(id, actor.id);

    await createAuditLog({
      actorId: actor.id,
      action: "UPDATE",
      entityType: "Attendance",
      entityId: id,
      metadata: { submitted: true },
    });

    return locked;
  },

  /** Super Admin only — enforced at the route level. */
  async unlock(id: string, reason: string, actor: AuthUser) {
    const session = await attendanceRepository.findById(id);
    if (!session) throw new NotFoundError("Attendance session");
    if (!session.isLocked) {
      throw new ValidationError("This session isn't locked");
    }

    const unlocked = await attendanceRepository.unlock(id);

    await prisma.unlockLog.create({
      data: { actorId: actor.id, entityType: "Attendance", entityId: id, reason },
    });

    await createAuditLog({
      actorId: actor.id,
      action: "UNLOCK",
      entityType: "Attendance",
      entityId: id,
      metadata: { reason },
    });

    return unlocked;
  },

  /**
   * Attendance Dashboard: per-student percentage + drop warning, plus a
   * class-wide average. Denominator per student is THEIR OWN record count
   * (not total class sessions) so a student added mid-term isn't unfairly
   * penalized for sessions before they existed.
   */
  async classDashboard(classId: string, actor: AuthUser) {
    await assertClassAccess(classId, actor);

    const [students, allRecords, sessions] = await Promise.all([
      attendanceRepository.activeStudentsInClass(classId),
      attendanceRepository.findAllRecordsForClass(classId),
      attendanceRepository.findByClass(classId),
    ]);

    const recordsByStudent = new Map<string, AttendanceStatus[]>();
    for (const record of allRecords) {
      const list = recordsByStudent.get(record.studentId) ?? [];
      list.push(record.status);
      recordsByStudent.set(record.studentId, list);
    }

    const studentStats = students.map((student) => {
      const statuses = recordsByStudent.get(student.id) ?? [];
      const summary = summarizeStatuses(statuses.map((status) => ({ status })));
      return {
        studentId: student.id,
        fullName: student.fullName,
        ...summary,
        dropWarning: summary.absentCount >= DROP_WARNING_THRESHOLD,
      };
    });

    const classAttendedTotal = studentStats.reduce(
      (sum, s) => sum + s.presentCount + s.lateCount,
      0
    );
    const classRecordTotal = studentStats.reduce((sum, s) => sum + s.total, 0);
    const classAveragePercent =
      classRecordTotal > 0 ? Math.round((classAttendedTotal / classRecordTotal) * 100) : 0;

    return {
      totalSessions: sessions.length,
      classAveragePercent,
      studentsOnDropWarning: studentStats.filter((s) => s.dropWarning).length,
      students: studentStats,
    };
  },

  /** Used by the Student Profile page to show one student's attendance stat line. */
  async studentSummary(studentId: string, actor: AuthUser) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });
    if (!student) throw new NotFoundError("Student");
    await assertClassAccess(student.classId, actor);

    const records = await attendanceRepository.studentRecords(studentId);
    const summary = summarizeStatuses(records);

    return { ...summary, dropWarning: summary.absentCount >= DROP_WARNING_THRESHOLD };
  },
};
