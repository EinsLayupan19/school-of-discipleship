import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { ValidationError } from "../../shared/errors/AppError";
import { studentService } from "./student.service";
import type { CreateStudentInput, ListStudentsQuery, UpdateStudentInput } from "./student.schema";

export const studentController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListStudentsQuery;
    const result = await studentService.list(query, req.user!);
    res.status(200).json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const student = await studentService.getById(req.params.id, req.user!);
    res.status(200).json({ success: true, data: student });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateStudentInput;
    const student = await studentService.create(body, req.user!);
    res.status(201).json({ success: true, data: student });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateStudentInput;
    const student = await studentService.update(req.params.id, body, req.user!);
    res.status(200).json({ success: true, data: student });
  }),

  archive: asyncHandler(async (req: Request, res: Response) => {
    const student = await studentService.setArchived(req.params.id, true, req.user!);
    res.status(200).json({ success: true, data: student });
  }),

  unarchive: asyncHandler(async (req: Request, res: Response) => {
    const student = await studentService.setArchived(req.params.id, false, req.user!);
    res.status(200).json({ success: true, data: student });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await studentService.remove(req.params.id, req.user!);
    res.status(204).send();
  }),

  import: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError("No file uploaded");
    }
    const result = await studentService.importFromExcel(
      req.file.buffer,
      req.file.originalname,
      req.user!
    );
    res.status(200).json({ success: true, ...result });
  }),
};
