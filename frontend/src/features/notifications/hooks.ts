import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export interface PersistedNotification {
  id: string;
  type: "UNLOCK" | "ANNOUNCEMENT";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  type: "UPCOMING_SESSION" | "DROP_WARNING" | "PENDING_ACTION";
  title: string;
  message: string;
  createdAt: string;
}

export interface NotificationsResponse {
  persisted: PersistedNotification[];
  reminders: Reminder[];
  unreadCount: number;
}

const notificationsApi = {
  list: () => apiFetch<{ success: true; data: NotificationsResponse }>("/notifications"),
  markRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => apiFetch("/notifications/read-all", { method: "PATCH" }),
};

export function useNotificationsQuery() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list().then((r) => r.data),
    refetchInterval: 60_000,
  });
}

export function useMarkReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
