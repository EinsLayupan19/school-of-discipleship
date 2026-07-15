import { apiFetch } from "@/lib/apiClient";

export type Program = "MDC" | "CC";

export interface BatchRecord {
  id: string;
  name: string;
  program: Program;
}

export interface ClassRecord {
  id: string;
  name: string;
  batchId: string;
  batch: { name: string; program: Program };
}

export interface GroupRecord {
  id: string;
  name: string;
  classId: string;
}

export const academicApi = {
  listBatches: (program?: Program) =>
    apiFetch<{ success: true; data: BatchRecord[] }>(
      `/academic/batches${program ? `?program=${program}` : ""}`
    ),

  listClasses: (params: { batchId?: string; program?: Program }) => {
    const qs = new URLSearchParams();
    if (params.batchId) qs.set("batchId", params.batchId);
    if (params.program) qs.set("program", params.program);
    const query = qs.toString();
    return apiFetch<{ success: true; data: ClassRecord[] }>(
      `/academic/classes${query ? `?${query}` : ""}`
    );
  },

  listGroups: (classId: string) =>
    apiFetch<{ success: true; data: GroupRecord[] }>(`/academic/groups?classId=${classId}`),
};
