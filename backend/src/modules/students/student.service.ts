import * as XLSX from "xlsx";
import { Role } from "@prisma/client";
import { studentRepository } from "./student.repository";
import { createAuditLog } from "../audit/audit.service";
import { getFacilitatorClassIds } from "../../shared/utils/facilitatorScope";
import { parseCategory, parseSex } from "../../shared/utils/excelParsing";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors/AppError";
import { prisma } from "../../config/db";
import type { AuthUser } from "../../shared/types";
import type { CreateStudentInput, ListStudentsQuery, UpdateStudentInput } from "./student.schema";

/** Facilitators are scoped to their own classes; Super Admin sees everything. */
async function resolveScope(actor: AuthUser): Promise<string[] | undefined> {
  if (actor.role === Role.SUPER_ADMIN) return undefined;
  return getFacilitatorClassIds(actor.id);
}

/** Throws if `classId` isn't one the actor is allowed to touch. */
async function assertClassAccess(classId: string, actor: AuthUser) {
  if (actor.role === Role.SUPER_ADMIN) return;
  const ownedClassIds = await getFacilitatorClassIds(actor.id);
  if (!ownedClassIds.includes(classId)) {
    throw new ForbiddenError("You don't have access to this class");
  }
}

export const studentService = {
  async list(query: ListStudentsQuery, actor: AuthUser) {
    const scopedClassIds = await resolveScope(actor);

    const { data, total } = await studentRepository.findMany({
      ...query,
      scopedClassIds,
    });

    return {
      data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  },

  async getById(id: string, actor: AuthUser) {
    const student = await studentRepository.findById(id);
    if (!student) throw new NotFoundError("Student");
    await assertClassAccess(student.classId, actor);
    return student;
  },

  async create(input: CreateStudentInput, actor: AuthUser) {
    await assertClassAccess(input.classId, actor);

    const student = await studentRepository.create({
      fullName: input.fullName,
      sex: input.sex,
      category: input.category,
      class: { connect: { id: input.classId } },
      ...(input.groupId ? { group: { connect: { id: input.groupId } } } : {}),
    });

    await createAuditLog({
      actorId: actor.id,
      action: "CREATE",
      entityType: "Student",
      entityId: student.id,
      metadata: { fullName: student.fullName, classId: student.classId },
    });

    return student;
  },

  async update(id: string, input: UpdateStudentInput, actor: AuthUser) {
    const existing = await studentRepository.findById(id);
    if (!existing) throw new NotFoundError("Student");

    await assertClassAccess(existing.classId, actor);
    if (input.classId) {
      await assertClassAccess(input.classId, actor);
    }

    const student = await studentRepository.update(id, {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.sex !== undefined ? { sex: input.sex } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.classId !== undefined ? { class: { connect: { id: input.classId } } } : {}),
      ...(input.groupId !== undefined
        ? input.groupId
          ? { group: { connect: { id: input.groupId } } }
          : { group: { disconnect: true } }
        : {}),
    });

    await createAuditLog({
      actorId: actor.id,
      action: "UPDATE",
      entityType: "Student",
      entityId: student.id,
      metadata: {
        before: {
          fullName: existing.fullName,
          classId: existing.classId,
          groupId: existing.groupId,
        },
        after: input,
      },
    });

    return student;
  },

  async setArchived(id: string, isArchived: boolean, actor: AuthUser) {
    const existing = await studentRepository.findById(id);
    if (!existing) throw new NotFoundError("Student");
    await assertClassAccess(existing.classId, actor);

    const student = await studentRepository.update(id, { isArchived });

    await createAuditLog({
      actorId: actor.id,
      action: isArchived ? "ARCHIVE" : "UNARCHIVE",
      entityType: "Student",
      entityId: student.id,
    });

    return student;
  },

  /** Hard delete — route-level requireRole already restricts this to Super Admin. */
  async remove(id: string, actor: AuthUser) {
    const existing = await studentRepository.findById(id);
    if (!existing) throw new NotFoundError("Student");

    await studentRepository.delete(id);

    await createAuditLog({
      actorId: actor.id,
      action: "DELETE",
      entityType: "Student",
      entityId: id,
      metadata: { fullName: existing.fullName },
    });
  },

  /**
   * Parses an uploaded .xlsx buffer and bulk-creates valid rows. Invalid
   * rows are reported back rather than aborting the whole import — a
   * spreadsheet with a few typos shouldn't block the rows that are fine.
   * Expected columns (case-insensitive): Full Name, Sex, Category, Class,
   * Group (optional), Batch (optional — only needed to disambiguate two
   * classes that share a name across different batches).
   */
  async importFromExcel(fileBuffer: Buffer, fileName: string, actor: AuthUser) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      throw new ValidationError("The uploaded file has no sheets");
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (rows.length === 0) {
      throw new ValidationError("The uploaded file has no data rows");
    }

    const scopedClassIds = await resolveScope(actor);
    const classes = await prisma.class.findMany({
      where: scopedClassIds ? { id: { in: scopedClassIds } } : {},
      include: { batch: { select: { name: true } }, groups: true },
    });

    const errors: { row: number; message: string }[] = [];
    const toCreate: {
      fullName: string;
      sex: ReturnType<typeof parseSex>;
      category: ReturnType<typeof parseCategory>;
      classId: string;
      groupId?: string;
    }[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 for header row, +1 for 1-based row numbers
      const fullName = String(row["Full Name"] ?? "").trim();
      const className = String(row["Class"] ?? "").trim();
      const batchName = String(row["Batch"] ?? "").trim();
      const groupName = String(row["Group"] ?? "").trim();

      if (!fullName) {
        errors.push({ row: rowNumber, message: "Full Name is required" });
        return;
      }
      if (!className) {
        errors.push({ row: rowNumber, message: "Class is required" });
        return;
      }

      const sex = parseSex(row["Sex"]);
      if (!sex) {
        errors.push({ row: rowNumber, message: `Invalid Sex value: "${row["Sex"]}"` });
        return;
      }

      const category = parseCategory(row["Category"]);
      if (!category) {
        errors.push({ row: rowNumber, message: `Invalid Category value: "${row["Category"]}"` });
        return;
      }

      const matchingClasses = classes.filter(
        (c) =>
          c.name.toLowerCase() === className.toLowerCase() &&
          (!batchName || c.batch.name.toLowerCase() === batchName.toLowerCase())
      );

      if (matchingClasses.length === 0) {
        errors.push({
          row: rowNumber,
          message: `Class "${className}" not found or not accessible`,
        });
        return;
      }
      if (matchingClasses.length > 1) {
        errors.push({
          row: rowNumber,
          message: `Class "${className}" is ambiguous — add a Batch column to disambiguate`,
        });
        return;
      }

      const resolvedClass = matchingClasses[0];
      let groupId: string | undefined;
      if (groupName) {
        const group = resolvedClass.groups.find(
          (g) => g.name.toLowerCase() === groupName.toLowerCase()
        );
        if (!group) {
          errors.push({
            row: rowNumber,
            message: `Group "${groupName}" not found in class "${className}"`,
          });
          return;
        }
        groupId = group.id;
      }

      toCreate.push({ fullName, sex, category, classId: resolvedClass.id, groupId });
    });

    if (toCreate.length > 0) {
      await studentRepository.createMany(
        toCreate.map((s) => ({
          fullName: s.fullName,
          sex: s.sex!,
          category: s.category!,
          classId: s.classId,
          groupId: s.groupId,
        }))
      );

      await createAuditLog({
        actorId: actor.id,
        action: "IMPORT",
        entityType: "Student",
        metadata: { fileName, importedCount: toCreate.length, errorCount: errors.length },
      });
    }

    return {
      totalRows: rows.length,
      successCount: toCreate.length,
      errorCount: errors.length,
      errors,
    };
  },
};
