import { supabaseAdmin } from "../../config/supabase";
import { userRepository } from "./user.repository";
import { createAuditLog } from "../audit/audit.service";
import { generateTempPassword } from "../../shared/utils/password";
import { ConflictError, NotFoundError } from "../../shared/errors/AppError";
import type { AuthUser } from "../../shared/types";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "./user.schema";

export const userService = {
  async list(query: ListUsersQuery) {
    const { data, total } = await userRepository.findMany(query);
    return {
      data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  },

  /**
   * Creates a facilitator/admin account. This has to succeed in two
   * systems — Supabase Auth (the actual login) and our own `users` table
   * (the role/profile) — so if the second write fails, the orphaned
   * Supabase Auth account is rolled back rather than left dangling with
   * no matching profile.
   */
  async create(input: CreateUserInput, actor: AuthUser) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }

    const tempPassword = generateTempPassword();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: tempPassword,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new ConflictError(error?.message ?? "Failed to create authentication account");
    }

    try {
      const user = await userRepository.create({
        authId: data.user.id,
        email: input.email,
        fullName: input.fullName,
        role: input.role,
      });

      await createAuditLog({
        actorId: actor.id,
        action: "CREATE",
        entityType: "User",
        entityId: user.id,
        metadata: { email: user.email, role: user.role },
      });

      // The temp password is returned exactly once — it is never stored
      // anywhere, and the caller (controller) must not log it.
      return { user, tempPassword };
    } catch (err) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id).catch(() => undefined);
      throw err;
    }
  },

  async update(id: string, input: UpdateUserInput, actor: AuthUser) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("User");
    }

    const user = await userRepository.update(id, input);

    await createAuditLog({
      actorId: actor.id,
      action: "UPDATE",
      entityType: "User",
      entityId: user.id,
      metadata: {
        before: { fullName: existing.fullName, role: existing.role },
        after: input,
      },
    });

    return user;
  },

  /**
   * Deactivating a user bans them in Supabase Auth too (not just a UI
   * flag) — otherwise a "deactivated" facilitator could still log in.
   */
  async setActive(id: string, isActive: boolean, actor: AuthUser) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("User");
    }

    await supabaseAdmin.auth.admin.updateUserById(existing.authId, {
      ban_duration: isActive ? "none" : "876000h", // ~100 years = effectively permanent
    });

    const user = await userRepository.update(id, { isActive });

    await createAuditLog({
      actorId: actor.id,
      action: isActive ? "REACTIVATE" : "DEACTIVATE",
      entityType: "User",
      entityId: user.id,
    });

    return user;
  },

  /** Sets a new random temp password in Supabase Auth. Returned once for the admin to relay to the user. */
  async resetPassword(id: string, actor: AuthUser) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("User");
    }

    const tempPassword = generateTempPassword();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.authId, {
      password: tempPassword,
    });

    if (error) {
      throw new ConflictError(error.message);
    }

    await createAuditLog({
      actorId: actor.id,
      action: "RESET_PASSWORD",
      entityType: "User",
      entityId: existing.id,
    });

    return { tempPassword };
  },
};
