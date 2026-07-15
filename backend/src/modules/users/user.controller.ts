import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { userService } from "./user.service";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "./user.schema";

export const userController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListUsersQuery;
    const result = await userService.list(query);
    res.status(200).json({ success: true, ...result });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateUserInput;
    const { user, tempPassword } = await userService.create(body, req.user!);
    res.status(201).json({ success: true, data: user, tempPassword });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateUserInput;
    const user = await userService.update(req.params.id, body, req.user!);
    res.status(200).json({ success: true, data: user });
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.setActive(req.params.id, false, req.user!);
    res.status(200).json({ success: true, data: user });
  }),

  reactivate: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.setActive(req.params.id, true, req.user!);
    res.status(200).json({ success: true, data: user });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.resetPassword(req.params.id, req.user!);
    res.status(200).json({ success: true, ...result });
  }),
};
