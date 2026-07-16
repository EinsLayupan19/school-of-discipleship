import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { paService } from "./pa.service";
import type { CreatePAInput, ListPAQuery, UnlockPAInput, UpsertPAScoresInput } from "./pa.schema";

export const paController = {
  listByClass: asyncHandler(async (req: Request, res: Response) => {
    const { classId } = req.query as unknown as ListPAQuery;
    const data = await paService.listByClass(classId, req.user!);
    res.status(200).json({ success: true, data });
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await paService.getById(req.params.id, req.user!);
    res.status(200).json({ success: true, data });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await paService.create(req.body as CreatePAInput, req.user!);
    res.status(201).json({ success: true, data });
  }),
  upsertScores: asyncHandler(async (req: Request, res: Response) => {
    const data = await paService.upsertScores(
      req.params.id,
      req.body as UpsertPAScoresInput,
      req.user!
    );
    res.status(200).json({ success: true, data });
  }),
  submit: asyncHandler(async (req: Request, res: Response) => {
    const data = await paService.submit(req.params.id, req.user!);
    res.status(200).json({ success: true, data });
  }),
  unlock: asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body as UnlockPAInput;
    const data = await paService.unlock(req.params.id, reason, req.user!);
    res.status(200).json({ success: true, data });
  }),
};
