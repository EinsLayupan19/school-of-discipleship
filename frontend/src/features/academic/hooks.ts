import { useQuery } from "@tanstack/react-query";
import { academicApi, type Program } from "./api";

export function useBatchesQuery(program?: Program) {
  return useQuery({
    queryKey: ["academic", "batches", program],
    queryFn: () => academicApi.listBatches(program).then((r) => r.data),
  });
}

export function useClassesQuery(params: { batchId?: string; program?: Program }) {
  return useQuery({
    queryKey: ["academic", "classes", params],
    queryFn: () => academicApi.listClasses(params).then((r) => r.data),
    enabled: !!params.batchId, // no point listing classes until a batch is chosen
  });
}

export function useGroupsQuery(classId: string | undefined) {
  return useQuery({
    queryKey: ["academic", "groups", classId],
    queryFn: () => academicApi.listGroups(classId!).then((r) => r.data),
    enabled: !!classId,
  });
}
