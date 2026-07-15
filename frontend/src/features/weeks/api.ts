import { apiFetch } from "@/lib/apiClient";
import type { WeekRecord, WeekStatus } from "./schemas";

export interface UpdateWeekPayload {
  label?: string;
  attendanceDone?: boolean;
  quizDone?: boolean;
  assignmentDone?: boolean;
  recitationDone?: boolean;
  performanceDone?: boolean;
  paDone?: boolean;
  groupChipsDone?: boolean;
  notes?: string;
  status?: WeekStatus;
}

export const weeksApi = {
  listByBatch: (batchId: string) =>
    apiFetch<{ success: true; data: WeekRecord[] }>(`/weeks?batchId=${batchId}`),

  create: (batchId: string, label?: string) =>
    apiFetch<{ success: true; data: WeekRecord }>("/weeks", {
      method: "POST",
      body: JSON.stringify({ batchId, label }),
    }),

  update: (id: string, input: UpdateWeekPayload) =>
    apiFetch<{ success: true; data: WeekRecord }>(`/weeks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  unlock: (id: string, reason: string) =>
    apiFetch<{ success: true; data: WeekRecord }>(`/weeks/${id}/unlock`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),
};
