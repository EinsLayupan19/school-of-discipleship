import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: { fullName: string; role: string };
}

const announcementsApi = {
  list: () => apiFetch<{ success: true; data: Announcement[] }>("/announcements"),
  create: (title: string, body: string) =>
    apiFetch<{ success: true; data: Announcement }>("/announcements", {
      method: "POST",
      body: JSON.stringify({ title, body }),
    }),
};

export function useAnnouncementsQuery() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementsApi.list().then((r) => r.data),
  });
}

export function useCreateAnnouncementMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, body }: { title: string; body: string }) =>
      announcementsApi.create(title, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}
