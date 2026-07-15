import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";

const weekWithRelations = {
  include: { completedBy: { select: { id: true, fullName: true } } },
} satisfies Prisma.WeekDefaultArgs;

export const weekRepository = {
  findByBatch(batchId: string) {
    return prisma.week.findMany({
      where: { batchId },
      orderBy: { weekNumber: "asc" },
      ...weekWithRelations,
    });
  },

  findById(id: string) {
    return prisma.week.findUnique({
      where: { id },
      include: {
        completedBy: { select: { id: true, fullName: true } },
        batch: { select: { id: true, name: true, program: true } },
      },
    });
  },

  async nextWeekNumber(batchId: string): Promise<number> {
    const last = await prisma.week.findFirst({
      where: { batchId },
      orderBy: { weekNumber: "desc" },
    });
    return (last?.weekNumber ?? 0) + 1;
  },

  create(data: Prisma.WeekCreateInput) {
    return prisma.week.create({ data, ...weekWithRelations });
  },

  update(id: string, data: Prisma.WeekUpdateInput) {
    return prisma.week.update({ where: { id }, data, ...weekWithRelations });
  },
};
