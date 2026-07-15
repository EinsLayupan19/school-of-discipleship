import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { PaginationMeta } from "@/features/users/schemas";

export interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { fullName: string; email: string };
}

interface ListAuditLogsParams {
  entityType?: string;
  page: number;
  pageSize: number;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function useAuditLogsQuery(params: ListAuditLogsParams) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () =>
      apiFetch<{ success: true; data: AuditLogRecord[]; meta: PaginationMeta }>(
        `/audit-logs${buildQuery(params as unknown as Record<string, string | number | undefined>)}`
      ),
    placeholderData: (prev) => prev,
  });
}
