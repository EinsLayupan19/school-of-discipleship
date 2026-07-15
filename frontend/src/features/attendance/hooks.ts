import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, type RecordUpdate } from "./api";

const ATTENDANCE_KEY = "attendance";

export function useAttendanceSessionsQuery(classId: string | undefined) {
  return useQuery({
    queryKey: [ATTENDANCE_KEY, "list", classId],
    queryFn: () => attendanceApi.listByClass(classId!).then((r) => r.data),
    enabled: !!classId,
  });
}

export function useAttendanceSessionQuery(id: string | undefined) {
  return useQuery({
    queryKey: [ATTENDANCE_KEY, "detail", id],
    queryFn: () => attendanceApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useAttendanceDashboardQuery(classId: string | undefined) {
  return useQuery({
    queryKey: [ATTENDANCE_KEY, "dashboard", classId],
    queryFn: () => attendanceApi.dashboard(classId!).then((r) => r.data),
    enabled: !!classId,
  });
}

export function useStudentAttendanceSummaryQuery(studentId: string | undefined) {
  return useQuery({
    queryKey: [ATTENDANCE_KEY, "student-summary", studentId],
    queryFn: () => attendanceApi.studentSummary(studentId!).then((r) => r.data),
    enabled: !!studentId,
  });
}

function useInvalidateAttendance() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [ATTENDANCE_KEY] });
}

export function useCreateAttendanceMutation(classId: string | undefined) {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: ({ sessionDate, topic }: { sessionDate: string; topic?: string }) =>
      attendanceApi.create(classId!, sessionDate, topic),
    onSuccess: invalidate,
  });
}

export function useUpdateRecordsMutation(sessionId: string) {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: (records: RecordUpdate[]) => attendanceApi.updateRecords(sessionId, records),
    onSuccess: invalidate,
  });
}

export function useSubmitAttendanceMutation(sessionId: string) {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: () => attendanceApi.submit(sessionId),
    onSuccess: invalidate,
  });
}

export function useUnlockAttendanceMutation(sessionId: string) {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: (reason: string) => attendanceApi.unlock(sessionId, reason),
    onSuccess: invalidate,
  });
}
