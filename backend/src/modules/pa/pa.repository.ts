import { prisma } from "../../config/db";

export const paRepository = {
  findByClass(classId: string) {
    return prisma.pAActivity.findMany({
      where: { classId },
      orderBy: { sessionDate: "desc" },
      include: { scores: true },
    });
  },

  findById(id: string) {
    return prisma.pAActivity.findUnique({
      where: { id },
      include: {
        scores: { include: { group: { select: { id: true, name: true } } } },
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

  async create(classId: string, sessionDate: Date, topic: string | undefined) {
    const groups = await prisma.group.findMany({ where: { classId }, select: { id: true } });

    return prisma.pAActivity.create({
      data: {
        classId,
        sessionDate,
        topic,
        scores: {
          create: groups.map((g) => ({
            groupId: g.id,
            cleanliness: 0,
            creativity: 0,
            execution: 0,
            teamwork: 0,
            timeManagement: 0,
            totalScore: 0,
          })),
        },
      },
      include: { scores: { include: { group: { select: { id: true, name: true } } } } },
    });
  },

  async upsertScores(
    paActivityId: string,
    rows: {
      groupId: string;
      cleanliness: number;
      creativity: number;
      execution: number;
      teamwork: number;
      timeManagement: number;
      totalScore: number;
    }[]
  ) {
    await prisma.$transaction(
      rows.map((r) =>
        prisma.pAScore.upsert({
          where: { paActivityId_groupId: { paActivityId, groupId: r.groupId } },
          update: r,
          create: { paActivityId, ...r },
        })
      )
    );
  },

  setLocked(id: string, isLocked: boolean) {
    return prisma.pAActivity.update({ where: { id }, data: { isLocked } });
  },

  classProgram(classId: string) {
    return prisma.class.findUnique({
      where: { id: classId },
      select: { batch: { select: { program: true } } },
    });
  },
};
