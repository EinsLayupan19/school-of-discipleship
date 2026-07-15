import { ActivityType, Prisma } from "@prisma/client";
import { prisma } from "../../config/db";

export const activityRepository = {
  findByClass(classId: string, type?: ActivityType, search?: string) {
    return prisma.activity.findMany({
      where: {
        classId,
        ...(type ? { type } : {}),
        ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      },
      include: { scores: true },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.activity.findUnique({
      where: { id },
      include: {
        scores: { include: { student: { select: { id: true, fullName: true } } } },
        class: { select: { id: true, name: true } },
      },
    });
  },

  create(data: Prisma.ActivityCreateInput) {
    return prisma.activity.create({ data });
  },

  update(id: string, data: Prisma.ActivityUpdateInput) {
    return prisma.activity.update({ where: { id }, data });
  },

  setLocked(id: string, isLocked: boolean) {
    return prisma.activity.update({ where: { id }, data: { isLocked } });
  },

  async upsertScores(activityId: string, scores: { studentId: string; score: number }[]) {
    await prisma.$transaction(
      scores.map((s) =>
        prisma.activityScore.upsert({
          where: { activityId_studentId: { activityId, studentId: s.studentId } },
          update: { score: s.score },
          create: { activityId, studentId: s.studentId, score: s.score },
        })
      )
    );
  },

  activeStudentsInClass(classId: string) {
    return prisma.student.findMany({
      where: { classId, isArchived: false },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    });
  },
};
