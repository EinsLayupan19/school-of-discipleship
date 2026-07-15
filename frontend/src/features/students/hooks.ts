import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentsApi, type ListStudentsParams, type StudentPayload } from "./api";

const STUDENTS_KEY = "students";

export function useStudentsQuery(params: ListStudentsParams) {
  return useQuery({
    queryKey: [STUDENTS_KEY, params],
    queryFn: () => studentsApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useStudentQuery(id: string | undefined) {
  return useQuery({
    queryKey: [STUDENTS_KEY, "detail", id],
    queryFn: () => studentsApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });
}

function useInvalidateStudents() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [STUDENTS_KEY] });
}

export function useCreateStudentMutation() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: (input: StudentPayload) => studentsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateStudentMutation() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<StudentPayload> }) =>
      studentsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useArchiveStudentMutation() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: (id: string) => studentsApi.archive(id),
    onSuccess: invalidate,
  });
}

export function useUnarchiveStudentMutation() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: (id: string) => studentsApi.unarchive(id),
    onSuccess: invalidate,
  });
}

export function useDeleteStudentMutation() {
  const invalidate = useInvalidateStudents();
  return useMutation({ mutationFn: (id: string) => studentsApi.remove(id), onSuccess: invalidate });
}

export function useImportStudentsMutation() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: (file: File) => studentsApi.import(file),
    onSuccess: invalidate,
  });
}
