import { Role } from "@prisma/client";
import { activityRepository } from "./activity.repository";
import { createAuditLog } from "../audit/audit.service";
import { prisma } from "../../config/db";
import { getFacilitatorClassIds } from "../../shared/utils/facilitatorScope";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors/AppError";
import type { AuthUser } from "../../shared/types";
import type {
  CreateActivityInput,
  ListActivitiesQuery,
  UpdateActivityInput,
  UpsertScoresInput,
} from "./activity.schema";

async function assertClassAccess(classId: string, actor: AuthUser) {
  if (actor.role === Role.SUPER_ADMIN) return;
  const owned = await getFacilitatorClassIds(actor.id);
  if (!owned.includes(classId)) throw new ForbiddenError("You don't have access to this class");
}

function pct(score: number, max: number) {
  return max > 0 ? Math.round((score / max) * 10000) / 100 : 0;
}

export const activityService = {
  async list(query: ListActivitiesQuery, actor: AuthUser) {
    await assertClassAccess(query.classId, actor);
    const activities = await activityRepository.findByClass(
      query.classId,
      query.type,
      query.search
    );
    return activities.map((a) => {
      const scores = a.scores.map((s) => Number(s.score));
      const average = scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : 0;
      return {
        ...a,
        scoreCount: a.scores.length,
        averageScore: Math.round(average * 100) / 100,
        averagePercent: pct(average, Number(a.maxScore)),
      };
    });
  },

  async getById(id: string, actor: AuthUser) {
    const activity = await activityRepository.findById(id);
    if (!activity) throw new NotFoundError("Activity");
    await assertClassAccess(activity.classId, actor);

    const max = Number(activity.maxScore);
    const ranked = [...activity.scores]
      .sort((a, b) => Number(b.score) - Number(a.score))
      .map((s, i) => ({
        studentId: s.studentId,
        fullName: s.student.fullName,
        score: Number(s.score),
        percent: pct(Number(s.score), max),
        isPerfect: Number(s.score) === max,
        rank: i + 1,
      }));

    return { ...activity, ranked };
  },

  async create(input: CreateActivityInput, actor: AuthUser) {
    await assertClassAccess(input.classId, actor);
    const activity = await activityRepository.create({
      title: input.title,
      type: input.type,
      maxScore: input.maxScore,
      class: { connect: { id: input.classId } },
    });

    await createAuditLog({
      actorId: actor.id,
      action: "CREATE",
      entityType: "Activity",
      entityId: activity.id,
      metadata: { classId: input.classId, title: input.title, type: input.type },
    });

    return activity;
  },

  async update(id: string, input: UpdateActivityInput, actor: AuthUser) {
    const existing = await activityRepository.findById(id);
    if (!existing) throw new NotFoundError("Activity");
    await assertClassAccess(existing.classId, actor);
    if (existing.isLocked) throw new ForbiddenError("This activity is locked.");

    const activity = await activityRepository.update(id, input);

    await createAuditLog({
      actorId: actor.id,
      action: "UPDATE",
      entityType: "Activity",
      entityId: id,
      metadata: { before: { title: existing.title, maxScore: existing.maxScore }, after: input },
    });

    return activity;
  },

  async upsertScores(id: string, input: UpsertScoresInput, actor: AuthUser) {
    const existing = await activityRepository.findById(id);
    if (!existing) throw new NotFoundError("Activity");
    await assertClassAccess(existing.classId, actor);
    if (existing.isLocked) throw new ForbiddenError("This activity is locked.");

    const max = Number(existing.maxScore);
    for (const s of input.scores) {
      if (s.score > max) throw new ValidationError(`Score cannot exceed max score (${max})`);
    }

    await activityRepository.upsertScores(id, input.scores);

    await createAuditLog({
      actorId: actor.id,
      action: "UPDATE",
      entityType: "Activity",
      entityId: id,
      metadata: { scoredCount: input.scores.length },
    });

    return activityRepository.findById(id);
  },

  async submit(id: string, actor: AuthUser) {
    const existing = await activityRepository.findById(id);
    if (!existing) throw new NotFoundError("Activity");
    await assertClassAccess(existing.classId, actor);
    if (existing.isLocked) throw new ValidationError("Already submitted and locked");

    const activity = await activityRepository.setLocked(id, true);

    await createAuditLog({
      actorId: actor.id,
      action: "UPDATE",
      entityType: "Activity",
      entityId: id,
      metadata: { submitted: true },
    });

    return activity;
  },

  async unlock(id: string, reason: string, actor: AuthUser) {
    const existing = await activityRepository.findById(id);
    if (!existing) throw new NotFoundError("Activity");
    if (!existing.isLocked) throw new ValidationError("Not locked");

    const activity = await activityRepository.setLocked(id, false);

    await prisma.unlockLog.create({
      data: { actorId: actor.id, entityType: "Activity", entityId: id, reason },
    });
    await createAuditLog({
      actorId: actor.id,
      action: "UNLOCK",
      entityType: "Activity",
      entityId: id,
      metadata: { reason },
    });

    return activity;
  },
};
