import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../config/db";

interface CreateAuditLogParams {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  /** Arbitrary context — e.g. a before/after diff. Kept loose on purpose (see schema comment on AuditLog). */
  metadata?: Prisma.InputJsonValue;
}

/**
 * Writes one row to audit_logs. This is the single place every module
 * should go through to satisfy the "every important action must be
 * logged" requirement — never write to AuditLog directly elsewhere.
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  return prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    },
  });
}
