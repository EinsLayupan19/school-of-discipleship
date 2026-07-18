import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export interface ChipRecord {
  id: string;
  groupId: string;
  amount: number;
  reason: string | null;
  createdAt: string;
  group: { name: string };
}

const chipsApi = {
  listByClass: (classId: string) =>
    apiFetch<{ success: true; data: ChipRecord[] }>(`/chips?classId=${classId}`),
  create: (groupId: string, amount: number, reason?: string) =>
    apiFetch<{ success: true; data: ChipRecord }>("/chips", {
      method: "POST",
      body: JSON.stringify({ groupId, amount, reason }),
    }),
};

export function useChipsQuery(classId: string | undefined) {
  return useQuery({
    queryKey: ["chips", classId],
    queryFn: () => chipsApi.listByClass(classId!).then((r) => r.data),
    enabled: !!classId,
  });
}

export function useCreateChipMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      amount,
      reason,
    }: {
      groupId: string;
      amount: number;
      reason?: string;
    }) => chipsApi.create(groupId, amount, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chips"] }),
  });
}
