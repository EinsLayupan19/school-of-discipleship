import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paApi, type ScoreUpdate } from "./api";

const KEY = "pa";

export function usePASessionsQuery(classId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "list", classId],
    queryFn: () => paApi.listByClass(classId!).then((r) => r.data),
    enabled: !!classId,
  });
}

export function usePASessionQuery(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => paApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}

export function useCreatePAMutation(classId: string | undefined) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ sessionDate, topic }: { sessionDate: string; topic?: string }) =>
      paApi.create(classId!, sessionDate, topic),
    onSuccess: inv,
  });
}

export function useUpsertPAScoresMutation(id: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (scores: ScoreUpdate[]) => paApi.upsertScores(id, scores),
    onSuccess: inv,
  });
}

export function useSubmitPAMutation(id: string) {
  const inv = useInvalidate();
  return useMutation({ mutationFn: () => paApi.submit(id), onSuccess: inv });
}

export function useUnlockPAMutation(id: string) {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (reason: string) => paApi.unlock(id, reason), onSuccess: inv });
}
