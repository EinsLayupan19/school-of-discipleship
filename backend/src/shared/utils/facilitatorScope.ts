import { prisma } from "../../config/db";

/** Returns the IDs of every class a given facilitator is assigned to run. */
export async function getFacilitatorClassIds(facilitatorId: string): Promise<string[]> {
  const classes = await prisma.class.findMany({
    where: { facilitatorId },
    select: { id: true },
  });
  return classes.map((c) => c.id);
}

/**
 * Returns the IDs of every batch that contains at least one class the
 * facilitator runs. Week is scoped at the Batch level (not per-class), so
 * a facilitator gets access to a batch's weekly tracker as soon as they
 * facilitate any one class within it.
 */
export async function getFacilitatorBatchIds(facilitatorId: string): Promise<string[]> {
  const classes = await prisma.class.findMany({
    where: { facilitatorId },
    select: { batchId: true },
    distinct: ["batchId"],
  });
  return classes.map((c) => c.batchId);
}
