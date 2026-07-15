import { apiFetch } from "@/lib/apiClient";
import type {
  AttendanceDashboard,
  AttendanceSessionDetail,
  AttendanceSessionListItem,
  AttendanceStatus,
  AttendanceSummary,
} from "./schemas";

export interface RecordUpdate {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export const attendanceApi = {
  listByClass: (classId: string) =>
    apiFetch<{ success: true; data: AttendanceSessionListItem[] }>(
      `/attendance?classId=${classId}`
    ),

  getById: (id: string) =>
    apiFetch<{ success: true; data: AttendanceSessionDetail }>(`/attendance/${id}`),

  create: (classId: string, sessionDate: string, topic?: string) =>
    apiFetch<{ success: true; data: AttendanceSessionDetail }>("/attendance", {
      method: "POST",
      body: JSON.stringify({ classId, sessionDate, topic }),
    }),

  updateRecords: (id: string, records: RecordUpdate[]) =>
    apiFetch<{ success: true; data: AttendanceSessionDetail }>(`/attendance/${id}/records`, {
      method: "PATCH",
      body: JSON.stringify({ records }),
    }),

  submit: (id: string) =>
    apiFetch<{ success: true; data: AttendanceSessionDetail }>(`/attendance/${id}/submit`, {
      method: "PATCH",
    }),

  unlock: (id: string, reason: string) =>
    apiFetch<{ success: true; data: AttendanceSessionDetail }>(`/attendance/${id}/unlock`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  dashboard: (classId: string) =>
    apiFetch<{ success: true; data: AttendanceDashboard }>(
      `/attendance/dashboard?classId=${classId}`
    ),

  studentSummary: (studentId: string) =>
    apiFetch<{ success: true; data: AttendanceSummary & { dropWarning: boolean } }>(
      `/attendance/student/${studentId}/summary`
    ),
};
