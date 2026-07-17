import { NotificationType } from "@prisma/client";
import { prisma } from "../../config/db";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({ data: params });
}

/** Notifies a class's facilitator, skipping if the actor IS that facilitator (no self-notify). */
export async function notifyClassFacilitator(
  classId: string,
  actorId: string,
  payload: Omit<CreateNotificationParams, "userId">
) {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { facilitatorId: true },
  });
  if (!cls || cls.facilitatorId === actorId) return;
  await createNotification({ ...payload, userId: cls.facilitatorId });
}

/** Notifies every distinct facilitator who runs a class within a batch (Week is batch-scoped, not class-scoped). */
export async function notifyBatchFacilitators(
  batchId: string,
  actorId: string,
  payload: Omit<CreateNotificationParams, "userId">
) {
  const classes = await prisma.class.findMany({
    where: { batchId },
    select: { facilitatorId: true },
    distinct: ["facilitatorId"],
  });
  const recipientIds = classes.map((c) => c.facilitatorId).filter((id) => id !== actorId);
  await Promise.all(recipientIds.map((userId) => createNotification({ ...payload, userId })));
}
