import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export interface DashboardData {
  totalStudents: number;
  today: { present: number; late: number; absent: number };
  attendancePercent: number;
  totalChips: number;
  topStudents: { studentId: string; fullName: string; percentage: number; absentCount: number }[];
  topGroups: { groupId: string; name: string; totalChips: number }[];
  warningList: { studentId: string; fullName: string; absentCount: number }[];
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor: { fullName: string };
  }[];
  attendanceChart: { date: string; present: number; late: number; absent: number }[];
  chipsChart: { name: string; totalChips: number }[];
  categoryStats: { category: string; count: number }[];
}

export function useDashboardQuery(batchId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", batchId],
    queryFn: () =>
      apiFetch<{ success: true; data: DashboardData }>(`/dashboard?batchId=${batchId}`).then(
        (r) => r.data
      ),
    enabled: !!batchId,
  });
}
