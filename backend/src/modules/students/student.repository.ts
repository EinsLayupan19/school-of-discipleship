import { Prisma, Sex, StudentCategory } from "@prisma/client";
import { prisma } from "../../config/db";

interface FindManyParams {
  search?: string;
  batchId?: string;
  classId?: string;
  groupId?: string;
  category?: StudentCategory;
  sex?: Sex;
  status: "active" | "archived" | "all";
  page: number;
  pageSize: number;
  /** Restricts results to these class IDs — set for facilitators, undefined for Super Admin. */
  scopedClassIds?: string[];
}

const studentWithRelations = {
  include: {
    class: { include: { batch: { select: { id: true, name: true, program: true } } } },
    group: { select: { id: true, name: true } },
  },
} satisfies Prisma.StudentDefaultArgs;

export const studentRepository = {
  async findMany(params: FindManyParams) {
    const where: Prisma.StudentWhereInput = {
      ...(params.status === "active" ? { isArchived: false } : {}),
      ...(params.status === "archived" ? { isArchived: true } : {}),
      ...(params.classId ? { classId: params.classId } : {}),
      ...(params.groupId ? { groupId: params.groupId } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.sex ? { sex: params.sex } : {}),
      ...(params.batchId ? { class: { batchId: params.batchId } } : {}),
      ...(params.scopedClassIds ? { classId: { in: params.scopedClassIds } } : {}),
      ...(params.search ? { fullName: { contains: params.search, mode: "insensitive" } } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.student.findMany({
        where,
        ...studentWithRelations,
        orderBy: { fullName: "asc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.student.count({ where }),
    ]);

    return { data, total };
  },

  findById(id: string) {
    return prisma.student.findUnique({ where: { id }, ...studentWithRelations });
  },

  create(data: Prisma.StudentCreateInput) {
    return prisma.student.create({ data, ...studentWithRelations });
  },

  createMany(data: Prisma.StudentCreateManyInput[]) {
    return prisma.student.createMany({ data });
  },

  update(id: string, data: Prisma.StudentUpdateInput) {
    return prisma.student.update({ where: { id }, data, ...studentWithRelations });
  },

  delete(id: string) {
    return prisma.student.delete({ where: { id } });
  },
};
