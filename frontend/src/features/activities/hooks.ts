import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activitiesApi, type CreateActivityPayload, type ListActivitiesParams } from "./api";

const KEY = "activities";

export function useActivitiesQuery(params: ListActivitiesParams) {
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => activitiesApi.list(params).then((r) => r.data),
  });
}

export function useActivityQuery(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => activitiesApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}

export function useCreateActivityMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateActivityPayload) => activitiesApi.create(input),
    onSuccess: inv,
  });
}

export function useUpdateActivityMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateActivityPayload> }) =>
      activitiesApi.update(id, input),
    onSuccess: inv,
  });
}

export function useUpsertScoresMutation(id: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (scores: { studentId: string; score: number }[]) =>
      activitiesApi.upsertScores(id, scores),
    onSuccess: inv,
  });
}

export function useSubmitActivityMutation(id: string) {
  const inv = useInvalidate();
  return useMutation({ mutationFn: () => activitiesApi.submit(id), onSuccess: inv });
}

export function useUnlockActivityMutation(id: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (reason: string) => activitiesApi.unlock(id, reason),
    onSuccess: inv,
  });
}
