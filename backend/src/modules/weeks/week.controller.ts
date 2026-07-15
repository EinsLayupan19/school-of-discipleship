import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { weekService } from "./week.service";
import type {
  CreateWeekInput,
  ListWeeksQuery,
  UnlockWeekInput,
  UpdateWeekInput,
} from "./week.schema";

export const weekController = {
  listByBatch: asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.query as unknown as ListWeeksQuery;
    const weeks = await weekService.listByBatch(batchId, req.user!);
    res.status(200).json({ success: true, data: weeks });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateWeekInput;
    const week = await weekService.create(body, req.user!);
    res.status(201).json({ success: true, data: week });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateWeekInput;
    const week = await weekService.update(req.params.id, body, req.user!);
    res.status(200).json({ success: true, data: week });
  }),

  unlock: asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body as UnlockWeekInput;
    const week = await weekService.unlock(req.params.id, reason, req.user!);
    res.status(200).json({ success: true, data: week });
  }),
};
