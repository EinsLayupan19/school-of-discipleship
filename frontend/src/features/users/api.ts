import { apiFetch } from "@/lib/apiClient";
import type { Role } from "@/features/auth/AuthContext";
import type { CreateUserValues, UpdateUserValues } from "./schemas";
import type { PaginationMeta, UserRecord } from "./schemas";

export interface ListUsersParams {
  search?: string;
  role?: Role | "all";
  status?: "active" | "inactive" | "all";
  page?: number;
  pageSize?: number;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const usersApi = {
  list: (params: ListUsersParams) =>
    apiFetch<{ success: true; data: UserRecord[]; meta: PaginationMeta }>(
      `/users${buildQuery(params as Record<string, string | number | undefined>)}`
    ),

  create: (input: CreateUserValues) =>
    apiFetch<{ success: true; data: UserRecord; tempPassword: string }>("/users", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: UpdateUserValues) =>
    apiFetch<{ success: true; data: UserRecord }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deactivate: (id: string) =>
    apiFetch<{ success: true; data: UserRecord }>(`/users/${id}/deactivate`, { method: "PATCH" }),

  reactivate: (id: string) =>
    apiFetch<{ success: true; data: UserRecord }>(`/users/${id}/reactivate`, { method: "PATCH" }),

  resetPassword: (id: string) =>
    apiFetch<{ success: true; tempPassword: string }>(`/users/${id}/reset-password`, {
      method: "POST",
    }),
};
