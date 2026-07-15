import { Role, WeekStatus } from "@prisma/client";
import { weekRepository } from "./week.repository";
import { createAuditLog } from "../audit/audit.service";
import { prisma } from "../../config/db";
import { getFacilitatorBatchIds } from "../../shared/utils/facilitatorScope";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors/AppError";
import type { AuthUser } from "../../shared/types";
import type { CreateWeekInput, UpdateWeekInput } from "./week.schema";

/** The 7 checklist items requested for Week Manager; progress is these / 7. */
const CHECKLIST_FIELDS = [
  "attendanceDone",
  "quizDone",
  "assignmentDone",
  "recitationDone",
  "performanceDone",
  "paDone",
  "groupChipsDone",
] as const;

function withProgress<T extends Record<(typeof CHECKLIST_FIELDS)[number], boolean>>(week: T) {
  const done = CHECKLIST_FIELDS.filter((field) => week[field]).length;
  return { ...week, progressPercent: Math.round((done / CHECKLIST_FIELDS.length) * 100) };
}

/**
 * Week is scoped at the Batch level. A facilitator gets access to a
 * batch's weekly tracker as soon as they facilitate any one class within
 * it — see getFacilitatorBatchIds for the reasoning.
 */
async function assertBatchAccess(batchId: string, actor: AuthUser) {
  if (actor.role === Role.SUPER_ADMIN) return;
  const ownedBatchIds = await getFacilitatorBatchIds(actor.id);
  if (!ownedBatchIds.includes(batchId)) {
    throw new ForbiddenError("You don't have access to this batch");
  }
}

export const weekService = {
  async listByBatch(batchId: string, actor: AuthUser) {
    await assertBatchAccess(batchId, actor);
    const weeks = await weekRepository.findByBatch(batchId);
    return weeks.map(withProgress);
  },

  async create(input: CreateWeekInput, actor: AuthUser) {
    await assertBatchAccess(input.batchId, actor);
    const weekNumber = await weekRepository.nextWeekNumber(input.batchId);

    const week = await weekRepository.create({
      weekNumber,
      label: input.label,
      batch: { connect: { id: input.batchId } },
    });

    await createAuditLog({
      actorId: actor.id,
      action: "CREATE",
      entityType: "Week",
      entityId: week.id,
      metadata: { batchId: input.batchId, weekNumber },
    });

    return withProgress(week);
  },

  async update(id: string, input: UpdateWeekInput, actor: AuthUser) {
    const existing = await weekRepository.findById(id);
    if (!existing) throw new NotFoundError("Week");
    await assertBatchAccess(existing.batchId, actor);

    if (existing.isLocked) {
      throw new ForbiddenError(
        "This week is locked. Ask a Super Admin to unlock it before editing."
      );
    }

    const becomingCompleted = input.status === WeekStatus.COMPLETED;
    const leavingCompleted =
      input.status !== undefined &&
      input.status !== WeekStatus.COMPLETED &&
      existing.status === WeekStatus.COMPLETED;

    const week = await weekRepository.update(id, {
      ...input,
      ...(becomingCompleted
        ? { isLocked: true, completedBy: { connect: { id: actor.id } }, completedAt: new Date() }
        : {}),
      ...(leavingCompleted ? { completedBy: { disconnect: true }, completedAt: null } : {}),
    });

    await createAuditLog({
      actorId: actor.id,
      action: "UPDATE",
      entityType: "Week",
      entityId: week.id,
      metadata: {
        before: { status: existing.status, notes: existing.notes },
        after: input,
      },
    });

    return withProgress(week);
  },

  /** Super Admin only — enforced at the route level. */
  async unlock(id: string, reason: string, actor: AuthUser) {
    const existing = await weekRepository.findById(id);
    if (!existing) throw new NotFoundError("Week");
    if (!existing.isLocked) {
      throw new ValidationError("This week isn't locked");
    }

    const week = await weekRepository.update(id, { isLocked: false });

    // Dedicated unlock record (per Phase 2's UnlockLog design — carries a
    // required reason, distinct from the generic AuditLog entry below).
    await prisma.unlockLog.create({
      data: { actorId: actor.id, entityType: "Week", entityId: id, reason },
    });

    await createAuditLog({
      actorId: actor.id,
      action: "UNLOCK",
      entityType: "Week",
      entityId: id,
      metadata: { reason },
    });

    return withProgress(week);
  },
};
