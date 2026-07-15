import { apiFetch, apiFetchFormData } from "@/lib/apiClient";
import type { PaginationMeta } from "@/features/users/schemas";
import type { StudentRecord, Sex, StudentCategory } from "./schemas";

export interface ListStudentsParams {
  search?: string;
  batchId?: string;
  classId?: string;
  groupId?: string;
  category?: StudentCategory | "all";
  sex?: Sex | "all";
  status?: "active" | "archived" | "all";
  page?: number;
  pageSize?: number;
}

export interface StudentPayload {
  fullName: string;
  classId: string;
  groupId?: string | null;
  sex: Sex;
  category: StudentCategory;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
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

export const studentsApi = {
  list: (params: ListStudentsParams) =>
    apiFetch<{ success: true; data: StudentRecord[]; meta: PaginationMeta }>(
      `/students${buildQuery(params as unknown as Record<string, string | number | undefined>)}`
    ),

  getById: (id: string) => apiFetch<{ success: true; data: StudentRecord }>(`/students/${id}`),

  create: (input: StudentPayload) =>
    apiFetch<{ success: true; data: StudentRecord }>("/students", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: Partial<StudentPayload>) =>
    apiFetch<{ success: true; data: StudentRecord }>(`/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  archive: (id: string) =>
    apiFetch<{ success: true; data: StudentRecord }>(`/students/${id}/archive`, {
      method: "PATCH",
    }),

  unarchive: (id: string) =>
    apiFetch<{ success: true; data: StudentRecord }>(`/students/${id}/unarchive`, {
      method: "PATCH",
    }),

  remove: (id: string) => apiFetch<void>(`/students/${id}`, { method: "DELETE" }),

  import: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetchFormData<{ success: true } & ImportResult>("/students/import", formData);
  },
};
