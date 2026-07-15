import { AttendanceStatus } from "@prisma/client";
import { prisma } from "../../config/db";

export const attendanceRepository = {
  findByClass(classId: string) {
    return prisma.attendance.findMany({
      where: { classId },
      orderBy: { sessionDate: "desc" },
      include: {
        records: { select: { status: true } },
        lockedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  findById(id: string) {
    return prisma.attendance.findUnique({
      where: { id },
      include: {
        records: {
          include: { student: { select: { id: true, fullName: true } } },
          orderBy: { student: { fullName: "asc" } },
        },
        lockedBy: { select: { id: true, fullName: true } },
        class: {
          select: {
            id: true,
            name: true,
            batch: { select: { id: true, name: true, program: true } },
          },
        },
      },
    });
  },

  /** Creates a session and auto-creates one ABSENT record per active student — the facilitator then flips whoever was present/late. */
  async create(classId: string, sessionDate: Date, topic: string | undefined) {
    const students = await prisma.student.findMany({
      where: { classId, isArchived: false },
      select: { id: true },
    });

    return prisma.attendance.create({
      data: {
        classId,
        sessionDate,
        topic,
        records: {
          create: students.map((s) => ({ studentId: s.id, status: AttendanceStatus.ABSENT })),
        },
      },
      include: {
        records: { include: { student: { select: { id: true, fullName: true } } } },
      },
    });
  },

  async upsertRecords(
    attendanceId: string,
    records: { studentId: string; status: AttendanceStatus; remarks?: string }[]
  ) {
    await prisma.$transaction(
      records.map((r) =>
        prisma.attendanceRecord.upsert({
          where: { attendanceId_studentId: { attendanceId, studentId: r.studentId } },
          update: { status: r.status, remarks: r.remarks },
          create: { attendanceId, studentId: r.studentId, status: r.status, remarks: r.remarks },
        })
      )
    );
  },

  lock(id: string, actorId: string) {
    return prisma.attendance.update({
      where: { id },
      data: { isLocked: true, lockedBy: { connect: { id: actorId } }, lockedAt: new Date() },
    });
  },

  unlock(id: string) {
    return prisma.attendance.update({
      where: { id },
      data: { isLocked: false, lockedBy: { disconnect: true }, lockedAt: null },
    });
  },

  /** Every student's every attendance record within a class — aggregated in the service, not here, to keep this layer a thin data-access one. */
  findAllRecordsForClass(classId: string) {
    return prisma.attendanceRecord.findMany({
      where: { attendance: { classId } },
      select: { studentId: true, status: true },
    });
  },

  activeStudentsInClass(classId: string) {
    return prisma.student.findMany({
      where: { classId, isArchived: false },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    });
  },

  studentRecords(studentId: string) {
    return prisma.attendanceRecord.findMany({
      where: { studentId },
      select: { status: true },
    });
  },
};
