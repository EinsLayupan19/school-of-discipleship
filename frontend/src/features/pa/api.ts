import { apiFetch } from "@/lib/apiClient";
import type { PASessionDetail, PASessionListItem, RubricWeights } from "./schemas";

export interface ScoreUpdate extends RubricWeights {
  groupId: string;
}

export const paApi = {
  listByClass: (classId: string) =>
    apiFetch<{ success: true; data: PASessionListItem[] }>(`/pa?classId=${classId}`),
  getById: (id: string) => apiFetch<{ success: true; data: PASessionDetail }>(`/pa/${id}`),
  create: (classId: string, sessionDate: string, topic?: string) =>
    apiFetch<{ success: true; data: PASessionDetail }>("/pa", {
      method: "POST",
      body: JSON.stringify({ classId, sessionDate, topic }),
    }),
  upsertScores: (id: string, scores: ScoreUpdate[]) =>
    apiFetch<{ success: true; data: PASessionDetail }>(`/pa/${id}/scores`, {
      method: "PATCH",
      body: JSON.stringify({ scores }),
    }),
  submit: (id: string) =>
    apiFetch<{ success: true; data: PASessionDetail }>(`/pa/${id}/submit`, { method: "PATCH" }),
  unlock: (id: string, reason: string) =>
    apiFetch<{ success: true; data: PASessionDetail }>(`/pa/${id}/unlock`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),
};
