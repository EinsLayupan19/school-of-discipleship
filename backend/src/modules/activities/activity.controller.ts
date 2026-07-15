import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { activityService } from "./activity.service";
import type {
  CreateActivityInput,
  ListActivitiesQuery,
  UnlockActivityInput,
  UpdateActivityInput,
  UpsertScoresInput,
} from "./activity.schema";

export const activityController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListActivitiesQuery;
    const data = await activityService.list(query, req.user!);
    res.status(200).json({ success: true, data });
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await activityService.getById(req.params.id, req.user!);
    res.status(200).json({ success: true, data });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await activityService.create(req.body as CreateActivityInput, req.user!);
    res.status(201).json({ success: true, data });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await activityService.update(
      req.params.id,
      req.body as UpdateActivityInput,
      req.user!
    );
    res.status(200).json({ success: true, data });
  }),
  upsertScores: asyncHandler(async (req: Request, res: Response) => {
    const data = await activityService.upsertScores(
      req.params.id,
      req.body as UpsertScoresInput,
      req.user!
    );
    res.status(200).json({ success: true, data });
  }),
  submit: asyncHandler(async (req: Request, res: Response) => {
    const data = await activityService.submit(req.params.id, req.user!);
    res.status(200).json({ success: true, data });
  }),
  unlock: asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body as UnlockActivityInput;
    const data = await activityService.unlock(req.params.id, reason, req.user!);
    res.status(200).json({ success: true, data });
  }),
};
