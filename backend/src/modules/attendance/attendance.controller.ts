import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { attendanceService } from "./attendance.service";
import type {
  CreateAttendanceInput,
  ListAttendanceQuery,
  UnlockAttendanceInput,
  UpdateRecordsInput,
} from "./attendance.schema";

export const attendanceController = {
  listByClass: asyncHandler(async (req: Request, res: Response) => {
    const { classId } = req.query as unknown as ListAttendanceQuery;
    const sessions = await attendanceService.listByClass(classId, req.user!);
    res.status(200).json({ success: true, data: sessions });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const session = await attendanceService.getById(req.params.id, req.user!);
    res.status(200).json({ success: true, data: session });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateAttendanceInput;
    const session = await attendanceService.create(body, req.user!);
    res.status(201).json({ success: true, data: session });
  }),

  updateRecords: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateRecordsInput;
    const session = await attendanceService.updateRecords(req.params.id, body, req.user!);
    res.status(200).json({ success: true, data: session });
  }),

  submit: asyncHandler(async (req: Request, res: Response) => {
    const session = await attendanceService.submit(req.params.id, req.user!);
    res.status(200).json({ success: true, data: session });
  }),

  unlock: asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body as UnlockAttendanceInput;
    const session = await attendanceService.unlock(req.params.id, reason, req.user!);
    res.status(200).json({ success: true, data: session });
  }),

  classDashboard: asyncHandler(async (req: Request, res: Response) => {
    const { classId } = req.query as unknown as ListAttendanceQuery;
    const dashboard = await attendanceService.classDashboard(classId, req.user!);
    res.status(200).json({ success: true, data: dashboard });
  }),

  studentSummary: asyncHandler(async (req: Request, res: Response) => {
    const summary = await attendanceService.studentSummary(req.params.studentId, req.user!);
    res.status(200).json({ success: true, data: summary });
  }),
};
