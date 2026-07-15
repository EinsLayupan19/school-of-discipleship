import { apiFetch } from "@/lib/apiClient";
import type { ActivityDetail, ActivityListItem, ActivityType } from "./schemas";

export interface ListActivitiesParams {
  classId: string;
  type?: ActivityType | "all";
  search?: string;
}

export interface CreateActivityPayload {
  classId: string;
  title: string;
  type: ActivityType;
  maxScore: number;
}

function qs(params: Record<string, string | undefined>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v && v !== "all") s.set(k, v);
  const q = s.toString();
  return q ? `?${q}` : "";
}

export const activitiesApi = {
  list: (params: ListActivitiesParams) =>
    apiFetch<{ success: true; data: ActivityListItem[] }>(
      `/activities${qs(params as unknown as Record<string, string | undefined>)}`
    ),
  getById: (id: string) => apiFetch<{ success: true; data: ActivityDetail }>(`/activities/${id}`),
  create: (input: CreateActivityPayload) =>
    apiFetch<{ success: true; data: ActivityListItem }>("/activities", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: Partial<CreateActivityPayload>) =>
    apiFetch<{ success: true; data: ActivityListItem }>(`/activities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  upsertScores: (id: string, scores: { studentId: string; score: number }[]) =>
    apiFetch<{ success: true; data: ActivityDetail }>(`/activities/${id}/scores`, {
      method: "PATCH",
      body: JSON.stringify({ scores }),
    }),
  submit: (id: string) =>
    apiFetch<{ success: true; data: ActivityDetail }>(`/activities/${id}/submit`, {
      method: "PATCH",
    }),
  unlock: (id: string, reason: string) =>
    apiFetch<{ success: true; data: ActivityDetail }>(`/activities/${id}/unlock`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),
};
