import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { weeksApi, type UpdateWeekPayload } from "./api";

const WEEKS_KEY = "weeks";

export function useWeeksQuery(batchId: string | undefined) {
  return useQuery({
    queryKey: [WEEKS_KEY, batchId],
    queryFn: () => weeksApi.listByBatch(batchId!).then((r) => r.data),
    enabled: !!batchId,
  });
}

function useInvalidateWeeks(batchId: string | undefined) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [WEEKS_KEY, batchId] });
}

export function useCreateWeekMutation(batchId: string | undefined) {
  const invalidate = useInvalidateWeeks(batchId);
  return useMutation({
    mutationFn: (label?: string) => weeksApi.create(batchId!, label),
    onSuccess: invalidate,
  });
}

export function useUpdateWeekMutation(batchId: string | undefined) {
  const invalidate = useInvalidateWeeks(batchId);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWeekPayload }) =>
      weeksApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useUnlockWeekMutation(batchId: string | undefined) {
  const invalidate = useInvalidateWeeks(batchId);
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => weeksApi.unlock(id, reason),
    onSuccess: invalidate,
  });
}
