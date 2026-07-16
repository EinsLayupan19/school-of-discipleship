import { Program, Role } from "@prisma/client";
import { paRepository } from "./pa.repository";
import { createAuditLog } from "../audit/audit.service";
import { prisma } from "../../config/db";
import { getFacilitatorClassIds } from "../../shared/utils/facilitatorScope";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors/AppError";
import type { AuthUser } from "../../shared/types";
import type { CreatePAInput, UpsertPAScoresInput } from "./pa.schema";

/** Program-specific rubric weights (must each sum to 100). */
const PA_RUBRIC_WEIGHTS: Record<
  Program,
  {
    cleanliness: number;
    creativity: number;
    execution: number;
    teamwork: number;
    timeManagement: number;
  }
> = {
  MDC: { cleanliness: 20, creativity: 20, execution: 30, teamwork: 20, timeManagement: 10 },
  CC: { cleanliness: 30, creativity: 20, execution: 30, teamwork: 10, timeManagement: 10 },
};

async function assertClassAccess(classId: string, actor: AuthUser) {
  if (actor.role === Role.SUPER_ADMIN) return;
  const owned = await getFacilitatorClassIds(actor.id);
  if (!owned.includes(classId)) throw new ForbiddenError("You don't have access to this class");
}

function computeTotal(
  program: Program,
  scores: {
    cleanliness: number;
    creativity: number;
    execution: number;
    teamwork: number;
    timeManagement: number;
  }
) {
  const w = PA_RUBRIC_WEIGHTS[program];
  const total =
    (scores.cleanliness * w.cleanliness +
      scores.creativity * w.creativity +
      scores.execution * w.execution +
      scores.teamwork * w.teamwork +
      scores.timeManagement * w.timeManagement) /
    100;
  return Math.round(total * 100) / 100;
}

export const paService = {
  rubricWeights(program: Program) {
    return PA_RUBRIC_WEIGHTS[program];
  },

  async listByClass(classId: string, actor: AuthUser) {
    await assertClassAccess(classId, actor);
    return paRepository.findByClass(classId);
  },

  async getById(id: string, actor: AuthUser) {
    const session = await paRepository.findById(id);
    if (!session) throw new NotFoundError("PA session");
    await assertClassAccess(session.classId, actor);
    return { ...session, rubricWeights: PA_RUBRIC_WEIGHTS[session.class.batch.program] };
  },

  async create(input: CreatePAInput, actor: AuthUser) {
    await assertClassAccess(input.classId, actor);
    const session = await paRepository.create(input.classId, input.sessionDate, input.topic);

    await createAuditLog({
      actorId: actor.id,
      action: "CREATE",
      entityType: "PAActivity",
      entityId: session.id,
      metadata: { classId: input.classId, sessionDate: input.sessionDate },
    });

    return session;
  },

  async upsertScores(id: string, input: UpsertPAScoresInput, actor: AuthUser) {
    const session = await paRepository.findById(id);
    if (!session) throw new NotFoundError("PA session");
    await assertClassAccess(session.classId, actor);
    if (session.isLocked) throw new ForbiddenError("This session is locked.");

    const program = session.class.batch.program;
    const rows = input.scores.map((s) => ({
      ...s,
      totalScore: computeTotal(program, s),
    }));

    await paRepository.upsertScores(id, rows);

    await createAuditLog({
      actorId: actor.id,
      action: "UPDATE",
      entityType: "PAActivity",
      entityId: id,
      metadata: { updatedCount: rows.length },
    });

    return paRepository.findById(id);
  },

  async submit(id: string, actor: AuthUser) {
    const session = await paRepository.findById(id);
    if (!session) throw new NotFoundError("PA session");
    await assertClassAccess(session.classId, actor);
    if (session.isLocked) throw new ValidationError("Already submitted and locked");

    const locked = await paRepository.setLocked(id, true);

    await createAuditLog({
      actorId: actor.id,
      action: "UPDATE",
      entityType: "PAActivity",
      entityId: id,
      metadata: { submitted: true },
    });

    return locked;
  },

  async unlock(id: string, reason: string, actor: AuthUser) {
    const session = await paRepository.findById(id);
    if (!session) throw new NotFoundError("PA session");
    if (!session.isLocked) throw new ValidationError("Not locked");

    const unlocked = await paRepository.setLocked(id, false);

    await prisma.unlockLog.create({
      data: { actorId: actor.id, entityType: "PAActivity", entityId: id, reason },
    });
    await createAuditLog({
      actorId: actor.id,
      action: "UNLOCK",
      entityType: "PAActivity",
      entityId: id,
      metadata: { reason },
    });

    return unlocked;
  },
};
